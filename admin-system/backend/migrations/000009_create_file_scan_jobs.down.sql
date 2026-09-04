-- ============================================================================
-- Migration: 000009_create_file_scan_jobs.down.sql
-- ============================================================================

DROP INDEX IF EXISTS idx_file_scan_jobs_status;
DROP INDEX IF EXISTS idx_file_scan_jobs_order_item_id;
DROP TABLE IF EXISTS file_scan_jobs CASCADE;
