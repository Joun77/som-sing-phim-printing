package orders

import (
	"archive/zip"
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"somsing.local/backend/auth"
	"somsing.local/backend/db"
	"somsing.local/backend/finance"
	"somsing.local/backend/hr"
	"somsing.local/backend/inventory"
	"somsing.local/backend/notifications"
	"somsing.local/backend/pricing"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/shopspring/decimal"
)

// In-memory mock database store for orders fallback
var (
	ordersStore        = make(map[string]Order)
	storeMutex         sync.RWMutex
	orderSeq           int
	orderCreationMutex sync.Mutex
)

func init() {
	orderSeq = 0
}

func generateTrackingToken() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func cleanPhoneNumber(phone string) string {
	var digits strings.Builder
	for _, r := range phone {
		if r >= '0' && r <= '9' {
			digits.WriteRune(r)
		}
	}
	d := digits.String()
	d = strings.TrimPrefix(d, "856")
	d = strings.TrimPrefix(d, "0")
	return d
}

// HandleGetOrders lists all orders from PostgreSQL DB or memory fallback
func HandleGetOrders(c *gin.Context) {
	if db.DB == nil {
		finance.WriteOperationError(c, &finance.OperationError{Status: 503, Code: "STORAGE_UNAVAILABLE"})
		return
	}
	list, err := getOrdersFromDB()
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	if list == nil {
		list = []Order{}
	}
	c.JSON(200, list)
}

