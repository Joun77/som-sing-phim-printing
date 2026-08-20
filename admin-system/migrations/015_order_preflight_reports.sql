-- 015_order_preflight_reports.sql
-- Migration for Order Preflight Inspection Reports & Diagnostic Logs

CREATE TABLE IF NOT EXISTS order_preflight_reports (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    total_pages INT NOT NULL DEFAULT 1,
    color_space VARCHAR(50) NOT NULL DEFAULT 'CMYK',
    has_rgb BOOLEAN DEFAULT FALSE,
    is_standard_cmyk BOOLEAN DEFAULT TRUE,
    dpi_estimate INT DEFAULT 300,
    bleed_mm NUMERIC(5,2) DEFAULT 0.00,
    has_sufficient_bleed BOOLEAN DEFAULT TRUE,
    tac_max_percent NUMERIC(5,2) DEFAULT 0.00,
    tac_warning BOOLEAN DEFAULT FALSE,
    avg_cov_c NUMERIC(5,2) DEFAULT 0.00,
    avg_cov_m NUMERIC(5,2) DEFAULT 0.00,
    avg_cov_y NUMERIC(5,2) DEFAULT 0.00,
    avg_cov_k NUMERIC(5,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'PASSED', -- 'PASSED', 'WARNING', 'ERROR'
    report_json JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_preflight_reports_order_id ON order_preflight_reports(order_id);
CREATE INDEX IF NOT EXISTS idx_order_preflight_reports_created ON order_preflight_reports(created_at DESC);
