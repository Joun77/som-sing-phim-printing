package domain

import (
	"time"

	"github.com/shopspring/decimal"
)

// CalculationModel defines the model used for dynamic pricing calculation
type CalculationModel string

const (
	CalculationModelBookBound   CalculationModel = "BOOK_BOUND"
	CalculationModelSingleSheet CalculationModel = "SINGLE_SHEET"
	CalculationModelCardUnit    CalculationModel = "CARD_UNIT"
)

// ProductPricingConfig represents the pricing configuration stored in PostgreSQL
type ProductPricingConfig struct {
	ID                      string           `json:"id" db:"id"`
	ProductID               string           `json:"product_id" db:"product_id"`
	CalculationModel        CalculationModel `json:"calculation_model" db:"calculation_model"`
	BaseSetupCost           decimal.Decimal  `json:"base_setup_cost" db:"base_setup_cost"`
	BlackMonoCostPerPercent decimal.Decimal  `json:"black_mono_cost_per_percent" db:"black_mono_cost_per_percent"`
	CMYKColorCostPerPercent decimal.Decimal  `json:"cmyk_color_cost_per_percent" db:"cmyk_color_cost_per_percent"`
	DefaultFallbackTAC      decimal.Decimal  `json:"default_fallback_tac" db:"default_fallback_tac"`
	CreatedAt               time.Time        `json:"created_at" db:"created_at"`
	UpdatedAt               time.Time        `json:"updated_at" db:"updated_at"`
}

// OrderItemCostBreakdown represents the audited cost breakdown table in PostgreSQL
type OrderItemCostBreakdown struct {
	ID               string          `json:"id" db:"id"`
	OrderItemID      string          `json:"order_item_id" db:"order_item_id"`
	PaperCost        decimal.Decimal `json:"paper_cost" db:"paper_cost"`
	InkCost          decimal.Decimal `json:"ink_cost" db:"ink_cost"`
	BindingCost      decimal.Decimal `json:"binding_cost" db:"binding_cost"`
	FinishingCost    decimal.Decimal `json:"finishing_cost" db:"finishing_cost"`
	UnitPrice        decimal.Decimal `json:"unit_price" db:"unit_price"`
	TotalPrice       decimal.Decimal `json:"total_price" db:"total_price"`
	RawCPct          decimal.Decimal `json:"raw_c_pct" db:"raw_c_pct"`
	RawMPct          decimal.Decimal `json:"raw_m_pct" db:"raw_m_pct"`
	RawYPct          decimal.Decimal `json:"raw_y_pct" db:"raw_y_pct"`
	RawKPct          decimal.Decimal `json:"raw_k_pct" db:"raw_k_pct"`
	RawTACPct        decimal.Decimal `json:"raw_tac_pct" db:"raw_tac_pct"`
	AppliedTACPct    decimal.Decimal `json:"applied_tac_pct" db:"applied_tac_pct"`
	IsManualOverride bool            `json:"is_manual_override" db:"is_manual_override"`
	CreatedAt        time.Time       `json:"created_at" db:"created_at"`
}

// CoverageMetrics encapsulates CMYK and Total Area Coverage percentages
type CoverageMetrics struct {
	C   decimal.Decimal `json:"c"`
	M   decimal.Decimal `json:"m"`
	Y   decimal.Decimal `json:"y"`
	K   decimal.Decimal `json:"k"`
	TAC decimal.Decimal `json:"tac"`
}

// CustomerPriceQuote is the aggregated customer-facing output without exposing raw CMYK telemetry
type CustomerPriceQuote struct {
	UnitPricePerPage decimal.Decimal `json:"unit_price_per_page"`
	TotalUnitPrice   decimal.Decimal `json:"total_unit_price"`
	Quantity         int             `json:"quantity"`
	Subtotal         decimal.Decimal `json:"subtotal"`
	CalculationBadge string          `json:"calculation_badge"`
}

// InternalCostAudit provides full transparency for internal accounting and verification
type InternalCostAudit struct {
	PaperCost        decimal.Decimal `json:"paper_cost"`
	InkCost          decimal.Decimal `json:"ink_cost"`
	BindingCost      decimal.Decimal `json:"binding_cost"`
	FinishingCost    decimal.Decimal `json:"finishing_cost"`
	SetupCost        decimal.Decimal `json:"setup_cost"`
	UnitPrice        decimal.Decimal `json:"unit_price"`
	TotalPrice       decimal.Decimal `json:"total_price"`
	RawCPct          decimal.Decimal `json:"raw_c_pct"`
	RawMPct          decimal.Decimal `json:"raw_m_pct"`
	RawYPct          decimal.Decimal `json:"raw_y_pct"`
	RawKPct          decimal.Decimal `json:"raw_k_pct"`
	RawTACPct        decimal.Decimal `json:"raw_tac_pct"`
	AppliedTACPct    decimal.Decimal `json:"applied_tac_pct"`
	IsManualOverride bool            `json:"is_manual_override"`
	FormulaAuditLog  []string        `json:"formula_audit_log"`
}

// PricingRequest represents the calculation input for dynamic pricing
type PricingRequest struct {
	ProductID         string                `json:"product_id"`
	Config            *ProductPricingConfig `json:"config,omitempty"`
	CalculationModel  CalculationModel      `json:"calculation_model"`
	PaperCostPerSheet decimal.Decimal       `json:"paper_cost_per_sheet"`
	PageCount         int                   `json:"page_count"`
	IsDoubleSided     bool                  `json:"is_double_sided"`
	BindingCost       decimal.Decimal       `json:"binding_cost"`
	FinishingCost     decimal.Decimal       `json:"finishing_cost"`
	Quantity          int                   `json:"quantity"`
	Coverage          *CoverageMetrics      `json:"coverage,omitempty"`
	ManualOverride    bool                  `json:"manual_override,omitempty"`
	OverrideUnitPrice *decimal.Decimal      `json:"override_unit_price,omitempty"`
}
