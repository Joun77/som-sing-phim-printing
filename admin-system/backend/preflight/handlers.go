package preflight

import (
	"fmt"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// HandlePreflightPDF handles multipart PDF file upload and runs CMYK analysis
func HandlePreflightPDF(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing 'file' in multipart form data", "details": err.Error()})
		return
	}

	uploadDir := filepath.Join(".", "uploads", "preflight")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create preflight upload directory"})
		return
	}

	timestamp := time.Now().Format("20060102150405")
	safeFileName := fmt.Sprintf("%s_%s", timestamp, filepath.Base(file.Filename))
	destinationPath := filepath.Join(uploadDir, safeFileName)

	if err := c.SaveUploadedFile(file, destinationPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save uploaded PDF file", "details": err.Error()})
		return
	}

	// Run CMYK & Preflight Analysis for PDF or Image file
	result, err := AnalyzeFile(destinationPath, file.Filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Preflight analysis failed", "details": err.Error()})
		return
	}

	// Attach accessible static file URL
	result.FileURL = fmt.Sprintf("/api/v1/orders/files/preflight/%s", safeFileName)

	c.JSON(http.StatusOK, result)
}

// BatchPreflightResult represents aggregated CMYK color coverage and individual results for multiple files
type BatchPreflightResult struct {
	TotalFiles          int                 `json:"total_files"`
	AvgCovC             float64             `json:"avg_cov_c"`
	AvgCovM             float64             `json:"avg_cov_m"`
	AvgCovY             float64             `json:"avg_cov_y"`
	AvgCovK             float64             `json:"avg_cov_k"`
	LowDpiCount         int                 `json:"low_dpi_count"`
	SuggestedImposition BatchImpositionInfo `json:"suggested_imposition"`
	Files               []PreflightResult   `json:"files"`
}

// BatchImpositionInfo holds summary layout calculations
type BatchImpositionInfo struct {
	ParentSheet    string `json:"parent_sheet"`
	CutsPerSheet   int    `json:"cuts_per_sheet"`
	RequiredSheets int    `json:"required_sheets"`
	SpoilageSheets int    `json:"spoilage_sheets"`
	TotalSheets    int    `json:"total_sheets"`
	SummaryLao     string `json:"summary_lao"`
}

// HandleBatchPreflight handles multipart form upload of up to 100 images/PDFs simultaneously
func HandleBatchPreflight(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse multipart form", "details": err.Error()})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		files = form.File["file"]
	}
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No files found in upload payload"})
		return
	}

	// Enforce 100 files limit per user requirement
	if len(files) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Exceeded maximum allowed files per batch (Limit is 100 files per item)",
		})
		return
	}

	uploadDir := filepath.Join(".", "uploads", "preflight")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create preflight directory"})
		return
	}

	var results []PreflightResult
	var sumC, sumM, sumY, sumK float64
	lowDpiCount := 0
	batchTimestamp := time.Now().UnixNano() / 1e6

	for idx, f := range files {
		ext := strings.ToLower(filepath.Ext(f.Filename))
		allowed := map[string]bool{
			".png": true, ".jpg": true, ".jpeg": true, ".webp": true,
			".tiff": true, ".tif": true, ".pdf": true, ".psd": true,
		}
		if !allowed[ext] {
			continue
		}

		safeFileName := fmt.Sprintf("%d_%03d_%s", batchTimestamp, idx+1, filepath.Base(f.Filename))
		destPath := filepath.Join(uploadDir, safeFileName)

		if err := c.SaveUploadedFile(f, destPath); err != nil {
			continue
		}

		res, err := AnalyzeFile(destPath, f.Filename)
		if err != nil {
			continue
		}

		res.FileURL = fmt.Sprintf("/api/v1/orders/files/preflight/%s", safeFileName)
		if res.DPIEstimate > 0 && res.DPIEstimate < 150 {
			lowDpiCount++
		}

		sumC += res.AvgCovC
		sumM += res.AvgCovM
		sumY += res.AvgCovY
		sumK += res.AvgCovK

		results = append(results, *res)
	}

	if len(results) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "None of the uploaded files could be analyzed"})
		return
	}

	total := float64(len(results))
	avgC := math.Round((sumC/total)*100) / 100
	avgM := math.Round((sumM/total)*100) / 100
	avgY := math.Round((sumY/total)*100) / 100
	avgK := math.Round((sumK/total)*100) / 100

	photoSize := c.DefaultPostForm("photo_size", "4x6")
	borderMode := c.DefaultPostForm("border_mode", "BORDERED")

	// Imposition calculation based on photo size
	cutsPerSheet := 3
	switch strings.ToLower(photoSize) {
	case "3x4":
		cutsPerSheet = 6
	case "4x6", "a6":
		cutsPerSheet = 3
	case "5x7":
		cutsPerSheet = 2
	case "2x3", "polaroid":
		cutsPerSheet = 8
	case "a4":
		cutsPerSheet = 1
	default:
		cutsPerSheet = 3
	}

	reqSheets := int(math.Ceil(total / float64(cutsPerSheet)))
	spoilSheets := int(math.Ceil(float64(reqSheets) * 0.05))
	totalSheets := reqSheets + spoilSheets

	borderNote := "ມີຂອບຂາວ"
	if borderMode == "BORDERLESS" {
		borderNote = "ບໍ່ມີຂອບ (ຕັດຕົກ Bleed 2mm)"
	}

	summaryLao := fmt.Sprintf("ຮູບ %d ໃບ (ຂະໜາດ %s, %s) ຈັດວາງ %d ຮູບ/ແຜ່ນ A4 ➜ ໃຊ້ເຈ້ຍ A4 ທັງໝົດ %d ແຜ່ນ (ເຜື່ອເສຍ %d = ລວມ %d ແຜ່ນ)",
		len(results), photoSize, borderNote, cutsPerSheet, reqSheets, spoilSheets, totalSheets)

	response := BatchPreflightResult{
		TotalFiles:  len(results),
		AvgCovC:     avgC,
		AvgCovM:     avgM,
		AvgCovY:     avgY,
		AvgCovK:     avgK,
		LowDpiCount: lowDpiCount,
		SuggestedImposition: BatchImpositionInfo{
			ParentSheet:    "A4",
			CutsPerSheet:   cutsPerSheet,
			RequiredSheets: reqSheets,
			SpoilageSheets: spoilSheets,
			TotalSheets:    totalSheets,
			SummaryLao:     summaryLao,
		},
		Files: results,
	}

	c.JSON(http.StatusOK, response)
}

