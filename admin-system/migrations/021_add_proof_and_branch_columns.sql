-- Migration 021: Add proof, stock deduction, and branch columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_rejected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_signature_ip VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_rejection_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS branch_code VARCHAR(100);
