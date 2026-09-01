-- ============================================================
-- Migration 026: Inventory Deduction Ledger & Stock Movements
-- ============================================================

CREATE TABLE IF NOT EXISTS stock_movements (
    id VARCHAR(64) PRIMARY KEY,
    material_id VARCHAR(64) NOT NULL,
    order_id VARCHAR(64),
    order_item_id VARCHAR(64),
    movement_type VARCHAR(32) NOT NULL, -- 'PRODUCTION_DEDUCTION', 'INBOUND', 'REVERSAL', 'MANUAL_ADJUST'
    quantity NUMERIC(15, 4) NOT NULL,
    unit_cost NUMERIC(15, 4) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) DEFAULT 'SYSTEM'
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_material ON stock_movements(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_order ON stock_movements(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at DESC);
