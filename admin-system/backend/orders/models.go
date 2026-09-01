package orders

import (
	"time"
)

type OrderStatus string

const (
	StatusDraft                   OrderStatus = "DRAFT"
	StatusRequiresManagerApproval OrderStatus = "REQUIRES_MANAGER_APPROVAL"
	StatusApproved                OrderStatus = "APPROVED"
	StatusRejected                OrderStatus = "REJECTED"
	StatusWaitingDeposit          OrderStatus = "WAITING_DEPOSIT"
	StatusPendingPayment          OrderStatus = "PENDING_PAYMENT"
	StatusPrepressCheck           OrderStatus = "PREPRESS_CHECK"
	StatusWaitingApproval         OrderStatus = "WAITING_APPROVAL"
	StatusProofRejected           OrderStatus = "PROOF_REJECTED"
	StatusFileConfirmed           OrderStatus = "FILE_CONFIRMED"
	StatusReadyToPrint            OrderStatus = "READY_TO_PRINT"
	StatusInProduction            OrderStatus = "IN_PRODUCTION"
	StatusCompleted               OrderStatus = "COMPLETED"
	StatusDelivered               OrderStatus = "DELIVERED"
	StatusCancelled               OrderStatus = "CANCELLED"
)

// BindingType Enum
type BindingType string

const (
	BindingNone           BindingType = "NONE"
	BindingPerfectHotGlue BindingType = "PERFECT_HOT_GLUE"
	BindingSaddleStitch   BindingType = "SADDLE_STITCH"
	BindingWireO          BindingType = "WIRE_O"
	BindingPlasticComb    BindingType = "PLASTIC_COMB"
	BindingCalendar       BindingType = "CALENDAR"
)

// ProductionStep Enum
type ProductionStep string

const (
	StepPending        ProductionStep = "PENDING"
	StepInnerPrinted   ProductionStep = "INNER_PRINTED"
	StepCoverPrinted   ProductionStep = "COVER_PRINTED"
	StepCoverLaminated ProductionStep = "COVER_LAMINATED"
	StepPaperTrimmed   ProductionStep = "PAPER_TRIMMED"
	StepBound          ProductionStep = "BOUND"
	StepReadyForPickup ProductionStep = "READY_FOR_PICKUP"
	StepCompleted      ProductionStep = "COMPLETED"
)

type OrderItem struct {
	ID                string                 `json:"id"`
	OrderID           string                 `json:"order_id"`
	JobName           string                 `json:"job_name"`
	ItemName          string                 `json:"item_name"`
	Quantity          int                    `json:"quantity"`
	PageCount         int                    `json:"page_count"`
	PaperSize         string                 `json:"paper_size"`
	CoverPaperID      string                 `json:"cover_paper_id"`
	InnerPaperID      string                 `json:"inner_paper_id"`
	CoverFileURL      string                 `json:"cover_file_url"`
	InnerFileURL      string                 `json:"inner_file_url"`
	BindingType       BindingType            `json:"binding_type"`
	SpineWidthMM      float64                `json:"spine_width_mm"`
	CurrentStep       ProductionStep         `json:"current_step"`
	AvgCovC           float64                `json:"avg_cov_c"`
	AvgCovM           float64                `json:"avg_cov_m"`
	AvgCovY           float64                `json:"avg_cov_y"`
	AvgCovK           float64                `json:"avg_cov_k"`
	UnitCostLAK        float64                `json:"unit_cost_lak"`
	UnitPriceLAK       float64                `json:"unit_price_lak"`
	TotalPriceLAK      float64                `json:"total_price_lak"`
	UnitPriceSnapshot  float64                `json:"unit_price_snapshot"`
	CostPriceSnapshot  float64                `json:"cost_price_snapshot"`
	MachineOverheadLAK float64                `json:"machine_overhead_lak"`
	MachineID          string                 `json:"machine_id,omitempty"`
	ColorMode          string                 `json:"color_mode,omitempty"`
	Specs              map[string]interface{} `json:"specs"`
	CreatedAt         time.Time              `json:"created_at"`
	UpdatedAt         time.Time              `json:"updated_at"`
}

