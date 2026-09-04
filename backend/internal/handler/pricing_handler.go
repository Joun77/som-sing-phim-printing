package handler

import (
	"net/http"

	"backend/db"
	"backend/internal/domain"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

type PricingHandler struct {
	svc *service.PricingService
}

func NewPricingHandler() *PricingHandler {
	return &PricingHandler{
		svc: service.NewPricingService(db.GetDB()),
	}
}

// RegisterRoutes registers all pricing template and calculation endpoints
func (h *PricingHandler) RegisterRoutes(r *gin.Engine) {
	r.POST("/api/v1/pricing/calculate", h.HandleCalculatePrice)
	r.GET("/api/v1/pricing/templates", h.HandleGetTemplates)
	r.GET("/api/v1/pricing/templates/:id", h.HandleGetTemplateByID)
	r.POST("/api/v1/pricing/templates", h.HandleCreateTemplate)
	r.PUT("/api/v1/pricing/templates/:id", h.HandleUpdateTemplate)
}


// HandleCalculatePrice calculates dynamic unit and total pricing with ink coverage surcharge, MOQ and addon options
func (h *PricingHandler) HandleCalculatePrice(c *gin.Context) {
	var req domain.PricingCalculationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid calculation request payload: " + err.Error(),
		})
		return
	}

	breakdown, err := h.svc.CalculatePrice(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Price calculated successfully",
		"data":    breakdown,
	})
}

// HandleGetTemplates returns all available product pricing templates
func (h *PricingHandler) HandleGetTemplates(c *gin.Context) {
	list, err := h.svc.GetPricingTemplates(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	if list == nil {
		list = []domain.ProductPricingTemplate{}
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   list,
	})
}

// HandleGetTemplateByID returns a specific template by its ID
func (h *PricingHandler) HandleGetTemplateByID(c *gin.Context) {
	id := c.Param("id")
	tpl, err := h.svc.GetPricingTemplateByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Pricing template not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   tpl,
	})
}

// HandleCreateTemplate creates a new product pricing template
func (h *PricingHandler) HandleCreateTemplate(c *gin.Context) {
	var payload domain.CreatePricingTemplatePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid template payload: " + err.Error(),
		})
		return
	}

	tpl, err := h.svc.CreatePricingTemplate(c.Request.Context(), payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Pricing template created successfully",
		"data":    tpl,
	})
}

// HandleUpdateTemplate updates an existing product pricing template
func (h *PricingHandler) HandleUpdateTemplate(c *gin.Context) {
	id := c.Param("id")
	var payload domain.UpdatePricingTemplatePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid template update payload: " + err.Error(),
		})
		return
	}

	tpl, err := h.svc.UpdatePricingTemplate(c.Request.Context(), id, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Pricing template updated successfully",
		"data":    tpl,
	})
}

