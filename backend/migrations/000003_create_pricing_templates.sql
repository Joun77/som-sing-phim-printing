-- +goose Up
-- ============================================================================
-- Migration: 000003_create_pricing_templates.sql
-- Description: Product pricing templates table with MOQ, ink baseline coverage, and addon rates
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS product_pricing_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    baseline_coverage_percent NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    coverage_surcharge_multiplier NUMERIC(6, 4) NOT NULL DEFAULT 1.0000,
    min_order_quantity INT NOT NULL DEFAULT 1,
    min_total_price NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
    addon_rates JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pricing_templates_material_id ON product_pricing_templates(material_id);
CREATE INDEX IF NOT EXISTS idx_pricing_templates_is_active ON product_pricing_templates(is_active);

-- +goose Down
DROP INDEX IF EXISTS idx_pricing_templates_is_active;
DROP INDEX IF EXISTS idx_pricing_templates_material_id;
DROP TABLE IF EXISTS product_pricing_templates CASCADE;
