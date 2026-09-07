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
	if db.DB == nil {
		c.JSON(http.StatusOK, gin.H{"status": "success", "data": getFallbackPresets()})
		return
	}

	rows, err := db.DB.Query(`
		SELECT id, name, category, unit, width, height, width_mm, height_mm, is_default, created_at, updated_at
		FROM print_dimension_presets
		ORDER BY is_default DESC, width_mm ASC, name ASC
	`)
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

// HandleDeleteDimensionPreset deletes a preset by ID
func HandleDeleteDimensionPreset(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Preset ID is required"})
		return
	}

	if db.DB != nil {
		_, err := db.DB.Exec("DELETE FROM print_dimension_presets WHERE id = $1", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete preset", "details": err.Error()})
			return
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
		{ID: "preset-4x6", Name: "4x6\" (A6)", Category: "PHOTO", Unit: "INCH", Width: 4, Height: 6, WidthMM: 101.6, HeightMM: 152.4, IsDefault: true},
		{ID: "preset-5x7", Name: "5x7\" (Photo)", Category: "PHOTO", Unit: "INCH", Width: 5, Height: 7, WidthMM: 127.0, HeightMM: 177.8, IsDefault: false},
		{ID: "preset-3x4", Name: "3x4\" (Pocket)", Category: "PHOTO", Unit: "INCH", Width: 3, Height: 4, WidthMM: 76.2, HeightMM: 101.6, IsDefault: false},
		{ID: "preset-2x3", Name: "2x3\" (Polaroid)", Category: "PHOTO", Unit: "INCH", Width: 2, Height: 3, WidthMM: 50.8, HeightMM: 76.2, IsDefault: false},
		{ID: "preset-8x10", Name: "8x10\" (Portrait)", Category: "PHOTO", Unit: "INCH", Width: 8, Height: 10, WidthMM: 203.2, HeightMM: 254.0, IsDefault: false},
		{ID: "preset-a4", Name: "8x12\" (A4 Full)", Category: "PHOTO", Unit: "INCH", Width: 8.27, Height: 11.69, WidthMM: 210.0, HeightMM: 297.0, IsDefault: false},
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
