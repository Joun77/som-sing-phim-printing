package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"backend/server/domain"
	"backend/server/handler"
	"backend/server/service"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

func setupTestRouter() (*gin.Engine, *handler.OrderHandler) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	svc := service.NewPricingService()
	h := handler.NewOrderHandler(svc, nil)
	h.RegisterRoutes(r)
	return r, h
}

func TestOrderHandler_CalculatePricing(t *testing.T) {
	r, _ := setupTestRouter()

	payload := domain.PricingCalculationRequest{
		JobName:             "Catalog A4",
		Quantity:            200,
		PaperCostPerUnitLAK: 1500,
		MarkupMarginPercent: decimal.NewFromFloat(30.0),
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest(http.MethodPost, "/api/v1/pricing/calculate", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var res struct {
		Status string                            `json:"status"`
		Data   domain.PricingCalculationResponse `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &res); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if res.Status != "success" {
		t.Errorf("expected status 'success', got %s", res.Status)
	}

	if res.Data.TotalPriceLAK <= 0 {
		t.Errorf("expected positive total price, got %d", res.Data.TotalPriceLAK)
	}
}

func TestOrderHandler_TrackOrder_Masking(t *testing.T) {
	r, h := setupTestRouter()

	testOrder := domain.Order{
		ID:             "ord-12345",
		OrderNo:        "SSP-99001",
		TrackingCode:   "TRK-99001",
		CustomerName:   "Somchai Seng",
		CustomerPhone:  "020 55123456",
		TotalAmountLAK: 450000,
		DepositLAK:     200000,
		RemainingLAK:   250000,
		OverallStatus:  domain.StatusInProduction,
		CourierName:    "Anousith Express",
		Items: []domain.OrderItem{
			{
				ID:            "item-1",
				JobName:       "Banner Outdoor",
				ItemName:      "Banner Outdoor",
				Quantity:      2,
				PaperSize:     "1x2m",
				CurrentStep:   domain.StepInnerPrinted,
				UnitCostLAK:   120000, // Internal cost: MUST be masked
				UnitPriceLAK:  225000,
				TotalPriceLAK: 450000,
			},
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	h.SaveOrder(testOrder)

	req, _ := http.NewRequest(http.MethodGet, "/api/v1/orders/track/TRK-99001", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var res struct {
		Status string                        `json:"status"`
		Data   domain.PublicOrderTrackingDTO `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &res); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if res.Data.TrackingCode != "TRK-99001" {
		t.Errorf("expected tracking code TRK-99001, got %s", res.Data.TrackingCode)
	}

	if len(res.Data.Items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(res.Data.Items))
	}

	// Verify that internal cost is not present in the public response JSON
	var rawJSON map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &rawJSON)
	dataMap, _ := rawJSON["data"].(map[string]interface{})
	itemsRaw, _ := dataMap["items"].([]interface{})
	firstItem, _ := itemsRaw[0].(map[string]interface{})

	if _, exists := firstItem["unit_cost_lak"]; exists {
		t.Errorf("SECURITY RISK: unit_cost_lak was not masked in customer tracking response!")
	}
	if _, exists := firstItem["cost_breakdown"]; exists {
		t.Errorf("SECURITY RISK: cost_breakdown was not masked in customer tracking response!")
	}
}

