-- 012_public_catalog_and_discount_tiers.sql
-- Migration for Som Sing Phim Public Web Product Catalog & Tier Discounts

CREATE TABLE IF NOT EXISTS public_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL, -- sticker, brochure, business_card, banner, box, book, general
    description TEXT,
    features TEXT[] DEFAULT '{}',
    thumbnail_url TEXT,
    gallery_urls TEXT[] DEFAULT '{}',
    min_quantity INT DEFAULT 1,
    lead_time_days INT DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public_product_options (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES public_products(id) ON DELETE CASCADE,
    option_type VARCHAR(50) NOT NULL, -- 'material', 'size', 'finishing', 'cutting', 'binding'
    label VARCHAR(100) NOT NULL,
    value VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    extra_cost_rate NUMERIC(10, 4) DEFAULT 0.0000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_discount_tiers (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES public_products(id) ON DELETE CASCADE,
    min_quantity INT NOT NULL,
    discount_percentage NUMERIC(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_public_products_slug ON public_products(slug);
CREATE INDEX IF NOT EXISTS idx_public_products_category ON public_products(category);
CREATE INDEX IF NOT EXISTS idx_public_products_active ON public_products(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_public_product_options_pid ON public_product_options(product_id);
CREATE INDEX IF NOT EXISTS idx_product_discount_tiers_pid ON product_discount_tiers(product_id);

-- Seed Initial Catalog Data if empty
INSERT INTO public_products (name, slug, category, description, features, thumbnail_url, min_quantity, lead_time_days, is_active, sort_order)
VALUES 
(
    'สติกเกอร์ PP กันน้ำ (Waterproof PP Sticker)',
    'waterproof-pp-sticker',
    'sticker',
    'สติกเกอร์เนื้อพลาสติก PP ฉีกไม่ขาด กันน้ำ 100% เหมาะสำหรับติดขวดน้ำ แก้วกาแฟ ถุงขนม และสินค้าแช่เย็น',
    ARRAY['กันน้ำ 100%', 'แช่เย็น/แช่ฟรีซได้', 'ไดคัทคมชัด พร้อมลอกแปะ', 'หมึกแท้คมชัดระดับพรีเมียม'],
    '/images/products/sticker-pp.jpg',
    50,
    1,
    true,
    1
),
(
    'นามบัตรพรีเมียม 350 แกรม (Premium Business Cards)',
    'premium-business-card',
    'business_card',
    'นามบัตรกระดาษอาร์ตการ์ด 350 แกรม หนาแน่น พิมพ์ 2 หน้า คมชัดระดับโฟโต้ พร้อมเคลือบด้าน/เงา',
    ARRAY['กระดาษหนา 350 แกรม', 'พิมพ์ 2 หน้าสีสดใส', 'เคลือบด้าน Soft-touch หรูหรา', 'ขอบมนหรือตัดตรงมาตรฐาน'],
    '/images/products/business-card.jpg',
    100,
    2,
    true,
    2
),
(
    'สมุดและแคตตาล็อกเข้าเล่ม (Books & Catalogs)',
    'book-catalog-binding',
    'book',
    'พิมพ์สมุด แคตตาล็อกสินค้า รายงานประจำปี เข้าเล่มสันห่วง สันกาว หรือเย็บมุงหลังคา คุณภาพมาตรฐานโรงพิมพ์',
    ARRAY['เลือกวิธีเข้าเล่มได้หลากหลาย', 'กระดาษเนื้อในถนอมสายตา/อาร์ตมัน', 'ปกแข็งเคลือบฟิล์มกันรอย', 'พิมพ์ได้ทั้ง 4 สี และ 1 สี'],
    '/images/products/catalog-book.jpg',
    10,
    3,
    true,
    3
)
ON CONFLICT (slug) DO NOTHING;

-- Seed Options for Waterproof PP Sticker
INSERT INTO public_product_options (product_id, option_type, label, value, is_default, extra_cost_rate)
SELECT id, 'material', 'PP ขาวเงา (Glossy White PP)', 'pp_glossy_white', true, 0.0000 FROM public_products WHERE slug = 'waterproof-pp-sticker'
UNION ALL
SELECT id, 'material', 'PP ขาวด้าน (Matte White PP)', 'pp_matte_white', false, 0.0500 FROM public_products WHERE slug = 'waterproof-pp-sticker'
UNION ALL
SELECT id, 'material', 'PP ใส (Clear Transparent PP)', 'pp_clear', false, 0.1000 FROM public_products WHERE slug = 'waterproof-pp-sticker'
UNION ALL
SELECT id, 'cutting', 'ไดคัท 50% กึ่งสำเร็จ (Kiss Cut)', 'kiss_cut', true, 0.0000 FROM public_products WHERE slug = 'waterproof-pp-sticker'
UNION ALL
SELECT id, 'cutting', 'ไดคัท 100% แยกชิ้น (Die Cut Single)', 'die_cut_single', false, 0.1500 FROM public_products WHERE slug = 'waterproof-pp-sticker'
ON CONFLICT DO NOTHING;

-- Seed Discount Tiers for Waterproof PP Sticker
INSERT INTO product_discount_tiers (product_id, min_quantity, discount_percentage)
SELECT id, 500, 5.00 FROM public_products WHERE slug = 'waterproof-pp-sticker'
UNION ALL
SELECT id, 1000, 10.00 FROM public_products WHERE slug = 'waterproof-pp-sticker'
UNION ALL
SELECT id, 5000, 20.00 FROM public_products WHERE slug = 'waterproof-pp-sticker'
ON CONFLICT DO NOTHING;
