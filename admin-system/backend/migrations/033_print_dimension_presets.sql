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
    -- Documents (ເອກະສານ)
    ('A4 (210x297)', 'DOCUMENT', 'MM', 210.0, 297.0, 210.0, 297.0, TRUE),
    ('A3 (297x420)', 'DOCUMENT', 'MM', 297.0, 420.0, 297.0, 420.0, TRUE),
    ('A5 (148x210)', 'DOCUMENT', 'MM', 148.0, 210.0, 148.0, 210.0, TRUE),
    ('A6 (105x148)', 'DOCUMENT', 'MM', 105.0, 148.0, 105.0, 148.0, TRUE),
    ('B5 (176x250)', 'DOCUMENT', 'MM', 176.0, 250.0, 176.0, 250.0, TRUE),
    ('Letter (8.5x11")', 'DOCUMENT', 'INCH', 8.5, 11.0, 215.9, 279.4, TRUE),
    ('Folio / F4 (8.5x13")', 'DOCUMENT', 'INCH', 8.5, 13.0, 215.9, 330.2, TRUE),

    -- Photos (ຮູບພາບ)
    ('4x6" (4R / Postcard)', 'PHOTO', 'INCH', 4.0, 6.0, 101.6, 152.4, TRUE),
    ('5x7" (5R / Desk Frame)', 'PHOTO', 'INCH', 5.0, 7.0, 127.0, 177.8, TRUE),
    ('6x8" (6R)', 'PHOTO', 'INCH', 6.0, 8.0, 152.4, 203.2, TRUE),
    ('8x10" (8R / Portrait)', 'PHOTO', 'INCH', 8.0, 10.0, 203.2, 254.0, TRUE),
    ('8x12" (A4 Full Photo)', 'PHOTO', 'INCH', 8.27, 11.69, 210.0, 297.0, TRUE),
    ('3x4" (Pocket / ກະເປົາ)', 'PHOTO', 'INCH', 3.0, 4.0, 76.2, 101.6, TRUE),
    ('2x3" (Polaroid / ຕິດບັດ)', 'PHOTO', 'INCH', 2.0, 3.0, 50.8, 76.2, TRUE),
    ('12x18" (A3+ Photo)', 'PHOTO', 'INCH', 12.0, 18.0, 304.8, 457.2, TRUE),

    -- Cards & Invitations (ນາມບັດ & ກາດ)
    ('ນາມບັດມາດຕະຖານ (90x54mm)', 'CARD', 'MM', 90.0, 54.0, 90.0, 54.0, TRUE),
    ('ນາມບັດ Slim (90x50mm)', 'CARD', 'MM', 90.0, 50.0, 90.0, 50.0, TRUE),
    ('ກາດເຊີນ 4x6" (Invitation)', 'CARD', 'INCH', 4.0, 6.0, 101.6, 152.4, TRUE),
    ('ກາດແຕ່ງງານ 5x7" (Wedding)', 'CARD', 'INCH', 5.0, 7.0, 127.0, 177.8, TRUE),

    -- Stickers & Labels (ສະຕິກເກີ)
    ('ແຜ່ນ A3+ (329x483mm)', 'STICKER', 'MM', 329.0, 483.0, 329.0, 483.0, TRUE),
    ('ແຜ່ນ A4 (210x297mm)', 'STICKER', 'MM', 210.0, 297.0, 210.0, 297.0, TRUE),
    ('ດວງມົນ 3x3 cm', 'STICKER', 'CM', 3.0, 3.0, 30.0, 30.0, TRUE),
    ('ດວງມົນ 4x4 cm', 'STICKER', 'CM', 4.0, 4.0, 40.0, 40.0, TRUE),
    ('ດວງມົນ 5x5 cm', 'STICKER', 'CM', 5.0, 5.0, 50.0, 50.0, TRUE)
ON CONFLICT DO NOTHING;
