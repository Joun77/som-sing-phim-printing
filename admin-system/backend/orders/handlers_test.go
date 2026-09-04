package orders

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/gin-gonic/gin"
)

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.GET("/api/v1/orders", HandleGetOrders)
	r.POST("/api/v1/orders", HandleCreateOrder)
	r.POST("/api/v1/orders/:id/deposit", HandleRecordDeposit)
	r.POST("/api/v1/orders/:id/send-proof", HandleSendProof)
	r.POST("/api/v1/orders/:id/proof-action", HandleProofAction)
	r.POST("/api/v1/orders/:id/proof", HandleUploadDigitalProof)
	r.POST("/api/v1/orders/:id/proof/approve", HandleApproveDigitalProof)
	r.POST("/api/v1/orders/:id/proof/reject", HandleRejectDigitalProof)
	r.PATCH("/api/v1/orders/items/:id/step", HandleUpdateOrderItemStep)
	r.PATCH("/api/v1/orders/:id/status", HandleUpdateOrderStatus)
	r.POST("/api/v1/orders/:id/reverse-stock", HandleReverseOrderStock)
	r.GET("/api/v1/orders/track", HandleTrackOrderQuery)
	r.GET("/api/v1/orders/track/:order_no", HandleGetOrderByOrderNo)
	r.GET("/api/v1/orders/:id/job-ticket", HandleGenerateJobTicketPDF)
	r.POST("/api/v1/quotations", HandleSaveQuotation)
	r.GET("/api/v1/quotations", HandleGetQuotations)
	r.POST("/api/v1/quotations/:id/convert", HandleConvertQuotationToOrder)
	r.POST("/api/upload/artwork", HandleArtworkUpload)
	r.POST("/api/v1/upload/artwork", HandleArtworkUpload)
	return r
}

func TestMasterDetailOrderAndTrackerFlow(t *testing.T) {
	router := setupTestRouter()

	// 1. Create Order with 2 items (Bilingual Books)
	createReq := CreateOrderRequest{
		OrderNo:       "ORD-TEST-001",
		CustomerName:  "Somphone Vongsa",
		CustomerPhone: "020-5555-5555",
		DepositLAK:    500000.0,
		Items: []CreateItemRequest{
			{
				ItemName:         "Bilingual Handbook - Lao",
				Quantity:         100,
				PageCount:        120,
				PaperSize:        "A5",
				AvgCovK:          7.5,
				AvgCovC:          2.15,
				AvgCovM:          3.40,
				AvgCovY:          1.80,
				BindingType:      "PERFECT_HOT_GLUE",
				PaperCostPerUnit: 150.0,
			},
			{
				ItemName:         "Bilingual Handbook - English",
				Quantity:         100,
				PageCount:        120,
				PaperSize:        "A5",
				AvgCovK:          7.5,
				AvgCovC:          2.15,
				AvgCovM:          3.40,
				AvgCovY:          1.80,
				BindingType:      "PERFECT_HOT_GLUE",
				PaperCostPerUnit: 150.0,
			},
		},
	}

	reqBody, _ := json.Marshal(createReq)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected status 201 Created, got %d: %s", w.Code, w.Body.String())
	}

	var createdOrder Order
	if err := json.Unmarshal(w.Body.Bytes(), &createdOrder); err != nil {
		t.Fatalf("Failed to unmarshal created order: %v", err)
	}

	if len(createdOrder.Items) != 2 {
		t.Fatalf("Expected 2 items in created order, got %d", len(createdOrder.Items))
	}

	firstItemID := createdOrder.Items[0].ID

	// 2. Fetch Order by OrderNo for shop floor tracker
	wTrack := httptest.NewRecorder()
	reqTrack, _ := http.NewRequest("GET", "/api/v1/orders/track/ORD-TEST-001", nil)
	router.ServeHTTP(wTrack, reqTrack)

	if wTrack.Code != http.StatusOK {
		t.Fatalf("Expected status 200 for track endpoint, got %d", wTrack.Code)
	}

	// 3. Update Step for first item
	stepUpdateBody := []byte(`{"current_step":"INNER_PRINTED","spoilage_count":2,"notes":"Testing test step"}`)
	wStep := httptest.NewRecorder()
	reqStep, _ := http.NewRequest("PATCH", "/api/v1/orders/items/"+firstItemID+"/step", bytes.NewBuffer(stepUpdateBody))
	reqStep.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wStep, reqStep)

	if wStep.Code != http.StatusOK {
		t.Fatalf("Expected status 200 for item step update, got %d: %s", wStep.Code, wStep.Body.String())
	}

	// 4. Generate Job Ticket PDF
	wPDF := httptest.NewRecorder()
	reqPDF, _ := http.NewRequest("GET", "/api/v1/orders/"+createdOrder.ID+"/job-ticket", nil)
	router.ServeHTTP(wPDF, reqPDF)

	if wPDF.Code != http.StatusOK {
		t.Fatalf("Expected status 200 for job ticket PDF, got %d", wPDF.Code)
	}
	if wPDF.Header().Get("Content-Type") != "application/pdf" {
		t.Errorf("Expected application/pdf Content-Type, got %s", wPDF.Header().Get("Content-Type"))
	}
}

