package inventory

import (
	"testing"
)

func TestJobDeductionSpec_SpoilageFields(t *testing.T) {
	spec := JobDeductionSpec{
		OrderID:                 "ORD-TEST-99",
		OrderItemID:             "ITEM-01",
		PaperSKU:                "PAP-ART-260",
		Quantity:                100,
		PageCount:               16,
		SpoilageAllowanceSheets: 5,
		SpoilagePercent:         0.05,
		SpoilageCost:            15000.0,
		AllowNegativeStock:      false,
	}

	if spec.SpoilageAllowanceSheets != 5 {
		t.Errorf("Expected 5 spoilage sheets, got %d", spec.SpoilageAllowanceSheets)
	}

	if spec.SpoilagePercent != 0.05 {
		t.Errorf("Expected 0.05 spoilage percent, got %f", spec.SpoilagePercent)
	}

	if spec.SpoilageCost != 15000.0 {
		t.Errorf("Expected 15000.0 spoilage cost, got %f", spec.SpoilageCost)
	}
}

func TestDeductInventoryForJob_NilTx(t *testing.T) {
	// Should safely return nil if db transaction is not active (mock/offline mode)
	err := DeductInventoryForJob(nil, JobDeductionSpec{
		OrderID: "ORD-NIL-TX",
	})
	if err != nil {
		t.Errorf("Expected nil error when tx is nil, got %v", err)
	}
}
