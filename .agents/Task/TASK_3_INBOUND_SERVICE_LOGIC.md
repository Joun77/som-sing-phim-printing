# Task 3: Inbound Processing & Moving Average Cost Logic

## Objective
เขียน Service Logic สำหรับการรับเข้าสินค้า โดยทำการอัปเดตสต็อกทับรายการเดิม (ไม่สร้างแถวใหม่) พร้อมคำนวณ Weighted Moving Average Cost อัตโนมัติภายใต้ Database Transaction

## Target Files
- `backend/internal/repository/material_repository.go`
- `backend/internal/repository/inbound_repository.go`
- `backend/internal/service/inventory_service.go`

## Technical Requirements
1. `backend/internal/service/inventory_service.go`:
   - ฟังก์ชัน `ProcessStockInbound(ctx context.Context, req domain.CreateInboundPayload) error`
   - เริ่ม Transaction (`tx := s.db.Begin()`):
     - ตรวจสอบว่ามี Material อยู่แล้วหรือไม่ (ผ่าน `req.MaterialID` หรือ `req.SKU`)
     - หากมีอยู่แล้ว:
       - คำนวณต้นทุนเฉลี่ย: `NewCost = ((CurrentQty * CurrentCost) + (IncomingQty * IncomingCost)) / (CurrentQty + IncomingQty)`
       - อัปเดตยอดคงเหลือ: `StockQuantity += req.QuantityReceived`
       - ปรับสถานะ `StockStatus = 'IN_STOCK'`
       - อัปเดตทับ Record เดิมใน `materials` (ห้าม Create ซ้ำ)
     - บันทึกแถวใหม่ลงใน `stock_inbound_records` สถานะ `COMPLETED`
   - Commit Transaction
2. เพิ่มฟังก์ชัน Query/Update ที่จำเป็นใน Repository ทั้งสองไฟล์