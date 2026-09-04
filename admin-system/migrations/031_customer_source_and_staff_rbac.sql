-- Migration 031: Customer Source Tracking and Staff RBAC User Accounts

-- 1. Enhance customers table to record channel origin and authentication
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'CUSTOMER_SERVICE',
  ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'PHONE',
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_customers_source ON customers(source);

-- 2. Staff & Employee RBAC Login Accounts
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(100) PRIMARY KEY,
    employee_id VARCHAR(100),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'sales',
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_employee_id ON admin_users(employee_id);
