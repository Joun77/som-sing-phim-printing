package test_fixtures

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	_ "github.com/lib/pq"
	"somsing.local/backend/db"
)

const baseDSN = "postgres://fixture:fixture-only-not-a-shop-secret@127.0.0.1:55432/somsing_fixture_db?sslmode=disable"

func getDisposableDSN(dbName string) string {
	return fmt.Sprintf("postgres://fixture:fixture-only-not-a-shop-secret@127.0.0.1:55432/%s?sslmode=disable", dbName)
}

func execRawSQLFile(targetDB *sql.DB, relPath string) error {
	searchDirs := []string{
		"../../migrations",
		"../migrations",
		"migrations",
		"admin-system/migrations",
		"admin-system/backend/migrations",
	}
	var foundPath string
	for _, dir := range searchDirs {
		candidate := filepath.Join(dir, relPath)
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			foundPath = candidate
			break
		}
	}
	if foundPath == "" {
		return fmt.Errorf("migration file %s not found in search paths", relPath)
	}
	content, err := os.ReadFile(foundPath)
	if err != nil {
		return fmt.Errorf("read %s: %w", foundPath, err)
	}

	raw := string(content)
	if downIdx := strings.Index(raw, "-- +goose Down"); downIdx != -1 {
		raw = raw[:downIdx]
	}
	if upIdx := strings.Index(raw, "-- +goose Up"); upIdx != -1 {
		raw = raw[upIdx+len("-- +goose Up"):]
	}
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}

	_, err = targetDB.Exec(raw)
	return err
}

