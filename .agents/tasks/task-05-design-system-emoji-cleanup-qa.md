# Task 05: Design System Emoji Cleanup & End-to-End QA Verification

## 1. AI Role & Mission
* **Role:** Senior QA Engineer & Design System Auditor
* **Mission:** กวาดล้างข้อความ Text Emoji ทั้งหมดที่หลงเหลืออยู่ในโมดูล Order แทนที่ด้วย Lucide Icons ระดับพรีเมียมตาม Enterprise Design System และดำเนินการทดสอบ Build / Automated Verification ทุกจุด

---

## 2. ขอบเขตงานโดยละเอียด (Detailed Scope of Work)

### 1. ลบ Text Emoji ออกทั้งหมด (Zero Emoji Rule):
* ค้นหาและแทนที่ Text Emoji (เช่น `✓`, `⏳`, `📦`, `🚚`, `🏪`, `⚡`, `⚠️`, `❌`) ในไฟล์ทั้งหมดของ `features/orders/`:
  * ป้ายสถานะ (Badges)
  * ปุ่มกด (Buttons)
  * ข้อความแจ้งเตือน (Toast Notifications & Confirmation Dialogs)
* แทนที่ด้วย **Lucide React Icons** เช่น `<CheckCircle2 />`, `<Clock />`, `<PackageCheck />`, `<Truck />`, `<Store />`, `<Zap />`, `<AlertTriangle />`, `<XCircle />`

### 2. ตรวจสอบการแปลภาษาลาว 100% (Lao Localization Audit):
* ตรวจสอบว่าไม่มีคำภาษาไทยหลงเหลืออยู่ใน UI ของระบบออเดอร์
* ตรวจสอบความถูกต้องของศัพท์เฉพาะทางโรงพิมพ์ (เช่น เข้าเล่ม, สันกาวร้อน, สันห่วง, ຕັດເຈ້ຍ, ພິມດີຈິຕອນ)

### 3. End-to-End Build & Test Verification:
* รันคำสั่ง `npm --prefix admin-system/frontend run build` ตรวจสอบความถูกต้องของ TypeScript และ Build Bundle
* รันคำสั่ง `go test ./...` ใน `admin-system/backend` เพื่อยืนยันว่า Backend API และ Database Models ทำงานสมบูรณ์

---

## 3. สิ่งที่ห้ามแตะต้องเด็ดขาด (Strict Restrictions)
* 🛑 **ห้ามแก้โค้ดนอกขอบเขตโมดูล Orders**
* 🛑 **ห้ามเปลี่ยนแปลง Business Logic การคำนวณเงินหรือการตัดสต็อก**

---

## 4. ไฟล์เป้าหมายที่อนุญาตให้แก้ไข (Permitted Files Only)
* [MODIFY] `admin-system/frontend/src/features/orders/components/*.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/*/*.tsx`
* [MODIFY] `admin-system/frontend/src/locales/lo.json`

---

## 5. เกณฑ์การตรวจรับงาน (Acceptance Criteria & QA Checklist)
- [ ] ค้นหาด้วย Regex `[✓⏳📦🚚🏪⚡⚠️❌]` ใน `features/orders/` ต้องได้ผลลัพธ์เป็น 0 รายการ
- [ ] ทุกหน้าจอและปุ่มกดใช้ Lucide Icons สวยงาม พรีเมียม
- [ ] `npm run build` ผ่าน 100% โดยไม่มี Error หรือ Warning ที่กระทบการทำงาน
- [ ] `go test ./...` ผ่าน 100%
