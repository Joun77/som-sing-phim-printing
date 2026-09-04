package service

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"math/big"
	"strings"
	"time"

	"backend/internal/domain"
	"backend/internal/repository"

	"github.com/shopspring/decimal"
)

type OrderService struct {
	db           *sql.DB
	orderRepo    *repository.OrderRepository
	materialRepo *repository.MaterialRepository
}

func NewOrderService(database *sql.DB) *OrderService {
	return &OrderService{
		db:           database,
		orderRepo:    repository.NewOrderRepository(database),
		materialRepo: repository.NewMaterialRepository(database),
	}
}

// generateOrderNumber generates standard order number e.g. ORD-202608-4821
func generateOrderNumber() string {
	n, _ := rand.Int(rand.Reader, big.NewInt(9000))
	randNum := n.Int64() + 1000
	return fmt.Sprintf("ORD-%s-%04d", time.Now().Format("20060102"), randNum)
}

// generateID generates a unique ID string
func generateID(prefix string) string {
	n, _ := rand.Int(rand.Reader, big.NewInt(900000))
	return fmt.Sprintf("%s-%d-%06d", prefix, time.Now().Unix(), n.Int64()+100000)
}

// CreateOrder creates a new print order or quotation with strict decimal financial precision
func (s *OrderService) CreateOrder(ctx context.Context, payload domain.CreateOrderPayload) (*domain.Order, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	if strings.TrimSpace(payload.CustomerName) == "" {
		return nil, fmt.Errorf("customer name is required")
	}
	if len(payload.Items) == 0 {
		return nil, fmt.Errorf("order must contain at least one line item")
	}

	orderID := generateID("ord")
	orderNumber := strings.TrimSpace(payload.OrderNumber)
	if orderNumber == "" {
		orderNumber = generateOrderNumber()
	}

	initialStatus := payload.Status
	if initialStatus == "" {
		initialStatus = domain.StatusQuotation
	}

	exchangeRate := payload.ExchangeRate
	if exchangeRate.LessThanOrEqual(decimal.Zero) {
		exchangeRate = decimal.NewFromInt(1)
	}

	currency := strings.TrimSpace(payload.Currency)
	if currency == "" {
		currency = "LAK"
	}

	totalAmount := decimal.Zero
	var orderItems []domain.OrderItem

	for _, itemPayload := range payload.Items {
		itemID := generateID("item")
		qty := itemPayload.Quantity
		if qty <= 0 {
			qty = 1
		}
		pageCount := itemPayload.PageCount
		if pageCount <= 0 {
			pageCount = 1
		}

		unitPrice := itemPayload.UnitPrice
		if unitPrice.LessThan(decimal.Zero) {
			unitPrice = decimal.Zero
		}
		unitCost := itemPayload.UnitCost
		if unitCost.LessThan(decimal.Zero) {
			unitCost = decimal.Zero
		}

		itemTotalPrice := unitPrice.Mul(decimal.NewFromInt(int64(qty)))
		itemTotalCost := unitCost.Mul(decimal.NewFromInt(int64(qty)))
		totalAmount = totalAmount.Add(itemTotalPrice)

		bindingType := itemPayload.BindingType
		if bindingType == "" {
			bindingType = domain.BindingNone
		}

		orderItems = append(orderItems, domain.OrderItem{
			ID:               itemID,
			OrderID:          orderID,
			ProductID:        itemPayload.ProductID,
			JobName:          itemPayload.JobName,
			ItemName:         itemPayload.ItemName,
			Quantity:         qty,
			PageCount:        pageCount,
			PaperSize:        itemPayload.PaperSize,
			PaperSKU:         itemPayload.PaperSKU,
			BindingType:      bindingType,
			SpineWidthMM:     itemPayload.SpineWidthMM,
			UnitPrice:        unitPrice,
			UnitCost:         unitCost,
			TotalPrice:       itemTotalPrice,
			TotalCost:        itemTotalCost,
			IsManualOverride: false,
			Specs:            itemPayload.Specs,
			CreatedAt:        time.Now(),
			UpdatedAt:        time.Now(),
		})
	}

	depositAmount := payload.DepositAmount
	if depositAmount.LessThan(decimal.Zero) {
		depositAmount = decimal.Zero
	}
	remainingAmount := totalAmount.Sub(depositAmount)
	if remainingAmount.LessThan(decimal.Zero) {
		remainingAmount = decimal.Zero
	}

	order := &domain.Order{
		ID:              orderID,
		OrderNumber:     orderNumber,
		CustomerID:      payload.CustomerID,
		CustomerName:    payload.CustomerName,
		CustomerPhone:   payload.CustomerPhone,
		CustomerEmail:   payload.CustomerEmail,
		CustomerAddress: payload.CustomerAddress,
		Status:          initialStatus,
		TotalAmount:     totalAmount,
		DepositAmount:   depositAmount,
		RemainingAmount: remainingAmount,
		Currency:        currency,
		ExchangeRate:    exchangeRate,
		GoogleDriveLink: payload.GoogleDriveLink,
		DeliveryDate:    payload.DeliveryDate,
		Notes:           payload.Notes,
		CreatedBy:       payload.CreatedBy,
		Items:           orderItems,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	tx, err := s.orderRepo.BeginTx(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if err := s.orderRepo.CreateOrderWithTx(ctx, tx, order); err != nil {
		return nil, fmt.Errorf("failed to insert order: %w", err)
	}

	for i := range orderItems {
		if err := s.orderRepo.CreateOrderItemWithTx(ctx, tx, &orderItems[i]); err != nil {
			return nil, fmt.Errorf("failed to insert order item %s: %w", orderItems[i].ItemName, err)
		}
	}

	// Record initial status history
	history := &domain.OrderStatusHistory{
		ID:             generateID("hist"),
		OrderID:        orderID,
		PreviousStatus: "",
		NewStatus:      initialStatus,
		Reason:         "Order/Quotation created in system",
		PerformedBy:    payload.CreatedBy,
		CreatedAt:      time.Now(),
	}
	if err := s.orderRepo.RecordStatusHistoryWithTx(ctx, tx, history); err != nil {
		return nil, fmt.Errorf("failed to record status history: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit order transaction: %w", err)
	}

	return s.GetOrderByID(ctx, orderID)
}

// UpdateOrderStatus transitions order lifecycle with strict guard and automated stock deduction at IN_PRODUCTION
func (s *OrderService) UpdateOrderStatus(ctx context.Context, orderID string, payload domain.UpdateOrderStatusPayload) (*domain.Order, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return nil, fmt.Errorf("order not found: %w", err)
	}

	currentStatus := order.Status
	targetStatus := payload.Status

	// 1. Enforce State Transition Guard
	if err := domain.ValidateStatusTransition(currentStatus, targetStatus); err != nil {
		return nil, fmt.Errorf("state transition forbidden from %s to %s: %w", currentStatus, targetStatus, err)
	}

	tx, err := s.orderRepo.BeginTx(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// 2. Automated Point of Stock Deduction when entering IN_PRODUCTION
	if targetStatus == domain.StatusInProduction && order.StockDeductedAt == nil {
		now := time.Now()
		if err := s.executeStockDeductionWithTx(ctx, tx, order, payload.PerformedBy); err != nil {
			return nil, fmt.Errorf("failed to deduct inventory stock: %w", err)
		}
		if err := s.orderRepo.MarkStockDeductedWithTx(ctx, tx, order.ID, now); err != nil {
			return nil, fmt.Errorf("failed to mark stock deducted: %w", err)
		}
	}

	// 3. Handle Cancellation policy
	reasonText := payload.Reason
	if targetStatus == domain.StatusCancelled {
		if order.StockDeductedAt != nil {
			// Cancelled after IN_PRODUCTION - stock was deducted and is NOT refunded
			extraNote := "[NOTICE: Order cancelled after IN_PRODUCTION; deducted material stock remains allocated/used and is not refunded]"
			if reasonText == "" {
				reasonText = extraNote
			} else {
				reasonText = reasonText + " " + extraNote
			}
		}
	}

	// 4. Update status and record audit history
	if err := s.orderRepo.UpdateOrderStatusWithTx(ctx, tx, order.ID, targetStatus); err != nil {
		return nil, fmt.Errorf("failed to update order status: %w", err)
	}

	history := &domain.OrderStatusHistory{
		ID:             generateID("hist"),
		OrderID:        order.ID,
		PreviousStatus: currentStatus,
		NewStatus:      targetStatus,
		Reason:         reasonText,
		PerformedBy:    payload.PerformedBy,
		CreatedAt:      time.Now(),
	}
	if err := s.orderRepo.RecordStatusHistoryWithTx(ctx, tx, history); err != nil {
		return nil, fmt.Errorf("failed to record status history: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit status update transaction: %w", err)
	}

	return s.GetOrderByID(ctx, orderID)
}

// executeStockDeductionWithTx calculates required paper and ink consumption and deducts real materials inside transaction
func (s *OrderService) executeStockDeductionWithTx(ctx context.Context, tx *sql.Tx, order *domain.Order, operator string) error {
	for _, item := range order.Items {
		// A. Paper Stock Deduction & Spoilage Calculation
		sheetsPerUnit := item.PageCount
		if item.Specs.IsDoubleSided {
			sheetsPerUnit = (item.PageCount + 1) / 2
		}
		netSheetsRequired := decimal.NewFromInt(int64(sheetsPerUnit * item.Quantity))

		spoilageRate := item.Specs.SpoilageRatePct
		if spoilageRate.LessThanOrEqual(decimal.Zero) {
			spoilageRate = decimal.NewFromFloat(5.0) // 5% standard spoilage baseline
		}

		spoilageSheets := netSheetsRequired.Mul(spoilageRate).Div(decimal.NewFromInt(100)).Ceil()
		totalPaperSheets := netSheetsRequired.Add(spoilageSheets)

		paperSearchKey := item.PaperSKU
		if paperSearchKey == "" {
			paperSearchKey = item.PaperSize
		}

		if paperSearchKey != "" {
			mat, err := s.materialRepo.FindByIDOrSKUWithTx(ctx, tx, paperSearchKey)
			if err == nil && mat != nil {
				// Deduct paper from stock
				mat.StockQty = mat.StockQty.Sub(totalPaperSheets)
				if mat.StockQty.LessThanOrEqual(mat.ReorderThreshold) {
					mat.StockStatus = domain.StockStatusLowStock
				}
				if mat.StockQty.LessThanOrEqual(decimal.Zero) {
					mat.StockStatus = domain.StockStatusOutOfStock
				}
				if err := s.materialRepo.UpdateWithTx(ctx, tx, mat); err != nil {
					return fmt.Errorf("failed to update paper stock for %s: %w", mat.Name, err)
				}

				// Record paper spoilage log
				spoilageCost := spoilageSheets.Mul(mat.CostPerConsumptionUnit)
				spoilageEntry := &domain.SpoilageLog{
					ID:              generateID("spoil"),
					OrderID:         order.ID,
					OrderItemID:     item.ID,
					MaterialSKU:     mat.SKU,
					MaterialName:    mat.Name,
					Category:        "paper",
					QuantitySpoiled: spoilageSheets,
					Unit:            mat.ConsumptionUnit,
					Reason:          fmt.Sprintf("Standard production paper setup & trimming spoilage (%.1f%%)", spoilageRate.InexactFloat64()),
					CostImpact:      spoilageCost,
					RecordedBy:      operator,
					CreatedAt:       time.Now(),
				}
				_ = s.orderRepo.RecordSpoilageWithTx(ctx, tx, spoilageEntry)

				// Record inventory transaction
				s.recordInventoryTransactionWithTx(ctx, tx, mat.ID, totalPaperSheets.Neg(), "allocation", order.ID, operator,
					fmt.Sprintf("Production deduction for Order #%s (%s: %s sheets + %s waste)", order.OrderNumber, item.ItemName, netSheetsRequired.String(), spoilageSheets.String()))
			}
		}

		// B. Ink Stock Deduction (CMYK coverage estimation)
		coveragePct := item.Specs.InkCoveragePercent
		if coveragePct.LessThanOrEqual(decimal.Zero) {
			// Sum individual channels if total coverage is not set
			coveragePct = item.Specs.InkCoverageC.Add(item.Specs.InkCoverageM).Add(item.Specs.InkCoverageY).Add(item.Specs.InkCoverageK)
			if coveragePct.LessThanOrEqual(decimal.Zero) {
				coveragePct = decimal.NewFromFloat(20.0) // 20% standard TAC default
			}
		}

		// Consumption estimation: 0.05 ml per A4 page at 100% coverage
		totalPages := decimal.NewFromInt(int64(item.PageCount * item.Quantity))
		estimatedInkML := totalPages.Mul(coveragePct).Mul(decimal.NewFromFloat(0.0005))

		// Check if master ink material exists to deduct
		inkMat, err := s.materialRepo.FindByIDOrSKUWithTx(ctx, tx, "INK-GENERIC-CMYK")
		if err == nil && inkMat != nil {
			inkMat.StockQty = inkMat.StockQty.Sub(estimatedInkML)
			_ = s.materialRepo.UpdateWithTx(ctx, tx, inkMat)
			s.recordInventoryTransactionWithTx(ctx, tx, inkMat.ID, estimatedInkML.Neg(), "allocation", order.ID, operator,
				fmt.Sprintf("Ink consumption for Order #%s (%s ml at %s%% coverage)", order.OrderNumber, estimatedInkML.StringFixed(2), coveragePct.StringFixed(1)))
		}
	}

	return nil
}

// recordInventoryTransactionWithTx logs entry into inventory_transactions table if available
func (s *OrderService) recordInventoryTransactionWithTx(ctx context.Context, tx *sql.Tx, materialID string, qty decimal.Decimal, txType, orderID, operator, notes string) {
	query := `
		INSERT INTO inventory_transactions (
			id, material_id, qty_adjusted, type, reference_id, performed_by, notes, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, NOW()
		)`

	txID := generateID("itx")
	var perfByVal *string
	if operator != "" {
		perfByVal = &operator
	}
	var refIDVal *string
	if orderID != "" {
		refIDVal = &orderID
	}

	_, _ = tx.ExecContext(ctx, query, txID, materialID, qty, txType, refIDVal, perfByVal, notes)
}

// OverridePricing recalculates and overrides item price snapshot with audit trail
func (s *OrderService) OverridePricing(ctx context.Context, orderID string, payload domain.OverridePricingPayload) (*domain.Order, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return nil, fmt.Errorf("order not found: %w", err)
	}

	if order.Status == domain.StatusCompleted {
		return nil, domain.ErrOrderAlreadyCompleted
	}
	if order.Status == domain.StatusCancelled {
		return nil, domain.ErrOrderAlreadyCancelled
	}

	if payload.OverrideUnitPrice.LessThan(decimal.Zero) {
		return nil, fmt.Errorf("override unit price cannot be negative")
	}
	if strings.TrimSpace(payload.Reason) == "" {
		return nil, fmt.Errorf("override reason is required")
	}
	if strings.TrimSpace(payload.ApprovedBy) == "" {
		return nil, fmt.Errorf("approver name/ID is required")
	}

	var targetItem *domain.OrderItem
	for i := range order.Items {
		if order.Items[i].ID == payload.OrderItemID {
			targetItem = &order.Items[i]
			break
		}
	}
	if targetItem == nil {
		return nil, fmt.Errorf("order item %s not found in this order", payload.OrderItemID)
	}

	newUnitPrice := payload.OverrideUnitPrice
	newTotalPrice := newUnitPrice.Mul(decimal.NewFromInt(int64(targetItem.Quantity)))

	tx, err := s.orderRepo.BeginTx(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Update item price
	if err := s.orderRepo.UpdateItemPricingWithTx(ctx, tx, targetItem.ID, newUnitPrice, newTotalPrice, payload.Reason, payload.ApprovedBy); err != nil {
		return nil, fmt.Errorf("failed to update item pricing: %w", err)
	}

	// Recalculate order total amount
	newOrderTotal := decimal.Zero
	for _, it := range order.Items {
		if it.ID == targetItem.ID {
			newOrderTotal = newOrderTotal.Add(newTotalPrice)
		} else {
			newOrderTotal = newOrderTotal.Add(it.TotalPrice)
		}
	}

	newRemaining := newOrderTotal.Sub(order.DepositAmount)
	if newRemaining.LessThan(decimal.Zero) {
		newRemaining = decimal.Zero
	}

	if err := s.orderRepo.UpdateOrderTotalsWithTx(ctx, tx, order.ID, newOrderTotal, newRemaining); err != nil {
		return nil, fmt.Errorf("failed to update order totals: %w", err)
	}

	// Record audit history
	history := &domain.OrderStatusHistory{
		ID:             generateID("hist"),
		OrderID:        order.ID,
		PreviousStatus: order.Status,
		NewStatus:      order.Status,
		Reason:         fmt.Sprintf("Manual Price Override for item %s: Unit Price %s -> %s (%s). Approved by: %s", targetItem.ItemName, targetItem.UnitPrice.String(), newUnitPrice.String(), payload.Reason, payload.ApprovedBy),
		PerformedBy:    payload.ApprovedBy,
		CreatedAt:      time.Now(),
	}
	_ = s.orderRepo.RecordStatusHistoryWithTx(ctx, tx, history)

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit price override: %w", err)
	}

	return s.GetOrderByID(ctx, orderID)
}

// GetOrderByID retrieves order by ID or order number
func (s *OrderService) GetOrderByID(ctx context.Context, idOrOrderNo string) (*domain.Order, error) {
	clean := strings.TrimSpace(idOrOrderNo)
	if clean == "" {
		return nil, fmt.Errorf("order identifier is required")
	}

	order, err := s.orderRepo.FindByID(ctx, clean)
	if err == nil && order != nil {
		return order, nil
	}

	return s.orderRepo.FindByOrderNumber(ctx, clean)
}

// ListOrders retrieves paginated orders
func (s *OrderService) ListOrders(ctx context.Context, filter domain.OrderFilter) ([]domain.Order, int, error) {
	return s.orderRepo.ListOrders(ctx, filter)
}

// GetSpoilageLogs retrieves waste records for an order
func (s *OrderService) GetSpoilageLogs(ctx context.Context, orderID string) ([]domain.SpoilageLog, error) {
	return s.orderRepo.GetSpoilageLogs(ctx, orderID)
}

// GetStatusHistories retrieves full state transition logs
func (s *OrderService) GetStatusHistories(ctx context.Context, orderID string) ([]domain.OrderStatusHistory, error) {
	return s.orderRepo.GetStatusHistories(ctx, orderID)
}
