# Task 40: End-to-End CMYK Preflight Analysis Pipeline & Worker Integration

## 📌 Mission & Context

แก้ไขปัญหาข้อมูลการตรวจค่าสี (CMYK Coverage) ไม่ส่งต่อมายังหน้าตรวจสอบไฟล์และหน้าใบเสนอราคา โดยการเชื่อมโยงระบบ Preflight Worker เข้ากับ Background Queue และทำการ Callback ผลลัพธ์ % ความครอบคลุมหมึก (C, M, Y, K) เข้าสู่ State ของ `ItemSpecConfigurator` และ `QuotationManager` ทันทีเมื่อวิเคราะห์ไฟล์เสร็จสิ้น

---

## 🎯 สรุปการแบ่งระยะงาน (Phase Breakdown)

\[ Phase 1: Preflight Worker & Backend API Binding \] ──► \[ Phase 2: Frontend Upload & Progress State Listener \] ──► \[ Phase 3: Auto-Populate CMYK to Pricing Engine State \]

---

## 🚀 รายละเอียดการดำเนินงานแต่ละเฟส (Detailed Specifications)

### 🔹 Phase 1: Preflight Worker & Backend Analysis Endpoint

- **Target Files:**  
    
  - `internal/worker/pdf_analyzer.go`  
  - `cmd/worker/main.go`  
  - `admin-system/backend/orders/upload.go` (หรือ `main.go`)


- **Technical Specs:**  
    
  1. ใน Go Backend สร้าง/ปรับปรุง Endpoint สำหรับอัปโหลดและส่งเข้า Worker Queue:  
     - `POST /api/preflight/analyze`  
     - รับไฟล์ PDF/TIFF/PNG บันทึกลง Storage และส่ง Job ID เข้า Channel/Redis Queue  
  2. ใน `internal/worker/pdf_analyzer.go`:  
     - วิเคราะห์ค่าสีของไฟล์แต่ละหน้า:  
       - คำนวณ `Cyan %`, `Magenta %`, `Yellow %`, `Key/Black %`  
       - รวม `totalCoverage = C + M + Y + K`  
       - แยก `blackCoverage = K %` และ `colorCoverage = C + M + Y %`  
       - ตรวจสอบความละเอียด (DPI), สเปก Bleed (3mm), และฟอนต์ที่ไม่ได้ Convert to Curve  
  3. ส่งผลการวิเคราะห์คืนทาง HTTP หรือ Server-Sent Events (SSE):  
       
     {  
       
       "status": "COMPLETED",  
       
       "fileUrl": "http://localhost:8080/uploads/artwork-xxx.pdf",  
       
       "fileName": "sample-brochure.pdf",  
       
       "analysis": {  
       
         "pageCount": 4,  
       
         "cmyk": { "c": 22.5, "m": 18.0, "y": 14.2, "k": 8.5 },  
       
         "blackCoverage": 8.5,  
       
         "colorCoverage": 54.7,  
       
         "resolutionDpi": 300,  
       
         "hasBleed": true,  
       
         "colorSpace": "CMYK"  
       
       }  
       
     }

---

### 🔹 Phase 2: Preflight Verification Component & Upload State Handling

- **Target Files:**  
    
  - `admin-system/frontend/src/components/admin/PreFlightVerificationCard.tsx`  
  - `admin-system/frontend/src/components/PreflightChecker.tsx`  
  - `admin-system/frontend/src/features/quotations/QuotationManager.tsx`


- **Technical Specs:**  
    
  1. ใน `PreFlightVerificationCard.tsx`:  
     - เมื่อผู้ใช้ลากหรือเลือกไฟล์งานพิมพ์ ให้แสดงสถานะ Loading Spinner พร้อมข้อความ "กำลังวิเคราะห์ค่าสี CMYK และความละเอียดไฟล์..."  
     - เมื่อได้รับ Response ให้แสดง Progress Bar แยก 4 สี (Cyan, Magenta, Yellow, Black)  
     - มีปุ่ม "นำค่าสีเข้าสู่การคิดราคา" (Apply CMYK to Spec) หรือทำการ Apply อัตโนมัติ

---

### 🔹 Phase 3: Auto-Populate CMYK to Pricing Engine State

- **Target Files:**  
    
  - `admin-system/frontend/src/components/pricing/ItemSpecConfigurator.tsx`  
  - `admin-system/frontend/src/features/quotations/QuotationManager.tsx`  
  - `admin-system/frontend/src/features/orders/steps/ItemSpecStep.tsx`


- **Technical Specs:**  
    
  1. ส่ง Callback `onPreflightComplete(analysisData)` จาก Preflight Component ไปยัง Parent:  
       
     const handlePreflightComplete \= (result: PreflightResult) \=\> {  
       
       setSpecs((prev) \=\> ({  
       
         ...prev,  
       
         blackCoverage: result.analysis.blackCoverage,  
       
         colorCoverage: result.analysis.colorCoverage,  
       
         cmykBreakdown: result.analysis.cmyk,  
       
         artworkUrl: result.fileUrl,  
       
         artworkFileName: result.fileName,  
       
       }));  
       
     };  
       
  2. ใน `ItemSpecConfigurator.tsx`:  
     - เมื่อได้รับ `blackCoverage` และ `colorCoverage` ให้ Slider และกล่องแสดง % ปรับตามค่าจริงทันที  
     - กล่อง Live Cost Breakdown จะคำนวณต้นทุนหมึกพิมพ์ใหม่อัตโนมัติตามค่าสีที่ตรวจได้

---

## 📋 Verification & Acceptance Criteria

- เมื่ออัปโหลดไฟล์ PDF ในหน้า Preflight หรือหน้าใบเสนอราคา ข้อมูลค่าสี CMYK (C, M, Y, K) และ % หมึกจะแสดงผลบนหน้าจออย่างถูกต้องภายใน 2-3 วินาที  
- ค่า % หมึกดำ (K) และหมึกสี (CMY) ถูกส่งเข้าช่องกรอกของ `ItemSpecConfigurator` โดยอัตโนมัติ ไม่เป็นค่าว่างหรือ 0%  
- ต้นทุนหมึกพิมพ์ในกล่องสรุปราคาอัปเดตสอดคล้องกับค่าความครอบคลุมหมึกที่ตรวจได้จริง

