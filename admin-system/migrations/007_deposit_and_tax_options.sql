-- Migration 007: Dynamic Deposit & Tax Mode Options
-- Adds deposit_percentage, tax_mode, tax_rate to quotations and orders tables.

DO $$ 
BEGIN
    -- Quotations table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'quotations') THEN
        ALTER TABLE quotations ADD COLUMN IF NOT EXISTS deposit_percentage DECIMAL(18,4) DEFAULT 30.0;
        ALTER TABLE quotations ADD COLUMN IF NOT EXISTS tax_mode VARCHAR(50) DEFAULT 'EXCLUDED';
        ALTER TABLE quotations ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(18,4) DEFAULT 0.07;
    END IF;

    -- Orders table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'orders') THEN
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS deposit_percentage DECIMAL(18,4) DEFAULT 30.0;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_mode VARCHAR(50) DEFAULT 'EXCLUDED';
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(18,4) DEFAULT 0.07;
    END IF;

END $$;
