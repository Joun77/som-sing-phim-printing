package orders

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
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
	storeMutex.Unlock()

	var itemsList []OrderItem
	var totalPrice, totalCost float64

	for idx, itemReq := range req.Items {
		qty := itemReq.Quantity
		if qty <= 0 && itemReq.QuantityRequired > 0 {
			qty = itemReq.QuantityRequired
		}
		if qty <= 0 {
			qty = 1
		}

		paperSku := itemReq.PaperSku
		paperCost := itemReq.PaperCostPerUnit
		if itemReq.PaperSetup != nil {
			if itemReq.PaperSetup.InventoryMaterialID != "" {
				paperSku = itemReq.PaperSetup.InventoryMaterialID
			}
			if itemReq.PaperSetup.CostPerSheet > 0 {
				paperCost = itemReq.PaperSetup.CostPerSheet
			}
		}

		var pricingPrintingProcesses []pricing.PrinterProcessSetup
		for _, p := range itemReq.PrintingProcesses {
			var channels []pricing.ColorChannel
			for _, ch := range p.ColorChannels {
				channels = append(channels, pricing.ColorChannel{
					ChannelName: ch.ChannelName,
					DensityPct:  ch.DensityPct,
					IsSpotColor: ch.IsSpotColor,
				})
			}
			pricingPrintingProcesses = append(pricingPrintingProcesses, pricing.PrinterProcessSetup{
				PrinterAssetID: p.PrinterAssetID,
				Sequence:       p.Sequence,
				ColorMode:      p.ColorMode,
				AverageDensity: p.AverageDensity,
				AllocatedPages: qty,
				ColorChannels:  channels,
			})
		}

		var pricingFinishingProcesses []pricing.FinishingProcessSetup
		for _, f := range itemReq.FinishingProcesses {
			pricingFinishingProcesses = append(pricingFinishingProcesses, pricing.FinishingProcessSetup{
				FinishingType:          f.FinishingType,
				MachineAssetID:         f.MachineAssetID,
				EstimatedSetupTimeMins: f.EstimatedSetupTimeMins,
				EstimatedRunTimeMins:   f.EstimatedRunTimeMins,
				UnitCost:               f.UnitCost,
			})
		}

		pricingReq := pricing.CalculationRequest{
			JobName:            itemReq.JobName,
			Quantity:           qty,
			PaperSku:           paperSku,
			PaperCostPerUnit:   paperCost,
			PaperFormat:        itemReq.PaperFormat,
			UnfoldedWidthMM:    itemReq.UnfoldedWidthMM,
			UnfoldedHeightMM:   itemReq.UnfoldedHeightMM,
			PrintingProcesses:  pricingPrintingProcesses,
			FinishingProcesses: pricingFinishingProcesses,
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

		specs := itemReq.Specs
		if specs == nil {
			specs = make(map[string]interface{})
		}
		if itemReq.PaperSetup != nil {
			specs["paper_setup"] = itemReq.PaperSetup
		}
		if len(itemReq.PrintingProcesses) > 0 {
			specs["printing_processes"] = itemReq.PrintingProcesses
		}
		if len(itemReq.FinishingProcesses) > 0 {
			specs["finishing_processes"] = itemReq.FinishingProcesses
		}
		if itemReq.UnfoldedWidthMM > 0 {
			specs["unfolded_width_mm"] = itemReq.UnfoldedWidthMM
		}
		if itemReq.UnfoldedHeightMM > 0 {
			specs["unfolded_height_mm"] = itemReq.UnfoldedHeightMM
		}

		itemName := itemReq.ItemName
		if itemName == "" {
			itemName = itemReq.JobName
		}
		if itemName == "" {
			itemName = fmt.Sprintf("Item #%d", idx+1)
		}

		pageCount := itemReq.PageCount
		if pageCount <= 0 {
			pageCount = 1
		}
		paperSize := itemReq.PaperSize
		if paperSize == "" {
			paperSize = "A5"
		}
		spineWidth := itemReq.SpineWidthMM
		if spineWidth <= 0 && pageCount > 1 {
			spineWidth = pricing.CalculateSpineWidthMM(pageCount, 80)
		}

		unitCost := pricingRes.TotalCost / float64(qty)
		unitPrice := pricingRes.UnitPrice
		itemTotalPrice := pricingRes.SalePrice

		orderItem := OrderItem{
			ID:                fmt.Sprintf("item-%s-%d", orderID, idx+1),
			OrderID:           orderID,
			JobName:           itemName,
			ItemName:          itemName,
			Quantity:          qty,
			PageCount:         pageCount,
			PaperSize:         paperSize,
			CoverPaperID:      itemReq.CoverPaperID,
			InnerPaperID:      itemReq.InnerPaperID,
			CoverFileURL:      itemReq.CoverFileURL,
			InnerFileURL:      itemReq.InnerFileURL,
			BindingType:       BindingType(itemReq.BindingType),
			SpineWidthMM:      spineWidth,
			CurrentStep:       StepPending,
			AvgCovC:           itemReq.AvgCovC,
			AvgCovM:           itemReq.AvgCovM,
			AvgCovY:           itemReq.AvgCovY,
			AvgCovK:           itemReq.AvgCovK,
			UnitCostLAK:       unitCost,
			UnitPriceLAK:      unitPrice,
			TotalPriceLAK:     itemTotalPrice,
			UnitPriceSnapshot: unitPrice,
			CostPriceSnapshot: unitCost,
			Specs:             specs,
			CreatedAt:         time.Now(),
			UpdatedAt:         time.Now(),
		}

		itemsList = append(itemsList, orderItem)
		totalPrice += pricingRes.SalePrice
		totalCost += pricingRes.TotalCost
	}

	orderNo := req.OrderNo
	if orderNo == "" {
		orderNo = fmt.Sprintf("ORD-%s-%03d", time.Now().Format("200601"), orderSeq)
	}

	depositLAK := req.DepositLAK
	remainingLAK := totalPrice - depositLAK
	if remainingLAK < 0 {
		remainingLAK = 0
	}

	newOrder := Order{
		ID:              orderID,
		OrderNo:         orderNo,
		OrderNumber:     orderNo,
		CustomerID:      req.CustomerID,
		CustomerName:    req.CustomerName,
		CustomerPhone:   req.CustomerPhone,
		TotalAmountLAK:  totalPrice,
		DepositLAK:      depositLAK,
		RemainingLAK:    remainingLAK,
		OverallStatus:   StatusWaitingDeposit,
		Status:          StatusWaitingDeposit,
		DeliveryDate:    req.DeliveryDate,
		DepositAmount:   depositLAK,
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
		if err := dischargeFIFOStockForOrder(order); err != nil {
			log.Printf("[FIFO STOCK ERROR] Failed to discharge inventory for order %s: %v", order.ID, err)
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Insufficient inventory stock for FIFO discharge",
				"details": err.Error(),
			})
			return
		}
	}

	if db.DB != nil {
		_ = updateOrderDepositAndStatusInDB(order.ID, order.DepositAmount, string(order.Status))
	}

	storeMutex.Lock()
	ordersStore[orderID] = order
	storeMutex.Unlock()

	c.JSON(http.StatusOK, order)
}

