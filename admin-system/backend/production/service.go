package production

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"somsing.local/backend/db"
	"somsing.local/backend/orders"
)

var (
	// ErrDatabaseDisconnected is returned when PostgreSQL is not connected
	ErrDatabaseDisconnected = errors.New("database connection is unavailable; operation cannot be executed")
	customDB                *sql.DB
)

// SetCustomDB allows injecting an isolated test database
func SetCustomDB(d *sql.DB) {
	customDB = d
}

func getDB() (*sql.DB, error) {
	if customDB != nil {
		return customDB, nil
	}
	if db.DB != nil {
		return db.DB, nil
	}
	return nil, ErrDatabaseDisconnected
}

// EvaluateOrderReadiness checks whether an order can be scheduled for production
func EvaluateOrderReadiness(o orders.Order) (isReady bool, blockReason string) {
	if o.Status == orders.StatusCancelled || o.OverallStatus == orders.StatusCancelled {
		return false, "ອໍເດີຖືກຍົກເລີກແລ້ວ (Order is cancelled)"
	}

	if o.Status == orders.StatusRequiresManagerApproval || o.OverallStatus == orders.StatusRequiresManagerApproval {
		return false, "ລໍຖ້າຜູ້ຈັດການອະນຸມັດກຳໄລຂັ້ນຕ່ຳ (Requires manager margin approval)"
	}

	if o.DepositAmount <= 0 && o.DepositLAK <= 0 {
		return false, "ຍັງບໍ່ໄດ້ຮັບເງິນມັດຈຳ (Deposit payment required before production)"
	}

	proofConfirmed := o.ProofApprovedAt != nil ||
		o.Status == orders.StatusReadyToPrint ||
		o.Status == orders.StatusFileConfirmed ||
		o.OverallStatus == orders.StatusReadyToPrint ||
		o.OverallStatus == orders.StatusFileConfirmed ||
		o.Status == orders.StatusInProduction ||
		o.OverallStatus == orders.StatusInProduction

	if !proofConfirmed {
		return false, "ໄຟລ໌/Proof ຍັງບໍ່ໄດ້ຮັບການຢືນຢັນ (Artwork proof must be confirmed)"
	}

	return true, ""
}

// CheckAssignmentConflict checks if machine or assignee has collision on the given date/time/shift in PostgreSQL
func CheckAssignmentConflict(
	plannedDate string,
	shift string,
	start *time.Time,
	end *time.Time,
	machineID string,
	assigneeID string,
	excludeID string,
) (ConflictInfo, error) {
	conflict := ConflictInfo{
		HasConflict: false,
		Details:     []string{},
	}

	database, err := getDB()
	if err != nil {
		return conflict, err
	}

	query := `
		SELECT psa.id, psa.order_id, COALESCE(o.order_no, o.order_number, ''), psa.stage,
		       psa.planned_date::text, psa.planned_shift, psa.planned_start_time, psa.planned_end_time,
		       COALESCE(psa.assignee_id, ''), COALESCE(psa.assignee_name, ''),
		       COALESCE(psa.machine_id, ''), COALESCE(psa.machine_name, '')
		FROM production_stage_assignments psa
		LEFT JOIN orders o ON o.id::text = psa.order_id
		WHERE psa.planned_date = $1 
		  AND psa.status NOT IN ('CANCELLED', 'COMPLETED')
		  AND psa.id != $2
	`
	rows, err := database.Query(query, plannedDate, excludeID)
	if err != nil {
		return conflict, fmt.Errorf("failed to query schedule conflicts: %w", err)
	}
	defer rows.Close()

	shiftLower := strings.ToLower(strings.TrimSpace(shift))
	if shiftLower == "" {
		shiftLower = "morning"
	}

	for rows.Next() {
		var a ProductionStageAssignment
		err := rows.Scan(
			&a.ID, &a.OrderID, &a.OrderNo, &a.Stage,
			&a.PlannedDate, &a.PlannedShift, &a.PlannedStartTime, &a.PlannedEndTime,
			&a.AssigneeID, &a.AssigneeName, &a.MachineID, &a.MachineName,
		)
		if err != nil {
			continue
		}

		isTimeOverlap := false
		if start != nil && end != nil && a.PlannedStartTime != nil && a.PlannedEndTime != nil {
			if start.Before(*a.PlannedEndTime) && end.After(*a.PlannedStartTime) {
				isTimeOverlap = true
			}
		} else {
			aShift := strings.ToLower(strings.TrimSpace(a.PlannedShift))
			if aShift == "" {
				aShift = "morning"
			}
			if shiftLower == "full" || aShift == "full" || shiftLower == aShift {
				isTimeOverlap = true
			}
		}

		if isTimeOverlap {
			if machineID != "" && a.MachineID != "" && strings.EqualFold(a.MachineID, machineID) {
				conflict.HasConflict = true
				conflict.ConflictedMachine = true
				detail := fmt.Sprintf("ເຄື່ອງຈັກ '%s' ມີຄິວງານອໍເດີ #%s (ຂັ້ນຕອນ: %s) ໃນຊ່ວງເວລານີ້ແລ້ວ", a.MachineName, a.OrderNo, a.Stage)
				conflict.Details = append(conflict.Details, detail)
			}
			if assigneeID != "" && a.AssigneeID != "" && strings.EqualFold(a.AssigneeID, assigneeID) {
				conflict.HasConflict = true
				conflict.ConflictedAssignee = true
				detail := fmt.Sprintf("ພະນັກງານ '%s' ຖືກມອບໝາຍວຽກອໍເດີ #%s (ຂັ້ນຕອນ: %s) ໃນຊ່ວງເວລານີ້ແລ້ວ", a.AssigneeName, a.OrderNo, a.Stage)
				conflict.Details = append(conflict.Details, detail)
			}
		}
	}

	if conflict.HasConflict {
		conflict.Message = "ພົບການມອບໝາຍວຽກຊ້ອນກັນ (Schedule collision detected)"
	}

	return conflict, nil
}

