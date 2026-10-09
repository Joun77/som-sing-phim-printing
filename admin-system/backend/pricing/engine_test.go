package pricing

import (
	"math"
	"testing"
	"time"

	"somsing.local/backend/inventory"
)

// baseReq is the shared A4 baseline request used across all tests.
func baseReq() CalculationRequest {
	return CalculationRequest{
		JobName:                "Professional booklet",
		Quantity:               100,
		PaperSku:               "paper-a4-80",
		PaperCostPerUnit:       100.0, // 100 LAK per sheet
		PaperFormat:            "sheet",
		SheetsPerPack:          1,
		InkCoverageKPercent:    Float64Ptr(5.0),  // 5% K
		InkCoverageCMYPercent:  Float64Ptr(10.0), // 10% CMY
		InkCostKPerMl:          250000.0,
		InkCostCMYPerMl:        250000.0,
		IsoYieldK:              4000.0,
		IsoYieldCMY:            4000.0,
		MachinePrice:           50000000,
		TargetTotalPages:       1000000,
		MaintenanceCostPerPage: 10.0,
		MaintenanceRatePercent: 20.0,
		JobWidth:               210, // A4
		JobHeight:              297,
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
		req.FinishingCost = 200.0 // 200 LAK per unit finishing
		req.BaseProfitPct = 30.0  // 30% base profit

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
		PaperCostPerUnit:    2500.0,  // 2,500 LAK per parent sheet
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

	// Hardcover Case Binding = 15000 LAK
	hardcoverCost := CalculateBindingCostLAK("HARDCOVER_CASE_BINDING", 0, 0)
	if hardcoverCost != 15000.0 {
		t.Errorf("Expected 15000 LAK for HARDCOVER_CASE_BINDING, got %v", hardcoverCost)
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
		AvgCovK:          Float64Ptr(7.5),
		AvgCovC:          Float64Ptr(2.15),
		AvgCovM:          Float64Ptr(3.40),
		AvgCovY:          Float64Ptr(1.80),
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
	inventory.RegisterOffcutItem(inventory.Offcut{
		ID:               "OFF-CRD350-01",
		ParentMaterialID: "PAP-CRD-350",
		Name:             "Art Card 350g Card Strips",
		WidthMm:          120,
		LengthMm:         250,
		Quantity:         1500,
		Location:         "Shelf A-02",
		CreatedAt:        time.Now(),
	})
	defer inventory.ClearOffcutStore()

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

func TestElectricityAndGuillotineCuttingPricing(t *testing.T) {
	req := baseReq()
	req.MachinePowerWatts = 3000.0   // 3 kW
	req.MachineRuntimeHours = 2.0    // 2 hours -> 6 kWh
	req.RequiresGuillotineCut = true // Flat 10,000 LAK

	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Electricity: 3 kW * 2h * 1,700 LAK = 10,200 LAK
	expectedElectricity := 10200.0
	if res.ElectricityCost != expectedElectricity {
		t.Errorf("Expected ElectricityCost %f, got %f", expectedElectricity, res.ElectricityCost)
	}

	// Guillotine Cutting fee: 10,000 LAK
	expectedCutting := 10000.0
	if res.GuillotineCuttingCost != expectedCutting {
		t.Errorf("Expected GuillotineCuttingCost %f, got %f", expectedCutting, res.GuillotineCuttingCost)
	}
}

func Test31x43ParentSheetImpositionPricing(t *testing.T) {
	req := baseReq()
	req.Use31x43ParentSheet = true
	req.JobWidth = 148 // A5
	req.JobHeight = 210
	req.CutsPerSheet = 0 // Auto calculate from 31x43" (787 x 1092 mm)

	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if res.Imposition == nil {
		t.Fatal("Expected imposition grid to be calculated")
	}

	if res.Imposition.TotalCuts <= 0 {
		t.Errorf("Expected positive total cuts on 31x43 sheet, got %d", res.Imposition.TotalCuts)
	}
	if res.Imposition.TotalCuts < 20 {
		t.Errorf("Expected at least 20 cuts on 31x43 sheet for A5, got %d", res.Imposition.TotalCuts)
	}
}

func TestRigidBoardSubstratePricing(t *testing.T) {
	req := baseReq()
	req.IsRigidSubstrate = true
	req.RigidBoardPricePerM2 = 80000.0 // 80,000 LAK / m² (e.g. 5mm foam board)
	req.JobWidth = 500                 // 0.5m
	req.JobHeight = 1000               // 1.0m -> 0.5 m² per piece
	req.Quantity = 10                  // 10 pieces -> 5.0 m² total

	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Paper/Substrate cost: 80,000 LAK * 0.5 m² * 10 = 400,000 LAK
	expectedCost := 400000.0
	if res.PaperCost != expectedCost {
		t.Errorf("Expected PaperCost %f for rigid board, got %f", expectedCost, res.PaperCost)
	}
}

func TestPackagingPricing(t *testing.T) {
	req := baseReq()
	req.IncludePackaging = true
	req.PackagingType = "BOX_LARGE" // 5,000 LAK per unit
	req.Quantity = 20

	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// 5,000 * 20 = 100,000 LAK
	expectedPackaging := 100000.0
	if res.PackagingCost != expectedPackaging {
		t.Errorf("Expected PackagingCost %f, got %f", expectedPackaging, res.PackagingCost)
	}
}

func TestPaperCostIsPerSheetDirect(t *testing.T) {
	// Verifies that when PaperCostIsPerSheet is true, a sheet cost from warehouse inventory
	// (e.g. 184 LAK/sheet) is NOT divided by 500 even when SheetsPerPack is unspecified (0)
	req := baseReq()
	req.Quantity = 500
	req.CutsPerSheet = 20 // 500 / 20 = 25 parent sheets
	req.SpoilagePercent = 0.0
	req.PaperCostPerUnit = 184.0 // 184 LAK per parent sheet directly from warehouse
	req.PaperCostIsPerSheet = true
	req.SheetsPerPack = 0 // Unspecified, should NOT default to dividing by 500

	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Expected: 25 parent sheets * 184 LAK = 4,600 LAK (NOT 9.2 LAK from 4600/500)
	expectedPaperCost := 4600.0
	if res.PaperCost != expectedPaperCost {
		t.Errorf("Expected PaperCost %f (direct sheet cost), got %f (likely double divided by 500)", expectedPaperCost, res.PaperCost)
	}
}

func TestPricingThresholdLogic(t *testing.T) {
	// Scenario 1: Standard specs -> GrandTotal (~140,038 LAK) is below BaseFloorPrice (200,000 LAK)
	// Should return EffectiveSalePrice = BaseFloorPrice (200,000), IsThresholdExceeded = false
	reqFloor := baseReq()
	reqFloor.Quantity = 100
	reqFloor.BaseFloorPrice = 200000.0 // Minimum floor of 200,000 LAK
	reqFloor.ThresholdMode = "FLOOR_OR_ACTUAL"

	resFloor, err := CalculateJobPricing(reqFloor)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if resFloor.EffectiveSalePrice != 200000.0 {
		t.Errorf("Expected EffectiveSalePrice to be 200000.0 LAK (floor price), got %v", resFloor.EffectiveSalePrice)
	}
	if resFloor.IsThresholdExceeded {
		t.Errorf("Expected IsThresholdExceeded to be false when actual cost <= floor, got true")
	}
	if resFloor.ThresholdSurcharge != 0.0 {
		t.Errorf("Expected ThresholdSurcharge to be 0.0, got %v", resFloor.ThresholdSurcharge)
	}

	// Scenario 2: Standard specs -> GrandTotal (~140,038 LAK) exceeds BaseFloorPrice (100,000 LAK)
	// Should return EffectiveSalePrice = GrandTotal, IsThresholdExceeded = true, ThresholdSurcharge = GrandTotal - BaseFloorPrice
	reqExceeded := baseReq()
	reqExceeded.Quantity = 100
	reqExceeded.BaseFloorPrice = 100000.0 // Floor of 100,000 LAK
	reqExceeded.ThresholdMode = "FLOOR_OR_ACTUAL"

	resExceeded, err := CalculateJobPricing(reqExceeded)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if resExceeded.EffectiveSalePrice <= 100000.0 {
		t.Errorf("Expected EffectiveSalePrice to exceed floor price of 100000.0, got %v", resExceeded.EffectiveSalePrice)
	}
	if !resExceeded.IsThresholdExceeded {
		t.Errorf("Expected IsThresholdExceeded to be true when actual cost > floor, got false")
	}
	expectedSurcharge := resExceeded.GrandTotal - 100000.0
	if math.Abs(resExceeded.ThresholdSurcharge-expectedSurcharge) > 0.01 {
		t.Errorf("Expected ThresholdSurcharge to be %v, got %v", expectedSurcharge, resExceeded.ThresholdSurcharge)
	}
}

func TestCoverageBaselineThreshold(t *testing.T) {
	// Baseline coverage is 10%, Base Floor Price is 150,000 LAK
	// Case 1: Low coverage (3% K, 0% CMY) -> total cost + margin is below 150,000 LAK -> EffectiveSalePrice = 150,000 LAK
	reqLow := baseReq()
	reqLow.BaselineCoveragePercent = 10.0
	reqLow.BaseFloorPrice = 150000.0
	reqLow.ThresholdMode = "FLOOR_OR_ACTUAL"
	reqLow.InkCoverageKPercent = Float64Ptr(3.0)
	reqLow.InkCoverageCMYPercent = Float64Ptr(0.0)

	resLow, err := CalculateJobPricing(reqLow)
	if err != nil {
		t.Fatalf("unexpected error for low coverage test: %v", err)
	}

	if resLow.EffectiveSalePrice != 150000.0 {
		t.Errorf("expected EffectiveSalePrice to be floor price 150000, got %f", resLow.EffectiveSalePrice)
	}
	if resLow.IsThresholdExceeded {
		t.Errorf("expected IsThresholdExceeded to be false for low coverage")
	}

	// Case 2: High coverage (40% K, 80% CMY) -> actual dynamic cost + margin far exceeds 150,000 LAK
	reqHigh := baseReq()
	reqHigh.BaselineCoveragePercent = 10.0
	reqHigh.BaseFloorPrice = 150000.0
	reqHigh.ThresholdMode = "FLOOR_OR_ACTUAL"
	reqHigh.InkCoverageKPercent = Float64Ptr(40.0)
	reqHigh.InkCoverageCMYPercent = Float64Ptr(80.0)

	resHigh, err := CalculateJobPricing(reqHigh)
	if err != nil {
		t.Fatalf("unexpected error for high coverage test: %v", err)
	}

	if resHigh.EffectiveSalePrice <= 150000.0 {
		t.Errorf("expected EffectiveSalePrice for high coverage to exceed 150000, got %f", resHigh.EffectiveSalePrice)
	}
	if !resHigh.IsThresholdExceeded {
		t.Errorf("expected IsThresholdExceeded to be true for high coverage")
	}
	if resHigh.ThresholdSurcharge <= 0 {
		t.Errorf("expected positive ThresholdSurcharge for high coverage, got %f", resHigh.ThresholdSurcharge)
	}
}

func TestBaselineCoveragePolicySensitivity(t *testing.T) {
	// Proves that BaselineCoveragePercent genuinely governs the threshold policy,
	// keeping identical ink coverage, identical ink costs, identical paper, and identical quantity.
	// Actual job coverage: 15% total (5% K + 10% CMY)
	// Base Floor Price: 130,000 LAK (below dynamic price 140,038.46 LAK)

	// Case A: Product offers 20% Baseline Coverage (Job 15% <= Baseline 20%)
	// Policy must award Base Floor Price (130,000 LAK) with IsThresholdExceeded = false
	reqA := baseReq()
	reqA.Quantity = 100
	reqA.BaseFloorPrice = 130000.0
	reqA.ThresholdMode = "FLOOR_OR_ACTUAL"
	reqA.InkCoverageKPercent = Float64Ptr(5.0)
	reqA.InkCoverageCMYPercent = Float64Ptr(10.0)
	reqA.BaselineCoveragePercent = 20.0

	resA, err := CalculateJobPricing(reqA)
	if err != nil {
		t.Fatalf("unexpected error for reqA: %v", err)
	}

	// Case B: Same exact product & job, but Baseline Coverage is only 10% (Job 15% > Baseline 10%)
	// Policy must trigger Threshold Exceeded (IsThresholdExceeded = true) and charge dynamic price (140,038.46 LAK > 130,000 LAK)
	reqB := baseReq()
	reqB.Quantity = 100
	reqB.BaseFloorPrice = 130000.0
	reqB.ThresholdMode = "FLOOR_OR_ACTUAL"
	reqB.InkCoverageKPercent = Float64Ptr(5.0)
	reqB.InkCoverageCMYPercent = Float64Ptr(10.0)
	reqB.BaselineCoveragePercent = 10.0

	resB, err := CalculateJobPricing(reqB)
	if err != nil {
		t.Fatalf("unexpected error for reqB: %v", err)
	}

	// 1. Verify that raw ink costs and GrandTotal are 100% identical between Case A and Case B
	if resA.InkCost != resB.InkCost || resA.InkCostK != resB.InkCostK || resA.InkCostCMY != resB.InkCostCMY {
		t.Fatalf("Ink costs must be 100%% identical (A=%v, B=%v) to prove baseline sensitivity without ink cost variance", resA.InkCost, resB.InkCost)
	}
	if resA.GrandTotal != resB.GrandTotal {
		t.Fatalf("GrandTotal before threshold must be 100%% identical (A=%v, B=%v)", resA.GrandTotal, resB.GrandTotal)
	}

	// 2. Case A (Coverage <= Baseline): EffectiveSalePrice must equal BaseFloorPrice and threshold NOT exceeded
	if resA.IsThresholdExceeded {
		t.Errorf("Case A (15%% coverage <= 20%% baseline): Expected IsThresholdExceeded to be false, got true")
	}
	if resA.EffectiveSalePrice != 130000.0 {
		t.Errorf("Case A (15%% coverage <= 20%% baseline): Expected EffectiveSalePrice to be floor price 130000.0, got %v", resA.EffectiveSalePrice)
	}
	if resA.ThresholdSurcharge != 0.0 {
		t.Errorf("Case A (15%% coverage <= 20%% baseline): Expected ThresholdSurcharge 0, got %v", resA.ThresholdSurcharge)
	}

	// 3. Case B (Coverage > Baseline): EffectiveSalePrice must be dynamic (> BaseFloorPrice) and threshold exceeded
	if !resB.IsThresholdExceeded {
		t.Errorf("Case B (15%% coverage > 10%% baseline): Expected IsThresholdExceeded to be true, got false")
	}
	if resB.EffectiveSalePrice <= 130000.0 {
		t.Errorf("Case B (15%% coverage > 10%% baseline): Expected EffectiveSalePrice > 130000.0, got %v", resB.EffectiveSalePrice)
	}
	if resB.ThresholdSurcharge <= 0.0 {
		t.Errorf("Case B (15%% coverage > 10%% baseline): Expected positive ThresholdSurcharge, got %v", resB.ThresholdSurcharge)
	}
}

func TestManualSheetCountOverrideAndImpositionFlexibility(t *testing.T) {
	req := CalculationRequest{
		JobName:             "Flyer A4 on A3 Sheet",
		Quantity:            100,
		JobWidth:            210,
		JobHeight:           297,
		PaperCostPerUnit:    1000,
		PaperCostIsPerSheet: true,
		CutsPerSheet:        2,
		SpoilagePercent:     0.10,
	}

	// 1. Without manual override: 100 / 2 = 50 + 10% spoil = 55 sheets
	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("unexpected calculation error: %v", err)
	}
	expectedPaperCost := 55.0 * 1000.0
	if res.PaperCost != expectedPaperCost {
		t.Errorf("Expected auto paper cost %v, got %v", expectedPaperCost, res.PaperCost)
	}

	// 2. With manual override: override to exactly 60 sheets
	req.ManualSheetCount = 60
	resOverride, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("unexpected calculation error with override: %v", err)
	}
	expectedOverrideCost := 60.0 * 1000.0
	if resOverride.PaperCost != expectedOverrideCost {
		t.Errorf("Expected manual override paper cost %v, got %v", expectedOverrideCost, resOverride.PaperCost)
	}
}

func TestZeroCoveragePreservation(t *testing.T) {
	req := CalculationRequest{
		JobName:          "Mono K Job with 0 CMY Channels",
		Quantity:         100,
		JobWidth:         210,
		JobHeight:        297,
		PaperCostPerUnit: 500,
		InkCostKPerMl:    200000,
		InkCostCMYPerMl:  300000,
		IsoYieldK:        5000,
		IsoYieldCMY:      5000,
		PrintingProcesses: []PrinterProcessSetup{
			{
				ColorMode: "SEPARATE_CHANNEL",
				ColorChannels: []ColorChannel{
					{ChannelName: "C", DensityPct: 0.0},
					{ChannelName: "M", DensityPct: 0.0},
					{ChannelName: "Y", DensityPct: 0.0},
					{ChannelName: "K", DensityPct: 20.0},
				},
			},
		},
	}

	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("unexpected calculation error: %v", err)
	}

	if res.InkCostCMY != 0.0 {
		t.Errorf("Expected InkCostCMY to be 0 for 0%% coverage, got %v", res.InkCostCMY)
	}
	if res.InkCostK <= 0.0 {
		t.Errorf("Expected positive InkCostK for 20%% K coverage, got %v", res.InkCostK)
	}
	if res.InkCost != res.InkCostK {
		t.Errorf("Expected Total InkCost (%v) to equal InkCostK (%v)", res.InkCost, res.InkCostK)
	}
}

