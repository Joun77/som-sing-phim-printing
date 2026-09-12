package settings

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
)

type SystemLookup struct {
	ID         string          `json:"id"`
	LookupType string          `json:"lookup_type"`
	Code       string          `json:"code"`
	NameLo     string          `json:"name_lo"`
	NameEn     string          `json:"name_en"`
	NameTh     *string         `json:"name_th,omitempty"`
	Attributes json.RawMessage `json:"attributes"`
	SortOrder  int             `json:"sort_order"`
	IsActive   bool            `json:"is_active"`
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`
}

// HandleGetLookups returns all system lookups, optionally filtered by ?type=... and ?active_only=true
func HandleGetLookups(c *gin.Context) {
	lookupType := strings.TrimSpace(c.Query("type"))
	activeOnly := c.DefaultQuery("active_only", "false") == "true"

	if db.DB == nil {
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data":   getFallbackLookups(lookupType),
		})
		return
	}

	query := `
		SELECT id, lookup_type, code, name_lo, name_en, name_th, attributes, sort_order, is_active, created_at, updated_at
		FROM system_lookups
		WHERE 1=1
	`
	var args []interface{}
	argIdx := 1

	if lookupType != "" {
		query += ` AND lookup_type = $` + string(rune('0'+argIdx))
		args = append(args, lookupType)
		argIdx++
	}
	if activeOnly {
		query += ` AND is_active = true`
	}
	query += ` ORDER BY sort_order ASC, code ASC`

	rows, err := db.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data":   getFallbackLookups(lookupType),
		})
		return
	}
	defer rows.Close()

	var list []SystemLookup
	for rows.Next() {
		var item SystemLookup
		var rawAttr []byte
		var nameTh sql.NullString

		if err := rows.Scan(
			&item.ID,
			&item.LookupType,
			&item.Code,
			&item.NameLo,
			&item.NameEn,
			&nameTh,
			&rawAttr,
			&item.SortOrder,
			&item.IsActive,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err == nil {
			if nameTh.Valid {
				item.NameTh = &nameTh.String
			}
			if len(rawAttr) > 0 {
				item.Attributes = json.RawMessage(rawAttr)
			} else {
				item.Attributes = json.RawMessage("{}")
			}
			list = append(list, item)
		}
	}

	if len(list) == 0 {
		list = getFallbackLookups(lookupType)
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   list,
	})
}

// HandleGetLookupsByType returns lookups for a specific type (e.g. /api/v1/lookups/paper_type)
func HandleGetLookupsByType(c *gin.Context) {
	lookupType := strings.TrimSpace(c.Param("type"))
	if lookupType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lookup type is required"})
		return
	}

	if db.DB == nil {
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data":   getFallbackLookups(lookupType),
		})
		return
	}

	rows, err := db.DB.Query(`
		SELECT id, lookup_type, code, name_lo, name_en, name_th, attributes, sort_order, is_active, created_at, updated_at
		FROM system_lookups
		WHERE lookup_type = $1 AND is_active = true
		ORDER BY sort_order ASC, code ASC
	`, lookupType)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data":   getFallbackLookups(lookupType),
		})
		return
	}
	defer rows.Close()

	var list []SystemLookup
	for rows.Next() {
		var item SystemLookup
		var rawAttr []byte
		var nameTh sql.NullString

		if err := rows.Scan(
			&item.ID,
			&item.LookupType,
			&item.Code,
			&item.NameLo,
			&item.NameEn,
			&nameTh,
			&rawAttr,
			&item.SortOrder,
			&item.IsActive,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err == nil {
			if nameTh.Valid {
				item.NameTh = &nameTh.String
			}
			if len(rawAttr) > 0 {
				item.Attributes = json.RawMessage(rawAttr)
			} else {
				item.Attributes = json.RawMessage("{}")
			}
			list = append(list, item)
		}
	}

	if len(list) == 0 {
		list = getFallbackLookups(lookupType)
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   list,
	})
}

// HandleCreateLookup adds a new master lookup record
func HandleCreateLookup(c *gin.Context) {
	var req struct {
		LookupType string          `json:"lookup_type" binding:"required"`
		Code       string          `json:"code" binding:"required"`
		NameLo     string          `json:"name_lo" binding:"required"`
		NameEn     string          `json:"name_en" binding:"required"`
		NameTh     *string         `json:"name_th"`
		Attributes json.RawMessage `json:"attributes"`
		SortOrder  int             `json:"sort_order"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
		return
	}

	code := strings.ToUpper(strings.TrimSpace(req.Code))
	lookupType := strings.ToLower(strings.TrimSpace(req.LookupType))
	attrStr := "{}"
	if len(req.Attributes) > 0 && strings.TrimSpace(string(req.Attributes)) != "" {
		attrStr = string(req.Attributes)
	}

	newID := generateUUID()
	now := time.Now()

	if db.DB != nil {
		_, err := db.DB.Exec(`
			INSERT INTO system_lookups (id, lookup_type, code, name_lo, name_en, name_th, attributes, sort_order, is_active, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10)
		`, newID, lookupType, code, req.NameLo, req.NameEn, req.NameTh, attrStr, req.SortOrder, now, now)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create lookup", "details": err.Error()})
			return
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Lookup created successfully",
		"data": SystemLookup{
			ID:         newID,
			LookupType: lookupType,
			Code:       code,
			NameLo:     req.NameLo,
			NameEn:     req.NameEn,
			NameTh:     req.NameTh,
			Attributes: json.RawMessage(attrStr),
			SortOrder:  req.SortOrder,
			IsActive:   true,
			CreatedAt:  now,
			UpdatedAt:  now,
		},
	})
}