type Order struct {
	ID                   string      `json:"id"`
	OrderNo              string      `json:"order_no"`
	OrderNumber          string      `json:"order_number"` // Backward compatibility
	CustomerID           string      `json:"customer_id"`
	CustomerName         string      `json:"customer_name"`
	CustomerPhone        string      `json:"customer_phone"`
	CustomerEmail        string      `json:"customer_email,omitempty"`
	CustomerAddress      string      `json:"customer_address,omitempty"`
	Province             string      `json:"province,omitempty"`
	District             string      `json:"district,omitempty"`
	Village              string      `json:"village,omitempty"`
	TotalAmountLAK       float64     `json:"total_amount_lak"`
	DepositLAK           float64     `json:"deposit_lak"`
	RemainingLAK         float64     `json:"remaining_lak"`
	OverallStatus        OrderStatus `json:"overall_status"`
	Status               OrderStatus `json:"status"` // Backward compatibility
	DeliveryDate         string      `json:"delivery_date"`
	DepositAmount        float64     `json:"deposit_amount"`
	TotalPrice           float64     `json:"total_price"`
	TotalCost            float64     `json:"total_cost"`
	GoogleDriveLink      string      `json:"google_drive_link"`
	StockDeductedAt      *time.Time  `json:"stock_deducted_at,omitempty"`
	ProofURL             string      `json:"proof_url,omitempty"`
	DigitalProofURL      string      `json:"digital_proof_url,omitempty"`
	ProofVersion         int         `json:"proof_version,omitempty"`
	ProofStatus          string      `json:"proof_status,omitempty"` // NOT_SUBMITTED, PENDING_CUSTOMER, APPROVED, REJECTED
	ProofFeedback        string      `json:"proof_feedback,omitempty"`
	ProofActionAt        *time.Time  `json:"proof_action_at,omitempty"`
	PrepressNotes        string      `json:"prepress_notes,omitempty"`
	ProofApprovedAt      *time.Time  `json:"proof_approved_at,omitempty"`
	ProofRejectedAt      *time.Time  `json:"proof_rejected_at,omitempty"`
	ProofSignatureIP     string      `json:"proof_signature_ip,omitempty"`
	ProofRejectionReason string      `json:"proof_rejection_reason,omitempty"`
	Items                []OrderItem `json:"items"`
	InternalTrackingCode string      `json:"internal_tracking_code,omitempty"`
	TrackingCode         string      `json:"tracking_code,omitempty"`
	CourierName          string      `json:"courier_name,omitempty"`
	CourierBranch        string      `json:"courier_branch,omitempty"`
	ShippingFee          float64     `json:"shipping_fee,omitempty"`
	PODImageUrl          string      `json:"pod_image_url,omitempty"`
	IdempotencyKey       string      `json:"idempotency_key,omitempty"`
	CreatedAt            time.Time   `json:"created_at"`
	UpdatedAt            time.Time   `json:"updated_at"`
}

// Request payloads
type PaperSelectionSetup struct {
	CategoryID          string  `json:"category_id" binding:"required"`
	InventoryMaterialID string  `json:"inventory_material_id" binding:"required"`
	CostPerSheet        float64 `json:"cost_per_sheet"`
	GSM                 int     `json:"gsm"`
}

type ColorChannel struct {
	ChannelName string  `json:"channel_name"` // "C", "M", "Y", "K", "PANTONE..."
	DensityPct  float64 `json:"density_pct"`
	IsSpotColor bool    `json:"is_spot_color"`
}

type PrinterProcessSetup struct {
	PrinterAssetID string         `json:"printer_asset_id" binding:"required"`
	Sequence       int            `json:"sequence"`
	ColorMode      string         `json:"color_mode"` // "AVERAGE" | "SEPARATE_CHANNEL"
	AverageDensity float64        `json:"average_density_pct"`
	ColorChannels  []ColorChannel `json:"color_channels"`
}

type FinishingProcessSetup struct {
	FinishingType           string  `json:"finishing_type"`
	MachineAssetID          string  `json:"machine_asset_id"`
	EstimatedSetupTimeMins  int     `json:"estimated_setup_time_mins"`
	EstimatedRunTimeMins    int     `json:"estimated_run_time_mins"`
	UnitCost                float64 `json:"unit_cost"`
}

type OrderItemRequest struct {
	JobName            string                   `json:"job_name" binding:"required"`
	QuantityRequired   int                      `json:"quantity_required" binding:"required,gt=0"`
	UnfoldedWidthMM    float64                  `json:"unfolded_width_mm" binding:"required"`
	UnfoldedHeightMM   float64                  `json:"unfolded_height_mm" binding:"required"`
	PaperSetup         PaperSelectionSetup      `json:"paper_setup" binding:"required"`
	PrintingProcesses  []PrinterProcessSetup   `json:"printing_processes"`
	FinishingProcesses []FinishingProcessSetup `json:"finishing_processes"`
}

