package inbound

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHandleUpdateInboundTransaction_MandatoryReason(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.PUT("/api/inbound/:id", HandleUpdateInboundTransaction)

	// Attempt update without edit reason -> should fail with 400
	payload := map[string]interface{}{
		"id":          "INB-TEST-01",
		"quantity":    20,
		"totalPrice":  200000,
		"editReason":  "",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest(http.MethodPut, "/api/inbound/INB-TEST-01", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("Expected 400 Bad Request when editReason is missing, got %d: %s", w.Code, w.Body.String())
	}

	// Attempt update with valid edit reason -> should succeed
	payload["editReason"] = "Correction of delivery note quantity discrepancy"
	bodyWithReason, _ := json.Marshal(payload)

	req2, _ := http.NewRequest(http.MethodPut, "/api/inbound/INB-TEST-01", bytes.NewBuffer(bodyWithReason))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK when editReason is provided, got %d: %s", w2.Code, w2.Body.String())
	}
}

func TestGetMultiplier(t *testing.T) {
	paperSpecs := map[string]interface{}{
		"sheets_per_pack": float64(500),
	}
	if m := getMultiplier("Paper", paperSpecs); m != 500.0 {
		t.Errorf("Expected paper multiplier 500, got %f", m)
	}

	inkSpecs := map[string]interface{}{
		"volume": float64(140),
	}
	if m := getMultiplier("Ink", inkSpecs); m != 140.0 {
		t.Errorf("Expected ink multiplier 140, got %f", m)
	}
}
