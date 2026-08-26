# Phase 2: Pricing Engine Financial Precision & Client-Backend Sync (P1)

## 🎯 วัตถุประสงค์
ปรับปรุงความแม่นยำในการคำนวณต้นทุน/ราคาขาย ไม่ให้เกิดความคลาดเคลื่อนจาก `float64` และบังคับใช้ Go Backend Engine เป็น Single Source of Truth ก่อนสั่งซื้อ

---

## 📋 รายการงานย่อย (Tasks Checklist)

### [Task 2.1] Decimal Precision Refactoring ใน Go Pricing Engine
- **ไฟล์เป้าหมาย:** `admin-system/backend/pricing/engine.go`
- **สิ่งที่ต้องทำ:**
  1. ตรวจสอบและเปลี่ยนตัวแปรต้นทุนย่อย (Paper, Ink, Machine Depreciation, Overhead, Finishing) ให้คำนวณผ่าน `decimal.Decimal`
  2. กำหนดเกณฑ์การปัดเศษ (Rounding Mode) ให้ตรงตามมาตรฐานของแต่ละสกุลเงิน (LAK ปัดเป็นหลักพัน, THB ปัด 2 ตำแหน่ง)
  3. ปรับปรุง `admin-system/backend/pricing/engine_test.go` ครอบคลุม Edge Cases

### [Task 2.2] Server-Side Quote Validation ใน Customer Service Flow
- **ไฟล์เป้าหมาย:** `customer-service/src/hooks/useDynamicPriceCalculator.ts`, `customer-service/src/api/client.ts`, `customer-service/src/components/OrderCustomizerForm.tsx`
- **สิ่งที่ต้องทำ:**
  1. ใช้ Local Calculation เพื่อความลื่นไหลในการปรับสไลเดอร์/ตัวเลือก (Fast Preview)
  2. เมื่อผู้ใช้คลิก "สรุปใบเสนอราคา" หรือ "ดำเนินการสั่งซื้อ" ให้เรียก `POST /v1/pricing/calculate` ยืนยันราคาสุทธิจาก Go Engine เสมอ
  3. ป้องกันการส่งยอดเงินรวมที่คำนวณจาก Frontend เข้าไปบันทึกเป็น Order โดยตรง

### [Task 2.3] Exchange Rate Resilience & Fallback
- **ไฟล์เป้าหมาย:** `admin-system/backend/pricing/currency_proxy.go`, `admin-system/backend/pricing/rates.go`
- **สิ่งที่ต้องทำ:**
  1. เพิ่มตาราง Fallback Exchange Rates ใน Database กรณีเชื่อมต่อ API ค่าเงินภายนอกไม่สำเร็จ
  2. มีบันทึก Timestamp อัตราแลกเปลี่ยนที่ใช้คำนวณในแต่ละใบเสนอราคา

---

## 🔍 แผนการตรวจรับงาน (Verification Gate)
- [x] รัน `go test ./pricing/...` ผ่าน 100%
- [x] แก้ไขความแม่นยำ Decimal ใน Breakdown ให้สอดคล้องกันทุกหน่วย
- [x] เพิ่ม Material SKU Matching ใน Offcut Recycling Engine ป้องกันการจับคู่วัสดุผิดประเภท
- [x] ตรวจสอบ Fallback Exchange Rates และ Endpoint อัตราแลกเปลี่ยนครบถ้วน
