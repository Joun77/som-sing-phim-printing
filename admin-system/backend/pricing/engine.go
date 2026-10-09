package pricing

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"somsing.local/backend/db"
	"somsing.local/backend/finance"
	"strings"
	"time"

	"somsing.local/backend/inventory"

	"github.com/shopspring/decimal"
)

// ColorChannel represents a single color plate/channel (C, M, Y, K, or Spot)
type ColorChannel struct {
	ChannelName string  `json:"channel_name"` // "C", "M", "Y", "K", "PANTONE..."
	DensityPct  float64 `json:"density_pct"`
	IsSpotColor bool    `json:"is_spot_color"`
}

// Float64Ptr returns a pointer to the passed float64
func Float64Ptr(v float64) *float64 {
	return &v
}

// IntPtr returns a pointer to the passed int
func IntPtr(v int) *int {
	return &v
}

// PrinterProcessSetup represents a specific printer allocation with color modes
type PrinterProcessSetup struct {
	PrinterAssetID string         `json:"printer_asset_id"`
	Sequence       int            `json:"sequence"`
	ColorMode      string         `json:"color_mode"` // "AVERAGE" | "SEPARATE_CHANNEL" | "MONO_K"
	AverageDensity *float64       `json:"average_density_pct,omitempty"`
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
	ImpositionMode         string                  `json:"imposition_mode,omitempty"`
	StockDimensionSnapshot *StockDimensionSnapshot `json:"stock_dimension_snapshot,omitempty"`
	JobName                string                  `json:"job_name" binding:"required"`
	Quantity               int                     `json:"quantity" binding:"required,gt=0"`
	PaperSku               string                  `json:"paper_sku"`
	PaperName              string                  `json:"paper_name"`
	PaperCostPerUnit       float64                 `json:"paper_cost_per_unit"`     // Cost per ream/pack or unit
	PaperCostIsPerSheet    bool                    `json:"paper_cost_is_per_sheet"` // If true, PaperCostPerUnit is already per parent sheet
	PaperFormat            string                  `json:"paper_format"`            // "sheet" | "roll"
	SheetsPerPack          int                     `json:"sheets_per_pack"`         // Sheets per pack/ream (default 500 if pack cost)
	CutsPerSheet           int                     `json:"cuts_per_sheet"`          // Number of brochure/job pieces cut per large sheet (default 1)
	ManualSheetCount       int                     `json:"manual_sheet_count,omitempty"` // User manual override for required stock sheets
	Allocations            []PrinterAllocation     `json:"allocations"`

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
	InkCoverageKPercent   *float64 `json:"ink_coverage_k_percent,omitempty"`
	InkCoverageCMYPercent *float64 `json:"ink_coverage_cmy_percent,omitempty"`
	InkCostKPerMl         float64  `json:"ink_cost_k_per_ml"`
	InkCostCMYPerMl       float64  `json:"ink_cost_cmy_per_ml"`
	IsoYieldK             float64  `json:"iso_yield_k"`   // ISO 5% A4 yield for K (default 4000)
	IsoYieldCMY           float64  `json:"iso_yield_cmy"` // ISO 5% A4 yield for CMY (default 4000)

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
	PageCount             int      `json:"page_count"`              // Number of pages in booklet/book (default 1)
	IsDoubleSided         bool     `json:"is_double_sided"`          // Duplex printing flag (R1)
	AvgCovC               *float64 `json:"avg_cov_c,omitempty"`     // Average Cyan % from preflight
	AvgCovM               *float64 `json:"avg_cov_m,omitempty"`     // Average Magenta % from preflight
	AvgCovY               *float64 `json:"avg_cov_y,omitempty"`     // Average Yellow % from preflight
	AvgCovK               *float64 `json:"avg_cov_k,omitempty"`     // Average Black/Key % from preflight

	// Mixed Color & Mono Population Fields (R3)
	ColorPagesCount       *int     `json:"color_pages_count,omitempty"`
	MonoPagesCount        *int     `json:"mono_pages_count,omitempty"`
	MonoAvgCovK           *float64 `json:"mono_avg_cov_k,omitempty"`
	SpineWidthMM          float64 `json:"spine_width_mm"`          // Computed spine width in mm
	PaperGSM              float64 `json:"paper_gsm"`               // Paper grammage (e.g. 80, 260)
	BindingLifetimeCycles float64 `json:"binding_lifetime_cycles"` // Lifecycle cycles for binding machine
	BindingMachinePrice   float64 `json:"binding_machine_price"`   // Purchase price of binding machine

	// Electricity & Power Consumption
	MachinePowerWatts   float64 `json:"machine_power_watts"`   // Operating power in Watts
	MachineRuntimeHours float64 `json:"machine_runtime_hours"` // Estimated operating runtime in hours

	// Guillotine & Cutting Options
	RequiresGuillotineCut bool    `json:"requires_guillotine_cut"`
	GuillotineFlatFeeLAK  float64 `json:"guillotine_flat_fee_lak"` // Override or defaults to 10,000 LAK

	// Parent Sheet 31x43" & Rigid Board
	Use31x43ParentSheet  bool    `json:"use_31x43_parent_sheet"`
	IsRigidSubstrate     bool    `json:"is_rigid_substrate"`
	RigidBoardPricePerM2 float64 `json:"rigid_board_price_per_m2"`

	// Packaging Options
	IncludePackaging     bool    `json:"include_packaging"`
	PackagingCostPerUnit float64 `json:"packaging_cost_per_unit"`
	PackagingType        string  `json:"packaging_type"` // e.g. "BOX_SMALL", "BOX_LARGE", "CORRUGATED", "KRAFT_WRAP"

	// Baseline Coverage Allowance & Floor Threshold Pricing
	BaseFloorPrice          float64 `json:"base_floor_price"`          // Flat floor price minimum (e.g. 50,000 LAK)
	BaselineCoveragePercent float64 `json:"baseline_coverage_percent"` // Standard included coverage % (e.g. 10%)
	ThresholdMode           string  `json:"threshold_mode"`            // "FLOOR_OR_ACTUAL" | "FLAT_ADD_ON"
	DefaultMachineID        string  `json:"default_machine_id"`        // Linked printer asset ID (e.g. "PRN-001")

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
	MachineCost      float64 `json:"machine_cost"`
	ElectricityCost  float64 `json:"electricity_cost"`
	CuttingCost      float64 `json:"cutting_cost"`
	PackagingCost    float64 `json:"packaging_cost"`
	SetupCost        float64 `json:"setup_cost"`
	FinishingCost    float64 `json:"finishing_cost"`
	LaborCost        float64 `json:"labor_cost"`
	DirectSubtotal   float64 `json:"direct_subtotal"`
	OverheadCost     float64 `json:"overhead_cost"`
	TotalCost        float64 `json:"total_cost"`
}