// CreateAssignment inserts a new production stage assignment directly into PostgreSQL
func CreateAssignment(req CreateAssignmentRequest, createdBy string) (*ProductionStageAssignment, *ConflictInfo, error) {
	database, err := getDB()
	if err != nil {
		return nil, nil, err
	}

	// 1. Verify parent order & order item from database
	var order orders.Order
	var depositAmount, depositLAK float64
	var status, overallStatus string
	var proofApprovedAt, stockDeductedAt *time.Time

	orderQuery := `
		SELECT id, COALESCE(order_no, order_number, ''), customer_name, COALESCE(delivery_date, ''),
		       status, COALESCE(overall_status, status::text), COALESCE(deposit_amount, 0), COALESCE(deposit_lak, 0),
		       proof_approved_at, stock_deducted_at
		FROM orders
		WHERE id::text = $1 OR order_no = $1 OR order_number = $1
		LIMIT 1
	`
	row := database.QueryRow(orderQuery, req.OrderID)
	err = row.Scan(
		&order.ID, &order.OrderNo, &order.CustomerName, &order.DeliveryDate,
		&status, &overallStatus, &depositAmount, &depositLAK,
		&proofApprovedAt, &stockDeductedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil, fmt.Errorf("order %s not found in database", req.OrderID)
		}
		return nil, nil, fmt.Errorf("failed to query order: %w", err)
	}

	order.Status = orders.OrderStatus(status)
	order.OverallStatus = orders.OrderStatus(overallStatus)
	order.DepositAmount = depositAmount
	order.DepositLAK = depositLAK
	order.ProofApprovedAt = proofApprovedAt
	order.StockDeductedAt = stockDeductedAt

	ready, blockReason := EvaluateOrderReadiness(order)
	if !ready {
		return nil, nil, fmt.Errorf("order cannot be scheduled: %s", blockReason)
	}

	// Verify order item
	var itemID, itemName string
	var quantity int
	itemQuery := `
		SELECT id, COALESCE(item_name, job_name, ''), quantity
		FROM order_items
		WHERE id::text = $1 AND order_id::text = $2
		LIMIT 1
	`
	itemRow := database.QueryRow(itemQuery, req.OrderItemID, order.ID)
	err = itemRow.Scan(&itemID, &itemName, &quantity)
	if err != nil {
		return nil, nil, fmt.Errorf("order item %s not found for order %s: %w", req.OrderItemID, order.ID, err)
	}

	// 2. Validate Assignee (if provided)
	assigneeName := ""
	if req.AssigneeID != "" {
		var empStatus, empNameLo, empNameEn string
		empQuery := `SELECT name_lo, name_en, status FROM employees WHERE id = $1`
		err = database.QueryRow(empQuery, req.AssigneeID).Scan(&empNameLo, &empNameEn, &empStatus)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return nil, nil, fmt.Errorf("ພະນັກງານລະຫັດ %s ບໍ່ພົບໃນລະບົບ (Employee not found)", req.AssigneeID)
			}
			return nil, nil, fmt.Errorf("failed to query employee: %w", err)
		}
		if !strings.EqualFold(empStatus, "ACTIVE") {
			return nil, nil, fmt.Errorf("ພະນັກງານ '%s' ບໍ່ພ້ອມໃຊ້ງານ (Status: %s)", empNameLo, empStatus)
		}
		assigneeName = empNameLo
		if assigneeName == "" {
			assigneeName = empNameEn
		}
	}

	// 3. Validate Machine (if provided)
	machineName := ""
	if req.MachineID != "" {
		var brand, model string
		machQuery := `SELECT brand, model FROM printers WHERE asset_id = $1 OR serial_number = $1 LIMIT 1`
		err = database.QueryRow(machQuery, req.MachineID).Scan(&brand, &model)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return nil, nil, fmt.Errorf("ບໍ່ພົບເຄື່ອງຈັກລະຫັດ %s ໃນລະບົບ (Machine not found)", req.MachineID)
			}
			return nil, nil, fmt.Errorf("failed to query machine: %w", err)
		}
		machineName = fmt.Sprintf("%s %s", brand, model)
	}

	// 4. Parse timestamps
	var startTime, endTime *time.Time
	if req.PlannedStartTime != nil && *req.PlannedStartTime != "" {
		if t, err := time.Parse(time.RFC3339, *req.PlannedStartTime); err == nil {
			startTime = &t
		}
	}
	if req.PlannedEndTime != nil && *req.PlannedEndTime != "" {
		if t, err := time.Parse(time.RFC3339, *req.PlannedEndTime); err == nil {
			endTime = &t
		}
	}

	// 5. Check collision
	shift := req.PlannedShift
	if shift == "" {
		shift = "morning"
	}
	conflict, err := CheckAssignmentConflict(req.PlannedDate, shift, startTime, endTime, req.MachineID, req.AssigneeID, "")
	if err != nil {
		return nil, nil, err
	}
	if conflict.HasConflict && !req.Force {
		return nil, &conflict, fmt.Errorf("conflict: %s", conflict.Message)
	}

	// 6. Build Assignment record and insert into PostgreSQL
	now := time.Now()
	id := fmt.Sprintf("PSA-%d", now.UnixNano())
	priority := req.Priority
	if priority <= 0 {
		priority = 1
	}
	seq := req.SequenceOrder
	if seq <= 0 {
		seq = 1
	}

	assignment := ProductionStageAssignment{
		ID:               id,
		OrderID:          order.ID,
		OrderNo:          order.OrderNo,
		CustomerName:     order.CustomerName,
		DeliveryDate:     order.DeliveryDate,
		OrderItemID:      itemID,
		ItemName:         itemName,
		Quantity:         quantity,
		JobTicketID:      req.JobTicketID,
		Stage:            req.Stage,
		PlannedDate:      req.PlannedDate,
		PlannedShift:     shift,
		PlannedStartTime: startTime,
		PlannedEndTime:   endTime,
		AssigneeID:       req.AssigneeID,
		AssigneeName:     assigneeName,
		MachineID:        req.MachineID,
		MachineName:      machineName,
		Priority:         priority,
		SequenceOrder:    seq,
		Status:           "ASSIGNED",
		Notes:            req.Notes,
		CreatedBy:        createdBy,
		UpdatedBy:        createdBy,
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	insertQuery := `
		INSERT INTO production_stage_assignments (
			id, order_id, order_item_id, job_ticket_id, stage, planned_date, planned_shift,
			planned_start_time, planned_end_time, assignee_id, assignee_name, machine_id, machine_name,
			priority, sequence_order, status, notes, created_by, updated_by, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			$8, $9, $10, $11, $12, $13,
			$14, $15, $16, $17, $18, $19, $20, $21
		)
	`
	_, err = database.Exec(
		insertQuery,
		assignment.ID, assignment.OrderID, assignment.OrderItemID, assignment.JobTicketID, assignment.Stage, assignment.PlannedDate, assignment.PlannedShift,
		assignment.PlannedStartTime, assignment.PlannedEndTime, assignment.AssigneeID, assignment.AssigneeName, assignment.MachineID, assignment.MachineName,
		assignment.Priority, assignment.SequenceOrder, assignment.Status, assignment.Notes, assignment.CreatedBy, assignment.UpdatedBy, assignment.CreatedAt, assignment.UpdatedAt,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to persist assignment to PostgreSQL: %w", err)
	}

	return &assignment, nil, nil
}