func TestMarginGuardAndApprovalWorkflow(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/api/v1/orders", HandleCreateOrder)
	r.POST("/api/v1/quotations/:id/approve", HandleApproveQuotation)
	r.POST("/api/v1/quotations/:id/reject", HandleRejectQuotation)

	// Create order with very low margin (< 25%)
	lowMarginReq := CreateOrderRequest{
		OrderNo:      "ORD-LOW-MARGIN-001",
		CustomerName: "VIP Wholesale Client",
		Items: []CreateItemRequest{
			{
				ItemName:         "Discounted Catalog",
				Quantity:         500,
				PaperCostPerUnit: 2000.0,
				MarkupMargin:     0.10, // 10% target margin < 25%
			},
		},
	}

	body, _ := json.Marshal(lowMarginReq)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created, got %d: %s", w.Code, w.Body.String())
	}

	var order Order
	_ = json.Unmarshal(w.Body.Bytes(), &order)

	if order.Status != StatusRequiresManagerApproval {
		t.Errorf("Expected status REQUIRES_MANAGER_APPROVAL, got %s", order.Status)
	}

	// 2. Reject with non-manager role should be forbidden
	wForbidden := httptest.NewRecorder()
	reqForbidden, _ := http.NewRequest("POST", "/api/v1/quotations/"+order.ID+"/approve", nil)
	reqForbidden.Header.Set("X-User-Role", "OPERATOR")
	r.ServeHTTP(wForbidden, reqForbidden)

	if wForbidden.Code != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden for OPERATOR role, got %d", wForbidden.Code)
	}

	// 3. Approve with ROLE_MANAGER
	wApprove := httptest.NewRecorder()
	reqApprove, _ := http.NewRequest("POST", "/api/v1/quotations/"+order.ID+"/approve", bytes.NewBuffer([]byte(`{"manager_id":"MGR-001"}`)))
	reqApprove.Header.Set("X-User-Role", "ROLE_MANAGER")
	r.ServeHTTP(wApprove, reqApprove)

	if wApprove.Code != http.StatusOK {
		t.Errorf("Expected 200 OK for manager approval, got %d: %s", wApprove.Code, wApprove.Body.String())
	}
}

