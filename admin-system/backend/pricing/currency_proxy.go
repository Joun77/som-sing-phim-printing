package pricing

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
)

// CurrencyExchangeResponse represents daily exchange rates with base and multi-currency quotes
type CurrencyExchangeResponse struct {
	Base      string             `json:"base"`
	Rates     map[string]float64 `json:"rates"`
	UpdatedAt time.Time          `json:"updated_at"`
	ExpiresAt time.Time          `json:"expires_at"`
	Source    string             `json:"source"`
}

type cachedExchangeRates struct {
	data      CurrencyExchangeResponse
	expiresAt time.Time
}

var (
	exchangeCache      *cachedExchangeRates
	exchangeCacheMutex sync.RWMutex
	cacheTTL           = 12 * time.Hour
)

// InvalidateExchangeCache clears the in-memory cache so subsequent requests load updated DB rates
func InvalidateExchangeCache() {
	exchangeCacheMutex.Lock()
	exchangeCache = nil
	exchangeCacheMutex.Unlock()
}

// FetchOrGetCachedExchangeRates returns exchange rates with 12-hour in-memory caching
func FetchOrGetCachedExchangeRates() CurrencyExchangeResponse {
	exchangeCacheMutex.RLock()
	if exchangeCache != nil && time.Now().Before(exchangeCache.expiresAt) {
		defer exchangeCacheMutex.RUnlock()
		return exchangeCache.data
	}
	exchangeCacheMutex.RUnlock()

	// Acquire write lock to update cache
	exchangeCacheMutex.Lock()
	defer exchangeCacheMutex.Unlock()

	// Double-check after acquiring write lock
	if exchangeCache != nil && time.Now().Before(exchangeCache.expiresAt) {
		return exchangeCache.data
	}

	now := time.Now()
	expires := now.Add(cacheTTL)

	// Base fallback rates
	rates := map[string]float64{
		"THB": 1.0,
		"LAK": 630.50, // 1 THB = 630.50 LAK
		"CNY": 0.20,   // 1 THB = 0.20 CNY (1 CNY = 5.0 THB)
		"USD": 0.0285, // 1 THB = 0.0285 USD (1 USD = 35.0 THB)
	}

	// 1. Sync from DB or ratesStore first (Admin-configured rates take precedence)
	if db.DB != nil {
		if dbRates, err := getRatesFromDB(); err == nil && len(dbRates) > 0 {
			if thb, ok := dbRates["THB"]; ok && thb.RateToLak > 0 {
				rates["LAK"] = thb.RateToLak
			}
			if usd, ok := dbRates["USD"]; ok && usd.RateToLak > 0 && rates["LAK"] > 0 {
				// 1 USD = usd.RateToLak LAK -> 1 THB = (rates["LAK"] / usd.RateToLak) USD
				rates["USD"] = rates["LAK"] / usd.RateToLak
			}
		}
	} else {
		ratesMutex.RLock()
		if thb, ok := ratesStore["THB"]; ok && thb.RateToLak > 0 {
			rates["LAK"] = thb.RateToLak
		}
		if usd, ok := ratesStore["USD"]; ok && usd.RateToLak > 0 && rates["LAK"] > 0 {
			rates["USD"] = rates["LAK"] / usd.RateToLak
		}
		ratesMutex.RUnlock()
	}

	// 2. Try fetching from public Open Exchange API if available
	client := http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get("https://open.er-api.com/v6/latest/THB")
	if err == nil && resp.StatusCode == http.StatusOK {
		var apiRes struct {
			Rates map[string]float64 `json:"rates"`
		}
		if decErr := json.NewDecoder(resp.Body).Decode(&apiRes); decErr == nil && len(apiRes.Rates) > 0 {
			// Only update if not explicitly set from custom DB
			if _, hasCustomDB := rates["LAK"]; !hasCustomDB {
				if lak, ok := apiRes.Rates["LAK"]; ok && lak > 0 {
					rates["LAK"] = lak
				}
			}
			if cny, ok := apiRes.Rates["CNY"]; ok && cny > 0 {
				rates["CNY"] = cny
			}
			if usd, ok := apiRes.Rates["USD"]; ok && usd > 0 && rates["USD"] == 0.0285 {
				rates["USD"] = usd
			}
			log.Printf("[EXCHANGE PROXY] Successfully fetched live rates from Open Exchange API: LAK=%.2f, CNY=%.4f", rates["LAK"], rates["CNY"])
		}
		_ = resp.Body.Close()
	}

	cachedData := CurrencyExchangeResponse{
		Base:      "THB",
		Rates:     rates,
		UpdatedAt: now,
		ExpiresAt: expires,
		Source:    "Som-Sing Central Exchange Rates (DB / Bank of Thailand / Open Exchange)",
	}

	exchangeCache = &cachedExchangeRates{
		data:      cachedData,
		expiresAt: expires,
	}

	return cachedData
}

// HandleGetPublicExchangeRates exposes public endpoint for customer storefront
func HandleGetPublicExchangeRates(c *gin.Context) {
	rates := FetchOrGetCachedExchangeRates()
	c.JSON(http.StatusOK, rates)
}
