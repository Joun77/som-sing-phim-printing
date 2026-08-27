# Som Sing Phim ERP — System Rebuild (Task v2)

โฟลเดอร์นี้รวบรวมแผนการรื้อระบบใหม่ (Core Architecture Rebuild) เพื่อแก้ไขปัญหาโครงสร้างหลัก ได้แก่:
1. Database Transactions (แก้ปัญหา Data Inconsistency สต็อกผิด)
2. Precision Pricing (แก้ปัญหาทศนิยม `float64` ทำให้บัญชีเพี้ยน)
3. Order State Machine (ป้องกันการข้ามขั้นตอน)
4. Auth & RBAC (ความปลอดภัยของ Admin API)
5. Frontend Server State (รื้อ React Context เปลี่ยนเป็น TanStack Query)

## ลำดับการทำงาน (Phases)
| ไฟล์ | รายละเอียด | สถานะ |
|------|-----------|-------|
| `PHASE1_db_transactions.md` | Transaction Helper, Order State Machine Enforcement | 🟢 เสร็จสมบูรณ์ |
| `PHASE2_decimal_pricing.md` | เปลี่ยน `float64` -> `decimal.Decimal` | 🟢 เสร็จสมบูรณ์ |
| `PHASE3_auth_rbac.md` | ระบบ Login, JWT, Role-based API protection | 🟢 เสร็จสมบูรณ์ |
| `PHASE4_frontend_state.md` | ถอด Global State มาใช้ `useQuery` | 🟢 เสร็จสมบูรณ์ |
| `PHASE5_qa.md` | ทดสอบ Flow และสรุป | 🟢 เสร็จสมบูรณ์ |

## วิธีสั่งงาน AI
1. เปิดไฟล์ Phase ที่ต้องการ
2. **Copy เฉพาะ TASK ที่ต้องการทำ** (เช่น *TASK 1.1*) 
3. วางใน Prompt พร้อมสั่ง "ทำ TASK X.X จากไฟล์นี้"
