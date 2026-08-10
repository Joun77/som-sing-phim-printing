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
	PaperCostPerUnit float64 `json:"paper_cost_per_unit" binding:"required"` // Cost per sheet or per meter
	PaperFormat      string  `json:"paper_format" binding:"required"`        // "sheet" | "roll"

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

	// Job dimensions for square meter calculation
	JobWidth  float64 `json:"job_width"`  // in mm
	JobHeight float64 `json:"job_height"` // in mm

	// Custom finishing options list
	CustomFinishingOptions []CustomFinishingOption `json:"custom_finishing_options"`

	// Finishing services
	LaminationType string  `json:"lamination_type"` // "thermal" | "cold" | "none"
	LaminationCost float64 `json:"lamination_cost"` // Cost per sheet or meter
	BindingType    string  `json:"binding_type"`    // "wire-o" | "plastic-comb" | "glue" | "none"
	BindingCost    float64 `json:"binding_cost"`    // Cost per book/unit

	// Overhead & Markup
	LaborCostPerHour    float64 `json:"labor_cost_per_hour"`
	EstimatedHours      float64 `json:"estimated_hours"`
	MarkupMargin        float64 `json:"markup_margin"` // Legacy markup
	OverheadPercent     float64 `json:"overhead_percent"`
	TargetMarginPercent float64 `json:"target_margin_percent"`
	TargetCurrency      string  `json:"target_currency"`
}

// CalculationResponse details the cost breakdown and sale prices
type CalculationResponse struct {
	JobName             string                  `json:"job_name"`
	Quantity            int                     `json:"quantity"`
	PaperCost           float64                 `json:"paper_cost"`
	InkCost             float64                 `json:"ink_cost"` // Total combined ink cost
	InkCostK            float64                 `json:"ink_cost_k"`
	InkCostCMY          float64                 `json:"ink_cost_cmy"`
	DepreciationCost    float64                 `json:"depreciation_cost"`
	MaintenanceCost     float64                 `json:"maintenance_cost"`
	CustomFinishingCost float64                 `json:"custom_finishing_cost"`
	LaminationCost      float64                 `json:"lamination_cost"`
	BindingCost         float64                 `json:"binding_cost"`
	LaborCost           float64                 `json:"labor_cost"`
	DirectCost          float64                 `json:"direct_cost"`
	OverheadCost        float64                 `json:"overhead_cost"`
	TotalCost           float64                 `json:"total_cost"`
	SalePrice           float64                 `json:"sale_price"`
	UnitPrice           float64                 `json:"unit_price"`
	ProfitMargin        float64                 `json:"profit_margin"`
	Currency            string                  `json:"currency"`
	ExchangeRate        float64                 `json:"exchange_rate"`
	CustomOptions       []CustomFinishingOption `json:"custom_options"`
}

