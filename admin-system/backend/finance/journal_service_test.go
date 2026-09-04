package finance

import (
	"testing"

	"github.com/shopspring/decimal"
)

func TestJournalLineBalanceValidation(t *testing.T) {
	// Balanced lines test
	paperCost := decimal.NewFromFloat(500000.0)
	inkCost := decimal.NewFromFloat(150000.0)
	totalInventory := paperCost.Add(inkCost)

	lines := []JournalLineSpec{
		{AccountCode: "5100", Debit: paperCost, Credit: decimal.Zero},
		{AccountCode: "5200", Debit: inkCost, Credit: decimal.Zero},
		{AccountCode: "1300", Debit: decimal.Zero, Credit: totalInventory},
	}

	totalDebit := decimal.Zero
	totalCredit := decimal.Zero
	for _, l := range lines {
		totalDebit = totalDebit.Add(l.Debit)
		totalCredit = totalCredit.Add(l.Credit)
	}

	if !totalDebit.Equal(totalCredit) {
		t.Fatalf("Expected balanced debit and credit, got Dr: %s, Cr: %s", totalDebit.String(), totalCredit.String())
	}
	if !totalDebit.Equal(decimal.NewFromFloat(650000.0)) {
		t.Fatalf("Expected total 650000.0, got %s", totalDebit.String())
	}
}

func TestUnbalancedJournalLineDetection(t *testing.T) {
	// Unbalanced lines test
	lines := []JournalLineSpec{
		{AccountCode: "1110", Debit: decimal.NewFromFloat(100000.0), Credit: decimal.Zero},
		{AccountCode: "4100", Debit: decimal.Zero, Credit: decimal.NewFromFloat(90000.0)},
	}

	totalDebit := decimal.Zero
	totalCredit := decimal.Zero
	for _, l := range lines {
		totalDebit = totalDebit.Add(l.Debit)
		totalCredit = totalCredit.Add(l.Credit)
	}

	if totalDebit.Equal(totalCredit) {
		t.Fatalf("Expected unbalanced detection, but totals were equal")
	}
}
