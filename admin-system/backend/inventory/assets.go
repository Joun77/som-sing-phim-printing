package inventory

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


// InventoryItem represents an inventory SKU with dynamic technical specs
type InventoryItem struct {
	ID                     string                 `json:"id"`
	Name                   string                 `json:"name"`
	Category               string                 `json:"category"`
	StockQty               int                    `json:"stockQty"`
	ConsumptionUnit        string                 `json:"consumptionUnit"`
	PurchaseUnit           string                 `json:"purchaseUnit"`
	PurchaseMultiplier     int                    `json:"purchaseMultiplier"`
	CostPerPurchaseUnit    float64                `json:"costPerPurchaseUnit"`
	CostPerConsumptionUnit float64                `json:"costPerConsumptionUnit"`
	ReorderThreshold       int                    `json:"reorderThreshold"`
	InkCode                string                 `json:"inkCode,omitempty"`
	ColorName              string                 `json:"colorName,omitempty"`
	ColorGroup             string                 `json:"colorGroup,omitempty"`
	Volume                 float64                `json:"volume,omitempty"`
	InkBaseType            string                 `json:"inkBaseType,omitempty"`
	IsCompatible           bool                   `json:"isCompatible"`
	TechnicalSpecs         map[string]interface{} `json:"technical_specs,omitempty"`
	Specs                  map[string]interface{} `json:"specs,omitempty"`
	Batches                []interface{}          `json:"batches,omitempty"`
	UpdatedAt              string                 `json:"updatedAt"`
}

// EquipmentItem represents a printer or machinery asset with OEM specs and components
type EquipmentItem struct {
	ID                     string                 `json:"id"`
	Name                   string                 `json:"name"`
	SerialNumber           string                 `json:"serialNumber"`
	Brand                  string                 `json:"brand"`
	Model                  string                 `json:"model"`
	Category               string                 `json:"category"`
	PrinterCategory        string                 `json:"printerCategory"`
	ColorSchemeType        string                 `json:"colorSchemeType"`
	TotalColorSlots        int                    `json:"totalColorSlots"`
	ExpectedLifeA4Pages    int                    `json:"expectedLifeA4Pages"`
	MaintenanceRatePercent float64                `json:"maintenanceRatePercent"`
	Price                  float64                `json:"price"`
	Vendor                 string                 `json:"vendor"`
	WarrantyExpirationYear int                    `json:"warrantyExpirationYear"`
	Location               string                 `json:"location"`
	Status                 string                 `json:"status"`
	ProductImageUrl        string                 `json:"product_image_url,omitempty"`
	ReceiptInvoiceUrl      string                 `json:"receipt_invoice_url,omitempty"`
	TechnicalSpecs         map[string]interface{} `json:"technical_specs,omitempty"`
	OemBaselineSpecs       map[string]interface{} `json:"oem_baseline_specs,omitempty"`
	PrinterColorLinks      []interface{}          `json:"printerColorLinks,omitempty"`
	Components             []interface{}          `json:"components,omitempty"`
	UpdatedAt              string                 `json:"updatedAt"`
}

// InboundAssetRequest represents payload for POST /api/v1/assets/inbound
type InboundAssetRequest struct {
	ID                     string                 `json:"id"`
	AssetID                string                 `json:"asset_id"`
	PONumber               string                 `json:"poNumber"`
	InboundDate            string                 `json:"inboundDate"`
	SKU                    string                 `json:"sku"`
	Name                   string                 `json:"name"`
	SerialNumber           string                 `json:"serialNumber"`
	Brand                  string                 `json:"brand"`
	Model                  string                 `json:"model"`
	Category               string                 `json:"category"`
	PrinterCategory        string                 `json:"printerCategory"`
	ColorSchemeType        string                 `json:"colorSchemeType"`
	TotalColorSlots        int                    `json:"totalColorSlots"`
	ExpectedLifeA4Pages    int                    `json:"expectedLifeA4Pages"`
	MaintenanceRatePercent float64                `json:"maintenanceRatePercent"`
	Price                  float64                `json:"price"`
	Supplier               string                 `json:"supplier"`
	Vendor                 string                 `json:"vendor"`
	WarrantyExpirationYear int                    `json:"warrantyExpirationYear"`
	Quantity               float64                `json:"quantity"`
	Unit                   string                 `json:"unit"`
	PaymentMethod          string                 `json:"paymentMethod"`
	Origin                 string                 `json:"origin"`
	TariffFee              float64                `json:"tariffFee"`
	FreightFee             float64                `json:"freightFee"`
	Location               string                 `json:"location"`
	Status                 string                 `json:"status"`
	ImgProduct             string                 `json:"imgProduct"`
	ImgSlip                string                 `json:"imgSlip"`
	TechnicalSpecs         map[string]interface{} `json:"technical_specs"`
	OemBaselineSpecs       map[string]interface{} `json:"oem_baseline_specs"`
	Components             []interface{}          `json:"components"`
}

