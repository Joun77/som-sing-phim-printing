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
		SheetsPerPack:         1,
		InkCoverageKPercent:   5.0,  // 5% K
		InkCoverageCMYPercent: 10.0, // 10% CMY
		InkCostKPerMl:         250000.0,
		InkCostCMYPerMl:       250000.0,
		IsoYieldK:             4000.0,
		IsoYieldCMY:           4000.0,
		MachinePrice:          50000000,
		TargetTotalPages:      1000000,
		MaintenanceCostPerPage: 10.0,
		MaintenanceRatePercent: 20.0,
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
		TargetCurrency:      "LAK",
	}
}

// TestCalculateJobPricingA4Baseline verifies the A4 (S=1.0) cost breakdown.
func TestCalculateJobPricingA4Baseline(t *testing.T) {
	req := baseReq()
	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// AreaFactor for A4 = 210*297 / 62370 = 1.0
	if res.AreaFactor != 1.0 {
		t.Errorf("Expected AreaFactor 1.0 for A4, got %v", res.AreaFactor)
	}

	// Paper: 100 × 100 = 10,000 LAK
	if res.PaperCost != 10000.0 {
		t.Errorf("Expected PaperCost 10000.0, got %v", res.PaperCost)
	}

	// Ink K: (250,000 / 4,000) * (5 / 5) * 1.0 * 100 = 6,250 LAK
	if res.InkCostK != 6250.0 {
		t.Errorf("Expected InkCostK 6250.0, got %v", res.InkCostK)
	}
	// Ink CMY: (250,000 / 4,000) * (10 / 5) * 1.0 * 100 = 12,500 LAK
	if res.InkCostCMY != 12500.0 {
		t.Errorf("Expected InkCostCMY 12500.0, got %v", res.InkCostCMY)
	}
	if res.InkCost != 18750.0 {
		t.Errorf("Expected InkCost 18750.0, got %v", res.InkCost)
	}

	// Depreciation: (50M / 1M) × 1.0 × 100 = 5,000 LAK
	if res.DepreciationCost != 5000.0 {
		t.Errorf("Expected DepreciationCost 5000.0, got %v", res.DepreciationCost)
	}

	// Maintenance: (50 * 0.20 + 10) × 1.0 × 100 = 2,000 LAK
	if res.MaintenanceCost != 2000.0 {
		t.Errorf("Expected MaintenanceCost 2000.0, got %v", res.MaintenanceCost)
	}

	// MachineCost: 5000 + 2000 = 7,000 LAK
	if res.MachineCost != 7000.0 {
		t.Errorf("Expected MachineCost 7000.0, got %v", res.MachineCost)
	}

	// Custom Finishing: 150×100 + 2000 = 17,000 LAK
	if res.CustomFinishingCost != 17000.0 {
		t.Errorf("Expected CustomFinishingCost 17000.0, got %v", res.CustomFinishingCost)
	}

	// Labor: 15000 × 2 = 30,000 LAK
	if res.LaborCost != 30000.0 {
		t.Errorf("Expected LaborCost 30000.0, got %v", res.LaborCost)
	}

	// Direct: 10000 + 18750 + 6000 + 1000 + 17000 + 30000 = 82,750 LAK
	if res.DirectCost != 82750.0 {
		t.Errorf("Expected DirectCost 82750.0, got %v", res.DirectCost)
	}

	// Overhead: 82750 × 0.10 = 8275 LAK
	if res.OverheadCost != 8275.0 {
		t.Errorf("Expected OverheadCost 8275.0, got %v", res.OverheadCost)
	}

	// Subtotal (no spoilage) = 82750 + 8275 = 91,025 LAK
	if res.Subtotal != 91025.0 {
		t.Errorf("Expected Subtotal 91025.0, got %v", res.Subtotal)
	}

	// NetInternalCost = Subtotal × (1 + 0%) = 91,025 LAK
	if res.NetInternalCost != 91025.0 {
		t.Errorf("Expected NetInternalCost 91025.0 (no spoilage), got %v", res.NetInternalCost)
	}

	// SalePrice = 91025 / (1 - 0.35) = 91025 / 0.65 = 140,038.46 LAK (Standard 2 decimal places)
	if res.SalePrice != 140038.46 {
		t.Errorf("Expected SalePrice 140038.46, got %v", res.SalePrice)
	}

	// TotalBreakdown and UnitBreakdown checks
	if res.TotalBreakdown.PaperCost != 10000.0 {
		t.Errorf("Expected TotalBreakdown.PaperCost 10000.0, got %v", res.TotalBreakdown.PaperCost)
	}
	if res.UnitBreakdown.PaperCost != 100.0 {
		t.Errorf("Expected UnitBreakdown.PaperCost 100.0, got %v", res.UnitBreakdown.PaperCost)
	}
	if res.TotalBreakdown.DirectSubtotal != 82750.0 {
		t.Errorf("Expected TotalBreakdown.DirectSubtotal 82750.0, got %v", res.TotalBreakdown.DirectSubtotal)
	}
	if res.UnitBreakdown.DirectSubtotal != 827.5 {
		t.Errorf("Expected UnitBreakdown.DirectSubtotal 827.5, got %v", res.UnitBreakdown.DirectSubtotal)
	}

	// Grand Total (no discount, no tax) = SalePrice
	if res.GrandTotal != 140038.46 {
		t.Errorf("Expected GrandTotal 140038.46 (no discount/tax), got %v", res.GrandTotal)
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
		reqFallback.TargetCurrency = "THB"
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
	// A3: 297×420 mm → S = 297*420 / 62370 = 2.0
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
	reqFallback.SheetsPerPack = 1
	resFallback, _ := CalculateJobPricing(reqFallback)
	if resFallback.PaperCost != 10000.0 {
		t.Errorf("Expected sheet fallback PaperCost=10000.0, got %v", resFallback.PaperCost)
	}
}

// TestSpoilageApplied verifies: NetInternalCost = Subtotal × (1 + SpoilagePercent).
func TestSpoilageApplied(t *testing.T) {
	req := baseReq()
	req.TargetCurrency = "THB"
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
	req.TargetCurrency = "THB"
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

// TestSetupCostAndVolumeDiscounts tests the 3 required scenarios:
// 1. Single sheet (Quantity = 1): Full SetupCost added, 0% volume discount on margin.
// 2. Medium volume (Quantity = 500): Volume Discount Step 1 (10% reduction on margin).
// 3. Large volume (Quantity = 1000): Volume Discount Step 2 (20% reduction on margin).
func TestSetupCostAndVolumeDiscounts(t *testing.T) {
	t.Run("Scenario1_SingleSheet_SetupCostFull", func(t *testing.T) {
		req := baseReq()
		req.Quantity = 1
		req.SetupCost = 50000.0   // 50,000 LAK setup fee
		req.FinishingCost = 200.0  // 200 LAK per unit finishing
		req.BaseProfitPct = 30.0   // 30% base profit

		res, err := CalculateJobPricing(req)
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}

		if res.SetupCost != 50000.0 {
			t.Errorf("Expected SetupCost 50000.0, got %v", res.SetupCost)
		}
		if res.FinishingCost != 200.0 {
			t.Errorf("Expected FinishingCost 200.0 for 1 qty, got %v", res.FinishingCost)
		}
		if res.VolumeDiscountPercent != 0.0 {
			t.Errorf("Expected VolumeDiscountPercent 0.0 for qty=1, got %v", res.VolumeDiscountPercent)
		}
		if math.Abs(res.ProfitMargin-0.30) > 0.001 {
			t.Errorf("Expected ProfitMargin 0.30 for qty=1, got %v", res.ProfitMargin)
		}
	})

	t.Run("Scenario2_VolumeDiscountStep1_500Sheets", func(t *testing.T) {
		req := baseReq()
		req.Quantity = 500
		req.SetupCost = 50000.0
		req.FinishingCost = 200.0
		req.BaseProfitPct = 30.0

		res, err := CalculateJobPricing(req)
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}

		if res.VolumeDiscountPercent != 10.0 {
			t.Errorf("Expected VolumeDiscountPercent 10.0 for qty=500, got %v", res.VolumeDiscountPercent)
		}
		// Effective margin = 30% * (1 - 0.10) = 27% (0.27)
		expectedMargin := 0.27
		if math.Abs(res.ProfitMargin-expectedMargin) > 0.001 {
			t.Errorf("Expected effective ProfitMargin %v for qty=500, got %v", expectedMargin, res.ProfitMargin)
		}
		if res.UnitPrice <= 0 {
			t.Errorf("Expected valid UnitPrice, got %v", res.UnitPrice)
		}
	})

	t.Run("Scenario3_VolumeDiscountStep2_1000Sheets", func(t *testing.T) {
		req := baseReq()
		req.Quantity = 1000
		req.SetupCost = 50000.0
		req.FinishingCost = 200.0
		req.BaseProfitPct = 30.0

		res, err := CalculateJobPricing(req)
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}

		if res.VolumeDiscountPercent != 20.0 {
			t.Errorf("Expected VolumeDiscountPercent 20.0 for qty=1000, got %v", res.VolumeDiscountPercent)
		}
		// Effective margin = 30% * (1 - 0.20) = 24% (0.24)
		expectedMargin := 0.24
		if math.Abs(res.ProfitMargin-expectedMargin) > 0.001 {
			t.Errorf("Expected effective ProfitMargin %v for qty=1000, got %v", expectedMargin, res.ProfitMargin)
		}
		if res.UnitPrice <= 0 {
			t.Errorf("Expected valid UnitPrice, got %v", res.UnitPrice)
		}
	})
}

