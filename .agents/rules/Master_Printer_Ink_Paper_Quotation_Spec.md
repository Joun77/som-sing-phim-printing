---
trigger: manual
---

# System Specification: Inbound Procurement, Inventory, Equipment & Dynamic Print Cost Calculator (Quotation Module)
**System Name:** Som Sing Printing Admin System - Complete Inbound & Quotation Module  
**Target Environment:** IDE Antigravity / Next.js / React / Node.js / Database  
**Language:** Lao (UI Labels), English (Code/Database/Keys), Thai (Document Context / Developer Reference)

---

## 1. Executive Workflow & Data Flow (ภาพรวมระบบและกระบวนการทำงาน)

ระบบรองรับกระบวนการทำงานแบบบูรณาการครบวงจรตั้งแต่การนำเข้าสินค้า (Inbound Procurement) การบริหารคลังสินค้า/เครื่องจักร (Inventory & Equipment) ไปจนถึงการประมวลผลต้นทุนในใบเสนอราคา (Quotation Cost Calculator):

### 1.1. Inbound Procurement Modes (2 โหมดการนำเข้าสินค้า)
1. **Restock / Existing Item Mode (นำเข้าสินค้าที่มีในระบบแล้ว):**
   - ค้นหา Item / Ink / Paper จากคลังเดิม
   - บันทึก จำนวนนำเข้า (Quantity), ราคาซื้อล่าสุด (Unit Price - ระบบจะ **Overridden ทับราคาเดิม** ใน Master Catalog เป็นราคาใหม่ล่าสุด), วันที่นำเข้า, ผู้จัดจำหน่าย (Supplier), และอัปโหลดสแกนใบเสร็จ/ใบกำกับภาษี (Receipt File)
   - **System Action:** เพิ่มจำนวน Stock คงเหลืออัตโนมัติ, อัปเดตราคาล่าสุดใน Master Catalog และบันทึกประวัติ Transaction/Receipt ลง Server Storage
2. **New Master Product Mode (นำเข้าสินค้า/แบรนด์ใหม่):**
   - กรอกรายละเอียด Master Specification ของสินค้าใหม่ทั้งหมด
   - **กรณีเครื่องพิมพ์ (Printer):** บังคับระบุ Asset ID และ Serial Number (S/N) แยกตามตัวเครื่อง (1 เครื่อง = 1 Record ในระบบ)
   - **System Action:** สร้าง Master Record ใหม่ลงระบบ + เพิ่มลงคลังสินค้า/เครื่องจักร + อัปโหลดรูปถ่ายตัวจริงและใบเสร็จลง Server Storage อัตโนมัติ

### 1.2. Module Integration & Redirection Logic
* **เครื่องพิมพ์ (Printers):** เมื่อนำเข้าสำเร็จ ข้อมูลจะถูกบันทึกและส่งต่อไปยัง **"หน้าเครื่องจักร (Equipment Page)"** อัตโนมัติ โดยเตรียม Field `Status` (Default: `In Use`) และ `Location/Department` ไว้ให้ทีมช่าง/แอดมินไปอัปเดตสถานะต่อที่หน้านั้น
* **หมึกพิมพ์ & กระดาษ/วัสดุพิมพ์ (Ink, Paper & Supplies):** เมื่อนำเข้าสำเร็จ ข้อมูลจะไปอัปเดตจำนวน Stock และราคาล่าสุดที่ **"หน้าคลังสินค้า (Inventory / Stock Page)"** อัตโนมัติ
* **Multi-Currency Handling:** ระบบมีสกุลเงินหลักเป็น **LAK (กีบ)** กรณีที่นำเข้าราคาเป็น THB หรือ USD ระบบจะดึง **อัตราแลกเปลี่ยนประจำวัน (Daily Exchange Rate)** ที่บันทึกในระบบมาแปลงต้นทุนเป็น LAK อัตโนมัติ

---

## 2. Inbound Paper Form Specification (ฟอร์มนำเข้ากระดาษและวัสดุพิมพ์)

ฟอร์มนำเข้ากระดาษถูกออกแบบเป็น **Dynamic Form** ปรับเปลี่ยน Field ตามรูปแบบกระดาษ (`paper_format`):

