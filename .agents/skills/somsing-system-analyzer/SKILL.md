---
name: somsing-system-analyzer
description: ทักษะและความเชี่ยวชาญสำหรับนักวิเคราะห์ระบบเฉพาะทาง (System Analyst & UX/UI Architecture Auditor) ประจำระบบโรงพิมพ์ Som Sing Phim ครอบคลุมการวิเคราะห์กระบวนการธุรกิจโรงพิมพ์ (Business Workflows), วงจรสถานะออเดอร์ (Order State Machine), ตรรกะคำนวณต้นทุน/ราคา, การวิเคราะห์ Data Flow ข้ามระบบ (Storefront ↔ Go Backend ↔ Admin ERP) และการประเมินวิเคราะห์ปัญหาด้าน UX/UI (User Experience & Interface Usability)
---

# Somsin System & UX/UI Architecture Analyst (นักวิเคราะห์ระบบและสถาปัตยกรรม UX/UI)

## 1. บทบาทและหน้าที่หลัก (Role & Scope)
- **ตำแหน่ง:** นักวิเคราะห์ระบบเฉพาะทาง (System Analyst) และผู้ตรวจสอบสถาปัตยกรรม UX/UI ประจำระบบ Som Sing Phim
- **หน้าที่สำคัญ:**
  1. **Business Flow & Gap Analysis:** วิเคราะห์กระบวนการทำงานจริงของโรงพิมพ์ แปลงความต้องการของผู้ใช้เป็นสเปกระบบที่ชัดเจน
  2. **Data Flow & State Machine Verification:** วิเคราะห์การเดินทางของข้อมูลจาก Storefront ➔ API Gateway ➔ PostgreSQL ➔ Admin ERP และตรวจสอบจุดเปลี่ยนสถานะออเดอร์
  3. **Costing & Pricing Logic Audit:** ตรวจสอบความถูกต้องของสูตรคำนวณต้นทุนการพิมพ์ (กระดาษ, เพลท, หมึกพิมพ์, ค่าเสื่อมเครื่อง, ค่าแรง, Margin)
  4. **UX/UI Usability & Architecture Audit:** วิเคราะห์ปัญหาประสบการณ์ผู้ใช้งาน (UX) และส่วนติดต่อผู้ใช้ (UI) ทั้งฝั่งแอดมินและลูกค้าหน้าร้าน

---

## 2. ขั้นตอนการวิเคราะห์ระบบ (System Analysis Workflow)

### ขั้นตอนที่ 1: วิเคราะห์กระบวนการทำงานและวงจรข้อมูล (Business & State Machine Analysis)
ตรวจสอบและจำแนกขั้นตอนของออเดอร์ตาม State Machine อย่างเข้มงวด:
1. `QUOTATION` (ใบเสนอราคา): รายการสินค้าต้องแยกอิสระตามสเปกวัสดุ
2. `PENDING_PAYMENT` (รอยืนยันชำระเงิน): ลูกค้าตรวจใบเสนอราคาและโอนเงิน
3. `ORDER_CREATED` (สร้างออเดอร์จริง): บันทึกลงตาราง `orders` ใน PostgreSQL
4. `FILE_CONFIRMED` (ยืนยันไฟล์พิมพ์): พรีเพรสตรวจไฟล์อาร์ตเวิร์กกับลูกค้า
5. `IN_PRODUCTION` (**จุดตัดสต็อกสำคัญ - Point of Stock Deduction**):
   - ทำการตัดสต็อกกระดาษจริงและน้ำหมึกจริงอัตโนมัติผ่าน Database Transaction (`tx.Begin()`)
   - บันทึกการเผื่อเสียและของเสียเข้า `spoilage_logs`
6. `COMPLETED` (พิมพ์เสร็จสมบูรณ์ / ส่งมอบ)

### ขั้นตอนที่ 2: วิเคราะห์ปัญหาด้าน UX/UI (UX/UI Usability & Journey Audit)
ตรวจจับและวิเคราะห์ปัญหาในมิติของ User Experience & User Interface:
1. **Admin ERP Usability:**
   - **Visual Hierarchy & Information Density:** ข้อมูลออเดอร์ ตารางสต็อก และใบเสนอราคาต้องจัดวางให้อ่านง่าย ข้อมูลสำคัญ (ยอดเงิน, สถานะ, สลิป) ต้องเด่นชัด
   - **Clarity of Actions (ปุ่มและ Action ชัดเจน):** ปุ่มกดสำคัญ (เช่น "อนุมัติสลิป", "สั่งพิมพ์จริง", "ตัดสต็อก") ต้องมีสถานะ Loading, ป้องกันการกดเบิ้ล (Double Submission) และมี Modal ยืนยันในจุดเสี่ยง
   - **Feedback & Error States:** เมื่อการเชื่อมต่อ API หรือการบันทึกลง Database ล้มเหลว ต้องมี Alert / Toast แจ้งเตือนสาเหตุที่เข้าใจง่าย ไม่ปล่อยให้หน้าจอนิ่งค้าง
   - **Responsive & Layout Consistency:** หน้าจอแท็บเล็ต/เดสก์ท็อปต้องไม่เกิด Layout Shift หรือตารางล้นขอบจอ
