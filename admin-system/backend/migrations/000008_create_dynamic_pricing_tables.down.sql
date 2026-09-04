-- ============================================================================
-- Migration: 000008_create_dynamic_pricing_tables.down.sql
-- ============================================================================

DROP INDEX IF EXISTS idx_order_item_cost_breakdowns_order_item_id;
DROP INDEX IF EXISTS idx_product_pricing_configs_product_id;
DROP TABLE IF EXISTS order_item_cost_breakdowns CASCADE;
DROP TABLE IF EXISTS product_pricing_configs CASCADE;