func TestPrintedAreaInkCalculation_DecoupledFromPaperStock(t *testing.T) {
	// 100 copies of A4 (210 x 297 mm), 15% K coverage
	baseReq := CalculationRequest{
		JobName:               "A4 Flyer",
		Quantity:              100,
		JobWidth:              210,
		JobHeight:             297,
		InkCostKPerMl:         250000,
		IsoYieldK:             4000,
		InkCoverageKPercent:   Float64Ptr(15.0),
		InkCoverageCMYPercent: Float64Ptr(0.0),
	}

	// Case 1: 1 piece per sheet
	reqSingle := baseReq
	reqSingle.CutsPerSheet = 1
	resSingle, err := CalculateJobPricing(reqSingle)
	if err != nil {
		t.Fatalf("unexpected error for single-up: %v", err)
	}

	// Case 2: 2 pieces per sheet (e.g. A4 on A3 stock)
	reqTwoUp := baseReq
	reqTwoUp.CutsPerSheet = 2
	resTwoUp, err := CalculateJobPricing(reqTwoUp)
	if err != nil {
		t.Fatalf("unexpected error for two-up: %v", err)
	}

	// The ink cost for 100 A4 flyers MUST be identical regardless of whether 1 cut or 2 cuts per stock sheet is used!
	if math.Abs(resSingle.InkCostK-resTwoUp.InkCostK) > 0.01 {
		t.Errorf("Ink cost must be decoupled from sheet cuts: 1-up ink=%v, 2-up ink=%v", resSingle.InkCostK, resTwoUp.InkCostK)
	}
}

