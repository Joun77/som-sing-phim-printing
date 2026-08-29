# Task 01: Quick Actions Controls & Edit Order Button Integration

## 1. AI Role & Mission
* **Role:** Senior Frontend Engineer & UI Specialist
* **Mission:** ปรับปรุงคอลัมน์ "จัดการด่วน (QUICK ACTIONS)" ในตารางออเดอร์ (`OrdersTable` / `OrderRow`) ให้มีปุ่มครบถ้วน 4 รายการอย่างเป็นระเบียบ สวยงาม พรีเมียม พร้อมเชื่อมต่อ Action Event ไปยังระบบแก้ไขออเดอร์

---

## 2. ขอบเขตงานโดยละเอียด (Detailed Scope of Work)
1. **ปุ่ม Quick Actions ในแต่ละแถวออเดอร์ (`OrderRow.tsx`):**
   - มีปุ่มแสดงผลครบทั้ง 4 รายการ:
     1. `[ໃບປະໜ້າ]` (Shipping Label): ไอคอน `<PackageCheck />` เปิดโมดัลใบปะหน้าพัสดุ
     2. `[ເບິ່ງລາຍລະອຽດ]` (View Details): ไอคอน `<Eye />` เปิดหน้ารายละเอียดออเดอร์
     3. `[ແກ້ໄຂ]` (Edit Order): ไอคอน `<Edit3 />` เปิด Large Edit Order Modal
     4. `[ລົບ]` (Delete Order): ไอคอน `<Trash2 />` ลบออเดอร์พร้อม Modal ถามยืนยัน
2. **การจัดวางตารางและคอลัมน์ (`OrdersTable.tsx`):**
   - จัดเรียง Header 7 คอลัมน์ให้ตรงกับ Data Rows 100%:
     `Order ID / Date` | `ຊື່ລູກຄ້າ / ເບີໂທ` | `ລາຍການສັ່ງພິມ` | `ສະຖານະການຊຳຣະ` | `ສະຖານະການຜະລິດ` | `ຍອດລວມ (LAK)` | `ຈັດການດ່ວນ (QUICK ACTIONS)`
   - ปรับ Styling คอลัมน์ Quick Actions ให้มี gap ที่สวยงาม ไม่ตกบรรทัด รองรับ Responsive
3. **การส่งต่อ Props & Event Handlers (`CustomerOrders.tsx`):**
   - ส่งต่อฟังก์ชัน `onEditOrder` จาก `CustomerOrders.tsx` เข้าสู่ `OrdersTable` และ `OrderRow` เพื่อเรียกเปิด Modal แก้ไข

---

## 3. สิ่งที่ห้ามแตะต้องเด็ดขาด (Strict Restrictions)
* 🛑 **ห้ามแก้ไขโมดูลอื่น:** ห้ามแตะต้อง `pricing`, `inventory`, `catalog`, `finance`, `hr`, `inbound`
* 🛑 **ห้ามลบหรือเปลี่ยนชื่อฟิลด์ในคอลัมน์อื่น:** รักษารูปแบบยอดเงินรวม LAK และสถานะให้อยู่ครบถ้วน
* 🛑 **ห้ามใช้อีโมจิในโค้ดและ UI เด็ดขาด:** ใช้ Lucide Icons เท่านั้น
* 🛑 **ห้ามใช้ภาษาไทยใน UI:** ข้อความปุ่มและ Tooltip ต้องเป็นภาษาลาว

---

## 4. ไฟล์เป้าหมายที่อนุญาตให้แก้ไข (Permitted Files Only)
* [MODIFY] `admin-system/frontend/src/features/orders/components/OrderRow.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/OrdersTable.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/CustomerOrders.tsx`

---

## 5. เกณฑ์การตรวจรับงาน (Acceptance Criteria & QA Checklist)
- [ ] แถวออเดอร์ในตารางแสดงปุ่ม Quick Actions ครบ 4 ปุ่มตามลำดับ
- [ ] เมื่อคลิกปุ่ม `ແກ້ໄຂ` จะเรียก Trigger เปิด Modal แก้ไขออเดอร์ได้ถูกต้อง
- [ ] เมื่อคลิกปุ่ม `ໃບປະໜ້າ` จะเปิดโมดัลพิมพ์ใบปะหน้าพัสดุได้ถูกต้อง
- [ ] เมื่อคลิกปุ่ม `ເບິ່ງລາຍລະອຽດ` จะนำทางเข้าสู่หน้ารายละเอียดออเดอร์
- [ ] คอลัมน์ยอดรวม (LAK) และส่วนหัวตารางจัดวางตรงกันทุกแถว ไม่มี Error หรือข้อความหลุดเฟรม
