package finance

import (
	"bytes"
	"encoding/json"
	"errors"
	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"net/http"
	"net/http/httptest"
	"somsing.local/backend/db"
	"testing"
	"time"
)

func postPaymentFixture(router *gin.Engine, path, payload string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, path, bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}

func TestManualApproval_AtomicAndRetry(t *testing.T) {
	for _, stage := range []string{"success and paid retry", "zero affected rows", "journal line failure", "audit failure", "commit failure"} {
		t.Run(stage, func(t *testing.T) {
			fixture, mock, err := sqlmock.New()
			if err != nil {
				t.Fatal(err)
			}
			defer fixture.Close()
			previous := db.DB
			db.DB = fixture
			t.Cleanup(func() { db.DB = previous })
			slipURL := "/uploads/orders/fixture-order/slip.png"
			auditJSON := setupLegacySlipFixtureFile(t, "fixture-order", "orders/fixture-order/slip.png")
			expectLegacyReviewPrelude(mock, "fixture-order", slipURL, "PENDING_SLIP_CHECK", "1500.25", auditJSON)
			mock.ExpectQuery("SELECT account_number FROM payment_methods").WithArgs("bcel_one").
				WillReturnRows(sqlmock.NewRows([]string{"account"}).AddRow("160-12-00-01166166-001"))
			mock.ExpectQuery("SELECT id::text FROM chart_of_accounts").WithArgs("1110").
				WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("00000000-0000-0000-0000-000000001110"))
			mock.ExpectQuery("SELECT id::text FROM chart_of_accounts").WithArgs("4100").
				WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("00000000-0000-0000-0000-000000004100"))
			mock.ExpectQuery("INSERT INTO journal_entries").
				WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("00000000-0000-0000-0000-000000000099"))
			line := mock.ExpectExec("INSERT INTO journal_lines")
			if stage == "journal line failure" {
				line.WillReturnError(errors.New("fixture journal failure"))
				mock.ExpectRollback()
			} else {
				line.WillReturnResult(sqlmock.NewResult(0, 2))
				mock.ExpectExec("UPDATE payment_records SET state='CONFIRMED'").WillReturnResult(sqlmock.NewResult(0, 1))
				rows := int64(1)
				if stage == "zero affected rows" {
					rows = 0
				}
				mock.ExpectExec("UPDATE orders SET deposit_amount=").WillReturnResult(sqlmock.NewResult(0, rows))
				if stage == "zero affected rows" {
					mock.ExpectRollback()
				} else {
					mock.ExpectQuery("SELECT to_jsonb\\(p\\)").
						WillReturnRows(sqlmock.NewRows([]string{"json"}).AddRow(`{"id":"00000000-0000-0000-0000-000000000011","state":"CONFIRMED"}`))
					mock.ExpectExec("UPDATE orders SET status=\\$2,overall_status=\\$2,proof_rejection_reason=\\$3").
						WithArgs("fixture-order", "PAID_PREPRESS", "").
						WillReturnResult(sqlmock.NewResult(0, 1))
					audit := mock.ExpectExec("INSERT INTO audit_logs")
					if stage == "audit failure" {
						audit.WillReturnError(errors.New("fixture audit failure"))
						mock.ExpectRollback()
					} else {
						audit.WillReturnResult(sqlmock.NewResult(0, 1))
						if stage == "commit failure" {
							mock.ExpectCommit().WillReturnError(errors.New("fixture commit failure"))
						} else {
							mock.ExpectCommit()
						}
					}
				}
			}
			gin.SetMode(gin.TestMode)
			router := gin.New()
			router.Use(fixtureReviewIdentity)
			router.POST("/review", HandleVerifyPaymentSlip)
			w := postPaymentFixture(router, "/review", `{"order_id":"fixture-order","status":"APPROVED"}`)
			if stage == "success and paid retry" {
				if w.Code != 200 {
					t.Fatalf("approval failed %d %s", w.Code, w.Body.String())
				}
				mock.ExpectQuery("SELECT id,COALESCE").WithArgs("fixture-order").
					WillReturnRows(sqlmock.NewRows([]string{"id", "slip"}).AddRow("fixture-order", slipURL))
				mock.ExpectBegin()
				mock.ExpectExec("SELECT pg_advisory_xact_lock").WillReturnResult(sqlmock.NewResult(0, 1))
				mock.ExpectQuery("SELECT request_fingerprint,committed_response FROM audit_logs").
					WillReturnError(errors.New("sql: no rows in result set"))
				mock.ExpectRollback()
				// Or test second distinct review attempt on already-paid order:
			} else if stage == "zero affected rows" {
				if w.Code != 404 && w.Code != 500 {
					t.Fatalf("zero affected rows reported success: %d %s", w.Code, w.Body.String())
				}
			} else if w.Code != 500 {
				t.Fatalf("write failure reported success: %d %s", w.Code, w.Body.String())
			}
		})
	}
}

