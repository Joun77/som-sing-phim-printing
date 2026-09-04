package inventory

import (
	"log"
	"net/http"
	"time"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
)

// GenuineInk represents OEM baseline ink specifications
type GenuineInk struct {
	ID                string    `json:"id"`
	Name              string    `json:"name"`
	Brand             string    `json:"brand"`
	ColorCode         string    `json:"color_code"`
	BaselineVolumeMl  float64   `json:"baseline_volume_ml"`
	StandardPageYield int       `json:"standard_page_yield"`
	UnitCost          float64   `json:"unit_cost"`
	Notes             string    `json:"notes,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// CompatibleInk represents imported/third-party ink linked to genuine baseline
type CompatibleInk struct {
	ID               string    `json:"id"`
	GenuineInkID     string    `json:"genuine_ink_id"`
	Name             string    `json:"name"`
	Brand            string    `json:"brand"`
	ColorCode        string    `json:"color_code"`
	ImportedVolumeMl float64   `json:"imported_volume_ml"`
	UnitCost         float64   `json:"unit_cost"`
	CostPerMl        float64   `json:"cost_per_ml"`
	Supplier         string    `json:"supplier,omitempty"`
	Notes            string    `json:"notes,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// InkYieldAnalytics represents analytics report comparing genuine vs compatible ink
type InkYieldAnalytics struct {
	GenuineInkID       string  `json:"genuine_ink_id"`
	GenuineName        string  `json:"genuine_name"`
	GenuineCostPerMl   float64 `json:"genuine_cost_per_ml"`
	CompatibleName     string  `json:"compatible_name"`
	CompatibleCostPerMl float64 `json:"compatible_cost_per_ml"`
	SavingsPerMl       float64 `json:"savings_per_ml"`
	SavingsPercentage  float64 `json:"savings_percentage"`
	EstimatedPageYield int     `json:"estimated_page_yield"`
}

// AuditLog represents an audit entry for tracking administrative actions
type AuditLog struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	UserName     string    `json:"user_name,omitempty"`
	Action       string    `json:"action"`
	ResourceType string    `json:"resource_type"`
	ResourceID   string    `json:"resource_id,omitempty"`
	OldValues    string    `json:"old_values,omitempty"`
	NewValues    string    `json:"new_values,omitempty"`
	IPAddress    string    `json:"ip_address,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

// InventoryBatch represents a FIFO lot entry with expiration date tracking
type InventoryBatch struct {
	ID           string    `json:"id"`
	SkuID        string    `json:"sku_id"`
	LotNumber    string    `json:"lot_number"`
	Quantity     float64   `json:"quantity"`
	UnitCost     float64   `json:"unit_cost"`
	ExpiryDate   time.Time `json:"expiry_date,omitempty"`
	ReceivedDate time.Time `json:"received_date"`
	Supplier     string    `json:"supplier,omitempty"`
	Notes        string    `json:"notes,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

// HandleGetGenuineInks handles GET /api/admin/inks/genuine
func HandleGetGenuineInks(c *gin.Context) {
	database := db.GetDB()
	if database == nil {
		c.JSON(http.StatusOK, []GenuineInk{})
		return
	}

	rows, err := database.Query(`
		SELECT id, name, brand, color_code, baseline_volume_ml, standard_page_yield, unit_cost, COALESCE(notes, ''), created_at, updated_at 
		FROM genuine_inks ORDER BY created_at DESC
	`)
	if err != nil {
		log.Printf("Query genuine_inks error: %v", err)
		c.JSON(http.StatusOK, []GenuineInk{})
		return
	}
	defer rows.Close()

	items := []GenuineInk{}
	for rows.Next() {
		var item GenuineInk
		if err := rows.Scan(
			&item.ID, &item.Name, &item.Brand, &item.ColorCode,
			&item.BaselineVolumeMl, &item.StandardPageYield, &item.UnitCost,
			&item.Notes, &item.CreatedAt, &item.UpdatedAt,
		); err == nil {
			items = append(items, item)
		}
	}

	if err := rows.Err(); err != nil {
		log.Printf("Genuine inks rows error: %v", err)
	}
	c.JSON(http.StatusOK, items)
}

// HandleGetCompatibleInks handles GET /api/admin/inks/compatible
func HandleGetCompatibleInks(c *gin.Context) {
	database := db.GetDB()
	if database == nil {
		c.JSON(http.StatusOK, []CompatibleInk{})
		return
	}

	rows, err := database.Query(`
		SELECT id, genuine_ink_id, name, brand, color_code, imported_volume_ml, unit_cost, cost_per_ml, COALESCE(supplier, ''), COALESCE(notes, ''), created_at, updated_at 
		FROM compatible_inks ORDER BY created_at DESC
	`)
	if err != nil {
		log.Printf("Query compatible_inks error: %v", err)
		c.JSON(http.StatusOK, []CompatibleInk{})
		return
	}
	defer rows.Close()

	items := []CompatibleInk{}
	for rows.Next() {
		var item CompatibleInk
		if err := rows.Scan(
			&item.ID, &item.GenuineInkID, &item.Name, &item.Brand, &item.ColorCode,
			&item.ImportedVolumeMl, &item.UnitCost, &item.CostPerMl,
			&item.Supplier, &item.Notes, &item.CreatedAt, &item.UpdatedAt,
		); err == nil {
			items = append(items, item)
		}
	}

	if err := rows.Err(); err != nil {
		log.Printf("Compatible inks rows error: %v", err)
	}
	c.JSON(http.StatusOK, items)
}

// HandleGetInkYieldAnalytics handles GET /api/admin/inks/analytics
func HandleGetInkYieldAnalytics(c *gin.Context) {
	database := db.GetDB()
	if database == nil {
		c.JSON(http.StatusOK, []InkYieldAnalytics{})
		return
	}

	query := `
		SELECT 
			g.id AS genuine_ink_id,
			g.name AS genuine_name,
			CASE WHEN g.baseline_volume_ml > 0 THEN g.unit_cost / g.baseline_volume_ml ELSE 0 END AS genuine_cost_per_ml,
			c.name AS compatible_name,
			c.cost_per_ml AS compatible_cost_per_ml,
			CASE WHEN g.baseline_volume_ml > 0 THEN (g.unit_cost / g.baseline_volume_ml) - c.cost_per_ml ELSE 0 END AS savings_per_ml,
			CASE WHEN g.unit_cost > 0 AND g.baseline_volume_ml > 0 THEN 
				(((g.unit_cost / g.baseline_volume_ml) - c.cost_per_ml) / (g.unit_cost / g.baseline_volume_ml)) * 100 
			ELSE 0 END AS savings_percentage,
			CASE WHEN g.baseline_volume_ml > 0 THEN 
				ROUND((c.imported_volume_ml / g.baseline_volume_ml) * g.standard_page_yield)
			ELSE 0 END AS estimated_page_yield
		FROM genuine_inks g
		JOIN compatible_inks c ON c.genuine_ink_id = g.id
	`

	rows, err := database.Query(query)
	if err != nil {
		log.Printf("Query ink analytics error: %v", err)
		c.JSON(http.StatusOK, []InkYieldAnalytics{})
		return
	}
	defer rows.Close()

	analytics := []InkYieldAnalytics{}
	for rows.Next() {
		var item InkYieldAnalytics
		if err := rows.Scan(
			&item.GenuineInkID, &item.GenuineName, &item.GenuineCostPerMl,
			&item.CompatibleName, &item.CompatibleCostPerMl, &item.SavingsPerMl,
			&item.SavingsPercentage, &item.EstimatedPageYield,
		); err == nil {
			analytics = append(analytics, item)
		}
	}

	if err := rows.Err(); err != nil {
		log.Printf("Ink analytics rows error: %v", err)
	}
	c.JSON(http.StatusOK, analytics)
}

// HandleGetInventoryBatches handles GET /api/inventory/batches for FIFO lot tracking
func HandleGetInventoryBatches(c *gin.Context) {
	database := db.GetDB()
	if database == nil {
		c.JSON(http.StatusOK, []InventoryBatch{})
		return
	}

	skuID := c.Query("sku_id")
	query := `
		SELECT id, sku_id, lot_number, quantity, unit_cost, expiry_date, received_date, COALESCE(supplier, ''), COALESCE(notes, ''), created_at
		FROM inventory_batches
	`
	args := []interface{}{}
	if skuID != "" {
		query += " WHERE sku_id = $1"
		args = append(args, skuID)
	}
	query += " ORDER BY expiry_date ASC, received_date ASC"

	rows, err := database.Query(query, args...)
	if err != nil {
		log.Printf("Query inventory_batches error: %v", err)
		c.JSON(http.StatusOK, []InventoryBatch{})
		return
	}
	defer rows.Close()

	batches := []InventoryBatch{}
	for rows.Next() {
		var item InventoryBatch
		if err := rows.Scan(
			&item.ID, &item.SkuID, &item.LotNumber, &item.Quantity, &item.UnitCost,
			&item.ExpiryDate, &item.ReceivedDate, &item.Supplier, &item.Notes, &item.CreatedAt,
		); err == nil {
			batches = append(batches, item)
		}
	}

	if err := rows.Err(); err != nil {
		log.Printf("Inventory batches rows error: %v", err)
	}
	c.JSON(http.StatusOK, batches)
}
