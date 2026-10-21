package finance

import (
	"bytes"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"somsing.local/backend/db"
)

func setupLegacySlipFixtureFile(t *testing.T, orderID, relPath string) string {
	t.Helper()
	tmpDir := t.TempDir()
	t.Setenv("UPLOAD_STORAGE_DIR", tmpDir)
	fullPath := filepath.Join(tmpDir, filepath.FromSlash(relPath))
	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		t.Fatal(err)
	}
	pngHex := "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082"
	pngBytes, err := hex.DecodeString(pngHex)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(fullPath, pngBytes, 0644); err != nil {
		t.Fatal(err)
	}
	sum := sha256.Sum256(pngBytes)
	digest := hex.EncodeToString(sum[:])
	return `{"file_url":"/uploads/` + relPath + `","size":67,"sha256":"` + digest + `","mime_type":"image/png","order_id":"` + orderID + `","purpose":"payment_slip"}`
}

func expectLegacyReviewPrelude(mock sqlmock.Sqlmock, orderID, slipURL, state, amount, auditJSON string) {
	mock.ExpectQuery("SELECT id,COALESCE").WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "slip"}).AddRow(orderID, slipURL))
	mock.ExpectBegin()
	mock.ExpectExec("SELECT pg_advisory_xact_lock").WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectQuery("SELECT request_fingerprint,committed_response FROM audit_logs").
		WillReturnError(sql.ErrNoRows)
	mock.ExpectExec("SELECT pg_advisory_xact_lock").WillReturnResult(sqlmock.NewResult(0, 1))
	summaryCols := []string{"total_price", "total_amount_lak", "deposit_amount", "deposit_lak", "remaining_lak", "payment_opening_received_lak", "deposit_mode", "deposit_percentage", "payment_revision", "customer_id", "slip", "status"}
	mock.ExpectQuery("SELECT total_price::text").WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows(summaryCols).AddRow(amount, amount, "0.00", "0.00", amount, "0.00", false, "100.00", 1, "cust-1", slipURL, state))
	mock.ExpectQuery("SELECT COALESCE\\(SUM").WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"delta"}).AddRow("0.00"))
	if state == "PENDING_SLIP_CHECK" {
		mock.ExpectQuery("SELECT COALESCE\\(order_no").WithArgs(orderID).
			WillReturnRows(sqlmock.NewRows([]string{"order_no"}).AddRow("ORD-1"))
		mock.ExpectQuery("SELECT new_values->'data' FROM audit_logs").WithArgs(orderID, slipURL).
			WillReturnRows(sqlmock.NewRows([]string{"data"}).AddRow(auditJSON))
		mock.ExpectQuery("SELECT COALESCE\\(payment_method_id").
			WillReturnRows(sqlmock.NewRows([]string{"method"}).AddRow("bcel_one"))
		mock.ExpectQuery("SELECT account_number, COALESCE\\(is_active, false\\) FROM payment_methods").WithArgs("bcel_one").
			WillReturnRows(sqlmock.NewRows([]string{"account", "active"}).AddRow("160-12-00-01166166-001", true))
		mock.ExpectQuery("INSERT INTO payment_records").
			WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("00000000-0000-0000-0000-000000000011"))
		mock.ExpectQuery("SELECT state,requested_amount_lak::text,payment_method_id,record_kind").
			WillReturnRows(sqlmock.NewRows([]string{"state", "requested", "method", "kind", "reason", "actual", "evidence"}).
				AddRow("PENDING", amount, "bcel_one", "RECEIPT", "", nil, slipURL))
		mock.ExpectQuery("SELECT COALESCE\\(order_no").WithArgs(orderID).
			WillReturnRows(sqlmock.NewRows([]string{"order_no"}).AddRow("ORD-1"))
		mock.ExpectQuery("SELECT new_values->'data' FROM audit_logs").WithArgs(orderID, slipURL).
			WillReturnRows(sqlmock.NewRows([]string{"data"}).AddRow(auditJSON))
	}
}

