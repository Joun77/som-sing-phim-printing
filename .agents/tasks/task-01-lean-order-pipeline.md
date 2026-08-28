# Task 01: Lean Order Pipeline & 1-Click Status Flow

## 1. AI Role Definition
* **Role:** Senior Full-Stack Print ERP Engineer & UI/UX Specialist
* **Mission:** ปรับปรุงขั้นตอนการจัดการออเดอร์ให้เป็นแบบ **"หน้าจอเดียวจบ (Single Screen Fast-Track)"** เหมาะสำหรับเจ้าของร้านที่ทำงานคนเดียว สามารถกดดูสเปก, ดาวน์โหลดไฟล์งานพิมพ์, ตัดสต็อกอัตโนมัติ, และเปลี่ยนสถานะออเดอร์ได้ในคลิกเดียวโดยไม่ต้องใช้หลายขั้นตอนหรือสแกนมือถือ

---

## 2. ขอบเขตงานที่ต้องทำ (Scope of Work)
1. **Quick Action Controls ในตารางออเดอร์:**
   - เพิ่มปุ่ม Action ด่วนในแต่ละแถวออเดอร์: `[ດາວໂຫຼດຟາຍ (Download File)]`, `[ສັ່ງພິມ & ຕັດສະຕັອກ (Print & Deduct Stock)]`, `[ພ້ອມສົ່ງ (Ready to Ship)]`
2. **One-Click Stock Deduction:**
   - เมื่อกดปุ่ม "ສັ່ງພິມ (Print)" ให้เรียกตัดสต็อกกระดาษและน้ำหมึกของออเดอร์นั้นทันที พร้อมแจ้งเตือน Toast ยืนยันยอดที่ตัด
3. **Download All Artwork Assets:**
   - มีปุ่มดาวน์โหลดไฟล์อาร์ตเวิร์กของลูกค้าทุกชิ้นในออเดอร์นั้นทันทีในคลิกเดียว
4. **Quick Tracking Number Entry:**
   - ฟิลด์กรอกเลขพัสดุ (Tracking No.) และเลือกขนส่ง (Anousith, Hal, Flash, J&T) ได้โดยตรงจากหน้าสรุปออเดอร์

---

## 3. สิ่งที่ห้ามทำเด็ดขาด (Strict Restrictions)
* ❌ **ห้ามใช้อีโมจิในโค้ดและ UI เด็ดขาด** (ให้ใช้ Lucide Icons เช่น `<Printer />`, `<Download />`, `<Truck />`, `<CheckCircle />` เท่านั้น)
* ❌ **ห้ามใช้ภาษาไทยใน UI** (ข้อความปุ่ม ป้ายสถานะ และ Toast ต้องเป็น **ภาษาลาว** ทั้งหมด)
* ❌ **ห้ามลบ State Machine เดิม** (ลำดับสถานะ Quotation ➔ Pending Payment ➔ In Production ➔ Completed ยังต้องทำงานถูกต้องตามกฎ [admin-architecture-guard.md](file:///.agents/rules/admin-architecture-guard.md))
* ❌ **ห้ามตัดสต็อกซ้ำ** (ต้องมี Flag ป้องกันไม่ให้ตัดสต็อกซ้ำหากออเดอร์อยู่ในสถานะ `IN_PRODUCTION` อยู่แล้ว)

---

## 4. สิ่งที่แก้ไขได้และไฟล์เป้าหมาย (Permitted Scope & Target Files)
* [MODIFY] `admin-system/frontend/src/features/orders/components/OrderTable.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/OrderManagement.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/details/OrderDetailsModal.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/types.ts`
* [MODIFY] `admin-system/frontend/src/store/AppContext.tsx` (เฉพาะฟังก์ชัน State Transition & Stock Deduction)

---

## 5. เกณฑ์การตรวจรับงาน (Acceptance Criteria)
1. เจ้าของร้านสามารถกดสั่งพิมพ์ออเดอร์ได้ในคลิกเดียว และระบบตัดสต็อกกระดาษ/หมึกถูกต้อง
2. สามารถดาวน์โหลดไฟล์พิมพ์ของออเดอร์ได้ทันที
3. ข้อความทั้งหมดในหน้านี้เป็นภาษาลาว 100% และไม่มีอีโมจิหลงเหลือ
4. `npm run dev` รันผ่าน ไม่มี Error หรือ Type Mismatch
