package domain

import (
	"time"

	"github.com/shopspring/decimal"
)

// InkBottleInventory represents shop-floor physical bottle stock
type InkBottleInventory struct {
	ID               string          `json:"id" db:"id"`
	InkCode          string          `json:"ink_code" db:"ink_code"`
	InkName          string          `json:"ink_name" db:"ink_name"`
	ColorGroup       string          `json:"color_group" db:"color_group"`
	ColorCode        string          `json:"color_code,omitempty" db:"color_code"`
	BottleCapacityMl decimal.Decimal `json:"bottle_capacity_ml" db:"bottle_capacity_ml"`
	BottleCost       decimal.Decimal `json:"bottle_cost" db:"bottle_cost"`
	CostPerMl        decimal.Decimal `json:"cost_per_ml" db:"cost_per_ml"`
	BottlesInStock   int             `json:"bottles_in_stock" db:"bottles_in_stock"`
	MinBottleAlert   int             `json:"min_bottle_alert" db:"min_bottle_alert"`
	IsCompatible     bool            `json:"is_compatible" db:"is_compatible"`
	TargetPrinterID  string          `json:"target_printer_id,omitempty" db:"target_printer_id"`
	SupplierName     string          `json:"supplier_name,omitempty" db:"supplier_name"`
	SupplierPhone    string          `json:"supplier_phone,omitempty" db:"supplier_phone"`
	PurchaseLink     string          `json:"purchase_link,omitempty" db:"purchase_link"`
	ProductImageURL  string          `json:"product_image_url,omitempty" db:"product_image_url"`
	ReceiptSlipURL   string          `json:"receipt_slip_url,omitempty" db:"receipt_slip_url"`
	Status           string          `json:"status" db:"status"`
	CreatedAt        time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time       `json:"updated_at" db:"updated_at"`
}

// DeductInkBottleRequest represents shop-floor printer replenishment payload
type DeductInkBottleRequest struct {
	InkBottleID string `json:"ink_bottle_id" binding:"required"`
	PrinterID   string `json:"printer_id" binding:"required"`
	Quantity    int    `json:"quantity" binding:"required,gt=0"`
	OperatorID  string `json:"operator_id" binding:"required"`
	Notes       string `json:"notes,omitempty"`
}

// IntakeInkBottleRequest represents adding new bottles into inventory
type IntakeInkBottleRequest struct {
	InkCode          string          `json:"ink_code" binding:"required"`
	InkName          string          `json:"ink_name" binding:"required"`
	ColorGroup       string          `json:"color_group" binding:"required"`
	ColorCode        string          `json:"color_code"`
	BottleCapacityMl decimal.Decimal `json:"bottle_capacity_ml" binding:"required"`
	BottleCost       decimal.Decimal `json:"bottle_cost" binding:"required"`
	Quantity         int             `json:"quantity" binding:"required,gt=0"`
	MinBottleAlert   int             `json:"min_bottle_alert"`
	IsCompatible     bool            `json:"is_compatible"`
	TargetPrinterID  string          `json:"target_printer_id"`
	SupplierName     string          `json:"supplier_name"`
	SupplierPhone    string          `json:"supplier_phone"`
	PurchaseLink     string          `json:"purchase_link"`
	ProductImageURL  string          `json:"product_image_url"`
	ReceiptSlipURL   string          `json:"receipt_slip_url"`
}
