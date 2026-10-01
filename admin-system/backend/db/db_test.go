package db

import (
	"database/sql"
	"os"
	"strings"
	"testing"
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
