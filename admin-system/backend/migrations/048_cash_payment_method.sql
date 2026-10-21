-- Migration 048: Canonical Counter Cash Payment Method
-- Ensures the 'cash' payment method exists canonically for fresh database installations.

INSERT INTO payment_methods (id, bank_name, account_name, account_number, is_active, is_default, created_at, updated_at)
VALUES ('cash', 'ເງິນສົດ (Cash)', 'ຮັບເງິນສົດໜ້າຮ້ານ', 'CASH', true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET 
    bank_name = EXCLUDED.bank_name,
    account_name = EXCLUDED.account_name,
    account_number = EXCLUDED.account_number,
    is_active = true,
    updated_at = CURRENT_TIMESTAMP;