func TestValidateAndCalculateAllocations(t *testing.T) {
	allocations := []PrinterAllocation{
		{PrinterID: "p1", PrinterName: "Machine A", AllocatedPages: 6000, CostPerPage: 50.0, SubtotalCost: 300000.0},
		{PrinterID: "p2", PrinterName: "Machine B", AllocatedPages: 4000, CostPerPage: 60.0, SubtotalCost: 240000.0},
	}

	cost, err := ValidateAndCalculateAllocations(10000, allocations)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	expectedCost := 540000.0
	if cost != expectedCost {
		t.Errorf("Expected total machine cost %v, got %v", expectedCost, cost)
	}

	// Test mismatch quantity validation error
	_, errMismatch := ValidateAndCalculateAllocations(9000, allocations)
	if errMismatch == nil {
		t.Errorf("Expected error when total allocated (10000) != target quantity (9000), got nil")
	}
}

func TestLAKCurrencyDecimalPrecision(t *testing.T) {
	req := baseReq()
	req.TargetCurrency = "LAK"
	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if res.SalePrice != 140038.46 {
		t.Errorf("Expected 2 decimal precision SalePrice 140038.46 for LAK currency, got %v", res.SalePrice)
	}
	if res.GrandTotal != 140038.46 {
		t.Errorf("Expected 2 decimal precision GrandTotal 140038.46 for LAK currency, got %v", res.GrandTotal)
	}
}


