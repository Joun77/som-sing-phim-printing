-- Migration 003: Add master equipment spec columns for depreciation, maintenance, and setup cost defaults

ALTER TABLE equipment 
ADD COLUMN IF NOT EXISTS expected_life_a4_pages BIGINT DEFAULT 1000000,
ADD COLUMN IF NOT EXISTS maintenance_cost_per_page NUMERIC(12,4) DEFAULT 0.0000,
ADD COLUMN IF NOT EXISTS default_setup_cost NUMERIC(12,2) DEFAULT 50000.00;

-- Update existing equipment rows with defaults
UPDATE equipment 
SET expected_life_a4_pages = 1000000 
WHERE expected_life_a4_pages IS NULL;

UPDATE equipment 
SET default_setup_cost = 50000.00 
WHERE default_setup_cost IS NULL;
