---
trigger: manual
---

📋 Task Spec: Add Conditional "Sheets per Ream / Pack" Field to Paper Inbound Form⚠️ STRICT CONSTRAINT / NON-GOALS (ข้อกำหนดสำคัญขอบเขตงาน)🛑 ห้ามแก้ไข หรือกระทบกระเทือนไฟล์/หมวดหมู่อื่นในระบบเด็ดขาด (เช่น ฟอร์มหมวด Printer, Ink, Film, Machinery, Spare Parts, Finishing, Offcuts ฯลฯ)🟢 อนุญาตให้แก้ไขเฉพาะไฟล์และคอมโพเนนต์ที่เกี่ยวข้องกับประเภทกระดาษ (Paper Category Only) ได้แก่:PaperSpecForm.tsxPaperSpec Interface ใน frontend/src/types/inventory.ts และ frontend/src/types/inbound.tsคีย์แปลภาษา inbound.paper ใน frontend/src/locales/lo.json และ frontend/src/locales/en.json🎯 Objectiveเพิ่มฟิลด์ข้อมูล "จำนวนกระดาษต่อ 1 รีม/แพ็ค (Sheets per Ream / Pack)" ในฟอร์มนำเข้ากระดาษ (PaperSpecForm.tsx) โดยจะแสดงผลและบังคับกรอก เฉพาะเมื่อเลือกประเภท/รูปแบบกระดาษเป็น "แผ่น" (Sheet) เท่านั้น เนื่องจากกระดาษแต่ละประเภท/แบรนด์ (เช่น กระดาษอาร์ต, กระดาษปอนด์, กระดาษภาพถ่าย/Photo Paper) มีจำนวนแผ่นต่อรีมหรือต่อบรรจุภัณฑ์ที่ไม่เท่ากัน (เช่น 500 แผ่น/รีม, 100 แผ่น/แพ็ค, 20 แผ่น/แพ็ค)🏗️ Technical & Component Requirements1. TypeScript Types Update (Paper Only)frontend/src/types/inventory.ts & frontend/src/types/inbound.tsปรับปรุงเฉพาะ PaperSpec interface ให้รองรับฟิลด์ sheets_per_ream (ห้ามแตะต้อง interface หมวดอื่น):export interface PaperSpec {
  paper_type?: string;          // e.g. "Art Paper", "Photo Paper", "Bond"
  paper_format?: 'sheet' | 'roll'; // 'sheet' (แผ่น) หรือ 'roll' (ม้วน)
  grammage?: number;            // gsm
  width_mm?: number;
  height_mm?: number;
  sheets_per_ream?: number;     // 🟢 NEW: จำนวนแผ่นต่อรีม/แพ็ค (แสดงเฉพาะเมื่อ paper_format === 'sheet')
  supplier_phone?: string;
  purchase_link?: string;
}
2. UI Conditional Logic & Form Field (PaperSpecForm.tsx)Location: frontend/src/components/inventory/forms/category-specs/PaperSpecForm.tsxเงื่อนไขการแสดงผล (Conditional Rendering):เมื่อ paper_format === 'sheet' (หรือเมื่อหน่วยนับถูกเลือกเป็นแผ่น/รีม) ให้แสดงกล่องป้อนข้อมูล "จำนวนแผ่นต่อ 1 รีม/แพ็ค (Sheets per Ream/Pack)"เมื่อ paper_format === 'roll' (ม้วน) ให้ซ่อนฟิลด์นี้อัตโนมัติField Specification:Key: sheets_per_reamType: number (Input Min: 1)Default Value: 500 (หากไม่ได้ระบุ)Placeholder: e.g. 500, 100, 20Helper Text: ระบุจำนวนแผ่นต่อบรรจุภัณฑ์ เช่น กระดาษอาร์ตมาตรฐาน = 500 แผ่น/รีม, กระดาษ Photo = 20 หรือ 100 แผ่น/แพ็ค🌐 i18n Translations (Lao & English - Paper Namespace Only)1. Lao Translations (frontend/src/locales/lo.json){
  "inbound": {
    "paper": {
      "sheets_per_ream": "ຈຳນວນແຜ່ນຕໍ່ 1 ຣີມ / ແພັກ (SHEETS PER REAM/PACK)",
      "sheets_per_ream_placeholder": "ตัวอย่าง: 500, 100, 20",
      "sheets_per_ream_helper": "ระบุจำนวนแผ่นต่อบรรจุภัณฑ์ (เช่น กระดาษทั่วไป 500 แผ่น/รีม, กระดาษ Photo 20-100 แผ่น/แพ็ค)"
    }
  }
}
2. English Translations (frontend/src/locales/en.json){
  "inbound": {
    "paper": {
      "sheets_per_ream": "SHEETS PER REAM / PACK",
      "sheets_per_ream_placeholder": "e.g. 500, 100, 20",
      "sheets_per_ream_helper": "Specify number of sheets per ream/pack (e.g., standard 500, photo paper 20-100)"
    }
  }
}
🛠️ Step-by-Step Implementation InstructionsUpdate Interfaces (Paper Spec Only):เพิ่ม sheets_per_ream?: number; ลงใน PaperSpec ในไฟล์ frontend/src/types/inventory.ts และ frontend/src/types/inbound.tsUpdate Form Component (PaperSpecForm.tsx):เพิ่มการสกัดค่า paper_format หรือ unit จาก Form Stateเพิ่ม JSX Input สำหรับ sheets_per_ream ภายใต้เงื่อนไข paper_format === 'sheet'ผูก onChange handler เพื่ออัปเดต state ของกระดาษUpdate Translations (lo.json / en.json):เพิ่มคีย์ sheets_per_ream ภายใต้หมวด inbound.paper ทั้งภาษาลาวและภาษาอังกฤษ🔍 Inspector Verification Checklist[ ] Strict Isolation: การแก้ไขทั้งหมดจำกัดอยู่เฉพาะไฟล์ที่เกี่ยวกับกระดาษเท่านั้น (ไม่มีการแตะต้อง Printer, Ink หรือส่วนอื่น)[ ] เลือกประเภทกระดาษแบบ แผ่น (Sheet) แล้วฟิลด์ "จำนวนแผ่นต่อ 1 รีม/แพ็ค" แสดงขึ้นมา[ ] สลับประเภทกระดาษเป็น ม้วน (Roll) แล้วฟิลด์ "จำนวนแผ่นต่อ 1 รีม/แพ็ค" ซ่อนไปอัตโนมัติ[ ] สามารถกรอกตัวเลขจำนวนแผ่น เช่น 500, 100, 20 ได้อย่างถูกต้อง[ ] เมื่อบันทึกฟอร์ม ค่า sheets_per_ream ถูกส่งไปยัง Payload รับเข้าสินค้าถูกต้อง[ ] การสลับภาษา ลาว <-> อังกฤษ แสดงข้อความตรงตามภาษาที่เลือก 100%