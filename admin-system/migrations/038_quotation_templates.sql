-- Migration 038: Quotation Templates Central Database Persistence
-- Stores master quotation templates for 1-click preset calculation shared across all staff

CREATE TABLE IF NOT EXISTS quotation_templates (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_lao VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    icon_name VARCHAR(50) DEFAULT 'Sparkles',
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    spec_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotation_templates_category ON quotation_templates(category);
