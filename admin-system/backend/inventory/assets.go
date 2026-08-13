package inventory

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

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

// EquipmentItem represents a printer or machinery asset with OEM specs
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
	Location               string                 `json:"location"`
	Status                 string                 `json:"status"`
	TechnicalSpecs         map[string]interface{} `json:"technical_specs,omitempty"`
	OemBaselineSpecs       map[string]interface{} `json:"oem_baseline_specs,omitempty"`
	PrinterColorLinks      []interface{}          `json:"printerColorLinks,omitempty"`
	Components             []interface{}          `json:"components,omitempty"`
	UpdatedAt              string                 `json:"updatedAt"`
}

// In-memory store fallback with thread safety
var (
	inventoryStore = make(map[string]InventoryItem)
	equipmentStore = make(map[string]EquipmentItem)
	assetStoreMutex sync.RWMutex
)

// HandleGetInventoryItems returns list of inventory items
func HandleGetInventoryItems(c *gin.Context) {
	assetStoreMutex.RLock()
	defer assetStoreMutex.RUnlock()

	items := make([]InventoryItem, 0, len(inventoryStore))
	for _, item := range inventoryStore {
		items = append(items, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   items,
	})
}

// HandleCreateInventoryItem creates or adds a new inventory SKU
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

	assetStoreMutex.Lock()
	inventoryStore[id] = item
	assetStoreMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Inventory item updated successfully",
		"data":    item,
	})
}

// HandleGetEquipment returns list of equipment / printers
func HandleGetEquipment(c *gin.Context) {
	assetStoreMutex.RLock()
	defer assetStoreMutex.RUnlock()

	items := make([]EquipmentItem, 0, len(equipmentStore))
	for _, item := range equipmentStore {
		items = append(items, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   items,
	})
}

// HandleCreateEquipment creates a new printer asset
func HandleCreateEquipment(c *gin.Context) {
	var item EquipmentItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if item.ID == "" {
		item.ID = "PRN-" + time.Now().Format("150405")
	}
	item.UpdatedAt = time.Now().Format(time.RFC3339)

	assetStoreMutex.Lock()
	equipmentStore[item.ID] = item
	assetStoreMutex.Unlock()

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Equipment registered successfully",
		"data":    item,
	})
}

// HandleUpdateEquipment updates an existing printer asset
func HandleUpdateEquipment(c *gin.Context) {
	id := c.Param("id")

	var item EquipmentItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item.ID = id
	item.UpdatedAt = time.Now().Format(time.RFC3339)

	assetStoreMutex.Lock()
	equipmentStore[id] = item
	assetStoreMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Equipment updated successfully",
		"data":    item,
	})
}

// Helper to ensure JSON serialization of maps
func MarshalSpecs(specs map[string]interface{}) (string, error) {
	if len(specs) == 0 {
		return "{}", nil
	}
	bytes, err := json.Marshal(specs)
	return string(bytes), err
}
