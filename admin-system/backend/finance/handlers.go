package finance

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

// FinanceSummaryResponse represents owner financial dashboard metrics
type FinanceSummaryResponse struct {
	TotalSalesLAK      float64 `json:"total_sales_lak"`
	TotalSalesTHB      float64 `json:"total_sales_thb"`
	TotalSalesUSD      float64 `json:"total_sales_usd"`
	TotalARUnpaidLAK   float64 `json:"total_ar_unpaid_lak"`
	TotalARUnpaidTHB   float64 `json:"total_ar_unpaid_thb"`
	TotalARUnpaidUSD   float64 `json:"total_ar_unpaid_usd"`
	TotalAPUnpaidLAK   float64 `json:"total_ap_unpaid_lak"`
	PendingSlipsCount  int     `json:"pending_slips_count"`
	GrossProfitMargin  float64 `json:"gross_profit_margin_percent"`
	ExchangeRateTHB    float64 `json:"exchange_rate_thb"`
	ExchangeRateUSD    float64 `json:"exchange_rate_usd"`
	UpdatedAt          string  `json:"updated_at"`
}

// PaymentVerificationRequest represents slip approval or rejection
type PaymentVerificationRequest struct {
	OrderID         string `json:"order_id" binding:"required"`
	Status          string `json:"status" binding:"required"` // "APPROVED" | "REJECTED"
	RejectionReason string `json:"rejection_reason"`
}

// ARAgingItem represents accounts receivable aging per customer
type ARAgingItem struct {
	CustomerID   string  `json:"customer_id"`
	CustomerName string  `json:"customer_name"`
	TotalDue     float64 `json:"total_due"`
	Current      float64 `json:"current"`
	Days30       float64 `json:"days_30"`
	Days60       float64 `json:"days_60"`
	Days90Plus   float64 `json:"days_90_plus"`
}

// PLReportResponse represents Profit and Loss statement
type PLReportResponse struct {
	FromDate      string  `json:"from_date"`
	ToDate        string  `json:"to_date"`
	Revenue       float64 `json:"revenue"`
	COGS          float64 `json:"cogs"`
	GrossProfit   float64 `json:"gross_profit"`
	Expenses      float64 `json:"expenses"`
	NetProfit     float64 `json:"net_profit"`
	MarginPercent float64 `json:"margin_percent"`
	PaperCOGS     float64 `json:"paper_cogs"`
	InkCOGS       float64 `json:"ink_cogs"`
	SpoilageCOGS  float64 `json:"spoilage_cogs"`
}

// CashFlowResponse represents Inflow vs Outflow metrics
type CashFlowResponse struct {
	Period      string  `json:"period"`
	TotalInflow float64 `json:"total_inflow"`
	TotalOutflow float64 `json:"total_outflow"`
	NetCashFlow float64 `json:"net_cash_flow"`
}

// ExpenseRecord represents operational expense
type ExpenseRecord struct {
	ID          string  `json:"id"`
	AccountID   string  `json:"account_id"`
	AccountCode string  `json:"account_code"`
	Category    string  `json:"category"`
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"`
	Description string  `json:"description"`
	ReceiptURL  string  `json:"receipt_url"`
	ExpenseDate string  `json:"expense_date"`
	RecordedBy  string  `json:"recorded_by"`
	CreatedAt   string  `json:"created_at"`
}

// CreateExpenseRequest payload
type CreateExpenseRequest struct {
	AccountCode string  `json:"account_code" binding:"required"`
	Category    string  `json:"category" binding:"required"`
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	Currency    string  `json:"currency"`
	Description string  `json:"description"`
	ReceiptURL  string  `json:"receipt_url"`
	ExpenseDate string  `json:"expense_date"`
	RecordedBy  string  `json:"recorded_by"`
}

