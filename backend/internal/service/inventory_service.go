package service

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"backend/internal/domain"
	"backend/internal/repository"

	"github.com/shopspring/decimal"
)

type InventoryService struct {
	db           *sql.DB
	materialRepo *repository.MaterialRepository
	inboundRepo  *repository.InboundRepository
}

func NewInventoryService(database *sql.DB) *InventoryService {
	return &InventoryService{
		db:           database,
		materialRepo: repository.NewMaterialRepository(database),
		inboundRepo:  repository.NewInboundRepository(database),
	}
}

// ProcessStockInbound handles atomic inbound creation, moving average cost calculation and stock increment
func (s *InventoryService) ProcessStockInbound(ctx context.Context, req domain.CreateInboundPayload) (*domain.StockInboundRecord, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	if req.QuantityReceived.LessThanOrEqual(decimal.Zero) {
		return nil, fmt.Errorf("quantity received must be greater than zero")
	}
	if req.UnitPurchasePrice.LessThan(decimal.Zero) {
		return nil, fmt.Errorf("unit purchase price cannot be negative")
	}

	sku := strings.TrimSpace(req.SKUCode)
	if sku == "" && req.MaterialID != "" {
		sku = req.MaterialID
	}
	if sku == "" {
		sku = fmt.Sprintf("MAT-%d", time.Now().Unix())
	}
	name := strings.TrimSpace(req.ItemName)
	if name == "" {
		name = sku
	}
	category := strings.TrimSpace(req.Category)
	if category == "" {
		category = "paper"
	}

	multiplier := req.PurchaseMultiplier
	if multiplier.LessThanOrEqual(decimal.Zero) {
		multiplier = decimal.NewFromInt(1)
	}

	// Incoming consumption unit calculations
	incomingConsumptionQty := req.QuantityReceived.Mul(multiplier)
	incomingConsumptionUnitCost := req.UnitPurchasePrice.Div(multiplier)

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// 1. Search for existing Master Material
	searchKey := req.MaterialID
	if searchKey == "" {
		searchKey = sku
	}
	existingMat, err := s.materialRepo.FindByIDOrSKUWithTx(ctx, tx, searchKey)

	var targetMaterialID string
	if err == nil && existingMat != nil {
		// Existing Master Record found: Calculate Moving Average Cost
		targetMaterialID = existingMat.ID

		currentStock := existingMat.StockQty
		currentConsumptionCost := existingMat.CostPerConsumptionUnit

		var newConsumptionCost decimal.Decimal
		if currentStock.LessThanOrEqual(decimal.Zero) {
			// Zero or negative stock baseline: incoming cost becomes new baseline
			newConsumptionCost = incomingConsumptionUnitCost
		} else {
			// Weighted Moving Average Formula:
			// ((Current Qty * Current Cost) + (Incoming Qty * Incoming Cost)) / (Current Qty + Incoming Qty)
			currentVal := currentStock.Mul(currentConsumptionCost)
			incomingVal := incomingConsumptionQty.Mul(incomingConsumptionUnitCost)
			totalQty := currentStock.Add(incomingConsumptionQty)

			if totalQty.GreaterThan(decimal.Zero) {
				newConsumptionCost = currentVal.Add(incomingVal).Div(totalQty)
			} else {
				newConsumptionCost = incomingConsumptionUnitCost
			}
		}

		newPurchaseCost := newConsumptionCost.Mul(multiplier)
		newTotalStock := currentStock.Add(incomingConsumptionQty)

		existingMat.StockQty = newTotalStock
		existingMat.CostPerConsumptionUnit = newConsumptionCost
		existingMat.CostPerPurchaseUnit = newPurchaseCost
		existingMat.PurchaseMultiplier = multiplier
		if req.PurchaseUnit != "" {
			existingMat.PurchaseUnit = req.PurchaseUnit
		}

		// Adjust stock status
		if newTotalStock.GreaterThan(existingMat.MinStockAlert) {
			existingMat.StockStatus = domain.StockStatusInStock
		} else if newTotalStock.GreaterThan(decimal.Zero) {
			existingMat.StockStatus = domain.StockStatusLowStock
		} else {
			existingMat.StockStatus = domain.StockStatusOutOfStock
		}

		if err := s.materialRepo.UpdateWithTx(ctx, tx, existingMat); err != nil {
			return nil, fmt.Errorf("failed to update material stock & moving cost: %w", err)
		}
	} else {
		// New Master Record: Insert initial entry
		targetMaterialID = sku
		initialStatus := domain.StockStatusInStock
		if incomingConsumptionQty.LessThanOrEqual(decimal.Zero) {
			initialStatus = domain.StockStatusOutOfStock
		}

		consumptionUnit := "Unit"
		catLower := strings.ToLower(category)
		if strings.Contains(catLower, "paper") || strings.Contains(catLower, "เจ้ย") {
			consumptionUnit = "Sheet"
		} else if strings.Contains(catLower, "ink") || strings.Contains(catLower, "หมึก") {
			consumptionUnit = "ml"
		}

		newMat := &domain.Material{
			ID:                     targetMaterialID,
			SKU:                    sku,
			Name:                   name,
			Category:               category,
			StockQty:               incomingConsumptionQty,
			ConsumptionUnit:        consumptionUnit,
			PurchaseUnit:           req.PurchaseUnit,
			PurchaseMultiplier:     multiplier,
			CostPerPurchaseUnit:    req.UnitPurchasePrice,
			CostPerConsumptionUnit: incomingConsumptionUnitCost,
			ReorderThreshold:       decimal.NewFromInt(50),
			MinStockAlert:          decimal.NewFromInt(10),
			StockStatus:            initialStatus,
			IsActive:               true,
			TechnicalSpecs:         req.TechnicalSpecs,
		}

		if err := s.materialRepo.CreateWithTx(ctx, tx, newMat); err != nil {
			return nil, fmt.Errorf("failed to create new master material: %w", err)
		}
	}

	// 2. Insert Inbound History Record
	inboundID := fmt.Sprintf("INB-%d", time.Now().UnixNano())
	inboundNumber := fmt.Sprintf("IBN-%s", time.Now().Format("20060102-150405"))
	inboundDate := domain.ParseInboundDate(req.InboundDate)

	totalPrice := req.TotalPrice
	if totalPrice.IsZero() {
		totalPrice = req.QuantityReceived.Mul(req.UnitPurchasePrice).Add(req.TariffFee).Add(req.FreightFee)
	}

	record := &domain.StockInboundRecord{
		ID:                 inboundID,
		InboundNumber:      inboundNumber,
		PONumber:           req.PONumber,
		MaterialID:         targetMaterialID,
		SKUCode:            sku,
		ItemName:           name,
		Category:           category,
		SupplierName:       req.SupplierName,
		LotBatchNumber:     req.LotBatchNumber,
		InboundDate:        inboundDate,

		QuantityReceived:   req.QuantityReceived,
		PurchaseUnit:       req.PurchaseUnit,
		PurchaseMultiplier: multiplier,
		UnitPurchasePrice:  req.UnitPurchasePrice,
		TotalPrice:         totalPrice,
		Status:             domain.InboundStatusCompleted,
		PaymentMethod:      req.PaymentMethod,
		Origin:             req.Origin,
		TariffFee:          req.TariffFee,
		FreightFee:         req.FreightFee,
		ProductImageURL:    req.ProductImageURL,
		ReceiptSlipURL:     req.ReceiptSlipURL,
		ReceivedByUserID:   req.ReceivedByUserID,
		TechnicalSpecs:     req.TechnicalSpecs,
	}

	if err := s.inboundRepo.CreateInboundRecordWithTx(ctx, tx, record); err != nil {
		return nil, fmt.Errorf("failed to create inbound history record: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit inbound transaction: %w", err)
	}

	return record, nil
}

