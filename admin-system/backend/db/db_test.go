package db

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestExtractUpSection(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name: "Goose file with both Up and Down",
			input: `-- +goose Up
CREATE TABLE test_table (id INT PRIMARY KEY);
-- +goose Down
DROP TABLE test_table;`,
			expected: "CREATE TABLE test_table (id INT PRIMARY KEY);",
		},
		{
			name: "Goose file without Up marker but with Down marker",
			input: `CREATE TABLE test_table (id INT PRIMARY KEY);
-- +goose Down
DROP TABLE test_table;`,
			expected: "CREATE TABLE test_table (id INT PRIMARY KEY);",
		},
		{
			name: "Standard SQL without any Goose markers",
			input: `CREATE TABLE test_table (id INT PRIMARY KEY);
CREATE INDEX idx_test ON test_table(id);`,
			expected: `CREATE TABLE test_table (id INT PRIMARY KEY);
CREATE INDEX idx_test ON test_table(id);`,
		},
		{
			name: "Migration 001 snippet with DROP TABLE in Down",
			input: `-- +goose Up
CREATE TABLE IF NOT EXISTS printers (asset_id VARCHAR(50) PRIMARY KEY);
-- +goose Down
DROP TABLE IF EXISTS printers CASCADE;`,
			expected: "CREATE TABLE IF NOT EXISTS printers (asset_id VARCHAR(50) PRIMARY KEY);",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := extractUpSection(tc.input)
			if strings.TrimSpace(result) != strings.TrimSpace(tc.expected) {
				t.Fatalf("extractUpSection mismatch.\nGot: %q\nWant: %q", result, tc.expected)
			}
			if strings.Contains(result, "DROP TABLE") {
				t.Fatalf("extractUpSection must NEVER contain DROP TABLE from goose Down! Got: %s", result)
			}
		})
	}
}

func TestVerifyLegacyBaseline_Evaluation(t *testing.T) {
	// If PostgreSQL is available, verify live baseline resolution
	rawDSN := os.Getenv("TEST_FIXTURE_DSN")
	if rawDSN == "" {
		t.Skip("explicit TEST_FIXTURE_DSN required; integration is not verified")
	}
	connStr, guardErr := ParseAndValidateDSN(rawDSN)
	if guardErr != nil {
		t.Fatalf("unsafe test database: %v", guardErr)
	}
	db, err := sql.Open("postgres", connStr)
	if err != nil || db.Ping() != nil {
		t.Fatal("configured fixture database unavailable")
		return
	}
	defer db.Close()

	tests := []struct {
		version      string
		wantBaseline bool
	}{
		{version: "003_add_equipment_specs_labor_modes.sql", wantBaseline: true},
		{version: "006_convert_floats_to_decimal.sql", wantBaseline: true},
		{version: "016_predictive_maintenance.sql", wantBaseline: true},
		{version: "009_order_printer_channel_and_finishing_linking.sql", wantBaseline: false},
		{version: "036_spare_parts_and_wear_part_logs.sql", wantBaseline: false},
		{version: "999_unknown_migration.sql", wantBaseline: false},
	}

	for _, tt := range tests {
		canBaseline, reason := verifyLegacyBaseline(db, tt.version)
		if canBaseline != tt.wantBaseline {
			t.Errorf("verifyLegacyBaseline(%q) = %v (reason: %q), want %v",
				tt.version, canBaseline, reason, tt.wantBaseline)
		}
	}
}

func TestMigrationSequence_035Precedes036(t *testing.T) {
	idx035 := -1
	idx036 := -1

	for i, filename := range MigrationFiles {
		if filename == "035_create_system_lookups_and_machinery_wear_parts.sql" {
			idx035 = i
		}
		if filename == "036_spare_parts_and_wear_part_logs.sql" {
			idx036 = i
		}
	}

	if idx035 == -1 {
		t.Fatalf("MigrationFiles must include 035_create_system_lookups_and_machinery_wear_parts.sql")
	}
	if idx036 == -1 {
		t.Fatalf("MigrationFiles must include 036_spare_parts_and_wear_part_logs.sql")
	}
	if idx035 >= idx036 {
		t.Fatalf("Expected 035 (index %d) to strictly precede 036 (index %d) in MigrationFiles", idx035, idx036)
	}
}