func TestDigitalProofLifecycle(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/api/v1/orders", HandleCreateOrder)
	r.POST("/api/v1/orders/:id/proof", HandleUploadDigitalProof)
	r.POST("/api/v1/orders/:id/proof/approve", HandleApproveDigitalProof)
	r.POST("/api/v1/orders/:id/proof/reject", HandleRejectDigitalProof)
	r.GET("/api/v1/orders/:id/proof", HandleGetDigitalProof)

	// Create test order
	createReq := CreateOrderRequest{
		OrderNo:      "ORD-PROOF-TEST-001",
		CustomerName: "Proof Customer",
		Items: []CreateItemRequest{
			{ItemName: "Booklet Proof", Quantity: 50, PaperCostPerUnit: 100.0, MarkupMargin: 0.35},
		},
	}
	body, _ := json.Marshal(createReq)
	wCreate := httptest.NewRecorder()
	reqCreate, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(body))
	reqCreate.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(wCreate, reqCreate)

	var ord Order
	_ = json.Unmarshal(wCreate.Body.Bytes(), &ord)

	// 1. Upload proof
	proofPayload := []byte(`{"proof_url":"https://cdn.somsingphim.la/proofs/test-preview.webp"}`)
	wProof := httptest.NewRecorder()
	reqProof, _ := http.NewRequest("POST", "/api/v1/orders/"+ord.ID+"/proof", bytes.NewBuffer(proofPayload))
	reqProof.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(wProof, reqProof)

	if wProof.Code != http.StatusOK {
		t.Fatalf("Expected 200 for upload proof, got %d: %s", wProof.Code, wProof.Body.String())
	}

	// 2. Reject proof with reason
	rejectPayload := []byte(`{"reason":"Text on page 3 is blurry"}`)
	wReject := httptest.NewRecorder()
	reqReject, _ := http.NewRequest("POST", "/api/v1/orders/"+ord.ID+"/proof/reject", bytes.NewBuffer(rejectPayload))
	reqReject.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(wReject, reqReject)

	if wReject.Code != http.StatusOK {
		t.Fatalf("Expected 200 for reject proof, got %d: %s", wReject.Code, wReject.Body.String())
	}

	// 3. Approve proof
	approvePayload := []byte(`{"signature_name":"John Doe","client_ip":"192.168.1.50"}`)
	wApprove := httptest.NewRecorder()
	reqApprove, _ := http.NewRequest("POST", "/api/v1/orders/"+ord.ID+"/proof/approve", bytes.NewBuffer(approvePayload))
	reqApprove.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(wApprove, reqApprove)

	if wApprove.Code != http.StatusOK {
		t.Fatalf("Expected 200 for approve proof, got %d: %s", wApprove.Code, wApprove.Body.String())
	}

	// 4. Get proof status
	wGet := httptest.NewRecorder()
	reqGet, _ := http.NewRequest("GET", "/api/v1/orders/"+ord.ID+"/proof", nil)
	r.ServeHTTP(wGet, reqGet)

	if wGet.Code != http.StatusOK {
		t.Fatalf("Expected 200 for get proof, got %d: %s", wGet.Code, wGet.Body.String())
	}

	var status ProofStatusResponse
	_ = json.Unmarshal(wGet.Body.Bytes(), &status)
	if !status.IsApproved {
		t.Errorf("Expected IsApproved to be true")
	}
}

func TestUpdateOrderStatusToInProductionIdempotency(t *testing.T) {
	router := setupTestRouter()

	// 1. Create order with adequate margin (> 25%) and deposit
	createReq := CreateOrderRequest{
		OrderNo:      "ORD-PROD-IDEMPOTENCY-001",
		CustomerName: "Idempotency Test Customer",
		DepositLAK:   50000.0,
		Items: []CreateItemRequest{
			{
				ItemName:         "Brochure A4",
				Quantity:         500,
				PageCount:        4,
				PaperSize:        "A4",
				PaperCostPerUnit: 200.0,
				MarkupMargin:     0.35,
			},
		},
	}
	body, _ := json.Marshal(createReq)
	wCreate := httptest.NewRecorder()
	reqCreate, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(body))
	reqCreate.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wCreate, reqCreate)

	if wCreate.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created, got %d", wCreate.Code)
	}

	var ord Order
	_ = json.Unmarshal(wCreate.Body.Bytes(), &ord)

	// 2. Approve digital proof to meet state machine prerequisites
	wApprove := httptest.NewRecorder()
	reqApprove, _ := http.NewRequest("POST", "/api/v1/orders/"+ord.ID+"/proof/approve", bytes.NewBuffer([]byte(`{"signature_name":"Alice"}`)))
	reqApprove.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wApprove, reqApprove)
	if wApprove.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for proof approval, got %d: %s", wApprove.Code, wApprove.Body.String())
	}

	// 3. Transition status to IN_PRODUCTION first time
	statusBody := []byte(`{"status":"IN_PRODUCTION"}`)
	wStatus1 := httptest.NewRecorder()
	reqStatus1, _ := http.NewRequest("PATCH", "/api/v1/orders/"+ord.ID+"/status", bytes.NewBuffer(statusBody))
	reqStatus1.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wStatus1, reqStatus1)

	if wStatus1.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for first IN_PRODUCTION transition, got %d: %s", wStatus1.Code, wStatus1.Body.String())
	}

	// 4. Transition status to IN_PRODUCTION second time (idempotency check)
	wStatus2 := httptest.NewRecorder()
	reqStatus2, _ := http.NewRequest("PATCH", "/api/v1/orders/"+ord.ID+"/status", bytes.NewBuffer(statusBody))
	reqStatus2.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wStatus2, reqStatus2)

	if wStatus2.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for duplicate IN_PRODUCTION transition, got %d: %s", wStatus2.Code, wStatus2.Body.String())
	}
}

