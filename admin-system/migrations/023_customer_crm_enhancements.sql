-- Migration 023: Customer CRM Enhancements
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS instagram VARCHAR(100),
  ADD COLUMN IF NOT EXISTS line_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS facebook VARCHAR(255),
  ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(100),
  ADD COLUMN IF NOT EXISTS province VARCHAR(100),
  ADD COLUMN IF NOT EXISTS district VARCHAR(100),
  ADD COLUMN IF NOT EXISTS village VARCHAR(255),
  ADD COLUMN IF NOT EXISTS branch_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS total_spent_lak NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_orders_count INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Index for linking orders by customer_id
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
