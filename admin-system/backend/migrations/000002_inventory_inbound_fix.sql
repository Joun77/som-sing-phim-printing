-- +goose Up
-- ============================================================================
-- Migration: 000002_inventory_inbound_fix.sql
-- Description: Inbound records table and materials table status fields update
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Update materials table
ALTER TABLE materials ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS min_stock_alert NUMERIC(14, 4) DEFAULT 10.0000 NOT NULL;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS stock_status VARCHAR(30) DEFAULT 'IN_STOCK' NOT NULL;

-- 2. Create stock_inbound_records table
CREATE TABLE IF NOT EXISTS stock_inbound_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inbound_number VARCHAR(60) NOT NULL,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
    lot_batch_number VARCHAR(100),
    quantity_received NUMERIC(14, 4) NOT NULL CHECK (quantity_received > 0),
    unit_purchase_price NUMERIC(16, 4) NOT NULL,
    supplier_name VARCHAR(200),
    status VARCHAR(30) DEFAULT 'COMPLETED' NOT NULL, -- 'COMPLETED', 'CANCELLED'
    received_by_user_id UUID NOT NULL,
    cancelled_by_user_id UUID,
    cancellation_reason TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    cancelled_at TIMESTAMPTZ
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_stock_inbound_material_id ON stock_inbound_records(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_inbound_status ON stock_inbound_records(status);

-- +goose Down
DROP INDEX IF EXISTS idx_stock_inbound_status;
DROP INDEX IF EXISTS idx_stock_inbound_material_id;
DROP TABLE IF EXISTS stock_inbound_records CASCADE;
ALTER TABLE materials DROP COLUMN IF EXISTS stock_status;
ALTER TABLE materials DROP COLUMN IF EXISTS min_stock_alert;
ALTER TABLE materials DROP COLUMN IF EXISTS is_active;
