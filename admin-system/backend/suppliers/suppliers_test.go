package suppliers

import (
	"testing"
)

func TestGeneratePONumber_Fallback(t *testing.T) {
	poNum, err := GeneratePONumber(nil)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if len(poNum) < 8 {
		t.Fatalf("Expected PO number to have format PO-YYYY-NNNN, got %s", poNum)
	}
}