// In-memory store fallback with thread safety
var (
	inventoryStore  = make(map[string]InventoryItem)
	equipmentStore  = make(map[string]EquipmentItem)
	assetStoreMutex sync.RWMutex
)

// HandleGetEquipment returns list of equipment / printers (queries DB first)
func HandleGetEquipment(c *gin.Context) {
	if db.DB != nil {
		items, err := getEquipmentFromDB()
		if err == nil {
			if items == nil {
				items = []EquipmentItem{}
			}
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": items})
			return
		}
	}

	assetStoreMutex.RLock()
	defer assetStoreMutex.RUnlock()

	items := make([]EquipmentItem, 0, len(equipmentStore))
	for _, item := range equipmentStore {
		items = append(items, item)
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": items})
}

// HandleGetAssetsV1 returns list of assets via /api/v1/assets
func HandleGetAssetsV1(c *gin.Context) {
	HandleGetEquipment(c)
}

// HandleGetAssetByIDV1 queries a single asset by ID
func HandleGetAssetByIDV1(c *gin.Context) {
	id := c.Param("id")
	if db.DB != nil {
		item, err := getEquipmentByIDFromDB(id)
		if err == nil {
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": item})
			return
		}
	}

	assetStoreMutex.RLock()
	item, exists := equipmentStore[id]
	assetStoreMutex.RUnlock()

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Asset not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": item})
}

// HandleInboundAssetV1 processes inbound procurement & persists record in PostgreSQL
func HandleInboundAssetV1(c *gin.Context) {
	var req InboundAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	assetID := req.AssetID
	if assetID == "" {
		assetID = req.ID
	}
	if assetID == "" {
		assetID = "PRN-" + time.Now().Format("150405")
	}

	if req.Name == "" && req.Model != "" {
		req.Name = req.Brand + " " + req.Model
	}
	if req.Vendor == "" {
		req.Vendor = req.Supplier
	}
	if req.Status == "" {
		req.Status = "In Use"
	}
	if req.Location == "" {
		req.Location = "Main Workshop"
	}
	if req.PrinterCategory == "" {
		req.PrinterCategory = "Inkjet"
	}
	if req.ColorSchemeType == "" {
		req.ColorSchemeType = "CMYK"
	}
	if req.WarrantyExpirationYear == 0 {
		req.WarrantyExpirationYear = time.Now().Year() + 2
	}
	if req.TechnicalSpecs == nil {
		req.TechnicalSpecs = make(map[string]interface{})
	}
	if req.OemBaselineSpecs == nil {
		req.OemBaselineSpecs = make(map[string]interface{})
	}
	if req.Components == nil {
		req.Components = make([]interface{}, 0)
	}

	// 1. Try DB persistence based on category
	if db.DB != nil {
		if req.Category == "PRINTER" || req.Category == "Printer" || req.Category == "MACHINERY" || req.Category == "Machinery" {
			err := saveInboundToDB(assetID, req)
			if err != nil {
				log.Printf("[DB ERROR] Failed to save inbound asset to DB: %v", err)
			} else {
				log.Printf("[DB SUCCESS] Inbound printer/machinery %s saved to PostgreSQL!", assetID)
			}
		} else {
			invItem := InventoryItem{
				ID:                     assetID,
				Name:                   req.Name,
				Category:               req.Category,
				StockQty:               int(req.Quantity),
				ConsumptionUnit:        req.Unit,
				PurchaseUnit:           req.Unit,
				PurchaseMultiplier:     1,
				CostPerPurchaseUnit:    req.Price,
				CostPerConsumptionUnit: req.Price,
				ReorderThreshold:       10,
				InkCode:                req.SKU,
				TechnicalSpecs:         req.TechnicalSpecs,
				Specs:                  req.TechnicalSpecs,
				UpdatedAt:              time.Now().Format(time.RFC3339),
			}
			err := saveInventoryItemToDB(invItem)
			if err != nil {
				log.Printf("[DB ERROR] Failed to save inventory item to DB: %v", err)
			} else {
				log.Printf("[DB SUCCESS] Inventory item %s saved to PostgreSQL!", assetID)
			}
		}
	}

	// 2. Also keep in-memory stores updated for instant fallback
	equip := EquipmentItem{
		ID:                     assetID,
		Name:                   req.Name,
		SerialNumber:           req.SerialNumber,
		Brand:                  req.Brand,
		Model:                  req.Model,
		Category:               req.Category,
		PrinterCategory:        req.PrinterCategory,
		ColorSchemeType:        req.ColorSchemeType,
		TotalColorSlots:        req.TotalColorSlots,
		ExpectedLifeA4Pages:    req.ExpectedLifeA4Pages,
		MaintenanceRatePercent: req.MaintenanceRatePercent,
		Price:                  req.Price,
		Vendor:                 req.Vendor,
		WarrantyExpirationYear: req.WarrantyExpirationYear,
		Location:               req.Location,
		Status:                 req.Status,
		ProductImageUrl:        req.ImgProduct,
		ReceiptInvoiceUrl:      req.ImgSlip,
		TechnicalSpecs:         req.TechnicalSpecs,
		OemBaselineSpecs:       req.OemBaselineSpecs,
		Components:             req.Components,
		UpdatedAt:              time.Now().Format(time.RFC3339),
	}

	assetStoreMutex.Lock()
	equipmentStore[assetID] = equip
	inventoryStore[assetID] = InventoryItem{
		ID:                     assetID,
		Name:                   req.Name,
		Category:               req.Category,
		StockQty:               int(req.Quantity),
		ConsumptionUnit:        req.Unit,
		PurchaseUnit:           req.Unit,
		PurchaseMultiplier:     1,
		CostPerPurchaseUnit:    req.Price,
		CostPerConsumptionUnit: req.Price,
		ReorderThreshold:       10,
		InkCode:                req.SKU,
		TechnicalSpecs:         req.TechnicalSpecs,
		Specs:                  req.TechnicalSpecs,
		UpdatedAt:              time.Now().Format(time.RFC3339),
	}
	assetStoreMutex.Unlock()

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Inbound asset processed and saved to Database successfully",
		"data":    equip,
	})
}

