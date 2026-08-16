แผนการพัฒนาและข้อกำหนดเชิงเทคนิคสำหรับ Antigravity (Detailed System Remediation & Implementation Plan)ระบบบริหารจัดการโรงพิมพ์ (Order Creation & Quotation System Directive)1. ภาพรวมและวัตถุประสงค์ (Executive Technical Overview)เอกสารฉบับนี้จัดทำขึ้นสำหรับ Antigravity (AI Dev Agent / Engineering Team) เพื่อใช้เป็นข้อกำหนดเชิงเทคนิคแบบละเอียด (Step-by-Step Implementation Specification) ในการปรับปรุงสถาปัตยกรรมระบบ หน้าสร้างออเดอร์และการออกใบเสนอราคา (Order & Quotation Management) ของระบบบริหารจัดการโรงพิมพ์สรุปจุดประสงค์เชิงโครงสร้างระบบ:Re-order Form Priority: ปรับเปลี่ยน UX/UI Workflow ให้กรอก "จำนวนที่ต้องการผลิต (Quantity Required)" และ "ขนาดกางออก (Unfolded Dimensions)" เป็นอันดับแรกสุดหลังเลือกลูกค้าPaper Inventory Deep Integration: ยกเลิกการกรอกสเปกกระดาษแบบพิมพ์มือ เปลี่ยนเป็น Cascading Dropdown เลือก Category $\rightarrow$ Inventory Paper Item เพื่อดึง แกรม, ราคา/แผ่น, สต็อกคงเหลือ และคำนวณการเลย์แผ่นพิมพ์ (Layout Optimization) โดยอัตโนมัติMulti-Printer & Channel Color Separation:รองรับงานพิมพ์ 1 งานที่ใช้หลายเครื่องพิมพ์ (List of Printers)ตัดช่อง "ชุดหมึกที่รองรับ" ออก เนื่องจากหมึกพิมพ์ผูกติดกับเครื่องพิมพ์ในฐานข้อมูลอยู่แล้วเพิ่มโหมดการตั้งค่าความเข้มสีแยกช่องสี (CMYK + Pantone Spot Color Channels) ต่อแต่ละเครื่องพิมพ์Asset-Linked Post-Press Finishing: เชื่อมโยงขั้นตอนหลังการพิมพ์ (เคลือบ, ไดคัท, เข้าเล่ม) เข้ากับคลังเครื่องจักร (equipment_masters / assets) ที่มีสถานะ status = 'ACTIVE' พร้อมคำนวณต้นทุนการเดินเครื่องจักรเรียลไทม์2. ขอบเขตไฟล์ที่ต้องปรับปรุง (Affected Files & Scope)2.1 ฝั่ง Frontend (React / TypeScript - admin-system/frontend/src/)features/orders/components/CreateOrderPage.tsx : ฟอร์มหลักสำหรับสร้างออเดอร์/ใบเสนอราคาfeatures/orders/components/ItemSpecConfigurator.tsx : คอมโพเนนต์กำหนดสเปกงานพิมพ์ กระดาษ เครื่องพิมพ์ และงานหลังพิมพ์features/orders/components/ManualPrinterAllocator.tsx : คอมโพเนนต์จัดการเลือกหลายเครื่องพิมพ์ และการแยกสี (Color Channel Setup)features/orders/types.ts : ปรับแก้ไข Data Interfaces / Contractsfeatures/inventory/components/common/ColorSlotConfigurator.tsx : คอมโพเนนต์เลือกช่องสีความเข้ม2.2 ฝั่ง Backend (Go - admin-system/backend/)orders/models.go : โครงสร้าง Struct ของ Order, Quotation, PrintingProcess, ColorChannelorders/handlers.go : API Controller/Handlers สำหรับรับข้อมูลและสร้างออเดอร์pricing/engine.go : คำนวณราคากระดาษ, ค่าเพลต, ค่าพิมพ์ต่อเครื่องจักร, ค่าแรง/ค่าเสื่อมเครื่องเข้าเล่มinventory/assets.go : ดึงข้อมูลเครื่องจักรและคลังสินค้าที่ Active2.3 ฝั่ง Database Migration (admin-system/migrations/)009_order_printer_channel_and_finishing_linking.sql : ไฟล์ Migration ใหม่สำหรับอัปเดต Schema ฐานข้อมูล3. แผนการพัฒนาย่อยและลำดับขั้นตอนการทำงาน (Step-by-Step Task Specifications)[Task 1: DB Migration] ──► [Task 2: Backend Models & API] ──► [Task 3: Pricing Engine Update]
                                                                        │
                                                                        ▼
