package service_test

import (
	"testing"

	"somsing.local/backend/internal/domain"

	"github.com/shopspring/decimal"
)

func TestMovingAverageCostCalculation(t *testing.T) {
	// Scenario: Current Stock 100 sheets @ 2.00 LAK
	// Incoming Stock 200 sheets @ 5.00 LAK
	// Expected New Moving Average Cost = (100*2.00 + 200*5.00) / (100 + 200) = (200 + 1000) / 300 = 1200 / 300 = 4.00 LAK

	currentStock := decimal.NewFromFloat(100.0)
	currentCost := decimal.NewFromFloat(2.00)

	incomingQty := decimal.NewFromFloat(200.0)
	incomingCost := decimal.NewFromFloat(5.00)

	currentVal := currentStock.Mul(currentCost)
	incomingVal := incomingQty.Mul(incomingCost)
	totalQty := currentStock.Add(incomingQty)

	newCost := currentVal.Add(incomingVal).Div(totalQty)
	expectedCost := decimal.NewFromFloat(4.00)

	if !newCost.Equal(expectedCost) {
		t.Fatalf("Moving Average Cost Mismatch: got %s, expected %s", newCost.String(), expectedCost.String())
	}
}

func TestStockStatusTransitions(t *testing.T) {
	minAlert := decimal.NewFromFloat(10.0)

	// In stock
	stock1 := decimal.NewFromFloat(50.0)
	var status1 domain.StockStatus
	if stock1.GreaterThan(minAlert) {
		status1 = domain.StockStatusInStock
	} else if stock1.GreaterThan(decimal.Zero) {
		status1 = domain.StockStatusLowStock
	} else {
		status1 = domain.StockStatusOutOfStock
	}
	if status1 != domain.StockStatusInStock {
		t.Fatalf("Expected IN_STOCK, got %s", status1)
	}

	// Low stock
	stock2 := decimal.NewFromFloat(5.0)
	var status2 domain.StockStatus
	if stock2.GreaterThan(minAlert) {
		status2 = domain.StockStatusInStock
	} else if stock2.GreaterThan(decimal.Zero) {
		status2 = domain.StockStatusLowStock
	} else {
		status2 = domain.StockStatusOutOfStock
	}
	if status2 != domain.StockStatusLowStock {
		t.Fatalf("Expected LOW_STOCK, got %s", status2)
	}

	// Out of stock
	stock3 := decimal.Zero
	var status3 domain.StockStatus
	if stock3.GreaterThan(minAlert) {
		status3 = domain.StockStatusInStock
	} else if stock3.GreaterThan(decimal.Zero) {
		status3 = domain.StockStatusLowStock
	} else {
		status3 = domain.StockStatusOutOfStock
	}
	if status3 != domain.StockStatusOutOfStock {
		t.Fatalf("Expected OUT_OF_STOCK, got %s", status3)
	}
}

func TestUnitCostCalculation(t *testing.T) {
	// Paper Scenario: 5 packs @ 500 sheets/pack, Total Cost = 460,000 LAK
	// Formula: unit_cost = total_cost / (pack_count * sheets_per_pack) = 460000 / (5 * 500) = 184 LAK/sheet
	totalCostPaper := decimal.NewFromFloat(460000.0)
	packCount := decimal.NewFromFloat(5.0)
	sheetsPerPack := decimal.NewFromFloat(500.0)

	totalSheets := packCount.Mul(sheetsPerPack)
	paperUnitCost := totalCostPaper.Div(totalSheets)
	expectedPaperUnitCost := decimal.NewFromFloat(184.0)

	if !paperUnitCost.Equal(expectedPaperUnitCost) {
		t.Fatalf("Paper Unit Cost Mismatch: got %s, expected %s", paperUnitCost.String(), expectedPaperUnitCost.String())
	}

	// Ink Scenario: 4 bottles @ 100 ml/bottle, Total Cost = 800,000 LAK
	// Formula: unit_cost = total_cost / (bottle_count * ml_per_bottle) = 800000 / (4 * 100) = 2000 LAK/ml
	totalCostInk := decimal.NewFromFloat(800000.0)
	bottleCount := decimal.NewFromFloat(4.0)
	mlPerBottle := decimal.NewFromFloat(100.0)

	totalMl := bottleCount.Mul(mlPerBottle)
	inkUnitCost := totalCostInk.Div(totalMl)
	expectedInkUnitCost := decimal.NewFromFloat(2000.0)

	if !inkUnitCost.Equal(expectedInkUnitCost) {
		t.Fatalf("Ink Unit Cost Mismatch: got %s, expected %s", inkUnitCost.String(), expectedInkUnitCost.String())
	}
}