type CreateOrderRequest struct {
	OrderNo         string                 `json:"order_no"`
	CustomerID      string                 `json:"customer_id"`
	CustomerName    string                 `json:"customer_name" binding:"required"`
	CustomerPhone   string                 `json:"customer_phone"`
	CustomerAddress string                 `json:"customer_address"`
	CustomerEmail   string                 `json:"customer_email"`
	Province        string                 `json:"province"`
	District        string                 `json:"district"`
	Village         string                 `json:"village"`
	DepositLAK      float64                `json:"deposit_lak"`
	DeliveryDate    string                 `json:"delivery_date"`
	GoogleDriveLink string                 `json:"google_drive_link"`
	IdempotencyKey  string                 `json:"idempotency_key,omitempty"`
	Items           []CreateItemRequest    `json:"items" binding:"required,dive,required"`
}

type CreateItemRequest struct {
	JobName            string                   `json:"job_name"`
	ItemName           string                   `json:"item_name"`
	Quantity           int                      `json:"quantity" binding:"required,gt=0"`
	PageCount          int                      `json:"page_count"`
	PaperSize          string                   `json:"paper_size"`
	CoverPaperID       string                   `json:"cover_paper_id"`
	InnerPaperID       string                   `json:"inner_paper_id"`
	CoverFileURL       string                   `json:"cover_file_url"`
	InnerFileURL       string                   `json:"inner_file_url"`
	PaperSku           string                   `json:"paper_sku"`
	PaperCostPerUnit   float64                  `json:"paper_cost_per_unit"`
	PaperFormat        string                   `json:"paper_format"`
	InkCoveragePercent float64                  `json:"ink_coverage_percent"`
	InkCostPerMl       float64                  `json:"ink_cost_per_ml"`
	AvgCovC            float64                  `json:"avg_cov_c"`
	AvgCovM            float64                  `json:"avg_cov_m"`
	AvgCovY            float64                  `json:"avg_cov_y"`
	AvgCovK            float64                  `json:"avg_cov_k"`
	LaminationType     string                   `json:"lamination_type"`
	LaminationCost     float64                  `json:"lamination_cost"`
	BindingType        string                   `json:"binding_type"`
	BindingCost        float64                  `json:"binding_cost"`
	SpineWidthMM       float64                  `json:"spine_width_mm"`
	LaborCostPerHour   float64                  `json:"labor_cost_per_hour"`
	EstimatedHours     float64                  `json:"estimated_hours"`
	MarkupMargin       float64                  `json:"markup_margin"`
	UnitCostLAK        float64                  `json:"unit_cost_lak"`
	UnitPriceLAK       float64                  `json:"unit_price_lak"`
	TotalPriceLAK      float64                  `json:"total_price_lak"`
	Specs              map[string]interface{}   `json:"specs"`
	// Extended fields for multi-printer and finishing
	QuantityRequired   int                      `json:"quantity_required,omitempty"`
	UnfoldedWidthMM    float64                  `json:"unfolded_width_mm,omitempty"`
	UnfoldedHeightMM   float64                  `json:"unfolded_height_mm,omitempty"`
	PaperSetup         *PaperSelectionSetup     `json:"paper_setup,omitempty"`
	PrintingProcesses  []PrinterProcessSetup   `json:"printing_processes,omitempty"`
	FinishingProcesses []FinishingProcessSetup `json:"finishing_processes,omitempty"`
}

type DepositPaymentRequest struct {
	DepositAmount float64 `json:"deposit_amount" binding:"required,gt=0"`
}

type PrinterJobAllocation struct {
	PrinterID      string  `json:"printer_id" db:"printer_id"`
	PrinterName    string  `json:"printer_name" db:"printer_name"`
	AllocatedPages int     `json:"allocated_pages" db:"allocated_pages"`
	CostPerPage    float64 `json:"cost_per_page" db:"cost_per_page"`
	SubtotalCost   float64 `json:"subtotal_cost" db:"subtotal_cost"`
}