// JobProfitabilityItem represents top job ranking by profit
type JobProfitabilityItem struct {
	JobID         string  `json:"job_id"`
	JobName       string  `json:"job_name"`
	CustomerName  string  `json:"customer_name"`
	Revenue       float64 `json:"revenue"`
	TotalCost     float64 `json:"total_cost"`
	GrossProfit   float64 `json:"gross_profit"`
	ProfitMargin  float64 `json:"profit_margin_percent"`
	CompletedDate string  `json:"completed_date"`
}

// AccountsPayableItem represents AP line
type AccountsPayableItem struct {
	ID                   string  `json:"id"`
	SupplierName         string  `json:"supplier_name"`
	InboundTransactionID string  `json:"inbound_transaction_id"`
	Amount               float64 `json:"amount"`
	Currency             string  `json:"currency"`
	DueDate              string  `json:"due_date"`
	PaidAt               *string `json:"paid_at"`
	Status               string  `json:"status"`
	Notes                string  `json:"notes"`
	CreatedAt            string  `json:"created_at"`
}

// ChartOfAccountItem represents an account
type ChartOfAccountItem struct {
	ID          string `json:"id"`
	Code        string `json:"code"`
	Name        string `json:"name"`
	AccountType string `json:"account_type"`
	SortOrder   int    `json:"sort_order"`
	IsActive    bool   `json:"is_active"`
}

// HandleGetFinanceSummary calculates real KPI metrics for owner
func HandleGetFinanceSummary(c *gin.Context) {
	summary := FinanceSummaryResponse{
		ExchangeRateTHB: 800.0,
		ExchangeRateUSD: 27000.0,
		UpdatedAt:       time.Now().Format(time.RFC3339),
	}

	if db.DB != nil {
		var totalSales, totalCost, totalAR, totalAP float64
		var pendingCount int

		// 1. Total revenue MTD
		querySales := `
			SELECT COALESCE(SUM(COALESCE(total_price, total_amount_lak, 0)), 0),
			       COALESCE(SUM(COALESCE(total_cost, 0)), 0)
			FROM orders 
			WHERE status IN ('IN_PRODUCTION', 'COMPLETED', 'DELIVERED', 'Paid', 'Completed')
		`
		_ = db.DB.QueryRow(querySales).Scan(&totalSales, &totalCost)

		// 2. Unpaid Accounts Receivable
		queryAR := `
			SELECT COALESCE(SUM(GREATEST(0, COALESCE(total_price, total_amount_lak, 0) - COALESCE(deposit_amount, deposit_lak, 0))), 0)
			FROM orders 
			WHERE status NOT IN ('CANCELLED', 'Draft')
		`
		_ = db.DB.QueryRow(queryAR).Scan(&totalAR)

		// 3. Unpaid Accounts Payable
		queryAP := `
			SELECT COALESCE(SUM(amount), 0)
			FROM accounts_payable
			WHERE status IN ('PENDING', 'OVERDUE')
		`
		_ = db.DB.QueryRow(queryAP).Scan(&totalAP)

		// 4. Pending payment slips
		querySlips := `
			SELECT COUNT(*) 
			FROM orders 
			WHERE (payment_slip_url IS NOT NULL OR proof_url IS NOT NULL) 
			  AND status IN ('PENDING_PAYMENT', 'Pending Payment', 'Verification Required')
		`
		_ = db.DB.QueryRow(querySlips).Scan(&pendingCount)

		summary.TotalSalesLAK = totalSales
		summary.TotalSalesTHB = totalSales / 800.0
		summary.TotalSalesUSD = totalSales / 27000.0
		summary.TotalARUnpaidLAK = totalAR
		summary.TotalARUnpaidTHB = totalAR / 800.0
		summary.TotalARUnpaidUSD = totalAR / 27000.0
		summary.TotalAPUnpaidLAK = totalAP
		summary.PendingSlipsCount = pendingCount

		if totalSales > 0 {
			summary.GrossProfitMargin = ((totalSales - totalCost) / totalSales) * 100.0
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": summary})
}

// HandleVerifyPaymentSlip handles slip approval/rejection and advances order to Paid & In Production
func HandleVerifyPaymentSlip(c *gin.Context) {
	var req PaymentVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid request payload: " + err.Error()})
		return
	}

	if db.DB != nil {
		tx, err := db.DB.Begin()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to begin transaction"})
			return
		}
		defer tx.Rollback()

		if req.Status == "APPROVED" {
			var totalAmt float64
			err := tx.QueryRow(`SELECT COALESCE(total_price, total_amount_lak, 0) FROM orders WHERE id = $1 OR order_no = $1 FOR UPDATE`, req.OrderID).Scan(&totalAmt)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Order not found"})
				return
			}

			_, err = tx.Exec(`
				UPDATE orders 
				SET status = 'IN_PRODUCTION', 
				    deposit_amount = COALESCE(total_price, total_amount_lak, deposit_amount), 
				    deposit_lak = COALESCE(total_price, total_amount_lak, deposit_lak),
				    remaining_lak = 0,
				    updated_at = NOW() 
				WHERE id = $1 OR order_no = $1
			`, req.OrderID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to update order status"})
				return
			}

			// Auto-Journal Payment Received
			if totalAmt > 0 {
				_ = CreatePaymentReceivedJournal(tx, req.OrderID, decimal.NewFromFloat(totalAmt), "BCEL Transfer")
			}
		} else {
			_, _ = tx.Exec(`
				UPDATE orders 
				SET status = 'PAYMENT_REJECTED', 
				    proof_rejection_reason = $2,
				    updated_at = NOW() 
				WHERE id = $1 OR order_no = $1
			`, req.OrderID, req.RejectionReason)
		}

		if err := tx.Commit(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to commit payment verification"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    "success",
		"message":   "Payment slip verification processed successfully",
		"orderId":   req.OrderID,
		"newStatus": req.Status,
	})
}