func TestCalculateCutLayout(t *testing.T) {
	// A4 (210x297) cut into 90x54 business cards on parent sheet 330x480
	cuts := CalculateCutLayout(90, 54, 330, 480)
	if cuts < 20 {
		t.Errorf("Expected at least 20 cuts on 330x480 for 90x54 cards, got %d", cuts)
	}

	// 0 or negative dimensions should return 1
	if CalculateCutLayout(0, 54, 330, 480) != 1 {
		t.Errorf("Expected 1 for 0 width, got %d", CalculateCutLayout(0, 54, 330, 480))
	}
}

func TestMultiPrinterChannelAndFinishing(t *testing.T) {
	req := CalculationRequest{
		JobName:             "Agency Box Packaging 50k",
		Quantity:            50000,
		UnfoldedWidthMM:     210,
		UnfoldedHeightMM:    297,
		ParentSheetWidthMM:  650,
		ParentSheetHeightMM: 900,
		PaperCostPerUnit:    2500.0, // 2,500 LAK per parent sheet
		PlateCostPerUnit:    50000.0, // 50,000 LAK per plate
		PrintingProcesses: []PrinterProcessSetup{
			{
				PrinterAssetID: "PRN-OFFSET-01",
				ColorMode:      "SEPARATE_CHANNEL",
				ColorChannels: []ColorChannel{
					{ChannelName: "C", DensityPct: 80.0, IsSpotColor: false},
					{ChannelName: "M", DensityPct: 70.0, IsSpotColor: false},
					{ChannelName: "Y", DensityPct: 90.0, IsSpotColor: false},
					{ChannelName: "K", DensityPct: 60.0, IsSpotColor: false},
					{ChannelName: "PANTONE 185 C", DensityPct: 80.0, IsSpotColor: true},
				},
				AllocatedPages: 50000,
				CostPerPage:    50.0,
			},
		},
		FinishingProcesses: []FinishingProcessSetup{
			{
				FinishingType:          "LAMINATE_MATTE",
				MachineAssetID:         "MACH-LAM-01",
				MachineHourlyRate:      120000.0,
				EstimatedSetupTimeMins: 30,
				EstimatedRunTimeMins:   90,
				UnitCost:               100.0,
			},
			{
				FinishingType:          "DIE_CUT",
				MachineAssetID:         "MACH-DIECUT-02",
				MachineHourlyRate:      150000.0,
				EstimatedSetupTimeMins: 45,
				EstimatedRunTimeMins:   120,
				UnitCost:               150.0,
			},
		},
		OverheadPercent: 0.10,
		BaseProfitPct:   30.0,
		TargetCurrency:  "LAK",
	}

	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("Unexpected calculation error: %v", err)
	}

	// 5 channels = 5 plates * 50,000 = 250,000 LAK
	if res.PlateCost != 250000.0 {
		t.Errorf("Expected plate cost 250,000 LAK for 5 color channels, got %v", res.PlateCost)
	}

	// Depreciation: 50,000 * 50 = 2,500,000 LAK
	if res.DepreciationCost != 2500000.0 {
		t.Errorf("Expected depreciation cost 2,500,000 LAK, got %v", res.DepreciationCost)
	}

	// Finishing cost should include unit cost + machine hours
	if res.FinishingCost <= 0 {
		t.Errorf("Expected positive finishing cost, got %v", res.FinishingCost)
	}

	if res.GrandTotal <= 0 {
		t.Errorf("Expected positive grand total, got %v", res.GrandTotal)
	}
}

