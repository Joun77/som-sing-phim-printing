# Comprehensive QA Test Suite: Inbound Procurement vs. Inventory Parity & Cost Verification

**System:** Som Sing Phim Printing ERP  
**Modules Audited:**  
1. `ນຳເຂົ້າສິນຄ້າ (Inbound Procurement)` (`/inbound`)  
2. `ຄັງສິນຄ້າ & ເສດເຈ້ຍ (Inventory & Offcuts)` (`/inventory`)  
3. `ລາຍລະອຽດວັດສະດຸ (Material Details Page)` (`/inventory/material/:sku`)  
4. `ເຄື່ອງຈັກ & ຊ່າງພິມ (Equipment & Machine Fleet)` (`/equipment`)  

**Roles Involved:** `system-analyst-qa`, `somsing-backend-engineer`, `somsing-frontend-engineer`, `somsing-printing-simulator`  
**Date:** September 4, 2026  
**Status:** Audit Completed & Bug Solved  

---

## 1. Executive Summary & Root Cause Analysis

### 1.1 The Reported Defect
> *"นำเข้า 1 อัน ไปดูที่คลังสินค้ามี 500 อัน แต่เข้าไปดูรายละเอียดมีแค่อันเดียวเหมือนกัน ข้อมูลไม่ถูกต้อง... ปุ่มจัดการในตารางไม่เหมือนกัน"*

### 1.2 The Root Cause Uncovered
There were **two fundamental architectural disconnects** between the Inbound Procurement system and the Inventory Warehouse system:

1. **Purchase Unit vs. Consumption Unit Confusion (หน่วยจัดซื้อ vs หน่วยเบิกใช้):**
   - **กระดาษ (Paper):** ซื้อเป็น **"แร็ก / รีม" (Purchase Unit)** เช่น 1 รีม แต่ระบบพิมพ์ต้องตัดและเบิกใช้เป็น **"แผ่น" (Consumption Unit)** เช่น 500 แผ่น
   - **น้ำหมึก (Ink):** ซื้อเป็น **"ขวด" (Purchase Unit)** เช่น 1 ขวด แต่ระบบคิดต้นทุนการพิมพ์ต้องเบิกใช้เป็น **"มิลลิลิตร / ml" (Consumption Unit)** เช่น 70 ml หรือ 500 ml
   - **จุดที่ผิดพลาดเดิม:** ในฐานข้อมูล `materials.stock_qty` บันทึกปริมาณเป็นหน่วยเบิกใช้ (500 ml หรือ 500 แผ่น) แต่ในหน้าคลังสินค้าและหน้ารายละเอียด กลับนำเลข `500` ไปแปะป้ายหน่วยจัดซื้อเป็น **"500 ขวด"** หรือ **"500 รีม"**!
2. **Total Asset Value Multiplier Bug (สูตรคำนวณมูลค่ารวมคลังสินค้า):**
   - ในตารางหมึกพิมพ์ (`InventoryTable.tsx`):
     ```tsx
     // โค้ดเดิมที่ผิด:
     const totalAssetValue = lot.currentQty * parent.unitPrice;
     // ผลลัพธ์: 500 (ml) * 80,000 (ราคาต่อขวด) = 40,000,000 LAK !
     ```
   - ส่งผลให้นำเข้าหมึกเพียง 1 ขวด (80,000 กีบ) แต่มูลค่าสินทรัพย์ในคลังสินค้าพุ่งไปเป็น **40 ล้านกีบ (40,000,000 LAK)**!
   - **สูตรแก้ไขที่ถูกต้อง:**
     ```tsx
     const volumePerBottle = Number(parent.volume || 70);
     const totalAssetValue = volumePerBottle > 0 
       ? Math.round((lot.currentQty / volumePerBottle) * parent.unitPrice)
       : lot.currentQty * parent.costPerConsumptionUnit;
     // ผลลัพธ์ที่ถูกต้อง: (500 ml / 500 ml) * 80,000 = 80,000 LAK
     ```

---

## 2. Exhaustive End-to-End Test Cases (ทุกประเภทสินค้า)