// HandleCreateOrder receives specs, runs calculations, takes snapshots, and inserts order
func HandleCreateOrder(c *gin.Context) {
	if db.DB == nil {
		finance.WriteOperationError(c, &finance.OperationError{Status: 503, Code: "STORAGE_UNAVAILABLE"})
		return
	}
	var raw map[string]any
	if c.ShouldBindBodyWith(&raw, binding.JSON) != nil {
		c.JSON(400, gin.H{"status": "error", "code": "INVALID_JSON"})
		return
	}
	for _, key := range strings.Fields("deposit_amount deposit_lak depositAmountPaid paid_amount paid_amount_lak received_net_lak received_amount_lak") {
		if value, has := raw[key]; has {
			if number, ok := value.(float64); !ok || number != 0 {
				c.JSON(422, gin.H{"status": "error", "code": "MONEY_WRITER_BYPASS"})
				return
			}
		}
	}
	var req CreateOrderRequest
	if err := c.ShouldBindBodyWith(&req, binding.JSON); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input payload", "details": err.Error()})
		return
	}

	// ponytail: serialize creates within this process; use per-number locks if throughput requires it.
	// DB uniqueness checks protect creation across processes.
	orderCreationMutex.Lock()
	defer orderCreationMutex.Unlock()

	if req.OrderNo == "" {
		if req.OrderID != "" {
			req.OrderNo = req.OrderID
		} else if req.OrderNumber != "" {
			req.OrderNo = req.OrderNumber
		}
	}
	if req.CustomerPhone == "" && req.Phone != "" {
		req.CustomerPhone = req.Phone
	}
	if req.CustomerEmail == "" && req.Email != "" {
		req.CustomerEmail = req.Email
	}
	if req.CustomerAddress == "" && req.Address != "" {
		req.CustomerAddress = req.Address
	}
	if req.GoogleDriveLink == "" && req.DriveLink != "" {
		req.GoogleDriveLink = req.DriveLink
	}

	if req.IdempotencyKey == "" {
		req.IdempotencyKey = c.GetHeader("Idempotency-Key")
	}

	if req.IdempotencyKey != "" {
		if db.DB != nil {
			existing, err := getOrderByIdempotencyKeyFromDB(req.IdempotencyKey)
			if err == nil && existing.ID != "" {
				c.JSON(http.StatusOK, existing)
				return
			}
		}

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

	if req.OrderNo != "" {
		storeMutex.RLock()
		duplicate := false
		for _, existing := range ordersStore {
			if existing.ID == req.OrderNo || existing.OrderNo == req.OrderNo || existing.OrderNumber == req.OrderNo {
				duplicate = true
				break
			}
		}
		storeMutex.RUnlock()
		if duplicate {
			c.JSON(http.StatusConflict, gin.H{"error": "Order already exists; use the explicit update endpoint"})
			return
		}
	}

	orderID, generatedOrderNo, err := generateOrderIdentity()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate order identity"})
		return
	}

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

		rawItem, e := json.Marshal(itemReq)
		if e != nil {
			finance.WriteOperationError(c, e)
			return
		}
		var itemSnapshot map[string]any
		if e = json.Unmarshal(rawItem, &itemSnapshot); e != nil {
			finance.WriteOperationError(c, e)
			return
		}
		if paperSku != "" {
			itemSnapshot["paper_sku"] = paperSku
		}
		canonicalItem := QuotationRecord{Items: []map[string]any{itemSnapshot}}
		if e = validateQuotationImposition(nil, &canonicalItem); e != nil {
			finance.WriteOperationError(c, e)
			return
		}
		canonicalSpecs := quoteObject(itemSnapshot["specs"])
		mode, _ := itemSnapshot["imposition_mode"].(string)
		var canonicalStock *pricing.StockDimensionSnapshot
		if value := canonicalSpecs["stock_dimension_snapshot"]; value != nil {
			encoded, e := json.Marshal(value)
			if e != nil {
				finance.WriteOperationError(c, e)
				return
			}
			canonicalStock = &pricing.StockDimensionSnapshot{}
			if e = json.Unmarshal(encoded, canonicalStock); e != nil {
				finance.WriteOperationError(c, e)
				return
			}
		}
		pricingReq := pricing.CalculationRequest{
			ImpositionMode: mode, StockDimensionSnapshot: canonicalStock,
			JobWidth: itemReq.JobWidth, JobHeight: itemReq.JobHeight, CutsPerSheet: itemReq.CutsPerSheet, RequiresGuillotineCut: itemReq.RequiresGuillotineCut,

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

		if mode == "OFF" {
			if paperSku == "" {
				pricingReq.PaperSku = quotationString(canonicalSpecs, "paper_sku", "paperId", "paper_id")
			}
			if pricingReq.JobWidth <= 0 {
				pricingReq.JobWidth = impositionNumber(canonicalSpecs, "job_width", "jobWidth", "unfolded_width_mm", "widthMM", "width_mm")
			}
			if pricingReq.JobHeight <= 0 {
				pricingReq.JobHeight = impositionNumber(canonicalSpecs, "job_height", "jobHeight", "unfolded_height_mm", "heightMM", "height_mm")
			}
		}
		pricingRes, err := pricing.CalculateJobPricing(pricingReq)
		if err != nil {
			finance.WriteOperationError(c, err)
			return
		}

		// Both request snapshots are supported; persist the merged metadata in Specs.
		// Explicit specs fields retain precedence over specifications.
		specs := make(map[string]interface{})
		for key, value := range itemReq.Specifications {
			specs[key] = value
		}
		for key, value := range itemReq.Specs {
			specs[key] = value
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
		if mode != "" {
			specs["imposition_mode"] = mode
		}
		if canonicalStock != nil {
			specs["stock_dimension_snapshot"] = canonicalStock
			specs["paper_sku"] = pricingReq.PaperSku
			specs["job_width"] = pricingReq.JobWidth
			specs["job_height"] = pricingReq.JobHeight
		}
		if parts := canonicalSpecs["artwork_parts"]; parts != nil {
			specs["artwork_parts"] = parts
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

		if unitPrice == 0 {
			if itemReq.UnitPriceLAK > 0 {
				unitPrice = itemReq.UnitPriceLAK
			} else if itemReq.UnitPrice > 0 {
				unitPrice = itemReq.UnitPrice
			} else if itemReq.UnitPriceTHB > 0 {
				unitPrice = itemReq.UnitPriceTHB * 630.5
			}
		}
		if itemTotalPrice == 0 {
			if itemReq.TotalPriceLAK > 0 {
				itemTotalPrice = itemReq.TotalPriceLAK
			} else if itemReq.TotalPrice > 0 {
				itemTotalPrice = itemReq.TotalPrice
			} else if itemReq.TotalPriceTHB > 0 {
				itemTotalPrice = itemReq.TotalPriceTHB * 630.5
			} else if unitPrice > 0 {
				itemTotalPrice = unitPrice * float64(qty)
			}
		}

		itemArtworkURL := itemReq.ArtworkURL
		if itemArtworkURL == "" && itemReq.Artwork != nil {
			itemArtworkURL = itemReq.Artwork.FileURL
		}
		if itemArtworkURL == "" {
			itemArtworkURL = itemReq.InnerFileURL
		}
		if itemArtworkURL == "" {
			itemArtworkURL = itemReq.CoverFileURL
		}
		itemArtworkFileName := itemReq.ArtworkFileName
		itemArtworkFileSize := itemReq.ArtworkFileSize
		if itemReq.Artwork != nil && itemReq.Artwork.FileURL == itemArtworkURL {
			if itemArtworkFileName == "" {
				itemArtworkFileName = itemReq.Artwork.FileName
			}
			if itemArtworkFileSize <= 0 {
				itemArtworkFileSize = itemReq.Artwork.FileSizeBytes
			}
		}
		if itemArtworkFileName == "" && itemArtworkURL != "" {
			itemArtworkFileName = filepath.Base(itemArtworkURL)
		}

		if itemArtworkURL != "" {
			specs["artwork_url"] = itemArtworkURL
			specs["artwork_file_name"] = itemArtworkFileName
			specs["artwork_file_size"] = itemArtworkFileSize
			specs["mime_type"] = itemReq.MimeType
		}

		var itemArtwork *ItemArtwork
		if itemReq.Artwork != nil {
			itemArtwork = itemReq.Artwork
		} else if itemArtworkURL != "" {
			itemArtwork = &ItemArtwork{
				FileURL:       itemArtworkURL,
				FileName:      itemArtworkFileName,
				FileSizeBytes: itemArtworkFileSize,
				PageCount:     pageCount,
			}
		}

		itemSpecs := itemReq.Specifications
		if itemSpecs == nil {
			itemSpecs = specs
		}

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
			ArtworkURL:        itemArtworkURL,
			ArtworkFileName:   itemArtworkFileName,
			ArtworkFileSize:   itemArtworkFileSize,
			Artwork:           itemArtwork,
			Specifications:    itemSpecs,
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
		if req.OrderID != "" {
			orderNo = req.OrderID
		} else if req.OrderNumber != "" {
			orderNo = req.OrderNumber
		} else {
			orderNo = generatedOrderNo
		}
	}

	if totalPrice == 0 {
		if req.TotalAmountLAK > 0 {
			totalPrice = req.TotalAmountLAK
		} else if req.TotalPrice > 0 {
			totalPrice = req.TotalPrice
		}
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

	orderArtworkURL := req.ArtworkURL
	if orderArtworkURL == "" {
		orderArtworkURL = req.GoogleDriveLink
	}
	if orderArtworkURL == "" && len(itemsList) > 0 {
		for _, it := range itemsList {
			if it.ArtworkURL != "" {
				orderArtworkURL = it.ArtworkURL
				break
			}
		}
	}
	orderArtworkFileName := req.ArtworkFileName
	if orderArtworkFileName == "" && len(itemsList) > 0 {
		for _, it := range itemsList {
			if it.ArtworkFileName != "" {
				orderArtworkFileName = it.ArtworkFileName
				break
			}
		}
	}
	if orderArtworkFileName == "" && orderArtworkURL != "" {
		orderArtworkFileName = filepath.Base(orderArtworkURL)
	}

	driveLink := req.GoogleDriveLink
	if driveLink == "" {
		driveLink = orderArtworkURL
	}

	newOrder := Order{
		ID:              orderID,
		OrderNo:         orderNo,
		OrderNumber:     orderNo,
		CustomerID:      req.CustomerID,
		CustomerName:    req.CustomerName,
		CustomerPhone:   req.CustomerPhone,
		CustomerEmail:   req.CustomerEmail,
		CustomerAddress: req.CustomerAddress,
		Province:        req.Province,
		District:        req.District,
		Village:         req.Village,
		TotalAmountLAK:  totalPriceFloat,
		DepositLAK:      depositFloat,
		RemainingLAK:    remainingFloat,
		OverallStatus:   initialStatus,
		Status:          initialStatus,
		DeliveryDate:    req.DeliveryDate,
		DepositAmount:   depositFloat,
		TotalPrice:      totalPriceFloat,
		TotalCost:       totalCostFloat,
		GoogleDriveLink: driveLink,
		ArtworkURL:      orderArtworkURL,
		ArtworkFileName: orderArtworkFileName,
		ArtworkFileSize: req.ArtworkFileSize,
		MimeType:        req.MimeType,
		IdempotencyKey:  req.IdempotencyKey,
		Items:           itemsList,
	}

	publicToken, err := generateTrackingToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate security token", "details": err.Error()})
		return
	}
	newOrder.PublicTrackingToken = publicToken
	newOrder.CreatedAt = time.Now()
	newOrder.UpdatedAt = time.Now()

	if db.DB != nil {
		err := db.RunInTransaction(func(tx *sql.Tx) error { return saveOrderInTransaction(tx, &newOrder) })
		if err != nil {
			if errors.Is(err, errOrderAlreadyExists) {
				if req.IdempotencyKey != "" {
					if existing, retryErr := getOrderByIdempotencyKeyFromDB(req.IdempotencyKey); retryErr == nil && existing.ID != "" {
						c.JSON(http.StatusOK, existing)
						return
					}
				}
				c.JSON(http.StatusConflict, gin.H{"error": "Order already exists; use the explicit update endpoint"})
				return
			}

			log.Printf("[DB ERROR] Failed to save order to DB: %v", err)
			finance.WriteOperationError(c, err)
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
func HandleRecordDeposit(c *gin.Context) { finance.HandleCreatePaymentRecord(c) }

type UpdateStatusRequest struct {
	Status             OrderStatus `json:"status" binding:"required"`
	AllowNegativeStock bool        `json:"allow_negative_stock"`
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
		if err := dischargeFIFOStockForOrder(order, req.AllowNegativeStock); err != nil {
			log.Printf("[FIFO STOCK ERROR] Failed to discharge inventory for order %s: %v", order.ID, err)
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Insufficient inventory stock for FIFO discharge",
				"code":    "INSUFFICIENT_STOCK",
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

// HandleReverseOrderStock reverses deducted stock for cancelled or reverted orders
func HandleReverseOrderStock(c *gin.Context) {
	orderID := c.Param("id")

	user := "ADMIN"
	if u, exists := c.Get("username"); exists {
		user = fmt.Sprintf("%v", u)
	}

	if db.DB != nil {
		err := db.RunInTransaction(func(tx *sql.Tx) error {
			return inventory.ReverseInventoryForOrder(tx, orderID, user)
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reverse stock", "details": err.Error()})
			return
		}
	}

	storeMutex.Lock()
	if o, exists := ordersStore[orderID]; exists {
		o.StockDeductedAt = nil
		ordersStore[orderID] = o
	}
	storeMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Stock deduction reversed and materials restored", "order_id": orderID})
}

func dischargeFIFOStockForOrder(o Order, allowNegativeStock bool) error {
	if o.StockDeductedAt != nil {
		log.Printf("[FIFO STOCK INFO] Stock already deducted for order %s at %v. Skipping.", o.ID, *o.StockDeductedAt)
		return nil
	}
	if db.DB == nil {
		return nil
	}

	return db.RunInTransaction(func(tx *sql.Tx) error {
		return EnsureOrderInProductionTx(tx, o.ID, allowNegativeStock)
	})
}

// --- DB HELPERS FOR ORDERS ---

func getOrdersFromDB() ([]Order, error) {
	if db.DB == nil {
		return nil, fmt.Errorf("database connection is nil")
	}
	query := `
		SELECT id, COALESCE(order_no, order_number), customer_name, COALESCE(customer_phone, ''),
		       COALESCE(customer_email, ''), COALESCE(customer_address, ''),
		       COALESCE(overall_status, status::text), COALESCE(deposit_lak, deposit_amount),
		       COALESCE(total_amount_lak, total_price), total_cost, COALESCE(google_drive_link, ''),
		       COALESCE(customer_id, ''), COALESCE(remaining_lak, 0), COALESCE(delivery_date, ''),
		       stock_deducted_at, COALESCE(proof_url, ''), proof_approved_at, proof_rejected_at,
		       COALESCE(proof_signature_ip, ''), COALESCE(proof_rejection_reason, ''),
		       COALESCE(tracking_code, ''), COALESCE(internal_tracking_code, ''),
		       COALESCE(public_tracking_token, ''),
		       COALESCE(courier_name, ''), COALESCE(branch_code, ''),
		       COALESCE(digital_proof_url, ''), COALESCE(proof_version, 1),
		       COALESCE(proof_status, 'NOT_SUBMITTED'), COALESCE(proof_feedback, ''),
		       COALESCE(prepress_notes, ''),
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
			&o.ID, &o.OrderNo, &o.CustomerName, &o.CustomerPhone,
			&o.CustomerEmail, &o.CustomerAddress,
			&st,
			&o.DepositLAK, &o.TotalAmountLAK, &o.TotalCost, &o.GoogleDriveLink,
			&o.CustomerID, &o.RemainingLAK, &o.DeliveryDate,
			&o.StockDeductedAt, &o.ProofURL, &o.ProofApprovedAt, &o.ProofRejectedAt,
			&o.ProofSignatureIP, &o.ProofRejectionReason,
			&o.TrackingCode, &o.InternalTrackingCode, &o.PublicTrackingToken,
			&o.CourierName, &o.CourierBranch,
			&o.DigitalProofURL, &o.ProofVersion,
			&o.ProofStatus, &o.ProofFeedback,
			&o.PrepressNotes,
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
		o.Items, err = getOrderItemsFromDB(o.ID)
		if err != nil {
			return nil, err
		}
		if o.ArtworkURL == "" {
			for _, it := range o.Items {
				if it.ArtworkURL != "" {
					o.ArtworkURL = it.ArtworkURL
					o.ArtworkFileName = it.ArtworkFileName
					o.ArtworkFileSize = it.ArtworkFileSize
					break
				}
			}
			if o.ArtworkURL == "" && o.GoogleDriveLink != "" {
				o.ArtworkURL = o.GoogleDriveLink
				o.ArtworkFileName = filepath.Base(o.GoogleDriveLink)
			}
		}
		if err = attachOrderPaymentSummary(&o); err != nil {
			return nil, err
		}
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
	cleanQuery := strings.TrimSpace(orderID)
	cleanQuery = strings.TrimPrefix(cleanQuery, "#")
	digits := cleanPhoneNumber(cleanQuery)

	query := `
		SELECT id, COALESCE(order_no, order_number), customer_name, COALESCE(customer_phone, ''),
		       COALESCE(customer_email, ''), COALESCE(customer_address, ''),
		       COALESCE(overall_status, status::text), COALESCE(deposit_lak, deposit_amount),
		       COALESCE(total_amount_lak, total_price), total_cost, COALESCE(google_drive_link, ''),
		       COALESCE(customer_id, ''), COALESCE(remaining_lak, 0), COALESCE(delivery_date, ''),
		       stock_deducted_at, COALESCE(proof_url, ''), proof_approved_at, proof_rejected_at,
		       COALESCE(proof_signature_ip, ''), COALESCE(proof_rejection_reason, ''),
		       COALESCE(tracking_code, ''), COALESCE(internal_tracking_code, ''),
		       COALESCE(public_tracking_token, ''),
		       COALESCE(courier_name, ''), COALESCE(branch_code, ''),
		       COALESCE(digital_proof_url, ''), COALESCE(proof_version, 1),
		       COALESCE(proof_status, 'NOT_SUBMITTED'), COALESCE(proof_feedback, ''),
		       COALESCE(prepress_notes, ''),
		       COALESCE(idempotency_key, ''),
		       created_at, updated_at
		FROM orders
		WHERE id::text = $1
		   OR UPPER(REPLACE(COALESCE(order_no, ''), '#', '')) = UPPER($2)
		   OR UPPER(REPLACE(COALESCE(order_number, ''), '#', '')) = UPPER($2)
		   OR idempotency_key = $1
		   OR COALESCE(tracking_code, '') = $1
		   OR COALESCE(internal_tracking_code, '') = $1
		   OR COALESCE(public_tracking_token, '') = $1
		   OR (LENGTH($3) >= 7 AND (
		       REGEXP_REPLACE(customer_phone, '[^0-9]', '', 'g') LIKE '%' || $3
		       OR customer_phone = $1
		   ))
		ORDER BY created_at DESC
		LIMIT 1
	`
	var st string
	err := db.DB.QueryRow(query, cleanQuery, cleanQuery, digits).Scan(
		&o.ID, &o.OrderNo, &o.CustomerName, &o.CustomerPhone,
		&o.CustomerEmail, &o.CustomerAddress,
		&st,
		&o.DepositLAK, &o.TotalAmountLAK, &o.TotalCost, &o.GoogleDriveLink,
		&o.CustomerID, &o.RemainingLAK, &o.DeliveryDate,
		&o.StockDeductedAt, &o.ProofURL, &o.ProofApprovedAt, &o.ProofRejectedAt,
		&o.ProofSignatureIP, &o.ProofRejectionReason,
		&o.TrackingCode, &o.InternalTrackingCode, &o.PublicTrackingToken,
		&o.CourierName, &o.CourierBranch,
		&o.DigitalProofURL, &o.ProofVersion,
		&o.ProofStatus, &o.ProofFeedback,
		&o.PrepressNotes,
		&o.IdempotencyKey,
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
	o.Items, err = getOrderItemsFromDB(o.ID)
	if err != nil {
		return o, err
	}
	if o.ArtworkURL == "" {
		for _, it := range o.Items {
			if it.ArtworkURL != "" {
				o.ArtworkURL = it.ArtworkURL
				o.ArtworkFileName = it.ArtworkFileName
				o.ArtworkFileSize = it.ArtworkFileSize
				break
			}
		}
		if o.ArtworkURL == "" && o.GoogleDriveLink != "" {
			o.ArtworkURL = o.GoogleDriveLink
			o.ArtworkFileName = filepath.Base(o.GoogleDriveLink)
		}
	}
	if err := attachOrderPaymentSummary(&o); err != nil {
		return o, err
	}
	return o, nil
}

func getOrderByIdempotencyKeyFromDB(idempotencyKey string) (Order, error) {
	var o Order
	if db.DB == nil {
		return o, fmt.Errorf("database connection is nil")
	}
	query := `
		SELECT id, COALESCE(order_no, order_number), customer_name, COALESCE(customer_phone, ''),
		       COALESCE(customer_email, ''), COALESCE(customer_address, ''),
		       COALESCE(overall_status, status::text), COALESCE(deposit_lak, deposit_amount),
		       COALESCE(total_amount_lak, total_price), total_cost, COALESCE(google_drive_link, ''),
		       COALESCE(customer_id, ''), COALESCE(remaining_lak, 0), COALESCE(delivery_date, ''),
		       stock_deducted_at, COALESCE(proof_url, ''), proof_approved_at, proof_rejected_at,
		       COALESCE(proof_signature_ip, ''), COALESCE(proof_rejection_reason, ''),
		       COALESCE(tracking_code, ''), COALESCE(internal_tracking_code, ''),
		       COALESCE(public_tracking_token, ''),
		       COALESCE(courier_name, ''), COALESCE(branch_code, ''),
		       COALESCE(digital_proof_url, ''), COALESCE(proof_version, 1),
		       COALESCE(proof_status, 'NOT_SUBMITTED'), COALESCE(proof_feedback, ''),
		       COALESCE(prepress_notes, ''),
		       COALESCE(idempotency_key, ''),
		       created_at, updated_at
		FROM orders
		WHERE idempotency_key = $1
		LIMIT 1
	`
	var st string
	err := db.DB.QueryRow(query, idempotencyKey).Scan(
		&o.ID, &o.OrderNo, &o.CustomerName, &o.CustomerPhone,
		&o.CustomerEmail, &o.CustomerAddress,
		&st,
		&o.DepositLAK, &o.TotalAmountLAK, &o.TotalCost, &o.GoogleDriveLink,
		&o.CustomerID, &o.RemainingLAK, &o.DeliveryDate,
		&o.StockDeductedAt, &o.ProofURL, &o.ProofApprovedAt, &o.ProofRejectedAt,
		&o.ProofSignatureIP, &o.ProofRejectionReason,
		&o.TrackingCode, &o.InternalTrackingCode, &o.PublicTrackingToken,
		&o.CourierName, &o.CourierBranch,
		&o.DigitalProofURL, &o.ProofVersion,
		&o.ProofStatus, &o.ProofFeedback,
		&o.PrepressNotes,
		&o.IdempotencyKey,
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
	if err := attachOrderPaymentSummary(&o); err != nil {
		return o, err
	}
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
			if item.Specs != nil {
				if u, ok := item.Specs["artwork_url"].(string); ok && u != "" {
					item.ArtworkURL = u
				}
				if n, ok := item.Specs["artwork_file_name"].(string); ok && n != "" {
					item.ArtworkFileName = n
				}
				if s, ok := item.Specs["artwork_file_size"].(float64); ok && s > 0 {
					item.ArtworkFileSize = int64(s)
				}
			}
		}
		if item.ArtworkURL == "" {
			if item.InnerFileURL != "" {
				item.ArtworkURL = item.InnerFileURL
			} else if item.CoverFileURL != "" {
				item.ArtworkURL = item.CoverFileURL
			}
		}
		if item.ArtworkFileName == "" && item.ArtworkURL != "" {
			item.ArtworkFileName = filepath.Base(item.ArtworkURL)
		}

		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

// GetOrdersByCustomer retrieves orders matching customer_id or customer_phone
func GetOrdersByCustomer(customerID, phone string) ([]Order, error) {
	cleanDigits := cleanPhoneNumber(phone)
	if db.DB == nil {
		return nil, &finance.OperationError{Status: 503, Code: "STORAGE_UNAVAILABLE"}
	}

	query := `
		SELECT id, COALESCE(order_no, order_number), customer_name, COALESCE(customer_phone, ''),
		       COALESCE(customer_email, ''), COALESCE(customer_address, ''),
		       COALESCE(overall_status, status::text), COALESCE(deposit_lak, deposit_amount),
		       COALESCE(total_amount_lak, total_price), total_cost, COALESCE(google_drive_link, ''),
		       COALESCE(customer_id, ''), COALESCE(remaining_lak, 0), COALESCE(delivery_date, ''),
		       stock_deducted_at, COALESCE(proof_url, ''), proof_approved_at, proof_rejected_at,
		       COALESCE(proof_signature_ip, ''), COALESCE(proof_rejection_reason, ''),
		       COALESCE(tracking_code, ''), COALESCE(internal_tracking_code, ''),
		       COALESCE(public_tracking_token, ''),
		       COALESCE(courier_name, ''), COALESCE(branch_code, ''),
		       COALESCE(digital_proof_url, ''), COALESCE(proof_version, 1),
		       COALESCE(proof_status, 'NOT_SUBMITTED'), COALESCE(proof_feedback, ''),
		       COALESCE(prepress_notes, ''),
		       created_at, updated_at
		FROM orders
		WHERE (NULLIF($1, '') IS NOT NULL AND customer_id = $1)
		   OR (NULLIF($2, '') IS NOT NULL AND (
		       customer_phone = $2
		       OR (LENGTH($3) >= 7 AND REGEXP_REPLACE(customer_phone, '[^0-9]', '', 'g') LIKE '%' || $3)
		   ))
		ORDER BY created_at DESC
	`
	rows, err := db.DB.Query(query, customerID, phone, cleanDigits)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Order
	for rows.Next() {
		var o Order
		var st string
		err := rows.Scan(
			&o.ID, &o.OrderNo, &o.CustomerName, &o.CustomerPhone,
			&o.CustomerEmail, &o.CustomerAddress,
			&st,
			&o.DepositLAK, &o.TotalAmountLAK, &o.TotalCost, &o.GoogleDriveLink,
			&o.CustomerID, &o.RemainingLAK, &o.DeliveryDate,
			&o.StockDeductedAt, &o.ProofURL, &o.ProofApprovedAt, &o.ProofRejectedAt,
			&o.ProofSignatureIP, &o.ProofRejectionReason,
			&o.TrackingCode, &o.InternalTrackingCode, &o.PublicTrackingToken,
			&o.CourierName, &o.CourierBranch,
			&o.DigitalProofURL, &o.ProofVersion,
			&o.ProofStatus, &o.ProofFeedback,
			&o.PrepressNotes,
			&o.CreatedAt, &o.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		o.OrderNumber = o.OrderNo
		o.OverallStatus = OrderStatus(st)
		o.Status = OrderStatus(st)
		o.DepositAmount = o.DepositLAK
		o.TotalPrice = o.TotalAmountLAK
		o.Items, err = getOrderItemsFromDB(o.ID)
		if err != nil {
			return nil, err
		}
		if err = attachOrderPaymentSummary(&o); err != nil {
			return nil, err
		}
		list = append(list, o)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return list, nil
}

func autoLinkOrCreateCustomer(tx *sql.Tx, o Order) (string, error) {
	var custID string

	// 1. Check by customer_id if provided
	if o.CustomerID != "" {
		err := tx.QueryRow("SELECT id FROM customers WHERE id = $1", o.CustomerID).Scan(&custID)
		if err == nil && custID != "" {
			result, err := tx.Exec(`
				UPDATE customers
				SET total_spent_lak = total_spent_lak + $1,
				    total_orders_count = total_orders_count + 1,
				    address = COALESCE(NULLIF($3, ''), address),
				    province = COALESCE(NULLIF($4, ''), province),
				    district = COALESCE(NULLIF($5, ''), district),
				    village = COALESCE(NULLIF($6, ''), village),
				    updated_at = NOW()
				WHERE id = $2
			`, o.TotalAmountLAK, custID, o.CustomerAddress, o.Province, o.District, o.Village)
			if err != nil {
				return "", err
			}
			n, err := result.RowsAffected()
			if err != nil {
				return "", err
			}
			if n != 1 {
				return "", fmt.Errorf("customer update matched %d rows", n)
			}
			return custID, nil
		}
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			return "", err
		}
	}

	// 2. Check by phone
	if custID == "" && o.CustomerPhone != "" {
		err := tx.QueryRow("SELECT id FROM customers WHERE phone = $1", o.CustomerPhone).Scan(&custID)
		if err == nil && custID != "" {
			result, err := tx.Exec(`
				UPDATE customers
				SET total_spent_lak = total_spent_lak + $1,
				    total_orders_count = total_orders_count + 1,
				    address = COALESCE(NULLIF($3, ''), address),
				    province = COALESCE(NULLIF($4, ''), province),
				    district = COALESCE(NULLIF($5, ''), district),
				    village = COALESCE(NULLIF($6, ''), village),
				    updated_at = NOW()
				WHERE id = $2
			`, o.TotalAmountLAK, custID, o.CustomerAddress, o.Province, o.District, o.Village)
			if err != nil {
				return "", err
			}
			n, err := result.RowsAffected()
			if err != nil {
				return "", err
			}
			if n != 1 {
				return "", fmt.Errorf("customer update matched %d rows", n)
			}
			return custID, nil
		}
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			return "", err
		}
	}

	// 3. Check by email
	if custID == "" && o.CustomerEmail != "" {
		err := tx.QueryRow("SELECT id FROM customers WHERE email = $1", o.CustomerEmail).Scan(&custID)
		if err == nil && custID != "" {
			result, err := tx.Exec(`
				UPDATE customers
				SET total_spent_lak = total_spent_lak + $1,
				    total_orders_count = total_orders_count + 1,
				    address = COALESCE(NULLIF($3, ''), address),
				    province = COALESCE(NULLIF($4, ''), province),
				    district = COALESCE(NULLIF($5, ''), district),
				    village = COALESCE(NULLIF($6, ''), village),
				    updated_at = NOW()
				WHERE id = $2
			`, o.TotalAmountLAK, custID, o.CustomerAddress, o.Province, o.District, o.Village)
			if err != nil {
				return "", err
			}
			n, err := result.RowsAffected()
			if err != nil {
				return "", err
			}
			if n != 1 {
				return "", fmt.Errorf("customer update matched %d rows", n)
			}
			return custID, nil
		}
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			return "", err
		}
	}

	// 4. Auto-create customer profile if not found
	customerToken, err := generateTrackingToken()
	if err != nil {
		return "", err
	}
	custID = "cust-" + customerToken
	custName := o.CustomerName
	if custName == "" {
		custName = "Customer " + o.CustomerPhone
	}

	insertCustQuery := `
		INSERT INTO customers (
			id, name, phone, email, address, province, district, village,
			credit_limit, payment_terms, total_spent_lak, total_orders_count, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 2000000.00, 'Net 30', $9, 1, NOW(), NOW())
		ON CONFLICT (id) DO NOTHING
	`
	result, err := tx.Exec(insertCustQuery, custID, custName, o.CustomerPhone, o.CustomerEmail, o.CustomerAddress, o.Province, o.District, o.Village, o.TotalAmountLAK)
	if err != nil {
		return "", err
	}
	n, err := result.RowsAffected()
	if err != nil {
		return "", err
	}
	if n != 1 {
		return "", fmt.Errorf("customer insert matched %d rows", n)
	}
	return custID, nil
}

func saveOrderToDB(o Order) error {
	return db.RunInTransaction(func(tx *sql.Tx) error { return saveOrderInTransaction(tx, &o) })
}

// saveOrderInTransaction shares the existing SQL under the caller's atomic operation.
func saveOrderInTransaction(tx *sql.Tx, o *Order) error {
	if o.DepositAmount != 0 || o.DepositLAK != 0 {
		return fmt.Errorf("MONEY_WRITER_BYPASS")
	}
	for index := range o.Items {
		raw, e := json.Marshal(o.Items[index])
		if e != nil {
			return e
		}
		var item map[string]any
		if e = json.Unmarshal(raw, &item); e != nil {
			return e
		}
		quote := QuotationRecord{Items: []map[string]any{item}}
		if e = validateQuotationImposition(tx, &quote); e != nil {
			return e
		}
		if canonical := quoteObject(item["specs"]); canonical != nil {
			o.Items[index].Specs = canonical
		}
	}
	o.RemainingLAK = o.TotalAmountLAK
	// Phase C: Customer Auto-Creation & Identity Linking
	linkedCustID, err := autoLinkOrCreateCustomer(tx, *o)
	if err != nil {
		return err
	}
	o.CustomerID = linkedCustID

	orderQuery := `
			INSERT INTO orders (id, order_no, order_number, customer_id, customer_name, customer_phone,
			                    customer_email, customer_address,
			                    status, overall_status, deposit_amount, deposit_lak, remaining_lak,
			                    total_price, total_amount_lak, total_cost, delivery_date, google_drive_link,
			                    stock_deducted_at, proof_url, digital_proof_url, proof_version, proof_status, proof_feedback, prepress_notes,
			                    proof_approved_at, proof_rejected_at, proof_signature_ip, proof_rejection_reason,
			                    tracking_code, internal_tracking_code, public_tracking_token, courier_name, branch_code,
			                    idempotency_key,deposit_mode,payment_opening_received_lak,payment_opening_captured_at,payment_state, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35,false,0,NOW(),CASE WHEN $14::numeric=0 THEN 'PAID' ELSE 'UNPAID' END, NOW(), NOW())
			ON CONFLICT DO NOTHING
		`
	proofVer := o.ProofVersion
	if proofVer <= 0 {
		proofVer = 1
	}
	proofSt := o.ProofStatus
	if proofSt == "" {
		proofSt = "NOT_SUBMITTED"
	}
	result, err := tx.Exec(orderQuery,
		o.ID, o.OrderNo, o.OrderNumber, o.CustomerID, o.CustomerName, o.CustomerPhone,
		o.CustomerEmail, o.CustomerAddress,
		string(o.Status), string(o.OverallStatus), o.DepositAmount, o.DepositLAK, o.RemainingLAK,
		o.TotalPrice, o.TotalAmountLAK, o.TotalCost, o.DeliveryDate, o.GoogleDriveLink,
		o.StockDeductedAt, o.ProofURL, o.DigitalProofURL, proofVer, proofSt, o.ProofFeedback, o.PrepressNotes,
		o.ProofApprovedAt, o.ProofRejectedAt, o.ProofSignatureIP, o.ProofRejectionReason,
		o.TrackingCode, o.InternalTrackingCode, o.PublicTrackingToken, o.CourierName, o.CourierBranch,
		o.IdempotencyKey,
	)
	if err != nil {
		return err
	}
	if err := requireCreatedOrderRow(result); err != nil {
		return err
	}

	for _, item := range o.Items {
		specsBytes, err := json.Marshal(item.Specs)
		if err != nil {
			return err
		}
		itemQuery := `
				INSERT INTO order_items (id, order_id, job_name, item_name, quantity, page_count, paper_size,
				                         cover_paper_id, inner_paper_id, cover_file_url, inner_file_url,
				                         binding_type, spine_width_mm, current_step, avg_cov_c, avg_cov_m, avg_cov_y, avg_cov_k,
				                         unit_cost_lak, unit_price_lak, total_price_lak,
				                         unit_price_snapshot, cost_price_snapshot, specs, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24::jsonb, NOW(), NOW())
				ON CONFLICT DO NOTHING
			`
		result, err = tx.Exec(itemQuery,
			item.ID, o.ID, item.JobName, item.ItemName, item.Quantity, item.PageCount, item.PaperSize,
			item.CoverPaperID, item.InnerPaperID, item.CoverFileURL, item.InnerFileURL,
			string(item.BindingType), item.SpineWidthMM, string(item.CurrentStep), item.AvgCovC, item.AvgCovM, item.AvgCovY, item.AvgCovK,
			item.UnitCostLAK, item.UnitPriceLAK, item.TotalPriceLAK,
			item.UnitPriceSnapshot, item.CostPriceSnapshot, string(specsBytes),
		)
		if err != nil {
			return err
		}
		if err := requireCreatedOrderRow(result); err != nil {
			return err
		}
	}
	o.PaymentSummary, err = finance.ReadOrderPaymentSummaryTx(context.Background(), tx, o.ID)
	if err != nil {
		return err
	}
	if err = tx.QueryRow(`SELECT created_at,updated_at FROM orders WHERE id=$1`, o.ID).Scan(&o.CreatedAt, &o.UpdatedAt); err != nil {
		return err
	}
	return nil
}

func updateOrderDepositAndStatusInDB(orderID string, _ float64, status string) error {
	return db.RunInTransaction(func(tx *sql.Tx) error {
		result, err := tx.Exec(`UPDATE orders SET status=$2,overall_status=$2,updated_at=NOW() WHERE id=$1`, orderID, status)
		if err != nil {
			return err
		}
		count, err := result.RowsAffected()
		if err != nil {
			return err
		}
		if count != 1 {
			return sql.ErrNoRows
		}
		return nil
	})
}

// findOrder looks up an order by ID, order_no, or order_number in memory store or database.
// It performs a schema-safe query matching actual schema columns (order_number from schema.sql, or order_no).
func findOrder(orderIDOrNo string) (*Order, bool) {
	storeMutex.Lock()
	defer storeMutex.Unlock()

	// 1. Direct ID lookup in memory
	if o, exists := ordersStore[orderIDOrNo]; exists {
		cp := o
		return &cp, true
	}
	// 2. OrderNo / OrderNumber lookup in memory
	for _, o := range ordersStore {
		if o.OrderNo == orderIDOrNo || o.OrderNumber == orderIDOrNo || o.ID == orderIDOrNo {
			cp := o
			return &cp, true
		}
	}

	// 3. Fallback to DB if initialized
	if db.DB != nil {
		var dbID, orderNum string
		// Try actual schema.sql column: order_number
		err := db.DB.QueryRow("SELECT id::text, order_number FROM orders WHERE id::text = $1 OR order_number = $1 LIMIT 1", orderIDOrNo).Scan(&dbID, &orderNum)
		if err != nil {
			// Fallback: try order_no column if database table schema uses order_no
			err = db.DB.QueryRow("SELECT id::text, order_no FROM orders WHERE id::text = $1 OR order_no = $1 LIMIT 1", orderIDOrNo).Scan(&dbID, &orderNum)
		}
		if err != nil {
			// Fallback: try id alone
			err = db.DB.QueryRow("SELECT id::text FROM orders WHERE id::text = $1 LIMIT 1", orderIDOrNo).Scan(&dbID)
			if err == nil {
				orderNum = dbID
			}
		}

		if err == nil && dbID != "" {
			ord := Order{
				ID:          dbID,
				OrderNo:     orderNum,
				OrderNumber: orderNum,
			}

			// Load item IDs from order_items (id and order_id exist in schema.sql and all fixtures)
			rows, itemErr := db.DB.Query("SELECT id::text FROM order_items WHERE order_id::text = $1", dbID)
			if itemErr == nil {
				defer rows.Close()
				for rows.Next() {
					var itmID string
					if err := rows.Scan(&itmID); err == nil {
						ord.Items = append(ord.Items, OrderItem{
							ID:      itmID,
							OrderID: dbID,
						})
					}
				}
			}
			return &ord, true
		}
	}
	return nil, false
}

// HandleUploadOrderFile saves uploaded PDF/image files in {storage_root}/orders/{order_no}/
func HandleUploadOrderFile(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, MaxArtworkFileSize+1024*1024)
	if c.PostForm("file_type") == "payment_slip" {
		handlePaymentSlipUpload(c)
		return
	}
	role := c.GetString("user_role")
	if role != "admin" && role != "manager" && role != "sales" && role != "prepress" && role != "production" && role != "owner" {
		finance.WriteOperationError(c, &finance.OperationError{Status: 403, Code: "ROLE_FORBIDDEN"})
		return
	}
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing 'file' parameter", "details": err.Error()})
		return
	}

	rawOrderNo := c.DefaultPostForm("order_no", "temp_order")
	orderNo, err := SanitizeParam(rawOrderNo)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order_no parameter", "details": err.Error()})
		return
	}

	rawItemID := c.DefaultPostForm("item_id", "item1")
	itemID, err := SanitizeParam(rawItemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item_id parameter", "details": err.Error()})
		return
	}

	// Staging & Concrete Order Validation Contract (R3):
	// 1. Inspect actual upload callers: Customer storefront pre-checkout upload (uploadArtworkFile)
	//    calls the endpoint prior to order creation, omitting order_no which defaults to "temp_order".
	//    Therefore, the explicit staging contract is strictly restricted to "temp_order".
	// 2. Concrete persisted orders (found in repository or DB, regardless of whether their identifier
	//    starts with "draft-", "QT-", etc.) must NEVER bypass validation.
	// 3. For all concrete orders:
	//    - The order MUST contain items. A concrete zero-item order is rejected (400 Bad Request).
	//    - The specified item_id MUST match a stable item ID (itm.ID == itemID). Matching on ItemName
	//      is rejected to avoid ambiguities.
	// 4. Any unpersisted identifier other than "temp_order" is rejected with 404 Not Found.
	// 5. This validation executes BEFORE any directory creation (os.MkdirAll) or file writes,
	//    guaranteeing zero disk side-effects on validation failure.
	order, exists := findOrder(orderNo)
	if orderNo != "temp_order" || exists {
		handleConcreteArtworkUpload(c, file, orderNo)
		return
	}
	if exists {
		if len(order.Items) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Order has no items to bind upload to",
				"details": fmt.Sprintf("Order %s has 0 items; uploads require an existing order item", orderNo),
			})
			return
		}

		itemBelongs := false
		for _, itm := range order.Items {
			if itm.ID == itemID {
				itemBelongs = true
				break
			}
		}
		if !itemBelongs {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Item does not belong to order",
				"details": fmt.Sprintf("Item %s does not belong to order %s", itemID, orderNo),
			})
			return
		}
	} else {
		// Explicit staging contract: only unpersisted "temp_order" staging is permitted
		if orderNo != "temp_order" {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Order not found",
				"details": fmt.Sprintf("Order %s does not exist", orderNo),
			})
			return
		}
	}

	rawFileType := c.DefaultPostForm("file_type", "inner")
	fileType, err := SanitizeParam(rawFileType)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file_type parameter", "details": err.Error()})
		return
	}

	val, err := ValidateAndSniffUpload(file, AllowedArtworkExtensions, MaxArtworkFileSize)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid uploaded file", "details": err.Error()})
		return
	}

	targetDir := filepath.Join(GetUploadStorageDir(), "orders", orderNo)
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order directory"})
		return
	}

	assetID := GenerateServerAssetID("ordfile")
	safeFileName := fmt.Sprintf("%s_%s_%s_%s", assetID, itemID, fileType, val.SanitizedBaseName)
	destinationPath := filepath.Join(targetDir, safeFileName)

	if err := SaveSafeUploadedFile(file, destinationPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file", "details": err.Error()})
		return
	}

	fileURL := fmt.Sprintf("/api/v1/orders/files/orders/%s/%s", orderNo, safeFileName)

	c.JSON(http.StatusOK, gin.H{
		"asset_id":  assetID,
		"file_name": file.Filename,
		"file_url":  fileURL,
		"order_no":  orderNo,
		"item_id":   itemID,
		"file_type": fileType,
	})
}

// HandleArtworkUpload saves uploaded artwork/PDF files and returns standard asset info
func HandleArtworkUpload(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing 'file' parameter", "details": err.Error()})
		return
	}

	val, err := ValidateAndSniffUpload(file, AllowedArtworkExtensions, MaxArtworkFileSize)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid uploaded artwork file", "details": err.Error()})
		return
	}

	targetDir := filepath.Join(GetUploadStorageDir(), "artworks")
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create artwork storage directory"})
		return
	}

	assetID := GenerateServerAssetID("art")
	safeFileName := fmt.Sprintf("%s_%s", assetID, val.SanitizedBaseName)
	destinationPath := filepath.Join(targetDir, safeFileName)

	if err := SaveSafeUploadedFile(file, destinationPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save artwork file", "details": err.Error()})
		return
	}

	fileURL := fmt.Sprintf("/uploads/artworks/%s", safeFileName)

	c.JSON(http.StatusOK, gin.H{
		"status":    "success",
		"assetId":   assetID,
		"asset_id":  assetID,
		"fileName":  file.Filename,
		"file_name": file.Filename,
		"fileSize":  file.Size,
		"file_size": file.Size,
		"fileUrl":   fileURL,
		"file_url":  fileURL,
		"url":       fileURL,
	})
}

// HandleBatchArtworkUpload handles uploading multiple files simultaneously (e.g. 40 photos)
func HandleBatchArtworkUpload(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse multipart form", "details": err.Error()})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		files = form.File["file"]
	}
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No files provided in form payload"})
		return
	}

	// Security: limit to 100 files max per request
	if len(files) > MaxBatchTotalFiles {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Too many files. Maximum allowed per batch is %d", MaxBatchTotalFiles)})
		return
	}

	targetDir := filepath.Join(GetUploadStorageDir(), "artworks")
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	type UploadedAsset struct {
		AssetID  string `json:"asset_id"`
		FileName string `json:"file_name"`
		FileURL  string `json:"file_url"`
		FileSize int64  `json:"file_size"`
	}

	var results []UploadedAsset
	batchTimestamp := time.Now().UnixNano() / 1e6

	for idx, file := range files {
		val, err := ValidateAndSniffUpload(file, AllowedArtworkExtensions, MaxArtworkFileSize)
		if err != nil {
			continue // Skip dangerous or unallowed files
		}

		assetID := fmt.Sprintf("batch-%d-%03d-%s", batchTimestamp, idx+1, GenerateServerAssetID("f")[len("f-"):])
		safeName := fmt.Sprintf("%s_%s", assetID, val.SanitizedBaseName)
		destinationPath := filepath.Join(targetDir, safeName)

		if err := SaveSafeUploadedFile(file, destinationPath); err != nil {
			continue
		}

		fileURL := fmt.Sprintf("/uploads/artworks/%s", safeName)
		results = append(results, UploadedAsset{
			AssetID:  assetID,
			FileName: file.Filename,
			FileURL:  fileURL,
			FileSize: file.Size,
		})
	}

	if len(results) == 0 && len(files) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "None of the uploaded files could be accepted (unsupported format, oversize, or magic-byte mismatch)"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":      "success",
		"total_count": len(results),
		"files":       results,
	})
}

// BatchZipDownloadRequest represents files to pack into a ZIP
type BatchZipDownloadRequest struct {
	ZipName  string   `json:"zip_name"`
	FileURLs []string `json:"file_urls"`
}

// HandleBatchDownloadZip creates and streams a ZIP archive of requested files
func HandleBatchDownloadZip(c *gin.Context) {
	var req BatchZipDownloadRequest
	if c.Request.Method == http.MethodPost {
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
			return
		}
	} else {
		// GET query params fallback
		req.ZipName = c.Query("zip_name")
		urlsParam := c.Query("urls")
		if urlsParam != "" {
			req.FileURLs = strings.Split(urlsParam, ",")
		}
	}

	if len(req.FileURLs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file URLs provided for zip archive"})
		return
	}

	zipName := filepath.Base(req.ZipName)
	if zipName == "" || zipName == "." {
		zipName = fmt.Sprintf("batch_files_%d.zip", time.Now().Unix())
	}
	if !strings.HasSuffix(strings.ToLower(zipName), ".zip") {
		zipName += ".zip"
	}

	c.Header("Content-Type", "application/zip")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%q", zipName))
	c.Header("Cache-Control", "no-cache")

	zipWriter := zip.NewWriter(c.Writer)
	defer zipWriter.Close()

	addedFiles := make(map[string]bool)

	for idx, rawURL := range req.FileURLs {
		cleanURL := strings.TrimSpace(rawURL)
		if cleanURL == "" {
			continue
		}

		cleanURL = strings.TrimPrefix(cleanURL, "http://localhost:8080")
		cleanURL = strings.TrimPrefix(cleanURL, "http://127.0.0.1:8080")

		var localPath string
		rootDir := GetUploadStorageDir()
		if strings.HasPrefix(cleanURL, "/uploads/") {
			subPath := strings.TrimPrefix(cleanURL, "/uploads/")
			localPath = filepath.Clean(filepath.Join(rootDir, subPath))
		} else if strings.HasPrefix(cleanURL, "/api/v1/orders/files/") {
			subPath := strings.TrimPrefix(cleanURL, "/api/v1/orders/files/")
			localPath = filepath.Clean(filepath.Join(rootDir, subPath))
		} else {
			localPath = filepath.Clean(filepath.Join(rootDir, "artworks", filepath.Base(cleanURL)))
		}

		canonicalPath, _, err := ResolveContainedPath(rootDir, localPath, false)
		if err != nil {
			fallbackPath := filepath.Join(rootDir, "artworks", filepath.Base(cleanURL))
			var fbErr error
			canonicalPath, _, fbErr = ResolveContainedPath(rootDir, fallbackPath, false)
			if fbErr != nil {
				continue
			}
		}

		fileData, err := os.ReadFile(canonicalPath)
		if err != nil {
			continue
		}

		entryName := filepath.Base(localPath)
		if addedFiles[entryName] {
			entryName = fmt.Sprintf("%02d_%s", idx+1, entryName)
		}
		addedFiles[entryName] = true

		entryWriter, err := zipWriter.Create(entryName)
		if err != nil {
			continue
		}

		_, _ = entryWriter.Write(fileData)
	}
}

// HandleUpdateOrderItemStep updates the production step for a specific OrderItem
func HandleUpdateOrderItemStep(c *gin.Context) {
	itemID := c.Param("item_id")
	if itemID == "" {
		itemID = c.Param("id")
	}

	var req struct {
		CurrentStep   ProductionStep `json:"current_step"`
		Step          ProductionStep `json:"step"`
		OperatorID    string         `json:"operator_id"`
		SpoilageCount int            `json:"spoilage_count"`
		RCACause      string         `json:"rca_cause"`
		RootCause     string         `json:"root_cause"`
		Notes         string         `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload", "details": err.Error()})
		return
	}

	effectiveStep := req.CurrentStep
	if effectiveStep == "" {
		effectiveStep = req.Step
	}
	if effectiveStep == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Step is required (current_step or step)"})
		return
	}

	operator := req.OperatorID
	if operator == "" {
		operator = c.GetString("user_fullname")
		if operator == "" {
			operator = c.GetString("username")
		}
	}

	if db.DB == nil {
		finance.WriteOperationError(c, &finance.OperationError{Status: 503, Code: "STORAGE_UNAVAILABLE"})
		return
	}
	valid := map[ProductionStep]bool{StepPending: true, StepInnerPrinted: true, StepCoverPrinted: true, StepCoverLaminated: true, StepPaperTrimmed: true, StepBound: true, StepReadyForPickup: true, StepCompleted: true}
	if !valid[effectiveStep] || req.SpoilageCount < 0 {
		finance.WriteOperationError(c, &finance.OperationError{Status: 422, Code: "INVALID_PRODUCTION_STEP"})
		return
	}
	tx, err := db.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	defer tx.Rollback()
	var orderID, status string
	if err = tx.QueryRowContext(c.Request.Context(), `SELECT order_id FROM order_items WHERE id=$1`, itemID).Scan(&orderID); err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	if requestedOrder := c.Param("id"); c.Param("item_id") != "" && requestedOrder != orderID {
		finance.WriteOperationError(c, &finance.OperationError{Status: 404, Code: "NOT_FOUND"})
		return
	}
	if err = tx.QueryRowContext(c.Request.Context(), `SELECT status::text FROM orders WHERE id=$1 FOR UPDATE`, orderID).Scan(&status); err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	if effectiveStep != StepPending {
		if err = EnsureOrderInProductionTx(tx, orderID, false); err != nil {
			finance.WriteOperationError(c, err)
			return
		}
	}
	result, err := tx.ExecContext(c.Request.Context(), `UPDATE order_items SET current_step=$1,updated_at=NOW() WHERE id=$2 AND order_id=$3`, string(effectiveStep), itemID, orderID)
	if err == nil {
		var n int64
		n, err = result.RowsAffected()
		if err == nil && n != 1 {
			err = sql.ErrNoRows
		}
	}
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	var allCompleted, anyProgress bool
	err = tx.QueryRowContext(c.Request.Context(), `SELECT COALESCE(BOOL_AND(current_step IN ('READY_FOR_PICKUP','COMPLETED')),false),COALESCE(BOOL_OR(COALESCE(current_step,'PENDING')<>'PENDING'),false) FROM order_items WHERE order_id=$1`, orderID).Scan(&allCompleted, &anyProgress)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	if allCompleted {
		status = string(StatusCompleted)
	} else if anyProgress {
		status = string(StatusInProduction)
	}
	if anyProgress {
		if err = finance.CheckOrderFundsForProduction(c.Request.Context(), tx, orderID); err != nil {
			finance.WriteOperationError(c, err)
			return
		}
	}
	_, err = tx.ExecContext(c.Request.Context(), `UPDATE orders SET status=$2,overall_status=$2,updated_at=NOW() WHERE id=$1`, orderID, status)
	if err == nil && req.SpoilageCount > 0 {
		_, err = tx.ExecContext(c.Request.Context(), `INSERT INTO inventory_transactions(id,qty_adjusted,type,notes,created_at) VALUES(uuid_generate_v4(),$1,'wastage',$2,NOW())`, -float64(req.SpoilageCount), fmt.Sprintf("Actual Spoilage logged for item %s: %s", itemID, req.Notes))
	}
	auditID, e := finance.NewOperationID()
	if err == nil {
		err = e
	}
	if err == nil {
		values, e := json.Marshal(gin.H{"item_id": itemID, "current_step": effectiveStep, "operator_id": operator, "spoilage_count": req.SpoilageCount})
		err = e
		if err == nil {
			_, err = tx.ExecContext(c.Request.Context(), `INSERT INTO audit_logs(id,user_id,user_name,action,resource_type,resource_id,new_values,ip_address) VALUES($1,$2,$3,'ORDER_ITEM_STEP','ORDER',$4,$5,$6)`, auditID, c.GetString("user_id"), c.GetString("username"), orderID, string(values), c.ClientIP())
		}
	}
	if err == nil {
		err = tx.Commit()
	}
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	var targetOrder *Order
	storeMutex.Lock()
	if cached, ok := ordersStore[orderID]; ok {
		for i := range cached.Items {
			if cached.Items[i].ID == itemID {
				cached.Items[i].CurrentStep = effectiveStep
				cached.Items[i].UpdatedAt = time.Now()
			}
		}
		cached.Status = OrderStatus(status)
		cached.OverallStatus = OrderStatus(status)
		cached.UpdatedAt = time.Now()
		ordersStore[orderID] = cached
		targetOrder = &cached
	}
	storeMutex.Unlock()
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

	c.JSON(200, gin.H{"status": "success", "committed": true, "item_id": itemID, "current_step": effectiveStep, "order_status": status})
}

// HandleTrackOrderQuery handles GET /api/orders/track?q=:query or /api/v1/orders/track?q=:query
func lookupOrderTracking(token string) (*OrderTrackingDTO, error) {
	if db.DB != nil {
		var dto OrderTrackingDTO
		err := db.DB.QueryRow(`
			SELECT o.id, COALESCE(o.order_no, ''), COALESCE(o.order_number, ''), 
			       COALESCE(o.status::text, ''), COALESCE(o.overall_status, ''),
			       COALESCE(o.delivery_date, ''), COALESCE(o.customer_name, ''),
			       o.created_at, o.updated_at,
			       (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
			FROM orders o 
			WHERE o.public_tracking_token = $1 AND o.public_tracking_token != '' LIMIT 1
		`, token).Scan(
			&dto.ID, &dto.OrderNo, &dto.OrderNumber,
			&dto.Status, &dto.OverallStatus,
			&dto.DeliveryDate, &dto.CustomerName,
			&dto.CreatedAt, &dto.UpdatedAt,
			&dto.ItemCount,
		)

		if err != nil {
			return nil, err
		}

		if len(dto.CustomerName) > 3 {
			dto.CustomerName = dto.CustomerName[:3] + "***"
		}

		return &dto, nil
	}

	storeMutex.RLock()
	defer storeMutex.RUnlock()
	for _, o := range ordersStore {
		if o.PublicTrackingToken == token && o.PublicTrackingToken != "" {
			dto := toTrackingDTO(&o)
			return &dto, nil
		}
	}

	return nil, sql.ErrNoRows
}

func HandleTrackOrderQuery(c *gin.Context) {
	q := c.Query("q")
	// Strict requirement: empty token is not allowed
	if q == "" {
		c.JSON(http.StatusBadRequest, gin.H{"found": false, "error": "Missing search query parameter 'q'"})
		return
	}

	dto, err := lookupOrderTracking(q)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"found": false, "error": "Order not found for search query: " + q, "message": "Order not found"})
		return
	} else if err != nil {
		log.Printf("[DB] Public tracking query failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"found": false, "error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, dto)
}

// OrderTrackingDTO is the limited view of an order exposed to the public tracking endpoint.
// It deliberately omits customer PII (phone, email, address), financial data
// (deposit, total, cost breakdown), internal notes, artwork file URLs, and internal codes.
type OrderTrackingDTO struct {
	ID            string      `json:"id"`
	OrderNo       string      `json:"order_no"`
	OrderNumber   string      `json:"order_number,omitempty"`
	Status        OrderStatus `json:"status"`
	OverallStatus OrderStatus `json:"overall_status,omitempty"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at,omitempty"`
	// Delivery date only (not the full delivery address)
	DeliveryDate string `json:"delivery_date,omitempty"`
	// Customer first name only — strips phone/email/address
	CustomerName string `json:"customer_name,omitempty"`
	// Item count so customer can verify their order
	ItemCount int `json:"item_count,omitempty"`
}

func toTrackingDTO(o *Order) OrderTrackingDTO {
	name := o.CustomerName
	// Expose only first word to minimise PII exposure
	if idx := strings.Index(name, " "); idx > 0 {
		name = name[:idx]
	}
	return OrderTrackingDTO{
		ID:            o.ID,
		OrderNo:       o.OrderNo,
		OrderNumber:   o.OrderNumber,
		Status:        o.Status,
		OverallStatus: o.OverallStatus,
		CreatedAt:     o.CreatedAt,
		UpdatedAt:     o.UpdatedAt,
		DeliveryDate:  o.DeliveryDate,
		CustomerName:  name,
		ItemCount:     len(o.Items),
	}
}

// HandleGetOrderByOrderNo fetches limited order tracking info by tracking token (param is historically named order_no) for public shop floor tracker.
// Returns OrderTrackingDTO (not the full Order) to avoid leaking PII and financial data.
func HandleGetOrderByOrderNo(c *gin.Context) {
	token := c.Param("order_no")

	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing tracking token"})
		return
	}

	dto, err := lookupOrderTracking(token)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	} else if err != nil {
		log.Printf("[DB] Public tracking query failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, dto)
}

// HandleGetOrderById fetches order details by ID or OrderNumber
func HandleGetOrderById(c *gin.Context) {
	id := c.Param("id")

	// 1. Check PostgreSQL DB first
	if db.DB != nil {
		order, err := getOrderByIDFromDB(id)
		if err != nil {
			finance.WriteOperationError(c, err)
			return
		}
		if order.ID == "" {
			finance.WriteOperationError(c, sql.ErrNoRows)
			return
		}
		c.JSON(http.StatusOK, order)
		return
	}
	finance.WriteOperationError(c, &finance.OperationError{Status: 503, Code: "STORAGE_UNAVAILABLE"})
	return

}

type QuotationDecisionRequest struct {
	ExpectedUpdatedAt string `json:"expected_updated_at"`
	ManagerID         string `json:"manager_id"`
	Reason            string `json:"reason"`
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
func HandleApproveQuotation(c *gin.Context) { handleQuotationDecision(c, false) }
func HandleRejectQuotation(c *gin.Context)  { handleQuotationDecision(c, true) }

func handleQuotationDecision(c *gin.Context, reject bool) {
	id := c.Param("id")
	role, authenticated := c.Get("user_role")
	if !authenticated || !auth.CheckRole(fmt.Sprint(role), []string{auth.RoleAdmin, auth.RoleManager}) {
		c.JSON(http.StatusForbidden, gin.H{"status": "error", "message": "Unauthorized: requires manager approval"})
		return
	}
	if db.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "message": "Approval storage unavailable"})
		return
	}

	var request QuotationDecisionRequest
	if err := c.ShouldBindJSON(&request); err != nil && !errors.Is(err, io.EOF) {
		c.JSON(400, gin.H{"status": "error", "code": "invalid_request", "message": "Invalid manager decision request"})
		return
	}
	if !reject {
		hint, err := loadQuotation(db.DB, id, false)
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			sendQuotationFailure(c, err)
			return
		}
		if request.ExpectedUpdatedAt != "" || hint.PriceCorrectionSource != nil {
			approvePriceSource(c, request.ExpectedUpdatedAt)
			return
		}
	}
	orderStatus, quoteStatus := StatusWaitingDeposit, "ACCEPTED"
	if reject {
		orderStatus, quoteStatus = StatusRejected, "REJECTED"
	}
	// Legacy callers can supply an order identifier; saved-quote callers supply a quotation identifier.
	// Exactly one target must match. Neither an absent target nor an ambiguous identifier is approval.
	missing := errors.New("approval target not found")
	ambiguous := errors.New("ambiguous approval target")
	var orderRows, quoteRows int64
	err := db.RunInTransaction(func(tx *sql.Tx) error {
		orderQuery := fmt.Sprintf(`UPDATE orders SET status='%s', overall_status='%s', updated_at=NOW() WHERE id=$1 OR order_no=$1 OR order_number=$1`, orderStatus, orderStatus)
		args := []any{id}
		if reject {
			orderQuery = `UPDATE orders SET status='REJECTED', overall_status='REJECTED', notes=COALESCE(notes,'')||' [Rejected: '||$2||']',updated_at=NOW() WHERE id=$1 OR order_no=$1 OR order_number=$1`
			args = append(args, request.Reason)
		}
		result, err := tx.Exec(orderQuery, args...)
		if err != nil {
			return err
		}
		orderRows, err = result.RowsAffected()
		if err != nil {
			return err
		}
		quoteQuery := fmt.Sprintf(`UPDATE quotations SET status='%s',updated_at=NOW() WHERE id=$1 OR quotation_no=$1`, quoteStatus)
		if reject {
			quoteQuery = `UPDATE quotations SET status='REJECTED', notes=COALESCE(notes,'')||' [Rejected: '||$2||']',updated_at=NOW() WHERE id=$1 OR quotation_no=$1`
		}
		result, err = tx.Exec(quoteQuery, args...)
		if err != nil {
			return err
		}
		quoteRows, err = result.RowsAffected()
		if err != nil {
			return err
		}
		if orderRows+quoteRows == 0 {
			return missing
		}
		if orderRows+quoteRows != 1 {
			return ambiguous
		}
		return nil
	})
	if err != nil {
		code := http.StatusInternalServerError
		message := "Approval could not be committed"
		if errors.Is(err, missing) {
			code, message = http.StatusNotFound, "Approval target not found"
		}
		if errors.Is(err, ambiguous) {
			code, message = http.StatusConflict, "Ambiguous approval target"
		}
		log.Printf("[QUOTATION APPROVAL ERROR] %v", err)
		c.JSON(code, gin.H{"status": "error", "message": message})
		return
	}

	targetType, newStatus := "quotation", quoteStatus
	if orderRows == 1 {
		targetType, newStatus = "order", string(orderStatus)
		storeMutex.Lock()
		for key, order := range ordersStore {
			if order.ID == id || order.OrderNo == id || order.OrderNumber == id {
				order.Status, order.OverallStatus, order.UpdatedAt = orderStatus, orderStatus, time.Now()
				ordersStore[key] = order
			}
		}
		storeMutex.Unlock()
	} else {
		quoteMutex.Lock()
		for key, quote := range quotationsStore {
			if quote.ID == id || quote.QuotationNo == id {
				quote.Status, quote.UpdatedAt = quoteStatus, time.Now()
				quotationsStore[key] = quote
			}
		}
		quoteMutex.Unlock()
	}
	response := gin.H{
		"status": "success", "message": "Manager decision committed",
		"id": id, "target_type": targetType, "new_status": newStatus, "committed": true,
	}
	if quoteRows == 1 {
		response["quotation_id"] = id
		response["quotation_status"] = quoteStatus
	}
	if reject {
		response["reason"] = request.Reason
	}
	c.JSON(http.StatusOK, response)
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
	if db.DB == nil {
		finance.WriteOperationError(c, &finance.OperationError{Status: 503, Code: "STORAGE_UNAVAILABLE"})
		return
	}
	id := c.Param("id")
	tx, err := db.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	defer tx.Rollback()
	if err = finance.OrderCanDelete(c, tx, id); err == nil {
		_, err = tx.ExecContext(c.Request.Context(), `DELETE FROM orders WHERE id=$1`, id)
	}
	if err == nil {
		err = tx.Commit()
	}
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	storeMutex.Lock()
	delete(ordersStore, id)
	storeMutex.Unlock()
	c.JSON(200, gin.H{"status": "success", "committed": true, "deleted_id": id})
}

