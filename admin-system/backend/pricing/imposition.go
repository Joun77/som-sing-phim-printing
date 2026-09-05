package pricing

import (
	"fmt"
	"math"

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

// BatchImpositionRequest defines input parameters for multi-item / photo imposition
type BatchImpositionRequest struct {
	ItemWidthMM     float64 `json:"item_width_mm"`
	ItemHeightMM    float64 `json:"item_height_mm"`
	ParentSheet     string  `json:"parent_sheet"` // "A4", "A3", "A3+", or "CUSTOM"
	ParentWidthMM   float64 `json:"parent_width_mm"`
	ParentHeightMM  float64 `json:"parent_height_mm"`
	TotalItems      int     `json:"total_items"` // e.g. 40 photos
	BleedMM         float64 `json:"bleed_mm"`
	GutterMM        float64 `json:"gutter_mm"`
	SpoilagePercent float64 `json:"spoilage_percent"` // e.g. 5.0 for 5%
}

// BatchImpositionResponse defines calculated yields, required sheets, and layout grid
type BatchImpositionResponse struct {
	ItemWidthMM          float64    `json:"item_width_mm"`
	ItemHeightMM         float64    `json:"item_height_mm"`
	ParentSheet          string     `json:"parent_sheet"`
	ParentWidthMM        float64    `json:"parent_width_mm"`
	ParentHeightMM       float64    `json:"parent_height_mm"`
	TotalItems           int        `json:"total_items"`
	CutsPerSheet         int        `json:"cuts_per_sheet"`
	RequiredParentSheets int        `json:"required_parent_sheets"`
	SpoilageSheets       int        `json:"spoilage_sheets"`
	TotalParentSheets    int        `json:"total_parent_sheets"`
	WastePercent         float64    `json:"waste_percent"`
	Layout               LayoutGrid `json:"layout"`
	SummaryTextLao       string     `json:"summary_text_lao"`
	SummaryTextEn        string     `json:"summary_text_en"`
}

// CalculateBatchImposition determines cuts per sheet, total required parent sheets, and generates imposition layout
func CalculateBatchImposition(req BatchImpositionRequest) BatchImpositionResponse {
	pWidth := req.ParentWidthMM
	pHeight := req.ParentHeightMM
	pSheet := req.ParentSheet

	if pSheet == "" {
		pSheet = "A4"
	}

	switch pSheet {
	case "A4", "a4":
		pWidth = 210.0
		pHeight = 297.0
	case "A3", "a3":
		pWidth = 297.0
		pHeight = 420.0
	case "A3+", "a3+", "SUPER_A3":
		pWidth = 329.0
		pHeight = 483.0
	default:
		if pWidth <= 0 || pHeight <= 0 {
			pSheet = "A4"
			pWidth = 210.0
			pHeight = 297.0
		}
	}

	itemW := req.ItemWidthMM
	itemH := req.ItemHeightMM
	if itemW <= 0 {
		itemW = 102.0 // standard 4x6" default (102x152mm)
	}
	if itemH <= 0 {
		itemH = 152.0
	}

	totalItems := req.TotalItems
	if totalItems <= 0 {
		totalItems = 1
	}

	dItemW := decimal.NewFromFloat(itemW)
	dItemH := decimal.NewFromFloat(itemH)
	dParentW := decimal.NewFromFloat(pWidth)
	dParentH := decimal.NewFromFloat(pHeight)
	dBleed := decimal.NewFromFloat(req.BleedMM)
	dGutter := decimal.NewFromFloat(req.GutterMM)

	cutsPerSheet, wastePctDec, layout := CalculateImposition(dItemW, dItemH, dParentW, dParentH, dBleed, dGutter)
	if cutsPerSheet < 1 {
		cutsPerSheet = 1
	}

	reqSheets := int(math.Ceil(float64(totalItems) / float64(cutsPerSheet)))

	spoilPct := req.SpoilagePercent
	if spoilPct < 0 {
		spoilPct = 0
	} else if spoilPct > 1.0 {
		spoilPct = spoilPct / 100.0
	}

	spoilSheets := int(math.Ceil(float64(reqSheets) * spoilPct))
	totalSheets := reqSheets + spoilSheets
	wastePct, _ := wastePctDec.Float64()

	summaryLao := fmt.Sprintf("ຮູບ %d ໃບ (ຂະໜາດ %.0fx%.0fmm) ຈັດວາງເທິງເຈ້ຍ %s ໄດ້ %d ຮູບ/ແຜ່ນ ➜ ໃຊ້ເຈ້ຍ %s ທັງໝົດ %d ແຜ່ນ (ເຜື່ອເສຍ %d ແຜ່ນ = ລວມ %d ແຜ່ນ)",
		totalItems, itemW, itemH, pSheet, cutsPerSheet, pSheet, reqSheets, spoilSheets, totalSheets)

	summaryEn := fmt.Sprintf("%d items (%.0fx%.0fmm) imposed on %s (%d up) ➜ %d required sheets + %d spoilage = %d total %s sheets",
		totalItems, itemW, itemH, pSheet, cutsPerSheet, reqSheets, spoilSheets, totalSheets, pSheet)

	return BatchImpositionResponse{
		ItemWidthMM:          itemW,
		ItemHeightMM:         itemH,
		ParentSheet:          pSheet,
		ParentWidthMM:        pWidth,
		ParentHeightMM:       pHeight,
		TotalItems:           totalItems,
		CutsPerSheet:         cutsPerSheet,
		RequiredParentSheets: reqSheets,
		SpoilageSheets:       spoilSheets,
		TotalParentSheets:    totalSheets,
		WastePercent:         wastePct,
		Layout:               layout,
		SummaryTextLao:       summaryLao,
		SummaryTextEn:        summaryEn,
	}
}

