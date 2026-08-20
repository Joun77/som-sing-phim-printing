# Som Sing Phim (ສົມສິ່ງພິມ) — Master System Enhancement & Antigravity AI Agent Execution Playbook

**Document Title:** Som Sing Phim Printing - Enterprise Full-Cycle Modernization Blueprint  
**Version:** 4.0.0 (Production Master)  
**Target Environments:**
- **Customer Service App (Client-Facing Storefront):** `customer-service/` (Vite, React 18, TypeScript, Tailwind/Vanilla CSS)
- **Admin & Shop Floor Management:** `admin-system/frontend/` (React, TanStack Query, Lucide Icons)
- **Backend Core & Persistence:** `admin-system/backend/` (Go, Gin Gonic, GORM, PostgreSQL)
- **Execution Engine:** Antigravity AI Agent IDE

---

## 1. Executive Vision & Architecture Foundation

เป้าหมายสูงสุดคือการสร้างระบบบริหารจัดการโรงพิมพ์ดิจิทัลและออฟเซตที่สมบูรณ์ที่สุดของ **Som Sing Phim (ສົມສິ່ງພິມ)** โดยเชื่อมประสานประสบการณ์ 3 มิติเข้าด้วยกันอย่างไร้รอยต่อ:
1. **Bespoke Luxury Customer Experience:** หน้าร้านออนไลน์ที่สวยงาม ไร้ที่ติทั้งในโหมด Light และ Dark ("Midnight Atelier"), อ่านฟอนต์ได้คมชัดทุกภาษา (Lao, Thai, English), มีระบบ 3D Preview และ Preflight ตรวจไฟล์อัตโนมัติ
2. **Dual-Model Print Engine (On-Demand vs Bulk Production):** รองรับทั้งงานพิมพ์ตามสั่งด่วน 1 ชิ้นไม่มีขั้นต่ำ (No MOQ) และงานพิมพ์สเปกโรงงานสั่งผลิตจำนวนมากพร้อมตารางส่วนลด Volume Discount
3. **Shop Floor & Inventory Automation:** เมื่อลูกค้ายืนยันออเดอร์ ระบบออก **Digital Job Ticket พร้อม QR Code** ให้ช่างพิมพ์สแกนรับงาน พร้อมตัดสต็อกกระดาษ/หมึกอัตโนมัติ และบันทึกของเสีย (Spoilage Log) เข้าสู่ระบบบัญชีต้นทุนจริง

