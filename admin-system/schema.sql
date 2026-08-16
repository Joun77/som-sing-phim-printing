-- Enable UUID extension for secure random IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Role-Based Access Control)
CREATE TYPE user_role AS ENUM ('admin', 'sales', 'production');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for authentication queries
CREATE INDEX idx_users_username ON users(username);


-- 2. Materials Table (Inventory Master Catalog)
CREATE TYPE material_category AS ENUM ('paper', 'ink', 'lamination', 'binding', 'spare_parts');

CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category material_category NOT NULL,
    stock_qty NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    consumption_unit VARCHAR(50) NOT NULL, -- e.g., Sheet, ml, Unit, Ream
    purchase_unit VARCHAR(50) NOT NULL, -- e.g., Ream, Bottle, Pack
    purchase_multiplier NUMERIC(12, 2) NOT NULL DEFAULT 1.00, -- e.g., 500 Sheets/Ream
    cost_per_purchase_unit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cost_per_consumption_unit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    reorder_threshold NUMERIC(12, 2) NOT NULL DEFAULT 10.00,
    specification_meta JSONB, -- Stores flexible, category-specific details (microns, grammage, base type)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_materials_sku ON materials(sku);
CREATE INDEX idx_materials_category ON materials(category);


-- 3. Printers Table & Related Enums
CREATE TYPE printer_category_enum AS ENUM ('Inkjet', 'Laser', 'Thermal', 'Dot Matrix', 'MFP', 'Plotter');
CREATE TYPE printer_color_scheme_enum AS ENUM ('Monochrome', 'CMYK', 'Photo', 'Custom');
CREATE TYPE printer_status_enum AS ENUM ('In Use', 'Spare', 'Under Repair', 'Retired');
CREATE TYPE ink_base_type_enum AS ENUM ('Dye', 'Pigment', 'Toner', 'Eco-Solvent', 'UV');
CREATE TYPE ink_compatibility_enum AS ENUM ('OEM', 'Compatible');
CREATE TYPE paper_format_enum AS ENUM ('Sheet', 'Roll');

CREATE TABLE printers (
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

CREATE INDEX idx_printers_serial_number ON printers(serial_number);
CREATE INDEX idx_printers_category ON printers(category);
CREATE INDEX idx_printers_status ON printers(status);


-- 3.2 Ink Master Catalog Table
CREATE TABLE ink_master_catalog (
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

CREATE INDEX idx_ink_color_group ON ink_master_catalog(color_group);
CREATE INDEX idx_ink_base_type ON ink_master_catalog(ink_base_type);


-- 3.3 Printer Color Link Table (1:N Mapping)
CREATE TABLE printer_color_link (
    link_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id VARCHAR(50) NOT NULL REFERENCES printers(asset_id) ON DELETE CASCADE ON UPDATE CASCADE,
    ink_code VARCHAR(100) NOT NULL REFERENCES ink_master_catalog(ink_code) ON DELETE CASCADE ON UPDATE CASCADE,
    slot_position VARCHAR(50) NOT NULL,
    iso_page_yield_a4 INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_asset_slot UNIQUE (asset_id, slot_position)
);

CREATE INDEX idx_pcl_asset_id ON printer_color_link(asset_id);
CREATE INDEX idx_pcl_ink_code ON printer_color_link(ink_code);


-- 3.4 Paper Catalog Table
CREATE TABLE paper_catalog (
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

CREATE INDEX idx_paper_format ON paper_catalog(paper_format);


-- 3.5 Quotations & Quotation Items Tables
CREATE TABLE quotations (
    quotation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR(150) NOT NULL,
    total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    overall_profit_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quotations_customer ON quotations(customer_name);
CREATE INDEX idx_quotations_created_at ON quotations(created_at);

CREATE TABLE quotation_items (
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

CREATE INDEX idx_quotation_items_quotation ON quotation_items(quotation_id);



-- 4. Orders Table (Sales & Workflows)
CREATE TYPE order_status AS ENUM (
    'DRAFT',
    'WAITING_DEPOSIT',
    'PREPRESS_CHECK',
    'WAITING_APPROVAL',
    'READY_TO_PRINT',
    'IN_PRODUCTION',
    'COMPLETED',
    'DELIVERED'
);

CREATE TABLE currency_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    currency VARCHAR(10) UNIQUE NOT NULL,
    rate_to_lak NUMERIC(12, 6) NOT NULL DEFAULT 1.000000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50),
    status order_status NOT NULL DEFAULT 'DRAFT',
    deposit_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'LAK',
    exchange_rate NUMERIC(12, 6) DEFAULT 1.000000,
    google_drive_link TEXT, -- File access for production prepress
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);


-- 5. Order Items Table (Pricing Snapshot)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    job_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    
    -- CRITICAL Snapshots (prevents invoice deviation when material costs increase)
    unit_price_snapshot NUMERIC(12, 2) NOT NULL,
    cost_price_snapshot NUMERIC(12, 2) NOT NULL,
    
    specs JSONB, -- Stores specific dimensions, paper configurations, lamination type, and ink coverage %
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);


-- 6. Material Stock Reservations Table (Reserved stock at READY_TO_PRINT)
CREATE TABLE order_item_material_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    material_id UUID REFERENCES materials(id) ON DELETE RESTRICT,
    quantity_reserved NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 7. Inventory Transactions Table (Ledger)
CREATE TYPE transaction_type AS ENUM ('inbound', 'allocation', 'wastage', 'offcut_return', 'manual_adjustment');

CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(id) ON DELETE RESTRICT,
    qty_adjusted NUMERIC(12, 2) NOT NULL, -- positive for inbound/returns, negative for allocations/wastage
    type transaction_type NOT NULL,
    reference_id UUID, -- References order_id or order_item_id if applicable
    performed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_transactions_material ON inventory_transactions(material_id);


-- 8. Reusable Offcuts (Scraps Returned to Stock)
CREATE TABLE offcuts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_material_id UUID REFERENCES materials(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    width_mm NUMERIC(8, 2),
    length_mm NUMERIC(8, 2),
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 1.00,
    returned_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Public Web Catalog & Tier Discounts
CREATE TABLE IF NOT EXISTS public_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    features TEXT[] DEFAULT '{}',
    thumbnail_url VARCHAR(500),
    gallery_urls TEXT[] DEFAULT '{}',
    min_quantity INT DEFAULT 1,
    lead_time_days INT DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public_product_options (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES public_products(id) ON DELETE CASCADE,
    option_type VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    value VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    extra_cost_rate NUMERIC(10, 4) DEFAULT 0.0000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_discount_tiers (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES public_products(id) ON DELETE CASCADE,
    min_quantity INT NOT NULL,
    discount_percentage NUMERIC(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_public_products_slug ON public_products(slug);
CREATE INDEX IF NOT EXISTS idx_public_products_category ON public_products(category);
CREATE INDEX IF NOT EXISTS idx_public_products_active ON public_products(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_public_product_options_pid ON public_product_options(product_id);
CREATE INDEX IF NOT EXISTS idx_product_discount_tiers_pid ON product_discount_tiers(product_id);

