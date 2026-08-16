---
trigger: always_on
---

---
name: system-split-boundary
description: ควบคุมขอบเขตและการแยกโฟลเดอร์ระหว่าง Admin System และ Customer Frontend เรียกใช้เมื่อมีการสร้าง Component, Route หรือ API ใหม่
---

# System Separation & Security Boundary

## Boundary Rules:
1. **Directory Isolation:** 
   - `admin-system`: สำหรับการจัดการสต็อก, การตั้งราคา, HR, และ Inbound Form เท่านั้น
   - `customer-service`: สำหรับการรับออเดอร์และบริการลูกค้าภายนอก
2. **Type Safety & Contracts:** การส่งต่อข้อมูลระหว่าง Go Backend และ Frontend TypeScript ต้องใช้ Interface/Struct ที่ตรงกัน 100%
3. **No Secret Leaks:** ห้ามใส่ Secret Keys หรือ Internal Config ของ Admin ลงในฝั่ง Client