```
+--------------------------------------------------------------------------------------------------+
|                                    CUSTOMER SERVICE STOREFRONT                                   |
|   [Luxury Dark/Light UI] -> [Preflight Analyzer] -> [3D Box Proofing] -> [On-Demand / Bulk MOQ]   |
+-------------------------------------------------+------------------------------------------------+
                                                  | REST API / WebSockets / File Upload
+-------------------------------------------------v------------------------------------------------+
|                                      GO REST BACKEND ENGINE                                      |
|   [Dynamic Pricing] <-> [Order State Machine] <-> [Inventory Auto-Deduct] <-> [Job Ticket Engine] |
+-------------------------------------------------+------------------------------------------------+
                                                  | PostgreSQL Relational Tables
+-------------------------------------------------v------------------------------------------------+
|                                      SHOP FLOOR & ADMIN SYSTEM                                   |
|   [Admin Web Catalog] -> [Machine Scheduling Board] -> [Operator QR Station] -> [Spoilage Audit] |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. Comprehensive Gap Analysis & Root Cause Breakdown

| ส่วนงาน | สภาพปัญหาปัจจุบัน (Issues Identified) | แนวทางแก้ไขและเป้าหมายที่ต้องพัฒนา (Target Solution) |
| :--- | :--- | :--- |
| **Dark Mode & Typography** | - ตัวหนังสือภาษาลาว/ไทยใน Dark Mode มีแถบไฮไลต์สีฟ้ารบกวนสายตา<br>- ส่วน `BestSellers` มีแถบสีขาวขนาดใหญ่ตัดกลางจอ<br>- การ์ดตัวเลือกสเปก (Option Card) สีกลืนกับพื้นหลัง แยก Active/Inactive ไม่ออก | - รื้อระบบ Design Tokens กำหนด Layer Hierarchy (Level 0 ถึง Level 3)<br>- ใช้ตัวแปร `--bg-surface` และ `--pure-white` แทนการ override แบบทำลายล้าง<br>- ออกแบบ Active State ด้วย Gradient กรมท่า-ทอง Champagne เรืองแสง |
| **Product & Print Modes** | - ระบบยังไม่แยกระหว่างงานสั่งพิมพ์ 1 ชิ้น (On-Demand) กับงานมีขั้นต่ำ (Bulk MOQ) ทำให้ตัว Stepper สับสนและราคาไม่สะท้อนความจริง | - เพิ่ม `is_on_demand` flag และ `min_quantity` ในฐานข้อมูล<br>- แสดง Badge ชัดเจนบนการ์ดสินค้า และผูกตารางส่วนลดเฉพาะงาน Bulk |
| **Customer File & Preflight** | - ช่องอัปโหลดไฟล์ยังเป็น Native Browser Button สีเทา ไม่เข้ากับดีไซน์ Luxury<br>- ลูกค้าไม่ทราบว่าไฟล์ตนเองความละเอียดถึง 300 DPI หรือมี Bleed หรือไม่ | - ออกแบบ Drag & Drop Zone ระดับพรีเมียมพร้อมรองรับไฟล์ PDF/AI/PSD และลิงก์ Google Drive/Canva<br>- ฝังระบบตรวจเช็กไฟล์ Client-Side Preflight Checklist |
| **Internal Operations** | - การสั่งงานภายในยังพึ่งพาการสื่อสารแบบแมนนวล ไม่มีการเชื่อมสต็อกกับการเดินเครื่องจักร | - สร้างระบบออกใบสั่งงานช่างพิมพ์ (Job Router Sheet) พร้อม QR Code<br>- ตัดสต็อกวัตถุดิบอัตโนมัติเมื่อสถานะเปลี่ยนเป็น `IN_PRODUCTION` |

---

## 3. Master Phased Development Roadmap

```
Phase 1: Dark Mode Typography & Visual Polish (Sprint 1 / Week 1-2)
  ├── 1.1 Global Design Tokens & Typography Standardization
  ├── 1.2 Home & Best Sellers Component Overhaul
  ├── 1.3 High-Contrast Product Spec Configurator & Option Cards
  └── 1.4 Cart Drawer, Checkout Form & Slip Verification UI

Phase 2: Product Mode Split & Dual-Pricing Engine (Sprint 2 / Week 3-4)
  ├── 2.1 Database & Admin Catalog Mode Configuration (On-Demand vs Bulk)
  ├── 2.2 Quantity Stepper & MOQ Enforcement Logic
  └── 2.3 Volume Discount Tier Synchronization

Phase 3: Interactive Preflight & Digital Proofing (Sprint 3 / Week 5-6)
  ├── 3.1 Client-Side Preflight Analyzer (DPI, Bleed, Color Space)
  ├── 3.2 3D Model Viewer & Watermarked Digital Proof Sign-off
  └── 3.3 Flexible Artwork Uploader (Direct File & Cloud Link)

Phase 4: Shop Floor Operations & Internal Job Routing (Sprint 4 / Week 7-8)
  ├── 4.1 Digital Job Ticket & Printable PDF Router Sheet with QR
  ├── 4.2 Automated Inventory Deduction & Batch Lot Control
  └── 4.3 Machine Scheduling Kanban Board & Spoilage Logger

Phase 5: Customer Retention & VIP Self-Service (Sprint 5 / Week 9+)
  ├── 5.1 Real-Time Order Tracking & Milestone Timeline
  └── 5.2 1-Click Reorder System & Invoice/Receipt Hub
```

---

## 4. Antigravity AI Agent Step-by-Step Actionable Prompts

คัดลอก Prompt ด้านล่างไปป้อนให้กับ **Antigravity AI Agent** ทีละ Step เพื่อให้ระบบดำเนินการพัฒนาและทดสอบอย่างเป็นระเบียบ:

---

### 🟢 PHASE 1: Dark Mode Typography & Visual Overhaul

#### Step 1.1: Core Design Tokens & Global Styles Refactoring
```markdown
### Antigravity Prompt — Phase 1 / Step 1.1:
Target Files: `customer-service/src/styles/global.css`, `customer-service/index.html`

