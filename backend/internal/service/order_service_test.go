package service

import (
	"testing"

	"backend/internal/domain"

	"github.com/shopspring/decimal"
)

func TestStateTransitions(t *testing.T) {
	tests := []struct {
		name      string
		from      domain.OrderStatus
		to        domain.OrderStatus
		expectErr bool
	}{
		// Valid transitions
		{"Quotation to PendingPayment", domain.StatusQuotation, domain.StatusPendingPayment, false},
		{"Quotation to Cancelled", domain.StatusQuotation, domain.StatusCancelled, false},
		{"PendingPayment to OrderCreated", domain.StatusPendingPayment, domain.StatusOrderCreated, false},
		{"PendingPayment back to Quotation", domain.StatusPendingPayment, domain.StatusQuotation, false},
		{"PendingPayment to Cancelled", domain.StatusPendingPayment, domain.StatusCancelled, false},
		{"OrderCreated to FileConfirmed", domain.StatusOrderCreated, domain.StatusFileConfirmed, false},
		{"OrderCreated to Cancelled", domain.StatusOrderCreated, domain.StatusCancelled, false},
		{"FileConfirmed to InProduction", domain.StatusFileConfirmed, domain.StatusInProduction, false},
		{"FileConfirmed to Cancelled", domain.StatusFileConfirmed, domain.StatusCancelled, false},
		{"InProduction to Completed", domain.StatusInProduction, domain.StatusCompleted, false},
		{"InProduction to Cancelled", domain.StatusInProduction, domain.StatusCancelled, false},
		{"Same status no-op", domain.StatusQuotation, domain.StatusQuotation, false},

		// Invalid jumps (Strict Guard Violation)
		{"Quotation jump to InProduction", domain.StatusQuotation, domain.StatusInProduction, true},
		{"Quotation jump to Completed", domain.StatusQuotation, domain.StatusCompleted, true},
		{"PendingPayment jump to InProduction", domain.StatusPendingPayment, domain.StatusInProduction, true},
		{"OrderCreated jump to Completed", domain.StatusOrderCreated, domain.StatusCompleted, true},
		{"Completed cannot transition to Cancelled", domain.StatusCompleted, domain.StatusCancelled, true},
		{"Completed cannot transition to InProduction", domain.StatusCompleted, domain.StatusInProduction, true},
		{"Cancelled cannot transition to InProduction", domain.StatusCancelled, domain.StatusInProduction, true},
		{"Cancelled cannot transition to Quotation", domain.StatusCancelled, domain.StatusQuotation, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := domain.ValidateStatusTransition(tt.from, tt.to)
			if (err != nil) != tt.expectErr {
				t.Errorf("ValidateStatusTransition(%s, %s) error = %v, expectErr = %v", tt.from, tt.to, err, tt.expectErr)
			}
		})
	}
}

func TestFinancialPrecisionDecimalCalculations(t *testing.T) {
	// Test Decimal summation and multiplication without IEEE-754 binary floating point errors
	unitPrice1, _ := decimal.NewFromString("19.99")
	qty1 := 3
	item1Total := unitPrice1.Mul(decimal.NewFromInt(int64(qty1))) // 59.97

	unitPrice2, _ := decimal.NewFromString("0.10")
	qty2 := 3
	item2Total := unitPrice2.Mul(decimal.NewFromInt(int64(qty2))) // 0.30

	grandTotal := item1Total.Add(item2Total) // 60.27
	expectedTotal, _ := decimal.NewFromString("60.27")

	if !grandTotal.Equal(expectedTotal) {
		t.Errorf("Grand total mismatch: got %s, expected %s", grandTotal.String(), expectedTotal.String())
	}

	// Test Spoilage calculation (5% of 100 sheets = 5 sheets)
	sheetsRequired := decimal.NewFromInt(100)
	spoilageRate := decimal.NewFromFloat(5.0)
	spoilageSheets := sheetsRequired.Mul(spoilageRate).Div(decimal.NewFromInt(100)).Ceil()

	if !spoilageSheets.Equal(decimal.NewFromInt(5)) {
		t.Errorf("Spoilage calculation mismatch: got %s, expected 5", spoilageSheets.String())
	}
}
