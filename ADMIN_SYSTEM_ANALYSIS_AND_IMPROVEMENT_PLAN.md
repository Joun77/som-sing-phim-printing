📘 MASTER SYSTEM SPECIFICATION & AI AGENT EXECUTION BLUEPRINTSom Sing Phim Admin System (ສົມສິ່ງພິມ)Primary Tech Stack: Go Backend + PostgreSQL/GORM + React / TypeScript FrontendCurrency Base: Lao Kip (LAK / ກີບ)Storage Engine: Local File System (./uploads/orders/)Preflight Engine: Ghostscript CLI (inkcov) with Manual FallbackTarget Execution Environment: IDE AI Agent (Antigravity / Cursor / Windsurf / Cline)📑 สารบัญ (Table of Contents)บริบทธุรกิจและมุมมอง 4 บทบาท (Business Context & 4 Perspectives)การจำลองสถานการณ์ผลิตจริง (Simulation: Bilingual Book Printing)ระบบตรวจสกัดค่าสี CMYK จาก PDF และ UI 2 ปุ่ม (Preflight Checker & 2-Button UX Flow)โครงสร้างฐานข้อมูลและโมเดลข้อมูล (Database Schema & Go Models)สูตรการคำนวณราคาและค่าเสื่อมเครื่องเข้าเล่ม 5 ประเภท (Dynamic Pricing & Binding Logic)ใบสั่งพิมพ์แผ่นเดียวพร้อม QR Code (Single-Sheet A4 Job Ticket Specification)ระบบติดตามสถานะการผลิตหน้างาน (Shop Floor Tracker UI & Confirmation Modals)Master Prompt สำหรับสั่งงาน AI Agent แบบ Step-by-Step1. บริบทธุรกิจและมุมมอง 4 บทบาท1.1 การผสาน 4 บทบาทเพื่อขับเคลื่อนระบบ (Solo Entrepreneur Model)ผู้บริหาร (Executive / Business Owner):บริหารงานคนเดียว (Solo Business) ต้องการระบบที่เรียบง่าย คล่องตัว ไม่ออกแบบซับซ้อนเกินความจำเป็นบันทึกบัญชีและตั้งราคาขายด้วยสกุลเงินหลัก LAK (กีบ)ควบคุมต้นทุนจริงแม่นยำ (กระดาษ, น้ำหมึก, ค่าเสื่อมเครื่องพิมพ์, ค่าเสื่อมเครื่องเข้าเล่ม, วัสดุสิ้นเปลือง)นักวางแผนและออกแบบระบบ (System Architect):วางโครงสร้างแบบ Master-Detail (1 Order : N Job Items) เพื่อให้งานที่มีหลายรายการหรือหลายภาษา รวมบิลและพิมพ์ใบสั่งงานชุดเดียวกันได้ออกแบบระบบสกัดค่าสีจากไฟล์ PDF ของลูกค้าโดยอัตโนมัติ เพื่อดึงค่า % CMYK Coverage จริงไปเข้าสูตรคำนวณราคาออกแบบการเก็บไฟล์งานไว้ใน Local Storage (./uploads/orders/) แยกโฟลเดอร์ตามเลขออเดอร์อย่างเป็นระบบนักพัฒนาระบบ (Full-Stack Developer):Backend: ใช้ภาษา Go (Golang) มีความเสถียร ประมวลผลเร็ว ประมวลผลคำสั่ง CLI และจัดการตัวเลขทางการเงินได้แม่นยำFrontend: React + TypeScript + Tailwind CSS รองรับภาษาลาว (Saysettha OT / Noto Sans Lao)Data Persistence สมบูรณ์ ข้อมูลไม่สูญหายเมื่อเปิดซ้ำหรือ Refreshพนักงานโรงพิมพ์ / ช่างพิมพ์หน้าแท่น (Shop Floor Operator):เปิดดูและดาวน์โหลดไฟล์งาน (แยกไฟล์ปก และ ไฟล์เนื้อใน) จากระบบไปลงเครื่องพิมพ์ได้ทันทีสแกน QR Code บนใบ Job Ticket เพื่อเปิดหน้าเว็บย่อยบนมือถือ/แท็บเล็ต แล้วกดอัปเดตสถานะการผลิตทีละขั้นตอนพร้อม Modal ยืนยันบันทึกจำนวนกระดาษเสียจริง (Actual Spoilage) เพื่อเปรียบเทียบกับค่าเผื่อเสีย 5% ของระบบ2. การจำลองสถานการณ์ผลิตจริง (Simulation: Bilingual Book Printing)📌 โจทย์จำลองการผลิต:ชื่องาน: คู่มือธุรกิจ 2 ภาษา (Bilingual Business Handbook)Job Item 1 (ฉบับภาษาลาว): จำนวน 100 เล่มเนื้อใน: ขนาด A5 จำนวน 120 หน้า (60 แผ่นพิมพ์หน้า-หลัง Duplex) กระดาษ Green Read 80 แกรม พิมพ์ 1 สี ดำ (K) ➔ แนบไฟล์ Inner_Lao.pdfปก: กระดาษ Art Card 260 แกรม พิมพ์ 4 สี (CMYK) ด้านนอก เคลือบด้าน ➔ แนบไฟล์ Cover_Lao.pdfการเข้าเล่ม: สันกาวร้อน (Spine Width คำนวณอัตโนมัติ ~6.5 มม.)Job Item 2 (ฉบับภาษาอังกฤษ): จำนวน 100 เล่มสเปกกระดาษ การพิมพ์ และการเข้าเล่มเหมือน Item 1 แต่ใช้ไฟล์เนื้อหาภาษาอังกฤษ ➔ แนบไฟล์ Cover_Eng.pdf และ Inner_Eng.pdf3. ระบบตรวจสกัดค่าสี CMYK จาก PDF และ UI 2 ปุ่ม3.1 หลักการคำนวณหาค่าเฉลี่ย % Coverage ทั้งเล่มในหนังสือที่มีจำนวนหลายหน้า (เช่น 120 หน้า) แต่ละหน้ามีปริมาณหมึกไม่เท่ากัน ระบบจะรันคำสั่ง Ghostscript (inkcov) เพื่ออ่านค่าสีทุกหน้า แล้วนำมาหา ค่าเฉลี่ยต่อหน้า (Average Coverage per Page):# คำสั่ง CLI ที่ Go Backend เรียกใช้
gs -q -o - -sDEVICE=inkcov input_customer.pdf
ตัวอย่าง Output จาก Ghostscript ที่ระบบอ่านได้: 0.00000  0.00000  0.00000  0.08200 CMYK OK (Page 1: ตัวหนังสือ K 8.2%)
 0.12500  0.15400  0.04500  0.22000 CMYK OK (Page 2: มีรูปภาพ C 12.5%, M 15.4%, Y 4.5%, K 22.0%)
 ...
 0.00000  0.00000  0.00000  0.05100 CMYK OK (Page 120: ตัวหนังสือ K 5.1%)
