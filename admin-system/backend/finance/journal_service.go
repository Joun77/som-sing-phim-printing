package finance

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/shopspring/decimal"
)

// JournalLineSpec represents a debit/credit line before persistence
type JournalLineSpec struct {
	AccountCode string
	Debit       decimal.Decimal
	Credit      decimal.Decimal
	Currency    string
	Notes       string
}

// Helper to look up account ID by code
func getAccountIDByCode(tx *sql.Tx, code string) (string, error) {
	var id string
	err := tx.QueryRow(`SELECT id::text FROM chart_of_accounts WHERE code = $1 LIMIT 1`, code).Scan(&id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", fmt.Errorf("chart of account code '%s' not found", code)
		}
		return "", fmt.Errorf("failed to query account code '%s': %w", code, err)
	}
	return id, nil
}

// insertJournalEntry inserts header and validated balanced lines in a transaction
func insertJournalEntry(tx *sql.Tx, date time.Time, description, refType, refID string, lines []JournalLineSpec) error {
	if tx == nil {
		return errors.New("transaction cannot be nil")
	}
	if len(lines) == 0 {
		return errors.New("journal entry must have at least one line")
	}

	// Verify balance: sum(debit) == sum(credit)
	totalDebit := decimal.Zero
	totalCredit := decimal.Zero

	for _, l := range lines {
		if l.Debit.IsNegative() || l.Credit.IsNegative() {
			return errors.New("debit and credit cannot be negative")
		}
		totalDebit = totalDebit.Add(l.Debit)
		totalCredit = totalCredit.Add(l.Credit)
	}

	if !totalDebit.Equal(totalCredit) {
		return fmt.Errorf("unbalanced journal entry: total debit (%s) != total credit (%s)", totalDebit.StringFixed(2), totalCredit.StringFixed(2))
	}
	if totalDebit.IsZero() {
		return errors.New("total journal amount cannot be zero")
	}

	var entryID string
	err := tx.QueryRow(`
		INSERT INTO journal_entries (entry_date, description, reference_type, reference_id, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING id::text
	`, date.Format("2006-01-02"), description, refType, refID).Scan(&entryID)
	if err != nil {
		return fmt.Errorf("failed to insert journal header: %w", err)
	}

	for _, l := range lines {
		acctID, err := getAccountIDByCode(tx, l.AccountCode)
		if err != nil {
			return err
		}
		currency := l.Currency
		if currency == "" {
			currency = "LAK"
		}

		_, err = tx.Exec(`
			INSERT INTO journal_lines (entry_id, account_id, debit, credit, currency, notes)
			VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6)
		`, entryID, acctID, l.Debit.InexactFloat64(), l.Credit.InexactFloat64(), currency, l.Notes)
		if err != nil {
			return fmt.Errorf("failed to insert journal line for account %s: %w", l.AccountCode, err)
		}
	}

	return nil
}

// 1. CreatePaymentReceivedJournal records cash/bank receipt for orders
// Dr: 1110 (Bank LAK) or 1100 (Cash) | Cr: 4100 (Printing Revenue)
func CreatePaymentReceivedJournal(tx *sql.Tx, orderID string, amount decimal.Decimal, paymentMethod string) error {
	if amount.LessThanOrEqual(decimal.Zero) {
		return errors.New("payment amount must be greater than zero")
	}

	bankAccountCode := "1110" // Default BCEL Bank LAK
	pmLower := strings.ToLower(paymentMethod)
	if strings.Contains(pmLower, "cash") || strings.Contains(pmLower, "สด") {
		bankAccountCode = "1100"
	} else if strings.Contains(pmLower, "thb") || strings.Contains(pmLower, "kbank") {
		bankAccountCode = "1120"
	}

	lines := []JournalLineSpec{
		{
			AccountCode: bankAccountCode,
			Debit:       amount,
			Credit:      decimal.Zero,
			Notes:       fmt.Sprintf("Payment received for Order %s via %s", orderID, paymentMethod),
		},
		{
			AccountCode: "4100", // Printing Revenue
			Debit:       decimal.Zero,
			Credit:      amount,
			Notes:       fmt.Sprintf("Printing sales revenue for Order %s", orderID),
		},
	}

	return insertJournalEntry(tx, time.Now(), fmt.Sprintf("Payment for Order %s", orderID), "ORDER", orderID, lines)
}

