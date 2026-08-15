package pricing

import (
	"errors"
	"fmt"
	"math"
)

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
	PaperSku         string              `json:"paper_sku" binding:"required"`
	PaperCostPerUnit float64             `json:"paper_cost_per_unit"` // Cost per ream/pack or unit
	PaperFormat      string              `json:"paper_format"`        // "sheet" | "roll"
	SheetsPerPack    int                 `json:"sheets_per_pack"`     // Sheets per pack/ream (default 500)
	CutsPerSheet     int                 `json:"cuts_per_sheet"`      // Number of brochure/job pieces cut per large sheet (default 1)
	Allocations      []PrinterAllocation `json:"allocations"`


	// Setup & Finishing Costs
	SetupCost        float64 `json:"setup_cost"`         // Fixed setup cost
	SetupCostMode    string  `json:"setup_cost_mode"`    // "fixed" | "percent"
	SetupCostPercent float64 `json:"setup_cost_percent"` // Setup cost % if mode is percent
	FinishingCost    float64 `json:"finishing_cost"`     // Variable finishing cost per unit
	BaseProfitPct    float64 `json:"base_profit_pct"`    // Base profit percentage

	// Roll-fed paper pricing
	PaperRollPricePerM2 float64 `json:"paper_roll_price_per_m2"` // LAK per m² for roll paper

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

	// Job dimensions for Area Factor calculation
	JobWidth  float64 `json:"job_width"`  // in mm
	JobHeight float64 `json:"job_height"` // in mm

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

	// Discount & Tax applied to selling price
	DiscountPercent float64 `json:"discount_percent"` // e.g. 0.10 for 10%
	TaxPercent      float64 `json:"tax_percent"`       // e.g. 0.07 for 7%

	TargetCurrency string `json:"target_currency"`
}

// CostBreakdownItem represents normalized cost components per unit or per total job
type CostBreakdownItem struct {
	PaperCost        float64 `json:"paper_cost"`
	BlackInkCost     float64 `json:"black_ink_cost"`
	ColorInkCost     float64 `json:"color_ink_cost"`
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
	InkCost             float64 `json:"ink_cost"` // Total combined ink cost
	InkCostK            float64 `json:"ink_cost_k"`
	InkCostCMY          float64 `json:"ink_cost_cmy"`
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
	TotalCost       float64 `json:"total_cost"`        // Total internal cost (alias)

	// Selling price pipeline
	SalePrice      float64 `json:"sale_price"`      // NetInternalCost / (1 − Margin)
	DiscountAmount float64 `json:"discount_amount"` // SalePrice × DiscountPercent
	TaxAmount      float64 `json:"tax_amount"`      // (SalePrice − Discount) × TaxPercent
	GrandTotal     float64 `json:"grand_total"`     // (SalePrice − Discount) × (1 + Tax%)
	UnitPrice      float64 `json:"unit_price"`      // GrandTotal / Quantity

	// Meta
	ProfitMargin          float64                 `json:"profit_margin"`
	VolumeDiscountPercent float64                 `json:"volume_discount_percent"`
	Currency              string                  `json:"currency"`
	ExchangeRate          float64                 `json:"exchange_rate"`
	CustomOptions         []CustomFinishingOption `json:"custom_options"`
}

// a4BaselineArea is the reference area (mm²) used for Paper Area Factor S (210 x 297 mm = 62370)
const a4BaselineArea = 62370.0