func TestMigration009_NoUUIDMismatch(t *testing.T) {
	// Verify 009 migration definition does not contain 'order_item_id UUID'
	dirs := []string{
		"../../admin-system/migrations",
		"../migrations",
		"../../migrations",
		"migrations",
	}

	var content string
	for _, dir := range dirs {
		p := dir + "/009_order_printer_channel_and_finishing_linking.sql"
		sqlBytes, err := os.ReadFile(p)
		if err == nil {
			content = string(sqlBytes)
			break
		}
	}

	if content == "" {
		t.Skip("Could not locate 009 migration file for content inspection")
		return
	}

	if strings.Contains(content, "order_item_id UUID") {
		t.Errorf("009 migration still contains 'order_item_id UUID', which causes FK type mismatch with order_items.id (VARCHAR)")
	}

	if !strings.Contains(content, "order_item_id VARCHAR(100)") {
		t.Errorf("009 migration expected to contain 'order_item_id VARCHAR(100)'")
	}
}

func TestRunMigrations_LiveDB_CleanNoPending(t *testing.T) {
	rawDSN := os.Getenv("TEST_FIXTURE_DSN")
	if rawDSN == "" {
		t.Skip("explicit TEST_FIXTURE_DSN required; integration is not verified")
	}
	connStr, guardErr := ParseAndValidateDSN(rawDSN)
	if guardErr != nil {
		t.Fatalf("unsafe test database: %v", guardErr)
	}
	db, err := sql.Open("postgres", connStr)
	if err != nil || db.Ping() != nil {
		t.Fatal("configured fixture database unavailable")
		return
	}
	defer db.Close()

	// RunMigrations should now execute cleanly and return nil (no pending/failed migrations)
	err = RunMigrations(db)
	if err != nil {
		t.Fatalf("Expected RunMigrations to succeed with 0 pending migrations, got: %v", err)
	}

	// Verify all MigrationFiles are recorded in schema_migrations
	for _, version := range MigrationFiles {
		var recorded bool
		err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = $1)", version).Scan(&recorded)
		if err != nil || !recorded {
			t.Errorf("Migration %s is missing from schema_migrations table", version)
		}
	}

	// Verify critical tables created by 009, 035, 036 actually exist in database
	tablesToCheck := []string{
		"order_item_printers",
		"order_printer_color_channels",
		"order_item_finishing_assets",
		"system_lookups",
		"machine_wear_parts",
		"machine_wear_part_logs",
		"equipment_specs",
		"maintenance_tickets",
		"chart_of_accounts",
		"journal_entries",
		"journal_lines",
		"expense_records",
		"accounts_payable",
	}
	for _, tbl := range tablesToCheck {
		var tableExists bool
		err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = $1)", tbl).Scan(&tableExists)
		if err != nil || !tableExists {
			t.Errorf("Expected table %s to exist in PostgreSQL, but it does not", tbl)
		}
	}

	// Verify materials.assigned_printer_id was added by 036
	var hasCol bool
	err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'assigned_printer_id')").Scan(&hasCol)
	if err != nil || !hasCol {
		t.Errorf("Expected column materials.assigned_printer_id to exist in PostgreSQL, but it does not")
	}
}

func TestMigration043_UniquePartialIndex(t *testing.T) {
	// Verify 043 migration correctly implements a partial unique index without inline UNIQUE
	dirs := []string{
		"../../admin-system/migrations",
		"../migrations",
		"../../migrations",
		"migrations",
	}

	var content string
	for _, dir := range dirs {
		p := dir + "/043_add_public_tracking_token_to_orders.sql"
		sqlBytes, err := os.ReadFile(p)
		if err == nil {
			content = string(sqlBytes)
			break
		}
	}

	if content == "" {
		t.Skip("Could not locate 043 migration file for content inspection")
		return
	}

	if strings.Contains(content, "VARCHAR(64) UNIQUE") {
		t.Errorf("043 migration contains inline 'VARCHAR(64) UNIQUE' which prevents multiple legacy empty strings")
	}

	if !strings.Contains(content, "CREATE UNIQUE INDEX") || !strings.Contains(content, "WHERE public_tracking_token IS NOT NULL AND public_tracking_token !=") {
		t.Errorf("043 migration is missing the partial unique index definition required to allow duplicate empty strings while preventing duplicate non-empty tokens")
	}
}

