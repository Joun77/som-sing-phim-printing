package pricing

import (
	"errors"
	"math"
)

// CalculationRequest represents the payload from the frontend spec builder
type CalculationRequest struct {
	JobName        string  `json:"job_name" binding:"required"`
	Quantity       int     `json:"quantity" binding:"required,gt=0"`
	PaperSku       string  `json:"paper_sku" binding:"required"`
	PaperCostPerUnit float64 `json:"paper_cost_per_unit" binding:"required"` // Cost per sheet or per meter
	PaperFormat    string  `json:"paper_format" binding:"required"`        // "sheet" | "roll"
	
	// Ink calculation spec
	InkCoveragePercent float64 `json:"ink_coverage_percent"` // e.g. 5%, 30%, 80%
	InkCostPerMl       float64 `json:"ink_cost_per_ml"`       // Cost of ink per ml

	// Finishing services
	LaminationType   string  `json:"lamination_type"`    // "thermal" | "cold" | "none"
	LaminationCost    float64 `json:"lamination_cost"`    // Cost per sheet or meter
	BindingType      string  `json:"binding_type"`       // "wire-o" | "plastic-comb" | "glue" | "none"
	BindingCost      float64 `json:"binding_cost"`       // Cost per book/unit

	// Overhead & Markup
	LaborCostPerHour  float64 `json:"labor_cost_per_hour"`
	EstimatedHours    float64 `json:"estimated_hours"`
	MarkupMargin      float64 `json:"markup_margin"` // e.g., 0.30 for 30% profit margin
}

// CalculationResponse details the cost breakdown and sale prices
type CalculationResponse struct {
	JobName       string  `json:"job_name"`
	Quantity      int     `json:"quantity"`
	PaperCost     float64 `json:"paper_cost"`
	InkCost       float64 `json:"ink_cost"`
	LaminationCost float64 `json:"lamination_cost"`
	BindingCost   float64 `json:"binding_cost"`
	LaborCost     float64 `json:"labor_cost"`
	TotalCost     float64 `json:"total_cost"`
	SalePrice     float64 `json:"sale_price"`
	UnitPrice     float64 `json:"unit_price"`
	ProfitMargin  float64 `json:"profit_margin"`
}

// CalculateJobPricing performs the backend pricing engine math
func CalculateJobPricing(req CalculationRequest) (CalculationResponse, error) {
	if req.Quantity <= 0 {
		return CalculationResponse{}, errors.New("quantity must be greater than zero")
	}

	// 1. Paper Cost calculation
	// We assume req.Quantity maps directly to the consumption sheets/meters required for this job
	paperCost := float64(req.Quantity) * req.PaperCostPerUnit

	// 2. Ink Cost calculation based on ISO coverage standards:
	// Standard: 210ml ink set prints 6,000 pages at 5% coverage.
	// Average ink consumption = 210ml / 6,000 pages = 0.035 ml per page (at 5% coverage).
	// Ink volume per page at X% coverage = 0.035 * (coverage / 5) = 0.007 * coverage (ml).
	inkVolumePerPage := 0.007 * req.InkCoveragePercent
	totalInkVolumeMl := float64(req.Quantity) * inkVolumePerPage
	inkCost := totalInkVolumeMl * req.InkCostPerMl

	// 3. Lamination Cost
	laminationCost := 0.0
	if req.LaminationType != "none" && req.LaminationType != "" {
		laminationCost = float64(req.Quantity) * req.LaminationCost
	}

	// 4. Binding Cost
	bindingCost := 0.0
	if req.BindingType != "none" && req.BindingType != "" {
		bindingCost = float64(req.Quantity) * req.BindingCost
	}

	// 5. Labor Cost
	laborCost := req.LaborCostPerHour * req.EstimatedHours

	// Total Base Cost
	totalCost := paperCost + inkCost + laminationCost + bindingCost + laborCost

	// 6. Markup & Sale Price
	salePrice := totalCost * (1.0 + req.MarkupMargin)
	
	// Round calculations to 2 decimal places
	paperCost = roundToTwoDecimals(paperCost)
	inkCost = roundToTwoDecimals(inkCost)
	laminationCost = roundToTwoDecimals(laminationCost)
	bindingCost = roundToTwoDecimals(bindingCost)
	laborCost = roundToTwoDecimals(laborCost)
	totalCost = roundToTwoDecimals(totalCost)
	salePrice = roundToTwoDecimals(salePrice)

	unitPrice := roundToTwoDecimals(salePrice / float64(req.Quantity))

	return CalculationResponse{
		JobName:        req.JobName,
		Quantity:       req.Quantity,
		PaperCost:      paperCost,
		InkCost:        inkCost,
		LaminationCost: laminationCost,
		BindingCost:    bindingCost,
		LaborCost:      laborCost,
		TotalCost:      totalCost,
		SalePrice:      salePrice,
		UnitPrice:      unitPrice,
		ProfitMargin:   req.MarkupMargin,
	}, nil
}

func roundToTwoDecimals(val float64) float64 {
	return math.Round(val*100) / 100
}
