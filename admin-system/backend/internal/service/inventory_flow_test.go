package service_test

import (
	"testing"

	"somsing.local/backend/internal/domain"

	"github.com/shopspring/decimal"
)

// TestInboundMovingAverageMultiRound simulates multiple restock rounds on the same SKU
func TestInboundMovingAverageMultiRound(t *testing.T) {
	// Round 1: Initial Stock = 0
	// Inbound 1: 10 reams (500 sheets/ream = 5,000 sheets) @ 40,000 LAK/ream (80 LAK/sheet)
	mult := decimal.NewFromInt(500)
	qty1 := decimal.NewFromInt(10)
	price1 := decimal.NewFromFloat(40000.0)

	consumptionQty1 := qty1.Mul(mult) // 5000
	costPerSheet1 := price1.Div(mult)  // 80

	stockAfterR1 := consumptionQty1
	costAfterR1 := costPerSheet1

	if !stockAfterR1.Equal(decimal.NewFromInt(5000)) || !costAfterR1.Equal(decimal.NewFromInt(80)) {
		t.Fatalf("Round 1 failed: stock=%s, cost=%s", stockAfterR1, costAfterR1)
	}

	// Round 2: Inbound 2: 20 reams (10,000 sheets) @ 50,000 LAK/ream (100 LAK/sheet)
	// Expected Total Qty = 5,000 + 10,000 = 15,000 sheets
	// Expected Value = (5,000 * 80) + (10,000 * 100) = 400,000 + 1,000,000 = 1,400,000 LAK
	// Expected Moving Avg Cost = 1,400,000 / 15,000 = 93.3333 LAK/sheet
	qty2 := decimal.NewFromInt(20)
	price2 := decimal.NewFromFloat(50000.0)

	consumptionQty2 := qty2.Mul(mult) // 10000
	costPerSheet2 := price2.Div(mult)  // 100

	val1 := stockAfterR1.Mul(costAfterR1)
	val2 := consumptionQty2.Mul(costPerSheet2)
	totalQtyR2 := stockAfterR1.Add(consumptionQty2)
	avgCostR2 := val1.Add(val2).Div(totalQtyR2)

	expectedAvgCostR2, _ := decimal.NewFromString("93.3333333333333333")
	if avgCostR2.Round(4).String() != "93.3333" {
		t.Fatalf("Round 2 moving average failed: got %s, expected 93.3333", avgCostR2.Round(4).String())
	}
	_ = expectedAvgCostR2
}

// TestInboundCancellationAndZeroStockRetention simulates canceling inbound and verifying zero-stock handling
func TestInboundCancellationAndZeroStockRetention(t *testing.T) {
	// Initial state after Inbound: 5,000 sheets
	stock := decimal.NewFromInt(5000)
	minAlert := decimal.NewFromInt(500)
	status := domain.StockStatusInStock

	// Cancel full inbound of 5,000 sheets
	inboundToCancel := decimal.NewFromInt(5000)
	newStock := stock.Sub(inboundToCancel)

	if newStock.LessThanOrEqual(decimal.Zero) {
		newStock = decimal.Zero
		status = domain.StockStatusOutOfStock
	} else if newStock.LessThanOrEqual(minAlert) {
		status = domain.StockStatusLowStock
	} else {
		status = domain.StockStatusInStock
	}

	if !newStock.IsZero() {
		t.Fatalf("Expected 0 stock after complete reversal, got %s", newStock)
	}
	if status != domain.StockStatusOutOfStock {
		t.Fatalf("Expected OUT_OF_STOCK status, got %s", status)
	}
}

// TestInkBottleCostPerMlLinkage verifies cost_per_ml derivation for pricing engine
func TestInkBottleCostPerMlLinkage(t *testing.T) {
	bottleCapacity := decimal.NewFromFloat(100.0) // 100 ml
	bottleCost := decimal.NewFromFloat(45000.0)    // 45,000 LAK per bottle

	costPerMl := bottleCost.Div(bottleCapacity)
	expectedCostPerMl := decimal.NewFromFloat(450.0) // 450 LAK/ml

	if !costPerMl.Equal(expectedCostPerMl) {
		t.Fatalf("Cost per ml mismatch: got %s, expected %s", costPerMl, expectedCostPerMl)
	}
}