// CancelStockInbound reverses a previously completed inbound, deducts stock, and retains record with zero-stock handling
func (s *InventoryService) CancelStockInbound(ctx context.Context, req domain.CancelInboundPayload) (*domain.StockInboundRecord, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}
	if strings.TrimSpace(req.InboundID) == "" {
		return nil, fmt.Errorf("inbound_id is required")
	}
	if strings.TrimSpace(req.Reason) == "" {
		return nil, fmt.Errorf("cancellation reason is required")
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// 1. Fetch Inbound Record
	record, err := s.inboundRepo.FindInboundByIDWithTx(ctx, tx, req.InboundID)
	if err != nil {
		return nil, fmt.Errorf("inbound record not found: %w", err)
	}
	if record.Status == domain.InboundStatusCancelled {
		return nil, fmt.Errorf("inbound record is already cancelled")
	}

	// 2. Fetch associated Master Material
	mat, err := s.materialRepo.FindByIDOrSKUWithTx(ctx, tx, record.MaterialID)
	if err != nil {
		// Fallback lookup by SKU
		mat, err = s.materialRepo.FindByIDOrSKUWithTx(ctx, tx, record.SKUCode)
		if err != nil {
			return nil, fmt.Errorf("associated material master not found: %w", err)
		}
	}

	// 3. Check stock balance and deduct
	consumptionQtyToDeduct := record.QuantityReceived.Mul(record.PurchaseMultiplier)
	if mat.StockQty.LessThan(consumptionQtyToDeduct) {
		return nil, fmt.Errorf("cannot cancel inbound: remaining stock (%s) is less than inbound quantity (%s)",
			mat.StockQty.StringFixed(2), consumptionQtyToDeduct.StringFixed(2))
	}

	newStock := mat.StockQty.Sub(consumptionQtyToDeduct)
	var newStatus domain.StockStatus

	if newStock.LessThanOrEqual(decimal.Zero) {
		newStock = decimal.Zero
		newStatus = domain.StockStatusOutOfStock
	} else if newStock.LessThanOrEqual(mat.MinStockAlert) {
		newStatus = domain.StockStatusLowStock
	} else {
		newStatus = domain.StockStatusInStock
	}

	// Update material stock & status
	if err := s.materialRepo.UpdateStockAndStatusWithTx(ctx, tx, mat.ID, newStock, newStatus); err != nil {
		return nil, fmt.Errorf("failed to update material stock: %w", err)
	}

	// 4. Update inbound record to CANCELLED
	if err := s.inboundRepo.UpdateInboundStatusWithTx(ctx, tx, record.ID, domain.InboundStatusCancelled, req.UserID, req.Reason); err != nil {
		return nil, fmt.Errorf("failed to cancel inbound record: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit cancellation transaction: %w", err)
	}

	record.Status = domain.InboundStatusCancelled
	record.CancelledByUserID = req.UserID
	record.CancellationReason = req.Reason
	now := time.Now()
	record.CancelledAt = &now

	return record, nil
}

