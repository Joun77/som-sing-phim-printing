package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"backend/internal/domain"

	"github.com/shopspring/decimal"
)

type OrderRepository struct {
	db *sql.DB
}

func NewOrderRepository(database *sql.DB) *OrderRepository {
	return &OrderRepository{db: database}
}

// BeginTx starts a new database transaction
func (r *OrderRepository) BeginTx(ctx context.Context) (*sql.Tx, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database connection is nil")
	}
	return r.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
}

// CreateOrderWithTx inserts a master order record within a transaction
func (r *OrderRepository) CreateOrderWithTx(ctx context.Context, tx *sql.Tx, o *domain.Order) error {
	query := `
		INSERT INTO orders (
			id, order_number, customer_id, customer_name, customer_phone, customer_email,
			customer_address, status, total_amount, deposit_amount, remaining_amount,
			currency, exchange_rate, google_drive_link, proof_url, proof_approved_at,
			proof_rejected_at, proof_rejection_reason, stock_deducted_at, delivery_date,
			notes, created_by, idempotency_key, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
			$17, $18, $19, $20, $21, $22, $23, $24, $25
		)`

	now := time.Now()
	if o.CreatedAt.IsZero() {
		o.CreatedAt = now
	}
	if o.UpdatedAt.IsZero() {
		o.UpdatedAt = now
	}

	_, err := tx.ExecContext(ctx, query,
		o.ID, o.OrderNumber, o.CustomerID, o.CustomerName, o.CustomerPhone, o.CustomerEmail,
		o.CustomerAddress, string(o.Status), o.TotalAmount, o.DepositAmount, o.RemainingAmount,
		o.Currency, o.ExchangeRate, o.GoogleDriveLink, o.ProofURL, o.ProofApprovedAt,
		o.ProofRejectedAt, o.ProofRejectionReason, o.StockDeductedAt, o.DeliveryDate,
		o.Notes, o.CreatedBy, o.IdempotencyKey, o.CreatedAt, o.UpdatedAt,
	)
	return err
}

// CreateOrderItemWithTx inserts an order line item within a transaction
func (r *OrderRepository) CreateOrderItemWithTx(ctx context.Context, tx *sql.Tx, item *domain.OrderItem) error {
	query := `
		INSERT INTO order_items (
			id, order_id, product_id, job_name, item_name, quantity, page_count,
			paper_size, paper_sku, binding_type, spine_width_mm, unit_price,
			unit_cost, total_price, total_cost, is_manual_override, override_reason,
			override_by, specs, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
		)`

	now := time.Now()
	if item.CreatedAt.IsZero() {
		item.CreatedAt = now
	}
	if item.UpdatedAt.IsZero() {
		item.UpdatedAt = now
	}

	specsJSON, err := json.Marshal(item.Specs)
	if err != nil {
		specsJSON = []byte("{}")
	}

	_, err = tx.ExecContext(ctx, query,
		item.ID, item.OrderID, item.ProductID, item.JobName, item.ItemName, item.Quantity, item.PageCount,
		item.PaperSize, item.PaperSKU, string(item.BindingType), item.SpineWidthMM, item.UnitPrice,
		item.UnitCost, item.TotalPrice, item.TotalCost, item.IsManualOverride, item.OverrideReason,
		item.OverrideBy, specsJSON, item.CreatedAt, item.UpdatedAt,
	)
	return err
}