// HandleUpdateOrder updates customer info, specs, or financials of an order
func HandleUpdateOrder(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 4*1024*1024)
	if db.DB == nil {
		finance.WriteOperationError(c, &finance.OperationError{Status: 503, Code: "STORAGE_UNAVAILABLE"})
		return
	}
	var body map[string]any
	if c.ShouldBindJSON(&body) != nil {
		finance.WriteOperationError(c, &finance.OperationError{Status: 400, Code: "INVALID_JSON"})
		return
	}
	for _, key := range strings.Fields("productionWorkflow proofUrl proof_url isPacked isDispatched isCustomerReceived courierProofUrl shippingFee shipping_fee") {
		if _, has := body[key]; has {
			handleDemoOrderDetails(c, body)
			return
		}
	}
	if finance.RejectOrderMoneyBypass(c, body) {
		return
	}
	if _, has := body["items"]; has {
		handleItemArtworkReplacement(c, body)
		return
	}
	if _, has := body["total_price"]; has {
		finance.HandleOrderTotalCorrection(c, body, validateTotalPriceSource)
		return
	}
	role := c.GetString("user_role")
	if role != "admin" && role != "manager" && role != "sales" && role != "owner" {
		finance.WriteOperationError(c, &finance.OperationError{Status: 403, Code: "ORDER_WRITE_ROLE_REQUIRED"})
		return
	}
	if _, has := body["status"]; has {
		finance.WriteOperationError(c, &finance.OperationError{Status: 422, Code: "USE_ORDER_STATUS_ROUTE"})
		return
	}
	columns := map[string]string{"customer_name": "customer_name", "customerName": "customer_name", "customer_phone": "customer_phone", "customerPhone": "customer_phone", "delivery_date": "delivery_date", "deliveryDate": "delivery_date", "google_drive_link": "google_drive_link", "artworkLink": "google_drive_link", "courier_name": "courier_name", "courier": "courier_name", "deliveryMethod": "courier_name", "internal_tracking_code": "internal_tracking_code", "tracking_number": "internal_tracking_code", "tracking_code": "internal_tracking_code", "trackingNumber": "internal_tracking_code", "branch_code": "branch_code", "courierBranch": "branch_code", "shipping_fee": "shipping_fee", "shippingFee": "shipping_fee"}
	args := []any{}
	sets := []string{}
	seen := map[string]bool{}
	for key, value := range body {
		column, ok := columns[key]
		if !ok || seen[column] {
			finance.WriteOperationError(c, &finance.OperationError{Status: 422, Code: "INVALID_ORDER_FIELD"})
			return
		}
		seen[column] = true
		args = append(args, value)
		sets = append(sets, fmt.Sprintf("%s=$%d", column, len(args)))
		if column == "internal_tracking_code" {
			sets = append(sets, fmt.Sprintf("tracking_code=$%d", len(args)))
		}
	}
	if len(sets) == 0 {
		finance.WriteOperationError(c, &finance.OperationError{Status: 422, Code: "EMPTY_UPDATE"})
		return
	}
	args = append(args, c.Param("id"))
	tx, err := db.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	defer tx.Rollback()
	var raw []byte
	err = tx.QueryRowContext(c.Request.Context(), "UPDATE orders SET "+strings.Join(sets, ",")+",updated_at=NOW() WHERE id="+fmt.Sprintf("$%d", len(args))+" RETURNING to_jsonb(orders)", args...).Scan(&raw)
	if err == nil {
		err = tx.Commit()
	}
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	storeMutex.Lock()
	delete(ordersStore, c.Param("id"))
	storeMutex.Unlock()
	c.JSON(200, gin.H{"status": "success", "committed": true, "updated_id": c.Param("id"), "data": json.RawMessage(raw)})
}

