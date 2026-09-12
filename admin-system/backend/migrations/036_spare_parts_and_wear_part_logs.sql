-- ============================================================================
-- Migration: 036_spare_parts_and_wear_part_logs.sql
-- Description: Link materials to equipment as spare parts & track wear part replacement logs
-- ============================================================================

-- 1. Extend materials table with assigned_printer_id for equipment-linked spare parts
ALTER TABLE materials ADD COLUMN IF NOT EXISTS assigned_printer_id VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_materials_assigned_printer_id ON materials(assigned_printer_id);

-- 2. Create table: machine_wear_part_logs (Wear Part Replacement & Maintenance Ledger)
CREATE TABLE IF NOT EXISTS machine_wear_part_logs (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wear_part_id            UUID REFERENCES machine_wear_parts(id) ON DELETE SET NULL,
    asset_id                VARCHAR(50) NOT NULL,
    material_id             VARCHAR(100) REFERENCES materials(id) ON DELETE SET NULL,
    part_name               TEXT NOT NULL,
    counter_at_replacement  BIGINT NOT NULL DEFAULT 0,
    quantity                NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    replaced_by             VARCHAR(100) DEFAULT 'Operator',
    replacement_reason      TEXT,
    replaced_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_machine_wear_part_logs_asset ON machine_wear_part_logs(asset_id, replaced_at DESC);
CREATE INDEX IF NOT EXISTS idx_machine_wear_part_logs_material ON machine_wear_part_logs(material_id);
