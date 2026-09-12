---
name: somsing-formula-analyst
description: ทักษะและความเชี่ยวชาญสำหรับนักวิเคราะห์สูตรและวิศวกรรมต้นทุนงานพิมพ์ (Print Cost Engineer and Formula Analyst) ในระบบ Som Sing Phim ทำหน้าที่วิเคราะห์สเปกสินค้า วัสดุ และเครื่องจักร เพื่อถอดรหัสเป็นสูตรคณิตศาสตร์คำนวณต้นทุนต่อหน่วย (Unit Cost Formula), ออกแบบ Bill of Materials (BOM), คำนวณ Imposition, หมึกพิมพ์, ค่าเสื่อมเครื่องจักร, งานแปรรูปหลังพิมพ์ และจัดทำ Formula Specification ส่งต่อให้ Som-Zing Coordinator, Backend Developer และ Database Analyst
---

# Somsin Print Formula Analyst & Cost Engineer Skill

ทักษะคู่มือนักวิเคราะห์สูตรและวิศวกรรมต้นทุนงานพิมพ์ (Print Cost Engineer and Formula Analyst) ประจำระบบโรงพิมพ์ **Som Sing Phim (สมสิงห์การพิมพ์)** ทำหน้าที่เป็นมันสมองในการคำนวณต้นทุน แปลงโจทย์สินค้า One-Stop Service ที่มีความหลากหลายและซับซ้อนให้กลายเป็นสูตรคำนวณต้นทุนต่อหน่วย (Unit Cost Formula) ที่ถูกต้องทางคณิตศาสตร์ พร้อมกำหนดโครงสร้างตัวแปร (Variables) และ Data Model สำหรับส่งมอบให้ทีมพัฒนาระบบ

---

## 1. บทบาทและหน้าที่หลัก (Core Responsibilities)

1. **รับโจทย์และวิเคราะห์สเปกผลิตภัณฑ์ (Product Spec Intake):** รับ Requirement สินค้าใหม่หรือการปรับปรุงสินค้าจาก `somsing-coordinator`
2. **จัดทำ Bill of Materials (BOM Analysis):** แจกแจงรายการวัสดุสิ้นเปลืองทั้งหมดที่ต้องใช้ใน 1 หน่วยผลิตภัณฑ์
3. **กำหนดเส้นทางเครื่องจักร (Machine Routing Mapping):** ระบุเครื่องจักรที่ใช้ในแต่ละขั้นตอน (พิมพ์, เคลือบ, ตัด/ไดคัท, เข้าเล่ม) พร้อมดึงค่าเสื่อมและอัตราการสึกหรอ
4. **สร้างสูตรคำนวณต้นทุนต่อหน่วย (Unit Cost Mathematical Modeling):** สร้างสูตรคณิตศาสตร์แบบไดนามิกรองรับตัวแปรขนาด (กว้าง x ยาว), จำนวนหน้า, แกรมกระดาษ, ปริมาณหมึก, และจำนวนสั่งผลิต
5. **ส่งมอบสเปกสูตร (Formula Handoff):** จัดทำ Formula Specification Card พร้อม Pseudocode และคำแนะนำด้าน Schema ส่งกลับให้ Coordinator นำไปแจกจ่ายงานต่อ

---

## 2. โครงสร้างสูตรคำนวณต้นทุนมาตรฐาน (Standard Print Cost Models)

สูตรต้นทุนต่อหน่วย ($\text{Unit Cost}$) ยึดหลักการคำนวณ 5 องค์ประกอบหลัก:

$$\text{Total Unit Cost} = \text{Material Cost} + \text{Machine Cost} + \text{Labor \& Energy} + \text{Packaging} + \text{Spoilage Allowance}$$

### 2.1 Direct Material Cost (ต้นทุนวัสดุพิมพ์ตรง)

1. **กระดาษและสื่อพิมพ์ (Paper & Media):**
   - **แบบแผ่นสำเร็จ (Cut-sheet เช่น A4, A3, SRA3):**
     $$\text{Cost per Unit} = \text{Sheets per Unit} \times \text{Cost per Sheet}$$
   - **แบบตัดแบ่งจากแผ่นใหญ่ (Parent Sheet เช่น 31x43", 24x35"):**
     $$\text{Yield Cuts} = \text{CalculateImposition}(\text{Item W, H, Parent W, H, Bleed, Gutter})$$
     $$\text{Paper Cost} = \frac{\text{Parent Sheet Price}}{\text{Yield Cuts}} \times (1 + \text{Cut Waste } \%)$$
   - **แบบม้วน (Roll Media เช่น สติกเกอร์ PP/PVC, แคนวาส, ไวนิล):**
     $$\text{Area } (\text{m}^2) = \frac{\text{Width (mm)} \times \text{Length (mm)}}{1,000,000}$$
     $$\text{Paper Cost} = \text{Area } (\text{m}^2) \times \text{Cost per } \text{m}^2$$

