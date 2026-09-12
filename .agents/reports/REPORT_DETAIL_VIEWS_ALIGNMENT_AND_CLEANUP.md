# Som Sing Phim - Delivery & QA Verification Report
## Task: Detail Views Alignment and Cleanup Across 3 Pages (Inbound, Inventory, Equipment)

- **Date:** 2026-09-11
- **Auditor & Coordinator:** Som Sing Coordinator (`@somsing-coordinator`)
- **Status:** COMPLETED (Passed 100%)

---

## 1. วัตถุประสงค์และการตรวจสอบครอบคลุม 3 หน้าหลัก

ตรวจสอบและปรับปรุงหน้ารายละเอียดของทั้ง 3 หน้าในระบบหลังบ้าน:
1. **หน้านำเข้าสินค้า (Inbound Procurement Management):** การเปิด Detail Drawer เมื่อกดดูรายละเอียดสินค้าที่นำเข้า (`selectedDrawerItem` -> `DynamicSpecDetail.tsx`)
2. **หน้าคลังสินค้า (Inventory Management):** หน้ารายละเอียดวัสดุ/สินค้าในคลัง (`InventoryMaterialDetailsPage.tsx` -> `DynamicSpecDetail.tsx`)
3. **หน้าเครื่องจักร (Equipment & Shopfloor Tracker):** หน้ารายละเอียดเครื่องจักรรายตัว (`EquipmentDetailsPage.tsx`) และการ์ดแสดงสเปกใน Shopfloor (`EquipmentSpecCard.tsx`)

---

## 2. ตารางเปรียบเทียบข้อมูล: สิ่งที่ตัดออก (เกินมา) และสิ่งที่เพิ่มเข้ามา (ตรงตามฟอร์มนำเข้า)

