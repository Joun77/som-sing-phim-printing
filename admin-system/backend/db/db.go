package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/lib/pq"
)

var DB *sql.DB

// GetDB returns the global PostgreSQL connection instance
func GetDB() *sql.DB {
	return DB
}

// InitDB initializes PostgreSQL connection pool and runs migrations if available.
func InitDB() (*sql.DB, error) {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		host := getEnv("DB_HOST", "127.0.0.1")
		port := getEnv("DB_PORT", "5432")
		user := getEnv("DB_USER", "postgres")
		pass := getEnv("DB_PASSWORD", "postgres")
		name := getEnv("DB_NAME", "somsing_db")
		sslmode := getEnv("DB_SSLMODE", "disable")

		connStr = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
			host, port, user, pass, name, sslmode)
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Printf("[DB WARNING] Failed to open PostgreSQL connection: %v", err)
		return nil, err
	}

	// Connection Pool Configuration
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		log.Printf("[DB WARNING] Could not ping PostgreSQL at %s: %v (Using in-memory fallback)", connStr, err)
		DB = nil
		return nil, err
	}

	log.Println("[DB SUCCESS] Successfully connected to PostgreSQL database!")
	DB = db

	// Auto-run migrations if connected
	if err := RunMigrations(db); err != nil {
		log.Printf("[DB MIGRATION INCOMPLETE] Database has unapplied migrations: %v", err)
	} else {
		log.Println("[DB MIGRATION SUCCESS] All migrations verified and applied.")
	}

	return db, nil
}

// extractUpSection extracts only the UP migration block and strips any goose Down commands
func extractUpSection(rawSQL string) string {
	// 1. If "-- +goose Down" is present, cut off everything starting from that marker
	if downIdx := strings.Index(rawSQL, "-- +goose Down"); downIdx != -1 {
		rawSQL = rawSQL[:downIdx]
	}
	// 2. If "-- +goose Up" is present, cut off everything before that marker
	if upIdx := strings.Index(rawSQL, "-- +goose Up"); upIdx != -1 {
		rawSQL = rawSQL[upIdx+len("-- +goose Up"):]
	}
	return strings.TrimSpace(rawSQL)
}

// MigrationFiles defines the canonical sequence of database migration scripts.
var MigrationFiles = []string{
	"001_master_printer_ink_paper_quotation_spec.sql",
	"002_employees_offcuts_inbound.sql",
	"003_add_equipment_specs_labor_modes.sql",
	"003_genuine_and_compatible_inks.sql",
	"004_audit_logs_and_timestamptz.sql",
	"005_inventory_lots_fifo.sql",
	"006_convert_floats_to_decimal.sql",
	"007_deposit_and_tax_options.sql",
	"008_internal_shipping_tracking.sql",
	"009_order_printer_channel_and_finishing_linking.sql",
	"010_bilingual_books_preflight_and_shop_tracker.sql",
	"012_public_catalog_and_discount_tiers.sql",
	"013_slip_verification.sql",
	"014_paper_price_versioning.sql",
	"015_order_preflight_reports.sql",
	"016_predictive_maintenance.sql",
	"017_couriers_and_payment_methods.sql",
	"018_lao_provinces_and_districts.sql",
	"019_dynamic_categories_and_bilingual_catalog.sql",
	"020_inventory_inbound_fix.sql",
	"021_add_proof_and_branch_columns.sql",
	"022_quotations_enhancement.sql",
	"023_customer_crm_enhancements.sql",
	"024_idempotency_and_order_persistence.sql",
	"025_shop_floor_and_incentives.sql",
	"026_inventory_deduction_ledger.sql",
	"027_digital_proof_tracking.sql",
	"028_add_customer_tier_and_courier.sql",
	"029_customer_categories.sql",
	"030_customer_vip_tiers.sql",
	"031_customer_source_and_staff_rbac.sql",
	"034_order_performance_indexes.sql",
	"035_workflow_templates_and_production_costs.sql",
	"035_create_system_lookups_and_machinery_wear_parts.sql",
	"036_spare_parts_and_wear_part_logs.sql",
	"037_inbound_revisions_and_offcuts_enhancement.sql",
	"038_quotation_templates.sql",
	"039_product_pricing_thresholds.sql",
	"040_production_stage_assignments.sql",
	"041_reconcile_printer_epson_inkjet_spec.sql",
	"042_link_printer_inks_and_clean_material_assets.sql",
}

// verifyLegacyBaseline checks if a legacy migration's intended schema changes
// already have an equivalent, verified outcome in the database.
func verifyLegacyBaseline(db *sql.DB, version string) (bool, string) {
	switch version {
	case "003_add_equipment_specs_labor_modes.sql":
		var hasPrinters, hasLifeCol bool
		err := db.QueryRow(`
			SELECT
				EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'printers'),
				EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'printers' AND column_name = 'expected_life_a4_pages')
		`).Scan(&hasPrinters, &hasLifeCol)
		if err == nil && hasPrinters && hasLifeCol {
			return true, "printers table already contains expected_life_a4_pages and maintenance specs"
		}

	case "006_convert_floats_to_decimal.sql":
		var materialsNumeric, ordersNumeric, quotationsNumeric bool
		err := db.QueryRow(`
			SELECT
				EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'cost_per_purchase_unit' AND data_type = 'numeric'),
				EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_price' AND data_type = 'numeric'),
				EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'total_selling_price' AND data_type = 'numeric')
		`).Scan(&materialsNumeric, &ordersNumeric, &quotationsNumeric)
		if err == nil && materialsNumeric && ordersNumeric && quotationsNumeric {
			return true, "financial columns in materials, orders, and quotations already use numeric decimal precision"
		}

	case "016_predictive_maintenance.sql":
		var hasSpecs, hasTickets bool
		err := db.QueryRow(`
			SELECT
				EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'equipment_specs'),
				EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_tickets')
		`).Scan(&hasSpecs, &hasTickets)
		if err == nil && hasSpecs && hasTickets {
			return true, "tables equipment_specs and maintenance_tickets already exist with required schema"
		}
	}

	return false, ""
}

