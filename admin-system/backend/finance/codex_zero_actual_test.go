package finance

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"somsing.local/backend/db"
)

// TestCodexCompleteZeroActualCost verifies the reproduction test case from Codex
// where an explicitly recorded zero actual cost (all parts non-null 0, total 0)
// is recognized as complete, with gross_profit = 1,000 LAK and profit_margin = 100%.
func TestCodexCompleteZeroActualCost(t *testing.T) {
	old := db.DB
	defer func() { db.DB = old }()
	conn, m, e := sqlmock.New()
	if e != nil {
		t.Fatal(e)
	}
	defer conn.Close()
	db.DB = conn

	cols := []string{"id", "job_id", "customer_name", "revenue", "estimated_cost", "paper", "ink", "labor", "finishing", "spoilage", "total", "created_at"}
	m.ExpectQuery("SELECT").WillReturnRows(sqlmock.NewRows(cols).AddRow("codex-zero", "codex-zero", "Fixture", 1000.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, "2026-10-20"))

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/profit", HandleGetJobProfitability)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/profit", nil))
	if w.Code != 200 {
		t.Fatalf("HTTP%d %s", w.Code, w.Body.String())
	}

	var body struct {
		Data []map[string]any `json:"data"`
	}
	if e = json.Unmarshal(w.Body.Bytes(), &body); e != nil {
		t.Fatalf("decode %s", w.Body.String())
	}
	rows := body.Data
	if len(rows) != 1 {
		t.Fatalf("rows %s", w.Body.String())
	}

	row := rows[0]
	if row["actual_cost_complete"] != true {
		t.Fatalf("Complete explicitly recorded zero costs must remain complete; actual response=%s", w.Body.String())
	}
	if row["actual_cost"] == nil || row["actual_cost"].(float64) != 0.0 {
		t.Fatalf("actual_cost must be 0.0; got %v", row["actual_cost"])
	}
	if row["gross_profit"] == nil || row["gross_profit"].(float64) != 1000.0 {
		t.Fatalf("gross_profit must be 1000.0 for 0 actual cost on 1000 revenue; got %v", row["gross_profit"])
	}
	if row["profit_margin_percent"] == nil || row["profit_margin_percent"].(float64) != 100.0 {
		t.Fatalf("profit_margin_percent must be 100.0%% for 0 actual cost on 1000 revenue; got %v", row["profit_margin_percent"])
	}

	if e = m.ExpectationsWereMet(); e != nil {
		t.Fatal(e)
	}
}

