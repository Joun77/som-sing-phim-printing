package pricing

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strings"

	"backend/inventory"

	"github.com/shopspring/decimal"
)

// ColorChannel represents a single color plate/channel (C, M, Y, K, or Spot)
type ColorChannel struct {
	ChannelName string  `json:"channel_name"` // "C", "M", "Y", "K", "PANTONE..."
	DensityPct  float64 `json:"density_pct"`
	IsSpotColor bool    `json:"is_spot_color"`
}

// PrinterProcessSetup represents a specific printer allocation with color modes
type PrinterProcessSetup struct {
	PrinterAssetID string         `json:"printer_asset_id"`
	Sequence       int            `json:"sequence"`
	ColorMode      string         `json:"color_mode"` // "AVERAGE" | "SEPARATE_CHANNEL"
	AverageDensity float64        `json:"average_density_pct"`
	AllocatedPages int            `json:"allocated_pages"`
	CostPerPage    float64        `json:"cost_per_page"`
	ColorChannels  []ColorChannel `json:"color_channels"`
}

// FinishingProcessSetup represents a post-press machine asset integration
type FinishingProcessSetup struct {
	FinishingType          string  `json:"finishing_type"` // e.g. "LAMINATE_GLOSS", "FOLDING", "HOT_MELT_BINDING"
	MachineAssetID         string  `json:"machine_asset_id"`
	MachineHourlyRate      float64 `json:"machine_hourly_rate"`
	EstimatedSetupTimeMins int     `json:"estimated_setup_time_mins"`
	EstimatedRunTimeMins   int     `json:"estimated_run_time_mins"`
	UnitCost               float64 `json:"unit_cost"`
}

// PrinterAllocation represents a manual multi-printer allocation for a job
type PrinterAllocation struct {
	PrinterID      string  `json:"printer_id"`
	PrinterName    string  `json:"printer_name"`
	AllocatedPages int     `json:"allocated_pages"`
	CostPerPage    float64 `json:"cost_per_page"`
	SubtotalCost   float64 `json:"subtotal_cost"`
}

// CustomFinishingOption represents a custom post-print finishing option
type CustomFinishingOption struct {
	Name       string  `json:"name"`
	ChargeType string  `json:"charge_type"` // "FIXED_JOB" | "PER_UNIT" | "PER_SQM"
	Price      float64 `json:"price"`
}

// CalculationRequest represents the payload from the frontend spec builder
type CalculationRequest struct {
	JobName          string              `json:"job_name" binding:"required"`
	Quantity         int                 `json:"quantity" binding:"required,gt=0"`
	PaperSku         string              `json:"paper_sku"`
	PaperName        string              `json:"paper_name"`
	PaperCostPerUnit float64             `json:"paper_cost_per_unit"` // Cost per ream/pack or unit
	PaperFormat      string              `json:"paper_format"`        // "sheet" | "roll"
	SheetsPerPack    int                 `json:"sheets_per_pack"`     // Sheets per pack/ream (default 500)
	CutsPerSheet     int                 `json:"cuts_per_sheet"`      // Number of brochure/job pieces cut per large sheet (default 1)
	Allocations      []PrinterAllocation `json:"allocations"`

	// Multi-Printer & Channel Color Separation (Task 3)
	PrintingProcesses  []PrinterProcessSetup   `json:"printing_processes"`
	FinishingProcesses []FinishingProcessSetup `json:"finishing_processes"`
	PlateCostPerUnit   float64                 `json:"plate_cost_per_unit"` // Cost per printing plate (e.g. 50,000 LAK)

	// Unfolded / Parent Sheet Dimensions for Layout Optimization
	UnfoldedWidthMM     float64 `json:"unfolded_width_mm"`
	UnfoldedHeightMM    float64 `json:"unfolded_height_mm"`
	ParentSheetWidthMM  float64 `json:"parent_sheet_width_mm"`
	ParentSheetHeightMM float64 `json:"parent_sheet_height_mm"`

	// Setup & Finishing Costs
	SetupCost        float64 `json:"setup_cost"`         // Fixed setup cost
	SetupCostMode    string  `json:"setup_cost_mode"`    // "fixed" | "percent"
	SetupCostPercent float64 `json:"setup_cost_percent"` // Setup cost % if mode is percent
	FinishingCost    float64 `json:"finishing_cost"`     // Variable finishing cost per unit
	BaseProfitPct    float64 `json:"base_profit_pct"`    // Base profit percentage

	// Roll-fed paper pricing
	PaperRollPricePerM2 float64 `json:"paper_roll_price_per_m2"` // LAK per m² for roll paper

	// Offcut Rebate Engine (Task 3.2)
	UseOffcutRebate  bool    `json:"use_offcut_rebate"`
	OffcutRebateCost float64 `json:"offcut_rebate_cost"` // Rebate amount to deduct from paper cost

	// Legacy Ink spec
	InkCoveragePercent float64 `json:"ink_coverage_percent"`
	InkCostPerMl       float64 `json:"ink_cost_per_ml"`

	// Split Ink spec (Black K vs Color CMY)
	InkCoverageKPercent   float64 `json:"ink_coverage_k_percent"`
	InkCoverageCMYPercent float64 `json:"ink_coverage_cmy_percent"`
	InkCostKPerMl         float64 `json:"ink_cost_k_per_ml"`
	InkCostCMYPerMl       float64 `json:"ink_cost_cmy_per_ml"`
	IsoYieldK             float64 `json:"iso_yield_k"`   // ISO 5% A4 yield for K (default 4000)
	IsoYieldCMY           float64 `json:"iso_yield_cmy"` // ISO 5% A4 yield for CMY (default 4000)

	// Printer / Machine Depreciation and Maintenance
	MachinePrice           float64 `json:"machine_price"`
	TargetTotalPages       float64 `json:"target_total_pages"`
	MaintenanceCostPerPage float64 `json:"maintenance_cost_per_page"`
	MaintenanceRatePercent float64 `json:"maintenance_rate_percent"` // Maintenance rate % (default 20%)

	// Job dimensions for Area Factor & 2D Imposition calculation
	JobWidth      float64 `json:"job_width"`       // in mm
	JobHeight     float64 `json:"job_height"`      // in mm
	BleedMarginMM float64 `json:"bleed_margin_mm"` // Bleed per edge in mm (default 0 or 2-3mm)
	GutterMM      float64 `json:"gutter_mm"`       // Spacing between items in mm

	// Custom finishing options list
	CustomFinishingOptions []CustomFinishingOption `json:"custom_finishing_options"`

	// Standard finishing services
	LaminationType string  `json:"lamination_type"` // "thermal" | "cold" | "none"
	LaminationCost float64 `json:"lamination_cost"` // Cost per sheet
	BindingType    string  `json:"binding_type"`    // "wire-o" | "staple" | "glue" | "none"
	BindingCost    float64 `json:"binding_cost"`    // Cost per unit

	// Labor, Overhead & Markup
	LaborMode        string  `json:"labor_mode"`        // "manual" | "percent" | "tiered"
	LaborPercent     float64 `json:"labor_percent"`     // Custom labor % (e.g. 10.0 for 10%)
	LaborCostManual  float64 `json:"labor_cost_manual"` // Fixed manual labor cost
	LaborCostPerHour float64 `json:"labor_cost_per_hour"`
	EstimatedHours   float64 `json:"estimated_hours"`
	MarkupMargin     float64 `json:"markup_margin"` // Legacy markup
	OverheadPercent  float64 `json:"overhead_percent"`

	// Spoilage / Waste percentage (e.g. 0.05 for 5%)
	SpoilagePercent float64 `json:"spoilage_percent"`

	// Profit & Client Pricing
	TargetMarginPercent float64 `json:"target_margin_percent"`

	// Discount, Tax Mode & Deposit (Task 2.2)
	DiscountPercent float64 `json:"discount_percent"` // e.g. 0.10 for 10%
	TaxMode         string  `json:"tax_mode"`         // "NONE" | "EXCLUDED" | "INCLUDED"
	TaxPercent      float64 `json:"tax_percent"`      // e.g. 0.07 for 7%
	DepositPercent  float64 `json:"deposit_percent"`  // e.g. 0, 30, 50, 100

	// Dynamic Preflight & Book Specifics
	PageCount     int     `json:"page_count"`      // Number of pages in booklet/book (default 1)
	AvgCovC       float64 `json:"avg_cov_c"`       // Average Cyan % from preflight
	AvgCovM       float64 `json:"avg_cov_m"`       // Average Magenta % from preflight
	AvgCovY       float64 `json:"avg_cov_y"`       // Average Yellow % from preflight
	AvgCovK       float64 `json:"avg_cov_k"`       // Average Black/Key % from preflight
	SpineWidthMM  float64 `json:"spine_width_mm"`  // Computed spine width in mm
	PaperGSM      float64 `json:"paper_gsm"`       // Paper grammage (e.g. 80, 260)
	BindingLifetimeCycles float64 `json:"binding_lifetime_cycles"` // Lifecycle cycles for binding machine
	BindingMachinePrice   float64 `json:"binding_machine_price"`   // Purchase price of binding machine

	TargetCurrency string `json:"target_currency"`
}

