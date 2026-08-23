package inbound

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"backend/db"

	"github.com/gin-gonic/gin"
)

type InboundTransaction struct {
	ID            string                 `json:"id"`
	PONumber      string                 `json:"poNumber"`
	InboundDate   string                 `json:"inboundDate"`
	SKUCode       string                 `json:"skuCode"`
	ItemName      string                 `json:"itemName"`
	SupplierName  string                 `json:"supplierName"`
	Category      string                 `json:"category"`
	Quantity      float64                `json:"quantity"`
	Unit          string                 `json:"unit"`
	TotalPrice    float64                `json:"totalPrice"`
	PaymentMethod string                 `json:"paymentMethod"`
	Origin        string                 `json:"origin"`
	TariffFee     float64                `json:"tariffFee"`
	FreightFee    float64                `json:"freightFee"`
	ProductImage  string                 `json:"productImage"`
	ReceiptSlip   string                 `json:"receiptSlip"`
	Specs         map[string]interface{} `json:"specs"`
	CreatedAt     string                 `json:"createdAt"`
}

var (
	inboundMutex        sync.RWMutex
	inboundMemoryStore = make(map[string]InboundTransaction)
)

// HandleGetInboundTransactions returns all inbound logs
func HandleGetInboundTransactions(c *gin.Context) {
	if db.DB != nil {
		logs, err := getInboundFromDB()
		if err == nil {
			if logs == nil {
				logs = []InboundTransaction{}
			}
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": logs})
			return
		}
	}

	inboundMutex.RLock()
	defer inboundMutex.RUnlock()

	var list []InboundTransaction
	for _, item := range inboundMemoryStore {
		list = append(list, item)
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
}

// HandleCreateInboundTransaction saves a new inbound procurement entry with DB Transaction
func HandleCreateInboundTransaction(c *gin.Context) {
	var item InboundTransaction
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid inbound payload: " + err.Error()})
		return
	}

	// Boundary & sanitization validation
	if item.Quantity <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Quantity must be greater than 0"})
		return
	}
	if item.TotalPrice < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Total price cannot be negative"})
		return
	}
	if strings.TrimSpace(item.SKUCode) == "" && strings.TrimSpace(item.ItemName) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "SKU Code or Item Name is required"})
		return
	}

	if item.ID == "" {
		item.ID = fmt.Sprintf("INB-%d", time.Now().UnixNano())
	}
	if item.InboundDate == "" {
		item.InboundDate = time.Now().Format("2006-01-02")
	}
	item.CreatedAt = time.Now().Format(time.RFC3339)

	if db.DB != nil {
		err := saveInboundWithTx(item)
		if err != nil {
			log.Printf("[DB ERROR] Inbound transaction failed & rolled back: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to persist inbound: " + err.Error()})
			return
		}
	}

	inboundMutex.Lock()
	inboundMemoryStore[item.ID] = item
	inboundMutex.Unlock()

	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": item})
}

