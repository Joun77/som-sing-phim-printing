package domain

import (
	"time"

	"github.com/shopspring/decimal"
)

// StockStatus represents current stock availability state
type StockStatus string

const (
	StockStatusInStock    StockStatus = "IN_STOCK"
	StockStatusLowStock   StockStatus = "LOW_STOCK"
	StockStatusOutOfStock StockStatus = "OUT_OF_STOCK"
)

// MaterialCategory represents the category of the material
type MaterialCategory string

const (
	MaterialCategoryPaper      MaterialCategory = "paper"
	MaterialCategoryInk        MaterialCategory = "ink"
	MaterialCategoryLamination MaterialCategory = "lamination"
	MaterialCategoryBinding    MaterialCategory = "binding"
	MaterialCategorySpareParts MaterialCategory = "spare_parts"
)

// Material represents a master inventory item in Som Sing Phim ERP
type Material struct {
	ID                     string                 `json:"id" db:"id"`
	SKU                    string                 `json:"sku" db:"sku"`
	Name                   string                 `json:"name" db:"name"`
	Category               string                 `json:"category" db:"category"`
	StockQty               decimal.Decimal        `json:"stock_qty" db:"stock_qty"`
	ConsumptionUnit        string                 `json:"consumption_unit" db:"consumption_unit"`
	PurchaseUnit           string                 `json:"purchase_unit" db:"purchase_unit"`
	PurchaseMultiplier     decimal.Decimal        `json:"purchase_multiplier" db:"purchase_multiplier"`
	CostPerPurchaseUnit    decimal.Decimal        `json:"cost_per_purchase_unit" db:"cost_per_purchase_unit"`
	CostPerConsumptionUnit decimal.Decimal        `json:"cost_per_consumption_unit" db:"cost_per_consumption_unit"`
	ReorderThreshold       decimal.Decimal        `json:"reorder_threshold" db:"reorder_threshold"`
	MinStockAlert          decimal.Decimal        `json:"min_stock_alert" db:"min_stock_alert"`
	StockStatus            StockStatus            `json:"stock_status" db:"stock_status"`
	IsActive               bool                   `json:"is_active" db:"is_active"`
	SpecificationMeta      map[string]interface{} `json:"specification_meta,omitempty" db:"specification_meta"`
	TechnicalSpecs         map[string]interface{} `json:"technical_specs,omitempty" db:"technical_specs"`
	CreatedAt              time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt              time.Time              `json:"updated_at" db:"updated_at"`
}

// UpdateMaterialPayload represents payload for direct admin edits on a material
type UpdateMaterialPayload struct {
	Name                   *string                 `json:"name,omitempty"`
	Category               *string                 `json:"category,omitempty"`
	ConsumptionUnit        *string                 `json:"consumption_unit,omitempty"`
	PurchaseUnit           *string                 `json:"purchase_unit,omitempty"`
	PurchaseMultiplier     *decimal.Decimal        `json:"purchase_multiplier,omitempty"`
	CostPerPurchaseUnit    *decimal.Decimal        `json:"cost_per_purchase_unit,omitempty"`
	CostPerConsumptionUnit *decimal.Decimal        `json:"cost_per_consumption_unit,omitempty"`
	ReorderThreshold       *decimal.Decimal        `json:"reorder_threshold,omitempty"`
	MinStockAlert          *decimal.Decimal        `json:"min_stock_alert,omitempty"`
	StockStatus            *StockStatus            `json:"stock_status,omitempty"`
	IsActive               *bool                   `json:"is_active,omitempty"`
	TechnicalSpecs         *map[string]interface{} `json:"technical_specs,omitempty"`
}

// UpdateMaterialRequest is an alias for backward compatibility
type UpdateMaterialRequest = UpdateMaterialPayload
