-- Migration 024: Idempotency Key and Master Order Persistence
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255),
    ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(100),
    ADD COLUMN IF NOT EXISTS internal_tracking_code VARCHAR(100),
    ADD COLUMN IF NOT EXISTS courier_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS courier_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS customer_address TEXT;

-- Create unique index on idempotency_key where not null/empty
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key) WHERE idempotency_key IS NOT NULL AND idempotency_key != '';
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON orders(tracking_code);

-- Unique index for anti-fraud transaction reference in bank_transaction_logs
CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_trans_ref_unique ON bank_transaction_logs(trans_ref) WHERE trans_ref IS NOT NULL AND trans_ref != '';
