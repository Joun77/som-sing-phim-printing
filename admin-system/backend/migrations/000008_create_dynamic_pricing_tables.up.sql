-- ============================================================================
-- Migration: 000008_create_dynamic_pricing_tables.up.sql
-- Description: Dynamic pricing configurations and order item cost breakdowns
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_pricing_configs (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL UNIQUE,
    calculation_model VARCHAR(32) NOT NULL, -- 'BOOK_BOUND', 'SINGLE_SHEET', 'CARD_UNIT'
    base_setup_cost NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    black_mono_cost_per_percent NUMERIC(12, 6) NOT NULL DEFAULT 0.000000,
    cmyk_color_cost_per_percent NUMERIC(12, 6) NOT NULL DEFAULT 0.000000,
    default_fallback_tac NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_item_cost_breakdowns (
    id VARCHAR(64) PRIMARY KEY,
    order_item_id VARCHAR(64) NOT NULL,
    paper_cost NUMERIC(12, 4) NOT NULL,
    ink_cost NUMERIC(12, 4) NOT NULL,
    binding_cost NUMERIC(12, 4) NOT NULL,
    finishing_cost NUMERIC(12, 4) NOT NULL,
    unit_price NUMERIC(12, 4) NOT NULL,
    total_price NUMERIC(12, 4) NOT NULL,
    raw_c_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    raw_m_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    raw_y_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    raw_k_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    raw_tac_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    applied_tac_pct NUMERIC(5, 2) NOT NULL,
    is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_pricing_configs_product_id ON product_pricing_configs(product_id);
CREATE INDEX IF NOT EXISTS idx_order_item_cost_breakdowns_order_item_id ON order_item_cost_breakdowns(order_item_id);
