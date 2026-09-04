package worker

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"runtime"
	"sync"
	"time"

	"github.com/lib/pq"
)

// AnalysisJob represents an entry in the analysis_jobs table
type AnalysisJob struct {
	ID             string
	FilePath       string
	RetryCount     int
	MaxRetries     int
	StaleTimeoutAt *time.Time
}

// QueueConsumerConfig holds worker queue settings
type QueueConsumerConfig struct {
	FallbackPollInterval time.Duration
	StaleJobDuration     time.Duration
	MaxConcurrency       int
}

// QueueConsumer manages the LISTEN/NOTIFY and SKIP LOCKED background queue loop
type QueueConsumer struct {
	db          *sql.DB
	connStr     string
	analyzer    PDFAnalyzer
	config      QueueConsumerConfig
	listener    *pq.Listener
	triggerChan chan struct{}
	wg          sync.WaitGroup
	ctx         context.Context
	cancel      context.CancelFunc
}

// NewQueueConsumer instantiates a new queue consumer with sane defaults
func NewQueueConsumer(db *sql.DB, connStr string, analyzer PDFAnalyzer, cfg *QueueConsumerConfig) *QueueConsumer {
	concurrency := runtime.NumCPU()
	if cfg != nil && cfg.MaxConcurrency > 0 {
		concurrency = cfg.MaxConcurrency
	}

	pollInterval := 5 * time.Second
	if cfg != nil && cfg.FallbackPollInterval > 0 {
		pollInterval = cfg.FallbackPollInterval
	}

	staleDuration := 5 * time.Minute
	if cfg != nil && cfg.StaleJobDuration > 0 {
		staleDuration = cfg.StaleJobDuration
	}

	ctx, cancel := context.WithCancel(context.Background())

	return &QueueConsumer{
		db:      db,
		connStr: connStr,
		analyzer: analyzer,
		config: QueueConsumerConfig{
			FallbackPollInterval: pollInterval,
			StaleJobDuration:     staleDuration,
			MaxConcurrency:       concurrency,
		},
		triggerChan: make(chan struct{}, 100),
		ctx:         ctx,
		cancel:      cancel,
	}
}

// Start launches listener, ticker and worker pool goroutines
func (qc *QueueConsumer) Start() {
	// Initialize PostgreSQL Listener for NOTIFY events
	if qc.connStr != "" {
		qc.listener = pq.NewListener(qc.connStr, 10*time.Second, time.Minute, qc.listenerEventCallback)
		if err := qc.listener.Listen("new_analysis_job"); err != nil {
			log.Printf("[QueueConsumer] Warning: failed to listen on 'new_analysis_job': %v", err)
		} else {
			log.Println("[QueueConsumer] Listening for PostgreSQL NOTIFY on 'new_analysis_job'")
		}
	}

	// Dispatcher goroutine (handles hybrid NOTIFY + Ticker)
	qc.wg.Add(1)
	go qc.dispatchLoop()

	// Worker pool goroutines bounded by NumCPU
	for i := 0; i < qc.config.MaxConcurrency; i++ {
		qc.wg.Add(1)
		go qc.workerRoutine(i)
	}

	log.Printf("[QueueConsumer] Started with %d worker threads (fallback interval: %v)",
		qc.config.MaxConcurrency, qc.config.FallbackPollInterval)
}

// Stop gracefully shuts down all consumers and releases database locks
func (qc *QueueConsumer) Stop() {
	log.Println("[QueueConsumer] Stopping worker pool...")
	qc.cancel()

	if qc.listener != nil {
		_ = qc.listener.Close()
	}

	qc.wg.Wait()
	log.Println("[QueueConsumer] All worker routines terminated cleanly")
}

func (qc *QueueConsumer) listenerEventCallback(event pq.ListenerEventType, err error) {
	if err != nil {
		log.Printf("[QueueConsumer] Listener error: %v", err)
	}
}

func (qc *QueueConsumer) dispatchLoop() {
	defer qc.wg.Done()

	ticker := time.NewTicker(qc.config.FallbackPollInterval)
	defer ticker.Stop()

	// Initial trigger on startup
	qc.notifyDispatcher()

	for {
		select {
		case <-qc.ctx.Done():
			return

		case <-ticker.C:
			qc.notifyDispatcher()

		case n, ok := <-qc.getNotificationChan():
			if !ok {
				return
			}
			if n != nil {
				qc.notifyDispatcher()
			}
		}
	}
}

func (qc *QueueConsumer) getNotificationChan() <-chan *pq.Notification {
	if qc.listener != nil {
		return qc.listener.Notify
	}
	return nil
}

func (qc *QueueConsumer) notifyDispatcher() {
	select {
	case qc.triggerChan <- struct{}{}:
	default:
	}
}

