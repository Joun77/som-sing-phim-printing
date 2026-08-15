-- +goose Up
-- ============================================================================
-- Migration: 005_inventory_lots_fifo.sql
-- Description: Adds inventory_batches table for FIFO lot tracking & expiry tracking.
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_batches (
    id VARCHAR(100) PRIMARY KEY,
    sku_id VARCHAR(100) NOT NULL,
    lot_number VARCHAR(100) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    expiry_date TIMESTAMPTZ,
    received_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    supplier VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_batches_sku ON inventory_batches(sku_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON inventory_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_received ON inventory_batches(received_date);

-- +goose Down
DROP TABLE IF EXISTS inventory_batches CASCADE;
