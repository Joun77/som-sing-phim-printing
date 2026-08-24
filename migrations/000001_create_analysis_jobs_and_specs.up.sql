-- ============================================================================
-- Migration: 000001_create_analysis_jobs_and_specs.up.sql
-- Description: Create analysis_jobs, base_ink_specs, order_audit_logs tables,
--              NOTIFY trigger for worker ingestion, and partial indexes.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Table: base_ink_specs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS base_ink_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    printer_model VARCHAR(128) NOT NULL UNIQUE,
    cyan_base_ml NUMERIC(10, 4) NOT NULL,
    magenta_base_ml NUMERIC(10, 4) NOT NULL,
    yellow_base_ml NUMERIC(10, 4) NOT NULL,
    black_base_ml NUMERIC(10, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. Table: analysis_jobs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NULL,
    file_path VARCHAR(512) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 3,
    error_reason TEXT NULL,
    stale_timeout_at TIMESTAMPTZ NULL,
    color_pages_count INT NOT NULL DEFAULT 0,
    mono_pages_count INT NOT NULL DEFAULT 0,
    cmyk_coverage_data JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for analysis_jobs
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_order_id ON analysis_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status_skip_locked 
    ON analysis_jobs(created_at ASC) 
    WHERE status IN ('PENDING', 'PROCESSING');

-- ----------------------------------------------------------------------------
-- 3. Table: order_audit_logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    action_type VARCHAR(64) NOT NULL,
    previous_state JSONB NOT NULL,
    new_state JSONB NOT NULL,
    actor_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for order_audit_logs
CREATE INDEX IF NOT EXISTS idx_order_audit_logs_order_id ON order_audit_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_audit_logs_created_at ON order_audit_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- 4. Triggers: Timestamp update triggers
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_timestamp_base_ink_specs
BEFORE UPDATE ON base_ink_specs
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER trg_set_timestamp_analysis_jobs
BEFORE UPDATE ON analysis_jobs
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ----------------------------------------------------------------------------
-- 5. Trigger: NOTIFY on analysis_jobs insert
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_analysis_job_inserted()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('new_analysis_job', NEW.id::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_analysis_job_inserted
AFTER INSERT ON analysis_jobs
FOR EACH ROW
EXECUTE FUNCTION notify_analysis_job_inserted();
