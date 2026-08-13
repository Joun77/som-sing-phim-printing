-- ============================================================================
-- Migration: 001_master_printer_ink_paper_quotation_spec.sql
-- Description: Migration schema for Printers, Ink Catalog, Printer-Color Link,
--              Paper Catalog, and Quotation Calculator according to Section 3.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'printer_category_enum') THEN
        CREATE TYPE printer_category_enum AS ENUM ('Inkjet', 'Laser', 'Thermal', 'Dot Matrix', 'MFP', 'Plotter');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'printer_color_scheme_enum') THEN
        CREATE TYPE printer_color_scheme_enum AS ENUM ('Monochrome', 'CMYK', 'Photo', 'Custom');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'printer_status_enum') THEN
        CREATE TYPE printer_status_enum AS ENUM ('In Use', 'Spare', 'Under Repair', 'Retired');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ink_base_type_enum') THEN
        CREATE TYPE ink_base_type_enum AS ENUM ('Dye', 'Pigment', 'Toner', 'Eco-Solvent', 'UV');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ink_compatibility_enum') THEN
        CREATE TYPE ink_compatibility_enum AS ENUM ('OEM', 'Compatible');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paper_format_enum') THEN
        CREATE TYPE paper_format_enum AS ENUM ('Sheet', 'Roll');
    END IF;
END $$;

-- ============================================================================
-- 2. TABLE: printers (Master Printers & Equipment)
-- ============================================================================

CREATE TABLE IF NOT EXISTS printers (
    asset_id VARCHAR(50) PRIMARY KEY,
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    category printer_category_enum NOT NULL,
    color_scheme_type printer_color_scheme_enum NOT NULL,
    total_color_slots INT NOT NULL,
    expected_life_a4_pages INT NOT NULL,
    maintenance_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    purchase_date DATE NOT NULL,
    price_cost NUMERIC(15, 2) NOT NULL,
    vendor_supplier VARCHAR(150) NOT NULL,
    warranty_expiry_year INT NOT NULL,
    status printer_status_enum NOT NULL DEFAULT 'In Use',
    location_dept VARCHAR(100) NOT NULL,
    product_image_url TEXT,
    receipt_invoice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_printers_serial_number ON printers(serial_number);
CREATE INDEX IF NOT EXISTS idx_printers_category ON printers(category);
CREATE INDEX IF NOT EXISTS idx_printers_status ON printers(status);

-- ============================================================================
-- 3. TABLE: ink_master_catalog (Ink Inventory Master)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ink_master_catalog (
    ink_code VARCHAR(100) PRIMARY KEY,
    color_name VARCHAR(100) NOT NULL,
    color_group VARCHAR(50) NOT NULL,
    volume VARCHAR(50) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    unit_price NUMERIC(15, 2) NOT NULL,
    ink_base_type ink_base_type_enum NOT NULL,
    is_compatible_ink ink_compatibility_enum NOT NULL,
    product_image_url TEXT,
    receipt_invoice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ink_color_group ON ink_master_catalog(color_group);
CREATE INDEX IF NOT EXISTS idx_ink_base_type ON ink_master_catalog(ink_base_type);

-- ============================================================================
-- 4. TABLE: printer_color_link (Printer to Ink Mapping 1:N)
-- ============================================================================

CREATE TABLE IF NOT EXISTS printer_color_link (
    link_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id VARCHAR(50) NOT NULL REFERENCES printers(asset_id) ON DELETE CASCADE ON UPDATE CASCADE,
    ink_code VARCHAR(100) NOT NULL REFERENCES ink_master_catalog(ink_code) ON DELETE CASCADE ON UPDATE CASCADE,
    slot_position VARCHAR(50) NOT NULL,
    iso_page_yield_a4 INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_asset_slot UNIQUE (asset_id, slot_position)
);

CREATE INDEX IF NOT EXISTS idx_pcl_asset_id ON printer_color_link(asset_id);
CREATE INDEX IF NOT EXISTS idx_pcl_ink_code ON printer_color_link(ink_code);

-- ============================================================================
-- 5. TABLE: paper_catalog (Paper & Media Catalog)
-- ============================================================================

CREATE TABLE IF NOT EXISTS paper_catalog (
    paper_code VARCHAR(100) PRIMARY KEY,
    paper_name VARCHAR(255) NOT NULL,
    paper_format paper_format_enum NOT NULL,
    sheets_per_pack INT,
    roll_width_m NUMERIC(8, 4),
    roll_length_m NUMERIC(8, 2),
    stock_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_price NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_paper_format ON paper_catalog(paper_format);

-- ============================================================================
-- 6. TABLES: quotations & quotation_items (Cost Calculations & History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS quotations (
    quotation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR(150) NOT NULL,
    total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    overall_profit_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_name);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at);

CREATE TABLE IF NOT EXISTS quotation_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(quotation_id) ON DELETE CASCADE,
    asset_id VARCHAR(50) REFERENCES printers(asset_id) ON DELETE SET NULL ON UPDATE CASCADE,
    paper_code VARCHAR(100) REFERENCES paper_catalog(paper_code) ON DELETE SET NULL ON UPDATE CASCADE,
    job_width_mm NUMERIC(8, 2),
    job_length_mm NUMERIC(8, 2),
    coverage_k_percent NUMERIC(5, 2) DEFAULT 0.00,
    coverage_c_percent NUMERIC(5, 2) DEFAULT 0.00,
    coverage_m_percent NUMERIC(5, 2) DEFAULT 0.00,
    coverage_y_percent NUMERIC(5, 2) DEFAULT 0.00,
    ink_cost NUMERIC(15, 2) DEFAULT 0.00,
    machine_cost NUMERIC(15, 2) DEFAULT 0.00,
    paper_cost NUMERIC(15, 2) DEFAULT 0.00,
    labor_cost NUMERIC(15, 2) DEFAULT 0.00,
    finishing_cost NUMERIC(15, 2) DEFAULT 0.00,
    waste_percent NUMERIC(5, 2) DEFAULT 5.00,
    unit_cost_total NUMERIC(15, 2) DEFAULT 0.00,
    unit_selling_price NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON quotation_items(quotation_id);