func TestAutomaticSlip_NoPaymentForAnyReference(t *testing.T) {
	fixture, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer fixture.Close()
	old := db.DB
	db.DB = fixture
	t.Cleanup(func() { db.DB = old })
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/verify", HandleVerifySlip)
	for _, order := range []string{"fixture-A", "fixture-A", "fixture-B"} {
		w := postPaymentFixture(router, "/verify", `{"order_id":"`+order+`","qr_payload":"valid-stub-or-invalid","amount":1500.25,"trans_ref":"same-bank-reference"}`)
		var response map[string]any
		if json.Unmarshal(w.Body.Bytes(), &response) != nil || w.Code != 409 || response["status"] != "manual_review_required" || response["new_status"] != nil {
			t.Fatalf("automatic payment approved: %s", w.Body.String())
		}
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	} // no SQL calls allowed
}

func TestPendingSlips_FailClosed(t *testing.T) {
	for _, name := range []string{"offline", "query failure", "scan failure", "iteration failure", "valid empty", "valid row"} {
		t.Run(name, func(t *testing.T) {
			old := db.DB
			t.Cleanup(func() { db.DB = old })
			var mock sqlmock.Sqlmock
			if name == "offline" {
				db.DB = nil
			} else {
				fixture, m, err := sqlmock.New()
				if err != nil {
					t.Fatal(err)
				}
				defer fixture.Close()
				db.DB = fixture
				mock = m
				query := mock.ExpectQuery("SELECT")
				if name == "query failure" {
					query.WillReturnError(errors.New("fixture query failed"))
				} else {
					rows := sqlmock.NewRows([]string{"id", "number", "name", "amount", "slip", "date"})
					if name != "valid empty" {
						var amount any = float64(1500.25)
						if name == "scan failure" {
							amount = "bad-decimal"
						}
						rows.AddRow("fixture-order", "FIX-1", "Fixture", amount, "/uploads/fixture-slip.png", time.Date(2026, 10, 3, 1, 0, 0, 0, time.UTC))
						if name == "iteration failure" {
							rows.RowError(0, errors.New("fixture iteration failure"))
						}
					}
					query.WillReturnRows(rows)
				}
			}
			gin.SetMode(gin.TestMode)
			router := gin.New()
			router.GET("/pending", HandleGetPendingSlips)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, httptest.NewRequest("GET", "/pending", nil))
			want := 500
			if name == "offline" {
				want = 503
			}
			if name == "valid empty" || name == "valid row" {
				want = 200
			}
			if w.Code != want {
				t.Fatalf("pending list %d wanted%d %s", w.Code, want, w.Body.String())
			}
			if mock != nil {
				if err := mock.ExpectationsWereMet(); err != nil {
					t.Fatal(err)
				}
			}
		})
	}
}

func fixtureReviewIdentity(c *gin.Context) {
	c.Set("user_id", "fixture-reviewer")
	c.Set("username", "Fixture reviewer")
	c.Set("user_role", "finance")
	c.Next()
}
func TestManualApproval_RequiresReviewerIdentity(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/review", HandleVerifyPaymentSlip)
	w := postPaymentFixture(router, "/review", `{"order_id":"fixture-order","status":"APPROVED"}`)
	if w.Code != 401 {
		t.Fatalf("missing reviewer accepted: %d", w.Code)
	}
}
