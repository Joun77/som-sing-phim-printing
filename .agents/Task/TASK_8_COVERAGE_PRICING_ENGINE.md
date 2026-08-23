# Task 8: Dynamic Pricing & Ink Coverage Compensation Engine

## Objective
พัฒนากลไกการคำนวณราคาใน Pricing Engine ฝั่ง Go Backend ให้รองรับการชดเชยค่าหมึกตามค่า Coverage จริง, การคิดค่าบริการออปชันเสริม (ตาไก่, เคลือบ, พับขอบ), และการบังคับใช้ MOQ / Minimum Charge Floor

## Target Files
- `backend/internal/service/pricing_service.go`
- `backend/internal/handler/pricing_handler.go`

## Technical Requirements
1. `backend/internal/service/pricing_service.go`:
   - ฟังก์ชัน `CalculatePrice(ctx context.Context, req domain.PricingCalculationRequest) (*domain.PriceBreakdown, error)`
   - ดึง Template และค่าต้นทุน `cost_per_ml` ของเครื่องพิมพ์/หมึก
   - **กฎ Ink Coverage:**
     - ถ้า `ActualCoverage <= BaselineCoverage`: ใช้อัตราคิดราคามาตรฐาน
     - ถ้า `ActualCoverage > BaselineCoverage`: คำนวณ Extra Ink Surcharge เพิ่มเติมตามสัดส่วน
   - **กฎ Add-ons:**
     - ตาไก่: คำนวณตามจำนวนจุดจริง (เช่น 4 มุม หรือรอบขอบ) $\times$ `grommets_unit_price`
     - เคลือบ/พับขอบ: คำนวณตามพื้นที่ ($m^2$) หรือความยาวรอบรูป (เมตร)
   - **กฎ MOQ & Min Price:**
     - ตรวจสอบ `Quantity >= MinOrderQuantity`
     - หากยอดรวมคำนวณได้น้อยกว่า `MinTotalPrice` ให้ปรับขึ้นเป็น `MinTotalPrice`
2. อัปเดต Handler ให้ตอบกลับ JSON Breakdown ละเอียด (Base Price, Coverage Surcharge, Addon Cost, Final Price)