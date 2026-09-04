-- ============================================================================
-- Migration: 025_create_product_materials
-- Description: Create product_materials and product_faqs tables for
--              dynamic material guide management (replaces hardcoded PAPER_DATA)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: product_materials
CREATE TABLE IF NOT EXISTS product_materials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category        VARCHAR(64)  NOT NULL,
    category_name_lo TEXT        NOT NULL,
    category_name_en TEXT        NOT NULL,
    name_lo         TEXT         NOT NULL,
    name_en         TEXT         NOT NULL,
    gsm             INT          NOT NULL,
    finish_lo       TEXT,
    finish_en       TEXT,
    texture_class   VARCHAR(64),
    description_lo  TEXT,
    description_en  TEXT,
    pros_lo         TEXT,
    pros_en         TEXT,
    cons_lo         TEXT,
    cons_en         TEXT,
    finishing_compat_lo TEXT,
    finishing_compat_en TEXT,
    suitable_for_lo TEXT[]       NOT NULL DEFAULT '{}',
    suitable_for_en TEXT[]       NOT NULL DEFAULT '{}',
    product_link    TEXT,
    product_title   TEXT,
    sort_order      INT          NOT NULL DEFAULT 0,
    is_active       BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_materials_category  ON product_materials(category);
CREATE INDEX IF NOT EXISTS idx_product_materials_sort      ON product_materials(sort_order ASC) WHERE is_active = true;

-- Table: product_faqs
CREATE TABLE IF NOT EXISTS product_faqs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_lo  TEXT         NOT NULL,
    question_en  TEXT,
    answer_lo    TEXT         NOT NULL,
    answer_en    TEXT,
    sort_order   INT          NOT NULL DEFAULT 0,
    is_active    BOOLEAN      NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Reuse existing trigger function (trigger_set_timestamp already exists from migration 000001)