// UpdateAssignment updates an existing stage assignment in PostgreSQL
func UpdateAssignment(id string, req UpdateAssignmentRequest, updatedBy string) (*ProductionStageAssignment, *ConflictInfo, error) {
	database, err := getDB()
	if err != nil {
		return nil, nil, err
	}

	assignment, err := GetAssignmentByID(id)
	if err != nil {
		return nil, nil, err
	}

	if req.Stage != nil {
		assignment.Stage = *req.Stage
	}
	if req.PlannedDate != nil {
		assignment.PlannedDate = *req.PlannedDate
	}
	if req.PlannedShift != nil {
		assignment.PlannedShift = *req.PlannedShift
	}
	if req.Priority != nil {
		assignment.Priority = *req.Priority
	}
	if req.SequenceOrder != nil {
		assignment.SequenceOrder = *req.SequenceOrder
	}
	if req.Status != nil {
		assignment.Status = *req.Status
	}
	if req.Notes != nil {
		assignment.Notes = *req.Notes
	}

	if req.AssigneeID != nil && *req.AssigneeID != assignment.AssigneeID {
		assignment.AssigneeID = *req.AssigneeID
		if assignment.AssigneeID != "" {
			var empStatus, empNameLo, empNameEn string
			empQuery := `SELECT name_lo, name_en, status FROM employees WHERE id = $1`
			err = database.QueryRow(empQuery, assignment.AssigneeID).Scan(&empNameLo, &empNameEn, &empStatus)
			if err != nil {
				if errors.Is(err, sql.ErrNoRows) {
					return nil, nil, fmt.Errorf("ພະນັກງານລະຫັດ %s ບໍ່ພົບໃນລະບົບ", assignment.AssigneeID)
				}
				return nil, nil, fmt.Errorf("failed to query employee: %w", err)
			}
			if !strings.EqualFold(empStatus, "ACTIVE") {
				return nil, nil, fmt.Errorf("ພະນັກງານ '%s' ບໍ່ພ້ອມໃຊ້ງານ (Status: %s)", empNameLo, empStatus)
			}
			assignment.AssigneeName = empNameLo
			if assignment.AssigneeName == "" {
				assignment.AssigneeName = empNameEn
			}
		} else {
			assignment.AssigneeName = ""
		}
	}

	if req.MachineID != nil && *req.MachineID != assignment.MachineID {
		assignment.MachineID = *req.MachineID
		if assignment.MachineID != "" {
			var brand, model string
			machQuery := `SELECT brand, model FROM printers WHERE asset_id = $1 OR serial_number = $1 LIMIT 1`
			err = database.QueryRow(machQuery, assignment.MachineID).Scan(&brand, &model)
			if err != nil {
				if errors.Is(err, sql.ErrNoRows) {
					return nil, nil, fmt.Errorf("ບໍ່ພົບເຄື່ອງຈັກລະຫັດ %s ໃນລະບົບ", assignment.MachineID)
				}
				return nil, nil, fmt.Errorf("failed to query machine: %w", err)
			}
			assignment.MachineName = fmt.Sprintf("%s %s", brand, model)
		} else {
			assignment.MachineName = ""
		}
	}

	if req.PlannedStartTime != nil {
		if *req.PlannedStartTime != "" {
			if t, err := time.Parse(time.RFC3339, *req.PlannedStartTime); err == nil {
				assignment.PlannedStartTime = &t
			}
		} else {
			assignment.PlannedStartTime = nil
		}
	}
	if req.PlannedEndTime != nil {
		if *req.PlannedEndTime != "" {
			if t, err := time.Parse(time.RFC3339, *req.PlannedEndTime); err == nil {
				assignment.PlannedEndTime = &t
			}
		} else {
			assignment.PlannedEndTime = nil
		}
	}

	// Collision check
	conflict, err := CheckAssignmentConflict(
		assignment.PlannedDate,
		assignment.PlannedShift,
		assignment.PlannedStartTime,
		assignment.PlannedEndTime,
		assignment.MachineID,
		assignment.AssigneeID,
		assignment.ID,
	)
	if err != nil {
		return nil, nil, err
	}
	if conflict.HasConflict && !req.Force {
		return nil, &conflict, fmt.Errorf("conflict: %s", conflict.Message)
	}

	assignment.UpdatedBy = updatedBy
	assignment.UpdatedAt = time.Now()

	updateQuery := `
		UPDATE production_stage_assignments
		SET stage = $1, planned_date = $2, planned_shift = $3, planned_start_time = $4, planned_end_time = $5,
		    assignee_id = $6, assignee_name = $7, machine_id = $8, machine_name = $9, priority = $10,
		    sequence_order = $11, status = $12, notes = $13, updated_by = $14, updated_at = $15
		WHERE id = $16
	`
	res, err := database.Exec(
		updateQuery,
		assignment.Stage, assignment.PlannedDate, assignment.PlannedShift, assignment.PlannedStartTime, assignment.PlannedEndTime,
		assignment.AssigneeID, assignment.AssigneeName, assignment.MachineID, assignment.MachineName, assignment.Priority,
		assignment.SequenceOrder, assignment.Status, assignment.Notes, assignment.UpdatedBy, assignment.UpdatedAt,
		assignment.ID,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to update assignment in PostgreSQL: %w", err)
	}
	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return nil, nil, fmt.Errorf("assignment %s not found in database", id)
	}

	return assignment, nil, nil
}