// HandleUpdateLookup updates an existing lookup record
func HandleUpdateLookup(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lookup ID is required"})
		return
	}

	var req struct {
		NameLo     *string         `json:"name_lo"`
		NameEn     *string         `json:"name_en"`
		NameTh     *string         `json:"name_th"`
		Attributes json.RawMessage `json:"attributes"`
		SortOrder  *int            `json:"sort_order"`
		IsActive   *bool           `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
		return
	}

	if db.DB != nil {
		query := `UPDATE system_lookups SET updated_at = NOW()`
		var args []interface{}
		argIdx := 1

		if req.NameLo != nil {
			query += `, name_lo = $` + string(rune('0'+argIdx))
			args = append(args, *req.NameLo)
			argIdx++
		}
		if req.NameEn != nil {
			query += `, name_en = $` + string(rune('0'+argIdx))
			args = append(args, *req.NameEn)
			argIdx++
		}
		if req.NameTh != nil {
			query += `, name_th = $` + string(rune('0'+argIdx))
			args = append(args, *req.NameTh)
			argIdx++
		}
		if len(req.Attributes) > 0 {
			query += `, attributes = $` + string(rune('0'+argIdx))
			args = append(args, string(req.Attributes))
			argIdx++
		}
		if req.SortOrder != nil {
			query += `, sort_order = $` + string(rune('0'+argIdx))
			args = append(args, *req.SortOrder)
			argIdx++
		}
		if req.IsActive != nil {
			query += `, is_active = $` + string(rune('0'+argIdx))
			args = append(args, *req.IsActive)
			argIdx++
		}

		query += ` WHERE id = $` + string(rune('0'+argIdx))
		args = append(args, id)

		_, err := db.DB.Exec(query, args...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update lookup", "details": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Lookup updated successfully",
	})
}

// HandleDeleteLookup soft-deletes a lookup by setting is_active = false
func HandleDeleteLookup(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lookup ID is required"})
		return
	}

	if db.DB != nil {
		_, err := db.DB.Exec("UPDATE system_lookups SET is_active = false, updated_at = NOW() WHERE id = $1", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deactivate lookup", "details": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Lookup deactivated successfully",
	})
}

// getFallbackLookups provides safe defaults if database is unreachable or pre-migration
func getFallbackLookups(lookupType string) []SystemLookup {
	all := []SystemLookup{
		// Paper Types
		{ID: "p-plain", LookupType: "paper_type", Code: "PLAIN", NameLo: "ເຈ້ຍປອນ / ເຈ້ຍຖ່າຍເອກະສານ", NameEn: "Standard Bond / Woodfree Paper", Attributes: json.RawMessage(`{"default_gsm":[70,80,100,120]}`), SortOrder: 10, IsActive: true},
		{ID: "p-art", LookupType: "paper_type", Code: "ART_PAPER", NameLo: "ເຈ້ຍອາດເງົາ/ດ້ານ (Art Paper)", NameEn: "Gloss / Matte Art Paper", Attributes: json.RawMessage(`{"default_gsm":[105,130,160]}`), SortOrder: 20, IsActive: true},
		{ID: "p-card", LookupType: "paper_type", Code: "ART_CARD", NameLo: "ເຈ້ຍອາດກາດ 2 ໜ້າ (Art Card)", NameEn: "Double-Sided Coated Art Card", Attributes: json.RawMessage(`{"default_gsm":[210,260,300,350]}`), SortOrder: 30, IsActive: true},
		{ID: "p-kraft", LookupType: "paper_type", Code: "KRAFT", NameLo: "ເຈ້ຍຄຣາຟສີນ້ຳຕານ (Eco Kraft)", NameEn: "Eco Brown Kraft Paper", Attributes: json.RawMessage(`{"default_gsm":[125,175,250,300]}`), SortOrder: 40, IsActive: true},
		{ID: "p-greyboard", LookupType: "paper_type", Code: "GREYBOARD", NameLo: "ກະດາດຈົ່ວປັງ (ແກນປົກແຂງ)", NameEn: "Greyboard / Strawboard", Attributes: json.RawMessage(`{"thickness_mm":[1.5,2.0,2.5,3.0]}`), SortOrder: 50, IsActive: true},
		{ID: "p-sticker-pp", LookupType: "paper_type", Code: "STICKER_PP", NameLo: "ສະຕິກເກີ PP Vinyl (ກັນນ້ຳ 100%)", NameEn: "Waterproof PP Synthetic Sticker", Attributes: json.RawMessage(`{"is_waterproof":true}`), SortOrder: 60, IsActive: true},

		// Surface Finishes
		{ID: "s-none", LookupType: "surface_finish", Code: "NONE", NameLo: "ບໍ່ເຄືອບ (Uncoated)", NameEn: "Uncoated Natural Surface", Attributes: json.RawMessage(`{}`), SortOrder: 10, IsActive: true},
		{ID: "s-gloss", LookupType: "surface_finish", Code: "GLOSS_PVC", NameLo: "ເຄືອບ PVC ເງົາ (Glossy)", NameEn: "Gloss Thermal / Cold Lamination", Attributes: json.RawMessage(`{"thickness_micron":25}`), SortOrder: 20, IsActive: true},
		{ID: "s-matte", LookupType: "surface_finish", Code: "MATTE_PVC", NameLo: "ເຄືອບ PVC ດ້ານ (Matte)", NameEn: "Matte Thermal / Cold Lamination", Attributes: json.RawMessage(`{"thickness_micron":25}`), SortOrder: 30, IsActive: true},
		{ID: "s-soft", LookupType: "surface_finish", Code: "SOFT_TOUCH", NameLo: "ເຄືອບກຳມະຫຍີ່ Soft-Touch (Velvet)", NameEn: "Velvet Soft-Touch Luxury Finish", Attributes: json.RawMessage(`{"thickness_micron":32}`), SortOrder: 40, IsActive: true},
		{ID: "s-uv", LookupType: "surface_finish", Code: "SPOT_UV_3D", NameLo: "ເຄືອບ Spot UV 3D ນູນ", NameEn: "Raised 3D Spot UV Varnish", Attributes: json.RawMessage(`{}`), SortOrder: 50, IsActive: true},

		// Standard Dimensions
		{ID: "d-a4", LookupType: "standard_dimension", Code: "A4", NameLo: "A4 (210 x 297 mm)", NameEn: "A4 Standard Sheet", Attributes: json.RawMessage(`{"width_mm":210.0,"height_mm":297.0,"category":"cut_sheet"}`), SortOrder: 10, IsActive: true},
		{ID: "d-a3", LookupType: "standard_dimension", Code: "A3", NameLo: "A3 (297 x 420 mm)", NameEn: "A3 Sheet", Attributes: json.RawMessage(`{"width_mm":297.0,"height_mm":420.0,"category":"cut_sheet"}`), SortOrder: 20, IsActive: true},
		{ID: "d-a3p", LookupType: "standard_dimension", Code: "A3_PLUS", NameLo: "A3+ (329 x 483 mm)", NameEn: "A3+ Super Sheet", Attributes: json.RawMessage(`{"width_mm":329.0,"height_mm":483.0,"category":"cut_sheet"}`), SortOrder: 30, IsActive: true},
		{ID: "d-sra3", LookupType: "standard_dimension", Code: "SRA3", NameLo: "SRA3 (320 x 450 mm)", NameEn: "SRA3 Digital Press Sheet", Attributes: json.RawMessage(`{"width_mm":320.0,"height_mm":450.0,"category":"cut_sheet"}`), SortOrder: 40, IsActive: true},
		{ID: "d-p3143", LookupType: "standard_dimension", Code: "PARENT_31X43", NameLo: "ແຜ່ນໃຫຍ່ 31 x 43 ນິ້ວ", NameEn: "Parent Sheet 31x43 Inch", Attributes: json.RawMessage(`{"width_mm":787.0,"height_mm":1092.0,"category":"parent_sheet"}`), SortOrder: 50, IsActive: true},

		// Units of Measure
		{ID: "u-sheet", LookupType: "unit_of_measure", Code: "SHEET", NameLo: "ແຜ່ນ", NameEn: "Sheet", Attributes: json.RawMessage(`{"base_unit":"SHEET","multiplier":1}`), SortOrder: 10, IsActive: true},
		{ID: "u-ream", LookupType: "unit_of_measure", Code: "REAM", NameLo: "ຣີມ (500 ແຜ່ນ)", NameEn: "Ream (500 Sheets)", Attributes: json.RawMessage(`{"base_unit":"SHEET","multiplier":500}`), SortOrder: 20, IsActive: true},
		{ID: "u-roll", LookupType: "unit_of_measure", Code: "ROLL", NameLo: "ມ້ວນ", NameEn: "Roll", Attributes: json.RawMessage(`{"base_unit":"METER","multiplier":50}`), SortOrder: 30, IsActive: true},
		{ID: "u-meter", LookupType: "unit_of_measure", Code: "METER", NameLo: "ແມັດ", NameEn: "Linear Meter", Attributes: json.RawMessage(`{"base_unit":"METER","multiplier":1}`), SortOrder: 40, IsActive: true},
		{ID: "u-sqm", LookupType: "unit_of_measure", Code: "SQM", NameLo: "ຕາແມັດ (m²)", NameEn: "Square Meter", Attributes: json.RawMessage(`{"base_unit":"SQM","multiplier":1}`), SortOrder: 50, IsActive: true},

		// Binding Methods
		{ID: "b-perfect", LookupType: "binding_type", Code: "PERFECT_BIND", NameLo: "ເຂົ້າເຫຼັ້ມກາວຮ້ອນ (Perfect Binding)", NameEn: "Thermal Hot Melt Perfect Binding", Attributes: json.RawMessage(`{"glue_grams_per_book":5}`), SortOrder: 10, IsActive: true},
		{ID: "b-wireo", LookupType: "binding_type", Code: "WIRE_O", NameLo: "ສັນຂົດລວດຄູ່ (Wire-O Binding)", NameEn: "Double Loop Wire-O Spine", Attributes: json.RawMessage(`{"pitch":"3:1"}`), SortOrder: 20, IsActive: true},
		{ID: "b-saddle", LookupType: "binding_type", Code: "SADDLE_STITCH", NameLo: "ຫຍິບມຸງຫຼັງຄາ / ຫຍິບກາງ", NameEn: "Center Staple Saddle Stitching", Attributes: json.RawMessage(`{"staples_per_book":2}`), SortOrder: 30, IsActive: true},
		{ID: "b-hardcover", LookupType: "binding_type", Code: "HARDCOVER", NameLo: "ເຂົ້າເຫຼັ້ມປົກແຂງ (Hardcover)", NameEn: "Case Bound Hardcover with Greyboard", Attributes: json.RawMessage(`{"greyboard_mm":2.0}`), SortOrder: 40, IsActive: true},
	}

	if lookupType == "" {
		return all
	}

	var filtered []SystemLookup
	for _, item := range all {
		if strings.EqualFold(item.LookupType, lookupType) {
			filtered = append(filtered, item)
		}
	}
	return filtered
}