func dischargeFIFOStockForOrder(o Order) error {
	if db.DB == nil {
		return nil
	}
	tx, err := db.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for _, item := range o.Items {
		paperSku, _ := item.Specs["paper_sku"].(string)
		if paperSku == "" {
			paperSku, _ = item.Specs["paperSku"].(string)
		}
		if paperSku == "" {
			continue
		}

		qtyNeeded := float64(item.Quantity)

		rows, err := tx.Query(`
			SELECT id, quantity
			FROM inventory_batches
			WHERE sku_id = $1 AND quantity > 0
			ORDER BY received_date ASC, created_at ASC
			FOR UPDATE
		`, paperSku)

		if err != nil {
			_, _ = tx.Exec(`UPDATE materials SET stock_qty = GREATEST(0, stock_qty - $1) WHERE sku = $2 OR id = $2`, qtyNeeded, paperSku)
			continue
		}

		type batchRecord struct {
			id  string
			qty float64
		}
		var batches []batchRecord
		for rows.Next() {
			var b batchRecord
			if err := rows.Scan(&b.id, &b.qty); err == nil {
				batches = append(batches, b)
			}
		}
		if err := rows.Err(); err != nil {
			log.Printf("[DB WARNING] batches rows iteration error: %v", err)
		}
		rows.Close()

		if len(batches) > 0 {
			var totalAvail float64
			for _, b := range batches {
				totalAvail += b.qty
			}

			if totalAvail < qtyNeeded {
				return fmt.Errorf("insufficient stock for SKU %s: required %.0f, available %.0f", paperSku, qtyNeeded, totalAvail)
			}

			rem := qtyNeeded
			for _, b := range batches {
				if rem <= 0 {
					break
				}
				deduct := b.qty
				if rem < deduct {
					deduct = rem
				}
				_, err := tx.Exec(`UPDATE inventory_batches SET quantity = quantity - $1 WHERE id = $2`, deduct, b.id)
				if err != nil {
					return err
				}
				rem -= deduct
			}
		}

		_, _ = tx.Exec(`UPDATE materials SET stock_qty = GREATEST(0, stock_qty - $1) WHERE sku = $2 OR id = $2`, qtyNeeded, paperSku)
	}

	return tx.Commit()
}

