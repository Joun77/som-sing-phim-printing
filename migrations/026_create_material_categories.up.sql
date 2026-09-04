-- ============================================================================
-- Migration: 026_create_material_categories
-- Description: Create material_categories table for dynamic category management
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS material_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key         VARCHAR(64)  NOT NULL UNIQUE,
    name_lo     TEXT         NOT NULL,
    name_en     TEXT         NOT NULL,
    icon        VARCHAR(64)  NOT NULL DEFAULT 'layers',
    description_lo TEXT,
    description_en TEXT,
    sort_order  INT          NOT NULL DEFAULT 0,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_material_categories_sort ON material_categories(sort_order ASC) WHERE is_active = true;

CREATE TRIGGER trg_material_categories_updated_at
BEFORE UPDATE ON material_categories
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Seed initial 5 categories corresponding to the existing materials
INSERT INTO material_categories (key, name_lo, name_en, icon, sort_order)
VALUES
  ('art',       'Art Paper (ເຈ້ຍອາດ)',         'Art Paper & Card',       'layers',   10),
  ('uncoated',  'Woodfree (ເຈ້ຍປອນ/A4)',       'Woodfree & Uncoated',    'file-text', 20),
  ('kraft',     'Kraft (ເຈ້ຍຄຣາຟ)',            'Kraft Eco Stock',        'leaf',     30),
  ('specialty', 'Specialty Card (ເຈ້ຍພິເສດ)',  'Specialty & Luxury',     'sparkles', 40),
  ('sticker',   'Sticker (ສະຕິກເກີ)',           'Stickers & Labels',      'tag',      50)
ON CONFLICT (key) DO NOTHING;
