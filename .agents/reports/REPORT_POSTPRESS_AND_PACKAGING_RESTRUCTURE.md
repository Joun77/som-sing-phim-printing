# Report: ปรับปรุงโครงสร้างสเปกหลังพิมพ์ (Post-Press) และย้ายโมดูลบรรจุภัณฑ์ (Packaging & Box) ไปสเตปที่ 3

## 1. ข้อมูลสรุปการดำเนินงาน (Execution Summary)
- **วันที่ดำเนินการ:** 12 กันยายน 2026
- **สถานะ:** เสร็จสมบูรณ์ (Completed & Verified 100%)
- **โมดูลที่เกี่ยวข้อง:** Pricing Engine, Quotation Studio (Step 2 & Step 3), Post-Press Machinery, Packaging & Logistics

---

## 2. ปัญหาและสิ่งที่ได้รับการแก้ไข (Resolved Issues)

### 1) ปรับปรุง UX ข้อ 5 (งานหลังพิมพ์และเครื่องจักร):
- **คงรูปแบบ Enhanced Checkbox Card:** เพราะ 1 ชิ้นงานพิมพ์สามารถผ่านเครื่องจักรหลังพิมพ์ได้หลายเครื่องพร้อมกัน (Multi-select)
- **เพิ่มตัวกรองหมวดหมู่เครื่องจักร (Category Filter Tabs):**
  - `ທັງໝົດ (All)`
  - `ຕັດ/ຊອຍ (Cutting)`
  - `ພັບ/ເສັ້ນພັບ (Folding/Creasing)`
  - `ເຄືອບ (Laminating)`
  - `ເຂົ້າເຫຼັ້ມ (Binding)`
  ช่วยให้ Operator ค้นหาและเลือกเครื่องจักรได้รวดเร็วเมื่อฐานข้อมูลเครื่องจักรมีจำนวนมาก

### 2) แก้ไขปัญหาค่าตัดซอย Guillotine 10,000 LAK:
- **สาเหตุเดิม:** แบนเนอร์สีส้ม `ຄ່າຕັດຊອຍດ້ວຍເຄື່ອງ Guillotine (Flat Setup Fee): ຕັດແຍກຂະໜາດຕາມມາດຕະຖານ 10,000 LAK` ถูก Hardcoded แสดงผลค้างตลอดเวลา แม้งานจะเป็นหนังสือ A4 ปกติ
- **การแก้ไข:**
  - นำแบนเนอร์ Hardcoded ออก
  - ผสานเข้าเป็น **ตัวเลือกเสริม (Optional Controllable Setup Fee)** ภายใต้ข้อ 5
  - มีสวิตช์เปิด-ปิดชัดเจน (`requiresGuillotineCut`) ไม่ถูกบังคับคิดเงิน 10,000 LAK อัตโนมัติอีกต่อไป

### 3) ย้ายโมดูลบรรจุภัณฑ์และการหุ้มห่อ (ข้อ 7) ไปสเตปที่ 3:
- **สเตป 2 (Itemized Spec Studio):**
  - ตัด Section 7 ออกจาก `QuotationPostPressTab.tsx`
  - สเตป 2 จบสมบูรณ์ที่ข้อ 6 (Consumables)
  - กล่องสรุปต้นทุนท้ายสเตป 2 (4 ฟังก์ชัน: Paper, Print Engine, Post-Press, Consumables) สะท้อนต้นทุนการผลิตตรง 100%
- **สเตป 3 (Summary & Official Quotation):**
  - อัปเกรด Card 2 (`ກ່ອງບັນຈຸພັນ & ຂົນສົ່ງ`) ให้มี **Packaging Presets ครบชุด**:
    - กล่องนามบัตรอะคริลิก (3,500 LAK / 100 ใบ)
    - ห่อกระดาษคราฟท์ / ซอง (2,000 LAK / 500 แผ่น)
    - กล่องลังลูกฟูก (8,000 LAK / 1,000 แผ่น)
    - บับเบิ้ลกันกระแทก (5,000 LAK / ม้วน)
  - มี Master Toggle Switch (ເປີດໃຊ້ / ປິດ) สำหรับโมดูลบรรจุภัณฑ์และขนส่ง
  - มีช่องกรอก Custom Packaging Cost และ Courier Fee พร้อมปุ่มลัด
  - ตัวเลขคำนวณสดและผสานเข้า `grandNetCost` และราคาขายรวมเรียลไทม์

---

## 3. ผลการตรวจสอบคุณภาพ (QA Verification Results)
- **Frontend Build (`vite build`):** สำเร็จ (dist bundle generated with 0 errors)
- **Frontend Unit Tests (Vitest):** ผ่าน 29/29 tests
- **Backend Tests (`go test ./...`):** ผ่าน 100%