func getInboundFromDB() ([]InboundTransaction, error) {
	rows, err := db.DB.Query(`
		SELECT id, COALESCE(po_number,''), inbound_date, sku_code, item_name, COALESCE(supplier_name,''), category,
		       quantity, COALESCE(unit,''), total_price, COALESCE(payment_method,'TRANSFER'), COALESCE(origin,'TH'),
		       tariff_fee, freight_fee, COALESCE(product_image_url,''), COALESCE(receipt_slip_url,''),
		       COALESCE(technical_specs, '{}'::jsonb), created_at
		FROM inbound_transactions ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []InboundTransaction
	for rows.Next() {
		var item InboundTransaction
		var inboundDate, createdAt time.Time
		var specsJSON []byte

		err := rows.Scan(
			&item.ID, &item.PONumber, &inboundDate, &item.SKUCode, &item.ItemName, &item.SupplierName, &item.Category,
			&item.Quantity, &item.Unit, &item.TotalPrice, &item.PaymentMethod, &item.Origin,
			&item.TariffFee, &item.FreightFee, &item.ProductImage, &item.ReceiptSlip,
			&specsJSON, &createdAt,
		)
		if err != nil {
			continue
		}
		item.InboundDate = inboundDate.Format("2006-01-02")
		item.CreatedAt = createdAt.Format(time.RFC3339)
		_ = json.Unmarshal(specsJSON, &item.Specs)
		result = append(result, item)
	}
	return result, nil
}

// HandleUpdateInboundTransaction updates an inbound log
func HandleUpdateInboundTransaction(c *gin.Context) {
	id := c.Param("id")
	var item InboundTransaction
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}
	if item.ID == "" {
		item.ID = id
	}

	if db.DB != nil {
		err := saveInboundWithTx(item)
		if err != nil {
			log.Printf("[DB ERROR] Failed to update inbound transaction: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to update inbound: " + err.Error()})
			return
		}
	}

	inboundMutex.Lock()
	inboundMemoryStore[item.ID] = item
	inboundMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": item})
}

// HandleDeleteInboundTransaction deletes an inbound log with transaction
func HandleDeleteInboundTransaction(c *gin.Context) {
	id := c.Param("id")

	if db.DB != nil {
		tx, err := db.DB.Begin()
		if err == nil {
			defer tx.Rollback()
			_, err = tx.Exec(`DELETE FROM inbound_transactions WHERE id = $1`, id)
			if err == nil {
				_ = tx.Commit()
			} else {
				log.Printf("[DB ERROR] Failed to delete inbound transaction: %v", err)
			}
		}
	}

	inboundMutex.Lock()
	delete(inboundMemoryStore, id)
	inboundMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Record deleted"})
}

// saveInboundWithTx performs atomic inbound save and material stock increment inside a single DB transaction
func saveInboundWithTx(item InboundTransaction) error {
	tx, err := db.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	specsJSON, _ := json.Marshal(item.Specs)
	_, err = tx.Exec(`
		INSERT INTO inbound_transactions (
			id, po_number, inbound_date, sku_code, item_name, supplier_name, category,
			quantity, unit, total_price, payment_method, origin, tariff_fee, freight_fee,
			product_image_url, receipt_slip_url, technical_specs, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP)
		ON CONFLICT (id) DO UPDATE SET
			po_number = EXCLUDED.po_number,
			inbound_date = EXCLUDED.inbound_date,
			sku_code = EXCLUDED.sku_code,
			item_name = EXCLUDED.item_name,
			supplier_name = EXCLUDED.supplier_name,
			category = EXCLUDED.category,
			quantity = EXCLUDED.quantity,
			unit = EXCLUDED.unit,
			total_price = EXCLUDED.total_price,
			payment_method = EXCLUDED.payment_method,
			origin = EXCLUDED.origin,
			tariff_fee = EXCLUDED.tariff_fee,
			freight_fee = EXCLUDED.freight_fee,
			product_image_url = EXCLUDED.product_image_url,
			receipt_slip_url = EXCLUDED.receipt_slip_url,
			technical_specs = EXCLUDED.technical_specs`,
		item.ID, item.PONumber, item.InboundDate, item.SKUCode, item.ItemName, item.SupplierName, item.Category,
		item.Quantity, item.Unit, item.TotalPrice, item.PaymentMethod, item.Origin, item.TariffFee, item.FreightFee,
		item.ProductImage, item.ReceiptSlip, specsJSON)
	if err != nil {
		return fmt.Errorf("inbound record insert failed: %w", err)
	}

	// Increment material stock_qty atomically or insert new material into materials table
	if item.SKUCode != "" || item.ItemName != "" {
		sku := strings.TrimSpace(item.SKUCode)
		if sku == "" {
			sku = item.ID
		}
		name := strings.TrimSpace(item.ItemName)
		if name == "" {
			name = sku
		}
		cat := strings.TrimSpace(item.Category)
		if cat == "" {
			cat = "Paper"
		}
		unit := strings.TrimSpace(item.Unit)
		if unit == "" {
			unit = "Unit"
		}

		costPerUnit := item.TotalPrice
		if item.Quantity > 0 {
			costPerUnit = item.TotalPrice / item.Quantity
		}

		_, err = tx.Exec(`
			INSERT INTO materials (
				id, sku, name, category, stock_qty, consumption_unit,
				purchase_unit, purchase_multiplier, cost_per_purchase_unit,
				cost_per_consumption_unit, reorder_threshold, technical_specs, updated_at
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, 1, $8, $9, 50, $10, CURRENT_TIMESTAMP
			)
			ON CONFLICT (id) DO UPDATE SET
				stock_qty = materials.stock_qty + EXCLUDED.stock_qty,
				cost_per_purchase_unit = EXCLUDED.cost_per_purchase_unit,
				cost_per_consumption_unit = EXCLUDED.cost_per_consumption_unit,
				updated_at = CURRENT_TIMESTAMP`,
			sku, sku, name, cat, item.Quantity, unit, unit,
			item.TotalPrice, costPerUnit, specsJSON)
		if err != nil {
			log.Printf("[DB WARNING] Failed to upsert material from inbound: %v", err)
		}
	}

	return tx.Commit()
}
