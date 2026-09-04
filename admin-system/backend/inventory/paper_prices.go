package inventory

import (
	"encoding/csv"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

// PaperPriceVersion represents a snapshot version of supplier paper prices
type PaperPriceVersion struct {
	ID            int         `json:"id"`
	SupplierName  string      `json:"supplier_name"`
	EffectiveDate string      `json:"effective_date"`
	VersionCode   string      `json:"version_code"`
	Notes         string      `json:"notes,omitempty"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at"`
	ItemCount     int         `json:"item_count,omitempty"`
	Items         []PaperSpec `json:"items,omitempty"`
}

// PaperSpec represents technical specs and price per ream/sheet for a paper type
type PaperSpec struct {
	ID             int     `json:"id"`
	PaperCode      string  `json:"paper_code"`
	PaperName      string  `json:"paper_name"`
	PaperType      string  `json:"paper_type"`
	GSM            int     `json:"gsm"`
	SheetWidthMM   float64 `json:"sheet_width_mm"`
	SheetHeightMM  float64 `json:"sheet_height_mm"`
	SheetsPerReam  int     `json:"sheets_per_ream"`
	CostPerReam    float64 `json:"cost_per_ream"`
	CostPerSheet   float64 `json:"cost_per_sheet"`
	PriceVersionID int     `json:"price_version_id"`
	IsActive       bool    `json:"is_active"`
}

// In-memory store for paper price versions fallback
var (
	priceVersionsStore = []PaperPriceVersion{
		{
			ID:            1,
			SupplierName:  "Vientiane Paper Supply Co.",
			EffectiveDate: "2026-08-01",
			VersionCode:   "VPS-2026-Q3-V1",
			Notes:         "Initial baseline supplier price sheet",
			CreatedAt:     time.Now().Add(-20 * 24 * time.Hour),
			UpdatedAt:     time.Now().Add(-20 * 24 * time.Hour),
			ItemCount:     3,
			Items: []PaperSpec{
				{ID: 1, PaperCode: "PAP-ART-130", PaperName: "Art Paper 130g", PaperType: "Art Paper", GSM: 130, SheetsPerReam: 500, CostPerReam: 180000, CostPerSheet: 360, PriceVersionID: 1, IsActive: true},
				{ID: 2, PaperCode: "PAP-ART-160", PaperName: "Art Paper 160g", PaperType: "Art Paper", GSM: 160, SheetsPerReam: 500, CostPerReam: 220000, CostPerSheet: 440, PriceVersionID: 1, IsActive: true},
				{ID: 3, PaperCode: "PAP-CRD-350", PaperName: "Art Card 350g", PaperType: "Art Card", GSM: 350, SheetsPerReam: 250, CostPerReam: 275000, CostPerSheet: 1100, PriceVersionID: 1, IsActive: true},
			},
		},
	}
	priceVersionSeq = 2
	paperSpecSeq    = 4
	priceStoreMutex sync.RWMutex
)

// PriceSheetUploadPayload represents JSON or parsed CSV input
type PriceSheetUploadPayload struct {
	SupplierName  string      `json:"supplier_name" binding:"required"`
	EffectiveDate string      `json:"effective_date"`
	VersionCode   string      `json:"version_code"`
	Notes         string      `json:"notes"`
	Items         []PaperSpec `json:"items"`
}

// HandleUploadSupplierPriceSheet parses CSV/Excel or JSON payload and creates a new price sheet version
func HandleUploadSupplierPriceSheet(c *gin.Context) {
	contentType := c.GetHeader("Content-Type")

	var payload PriceSheetUploadPayload

	// Handle multipart/form-data CSV upload
	if strings.Contains(contentType, "multipart/form-data") {
		supplier := c.PostForm("supplier_name")
		effDate := c.PostForm("effective_date")
		vCode := c.PostForm("version_code")
		notes := c.PostForm("notes")

		if supplier == "" {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "supplier_name is required"})
			return
		}

		file, _, err := c.Request.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "File upload required: " + err.Error()})
			return
		}
		defer file.Close()

		reader := csv.NewReader(file)
		// Read CSV rows
		rows, err := reader.ReadAll()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Failed to parse CSV: " + err.Error()})
			return
		}

		var parsedSpecs []PaperSpec
		// Header row skip
		for i, row := range rows {
			if i == 0 || len(row) < 3 {
				continue
			}
			// expected columns: paper_code, paper_name, paper_type, gsm, sheets_per_ream, cost_per_ream, cost_per_sheet
			code := strings.TrimSpace(row[0])
			name := strings.TrimSpace(row[1])
			pType := "Standard Paper"
			if len(row) > 2 && strings.TrimSpace(row[2]) != "" {
				pType = strings.TrimSpace(row[2])
			}
			gsm := 80
			if len(row) > 3 {
				if g, err := strconv.Atoi(strings.TrimSpace(row[3])); err == nil && g > 0 {
					gsm = g
				}
			}
			sheetsPerReam := 500
			if len(row) > 4 {
				if spr, err := strconv.Atoi(strings.TrimSpace(row[4])); err == nil && spr > 0 {
					sheetsPerReam = spr
				}
			}
			costReam := 0.0
			if len(row) > 5 {
				costReam, _ = strconv.ParseFloat(strings.TrimSpace(row[5]), 64)
			}
			costSheet := 0.0
			if len(row) > 6 {
				costSheet, _ = strconv.ParseFloat(strings.TrimSpace(row[6]), 64)
			}
			if costSheet == 0 && costReam > 0 && sheetsPerReam > 0 {
				costSheet = costReam / float64(sheetsPerReam)
			}

			if code != "" && name != "" {
				parsedSpecs = append(parsedSpecs, PaperSpec{
					PaperCode:     code,
					PaperName:     name,
					PaperType:     pType,
					GSM:           gsm,
					SheetsPerReam: sheetsPerReam,
					CostPerReam:   costReam,
					CostPerSheet:  costSheet,
					IsActive:      true,
				})
			}
		}

		payload = PriceSheetUploadPayload{
			SupplierName:  supplier,
			EffectiveDate: effDate,
			VersionCode:   vCode,
			Notes:         notes,
			Items:         parsedSpecs,
		}
	} else {
		// Handle JSON payload
		if err := c.ShouldBindJSON(&payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid payload: " + err.Error()})
			return
		}
	}

	if payload.EffectiveDate == "" {
		payload.EffectiveDate = time.Now().Format("2006-01-02")
	}
	if payload.VersionCode == "" {
		payload.VersionCode = fmt.Sprintf("VER-%s-%d", time.Now().Format("20060102"), time.Now().Unix()%1000)
	}

	// Save to DB or Memory Store
	if db.DB != nil {
		tx, err := db.DB.Begin()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Database transaction error: " + err.Error()})
			return
		}
		defer tx.Rollback()

		var versionID int
		insertVerQuery := `
			INSERT INTO paper_price_versions (supplier_name, effective_date, version_code, notes, created_at, updated_at)
			VALUES ($1, $2, $3, $4, NOW(), NOW())
			RETURNING id
		`
		err = tx.QueryRow(insertVerQuery, payload.SupplierName, payload.EffectiveDate, payload.VersionCode, payload.Notes).Scan(&versionID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to create price version: " + err.Error()})
			return
		}

		insertSpecQuery := `
			INSERT INTO paper_specs (paper_code, paper_name, paper_type, gsm, sheets_per_ream, cost_per_ream, cost_per_sheet, price_version_id, is_active, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
			RETURNING id
		`
		for i := range payload.Items {
			item := &payload.Items[i]
			item.PriceVersionID = versionID
			if item.SheetsPerReam <= 0 {
				item.SheetsPerReam = 500
			}
			if item.CostPerSheet <= 0 && item.CostPerReam > 0 {
				item.CostPerSheet = item.CostPerReam / float64(item.SheetsPerReam)
			}
			dReam := decimal.NewFromFloat(item.CostPerReam)
			dSheet := decimal.NewFromFloat(item.CostPerSheet)

			var specID int
			err = tx.QueryRow(insertSpecQuery, item.PaperCode, item.PaperName, item.PaperType, item.GSM, item.SheetsPerReam, dReam, dSheet, versionID).Scan(&specID)
			if err != nil {
				log.Printf("[PRICE VERSION ERROR] Failed to insert spec %s: %v", item.PaperCode, err)
			} else {
				item.ID = specID
			}
		}

		if err := tx.Commit(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to commit transaction: " + err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"status":       "success",
			"message":      "Supplier paper price sheet version created and applied successfully",
			"version_id":   versionID,
			"version_code": payload.VersionCode,
			"item_count":   len(payload.Items),
			"data":         payload,
		})
		return
	}

	// In-memory fallback
	priceStoreMutex.Lock()
	vID := priceVersionSeq
	priceVersionSeq++

	for i := range payload.Items {
		payload.Items[i].ID = paperSpecSeq
		payload.Items[i].PriceVersionID = vID
		if payload.Items[i].CostPerSheet <= 0 && payload.Items[i].CostPerReam > 0 {
			payload.Items[i].CostPerSheet = payload.Items[i].CostPerReam / 500.0
		}
		paperSpecSeq++
	}

	newVersion := PaperPriceVersion{
		ID:            vID,
		SupplierName:  payload.SupplierName,
		EffectiveDate: payload.EffectiveDate,
		VersionCode:   payload.VersionCode,
		Notes:         payload.Notes,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
		ItemCount:     len(payload.Items),
		Items:         payload.Items,
	}
	priceVersionsStore = append([]PaperPriceVersion{newVersion}, priceVersionsStore...)
	priceStoreMutex.Unlock()

	c.JSON(http.StatusCreated, gin.H{
		"status":       "success",
		"message":      "Supplier paper price sheet version created in fallback mode",
		"version_id":   vID,
		"version_code": payload.VersionCode,
		"item_count":   len(payload.Items),
		"data":         newVersion,
	})
}