### Case 1: นำเข้ากระดาษ (Paper & Printing Stock)
* **ตัวอย่างการนำเข้า:** กระดาษ `Double A 80g A4`
* **ข้อมูลในฟอร์มนำเข้า:**
  - ประเภท (Category): `Paper`
  - จำนวนจัดซื้อ (Quantity): `10 แพ็ก/รีม` (Purchase Unit)
  - จำนวนแผ่นต่อแพ็ก (Multiplier): `500 แผ่น/แพ็ก`
  - ราคาซื้อต่อแพ็ก (Unit Price): `45,000 LAK / แพ็ก`
  - ยอดรวมใบเสร็จ (Total Price): `450,000 LAK`

| จุดที่ตรวจสอบ | การแสดงผลที่ถูกต้อง (Expected Result) | สถานะ |
| :--- | :--- | :---: |
| **หน้านำเข้า (`Inbound`)** | แสดงจำนวน: **10 ແພັກ**, ราคารวม: **LAK 450,000.00** | **PASS** |
| **หน้าคลังสินค้า (`Inventory`)** | สต็อกคงเหลือ: **5,000 ແຜ່ນ (~10 ແພັກ)**, ราคาต่อหน่วย: **45,000 LAK**, มูลค่ารวมในคลัง: **LAK 450,000.00** (ไม่ใช่ 225 ล้าน!) | **PASS** |
| **หน้ารายละเอียด (`Details`)** | สต็อกคงเหลือ: **5,000 ແຜ່ນ (~10 ແພັກ)**, ต้นทุนต่อหน่วยเบิก: **LAK 90.00 / ແຜ່ນ** | **PASS** |

---

### Case 2: นำเข้าน้ำหมึก (Ink & Toner Consumables)
* **ตัวอย่างการนำเข้า:** หมึกพิมพ์แท้ `EPSON-001-M (Magenta)`
* **ข้อมูลในฟอร์มนำเข้า:**
  - ประเภท (Category): `Ink`
  - จำนวนจัดซื้อ (Quantity): `2 ขวด` (Purchase Unit: ขวด)
  - ปริมาตรต่อขวด (Volume per Bottle): `70 ml`
  - ราคาซื้อต่อขวด (Unit Price): `80,000 LAK / ขวด`
  - ยอดรวมใบเสร็จ (Total Price): `160,000 LAK`

| จุดที่ตรวจสอบ | การแสดงผลที่ถูกต้อง (Expected Result) | สถานะ |
| :--- | :--- | :---: |
| **หน้านำเข้า (`Inbound`)** | แสดงจำนวน: **2 ຂວດ**, ราคารวม: **LAK 160,000.00** | **PASS** |
| **หน้าคลังสินค้า (`Inventory`)** | สต็อกคงเหลือ: **140 ml (~2.0 ຂວດ)**, ราคาต่อหน่วย: **80,000 LAK**, มูลค่ารวมในคลัง: **LAK 160,000.00** (ไม่ใช่ 11.2 ล้าน!) | **PASS** |
| **หน้ารายละเอียด (`Details`)** | สต็อกคงเหลือ: **140 ml (~2.0 ຂວດ)**, ต้นทุนต่อหน่วยเบิก: **LAK 1,142.86 / ml** | **PASS** |

---

### Case 3: นำเข้าเครื่องพิมพ์และเครื่องจักร (Printers & Heavy Machinery)
* **ตัวอย่างการนำเข้า:** เครื่องพิมพ์ `Epson L15150 Multi-Function Press`
* **ข้อมูลในฟอร์มนำเข้า:**
  - ประเภท (Category): `Printer / Equipment`
  - รหัสสินทรัพย์ (Asset ID): `PRN-9614`
  - จำนวน (Quantity): `1 เครื่อง`
  - ราคาซื้อเครื่อง (Purchase Price): `1,800,000 LAK`
  - อายุการใช้งานเป้าหมาย (Expected Life): `200,000 แผ่น`
  - อัตราบำรุงรักษา (Maintenance Rate): `20%`

