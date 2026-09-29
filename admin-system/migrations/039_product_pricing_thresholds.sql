-- 039_product_pricing_thresholds.sql
-- Migration to add baseline coverage threshold and real machine cost linking to public_products

ALTER TABLE public_products
ADD COLUMN IF NOT EXISTS baseline_coverage_percent NUMERIC(5, 2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS base_floor_price NUMERIC(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS threshold_mode VARCHAR(50) DEFAULT 'FLOOR_OR_ACTUAL';

-- Update existing products with sensible baseline coverage defaults
UPDATE public_products
SET baseline_coverage_percent = 10.00
WHERE baseline_coverage_percent IS NULL;

UPDATE public_products
SET threshold_mode = 'FLOOR_OR_ACTUAL'
WHERE threshold_mode IS NULL;