// UpdateMaterialDirect allows admins to directly edit master material properties
func (s *InventoryService) UpdateMaterialDirect(ctx context.Context, id string, req domain.UpdateMaterialPayload) (*domain.Material, error) {
	return s.materialRepo.UpdateDirect(ctx, id, req)
}

// DeleteInbound removes an inbound record by ID or Lot Number
func (s *InventoryService) DeleteInbound(ctx context.Context, idOrLot string) error {
	return s.inboundRepo.DeleteInboundRecord(ctx, idOrLot)
}

// GetAllMaterials retrieves all master materials
func (s *InventoryService) GetAllMaterials(ctx context.Context) ([]domain.Material, error) {
	return s.materialRepo.FindAll(ctx)
}

// GetMaterialByID retrieves a single material by ID or SKU
func (s *InventoryService) GetMaterialByID(ctx context.Context, id string) (*domain.Material, error) {
	return s.materialRepo.FindByIDOrSKU(ctx, id)
}

// GetInboundHistory retrieves all inbound records
func (s *InventoryService) GetInboundHistory(ctx context.Context) ([]domain.StockInboundRecord, error) {
	return s.inboundRepo.FindAllInboundRecords(ctx)
}

// --- Ink Bottle Inventory Services ---

// GetInkBottles returns all bottle inventory items
func (s *InventoryService) GetInkBottles(ctx context.Context) ([]domain.InkBottleInventory, error) {
	return s.inboundRepo.FindAllInkBottles(ctx)
}

// IntakeInkBottle registers new bottles into stock
func (s *InventoryService) IntakeInkBottle(ctx context.Context, req domain.IntakeInkBottleRequest) (*domain.InkBottleInventory, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	id := fmt.Sprintf("INK-BTL-%s", strings.ToUpper(strings.TrimSpace(req.InkCode)))
	costPerMl := decimal.Zero
	if req.BottleCapacityMl.GreaterThan(decimal.Zero) {
		costPerMl = req.BottleCost.Div(req.BottleCapacityMl)
	}

	minAlert := req.MinBottleAlert
	if minAlert <= 0 {
		minAlert = 2
	}

	item := &domain.InkBottleInventory{
		ID:               id,
		InkCode:          req.InkCode,
		InkName:          req.InkName,
		ColorGroup:       req.ColorGroup,
		ColorCode:        req.ColorCode,
		BottleCapacityMl: req.BottleCapacityMl,
		BottleCost:       req.BottleCost,
		CostPerMl:        costPerMl,
		BottlesInStock:   req.Quantity,
		MinBottleAlert:   minAlert,
		IsCompatible:     req.IsCompatible,
		TargetPrinterID:  req.TargetPrinterID,
		SupplierName:     req.SupplierName,
		SupplierPhone:    req.SupplierPhone,
		PurchaseLink:     req.PurchaseLink,
		ProductImageURL:  req.ProductImageURL,
		ReceiptSlipURL:   req.ReceiptSlipURL,
		Status:           "IN_STOCK",
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if err := s.inboundRepo.CreateInkBottleWithTx(ctx, tx, item); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit ink bottle intake: %w", err)
	}

	return item, nil
}


// DeductInkBottle deducts bottles when refilling printer
func (s *InventoryService) DeductInkBottle(ctx context.Context, req domain.DeductInkBottleRequest) (*domain.InkBottleInventory, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	item, err := s.inboundRepo.DeductInkBottleWithTx(ctx, tx, req.InkBottleID, req.Quantity)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return item, nil
}
