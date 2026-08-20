แผนการพัฒนาระบบส้มสิงพิมพ์สำหรับสั่งการ AI Agent(AI-Agent Ready Execution Roadmap & Task Directives)เอกสารฉบับนี้ออกแบบมาเพื่อให้ผู้ดูแลระบบสามารถคัดลอกคำสั่ง (Prompts / Task Directives) ในแต่ละข้อ ไปส่งต่อให้ AI Agent (เช่น AntiGravity IDE, Cursor, Windsurf, Claude Code) ทำการสร้างและแก้ไขโค้ดได้อย่างเป็นลำดับขั้นตอน โดยยังคงรักษาโครงสร้างสถาปัตยกรรม (Architecture Guard) และความถูกต้องทางการเงิน (Decimal Precision) ของโรงพิมพ์ส้มสิงพิมพ์ไว้อย่างเคร่งครัด🛠 กฎเหล็กสำหรับการสั่งงาน AI Agent (Agent System Instructions)ก่อนเริ่มส่งงานให้ AI Agent ในแต่ละ Phase โปรดแนบเงื่อนไขเหล่านี้ใน System Prompt:Architecture Separation: โค้ดส่วน admin-system/ ห้ามใช้ตารางร่วมกับ customer-service/ โดยตรง ต้องผ่าน REST API ของ Go Backend เท่านั้นNumeric Precision: ห้ามใช้ float32/float64 ในการคำนวณเงินหรือสต็อกกระดาษ ให้ใช้ shopspring/decimal ใน Go และ DECIMAL(12,4) ใน PostgreSQLNo Hardcoding: สูตรคำนวณราคา ค่าตั้งเครื่อง ค่าเพลท ค่าแรง ต้องดึงจากตาราง pricing_rates และ equipment_specs ใน DB เท่านั้น📅 PHASE 1: FINANCIAL AUTOMATION & PROFIT GUARDเป้าหมาย: อัตโนมัติการตรวจสอบสลิปโอนเงิน และควบคุมอัตรากำไรขั้นต้น (Gross Profit Margin Guard)Task 1.1: Automated Slip Verification Integration (SlipOK API)เป้าหมาย: ระบบตรวจสอบสลิปโอนเงิน PromptPay อัตโนมัติผ่าน SlipOK API และปรับสถานะคำสั่งซื้อใน DB ทันทีTarget Scope:Migration: admin-system/migrations/013_slip_verification.sqlGo Backend: admin-system/backend/finance/slip_verifier.go, admin-system/backend/main.goCustomer Storefront: customer-service/src/pages/CheckoutPage.tsxAgent Execution Prompt:[Task 1.1 Directive]
1. Create SQL Migration `013_slip_verification.sql`:
   - Add table `bank_transaction_logs` (id, order_id, qr_payload, trans_ref, amount DECIMAL(12,4), status, verified_at, raw_response JSONB).
   - Add column `slip_verified_at TIMESTAMPTZ` and `slip_trans_ref VARCHAR(100)` to `orders`.
2. In Go Backend (`admin-system/backend/`):
   - Create package `finance/slip_verifier.go` to call SlipOK API (`https://api.slipok.com/api/line/apikey/`).
   - Add POST endpoint `/api/v1/checkout/verify-slip` that accepts QR Payload / Slip Image and Order ID.
   - Verify amount against `orders.total_amount`. If match, update order status from `PENDING_PAYMENT` to `PAID_PREPRESS` inside a DB Transaction.
3. In Customer Storefront (`customer-service/src/pages/CheckoutPage.tsx`):
   - Add real-time loading state "กำลังตรวจสอบสลิปการโอนเงิน..." after slip upload.
   - Auto-redirect to SuccessPage upon receipt of 200 OK from verify-slip API within 3 seconds.
Verification:รัน go test ./backend/finance/...ทดสอบยิง Payload จำลองเข้า /api/v1/checkout/verify-slip ตรวจสอบการเปลี่ยนสถานะในตาราง ordersTask 1.2: Tiered Discount & Margin Guard Approval Workflowเป้าหมาย: ระบบคำนวณอัตรากำไรขั้นต้น (Gross Profit Margin) หาก $Margin < 25\%$ ให้ตั้งสถานะใบเสนอราคาเป็นรอผู้จัดการอนุมัติTarget Scope:Go Backend: admin-system/backend/pricing/engine.go, admin-system/backend/orders/handlers.goAdmin Frontend: admin-system/frontend/src/features/pricing/components/QuotationManager.tsxAgent Execution Prompt:[Task 1.2 Directive]
1. In Go Pricing Engine (`admin-system/backend/pricing/engine.go`):
   - Calculate Gross Profit Margin % using formula:
     $$Margin = \frac{TotalAmount - TotalCost}{TotalAmount} \times 100$$
   - Return `gross_margin_percent` in the calculation result struct.
