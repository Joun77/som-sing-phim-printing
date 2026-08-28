# TASK SUITE V3: Preflight & Color Analyzer with Auto-Item Creation

## 🎯 วัตถุประสงค์ (Objective)
พัฒนาระบบตรวจสอบไฟล์สิ่งพิมพ์ (Preflight & Color Analyzer) ขั้นสูง สำหรับการเพิ่มรายการสินค้าใหม่ในหน้าใบเสนอราคา (Quotation Manager) และหน้าสร้างออเดอร์ (Create Order Page) โดยรองรับ:
1. การสแกนวิเคราะห์ทุกหน้า 100% (Dynamic Page Count: 1 – 500+ หน้า)
2. การแยกนับหน้าสี (Color Pages) และหน้าขาวดำ (Mono K Pages)
3. การคำนวณพื้นที่ตามขนาดกระดาษที่เลือกพิมพ์ (A4, A5, A3, Custom)
4. ป๊อปอัป Modal สรุปผลและแปลงข้อมูลเข้าสู่รายการสินค้าใหม่อัตโนมัติ

---

## 📂 โครงสร้างงาน (Phase Breakdown)

- **[PHASE1_preflight_engine_upgrade.md](./PHASE1_preflight_engine_upgrade.md):** ปรับปรุงเอนจิน `preflightAnalyzer.ts` ให้รองรับ Full Page Scan, Memory Cleanup, Progress Callback, และการแยกหน้าสี/ขาวดำ
- **[PHASE2_preflight_modal_component.md](./PHASE2_preflight_modal_component.md):** สร้างคอมโพเนนต์ `PreflightItemCreationModal.tsx` สำหรับอัปโหลด เลือกกระดาษ และแสดงผลวิเคราะห์
- **[PHASE3_integration_quotation_and_orders.md](./PHASE3_integration_quotation_and_orders.md):** เชื่อมต่อ Modal เข้ากับปุ่ม `Add New Item` ใน `QuotationManager.tsx` และ `CreateOrderPage.tsx`
