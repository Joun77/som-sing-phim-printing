package pricing

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HandleCalculatePrice is the HTTP POST controller for `/api/pricing/calculate`
func HandleCalculatePrice(c *gin.Context) {
	var req CalculationRequest

	// Validate JSON binding
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input parameters",
			"details": err.Error(),
		})
		return
	}

	// Compute pricing breakdown
	res, err := CalculateJobPricing(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Pricing engine calculation failure",
			"details": err.Error(),
		})
		return
	}

	// Return computed results
	c.JSON(http.StatusOK, res)
}

// HandleCalculateBatchImposition is the HTTP POST controller for `/api/v1/pricing/batch-imposition`
func HandleCalculateBatchImposition(c *gin.Context) {
	var req BatchImpositionRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input parameters",
			"details": err.Error(),
		})
		return
	}

	res := CalculateBatchImposition(req)
	c.JSON(http.StatusOK, res)
}