func TestOrderStateMachineValidation(t *testing.T) {
	router := setupTestRouter()

	// 1. Create order without deposit
	createReq := CreateOrderRequest{
		OrderNo:      "ORD-SM-TEST-001",
		CustomerName: "State Machine Tester",
		DepositLAK:   0,
		Items: []CreateItemRequest{
			{ItemName: "Flyer A5", Quantity: 200, MarkupMargin: 0.30},
		},
	}
	body, _ := json.Marshal(createReq)
	wCreate := httptest.NewRecorder()
	reqCreate, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(body))
	reqCreate.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wCreate, reqCreate)

	var ord Order
	_ = json.Unmarshal(wCreate.Body.Bytes(), &ord)

	// 2. Direct jump to IN_PRODUCTION without deposit or proof should fail (400 Bad Request)
	wBadProd := httptest.NewRecorder()
	reqBadProd, _ := http.NewRequest("PATCH", "/api/v1/orders/"+ord.ID+"/status", bytes.NewBuffer([]byte(`{"status":"IN_PRODUCTION"}`)))
	reqBadProd.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wBadProd, reqBadProd)

	if wBadProd.Code != http.StatusBadRequest {
		t.Fatalf("Expected 400 Bad Request for premature IN_PRODUCTION, got %d", wBadProd.Code)
	}

	// 3. Direct jump from pre-production to COMPLETED should fail (400 Bad Request)
	wBadComp := httptest.NewRecorder()
	reqBadComp, _ := http.NewRequest("PATCH", "/api/v1/orders/"+ord.ID+"/status", bytes.NewBuffer([]byte(`{"status":"COMPLETED"}`)))
	reqBadComp.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wBadComp, reqBadComp)

	if wBadComp.Code != http.StatusBadRequest {
		t.Fatalf("Expected 400 Bad Request for skipping to COMPLETED, got %d", wBadComp.Code)
	}

	// 4. Record Deposit
	wDep := httptest.NewRecorder()
	reqDep, _ := http.NewRequest("POST", "/api/v1/orders/"+ord.ID+"/deposit", bytes.NewBuffer([]byte(`{"deposit_amount":30000}`)))
	reqDep.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wDep, reqDep)

	if wDep.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for recording deposit, got %d", wDep.Code)
	}

	// 5. Try IN_PRODUCTION without proof approved - should still fail (400 Bad Request)
	wNoProof := httptest.NewRecorder()
	reqNoProof, _ := http.NewRequest("PATCH", "/api/v1/orders/"+ord.ID+"/status", bytes.NewBuffer([]byte(`{"status":"IN_PRODUCTION"}`)))
	reqNoProof.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wNoProof, reqNoProof)

	if wNoProof.Code != http.StatusBadRequest {
		t.Fatalf("Expected 400 Bad Request when proof is unconfirmed, got %d", wNoProof.Code)
	}

	// 6. Approve proof
	wApprove := httptest.NewRecorder()
	reqApprove, _ := http.NewRequest("POST", "/api/v1/orders/"+ord.ID+"/proof/approve", bytes.NewBuffer([]byte(`{"signature_name":"Customer Bob"}`)))
	reqApprove.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wApprove, reqApprove)

	if wApprove.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for proof approval, got %d", wApprove.Code)
	}

	// 7. Now transition to IN_PRODUCTION should succeed (200 OK)
	wGoodProd := httptest.NewRecorder()
	reqGoodProd, _ := http.NewRequest("PATCH", "/api/v1/orders/"+ord.ID+"/status", bytes.NewBuffer([]byte(`{"status":"IN_PRODUCTION"}`)))
	reqGoodProd.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wGoodProd, reqGoodProd)

	if wGoodProd.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for valid IN_PRODUCTION transition, got %d: %s", wGoodProd.Code, wGoodProd.Body.String())
	}
}

func TestCreateOrderIdempotency(t *testing.T) {
	router := setupTestRouter()

	idempotencyKey := "idem-test-key-uuid-12345"
	createReq := CreateOrderRequest{
		OrderNo:        "ORD-IDEMPOTENT-001",
		CustomerName:   "Alice Test",
		IdempotencyKey: idempotencyKey,
		Items: []CreateItemRequest{
			{ItemName: "Stickers Pack", Quantity: 100, PaperCostPerUnit: 50.0},
		},
	}
	body, _ := json.Marshal(createReq)

	// First submission
	w1 := httptest.NewRecorder()
	req1, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(body))
	req1.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w1, req1)

	if w1.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created on first submit, got %d: %s", w1.Code, w1.Body.String())
	}

	var firstOrder Order
	_ = json.Unmarshal(w1.Body.Bytes(), &firstOrder)

	// Second submission with the same idempotency_key (simulating network retry/double click)
	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(body))
	req2.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK && w2.Code != http.StatusCreated {
		t.Fatalf("Expected 200 OK on duplicate submit, got %d: %s", w2.Code, w2.Body.String())
	}

	var secondOrder Order
	_ = json.Unmarshal(w2.Body.Bytes(), &secondOrder)

	if secondOrder.ID != firstOrder.ID {
		t.Errorf("Expected identical Order ID %s, but got %s", firstOrder.ID, secondOrder.ID)
	}
}

