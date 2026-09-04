package pricing

import (
	"log"
	"net/http"
	"sync"
	"time"

	"backend/db"

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

// HandleGetRates returns daily exchange rates from DB or memory fallback
func HandleGetRates(c *gin.Context) {
	if db.DB != nil {
		dbRates, err := getRatesFromDB()
		if err == nil && len(dbRates) > 0 {
			c.JSON(http.StatusOK, dbRates)
			return
		}
	}

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

	req.UpdatedAt = time.Now()

	if db.DB != nil {
		err := saveRateToDB(req)
		if err != nil {
			log.Printf("[DB ERROR] Failed to save currency rate: %v", err)
		}
	}

	ratesMutex.Lock()
	ratesStore[req.Currency] = req
	ratesMutex.Unlock()

	// Invalidate exchange proxy cache so all browsers immediately get updated rates
	InvalidateExchangeCache()

	c.JSON(http.StatusOK, req)
}

// GetExchangeRateSnapshot retrieves rate for pricing calculations
func GetExchangeRateSnapshot(currency string) float64 {
	if db.DB != nil {
		var rate float64
		err := db.DB.QueryRow("SELECT rate_to_lak FROM currency_rates WHERE currency_code = $1", currency).Scan(&rate)
		if err == nil && rate > 0 {
			return rate
		}
	}

	ratesMutex.RLock()
	defer ratesMutex.RUnlock()

	if rate, exists := ratesStore[currency]; exists {
		return rate.RateToLak
	}
	return 1.0
}

func getRatesFromDB() (map[string]CurrencyRate, error) {
	query := "SELECT currency_code, rate_to_lak, updated_at FROM currency_rates"
	rows, err := db.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	res := make(map[string]CurrencyRate)
	for rows.Next() {
		var cr CurrencyRate
		err := rows.Scan(&cr.Currency, &cr.RateToLak, &cr.UpdatedAt)
		if err != nil {
			continue
		}
		res[cr.Currency] = cr
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return res, nil
}

func saveRateToDB(cr CurrencyRate) error {
	query := `
		INSERT INTO currency_rates (currency_code, rate_to_lak, updated_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (currency_code) DO UPDATE SET
			rate_to_lak = EXCLUDED.rate_to_lak,
			updated_at = NOW()
	`
	_, err := db.DB.Exec(query, cr.Currency, cr.RateToLak)
	return err
}