func (qc *QueueConsumer) workerRoutine(workerID int) {
	defer qc.wg.Done()

	for {
		select {
		case <-qc.ctx.Done():
			return

		case <-qc.triggerChan:
			// Drain available jobs sequentially or until empty
			for {
				if qc.ctx.Err() != nil {
					return
				}

				job, err := qc.fetchNextJob(qc.ctx)
				if err != nil {
					log.Printf("[Worker %d] Error fetching job: %v", workerID, err)
					break
				}
				if job == nil {
					// No more pending jobs
					break
				}

				qc.processJob(qc.ctx, workerID, job)
			}
		}
	}
}

// fetchNextJob selects and claims the next job using SKIP LOCKED in a transaction
func (qc *QueueConsumer) fetchNextJob(ctx context.Context) (*AnalysisJob, error) {
	tx, err := qc.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
	if err != nil {
		return nil, fmt.Errorf("failed to begin tx: %w", err)
	}
	defer func() {
		_ = tx.Rollback()
	}()

	query := `
		SELECT id, file_path, retry_count, max_retries
		FROM analysis_jobs
		WHERE status = 'PENDING' OR (status = 'PROCESSING' AND stale_timeout_at < NOW())
		ORDER BY created_at ASC
		LIMIT 1
		FOR UPDATE SKIP LOCKED;`

	var job AnalysisJob
	row := tx.QueryRowContext(ctx, query)
	err = row.Scan(&job.ID, &job.FilePath, &job.RetryCount, &job.MaxRetries)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Update status to PROCESSING with stale timeout of 5 minutes
	updateQuery := `
		UPDATE analysis_jobs
		SET status = 'PROCESSING',
		    stale_timeout_at = NOW() + ($1 * INTERVAL '1 second'),
		    updated_at = NOW()
		WHERE id = $2;`

	staleSeconds := int(qc.config.StaleJobDuration.Seconds())
	_, err = tx.ExecContext(ctx, updateQuery, staleSeconds, job.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to update job to PROCESSING: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit job claim: %w", err)
	}

	return &job, nil
}

// processJob runs the PDF analyzer and updates the database state accordingly
func (qc *QueueConsumer) processJob(ctx context.Context, workerID int, job *AnalysisJob) {
	log.Printf("[Worker %d] Processing analysis job %s (file: %s, attempt: %d/%d)",
		workerID, job.ID, job.FilePath, job.RetryCount+1, job.MaxRetries)

	summary, err := qc.analyzer.Analyze(ctx, job.FilePath)
	if err != nil {
		log.Printf("[Worker %d] Job %s failed: %v", workerID, job.ID, err)
		qc.handleJobFailure(ctx, job, err)
		return
	}

	qc.handleJobSuccess(ctx, job, summary)
	log.Printf("[Worker %d] Job %s COMPLETED (Color Pages: %d, Mono Pages: %d)",
		workerID, job.ID, summary.ColorPagesCount, summary.MonoPagesCount)
}

func (qc *QueueConsumer) handleJobSuccess(ctx context.Context, job *AnalysisJob, summary *JobCoverageSummary) {
	jsonData, err := json.Marshal(summary)
	if err != nil {
		qc.handleJobFailure(ctx, job, fmt.Errorf("failed to marshal coverage json: %w", err))
		return
	}

	query := `
		UPDATE analysis_jobs
		SET status = 'COMPLETED',
		    color_pages_count = $1,
		    mono_pages_count = $2,
		    cmyk_coverage_data = $3,
		    error_reason = NULL,
		    stale_timeout_at = NULL,
		    updated_at = NOW()
		WHERE id = $4;`

	_, err = qc.db.ExecContext(ctx, query,
		summary.ColorPagesCount,
		summary.MonoPagesCount,
		jsonData,
		job.ID,
	)
	if err != nil {
		log.Printf("[QueueConsumer] Error updating completed job %s: %v", job.ID, err)
	}
}

func (qc *QueueConsumer) handleJobFailure(ctx context.Context, job *AnalysisJob, processErr error) {
	newRetryCount := job.RetryCount + 1
	var nextStatus string
	if newRetryCount >= job.MaxRetries {
		nextStatus = "FAILED"
	} else {
		nextStatus = "PENDING"
	}

	query := `
		UPDATE analysis_jobs
		SET status = $1,
		    retry_count = $2,
		    error_reason = $3,
		    stale_timeout_at = NULL,
		    updated_at = NOW()
		WHERE id = $4;`

	_, err := qc.db.ExecContext(ctx, query,
		nextStatus,
		newRetryCount,
		processErr.Error(),
		job.ID,
	)
	if err != nil {
		log.Printf("[QueueConsumer] Error updating failed job %s: %v", job.ID, err)
	}
}
