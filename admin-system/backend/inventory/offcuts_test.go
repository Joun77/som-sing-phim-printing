package inventory

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestOffcutsCRUD(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/api/inventory/offcuts", HandleGetOffcuts)
	r.POST("/api/inventory/offcuts", HandleRegisterOffcut)
	r.PUT("/api/inventory/offcuts/:id", HandleUpdateOffcut)
	r.DELETE("/api/inventory/offcuts/:id", HandleDeleteOffcut)

	// 1. Create Offcut
	offcut := Offcut{
		ID:               "OFF-TEST-001",
		ParentMaterialID: "MAT-ART-260",
		Name:             "Remnant Art Card 260gsm (A5)",
		WidthMm:          148,
		LengthMm:         210,
		Quantity:         50,
		CostPerSheet:     450.0,
		GrammageGsm:      260,
		PaperType:        "Art Card",
		Location:         "Shelf B-02",
	}
	body, _ := json.Marshal(offcut)

	reqPost, _ := http.NewRequest(http.MethodPost, "/api/inventory/offcuts", bytes.NewBuffer(body))
	reqPost.Header.Set("Content-Type", "application/json")
	wPost := httptest.NewRecorder()
	r.ServeHTTP(wPost, reqPost)

	if wPost.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created for offcut registration, got %d: %s", wPost.Code, wPost.Body.String())
	}

	// 2. Matching Offcut (All-or-Nothing check: 50 available, request 30 -> match found)
	matched := GetMatchingOffcut("MAT-ART-260", "Art Card", 140, 200, 30)
	if matched == nil {
		t.Errorf("Expected matching offcut for 30 qty, got nil")
	} else if matched.ID != "OFF-TEST-001" {
		t.Errorf("Expected matched ID OFF-TEST-001, got %s", matched.ID)
	}

	// Request 60 -> should not match because 50 < 60
	unmatched := GetMatchingOffcut("MAT-ART-260", "Art Card", 140, 200, 60)
	if unmatched != nil {
		t.Errorf("Expected nil when requested qty 60 exceeds available 50, got %v", unmatched)
	}

	// 3. Update Offcut
	offcut.Quantity = 45
	bodyPut, _ := json.Marshal(offcut)
	reqPut, _ := http.NewRequest(http.MethodPut, "/api/inventory/offcuts/OFF-TEST-001", bytes.NewBuffer(bodyPut))
	reqPut.Header.Set("Content-Type", "application/json")
	wPut := httptest.NewRecorder()
	r.ServeHTTP(wPut, reqPut)

	if wPut.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for offcut update, got %d: %s", wPut.Code, wPut.Body.String())
	}

	// 4. Delete Offcut
	reqDel, _ := http.NewRequest(http.MethodDelete, "/api/inventory/offcuts/OFF-TEST-001", nil)
	wDel := httptest.NewRecorder()
	r.ServeHTTP(wDel, reqDel)

	if wDel.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for offcut deletion, got %d: %s", wDel.Code, wDel.Body.String())
	}
}
