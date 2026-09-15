package settings

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
)

type MachineWearPart struct {
	ID                    string     `json:"id"`
	AssetID               string     `json:"asset_id"`
	PartNameLo            string     `json:"part_name_lo"`
	PartNameEn            string     `json:"part_name_en"`
	PartCategory          string     `json:"part_category"` // drum, fuser, printhead, blade, roller, etc.
	CostPriceLak          float64    `json:"cost_price_lak"`
	ExpectedLifespanUnits int64      `json:"expected_lifespan_units"`
	UnitType              string     `json:"unit_type"` // pages, meters, cuts, books
	CurrentCounter        int64      `json:"current_counter"`
	WearCostPerUnitLak    float64    `json:"wear_cost_per_unit_lak"`
	LastReplacedAt        *time.Time `json:"last_replaced_at,omitempty"`
	IsActive              bool       `json:"is_active"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
}

// HandleGetMachineWearParts returns wear parts for an asset (e.g. /api/v1/equipment/:id/wear-parts)
func HandleGetMachineWearParts(c *gin.Context) {
	assetID := strings.TrimSpace(c.Param("id"))
	if assetID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Asset ID is required"})
		return
	}

	if db.DB == nil {
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data":   []MachineWearPart{},
		})
		return
	}

	rows, err := db.DB.Query(`
		SELECT id, asset_id, part_name_lo, part_name_en, part_category,
		       cost_price_lak, expected_lifespan_units, unit_type, current_counter,
		       last_replaced_at, is_active, created_at, updated_at
		FROM machine_wear_parts
		WHERE asset_id = $1 AND is_active = true
		ORDER BY part_category ASC, created_at ASC
	`, assetID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data":   []MachineWearPart{},
		})
		return
	}
	defer rows.Close()

	var parts []MachineWearPart
	var totalWearCostPerUnit float64

	for rows.Next() {
		var p MachineWearPart
		var lastReplaced sql.NullTime

		if err := rows.Scan(
			&p.ID,
			&p.AssetID,
			&p.PartNameLo,
			&p.PartNameEn,
			&p.PartCategory,
			&p.CostPriceLak,
			&p.ExpectedLifespanUnits,
			&p.UnitType,
			&p.CurrentCounter,
			&lastReplaced,
			&p.IsActive,
			&p.CreatedAt,
			&p.UpdatedAt,
		); err == nil {
			if lastReplaced.Valid {
				p.LastReplacedAt = &lastReplaced.Time
			}
			if p.ExpectedLifespanUnits > 0 {
				p.WearCostPerUnitLak = p.CostPriceLak / float64(p.ExpectedLifespanUnits)
			}
			totalWearCostPerUnit += p.WearCostPerUnitLak
			parts = append(parts, p)
		}
	}

	if err := rows.Err(); err != nil {
		log.Printf("[DB ERROR] Wear parts rows error: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"status":                  "success",
		"data":                    parts,
		"total_wear_cost_per_unit": totalWearCostPerUnit,
	})
}

// HandleCreateMachineWearPart creates a new wear part record for a machine
func HandleCreateMachineWearPart(c *gin.Context) {
	assetID := strings.TrimSpace(c.Param("id"))
	if assetID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Asset ID is required"})
		return
	}

	var req struct {
		PartNameLo            string  `json:"part_name_lo" binding:"required"`
		PartNameEn            string  `json:"part_name_en" binding:"required"`
		PartCategory          string  `json:"part_category" binding:"required"`
		CostPriceLak          float64 `json:"cost_price_lak" binding:"required"`
		ExpectedLifespanUnits int64   `json:"expected_lifespan_units" binding:"required"`
		UnitType              string  `json:"unit_type"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
		return
	}

	unitType := strings.TrimSpace(req.UnitType)
	if unitType == "" {
		unitType = "pages"
	}
	if req.ExpectedLifespanUnits <= 0 {
		req.ExpectedLifespanUnits = 1
	}

	newID := generateUUID()
	now := time.Now()

	if db.DB != nil {
		_, err := db.DB.Exec(`
			INSERT INTO machine_wear_parts (id, asset_id, part_name_lo, part_name_en, part_category, cost_price_lak, expected_lifespan_units, unit_type, current_counter, is_active, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, true, $9, $10)
		`, newID, assetID, req.PartNameLo, req.PartNameEn, req.PartCategory, req.CostPriceLak, req.ExpectedLifespanUnits, unitType, now, now)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save wear part", "details": err.Error()})
			return
		}
	}

	wearPerUnit := req.CostPriceLak / float64(req.ExpectedLifespanUnits)

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Machine wear part created successfully",
		"data": MachineWearPart{
			ID:                    newID,
			AssetID:               assetID,
			PartNameLo:            req.PartNameLo,
			PartNameEn:            req.PartNameEn,
			PartCategory:          req.PartCategory,
			CostPriceLak:          req.CostPriceLak,
			ExpectedLifespanUnits: req.ExpectedLifespanUnits,
			UnitType:              unitType,
			CurrentCounter:        0,
			WearCostPerUnitLak:    wearPerUnit,
			IsActive:              true,
			CreatedAt:             now,
			UpdatedAt:             now,
		},
	})
}

