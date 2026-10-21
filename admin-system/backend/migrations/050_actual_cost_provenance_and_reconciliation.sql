-- Migration 050: Actual Cost Provenance, Legitimacy Preservation, and Audit Log
-- 1. Adds explicit status, provenance, actor, and timestamp columns to orders table.
-- 2. Creates order_actual_cost_logs audit table for full provenance history.
-- 3. Implements consistency check trigger to enforce realized cost invariants.
-- 4. Reconciles existing records according to strictly observable facts without guessing.

-- Step 1: Add provenance and status columns to orders
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS realized_cost_status VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN',
    ADD COLUMN IF NOT EXISTS realized_cost_provenance VARCHAR(64) NOT NULL DEFAULT 'UNRECORDED',
    ADD COLUMN IF NOT EXISTS realized_cost_recorded_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS realized_cost_recorded_by VARCHAR(100),
    ADD COLUMN IF NOT EXISTS realized_cost_notes TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_realized_cost_status'
    ) THEN
        ALTER TABLE orders
            ADD CONSTRAINT chk_orders_realized_cost_status
            CHECK (realized_cost_status IN ('UNKNOWN', 'PARTIAL', 'RECORDED'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_realized_cost_provenance'
    ) THEN
        ALTER TABLE orders
            ADD CONSTRAINT chk_orders_realized_cost_provenance
            CHECK (realized_cost_provenance IN (
                'UNRECORDED',
                'MANUAL_ENTRY',
                'SHOP_FLOOR',
                'HISTORICAL_PRESERVED',
                'HISTORICAL_UNKNOWN',
                'LEGITIMATE_ZERO'
            ));
    END IF;
END $$;

-- Step 2: Create audit trail table for actual cost provenance
CREATE TABLE IF NOT EXISTS order_actual_cost_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    action VARCHAR(32) NOT NULL,
    cost_status VARCHAR(32) NOT NULL,
    realized_paper_cost NUMERIC(15,2),
    realized_ink_cost NUMERIC(15,2),
    realized_labor_cost NUMERIC(15,2),
    realized_finishing_cost NUMERIC(15,2),
    realized_spoilage_cost NUMERIC(15,2),
    realized_total_cost NUMERIC(15,2),
    provenance VARCHAR(64) NOT NULL,
    actor_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_actual_cost_logs_order_id_created_at
    ON order_actual_cost_logs(order_id, created_at DESC);

-- Step 3: Trigger to maintain realized_cost_status and audit logging on UPDATE / INSERT
CREATE OR REPLACE FUNCTION trigger_orders_realized_cost_provenance()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    parts_sum NUMERIC(15,2);
    all_parts_present BOOLEAN;
    any_part_present BOOLEAN;
BEGIN
    all_parts_present := (
        NEW.realized_paper_cost IS NOT NULL AND
        NEW.realized_ink_cost IS NOT NULL AND
        NEW.realized_labor_cost IS NOT NULL AND
        NEW.realized_finishing_cost IS NOT NULL AND
        NEW.realized_spoilage_cost IS NOT NULL AND
        NEW.realized_total_cost IS NOT NULL
    );

    any_part_present := (
        NEW.realized_paper_cost IS NOT NULL OR
        NEW.realized_ink_cost IS NOT NULL OR
        NEW.realized_labor_cost IS NOT NULL OR
        NEW.realized_finishing_cost IS NOT NULL OR
        NEW.realized_spoilage_cost IS NOT NULL OR
        NEW.realized_total_cost IS NOT NULL
    );

    IF all_parts_present THEN
        parts_sum := NEW.realized_paper_cost +
                     NEW.realized_ink_cost +
                     NEW.realized_labor_cost +
                     NEW.realized_finishing_cost +
                     NEW.realized_spoilage_cost;

        IF parts_sum = NEW.realized_total_cost THEN
            NEW.realized_cost_status := 'RECORDED';
            IF NEW.realized_total_cost = 0.00 THEN
                IF NEW.realized_cost_provenance IN ('UNRECORDED', 'HISTORICAL_UNKNOWN') THEN
                    NEW.realized_cost_provenance := 'LEGITIMATE_ZERO';
                END IF;
            ELSE
                IF NEW.realized_cost_provenance IN ('UNRECORDED', 'HISTORICAL_UNKNOWN') THEN
                    NEW.realized_cost_provenance := 'MANUAL_ENTRY';
                END IF;
            END IF;
        ELSE
            NEW.realized_cost_status := 'PARTIAL';
            IF NEW.realized_cost_provenance = 'UNRECORDED' THEN
                NEW.realized_cost_provenance := 'MANUAL_ENTRY';
            END IF;
        END IF;
    ELSIF any_part_present THEN
        NEW.realized_cost_status := 'PARTIAL';
        IF NEW.realized_cost_provenance = 'UNRECORDED' THEN
            NEW.realized_cost_provenance := 'MANUAL_ENTRY';
        END IF;
    ELSE
        NEW.realized_cost_status := 'UNKNOWN';
        IF NEW.realized_cost_provenance NOT IN ('HISTORICAL_UNKNOWN', 'UNRECORDED') THEN
            NEW.realized_cost_provenance := 'UNRECORDED';
        END IF;
    END IF;

    -- Update timestamp if cost was newly recorded
    IF NEW.realized_cost_status IN ('RECORDED', 'PARTIAL') AND (
        OLD IS NULL OR
        OLD.realized_cost_status = 'UNKNOWN' OR
        OLD.realized_total_cost IS DISTINCT FROM NEW.realized_total_cost
    ) THEN
        NEW.realized_cost_recorded_at := COALESCE(NEW.realized_cost_recorded_at, NOW());
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_realized_cost_provenance ON orders;
CREATE TRIGGER trg_orders_realized_cost_provenance
    BEFORE INSERT OR UPDATE OF
        realized_paper_cost,
        realized_ink_cost,
        realized_labor_cost,
        realized_finishing_cost,
        realized_spoilage_cost,
        realized_total_cost
    ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_orders_realized_cost_provenance();

-- Step 4: Reconcile existing historical orders without guessing erased values
-- Case 1: Rows where all 6 realized columns are NULL (e.g. wiped by 049 or never recorded)
UPDATE orders
SET realized_cost_status = 'UNKNOWN',
    realized_cost_provenance = 'HISTORICAL_UNKNOWN',
    realized_cost_notes = 'Actual cost unrecorded prior to migration 050. Irrecoverable if wiped by migration 049.'
WHERE realized_paper_cost IS NULL
  AND realized_ink_cost IS NULL
  AND realized_labor_cost IS NULL
  AND realized_finishing_cost IS NULL
  AND realized_spoilage_cost IS NULL
  AND realized_total_cost IS NULL;

-- Case 2: Rows where all 6 realized columns are NOT NULL and parts sum to total
UPDATE orders
SET realized_cost_status = 'RECORDED',
    realized_cost_provenance = CASE WHEN realized_total_cost = 0.00 THEN 'LEGITIMATE_ZERO' ELSE 'HISTORICAL_PRESERVED' END,
    realized_cost_notes = 'Preserved valid historical cost record'
WHERE realized_paper_cost IS NOT NULL
  AND realized_ink_cost IS NOT NULL
  AND realized_labor_cost IS NOT NULL
  AND realized_finishing_cost IS NOT NULL
  AND realized_spoilage_cost IS NOT NULL
  AND realized_total_cost IS NOT NULL
  AND (realized_paper_cost + realized_ink_cost + realized_labor_cost + realized_finishing_cost + realized_spoilage_cost = realized_total_cost);

-- Case 3: Rows where some realized values exist, but do not reconcile or some are NULL
UPDATE orders
SET realized_cost_status = 'PARTIAL',
    realized_cost_provenance = 'HISTORICAL_PRESERVED',
    realized_cost_notes = 'Partial historical cost preserved as-is without destructive nullification'
WHERE (
    realized_paper_cost IS NOT NULL OR
    realized_ink_cost IS NOT NULL OR
    realized_labor_cost IS NOT NULL OR
    realized_finishing_cost IS NOT NULL OR
    realized_spoilage_cost IS NOT NULL OR
    realized_total_cost IS NOT NULL
) AND NOT (
    realized_paper_cost IS NOT NULL AND
    realized_ink_cost IS NOT NULL AND
    realized_labor_cost IS NOT NULL AND
    realized_finishing_cost IS NOT NULL AND
    realized_spoilage_cost IS NOT NULL AND
    realized_total_cost IS NOT NULL AND
    (realized_paper_cost + realized_ink_cost + realized_labor_cost + realized_finishing_cost + realized_spoilage_cost = realized_total_cost)
);

-- Record initial audit log entries for all orders currently in database
INSERT INTO order_actual_cost_logs (
    order_id, action, cost_status,
    realized_paper_cost, realized_ink_cost, realized_labor_cost,
    realized_finishing_cost, realized_spoilage_cost, realized_total_cost,
    provenance, notes
)
SELECT
    id,
    'MIGRATED',
    realized_cost_status,
    realized_paper_cost,
    realized_ink_cost,
    realized_labor_cost,
    realized_finishing_cost,
    realized_spoilage_cost,
    realized_total_cost,
    realized_cost_provenance,
    realized_cost_notes
FROM orders
ON CONFLICT DO NOTHING;