// CheckOperatorTaskPermission enforces that only assigned staff or managers can update an assignment (Fail-Closed)
func CheckOperatorTaskPermission(assignment *ProductionStageAssignment, operatorID string, operatorRole string) error {
	if assignment == nil {
		return fmt.Errorf("assignment is nil")
	}

	isManagerOrAdmin := strings.EqualFold(operatorRole, "admin") ||
		strings.EqualFold(operatorRole, "manager") ||
		strings.EqualFold(operatorRole, "owner") ||
		strings.EqualFold(operatorRole, "super_admin")

	if isManagerOrAdmin {
		return nil
	}

	if strings.TrimSpace(operatorID) == "" {
		return fmt.Errorf("ທ່ານບໍ່ມີສິດອັບເດດງານ (Unauthorized: missing verified employee identity)")
	}
	if strings.TrimSpace(assignment.AssigneeID) == "" {
		return fmt.Errorf("ທ່ານບໍ່ມີສິດອັບເດດງານທີ່ຍັງບໍ່ໄດ້ມອບໝາຍໃຫ້ທ່ານ (Task is unassigned; only managers can assign or start unassigned tasks)")
	}
	if !strings.EqualFold(assignment.AssigneeID, operatorID) {
		return fmt.Errorf("ທ່ານບໍ່ມີສິດອັບເດດງານທີ່ມອບໝາຍໃຫ້ພະນັກງານອື່ນ (Only assigned operator or managers can update this task)")
	}
	return nil
}