// HandleDeleteMachineWearPart soft deletes a wear part
func HandleDeleteMachineWearPart(c *gin.Context) {
	partID := c.Param("part_id")
	if partID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Part ID is required"})
		return
	}

	if db.DB != nil {
		_, err := db.DB.Exec("UPDATE machine_wear_parts SET is_active = false, updated_at = NOW() WHERE id = $1", partID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete wear part", "details": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Machine wear part deactivated successfully",
	})
}

// InstallPartRequest represents the request to deduct spare part from inventory and reset machine wear counter
type InstallPartRequest struct {
	WearPartID string  `json:"wear_part_id"`
	MaterialID string  `json:"material_id"` // SKU or ID in materials table
	PartName   string  `json:"part_name"`
	Quantity   float64 `json:"quantity"`
	Notes      string  `json:"notes"`
	ReplacedBy string  `json:"replaced_by"`
}

// SparePartInventoryItem represents spare parts in warehouse inventory
type SparePartInventoryItem struct {
	ID                     string                 `json:"id"`
	SKU                    string                 `json:"sku"`
	Name                   string                 `json:"name"`
	Category               string                 `json:"category"`
	StockQty               float64                `json:"stock_qty"`
	Unit                   string                 `json:"unit"`
	CostPrice              float64                `json:"cost_price"`
	AssignedPrinterID      string                 `json:"assigned_printer_id,omitempty"`
	TechnicalSpecs         map[string]interface{} `json:"technical_specs,omitempty"`
	UpdatedAt              string                 `json:"updated_at"`
}

// HandleGetSparePartsInventory returns available spare parts from warehouse materials
func HandleGetSparePartsInventory(c *gin.Context) {
	if db.DB == nil {
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data":   []SparePartInventoryItem{},
		})
		return
	}

	// Try with assigned_printer_id column first
	query := `
		SELECT id, sku, name, category, stock_qty, consumption_unit,
		       cost_per_consumption_unit, COALESCE(assigned_printer_id, ''),
		       technical_specs, updated_at
		FROM materials
		WHERE category ILIKE '%spare%' OR category ILIKE '%part%' OR assigned_printer_id IS NOT NULL
		ORDER BY name ASC
	`
	rows, err := db.DB.Query(query)
	if err != nil {
		// Fallback without assigned_printer_id if column not migrated yet
		queryFallback := `
			SELECT id, sku, name, category, stock_qty, consumption_unit,
			       cost_per_consumption_unit, '',
			       technical_specs, updated_at
			FROM materials
			WHERE category ILIKE '%spare%' OR category ILIKE '%part%'
			ORDER BY name ASC
		`
		rows, err = db.DB.Query(queryFallback)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"status": "success",
				"data":   []SparePartInventoryItem{},
			})
			return
		}
	}
	defer rows.Close()

	var parts []SparePartInventoryItem
	for rows.Next() {
		var item SparePartInventoryItem
		var techJSON []byte
		var updatedAt time.Time

		err := rows.Scan(
			&item.ID,
			&item.SKU,
			&item.Name,
			&item.Category,
			&item.StockQty,
			&item.Unit,
			&item.CostPrice,
			&item.AssignedPrinterID,
			&techJSON,
			&updatedAt,
		)
		if err != nil {
			continue
		}

		item.UpdatedAt = updatedAt.Format(time.RFC3339)
		if len(techJSON) > 0 {
			var specs map[string]interface{}
			if err := json.Unmarshal(techJSON, &specs); err == nil {
				item.TechnicalSpecs = specs
				if item.AssignedPrinterID == "" {
					if assigned, ok := specs["assigned_printer_id"].(string); ok {
						item.AssignedPrinterID = assigned
					}
				}
			}
		}

		parts = append(parts, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   parts,
	})
}