// CostBreakdownItem represents normalized cost components per unit or per total job
type CostBreakdownItem struct {
	PaperCost        float64 `json:"paper_cost"`
	BlackInkCost     float64 `json:"black_ink_cost"`
	ColorInkCost     float64 `json:"color_ink_cost"`
	PlateCost        float64 `json:"plate_cost"`
	DepreciationCost float64 `json:"depreciation_cost"`
	MaintenanceCost  float64 `json:"maintenance_cost"`
	SetupCost        float64 `json:"setup_cost"`
	FinishingCost    float64 `json:"finishing_cost"`
	LaborCost        float64 `json:"labor_cost"`
	DirectSubtotal   float64 `json:"direct_subtotal"`
	OverheadCost     float64 `json:"overhead_cost"`
	TotalCost        float64 `json:"total_cost"`
}

// CalculationResponse details the cost breakdown and sale prices
type CalculationResponse struct {
	JobName        string            `json:"job_name"`
	Quantity       int               `json:"quantity"`
	AreaFactor     float64           `json:"area_factor"`
	TotalBreakdown CostBreakdownItem `json:"total_breakdown"`
	UnitBreakdown  CostBreakdownItem `json:"unit_breakdown"`

	// Cost breakdown
	PaperCost           float64 `json:"paper_cost"`
	OffcutRebateCost    float64 `json:"offcut_rebate_cost"`
	InkCost             float64 `json:"ink_cost"` // Total combined ink cost
	InkCostK            float64 `json:"ink_cost_k"`
	InkCostCMY          float64 `json:"ink_cost_cmy"`
	PlateCost           float64 `json:"plate_cost"`
	DepreciationCost    float64 `json:"depreciation_cost"`
	MaintenanceCost     float64 `json:"maintenance_cost"`
	CustomFinishingCost float64 `json:"custom_finishing_cost"`
	LaminationCost      float64 `json:"lamination_cost"`
	BindingCost         float64 `json:"binding_cost"`
	LaborCost           float64 `json:"labor_cost"`
	SetupCost           float64 `json:"setup_cost"`
	FinishingCost       float64 `json:"finishing_cost"`

	// Aggregates
	DirectCost      float64 `json:"direct_cost"`
	OverheadCost    float64 `json:"overhead_cost"`
	Subtotal        float64 `json:"subtotal"`          // DirectCost + OverheadCost
	SpoilageCost    float64 `json:"spoilage_cost"`     // Subtotal × SpoilagePercent
	NetInternalCost float64 `json:"net_internal_cost"` // Subtotal × (1 + SpoilagePercent)
	TotalCost       float64 `json:"total_cost"`        // Total internal cost

	// Selling price pipeline with Tax Option & Deposit
	SalePrice      float64 `json:"sale_price"`      // NetInternalCost / (1 − Margin)
	DiscountAmount float64 `json:"discount_amount"` // SalePrice × DiscountPercent
	TaxMode        string  `json:"tax_mode"`        // "NONE" | "EXCLUDED" | "INCLUDED"
	TaxAmount      float64 `json:"tax_amount"`      // Computed based on TaxMode
	GrandTotal     float64 `json:"grand_total"`     // Final total price to customer
	DepositPercent float64 `json:"deposit_percent"` // 0, 30, 50, 100
	DepositAmount  float64 `json:"deposit_amount"`  // GrandTotal * DepositPercent / 100
	BalanceDue     float64 `json:"balance_due"`     // GrandTotal - DepositAmount
	UnitPrice      float64 `json:"unit_price"`      // GrandTotal / Quantity

	// Meta
	GrossMarginPercent    float64                 `json:"gross_margin_percent"`
	ProfitMargin          float64                 `json:"profit_margin"`
	VolumeDiscountPercent float64                 `json:"volume_discount_percent"`
	Currency              string                  `json:"currency"`
	ExchangeRate          float64                 `json:"exchange_rate"`
	CustomOptions         []CustomFinishingOption `json:"custom_options"`
	Imposition            *LayoutGrid             `json:"imposition,omitempty"`
	WastePercent          float64                 `json:"waste_percent,omitempty"`
	UsedOffcutLotID       string                  `json:"used_offcut_lot_id,omitempty"`
	OffcutSavingsPercent  float64                 `json:"offcut_savings_percent,omitempty"`
	OffcutRecommended     bool                    `json:"offcut_recommended,omitempty"`
	OffcutLotName         string                  `json:"offcut_lot_name,omitempty"`
}

