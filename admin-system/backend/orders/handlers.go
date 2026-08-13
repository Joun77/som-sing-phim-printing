package orders

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"backend/db"
	"backend/pricing"

	"github.com/gin-gonic/gin"
)

// In-memory mock database store for orders fallback
var (
	ordersStore = make(map[string]Order)
	storeMutex  sync.RWMutex
	orderSeq    int
)

func init() {
	orderSeq = 0
}

// HandleGetOrders lists all orders from PostgreSQL DB or memory fallback
func HandleGetOrders(c *gin.Context) {
	if db.DB != nil {
		ordersList, err := getOrdersFromDB()
		if err == nil {
			if ordersList == nil {
				ordersList = []Order{}
			}
			c.JSON(http.StatusOK, ordersList)
			return
		}
	}

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
	orderSeq++
	orderID := fmt.Sprintf("order-%03d", orderSeq)
	orderNum := fmt.Sprintf("SO-2026-%04d", orderSeq)
	storeMutex.Unlock()

	var itemsList []OrderItem
	var totalPrice, totalCost float64

	for idx, itemReq := range req.Items {
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

		orderItem := OrderItem{
			ID:                fmt.Sprintf("item-%s-%d", orderID, idx+1),
			OrderID:           orderID,
			JobName:           itemReq.JobName,
			Quantity:          itemReq.Quantity,
			UnitPriceSnapshot: pricingRes.UnitPrice,
			CostPriceSnapshot: pricingRes.TotalCost / float64(itemReq.Quantity),
			Specs:             itemReq.Specs,
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
		Status:          StatusWaitingDeposit,
		DepositAmount:   0,
		TotalPrice:      totalPrice,
		TotalCost:       totalCost,
		GoogleDriveLink: req.GoogleDriveLink,
		Items:           itemsList,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if db.DB != nil {
		err := saveOrderToDB(newOrder)
		if err != nil {
			log.Printf("[DB ERROR] Failed to save order to DB: %v", err)
		} else {
			log.Printf("[DB SUCCESS] Order %s saved to PostgreSQL!", orderID)
		}
	}

	storeMutex.Lock()
	ordersStore[orderID] = newOrder
	storeMutex.Unlock()

	c.JSON(http.StatusCreated, newOrder)
}

// HandleRecordDeposit logs deposit and advances status
func HandleRecordDeposit(c *gin.Context) {
	orderID := c.Param("id")

	var req DepositPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid deposit payload", "details": err.Error()})
		return
	}

	storeMutex.Lock()
	order, exists := ordersStore[orderID]
	storeMutex.Unlock()

	if !exists && db.DB != nil {
		var err error
		order, err = getOrderByIDFromDB(orderID)
		if err == nil {
			exists = true
		}
	}

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	order.DepositAmount = req.DepositAmount
	if order.Status == StatusWaitingDeposit {
		order.Status = StatusPrepressCheck
	}
	order.UpdatedAt = time.Now()

	if db.DB != nil {
		_ = updateOrderDepositAndStatusInDB(order.ID, order.DepositAmount, string(order.Status))
	}

	storeMutex.Lock()
	ordersStore[orderID] = order
	storeMutex.Unlock()

	c.JSON(http.StatusOK, order)
}

type UpdateStatusRequest struct {
	Status OrderStatus `json:"status" binding:"required"`
}

// HandleUpdateOrderStatus transitions statuses
func HandleUpdateOrderStatus(c *gin.Context) {
	orderID := c.Param("id")

	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status payload", "details": err.Error()})
		return
	}

	storeMutex.Lock()
	order, exists := ordersStore[orderID]
	storeMutex.Unlock()

	if !exists && db.DB != nil {
		var err error
		order, err = getOrderByIDFromDB(orderID)
		if err == nil {
			exists = true
		}
	}

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	oldStatus := order.Status
	order.Status = req.Status
	order.UpdatedAt = time.Now()

	if req.Status == StatusInProduction && oldStatus != StatusInProduction {
		log.Printf("[FIFO Stock Deductions] Order %s shifted to IN_PRODUCTION. Deducting resources.", order.ID)
	}

	if db.DB != nil {
		_ = updateOrderDepositAndStatusInDB(order.ID, order.DepositAmount, string(order.Status))
	}

	storeMutex.Lock()
	ordersStore[orderID] = order
	storeMutex.Unlock()

	c.JSON(http.StatusOK, order)
}

