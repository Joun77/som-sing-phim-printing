-- +goose Up
-- ============================================================================
-- Migration: 042_link_printer_inks_and_clean_material_assets.sql
-- Description:
-- 1. Safely archives and cleans verified printer asset rows incorrectly stored in materials
-- 2. Populates ink_master_catalog with canonical EPSON-008 and LC-462XL inks
-- 3. Populates printer_color_link linking PRN-9614 and PRN-6317 to CMYK ink slots
-- 4. Links materials.assigned_printer_id to canonical printer asset IDs
-- 5. Seeds canonical wear parts into machine_wear_parts with unique identity idempotency
-- ============================================================================

-- 1. Create archive table and safely preserve verified asset rows before deletion
CREATE TABLE IF NOT EXISTS archived_material_assets (
    id VARCHAR(100) PRIMARY KEY,
    material_data JSONB NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Archive only verified printer asset records (PRN-9614, PRN-6317 or existing printers)
INSERT INTO archived_material_assets (id, material_data, archived_at)
SELECT m.id, to_jsonb(m), NOW()
FROM materials m
WHERE (m.id IN ('PRN-9614', 'PRN-6317') OR m.id IN (SELECT asset_id FROM printers))
  AND NOT EXISTS (SELECT 1 FROM archived_material_assets a WHERE a.id = m.id);

-- Safely clean verified asset rows only if unreferenced by foreign keys
DELETE FROM materials m
WHERE (m.id IN ('PRN-9614', 'PRN-6317') OR m.id IN (SELECT asset_id FROM printers))
  AND NOT EXISTS (
      SELECT 1 FROM machine_wear_part_logs l WHERE l.material_id = m.id
  );

-- 2. Populate ink_master_catalog with canonical ink entries
INSERT INTO ink_master_catalog (
    ink_code, color_name, color_group, volume, stock_quantity,
    unit_price, ink_base_type, is_compatible_ink, technical_specs, created_at, updated_at
) VALUES
    -- Epson 008 series for PRN-9614 (Pigment)
    ('EPSON-008-BK', 'Epson 008 Black Pigment Ink', 'Black', '127ml', 25, 95000.00, 'Pigment'::ink_base_type_enum, 'OEM'::ink_compatibility_enum, '{"brand": "Epson", "model": "008", "volume_ml": 127, "standard_page_yield": 7500}'::jsonb, NOW(), NOW()),
    ('EPSON-008-C',  'Epson 008 Cyan Pigment Ink',  'Cyan',  '70ml',  20, 95000.00, 'Pigment'::ink_base_type_enum, 'OEM'::ink_compatibility_enum, '{"brand": "Epson", "model": "008", "volume_ml": 70, "standard_page_yield": 6000}'::jsonb, NOW(), NOW()),
    ('EPSON-008-M',  'Epson 008 Magenta Pigment Ink', 'Magenta', '70ml', 20, 95000.00, 'Pigment'::ink_base_type_enum, 'OEM'::ink_compatibility_enum, '{"brand": "Epson", "model": "008", "volume_ml": 70, "standard_page_yield": 6000}'::jsonb, NOW(), NOW()),
    ('EPSON-008-Y',  'Epson 008 Yellow Pigment Ink', 'Yellow', '70ml', 20, 95000.00, 'Pigment'::ink_base_type_enum, 'OEM'::ink_compatibility_enum, '{"brand": "Epson", "model": "008", "volume_ml": 70, "standard_page_yield": 6000}'::jsonb, NOW(), NOW()),
    -- Brother LC462XL series for PRN-6317 (Dye)
    ('LC462XL-BK', 'Brother LC462XL Black Ink', 'Black', '65ml', 15, 430000.00, 'Dye'::ink_base_type_enum, 'OEM'::ink_compatibility_enum, '{"brand": "Brother", "model": "LC462XL", "volume_ml": 65, "standard_page_yield": 3000}'::jsonb, NOW(), NOW()),
    ('LC462XL-C',  'Brother LC462XL Cyan Ink',  'Cyan',  '19ml', 10, 430000.00, 'Dye'::ink_base_type_enum, 'OEM'::ink_compatibility_enum, '{"brand": "Brother", "model": "LC462XL", "volume_ml": 19, "standard_page_yield": 1500}'::jsonb, NOW(), NOW()),
    ('LC462XL-M',  'Brother LC462XL Magenta Ink', 'Magenta', '19ml', 10, 430000.00, 'Dye'::ink_base_type_enum, 'OEM'::ink_compatibility_enum, '{"brand": "Brother", "model": "LC462XL", "volume_ml": 19, "standard_page_yield": 1500}'::jsonb, NOW(), NOW()),
    ('LC462XL-Y',  'Brother LC462XL Yellow Ink', 'Yellow', '19ml', 10, 430000.00, 'Dye'::ink_base_type_enum, 'OEM'::ink_compatibility_enum, '{"brand": "Brother", "model": "LC462XL", "volume_ml": 19, "standard_page_yield": 1500}'::jsonb, NOW(), NOW())
ON CONFLICT (ink_code) DO UPDATE SET
    color_name = EXCLUDED.color_name,
    color_group = EXCLUDED.color_group,
    volume = EXCLUDED.volume,
    unit_price = EXCLUDED.unit_price,
    ink_base_type = EXCLUDED.ink_base_type,
    is_compatible_ink = EXCLUDED.is_compatible_ink,
    technical_specs = EXCLUDED.technical_specs,
    updated_at = NOW();

-- 3. Populate printer_color_link for PRN-9614 (Epson L15150)
INSERT INTO printer_color_link (
    asset_id, ink_code, slot_position, iso_page_yield_a4,
    oem_standard_volume_ml, oem_standard_iso_yield_a4, base_consumption_rate_ml, created_at
)
SELECT seed.* FROM (VALUES
    ('PRN-9614', 'EPSON-008-BK', 'Slot 1 (K - Black)', 7500, 127.00, 7500, 0.016933, NOW()),
    ('PRN-9614', 'EPSON-008-C',  'Slot 2 (C - Cyan)',  6000, 70.00,  6000, 0.011667, NOW()),
    ('PRN-9614', 'EPSON-008-M',  'Slot 3 (M - Magenta)', 6000, 70.00, 6000, 0.011667, NOW()),
    ('PRN-9614', 'EPSON-008-Y',  'Slot 4 (Y - Yellow)', 6000, 70.00,  6000, 0.011667, NOW())
) AS seed(asset_id, ink_code, slot_position, iso_page_yield_a4, oem_standard_volume_ml, oem_standard_iso_yield_a4, base_consumption_rate_ml, created_at)
JOIN printers p ON p.asset_id = seed.asset_id
ON CONFLICT (asset_id, slot_position) DO UPDATE SET
    ink_code = EXCLUDED.ink_code,
    iso_page_yield_a4 = EXCLUDED.iso_page_yield_a4,
    oem_standard_volume_ml = EXCLUDED.oem_standard_volume_ml,
    oem_standard_iso_yield_a4 = EXCLUDED.oem_standard_iso_yield_a4,
    base_consumption_rate_ml = EXCLUDED.base_consumption_rate_ml;

-- 4. Populate printer_color_link for PRN-6317 (Brother MFC-J2740DW)
INSERT INTO printer_color_link (
    asset_id, ink_code, slot_position, iso_page_yield_a4,
    oem_standard_volume_ml, oem_standard_iso_yield_a4, base_consumption_rate_ml, created_at
)
SELECT seed.* FROM (VALUES
    ('PRN-6317', 'LC462XL-BK', 'Slot 1 (K - Black)', 3000, 65.00, 3000, 0.021667, NOW()),
    ('PRN-6317', 'LC462XL-C',  'Slot 2 (C - Cyan)',  1500, 19.00, 1500, 0.012667, NOW()),
    ('PRN-6317', 'LC462XL-M',  'Slot 3 (M - Magenta)', 1500, 19.00, 1500, 0.012667, NOW()),
    ('PRN-6317', 'LC462XL-Y',  'Slot 4 (Y - Yellow)', 1500, 19.00, 1500, 0.012667, NOW())
) AS seed(asset_id, ink_code, slot_position, iso_page_yield_a4, oem_standard_volume_ml, oem_standard_iso_yield_a4, base_consumption_rate_ml, created_at)
JOIN printers p ON p.asset_id = seed.asset_id
ON CONFLICT (asset_id, slot_position) DO UPDATE SET
    ink_code = EXCLUDED.ink_code,
    iso_page_yield_a4 = EXCLUDED.iso_page_yield_a4,
    oem_standard_volume_ml = EXCLUDED.oem_standard_volume_ml,
    oem_standard_iso_yield_a4 = EXCLUDED.oem_standard_iso_yield_a4,
    base_consumption_rate_ml = EXCLUDED.base_consumption_rate_ml;

-- 5. Link materials.assigned_printer_id to respective printers
UPDATE materials
SET assigned_printer_id = 'PRN-9614'
WHERE EXISTS (SELECT 1 FROM printers WHERE asset_id = 'PRN-9614')
  AND (id IN ('INB-7677', 'INK-8713', 'INK-0365', 'INK-6588')
   OR sku IN ('EPSON-008-BK', 'EPSON-008-C', 'EPSON-008-M', 'EPSON-008-Y')
   OR name ILIKE '%Epson-008%'
   OR name ILIKE '%Epson 008%');

UPDATE materials
SET assigned_printer_id = 'PRN-6317'
WHERE EXISTS (SELECT 1 FROM printers WHERE asset_id = 'PRN-6317')
  AND (id IN ('INK-8306', 'INK-0093', 'INK-1160', 'INK-3389')
   OR sku IN ('LC462XL-BK', 'LC462XL-C', 'LC462XL-M', 'LC462XL-Y', 'LC-462XL-BK', 'LC-462XL-C', 'LC-462XL-M', 'LC-462XL-Y')
   OR name ILIKE '%LC-462%'
   OR name ILIKE '%LC462%');

-- 6. Ensure machine_wear_parts has unique constraint on (asset_id, part_name_en) for idempotent seeding
CREATE UNIQUE INDEX IF NOT EXISTS uq_machine_wear_parts_asset_part_en
ON machine_wear_parts (asset_id, part_name_en);

INSERT INTO machine_wear_parts (
    id, asset_id, part_name_lo, part_name_en, part_category,
    cost_price_lak, expected_lifespan_units, unit_type, current_counter, is_active, created_at, updated_at
)
SELECT seed.* FROM (VALUES
    (gen_random_uuid(), 'PRN-9614', 'ລູກຢາງດຶງເຈ້ຍ', 'Pickup Roller', 'roller', 600000, 50000, 'pages', 0, true, NOW(), NOW()),
    (gen_random_uuid(), 'PRN-9614', 'ກ່ອງຊັບໝຶກເສຍ', 'Maintenance Box', 'box', 700000, 50000, 'pages', 0, true, NOW(), NOW()),
    (gen_random_uuid(), 'PRN-9614', 'ສາຍພານຫົວພິມ', 'Carriage Belt', 'belt', 600000, 50000, 'pages', 0, true, NOW(), NOW()),
    (gen_random_uuid(), 'PRN-9614', 'ຫົວພິມ PrecisionCore', 'PrecisionCore Printhead', 'printhead', 4000000, 100000, 'pages', 0, true, NOW(), NOW()),
    (gen_random_uuid(), 'PRN-6317', 'ລູກຢາງດຶງເຈ້ຍ', 'Pickup Roller', 'roller', 450000, 40000, 'pages', 0, true, NOW(), NOW()),
    (gen_random_uuid(), 'PRN-6317', 'ຊຸດແຜ່ນຊັບໝຶກເສຍ', 'Waste Ink Absorber', 'box', 550000, 40000, 'pages', 0, true, NOW(), NOW()),
    (gen_random_uuid(), 'PRN-6317', 'ຫົວພິມ Brother Piezo', 'Brother Piezo Printhead', 'printhead', 2800000, 80000, 'pages', 0, true, NOW(), NOW())
) AS seed(id, asset_id, part_name_lo, part_name_en, part_category, cost_price_lak, expected_lifespan_units, unit_type, current_counter, is_active, created_at, updated_at)
JOIN printers p ON p.asset_id = seed.asset_id
ON CONFLICT (asset_id, part_name_en) DO UPDATE SET
    part_name_lo = EXCLUDED.part_name_lo,
    part_category = EXCLUDED.part_category,
    cost_price_lak = EXCLUDED.cost_price_lak,
    expected_lifespan_units = EXCLUDED.expected_lifespan_units,
    unit_type = EXCLUDED.unit_type,
    is_active = true,
    updated_at = NOW();
