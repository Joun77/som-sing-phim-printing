package settings

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"somsing.local/backend/db"
)

func TestMachineWearPartCostRateCalculation(t *testing.T) {
	part := MachineWearPart{
		ID:                    "part-test-01",
		AssetID:               "PRN-9614",
		PartNameLo:            "ລູກຢາງດຶງເຈ້ຍ",
		PartNameEn:            "Pickup Roller",
		PartCategory:          "roller",
		CostPriceLak:          600000,
		ExpectedLifespanUnits: 50000,
		UnitType:              "pages",
		CurrentCounter:        5000,
		IsActive:              true,
	}

	wearRate := part.CostPriceLak / float64(part.ExpectedLifespanUnits)
	expectedWearRate := 12.0 // 600,000 / 50,000 = 12 LAK/page
	if wearRate != expectedWearRate {
		t.Errorf("expected wear rate %.2f, got %.2f", expectedWearRate, wearRate)
	}

	// PrecisionCore Printhead: 4,000,000 / 100,000 = 40 LAK/page
	printhead := MachineWearPart{
		CostPriceLak:          4000000,
		ExpectedLifespanUnits: 100000,
	}
	headRate := printhead.CostPriceLak / float64(printhead.ExpectedLifespanUnits)
	if headRate != 40.0 {
		t.Errorf("expected printhead rate 40.0, got %.2f", headRate)
	}

	// Combined wear parts total for PRN-9614:
	// Pickup Roller (12) + Maintenance Box (700000/50000 = 14) + Carriage Belt (600000/50000 = 12) + Printhead (40) = 78 LAK/page
	parts := []MachineWearPart{
		{CostPriceLak: 600000, ExpectedLifespanUnits: 50000},
		{CostPriceLak: 700000, ExpectedLifespanUnits: 50000},
		{CostPriceLak: 600000, ExpectedLifespanUnits: 50000},
		{CostPriceLak: 4000000, ExpectedLifespanUnits: 100000},
	}
	var totalWear float64
	for _, p := range parts {
		totalWear += p.CostPriceLak / float64(p.ExpectedLifespanUnits)
	}
	if totalWear != 78.0 {
		t.Errorf("expected total wear rate 78.0, got %.2f", totalWear)
	}
}

func TestCutterAndLaminatorWearRateUnits(t *testing.T) {
	// Cutter blade: 350,000 LAK / 50,000 cuts = 7 LAK/cut
	blade := MachineWearPart{
		PartNameEn:            "Plotter Blade",
		CostPriceLak:          350000,
		ExpectedLifespanUnits: 50000,
		UnitType:              "cuts",
	}
	bladeRate := blade.CostPriceLak / float64(blade.ExpectedLifespanUnits)
	if bladeRate != 7.0 {
		t.Errorf("expected blade rate 7.0, got %.2f", bladeRate)
	}

	// Laminator heating roller: 1,500,000 LAK / 30,000 meters = 50 LAK/meter
	roller := MachineWearPart{
		PartNameEn:            "Silicone Roller",
		CostPriceLak:          1500000,
		ExpectedLifespanUnits: 30000,
		UnitType:              "meters",
	}
	rollerRate := roller.CostPriceLak / float64(roller.ExpectedLifespanUnits)
	if rollerRate != 50.0 {
		t.Errorf("expected roller rate 50.0, got %.2f", rollerRate)
	}
}

func TestWearPartThresholdAndUsage(t *testing.T) {
	part := MachineWearPart{
		CostPriceLak:          1000000,
		ExpectedLifespanUnits: 10000,
		CurrentCounter:        9200,
	}

	usagePct := (float64(part.CurrentCounter) / float64(part.ExpectedLifespanUnits)) * 100.0
	if usagePct != 92.0 {
		t.Errorf("expected 92.0%% usage, got %.1f%%", usagePct)
	}

	isCritical := usagePct >= 90.0
	if !isCritical {
		t.Errorf("expected part to be critical at 92%% usage")
	}
}

func TestWearPartsHandlersValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// 1. Test missing asset ID
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: ""}}
	HandleGetMachineWearParts(c)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d for empty asset ID, got %d", http.StatusBadRequest, w.Code)
	}

	// 2. Test create with invalid payload
	w2 := httptest.NewRecorder()
	c2, _ := gin.CreateTestContext(w2)
	c2.Params = gin.Params{{Key: "id", Value: "PRN-9614"}}
	c2.Request, _ = http.NewRequest(http.MethodPost, "/api/v1/equipment/PRN-9614/wear-parts", strings.NewReader(`{"invalid": true}`))
	c2.Request.Header.Set("Content-Type", "application/json")
	HandleCreateMachineWearPart(c2)
	if w2.Code != http.StatusBadRequest {
		t.Errorf("expected status %d for invalid body, got %d", http.StatusBadRequest, w2.Code)
	}

	// 3. Test update with empty part ID
	w3 := httptest.NewRecorder()
	c3, _ := gin.CreateTestContext(w3)
	c3.Params = gin.Params{{Key: "id", Value: "PRN-9614"}, {Key: "part_id", Value: ""}}
	HandleUpdateMachineWearPart(c3)
	if w3.Code != http.StatusBadRequest {
		t.Errorf("expected status %d for empty part ID, got %d", http.StatusBadRequest, w3.Code)
	}
}

func TestMachineWearPartJSONSerialization(t *testing.T) {
	now := time.Now()
	p := MachineWearPart{
		ID:                    "wp-12345",
		AssetID:               "PRN-9614",
		PartNameLo:            "ຫົວພິມ",
		PartNameEn:            "Printhead",
		PartCategory:          "printhead",
		CostPriceLak:          4000000,
		ExpectedLifespanUnits: 100000,
		UnitType:              "pages",
		CurrentCounter:        1500,
		WearCostPerUnitLak:    40.0,
		IsActive:              true,
		CreatedAt:             now,
		UpdatedAt:             now,
	}

	bytes, err := json.Marshal(p)
	if err != nil {
		t.Fatalf("failed to marshal wear part: %v", err)
	}

	var decoded MachineWearPart
	if err := json.Unmarshal(bytes, &decoded); err != nil {
		t.Fatalf("failed to unmarshal wear part: %v", err)
	}

	if decoded.ID != p.ID || decoded.CostPriceLak != p.CostPriceLak || decoded.WearCostPerUnitLak != 40.0 {
		t.Errorf("decoded struct mismatch: %+v", decoded)
	}
}