สูตรคำนวณค่าเฉลี่ย % CMYK ทั้งเอกสาร:$$\text{Avg Coverage } (C, M, Y, K) = \frac{\sum_{i=1}^{N} \text{Coverage Page } i}{N \text{ (Total Pages)}}$$3.2 สถาปัตยกรรม UI แบบ 2 ปุ่มกด (2-Button Preflight UX Flow)[ แถบตรวจค่าสี / Preflight Tab ]
              │
              ▼
    ( ลากไฟล์ PDF มาวาง / Upload )
              │
              ▼
   [ Ghostscript ประมวลผล ]
              │
              ▼
 ┌───────────────────────────────────────────────────────────┐
 │  📊 ผลการตรวจสกัดค่าสี CMYK (เฉลี่ย 120 หน้า)                 │
 │  🔵 Cyan: 2.15%   🔴 Magenta: 3.40%                      │
 │  🟡 Yellow: 1.80%  ⚫ Black/Key: 7.50%                    │
 │  [ ✅ ໄຟລ໌ CMYK ມາດຕະຖານ / 120 ໜ້າ / ขนาด A5 ]              │
 ├───────────────────────────────────────────────────────────┤
 │                                                           │
 │  [ 🟢 ปุ่มที่ 1: ส่งค่านำไปสร้างใบเสนอราคา ]                    │
 │    └─► โยนค่า % สี + จำนวนหน้า + ไฟล์ เข้าฟอร์ม Quotation อัตโนมัติ │
 │                                                           │
 │  [ ⚪ ปุ่มที่ 2: ข้าม / ไปกรอกค่าสีเอง ]                       │
 │    └─► ปิดหน้าตรวจไฟล์ แล้วเปิดฟอร์ม Quotation ให้พิมพ์กรอกเอง    │
 └───────────────────────────────────────────────────────────┘
