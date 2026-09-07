-- ============================================================================
-- Migration: 034_order_performance_indexes.sql
-- Description: Adds compound indexes on orders, order_items, and audit_logs
--              to optimize high-volume queries on Dashboard & Customer Orders.
-- ============================================================================

-- 1. Compound index for filtering orders by status and ordering by creation date (Orders List & Dashboard)
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_overall_status_created_at ON orders(overall_status, created_at DESC);

-- 2. Customer orders history lookup (Customer CRM & Order Tracking)
CREATE INDEX IF NOT EXISTS idx_orders_customer_id_created_at ON orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone_idx ON orders(customer_phone);

-- 3. Stock deduction verification & ledger lookups
CREATE INDEX IF NOT EXISTS idx_orders_stock_deducted_status ON orders(stock_deducted_at, status);

-- 4. Order Items lookup by Order ID & Item Sequence
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_current_step ON order_items(current_step);

-- 5. Spoilage logs index for order reporting
CREATE INDEX IF NOT EXISTS idx_spoilage_logs_order_id ON spoilage_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_spoilage_logs_created_at ON spoilage_logs(created_at DESC);