// CalculationResponse details the cost breakdown and sale prices
type CalculationResponse struct {
	ImpositionMode         string                  `json:"imposition_mode,omitempty"`
	StockDimensionSnapshot *StockDimensionSnapshot `json:"stock_dimension_snapshot,omitempty"`
	JobName                string                  `json:"job_name"`
	Quantity               int                     `json:"quantity"`
	AreaFactor             float64                 `json:"area_factor"`
	TotalBreakdown         CostBreakdownItem       `json:"total_breakdown"`
	UnitBreakdown          CostBreakdownItem       `json:"unit_breakdown"`

	// Cost breakdown
	PaperCost             float64 `json:"paper_cost"`
	OffcutRebateCost      float64 `json:"offcut_rebate_cost"`
	InkCost               float64 `json:"ink_cost"` // Total combined ink cost
	InkCostK              float64 `json:"ink_cost_k"`
	InkCostCMY            float64 `json:"ink_cost_cmy"`
	PlateCost             float64 `json:"plate_cost"`
	DepreciationCost      float64 `json:"depreciation_cost"`
	MaintenanceCost       float64 `json:"maintenance_cost"`
	MachineCost           float64 `json:"machine_cost"`
	ElectricityCost       float64 `json:"electricity_cost"`
	GuillotineCuttingCost float64 `json:"guillotine_cutting_cost"`
	PackagingCost         float64 `json:"packaging_cost"`
	CustomFinishingCost   float64 `json:"custom_finishing_cost"`
	LaminationCost        float64 `json:"lamination_cost"`
	BindingCost           float64 `json:"binding_cost"`
	LaborCost             float64 `json:"labor_cost"`
	SetupCost             float64 `json:"setup_cost"`
	FinishingCost         float64 `json:"finishing_cost"`

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

	// Baseline Threshold & Real Cost Comparison
	BaseFloorPrice          float64 `json:"base_floor_price"`
	BaselineCoveragePercent float64 `json:"baseline_coverage_percent"`
	ThresholdMode           string  `json:"threshold_mode"`
	IsThresholdExceeded     bool    `json:"is_threshold_exceeded"`
	ThresholdSurcharge      float64 `json:"threshold_surcharge"`
	EffectiveSalePrice      float64 `json:"effective_sale_price"`

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

func init() {
	decimal.MarshalJSONWithoutQuotes = true
}

// a4BaselineArea is the reference area (mm²) used for Paper Area Factor S (210 x 297 mm = 62370)
const a4BaselineArea = 62370.0

// Standard Electricity, Cutting, and Parent Sheet Constants
const (
	StandardElectricityRateLAK  = 1700.0  // Standard commercial electricity rate in Laos (LAK/kWh)
	GuillotineFlatCuttingFeeLAK = 10000.0 // Standard flat job setup fee for Guillotine cutter (LAK)
	ParentSheet31x43WidthMM     = 787.0   // Standard 31" parent sheet width (mm)
	ParentSheet31x43HeightMM    = 1092.0  // Standard 43" parent sheet height (mm)
	StandardRigidBoardWidthMM   = 1220.0  // Standard 4x8 ft rigid board width (mm)
	StandardRigidBoardHeightMM  = 2440.0  // Standard 4x8 ft rigid board height (mm)
)

// CalculateSpineWidthMM calculates spine thickness for booklets/books using Decimal precision
// Formula: (pageCount / 2.0) * sheetThickness + coverAndGlueOffset
func CalculateSpineWidthMM(pageCount int, paperGSM float64) float64 {
	if pageCount <= 0 {
		return 0.0
	}
	dPages := decimal.NewFromInt(int64(pageCount))
	dThickness := decimal.NewFromFloat(0.105) // Default 80g Green Read sheet thickness ~0.105mm
	if paperGSM > 0 {
		dThickness = decimal.NewFromFloat(paperGSM).Div(decimal.NewFromFloat(80.0)).Mul(decimal.NewFromFloat(0.105))
	}
	dOffset := decimal.NewFromFloat(0.80) // Art card 260g cover + hot glue offset ~0.80mm
	dSpine := dPages.Div(decimal.NewFromFloat(2.0)).Mul(dThickness).Add(dOffset)
	res, _ := dSpine.Round(1).Float64()
	return res
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
	case "HARDCOVER_CASE_BINDING", "HARDCOVER", "hardcover", "case_binding":
		return 15000.0
	default:
		return 0.0
	}
}

// CalculateBindingCostLAK calculates per-book binding cost including machine depreciation & consumables
func CalculateBindingCostLAK(bType string, machinePriceLAK float64, lifetimeCycles float64) float64 {
	dConsumable := decimal.NewFromFloat(GetBindingConsumableCostLAK(bType))
	if dConsumable.IsZero() && (bType == "" || bType == "none" || bType == "NONE") {
		return 0.0
	}
	dDepreciation := decimal.Zero
	if machinePriceLAK > 0 && lifetimeCycles > 0 {
		dPrice := decimal.NewFromFloat(machinePriceLAK)
		dCycles := decimal.NewFromFloat(lifetimeCycles)
		dDepreciation = dPrice.Mul(decimal.NewFromFloat(1.10)).Div(dCycles)
	}
	total := dDepreciation.Add(dConsumable).Round(2)
	res, _ := total.Float64()
	return res
}