func TestOrderHandler_ProofReviewFlow(t *testing.T) {
	r, h := setupTestRouter()

	testOrder := domain.Order{
		ID:             "ORD-PROOF-001",
		OrderNo:        "ORD-PROOF-001",
		TrackingCode:   "TRK-PROOF-001",
		CustomerName:   "Khamla",
		OverallStatus:  domain.StatusPrepressCheck,
		TotalAmountLAK: 150000,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	h.SaveOrder(testOrder)

	// Step 1: Upload Proof
	uploadBody, _ := json.Marshal(map[string]string{"proof_url": "https://storage.example.com/proofs/proof-001.png"})
	reqUpload, _ := http.NewRequest(http.MethodPost, "/api/v1/orders/TRK-PROOF-001/proof/upload", bytes.NewBuffer(uploadBody))
	reqUpload.Header.Set("Content-Type", "application/json")
	wUpload := httptest.NewRecorder()
	r.ServeHTTP(wUpload, reqUpload)

	if wUpload.Code != http.StatusOK {
		t.Fatalf("expected status 200 for proof upload, got %d: %s", wUpload.Code, wUpload.Body.String())
	}

	// Step 2: Reject Proof with revision notes
	rejectBody, _ := json.Marshal(map[string]string{"reason": "Please fix spelling of Company Name"})
	reqReject, _ := http.NewRequest(http.MethodPost, "/api/v1/orders/TRK-PROOF-001/proof/reject", bytes.NewBuffer(rejectBody))
	reqReject.Header.Set("Content-Type", "application/json")
	wReject := httptest.NewRecorder()
	r.ServeHTTP(wReject, reqReject)

	if wReject.Code != http.StatusOK {
		t.Fatalf("expected status 200 for proof reject, got %d: %s", wReject.Code, wReject.Body.String())
	}

	// Step 3: Approve Proof
	approveBody, _ := json.Marshal(map[string]string{"signature_name": "Khamla"})
	reqApprove, _ := http.NewRequest(http.MethodPost, "/api/v1/orders/TRK-PROOF-001/proof/approve", bytes.NewBuffer(approveBody))
	reqApprove.Header.Set("Content-Type", "application/json")
	wApprove := httptest.NewRecorder()
	r.ServeHTTP(wApprove, reqApprove)

	if wApprove.Code != http.StatusOK {
		t.Fatalf("expected status 200 for proof approve, got %d: %s", wApprove.Code, wApprove.Body.String())
	}
}

func TestOrderHandler_VerifySlip_AntiFraud(t *testing.T) {
	r, h := setupTestRouter()

	testOrder := domain.Order{
		ID:             "ORD-SLIP-001",
		OrderNo:        "ORD-SLIP-001",
		TrackingCode:   "TRK-SLIP-001",
		CustomerName:   "Chanthone",
		OverallStatus:  domain.StatusPendingSlipCheck,
		TotalAmountLAK: 250000,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	h.SaveOrder(testOrder)

	// Submission 1: Valid transfer slip
	payload := map[string]interface{}{
		"order_id":  "ORD-SLIP-001",
		"amount":    250000,
		"trans_ref": "BCEL-TX-998811",
	}
	body1, _ := json.Marshal(payload)
	req1, _ := http.NewRequest(http.MethodPost, "/api/v1/checkout/verify-slip", bytes.NewBuffer(body1))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)

	if w1.Code != http.StatusOK {
		t.Fatalf("expected status 200 on first slip verification, got %d: %s", w1.Code, w1.Body.String())
	}

	// Submission 2: Duplicate trans_ref (Fraud attack simulation)
	body2, _ := json.Marshal(payload)
	req2, _ := http.NewRequest(http.MethodPost, "/api/v1/checkout/verify-slip", bytes.NewBuffer(body2))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusConflict {
		t.Fatalf("expected status 409 Conflict for duplicate trans_ref, got %d: %s", w2.Code, w2.Body.String())
	}
}

func TestOrderHandler_CreateOrder_Idempotency(t *testing.T) {
	r, _ := setupTestRouter()

	orderReq := domain.Order{
		ID:             "ORD-IDEM-001",
		OrderNo:        "ORD-IDEM-001",
		TrackingCode:   "TRK-IDEM-001",
		CustomerName:   "Bounmy",
		CustomerPhone:  "020 99887766",
		TotalAmountLAK: 350000,
		DepositLAK:     100000,
		RemainingLAK:   250000,
		IdempotencyKey: "idem-uuid-999-aaa",
		Items: []domain.OrderItem{
			{
				ID:            "item-idem-1",
				JobName:       "Business Cards",
				ItemName:      "Business Cards",
				Quantity:      5,
				UnitPriceLAK:  70000,
				TotalPriceLAK: 350000,
			},
		},
	}

	body, _ := json.Marshal(orderReq)

	// First Request -> 201 Created
	req1, _ := http.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewBuffer(body))
	req1.Header.Set("Content-Type", "application/json")
	req1.Header.Set("Idempotency-Key", "idem-uuid-999-aaa")
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)

	if w1.Code != http.StatusCreated {
		t.Fatalf("expected status 201 Created on first request, got %d: %s", w1.Code, w1.Body.String())
	}

	// Second Request with same Idempotency-Key -> 200 OK
	req2, _ := http.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewBuffer(body))
	req2.Header.Set("Content-Type", "application/json")
	req2.Header.Set("Idempotency-Key", "idem-uuid-999-aaa")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK on idempotent retry, got %d: %s", w2.Code, w2.Body.String())
	}

	var res2 struct {
		Status string                        `json:"status"`
		Data   domain.PublicOrderTrackingDTO `json:"data"`
	}
	if err := json.Unmarshal(w2.Body.Bytes(), &res2); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if res2.Data.OrderNo != "ORD-IDEM-001" {
		t.Errorf("expected order_no ORD-IDEM-001, got %s", res2.Data.OrderNo)
	}
}

func TestOrderHandler_CustomerVIP_Flow(t *testing.T) {
	r, _ := setupTestRouter()

	// 1. Test Get Customer Tiers
	reqTiers, _ := http.NewRequest(http.MethodGet, "/api/v1/public/customer/tiers", nil)
	wTiers := httptest.NewRecorder()
	r.ServeHTTP(wTiers, reqTiers)

	if wTiers.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from /public/customer/tiers, got %d: %s", wTiers.Code, wTiers.Body.String())
	}

	// 2. Test Customer Auth
	authBody := handler.CustomerAuthRequest{
		Phone: "020 55889988",
		Name:  "Som Sing Phim VIP",
		Email: "customer@gmail.com",
	}
	bodyBytes, _ := json.Marshal(authBody)
	reqAuth, _ := http.NewRequest(http.MethodPost, "/api/v1/public/customer/auth", bytes.NewBuffer(bodyBytes))
	reqAuth.Header.Set("Content-Type", "application/json")
	wAuth := httptest.NewRecorder()
	r.ServeHTTP(wAuth, reqAuth)

	if wAuth.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from /public/customer/auth, got %d: %s", wAuth.Code, wAuth.Body.String())
	}

	var resAuth struct {
		Status string                     `json:"status"`
		Data   handler.CustomerProfileDTO `json:"data"`
	}
	if err := json.Unmarshal(wAuth.Body.Bytes(), &resAuth); err != nil {
		t.Fatalf("failed to decode auth response: %v", err)
	}
	if resAuth.Data.Phone != "02055889988" && resAuth.Data.Phone != "020 55889988" {
		t.Errorf("expected phone normalized, got %s", resAuth.Data.Phone)
	}
	if resAuth.Data.Tier == "" {
		t.Errorf("expected non-empty customer VIP tier")
	}

	// 3. Test Customer Profile by Phone
	reqProf, _ := http.NewRequest(http.MethodGet, "/api/v1/public/customer/profile?phone=02055889988", nil)
	wProf := httptest.NewRecorder()
	r.ServeHTTP(wProf, reqProf)

	if wProf.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from /public/customer/profile, got %d: %s", wProf.Code, wProf.Body.String())
	}
}

