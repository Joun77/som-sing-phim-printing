package handler

import (
	"net/http"
	"strconv"

	"backend/db"
	"backend/internal/domain"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	svc *service.OrderService
}

func NewOrderHandler() *OrderHandler {
	return &OrderHandler{
		svc: service.NewOrderService(db.GetDB()),
	}
}

// RegisterRoutes registers all order management and state machine endpoints
func (h *OrderHandler) RegisterRoutes(r *gin.Engine) {
	apiV1 := r.Group("/api/v1/orders")
	{
		apiV1.GET("", h.HandleListOrders)
		apiV1.POST("", h.HandleCreateOrder)
		apiV1.GET("/:id", h.HandleGetOrderByID)
		apiV1.PATCH("/:id/status", h.HandleUpdateOrderStatus)
		apiV1.POST("/:id/override-pricing", h.HandleOverridePricing)
		apiV1.GET("/:id/spoilage", h.HandleGetSpoilageLogs)
		apiV1.GET("/:id/history", h.HandleGetStatusHistory)
	}
}

// HandleCreateOrder creates a new Order or Quotation
func (h *OrderHandler) HandleCreateOrder(c *gin.Context) {
	var payload domain.CreateOrderPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid order payload: " + err.Error(),
		})
		return
	}

	order, err := h.svc.CreateOrder(c.Request.Context(), payload)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Order created successfully",
		"data":    order,
	})
}

// HandleListOrders retrieves a paginated list of orders
func (h *OrderHandler) HandleListOrders(c *gin.Context) {
	status := c.Query("status")
	customerName := c.Query("customer_name")
	orderNumber := c.Query("order_number")

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	filter := domain.OrderFilter{
		Status:       domain.OrderStatus(status),
		CustomerName: customerName,
		OrderNumber:  orderNumber,
		Limit:        limit,
		Offset:       offset,
	}

	orders, totalCount, err := h.svc.ListOrders(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":      "success",
		"data":        orders,
		"total_count": totalCount,
		"limit":       limit,
		"offset":      offset,
	})
}

// HandleGetOrderByID retrieves order details by ID or order number
func (h *OrderHandler) HandleGetOrderByID(c *gin.Context) {
	id := c.Param("id")
	order, err := h.svc.GetOrderByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Order not found: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   order,
	})
}

// HandleUpdateOrderStatus transitions status with state machine guard & automated stock deduction at IN_PRODUCTION
func (h *OrderHandler) HandleUpdateOrderStatus(c *gin.Context) {
	id := c.Param("id")
	var payload domain.UpdateOrderStatusPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid status update payload: " + err.Error(),
		})
		return
	}

	updatedOrder, err := h.svc.UpdateOrderStatus(c.Request.Context(), id, payload)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Order status transitioned successfully",
		"data":    updatedOrder,
	})
}

// HandleOverridePricing applies custom unit price override with financial audit log
func (h *OrderHandler) HandleOverridePricing(c *gin.Context) {
	id := c.Param("id")
	var payload domain.OverridePricingPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid pricing override payload: " + err.Error(),
		})
		return
	}

	updatedOrder, err := h.svc.OverridePricing(c.Request.Context(), id, payload)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Order pricing overridden successfully",
		"data":    updatedOrder,
	})
}

// HandleGetSpoilageLogs retrieves all recorded waste and spoilage for an order
func (h *OrderHandler) HandleGetSpoilageLogs(c *gin.Context) {
	id := c.Param("id")
	logs, err := h.svc.GetSpoilageLogs(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	if logs == nil {
		logs = []domain.SpoilageLog{}
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   logs,
	})
}

// HandleGetStatusHistory retrieves lifecycle transition audit logs for an order
func (h *OrderHandler) HandleGetStatusHistory(c *gin.Context) {
	id := c.Param("id")
	histories, err := h.svc.GetStatusHistories(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	if histories == nil {
		histories = []domain.OrderStatusHistory{}
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   histories,
	})
}
