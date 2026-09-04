package pricing

import (
	"github.com/shopspring/decimal"
)

// PlacedItem represents a single positioned artwork on the parent sheet
type PlacedItem struct {
	X       decimal.Decimal `json:"x"`
	Y       decimal.Decimal `json:"y"`
	Width   decimal.Decimal `json:"width"`
	Height  decimal.Decimal `json:"height"`
	Rotated bool            `json:"rotated"`
}

// LayoutGrid contains the 2D packing results and metadata
type LayoutGrid struct {
	Columns        int             `json:"columns"`
	Rows           int             `json:"rows"`
	TotalCuts      int             `json:"total_cuts"`
	Orientation    string          `json:"orientation"` // "UNIFORM_0_DEG", "UNIFORM_90_DEG", "MIXED_SHELF_GUILLOTINE"
	ItemWidthMM    decimal.Decimal `json:"item_width_mm"`
	ItemHeightMM   decimal.Decimal `json:"item_height_mm"`
	ParentWidthMM  decimal.Decimal `json:"parent_width_mm"`
	ParentHeightMM decimal.Decimal `json:"parent_height_mm"`
	BleedMM        decimal.Decimal `json:"bleed_mm"`
	GutterMM       decimal.Decimal `json:"gutter_mm"`
	PlacedItems    []PlacedItem    `json:"placed_items"`
	UsableAreaMM2  decimal.Decimal `json:"usable_area_mm2"`
	TotalAreaMM2   decimal.Decimal `json:"total_area_mm2"`
	WastePercent   decimal.Decimal `json:"waste_percent"`
}

