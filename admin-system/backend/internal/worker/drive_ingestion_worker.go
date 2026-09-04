package worker

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"sync"
	"time"

	"somsing.local/backend/internal/domain"
	"somsing.local/backend/internal/service"
)

const (
	DefaultWorkerConcurrency = 3
	DefaultJobQueueCapacity  = 100
)

// DriveIngestionWorker manages asynchronous ingestion and rasterization jobs
type DriveIngestionWorker struct {
	db             *sql.DB
	scannerService *service.FileScannerService
	jobQueue       chan *domain.FileScanJob
	maxWorkers     int
	wg             sync.WaitGroup
	ctx            context.Context
	cancel         context.CancelFunc
	mu             sync.Mutex
	running        bool
}

func NewDriveIngestionWorker(
	database *sql.DB,
	scannerService *service.FileScannerService,
	maxWorkers int,
	queueCap int,
) *DriveIngestionWorker {
	if maxWorkers <= 0 {
		maxWorkers = DefaultWorkerConcurrency
	}
	if queueCap <= 0 {
		queueCap = DefaultJobQueueCapacity
	}
	if scannerService == nil {
		scannerService = service.NewFileScannerService(nil, nil)
	}

	ctx, cancel := context.WithCancel(context.Background())

	return &DriveIngestionWorker{
		db:             database,
		scannerService: scannerService,
		jobQueue:       make(chan *domain.FileScanJob, queueCap),
		maxWorkers:     maxWorkers,
		ctx:            ctx,
		cancel:         cancel,
	}
}

// Start launches worker goroutines
func (w *DriveIngestionWorker) Start() {
	w.mu.Lock()
	if w.running {
		w.mu.Unlock()
		return
	}
	w.running = true
	w.mu.Unlock()

	for i := 0; i < w.maxWorkers; i++ {
		w.wg.Add(1)
		go w.workerLoop(i)
	}
}

// Stop gracefully terminates all worker goroutines
func (w *DriveIngestionWorker) Stop() {
	w.mu.Lock()
	if !w.running {
		w.mu.Unlock()
		return
	}
	w.running = false
	w.mu.Unlock()

	w.cancel()
	close(w.jobQueue)
	w.wg.Wait()
}

// workerLoop continuously processes scan jobs from the channel
func (w *DriveIngestionWorker) workerLoop(workerID int) {
	defer w.wg.Done()
	_ = workerID

	for {
		select {
		case <-w.ctx.Done():
			return
		case job, ok := <-w.jobQueue:
			if !ok {
				return
			}
			if job != nil {
				_ = w.ProcessJob(w.ctx, job)
			}
		}
	}
}

// EnqueueJob creates a job in the database and queues it for async scanning
func (w *DriveIngestionWorker) EnqueueJob(ctx context.Context, orderItemID, driveURL string) (*domain.FileScanJob, error) {
	if strings.TrimSpace(orderItemID) == "" {
		return nil, fmt.Errorf("order_item_id is required")
	}
	if strings.TrimSpace(driveURL) == "" {
		return nil, fmt.Errorf("drive_url is required")
	}

	jobID := fmt.Sprintf("scan-%d", time.Now().UnixNano())
	now := time.Now()

	job := &domain.FileScanJob{
		ID:          jobID,
		OrderItemID: orderItemID,
		DriveURL:    driveURL,
		Status:      domain.ScanJobStatusQueuedScan,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if w.db != nil {
		query := `
			INSERT INTO file_scan_jobs (
				id, order_item_id, drive_url, status, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING id, order_item_id, drive_url, status, created_at, updated_at`

		err := w.db.QueryRowContext(ctx, query,
			job.ID, job.OrderItemID, job.DriveURL, string(job.Status), job.CreatedAt, job.UpdatedAt,
		).Scan(
			&job.ID, &job.OrderItemID, &job.DriveURL, &job.Status, &job.CreatedAt, &job.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to insert scan job: %w", err)
		}
	}

	// Non-blocking channel push
	select {
	case w.jobQueue <- job:
	default:
		// If channel is full, log or spawn async goroutine
		go func(j *domain.FileScanJob) {
			select {
			case w.jobQueue <- j:
			case <-w.ctx.Done():
			}
		}(job)
	}

	return job, nil
}

// ProcessJob performs the actual file download and rasterization update
func (w *DriveIngestionWorker) ProcessJob(ctx context.Context, job *domain.FileScanJob) error {
	// 1. Set status to PROCESSING
	job.Status = domain.ScanJobStatusProcessing
	job.UpdatedAt = time.Now()
	w.updateJobStatus(ctx, job)

	// 2. Perform Scan
	result, err := w.scannerService.ProcessDriveScan(ctx, job.DriveURL)
	if err != nil {
		job.Status = domain.ScanJobStatusFailed
		errMsg := err.Error()
		job.ErrorMessage = &errMsg
		job.UpdatedAt = time.Now()
		w.updateJobStatus(ctx, job)
		return err
	}

	// 3. Update Job fields with scan result
	job.Status = result.Status
	job.FileSizeBytes = &result.FileSizeBytes
	job.PageCount = &result.PageCount
	job.AvgCPct = &result.AvgCPct
	job.AvgMPct = &result.AvgMPct
	job.AvgYPct = &result.AvgYPct
	job.AvgKPct = &result.AvgKPct
	job.AvgTACPct = &result.AvgTACPct
	if result.ErrorMessage != "" {
		job.ErrorMessage = &result.ErrorMessage
	}
	job.UpdatedAt = time.Now()

	w.updateJobStatus(ctx, job)
	return nil
}

// updateJobStatus synchronizes job state with PostgreSQL
func (w *DriveIngestionWorker) updateJobStatus(ctx context.Context, job *domain.FileScanJob) {
	if w.db == nil {
		return
	}

	query := `
		UPDATE file_scan_jobs SET
			status = $1,
			file_size_bytes = $2,
			page_count = $3,
			avg_c_pct = $4,
			avg_m_pct = $5,
			avg_y_pct = $6,
			avg_k_pct = $7,
			avg_tac_pct = $8,
			error_message = $9,
			updated_at = $10
		WHERE id = $11`

	_, _ = w.db.ExecContext(ctx, query,
		string(job.Status),
		job.FileSizeBytes,
		job.PageCount,
		job.AvgCPct,
		job.AvgMPct,
		job.AvgYPct,
		job.AvgKPct,
		job.AvgTACPct,
		job.ErrorMessage,
		job.UpdatedAt,
		job.ID,
	)
}

// GetJobByID retrieves job by ID from database
func (w *DriveIngestionWorker) GetJobByID(ctx context.Context, id string) (*domain.FileScanJob, error) {
	if w.db == nil {
		return nil, fmt.Errorf("database connection not available")
	}

	query := `
		SELECT id, order_item_id, drive_url, status,
		       file_size_bytes, page_count, avg_c_pct, avg_m_pct, avg_y_pct, avg_k_pct, avg_tac_pct,
		       error_message, created_at, updated_at
		FROM file_scan_jobs
		WHERE id = $1
		LIMIT 1`

	var j domain.FileScanJob
	err := w.db.QueryRowContext(ctx, query, strings.TrimSpace(id)).Scan(
		&j.ID, &j.OrderItemID, &j.DriveURL, &j.Status,
		&j.FileSizeBytes, &j.PageCount, &j.AvgCPct, &j.AvgMPct, &j.AvgYPct, &j.AvgKPct, &j.AvgTACPct,
		&j.ErrorMessage, &j.CreatedAt, &j.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &j, nil
}
