-- ============================================================
-- Migration 027: Digital Proof Tracking & Revision History
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS digital_proof_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_version INTEGER DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_status VARCHAR(32) DEFAULT 'NOT_SUBMITTED'; -- 'NOT_SUBMITTED', 'PENDING_CUSTOMER', 'APPROVED', 'REJECTED'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_feedback TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_action_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS prepress_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_proof_status ON orders(proof_status);
