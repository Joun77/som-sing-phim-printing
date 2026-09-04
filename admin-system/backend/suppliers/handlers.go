package suppliers

import (
	"database/sql"
	"net/http"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

// HandleGetSuppliers lists all suppliers with optional search and active filter
func HandleGetSuppliers(c *gin.Context) {
	search := c.Query("search")
	activeOnly := c.DefaultQuery("active", "true")

	var list []Supplier

	if db.DB != nil {
		query := `
			SELECT id::text, code, name, COALESCE(contact_name, ''), COALESCE(phone, ''),
			       COALESCE(email, ''), COALESCE(address, ''), COALESCE(tax_id, ''),
			       COALESCE(payment_terms_days, 30), currency, is_active, COALESCE(notes, ''),
			       branch_id::text, created_at, updated_at
			FROM suppliers
			WHERE 1=1
		`
		var args []interface{}
		argIdx := 1

		if activeOnly == "true" {
			query += " AND is_active = true"
		}
		if search != "" {
			query += ` AND (name ILIKE $` + string(rune('0'+argIdx)) + ` OR code ILIKE $` + string(rune('0'+argIdx)) + `)`
			args = append(args, "%"+search+"%")
			argIdx++
		}
		query += " ORDER BY name ASC"

		rows, err := db.DB.Query(query, args...)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var s Supplier
				var branchID sql.NullString
				if err := rows.Scan(
					&s.ID, &s.Code, &s.Name, &s.ContactName, &s.Phone,
					&s.Email, &s.Address, &s.TaxID, &s.PaymentTermsDays,
					&s.Currency, &s.IsActive, &s.Notes, &branchID,
					&s.CreatedAt, &s.UpdatedAt,
				); err == nil {
					if branchID.Valid {
						s.BranchID = &branchID.String
					}
					list = append(list, s)
				}
			}
		}
	}

	if list == nil {
		list = []Supplier{
			{ID: "sup-001", Code: "SUP-PAPER-01", Name: "Lao Paper Import Co., Ltd.", ContactName: "Mr. Somchai", Phone: "+856 20 5555 1111", PaymentTermsDays: 30, Currency: "LAK", IsActive: true},
			{ID: "sup-002", Code: "SUP-INK-01", Name: "Bangkok Offset Ink Supplier", ContactName: "Ms. Pornthip", Phone: "+66 81 234 5678", PaymentTermsDays: 45, Currency: "THB", IsActive: true},
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
}

// HandleCreateSupplier creates a new vendor record
func HandleCreateSupplier(c *gin.Context) {
	var req CreateSupplierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if req.Currency == "" {
		req.Currency = "LAK"
	}
	if req.PaymentTermsDays <= 0 {
		req.PaymentTermsDays = 30
	}

	var supplierID string
	if db.DB != nil {
		err := db.DB.QueryRow(`
			INSERT INTO suppliers (code, name, contact_name, phone, email, address, tax_id, payment_terms_days, currency, notes, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
			RETURNING id::text
		`, req.Code, req.Name, req.ContactName, req.Phone, req.Email, req.Address, req.TaxID, req.PaymentTermsDays, req.Currency, req.Notes).Scan(&supplierID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to create supplier: " + err.Error()})
			return
		}
	} else {
		supplierID = "sup-mock-id"
	}

	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": gin.H{"id": supplierID, "code": req.Code}})
}

// HandleUpdateSupplier updates an existing supplier
func HandleUpdateSupplier(c *gin.Context) {
	id := c.Param("id")
	var req CreateSupplierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if db.DB != nil {
		_, err := db.DB.Exec(`
			UPDATE suppliers
			SET code = $1, name = $2, contact_name = $3, phone = $4, email = $5,
			    address = $6, tax_id = $7, payment_terms_days = $8, currency = $9, notes = $10, updated_at = NOW()
			WHERE id::text = $11 OR code = $11
		`, req.Code, req.Name, req.ContactName, req.Phone, req.Email, req.Address, req.TaxID, req.PaymentTermsDays, req.Currency, req.Notes, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to update supplier: " + err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Supplier updated successfully"})
}

// HandleDeleteSupplier performs soft delete
func HandleDeleteSupplier(c *gin.Context) {
	id := c.Param("id")
	if db.DB != nil {
		_, err := db.DB.Exec(`UPDATE suppliers SET is_active = false, updated_at = NOW() WHERE id::text = $1 OR code = $1`, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Supplier deactivated successfully"})
}

// HandleGetPOs lists purchase orders with line items
func HandleGetPOs(c *gin.Context) {
	status := c.Query("status")
	supplierID := c.Query("supplier_id")

	var list []PurchaseOrder

	if db.DB != nil {
		query := `
			SELECT 
				po.id::text, po.po_number, po.supplier_id::text, COALESCE(s.name, 'Supplier'),
				po.status::text, po.order_date::text, po.expected_delivery::text,
				po.total_amount, po.currency, COALESCE(po.notes, ''), COALESCE(po.created_by, ''),
				po.created_at::text, po.updated_at::text
			FROM purchase_orders po
			LEFT JOIN suppliers s ON po.supplier_id = s.id
			WHERE 1=1
		`
		var args []interface{}
		argIdx := 1

		if status != "" {
			query += ` AND po.status = $` + string(rune('0'+argIdx))
			args = append(args, status)
			argIdx++
		}
		if supplierID != "" {
			query += ` AND po.supplier_id::text = $` + string(rune('0'+argIdx))
			args = append(args, supplierID)
			argIdx++
		}
		query += " ORDER BY po.created_at DESC"

		rows, err := db.DB.Query(query, args...)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var po PurchaseOrder
				var expDel sql.NullString
				if err := rows.Scan(
					&po.ID, &po.PONumber, &po.SupplierID, &po.SupplierName,
					&po.Status, &po.OrderDate, &expDel,
					&po.TotalAmount, &po.Currency, &po.Notes, &po.CreatedBy,
					&po.CreatedAt, &po.UpdatedAt,
				); err == nil {
					if expDel.Valid {
						po.ExpectedDelivery = &expDel.String
					}
					list = append(list, po)
				}
			}
		}
	}

	if list == nil {
		list = []PurchaseOrder{}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
}

// HandleCreatePO creates a new Purchase Order with lines in DRAFT status
func HandleCreatePO(c *gin.Context) {
	var req CreatePORequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if db.DB == nil {
		c.JSON(http.StatusOK, gin.H{"status": "success", "data": gin.H{"po_number": "PO-2026-MOCK"}})
		return
	}

	tx, err := db.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}
	defer tx.Rollback()

	poNumber, err := GeneratePONumber(db.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to generate PO number"})
		return
	}

	totalAmt := decimal.Zero
	for _, l := range req.Lines {
		lineTotal := decimal.NewFromFloat(l.Quantity).Mul(decimal.NewFromFloat(l.UnitPrice))
		totalAmt = totalAmt.Add(lineTotal)
	}

	currency := req.Currency
	if currency == "" {
		currency = "LAK"
	}

	var poID string
	err = tx.QueryRow(`
		INSERT INTO purchase_orders (po_number, supplier_id, status, order_date, expected_delivery, total_amount, currency, notes, created_by, created_at, updated_at)
		VALUES ($1, $2::uuid, 'DRAFT', CURRENT_DATE, NULLIF($3, '')::date, $4, $5, $6, $7, NOW(), NOW())
		RETURNING id::text
	`, poNumber, req.SupplierID, req.ExpectedDelivery, totalAmt.InexactFloat64(), currency, req.Notes, req.CreatedBy).Scan(&poID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to insert PO header: " + err.Error()})
		return
	}

	for _, l := range req.Lines {
		_, err = tx.Exec(`
			INSERT INTO purchase_order_lines (po_id, material_id, description, quantity, unit, unit_price, received_qty, created_at)
			VALUES ($1::uuid, $2, $3, $4, $5, $6, 0, NOW())
		`, poID, l.MaterialID, l.Description, l.Quantity, l.Unit, l.UnitPrice)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to insert PO line: " + err.Error()})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to commit PO: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": gin.H{"id": poID, "po_number": poNumber}})
}

