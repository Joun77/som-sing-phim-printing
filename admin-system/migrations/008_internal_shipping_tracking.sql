-- Migration 008: Internal Shipping Tracking System
-- Adds internal_tracking_code, courier_name, pod_image_url to orders table.

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'internal_tracking_code') THEN
            ALTER TABLE orders ADD COLUMN internal_tracking_code VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'courier_name') THEN
            ALTER TABLE orders ADD COLUMN courier_name VARCHAR(100) DEFAULT 'Som-Sing Express';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'pod_image_url') THEN
            ALTER TABLE orders ADD COLUMN pod_image_url TEXT;
        END IF;
    END IF;
END $$;