// CalculateJobPricing performs the backend pricing engine math according to Spec Section 4
func CalculateJobPricing(req CalculationRequest) (CalculationResponse, error) {
	if req.Quantity <= 0 {
		return CalculationResponse{}, errors.New("quantity must be greater than zero")
	}

	// ── Defaults ──────────────────────────────────────────────────────────────

	overheadPercent := req.OverheadPercent
	if overheadPercent <= 0 {
		overheadPercent = 0.15 // Default 15% overhead
	}

	// Handle profit margin & fallback
	baseMargin := 0.0
	if req.BaseProfitPct > 0 {
		baseMargin = req.BaseProfitPct
		if baseMargin > 1.0 {
			baseMargin = baseMargin / 100.0
		}
	} else if req.TargetMarginPercent > 0 {
		baseMargin = req.TargetMarginPercent
		if baseMargin >= 100.0 {
			baseMargin = baseMargin / 100.0
		}
	} else if req.MarkupMargin > 0 {
		baseMargin = req.MarkupMargin
		if baseMargin >= 100.0 {
			baseMargin = baseMargin / 100.0
		}
	}

	// Volume Discount Logic on Margin:
	// Quantity >= 1000 -> 20% discount on margin
	// Quantity >= 500  -> 10% discount on margin
	volumeDiscountPct := 0.0
	if req.Quantity >= 1000 {
		volumeDiscountPct = 20.0
	} else if req.Quantity >= 500 {
		volumeDiscountPct = 10.0
	}

	effectiveMargin := baseMargin * (1.0 - volumeDiscountPct/100.0)

	// Margin Protection Guard: prevent division by zero or negative pricing
	if effectiveMargin >= 0.99 {
		effectiveMargin = 0.99
	}
	if effectiveMargin < 0 {
		effectiveMargin = 0.0
	}

	// Job dimensions with A4 defaults
	jobW := req.JobWidth
	if jobW <= 0 {
		jobW = 210.0
	}
	jobH := req.JobHeight
	if jobH <= 0 {
		jobH = 297.0
	}

	// ── Step 1: Paper Area Factor S (S = JobArea / 62,370 mm²) ─────────────────
	areaFactor := (jobW * jobH) / a4BaselineArea

	cutsPerSheet := req.CutsPerSheet
	if cutsPerSheet <= 0 {
		cutsPerSheet = 1
	}

	// ── Step 4: Paper Cost ────────────────────────────────────────────────────
	var paperCost float64
	if req.PaperFormat == "roll" && req.PaperRollPricePerM2 > 0 {
		// Roll-fed: price = pricePerM2 × jobArea(m²) × quantity
		jobAreaM2 := (jobW / 1000.0) * (jobH / 1000.0)
		paperCost = req.PaperRollPricePerM2 * jobAreaM2 * float64(req.Quantity)
	} else {
		// Sheet-fed paper cut calculation:
		// Required large sheets = ceil(Quantity / CutsPerSheet)
		// Total large sheets including spoilage = ceil(Required large sheets * (1 + SpoilagePercent))
		reqSheets := math.Ceil(float64(req.Quantity) / float64(cutsPerSheet))
		spoilPct := req.SpoilagePercent
		if spoilPct < 0 {
			spoilPct = 0
		}
		totalLargeSheets := math.Ceil(reqSheets * (1.0 + spoilPct))

		sheetsPerPack := req.SheetsPerPack
		if sheetsPerPack <= 0 {
			sheetsPerPack = 500
		}

		costPerLargeSheet := req.PaperCostPerUnit
		if req.PaperCostPerUnit > 0 && sheetsPerPack > 1 {
			costPerLargeSheet = req.PaperCostPerUnit / float64(sheetsPerPack)
		}
		paperCost = totalLargeSheets * costPerLargeSheet
	}

	// ── Step 2: Ink Cost (Section 4 ISO Yield Formula) ────────────────────────
	// InkCost_Color = (Price_Color / ISOYield_Color) * (%Cov_Color / 5%) * Factor S * Quantity
	inkCovK := req.InkCoverageKPercent
	inkCovCMY := req.InkCoverageCMYPercent
	if inkCovK == 0 && inkCovCMY == 0 && req.InkCoveragePercent > 0 {
		inkCovK = req.InkCoveragePercent
	}
	if inkCovCMY < 0 {
		inkCovCMY = 0.0
	}

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

	inkCostK := (costK / isoK) * (inkCovK / 5.0) * areaFactor * float64(req.Quantity)
	inkCostCMY := (costCMY / isoCMY) * (inkCovCMY / 5.0) * areaFactor * float64(req.Quantity)
	inkCost := inkCostK + inkCostCMY

	// ── Step 3: Machine Depreciation & Maintenance (Section 4) ────────────────
	// Machine Cost = (Price Cost * (1 + Maintenance Rate / 100) / Expected Life Pages) * Factor S * Quantity
	maintRate := req.MaintenanceRatePercent
	if maintRate <= 0 {
		maintRate = 20.0 // Default 20% maintenance rate
	}
	lifePages := req.TargetTotalPages
	if lifePages <= 0 {
		lifePages = 500000.0
	}

	machinePrice := req.MachinePrice
	if machinePrice <= 0 {
		machinePrice = 50000000.0 // Default printer price LAK
	}

	depreciationCost := (machinePrice * (1.0 + maintRate/100.0) / lifePages) * areaFactor * float64(req.Quantity)
	maintenanceCost := req.MaintenanceCostPerPage * areaFactor * float64(req.Quantity)

	if len(req.Allocations) > 0 {
		allocMachineCost, allocErr := ValidateAndCalculateAllocations(req.Quantity, req.Allocations)
		if allocErr != nil {
			return CalculationResponse{}, allocErr
		}
		depreciationCost = allocMachineCost
	}


	// ── 4. Custom Finishing options ────────────────────────────────────────────
	customFinishingCost := 0.0
	totalSqMeters := (jobW / 1000.0) * (jobH / 1000.0) * float64(req.Quantity)
	for _, opt := range req.CustomFinishingOptions {
		switch opt.ChargeType {
		case "FIXED_JOB":
			customFinishingCost += opt.Price
		case "PER_UNIT":
			customFinishingCost += opt.Price * float64(req.Quantity)
		case "PER_SQM":
			customFinishingCost += opt.Price * totalSqMeters
		}
	}

	// ── 5. Standard Lamination & Binding ──────────────────────────────────────
	laminationCost := 0.0
	if req.LaminationType != "none" && req.LaminationType != "" {
		laminationCost = float64(req.Quantity) * req.LaminationCost
	}
	bindingCost := 0.0
	if req.BindingType != "none" && req.BindingType != "" {
		bindingCost = float64(req.Quantity) * req.BindingCost
	}

	directMatMachineCost := paperCost + inkCost + depreciationCost + maintenanceCost + customFinishingCost + laminationCost + bindingCost

	// ── 6. Setup Cost ──────────────────────────────────────────────────────────
	setupCost := req.SetupCost
	if req.SetupCostMode == "percent" {
		pct := req.SetupCostPercent
		if pct <= 0 {
			pct = 2.0 // default 2%
		}
		setupCost = directMatMachineCost * (pct / 100.0)
	}
	finishingCost := req.FinishingCost * float64(req.Quantity)

	// ── 7. Labor Cost (Manual / Percent / Tiered) ──────────────────────────────
	laborCost := 0.0
	switch req.LaborMode {
	case "manual":
		laborCost = req.LaborCostManual
	case "percent":
		pct := req.LaborPercent
		if pct <= 0 {
			pct = 10.0
		}
		laborCost = directMatMachineCost * (pct / 100.0)
	case "tiered":
		pct := 15.0
		if directMatMachineCost >= 5000000.0 {
			pct = 7.0
		} else if directMatMachineCost >= 1000000.0 {
			pct = 10.0
		}
		laborCost = directMatMachineCost * (pct / 100.0)
	default:
		if req.LaborCostManual > 0 {
			laborCost = req.LaborCostManual
		} else if req.LaborPercent > 0 {
			laborCost = directMatMachineCost * (req.LaborPercent / 100.0)
		} else if req.LaborCostPerHour > 0 && req.EstimatedHours > 0 {
			laborCost = req.LaborCostPerHour * req.EstimatedHours
		} else {
			pct := 15.0
			if directMatMachineCost >= 5000000.0 {
				pct = 7.0
			} else if directMatMachineCost >= 1000000.0 {
				pct = 10.0
			}
			laborCost = directMatMachineCost * (pct / 100.0)
		}
	}

	// ── 8. Direct Cost → Overhead → Subtotal ──────────────────────────────────
	directCost := paperCost + inkCost + depreciationCost + maintenanceCost +
		customFinishingCost + laminationCost + bindingCost + laborCost + setupCost + finishingCost
	overheadCost := directCost * overheadPercent
	subtotal := directCost + overheadCost

	// ── 9. Spoilage ────────────────────────────────────────────────────────────
	// Net Internal Cost = Subtotal × (1 + SpoilagePercent)
	spoilagePercent := req.SpoilagePercent
	if spoilagePercent < 0 {
		spoilagePercent = 0
	}
	spoilageCost := subtotal * spoilagePercent
	netInternalCost := subtotal + spoilageCost

	// ── 10. Selling Price via Profit Margin: SP = NetCost / (1 − EffectiveMargin) ───────
	salePrice := netInternalCost / (1.0 - effectiveMargin)

	// ── 11. Discount & Tax → Grand Total ──────────────────────────────────────
	discountPercent := req.DiscountPercent
	if discountPercent < 0 {
		discountPercent = 0
	}
	discountAmount := salePrice * discountPercent
	discountedPrice := salePrice - discountAmount

	taxPercent := req.TaxPercent
	if taxPercent < 0 {
		taxPercent = 0
	}
	taxAmount := discountedPrice * taxPercent
	grandTotal := discountedPrice + taxAmount

	// ── 12. Multi-currency conversion ─────────────────────────────────────────
	currency := req.TargetCurrency
	if currency == "" {
		currency = "LAK"
	}
	rate := GetExchangeRateSnapshot(currency)

	if currency != "LAK" && rate > 0 {
		paperCost /= rate
		inkCost /= rate
		inkCostK /= rate
		inkCostCMY /= rate
		depreciationCost /= rate
		maintenanceCost /= rate
		customFinishingCost /= rate
		laminationCost /= rate
		bindingCost /= rate
		laborCost /= rate
		setupCost /= rate
		finishingCost /= rate
		directCost /= rate
		overheadCost /= rate
		subtotal /= rate
		spoilageCost /= rate
		netInternalCost /= rate
		salePrice /= rate
		discountAmount /= rate
		taxAmount /= rate
		grandTotal /= rate
	}

	// ── 13. Rounding according to Currency (Integer for LAK, 2 decimals for THB/USD) ───
	r := func(val float64) float64 {
		if currency == "LAK" || currency == "" {
			return math.Round(val)
		}
		return math.Round(val*100) / 100
	}
	paperCost = r(paperCost)
	inkCost = r(inkCost)
	inkCostK = r(inkCostK)
	inkCostCMY = r(inkCostCMY)
	depreciationCost = r(depreciationCost)
	maintenanceCost = r(maintenanceCost)
	customFinishingCost = r(customFinishingCost)
	laminationCost = r(laminationCost)
	bindingCost = r(bindingCost)
	laborCost = r(laborCost)
	setupCost = r(setupCost)
	finishingCost = r(finishingCost)
	directCost = r(directCost)
	overheadCost = r(overheadCost)
	subtotal = r(subtotal)
	spoilageCost = r(spoilageCost)
	netInternalCost = r(netInternalCost)
	salePrice = r(salePrice)
	discountAmount = r(discountAmount)
	taxAmount = r(taxAmount)
	grandTotal = r(grandTotal)
	unitPrice := r(grandTotal / float64(req.Quantity))

	totalFinishing := r(customFinishingCost + laminationCost + bindingCost + finishingCost)

	totalBreakdown := CostBreakdownItem{
		PaperCost:        paperCost,
		BlackInkCost:     inkCostK,
		ColorInkCost:     inkCostCMY,
		DepreciationCost: depreciationCost,
		MaintenanceCost:  maintenanceCost,
		SetupCost:        setupCost,
		FinishingCost:    totalFinishing,
		LaborCost:        laborCost,
		DirectSubtotal:   directCost,
		OverheadCost:     overheadCost,
		TotalCost:        netInternalCost,
	}

	q := float64(req.Quantity)
	unitBreakdown := CostBreakdownItem{
		PaperCost:        r(paperCost / q),
		BlackInkCost:     r(inkCostK / q),
		ColorInkCost:     r(inkCostCMY / q),
		DepreciationCost: r(depreciationCost / q),
		MaintenanceCost:  r(maintenanceCost / q),
		SetupCost:        r(setupCost / q),
		FinishingCost:    r(totalFinishing / q),
		LaborCost:        r(laborCost / q),
		DirectSubtotal:   r(directCost / q),
		OverheadCost:     r(overheadCost / q),
		TotalCost:        r(netInternalCost / q),
	}

	return CalculationResponse{
		JobName:               req.JobName,
		Quantity:              req.Quantity,
		AreaFactor:            r(areaFactor),
		TotalBreakdown:        totalBreakdown,
		UnitBreakdown:         unitBreakdown,
		PaperCost:             paperCost,
		InkCost:               inkCost,
		InkCostK:              inkCostK,
		InkCostCMY:            inkCostCMY,
		DepreciationCost:      depreciationCost,
		MaintenanceCost:       maintenanceCost,
		CustomFinishingCost:   customFinishingCost,
		LaminationCost:        laminationCost,
		BindingCost:           bindingCost,
		LaborCost:             laborCost,
		SetupCost:             setupCost,
		FinishingCost:         finishingCost,
		DirectCost:            directCost,
		OverheadCost:          overheadCost,
		Subtotal:              subtotal,
		SpoilageCost:          spoilageCost,
		NetInternalCost:       netInternalCost,
		TotalCost:             netInternalCost,
		SalePrice:             salePrice,
		DiscountAmount:        discountAmount,
		TaxAmount:             taxAmount,
		GrandTotal:            grandTotal,
		UnitPrice:             unitPrice,
		ProfitMargin:          effectiveMargin,
		VolumeDiscountPercent: volumeDiscountPct,
		Currency:              currency,
		ExchangeRate:          rate,
		CustomOptions:         req.CustomFinishingOptions,
	}, nil
}

func roundToTwoDecimals(val float64) float64 {
	return math.Round(val*100) / 100
}

func ValidateAndCalculateAllocations(targetQty int, allocations []PrinterAllocation) (float64, error) {
	totalAllocated := 0
	var totalMachineCost float64

	for _, alloc := range allocations {
		totalAllocated += alloc.AllocatedPages
		cost := float64(alloc.AllocatedPages) * alloc.CostPerPage
		if alloc.SubtotalCost > 0 {
			cost = alloc.SubtotalCost
		}
		totalMachineCost += cost
	}

	if totalAllocated != targetQty {
		return 0, fmt.Errorf("allocated pages (%d) must equal target quantity (%d)", totalAllocated, targetQty)
	}

	return totalMachineCost, nil
}