func TestTrackOrderQueryFlow(t *testing.T) {
	router := setupTestRouter()

	createReq := CreateOrderRequest{
		OrderNo:       "SSP-2026-9999",
		CustomerName:  "Noy Keomany",
		CustomerPhone: "020-7788-9900",
		Items: []CreateItemRequest{
			{ItemName: "Brand Book", Quantity: 50, PaperCostPerUnit: 100.0},
		},
	}
	body, _ := json.Marshal(createReq)
	wCreate := httptest.NewRecorder()
	reqCreate, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(body))
	reqCreate.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wCreate, reqCreate)
	if wCreate.Code != http.StatusCreated {
		t.Fatalf("Failed to create order for tracking test: %s", wCreate.Body.String())
	}

	// 1. Query by order_no via ?q=
	wQ := httptest.NewRecorder()
	reqQ, _ := http.NewRequest("GET", "/api/v1/orders/track?q=SSP-2026-9999", nil)
	router.ServeHTTP(wQ, reqQ)
	if wQ.Code != http.StatusOK {
		t.Errorf("Expected 200 OK searching by order number, got %d", wQ.Code)
	}

	// 1b. Query with '#' prefix (e.g. #SSP-2026-9999)
	wHash := httptest.NewRecorder()
	reqHash, _ := http.NewRequest("GET", "/api/v1/orders/track?q=%23SSP-2026-9999", nil)
	router.ServeHTTP(wHash, reqHash)
	if wHash.Code != http.StatusOK {
		t.Errorf("Expected 200 OK searching with hash prefix, got %d", wHash.Code)
	}

	// 2. Query by phone number via ?q=
	wPhone := httptest.NewRecorder()
	reqPhone, _ := http.NewRequest("GET", "/api/v1/orders/track?q=020-7788-9900", nil)
	router.ServeHTTP(wPhone, reqPhone)
	if wPhone.Code != http.StatusOK {
		t.Errorf("Expected 200 OK searching by customer phone, got %d", wPhone.Code)
	}

	// 3. Query non-existing order
	wMissing := httptest.NewRecorder()
	reqMissing, _ := http.NewRequest("GET", "/api/v1/orders/track?q=NON-EXISTING-999", nil)
	router.ServeHTTP(wMissing, reqMissing)
	if wMissing.Code != http.StatusNotFound {
		t.Errorf("Expected 404 Not Found for missing order, got %d", wMissing.Code)
	}
}

func TestAutomatedStockDeductionAndReversalFlow(t *testing.T) {
	router := setupTestRouter()

	createReq := CreateOrderRequest{
		OrderNo:      "ORD-STOCK-FLOW-001",
		CustomerName: "Test Print Company",
		DepositLAK:   100000.0,
		Items: []CreateItemRequest{
			{
				ItemName:           "Brochures",
				Quantity:           1000,
				PageCount:          16,
				PaperSku:           "AP-130-A4",
				PaperCostPerUnit:   150.0,
				InkCoveragePercent: 20.0,
			},
		},
	}
	body, _ := json.Marshal(createReq)
	wCreate := httptest.NewRecorder()
	reqCreate, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(body))
	reqCreate.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wCreate, reqCreate)
	if wCreate.Code != http.StatusCreated {
		t.Fatalf("Failed to create order: %s", wCreate.Body.String())
	}

	var createdOrder Order
	_ = json.Unmarshal(wCreate.Body.Bytes(), &createdOrder)

	// Confirm Proof
	wApprove := httptest.NewRecorder()
	reqApprove, _ := http.NewRequest("POST", "/api/v1/orders/"+createdOrder.ID+"/proof/approve", bytes.NewBuffer([]byte(`{"signature_name":"Customer"}`)))
	reqApprove.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wApprove, reqApprove)

	// Transition to IN_PRODUCTION (Trigger Stock Deduction)
	wProd := httptest.NewRecorder()
	statusPayload := []byte(`{"status":"IN_PRODUCTION","allow_negative_stock":true}`)
	reqProd, _ := http.NewRequest("PATCH", "/api/v1/orders/"+createdOrder.ID+"/status", bytes.NewBuffer(statusPayload))
	reqProd.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wProd, reqProd)
	if wProd.Code != http.StatusOK {
		t.Fatalf("Failed to transition to IN_PRODUCTION: %s", wProd.Body.String())
	}

	var inProdOrder Order
	_ = json.Unmarshal(wProd.Body.Bytes(), &inProdOrder)
	if inProdOrder.StockDeductedAt == nil {
		t.Errorf("Expected stock_deducted_at timestamp to be set on order")
	}

	// Trigger Stock Reversal
	wRev := httptest.NewRecorder()
	reqRev, _ := http.NewRequest("POST", "/api/v1/orders/"+createdOrder.ID+"/reverse-stock", nil)
	router.ServeHTTP(wRev, reqRev)
	if wRev.Code != http.StatusOK {
		t.Fatalf("Failed to reverse stock: %s", wRev.Body.String())
	}
}

