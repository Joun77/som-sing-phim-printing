package inventory

import (
	"database/sql"
	"fmt"
	"log"
	"time"
)

// JobDeductionSpec represents production requirements for paper, ink, and finishing
type JobDeductionSpec struct {
	OrderID            string
	OrderItemID        string
	PaperSKU           string
	Quantity           int
	PageCount          int
	CoverPaperID       string
	InnerPaperID       string
	ColorMode          string
	MachineID          string
	AvgCovC            float64
	AvgCovM            float64
	AvgCovY            float64
	AvgCovK            float64
	InkCoveragePct     float64
	AllowNegativeStock bool
	CreatedBy          string
}

// DeductInventoryForJob deducts paper sheets (via FIFO batches & materials), ink volume, and logs stock_movements inside a db.Transaction
func DeductInventoryForJob(tx *sql.Tx, spec JobDeductionSpec) error {
	if tx == nil {
		return nil
	}

	createdBy := spec.CreatedBy
	if createdBy == "" {
		createdBy = "SYSTEM"
	}

	// 1. Deduct Paper Stock (using Row-Level Lock & FIFO Batches)
	paperSku := spec.PaperSKU
	if paperSku == "" {
		paperSku = spec.CoverPaperID
	}
	if paperSku == "" {
		paperSku = spec.InnerPaperID
	}

	if paperSku != "" {
		sheetsNeeded := spec.Quantity
		if spec.PageCount > 0 {
			// e.g. 2 pages per sheet (Duplex)
			sheetsNeeded = (spec.PageCount + 1) / 2 * spec.Quantity
		}
		if sheetsNeeded <= 0 {
			sheetsNeeded = 1
		}

		// Lock material row
		var materialID string
		var currentStock float64
		var unitCost float64
		err := tx.QueryRow(`
			SELECT id, stock_qty, cost_per_unit 
			FROM materials 
			WHERE (sku = $1 OR id::text = $1)
			FOR UPDATE
		`, paperSku).Scan(&materialID, &currentStock, &unitCost)

		if err == nil {
			if !spec.AllowNegativeStock && currentStock < float64(sheetsNeeded) {
				return fmt.Errorf("INSUFFICIENT_STOCK: insufficient stock for paper '%s': required %d, available %.2f", paperSku, sheetsNeeded, currentStock)
			}

			// Atomic update on master material
			_, err = tx.Exec(`
				UPDATE materials 
				SET stock_qty = stock_qty - $1, updated_at = NOW() 
				WHERE id = $2
			`, sheetsNeeded, materialID)
			if err != nil {
				return fmt.Errorf("failed to deduct master material: %w", err)
			}

			// Record in stock_movements ledger
			movementID := fmt.Sprintf("mov-%s-%d", spec.OrderID, time.Now().UnixNano())
			_, _ = tx.Exec(`
				INSERT INTO stock_movements (id, material_id, order_id, order_item_id, movement_type, quantity, unit_cost, notes, created_at, created_by)
				VALUES ($1, $2, $3, $4, 'PRODUCTION_DEDUCTION', $5, $6, $7, NOW(), $8)
			`, movementID, materialID, spec.OrderID, spec.OrderItemID, sheetsNeeded, unitCost, fmt.Sprintf("Production print deduction for order %s", spec.OrderID), createdBy)
		}

		// FIFO Batches discharge
		var remainingToDeduct = sheetsNeeded
		rows, err := tx.Query(`
			SELECT id, current_qty 
			FROM inventory_batches 
			WHERE (material_id = $1 OR sku = $2) AND current_qty > 0 
			ORDER BY purchase_date ASC, created_at ASC
			FOR UPDATE
		`, materialID, paperSku)

		if err == nil {
			type batchRecord struct {
				id  string
				qty int
			}
			var batches []batchRecord
			for rows.Next() {
				var b batchRecord
				if err := rows.Scan(&b.id, &b.qty); err == nil {
					batches = append(batches, b)
				}
			}
			if err := rows.Err(); err != nil {
				rows.Close()
				return fmt.Errorf("failed to iterate deduction batches: %w", err)
			}
			rows.Close()

			for _, b := range batches {
				if remainingToDeduct <= 0 {
					break
				}
				deductFromThisBatch := b.qty
				if deductFromThisBatch > remainingToDeduct {
					deductFromThisBatch = remainingToDeduct
				}

				_, _ = tx.Exec(`
					UPDATE inventory_batches 
					SET current_qty = current_qty - $1, updated_at = NOW() 
					WHERE id = $2
				`, deductFromThisBatch, b.id)

				remainingToDeduct -= deductFromThisBatch
			}
		}

		log.Printf("[INVENTORY DEDUCTION] Deducted %d sheets for Paper SKU %s (Order %s, Item %s)", sheetsNeeded, paperSku, spec.OrderID, spec.OrderItemID)

		// Low Stock Alert Check
		var matName string
		var remainingQty float64
		var reorderThreshold float64
		_ = tx.QueryRow(`SELECT name, stock_qty, reorder_threshold FROM materials WHERE sku = $1 OR id::text = $1 LIMIT 1`, paperSku).Scan(&matName, &remainingQty, &reorderThreshold)
		if reorderThreshold > 0 && remainingQty <= reorderThreshold {
			log.Printf("[INVENTORY ALERT] Paper '%s' (SKU: %s) is below reorder threshold! Current: %.2f, Threshold: %.2f", matName, paperSku, remainingQty, reorderThreshold)
		}
	}

	// 2. Calculate and Deduct Ink Volume (ml) based on Coverage % (Coverage % × Pages × Quantity × Baseline ml)
	totalImpressions := float64(spec.Quantity)
	if spec.PageCount > 0 {
		totalImpressions *= float64(spec.PageCount)
	}

	const mlPerA4At100Pct = 0.005 // Baseline ~0.005 ml per A4 impression at 100% coverage

	colors := []struct {
		code   string
		covPct float64
	}{
		{"C", spec.AvgCovC},
		{"M", spec.AvgCovM},
		{"Y", spec.AvgCovY},
		{"K", spec.AvgCovK},
	}

	isGrayscale := spec.ColorMode == "grayscale" || spec.ColorMode == "bw" || spec.ColorMode == "monochrome" || spec.ColorMode == "black_white" || (spec.AvgCovC == 0 && spec.AvgCovM == 0 && spec.AvgCovY == 0 && spec.AvgCovK > 0)

	for _, c := range colors {
		// In Black & White / Grayscale mode, ONLY deduct K (Black) ink!
		if isGrayscale && c.code != "K" {
			continue
		}

		cov := c.covPct
		if cov <= 0 && spec.InkCoveragePct > 0 {
			if isGrayscale {
				cov = spec.InkCoveragePct
			} else {
				cov = spec.InkCoveragePct / 4.0
			}
		}
		if cov <= 0 {
			if isGrayscale && c.code == "K" {
				cov = 5.0 // Default 5% text coverage for B&W
			} else {
				cov = 15.0 // Default 15% coverage for color
			}
		}

		inkMlNeeded := (cov / 100.0) * totalImpressions * mlPerA4At100Pct
		if inkMlNeeded > 0 {
			_, _ = tx.Exec(`
				UPDATE compatible_inks
				SET imported_volume_ml = GREATEST(0, imported_volume_ml - $1), updated_at = NOW()
				WHERE color_code = $2 OR name ILIKE '%' || $2 || '%'
			`, inkMlNeeded, c.code)

			_, _ = tx.Exec(`
				UPDATE genuine_inks
				SET baseline_volume_ml = GREATEST(0, baseline_volume_ml - $1), updated_at = NOW()
				WHERE color_code = $2 OR name ILIKE '%' || $2 || '%'
			`, inkMlNeeded, c.code)

			_, _ = tx.Exec(`
				UPDATE materials
				SET stock_qty = GREATEST(0, stock_qty - $1)
				WHERE (category = 'INK' OR category = 'Ink') AND (sku ILIKE '%' || $2 || '%' OR name ILIKE '%' || $2 || '%')
			`, inkMlNeeded, c.code)

			log.Printf("[INK DEDUCTION] Deducted %.4f ml for Color %s (Order %s, Item %s, Mode: %s)", inkMlNeeded, c.code, spec.OrderID, spec.OrderItemID, spec.ColorMode)
		}
	}

	return nil
}