// Each compatibility fixture has an explicit guarded DSN and a generated owned schema.
func migrationCompatibilityDB(t *testing.T, includePublic bool) *sql.DB {
	t.Helper()
	raw := os.Getenv("TEST_FIXTURE_DSN")
	if raw == "" {
		t.Skip("explicit TEST_FIXTURE_DSN required")
	}
	dsn, err := ParseAndValidateDSN(raw)
	if err != nil {
		t.Fatal(err)
	}
	conn, err := sql.Open("postgres", dsn)
	if err != nil {
		t.Fatal(err)
	}
	conn.SetMaxOpenConns(1)
	var entropy [8]byte
	if _, err := rand.Read(entropy[:]); err != nil {
		conn.Close()
		t.Fatal(err)
	}
	schema := "phase1_migration_" + hex.EncodeToString(entropy[:])
	if _, err := conn.Exec("CREATE SCHEMA " + schema); err != nil {
		conn.Close()
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if _, err := conn.Exec("SET search_path TO public"); err != nil {
			t.Error(err)
		}
		if _, err := conn.Exec("DROP SCHEMA " + schema + " CASCADE"); err != nil {
			t.Error(err)
		}
		if err := conn.Close(); err != nil {
			t.Error(err)
		}
	})
	path := schema
	if includePublic {
		path += ",public"
	}
	if _, err := conn.Exec("SET search_path TO " + path); err != nil {
		t.Fatal(err)
	}
	return conn
}

func migrationSQL(t *testing.T, filename string) string {
	t.Helper()
	for _, directory := range []string{"../migrations", "migrations", "../../migrations"} {
		if raw, err := os.ReadFile(directory + "/" + filename); err == nil {
			return extractUpSection(string(raw))
		}
	}
	t.Fatalf("actual migration file unavailable: %s", filename)
	return ""
}

func migrationExec(t *testing.T, conn *sql.DB, query string, args ...any) {
	t.Helper()
	if _, err := conn.Exec(query, args...); err != nil {
		t.Fatal(err)
	}
}

