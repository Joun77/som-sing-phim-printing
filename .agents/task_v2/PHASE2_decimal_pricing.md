# PHASE 2: High-Precision Pricing Engine (Decimal Refactor)

## TASK 2.1: Replace float64 in Pricing Models
**รายละเอียด:**
- ไฟล์เป้าหมาย: `backend/pricing/engine.go`
- เปลี่ยนประเภทตัวแปรที่เป็นเงินและอัตราส่วนทั้งหมดจาก `float64` เป็น `decimal.Decimal` (อ้างอิง: `github.com/shopspring/decimal`)
- ตรวจสอบ struct `CalculationRequest`, `CalculationResponse`, และ Struct ย่อยทั้งหมดที่เกี่ยวข้อง

## TASK 2.2: Refactor Pricing Logic & Math Operations
**รายละเอียด:**
- ไฟล์เป้าหมาย: `backend/pricing/engine.go`
- แก้ไขการคูณ หาร บวก ลบ (จากเครื่องหมาย `+`, `-`, `*`, `/`) เป็น method ของ Decimal เช่น `.Add()`, `.Sub()`, `.Mul()`, `.Div()`
- คงไว้ซึ่ง Logic การคำนวณราคาหมึก กระดาษ เพลท และอื่นๆ อย่างครบถ้วน

## TASK 2.3: Update Order Models & Integration
**รายละเอียด:**
- ไฟล์เป้าหมาย: `backend/orders/models.go` และ `backend/orders/handlers.go`
- อัปเดต Model `OrderItem` และ `Order` ให้ตัวแปรจำพวก Cost, Price รองรับค่า Decimal (หรือทำการ Mapping ที่ถูกต้องถ้าต้องตอบกลับเป็น JSON Number ให้ Frontend)
- แก้ไขจุดที่ Orders ทำการเรียกใช้ (Call) ฟังก์ชัน `pricing.CalculateJobPricing`

## TASK 2.4: Fix Pricing Unit Tests
**รายละเอียด:**
- ไฟล์เป้าหมาย: `backend/pricing/engine_test.go`
- แก้ไข Test Data และ Assertion ในไฟล์ Test ทั้งหมดให้สอดคล้องกับ `decimal.Decimal` และต้องทำให้ Test ผ่านทั้งหมด
