-- Migration 009: Order Printer Channel and Finishing Asset Linking
-- Implements Multi-Printer per Order Item, Color Channel Separation (CMYK + Spot), and Asset-Linked Finishing Processes

DO $$ 
BEGIN
    -- 1. Drop obsolete supported_ink_set column if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'supported_ink_set') THEN
        ALTER TABLE order_items DROP COLUMN supported_ink_set;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotation_items' AND column_name = 'supported_ink_set') THEN
        ALTER TABLE quotation_items DROP COLUMN supported_ink_set;
    END IF;
END $$;

-- 2. Create order_item_printers table (Multi-Printer per Order Item)
CREATE TABLE IF NOT EXISTS order_item_printers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    printer_asset_id VARCHAR(100) NOT NULL,
    print_sequence INT NOT NULL DEFAULT 1,
    color_mode VARCHAR(50) NOT NULL DEFAULT 'AVERAGE', -- 'AVERAGE' or 'SEPARATE_CHANNEL'
    average_density_pct DECIMAL(5,2) DEFAULT 100.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_item_printers_order_item ON order_item_printers(order_item_id);

-- 3. Create order_printer_color_channels table (CMYK & Pantone Spot Color Channels)
CREATE TABLE IF NOT EXISTS order_printer_color_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_printer_id UUID NOT NULL REFERENCES order_item_printers(id) ON DELETE CASCADE,
    channel_name VARCHAR(50) NOT NULL, -- e.g. 'C', 'M', 'Y', 'K', 'PANTONE 185 C'
    density_pct DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    is_spot_color BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_order_printer_color_channels_printer ON order_printer_color_channels(order_item_printer_id);

-- 4. Create order_item_finishing_assets table (Post-Press Machinery Assets)
CREATE TABLE IF NOT EXISTS order_item_finishing_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    finishing_type VARCHAR(100) NOT NULL, -- 'LAMINATE_GLOSS', 'FOLDING', 'PERFORATION', 'HOT_MELT_BINDING', etc.
    machine_asset_id VARCHAR(100) NOT NULL,
    estimated_setup_time_mins INT DEFAULT 0,
    estimated_run_time_mins INT DEFAULT 0,
    unit_cost DECIMAL(10,2) DEFAULT 0.00
);

CREATE INDEX IF NOT EXISTS idx_order_item_finishing_assets_order_item ON order_item_finishing_assets(order_item_id);