// ── SCENARIO 1 & 2: Zero Coverage Preservation Across All Modes & Negative Rejection ──

func TestZeroCoverage_AverageDensityMode_NoOverwrite(t *testing.T) {
	// Explicit 0.0% AverageDensity must NOT be overwritten to 100% (verifies fix for line 718 bug)
	req := CalculationRequest{
		JobName:          "Zero Coverage Average Density Test",
		Quantity:         100,
		JobWidth:         210,
		JobHeight:        297,
		PaperCostPerUnit: 500,
		InkCostKPerMl:    250000,
		InkCostCMYPerMl:  250000,
		IsoYieldK:        4000,
		IsoYieldCMY:      4000,
		PrintingProcesses: []PrinterProcessSetup{
			{
				ColorMode:      "AVERAGE",
				AverageDensity: Float64Ptr(0.0), // Explicit zero
				AllocatedPages: 100,
			},
		},
	}

	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if res.InkCost != 0.0 {
		t.Errorf("Expected InkCost to be 0 for explicit 0.0%% average density, got %v", res.InkCost)
	}
	if res.InkCostK != 0.0 || res.InkCostCMY != 0.0 {
		t.Errorf("Expected InkCostK and InkCostCMY to be 0, got K=%v, CMY=%v", res.InkCostK, res.InkCostCMY)
	}
}

