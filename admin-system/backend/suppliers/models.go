package suppliers

import (
	"time"
)

// Supplier represents vendor master record
type Supplier struct {
	ID               string    `json:"id"`
	Code             string    `json:"code"`
	Name             string    `json:"name"`
	ContactName      string    `json:"contact_name"`
	Phone            string    `json:"phone"`
	Email            string    `json:"email"`
	Address          string    `json:"address"`
	TaxID            string    `json:"tax_id"`
	PaymentTermsDays int       `json:"payment_terms_days"`
	Currency         string    `json:"currency"`
	IsActive         bool      `json:"is_active"`
	Notes            string    `json:"notes"`
	BranchID         *string   `json:"branch_id"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// CreateSupplierRequest payload
type CreateSupplierRequest struct {
	Code             string  `json:"code" binding:"required"`
	Name             string  `json:"name" binding:"required"`
	ContactName      string  `json:"contact_name"`
	Phone            string  `json:"phone"`
	Email            string  `json:"email"`
	Address          string  `json:"address"`
	TaxID            string  `json:"tax_id"`
	PaymentTermsDays int     `json:"payment_terms_days"`
	Currency         string  `json:"currency"`
	Notes            string  `json:"notes"`
	BranchID         *string `json:"branch_id"`
}

// POLineItem represents item row in PO
type POLineItem struct {
	ID          string  `json:"id"`
	POID        string  `json:"po_id"`
	MaterialID  *string `json:"material_id"`
	Description string  `json:"description"`
	Quantity    float64 `json:"quantity"`
	Unit        string  `json:"unit"`
	UnitPrice   float64 `json:"unit_price"`
	TotalPrice  float64 `json:"total_price"`
	ReceivedQty float64 `json:"received_qty"`
	CreatedAt   string  `json:"created_at"`
}

// PurchaseOrder represents PO Header
type PurchaseOrder struct {
	ID               string       `json:"id"`
	PONumber         string       `json:"po_number"`
	SupplierID       string       `json:"supplier_id"`
	SupplierName     string       `json:"supplier_name"`
	Status           string       `json:"status"` // DRAFT, SENT, PARTIAL_RECEIVED, RECEIVED, CANCELLED
	OrderDate        string       `json:"order_date"`
	ExpectedDelivery *string      `json:"expected_delivery"`
	TotalAmount      float64      `json:"total_amount"`
	Currency         string       `json:"currency"`
	Notes            string       `json:"notes"`
	CreatedBy        string       `json:"created_by"`
	ApprovedBy       *string      `json:"approved_by"`
	ApprovedAt       *string      `json:"approved_at"`
	Lines            []POLineItem `json:"lines,omitempty"`
	CreatedAt        string       `json:"created_at"`
	UpdatedAt        string       `json:"updated_at"`
}

// CreatePORequest payload
type CreatePORequest struct {
	SupplierID       string `json:"supplier_id" binding:"required"`
	ExpectedDelivery string `json:"expected_delivery"`
	Currency         string `json:"currency"`
	Notes            string `json:"notes"`
	CreatedBy        string `json:"created_by"`
	Lines            []struct {
		MaterialID  *string `json:"material_id"`
		Description string  `json:"description" binding:"required"`
		Quantity    float64 `json:"quantity" binding:"required,gt=0"`
		Unit        string  `json:"unit" binding:"required"`
		UnitPrice   float64 `json:"unit_price" binding:"required,gte=0"`
	} `json:"lines" binding:"required,min=1"`
}

// GoodsReceiptLineInput payload for receiving PO line
type GoodsReceiptLineInput struct {
	POLineID    string  `json:"po_line_id" binding:"required"`
	ReceivedQty float64 `json:"received_qty" binding:"required,gt=0"`
}

// GoodsReceiptRequest payload
type GoodsReceiptRequest struct {
	ReceivedBy string                  `json:"received_by"`
	Notes      string                  `json:"notes"`
	Lines      []GoodsReceiptLineInput `json:"lines" binding:"required,min=1"`
}