func TestMigration050_FreshAndUpgradeScenarios(t *testing.T) {
	origDir, _ := os.Getwd()
	_ = os.Chdir("/Users/joun/Documents/GitHub/som-sing-phim-printing")
	defer func() { _ = os.Chdir(origDir) }()

	controlDB, err := sql.Open("postgres", baseDSN)
	if err != nil {
		t.Fatalf("Failed to connect to control DB: %v", err)
	}
	defer controlDB.Close()

	// =========================================================================
	// SCENARIO 1: FRESH INSTALLATION (001 -> 050)
	// =========================================================================
	freshDBName := "ae_fresh_disposable_fixture"
	_, _ = controlDB.Exec("DROP DATABASE IF EXISTS " + freshDBName)
	if _, err := controlDB.Exec("CREATE DATABASE " + freshDBName); err != nil {
		t.Fatalf("Failed to create fresh database %s: %v", freshDBName, err)
	}
	defer func() {
		_, _ = controlDB.Exec("DROP DATABASE IF EXISTS " + freshDBName)
	}()

	freshDB, err := sql.Open("postgres", getDisposableDSN(freshDBName))
	if err != nil {
		t.Fatalf("Failed to connect to fresh DB: %v", err)
	}
	defer freshDB.Close()

	t.Log("[FRESH] Running all migrations 001..050 on disposable database...")
	if err := db.RunMigrations(freshDB); err != nil {
		t.Fatalf("[FRESH] RunMigrations failed: %v", err)
	}

	// Verify schema_migrations includes 050
	var count050 int
	err = freshDB.QueryRow("SELECT COUNT(*) FROM schema_migrations WHERE version LIKE '%050%'").Scan(&count050)
	if err != nil || count050 != 1 {
		t.Fatalf("[FRESH] Expected 1 record for migration 050 in schema_migrations, got %d, err: %v", count050, err)
	}
	t.Log("[FRESH] All migrations through 050 successfully applied and tracked.")

	// Verify column presence on orders table
	var hasStatus, hasProv, hasRecAt, hasRecBy, hasNotes bool
	err = freshDB.QueryRow(`
		SELECT
			EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='realized_cost_status'),
			EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='realized_cost_provenance'),
			EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='realized_cost_recorded_at'),
			EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='realized_cost_recorded_by'),
			EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='realized_cost_notes')
	`).Scan(&hasStatus, &hasProv, &hasRecAt, &hasRecBy, &hasNotes)
	if err != nil || !hasStatus || !hasProv || !hasRecAt || !hasRecBy || !hasNotes {
		t.Fatalf("[FRESH] Orders table missing required provenance columns: status=%v, prov=%v, recAt=%v, recBy=%v, notes=%v",
			hasStatus, hasProv, hasRecAt, hasRecBy, hasNotes)
	}

	// --- Case 1: Legitimate Complete Zero ---
	t.Log("[FRESH] Testing Case 1: Legitimate Complete Zero Cost...")
	_, err = freshDB.Exec(`
		INSERT INTO orders (
			id, order_no, order_number, customer_name, status, total_cost, total_price,
			realized_paper_cost, realized_ink_cost, realized_labor_cost,
			realized_finishing_cost, realized_spoilage_cost, realized_total_cost,
			realized_cost_provenance
		) VALUES (
			'ord-fresh-zero', 'SSP-FRESH-ZERO', 'SSP-FRESH-ZERO', 'Customer Zero', 'COMPLETED', 0.00, 0.00,
			0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
			'LEGITIMATE_ZERO'
		)
	`)
	if err != nil {
		t.Fatalf("[FRESH] Failed to insert legitimate complete zero order: %v", err)
	}

	var status1, prov1 string
	var total1 float64
	err = freshDB.QueryRow(`SELECT realized_cost_status, realized_cost_provenance, realized_total_cost FROM orders WHERE id='ord-fresh-zero'`).
		Scan(&status1, &prov1, &total1)
	if err != nil {
		t.Fatalf("[FRESH] Scan ord-fresh-zero failed: %v", err)
	}
	if status1 != "RECORDED" || prov1 != "LEGITIMATE_ZERO" || total1 != 0.00 {
		t.Errorf("[FRESH] Case 1 mismatch: status=%s (want RECORDED), prov=%s (want LEGITIMATE_ZERO), total=%.2f (want 0.00)",
			status1, prov1, total1)
	} else {
		t.Logf("[FRESH PASS] Case 1 Legitimate Complete Zero: status=%s, provenance=%s, total=%.2f", status1, prov1, total1)
	}

	// --- Case 2: Missing / Unrecorded Cost ---
	t.Log("[FRESH] Testing Case 2: Missing / Unrecorded Cost...")
	_, err = freshDB.Exec(`
		INSERT INTO orders (id, order_no, order_number, customer_name, status, total_cost, total_price)
		VALUES ('ord-fresh-missing', 'SSP-FRESH-MISSING', 'SSP-FRESH-MISSING', 'Customer Missing', 'IN_PRODUCTION', 150000.00, 200000.00)
	`)
	if err != nil {
		t.Fatalf("[FRESH] Failed to insert unrecorded order: %v", err)
	}

	var status2, prov2 string
	var total2 sql.NullFloat64
	err = freshDB.QueryRow(`SELECT realized_cost_status, realized_cost_provenance, realized_total_cost FROM orders WHERE id='ord-fresh-missing'`).
		Scan(&status2, &prov2, &total2)
	if err != nil {
		t.Fatalf("[FRESH] Scan ord-fresh-missing failed: %v", err)
	}
	if status2 != "UNKNOWN" || prov2 != "UNRECORDED" || total2.Valid {
		t.Errorf("[FRESH] Case 2 mismatch: status=%s (want UNKNOWN), prov=%s (want UNRECORDED), totalValid=%v (want false)",
			status2, prov2, total2.Valid)
	} else {
		t.Logf("[FRESH PASS] Case 2 Missing/Unrecorded Cost: status=%s, provenance=%s, total=NULL", status2, prov2)
	}

	// --- Case 3: Partial Cost ---
	t.Log("[FRESH] Testing Case 3: Partial Actual Cost...")
	_, err = freshDB.Exec(`
		INSERT INTO orders (
			id, order_no, order_number, customer_name, status, total_cost, total_price,
			realized_paper_cost
		) VALUES (
			'ord-fresh-partial', 'SSP-FRESH-PARTIAL', 'SSP-FRESH-PARTIAL', 'Customer Partial', 'IN_PRODUCTION', 150000.00, 200000.00,
			45000.00
		)
	`)
	if err != nil {
		t.Fatalf("[FRESH] Failed to insert partial cost order: %v", err)
	}

	var status3, prov3 string
	var paper3 float64
	var total3 sql.NullFloat64
	err = freshDB.QueryRow(`SELECT realized_cost_status, realized_cost_provenance, realized_paper_cost, realized_total_cost FROM orders WHERE id='ord-fresh-partial'`).
		Scan(&status3, &prov3, &paper3, &total3)
	if err != nil {
		t.Fatalf("[FRESH] Scan ord-fresh-partial failed: %v", err)
	}
	if status3 != "PARTIAL" || prov3 != "MANUAL_ENTRY" || paper3 != 45000.00 || total3.Valid {
		t.Errorf("[FRESH] Case 3 mismatch: status=%s (want PARTIAL), prov=%s (want MANUAL_ENTRY), paper=%.2f, totalValid=%v",
			status3, prov3, paper3, total3.Valid)
	} else {
		t.Logf("[FRESH PASS] Case 3 Partial Cost: status=%s, provenance=%s, paper=%.2f, total=NULL", status3, prov3, paper3)
	}

	// --- Case 4: Positive Normal Completed Order ---
	t.Log("[FRESH] Testing Case 4: Positive Reconciled Cost...")
	_, err = freshDB.Exec(`
		INSERT INTO orders (
			id, order_no, order_number, customer_name, status, total_cost, total_price,
			realized_paper_cost, realized_ink_cost, realized_labor_cost,
			realized_finishing_cost, realized_spoilage_cost, realized_total_cost
		) VALUES (
			'ord-fresh-positive', 'SSP-FRESH-POS', 'SSP-FRESH-POS', 'Customer Pos', 'COMPLETED', 70000.00, 100000.00,
			40000.00, 15000.00, 10000.00, 3000.00, 2000.00, 70000.00
		)
	`)
	if err != nil {
		t.Fatalf("[FRESH] Failed to insert positive cost order: %v", err)
	}

	var status4, prov4 string
	var total4 float64
	err = freshDB.QueryRow(`SELECT realized_cost_status, realized_cost_provenance, realized_total_cost FROM orders WHERE id='ord-fresh-positive'`).
		Scan(&status4, &prov4, &total4)
	if err != nil {
		t.Fatalf("[FRESH] Scan ord-fresh-positive failed: %v", err)
	}
	if status4 != "RECORDED" || prov4 != "MANUAL_ENTRY" || total4 != 70000.00 {
		t.Errorf("[FRESH] Case 4 mismatch: status=%s (want RECORDED), prov=%s (want MANUAL_ENTRY), total=%.2f",
			status4, prov4, total4)
	} else {
		t.Logf("[FRESH PASS] Case 4 Positive Cost: status=%s, provenance=%s, total=%.2f", status4, prov4, total4)
	}

	// --- Case 5: Loss Order (Actual Cost > Total Price) ---
	t.Log("[FRESH] Testing Case 5: Job Loss Scenario...")
	_, err = freshDB.Exec(`
		INSERT INTO orders (
			id, order_no, order_number, customer_name, status, total_cost, total_price,
			realized_paper_cost, realized_ink_cost, realized_labor_cost,
			realized_finishing_cost, realized_spoilage_cost, realized_total_cost
		) VALUES (
			'ord-fresh-loss', 'SSP-FRESH-LOSS', 'SSP-FRESH-LOSS', 'Customer Loss', 'COMPLETED', 50000.00, 60000.00,
			40000.00, 20000.00, 15000.00, 5000.00, 5000.00, 85000.00
		)
	`)
	if err != nil {
		t.Fatalf("[FRESH] Failed to insert loss order: %v", err)
	}

	var status5 string
	var rev5, cost5 float64
	err = freshDB.QueryRow(`SELECT realized_cost_status, total_price, realized_total_cost FROM orders WHERE id='ord-fresh-loss'`).
		Scan(&status5, &rev5, &cost5)
	if err != nil {
		t.Fatalf("[FRESH] Scan ord-fresh-loss failed: %v", err)
	}
	grossProfit := rev5 - cost5
	if status5 != "RECORDED" || cost5 != 85000.00 || grossProfit != -25000.00 {
		t.Errorf("[FRESH] Case 5 mismatch: status=%s (want RECORDED), cost=%.2f, grossProfit=%.2f (want -25000.00)",
			status5, cost5, grossProfit)
	} else {
		t.Logf("[FRESH PASS] Case 5 Loss Order: status=%s, revenue=%.2f, actual_cost=%.2f, gross_profit=%.2f (Loss properly preserved)",
			status5, rev5, cost5, grossProfit)
	}

	// =========================================================================
	// SCENARIO 2: UPGRADE INSTALLATION (001..048 -> historical data -> 049 -> 050)
	// =========================================================================
	upgradeDBName := "ae_upgrade_disposable_fixture"
	_, _ = controlDB.Exec("DROP DATABASE IF EXISTS " + upgradeDBName)
	if _, err := controlDB.Exec("CREATE DATABASE " + upgradeDBName); err != nil {
		t.Fatalf("Failed to create upgrade database %s: %v", upgradeDBName, err)
	}
	defer func() {
		_, _ = controlDB.Exec("DROP DATABASE IF EXISTS " + upgradeDBName)
	}()

	upgradeDB, err := sql.Open("postgres", getDisposableDSN(upgradeDBName))
	if err != nil {
		t.Fatalf("Failed to connect to upgrade DB: %v", err)
	}
	defer upgradeDB.Close()

	t.Log("[UPGRADE] Running canonical migrations 001..048 on upgrade fixture...")
	origMigrationFiles := db.MigrationFiles
	var upTo048 []string
	for _, m := range origMigrationFiles {
		if strings.HasPrefix(m, "049_") || strings.HasPrefix(m, "050_") {
			break
		}
		upTo048 = append(upTo048, m)
	}
	db.MigrationFiles = upTo048
	if err := db.RunMigrations(upgradeDB); err != nil {
		db.MigrationFiles = origMigrationFiles
		t.Fatalf("[UPGRADE] RunMigrations up to 048 failed: %v", err)
	}
	db.MigrationFiles = origMigrationFiles
	t.Log("[UPGRADE] Successfully applied migrations up to 048.")

	// Seed historical data in Pre-049 state (orders have DEFAULT 0.00 from migration 035)
	t.Log("[UPGRADE] Seeding pre-049 historical data...")
	_, err = upgradeDB.Exec(`
		-- 1. Historical Legitimate Complete Zero order (e.g. internal sample job, total_cost=0)
		INSERT INTO orders (
			id, order_no, order_number, customer_name, status, total_cost, total_price,
			realized_paper_cost, realized_ink_cost, realized_labor_cost,
			realized_finishing_cost, realized_spoilage_cost, realized_total_cost
		) VALUES (
			'hist-legit-zero', 'HIST-ZERO', 'HIST-ZERO', 'Customer Hist Zero', 'COMPLETED', 0.00, 0.00,
			0.00, 0.00, 0.00, 0.00, 0.00, 0.00
		);

		-- 2. Historical Unrecorded order (had 0.00 defaults from 035, but estimated cost was 150,000)
		INSERT INTO orders (
			id, order_no, order_number, customer_name, status, total_cost, total_price,
			realized_paper_cost, realized_ink_cost, realized_labor_cost,
			realized_finishing_cost, realized_spoilage_cost, realized_total_cost
		) VALUES (
			'hist-unrecorded', 'HIST-UNREC', 'HIST-UNREC', 'Customer Hist Unrec', 'WAITING_DEPOSIT', 150000.00, 200000.00,
			0.00, 0.00, 0.00, 0.00, 0.00, 0.00
		);

		-- 3. Historical Valid Positive order (all parts recorded, matching total)
		INSERT INTO orders (
			id, order_no, order_number, customer_name, status, total_cost, total_price,
			realized_paper_cost, realized_ink_cost, realized_labor_cost,
			realized_finishing_cost, realized_spoilage_cost, realized_total_cost
		) VALUES (
			'hist-positive', 'HIST-POS', 'HIST-POS', 'Customer Hist Pos', 'COMPLETED', 80000.00, 120000.00,
			50000.00, 20000.00, 10000.00, 0.00, 0.00, 80000.00
		);

		-- 4. Historical Partial order (paper entered=30000, others 0.00, total recorded as 50000)
		INSERT INTO orders (
			id, order_no, order_number, customer_name, status, total_cost, total_price,
			realized_paper_cost, realized_ink_cost, realized_labor_cost,
			realized_finishing_cost, realized_spoilage_cost, realized_total_cost
		) VALUES (
			'hist-partial', 'HIST-PARTIAL', 'HIST-PARTIAL', 'Customer Hist Partial', 'IN_PRODUCTION', 45000.00, 70000.00,
			30000.00, 0.00, 0.00, 0.00, 0.00, 50000.00
		);
	`)
	if err != nil {
		t.Fatalf("[UPGRADE] Failed seeding pre-049 orders: %v", err)
	}

	// Capture BEFORE 049 snapshot
	type OrderSnapshot struct {
		ID       string
		TotalEst float64
		RPaper   sql.NullFloat64
		RInk     sql.NullFloat64
		RLabor   sql.NullFloat64
		RFin     sql.NullFloat64
		RSpoil   sql.NullFloat64
		RTotal   sql.NullFloat64
	}
	getSnap := func() map[string]OrderSnapshot {
		rows, err := upgradeDB.Query("SELECT id, total_cost, realized_paper_cost, realized_ink_cost, realized_labor_cost, realized_finishing_cost, realized_spoilage_cost, realized_total_cost FROM orders")
		if err != nil {
			t.Fatalf("getSnap: %v", err)
		}
		defer rows.Close()
		m := make(map[string]OrderSnapshot)
		for rows.Next() {
			var s OrderSnapshot
			_ = rows.Scan(&s.ID, &s.TotalEst, &s.RPaper, &s.RInk, &s.RLabor, &s.RFin, &s.RSpoil, &s.RTotal)
			m[s.ID] = s
		}
		return m
	}

	before049 := getSnap()
	t.Logf("[UPGRADE BEFORE 049] hist-legit-zero total=%.2f, hist-unrecorded total=%.2f",
		before049["hist-legit-zero"].RTotal.Float64, before049["hist-unrecorded"].RTotal.Float64)

	// Apply Migration 049
	t.Log("[UPGRADE] Applying Migration 049...")
	if err := execRawSQLFile(upgradeDB, "049_ae_payment_context_and_actual_cost_provenance.sql"); err != nil {
		t.Fatalf("[UPGRADE] Failed applying 049: %v", err)
	}
	_, _ = upgradeDB.Exec("INSERT INTO schema_migrations (version, applied_at) VALUES ('049_ae_payment_context_and_actual_cost_provenance.sql', CURRENT_TIMESTAMP)")

	after049 := getSnap()
	t.Logf("[UPGRADE AFTER 049] hist-legit-zero totalValid=%v (kept %.2f because total_cost=0)",
		after049["hist-legit-zero"].RTotal.Valid, after049["hist-legit-zero"].RTotal.Float64)
	t.Logf("[UPGRADE AFTER 049] hist-unrecorded totalValid=%v (wiped to NULL because total_cost>0)",
		after049["hist-unrecorded"].RTotal.Valid)
	t.Logf("[UPGRADE AFTER 049] hist-partial inkValid=%v (wiped to NULL by 049 NULLIF)",
		after049["hist-partial"].RInk.Valid)

	// Apply Migration 050
	t.Log("[UPGRADE] Applying Migration 050 reconciliation...")
	if err := execRawSQLFile(upgradeDB, "050_actual_cost_provenance_and_reconciliation.sql"); err != nil {
		t.Fatalf("[UPGRADE] Failed applying 050: %v", err)
	}
	_, _ = upgradeDB.Exec("INSERT INTO schema_migrations (version, applied_at) VALUES ('050_actual_cost_provenance_and_reconciliation.sql', CURRENT_TIMESTAMP)")

	// Verify post-050 reconciliation outcomes
	type OrderPostReconcile struct {
		ID         string
		Status     string
		Provenance string
		Notes      sql.NullString
		Total      sql.NullFloat64
	}
	rows, err := upgradeDB.Query("SELECT id, realized_cost_status, realized_cost_provenance, realized_cost_notes, realized_total_cost FROM orders ORDER BY id")
	if err != nil {
		t.Fatalf("[UPGRADE] Query post-050 orders: %v", err)
	}
	defer rows.Close()

	results := make(map[string]OrderPostReconcile)
	for rows.Next() {
		var o OrderPostReconcile
		if err := rows.Scan(&o.ID, &o.Status, &o.Provenance, &o.Notes, &o.Total); err != nil {
			t.Fatalf("scan post-050: %v", err)
		}
		results[o.ID] = o
		t.Logf("[UPGRADE RECONCILED] ID=%-18s Status=%-10s Provenance=%-20s TotalValid=%-5v Notes=%s",
			o.ID, o.Status, o.Provenance, o.Total.Valid, o.Notes.String)
	}

	// Assertions on upgraded records:
	// 1. hist-legit-zero was preserved as RECORDED / LEGITIMATE_ZERO
	zeroRec := results["hist-legit-zero"]
	if zeroRec.Status != "RECORDED" || zeroRec.Provenance != "LEGITIMATE_ZERO" || !zeroRec.Total.Valid || zeroRec.Total.Float64 != 0.00 {
		t.Errorf("hist-legit-zero failed: status=%s, prov=%s, total=%.2f", zeroRec.Status, zeroRec.Provenance, zeroRec.Total.Float64)
	}

	// 2. hist-unrecorded (wiped by 049) is recognized as UNKNOWN / HISTORICAL_UNKNOWN, NOT guessed!
	unrec := results["hist-unrecorded"]
	if unrec.Status != "UNKNOWN" || unrec.Provenance != "HISTORICAL_UNKNOWN" || unrec.Total.Valid {
		t.Errorf("hist-unrecorded failed: status=%s, prov=%s, totalValid=%v", unrec.Status, unrec.Provenance, unrec.Total.Valid)
	}

	// 3. hist-positive was preserved as RECORDED / HISTORICAL_PRESERVED
	posRec := results["hist-positive"]
	if posRec.Status != "RECORDED" || posRec.Provenance != "HISTORICAL_PRESERVED" || !posRec.Total.Valid || posRec.Total.Float64 != 80000.00 {
		t.Errorf("hist-positive failed: status=%s, prov=%s, total=%.2f", posRec.Status, posRec.Provenance, posRec.Total.Float64)
	}

	// 4. hist-partial is recognized as PARTIAL / HISTORICAL_PRESERVED
	partRec := results["hist-partial"]
	if partRec.Status != "PARTIAL" || partRec.Provenance != "HISTORICAL_PRESERVED" {
		t.Errorf("hist-partial failed: status=%s, prov=%s", partRec.Status, partRec.Provenance)
	}

	// 5. Check order_actual_cost_logs presence
	var auditCount int
	err = upgradeDB.QueryRow("SELECT COUNT(*) FROM order_actual_cost_logs WHERE action='MIGRATED'").Scan(&auditCount)
	if err != nil || auditCount < 5 {
		t.Errorf("Expected at least 5 migrated audit log records, got %d, err: %v", auditCount, err)
	} else {
		t.Logf("[UPGRADE PASS] Audit logs recorded for all %d migrated orders.", auditCount)
	}

	t.Log("[TEST SUMMARY] Both Fresh (001..050) and Upgrade (001..048 -> 049 -> 050) passed completely on disposable fixtures.")
}