Execute the following design token refactoring:
1. Normalize font imports in `index.html` and define the root typography stack in `global.css`:
   `--font-main: 'Plus Jakarta Sans', 'Noto Sans Lao', 'Noto Sans Thai', 'Sarabun', -apple-system, sans-serif;`
   Apply `font-family: var(--font-main)` to `body, input, button, select, textarea`.
2. Clear any browser selection/highlight bugs by adding:
   `::selection { background: rgba(197, 160, 89, 0.35); color: #FFFFFF; }`
3. Refactor `.dark, [data-theme="dark"]` variables in `global.css`:
   - Replace any destructive `--white: #111D3B` overrides with a protected `--pure-white: #FFFFFF;`.
   - Set surface levels: `--bg-primary: #070D1E;`, `--bg-surface: #0E172F;`, `--bg-card: #142145;`, `--bg-card-hover: #1B2C5C;`, `--bg-input: #0A1329;`.
   - Set typography colors: `--text-main: #FFFFFF;`, `--text-muted: #94A3B8;`, `--navy-dark: #FFFFFF;`.
   - Set border accents: `--border-gold: rgba(197, 160, 89, 0.45);`, `--border-subtle: rgba(255, 255, 255, 0.08);`.
4. Replace `.section--alt { background: var(--white); }` with `.section--alt { background: var(--bg-surface); }`.
```

#### Step 1.2: Home & Best Sellers Component Polish
```markdown
### Antigravity Prompt — Phase 1 / Step 1.2:
Target Files: `customer-service/src/styles/home.css`, `customer-service/src/components/BestSellers.tsx`

Execute the following component updates:
1. In `home.css`, ensure `.section` within `.dark` strictly uses `background: var(--bg-primary)` or `var(--bg-surface)`. Eliminate any leftover `#ffffff` white blocks.
2. In `BestSellers.tsx`:
   - Ensure the section heading and subtitle render in `--text-main` without any background highlight or text-shadow artifacts.
   - For each product card: set title color to `var(--text-main)`, category pill to `background: rgba(197, 160, 89, 0.12); color: var(--gold-light); border: 1px solid var(--border-gold);`, and price display to bold Champagne Gold `var(--gold)`.
```

#### Step 1.3: Product Configurator, Spec Option Cards & Stepper
```markdown
### Antigravity Prompt — Phase 1 / Step 1.3:
Target Files: `customer-service/src/styles/product.css`, `customer-service/src/pages/ProductPage.tsx`

Execute the following styling and logic updates:
1. In `product.css`, rewrite `.option-card` rules:
   - Unselected State: `background: var(--bg-surface); border: 1.5px solid var(--border-subtle); color: var(--text-muted);`
   - Active State (`.is-selected`): `background: linear-gradient(135deg, rgba(197, 160, 89, 0.18) 0%, rgba(14, 23, 47, 0.95) 100%); border: 1.5px solid var(--gold); color: #FFFFFF; box-shadow: 0 4px 16px rgba(197, 160, 89, 0.2);`
   - Inside active option cards, make title text pure white and the radio checkmark icon gold `#C5A059`.
2. Extra price indicators on option cards: format numbers using `formatMoneyCompact(option.add, currency)` rather than raw numbers (e.g. show `+₭4,000` or `+฿150`).
3. Update `.qty-stepper` in `product.css`: set input background to `var(--bg-input)`, input text to `#FFFFFF`, and stepper buttons (+ / -) to have gold border highlights on hover.
```

#### Step 1.4: Cart Drawer, Checkout & Slip Dropzone
```markdown
### Antigravity Prompt — Phase 1 / Step 1.4:
Target Files: `customer-service/src/styles/cart.css`, `customer-service/src/styles/checkout.css`, `customer-service/src/pages/CheckoutPage.tsx`

