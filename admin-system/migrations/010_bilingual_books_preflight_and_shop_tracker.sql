-- Migration 010: Master-Detail Orders, Preflight CMYK Coverage, Spine Width & Shop Floor Tracker
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS order_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS customer_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS total_amount_lak NUMERIC(15, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS deposit_lak NUMERIC(15, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS remaining_lak NUMERIC(15, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS overall_status VARCHAR(50) DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS delivery_date VARCHAR(50);

-- Sync existing order_number to order_no if order_no is empty
UPDATE orders SET order_no = order_number WHERE order_no IS NULL OR order_no = '';

ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS item_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS page_count INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS paper_size VARCHAR(50) DEFAULT 'A5',
    ADD COLUMN IF NOT EXISTS cover_paper_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS inner_paper_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cover_file_url TEXT,
    ADD COLUMN IF NOT EXISTS inner_file_url TEXT,
    ADD COLUMN IF NOT EXISTS binding_type VARCHAR(50) DEFAULT 'NONE',
    ADD COLUMN IF NOT EXISTS spine_width_mm NUMERIC(8, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS current_step VARCHAR(50) DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS avg_cov_c NUMERIC(8, 4) DEFAULT 0.0000,
    ADD COLUMN IF NOT EXISTS avg_cov_m NUMERIC(8, 4) DEFAULT 0.0000,
    ADD COLUMN IF NOT EXISTS avg_cov_y NUMERIC(8, 4) DEFAULT 0.0000,
    ADD COLUMN IF NOT EXISTS avg_cov_k NUMERIC(8, 4) DEFAULT 0.0000,
    ADD COLUMN IF NOT EXISTS unit_cost_lak NUMERIC(15, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS unit_price_lak NUMERIC(15, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS total_price_lak NUMERIC(15, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Sync existing job_name to item_name if empty
UPDATE order_items SET item_name = job_name WHERE item_name IS NULL OR item_name = '';
