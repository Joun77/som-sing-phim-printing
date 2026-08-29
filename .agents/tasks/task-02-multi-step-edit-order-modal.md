# Task 02: Multi-Step Large Edit Order Modal & In-Production Stock Guard

## 1. AI Role & Mission
* **Role:** Senior Full-Stack Print ERP Engineer
* **Mission:** สร้างคอมโพเนนต์โมดัลขนาดใหญ่ (`EditOrderModal.tsx`) สำหรับแก้ไขออเดอร์แบบ 3 ขั้นตอนมาตรฐานเหมือนหน้าสร้างออเดอร์ (`CreateOrderPage`) และหน้าใบเสนอราคา พร้อมระบบ Guard ล็อกสเปกวัตถุดิบอัตโนมัติหากออเดอร์ตัดสต็อกไปแล้ว

---

## 2. ขอบเขตงานโดยละเอียด (Detailed Scope of Work)

### ขั้นตอนที่ 1: ข้อมูลลูกค้า & ช่องทางจัดส่ง (Step 1: Customer Profile & Delivery)
* ฟิลด์แก้ไข: ชื่อลูกค้า, เบอร์โทรศัพท์, ที่อยู่จัดส่ง
* ช่องทางการส่งมอบ: เลือกระหว่าง "ຮັບເອງທີ່ຮ້ານ (Pick-up)" หรือ "ຈັດສົ່ງຜ່ານຂົນສົ່ງ (Courier)"
* กำหนดวันนัดส่งมอบ (Promised Delivery Date)
* แนบ/แก้ไขลิงก์ไฟล์อาร์ตเวิร์กหลัก (Google Drive / Canva / Cloud Storage)

### ขั้นตอนที่ 2: รายการสินค้า & สเปกวัตถุดิบ (Step 2: Print Items & Material Specs)
* แสดงรายการ Job งานพิมพ์ทั้งหมดในออเดอร์ พร้อมปุ่มเพิ่ม/ลบ Job
* แก้ไขสเปกงานพิมพ์แต่ละ Job ได้ละเอียด:
  * ชนิดกระดาษ / แกรม / ล็อตกระดาษในคลัง
  * ขนาดชิ้นงาน (กว้าง × ยาว มม.), จำนวนหน้า, หน้าสี / หน้าขาวดำ
  * วิธีเข้าเล่ม (สันห่วง, สันกาวร้อน, เย็บมุงหลังคา, สันปฏิทิน ฯลฯ)
  * การเคลือบ (เงา, ด้าน, Spot UV)
  * % Ink Coverage และเครื่องพิมพ์ที่ใช้งาน
* **กฎป้องกันสต็อก (In-Production Stock Guard Rule):**
  * หากสถานะออเดอร์ยังไม่สั่งพิมพ์ (`QUOTATION`, `ORDER_CREATED`, `FILE_CONFIRMED`): สามารถแก้ไขสเปกและเปลี่ยนวัตถุดิบได้ 100%
  * หากสถานะออเดอร์สั่งพิมพ์แล้ว (`IN_PRODUCTION`, `COMPLETED` หรือ `stockDeducted === true`):
    * **ล็อกสเปกวัตถุดิบห้ามแก้ไข (Read-Only Specs)**
    * แสดงป้ายเตือนสีม่วง: *"ອໍເດີນີ້ສັ່ງພິມ ແລະ ຕັດສະຕັອກແລ້ວ ບໍ່ສາມາດແກ້ໄຂສະເປກວັດຖຸດິບໄດ້"*
    * อนุญาตให้แก้ไขได้เฉพาะข้อมูลลูกค้า, ขนส่ง, และข้อมูลการเงิน

### ขั้นตอนที่ 3: สรุปยอดเงิน & การเงิน (Step 3: Financial & Settlement Summary)
* คำนวณยอดเงินรวม (Grand Total) ใหม่ตามสเปกที่แก้ไข
* ปรับแต่งส่วนลด (Discount) และค่าจัดส่ง (Shipping Fee)
* ปรับแต่งยอดยอดมัดจำ (Deposit 50% หรือระบุจำนวน) และคำนวณยอดคงค้าง (Remaining Balance)
* เมื่อกดบันทึก: เรียก `updateOrderDetails` อัปเดต State ใน `AppContext` และส่ง Sync สู่ Backend

---

## 3. สิ่งที่ห้ามแตะต้องเด็ดขาด (Strict Restrictions)
* 🛑 **ห้ามแก้ไขสูตรคำนวณราคาหลักใน `backend/pricing/`**
* 🛑 **ห้ามยกเลิกหรือคืนสต็อกของออเดอร์ที่อยู่ในสถานะ `IN_PRODUCTION` แล้วเด็ดขาด** (ตามกฎ `admin-architecture-guard.md`)
* 🛑 **ห้ามใช้อีโมจิในโค้ด UI และ Toast ทุกจุด**
* 🛑 **ห้ามใช้ภาษาไทยใน UI** (ข้อความในโมดัลต้องเป็นภาษาลาวทั้งหมด)

---

## 4. ไฟล์เป้าหมายที่อนุญาตให้แก้ไข (Permitted Files Only)
* [MODIFY] `admin-system/frontend/src/features/orders/components/modals/EditOrderModal.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/CustomerOrders.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/OrderDetailsPage.tsx`

---

## 5. เกณฑ์การตรวจรับงาน (Acceptance Criteria & QA Checklist)
- [ ] โมดัลแก้ไขออเดอร์เปิดเป็น Popup ขนาดใหญ่และแบ่ง 3 ขั้นตอนชัดเจน
- [ ] ออเดอร์ก่อนสั่งพิมพ์สามารถแก้ไขข้อมูลลูกค้า, สเปกกระดาษ, วิธีเข้าเล่ม, และราคาได้สมบูรณ์
- [ ] ออเดอร์ที่สั่งพิมพ์แล้ว (`IN_PRODUCTION` / ตัดสต็อกแล้ว) จะล็อกสเปกวัตถุดิบและแสดงป้ายเตือน แต่ยังแก้ที่อยู่และข้อมูลลูกค้าได้
- [ ] เมื่อกดบันทึก ข้อมูลในหน้ารายละเอียดและตารางออเดอร์จะอัปเดตทันทีโดยไม่ต้อง Refresh หน้าจอ
