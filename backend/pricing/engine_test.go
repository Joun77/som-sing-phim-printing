package pricing

import (
	"math"
	"testing"
)

func TestCalculateJobPricingNew(t *testing.T) {
	req := CalculationRequest{
		JobName:               "Professional booklet",
		Quantity:              100,
		PaperSku:              "paper-a4-80",
		PaperCostPerUnit:      100.0, // 100 LAK per sheet
		PaperFormat:           "sheet",
		InkCoverageKPercent:   5.0,   // 5% K
		InkCoverageCMYPercent: 10.0,  // 10% CMY
		InkCostKPerMl:         500.0,  // 500 LAK per ml
		InkCostCMYPerMl:       600.0,  // 600 LAK per ml
		MachinePrice:          50000000,
		TargetTotalPages:      1000000,
		MaintenanceCostPerPage: 10.0,
		JobWidth:              210,
		JobHeight:             297,
		CustomFinishingOptions: []CustomFinishingOption{
			{Name: "Custom Binding", ChargeType: "PER_UNIT", Price: 150.0},
			{Name: "Job Setup Fee", ChargeType: "FIXED_JOB", Price: 2000.0},
		},
		LaminationType:      "none",
		BindingType:         "none",
		LaborCostPerHour:    15000.0,
		EstimatedHours:      2.0,
		OverheadPercent:     0.10, // 10% overhead
		TargetMarginPercent: 0.35, // 35% margin
	}

	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// 1. Paper: 100 * 100 = 10,000 LAK
	if res.PaperCost != 10000.0 {
		t.Errorf("Expected PaperCost 10000.0, got %v", res.PaperCost)
	}

	// 2. Ink K: 100 * (0.007 * 5) * 500 = 1,750 LAK
	// Ink CMY: 100 * (0.007 * 10) * 600 = 4,200 LAK
	// Total Ink = 5,950 LAK
	if res.InkCostK != 1750.0 {
		t.Errorf("Expected InkCostK 1750.0, got %v", res.InkCostK)
	}
	if res.InkCostCMY != 4200.0 {
		t.Errorf("Expected InkCostCMY 4200.0, got %v", res.InkCostCMY)
	}
	if res.InkCost != 5950.0 {
		t.Errorf("Expected total InkCost 5950.0, got %v", res.InkCost)
	}

	// 3. Depreciation: (50000000 / 1000000) * 100 = 5,000 LAK
	if res.DepreciationCost != 5000.0 {
		t.Errorf("Expected DepreciationCost 5000.0, got %v", res.DepreciationCost)
	}

	// 4. Maintenance: 10 * 100 = 1,000 LAK
	if res.MaintenanceCost != 1000.0 {
		t.Errorf("Expected MaintenanceCost 1000.0, got %v", res.MaintenanceCost)
	}

	// 5. Custom Finishing:
	// Custom Binding: 150 * 100 = 15,000 LAK
	// Job Setup: 2,000 LAK
	// Total Custom = 17,000 LAK
	if res.CustomFinishingCost != 17000.0 {
		t.Errorf("Expected CustomFinishingCost 17000.0, got %v", res.CustomFinishingCost)
	}

	// 6. Labor: 15,000 * 2.0 = 30,000 LAK
	if res.LaborCost != 30000.0 {
		t.Errorf("Expected LaborCost 30000.0, got %v", res.LaborCost)
	}

	// Direct Cost = 10000 (Paper) + 5950 (Ink) + 5000 (Depr) + 1000 (Maint) + 17000 (Custom) + 30000 (Labor) = 68,950 LAK
	if res.DirectCost != 68950.0 {
		t.Errorf("Expected DirectCost 68950.0, got %v", res.DirectCost)
	}

	// Overhead: 68950 * 0.10 = 6895 LAK
	if res.OverheadCost != 6895.0 {
		t.Errorf("Expected OverheadCost 6895.0, got %v", res.OverheadCost)
	}

	// Total Cost = 68950 + 6895 = 75,845 LAK
	if res.TotalCost != 75845.0 {
		t.Errorf("Expected TotalCost 75845.0, got %v", res.TotalCost)
	}

	// Sale Price = 75845 / (1.0 - 0.35) = 75845 / 0.65 = 116,684.62
	if res.SalePrice != 116684.62 {
		t.Errorf("Expected SalePrice 116684.62, got %v", res.SalePrice)
	}

	t.Run("Custom Finishing PER_SQM", func(t *testing.T) {
		reqSqM := req
		reqSqM.CustomFinishingOptions = []CustomFinishingOption{
			{Name: "Laminate SQM", ChargeType: "PER_SQM", Price: 1000.0},
		}
		// Quantity = 100, W = 210, H = 297. Total SqM = 0.21 * 0.297 * 100 = 6.237 sqm.
		// Price = 1000 * 6.237 = 6237 LAK
		resSqM, err := CalculateJobPricing(reqSqM)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if resSqM.CustomFinishingCost != 6237.0 {
			t.Errorf("Expected CustomFinishingCost 6237.0, got %v", resSqM.CustomFinishingCost)
		}
	})

	t.Run("Margin Protection Guard", func(t *testing.T) {
		reqGuard := req
		reqGuard.TargetMarginPercent = 1.5 // 150% margin
		resGuard, err := CalculateJobPricing(reqGuard)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if resGuard.ProfitMargin != 0.99 {
			t.Errorf("Expected margin to be clamped to 0.99, got %v", resGuard.ProfitMargin)
		}
	})

	t.Run("Fallback Overhead", func(t *testing.T) {
		reqFallback := req
		reqFallback.OverheadPercent = 0.0
		resFallback, err := CalculateJobPricing(reqFallback)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		// Overhead fallback to 15%
		expectedOverhead := resFallback.DirectCost * 0.15
		if math.Abs(resFallback.OverheadCost-roundToTwoDecimals(expectedOverhead)) > 0.01 {
			t.Errorf("Expected OverheadCost around %v, got %v", expectedOverhead, resFallback.OverheadCost)
		}
	})
}

