-- +goose Up
-- ============================================================================
-- Migration: 020_inventory_inbound_fix.sql
-- Description: Inventory Inbound Correction, Stock Lifecycle & Ink Bottle Inventory
-- ============================================================================

-- 1. Update materials table with stock lifecycle and alert fields
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'materials') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'is_active') THEN
            ALTER TABLE materials ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'min_stock_alert') THEN
            ALTER TABLE materials ADD COLUMN min_stock_alert NUMERIC(14, 4) DEFAULT 10.0000;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'stock_status') THEN
            ALTER TABLE materials ADD COLUMN stock_status VARCHAR(30) DEFAULT 'IN_STOCK';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'technical_specs') THEN
            ALTER TABLE materials ADD COLUMN technical_specs JSONB DEFAULT '{}'::jsonb;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'specification_meta') THEN
            ALTER TABLE materials ADD COLUMN specification_meta JSONB DEFAULT '{}'::jsonb;
        END IF;
    END IF;
END $$;

-- 2. Create stock_inbound_records table for tracking procurement & reversal lifecycle
CREATE TABLE IF NOT EXISTS stock_inbound_records (
    id VARCHAR(100) PRIMARY KEY,
    inbound_number VARCHAR(100) UNIQUE NOT NULL,
    po_number VARCHAR(100),
    material_id VARCHAR(100),
    sku_code VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    supplier_name VARCHAR(255),
    inbound_date DATE NOT NULL DEFAULT CURRENT_DATE,
    quantity_received NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    purchase_unit VARCHAR(50),
    purchase_multiplier NUMERIC(14, 4) NOT NULL DEFAULT 1.0000,
    unit_purchase_price NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_price NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED', -- 'COMPLETED', 'CANCELLED'
    payment_method VARCHAR(50) DEFAULT 'TRANSFER',
    origin VARCHAR(50) DEFAULT 'TH',
    tariff_fee NUMERIC(18, 4) DEFAULT 0.0000,
    freight_fee NUMERIC(18, 4) DEFAULT 0.0000,
    product_image_url TEXT,
    receipt_slip_url TEXT,
    received_by_user_id VARCHAR(100),
    cancelled_by_user_id VARCHAR(100),
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    technical_specs JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_inbound_inbound_number ON stock_inbound_records(inbound_number);
CREATE INDEX IF NOT EXISTS idx_stock_inbound_material_id ON stock_inbound_records(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_inbound_sku_code ON stock_inbound_records(sku_code);
CREATE INDEX IF NOT EXISTS idx_stock_inbound_status ON stock_inbound_records(status);
CREATE INDEX IF NOT EXISTS idx_stock_inbound_date ON stock_inbound_records(inbound_date);

-- 3. Create ink_bottle_inventory table for bottle-level shop floor stock tracking
CREATE TABLE IF NOT EXISTS ink_bottle_inventory (
    id VARCHAR(100) PRIMARY KEY,
    ink_code VARCHAR(100) NOT NULL,
    ink_name VARCHAR(255) NOT NULL,
    color_group VARCHAR(50) NOT NULL,
    color_code VARCHAR(50),
    bottle_capacity_ml NUMERIC(12, 4) NOT NULL DEFAULT 100.0000,
    bottle_cost NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    cost_per_ml NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    bottles_in_stock INT NOT NULL DEFAULT 0,
    min_bottle_alert INT NOT NULL DEFAULT 2,
    is_compatible BOOLEAN DEFAULT FALSE,
    target_printer_id VARCHAR(100),
    supplier_name VARCHAR(255),
    supplier_phone VARCHAR(100),
    purchase_link TEXT,
    product_image_url TEXT,
    receipt_slip_url TEXT,
    status VARCHAR(30) DEFAULT 'IN_STOCK',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ink_bottle_ink_code ON ink_bottle_inventory(ink_code);
CREATE INDEX IF NOT EXISTS idx_ink_bottle_color_group ON ink_bottle_inventory(color_group);
CREATE INDEX IF NOT EXISTS idx_ink_bottle_target_printer ON ink_bottle_inventory(target_printer_id);
CREATE INDEX IF NOT EXISTS idx_ink_bottle_status ON ink_bottle_inventory(status);

-- +goose Down
DROP TABLE IF EXISTS ink_bottle_inventory CASCADE;
DROP TABLE IF EXISTS stock_inbound_records CASCADE;
