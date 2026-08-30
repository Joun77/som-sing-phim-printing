package domain

import (
	"time"

	"github.com/shopspring/decimal"
)

// OrderStatus represents the strict lifecycle states of a print order
type OrderStatus string

const (
	StatusQuotation               OrderStatus = "QUOTATION"
	StatusPendingPayment          OrderStatus = "PENDING_PAYMENT"
	StatusPendingSlipCheck        OrderStatus = "PENDING_SLIP_CHECK"
	StatusPaidPrepress            OrderStatus = "PAID_PREPRESS"
	StatusOrderCreated            OrderStatus = "ORDER_CREATED"
	StatusPrepressCheck           OrderStatus = "PREPRESS_CHECK"
	StatusWaitingApproval         OrderStatus = "WAITING_APPROVAL"
	StatusProofRejected           OrderStatus = "PROOF_REJECTED"
	StatusFileConfirmed           OrderStatus = "FILE_CONFIRMED"
	StatusReadyToPrint            OrderStatus = "READY_TO_PRINT"
	StatusInProduction            OrderStatus = "IN_PRODUCTION"
	StatusPostPress               OrderStatus = "POST_PRESS"
	StatusFinishing               OrderStatus = "FINISHING"
	StatusShipped                 OrderStatus = "SHIPPED"
	StatusReadyForDelivery        OrderStatus = "READY_FOR_DELIVERY"
	StatusCompleted               OrderStatus = "COMPLETED"
	StatusDelivered               OrderStatus = "DELIVERED"
	StatusCancelled               OrderStatus = "CANCELLED"
	StatusRequiresManagerApproval OrderStatus = "REQUIRES_MANAGER_APPROVAL"
)

// BindingType defines available bookbinding methods
type BindingType string

const (
	BindingNone           BindingType = "NONE"
	BindingPerfectHotGlue BindingType = "PERFECT_HOT_GLUE"
	BindingSaddleStitch   BindingType = "SADDLE_STITCH"
	BindingWireO          BindingType = "WIRE_O"
	BindingPlasticComb    BindingType = "PLASTIC_COMB"
	BindingCalendar       BindingType = "CALENDAR"
)

// ProductionStep defines production station tracking
type ProductionStep string

const (
	StepPending        ProductionStep = "PENDING"
	StepPrepressCheck  ProductionStep = "PREPRESS_CHECK"
	StepInnerPrinted   ProductionStep = "INNER_PRINTED"
	StepCoverPrinted   ProductionStep = "COVER_PRINTED"
	StepCoverLaminated ProductionStep = "COVER_LAMINATED"
	StepPaperTrimmed   ProductionStep = "PAPER_TRIMMED"
	StepBound          ProductionStep = "BOUND"
	StepReadyForPickup ProductionStep = "READY_FOR_PICKUP"
	StepCompleted      ProductionStep = "COMPLETED"
)

// CustomPrintSpecs specifies detailed item technical options without untyped interfaces
type CustomPrintSpecs struct {
	Size               string          `json:"size"`
	Paper              string          `json:"paper"`
	Finishing          string          `json:"finishing"`
	Lamination         string          `json:"lamination,omitempty"`
	Binding            string          `json:"binding,omitempty"`
	WidthMM            decimal.Decimal `json:"width_mm,omitempty"`
	HeightMM           decimal.Decimal `json:"height_mm,omitempty"`
	WidthCM            decimal.Decimal `json:"width_cm,omitempty"`
	HeightCM           decimal.Decimal `json:"height_cm,omitempty"`
	Pages              int             `json:"pages,omitempty"`
	GrommetsCount      int             `json:"grommets_count,omitempty"`
	EdgeFolding        bool            `json:"edge_folding,omitempty"`
	InkCoveragePercent decimal.Decimal `json:"ink_coverage_percent,omitempty"`
	InkCoverageC       decimal.Decimal `json:"ink_coverage_c,omitempty"`
	InkCoverageM       decimal.Decimal `json:"ink_coverage_m,omitempty"`
	InkCoverageY       decimal.Decimal `json:"ink_coverage_y,omitempty"`
	InkCoverageK       decimal.Decimal `json:"ink_coverage_k,omitempty"`
	ColorMode          string          `json:"color_mode,omitempty"`
	AdditionalNotes    string          `json:"additional_notes,omitempty"`
}

