package orders

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"somsing.local/backend/db"
)

type WorkflowTemplateRecord struct {
	ID          string          `json:"id"`
	Name        string          `json:"name"`
	NameLao     string          `json:"nameLao"`
	Description string          `json:"description,omitempty"`
	Category    string          `json:"category"`
	StepsJSON   json.RawMessage `json:"steps"`
	IsDefault   bool            `json:"isDefault,omitempty"`
	CreatedBy   string          `json:"createdBy,omitempty"`
	CreatedAt   string          `json:"createdAt"`
	UpdatedAt   string          `json:"updatedAt"`
}

var (
	workflowTemplateMutex sync.RWMutex
	workflowTemplateStore = map[string]WorkflowTemplateRecord{}
)

func init() {
	// Pre-populate standard fallback templates
	defaultSteps := []map[string]interface{}{
		{"id": "step-prepress", "name": "File Inspection & RIP Processing", "nameLao": "ກວດໄຟລ໌ & RIP ແຍກສີ", "category": "PRE_PRESS"},
		{"id": "step-press", "name": "Digital Press Printing Run", "nameLao": "ສັ່ງພິມລົງແທ່ນພິມດິຈິຕອລ", "category": "PRESS"},
		{"id": "step-finishing", "name": "Precision Cutting & Trimming", "nameLao": "ຕັດຂອບ & ຕັດແບ່ງຕາມຂະໜາດ", "category": "FINISHING"},
		{"id": "step-qc", "name": "Quality Check & Packaging", "nameLao": "ກວດສອບຄຸນນະພາບ (QC) & ແພັກກິ້ງ", "category": "QC"},
	}
	stepsBytes, _ := json.Marshal(defaultSteps)
	workflowTemplateStore["tpl_standard_print"] = WorkflowTemplateRecord{
		ID:          "tpl_standard_print",
		Name:        "Standard Commercial Print",
		NameLao:     "ມາດຕະຖານງານພິມທົ່ວໄປ (Standard Commercial)",
		Description: "Pre-press -> Press -> Cutting -> QC",
		Category:    "Commercial",
		StepsJSON:   stepsBytes,
		IsDefault:   true,
		CreatedAt:   time.Now().Format(time.RFC3339),
		UpdatedAt:   time.Now().Format(time.RFC3339),
	}

	photoSteps := []map[string]interface{}{
		{"id": "step-photo-prepress", "name": "Photo Grid Preflight & Imposition", "nameLao": "ຈັດລຽງໜ້າພິມຮູບພາບ (Imposition)", "category": "PRE_PRESS"},
		{"id": "step-photo-press", "name": "Photo Quality Color Press Run", "nameLao": "ພິມລະບົບສີລະອຽດສູງ (Photo Quality)", "category": "PRESS"},
		{"id": "step-photo-coating", "name": "UV/Film Lamination (Optional)", "nameLao": "ເຄືອບຟິມປ້ອງກັນຮອຍ / UV", "category": "FINISHING"},
		{"id": "step-photo-cutting", "name": "Precision Photo Cutting", "nameLao": "ຕັດແບ່ງຮູບພາບແຕ່ລະໃບ", "category": "FINISHING"},
		{"id": "step-photo-qc", "name": "Final Photo QC & Envelope Pack", "nameLao": "ກວດ QC ຄົບຈຳນວນ & ໃສ່ຊອງແພັກ", "category": "QC"},
	}
	photoBytes, _ := json.Marshal(photoSteps)
	workflowTemplateStore["tpl_photo_prints"] = WorkflowTemplateRecord{
		ID:          "tpl_photo_prints",
		Name:        "Photo Prints Workflow",
		NameLao:     "ສາຍການຜະລິດພິມຮູບພາບ (Photo Prints Workflow)",
		Description: "Imposition -> Photo Press -> Lamination -> Photo Cut -> Pack",
		Category:    "Photo",
		StepsJSON:   photoBytes,
		IsDefault:   true,
		CreatedAt:   time.Now().Format(time.RFC3339),
		UpdatedAt:   time.Now().Format(time.RFC3339),
	}
}

// EnsureWorkflowTemplatesTable creates the table if missing
func EnsureWorkflowTemplatesTable() {
	if db.DB == nil {
		return
	}
	createSQL := `
	CREATE TABLE IF NOT EXISTS workflow_templates (
		id VARCHAR(100) PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		name_lao VARCHAR(255) NOT NULL,
		description TEXT,
		category VARCHAR(100) NOT NULL DEFAULT 'Custom',
		steps_json JSONB NOT NULL DEFAULT '[]'::jsonb,
		is_default BOOLEAN DEFAULT FALSE,
		created_by VARCHAR(100),
		created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
	`
	_, err := db.DB.Exec(createSQL)
	if err != nil {
		log.Printf("[WorkflowTemplates] table check warning: %v", err)
	}
}

