-- Migration 032: Create offcuts table for tracking remnant paper scraps
CREATE TABLE IF NOT EXISTS offcuts (
    id VARCHAR(100) PRIMARY KEY,
    material_sku VARCHAR(100),
    material_name VARCHAR(255),
    width_mm NUMERIC(10, 2) DEFAULT 0,
    height_mm NUMERIC(10, 2) DEFAULT 0,
    quantity INTEGER DEFAULT 0,
    location VARCHAR(255) DEFAULT 'Main Stock',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE offcuts ENABLE ROW LEVEL SECURITY;