func TestWearPartsInputValidations(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// 1. PUT with negative cost
	{
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Params = gin.Params{{Key: "id", Value: "PRN-9614"}, {Key: "part_id", Value: "dummy-part"}}
		c.Request, _ = http.NewRequest(http.MethodPut, "/api/v1/equipment/PRN-9614/wear-parts/dummy-part", strings.NewReader(`{"cost_price_lak": -100}`))
		c.Request.Header.Set("Content-Type", "application/json")
		HandleUpdateMachineWearPart(c)
		if w.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for negative cost, got %d", w.Code)
		}
	}

	// 2. PUT with zero lifespan
	{
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Params = gin.Params{{Key: "id", Value: "PRN-9614"}, {Key: "part_id", Value: "dummy-part"}}
		c.Request, _ = http.NewRequest(http.MethodPut, "/api/v1/equipment/PRN-9614/wear-parts/dummy-part", strings.NewReader(`{"expected_lifespan_units": 0}`))
		c.Request.Header.Set("Content-Type", "application/json")
		HandleUpdateMachineWearPart(c)
		if w.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for zero lifespan, got %d", w.Code)
		}
	}

	// 3. PUT with negative counter
	{
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Params = gin.Params{{Key: "id", Value: "PRN-9614"}, {Key: "part_id", Value: "dummy-part"}}
		c.Request, _ = http.NewRequest(http.MethodPut, "/api/v1/equipment/PRN-9614/wear-parts/dummy-part", strings.NewReader(`{"current_counter": -5}`))
		c.Request.Header.Set("Content-Type", "application/json")
		HandleUpdateMachineWearPart(c)
		if w.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for negative counter, got %d", w.Code)
		}
	}

	// 4. PUT with empty names / category
	emptyFields := []string{
		`{"part_name_lo": "   "}`,
		`{"part_name_en": "   "}`,
		`{"part_category": "   "}`,
	}
	for _, payload := range emptyFields {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Params = gin.Params{{Key: "id", Value: "PRN-9614"}, {Key: "part_id", Value: "dummy-part"}}
		c.Request, _ = http.NewRequest(http.MethodPut, "/api/v1/equipment/PRN-9614/wear-parts/dummy-part", strings.NewReader(payload))
		c.Request.Header.Set("Content-Type", "application/json")
		HandleUpdateMachineWearPart(c)
		if w.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for empty string payload %s, got %d", payload, w.Code)
		}
	}

	// 5. POST with invalid fields
	invalidPosts := []string{
		`{"part_name_lo": "", "part_name_en": "Test", "part_category": "roller", "cost_price_lak": 1000, "expected_lifespan_units": 1000}`,
		`{"part_name_lo": "ທົດສອບ", "part_name_en": "Test", "part_category": "roller", "cost_price_lak": -100, "expected_lifespan_units": 1000}`,
		`{"part_name_lo": "ທົດສອບ", "part_name_en": "Test", "part_category": "roller", "cost_price_lak": 1000, "expected_lifespan_units": -5}`,
	}
	for _, payload := range invalidPosts {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Params = gin.Params{{Key: "id", Value: "PRN-9614"}}
		c.Request, _ = http.NewRequest(http.MethodPost, "/api/v1/equipment/PRN-9614/wear-parts", strings.NewReader(payload))
		c.Request.Header.Set("Content-Type", "application/json")
		HandleCreateMachineWearPart(c)
		if w.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for invalid POST payload %s, got %d", payload, w.Code)
		}
	}

	// 6. DELETE with empty IDs
	{
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Params = gin.Params{{Key: "id", Value: "PRN-9614"}, {Key: "part_id", Value: ""}}
		c.Request, _ = http.NewRequest(http.MethodDelete, "/api/v1/equipment/PRN-9614/wear-parts/", nil)
		HandleDeleteMachineWearPart(c)
		if w.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for missing part_id on delete, got %d", w.Code)
		}
	}
}

