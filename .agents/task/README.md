# Som Sing Phim ERP — Task Files Index
**สร้างโดย:** AI System Architect | **วันที่:** 2026-08-27

---

## 📁 โครงสร้างไฟล์งาน

| ไฟล์ | Phase | Priority | Dependencies |
|---|---|---|---|
| `PHASE1_core_fixes.md` | Phase 1 — Bug Fixes | 🔴 Critical | ไม่มี — เริ่มก่อนเลย |
| `PHASE2_finance_accounting.md` | Phase 2 — Finance/Accounting | 🔴 High | Phase 1 เสร็จก่อน |
| `PHASE5_notifications.md` | Phase 5 — WhatsApp/Telegram | 🟠 High | Phase 1 เสร็จก่อน |
| `PHASE6_supplier_po.md` | Phase 6 — Supplier & PO | 🟡 Medium | Phase 2 เสร็จก่อน |

> **Phase 3 (HR) และ Phase 4 (Analytics):** จะสร้างเมื่อพนักงานจริงเริ่มใช้งานระบบ

---

## 📋 กฎการใช้ Task Files นี้

### วิธีสั่งงาน AI
1. เปิดไฟล์ Phase ที่ต้องการ
2. **Copy เฉพาะ TASK ที่ต้องการ** (ไม่ต้อง copy ทั้งไฟล์)
3. วาง Prompt ใน AI Chat พร้อมระบุ:
   - "ทำ TASK X.X จากไฟล์นี้"
   - "ห้ามทำงานอื่นนอกจาก task นี้"

### ตัวอย่าง Prompt ที่ดี
```
ทำ TASK 1.1 จาก Phase 1:
[วาง TASK 1.1 section]

ข้อห้าม:
- ส่งเฉพาะโค้ดที่แก้ ไม่ส่งทั้งไฟล์
- ไม่ทำ Task อื่น
```

### ลำดับที่แนะนำ
```
Phase 1, Session A → Phase 1, Session B → Phase 1, Session C → Phase 1, Session D
        ↓
Phase 2, Session A → Phase 2, Session B → ... (เรียงลำดับใน Phase)
        ↓ (parallel ได้)
Phase 5, Session A → Phase 5, Session B → ...
        ↓
Phase 6, Session A → ...
```

---

## 🚫 Dependencies ที่ต้องระวัง

| หากทำผิดลำดับ | ผลที่เกิด |
|---|---|
| Phase 2 ก่อน Phase 1 | P&L Report คำนวณราคาผิดเพราะ Unit Cost ยังบัคอยู่ |
| Phase 5 ก่อน Phase 1 | Notification ส่งต้นทุน/ราคาผิดให้ลูกค้า |
| Phase 6 ก่อน Phase 2 | Goods Receipt ไม่สร้าง AP เพราะ table ยังไม่มี |
