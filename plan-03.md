# 📋 Task Plan: Typography (Option 2), Strict EN/LO Localization & Backend Integration

เอกสารคำสั่งงานสำหรับ Google Antigravity เพื่อดำเนินการตั้งค่าระบบฟอนต์สไตล์โมเดิร์น (Option 2: Plus Jakarta Sans + Noto Sans Lao), กวาดล้างข้อความให้อยู่ในระบบสองภาษา (English & Lao) 100%, เชื่อมโยง Pricing API, และปรับปรุงสถาปัตยกรรมระบบตามหลัก Clean Architecture

---

## 🎨 สเปคฟอนต์และการจัดวาง Typography (Option 2: Modern Look)
* **ภาษาอังกฤษ (UI / Body):** `Plus Jakarta Sans` (น้ำหนัก 400, 500, 600, 700)
* **ภาษาลาว (UI / Body):** `Noto Sans Lao` (น้ำหนัก 400, 500, 600, 700)
* **ตัวเลขและตารางราคา/สเปค (Tabular Numbers):** `JetBrains Mono` หรือ `Plus Jakarta Sans` พร้อมเปิด `tabular-nums`
* **Line-height มาตรฐาน:** ขั้นต่ำ `1.6` เพื่อรองรับสระบน-ล่างและวรรณยุกต์ภาษาลาว

---

## 🚦 กฎการทำงานแบบ Strict Execution
- 🛑 **ห้ามข้ามขั้นตอน (Strict Sequential Execution):** ดำเนินการเรียงตามลำดับ Phase 1 $\rightarrow$ Phase 2 $\rightarrow$ Phase 3 $\rightarrow$ Phase 4
- 🛑 **หยุดรอคำสั่ง (Pause & Confirm):** เมื่อจบงานในแต่ละ Phase ให้ขึ้นสถานะ `🛑 [WAIT FOR USER APPROVAL]` และหยุดรอคำสั่งจากผู้ใช้ก่อนเริ่มเฟสถัดไป
- 🛑 **รายงานผลการเปลี่ยนแปลง (Progress Report):** สรุปรายการไฟล์ที่สร้าง แก้ไข หรือลบ พร้อมผลการรัน Typecheck/Test ทุกครั้ง

---

## 📌 ลำดับขั้นตอนการดำเนินงาน (Phased Plan)

### 🔹 Phase 1: Typography Setup & Strict EN/LO Localization
**เป้าหมาย:** ติดตั้ง Font Stack ตัวเลือกที่ 2 และจัดระเบียบระบบภาษาให้เหลือเฉพาะ `en` และ `lo` 100%
1. **ติดตั้ง Google Fonts ใน `admin-system/frontend/index.html`:**
   - โหลด `Plus Jakarta Sans`, `Noto Sans Lao`, และ `JetBrains Mono`
2. **ตั้งค่า Font Family และ Base CSS:**
   - กำหนด Font Family ใน `tailwind.config.js` (หรือ `src/index.css`)
   ```css
   body {
     font-family: 'Plus Jakarta Sans', 'Noto Sans Lao', sans-serif;
     line-height: 1.6;
   }
   .tabular-numbers {
     font-variant-numeric: tabular-nums;
     font-family: 'JetBrains Mono', 'Plus Jakarta Sans', monospace;
   }