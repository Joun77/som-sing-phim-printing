# 🛠️ Task Plan: Fix Cost Breakdown Discrepancy & Upgrade Quotation Customer Dynamic Flow

เอกสารคำสั่งงานสำหรับ Google Antigravity เพื่อแก้ไขปัญหาความไม่สอดคล้องกันของการคำนวณราคาใน ItemSpecConfigurator และยกระดับระบบค้นหา/กรอกข้อมูลลูกค้าในหน้าใบเสนอราคา

---

## 🎯 1. แก้ไข Logic การคำนวณใน `ItemSpecConfigurator.tsx` และ Sidebar
**เป้าหมาย:** จัดระบบตัวเลขให้สอดคล้องกันระหว่างฟอร์มด้านซ้ายและแถบ Breakdown ด้านขวา

1. **กำหนดมาตรฐานการแสดงผลตัวเลข (Unified Cost Standard):**
   - **Unit Level (ต่อ 1 แผ่น/ชิ้น):**
     - `unit_paper_cost` = Total Paper Cost / Quantity
     - `unit_ink_cost` = Total Ink Cost / Quantity
     - `unit_machine_cost` = Total Machine Cost / Quantity
   - **Total Level (ทั้งคำสั่งซื้อ):**
     - `total_paper_cost` = unit_paper_cost * Quantity
     - `total_ink_cost` = unit_ink_cost * Quantity
     - `total_machine_cost` = unit_machine_cost * Quantity
     - `total_direct_cost` = total_paper_cost + total_ink_cost + total_machine_cost + setup_cost + finishing_cost
2. **ปรับแต่ง Sidebar `Direct Item Cost Breakdown`:**
   - แสดงตัวเลขให้ชัดเจนว่าเป็นยอดรวมทั้ง Job (หรือเพิ่ม Switch ให้ผู้ใช้เลือกดูแบบ "ຕໍ່ 1 ແຜ່ນ (Per Unit)" หรือ "ລວມທັງໝົດ (Total Batch)")
   - ปรับสูตร Overhead (15%) ให้คำนวณจาก `total_direct_cost`
   - แก้ไขการส่งค่ากลับไปยังหน้า `CreateOrderWizard` ให้ `Subtotal` ตรงกับ `Selling Price` ที่แสดงใน Sidebar เสมอ (121,683 LAK)

---

## 🎯 2. อัปเกรดระบบเลือกลูกค้าใน `Quotation Desk` & `Create Order Wizard`
**เป้าหมาย:** รองรับการค้นหาลูกค้าเดิม และพิมพ์ชื่อลูกค้าใหม่ได้อิสระ

1. **สร้าง Dynamic Customer Combobox Component:**
   - ค้นหาด้วยชื่อ หรือ เบอร์โทรศัพท์
   - หากไม่พบในระบบ ให้แสดงปุ่ม: `+ ໃຊ້ຊື່ນີ້: "[ຊື່ທີ່ພິມ]" (ລູກຄ້າໃໝ່)`
   - มีปุ่ม Toggle: `☑️ ບັນທຶກເຂົ້າຖານຂໍ້ມູນ CRM ອັດຕະໂນມັດ`
2. **เชื่อมโยงการแสดงผลใน Preview ใบเสนอราคา (Client Quote Paper):**
   - อัปเดตช่อง "ອອກໃຫ້ແກ່ (Issued To)" ในกระดาษพรีวิวฝั่งขวาให้เปลี่ยนตามชื่อที่กรอก/เลือกแบบ Real-time 100%

---

## 🚦 Verification Checklist
- [ ] กรอกสเปคกระดาษ 525 แผ่น $\rightarrow$ ตรวจสอบว่ายอด Step 1 Paper Cost สอดคล้องกับหัวข้อที่ 1 ใน Sidebar
- [ ] ตรวจสอบว่า `Subtotal` ในหน้า Wizard ตรงกับ `Item Sale Price` ใน Configurator
- [ ] ทดสอบพิมพ์ชื่อลูกค้าใหม่ใน Quotation Desk แล้วตรวจดูการอัปเดตบนหน้ากระดาษ Preview