4. โครงสร้างฐานข้อมูลและโมเดลข้อมูล (Database Schema & Go Models)┌─────────────────────────────────────────────────────────────┐
│                       orders (Master)                       │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                     │
│ order_no (VARCHAR) - เช่น ORD-202608-001                    │
│ customer_id, customer_name, customer_phone                 │
│ total_amount_lak, deposit_lak, remaining_lak                │
│ overall_status (PENDING / IN_PRODUCTION / READY / COMPLETED)│
│ delivery_date, created_at, updated_at                       │
└──────────────────────────────┬──────────────────────────────┘
                               │ 1
                               │
                               │ N
┌──────────────────────────────┴──────────────────────────────┐
│                    order_items (Detail)                     │
├─────────────────────────────────────────────────────────────┤
│ id (PK), order_id (FK)                                      │
│ item_name (VARCHAR) - เช่น ປຶ້ມພາສາລາວ                      │
│ quantity (INT) - เช่น 100                                   │
│ page_count (INT) - เช่น 120                                 │
│ paper_size (VARCHAR) - A5, A4, etc.                         │
│ cover_paper_id, inner_paper_id                              │
│ cover_file_url, inner_file_url                              │
│ binding_type (NONE, PERFECT_HOT_GLUE, SADDLE_STITCH, ...)   │
│ spine_width_mm (FLOAT) - ความหนาสันปก                       │
│ current_step (INNER_PRINTED, COVER_PRINTED, BOUND, ...)     │
│ avg_cov_c, avg_cov_m, avg_cov_y, avg_cov_k (FLOAT)         │
│ unit_cost_lak, unit_price_lak, total_price_lak              │
│ created_at, updated_at                                      │
└─────────────────────────────────────────────────────────────┘
5. สูตรการคำนวณราคาและค่าเสื่อมเครื่องเข้าเล่ม 5 ประเภท (Dynamic Pricing & Binding Logic)5.1 สูตรคำนวณความหนาสันปก (Spine Width Calculation)$$\text{Spine Width (mm)} = \left( \frac{\text{Page Count}}{2} \times \text{Sheet Thickness} \right) + \text{Cover \& Glue Offset}$$กระดาษ Green Read 80g: $\text{Sheet Thickness} = 0.105 \text{ mm}$Offset เผื่อความหนาปก Art Card 260g + กาวร้อน $= 0.80 \text{ mm}$ตัวอย่าง 120 หน้า: $(60 \times 0.105) + 0.80 = \mathbf{7.1 \text{ mm}}$5.2 สูตรคำนวณค่าเข้าเล่ม 5 ประเภท (Binding Cost)$$\text{Binding Cost per Book (LAK)} = \text{Machine Depreciation per Cycle} + \text{Consumable Cost}$$$$\text{Machine Depreciation} = \frac{\text{Machine Purchase Price (LAK)} \times (1 + \text{Maint}\%)}{\text{Lifetime Cycles (จำนวนครั้งที่ใช้งานได้ตลอดอายุเครื่อง)}}$$ตารางอัตราต้นทุนวัสดุสิ้นเปลืองเข้าเล่มโดยประมาณ (LAK):ประเภทการเข้าเล่ม (Binding Type)ค่าวัสดุสิ้นเปลืองต่อเล่ม (Consumable)หมายเหตุ1. สันกาวร้อน (PERFECT_HOT_GLUE)350 กีบเม็ดกาวร้อนเกรดมาตรฐาน2. เย็บมุงหลังคา (SADDLE_STITCH)100 กีบลวดเย็บเบอร์มาตรฐาน3. สันห่วงลวด ดับเบิ้ลโอ (WIRE_O)2,500 กีบห่วงลวดคู่ตามขนาดข้อ4. สันกระดูกงูพลาสติก (PLASTIC_COMB)1,500 กีบสันพลาสติกเกรดเหนียว5. สันปฏิทินแบบมีแขวน (CALENDAR)3,500 กีบสันห่วงปฏิทิน + ลวดแขวนผนัง5.3 สูตรคำนวณต้นทุนรวมและราคาขาย (Total Dynamic Pricing Formula)$$\text{Subtotal} = \text{Ink Cost (CMYK)} + \text{Paper Cost} + \text{Printer Machine Wear} + \text{Binding Cost}$$$$\text{Total Unit Cost} = \text{Subtotal} \times 1.05 \quad (\text{เผื่อเสีย Spoilage } 5\%)$$$$\text{Unit Selling Price} = \text{Total Unit Cost} \times \left(1 + \frac{\text{Profit}\%}{100}\right)$$6. ใบสั่งพิมพ์แผ่นเดียวพร้อม QR Code (Single-Sheet A4 Job Ticket Specification)โครงสร้าง Layout ของไฟล์ PDF Job Ticket (backend/orders/pdf.go) ขนาด A4 แผ่นเดียว:Header Block:โลโก้ร้าน ສົມສິ່ງພິມ (SOM SING PHIM)เลขที่ออเดอร์ (ORD-202608-001), วันที่สั่งงาน, กำหนดส่งมอบชื่อลูกค้า, เบอร์โทรศัพท์, สรุปยอดเงิน (LAK)Top-Right Block:ภาพ QR Code ขนาด $35 \times 35 \text{ mm}$ สำหรับสแกนเข้าสู่ URL https://admin.somsingphim.com/track/ORD-202608-001Job Items Table (Multi-Item Section):ตารางแยกแถว Job Item 1 และ Job Item 2 ชัดเจนแสดงชื่อ Job, จำนวน, ขนาดสำเร็จ, สเปกกระดาษปก/เนื้อใน, ความหนาสันปก (Spine mm), ประเภทเข้าเล่ม, และชื่อไฟล์ ArtworkFooter Checklist & Spoilage Area:ตาราง Checkbox สเต็ปงานผลิตสำหรับช่างติ๊กด้วยมือช่องกรอก "จำนวนกระดาษเสียจริง (Actual Spoilage Count)"ช่องลายเซ็นช่างพิมพ์และผู้ตรวจรับงาน7. ระบบติดตามสถานะการผลิตหน้างาน (Shop Floor Tracker UI & Confirmation Modals)เมื่อช่างพิมพ์สแกน QR Code บน Job Ticket จะเปิดหน้า /track/:order_no บนมือถือหรือแท็บเล็ต แสดงปุ่มกดขั้นตอนการผลิตแบบ One-Tap และมี Modal Alert ยืนยันการทำงานทีละสเต็ป:┌───────────────────────────────────────────────────────────┐
│  🔖 ORD-202608-001 [ສົມພອນ]                               │
│  ຍອດລວມ: 1,850,000 ກີບ (ມັດຈຳແລ້ວ 50%)                     │
├───────────────────────────────────────────────────────────┤
│  Item 1: ປຶ້ມພາສາລາວ (100 ຫົວ)                            │
│  [📥 ດາວໂຫຼດໄຟລ໌ປົກ]  [📥 ດາວໂຫຼດໄຟລ໌ເນື້ອໃນ]                   │
│                                                           │
│  ຂັ້ນຕອນການຜະລິດ (ກົດເພື່ອອັບເດດ):                            │
│  [ 🟢 1. ພິມເນື້ອໃນແລ້ວ ]  ➔  Modal: "📄 ພິມເນື້ອໃນສຳເລັດແລ້ວ!" │
│  [ ⚪ 2. ພິມປົກແລ້ວ ]       ➔  Modal: "🎨 ພິມໜ້າປົກສຳເລັດແລ້ວ!"  │
│  [ ⚪ 3. ເຄືອບປົກແລ້ວ ]     ➔  Modal: "✨ ເຄືອບໜ້າປົກສຳເລັດແລ້ວ!" │
│  [ ⚪ 4. ຕັດເຈ້ຍແລ້ວ ]      ➔  Modal: "✂️ ຕັດເຈ້ຍ/ເຈຽນສຳເລັດ!"   │
│  [ ⚪ 5. ເຂົ້າສັນແລ້ວ ]      ➔  Modal: "📘 ເຂົ້າສັນປຶ້ມສຳເລັດແລ້ວ!" │
│  [ ⚪ 6. QC ພ້ອມມອບ ]      ➔  Modal: "📦 ກວດຮັບ QC ພ້ອມມອບ!"    │
└───────────────────────────────────────────────────────────┘
8. Master Prompt สำหรับสั่งงาน AI Agent แบบ Step-by-Step# 🤖 MASTER AI AGENT PROMPT: IMPLEMENT SOM SING PHIM PRODUCTION PIPELINE, PREFLIGHT & 2-BUTTON UX