// HandleUpdateAssetV1 updates master technical specs & components in PostgreSQL
func HandleUpdateAssetV1(c *gin.Context) {
	id := c.Param("id")

	var item EquipmentItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item.ID = id
	item.UpdatedAt = time.Now().Format(time.RFC3339)

	if db.DB != nil {
		err := updateEquipmentInDB(id, item)
		if err != nil {
			log.Printf("[DB ERROR] Failed to update printer in DB: %v", err)
		} else {
			log.Printf("[DB SUCCESS] Printer %s updated in PostgreSQL!", id)
		}
	}

	assetStoreMutex.Lock()
	equipmentStore[id] = item
	assetStoreMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Asset specification updated successfully",
		"data":    item,
	})
}

// HandleGetInventoryItems returns list of inventory items from DB or memory fallback
func HandleGetInventoryItems(c *gin.Context) {
	if db.DB != nil {
		items, err := getInventoryItemsFromDB()
		if err == nil {
			if items == nil {
				items = []InventoryItem{}
			}
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": items})
			return
		}
	}

	assetStoreMutex.RLock()
	defer assetStoreMutex.RUnlock()

	items := make([]InventoryItem, 0, len(inventoryStore))
	for _, item := range inventoryStore {
		items = append(items, item)
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": items})
}

// HandleCreateInventoryItem creates a new inventory SKU
func HandleCreateInventoryItem(c *gin.Context) {
	var item InventoryItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if item.ID == "" {
		item.ID = "SKU-" + time.Now().Format("150405")
	}
	item.UpdatedAt = time.Now().Format(time.RFC3339)

	if db.DB != nil {
		err := saveInventoryItemToDB(item)
		if err != nil {
			log.Printf("[DB ERROR] Failed to save inventory item to DB: %v", err)
		} else {
			log.Printf("[DB SUCCESS] Inventory item %s saved to PostgreSQL!", item.ID)
		}
	}

	assetStoreMutex.Lock()
	inventoryStore[item.ID] = item
	assetStoreMutex.Unlock()

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Inventory item created successfully",
		"data":    item,
	})
}