func TestManualPaymentReview_FailClosed(t *testing.T) {
	gin.SetMode(gin.TestMode)
	for _, tc := range []struct {
		name, state         string
		offline, updateFail bool
		want                int
	}{
		{name: "offline", offline: true, want: 503},
		{name: "already paid rejects further review", state: "PAID_PREPRESS", want: 409},
		{name: "production must not rewind", state: "IN_PRODUCTION", want: 409},
		{name: "rejection database failure", state: "PENDING_SLIP_CHECK", updateFail: true, want: 500},
		{name: "rejection persists", state: "PENDING_SLIP_CHECK", want: 200},
	} {
		t.Run(tc.name, func(t *testing.T) {
			previous := db.DB
			defer func() { db.DB = previous }()
			var mock sqlmock.Sqlmock
			slipURL := "/uploads/orders/fixture-order/slip.png"
			auditJSON := setupLegacySlipFixtureFile(t, "fixture-order", "orders/fixture-order/slip.png")
			if tc.offline {
				db.DB = nil
			} else {
				fixture, m, err := sqlmock.New()
				if err != nil {
					t.Fatal(err)
				}
				defer fixture.Close()
				db.DB = fixture
				mock = m
				expectLegacyReviewPrelude(mock, "fixture-order", slipURL, tc.state, "1500.00", auditJSON)
				if tc.state == "PENDING_SLIP_CHECK" {
					mock.ExpectExec("UPDATE payment_records SET state='REJECTED'").
						WillReturnResult(sqlmock.NewResult(0, 1))
					mock.ExpectExec("UPDATE orders SET deposit_amount=").
						WillReturnResult(sqlmock.NewResult(0, 1))
					mock.ExpectQuery("SELECT to_jsonb\\(p\\)").
						WillReturnRows(sqlmock.NewRows([]string{"json"}).AddRow(`{"id":"00000000-0000-0000-0000-000000000011","state":"REJECTED"}`))
					update := mock.ExpectExec("UPDATE orders SET status=\\$2,overall_status=\\$2,proof_rejection_reason=\\$3").
						WithArgs("fixture-order", "PAYMENT_REJECTED", "invalid slip")
					if tc.updateFail {
						update.WillReturnError(errors.New("fixture db failure"))
						mock.ExpectRollback()
					} else {
						update.WillReturnResult(sqlmock.NewResult(0, 1))
						mock.ExpectExec("INSERT INTO audit_logs").WillReturnResult(sqlmock.NewResult(0, 1))
						mock.ExpectCommit()
					}
				} else {
					mock.ExpectRollback()
				}
			}
			r := gin.New()
			r.Use(fixtureReviewIdentity)
			r.POST("/review", HandleVerifyPaymentSlip)
			req := httptest.NewRequest(http.MethodPost, "/review", bytes.NewBufferString(`{"order_id":"fixture-order","status":"REJECTED","rejection_reason":"invalid slip"}`))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)
			if w.Code != tc.want {
				t.Fatalf("want %d got %d: %s", tc.want, w.Code, w.Body.String())
			}
			if mock != nil {
				if err := mock.ExpectationsWereMet(); err != nil {
					t.Fatal(err)
				}
			}
		})
	}
}

// Approval must not report success if either the order or accounting write fails.
func TestManualPaymentApproval_RollsBackOnWriteFailure(t *testing.T) {
	gin.SetMode(gin.TestMode)
	for _, journalFailure := range []bool{false, true} {
		name := "order update failure"
		if journalFailure {
			name = "journal failure"
		}
		t.Run(name, func(t *testing.T) {
			previous := db.DB
			defer func() { db.DB = previous }()
			fixture, mock, err := sqlmock.New()
			if err != nil {
				t.Fatal(err)
			}
			defer fixture.Close()
			db.DB = fixture
			slipURL := "/uploads/orders/fixture-order/slip.png"
			auditJSON := setupLegacySlipFixtureFile(t, "fixture-order", "orders/fixture-order/slip.png")
			expectLegacyReviewPrelude(mock, "fixture-order", slipURL, "PENDING_SLIP_CHECK", "1500.00", auditJSON)
			mock.ExpectQuery("SELECT account_number FROM payment_methods").WithArgs("bcel_one").
				WillReturnRows(sqlmock.NewRows([]string{"account"}).AddRow("160-12-00-01166166-001"))
			mock.ExpectQuery("SELECT id::text FROM chart_of_accounts").WithArgs("1110").
				WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("00000000-0000-0000-0000-000000001110"))
			mock.ExpectQuery("SELECT id::text FROM chart_of_accounts").WithArgs("4100").
				WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("00000000-0000-0000-0000-000000004100"))
			if journalFailure {
				mock.ExpectQuery("INSERT INTO journal_entries").WillReturnError(errors.New("fixture journal failure"))
			} else {
				mock.ExpectQuery("INSERT INTO journal_entries").
					WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("00000000-0000-0000-0000-000000000099"))
				mock.ExpectExec("INSERT INTO journal_lines").WillReturnResult(sqlmock.NewResult(0, 2))
				mock.ExpectExec("UPDATE payment_records SET state='CONFIRMED'").WillReturnResult(sqlmock.NewResult(0, 1))
				mock.ExpectExec("UPDATE orders SET deposit_amount=").WillReturnError(errors.New("fixture update failure"))
			}
			mock.ExpectRollback()
			r := gin.New()
			r.Use(fixtureReviewIdentity)
			r.POST("/review", HandleVerifyPaymentSlip)
			req := httptest.NewRequest(http.MethodPost, "/review", bytes.NewBufferString(`{"order_id":"fixture-order","status":"APPROVED"}`))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)
			if w.Code != http.StatusInternalServerError {
				t.Fatalf("want 500 got %d: %s", w.Code, w.Body.String())
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}