You are the Lead Full-Stack Software Engineer for the **Som Sing Phim (ສົມສິ່ງພິມ)** admin management system (Go Backend + PostgreSQL + React/TypeScript Frontend).

Execute the complete end-to-end implementation following the sequential 5 Steps below.

---

### 🚀 STEP 1: Database Migration & Go Model Refactor (`backend/orders/`)

1. Refactor `backend/orders/models.go` to support Master-Detail One-to-Many architecture:
   - Create `Order` struct with `id`, `order_no`, `customer_id`, `customer_name`, `customer_phone`, `total_amount_lak`, `deposit_lak`, `remaining_lak`, `overall_status`, `delivery_date`, `created_at`, `updated_at`.
   - Create `OrderItem` struct with `id`, `order_id`, `item_name`, `quantity`, `page_count`, `paper_size`, `cover_paper_id`, `inner_paper_id`, `cover_file_url`, `inner_file_url`, `binding_type`, `spine_width_mm`, `current_step`, `avg_cov_c`, `avg_cov_m`, `avg_cov_y`, `avg_cov_k`, `unit_cost_lak`, `unit_price_lak`, `total_price_lak`.
   - Define Enum constants:
     - `BindingType`: `NONE`, `PERFECT_HOT_GLUE`, `SADDLE_STITCH`, `WIRE_O`, `PLASTIC_COMB`, `CALENDAR`
     - `ProductionStep`: `PENDING`, `INNER_PRINTED`, `COVER_PRINTED`, `COVER_LAMINATED`, `PAPER_TRIMMED`, `BOUND`, `READY_FOR_PICKUP`, `COMPLETED`