// --- DB HELPERS FOR ORDERS ---

func getOrdersFromDB() ([]Order, error) {
	query := `
		SELECT id, COALESCE(order_no, order_number), customer_name, COALESCE(customer_phone, ''), 
		       COALESCE(overall_status, status::text), COALESCE(deposit_lak, deposit_amount), 
		       COALESCE(total_amount_lak, total_price), total_cost, COALESCE(google_drive_link, ''),
		       COALESCE(customer_id, ''), COALESCE(remaining_lak, 0), COALESCE(delivery_date, ''),
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
			&o.ID, &o.OrderNo, &o.CustomerName, &o.CustomerPhone, &st,
			&o.DepositLAK, &o.TotalAmountLAK, &o.TotalCost, &o.GoogleDriveLink,
			&o.CustomerID, &o.RemainingLAK, &o.DeliveryDate,
			&o.CreatedAt, &o.UpdatedAt,
		)
		if err != nil {
			continue
		}
		o.OrderNumber = o.OrderNo
		o.OverallStatus = OrderStatus(st)
		o.Status = OrderStatus(st)
		o.DepositAmount = o.DepositLAK
		o.TotalPrice = o.TotalAmountLAK
		o.Items, _ = getOrderItemsFromDB(o.ID)
		list = append(list, o)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return list, nil
}

func getOrderByIDFromDB(orderID string) (Order, error) {
	var o Order
	query := `
		SELECT id, COALESCE(order_no, order_number), customer_name, COALESCE(customer_phone, ''), 
		       COALESCE(overall_status, status::text), COALESCE(deposit_lak, deposit_amount), 
		       COALESCE(total_amount_lak, total_price), total_cost, COALESCE(google_drive_link, ''),
		       COALESCE(customer_id, ''), COALESCE(remaining_lak, 0), COALESCE(delivery_date, ''),
		       created_at, updated_at
		FROM orders
		WHERE id = $1 OR order_no = $1 OR order_number = $1
	`
	var st string
	err := db.DB.QueryRow(query, orderID).Scan(
		&o.ID, &o.OrderNo, &o.CustomerName, &o.CustomerPhone, &st,
		&o.DepositLAK, &o.TotalAmountLAK, &o.TotalCost, &o.GoogleDriveLink,
		&o.CustomerID, &o.RemainingLAK, &o.DeliveryDate,
		&o.CreatedAt, &o.UpdatedAt,
	)
	if err != nil {
		return o, err
	}
	o.OrderNumber = o.OrderNo
	o.OverallStatus = OrderStatus(st)
	o.Status = OrderStatus(st)
	o.DepositAmount = o.DepositLAK
	o.TotalPrice = o.TotalAmountLAK
	o.Items, _ = getOrderItemsFromDB(o.ID)
	return o, nil
}

func getOrderItemsFromDB(orderID string) ([]OrderItem, error) {
	query := `
		SELECT id, order_id, COALESCE(item_name, job_name), quantity, unit_price_snapshot, cost_price_snapshot, specs,
		       COALESCE(page_count, 1), COALESCE(paper_size, 'A5'), COALESCE(cover_paper_id, ''), COALESCE(inner_paper_id, ''),
		       COALESCE(cover_file_url, ''), COALESCE(inner_file_url, ''), COALESCE(binding_type, 'NONE'),
		       COALESCE(spine_width_mm, 0), COALESCE(current_step, 'PENDING'),
		       COALESCE(avg_cov_c, 0), COALESCE(avg_cov_m, 0), COALESCE(avg_cov_y, 0), COALESCE(avg_cov_k, 0),
		       COALESCE(unit_cost_lak, 0), COALESCE(unit_price_lak, 0), COALESCE(total_price_lak, 0)
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
		var bType, cStep string
		err := rows.Scan(
			&item.ID, &item.OrderID, &item.ItemName, &item.Quantity,
			&item.UnitPriceSnapshot, &item.CostPriceSnapshot, &specsJSON,
			&item.PageCount, &item.PaperSize, &item.CoverPaperID, &item.InnerPaperID,
			&item.CoverFileURL, &item.InnerFileURL, &bType,
			&item.SpineWidthMM, &cStep,
			&item.AvgCovC, &item.AvgCovM, &item.AvgCovY, &item.AvgCovK,
			&item.UnitCostLAK, &item.UnitPriceLAK, &item.TotalPriceLAK,
		)
		if err != nil {
			continue
		}
		item.JobName = item.ItemName
		item.BindingType = BindingType(bType)
		item.CurrentStep = ProductionStep(cStep)
		if item.UnitPriceLAK == 0 {
			item.UnitPriceLAK = item.UnitPriceSnapshot
		}
		if item.UnitCostLAK == 0 {
			item.UnitCostLAK = item.CostPriceSnapshot
		}
		if item.TotalPriceLAK == 0 {
			item.TotalPriceLAK = item.UnitPriceSnapshot * float64(item.Quantity)
		}

		if len(specsJSON) > 0 {
			json.Unmarshal(specsJSON, &item.Specs)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

func saveOrderToDB(o Order) error {
	orderQuery := `
		INSERT INTO orders (id, order_no, order_number, customer_id, customer_name, customer_phone, 
		                    status, overall_status, deposit_amount, deposit_lak, remaining_lak,
		                    total_price, total_amount_lak, total_cost, delivery_date, google_drive_link, 
		                    created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET
			status = EXCLUDED.status,
			overall_status = EXCLUDED.overall_status,
			deposit_amount = EXCLUDED.deposit_amount,
			deposit_lak = EXCLUDED.deposit_lak,
			remaining_lak = EXCLUDED.remaining_lak,
			updated_at = NOW()
	`
	_, err := db.DB.Exec(orderQuery,
		o.ID, o.OrderNo, o.OrderNumber, o.CustomerID, o.CustomerName, o.CustomerPhone,
		string(o.Status), string(o.OverallStatus), o.DepositAmount, o.DepositLAK, o.RemainingLAK,
		o.TotalPrice, o.TotalAmountLAK, o.TotalCost, o.DeliveryDate, o.GoogleDriveLink,
	)
	if err != nil {
		return err
	}

	for _, item := range o.Items {
		specsBytes, _ := json.Marshal(item.Specs)
		itemQuery := `
			INSERT INTO order_items (id, order_id, job_name, item_name, quantity, page_count, paper_size,
			                         cover_paper_id, inner_paper_id, cover_file_url, inner_file_url,
			                         binding_type, spine_width_mm, current_step, avg_cov_c, avg_cov_m, avg_cov_y, avg_cov_k,
			                         unit_cost_lak, unit_price_lak, total_price_lak,
			                         unit_price_snapshot, cost_price_snapshot, specs, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24::jsonb, NOW(), NOW())
			ON CONFLICT (id) DO UPDATE SET
				current_step = EXCLUDED.current_step,
				cover_file_url = EXCLUDED.cover_file_url,
				inner_file_url = EXCLUDED.inner_file_url,
				updated_at = NOW()
		`
		_, _ = db.DB.Exec(itemQuery,
			item.ID, o.ID, item.JobName, item.ItemName, item.Quantity, item.PageCount, item.PaperSize,
			item.CoverPaperID, item.InnerPaperID, item.CoverFileURL, item.InnerFileURL,
			string(item.BindingType), item.SpineWidthMM, string(item.CurrentStep), item.AvgCovC, item.AvgCovM, item.AvgCovY, item.AvgCovK,
			item.UnitCostLAK, item.UnitPriceLAK, item.TotalPriceLAK,
			item.UnitPriceSnapshot, item.CostPriceSnapshot, string(specsBytes),
		)
	}
	return nil
}

func updateOrderDepositAndStatusInDB(orderID string, deposit float64, status string) error {
	query := `
		UPDATE orders SET deposit_amount = $1, deposit_lak = $1, status = $2, overall_status = $2, updated_at = NOW()
		WHERE id = $3
	`
	_, err := db.DB.Exec(query, deposit, status, orderID)
	return err
}

// HandleUploadOrderFile saves uploaded PDF files in ./uploads/orders/{order_no}/
func HandleUploadOrderFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing 'file' parameter", "details": err.Error()})
		return
	}

	orderNo := c.DefaultPostForm("order_no", "temp_order")
	itemID := c.DefaultPostForm("item_id", "item1")
	fileType := c.DefaultPostForm("file_type", "inner") // "cover" or "inner"

	targetDir := fmt.Sprintf("./uploads/orders/%s", orderNo)
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order directory"})
		return
	}

	safeFileName := fmt.Sprintf("%s_%s_%s", itemID, fileType, filepath.Base(file.Filename))
	destinationPath := filepath.Join(targetDir, safeFileName)

	if err := c.SaveUploadedFile(file, destinationPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file", "details": err.Error()})
		return
	}

	fileURL := fmt.Sprintf("/api/v1/orders/files/orders/%s/%s", orderNo, safeFileName)

	c.JSON(http.StatusOK, gin.H{
		"file_name": file.Filename,
		"file_url":  fileURL,
		"order_no":  orderNo,
		"item_id":   itemID,
		"file_type": fileType,
	})
}

