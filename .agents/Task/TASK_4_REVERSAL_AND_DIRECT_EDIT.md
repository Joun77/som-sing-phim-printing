# Task 4: Inbound Cancellation / Reversal & Material Direct Edit

## Objective
สร้างฟังก์ชันการยกเลิก/คืนบิลนำเข้าสินค้า (หักสต็อกคืน หากเหลือ 0 ปรับเป็น OUT_OF_STOCK โดยไม่ลบ Record) และ Endpoint สำหรับแก้ไขข้อมูลสินค้าหลักโดยตรงผ่าน REST API

## Target Files
- `backend/internal/repository/material_repository.go`
- `backend/internal/repository/inbound_repository.go`
- `backend/internal/service/inventory_service.go`
- `backend/internal/handler/inventory_handler.go`

## Technical Requirements
1. `backend/internal/service/inventory_service.go`:
   - ฟังก์ชัน `CancelStockInbound(ctx context.Context, payload domain.CancelInboundPayload) error`:
     - เริ่ม Database Transaction
     - ดึงข้อมูล `stock_inbound_records` ตาม ID ตรวจสอบสถานะต้องเป็น `COMPLETED` เท่านั้น
     - ตรวจสอบยอดสต็อกคงเหลือใน `materials`: `material.StockQuantity >= inbound.QuantityReceived`
     - หักยอดสต็อก: `material.StockQuantity -= inbound.QuantityReceived`
     - หาก `material.StockQuantity <= 0` ให้ปรับ `material.StockStatus = 'OUT_OF_STOCK'`
     - อัปเดตสถานะบิลนำเข้าเป็น `CANCELLED` พร้อมบันทึก `cancelled_by_user_id`, `cancellation_reason`, `cancelled_at`
     - Commit Transaction
   - ฟังก์ชัน `UpdateMaterialDirect(ctx context.Context, id uuid.UUID, payload domain.UpdateMaterialPayload) error`:
     - อัปเดตชื่อ, SKU, ราคาต้นทุนต่อหน่วย (`unit_cost`), และค่าแจ้งเตือนสต็อกขั้นต่ำ (`min_stock_alert`) ทับแถวเดิม
2. `backend/internal/handler/inventory_handler.go`:
   - เพิ่ม Route `POST /api/v1/inventory/inbound/:id/cancel`
   - เพิ่ม Route `PUT /api/v1/inventory/materials/:id`