package inbound

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
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
	var raw json.RawMessage
	if err := c.ShouldBindJSON(&raw); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid payload: " + err.Error()})
		return
	}

	var batch []InboundTransaction
	if err := json.Unmarshal(raw, &batch); err == nil && len(batch) > 0 {
		processBatchInbound(c, batch)
		return
	}

	var item InboundTransaction
	if err := json.Unmarshal(raw, &item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid inbound payload format: " + err.Error()})
		return
	}

	processBatchInbound(c, []InboundTransaction{item})
}

// HandleCreateBatchInboundTransaction handles explicit batch inbound array
func HandleCreateBatchInboundTransaction(c *gin.Context) {
	var items []InboundTransaction
	if err := c.ShouldBindJSON(&items); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid batch inbound payload: " + err.Error()})
		return
	}
	if len(items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Batch cannot be empty"})
		return
	}
	processBatchInbound(c, items)
}

func processBatchInbound(c *gin.Context, items []InboundTransaction) {
	for i := range items {
		if items[i].Quantity <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": fmt.Sprintf("Item %d: Quantity must be greater than 0", i+1)})
			return
		}
		if items[i].TotalPrice < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": fmt.Sprintf("Item %d: Total price cannot be negative", i+1)})
			return
		}
		if strings.TrimSpace(items[i].SKUCode) == "" && strings.TrimSpace(items[i].ItemName) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": fmt.Sprintf("Item %d: SKU Code or Item Name is required", i+1)})
			return
		}
		if items[i].ID == "" {
			items[i].ID = fmt.Sprintf("INB-%d-%d", time.Now().UnixNano(), i)
		}
		if items[i].InboundDate == "" {
			items[i].InboundDate = time.Now().Format("2006-01-02")
		}
		items[i].CreatedAt = time.Now().Format(time.RFC3339)
	}

	if db.DB != nil {
		err := saveBatchInboundWithTx(items)
		if err != nil {
			log.Printf("[DB ERROR] Batch inbound transaction failed & rolled back: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to persist batch inbound: " + err.Error()})
			return
		}
	}

	inboundMutex.Lock()
	for _, it := range items {
		inboundMemoryStore[it.ID] = it
	}
	inboundMutex.Unlock()

	c.JSON(http.StatusCreated, gin.H{"status": "success", "count": len(items), "data": items})
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
		item.InboundDate = inboundDate.Format("2006-01-02 15:04")
		if inboundDate.Hour() == 0 && inboundDate.Minute() == 0 && !createdAt.IsZero() {
			item.InboundDate = createdAt.Format("2006-01-02 15:04")
		}
		item.CreatedAt = createdAt.Format("2006-01-02 15:04:05")
		_ = json.Unmarshal(specsJSON, &item.Specs)
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
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

