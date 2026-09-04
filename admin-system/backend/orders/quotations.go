package orders

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
)

type QuotationRecord struct {
	ID                   string                 `json:"id"`
	QuotationNo          string                 `json:"quotation_no"`
	Title                string                 `json:"title"`
	CustomerID           string                 `json:"customer_id,omitempty"`
	CustomerName         string                 `json:"customer_name"`
	CustomerPhone        string                 `json:"customer_phone"`
	CustomerAddress      string                 `json:"customer_address"`
	Status               string                 `json:"status"`
	TotalCost            float64                `json:"total_cost"`
	TotalSellingPrice    float64                `json:"total_selling_price"`
	OverallProfitPercent float64                `json:"overall_profit_percent"`
	DiscountPercent      float64                `json:"discount_percent"`
	SetupFee             float64                `json:"setup_fee"`
	PackagingCost        float64                `json:"packaging_cost"`
	ShippingFee          float64                `json:"shipping_fee"`
	ExpiryDate           string                 `json:"expiry_date"`
	Notes                string                 `json:"notes"`
	ArtworkURL           string                 `json:"artwork_url,omitempty"`
	DigitalProofURL      string                 `json:"digital_proof_url,omitempty"`
	Items                []map[string]any       `json:"items"`
	CreatedAt            time.Time              `json:"created_at"`
	UpdatedAt            time.Time              `json:"updated_at"`
}

var (
	quotationsStore = make(map[string]QuotationRecord)
	quoteMutex      sync.RWMutex
)

// HandleGetQuotations lists all saved quotations from PostgreSQL DB
func HandleGetQuotations(c *gin.Context) {
	if db.DB == nil {
		c.JSON(http.StatusOK, []QuotationRecord{})
		return
	}

	query := `
		SELECT COALESCE(id, quotation_id::text), COALESCE(quotation_no, 'QT-001'), COALESCE(title, 'ໃບສະເໜີລາຄາ'),
		       customer_name, COALESCE(customer_phone, ''), COALESCE(customer_address, ''),
		       COALESCE(status, 'Draft'), total_cost, total_selling_price, overall_profit_percent,
		       COALESCE(discount_percent, 0), COALESCE(setup_fee, 0), COALESCE(packaging_cost, 0),
		       COALESCE(shipping_fee, 0), COALESCE(expiry_date, ''), COALESCE(notes, ''),
		       COALESCE(artwork_url, ''), COALESCE(digital_proof_url, ''),
		       COALESCE(items_json, '[]'::jsonb), created_at, updated_at
		FROM quotations
		ORDER BY created_at DESC
	`

	rows, err := db.DB.Query(query)
	if err != nil {
		log.Printf("[DB ERROR] Failed to fetch quotations: %v", err)
		c.JSON(http.StatusOK, []QuotationRecord{})
		return
	}
	defer rows.Close()

	var list []QuotationRecord
	for rows.Next() {
		var q QuotationRecord
		var itemsBytes []byte
		err := rows.Scan(
			&q.ID, &q.QuotationNo, &q.Title, &q.CustomerName, &q.CustomerPhone, &q.CustomerAddress,
			&q.Status, &q.TotalCost, &q.TotalSellingPrice, &q.OverallProfitPercent,
			&q.DiscountPercent, &q.SetupFee, &q.PackagingCost,
			&q.ShippingFee, &q.ExpiryDate, &q.Notes,
			&q.ArtworkURL, &q.DigitalProofURL,
			&itemsBytes, &q.CreatedAt, &q.UpdatedAt,
		)
		if err != nil {
			continue
		}
		if len(itemsBytes) > 0 {
			json.Unmarshal(itemsBytes, &q.Items)
		}
		list = append(list, q)
	}
	if err = rows.Err(); err != nil {
		log.Printf("[DB ERROR] Error iterating quotation rows: %v", err)
	}

	if list == nil {
		list = []QuotationRecord{}
	}
	c.JSON(http.StatusOK, list)
}

