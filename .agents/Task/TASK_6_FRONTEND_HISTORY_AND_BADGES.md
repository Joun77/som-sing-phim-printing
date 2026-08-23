# Task 6: Frontend Inbound History & Stock Status Badges

## Objective
สร้างตารางประวัติการรับเข้าสินค้าพร้อมปุ่มกดยกเลิกบิล และปรับปรุงตารางคลังสินค้าหลักให้แสดง Badge สถานะ `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`

## Target Files
- `frontend/src/features/inventory/components/InboundHistoryTable.tsx`
- `frontend/src/features/inventory/components/StockTable.tsx`

## Technical Requirements
1. `frontend/src/features/inventory/components/InboundHistoryTable.tsx`:
   - แสดงตารางประวัติบิลนำเข้า: หมายเลขบิล, ชื่อสินค้า, จำนวนรับ, ราคาซื้อต่อหน่วย, วันที่รับ, สถานะ (`COMPLETED` / `CANCELLED`)
   - ปุ่ม **"ยกเลิกบิล (Cancel)"** สำหรับบิลที่สถานะเป็น `COMPLETED` โดยมี Modal ให้กรอกเหตุผลก่อนยืนยัน
2. `frontend/src/features/inventory/components/StockTable.tsx`:
   - แสดง Badge สถานะ:
     - สีเขียว: `มีสินค้า (In Stock)`
     - สีเหลือง/ส้ม: `สินค้าใกล้หมด (Low Stock)` (เมื่อ `stock_quantity <= min_stock_alert`)
     - สีแดง: `สินค้าหมด (Out of Stock)` (เมื่อ `stock_quantity <= 0`)
   - เพิ่มปุ่ม "แก้ไขข้อมูล (Edit)" ต่อท้ายแถวสินค้าเพื่อเปิด Modal แก้ไขชื่อ/ราคาต้นทุนผ่าน `updateMaterialDirect`