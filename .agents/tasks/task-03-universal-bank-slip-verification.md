# Task 03: Universal Bank Slip Verification & Dual-Mode Payment Upload

## 1. AI Role & Mission
* **Role:** Senior Frontend Engineer & Payment UX Specialist
* **Mission:** ปรับปรุงระบบตรวจสอบสลิปโอนเงินและการชำระเงินในหน้ารับออเดอร์ (Order Reception / Step 1) ให้รองรับ **การโอนเงินผ่านทุกธนาคาร (Universal Bank Transfer)** ไม่จำกัดเฉพาะ BCEL OnePay และรองรับการจัดการสลิป 2 รูปแบบอย่างราบรื่น

---

## 2. ขอบเขตงานโดยละเอียด (Detailed Scope of Work)

### 1. ลบการผูกขาดชื่อธนาคาร (Universal Bank Transfer):
* ปรับข้อความและ UI จากเดิมที่ระบุเฉพาะ "BCEL OnePay" ให้กลายเป็น **"ກວດສອບສະລິບໂອນເງິນຜ່ານທະນາຄານ (Bank Transfer Slip)"** เพื่อรองรับทุกธนาคาร (BCEL, JDB, LDB, APB, Maruhan, Kasikornthai ฯลฯ)

### 2. รูปแบบที่ 1: ลูกค้าแนบสลิปมาผ่านระบบ Customer Service
* แสดงภาพตัวอย่างสลิปโอนเงินในการ์ดตรวจสอบ
* เมื่อคลิกที่รูปสลิป จะเปิดดูรูปขนาดใหญ่แบบขยายได้ (Lightbox Zoom Preview)
* ปุ่ม Action สำหรับแอดมิน:
  * `[✓ ຢືນຢັນຊຳລະ 100%]` ➔ เปลี่ยนสถานะเป็น `Fully Paid` และส่งต่อฝ่าย Pre-Press
  * `[✓ ຢືນຢັນມັດຈຳ (50%)]` ➔ เปลี่ยนสถานะเป็น `Deposit Paid` และบันทึกยอดค้างชำระ
  * `[ປະຕິເສດສະລິບ / ແຈ້ງລູກຄ້າ]` ➔ ส่งสถานะปฏิเสธสลิปเพื่อให้ลูกค้าส่งใหม่

### 3. รูปแบบที่ 2: แอดมินสร้างออเดอร์เองในหลังบ้าน (Walk-in / Direct Order)
* หากออเดอร์ยังไม่มีรูปสลิป ให้แสดงส่วน **"ອັບໂຫລດສະລິບ ຫຼື ແນບຫຼັກຖານການໂອນ"**
* แอดมินสามารถ:
  * กดปุ่ม `[ເລືອກຟາຍສະລິບ / ອັບໂຫລດຮູບ]` เพื่อแนบรูปสลิปหรือใบเสร็จรับเงินเข้าสู่ระบบ
  * กดยืนยันรับเงินสด / โอนเงินเข้าสู่ระบบได้ทันที

---

## 3. สิ่งที่ห้ามแตะต้องเด็ดขาด (Strict Restrictions)
* 🛑 **ห้ามแตะต้องโมดูล Finance หรือฐานข้อมูลการเงินส่วนอื่นที่ไม่เกี่ยวข้อง**
* 🛑 **ห้ามใช้อีโมจิในโค้ด UI และ Toast ทุกจุด**
* 🛑 **ห้ามใช้ภาษาไทยใน UI:** ข้อความสถานะและปุ่มทั้งหมดต้องเป็นภาษาลาว

---

## 4. ไฟล์เป้าหมายที่อนุญาตให้แก้ไข (Permitted Files Only)
* [MODIFY] `admin-system/frontend/src/features/orders/components/reception/PaymentSlipCard.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/OrderReceptionPage.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/OrderDetailsPage.tsx`

---

## 5. เกณฑ์การตรวจรับงาน (Acceptance Criteria & QA Checklist)
- [ ] ข้อความใน UI เปลี่ยนเป็นระบบตรวจสอบสลิปโอนเงินทั่วไป (ไม่เจาะจงเฉพาะ BCEL)
- [ ] เมื่อคลิกรูปสลิป สามารถซูมดูรูปขนาดใหญ่ (Lightbox Zoom) ได้ชัดเจน
- [ ] กรณีออเดอร์สร้างเอง แอดมินมีปุ่มอัปโหลดรูปสลิปและแนบเข้ากับออเดอร์ได้จริง
- [ ] ปุ่มยืนยันชำระ 100% และยืนยันมัดจำ 50% อัปเดตสถานะและยอดค้างชำระถูกต้อง
