package pricing

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestCurrencyProxy_FetchAndCache(t *testing.T) {
	rates := FetchOrGetCachedExchangeRates()

	if rates.Base != "THB" {
		t.Errorf("Expected base currency 'THB', got '%s'", rates.Base)
	}

	if rates.Rates["LAK"] <= 0 {
		t.Errorf("Expected LAK rate > 0, got %f", rates.Rates["LAK"])
	}

	if rates.Rates["CNY"] <= 0 {
		t.Errorf("Expected CNY rate > 0, got %f", rates.Rates["CNY"])
	}
}

func TestHandleGetPublicExchangeRates(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.GET("/api/v1/public/exchange-rates", HandleGetPublicExchangeRates)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/public/exchange-rates", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
}
