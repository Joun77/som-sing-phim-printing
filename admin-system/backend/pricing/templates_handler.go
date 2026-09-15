package pricing

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"somsing.local/backend/db"
)

// PricingTemplateRecord represents a master quotation template saved in DB
type PricingTemplateRecord struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	NameLao     string                 `json:"nameLao"`
	NameEn      string                 `json:"nameEn"`
	Category    string                 `json:"category"`
	IconName    string                 `json:"iconName"`
	Description string                 `json:"description"`
	IsDefault   bool                   `json:"isDefault"`
	Spec        map[string]interface{} `json:"spec"`
	CreatedBy   string                 `json:"createdBy,omitempty"`
	CreatedAt   string                 `json:"createdAt,omitempty"`
	UpdatedAt   string                 `json:"updatedAt,omitempty"`
}

var (
	memTemplatesMu sync.RWMutex
	memTemplates   = make(map[string]PricingTemplateRecord)
)

func init() {
	// Seed initial standard templates
	seedStandardTemplates()
}

func seedStandardTemplates() {
	now := time.Now().Format(time.RFC3339)
	defaults := []PricingTemplateRecord{
		{
			ID:          "TPL_BIZ_CARD_STANDARD",
			Name:        "Business Card (90x54mm)",
			NameLao:     "ນາມບັດມາດຕະຖານ (90x54mm)",
			NameEn:      "Business Card (Standard 90x54mm)",
			Category:    "Card",
			IconName:    "Layers",
			Description: "ນາມບັດ Art Card 300gsm ພິມ 2 ໜ້າ ຕັດ 20 ໃບ/ແຜ່ນ",
			IsDefault:   true,
			CreatedAt:   now,
			UpdatedAt:   now,
			Spec: map[string]interface{}{
				"jobName":          "ນາມບັດມາດຕະຖານ",
				"quantity":         100,
				"jobWidth":         90,
				"jobHeight":        54,
				"cutsPerSheet":     20,
				"spoilagePercent":  5,
				"paperFormat":      "sheet",
				"paperName":        "Art Card 300gsm",
				"colorMode":        "Color",
				"printedSides":     "2_sided",
				"targetMarginPercent": 40,
			},
		},
		{
			ID:          "TPL_BROCHURE_A4",
			Name:        "A4 Tri-fold Flyer",
			NameLao:     "ແຜ່ນພັບ / ໂບຣຊົວ A4",
			NameEn:      "A4 Tri-fold Brochure / Flyer",
			Category:    "Marketing",
			IconName:    "Sparkles",
			Description: "ໂບຣຊົວ A4 ພັບ 3 ຕອນ Art 150gsm ພິມ 4 ສີ 2 ໜ້າ",
			IsDefault:   true,
			CreatedAt:   now,
			UpdatedAt:   now,
			Spec: map[string]interface{}{
				"jobName":          "ແຜ່ນພັບ A4",
				"quantity":         500,
				"jobWidth":         210,
				"jobHeight":        297,
				"cutsPerSheet":     2,
				"spoilagePercent":  5,
				"paperFormat":      "sheet",
				"paperName":        "Art Paper 150gsm",
				"colorMode":        "Color",
				"printedSides":     "2_sided",
				"targetMarginPercent": 35,
			},
		},
		{
			ID:          "TPL_PERFECT_BIND_BOOK",
			Name:        "Pocket Book A5 (Glue)",
			NameLao:     "ປຶ້ມພັອກເກັດບຸກ A5 (ສັນກາວ)",
			NameEn:      "Pocket Book A5 (Perfect Binding)",
			Category:    "Book",
			IconName:    "BookOpen",
			Description: "ປຶ້ມ A5 ເນື້ອໃນ 100 ໜ້າ ຖະໜອມສາຍຕາ ປົກ Art 250gsm ເຄືອບດ້ານ",
			IsDefault:   true,
			CreatedAt:   now,
			UpdatedAt:   now,
			Spec: map[string]interface{}{
				"jobName":          "ປຶ້ມພັອກເກັດບຸກ A5",
				"quantity":         100,
				"pageCount":        100,
				"jobWidth":         148,
				"jobHeight":        210,
				"cutsPerSheet":     4,
				"bindingType":      "Glue",
				"useBinding":       true,
				"useLamination":    true,
				"laminationType":   "Matte",
				"paperName":        "Green Read 75gsm",
				"coverPaperName":   "Art Card 250gsm",
				"targetMarginPercent": 35,
			},
		},
		{
			ID:          "TPL_DESK_CALENDAR",
			Name:        "Desk Calendar (8x6)",
			NameLao:     "ປະຕິທິນຕັ້ງໂຕະ (8x6 ນິ້ວ)",
			NameEn:      "Desk Calendar (8x6 inch)",
			Category:    "Stationery",
			IconName:    "Calendar",
			Description: "ປະຕິທິນຕັ້ງໂຕະ 14 ໃບ ສັນຫ່ວງກະດູກງູ ຂາຕັ້ງແຂງ",
			IsDefault:   true,
			CreatedAt:   now,
			UpdatedAt:   now,
			Spec: map[string]interface{}{
				"jobName":          "ປະຕິທິນຕັ້ງໂຕະ",
				"quantity":         100,
				"pageCount":        28,
				"jobWidth":         203,
				"jobHeight":        152,
				"cutsPerSheet":     4,
				"bindingType":      "Spiral",
				"useBinding":       true,
				"paperName":        "Art Card 250gsm",
				"targetMarginPercent": 40,
			},
		},
	}

	for _, d := range defaults {
		memTemplates[d.ID] = d
	}
}