func TestDigitalProofDispatchAndCustomerActionFlow(t *testing.T) {
	router := setupTestRouter()

	createReq := CreateOrderRequest{
		OrderNo:      "ORD-PROOF-SYNC-001",
		CustomerName: "Proof Client",
		DepositLAK:   50000.0,
		Items: []CreateItemRequest{
			{ItemName: "Marketing Flyers", Quantity: 500, PaperCostPerUnit: 200.0},
		},
	}
	body, _ := json.Marshal(createReq)
	wCreate := httptest.NewRecorder()
	reqCreate, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(body))
	reqCreate.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wCreate, reqCreate)
	if wCreate.Code != http.StatusCreated {
		t.Fatalf("Failed to create order: %s", wCreate.Body.String())
	}

	var createdOrder Order
	_ = json.Unmarshal(wCreate.Body.Bytes(), &createdOrder)

	// 1. Prepress operator dispatches proof
	sendProofReq := SendProofRequest{
		ProofURL:      "https://storage.googleapis.com/somsing-proofs/flyer-v1.pdf",
		PrepressNotes: "Please inspect color balance and bleed lines.",
	}
	sendBody, _ := json.Marshal(sendProofReq)
	wSend := httptest.NewRecorder()
	reqSend, _ := http.NewRequest("POST", "/api/v1/orders/"+createdOrder.ID+"/send-proof", bytes.NewBuffer(sendBody))
	reqSend.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wSend, reqSend)
	if wSend.Code != http.StatusOK {
		t.Fatalf("Failed to send proof: %s", wSend.Body.String())
	}

	// 2. Customer rejects proof with changes
	rejectReq := ProofActionRequest{
		Action:   "REJECT",
		Feedback: "Please change the header text to bold and update the phone number.",
	}
	rejectBody, _ := json.Marshal(rejectReq)
	wReject := httptest.NewRecorder()
	reqReject, _ := http.NewRequest("POST", "/api/v1/orders/"+createdOrder.ID+"/proof-action", bytes.NewBuffer(rejectBody))
	reqReject.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wReject, reqReject)
	if wReject.Code != http.StatusOK {
		t.Fatalf("Failed to submit rejection: %s", wReject.Body.String())
	}

	// 3. Prepress uploads v2
	sendProofReq2 := SendProofRequest{
		ProofURL:      "https://storage.googleapis.com/somsing-proofs/flyer-v2.pdf",
		PrepressNotes: "Updated font weight and phone number as requested.",
	}
	sendBody2, _ := json.Marshal(sendProofReq2)
	wSend2 := httptest.NewRecorder()
	reqSend2, _ := http.NewRequest("POST", "/api/v1/orders/"+createdOrder.ID+"/send-proof", bytes.NewBuffer(sendBody2))
	reqSend2.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wSend2, reqSend2)
	if wSend2.Code != http.StatusOK {
		t.Fatalf("Failed to send proof v2: %s", wSend2.Body.String())
	}

	// 4. Customer approves proof v2
	approveReq := ProofActionRequest{
		Action:            "APPROVE",
		CustomerSignature: "Proof Client",
	}
	approveBody, _ := json.Marshal(approveReq)
	wApprove := httptest.NewRecorder()
	reqApprove, _ := http.NewRequest("POST", "/api/v1/orders/"+createdOrder.ID+"/proof-action", bytes.NewBuffer(approveBody))
	reqApprove.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wApprove, reqApprove)
	if wApprove.Code != http.StatusOK {
		t.Fatalf("Failed to approve proof: %s", wApprove.Body.String())
	}

	// Verify order is now FILE_CONFIRMED and ready for production
	wFinal := httptest.NewRecorder()
	reqFinal, _ := http.NewRequest("GET", "/api/v1/orders/track?q="+createdOrder.ID, nil)
	router.ServeHTTP(wFinal, reqFinal)
	var finalOrder Order
	_ = json.Unmarshal(wFinal.Body.Bytes(), &finalOrder)
	if finalOrder.Status != StatusFileConfirmed {
		t.Errorf("Expected status FILE_CONFIRMED, got %s", finalOrder.Status)
	}
}