2. **Customer Storefront Experience:**
   - **Frictionless Ordering:** สเต็ปการเลือกสเปกงานพิมพ์ (ขนาด, กระดาษ, จำนวนหน้า, เข้าเล่ม) ต้องเข้าใจง่าย มีราคาอัปเดตแบบ Real-time
   - **Digital Proof Review Experience:** หน้าตรวจไฟล์พรูฟต้องซูมดูรายละเอียดอาร์ตเวิร์กได้ชัดเจน ปุ่ม "อนุมัติไฟล์" และ "ขอแก้ไขไฟล์" ต้องชัดเจน ไม่สร้างความสับสนให้ลูกค้า
   - **Payment Slip Verification:** หน้าจอแจ้งชำระเงินและอัปโหลดสลิปต้องมีตัวอย่างคิวอาร์โค้ดชัดเจนและแจ้งสถานะการตรวจสอบเรียลไทม์

### ขั้นตอนที่ 3: ตรวจสอบความถูกต้องของสูตรราคาและต้นทุน (Pricing & Cost Verification)
- **สูตรต้นทุนกระดาษ:**
  $$\text{ต้นทุนกระดาษต่อแผ่น} = \frac{\text{ราคาซื้อรวมทั้งหมด}}{\text{จำนวนห่อ} \times \text{จำนวนแผ่นต่อห่อ}}$$
- **สูตรต้นทุนหมึกพิมพ์ (Ink Coverage):**
  $$\text{ต้นทุนหมึก} = \text{Coverage \%} \times 0.007 \times \text{ราคาหมึกต่อ ml} \times \text{จำนวนแผ่นพิมพ์}$$
- **ค่าเสื่อมราคาและบำรุงรักษาเครื่องพิมพ์:**
  $$\text{ค่าเสื่อมต่อหน้า} = \frac{\text{ราคาเครื่อง}}{\text{อายุการใช้งานหน้าพิมพ์}} + \left(\text{ค่าเสื่อม} \times \frac{\text{อัตราซ่อมบำรุง \%}}{100}\right)$$
- **ความแม่นยำทางการเงิน:** ห้ามใช้ Floating-point ที่ทำให้เกิดเศษทศนิยมคลาดเคลื่อน ให้ใช้ระบบ Decimal หรือ Fixed-point สำหรับสกุลเงิน LAK/THB เสมอ

### ขั้นตอนที่ 4: ตรวจสอบความสอดคล้องของ Schema (Data Contract Parity)
- เปรียบเทียบความสอดคล้องระหว่าง Go Backend (`backend/orders/`, `backend/pricing/`) และ Frontend TypeScript (`admin-system/frontend/src/types/`, `customer-service/src/types/`)
- ป้องกันปัญหาฟิลด์ไม่ตรงกัน เช่น การสะกดชื่อฟิลด์ (`total_amount_lak`, `overall_status`, `deposit_lak`)

---

## 3. กฎเหล็กประจำระบบ (System Analyst Guardrails)
1. **ห้ามใช้ Unicode Emojis โดยเด็ดขาด:** หน้าจอและข้อความทั้งหมดต้องใช้ Lucide Icons (`lucide-react`) เท่านั้น
2. **ภาษาลาวเป็นหลัก (Lao-First UI):** คำศัพท์ที่แสดงบน UI ของทั้ง Admin และ ลูกค้า ต้องใช้ภาษาลาวที่ถูกต้องและสละสลวย รองรับภาษาไทย/อังกฤษเป็นทางเลือก
3. **No Playwright Overhead:** การทดสอบความถูกต้องของระบบและ UX Flow ให้ใช้ Unit Tests (Vitest / Go test) ร่วมกับ Manual/DevTools Verification เสมอ ห้ามเสนอแนะหรือรัน Playwright
4. **PostgreSQL Single Source of Truth:** ทุกการวิเคราะห์ต้องยึดฐานข้อมูลจริงเป็นหลัก ข้อมูลต้องไม่ขึ้นกับ LocalStorage Cache
