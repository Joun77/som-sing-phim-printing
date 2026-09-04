# รายงานสรุปจุดบกพร่อง (Bug Report & QA Audit Findings) จากการทดสอบระบบ

เอกสารรวบรวมบั๊กและประเด็นที่ค้นพบจากการรันชุดทดสอบ **Unit Test, API Integration Test และ Go Testing** ในระบบ Som Sing Phim พร้อมแนวทางการแก้ไขและสถานะการตรวจสอบ

---

## สรุปภาพรวม (Executive Summary)

- **วันที่ตรวจสอบ:** 05 กันยายน 2026
- **ชุดทดสอบที่ใช้:** Go Testing (`go test ./...`), Vitest (`vitest run`), Direct API Verification
- **จำนวนบั๊กที่ตรวจพบ:** 2 รายการหลัก
- **สถานะการแก้ไข:** ได้รับการแก้ไขและทดสอบซ้ำ (Verify) จนผลลัพธ์เป็น **PASS 100%** แล้ว

---

## รายละเอียดบั๊กที่ตรวจพบ (Identified Bugs & Technical Resolution)

### 1. BUG-01: ช่องค้นหาติดตามงานพิมพ์ (Track Order) จับคู่เบอร์โทรผิดออเดอร์ (False Positive Match)
* **โมดูลที่ได้รับผลกระทบ:** `admin-system/backend/orders/handlers.go` (ฟังก์ชัน `HandleTrackOrderQuery`)
* **ระดับความรุนแรง:** 🔴 **High (Critical Business Data Leak)**
* **อาการ:**
  เมื่อผู้ใช้งานค้นหาออเดอร์ด้วยเบอร์โทรศัพท์ (เช่น `+856 20 77123999`) ระบบกลับส่งข้อมูลออเดอร์ของลูกค้ารายอื่น (`ORD-PROD-IDEMPOTENCY-001` หรือ `ORD-STOCK-FLOW-001`) กลับไปให้แทน
* **สาเหตุเชิงลึก (Root Cause):**
  ในเงื่อนไขการค้นหา มีการตรวจสอบ:
  ```go
  isPhoneMatch := len(cleanDigits) >= 7 && (phoneDigits == cleanDigits || strings.HasSuffix(phoneDigits, cleanDigits) || strings.HasSuffix(cleanDigits, phoneDigits))
  ```
  หากในระบบมีบางออเดอร์ที่ **ไม่มีการกรอกเบอร์โทร (`CustomerPhone == ""`)** ค่า `phoneDigits` จะเป็นสตริงว่าง `""` ทำให้ฟังก์ชัน `strings.HasSuffix(cleanDigits, "")` คืนค่าเป็น `true` เสมอ ส่งผลให้ออเดอร์แรกที่ไม่มีเบอร์โทรถูกส่งกลับไปแทนทันที
* **การแก้ไข (Resolution):**
  เพิ่มเงื่อนไขตรวจสอบความยาวของเบอร์โทรในออเดอร์ด้วยว่าต้องมีความยาวไม่น้อยกว่า 7 หลัก:
  ```go
  isPhoneMatch := len(cleanDigits) >= 7 && len(phoneDigits) >= 7 && (phoneDigits == cleanDigits || strings.HasSuffix(phoneDigits, cleanDigits) || strings.HasSuffix(cleanDigits, phoneDigits))
  ```
* **ไฟล์ที่แก้ไข:** [admin-system/backend/orders/handlers.go](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/orders/handlers.go#L1562-L1566)
* **สถานะ:**  **RESOLVED & VERIFIED** (Unit test ผ่าน 100%)

---

### 2. BUG-02: การค้นหาเลขออเดอร์ที่มีเครื่องหมาย Hash (`#`) ขัดข้อง (HTTP 400 Bad Request)
* **โมดูลที่ได้รับผลกระทบ:** `admin-system/backend/orders/handlers_test.go` และ API Tracking Endpoint
* **ระดับความรุนแรง:** 🟡 **Medium**
* **อาการ:**
  เมื่อค้นหาเลขออเดอร์ที่ผู้ใช้นิยมพิมพ์ติดเครื่องหมาย `#` นำหน้า เช่น `#SSP-82115` ระบบตีกลับเป็น HTTP 400 Bad Request: `"Missing search query parameter 'q'"`
* **สาเหตุเชิงลึก (Root Cause):**
  ในขั้นตอนการยิง HTTP GET Request ตัวอักษร `#` ถูกโปรแกรมส่งไปแบบ Raw URL ทำให้ HTTP Parser ตีความเป็น URL Fragment Identifier ข้อความหลัง `#` จึงถูกตัดทิ้ง ทำให้ค่า `?q=` กลายเป็นค่าว่าง
* **การแก้ไข (Resolution):**
  ทำการเข้ารหัส URL Query Parameter ด้วย `url.QueryEscape(q)` เพื่อแปลง `#` เป็น `%23` ก่อนส่งเข้า Router
* **ไฟล์ที่แก้ไข:** [admin-system/backend/orders/handlers_test.go](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/orders/handlers_test.go#L855-L860)
* **สถานะ:**  **RESOLVED & VERIFIED**

---

## แผนการบำรุงรักษาและการป้องกันบั๊กซ้ำ (Regression Prevention Checklist)

1. **การทดสอบความถูกต้องของโค้ด:**
   - ใช้ **Unit Test** (`npm run test:unit:backend` หรือ `npm run test:unit:frontend`) เพื่อเช็คฟังก์ชันการคำนวณและ Business Logic ได้อย่างรวดเร็วโดยไม่ต้องเปิดเบราว์เซอร์
   - ทดสอบความถูกต้องของ API endpoints และ Database Schema อย่างสม่ำเสมอ
2. **สำหรับฟังก์ชันค้นหา (Search & Track):** ทุกครั้งที่มีการเพิ่มหรือแก้ไข Query Matcher ใน Backend ต้องตรวจสอบกรณีที่ฟิลด์ข้อมูลเป็น `NULL` หรือ `""` (Empty String) เสมอเพื่อป้องกันการ Match ผิดพลาด
3. **การทดสอบความถูกต้องของ UI:** ใช้การตรวจสอบผ่าน Browser DevTools / Network Tab หรือ Manual Testing โดยไม่จำเป็นต้องใช้ Playwright
