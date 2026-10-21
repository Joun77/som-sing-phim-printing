package finance

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"somsing.local/backend/db"
)

// TestFinancialReconciliation_ExplicitOpeningZero_NoConfirmedRecords_Returns409 verifies
// that an order having explicit opening=0 and no confirmed payment records (delta=0)
// CANNOT be silently accepted as paid based on status='COMPLETED' or 'PAID_PREPRESS'.
// It must strictly fail with HTTP 409 LEGACY_MONEY_RECONCILIATION_REQUIRED.
func TestFinancialReconciliation_ExplicitOpeningZero_NoConfirmedRecords_Returns409(t *testing.T) {
	gin.SetMode(gin.TestMode)
	statuses := []string{"COMPLETED", "PAID_PREPRESS", "IN_PRODUCTION", "DELIVERED"}

	for _, orderStatus := range statuses {
		t.Run("Status_"+orderStatus, func(t *testing.T) {
			previous := db.DB
			defer func() { db.DB = previous }()

			fixture, mock, err := sqlmock.New()
			if err != nil {
				t.Fatal(err)
			}
			defer fixture.Close()
			db.DB = fixture

			orderID := "legacy-discrepancy-order-01"
			summaryCols := []string{
				"total_price", "total_amount_lak", "deposit_amount", "deposit_lak",
				"remaining_lak", "payment_opening_received_lak", "deposit_mode",
				"deposit_percentage", "payment_revision", "customer_id", "slip", "status",
			}

			mock.ExpectBegin()
			// Mock order query: total=50000, deposit=50000, remaining=0, opening=0.00, status=orderStatus
			mock.ExpectQuery("SELECT total_price::text").WithArgs(orderID).
				WillReturnRows(sqlmock.NewRows(summaryCols).AddRow(
					"50000.00", "50000.00", "50000.00", "50000.00",
					"0.00", "0.00", false, "100.00", 1, "cust-1", "", orderStatus,
				))
			// Mock payment_records query: no confirmed payment records (delta = 0)
			mock.ExpectQuery("SELECT COALESCE\\(SUM").WithArgs(orderID).
				WillReturnRows(sqlmock.NewRows([]string{"delta"}).AddRow("0.00"))
			mock.ExpectRollback()

			router := gin.New()
			router.Use(func(c *gin.Context) {
				c.Set("user_id", "test-auditor")
				c.Set("user_role", "finance")
				c.Next()
			})
			router.GET("/api/v1/orders/:id/payment-records", HandlePaymentHistory)

			req := httptest.NewRequest(http.MethodGet, "/api/v1/orders/"+orderID+"/payment-records", nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// Must be rejected with 409 and code LEGACY_MONEY_RECONCILIATION_REQUIRED
			if w.Code != http.StatusConflict {
				t.Fatalf("Expected HTTP 409 Conflict for unproven opening=0, got %d: %s", w.Code, w.Body.String())
			}

			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}

// TestFinancialReconciliation_DurableProvenance_ConfirmedRecordReconciles verifies
// that when durable provenance exists (i.e. confirmed payment record in payment_records),
// the discrepancy is reconciled with full auditability and repeat-read consistency.
func TestFinancialReconciliation_DurableProvenance_ConfirmedRecordReconciles(t *testing.T) {
	gin.SetMode(gin.TestMode)
	previous := db.DB
	defer func() { db.DB = previous }()

	fixture, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer fixture.Close()
	db.DB = fixture

	orderID := "legacy-durable-order-02"
	summaryCols := []string{
		"total_price", "total_amount_lak", "deposit_amount", "deposit_lak",
		"remaining_lak", "payment_opening_received_lak", "deposit_mode",
		"deposit_percentage", "payment_revision", "customer_id", "slip", "status",
	}

	mock.ExpectBegin()
	// Mock order query: opening=0.00, deposit_amount=50000.00
	mock.ExpectQuery("SELECT total_price::text").WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows(summaryCols).AddRow(
			"50000.00", "50000.00", "50000.00", "50000.00",
			"0.00", "0.00", false, "100.00", 1, "cust-1", "", "COMPLETED",
		))
	// Mock payment_records query: confirmed receipt exists for 50000.00 (delta = 50000.00)
	mock.ExpectQuery("SELECT COALESCE\\(SUM").WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"delta"}).AddRow("50000.00"))
	// Mock payment records list query
	mock.ExpectQuery("SELECT \\(to_jsonb\\(p\\)").WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"json"}).AddRow(
			`{"id":"00000000-0000-0000-0000-000000000088","state":"CONFIRMED","record_kind":"RECEIPT","requested_amount_lak":"50000.00","actual_received_amount_lak":"50000.00","evidence_url":"cash"}`,
		))
	mock.ExpectQuery("SELECT payment_opening_captured_at FROM orders").WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"captured"}).AddRow(nil))
	mock.ExpectCommit()

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("user_id", "test-auditor")
		c.Set("user_role", "finance")
		c.Next()
	})
	router.GET("/api/v1/orders/:id/payment-records", HandlePaymentHistory)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/orders/"+orderID+"/payment-records", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected HTTP 200 OK for durable confirmed record, got %d: %s", w.Code, w.Body.String())
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