// GetOrderForDailyPlan retrieves an order by ID or order_no from memory or DB
func GetOrderForDailyPlan(orderID string) (*Order, error) {
	storeMutex.Lock()
	order, exists := ordersStore[orderID]
	if !exists {
		for _, o := range ordersStore {
			if o.OrderNo == orderID || o.OrderNumber == orderID {
				order = o
				exists = true
				break
			}
		}
	}
	storeMutex.Unlock()

	if !exists && db.DB != nil {
		dbOrder, err := getOrderByIDFromDB(orderID)
		if err == nil {
			order = dbOrder
			exists = true
		}
	}

	if !exists {
		return nil, fmt.Errorf("order %s not found", orderID)
	}
	return &order, nil
}

// GetAllOrdersForDailyPlan retrieves all orders from DB or memory
func GetAllOrdersForDailyPlan() ([]Order, error) {
	if db.DB != nil {
		list, err := getOrdersFromDB()
		if err == nil && len(list) > 0 {
			return list, nil
		}
	}
	storeMutex.Lock()
	defer storeMutex.Unlock()
	var list []Order
	for _, o := range ordersStore {
		list = append(list, o)
	}
	return list, nil
}

// EnsureOrderInProductionTx transitions an order to IN_PRODUCTION within an existing database transaction,
// validates state machine requirements (deposit paid, proof approved), discharges inventory stock via FIFO,
// creates job tickets, and updates the order status atomically. It strictly fails closed on any error.
func EnsureOrderInProductionTx(tx *sql.Tx, orderID string, allowNegativeStock bool) error {
	if tx == nil {
		return fmt.Errorf("database transaction is nil")
	}

	var id, orderNo, status, overallStatus string
	var depositAmount, depositLAK, totalPrice float64
	var proofApprovedAt, stockDeductedAt *time.Time

	orderQuery := `
		SELECT id, COALESCE(order_no, order_number, ''),
		       status, COALESCE(overall_status, status::text),
		       COALESCE(deposit_amount, 0), COALESCE(deposit_lak, 0), COALESCE(total_amount_lak, total_price, 0),
		       proof_approved_at, stock_deducted_at
		FROM orders
		WHERE id::text = $1 OR order_no = $1 OR order_number = $1
		FOR UPDATE
	`
	err := tx.QueryRow(orderQuery, orderID).Scan(
		&id, &orderNo,
		&status, &overallStatus,
		&depositAmount, &depositLAK, &totalPrice,
		&proofApprovedAt, &stockDeductedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("order %s not found in database", orderID)
		}
		return fmt.Errorf("failed to lock order %s: %w", orderID, err)
	}

	// 1. Validate Order Status: CANCELLED cannot transition
	if strings.EqualFold(status, string(StatusCancelled)) {
		return fmt.Errorf("cannot transition CANCELLED order %s to IN_PRODUCTION", orderNo)
	}

	if err := finance.CheckOrderFundsForProduction(context.Background(), tx, id); err != nil {
		return err
	}

	// 2. Deposit validation (Fail Closed)
	effectiveDeposit := depositAmount
	if effectiveDeposit <= 0 {
		effectiveDeposit = depositLAK
	}
	if totalPrice > 0 && effectiveDeposit <= 0 {
		return fmt.Errorf("order %s requires deposit payment before starting production (deposit is 0)", orderNo)
	}

	// 3. Proof approval validation (Fail Closed)
	if proofApprovedAt == nil {
		return fmt.Errorf("order %s artwork proof has not been approved by customer", orderNo)
	}

	// 4. FIFO Stock Deduction (if not already deducted)
	if stockDeductedAt == nil {
		// Fetch items for this order within tx
		itemsQuery := `
			SELECT id, COALESCE(item_name, job_name, ''), quantity, COALESCE(page_count, 1),
			       COALESCE(cover_paper_id, ''), COALESCE(inner_paper_id, ''),
			       COALESCE(avg_cov_c, 0), COALESCE(avg_cov_m, 0), COALESCE(avg_cov_y, 0), COALESCE(avg_cov_k, 0),
			       COALESCE(specs, '{}'::jsonb)
			FROM order_items
			WHERE order_id::text = $1
		`
		rows, err := tx.Query(itemsQuery, id)
		if err != nil {
			return fmt.Errorf("failed to query order items for stock deduction: %w", err)
		}
		defer rows.Close()

		type itemDedSpec struct {
			id           string
			itemName     string
			quantity     int
			pageCount    int
			coverPaperID string
			innerPaperID string
			avgCovC      float64
			avgCovM      float64
			avgCovY      float64
			avgCovK      float64
			specsBytes   []byte
		}

		var itemsToDeduct []itemDedSpec
		for rows.Next() {
			var it itemDedSpec
			if err := rows.Scan(
				&it.id, &it.itemName, &it.quantity, &it.pageCount,
				&it.coverPaperID, &it.innerPaperID,
				&it.avgCovC, &it.avgCovM, &it.avgCovY, &it.avgCovK,
				&it.specsBytes,
			); err == nil {
				itemsToDeduct = append(itemsToDeduct, it)
			}
		}
		rows.Close()

		for _, item := range itemsToDeduct {
			var specsMap map[string]interface{}
			if len(item.specsBytes) > 0 {
				_ = json.Unmarshal(item.specsBytes, &specsMap)
			}
			if specsMap == nil {
				specsMap = map[string]interface{}{}
			}

			paperSku, _ := specsMap["paper_sku"].(string)
			if paperSku == "" {
				paperSku, _ = specsMap["paperSku"].(string)
			}
			if paperSku == "" {
				paperSku = item.innerPaperID
			}
			if paperSku == "" {
				paperSku = item.coverPaperID
			}

			inkCov, _ := specsMap["ink_coverage_percent"].(float64)
			if inkCov == 0 {
				inkCov, _ = specsMap["inkCoveragePercent"].(float64)
			}

			colorMode := "4_COLOR"
			if cm, ok := specsMap["color_mode"].(string); ok && cm != "" {
				colorMode = cm
			} else if cm, ok := specsMap["colorMode"].(string); ok && cm != "" {
				colorMode = cm
			}

			machineID := ""
			if m, ok := specsMap["machine_id"].(string); ok && m != "" {
				machineID = m
			} else if m, ok := specsMap["machineId"].(string); ok && m != "" {
				machineID = m
			} else if m, ok := specsMap["printer_id"].(string); ok && m != "" {
				machineID = m
			} else if m, ok := specsMap["printerId"].(string); ok && m != "" {
				machineID = m
			}

			spoilageSheets := 0
			if s, ok := specsMap["spoilage_allowance_sheets"].(float64); ok {
				spoilageSheets = int(s)
			} else if s, ok := specsMap["spoilageAllowanceSheets"].(float64); ok {
				spoilageSheets = int(s)
			}

			spoilagePct := 0.0
			if p, ok := specsMap["spoilage_percent"].(float64); ok {
				spoilagePct = p
			} else if p, ok := specsMap["spoilagePercent"].(float64); ok {
				spoilagePct = p
			}

			spoilageCost := 0.0
			if c, ok := specsMap["spoilage_cost"].(float64); ok {
				spoilageCost = c
			} else if c, ok := specsMap["spoilageCost"].(float64); ok {
				spoilageCost = c
			}

			usedOffcutLot, _ := specsMap["used_offcut_lot_id"].(string)
			if usedOffcutLot == "" {
				usedOffcutLot, _ = specsMap["usedOffcutLotId"].(string)
			}

			deductionErr := inventory.DeductInventoryForJob(tx, inventory.JobDeductionSpec{
				OrderID:                 id,
				OrderItemID:             item.id,
				PaperSKU:                paperSku,
				Quantity:                item.quantity,
				PageCount:               item.pageCount,
				CoverPaperID:            item.coverPaperID,
				InnerPaperID:            item.innerPaperID,
				UsedOffcutLotID:         usedOffcutLot,
				ColorMode:               colorMode,
				MachineID:               machineID,
				AvgCovC:                 item.avgCovC,
				AvgCovM:                 item.avgCovM,
				AvgCovY:                 item.avgCovY,
				AvgCovK:                 item.avgCovK,
				InkCoveragePct:          inkCov,
				SpoilageAllowanceSheets: spoilageSheets,
				SpoilagePercent:         spoilagePct,
				SpoilageCost:            spoilageCost,
				AllowNegativeStock:      allowNegativeStock,
				CreatedBy:               "PRODUCTION_DAILY_PLAN",
			})
			if deductionErr != nil {
				return fmt.Errorf("FIFO stock deduction failed for order item %s (%s): %w", item.id, item.itemName, deductionErr)
			}
		}

		// Update order in DB within tx
		now := time.Now()
		_, err = tx.Exec(`
			UPDATE orders
			SET status = $1, overall_status = $1, stock_deducted_at = $2, updated_at = $2
			WHERE id = $3
		`, string(StatusInProduction), now, id)
		if err != nil {
			return fmt.Errorf("failed to update order status and stock_deducted_at: %w", err)
		}
	} else if status != string(StatusInProduction) {
		// Stock was already deducted earlier, only transition status
		_, err = tx.Exec(`
			UPDATE orders
			SET status = $1, overall_status = $1, updated_at = NOW()
			WHERE id = $2
		`, string(StatusInProduction), id)
		if err != nil {
			return fmt.Errorf("failed to update order status to IN_PRODUCTION: %w", err)
		}
	}

	return nil
}