func TestZeroCoverage_TopLevelPreflight_ExplicitZeroCMY(t *testing.T) {
	// Preflight measured 0% on C, M, Y and 15% on K
	req := CalculationRequest{
		JobName:          "Preflight Zero CMY Test",
		Quantity:         100,
		JobWidth:         210,
		JobHeight:        297,
		PaperCostPerUnit: 500,
		InkCostKPerMl:    250000,
		InkCostCMYPerMl:  250000,
		IsoYieldK:        4000,
		IsoYieldCMY:      4000,
		AvgCovC:          Float64Ptr(0.0),
		AvgCovM:          Float64Ptr(0.0),
		AvgCovY:          Float64Ptr(0.0),
		AvgCovK:          Float64Ptr(15.0),
	}

	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if res.InkCostCMY != 0.0 {
		t.Errorf("Expected InkCostCMY to be 0.0, got %v", res.InkCostCMY)
	}
	if res.InkCostK <= 0.0 {
		t.Errorf("Expected positive InkCostK, got %v", res.InkCostK)
	}
	if res.InkCost != res.InkCostK {
		t.Errorf("Expected Total InkCost (%v) == InkCostK (%v)", res.InkCost, res.InkCostK)
	}
}

func TestNegativeCoverage_RejectedWithHTTP400(t *testing.T) {
	// Negative coverage must return INVALID_COVERAGE error (not act as sentinel)
	req := CalculationRequest{
		JobName:          "Negative Coverage Test",
		Quantity:         100,
		JobWidth:         210,
		JobHeight:        297,
		PaperCostPerUnit: 500,
		AvgCovC:          Float64Ptr(-5.0),
	}

	_, err := CalculateJobPricing(req)
	if err == nil {
		t.Fatalf("Expected error for negative coverage, got nil")
	}
}

