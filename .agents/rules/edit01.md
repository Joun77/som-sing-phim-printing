---
trigger: manual
---

# Som-Sing-Phim Printing - Master System Specification & Implementation Guide

เอกสารฉบับนี้ใช้เป็นพิมพ์เขียว (Blueprint) สำหรับการพัฒนาและปรับปรุงระบบโรงพิมพ์ขนาดเล็ก `som-sing-phim-printing` โดยครอบคลุมทั้งระบบหลังบ้าน (Admin Dashboard: `somsingphim`), หน้าบ้าน (POS / Spec Configurator), และ Pricing Engine

---

## 1. System Architecture & Navigation
- **Frontend หน้าบ้าน (Customer / Front-End POS):** 
  - หน้าจอเลือกสเปกงานพิมพ์ คำนวณราคาเรียลไทม์ (ItemSpecConfigurator)
  - รองรับการปรับ % Coverage ของหมึกดำ (K) และหมึกสี (CMY)
  - คำนวณกระดาษ (A3, A4, A5) รวม % เผื่อเสีย (Waste Rate)
  - คำนวณงานแปรรูป/หลังพิมพ์แบบ Custom (FIXED_JOB, PER_UNIT, PER_SQM)
- **Frontend หลังบ้าน (Admin Dashboard: `somsingphim`):**
  - มีปุ่มสลับ/ทางเข้าหน้า Admin ชัดเจนจากหน้าหลัก
  - จัดการคลังวัตถุดิบ (Inventory / Offcuts)
  - ตั้งค่าเครื่องพิมพ์ (Printer Master Data) เช่น ราคาเครื่อง (Machine Price) และอายุแผ่นพิมพ์ตั้งเป้า (Target Total Pages)
  - ดูรายการคำสั่งซื้อ (Orders) และออกเอกสารใบเสนอราคา PDF (`pdf.go`)

---

## 2. Professional Pricing Formula & Logic

### A. กระดาษและเปอร์เซ็นต์เผื่อเสีย (Paper Cost)
$$\text{จำนวนแผ่นใหญ่ที่ต้องเบิก} = \left\lceil \frac{\text{จำนวนงานที่ต้องการ}}{\text{จำนวนชิ้นที่ตัดได้ต่อแผ่นใหญ่}} \times (1 + \% \text{Waste Rate}) \right\rceil$$
$$\text{ต้นทุนกระดาษรวม} = \text{จำนวนแผ่นใหญ่ที่เบิก} \times \text{ราคาต่อแผ่นใหญ่ในสต็อก}$$

### B. หมึกพิมพ์แยกดำ/สี (K & CMY Ink Cost)
อิงตามมาตรฐานสากล ISO/IEC 5% Coverage เป็นฐาน:
$$\text{Actual Black Cost} = \left( \frac{\text{Price}_{\text{Black Set}}}{\text{Yield}_{\text{Black 5\%}}} \right) \times \left( \frac{\text{Coverage}_{\text{K \%}}}{5\%} \right) \times \text{Quantity}$$
$$\text{Actual Color Cost} = \left( \frac{\text{Price}_{\text{Color Set (CMY)}}}{\text{Yield}_{\text{Color 5\%}}} \right) \times \left( \frac{\text{Coverage}_{\text{CMY \%}}}{5\%} \right) \times \text{Quantity}$$

### C. ค่าเสื่อมเครื่องจักรและค่าบำรุงรักษา (Depreciation & Maintenance)
$$\text{Machine Depreciation} = \left( \frac{\text{Machine Price}}{\text{Target Total Pages}} \right) \times \text{Quantity}$$
$$\text{Maintenance Cost} = \text{Maintenance Cost Per Page} \times \text{Quantity}$$

### D. งานหลังพิมพ์แบบ Custom Finishing (3 Models)
- `FIXED_JOB`: คิดราคาเหมาครั้งเดียวต่อ Job
- `PER_UNIT`: คิดราคาต่อชิ้น/แผ่น × จำนวนชิ้น
- `PER_SQM`: คิดราคาตามพื้นที่ตารางเมตร $(\text{Width} \times \text{Height}) \times \text{Rate} \times \text{Quantity}$

### E. โสหุ้ยและราคาขาย (Overhead & Target Margin)
$$\text{Total Direct Cost} = \text{Paper} + \text{Black Ink} + \text{Color Ink} + \text{Depreciation} + \text{Maintenance} + \text{Custom Finishing}$$
$$\text{Total Cost with Overhead} = \text{Total Direct Cost} \times (1 + \text{Overhead Percent})$$
$$\text{Final Selling Price} = \frac{\text{Total Cost with Overhead}}{1.0 - \text{Target Margin Percent}}$$

*Safety Rules:*
- **Fallback Defaults:** หากไม่มีการส่งค่า `OverheadPercent` มา ให้ใช้ค่าเริ่มต้น `15%` (`0.15`) และหากไม่มี Coverage สี ให้ปัดเป็น `0%`
- **Margin Protection Guard:** ค่า `TargetMarginPercent` จะต้องถูกจำกัดค่าสูงสุดไม่ให้เกิน `0.99` (99%) เพื่อป้องกันปัญหาการหารด้วยศูนย์หรือติดลบ