// EnsureOrderInProduction transitions an order to IN_PRODUCTION if not already, with validation and FIFO stock deduction
func EnsureOrderInProduction(orderID string, allowNegativeStock bool) error {
	if db.DB != nil {
		return db.RunInTransaction(func(tx *sql.Tx) error {
			if err := EnsureOrderInProductionTx(tx, orderID, allowNegativeStock); err != nil {
				return err
			}
			return nil
		})
	}

	// In memory fallback for unit tests without DB
	order, err := GetOrderForDailyPlan(orderID)
	if err != nil {
		return err
	}

	if order.Status == StatusInProduction || order.OverallStatus == StatusInProduction {
		return nil
	}

	if err := ValidateOrderStatusTransition(*order, StatusInProduction); err != nil {
		return fmt.Errorf("order cannot transition to IN_PRODUCTION: %w", err)
	}

	storeMutex.Lock()
	defer storeMutex.Unlock()

	order.Status = StatusInProduction
	order.OverallStatus = StatusInProduction
	order.UpdatedAt = time.Now()
	now := time.Now()
	order.StockDeductedAt = &now
	ordersStore[order.ID] = *order
	return nil
}

// UpdateOrderItemStepDirect updates current_step for order item and synchronizes overall status
func UpdateOrderItemStepDirect(itemID string, step string, operatorID string, notes string) error {
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
		targetItem.CurrentStep = ProductionStep(step)
		targetItem.UpdatedAt = time.Now()

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
		} else if anyInProgress && targetOrder.Status != StatusCompleted {
			targetOrder.OverallStatus = StatusInProduction
			targetOrder.Status = StatusInProduction
		}
		targetOrder.UpdatedAt = time.Now()
		ordersStore[targetOrder.ID] = *targetOrder
	}

	if db.DB != nil {
		_ = db.RunInTransaction(func(tx *sql.Tx) error {
			_, err := tx.Exec(`UPDATE order_items SET current_step = $1, updated_at = NOW() WHERE id = $2`, step, itemID)
			return err
		})
	}
	return nil
}

// HandleIssueTrackingToken allows an admin to generate and issue a new public tracking token for an order (especially legacy orders)
func HandleIssueTrackingToken(c *gin.Context) {
	orderID := c.Param("id")
	if orderID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing order ID"})
		return
	}

	publicToken, err := generateTrackingToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate security token", "details": err.Error()})
		return
	}

	if db.DB != nil {
		var existingToken sql.NullString
		err := db.DB.QueryRow(`
			UPDATE orders 
			SET public_tracking_token = COALESCE(NULLIF(public_tracking_token, ''), $1),
				updated_at = CASE WHEN NULLIF(public_tracking_token, '') IS NULL THEN NOW() ELSE updated_at END
			WHERE id = $2
			RETURNING public_tracking_token
		`, publicToken, orderID).Scan(&existingToken)

		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to issue tracking token in DB", "details": err.Error()})
			return
		}

		if !existingToken.Valid || existingToken.String == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database failed to return a valid tracking token"})
			return
		}
		publicToken = existingToken.String
	}

	storeMutex.Lock()
	defer storeMutex.Unlock()

	var targetOrder *Order
	for k := range ordersStore {
		o := ordersStore[k]
		if o.ID == orderID {
			targetOrder = &o
			break
		}
	}

	if targetOrder != nil {
		if db.DB == nil && targetOrder.PublicTrackingToken != "" {
			publicToken = targetOrder.PublicTrackingToken
		} else {
			targetOrder.PublicTrackingToken = publicToken
			targetOrder.UpdatedAt = time.Now()
			ordersStore[targetOrder.ID] = *targetOrder
		}
	} else if db.DB == nil {
		// If DB is nil and not in memory, fail
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found in memory store"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"public_tracking_token": publicToken, "message": "Tracking link issued successfully"})
}

