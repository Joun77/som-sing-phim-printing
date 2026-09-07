-- Migration 035: Workflow Templates and Order Production Costs
-- Adds central database persistence for workflow templates and enhances orders/order_items with realized production metrics

CREATE TABLE IF NOT EXISTS workflow_templates (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_lao VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'Custom',
    steps_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_default BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);

-- Add production cost breakdown and printer allocation to orders if not exists
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS allocated_printer_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS allocated_printer_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS realized_paper_cost DECIMAL(15,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS realized_ink_cost DECIMAL(15,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS realized_labor_cost DECIMAL(15,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS realized_finishing_cost DECIMAL(15,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS realized_spoilage_cost DECIMAL(15,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS realized_total_cost DECIMAL(15,2) DEFAULT 0.00;

-- Add paper brand and actual sheets metrics to order_items if not exists
ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS paper_brand VARCHAR(100),
    ADD COLUMN IF NOT EXISTS paper_weight_gsm INT,
    ADD COLUMN IF NOT EXISTS paper_finish VARCHAR(100),
    ADD COLUMN IF NOT EXISTS total_parent_sheets INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_cut_pieces INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS printer_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS printer_name VARCHAR(255);
