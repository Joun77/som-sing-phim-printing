ALTER TABLE accounts_payable DROP COLUMN IF EXISTS po_id;
ALTER TABLE accounts_payable DROP COLUMN IF EXISTS supplier_id;
DROP TABLE IF EXISTS goods_receipt_lines CASCADE;
DROP TABLE IF EXISTS goods_receipts CASCADE;
DROP TABLE IF EXISTS purchase_order_lines CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TYPE IF EXISTS po_status;
DROP TABLE IF EXISTS suppliers CASCADE;
