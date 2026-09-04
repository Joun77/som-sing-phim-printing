package domain

import (
	"time"

	"github.com/shopspring/decimal"
)

// ProductPricingTemplate represents a Print-on-Demand pricing template configuration with MOQ and coverage limits
type ProductPricingTemplate struct {
	ID                          string                 `json:"id" db:"id"`
	Name                        string                 `json:"name" db:"name"`
	MaterialID                  string                 `json:"material_id" db:"material_id"`
	BaselineCoveragePercent     decimal.Decimal        `json:"baseline_coverage_percent" db:"baseline_coverage_percent"`
	CoverageSurchargeMultiplier decimal.Decimal        `json:"coverage_surcharge_multiplier" db:"coverage_surcharge_multiplier"`
	MinOrderQuantity            int                    `json:"min_order_quantity" db:"min_order_quantity"`
	MinTotalPrice               decimal.Decimal        `json:"min_total_price" db:"min_total_price"`
	AddonRates                  map[string]interface{} `json:"addon_rates" db:"addon_rates"`
	IsActive                    bool                   `json:"is_active" db:"is_active"`
	CreatedAt                   time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt                   time.Time              `json:"updated_at" db:"updated_at"`
}

// CreatePricingTemplatePayload represents payload for creating a new product pricing template
type CreatePricingTemplatePayload struct {
	Name                        string                 `json:"name" binding:"required"`
	MaterialID                  string                 `json:"material_id" binding:"required"`
	BaselineCoveragePercent     decimal.Decimal        `json:"baseline_coverage_percent"`
	CoverageSurchargeMultiplier decimal.Decimal        `json:"coverage_surcharge_multiplier"`
	MinOrderQuantity            int                    `json:"min_order_quantity"`
	MinTotalPrice               decimal.Decimal        `json:"min_total_price"`
	AddonRates                  map[string]interface{} `json:"addon_rates,omitempty"`
	IsActive                    *bool                  `json:"is_active,omitempty"`
}

// UpdatePricingTemplatePayload represents payload for updating an existing product pricing template
type UpdatePricingTemplatePayload struct {
	Name                        *string                 `json:"name,omitempty"`
	MaterialID                  *string                 `json:"material_id,omitempty"`
	BaselineCoveragePercent     *decimal.Decimal        `json:"baseline_coverage_percent,omitempty"`
	CoverageSurchargeMultiplier *decimal.Decimal        `json:"coverage_surcharge_multiplier,omitempty"`
	MinOrderQuantity            *int                    `json:"min_order_quantity,omitempty"`
	MinTotalPrice               *decimal.Decimal        `json:"min_total_price,omitempty"`
	AddonRates                  *map[string]interface{} `json:"addon_rates,omitempty"`
	IsActive                    *bool                   `json:"is_active,omitempty"`
}

// AddonItemBreakdown details a single addon option cost calculation
type AddonItemBreakdown struct {
	Name      string          `json:"name"`
	Type      string          `json:"type"`
	Quantity  decimal.Decimal `json:"quantity"`
	UnitPrice decimal.Decimal `json:"unit_price"`
	TotalCost decimal.Decimal `json:"total_cost"`
}

// PricingCalculationRequest represents request payload to calculate dynamic job pricing
type PricingCalculationRequest struct {
	TemplateID     string                 `json:"template_id" binding:"required"`
	Quantity       int                    `json:"quantity" binding:"required,gt=0"`
	ActualCoverage decimal.Decimal        `json:"actual_coverage"`
	WidthMM        decimal.Decimal        `json:"width_mm"`
	HeightMM       decimal.Decimal        `json:"height_mm"`
	GrommetsCount  int                    `json:"grommets_count"`
	LaminationType string                 `json:"lamination_type"` // e.g. "GLOSS", "MATTE", "NONE"
	EdgeFolding    bool                   `json:"edge_folding"`
	SelectedAddons map[string]interface{} `json:"selected_addons,omitempty"`
}

// PriceBreakdown represents detailed itemized calculation response
type PriceBreakdown struct {
	TemplateID                  string               `json:"template_id"`
	TemplateName                string               `json:"template_name"`
	MaterialID                  string               `json:"material_id"`
	MaterialName                string               `json:"material_name"`
	Quantity                    int                  `json:"quantity"`
	MinOrderQuantity            int                  `json:"min_order_quantity"`
	AreaM2                      decimal.Decimal      `json:"area_m2"`
	PerimeterM                  decimal.Decimal      `json:"perimeter_m"`
	BaseUnitPrice               decimal.Decimal      `json:"base_unit_price"`
	BaseMaterialCost            decimal.Decimal      `json:"base_material_cost"`
	BaselineCoveragePercent     decimal.Decimal      `json:"baseline_coverage_percent"`
	ActualCoveragePercent       decimal.Decimal      `json:"actual_coverage_percent"`
	CoverageDeltaPercent        decimal.Decimal      `json:"coverage_delta_percent"`
	CoverageSurchargeMultiplier decimal.Decimal      `json:"coverage_surcharge_multiplier"`
	CoverageSurcharge           decimal.Decimal      `json:"coverage_surcharge"`
	AddonCost                   decimal.Decimal      `json:"addon_cost"`
	ItemizedAddons              []AddonItemBreakdown `json:"itemized_addons"`
	Subtotal                    decimal.Decimal      `json:"subtotal"`
	MinTotalPrice               decimal.Decimal      `json:"min_total_price"`
	MinPriceApplied             bool                 `json:"min_price_applied"`
	FinalPrice                  decimal.Decimal      `json:"final_price"`
	FinalUnitPrice              decimal.Decimal      `json:"final_unit_price"`
}
