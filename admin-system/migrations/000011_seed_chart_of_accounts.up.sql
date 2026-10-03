-- ============================================================================
-- Migration: 000011_seed_chart_of_accounts.up.sql
-- Description: Standard Chart of Accounts seed for Som Sing Phim SME
-- ============================================================================

INSERT INTO chart_of_accounts (code, name, account_type, sort_order) VALUES
('1100', 'เงินสดในมือ (Cash on Hand)', 'ASSET', 10),
('1110', 'เงินฝากธนาคาร LAK (BCEL Bank LAK)', 'ASSET', 20),
('1120', 'เงินฝากธนาคาร THB (KBank THB)', 'ASSET', 30),
('1200', 'ลูกหนี้การค้า (Accounts Receivable)', 'ASSET', 40),
('1300', 'วัตถุดิบและวัสดุคงคลัง (Raw Materials Inventory)', 'ASSET', 50),
('2100', 'เจ้าหนี้การค้า (Accounts Payable)', 'LIABILITY', 60),
('2200', 'เงินมัดจำรับล่วงหน้า (Customer Deposits)', 'LIABILITY', 70),
('3100', 'ทุนเจ้าของ (Owner Equity)', 'EQUITY', 80),
('4100', 'รายรับจากงานพิมพ์และบริการ (Printing Sales Revenue)', 'REVENUE', 90),
('5100', 'ต้นทุนกระดาษ (COGS - Paper)', 'COGS', 100),
('5200', 'ต้นทุนน้ำหมึก (COGS - Ink)', 'COGS', 110),
('5300', 'ต้นทุนของเสียจากการผลิต (COGS - Spoilage & Scrap)', 'COGS', 120),
('5400', 'ค่าเสื่อมราคาเครื่องจักร (COGS - Machine Depreciation)', 'COGS', 130),
('6100', 'ค่าจ้างและเงินเดือนพนักงาน (Salaries & Labor Expense)', 'EXPENSE', 140),
('6200', 'ค่าเช่าสถานที่และโรงพิมพ์ (Rent Expense)', 'EXPENSE', 150),
('6300', 'ค่าไฟฟ้าและสาธารณูปโภค (Utilities & Electricity)', 'EXPENSE', 160),
('6400', 'ค่าซ่อมบำรุงรักษาเครื่องจักร (Maintenance & Repairs)', 'EXPENSE', 170),
('6500', 'ค่าใช้จ่ายดำเนินงานทั่วไป (Overhead & Administrative)', 'EXPENSE', 180)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    account_type = EXCLUDED.account_type,
    sort_order = EXCLUDED.sort_order;
