package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"somsing.local/backend/internal/domain"

	"github.com/shopspring/decimal"
)

type MaterialRepository struct {
	db *sql.DB
}

func NewMaterialRepository(database *sql.DB) *MaterialRepository {
	return &MaterialRepository{db: database}
}

// FindByIDOrSKU finds a material by exact ID or SKU
func (r *MaterialRepository) FindByIDOrSKU(ctx context.Context, idOrSku string) (*domain.Material, error) {
	if r.db == nil {
		return nil, sql.ErrNoRows
	}

	query := `
		SELECT id, sku, name, category, stock_qty, consumption_unit,
		       purchase_unit, purchase_multiplier, cost_per_purchase_unit,
		       cost_per_consumption_unit, reorder_threshold,
		       COALESCE(min_stock_alert, 10.0), COALESCE(stock_status, 'IN_STOCK'),
		       COALESCE(is_active, TRUE), COALESCE(specification_meta, '{}'::jsonb),
		       COALESCE(technical_specs, '{}'::jsonb), created_at, updated_at
		FROM materials
		WHERE id = $1 OR sku = $1
		LIMIT 1`

	var m domain.Material
	var specMetaJSON, techSpecsJSON []byte

	err := r.db.QueryRowContext(ctx, query, strings.TrimSpace(idOrSku)).Scan(
		&m.ID, &m.SKU, &m.Name, &m.Category, &m.StockQty, &m.ConsumptionUnit,
		&m.PurchaseUnit, &m.PurchaseMultiplier, &m.CostPerPurchaseUnit,
		&m.CostPerConsumptionUnit, &m.ReorderThreshold,
		&m.MinStockAlert, &m.StockStatus, &m.IsActive,
		&specMetaJSON, &techSpecsJSON, &m.CreatedAt, &m.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	_ = json.Unmarshal(specMetaJSON, &m.SpecificationMeta)
	_ = json.Unmarshal(techSpecsJSON, &m.TechnicalSpecs)
	return &m, nil
}

// FindByIDOrSKUWithTx finds a material within an ongoing transaction with row lock
func (r *MaterialRepository) FindByIDOrSKUWithTx(ctx context.Context, tx *sql.Tx, idOrSku string) (*domain.Material, error) {
	query := `
		SELECT id, sku, name, category, stock_qty, consumption_unit,
		       purchase_unit, purchase_multiplier, cost_per_purchase_unit,
		       cost_per_consumption_unit, reorder_threshold,
		       COALESCE(min_stock_alert, 10.0), COALESCE(stock_status, 'IN_STOCK'),
		       COALESCE(is_active, TRUE), COALESCE(specification_meta, '{}'::jsonb),
		       COALESCE(technical_specs, '{}'::jsonb), created_at, updated_at
		FROM materials
		WHERE id = $1 OR sku = $1
		FOR UPDATE`

	var m domain.Material
	var specMetaJSON, techSpecsJSON []byte

	err := tx.QueryRowContext(ctx, query, strings.TrimSpace(idOrSku)).Scan(
		&m.ID, &m.SKU, &m.Name, &m.Category, &m.StockQty, &m.ConsumptionUnit,
		&m.PurchaseUnit, &m.PurchaseMultiplier, &m.CostPerPurchaseUnit,
		&m.CostPerConsumptionUnit, &m.ReorderThreshold,
		&m.MinStockAlert, &m.StockStatus, &m.IsActive,
		&specMetaJSON, &techSpecsJSON, &m.CreatedAt, &m.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	_ = json.Unmarshal(specMetaJSON, &m.SpecificationMeta)
	_ = json.Unmarshal(techSpecsJSON, &m.TechnicalSpecs)
	return &m, nil
}

// FindAll returns all materials
func (r *MaterialRepository) FindAll(ctx context.Context) ([]domain.Material, error) {
	if r.db == nil {
		return []domain.Material{}, nil
	}

	query := `
		SELECT id, sku, name, category, stock_qty, consumption_unit,
		       purchase_unit, purchase_multiplier, cost_per_purchase_unit,
		       cost_per_consumption_unit, reorder_threshold,
		       COALESCE(min_stock_alert, 10.0), COALESCE(stock_status, 'IN_STOCK'),
		       COALESCE(is_active, TRUE), COALESCE(specification_meta, '{}'::jsonb),
		       COALESCE(technical_specs, '{}'::jsonb), created_at, updated_at
		FROM materials
		ORDER BY name ASC`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.Material
	for rows.Next() {
		var m domain.Material
		var specMetaJSON, techSpecsJSON []byte

		err := rows.Scan(
			&m.ID, &m.SKU, &m.Name, &m.Category, &m.StockQty, &m.ConsumptionUnit,
			&m.PurchaseUnit, &m.PurchaseMultiplier, &m.CostPerPurchaseUnit,
			&m.CostPerConsumptionUnit, &m.ReorderThreshold,
			&m.MinStockAlert, &m.StockStatus, &m.IsActive,
			&specMetaJSON, &techSpecsJSON, &m.CreatedAt, &m.UpdatedAt,
		)
		if err != nil {
			continue
		}
		_ = json.Unmarshal(specMetaJSON, &m.SpecificationMeta)
		_ = json.Unmarshal(techSpecsJSON, &m.TechnicalSpecs)
		list = append(list, m)
	}
	return list, nil
}

// CreateWithTx inserts a new material within an ongoing transaction
func (r *MaterialRepository) CreateWithTx(ctx context.Context, tx *sql.Tx, mat *domain.Material) error {
	specMetaJSON, _ := json.Marshal(mat.SpecificationMeta)
	techSpecsJSON, _ := json.Marshal(mat.TechnicalSpecs)

	query := `
		INSERT INTO materials (
			id, sku, name, category, stock_qty, consumption_unit,
			purchase_unit, purchase_multiplier, cost_per_purchase_unit,
			cost_per_consumption_unit, reorder_threshold, min_stock_alert,
			stock_status, is_active, specification_meta, technical_specs,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
			CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
		)`

	_, err := tx.ExecContext(ctx, query,
		mat.ID, mat.SKU, mat.Name, mat.Category, mat.StockQty, mat.ConsumptionUnit,
		mat.PurchaseUnit, mat.PurchaseMultiplier, mat.CostPerPurchaseUnit,
		mat.CostPerConsumptionUnit, mat.ReorderThreshold, mat.MinStockAlert,
		mat.StockStatus, mat.IsActive, specMetaJSON, techSpecsJSON,
	)
	return err
}

// UpdateWithTx updates stock quantity, unit costs, and status in an ongoing transaction
func (r *MaterialRepository) UpdateWithTx(ctx context.Context, tx *sql.Tx, mat *domain.Material) error {
	specMetaJSON, _ := json.Marshal(mat.SpecificationMeta)
	techSpecsJSON, _ := json.Marshal(mat.TechnicalSpecs)

	query := `
		UPDATE materials SET
			name = $2,
			category = $3,
			stock_qty = $4,
			consumption_unit = $5,
			purchase_unit = $6,
			purchase_multiplier = $7,
			cost_per_purchase_unit = $8,
			cost_per_consumption_unit = $9,
			reorder_threshold = $10,
			min_stock_alert = $11,
			stock_status = $12,
			is_active = $13,
			specification_meta = $14,
			technical_specs = $15,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $1 OR sku = $1`

	_, err := tx.ExecContext(ctx, query,
		mat.ID, mat.Name, mat.Category, mat.StockQty, mat.ConsumptionUnit,
		mat.PurchaseUnit, mat.PurchaseMultiplier, mat.CostPerPurchaseUnit,
		mat.CostPerConsumptionUnit, mat.ReorderThreshold, mat.MinStockAlert,
		mat.StockStatus, mat.IsActive, specMetaJSON, techSpecsJSON,
	)
	return err
}

// UpdateStockAndStatusWithTx directly updates stock quantity and status within transaction
func (r *MaterialRepository) UpdateStockAndStatusWithTx(ctx context.Context, tx *sql.Tx, id string, newStock decimal.Decimal, status domain.StockStatus) error {
	query := `
		UPDATE materials SET
			stock_qty = $2,
			stock_status = $3,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $1 OR sku = $1`

	_, err := tx.ExecContext(ctx, query, id, newStock, status)
	return err
}

// UpdateDirect applies admin modifications directly to a material record without creating duplicates
func (r *MaterialRepository) UpdateDirect(ctx context.Context, id string, req domain.UpdateMaterialRequest) (*domain.Material, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	mat, err := r.FindByIDOrSKU(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		mat.Name = *req.Name
	}
	if req.Category != nil {
		mat.Category = *req.Category
	}
	if req.ConsumptionUnit != nil {
		mat.ConsumptionUnit = *req.ConsumptionUnit
	}
	if req.PurchaseUnit != nil {
		mat.PurchaseUnit = *req.PurchaseUnit
	}
	if req.PurchaseMultiplier != nil && !req.PurchaseMultiplier.IsZero() {
		mat.PurchaseMultiplier = *req.PurchaseMultiplier
	}
	if req.CostPerPurchaseUnit != nil {
		mat.CostPerPurchaseUnit = *req.CostPerPurchaseUnit
		if !mat.PurchaseMultiplier.IsZero() {
			mat.CostPerConsumptionUnit = mat.CostPerPurchaseUnit.Div(mat.PurchaseMultiplier)
		}
	}
	if req.CostPerConsumptionUnit != nil {
		mat.CostPerConsumptionUnit = *req.CostPerConsumptionUnit
	}
	if req.ReorderThreshold != nil {
		mat.ReorderThreshold = *req.ReorderThreshold
	}
	if req.MinStockAlert != nil {
		mat.MinStockAlert = *req.MinStockAlert
	}
	if req.StockStatus != nil {
		mat.StockStatus = *req.StockStatus
	}
	if req.IsActive != nil {
		mat.IsActive = *req.IsActive
	}
	if req.TechnicalSpecs != nil {
		mat.TechnicalSpecs = *req.TechnicalSpecs
	}

	// Update stock status based on current stock vs min alert if not manually forced
	if req.StockStatus == nil {
		if mat.StockQty.LessThanOrEqual(decimal.Zero) {
			mat.StockStatus = domain.StockStatusOutOfStock
		} else if mat.StockQty.LessThanOrEqual(mat.MinStockAlert) {
			mat.StockStatus = domain.StockStatusLowStock
		} else {
			mat.StockStatus = domain.StockStatusInStock
		}
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	if err := r.UpdateWithTx(ctx, tx, mat); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return mat, nil
}