type QuotationCalculationRequest struct {
	CustomerID           string                  `json:"customer_id"`
	TargetQuantity       int                     `json:"target_quantity" binding:"required,gt=0"`
	TargetWidthMM        float64                 `json:"target_width_mm"`
	TargetHeightMM       float64                 `json:"target_height_mm"`
	InventoryMaterialID  string                  `json:"inventory_material_id" binding:"required"`
	PaperSpoilagePercent float64                 `json:"paper_spoilage_percent"`
	Allocations          []PrinterJobAllocation  `json:"allocations"`
	PrintingProcesses    []PrinterProcessSetup   `json:"printing_processes"`
	FinishingProcesses   []FinishingProcessSetup `json:"finishing_processes"`
	FinishingIDs         []string                `json:"finishing_ids"`
	MarkupMarginPercent  float64                 `json:"markup_margin_percent"`
	TaxRatePercent       float64                 `json:"tax_rate_percent"`
}

type QuotationCalculationResponse struct {
	PaperCost         float64 `json:"paper_cost"`
	InkCost           float64 `json:"ink_cost"`
	PlateCost         float64 `json:"plate_cost"`
	MachineDeprCost   float64 `json:"machine_depr_cost"`
	FinishingCost     float64 `json:"finishing_cost"`
	LaborSetupCost    float64 `json:"labor_setup_cost"`
	WasteSpoilageCost float64 `json:"waste_spoilage_cost"`
	NetInternalCost   float64 `json:"net_internal_cost"`
	BaseSellingPrice  float64 `json:"base_selling_price"`
	TaxAmount         float64 `json:"tax_amount"`
	TotalGrandTotal   float64 `json:"total_grand_total"`
	UnitPrice         float64 `json:"unit_price"`
}

// JobTicket represents a production job sheet routed to a specific machine/operator
type JobTicket struct {
	ID                     string     `json:"id"`
	OrderID                string     `json:"order_id"`
	OrderItemID            string     `json:"order_item_id"`
	JobNumber              string     `json:"job_number"`
	TicketNumber           string     `json:"ticket_number"`
	RoutingSteps           string     `json:"routing_steps"`
	AssignedMachine        string     `json:"assigned_machine"`
	AssignedPrinterAssetID string     `json:"assigned_printer_asset_id"`
	Status                 string     `json:"status"` // QUEUED, IN_PRODUCTION, PRINTING, FINISHING, COMPLETED, CANCELLED
	QRCodeData             string     `json:"qr_code_data"`
	Priority               int        `json:"priority"`
	EstimatedDurationMins  int        `json:"estimated_duration_mins"`
	StartedAt              *time.Time `json:"started_at,omitempty"`
	CompletedAt            *time.Time `json:"completed_at,omitempty"`
	Notes                  string     `json:"notes,omitempty"`
	CreatedAt              time.Time  `json:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at"`
}

// Digital Proof Payloads
type UploadProofRequest struct {
	ProofURL string `json:"proof_url" binding:"required"`
}

type SendProofRequest struct {
	ProofURL      string `json:"proofUrl" binding:"required"`
	PrepressNotes string `json:"prepressNotes"`
}

type ProofActionRequest struct {
	Action            string `json:"action" binding:"required"` // "APPROVE" | "REJECT"
	Feedback          string `json:"feedback"`
	CustomerSignature string `json:"customerSignature"`
}

type ApproveProofRequest struct {
	SignatureName string `json:"signature_name"`
	ClientIP      string `json:"client_ip"`
}

type RejectProofRequest struct {
	Reason string `json:"reason" binding:"required"`
}

type ProofStatusResponse struct {
	OrderID         string     `json:"order_id"`
	OrderNo         string     `json:"order_no,omitempty"`
	CustomerName    string     `json:"customer_name,omitempty"`
	ProofURL        string     `json:"proof_url"`
	DigitalProofURL string     `json:"digital_proof_url,omitempty"`
	ProofVersion    int        `json:"proof_version,omitempty"`
	ProofStatus     string     `json:"proof_status,omitempty"`
	ProofFeedback   string     `json:"proof_feedback,omitempty"`
	PrepressNotes   string     `json:"prepress_notes,omitempty"`
	ProofToken      string     `json:"proof_token,omitempty"`
	PublicProofURL  string     `json:"public_proof_url,omitempty"`
	IsApproved      bool       `json:"is_approved"`
	ApprovedAt      *time.Time `json:"approved_at,omitempty"`
	RejectedAt      *time.Time `json:"rejected_at,omitempty"`
	RejectionReason string     `json:"rejection_reason,omitempty"`
	SignatureIP     string     `json:"signature_ip,omitempty"`
}