| หมวดหมู่สินค้า / เครื่องจักร | ข้อมูลที่เกินมา (ตัดออก / ซ่อน) | ข้อมูลที่ขาดหายไป (เพิ่มเข้ามาให้ตรง 100%) | สถานะการตรวจสอบ |
| :--- | :--- | :--- | :---: |
| **1. กระดาษและสื่อสิ่งพิมพ์ (Paper & Media)** | - Mock field ที่ไม่มีในฟอร์มนำเข้า | + `paperType` ครบทั้ง 9 ประเภท (Plain, Green Read, Kraft, Greyboard, Photo, Sublimation, Sticker, Art Card, Canvas)<br>+ `compatibilities` Badge แสดงความเข้ากันได้กับหมึก (Dye, Pigment, Sublimation, Laser Toner, ບໍ່ເໝາະສຳລັບພິມ)<br>+ `printableSides` (Single / Double-sided)<br>+ `customWidthMm` x `customLengthMm` เมื่อเป็น Custom Sheet<br>+ `brand` และ `packagingType` | ผ่าน 100% |
| **2. น้ำหมึกและโทนเนอร์ (Ink & Toner)** | - Mock fields | + แสดง Ink Code / SKU<br>+ Color & Channel<br>+ Net Volume / Weight (ml / g)<br>+ Chemistry & OEM Genuine vs Compatible<br>+ เครื่องพิมพ์ที่ผูกกับหมึกนี้ | ผ่าน 100% |
| **3. เครื่องตัด (Cutter Machine)** | **ตัดออก:**<br>- ระยะเวลาอุ่นเครื่อง (Warm-up Time)<br>- Hydraulic fluid wear<br>- Safety sensors wear<br>- Clamp pad wear | + `postPressSubtype` (Guillotine, Roll Plotter, Flatbed)<br>+ `cutterMaxWidthMm`, `cutterMaxSpeedMms`, `cutterDownforceG`<br>+ Operating Watts (1,200W - 1,500W)<br>+ **อะไหล่สวมใส่ 3 รายการจริง:**<br>1. ใบมีด/เจียรมีด (`wearSharpeningCost` / `IntervalCuts`)<br>2. เขียงรองตัด (`wearCuttingStickCost` / `LifeCuts`)<br>3. ใบมีดพล็อตเตอร์ (`wearBladeCost` / `LifeMeters`) | ผ่าน 100% |
| **4. เครื่องเคลือบ (Laminator Machine)** | **ตัดออก:**<br>- Pinch rollers wear<br>- Teflon guide wear<br>- Drive belt wear<br>- Infrared sensor wear | + `laminatorMaxWidthMm`<br>+ `laminatorMaxSpeedMmin`<br>+ `laminatorMaxTempC`<br>+ Operating Watts (1,600W)<br>+ ระยะเวลาอุ่นเครื่อง (Warm-up Time: 5 นาที)<br>+ **อะไหล่สวมใส่ 2 รายการจริง:**<br>1. ลูกกลิ้งซิลิโคน (`wearSiliconeRollerCost` / `LifeMeters`)<br>2. ฮีตเตอร์ทำความร้อน (`wearHeatingElementCost` / `Hours`) | ผ่าน 100% |
| **5. เครื่องเข้าเล่มกาว/ห่วง (Binder Machine)** | **ตัดออก:**<br>- Glue pot wear<br>- Side glue wear<br>- Nipping clamp wear<br>- Creasing wheel wear | + `binderMaxThicknessMm`<br>+ `binderSpeedBooksHr`<br>+ Operating Watts (1,400W)<br>+ ระยะเวลาอุ่นเครื่อง/ต้มกาว (Warm-up Time: 15 นาที)<br>+ **อะไหล่สวมใส่ 2 รายการจริง:**<br>1. มีดปาดสัน/กรีดสัน (`wearMillingCutterCost` / `LifeBooks`)<br>2. เข็มเจาะรูกระดาษ (`wearPunchingPinsCost` / `LifePunches`) | ผ่าน 100% |
| **6. เครื่องพิมพ์อิงค์เจ็ท (Inkjet Printer)** | **ตัดออก:**<br>- ระยะเวลาอุ่นเครื่อง (Warm-up Time)<br>- Teflon strip wear<br>- Linear encoder wear | + `feedType` (Cut-sheet / Roll)<br>+ `maxPaperSize`<br>+ `speedMonoPpm`, `speedColorPpm`<br>+ `supportedGsmMin` - `supportedGsmMax`<br>+ Operating Watts (350W)<br>+ **อะไหล่สวมใส่ 5 รายการจริง:**<br>1. กล่องซับหมึก Maintenance Box<br>2. หัวพิมพ์ Printhead<br>3. ยางดึงกระดาษ Pickup Roller<br>4. สายพาน Carriage Belt<br>5. เปอร์เซ็นต์หมึกสูญเสียล้างหัวพิมพ์ (Ink Loss %) | ผ่าน 100% |
| **7. เครื่องพิมพ์เลเซอร์ (Laser Production Press)** | **ตัดออก:**<br>- Developer unit wear (ยุบรวม)<br>- Duplicate keys | + `speedMonoPpm`, `speedColorPpm`<br>+ `duplexMode` (Auto-Duplex)<br>+ `maxPaperSize` (SRA3)<br>+ `supportedGsmMin` - `supportedGsmMax`<br>+ Operating Watts (1,800W)<br>+ ระยะเวลาอุ่นเครื่อง (Warm-up Time: 1.5 นาที)<br>+ **อะไหล่สวมใส่ 5 รายการจริง:**<br>1. Drum Unit<br>2. Fuser Unit<br>3. Transfer Belt<br>4. Pickup Roller<br>5. Waste Toner Box | ผ่าน 100% |
| **8. แผ่นป้ายและวัสดุแข็ง (Rigid Substrates)** | - Key mismatch เก่า | + `substrateType` (Foam Board, Plastwood, Acrylic, PP Board, Corrugated, Aluminium Composite, MDF, Wood)<br>+ `thicknessMm`<br>+ `colorSurface` (White, Black, Clear, Opal/Milky, อื่นๆ)<br>+ ขนาดแผ่น `sheetWidthMm` x `sheetHeightMm`<br>+ พื้นที่คำนวณ `areaSqm` และ `wasteFactorPct` | ผ่าน 100% |
| **9. อุปกรณ์ตัดและบรรจุภัณฑ์ (Supplies & Packaging)** | - Mock specs | + สำหรับ Cutting Supplies: `supplyType`, `transferTapeTack`, `widthMm`, `lengthM`, `cuttingMatCycles`<br>+ สำหรับ Packaging: `packagingCategory`, `dimensions`, `bubbleRollWidthCm`, `tapeWidthMm` | ผ่าน 100% |

