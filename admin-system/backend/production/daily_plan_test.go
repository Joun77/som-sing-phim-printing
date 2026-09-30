package production

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"somsing.local/backend/orders"
)

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	r.GET("/api/v1/production/daily-plan", HandleGetDailyPlan)
	r.POST("/api/v1/production/daily-plan/assignments", HandleCreateAssignment)
	r.PUT("/api/v1/production/daily-plan/assignments/:id", HandleUpdateAssignment)
	r.DELETE("/api/v1/production/daily-plan/assignments/:id", HandleDeleteAssignment)
	r.PATCH("/api/v1/production/daily-plan/assignments/:id/progress", HandleUpdateAssignmentProgress)
	r.GET("/api/v1/production/daily-plan/ready-queue", HandleGetReadyOrdersQueue)
	r.GET("/api/v1/production/daily-plan/staff", HandleGetAssignableStaff)
	r.PATCH("/api/v1/orders/items/:id/step", orders.HandleUpdateOrderItemStep)
	r.PUT("/api/v1/orders/items/:id/step", orders.HandleUpdateOrderItemStep)

	return r
}

func TestEvaluateOrderReadiness(t *testing.T) {
	// Case 1: Cancelled order must be blocked
	cancelledOrder := orders.Order{
		ID:            "ORD-001",
		Status:        orders.StatusCancelled,
		OverallStatus: orders.StatusCancelled,
		DepositAmount: 500000,
	}
	ready, reason := EvaluateOrderReadiness(cancelledOrder)
	if ready {
		t.Errorf("Expected cancelled order to NOT be ready, but got ready")
	}
	if reason == "" {
		t.Errorf("Expected clear block reason for cancelled order")
	}

	// Case 2: Unapproved low margin must be blocked
	marginOrder := orders.Order{
		ID:            "ORD-002",
		Status:        orders.StatusRequiresManagerApproval,
		OverallStatus: orders.StatusRequiresManagerApproval,
		DepositAmount: 500000,
	}
	ready, reason = EvaluateOrderReadiness(marginOrder)
	if ready {
		t.Errorf("Expected margin approval order to NOT be ready, but got ready")
	}

	// Case 3: Missing deposit must be blocked
	noDepositOrder := orders.Order{
		ID:            "ORD-003",
		Status:        orders.StatusFileConfirmed,
		OverallStatus: orders.StatusFileConfirmed,
		DepositAmount: 0,
		DepositLAK:    0,
	}
	ready, reason = EvaluateOrderReadiness(noDepositOrder)
	if ready {
		t.Errorf("Expected zero deposit order to NOT be ready, but got ready")
	}

	// Case 4: Missing proof / unconfirmed file must be blocked
	noProofOrder := orders.Order{
		ID:            "ORD-004",
		Status:        orders.StatusWaitingApproval,
		OverallStatus: orders.StatusWaitingApproval,
		DepositAmount: 500000,
	}
	ready, reason = EvaluateOrderReadiness(noProofOrder)
	if ready {
		t.Errorf("Expected unapproved proof order to NOT be ready, but got ready")
	}

	// Case 5: Fully qualified order ready for production
	now := time.Now()
	qualifiedOrder := orders.Order{
		ID:              "ORD-005",
		Status:          orders.StatusFileConfirmed,
		OverallStatus:   orders.StatusFileConfirmed,
		DepositAmount:   500000,
		ProofApprovedAt: &now,
	}
	ready, reason = EvaluateOrderReadiness(qualifiedOrder)
	if !ready {
		t.Errorf("Expected qualified order to be ready, but got blocked: %s", reason)
	}
}