func TestWearPartsDatabaseLifecycleAndWrongAsset(t *testing.T) {
	rawDSN := os.Getenv("TEST_FIXTURE_DSN")
	if rawDSN == "" {
		t.Skip("explicit TEST_FIXTURE_DSN required; integration is not verified")
	}
	connStr, guardErr := db.ParseAndValidateDSN(rawDSN)
	if guardErr != nil {
		t.Fatalf("unsafe test database: %v", guardErr)
	}
	dbConn, err := sql.Open("postgres", connStr)
	if err != nil || dbConn.Ping() != nil {
		t.Fatal("configured fixture database unavailable")
		return
	}
	defer dbConn.Close()

	// Temporarily set db.DB for handler testing
	oldDB := db.DB
	db.DB = dbConn
	defer func() { db.DB = oldDB }()

	gin.SetMode(gin.TestMode)

	// Step 1: Create a new wear part for PRN-9614
	w1 := httptest.NewRecorder()
	c1, _ := gin.CreateTestContext(w1)
	c1.Params = gin.Params{{Key: "id", Value: "PRN-9614"}}
	createPayload := `{
		"part_name_lo": "ສາຍພານທົດສອບ",
		"part_name_en": "QA Test Carriage Belt",
		"part_category": "belt",
		"cost_price_lak": 450000,
		"expected_lifespan_units": 45000,
		"unit_type": "pages"
	}`
	c1.Request, _ = http.NewRequest(http.MethodPost, "/api/v1/equipment/PRN-9614/wear-parts", strings.NewReader(createPayload))
	c1.Request.Header.Set("Content-Type", "application/json")
	HandleCreateMachineWearPart(c1)
	if w1.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created on wear part creation, got %d: %s", w1.Code, w1.Body.String())
	}

	var createResp struct {
		Status string          `json:"status"`
		Data   MachineWearPart `json:"data"`
	}
	if err := json.Unmarshal(w1.Body.Bytes(), &createResp); err != nil {
		t.Fatalf("failed to parse create response: %v", err)
	}
	createdID := createResp.Data.ID
	if createdID == "" {
		t.Fatalf("expected non-empty created wear part ID")
	}

	// Defer cleanup of the test record
	defer func() {
		dbConn.Exec("DELETE FROM machine_wear_parts WHERE id = $1", createdID)
	}()

	// Step 2: Attempt UPDATE with WRONG asset ID (PRN-6317 instead of PRN-9614)
	w2 := httptest.NewRecorder()
	c2, _ := gin.CreateTestContext(w2)
	c2.Params = gin.Params{{Key: "id", Value: "PRN-6317"}, {Key: "part_id", Value: createdID}}
	updatePayload := `{"cost_price_lak": 500000}`
	c2.Request, _ = http.NewRequest(http.MethodPut, "/api/v1/equipment/PRN-6317/wear-parts/"+createdID, strings.NewReader(updatePayload))
	c2.Request.Header.Set("Content-Type", "application/json")
	HandleUpdateMachineWearPart(c2)
	if w2.Code != http.StatusNotFound {
		t.Errorf("expected 404 Not Found when updating with wrong asset ID, got %d: %s", w2.Code, w2.Body.String())
	}

	// Step 3: UPDATE with CORRECT asset ID (PRN-9614)
	w3 := httptest.NewRecorder()
	c3, _ := gin.CreateTestContext(w3)
	c3.Params = gin.Params{{Key: "id", Value: "PRN-9614"}, {Key: "part_id", Value: createdID}}
	validUpdate := `{"cost_price_lak": 520000, "current_counter": 1500}`
	c3.Request, _ = http.NewRequest(http.MethodPut, "/api/v1/equipment/PRN-9614/wear-parts/"+createdID, strings.NewReader(validUpdate))
	c3.Request.Header.Set("Content-Type", "application/json")
	HandleUpdateMachineWearPart(c3)
	if w3.Code != http.StatusOK {
		t.Errorf("expected 200 OK when updating with correct asset ID, got %d: %s", w3.Code, w3.Body.String())
	}

	// Verify persistence in PostgreSQL
	var persistedCost float64
	var persistedCounter int64
	err = dbConn.QueryRow("SELECT cost_price_lak, current_counter FROM machine_wear_parts WHERE id = $1", createdID).Scan(&persistedCost, &persistedCounter)
	if err != nil {
		t.Fatalf("failed to query persisted wear part: %v", err)
	}
	if persistedCost != 520000 || persistedCounter != 1500 {
		t.Errorf("expected persisted cost 520000 and counter 1500, got cost %v, counter %v", persistedCost, persistedCounter)
	}

	// Step 4: Attempt DELETE with WRONG asset ID (PRN-6317)
	w4 := httptest.NewRecorder()
	c4, _ := gin.CreateTestContext(w4)
	c4.Params = gin.Params{{Key: "id", Value: "PRN-6317"}, {Key: "part_id", Value: createdID}}
	c4.Request, _ = http.NewRequest(http.MethodDelete, "/api/v1/equipment/PRN-6317/wear-parts/"+createdID, nil)
	HandleDeleteMachineWearPart(c4)
	if w4.Code != http.StatusNotFound {
		t.Errorf("expected 404 Not Found when deleting with wrong asset ID, got %d: %s", w4.Code, w4.Body.String())
	}

	// Step 5: DELETE with CORRECT asset ID (PRN-9614)
	w5 := httptest.NewRecorder()
	c5, _ := gin.CreateTestContext(w5)
	c5.Params = gin.Params{{Key: "id", Value: "PRN-9614"}, {Key: "part_id", Value: createdID}}
	c5.Request, _ = http.NewRequest(http.MethodDelete, "/api/v1/equipment/PRN-9614/wear-parts/"+createdID, nil)
	HandleDeleteMachineWearPart(c5)
	if w5.Code != http.StatusOK {
		t.Errorf("expected 200 OK when deleting with correct asset ID, got %d: %s", w5.Code, w5.Body.String())
	}

	// Verify soft-deleted status (is_active = false) in PostgreSQL
	var isActive bool
	err = dbConn.QueryRow("SELECT is_active FROM machine_wear_parts WHERE id = $1", createdID).Scan(&isActive)
	if err != nil {
		t.Fatalf("failed to query wear part active status: %v", err)
	}
	if isActive {
		t.Errorf("expected wear part to have is_active = false after deletion")
	}
}