[Task 5: End-to-End Validation] ◄── [Task 4: Frontend UI Redesign & Integration]
Task 1: Database Schema & Migration (009_order_printer_channel_and_finishing_linking.sql)1.1 ข้อกำหนดเรื่องโครงสร้างตารางใหม่:ยกเลิก/ลบ: Column supported_ink_set ในตาราง order_items หรือ quotation_items (ถ้ามี)สร้างตาราง order_item_printers: รองรับ Multi-Printer per Order ItemCREATE TABLE IF NOT EXISTS order_item_printers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    printer_asset_id UUID NOT NULL REFERENCES assets(id),
    print_sequence INT NOT NULL DEFAULT 1,
    color_mode VARCHAR(50) NOT NULL DEFAULT 'AVERAGE', -- 'AVERAGE' หรือ 'SEPARATE_CHANNEL'
    average_density_pct DECIMAL(5,2) DEFAULT 100.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
สร้างตาราง order_printer_color_channels: รองรับการตั้งค่าความเข้มสีแยกรายช่องสีสำหรับแต่ละเครื่องพิมพ์CREATE TABLE IF NOT EXISTS order_printer_color_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_printer_id UUID NOT NULL REFERENCES order_item_printers(id) ON DELETE CASCADE,
    channel_name VARCHAR(50) NOT NULL, -- เช่น 'C', 'M', 'Y', 'K', 'PANTONE 185 C'
    density_pct DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    is_spot_color BOOLEAN DEFAULT FALSE
);
สร้างตาราง order_item_finishing_assets: เชื่อมโยงงานหลังการพิมพ์เข้ากับเครื่องจักรจริงCREATE TABLE IF NOT EXISTS order_item_finishing_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    finishing_type VARCHAR(100) NOT NULL, -- 'LAMINATE_GLOSS', 'FOLDING', 'PERFORATION', etc.
    machine_asset_id UUID NOT NULL REFERENCES assets(id),
    estimated_setup_time_mins INT DEFAULT 0,
    estimated_run_time_mins INT DEFAULT 0,
    unit_cost DECIMAL(10,2) DEFAULT 0.00
);
Task 2: Backend Data Models & API Contract Adjustment (Go Language)2.1 การปรับแก้ Struct ใน orders/models.go:type OrderItemRequest struct {
    JobName          string                   `json:"job_name" binding:"required"`
    QuantityRequired int                      `json:"quantity_required" binding:"required,gt=0"`
    UnfoldedWidthMM  float64                  `json:"unfolded_width_mm" binding:"required"`
    UnfoldedHeightMM float64                  `json:"unfolded_height_mm" binding:"required"`
    PaperSetup       PaperSelectionSetup      `json:"paper_setup" binding:"required"`
    PrintingProcesses []PrinterProcessSetup   `json:"printing_processes"`
    FinishingProcesses []FinishingProcessSetup `json:"finishing_processes"`
}

type PaperSelectionSetup struct {
    CategoryID          string  `json:"category_id" binding:"required"`
    InventoryMaterialID string  `json:"inventory_material_id" binding:"required"`
    CostPerSheet        float64 `json:"cost_per_sheet"`
    GSM                 int     `json:"gsm"`
}

type PrinterProcessSetup struct {
    PrinterAssetID string         `json:"printer_asset_id" binding:"required"`
    Sequence       int            `json:"sequence"`
    ColorMode      string         `json:"color_mode"` // "AVERAGE" | "SEPARATE_CHANNEL"
    AverageDensity float64        `json:"average_density_pct"`
    ColorChannels  []ColorChannel `json:"color_channels"`
}

type ColorChannel struct {
    ChannelName string  `json:"channel_name"` // "C", "M", "Y", "K", "PANTONE..."
    DensityPct  float64 `json:"density_pct"`
    IsSpotColor bool    `json:"is_spot_color"`
}

