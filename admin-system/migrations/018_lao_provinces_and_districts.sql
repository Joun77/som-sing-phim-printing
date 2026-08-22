-- Migration 018: Lao Provinces and Districts Table
CREATE TABLE IF NOT EXISTS lao_provinces (
    id SERIAL PRIMARY KEY,
    name_la VARCHAR(150) NOT NULL UNIQUE,
    name_en VARCHAR(150) NOT NULL,
    label VARCHAR(250) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lao_districts (
    id SERIAL PRIMARY KEY,
    province_id INT NOT NULL REFERENCES lao_provinces(id) ON DELETE CASCADE,
    name_la VARCHAR(150) NOT NULL,
    name_en VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_province_district UNIQUE (province_id, name_la)
);

CREATE INDEX IF NOT EXISTS idx_lao_districts_province_id ON lao_districts(province_id);