// HandleGetPaperPriceVersions returns the list of all historical supplier price sheets
func HandleGetPaperPriceVersions(c *gin.Context) {
	if db.DB != nil {
		query := `
			SELECT v.id, v.supplier_name, v.effective_date::text, v.version_code, COALESCE(v.notes, ''),
			       v.created_at, v.updated_at, COUNT(s.id) as item_count
			FROM paper_price_versions v
			LEFT JOIN paper_specs s ON s.price_version_id = v.id
			GROUP BY v.id, v.supplier_name, v.effective_date, v.version_code, v.notes, v.created_at, v.updated_at
			ORDER BY v.effective_date DESC, v.created_at DESC
		`
		rows, err := db.DB.Query(query)
		if err == nil {
			defer rows.Close()
			var list []PaperPriceVersion
			for rows.Next() {
				var ver PaperPriceVersion
				_ = rows.Scan(&ver.ID, &ver.SupplierName, &ver.EffectiveDate, &ver.VersionCode, &ver.Notes, &ver.CreatedAt, &ver.UpdatedAt, &ver.ItemCount)
				list = append(list, ver)
			}
			if err := rows.Err(); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to iterate paper price versions: " + err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
			return
		}
	}

	priceStoreMutex.RLock()
	defer priceStoreMutex.RUnlock()
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": priceVersionsStore})
}

