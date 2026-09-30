-- Migration 040: Production Stage Assignments and Daily Schedule
-- Supports manager dispatching, machine/operator scheduling, overlap checking, and progress tracking

CREATE TABLE IF NOT EXISTS production_stage_assignments (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL,
    order_item_id VARCHAR(100) NOT NULL,
    job_ticket_id VARCHAR(100),
    stage VARCHAR(50) NOT NULL,
    planned_date DATE NOT NULL,
    planned_shift VARCHAR(50) NOT NULL DEFAULT 'morning',
    planned_start_time TIMESTAMPTZ,
    planned_end_time TIMESTAMPTZ,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    assignee_id VARCHAR(100),
    assignee_name VARCHAR(255),
    machine_id VARCHAR(100),
    machine_name VARCHAR(255),
    priority INT NOT NULL DEFAULT 1,
    sequence_order INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED',
    notes TEXT,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_psa_order ON production_stage_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_psa_item ON production_stage_assignments(order_item_id);
CREATE INDEX IF NOT EXISTS idx_psa_assignee ON production_stage_assignments(assignee_id);
CREATE INDEX IF NOT EXISTS idx_psa_machine ON production_stage_assignments(machine_id);
CREATE INDEX IF NOT EXISTS idx_psa_date ON production_stage_assignments(planned_date);
CREATE INDEX IF NOT EXISTS idx_psa_status ON production_stage_assignments(status);

