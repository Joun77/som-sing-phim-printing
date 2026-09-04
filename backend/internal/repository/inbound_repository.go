package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"backend/internal/domain"
)

type InboundRepository struct {
	db *sql.DB
}

func NewInboundRepository(database *sql.DB) *InboundRepository {
	return &InboundRepository{db: database}
}

// CreateInboundRecordWithTx inserts a new stock inbound record within an ongoing transaction
func (r *InboundRepository) CreateInboundRecordWithTx(ctx context.Context, tx *sql.Tx, record *domain.StockInboundRecord) error {
	techSpecsJSON, _ := json.Marshal(record.TechnicalSpecs)

	query := `
		INSERT INTO stock_inbound_records (
			id, inbound_number, po_number, material_id, sku_code, item_name,
			category, supplier_name, inbound_date, quantity_received, purchase_unit,
			purchase_multiplier, unit_purchase_price, total_price, status, payment_method,
			origin, tariff_fee, freight_fee, product_image_url, receipt_slip_url,
			received_by_user_id, technical_specs, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8, $9, $10, $11,
			$12, $13, $14, $15, $16,
			$17, $18, $19, $20, $21,
			$22, $23, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
		)`

	_, err := tx.ExecContext(ctx, query,
		record.ID, record.InboundNumber, record.PONumber, record.MaterialID, record.SKUCode, record.ItemName,
		record.Category, record.SupplierName, record.InboundDate, record.QuantityReceived, record.PurchaseUnit,
		record.PurchaseMultiplier, record.UnitPurchasePrice, record.TotalPrice, record.Status, record.PaymentMethod,
		record.Origin, record.TariffFee, record.FreightFee, record.ProductImageURL, record.ReceiptSlipURL,
		record.ReceivedByUserID, techSpecsJSON,
	)
	return err
}

// FindInboundByID finds an inbound record by primary key
func (r *InboundRepository) FindInboundByID(ctx context.Context, id string) (*domain.StockInboundRecord, error) {
	if r.db == nil {
		return nil, sql.ErrNoRows
	}

	query := `
		SELECT id, inbound_number, COALESCE(po_number, ''), material_id, sku_code, item_name,
		       COALESCE(category, ''), COALESCE(supplier_name, ''), inbound_date,
		       quantity_received, COALESCE(purchase_unit, ''), purchase_multiplier,
		       unit_purchase_price, total_price, status, COALESCE(payment_method, ''),
		       COALESCE(origin, ''), tariff_fee, freight_fee,
		       COALESCE(product_image_url, ''), COALESCE(receipt_slip_url, ''),
		       COALESCE(received_by_user_id, ''), COALESCE(cancelled_by_user_id, ''),
		       COALESCE(cancellation_reason, ''), cancelled_at,
		       COALESCE(technical_specs, '{}'::jsonb), created_at, updated_at
		FROM stock_inbound_records
		WHERE id = $1`

	var rec domain.StockInboundRecord
	var inboundDate time.Time
	var techSpecsJSON []byte

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&rec.ID, &rec.InboundNumber, &rec.PONumber, &rec.MaterialID, &rec.SKUCode, &rec.ItemName,
		&rec.Category, &rec.SupplierName, &inboundDate,
		&rec.QuantityReceived, &rec.PurchaseUnit, &rec.PurchaseMultiplier,
		&rec.UnitPurchasePrice, &rec.TotalPrice, &rec.Status, &rec.PaymentMethod,
		&rec.Origin, &rec.TariffFee, &rec.FreightFee,
		&rec.ProductImageURL, &rec.ReceiptSlipURL,
		&rec.ReceivedByUserID, &rec.CancelledByUserID,
		&rec.CancellationReason, &rec.CancelledAt,
		&techSpecsJSON, &rec.CreatedAt, &rec.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	rec.InboundDate = inboundDate
	_ = json.Unmarshal(techSpecsJSON, &rec.TechnicalSpecs)
	return &rec, nil
}