// CalculateImposition implements a 2D Shelf-Guillotine Bin Packing Algorithm.
// It searches for optimal layouts (0-deg, 90-deg, and mixed shelf guillotine cuts)
// to maximize item yield and minimize paper waste.
func CalculateImposition(itemW, itemH, parentW, parentH, bleedMM, gutterMM decimal.Decimal) (int, decimal.Decimal, LayoutGrid) {
	zero := decimal.Zero
	oneHundred := decimal.NewFromInt(100)

	// Validate inputs
	if itemW.LessThanOrEqual(zero) || itemH.LessThanOrEqual(zero) || parentW.LessThanOrEqual(zero) || parentH.LessThanOrEqual(zero) {
		emptyGrid := LayoutGrid{
			TotalCuts:    1,
			WastePercent: zero,
		}
		return 1, zero, emptyGrid
	}

	if bleedMM.LessThan(zero) {
		bleedMM = zero
	}
	if gutterMM.LessThan(zero) {
		gutterMM = zero
	}

	two := decimal.NewFromInt(2)
	effW := itemW.Add(bleedMM.Mul(two))
	effH := itemH.Add(bleedMM.Mul(two))

	totalParentArea := parentW.Mul(parentH)
	singleItemArea := effW.Mul(effH)

	bestCuts := 0
	var bestGrid LayoutGrid

	// ── 1. Pure 0-Degree (Unrotated) Grid ─────────────────────────────────────
	// Width available: cols * effW + (cols - 1) * gutterMM <= parentW
	// => cols * (effW + gutterMM) - gutterMM <= parentW
	// => cols <= (parentW + gutterMM) / (effW + gutterMM)
	cols0 := int(parentW.Add(gutterMM).Div(effW.Add(gutterMM)).Floor().IntPart())
	rows0 := int(parentH.Add(gutterMM).Div(effH.Add(gutterMM)).Floor().IntPart())
	if cols0 < 0 {
		cols0 = 0
	}
	if rows0 < 0 {
		rows0 = 0
	}
	cuts0 := cols0 * rows0

	grid0 := LayoutGrid{
		Columns:        cols0,
		Rows:           rows0,
		TotalCuts:      cuts0,
		Orientation:    "UNIFORM_0_DEG",
		ItemWidthMM:    itemW,
		ItemHeightMM:   itemH,
		ParentWidthMM:  parentW,
		ParentHeightMM: parentH,
		BleedMM:        bleedMM,
		GutterMM:       gutterMM,
		PlacedItems:    generatePlacedItems(cols0, rows0, effW, effH, gutterMM, false, zero, zero),
	}

	if cuts0 > bestCuts {
		bestCuts = cuts0
		bestGrid = grid0
	}

	// ── 2. Pure 90-Degree (Rotated) Grid ──────────────────────────────────────
	cols90 := int(parentW.Add(gutterMM).Div(effH.Add(gutterMM)).Floor().IntPart())
	rows90 := int(parentH.Add(gutterMM).Div(effW.Add(gutterMM)).Floor().IntPart())
	if cols90 < 0 {
		cols90 = 0
	}
	if rows90 < 0 {
		rows90 = 0
	}
	cuts90 := cols90 * rows90

	grid90 := LayoutGrid{
		Columns:        cols90,
		Rows:           rows90,
		TotalCuts:      cuts90,
		Orientation:    "UNIFORM_90_DEG",
		ItemWidthMM:    itemW,
		ItemHeightMM:   itemH,
		ParentWidthMM:  parentW,
		ParentHeightMM: parentH,
		BleedMM:        bleedMM,
		GutterMM:       gutterMM,
		PlacedItems:    generatePlacedItems(cols90, rows90, effH, effW, gutterMM, true, zero, zero),
	}

	if cuts90 > bestCuts {
		bestCuts = cuts90
		bestGrid = grid90
	}

	// ── 3. Mixed Shelf-Guillotine (X-Split: Primary 0-deg, Remainder X with 90-deg) ────
	if cols0 > 0 && rows0 > 0 {
		usedW := decimal.NewFromInt(int64(cols0)).Mul(effW).Add(decimal.NewFromInt(int64(cols0 - 1)).Mul(gutterMM))
		remW := parentW.Sub(usedW).Sub(gutterMM)
		if remW.GreaterThanOrEqual(effH) {
			remCols := int(remW.Add(gutterMM).Div(effH.Add(gutterMM)).Floor().IntPart())
			remRows := int(parentH.Add(gutterMM).Div(effW.Add(gutterMM)).Floor().IntPart())
			if remCols > 0 && remRows > 0 {
				cutsMixedX := cuts0 + (remCols * remRows)
				if cutsMixedX > bestCuts {
					bestCuts = cutsMixedX
					items0 := generatePlacedItems(cols0, rows0, effW, effH, gutterMM, false, zero, zero)
					itemsRem := generatePlacedItems(remCols, remRows, effH, effW, gutterMM, true, usedW.Add(gutterMM), zero)
					bestGrid = LayoutGrid{
						Columns:        cols0 + remCols,
						Rows:           rows0,
						TotalCuts:      cutsMixedX,
						Orientation:    "MIXED_SHELF_GUILLOTINE",
						ItemWidthMM:    itemW,
						ItemHeightMM:   itemH,
						ParentWidthMM:  parentW,
						ParentHeightMM: parentH,
						BleedMM:        bleedMM,
						GutterMM:       gutterMM,
						PlacedItems:    append(items0, itemsRem...),
					}
				}
			}
		}
	}

	// ── 4. Mixed Shelf-Guillotine (Y-Split: Primary 0-deg, Remainder Y with 90-deg) ────
	if cols0 > 0 && rows0 > 0 {
		usedH := decimal.NewFromInt(int64(rows0)).Mul(effH).Add(decimal.NewFromInt(int64(rows0 - 1)).Mul(gutterMM))
		remH := parentH.Sub(usedH).Sub(gutterMM)
		if remH.GreaterThanOrEqual(effW) {
			remCols := int(parentW.Add(gutterMM).Div(effH.Add(gutterMM)).Floor().IntPart())
			remRows := int(remH.Add(gutterMM).Div(effW.Add(gutterMM)).Floor().IntPart())
			if remCols > 0 && remRows > 0 {
				cutsMixedY := cuts0 + (remCols * remRows)
				if cutsMixedY > bestCuts {
					bestCuts = cutsMixedY
					items0 := generatePlacedItems(cols0, rows0, effW, effH, gutterMM, false, zero, zero)
					itemsRem := generatePlacedItems(remCols, remRows, effH, effW, gutterMM, true, zero, usedH.Add(gutterMM))
					bestGrid = LayoutGrid{
						Columns:        cols0,
						Rows:           rows0 + remRows,
						TotalCuts:      cutsMixedY,
						Orientation:    "MIXED_SHELF_GUILLOTINE",
						ItemWidthMM:    itemW,
						ItemHeightMM:   itemH,
						ParentWidthMM:  parentW,
						ParentHeightMM: parentH,
						BleedMM:        bleedMM,
						GutterMM:       gutterMM,
						PlacedItems:    append(items0, itemsRem...),
					}
				}
			}
		}
	}

	// ── 5. Mixed Shelf-Guillotine (X-Split: Primary 90-deg, Remainder X with 0-deg) ───
	if cols90 > 0 && rows90 > 0 {
		usedW := decimal.NewFromInt(int64(cols90)).Mul(effH).Add(decimal.NewFromInt(int64(cols90 - 1)).Mul(gutterMM))
		remW := parentW.Sub(usedW).Sub(gutterMM)
		if remW.GreaterThanOrEqual(effW) {
			remCols := int(remW.Add(gutterMM).Div(effW.Add(gutterMM)).Floor().IntPart())
			remRows := int(parentH.Add(gutterMM).Div(effH.Add(gutterMM)).Floor().IntPart())
			if remCols > 0 && remRows > 0 {
				cutsMixed90X := cuts90 + (remCols * remRows)
				if cutsMixed90X > bestCuts {
					bestCuts = cutsMixed90X
					items90 := generatePlacedItems(cols90, rows90, effH, effW, gutterMM, true, zero, zero)
					itemsRem := generatePlacedItems(remCols, remRows, effW, effH, gutterMM, false, usedW.Add(gutterMM), zero)
					bestGrid = LayoutGrid{
						Columns:        cols90 + remCols,
						Rows:           rows90,
						TotalCuts:      cutsMixed90X,
						Orientation:    "MIXED_SHELF_GUILLOTINE",
						ItemWidthMM:    itemW,
						ItemHeightMM:   itemH,
						ParentWidthMM:  parentW,
						ParentHeightMM: parentH,
						BleedMM:        bleedMM,
						GutterMM:       gutterMM,
						PlacedItems:    append(items90, itemsRem...),
					}
				}
			}
		}
	}

	// Fallback if 0 cuts fit
	if bestCuts < 1 {
		bestCuts = 1
		bestGrid = LayoutGrid{
			Columns:        1,
			Rows:           1,
			TotalCuts:      1,
			Orientation:    "UNIFORM_0_DEG",
			ItemWidthMM:    itemW,
			ItemHeightMM:   itemH,
			ParentWidthMM:  parentW,
			ParentHeightMM: parentH,
			BleedMM:        bleedMM,
			GutterMM:       gutterMM,
			PlacedItems: []PlacedItem{
				{X: zero, Y: zero, Width: effW, Height: effH, Rotated: false},
			},
		}
	}

	// Calculate area & waste %
	usableArea := decimal.NewFromInt(int64(bestCuts)).Mul(singleItemArea)
	wastePercent := zero
	if totalParentArea.GreaterThan(zero) {
		wasteArea := totalParentArea.Sub(usableArea)
		if wasteArea.LessThan(zero) {
			wasteArea = zero
		}
		wastePercent = wasteArea.Div(totalParentArea).Mul(oneHundred).Round(2)
	}

	bestGrid.UsableAreaMM2 = usableArea
	bestGrid.TotalAreaMM2 = totalParentArea
	bestGrid.WastePercent = wastePercent

	return bestCuts, wastePercent, bestGrid
}

func generatePlacedItems(cols, rows int, slotW, slotH, gutterMM decimal.Decimal, rotated bool, offsetX, offsetY decimal.Decimal) []PlacedItem {
	var items []PlacedItem
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			x := offsetX.Add(decimal.NewFromInt(int64(c)).Mul(slotW.Add(gutterMM)))
			y := offsetY.Add(decimal.NewFromInt(int64(r)).Mul(slotH.Add(gutterMM)))
			items = append(items, PlacedItem{
				X:       x,
				Y:       y,
				Width:   slotW,
				Height:  slotH,
				Rotated: rotated,
			})
		}
	}
	return items
}
