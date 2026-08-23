# Task 1: Database Migration for Inbound & Inventory Integrity

## Objective
สร้างตารางบันทึกประวัติการรับเข้าสินค้า (`stock_inbound_records`) และปรับปรุงฟิลด์สถานะของตาราง `materials` เพื่อป้องกันปัญหาสต็อกเบิ้ลซ้ำซ้อน

## Target File
- `backend/migrations/000002_inventory_inbound_fix.sql`

## Technical Requirements
1. ปรับปรุงตาราง `materials`:
   - เพิ่มคอลัมน์ `is_active` (BOOLEAN DEFAULT TRUE NOT NULL)
   - เพิ่มคอลัมน์ `min_stock_alert` (NUMERIC(14, 4) DEFAULT 10.0000 NOT NULL)
   - เพิ่มคอลัมน์ `stock_status` (VARCHAR(30) DEFAULT 'IN_STOCK' NOT NULL)
2. สร้างตาราง `stock_inbound_records`:
   - `id` (UUID PRIMARY KEY DEFAULT uuid_generate_v4())
   - `inbound_number` (VARCHAR(60) NOT NULL)
   - `material_id` (UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT)
   - `lot_batch_number` (VARCHAR(100))
   - `quantity_received` (NUMERIC(14, 4) NOT NULL CHECK (quantity_received > 0))
   - `unit_purchase_price` (NUMERIC(16, 4) NOT NULL)
   - `supplier_name` (VARCHAR(200))
   - `status` (VARCHAR(30) DEFAULT 'COMPLETED' NOT NULL) -- 'COMPLETED', 'CANCELLED'
   - `received_by_user_id` (UUID NOT NULL)
   - `cancelled_by_user_id` (UUID)
   - `cancellation_reason` (TEXT)
   - `received_at` (TIMESTAMPTZ DEFAULT NOW() NOT NULL)
   - `cancelled_at` (TIMESTAMPTZ)
3. เพิ่ม Index `idx_stock_inbound_material_id` และ `idx_stock_inbound_status`