// a4BaselineArea is the reference area (mm²) used for Paper Area Factor S (210 x 297 mm = 62370)
const a4BaselineArea = 62370.0

// CalculateSpineWidthMM calculates spine thickness for booklets/books
// Formula: (pageCount / 2.0) * sheetThickness + coverAndGlueOffset
func CalculateSpineWidthMM(pageCount int, paperGSM float64) float64 {
	if pageCount <= 0 {
		return 0.0
	}
	sheetThickness := 0.105 // Default 80g Green Read sheet thickness ~0.105mm
	if paperGSM > 0 {
		sheetThickness = (paperGSM / 80.0) * 0.105
	}
	offset := 0.80 // Art card 260g cover + hot glue offset ~0.80mm
	spine := (float64(pageCount)/2.0)*sheetThickness + offset
	return math.Round(spine*10.0) / 10.0
}

// GetBindingConsumableCostLAK returns standard consumable cost in LAK for 5 binding types
func GetBindingConsumableCostLAK(bType string) float64 {
	switch bType {
	case "PERFECT_HOT_GLUE", "HOT_GLUE", "glue":
		return 350.0
	case "SADDLE_STITCH", "STAPLE", "staple":
		return 100.0
	case "WIRE_O", "WIRE-O", "wire-o":
		return 2500.0
	case "PLASTIC_COMB", "COMB", "comb":
		return 1500.0
	case "CALENDAR", "calendar":
		return 3500.0
	default:
		return 0.0
	}
}

// CalculateBindingCostLAK calculates per-book binding cost including machine depreciation & consumables
func CalculateBindingCostLAK(bType string, machinePriceLAK float64, lifetimeCycles float64) float64 {
	consumable := GetBindingConsumableCostLAK(bType)
	if consumable == 0 && (bType == "" || bType == "none" || bType == "NONE") {
		return 0.0
	}
	depreciation := 0.0
	if machinePriceLAK > 0 && lifetimeCycles > 0 {
		depreciation = (machinePriceLAK * 1.10) / lifetimeCycles
	}
	return roundToTwoDecimals(depreciation + consumable)
}

// CalculateCutLayout determines the maximum number of pieces that can fit on a parent sheet using 2D imposition
func CalculateCutLayout(jobW, jobH, parentW, parentH float64) int {
	if jobW <= 0 || jobH <= 0 || parentW <= 0 || parentH <= 0 {
		return 1
	}
	cuts, _, _ := CalculateImposition(
		decimal.NewFromFloat(jobW),
		decimal.NewFromFloat(jobH),
		decimal.NewFromFloat(parentW),
		decimal.NewFromFloat(parentH),
		decimal.Zero,
		decimal.Zero,
	)
	if cuts < 1 {
		return 1
	}
	return cuts
}

