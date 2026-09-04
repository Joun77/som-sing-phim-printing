-- ============================================================================
-- Migration: 000010_create_finance_tables.up.sql
-- Description: Double-entry chart of accounts, journal entries, expenses, and AP
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Account Type Enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
        CREATE TYPE account_type AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'COGS', 'EXPENSE');
    END IF;
END $$;

-- 2. Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    account_type account_type NOT NULL,
    parent_id UUID REFERENCES chart_of_accounts(id),
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    branch_id UUID NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coa_code ON chart_of_accounts(code);
CREATE INDEX IF NOT EXISTS idx_coa_type ON chart_of_accounts(account_type);

-- 3. Journal Entries (Header)
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_date DATE NOT NULL,
    description TEXT,
    reference_type VARCHAR(50), -- 'ORDER', 'INBOUND', 'PAYROLL', 'MANUAL', 'SPOILAGE'
    reference_id VARCHAR(64),
    created_by VARCHAR(64),
    branch_id UUID NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_je_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_je_ref ON journal_entries(reference_type, reference_id);

-- 4. Journal Lines (Debit/Credit)
CREATE TABLE IF NOT EXISTS journal_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    debit NUMERIC(15, 2) DEFAULT 0,
    credit NUMERIC(15, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'LAK',
    notes TEXT,
    CONSTRAINT check_debit_credit CHECK (debit >= 0 AND credit >= 0)
);

CREATE INDEX IF NOT EXISTS idx_jl_entry ON journal_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_jl_account ON journal_lines(account_id);

-- 5. Expense Records
CREATE TABLE IF NOT EXISTS expense_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES chart_of_accounts(id),
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'LAK',
    description TEXT,
    receipt_url TEXT,
    expense_date DATE NOT NULL,
    recorded_by VARCHAR(64),
    branch_id UUID NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_date ON expense_records(expense_date);
CREATE INDEX IF NOT EXISTS idx_expense_category ON expense_records(category);

-- 6. Accounts Payable
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ap_status') THEN
        CREATE TYPE ap_status AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS accounts_payable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_name VARCHAR(200) NOT NULL,
    inbound_transaction_id VARCHAR(64),
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'LAK',
    due_date DATE,
    paid_at TIMESTAMPTZ,
    status ap_status DEFAULT 'PENDING',
    notes TEXT,
    branch_id UUID NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ap_status ON accounts_payable(status);
CREATE INDEX IF NOT EXISTS idx_ap_due_date ON accounts_payable(due_date);