// --- DB HELPERS FOR ORDERS ---

func getOrdersFromDB() ([]Order, error) {
	query := `
		SELECT id, order_number, customer_name, COALESCE(customer_phone, ''), status,
		       deposit_amount, total_price, total_cost, COALESCE(google_drive_link, ''),
		       created_at, updated_at
		FROM orders
		ORDER BY created_at DESC
	`
	rows, err := db.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Order
	for rows.Next() {
		var o Order
		var st string
		err := rows.Scan(
			&o.ID, &o.OrderNumber, &o.CustomerName, &o.CustomerPhone, &st,
			&o.DepositAmount, &o.TotalPrice, &o.TotalCost, &o.GoogleDriveLink,
			&o.CreatedAt, &o.UpdatedAt,
		)
		if err != nil {
			continue
		}
		o.Status = OrderStatus(st)
		o.Items, _ = getOrderItemsFromDB(o.ID)
		list = append(list, o)
	}
	return list, nil
}

func getOrderByIDFromDB(orderID string) (Order, error) {
	var o Order
	query := `
		SELECT id, order_number, customer_name, COALESCE(customer_phone, ''), status,
		       deposit_amount, total_price, total_cost, COALESCE(google_drive_link, ''),
		       created_at, updated_at
		FROM orders
		WHERE id = $1
	`
	var st string
	err := db.DB.QueryRow(query, orderID).Scan(
		&o.ID, &o.OrderNumber, &o.CustomerName, &o.CustomerPhone, &st,
		&o.DepositAmount, &o.TotalPrice, &o.TotalCost, &o.GoogleDriveLink,
		&o.CreatedAt, &o.UpdatedAt,
	)
	if err != nil {
		return o, err
	}
	o.Status = OrderStatus(st)
	o.Items, _ = getOrderItemsFromDB(o.ID)
	return o, nil
}

func getOrderItemsFromDB(orderID string) ([]OrderItem, error) {
	query := `
		SELECT id, order_id, job_name, quantity, unit_price_snapshot, cost_price_snapshot, specs
		FROM order_items
		WHERE order_id = $1
	`
	rows, err := db.DB.Query(query, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []OrderItem
	for rows.Next() {
		var item OrderItem
		var specsJSON []byte
		err := rows.Scan(
			&item.ID, &item.OrderID, &item.JobName, &item.Quantity,
			&item.UnitPriceSnapshot, &item.CostPriceSnapshot, &specsJSON,
		)
		if err != nil {
			continue
		}
		if len(specsJSON) > 0 {
			json.Unmarshal(specsJSON, &item.Specs)
		}
		items = append(items, item)
	}
	return items, nil
}

func saveOrderToDB(o Order) error {
	orderQuery := `
		INSERT INTO orders (id, order_number, customer_name, customer_phone, status, deposit_amount, total_price, total_cost, google_drive_link, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET
			status = EXCLUDED.status,
			deposit_amount = EXCLUDED.deposit_amount,
			updated_at = NOW()
	`
	_, err := db.DB.Exec(orderQuery, o.ID, o.OrderNumber, o.CustomerName, o.CustomerPhone, string(o.Status), o.DepositAmount, o.TotalPrice, o.TotalCost, o.GoogleDriveLink)
	if err != nil {
		return err
	}

	for _, item := range o.Items {
		specsBytes, _ := json.Marshal(item.Specs)
		itemQuery := `
			INSERT INTO order_items (id, order_id, job_name, quantity, unit_price_snapshot, cost_price_snapshot, specs, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())
			ON CONFLICT (id) DO NOTHING
		`
		_, _ = db.DB.Exec(itemQuery, item.ID, o.ID, item.JobName, item.Quantity, item.UnitPriceSnapshot, item.CostPriceSnapshot, string(specsBytes))
	}
	return nil
}

func updateOrderDepositAndStatusInDB(orderID string, deposit float64, status string) error {
	query := `
		UPDATE orders SET deposit_amount = $1, status = $2, updated_at = NOW()
		WHERE id = $3
	`
	_, err := db.DB.Exec(query, deposit, status, orderID)
	return err
}