---

## 3. สรุปผลการทดสอบเชิงคุณภาพและระบบ (Test Results)

1. **TypeScript Static Typing (`tsc --noEmit`):**
   - Result: **0 errors**
2. **Production Build (`vite build`):**
   - Result: **Built successfully in 352ms**
3. **Automated Unit Testing (`tsx --test src/utils/*.test.ts`):**
   - Tests: **23 passed, 0 failed (5 suites)**
   - Suite `Detail Views Verification & Spec Alignment Tests`: ผ่านครบ 9 หมวดสินค้า
4. **Backend Go Tests (`go test ./...`):**
   - Result: **Pass (cached / ok) ครบทุกแพ็กเกจ**
5. **No Unicode Emoji Policy:**
   - ตรวจสอบโค้ด Frontend ทั้งหมด: ปราศจาก Unicode emoji ใน UI code (ใช้ไอคอนมาตรฐาน Lucide React และข้อความภาษาลาว/อังกฤษที่ชัดเจน)

---

## 4. ไฟล์ที่มีการสร้างและแก้ไข

1. `admin-system/frontend/src/features/inbound/components/details/InboundItemDetailsPage.tsx` [NEW] (หน้ารายละเอียดสินค้าที่นำเข้าแบบเต็มจอ Standalone Page สไตล์ Bento Grid พร้อมปุ่ม Back, Action Edit/Delete, Lightbox)
2. `admin-system/frontend/src/features/inbound/components/InboundManagement.tsx` [MODIFY] (สลับมาแสดง `InboundItemDetailsPage` เต็มจอเมื่อกดดูรายละเอียด และตัด Slide-over Side Drawer ออก 100%)
3. `admin-system/frontend/src/features/inventory/components/details/DynamicSpecDetail.tsx` [MODIFY] (Shared Component สำหรับ Inbound Detail และ Inventory Detail Page)
4. `admin-system/frontend/src/features/equipment/components/details/EquipmentDetailsPage.tsx` [MODIFY] (หน้ารายละเอียดเครื่องจักร)
5. `admin-system/frontend/src/features/equipment/components/tracker/EquipmentSpecCard.tsx` [MODIFY] (การ์ดสเปก Shopfloor)
6. `admin-system/frontend/src/utils/detailViewsVerification.test.ts` [NEW] (ชุดทดสอบการยืนยันความถูกต้องของข้อมูลสเปกทั้ง 9 หมวด)

---


## 6. การปรับปรุงท่อส่งรูปภาพเครื่องจักร และการคำนวณต้นทุนค่าเสื่อมราคา & อะไหล่สิ้นเปลือง (Machinery Photo Pipeline & Accurate Costing Overhaul)

1. **การแก้ปัญหารูปภาพเครื่องจักรไม่แสดง (Photo Pipeline Fix):**
   - **สาเหตุเดิม:** 
     - ฟอร์มนำเข้าสินค้าบันทึกรูปใน `item.actualImages` แต่ไม่ได้เซฟลง `imageUrl` ใน Root Object
     - การ Sync ข้อมูลระหว่าง Inbound มายัง Equipment State ใน `AppContext.tsx` ละเลยฟิลด์ `imageUrl` / `itemPhoto`
     - ใน `EquipmentTable.tsx` และ `EquipmentDetailsPage.tsx` ตรวจสอบเฉพาะ `eq.imageUrl` ทำให้รูปไม่ขึ้น
   - **แนวทางแก้ไข:**
     - สร้างและส่งออก Helper `resolveMachineImage(machine)` ใน `machineCostCalculator.ts` ที่ครอบคลุมทุกที่มาของรูปภาพ (`imageUrl`, `itemPhoto`, `productPhoto`, `docs.productPhoto`, `specs.productPhoto`, `specs.actual_images`, `actual_images`)
     - เพิ่ม `imageUrl` และ `itemPhoto` ลงใน `finalData` ของ `ImportForm.tsx` ทันทีเมื่อมีการนำเข้า
     - ปรับ `AppContext.tsx` ให้รักษา `imageUrl` และ `itemPhoto` รวมถึงแยกหมวดหมู่เครื่องจักร (Printer, Cutter, Laminator, Binder) อย่างถูกต้อง
     - ปรับปรุงให้ `EquipmentTable.tsx` และ `EquipmentDetailsPage.tsx` แสดงรูปภาพผ่าน `resolveMachineImage` และกำหนดรูปภาพเริ่มต้นที่มีความละเอียดสูงให้กับเครื่องจักรทั้ง 5 เครื่องเริ่มต้น

