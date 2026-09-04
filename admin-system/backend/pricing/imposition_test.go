package pricing

import (
	"testing"

	"github.com/shopspring/decimal"
)

func TestCalculateImposition_StandardSizes(t *testing.T) {
	zero := decimal.Zero
	bleed2mm := decimal.NewFromFloat(2.0)
	gutter3mm := decimal.NewFromFloat(3.0)

	// Scenario 1: A4 (210x297mm) on 24"x35" (609.6 x 889.0 mm)
	// 609.6 / 210 = 2, 889 / 297 = 2 (Portrait = 4)
	// Rotated: 609.6 / 297 = 2, 889 / 210 = 4 (Landscape = 8 cuts!)
	t.Run("A4_on_24x35_Sheet", func(t *testing.T) {
		itemW := decimal.NewFromFloat(210.0)
		itemH := decimal.NewFromFloat(297.0)
		parentW := decimal.NewFromFloat(609.6)
		parentH := decimal.NewFromFloat(889.0)

		cuts, wastePct, layout := CalculateImposition(itemW, itemH, parentW, parentH, zero, zero)

		if cuts < 8 {
			t.Errorf("Expected at least 8 cuts for A4 on 24x35 sheet, got %d", cuts)
		}
		if wastePct.GreaterThan(decimal.NewFromFloat(25.0)) {
			t.Errorf("Expected waste < 25%% for A4 on 24x35 sheet, got %s%%", wastePct.String())
		}
		if len(layout.PlacedItems) != cuts {
			t.Errorf("Placed items count %d does not match cuts %d", len(layout.PlacedItems), cuts)
		}
	})

	// Scenario 2: A5 (148x210mm) on 31"x43" (787.4 x 1092.2 mm)
	// 787.4 / 148 = 5, 1092.2 / 210 = 5 (Portrait = 25 cuts)
	// Rotated: 787.4 / 210 = 3, 1092.2 / 148 = 7 (Landscape = 21 cuts)
	t.Run("A5_on_31x43_Sheet", func(t *testing.T) {
		itemW := decimal.NewFromFloat(148.0)
		itemH := decimal.NewFromFloat(210.0)
		parentW := decimal.NewFromFloat(787.4)
		parentH := decimal.NewFromFloat(1092.2)

		cuts, wastePct, layout := CalculateImposition(itemW, itemH, parentW, parentH, zero, zero)

		if cuts < 25 {
			t.Errorf("Expected at least 25 cuts for A5 on 31x43 sheet, got %d", cuts)
		}
		if wastePct.GreaterThan(decimal.NewFromFloat(20.0)) {
			t.Errorf("Expected waste < 20%%, got %s%%", wastePct.String())
		}
		if len(layout.PlacedItems) != cuts {
			t.Errorf("Placed items count %d != cuts %d", len(layout.PlacedItems), cuts)
		}
	})

	// Scenario 3: Business Cards (90x54mm) on A3+ (329 x 483 mm) with 2mm bleed & 3mm gutter
	// Item with bleed: 94 x 58 mm
	// 329 / (94+3) = 3 cols, 483 / (58+3) = 7 rows => ~21-25 cards per A3+ sheet
	t.Run("BusinessCards_on_A3Plus_Sheet", func(t *testing.T) {
		itemW := decimal.NewFromFloat(90.0)
		itemH := decimal.NewFromFloat(54.0)
		parentW := decimal.NewFromFloat(329.0)
		parentH := decimal.NewFromFloat(483.0)

		cuts, wastePct, layout := CalculateImposition(itemW, itemH, parentW, parentH, bleed2mm, gutter3mm)

		if cuts < 20 {
			t.Errorf("Expected at least 20 business cards on A3+ sheet, got %d", cuts)
		}
		if wastePct.GreaterThan(decimal.NewFromFloat(35.0)) {
			t.Errorf("Expected waste < 35%%, got %s%%", wastePct.String())
		}
		if len(layout.PlacedItems) != cuts {
			t.Errorf("Placed items count %d != cuts %d", len(layout.PlacedItems), cuts)
		}
	})

	// Scenario 4: Zero / Invalid inputs fallback
	t.Run("Zero_Or_Negative_Inputs", func(t *testing.T) {
		cuts, wastePct, _ := CalculateImposition(zero, zero, zero, zero, zero, zero)
		if cuts != 1 {
			t.Errorf("Expected fallback cuts 1, got %d", cuts)
		}
		if !wastePct.IsZero() {
			t.Errorf("Expected 0 waste, got %s", wastePct.String())
		}
	})
}