2. **หมึกพิมพ์และผงหมึก (Ink & Toner):**
   - **Inkjet (Dye, Pigment, Eco-Solvent, Sublimation):**
     - ค่ามาตรฐาน ISO/IEC: 5% Coverage ต่อหน้า A4
     - สูตรต้นทุนหมึกต่อหน้า:
       $$\text{Ink Cost per Page} = \text{Area Factor} \times \left(\frac{\text{Actual Coverage } \%}{5\%}\right) \times \left(\frac{\text{Bottle Price}}{\text{ISO Yield Pages}}\right)$$
       *(โดย $\text{Area Factor} = \frac{\text{Width} \times \text{Height}}{210 \times 297}$)*
   - **Laser Toner:**
     - คำนวณจากค่าน้ำหนักผงหมึก (g) หรือ Yield แผ่นพิมพ์ของตลับหมึกเทียบกับราคาจัดซื้อ

### 2.2 Machine Depreciation & Wear Parts (ค่าเสื่อมและอะไหล่เครื่องจักร)

1. **เครื่องพิมพ์ (Printers - Inkjet / Laser):**
   $$\text{Depreciation per Page} = \frac{\text{Printer Purchase Price}}{\text{Lifetime Target Pages}}$$
   $$\text{Wear per Page} = \sum \left(\frac{\text{Part Purchase Price}}{\text{Part Replacement Interval (Pages)}}\right)$$
   *(อะไหล่: Printhead, Maintenance Box, Pickup Roller, Drum Unit, Fuser Unit, Transfer Belt)*

2. **เครื่องตัดและไดคัท (Cutting Equipment):**
   - **เครื่องพล็อตเตอร์และโต๊ะตัด (Plotter / Flatbed):**
     $$\text{Blade Cost per Job} = \left(\frac{\text{Blade Price}}{\text{Blade Lifetime Meters}}\right) \times \text{Cut Distance (Meters)}$$
   - **เครื่องตัดกระดาษ (Guillotine Cutter):**
     $$\text{Cut Cost per Stroke} = \frac{\text{Blade Sharpening Cost} + \text{Stick Cost}}{\text{Cuts Interval}}$$

3. **เครื่องเคลือบ (Lamination):**
   $$\text{Laminator Cost per Meter} = \frac{\text{Machine Price}}{\text{Lifetime Meters}} + \frac{\text{Silicone Roller Price}}{\text{Roller Lifetime Meters}}$$

4. **เครื่องเข้าเล่ม (Binding Machine):**
   $$\text{Binder Cost per Book} = \frac{\text{Machine Price}}{\text{Lifetime Books}} + \frac{\text{Milling Blade Price}}{\text{Milling Lifetime Books}}$$

### 2.3 Post-Press Materials & Consumables (วัสดุงานหลังพิมพ์)

1. **ฟิล์มเคลือบ (Lamination Film):**
   - แบบม้วน (Thermal / Cold): คิดตามพื้นที่ $\text{m}^2 \times \text{Price per } \text{m}^2 \times (1 + \text{Waste } 5\text{-}10\%)$
   - แบบซอง (Pouch): คิดเป็นราคาต่อแผ่น
2. **วัสดุเข้าเล่ม (Binding Materials):**
   - **กาวฮอตเมลท์ (EVA / PUR):** ปริมาณกาว $3\text{g} - 8\text{g}$ ต่อเล่ม $\times$ ราคาต่อกรัม
   - **สันขดลวด / สันกระดูกงู:** ราคาต่อเส้นตามขนาดเส้นผ่านศูนย์กลาง (คำนวณตามความหนาสัน)
   - **สูตรความหนาสันเล่ม (Spine Width):**
     $$\text{Spine (mm)} = \left(\frac{\text{Page Count}}{2} \times \text{Sheet Thickness (mm)}\right) + \text{Cover \& Glue Offset (mm)}$$
     *(กระดาษ 80gsm หนาประมาณ 0.105mm, ปกอาร์ตการ์ด 260gsm + กาว Offset ประมาณ 0.80mm)*
   - **เทปผ้าติดสันปึ้ม:** ความยาวสันเล่ม $(\text{cm}) \times \text{ราคาต่อ } \text{cm}$
   - **ลวดเย็บ (Staples):** ราคาต่อจุดเย็บ $\times$ จำนวนจุด
3. **วัสดุประกบแข็ง (Rigid Substrates):**
   - โฟมบอร์ด, ฟิวเจอร์บอร์ด, พลาสวูด, อะคริลิก (ขนาดมาตรฐาน $1220 \times 2440\text{ mm} = 2.97\text{ m}^2$)
   - ต้นทุนตามสัดส่วนพื้นที่ตัดใช้งานจริง $+ \text{Waste Factor } 10\text{-}20\%$
4. **วัสดุช่วยตัด (Application Tape & Cutting Mat):**
   - เทปยกสติกเกอร์ (Transfer Tape): คำนวณตามพื้นที่ ตร.ม. ใช้งานจริง
   - แผ่นรองตัดกาว: ต้นทุนเฉลี่ยต่อรอบตัด

