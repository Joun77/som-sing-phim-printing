package pricing

import (
	"errors"
	"math"
)

// CustomFinishingOption represents a custom post-print finishing option
type CustomFinishingOption struct {
	Name       string  `json:"name"`
	ChargeType string  `json:"charge_type"` // "FIXED_JOB" | "PER_UNIT" | "PER_SQM"
	Price      float64 `json:"price"`
}

// CalculationRequest represents the payload from the frontend spec builder
type CalculationRequest struct {
	JobName          string  `json:"job_name" binding:"required"`
	Quantity         int     `json:"quantity" binding:"required,gt=0"`
	PaperSku         string  `json:"paper_sku" binding:"required"`
	PaperCostPerUnit float64 `json:"paper_cost_per_unit"` // Cost per sheet (sheet format)
	PaperFormat      string  `json:"paper_format"`        // "sheet" | "roll"

	// Roll-fed paper pricing
	PaperRollPricePerM2 float64 `json:"paper_roll_price_per_m2"` // LAK per m² for roll paper

	// Legacy Ink spec (for backward compatibility)
	InkCoveragePercent float64 `json:"ink_coverage_percent"`
	InkCostPerMl       float64 `json:"ink_cost_per_ml"`

	// Split Ink spec (Black K vs Color CMY)
	InkCoverageKPercent   float64 `json:"ink_coverage_k_percent"`
	InkCoverageCMYPercent float64 `json:"ink_coverage_cmy_percent"`
	InkCostKPerMl         float64 `json:"ink_cost_k_per_ml"`
	InkCostCMYPerMl       float64 `json:"ink_cost_cmy_per_ml"`

	// Printer / Machine Depreciation and Maintenance
	MachinePrice           float64 `json:"machine_price"`
	TargetTotalPages       float64 `json:"target_total_pages"`
	MaintenanceCostPerPage float64 `json:"maintenance_cost_per_page"`

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

	// Overhead & Markup
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

// CalculationResponse details the cost breakdown and sale prices
type CalculationResponse struct {
	JobName  string `json:"job_name"`
	Quantity int    `json:"quantity"`

	// Area Factor S = jobW×jobH / (210×297)
	AreaFactor float64 `json:"area_factor"`

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

	// Aggregates
	DirectCost      float64 `json:"direct_cost"`
	OverheadCost    float64 `json:"overhead_cost"`
	Subtotal        float64 `json:"subtotal"`          // DirectCost + OverheadCost
	SpoilageCost    float64 `json:"spoilage_cost"`     // Subtotal × SpoilagePercent
	NetInternalCost float64 `json:"net_internal_cost"` // Subtotal × (1 + SpoilagePercent)

	// Selling price pipeline
	SalePrice      float64 `json:"sale_price"`      // NetInternalCost / (1 − Margin)
	DiscountAmount float64 `json:"discount_amount"` // SalePrice × DiscountPercent
	TaxAmount      float64 `json:"tax_amount"`      // (SalePrice − Discount) × TaxPercent
	GrandTotal     float64 `json:"grand_total"`     // (SalePrice − Discount) × (1 + Tax%)
	UnitPrice      float64 `json:"unit_price"`      // GrandTotal / Quantity

	// Meta
	ProfitMargin  float64                 `json:"profit_margin"`
	Currency      string                  `json:"currency"`
	ExchangeRate  float64                 `json:"exchange_rate"`
	CustomOptions []CustomFinishingOption `json:"custom_options"`
}

// a4BaselineArea is the reference area (mm²) used for Paper Area Factor S
const a4BaselineArea = 210.0 * 297.0

// CalculateJobPricing performs the backend pricing engine math
func CalculateJobPricing(req CalculationRequest) (CalculationResponse, error) {
	if req.Quantity <= 0 {
		return CalculationResponse{}, errors.New("quantity must be greater than zero")
	}

	// ── Defaults ──────────────────────────────────────────────────────────────

	overheadPercent := req.OverheadPercent
	if overheadPercent <= 0 {
		overheadPercent = 0.15 // Default 15% overhead
	}

	// Handle target margin fallback to legacy markup margin
	targetMargin := req.TargetMarginPercent
	if targetMargin <= 0 && req.MarkupMargin > 0 {
		targetMargin = req.MarkupMargin
	}
	// Margin Protection Guard: prevent division by zero or negative pricing
	if targetMargin >= 100.0 {
		targetMargin = targetMargin / 100.0
	}
	if targetMargin >= 0.99 {
		targetMargin = 0.99
	}
	if targetMargin < 0 {
		targetMargin = 0.0
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

	// ── 0. Paper Area Factor S ─────────────────────────────────────────────────
	// S = 1.0 for A4 (baseline). A3 → S=2.0, A5 → S=0.5, A6 → S=0.25
	areaFactor := (jobW * jobH) / a4BaselineArea

	// ── 1. Paper Cost ─────────────────────────────────────────────────────────
	var paperCost float64
	if req.PaperFormat == "roll" && req.PaperRollPricePerM2 > 0 {
		// Roll-fed: price = pricePerM2 × jobArea(m²) × quantity
		jobAreaM2 := (jobW / 1000.0) * (jobH / 1000.0)
		paperCost = req.PaperRollPricePerM2 * jobAreaM2 * float64(req.Quantity)
	} else {
		// Sheet-fed: flat cost per sheet × quantity
		paperCost = float64(req.Quantity) * req.PaperCostPerUnit
	}

	// ── 2. Ink Cost (ISO 5% = 0.007 ml/A4 page, scaled by Area Factor S) ──────
	inkCovK := req.InkCoverageKPercent
	inkCovCMY := req.InkCoverageCMYPercent
	if inkCovK == 0 && inkCovCMY == 0 && req.InkCoveragePercent > 0 {
		inkCovK = req.InkCoveragePercent
	}
	if inkCovCMY < 0 {
		inkCovCMY = 0.0
	}

	costK := req.InkCostKPerMl
	if costK == 0 {
		costK = req.InkCostPerMl
	}
	if costK == 0 {
		costK = 500.0
	}

	costCMY := req.InkCostCMYPerMl
	if costCMY == 0 {
		costCMY = req.InkCostPerMl
	}
	if costCMY == 0 {
		costCMY = 500.0
	}

	// 0.007 ml per 1% coverage at A4 baseline, scaled by S for other sizes
	inkVolumeKPerPage := 0.007 * inkCovK * areaFactor
	inkVolumeCMYPerPage := 0.007 * inkCovCMY * areaFactor

	totalInkVolumeKMl := float64(req.Quantity) * inkVolumeKPerPage
	totalInkVolumeCMYMl := float64(req.Quantity) * inkVolumeCMYPerPage

	inkCostK := totalInkVolumeKMl * costK
	inkCostCMY := totalInkVolumeCMYMl * costCMY
	inkCost := inkCostK + inkCostCMY

	// ── 3. Machine Depreciation & Maintenance (scaled by Area Factor S) ────────
	// Per-impression cost at A4 is (MachinePrice / LifetimePagesAtA4).
	// For larger paper, each impression costs proportionally more: × S
	depreciationCost := 0.0
	if req.TargetTotalPages > 0 {
		depreciationCost = (req.MachinePrice / req.TargetTotalPages) * areaFactor * float64(req.Quantity)
	}
	maintenanceCost := req.MaintenanceCostPerPage * areaFactor * float64(req.Quantity)

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

	// ── 6. Labor Cost ─────────────────────────────────────────────────────────
	laborCost := req.LaborCostPerHour * req.EstimatedHours

	// ── 7. Direct Cost → Overhead → Subtotal ──────────────────────────────────
	directCost := paperCost + inkCost + depreciationCost + maintenanceCost +
		customFinishingCost + laminationCost + bindingCost + laborCost
	overheadCost := directCost * overheadPercent
	subtotal := directCost + overheadCost

	// ── 8. Spoilage ────────────────────────────────────────────────────────────
	// Net Internal Cost = Subtotal × (1 + SpoilagePercent)
	spoilagePercent := req.SpoilagePercent
	if spoilagePercent < 0 {
		spoilagePercent = 0
	}
	spoilageCost := subtotal * spoilagePercent
	netInternalCost := subtotal + spoilageCost

	// ── 9. Selling Price via Profit Margin: SP = NetCost / (1 − Margin) ───────
	salePrice := netInternalCost / (1.0 - targetMargin)

	// ── 10. Discount & Tax → Grand Total ──────────────────────────────────────
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

	// ── 11. Multi-currency conversion ─────────────────────────────────────────
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

	// ── 12. Round to 2 decimal places ─────────────────────────────────────────
	r := roundToTwoDecimals
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

	return CalculationResponse{
		JobName:             req.JobName,
		Quantity:            req.Quantity,
		AreaFactor:          r(areaFactor),
		PaperCost:           paperCost,
		InkCost:             inkCost,
		InkCostK:            inkCostK,
		InkCostCMY:          inkCostCMY,
		DepreciationCost:    depreciationCost,
		MaintenanceCost:     maintenanceCost,
		CustomFinishingCost: customFinishingCost,
		LaminationCost:      laminationCost,
		BindingCost:         bindingCost,
		LaborCost:           laborCost,
		DirectCost:          directCost,
		OverheadCost:        overheadCost,
		Subtotal:            subtotal,
		SpoilageCost:        spoilageCost,
		NetInternalCost:     netInternalCost,
		SalePrice:           salePrice,
		DiscountAmount:      discountAmount,
		TaxAmount:           taxAmount,
		GrandTotal:          grandTotal,
		UnitPrice:           unitPrice,
		ProfitMargin:        targetMargin,
		Currency:            currency,
		ExchangeRate:        rate,
		CustomOptions:       req.CustomFinishingOptions,
	}, nil
}

func roundToTwoDecimals(val float64) float64 {
	return math.Round(val*100) / 100
}