// ── SCENARIO 3: R1 Odd Duplex Decoupled Sheets and Impressions ──

func TestOddDuplex_DecoupledSheetsAndImpressions(t *testing.T) {
	// 3-page booklet, double-sided (duplex), quantity 100 copies
	// Physical paper sheets: ceil(3 / 2) = 2 sheets per copy -> 200 sheets total
	// Ink impressions: 3 pages per copy -> 300 impressions total
	// The 4th side is blank -> 0 ink, not 4 sides!
	req := CalculationRequest{
		JobName:               "3-Page Duplex Booklet",
		Quantity:              100,
		PageCount:             3,
		IsDoubleSided:         true,
		CutsPerSheet:          1,
		JobWidth:              210,
		JobHeight:             297,
		PaperCostPerUnit:      100, // 100 LAK per sheet
		PaperCostIsPerSheet:   true,
		InkCostKPerMl:         250000,
		InkCostCMYPerMl:       250000,
		IsoYieldK:             4000,
		IsoYieldCMY:           4000,
		InkCoverageKPercent:   Float64Ptr(5.0),
		InkCoverageCMYPercent: Float64Ptr(0.0), // Mono job for clear arithmetic
	}

	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// 1. Paper sheets check: 2 sheets/copy * 100 = 200 sheets * 100 LAK = 20,000 LAK
	expectedPaperCost := 200.0 * 100.0
	if res.PaperCost != expectedPaperCost {
		t.Errorf("Expected PaperCost %v (200 physical sheets), got %v", expectedPaperCost, res.PaperCost)
	}

	// 2. Ink impressions check: exactly 3 pages * 100 = 300 impressions
	// (250,000 / 4,000) * (5 / 5) * 1.0 * 300 = 18,750 LAK
	expectedInkCost := (250000.0 / 4000.0) * (5.0 / 5.0) * 1.0 * 300.0
	if math.Abs(res.InkCostK-expectedInkCost) > 0.01 {
		t.Errorf("Expected InkCostK %v (300 impressions), got %v (old bug produced 400 impressions: 25,000 LAK)", expectedInkCost, res.InkCostK)
	}
}

