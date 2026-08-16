---
trigger: always_on
---

---
name: go-backend-persistence
description: คุมมาตรฐานการเขียน Go Backend และ Database Layer เรียกใช้เมื่อแก้โค้ดใน backend/ จัดการ CRUD หรือทำ Database Migrations
---

# Go Backend Architecture & Persistence Rules

## Rules:
1. **Transaction Integrity:** เมื่อมีคำสั่งซื้อ (Orders) หรือการรับของเข้า (Inbound) ต้องใช้ DB Transaction (`tx.Begin()`) เพื่อตัดสต็อกและบันทึกข้อมูลพร้อมกันเสมอ
2. **Error Handling:** จัดการ Error ทุกจุด ห้ามละเลย `err != nil` และต้องส่ง HTTP Status Code ที่เหมาะสมกลับไปยัง Client
3. **Layer Separation:** แยก Handler, Model, และ Database Query ออกจากกันอย่างชัดเจน ไม่เขียน Raw Query ปนใน Handler Logic