// FilterAssignmentsForUser applies date, shift, status, and role-based staff isolation (Fail-Closed)
func FilterAssignmentsForUser(assignments []ProductionStageAssignment, targetDate, shiftParam, assigneeParam, machineParam, statusParam, userRole, authenticatedEmployeeID string) ([]ProductionStageAssignment, error) {
	isManagerOrAdmin := strings.EqualFold(userRole, "admin") ||
		strings.EqualFold(userRole, "manager") ||
		strings.EqualFold(userRole, "owner") ||
		strings.EqualFold(userRole, "super_admin")

	effectiveAssignee := assigneeParam
	if !isManagerOrAdmin {
		if strings.TrimSpace(authenticatedEmployeeID) == "" {
			return nil, fmt.Errorf("UNLINKED_EMPLOYEE: user is not linked to an active employee record")
		}
		// Non-managers cannot view other staff's tasks or all tasks; strictly force assignee to their own ID
		effectiveAssignee = authenticatedEmployeeID
	}

	var filtered []ProductionStageAssignment
	for _, a := range assignments {
		if targetDate != "" && targetDate != "all" && a.PlannedDate != targetDate {
			continue
		}
		if shiftParam != "" && !strings.EqualFold(a.PlannedShift, shiftParam) {
			continue
		}
		if !isManagerOrAdmin {
			if !strings.EqualFold(a.AssigneeID, effectiveAssignee) {
				continue
			}
		} else {
			if effectiveAssignee != "" && !strings.EqualFold(a.AssigneeID, effectiveAssignee) && !strings.EqualFold(a.AssigneeName, effectiveAssignee) {
				continue
			}
		}
		if machineParam != "" && !strings.EqualFold(a.MachineID, machineParam) {
			continue
		}
		if statusParam != "" && !strings.EqualFold(a.Status, statusParam) {
			continue
		}
		filtered = append(filtered, a)
	}
	return filtered, nil
}

