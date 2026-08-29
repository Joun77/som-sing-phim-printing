# Task 04: Real Artwork Viewer & Comprehensive Job Specs Inspection

## 1. AI Role & Mission
* **Role:** Senior Frontend Engineer & Pre-Press Pipeline Specialist
* **Mission:** ปรับปรุงส่วนแสดงรายละเอียดงานพิมพ์และไฟล์อาร์ตเวิร์กของลูกค้าในหน้ารายละเอียดออเดอร์ (`OrderDetailsPage` / `ArtworkPrepressCard` / `ArtworkViewerModal`) ให้แสดงสเปกแต่ละ Job ครบถ้วน และสามารถเปิดดู/ดาวน์โหลดไฟล์งานจริงได้โดยไม่เกิดข้อผิดพลาด

---

## 2. ขอบเขตงานโดยละเอียด (Detailed Scope of Work)

### 1. แสดงรายละเอียดสเปกงานพิมพ์ของลูกค้าอย่างสมบูรณ์:
* แสดงรายการ Job งานพิมพ์ทั้งหมดในออเดอร์ แยกรายการชัดเจน:
  * ชื่อชิ้นงาน (Job Name)
  * ขนาดพิมพ์ (เช่น A4, A3, ขนาดกำหนดเอง กว้าง×ยาว มม.)
  * ชนิดกระดาษและแกรมกระดาษ
  * จำนวนหน้าทั้งหมด, จำนวนหน้าสี / หน้าขาวดำ
  * จำนวนเล่ม/ชิ้น (Quantity)
  * รูปแบบการเข้าเล่ม (สันห่วง, สันกาวร้อน, เย็บมุงหลังคา, พับครึ่ง ฯลฯ)
  * การเคลือบผิวและตกแต่งพิเศษ (Lamination, Spot UV, Foil)

### 2. ระบบเปิดดูไฟล์งานอาร์ตเวิร์กที่ใช้งานได้จริง (Working Artwork Preview):
* ในบล็อก **"ໄຟລ໌ງານພິມທີ່ລູກຄ້າແນບມາ (Customer Artwork Files)"**:
  * ปุ่ม **"ເປີດໄຟລ໌ງານ" (Open Artwork)**:
    * หากเป็นลิงก์ภายนอก (Google Drive, Canva, Dropbox, Cloud URL) ➔ เปิดใน Browser Tab ใหม่
    * หากเป็นไฟล์อัปโหลดในระบบ (PDF, PNG, JPG, Vector) ➔ เปิดดูตัวอย่างใน **In-App Artwork Modal Viewer** สามารถขยายดูรายละเอียดได้
    * มีปุ่มดาวน์โหลดไฟล์จริงลงเครื่อง
  * มีระบบ Fallback ปลอดภัย: หากออเดอร์ยังไม่มีลิงก์ไฟล์งาน ให้แสดงปุ่ม *"ແນບໄຟລ໌ງານພິມ"* เพื่อให้แอดมินใส่ลิงก์หรืออัปโหลดไฟล์เพิ่มได้

---

## 3. สิ่งที่ห้ามแตะต้องเด็ดขาด (Strict Restrictions)
* 🛑 **ห้ามแก้ไขส่วน Preflight Engine ใน Backend**
* 🛑 **ห้ามใช้อีโมจิในโค้ดและ UI เด็ดขาด**
* 🛑 **ห้ามใช้ภาษาไทยใน UI:** ข้อความทั้งหมดต้องเป็นภาษาลาว

---

## 4. ไฟล์เป้าหมายที่อนุญาตให้แก้ไข (Permitted Files Only)
* [MODIFY] `admin-system/frontend/src/features/orders/components/reception/ArtworkPrepressCard.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/production/ArtworkPreviewCard.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/modals/ArtworkViewerModal.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/OrderDetailsPage.tsx`

---

## 5. เกณฑ์การตรวจรับงาน (Acceptance Criteria & QA Checklist)
- [ ] หน้ารายละเอียดแสดงสเปกของทุก Job (ขนาด, กระดาษ, จำนวนหน้า, วิธีเข้าเล่ม) อย่างครบถ้วน
- [ ] ปุ่ม "ເປີດໄຟລ໌ງານ" สามารถเปิดดูไฟล์อาร์ตเวิร์กได้จริง ไม่เกิดหน้าขาวหรือ Error
- [ ] สามารถดูพรีวิวและกดดาวน์โหลดไฟล์อาร์ตเวิร์กได้