type PendingSlipOrderDTO struct {
	ID             string  `json:"id"`
	OrderNumber    string  `json:"orderNumber"`
	CustomerName   string  `json:"customerName"`
	TotalAmount    float64 `json:"totalAmount"`
	Currency       string  `json:"currency"`
	PaymentSlipURL string  `json:"paymentSlipUrl"`
	CreatedAt      string  `json:"createdAt"`
}

// HandleGetPendingSlips returns list of orders waiting for slip verification
func HandleGetPendingSlips(c *gin.Context) {
	slips := make([]PendingSlipOrderDTO, 0)

	if db.DB != nil {
		rows, err := db.DB.Query(`
			SELECT 
				o.id, 
				COALESCE(o.order_no, o.order_number, o.id) as order_number, 
				COALESCE(c.company_name, c.contact_person, o.customer_name, 'Customer') as customer_name,
				COALESCE(o.total_price, o.total_amount_lak, 0) as total_amount,
				COALESCE(o.payment_slip_url, o.proof_url, '') as slip_url,
				o.created_at
			FROM orders o
			LEFT JOIN customers c ON o.customer_id = c.id
			WHERE (o.payment_slip_url IS NOT NULL OR o.proof_url IS NOT NULL)
			  AND COALESCE(o.payment_slip_url, o.proof_url, '') != ''
			  AND o.status IN ('PENDING_PAYMENT', 'Pending Payment', 'Verification Required', 'PENDING_SLIP_CHECK', 'WAITING_DEPOSIT')
			ORDER BY o.created_at DESC
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var item PendingSlipOrderDTO
				var createdAt time.Time
				if err := rows.Scan(&item.ID, &item.OrderNumber, &item.CustomerName, &item.TotalAmount, &item.PaymentSlipURL, &createdAt); err == nil {
					item.Currency = "LAK"
					item.CreatedAt = createdAt.Format("2006-01-02 15:04")
					slips = append(slips, item)
				}
			}
		}
	}

	c.JSON(http.StatusOK, slips)
}

// HandleGetARAging returns accounts receivable aging report grouped by customer and age buckets
func HandleGetARAging(c *gin.Context) {
	var items []ARAgingItem

	if db.DB != nil {
		rows, err := db.DB.Query(`
			SELECT 
				COALESCE(customer_id, customer_name, 'Unknown') AS customer_id,
				COALESCE(customer_name, 'Unknown') AS customer_name,
				SUM(GREATEST(0, COALESCE(total_price, total_amount_lak, 0) - COALESCE(deposit_amount, deposit_lak, 0))) AS total_due,
				SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN GREATEST(0, COALESCE(total_price, total_amount_lak, 0) - COALESCE(deposit_amount, deposit_lak, 0)) ELSE 0 END) AS days_30,
				SUM(CASE WHEN created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days' THEN GREATEST(0, COALESCE(total_price, total_amount_lak, 0) - COALESCE(deposit_amount, deposit_lak, 0)) ELSE 0 END) AS days_60,
				SUM(CASE WHEN created_at < NOW() - INTERVAL '60 days' THEN GREATEST(0, COALESCE(total_price, total_amount_lak, 0) - COALESCE(deposit_amount, deposit_lak, 0)) ELSE 0 END) AS days_90_plus
			FROM orders
			WHERE status NOT IN ('CANCELLED', 'Draft')
			  AND (COALESCE(total_price, total_amount_lak, 0) - COALESCE(deposit_amount, deposit_lak, 0)) > 0
			GROUP BY COALESCE(customer_id, customer_name, 'Unknown'), customer_name
			ORDER BY total_due DESC
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var item ARAgingItem
				if err := rows.Scan(&item.CustomerID, &item.CustomerName, &item.TotalDue, &item.Days30, &item.Days60, &item.Days90Plus); err == nil {
					item.Current = item.Days30
					items = append(items, item)
				}
			}
			if err := rows.Err(); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to iterate AR aging records: " + err.Error()})
				return
			}
		}
	}

	if items == nil {
		items = []ARAgingItem{}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": items})
}

