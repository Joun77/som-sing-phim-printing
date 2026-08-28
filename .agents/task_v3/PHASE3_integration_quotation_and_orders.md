# PHASE 3: Integration with Quotation Manager & Create Order Page

## 🎯 Role: Senior Frontend Integration & State Architect
## 📁 Target Files:
- `admin-system/frontend/src/features/pricing/components/QuotationManager.tsx`
- `admin-system/frontend/src/features/orders/components/CreateOrderPage.tsx`
- `admin-system/frontend/src/features/orders/components/ItemSpecConfigurator.tsx`

---

## 📋 Task Requirements:
1. **Quotation Manager Integration:**
   - เมื่อคลิกปุ่ม `+ ເພີ່ມລາຍການ` ใน `QuotationManager.tsx` $\rightarrow$ เปิด `PreflightItemCreationModal`
   - เมื่อผู้ใช้กด "ຕົກລົງ" $\rightarrow$ สร้าง Item ใหม่ โดยตั้งค่า:
     - `name`: ชื่อไฟล์
     - `pageCount`: จำนวนหน้าทั้งหมด
     - `colorPages`: จำนวนหน้าสี
     - `monoPages`: จำนวนหน้าขาวดำ
     - `jobWidth` / `jobHeight`: ขนาดกระดาษที่เลือก (mm)
     - `cCoverage`, `mCoverage`, `yCoverage`, `kCoverage`: ค่าสีเฉลี่ยที่ตรวจพบ
     - `colorPrintMode`: ถ้ามีหน้าสีให้เป็น `CMYK` ถ้าขาวดำล้วนให้เป็น `MONO_K`
     - สลับ Tab ไปยัง Item ที่สร้างใหม่ทันที

2. **Create Order Page Integration:**
   - ใน Step 2 เมื่อคลิก `+ Add New Item` $\rightarrow$ เปิด `PreflightItemCreationModal`
   - นำผลการวิเคราะห์ไปสร้าง Item ในออเดอร์ พร้อมสเปกที่ครบถ้วน
