package domain

import (
	"github.com/shopspring/decimal"
)

// InternalOrderPricing holds authoritative itemized cost components with strict LAK integer precision
type InternalOrderPricing struct {
	BaseMaterialCostLAK    int64           `json:"base_material_cost_lak"`
	InkUsageCostLAK        int64           `json:"ink_usage_cost_lak"`
	PlateCostLAK           int64           `json:"plate_cost_lak"`
	MachineDepreciationLAK int64           `json:"machine_depreciation_lak"`
	LaborFinishingCostLAK  int64           `json:"labor_finishing_cost_lak"`
	WasteSpoilageCostLAK   int64           `json:"waste_spoilage_cost_lak"`
	NetInternalCostLAK     int64           `json:"net_internal_cost_lak"`
	MarkupAmountLAK        int64           `json:"markup_amount_lak"`
	TaxAmountLAK           int64           `json:"tax_amount_lak"`
	TotalPriceLAK          int64           `json:"total_price_lak"`
	UnitPriceLAK           int64           `json:"unit_price_lak"`
	GenuineInkBaselineLAK  int64           `json:"genuine_ink_baseline_lak,omitempty"`
	CompatibleInkCostLAK   int64           `json:"compatible_ink_cost_lak,omitempty"`
	InkSavingsLAK          int64           `json:"ink_savings_lak,omitempty"`
	InkSavingsPercent      decimal.Decimal `json:"ink_savings_percent,omitempty"`
}

// CostBreakdown is an alias to InternalOrderPricing for backward compatibility
type CostBreakdown = InternalOrderPricing

// PricingCalculationRequest represents the authoritative input payload for calculating job prices
type PricingCalculationRequest struct {
	JobName                    string          `json:"job_name"`
	Quantity                   int             `json:"quantity" binding:"required,gt=0"`
	PaperSku                   string          `json:"paper_sku,omitempty"`
	PaperCostPerUnitLAK        int64           `json:"paper_cost_per_unit_lak"`
	PaperFormat                string          `json:"paper_format,omitempty"` // "sheet" | "roll"
	SheetsPerPack              int             `json:"sheets_per_pack,omitempty"`
	CutsPerSheet               int             `json:"cuts_per_sheet,omitempty"`
	WidthCM                    decimal.Decimal `json:"width_cm,omitempty"`
	HeightCM                   decimal.Decimal `json:"height_cm,omitempty"`
	UnfoldedWidthMM            decimal.Decimal `json:"unfolded_width_mm,omitempty"`
	UnfoldedHeightMM           decimal.Decimal `json:"unfolded_height_mm,omitempty"`
	PageCount                  int             `json:"page_count,omitempty"`
	InkCoveragePercent         decimal.Decimal `json:"ink_coverage_percent"`
	InkCostPerMlLAK            int64           `json:"ink_cost_per_ml_lak"`
	UseCompatibleInk           bool            `json:"use_compatible_ink"`
	CompatibleInkCostPerMlLAK  int64           `json:"compatible_ink_cost_per_ml_lak,omitempty"`
	LaminationType             string          `json:"lamination_type,omitempty"`
	LaminationCostLAK          int64           `json:"lamination_cost_lak,omitempty"`
	BindingType                string          `json:"binding_type,omitempty"`
	BindingCostLAK             int64           `json:"binding_cost_lak,omitempty"`
	GrommetsCount              int             `json:"grommets_count,omitempty"`
	GrommetCostLAK             int64           `json:"grommet_cost_lak,omitempty"`
	EdgeFolding                bool            `json:"edge_folding,omitempty"`
	FoldingCostLAK             int64           `json:"folding_cost_lak,omitempty"`
	LaborHours                 decimal.Decimal `json:"labor_hours,omitempty"`
	LaborRatePerHourLAK        int64           `json:"labor_rate_per_hour_lak,omitempty"`
	MachineDepreciationRateLAK int64           `json:"machine_depreciation_rate_lak,omitempty"`
	PlateCostPerUnitLAK        int64           `json:"plate_cost_per_unit_lak,omitempty"`
	SpoilageRatePercent        decimal.Decimal `json:"spoilage_rate_percent,omitempty"`
	MarkupMarginPercent        decimal.Decimal `json:"markup_margin_percent,omitempty"`
	TaxRatePercent             decimal.Decimal `json:"tax_rate_percent,omitempty"`
	MinTotalPriceLAK           int64           `json:"min_total_price_lak,omitempty"`
}

// PricingCalculationResponse returns the full internal breakdown for Admin
type PricingCalculationResponse struct {
	JobName       string                `json:"job_name"`
	Quantity      int                   `json:"quantity"`
	UnitPriceLAK  int64                 `json:"unit_price_lak"`
	TotalPriceLAK int64                 `json:"total_price_lak"`
	CostBreakdown InternalOrderPricing  `json:"cost_breakdown"`
	Currency      string                `json:"currency"`
}

// PublicPricingResponse returns customer-facing retail price without internal costs
type PublicPricingResponse struct {
	JobName       string `json:"job_name"`
	Quantity      int    `json:"quantity"`
	UnitPriceLAK  int64  `json:"unit_price_lak"`
	TotalPriceLAK int64  `json:"total_price_lak"`
	Currency      string `json:"currency"`
}