// HandleGetPLReport calculates real Profit & Loss statement based on journal entries or order/expense aggregations
func HandleGetPLReport(c *gin.Context) {
	fromDate := c.DefaultQuery("from", time.Now().AddDate(0, -1, 0).Format("2006-01-02"))
	toDate := c.DefaultQuery("to", time.Now().Format("2006-01-02"))

	var revenue, paperCOGS, inkCOGS, spoilageCOGS, expenses float64

	if db.DB != nil {
		// 1. Revenue from orders / journal lines
		_ = db.DB.QueryRow(`
			SELECT COALESCE(SUM(credit - debit), 0)
			FROM journal_lines jl
			JOIN chart_of_accounts coa ON jl.account_id = coa.id
			JOIN journal_entries je ON jl.entry_id = je.id
			WHERE coa.code = '4100' AND je.entry_date BETWEEN $1 AND $2
		`, fromDate, toDate).Scan(&revenue)

		if revenue == 0 {
			// Fallback direct order aggregation if no journal entries exist yet
			_ = db.DB.QueryRow(`
				SELECT COALESCE(SUM(COALESCE(total_price, total_amount_lak, 0)), 0)
				FROM orders
				WHERE status IN ('IN_PRODUCTION', 'COMPLETED', 'DELIVERED', 'Paid')
				  AND DATE(created_at) BETWEEN $1 AND $2
			`, fromDate, toDate).Scan(&revenue)
		}

		// 2. COGS
		_ = db.DB.QueryRow(`
			SELECT COALESCE(SUM(debit - credit), 0)
			FROM journal_lines jl
			JOIN chart_of_accounts coa ON jl.account_id = coa.id
			JOIN journal_entries je ON jl.entry_id = je.id
			WHERE coa.code = '5100' AND je.entry_date BETWEEN $1 AND $2
		`, fromDate, toDate).Scan(&paperCOGS)

		_ = db.DB.QueryRow(`
			SELECT COALESCE(SUM(debit - credit), 0)
			FROM journal_lines jl
			JOIN chart_of_accounts coa ON jl.account_id = coa.id
			JOIN journal_entries je ON jl.entry_id = je.id
			WHERE coa.code = '5200' AND je.entry_date BETWEEN $1 AND $2
		`, fromDate, toDate).Scan(&inkCOGS)

		_ = db.DB.QueryRow(`
			SELECT COALESCE(SUM(debit - credit), 0)
			FROM journal_lines jl
			JOIN chart_of_accounts coa ON jl.account_id = coa.id
			JOIN journal_entries je ON jl.entry_id = je.id
			WHERE coa.code = '5300' AND je.entry_date BETWEEN $1 AND $2
		`, fromDate, toDate).Scan(&spoilageCOGS)

		// 3. Operational Expenses (6100-6500)
		_ = db.DB.QueryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM expense_records
			WHERE expense_date BETWEEN $1 AND $2
		`, fromDate, toDate).Scan(&expenses)
	}

	totalCOGS := paperCOGS + inkCOGS + spoilageCOGS
	grossProfit := revenue - totalCOGS
	netProfit := grossProfit - expenses

	marginPct := 0.0
	if revenue > 0 {
		marginPct = (netProfit / revenue) * 100.0
	}

	res := PLReportResponse{
		FromDate:      fromDate,
		ToDate:        toDate,
		Revenue:       revenue,
		PaperCOGS:     paperCOGS,
		InkCOGS:       inkCOGS,
		SpoilageCOGS:  spoilageCOGS,
		COGS:          totalCOGS,
		GrossProfit:   grossProfit,
		Expenses:      expenses,
		NetProfit:     netProfit,
		MarginPercent: marginPct,
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": res})
}

// HandleGetCashFlow calculates inflow vs outflow metrics
func HandleGetCashFlow(c *gin.Context) {
	period := c.DefaultQuery("period", "monthly")
	year := c.DefaultQuery("year", fmt.Sprintf("%d", time.Now().Year()))

	var inflow, outflow float64

	if db.DB != nil {
		_ = db.DB.QueryRow(`
			SELECT COALESCE(SUM(COALESCE(total_price, total_amount_lak, 0)), 0)
			FROM orders
			WHERE status IN ('IN_PRODUCTION', 'COMPLETED', 'DELIVERED', 'Paid')
			  AND EXTRACT(YEAR FROM created_at) = $1
		`, year).Scan(&inflow)

		var expenseSum, apPaidSum float64
		_ = db.DB.QueryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM expense_records
			WHERE EXTRACT(YEAR FROM expense_date) = $1
		`, year).Scan(&expenseSum)

		_ = db.DB.QueryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM accounts_payable
			WHERE status = 'PAID' AND EXTRACT(YEAR FROM paid_at) = $1
		`, year).Scan(&apPaidSum)

		outflow = expenseSum + apPaidSum
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": CashFlowResponse{
		Period:       period + "-" + year,
		TotalInflow:  inflow,
		TotalOutflow: outflow,
		NetCashFlow:  inflow - outflow,
	}})
}

// HandleCreateExpense records a manual expense with journal integration
func HandleCreateExpense(c *gin.Context) {
	var req CreateExpenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid expense payload: " + err.Error()})
		return
	}

	if db.DB == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Database not connected"})
		return
	}

	tx, err := db.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to begin transaction"})
		return
	}
	defer tx.Rollback()

	expDate := req.ExpenseDate
	if expDate == "" {
		expDate = time.Now().Format("2006-01-02")
	}
	currency := req.Currency
	if currency == "" {
		currency = "LAK"
	}

	var expenseID string
	err = tx.QueryRow(`
		INSERT INTO expense_records (category, amount, currency, description, receipt_url, expense_date, recorded_by, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		RETURNING id::text
	`, req.Category, req.Amount, currency, req.Description, req.ReceiptURL, expDate, req.RecordedBy).Scan(&expenseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to insert expense record: " + err.Error()})
		return
	}

	// Auto-Journal for Expense
	_ = CreateExpenseJournal(tx, expenseID, req.AccountCode, decimal.NewFromFloat(req.Amount), "1110", req.Description)

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to commit expense transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": gin.H{"id": expenseID}})
}

// HandleGetExpenses lists recent expense records
func HandleGetExpenses(c *gin.Context) {
	var list []ExpenseRecord

	if db.DB != nil {
		rows, err := db.DB.Query(`
			SELECT id::text, COALESCE(account_id::text, ''), category, amount, currency,
			       COALESCE(description, ''), COALESCE(receipt_url, ''), expense_date::text,
			       COALESCE(recorded_by, ''), created_at::text
			FROM expense_records
			ORDER BY expense_date DESC, created_at DESC
			LIMIT 100
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var item ExpenseRecord
				if err := rows.Scan(
					&item.ID, &item.AccountID, &item.Category, &item.Amount, &item.Currency,
					&item.Description, &item.ReceiptURL, &item.ExpenseDate,
					&item.RecordedBy, &item.CreatedAt,
				); err == nil {
					list = append(list, item)
				}
			}
			if err := rows.Err(); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to iterate expense records: " + err.Error()})
				return
			}
		}
	}

	if list == nil {
		list = []ExpenseRecord{}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
}