// HandleInstallMachineWearPart handles installing a replacement part on a machine with transactional stock deduction
func HandleInstallMachineWearPart(c *gin.Context) {
	assetID := strings.TrimSpace(c.Param("id"))
	if assetID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Asset ID is required"})
		return
	}

	var req InstallPartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
		return
	}

	qty := req.Quantity
	if qty <= 0 {
		qty = 1
	}
	replacedBy := strings.TrimSpace(req.ReplacedBy)
	if replacedBy == "" {
		replacedBy = "Operator"
	}

	if db.DB != nil {
		tx, err := db.DB.Begin()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to begin transaction", "details": err.Error()})
			return
		}
		defer tx.Rollback()

		// 1. If material_id is provided, verify and deduct stock
		matID := strings.TrimSpace(req.MaterialID)
		if matID != "" {
			var currentStock float64
			err := tx.QueryRow("SELECT stock_qty FROM materials WHERE id = $1 OR sku = $1 FOR UPDATE", matID).Scan(&currentStock)
			if err == nil {
				if currentStock < qty {
					c.JSON(http.StatusBadRequest, gin.H{
						"error":     "Insufficient spare part stock in warehouse",
						"available": currentStock,
						"requested": qty,
					})
					return
				}
				_, err = tx.Exec("UPDATE materials SET stock_qty = stock_qty - $1, updated_at = NOW() WHERE id = $2 OR sku = $2", qty, matID)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deduct inventory stock", "details": err.Error()})
					return
				}
			}
		}

		// 2. Reset machine wear part counter and update last_replaced_at
		now := time.Now()
		var wearPartUUID sql.NullString
		if req.WearPartID != "" {
			_, err = tx.Exec(`
				UPDATE machine_wear_parts
				SET current_counter = 0, last_replaced_at = $1, updated_at = $1
				WHERE id = $2 AND asset_id = $3
			`, now, req.WearPartID, assetID)
			if err == nil {
				wearPartUUID = sql.NullString{String: req.WearPartID, Valid: true}
			}
		} else if req.PartName != "" {
			// Find and update by part name match
			var partIDStr string
			err := tx.QueryRow(`
				SELECT id FROM machine_wear_parts
				WHERE asset_id = $1 AND (part_name_en ILIKE $2 OR part_name_lo ILIKE $2) AND is_active = true
				LIMIT 1
			`, assetID, "%"+req.PartName+"%").Scan(&partIDStr)
			if err == nil && partIDStr != "" {
				_, _ = tx.Exec(`
					UPDATE machine_wear_parts
					SET current_counter = 0, last_replaced_at = $1, updated_at = $1
					WHERE id = $2
				`, now, partIDStr)
				wearPartUUID = sql.NullString{String: partIDStr, Valid: true}
			}
		}

		// 3. Insert replacement log into machine_wear_part_logs if table exists
		logID := generateUUID()
		var wpArg interface{} = nil
		if wearPartUUID.Valid {
			wpArg = wearPartUUID.String
		}
		var matArg interface{} = nil
		if matID != "" {
			matArg = matID
		}

		_, _ = tx.Exec(`
			INSERT INTO machine_wear_part_logs (
				id, wear_part_id, asset_id, material_id, part_name,
				counter_at_replacement, quantity, replaced_by, replacement_reason, replaced_at
			) VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, $9)
		`, logID, wpArg, assetID, matArg, req.PartName, qty, replacedBy, req.Notes, now)

		if err := tx.Commit(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit wear part replacement", "details": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Wear part installed successfully and counter reset to 0",
		"data": gin.H{
			"asset_id":      assetID,
			"part_name":     req.PartName,
			"quantity":      qty,
			"material_id":   req.MaterialID,
			"reset_counter": 0,
			"installed_at":  time.Now().Format(time.RFC3339),
		},
	})
}

