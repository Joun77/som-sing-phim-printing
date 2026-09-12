# Report: ปรับปรุงการเลือกขนาดไซส์งาน (Job Size & Preset) ในหน้า Preflight และ Preflight Modal ให้เหมือนกับหน้าใบเสนอราคา 100%

## 1. ข้อมูลสรุปการดำเนินงาน (Execution Summary)
- **วันที่ดำเนินการ:** 12 กันยายน 2026
- **สถานะ:** เสร็จสมบูรณ์ (Completed & Verified 100%)
- **โมดูลที่เกี่ยวข้อง:** Preflight Checker, Preflight Modal, Quotation Manager, Job Size Selector Modal

---

## 2. ปัญหาและสิ่งที่ได้รับการแก้ไข (Resolved Issues)

### 1) สร้าง Reusable Component `JobSizeSelectorCard.tsx`:
- ดึง Design System จากหน้าใบเสนอราคา (Image 4) มาสร้างเป็นคอมโพเนนต์มาตรฐาน
- มี Header พร้อม Badge แสดงชื่อขนาดที่เลือก (เช่น `A4`)
- มีการ์ดพรีวิวแสดงชื่อขนาด, กว้าง × ยาว (มม.), นิ้ว, ซม. พร้อมปุ่ม `ປ່ຽນຂະໜາດ` (Change)
- มีช่องกรอกกว้าง (W mm) และสูง (H mm) ด่วน
- มีกล่องสรุปขนาดงาน (มม.) และคำนวณอัตราส่วนเทียบ A4 (`xx% (x.xx)`) แบบสด ๆ
- เชื่อมต่อ `SizePresetSelectorModal` ภายในตัว เพื่อให้ผู้ใช้สามารถค้นหาขนาดตามหมวดหมู่ (เอกจากสาร A-Series, รูปภาพ Photos, การ์ด/นามบัตร Cards, สติกเกอร์ Stickers) หรือบันทึกขนาดใหม่ได้

### 2) นำไปปรับใช้แทน `CustomDimensionInput` เดิม:
- **`JobQuantityAndPagesSection.tsx` (หน้าใบเสนอราคา):** Refactor ให้ใช้ `JobSizeSelectorCard` เพื่อความเป็นมาตรฐานเดียวกันของโค้ด
- **`PreflightChecker.tsx` (หน้าตรวจไฟล์และประเมินค่าสี):**
  - แทนที่ส่วน Single File Preflight (ทั้งก่อนอัปโหลดไฟล์และหลังอัปโหลดไฟล์)
  - แทนที่ส่วน Batch Photo Preflight
  - ตัดแผงปุ่ม 24 ขนาดเดิมที่กินพื้นที่หน้าจอออกทั้งหมด หน้าจอดูโปร่ง สะอาด ทันสมัย และเป็นมืออาชีพ
- **`PreflightItemCreationModal.tsx` (Modal ตรวจไฟล์ & ส่งต่อใบเสนอราคา):**
  - แทนที่ส่วน Single Preflight
  - แทนที่ส่วน Batch Photo Preflight
  - ผู้ใช้งานสามารถกดปุ่ม `ປ່ຽນຂະໜາດ` เพื่อเปิด Modal เลือกขนาดได้สะดวก รวดเร็ว และเป็นรูปแบบเดียวกับใบเสนอราคาทุกจุด

---

## 3. ผลการตรวจสอบคุณภาพ (QA Verification Results)
- **Frontend Build (`npm run build`):** ผ่านฉลุย 100% (Built in 400ms)
- **Frontend Unit Tests (Vitest):** ผ่าน 29/29 tests
- **Backend Tests (`go test ./...`):** ผ่าน 100%
