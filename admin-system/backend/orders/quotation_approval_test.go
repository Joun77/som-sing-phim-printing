package orders

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"somsing.local/backend/auth"
	"somsing.local/backend/db"
)

func TestQuotationApprovalCommittedTarget(t *testing.T) {
	testQuotationDecisionCommittedTarget(t, false)
}
func TestQuotationRejectionCommittedTarget(t *testing.T) {
	testQuotationDecisionCommittedTarget(t, true)
}
func testQuotationDecisionCommittedTarget(t *testing.T, reject bool) {
	suffix := "approve"
	handler := HandleApproveQuotation
	decisionOrderStatus := StatusWaitingDeposit
	decisionQuoteStatus := "ACCEPTED"
	if reject {
		suffix = "reject"
		handler = HandleRejectQuotation
		decisionOrderStatus = StatusRejected
		decisionQuoteStatus = "REJECTED"
	}
	for _, stage := range []string{"storage unavailable", "begin", "order write", "order row count", "quote write", "quote row count", "missing", "ambiguous", "multiple orders", "multiple quotes", "commit", "order success", "quote success"} {
		t.Run(stage, func(t *testing.T) {
			router := ownershipFixtureRouter(t)
			router.POST("/api/v1/quotations/:id/"+suffix, auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), handler)
			originalTime := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
			order := Order{ID: "target", OrderNo: "ORD-target", Status: StatusRequiresManagerApproval, OverallStatus: StatusRequiresManagerApproval, UpdatedAt: originalTime}
			quote := QuotationRecord{ID: "target", QuotationNo: "QUO-target", Status: "DRAFT", UpdatedAt: originalTime}
			ordersStore[order.ID], ordersStore[order.OrderNo] = order, order
			quotationsStore[quote.ID], quotationsStore[quote.QuotationNo] = quote, quote
			code := 500
			var mock sqlmock.Sqlmock
			if stage == "storage unavailable" {
				code = 503
			} else {
				fixture, m, err := sqlmock.New()
				if err != nil {
					t.Fatal(err)
				}
				defer fixture.Close()
				db.DB, mock = fixture, m
				begin := mock.ExpectBegin()
				if stage == "begin" {
					begin.WillReturnError(errors.New("private fixture begin error"))
				} else {
					orderRows, quoteRows := int64(0), int64(1)
					if stage == "order success" {
						orderRows, quoteRows = 1, 0
					}
					if stage == "missing" {
						quoteRows = 0
						code = 404
					}
					if stage == "ambiguous" {
						orderRows = 1
						code = 409
					}
					if stage == "multiple orders" {
						orderRows, quoteRows = 2, 0
						code = 409
					}
					if stage == "multiple quotes" {
						quoteRows = 2
						code = 409
					}
					o := mock.ExpectExec("UPDATE orders[[:space:]]+SET status='" + string(decisionOrderStatus) + "', overall_status='" + string(decisionOrderStatus) + "'")
					if stage == "order write" {
						o.WillReturnError(errors.New("private fixture order error"))
						mock.ExpectRollback()
					} else if stage == "order row count" {
						o.WillReturnResult(sqlmock.NewErrorResult(errors.New("private row count")))
						mock.ExpectRollback()
					} else {
						o.WillReturnResult(sqlmock.NewResult(0, orderRows))
						q := mock.ExpectExec("UPDATE quotations")
						if stage == "quote write" {
							q.WillReturnError(errors.New("private fixture quote error"))
							mock.ExpectRollback()
						} else if stage == "quote row count" {
							q.WillReturnResult(sqlmock.NewErrorResult(errors.New("private row count")))
							mock.ExpectRollback()
						} else {
							q.WillReturnResult(sqlmock.NewResult(0, quoteRows))
							if code == 404 || code == 409 {
								mock.ExpectRollback()
							} else {
								commit := mock.ExpectCommit()
								if stage == "commit" {
									commit.WillReturnError(errors.New("private fixture commit error"))
								} else {
									code = 200
								}
							}
						}
					}
				}
			}
			w := ownershipPost(t, router, "/api/v1/quotations/target/"+suffix, map[string]any{"reason": "test"})
			if w.Code != code {
				t.Fatalf("want%d got%d %s", code, w.Code, w.Body.String())
			}
			if mock != nil {
				if err := mock.ExpectationsWereMet(); err != nil {
					t.Fatal(err)
				}
			}
			var body map[string]any
			if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
				t.Fatal(err)
			}
			if bytes.Contains(w.Body.Bytes(), []byte("private")) {
				t.Fatal("raw DB error leaked")
			}
			if code != 200 {
				if body["committed"] == true || body["status"] == "success" {
					t.Fatal("failed approval acknowledged")
				}
			}
			for _, key := range []string{order.ID, order.OrderNo} {
				current := ordersStore[key]
				expected := StatusRequiresManagerApproval
				if stage == "order success" {
					expected = decisionOrderStatus
				}
				if current.Status != expected || current.OverallStatus != expected {
					t.Fatalf("cache aliases/status changed incorrectly at%s", key)
				}
				if stage != "order success" && !current.UpdatedAt.Equal(originalTime) {
					t.Fatal("order cache changed before commit or for unrelated quote")
				}
			}
			for _, key := range []string{quote.ID, quote.QuotationNo} {
				current := quotationsStore[key]
				expected := "DRAFT"
				if stage == "quote success" {
					expected = decisionQuoteStatus
				}
				if current.Status != expected {
					t.Fatal("quotation cache changed incorrectly")
				}
				if stage != "quote success" && !current.UpdatedAt.Equal(originalTime) {
					t.Fatal("quotation cache changed before commit or for unrelated order")
				}
			}
			if code == 200 {
				typ, status := "quotation", decisionQuoteStatus
				if stage == "order success" {
					typ, status = "order", string(decisionOrderStatus)
				}
				if body["id"] != "target" || body["target_type"] != typ || body["new_status"] != status || body["committed"] != true {
					t.Fatalf("unverifiable acknowledgment %s", w.Body.String())
				}
				if stage == "quote success" && (body["quotation_id"] != "target" || body["quotation_status"] != decisionQuoteStatus) {
					t.Fatal("missing matching committed quotation acknowledgment")
				}
				if stage == "order success" && (body["quotation_id"] != nil || body["quotation_status"] != nil) {
					t.Fatal("legacy order approval fabricated quotation acknowledgment")
				}
			}
		})
	}
}