var errOrderAlreadyExists = errors.New("order or item already exists")

// Only create/quotation conversion call this writer; explicit PUT/PATCH updates
// retain their own handlers. A uniqueness conflict must never reassign artwork.
func requireCreatedOrderRow(result sql.Result) error {
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errOrderAlreadyExists
	}
	return nil
}

// Preserve recognizable prefixes/counters while making identity unique across
// process restarts. Item IDs inherit this order identity.
func generateOrderIdentity() (id, number string, err error) {
	nonce, err := generateTrackingToken()
	if err != nil {
		return "", "", err
	}
	storeMutex.Lock()
	orderSeq++
	sequence := orderSeq
	storeMutex.Unlock()
	return "order-" + nonce, fmt.Sprintf("ORD-%s-%03d-%s", time.Now().Format("200601"), sequence, nonce[:12]), nil
}

func attachOrderPaymentSummary(order *Order) error {
	summary, err := finance.ReadOrderPaymentSummary(context.Background(), order.ID)
	if err != nil {
		return err
	}
	order.PaymentSummary = summary
	received, e := strconv.ParseFloat(summary.Received, 64)
	if e != nil {
		return e
	}
	remaining, e := strconv.ParseFloat(summary.Remaining, 64)
	if e != nil {
		return e
	}
	total, e := strconv.ParseFloat(summary.Total, 64)
	if e != nil {
		return e
	}
	order.DepositAmount = received
	order.DepositLAK = received
	order.RemainingLAK = remaining
	order.TotalPrice = total
	order.TotalAmountLAK = total
	return attachOrderDemoState(order)
}

func handlePaymentSlipUpload(c *gin.Context) {
	role := c.GetString("user_role")
	if role != "admin" && role != "manager" && role != "sales" && role != "finance" && role != "accountant" && role != "owner" {
		finance.WriteOperationError(c, &finance.OperationError{Status: 403, Code: "ROLE_FORBIDDEN"})
		return
	}
	fail := func(status int, code string) {
		finance.WriteOperationError(c, &finance.OperationError{Status: status, Code: code})
	}
	id, err := SanitizeParam(c.PostForm("order_no"))
	if err != nil || id == "temp_order" {
		fail(422, "CANONICAL_ORDER_REQUIRED")
		return
	}
	if c.PostForm("item_id") != "" {
		fail(422, "ORDER_LEVEL_SLIP_REQUIRED")
		return
	}
	revision, err := strconv.ParseInt(c.PostForm("expected_payment_revision"), 10, 64)
	if err != nil || revision < 0 {
		fail(422, "PAYMENT_REVISION_REQUIRED")
		return
	}
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, MaxArtworkFileSize+1024*1024)
	file, err := c.FormFile("file")
	if err != nil {
		fail(400, "FILE_REQUIRED")
		return
	}
	val, err := ValidateAndSniffUpload(file, []string{".png", ".jpg", ".jpeg", ".pdf"}, MaxArtworkFileSize)
	if err != nil {
		fail(422, "INVALID_PAYMENT_SLIP")
		return
	}
	src, err := file.Open()
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	hash := sha256.New()
	size, err := io.Copy(hash, io.LimitReader(src, MaxArtworkFileSize+1))
	src.Close()
	if err != nil || size != val.Size || size > MaxArtworkFileSize {
		fail(422, "INVALID_PAYMENT_SLIP")
		return
	}
	digest := hex.EncodeToString(hash.Sum(nil))
	tx, replay, fp, err := finance.BeginOperation(c, "PAYMENT_SLIP_UPLOADED", gin.H{"order_id": id, "expected_payment_revision": revision, "sha256": digest, "size": size, "mime_type": val.MimeType})
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	if replay != nil {
		var response struct {
			Data struct {
				URL string `json:"file_url"`
			}
		}
		if err = json.Unmarshal(replay, &response); err != nil {
			finance.WriteOperationError(c, err)
			return
		}
		check, err := db.DB.BeginTx(c.Request.Context(), nil)
		if err != nil {
			finance.WriteOperationError(c, err)
			return
		}
		defer check.Rollback()
		if _, err = finance.ReadOrderUpload(c.Request.Context(), check, id, response.Data.URL, "payment_slip", true); err != nil {
			finance.WriteOperationError(c, err)
			return
		}
		c.Data(200, "application/json", replay)
		return
	}
	defer tx.Rollback()
	// Lock and validate canonical order/revision before creating any file.
	summary, err := finance.ReadOrderPaymentSummaryTx(c.Request.Context(), tx, id)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	if summary.Revision != revision {
		fail(409, "STALE_PAYMENT_REVISION")
		return
	}
	assetID := GenerateServerAssetID("slip")
	name := assetID + val.Extension
	destination := filepath.Join(GetUploadStorageDir(), "orders", id, name)
	// The safe writer verifies containment before creating the parent.
	if err = SaveSafeUploadedFile(file, destination); err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	committed := false
	defer func() {
		if !committed {
			os.Remove(destination)
		}
	}()
	url := "/api/v1/orders/files/orders/" + id + "/" + name
	summary, err = finance.BindPaymentSlipTx(c, tx, id, url, revision)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	data := gin.H{"asset_id": assetID, "file_name": val.SanitizedBaseName, "file_url": url, "mime_type": val.MimeType, "size": size, "order_id": id, "summary": summary, "sha256": digest, "purpose": "payment_slip", "actor_id": c.GetString("user_id")}
	response := gin.H{"status": "success", "committed": true, "data": data}
	if err = finance.CommitOperation(c, tx, "PAYMENT_SLIP_UPLOADED", "ORDER", id, fp, response); err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	committed = true
	c.JSON(201, response)
}

func handleConcreteArtworkUpload(c *gin.Context, file *multipart.FileHeader, identifier string) {
	if db.DB == nil {
		finance.WriteOperationError(c, &finance.OperationError{Status: 503, Code: "STORAGE_UNAVAILABLE"})
		return
	}
	fail := func(status int, code string) {
		finance.WriteOperationError(c, &finance.OperationError{Status: status, Code: code})
	}
	itemID, err := SanitizeParam(c.PostForm("item_id"))
	if err != nil {
		fail(422, "CANONICAL_ITEM_REQUIRED")
		return
	}
	val, err := ValidateAndSniffUpload(file, AllowedArtworkExtensions, MaxArtworkFileSize)
	if err != nil {
		fail(422, "INVALID_ARTWORK")
		return
	}
	tx, err := db.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	defer tx.Rollback()
	var id string
	// Exact canonical IDs are required for edit attachment; compatible aliases may
	// upload, but associations and storage always use the resolved canonical ID.
	err = tx.QueryRowContext(c.Request.Context(), `SELECT id FROM orders WHERE id=$1 OR order_no=$1 OR order_number=$1 FOR UPDATE`, identifier).Scan(&id)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	if _, err = SanitizeParam(id); err != nil {
		fail(422, "CANONICAL_ORDER_REQUIRED")
		return
	}
	var raw []byte
	err = tx.QueryRowContext(c.Request.Context(), `SELECT COALESCE(specs,'{}'::jsonb) FROM order_items WHERE id=$1 AND order_id=$2 FOR UPDATE`, itemID, id).Scan(&raw)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	var specs map[string]any
	if err = json.Unmarshal(raw, &specs); err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	role := c.PostForm("artwork_role")
	parts, _ := specs["artwork_parts"].([]any)
	if role == "" {
		if len(parts) > 0 {
			role = c.PostForm("file_type")
		} else {
			role = "single"
		}
	}
	if role != "single" && role != "cover" && role != "inner" {
		fail(422, "ARTWORK_ROLE_REQUIRED")
		return
	}
	if len(parts) > 0 {
		found := false
		for _, part := range parts {
			if quoteObject(part)["role"] == role {
				found = true
			}
		}
		if !found {
			fail(422, "ARTWORK_ROLE_MISMATCH")
			return
		}
	} else if role != "single" {
		fail(422, "ARTWORK_ROLE_MISMATCH")
		return
	}
	assetID := GenerateServerAssetID("ordfile")
	name := assetID + "_" + itemID + "_" + role + "_" + val.SanitizedBaseName
	destination := filepath.Join(GetUploadStorageDir(), "orders", id, name)
	if err = SaveSafeUploadedFile(file, destination); err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	committed := false
	defer func() {
		if !committed {
			os.Remove(destination)
		}
	}()
	saved, err := os.Open(destination)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	hash := sha256.New()
	size, err := io.Copy(hash, io.LimitReader(saved, MaxArtworkFileSize+1))
	saved.Close()
	if err != nil || size != val.Size {
		fail(500, "ARTWORK_STORAGE_FAILURE")
		return
	}
	url := "/api/v1/orders/files/orders/" + id + "/" + name
	data := gin.H{"asset_id": assetID, "file_name": val.SanitizedBaseName, "file_url": url, "mime_type": val.MimeType, "size": size, "order_id": id, "order_no": id, "item_id": itemID, "file_type": c.PostForm("file_type"), "artwork_role": role, "purpose": "artwork", "sha256": hex.EncodeToString(hash.Sum(nil)), "actor_id": c.GetString("user_id")}
	// Reuse the existing checked audit writer; no new asset table or module.
	if err = auditQuotation(tx, c, "ORDER_ARTWORK_UPLOADED", id, nil, gin.H{"data": data}); err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	if err = tx.Commit(); err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	committed = true
	c.JSON(200, data)
}
func artworkPatchError(status int, code string) error {
	return &finance.OperationError{Status: status, Code: code}
}
func checkArtworkKeys(object map[string]any, allowed string) error {
	permitted := map[string]bool{}
	for _, key := range strings.Fields(allowed) {
		permitted[key] = true
	}
	for key := range object {
		if !permitted[key] {
			switch key {
			case "quantity", "page_count", "pages", "paper_id", "paper_size", "printer_id", "binding_type", "coating", "coverage", "widthMM", "heightMM", "color_mode", "cutsPerSheet":
				return artworkPatchError(409, "REPRICE_REQUIRED")
			}
			return artworkPatchError(422, "INVALID_ARTWORK_FIELD")
		}
	}
	return nil
}
func ownedReplacementAsset(c *gin.Context, tx *sql.Tx, orderID, itemID, role, url, assetID, oldURL string, pages int) (map[string]any, error) {
	asset, err := finance.ReadOrderUpload(c.Request.Context(), tx, orderID, url, "artwork", true)
	if err != nil {
		return nil, err
	}
	if asset["item_id"] != itemID || asset["artwork_role"] != role || (assetID != "" && asset["asset_id"] != assetID) {
		return nil, artworkPatchError(409, "ARTWORK_OWNERSHIP_MISMATCH")
	}
	if oldURL == "" || pages <= 0 {
		return nil, artworkPatchError(409, "REPRICE_REQUIRED")
	}
	original, err := analyzeOwnedArtwork(c.Request.Context(), oldURL)
	if err != nil {
		return nil, artworkPatchError(409, "REPRICE_REQUIRED")
	}
	replacement, err := analyzeOwnedArtwork(c.Request.Context(), url)
	if err != nil {
		return nil, artworkPatchError(409, "REPRICE_REQUIRED")
	}
	if original["pages"] != pages || replacement["pages"] != pages || !quoteObjectsEqual(original, replacement) {
		return nil, artworkPatchError(409, "REPRICE_REQUIRED")
	}
	return asset, nil
}
func normalizeArtworkParts(c *gin.Context, tx *sql.Tx, orderID, itemID string, input any, stored any) ([]any, error) {
	parts, ok := input.([]any)
	old, oldOK := stored.([]any)
	if !ok || !oldOK || len(parts) != len(old) || len(old) == 0 {
		return nil, artworkPatchError(409, "REPRICE_REQUIRED")
	}
	byRole := map[string]map[string]any{}
	for _, value := range old {
		part := quoteObject(value)
		role := quotationString(part, "role")
		if role != "cover" && role != "inner" || byRole[role] != nil {
			return nil, artworkPatchError(409, "REPRICE_REQUIRED")
		}
		byRole[role] = part
	}
	normalized := []any{}
	seen := map[string]bool{}
	for _, value := range parts {
		part := quoteObject(value)
		if part == nil {
			return nil, artworkPatchError(422, "INVALID_ARTWORK_FIELD")
		}
		if err := checkArtworkKeys(part, "role source pageCount paperId paperName paperSize widthMM heightMM colorMode coverage doubleSided printerId cutsPerSheet thumbnailUrl printSettings"); err != nil {
			return nil, err
		}
		role := quotationString(part, "role")
		original := byRole[role]
		if original == nil || seen[role] {
			return nil, artworkPatchError(409, "REPRICE_REQUIRED")
		}
		seen[role] = true
		for key, field := range part {
			if key != "source" && key != "thumbnailUrl" && !quoteObjectsEqual(field, original[key]) {
				return nil, artworkPatchError(409, "REPRICE_REQUIRED")
			}
		}
		source := quoteObject(part["source"])
		if source == nil {
			return nil, artworkPatchError(422, "INVALID_ARTWORK_FIELD")
		}
		if err := checkArtworkKeys(source, "url fileId name size mimeType"); err != nil {
			return nil, err
		}
		url := quotationString(source, "url")
		oldSource := quoteObject(original["source"])
		asset, err := ownedReplacementAsset(c, tx, orderID, itemID, role, url, quotationString(source, "fileId"), quotationString(oldSource, "url"), quotationPositiveInt(original, "pageCount"))
		if err != nil {
			return nil, err
		}
		result := map[string]any{}
		for key, field := range original {
			result[key] = field
		}
		result["source"] = map[string]any{"url": url, "fileId": asset["asset_id"], "name": asset["file_name"], "size": asset["size"], "mimeType": asset["mime_type"]}
		// No arbitrary remote thumbnail can be attached; the verified asset itself
		// can be displayed, or the old verified thumbnail can be retained.
		if thumb, ok := part["thumbnailUrl"]; ok {
			if thumb != original["thumbnailUrl"] && thumb != url {
				return nil, artworkPatchError(422, "INVALID_ARTWORK_THUMBNAIL")
			}
			result["thumbnailUrl"] = thumb
		}
		normalized = append(normalized, result)
	}
	return normalized, nil
}
func handleItemArtworkReplacement(c *gin.Context, body map[string]any) {
	role := c.GetString("user_role")
	if role != "admin" && role != "manager" && role != "sales" && role != "prepress" && role != "owner" {
		finance.WriteOperationError(c, artworkPatchError(403, "ROLE_FORBIDDEN"))
		return
	}
	if err := checkArtworkKeys(body, "expected_updated_at reason items"); err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	expected, ok := body["expected_updated_at"].(string)
	reason, rok := body["reason"].(string)
	patches, pok := body["items"].([]any)
	if !ok || expected == "" || !rok || strings.TrimSpace(reason) == "" || !pok || len(patches) == 0 || len(patches) > 100 {
		finance.WriteOperationError(c, artworkPatchError(422, "INVALID_ARTWORK_EDIT"))
		return
	}
	id := c.Param("id")
	tx, err := db.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	defer tx.Rollback()
	var orderRaw []byte
	var version time.Time
	err = tx.QueryRowContext(c.Request.Context(), `SELECT to_jsonb(orders),updated_at FROM orders WHERE id=$1 FOR UPDATE`, id).Scan(&orderRaw, &version)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	if version.UTC().Format(time.RFC3339Nano) != expected {
		finance.WriteOperationError(c, artworkPatchError(409, "STALE_ORDER_VERSION"))
		return
	}
	var order map[string]any
	if err = json.Unmarshal(orderRaw, &order); err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	switch order["status"] {
	case "IN_PRODUCTION", "COMPLETED", "DELIVERED", "CANCELLED", "REJECTED":
		finance.WriteOperationError(c, artworkPatchError(409, "ITEM_EDIT_REQUIRES_REVIEW"))
		return
	}
	if order["stock_deducted_at"] != nil {
		finance.WriteOperationError(c, artworkPatchError(409, "ITEM_EDIT_REQUIRES_REVIEW"))
		return
	}
	rows, err := tx.QueryContext(c.Request.Context(), `SELECT to_jsonb(order_items) FROM order_items WHERE order_id=$1 ORDER BY id FOR UPDATE`, id)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	canonical := map[string]map[string]any{}
	ordered := []map[string]any{}
	for rows.Next() {
		var raw []byte
		var item map[string]any
		if err = rows.Scan(&raw); err == nil {
			err = json.Unmarshal(raw, &item)
		}
		if err != nil {
			break
		}
		itemID, _ := item["id"].(string)
		canonical[itemID] = item
		ordered = append(ordered, item)
	}
	if err == nil {
		err = rows.Err()
	}
	rows.Close()
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	// Every item must be unstarted, including omitted rows in the partial subset.
	for _, item := range ordered {
		if step := item["current_step"]; step != nil && step != "PENDING" {
			finance.WriteOperationError(c, artworkPatchError(409, "ITEM_EDIT_REQUIRES_REVIEW"))
			return
		}
	}
	seen := map[string]bool{}
	before := []any{}
	updates := []map[string]any{}
	for _, value := range patches {
		patch := quoteObject(value)
		if patch == nil {
			err = artworkPatchError(422, "INVALID_ARTWORK_FIELD")
			break
		}
		if err = checkArtworkKeys(patch, "id artwork_url artwork_file_name artwork_file_size mime_type cover_file_url inner_file_url artwork artwork_parts specs"); err != nil {
			break
		}
		itemID := quotationString(patch, "id")
		stored := canonical[itemID]
		if stored == nil {
			err = artworkPatchError(404, "ORDER_ITEM_NOT_FOUND")
			break
		}
		if seen[itemID] {
			err = artworkPatchError(422, "DUPLICATE_ORDER_ITEM")
			break
		}
		seen[itemID] = true
		// Deep clone; original specs and quote/conversion provenance stay untouched in the audit.
		raw, _ := json.Marshal(stored)
		before = append(before, json.RawMessage(raw))
		var updated map[string]any
		if err = json.Unmarshal(raw, &updated); err != nil {
			break
		}
		specs := quoteObject(updated["specs"])
		if specs == nil {
			specs = map[string]any{}
		}
		updated["specs"] = specs
		incomingSpecs := quoteObject(patch["specs"])
		if _, has := patch["specs"]; has && incomingSpecs == nil {
			err = artworkPatchError(422, "INVALID_ARTWORK_FIELD")
			break
		}
		if err = checkArtworkKeys(incomingSpecs, "artwork_parts artwork_url artwork_file_name artwork_file_size mime_type imposition_mode stock_dimension_snapshot"); err != nil {
			break
		}
		for _, key := range []string{"imposition_mode", "stock_dimension_snapshot"} {
			if field, has := incomingSpecs[key]; has && !quoteObjectsEqual(field, specs[key]) {
				err = artworkPatchError(409, "REPRICE_REQUIRED")
				break
			}
		}
		if err != nil {
			break
		}
		supplied := map[string]any{}
		for key, field := range incomingSpecs {
			supplied[key] = field
		}
		for key, field := range patch {
			if key == "id" || key == "specs" {
				continue
			}
			if prev, has := supplied[key]; has && !quoteObjectsEqual(prev, field) {
				err = artworkPatchError(422, "CONFLICTING_ARTWORK_FIELDS")
				break
			}
			supplied[key] = field
		}
		if err != nil {
			break
		}
		partsInput, hasParts := supplied["artwork_parts"]
		oldParts, _ := specs["artwork_parts"].([]any)
		if len(oldParts) > 0 {
			if !hasParts || supplied["artwork"] != nil || supplied["artwork_url"] != nil {
				err = artworkPatchError(409, "REPRICE_REQUIRED")
				break
			}
			normalized, e := normalizeArtworkParts(c, tx, id, itemID, partsInput, oldParts)
			if e != nil {
				err = e
				break
			}
			specs["artwork_parts"] = normalized
			for _, partValue := range normalized {
				part := quoteObject(partValue)
				source := quoteObject(part["source"])
				role := quotationString(part, "role")
				url := quotationString(source, "url")
				column := role + "_file_url"
				if requested, has := supplied[column]; has && requested != url {
					err = artworkPatchError(422, "CONFLICTING_ARTWORK_FIELDS")
					break
				}
				updated[column] = url
				if role == "inner" || specs["artwork_url"] == nil {
					specs["artwork_url"] = url
					specs["artwork_file_name"] = source["name"]
					specs["artwork_file_size"] = source["size"]
					specs["mime_type"] = source["mimeType"]
				}
			}
			if err != nil {
				break
			}
		} else {
			if hasParts || supplied["cover_file_url"] != nil {
				err = artworkPatchError(409, "REPRICE_REQUIRED")
				break
			}
			art := quoteObject(supplied["artwork"])
			if _, has := supplied["artwork"]; has && art == nil {
				err = artworkPatchError(422, "INVALID_ARTWORK_FIELD")
				break
			}
			if err = checkArtworkKeys(art, "file_url file_name file_size_bytes mime_type page_count"); err != nil {
				break
			}
			url := quotationString(supplied, "artwork_url", "inner_file_url")
			nestedURL := quotationString(art, "file_url")
			if url != "" && nestedURL != "" && url != nestedURL {
				err = artworkPatchError(422, "CONFLICTING_ARTWORK_FIELDS")
				break
			}
			if url == "" {
				url = nestedURL
			}
			pages := quotationPositiveInt(stored, "page_count")
			if suppliedPages, has := art["page_count"]; has && !quoteObjectsEqual(suppliedPages, stored["page_count"]) {
				err = artworkPatchError(409, "REPRICE_REQUIRED")
				break
			}
			oldURL := quotationString(specs, "artwork_url")
			if oldURL == "" {
				oldURL = quotationString(stored, "inner_file_url", "cover_file_url")
			}
			asset, e := ownedReplacementAsset(c, tx, id, itemID, "single", url, "", oldURL, pages)
			if e != nil {
				err = e
				break
			}
			specs["artwork_url"] = url
			specs["artwork_file_name"] = asset["file_name"]
			specs["artwork_file_size"] = asset["size"]
			specs["mime_type"] = asset["mime_type"]
			updated["inner_file_url"] = url
		}
		if err != nil {
			break
		}
		// Fresh stock validation cannot rewrite a saved version or reprice the job.
		validationItems, cloneErr := quoteCloneItems([]map[string]any{{"specs": specs}})
		if cloneErr != nil {
			err = cloneErr
			break
		}
		q := QuotationRecord{Items: validationItems}
		if e := validateQuotationImposition(tx, &q); e != nil {
			err = artworkPatchError(409, "REPRICE_REQUIRED")
			break
		}
		_, _, _, validated := quotationArtworkSnapshot(q.Items[0])
		if !quoteObjectsEqual(validated["stock_dimension_snapshot"], quoteObject(updated["specs"])["stock_dimension_snapshot"]) || !quoteObjectsEqual(validated["artwork_parts"], specs["artwork_parts"]) {
			err = artworkPatchError(409, "REPRICE_REQUIRED")
			break
		}
		updates = append(updates, updated)
	}
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	// Validate the complete subset before the first write; audit and version commit atomically.
	for _, item := range updates {
		specsRaw, e := json.Marshal(item["specs"])
		if e != nil {
			err = e
			break
		}
		var updatedAt time.Time
		err = tx.QueryRowContext(c.Request.Context(), `UPDATE order_items SET specs=$3::jsonb,cover_file_url=$4,inner_file_url=$5,updated_at=clock_timestamp() WHERE id=$1 AND order_id=$2 RETURNING updated_at`, item["id"], id, string(specsRaw), item["cover_file_url"], item["inner_file_url"]).Scan(&updatedAt)
		if err != nil {
			break
		}
		item["updated_at"] = updatedAt.UTC().Format(time.RFC3339Nano)
		canonical[item["id"].(string)] = item
	}
	if err == nil {
		err = tx.QueryRowContext(c.Request.Context(), `UPDATE orders SET updated_at=clock_timestamp() WHERE id=$1 RETURNING updated_at`, id).Scan(&version)
	}
	if err == nil {
		err = auditQuotation(tx, c, "ORDER_ITEM_ARTWORK_REPLACED", id, before, gin.H{"reason": reason, "order_id": id, "items": updates})
	}

	if err == nil {
		for index, item := range ordered {
			ordered[index] = canonical[item["id"].(string)]
		}
		order["items"] = ordered
		order["updated_at"] = version.UTC().Format(time.RFC3339Nano)
		var summary *finance.PaymentSummary
		summary, err = finance.ReadOrderPaymentSummaryTx(c.Request.Context(), tx, id)
		if err == nil {
			order["payment_summary"] = summary
			var state map[string]any
			state, err = readOrderDemoState(c.Request.Context(), tx, id, version)
			if err == nil {
				for key, value := range state {
					order[key] = value
				}
			}
		}
	}
	if err == nil {
		err = tx.Commit()
	}
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	storeMutex.Lock()
	for key, cached := range ordersStore {
		if cached.ID == id {
			delete(ordersStore, key)
		}
	}
	storeMutex.Unlock()
	c.JSON(200, gin.H{"status": "success", "committed": true, "updated_id": id, "data": order})
}

