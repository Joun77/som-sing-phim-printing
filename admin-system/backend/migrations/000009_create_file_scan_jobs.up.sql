-- ============================================================================
-- Migration: 000009_create_file_scan_jobs.up.sql
-- Description: Create file scan jobs table for asynchronous Drive ingestion & MuPDF scanner
-- ============================================================================

CREATE TABLE IF NOT EXISTS file_scan_jobs (
    id VARCHAR(64) PRIMARY KEY,
    order_item_id VARCHAR(64) NOT NULL,
    drive_url TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'QUEUED_SCAN', -- 'QUEUED_SCAN', 'PROCESSING', 'AUTO_VERIFIED', 'PENDING_MANUAL_VERIFICATION', 'FAILED'
    file_size_bytes BIGINT,
    page_count INT,
    avg_c_pct NUMERIC(5, 2),
    avg_m_pct NUMERIC(5, 2),
    avg_y_pct NUMERIC(5, 2),
    avg_k_pct NUMERIC(5, 2),
    avg_tac_pct NUMERIC(5, 2),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_scan_jobs_order_item_id ON file_scan_jobs(order_item_id);
CREATE INDEX IF NOT EXISTS idx_file_scan_jobs_status ON file_scan_jobs(status);