func TestMigration016_LegacyCompatibility(t *testing.T) {
	actual := migrationSQL(t, "016_predictive_maintenance.sql")
	for _, masters := range [][]string{{"equipment"}, {"printers"}, {"equipment", "printers"}} {
		t.Run(strings.Join(masters, "_and_"), func(t *testing.T) {
			conn := migrationCompatibilityDB(t, false)
			for _, master := range masters {
				migrationExec(t, conn, "CREATE TABLE "+master+"(id text PRIMARY KEY, current_meter int DEFAULT 0); INSERT INTO "+master+" VALUES('historical',321)")
			}
			if ok, _ := verifyLegacyBaseline(conn, "016_predictive_maintenance.sql"); ok {
				t.Fatal("incomplete legacy baseline accepted")
			}
			migrationExec(t, conn, actual)
			migrationExec(t, conn, "INSERT INTO equipment_specs(equipment_id,current_meter) VALUES('historical',321); INSERT INTO maintenance_tickets(id,equipment_id,trigger_reason,status) VALUES('historical-ticket','historical','preserve','RESOLVED')")
			migrationExec(t, conn, actual)
			if ok, reason := verifyLegacyBaseline(conn, "016_predictive_maintenance.sql"); !ok {
				t.Fatalf("complete legacy outcome rejected: %s", reason)
			}
			for _, master := range masters {
				var current, interval, last int
				if err := conn.QueryRow("SELECT current_meter,maintenance_interval_impressions,last_serviced_meter FROM "+master+" WHERE id='historical'").Scan(&current, &interval, &last); err != nil {
					t.Fatal(err)
				}
				if current != 321 || interval != 50000 || last != 0 {
					t.Fatalf("historical meter altered: %d/%d/%d", current, interval, last)
				}
			}
			var count int
			if err := conn.QueryRow("SELECT count(*) FROM maintenance_tickets WHERE id='historical-ticket' AND status='RESOLVED'").Scan(&count); err != nil || count != 1 {
				t.Fatalf("historical ticket lost: %d %v", count, err)
			}
			migrationExec(t, conn, "ALTER TABLE "+masters[0]+" DROP COLUMN last_serviced_meter")
			if ok, _ := verifyLegacyBaseline(conn, "016_predictive_maintenance.sql"); ok {
				t.Fatal("missing master column accepted")
			}
			migrationExec(t, conn, actual)
			migrationExec(t, conn, "ALTER TABLE equipment_specs DROP COLUMN current_meter")
			if ok, _ := verifyLegacyBaseline(conn, "016_predictive_maintenance.sql"); ok {
				t.Fatal("missing specs column accepted")
			}
			t.Log("actual016 repeat preserves nonempty legacy meters/ticket; incomplete outcomes rejected")
		})
	}
	t.Run("no_master_rolls_back", func(t *testing.T) {
		conn := migrationCompatibilityDB(t, false)
		migrationExec(t, conn, "CREATE TABLE equipment_specs(id int); CREATE TABLE maintenance_tickets(id text)")
		if ok, _ := verifyLegacyBaseline(conn, "016_predictive_maintenance.sql"); ok {
			t.Fatal("table names without actual master/columns accepted")
		}
		migrationExec(t, conn, "DROP TABLE equipment_specs; DROP TABLE maintenance_tickets")
		if _, err := conn.Exec(actual); err == nil {
			t.Fatal("absent master should fail truthfully")
		}
		var absent bool
		if err := conn.QueryRow("SELECT to_regclass('equipment_specs') IS NULL AND to_regclass('maintenance_tickets') IS NULL").Scan(&absent); err != nil || !absent {
			t.Fatalf("failed016 left partial schema: %v %v", absent, err)
		}
		if ok, _ := verifyLegacyBaseline(conn, "016_predictive_maintenance.sql"); ok {
			t.Fatal("public schema must not supply unrelated baseline")
		}
	})
}

