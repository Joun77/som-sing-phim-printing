package dashboard

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func setupDashboardTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.GET("/api/v1/dashboard/stats", HandleGetDashboardStats)
	r.GET("/api/v1/dashboard/revenue-trend", HandleGetRevenueTrend)
	r.GET("/api/v1/dashboard/spoilage-trend", HandleGetSpoilageTrend)
	return r
}

func TestDashboardStatsAggregation(t *testing.T) {
	router := setupDashboardTestRouter()

	// 1. Test Stats
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/dashboard/stats?period=month", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK from dashboard stats, got %d", w.Code)
	}

	var resp struct {
		Status string                 `json:"status"`
		Data   DashboardStatsResponse `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to parse dashboard stats response: %v", err)
	}

	if resp.Data.Period != "month" {
		t.Errorf("Expected period 'month', got '%s'", resp.Data.Period)
	}

	// 2. Test Revenue Trend
	wRev := httptest.NewRecorder()
	reqRev, _ := http.NewRequest("GET", "/api/v1/dashboard/revenue-trend", nil)
	router.ServeHTTP(wRev, reqRev)
	if wRev.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK from revenue trend, got %d", wRev.Code)
	}

	// 3. Test Spoilage Trend
	wSpoil := httptest.NewRecorder()
	reqSpoil, _ := http.NewRequest("GET", "/api/v1/dashboard/spoilage-trend", nil)
	router.ServeHTTP(wSpoil, reqSpoil)
	if wSpoil.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK from spoilage trend, got %d", wSpoil.Code)
	}
}
