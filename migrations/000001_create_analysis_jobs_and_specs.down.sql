-- ============================================================================
-- Migration: 000001_create_analysis_jobs_and_specs.down.sql
-- Description: Rollback analysis_jobs, base_ink_specs, order_audit_logs tables,
--              triggers, and functions.
-- ============================================================================

-- 1. Drop Triggers
DROP TRIGGER IF EXISTS trg_notify_analysis_job_inserted ON analysis_jobs;
DROP TRIGGER IF EXISTS trg_set_timestamp_analysis_jobs ON analysis_jobs;
DROP TRIGGER IF EXISTS trg_set_timestamp_base_ink_specs ON base_ink_specs;

-- 2. Drop Trigger Functions
DROP FUNCTION IF EXISTS notify_analysis_job_inserted();
DROP FUNCTION IF EXISTS trigger_set_timestamp();

-- 3. Drop Tables (Indexes and constraints will be dropped automatically)
DROP TABLE IF EXISTS order_audit_logs;
DROP TABLE IF EXISTS analysis_jobs;
DROP TABLE IF EXISTS base_ink_specs;
