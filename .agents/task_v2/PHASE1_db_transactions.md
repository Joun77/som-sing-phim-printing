# PHASE 1: Database Transaction & State Machine (Backend Core)

## TASK 1.1: สร้าง Transaction Helper Wrapper
**รายละเอียด:**
- ไฟล์เป้าหมาย: สร้างฟังก์ชัน helper ใน `backend/db/db.go` (เช่น `RunInTransaction(func(tx *sql.Tx) error)`)
- เพื่อช่วยให้ Handler สามารถเรียกใช้งาน Transaction ได้ง่าย โดยจะ Handle การ `Commit` เมื่อสำเร็จ และ `Rollback` เมื่อเจอ error ให้อัตโนมัติ

## TASK 1.2: Refactor Order Database Operations (tx.Begin)
**รายละเอียด:**
- ไฟล์เป้าหมาย: `backend/orders/handlers.go`
- แก้ไข API ทุกตัวที่เกี่ยวข้องกับการแก้ไข Data (เช่น `HandleCreateOrder`, `HandleUpdateOrderItemStep`, `updateOrderDepositAndStatusInDB`) ให้มาใช้ `RunInTransaction`
- ตรวจสอบว่าคำสั่ง `db.DB.Exec` เหล่านี้ถูกแทนที่ด้วย `tx.Exec` 

## TASK 1.3: Enforce Order State Machine Validation
**รายละเอียด:**
- ไฟล์เป้าหมาย: `backend/orders/handlers.go`
- เขียน Logic ตรวจสอบ State: ก่อนเปลี่ยนเป็น `IN_PRODUCTION` (ต้องแน่ใจว่าแบบพิมพ์ยืนยันแล้ว และจ่ายมัดจำแล้ว)
- ไม่อนุญาตให้ Skip State ไปมาได้ แต่ยอมรับให้สามารถแก้ไข (Edit) กลับหลังได้หากจำเป็น
- ถ้าผิดลำดับให้ตอบกลับแบบ `400 Bad Request` พร้อมสาเหตุชัดเจน