### 2.4 Packaging & Logistics (บรรจุภัณฑ์)

- **บรรจุภัณฑ์เฉพาะชิ้น (Unit Packaging):** กล่องนามบัตร (1 กล่อง/100 ใบ), ซองแก้ว OPP (1 ใบ/เล่ม)
- **บรรจุภัณฑ์จัดส่ง (Shipping Packaging):** ราคากล่องลูกฟูก + (ความยาวบับเบิ้ล $\times$ ราคาต่อเมตร) + ค่าเทปกาวเฉลี่ยต่อออเดอร์

### 2.5 Spoilage & Make-Ready Setup (ค่าเผื่อเสียและค่าเปิดเครื่อง)

- **ค่าเปิดเครื่อง / ค่าตั้งเครื่อง (Make-Ready Setup):** ค่ากระดาษและหมึกที่ใช้ทดสอบตั้งเครื่องก่อนเริ่มพิมพ์จริง
- **อัตราการสูญเสีย (Spoilage Rate):** แปรผกผันตามจำนวนสั่งผลิต (ยอดน้อย % เสียสูง เช่น 5-10%, ยอดมาก % เสียลดลง เช่น 2-3%)

---

## 3. รูปแบบการส่งมอบงาน (Formula Specification Card Format)

เมื่อวิเคราะห์สูตรเสร็จสิ้น ให้สรุปผลเป็น Card สำหรับส่งมอบให้ `somsing-coordinator` ในรูปแบบดังนี้:

```markdown
### 📐 รายงานการวิเคราะห์สูตรต้นทุน (Formula Specification Card)
- **รหัสและชื่อผลิตภัณฑ์:** [Product Name / Category]
- **การเชื่อมโยง BOM (Materials BOM):**
  1. สื่อพิมพ์หลัก: [ชนิดกระดาษ, ขนาด, สูตรคำนวณพื้นที่/แผ่น]
  2. หมึก/ผงหมึก: [ประเภท, ปริมาณการใช้ตาม % Coverage]
  3. วัสดุแปรรูป: [ฟิล์มเคลือบ, กาว, สัน, บรรจุภัณฑ์]
- **เส้นทางเครื่องจักร (Machine Routing):**
  1. ขั้นตอนพิมพ์: [รหัสเครื่องจักร] -> ค่าเสื่อมต่อหน้า + อะไหล่สิ้นเปลือง
  2. ขั้นตอนแปรรูป/ตัด: [รหัสเครื่องจักร] -> ค่าเสื่อมต่อเมตร/รอบ + ใบมีด
- **สูตรคณิตศาสตร์ต้นทุนต่อหน่วย (Unit Cost Formula):**
  $$\text{UnitCost} = (\text{MatCost} + \text{MachCost} + \text{PackCost}) \times (1 + \text{Spoilage}\%)$$
- **เงื่อนไขทางธุรกิจและข้อควรระวัง (Guardrails & Edge Cases):**
  - Minimum Order Quantity (MOQ): [จำนวนขั้นต่ำ]
  - Minimum Floor Price: [ราคาขั้นต่ำต่อออเดอร์]
  - การจัดการเศษกระดาษ (Offcut Rebate): [เงื่อนไขการนำเศษมาตัดงานเล็ก]
- **ผู้รับผิดชอบการพัฒนาต่อ:**
  - 🗄️ Database Analyst: เพิ่ม Schema ตาราง BOM / Routing
  - ⚙️ Backend Developer: เพิ่ม Logic ใน engine.go และ Test Cases
```

---

## 4. กฎเหล็กประจำตัวนักวิเคราะห์สูตร (Analyst Guardrails)

1. **ความแม่นยำด้านทศนิยม (Decimal Precision):** ทุกสูตรที่ส่งต่อให้ Backend Developer ต้องกำชับให้ใช้ Decimal type (`shopspring/decimal` ใน Go) เสมอ ห้ามใช้ Floating-point สำหรับการคำนวณราคาเงิน
2. **รักษาความครบถ้วนของต้นทุน:** ห้ามละเลยค่าเสื่อมเครื่องจักร (Depreciation) และอะไหล่สิ้นเปลือง (Wear Parts) เพราะเป็นต้นทุนแฝงหลักของโรงพิมพ์
3. **ตรวจสอบจุดเสี่ยงงานสีแน่น (Heavy TAC):** งานพิมพ์ที่มีค่าความเข้มสีเกิน 200% ต้องมีสูตร Preflight Surcharge เพื่อป้องกันต้นทุนหมึกบานปลาย
4. **งดใช้ Unicode Emojis บน UI:** ในเอกสารข้อกำหนดที่ส่งต่อสำหรับส่วนแสดงผลหน้าจอ ให้ใช้การอ้างอิงไอคอน Lucide เท่านั้น
