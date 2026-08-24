package main

import (
	"database/sql"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"backend/internal/worker"

	_ "github.com/lib/pq"
)

func main() {
	log.Println("[WorkerService] Starting MuPDF Analysis Worker Engine...")

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/somsingphim?sslmode=disable"
	}

	storagePath := os.Getenv("STORAGE_PATH")
	if storagePath == "" {
		storagePath = "/storage/uploads"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("[WorkerService] Failed to initialize DB pool: %v", err)
	}
	defer db.Close()

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		log.Printf("[WorkerService] Warning: Initial DB ping failed: %v. Worker will keep retrying...", err)
	} else {
		log.Println("[WorkerService] Database connection established")
	}

	analyzer := worker.NewMuPDFAnalyzer(storagePath)
	consumer := worker.NewQueueConsumer(db, dbURL, analyzer, &worker.QueueConsumerConfig{
		FallbackPollInterval: 5 * time.Second,
		StaleJobDuration:     5 * time.Minute,
	})

	consumer.Start()

	// Wait for termination signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	sig := <-sigChan
	log.Printf("[WorkerService] Received signal (%v), initiating graceful shutdown...", sig)

	consumer.Stop()
	log.Println("[WorkerService] Worker engine shut down successfully.")
}