func TestQuotationSaveAndConvertToOrderFlow(t *testing.T) {
	router := setupTestRouter()

	quoteReq := QuotationRecord{
		ID:                "QT-CRM-TEST-001",
		QuotationNo:       "QT-2026-0099",
		Title:             "Brochures 500 pcs",
		CustomerName:      "Bounmy Souvanh",
		CustomerPhone:     "020-9988-7766",
		CustomerAddress:   "Dongdok, Vientiane Capital",
		TotalCost:         350000.0,
		TotalSellingPrice: 500000.0,
		Items: []map[string]any{
			{
				"name":      "Color Brochure",
				"quantity":  float64(500),
				"unitPrice": float64(1000),
				"subtotal":  float64(500000),
			},
		},
	}
	body, _ := json.Marshal(quoteReq)
	wSave := httptest.NewRecorder()
	reqSave, _ := http.NewRequest("POST", "/api/v1/quotations", bytes.NewBuffer(body))
	reqSave.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wSave, reqSave)

	if wSave.Code != http.StatusOK {
		t.Fatalf("Failed to save quotation: %s", wSave.Body.String())
	}

	// 2. Convert to Order
	wConvert := httptest.NewRecorder()
	reqConvert, _ := http.NewRequest("POST", "/api/v1/quotations/QT-CRM-TEST-001/convert", nil)
	router.ServeHTTP(wConvert, reqConvert)

	if wConvert.Code != http.StatusOK {
		t.Fatalf("Failed to convert quotation to order: %s", wConvert.Body.String())
	}

	var convertResp struct {
		Status       string `json:"status"`
		OrderID      string `json:"orderId"`
		OrderNumber  string `json:"orderNumber"`
		CustomerName string `json:"customerName"`
	}
	_ = json.Unmarshal(wConvert.Body.Bytes(), &convertResp)

	if convertResp.OrderID == "" || convertResp.CustomerName != "Bounmy Souvanh" {
		t.Errorf("Unexpected conversion response: %+v", convertResp)
	}

	// 3. Verify Order is trackable by customer phone
	wTrack := httptest.NewRecorder()
	reqTrack, _ := http.NewRequest("GET", "/api/v1/orders/track?q=020-9988-7766", nil)
	router.ServeHTTP(wTrack, reqTrack)

	if wTrack.Code != http.StatusOK {
		t.Fatalf("Expected converted order to be found by customer phone, got %d: %s", wTrack.Code, wTrack.Body.String())
	}
}

