-- 019_dynamic_categories_and_bilingual_catalog.sql
-- Migration for Dynamic Bilingual Categories, Product Pricing Models, and Material SKU Links

CREATE TABLE IF NOT EXISTS public_categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name_lo VARCHAR(200) NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    tagline_lo TEXT DEFAULT '',
    tagline_en TEXT DEFAULT '',
    description_lo TEXT DEFAULT '',
    description_en TEXT DEFAULT '',
    icon VARCHAR(50) NOT NULL DEFAULT 'folder',
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_public_categories_slug ON public_categories(slug);
CREATE INDEX IF NOT EXISTS idx_public_categories_active ON public_categories(is_active);

-- Seed Standard Printing Categories for Som Sing Phim
INSERT INTO public_categories (slug, name_lo, name_en, tagline_lo, tagline_en, description_lo, description_en, icon, sort_order, is_active)
VALUES
(
    'documents',
    'ງານເອກະສານ & ປຶ້ມ',
    'Documents & Books',
    'ກັອບປີ້ເອກະສານທົ່ວໄປ, ເຂົ້າເລັ້ມສັນກາວ, ສັນຫ່ວງ, ປຶ້ມ & ລາຍງານ',
    'Document copying, glue binding, wire-o, books & corporate reports',
    'ບໍລິການກັອບປີ້ເອກະສານຂາວດຳ-ສີ, ເຂົ້າເລັ້ມປຶ້ມສັນກາວຮ້ອນ, ສັນຫ່ວງກະດູກງູ, ເຢັບມຸມ, ລາຍງານປະຈຳປີ ແລະ ເອກະສານສຳມະນາຄຸນນະພາບສູງ.',
    'High-speed document printing and copying, perfect glue binding, wire-o booklets, catalogs, and training manuals.',
    'book',
    1,
    true
),
(
    'photos',
    'ງານພິມຮູບພາບພຣີມ້ຽມ',
    'Premium Photo Prints',
    'ພິມຮູບພາບຄຸນນະພາບສູງ, ໂຟໂຕ້ບຸກ, ອັນບັ້ມຮູບ & ກອບອາຄຣີລິກ',
    'High-definition photo prints, photobooks, albums & acrylic frames',
    'ງານພິມຮູບພາບຄວາມລະອຽດສູງລະດັບແກເລີຣີ, ອັນບັ້ມຮູບປົກແຂງ Layflat 180°, ມິນິໂຟໂຕ້ບຸກ ແລະ ກອບຮູບອາຄຣີລິກຕັ້ງໂຕະຄົມຊັດສີສັນສົດໃສ.',
    'Gallery-grade photo printing, luxury hardcover photobooks, compact mini albums, and crystal clear acrylic photo blocks.',
    'photo',
    2,
    true
),
(
    'stickers',
    'ສະຕິກເກີ & ສະຫຼາກສິນຄ້າ',
    'Stickers & Labels',
    'ສະຕິກເກີກັນນ້ຳ PP, ໄດຄັດ 50%/100%, ສະຕິກເກີໂຮໂລແກຣມ & ຄຣາຟ',
    'Waterproof PP stickers, kiss-cut, die-cut, holographic & kraft labels',
    'ສະຕິກເກີໄດຄັດພ້ອມແປະ PP ຂາວເງົາ, ຂາວດ້ານ, ເນື້ອໃສກັນນ້ຳ 100% ແຊ່ເຢັນໄດ້, ສະຕິກເກີຟອຍທອງ, ໂຮໂລແກຣມ ແລະ ສະຕິກເກີບາໂຄ້ດສຳລັບຕິດຜະລິດຕະພັນ.',
    'Die-cut waterproof PP stickers, glossy, matte, clear, gold foil, holographic security labels, and commercial roll stickers.',
    'sticker',
    3,
    true
),
(
    'business_cards',
    'ນາມບັດ & ບັດສະມາຊິກ',
    'Business Cards & Tags',
    'ນາມບັດພຣີມ້ຽມ 350 ແກຣມ, ເຄືອບດ້ານ Soft-touch, ປ້ຳທອງ & ມຸມມົນ',
    'Premium 350gsm business cards, soft-touch matte, foil stamping & rounded corners',
    'ນາມບັດຄົມຊັດລະດັບໂຮງພິມ, ກະດາດອາດກາດ 350gsm, ບັດສະມາຊິກ PVC, ປ້າຍຫ້ອຍສິນຄ້າ (Hang Tags) ແລະ ບັດຂອບຄຸນ.',
    'Professional business cards, thick 350gsm art cards, PVC member cards, garment hang tags, and thank-you cards.',
    'card',
    4,
    true
),
(
    'marketing',
    'ແຜ່ນພັບ & ໂບຣຊົວ',
    'Brochures & Flyers',
    'ໃບປິວໂຄສະນາ, ແຜ່ນພັບ 2 ພັບ 3 ຕອນ, ໂປສເຕີ A3/A4 ຄົມຊັດສີສົດ',
    'Marketing flyers, tri-fold brochures, company profiles, high-res posters',
    'ໃບປິວ ແລະ ແຜ່ນພັບປະຊາສຳພັນ, ກະດາດອາດມັນ 130-160gsm ພັບສຳເລັດຮູບ, ໂປສເຕີຂະໜາດ A3/A2 ສຳລັບງານອີເວັ້ນ.',
    'Promotional leaflets, folded brochures, menus, and vibrant exhibition posters.',
    'flyer',
    5,
    true
),
(
    'packaging',
    'ກ່ອງບັນຈຸພັນ & ຖົງເຈ້ຍ',
    'Packaging & Paper Bags',
    'ກ່ອງເຄືອບຟິມ, ກ່ອງເຄື່ອງສຳອາງ, ຖົງເຈ້ຍພຣີມ້ຽມພ້ອມຫູຫິ້ວ',
    'Custom packaging boxes, cosmetic boxes, branded kraft & art paper bags',
    'ກ່ອງບັນຈຸພັນສິນຄ້າ, ກ່ອງລັອກກົ້ນ, ຖົງເຈ້ຍພຣີມ້ຽມພິມໂລໂກ້ ສຳລັບຮ້ານຄ້າ ແລະ ແບຣນສິນຄ້າ.',
    'Custom packaging boxes, cosmetic folding cartons, and luxury shopping bags.',
    'box',
    6,
    true
),
(
    'general',
    'ງານພິມທົ່ວໄປ & ບໍລິການອື່ນໆ',
    'General Print & Services',
    'ຕາຢາງ, ໃບບິນ, ຊອງຈົດໝາຍ, ປ້າຍໄວນິລ & ບໍລິການພິມຕາມສັ່ງ',
    'Rubber stamps, receipts, envelopes, banners & custom printing',
    'ບໍລິການພິມບິນຮັບເງິນ, ໃບສົ່ງເຄື່ອງ, ຕາຢາງໝຶກໃນໂຕ, ຊອງຈົດໝາຍບໍລິສັດ ແລະ ປ້າຍໄວນິລອິ້ງເຈັ້ດ.',
    'Custom rubber stamps, invoices, company envelopes, vinyl banners, and custom printing services.',
    'printer',
    7,
    true
)
ON CONFLICT (slug) DO NOTHING;