// HandleUpdateOrderItemStep updates the production step for a specific OrderItem
func HandleUpdateOrderItemStep(c *gin.Context) {
	itemID := c.Param("id")

	var req struct {
		CurrentStep   ProductionStep `json:"current_step" binding:"required"`
		SpoilageCount int            `json:"spoilage_count"`
		Notes         string         `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload", "details": err.Error()})
		return
	}

	storeMutex.Lock()
	defer storeMutex.Unlock()

	var targetOrder *Order
	var targetItem *OrderItem

	for k := range ordersStore {
		o := ordersStore[k]
		for i := range o.Items {
			if o.Items[i].ID == itemID {
				targetOrder = &o
				targetItem = &o.Items[i]
				break
			}
		}
		if targetOrder != nil {
			break
		}
	}

	if targetItem != nil {
		targetItem.CurrentStep = req.CurrentStep
		targetItem.UpdatedAt = time.Now()

		// Cascade update overall status of Order
		allCompleted := true
		anyInProgress := false
		for _, item := range targetOrder.Items {
			if item.CurrentStep != StepReadyForPickup && item.CurrentStep != StepCompleted {
				allCompleted = false
			}
			if item.CurrentStep != StepPending {
				anyInProgress = true
			}
		}

		if allCompleted {
			targetOrder.OverallStatus = StatusCompleted
			targetOrder.Status = StatusCompleted
		} else if anyInProgress {
			targetOrder.OverallStatus = StatusInProduction
			targetOrder.Status = StatusInProduction
		}
		targetOrder.UpdatedAt = time.Now()
		ordersStore[targetOrder.ID] = *targetOrder
	}

	if db.DB != nil {
		itemUpdateQuery := `UPDATE order_items SET current_step = $1, updated_at = NOW() WHERE id = $2`
		_, _ = db.DB.Exec(itemUpdateQuery, string(req.CurrentStep), itemID)

		if req.SpoilageCount > 0 {
			spoilageLogQuery := `
				INSERT INTO inventory_transactions (id, qty_adjusted, type, notes, created_at)
				VALUES (uuid_generate_v4(), $1, 'wastage', $2, NOW())
			`
			notes := fmt.Sprintf("Actual Spoilage logged for item %s: %s", itemID, req.Notes)
			_, _ = db.DB.Exec(spoilageLogQuery, -float64(req.SpoilageCount), notes)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Step updated successfully",
		"item_id":      itemID,
		"current_step": req.CurrentStep,
	})
}

// HandleGetOrderByOrderNo fetches order details by order_no for shop floor tracker
func HandleGetOrderByOrderNo(c *gin.Context) {
	orderNo := c.Param("order_no")

	storeMutex.RLock()
	for _, o := range ordersStore {
		if o.OrderNo == orderNo || o.OrderNumber == orderNo || o.ID == orderNo {
			storeMutex.RUnlock()
			c.JSON(http.StatusOK, o)
			return
		}
	}
	storeMutex.RUnlock()

	if db.DB != nil {
		order, err := getOrderByIDFromDB(orderNo)
		if err == nil {
			c.JSON(http.StatusOK, order)
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
}