// CalculateJobPricing performs the backend pricing engine math with Decimal precision
func CalculateJobPricing(req CalculationRequest) (CalculationResponse, error) {
	// ── Input Validation & Sanitization ──────────────────────────────────────────
	req.JobName = strings.TrimSpace(req.JobName)
	if req.JobName == "" {
		req.JobName = "Standard Print Job"
	}
	if req.Quantity <= 0 {
		return CalculationResponse{}, errors.New("quantity must be greater than zero")
	}
	if req.Quantity > 10000000 {
		return CalculationResponse{}, errors.New("quantity exceeds maximum batch limit (10,000,000)")
	}
	if req.JobWidth < 0 || req.JobHeight < 0 {
		return CalculationResponse{}, errors.New("dimensions cannot be negative")
	}
	if req.PaperCostPerUnit < 0 || req.SetupCost < 0 || req.FinishingCost < 0 {
		return CalculationResponse{}, errors.New("costs cannot be negative")
	}

	// ── In-Memory Cache Lookup ──────────────────────────────────────────────────
	var cacheKey string
	if reqBytes, err := json.Marshal(req); err == nil {
		cacheKey = string(reqBytes)
		if cachedRes, found := GlobalPricingCache.Get(cacheKey); found {
			return cachedRes, nil
		}
	}

	dQuantity := decimal.NewFromInt(int64(req.Quantity))

	// ── Defaults & Overhead ───────────────────────────────────────────────────
	dOverheadPct := decimal.NewFromFloat(req.OverheadPercent)
	if dOverheadPct.LessThanOrEqual(decimal.Zero) {
		dOverheadPct = decimal.NewFromFloat(0.15) // Default 15% overhead
	}

	// Handle profit margin & fallback
	dBaseMargin := decimal.Zero
	if req.BaseProfitPct > 0 {
		dBaseMargin = decimal.NewFromFloat(req.BaseProfitPct)
		if dBaseMargin.GreaterThan(decimal.NewFromFloat(1.0)) {
			dBaseMargin = dBaseMargin.Div(decimal.NewFromFloat(100.0))
		}
	} else if req.TargetMarginPercent > 0 {
		dBaseMargin = decimal.NewFromFloat(req.TargetMarginPercent)
		if dBaseMargin.GreaterThanOrEqual(decimal.NewFromFloat(100.0)) {
			dBaseMargin = dBaseMargin.Div(decimal.NewFromFloat(100.0))
		}
	} else if req.MarkupMargin > 0 {
		dBaseMargin = decimal.NewFromFloat(req.MarkupMargin)
		if dBaseMargin.GreaterThanOrEqual(decimal.NewFromFloat(100.0)) {
			dBaseMargin = dBaseMargin.Div(decimal.NewFromFloat(100.0))
		}
	}

	// Volume Discount Logic on Margin:
	dVolumeDiscountPct := decimal.Zero
	if req.Quantity >= 1000 {
		dVolumeDiscountPct = decimal.NewFromFloat(20.0)
	} else if req.Quantity >= 500 {
		dVolumeDiscountPct = decimal.NewFromFloat(10.0)
	}

	// effectiveMargin = baseMargin * (1.0 - volumeDiscountPct/100.0)
	dEffectiveMargin := dBaseMargin.Mul(decimal.NewFromFloat(1.0).Sub(dVolumeDiscountPct.Div(decimal.NewFromFloat(100.0))))

	// Margin Protection Guard
	if dEffectiveMargin.GreaterThanOrEqual(decimal.NewFromFloat(0.99)) {
		dEffectiveMargin = decimal.NewFromFloat(0.99)
	}
	if dEffectiveMargin.LessThan(decimal.Zero) {
		dEffectiveMargin = decimal.Zero
	}

	// Job dimensions with fallback to Unfolded dimensions or A4 defaults
	jobW := req.JobWidth
	if jobW <= 0 && req.UnfoldedWidthMM > 0 {
		jobW = req.UnfoldedWidthMM
	}
	if jobW <= 0 {
		jobW = 210.0
	}

	jobH := req.JobHeight
	if jobH <= 0 && req.UnfoldedHeightMM > 0 {
		jobH = req.UnfoldedHeightMM
	}
	if jobH <= 0 {
		jobH = 297.0
	}

	// ── Step 1: Paper Area Factor S ──────────────────────────────────────────
	dJobW := decimal.NewFromFloat(jobW)
	dJobH := decimal.NewFromFloat(jobH)
	dA4Base := decimal.NewFromFloat(a4BaselineArea)
	dAreaFactor := dJobW.Mul(dJobH).Div(dA4Base)

	cutsPerSheet := req.CutsPerSheet
	var impositionGrid *LayoutGrid
	var calculatedWastePct float64
	if req.ParentSheetWidthMM > 0 && req.ParentSheetHeightMM > 0 {
		dParentW := decimal.NewFromFloat(req.ParentSheetWidthMM)
		dParentH := decimal.NewFromFloat(req.ParentSheetHeightMM)
		dBleed := decimal.NewFromFloat(req.BleedMarginMM)
		dGutter := decimal.NewFromFloat(req.GutterMM)
		cuts, wasteDec, grid := CalculateImposition(dJobW, dJobH, dParentW, dParentH, dBleed, dGutter)
		if cutsPerSheet <= 0 {
			cutsPerSheet = cuts
		}
		impositionGrid = &grid
		calculatedWastePct = wasteDec.InexactFloat64()
	} else if cutsPerSheet <= 0 {
		cutsPerSheet = 1
	}

	// ── Step 2: Paper Cost & Offcut Rebate ────────────────────────────────────
	var dPaperCost decimal.Decimal
	dOffcutRebate := decimal.Zero
	if req.UseOffcutRebate && req.OffcutRebateCost > 0 {
		dOffcutRebate = decimal.NewFromFloat(req.OffcutRebateCost)
	}

	if req.PaperFormat == "roll" && req.PaperRollPricePerM2 > 0 {
		dPricePerM2 := decimal.NewFromFloat(req.PaperRollPricePerM2)
		dJobAreaM2 := dJobW.Div(decimal.NewFromFloat(1000.0)).Mul(dJobH.Div(decimal.NewFromFloat(1000.0)))
		dPaperCost = dPricePerM2.Mul(dJobAreaM2).Mul(dQuantity)
	} else {
		reqSheets := math.Ceil(float64(req.Quantity) / float64(cutsPerSheet))
		spoilPct := req.SpoilagePercent
		if spoilPct < 0 {
			spoilPct = 0
		}
		totalLargeSheets := decimal.NewFromFloat(math.Ceil(reqSheets * (1.0 + spoilPct)))

		sheetsPerPack := req.SheetsPerPack
		if sheetsPerPack <= 0 {
			sheetsPerPack = 500
		}

		dCostPerPack := decimal.NewFromFloat(req.PaperCostPerUnit)
		dCostPerSheet := dCostPerPack
		if req.PaperCostPerUnit > 0 && sheetsPerPack > 1 {
			dCostPerSheet = dCostPerPack.Div(decimal.NewFromInt(int64(sheetsPerPack)))
		}
		dPaperCost = totalLargeSheets.Mul(dCostPerSheet)
	}

	// Apply offcut rebate if paper cost allows
	if dOffcutRebate.GreaterThan(decimal.Zero) {
		dPaperCost = dPaperCost.Sub(dOffcutRebate)
		if dPaperCost.LessThan(decimal.Zero) {
			dPaperCost = decimal.Zero
		}
	}

	// Offcut inventory check for small items (tags, stickers, business cards <= 150x210 mm)
	var usedOffcutLotID string
	var offcutLotName string
	var offcutSavingsPercent float64
	var offcutRecommended bool

	isSmallItem := (jobW <= 150 && jobH <= 210) || (jobW <= 210 && jobH <= 150)
	if isSmallItem && req.PaperCostPerUnit > 0 {
		if matchedOffcut := inventory.GetMatchingOffcut(req.PaperSku, req.PaperName, jobW, jobH, req.Quantity); matchedOffcut != nil {
			usedOffcutLotID = matchedOffcut.ID
			offcutLotName = matchedOffcut.Name
			offcutSavingsPercent = 35.0
			offcutRecommended = true
			// Apply 35% savings on paper cost using warehouse offcut scrap
			dPaperCost = dPaperCost.Mul(decimal.NewFromFloat(0.65))
		}
	}

	// ── Step 3: Ink & Plate Costs ─────────────────────────────────────────────
	var dInkCostK, dInkCostCMY, dInkCost decimal.Decimal
	var dPlateCost decimal.Decimal
	totalPlates := 0

	costK := req.InkCostKPerMl
	if costK <= 0 {
		costK = req.InkCostPerMl
	}
	if costK <= 0 {
		costK = 250000.0 // Default bottle cost in LAK
	}

	costCMY := req.InkCostCMYPerMl
	if costCMY <= 0 {
		costCMY = req.InkCostPerMl
	}
	if costCMY <= 0 {
		costCMY = 250000.0 // Default bottle cost in LAK
	}

	isoK := req.IsoYieldK
	if isoK <= 0 {
		isoK = 4000.0
	}
	isoCMY := req.IsoYieldCMY
	if isoCMY <= 0 {
		isoCMY = 4000.0
	}

	dCostK := decimal.NewFromFloat(costK)
	dIsoK := decimal.NewFromFloat(isoK)
	dCostCMY := decimal.NewFromFloat(costCMY)
	dIsoCMY := decimal.NewFromFloat(isoCMY)
	dFive := decimal.NewFromFloat(5.0)

	if len(req.PrintingProcesses) > 0 {
		// Multi-printer & Channel-based calculation
		dInkCost = decimal.Zero
		dInkCostK = decimal.Zero
		dInkCostCMY = decimal.Zero

		for _, proc := range req.PrintingProcesses {
			procQty := req.Quantity
			if proc.AllocatedPages > 0 {
				procQty = proc.AllocatedPages
			}
			dProcQty := decimal.NewFromInt(int64(procQty))

			if proc.ColorMode == "SEPARATE_CHANNEL" && len(proc.ColorChannels) > 0 {
				for _, ch := range proc.ColorChannels {
					totalPlates++
					dDensity := decimal.NewFromFloat(ch.DensityPct)
					if ch.ChannelName == "K" || ch.ChannelName == "Black" {
						chCost := dCostK.Div(dIsoK).Mul(dDensity.Div(dFive)).Mul(dAreaFactor).Mul(dProcQty)
						dInkCostK = dInkCostK.Add(chCost)
						dInkCost = dInkCost.Add(chCost)
					} else {
						chCost := dCostCMY.Div(dIsoCMY).Mul(dDensity.Div(dFive)).Mul(dAreaFactor).Mul(dProcQty)
						dInkCostCMY = dInkCostCMY.Add(chCost)
						dInkCost = dInkCost.Add(chCost)
					}
				}
			} else {
				// Average Density mode
				avgDensity := proc.AverageDensity
				if avgDensity <= 0 {
					avgDensity = 100.0
				}
				totalPlates += 4 // CMYK
				dDensity := decimal.NewFromFloat(avgDensity)
				kCost := dCostK.Div(dIsoK).Mul(dDensity.Div(decimal.NewFromFloat(4.0)).Div(dFive)).Mul(dAreaFactor).Mul(dProcQty)
				cmyCost := dCostCMY.Div(dIsoCMY).Mul(dDensity.Mul(decimal.NewFromFloat(0.75)).Div(dFive)).Mul(dAreaFactor).Mul(dProcQty)
				dInkCostK = dInkCostK.Add(kCost)
				dInkCostCMY = dInkCostCMY.Add(cmyCost)
				dInkCost = dInkCost.Add(kCost).Add(cmyCost)
			}
		}

		if req.PlateCostPerUnit > 0 && totalPlates > 0 {
			dPlateCost = decimal.NewFromInt(int64(totalPlates)).Mul(decimal.NewFromFloat(req.PlateCostPerUnit))
		}
	} else {
		// Standard legacy single/split ink or preflight multi-page CMYK calculation
		pageMultiplier := 1.0
		if req.PageCount > 1 {
			pageMultiplier = float64(req.PageCount)
		}
		dPageMult := decimal.NewFromFloat(pageMultiplier)

		inkCovK := req.InkCoverageKPercent
		inkCovCMY := req.InkCoverageCMYPercent

		// Check if Preflight CMYK averages are provided
		if req.AvgCovC > 0 || req.AvgCovM > 0 || req.AvgCovY > 0 || req.AvgCovK > 0 {
			inkCovK = req.AvgCovK
			inkCovCMY = req.AvgCovC + req.AvgCovM + req.AvgCovY
		} else if inkCovK == 0 && inkCovCMY == 0 && req.InkCoveragePercent > 0 {
			inkCovK = req.InkCoveragePercent
		}
		if inkCovCMY < 0 {
			inkCovCMY = 0.0
		}

		dInkCovK := decimal.NewFromFloat(inkCovK)
		dInkCovCMY := decimal.NewFromFloat(inkCovCMY)

		dInkCostK = dCostK.Div(dIsoK).Mul(dInkCovK.Div(dFive)).Mul(dAreaFactor).Mul(dQuantity).Mul(dPageMult)
		dInkCostCMY = dCostCMY.Div(dIsoCMY).Mul(dInkCovCMY.Div(dFive)).Mul(dAreaFactor).Mul(dQuantity).Mul(dPageMult)
		dInkCost = dInkCostK.Add(dInkCostCMY)

		if req.PlateCostPerUnit > 0 {
			dPlateCost = decimal.NewFromFloat(req.PlateCostPerUnit).Mul(decimal.NewFromInt(4))
		}
	}

	// ── Step 4: Printer Depreciation & Maintenance ───────────────────────────
	dDepreciationCost := decimal.Zero
	dMaintenanceCost := decimal.Zero

	dJobPages := dQuantity.Mul(dAreaFactor)
	if req.PageCount > 1 {
		dJobPages = dJobPages.Mul(decimal.NewFromInt(int64(req.PageCount)))
	}

	if len(req.PrintingProcesses) > 0 {
		for _, proc := range req.PrintingProcesses {
			if proc.CostPerPage > 0 {
				pages := req.Quantity
				if proc.AllocatedPages > 0 {
					pages = proc.AllocatedPages
				}
				dPages := decimal.NewFromInt(int64(pages))
				dCost := decimal.NewFromFloat(proc.CostPerPage)
				dDepreciationCost = dDepreciationCost.Add(dPages.Mul(dCost))
			}
		}
	} else if len(req.Allocations) > 0 {
		for _, alloc := range req.Allocations {
			dAllocPages := decimal.NewFromInt(int64(alloc.AllocatedPages))
			dCostPerPage := decimal.NewFromFloat(alloc.CostPerPage)
			dDepreciationCost = dDepreciationCost.Add(dAllocPages.Mul(dCostPerPage))
		}
	} else if req.MachinePrice > 0 && req.TargetTotalPages > 0 {
		dMachinePrice := decimal.NewFromFloat(req.MachinePrice)
		dTargetPages := decimal.NewFromFloat(req.TargetTotalPages)
		dDeprecPerPage := dMachinePrice.Div(dTargetPages)

		maintRate := req.MaintenanceRatePercent
		if maintRate <= 0 {
			maintRate = 20.0
		}
		dMaintRate := decimal.NewFromFloat(maintRate).Div(decimal.NewFromFloat(100.0))

		// DepreciationCost includes MaintenanceRatePercent: (MachinePrice * (1 + MaintRate) / TargetTotalPages) * JobPages
		dDepreciationCost = dDeprecPerPage.Mul(decimal.NewFromFloat(1.0).Add(dMaintRate)).Mul(dJobPages)
	}

	if req.MaintenanceCostPerPage > 0 {
		dMaintenanceCost = decimal.NewFromFloat(req.MaintenanceCostPerPage).Mul(dJobPages)
	}

	// ── Step 5: Finishing & Custom Options ────────────────────────────────────
	dLaminationCost := decimal.NewFromFloat(req.LaminationCost).Mul(dQuantity)

	// Automatic binding cost computation if binding type is provided
	bindingUnitCost := req.BindingCost
	if bindingUnitCost == 0 && req.BindingType != "" && req.BindingType != "none" && req.BindingType != "NONE" {
		bindingUnitCost = CalculateBindingCostLAK(req.BindingType, req.BindingMachinePrice, req.BindingLifetimeCycles)
	}
	dBindingCost := decimal.NewFromFloat(bindingUnitCost).Mul(dQuantity)
	dFinishingCost := decimal.NewFromFloat(req.FinishingCost).Mul(dQuantity).Add(dLaminationCost).Add(dBindingCost)

	// Machine-Linked Finishing Asset Processes
	if len(req.FinishingProcesses) > 0 {
		for _, fProc := range req.FinishingProcesses {
			if fProc.UnitCost > 0 {
				dFinishingCost = dFinishingCost.Add(decimal.NewFromFloat(fProc.UnitCost).Mul(dQuantity))
			}
			if fProc.MachineHourlyRate > 0 {
				totalMins := float64(fProc.EstimatedSetupTimeMins + fProc.EstimatedRunTimeMins)
				if totalMins > 0 {
					mCost := decimal.NewFromFloat(fProc.MachineHourlyRate).Mul(decimal.NewFromFloat(totalMins / 60.0))
					dFinishingCost = dFinishingCost.Add(mCost)
				}
			}
		}
	}

	dCustomFinishingCost := decimal.Zero
	dJobAreaM2 := dJobW.Div(decimal.NewFromFloat(1000.0)).Mul(dJobH.Div(decimal.NewFromFloat(1000.0)))

	for _, opt := range req.CustomFinishingOptions {
		dPrice := decimal.NewFromFloat(opt.Price)
		switch opt.ChargeType {
		case "FIXED_JOB":
			dCustomFinishingCost = dCustomFinishingCost.Add(dPrice)
		case "PER_UNIT":
			dCustomFinishingCost = dCustomFinishingCost.Add(dPrice.Mul(dQuantity))
		case "PER_SQM":
			dCustomFinishingCost = dCustomFinishingCost.Add(dPrice.Mul(dJobAreaM2).Mul(dQuantity))
		default:
			dCustomFinishingCost = dCustomFinishingCost.Add(dPrice)
		}
	}

	// ── Step 6: Setup Cost & Labor Cost ──────────────────────────────────────
	dSetupCost := decimal.NewFromFloat(req.SetupCost)
	if req.SetupCostMode == "percent" && req.SetupCostPercent > 0 {
		dSetupPercent := decimal.NewFromFloat(req.SetupCostPercent).Div(decimal.NewFromFloat(100.0))
		dSetupCost = dPaperCost.Add(dInkCost).Mul(dSetupPercent)
	}

	dLaborCost := decimal.Zero
	switch req.LaborMode {
	case "manual":
		if req.LaborCostManual > 0 {
			dLaborCost = decimal.NewFromFloat(req.LaborCostManual)
		} else {
			dLaborCost = decimal.NewFromFloat(req.LaborCostPerHour).Mul(decimal.NewFromFloat(req.EstimatedHours))
		}
	case "percent":
		laborPct := req.LaborPercent
		if laborPct <= 0 {
			laborPct = 10.0
		}
		dLaborPct := decimal.NewFromFloat(laborPct).Div(decimal.NewFromFloat(100.0))
		dLaborCost = dPaperCost.Add(dInkCost).Mul(dLaborPct)
	default:
		if req.LaborCostManual > 0 {
			dLaborCost = decimal.NewFromFloat(req.LaborCostManual)
		} else {
			rate := req.LaborCostPerHour
			if rate <= 0 {
				rate = 50000.0 // Default 50k LAK/hr
			}
			hrs := req.EstimatedHours
			if hrs <= 0 {
				hrs = float64(req.Quantity) / 500.0
				if hrs < 0.5 {
					hrs = 0.5
				}
			}
			dLaborCost = decimal.NewFromFloat(rate).Mul(decimal.NewFromFloat(hrs))
		}
	}

	// ── Step 7: Totals, Overhead, Spoilage, Net Cost ───────────────────────────
	dDirectCost := dPaperCost.
		Add(dInkCost).
		Add(dPlateCost).
		Add(dDepreciationCost).
		Add(dMaintenanceCost).
		Add(dSetupCost).
		Add(dFinishingCost).
		Add(dCustomFinishingCost).
		Add(dLaborCost)

	dOverheadCost := dDirectCost.Mul(dOverheadPct)
	dSubtotal := dDirectCost.Add(dOverheadCost)

	spoilPct := req.SpoilagePercent
	if spoilPct < 0 {
		spoilPct = 0
	}
	dSpoilagePct := decimal.NewFromFloat(spoilPct)
	dSpoilageCost := dSubtotal.Mul(dSpoilagePct)
	dNetInternalCost := dSubtotal.Add(dSpoilageCost)

	// ── Step 8: Sale Price, Tax Option & Deposit ──────────────────────────────
	dOneMinusMargin := decimal.NewFromFloat(1.0).Sub(dEffectiveMargin)
	dSalePrice := dNetInternalCost
	if dOneMinusMargin.GreaterThan(decimal.Zero) {
		dSalePrice = dNetInternalCost.Div(dOneMinusMargin)
	}

	dDiscountPercent := decimal.NewFromFloat(req.DiscountPercent)
	if dDiscountPercent.GreaterThan(decimal.NewFromFloat(1.0)) {
		dDiscountPercent = dDiscountPercent.Div(decimal.NewFromFloat(100.0))
	}
	dDiscountAmount := dSalePrice.Mul(dDiscountPercent)
	dTaxableSubtotal := dSalePrice.Sub(dDiscountAmount)

	// Tax Mode Handling
	taxMode := req.TaxMode
	if taxMode == "" {
		if req.TaxPercent > 0 {
			taxMode = "EXCLUDED"
		} else {
			taxMode = "NONE"
		}
	}

	dTaxPercent := decimal.NewFromFloat(req.TaxPercent)
	if dTaxPercent.GreaterThan(decimal.NewFromFloat(1.0)) {
		dTaxPercent = dTaxPercent.Div(decimal.NewFromFloat(100.0))
	}
	if dTaxPercent.IsZero() && taxMode != "NONE" {
		dTaxPercent = decimal.NewFromFloat(0.07) // Default 7% VAT
	}

	dTaxAmount := decimal.Zero
	dGrandTotal := dTaxableSubtotal

	switch taxMode {
	case "NONE":
		dTaxAmount = decimal.Zero
		dGrandTotal = dTaxableSubtotal
	case "EXCLUDED":
		dTaxAmount = dTaxableSubtotal.Mul(dTaxPercent)
		dGrandTotal = dTaxableSubtotal.Add(dTaxAmount)
	case "INCLUDED":
		dOnePlusTax := decimal.NewFromFloat(1.0).Add(dTaxPercent)
		dBaseWithoutTax := dTaxableSubtotal.Div(dOnePlusTax)
		dTaxAmount = dTaxableSubtotal.Sub(dBaseWithoutTax)
		dGrandTotal = dTaxableSubtotal
	default:
		dTaxAmount = decimal.Zero
		dGrandTotal = dTaxableSubtotal
	}

	// Non-LAK two decimal place rounding helper
	salePriceFloat := roundToTwoDecimals(dSalePrice.InexactFloat64())
	discountFloat := roundToTwoDecimals(dDiscountAmount.InexactFloat64())
	taxFloat := roundToTwoDecimals(dTaxAmount.InexactFloat64())
	grandTotalFloat := roundToTwoDecimals(dGrandTotal.InexactFloat64())
	netCostFloat := roundToTwoDecimals(dNetInternalCost.InexactFloat64())

	// LAK integer rounding if requested
	if req.TargetCurrency == "LAK" {
		salePriceFloat = math.Round(salePriceFloat)
		discountFloat = math.Round(discountFloat)
		taxFloat = math.Round(taxFloat)
		grandTotalFloat = math.Round(grandTotalFloat)
	}

	depositPct := req.DepositPercent
	if depositPct <= 0 {
		depositPct = 0
	}
	depositAmountFloat := roundToTwoDecimals(grandTotalFloat * (depositPct / 100.0))
	balanceDueFloat := roundToTwoDecimals(grandTotalFloat - depositAmountFloat)
	unitPriceFloat := roundToTwoDecimals(grandTotalFloat / float64(req.Quantity))

	// Calculate Gross Profit Margin %: ((TotalAmount - TotalCost) / TotalAmount) * 100
	grossMarginPercent := 0.0
	if grandTotalFloat > 0 {
		grossMarginPercent = roundToTwoDecimals(((grandTotalFloat - netCostFloat) / grandTotalFloat) * 100.0)
	} else if salePriceFloat > 0 {
		grossMarginPercent = roundToTwoDecimals(((salePriceFloat - netCostFloat) / salePriceFloat) * 100.0)
	}

	// Populate TotalBreakdown and UnitBreakdown
	totalBreakdown := CostBreakdownItem{
		PaperCost:        roundToTwoDecimals(dPaperCost.InexactFloat64()),
		BlackInkCost:     roundToTwoDecimals(dInkCostK.InexactFloat64()),
		ColorInkCost:     roundToTwoDecimals(dInkCostCMY.InexactFloat64()),
		PlateCost:        roundToTwoDecimals(dPlateCost.InexactFloat64()),
		DepreciationCost: roundToTwoDecimals(dDepreciationCost.InexactFloat64()),
		MaintenanceCost:  roundToTwoDecimals(dMaintenanceCost.InexactFloat64()),
		SetupCost:        roundToTwoDecimals(dSetupCost.InexactFloat64()),
		FinishingCost:    roundToTwoDecimals(dFinishingCost.Add(dCustomFinishingCost).InexactFloat64()),
		LaborCost:        roundToTwoDecimals(dLaborCost.InexactFloat64()),
		DirectSubtotal:   roundToTwoDecimals(dDirectCost.InexactFloat64()),
		OverheadCost:     roundToTwoDecimals(dOverheadCost.InexactFloat64()),
		TotalCost:        roundToTwoDecimals(dNetInternalCost.InexactFloat64()),
	}

	unitBreakdown := CostBreakdownItem{
		PaperCost:        roundToTwoDecimals(dPaperCost.Div(dQuantity).InexactFloat64()),
		BlackInkCost:     roundToTwoDecimals(dInkCostK.Div(dQuantity).InexactFloat64()),
		ColorInkCost:     roundToTwoDecimals(dInkCostCMY.Div(dQuantity).InexactFloat64()),
		PlateCost:        roundToTwoDecimals(dPlateCost.Div(dQuantity).InexactFloat64()),
		DepreciationCost: roundToTwoDecimals(dDepreciationCost.Div(dQuantity).InexactFloat64()),
		MaintenanceCost:  roundToTwoDecimals(dMaintenanceCost.Div(dQuantity).InexactFloat64()),
		SetupCost:        roundToTwoDecimals(dSetupCost.Div(dQuantity).InexactFloat64()),
		FinishingCost:    roundToTwoDecimals(dFinishingCost.Add(dCustomFinishingCost).Div(dQuantity).InexactFloat64()),
		LaborCost:        roundToTwoDecimals(dLaborCost.Div(dQuantity).InexactFloat64()),
		DirectSubtotal:   math.Round(dDirectCost.Div(dQuantity).InexactFloat64()),
		OverheadCost:     roundToTwoDecimals(dOverheadCost.Div(dQuantity).InexactFloat64()),
		TotalCost:        roundToTwoDecimals(dNetInternalCost.Div(dQuantity).InexactFloat64()),
	}

	response := CalculationResponse{
		JobName:               req.JobName,
		Quantity:              req.Quantity,
		AreaFactor:            roundToTwoDecimals(dAreaFactor.InexactFloat64()),
		TotalBreakdown:        totalBreakdown,
		UnitBreakdown:         unitBreakdown,
		PaperCost:             roundToTwoDecimals(dPaperCost.InexactFloat64()),
		OffcutRebateCost:      roundToTwoDecimals(dOffcutRebate.InexactFloat64()),
		InkCost:               roundToTwoDecimals(dInkCost.InexactFloat64()),
		InkCostK:              roundToTwoDecimals(dInkCostK.InexactFloat64()),
		InkCostCMY:            roundToTwoDecimals(dInkCostCMY.InexactFloat64()),
		PlateCost:             roundToTwoDecimals(dPlateCost.InexactFloat64()),
		DepreciationCost:      roundToTwoDecimals(dDepreciationCost.InexactFloat64()),
		MaintenanceCost:       roundToTwoDecimals(dMaintenanceCost.InexactFloat64()),
		CustomFinishingCost:   roundToTwoDecimals(dCustomFinishingCost.InexactFloat64()),
		LaminationCost:        roundToTwoDecimals(dLaminationCost.InexactFloat64()),
		BindingCost:           roundToTwoDecimals(dBindingCost.InexactFloat64()),
		LaborCost:             roundToTwoDecimals(dLaborCost.InexactFloat64()),
		SetupCost:             roundToTwoDecimals(dSetupCost.InexactFloat64()),
		FinishingCost:         roundToTwoDecimals(dFinishingCost.InexactFloat64()),
		DirectCost:            roundToTwoDecimals(dDirectCost.InexactFloat64()),
		OverheadCost:          roundToTwoDecimals(dOverheadCost.InexactFloat64()),
		Subtotal:              roundToTwoDecimals(dSubtotal.InexactFloat64()),
		SpoilageCost:          roundToTwoDecimals(dSpoilageCost.InexactFloat64()),
		NetInternalCost:       netCostFloat,
		TotalCost:             netCostFloat,
		SalePrice:             salePriceFloat,
		DiscountAmount:        discountFloat,
		TaxMode:               taxMode,
		TaxAmount:             taxFloat,
		GrandTotal:            grandTotalFloat,
		DepositPercent:        depositPct,
		DepositAmount:         depositAmountFloat,
		BalanceDue:            balanceDueFloat,
		UnitPrice:             unitPriceFloat,
		GrossMarginPercent:    grossMarginPercent,
		ProfitMargin:          roundToTwoDecimals(dEffectiveMargin.InexactFloat64()),
		VolumeDiscountPercent: roundToTwoDecimals(dVolumeDiscountPct.InexactFloat64()),
		Currency:              req.TargetCurrency,
		ExchangeRate:          1.0,
		CustomOptions:         req.CustomFinishingOptions,
		Imposition:            impositionGrid,
		WastePercent:          roundToTwoDecimals(calculatedWastePct),
		UsedOffcutLotID:       usedOffcutLotID,
		OffcutSavingsPercent:  offcutSavingsPercent,
		OffcutRecommended:     offcutRecommended,
		OffcutLotName:         offcutLotName,
	}

	// Cache successful calculation
	GlobalPricingCache.Set(cacheKey, response)

	return response, nil
}

// roundToTwoDecimals rounds a float64 value to 2 decimal places
func roundToTwoDecimals(val float64) float64 {
	return math.Round(val*100.0) / 100.0
}

// ValidateAndCalculateAllocations verifies page allocations sum to target job quantity
func ValidateAndCalculateAllocations(targetQty int, allocations []PrinterAllocation) (float64, error) {
	if len(allocations) == 0 {
		return 0, nil
	}
	totalAllocated := 0
	totalCost := 0.0
	for _, alloc := range allocations {
		totalAllocated += alloc.AllocatedPages
		totalCost += alloc.SubtotalCost
	}
	if totalAllocated != targetQty {
		return 0, fmt.Errorf("allocated pages (%d) do not match target job quantity (%d)", totalAllocated, targetQty)
	}
	return totalCost, nil
}
