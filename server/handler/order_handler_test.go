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
		Status string                          `json:"status"`
		Data   domain.CustomerTrackingResponse `json:"data"`
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