func TestMigration042_ExistingParentsAndFinance(t *testing.T) {
	conn := migrationCompatibilityDB(t, true)
	if err := RunMigrations(conn); err != nil {
		t.Fatal(err)
	}
	var parents, links, parts int
	if err := conn.QueryRow("SELECT (SELECT count(*) FROM printers),(SELECT count(*) FROM printer_color_link),(SELECT count(*) FROM machine_wear_parts)").Scan(&parents, &links, &parts); err != nil {
		t.Fatal(err)
	}
	if parents != 0 || links != 0 || parts != 0 {
		t.Fatalf("fresh migration fabricated assets/children: %d/%d/%d", parents, links, parts)
	}
	// These synthetic parent rows are test data only; production migration creates none.
	insertPrinter := `INSERT INTO printers(asset_id,serial_number,brand,model,category,color_scheme_type,total_color_slots,expected_life_a4_pages,purchase_date,price_cost,vendor_supplier,warranty_expiry_year,location_dept) VALUES($1,$1,'Fixture','Fixture','Inkjet','CMYK',4,1000000,CURRENT_DATE,100,'Fixture',2027,'Fixture')`
	migrationExec(t, conn, insertPrinter, "PRN-9614")
	migrationExec(t, conn, insertPrinter, "fixture-other")
	migrationExec(t, conn, `INSERT INTO materials(id,sku,name,category,assigned_printer_id,stock_qty) VALUES('fixture-epson','EPSON-008-BK','Epson 008 fixture','Ink',NULL,19),('fixture-brother','LC462XL-BK','Brother fixture','Ink','fixture-other',23),('fixture-other-material','other','Historical material','Equipment','fixture-other',29),('PRN-9614','historical-printer-row','Historical asset record','Equipment',NULL,31); INSERT INTO machine_wear_part_logs(asset_id,material_id,part_name,replacement_reason) VALUES('PRN-9614','PRN-9614','Historical part','preserve')`)
	actual := migrationSQL(t, "042_link_printer_inks_and_clean_material_assets.sql")
	migrationExec(t, conn, actual)
	var epson, brother string
	if err := conn.QueryRow("SELECT (SELECT assigned_printer_id FROM materials WHERE id='fixture-epson'),(SELECT assigned_printer_id FROM materials WHERE id='fixture-brother'),(SELECT count(*) FROM printer_color_link WHERE asset_id='PRN-9614'),(SELECT count(*) FROM machine_wear_parts WHERE asset_id='PRN-9614')").Scan(&epson, &brother, &links, &parts); err != nil {
		t.Fatal(err)
	}
	if epson != "PRN-9614" || brother != "fixture-other" || links != 4 || parts != 4 {
		t.Fatalf("existing/missing parent link result: %s/%s/%d/%d", epson, brother, links, parts)
	}
	migrationExec(t, conn, insertPrinter, "PRN-6317")
	migrationExec(t, conn, actual)
	migrationExec(t, conn, "UPDATE machine_wear_parts SET current_counter=123 WHERE asset_id='PRN-9614'; UPDATE materials SET stock_qty=17 WHERE id='fixture-epson'")
	migrationExec(t, conn, actual)
	var preserved bool
	if err := conn.QueryRow(`SELECT
  (SELECT count(*) FROM printer_color_link)=8 AND (SELECT count(*) FROM machine_wear_parts)=7
  AND (SELECT assigned_printer_id FROM materials WHERE id='fixture-brother')='PRN-6317'
  AND (SELECT stock_qty FROM materials WHERE id='fixture-epson')=17
  AND (SELECT count(*) FROM machine_wear_parts WHERE asset_id='PRN-9614' AND current_counter=123)=4
  AND EXISTS(SELECT 1 FROM materials WHERE id='PRN-9614' AND stock_qty=31)
  AND EXISTS(SELECT 1 FROM machine_wear_part_logs WHERE material_id='PRN-9614' AND replacement_reason='preserve')
  AND EXISTS(SELECT 1 FROM archived_material_assets WHERE id='PRN-9614' AND material_data->>'stock_qty'='31.00')
  AND EXISTS(SELECT 1 FROM materials WHERE id='fixture-other-material' AND stock_qty=29)
  AND (SELECT count(*) FROM printers)=3`).Scan(&preserved); err != nil || !preserved {
		t.Fatalf("042 repeat corrupted history or fabricated parents: %v %v", preserved, err)
	}
	// Actual registered finance DDL: committed historical entry survives repeat; failed FK rolls back.
	var entry string
	if err := conn.QueryRow("INSERT INTO journal_entries(entry_date,description,reference_type,reference_id) VALUES(CURRENT_DATE,'Historical journal','MANUAL','fixture-historical') RETURNING id::text").Scan(&entry); err != nil {
		t.Fatal(err)
	}
	migrationExec(t, conn, "INSERT INTO journal_lines(entry_id,account_id,debit,credit) SELECT $1::uuid,id,12.34,0 FROM chart_of_accounts WHERE code='1100'", entry)
	tx, err := conn.Begin()
	if err != nil {
		t.Fatal(err)
	}
	if _, err = tx.Exec("INSERT INTO journal_entries(entry_date,reference_id) VALUES(CURRENT_DATE,'fixture-rollback')"); err != nil {
		tx.Rollback()
		t.Fatal(err)
	}
	if _, err = tx.Exec("INSERT INTO journal_lines(entry_id,account_id,debit) VALUES('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002',1)"); err == nil {
		tx.Rollback()
		t.Fatal("actual finance FK accepted invalid journal")
	}
	if err = tx.Rollback(); err != nil {
		t.Fatal(err)
	}
	if err = RunMigrations(conn); err != nil {
		t.Fatal(err)
	}
	if err := conn.QueryRow(`SELECT EXISTS(SELECT 1 FROM journal_lines WHERE entry_id=$1::uuid AND debit=12.34) AND NOT EXISTS(SELECT 1 FROM journal_entries WHERE reference_id='fixture-rollback') AND (SELECT count(*) FROM chart_of_accounts)=18 AND (SELECT count(*) FROM schema_migrations)=$2`, entry, len(MigrationFiles)).Scan(&preserved); err != nil || !preserved {
		t.Fatalf("finance history/rollback/registered prerequisites failed: %v %v", preserved, err)
	}
	t.Log("actual44 migration bootstrap; missing/existing parents; history-safe042 repeat; registered finance prerequisites/rollback PASS")
}

