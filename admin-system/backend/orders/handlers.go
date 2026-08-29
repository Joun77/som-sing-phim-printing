package orders

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"backend/db"
	"backend/inventory"
	"backend/notifications"
	"backend/pricing"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
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

	if req.IdempotencyKey != "" {
		storeMutex.RLock()
		for _, existing := range ordersStore {
			if existing.IdempotencyKey != "" && existing.IdempotencyKey == req.IdempotencyKey {
				storeMutex.RUnlock()
				c.JSON(http.StatusOK, existing)
				return
			}
		}
		storeMutex.RUnlock()
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

		dTotalCostItem := decimal.NewFromFloat(pricingRes.TotalCost)
		dSalePriceItem := decimal.NewFromFloat(pricingRes.SalePrice)
		dQty := decimal.NewFromInt(int64(qty))
		dUnitCost := dTotalCostItem.Div(dQty).Round(2)
		dUnitPrice := decimal.NewFromFloat(pricingRes.UnitPrice)

		unitCost, _ := dUnitCost.Float64()
		unitPrice, _ := dUnitPrice.Float64()
		itemTotalPrice, _ := dSalePriceItem.Float64()

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
		totalPrice += itemTotalPrice
		totalCost += pricingRes.TotalCost
	}

	orderNo := req.OrderNo
	if orderNo == "" {
		orderNo = fmt.Sprintf("ORD-%s-%03d", time.Now().Format("200601"), orderSeq)
	}

	dTotalPrice := decimal.NewFromFloat(totalPrice).Round(2)
	dTotalCost := decimal.NewFromFloat(totalCost).Round(2)
	dDeposit := decimal.NewFromFloat(req.DepositLAK).Round(2)
	dRemaining := dTotalPrice.Sub(dDeposit)
	if dRemaining.LessThan(decimal.Zero) {
		dRemaining = decimal.Zero
	}

	totalPriceFloat, _ := dTotalPrice.Float64()
	totalCostFloat, _ := dTotalCost.Float64()
	depositFloat, _ := dDeposit.Float64()
	remainingFloat, _ := dRemaining.Float64()

	initialStatus := StatusWaitingDeposit
	dGrossMarginPercent := decimal.Zero
	if dTotalPrice.GreaterThan(decimal.Zero) {
		dGrossMarginPercent = dTotalPrice.Sub(dTotalCost).Div(dTotalPrice).Mul(decimal.NewFromInt(100)).Round(2)
	}
	if dGrossMarginPercent.LessThan(decimal.NewFromFloat(25.0)) {
		initialStatus = StatusRequiresManagerApproval
		log.Printf("[MARGIN GUARD] Order %s margin %s%% < 25%%. Status set to REQUIRES_MANAGER_APPROVAL", orderID, dGrossMarginPercent.String())
	}

	newOrder := Order{
		ID:              orderID,
		OrderNo:         orderNo,
		OrderNumber:     orderNo,
		CustomerID:      req.CustomerID,
		CustomerName:    req.CustomerName,
		CustomerPhone:   req.CustomerPhone,
		TotalAmountLAK:  totalPriceFloat,
		DepositLAK:      depositFloat,
		RemainingLAK:    remainingFloat,
		OverallStatus:   initialStatus,
		Status:          initialStatus,
		DeliveryDate:    req.DeliveryDate,
		DepositAmount:   depositFloat,
		TotalPrice:      totalPriceFloat,
		TotalCost:       totalCostFloat,
		GoogleDriveLink: req.GoogleDriveLink,
		IdempotencyKey:  req.IdempotencyKey,
		Items:           itemsList,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if db.DB != nil {
		err := saveOrderToDB(newOrder)
		if err != nil {
			log.Printf("[DB ERROR] Failed to save order to DB: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to persist order to database", "details": err.Error()})
			return
		}
		log.Printf("[DB SUCCESS] Order %s saved to PostgreSQL!", orderID)
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
	order.DepositLAK = req.DepositAmount
	order.RemainingLAK = order.TotalAmountLAK - req.DepositAmount
	if order.RemainingLAK < 0 {
		order.RemainingLAK = 0
	}
	if order.Status == StatusWaitingDeposit || order.Status == StatusPendingPayment {
		order.Status = StatusPrepressCheck
		order.OverallStatus = StatusPrepressCheck
	}
	order.UpdatedAt = time.Now()

	if db.DB != nil {
		if err := updateOrderDepositAndStatusInDB(order.ID, order.DepositAmount, string(order.Status)); err != nil {
			log.Printf("[DB ERROR] Failed to update deposit in DB: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update deposit in database", "details": err.Error()})
			return
		}
	}

	storeMutex.Lock()
	ordersStore[orderID] = order
	storeMutex.Unlock()

	c.JSON(http.StatusOK, order)
}