### 2.1. General Master Fields (ข้อมูลทั่วไป)
* `paper_code` (PK): รหัสกระดาษ / SKU (เช่น `PAP-A4-GLO-160`, `ROLL-CAN-MAT-36`)
* `paper_name`: ชื่อกระดาษ / รายละเอียด (เช่น `กระดาษ Glossy A4 160gsm`)
* `brand`: ยี่ห้อ / แบรนด์ (Double A, Kodak, Felix Schoeller ฯลฯ)
* `paper_surface`: ประเภทเนื้อผิว (`Glossy`, `Matte`, `Satin/Luster`, `Plain Paper`, `Canvas`, `Sticker/Vinyl`)
* `ink_compatibility` (Array): รองรับหมึกพิมพ์ (`Dye Ink`, `Pigment Ink`, `Eco-Solvent`, `UV Ink`, `Toner`)
* `grammage_gsm`: ความหนาแน่นกระดาษ (GSM เช่น `70`, `80`, `130`, `160`, `230`, `260`)

### 2.2. Dynamic Format & Dimension Fields
* **กรณี A: กระดาษแผ่นมาตรฐาน (Sheet Paper):**
  - `standard_size`: ขนาดมาตรฐาน (`A4`, `A3`, `A3+`, `A5`, `B5`, `SRA3`, `Custom Sheet`)
  - `custom_sheet_dim`: ขนาด Custom (กว้าง x ยาว mm)
  - `packaging_type`: รูปแบบบรรจุภัณฑ์ (`กล่อง/Box`, `รีม/Ream`, `พับ/Pack`)
  - `sheets_per_pack`: จำนวนแผ่นต่อพับ/รีม (เช่น 500 แผ่น/รีม)
  - `quantity_inbound`: จำนวนนำเข้า (เลือกหน่วย: รีม, พับ, กล่อง)
  - `total_sheets_calc`: คำนวณจำนวนแผ่นรวมอัตโนมัติ = `quantity_inbound` x `sheets_per_pack`
* **กรณี B: กระดาษม้วน (Roll Paper):**
  - `roll_width`: หน้ากว้างม้วน (เลือกหน่วย: นิ้ว/Inch หรือ mm เช่น `24"`, `36"`, `42"`, `60"`)
  - `roll_length`: ความยาวม้วน (เลือกหน่วย: เมตร/Meters หรือ ฟุต/Feet เช่น `30m`, `50m`)
  - `core_size`: ขนาดแกนม้วน (`2 นิ้ว`, `3 นิ้ว`)
  - `quantity_inbound_rolls`: จำนวนม้วนนำเข้า (หน่วย: ม้วน/Rolls)
  - `total_sqm_calc`: คำนวณตารางเมตรอัตโนมัติ = `[กว้าง(m)] x [ยาว(m)] x [จำนวนม้วน]`

---

## 3. Complete Database Schema

### 3.1. Table: `printers` (ตารางหลักเครื่องพิมพ์)
| Column Name | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `asset_id` | String | PK, Required, Unique | รหัสทรัพย์สิน (เช่น PRN-001) |
| `serial_number` | String | Required, Unique per Machine | หมายเลข S/N แยกตามตัวเครื่อง |
| `brand` | String | Required | ยี่ห้อเครื่องพิมพ์ |
| `model` | String | Required | ชื่อรุ่น |
| `category` | Enum | Required | Inkjet, Laser, Thermal, Dot Matrix, MFP, Plotter |
| `color_scheme_type` | Enum | Required | Monochrome, CMYK, Photo (6-8 สี), Custom |
| `total_color_slots` | Integer | Required | จำนวนช่องใส่หมึกทั้งหมด |
| `expected_life_a4_pages`| Integer | Required | อายุการใช้งานคาดการณ์ (จำนวนแผ่น A4) |
| `maintenance_rate_percent`| Decimal | Required, Default: 20 | ค่าบำรุงรักษา/อะไหล่ (%) |
| `purchase_date` | Date | Required | วันที่นำเข้าจัดซื้อ |
| `price_cost` | Decimal | Required | ราคาจัดซื้อ/ค่าเช่า (LAK) |
| `vendor_supplier` | String | Required | ชื่อผู้จัดจำหน่าย |
| `warranty_expiry_year` | Integer | Required | ปีที่หมดประกัน (YYYY) |
| `status` | Enum | Default: 'In Use' | In Use, Spare, Under Repair, Retired (แก้ไขหน้า Equipment) |
| `location_dept` | String | Required | แผนก/สถานที่ตั้ง |
| `product_image_url` | String | Auto-upload URL | URL รูปถ่ายเครื่องพิมพ์ |
| `receipt_invoice_url` | String | Auto-upload URL | URL ใบเสร็จรับเงิน |

