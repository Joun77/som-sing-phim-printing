package service_test

import (
	"context"
	"testing"

	"backend/server/domain"
	"backend/server/service"

	"github.com/shopspring/decimal"
)

func TestPricingService_CalculatePricing_CM2Basis(t *testing.T) {
	svc := service.NewPricingService()

	// Test A5 size using WidthCM/HeightCM (14.8cm x 21.0cm)
	req := domain.PricingCalculationRequest{
		JobName:             "Brochure A5 160gsm",
		Quantity:            100,
		PageCount:           1,
		PaperCostPerUnitLAK: 1200,
		WidthCM:             decimal.NewFromFloat(14.8),
		HeightCM:            decimal.NewFromFloat(21.0),
		InkCoveragePercent:  decimal.NewFromFloat(25.0),
		InkCostPerMlLAK:     1800,
		LaminationType:      "GLOSS",
		LaminationCostLAK:   500,
		BindingType:         "NONE",
		BindingCostLAK:      0,
		LaborHours:          decimal.NewFromFloat(0.5),
		LaborRatePerHourLAK: 40000,
		SpoilageRatePercent: decimal.NewFromFloat(5.0),
		MarkupMarginPercent: decimal.NewFromFloat(30.0),
		TaxRatePercent:      decimal.NewFromFloat(7.0),
		MinTotalPriceLAK:    50000,
	}

	resp, err := svc.CalculatePricing(context.Background(), req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.Quantity != 100 {
		t.Errorf("expected quantity 100, got %d", resp.Quantity)
	}

	if resp.TotalPriceLAK <= 0 {
		t.Errorf("expected positive total price, got %d", resp.TotalPriceLAK)
	}

	if resp.UnitPriceLAK <= 0 {
		t.Errorf("expected positive unit price, got %d", resp.UnitPriceLAK)
	}

	if resp.CostBreakdown.NetInternalCostLAK <= 0 {
		t.Errorf("expected positive net internal cost, got %d", resp.CostBreakdown.NetInternalCostLAK)
	}

	if resp.CostBreakdown.BaseMaterialCostLAK <= 0 {
		t.Errorf("expected positive base material cost, got %d", resp.CostBreakdown.BaseMaterialCostLAK)
	}

	if resp.CostBreakdown.InkUsageCostLAK <= 0 {
		t.Errorf("expected positive ink cost, got %d", resp.CostBreakdown.InkUsageCostLAK)
	}
}

func TestPricingService_CompatibleInkComparison(t *testing.T) {
	svc := service.NewPricingService()

	req := domain.PricingCalculationRequest{
		JobName:                   "Flyer CMYK",
		Quantity:                  500,
		PageCount:                 1,
		PaperCostPerUnitLAK:       1000,
		UnfoldedWidthMM:           decimal.NewFromFloat(210.0),
		UnfoldedHeightMM:          decimal.NewFromFloat(297.0),
		InkCoveragePercent:        decimal.NewFromFloat(40.0),
		InkCostPerMlLAK:           2000, // Genuine ink
		UseCompatibleInk:          true,
		CompatibleInkCostPerMlLAK: 800, // Compatible ink
		MarkupMarginPercent:       decimal.NewFromFloat(25.0),
	}

	resp, err := svc.CalculatePricing(context.Background(), req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.CostBreakdown.GenuineInkBaselineLAK <= resp.CostBreakdown.CompatibleInkCostLAK {
		t.Errorf("genuine baseline %d should be greater than compatible cost %d",
			resp.CostBreakdown.GenuineInkBaselineLAK, resp.CostBreakdown.CompatibleInkCostLAK)
	}

	if resp.CostBreakdown.InkSavingsLAK <= 0 {
		t.Errorf("expected positive ink savings, got %d", resp.CostBreakdown.InkSavingsLAK)
	}

	if resp.CostBreakdown.InkSavingsPercent.LessThanOrEqual(decimal.Zero) {
		t.Errorf("expected positive savings percent, got %s", resp.CostBreakdown.InkSavingsPercent.String())
	}
}

func TestPricingService_PublicMasking(t *testing.T) {
	svc := service.NewPricingService()

	req := domain.PricingCalculationRequest{
		JobName:             "Poster",
		Quantity:            50,
		PaperCostPerUnitLAK: 5000,
		MarkupMarginPercent: decimal.NewFromFloat(35.0),
	}

	pubResp, err := svc.CalculatePublicPricing(context.Background(), req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if pubResp.TotalPriceLAK <= 0 {
		t.Errorf("expected positive total price, got %d", pubResp.TotalPriceLAK)
	}

	if pubResp.Currency != "LAK" {
		t.Errorf("expected currency LAK, got %s", pubResp.Currency)
	}
}

func TestPricingService_MachineOverheadIntegration(t *testing.T) {
	svc := service.NewPricingService()

	// Machine Price = 50,000,000 LAK, Expected Life = 500,000 pages => 100 LAK/page depr
	// Maintenance Rate = 20% => 20 LAK/page maint
	// Total Machine Overhead = 120 LAK/page
	// 1000 quantity * 1 page = 120,000 LAK machine cost
	req := domain.PricingCalculationRequest{
		JobName:                "Booklet 1000 copies",
		Quantity:               1000,
		PageCount:              1,
		PaperCostPerUnitLAK:    1000,
		MachinePriceLAK:        50000000,
		ExpectedLifePages:      500000,
		MaintenanceRatePercent: decimal.NewFromFloat(20.0),
		MarkupMarginPercent:    decimal.NewFromFloat(20.0),
	}

	resp, err := svc.CalculatePricing(context.Background(), req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.CostBreakdown.MachineDepreciationLAK != 120000 {
		t.Errorf("expected machine overhead 120000, got %d", resp.CostBreakdown.MachineDepreciationLAK)
	}
}

