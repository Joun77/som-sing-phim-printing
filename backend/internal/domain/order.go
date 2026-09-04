package domain

import (
	"errors"
	"time"

	"github.com/shopspring/decimal"
)

// OrderStatus defines the strict state machine lifecycle of print orders
type OrderStatus string

const (
	StatusQuotation      OrderStatus = "QUOTATION"
	StatusPendingPayment OrderStatus = "PENDING_PAYMENT"
	StatusOrderCreated   OrderStatus = "ORDER_CREATED"
	StatusFileConfirmed  OrderStatus = "FILE_CONFIRMED"
	StatusInProduction   OrderStatus = "IN_PRODUCTION"
	StatusCompleted      OrderStatus = "COMPLETED"
	StatusCancelled      OrderStatus = "CANCELLED"
)

// BindingType defines available bookbinding/finishing methods
type BindingType string

const (
	BindingNone           BindingType = "NONE"
	BindingPerfectHotGlue BindingType = "PERFECT_HOT_GLUE"
	BindingSaddleStitch   BindingType = "SADDLE_STITCH"
	BindingWireO          BindingType = "WIRE_O"
	BindingPlasticComb    BindingType = "PLASTIC_COMB"
	BindingCalendar       BindingType = "CALENDAR"
)

var (
	ErrInvalidStatusTransition = errors.New("invalid order status transition")
	ErrOrderAlreadyCompleted    = errors.New("cannot change status of completed order")
	ErrOrderAlreadyCancelled    = errors.New("cannot change status of cancelled order")
	ErrStockAlreadyDeducted     = errors.New("inventory stock already deducted for this order")
)

// AllowedTransitions maps valid forward and backward status transitions
var AllowedTransitions = map[OrderStatus][]OrderStatus{
	StatusQuotation:      {StatusPendingPayment, StatusCancelled},
	StatusPendingPayment: {StatusOrderCreated, StatusQuotation, StatusCancelled},
	StatusOrderCreated:   {StatusFileConfirmed, StatusCancelled},
	StatusFileConfirmed:  {StatusInProduction, StatusCancelled},
	StatusInProduction:   {StatusCompleted, StatusCancelled},
	StatusCompleted:      {},
	StatusCancelled:      {},
}

// ValidateStatusTransition checks if transition from current to target status is permitted
func ValidateStatusTransition(from, to OrderStatus) error {
	if from == to {
		return nil
	}
	if from == StatusCompleted {
		return ErrOrderAlreadyCompleted
	}
	if from == StatusCancelled {
		return ErrOrderAlreadyCancelled
	}

	allowed, ok := AllowedTransitions[from]
	if !ok {
		return ErrInvalidStatusTransition
	}

	for _, s := range allowed {
		if s == to {
			return nil
		}
	}
	return ErrInvalidStatusTransition
}

// CustomPrintSpecs specifies detailed item technical configuration
type CustomPrintSpecs struct {
	Size               string          `json:"size"`
	Paper              string          `json:"paper"`
	Finishing          string          `json:"finishing,omitempty"`
	Lamination         string          `json:"lamination,omitempty"`
	Binding            string          `json:"binding,omitempty"`
	WidthMM            decimal.Decimal `json:"width_mm,omitempty"`
	HeightMM           decimal.Decimal `json:"height_mm,omitempty"`
	Pages              int             `json:"pages,omitempty"`
	IsDoubleSided      bool            `json:"is_double_sided,omitempty"`
	InkCoveragePercent decimal.Decimal `json:"ink_coverage_percent,omitempty"`
	InkCoverageC       decimal.Decimal `json:"ink_coverage_c,omitempty"`
	InkCoverageM       decimal.Decimal `json:"ink_coverage_m,omitempty"`
	InkCoverageY       decimal.Decimal `json:"ink_coverage_y,omitempty"`
	InkCoverageK       decimal.Decimal `json:"ink_coverage_k,omitempty"`
	ColorMode          string          `json:"color_mode,omitempty"`
	SpoilageRatePct    decimal.Decimal `json:"spoilage_rate_pct,omitempty"`
	AdditionalNotes    string          `json:"additional_notes,omitempty"`
}