### 3.2. Table: `ink_master_catalog` (ตารางคลังหมึกพิมพ์)
| Column Name | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `ink_code` | String | PK, Required, Unique | รหัสหมึก/SKU (เช่น EPS-008-BK, C, M, Y) |
| `color_name` | String | Required | ชื่อสีเต็ม (Photo Black, Light Cyan ฯลฯ) |
| `color_group` | String | Required | กลุ่มสีหลัก (C, M, Y, K, Custom) |
| `volume` | String/Number | Required | ปริมาณหมึกต่อขวด/ตลับ (เช่น 127 ml) |
| `stock_quantity` | Integer | Required, Default: 0 | จำนวนหมึกคงเหลือในคลัง (อัปเดตอัตโนมัติ) |
| `unit_price` | Decimal | Required | ราคาต่อหน่วยล่าสุดใน LAK (Overridden เมื่อ Restock) |
| `ink_base_type` | Enum | Required | Dye, Pigment, Toner, Eco-Solvent, UV |
| `is_compatible_ink` | Enum | Required | OEM (หมึกแท้), Compatible (หมึกเทียบ) |
| `product_image_url` | String | Auto-upload URL | URL รูปขวดหมึก |
| `receipt_invoice_url` | String | Auto-upload URL | URL ใบเสร็จซื้อหมึกล่าสุด |

### 3.3. Table: `printer_color_link` (ตารางผูกหมึกกับเครื่องพิมพ์ 1:N)
| Column Name | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `link_id` | String/UUID | PK, Auto-gen | รหัสรายการผูก |
| `asset_id` | String | FK -> printers.asset_id | รหัสเครื่องพิมพ์ |
| `ink_code` | String | FK -> ink_master_catalog.ink_code | รหัสหมึกที่เครื่องพิมพ์นี้ใช้ |
| `slot_position` | String | Required | ตำแหน่งช่องใส่ (Slot 1 - Black, Slot 2 - Cyan ฯลฯ) |
| `iso_page_yield_a4` | Integer | Required | จำนวนแผ่น A4 มอตรฐาน (5% Coverage) ที่หมึกนี้พิมพ์ได้บนเครื่องรุ่นนี้ |

### 3.4. Table: `paper_catalog` (ตารางคลังกระดาษ)
| Column Name | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `paper_code` | String | PK, Required, Unique | รหัสกระดาษ / SKU |
| `paper_name` | String | Required | ชื่อกระดาษ |
| `paper_format` | Enum | Required | `Sheet` (กระดาษแผ่น), `Roll` (กระดาษม้วน) |
| `sheets_per_pack` | Integer | Optional (Sheet) | จำนวนแผ่นต่อรีม/แพ็ค |
| `roll_width_m` | Decimal | Optional (Roll) | หน้ากว้างม้วน (เมตร) |
| `roll_length_m` | Decimal | Optional (Roll) | ความยาวม้วน (เมตร) |
| `stock_quantity` | Decimal | Required | จำนวนคงเหลือในคลัง (รีม/แพ็ค หรือ ม้วน) |
| `unit_price` | Decimal | Required | ราคาต่อหน่วยล่าสุด (LAK) |

### 3.5. Tables: `quotations` & `quotation_items` (ประวัติการคำนวณและใบเสนอราคา)
* **`quotations`:** `quotation_id` (PK), `customer_name`, `total_cost`, `total_selling_price`, `overall_profit_percent`, `created_at`
* **`quotation_items`:** `item_id` (PK), `quotation_id` (FK), `asset_id` (FK), `paper_code` (FK), `job_width_mm`, `job_length_mm`, `coverage_k_percent`, `coverage_c_percent`, `coverage_m_percent`, `coverage_y_percent`, `ink_cost`, `machine_cost`, `paper_cost`, `labor_cost`, `finishing_cost`, `waste_percent` (Default: 5%), `unit_cost_total`, `unit_selling_price`

---

## 4. Dynamic Print Cost Calculation Logic (สูตรการคำนวณต้นทุนการพิมพ์)

เมื่อผู้ใช้ออกใบเสนอราคา (Quotation) หรือใช้โปรแกรมคำนวณต้นทุน ระบบจะประมวลผลตามขั้นตอนดังนี้:

### Step 1: คำนวณตัวคูณขนาดกระดาษ Factor S
$$Factor S = rac{	ext{Area of Job } (mm^2)}{62,370 	ext{ (Area of A4: } 210 	imes 297 mm)}$$

