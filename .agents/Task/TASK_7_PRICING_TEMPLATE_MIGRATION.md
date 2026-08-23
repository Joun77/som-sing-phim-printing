# Task 7: Pricing Templates & MOQ Schema Setup

## Objective
สร้างตาราง `product_pricing_templates` เพื่อรองรับโมเดล Print on Demand ที่มีเงื่อนไข MOQ, ยอดสั่งพิมพ์ขั้นต่ำ, ค่าควบคุม Ink Coverage Baseline, และอัตราค่าบริการออปชันเสริม

## Target File
- `backend/migrations/000003_create_pricing_templates.sql`
- `backend/internal/domain/template.go`

## Technical Requirements
1. สร้าง Migration `000003_create_pricing_templates.sql`:
   - ตาราง `product_pricing_templates`:
     - `id` (UUID PRIMARY KEY DEFAULT uuid_generate_v4())
     - `name` (VARCHAR(150) NOT NULL)
     - `material_id` (UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE)
     - `baseline_coverage_percent` (NUMERIC(5, 2) NOT NULL DEFAULT 15.00)
     - `coverage_surcharge_multiplier` (NUMERIC(6, 4) NOT NULL DEFAULT 1.0000)
     - `min_order_quantity` (INT NOT NULL DEFAULT 1)
     - `min_total_price` (NUMERIC(16, 2) NOT NULL DEFAULT 0.00)
     - `addon_rates` (JSONB NOT NULL DEFAULT '{}')
     - `is_active` (BOOLEAN NOT NULL DEFAULT TRUE)
     - `created_at`, `updated_at` (TIMESTAMPTZ DEFAULT NOW())
2. สร้าง Go Domain Structs ใน `template.go` โดยใช้ `github.com/shopspring/decimal` สำหรับตัวเลขทั้งหมด