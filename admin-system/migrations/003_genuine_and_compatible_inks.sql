-- +goose Up
-- ============================================================================
-- Migration: 003_genuine_and_compatible_inks.sql
-- Description: Adds tables for genuine ink baselines and compatible ink metrics.
-- ============================================================================

CREATE TABLE IF NOT EXISTS genuine_inks (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    color_code VARCHAR(50) NOT NULL,
    baseline_volume_ml NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    standard_page_yield INT NOT NULL DEFAULT 0,
    unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS compatible_inks (
    id VARCHAR(100) PRIMARY KEY,
    genuine_ink_id VARCHAR(100) NOT NULL REFERENCES genuine_inks(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    color_code VARCHAR(50) NOT NULL,
    imported_volume_ml NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    cost_per_ml NUMERIC(15, 4) GENERATED ALWAYS AS (
        CASE WHEN imported_volume_ml > 0 THEN unit_cost / imported_volume_ml ELSE 0 END
    ) STORED,
    supplier VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_compatible_genuine_ink_id ON compatible_inks(genuine_ink_id);

-- +goose Down
DROP TABLE IF EXISTS compatible_inks CASCADE;
DROP TABLE IF EXISTS genuine_inks CASCADE;