### Step 2: คำนวณค่าหมึกพิมพ์ (Ink Cost per Sheet/Job)
ดึงราคา `unit_price` จาก `ink_master_catalog` และดึงค่า `iso_page_yield_a4` จาก `printer_color_link`:
$$	ext{Ink Cost}_K = \left( rac{	ext{Price}_K}{	ext{ISO Yield}_K} 
ight) 	imes \left( rac{\%Cov_K}{5\%} 
ight) 	imes Factor S$$
$$	ext{Total Ink Cost} = 	ext{Ink Cost}_K + 	ext{Ink Cost}_C + 	ext{Ink Cost}_M + 	ext{Ink Cost}_Y$$

### Step 3: คำนวณค่าเครื่องพิมพ์/อะไหล่ (Machine Depreciation Cost)
ดึงข้อมูลจากตาราง `printers`:
$$	ext{Machine Cost} = rac{	ext{Price Cost} 	imes (1 + rac{	ext{Maintenance Rate} \%}{100})}{	ext{Expected Life A4 Pages}} 	imes Factor S$$

### Step 4: คำนวณค่ากระดาษ/วัตถุดิบ (Paper Cost)
* **กระดาษแผ่น:** $	ext{Paper Cost} = rac{	ext{Unit Price}}{	ext{Sheets per Pack}} 	imes Factor S$
* **กระดาษม้วน:** $	ext{Paper Cost} = rac{	ext{Unit Price}}{	ext{Roll Area } (m^2)} 	imes 	ext{Job Area } (m^2)$

### Step 5: คำนวณต้นทุนรวมทั้งหมด (Total Cost with Custom Inputs)
ให้ผู้ใช้ป้อนค่าแรงงาน (`labor_cost`) และ ค่าหลังการพิมพ์/เข้าเล่ม/เคลือบ (`finishing_cost`) เพิ่มเติม:
$$	ext{Subtotal Cost} = 	ext{Total Ink Cost} + 	ext{Machine Cost} + 	ext{Paper Cost} + 	ext{Labor Cost} + 	ext{Finishing Cost}$$
$$	ext{Total Cost per Item} = 	ext{Subtotal Cost} 	imes \left(1 + rac{	ext{Waste} \% 	ext{ (Default: 5\%)}}{100}
ight)$$
$$	ext{Selling Price} = 	ext{Total Cost per Item} 	imes \left(1 + rac{	ext{Profit} \%}{100}
ight)$$

---

## 5. UI Dictionary & Lao Translation Matrix

| ภาษาไทย (Source Context) | ภาษาลาว (Lao UI Text) | ตำแหน่งแสดงผล (UI Location) |
| :--- | :--- | :--- |
| **หมึกพิมพ์** | ໝຶກພິມ | Dynamic Form Category Tab |
| **กระดาษ** | ເຈ້ຍ | Dynamic Form Category Tab |
| **ฟิล์มเคลือบ** | ຟີມເຄືອບ | Dynamic Form Category Tab |
| **เครื่องจักร** | ເຄື່ອງຈັກ | Dynamic Form Category Tab |
| **เข้าเล่ม** | ເຂົ້າເລົ່ມ | Dynamic Form Category Tab |
| **อะไหล่** | ອະໄຫຼ່ / ອາໄຫຼ່ | Dynamic Form Category Tab |
| **รายการ/ชิ้น** | ລາຍການ / ຊິ້ນ | Summary Card Unit |
| **แผ่นสีและ** | ແຜ່ນສີ ແລະ | Form Label (Color Slots) |
| **ลวดเย็บแม็ก** | ລວດເຢັບແມັກ | Table Data Row / Category |
| **กระดาษแผ่น** | ເຈ້ຍແຜ່ນ | Paper Inbound Format Option |
| **กระดาษม้วน** | ເຈ້ຍມ້ວນ | Paper Inbound Format Option |
| **ค่าแรงงาน** | ຄ່າແຮງງານ | Quotation Cost Input |
| **ค่าหลังการพิมพ์** | ຄ່າຫຼັງການພິມ / ເຂົ້າເລົ່ມ | Quotation Cost Input |
| **ค่าเผื่อเสียหาย** | ຄ່າເຜື່ອເສຍຫາຍ | Quotation Cost Input (% Waste) |
| **ราคาขายแนะนำ** | ລາຄາຂາຍແນະນຳ | Quotation Output |