// OrderItem represents a single product or book line item in an order
type OrderItem struct {
	ID               string                 `json:"id" db:"id"`
	OrderID          string                 `json:"order_id" db:"order_id"`
	ProductID        string                 `json:"product_id,omitempty" db:"product_id"`
	JobName          string                 `json:"job_name" db:"job_name"`
	ItemName         string                 `json:"item_name" db:"item_name"`
	Quantity         int                    `json:"quantity" db:"quantity"`
	PageCount        int                    `json:"page_count" db:"page_count"`
	PaperSize        string                 `json:"paper_size" db:"paper_size"`
	PaperSKU         string                 `json:"paper_sku,omitempty" db:"paper_sku"`
	BindingType      BindingType            `json:"binding_type" db:"binding_type"`
	SpineWidthMM     decimal.Decimal        `json:"spine_width_mm" db:"spine_width_mm"`
	UnitPrice        decimal.Decimal        `json:"unit_price" db:"unit_price"`
	UnitCost         decimal.Decimal        `json:"unit_cost" db:"unit_cost"`
	TotalPrice       decimal.Decimal        `json:"total_price" db:"total_price"`
	TotalCost        decimal.Decimal        `json:"total_cost" db:"total_cost"`
	IsManualOverride bool                   `json:"is_manual_override" db:"is_manual_override"`
	OverrideReason   string                 `json:"override_reason,omitempty" db:"override_reason"`
	OverrideBy       string                 `json:"override_by,omitempty" db:"override_by"`
	Specs            CustomPrintSpecs       `json:"specs" db:"specs"`
	CostBreakdown    *InternalCostAudit     `json:"cost_breakdown,omitempty"`
	CreatedAt        time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time              `json:"updated_at" db:"updated_at"`
}

// Order represents an authoritative print order entity
type Order struct {
	ID                    string                 `json:"id" db:"id"`
	OrderNumber           string                 `json:"order_number" db:"order_number"`
	CustomerID            string                 `json:"customer_id,omitempty" db:"customer_id"`
	CustomerName          string                 `json:"customer_name" db:"customer_name"`
	CustomerPhone         string                 `json:"customer_phone,omitempty" db:"customer_phone"`
	CustomerEmail         string                 `json:"customer_email,omitempty" db:"customer_email"`
	CustomerAddress       string                 `json:"customer_address,omitempty" db:"customer_address"`
	Status                OrderStatus            `json:"status" db:"status"`
	TotalAmount           decimal.Decimal        `json:"total_amount" db:"total_amount"`
	DepositAmount         decimal.Decimal        `json:"deposit_amount" db:"deposit_amount"`
	RemainingAmount       decimal.Decimal        `json:"remaining_amount" db:"remaining_amount"`
	Currency              string                 `json:"currency" db:"currency"`
	ExchangeRate          decimal.Decimal        `json:"exchange_rate" db:"exchange_rate"`
	GoogleDriveLink       string                 `json:"google_drive_link,omitempty" db:"google_drive_link"`
	ProofURL              string                 `json:"proof_url,omitempty" db:"proof_url"`
	ProofApprovedAt       *time.Time             `json:"proof_approved_at,omitempty" db:"proof_approved_at"`
	ProofRejectedAt       *time.Time             `json:"proof_rejected_at,omitempty" db:"proof_rejected_at"`
	ProofRejectionReason  string                 `json:"proof_rejection_reason,omitempty" db:"proof_rejection_reason"`
	StockDeductedAt       *time.Time             `json:"stock_deducted_at,omitempty" db:"stock_deducted_at"`
	IdempotencyKey        string                 `json:"idempotency_key,omitempty" db:"idempotency_key"`
	DeliveryDate          string                 `json:"delivery_date,omitempty" db:"delivery_date"`
	Notes                 string                 `json:"notes,omitempty" db:"notes"`
	CreatedBy             string                 `json:"created_by,omitempty" db:"created_by"`
	Items                 []OrderItem            `json:"items,omitempty"`
	StatusHistories       []OrderStatusHistory   `json:"status_histories,omitempty"`
	SpoilageLogs          []SpoilageLog          `json:"spoilage_logs,omitempty"`
	CreatedAt             time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time              `json:"updated_at" db:"updated_at"`
}

