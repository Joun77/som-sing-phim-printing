package finance

import (
	"bytes"
	"errors"
	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"net/http"
	"net/http/httptest"
	"somsing.local/backend/db"
	"testing"
)

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
				mock.ExpectBegin()
				mock.ExpectQuery("SELECT id, status").WithArgs("fixture-order").WillReturnRows(sqlmock.NewRows([]string{"id", "status", "amount", "slip"}).AddRow("fixture-order", tc.state, "1500", "fixture-slip"))
				if tc.state == "PENDING_SLIP_CHECK" {
					update := mock.ExpectExec("UPDATE orders SET status = 'PAYMENT_REJECTED'").WithArgs("fixture-order", "invalid slip")
					if tc.updateFail {
						update.WillReturnError(errors.New("fixture db failure"))
						mock.ExpectRollback()
					} else {
						update.WillReturnResult(sqlmock.NewResult(0, 1))
						mock.ExpectCommit()
					}
				} else {
					mock.ExpectRollback()
				}
			}
			r := gin.New()
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
			mock.ExpectBegin()
			mock.ExpectQuery("SELECT id, status").WithArgs("fixture-order").WillReturnRows(sqlmock.NewRows([]string{"id", "status", "amount", "slip"}).AddRow("fixture-order", "PENDING_SLIP_CHECK", "1500", "fixture-slip"))
			update := mock.ExpectExec("UPDATE orders SET status = 'PAID_PREPRESS'").WithArgs("fixture-order", "1500")
			if journalFailure {
				update.WillReturnResult(sqlmock.NewResult(0, 1))
				mock.ExpectQuery("INSERT INTO journal_entries").WillReturnError(errors.New("fixture journal failure"))
			} else {
				update.WillReturnError(errors.New("fixture update failure"))
			}
			mock.ExpectRollback()
			r := gin.New()
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
