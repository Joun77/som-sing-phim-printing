-- ============================================================================
-- Migration: 000010_create_order_management_tables.up.sql
-- Description: Master tables for Order State Machine, Items, Status History & Spoilage Logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    order_number VARCHAR(64) UNIQUE NOT NULL,
    customer_id VARCHAR(64),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64),
    customer_email VARCHAR(255),
    customer_address TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'QUOTATION',
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    deposit_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    remaining_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'LAK',
    exchange_rate NUMERIC(12, 6) NOT NULL DEFAULT 1.000000,
    google_drive_link TEXT,
    proof_url TEXT,
    proof_approved_at TIMESTAMPTZ,
    proof_rejected_at TIMESTAMPTZ,
    proof_rejection_reason TEXT,
    stock_deducted_at TIMESTAMPTZ,
    delivery_date VARCHAR(64),
    notes TEXT,
    created_by VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(64),
    job_name VARCHAR(255) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    page_count INT NOT NULL DEFAULT 1,
    paper_size VARCHAR(64) NOT NULL DEFAULT 'A4',
    paper_sku VARCHAR(64),
    binding_type VARCHAR(64) NOT NULL DEFAULT 'NONE',
    spine_width_mm NUMERIC(8, 2) DEFAULT 0.00,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
    override_reason TEXT,
    override_by VARCHAR(64),
    specs JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_status_histories (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    previous_status VARCHAR(32) NOT NULL,
    new_status VARCHAR(32) NOT NULL,
    reason TEXT,
    performed_by VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_histories_order_id ON order_status_histories(order_id);

CREATE TABLE IF NOT EXISTS spoilage_logs (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id VARCHAR(64) REFERENCES order_items(id) ON DELETE SET NULL,
    material_sku VARCHAR(64) NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    category VARCHAR(32) NOT NULL, -- 'paper', 'ink', etc.
    quantity_spoiled NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    unit VARCHAR(32) NOT NULL,
    reason TEXT NOT NULL,
    cost_impact NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    recorded_by VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spoilage_logs_order_id ON spoilage_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_spoilage_logs_material_sku ON spoilage_logs(material_sku);