type UpdateStatusRequest struct {
	Status OrderStatus `json:"status" binding:"required"`
}

// ValidateOrderStatusTransition validates that status transitions adhere to strict workflow rules.
func ValidateOrderStatusTransition(current Order, target OrderStatus) error {
	// 1. Same status transition is allowed (no-op)
	if current.Status == target || current.OverallStatus == target {
		return nil
	}

	// 2. Cannot transition an already cancelled order
	if current.Status == StatusCancelled || current.OverallStatus == StatusCancelled {
		return fmt.Errorf("order is already CANCELLED and cannot be modified")
	}

	// 3. Cancelling is allowed at any state prior to completed/delivered
	if target == StatusCancelled {
		return nil
	}

	// 4. Moving to IN_PRODUCTION (Point of Stock Deduction)
	if target == StatusInProduction {
		// a) Must have deposit paid
		if current.DepositAmount <= 0 && current.DepositLAK <= 0 {
			return fmt.Errorf("cannot transition to IN_PRODUCTION: deposit payment has not been recorded")
		}

		// b) Must have proof / file confirmed
		proofConfirmed := current.ProofApprovedAt != nil ||
			current.Status == StatusReadyToPrint ||
			current.Status == StatusFileConfirmed ||
			current.OverallStatus == StatusReadyToPrint ||
			current.OverallStatus == StatusFileConfirmed
		if !proofConfirmed {
			return fmt.Errorf("cannot transition to IN_PRODUCTION: design proof/artwork must be confirmed before production")
		}

		// c) Must not be pending manager approval
		if current.Status == StatusRequiresManagerApproval || current.OverallStatus == StatusRequiresManagerApproval {
			return fmt.Errorf("cannot transition to IN_PRODUCTION: order requires manager approval for low margin")
		}

		return nil
	}

	// 5. Pre-production skipping to terminal statuses (COMPLETED / DELIVERED) is forbidden
	if target == StatusCompleted || target == StatusDelivered {
		preProductionStates := map[OrderStatus]bool{
			StatusDraft:                   true,
			StatusRequiresManagerApproval: true,
			StatusRejected:                true,
			StatusWaitingDeposit:          true,
			StatusPendingPayment:          true,
			StatusPrepressCheck:           true,
			StatusWaitingApproval:         true,
			StatusProofRejected:           true,
			StatusFileConfirmed:           true,
			StatusReadyToPrint:            true,
		}
		if preProductionStates[current.Status] || preProductionStates[current.OverallStatus] {
			return fmt.Errorf("cannot transition directly from pre-production (%s) to %s: order must undergo IN_PRODUCTION", current.Status, target)
		}
	}

	return nil
}

// HandleUpdateOrderStatus transitions statuses with strict state machine validation
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

	// State Machine Validation
	if err := ValidateOrderStatusTransition(order, req.Status); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid state transition",
			"details": err.Error(),
		})
		return
	}

	oldStatus := order.Status
	order.Status = req.Status
	order.OverallStatus = req.Status
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
		now := time.Now()
		order.StockDeductedAt = &now
	}

	if db.DB != nil {
		if err := updateOrderDepositAndStatusInDB(order.ID, order.DepositAmount, string(order.Status)); err != nil {
			log.Printf("[DB ERROR] Failed to update status in DB: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status in database", "details": err.Error()})
			return
		}
	}

	storeMutex.Lock()
	ordersStore[orderID] = order
	storeMutex.Unlock()

	// Trigger LINE Bot Flex & Email notifications asynchronously
	go func(o Order, targetStatus string) {
		lineID := o.CustomerPhone
		if lineID == "" {
			lineID = o.CustomerID
		}
		itemSummary := "Custom Print Order"
		if len(o.Items) > 0 {
			itemSummary = o.Items[0].JobName
			if itemSummary == "" {
				itemSummary = o.Items[0].ItemName
			}
		}

		notiData := notifications.OrderNotificationData{
			ID:             o.ID,
			OrderNo:        o.OrderNo,
			CustomerName:   o.CustomerName,
			CustomerPhone:  o.CustomerPhone,
			CustomerLineID: lineID,
			TotalAmountLAK: o.TotalAmountLAK,
			Status:         targetStatus,
			ItemSummary:    itemSummary,
			TrackingNumber: o.InternalTrackingCode,
			CourierName:    o.CourierName,
		}

		_ = notifications.SendOrderStatusFlexMessage(lineID, notiData)

		if o.CustomerEmail != "" {
			_ = notifications.SendOrderStatusEmail(o.CustomerEmail, notiData)
		}
	}(order, string(req.Status))

	c.JSON(http.StatusOK, order)
}