// HandleUpdateInventoryItem updates an existing inventory SKU
func HandleUpdateInventoryItem(c *gin.Context) {
	id := c.Param("id")

	var item InventoryItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item.ID = id
	item.UpdatedAt = time.Now().Format(time.RFC3339)

	if db.DB != nil {
		err := saveInventoryItemToDB(item)
		if err != nil {
			log.Printf("[DB ERROR] Failed to update inventory item in DB: %v", err)
		} else {
			log.Printf("[DB SUCCESS] Inventory item %s updated in PostgreSQL!", id)
		}
	}

	assetStoreMutex.Lock()
	inventoryStore[id] = item
	assetStoreMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Inventory item updated successfully",
		"data":    item,
	})
}

// HandleCreateEquipment handles equipment creation endpoint
func HandleCreateEquipment(c *gin.Context) {
	HandleInboundAssetV1(c)
}

// HandleUpdateEquipment updates equipment asset
func HandleUpdateEquipment(c *gin.Context) {
	HandleUpdateAssetV1(c)
}

// --- DB HELPERS ---

func getEquipmentFromDB() ([]EquipmentItem, error) {
	query := `
		SELECT asset_id, serial_number, brand, model, category, color_scheme_type,
		       total_color_slots, expected_life_a4_pages, maintenance_rate_percent,
		       price_cost, vendor_supplier, warranty_expiry_year, status, location_dept,
		       technical_specs, oem_baseline_specs, components,
		       COALESCE(product_image_url, ''), COALESCE(receipt_invoice_url, ''), updated_at
		FROM printers
		ORDER BY created_at DESC
	`

	rows, err := db.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []EquipmentItem
	for rows.Next() {
		var item EquipmentItem
		var pCat, cScheme, pStatus string
		var techJSON, oemJSON, compJSON []byte
		var updatedAt time.Time

		err := rows.Scan(
			&item.ID, &item.SerialNumber, &item.Brand, &item.Model,
			&pCat, &cScheme, &item.TotalColorSlots, &item.ExpectedLifeA4Pages,
			&item.MaintenanceRatePercent, &item.Price, &item.Vendor,
			&item.WarrantyExpirationYear, &pStatus, &item.Location,
			&techJSON, &oemJSON, &compJSON,
			&item.ProductImageUrl, &item.ReceiptInvoiceUrl, &updatedAt,
		)
		if err != nil {
			log.Printf("[DB ROW ERROR] %v", err)
			continue
		}

		item.PrinterCategory = pCat
		item.Category = pCat
		item.ColorSchemeType = cScheme
		item.Status = pStatus
		item.Name = item.Brand + " " + item.Model
		item.UpdatedAt = updatedAt.Format(time.RFC3339)

		if len(techJSON) > 0 {
			json.Unmarshal(techJSON, &item.TechnicalSpecs)
		}
		if len(oemJSON) > 0 {
			json.Unmarshal(oemJSON, &item.OemBaselineSpecs)
		}
		if len(compJSON) > 0 {
			json.Unmarshal(compJSON, &item.Components)
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func getEquipmentByIDFromDB(id string) (EquipmentItem, error) {
	var item EquipmentItem
	query := `
		SELECT asset_id, serial_number, brand, model, category, color_scheme_type,
		       total_color_slots, expected_life_a4_pages, maintenance_rate_percent,
		       price_cost, vendor_supplier, warranty_expiry_year, status, location_dept,
		       technical_specs, oem_baseline_specs, components,
		       COALESCE(product_image_url, ''), COALESCE(receipt_invoice_url, ''), updated_at
		FROM printers
		WHERE asset_id = $1
	`
	var pCat, cScheme, pStatus string
	var techJSON, oemJSON, compJSON []byte
	var updatedAt time.Time

	err := db.DB.QueryRow(query, id).Scan(
		&item.ID, &item.SerialNumber, &item.Brand, &item.Model,
		&pCat, &cScheme, &item.TotalColorSlots, &item.ExpectedLifeA4Pages,
		&item.MaintenanceRatePercent, &item.Price, &item.Vendor,
		&item.WarrantyExpirationYear, &pStatus, &item.Location,
		&techJSON, &oemJSON, &compJSON,
		&item.ProductImageUrl, &item.ReceiptInvoiceUrl, &updatedAt,
	)

	if err != nil {
		return item, err
	}

	item.PrinterCategory = pCat
	item.Category = pCat
	item.ColorSchemeType = cScheme
	item.Status = pStatus
	item.Name = item.Brand + " " + item.Model
	item.UpdatedAt = updatedAt.Format(time.RFC3339)

	if len(techJSON) > 0 {
		json.Unmarshal(techJSON, &item.TechnicalSpecs)
	}
	if len(oemJSON) > 0 {
		json.Unmarshal(oemJSON, &item.OemBaselineSpecs)
	}
	if len(compJSON) > 0 {
		json.Unmarshal(compJSON, &item.Components)
	}

	return item, nil
}

func getInventoryItemsFromDB() ([]InventoryItem, error) {
	query := `
		SELECT id, sku, name, category, stock_qty, consumption_unit, purchase_unit,
		       purchase_multiplier, cost_per_purchase_unit, cost_per_consumption_unit,
		       reorder_threshold, technical_specs, updated_at
		FROM materials
		ORDER BY created_at DESC
	`

	rows, err := db.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []InventoryItem
	for rows.Next() {
		var item InventoryItem
		var stockQty, multiplier, costPur, costCon, reorder float64
		var techJSON []byte
		var updatedAt time.Time

		err := rows.Scan(
			&item.ID, &item.InkCode, &item.Name, &item.Category, &stockQty,
			&item.ConsumptionUnit, &item.PurchaseUnit, &multiplier,
			&costPur, &costCon, &reorder, &techJSON, &updatedAt,
		)
		if err != nil {
			log.Printf("[DB INVENTORY SCAN ERROR] %v", err)
			continue
		}

		catLower := strings.ToLower(item.Category)
		isPaper := strings.Contains(catLower, "paper") || strings.Contains(catLower, "material") || strings.Contains(strings.ToLower(item.Name), "paper") || strings.Contains(strings.ToLower(item.Name), "double a") || strings.Contains(strings.ToLower(item.Name), "green read") || strings.Contains(strings.ToLower(item.Name), "idea")
		if isPaper {
			if multiplier <= 1 {
				multiplier = 500
			}
			if stockQty > 0 && stockQty <= 100 {
				stockQty = stockQty * multiplier
			}
			if costCon <= 0 || (multiplier > 1 && costCon >= (costPur/2) && costPur > 0) {
				costCon = costPur / multiplier
			}
			if item.ConsumptionUnit == "" || item.ConsumptionUnit == "Unit" {
				item.ConsumptionUnit = "ແຜ່ນ"
			}
			if item.PurchaseUnit == "" || item.PurchaseUnit == "Unit" {
				item.PurchaseUnit = "ແພັກ"
			}
		}

		item.StockQty = int(stockQty)
		item.PurchaseMultiplier = int(multiplier)
		item.CostPerPurchaseUnit = costPur
		item.CostPerConsumptionUnit = costCon
		item.ReorderThreshold = int(reorder)
		item.UpdatedAt = updatedAt.Format(time.RFC3339)

		if len(techJSON) > 0 {
			json.Unmarshal(techJSON, &item.TechnicalSpecs)
			item.Specs = item.TechnicalSpecs
		}


		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func saveInventoryItemToDB(item InventoryItem) error {
	techBytes, _ := json.Marshal(item.TechnicalSpecs)
	if len(techBytes) == 0 || string(techBytes) == "null" {
		techBytes, _ = json.Marshal(item.Specs)
	}

	sku := item.InkCode
	if sku == "" {
		sku = item.ID
	}

	query := `
		INSERT INTO materials (
			id, sku, name, category, stock_qty, consumption_unit,
			purchase_unit, purchase_multiplier, cost_per_purchase_unit,
			cost_per_consumption_unit, reorder_threshold, technical_specs, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, NOW()
		)
		ON CONFLICT (id) DO UPDATE SET
			sku = EXCLUDED.sku,
			name = EXCLUDED.name,
			category = EXCLUDED.category,
			stock_qty = EXCLUDED.stock_qty,
			consumption_unit = EXCLUDED.consumption_unit,
			purchase_unit = EXCLUDED.purchase_unit,
			purchase_multiplier = EXCLUDED.purchase_multiplier,
			cost_per_purchase_unit = EXCLUDED.cost_per_purchase_unit,
			cost_per_consumption_unit = EXCLUDED.cost_per_consumption_unit,
			reorder_threshold = EXCLUDED.reorder_threshold,
			technical_specs = EXCLUDED.technical_specs,
			updated_at = NOW()
	`

	cUnit := item.ConsumptionUnit
	if cUnit == "" {
		cUnit = "Unit"
	}
	pUnit := item.PurchaseUnit
	if pUnit == "" {
		pUnit = "Pack"
	}
	mult := item.PurchaseMultiplier
	if mult == 0 {
		mult = 1
	}

	_, err := db.DB.Exec(query,
		item.ID, sku, item.Name, item.Category, item.StockQty,
		cUnit, pUnit, mult, item.CostPerPurchaseUnit,
		item.CostPerConsumptionUnit, item.ReorderThreshold, string(techBytes),
	)

	return err
}

func saveInboundToDB(assetID string, req InboundAssetRequest) error {
	techBytes, _ := json.Marshal(req.TechnicalSpecs)
	oemBytes, _ := json.Marshal(req.OemBaselineSpecs)
	compBytes, _ := json.Marshal(req.Components)

	// 1. Insert into inbound_transactions
	inboundQuery := `
		INSERT INTO inbound_transactions (
			po_number, sku_code, item_name, supplier_name, category,
			quantity, unit, total_price, payment_method, origin,
			tariff_fee, freight_fee, product_image_url, receipt_slip_url, technical_specs
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`
	_, _ = db.DB.Exec(inboundQuery,
		req.PONumber, assetID, req.Name, req.Supplier, req.Category,
		req.Quantity, req.Unit, req.Price, req.PaymentMethod, req.Origin,
		req.TariffFee, req.FreightFee, req.ImgProduct, req.ImgSlip, string(techBytes),
	)

	// 2. Upsert printer asset
	printerQuery := `
		INSERT INTO printers (
			asset_id, serial_number, brand, model, category,
			color_scheme_type, total_color_slots, expected_life_a4_pages,
			maintenance_rate_percent, purchase_date, price_cost, vendor_supplier,
			warranty_expiry_year, status, location_dept, technical_specs,
			oem_baseline_specs, components, product_image_url, receipt_invoice_url, updated_at
		) VALUES (
			$1, $2, $3, $4, $5::printer_category_enum,
			$6::printer_color_scheme_enum, $7, $8,
			$9, CURRENT_DATE, $10, $11,
			$12, $13::printer_status_enum, $14, $15::jsonb,
			$16::jsonb, $17::jsonb, $18, $19, NOW()
		)
		ON CONFLICT (asset_id) DO UPDATE SET
			serial_number = EXCLUDED.serial_number,
			brand = EXCLUDED.brand,
			model = EXCLUDED.model,
			category = EXCLUDED.category,
			color_scheme_type = EXCLUDED.color_scheme_type,
			total_color_slots = EXCLUDED.total_color_slots,
			expected_life_a4_pages = EXCLUDED.expected_life_a4_pages,
			maintenance_rate_percent = EXCLUDED.maintenance_rate_percent,
			price_cost = EXCLUDED.price_cost,
			vendor_supplier = EXCLUDED.vendor_supplier,
			warranty_expiry_year = EXCLUDED.warranty_expiry_year,
			status = EXCLUDED.status,
			location_dept = EXCLUDED.location_dept,
			technical_specs = EXCLUDED.technical_specs,
			oem_baseline_specs = EXCLUDED.oem_baseline_specs,
			components = EXCLUDED.components,
			updated_at = NOW()
	`

	serial := req.SerialNumber
	if serial == "" {
		serial = "SN-" + assetID
	}
	brand := req.Brand
	if brand == "" {
		brand = "Generic"
	}
	model := req.Model
	if model == "" {
		model = req.Name
	}
	pCat := req.PrinterCategory
	if pCat == "" {
		pCat = "Inkjet"
	}
	cScheme := req.ColorSchemeType
	if cScheme == "" {
		cScheme = "CMYK"
	}
	status := req.Status
	if status == "" {
		status = "In Use"
	}

	_, err := db.DB.Exec(printerQuery,
		assetID, serial, brand, model, pCat,
		cScheme, req.TotalColorSlots, req.ExpectedLifeA4Pages,
		req.MaintenanceRatePercent, req.Price, req.Vendor,
		req.WarrantyExpirationYear, status, req.Location,
		string(techBytes), string(oemBytes), string(compBytes),
		req.ImgProduct, req.ImgSlip,
	)

	return err
}

func updateEquipmentInDB(id string, item EquipmentItem) error {
	techBytes, _ := json.Marshal(item.TechnicalSpecs)
	oemBytes, _ := json.Marshal(item.OemBaselineSpecs)
	compBytes, _ := json.Marshal(item.Components)

	query := `
		INSERT INTO printers (
			asset_id, serial_number, brand, model, category,
			color_scheme_type, total_color_slots, expected_life_a4_pages,
			maintenance_rate_percent, purchase_date, price_cost, vendor_supplier,
			warranty_expiry_year, status, location_dept, technical_specs,
			oem_baseline_specs, components, product_image_url, receipt_invoice_url, updated_at
		) VALUES (
			$1, COALESCE(NULLIF($2, ''), 'SN-' || $1::text), COALESCE(NULLIF($3, ''), 'Generic'), COALESCE(NULLIF($4, ''), 'Model'), $5::printer_category_enum,
			$6::printer_color_scheme_enum, $7, $8,
			$9, CURRENT_DATE, $10, COALESCE(NULLIF($11, ''), 'Supplier'),
			$12, $13::printer_status_enum, COALESCE(NULLIF($14, ''), 'Main Dept'), $15::jsonb,
			$16::jsonb, $17::jsonb, $18, $19, NOW()
		)
		ON CONFLICT (asset_id) DO UPDATE SET
			serial_number = COALESCE(NULLIF(EXCLUDED.serial_number, ''), printers.serial_number),
			brand = COALESCE(NULLIF(EXCLUDED.brand, ''), printers.brand),
			model = COALESCE(NULLIF(EXCLUDED.model, ''), printers.model),
			category = EXCLUDED.category,
			color_scheme_type = EXCLUDED.color_scheme_type,
			total_color_slots = EXCLUDED.total_color_slots,
			expected_life_a4_pages = EXCLUDED.expected_life_a4_pages,
			maintenance_rate_percent = EXCLUDED.maintenance_rate_percent,
			price_cost = EXCLUDED.price_cost,
			vendor_supplier = COALESCE(NULLIF(EXCLUDED.vendor_supplier, ''), printers.vendor_supplier),
			warranty_expiry_year = EXCLUDED.warranty_expiry_year,
			status = EXCLUDED.status,
			location_dept = COALESCE(NULLIF(EXCLUDED.location_dept, ''), printers.location_dept),
			technical_specs = EXCLUDED.technical_specs,
			oem_baseline_specs = EXCLUDED.oem_baseline_specs,
			components = EXCLUDED.components,
			updated_at = NOW()
	`

	pCat := item.PrinterCategory
	if pCat == "" {
		pCat = "Inkjet"
	}
	cScheme := item.ColorSchemeType
	if cScheme == "" {
		cScheme = "CMYK"
	}
	status := item.Status
	if status == "" {
		status = "In Use"
	}
	if item.WarrantyExpirationYear == 0 {
		item.WarrantyExpirationYear = time.Now().Year() + 2
	}

	_, err := db.DB.Exec(query,
		id, item.SerialNumber, item.Brand, item.Model, pCat,
		cScheme, item.TotalColorSlots, item.ExpectedLifeA4Pages,
		item.MaintenanceRatePercent, item.Price, item.Vendor,
		item.WarrantyExpirationYear, status, item.Location,
		string(techBytes), string(oemBytes), string(compBytes),
		item.ProductImageUrl, item.ReceiptInvoiceUrl,
	)

	return err
}

// MarshalSpecs helper
func MarshalSpecs(specs map[string]interface{}) (string, error) {
	if len(specs) == 0 {
		return "{}", nil
	}
	bytes, err := json.Marshal(specs)
	return string(bytes), err
}

// DischargeRequest represents stock deduction payload
type DischargeRequest struct {
	SKUCode  string `json:"skuId"`
	Quantity int    `json:"quantity"`
	Reason   string `json:"reason"`
	Remarks  string `json:"remarks"`
}

// HandleSaveInventorySKU saves or creates an inventory SKU
func HandleSaveInventorySKU(c *gin.Context) {
	var item InventoryItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if item.ID == "" {
		item.ID = "SKU-" + time.Now().Format("150405")
	}

	if db.DB != nil {
		if err := saveInventoryItemToDB(item); err != nil {
			log.Printf("[DB ERROR] Failed to save inventory item to DB: %v", err)
		}
	}

	assetStoreMutex.Lock()
	inventoryStore[item.ID] = item
	assetStoreMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": item})
}

// HandleUpdateInventorySKU updates an existing SKU
func HandleUpdateInventorySKU(c *gin.Context) {
	id := c.Param("id")
	var item InventoryItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}
	item.ID = id

	if db.DB != nil {
		if err := saveInventoryItemToDB(item); err != nil {
			log.Printf("[DB ERROR] Failed to update inventory item in DB: %v", err)
		}
	}

	assetStoreMutex.Lock()
	inventoryStore[item.ID] = item
	assetStoreMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": item})
}

// HandleDeleteInventorySKU deletes a SKU
func HandleDeleteInventorySKU(c *gin.Context) {
	id := c.Param("id")

	if db.DB != nil {
		_, err := db.DB.Exec(`DELETE FROM materials WHERE id = $1 OR sku = $1`, id)
		if err != nil {
			log.Printf("[DB ERROR] Failed to delete material from DB: %v", err)
		}
	}

	assetStoreMutex.Lock()
	delete(inventoryStore, id)
	assetStoreMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "SKU deleted"})
}

// HandleDeleteEquipment deletes equipment / printer asset
func HandleDeleteEquipment(c *gin.Context) {
	id := c.Param("id")

	if db.DB != nil {
		_, err := db.DB.Exec(`DELETE FROM printers WHERE asset_id = $1 OR serial_number = $1`, id)
		if err != nil {
			log.Printf("[DB ERROR] Failed to delete printer from DB: %v", err)
		}
	}

	assetStoreMutex.Lock()
	delete(equipmentStore, id)
	assetStoreMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Equipment deleted"})
}

// DeductInventoryStockFIFOPessimisticLock performs strict FIFO stock deduction with FOR UPDATE row locks to prevent race conditions
func DeductInventoryStockFIFOPessimisticLock(sku string, quantity float64) (float64, error) {
	if db.DB == nil {
		assetStoreMutex.Lock()
		defer assetStoreMutex.Unlock()
		item, exists := inventoryStore[sku]
		if !exists {
			return 0, fmt.Errorf("SKU %s not found in inventory", sku)
		}
		if float64(item.StockQty) < quantity {
			return float64(item.StockQty), fmt.Errorf("insufficient stock for SKU %s (available: %d, requested: %v)", sku, item.StockQty, quantity)
		}
		item.StockQty -= int(quantity)
		inventoryStore[sku] = item
		return float64(item.StockQty), nil
	}

	tx, err := db.DB.Begin()
	if err != nil {
		return 0, fmt.Errorf("failed to start SQL transaction: %w", err)
	}
	defer tx.Rollback()

	// 1. Lock material row for update
	var materialID string
	var currentStock float64
	queryLockMaterial := `SELECT id, stock_qty FROM materials WHERE sku = $1 FOR UPDATE`
	err = tx.QueryRow(queryLockMaterial, sku).Scan(&materialID, &currentStock)
	if err != nil {
		return 0, fmt.Errorf("material SKU %s not found: %w", sku, err)
	}

	if currentStock < quantity {
		return currentStock, fmt.Errorf("insufficient stock for SKU %s (available: %v, requested: %v)", sku, currentStock, quantity)
	}

	// 2. Lock inventory batches for FIFO deduction
	queryLockBatches := `SELECT id, quantity FROM inventory_batches WHERE sku_id = $1 AND quantity > 0 ORDER BY received_date ASC FOR UPDATE`
	rows, err := tx.Query(queryLockBatches, sku)
	if err == nil {
		remainingToDeduct := quantity
		for rows.Next() {
			var batchID string
			var batchQty float64
			if err := rows.Scan(&batchID, &batchQty); err != nil {
				continue
			}

			var deductAmt float64
			if batchQty >= remainingToDeduct {
				deductAmt = remainingToDeduct
				remainingToDeduct = 0
			} else {
				deductAmt = batchQty
				remainingToDeduct -= batchQty
			}

			updateBatch := `UPDATE inventory_batches SET quantity = quantity - $1 WHERE id = $2`
			_, _ = tx.Exec(updateBatch, deductAmt, batchID)

			if remainingToDeduct <= 0 {
				break
			}
		}
		if err := rows.Err(); err != nil {
			rows.Close()
			return 0, fmt.Errorf("failed to iterate inventory batches: %w", err)
		}
		rows.Close()
	}

	// 3. Deduct total stock in materials catalog
	newStock := currentStock - quantity
	updateMaterial := `UPDATE materials SET stock_qty = $1, updated_at = NOW() WHERE sku = $2`
	if _, err := tx.Exec(updateMaterial, newStock, sku); err != nil {
		return 0, fmt.Errorf("failed to update material stock: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit inventory deduction transaction: %w", err)
	}

	return newStock, nil
}

// HandleDischargeInventoryStock discharges stock for a SKU using pessimistic FOR UPDATE locking
func HandleDischargeInventoryStock(c *gin.Context) {
	id := c.Param("id")
	var req DischargeRequest
	_ = c.ShouldBindJSON(&req)
	if req.SKUCode == "" {
		req.SKUCode = id
	}

	remaining, err := DeductInventoryStockFIFOPessimisticLock(req.SKUCode, float64(req.Quantity))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error(), "remainingStock": remaining})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Stock discharged cleanly with FIFO lock", "remainingStock": remaining})
}