// OrderStatusHistory tracks every state transition and audit trail
type OrderStatusHistory struct {
	ID             string      `json:"id" db:"id"`
	OrderID        string      `json:"order_id" db:"order_id"`
	PreviousStatus OrderStatus `json:"previous_status" db:"previous_status"`
	NewStatus      OrderStatus `json:"new_status" db:"new_status"`
	Reason         string      `json:"reason,omitempty" db:"reason"`
	PerformedBy    string      `json:"performed_by,omitempty" db:"performed_by"`
	CreatedAt      time.Time   `json:"created_at" db:"created_at"`
}

// SpoilageLog tracks waste and spoilage during production
type SpoilageLog struct {
	ID              string          `json:"id" db:"id"`
	OrderID         string          `json:"order_id" db:"order_id"`
	OrderItemID     string          `json:"order_item_id,omitempty" db:"order_item_id"`
	MaterialSKU     string          `json:"material_sku" db:"material_sku"`
	MaterialName    string          `json:"material_name" db:"material_name"`
	Category        string          `json:"category" db:"category"`
	QuantitySpoiled decimal.Decimal `json:"quantity_spoiled" db:"quantity_spoiled"`
	Unit            string          `json:"unit" db:"unit"`
	Reason          string          `json:"reason" db:"reason"`
	CostImpact      decimal.Decimal `json:"cost_impact" db:"cost_impact"`
	RecordedBy      string          `json:"recorded_by,omitempty" db:"recorded_by"`
	CreatedAt       time.Time       `json:"created_at" db:"created_at"`
}

// CreateOrderItemPayload represents request payload for an item
type CreateOrderItemPayload struct {
	ProductID    string           `json:"product_id,omitempty"`
	JobName      string           `json:"job_name" binding:"required"`
	ItemName     string           `json:"item_name" binding:"required"`
	Quantity     int              `json:"quantity" binding:"required,gt=0"`
	PageCount    int              `json:"page_count" binding:"required,gt=0"`
	PaperSize    string           `json:"paper_size"`
	PaperSKU     string           `json:"paper_sku"`
	BindingType  BindingType      `json:"binding_type"`
	SpineWidthMM decimal.Decimal  `json:"spine_width_mm"`
	UnitPrice    decimal.Decimal  `json:"unit_price"`
	UnitCost     decimal.Decimal  `json:"unit_cost"`
	Specs        CustomPrintSpecs `json:"specs"`
}

// CreateOrderPayload represents request payload to create an order or quotation
type CreateOrderPayload struct {
	OrderNumber     string                   `json:"order_number"`
	CustomerID      string                   `json:"customer_id,omitempty"`
	CustomerName    string                   `json:"customer_name" binding:"required"`
	CustomerPhone   string                   `json:"customer_phone"`
	CustomerEmail   string                   `json:"customer_email"`
	CustomerAddress string                   `json:"customer_address"`
	Status          OrderStatus              `json:"status"` // Defaults to QUOTATION
	DepositAmount   decimal.Decimal          `json:"deposit_amount"`
	Currency        string                   `json:"currency"`
	ExchangeRate    decimal.Decimal          `json:"exchange_rate"`
	GoogleDriveLink string                   `json:"google_drive_link"`
	DeliveryDate    string                   `json:"delivery_date"`
	Notes           string                   `json:"notes"`
	CreatedBy       string                   `json:"created_by"`
	Items           []CreateOrderItemPayload `json:"items" binding:"required,min=1"`
}

// UpdateOrderStatusPayload represents request payload to transition status
type UpdateOrderStatusPayload struct {
	Status      OrderStatus `json:"status" binding:"required"`
	Reason      string      `json:"reason"`
	PerformedBy string      `json:"performed_by"`
}

// OverridePricingPayload represents request payload to override item pricing
type OverridePricingPayload struct {
	OrderItemID       string          `json:"order_item_id" binding:"required"`
	OverrideUnitPrice decimal.Decimal `json:"override_unit_price" binding:"required"`
	Reason            string          `json:"reason" binding:"required"`
	ApprovedBy        string          `json:"approved_by" binding:"required"`
}

// OrderFilter represents criteria for listing orders
type OrderFilter struct {
	Status       OrderStatus
	CustomerName string
	OrderNumber  string
	Limit        int
	Offset       int
}