// TestCashReceipt_DebitsAccount1100 verifies that approving cash payment records
// strictly debits chart of accounts 1100 (Cash in Hand) rather than 1110 (Bank).
func TestCashReceipt_DebitsAccount1100(t *testing.T) {
	fixture, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer fixture.Close()

	ctx := gin.CreateTestContextOnly(httptest.NewRecorder(), gin.New())
	ctx.Request = httptest.NewRequest("POST", "/", nil)

	mock.ExpectBegin()
	tx, err := fixture.Begin()
	if err != nil {
		t.Fatal(err)
	}
	defer tx.Rollback()

	// Expect debit lookup for code "1100"
	mock.ExpectQuery("SELECT id::text FROM chart_of_accounts").WithArgs("1100").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("00000000-0000-0000-0000-000000001100"))
	// Expect credit lookup for revenue "4100"
	mock.ExpectQuery("SELECT id::text FROM chart_of_accounts").WithArgs("4100").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("00000000-0000-0000-0000-000000004100"))
	mock.ExpectQuery("INSERT INTO journal_entries").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("00000000-0000-0000-0000-000000000099"))
	mock.ExpectExec("INSERT INTO journal_lines").
		WithArgs(
			"00000000-0000-0000-0000-000000000099",
			"00000000-0000-0000-0000-000000001100", // Account 1100 (Cash)
			"00000000-0000-0000-0000-000000004100", // Account 4100 (Revenue)
			"25000.00",
		).
		WillReturnResult(sqlmock.NewResult(0, 2))

	amount, _ := ParsePaymentAmount("25000.00")
	journalID, err := receiptJournal(ctx, tx, "ord-cash-01", "rec-cash-01", "cash", amount)
	if err != nil {
		t.Fatalf("receiptJournal failed: %v", err)
	}
	if journalID != "00000000-0000-0000-0000-000000000099" {
		t.Fatalf("unexpected journalID: %v", journalID)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

// TestNullOpeningCapture_PersistsDurableOpening verifies that when payment_opening_received_lak
// is NULL, loadPaymentSummary with capture=true durably persists oldReceived to the database.
func TestNullOpeningCapture_PersistsDurableOpening(t *testing.T) {
	fixture, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer fixture.Close()

	ctx := gin.CreateTestContextOnly(httptest.NewRecorder(), gin.New())
	ctx.Request = httptest.NewRequest("POST", "/", nil)

	mock.ExpectBegin()
	tx, err := fixture.Begin()
	if err != nil {
		t.Fatal(err)
	}
	defer tx.Rollback()

	orderID := "order-null-opening"
	summaryCols := []string{
		"total_price", "total_amount_lak", "deposit_amount", "deposit_lak",
		"remaining_lak", "payment_opening_received_lak", "deposit_mode",
		"deposit_percentage", "payment_revision", "customer_id", "slip", "status",
	}

	// payment_opening_received_lak is NULL
	mock.ExpectQuery("SELECT total_price::text").WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows(summaryCols).AddRow(
			"30000.00", "30000.00", "10000.00", "10000.00",
			"20000.00", nil, false, "100.00", 1, "cust-1", "", "PARTIAL",
		))
	// Durable capture write must occur
	mock.ExpectExec("UPDATE orders SET payment_opening_received_lak=\\$2,payment_opening_captured_at=NOW\\(\\) WHERE id=\\$1 AND payment_opening_received_lak IS NULL").
		WithArgs(orderID, "10000.00").
		WillReturnResult(sqlmock.NewResult(0, 1))
	// Confirmed delta query
	mock.ExpectQuery("SELECT COALESCE\\(SUM").WithArgs(orderID).
		WillReturnRows(sqlmock.NewRows([]string{"delta"}).AddRow("0.00"))

	s, err := loadPaymentSummary(ctx, tx, orderID, true)
	if err != nil {
		t.Fatalf("loadPaymentSummary failed: %v", err)
	}

	if s.Received != "10000.00" || s.Remaining != "20000.00" || s.Opening != "10000.00" {
		t.Errorf("Unexpected summary values: received=%v remaining=%v opening=%v", s.Received, s.Remaining, s.Opening)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}
