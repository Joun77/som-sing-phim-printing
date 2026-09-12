package settings

import (
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"crypto/rand"
	"net/http"
	"time"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
)

type DimensionPreset struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Category  string    `json:"category"`
	Unit      string    `json:"unit"`
	Width     float64   `json:"width"`
	Height    float64   `json:"height"`
	WidthMM   float64   `json:"width_mm"`
	HeightMM  float64   `json:"height_mm"`
	IsDefault bool      `json:"is_default"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// HandleGetDimensionPresets returns all print dimension presets from DB
func HandleGetDimensionPresets(c *gin.Context) {
	category := c.Query("category")

	if db.DB == nil {
		all := getFallbackPresets()
		if category != "" && category != "ALL" {
			var filtered []DimensionPreset
			for _, p := range all {
				if p.Category == category {
					filtered = append(filtered, p)
				}
			}
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": filtered})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "success", "data": all})
		return
	}

	var query string
	var args []interface{}

	if category != "" && category != "ALL" {
		query = `
			SELECT id, name, category, unit, width, height, width_mm, height_mm, is_default, created_at, updated_at
			FROM print_dimension_presets
			WHERE category = $1
			ORDER BY is_default DESC, width_mm ASC, name ASC
		`
		args = append(args, category)
	} else {
		query = `
			SELECT id, name, category, unit, width, height, width_mm, height_mm, is_default, created_at, updated_at
			FROM print_dimension_presets
			ORDER BY 
				CASE category
					WHEN 'DOCUMENT' THEN 1
					WHEN 'PHOTO' THEN 2
					WHEN 'CARD' THEN 3
					WHEN 'STICKER' THEN 4
					ELSE 5
				END,
				is_default DESC, 
				width_mm ASC, 
				name ASC
		`
	}

	rows, err := db.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"status": "success", "data": getFallbackPresets()})
		return
	}
	defer rows.Close()

	var presets []DimensionPreset
	for rows.Next() {
		var p DimensionPreset
		if err := rows.Scan(&p.ID, &p.Name, &p.Category, &p.Unit, &p.Width, &p.Height, &p.WidthMM, &p.HeightMM, &p.IsDefault, &p.CreatedAt, &p.UpdatedAt); err == nil {
			presets = append(presets, p)
		}
	}

	if len(presets) == 0 {
		presets = getFallbackPresets()
		if category != "" && category != "ALL" {
			var filtered []DimensionPreset
			for _, p := range presets {
				if p.Category == category {
					filtered = append(filtered, p)
				}
			}
			presets = filtered
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": presets})
}

// HandleCreateDimensionPreset saves a new custom preset into the database
func HandleCreateDimensionPreset(c *gin.Context) {
	var req struct {
		Name      string  `json:"name" binding:"required"`
		Category  string  `json:"category"`
		Unit      string  `json:"unit"`
		Width     float64 `json:"width" binding:"required"`
		Height    float64 `json:"height" binding:"required"`
		WidthMM   float64 `json:"width_mm"`
		HeightMM  float64 `json:"height_mm"`
		IsDefault bool    `json:"is_default"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
		return
	}

	if req.Category == "" {
		req.Category = "PHOTO"
	}
	if req.Unit == "" {
		req.Unit = "INCH"
	}

	// Calculate width_mm and height_mm if not supplied
	wMM := req.WidthMM
	hMM := req.HeightMM
	if wMM <= 0 || hMM <= 0 {
		switch req.Unit {
		case "INCH":
			wMM = req.Width * 25.4
			hMM = req.Height * 25.4
		case "CM":
			wMM = req.Width * 10.0
			hMM = req.Height * 10.0
		default:
			wMM = req.Width
			hMM = req.Height
		}
	}

	newID := generateUUID()
	now := time.Now()

	if db.DB != nil {
		_, err := db.DB.Exec(`
			INSERT INTO print_dimension_presets (id, name, category, unit, width, height, width_mm, height_mm, is_default, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		`, newID, req.Name, req.Category, req.Unit, req.Width, req.Height, wMM, hMM, req.IsDefault, now, now)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save preset to database", "details": err.Error()})
			return
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"status": "success",
		"message": "Preset saved successfully",
		"data": DimensionPreset{
			ID:        newID,
			Name:      req.Name,
			Category:  req.Category,
			Unit:      req.Unit,
			Width:     req.Width,
			Height:    req.Height,
			WidthMM:   wMM,
			HeightMM:  hMM,
			IsDefault: req.IsDefault,
			CreatedAt: now,
			UpdatedAt: now,
		},
	})
}