// ReverseInventoryForOrder restores deducted stock movements when an in-production order is cancelled/reverted
func ReverseInventoryForOrder(tx *sql.Tx, orderID string, reversedBy string) error {
	if tx == nil {
		return nil
	}
	if reversedBy == "" {
		reversedBy = "SYSTEM"
	}

	rows, err := tx.Query(`
		SELECT material_id, quantity, unit_cost
		FROM stock_movements
		WHERE order_id = $1 AND movement_type = 'PRODUCTION_DEDUCTION'
	`, orderID)
	if err != nil {
		return err
	}
	defer rows.Close()

	type movementRecord struct {
		materialID string
		qty        float64
		unitCost   float64
	}
	var list []movementRecord
	for rows.Next() {
		var m movementRecord
		if err := rows.Scan(&m.materialID, &m.qty, &m.unitCost); err == nil {
			list = append(list, m)
		}
	}

	for _, m := range list {
		// Increment materials stock
		_, err := tx.Exec(`
			UPDATE materials
			SET stock_qty = stock_qty + $1, updated_at = NOW()
			WHERE id = $2
		`, m.qty, m.materialID)
		if err != nil {
			log.Printf("[STOCK REVERSAL WARN] Failed to restore material %s: %v", m.materialID, err)
			continue
		}

		// Log reversal in stock_movements
		reversalID := fmt.Sprintf("rev-%s-%d", orderID, time.Now().UnixNano())
		_, _ = tx.Exec(`
			INSERT INTO stock_movements (id, material_id, order_id, movement_type, quantity, unit_cost, notes, created_at, created_by)
			VALUES ($1, $2, $3, 'REVERSAL', $4, $5, $6, NOW(), $7)
		`, reversalID, m.materialID, orderID, m.qty, m.unitCost, fmt.Sprintf("Order %s cancelled/reversed", orderID), reversedBy)
	}

	// Reset stock_deducted_at flag on order
	_, err = tx.Exec(`UPDATE orders SET stock_deducted_at = NULL WHERE id = $1 OR order_no = $1 OR order_number = $1`, orderID)
	return err
}