// HandleUpdatePO updates a DRAFT Purchase Order
func HandleUpdatePO(c *gin.Context) {
	id := c.Param("id")
	var req CreatePORequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if db.DB != nil {
		tx, err := db.DB.Begin()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
			return
		}
		defer tx.Rollback()

		totalAmt := decimal.Zero
		for _, l := range req.Lines {
			lineTotal := decimal.NewFromFloat(l.Quantity).Mul(decimal.NewFromFloat(l.UnitPrice))
			totalAmt = totalAmt.Add(lineTotal)
		}

		currency := req.Currency
		if currency == "" {
			currency = "LAK"
		}

		_, err = tx.Exec(`
			UPDATE purchase_orders
			SET supplier_id = $1::uuid, expected_delivery = NULLIF($2, '')::date,
			    total_amount = $3, currency = $4, notes = $5, updated_at = NOW()
			WHERE (id::text = $6 OR po_number = $6) AND status = 'DRAFT'
		`, req.SupplierID, req.ExpectedDelivery, totalAmt.InexactFloat64(), currency, req.Notes, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to update PO: " + err.Error()})
			return
		}

		// Recreate lines
		_, _ = tx.Exec(`DELETE FROM purchase_order_lines WHERE po_id::text = $1 OR po_id = (SELECT id FROM purchase_orders WHERE po_number = $1)`, id)
		for _, l := range req.Lines {
			_, _ = tx.Exec(`
				INSERT INTO purchase_order_lines (po_id, material_id, description, quantity, unit, unit_price, received_qty, created_at)
				VALUES ((SELECT id FROM purchase_orders WHERE id::text = $1 OR po_number = $1), $2, $3, $4, $5, $6, 0, NOW())
			`, id, l.MaterialID, l.Description, l.Quantity, l.Unit, l.UnitPrice)
		}

		if err := tx.Commit(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to commit PO update"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "PO updated successfully"})
}

// HandleSendPO advances status from DRAFT to SENT
func HandleSendPO(c *gin.Context) {
	id := c.Param("id")
	if db.DB != nil {
		_, err := db.DB.Exec(`
			UPDATE purchase_orders
			SET status = 'SENT', updated_at = NOW()
			WHERE (id::text = $1 OR po_number = $1) AND status = 'DRAFT'
		`, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "PO marked as SENT to supplier"})
}

// HandleReceiveGoods records partial or full goods receipt against PO and auto-creates Inbound & AP
func HandleReceiveGoods(c *gin.Context) {
	poID := c.Param("id")
	var req GoodsReceiptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if db.DB == nil {
		c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Goods received in simulation mode"})
		return
	}

	tx, err := db.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}
	defer tx.Rollback()

	if err := ReceiveGoods(tx, poID, req.Lines, req.ReceivedBy, req.Notes); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to commit goods receipt: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Goods received successfully. Inbound & AP updated."})
}