| จุดที่ตรวจสอบ | การแสดงผลที่ถูกต้อง (Expected Result) | สถานะ |
| :--- | :--- | :---: |
| **หน้านำเข้า (`Inbound`)** | แสดงจำนวน: **1 ເຄື່ອງ**, ยอดรวม: **LAK 1,800,000.00** | **PASS** |
| **หน้าเครื่องจักร (`Equipment`)** | แสดงสถานะ: **ພ້ອມໃຊ້ງານ**, มูลค่าทางบัญชี: **1,800,000 LAK**, ค่าเสื่อมต่อหน้า: **LAK 9.00 / หน้า**, ค่าบำรุงรักษา: **LAK 1.80 / หน้า** | **PASS** |
| **หน้าผูกเครื่องพิมพ์ Step 2** | คำนวณต้นทุนเครื่องจักร: ค่าเสื่อม + ค่าไฟ + ค่าหมึกตรงตามฐานข้อมูลจริง | **PASS** |

---

### Case 4: นำเข้าอุปกรณ์หลังพิมพ์และบรรจุภัณฑ์ (Finishing & Packaging)
* **ตัวอย่างการนำเข้า:** ฟอยล์ทองปั๊มร้อน `Gold Hot-Foil Roll 300m`
* **ข้อมูลในฟอร์มนำเข้า:**
  - ประเภท (Category): `Finishing`
  - จำนวนจัดซื้อ (Quantity): `3 ม้วน`
  - ราคาซื้อต่อม้วน (Unit Price): `250,000 LAK`
  - ยอดรวมใบเสร็จ (Total Price): `750,000 LAK`

| จุดที่ตรวจสอบ | การแสดงผลที่ถูกต้อง (Expected Result) | สถานะ |
| :--- | :--- | :---: |
| **หน้านำเข้า (`Inbound`)** | แสดงจำนวน: **3 ມ້ວນ**, ยอดรวม: **LAK 750,000.00** | **PASS** |
| **หน้าคลังสินค้า (`Inventory`)** | แสดงจำนวน: **3 ມ້ວນ**, ราคาต่อหน่วย: **250,000 LAK**, มูลค่ารวม: **LAK 750,000.00** | **PASS** |
| **หน้ารายละเอียด (`Details`)** | สต็อกคงเหลือ: **3 ມ້ວນ**, ต้นทุนต่อหน่วยเบิก: **LAK 250,000.00 / ມ້ວນ** | **PASS** |

---

## 3. มาตรฐานปุ่มจัดการในตาราง (Table Actions Standardization)

### 3.1 การเปรียบเทียบและการปรับปรุงให้เป็นมาตรฐานเดียวกัน
ก่อนหน้านี้ ตารางในหน้านำเข้าสินค้าและหน้าคลังสินค้ามีปุ่มและหน้าตาไม่สอดคล้องกัน:

| ฟังก์ชันการจัดการ | หน้านำเข้าสินค้า (`Inbound`) | หน้าคลังสินค้าเดิม (`Inventory`) | หน้าคลังสินค้าที่ปรับปรุงใหม่ (Standardized) |
| :--- | :---: | :---: | :---: |
| **ดูรายละเอียดสินค้า (View Details)** | ไอคอนรูปตา (`Eye`) + ข้อความ "ລາຍລະອຽດ" | มีเฉพาะหมวดทั่วไป ส่วนหมวดหมึกมีแค่ปุ่มข้อความ "Details" | **ไอคอนรูปตา (`Eye`) + "ລາຍລະອຽດ" ครบทุกหมวดหมู่** |
| **เบิกจ่ายสินค้า (Stock Discharge)** | - | มีปุ่ม "ເບີກ" สีแดง | **มีปุ่ม "ເບີກ" (Discharge) เฉพาะหน้าคลัง** |
| **ปรับสต็อกด่วน (Quick Adjust)** | - | มีปุ่ม -50 / +50 (เฉพาะหมึก) | **คงไว้สำหรับช่างเติมหมึกด่วน** |
| **ลบรายการ (Delete)** | ไอคอนถังขยะ (`Trash2`) | มีเฉพาะหมวดทั่วไป | **ไอคอนถังขยะ (`Trash2`) ครบทุกหมวดหมู่** |

---

## 4. ผลการทดสอบ Build และความปลอดภัยระบบ
- `admin-system/frontend`: `npm run build` ผ่าน 100% (0 errors)
- ข้อมูล Inbound กับ Inventory ซิงก์ตัวเลขตรงกันทั้งจำนวนจัดซื้อ ปริมาณเบิกใช้ และมูลค่ารวมของสินทรัพย์ในคลัง
