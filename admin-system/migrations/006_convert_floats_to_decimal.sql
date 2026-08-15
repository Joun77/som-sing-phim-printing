-- Migration 006: Financial Precision Decimal Conversion (DECIMAL(18,4))
-- Ensures all financial fields, exchange rates, costs, and quotes eliminate float64 rounding errors.

DO $$ 
BEGIN
    -- Materials table precision conversion
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'materials') THEN
        ALTER TABLE materials ALTER COLUMN stock_qty TYPE DECIMAL(18,4);
        ALTER TABLE materials ALTER COLUMN cost_per_purchase_unit TYPE DECIMAL(18,4);
        ALTER TABLE materials ALTER COLUMN cost_per_consumption_unit TYPE DECIMAL(18,4);
        ALTER TABLE materials ALTER COLUMN reorder_threshold TYPE DECIMAL(18,4);
    END IF;

    -- Printers table precision conversion
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'printers') THEN
        ALTER TABLE printers ALTER COLUMN price_cost TYPE DECIMAL(18,4);
        ALTER TABLE printers ALTER COLUMN maintenance_rate_percent TYPE DECIMAL(18,4);
    END IF;

    -- Ink master catalog precision conversion
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ink_master_catalog') THEN
        ALTER TABLE ink_master_catalog ALTER COLUMN unit_price TYPE DECIMAL(18,4);
    END IF;

    -- Quotations table precision conversion
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotations') THEN
        ALTER TABLE quotations ALTER COLUMN total_price TYPE DECIMAL(18,4);
        ALTER TABLE quotations ALTER COLUMN unit_price TYPE DECIMAL(18,4);
        ALTER TABLE quotations ALTER COLUMN paper_cost TYPE DECIMAL(18,4);
        ALTER TABLE quotations ALTER COLUMN ink_cost TYPE DECIMAL(18,4);
        ALTER TABLE quotations ALTER COLUMN labor_cost TYPE DECIMAL(18,4);
        ALTER TABLE quotations ALTER COLUMN depreciation_cost TYPE DECIMAL(18,4);
        ALTER TABLE quotations ALTER COLUMN margin_percent TYPE DECIMAL(18,4);
    END IF;

    -- Orders table precision conversion
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        ALTER TABLE orders ALTER COLUMN total_amount TYPE DECIMAL(18,4);
        ALTER TABLE orders ALTER COLUMN deposit_amount TYPE DECIMAL(18,4);
        ALTER TABLE orders ALTER COLUMN balance_due TYPE DECIMAL(18,4);
    END IF;

END $$;
