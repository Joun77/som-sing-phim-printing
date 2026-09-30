package production

import (
	"time"
)

// ProductionStageAssignment represents a planned and assigned production step
type ProductionStageAssignment struct {
	ID               string                 `json:"id"`
	OrderID          string                 `json:"order_id"`
	OrderNo          string                 `json:"order_no,omitempty"`
	CustomerName     string                 `json:"customer_name,omitempty"`
	DeliveryDate     string                 `json:"delivery_date,omitempty"`
	OrderItemID      string                 `json:"order_item_id"`
	ItemName         string                 `json:"item_name,omitempty"`
	ItemSpecs        map[string]interface{} `json:"item_specs,omitempty"`
	Quantity         int                    `json:"quantity,omitempty"`
	JobTicketID      *string                `json:"job_ticket_id,omitempty"`
	Stage            string                 `json:"stage"` // e.g. INNER_PRINTED, COVER_PRINTED, COVER_LAMINATED, PAPER_TRIMMED, BOUND, READY_FOR_PICKUP, COMPLETED
	PlannedDate      string                 `json:"planned_date"` // YYYY-MM-DD
	PlannedShift     string                 `json:"planned_shift"` // morning, afternoon, full
	PlannedStartTime *time.Time             `json:"planned_start_time,omitempty"`
	PlannedEndTime   *time.Time             `json:"planned_end_time,omitempty"`
	ActualStartTime  *time.Time             `json:"actual_start_time,omitempty"`
	ActualEndTime    *time.Time             `json:"actual_end_time,omitempty"`
	AssigneeID       string                 `json:"assignee_id"`
	AssigneeName     string                 `json:"assignee_name"`
	MachineID        string                 `json:"machine_id"`
	MachineName      string                 `json:"machine_name"`
	Priority         int                    `json:"priority"` // 1 = Normal, 2 = Urgent, 3 = Rush
	SequenceOrder    int                    `json:"sequence_order"`
	Status           string                 `json:"status"` // ASSIGNED, IN_PROGRESS, PAUSED, COMPLETED, CANCELLED
	Notes            string                 `json:"notes"`
	CreatedBy        string                 `json:"created_by"`
	UpdatedBy        string                 `json:"updated_by"`
	CreatedAt        time.Time              `json:"created_at"`
	UpdatedAt        time.Time              `json:"updated_at"`
}

// CreateAssignmentRequest is the payload for manager creating a stage assignment
type CreateAssignmentRequest struct {
	OrderID          string  `json:"order_id" binding:"required"`
	OrderItemID      string  `json:"order_item_id" binding:"required"`
	JobTicketID      *string `json:"job_ticket_id"`
	Stage            string  `json:"stage" binding:"required"`
	PlannedDate      string  `json:"planned_date" binding:"required"`
	PlannedShift     string  `json:"planned_shift"`
	PlannedStartTime *string `json:"planned_start_time"`
	PlannedEndTime   *string `json:"planned_end_time"`
	AssigneeID       string  `json:"assignee_id"`
	MachineID        string  `json:"machine_id"`
	Priority         int     `json:"priority"`
	SequenceOrder    int     `json:"sequence_order"`
	Notes            string  `json:"notes"`
	Force            bool    `json:"force"`
}

// UpdateAssignmentRequest is the payload for manager modifying an assignment
type UpdateAssignmentRequest struct {
	Stage            *string `json:"stage"`
	PlannedDate      *string `json:"planned_date"`
	PlannedShift     *string `json:"planned_shift"`
	PlannedStartTime *string `json:"planned_start_time"`
	PlannedEndTime   *string `json:"planned_end_time"`
	AssigneeID       *string `json:"assignee_id"`
	MachineID        *string `json:"machine_id"`
	Priority         *int    `json:"priority"`
	SequenceOrder    *int    `json:"sequence_order"`
	Status           *string `json:"status"`
	Notes            *string `json:"notes"`
	Force            bool    `json:"force"`
}

// UpdateProgressRequest is the payload for operator or manager reporting task progress
type UpdateProgressRequest struct {
	Status        string `json:"status" binding:"required"` // IN_PROGRESS, PAUSED, COMPLETED, CANCELLED
	Notes         string `json:"notes"`
	OperatorID    string `json:"operator_id"`
	SpoilageCount int    `json:"spoilage_count"`
}

// ReadyQueueItem represents an order eligible or pending production scheduling
type ReadyQueueItem struct {
	OrderID             string           `json:"order_id"`
	OrderNo             string           `json:"order_no"`
	CustomerName        string           `json:"customer_name"`
	DeliveryDate        string           `json:"delivery_date"`
	Status              string           `json:"status"`
	DepositPaid         bool             `json:"deposit_paid"`
	DepositAmount       float64          `json:"deposit_amount"`
	TotalAmount         float64          `json:"total_amount"`
	ProofApproved       bool             `json:"proof_approved"`
	MarginApproved      bool             `json:"margin_approved"`
	IsReadyForProduction bool             `json:"is_ready_for_production"`
	BlockReason         string           `json:"block_reason,omitempty"`
	Items               []ReadyOrderItem `json:"items"`
}

// ReadyOrderItem represents an individual item in a ready/pending order
type ReadyOrderItem struct {
	ID              string                 `json:"id"`
	OrderID         string                 `json:"order_id"`
	ItemName        string                 `json:"item_name"`
	Quantity        int                    `json:"quantity"`
	PageCount       int                    `json:"page_count"`
	PaperSize       string                 `json:"paper_size"`
	BindingType     string                 `json:"binding_type"`
	CurrentStep     string                 `json:"current_step"`
	AssignedMachine string                 `json:"assigned_machine,omitempty"`
	Specs           map[string]interface{} `json:"specs,omitempty"`
}

// AssignableStaff contains non-sensitive staff profile for dispatching
type AssignableStaff struct {
	ID         string   `json:"id"`
	NameLo     string   `json:"nameLo"`
	NameEn     string   `json:"nameEn"`
	Role       string   `json:"role"`
	Department string   `json:"department"`
	Status     string   `json:"status"`
	Skills     []string `json:"skills"`
}

// ConflictInfo details overlap collisions on assignee or machine
type ConflictInfo struct {
	HasConflict        bool     `json:"has_conflict"`
	ConflictedMachine  bool     `json:"conflicted_machine"`
	ConflictedAssignee bool     `json:"conflicted_assignee"`
	Message            string   `json:"message"`
	Details            []string `json:"details"`
}
