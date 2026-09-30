-- ============================================================================
-- Migration: 035_create_system_lookups_and_machinery_wear_parts.sql
-- Description: Dynamic Universal Master Data Lookups and Machinery Wear Parts
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Table: system_lookups (Universal Lookup Architecture)
CREATE TABLE IF NOT EXISTS system_lookups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lookup_type VARCHAR(50)  NOT NULL, -- 'paper_type', 'surface_finish', 'standard_dimension', 'unit_of_measure', 'binding_type'
    code        VARCHAR(50)  NOT NULL, -- Unique uppercase identifier per lookup_type
    name_lo     TEXT         NOT NULL, -- Lao name
    name_en     TEXT         NOT NULL, -- English name
    name_th     TEXT,                  -- Thai name
    attributes  JSONB        NOT NULL DEFAULT '{}'::jsonb, -- Dimensions, multipliers, default specs
    sort_order  INT          NOT NULL DEFAULT 0,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_lookup_type_code UNIQUE (lookup_type, code)
);

CREATE INDEX IF NOT EXISTS idx_system_lookups_type_active ON system_lookups(lookup_type, is_active, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_system_lookups_code ON system_lookups(code);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_system_lookups_updated_at ON system_lookups;
CREATE TRIGGER trg_system_lookups_updated_at
BEFORE UPDATE ON system_lookups
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- 2. Table: machine_wear_parts (Consumable & Replacement Parts per Machine Asset)
CREATE TABLE IF NOT EXISTS machine_wear_parts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id                VARCHAR(50)  NOT NULL REFERENCES printers(asset_id) ON DELETE CASCADE ON UPDATE CASCADE,
    part_name_lo            TEXT         NOT NULL,
    part_name_en            TEXT         NOT NULL,
    part_category           VARCHAR(50)  NOT NULL, -- 'drum', 'fuser', 'transfer_belt', 'printhead', 'pickup_roller', 'waste_box', 'blade', 'cutting_stick', 'silicone_roller', 'milling_cutter', 'punching_pin'
    cost_price_lak          NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    expected_lifespan_units BIGINT       NOT NULL DEFAULT 1,
    unit_type               VARCHAR(20)  NOT NULL DEFAULT 'pages', -- 'pages', 'meters', 'cuts', 'books'
    current_counter         BIGINT       NOT NULL DEFAULT 0,
    last_replaced_at        TIMESTAMPTZ,
    is_active               BOOLEAN      NOT NULL DEFAULT true,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_machine_wear_parts_asset ON machine_wear_parts(asset_id, is_active);

DROP TRIGGER IF EXISTS trg_machine_wear_parts_updated_at ON machine_wear_parts;
CREATE TRIGGER trg_machine_wear_parts_updated_at
BEFORE UPDATE ON machine_wear_parts
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- 3. Extend printers table with operational fields if not exist
ALTER TABLE printers ADD COLUMN IF NOT EXISTS operating_power_watts INT NOT NULL DEFAULT 0;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS warm_up_time_mins INT NOT NULL DEFAULT 0;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS max_media_width_mm NUMERIC(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS feed_type VARCHAR(20) NOT NULL DEFAULT 'sheet';


-- 4. Seed Initial Comprehensive Master Data (Lao, English, Thai)

-- 4.1 PAPER TYPES (ປະເພດເນື້ອເຈ້ຍ)
INSERT INTO system_lookups (lookup_type, code, name_lo, name_en, name_th, attributes, sort_order)
VALUES
  ('paper_type', 'PLAIN', 'ເຈ້ຍປອນ / ເຈ້ຍຖ່າຍເອກະສານ', 'Standard Bond / Woodfree Paper', 'กระดาษปอนด์ขาว', '{"default_gsm": [70, 80, 100, 120]}', 10),
  ('paper_type', 'GREEN_READ', 'ເຈ້ຍຖະໜອມສາຍຕາ (ສີຄຣີມ)', 'Green Read Eye-Care Paper', 'กระดาษถนอมสายตาสีครีม', '{"default_gsm": [65, 75, 80]}', 20),
  ('paper_type', 'KRAFT', 'ເຈ້ຍຄຣາຟສີນ້ຳຕານ (Eco Kraft)', 'Eco Brown Kraft Paper', 'กระดาษคราฟท์น้ำตาล', '{"default_gsm": [125, 175, 250, 300]}', 30),
  ('paper_type', 'GREYBOARD', 'ກະດາດຈົ່ວປັງ (ແກນປົກແຂງ)', 'Greyboard / Strawboard', 'กระดาษจั่วปังแกนปกแข็ง', '{"thickness_mm": [1.5, 2.0, 2.5, 3.0]}', 40),
  ('paper_type', 'PHOTO', 'ເຈ້ຍໂຟໂຕ້ (Photo Paper)', 'Glossy / Satin Photo Paper', 'กระดาษโฟโต้', '{"default_gsm": [180, 210, 230, 260]}', 50),
  ('paper_type', 'STICKER_PP', 'ສະຕິກເກີ PP Vinyl (ກັນນ້ຳ 100%)', 'Waterproof PP Synthetic Sticker', 'สติกเกอร์ PP ไวนิลกันน้ำ 100%', '{"is_waterproof": true, "form": "sheet_or_roll"}', 60),
  ('paper_type', 'STICKER_PVC', 'ສະຕິກເກີ PVC ກາງແຈ້ງ', 'Outdoor Durable PVC Vinyl Sticker', 'สติกเกอร์ PVC กลางแจ้ง', '{"is_waterproof": true, "form": "roll"}', 70),
  ('paper_type', 'STICKER_PAPER', 'ສະຕິກເກີເຈ້ຍ (Paper Label)', 'Standard Paper Sticker', 'สติกเกอร์กระดาษ', '{"is_waterproof": false}', 80),
  ('paper_type', 'ART_PAPER', 'ເຈ້ຍອາດເງົາ/ດ້ານ (Art Paper)', 'Gloss / Matte Art Paper', 'กระดาษอาร์ตมัน/ด้าน', '{"default_gsm": [105, 130, 160]}', 90),
  ('paper_type', 'ART_CARD', 'ເຈ້ຍອາດກາດ 2 ໜ້າ (Art Card)', 'Double-Sided Coated Art Card', 'กระดาษอาร์ตการ์ด 2 หน้า', '{"default_gsm": [210, 260, 300, 350]}', 100),
  ('paper_type', 'CANVAS', 'ຜ້າໃບແຄນວາດ (Canvas Fabric)', 'Cotton / Polyester Canvas Fabric', 'ผ้าใบแคนวาส', '{"default_gsm": [280, 380]}', 110)
ON CONFLICT (lookup_type, code) DO UPDATE
SET name_lo = EXCLUDED.name_lo,
    name_en = EXCLUDED.name_en,
    name_th = EXCLUDED.name_th,
    attributes = EXCLUDED.attributes,
    sort_order = EXCLUDED.sort_order;


-- 4.2 SURFACE FINISHES & COATINGS (ຜິວສຳຜັດ ແລະ ການເຄືອບ)
INSERT INTO system_lookups (lookup_type, code, name_lo, name_en, name_th, attributes, sort_order)
VALUES
  ('surface_finish', 'NONE', 'ບໍ່ເຄືອບ (Uncoated)', 'Uncoated Natural Surface', 'ไม่เคลือบผิว', '{}', 10),
  ('surface_finish', 'GLOSS_PVC', 'ເຄືອບ PVC ເງົາ (Glossy)', 'Gloss Thermal / Cold Lamination', 'เคลือบ PVC เงา', '{"thickness_micron": 25}', 20),
  ('surface_finish', 'MATTE_PVC', 'ເຄືອບ PVC ດ້ານ (Matte)', 'Matte Thermal / Cold Lamination', 'เคลือบ PVC ด้าน', '{"thickness_micron": 25}', 30),
  ('surface_finish', 'SOFT_TOUCH', 'ເຄືອບກຳມະຫຍີ່ Soft-Touch (Velvet)', 'Velvet Soft-Touch Luxury Finish', 'เคลือบกำมะหยี่ ซอฟต์ทัช', '{"thickness_micron": 32}', 40),
  ('surface_finish', 'SPOT_UV_3D', 'ເຄືອບ Spot UV 3D ນູນ', 'Raised 3D Spot UV Varnish', 'เคลือบสปอตยูวี 3D นูน', '{}', 50),
  ('surface_finish', 'SAND_TEXTURE', 'ເຄືອບລາຍເມັດຊາຍ (Sand)', 'Sand Grain Texture Film', 'เคลือบฟิล์มลายเม็ดทราย', '{"thickness_micron": 50}', 60),
  ('surface_finish', 'HOLOGRAM', 'ເຄືອບໂຮໂລແກຣມ (Hologram)', 'Holographic Rainbow Foil / Film', 'เคลือบโฮโลแกรม', '{"thickness_micron": 30}', 70),
  ('surface_finish', 'POUCH_GLOSS', 'ເຄືອບຮ້ອນແບບຊອງແຂງ (Pouch Film)', 'Heavy Rigid Pouch Lamination', 'เคลือบซองแข็ง', '{"thickness_micron": 125}', 80)
ON CONFLICT (lookup_type, code) DO UPDATE
SET name_lo = EXCLUDED.name_lo,
    name_en = EXCLUDED.name_en,
    name_th = EXCLUDED.name_th,
    attributes = EXCLUDED.attributes,
    sort_order = EXCLUDED.sort_order;


-- 4.3 STANDARD DIMENSIONS & SHEETS (ຂະໜາດມາດຕະຖານ)
INSERT INTO system_lookups (lookup_type, code, name_lo, name_en, name_th, attributes, sort_order)
VALUES
  ('standard_dimension', 'A4', 'A4 (210 x 297 mm)', 'A4 Standard Sheet', 'A4 (210 x 297 มม.)', '{"width_mm": 210.0, "height_mm": 297.0, "category": "cut_sheet"}', 10),
  ('standard_dimension', 'A3', 'A3 (297 x 420 mm)', 'A3 Sheet', 'A3 (297 x 420 มม.)', '{"width_mm": 297.0, "height_mm": 420.0, "category": "cut_sheet"}', 20),
  ('standard_dimension', 'A3_PLUS', 'A3+ (329 x 483 mm / Super A3)', 'A3+ Super Sheet', 'A3+ ซูเปอร์ (329 x 483 มม.)', '{"width_mm": 329.0, "height_mm": 483.0, "category": "cut_sheet"}', 30),
  ('standard_dimension', 'SRA3', 'SRA3 (320 x 450 mm)', 'SRA3 Digital Press Sheet', 'SRA3 แท่นพิมพ์ดิจิทัล (320 x 450 มม.)', '{"width_mm": 320.0, "height_mm": 450.0, "category": "cut_sheet"}', 40),
  ('standard_dimension', 'A5', 'A5 (148 x 210 mm)', 'A5 Half Sheet', 'A5 (148 x 210 มม.)', '{"width_mm": 148.0, "height_mm": 210.0, "category": "cut_sheet"}', 50),
  ('standard_dimension', 'A6', 'A6 / 4x6" (105 x 148 mm)', 'A6 Postcard / Photo', 'A6 โปสการ์ด/รูปภาพ (105 x 148 มม.)', '{"width_mm": 105.0, "height_mm": 148.0, "category": "cut_sheet"}', 60),
  ('standard_dimension', 'BUSINESS_CARD', 'ນາມບັດ (90 x 54 mm)', 'Standard Business Card', 'นามบัตรมาตรฐาน (90 x 54 มม.)', '{"width_mm": 90.0, "height_mm": 54.0, "category": "card"}', 70),
  ('standard_dimension', 'PARENT_31X43', 'ແຜ່ນໃຫຍ່ 31 x 43 ນິ້ວ (787 x 1092 mm)', 'Parent Sheet 31x43 Inch', 'กระดาษแผ่นใหญ่ 31 x 43 นิ้ว', '{"width_mm": 787.0, "height_mm": 1092.0, "category": "parent_sheet"}', 80),
  ('standard_dimension', 'PARENT_24X35', 'ແຜ່ນໃຫຍ່ 24 x 35 ນິ້ວ (610 x 889 mm)', 'Parent Sheet 24x35 Inch', 'กระดาษแผ่นใหญ่ 24 x 35 นิ้ว', '{"width_mm": 610.0, "height_mm": 889.0, "category": "parent_sheet"}', 90),
  ('standard_dimension', 'RIGID_1220X2440', 'ແຜ່ນບອດມາດຕະຖານ 1.22 x 2.44 ແມັດ', 'Rigid Board Sheet 1220x2440 mm', 'แผ่นบอร์ดมาตรฐาน 1220 x 2440 มม.', '{"width_mm": 1220.0, "height_mm": 2440.0, "area_sqm": 2.9768, "category": "rigid_sheet"}', 100)
ON CONFLICT (lookup_type, code) DO UPDATE
SET name_lo = EXCLUDED.name_lo,
    name_en = EXCLUDED.name_en,
    name_th = EXCLUDED.name_th,
    attributes = EXCLUDED.attributes,
    sort_order = EXCLUDED.sort_order;


-- 4.4 UNITS OF MEASURE (ຫົວໜ່ວຍນັບ ແລະ ຈັດຊື້)
INSERT INTO system_lookups (lookup_type, code, name_lo, name_en, name_th, attributes, sort_order)
VALUES
  ('unit_of_measure', 'SHEET', 'ແຜ່ນ', 'Sheet', 'แผ่น', '{"base_unit": "SHEET", "multiplier": 1}', 10),
  ('unit_of_measure', 'REAM', 'ຣີມ (500 ແຜ່ນ)', 'Ream (500 Sheets)', 'รีม (500 แผ่น)', '{"base_unit": "SHEET", "multiplier": 500}', 20),
  ('unit_of_measure', 'PACK_100', 'ແພັກ (100 ແຜ່ນ)', 'Pack of 100 Sheets', 'แพ็ก (100 แผ่น)', '{"base_unit": "SHEET", "multiplier": 100}', 30),
  ('unit_of_measure', 'ROLL', 'ມ້ວນ', 'Roll', 'ม้วน', '{"base_unit": "METER", "multiplier": 50}', 40),
  ('unit_of_measure', 'METER', 'ແມັດ', 'Linear Meter', 'เมตร', '{"base_unit": "METER", "multiplier": 1}', 50),
  ('unit_of_measure', 'SQM', 'ຕາແມັດ (m²)', 'Square Meter', 'ตารางเมตร', '{"base_unit": "SQM", "multiplier": 1}', 60),
  ('unit_of_measure', 'ML', 'ມິນລິລິດ (ml)', 'Milliliter (ml)', 'มิลลิลิตร', '{"base_unit": "ML", "multiplier": 1}', 70),
  ('unit_of_measure', 'BOTTLE', 'ແກ້ວເຕີມ', 'Bottle', 'ขวด', '{"base_unit": "ML", "multiplier": 100}', 80),
  ('unit_of_measure', 'GRAM', 'ກຣາມ (g)', 'Gram (g)', 'กรัม', '{"base_unit": "GRAM", "multiplier": 1}', 90),
  ('unit_of_measure', 'KG', 'ກິໂລກຣາມ (kg)', 'Kilogram (kg)', 'กิโลกรัม', '{"base_unit": "GRAM", "multiplier": 1000}', 100),
  ('unit_of_measure', 'PIECE', 'ຊິ້ນ / ອັນ', 'Piece / Item', 'ชิ้น / อัน', '{"base_unit": "PIECE", "multiplier": 1}', 110),
  ('unit_of_measure', 'BOOK', 'ເຫຼັ້ມ', 'Book / Volume', 'เล่ม', '{"base_unit": "BOOK", "multiplier": 1}', 120),
  ('unit_of_measure', 'BOX', 'ກ່ອງ', 'Box', 'กล่อง', '{"base_unit": "PIECE", "multiplier": 1}', 130)
ON CONFLICT (lookup_type, code) DO UPDATE
SET name_lo = EXCLUDED.name_lo,
    name_en = EXCLUDED.name_en,
    name_th = EXCLUDED.name_th,
    attributes = EXCLUDED.attributes,
    sort_order = EXCLUDED.sort_order;


-- 4.5 BINDING & FINISHING METHODS (ຮູບແບບການເຂົ້າເຫຼັ້ມ ແລະ ງານແປຮູບ)
INSERT INTO system_lookups (lookup_type, code, name_lo, name_en, name_th, attributes, sort_order)
VALUES
  ('binding_type', 'PERFECT_BIND', 'ເຂົ້າເຫຼັ້ມກາວຮ້ອນ (Perfect Binding)', 'Thermal Hot Melt Perfect Binding', 'เข้าเล่มไสสันทากาวร้อน', '{"glue_grams_per_book": 5}', 10),
  ('binding_type', 'WIRE_O', 'ສັນຂົດລວດຄູ່ (Wire-O Binding)', 'Double Loop Wire-O Spine', 'เข้าเล่มสันขดลวดคู่', '{"pitch": "3:1"}', 20),
  ('binding_type', 'PLASTIC_COMB', 'ສັນກະດູກງູພາດສະຕິກ (Plastic Comb)', 'Plastic Comb Spiral Binding', 'เข้าเล่มสันกระดูกงูพลาสติก', '{}', 30),
  ('binding_type', 'SADDLE_STITCH', 'ຫຍິບມຸງຫຼັງຄາ / ຫຍິບກາງ (Saddle Stitch)', 'Center Staple Saddle Stitching', 'เย็บมุงหลังคา (เย็บกลาง)', '{"staples_per_book": 2}', 40),
  ('binding_type', 'TAPE_BIND', 'ສັນຜ້າເທບກາວ (Cloth Spine Tape)', 'Cloth Spine Tape Binding', 'เข้าเล่มสันผ้าเทปกาว', '{}', 50),
  ('binding_type', 'HARDCOVER', 'ເຂົ້າເຫຼັ້ມປົກແຂງ (Hardcover / Case Binding)', 'Case Bound Hardcover with Greyboard', 'เข้าเล่มปกแข็งจั่วปัง', '{"greyboard_mm": 2.0}', 60)
ON CONFLICT (lookup_type, code) DO UPDATE
SET name_lo = EXCLUDED.name_lo,
    name_en = EXCLUDED.name_en,
    name_th = EXCLUDED.name_th,
    attributes = EXCLUDED.attributes,
    sort_order = EXCLUDED.sort_order;

-- 4.6 PAPER GRAMMAGE (GSM) (ນ້ຳໜັກເຈ້ຍ / ແກຣມ)
INSERT INTO system_lookups (lookup_type, code, name_lo, name_en, name_th, attributes, sort_order)
VALUES
  ('paper_grammage_gsm', 'GSM_70', '70 gsm (ບາງມາດຕະຖານ)', '70 GSM Lightweight', '70 แกรม', '{"gsm": 70, "is_cover": false}', 10),
  ('paper_grammage_gsm', 'GSM_80', '80 gsm (ມາດຕະຖານ A4 ຖ່າຍເອກະສານ)', '80 GSM Standard Bond', '80 แกรม (มาตรฐานเอกสาร)', '{"gsm": 80, "is_cover": false, "is_default": true}', 20),
  ('paper_grammage_gsm', 'GSM_100', '100 gsm (ປອນພຣີມ້ຽມ)', '100 GSM Smooth Uncoated', '100 แกรม', '{"gsm": 100, "is_cover": false}', 30),
  ('paper_grammage_gsm', 'GSM_120', '120 gsm (ໜາພິເສດ / ເນື້ອໃນຫຼູ)', '120 GSM Heavyweight Uncoated', '120 แกรม', '{"gsm": 120, "is_cover": false}', 40),
  ('paper_grammage_gsm', 'GSM_130', '130 gsm (ອາດເງົາ/ດ້ານ ໃບປິວ)', '130 GSM Glossy/Matte Art', '130 แกรม (อาร์ตใบปลิว)', '{"gsm": 130, "is_cover": false}', 50),
  ('paper_grammage_gsm', 'GSM_160', '160 gsm (ອາດດ້ານ ໂບຣຊົວ)', '160 GSM Matte Brochure', '160 แกรม (อาร์ตโบรชัวร์)', '{"gsm": 160, "is_cover": false}', 60),
  ('paper_grammage_gsm', 'GSM_210', '210 gsm (ອາດກາດບາງ)', '210 GSM Lightweight Art Card', '210 แกรม', '{"gsm": 210, "is_cover": true}', 70),
  ('paper_grammage_gsm', 'GSM_260', '260 gsm (ອາດກາດມາດຕະຖານປົກ)', '260 GSM Standard Cover Card', '260 แกรม (มาตรฐานปก)', '{"gsm": 260, "is_cover": true}', 80),
  ('paper_grammage_gsm', 'GSM_300', '300 gsm (ອາດກາດໜານາມບັດ)', '300 GSM Heavy Cardstock', '300 แกรม (นามบัตร/การ์ด)', '{"gsm": 300, "is_cover": true}', 90),
  ('paper_grammage_gsm', 'GSM_350', '350 gsm (ອາດກາດໜາພິເສດ VIP)', '350 GSM Ultra Heavy Board', '350 แกรม (นามบัตร VIP)', '{"gsm": 350, "is_cover": true}', 100)
ON CONFLICT (lookup_type, code) DO UPDATE
SET name_lo = EXCLUDED.name_lo,
    name_en = EXCLUDED.name_en,
    name_th = EXCLUDED.name_th,
    attributes = EXCLUDED.attributes,
    sort_order = EXCLUDED.sort_order;


-- 4.7 GREYBOARD & RIGID THICKNESS (MM) (ຄວາມໜາຈົ່ວປັງ ແລະ ແຜ່ນແຂງ)
INSERT INTO system_lookups (lookup_type, code, name_lo, name_en, name_th, attributes, sort_order)
VALUES
  ('board_thickness_mm', 'BOARD_NO_16', 'ເບີ 16 (ຄວາມໜາ 1.2 mm)', 'Greyboard No.16 (1.2 mm)', 'เบอร์ 16 (ความหนา 1.2 มม.)', '{"thickness_mm": 1.2, "board_number": 16, "suitable_for": "Desktop Calendar"}', 10),
  ('board_thickness_mm', 'BOARD_NO_20', 'ເບີ 20 (ຄວາມໜາ 1.6 mm)', 'Greyboard No.20 (1.6 mm)', 'เบอร์ 20 (ความหนา 1.6 มม.)', '{"thickness_mm": 1.6, "board_number": 20, "suitable_for": "A5 Notebook"}', 20),
  ('board_thickness_mm', 'BOARD_NO_24', 'ເບີ 24 (ຄວາມໜາ 2.0 mm)', 'Greyboard No.24 (2.0 mm Standard)', 'เบอร์ 24 (ความหนา 2.0 มม. มาตรฐานปกแข็ง)', '{"thickness_mm": 2.0, "board_number": 24, "is_default": true, "suitable_for": "Hardcover Thesis / Notebook"}', 30),
  ('board_thickness_mm', 'BOARD_NO_28', 'ເບີ 28 (ຄວາມໜາ 2.5 mm)', 'Greyboard No.28 (2.5 mm)', 'เบอร์ 28 (ความหนา 2.5 มม.)', '{"thickness_mm": 2.5, "board_number": 28, "suitable_for": "Heavy Binder / Folder"}', 40),
  ('board_thickness_mm', 'BOARD_NO_32', 'ເບີ 32 (ຄວາມໜາ 3.0 mm)', 'Greyboard No.32 (3.0 mm)', 'เบอร์ 32 (ความหนา 3.0 มม.)', '{"thickness_mm": 3.0, "board_number": 32, "suitable_for": "Rigid Luxury Box"}', 50)
ON CONFLICT (lookup_type, code) DO UPDATE
SET name_lo = EXCLUDED.name_lo,
    name_en = EXCLUDED.name_en,
    name_th = EXCLUDED.name_th,
    attributes = EXCLUDED.attributes,
    sort_order = EXCLUDED.sort_order;


-- 5. Seed Shop Defaults (Electricity Rate from EDL Bill & Flat Cutting Fee)
CREATE TABLE IF NOT EXISTS shop_defaults (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO shop_defaults (key, value)
VALUES
  ('electricity_rate_kwh', '{"rate_lak": 1700, "currency": "LAK", "description": "Effective electricity rate per kWh based on EDL bill (594 kWh = 994,005 LAK)"}'),
  ('guillotine_cutting_fee', '{"flat_fee_lak": 10000, "currency": "LAK", "mode": "flat_per_job", "description": "Standard flat cutting fee per print job"}')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();
