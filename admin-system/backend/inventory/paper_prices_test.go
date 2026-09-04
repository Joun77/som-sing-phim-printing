package inventory

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHandleUploadSupplierPriceSheet_JSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/api/v1/inventory/supplier-price-sheets", HandleUploadSupplierPriceSheet)
	r.GET("/api/v1/inventory/supplier-price-sheets", HandleGetPaperPriceVersions)
	r.GET("/api/v1/inventory/paper-prices/latest", HandleGetLatestPaperPrices)

	payload := PriceSheetUploadPayload{
		SupplierName:  "Lao Paper Import Ltd.",
		EffectiveDate: "2026-08-20",
		VersionCode:   "LPI-2026-AUG-V1",
		Notes:         "Test upload via JSON",
		Items: []PaperSpec{
			{
				PaperCode:     "PAP-GLOSS-160",
				PaperName:     "Gloss Art Paper 160g",
				PaperType:     "Art Paper",
				GSM:           160,
				SheetsPerReam: 500,
				CostPerReam:   240000,
				CostPerSheet:  480,
			},
		},
	}

	body, _ := json.Marshal(payload)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/inventory/supplier-price-sheets", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected status 201, got %d: %s", w.Code, w.Body.String())
	}

	// Fetch version list
	wList := httptest.NewRecorder()
	reqList, _ := http.NewRequest("GET", "/api/v1/inventory/supplier-price-sheets", nil)
	r.ServeHTTP(wList, reqList)

	if wList.Code != http.StatusOK {
		t.Fatalf("Expected status 200 for version list, got %d", wList.Code)
	}
}

func TestHandleUploadSupplierPriceSheet_CSV(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/api/v1/inventory/supplier-price-sheets", HandleUploadSupplierPriceSheet)

	var b bytes.Buffer
	w := multipart.NewWriter(&b)
	_ = w.WriteField("supplier_name", "SCG Paper Supply")
	_ = w.WriteField("effective_date", "2026-09-01")
	_ = w.WriteField("version_code", "SCG-SEP-2026")

	csvContent := "paper_code,paper_name,paper_type,gsm,sheets_per_ream,cost_per_ream,cost_per_sheet\nPAP-KRAFT-125,Kraft Paper 125g,Kraft,125,500,150000,300\n"
	part, _ := w.CreateFormFile("file", "prices.csv")
	_, _ = part.Write([]byte(csvContent))
	_ = w.Close()

	rec := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/inventory/supplier-price-sheets", &b)
	req.Header.Set("Content-Type", w.FormDataContentType())
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("Expected status 201 for CSV upload, got %d: %s", rec.Code, rec.Body.String())
	}
}