// ── SCENARIO 4: R3 Mixed Color and Mono Page Populations ──

func TestMixedColorAndMonoPages_PopulationSplit(t *testing.T) {
	// 10-page document, quantity 100 copies
	// 1 color page (C: 20%, M: 15%, Y: 10%, K: 5%)
	// 9 mono pages (K: 8%, CMY: 0%)
	colorPages := 1
	monoPages := 9
	req := CalculationRequest{
		JobName:               "10-Page Mixed Report",
		Quantity:              100,
		PageCount:             10,
		ColorPagesCount:       &colorPages,
		MonoPagesCount:        &monoPages,
		JobWidth:              210,
		JobHeight:             297,
		PaperCostPerUnit:      100,
		PaperCostIsPerSheet:   true,
		InkCostKPerMl:         250000,
		InkCostCMYPerMl:       250000,
		IsoYieldK:             4000,
		IsoYieldCMY:           4000,
		AvgCovC:               Float64Ptr(20.0),
		AvgCovM:               Float64Ptr(15.0),
		AvgCovY:               Float64Ptr(10.0),
		AvgCovK:               Float64Ptr(5.0),  // Color page K
		MonoAvgCovK:           Float64Ptr(8.0),  // Mono pages K
	}

	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// CMY ink: charged strictly on 1 color page * 100 = 100 impressions
	// (250,000 / 4,000) * ((20 + 15 + 10) / 5) * 1.0 * 100 = 62.5 * 9 * 100 = 56,250 LAK
	expectedCMYCost := (250000.0 / 4000.0) * (45.0 / 5.0) * 1.0 * 100.0
	if math.Abs(res.InkCostCMY-expectedCMYCost) > 0.01 {
		t.Errorf("Expected InkCostCMY %v (100 impressions), got %v (old bug charged 1000 impressions: 562,500 LAK)", expectedCMYCost, res.InkCostCMY)
	}

	// K ink: 100 color impressions * 5% + 900 mono impressions * 8%
	// Color K: 62.5 * (5/5) * 100 = 6,250 LAK
	// Mono K: 62.5 * (8/5) * 900 = 90,000 LAK
	// Total K: 96,250 LAK
	expectedKCost := 6250.0 + 90000.0
	if math.Abs(res.InkCostK-expectedKCost) > 0.01 {
		t.Errorf("Expected InkCostK %v, got %v", expectedKCost, res.InkCostK)
	}

	expectedTotalInk := expectedCMYCost + expectedKCost
	if math.Abs(res.InkCost-expectedTotalInk) > 0.01 {
		t.Errorf("Expected Total InkCost %v, got %v", expectedTotalInk, res.InkCost)
	}
}