func TestSpineWidthCalculation(t *testing.T) {
	// 120 pages on 80gsm Green Read: (120/2 * 0.105) + 0.8 = 6.3 + 0.8 = 7.1 mm
	spine120 := CalculateSpineWidthMM(120, 80)
	if spine120 != 7.1 {
		t.Errorf("Expected spine width 7.1 mm for 120 pages, got %v", spine120)
	}

	// 0 pages should return 0
	if CalculateSpineWidthMM(0, 80) != 0.0 {
		t.Errorf("Expected 0.0 mm for 0 pages, got %v", CalculateSpineWidthMM(0, 80))
	}
}

func TestBindingCostCalculations(t *testing.T) {
	// Perfect hot glue consumable = 350 LAK
	glueCost := CalculateBindingCostLAK("PERFECT_HOT_GLUE", 0, 0)
	if glueCost != 350.0 {
		t.Errorf("Expected 350 LAK for PERFECT_HOT_GLUE without depreciation, got %v", glueCost)
	}

	// Saddle stitch = 100 LAK
	saddleCost := CalculateBindingCostLAK("SADDLE_STITCH", 0, 0)
	if saddleCost != 100.0 {
		t.Errorf("Expected 100 LAK for SADDLE_STITCH, got %v", saddleCost)
	}

	// Wire-O = 2500 LAK
	wireOCost := CalculateBindingCostLAK("WIRE_O", 0, 0)
	if wireOCost != 2500.0 {
		t.Errorf("Expected 2500 LAK for WIRE_O, got %v", wireOCost)
	}

	// Calendar = 3500 LAK
	calendarCost := CalculateBindingCostLAK("CALENDAR", 0, 0)
	if calendarCost != 3500.0 {
		t.Errorf("Expected 3500 LAK for CALENDAR, got %v", calendarCost)
	}

	// Machine depreciation: 10,000,000 * 1.10 / 100,000 = 110 LAK + 350 = 460 LAK
	glueWithMach := CalculateBindingCostLAK("PERFECT_HOT_GLUE", 10000000, 100000)
	if glueWithMach != 460.0 {
		t.Errorf("Expected 460 LAK for glue with machine depreciation, got %v", glueWithMach)
	}
}

