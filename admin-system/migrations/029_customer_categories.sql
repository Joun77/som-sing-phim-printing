-- Migration 029: Customer Categories Table
CREATE TABLE IF NOT EXISTS customer_categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT DEFAULT '',
  color VARCHAR(50) DEFAULT 'sky',
  is_default BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial categories if not exists
INSERT INTO customer_categories (id, name, description, color, is_default, is_system)
VALUES 
  ('RETAIL', 'ລູກຄ້າໜ້າຮ້ານ (Walk-in)', 'ລູກຄ້າທົ່ວໄປທີ່ມາຕິດຕໍ່ໜ້າຮ້ານ', 'sky', TRUE, TRUE),
  ('ONLINE', 'ລູກຄ້າຊ່ອງທາງອອນລາຍ (Online)', 'ລູກຄ້າທີ່ສັ່ງຊື້ຜ່ານ Facebook, Line, WhatsApp, Website', 'violet', FALSE, TRUE),
  ('CORPORATE', 'ລູກຄ້າອົງກອນ / ບໍລິສັດ (Corporate)', 'ບໍລິສັດ, ອົງການຈັດຕັ້ງ, ໂຮງຮຽນ ຫຼື ໜ່ວຍງານລັດ', 'emerald', FALSE, TRUE),
  ('CONTRACT_PARTNER', 'ລູກຄ້າຄູ່ສັນຍາ (Contract Partner)', 'ຄູ່ຄ້າທີ່ມີສັນຍາຮ່ວມມືພິເສດ ຫຼື MOU', 'amber', FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;
