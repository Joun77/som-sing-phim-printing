package pricing

import (
	"errors"
	"net/http"
	"somsing.local/backend/finance"

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
		var op *finance.OperationError
		if errors.As(err, &op) {
			finance.WriteOperationError(c, err)
			return
		}
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

	if req.ImpositionMode != "" && req.ImpositionMode != "ON" {
		finance.WriteOperationError(c, &finance.OperationError{Status: 422, Code: "IMPOSITION_MODE_UNSUPPORTED"})
		return
	}
	res := CalculateBatchImposition(req)
	c.JSON(http.StatusOK, res)
}