// 2. CreateCOGSJournal records cost of goods manufactured when Order -> IN_PRODUCTION
// Dr: 5100 (Paper COGS) + 5200 (Ink COGS) | Cr: 1300 (Raw Materials Inventory)
func CreateCOGSJournal(tx *sql.Tx, orderID string, paperCost, inkCost decimal.Decimal) error {
	if paperCost.LessThan(decimal.Zero) || inkCost.LessThan(decimal.Zero) {
		return errors.New("costs cannot be negative")
	}
	totalCost := paperCost.Add(inkCost)
	if totalCost.LessThanOrEqual(decimal.Zero) {
		return nil // No materials cost to capitalize into COGS
	}

	var lines []JournalLineSpec
	if paperCost.GreaterThan(decimal.Zero) {
		lines = append(lines, JournalLineSpec{
			AccountCode: "5100", // COGS - Paper
			Debit:       paperCost,
			Credit:      decimal.Zero,
			Notes:       fmt.Sprintf("Paper consumed for Order %s", orderID),
		})
	}
	if inkCost.GreaterThan(decimal.Zero) {
		lines = append(lines, JournalLineSpec{
			AccountCode: "5200", // COGS - Ink
			Debit:       inkCost,
			Credit:      decimal.Zero,
			Notes:       fmt.Sprintf("Ink consumed for Order %s", orderID),
		})
	}

	lines = append(lines, JournalLineSpec{
		AccountCode: "1300", // Raw Materials Inventory
		Debit:       decimal.Zero,
		Credit:      totalCost,
		Notes:       fmt.Sprintf("Materials discharged from stock for Order %s", orderID),
	})

	return insertJournalEntry(tx, time.Now(), fmt.Sprintf("COGS for Order %s", orderID), "ORDER", orderID, lines)
}

// 3. CreateInboundAPJournal records procurement into stock and creates AP
// Dr: 1300 (Raw Materials Inventory) | Cr: 2100 (Accounts Payable)
func CreateInboundAPJournal(tx *sql.Tx, inboundID string, amount decimal.Decimal, supplierName string) error {
	if amount.LessThanOrEqual(decimal.Zero) {
		return errors.New("inbound amount must be greater than zero")
	}

	lines := []JournalLineSpec{
		{
			AccountCode: "1300", // Inventory
			Debit:       amount,
			Credit:      decimal.Zero,
			Notes:       fmt.Sprintf("Raw materials received from %s (Inbound %s)", supplierName, inboundID),
		},
		{
			AccountCode: "2100", // Accounts Payable
			Debit:       decimal.Zero,
			Credit:      amount,
			Notes:       fmt.Sprintf("Accounts payable to %s (Inbound %s)", supplierName, inboundID),
		},
	}

	if err := insertJournalEntry(tx, time.Now(), fmt.Sprintf("Inbound procurement from %s", supplierName), "INBOUND", inboundID, lines); err != nil {
		return err
	}

	// Create Accounts Payable record
	dueDate := time.Now().AddDate(0, 1, 0).Format("2006-01-02") // Net 30 default
	_, err := tx.Exec(`
		INSERT INTO accounts_payable (supplier_name, inbound_transaction_id, amount, status, due_date, created_at)
		VALUES ($1, $2, $3, 'PENDING', $4, NOW())
	`, supplierName, inboundID, amount.InexactFloat64(), dueDate)
	if err != nil {
		return fmt.Errorf("failed to create AP record: %w", err)
	}

	return nil
}

// 4. CreateSpoilageJournal records production scrap/loss
// Dr: 5300 (Spoilage & Scrap) | Cr: 1300 (Raw Materials Inventory)
func CreateSpoilageJournal(tx *sql.Tx, orderID string, costImpact decimal.Decimal) error {
	if costImpact.LessThanOrEqual(decimal.Zero) {
		return errors.New("spoilage cost impact must be greater than zero")
	}

	lines := []JournalLineSpec{
		{
			AccountCode: "5300", // Spoilage & Scrap
			Debit:       costImpact,
			Credit:      decimal.Zero,
			Notes:       fmt.Sprintf("Production waste for Order %s", orderID),
		},
		{
			AccountCode: "1300", // Raw Materials Inventory
			Debit:       decimal.Zero,
			Credit:      costImpact,
			Notes:       fmt.Sprintf("Damaged material stock write-off for Order %s", orderID),
		},
	}

	return insertJournalEntry(tx, time.Now(), fmt.Sprintf("Production spoilage for Order %s", orderID), "SPOILAGE", orderID, lines)
}

// 5. CreateExpenseJournal records manual operational expenses
// Dr: Expense Account (6100-6500) | Cr: Payment Account (1100/1110)
func CreateExpenseJournal(tx *sql.Tx, expenseID, expenseAccountCode string, amount decimal.Decimal, paymentAccountCode, description string) error {
	if amount.LessThanOrEqual(decimal.Zero) {
		return errors.New("expense amount must be greater than zero")
	}
	if paymentAccountCode == "" {
		paymentAccountCode = "1110" // Default Bank LAK
	}

	lines := []JournalLineSpec{
		{
			AccountCode: expenseAccountCode,
			Debit:       amount,
			Credit:      decimal.Zero,
			Notes:       description,
		},
		{
			AccountCode: paymentAccountCode,
			Debit:       decimal.Zero,
			Credit:      amount,
			Notes:       fmt.Sprintf("Disbursement for %s", description),
		},
	}

	return insertJournalEntry(tx, time.Now(), description, "MANUAL", expenseID, lines)
}