// UpdateAssignmentProgress updates task status, transitions order to IN_PRODUCTION with stock deduction, and updates order items in a PostgreSQL transaction
func UpdateAssignmentProgress(id string, req UpdateProgressRequest, operatorID string, operatorRole string) (*ProductionStageAssignment, error) {
	database, err := getDB()
	if err != nil {
		return nil, err
	}

	assignment, err := GetAssignmentByID(id)
	if err != nil {
		return nil, err
	}

	// RBAC verification: if user is not manager/admin/owner, they must be the assigned staff (Fail-Closed)
	if err := CheckOperatorTaskPermission(assignment, operatorID, operatorRole); err != nil {
		return nil, err
	}

	now := time.Now()
	assignment.Status = req.Status
	assignment.UpdatedBy = operatorID
	assignment.UpdatedAt = now
	if req.Notes != "" {
		if assignment.Notes != "" {
			assignment.Notes += "\n" + req.Notes
		} else {
			assignment.Notes = req.Notes
		}
	}

	tx, err := database.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to start database transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if req.Status == "IN_PROGRESS" {
		if assignment.ActualStartTime == nil {
			assignment.ActualStartTime = &now
		}

		// POINT OF STOCK DEDUCTION:
		// Transition parent order to IN_PRODUCTION with FIFO stock deduction inside this atomic transaction
		if err := orders.EnsureOrderInProductionTx(tx, assignment.OrderID, false); err != nil {
			return nil, fmt.Errorf("cannot start assignment: failed to transition order to IN_PRODUCTION with stock deduction: %w", err)
		}

		// Update order_items current_step
		_, err = tx.Exec(`UPDATE order_items SET current_step = $1, updated_at = NOW() WHERE id::text = $2`, assignment.Stage, assignment.OrderItemID)
		if err != nil {
			return nil, fmt.Errorf("failed to update order_items current_step: %w", err)
		}

	} else if req.Status == "COMPLETED" {
		assignment.ActualEndTime = &now

		// Update order_items current_step
		_, err = tx.Exec(`UPDATE order_items SET current_step = $1, updated_at = NOW() WHERE id::text = $2`, assignment.Stage, assignment.OrderItemID)
		if err != nil {
			return nil, fmt.Errorf("failed to update order_items current_step: %w", err)
		}

		// Log Spoilage if reported (persisted in spoilage_logs according to admin-architecture-guard)
		if req.SpoilageCount > 0 {
			spoilageID := fmt.Sprintf("SPL-%s-%d", assignment.ID, time.Now().UnixNano())
			reason := fmt.Sprintf("Daily Plan stage %s actual spoilage: %s", assignment.Stage, req.Notes)
			spoilageQuery := `
				INSERT INTO spoilage_logs (id, order_id, machine_id, spoilage_qty, unit, reason, created_at)
				VALUES ($1, $2, $3, $4, 'Sheet', $5, NOW())
			`
			_, _ = tx.Exec(spoilageQuery, spoilageID, assignment.OrderID, assignment.MachineID, float64(req.SpoilageCount), reason)
		}
	}

	// Update assignment record
	query := `
		UPDATE production_stage_assignments
		SET status = $1, actual_start_time = $2, actual_end_time = $3, notes = $4, updated_by = $5, updated_at = $6
		WHERE id = $7
	`
	_, err = tx.Exec(query, assignment.Status, assignment.ActualStartTime, assignment.ActualEndTime, assignment.Notes, assignment.UpdatedBy, assignment.UpdatedAt, assignment.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to update assignment progress: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return assignment, nil
}

// DeleteAssignment removes an assignment from PostgreSQL
func DeleteAssignment(id string) error {
	database, err := getDB()
	if err != nil {
		return err
	}
	res, err := database.Exec(`DELETE FROM production_stage_assignments WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete assignment from PostgreSQL: %w", err)
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("assignment %s not found in database", id)
	}
	return nil
}

// GetAssignmentByID queries a single assignment from PostgreSQL
func GetAssignmentByID(id string) (*ProductionStageAssignment, error) {
	database, err := getDB()
	if err != nil {
		return nil, err
	}

	query := `
		SELECT psa.id, psa.order_id, COALESCE(o.order_no, o.order_number, ''), COALESCE(o.customer_name, ''), COALESCE(o.delivery_date, ''),
		       psa.order_item_id, COALESCE(oi.item_name, oi.job_name, ''), COALESCE(oi.quantity, 0),
		       psa.job_ticket_id, psa.stage, psa.planned_date::text, psa.planned_shift,
		       psa.planned_start_time, psa.planned_end_time, psa.actual_start_time, psa.actual_end_time,
		       COALESCE(psa.assignee_id, ''), COALESCE(psa.assignee_name, ''), COALESCE(psa.machine_id, ''), COALESCE(psa.machine_name, ''),
		       psa.priority, psa.sequence_order, psa.status, COALESCE(psa.notes, ''), COALESCE(psa.created_by, ''), COALESCE(psa.updated_by, ''),
		       psa.created_at, psa.updated_at
		FROM production_stage_assignments psa
		LEFT JOIN orders o ON o.id::text = psa.order_id
		LEFT JOIN order_items oi ON oi.id::text = psa.order_item_id
		WHERE psa.id = $1
	`
	var item ProductionStageAssignment
	row := database.QueryRow(query, id)
	err = row.Scan(
		&item.ID, &item.OrderID, &item.OrderNo, &item.CustomerName, &item.DeliveryDate,
		&item.OrderItemID, &item.ItemName, &item.Quantity,
		&item.JobTicketID, &item.Stage, &item.PlannedDate, &item.PlannedShift,
		&item.PlannedStartTime, &item.PlannedEndTime, &item.ActualStartTime, &item.ActualEndTime,
		&item.AssigneeID, &item.AssigneeName, &item.MachineID, &item.MachineName,
		&item.Priority, &item.SequenceOrder, &item.Status, &item.Notes, &item.CreatedBy, &item.UpdatedBy,
		&item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("assignment %s not found in database", id)
		}
		return nil, fmt.Errorf("failed to query assignment: %w", err)
	}

	return &item, nil
}

// GetAllAssignments returns all assignments directly from PostgreSQL
func GetAllAssignments() ([]ProductionStageAssignment, error) {
	database, err := getDB()
	if err != nil {
		return nil, err
	}

	query := `
		SELECT psa.id, psa.order_id, COALESCE(o.order_no, o.order_number, ''), COALESCE(o.customer_name, ''), COALESCE(o.delivery_date, ''),
		       psa.order_item_id, COALESCE(oi.item_name, oi.job_name, ''), COALESCE(oi.quantity, 0),
		       psa.job_ticket_id, psa.stage, psa.planned_date::text, psa.planned_shift,
		       psa.planned_start_time, psa.planned_end_time, psa.actual_start_time, psa.actual_end_time,
		       COALESCE(psa.assignee_id, ''), COALESCE(psa.assignee_name, ''), COALESCE(psa.machine_id, ''), COALESCE(psa.machine_name, ''),
		       psa.priority, psa.sequence_order, psa.status, COALESCE(psa.notes, ''), COALESCE(psa.created_by, ''), COALESCE(psa.updated_by, ''),
		       psa.created_at, psa.updated_at
		FROM production_stage_assignments psa
		LEFT JOIN orders o ON o.id::text = psa.order_id
		LEFT JOIN order_items oi ON oi.id::text = psa.order_item_id
		ORDER BY psa.planned_date ASC, psa.sequence_order ASC, psa.priority DESC
	`
	rows, err := database.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query assignments: %w", err)
	}
	defer rows.Close()

	var list []ProductionStageAssignment
	for rows.Next() {
		var item ProductionStageAssignment
		err := rows.Scan(
			&item.ID, &item.OrderID, &item.OrderNo, &item.CustomerName, &item.DeliveryDate,
			&item.OrderItemID, &item.ItemName, &item.Quantity,
			&item.JobTicketID, &item.Stage, &item.PlannedDate, &item.PlannedShift,
			&item.PlannedStartTime, &item.PlannedEndTime, &item.ActualStartTime, &item.ActualEndTime,
			&item.AssigneeID, &item.AssigneeName, &item.MachineID, &item.MachineName,
			&item.Priority, &item.SequenceOrder, &item.Status, &item.Notes, &item.CreatedBy, &item.UpdatedBy,
			&item.CreatedAt, &item.UpdatedAt,
		)
		if err == nil {
			list = append(list, item)
		}
	}

	return list, nil
}

// GetReadyOrdersQueue returns all orders analyzed for production readiness directly from PostgreSQL
func GetReadyOrdersQueue() ([]ReadyQueueItem, error) {
	database, err := getDB()
	if err != nil {
		return nil, err
	}

	orderQuery := `
		SELECT id, COALESCE(order_no, order_number, ''), customer_name, COALESCE(delivery_date, ''),
		       status, COALESCE(overall_status, status::text), COALESCE(deposit_amount, 0), COALESCE(deposit_lak, 0),
		       COALESCE(total_price, 0), COALESCE(total_amount_lak, 0),
		       proof_approved_at, stock_deducted_at
		FROM orders
		ORDER BY created_at DESC
	`
	rows, err := database.Query(orderQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to query orders: %w", err)
	}
	defer rows.Close()

	var queue []ReadyQueueItem
	for rows.Next() {
		var o orders.Order
		var status, overallStatus string
		var depositAmount, depositLAK, totalPrice, totalAmountLAK float64
		var proofApprovedAt, stockDeductedAt *time.Time

		err := rows.Scan(
			&o.ID, &o.OrderNo, &o.CustomerName, &o.DeliveryDate,
			&status, &overallStatus, &depositAmount, &depositLAK,
			&totalPrice, &totalAmountLAK,
			&proofApprovedAt, &stockDeductedAt,
		)
		if err != nil {
			continue
		}

		o.Status = orders.OrderStatus(status)
		o.OverallStatus = orders.OrderStatus(overallStatus)
		o.DepositAmount = depositAmount
		o.DepositLAK = depositLAK
		o.TotalPrice = totalPrice
		o.TotalAmountLAK = totalAmountLAK
		o.ProofApprovedAt = proofApprovedAt
		o.StockDeductedAt = stockDeductedAt

		isReady, blockReason := EvaluateOrderReadiness(o)

		// Fetch items for this order
		var items []ReadyOrderItem
		itemQuery := `
			SELECT id, order_id, COALESCE(item_name, job_name, ''), quantity, COALESCE(page_count, 1), COALESCE(paper_size, 'A5'), COALESCE(binding_type, 'NONE'), COALESCE(current_step, 'PENDING')
			FROM order_items
			WHERE order_id::text = $1
		`
		itemRows, itemErr := database.Query(itemQuery, o.ID)
		if itemErr == nil {
			for itemRows.Next() {
				var it ReadyOrderItem
				if err := itemRows.Scan(&it.ID, &it.OrderID, &it.ItemName, &it.Quantity, &it.PageCount, &it.PaperSize, &it.BindingType, &it.CurrentStep); err == nil {
					items = append(items, it)
				}
			}
			itemRows.Close()
		}

		proofApproved := o.ProofApprovedAt != nil ||
			o.Status == orders.StatusReadyToPrint ||
			o.Status == orders.StatusFileConfirmed ||
			o.OverallStatus == orders.StatusReadyToPrint ||
			o.OverallStatus == orders.StatusFileConfirmed

		depositAmt := o.DepositAmount
		if depositAmt <= 0 {
			depositAmt = o.DepositLAK
		}

		totalAmt := o.TotalPrice
		if totalAmt <= 0 {
			totalAmt = o.TotalAmountLAK
		}

		marginApproved := o.Status != orders.StatusRequiresManagerApproval && o.OverallStatus != orders.StatusRequiresManagerApproval

		queue = append(queue, ReadyQueueItem{
			OrderID:              o.ID,
			OrderNo:              o.OrderNo,
			CustomerName:         o.CustomerName,
			DeliveryDate:         o.DeliveryDate,
			Status:               string(o.Status),
			DepositPaid:          depositAmt > 0,
			DepositAmount:        depositAmt,
			TotalAmount:          totalAmt,
			ProofApproved:        proofApproved,
			MarginApproved:       marginApproved,
			IsReadyForProduction: isReady,
			BlockReason:          blockReason,
			Items:                items,
		})
	}

	return queue, nil
}

// GetAssignableStaffList returns list of active employees directly from PostgreSQL omitting sensitive fields
func GetAssignableStaffList() ([]AssignableStaff, error) {
	database, err := getDB()
	if err != nil {
		return nil, err
	}

	query := `
		SELECT id, name_lo, name_en, role, department, status
		FROM employees
		WHERE status = 'ACTIVE'
		ORDER BY name_lo ASC
	`
	rows, err := database.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query active employees: %w", err)
	}
	defer rows.Close()

	var list []AssignableStaff
	for rows.Next() {
		var emp AssignableStaff
		if err := rows.Scan(&emp.ID, &emp.NameLo, &emp.NameEn, &emp.Role, &emp.Department, &emp.Status); err == nil {
			list = append(list, emp)
		}
	}
	return list, nil
}