func TestDisconnectedDatabaseReturnsHTTP503(t *testing.T) {
	// Ensure customDB is nil so it simulates disconnected DB
	SetCustomDB(nil)
	router := setupTestRouter()

	// 1. Daily plan fetch when disconnected returns 503
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/production/daily-plan", nil)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusServiceUnavailable {
		t.Errorf("Expected HTTP 503 Service Unavailable when DB is disconnected, got %d: %s", w.Code, w.Body.String())
	}

	// Verify error code in JSON
	var resp map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["code"] != "DB_DISCONNECTED" {
		t.Errorf("Expected code 'DB_DISCONNECTED', got: %v", resp["code"])
	}

	// 2. Ready queue fetch when disconnected returns 503
	wQueue := httptest.NewRecorder()
	reqQueue, _ := http.NewRequest("GET", "/api/v1/production/daily-plan/ready-queue", nil)
	router.ServeHTTP(wQueue, reqQueue)
	if wQueue.Code != http.StatusServiceUnavailable {
		t.Errorf("Expected HTTP 503 for ready-queue when DB disconnected, got %d", wQueue.Code)
	}

	// 3. Assignable staff fetch when disconnected returns 503
	wStaff := httptest.NewRecorder()
	reqStaff, _ := http.NewRequest("GET", "/api/v1/production/daily-plan/staff", nil)
	router.ServeHTTP(wStaff, reqStaff)
	if wStaff.Code != http.StatusServiceUnavailable {
		t.Errorf("Expected HTTP 503 for staff when DB disconnected, got %d", wStaff.Code)
	}

	// 4. Create assignment when disconnected returns 503 and does NOT fake success in memory
	createPayload := CreateAssignmentRequest{
		OrderID:     "ORD-TEST",
		OrderItemID: "ITEM-TEST",
		Stage:       "INNER_PRINTED",
		PlannedDate: "2026-09-30",
	}
	body, _ := json.Marshal(createPayload)
	wCreate := httptest.NewRecorder()
	reqCreate, _ := http.NewRequest("POST", "/api/v1/production/daily-plan/assignments", bytes.NewBuffer(body))
	reqCreate.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wCreate, reqCreate)
	if wCreate.Code != http.StatusServiceUnavailable {
		t.Errorf("Expected HTTP 503 for assignment creation when DB disconnected, got %d", wCreate.Code)
	}
}

func TestUpdateOrderItemStepAPICompatibility(t *testing.T) {
	router := setupTestRouter()

	// 1. Missing step parameter returns 400 Bad Request
	emptyPayload := map[string]interface{}{
		"notes": "No step provided",
	}
	body, _ := json.Marshal(emptyPayload)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PATCH", "/api/v1/orders/items/item-nonexistent/step", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 Bad Request for empty step payload, got %d: %s", w.Code, w.Body.String())
	}

	// 2. Calling with `step` alias instead of `current_step` via PUT method
	validStepPayload := map[string]interface{}{
		"step":          "BOUND",
		"operator_id":   "EMP-001",
		"spoilage_count": 0,
		"notes":         "Operator finished binding step",
	}
	bodyValid, _ := json.Marshal(validStepPayload)
	wPut := httptest.NewRecorder()
	reqPut, _ := http.NewRequest("PUT", "/api/v1/orders/items/item-nonexistent/step", bytes.NewBuffer(bodyValid))
	reqPut.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wPut, reqPut)
	// Should not fail with 400 Bad Request (step parsed successfully, returns 200 or 404 depending on item)
	if wPut.Code == http.StatusBadRequest {
		t.Errorf("Expected step alias to be recognized without 400 Bad Request, got %d: %s", wPut.Code, wPut.Body.String())
	}
}

