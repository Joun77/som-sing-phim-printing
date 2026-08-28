# Task 03: Shipping Label & Packing Slip Generator

## 1. AI Role Definition
* **Role:** Logistics & Document Generation Engineer
* **Mission:** สร้างระบบพิมพ์ **"ใบปะหน้ากล่องพัสดุ (Shipping Label)"** และ **"ใบเสร็จ/สรุปรายการจัดส่ง (Packing Slip)"** สำหรับติดกล่องส่งลูกค้าออนไลน์ รองรับขนาดมาตรฐานสติกเกอร์ความร้อน (Thermal 100×150 mm / A6) และกระดาษ A4

---

## 2. ขอบเขตงานที่ต้องทำ (Scope of Work)
1. **Shipping Label Template (ຂະໜາດ 100×150 mm / A6):**
   - ชื่อ-ที่อยู่-เบอร์โทรผู้ส่ง (Som Sing Phim Printing)
   - ชื่อ-ที่อยู่-เบอร์โทรผู้รับ (ดึงจากข้อมูลออเดอร์ของลูกค้า)
   - Barcode / QR Code ประจำเลขออเดอร์ และเลขพัสดุ (Tracking No.)
   - โลโก้ขนส่ง (Anousith, Hal Logistics, Flash Express, J&T)
   - สรุปรายการสินค้าข้างในกล่องแบบย่อ (เช่น "สมุดโน้ตสันห่วง A5 × 50 เล่ม")
2. **Packing Slip & Receipt PDF Preview / Print:**
   - หน้าต่าง Modal พรีวิวใบปะหน้าและใบส่งของ พร้อมปุ่ม `[ພິມໃບປະໜ້າ (Print Label)]` กดแล้วสั่งพิมพ์ผ่าน Browser Print Dialog ได้ทันที
3. **Packaging Stock Deduction (Optional Toggle):**
   - ตัวเลือกตัดสต็อกกล่องพัสดุ/ซองกันกระแทกอัตโนมัติ 1 กล่องเมื่อสั่งพิมพ์ใบปะหน้า

---

## 3. สิ่งที่ห้ามทำเด็ดขาด (Strict Restrictions)
* ❌ **ห้ามใช้อีโมจิในโค้ด ใบพิมพ์ และ UI เด็ดขาด** (ให้ใช้ Lucide Icons เช่น `<Package />`, `<Printer />`, `<Truck />`, `<QrCode />` เท่านั้น)
* ❌ **ห้ามใช้ภาษาไทยใน UI และใบปะหน้า** (ข้อความทั้งหมดต้องเป็น **ภาษาลาว** เช่น `ຜູ້ສົ່ງ`, `ຜູ້ຮັບ`, `ລາຍການສິນຄ້າ`, `ພິມໃບປະໜ້າພັດສະດຸ`)
* ❌ **ห้ามใช้ External Network Font ที่ทำให้หน้าพิมพ์ค้าง** (ต้องใช้ CSS `@media print` ที่โหลดเร็วและเรนเดอร์คมชัด)

---

## 4. สิ่งที่แก้ไขได้และไฟล์เป้าหมาย (Permitted Scope & Target Files)
* [NEW] `admin-system/frontend/src/features/orders/components/modals/ShippingLabelModal.tsx`
* [NEW] `admin-system/frontend/src/features/orders/components/documents/ShippingLabelTemplate.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/OrderTable.tsx` (เพิ่มปุ่มพิมพ์ใบปะหน้า)
* [MODIFY] `admin-system/frontend/src/features/orders/components/details/OrderDetailsModal.tsx`
* [MODIFY] `admin-system/frontend/src/index.css` (เพิ่ม CSS `@media print` สำหรับขนาด 100×150mm)

---

## 5. เกณฑ์การตรวจรับงาน (Acceptance Criteria)
1. กดปุ่ม "ພິມໃບປະໜ້າ" แล้วมีหน้าต่างพรีวิวใบปะหน้าพัสดุขนาด 100×150 mm คมชัด สวยงาม
2. เมื่อกด Print แสดงหน้าพิมพ์ของเบราว์เซอร์ได้ถูกต้อง ไม่ล้นหน้า
3. ข้อความในใบปะหน้าและ UI เป็นภาษาลาว 100% ปราศจากอีโมจิ
