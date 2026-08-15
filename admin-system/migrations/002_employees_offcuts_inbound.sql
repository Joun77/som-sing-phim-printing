-- +goose Up
-- ============================================================================
-- Migration: 002_employees_offcuts_inbound.sql
-- Description: Adds dedicated tables for Employees (HR) and Offcuts (Remnants)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABLE: employees (HR Employee Management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(100) PRIMARY KEY,
    name_lo VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    phone VARCHAR(100),
    address TEXT,
    salary_lak NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    skills JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- ============================================================================
-- 2. TABLE: offcuts (Material Offcut & Remnant Inventory)
-- ============================================================================

CREATE TABLE IF NOT EXISTS offcuts (
    id VARCHAR(100) PRIMARY KEY,
    material_sku VARCHAR(100) NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    width_mm NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    height_mm NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    quantity INT NOT NULL DEFAULT 1,
    location VARCHAR(100) NOT NULL DEFAULT 'Main Stock',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_offcuts_material_sku ON offcuts(material_sku);

-- +goose Down
DROP TABLE IF EXISTS offcuts CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
