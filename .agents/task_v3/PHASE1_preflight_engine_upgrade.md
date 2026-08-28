# PHASE 1: Preflight Engine Full-Scan & Color Split Upgrade

## 🎯 Role: Senior TypeScript & Graphics Processing Engineer
## 📁 Target Files:
- `admin-system/frontend/src/features/orders/types.ts`
- `admin-system/frontend/src/lib/preflightAnalyzer.ts`

---

## 📋 Task Requirements:
1. **Types Update (`types.ts`):**
   - เพิ่มฟิลด์ใน `PreflightResult`:
     - `color_pages_count: number` (จำนวนหน้าสี)
     - `mono_pages_count: number` (จำนวนหน้าขาวดำ)
     - `color_pages_avg_c: number`, `color_pages_avg_m: number`, `color_pages_avg_y: number`, `color_pages_avg_k: number`
     - `mono_pages_avg_k: number`
     - `target_paper_size?: string` (A4, A5, A3, Custom)
     - `target_width_mm?: number`, `target_height_mm?: number`

2. **Preflight Engine Upgrade (`preflightAnalyzer.ts`):**
   - รองรับ Callback function: `onProgress?: (current: number, total: number, pct: number) => void`
   - วนลูปสแกนทุกหน้า 1 ถึง $N$ ของไฟล์ PDF (`pdf.numPages`)
   - ตรวจจับเงื่อนไขหน้าสี: ถ้า $(C + M + Y) > 0.5\%$ จัดเป็น **หน้าสี (Color Page)** มิฉะนั้นจัดเป็น **หน้าขาวดำ (Mono K Page)**
   - คำนวณค่าเฉลี่ยสีแยกกลุ่ม:
     - หน้าสี: หาค่าเฉลี่ย $C\%, M\%, Y\%, K\%$
     - หน้าขาวดำ: หาค่าเฉลี่ย $K\%$
   - ล้างหน่วยความจำทุกหน้าด้วย `page.cleanup()` เพื่อป้องกัน memory leak แม้ไฟล์มี 500 หน้า
