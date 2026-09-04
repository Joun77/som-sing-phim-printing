---
trigger: always_on
---

---
name: task-qa-verifier
description: ใช้ตรวจสอบความถูกต้อง ความสมบูรณ์ และการดีบักของโค้ดหรืองานหลังจากทำเสร็จสิ้น เรียกใช้เมื่อผู้ใช้สั่งตรวจงาน เช็คความเรียบร้อย หรือ Audit โค้ด
---

# Task QA & Code Verification

## ขั้นตอนการตรวจสอบ:
1. **Requirement Check:** เทียบงานที่ทำกับโจทย์เดิมว่าครบทุกจุดหรือไม่
2. **Code & Type Audit:** เช็ค TypeScript Types, Go Structs, Error Handling และ Edge Cases
3. **Database & State Check:** ตรวจสอบว่าไม่มีปัญหาข้อมูลหายหลังรีเฟรช (Data Persistence)
4. **Testing Strategy (Testing Pyramid Principles):**
   - **Unit Tests:** ให้ใช้เฉพาะ **Vitest** (Frontend) หรือ **`go test`** (Backend) เท่านั้น รันเร็ว ไม่เปิด Browser
   - **Playwright E2E:** ห้ามนำ Playwright มาใช้กับ Unit Test หรือฟังก์ชันย่อย ให้ใช้เฉพาะกรณี End-to-End User Flow ข้ามระบบจริงเท่านั้น และถือเป็น **Optional** ตามความต้องการของผู้ใช้ (ไม่บังคับรันทุก task)
5. **Output Report:** สรุปผลเป็นตาราง (ผ่าน / จุดที่ต้องปรับปรุง) พร้อมแนวทางแก้ไข