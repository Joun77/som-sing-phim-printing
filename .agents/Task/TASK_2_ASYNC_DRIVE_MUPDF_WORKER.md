# Phase 2 - Task 2: Asynchronous Google Drive Ingestion & MuPDF Worker

## Objective
Implement an asynchronous worker pipeline in Go that downloads files from Google Drive, rasterizes and scans PDF page count and CMYK coverage using MuPDF/Ghostscript CLI tools, updates the database, and handles fallback logic for large/private files.

## Target Files
- `backend/internal/domain/file_ingestion.go` (Create)
- `backend/internal/service/file_scanner_service.go` (Create)
- `backend/internal/worker/drive_ingestion_worker.go` (Create)
- `backend/internal/worker/drive_ingestion_worker_test.go` (Create)
- `backend/migrations/000009_create_file_scan_jobs.up.sql` (Create)

## Technical Requirements

### 1. Job Queue & Status Schema (`backend/migrations/000009_create_file_scan_jobs.up.sql`)
- Table `file_scan_jobs`:
  - `id VARCHAR(64) PRIMARY KEY`
  - `order_item_id VARCHAR(64) NOT NULL INDEX`
  - `drive_url TEXT NOT NULL`
  - `status VARCHAR(32) NOT NULL` (`QUEUED_SCAN`, `PROCESSING`, `AUTO_VERIFIED`, `PENDING_MANUAL_VERIFICATION`, `FAILED`)
  - `file_size_bytes BIGINT`
  - `page_count INT`
  - `avg_c_pct NUMERIC(5, 2)`
  - `avg_m_pct NUMERIC(5, 2)`
  - `avg_y_pct NUMERIC(5, 2)`
  - `avg_k_pct NUMERIC(5, 2)`
  - `avg_tac_pct NUMERIC(5, 2)`
  - `error_message TEXT`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### 2. File Scanner Engine (`backend/internal/service/file_scanner_service.go`)
- Stream file from Google Drive via direct HTTP stream or Google Drive API.
- Dual-Route Rule:
  - **Route A (<= 100 MB & Public):** Stream into temp directory, execute `mutool` / `gs` ink coverage analysis per page, calculate average $(C, M, Y, K)$ and $TAC$. Set status `AUTO_VERIFIED`.
  - **Route B (> 100 MB or Private / Restricted):** Skip heavy rasterization, assign standard default fallback TAC (20% for standard docs, 100% for full color/photo). Set status `PENDING_MANUAL_VERIFICATION`.

### 3. Background Worker Loop (`backend/internal/worker/drive_ingestion_worker.go`)
- Background polling / channel worker processing queued scan jobs.
- Safe goroutine pool with worker limits (e.g., max 3 concurrent rasterizations to prevent CPU exhaustion).
- Automatic cleanup of temporary scanned files (`defer os.Remove(...)`).

## Constraints & Output Rules
- Ensure non-blocking asynchronous execution (API returns `job_id` immediately with `QUEUED_SCAN`).
- Handle context timeouts and graceful worker termination on shutdown.

---

### 🚀 IDE Execution Prompt (Copy & Paste to IDE Assistant)
> "Act as a senior Go backend engineer. Implement Phase 2 Task 2 based on the specification above. Create `backend/internal/domain/file_ingestion.go`, `backend/internal/service/file_scanner_service.go`, `backend/internal/worker/drive_ingestion_worker.go`, `backend/internal/worker/drive_ingestion_worker_test.go`, and SQL migrations. Implement the dual-route MuPDF background scanning pipeline with fallback handling for files > 100MB or private permissions, maintaining clean async queue processing and goroutine safety."