// HandleDeleteDimensionPreset deletes a preset by ID (custom presets only)
func HandleDeleteDimensionPreset(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Preset ID is required"})
		return
	}

	if db.DB != nil {
		res, err := db.DB.Exec("DELETE FROM print_dimension_presets WHERE id = $1 AND is_default = FALSE", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete preset", "details": err.Error()})
			return
		}
		rowsAffected, _ := res.RowsAffected()
		if rowsAffected == 0 {
			// Check if it's default
			var isDef bool
			errDef := db.DB.QueryRow("SELECT is_default FROM print_dimension_presets WHERE id = $1", id).Scan(&isDef)
			if errDef == nil && isDef {
				c.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete default master data preset"})
				return
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Preset deleted successfully"})
}

// HandleGetShopDefaults retrieves shop default configurations (e.g. default paper)
func HandleGetShopDefaults(c *gin.Context) {
	key := c.DefaultQuery("key", "default_paper_config")

	if db.DB == nil {
		c.JSON(http.StatusOK, gin.H{"status": "success", "data": gin.H{}})
		return
	}

	var valJSON string
	err := db.DB.QueryRow("SELECT value::text FROM shop_defaults WHERE key = $1", key).Scan(&valJSON)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": nil})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error", "details": err.Error()})
		return
	}

	var parsed interface{}
	_ = json.Unmarshal([]byte(valJSON), &parsed)
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": parsed})
}