-- Extend public_products table
ALTER TABLE public_products ADD COLUMN IF NOT EXISTS category_id INT REFERENCES public_categories(id) ON DELETE SET NULL;
ALTER TABLE public_products ADD COLUMN IF NOT EXISTS name_lo VARCHAR(255);
ALTER TABLE public_products ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);
ALTER TABLE public_products ADD COLUMN IF NOT EXISTS description_lo TEXT;
ALTER TABLE public_products ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE public_products ADD COLUMN IF NOT EXISTS pricing_model VARCHAR(50) DEFAULT 'STANDARD_FLAT';
ALTER TABLE public_products ADD COLUMN IF NOT EXISTS base_price NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE public_products ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'ຊິ້ນ';
ALTER TABLE public_products ADD COLUMN IF NOT EXISTS bestseller BOOLEAN DEFAULT false;
ALTER TABLE public_products ADD COLUMN IF NOT EXISTS spec_groups JSONB DEFAULT '[]';
ALTER TABLE public_products ADD COLUMN IF NOT EXISTS features_config JSONB DEFAULT '{}';

-- Extend public_product_options table
ALTER TABLE public_product_options ADD COLUMN IF NOT EXISTS label_lo VARCHAR(150);
ALTER TABLE public_product_options ADD COLUMN IF NOT EXISTS label_en VARCHAR(150);
ALTER TABLE public_product_options ADD COLUMN IF NOT EXISTS hint_lo VARCHAR(255);
ALTER TABLE public_product_options ADD COLUMN IF NOT EXISTS hint_en VARCHAR(255);
ALTER TABLE public_product_options ADD COLUMN IF NOT EXISTS material_sku VARCHAR(100);
ALTER TABLE public_product_options ADD COLUMN IF NOT EXISTS paper_code VARCHAR(100);
ALTER TABLE public_product_options ADD COLUMN IF NOT EXISTS add_price NUMERIC(15, 2) DEFAULT 0.00;

-- Update existing category links if category_id is null
UPDATE public_products p
SET category_id = c.id
FROM public_categories c
WHERE p.category_id IS NULL AND (p.category = c.slug OR (p.category = 'sticker' AND c.slug = 'stickers') OR (p.category = 'business_card' AND c.slug = 'business_cards') OR (p.category = 'book' AND c.slug = 'documents'));
