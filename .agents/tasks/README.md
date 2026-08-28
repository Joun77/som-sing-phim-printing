# Som Sing Phim - Master Development Roadmap (.agents/tasks)

แผนงานพัฒนาระบบหลังบ้าน (Admin System) สำหรับโรงพิมพ์สมสิงห์พิมพ์ แบบ Lean & High Efficiency สำหรับการบริหารจัดการร้านออนไลน์และโรงพิมพ์ดิจิทัล

---

## สรุปรายการงาน (Task Index)

| Task File | ชื่อภารกิจ | วัตถุประสงค์หลัก | สถานะ |
| :--- | :--- | :--- | :---: |
| [task-01-lean-order-pipeline.md](file:///.agents/tasks/task-01-lean-order-pipeline.md) | **Lean Order Flow & 1-Click Status** | จัดการออเดอร์ในหน้าจอเดียว สั่งพิมพ์-ตัดสต็อก-ดาวน์โหลดไฟล์ในคลิกเดียว | ⏳ Ready |
| [task-02-quick-ink-swap-deduction.md](file:///.agents/tasks/task-02-quick-ink-swap-deduction.md) | **One-Click Ink & Consumable Swap** | เปลี่ยนขวดหมึก/อะไหล่หน้าเครื่องจักร พร้อมตัดสต็อกในคลังอัตโนมัติ | ⏳ Ready |
| [task-03-shipping-label-generator.md](file:///.agents/tasks/task-03-shipping-label-generator.md) | **Shipping Label & Slip Printing** | พิมพ์ใบปะหน้ากล่องพัสดุ (Label 100x150mm) และใบเสร็จรับเงิน | ⏳ Ready |
| [task-04-offcut-scrap-inventory.md](file:///.agents/tasks/task-04-offcut-scrap-inventory.md) | **Offcut / Scrap Inventory** | ระบบบันทึกและจัดการคลังเศษกระดาษ นำกลับมาใช้พิมพ์งานไซส์เล็ก | ⏳ Ready |
| [task-05-lao-localization-icon-cleanup.md](file:///.agents/tasks/task-05-lao-localization-icon-cleanup.md) | **Lao Localization & Icon Standard** | ลบอีโมจิทั้งหมดแทนที่ด้วย Lucide Icons และแปลงภาษาไทยเป็นลาว 100% | ⏳ Ready |

---

## กฎเหล็กประจำทุก Task (Universal Guardrails)

1. **NO EMOJIS:** ห้ามใช้อีโมจิ (เช่น 📑, 🎨, ⚠️, ❌, ✂️) ใน UI และโค้ดเด็ดขาด ให้ใช้ `lucide-react` เท่านั้น
2. **LAO LANGUAGE STANDARD:** ข้อความฝั่งผู้ใช้ทั้งหมดในภาษาหลักต้องเป็น **ภาษาลาว** อย่างสละสลวยและถูกต้องตามศัพท์เทคนิคการพิมพ์ (ห้ามมีภาษาไทยปะปนใน UI)
3. **FINANCIAL PRECISION:** ห้ามใช้ `float64` หรือการคำนวณเงินที่ไม่แม่นยำ ทุกยอดเงินต้องใช้ระบบ Decimal หรือ Fixed Point และจัดรูปแบบด้วย `formatCurrency`
4. **TYPE INTEGRITY:** ห้ามใช้ `any` แบบไร้การควบคุม และต้องรักษาความตรงกันระหว่าง Go Structs และ TypeScript Interfaces 100%
5. **STEP-BY-STEP EXECUTION:** ให้ผู้ใช้สั่งรันและตรวจทีละ Task ตามลำดับ
