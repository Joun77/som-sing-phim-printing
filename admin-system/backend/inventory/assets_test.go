package inventory

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"somsing.local/backend/db"
)

func TestEquipment_LegacyAliasResolution(t *testing.T) {
	// Test legacy alias mapping
	tests := []struct {
		input     string
		expected  string
		isLegacy  bool
	}{
		{input: "MAC-5707", expected: "PRN-9614", isLegacy: true},
		{input: "MAC-6821", expected: "PRN-6317", isLegacy: true},
		{input: "PRN-9614", expected: "PRN-9614", isLegacy: false},
		{input: "PRN-6317", expected: "PRN-6317", isLegacy: false},
		{input: "MAC-CUTTER-920", expected: "MAC-CUTTER-920", isLegacy: false},
		{input: "MAC-BINDER-K5", expected: "MAC-BINDER-K5", isLegacy: false},
		{input: " UNKNOWN-ID ", expected: "UNKNOWN-ID", isLegacy: false},
	}

	for _, tt := range tests {
		got := ResolveEquipmentAlias(tt.input)
		if got != tt.expected {
			t.Errorf("ResolveEquipmentAlias(%q) = %q, expected %q", tt.input, got, tt.expected)
		}
		isLeg := IsLegacyEquipmentAlias(tt.input)
		if isLeg != tt.isLegacy {
			t.Errorf("IsLegacyEquipmentAlias(%q) = %v, expected %v", tt.input, isLeg, tt.isLegacy)
		}
	}
}

