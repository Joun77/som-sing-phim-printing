# 📄 รายงานสรุปผลการปรับโครงสร้างระบบ & อัปเกรด Pricing Engine (Refactor Summary Report)

**โครงการ**: Som Sing Phim Printing Admin System  
**วันที่**: 15 สิงหาคม 2026  
**สถานะ**: ใช้งานได้สมบูรณ์ 100% (Passed TypeScript Check, Vite Build & Go Unit Tests)

---

## 📂 1. โครงสร้าง Frontend ที่ปรับเปลี่ยนไป (Feature-Sliced Design & Path Aliases)

โครงสร้างโฟลเดอร์ใน `admin-system/frontend/src/` ถูกปรับปรุงใหม่ตามสถาปัตยกรรม **Feature-Sliced Design (FSD)** เพื่อแยกระบบเป็นมอดูลตามโดเมนธุรกิจ (Domain-Driven) และลดความซับซ้อนในการ Import โค้ด:

```text
admin-system/frontend/src/
 ├── components/               # Shared Components (ConfirmDeleteModal, CurrencyRatesModal, Sidebar)
 ├── lib/                      # Config & Shared Utilities
 ├── store/                    # State Management (AppContext)
 ├── types/                    # Shared Types
 ├── features/                 # Feature Modules (แต่ละโฟลเดอร์มี index.ts เป็น Public API)
 │    ├── inventory/           # จัดการสต็อก วัสดุ กระดาษ หมึกพิมพ์
 │    ├── orders/              # จัดการรายการสั่งซื้อและการสร้างออเดอร์
 │    ├── pricing/             # เครื่องมือคำนวณราคาและใบเสนอราคา (QuotationManager)
 │    ├── customers/           # จัดการข้อมูลลูกค้าและประวัติการสั่งซื้อ
 │    ├── equipment/           # จัดการเครื่องพิมพ์และบันทึกมิเตอร์/Downtime
 │    ├── inbound/             # การนำเข้าสินค้า/วัตถุดิบและแบบฟอร์ม Import
 │    ├── hr/                  # จัดการข้อมูลพนักงานและกะการทำงาน
 │    ├── production/          # กระดานวางแผนการผลิต (ProductionBoard)
 │    ├── dashboard/           # แดชบอร์ดภาพรวมระบบ
 │    └── analytics/           # วิเคราะห์ประวัติและรายงาน (HistoryAnalytics)
 ├── App.tsx
 └── main.tsx
```

### 🛠️ Path Aliases ที่กำหนดเพิ่ม (`tsconfig.json` & `vite.config.ts`):
- `@/*` ➔ `src/*`
- `@features/*` ➔ `src/features/*`
- `@components/*` ➔ `src/components/*`
- `@store/*` ➔ `src/store/*`
- `@types/*` ➔ `src/types/*`
- `@lib/*` ➔ `src/lib/*`

---

## 🧮 2. สรุปสมการ Pricing Logic ใหม่ใน Backend (`backend/pricing/engine.go`)

ได้ทำการอัปเกรดโครงสร้าง `CalculationRequest` / `CalculationResponse` และสูตรคำนวณใน `CalculateJobPricing` ดังนี้:

### 📥 Input Parameters ที่เพิ่มเข้ามา:
- `SetupCost` (`float64`): ต้นทุนตั้งเครื่องแบบคงที่ (Fixed Cost per Job)
- `FinishingCost` (`float64`): ต้นทุนหลังการพิมพ์ต่อชิ้น (Variable Cost per Unit)
- `BaseProfitPct` (`float64`): เปอร์เซ็นต์กำไรพื้นฐาน (รองรับทั้ง 30.0 หรือ 0.30)

### 📐 สมการการคำนวณ:
1. **Direct Cost (ต้นทุนทางตรง)**:
   $$\text{DirectCost} = \text{PaperCost} + \text{InkCost} + \text{DepreciationCost} + \text{MaintenanceCost} + \text{CustomFinishingCost} + \text{LaminationCost} + \text{BindingCost} + \text{LaborCost} + \text{SetupCost} + (\text{FinishingCost} \times \text{Quantity})$$