// OrderItem represents an individual line item with exact integer LAK pricing
type OrderItem struct {
	ID                string                `json:"id"`
	OrderID           string                `json:"order_id"`
	JobName           string                `json:"job_name"`
	ItemName          string                `json:"item_name"`
	Quantity          int                   `json:"quantity"`
	PageCount         int                   `json:"page_count"`
	PaperSize         string                `json:"paper_size"`
	CoverPaperID      string                `json:"cover_paper_id,omitempty"`
	InnerPaperID      string                `json:"inner_paper_id,omitempty"`
	CoverFileURL      string                `json:"cover_file_url,omitempty"`
	InnerFileURL      string                `json:"inner_file_url,omitempty"`
	BindingType       BindingType           `json:"binding_type"`
	SpineWidthMM      decimal.Decimal       `json:"spine_width_mm"`
	CurrentStep       ProductionStep        `json:"current_step"`
	Specs             CustomPrintSpecs      `json:"specs"`
	UnitCostLAK       int64                 `json:"unit_cost_lak"`
	UnitPriceLAK      int64                 `json:"unit_price_lak"`
	TotalPriceLAK     int64                 `json:"total_price_lak"`
	CostBreakdown     *InternalOrderPricing `json:"cost_breakdown,omitempty"`
	CreatedAt         time.Time             `json:"created_at"`
	UpdatedAt         time.Time             `json:"updated_at"`
}

// Order represents an authoritative print order domain entity with exact LAK precision
type Order struct {
	ID                   string           `json:"id"`
	OrderNo              string           `json:"order_no"`
	TrackingCode         string           `json:"tracking_code"`
	InternalTrackingCode string           `json:"internal_tracking_code,omitempty"`
	CourierName          string           `json:"courier_name,omitempty"`
	CourierID            string           `json:"courier_id,omitempty"`
	CustomerID           string           `json:"customer_id,omitempty"`
	CustomerName         string           `json:"customer_name"`
	CustomerPhone        string           `json:"customer_phone,omitempty"`
	CustomerEmail        string           `json:"customer_email,omitempty"`
	CustomerAddress      string           `json:"customer_address,omitempty"`
	TotalAmountLAK       int64            `json:"total_amount_lak"`
	DepositLAK           int64            `json:"deposit_lak"`
	RemainingLAK         int64            `json:"remaining_lak"`
	OverallStatus        OrderStatus      `json:"overall_status"`
	DeliveryDate         string           `json:"delivery_date,omitempty"`
	GoogleDriveLink      string           `json:"google_drive_link,omitempty"`
	ProofURL             string           `json:"proof_url,omitempty"`
	ProofApprovedAt      *time.Time       `json:"proof_approved_at,omitempty"`
	ProofRejectedAt      *time.Time       `json:"proof_rejected_at,omitempty"`
	ProofSignatureIP     string           `json:"proof_signature_ip,omitempty"`
	ProofRejectionReason string           `json:"proof_rejection_reason,omitempty"`
	IdempotencyKey       string           `json:"idempotency_key,omitempty"`
	StockDeductedAt      *time.Time       `json:"stock_deducted_at,omitempty"`
	Items                []OrderItem      `json:"items"`
	CreatedAt            time.Time        `json:"created_at"`
	UpdatedAt            time.Time        `json:"updated_at"`
}

// TimelineEntry represents a customer-facing production history checkpoint
type TimelineEntry struct {
	Status    string `json:"status"`
	Label     string `json:"label"`
	Timestamp int64  `json:"timestamp"`
}

// PublicOrderItem is the masked line item payload for public customer tracking
type PublicOrderItem struct {
	ID            string           `json:"id"`
	JobName       string           `json:"job_name"`
	ItemName      string           `json:"item_name"`
	Quantity      int              `json:"quantity"`
	PageCount     int              `json:"page_count"`
	PaperSize     string           `json:"paper_size"`
	BindingType   BindingType      `json:"binding_type"`
	CurrentStep   ProductionStep   `json:"current_step"`
	Specs         CustomPrintSpecs `json:"specs"`
	UnitPriceLAK  int64            `json:"unit_price_lak"`
	TotalPriceLAK int64            `json:"total_price_lak"`
}

