package pricing

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type CurrencyRate struct {
	Currency  string    `json:"currency"`
	RateToLak float64   `json:"rate_to_lak"`
	UpdatedAt time.Time `json:"updated_at"`
}

var (
	ratesStore = map[string]CurrencyRate{
		"THB": {Currency: "THB", RateToLak: 630.50, UpdatedAt: time.Now()},
		"USD": {Currency: "USD", RateToLak: 22100.00, UpdatedAt: time.Now()},
		"LAK": {Currency: "LAK", RateToLak: 1.00, UpdatedAt: time.Now()},
	}
	ratesMutex sync.RWMutex
)

// HandleGetRates returns daily exchange rates
func HandleGetRates(c *gin.Context) {
	ratesMutex.RLock()
	defer ratesMutex.RUnlock()

	c.JSON(http.StatusOK, ratesStore)
}

// HandleUpdateRate updates rate values
func HandleUpdateRate(c *gin.Context) {
	var req CurrencyRate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rate parameters"})
		return
	}

	ratesMutex.Lock()
	defer ratesMutex.Unlock()

	req.UpdatedAt = time.Now()
	ratesStore[req.Currency] = req

	c.JSON(http.StatusOK, req)
}

// GetExchangeRateSnapshot retrieves rate for pricing calculations
func GetExchangeRateSnapshot(currency string) float64 {
	ratesMutex.RLock()
	defer ratesMutex.RUnlock()

	if rate, exists := ratesStore[currency]; exists {
		return rate.RateToLak
	}
	return 1.0
}
