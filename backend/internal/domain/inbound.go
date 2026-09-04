package domain

import (
	"time"

	"github.com/shopspring/decimal"
)

// InboundStatus defines the lifecycle status of an inbound record
type InboundStatus string

const (
	InboundStatusCompleted InboundStatus = "COMPLETED"
	InboundStatusCancelled InboundStatus = "CANCELLED"
)

// ParseInboundDate safely parses date strings (RFC3339, YYYY-MM-DD) into time.Time
func ParseInboundDate(s string) time.Time {
	if s == "" {
		return time.Now()
	}
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t
	}
	if t, err := time.Parse("2006-01-02", s); err == nil {
		return t
	}
	if t, err := time.Parse("2006-01-02 15:04:05", s); err == nil {
		return t
	}
	return time.Now()
}

// StockInboundRecord represents an immutable procurement inbound history entry
type StockInboundRecord struct {
	ID                 string                 `json:"id" db:"id"`
	InboundNumber      string                 `json:"inbound_number" db:"inbound_number"`
	PONumber           string                 `json:"po_number,omitempty" db:"po_number"`
	MaterialID         string                 `json:"material_id" db:"material_id"`
	SKUCode            string                 `json:"sku_code" db:"sku_code"`
	ItemName           string                 `json:"item_name" db:"item_name"`
	Category           string                 `json:"category,omitempty" db:"category"`
	SupplierName       string                 `json:"supplier_name,omitempty" db:"supplier_name"`
	LotBatchNumber     string                 `json:"lot_batch_number,omitempty" db:"lot_batch_number"`
	InboundDate        time.Time              `json:"inbound_date" db:"inbound_date"`
	QuantityReceived   decimal.Decimal        `json:"quantity_received" db:"quantity_received"`
	PurchaseUnit       string                 `json:"purchase_unit,omitempty" db:"purchase_unit"`
	PurchaseMultiplier decimal.Decimal        `json:"purchase_multiplier" db:"purchase_multiplier"`
	UnitPurchasePrice  decimal.Decimal        `json:"unit_purchase_price" db:"unit_purchase_price"`
	TotalPrice         decimal.Decimal        `json:"total_price" db:"total_price"`
	Status             InboundStatus          `json:"status" db:"status"`
	PaymentMethod      string                 `json:"payment_method,omitempty" db:"payment_method"`
	Origin             string                 `json:"origin,omitempty" db:"origin"`
	TariffFee          decimal.Decimal        `json:"tariff_fee" db:"tariff_fee"`
	FreightFee         decimal.Decimal        `json:"freight_fee" db:"freight_fee"`
	ProductImageURL    string                 `json:"product_image_url,omitempty" db:"product_image_url"`
	ReceiptSlipURL     string                 `json:"receipt_slip_url,omitempty" db:"receipt_slip_url"`
	ReceivedByUserID   string                 `json:"received_by_user_id" db:"received_by_user_id"`
	CancelledByUserID  string                 `json:"cancelled_by_user_id,omitempty" db:"cancelled_by_user_id"`
	CancellationReason string                 `json:"cancellation_reason,omitempty" db:"cancellation_reason"`
	ReceivedAt         time.Time              `json:"received_at" db:"received_at"`
	CancelledAt        *time.Time             `json:"cancelled_at,omitempty" db:"cancelled_at"`
	TechnicalSpecs     map[string]interface{} `json:"technical_specs,omitempty" db:"technical_specs"`
	CreatedAt          time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time              `json:"updated_at" db:"updated_at"`
}

// CreateInboundPayload represents request payload to receive stock items
type CreateInboundPayload struct {
	MaterialID         string                 `json:"material_id,omitempty"`
	SKUCode            string                 `json:"sku_code"`
	ItemName           string                 `json:"item_name"`
	Category           string                 `json:"category"`
	SupplierName       string                 `json:"supplier_name"`
	PONumber           string                 `json:"po_number"`
	LotBatchNumber     string                 `json:"lot_batch_number,omitempty"`
	InboundDate        string                 `json:"inbound_date"`
	QuantityReceived   decimal.Decimal        `json:"quantity_received"`
	PurchaseUnit       string                 `json:"purchase_unit"`
	PurchaseMultiplier decimal.Decimal        `json:"purchase_multiplier"`
	UnitPurchasePrice  decimal.Decimal        `json:"unit_purchase_price"`
	TotalPrice         decimal.Decimal        `json:"total_price"`
	PaymentMethod      string                 `json:"payment_method"`
	Origin             string                 `json:"origin"`
	TariffFee          decimal.Decimal        `json:"tariff_fee"`
	FreightFee         decimal.Decimal        `json:"freight_fee"`
	ProductImageURL    string                 `json:"product_image_url"`
	ReceiptSlipURL     string                 `json:"receipt_slip_url"`
	ReceivedByUserID   string                 `json:"received_by_user_id"`
	TechnicalSpecs     map[string]interface{} `json:"technical_specs"`
}

// ProcessInboundRequest is an alias for CreateInboundPayload for backward compatibility
type ProcessInboundRequest = CreateInboundPayload

// CancelInboundPayload represents request payload to reverse a previously completed inbound
type CancelInboundPayload struct {
	InboundID string `json:"inbound_id" binding:"required"`
	UserID    string `json:"user_id" binding:"required"`
	Reason    string `json:"reason" binding:"required"`
}

// CancelInboundRequest is an alias for CancelInboundPayload for backward compatibility
type CancelInboundRequest = CancelInboundPayload