2. In Order / Quotation Handler (`admin-system/backend/orders/handlers.go`):
   - When creating or updating a Quotation with custom discount:
     If `gross_margin_percent < 25.0`, set status = `REQUIRES_MANAGER_APPROVAL`.
   - Add endpoint `POST /api/v1/quotations/:id/approve` and `POST /api/v1/quotations/:id/reject` restricted to `ROLE_MANAGER` or `ROLE_ADMIN`.
3. In Admin Frontend (`QuotationManager.tsx`):
   - Display a warning badge (Orange) for quotations with Margin < 25%.
   - Add Approval Modal for Sales Manager to click "Approve Discount" or "Reject" with reason text area.
Verification:ทดสอบออกใบเสนอราคาที่มีส่วนลดสูงจน Margin = 20% ตรวจสอบว่าระบบตั้งสถานะเป็น REQUIRES_MANAGER_APPROVAL หรือไม่Task 1.3: Supplier Paper Price Sheet Versioningเป้าหมาย: อัปโหลดตารางราคากระดาษซัพพลายเออร์เพื่อปรับ Base Cost ทั้งระบบโดยไม่กระทบใบเสนอราคาเก่าTarget Scope:Migration: admin-system/migrations/014_paper_price_versioning.sqlGo Backend: admin-system/backend/inventory/paper_prices.goAdmin Frontend: admin-system/frontend/src/features/inventory/components/SupplierPriceUploader.tsxAgent Execution Prompt:[Task 1.3 Directive]
1. Create SQL Migration `014_paper_price_versioning.sql`:
   - Create table `paper_price_versions` (id, supplier_name, effective_date, version_code, created_at).
   - Add `price_version_id` to `paper_specs` table.
2. In Go Backend (`admin-system/backend/inventory/`):
   - Create API `POST /api/v1/inventory/supplier-price-sheets` to parse Excel/CSV uploads containing paper costs per ream/sheet.
   - Update Pricing Engine to query the latest `effective_date` paper prices while preserving historical cost snapshots in approved quotations.
3. In Admin Frontend:
   - Build `SupplierPriceUploader.tsx` component allowing drag-and-drop Excel files with preview before committing version update.
2D IMPOSITION & DEEP PREFLIGHT ENGINEเป้าหมาย: ตรวจไฟล์ PDF เชิงลึก และคำนวณการวางหน้าตัดกระดาษ (Bin Packing) เพื่อลดเศษขยะTask 2.1: Strict Preflight Checker Engine Upgradeเป้าหมาย: อัปเกรดตัวตรวจไฟล์ PDF ให้เช็กโหมดสี CMYK, ระยะตัดเจียน Bleed 3mm, TAC > 300% และ DPI < 300Target Scope:Frontend Utility: admin-system/frontend/src/lib/preflightAnalyzer.tsAdmin UI: admin-system/frontend/src/components/PreflightChecker.tsxGo Backend: admin-system/backend/orders/preflight_log.goAgent Execution Prompt:[Task 2.1 Directive]
1. Upgrade `preflightAnalyzer.ts` in Admin Frontend:
   - Enhance PDF parsing to inspect:
     a) Color Space: Flag error if RGB objects are detected (Require CMYK).
     b) Bleed Area: Ensure artwork dimensions include at least 3mm bleed on all 4 edges relative to trim box.
     c) TAC (Total Ink Limit): Calculate C+M+Y+K sum for rasterized canvas previews; warn if > 300%.
     d) Image Resolution: Flag error if embedded image DPI < 300 DPI.
2. In `PreflightChecker.tsx`:
   - Display interactive diagnostic report with visual badges (Red = Error, Yellow = Warning, Green = Pass).
   - Add "Auto-Convert RGB to CMYK Preview" button using Canvas API.