2. **การยกเครื่องสูตรคำนวณต้นทุนค่าเสื่อมราคาและอะไหล่สิ้นเปลือง (Accurate Costing & Itemized Wear Parts):**
   - **ตัดออก:**
     - ตัดการบวกอัตราบำรุงรักษาแบบเหมารวม 15% (`+15% Maint.`) ออกทั้งหมด
     - ตัดค่าความจุสมมติ 3,000,000 แผ่น (Fallback Capacity) ออก โดยใช้อายุการใช้งานจริงของแต่ละหมวดหมู่เครื่องจักร (Inkjet ~200k, Laser ~500k, Cutter ~100k, Binder ~30k, Laminator ~50k)
     - ตัดค่าคงที่ `Flat 10,000 LAK / Job` สำหรับเครื่องตัดกิโยตินออก
   - **สูตรคำนวณตามจริงอิงจาก Data Material and Machinces (1).md:**
     - **Inkjet:** $\text{ค่าเสื่อมต่อหน้า} = \frac{\text{ราคาเครื่อง}}{\text{จำนวนแผ่นรวม}} + \sum(\text{Maintenance Box, Printhead, Pickup Roller, Carriage Belt})$
     - **Laser:** $\text{ค่าเสื่อมต่อหน้า} = \frac{\text{ราคาเครื่อง}}{\text{จำนวนแผ่นรวม}} + \sum(\text{Drum, Fuser, Transfer Belt, Pickup Roller, Waste Toner Box})$
     - **Cutter (Guillotine):** $\text{ค่าเสื่อมต่อรอบตัด} = \frac{\text{ราคาเครื่อง}}{\text{จำนวนรอบตัดรวม}} + \sum(\text{ค่าจ้างลับคมมีด}, \text{ไม้รองตัด})$ (หน่วย: **ຮອບຕັດ / Cuts**)
     - **Cutter (Plotter):** $\text{ค่าเสื่อมต่อเมตร} = \frac{\text{ราคาเครื่อง}}{\text{ระยะเมตรตัดรวม}} + \sum(\text{ใบมีดพล็อตเตอร์}, \text{แถบรองมีด})$ (หน่วย: **ແມັດ / Meters**)
     - **Laminator:** $\text{ค่าเสื่อมต่อเมตร} = \frac{\text{ราคาเครื่อง}}{\text{ระยะเมตรเคลือบลวม}} + \sum(\text{ลูกกลิ้งซิลิโคน}, \text{ฮีตเตอร์ความร้อน})$ (หน่วย: **ແມັດ / Meters**)
     - **Binder:** $\text{ค่าเสื่อมต่อเล่ม} = \frac{\text{ราคาเครื่อง}}{\text{จำนวนเล่มรวม}} + \sum(\text{ใบมีดปาดสัน}, \text{เข็มเจาะรู})$ (หน่วย: **ຫົວ / Books**)
   - **การยืนยันผลการทดสอบ:**
     - รัน Unit Tests: **24 tests passed (5 suites, 0 failed)**
     - รัน Typecheck: **tsc --noEmit: 0 errors**
     - รัน Production Build: **vite build: Built successfully in 466ms**
     - รัน Go Backend Tests: **go test ./...: All packages passed**