Execute the following cart/checkout dark mode enhancements:
1. In `cart.css` & `checkout.css`: apply `background: var(--bg-card); backdrop-filter: blur(16px); border: 1px solid var(--border-gold);` to the Cart Drawer and Checkout Summary Box.
2. Refactor the payment slip upload dropzone:
   - Container: `border: 2px dashed var(--border-gold); background: var(--bg-input); border-radius: var(--radius); padding: 24px; text-align: center; cursor: pointer;`
   - Show a cloud icon, clear prompt text in Lao/English, and preview image thumbnail with a delete button once selected.
3. Form fields in `CheckoutPage.tsx`: ensure customer name, phone, address, and special notes have dark background `var(--bg-input)` with crisp white text.
```

---

### 🟢 PHASE 2: On-Demand vs Bulk Production Engine

#### Step 2.1: Schema Update & Admin Catalog Flag
```markdown
### Antigravity Prompt — Phase 2 / Step 2.1:
Target Files: `admin-system/migrations/`, `admin-system/backend/catalog/`, `admin-system/frontend/src/features/catalog/WebCatalogPage.tsx`

Execute the following:
1. Create a migration or verify table `public_products`:
   - Add column `is_on_demand BOOLEAN DEFAULT false;`
   - Ensure `min_quantity INT DEFAULT 1;`
2. In `admin-system/frontend/src/features/catalog/WebCatalogPage.tsx`:
   - Add a switch/radio: "รูปแบบการพิมพ์: On-Demand (ไม่มีขั้นต่ำ) / สั่งผลิตล็อตใหญ่ (มีขั้นต่ำ)".
   - When On-Demand is selected, lock `min_quantity = 1` and allow adding an express setup surcharge.
   - When Bulk is selected, allow configuring `min_quantity` (e.g., 50, 100) and discount tier table.
```

#### Step 2.2: Storefront MOQ & Quantity Stepper Enforcement
```markdown
### Antigravity Prompt — Phase 2 / Step 2.2:
Target Files: `customer-service/src/pages/ProductPage.tsx`, `customer-service/src/data/catalog.ts`

Execute the storefront print mode logic:
1. In `ProductPage.tsx`:
   - If `product.min_quantity === 1` or `product.is_on_demand`:
     Render Badge: `⚡ ງານພິມຕາມສັ່ງ On-Demand (ບໍ່ມີຂັ້ນຕ່ຳ - 1 ຊິ້ນກໍພິມໄດ້)`.
     Stepper starts at 1 and increments by 1.
   - If `product.min_quantity > 1`:
     Render Badge: `📦 ງານພິມຈຳນວນຫຼາຍ (ຂັ້ນຕ່ຳ {product.min_quantity} ຊິ້ນ)`.
     Stepper enforces minimum value = `product.min_quantity` and displays volume discount table.
```

---

### 🟢 PHASE 3: Interactive Preflight & Digital Proofing

#### Step 3.1: Client-Side Preflight File Analyzer
```markdown
### Antigravity Prompt — Phase 3 / Step 3.1:
Target Files: `customer-service/src/lib/preflightAnalyzer.ts`, `customer-service/src/pages/ProductPage.tsx`

Implement the Client-Side Artwork File Checker:
1. Create `preflightAnalyzer.ts` which takes an uploaded image/PDF:
   - Check Resolution: If image DPI < 300, flag warning: "Resolution below 300 DPI (May appear pixelated)".
   - Check Bleed: Validate if canvas dimensions match spec + 3mm bleed margin.
   - Check Color Profile: Detect if RGB color profile is embedded and advise conversion to CMYK.
2. In `ProductPage.tsx`:
   - Display a Preflight Checklist Modal with Green Check / Amber Warning icons.
   - Allow customer to proceed or re-upload a corrected file before adding to cart.
```

#### Step 3.2: 3D Box Model & Proof Watermark Viewer
```markdown
### Antigravity Prompt — Phase 3 / Step 3.2:
Target Files: `customer-service/src/components/3D/BoxModelViewer.tsx`, `customer-service/src/styles/product.css`