func TestArtworkUploadAndPassThroughFlow(t *testing.T) {
	router := setupTestRouter()

	// 1. Upload Artwork File via POST /api/upload/artwork
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", "brochure_print_ready.pdf")
	if err != nil {
		t.Fatalf("Failed to create form file: %v", err)
	}
	_, _ = part.Write([]byte("%PDF-1.4 Mock PDF Content with CMYK Profile"))
	_ = writer.WriteField("type", "artwork")
	writer.Close()

	wUpload := httptest.NewRecorder()
	reqUpload, _ := http.NewRequest("POST", "/api/upload/artwork", body)
	reqUpload.Header.Set("Content-Type", writer.FormDataContentType())
	router.ServeHTTP(wUpload, reqUpload)

	if wUpload.Code != http.StatusOK {
		t.Fatalf("Failed to upload artwork: %d %s", wUpload.Code, wUpload.Body.String())
	}

	var uploadResp struct {
		Status   string `json:"status"`
		AssetID  string `json:"assetId"`
		FileName string `json:"fileName"`
		FileURL  string `json:"fileUrl"`
	}
	_ = json.Unmarshal(wUpload.Body.Bytes(), &uploadResp)

	if uploadResp.FileURL == "" || uploadResp.FileName != "brochure_print_ready.pdf" {
		t.Errorf("Unexpected upload response: %+v", uploadResp)
	}

	// 2. Save Quotation with Artwork URL
	quoteReq := QuotationRecord{
		ID:                "QT-ARTWORK-TEST-001",
		QuotationNo:       "QT-2026-ART-01",
		Title:             "Artwork Quotation",
		CustomerName:      "Art Buyer",
		CustomerPhone:     "020-1122-3344",
		ArtworkURL:        uploadResp.FileURL,
		TotalCost:         100000.0,
		TotalSellingPrice: 200000.0,
		Items: []map[string]any{
			{
				"name":      "Color Print",
				"quantity":  float64(100),
				"unitPrice": float64(2000),
				"subtotal":  float64(200000),
			},
		},
	}
	qBytes, _ := json.Marshal(quoteReq)
	wQuote := httptest.NewRecorder()
	reqQuote, _ := http.NewRequest("POST", "/api/v1/quotations", bytes.NewBuffer(qBytes))
	reqQuote.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wQuote, reqQuote)

	if wQuote.Code != http.StatusOK {
		t.Fatalf("Failed to save quotation: %s", wQuote.Body.String())
	}

	// 3. Convert Quotation to Order & verify artwork pass-through
	wConvert := httptest.NewRecorder()
	reqConvert, _ := http.NewRequest("POST", "/api/v1/quotations/QT-ARTWORK-TEST-001/convert", nil)
	router.ServeHTTP(wConvert, reqConvert)

	if wConvert.Code != http.StatusOK {
		t.Fatalf("Failed to convert quotation: %s", wConvert.Body.String())
	}

	var convertResult struct {
		Data Order `json:"data"`
	}
	_ = json.Unmarshal(wConvert.Body.Bytes(), &convertResult)

	if convertResult.Data.GoogleDriveLink != uploadResp.FileURL {
		t.Errorf("Expected GoogleDriveLink to contain artwork URL %s, got %s", uploadResp.FileURL, convertResult.Data.GoogleDriveLink)
	}
}

func TestCustomerTrackingEndToEnd(t *testing.T) {
	router := setupTestRouter()

	// 1. Simulate Order created from Customer Service Frontend
	createPayload := []byte(`{
		"order_id": "SSP-82115",
		"customer_name": "ທ້າວ ສົມຊາຍ ໃຈດີ",
		"phone": "+856 20 77123999",
		"address": "ບ້าน ດົງໂດກ, ເມືອງ ໄຊທານີ, ນະຄອນຫຼວງວຽງຈັນ",
		"items": [
			{
				"job_name": "ສະຕິກເກີ PP ກັນນ້ຳ",
				"quantity": 50,
				"unit_price": 25000.0,
				"total_price": 1250000.0
			}
		],
		"total_price": 1250000.0
	}`)

	wCreate := httptest.NewRecorder()
	reqCreate, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(createPayload))
	reqCreate.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wCreate, reqCreate)

	if wCreate.Code != http.StatusCreated {
		t.Fatalf("Expected status 201 for customer order creation, got %d: %s", wCreate.Code, wCreate.Body.String())
	}

	var created Order
	if err := json.Unmarshal(wCreate.Body.Bytes(), &created); err != nil {
		t.Fatalf("Failed to parse created order: %v", err)
	}

	if created.OrderNo != "SSP-82115" {
		t.Errorf("Expected OrderNo 'SSP-82115', got '%s'", created.OrderNo)
	}
	if created.CustomerPhone != "+856 20 77123999" {
		t.Errorf("Expected CustomerPhone '+856 20 77123999', got '%s'", created.CustomerPhone)
	}

	// 2. Track by exact Order ID
	queries := []string{
		"SSP-82115",
		"ssp-82115",
		"#SSP-82115",
		"+856 20 77123999",
		"020 77123999",
		"02077123999",
		"77123999",
	}

	for _, q := range queries {
		wTrack := httptest.NewRecorder()
		reqTrack, _ := http.NewRequest("GET", "/api/v1/orders/track?q="+url.QueryEscape(q), nil)
		router.ServeHTTP(wTrack, reqTrack)

		if wTrack.Code != http.StatusOK {
			t.Errorf("Tracking query '%s' failed with status %d: %s", q, wTrack.Code, wTrack.Body.String())
			continue
		}

		var tracked Order
		if err := json.Unmarshal(wTrack.Body.Bytes(), &tracked); err != nil {
			t.Errorf("Tracking query '%s' returned invalid JSON: %v", q, err)
			continue
		}

		if tracked.OrderNo != "SSP-82115" && tracked.OrderNumber != "SSP-82115" {
			t.Errorf("Tracking query '%s' returned wrong order: %s", q, tracked.OrderNo)
		}
	}
}
