# Task 41: Pricing Engine Ink Cost Formula Rectification & Order Edit State Synchronization

## 📌 Mission & Context

แก้ไขข้อผิดพลาดในการคำนวณต้นทุนหมึกพิมพ์ที่ทำให้ตัวเลขพุ่งสูงผิดปกติ (เช่น 3.6 ล้านกีบ สำหรับ 10 แผ่น) พร้อมทั้งแก้ปัญหาความไม่สอดคล้องกันของข้อมูลใน Modal แก้ไขออเดอร์ (`Edit Order & Pricing Specs`) โดยทำการผูก State `quantity` และผลลัพธ์การคำนวณต้นทุนระหว่างแถบสรุปด้านบน (Live Cost Breakdown) และกล่องคอนฟิกสเปกด้านล่าง (`ItemSpecConfigurator`) ให้ตรงกันแบบ 100%

---

## 🎯 สรุปการแบ่งระยะงาน (Phase Breakdown)

\[ Phase 1: Ink Cost & Paper Cost Formula Audit \] ──► \[ Phase 2: Order Edit Modal Two-Way State Binding \] ──► \[ Phase 3: Dynamic Margin & Selling Price Real-Time Recalculation \]

---

## 🚀 รายละเอียดการดำเนินงานแต่ละเฟส (Detailed Specifications)

### 🔹 Phase 1: Pricing Engine Ink Cost Formula Rectification

- **Target Files:**  
    
  - `admin-system/backend/pricing/engine.go`  
  - `admin-system/frontend/src/utils/pricingCalculator.ts` (หรือ `src/features/pricing/calculator.ts`)  
  - `admin-system/frontend/src/components/pricing/ItemSpecConfigurator.tsx`


- **Technical Specs:**  
    
  1. ตรวจสอบสูตรคำนวณต้นทุนหมึกพิมพ์ (Ink Cost):  
     - **ข้อผิดพลาดเดิม:** นำราคาหมึกทั้งขวด (เช่น 350,000 กีบ) มาคูณตรงๆ หรือไม่ได้หาร 100 สำหรับค่า % Coverage  
     - **สูตรมาตรฐานที่ถูกต้อง:**  
         
       // ปริมาณหมึกที่ใช้ต่อแผ่น (ml)  
         
       // ค่ามาตรฐาน: หมึก 100% Coverage ใช้ประมาณ 0.007 ml ต่อหน้า A4  
         
       const blackMlPerSheet \= (blackCoverage / 100\) \* 0.007 \* a4EquivalentFactor;  
         
       const colorMlPerSheet \= (colorCoverage / 100\) \* 0.007 \* a4EquivalentFactor;  
         
       // ราคาต้นทุนหมึกต่อ ml  
         
       const blackCostPerMl \= blackInkBottlePrice / blackInkBottleVolumeMl;  
         
       const colorCostPerMl \= colorInkSetPrice / colorInkSetVolumeMl;  
         
       // ต้นทุนหมึกรวม  
         
       const totalInkCost \= (  
         
         (blackMlPerSheet \* blackCostPerMl) \+  
         
         (colorMlPerSheet \* colorCostPerMl)  
         
       ) \* totalPrintedSheets;

       
  2. ตรวจสอบต้นทุนกระดาษ (Paper Unit Cost):  
       
     const sheetCost \= totalPackImportCost / (packCount \* sheetsPerPack);  
       
     const totalPaperCost \= sheetCost \* totalRequiredSheetsWithSpoilage;

---

### 🔹 Phase 2: Order Edit Modal Two-Way State Binding

- **Target Files:**  
    
  - `admin-system/frontend/src/features/orders/OrderEditModal.tsx` (หรือ `EditOrderModal.tsx`)  
  - `admin-system/frontend/src/components/pricing/ItemSpecConfigurator.tsx`  
  - `admin-system/frontend/src/utils/orderDataMapper.ts`


