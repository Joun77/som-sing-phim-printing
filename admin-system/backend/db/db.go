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
		log.Printf("[DB WARNING] Could not ping PostgreSQL at %s: %v (Using in-memory fallback if DB unreachable)", connStr, err)
		DB = db
		return db, err
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
		"../migrations/010_bilingual_books_preflight_and_shop_tracker.sql",
		"migrations/010_bilingual_books_preflight_and_shop_tracker.sql",
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
				log.Printf("[DB MIGRATION] Migration warning for %s: %v", absPath, execErr)
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
