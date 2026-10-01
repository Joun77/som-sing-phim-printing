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

func TestHandleVerifySlip_RequiresManualReview(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/verify", HandleVerifySlip)
	body := bytes.NewBufferString(`{"order_id":"fixture-order","qr_payload":"fake","amount":1500,"trans_ref":"client-forged"}`)
	request := httptest.NewRequest(http.MethodPost, "/verify", body)
	request.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, request)
	if w.Code != http.StatusConflict {
		t.Fatalf("want 409 got %d", w.Code)
	}
	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}
	if response["status"] != "manual_review_required" || response["new_status"] != nil {
		t.Fatalf("unexpected approval: %s", w.Body.String())
	}
}

func TestCallSlipOKAPI_MissingConfigurationFailsClosed(t *testing.T) {
	t.Setenv("SLIPOK_API_KEY", "")
	t.Setenv("SLIPOK_BRANCH_ID", "")
	response, err := CallSlipOKAPI("dummy", "")
	if err == nil || response != nil {
		t.Fatal("missing configuration must not verify a payment")
	}
}
