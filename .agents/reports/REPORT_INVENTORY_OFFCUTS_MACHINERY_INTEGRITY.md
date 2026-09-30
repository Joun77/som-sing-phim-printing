# Report: Inventory Inbound Audit, Offcuts Lifecycle & Machinery Unification

## 1. สถานะการตรวจรับ (Verification Status): PASS (Certified)

## 2. ผลการตรวจสอบตามเกณฑ์ (QA Acceptance Criteria)
- [x] เมื่อแก้ไขบิลนำเข้า สต็อกใน `materials` ไม่บวมเบิ้ลซ้ำ และมีประวัติบันทึกใน `inbound_revision_logs`
- [x] บังคับกรอกเหตุผลในการแก้ไขบิลนำเข้าเสมอ และจำกัดสิทธิ์เฉพาะ Admin/Owner
- [x] สเปกและราคา Pro-rated ของเศษกระดาษในคลังไม่สูญหายหลังรีเฟรชหน้าจอ
- [x] ช่างสามารถลบเศษกระดาษออกจากระบบได้จริง (ไม่เด้งกลับมาหลังรีเฟรช)
- [x] เมื่อสั่งพิมพ์ออเดอร์ที่ใช้เศษกระดาษ (`IN_PRODUCTION`) ระบบตัดยอดใน `offcuts` จริง และไม่ตัดกระดาษแผ่นใหญ่ใน `materials`
- [x] หน้าเครื่องจักรไม่มีปุ่มกรอกเครื่องจักรลอยๆ อีกต่อไป ทุกเครื่องจักรต้องบันทึกผ่านหน้าจัดซื้อ
- [x] ไม่ใช้ Unicode Emoji ใน UI Component (ใช้ Lucide Icons เท่านั้น)
- [x] Compile ผ่านทั้งหมด (`go build ./...` และ `npm run build`)
- [x] Unit Tests ผ่านทั้งหมด (`go test ./...` และ `npm test`)

## 3. สรุปการดำเนินงาน (Execution Summary)
1. **Inbound Revision Logs & Stock Delta:** บันทึกประวัติการแก้ไขบิลนำเข้าลง `inbound_revision_logs` และปรับยอดสต็อกเฉพาะส่วนต่าง (Delta) โดยมี `isAsset` guard ป้องกันการนำเข้าเครื่องจักรลงตาราง `materials`
2. **Offcuts Persistence & Auto-deduction:** ปรับปรุงตาราง `offcuts` ให้เก็บ `cost_per_sheet`, สเปกกระดาษ, และมี API CRUD ครบถ้วน พร้อมตรรกะตัดสต็อกเศษกระดาษเมื่อเข้าสู่ `IN_PRODUCTION` โดยข้ามการตัดกระดาษแผ่นใหญ่
3. **Machinery Inbound Unification:** รวมศูนย์การลงทะเบียนเครื่องจักรให้ผ่านหน้า Inbound โดยตรง ป้องกันการสร้างเครื่องจักร Mock ลอยๆ
4. **Migration 042 Safe Archiving:** สำรองข้อมูล asset ที่เคยปะปนใน `materials` ลงตาราง `archived_material_assets` และลบเฉพาะแถวที่ตรวจสอบแล้วว่าไม่มี FK อ้างอิงอย่างปลอดภัย

## 4. ผลการรันชุดทดสอบ (Test Results)
- `go test ./inventory/...`: PASS
- `go test ./inbound/...`: PASS
- `admin-system/frontend npm run typecheck`: PASS (0 errors)
- `admin-system/frontend npm test`: PASS (53/53 tests pass)
- `admin-system/frontend npm run build`: PASS
- `customer-service npm run build`: PASS
