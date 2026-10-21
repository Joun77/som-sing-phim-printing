-- Migration 049: Payment Context Provenance & Actual Cost Completeness
-- 1. Adds canonical payment_context ('ONLINE', 'COUNTER', 'UNKNOWN') to payment_records.
-- 2. Drops misleading DEFAULT 0.00 from orders.realized_*_cost columns so unrecorded actual costs are NULL rather than 0.00.

ALTER TABLE payment_records
    ADD COLUMN IF NOT EXISTS payment_context VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN'
    CHECK (payment_context IN ('ONLINE', 'COUNTER', 'UNKNOWN'));

ALTER TABLE orders
    ALTER COLUMN realized_paper_cost DROP DEFAULT,
    ALTER COLUMN realized_ink_cost DROP DEFAULT,
    ALTER COLUMN realized_labor_cost DROP DEFAULT,
    ALTER COLUMN realized_finishing_cost DROP DEFAULT,
    ALTER COLUMN realized_spoilage_cost DROP DEFAULT,
    ALTER COLUMN realized_total_cost DROP DEFAULT;

UPDATE orders
SET realized_paper_cost = NULL,
    realized_ink_cost = NULL,
    realized_labor_cost = NULL,
    realized_finishing_cost = NULL,
    realized_spoilage_cost = NULL,
    realized_total_cost = NULL
WHERE COALESCE(realized_paper_cost, 0) = 0
  AND COALESCE(realized_ink_cost, 0) = 0
  AND COALESCE(realized_labor_cost, 0) = 0
  AND COALESCE(realized_finishing_cost, 0) = 0
  AND COALESCE(realized_spoilage_cost, 0) = 0
  AND COALESCE(realized_total_cost, 0) = 0
  AND COALESCE(total_cost, 0) > 0;

UPDATE orders
SET realized_ink_cost = NULLIF(realized_ink_cost, 0),
    realized_labor_cost = NULLIF(realized_labor_cost, 0),
    realized_finishing_cost = NULLIF(realized_finishing_cost, 0),
    realized_spoilage_cost = NULLIF(realized_spoilage_cost, 0),
    realized_total_cost = NULLIF(realized_total_cost, 0)
WHERE COALESCE(realized_paper_cost, 0) + COALESCE(realized_ink_cost, 0) + COALESCE(realized_labor_cost, 0) + COALESCE(realized_finishing_cost, 0) + COALESCE(realized_spoilage_cost, 0) <> COALESCE(realized_total_cost, 0);
