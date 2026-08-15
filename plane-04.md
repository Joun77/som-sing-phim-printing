# 🧹 Final Cleanup & Build Verification Plan

## 🎯 วัตถุประสงค์
1. ลบ Legacy Spec Files ใน Inventory ที่ถูกแทนที่ด้วย Dynamic Components แล้ว
2. ตรวจสอบการล้างการเรียกใช้ AppContext และคอมไพล์ระบบเพื่อความสมบูรณ์แบบ

---

## 📋 รายการงาน (Action Items)

### 1. ลบไฟล์ที่ไม่ได้ใช้งานแล้ว (Delete Deprecated Inventory Files)
ลบไฟล์เก่าต่อไปนี้ออกจากโปรเจกต์:
- `admin-system/frontend/src/features/inventory/components/details/PaperSpecDetail.tsx`
- `admin-system/frontend/src/features/inventory/components/details/InkSpecDetail.tsx`
- `admin-system/frontend/src/features/inventory/components/details/PrinterSpecDetail.tsx`
- `admin-system/frontend/src/features/inventory/components/details/GenericSpecDetail.tsx`
- `admin-system/frontend/src/features/inventory/components/forms/PaperForm.tsx`
- `admin-system/frontend/src/features/inventory/components/forms/InkSetForm.tsx`
- `admin-system/frontend/src/features/inventory/components/forms/FinishingForm.tsx`
- `admin-system/frontend/src/features/inventory/components/forms/category-specs/` (ทุกไฟล์ภายในโฟลเดอร์)

### 2. ตรวจสอบความถูกต้องของ Public API
- ตรวจสอบ `src/features/inventory/index.ts` ให้แน่ใจว่า Export เฉพาะ `DynamicSpecDetail`, `DynamicSpecForm`, `InventoryManagement`, `InventoryTable` และ Types ที่จำเป็นเท่านั้น

### 3. Build & Test Verification
- รันคำสั่ง `npm run build` ในโฟลเดอร์ `admin-system/frontend` เพื่อตรวจสอบว่าไม่มี Broken Import
- รันคำสั่ง `go test ./...` ในโฟลเดอร์ `admin-system/backend`