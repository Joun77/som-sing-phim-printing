package pricing

import (
	"math"
	"testing"
)

// baseReq is the shared A4 baseline request used across all tests.
func baseReq() CalculationRequest {
	return CalculationRequest{
		JobName:               "Professional booklet",
		Quantity:              100,
		PaperSku:              "paper-a4-80",
		PaperCostPerUnit:      100.0, // 100 LAK per sheet
		PaperFormat:           "sheet",
		InkCoverageKPercent:   5.0,  // 5% K
		InkCoverageCMYPercent: 10.0, // 10% CMY
		InkCostKPerMl:         500.0,
		InkCostCMYPerMl:       600.0,
		MachinePrice:          50000000,
		TargetTotalPages:      1000000,
		MaintenanceCostPerPage: 10.0,
		JobWidth:              210, // A4
		JobHeight:             297,
		CustomFinishingOptions: []CustomFinishingOption{
			{Name: "Custom Binding", ChargeType: "PER_UNIT", Price: 150.0},
			{Name: "Job Setup Fee", ChargeType: "FIXED_JOB", Price: 2000.0},
		},
		LaminationType:      "none",
		BindingType:         "none",
		LaborCostPerHour:    15000.0,
		EstimatedHours:      2.0,
		OverheadPercent:     0.10, // 10%
		TargetMarginPercent: 0.35, // 35%
	}
}

// TestCalculateJobPricingA4Baseline verifies the A4 (S=1.0) cost breakdown.
// With area factor applied, maintenance is now: 10 × 1.0 × 100 = 1000 (same as before).
func TestCalculateJobPricingA4Baseline(t *testing.T) {
	req := baseReq()
	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// AreaFactor for A4 = 210*297 / (210*297) = 1.0
	if res.AreaFactor != 1.0 {
		t.Errorf("Expected AreaFactor 1.0 for A4, got %v", res.AreaFactor)
	}

	// Paper: 100 × 100 = 10,000 LAK
	if res.PaperCost != 10000.0 {
		t.Errorf("Expected PaperCost 10000.0, got %v", res.PaperCost)
	}

	// Ink K: 100 × (0.007 × 5 × 1.0) × 500 = 1,750 LAK
	if res.InkCostK != 1750.0 {
		t.Errorf("Expected InkCostK 1750.0, got %v", res.InkCostK)
	}
	// Ink CMY: 100 × (0.007 × 10 × 1.0) × 600 = 4,200 LAK
	if res.InkCostCMY != 4200.0 {
		t.Errorf("Expected InkCostCMY 4200.0, got %v", res.InkCostCMY)
	}
	if res.InkCost != 5950.0 {
		t.Errorf("Expected InkCost 5950.0, got %v", res.InkCost)
	}

	// Depreciation: (50M / 1M) × 1.0 × 100 = 5,000 LAK
	if res.DepreciationCost != 5000.0 {
		t.Errorf("Expected DepreciationCost 5000.0, got %v", res.DepreciationCost)
	}

	// Maintenance: 10 × 1.0 × 100 = 1,000 LAK
	if res.MaintenanceCost != 1000.0 {
		t.Errorf("Expected MaintenanceCost 1000.0, got %v", res.MaintenanceCost)
	}

	// Custom Finishing: 150×100 + 2000 = 17,000 LAK
	if res.CustomFinishingCost != 17000.0 {
		t.Errorf("Expected CustomFinishingCost 17000.0, got %v", res.CustomFinishingCost)
	}

	// Labor: 15000 × 2 = 30,000 LAK
	if res.LaborCost != 30000.0 {
		t.Errorf("Expected LaborCost 30000.0, got %v", res.LaborCost)
	}

	// Direct: 10000+5950+5000+1000+17000+30000 = 68,950
	if res.DirectCost != 68950.0 {
		t.Errorf("Expected DirectCost 68950.0, got %v", res.DirectCost)
	}

	// Overhead: 68950 × 0.10 = 6895
	if res.OverheadCost != 6895.0 {
		t.Errorf("Expected OverheadCost 6895.0, got %v", res.OverheadCost)
	}

	// Subtotal (no spoilage) = 68950 + 6895 = 75,845
	if res.Subtotal != 75845.0 {
		t.Errorf("Expected Subtotal 75845.0, got %v", res.Subtotal)
	}

	// NetInternalCost = Subtotal × (1 + 0%) = 75,845
	if res.NetInternalCost != 75845.0 {
		t.Errorf("Expected NetInternalCost 75845.0 (no spoilage), got %v", res.NetInternalCost)
	}

	// SalePrice = 75845 / (1 - 0.35) = 75845 / 0.65 = 116,684.62
	if res.SalePrice != 116684.62 {
		t.Errorf("Expected SalePrice 116684.62, got %v", res.SalePrice)
	}

	// Grand Total (no discount, no tax) = SalePrice
	if res.GrandTotal != 116684.62 {
		t.Errorf("Expected GrandTotal 116684.62 (no discount/tax), got %v", res.GrandTotal)
	}

	t.Run("Custom_Finishing_PER_SQM", func(t *testing.T) {
		reqSqM := baseReq()
		reqSqM.CustomFinishingOptions = []CustomFinishingOption{
			{Name: "Laminate SQM", ChargeType: "PER_SQM", Price: 1000.0},
		}
		// 100 copies × 0.21m × 0.297m = 6.237 sqm → 6237 LAK
		resSqM, err := CalculateJobPricing(reqSqM)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if resSqM.CustomFinishingCost != 6237.0 {
			t.Errorf("Expected CustomFinishingCost 6237.0, got %v", resSqM.CustomFinishingCost)
		}
	})

	t.Run("Margin_Protection_Guard", func(t *testing.T) {
		reqGuard := baseReq()
		reqGuard.TargetMarginPercent = 1.5 // >100% → clamp to 0.99
		resGuard, err := CalculateJobPricing(reqGuard)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if resGuard.ProfitMargin != 0.99 {
			t.Errorf("Expected margin clamped to 0.99, got %v", resGuard.ProfitMargin)
		}
	})

	t.Run("Fallback_Overhead", func(t *testing.T) {
		reqFallback := baseReq()
		reqFallback.OverheadPercent = 0.0
		resFallback, err := CalculateJobPricing(reqFallback)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		expectedOverhead := resFallback.DirectCost * 0.15
		if math.Abs(resFallback.OverheadCost-roundToTwoDecimals(expectedOverhead)) > 0.01 {
			t.Errorf("Expected OverheadCost ~%v (15%% fallback), got %v", expectedOverhead, resFallback.OverheadCost)
		}
	})
}

