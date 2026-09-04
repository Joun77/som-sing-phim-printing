package orders

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
)

// PreflightReportData represents detailed diagnostic report
type PreflightReportData struct {
	ID                 int                    `json:"id,omitempty"`
	OrderID            string                 `json:"order_id"`
	FileName           string                 `json:"file_name"`
	TotalPages         int                    `json:"total_pages"`
	ColorSpace         string                 `json:"color_space"`
	HasRGB             bool                   `json:"has_rgb"`
	IsStandardCMYK     bool                   `json:"is_standard_cmyk"`
	DPIEstimate        int                    `json:"dpi_estimate"`
	BleedMM            float64                `json:"bleed_mm"`
	HasSufficientBleed bool                   `json:"has_sufficient_bleed"`
	TACMaxPercent      float64                `json:"tac_max_percent"`
	TACWarning         bool                   `json:"tac_warning"`
	AvgCovC            float64                `json:"avg_cov_c"`
	AvgCovM            float64                `json:"avg_cov_m"`
	AvgCovY            float64                `json:"avg_cov_y"`
	AvgCovK            float64                `json:"avg_cov_k"`
	Status             string                 `json:"status"` // 'PASSED', 'WARNING', 'ERROR'
	ReportJSON         map[string]interface{} `json:"report_json,omitempty"`
	CreatedAt          time.Time              `json:"created_at"`
}

// In-memory store for fallback
var (
	preflightReportsStore = make(map[string]PreflightReportData)
	preflightStoreMutex   sync.RWMutex
	preflightSeq          = 1
)

// HandleSavePreflightReport saves preflight diagnostic report for an order
func HandleSavePreflightReport(c *gin.Context) {
	orderID := c.Param("id")
	if orderID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "order_id is required"})
		return
	}

	var req PreflightReportData
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid JSON: " + err.Error()})
		return
	}

	req.OrderID = orderID
	if req.Status == "" {
		if req.HasRGB || req.DPIEstimate < 300 || !req.HasSufficientBleed {
			req.Status = "ERROR"
		} else if req.TACWarning {
			req.Status = "WARNING"
		} else {
			req.Status = "PASSED"
		}
	}
	req.CreatedAt = time.Now()

	// Persist to Postgres if available
	if db.DB != nil {
		reportJSONBytes, _ := json.Marshal(req.ReportJSON)
		query := `
			INSERT INTO order_preflight_reports (
				order_id, file_name, total_pages, color_space, has_rgb, is_standard_cmyk,
				dpi_estimate, bleed_mm, has_sufficient_bleed, tac_max_percent, tac_warning,
				avg_cov_c, avg_cov_m, avg_cov_y, avg_cov_k, status, report_json, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
			RETURNING id
		`
		var reportID int
		err := db.DB.QueryRow(
			query,
			req.OrderID, req.FileName, req.TotalPages, req.ColorSpace, req.HasRGB, req.IsStandardCMYK,
			req.DPIEstimate, req.BleedMM, req.HasSufficientBleed, req.TACMaxPercent, req.TACWarning,
			req.AvgCovC, req.AvgCovM, req.AvgCovY, req.AvgCovK, req.Status, reportJSONBytes,
		).Scan(&reportID)
		if err != nil {
			log.Printf("[PREFLIGHT DB ERROR] %v", err)
		} else {
			req.ID = reportID
		}
	}

	// Memory fallback store
	preflightStoreMutex.Lock()
	if req.ID == 0 {
		req.ID = preflightSeq
		preflightSeq++
	}
	preflightReportsStore[orderID] = req
	preflightStoreMutex.Unlock()

	c.JSON(http.StatusCreated, gin.H{
		"status":     "success",
		"message":    "Preflight diagnostic report saved successfully",
		"report_id":  req.ID,
		"order_id":   orderID,
		"status_tag": req.Status,
		"data":       req,
	})
}

// HandleGetPreflightReport retrieves the preflight report for an order
func HandleGetPreflightReport(c *gin.Context) {
	orderID := c.Param("id")
	if orderID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "order_id is required"})
		return
	}

	if db.DB != nil {
		query := `
			SELECT id, order_id, file_name, total_pages, color_space, has_rgb, is_standard_cmyk,
			       dpi_estimate, bleed_mm, has_sufficient_bleed, tac_max_percent, tac_warning,
			       avg_cov_c, avg_cov_m, avg_cov_y, avg_cov_k, status, report_json, created_at
			FROM order_preflight_reports
			WHERE order_id = $1
			ORDER BY created_at DESC
			LIMIT 1
		`
		var r PreflightReportData
		var reportJSONBytes []byte
		err := db.DB.QueryRow(query, orderID).Scan(
			&r.ID, &r.OrderID, &r.FileName, &r.TotalPages, &r.ColorSpace, &r.HasRGB, &r.IsStandardCMYK,
			&r.DPIEstimate, &r.BleedMM, &r.HasSufficientBleed, &r.TACMaxPercent, &r.TACWarning,
			&r.AvgCovC, &r.AvgCovM, &r.AvgCovY, &r.AvgCovK, &r.Status, &reportJSONBytes, &r.CreatedAt,
		)
		if err == nil {
			_ = json.Unmarshal(reportJSONBytes, &r.ReportJSON)
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": r})
			return
		}
	}

	preflightStoreMutex.RLock()
	report, exists := preflightReportsStore[orderID]
	preflightStoreMutex.RUnlock()

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Preflight report not found for order"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": report})
}
