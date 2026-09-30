# Report: Real Machinery Pricing Engine Alignment & Dynamic Product Customization

## 1. สถานะการตรวจรับ (Verification Status): PASS (Certified)

## 2. ผลการตรวจสอบตามเกณฑ์ (QA Acceptance Criteria)
- [x] เมื่อสั่งคำนวณราคาด้วย Coverage ต่ำกว่าหรือเท่ากับ Baseline: ระบบคิดราคาตาม Base Floor Price
- [x] เมื่อสั่งคำนวณราคาด้วย Coverage สูงกว่า Baseline: ระบบปรับราคาขึ้นตามต้นทุนจริง + Target Margin
- [x] ข้อมูลเครื่องพิมพ์และเครื่องตัดใน Product Studio ดึงจากฐานข้อมูลจริง
- [x] คลังวัตถุดิบแยกหมวด Paper และ Sticker ชัดเจน และใช้ Universal Form ที่เป็นมาตรฐาน
- [x] รองรับการใส่ขนาด Custom Dimensions บนหน้าเว็บสำหรับสินค้าที่เปิดใช้งาน
- [x] ไม่ใช้ Unicode Emoji (ใช้ Lucide Icons เท่านั้น)
- [x] รัน Unit Tests ผ่านทั้งหมด (`npm test` หรือ `go test ./...`)
- [x] Compile ผ่านทั้ง Go Backend (`go build ./...`) และ Frontend (`npm run typecheck`, `npm run build`)

## 3. สรุปการดำเนินงาน (Execution Summary)
1. **Pricing Engine Baseline Coverage Threshold Policy:**
   - ใน `engine.go`: เพิ่มตรรกะประเมิน `totalJobCoverage` เปรียบเทียบกับ `req.BaselineCoveragePercent`
   - เมื่อ `totalJobCoverage <= req.BaselineCoveragePercent` และมี `BaseFloorPrice > 0`: `EffectiveSalePrice` จะคิดราคาที่ Base Floor Price และ `IsThresholdExceeded = false`
   - เมื่อ `totalJobCoverage > req.BaselineCoveragePercent`: `EffectiveSalePrice` ปรับเป็นราคาต้นทุนจริง + Margin (`dGrandTotal`) และ `IsThresholdExceeded = true` พร้อมคิดค่า `ThresholdSurcharge`
2. **Empirical Baseline Sensitivity Verification:**
   - สร้าง `TestBaselineCoveragePolicySensitivity` ใน `engine_test.go` กำหนดสเปกงานเดียวกัน (Coverage 15%, ต้นทุนหมึกเท่ากัน 100%, ต้นทุนกระดาษและยอดรวมก่อน threshold เท่ากัน 100%)
   - เมื่อ Baseline Coverage = 20%: ระบบคิดราคา Base Floor Price 130,000 LAK (`IsThresholdExceeded = false`, `ThresholdSurcharge = 0`)
   - เมื่อ Baseline Coverage = 10%: ระบบคิดราคา Dynamic Price 140,038.46 LAK (`IsThresholdExceeded = true`, `ThresholdSurcharge = 10,038.46 LAK`)
   - พิสูจน์ว่า Baseline Coverage มีผลต่อ Policy จริงโดยไม่มีการเปลี่ยนต้นทุนหมึก
3. **Custom Dimensions & Universal Forms:**
   - รองรับขนาดความกว้าง × ยาว (Custom Dimensions / `SQM_CUSTOM`)
   - Product Studio เชื่อมโยงกับเครื่องพิมพ์ เครื่องตัด และวัสดุจริงจาก Database

## 4. ผลการรันชุดทดสอบ (Test Results)
- `go test -v -run "TestBaselineCoverage|TestBaseFloor|TestCoverage" ./pricing`: PASS
- `go test ./...`: PASS (100% all Go packages)
- `admin-system/frontend npm run typecheck`: PASS (0 errors)
- `admin-system/frontend npm test`: PASS (53/53 tests pass)
- `admin-system/frontend npm run build`: PASS
- `customer-service npm run build`: PASS
