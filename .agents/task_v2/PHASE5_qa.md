# PHASE 5: QA & Integration Test สำหรับระบบใหม่

## TASK 5.1: End-to-End Test & Edge Cases
**รายละเอียด:**
- ยืนยันการทำงาน Flow หลักทั้งหมดตั้งแต่ต้นจนจบ
- 1. เปิด Quotation (ทดสอบระบบ Decimal ราคา)
- 2. สร้าง Order จาก Quotation
- 3. ปรับ State เป็น IN_PRODUCTION
- 4. ตรวจสอบว่าระบบตัด Stock กระดาษ/หมึก ด้วย Transaction ครบถ้วนและไม่ Error
- 5. ตรวจสอบว่า Role ของแต่ละ User เห็นข้อมูลถูกต้อง

## TASK 5.2: Cleanup & Final Audit
**รายละเอียด:**
- ลบโค้ดเก่าที่ไม่ได้ใช้ออก
- เช็ค Typescript Type Mismatches
- เตรียมความพร้อมขึ้น Phase งานลำดับถัดไป (Supplier/PO, Finance)
