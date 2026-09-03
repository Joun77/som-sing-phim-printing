-- Migration 028: Add customer tier and preferred courier
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS tier VARCHAR(50) DEFAULT 'RETAIL',
  ADD COLUMN IF NOT EXISTS preferred_courier VARCHAR(100);

