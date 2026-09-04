package handler

import (
	"net/http"

	"backend/db"
	"backend/internal/domain"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

type InventoryHandler struct {
	svc *service.InventoryService
}

func NewInventoryHandler() *InventoryHandler {
	return &InventoryHandler{
		svc: service.NewInventoryService(db.GetDB()),
	}
}

// RegisterRoutes registers all inventory management routes on the router
func (h *InventoryHandler) RegisterRoutes(r *gin.Engine) {
	inv := r.Group("/api/v1/inventory")
	{
		// Inbound Procurement
		inv.POST("/inbound", h.HandleProcessInbound)
		inv.GET("/inbound", h.HandleGetInboundHistory)
		inv.POST("/inbound/:id/cancel", h.HandleCancelInbound)
		inv.DELETE("/inbound/:id", h.HandleDeleteInbound)

		// Materials Management
		inv.GET("/materials", h.HandleGetMaterials)
		inv.GET("/materials/:id", h.HandleGetMaterialByID)
		inv.PUT("/materials/:id", h.HandleUpdateMaterialDirect)

		// Ink Bottle Inventory
		inv.GET("/ink-bottles", h.HandleGetInkBottles)
		inv.POST("/ink-bottles", h.HandleIntakeInkBottle)
		inv.POST("/ink-bottles/deduct", h.HandleDeductInkBottle)
	}

	// Legacy materials aliases for backward compatibility
	r.GET("/api/v1/materials", h.HandleGetMaterials)
	r.GET("/api/v1/materials/:id", h.HandleGetMaterialByID)
	r.PUT("/api/v1/materials/:id", h.HandleUpdateMaterialDirect)
}


// HandleProcessInbound processes an inbound item procurement with atomic moving average cost update
func (h *InventoryHandler) HandleProcessInbound(c *gin.Context) {
	var req domain.CreateInboundPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid request payload: " + err.Error()})
		return
	}

	record, err := h.svc.ProcessStockInbound(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Stock inbound processed successfully",
		"data":    record,
	})
}

// HandleCancelInbound reverses an inbound record and decreases material stock
func (h *InventoryHandler) HandleCancelInbound(c *gin.Context) {
	var req domain.CancelInboundPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid request payload: " + err.Error()})
		return
	}

	// Support ID from URL param if not in body
	if req.InboundID == "" {
		req.InboundID = c.Param("id")
	}

	record, err := h.svc.CancelStockInbound(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Inbound record cancelled and stock reverted",
		"data":    record,
	})
}

// HandleDeleteInbound deletes an inbound record by ID or Lot Number
func (h *InventoryHandler) HandleDeleteInbound(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.DeleteInbound(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Inbound record deleted"})
}

// HandleGetInboundHistory returns procurement inbound logs
func (h *InventoryHandler) HandleGetInboundHistory(c *gin.Context) {
	list, err := h.svc.GetInboundHistory(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if list == nil {
		list = []domain.StockInboundRecord{}
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   list,
	})
}

// HandleGetMaterials returns all master inventory materials
func (h *InventoryHandler) HandleGetMaterials(c *gin.Context) {
	list, err := h.svc.GetAllMaterials(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if list == nil {
		list = []domain.Material{}
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   list,
	})
}

// HandleGetMaterialByID returns a single material by ID or SKU
func (h *InventoryHandler) HandleGetMaterialByID(c *gin.Context) {
	id := c.Param("id")
	item, err := h.svc.GetMaterialByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Material not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   item,
	})
}

// HandleUpdateMaterialDirect allows admins to directly update master material without duplicate records
func (h *InventoryHandler) HandleUpdateMaterialDirect(c *gin.Context) {
	id := c.Param("id")
	var req domain.UpdateMaterialPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	updated, err := h.svc.UpdateMaterialDirect(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Material updated successfully",
		"data":    updated,
	})
}

// HandleGetInkBottles returns ink bottle inventory for shop floor tracking
func (h *InventoryHandler) HandleGetInkBottles(c *gin.Context) {
	list, err := h.svc.GetInkBottles(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if list == nil {
		list = []domain.InkBottleInventory{}
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   list,
	})
}

// HandleIntakeInkBottle adds new bottles into stock
func (h *InventoryHandler) HandleIntakeInkBottle(c *gin.Context) {
	var req domain.IntakeInkBottleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	item, err := h.svc.IntakeInkBottle(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Ink bottles added to inventory",
		"data":    item,
	})
}

// HandleDeductInkBottle deducts bottles when refilling a printer
func (h *InventoryHandler) HandleDeductInkBottle(c *gin.Context) {
	var req domain.DeductInkBottleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	item, err := h.svc.DeductInkBottle(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Ink bottle deducted successfully",
		"data":    item,
	})
}
