package inventory

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestPredictiveMaintenanceCheck_CalculationAndTickets(t *testing.T) {
	newTickets, indicators := RunPredictiveMaintenanceCheck()

	if len(indicators) == 0 {
		t.Fatalf("Expected non-empty equipment health indicators")
	}

	foundRequiresService := false
	for _, ind := range indicators {
		if ind.HealthStatus == "REQUIRES_SERVICE" {
			foundRequiresService = true
			if ind.ImpressionsSinceLastService < ind.MaintenanceIntervalImpressions {
				t.Errorf("Expected delta >= interval for REQUIRES_SERVICE, got delta %d, interval %d",
					ind.ImpressionsSinceLastService, ind.MaintenanceIntervalImpressions)
			}
		}
	}

	if !foundRequiresService {
		t.Errorf("Expected at least 1 equipment requiring service based on seed meters")
	}

	_ = newTickets
}

func TestHandleGetEquipmentHealthAndTickets(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.GET("/api/v1/inventory/equipment/health", HandleGetEquipmentHealth)
	r.GET("/api/v1/inventory/equipment/maintenance-tickets", HandleGetMaintenanceTickets)
	r.POST("/api/v1/inventory/equipment/check-ppm", HandleTriggerPPMCheck)

	// Health endpoint
	w1 := httptest.NewRecorder()
	req1, _ := http.NewRequest("GET", "/api/v1/inventory/equipment/health", nil)
	r.ServeHTTP(w1, req1)
	if w1.Code != http.StatusOK {
		t.Errorf("Expected 200 for health endpoint, got %d", w1.Code)
	}

	// Tickets endpoint
	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest("GET", "/api/v1/inventory/equipment/maintenance-tickets", nil)
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusOK {
		t.Errorf("Expected 200 for tickets endpoint, got %d", w2.Code)
	}

	// Trigger PPM check
	w3 := httptest.NewRecorder()
	req3, _ := http.NewRequest("POST", "/api/v1/inventory/equipment/check-ppm", nil)
	r.ServeHTTP(w3, req3)
	if w3.Code != http.StatusOK {
		t.Errorf("Expected 200 for trigger check, got %d", w3.Code)
	}
}
