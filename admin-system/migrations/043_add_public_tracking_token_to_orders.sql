-- Migration: 043_add_public_tracking_token_to_orders.sql
-- Description: Add high-entropy public tracking token column and index to orders table

ALTER TABLE orders ADD COLUMN IF NOT EXISTS public_tracking_token VARCHAR(64);

-- Create an index to quickly look up orders by tracking token on the public tracker
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_public_tracking_token 
ON orders (public_tracking_token) 
WHERE public_tracking_token IS NOT NULL AND public_tracking_token != '';
