package suppliers

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/shopspring/decimal"
)

// GeneratePONumber generates unique sequential PO number: PO-YYYY-NNNN
func GeneratePONumber(db *sql.DB) (string, error) {
	year := time.Now().Year()
	prefix := fmt.Sprintf("PO-%d-", year)

	if db == nil {
		return fmt.Sprintf("%s%04d", prefix, 1), nil
	}

	var count int
	query := `SELECT COUNT(*) FROM purchase_orders WHERE po_number LIKE $1`
	err := db.QueryRow(query, prefix+"%").Scan(&count)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("%s%04d", prefix, count+1), nil
}

// ReceiveGoods processes an atomic goods receipt against a PO
func ReceiveGoods(tx *sql.Tx, poID string, lines []GoodsReceiptLineInput, receivedBy, notes string) error {
	if tx == nil {
		return errors.New("transaction is required")
	}
	if len(lines) == 0 {
		return errors.New("no lines provided for goods receipt")
	}

	// 1. Check PO existence and status
	var currentStatus, supplierID, supplierName, currency string
	var paymentTermsDays int
	err := tx.QueryRow(`
		SELECT po.status, po.supplier_id::text, COALESCE(s.name, 'Supplier'), po.currency, COALESCE(s.payment_terms_days, 30)
		FROM purchase_orders po
		LEFT JOIN suppliers s ON po.supplier_id = s.id
		WHERE po.id = $1::uuid OR po.po_number = $1
		FOR UPDATE
	`, poID).Scan(&currentStatus, &supplierID, &supplierName, &currency, &paymentTermsDays)
	if err != nil {
		return fmt.Errorf("failed to lock purchase order: %w", err)
	}

	if currentStatus == "CANCELLED" || currentStatus == "RECEIVED" {
		return fmt.Errorf("cannot receive goods for PO with status '%s'", currentStatus)
	}

	// 2. Create Goods Receipt Header
	var receiptID string
	err = tx.QueryRow(`
		INSERT INTO goods_receipts (po_id, received_date, received_by, notes, created_at)
		VALUES ($1::uuid, CURRENT_DATE, $2, $3, NOW())
		RETURNING id::text
	`, poID, receivedBy, notes).Scan(&receiptID)
	if err != nil {
		return fmt.Errorf("failed to create goods receipt header: %w", err)
	}

	totalReceiptAmount := decimal.Zero

	// 3. Process each line
	for _, l := range lines {
		var lineID, description string
		var unitPrice, currentQty, currentReceived float64
		var materialID sql.NullString

		err = tx.QueryRow(`
			SELECT id::text, material_id::text, description, unit_price, quantity, received_qty
			FROM purchase_order_lines
			WHERE id = $1::uuid AND po_id = $2::uuid
			FOR UPDATE
		`, l.POLineID, poID).Scan(&lineID, &materialID, &description, &unitPrice, &currentQty, &currentReceived)
		if err != nil {
			return fmt.Errorf("PO line %s not found or invalid: %w", l.POLineID, err)
		}

		newReceivedQty := currentReceived + l.ReceivedQty
		dRecvQty := decimal.NewFromFloat(l.ReceivedQty)
		dUnitPrice := decimal.NewFromFloat(unitPrice)
		lineTotal := dRecvQty.Mul(dUnitPrice)
		totalReceiptAmount = totalReceiptAmount.Add(lineTotal)

		// Update received_qty in PO line
		_, err = tx.Exec(`
			UPDATE purchase_order_lines
			SET received_qty = $1
			WHERE id = $2::uuid
		`, newReceivedQty, lineID)
		if err != nil {
			return fmt.Errorf("failed to update PO line received qty: %w", err)
		}

		// Insert into goods_receipt_lines
		var grLineID string
		err = tx.QueryRow(`
			INSERT INTO goods_receipt_lines (receipt_id, po_line_id, received_qty)
			VALUES ($1::uuid, $2::uuid, $3)
			RETURNING id::text
		`, receiptID, lineID, l.ReceivedQty).Scan(&grLineID)
		if err != nil {
			return fmt.Errorf("failed to insert goods receipt line: %w", err)
		}
	}

	// 4. Calculate overall PO Status (PARTIAL_RECEIVED vs RECEIVED)
	var totalOrdered, totalReceived float64
	err = tx.QueryRow(`
		SELECT COALESCE(SUM(quantity), 0), COALESCE(SUM(received_qty), 0)
		FROM purchase_order_lines
		WHERE po_id = $1::uuid
	`, poID).Scan(&totalOrdered, &totalReceived)
	if err != nil {
		return fmt.Errorf("failed to calculate total PO progress: %w", err)
	}

	newPOStatus := "PARTIAL_RECEIVED"
	if totalReceived >= totalOrdered && totalOrdered > 0 {
		newPOStatus = "RECEIVED"
	}

	_, err = tx.Exec(`
		UPDATE purchase_orders
		SET status = $1::po_status, updated_at = NOW()
		WHERE id = $2::uuid
	`, newPOStatus, poID)
	if err != nil {
		return fmt.Errorf("failed to update PO status: %w", err)
	}

	// 5. Automatically create Accounts Payable (AP) record if received amount > 0
	if totalReceiptAmount.GreaterThan(decimal.Zero) {
		dueDate := time.Now().AddDate(0, 0, paymentTermsDays).Format("2006-01-02")
		apNotes := fmt.Sprintf("Goods receipt %s against PO", receiptID)
		_, err = tx.Exec(`
			INSERT INTO accounts_payable (supplier_name, supplier_id, po_id, amount, currency, status, due_date, notes, created_at)
			VALUES ($1, $2::uuid, $3::uuid, $4, $5, 'PENDING', $6, $7, NOW())
		`, supplierName, supplierID, poID, totalReceiptAmount.InexactFloat64(), currency, dueDate, apNotes)
		if err != nil {
			return fmt.Errorf("failed to create AP record for goods receipt: %w", err)
		}
	}

	return nil
}
