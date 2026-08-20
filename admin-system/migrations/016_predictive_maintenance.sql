-- Migration 016: Predictive Maintenance (PPM) & Meter Tracking
ALTER TABLE equipment 
ADD COLUMN IF NOT EXISTS maintenance_interval_impressions INT DEFAULT 50000,
ADD COLUMN IF NOT EXISTS last_serviced_meter INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_meter INT DEFAULT 0;

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