// TestAreaFactorScaling verifies that ink and machine costs scale by Paper Area Factor S.
func TestAreaFactorScaling(t *testing.T) {
	// A3: 297×420 mm → S = 297*420 / (210*297) = 2.0
	reqA3 := baseReq()
	reqA3.JobWidth = 297
	reqA3.JobHeight = 420
	reqA3.CustomFinishingOptions = nil

	resA3, err := CalculateJobPricing(reqA3)
	if err != nil {
		t.Fatalf("A3: unexpected error: %v", err)
	}

	if math.Abs(resA3.AreaFactor-2.0) > 0.001 {
		t.Errorf("Expected A3 AreaFactor=2.0, got %v", resA3.AreaFactor)
	}

	// A4 baseline (no custom finishing for clean comparison)
	reqA4 := baseReq()
	reqA4.CustomFinishingOptions = nil
	resA4, err := CalculateJobPricing(reqA4)
	if err != nil {
		t.Fatalf("A4: unexpected error: %v", err)
	}

	// Ink K for A3 should be exactly 2× A4 (S scales linearly)
	expectedA3InkK := roundToTwoDecimals(resA4.InkCostK * 2.0)
	if resA3.InkCostK != expectedA3InkK {
		t.Errorf("Expected A3 InkCostK=%v (2× A4 %v), got %v", expectedA3InkK, resA4.InkCostK, resA3.InkCostK)
	}

	// Depreciation for A3 should be exactly 2× A4
	expectedA3Depr := roundToTwoDecimals(resA4.DepreciationCost * 2.0)
	if resA3.DepreciationCost != expectedA3Depr {
		t.Errorf("Expected A3 DepreciationCost=%v (2× A4 %v), got %v", expectedA3Depr, resA4.DepreciationCost, resA3.DepreciationCost)
	}

	// A6: 105×148 → S = 105*148 / (210*297) = 15540/62370 ≈ 0.25
	reqA6 := baseReq()
	reqA6.JobWidth = 105
	reqA6.JobHeight = 148
	reqA6.CustomFinishingOptions = nil

	resA6, err := CalculateJobPricing(reqA6)
	if err != nil {
		t.Fatalf("A6: unexpected error: %v", err)
	}
	expectedS_A6 := roundToTwoDecimals((105.0 * 148.0) / (210.0 * 297.0))
	if resA6.AreaFactor != expectedS_A6 {
		t.Errorf("Expected A6 AreaFactor=%v, got %v", expectedS_A6, resA6.AreaFactor)
	}
	// A6 ink should be approximately 0.25× A4 — verify directly from formula
	// inkVolumeK_A6 = 0.007 × 5% × S_A6 × 100 copies × 500 LAK/ml
	rawS_A6 := (105.0 * 148.0) / (210.0 * 297.0)
	expectedA6InkKDirect := roundToTwoDecimals(float64(100) * 0.007 * 5.0 * rawS_A6 * 500.0)
	if resA6.InkCostK != expectedA6InkKDirect {
		t.Errorf("Expected A6 InkCostK=%v (direct formula), got %v", expectedA6InkKDirect, resA6.InkCostK)
	}
}

