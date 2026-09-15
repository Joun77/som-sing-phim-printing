-- Migration 037: Inbound revisions audit log, materials market cost, and offcuts enhancements

-- 1. Create table for inbound revision logs
CREATE TABLE IF NOT EXISTS inbound_revision_logs (
    id VARCHAR(100) PRIMARY KEY,
    inbound_id VARCHAR(100) NOT NULL,
    old_quantity NUMERIC(12, 2),
    new_quantity NUMERIC(12, 2),
    old_price NUMERIC(15, 2),
    new_price NUMERIC(15, 2),
    delta_stock NUMERIC(12, 2),
    edit_reason TEXT NOT NULL,
    edited_by VARCHAR(100) DEFAULT 'ADMIN',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inbound_rev_inbound_id ON inbound_revision_logs(inbound_id);

-- 2. Add revision flags to inbound_transactions
ALTER TABLE inbound_transactions ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
ALTER TABLE inbound_transactions ADD COLUMN IF NOT EXISTS edit_reason TEXT;

-- 3. Add latest market cost to materials
ALTER TABLE materials ADD COLUMN IF NOT EXISTS latest_market_cost NUMERIC(15, 2) DEFAULT 0;

-- 4. Enhance offcuts table
ALTER TABLE offcuts ADD COLUMN IF NOT EXISTS cost_per_sheet NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE offcuts ADD COLUMN IF NOT EXISTS grammage_gsm INTEGER DEFAULT 0;
ALTER TABLE offcuts ADD COLUMN IF NOT EXISTS paper_type VARCHAR(100) DEFAULT 'Standard';
ALTER TABLE offcuts ADD COLUMN IF NOT EXISTS paper_surface VARCHAR(50) DEFAULT '';
ALTER TABLE offcuts ADD COLUMN IF NOT EXISTS parent_material_id VARCHAR(100) DEFAULT '';