// RunMigrations executes migration scripts with idempotency tracking, legacy baselining, and error reporting.
func RunMigrations(db *sql.DB) error {
	// 1. Ensure schema_migrations table exists for migration tracking
	initMigrationTableSQL := `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);
	`
	if _, err := db.Exec(initMigrationTableSQL); err != nil {
		log.Printf("[DB MIGRATION ERROR] Failed to create schema_migrations table: %v", err)
		return err
	}

	searchDirs := []string{
		"migrations",
		"../migrations",
		"../../migrations",
		"admin-system/migrations",
		"../admin-system/migrations",
		"../../admin-system/migrations",
	}

	var failedMigrations []string
	var baselinedMigrations []string
	var appliedMigrations []string

	for _, filename := range MigrationFiles {
		version := filename

		// Check if migration has already been applied
		var alreadyApplied bool
		err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = $1)", version).Scan(&alreadyApplied)
		if err == nil && alreadyApplied {
			continue
		}

		// Check if this legacy migration already has proven equivalent outcome in live schema
		if canBaseline, reason := verifyLegacyBaseline(db, version); canBaseline {
			_, recordErr := db.Exec("INSERT INTO schema_migrations (version, applied_at) VALUES ($1, CURRENT_TIMESTAMP) ON CONFLICT (version) DO NOTHING", version)
			if recordErr == nil {
				log.Printf("[DB MIGRATION BASELINE] Migration %s baselined: %s", version, reason)
				baselinedMigrations = append(baselinedMigrations, version)
				continue
			}
			log.Printf("[DB MIGRATION WARNING] Failed to record baseline for %s: %v", version, recordErr)
		}

		// Locate physical file path
		var targetPath string
		for _, dir := range searchDirs {
			candidate := filepath.Join(dir, filename)
			if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
				targetPath = candidate
				break
			}
		}

		if targetPath == "" {
			log.Printf("[DB MIGRATION WARNING] Migration file not found: %s", filename)
			failedMigrations = append(failedMigrations, fmt.Sprintf("%s (file not found)", version))
			continue
		}

		absPath, err := filepath.Abs(targetPath)
		if err != nil {
			failedMigrations = append(failedMigrations, fmt.Sprintf("%s (invalid path)", version))
			continue
		}

		sqlBytes, err := os.ReadFile(absPath)
		if err != nil {
			log.Printf("[DB MIGRATION ERROR] Could not read migration %s: %v", absPath, err)
			failedMigrations = append(failedMigrations, fmt.Sprintf("%s (read error: %v)", version, err))
			continue
		}

		upSQL := extractUpSection(string(sqlBytes))
		if upSQL == "" {
			// Record empty migration as applied
			_, _ = db.Exec("INSERT INTO schema_migrations (version, applied_at) VALUES ($1, CURRENT_TIMESTAMP) ON CONFLICT (version) DO NOTHING", version)
			appliedMigrations = append(appliedMigrations, version)
			continue
		}

		log.Printf("[DB MIGRATION] Executing UP migration script from %s (version: %s)...", absPath, version)
		_, execErr := db.Exec(upSQL)
		if execErr != nil {
			log.Printf("[DB MIGRATION ERROR] Migration %s failed: %v", version, execErr)
			failedMigrations = append(failedMigrations, fmt.Sprintf("%s (exec error: %v)", version, execErr))
		} else {
			_, recordErr := db.Exec("INSERT INTO schema_migrations (version, applied_at) VALUES ($1, CURRENT_TIMESTAMP) ON CONFLICT (version) DO NOTHING", version)
			if recordErr != nil {
				log.Printf("[DB MIGRATION WARNING] Failed to record migration %s in schema_migrations: %v", version, recordErr)
				failedMigrations = append(failedMigrations, fmt.Sprintf("%s (record error: %v)", version, recordErr))
			} else {
				log.Printf("[DB MIGRATION SUCCESS] Applied migration %s", version)
				appliedMigrations = append(appliedMigrations, version)
			}
		}
	}

	if len(failedMigrations) > 0 {
		return fmt.Errorf("migration run incomplete: %d migration(s) failed or unapplied: [%s]",
			len(failedMigrations), strings.Join(failedMigrations, "; "))
	}

	log.Printf("[DB MIGRATION COMPLETE] All checked migrations are in good state (applied: %d, baselined: %d)",
		len(appliedMigrations), len(baselinedMigrations))
	return nil
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists && value != "" {
		return value
	}
	return fallback
}

// RunInTransaction executes a callback within a database transaction.
// It automatically handles Begin, Commit, and Rollback on error or panic.
func RunInTransaction(fn func(tx *sql.Tx) error) error {
	if DB == nil {
		return fmt.Errorf("database connection is not initialized")
	}
	tx, err := DB.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()
	if err := fn(tx); err != nil {
		if rbErr := tx.Rollback(); rbErr != nil {
			log.Printf("[DB TX ROLLBACK ERROR] %v", rbErr)
		}
		return err
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	return nil
}