CREATE TRIGGER trg_product_materials_updated_at
BEFORE UPDATE ON product_materials
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER trg_product_faqs_updated_at
BEFORE UPDATE ON product_faqs
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Seed initial data from existing PAPER_DATA hardcoded values (8 items)
INSERT INTO product_materials (category, category_name_lo, category_name_en, name_lo, name_en, gsm, finish_lo, finish_en, texture_class, description_lo, description_en, pros_lo, pros_en, cons_lo, cons_en, finishing_compat_lo, finishing_compat_en, suitable_for_lo, suitable_for_en, product_link, product_title, sort_order)
VALUES
  ('art', 'Art Paper (ເຈ້ຍອາດ)', 'Art Paper & Card', 'ເຈ້ຍອາດກາດ 2 ໜ້າ (Art Card)', 'Double-Sided Coated Art Card', 300, 'ຜິວກຶ່ງມັນກຶ່ງດ້ານ ລຽບນຽນພິເສດ', 'Semi-matte ultra-smooth multi-coated stock', 'texture-artcard', 'ເນື້ອເຈ້ຍແໜ້ນ ໜາແຂງແຮງ ພິມສີສັນສົດໃສຄົມຊັດສູງສຸດ ນິຍົມເຄືອບ PVC ເງົາ ຫຼື ດ້ານ ເພື່ອເພີ່ມຄວາມຫຼູຫຼາ', 'Rigid, high-density art board engineered for vibrant color reproduction and luxury finishes.', 'ຮອງຮັບການປ້ຳນູນ (Emboss), ປ້ຳຟອຍຄຳ (Hot Foil), ເຄືອບ Spot UV ແລະ ບໍ່ຫັກແຕກເມື່ອກົດຮອຍພັບ', 'Supports Embossing, Gold Foil, Spot UV, and creasing lines for crack-free folding.', 'ຕ້ອງເຮັດຮອຍພັບ (Crease) ກ່ອນດັດພັບ ເພື່ອປ້ອງກັນຮອຍແຕກທີ່ສັນພັບ', 'Requires creasing line before folding to avoid cracking on the spine.', 'ເຄືອບ PVC ເງົາ/ດ້ານ, Spot UV 3D, ປ້ຳຟອຍຄຳ/ເງິນ, ໄດຄັດຕາມຊົງ', 'Gloss/Matte PVC, 3D Spot UV, Hot Foil Stamping, Custom Die-cut', ARRAY['ນາມບັດ VIP', 'ກ່ອງບັນຈຸພັນ', 'ປົກປຶ້ມ/ລາຍງານ', 'ບັດເຊີນງານດອງ'], ARRAY['VIP Business Cards', 'Packaging Boxes', 'Book Covers', 'Wedding Invitations'], '/product/photo-print-card?paper=art-350', 'ງານນາມບັດ & ການ໌ດ', 10),
  ('art', 'Art Paper (ເຈ້ຍອາດ)', 'Art Paper & Card', 'ເຈ້ຍອາດເງົາ (Glossy Art Paper)', 'Glossy Art Paper', 130, 'ຜິວເງົາສະທ້ອນແສງ ສີສົດໃສ', 'High-gloss dual coated sheen for radiant color depth', 'texture-glossy', 'ເຈ້ຍເນື້ອລຽບເງົາ ສະທ້ອນແສງໄດ້ດີ ຊຶມຊັບນ້ຳມຶກຕ່ຳ ເຮັດໃຫ້ງານພິມສີສົດ ຄົມຊັດ ລາຄາຄຸ້ມຄ່າ', 'High-gloss coated paper reflecting ambient light brilliantly, delivering saturated colors and sharp details.', 'ສີສັນສົດໃສ ລາຄາປະຢັດ ນ້ຳໜັກເບົາ ເໝາະສຳລັບແຈກຈ່າຍຈຳນວນຫຼາຍ', 'Vibrant graphics, economical for bulk printing, lightweight for easy distribution.', 'ຂຽນທັບດ້ວຍບິກລູກລື່ນຍາກ ເນື່ອງຈາກຜິວເຄືອບມັນລື່ນ', 'Difficult to write on with ballpoint pens due to smooth glossy surface.', 'ພັບແຜ່ນພັບ 2-3 ຕອນ, ເຄືອບວານິດເງົາ, ເຢັບແມັກເລັ້ມ', 'Bi-fold / Tri-fold, Gloss Varnish, Saddle Stitch', ARRAY['ໃບປິວໂຄສະນາ', 'ໂບຣຊົວ', 'ແຜ່ນພັບ 3 ຕອນ', 'ແຄັດຕາລັອກ'], ARRAY['Flyers', 'Brochures', 'Tri-fold Leaflets', 'Catalogs'], '/product/doc-copy-binding?paper=art-130', 'ງານໃບປິວ & ແຜ່ນພັບ', 20),
  ('art', 'Art Paper (ເຈ້ຍອາດ)', 'Art Paper & Card', 'ເຈ້ຍອາດດ້ານ (Matte Art Paper)', 'Matte Art Paper', 160, 'ຜິວດ້ານນຽນນຸ່ມ ບໍ່ສະທ້ອນແສງ', 'Silky glare-free matte texture with high print contrast', 'texture-matte', 'ເນື້ອເຈ້ຍນຽນນຸ່ມ ສະບາຍຕາ ຫຼຸດແສງສະທ້ອນ ເໝາະກັບງານພິມທີ່ເນັ້ນການອ່ານງ່າຍ ແລະ ລຸກພຣີມ້ຽມ', 'Gentle on the eyes with reduced glare, delivering high clarity and contemporary aesthetic appeal.', 'ອ່ານສະບາຍຕາ ຜິວສຳຜັດລະມຸນ ໃຫ້ຄວາມຮູ້ສຶກທັນສະໄໝ ເບິ່ງເປັນມືອາຊີບ', 'Comfortable to read, premium soft touch, modern professional appearance.', 'ความສົດຂອງສີຈະດູຊອບກວ່າອາດເງົາເລັກນ້ອຍ', 'Color saturation is slightly softer than high-gloss finishes.', 'ເຄືອບ PVC ດ້ານ, Spot UV, ເຢັບແມັກເລັ້ມ, ສັນກາວ', 'Matte PVC, Spot UV, Saddle Stitch, Perfect Binding', ARRAY['ແຄັດຕາລັອກພຣີມ້ຽມ', 'ເມນູອາຫານ', 'ໂບຣຊົວອົງກອນ', 'ວາລະສານ'], ARRAY['Luxury Catalogs', 'Restaurant Menus', 'Corporate Brochures', 'Magazines'], '/product/doc-catalog-staple?paper=art-160', 'ງານແຄັດຕາລັອກ & ເອກະສານ', 30),
  ('uncoated', 'Woodfree (ເຈ້ຍປອນ/A4)', 'Woodfree & Uncoated', 'ເຈ້ຍປອນຂາວ 80g (A4 Standard Bond)', 'Standard White Bond Woodfree 80 GSM', 80, 'ຜິວດ້ານ ລຽບນຽນທຳມະຊາດ (A4 ມາດຕະຖານ)', 'Smooth uncoated natural matte surface', 'texture-woodfree', 'ເຈ້ຍບໍ່ເຄືອບສານເຄມີ ເນື້ອຂາວສະອາດ ດູດຊຶມນ້ຳມຶກໄດ້ດີ ຂຽນງ່າຍ ມາດຕະຖານເອກະສານສາກົນ', 'Pure white uncoated stock with high ink absorbency, perfect for writing, stamping, and photocopying.', 'ຂຽນທັບດ້ວຍປາກກາ ຫຼື ປ້ຳຕາປະທັບໄດ້ງ່າຍ ອ່ານສະບາຍຕາ ຄຸ້ມຄ່າທີ່ສຸດ', 'Superb writability with fountain pens and official stamps; unbeatable value.', 'ຫາກພິມສີເຂັ້ມຫຼາຍໆ ສີອາດຈະດູດຊຶມລົງເນື້ອເຈ້ຍ ເຮັດໃຫ້ສີດຣັອບລົງເລັກນ້ອຍ', 'Heavy ink coverage can penetrate slightly into the fibers.', 'ເຢັບແມັກ, ເຂົ້າເລັ້ມໄສ້ໃນ, ເຂົ້າເລັ້ມສັນຫ່ວງ', 'Saddle Stitch, Perfect Glue, Wire-O Spiral', ARRAY['ຫົວຈົດໝາຍ', 'ໄສ້ໃນປຶ້ມ', 'ໃບຮັບເງິນ & ແບບຟອມ', 'ເອກະສານ A4 ທົ່ວໄປ'], ARRAY['Letterheads', 'Book Pages & Syllabi', 'Invoices & Receipts', 'Office Documents'], '/product/doc-copy-binding?paper=bond-80', 'ງານເອກະສານ & ປອນຂາວ', 40),
  ('uncoated', 'Woodfree (ເຈ້ຍປອນ/A4)', 'Woodfree & Uncoated', 'ເຈ້ຍປອນພຣີມ້ຽມ 120g (Premium Woodfree)', 'Premium Woodfree 120 GSM', 120, 'ຜິວດ້ານ ໜາແໜ້ນນຸ່ມມື', 'Heavyweight smooth uncoated matte finish', 'texture-woodfree', 'ເຈ້ຍປອນຄວາມໜາພິເສດ ໃຫ້ຄວາມຕຶງ ແລະ ແຂງແຮງກວ່າເຈ້ຍ A4 ທົ່ວໄປ ເໝາະກັບເອກະສານສຳຄັນ', 'Heavyweight uncoated stock with excellent rigidity and formal presence.', 'ນ້ຳມຶກບໍ່ຊຶມທະລຸຫຼັງງ່າຍ ໃຫ້ຄວາມໜ້າເຊື່ອຖືສູງ', 'Prevents ink bleed-through; projects prestige and authenticity.', 'ລາຄາສູງກວ່າປອນ 80g ເລັກນ້ອຍ', 'Slightly higher cost than standard 80g paper.', 'ພັບແຜ່ນພັບ, ປ້ຳຈົມ, ພິມຕາປະທັບ', 'Folding, Debossing, Rubber Stamping', ARRAY['ເອກະສານສັນຍາສຳຄັນ', 'ຊອງຈົດໝາຍພຣີມ້ຽມ', 'ໃບປະກາດສະນີຍະບັດ'], ARRAY['Legal Contracts', 'Premium Envelopes', 'Certificates of Merit'], '/product/doc-copy-binding?paper=bond-100', 'ງານເອກະສານພຣີມ້ຽມ & ໃບປະກາດ', 50),
  ('kraft', 'Kraft (ເຈ້ยຄຣາຟ)', 'Kraft Eco Stock', 'ເຈ້ຍຄຣາຟສີນ້ຳຕານ (Eco Brown Kraft)', 'Eco Brown Kraft Stock', 250, 'ຜິວສາກສີນ້ຳຕານ ເສັ້ນໃຍໄມ້ທຳມະຊາດ (Vintage Look)', 'Textured earthy brown recycled wood fiber', 'texture-kraft', 'ເຈ້ຍຣີໄຊເຄິລ ເຫຼນຽວພິເສດ ໃຫ້ລຸກຮັກສິ່ງແວດລ້ອມ (Eco-friendly) ສາຍຄາເຟ ແລະ ແບຣນອໍແກນິກ', 'High-tensile organic wood fiber sheet providing an authentic rustic, eco-conscious presentation.', 'ທົນທານ ເຫຼນຽວ ໃຫ້ຄວາມຮູ້ສຶກວິນເທຈ ຮັກໂລກ ມີເອກະລັກ', 'High tear resistance, organic vintage charm, biodegradable.', 'ພິມສີພາດສະເທລຍາກ ເນື່ອງຈາກພື້ນເຈ້ຍເປັນສີນ້ຳຕານ', 'Pastel and light tints may shift hue due to brown substrate.', 'ປ້ຳຈົມ, ປ້ຳຟອຍສີດຳ/ສີທອງ, ໄດຄັດເຈາະຮູ', 'Deboss, Black/Gold Foil, Die-cut Hole Punching', ARRAY['ຖົງເຈ້ຍ', 'ປ້າຍແທັກສິນຄ້າ', 'ກ່ອງສິນຄ້າອໍແກນິກ', 'ເມນູຄາເຟ'], ARRAY['Apparel Hangtags', 'Eco Shopping Bags', 'Cafe Menus', 'Organic Packaging'], '/product/sticker-kraft?paper=kraft', 'ງານປ້າຍແທັກ & ຄຣາຟ', 60),
  ('specialty', 'Specialty Card (ເຈ້ຍພິເສດ)', 'Specialty & Luxury Cards', 'ອາດກາດເຄືອບກຳມະຫຍີ່ Soft-Touch (Velvet)', 'Velvet Soft-Touch Luxury Card', 350, 'ຜິວດ້ານນຸ່ມນວນຄືກຳມະຫຍີ່ (Ultra Luxury)', 'Ultra-plush velvet suede texture with zero reflection', 'texture-velvet', 'ເຈ້ຍອາດກາດໜາພິເສດ ເຄືອບຟີມ Soft-Touch ສຳຜັດນຸ່ມເລິກ ບໍ່ສະທ້ອນແສງ ໃຫ້ຄວາມຮູ້ສຶກຫຼູຫຼາລະດັບໄຮເອນ', 'Heavyweight art card wrapped in soft-touch velvet film for an unforgettable tactile impression.', 'ສຳຜັດພຣີມ້ຽມ ນຸ່ມນວນ ໂດດເດັ່ນສູງສຸດເມື່ອເຮັດ Spot UV 3D ຫຼື ປ້ຳຟອຍທອງ', 'Unrivaled suede tactile feel, breathtaking contrast when paired with 3D Spot UV and gold stamping.', 'ຕົ້ນທຶນສູງກວ່າການເຄືອບ PVC ດ້ານທົ່ວໄປ', 'Higher production cost compared to standard matte laminations.', 'Spot UV 3D, ປ້ຳຟອຍທອງ/ເງິນ/Rose Gold, ໄດຄັດມຸມມົນ', '3D Spot UV, Hot Foil (Gold/Silver/Rose), Rounded Corners', ARRAY['ນາມບັດ VIP ຜູ້ບໍລິຫານ', 'ບັດເຊີນຫຼູ', 'ກ່ອງນ້ຳຫອມ/ເຄື່ອງສຳອາງ'], ARRAY['Executive VIP Cards', 'Gala Invitations', 'Luxury Perfume Boxes'], '/product/photo-print-card?paper=art-350', 'ງານນາມບັດ VIP & ກ່ອງຫຼູ', 70),
  ('sticker', 'Sticker (ສະຕິກເກີ)', 'Stickers & Labels', 'ສະຕິກເກີ PP Vinyl ຂາວເງົາ/ດ້ານ (PP Sticker)', '100% Waterproof PP Vinyl Sticker', 120, 'ຜິວພລາສຕິກກັນນ້ຳ 100% ທົນທານສູງ', '100% waterproof tear-proof synthetic PP vinyl film', 'texture-sticker', 'ສະຕິກເກີເນື້ອພລາສຕິກ PP ສີຂາວເງົາ/ດ້ານ ຫຼື ເນື້ອໃສ (Clear) ສີບໍ່ຫຼຸດລອກ ແຊ່ຕູ້ເຢັນ ແລະ ແຊ່ນ້ຳກ້ອນໄດ້', 'Tear-proof waterproof synthetic film with food-grade industrial adhesive, freezer, oil, and microwave proof.', 'ກັນນ້ຳ 100% ແຊ່ເຢັນ/ນ້ຳກ້ອນໄດ້ ກາວຕິດແໜ້ນ ໄດຄັດລອກງ່າຍ', '100% Waterproof, freezer & ice safe, peel-and-stick die-cut precision.', 'ລາຄາສູງກວ່າສະຕິກເກີເຈ້ຍທົ່ວໄປ', 'Slightly higher cost than standard paper labels.', 'ໄດຄັດຕາມຊົງ 100%, ເຄືອບກັນຮອຍຂູດຂີດ', 'Custom Shape Kiss-cut, Scratch-resistant Lamination', ARRAY['ສະຫຼາກສິນຄ້າຕິດແກ້ວ/ຂວດ', 'ອາຫານແຊ່ເຢັນ & ເຄື່ອງດື່ມ', 'ສະຕິກເກີຕິດແກ້ວກາເຟ'], ARRAY['Cosmetic & Bottle Labels', 'Frozen Foods & Cold Drinks', 'Cafe Tumbler Decals'], '/product/sticker-pp-waterproof?paper=pp-gloss', 'ງານສະຕິກເກີ & ສະຫຼາກສິນຄ້າ', 80);