3. Save JSON Preflight Report via POST `/api/v1/orders/:id/preflight-report` to Go Backend DB table `order_preflight_reports`.
Task 2.2: 2D Shelf-Guillotine Imposition Engine (Gang Run Optimizer)เป้าหมาย: พัฒนาอัลกอริทึมคำนวณการวางชิ้นงานลงแผ่นใหญ่ (2D Bin Packing) หาจำนวนตัดต่อแผ่นที่ประหยัดที่สุดTarget Scope:Go Backend: admin-system/backend/pricing/imposition.go, admin-system/backend/pricing/imposition_test.goAgent Execution Prompt:[Task 2.2 Directive]
1. In Go Backend (`admin-system/backend/pricing/imposition.go`):
   - Implement 2D Shelf-Guillotine Bin Packing Algorithm.
   - Function Signature:
     `CalculateImposition(itemW, itemH, parentW, parentH, bleedMM, gutterMM decimal.Decimal) (cutsPerSheet int, wastePercent decimal.Decimal, layoutMatrix LayoutGrid)`
   - Account for both 0-degree and 90-degree rotations of the artwork to maximize yield per parent sheet.
2. Integrate with Pricing Engine (`engine.go`):
   - Automatically invoke `CalculateImposition` during Instant Quote calculation to determine exact parent sheets required instead of using static lookup tables.
3. Write Unit Tests in `imposition_test.go` covering standard sizes: A4 on 24"x35" sheet, A5 on 31"x43" sheet, Business Cards on A3+ sheet.
Task 2.3: Offcut Stock Auto-Matching in Pricing Engineเป้าหมาย: ดึงเศษกระดาษเหลือตัด (offcut_inventory) มาใช้เสนองานขนาดเล็กเพื่อลดต้นทุนและระบายสต็อกTarget Scope:Go Backend: admin-system/backend/pricing/engine.go, admin-system/backend/inventory/offcuts.goAdmin UI: admin-system/frontend/src/features/orders/components/CreateOrderPage.tsxAgent Execution Prompt:[Task 2.3 Directive]
1. In Go Pricing Engine (`engine.go`):
   - Before calculating parent sheet cost for small items (e.g., tags, stickers, business cards):
     Query `offcut_inventory` for available matching paper type, GSM, and dimensions $\ge$ required item size.
   - If suitable offcuts exist in stock:
     Use offcut unit cost (discounted rate) and set `used_offcut_lot_id` in calculation response.
2. In Admin Order Creation UI (`CreateOrderPage.tsx`):
   - Display a badge: "แนะนำ: ใช้เศษกระดาษล็อต #OFF-XXX ในคลัง (ประหยัดต้นทุนกระดาษ 35%)".
Task 2.4: Operator Workstation Touch UI (Shop Floor Tracker)เป้าหมาย: ปรับปรุงหน้า UI สำหรับช่างพิมพ์หน้าเครื่องให้เป็นปุ่มสัมผัสขนาดใหญ่ เหมาะกับ TabletTarget Scope:Admin Frontend: admin-system/frontend/src/features/production/ShopFloorTracker.tsxAgent Execution Prompt:[Task 2.4 Directive]
1. Refactor `ShopFloorTracker.tsx` for Tablet / Touchscreens:
   - Minimum button size: 64px x 64px with high-contrast status colors.
   - Provide 3 main Action Buttons per Job Ticket: "เริ่มพิมพ์ (Start)", "พักเครื่อง/ขัดข้อง (Pause)", "พิมพ์เสร็จสิ้น (Complete)".
   - Add a Spoilage Entry Modal: When job completes or pauses, allow operator to tap numpad for "จำนวนแผ่นเสีย (Spoilage Count)" and select RCA cause (e.g., กระดาษติด, สีไม่ตรง, เพลทเสีย).
3D PREVIEW, OMNICHANNEL & PPMเป้าหมาย: ระบบแจ้งเตือน LINE OA, ระบบซ่อมบำรุงเชิงคาดการณ์ (PPM) และ 3D Packaging Preview บนหน้าร้านTask 3.1: LINE Official Account Notification Integrationเป้าหมาย: ส่งข้อความ Push Notification พร้อม Flex Message เข้า LINE ลูกค้าเมื่อสถานะ Order เปลี่ยนแปลงTarget Scope:Migration: admin-system/migrations/015_line_notification_logs.sqlGo Backend: admin-system/backend/notifications/line_bot.goAgent Execution Prompt:[Task 3.1 Directive]
1. In Go Backend (`admin-system/backend/notifications/line_bot.go`):
   - Integrate LINE Messaging API SDK (`github.com/line/line-bot-sdk-go/v7`).
   - Create function `SendOrderStatusFlexMessage(customerLineID string, orderModel models.Order)`
   - Design Flex Message Layouts for 3 key events:
     a) `PAID_PREPRESS`: "ได้รับชำระเงินเรียบร้อยแล้ว กำลังตรวจไฟล์งาน"
     b) `IN_PRODUCTION`: "งานพิมพ์ของคุณกำลังอยู่บนเครื่องพิมพ์"
     c) `SHIPPED`: "สินค้าจัดส่งแล้ว เลข พัสดุ: XXXX"