func readOrderDemoState(ctx context.Context, queryer interface {
	QueryRowContext(context.Context, string, ...any) *sql.Row
}, id string, version time.Time) (map[string]any, error) {
	var raw []byte
	err := queryer.QueryRowContext(ctx, `SELECT new_values->'demo_state' FROM audit_logs WHERE resource_type='ORDER' AND resource_id=$1 AND action='ORDER_DEMO_DETAILS_SAVED' AND (new_values->>'order_version')::timestamptz <=$2 ORDER BY (new_values->>'order_version')::timestamptz DESC,id DESC LIMIT 1`, id, version).Scan(&raw)
	if errors.Is(err, sql.ErrNoRows) {
		return map[string]any{}, nil
	}
	if err != nil {
		return nil, err
	}
	var state map[string]any
	err = json.Unmarshal(raw, &state)
	return state, err
}
func attachOrderDemoState(order *Order) error {
	if db.DB == nil {
		return artworkPatchError(503, "STORAGE_UNAVAILABLE")
	}
	state, err := readOrderDemoState(context.Background(), db.DB, order.ID, order.UpdatedAt)
	if err != nil {
		return err
	}
	order.ProductionWorkflow = quoteObject(state["productionWorkflow"])
	order.IsPacked, _ = state["isPacked"].(bool)
	order.IsDispatched, _ = state["isDispatched"].(bool)
	order.IsCustomerReceived, _ = state["isCustomerReceived"].(bool)
	if url, ok := state["courierProofUrl"].(string); ok {
		order.CourierProofURL = &url
		order.PODImageUrl = url
	}
	if fee, ok := quoteNumber(state["shippingFee"]); ok {
		order.ShippingFee = fee
		order.ShippingFeeAlias = fee
	}
	order.ProofURLAlias = order.ProofURL
	return nil
}
func validateDemoImageURL(c *gin.Context, tx *sql.Tx, id string, value any, allowData bool) (any, error) {
	if value == nil && allowData {
		return nil, nil
	}
	url, ok := value.(string)
	if !ok || url == "" {
		return nil, artworkPatchError(422, "INVALID_PROOF_URL")
	}
	if allowData && strings.HasPrefix(url, "data:image/") {
		if len(url) > 3*1024*1024 {
			return nil, artworkPatchError(422, "PROOF_IMAGE_TOO_LARGE")
		}
		header, data, found := strings.Cut(url, ",")
		if !found || (header != "data:image/png;base64" && header != "data:image/jpeg;base64") {
			return nil, artworkPatchError(422, "INVALID_PROOF_URL")
		}
		raw, err := base64.StdEncoding.DecodeString(data)
		if err != nil || len(raw) == 0 || len(raw) > 2*1024*1024 {
			return nil, artworkPatchError(422, "INVALID_PROOF_URL")
		}
		config, _, decodeErr := image.DecodeConfig(bytes.NewReader(raw))
		if decodeErr != nil || config.Width <= 0 || config.Height <= 0 || int64(config.Width)*int64(config.Height) > 16*1024*1024 {
			return nil, artworkPatchError(422, "INVALID_PROOF_URL")
		}
		if _, _, decodeErr = image.Decode(bytes.NewReader(raw)); decodeErr != nil {
			return nil, artworkPatchError(422, "INVALID_PROOF_URL")
		}
		mime := http.DetectContentType(raw)
		if (mime != "image/png" && mime != "image/jpeg") || !strings.HasPrefix(header, "data:"+mime+";") {
			return nil, artworkPatchError(422, "INVALID_PROOF_URL")
		}
		return url, nil
	}
	var relative string
	if strings.HasPrefix(url, "/api/v1/orders/files/") {
		relative = strings.TrimPrefix(url, "/api/v1/orders/files/")
	} else if strings.HasPrefix(url, "/uploads/") {
		relative = strings.TrimPrefix(url, "/uploads/")
	} else {
		return nil, artworkPatchError(422, "PRIVATE_UPLOADED_PROOF_REQUIRED")
	}
	if strings.Contains(relative, "..") || strings.ContainsAny(relative, "\\\x00") {
		return nil, artworkPatchError(422, "INVALID_PROOF_URL")
	}
	if !strings.HasPrefix(relative, "artworks/") && !strings.HasPrefix(relative, "orders/"+id+"/") {
		return nil, artworkPatchError(422, "PROOF_ORDER_MISMATCH")
	}
	root, err := filepath.Abs(GetUploadStorageDir())
	if err != nil {
		return nil, err
	}
	path, _, err := ResolveContainedPath(root, filepath.Join(root, filepath.FromSlash(relative)), false)
	if err != nil {
		return nil, artworkPatchError(409, "PROOF_UNAVAILABLE")
	}
	mime := DetectSafeMimeType(path)
	if mime != "image/png" && mime != "image/jpeg" && (!(!allowData && mime == "application/pdf")) {
		return nil, artworkPatchError(422, "INVALID_PROOF_URL")
	}
	var slip bool
	err = tx.QueryRowContext(c.Request.Context(), `SELECT EXISTS(SELECT 1 FROM audit_logs WHERE action='PAYMENT_SLIP_UPLOADED' AND new_values->'data'->>'file_url'=$1)`, url).Scan(&slip)
	if err != nil {
		return nil, err
	}
	if slip {
		return nil, artworkPatchError(422, "INVALID_PROOF_PURPOSE")
	}
	return url, nil
}
func validateDemoWorkflow(c *gin.Context, tx *sql.Tx, id string, value any) (map[string]any, error) {
	workflow := quoteObject(value)
	if workflow == nil {
		return nil, artworkPatchError(422, "INVALID_WORKFLOW")
	}
	if err := checkArtworkKeys(workflow, "templateId templateName templateNameLao steps createdAt startedAt"); err != nil {
		return nil, err
	}
	if quotationString(workflow, "templateName") == "" {
		return nil, artworkPatchError(422, "INVALID_WORKFLOW")
	}
	raw, _ := json.Marshal(workflow)
	if len(raw) > 128*1024 {
		return nil, artworkPatchError(422, "WORKFLOW_TOO_LARGE")
	}
	steps, ok := workflow["steps"].([]any)
	if !ok || len(steps) == 0 || len(steps) > 100 {
		return nil, artworkPatchError(422, "INVALID_WORKFLOW")
	}
	seen := map[string]bool{}
	for _, value := range steps {
		step := quoteObject(value)
		if step == nil {
			return nil, artworkPatchError(422, "INVALID_WORKFLOW")
		}
		if err := checkArtworkKeys(step, "id jobId name nameLao category assignedTo assignedStaffName assignedStaffRole assignedStaffAvatar status notes estimatedMinutes machineId"); err != nil {
			return nil, err
		}
		stepID := quotationString(step, "id")
		if stepID == "" || seen[stepID] || step["status"] != "PENDING" || quotationString(step, "name") == "" {
			return nil, artworkPatchError(422, "INVALID_WORKFLOW")
		}
		seen[stepID] = true
		switch step["category"] {
		case "PRE_PRESS", "PRESS", "POST_PRESS", "FINISHING", "QC", "PACKAGING", "OTHER":
		default:
			return nil, artworkPatchError(422, "INVALID_WORKFLOW")
		}
		if job := quotationString(step, "jobId"); job != "" {
			var exists bool
			if err := tx.QueryRowContext(c.Request.Context(), `SELECT EXISTS(SELECT 1 FROM order_items WHERE order_id=$1 AND id=$2)`, id, job).Scan(&exists); err != nil {
				return nil, err
			}
			if !exists {
				return nil, artworkPatchError(422, "WORKFLOW_ITEM_MISMATCH")
			}
		}
		if employee := quotationString(step, "assignedTo"); employee != "" {
			var name, employeeRole string
			err := tx.QueryRowContext(c.Request.Context(), `SELECT name_lo,role FROM employees WHERE id=$1 AND status='ACTIVE' FOR SHARE`, employee).Scan(&name, &employeeRole)
			if errors.Is(err, sql.ErrNoRows) {
				return nil, artworkPatchError(422, "WORKFLOW_EMPLOYEE_UNAVAILABLE")
			}
			if err != nil {
				return nil, err
			}
			step["assignedStaffName"] = name
			step["assignedStaffRole"] = employeeRole
		} else {
			delete(step, "assignedStaffName")
			delete(step, "assignedStaffRole")
			delete(step, "assignedStaffAvatar")
		}
		if number, has := step["estimatedMinutes"]; has {
			minutes, valid := quoteNumber(number)
			if !valid || minutes < 0 || minutes > 100000 {
				return nil, artworkPatchError(422, "INVALID_WORKFLOW")
			}
		}
	}
	delete(workflow, "startedAt")
	workflow["createdAt"] = time.Now().UTC().Format(time.RFC3339Nano)
	return workflow, nil
}
func handleDemoOrderDetails(c *gin.Context, body map[string]any) {
	if finance.RejectOrderMoneyBypass(c, body) {
		return
	}
	if err := checkArtworkKeys(body, "expected_updated_at productionWorkflow proofUrl proof_url isPacked isDispatched isCustomerReceived courierProofUrl deliveryMethod courier_name trackingNumber internal_tracking_code shippingFee shipping_fee courierBranch branch_code"); err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	expected, ok := body["expected_updated_at"].(string)
	if !ok || expected == "" {
		finance.WriteOperationError(c, artworkPatchError(422, "ORDER_VERSION_REQUIRED"))
		return
	}
	_, workflow := body["productionWorkflow"]
	_, proofCamel := body["proofUrl"]
	_, proofSnake := body["proof_url"]
	reception := workflow || proofCamel || proofSnake
	role := c.GetString("user_role")
	allowed := role == "admin" || role == "manager" || role == "sales" || role == "owner" || ((!reception || workflow) && role == "production") || (reception && role == "prepress")
	if !allowed {
		finance.WriteOperationError(c, artworkPatchError(403, "ROLE_FORBIDDEN"))
		return
	}
	if (proofCamel && proofSnake) || (workflow && (proofCamel || proofSnake)) {
		finance.WriteOperationError(c, artworkPatchError(422, "DEMO_ACTION_MUST_BE_SEPARATE"))
		return
	}
	if reception {
		for key := range body {
			if key != "expected_updated_at" && key != "productionWorkflow" && key != "proofUrl" && key != "proof_url" {
				finance.WriteOperationError(c, artworkPatchError(422, "DEMO_ACTION_MUST_BE_SEPARATE"))
				return
			}
		}
	}
	id := c.Param("id")
	tx, err := db.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	defer tx.Rollback()
	var beforeRaw []byte
	var version time.Time
	err = tx.QueryRowContext(c.Request.Context(), `SELECT to_jsonb(orders),updated_at FROM orders WHERE id=$1 FOR UPDATE`, id).Scan(&beforeRaw, &version)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	if expected != version.UTC().Format(time.RFC3339Nano) {
		finance.WriteOperationError(c, artworkPatchError(409, "STALE_ORDER_VERSION"))
		return
	}
	var parent map[string]any
	if err = json.Unmarshal(beforeRaw, &parent); err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	state, err := readOrderDemoState(c.Request.Context(), tx, id, version)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	for _, key := range strings.Fields("isPacked isDispatched isCustomerReceived") {
		if _, has := state[key]; !has {
			state[key] = false
		}
	}
	if _, has := state["courierProofUrl"]; !has {
		state["courierProofUrl"] = nil
	}
	if _, has := state["shippingFee"]; !has {
		state["shippingFee"] = float64(0)
	}
	args := []any{id}
	sets := []string{"updated_at=clock_timestamp()"}
	add := func(column string, value any) {
		args = append(args, value)
		sets = append(sets, fmt.Sprintf("%s=$%d", column, len(args)))
	}
	var earnings []hr.TechnicianEarning
	if workflow && parent["status"] == "IN_PRODUCTION" {
		var finished bool
		state["productionWorkflow"], earnings, finished, err = advanceDemoWorkflow(c, tx, id, parent, state["productionWorkflow"], body["productionWorkflow"])
		if err == nil && finished {
			sets = append(sets, "status='COMPLETED'", "overall_status='COMPLETED'")
		}
	} else if reception {
		if role == "production" {
			err = artworkPatchError(403, "ROLE_FORBIDDEN")
		}
		switch parent["status"] {
		case "IN_PRODUCTION", "COMPLETED", "DELIVERED", "CANCELLED", "REJECTED":
			err = artworkPatchError(409, "ITEM_EDIT_REQUIRES_REVIEW")
		}
		if parent["stock_deducted_at"] != nil {
			err = artworkPatchError(409, "ITEM_EDIT_REQUIRES_REVIEW")
		}
		var started bool
		if err == nil {
			err = tx.QueryRowContext(c.Request.Context(), `SELECT EXISTS(SELECT 1 FROM order_items WHERE order_id=$1 AND COALESCE(current_step,'PENDING')<>'PENDING')`, id).Scan(&started)
		}
		if started && err == nil {
			err = artworkPatchError(409, "ITEM_EDIT_REQUIRES_REVIEW")
		}
		if err == nil && workflow {
			state["productionWorkflow"], err = validateDemoWorkflow(c, tx, id, body["productionWorkflow"])
		}
		if err == nil && (proofCamel || proofSnake) {
			url := body["proofUrl"]
			if proofSnake {
				url = body["proof_url"]
			}
			var saved any
			saved, err = validateDemoImageURL(c, tx, id, url, false)
			if err == nil {
				add("proof_url", saved)
				add("digital_proof_url", saved)
				sets = append(sets, "proof_version=COALESCE(proof_version,0)+1", "proof_status='PENDING_CUSTOMER'", "proof_approved_at=NULL", "proof_rejected_at=NULL", "proof_feedback=NULL", "status='WAITING_APPROVAL'", "overall_status='WAITING_APPROVAL'")
			}
		}
	} else {
		wasDispatched, _ := state["isDispatched"].(bool)
		wasReceived, _ := state["isCustomerReceived"].(bool)
		for _, key := range strings.Fields("isPacked isDispatched isCustomerReceived") {
			if value, has := body[key]; has {
				flag, valid := value.(bool)
				if !valid {
					err = artworkPatchError(422, "BOOLEAN_REQUIRED")
					break
				}
				state[key] = flag
			}
		}
		packed := state["isPacked"] == true
		dispatched := state["isDispatched"] == true
		received := state["isCustomerReceived"] == true
		if err == nil && ((wasDispatched && !dispatched) || (wasReceived && !received) || ((wasDispatched || wasReceived) && !packed)) {
			err = artworkPatchError(409, "DELIVERY_HISTORY_LOCKED")
		}
		if err == nil && packed {
			switch parent["status"] {
			case "COMPLETED", "READY_FOR_PICKUP", "DELIVERED":
			default:
				err = artworkPatchError(409, "ORDER_NOT_READY_FOR_DELIVERY")
			}
		}
		textFields := map[string]string{"deliveryMethod": "courier_name", "courier_name": "courier_name", "trackingNumber": "internal_tracking_code", "internal_tracking_code": "internal_tracking_code", "courierBranch": "branch_code", "branch_code": "branch_code"}
		seen := map[string]bool{}
		for key, column := range textFields {
			if value, has := body[key]; has {
				text, valid := value.(string)
				if !valid || len(text) > 255 || seen[column] {
					err = artworkPatchError(422, "INVALID_DELIVERY_FIELD")
					break
				}
				seen[column] = true
				parent[column] = text
				add(column, text)
				if column == "internal_tracking_code" {
					add("tracking_code", text)
				}
			}
		}
		if err == nil && dispatched {
			if !packed {
				err = artworkPatchError(409, "PACKING_REQUIRED")
			} else if quotationString(parent, "courier_name") != "ຮັບເອງທີ່ຮ້ານ" && quotationString(parent, "internal_tracking_code") == "" {
				err = artworkPatchError(409, "TRACKING_REQUIRED")
			} else {
				err = finance.CheckOrderFundsForProduction(c.Request.Context(), tx, id)
			}
		}
		if err == nil && received {
			if !dispatched {
				err = artworkPatchError(409, "DISPATCH_REQUIRED")
			} else {
				var summary *finance.PaymentSummary
				summary, err = finance.ReadOrderPaymentSummaryTx(c.Request.Context(), tx, id)
				if err == nil && summary.Remaining != "0.00" {
					err = artworkPatchError(409, "FULL_SETTLEMENT_REQUIRED")
				}
			}
		}
		if err == nil {
			if value, has := body["courierProofUrl"]; has {
				state["courierProofUrl"], err = validateDemoImageURL(c, tx, id, value, true)
				if err == nil {
					add("pod_image_url", state["courierProofUrl"])
				}
			}
		}
		for _, key := range []string{"shippingFee", "shipping_fee"} {
			if value, has := body[key]; has && err == nil {
				if _, duplicate := body[map[string]string{"shippingFee": "shipping_fee", "shipping_fee": "shippingFee"}[key]]; duplicate {
					err = artworkPatchError(422, "INVALID_DELIVERY_FIELD")
					break
				}
				text, valid := value.(string)
				if !valid {
					if number, ok := quoteNumber(value); ok {
						text = decimal.NewFromFloat(number).String()
					} else {
						err = artworkPatchError(422, "INVALID_AMOUNT")
						break
					}
				}
				amount, e := finance.ParsePaymentAmount(text)
				if e != nil {
					err = e
					break
				}
				fee, _ := amount.Float64()
				state["shippingFee"] = fee
			}
		}
	}
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	var afterRaw []byte
	err = tx.QueryRowContext(c.Request.Context(), "UPDATE orders SET "+strings.Join(sets, ",")+" WHERE id=$1 RETURNING to_jsonb(orders),updated_at", args...).Scan(&afterRaw, &version)
	if err == nil {
		err = auditQuotation(tx, c, "ORDER_DEMO_DETAILS_SAVED", id, json.RawMessage(beforeRaw), gin.H{"demo_state": state, "order_version": version.UTC().Format(time.RFC3339Nano), "actor_role": role})
	}
	if err == nil {
		err = tx.Commit()
	}
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	var canonical map[string]any
	if err = json.Unmarshal(afterRaw, &canonical); err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	for key, value := range state {
		canonical[key] = value
	}
	canonical["updated_at"] = version.UTC().Format(time.RFC3339Nano)
	storeMutex.Lock()
	for key, cached := range ordersStore {
		if cached.ID == id {
			delete(ordersStore, key)
		}
	}
	storeMutex.Unlock()
	c.JSON(200, gin.H{"status": "success", "committed": true, "updated_id": id, "data": canonical, "earnings": earnings})
}