type FinishingProcessSetup struct {
    FinishingType  string `json:"finishing_type"`
    MachineAssetID string `json:"machine_asset_id"`
}
2.2 การอัปเดต Handlers ใน orders/handlers.go:รับ Payload โครงสร้างใหม่ตรวจสอบคลังกระดาษ (inventory_material_id) ว่ามีสต็อกและราคาสอดคล้องกันตรวจสอบ machine_asset_id ทั้งฝั่ง PrintingProcesses และ FinishingProcesses ว่ามีสถานะ ACTIVE ในตาราง assetsTask 3: Quotation Pricing Engine Updates (pricing/engine.go)ปรับปรุง Business Logic ในการคำนวณราคาใบเสนอราคา:ลำดับการคำนวณใหม่:$$\text{Total Production Sheets} = \text{CalculateCutLayout}(\text{QuantityRequired}, \text{UnfoldedSize}, \text{PaperFullSheetSize}) \times (1 + \text{SpoilageRate})$$Paper Cost: ดึง CostPerSheet จากฐานข้อมูลคลังสินค้าคูณกับ Total Production SheetsPrinting Cost (Multi-Printer Loop):วนลูปตามรายการเครื่องพิมพ์ใน PrintingProcessesคำนวณจำนวนเพลตตามจำนวน ColorChannelsดึงหมึกที่ผูกกับเครื่องพิมพ์อัตโนมัติ (ไม่รับค่าหมึกแยกนอกเหนือจากคลัง)คำนวณปริมาณหมึกพิมพ์ตามค่า DensityPct ของแต่ละช่องสีFinishing Machine Cost:ดึงค่าเสื่อมราคา/ค่าแรงเครื่องจักรต่อชั่วโมงจาก assetsคำนวณเวลาการทำงาน (Setup Time + Run Time per Quantity) เพื่อแปลงเป็นต้นทุนใบเสนอราคาTask 4: Frontend Redesign & Implementation (CreateOrderPage.tsx & ItemSpecConfigurator.tsx)4.1 UI Layout Strategy & Step Priority (5 Phase Layout):+-------------------------------------------------------------------------+
| PHASE 1: ลูกค้า & ข้อมูลการติดต่อ (Customer Context)                      |
| [ Combobox ค้นหาลูกค้าเก่า / ปุ่ม Quick Add ลูกค้าใหม่ ]                   |
+-------------------------------------------------------------------------+
                                     │
                                     ▼
+-------------------------------------------------------------------------+
| PHASE 2: สเปกสรุป & จำนวนผลิต (Job Overview & Production Quantity)     |
| - ชื่อชิ้นงาน [Input Text]                                              |
| - จำนวนผลิตที่ต้องการ (Required Quantity) [Number Input - FIRST focus]   |
| - ขนาดงานกางออก (Width x Height mm)                                     |
+-------------------------------------------------------------------------+
                                     │
                                     ▼
+-------------------------------------------------------------------------+
| PHASE 3: เลือกกระดาษจากคลังสินค้า (Inventory Paper Selector)             |
| [1. Select Paper Category (Dropdown: อาร์ตเงา, ปอนด์, สติ๊กเกอร์, ฯลฯ)]    |
| [2. Select Paper Item (Dropdown: แสดงชื่อ, GSM, ขนาดแผ่นใหญ่, ราคา, สต็อก)]|
| -> แสดงผลการคำนวณ Cut Layout & แผ่นใหญ่ที่ต้องใช้ (Auto-calculated)        |
+-------------------------------------------------------------------------+
                                     │
                                     ▼
+-------------------------------------------------------------------------+
| PHASE 4: กระบวนการพิมพ์ & การตั้งค่าเครื่องพิมพ์ (Multi-Printer Setup)    |
| [+ เพิ่มเครื่องพิมพ์ (Add Printer)]                                      |
| ┌────────────────----------------─────────────────────────────────────┐ |
| │ เครื่องพิมพ์ที่ 1: Heidelberg XL75                                   │ |
| │ โหมดสี: [ Radio: ความเข้มเฉลี่ย | แยกสีเฉพาะ (Separate Channels) ]     │ |
| │ [Channel Component: C(100%), M(100%), Y(100%), K(100%), Spot(80%)]  │ |
| └─────────────────────────────────────────────────────────────────────┘ |
+-------------------------------------------------------------------------+
                                     │
                                     ▼