// TestRollPaperCost verifies the roll paper formula: cost = pricePerM2 × jobArea × qty.
func TestRollPaperCost(t *testing.T) {
	req := CalculationRequest{
		JobName:             "Roll Banner",
		Quantity:            100,
		PaperSku:            "roll-banner",
		PaperFormat:         "roll",
		PaperRollPricePerM2: 2000.0, // 2000 LAK per m²
		JobWidth:            210,    // mm
		JobHeight:           297,    // mm
		// No ink, machine, or overhead to isolate paper cost
		OverheadPercent:     0.0,
		TargetMarginPercent: 0.0,
	}

	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	// jobArea = 0.21 × 0.297 = 0.06237 m²
	// PaperCost = 2000 × 0.06237 × 100 = 12474 LAK
	expectedPaperCost := roundToTwoDecimals(2000.0 * 0.21 * 0.297 * 100)
	if res.PaperCost != expectedPaperCost {
		t.Errorf("Expected Roll PaperCost=%v, got %v", expectedPaperCost, res.PaperCost)
	}

	// Sheet fallback: if PaperRollPricePerM2 is 0, use sheet cost
	reqFallback := req
	reqFallback.PaperRollPricePerM2 = 0
	reqFallback.PaperCostPerUnit = 100.0
	resFallback, _ := CalculateJobPricing(reqFallback)
	if resFallback.PaperCost != 10000.0 {
		t.Errorf("Expected sheet fallback PaperCost=10000.0, got %v", resFallback.PaperCost)
	}
}

// TestSpoilageApplied verifies: NetInternalCost = Subtotal × (1 + SpoilagePercent).
func TestSpoilageApplied(t *testing.T) {
	req := baseReq()
	req.CustomFinishingOptions = nil
	req.SpoilagePercent = 0.05 // 5% spoilage

	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	expectedSpoilageCost := roundToTwoDecimals(res.Subtotal * 0.05)
	if res.SpoilageCost != expectedSpoilageCost {
		t.Errorf("Expected SpoilageCost=%v, got %v", expectedSpoilageCost, res.SpoilageCost)
	}

	expectedNetCost := roundToTwoDecimals(res.Subtotal + expectedSpoilageCost)
	if res.NetInternalCost != expectedNetCost {
		t.Errorf("Expected NetInternalCost=%v, got %v", expectedNetCost, res.NetInternalCost)
	}

	// Verify SalePrice uses NetInternalCost (not Subtotal)
	expectedSalePrice := roundToTwoDecimals(res.NetInternalCost / (1.0 - 0.35))
	if res.SalePrice != expectedSalePrice {
		t.Errorf("Expected SalePrice=%v, got %v", expectedSalePrice, res.SalePrice)
	}
}

// TestGrandTotalPipeline verifies: GrandTotal = (SalePrice × (1-Discount%)) × (1+Tax%).
func TestGrandTotalPipeline(t *testing.T) {
	req := baseReq()
	req.CustomFinishingOptions = nil
	req.DiscountPercent = 0.10 // 10% discount
	req.TaxPercent = 0.07      // 7% VAT

	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	expectedDiscount := roundToTwoDecimals(res.SalePrice * 0.10)
	if res.DiscountAmount != expectedDiscount {
		t.Errorf("Expected DiscountAmount=%v, got %v", expectedDiscount, res.DiscountAmount)
	}

	discountedPrice := roundToTwoDecimals(res.SalePrice - res.DiscountAmount)

	expectedTax := roundToTwoDecimals(discountedPrice * 0.07)
	if res.TaxAmount != expectedTax {
		t.Errorf("Expected TaxAmount=%v, got %v", expectedTax, res.TaxAmount)
	}

	// GrandTotal: allow 0.02 tolerance due to cascaded rounding (discount then tax)
	expectedGrandTotal := roundToTwoDecimals(discountedPrice + res.TaxAmount)
	if math.Abs(res.GrandTotal-expectedGrandTotal) > 0.02 {
		t.Errorf("Expected GrandTotal≈%v, got %v", expectedGrandTotal, res.GrandTotal)
	}

	// UnitPrice = GrandTotal / Quantity
	expectedUnit := roundToTwoDecimals(res.GrandTotal / float64(req.Quantity))
	if res.UnitPrice != expectedUnit {
		t.Errorf("Expected UnitPrice=%v, got %v", expectedUnit, res.UnitPrice)
	}

	t.Run("No_Discount_No_Tax", func(t *testing.T) {
		reqClean := baseReq()
		reqClean.CustomFinishingOptions = nil
		resClean, _ := CalculateJobPricing(reqClean)
		// GrandTotal should equal SalePrice when discount=0, tax=0
		if resClean.GrandTotal != resClean.SalePrice {
			t.Errorf("Expected GrandTotal == SalePrice when no discount/tax, got GT=%v SP=%v",
				resClean.GrandTotal, resClean.SalePrice)
		}
		if resClean.DiscountAmount != 0 {
			t.Errorf("Expected DiscountAmount=0, got %v", resClean.DiscountAmount)
		}
		if resClean.TaxAmount != 0 {
			t.Errorf("Expected TaxAmount=0, got %v", resClean.TaxAmount)
		}
	})
}