2. Attach event listeners in Order Status State Machine (`orders/handlers.go`) to trigger LINE Push Notifications asynchronously via goroutine.
Task 3.2: Predictive Preventive Maintenance (PPM) Engineเป้าหมาย: ระบบคำนวณมิเตอร์คลิกพิมพ์สะสมเทียบกับ Threshold เพื่อเปิด Ticket แจ้งเตือนช่างซ่อมบำรุงTarget Scope:Migration: admin-system/migrations/016_predictive_maintenance.sqlGo Backend: admin-system/backend/equipment/ppm_cron.goAdmin Dashboard: admin-system/frontend/src/features/equipment/components/EquipmentManagement.tsxAgent Execution Prompt:[Task 3.2 Directive]
1. Create Migration `016_predictive_maintenance.sql`:
   - Add `maintenance_interval_impressions INT` and `last_serviced_meter INT` to `equipment_specs`.
   - Create table `maintenance_tickets` (id, equipment_id, trigger_reason, status, scheduled_date, resolved_at).
2. In Go Backend (`ppm_cron.go`):
   - Create a Cron Job running daily to check:
     $$CurrentMeter - LastServicedMeter \ge MaintenanceInterval$$
   - Auto-generate an OPEN `maintenance_ticket` and mark Equipment Health Indicator as "REQUIRES_SERVICE".
3. In Admin Equipment UI:
   - Show Equipment Health Gauge (Green = Good, Yellow = Service Due Soon, Red = Overdue Maintenance).
Task 3.3: Interactive 3D Packaging Preview (Three.js)เป้าหมาย: ระบบจำลองภาพ 3 มิติสำหรับกล่องบรรจุภัณฑ์ สามารถหมุนดู 360 องศา และจำลองปั๊มเคทอง/Spot UVTarget Scope:Customer Storefront: customer-service/src/components/3D/BoxModelViewer.tsx, customer-service/src/pages/ProductPage.tsxAgent Execution Prompt:[Task 3.3 Directive]
1. In Customer Storefront (`customer-service/src/`):
   - Install `three` and `@types/three`.
   - Create component `components/3D/BoxModelViewer.tsx` rendering a parametric 3D Box geometry based on selected Length, Width, Height (L x W x H) from user inputs.
   - Apply uploaded Artwork texture onto the 3D Box faces.
   - Simulate finishing effects using Canvas/Three.js shaders:
     a) Foil Stamping (Gold/Silver): Metallic & Roughness map reflection.
     b) Spot UV: High specular glossiness on specified artwork layer.
2. Embed `BoxModelViewer.tsx` in `ProductPage.tsx` for Packaging & Box product categories with interactive 360-degree orbit controls.
Task 3.4: Multi-Currency Real-time Exchange Rate Proxyเป้าหมาย: แสดงราคาประเมินเป็นสกุลเงิน LAK (กีบลาว) และ CNY (หยวนจีน) ควบคู่กับ THB แบบเรียลไทม์Target Scope:Go Backend: admin-system/backend/pricing/currency_proxy.goCustomer Utility: customer-service/src/utils/currency.tsAgent Execution Prompt:[Task 3.4 Directive]
1. In Go Backend (`currency_proxy.go`):
   - Fetch daily exchange rates for LAK and CNY from Open Exchange Rates / BOT API with 12-hour Redis/In-memory caching.
   - Expose GET endpoint `/api/v1/public/exchange-rates`.
2. In Customer Storefront (`currency.ts`):
   - Update price formatting utilities to display converted values alongside THB (e.g., `฿ 1,500 THB (~ 945,000 LAK / 300 CNY)`).
สรุปการบริหารจัดการและการนำไปใช้ (Execution Strategy for Developer)คัดลอก Task Directive: เมื่อต้องการให้ AI Agent พัฒนาฟีเจอร์ใด ให้คัดลอกข้อความในกล่อง Agent Execution Prompt ของ Task นั้นไปวางใน AI Agentทดสอบตาม Verification Steps: หลัง AI Agent เจนโค้ดเสร็จ ให้รันคำสั่งทดสอบตามที่ระบุใน Verification Steps ทันทีเพื่อยึดความถูกต้องCommit & Migrate: ทำการ Commit โค้ดและรัน SQL Migration Script ตามลำดับเลขไฟล์ (013 -> 016)