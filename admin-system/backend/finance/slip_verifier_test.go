package finance

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHandleVerifySlip_InvalidPayload(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/api/v1/checkout/verify-slip", HandleVerifySlip)

	// Missing order_id
	payload := map[string]interface{}{
		"qr_payload": "000201010211...",
	}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/checkout/verify-slip", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400 for missing order_id, got %d", w.Code)
	}
}

func TestHandleVerifySlip_MockVerificationSuccess(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/api/v1/checkout/verify-slip", HandleVerifySlip)

	testAmount := 1500.00
	payload := VerifySlipRequest{
		OrderID:   "SSP-ORD-TEST-001",
		QRPayload: "00020101021129370016A000000677010111011300668123456785802TH530376454071500.006304ABCD",
		Amount:    &testAmount,
		TransRef:  "TEST-TRANS-12345",
	}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/checkout/verify-slip", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	// When DB is nil in unit test, it returns 200 in fallback mode
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d (body: %s)", w.Code, w.Body.String())
	}

	var res VerifySlipResponse
	if err := json.Unmarshal(w.Body.Bytes(), &res); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if res.NewStatus != "PAID_PREPRESS" {
		t.Errorf("Expected new_status to be PAID_PREPRESS, got %s", res.NewStatus)
	}

	if res.TransRef != "TEST-TRANS-12345" {
		t.Errorf("Expected trans_ref TEST-TRANS-12345, got %s", res.TransRef)
	}
}

func TestCallSlipOKAPI_Mock(t *testing.T) {
	resp, err := CallSlipOKAPI("dummy_qr_payload", "")
	if err != nil {
		t.Fatalf("CallSlipOKAPI failed: %v", err)
	}
	if !resp.Success {
		t.Errorf("Expected success to be true in mock mode")
	}
}