// FindInboundByIDWithTx finds an inbound record within an ongoing transaction
func (r *InboundRepository) FindInboundByIDWithTx(ctx context.Context, tx *sql.Tx, id string) (*domain.StockInboundRecord, error) {
	query := `
		SELECT id, inbound_number, COALESCE(po_number, ''), material_id, sku_code, item_name,
		       COALESCE(category, ''), COALESCE(supplier_name, ''), inbound_date,
		       quantity_received, COALESCE(purchase_unit, ''), purchase_multiplier,
		       unit_purchase_price, total_price, status, COALESCE(payment_method, ''),
		       COALESCE(origin, ''), tariff_fee, freight_fee,
		       COALESCE(product_image_url, ''), COALESCE(receipt_slip_url, ''),
		       COALESCE(received_by_user_id, ''), COALESCE(cancelled_by_user_id, ''),
		       COALESCE(cancellation_reason, ''), cancelled_at,
		       COALESCE(technical_specs, '{}'::jsonb), created_at, updated_at
		FROM stock_inbound_records
		WHERE id = $1
		FOR UPDATE`

	var rec domain.StockInboundRecord
	var inboundDate time.Time
	var techSpecsJSON []byte

	err := tx.QueryRowContext(ctx, query, id).Scan(
		&rec.ID, &rec.InboundNumber, &rec.PONumber, &rec.MaterialID, &rec.SKUCode, &rec.ItemName,
		&rec.Category, &rec.SupplierName, &inboundDate,
		&rec.QuantityReceived, &rec.PurchaseUnit, &rec.PurchaseMultiplier,
		&rec.UnitPurchasePrice, &rec.TotalPrice, &rec.Status, &rec.PaymentMethod,
		&rec.Origin, &rec.TariffFee, &rec.FreightFee,
		&rec.ProductImageURL, &rec.ReceiptSlipURL,
		&rec.ReceivedByUserID, &rec.CancelledByUserID,
		&rec.CancellationReason, &rec.CancelledAt,
		&techSpecsJSON, &rec.CreatedAt, &rec.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	rec.InboundDate = inboundDate
	_ = json.Unmarshal(techSpecsJSON, &rec.TechnicalSpecs)
	return &rec, nil
}

// FindAllInboundRecords retrieves all inbound procurement logs ordered by date
func (r *InboundRepository) FindAllInboundRecords(ctx context.Context) ([]domain.StockInboundRecord, error) {
	if r.db == nil {
		return []domain.StockInboundRecord{}, nil
	}

	query := `
		SELECT id, inbound_number, COALESCE(po_number, ''), material_id, sku_code, item_name,
		       COALESCE(category, ''), COALESCE(supplier_name, ''), inbound_date,
		       quantity_received, COALESCE(purchase_unit, ''), purchase_multiplier,
		       unit_purchase_price, total_price, status, COALESCE(payment_method, ''),
		       COALESCE(origin, ''), tariff_fee, freight_fee,
		       COALESCE(product_image_url, ''), COALESCE(receipt_slip_url, ''),
		       COALESCE(received_by_user_id, ''), COALESCE(cancelled_by_user_id, ''),
		       COALESCE(cancellation_reason, ''), cancelled_at,
		       COALESCE(technical_specs, '{}'::jsonb), created_at, updated_at
		FROM stock_inbound_records
		ORDER BY created_at DESC`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.StockInboundRecord
	for rows.Next() {
		var rec domain.StockInboundRecord
		var inboundDate time.Time
		var techSpecsJSON []byte

		err := rows.Scan(
			&rec.ID, &rec.InboundNumber, &rec.PONumber, &rec.MaterialID, &rec.SKUCode, &rec.ItemName,
			&rec.Category, &rec.SupplierName, &inboundDate,
			&rec.QuantityReceived, &rec.PurchaseUnit, &rec.PurchaseMultiplier,
			&rec.UnitPurchasePrice, &rec.TotalPrice, &rec.Status, &rec.PaymentMethod,
			&rec.Origin, &rec.TariffFee, &rec.FreightFee,
			&rec.ProductImageURL, &rec.ReceiptSlipURL,
			&rec.ReceivedByUserID, &rec.CancelledByUserID,
			&rec.CancellationReason, &rec.CancelledAt,
			&techSpecsJSON, &rec.CreatedAt, &rec.UpdatedAt,
		)
		if err != nil {
			continue
		}
		rec.InboundDate = inboundDate
		_ = json.Unmarshal(techSpecsJSON, &rec.TechnicalSpecs)
		list = append(list, rec)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return list, nil
}


// DeleteInboundRecord deletes an inbound record by ID or Lot Number
func (r *InboundRepository) DeleteInboundRecord(ctx context.Context, idOrLot string) error {
	if r.db == nil {
		return nil
	}
	query := `DELETE FROM stock_inbound_records WHERE id = $1 OR inbound_number = $1 OR lot_batch_number = $1 OR po_number = $1`
	_, err := r.db.ExecContext(ctx, query, idOrLot)
	return err
}

// UpdateInboundStatusWithTx sets status to CANCELLED and marks cancellation details
func (r *InboundRepository) UpdateInboundStatusWithTx(ctx context.Context, tx *sql.Tx, id string, status domain.InboundStatus, cancelledBy string, reason string) error {
	query := `
		UPDATE stock_inbound_records SET
			status = $2,
			cancelled_by_user_id = $3,
			cancellation_reason = $4,
			cancelled_at = CURRENT_TIMESTAMP,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $1`

	_, err := tx.ExecContext(ctx, query, id, status, cancelledBy, reason)
	return err
}

// --- Ink Bottle Inventory Methods ---

// FindAllInkBottles retrieves all bottle inventory records
func (r *InboundRepository) FindAllInkBottles(ctx context.Context) ([]domain.InkBottleInventory, error) {
	if r.db == nil {
		return []domain.InkBottleInventory{}, nil
	}

	query := `
		SELECT id, ink_code, ink_name, color_group, COALESCE(color_code, ''),
		       bottle_capacity_ml, bottle_cost, cost_per_ml, bottles_in_stock,
		       min_bottle_alert, is_compatible, COALESCE(target_printer_id, ''),
		       COALESCE(supplier_name, ''), COALESCE(supplier_phone, ''),
		       COALESCE(purchase_link, ''), COALESCE(product_image_url, ''),
		       COALESCE(receipt_slip_url, ''), COALESCE(status, 'IN_STOCK'),
		       created_at, updated_at
		FROM ink_bottle_inventory
		ORDER BY ink_code ASC`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.InkBottleInventory
	for rows.Next() {
		var item domain.InkBottleInventory
		err := rows.Scan(
			&item.ID, &item.InkCode, &item.InkName, &item.ColorGroup, &item.ColorCode,
			&item.BottleCapacityMl, &item.BottleCost, &item.CostPerMl, &item.BottlesInStock,
			&item.MinBottleAlert, &item.IsCompatible, &item.TargetPrinterID,
			&item.SupplierName, &item.SupplierPhone,
			&item.PurchaseLink, &item.ProductImageURL,
			&item.ReceiptSlipURL, &item.Status,
			&item.CreatedAt, &item.UpdatedAt,
		)
		if err != nil {
			continue
		}
		list = append(list, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return list, nil
}


// FindInkBottleByID finds an ink bottle by ID
func (r *InboundRepository) FindInkBottleByID(ctx context.Context, id string) (*domain.InkBottleInventory, error) {
	if r.db == nil {
		return nil, sql.ErrNoRows
	}

	query := `
		SELECT id, ink_code, ink_name, color_group, COALESCE(color_code, ''),
		       bottle_capacity_ml, bottle_cost, cost_per_ml, bottles_in_stock,
		       min_bottle_alert, is_compatible, COALESCE(target_printer_id, ''),
		       COALESCE(supplier_name, ''), COALESCE(supplier_phone, ''),
		       COALESCE(purchase_link, ''), COALESCE(product_image_url, ''),
		       COALESCE(receipt_slip_url, ''), COALESCE(status, 'IN_STOCK'),
		       created_at, updated_at
		FROM ink_bottle_inventory
		WHERE id = $1 OR ink_code = $1`

	var item domain.InkBottleInventory
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&item.ID, &item.InkCode, &item.InkName, &item.ColorGroup, &item.ColorCode,
		&item.BottleCapacityMl, &item.BottleCost, &item.CostPerMl, &item.BottlesInStock,
		&item.MinBottleAlert, &item.IsCompatible, &item.TargetPrinterID,
		&item.SupplierName, &item.SupplierPhone,
		&item.PurchaseLink, &item.ProductImageURL,
		&item.ReceiptSlipURL, &item.Status,
		&item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// CreateInkBottleWithTx registers new ink bottle record or increments stock within a transaction
func (r *InboundRepository) CreateInkBottleWithTx(ctx context.Context, tx *sql.Tx, item *domain.InkBottleInventory) error {
	query := `
		INSERT INTO ink_bottle_inventory (
			id, ink_code, ink_name, color_group, color_code,
			bottle_capacity_ml, bottle_cost, cost_per_ml, bottles_in_stock,
			min_bottle_alert, is_compatible, target_printer_id,
			supplier_name, supplier_phone, purchase_link,
			product_image_url, receipt_slip_url, status,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5,
			$6, $7, $8, $9,
			$10, $11, $12,
			$13, $14, $15,
			$16, $17, $18,
			CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
		)
		ON CONFLICT (id) DO UPDATE SET
			bottles_in_stock = ink_bottle_inventory.bottles_in_stock + EXCLUDED.bottles_in_stock,
			bottle_cost = EXCLUDED.bottle_cost,
			cost_per_ml = EXCLUDED.cost_per_ml,
			status = 'IN_STOCK',
			updated_at = CURRENT_TIMESTAMP`

	_, err := tx.ExecContext(ctx, query,
		item.ID, item.InkCode, item.InkName, item.ColorGroup, item.ColorCode,
		item.BottleCapacityMl, item.BottleCost, item.CostPerMl, item.BottlesInStock,
		item.MinBottleAlert, item.IsCompatible, item.TargetPrinterID,
		item.SupplierName, item.SupplierPhone, item.PurchaseLink,
		item.ProductImageURL, item.ReceiptSlipURL, item.Status,
	)
	return err
}

// CreateInkBottle registers new ink bottle record or increments stock
func (r *InboundRepository) CreateInkBottle(ctx context.Context, item *domain.InkBottleInventory) error {
	if r.db == nil {
		return fmt.Errorf("database not connected")
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if err := r.CreateInkBottleWithTx(ctx, tx, item); err != nil {
		return err
	}
	return tx.Commit()
}


// DeductInkBottleWithTx decreases bottle count and adjusts status
func (r *InboundRepository) DeductInkBottleWithTx(ctx context.Context, tx *sql.Tx, id string, qty int) (*domain.InkBottleInventory, error) {
	query := `
		SELECT id, ink_code, ink_name, color_group, COALESCE(color_code, ''),
		       bottle_capacity_ml, bottle_cost, cost_per_ml, bottles_in_stock,
		       min_bottle_alert, is_compatible, COALESCE(target_printer_id, ''),
		       COALESCE(supplier_name, ''), COALESCE(supplier_phone, ''),
		       COALESCE(purchase_link, ''), COALESCE(product_image_url, ''),
		       COALESCE(receipt_slip_url, ''), COALESCE(status, 'IN_STOCK'),
		       created_at, updated_at
		FROM ink_bottle_inventory
		WHERE id = $1
		FOR UPDATE`

	var item domain.InkBottleInventory
	err := tx.QueryRowContext(ctx, query, id).Scan(
		&item.ID, &item.InkCode, &item.InkName, &item.ColorGroup, &item.ColorCode,
		&item.BottleCapacityMl, &item.BottleCost, &item.CostPerMl, &item.BottlesInStock,
		&item.MinBottleAlert, &item.IsCompatible, &item.TargetPrinterID,
		&item.SupplierName, &item.SupplierPhone,
		&item.PurchaseLink, &item.ProductImageURL,
		&item.ReceiptSlipURL, &item.Status,
		&item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("ink bottle not found: %w", err)
	}

	if item.BottlesInStock < qty {
		return nil, fmt.Errorf("insufficient ink bottles in stock (available: %d, requested: %d)", item.BottlesInStock, qty)
	}

	item.BottlesInStock -= qty
	if item.BottlesInStock <= 0 {
		item.BottlesInStock = 0
		item.Status = "OUT_OF_STOCK"
	} else if item.BottlesInStock <= item.MinBottleAlert {
		item.Status = "LOW_STOCK"
	} else {
		item.Status = "IN_STOCK"
	}

	updateQuery := `
		UPDATE ink_bottle_inventory SET
			bottles_in_stock = $2,
			status = $3,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $1`

	_, err = tx.ExecContext(ctx, updateQuery, item.ID, item.BottlesInStock, item.Status)
	if err != nil {
		return nil, err
	}

	return &item, nil
}