// PublicOrderTrackingDTO represents the public tracking response with all internal operational costs masked
type PublicOrderTrackingDTO struct {
	OrderID                string            `json:"order_id"`
	OrderNo                string            `json:"order_no"`
	TrackingCode           string            `json:"tracking_code"`
	CustomerName           string            `json:"customer_name"`
	CustomerPhone          string            `json:"customer_phone,omitempty"`
	OverallStatus          OrderStatus       `json:"overall_status"`
	StatusText             string            `json:"status_text"`
	TotalAmountLAK         int64             `json:"total_amount_lak"`
	DepositLAK             int64             `json:"deposit_lak"`
	RemainingLAK           int64             `json:"remaining_lak"`
	Currency               string            `json:"currency"`
	CourierName            string            `json:"courier_name,omitempty"`
	ShippingTrackingNumber string            `json:"shipping_tracking_number,omitempty"`
	ProofURL               string            `json:"proof_url,omitempty"`
	ProofApprovedAt        *time.Time        `json:"proof_approved_at,omitempty"`
	ProofRejectedAt        *time.Time        `json:"proof_rejected_at,omitempty"`
	ProofRejectionReason   string            `json:"proof_rejection_reason,omitempty"`
	GoogleDriveLink        string            `json:"google_drive_link,omitempty"`
	Timeline               []TimelineEntry   `json:"timeline"`
	Items                  []PublicOrderItem `json:"items"`
	CreatedAt              time.Time         `json:"created_at"`
	UpdatedAt              time.Time         `json:"updated_at"`
}

// CustomerTrackingResponse is an alias to PublicOrderTrackingDTO for backward compatibility
type CustomerTrackingResponse = PublicOrderTrackingDTO

// MaskForCustomer converts an authoritative Order into a safe PublicOrderTrackingDTO
func (o *Order) MaskForCustomer() PublicOrderTrackingDTO {
	publicItems := make([]PublicOrderItem, len(o.Items))
	for i, item := range o.Items {
		publicItems[i] = PublicOrderItem{
			ID:            item.ID,
			JobName:       item.JobName,
			ItemName:      item.ItemName,
			Quantity:      item.Quantity,
			PageCount:     item.PageCount,
			PaperSize:     item.PaperSize,
			BindingType:   item.BindingType,
			CurrentStep:   item.CurrentStep,
			Specs:         item.Specs,
			UnitPriceLAK:  item.UnitPriceLAK,
			TotalPriceLAK: item.TotalPriceLAK,
		}
	}

	trackingCode := o.TrackingCode
	if trackingCode == "" {
		trackingCode = o.OrderNo
	}

	courierTrack := o.InternalTrackingCode

	statusText := string(o.OverallStatus)
	switch o.OverallStatus {
	case StatusPendingPayment, StatusPendingSlipCheck:
		statusText = "ລໍຖ້າກວດສອບສະລິບ / Payment Verification"
	case StatusOrderCreated, StatusPaidPrepress, StatusPrepressCheck:
		statusText = "ກວດສອບໄຟລ໌ / Preflight & CMYK Check"
	case StatusWaitingApproval:
		statusText = "ລໍຖ້າຢືນຢັນແບບພິມ / Waiting Proof Sign-off"
	case StatusProofRejected:
		statusText = "ກຳລັງແກ້ໄຂແບບ / Revision Requested"
	case StatusFileConfirmed, StatusReadyToPrint:
		statusText = "ຢືນຢັນແບບພິມແລ້ວ / Proof Approved"
	case StatusInProduction:
		statusText = "ກຳລັງດຳເນີນການພິມ / In Production (Printing)"
	case StatusPostPress, StatusFinishing:
		statusText = "ຂັ້ນຕອນຫຼັງການພິມ & QC / Finishing & QC"
	case StatusShipped, StatusReadyForDelivery:
		statusText = "ສົ່ງມອບບໍລິສັດຂົນສົ່ງ / Dispatched & In Transit"
	case StatusCompleted, StatusDelivered:
		statusText = "ສຳເລັດ / Delivered & Completed"
	case StatusCancelled:
		statusText = "ຍົກເລີກ / Cancelled"
	}

	return PublicOrderTrackingDTO{
		OrderID:                o.ID,
		OrderNo:                o.OrderNo,
		TrackingCode:           trackingCode,
		CustomerName:           o.CustomerName,
		CustomerPhone:          o.CustomerPhone,
		OverallStatus:          o.OverallStatus,
		StatusText:             statusText,
		TotalAmountLAK:         o.TotalAmountLAK,
		DepositLAK:             o.DepositLAK,
		RemainingLAK:           o.RemainingLAK,
		Currency:               "LAK",
		CourierName:            o.CourierName,
		ShippingTrackingNumber: courierTrack,
		ProofURL:               o.ProofURL,
		ProofApprovedAt:        o.ProofApprovedAt,
		ProofRejectedAt:        o.ProofRejectedAt,
		ProofRejectionReason:   o.ProofRejectionReason,
		GoogleDriveLink:        o.GoogleDriveLink,
		Timeline: []TimelineEntry{
			{
				Status:    string(o.OverallStatus),
				Label:     statusText,
				Timestamp: o.UpdatedAt.Unix(),
			},
		},
		Items:     publicItems,
		CreatedAt: o.CreatedAt,
		UpdatedAt: o.UpdatedAt,
	}
}