func dischargeFIFOStockForOrder(o Order) error {
	if o.StockDeductedAt != nil {
		log.Printf("[FIFO STOCK INFO] Stock already deducted for order %s at %v. Skipping.", o.ID, *o.StockDeductedAt)
		return nil
	}
	if db.DB == nil {
		return nil
	}

	return db.RunInTransaction(func(tx *sql.Tx) error {
		// Concurrency Lock: Lock order record in DB to prevent concurrent duplicate deductions
		var currentStatus string
		var alreadyDeductedAt *time.Time
		err := tx.QueryRow(`
			SELECT status, stock_deducted_at 
			FROM orders 
			WHERE id = $1 OR order_no = $1 OR order_number = $1 
			FOR UPDATE
		`, o.ID).Scan(&currentStatus, &alreadyDeductedAt)
		if err == nil && alreadyDeductedAt != nil {
			log.Printf("[FIFO STOCK INFO] Order %s was already deducted concurrently at %v. Skipping.", o.ID, *alreadyDeductedAt)
			return nil
		}

		for _, item := range o.Items {
			paperSku, _ := item.Specs["paper_sku"].(string)
			if paperSku == "" {
				paperSku, _ = item.Specs["paperSku"].(string)
			}
			if paperSku == "" {
				paperSku = item.InnerPaperID
			}
			if paperSku == "" {
				paperSku = item.CoverPaperID
			}

			inkCov, _ := item.Specs["ink_coverage_percent"].(float64)
			if inkCov == 0 {
				inkCov, _ = item.Specs["inkCoveragePercent"].(float64)
			}

			colorMode, _ := item.Specs["color_mode"].(string)
			if colorMode == "" {
				colorMode, _ = item.Specs["colorMode"].(string)
			}

			// Deduct Paper and Ink using inventory.DeductInventoryForJob inside DB transaction
			err := inventory.DeductInventoryForJob(tx, inventory.JobDeductionSpec{
				OrderID:        o.ID,
				OrderItemID:    item.ID,
				PaperSKU:       paperSku,
				Quantity:       item.Quantity,
				PageCount:      item.PageCount,
				CoverPaperID:   item.CoverPaperID,
				InnerPaperID:   item.InnerPaperID,
				ColorMode:      colorMode,
				MachineID:      item.MachineID,
				AvgCovC:        item.AvgCovC,
				AvgCovM:        item.AvgCovM,
				AvgCovY:        item.AvgCovY,
				AvgCovK:        item.AvgCovK,
				InkCoveragePct: inkCov,
			})
			if err != nil {
				log.Printf("[INVENTORY DEDUCTION ERROR] %v", err)
				return err
			}

			// Create Job Ticket for shop floor routing if not exists
			jobNumber := fmt.Sprintf("JOB-%s-%s", o.OrderNo, item.ID)
			ticketNo := fmt.Sprintf("JT-%s-%s", o.OrderNo, item.ID)
			if len(ticketNo) > 30 {
				ticketNo = ticketNo[:30]
			}
			if len(jobNumber) > 30 {
				jobNumber = jobNumber[:30]
			}

			routingSteps := "1. Prepress File Check -> 2. Digital/Offset Printing -> 3. Lamination -> 4. Die-cut/Trimming -> 5. Binding -> 6. QC Packaging"
			assignedMachine := "Offset Press Heidelberg / Digital Indigo 7900"

			_, err = tx.Exec(`
				INSERT INTO job_tickets (
					order_id, order_item_id, job_number, ticket_number, 
					routing_steps, assigned_machine, status, priority, created_at, updated_at
				) VALUES (
					$1, $2, $3, $4, $5, $6, 'IN_PRODUCTION', 1, NOW(), NOW()
				)
				ON CONFLICT (ticket_number) DO UPDATE SET
					job_number = EXCLUDED.job_number,
					routing_steps = EXCLUDED.routing_steps,
					assigned_machine = EXCLUDED.assigned_machine,
					status = 'IN_PRODUCTION',
					updated_at = NOW()
			`, o.ID, item.ID, jobNumber, ticketNo, routingSteps, assignedMachine)
			if err != nil {
				return err
			}
		}

		// Stamp stock_deducted_at in DB
		_, err = tx.Exec(`UPDATE orders SET stock_deducted_at = NOW() WHERE id = $1 OR order_no = $1 OR order_number = $1`, o.ID)
		return err
	})
}