// HandleGetQuotationTemplates returns quotation templates from PostgreSQL (or memory fallback)
func HandleGetQuotationTemplates(c *gin.Context) {
	if db.DB != nil {
		rows, err := db.DB.Query(`
			SELECT id, name, name_lao, category, icon_name, description, is_default, spec_json, created_by, created_at, updated_at
			FROM quotation_templates
			ORDER BY is_default DESC, created_at ASC
		`)
		if err == nil {
			defer rows.Close()
			var list []PricingTemplateRecord
			for rows.Next() {
				var r PricingTemplateRecord
				var specRaw []byte
				var desc, createdBy sql.NullString
				var createdAt, updatedAt time.Time

				if scanErr := rows.Scan(&r.ID, &r.Name, &r.NameLao, &r.Category, &r.IconName, &desc, &r.IsDefault, &specRaw, &createdBy, &createdAt, &updatedAt); scanErr == nil {
					r.Description = desc.String
					r.CreatedBy = createdBy.String
					r.CreatedAt = createdAt.Format(time.RFC3339)
					r.UpdatedAt = updatedAt.Format(time.RFC3339)
					r.NameEn = r.Name

					if len(specRaw) > 0 {
						var spec map[string]interface{}
						if json.Unmarshal(specRaw, &spec) == nil {
							r.Spec = spec
						}
					}
					list = append(list, r)
				}
			}

			if len(list) > 0 {
				c.JSON(http.StatusOK, gin.H{"status": "success", "data": list})
				return
			}

			// If table is empty, auto-seed defaults into DB
			go seedDefaultsToDB()
		}
	}

	// Fallback to in-memory store
	memTemplatesMu.RLock()
	defer memTemplatesMu.RUnlock()

	items := make([]PricingTemplateRecord, 0, len(memTemplates))
	for _, item := range memTemplates {
		items = append(items, item)
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": items})
}

func seedDefaultsToDB() {
	if db.DB == nil {
		return
	}
	memTemplatesMu.RLock()
	defer memTemplatesMu.RUnlock()

	for _, tpl := range memTemplates {
		specBytes, _ := json.Marshal(tpl.Spec)
		_, _ = db.DB.Exec(`
			INSERT INTO quotation_templates (id, name, name_lao, category, icon_name, description, is_default, spec_json, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
			ON CONFLICT (id) DO NOTHING
		`, tpl.ID, tpl.Name, tpl.NameLao, tpl.Category, tpl.IconName, tpl.Description, tpl.IsDefault, specBytes)
	}
}

// HandleSaveQuotationTemplate creates or updates a custom quotation template
func HandleSaveQuotationTemplate(c *gin.Context) {
	var req PricingTemplateRecord
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid template payload", "details": err.Error()})
		return
	}

	if req.ID == "" {
		req.ID = fmt.Sprintf("CUST_TPL_%d", time.Now().UnixNano())
	}
	if req.NameLao == "" {
		req.NameLao = req.Name
	}
	if req.NameEn == "" {
		req.NameEn = req.Name
	}
	if req.IconName == "" {
		req.IconName = "Sparkles"
	}
	if req.Category == "" {
		req.Category = "Custom"
	}
	now := time.Now().Format(time.RFC3339)
	req.CreatedAt = now
	req.UpdatedAt = now

	// Save to DB
	if db.DB != nil {
		specBytes, err := json.Marshal(req.Spec)
		if err != nil {
			specBytes = []byte("{}")
		}

		_, dbErr := db.DB.Exec(`
			INSERT INTO quotation_templates (id, name, name_lao, category, icon_name, description, is_default, spec_json, created_by, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
			ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name,
				name_lao = EXCLUDED.name_lao,
				category = EXCLUDED.category,
				icon_name = EXCLUDED.icon_name,
				description = EXCLUDED.description,
				spec_json = EXCLUDED.spec_json,
				updated_at = NOW()
		`, req.ID, req.Name, req.NameLao, req.Category, req.IconName, req.Description, req.IsDefault, specBytes, req.CreatedBy)

		if dbErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error saving template", "details": dbErr.Error()})
			return
		}
	}

	// Always sync in-memory cache
	memTemplatesMu.Lock()
	memTemplates[req.ID] = req
	memTemplatesMu.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Template saved successfully", "data": req})
}

// HandleDeleteQuotationTemplate removes a custom template by ID
func HandleDeleteQuotationTemplate(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Template ID required"})
		return
	}

	if db.DB != nil {
		_, _ = db.DB.Exec("DELETE FROM quotation_templates WHERE id = $1 AND is_default = FALSE", id)
	}

	memTemplatesMu.Lock()
	if t, exists := memTemplates[id]; exists && !t.IsDefault {
		delete(memTemplates, id)
	}
	memTemplatesMu.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Template deleted"})
}
