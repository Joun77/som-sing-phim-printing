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
    technical_specs JSONB DEFAULT '{}'::jsonb,
    oem_baseline_specs JSONB DEFAULT '{}'::jsonb,
    components JSONB DEFAULT '[]'::jsonb,
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
    technical_specs JSONB DEFAULT '{}'::jsonb,
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
    oem_standard_volume_ml NUMERIC(10, 2),
    oem_standard_iso_yield_a4 INT,
    base_consumption_rate_ml NUMERIC(12, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_asset_slot UNIQUE (asset_id, slot_position)
);

CREATE INDEX IF NOT EXISTS idx_pcl_asset_id ON printer_color_link(asset_id);
CREATE INDEX IF NOT EXISTS idx_pcl_ink_code ON printer_color_link(ink_code);

-- ============================================================================
-- 5. TABLE: materials (Inventory Master SKUs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS materials (
    id VARCHAR(100) PRIMARY KEY,
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    stock_qty NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    consumption_unit VARCHAR(50) NOT NULL DEFAULT 'Unit',
    purchase_unit VARCHAR(50) NOT NULL DEFAULT 'Pack',
    purchase_multiplier NUMERIC(12, 2) NOT NULL DEFAULT 1.00,
    cost_per_purchase_unit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    cost_per_consumption_unit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    reorder_threshold NUMERIC(12, 2) NOT NULL DEFAULT 10.00,
    technical_specs JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_materials_sku ON materials(sku);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);

-- ============================================================================
-- 5.2 TABLE: paper_catalog (Paper & Media Catalog)
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

-- ============================================================================
-- 7. TABLE: inbound_transactions (Inbound Procurement Audit Log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS inbound_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number VARCHAR(100),
    inbound_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sku_code VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    supplier_name VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
    unit VARCHAR(50),
    total_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'TRANSFER',
    origin VARCHAR(10) DEFAULT 'TH',
    tariff_fee NUMERIC(15, 2) DEFAULT 0,
    freight_fee NUMERIC(15, 2) DEFAULT 0,
    product_image_url TEXT,
    receipt_slip_url TEXT,
    technical_specs JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inbound_sku ON inbound_transactions(sku_code);
CREATE INDEX IF NOT EXISTS idx_inbound_date ON inbound_transactions(inbound_date);

-- ============================================================================
-- 8. TABLE: customers (CRM Customers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(100),
    email VARCHAR(100),
    address TEXT,
    credit_limit NUMERIC(15, 2) DEFAULT 1000000.00,
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- ============================================================================
-- 9. TABLES: orders & order_items (Production & Sales Orders)
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(100) PRIMARY KEY,
    order_number VARCHAR(100) NOT NULL UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'WAITING_DEPOSIT',
    deposit_amount NUMERIC(15, 2) DEFAULT 0.00,
    total_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    google_drive_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_name);

CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    job_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price_snapshot NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    cost_price_snapshot NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    specs JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ============================================================================
-- 10. TABLE: currency_rates (Daily Exchange Rates)
-- ============================================================================

CREATE TABLE IF NOT EXISTS currency_rates (
    currency_code VARCHAR(10) PRIMARY KEY,
    rate_to_lak NUMERIC(15, 4) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 11. TABLE: spoilage_logs (Defect & Spoilage Audit Log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS spoilage_logs (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(100),
    machine_id VARCHAR(100),
    material_id VARCHAR(100),
    paper_sku VARCHAR(100),
    spoilage_qty NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'Sheet',
    reason TEXT,
    cost_impact NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_spoilage_order ON spoilage_logs(order_id);


