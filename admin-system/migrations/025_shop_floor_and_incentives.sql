-- 025_shop_floor_and_incentives.sql

-- 1. Technician Piece-Rate Earning Records
CREATE TABLE IF NOT EXISTS technician_earnings (
    id VARCHAR(100) PRIMARY KEY,
    employee_id VARCHAR(100) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    order_id VARCHAR(100) NOT NULL,
    order_number VARCHAR(100),
    customer_name VARCHAR(255),
    step_id VARCHAR(100) NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    impressions INT DEFAULT 0,
    rate_per_impression NUMERIC(10, 2) DEFAULT 0,
    earned_amount_lak NUMERIC(15, 2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tech_earnings_emp ON technician_earnings(employee_id);
CREATE INDEX IF NOT EXISTS idx_tech_earnings_order ON technician_earnings(order_id);

-- 2. Machine Downtime & Maintenance Logs
CREATE TABLE IF NOT EXISTS machine_downtime_logs (
    id VARCHAR(100) PRIMARY KEY,
    machine_id VARCHAR(100) NOT NULL,
    machine_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'DOWNTIME', 'MAINTENANCE', 'SETUP'
    reason TEXT,
    technician_id VARCHAR(100),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_downtime_machine ON machine_downtime_logs(machine_id);

-- 3. Delivery & Dispatch Tracking
CREATE TABLE IF NOT EXISTS delivery_dispatches (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL,
    order_number VARCHAR(100),
    customer_name VARCHAR(255),
    courier_id VARCHAR(100) NOT NULL,
    courier_name VARCHAR(255) NOT NULL,
    tracking_code VARCHAR(100),
    shipping_fee_lak NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PENDING_PICKUP', -- 'PENDING_PICKUP', 'IN_TRANSIT', 'DELIVERED'
    dispatched_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    driver_phone VARCHAR(100),
    pod_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON delivery_dispatches(order_id);
