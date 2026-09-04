-- ============================================================================
-- Migration: 000013_create_supplier_po_tables.up.sql
-- Description: Suppliers master, purchase orders, PO lines, and goods receipts
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Suppliers Master
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    tax_id VARCHAR(50),
    payment_terms_days INT DEFAULT 30,
    currency VARCHAR(10) DEFAULT 'LAK',
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    branch_id UUID NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code);

-- 2. PO Status Enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'po_status') THEN
        CREATE TYPE po_status AS ENUM ('DRAFT', 'SENT', 'PARTIAL_RECEIVED', 'RECEIVED', 'CANCELLED');
    END IF;
END $$;

-- 3. Purchase Orders Header
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    status po_status DEFAULT 'DRAFT',
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery DATE,
    total_amount NUMERIC(15, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'LAK',
    notes TEXT,
    created_by VARCHAR(64),
    approved_by VARCHAR(64),
    approved_at TIMESTAMPTZ,
    branch_id UUID NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);

-- 4. PO Line Items
CREATE TABLE IF NOT EXISTS purchase_order_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    material_id VARCHAR(64),
    description TEXT NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    total_price NUMERIC(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    received_qty NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pol_po ON purchase_order_lines(po_id);

-- 5. Goods Receipts (When items arrive against PO)
CREATE TABLE IF NOT EXISTS goods_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id),
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    received_by VARCHAR(64),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goods_receipt_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    po_line_id UUID NOT NULL REFERENCES purchase_order_lines(id),
    received_qty NUMERIC(12, 2) NOT NULL,
    inbound_transaction_id VARCHAR(64)
);

-- 6. Link supplier_id and po_id to accounts_payable
ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);
ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS po_id UUID REFERENCES purchase_orders(id);
