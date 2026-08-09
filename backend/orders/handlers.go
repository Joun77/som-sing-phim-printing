package orders

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"backend/pricing"

	"github.com/gin-gonic/gin"
)

// In-memory mock database store for orders
var (
	ordersStore = make(map[string]Order)
	storeMutex  sync.RWMutex
	orderSeq    int
)

func init() {
	// Seed some default mock orders for UI visibility
	ordersStore["order-001"] = Order{
		ID:            "order-001",
		OrderNumber:   "SO-2026-0001",
		CustomerName:  "Vientiane Book Center",
		CustomerPhone: "+856 20 5551 2345",
		Status:        StatusWaitingDeposit,
		DepositAmount: 0,
		TotalPrice:    1250000.0,
		TotalCost:     850000.0,
		GoogleDriveLink: "https://drive.google.com/drive/folders/mock-order-001",
		Items: []OrderItem{
			{
				ID:                 "item-001",
				OrderID:            "order-001",
				JobName:            "A4 Catalog 100pgs Printing",
				Quantity:           50,
				UnitPriceSnapshot:  25000.0,
				CostPriceSnapshot:  17000.0,
				Specs:              map[string]interface{}{"ink_coverage": 30.0, "lamination": "thermal"},
			},
		},
		CreatedAt: time.Now().Add(-2 * time.Hour),
		UpdatedAt: time.Now().Add(-2 * time.Hour),
	}
	orderSeq = 1
}

// HandleGetOrders lists all orders
func HandleGetOrders(c *gin.Context) {
	storeMutex.RLock()
	defer storeMutex.RUnlock()

	ordersList := make([]Order, 0, len(ordersStore))
	for _, o := range ordersStore {
		ordersList = append(ordersList, o)
	}

	c.JSON(http.StatusOK, ordersList)
}

// HandleCreateOrder receives specs, runs calculations, takes snapshots, and inserts order
func HandleCreateOrder(c *gin.Context) {
	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input payload", "details": err.Error()})
		return
	}

	storeMutex.Lock()
	defer storeMutex.Unlock()

	orderSeq++
	orderID := fmt.Sprintf("order-%03d", orderSeq)
	orderNum := fmt.Sprintf("SO-2026-%04d", orderSeq)

	var itemsList []OrderItem
	var totalPrice, totalCost float64

	for idx, itemReq := range req.Items {
		// Run pricing engine calculation
		pricingReq := pricing.CalculationRequest{
			JobName:            itemReq.JobName,
			Quantity:           itemReq.Quantity,
			PaperSku:           itemReq.PaperSku,
			PaperCostPerUnit:   itemReq.PaperCostPerUnit,
			PaperFormat:        itemReq.PaperFormat,
			InkCoveragePercent: itemReq.InkCoveragePercent,
			InkCostPerMl:       itemReq.InkCostPerMl,
			LaminationType:     itemReq.LaminationType,
			LaminationCost:     itemReq.LaminationCost,
			BindingType:        itemReq.BindingType,
			BindingCost:        itemReq.BindingCost,
			LaborCostPerHour:   itemReq.LaborCostPerHour,
			EstimatedHours:     itemReq.EstimatedHours,
			MarkupMargin:       itemReq.MarkupMargin,
		}

		pricingRes, err := pricing.CalculateJobPricing(pricingReq)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to compute item pricing", "details": err.Error()})
			return
		}

		// Take snapshots of calculated pricing
		orderItem := OrderItem{
			ID:                 fmt.Sprintf("item-%s-%d", orderID, idx+1),
			OrderID:            orderID,
			JobName:            itemReq.JobName,
			Quantity:           itemReq.Quantity,
			UnitPriceSnapshot:  pricingRes.UnitPrice,
			CostPriceSnapshot:  pricingRes.TotalCost / float64(itemReq.Quantity), // cost per unit
			Specs:              itemReq.Specs,
		}

		itemsList = append(itemsList, orderItem)
		totalPrice += pricingRes.SalePrice
		totalCost += pricingRes.TotalCost
	}

	newOrder := Order{
		ID:              orderID,
		OrderNumber:     orderNum,
		CustomerName:    req.CustomerName,
		CustomerPhone:   req.CustomerPhone,
		Status:          StatusWaitingDeposit, // Default starting flow
		DepositAmount:   0,
		TotalPrice:      totalPrice,
		TotalCost:       totalCost,
		GoogleDriveLink: req.GoogleDriveLink,
		Items:           itemsList,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	ordersStore[orderID] = newOrder
	c.JSON(http.StatusCreated, newOrder)
}

// HandleRecordDeposit logs deposit and advances status to PREPRESS_CHECK
func HandleRecordDeposit(c *gin.Context) {
	orderID := c.Param("id")

	var req DepositPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid deposit payload", "details": err.Error()})
		return
	}

	storeMutex.Lock()
	defer storeMutex.Unlock()

	order, exists := ordersStore[orderID]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	order.DepositAmount = req.DepositAmount
	// Advance status from WAITING_DEPOSIT to PREPRESS_CHECK as defined in order workflow
	if order.Status == StatusWaitingDeposit {
		order.Status = StatusPrepressCheck
	}
	order.UpdatedAt = time.Now()

	ordersStore[orderID] = order
	c.JSON(http.StatusOK, order)
}

type UpdateStatusRequest struct {
	Status OrderStatus `json:"status" binding:"required"`
}

// HandleUpdateOrderStatus transitions statuses and records stock ledger adjustments
func HandleUpdateOrderStatus(c *gin.Context) {
	orderID := c.Param("id")

	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status payload", "details": err.Error()})
		return
	}

	storeMutex.Lock()
	defer storeMutex.Unlock()

	order, exists := ordersStore[orderID]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	oldStatus := order.Status
	order.Status = req.Status
	order.UpdatedAt = time.Now()

	// If moving to IN_PRODUCTION, log transaction deduction
	if req.Status == StatusInProduction && oldStatus != StatusInProduction {
		log.Printf("[FIFO Stock Deductions] Order %s shifted to IN_PRODUCTION. Deducting resources.", order.ID)
	}

	ordersStore[orderID] = order
	c.JSON(http.StatusOK, order)
}
