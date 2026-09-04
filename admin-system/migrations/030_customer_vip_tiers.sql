-- Migration 030: Customer VIP Tiers & Dynamic Member Discounts
-- Som Sing Phim Printing Atelier

CREATE TABLE IF NOT EXISTS customer_vip_tiers (
  id VARCHAR(50) PRIMARY KEY,
  name_lo VARCHAR(150) NOT NULL,
  name_en VARCHAR(150) NOT NULL,
  discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  min_spend_lak NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  min_orders INT NOT NULL DEFAULT 0,
  badge_color VARCHAR(50) DEFAULT 'amber',
  perks TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed Dynamic VIP Tiers
INSERT INTO customer_vip_tiers (id, name_lo, name_en, discount_percent, min_spend_lak, min_orders, badge_color, perks, sort_order)
VALUES 
  (
    'STANDARD', 
    'ສະມາຊິກທົ່ວໄປ (Standard Member)', 
    'Standard Member', 
    0.00, 
    0.00, 
    0, 
    'slate', 
    ARRAY['ສັ່ງພິມຊ້ຳ 1 ຄລິກ (1-Click Re-order)', 'ບັນທຶກທີ່ຢູ່ຈັດສົ່ງ ແລະ ສາຂາຂົນສົ່ງອັດຕະໂນມັດ', 'ກວດໄຟລ໌ Digital Proof ມາດຕະຖານ', 'ຕິດຕາມສະຖານະງານພິມ Real-time'],
    1
  ),
  (
    'SILVER', 
    'ຊິລເວີ VIP (Silver Tier)', 
    'Silver VIP', 
    5.00, 
    3000000.00, 
    3, 
    'cyan', 
    ARRAY['ສ່ວນຫຼຸດພິເສດ 5% ທຸກງານພິມ', 'ກວດໄຟລ໌ Proof ດ່ວນພາຍໃນ 2 ຊົ່ວໂມງ', 'ຄັງເກັບໄຟລ໌ Artwork ສ່ວນຕົວ (Cloud Vault)', 'ສັ່ງພິມຊ້ຳ 1 ຄລິກ'],
    2
  ),
  (
    'GOLD', 
    'ໂກລ VIP (Gold Tier)', 
    'Gold VIP', 
    10.00, 
    10000000.00, 
    10, 
    'amber', 
    ARRAY['ສ່ວນຫຼຸດພິເສດ 10% ທຸກງານພິມ', 'ລຳດັບຄິວຜະລິດດ່ວນ Fast-Track 24 ຊມ.', 'ຜູ້ດູແລງານພິມສ່ວນຕົວ VIP Concierge', 'ຟຣີ ຄ່າຈັດສົ່ງໃນນະຄອນຫຼວງວຽງຈັນ (ຍອດ 500,000 ₭ ຂຶ້ນໄປ)'],
    3
  ),
  (
    'PLATINUM', 
    'ແພລຕິນໍາ VIP (Platinum Corporate)', 
    'Platinum Corporate', 
    15.00, 
    25000000.00, 
    25, 
    'purple', 
    ARRAY['ສ່ວນຫຼຸດສູງສຸດ 15% ທຸກງານພິມ', 'ສິດທິເຄຣດິດ/ມັດຈຳພິເສດ B2B Partner', 'ພິມຕົວຢ່າງສີຈິງ (Hard Proof) ຟຣີ', 'ຄິວຜະລິດດ່ວນພິເສດ Ultra Fast-Track'],
    4
  )
ON CONFLICT (id) DO UPDATE SET 
  name_lo = EXCLUDED.name_lo,
  name_en = EXCLUDED.name_en,
  discount_percent = EXCLUDED.discount_percent,
  min_spend_lak = EXCLUDED.min_spend_lak,
  min_orders = EXCLUDED.min_orders,
  badge_color = EXCLUDED.badge_color,
  perks = EXCLUDED.perks,
  sort_order = EXCLUDED.sort_order;

-- Seed Mock VIP Customer for testing and demo (Phone: 020 55889988)
INSERT INTO customers (
  id, name, phone, email, address, province, district, village, branch_code, 
  tier, total_spent_lak, total_orders_count, credit_limit, notes
)
VALUES (
  'CUST-VIP-001',
  'Som Sing Phim VIP Atelier',
  '020 55889988',
  'customer@gmail.com',
  'ຮ່ອມ 5, ບ້ານໂພນພະເນົາ, ໃກ້ສູນການຄ້າລາວ-ໄອເຕັກ',
  'ນະຄອນຫຼວງວຽງຈັນ',
  'ໄຊເສດຖາ',
  'ໂພນພະເນົາ',
  'AN-VTE-02',
  'GOLD',
  12500000.00,
  12,
  5000000.00,
  'ລູກຄ້າ VIP ປະຈຳ ສັ່ງພິມສະຕິກເກີ ແລະ ນາມບັດຕໍ່ເນື່ອງ'
)
ON CONFLICT (id) DO UPDATE SET
  tier = 'GOLD',
  phone = '020 55889988',
  total_spent_lak = 12500000.00,
  total_orders_count = 12;

-- Seed Mock Order for 1-Click Reorder demonstration
INSERT INTO orders (
  id, order_number, order_no, tracking_code, customer_id, customer_name, customer_phone, customer_email,
  customer_address, courier_name, branch_code, status, overall_status, total_amount_lak, total_price,
  deposit_lak, deposit_amount, remaining_lak, created_at, updated_at
)
VALUES (
  'ORD-VIP-DEMO-01',
  'SSP-2026-8801',
  'SSP-2026-8801',
  'TRK-SSP-8801',
  'CUST-VIP-001',
  'Som Sing Phim VIP Atelier',
  '020 55889988',
  'customer@gmail.com',
  'ຮ່ອມ 5, ບ້ານໂພນພະເນົາ, ໄຊເສດຖາ, ນະຄອນຫຼວງວຽງຈັນ (AN-VTE-02)',
  'Anousith Express',
  'AN-VTE-02',
  'COMPLETED',
  'COMPLETED',
  350000.00,
  350000.00,
  350000.00,
  350000.00,
  0.00,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '1 days'
)
ON CONFLICT (id) DO NOTHING;

-- Seed Order Items for the mock order
INSERT INTO order_items (
  id, order_id, job_name, item_name, quantity, paper_size, binding_type, unit_price_lak, total_price_lak, specs
)
VALUES 
  (
    'ITEM-VIP-DEMO-01',
    'ORD-VIP-DEMO-01',
    'ສະຕິກເກີ PP ຂາວເງົາກັນນ້ຳ 100% (Waterproof PP Sticker)',
    'ສະຕິກເກີ PP ຂາວເງົາກັນນ້ຳ 100%',
    500,
    'A3+',
    'NONE',
    500.00,
    250000.00,
    '{"material": "PP Glossy White", "cutting": "Kiss Cut 100%", "size": "4x4 cm", "coating": "Glossy UV"}'::jsonb
  ),
  (
    'ITEM-VIP-DEMO-02',
    'ORD-VIP-DEMO-01',
    'ນາມບັດພຣີມຽມ Art Card 350g (Double-sided)',
    'ນາມບັດພຣີມຽມ Art Card 350g',
    2,
    '9x5.4 cm',
    'NONE',
    50000.00,
    100000.00,
    '{"paper": "Art Card 350gsm", "coating": "Matte Lamination", "corner": "Round 4 corners"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;