2. **Overhead & Spoilage (ค่าโสหุ้ยและของเสีย)**:
   $$\text{Subtotal} = \text{DirectCost} \times (1 + \text{OverheadPercent})$$
   $$\text{NetInternalCost} = \text{Subtotal} \times (1 + \text{SpoilagePercent})$$
3. **Volume Discount Logic (ส่วนลดตามปริมาณการสั่งผลิต)**:
   - หาก $\text{Quantity} \ge 1000$: ลด Profit Margin ลง $20\%$ (เช่น $30\% \to 24\%$) ➔ `VolumeDiscountPercent = 20%`
   - หาก $500 \le \text{Quantity} < 1000$: ลด Profit Margin ลง $10\%$ (เช่น $30\% \to 27\%$) ➔ `VolumeDiscountPercent = 10%`
   - หาก $\text{Quantity} < 500$: ไม่ลด Profit Margin ➔ `VolumeDiscountPercent = 0%`
   $$\text{EffectiveMargin} = \text{BaseMargin} \times \left(1 - \frac{\text{VolumeDiscountPercent}}{100}\right)$$
4. **Selling Price & Unit Price (ราคาขายและราคาต่อชิ้น)**:
   $$\text{SalePrice} = \frac{\text{NetInternalCost}}{1 - \text{EffectiveMargin}}$$
   $$\text{GrandTotal} = (\text{SalePrice} - \text{DiscountAmount}) \times (1 + \text{TaxPercent})$$
   $$\text{UnitPrice} = \frac{\text{GrandTotal}}{\text{Quantity}}$$

### 🧪 ผลการทดสอบ Unit Tests (`engine_test.go`):
- **Scenario 1 (สั่งพิมพ์ 1 แผ่น)**: `SetupCost` บวกเพิ่มเข้า Total Cost เต็มจำนวน, ใช้ `BaseProfitPct` เต็มจำนวน (Discount 0%) ➔ **PASSED**
- **Scenario 2 (สั่งพิมพ์ 500 แผ่น)**: คิดส่วนลด Volume Discount Step 1 (ลด Margin ลง 10%) ➔ **PASSED**
- **Scenario 3 (สั่งพิมพ์ 1,000+ แผ่น)**: คิดส่วนลด Volume Discount Step 2 (ลด Margin ลง 20%) ➔ **PASSED**

---

## 💡 3. คำแนะนำสำหรับการพัฒนาในอนาคต

### 🔔 1. ระบบแจ้งเตือนสต็อก (Stock Threshold Alerts)
- **Database Trigger / Cron Service**: สร้าง Background Cron Job เช็กสินค้าใน `inventory` ที่มี `current_stock <= min_reorder_level`
- **Notification Center**: ส่งการแจ้งเตือนผ่าน WebSocket หรือ SSE (Server-Sent Events) มายัง `Header/NotificationMenu` ใน Frontend เพื่อเตือนฝ่ายจัดซื้อ
- **Auto-Purchase Requisition**: ปุ่ม "สร้างใบขอซื้ออัตโนมัติ" (Auto-Create PR) เมื่อสต็อกวิกฤต

### 📊 2. ระบบ Export Report (PDF & Excel)
- **Backend Excel Generation**: ใช้ Library `github.com/xuri/excelize` ใน Go Backend สำหรับ Export สรุปยอดขาย, รายงานต้นทุน-กำไร (Profit/Loss), และสต็อกคงเหลือ เป็นไฟล์ `.xlsx`
- **Client-side / Backend PDF Generation**: สำหรับใบเสนอราคา (Quotation) และใบส่งของ (Delivery Note) สามารถใช้ React PDF (`@react-pdf/renderer`) ใน Frontend หรือ HTML-to-PDF Service ใน Backend เพื่อความแม่นยำของเลย์เอาต์พิมพ์