// HandleDeleteInboundTransaction deletes an inbound log and atomically rolls back material stock
func HandleDeleteInboundTransaction(c *gin.Context) {
	id := c.Param("id")

	if db.DB != nil {
		tx, err := db.DB.Begin()
		if err == nil {
			defer tx.Rollback()

			// Query inbound record first to know sku, quantity, multiplier
			var skuCode, category string
			var quantity float64
			var specsJSON []byte
			errQuery := tx.QueryRow(`
				SELECT COALESCE(sku_code, ''), COALESCE(category, ''), quantity, COALESCE(technical_specs, '{}'::jsonb)
				FROM inbound_transactions WHERE id = $1
			`, id).Scan(&skuCode, &category, &quantity, &specsJSON)

			if errQuery == nil && quantity > 0 {
				multiplier := 1.0
				catLower := strings.ToLower(category)
				isPaper := strings.Contains(catLower, "paper") || strings.Contains(catLower, "material") || strings.Contains(catLower, "ເຈ້ຍ")
				isInk := strings.Contains(catLower, "ink") || strings.Contains(catLower, "ໝຶກ")

				var specs map[string]interface{}
				_ = json.Unmarshal(specsJSON, &specs)

				if isPaper {
					multiplier = 500.0
					if specs != nil {
						if v, ok := specs["sheets_per_pack"].(float64); ok && v > 0 {
							multiplier = v
						} else if v, ok := specs["sheets_per_ream"].(float64); ok && v > 0 {
							multiplier = v
						} else if v, ok := specs["sheetsPerPack"].(float64); ok && v > 0 {
							multiplier = v
						}
					}
				} else if isInk {
					multiplier = 100.0
					if specs != nil {
						if v, ok := specs["volume"].(float64); ok && v > 0 {
							multiplier = v
						} else if v, ok := specs["volumePerBottle"].(float64); ok && v > 0 {
							multiplier = v
						}
					}
				}

				sheetsToDeduct := quantity * multiplier

				// Deduct stock from materials table (clamped at 0)
				_, _ = tx.Exec(`
					UPDATE materials 
					SET stock_qty = GREATEST(0, stock_qty - $1), updated_at = CURRENT_TIMESTAMP
					WHERE id = $2 OR sku = $2 OR LOWER(sku) = LOWER($2)
				`, sheetsToDeduct, skuCode)
			}

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

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Record deleted and stock rolled back"})
}

// saveBatchInboundWithTx performs atomic inbound batch save and material stock increments inside a single DB transaction
func saveBatchInboundWithTx(items []InboundTransaction) error {
	tx, err := db.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for _, item := range items {
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
			return fmt.Errorf("inbound record insert failed for ID %s: %w", item.ID, err)
		}

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
			catLower := strings.ToLower(cat)
			isPaper := strings.Contains(catLower, "paper") || strings.Contains(catLower, "material") || strings.Contains(catLower, "ເຈ້ຍ")
			isInk := strings.Contains(catLower, "ink") || strings.Contains(catLower, "ໝຶກ")
			isPrinter := strings.Contains(catLower, "printer") || strings.Contains(catLower, "machine") || strings.Contains(catLower, "press") || strings.Contains(catLower, "equipment") || strings.HasPrefix(strings.ToLower(sku), "prn") || strings.HasPrefix(strings.ToLower(item.ID), "prn")

			if isPrinter {
				serial := "SN-" + item.ID
				brand := "Generic"
				model := name
				pCat := "Digital Press"
				cScheme := "CMYK"
				var expLife float64 = 3000000
				var maintRate float64 = 15
				var priceCost float64 = item.TotalPrice
				if item.Specs != nil {
					if v, ok := item.Specs["serialNumber"].(string); ok && v != "" {
						serial = v
					}
					if v, ok := item.Specs["brand"].(string); ok && v != "" {
						brand = v
					}
					if v, ok := item.Specs["model"].(string); ok && v != "" {
						model = v
					}
					if v, ok := item.Specs["printerCategory"].(string); ok && v != "" {
						pCat = v
					}
					if v, ok := item.Specs["colorSchemeType"].(string); ok && v != "" {
						cScheme = v
					}
					if v, ok := item.Specs["expectedLifeA4Pages"].(float64); ok && v > 0 {
						expLife = v
					}
					if v, ok := item.Specs["maintenanceRatePercent"].(float64); ok && v > 0 {
						maintRate = v
					}
				}

				_, _ = tx.Exec(`
					INSERT INTO printers (
						asset_id, serial_number, brand, model, category,
						color_scheme_type, total_color_slots, expected_life_a4_pages,
						maintenance_rate_percent, purchase_date, price_cost, vendor_supplier,
						warranty_expiry_year, status, location_dept, technical_specs,
						product_image_url, receipt_invoice_url, updated_at
					) VALUES (
						$1, $2, $3, $4, $5,
						$6, 4, $7,
						$8, CURRENT_DATE, $9, $10,
						EXTRACT(YEAR FROM CURRENT_DATE)::int + 2, 'In Use', 'Main Press Floor', $11,
						$12, $13, NOW()
					)
					ON CONFLICT (asset_id) DO UPDATE SET
						serial_number = EXCLUDED.serial_number,
						brand = EXCLUDED.brand,
						model = EXCLUDED.model,
						category = EXCLUDED.category,
						color_scheme_type = EXCLUDED.color_scheme_type,
						price_cost = EXCLUDED.price_cost,
						technical_specs = EXCLUDED.technical_specs,
						updated_at = NOW()
				`, item.ID, serial, brand, model, pCat, cScheme, expLife, maintRate, priceCost, item.SupplierName, string(specsJSON), item.ProductImage, item.ReceiptSlip)
			}

			unit := strings.TrimSpace(item.Unit)
			if unit == "" {
				if isPaper {
					unit = "แพ็ก"
				} else if isInk {
					unit = "ขวด"
				} else {
					unit = "Unit"
				}
			}

			consumptionUnit := "Unit"
			multiplier := 1.0
			if isPaper {
				consumptionUnit = "ແຜ່ນ"
				multiplier = 500.0
				if item.Specs != nil {
					if v := parseNumeric(item.Specs["sheets_per_pack"]); v > 0 {
						multiplier = v
					} else if v := parseNumeric(item.Specs["sheets_per_ream"]); v > 0 {
						multiplier = v
					} else if v := parseNumeric(item.Specs["sheetsPerPack"]); v > 0 {
						multiplier = v
					} else if v := parseNumeric(item.Specs["purchaseMultiplier"]); v > 0 {
						multiplier = v
					}
				}
			} else if isInk {
				consumptionUnit = "ml"
				multiplier = 100.0
				if item.Specs != nil {
					if v := parseNumeric(item.Specs["volume"]); v > 0 {
						multiplier = v
					} else if v := parseNumeric(item.Specs["volumePerBottle"]); v > 0 {
						multiplier = v
					} else if v := parseNumeric(item.Specs["volume_ml"]); v > 0 {
						multiplier = v
					}
				}
			}

			stockQtyToAdd := item.Quantity * multiplier
			costPerPurchase := item.TotalPrice
			if item.Quantity > 0 {
				costPerPurchase = item.TotalPrice / item.Quantity
			}
			costPerConsumption := costPerPurchase
			if stockQtyToAdd > 0 {
				costPerConsumption = item.TotalPrice / stockQtyToAdd
			}


			// Check if material already exists by SKU, ID, or (Name & Category)
			var existingID string
			var existingStock float64
			errCheck := tx.QueryRow(`
				SELECT id, stock_qty 
				FROM materials 
				WHERE id = $1 OR sku = $1 OR LOWER(sku) = LOWER($1) OR (LOWER(name) = LOWER($2) AND LOWER(category) = LOWER($3))
				LIMIT 1
			`, sku, name, cat).Scan(&existingID, &existingStock)

			if errCheck == nil && existingID != "" {
				// Material already exists: atomically increment stock_qty
				_, err = tx.Exec(`
					UPDATE materials 
					SET stock_qty = stock_qty + $1,
					    purchase_multiplier = $2,
					    cost_per_purchase_unit = $3,
					    cost_per_consumption_unit = $4,
					    updated_at = CURRENT_TIMESTAMP
					WHERE id = $5
				`, stockQtyToAdd, multiplier, costPerPurchase, costPerConsumption, existingID)
				if err != nil {
					log.Printf("[DB WARNING] Failed to update existing material stock from inbound: %v", err)
				}
			} else {
				// Create new master material
				_, err = tx.Exec(`
					INSERT INTO materials (
						id, sku, name, category, stock_qty, consumption_unit,
						purchase_unit, purchase_multiplier, cost_per_purchase_unit,
						cost_per_consumption_unit, reorder_threshold, technical_specs, updated_at
					) VALUES (
						$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 50, $11, CURRENT_TIMESTAMP
					)
					ON CONFLICT (id) DO UPDATE SET
						stock_qty = materials.stock_qty + EXCLUDED.stock_qty,
						purchase_multiplier = EXCLUDED.purchase_multiplier,
						cost_per_purchase_unit = EXCLUDED.cost_per_purchase_unit,
						cost_per_consumption_unit = EXCLUDED.cost_per_consumption_unit,
						updated_at = CURRENT_TIMESTAMP`,
					sku, sku, name, cat, stockQtyToAdd, consumptionUnit, unit,
					multiplier, costPerPurchase, costPerConsumption, specsJSON)
				if err != nil {
					log.Printf("[DB WARNING] Failed to insert new material from inbound: %v", err)
				}
			}
		}
	}

	return tx.Commit()
}

// saveInboundWithTx performs atomic inbound save and material stock increment inside a single DB transaction
func saveInboundWithTx(item InboundTransaction) error {
	return saveBatchInboundWithTx([]InboundTransaction{item})
}

func parseNumeric(val interface{}) float64 {
	if val == nil {
		return 0
	}
	switch v := val.(type) {
	case float64:
		return v
	case float32:
		return float64(v)
	case int:
		return float64(v)
	case int64:
		return float64(v)
	case string:
		v = strings.TrimSpace(v)
		f, _ := strconv.ParseFloat(v, 64)
		return f
	default:
		return 0
	}
}