2. Update repository/database layer to auto-migrate both tables and ensure preloading of `Items` when fetching an `Order`.

---

### 🚀 STEP 2: PDF Preflight & CMYK Ink Coverage Extraction (`backend/preflight/`)

1. Create `backend/preflight/analyzer.go`:
   - Execute Ghostscript CLI: `gs -q -o - -sDEVICE=inkcov <pdf_path>` using `os/exec`.
   - Parse standard output lines (e.g. `0.12500 0.08000 0.15200 0.42000 CMYK OK`).
   - Calculate average % coverage across all pages for Cyan (`AvgCovC`), Magenta (`AvgCovM`), Yellow (`AvgCovY`), and Key/Black (`AvgCovK`).
   - Detect RGB color spaces and low DPI warnings.
   - Fallback Mechanism: If Ghostscript CLI execution fails or is missing, return a friendly warning and allow manual override.
   - Return `PreflightResult` struct.
2. Create `POST /api/v1/orders/preflight` endpoint in `backend/preflight/handlers.go` to accept PDF multipart upload and return JSON result.

---

### 🚀 STEP 3: Dynamic Pricing & Binding Cost Updates (`backend/pricing/engine.go`)

1. Implement `CalculateSpineWidthMM(pageCount int, paperGSM float64) float64`:
   - Formula: `(pageCount / 2.0) * 0.105 + 0.8` (rounded to 1 decimal place).
2. Implement `CalculateBindingCostLAK(bType BindingType, machinePriceLAK float64, lifetimeCycles float64) float64`:
   - Machine depreciation: `(machinePriceLAK * 1.10) / lifetimeCycles`.
   - Consumables per book in LAK: Perfect Glue = 350, Wire-O = 2500, Comb = 1500, Calendar = 3500, Saddle = 100.
3. Update `CalculateDynamicPricing` to accept multi-page averages (`AvgCovC, AvgCovM, AvgCovY, AvgCovK`), multiply ink cost by `PageCount`, add binding cost, and apply 5% spoilage factor.

---

### 🚀 STEP 4: Local File Storage & Job Ticket PDF (`backend/orders/`)

