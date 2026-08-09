package orders

import (
	"time"
)

type OrderStatus string

const (
	StatusDraft          OrderStatus = "DRAFT"
	StatusWaitingDeposit OrderStatus = "WAITING_DEPOSIT"
	StatusPrepressCheck  OrderStatus = "PREPRESS_CHECK"
	StatusWaitingApproval OrderStatus = "WAITING_APPROVAL"
	StatusReadyToPrint   OrderStatus = "READY_TO_PRINT"
	StatusInProduction   OrderStatus = "IN_PRODUCTION"
	StatusCompleted      OrderStatus = "COMPLETED"
	StatusDelivered      OrderStatus = "DELIVERED"
)

type OrderItem struct {
	ID                 string                 `json:"id"`
	OrderID            string                 `json:"order_id"`
	JobName            string                 `json:"job_name"`
	Quantity           int                    `json:"quantity"`
	UnitPriceSnapshot  float64                `json:"unit_price_snapshot"`
	CostPriceSnapshot  float64                `json:"cost_price_snapshot"`
	Specs              map[string]interface{} `json:"specs"`
}

type Order struct {
	ID              string      `json:"id"`
	OrderNumber     string      `json:"order_number"`
	CustomerName    string      `json:"customer_name"`
	CustomerPhone   string      `json:"customer_phone"`
	Status          OrderStatus `json:"status"`
	DepositAmount   float64     `json:"deposit_amount"`
	TotalPrice      float64     `json:"total_price"`
	TotalCost       float64     `json:"total_cost"`
	GoogleDriveLink string      `json:"google_drive_link"`
	Items           []OrderItem `json:"items"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`
}

// Request payloads
type CreateOrderRequest struct {
	CustomerName    string                 `json:"customer_name" binding:"required"`
	CustomerPhone   string                 `json:"customer_phone"`
	GoogleDriveLink string                 `json:"google_drive_link"`
	Items           []CreateItemRequest    `json:"items" binding:"required,dive,required"`
}

type CreateItemRequest struct {
	JobName            string                 `json:"job_name" binding:"required"`
	Quantity           int                    `json:"quantity" binding:"required,gt=0"`
	PaperSku           string                 `json:"paper_sku" binding:"required"`
	PaperCostPerUnit   float64                `json:"paper_cost_per_unit" binding:"required"`
	PaperFormat        string                 `json:"paper_format" binding:"required"`
	InkCoveragePercent float64                `json:"ink_coverage_percent"`
	InkCostPerMl       float64                `json:"ink_cost_per_ml"`
	LaminationType     string                 `json:"lamination_type"`
	LaminationCost     float64                `json:"lamination_cost"`
	BindingType        string                 `json:"binding_type"`
	BindingCost        float64                `json:"binding_cost"`
	LaborCostPerHour   float64                `json:"labor_cost_per_hour"`
	EstimatedHours     float64                `json:"estimated_hours"`
	MarkupMargin       float64                `json:"markup_margin"`
	Specs              map[string]interface{} `json:"specs"`
}

type DepositPaymentRequest struct {
	DepositAmount float64 `json:"deposit_amount" binding:"required,gt=0"`
}
