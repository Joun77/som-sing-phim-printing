-- Migration 017: Couriers and Payment Methods Master Data
-- Enables dynamic management of shipping couriers (logo, name) and bank accounts for Admin and Customer Service.

DO $$ 
BEGIN
    -- 1. Create couriers table
    CREATE TABLE IF NOT EXISTS couriers (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        short_name VARCHAR(100),
        logo_url TEXT,
        fee NUMERIC(12, 2) DEFAULT 0,
        eta VARCHAR(100) DEFAULT '1-2 ວັນ',
        free_above NUMERIC(12, 2) DEFAULT 0,
        color VARCHAR(30) DEFAULT '#2563eb',
        is_active BOOLEAN DEFAULT TRUE,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Create bank_accounts / payment_methods table
    CREATE TABLE IF NOT EXISTS payment_methods (
        id VARCHAR(64) PRIMARY KEY,
        bank_name VARCHAR(255) NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        account_number VARCHAR(100) NOT NULL,
        branch VARCHAR(255),
        qr_code_url TEXT,
        logo_url TEXT,
        promptpay_name VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Seed Default Couriers if empty
    IF NOT EXISTS (SELECT 1 FROM couriers LIMIT 1) THEN
        INSERT INTO couriers (id, name, short_name, logo_url, fee, eta, free_above, color, is_active, is_default) VALUES
        ('anousith_express', 'Anousith Express (ອະນຸສິດ ເອັກສະເປຣັສ)', 'Anousith', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=150', 15000, '1-2 ວັນ (1-2 Days)', 300000, '#d97706', true, true),
        ('hal_logistics', 'HAL Logistics (ຮົງອາລຸນ ຂົນສົ່ງ)', 'HAL', 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=150', 20000, '1-2 ວັນ (1-2 Days)', 350000, '#2563eb', true, false),
        ('mixay_express', 'Mixay Express (ມີໄຊ ຂົນສົ່ງ)', 'Mixay', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=150', 15000, '1-2 ວັນ (1-2 Days)', 300000, '#dc2626', true, false),
        ('self_pickup', 'Self Pickup (ຮັບເອງທີ່ຮ້ານ)', 'Self Pickup', 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&q=80&w=150', 0, 'ທັນທີ (Immediate)', 0, '#059669', true, false);
    END IF;

    -- 4. Seed Default Bank Accounts if empty
    IF NOT EXISTS (SELECT 1 FROM payment_methods LIMIT 1) THEN
        INSERT INTO payment_methods (id, bank_name, account_name, account_number, branch, qr_code_url, promptpay_name, is_active, is_default) VALUES
        ('bcel_one', 'BCEL (ທະນາຄານການຄ້າຕ່າງປະເທດລາວ ມະຫາຊົນ)', 'Som-Sing Phim Printing Shop', '160-12-00-01234567-001', 'Vientiane Head Office', '/assets/images/bcel-qr-placeholder.png', 'Som-Sing Phim', true, true),
        ('ldb_trust', 'LDB (ທະນາຄານ ພັດທະນາລາວ)', 'Som-Sing Phim Printing Shop', '010-00-11-98765432-001', 'Lane Xang Branch', '/assets/images/bcel-qr-placeholder.png', 'Som-Sing Phim', true, false);
    END IF;
END $$;
