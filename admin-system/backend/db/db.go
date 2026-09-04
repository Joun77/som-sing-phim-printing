package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
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
		log.Printf("[DB MIGRATION WARNING] Auto-migration error: %v", err)
	}

	return db, nil
}

// RunMigrations executes migration scripts found in the migrations folder
func RunMigrations(db *sql.DB) error {
	migrationFiles := []string{
		"../migrations/001_master_printer_ink_paper_quotation_spec.sql",
		"migrations/001_master_printer_ink_paper_quotation_spec.sql",
		"../migrations/002_employees_offcuts_inbound.sql",
		"migrations/002_employees_offcuts_inbound.sql",
		"../migrations/003_add_equipment_specs_labor_modes.sql",
		"migrations/003_add_equipment_specs_labor_modes.sql",
		"../migrations/003_genuine_and_compatible_inks.sql",
		"migrations/003_genuine_and_compatible_inks.sql",
		"../migrations/004_audit_logs_and_timestamptz.sql",
		"migrations/004_audit_logs_and_timestamptz.sql",
		"../migrations/005_inventory_lots_fifo.sql",
		"migrations/005_inventory_lots_fifo.sql",
		"../migrations/006_convert_floats_to_decimal.sql",
		"migrations/006_convert_floats_to_decimal.sql",
		"../migrations/007_deposit_and_tax_options.sql",
		"migrations/007_deposit_and_tax_options.sql",
		"../migrations/008_internal_shipping_tracking.sql",
		"migrations/008_internal_shipping_tracking.sql",
		"../migrations/009_order_printer_channel_and_finishing_linking.sql",
		"migrations/009_order_printer_channel_and_finishing_linking.sql",
		"../migrations/010_bilingual_books_preflight_and_shop_tracker.sql",
		"migrations/010_bilingual_books_preflight_and_shop_tracker.sql",
		"../migrations/012_public_catalog_and_discount_tiers.sql",
		"migrations/012_public_catalog_and_discount_tiers.sql",
		"../migrations/013_slip_verification.sql",
		"migrations/013_slip_verification.sql",
		"../migrations/014_paper_price_versioning.sql",
		"migrations/014_paper_price_versioning.sql",
		"../migrations/015_order_preflight_reports.sql",
		"migrations/015_order_preflight_reports.sql",
		"../migrations/016_predictive_maintenance.sql",
		"migrations/016_predictive_maintenance.sql",
		"../migrations/017_couriers_and_payment_methods.sql",
		"migrations/017_couriers_and_payment_methods.sql",
		"../migrations/018_lao_provinces_and_districts.sql",
		"migrations/018_lao_provinces_and_districts.sql",
		"../migrations/019_dynamic_categories_and_bilingual_catalog.sql",
		"migrations/019_dynamic_categories_and_bilingual_catalog.sql",
		"../migrations/020_inventory_inbound_fix.sql",
		"migrations/020_inventory_inbound_fix.sql",
		"migrations/000002_inventory_inbound_fix.sql",
		"../migrations/021_add_proof_and_branch_columns.sql",
		"migrations/021_add_proof_and_branch_columns.sql",
		"../migrations/022_quotations_enhancement.sql",
		"migrations/022_quotations_enhancement.sql",
		"../migrations/023_customer_crm_enhancements.sql",
		"migrations/023_customer_crm_enhancements.sql",
		"../migrations/024_idempotency_and_order_persistence.sql",
		"migrations/024_idempotency_and_order_persistence.sql",
		"../migrations/025_shop_floor_and_incentives.sql",
		"migrations/025_shop_floor_and_incentives.sql",
		"../migrations/026_inventory_deduction_ledger.sql",
		"migrations/026_inventory_deduction_ledger.sql",
		"../migrations/027_digital_proof_tracking.sql",
		"migrations/027_digital_proof_tracking.sql",
		"../migrations/028_add_customer_tier_and_courier.sql",
		"migrations/028_add_customer_tier_and_courier.sql",
		"../migrations/029_customer_categories.sql",
		"migrations/029_customer_categories.sql",
		"../migrations/030_customer_vip_tiers.sql",
		"migrations/030_customer_vip_tiers.sql",
		"../migrations/031_customer_source_and_staff_rbac.sql",
		"migrations/031_customer_source_and_staff_rbac.sql",
		"../schema.sql",
		"schema.sql",
	}

	for _, path := range migrationFiles {
		absPath, err := filepath.Abs(path)
		if err != nil {
			continue
		}
		sqlBytes, err := os.ReadFile(absPath)
		if err == nil {
			log.Printf("[DB MIGRATION] Executing migration script from %s...", absPath)
			_, execErr := db.Exec(string(sqlBytes))
			if execErr != nil {
				log.Printf("[DB MIGRATION] Migration info for %s: %v", absPath, execErr)
			} else {
				log.Printf("[DB MIGRATION] Successfully executed migration %s", absPath)
			}
		}
	}
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

