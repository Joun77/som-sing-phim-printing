package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"backend/internal/domain"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

func TestOrderHandlerRoutes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	h := NewOrderHandler()
	h.RegisterRoutes(r)

	t.Run("POST /api/v1/orders with invalid payload returns 400", func(t *testing.T) {
		body := []byte(`{"customer_name": ""}`)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})

	t.Run("PATCH /api/v1/orders/:id/status with invalid payload returns 400", func(t *testing.T) {
		body := []byte(`{}`)
		req, _ := http.NewRequest(http.MethodPatch, "/api/v1/orders/ORD-001/status", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})

	t.Run("POST /api/v1/orders/:id/override-pricing with invalid payload returns 400", func(t *testing.T) {
		body, _ := json.Marshal(domain.OverridePricingPayload{
			OrderItemID:       "item-123",
			OverrideUnitPrice: decimal.NewFromInt(-10),
			Reason:            "",
			ApprovedBy:        "",
		})
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/orders/ORD-001/override-pricing", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})
}