func TestQuotationApprovalManagerAuthorization(t *testing.T) {
	testQuotationDecisionAuthorization(t, false)
}
func TestQuotationRejectionManagerAuthorization(t *testing.T) {
	testQuotationDecisionAuthorization(t, true)
}
func testQuotationDecisionAuthorization(t *testing.T, reject bool) {
	suffix := "approve"
	handler := HandleApproveQuotation
	if reject {
		suffix = "reject"
		handler = HandleRejectQuotation
	}
	for _, role := range []string{auth.RoleSales, auth.RoleFinance, auth.RoleProduction, auth.RoleManager, auth.RoleAdmin} {
		t.Run(role, func(t *testing.T) {
			router := ownershipFixtureRouter(t)
			router.POST("/api/v1/quotations/:id/"+suffix, auth.RequireRoles(auth.RoleAdmin, auth.RoleManager), handler)
			// Storage unavailable after successful auth, no SQL/network call for any role.
			req := httptest.NewRequest("POST", "/api/v1/quotations/target/"+suffix, bytes.NewBufferString(`{}`))
			req.Header.Set("Authorization", "Bearer "+makeUploadTestToken(role, false, false))
			req.Header.Set("X-User-Role", "MANAGER") // client header cannot widen the JWT role.
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
			want := 403
			if role == auth.RoleAdmin || role == auth.RoleManager {
				want = 503
			}
			if w.Code != want {
				t.Fatalf("%s want%d got%d", role, want, w.Code)
			}
		})
	}
	t.Run("unregistered handler header cannot authorize", func(t *testing.T) {
		router := ownershipFixtureRouter(t)
		router.POST("/direct/:id", handler)
		req := httptest.NewRequest("POST", "/direct/target", nil)
		req.Header.Set("X-User-Role", "MANAGER")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		if w.Code != 403 {
			t.Fatalf("header-only approval%d", w.Code)
		}
	})
}
