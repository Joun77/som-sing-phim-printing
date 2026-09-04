package service_test

import (
	"context"
	"testing"

	"backend/internal/domain"
	"backend/internal/service"

	"github.com/shopspring/decimal"
)

func TestCalculateDynamicPrice_Mono100Percent(t *testing.T) {
	svc := service.NewPricingService(nil)

	cfg := &domain.ProductPricingConfig{
		CalculationModel:        domain.CalculationModelSingleSheet,
		BaseSetupCost:           decimal.NewFromFloat(50.00),
		BlackMonoCostPerPercent: decimal.NewFromFloat(0.05), // 0.05 per 1%
		CMYKColorCostPerPercent: decimal.NewFromFloat(0.08),
		DefaultFallbackTAC:      decimal.NewFromFloat(20.00),
	}

	req := domain.PricingRequest{
		Config:            cfg,
		CalculationModel:  domain.CalculationModelSingleSheet,
		PaperCostPerSheet: decimal.NewFromFloat(2.00),
		PageCount:         1,
		IsDoubleSided:     false,
		BindingCost:       decimal.NewFromFloat(0.00),
		FinishingCost:     decimal.NewFromFloat(1.00),
		Quantity:          100,
		Coverage: &domain.CoverageMetrics{
			C: decimal.Zero,
			M: decimal.Zero,
			Y: decimal.Zero,
			K: decimal.NewFromFloat(100.00),
		},
	}

	quote, audit, err := svc.CalculateDynamicPrice(context.Background(), req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Badge must be MONO_BLACK
	if quote.CalculationBadge != "MONO_BLACK" {
		t.Errorf("expected badge MONO_BLACK, got %s", quote.CalculationBadge)
	}

	// Ink cost per side: 100 * 0.05 = 5.00
	// Paper cost per unit: 1 sheet * 2.00 = 2.00
	// Finishing per unit: 1.00
	// Unit base cost: 2.00 + 5.00 + 0 + 1.00 = 8.00
	// Total order cost: (8.00 * 100) + 50.00 (setup) = 850.00
	// Effective Unit price: 850 / 100 = 8.50
	expectedTotal := decimal.NewFromFloat(850.00)
	if !quote.Subtotal.Equal(expectedTotal) {
		t.Errorf("expected subtotal %s, got %s", expectedTotal, quote.Subtotal)
	}

	expectedUnitPrice := decimal.NewFromFloat(8.50)
	if !quote.TotalUnitPrice.Equal(expectedUnitPrice) {
		t.Errorf("expected unit price %s, got %s", expectedUnitPrice, quote.TotalUnitPrice)
	}

	// Verify internal audit retains full telemetry
	if !audit.RawKPct.Equal(decimal.NewFromFloat(100.00)) {
		t.Errorf("expected RawKPct 100, got %s", audit.RawKPct)
	}
	if !audit.InkCost.Equal(decimal.NewFromFloat(500.00)) { // 5.00 * 100 qty
		t.Errorf("expected audit InkCost 500.00, got %s", audit.InkCost)
	}
}

func TestCalculateDynamicPrice_HeavyCMYK300Percent(t *testing.T) {
	svc := service.NewPricingService(nil)

	cfg := &domain.ProductPricingConfig{
		CalculationModel:        domain.CalculationModelSingleSheet,
		BaseSetupCost:           decimal.Zero,
		BlackMonoCostPerPercent: decimal.NewFromFloat(0.05),
		CMYKColorCostPerPercent: decimal.NewFromFloat(0.08),
		DefaultFallbackTAC:      decimal.NewFromFloat(20.00),
	}

	// 300% Rich Black: C=70, M=70, Y=60, K=100 -> ColorSum = 200%, TAC = 300%
	req := domain.PricingRequest{
		Config:            cfg,
		CalculationModel:  domain.CalculationModelSingleSheet,
		PaperCostPerSheet: decimal.NewFromFloat(3.00),
		PageCount:         1,
		IsDoubleSided:     false,
		Quantity:          50,
		Coverage: &domain.CoverageMetrics{
			C:   decimal.NewFromFloat(70.00),
			M:   decimal.NewFromFloat(70.00),
			Y:   decimal.NewFromFloat(60.00),
			K:   decimal.NewFromFloat(100.00),
			TAC: decimal.NewFromFloat(300.00),
		},
	}

	quote, audit, err := svc.CalculateDynamicPrice(context.Background(), req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Badge must be HEAVY_CMYK because TAC > 200
	if quote.CalculationBadge != "HEAVY_CMYK" {
		t.Errorf("expected badge HEAVY_CMYK, got %s", quote.CalculationBadge)
	}

	// Ink cost per side: (100 * 0.05) + (200 * 0.08) = 5.00 + 16.00 = 21.00
	// Unit base cost: 3.00 (paper) + 21.00 (ink) = 24.00
	// Total order cost: 24.00 * 50 = 1200.00
	expectedTotal := decimal.NewFromFloat(1200.00)
	if !quote.Subtotal.Equal(expectedTotal) {
		t.Errorf("expected subtotal %s, got %s", expectedTotal, quote.Subtotal)
	}

	if !audit.RawTACPct.Equal(decimal.NewFromFloat(300.00)) {
		t.Errorf("expected RawTACPct 300.00, got %s", audit.RawTACPct)
	}
}

func TestCalculateDynamicPrice_FallbackTAC(t *testing.T) {
	svc := service.NewPricingService(nil)

	cfg := &domain.ProductPricingConfig{
		CalculationModel:        domain.CalculationModelSingleSheet,
		BaseSetupCost:           decimal.Zero,
		BlackMonoCostPerPercent: decimal.NewFromFloat(0.05),
		CMYKColorCostPerPercent: decimal.NewFromFloat(0.08),
		DefaultFallbackTAC:      decimal.NewFromFloat(20.00),
	}

	// No coverage provided -> Should use default fallback TAC (20.00%)
	req := domain.PricingRequest{
		Config:            cfg,
		CalculationModel:  domain.CalculationModelSingleSheet,
		PaperCostPerSheet: decimal.NewFromFloat(1.00),
		PageCount:         1,
		IsDoubleSided:     false,
		Quantity:          10,
		Coverage:          nil,
	}

	quote, audit, err := svc.CalculateDynamicPrice(context.Background(), req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if quote.CalculationBadge != "FALLBACK_TAC" {
		t.Errorf("expected badge FALLBACK_TAC, got %s", quote.CalculationBadge)
	}

	// Applied fallback TAC: 20.00% * 0.05 mono = 1.00 ink per unit
	// Unit base cost: 1.00 (paper) + 1.00 (ink) = 2.00
	// Total order cost: 2.00 * 10 = 20.00
	expectedTotal := decimal.NewFromFloat(20.00)
	if !quote.Subtotal.Equal(expectedTotal) {
		t.Errorf("expected subtotal %s, got %s", expectedTotal, quote.Subtotal)
	}

	if !audit.AppliedTACPct.Equal(decimal.NewFromFloat(20.00)) {
		t.Errorf("expected AppliedTACPct 20.00, got %s", audit.AppliedTACPct)
	}
}

func TestCalculateDynamicPrice_BookBoundDuplexVsSingleSided(t *testing.T) {
	svc := service.NewPricingService(nil)

	cfg := &domain.ProductPricingConfig{
		CalculationModel:        domain.CalculationModelBookBound,
		BaseSetupCost:           decimal.Zero,
		BlackMonoCostPerPercent: decimal.NewFromFloat(0.05),
		CMYKColorCostPerPercent: decimal.NewFromFloat(0.08),
		DefaultFallbackTAC:      decimal.NewFromFloat(20.00),
	}

	// Scenario A: 10 pages, Duplex (double-sided) -> 5 physical sheets, 10 printed sides
	reqDuplex := domain.PricingRequest{
		Config:            cfg,
		CalculationModel:  domain.CalculationModelBookBound,
		PaperCostPerSheet: decimal.NewFromFloat(2.00),
		PageCount:         10,
		IsDoubleSided:     true,
		BindingCost:       decimal.NewFromFloat(15.00),
		Quantity:          1,
		Coverage: &domain.CoverageMetrics{
			K: decimal.NewFromFloat(10.00), // 10% mono = 0.50 per side
		},
	}

	quoteDuplex, auditDuplex, err := svc.CalculateDynamicPrice(context.Background(), reqDuplex)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Paper: 5 sheets * 2.00 = 10.00
	// Ink: 10 printed sides * 0.50 = 5.00
	// Binding: 15.00
	// Total unit cost: 10.00 + 5.00 + 15.00 = 30.00
	// Unit price per page: 30.00 / 10 = 3.00
	if !quoteDuplex.TotalUnitPrice.Equal(decimal.NewFromFloat(30.00)) {
		t.Errorf("expected duplex unit price 30.00, got %s", quoteDuplex.TotalUnitPrice)
	}
	if !quoteDuplex.UnitPricePerPage.Equal(decimal.NewFromFloat(3.00)) {
		t.Errorf("expected duplex unit price per page 3.00, got %s", quoteDuplex.UnitPricePerPage)
	}
	if !auditDuplex.PaperCost.Equal(decimal.NewFromFloat(10.00)) {
		t.Errorf("expected duplex paper cost 10.00, got %s", auditDuplex.PaperCost)
	}

	// Scenario B: 10 pages, Single-Sided -> 10 physical sheets, 10 printed sides
	reqSingle := reqDuplex
	reqSingle.IsDoubleSided = false

	quoteSingle, auditSingle, err := svc.CalculateDynamicPrice(context.Background(), reqSingle)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Paper: 10 sheets * 2.00 = 20.00
	// Ink: 10 printed sides * 0.50 = 5.00
	// Binding: 15.00
	// Total unit cost: 20.00 + 5.00 + 15.00 = 40.00
	// Unit price per page: 40.00 / 10 = 4.00
	if !quoteSingle.TotalUnitPrice.Equal(decimal.NewFromFloat(40.00)) {
		t.Errorf("expected single-sided unit price 40.00, got %s", quoteSingle.TotalUnitPrice)
	}
	if !quoteSingle.UnitPricePerPage.Equal(decimal.NewFromFloat(4.00)) {
		t.Errorf("expected single-sided unit price per page 4.00, got %s", quoteSingle.UnitPricePerPage)
	}
	if !auditSingle.PaperCost.Equal(decimal.NewFromFloat(20.00)) {
		t.Errorf("expected single-sided paper cost 20.00, got %s", auditSingle.PaperCost)
	}
}

func TestCalculateDynamicPrice_ManualOverride(t *testing.T) {
	svc := service.NewPricingService(nil)

	overridePrice := decimal.NewFromFloat(99.50)
	req := domain.PricingRequest{
		CalculationModel:  domain.CalculationModelSingleSheet,
		PaperCostPerSheet: decimal.NewFromFloat(5.00),
		PageCount:         1,
		Quantity:          10,
		ManualOverride:    true,
		OverrideUnitPrice: &overridePrice,
	}

	quote, audit, err := svc.CalculateDynamicPrice(context.Background(), req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if quote.CalculationBadge != "MANUAL_OVERRIDE" {
		t.Errorf("expected badge MANUAL_OVERRIDE, got %s", quote.CalculationBadge)
	}
	if !quote.TotalUnitPrice.Equal(overridePrice) {
		t.Errorf("expected unit price %s, got %s", overridePrice, quote.TotalUnitPrice)
	}
	expectedTotal := overridePrice.Mul(decimal.NewFromInt(10))
	if !quote.Subtotal.Equal(expectedTotal) {
		t.Errorf("expected total %s, got %s", expectedTotal, quote.Subtotal)
	}
	if !audit.IsManualOverride {
		t.Errorf("expected audit IsManualOverride to be true")
	}
}

func TestCalculateDynamicPrice_InvalidQuantity(t *testing.T) {
	svc := service.NewPricingService(nil)

	req := domain.PricingRequest{
		Quantity: 0,
	}

	_, _, err := svc.CalculateDynamicPrice(context.Background(), req)
	if err == nil {
		t.Fatalf("expected error for quantity 0, got nil")
	}
}
