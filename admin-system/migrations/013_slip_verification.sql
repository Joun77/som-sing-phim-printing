-- 013_slip_verification.sql
-- Migration for Automated SlipOK Bank Slip Verification & Audit Trail

-- 1. Create bank_transaction_logs table for audit trail of all slip verification attempts
CREATE TABLE IF NOT EXISTS bank_transaction_logs (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    qr_payload TEXT,
    trans_ref VARCHAR(100),
    amount DECIMAL(12, 4) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'SUCCESS', 'AMOUNT_MISMATCH', 'INVALID_SLIP', 'FAILED', 'PENDING'
    verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    raw_response JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bank_trans_order_id ON bank_transaction_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_bank_trans_ref ON bank_transaction_logs(trans_ref);
CREATE INDEX IF NOT EXISTS idx_bank_trans_status ON bank_transaction_logs(status);

-- 2. Add slip verification columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS slip_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS slip_trans_ref VARCHAR(100);