func TestCheckOperatorTaskPermission(t *testing.T) {
	// Case 1: Unassigned task updated by non-manager must FAIL CLOSED
	unassignedTask := &ProductionStageAssignment{
		ID:         "TASK-001",
		AssigneeID: "",
		Status:     "ASSIGNED",
	}
	err := CheckOperatorTaskPermission(unassignedTask, "EMP-001", "production")
	if err == nil {
		t.Errorf("Expected error when non-manager attempts to update unassigned task, but got nil")
	}

	// Case 2: Non-manager updating someone else's task must FAIL CLOSED
	taskForOther := &ProductionStageAssignment{
		ID:         "TASK-002",
		AssigneeID: "EMP-999",
		Status:     "ASSIGNED",
	}
	err = CheckOperatorTaskPermission(taskForOther, "EMP-001", "production")
	if err == nil {
		t.Errorf("Expected error when non-manager attempts to update another employee's task, but got nil")
	}

	// Case 3: Empty operator identity for non-manager must FAIL CLOSED
	err = CheckOperatorTaskPermission(taskForOther, "", "production")
	if err == nil {
		t.Errorf("Expected error when operator ID is empty for non-manager, but got nil")
	}

	// Case 4: Non-manager updating their own assigned task must PASS
	taskForSelf := &ProductionStageAssignment{
		ID:         "TASK-003",
		AssigneeID: "EMP-001",
		Status:     "ASSIGNED",
	}
	err = CheckOperatorTaskPermission(taskForSelf, "EMP-001", "production")
	if err != nil {
		t.Errorf("Expected assigned operator to be permitted, got error: %v", err)
	}

	// Case 5: Manager/Admin updating unassigned task or another staff's task must PASS
	err = CheckOperatorTaskPermission(unassignedTask, "usr_admin", "admin")
	if err != nil {
		t.Errorf("Expected admin to be permitted on unassigned task, got error: %v", err)
	}
	err = CheckOperatorTaskPermission(taskForOther, "usr_manager", "manager")
	if err != nil {
		t.Errorf("Expected manager to be permitted on any task, got error: %v", err)
	}
}

func TestFilterAssignmentsForUser(t *testing.T) {
	assignments := []ProductionStageAssignment{
		{ID: "A1", PlannedDate: "2026-09-30", PlannedShift: "morning", AssigneeID: "EMP-001", Status: "ASSIGNED"},
		{ID: "A2", PlannedDate: "2026-09-30", PlannedShift: "morning", AssigneeID: "EMP-002", Status: "ASSIGNED"},
		{ID: "A3", PlannedDate: "2026-09-30", PlannedShift: "afternoon", AssigneeID: "", Status: "PENDING"},
	}

	// Case 1: Staff user without employee_id fails closed (returns UNLINKED_EMPLOYEE error)
	_, err := FilterAssignmentsForUser(assignments, "2026-09-30", "", "", "", "", "production", "")
	if err == nil {
		t.Errorf("Expected UNLINKED_EMPLOYEE error for staff without employee_id, got nil")
	}

	// Case 2: Staff user with employee_id EMP-001 only sees their own assignment (A1)
	filtered, err := FilterAssignmentsForUser(assignments, "2026-09-30", "", "", "", "", "production", "EMP-001")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if len(filtered) != 1 || filtered[0].ID != "A1" {
		t.Errorf("Expected only task A1 for EMP-001, got %d tasks", len(filtered))
	}

	// Case 3: Staff user passing someone else's assignee_id in query param is strictly ignored/overridden to own ID
	filteredTamper, err := FilterAssignmentsForUser(assignments, "2026-09-30", "", "EMP-002", "", "", "production", "EMP-001")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if len(filteredTamper) != 1 || filteredTamper[0].ID != "A1" {
		t.Errorf("Expected query tampering to be overridden to own tasks (A1), got %v", filteredTamper)
	}

	// Case 4: Manager/Admin can see all tasks
	allTasks, err := FilterAssignmentsForUser(assignments, "2026-09-30", "", "", "", "", "admin", "usr_admin")
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if len(allTasks) != 3 {
		t.Errorf("Expected manager to see all 3 tasks, got %d", len(allTasks))
	}
}

func TestEnsureOrderInProductionTxValidation(t *testing.T) {
	// 1. Nil tx must return error
	err := orders.EnsureOrderInProductionTx(nil, "ORD-TEST", false)
	if err == nil {
		t.Errorf("Expected nil tx to fail closed, got nil error")
	}
}