+-------------------------------------------------------------------------+
| PHASE 5: งานหลังพิมพ์ & เลือกเครื่องจักร (Finishing Asset Integration)    |
| [Dropdown: ประเภทงานตกแต่ง] -> [Dropdown: เครื่องจักรในคลัง (Status=ACTIVE)] |
+-------------------------------------------------------------------------+
4.2 รายละเอียดคอมโพเนนต์ที่ต้องปรับแก้:CreateOrderPage.tsx:ปรับการวางตำแหน่ง Field โดยนำ Quantity Required ขึ้นมาไว้อันดับแรกใน Phase 2ใช้ React State จัดการ orderItems ที่รองรับ Multi-printer และ Finishing Asset LinkingItemSpecConfigurator.tsx:ทำ Cascading Dropdown เชื่อมกับ /api/inventory/materialsเมื่อผู้ใช้เลือก Paper Category ระบบจะฟิลเตอร์เฉพาะรายการกระดาษใน Category นั้นเมื่อเลือก Paper Item ให้ Auto-fill ข้อมูลขนาดกระดาษแผ่นใหญ่ แกรมนวัต และแสดงจำนวนสต็อกคงเหลือปัจจุบันManualPrinterAllocator.tsx:เพิ่มปุ่ม "เพิ่มเครื่องพิมพ์" (Allow Dynamic Array of Printers)ตัด Dropdown "ชุดหมึกที่รองรับ" (Supported Ink Set) ออกจาก UIเพิ่ม Toggle เลือกโหมดสี: Average Density หรือ Separate Channelsในโหมด Separate Channels ให้เรนเดอร์ Slider/Number Input ปรับ Density % สำหรับ C, M, Y, K และปุ่มเพิ่ม Pantone Spot Color พร้อมกำหนด % DensityFinishing Asset Selector Component:สร้าง Dropdown เลือกประเภทงานหลังพิมพ์ (เช่น เคลือบลามิเนต, เข้าเล่ม)สร้าง Cascading Dropdown ถัดไปแสดงเฉพาะเครื่องจักรจาก /api/equipment ที่มี type ตรงกับงานหลังพิมพ์ และ status = 'ACTIVE'4. ตัวอย่างพฤติกรรมลูกค้า 5 กลุ่มสำหรับการทดสอบ (Validation Personas)เพื่อตรวจสอบว่าระบบใหม่ครอบคลุมการใช้งานจริงAntigravity ต้องทดสอบ Test Cases ตาม Persona ทั้ง 5 ดังนี้:Personaโจทย์การสั่งงานสิ่งที่ระบบต้องตอบสนอง1. งานด่วน / Walk-inนามบัตร 100 ใบ กระดาษอาร์ต 300 แกรม พิมพ์ดิจิทัลใส่จำนวน 100 $\rightarrow$ เลือกกระดาษจากคลัง $\rightarrow$ เลือกระบบพิมพ์ Digital $\rightarrow$ คำนวณราคาออกใบเสนอราคาได้ภายใน 10 วินาที2. เอเจนซี่ / งานกล่องกล่องบรรจุภัณฑ์ 50,000 ใบ พิมพ์ Offset 4 สี + สีพิเศษ Pantoneใส่จำนวน 50,000 $\rightarrow$ เลือกกระดาษกล่องจากคลัง $\rightarrow$ เลือกเครื่องพิมพ์ Offset $\rightarrow$ เพิ่มช่องสี Pantone 185 C (Density 80%) $\rightarrow$ คำนวณกระดาษเผื่อเสียและจำนวนเพลตอัตโนมัติ3. งานพิมพ์ซ้ำ (Re-order)สติ๊กเกอร์ฉลากสินค้า 10,000 ด่วนค้นหาออเดอร์เดิม $\rightarrow$ กด Re-order $\rightarrow$ โหลดสเปกเดิม แต่ดึงราคาหมึก/กระดาษปัจจุบันจากคลังสินค้า4. สติ๊กเกอร์ & ไดคัทสติ๊กเกอร์ PVC เคลือบด้าน ไดคัทตามทรงใส่จำนวน $\rightarrow$ เลือกเนื้อสติ๊กเกอร์คลัง $\rightarrow$ เลือกเครื่องพิมพ์ Inkjet $\rightarrow$ เลือกเครื่องเคลือบ + เครื่องปั๊มไดคัทจาก Asset DB5. หนังสือ / แคตตาล็อกปกพิมพ์ 4 สี (อาร์ตมัน) + เนื้อในพิมพ์ 1 สี (ถนอมสายตา)รองรับ Multi-item หรือแยกสเปกพิมพ์ระหว่างปกและเนื้อใน เลือกเครื่องเข้าเล่มกาวร้อนจากคลังเครื่องจักร5. คำสั่งการพัฒนาระบบสำหรับ Antigravity (Step-by-Step Directives for AI Agent)กรุณาดำเนินการตามลำดับขั้นตอนดังต่อไปนี้:[Step 1] Execute DB Migration:สร้างไฟล์ migrations/009_order_printer_channel_and_finishing_linking.sqlรัน SQL Script เพิ่มตาราง order_item_printers, order_printer_color_channels, order_item_finishing_assets และลบ supported_ink_set[Step 2] Update Backend Go Code:ปรับแก้ไข Struct ใน backend/orders/models.go ตามสเปกในข้อ 2.1ปรับ Controller ใน backend/orders/handlers.go ให้รับและบันทึกโครงสร้างข้อมูลแบบ Multi-printerปรับ Pricing Logic ใน backend/pricing/engine.go ให้คำนวณราคากระดาษและเครื่องจักรตามสเปกใหม่[Step 3] Update Frontend Components:ปรับเรียงลำดับ Phase ฟอร์มใน frontend/src/features/orders/components/CreateOrderPage.tsxปรับปรุง ItemSpecConfigurator.tsx ให้เชื่อม Cascading Dropdown กับ API คลังสินค้าปรับปรุง ManualPrinterAllocator.tsx ให้เปิดใช้ Dynamic Multi-printer และ Color Channel Density Controlเชื่อมระบบเลือกเครื่องจักรงานหลังพิมพ์กับ Asset List API[Step 4] Run Unit & Integration Tests:รัน go test ./backend/pricing/... เพื่อตรวจสอบความถูกต้องของการคำนวณราคาทดสอบจำลองการสร้างออเดอร์ผ่าน UI ตาม Test Cases ลูกค้า 5 กลุ่มในข้อ 4