// HandleGetWorkflowTemplates returns all workflow templates
func HandleGetWorkflowTemplates(c *gin.Context) {
	EnsureWorkflowTemplatesTable()

	if db.DB != nil {
		query := `SELECT id, name, name_lao, COALESCE(description, ''), category, steps_json, COALESCE(is_default, false), COALESCE(created_by, ''), created_at, updated_at FROM workflow_templates ORDER BY is_default DESC, created_at DESC`
		rows, err := db.DB.Query(query)
		if err == nil {
			defer rows.Close()
			var list []WorkflowTemplateRecord
			for rows.Next() {
				var r WorkflowTemplateRecord
				var stepsStr []byte
				var created, updated time.Time
				if scanErr := rows.Scan(&r.ID, &r.Name, &r.NameLao, &r.Description, &r.Category, &stepsStr, &r.IsDefault, &r.CreatedBy, &created, &updated); scanErr == nil {
					r.StepsJSON = stepsStr
					r.CreatedAt = created.Format(time.RFC3339)
					r.UpdatedAt = updated.Format(time.RFC3339)
					list = append(list, r)
				}
			}
			if len(list) > 0 {
				c.JSON(http.StatusOK, gin.H{
					"success": true,
					"data":    list,
					"total":   len(list),
				})
				return
			}
		}
	}

	// In-memory fallback
	workflowTemplateMutex.RLock()
	defer workflowTemplateMutex.RUnlock()
	var list []WorkflowTemplateRecord
	for _, tpl := range workflowTemplateStore {
		list = append(list, tpl)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    list,
		"total":   len(list),
	})
}

// HandleSaveWorkflowTemplate saves or updates a workflow template
func HandleSaveWorkflowTemplate(c *gin.Context) {
	EnsureWorkflowTemplatesTable()

	var req struct {
		ID          string          `json:"id"`
		Name        string          `json:"name" binding:"required"`
		NameLao     string          `json:"nameLao"`
		Description string          `json:"description"`
		Category    string          `json:"category"`
		Steps       json.RawMessage `json:"steps" binding:"required"`
		CreatedBy   string          `json:"createdBy"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	if req.ID == "" {
		req.ID = fmt.Sprintf("tpl_%d", time.Now().UnixMilli())
	}
	if req.NameLao == "" {
		req.NameLao = req.Name
	}
	if req.Category == "" {
		req.Category = "Custom"
	}

	now := time.Now()
	nowStr := now.Format(time.RFC3339)

	record := WorkflowTemplateRecord{
		ID:          req.ID,
		Name:        req.Name,
		NameLao:     req.NameLao,
		Description: req.Description,
		Category:    req.Category,
		StepsJSON:   req.Steps,
		CreatedBy:   req.CreatedBy,
		CreatedAt:   nowStr,
		UpdatedAt:   nowStr,
	}

	if db.DB != nil {
		upsertSQL := `
		INSERT INTO workflow_templates (id, name, name_lao, description, category, steps_json, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			name_lao = EXCLUDED.name_lao,
			description = EXCLUDED.description,
			category = EXCLUDED.category,
			steps_json = EXCLUDED.steps_json,
			updated_at = EXCLUDED.updated_at;
		`
		_, err := db.DB.Exec(upsertSQL, record.ID, record.Name, record.NameLao, record.Description, record.Category, record.StepsJSON, record.CreatedBy, now, now)
		if err != nil {
			log.Printf("[WorkflowTemplates] DB Upsert error: %v, falling back to in-memory", err)
		}
	}

	// Always sync in-memory
	workflowTemplateMutex.Lock()
	workflowTemplateStore[record.ID] = record
	workflowTemplateMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    record,
		"message": "Workflow template saved successfully",
	})
}

// HandleDeleteWorkflowTemplate deletes a template
func HandleDeleteWorkflowTemplate(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Template ID is required"})
		return
	}

	if db.DB != nil {
		_, _ = db.DB.Exec(`DELETE FROM workflow_templates WHERE id = $1`, id)
	}

	workflowTemplateMutex.Lock()
	delete(workflowTemplateStore, id)
	workflowTemplateMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Workflow template deleted successfully",
	})
}