Polish the 3D Proofing Viewer:
1. Set the Three.js Canvas container background to match `--bg-surface` with smooth rounded corners.
2. Add ambient lighting adjustments so foil stampings and glossy lamination effects reflect elegantly in Dark Mode.
3. Provide rotate, zoom, and open-lid controls for packaging box categories.
```

---

### 🟢 PHASE 4: Shop Floor Operations & Internal Job Routing

#### Step 4.1: Digital Job Ticket & QR Router Sheet Generator
```markdown
### Antigravity Prompt — Phase 4 / Step 4.1:
Target Files: `admin-system/backend/orders/`, `admin-system/backend/orders/pdf.go`

Implement Internal Job Ticket Generation:
1. In `admin-system/backend/orders/`:
   - Create `JobTicket` model with fields: `job_number`, `order_id`, `routing_steps` (JSON), `assigned_machine`, `status` (PENDING, CUTTING, PRINTING, POST_PRESS, QC, COMPLETED), `spoilage_count`.
2. Implement `GET /api/v1/orders/:id/job-ticket`:
   - Generate a printable A4 PDF Router Sheet containing Job Header, Material Specs (Paper, Ink, Lamination), Routing Station checkboxes, and a QR Code encoding the `job_number`.
```

#### Step 4.2: Automated Inventory Deduction on Job Start
```markdown
### Antigravity Prompt — Phase 4 / Step 4.2:
Target Files: `admin-system/backend/inventory/`, `admin-system/backend/orders/handlers.go`

Implement Automated Stock Deduction:
1. In `admin-system/backend/inventory/`:
   - Create service function `DeductInventoryForJob(db *gorm.DB, orderID uint) error`.
   - Calculate paper sheets, ink volume, and lamination film required by the order items and decrement stock records under a database transaction (`db.Transaction`).
2. Trigger `DeductInventoryForJob` automatically when the Job Ticket status is transitioned to `PRINTING` or `IN_PRODUCTION`.
```

---

### 🟢 PHASE 5: Customer Retention & VIP Self-Service

#### Step 5.1: Real-Time Order Tracking & 1-Click Reorder Hub
```markdown
### Antigravity Prompt — Phase 5 / Step 5.1:
Target Files: `customer-service/src/pages/TrackingPage.tsx`, `customer-service/src/context/ShopContext.tsx`

Implement Reorder Hub & Tracking Synchronization:
1. In `TrackingPage.tsx`:
   - Fetch live order data from `/api/v1/orders/track/:order_no`.
   - Render the milestone timeline: `PENDING_SLIP_CHECK` -> `PAYMENT_APPROVED` -> `IN_PRODUCTION` -> `SHIPPED` -> `DELIVERED`.
2. For completed/delivered orders:
   - Add button: `🔁 ສັ່ງພິມຄືນໃໝ່ (Re-order in 1-Click)`.
   - When clicked, copy the exact specs, quantity, and artwork link into the cart and navigate to checkout.
```

---

## 5. Verification, Testing & Definition of Done (DoD)

ทุก Phase และ Step จะถือว่าสำเร็จสมบูรณ์เมื่อผ่านเกณฑ์การทดสอบต่อไปนี้:
1. **WCAG AAA Compliance:** อัตราส่วน Contrast ของตัวหนังสือกับพื้นหลังใน Dark Mode ต้องไม่ต่ำกว่า 7:1 สำหรับข้อความทั่วไป และ 4.5:1 สำหรับข้อความขนาดใหญ่
2. **Zero FOUC (Flash of Unstyled Content):** การสลับธีม Light / Dark / System ต้องลื่นไหล ไม่มีจังหวะสีกระพริบหรือกล่องสีขาวโผล่
3. **Dual Print Mode Verification:**
   - ทดสอบสั่งซื้อสินค้า On-Demand จำนวน 1 ชิ้น -> สำเร็จ
   - ทดสอบสั่งซื้อสินค้า Bulk โดยกรอกต่ำกว่า MOQ -> ระบบดักเตือนและปรับขึ้นเป็น MOQ ทันที
4. **Transaction Integrity:** การตัดสต็อกวัตถุดิบทุกครั้งต้องทำงานผ่าน Database Transaction และมี Audit Log บันทึกทุกรายการ