- **Technical Specs:**  
    
  1. ใน `OrderEditModal.tsx`:  
     - เมื่อเปิด Modal ให้ดึงข้อมูล `order.items[0]` หรือ `order.specs` ผ่าน `mapOrderToFormSpecs(order)`:  
         
       const initialSpecs \= useMemo(() \=\> mapOrderToFormSpecs(order), \[order\]);  
         
       const \[currentSpecs, setCurrentSpecs\] \= useState(initialSpecs);  
         
       const \[liveCostBreakdown, setLiveCostBreakdown\] \= useState(null);  
         
     - ส่ง `initialSpecs` และ `currentSpecs.quantity` เข้าไปเป็น Props ของ `ItemSpecConfigurator`:  
         
       \<ItemSpecConfigurator  
         
         initialSpecs={currentSpecs}  
         
         quantity={currentSpecs.quantity || order.quantity}  
         
         onChange={(updatedSpecs, calculatedCost) \=\> {  
         
           setCurrentSpecs(updatedSpecs);  
         
           setLiveCostBreakdown(calculatedCost);  
         
         }}  
         
       /\>

       
  2. เชื่อมโยงแถบด้านบน (Top Banner \- "LIVE COST & PRICING BREAKDOWN"):  
     - แสดงค่า `Job #1: Custom Print x{currentSpecs.quantity}`  
     - แสดง `ต้นทุนกระดาษ (Paper)`: `liveCostBreakdown.paperCost`  
     - แสดง `ต้นทุนหมึก (Ink)`: `liveCostBreakdown.inkCost`  
     - แสดง `ต้นทุนรวม (Cost)`: `liveCostBreakdown.totalCost`  
     - แสดง `มูลค่ารวม (Subtotal)`: `liveCostBreakdown.sellingPrice`  
     - แสดง `กำไร %`: `liveCostBreakdown.grossMarginPercent`

---

### 🔹 Phase 3: Dynamic Margin & Selling Price Synchronization

- **Target Files:**  
    
  - `admin-system/frontend/src/features/orders/OrderEditModal.tsx`  
  - `admin-system/backend/orders/handlers.go` (UpdateOrder endpoint)


- **Technical Specs:**  
    
  1. การคำนวณราคาขาย (Selling Price):  
       
     // ราคาขายตามอัตรากำไร (Base Profit Margin)  
       
     const margin \= currentSpecs.profitMargin || 35; // 35%  
       
     const sellingPrice \= totalCost / (1 \- (margin / 100));  
       
     const grossProfit \= sellingPrice \- totalCost;  
       
     const grossMarginPercent \= (grossProfit / sellingPrice) \* 100;  
       
  2. เมื่อกดปุ่ม "ບັນທຶກການແກ້ໄຂ" (Save Changes):  
     - ส่ง Payload สเปกใหม่พร้อมต้นทุนและราคาขายใหม่ที่คำนวณได้ไปยัง `PUT /api/orders/:id`  
     - ทำการ Invalidate TanStack Query `['orders']` และ `['order', order.id]` เพื่อให้หน้ารายการออเดอร์และ Kanban Board อัปเดตทันที

---

## 📋 Verification & Acceptance Criteria

- ในหน้าแก้ไขออเดอร์ จำนวนชิ้น (Quantity) บนแถบสรุปด้านบนและในกล่องสเปกด้านล่างแสดงค่าตรงกัน 100% (เช่น 20 ชิ้นตรงกัน)  
- ต้นทุนหมึกพิมพ์สำหรับงานพิมพ์จำนวนน้อย (10-20 แผ่น) คำนวณได้สมเหตุสมผลตามปริมาณการใช้จริง (หลักร้อยถึงพันกีบ ไม่พุ่งไปหลักล้าน)  
- ยอดต้นทุนกระดาษ, หมึก, ค่าเสื่อมเครื่อง, ค่าฟินิชชิ่ง, และราคาขายรวมบนแถบ Live Breakdown ด้านบนมีค่าเท่ากับในกล่องสรุปด้านล่างทุกประการ  
- อัตรากำไร (Margin) แสดงผลเป็นค่าบวก (เช่น 35% หรือ 58%) สอดคล้องกับราคาขายจริง ไม่ติดลบ