// ── SCENARIO 5: Multi-Process Routing (Color Press vs Mono Duplicator) ──

func TestMultiProcessRouting_ColorAndMonoPresses(t *testing.T) {
	// Allocation 1: Digital Color Press prints 100 color impressions
	// Allocation 2: High-speed Mono press prints 900 mono impressions
	req := CalculationRequest{
		JobName:          "Multi-Process Split Production",
		Quantity:         100,
		PageCount:        10,
		JobWidth:         210,
		JobHeight:        297,
		PaperCostPerUnit: 100,
		InkCostKPerMl:    250000,
		InkCostCMYPerMl:  250000,
		IsoYieldK:        4000,
		IsoYieldCMY:      4000,
		PrintingProcesses: []PrinterProcessSetup{
			{
				PrinterAssetID: "PRN-COLOR-01",
				ColorMode:      "SEPARATE_CHANNEL",
				AllocatedPages: 100, // 1 color page * 100 copies
				ColorChannels: []ColorChannel{
					{ChannelName: "C", DensityPct: 20.0},
					{ChannelName: "M", DensityPct: 15.0},
					{ChannelName: "Y", DensityPct: 10.0},
					{ChannelName: "K", DensityPct: 5.0},
				},
			},
			{
				PrinterAssetID: "PRN-MONO-01",
				ColorMode:      "MONO_K",
				AllocatedPages: 900, // 9 mono pages * 100 copies
				AverageDensity: Float64Ptr(8.0),
			},
		},
	}

	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// CMY: 56,250 LAK (from Process 1)
	expectedCMY := 56250.0
	if math.Abs(res.InkCostCMY-expectedCMY) > 0.01 {
		t.Errorf("Expected CMY %v, got %v", expectedCMY, res.InkCostCMY)
	}

	// K: 6,250 (from Process 1) + 90,000 (from Process 2) = 96,250 LAK
	expectedK := 96250.0
	if math.Abs(res.InkCostK-expectedK) > 0.01 {
		t.Errorf("Expected K %v, got %v", expectedK, res.InkCostK)
	}
}