// FindByID retrieves an order by its primary ID along with items, histories, and spoilage logs
func (r *OrderRepository) FindByID(ctx context.Context, id string) (*domain.Order, error) {
	if r.db == nil {
		return nil, sql.ErrNoRows
	}

	query := `
		SELECT id, order_number, COALESCE(customer_id, ''), customer_name,
		       COALESCE(customer_phone, ''), COALESCE(customer_email, ''), COALESCE(customer_address, ''),
		       status, total_amount, deposit_amount, remaining_amount,
		       currency, exchange_rate, COALESCE(google_drive_link, ''), COALESCE(proof_url, ''),
		       proof_approved_at, proof_rejected_at, COALESCE(proof_rejection_reason, ''),
		       stock_deducted_at, COALESCE(delivery_date, ''), COALESCE(notes, ''),
		       COALESCE(created_by, ''), COALESCE(idempotency_key, ''), created_at, updated_at
		FROM orders
		WHERE id = $1
		LIMIT 1`

	var o domain.Order
	var statusStr string
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&o.ID, &o.OrderNumber, &o.CustomerID, &o.CustomerName,
		&o.CustomerPhone, &o.CustomerEmail, &o.CustomerAddress,
		&statusStr, &o.TotalAmount, &o.DepositAmount, &o.RemainingAmount,
		&o.Currency, &o.ExchangeRate, &o.GoogleDriveLink, &o.ProofURL,
		&o.ProofApprovedAt, &o.ProofRejectedAt, &o.ProofRejectionReason,
		&o.StockDeductedAt, &o.DeliveryDate, &o.Notes,
		&o.CreatedBy, &o.IdempotencyKey, &o.CreatedAt, &o.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	o.Status = domain.OrderStatus(statusStr)

	// Fetch Order Items
	items, err := r.GetItemsByOrderID(ctx, o.ID)
	if err == nil {
		o.Items = items
	}

	// Fetch Status History
	histories, err := r.GetStatusHistories(ctx, o.ID)
	if err == nil {
		o.StatusHistories = histories
	}

	// Fetch Spoilage Logs
	spoilage, err := r.GetSpoilageLogs(ctx, o.ID)
	if err == nil {
		o.SpoilageLogs = spoilage
	}

	return &o, nil
}

// FindByOrderNumber retrieves an order by its business order number
func (r *OrderRepository) FindByOrderNumber(ctx context.Context, orderNumber string) (*domain.Order, error) {
	if r.db == nil {
		return nil, sql.ErrNoRows
	}

	var id string
	err := r.db.QueryRowContext(ctx, "SELECT id FROM orders WHERE order_number = $1 LIMIT 1", strings.TrimSpace(orderNumber)).Scan(&id)
	if err != nil {
		return nil, err
	}
	return r.FindByID(ctx, id)
}

// FindByIdempotencyKey retrieves an order by its idempotency key
func (r *OrderRepository) FindByIdempotencyKey(ctx context.Context, key string) (*domain.Order, error) {
	if r.db == nil {
		return nil, sql.ErrNoRows
	}

	var id string
	err := r.db.QueryRowContext(ctx, "SELECT id FROM orders WHERE idempotency_key = $1 LIMIT 1", strings.TrimSpace(key)).Scan(&id)
	if err != nil {
		return nil, err
	}
	return r.FindByID(ctx, id)
}