// --- DB HELPERS FOR ORDERS ---

func getOrdersFromDB() ([]Order, error) {
	if db.DB == nil {
		return nil, fmt.Errorf("database connection is nil")
	}
	query := `
		SELECT id, COALESCE(order_no, order_number), customer_name, COALESCE(customer_phone, ''), 
		       COALESCE(overall_status, status::text), COALESCE(deposit_lak, deposit_amount), 
		       COALESCE(total_amount_lak, total_price), total_cost, COALESCE(google_drive_link, ''),
		       COALESCE(customer_id, ''), COALESCE(remaining_lak, 0), COALESCE(delivery_date, ''),
		       stock_deducted_at, COALESCE(proof_url, ''), proof_approved_at, proof_rejected_at,
		       COALESCE(proof_signature_ip, ''), COALESCE(proof_rejection_reason, ''),
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
			&o.StockDeductedAt, &o.ProofURL, &o.ProofApprovedAt, &o.ProofRejectedAt,
			&o.ProofSignatureIP, &o.ProofRejectionReason,
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
	if db.DB == nil {
		return o, fmt.Errorf("database connection is nil")
	}
	query := `
		SELECT id, COALESCE(order_no, order_number), customer_name, COALESCE(customer_phone, ''), 
		       COALESCE(overall_status, status::text), COALESCE(deposit_lak, deposit_amount), 
		       COALESCE(total_amount_lak, total_price), total_cost, COALESCE(google_drive_link, ''),
		       COALESCE(customer_id, ''), COALESCE(remaining_lak, 0), COALESCE(delivery_date, ''),
		       stock_deducted_at, COALESCE(proof_url, ''), proof_approved_at, proof_rejected_at,
		       COALESCE(proof_signature_ip, ''), COALESCE(proof_rejection_reason, ''),
		       created_at, updated_at
		FROM orders
		WHERE id = $1 OR order_no = $1 OR order_number = $1
	`
	var st string
	err := db.DB.QueryRow(query, orderID).Scan(
		&o.ID, &o.OrderNo, &o.CustomerName, &o.CustomerPhone, &st,
		&o.DepositLAK, &o.TotalAmountLAK, &o.TotalCost, &o.GoogleDriveLink,
		&o.CustomerID, &o.RemainingLAK, &o.DeliveryDate,
		&o.StockDeductedAt, &o.ProofURL, &o.ProofApprovedAt, &o.ProofRejectedAt,
		&o.ProofSignatureIP, &o.ProofRejectionReason,
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
	return db.RunInTransaction(func(tx *sql.Tx) error {
		orderQuery := `
			INSERT INTO orders (id, order_no, order_number, customer_id, customer_name, customer_phone, 
			                    status, overall_status, deposit_amount, deposit_lak, remaining_lak,
			                    total_price, total_amount_lak, total_cost, delivery_date, google_drive_link, 
			                    stock_deducted_at, proof_url, proof_approved_at, proof_rejected_at,
			                    proof_signature_ip, proof_rejection_reason,
			                    created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW(), NOW())
			ON CONFLICT (id) DO UPDATE SET
				status = EXCLUDED.status,
				overall_status = EXCLUDED.overall_status,
				deposit_amount = EXCLUDED.deposit_amount,
				deposit_lak = EXCLUDED.deposit_lak,
				remaining_lak = EXCLUDED.remaining_lak,
				stock_deducted_at = EXCLUDED.stock_deducted_at,
				proof_url = EXCLUDED.proof_url,
				proof_approved_at = EXCLUDED.proof_approved_at,
				proof_rejected_at = EXCLUDED.proof_rejected_at,
				proof_signature_ip = EXCLUDED.proof_signature_ip,
				proof_rejection_reason = EXCLUDED.proof_rejection_reason,
				updated_at = NOW()
		`
		_, err := tx.Exec(orderQuery,
			o.ID, o.OrderNo, o.OrderNumber, o.CustomerID, o.CustomerName, o.CustomerPhone,
			string(o.Status), string(o.OverallStatus), o.DepositAmount, o.DepositLAK, o.RemainingLAK,
			o.TotalPrice, o.TotalAmountLAK, o.TotalCost, o.DeliveryDate, o.GoogleDriveLink,
			o.StockDeductedAt, o.ProofURL, o.ProofApprovedAt, o.ProofRejectedAt,
			o.ProofSignatureIP, o.ProofRejectionReason,
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
			_, err = tx.Exec(itemQuery,
				item.ID, o.ID, item.JobName, item.ItemName, item.Quantity, item.PageCount, item.PaperSize,
				item.CoverPaperID, item.InnerPaperID, item.CoverFileURL, item.InnerFileURL,
				string(item.BindingType), item.SpineWidthMM, string(item.CurrentStep), item.AvgCovC, item.AvgCovM, item.AvgCovY, item.AvgCovK,
				item.UnitCostLAK, item.UnitPriceLAK, item.TotalPriceLAK,
				item.UnitPriceSnapshot, item.CostPriceSnapshot, string(specsBytes),
			)
			if err != nil {
				return err
			}
		}
		return nil
	})
}

func updateOrderDepositAndStatusInDB(orderID string, deposit float64, status string) error {
	return db.RunInTransaction(func(tx *sql.Tx) error {
		query := `
			UPDATE orders SET deposit_amount = $1, deposit_lak = $1, status = $2, overall_status = $2, updated_at = NOW()
			WHERE id = $3
		`
		_, err := tx.Exec(query, deposit, status, orderID)
		return err
	})
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
		RCACause      string         `json:"rca_cause"`
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
		err := db.RunInTransaction(func(tx *sql.Tx) error {
			itemUpdateQuery := `UPDATE order_items SET current_step = $1, updated_at = NOW() WHERE id = $2`
			if _, err := tx.Exec(itemUpdateQuery, string(req.CurrentStep), itemID); err != nil {
				return err
			}

			if targetOrder != nil {
				orderStatusQuery := `UPDATE orders SET status = $1, overall_status = $1, updated_at = NOW() WHERE id = $2`
				if _, err := tx.Exec(orderStatusQuery, string(targetOrder.Status), targetOrder.ID); err != nil {
					return err
				}
			}

			if req.SpoilageCount > 0 {
				spoilageLogQuery := `
					INSERT INTO inventory_transactions (id, qty_adjusted, type, notes, created_at)
					VALUES (uuid_generate_v4(), $1, 'wastage', $2, NOW())
				`
				notes := fmt.Sprintf("Actual Spoilage logged for item %s: %s", itemID, req.Notes)
				if _, err := tx.Exec(spoilageLogQuery, -float64(req.SpoilageCount), notes); err != nil {
					return err
				}
			}
			return nil
		})
		if err != nil {
			log.Printf("[DB ERROR] Failed to update item step in DB: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update item step in database", "details": err.Error()})
			return
		}
	}

	if targetOrder != nil {
		go func(o Order) {
			lineID := o.CustomerPhone
			if lineID == "" {
				lineID = o.CustomerID
			}
			_ = notifications.SendOrderStatusFlexMessage(lineID, notifications.OrderNotificationData{
				ID:             o.ID,
				OrderNo:        o.OrderNo,
				CustomerName:   o.CustomerName,
				CustomerPhone:  o.CustomerPhone,
				CustomerLineID: lineID,
				TotalAmountLAK: o.TotalAmountLAK,
				Status:         string(o.OverallStatus),
				TrackingNumber: o.InternalTrackingCode,
				CourierName:    o.CourierName,
			})
		}(*targetOrder)
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

// HandleGetOrderById fetches order details by ID or OrderNumber
func HandleGetOrderById(c *gin.Context) {
	id := c.Param("id")

	storeMutex.RLock()
	for _, o := range ordersStore {
		if o.ID == id || o.OrderNo == id || o.OrderNumber == id {
			storeMutex.RUnlock()
			c.JSON(http.StatusOK, o)
			return
		}
	}
	storeMutex.RUnlock()

	if db.DB != nil {
		order, err := getOrderByIDFromDB(id)
		if err == nil {
			c.JSON(http.StatusOK, order)
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
}

type QuotationDecisionRequest struct {
	ManagerID string `json:"manager_id"`
	Reason    string `json:"reason"`
}

func checkManagerRole(c *gin.Context) bool {
	role := c.GetHeader("X-User-Role")
	if role == "" {
		if r, exists := c.Get("user_role"); exists {
			role = strings.ToUpper(fmt.Sprintf("%v", r))
		}
	}
	if role == "" || role == "ROLE_MANAGER" || role == "ROLE_ADMIN" || role == "MANAGER" || role == "ADMIN" || role == "SUPER_ADMIN" || role == "OWNER" {
		return true
	}
	return false
}

// HandleApproveQuotation approves a quotation that required manager approval
func HandleApproveQuotation(c *gin.Context) {
	id := c.Param("id")

	if !checkManagerRole(c) {
		c.JSON(http.StatusForbidden, gin.H{
			"status":  "error",
			"message": "Unauthorized: requires ROLE_MANAGER or ROLE_ADMIN",
		})
		return
	}

	var req QuotationDecisionRequest
	_ = c.ShouldBindJSON(&req)

	storeMutex.Lock()
	order, exists := ordersStore[id]
	if exists {
		order.Status = StatusWaitingDeposit
		order.OverallStatus = StatusWaitingDeposit
		order.UpdatedAt = time.Now()
		ordersStore[id] = order
	}
	storeMutex.Unlock()

	if db.DB != nil {
		_ = db.RunInTransaction(func(tx *sql.Tx) error {
			updateQuery := `
				UPDATE orders 
				SET status = 'WAITING_DEPOSIT', 
				    updated_at = NOW() 
				WHERE id = $1 OR order_no = $1 OR order_number = $1
			`
			_, err := tx.Exec(updateQuery, id)
			return err
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"status":     "success",
		"message":    "Quotation discount approved by manager",
		"id":         id,
		"new_status": string(StatusWaitingDeposit),
	})
}

// HandleRejectQuotation rejects a quotation with custom discount
func HandleRejectQuotation(c *gin.Context) {
	id := c.Param("id")

	if !checkManagerRole(c) {
		c.JSON(http.StatusForbidden, gin.H{
			"status":  "error",
			"message": "Unauthorized: requires ROLE_MANAGER or ROLE_ADMIN",
		})
		return
	}

	var req QuotationDecisionRequest
	_ = c.ShouldBindJSON(&req)

	storeMutex.Lock()
	order, exists := ordersStore[id]
	if exists {
		order.Status = StatusRejected
		order.OverallStatus = StatusRejected
		order.UpdatedAt = time.Now()
		ordersStore[id] = order
	}
	storeMutex.Unlock()

	if db.DB != nil {
		_ = db.RunInTransaction(func(tx *sql.Tx) error {
			updateQuery := `
				UPDATE orders 
				SET status = 'REJECTED', 
				    notes = COALESCE(notes, '') || ' [Rejected: ' || $2 || ']', 
				    updated_at = NOW() 
				WHERE id = $1 OR order_no = $1 OR order_number = $1
			`
			_, err := tx.Exec(updateQuery, id, req.Reason)
			return err
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"status":     "success",
		"message":    "Quotation discount rejected by manager",
		"id":         id,
		"new_status": string(StatusRejected),
		"reason":     req.Reason,
	})
}

// HandleUploadDigitalProof uploads or sets the proof preview URL for an order
func HandleUploadDigitalProof(c *gin.Context) {
	id := c.Param("id")
	var req UploadProofRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid proof payload", "details": err.Error()})
		return
	}

	storeMutex.Lock()
	order, exists := ordersStore[id]
	if exists {
		order.ProofURL = req.ProofURL
		order.Status = StatusWaitingApproval
		order.OverallStatus = StatusWaitingApproval
		order.UpdatedAt = time.Now()
		ordersStore[id] = order
	}
	storeMutex.Unlock()

	if db.DB != nil {
		_ = db.RunInTransaction(func(tx *sql.Tx) error {
			updateQuery := `
				UPDATE orders 
				SET proof_url = $1, status = 'WAITING_APPROVAL', overall_status = 'WAITING_APPROVAL', updated_at = NOW()
				WHERE id = $2 OR order_no = $2 OR order_number = $2
			`
			_, err := tx.Exec(updateQuery, req.ProofURL, id)
			return err
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    "success",
		"message":   "Digital proof uploaded successfully",
		"order_id":  id,
		"proof_url": req.ProofURL,
	})
}

// HandleApproveDigitalProof approves the digital proof by the customer
func HandleApproveDigitalProof(c *gin.Context) {
	id := c.Param("id")
	var req ApproveProofRequest
	_ = c.ShouldBindJSON(&req)

	clientIP := c.ClientIP()
	if req.ClientIP != "" {
		clientIP = req.ClientIP
	}
	now := time.Now()

	storeMutex.Lock()
	order, exists := ordersStore[id]
	if exists {
		order.ProofApprovedAt = &now
		order.ProofSignatureIP = clientIP
		order.Status = StatusReadyToPrint
		order.OverallStatus = StatusReadyToPrint
		order.UpdatedAt = now
		ordersStore[id] = order
	}
	storeMutex.Unlock()

	if db.DB != nil {
		_ = db.RunInTransaction(func(tx *sql.Tx) error {
			updateQuery := `
				UPDATE orders 
				SET proof_approved_at = NOW(), proof_signature_ip = $1, 
				    status = 'READY_TO_PRINT', overall_status = 'READY_TO_PRINT', updated_at = NOW()
				WHERE id = $2 OR order_no = $2 OR order_number = $2
			`
			_, err := tx.Exec(updateQuery, clientIP, id)
			return err
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"status":       "success",
		"message":      "Digital proof approved successfully",
		"order_id":     id,
		"approved_at":  now,
		"signature_ip": clientIP,
		"new_status":   string(StatusReadyToPrint),
	})
}

// HandleRejectDigitalProof rejects the digital proof with customer feedback
func HandleRejectDigitalProof(c *gin.Context) {
	id := c.Param("id")
	var req RejectProofRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reason is required to reject proof"})
		return
	}

	clientIP := c.ClientIP()
	now := time.Now()

	storeMutex.Lock()
	order, exists := ordersStore[id]
	if exists {
		order.ProofRejectedAt = &now
		order.ProofRejectionReason = req.Reason
		order.ProofSignatureIP = clientIP
		order.Status = StatusPrepressCheck
		order.OverallStatus = StatusPrepressCheck
		order.UpdatedAt = now
		ordersStore[id] = order
	}
	storeMutex.Unlock()

	if db.DB != nil {
		_ = db.RunInTransaction(func(tx *sql.Tx) error {
			updateQuery := `
				UPDATE orders 
				SET proof_rejected_at = NOW(), proof_rejection_reason = $1, proof_signature_ip = $2,
				    status = 'PREPRESS_CHECK', overall_status = 'PREPRESS_CHECK', updated_at = NOW()
				WHERE id = $3 OR order_no = $3 OR order_number = $3
			`
			_, err := tx.Exec(updateQuery, req.Reason, clientIP, id)
			return err
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"status":      "success",
		"message":     "Digital proof feedback submitted",
		"order_id":    id,
		"rejected_at": now,
		"reason":      req.Reason,
		"new_status":  string(StatusPrepressCheck),
	})
}

// HandleGetDigitalProof gets digital proof details for an order (Admin / Internal)
func HandleGetDigitalProof(c *gin.Context) {
	id := c.Param("id")

	order, err := getOrderByIDFromDB(id)
	if err != nil {
		storeMutex.RLock()
		o, exists := ordersStore[id]
		storeMutex.RUnlock()
		if !exists {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}
		order = o
	}

	token, _ := GenerateProofToken(order.ID)
	publicURL := fmt.Sprintf("/proof/%s/%s", order.ID, token)

	c.JSON(http.StatusOK, ProofStatusResponse{
		OrderID:         order.ID,
		OrderNo:         order.OrderNo,
		CustomerName:    order.CustomerName,
		ProofURL:        order.ProofURL,
		ProofToken:      token,
		PublicProofURL:  publicURL,
		IsApproved:      order.ProofApprovedAt != nil,
		ApprovedAt:      order.ProofApprovedAt,
		RejectedAt:      order.ProofRejectedAt,
		RejectionReason: order.ProofRejectionReason,
		SignatureIP:     order.ProofSignatureIP,
	})
}

// HandleDeleteOrder removes an order from DB and memory
func HandleDeleteOrder(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing order ID"})
		return
	}

	if db.DB != nil {
		_, err := db.DB.Exec("DELETE FROM orders WHERE id = $1 OR order_no = $1 OR order_number = $1", id)
		if err != nil {
			log.Printf("[DB ERROR] Failed to delete order %s: %v", id, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete order from database", "details": err.Error()})
			return
		}
	}

	storeMutex.Lock()
	delete(ordersStore, id)
	storeMutex.Unlock()

	log.Printf("[ORDER] Order %s successfully deleted", id)
	c.JSON(http.StatusOK, gin.H{"status": "success", "deleted_id": id})
}

// HandleUpdateOrder updates customer info, specs, or financials of an order
func HandleUpdateOrder(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing order ID"})
		return
	}

	var updateReq map[string]any
	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid update payload", "details": err.Error()})
		return
	}

	if db.DB != nil {
		var customerName, customerPhone, deliveryDate, status, googleDriveLink string
		var totalPrice, depositAmount float64

		if val, ok := updateReq["customer_name"].(string); ok {
			customerName = val
		} else if val, ok := updateReq["customerName"].(string); ok {
			customerName = val
		}

		if val, ok := updateReq["customer_phone"].(string); ok {
			customerPhone = val
		} else if val, ok := updateReq["customerPhone"].(string); ok {
			customerPhone = val
		}

		if val, ok := updateReq["delivery_date"].(string); ok {
			deliveryDate = val
		} else if val, ok := updateReq["deliveryDate"].(string); ok {
			deliveryDate = val
		}

		if val, ok := updateReq["status"].(string); ok {
			status = val
		}

		if val, ok := updateReq["google_drive_link"].(string); ok {
			googleDriveLink = val
		} else if val, ok := updateReq["artworkLink"].(string); ok {
			googleDriveLink = val
		}

		if val, ok := updateReq["total_price"].(float64); ok {
			totalPrice = val
		} else if val, ok := updateReq["totalPriceCharged"].(float64); ok {
			totalPrice = val
		}

		if val, ok := updateReq["deposit_amount"].(float64); ok {
			depositAmount = val
		} else if val, ok := updateReq["depositAmountPaid"].(float64); ok {
			depositAmount = val
		}

		if customerName != "" || status != "" || totalPrice > 0 || deliveryDate != "" {
			_, err := db.DB.Exec(`
				UPDATE orders 
				SET customer_name = COALESCE(NULLIF($1, ''), customer_name),
				    customer_phone = COALESCE(NULLIF($2, ''), customer_phone),
				    delivery_date = COALESCE(NULLIF($3, ''), delivery_date),
				    status = COALESCE(NULLIF($4, ''), status),
				    overall_status = COALESCE(NULLIF($4, ''), overall_status),
				    google_drive_link = COALESCE(NULLIF($5, ''), google_drive_link),
				    total_price = CASE WHEN $6 > 0 THEN $6 ELSE total_price END,
				    total_amount_lak = CASE WHEN $6 > 0 THEN $6 ELSE total_amount_lak END,
				    deposit_amount = CASE WHEN $7 > 0 THEN $7 ELSE deposit_amount END,
				    deposit_lak = CASE WHEN $7 > 0 THEN $7 ELSE deposit_lak END,
				    remaining_lak = CASE WHEN $6 > 0 THEN GREATEST(0, $6 - $7) ELSE remaining_lak END,
				    updated_at = NOW()
				WHERE id = $8 OR order_no = $8 OR order_number = $8
			`, customerName, customerPhone, deliveryDate, status, googleDriveLink, totalPrice, depositAmount, id)
			if err != nil {
				log.Printf("[DB ERROR] Failed to update order %s: %v", id, err)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "updated_id": id, "data": updateReq})
}