// ── SCENARIO 6: Two-Up A4 on A3 Precut Stock with Manual Override ──

func TestTwoUpA4OnA3_WithManualSheetOverride(t *testing.T) {
	req := CalculationRequest{
		JobName:             "A4 Flyer 2-up on A3 Stock",
		Quantity:            500,
		JobWidth:            210,
		JobHeight:           297,
		PaperCostPerUnit:    1000, // 1,000 LAK per A3 sheet
		PaperCostIsPerSheet: true,
		CutsPerSheet:        2,
		SpoilagePercent:     0.10, // 10%
	}

	// Case 1: Automatic sheet calculation
	// 500 copies / 2 cuts = 250 sheets * 1.10 spoil = 275 A3 sheets
	resAuto, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expectedAutoPaperCost := 275.0 * 1000.0
	if resAuto.PaperCost != expectedAutoPaperCost {
		t.Errorf("Expected Auto PaperCost %v (275 A3 sheets), got %v", expectedAutoPaperCost, resAuto.PaperCost)
	}

	// Case 2: Manual Sheet Override (override to 300 sheets)
	reqOverride := req
	reqOverride.ManualSheetCount = 300
	resOverride, err := CalculateJobPricing(reqOverride)
	if err != nil {
		t.Fatalf("unexpected error with override: %v", err)
	}
	expectedOverridePaperCost := 300.0 * 1000.0
	if resOverride.PaperCost != expectedOverridePaperCost {
		t.Errorf("Expected Override PaperCost %v (300 A3 sheets), got %v", expectedOverridePaperCost, resOverride.PaperCost)
	}
}