func TestGetEquipment_FallbackList_CanonicalOnlyAndDeduplicated(t *testing.T) {
	// Ensure store is in fresh seeded state
	seedEquipmentInStore()

	// 1. Test in-memory list helper
	list, err := GetEquipmentList()
	if err != nil {
		t.Fatalf("GetEquipmentList failed: %v", err)
	}

	var countPRN9614, countPRN6317 int
	for _, item := range list {
		if item.ID == "PRN-9614" {
			countPRN9614++
		}
		if item.ID == "PRN-6317" {
			countPRN6317++
		}
		if item.ID == "MAC-5707" || item.ID == "MAC-6821" || item.ID == "MAC-4190" {
			t.Errorf("Found legacy MAC alias in equipment fallback list: %s", item.ID)
		}
	}

	if countPRN9614 != 1 {
		t.Errorf("Expected PRN-9614 to appear exactly once, got %d", countPRN9614)
	}
	if countPRN6317 != 1 {
		t.Errorf("Expected PRN-6317 to appear exactly once, got %d", countPRN6317)
	}

	// 2. Test HTTP endpoint HandleGetEquipment in in_memory mode
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/api/equipment", HandleGetEquipment)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/equipment", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 from HandleGetEquipment, got %d", w.Code)
	}

	var resp struct {
		Status string          `json:"status"`
		Source string          `json:"source"`
		Data   []EquipmentItem `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to parse JSON response: %v", err)
	}

	if resp.Source != "in_memory" {
		t.Logf("Response source: %s", resp.Source)
	}

	countPRN9614 = 0
	countPRN6317 = 0
	for _, item := range resp.Data {
		if item.ID == "PRN-9614" {
			countPRN9614++
		}
		if item.ID == "PRN-6317" {
			countPRN6317++
		}
		if item.ID == "MAC-5707" || item.ID == "MAC-6821" || item.ID == "MAC-4190" {
			t.Errorf("HandleGetEquipment returned legacy alias %s as an equipment item", item.ID)
		}
	}

	if countPRN9614 != 1 {
		t.Errorf("HandleGetEquipment: expected PRN-9614 exactly once, got %d", countPRN9614)
	}
	if countPRN6317 != 1 {
		t.Errorf("HandleGetEquipment: expected PRN-6317 exactly once, got %d", countPRN6317)
	}
}

func TestGetEquipmentByID_LegacyAliasLookup(t *testing.T) {
	seedEquipmentInStore()

	// Lookup via legacy alias MAC-5707 should resolve to PRN-9614
	itemEpson, err := GetEquipmentByID("MAC-5707")
	if err != nil {
		t.Fatalf("Failed to lookup by legacy alias MAC-5707: %v", err)
	}
	if itemEpson.ID != "PRN-9614" {
		t.Errorf("Expected resolved ID 'PRN-9614', got %q", itemEpson.ID)
	}
	if itemEpson.Brand != "Epson" || itemEpson.Model != "L15150" {
		t.Errorf("Unexpected item data for Epson: %+v", itemEpson)
	}

	// Lookup via legacy alias MAC-6821 should resolve to PRN-6317
	itemBrother, err := GetEquipmentByID("MAC-6821")
	if err != nil {
		t.Fatalf("Failed to lookup by legacy alias MAC-6821: %v", err)
	}
	if itemBrother.ID != "PRN-6317" {
		t.Errorf("Expected resolved ID 'PRN-6317', got %q", itemBrother.ID)
	}
	if itemBrother.Brand != "Brother" || itemBrother.Model != "MFC-J2740DW" {
		t.Errorf("Unexpected item data for Brother: %+v", itemBrother)
	}

	// Direct lookup by canonical ID PRN-9614
	itemDirect, err := GetEquipmentByID("PRN-9614")
	if err != nil {
		t.Fatalf("Failed to lookup PRN-9614: %v", err)
	}
	if itemDirect.ID != "PRN-9614" {
		t.Errorf("Expected ID 'PRN-9614', got %q", itemDirect.ID)
	}

	// Lookup nonexistent item
	_, err = GetEquipmentByID("UNKNOWN-MACHINE-999")
	if err == nil {
		t.Errorf("Expected error for non-existent machine ID, got nil")
	}
}

func TestHandleGetAssetByIDV1_HTTP_LegacyAlias(t *testing.T) {
	seedEquipmentInStore()

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/api/v1/assets/:id", HandleGetAssetByIDV1)

	// Test GET /api/v1/assets/MAC-5707
	w1 := httptest.NewRecorder()
	req1, _ := http.NewRequest("GET", "/api/v1/assets/MAC-5707", nil)
	r.ServeHTTP(w1, req1)
	if w1.Code != http.StatusOK {
		t.Fatalf("Expected 200 for /api/v1/assets/MAC-5707, got %d", w1.Code)
	}
	var res1 struct {
		Status string        `json:"status"`
		Data   EquipmentItem `json:"data"`
	}
	if err := json.Unmarshal(w1.Body.Bytes(), &res1); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}
	if res1.Data.ID != "PRN-9614" {
		t.Errorf("Expected canonical ID 'PRN-9614', got %q", res1.Data.ID)
	}

	// Test GET /api/v1/assets/MAC-6821
	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest("GET", "/api/v1/assets/MAC-6821", nil)
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("Expected 200 for /api/v1/assets/MAC-6821, got %d", w2.Code)
	}
	var res2 struct {
		Status string        `json:"status"`
		Data   EquipmentItem `json:"data"`
	}
	if err := json.Unmarshal(w2.Body.Bytes(), &res2); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}
	if res2.Data.ID != "PRN-6317" {
		t.Errorf("Expected canonical ID 'PRN-6317', got %q", res2.Data.ID)
	}

	// Test GET /api/v1/assets/PRN-9614
	w3 := httptest.NewRecorder()
	req3, _ := http.NewRequest("GET", "/api/v1/assets/PRN-9614", nil)
	r.ServeHTTP(w3, req3)
	if w3.Code != http.StatusOK {
		t.Fatalf("Expected 200 for /api/v1/assets/PRN-9614, got %d", w3.Code)
	}

	// Test GET /api/v1/assets/NON-EXISTENT
	w4 := httptest.NewRecorder()
	req4, _ := http.NewRequest("GET", "/api/v1/assets/NON-EXISTENT-XYZ", nil)
	r.ServeHTTP(w4, req4)
	if w4.Code != http.StatusNotFound {
		t.Fatalf("Expected 404 for unknown asset, got %d", w4.Code)
	}
}

func TestCanonicalEquipmentList_DeduplicatesEvenIfStoreTainted(t *testing.T) {
	assetStoreMutex.Lock()
	// Deliberately pollute equipmentStore with alias keys pointing to canonical items
	prn9614 := equipmentStore["PRN-9614"]
	prn6317 := equipmentStore["PRN-6317"]
	equipmentStore["MAC-5707"] = prn9614
	equipmentStore["MAC-6821"] = prn6317
	assetStoreMutex.Unlock()

	defer func() {
		// Cleanup after test
		seedEquipmentInStore()
	}()

	items := getCanonicalEquipmentListFromStore()

	counts := make(map[string]int)
	for _, it := range items {
		counts[it.ID]++
		if it.ID == "MAC-5707" || it.ID == "MAC-6821" {
			t.Errorf("Tainted alias appeared in canonical equipment list: %s", it.ID)
		}
	}

	if counts["PRN-9614"] != 1 {
		t.Errorf("Expected PRN-9614 count 1 even with tainted store, got %d", counts["PRN-9614"])
	}
	if counts["PRN-6317"] != 1 {
		t.Errorf("Expected PRN-6317 count 1 even with tainted store, got %d", counts["PRN-6317"])
	}
}

func TestEquipment_Fallback_NoUnsupportedSeeds(t *testing.T) {
	seedEquipmentInStore()
	items := getCanonicalEquipmentListFromStore()

	unsupported := map[string]bool{
		"MAC-CUTTER-920": true,
		"MAC-BINDER-K5":  true,
		"MAC-4190":       true,
		"MAC-5707":       true,
		"MAC-6821":       true,
	}

	foundIDs := make(map[string]bool)
	for _, it := range items {
		foundIDs[it.ID] = true
		if unsupported[it.ID] {
			t.Errorf("Found unsupported mock seed in fallback equipment list: %s (%s %s)", it.ID, it.Brand, it.Model)
		}
	}

	if !foundIDs["PRN-9614"] {
		t.Errorf("Expected authentic equipment PRN-9614 (Epson L15150) in fallback list, but was missing")
	}
	if !foundIDs["PRN-6317"] {
		t.Errorf("Expected authentic equipment PRN-6317 (Brother MFC-J2740DW) in fallback list, but was missing")
	}
	if len(items) != 2 {
		t.Errorf("Expected fallback equipment list to contain exactly 2 verified items, got %d", len(items))
	}
}

func TestInventory_ExcludesPhysicalAssets(t *testing.T) {
	if db.DB != nil {
		items, err := getInventoryItemsFromDB()
		if err != nil {
			t.Fatalf("Failed to query inventory items from DB: %v", err)
		}
		for _, item := range items {
			cat := strings.ToUpper(item.Category)
			if cat == "PRINTER" || cat == "MACHINERY" || cat == "EQUIPMENT" || cat == "CUTTER" || cat == "BINDER" || cat == "LAMINATOR" {
				t.Errorf("Inventory returned physical asset as material item: ID=%s, Name=%s, Category=%s", item.ID, item.Name, item.Category)
			}
			if strings.HasPrefix(item.ID, "PRN-") || strings.HasPrefix(item.ID, "MAC-") {
				t.Errorf("Inventory returned item with asset ID prefix: ID=%s, Name=%s", item.ID, item.Name)
			}
		}
	}
}

func TestEquipment_PRN9614_EpsonInkjetSpec(t *testing.T) {
	// 1. Verify NormalizePrinterCategory preserves Inkjet for Epson L15150 and rejects Laser overwrite
	tests := []struct {
		name     string
		rawCat   string
		brand    string
		model    string
		specs    map[string]interface{}
		expected string
	}{
		{
			name:     "Epson L15150 with mistaken Laser category",
			rawCat:   "Laser",
			brand:    "Epson",
			model:    "L15150",
			specs:    map[string]interface{}{"inkCode": "EPSON-008-BK"},
			expected: "Inkjet",
		},
		{
			name:     "Epson L15150 with Inkjet Printer label",
			rawCat:   "Inkjet Printer",
			brand:    "Epson",
			model:    "L15150",
			specs:    nil,
			expected: "Inkjet",
		},
		{
			name:     "Brother MFC-J2740DW with Inkjet",
			rawCat:   "Inkjet",
			brand:    "Brother",
			model:    "MFC-J2740DW",
			specs:    nil,
			expected: "Inkjet",
		},
		{
			name:     "Legitimate Laser printer",
			rawCat:   "Laser",
			brand:    "Fuji Xerox",
			model:    "DocuCentre-V C2263",
			specs:    nil,
			expected: "Laser",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := NormalizePrinterCategory(tc.rawCat, tc.brand, tc.model, tc.specs)
			if got != tc.expected {
				t.Errorf("NormalizePrinterCategory(%q, %q, %q) = %q, expected %q", tc.rawCat, tc.brand, tc.model, got, tc.expected)
			}
		})
	}

	// 2. Test in-memory fallback equipment PRN-9614
	seedEquipmentInStore()
	item, err := GetEquipmentByID("PRN-9614")
	if err != nil {
		t.Fatalf("GetEquipmentByID(PRN-9614) failed: %v", err)
	}

	if item.Category != "Printer" {
		t.Errorf("PRN-9614 Category = %q, expected %q", item.Category, "Printer")
	}
	if item.PrinterCategory != "Inkjet" {
		t.Errorf("PRN-9614 PrinterCategory = %q, expected %q", item.PrinterCategory, "Inkjet")
	}
	if item.Price != 18000000 {
		t.Errorf("PRN-9614 Price = %v, expected 18000000", item.Price)
	}
	if item.ExpectedLifeA4Pages != 200000 {
		t.Errorf("PRN-9614 ExpectedLifeA4Pages = %d, expected 200000", item.ExpectedLifeA4Pages)
	}
	if item.TotalColorSlots != 4 {
		t.Errorf("PRN-9614 TotalColorSlots = %d, expected 4", item.TotalColorSlots)
	}
	if item.ColorSchemeType != "CMYK" {
		t.Errorf("PRN-9614 ColorSchemeType = %q, expected %q", item.ColorSchemeType, "CMYK")
	}
	if techCat, ok := item.TechnicalSpecs["category"].(string); !ok || techCat != "Printer" {
		t.Errorf("PRN-9614 TechnicalSpecs[category] = %v, expected Printer", item.TechnicalSpecs["category"])
	}
	if techPrnCat, ok := item.TechnicalSpecs["printerCategory"].(string); !ok || techPrnCat != "Inkjet" {
		t.Errorf("PRN-9614 TechnicalSpecs[printerCategory] = %v, expected Inkjet", item.TechnicalSpecs["printerCategory"])
	}

	// 3. If connected to DB, verify live DB query for PRN-9614
	if db.DB != nil {
		dbItem, err := getEquipmentByIDFromDB("PRN-9614")
		if err != nil {
			t.Fatalf("getEquipmentByIDFromDB(PRN-9614) failed: %v", err)
		}
		if dbItem.Category != "Printer" {
			t.Errorf("DB PRN-9614 Category = %q, expected %q", dbItem.Category, "Printer")
		}
		if dbItem.PrinterCategory != "Inkjet" {
			t.Errorf("DB PRN-9614 PrinterCategory = %q, expected %q", dbItem.PrinterCategory, "Inkjet")
		}
		if dbItem.Price != 18000000 {
			t.Errorf("DB PRN-9614 Price = %v, expected 18000000", dbItem.Price)
		}
		if dbItem.ExpectedLifeA4Pages != 200000 {
			t.Errorf("DB PRN-9614 ExpectedLifeA4Pages = %d, expected 200000", dbItem.ExpectedLifeA4Pages)
		}
		if dbItem.TotalColorSlots != 4 {
			t.Errorf("DB PRN-9614 TotalColorSlots = %d, expected 4", dbItem.TotalColorSlots)
		}
		if dbItem.ColorSchemeType != "CMYK" {
			t.Errorf("DB PRN-9614 ColorSchemeType = %q, expected %q", dbItem.ColorSchemeType, "CMYK")
		}
	}
}
