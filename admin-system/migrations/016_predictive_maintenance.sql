-- Migration 016: Predictive Maintenance (PPM) & Meter Tracking
-- Extend each existing master without creating or copying equipment assets.
DO $$
DECLARE
    master_name text;
    found_master boolean := false;
BEGIN
    FOREACH master_name IN ARRAY ARRAY['equipment', 'printers'] LOOP
        IF to_regclass(master_name) IS NOT NULL THEN
            found_master := true;
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS maintenance_interval_impressions INT DEFAULT 50000, ADD COLUMN IF NOT EXISTS last_serviced_meter INT DEFAULT 0, ADD COLUMN IF NOT EXISTS current_meter INT DEFAULT 0', master_name);
        END IF;
    END LOOP;
    IF NOT found_master THEN
        RAISE EXCEPTION 'Migration 016 requires an existing equipment or printers master';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS equipment_specs (
    id SERIAL PRIMARY KEY,
    equipment_id VARCHAR(100) NOT NULL,
    maintenance_interval_impressions INT DEFAULT 50000,
    last_serviced_meter INT DEFAULT 0,
    current_meter INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id VARCHAR(100) PRIMARY KEY,
    equipment_id VARCHAR(100) NOT NULL,
    trigger_reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    scheduled_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
