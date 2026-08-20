-- 014_paper_price_versioning.sql
-- Migration for Supplier Paper Price Sheet Versioning & Historical Cost Snapshots

-- 1. Create paper_price_versions table
CREATE TABLE IF NOT EXISTS paper_price_versions (
    id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    version_code VARCHAR(100) NOT NULL UNIQUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_paper_price_versions_eff_date ON paper_price_versions(effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_paper_price_versions_supplier ON paper_price_versions(supplier_name);

-- 2. Create paper_specs table if not exists
CREATE TABLE IF NOT EXISTS paper_specs (
    id SERIAL PRIMARY KEY,
    paper_code VARCHAR(100) NOT NULL,
    paper_name VARCHAR(255) NOT NULL,
    paper_type VARCHAR(100) NOT NULL,
    gsm INT NOT NULL DEFAULT 80,
    sheet_width_mm NUMERIC(10,2) DEFAULT 0.00,
    sheet_height_mm NUMERIC(10,2) DEFAULT 0.00,
    sheets_per_ream INT DEFAULT 500,
    cost_per_ream NUMERIC(12,4) DEFAULT 0.0000,
    cost_per_sheet NUMERIC(12,4) DEFAULT 0.0000,
    price_version_id INT REFERENCES paper_price_versions(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Ensure price_version_id exists in paper_specs if table pre-existed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'paper_specs' AND column_name = 'price_version_id'
    ) THEN
        ALTER TABLE paper_specs ADD COLUMN price_version_id INT REFERENCES paper_price_versions(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_paper_specs_price_version ON paper_specs(price_version_id);
CREATE INDEX IF NOT EXISTS idx_paper_specs_code ON paper_specs(paper_code);
