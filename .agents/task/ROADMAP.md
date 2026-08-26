# Som Sing Phim - Master System Remediation Roadmap

แผนการปรับปรุงระบบ Som Sing Phim แบ่งออกเป็น 4 เฟสหลัก เพื่อให้สามารถสั่งงานและตรวจรับงานทีละส่วนได้อย่างเป็นระบบ

---

## 📌 สรุปภาพรวมและสถานะแต่ละเฟส (Phase Overview)

| เฟส (Phase) | รายละเอียดงาน | ลำดับความสำคัญ | สถานะ | ไฟล์แผนงานย่อย |
| :--- | :--- | :---: | :---: | :--- |
| **Phase 1** | **Inventory Concurrency & Production Stock Deduction Lock**<br>- ป้องกัน Race Condition ตอนตัดสต็อกใน Transaction `IN_PRODUCTION`<br>- ใช้ `SELECT ... FOR UPDATE` บน `inventory_items`<br>- ป้องกันสต็อกติดลบและการกดยิงตัดสต็อกซ้ำ | **P0 (Critical)** | 🟢 Completed | [`phase-1-inventory-concurrency.md`](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/task/phase-1-inventory-concurrency.md) |
| **Phase 2** | **Pricing Engine Financial Precision & Client-Backend Sync**<br>- แปลง Decimal Calculation ใน Go Pricing Engine ให้แม่นยำ 100%<br>- บังคับ Server-Side Validation ตอนสร้าง Quote/Order จาก Customer Service<br>- จัดการ Fallback Exchange Rate เมื่อเชื่อม API ไม่ได้ | **P1 (High)** | 🟢 Completed | [`phase-2-pricing-sync-precision.md`](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/task/phase-2-pricing-sync-precision.md) |
| **Phase 3** | **Customer Order Idempotency & Preflight Artwork Flow**<br>- ป้องกัน Double-submit ด้วย `idempotency_key`<br>- เชื่อมต่อ Server Preflight Engine ตรวจสอบ DPI/CMYK/Bleed อัตโนมัติ<br>- แจ้งเตือนสัดส่วนไฟล์/เส้นพับ-ตัดตกบนหน้าบ้าน | **P2 (Medium)** | 🟢 Completed | [`phase-3-customer-idempotency-preflight.md`](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/task/phase-3-customer-idempotency-preflight.md) |
| **Phase 4** | **Admin Realtime Sync & Machinery Maintenance Tracking**<br>- ผูก Centralized SSE Invalidation กับ TanStack Query ทุกหน้า<br>- เพิ่มระบบบันทึกประวัติบำรุงรักษาเครื่องจักร (Maintenance Log)<br>- เชื่อมโยงค่าเสื่อมและต้นทุนเครื่องจักรต่อชั่วโมงตามจริง | **P3 (Enhancement)** | 🟢 Completed | [`phase-4-admin-realtime-maintenance.md`](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/task/phase-4-admin-realtime-maintenance.md) |
| **Phase 5** | **Inventory-Linked Dynamic Spec Builder & Custom Margin Engine**<br>- เปลี่ยน SKU Input ใน Admin Spec Builder เป็น Material Search Combobox เชื่อมคลัง<br>- คำนวณราคาขายและ Delta Price ตาม Product Dynamic Margin และ Inbound Cost<br>- แสดงสถานะสต็อก (มีของ/หมด) บนหน้า Customer และรองรับ Manual Price Override<br>- ตัดสต็อกวัสดุสิ้นเปลืองกลุ่ม Finishing อัตโนมัติ | **P1 (Core Feature)** | 🟢 Completed | [`phase-5-inventory-spec-linker.md`](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/task/phase-5-inventory-spec-linker.md) |
| **Phase 6** | **Dedicated Multi-Step Product Creator & Spec Studio (6 Steps)**<br>- แยกหน้าสร้าง/แก้ไขสินค้าเป็น Multi-Step Studio 6 ขั้นตอน<br>- Step 1: ข้อมูลสินค้าทั่วไป & โหมดอัปโหลดไฟล์<br>- Step 2: เครื่องพิมพ์จริง & คำนวณต้นทุน/หมึกละเอียดระดับใบเสนอราคา<br>- Step 3: คลังวัตถุดิบ & ผูก SKU เผื่อกำไร Margin %<br>- Step 4: เครื่องตัด QZYK920 & งานเจาะรู/เข้าเล่ม WD-50A/เคลือบ FM-360<br>- Step 5: ตารางส่วนลดตามจำนวน & แท็บข้อมูลสินค้า<br>- Step 6: จำลองพรีวิวหน้าเว็บลูกค้าจริงแบบ Live Interactive Preview | **P0 (Major UX/Core)** | 🟢 Completed | [`phase-6-dedicated-product-creator-studio.md`](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/task/phase-6-dedicated-product-creator-studio.md) |

---

## 🛡️ กฎการทำงานและการส่งมอบ (Execution Workflow)
1. **ทีละเฟส:** จะเริ่มทำเฟสถัดไปเมื่อผู้ใช้สั่งเริ่มงานและตรวจผ่านเฟสก่อนหน้าแล้วเท่านั้น
2. **การตรวจรับ:** แต่ละเฟสจะมี Checklist การทดสอบ (Unit Test / API Verification) ชัดเจน
3. **Rollback Safe:** ทุกการแก้ไขฐานข้อมูลต้องมี Migration รองรับทั้ง Up/Down