// HandleSaveQuotation creates or updates a quotation in PostgreSQL DB
func HandleSaveQuotation(c *gin.Context) {
	var q QuotationRecord
	if err := c.ShouldBindJSON(&q); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quotation payload", "details": err.Error()})
		return
	}

	if q.ID == "" {
		q.ID = c.Param("id")
	}
	if q.ID == "" {
		q.ID = fmt.Sprintf("qt-%d", time.Now().Unix())
	}
	if q.QuotationNo == "" {
		q.QuotationNo = fmt.Sprintf("QT-%s", time.Now().Format("0601021504"))
	}
	if q.CustomerName == "" {
		q.CustomerName = "General Customer"
	}
	if q.Status == "" {
		q.Status = "Draft"
	}

	itemsBytes, _ := json.Marshal(q.Items)

	if db.DB != nil {
		err := db.RunInTransaction(func(tx *sql.Tx) error {
			// Auto-link or upsert CRM customer for quotation
			if q.CustomerPhone != "" || q.CustomerName != "" {
				_ = autoLinkOrCreateCustomer(tx, Order{
					CustomerID:      q.CustomerID,
					CustomerName:    q.CustomerName,
					CustomerPhone:   q.CustomerPhone,
					CustomerAddress: q.CustomerAddress,
					TotalAmountLAK:  0, // Quotation does not increase spent until converted to order
				})
			}

			query := `
				INSERT INTO quotations (id, quotation_no, title, customer_name, customer_phone, customer_address,
				                        status, total_cost, total_selling_price, overall_profit_percent,
				                        discount_percent, setup_fee, packaging_cost, shipping_fee, expiry_date, notes,
				                        artwork_url, digital_proof_url, items_json, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19::jsonb, NOW(), NOW())
				ON CONFLICT (id) DO UPDATE SET
					title = EXCLUDED.title,
					customer_name = EXCLUDED.customer_name,
					customer_phone = EXCLUDED.customer_phone,
					customer_address = EXCLUDED.customer_address,
					status = EXCLUDED.status,
					total_cost = EXCLUDED.total_cost,
					total_selling_price = EXCLUDED.total_selling_price,
					overall_profit_percent = EXCLUDED.overall_profit_percent,
					discount_percent = EXCLUDED.discount_percent,
					setup_fee = EXCLUDED.setup_fee,
					packaging_cost = EXCLUDED.packaging_cost,
					shipping_fee = EXCLUDED.shipping_fee,
					expiry_date = EXCLUDED.expiry_date,
					notes = EXCLUDED.notes,
					artwork_url = EXCLUDED.artwork_url,
					digital_proof_url = EXCLUDED.digital_proof_url,
					items_json = EXCLUDED.items_json,
					updated_at = NOW()
			`
			_, err := tx.Exec(query,
				q.ID, q.QuotationNo, q.Title, q.CustomerName, q.CustomerPhone, q.CustomerAddress,
				q.Status, q.TotalCost, q.TotalSellingPrice, q.OverallProfitPercent,
				q.DiscountPercent, q.SetupFee, q.PackagingCost, q.ShippingFee, q.ExpiryDate, q.Notes,
				q.ArtworkURL, q.DigitalProofURL,
				string(itemsBytes),
			)
			return err
		})

		if err != nil {
			log.Printf("[DB ERROR] Failed to save quotation: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to persist quotation to database", "details": err.Error()})
			return
		}
		log.Printf("[DB SUCCESS] Quotation %s saved to PostgreSQL!", q.ID)
	}

	quoteMutex.Lock()
	quotationsStore[q.ID] = q
	quotationsStore[q.QuotationNo] = q
	quoteMutex.Unlock()

	c.JSON(http.StatusOK, q)
}

// HandleDeleteQuotation removes a quotation from PostgreSQL DB
func HandleDeleteQuotation(c *gin.Context) {
	id := c.Param("id")
	if db.DB != nil && id != "" {
		_, err := db.DB.Exec("DELETE FROM quotations WHERE id = $1 OR quotation_no = $1", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete quotation", "details": err.Error()})
			return
		}
	}
	quoteMutex.Lock()
	delete(quotationsStore, id)
	quoteMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "deleted_id": id})
}