1. Local File Upload (`backend/orders/handlers.go`):
   - Endpoint: `POST /api/v1/orders/upload`
   - Store uploaded files locally in `./uploads/orders/{order_no}/{item_id}_{type}_{filename}`.
   - Serve static directory via `backend/main.go` on `/api/v1/orders/files/*filepath`.
2. Production Step Update (`backend/orders/handlers.go`):
   - Endpoint: `PATCH /api/v1/orders/items/:id/step`
   - Advance `current_step` and auto-update parent `Order.overall_status`.
3. Single-Sheet A4 Job Ticket (`backend/orders/pdf.go`):
   - Output single A4 PDF containing Som Sing Phim logo, Order header info in LAK, top-right QR code (`/track/{order_no}`), itemized multi-job table, and shop floor sign-off/spoilage checklist.
   - Load Lao language font from `backend/assets/fonts/` (e.g. `SaysetthaOT.ttf` or `NotoSansLao-Regular.ttf`).

---

### 🚀 STEP 5: Frontend Preflight UI (2-Button Flow) & Shop Floor Tracker (`frontend/src/`)

1. Preflight Dedicated Tab / Component (`frontend/src/components/PreflightChecker.tsx`):
   - Standalone PDF Drag-and-Drop upload area.
   - Visual progress bars for Cyan, Magenta, Yellow, Black % coverage.
   - Status badges: `[ ✅ ໄຟລ໌ CMYK ມາດຕະຖານ ]`, `[ ⚠️ ພົບຄ່າສີ RGB: ສີພິມຈິງອາດຈະດຣັອບລົງ ]`.
   - **2 Action Buttons:**
     - 🟢 **Button 1 ("ສົ່ງຄ່ານຳໃຊ້ສ້າງໃບສະເໜີລາຄາ"):** Populates extracted CMYK %, page count, and file URL into the Quotation Form (`/orders/new`).
     - ⚪ **Button 2 ("ຂ້າມ / ໄປປ້ອນຄ່າສີເອງ"):** Closes the preflight tool and opens the Quotation Form with manual input fields enabled.
2. Shop Floor Tracker Component (`frontend/src/components/ShopFloorTracker.tsx`):
   - Displays all Job Items with direct download links for Cover and Inner PDFs.
   - 6 Production Step Buttons in Lao:
     1. `1. ພິມເນື້ອໃນແລ້ວ` (`INNER_PRINTED`)
     2. `2. ພິມປົກແລ້ວ` (`COVER_PRINTED`)
     3. `3. ເຄືອບປົກແລ້ວ` (`COVER_LAMINATED`)
     4. `4. ຕັດເຈ້ຍແລ້ວ` (`PAPER_TRIMMED`)
     5. `5. ເຂົ້າສັນແລ້ວ` (`BOUND`)
     6. `6. QC ພ້ອມມອບ` (`READY_FOR_PICKUP`)
   - Clicking a step opens a **Confirmation Modal Alert** (e.g. "📄 ພິມເນື້ອໃນສຳເລັດແລ້ວ! ກວດສອບຈຳນວນແຜ່ນ") before sending the API `PATCH` request.

---

### 🧪 Verification Checklist:
- [ ] Backend tests pass: `go test ./...`
- [ ] Frontend builds without TypeScript errors: `npm run build`
- [ ] Uploading a PDF in Preflight Tab analyzes CMYK and displays the 2 action buttons.
- [ ] Clicking "Send to Quotation" populates the quotation form seamlessly.
- [ ] Creating an order with multiple items renders correctly in a single A4 PDF Job Ticket.
- [ ] Updating production steps via tracker triggers the confirmation modal and updates the database.
eof

💡 วิธีนำไปใช้สั่งงาน AI Agent:คุณสามารถคัดลอกไฟล์ MASTER_SOM_SING_PHIM_SPEC.md นี้ไปสร้างวางในโฟลเดอร์โปรเจกต์ของคุณสั่ง AI Agent (เช่น Antigravity) ในช่องแชตว่า:"Please read @MASTER_SOM_SING_PHIM_SPEC.md and execute the 5 steps in Section 8 sequentially to implement the full system."เพียงเท่านี้ AI ก็จะเข้าใจบริบทหน้างานทั้งหมดตั้งแต่ต้นจนจบ และเริ่มรันงานสร้างระบบให้คุณได้ทันทีครับ!