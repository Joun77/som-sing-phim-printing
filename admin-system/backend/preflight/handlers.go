package preflight

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
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