// HandleConvertQuotationToOrder converts a quotation into a live production order
func HandleConvertQuotationToOrder(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Quotation ID is required"})
		return
	}

	var q QuotationRecord
	found := false

	if db.DB != nil {
		query := `
			SELECT COALESCE(id, quotation_id::text), COALESCE(quotation_no, 'QT-001'), COALESCE(title, 'ໃບສະເໜີລາຄາ'),
			       customer_name, COALESCE(customer_phone, ''), COALESCE(customer_address, ''),
			       COALESCE(status, 'Draft'), total_cost, total_selling_price, overall_profit_percent,
			       COALESCE(discount_percent, 0), COALESCE(setup_fee, 0), COALESCE(packaging_cost, 0),
			       COALESCE(shipping_fee, 0), COALESCE(expiry_date, ''), COALESCE(notes, ''),
			       COALESCE(artwork_url, ''), COALESCE(digital_proof_url, ''),
			       COALESCE(items_json, '[]'::jsonb), created_at, updated_at
			FROM quotations
			WHERE id = $1 OR quotation_no = $1
			LIMIT 1
		`
		var itemsBytes []byte
		err := db.DB.QueryRow(query, id).Scan(
			&q.ID, &q.QuotationNo, &q.Title, &q.CustomerName, &q.CustomerPhone, &q.CustomerAddress,
			&q.Status, &q.TotalCost, &q.TotalSellingPrice, &q.OverallProfitPercent,
			&q.DiscountPercent, &q.SetupFee, &q.PackagingCost,
			&q.ShippingFee, &q.ExpiryDate, &q.Notes,
			&q.ArtworkURL, &q.DigitalProofURL,
			&itemsBytes, &q.CreatedAt, &q.UpdatedAt,
		)
		if err == nil {
			found = true
			if len(itemsBytes) > 0 {
				_ = json.Unmarshal(itemsBytes, &q.Items)
			}
		}
	}

	if !found {
		quoteMutex.RLock()
		cached, ok := quotationsStore[id]
		quoteMutex.RUnlock()
		if ok {
			q = cached
			found = true
		}
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "Quotation not found"})
		return
	}

	storeMutex.Lock()
	orderSeq++
	newOrderID := fmt.Sprintf("order-%03d", orderSeq)
	storeMutex.Unlock()

	orderNo := fmt.Sprintf("ORD-%s-%03d", time.Now().Format("200601"), orderSeq)

	var itemsList []OrderItem
	for idx, itemMap := range q.Items {
		itemName, _ := itemMap["name"].(string)
		if itemName == "" {
			itemName = fmt.Sprintf("Item #%d", idx+1)
		}

		// Prevent ghost jobs (Parent Sheets and raw machinery tickets)
		if strings.Contains(itemName, "(Parent Sheets)") || strings.Contains(itemName, "ແຜ່ນແມ່") {
			continue
		}

		var qty int
		if qVal, ok := itemMap["quantity"].(float64); ok {
			qty = int(qVal)
		}
		if qty <= 0 {
			qty = 1
		}
		var unitPrice float64
		if upVal, ok := itemMap["unitPrice"].(float64); ok {
			unitPrice = upVal
		}
		var subtotal float64
		if stVal, ok := itemMap["subtotal"].(float64); ok {
			subtotal = stVal
		}

		var itemArtworkURL string
		if u, ok := itemMap["artworkUrl"].(string); ok && u != "" {
			itemArtworkURL = u
		} else if u, ok := itemMap["artwork_url"].(string); ok && u != "" {
			itemArtworkURL = u
		} else if u, ok := itemMap["fileUrl"].(string); ok && u != "" {
			itemArtworkURL = u
		} else if u, ok := itemMap["file_url"].(string); ok && u != "" {
			itemArtworkURL = u
		}
		var itemArtworkFileName string
		if f, ok := itemMap["fileName"].(string); ok && f != "" {
			itemArtworkFileName = f
		} else if f, ok := itemMap["file_name"].(string); ok && f != "" {
			itemArtworkFileName = f
		} else if itemArtworkURL != "" {
			itemArtworkFileName = filepath.Base(itemArtworkURL)
		}

		var itemArtwork *ItemArtwork
		if itemArtworkURL != "" {
			itemArtwork = &ItemArtwork{
				FileURL:             itemArtworkURL,
				FileName:            itemArtworkFileName,
				PageCount:           1,
			}
		}

		itemsList = append(itemsList, OrderItem{
			ID:                fmt.Sprintf("item-%s-%d", newOrderID, idx+1),
			OrderID:           newOrderID,
			JobName:           itemName,
			ItemName:          itemName,
			Quantity:          qty,
			PageCount:         1,
			PaperSize:         "A5",
			CoverFileURL:      itemArtworkURL,
			InnerFileURL:      itemArtworkURL,
			ArtworkURL:         itemArtworkURL,
			ArtworkFileName:    itemArtworkFileName,
			Artwork:            itemArtwork,
			Specifications:     itemMap,
			CurrentStep:       StepPending,
			UnitPriceLAK:      unitPrice,
			TotalPriceLAK:     subtotal,
			UnitPriceSnapshot: unitPrice,
			Specs:             itemMap,
			CreatedAt:         time.Now(),
			UpdatedAt:         time.Now(),
		})
	}

	convertedArtworkURL := q.ArtworkURL
	if convertedArtworkURL == "" && len(itemsList) > 0 {
		for _, it := range itemsList {
			if it.ArtworkURL != "" {
				convertedArtworkURL = it.ArtworkURL
				break
			}
		}
	}
	var convertedArtworkFileName string
	if len(itemsList) > 0 {
		for _, it := range itemsList {
			if it.ArtworkFileName != "" {
				convertedArtworkFileName = it.ArtworkFileName
				break
			}
		}
	}
	if convertedArtworkFileName == "" && convertedArtworkURL != "" {
		convertedArtworkFileName = filepath.Base(convertedArtworkURL)
	}

	convertedOrder := Order{
		ID:              newOrderID,
		OrderNo:         orderNo,
		OrderNumber:     orderNo,
		CustomerName:    q.CustomerName,
		CustomerPhone:   q.CustomerPhone,
		CustomerAddress: q.CustomerAddress,
		TotalAmountLAK:  q.TotalSellingPrice,
		TotalPrice:      q.TotalSellingPrice,
		TotalCost:       q.TotalCost,
		GoogleDriveLink: convertedArtworkURL,
		ArtworkURL:      convertedArtworkURL,
		ArtworkFileName: convertedArtworkFileName,
		ProofURL:        q.DigitalProofURL,
		DepositAmount:   0,
		DepositLAK:      0,
		RemainingLAK:    q.TotalSellingPrice,
		Status:          StatusWaitingDeposit,
		OverallStatus:   StatusWaitingDeposit,
		Items:           itemsList,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if db.DB != nil {
		err := saveOrderToDB(convertedOrder)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to convert quotation to order", "details": err.Error()})
			return
		}
		_, _ = db.DB.Exec("UPDATE quotations SET status = 'CONVERTED', updated_at = NOW() WHERE id = $1 OR quotation_no = $1", id)
	}

	storeMutex.Lock()
	ordersStore[newOrderID] = convertedOrder
	storeMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{
		"status":       "success",
		"message":      "Quotation converted to order successfully",
		"orderId":      convertedOrder.ID,
		"order_id":     convertedOrder.ID,
		"orderNumber":  convertedOrder.OrderNumber,
		"order_number": convertedOrder.OrderNumber,
		"customerName": convertedOrder.CustomerName,
		"customerId":   convertedOrder.CustomerID,
		"data":         convertedOrder,
	})
}