// HandleGetJobProfitability returns top 20 completed jobs ranked by gross profit
func HandleGetJobProfitability(c *gin.Context) {
	var list []JobProfitabilityItem

	if db.DB != nil {
		rows, err := db.DB.Query(`
			SELECT 
				o.id, 
				COALESCE(o.order_no, o.order_number, o.id) AS job_id,
				COALESCE(o.customer_name, 'Direct Customer') AS customer_name,
				COALESCE(o.total_price, o.total_amount_lak, 0) AS revenue,
				COALESCE(o.total_cost, 0) AS total_cost,
				(COALESCE(o.total_price, o.total_amount_lak, 0) - COALESCE(o.total_cost, 0)) AS gross_profit,
				CASE WHEN COALESCE(o.total_price, o.total_amount_lak, 0) > 0 
				     THEN ((COALESCE(o.total_price, o.total_amount_lak, 0) - COALESCE(o.total_cost, 0)) / COALESCE(o.total_price, o.total_amount_lak, 1)) * 100 
				     ELSE 0 
				END AS profit_margin_percent,
				o.created_at::text
			FROM orders o
			WHERE o.status IN ('IN_PRODUCTION', 'COMPLETED', 'DELIVERED', 'Paid')
			ORDER BY gross_profit DESC
			LIMIT 20
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var item JobProfitabilityItem
				var dummyID string
				if err := rows.Scan(
					&dummyID, &item.JobID, &item.CustomerName, &item.Revenue,
					&item.TotalCost, &item.GrossProfit, &item.ProfitMargin, &item.CompletedDate,
				); err == nil {
					item.JobName = "Print Job #" + item.JobID
					list = append(list, item)
				}
			}
			if err := rows.Err(); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to iterate profitability items: " + err.Error()})
				return
			}
		}
	}

	if list == nil {
		list = []JobProfitabilityItem{}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
}

// HandleGetAR lists active accounts receivable with payment status
func HandleGetAR(c *gin.Context) {
	HandleGetARAging(c)
}

// HandleRecordARPayment records customer invoice settlement
func HandleRecordARPayment(c *gin.Context) {
	orderID := c.Param("id")
	var req struct {
		Amount        float64 `json:"amount" binding:"required,gt=0"`
		PaymentMethod string  `json:"payment_method"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if db.DB != nil {
		tx, err := db.DB.Begin()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to begin transaction"})
			return
		}
		defer tx.Rollback()

		_, err = tx.Exec(`
			UPDATE orders
			SET deposit_amount = deposit_amount + $1,
			    deposit_lak = deposit_lak + $1,
			    remaining_lak = GREATEST(0, remaining_lak - $1),
			    updated_at = NOW()
			WHERE id = $2 OR order_no = $2
		`, req.Amount, orderID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to update AR record"})
			return
		}

		_ = CreatePaymentReceivedJournal(tx, orderID, decimal.NewFromFloat(req.Amount), req.PaymentMethod)

		if err := tx.Commit(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to commit AR payment"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "AR payment recorded successfully"})
}

// HandleGetAP lists accounts payable records
func HandleGetAP(c *gin.Context) {
	var list []AccountsPayableItem

	if db.DB != nil {
		rows, err := db.DB.Query(`
			SELECT id::text, supplier_name, COALESCE(inbound_transaction_id, ''),
			       amount, currency, COALESCE(due_date::text, ''),
			       paid_at::text, status, COALESCE(notes, ''), created_at::text
			FROM accounts_payable
			ORDER BY due_date ASC, created_at DESC
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var item AccountsPayableItem
				var paidAt sql.NullString
				if err := rows.Scan(
					&item.ID, &item.SupplierName, &item.InboundTransactionID,
					&item.Amount, &item.Currency, &item.DueDate,
					&paidAt, &item.Status, &item.Notes, &item.CreatedAt,
				); err == nil {
					if paidAt.Valid {
						item.PaidAt = &paidAt.String
					}
					list = append(list, item)
				}
			}
			if err := rows.Err(); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to iterate AP records: " + err.Error()})
				return
			}
		}
	}

	if list == nil {
		list = []AccountsPayableItem{}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
}

// HandleRecordAPPayment records supplier AP settlement
func HandleRecordAPPayment(c *gin.Context) {
	apID := c.Param("id")

	if db.DB != nil {
		_, err := db.DB.Exec(`
			UPDATE accounts_payable
			SET status = 'PAID', paid_at = NOW()
			WHERE id::text = $1
		`, apID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to record AP payment: " + err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "AP payment settled successfully"})
}

// HandleGetChartOfAccounts lists Chart of Accounts for selection
func HandleGetChartOfAccounts(c *gin.Context) {
	var list []ChartOfAccountItem

	if db.DB != nil {
		rows, err := db.DB.Query(`
			SELECT id::text, code, name, account_type::text, sort_order, is_active
			FROM chart_of_accounts
			WHERE is_active = true
			ORDER BY sort_order ASC, code ASC
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var item ChartOfAccountItem
				if err := rows.Scan(&item.ID, &item.Code, &item.Name, &item.AccountType, &item.SortOrder, &item.IsActive); err == nil {
					list = append(list, item)
				}
			}
			if err := rows.Err(); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to iterate chart of accounts: " + err.Error()})
				return
			}
		}
	}

	if list == nil {
		list = []ChartOfAccountItem{
			{Code: "1100", Name: "เงินสด (Cash)", AccountType: "ASSET"},
			{Code: "1110", Name: "เงินฝากธนาคาร LAK (BCEL)", AccountType: "ASSET"},
			{Code: "6100", Name: "ค่าจ้างและเงินเดือน", AccountType: "EXPENSE"},
			{Code: "6200", Name: "ค่าเช่าสถานที่", AccountType: "EXPENSE"},
			{Code: "6300", Name: "ค่าไฟฟ้าและสาธารณูปโภค", AccountType: "EXPENSE"},
			{Code: "6400", Name: "ค่าซ่อมบำรุงรักษาเครื่อง", AccountType: "EXPENSE"},
			{Code: "6500", Name: "ค่าใช้จ่ายดำเนินงานทั่วไป", AccountType: "EXPENSE"},
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
}
