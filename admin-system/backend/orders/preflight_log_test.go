package orders

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHandlePreflightReport_SaveAndGet(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/api/v1/orders/:id/preflight-report", HandleSavePreflightReport)
	r.GET("/api/v1/orders/:id/preflight-report", HandleGetPreflightReport)

	orderID := "ORD-TEST-PREFLIGHT-001"

	report := PreflightReportData{
		OrderID:            orderID,
		FileName:           "luxury_catalog_cover.pdf",
		TotalPages:         4,
		ColorSpace:         "CMYK",
		HasRGB:             false,
		IsStandardCMYK:     true,
		DPIEstimate:        300,
		BleedMM:            3.0,
		HasSufficientBleed: true,
		TACMaxPercent:      265.5,
		TACWarning:         false,
		AvgCovC:            12.5,
		AvgCovM:            25.0,
		AvgCovY:            8.0,
		AvgCovK:            55.0,
		Status:             "PASSED",
		ReportJSON: map[string]interface{}{
			"sample_pages": 4,
			"verified_by":  "Auto Preflight Studio",
		},
	}

	body, _ := json.Marshal(report)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/orders/"+orderID+"/preflight-report", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected status 201, got %d: %s", w.Code, w.Body.String())
	}

	// Fetch saved preflight report
	wGet := httptest.NewRecorder()
	reqGet, _ := http.NewRequest("GET", "/api/v1/orders/"+orderID+"/preflight-report", nil)
	r.ServeHTTP(wGet, reqGet)

	if wGet.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d: %s", wGet.Code, wGet.Body.String())
	}

	var res struct {
		Status string              `json:"status"`
		Data   PreflightReportData `json:"data"`
	}
	if err := json.Unmarshal(wGet.Body.Bytes(), &res); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if res.Data.FileName != "luxury_catalog_cover.pdf" {
		t.Errorf("Expected filename luxury_catalog_cover.pdf, got %s", res.Data.FileName)
	}
	if res.Data.BleedMM != 3.0 {
		t.Errorf("Expected BleedMM 3.0, got %f", res.Data.BleedMM)
	}
}