// GetItemsByOrderID fetches line items belonging to an order
func (r *OrderRepository) GetItemsByOrderID(ctx context.Context, orderID string) ([]domain.OrderItem, error) {
	query := `
		SELECT id, order_id, COALESCE(product_id, ''), job_name, item_name,
		       quantity, page_count, paper_size, COALESCE(paper_sku, ''), binding_type,
		       spine_width_mm, unit_price, unit_cost, total_price, total_cost,
		       is_manual_override, COALESCE(override_reason, ''), COALESCE(override_by, ''),
		       specs, created_at, updated_at
		FROM order_items
		WHERE order_id = $1
		ORDER BY created_at ASC`

	rows, err := r.db.QueryContext(ctx, query, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []domain.OrderItem
	for rows.Next() {
		var it domain.OrderItem
		var bType string
		var specsBytes []byte

		if err := rows.Scan(
			&it.ID, &it.OrderID, &it.ProductID, &it.JobName, &it.ItemName,
			&it.Quantity, &it.PageCount, &it.PaperSize, &it.PaperSKU, &bType,
			&it.SpineWidthMM, &it.UnitPrice, &it.UnitCost, &it.TotalPrice, &it.TotalCost,
			&it.IsManualOverride, &it.OverrideReason, &it.OverrideBy,
			&specsBytes, &it.CreatedAt, &it.UpdatedAt,
		); err != nil {
			return nil, err
		}
		it.BindingType = domain.BindingType(bType)
		_ = json.Unmarshal(specsBytes, &it.Specs)
		items = append(items, it)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

// ListOrders retrieves paginated orders with optional status/search filters
func (r *OrderRepository) ListOrders(ctx context.Context, filter domain.OrderFilter) ([]domain.Order, int, error) {
	if r.db == nil {
		return []domain.Order{}, 0, nil
	}

	var conditions []string
	var args []interface{}
	argIdx := 1

	if filter.Status != "" {
		conditions = append(conditions, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, string(filter.Status))
		argIdx++
	}

	if filter.OrderNumber != "" {
		conditions = append(conditions, fmt.Sprintf("order_number ILIKE $%d", argIdx))
		args = append(args, "%"+strings.TrimSpace(filter.OrderNumber)+"%")
		argIdx++
	}

	if filter.CustomerName != "" {
		conditions = append(conditions, fmt.Sprintf("customer_name ILIKE $%d", argIdx))
		args = append(args, "%"+strings.TrimSpace(filter.CustomerName)+"%")
		argIdx++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM orders %s", whereClause)
	var totalCount int
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&totalCount); err != nil {
		return nil, 0, err
	}

	limit := filter.Limit
	if limit <= 0 {
		limit = 20
	}
	offset := filter.Offset
	if offset < 0 {
		offset = 0
	}

	query := fmt.Sprintf(`
		SELECT id, order_number, COALESCE(customer_id, ''), customer_name,
		       COALESCE(customer_phone, ''), COALESCE(customer_email, ''), COALESCE(customer_address, ''),
		       status, total_amount, deposit_amount, remaining_amount,
		       currency, exchange_rate, COALESCE(google_drive_link, ''), COALESCE(proof_url, ''),
		       proof_approved_at, proof_rejected_at, COALESCE(proof_rejection_reason, ''),
		       stock_deducted_at, COALESCE(delivery_date, ''), COALESCE(notes, ''),
		       COALESCE(created_by, ''), created_at, updated_at
		FROM orders
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d`, whereClause, argIdx, argIdx+1)

	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var orders []domain.Order
	for rows.Next() {
		var o domain.Order
		var statusStr string
		if err := rows.Scan(
			&o.ID, &o.OrderNumber, &o.CustomerID, &o.CustomerName,
			&o.CustomerPhone, &o.CustomerEmail, &o.CustomerAddress,
			&statusStr, &o.TotalAmount, &o.DepositAmount, &o.RemainingAmount,
			&o.Currency, &o.ExchangeRate, &o.GoogleDriveLink, &o.ProofURL,
			&o.ProofApprovedAt, &o.ProofRejectedAt, &o.ProofRejectionReason,
			&o.StockDeductedAt, &o.DeliveryDate, &o.Notes,
			&o.CreatedBy, &o.CreatedAt, &o.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		o.Status = domain.OrderStatus(statusStr)
		orders = append(orders, o)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return orders, totalCount, nil
}

// UpdateOrderStatusWithTx updates status and timestamps of an order within a transaction
func (r *OrderRepository) UpdateOrderStatusWithTx(ctx context.Context, tx *sql.Tx, orderID string, newStatus domain.OrderStatus) error {
	query := `
		UPDATE orders
		SET status = $1, updated_at = NOW()
		WHERE id = $2`
	_, err := tx.ExecContext(ctx, query, string(newStatus), orderID)
	return err
}

// MarkStockDeductedWithTx sets the stock_deducted_at timestamp
func (r *OrderRepository) MarkStockDeductedWithTx(ctx context.Context, tx *sql.Tx, orderID string, deductedAt time.Time) error {
	query := `
		UPDATE orders
		SET stock_deducted_at = $1, updated_at = NOW()
		WHERE id = $2`
	_, err := tx.ExecContext(ctx, query, deductedAt, orderID)
	return err
}

// RecordStatusHistoryWithTx logs a state transition into order_status_histories table
func (r *OrderRepository) RecordStatusHistoryWithTx(ctx context.Context, tx *sql.Tx, history *domain.OrderStatusHistory) error {
	query := `
		INSERT INTO order_status_histories (
			id, order_id, previous_status, new_status, reason, performed_by, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)`

	now := time.Now()
	if history.CreatedAt.IsZero() {
		history.CreatedAt = now
	}

	_, err := tx.ExecContext(ctx, query,
		history.ID, history.OrderID, string(history.PreviousStatus),
		string(history.NewStatus), history.Reason, history.PerformedBy, history.CreatedAt,
	)
	return err
}

// GetStatusHistories fetches history logs for an order
func (r *OrderRepository) GetStatusHistories(ctx context.Context, orderID string) ([]domain.OrderStatusHistory, error) {
	query := `
		SELECT id, order_id, previous_status, new_status, COALESCE(reason, ''),
		       COALESCE(performed_by, ''), created_at
		FROM order_status_histories
		WHERE order_id = $1
		ORDER BY created_at ASC`

	rows, err := r.db.QueryContext(ctx, query, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var histories []domain.OrderStatusHistory
	for rows.Next() {
		var h domain.OrderStatusHistory
		var prevStr, newStr string
		if err := rows.Scan(
			&h.ID, &h.OrderID, &prevStr, &newStr, &h.Reason, &h.PerformedBy, &h.CreatedAt,
		); err != nil {
			return nil, err
		}
		h.PreviousStatus = domain.OrderStatus(prevStr)
		h.NewStatus = domain.OrderStatus(newStr)
		histories = append(histories, h)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return histories, nil
}

// RecordSpoilageWithTx saves a spoilage log entry within a transaction
func (r *OrderRepository) RecordSpoilageWithTx(ctx context.Context, tx *sql.Tx, s *domain.SpoilageLog) error {
	query := `
		INSERT INTO spoilage_logs (
			id, order_id, order_item_id, material_sku, material_name, category,
			quantity_spoiled, unit, reason, cost_impact, recorded_by, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`

	now := time.Now()
	if s.CreatedAt.IsZero() {
		s.CreatedAt = now
	}

	var itemIDVal *string
	if s.OrderItemID != "" {
		itemIDVal = &s.OrderItemID
	}

	_, err := tx.ExecContext(ctx, query,
		s.ID, s.OrderID, itemIDVal, s.MaterialSKU, s.MaterialName, s.Category,
		s.QuantitySpoiled, s.Unit, s.Reason, s.CostImpact, s.RecordedBy, s.CreatedAt,
	)
	return err
}

// GetSpoilageLogs fetches spoilage logs for an order
func (r *OrderRepository) GetSpoilageLogs(ctx context.Context, orderID string) ([]domain.SpoilageLog, error) {
	query := `
		SELECT id, order_id, COALESCE(order_item_id, ''), material_sku, material_name,
		       category, quantity_spoiled, unit, reason, cost_impact,
		       COALESCE(recorded_by, ''), created_at
		FROM spoilage_logs
		WHERE order_id = $1
		ORDER BY created_at ASC`

	rows, err := r.db.QueryContext(ctx, query, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []domain.SpoilageLog
	for rows.Next() {
		var s domain.SpoilageLog
		if err := rows.Scan(
			&s.ID, &s.OrderID, &s.OrderItemID, &s.MaterialSKU, &s.MaterialName,
			&s.Category, &s.QuantitySpoiled, &s.Unit, &s.Reason, &s.CostImpact,
			&s.RecordedBy, &s.CreatedAt,
		); err != nil {
			return nil, err
		}
		logs = append(logs, s)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return logs, nil
}


// UpdateItemPricingWithTx updates pricing override for a specific order item
func (r *OrderRepository) UpdateItemPricingWithTx(ctx context.Context, tx *sql.Tx, itemID string, unitPrice, totalPrice decimal.Decimal, reason, approvedBy string) error {
	query := `
		UPDATE order_items
		SET unit_price = $1, total_price = $2, is_manual_override = TRUE,
		    override_reason = $3, override_by = $4, updated_at = NOW()
		WHERE id = $5`

	_, err := tx.ExecContext(ctx, query, unitPrice, totalPrice, reason, approvedBy, itemID)
	return err
}

// UpdateOrderTotalsWithTx recalculates and persists the order summary amounts
func (r *OrderRepository) UpdateOrderTotalsWithTx(ctx context.Context, tx *sql.Tx, orderID string, totalAmount, remainingAmount decimal.Decimal) error {
	query := `
		UPDATE orders
		SET total_amount = $1, remaining_amount = $2, updated_at = NOW()
		WHERE id = $3`

	_, err := tx.ExecContext(ctx, query, totalAmount, remainingAmount, orderID)
	return err
}