func TestPackagedMigrations_RepeatUnchanged(t *testing.T) {
	raw := os.Getenv("TEST_FIXTURE_DSN")
	if raw == "" {
		t.Skip("explicit guarded fixture DSN required")
	}
	dsn, err := ParseAndValidateDSN(raw)
	if err != nil {
		t.Fatal(err)
	}
	conn, err := sql.Open("postgres", dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	state := func() string {
		var snapshot string
		if err := conn.QueryRow(`SELECT string_agg(version || ':' || applied_at::text, ',' ORDER BY version) FROM schema_migrations`).Scan(&snapshot); err != nil {
			t.Fatal(err)
		}
		return snapshot
	}
	before := state()
	if err := RunMigrations(conn); err != nil {
		t.Fatal(err)
	}
	if after := state(); after != before {
		t.Fatal("repeat rewrote migration identities/timestamps")
	}
	var complete bool
	if err := conn.QueryRow("SELECT (SELECT count(*) FROM schema_migrations)=$1 AND (SELECT count(*) FROM chart_of_accounts)=18", len(MigrationFiles)).Scan(&complete); err != nil || !complete {
		t.Fatalf("packaged prerequisite outcome: %v %v", complete, err)
	}
	t.Log("actual packaged44 tracked repeat retains applied timestamps and finance accounts")
}

func TestInitDB_MigrationFailureClosesPool(t *testing.T) {
	conn := migrationCompatibilityDB(t, true)
	var schema string
	if err := conn.QueryRow("SELECT current_schema()").Scan(&schema); err != nil {
		t.Fatal(err)
	}
	migrationExec(t, conn, "ALTER DATABASE somsing_fixture_db SET search_path TO "+schema+",public")
	t.Cleanup(func() { migrationExec(t, conn, "ALTER DATABASE somsing_fixture_db RESET search_path") })
	// Only this owned process/DB exists. Observe actual PostgreSQL client sessions rather than mocks.
	sessions := func() int {
		var count int
		if err := conn.QueryRow("SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND usename=current_user AND pid<>pg_backend_pid()").Scan(&count); err != nil {
			t.Fatal(err)
		}
		return count
	}
	before := sessions()
	previous, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	empty := filepath.Join(t.TempDir(), "a", "b", "c")
	if err := os.MkdirAll(empty, 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(empty); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if err := os.Chdir(previous); err != nil {
			t.Error(err)
		}
	})
	t.Setenv("ENVIRONMENT", "test")
	old := DB
	DB = nil
	t.Cleanup(func() { DB = old })
	got, err := InitDB()
	if got != nil || DB != nil || err == nil || !strings.Contains(err.Error(), "migrations incomplete") {
		t.Fatalf("missing packaged SQL did not stop initialization: %v", err)
	}
	deadline := time.Now().Add(2 * time.Second)
	for sessions() != before && time.Now().Before(deadline) {
		time.Sleep(20 * time.Millisecond)
	}
	if after := sessions(); after != before {
		t.Fatalf("failed initialization leaked PostgreSQL session: %d -> %d", before, after)
	}
	t.Log("actual migration failure returns error/nil pool; server-side PostgreSQL session closes")
}

func TestInitDB_UnavailableFixture(t *testing.T) {
	raw := os.Getenv("TEST_FIXTURE_DSN")
	if raw == "" {
		t.Skip("explicit guarded fixture DSN required")
	}
	dsn, err := ParseAndValidateDSN(raw)
	if err != nil {
		t.Fatal(err)
	}
	u, err := url.Parse(dsn)
	if err != nil {
		t.Fatal(err)
	}
	u.User = url.UserPassword("fixture-invalid-account", "fixture-invalid-password")
	t.Setenv("ENVIRONMENT", "test")
	t.Setenv("TEST_FIXTURE_DSN", u.String())
	old := DB
	DB = nil
	t.Cleanup(func() { DB = old })
	got, err := InitDB()
	if got != nil || DB != nil || err == nil {
		t.Fatal("failed real fixture authentication published a pool")
	}
	t.Log("actual unavailable guarded fixture returns error/nil pool")
}