// TestJobProfitability_DistinguishesCompleteFromIncomplete verifies that:
// 1. Fully recorded non-zero actual costs are marked COMPLETE with correct gross profit and margin.
// 2. Missing/NULL actual costs are marked INCOMPLETE and do not finalize actual profit or margin.
// 3. Mismatched component sums are marked INCOMPLETE.
// 4. Negative totals are marked INCOMPLETE.
func TestJobProfitability_DistinguishesCompleteFromIncomplete(t *testing.T) {
	old := db.DB
	defer func() { db.DB = old }()
	conn, m, e := sqlmock.New()
	if e != nil {
		t.Fatal(e)
	}
	defer conn.Close()
	db.DB = conn

	cols := []string{"id", "job_id", "customer_name", "revenue", "estimated_cost", "paper", "ink", "labor", "finishing", "spoilage", "total", "created_at"}
	rows := sqlmock.NewRows(cols).
		// Row 1: Fully recorded positive actual cost: paper=100, ink=50, labor=50, finishing=50, spoilage=50 => total=300, revenue=1000
		AddRow("job-complete-pos", "JOB-01", "Customer A", 1000.0, 250.0, 100.0, 50.0, 50.0, 50.0, 50.0, 300.0, "2026-10-20").
		// Row 2: Incomplete actual cost: paper=100, but ink is NULL (unrecorded)
		AddRow("job-partial-null", "JOB-02", "Customer B", 1000.0, 250.0, 100.0, nil, 50.0, 50.0, 50.0, 250.0, "2026-10-20").
		// Row 3: All components NULL (unrecorded historical order)
		AddRow("job-all-null", "JOB-03", "Customer C", 1000.0, 500.0, nil, nil, nil, nil, nil, nil, "2026-10-20").
		// Row 4: Mismatched components: parts sum=100, but total=300
		AddRow("job-mismatched", "JOB-04", "Customer D", 1000.0, 300.0, 50.0, 50.0, 0.0, 0.0, 0.0, 300.0, "2026-10-20").
		// Row 5: Negative total: total=-50.0
		AddRow("job-negative", "JOB-05", "Customer E", 1000.0, 100.0, 0.0, 0.0, 0.0, 0.0, 0.0, -50.0, "2026-10-20")

	m.ExpectQuery("SELECT").WillReturnRows(rows)

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/profit", HandleGetJobProfitability)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/profit", nil))
	if w.Code != 200 {
		t.Fatalf("HTTP%d %s", w.Code, w.Body.String())
	}

	var body struct {
		Data []JobProfitabilityItem `json:"data"`
	}
	if e = json.Unmarshal(w.Body.Bytes(), &body); e != nil {
		t.Fatalf("decode %s", w.Body.String())
	}
	items := body.Data
	if len(items) != 5 {
		t.Fatalf("expected 5 items, got %d", len(items))
	}

	// 1. Positive complete: actual_cost = 300, complete = true, gross_profit = 700, margin = 70%
	item1 := items[0]
	if !item1.ActualCostComplete || item1.ActualCostStatus != "COMPLETE" {
		t.Errorf("Item 1 must be complete, got complete=%v status=%v", item1.ActualCostComplete, item1.ActualCostStatus)
	}
	if item1.ActualCost == nil || *item1.ActualCost != 300.0 {
		t.Errorf("Item 1 actual_cost expected 300.0, got %v", item1.ActualCost)
	}
	if item1.GrossProfit != 700.0 || item1.ProfitMargin != 70.0 {
		t.Errorf("Item 1 profit/margin expected 700/70%%, got profit=%v margin=%v", item1.GrossProfit, item1.ProfitMargin)
	}

	// 2. Partial null: complete = false, actual_cost = nil, profit = 0, margin = 0
	item2 := items[1]
	if item2.ActualCostComplete || item2.ActualCostStatus != "INCOMPLETE" {
		t.Errorf("Item 2 must be incomplete, got complete=%v status=%v", item2.ActualCostComplete, item2.ActualCostStatus)
	}
	if item2.ActualCost != nil {
		t.Errorf("Item 2 actual_cost must be nil, got %v", item2.ActualCost)
	}
	if item2.GrossProfit != 0 || item2.ProfitMargin != 0 {
		t.Errorf("Item 2 profit/margin must not be finalized, got profit=%v margin=%v", item2.GrossProfit, item2.ProfitMargin)
	}

	// 3. All null: complete = false, actual_cost = nil
	item3 := items[2]
	if item3.ActualCostComplete || item3.ActualCostStatus != "INCOMPLETE" {
		t.Errorf("Item 3 must be incomplete, got complete=%v status=%v", item3.ActualCostComplete, item3.ActualCostStatus)
	}
	if item3.ActualCost != nil {
		t.Errorf("Item 3 actual_cost must be nil, got %v", item3.ActualCost)
	}

	// 4. Mismatched: complete = false
	item4 := items[3]
	if item4.ActualCostComplete || item4.ActualCostStatus != "INCOMPLETE" {
		t.Errorf("Item 4 must be incomplete, got complete=%v status=%v", item4.ActualCostComplete, item4.ActualCostStatus)
	}

	// 5. Negative: complete = false
	item5 := items[4]
	if item5.ActualCostComplete || item5.ActualCostStatus != "INCOMPLETE" {
		t.Errorf("Item 5 must be incomplete, got complete=%v status=%v", item5.ActualCostComplete, item5.ActualCostStatus)
	}

	if e = m.ExpectationsWereMet(); e != nil {
		t.Fatal(e)
	}
}
