-- ============================================================================
-- Migration: 033_print_dimension_presets.sql
-- Description: Dynamic custom dimension presets and shop default preferences
-- ============================================================================

CREATE TABLE IF NOT EXISTS print_dimension_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'PHOTO', -- 'PHOTO', 'BOOK', 'GENERAL', 'CARD'
    unit VARCHAR(10) NOT NULL DEFAULT 'INCH',      -- 'INCH', 'CM', 'MM'
    width NUMERIC(10, 2) NOT NULL,
    height NUMERIC(10, 2) NOT NULL,
    width_mm NUMERIC(10, 2) NOT NULL,
    height_mm NUMERIC(10, 2) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_defaults (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed standard common presets
INSERT INTO print_dimension_presets (name, category, unit, width, height, width_mm, height_mm, is_default)
VALUES 
    ('4x6" (A6)', 'PHOTO', 'INCH', 4.0, 6.0, 101.6, 152.4, TRUE),
    ('5x7" (Photo)', 'PHOTO', 'INCH', 5.0, 7.0, 127.0, 177.8, FALSE),
    ('3x4" (Pocket)', 'PHOTO', 'INCH', 3.0, 4.0, 76.2, 101.6, FALSE),
    ('2x3" (Polaroid)', 'PHOTO', 'INCH', 2.0, 3.0, 50.8, 76.2, FALSE),
    ('8x10" (Portrait)', 'PHOTO', 'INCH', 8.0, 10.0, 203.2, 254.0, FALSE),
    ('8x12" (A4 Full)', 'PHOTO', 'INCH', 8.27, 11.69, 210.0, 297.0, FALSE)
ON CONFLICT DO NOTHING;
