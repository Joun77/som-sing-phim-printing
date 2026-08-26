# Phase 5: Inventory-Linked Dynamic Spec Builder & Custom Margin Engine

## 🎯 วัตถุประสงค์
เชื่อมโยงตัวจัดสเปกสินค้า (Spec Builder) เข้ากับคลังสินค้า (Inventory System) โดยตรง เพื่อดึง SKU, สต็อกคงเหลือ และต้นทุนจริงมาคำนวณราคาขายผ่านระบบ Dynamic & Custom Margin พร้อมแสดงสถานะสินค้าหมดและคำนวณส่วนต่างราคา (Delta Price) ให้ลูกค้าโดยอัตโนมัติ

---

## 📋 รายการงานย่อย (Tasks Checklist)

### [Task 5.1] Inventory Material Combobox & SKU Selector ใน Admin Spec Builder
- **ไฟล์เป้าหมาย:** `admin-system/frontend/src/features/catalog/components/` หรือ `admin-system/frontend/src/features/catalog/`
- **สิ่งที่ต้องทำ:**
  1. เปลี่ยนช่องกรอกข้อความ `Material SKU คลัง` จาก Free-Text เป็น `Material Search Combobox / Dropdown`
  2. ดึงรายการวัสดุจาก `GET /api/v1/materials` (หรือ `GET /api/v1/inventory/items`)
  3. แสดงข้อมูล SKU, ชื่อวัสดุ, สต็อกคงเหลือ (Stock on Hand) และต้นทุนต่อหน่วย (Cost per Unit) ในตัวเลือก
  4. เมื่อเลือกวัสดุ ให้ Auto-Fill SKU และ Cost เข้าสู่ตัวเลือกสเปกทันที

### [Task 5.2] Dynamic & Custom Margin Calculation Engine
- **ไฟล์เป้าหมาย:** `admin-system/backend/pricing/engine.go`, `admin-system/frontend/src/features/catalog/`
- **สิ่งที่ต้องทำ:**
  1. เพิ่มฟิลด์ `TargetMarginPercent` และ `VolumeMarginTiers` ในระดับ Product Template
  2. คำนวณราคาขายของตัวเลือก (Option Price) จากสูตร: `Cost ÷ (1 - Margin %)`
  3. คำนวณส่วนต่างราคาของตัวเลือกพิเศษ (Delta Price Modifier): `(Option Cost - Base Cost) ÷ (1 - Margin %)`
  4. เพิ่มสวิตช์ **Manual Price Override** ให้แอดมินสามารถปลดล็อกและพิมพ์ราคาบวกเพิ่มเองได้อิสระ

### [Task 5.3] Customer Realtime Stock Status & Delta Price Sync
- **ไฟล์เป้าหมาย:** `customer-service/src/components/OrderCustomizerForm.tsx`, `customer-service/src/pages/ProductPage.tsx`
- **สิ่งที่ต้องทำ:**
  1. ดึงข้อมูลตัวเลือกสเปกพร้อมส่วนต่างราคา `+₭ X,XXX` ที่คำนวณจากคลัง
  2. ตรวจสอบสต็อกวัสดุ หากสต็อก = 0 ให้แสดงป้าย `(สินค้าหมดชั่วคราว)` หรือปิดการเลือก (Disable) ตามค่าที่ตั้งไว้
  3. แสดงตัวเลือกเริ่มต้น (Default Option) เป็น `มาตรฐาน (ฟรี/รวมในราคาตั้งต้น)`

### [Task 5.4] Multi-layer Finishing & Consumables SKU Binding
- **ไฟล์เป้าหมาย:** `admin-system/backend/inventory/deduction.go`, `admin-system/backend/orders/handlers.go`
- **สิ่งที่ต้องทำ:**
  1. รองรับการผูก SKU วัสดุสิ้นเปลืองสำหรับกลุ่ม Finishing (ฟิล์มเคลือบ, ตาไก่, กาวสันร้อน, สันห่วง)
  2. เมื่อคำสั่งซื้อเข้าสู่ `IN_PRODUCTION` ให้ตัดสต็อกทั้งวัสดุพิมพ์หลักและวัสดุสิ้นเปลืองใน Transaction เดียวกัน

---

## 🔍 แผนการตรวจรับงาน (Verification Gate)
- [x] ในหน้า Admin Spec Builder สามารถค้นหาและเลือก SKU วัสดุจากคลังได้จริง ไม่ต้องพิมพ์เอง
- [x] เมื่อต้นทุนวัสดุในคลังเปลี่ยน หรือปรับ Margin สินค้า ส่วนต่างราคาหน้า Customer คำนวณถูกต้อง
- [x] ทดสอบเลือกตัวเลือกที่สต็อกในคลังเป็น 0 ระบบแจ้งเตือนหรือปิดการเลือกถูกต้อง
- [x] ออเดอร์ที่มีทั้งวัสดุพิมพ์และตัวเลือก Finishing ตัดสต็อกครบทุก SKU เมื่อสั่งผลิต