// CalculateMachineOverhead calculates machine depreciation and maintenance cost per A4 sheet using Decimal precision
func CalculateMachineOverhead(priceCost float64, expectedLifeA4Pages int, maintenanceRatePercent float64) (depreciationPerSheet, maintenancePerSheet, totalMachineCostPerSheet float64) {
	if expectedLifeA4Pages <= 0 || priceCost <= 0 {
		return 0, 0, 0
	}

	dPrice := decimal.NewFromFloat(priceCost)
	dLife := decimal.NewFromInt(int64(expectedLifeA4Pages))
	dDeprec := dPrice.Div(dLife)

	mRate := maintenanceRatePercent
	if mRate < 0 {
		mRate = 0
	}
	dMaintRate := decimal.NewFromFloat(mRate).Div(decimal.NewFromFloat(100.0))
	dMaint := dDeprec.Mul(dMaintRate)
	dTotal := dDeprec.Add(dMaint)

	dDeprecRes, _ := dDeprec.Round(2).Float64()
	dMaintRes, _ := dMaint.Round(2).Float64()
	dTotalRes, _ := dTotal.Round(2).Float64()
	return dDeprecRes, dMaintRes, dTotalRes
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
	if req.ImpositionMode != "" && req.ImpositionMode != "OFF" && req.ImpositionMode != "ON" {
		return CalculationResponse{}, &finance.OperationError{Status: 422, Code: "INVALID_IMPOSITION_MODE"}
	}
	if req.ImpositionMode == "OFF" {
		if req.Use31x43ParentSheet || req.PaperFormat == "roll" || req.PaperFormat == "parent_sheet" || req.PaperFormat == "31x43" || req.IsRigidSubstrate {
			return CalculationResponse{}, &finance.OperationError{Status: 422, Code: "OFF_CUTTING_OPTIONS_FORBIDDEN"}
		}

		width, height := req.JobWidth, req.JobHeight
		if width <= 0 {
			width = req.UnfoldedWidthMM
		}
		if height <= 0 {
			height = req.UnfoldedHeightMM
		}
		snapshot, cost, err := ResolvePrecutStock(context.Background(), nil, req.PaperSku, width, height)
		if err != nil {
			return CalculationResponse{}, err
		}
		if req.StockDimensionSnapshot != nil && *req.StockDimensionSnapshot != *snapshot {
			if req.StockDimensionSnapshot.Version != snapshot.Version {
				return CalculationResponse{}, &finance.OperationError{Status: 409, Code: "STOCK_DIMENSION_SNAPSHOT_STALE"}
			}
			return CalculationResponse{}, &finance.OperationError{Status: 422, Code: "STOCK_DIMENSION_SNAPSHOT_INVALID"}
		}
		req.StockDimensionSnapshot = snapshot
		req.PaperCostPerUnit = cost
		req.PaperCostIsPerSheet = true
		req.SheetsPerPack = 1
		cuts := 1
		if width > 0 && height > 0 && snapshot.WidthMM > 0 && snapshot.HeightMM > 0 {
			p1 := int(snapshot.WidthMM/width) * int(snapshot.HeightMM/height)
			p2 := int(snapshot.WidthMM/height) * int(snapshot.HeightMM/width)
			if p1 > cuts {
				cuts = p1
			}
			if p2 > cuts {
				cuts = p2
			}
		}
		if req.CutsPerSheet <= 0 {
			req.CutsPerSheet = cuts
		}
		req.JobWidth = width
		req.JobHeight = height
		req.ParentSheetWidthMM = 0
		req.ParentSheetHeightMM = 0
		req.PaperFormat = "sheet"
	}

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

	// Validate coverage values are non-negative (R2: strict rejection of negative sentinels)
	isNeg := func(p *float64) bool { return p != nil && *p < 0 }
	if isNeg(req.AvgCovC) || isNeg(req.AvgCovM) || isNeg(req.AvgCovY) || isNeg(req.AvgCovK) ||
		isNeg(req.InkCoverageKPercent) || isNeg(req.InkCoverageCMYPercent) || isNeg(req.MonoAvgCovK) ||
		req.InkCoveragePercent < 0 {
		return CalculationResponse{}, &finance.OperationError{Status: 400, Code: "INVALID_COVERAGE"}
	}
	for _, proc := range req.PrintingProcesses {
		if isNeg(proc.AverageDensity) {
			return CalculationResponse{}, &finance.OperationError{Status: 400, Code: "INVALID_COVERAGE"}
		}
		for _, ch := range proc.ColorChannels {
			if ch.DensityPct < 0 {
				return CalculationResponse{}, &finance.OperationError{Status: 400, Code: "INVALID_COVERAGE"}
			}
		}
	}
	if req.ColorPagesCount != nil && *req.ColorPagesCount < 0 {
		return CalculationResponse{}, &finance.OperationError{Status: 400, Code: "INVALID_PAGE_COUNT"}
	}
	if req.MonoPagesCount != nil && *req.MonoPagesCount < 0 {
		return CalculationResponse{}, &finance.OperationError{Status: 400, Code: "INVALID_PAGE_COUNT"}
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

	// ── Step 1: Paper Area Factor S & Imposition ───────────────────────────
	dJobW := decimal.NewFromFloat(jobW)
	dJobH := decimal.NewFromFloat(jobH)
	dA4Base := decimal.NewFromFloat(a4BaselineArea)
	dAreaFactor := dJobW.Mul(dJobH).Div(dA4Base)

	// Resolve 31x43" parent sheet or Rigid board dimensions if specified
	if req.Use31x43ParentSheet || req.PaperFormat == "31x43" || req.PaperFormat == "parent_sheet" {
		if req.ParentSheetWidthMM <= 0 || req.ParentSheetHeightMM <= 0 {
			req.ParentSheetWidthMM = ParentSheet31x43WidthMM
			req.ParentSheetHeightMM = ParentSheet31x43HeightMM
		}
	} else if req.IsRigidSubstrate || req.PaperFormat == "rigid" {
		if req.ParentSheetWidthMM <= 0 || req.ParentSheetHeightMM <= 0 {
			req.ParentSheetWidthMM = StandardRigidBoardWidthMM
			req.ParentSheetHeightMM = StandardRigidBoardHeightMM
		}
	}

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

	if (req.IsRigidSubstrate || req.PaperFormat == "rigid") && req.RigidBoardPricePerM2 > 0 {
		dPricePerM2 := decimal.NewFromFloat(req.RigidBoardPricePerM2)
		dJobAreaM2 := dJobW.Div(decimal.NewFromFloat(1000.0)).Mul(dJobH.Div(decimal.NewFromFloat(1000.0)))
		dPaperCost = dPricePerM2.Mul(dJobAreaM2).Mul(dQuantity)
	} else if req.PaperFormat == "roll" && req.PaperRollPricePerM2 > 0 {
		dPricePerM2 := decimal.NewFromFloat(req.PaperRollPricePerM2)
		dJobAreaM2 := dJobW.Div(decimal.NewFromFloat(1000.0)).Mul(dJobH.Div(decimal.NewFromFloat(1000.0)))
		dPaperCost = dPricePerM2.Mul(dJobAreaM2).Mul(dQuantity)
	} else {
		pageCount := req.PageCount
		if pageCount <= 0 {
			pageCount = 1
		}
		sheetsPerCopy := float64(pageCount)
		if req.IsDoubleSided {
			sheetsPerCopy = math.Ceil(float64(pageCount) / 2.0)
		}
		reqSheets := math.Ceil((sheetsPerCopy * float64(req.Quantity)) / float64(cutsPerSheet))
		spoilPct := req.SpoilagePercent
		if spoilPct < 0 {
			spoilPct = 0
		}
		reqSheetsDec := decimal.NewFromFloat(reqSheets)
		spoilFactorDec := decimal.NewFromFloat(1.0).Add(decimal.NewFromFloat(spoilPct))
		totalLargeSheets := reqSheetsDec.Mul(spoilFactorDec).Ceil()
		if req.ManualSheetCount > 0 {
			totalLargeSheets = decimal.NewFromInt(int64(req.ManualSheetCount))
		}

		sheetsPerPack := req.SheetsPerPack
		dCostPerPack := decimal.NewFromFloat(req.PaperCostPerUnit)
		dCostPerSheet := dCostPerPack

		// Only divide if explicitly marked as pack/ream cost AND sheetsPerPack > 1
		if !req.PaperCostIsPerSheet && req.PaperCostPerUnit > 0 {
			if sheetsPerPack <= 0 {
				sheetsPerPack = 500
			}
			if sheetsPerPack > 1 {
				dCostPerSheet = dCostPerPack.Div(decimal.NewFromInt(int64(sheetsPerPack)))
			}
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
			pageCount := req.PageCount
			if pageCount <= 0 {
				pageCount = 1
			}
			procQty := req.Quantity * pageCount
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
			} else if proc.ColorMode == "MONO_K" {
				avgDensity := 15.0
				if proc.AverageDensity != nil {
					avgDensity = *proc.AverageDensity
				}
				totalPlates += 1 // 1 plate for K
				dDensity := decimal.NewFromFloat(avgDensity)
				kCost := dCostK.Div(dIsoK).Mul(dDensity.Div(dFive)).Mul(dAreaFactor).Mul(dProcQty)
				dInkCostK = dInkCostK.Add(kCost)
				dInkCost = dInkCost.Add(kCost)
			} else {
				// Average Density mode
				avgDensity := 15.0
				if proc.AverageDensity != nil {
					avgDensity = *proc.AverageDensity
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
		// Standard single/split ink or preflight multi-page CMYK calculation
		pageCount := req.PageCount
		if pageCount <= 0 {
			pageCount = 1
		}

		var inkCovK, inkCovCMY float64
		hasPreflight := req.AvgCovC != nil || req.AvgCovM != nil || req.AvgCovY != nil || req.AvgCovK != nil
		hasSplitInk := req.InkCoverageKPercent != nil || req.InkCoverageCMYPercent != nil

		if hasPreflight {
			if req.AvgCovK != nil {
				inkCovK = *req.AvgCovK
			}
			covC, covM, covY := 0.0, 0.0, 0.0
			if req.AvgCovC != nil {
				covC = *req.AvgCovC
			}
			if req.AvgCovM != nil {
				covM = *req.AvgCovM
			}
			if req.AvgCovY != nil {
				covY = *req.AvgCovY
			}
			inkCovCMY = covC + covM + covY
		} else if hasSplitInk {
			if req.InkCoverageKPercent != nil {
				inkCovK = *req.InkCoverageKPercent
			}
			if req.InkCoverageCMYPercent != nil {
				inkCovCMY = *req.InkCoverageCMYPercent
			}
		} else if req.InkCoveragePercent > 0 {
			inkCovK = req.InkCoveragePercent
		}

		if inkCovCMY < 0 {
			inkCovCMY = 0.0
		}
		if inkCovK < 0 {
			inkCovK = 0.0
		}

		dInkCovK := decimal.NewFromFloat(inkCovK)
		dInkCovCMY := decimal.NewFromFloat(inkCovCMY)

		// Check for population split (R3: mixed color & mono pages)
		hasPageSplit := req.ColorPagesCount != nil || req.MonoPagesCount != nil
		if hasPageSplit {
			colorPages := 0
			if req.ColorPagesCount != nil {
				colorPages = *req.ColorPagesCount
			}
			monoPages := pageCount - colorPages
			if req.MonoPagesCount != nil {
				monoPages = *req.MonoPagesCount
			}
			if monoPages < 0 {
				monoPages = 0
			}
			if colorPages < 0 {
				colorPages = 0
			}

			// CMY ink: strictly color pages * quantity
			dColorImpressions := decimal.NewFromInt(int64(colorPages)).Mul(dQuantity)
			dInkCostCMY = dCostCMY.Div(dIsoCMY).Mul(dInkCovCMY.Div(dFive)).Mul(dAreaFactor).Mul(dColorImpressions)

			// K ink: color pages K + mono pages K
			monoCovK := inkCovK
			if req.MonoAvgCovK != nil {
				monoCovK = *req.MonoAvgCovK
			}
			dMonoCovK := decimal.NewFromFloat(monoCovK)
			dMonoImpressions := decimal.NewFromInt(int64(monoPages)).Mul(dQuantity)

			colorKCost := dCostK.Div(dIsoK).Mul(dInkCovK.Div(dFive)).Mul(dAreaFactor).Mul(dColorImpressions)
			monoKCost := dCostK.Div(dIsoK).Mul(dMonoCovK.Div(dFive)).Mul(dAreaFactor).Mul(dMonoImpressions)
			dInkCostK = colorKCost.Add(monoKCost)
			dInkCost = dInkCostK.Add(dInkCostCMY)
		} else {
			// Uniform document population: all pages have inkCovK and inkCovCMY
			dImpressions := decimal.NewFromInt(int64(pageCount)).Mul(dQuantity)
			dInkCostK = dCostK.Div(dIsoK).Mul(dInkCovK.Div(dFive)).Mul(dAreaFactor).Mul(dImpressions)
			dInkCostCMY = dCostCMY.Div(dIsoCMY).Mul(dInkCovCMY.Div(dFive)).Mul(dAreaFactor).Mul(dImpressions)
			dInkCost = dInkCostK.Add(dInkCostCMY)
		}

		if req.PlateCostPerUnit > 0 {
			dPlateCost = decimal.NewFromFloat(req.PlateCostPerUnit).Mul(decimal.NewFromInt(4))
		}
	}

	// ── Step 4: Printer Depreciation & Maintenance ───────────────────────────
	dDepreciationCost := decimal.Zero
	dMaintenanceCost := decimal.Zero

	pageCount := req.PageCount
	if pageCount <= 0 {
		pageCount = 1
	}
	dJobPages := dQuantity.Mul(dAreaFactor)
	if pageCount > 1 {
		dJobPages = dJobPages.Mul(decimal.NewFromInt(int64(pageCount)))
	}

	if len(req.PrintingProcesses) > 0 {
		for _, proc := range req.PrintingProcesses {
			if proc.CostPerPage > 0 {
				pages := req.Quantity * pageCount
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
	} else {
		// Resolve equipment specs from database if default_machine_id is set
		if req.DefaultMachineID != "" && (req.MachinePrice <= 0 || req.TargetTotalPages <= 0) {
			if eq, err := inventory.GetEquipmentByID(req.DefaultMachineID); err == nil {
				req.MachinePrice = eq.Price
				req.TargetTotalPages = float64(eq.ExpectedLifeA4Pages)
				if req.MaintenanceRatePercent <= 0 {
					req.MaintenanceRatePercent = eq.MaintenanceRatePercent
				}
			}
		}

		if req.MachinePrice > 0 && req.TargetTotalPages > 0 {
			deprecPerSheet, maintPerSheet, _ := CalculateMachineOverhead(req.MachinePrice, int(req.TargetTotalPages), req.MaintenanceRatePercent)
			dDeprec := decimal.NewFromFloat(deprecPerSheet)
			dMaint := decimal.NewFromFloat(maintPerSheet)
			dDepreciationCost = dDeprec.Mul(dJobPages)
			dMaintenanceCost = dMaintenanceCost.Add(dMaint.Mul(dJobPages))
		}
	}

	if req.MaintenanceCostPerPage > 0 {
		dMaintenanceCost = dMaintenanceCost.Add(decimal.NewFromFloat(req.MaintenanceCostPerPage).Mul(dJobPages))
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

	// Guillotine Cutting Fee
	dGuillotineCost := decimal.Zero
	if req.RequiresGuillotineCut || (req.CutsPerSheet > 1 && req.GuillotineFlatFeeLAK > 0) {
		fee := GuillotineFlatCuttingFeeLAK
		if req.GuillotineFlatFeeLAK > 0 {
			fee = req.GuillotineFlatFeeLAK
		}
		dGuillotineCost = decimal.NewFromFloat(fee)
	}

	// Electricity Cost calculation (StandardElectricityRateLAK = 1,700 LAK/kWh)
	dElectricityCost := decimal.Zero
	if req.MachinePowerWatts > 0 {
		runtime := req.MachineRuntimeHours
		if runtime <= 0 {
			runtime = float64(req.Quantity) / 1000.0
			if runtime < 0.1 {
				runtime = 0.1
			}
		}
		dKWh := decimal.NewFromFloat(req.MachinePowerWatts).Div(decimal.NewFromFloat(1000.0)).Mul(decimal.NewFromFloat(runtime))
		dElectricityCost = dKWh.Mul(decimal.NewFromFloat(StandardElectricityRateLAK)).Round(2)
	}

	// Packaging Cost calculation
	dPackagingCost := decimal.Zero
	if req.IncludePackaging {
		pkgUnit := req.PackagingCostPerUnit
		if pkgUnit <= 0 {
			switch strings.ToUpper(req.PackagingType) {
			case "BOX_LARGE", "LARGE_BOX":
				pkgUnit = 5000.0
			case "KRAFT_WRAP", "PAPER_WRAP":
				pkgUnit = 1000.0
			case "CORRUGATED", "HEAVY_DUTY":
				pkgUnit = 8000.0
			default:
				pkgUnit = 2500.0 // Standard box
			}
		}
		dPackagingCost = decimal.NewFromFloat(pkgUnit).Mul(dQuantity)
	}

	// ── Step 7: Totals, Overhead, Spoilage, Net Cost ───────────────────────────
	dDirectCost := dPaperCost.
		Add(dInkCost).
		Add(dPlateCost).
		Add(dDepreciationCost).
		Add(dMaintenanceCost).
		Add(dElectricityCost).
		Add(dSetupCost).
		Add(dFinishingCost).
		Add(dGuillotineCost).
		Add(dPackagingCost).
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

	// Currency rounding via Decimal (Standard 2 decimal places for all currencies)
	dSalePrice = dSalePrice.Round(2)
	dDiscountAmount = dDiscountAmount.Round(2)
	dTaxAmount = dTaxAmount.Round(2)
	dGrandTotal = dGrandTotal.Round(2)

	// Baseline Allowance & Floor Threshold Evaluation
	dEffectiveSalePrice := dGrandTotal
	dThresholdSurcharge := decimal.Zero
	isThresholdExceeded := false

	// Calculate total job coverage across printing processes, preflight, or split/legacy fields
	totalJobCoverage := 0.0
	if len(req.PrintingProcesses) > 0 {
		for _, proc := range req.PrintingProcesses {
			if len(proc.ColorChannels) > 0 {
				for _, ch := range proc.ColorChannels {
					totalJobCoverage += ch.DensityPct
				}
			} else if proc.AverageDensity != nil && *proc.AverageDensity > 0 {
				totalJobCoverage += *proc.AverageDensity
			}
		}
	} else if req.AvgCovC != nil || req.AvgCovM != nil || req.AvgCovY != nil || req.AvgCovK != nil {
		if req.AvgCovC != nil {
			totalJobCoverage += *req.AvgCovC
		}
		if req.AvgCovM != nil {
			totalJobCoverage += *req.AvgCovM
		}
		if req.AvgCovY != nil {
			totalJobCoverage += *req.AvgCovY
		}
		if req.AvgCovK != nil {
			totalJobCoverage += *req.AvgCovK
		}
	} else if req.InkCoverageKPercent != nil || req.InkCoverageCMYPercent != nil {
		if req.InkCoverageKPercent != nil {
			totalJobCoverage += *req.InkCoverageKPercent
		}
		if req.InkCoverageCMYPercent != nil {
			totalJobCoverage += *req.InkCoverageCMYPercent
		}
	} else if req.InkCoveragePercent > 0 {
		totalJobCoverage = req.InkCoveragePercent
	}

	if req.BaseFloorPrice > 0 {
		dFloorPrice := decimal.NewFromFloat(req.BaseFloorPrice)
		if req.ThresholdMode == "FLOOR_OR_ACTUAL" || req.ThresholdMode == "" {
			if req.BaselineCoveragePercent > 0 {
				if totalJobCoverage <= req.BaselineCoveragePercent {
					// Coverage is within baseline allowance -> qualifies for BaseFloorPrice
					dEffectiveSalePrice = dFloorPrice
					isThresholdExceeded = false
					dThresholdSurcharge = decimal.Zero
				} else {
					// Coverage exceeded baseline allowance -> dynamic price
					dEffectiveSalePrice = decimal.Max(dGrandTotal, dFloorPrice)
					isThresholdExceeded = true
					if dEffectiveSalePrice.GreaterThan(dFloorPrice) {
						dThresholdSurcharge = dEffectiveSalePrice.Sub(dFloorPrice).Round(2)
					} else {
						dThresholdSurcharge = decimal.Zero
					}
				}
			} else {
				if dGrandTotal.LessThanOrEqual(dFloorPrice) {
					// Actual cost + margin does not exceed base floor price: charge base floor price
					dEffectiveSalePrice = dFloorPrice
					isThresholdExceeded = false
					dThresholdSurcharge = decimal.Zero
				} else {
					// Cost exceeded baseline threshold: charge real calculated price
					dEffectiveSalePrice = dGrandTotal
					isThresholdExceeded = true
					dThresholdSurcharge = dGrandTotal.Sub(dFloorPrice).Round(2)
				}
			}
		}
	}

	depositPct := req.DepositPercent
	if depositPct < 0 {
		depositPct = 0
	}
	dDepositPct := decimal.NewFromFloat(depositPct)
	dDepositAmount := dEffectiveSalePrice.Mul(dDepositPct.Div(decimal.NewFromInt(100))).Round(2)
	dBalanceDue := dEffectiveSalePrice.Sub(dDepositAmount).Round(2)
	dUnitPrice := dEffectiveSalePrice.Div(dQuantity).Round(2)

	// Calculate Gross Profit Margin %: ((TotalAmount - TotalCost) / TotalAmount) * 100
	dGrossMarginPercent := decimal.Zero
	if dEffectiveSalePrice.GreaterThan(decimal.Zero) {
		dGrossMarginPercent = dEffectiveSalePrice.Sub(dNetInternalCost).Div(dEffectiveSalePrice).Mul(decimal.NewFromInt(100)).Round(2)
	} else if dSalePrice.GreaterThan(decimal.Zero) {
		dGrossMarginPercent = dSalePrice.Sub(dNetInternalCost).Div(dSalePrice).Mul(decimal.NewFromInt(100)).Round(2)
	}

	// Populate TotalBreakdown and UnitBreakdown
	dMachineCost := dDepreciationCost.Add(dMaintenanceCost)

	totalBreakdown := CostBreakdownItem{
		PaperCost:        roundToTwoDecimals(dPaperCost.InexactFloat64()),
		BlackInkCost:     roundToTwoDecimals(dInkCostK.InexactFloat64()),
		ColorInkCost:     roundToTwoDecimals(dInkCostCMY.InexactFloat64()),
		PlateCost:        roundToTwoDecimals(dPlateCost.InexactFloat64()),
		DepreciationCost: roundToTwoDecimals(dDepreciationCost.InexactFloat64()),
		MaintenanceCost:  roundToTwoDecimals(dMaintenanceCost.InexactFloat64()),
		MachineCost:      roundToTwoDecimals(dMachineCost.InexactFloat64()),
		ElectricityCost:  roundToTwoDecimals(dElectricityCost.InexactFloat64()),
		CuttingCost:      roundToTwoDecimals(dGuillotineCost.InexactFloat64()),
		PackagingCost:    roundToTwoDecimals(dPackagingCost.InexactFloat64()),
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
		MachineCost:      roundToTwoDecimals(dMachineCost.Div(dQuantity).InexactFloat64()),
		ElectricityCost:  roundToTwoDecimals(dElectricityCost.Div(dQuantity).InexactFloat64()),
		CuttingCost:      roundToTwoDecimals(dGuillotineCost.Div(dQuantity).InexactFloat64()),
		PackagingCost:    roundToTwoDecimals(dPackagingCost.Div(dQuantity).InexactFloat64()),
		SetupCost:        roundToTwoDecimals(dSetupCost.Div(dQuantity).InexactFloat64()),
		FinishingCost:    roundToTwoDecimals(dFinishingCost.Add(dCustomFinishingCost).Div(dQuantity).InexactFloat64()),
		LaborCost:        roundToTwoDecimals(dLaborCost.Div(dQuantity).InexactFloat64()),
		DirectSubtotal:   roundToTwoDecimals(dDirectCost.Div(dQuantity).InexactFloat64()),
		OverheadCost:     roundToTwoDecimals(dOverheadCost.Div(dQuantity).InexactFloat64()),
		TotalCost:        roundToTwoDecimals(dNetInternalCost.Div(dQuantity).InexactFloat64()),
	}

	salePriceFloat, _ := dSalePrice.Round(2).Float64()
	discountFloat, _ := dDiscountAmount.Round(2).Float64()
	taxFloat, _ := dTaxAmount.Round(2).Float64()
	grandTotalFloat, _ := dGrandTotal.Round(2).Float64()
	effectiveSalePriceFloat, _ := dEffectiveSalePrice.Round(2).Float64()
	thresholdSurchargeFloat, _ := dThresholdSurcharge.Round(2).Float64()
	netCostFloat, _ := dNetInternalCost.Round(2).Float64()
	depositAmountFloat, _ := dDepositAmount.Round(2).Float64()
	balanceDueFloat, _ := dBalanceDue.Round(2).Float64()
	unitPriceFloat, _ := dUnitPrice.Round(2).Float64()
	grossMarginPercent, _ := dGrossMarginPercent.Round(2).Float64()
	effectiveMarginFloat, _ := dEffectiveMargin.Round(4).Float64()
	volumeDiscountFloat, _ := dVolumeDiscountPct.Round(2).Float64()

	response := CalculationResponse{
		ImpositionMode: req.ImpositionMode, StockDimensionSnapshot: req.StockDimensionSnapshot,
		JobName:                 req.JobName,
		Quantity:                req.Quantity,
		AreaFactor:              roundToTwoDecimals(dAreaFactor.InexactFloat64()),
		TotalBreakdown:          totalBreakdown,
		UnitBreakdown:           unitBreakdown,
		PaperCost:               roundToTwoDecimals(dPaperCost.InexactFloat64()),
		OffcutRebateCost:        roundToTwoDecimals(dOffcutRebate.InexactFloat64()),
		InkCost:                 roundToTwoDecimals(dInkCost.InexactFloat64()),
		InkCostK:                roundToTwoDecimals(dInkCostK.InexactFloat64()),
		InkCostCMY:              roundToTwoDecimals(dInkCostCMY.InexactFloat64()),
		PlateCost:               roundToTwoDecimals(dPlateCost.InexactFloat64()),
		DepreciationCost:        roundToTwoDecimals(dDepreciationCost.InexactFloat64()),
		MaintenanceCost:         roundToTwoDecimals(dMaintenanceCost.InexactFloat64()),
		MachineCost:             roundToTwoDecimals(dMachineCost.InexactFloat64()),
		ElectricityCost:         roundToTwoDecimals(dElectricityCost.InexactFloat64()),
		GuillotineCuttingCost:   roundToTwoDecimals(dGuillotineCost.InexactFloat64()),
		PackagingCost:           roundToTwoDecimals(dPackagingCost.InexactFloat64()),
		CustomFinishingCost:     roundToTwoDecimals(dCustomFinishingCost.InexactFloat64()),
		LaminationCost:          roundToTwoDecimals(dLaminationCost.InexactFloat64()),
		BindingCost:             roundToTwoDecimals(dBindingCost.InexactFloat64()),
		LaborCost:               roundToTwoDecimals(dLaborCost.InexactFloat64()),
		SetupCost:               roundToTwoDecimals(dSetupCost.InexactFloat64()),
		FinishingCost:           roundToTwoDecimals(dFinishingCost.InexactFloat64()),
		DirectCost:              roundToTwoDecimals(dDirectCost.InexactFloat64()),
		OverheadCost:            roundToTwoDecimals(dOverheadCost.InexactFloat64()),
		Subtotal:                roundToTwoDecimals(dSubtotal.InexactFloat64()),
		SpoilageCost:            roundToTwoDecimals(dSpoilageCost.InexactFloat64()),
		NetInternalCost:         netCostFloat,
		TotalCost:               netCostFloat,
		SalePrice:               salePriceFloat,
		DiscountAmount:          discountFloat,
		TaxMode:                 taxMode,
		TaxAmount:               taxFloat,
		GrandTotal:              grandTotalFloat,
		BaseFloorPrice:          req.BaseFloorPrice,
		BaselineCoveragePercent: req.BaselineCoveragePercent,
		ThresholdMode:           req.ThresholdMode,
		IsThresholdExceeded:     isThresholdExceeded,
		ThresholdSurcharge:      thresholdSurchargeFloat,
		EffectiveSalePrice:      effectiveSalePriceFloat,
		DepositPercent:          depositPct,
		DepositAmount:           depositAmountFloat,
		BalanceDue:              balanceDueFloat,
		UnitPrice:               unitPriceFloat,
		GrossMarginPercent:      grossMarginPercent,
		ProfitMargin:            effectiveMarginFloat,
		VolumeDiscountPercent:   volumeDiscountFloat,
		Currency:                req.TargetCurrency,
		ExchangeRate:            1.0,
		CustomOptions:           req.CustomFinishingOptions,
		Imposition:              impositionGrid,
		WastePercent:            roundToTwoDecimals(calculatedWastePct),
		UsedOffcutLotID:         usedOffcutLotID,
		OffcutSavingsPercent:    offcutSavingsPercent,
		OffcutRecommended:       offcutRecommended,
		OffcutLotName:           offcutLotName,
	}

	// Cache successful calculation
	GlobalPricingCache.Set(cacheKey, response)

	return response, nil
}

// roundToTwoDecimals rounds a float64 value to 2 decimal places using Decimal precision
func roundToTwoDecimals(val float64) float64 {
	d := decimal.NewFromFloat(val).Round(2)
	res, _ := d.Float64()
	return res
}

// ValidateAndCalculateAllocations verifies page allocations sum to target job quantity
func ValidateAndCalculateAllocations(targetQty int, allocations []PrinterAllocation) (float64, error) {
	if len(allocations) == 0 {
		return 0, nil
	}
	totalAllocated := 0
	dTotalCost := decimal.Zero
	for _, alloc := range allocations {
		totalAllocated += alloc.AllocatedPages
		dTotalCost = dTotalCost.Add(decimal.NewFromFloat(alloc.SubtotalCost))
	}
	if totalAllocated != targetQty {
		return 0, fmt.Errorf("allocated pages (%d) do not match target job quantity (%d)", totalAllocated, targetQty)
	}
	res, _ := dTotalCost.Round(2).Float64()
	return res, nil
}

type StockDimensionSnapshot struct {
	MaterialID  string  `json:"material_id"`
	SKU         string  `json:"sku"`
	WidthMM     float64 `json:"width_mm"`
	HeightMM    float64 `json:"height_mm"`
	Unit        string  `json:"unit"`
	Orientation string  `json:"orientation"`
	Source      string  `json:"source"`
	SourcePath  string  `json:"source_path"`
	Version     string  `json:"version"`
}

func precutError() error {
	return &finance.OperationError{Status: 422, Code: "PRECUT_STOCK_DIMENSIONS_INCOMPATIBLE"}
}
func ResolvePrecutStock(ctx context.Context, tx *sql.Tx, key string, width, height float64) (*StockDimensionSnapshot, float64, error) {
	if key == "" || !finitePositive(width) || !finitePositive(height) {
		return nil, 0, precutError()
	}
	if tx == nil && db.DB == nil {
		return nil, 0, &finance.OperationError{Status: 503, Code: "STORAGE_UNAVAILABLE"}
	}
	query := `SELECT id,sku,category,COALESCE(is_active,false),COALESCE(technical_specs,'{}'::jsonb),updated_at,cost_per_consumption_unit::text,consumption_unit FROM materials WHERE id=$1 OR sku=$1`
	if tx != nil {
		query += " FOR SHARE"
	}
	var rows *sql.Rows
	var err error
	if tx != nil {
		rows, err = tx.QueryContext(ctx, query, key)
	} else {
		rows, err = db.DB.QueryContext(ctx, query, key)
	}
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var snapshot StockDimensionSnapshot
	var category, costText, unit string
	var active bool
	var raw []byte
	var updated time.Time
	count := 0
	for rows.Next() {
		count++
		if err = rows.Scan(&snapshot.MaterialID, &snapshot.SKU, &category, &active, &raw, &updated, &costText, &unit); err != nil {
			return nil, 0, err
		}
	}
	if err = rows.Err(); err != nil {
		return nil, 0, err
	}
	if count != 1 || !active || strings.ToLower(category) != "paper" {
		return nil, 0, precutError()
	}
	if strings.ToLower(unit) != "sheet" && strings.ToLower(unit) != "sheets" && unit != "ແຜ່ນ" {
		return nil, 0, precutError()
	}
	var specs map[string]any
	if json.Unmarshal(raw, &specs) != nil {
		return nil, 0, precutError()
	}
	type dimensionSource struct {
		values map[string]any
		prefix string
	}
	sources := []dimensionSource{{specs, ""}}
	if nested, ok := specs["specs"].(map[string]any); ok {
		sources = append(sources, dimensionSource{nested, "specs."})
	}
	dimensionKnown := false
	set := func(w, h float64, path string) error {
		if !finitePositive(w) || !finitePositive(h) {
			return precutError()
		}
		if dimensionKnown && (snapshot.WidthMM != w || snapshot.HeightMM != h) {
			return precutError()
		}
		if !dimensionKnown {
			snapshot.WidthMM = w
			snapshot.HeightMM = h
			snapshot.SourcePath = path
			dimensionKnown = true
		}
		return nil
	}
	for _, source := range sources {
		if u, has := source.values["dimension_unit"]; has && u != "mm" {
			return nil, 0, precutError()
		}
		if u, has := source.values["unit"]; has && u != "mm" {
			unitStr := strings.ToLower(fmt.Sprintf("%v", u))
			if unitStr == "cm" || unitStr == "in" || unitStr == "inch" || unitStr == "m" {
				return nil, 0, precutError()
			}
		}
		for _, pair := range [][2]string{{"width_mm", "height_mm"}, {"width", "height"}} {
			w, hasW := source.values[pair[0]]
			h, hasH := source.values[pair[1]]
			if !hasW && !hasH {
				continue
			}
			wf, okW := w.(float64)
			hf, okH := h.(float64)
			if !okW || !okH {
				return nil, 0, precutError()
			}
			if err = set(wf, hf, source.prefix+pair[0]+"/"+pair[1]); err != nil {
				return nil, 0, err
			}
		}
		if value, has := source.values["standardSize"]; has {
			preset, ok := value.(string)
			if !ok {
				return nil, 0, precutError()
			}
			dimensions, ok := map[string][2]float64{"A3": {297, 420}, "A4": {210, 297}, "A5": {148, 210}}[strings.ToUpper(preset)]
			if !ok {
				return nil, 0, precutError()
			}
			if err = set(dimensions[0], dimensions[1], source.prefix+"standardSize"); err != nil {
				return nil, 0, err
			}
		}
	}
	if !dimensionKnown {
		return nil, 0, precutError()
	}
	snapshot.Orientation = "DIRECT"
	fitsDirect := snapshot.WidthMM >= width && snapshot.HeightMM >= height
	fitsRotated := snapshot.WidthMM >= height && snapshot.HeightMM >= width
	if !fitsDirect && fitsRotated {
		snapshot.Orientation = "ROTATED"
	} else if !fitsDirect && !fitsRotated {
		snapshot.Orientation = "OVERSIZED"
	}
	snapshot.Source = "materials.technical_specs"
	snapshot.Unit = "mm"
	snapshot.Version = updated.UTC().Format(time.RFC3339Nano)
	cost, err := decimal.NewFromString(costText)
	if err != nil || cost.IsNegative() {
		return nil, 0, precutError()
	}
	return &snapshot, cost.InexactFloat64(), nil
}
func finitePositive(v float64) bool { return v > 0 && !math.IsNaN(v) && !math.IsInf(v, 0) }