// Configured IDs are persisted directly; no mapping to legacy item enums.
func advanceDemoWorkflow(c *gin.Context, tx *sql.Tx, id string, parent map[string]any, saved, requested any) (map[string]any, []hr.TechnicianEarning, bool, error) {
	fail := func(code string) (map[string]any, []hr.TechnicianEarning, bool, error) {
		return nil, nil, false, artworkPatchError(409, code)
	}
	role := c.GetString("user_role")
	if role != "admin" && role != "manager" && role != "production" && role != "owner" {
		return nil, nil, false, artworkPatchError(403, "ROLE_FORBIDDEN")
	}
	if parent["stock_deducted_at"] == nil {
		return fail("PRODUCTION_START_REQUIRED")
	}
	if err := finance.CheckOrderFundsForProduction(c.Request.Context(), tx, id); err != nil {
		return nil, nil, false, err
	}
	old := quoteObject(saved)
	proposed := quoteObject(requested)
	if old == nil || proposed == nil {
		return fail("SAVED_WORKFLOW_REQUIRED")
	}
	raw, err := json.Marshal(old)
	if err != nil {
		return nil, nil, false, err
	}
	var next map[string]any
	if err = json.Unmarshal(raw, &next); err != nil {
		return nil, nil, false, err
	}
	incomingRaw, err := json.Marshal(proposed)
	if err != nil || len(incomingRaw) > 128*1024 {
		return fail("INVALID_WORKFLOW")
	}
	originalSteps, ok := old["steps"].([]any)
	if !ok {
		return fail("SAVED_WORKFLOW_REQUIRED")
	}
	supplied, ok := proposed["steps"].([]any)
	if !ok || len(supplied) != len(originalSteps) {
		return fail("WORKFLOW_DEFINITION_LOCKED")
	}
	// Ignore client-generated completion metadata while comparing the saved definition.
	projection := func(v map[string]any, step bool) string {
		copy := map[string]any{}
		for k, value := range v {
			if k == "startedAt" || k == "completedAt" || k == "completedBy" || strings.HasPrefix(k, "completed_by") || (!step && k == "steps") || (step && k == "status") {
				continue
			}
			copy[k] = value
		}
		b, _ := json.Marshal(copy)
		return string(b)
	}
	if projection(old, false) != projection(proposed, false) {
		return fail("WORKFLOW_DEFINITION_LOCKED")
	}
	changed := -1
	for i, value := range originalSteps {
		before, after := quoteObject(value), quoteObject(supplied[i])
		if before == nil || after == nil || projection(before, true) != projection(after, true) {
			return fail("WORKFLOW_DEFINITION_LOCKED")
		}
		if before["status"] != after["status"] {
			if changed >= 0 {
				return fail("ONE_WORKFLOW_STEP_REQUIRED")
			}
			changed = i
		}
	}
	if changed < 0 {
		return fail("WORKFLOW_PROGRESS_REQUIRED")
	}
	before, after := quoteObject(originalSteps[changed]), quoteObject(supplied[changed])
	from, to := quotationString(before, "status"), quotationString(after, "status")
	if !((from == "PENDING" && (to == "IN_PROGRESS" || to == "COMPLETED")) || (from == "IN_PROGRESS" && to == "COMPLETED")) {
		return fail("WORKFLOW_TRANSITION_FORBIDDEN")
	}
	job := quotationString(before, "jobId")
	for i := 0; i < changed; i++ {
		prior := quoteObject(originalSteps[i])
		priorJob := quotationString(prior, "jobId")
		if (job == "" || priorJob == "" || job == priorJob) && prior["status"] != "COMPLETED" {
			return fail("WORKFLOW_DEPENDENCY_REQUIRED")
		}
	}
	var now time.Time
	if err = tx.QueryRowContext(c.Request.Context(), `SELECT clock_timestamp()`).Scan(&now); err != nil {
		return nil, nil, false, err
	}
	stamp := now.UTC().Format(time.RFC3339Nano)
	step := quoteObject(next["steps"].([]any)[changed])
	step["status"] = to
	next["startedAt"] = parent["stock_deducted_at"]
	earned := []hr.TechnicianEarning{}
	if to == "COMPLETED" {
		step["completedAt"] = stamp
		step["completedBy"] = gin.H{"id": c.GetString("user_id"), "name": c.GetString("username"), "role": role}
		step["completed_by_id"] = c.GetString("user_id")
		step["completed_by_name"] = c.GetString("username")
		step["completed_by_role"] = role
		if employee := quotationString(step, "assignedTo"); employee != "" {
			var impressions int64
			var invalid bool
			err = tx.QueryRowContext(c.Request.Context(), `SELECT COALESCE(SUM(quantity::bigint*page_count::bigint),0),COALESCE(bool_or(quantity IS NULL OR page_count IS NULL OR quantity<=0 OR page_count<=0),true) FROM order_items WHERE order_id=$1 AND ($2='' OR id=$2)`, id, job).Scan(&impressions, &invalid)
			if err != nil {
				return nil, nil, false, err
			}
			if invalid || impressions <= 0 || impressions > 1000000000 {
				return fail("WORKFLOW_QUANTITY_UNAVAILABLE")
			}
			rec, e := hr.RecordTechnicianEarningTx(c, tx, hr.TechnicianEarning{EmployeeID: employee, OrderID: id, StepID: quotationString(step, "id"), StepName: quotationString(step, "name"), Impressions: int(impressions)})
			if e != nil {
				return nil, nil, false, e
			}
			earned = append(earned, rec)
		}
	}
	finished := true
	for _, value := range next["steps"].([]any) {
		if quoteObject(value)["status"] != "COMPLETED" {
			finished = false
		}
	}
	if finished {
		next["completedAt"] = stamp
	}
	return next, earned, finished, nil
}