// HandleSetShopDefaults saves shop default configurations
func HandleSetShopDefaults(c *gin.Context) {
	var req struct {
		Key   string          `json:"key" binding:"required"`
		Value json.RawMessage `json:"value" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
		return
	}

	if db.DB != nil {
		_, err := db.DB.Exec(`
			INSERT INTO shop_defaults (key, value, updated_at)
			VALUES ($1, $2, NOW())
			ON CONFLICT (key) DO UPDATE
			SET value = EXCLUDED.value, updated_at = NOW()
		`, req.Key, string(req.Value))

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save default settings", "details": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Default settings saved successfully"})
}

func getFallbackPresets() []DimensionPreset {
	return []DimensionPreset{
		// Documents (ເອກະສານ)
		{ID: "preset-doc-a4", Name: "A4 (210x297)", Category: "DOCUMENT", Unit: "MM", Width: 210, Height: 297, WidthMM: 210.0, HeightMM: 297.0, IsDefault: true},
		{ID: "preset-doc-a3", Name: "A3 (297x420)", Category: "DOCUMENT", Unit: "MM", Width: 297, Height: 420, WidthMM: 297.0, HeightMM: 420.0, IsDefault: true},
		{ID: "preset-doc-a5", Name: "A5 (148x210)", Category: "DOCUMENT", Unit: "MM", Width: 148, Height: 210, WidthMM: 148.0, HeightMM: 210.0, IsDefault: true},
		{ID: "preset-doc-a6", Name: "A6 (105x148)", Category: "DOCUMENT", Unit: "MM", Width: 105, Height: 148, WidthMM: 105.0, HeightMM: 148.0, IsDefault: true},
		{ID: "preset-doc-b5", Name: "B5 (176x250)", Category: "DOCUMENT", Unit: "MM", Width: 176, Height: 250, WidthMM: 176.0, HeightMM: 250.0, IsDefault: true},
		{ID: "preset-doc-letter", Name: "Letter (8.5x11\")", Category: "DOCUMENT", Unit: "INCH", Width: 8.5, Height: 11, WidthMM: 215.9, HeightMM: 279.4, IsDefault: true},
		{ID: "preset-doc-f4", Name: "Folio / F4 (8.5x13\")", Category: "DOCUMENT", Unit: "INCH", Width: 8.5, Height: 13, WidthMM: 215.9, HeightMM: 330.2, IsDefault: true},

		// Photos (ຮູບພາບ)
		{ID: "preset-photo-4x6", Name: "4x6\" (4R / Postcard)", Category: "PHOTO", Unit: "INCH", Width: 4, Height: 6, WidthMM: 101.6, HeightMM: 152.4, IsDefault: true},
		{ID: "preset-photo-5x7", Name: "5x7\" (5R / Desk Frame)", Category: "PHOTO", Unit: "INCH", Width: 5, Height: 7, WidthMM: 127.0, HeightMM: 177.8, IsDefault: true},
		{ID: "preset-photo-6x8", Name: "6x8\" (6R)", Category: "PHOTO", Unit: "INCH", Width: 6, Height: 8, WidthMM: 152.4, HeightMM: 203.2, IsDefault: true},
		{ID: "preset-photo-8x10", Name: "8x10\" (8R / Portrait)", Category: "PHOTO", Unit: "INCH", Width: 8, Height: 10, WidthMM: 203.2, HeightMM: 254.0, IsDefault: true},
		{ID: "preset-photo-8x12", Name: "8x12\" (A4 Full Photo)", Category: "PHOTO", Unit: "INCH", Width: 8.27, Height: 11.69, WidthMM: 210.0, HeightMM: 297.0, IsDefault: true},
		{ID: "preset-photo-3x4", Name: "3x4\" (Pocket / ກະເປົາ)", Category: "PHOTO", Unit: "INCH", Width: 3, Height: 4, WidthMM: 76.2, HeightMM: 101.6, IsDefault: true},
		{ID: "preset-photo-2x3", Name: "2x3\" (Polaroid / ຕິດບັດ)", Category: "PHOTO", Unit: "INCH", Width: 2, Height: 3, WidthMM: 50.8, HeightMM: 76.2, IsDefault: true},
		{ID: "preset-photo-12x18", Name: "12x18\" (A3+ Photo)", Category: "PHOTO", Unit: "INCH", Width: 12, Height: 18, WidthMM: 304.8, HeightMM: 457.2, IsDefault: true},

		// Cards & Invitations (ນາມບັດ & ກາດ)
		{ID: "preset-card-std", Name: "ນາມບັດມາດຕະຖານ (90x54mm)", Category: "CARD", Unit: "MM", Width: 90, Height: 54, WidthMM: 90.0, HeightMM: 54.0, IsDefault: true},
		{ID: "preset-card-slim", Name: "ນາມບັດ Slim (90x50mm)", Category: "CARD", Unit: "MM", Width: 90, Height: 50, WidthMM: 90.0, HeightMM: 50.0, IsDefault: true},
		{ID: "preset-card-inv", Name: "ກາດເຊີນ 4x6\" (Invitation)", Category: "CARD", Unit: "INCH", Width: 4, Height: 6, WidthMM: 101.6, HeightMM: 152.4, IsDefault: true},
		{ID: "preset-card-wed", Name: "ກາດແຕ່ງງານ 5x7\" (Wedding)", Category: "CARD", Unit: "INCH", Width: 5, Height: 7, WidthMM: 127.0, HeightMM: 177.8, IsDefault: true},

		// Stickers & Labels (ສະຕິກເກີ)
		{ID: "preset-stk-a3plus", Name: "ແຜ່ນ A3+ (329x483mm)", Category: "STICKER", Unit: "MM", Width: 329, Height: 483, WidthMM: 329.0, HeightMM: 483.0, IsDefault: true},
		{ID: "preset-stk-a4", Name: "ແຜ່ນ A4 (210x297mm)", Category: "STICKER", Unit: "MM", Width: 210, Height: 297, WidthMM: 210.0, HeightMM: 297.0, IsDefault: true},
		{ID: "preset-stk-3x3", Name: "ດວງມົນ 3x3 cm", Category: "STICKER", Unit: "CM", Width: 3, Height: 3, WidthMM: 30.0, HeightMM: 30.0, IsDefault: true},
		{ID: "preset-stk-4x4", Name: "ດວງມົນ 4x4 cm", Category: "STICKER", Unit: "CM", Width: 4, Height: 4, WidthMM: 40.0, HeightMM: 40.0, IsDefault: true},
		{ID: "preset-stk-5x5", Name: "ດວງມົນ 5x5 cm", Category: "STICKER", Unit: "CM", Width: 5, Height: 5, WidthMM: 50.0, HeightMM: 50.0, IsDefault: true},
	}
}

func generateUUID() string {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		return time.Now().Format("20060102150405.000000000")
	}
	b[6] = (b[6] & 0x0f) | 0x40 // version 4
	b[8] = (b[8] & 0x3f) | 0x80 // variant RFC 4122
	return hex.EncodeToString(b[0:4]) + "-" +
		hex.EncodeToString(b[4:6]) + "-" +
		hex.EncodeToString(b[6:8]) + "-" +
		hex.EncodeToString(b[8:10]) + "-" +
		hex.EncodeToString(b[10:16])
}
