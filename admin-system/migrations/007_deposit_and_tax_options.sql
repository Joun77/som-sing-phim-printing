-- Migration 007: Dynamic Deposit & Tax Mode Options
-- Adds deposit_percentage, tax_mode, tax_rate to quotations and orders tables.

DO $$ 
BEGIN
    -- Quotations table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotations') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'deposit_percentage') THEN
            ALTER TABLE quotations ADD COLUMN deposit_percentage DECIMAL(18,4) DEFAULT 30.0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'tax_mode') THEN
            ALTER TABLE quotations ADD COLUMN tax_mode VARCHAR(50) DEFAULT 'EXCLUDED';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'tax_rate') THEN
            ALTER TABLE quotations ADD COLUMN tax_rate DECIMAL(18,4) DEFAULT 0.07;
        END IF;
    END IF;

    -- Orders table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'deposit_percentage') THEN
            ALTER TABLE orders ADD COLUMN deposit_percentage DECIMAL(18,4) DEFAULT 30.0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tax_mode') THEN
            ALTER TABLE orders ADD COLUMN tax_mode VARCHAR(50) DEFAULT 'EXCLUDED';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tax_rate') THEN
            ALTER TABLE orders ADD COLUMN tax_rate DECIMAL(18,4) DEFAULT 0.07;
        END IF;
    END IF;

END $$;
