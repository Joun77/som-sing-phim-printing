package spoilage

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestSpoilageAndSchedulingEndpoints(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.GET("/api/v1/production/machines/schedule", HandleGetMachineSchedule)
	r.POST("/api/v1/production/spoilage", HandleCreateSpoilageLog)
	r.GET("/api/v1/production/spoilage", HandleGetSpoilageLogs)
	r.GET("/api/v1/analytics/spoilage-profit", HandleGetSpoilageProfitAnalytics)

	// 1. Create spoilage log
	logEntry := SpoilageLog{
		OrderID:     "ORD-101",
		MachineID:   "M-OFFSET-01",
		PaperSku:    "PAP-ART-160",
		SpoilageQty: 15,
		Unit:        "Sheet",
		Reason:      "Lamination Bubble",
		CostImpact:  45000,
	}
	body, _ := json.Marshal(logEntry)
	wLog := httptest.NewRecorder()
	reqLog, _ := http.NewRequest("POST", "/api/v1/production/spoilage", bytes.NewBuffer(body))
	reqLog.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(wLog, reqLog)

	if wLog.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created for spoilage log, got %d: %s", wLog.Code, wLog.Body.String())
	}

	// 2. Fetch machine schedule
	wSched := httptest.NewRecorder()
	reqSched, _ := http.NewRequest("GET", "/api/v1/production/machines/schedule", nil)
	r.ServeHTTP(wSched, reqSched)

	if wSched.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for machine schedule, got %d", wSched.Code)
	}

	// 3. Fetch spoilage and profit analytics
	wAnalytics := httptest.NewRecorder()
	reqAnalytics, _ := http.NewRequest("GET", "/api/v1/analytics/spoilage-profit", nil)
	r.ServeHTTP(wAnalytics, reqAnalytics)

	if wAnalytics.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for spoilage profit analytics, got %d", wAnalytics.Code)
	}
}