func TestBilingualBookDynamicPricingWithPreflight(t *testing.T) {
	// Item 1: 100 books, 120 pages A5, Avg K 7.5%, CMY 7.35%
	req := CalculationRequest{
		JobName:          "Business Handbook - Lao",
		Quantity:         100,
		PageCount:        120,
		JobWidth:         148, // A5
		JobHeight:        210, // A5
		PaperCostPerUnit: 150.0,
		SheetsPerPack:    1,
		AvgCovK:          7.5,
		AvgCovC:          2.15,
		AvgCovM:          3.40,
		AvgCovY:          1.80,
		BindingType:      "PERFECT_HOT_GLUE",
		SpoilagePercent:  0.05, // 5% spoilage
		BaseProfitPct:    25.0,
		TargetCurrency:   "LAK",
	}

	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("Unexpected error calculating book pricing: %v", err)
	}

	// Binding cost for 100 books @ 350 = 35,000 LAK
	if res.BindingCost != 35000.0 {
		t.Errorf("Expected BindingCost 35,000 LAK, got %v", res.BindingCost)
	}

	// Spoilage cost should be > 0 and ~5%
	if res.SpoilageCost <= 0 {
		t.Errorf("Expected positive SpoilageCost, got %v", res.SpoilageCost)
	}

	if res.GrandTotal <= 0 {
		t.Errorf("Expected positive GrandTotal, got %v", res.GrandTotal)
	}
}

func TestSmallItemOffcutRecommendation(t *testing.T) {
	req := CalculationRequest{
		JobName:          "Luxury Business Cards",
		Quantity:         500,
		JobWidth:         90.0,
		JobHeight:        54.0,
		PaperSku:         "PAP-CRD-350",
		PaperName:        "Art Card 350g",
		PaperCostPerUnit: 250000.0,
		SheetsPerPack:    250,
		TargetCurrency:   "LAK",
	}

	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("Calculation failed: %v", err)
	}

	if !res.OffcutRecommended {
		t.Errorf("Expected OffcutRecommended to be true for 90x54mm card matching offcut stock")
	}
	if res.UsedOffcutLotID != "OFF-CRD350-01" {
		t.Errorf("Expected used offcut lot OFF-CRD350-01, got %s", res.UsedOffcutLotID)
	}
	if res.OffcutSavingsPercent != 35.0 {
		t.Errorf("Expected 35%% savings, got %f", res.OffcutSavingsPercent)
	}
}

func TestCalculateMachineOverhead(t *testing.T) {
	// Standard Test: 50M LAK machine, 500K life pages, 20% maintenance -> 120 LAK/sheet
	// Depreciation = 50,000,000 / 500,000 = 100 LAK/sheet
	// Maintenance  = 100 * (20 / 100) = 20 LAK/sheet
	// Total        = 100 + 20 = 120 LAK/sheet
	deprec, maint, total := CalculateMachineOverhead(50000000.0, 500000, 20.0)

	if deprec != 100.0 {
		t.Errorf("Expected depreciation 100.0, got %f", deprec)
	}
	if maint != 20.0 {
		t.Errorf("Expected maintenance 20.0, got %f", maint)
	}
	if total != 120.0 {
		t.Errorf("Expected total machine cost 120.0, got %f", total)
	}

	// Boundary Test: life_pages = 0 (Guard against division by zero, no panic)
	deprec0, maint0, total0 := CalculateMachineOverhead(50000000.0, 0, 20.0)
	if deprec0 != 0 || maint0 != 0 || total0 != 0 {
		t.Errorf("Expected 0 for 0 lifetime pages, got deprec=%f, maint=%f, total=%f", deprec0, maint0, total0)
	}

	// Boundary Test: negative lifetime pages
	deprecNeg, maintNeg, totalNeg := CalculateMachineOverhead(50000000.0, -100, 20.0)
	if deprecNeg != 0 || maintNeg != 0 || totalNeg != 0 {
		t.Errorf("Expected 0 for negative lifetime pages, got deprec=%f, maint=%f, total=%f", deprecNeg, maintNeg, totalNeg)
	}

	// Boundary Test: zero price
	deprecZeroPrice, maintZeroPrice, totalZeroPrice := CalculateMachineOverhead(0.0, 500000, 20.0)
	if deprecZeroPrice != 0 || maintZeroPrice != 0 || totalZeroPrice != 0 {
		t.Errorf("Expected 0 for zero price, got deprec=%f, maint=%f, total=%f", deprecZeroPrice, maintZeroPrice, totalZeroPrice)
	}
}