// CalculateJobPricing performs the backend pricing engine math
func CalculateJobPricing(req CalculationRequest) (CalculationResponse, error) {
	if req.Quantity <= 0 {
		return CalculationResponse{}, errors.New("quantity must be greater than zero")
	}

	// Fallback/Default values for missing inputs
	if req.OverheadPercent <= 0 {
		req.OverheadPercent = 0.15 // Default 15% overhead
	}

	// Handle target margin fallback to legacy markup margin
	targetMargin := req.TargetMarginPercent
	if targetMargin <= 0 && req.MarkupMargin > 0 {
		targetMargin = req.MarkupMargin
	}

	// Margin Protection Guard: Ensure margin doesn't cause division by zero or negative pricing
	if targetMargin >= 100.0 {
		targetMargin = targetMargin / 100.0
	}
	if targetMargin >= 0.99 {
		targetMargin = 0.99
	}
	if targetMargin < 0 {
		targetMargin = 0.0
	}

	// 1. Paper Cost calculation
	paperCost := float64(req.Quantity) * req.PaperCostPerUnit

	// 2. Ink Cost calculation with Black (K) and Color (CMY) split
	// Legacy fallback if split fields are empty
	inkCovK := req.InkCoverageKPercent
	inkCovCMY := req.InkCoverageCMYPercent
	if inkCovK == 0 && inkCovCMY == 0 && req.InkCoveragePercent > 0 {
		inkCovK = req.InkCoveragePercent
	}
	// Fallback to defaults if color coverage is not specified
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

	// ISO 5% coverage standards: 0.035 ml per A4 page
	inkVolumeKPerPage := 0.007 * inkCovK
	inkVolumeCMYPerPage := 0.007 * inkCovCMY

	totalInkVolumeKMl := float64(req.Quantity) * inkVolumeKPerPage
	totalInkVolumeCMYMl := float64(req.Quantity) * inkVolumeCMYPerPage

	inkCostK := totalInkVolumeKMl * costK
	inkCostCMY := totalInkVolumeCMYMl * costCMY
	inkCost := inkCostK + inkCostCMY

	// 3. Printer / Machine Depreciation and Maintenance
	depreciationCost := 0.0
	if req.TargetTotalPages > 0 {
		depreciationCost = (req.MachinePrice / req.TargetTotalPages) * float64(req.Quantity)
	}
	maintenanceCost := req.MaintenanceCostPerPage * float64(req.Quantity)

	// 4. Custom Finishing options
	customFinishingCost := 0.0
	jobW := req.JobWidth
	if jobW <= 0 {
		jobW = 210.0 // Default A4 width
	}
	jobH := req.JobHeight
	if jobH <= 0 {
		jobH = 297.0 // Default A4 height
	}
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

	// 5. Standard Lamination Cost
	laminationCost := 0.0
	if req.LaminationType != "none" && req.LaminationType != "" {
		laminationCost = float64(req.Quantity) * req.LaminationCost
	}

	// 6. Standard Binding Cost
	bindingCost := 0.0
	if req.BindingType != "none" && req.BindingType != "" {
		bindingCost = float64(req.Quantity) * req.BindingCost
	}

	// 7. Labor Cost
	laborCost := req.LaborCostPerHour * req.EstimatedHours

	// 8. Direct Cost sum
	directCost := paperCost + inkCost + depreciationCost + maintenanceCost + customFinishingCost + laminationCost + bindingCost + laborCost

	// 9. Overhead Cost calculation
	overheadCost := directCost * req.OverheadPercent

	// 10. Total cost = Direct Cost + Overhead
	totalCost := directCost + overheadCost

	// 11. Selling Price via Profit Margin formula: SP = TotalCost / (1 - Margin)
	salePrice := totalCost / (1.0 - targetMargin)

	// 12. Multi-currency conversion
	currency := req.TargetCurrency
	if currency == "" {
		currency = "LAK"
	}
	rate := GetExchangeRateSnapshot(currency)

	if currency != "LAK" && rate > 0 {
		paperCost = paperCost / rate
		inkCost = inkCost / rate
		inkCostK = inkCostK / rate
		inkCostCMY = inkCostCMY / rate
		depreciationCost = depreciationCost / rate
		maintenanceCost = maintenanceCost / rate
		customFinishingCost = customFinishingCost / rate
		laminationCost = laminationCost / rate
		bindingCost = bindingCost / rate
		laborCost = laborCost / rate
		directCost = directCost / rate
		overheadCost = overheadCost / rate
		totalCost = totalCost / rate
		salePrice = salePrice / rate
	}

	// Round calculations to 2 decimal places
	paperCost = roundToTwoDecimals(paperCost)
	inkCost = roundToTwoDecimals(inkCost)
	inkCostK = roundToTwoDecimals(inkCostK)
	inkCostCMY = roundToTwoDecimals(inkCostCMY)
	depreciationCost = roundToTwoDecimals(depreciationCost)
	maintenanceCost = roundToTwoDecimals(maintenanceCost)
	customFinishingCost = roundToTwoDecimals(customFinishingCost)
	laminationCost = roundToTwoDecimals(laminationCost)
	bindingCost = roundToTwoDecimals(bindingCost)
	laborCost = roundToTwoDecimals(laborCost)
	directCost = roundToTwoDecimals(directCost)
	overheadCost = roundToTwoDecimals(overheadCost)
	totalCost = roundToTwoDecimals(totalCost)
	salePrice = roundToTwoDecimals(salePrice)

	unitPrice := roundToTwoDecimals(salePrice / float64(req.Quantity))

	return CalculationResponse{
		JobName:             req.JobName,
		Quantity:            req.Quantity,
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
		TotalCost:           totalCost,
		SalePrice:           salePrice,
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
