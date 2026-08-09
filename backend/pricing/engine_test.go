package pricing

import (
	"testing"
)

func TestCalculateJobPricing(t *testing.T) {
	req := CalculationRequest{
		JobName:            "Booklet Printing",
		Quantity:           100,
		PaperSku:           "paper-a4-80",
		PaperCostPerUnit:   100.0, // 100 LAK per sheet
		PaperFormat:        "sheet",
		InkCoveragePercent: 30.0,  // 30% coverage
		InkCostPerMl:       200.0,  // 200 LAK per ml
		LaminationType:     "thermal",
		LaminationCost:     150.0,  // 150 LAK per sheet
		BindingType:        "wire-o",
		BindingCost:        200.0,  // 200 LAK per book
		LaborCostPerHour:   15000.0,
		EstimatedHours:     2.5,
		MarkupMargin:       0.30,   // 30% profit margin
	}

	res, err := CalculateJobPricing(req)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// 1. Paper: 100 sheets * 100 LAK = 10,000 LAK
	if res.PaperCost != 10000.0 {
		t.Errorf("Expected PaperCost 10000.0, got %v", res.PaperCost)
	}

	// 2. Ink: 100 sheets * (0.007 * 30 ml) * 200 LAK/ml = 100 * 0.21 * 200 = 4,200 LAK
	if res.InkCost != 4200.0 {
		t.Errorf("Expected InkCost 4200.0, got %v", res.InkCost)
	}

	// 3. Lamination: 100 * 150 = 15,000 LAK
	if res.LaminationCost != 15000.0 {
		t.Errorf("Expected LaminationCost 15000.0, got %v", res.LaminationCost)
	}

	// 4. Binding: 100 * 200 = 20,000 LAK
	if res.BindingCost != 20000.0 {
		t.Errorf("Expected BindingCost 20000.0, got %v", res.BindingCost)
	}

	// 5. Labor: 15,000 LAK/hr * 2.5 hr = 37,500 LAK
	if res.LaborCost != 37500.0 {
		t.Errorf("Expected LaborCost 37500.0, got %v", res.LaborCost)
	}

	// Total cost = 10000 + 4200 + 15000 + 20000 + 37500 = 86,700 LAK
	if res.TotalCost != 86700.0 {
		t.Errorf("Expected TotalCost 86700.0, got %v", res.TotalCost)
	}

	// Sale price = 86700 * 1.3 = 112,710 LAK
	if res.SalePrice != 112710.0 {
		t.Errorf("Expected SalePrice 112710.0, got %v", res.SalePrice)
	}

	// Unit price = 112710 / 100 = 1127.1 LAK
	if res.UnitPrice != 1127.1 {
		t.Errorf("Expected UnitPrice 1127.1, got %v", res.UnitPrice)
	}
}