// HandleGetLatestPaperPrices returns active paper prices from the latest effective version
func HandleGetLatestPaperPrices(c *gin.Context) {
	if db.DB != nil {
		query := `
			SELECT DISTINCT ON (s.paper_code)
			       s.id, s.paper_code, s.paper_name, s.paper_type, s.gsm, 
			       COALESCE(s.sheets_per_ream, 500), s.cost_per_ream, s.cost_per_sheet, 
			       s.price_version_id, s.is_active, v.version_code, v.effective_date::text
			FROM paper_specs s
			JOIN paper_price_versions v ON v.id = s.price_version_id
			WHERE v.effective_date <= CURRENT_DATE AND s.is_active = true
			ORDER BY s.paper_code, v.effective_date DESC, v.created_at DESC
		`
		rows, err := db.DB.Query(query)
		if err == nil {
			defer rows.Close()
			var specs []gin.H
			for rows.Next() {
				var id, gsm, spr, verID int
				var pCode, pName, pType, vCode, effDate string
				var cReam, cSheet float64
				var active bool
				_ = rows.Scan(&id, &pCode, &pName, &pType, &gsm, &spr, &cReam, &cSheet, &verID, &active, &vCode, &effDate)
				specs = append(specs, gin.H{
					"id":               id,
					"paper_code":       pCode,
					"paper_name":       pName,
					"paper_type":       pType,
					"gsm":              gsm,
					"sheets_per_ream":  spr,
					"cost_per_ream":    cReam,
					"cost_per_sheet":   cSheet,
					"price_version_id": verID,
					"version_code":     vCode,
					"effective_date":   effDate,
				})
			}
			if err := rows.Err(); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to iterate paper specs: " + err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": specs})
			return
		}
	}

	priceStoreMutex.RLock()
	defer priceStoreMutex.RUnlock()
	if len(priceVersionsStore) > 0 {
		c.JSON(http.StatusOK, gin.H{"status": "success", "data": priceVersionsStore[0].Items})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": []PaperSpec{}})
}
