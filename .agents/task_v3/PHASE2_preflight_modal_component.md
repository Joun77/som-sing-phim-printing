# PHASE 2: Preflight & Color Analyzer Modal Component

## 🎯 Role: UI/UX & React Component Specialist
## 📁 Target Files:
- `admin-system/frontend/src/components/PreflightItemCreationModal.tsx` [NEW]

---

## 📋 Task Requirements:
1. **Modal Layout & Steps:**
   - **Step 1: Upload / Drop Zone:** รองรับการลากวางไฟล์ PDF, PNG, JPG, TIFF, PSD
   - **Step 2: Paper Size Selection:** ปุ่มเลือกขนาดกระดาษที่ลูกค้าจะสั่งพิมพ์ (A4: 210×297 mm, A5: 148×210 mm, A3: 297×420 mm, หรือระบุ Custom mm)
   - **Step 3: Progress & Real-time Scan Feedback:** แถบความคืบหน้า (Progress Bar) พร้อมตัวเลขนับหน้า เช่น `ກຳລັງກວດສອບ: ໜ້າ 85 / 150 (56%)...`
   - **Step 4: Comprehensive Summary Card:**
     - จำนวนหน้าทั้งหมด (Total Pages)
     - สรุปหน้าสี: `X หน้า` พร้อมค่าแถบสี CMYK
     - สรุปหน้าขาวดำ: `Y หน้า` พร้อมค่าแถบสี K
     - ตรวจสอบ Bleed, DPI และคำเตือน RGB
2. **Action Buttons:**
   - **"ຕົກລົງ / ນຳໃຊ້ຂໍ້ມູນສ້າງລາຍການ" (OK / Apply & Create Item):** ส่งข้อมูลที่วิเคราะห์ได้กลับไปยัง Parent Component เพื่อเปิด Item ใหม่
   - **"ຂ້າມ / ສ້າງລາຍການເປົ່າ" (Skip / Create Blank Manual Item):** ข้ามการตรวจไฟล์แล้วเปิด Item เปล่าแบบกรอกมือตามเดิม
   - **"ປິດ" (Close / Cancel)**
