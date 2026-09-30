# ผลตรวจหลังบ้าน Som Sing Printing — 1 ตุลาคม 2026

**ผลประเมิน: ยังไม่พร้อมเปิด Production** พบช่องโหว่การยืนยันตัวตนและส่วนที่รายงานข้อมูลธุรกิจตัวอย่างเป็นข้อมูลจริง รวมถึง flow รับสินค้าและการบันทึกที่ยังไม่ครบวงจร

ตรวจจาก source repository `/Users/joun/Documents/GitHub/som-sing-phim-printing` ที่ HEAD `1f6aea9`, UI `localhost:5174`, API `localhost:8080`, PostgreSQL ที่เชื่อมต่ออยู่จริง ขอบเขตเฉพาะระบบ Admin; ไม่ตรวจ Storefront ทั้งระบบ

## ขอบเขตและผลทดสอบ

- เปิดตรวจหน้าเมนูหลังบ้านทั้ง 17 โมดูลด้วยเบราว์เซอร์จริง ตรวจข้อมูล ปุ่มที่มองเห็น และ source/API ที่เกี่ยวข้อง
- ทดสอบเพิ่ม: เปิด/ปิดฟอร์ม Daily Plan, ขั้นสรุปต้นทุนใบเสนอราคา, รายละเอียดออร์เดอร์, ค้นหาวัสดุ, FAQ และแท็บการเงิน Overview/P&L/AR/AP/Expenses/Profitability
- ตรวจ GET API 28 paths × 2 แบบ = 56 requests: ไม่ส่ง token และส่ง preview token เพื่อยืนยันการข้าม authentication เก็บหลักฐานเฉพาะ status/keys/count ไม่เก็บรายละเอียดลูกค้า
- Frontend typecheck ผ่าน; frontend utility tests **54 tests / 10 suites ผ่าน**; frontend production build ผ่าน (2297 modules)
- Backend `go build ./...` ผ่าน; Go tests **21 packages ผ่าน / 154 passing test-subtest events** ไม่มี failure ในชุดที่รัน
- ไม่รัน 3 tests ที่ระบุ live DB โดยตรง: `TestVerifyLegacyBaseline_Evaluation`, `TestRunMigrations_LiveDB_CleanNoPending`, `TestWearPartsDatabaseLifecycleAndWrongAsset` เพราะบางตัวแก้ schema/เพิ่มลบ wear parts ของเครื่องในฐานข้อมูลปัจจุบัน
- ไม่กดบันทึก/ลบข้อมูลธุรกิจ รับสินค้า ตัดสต็อก ยืนยันชำระเงิน หรือส่ง notification ไปบุคคลภายนอก จึง **ยังไม่รับรองทุกปุ่มหรือทุก write flow แบบ end-to-end** การผ่าน unit tests ไม่ยืนยันว่า UI → API → DB → หน้าที่เกี่ยวข้องทำงานครบ
- พบไฟล์ couriers/payment methods มีการแก้ก่อนตรวจ เก็บไว้ตามเดิม ไม่แก้ source เพื่อปิดปัญหาในรอบนี้

## ตารางตรวจรายโมดูล

“โหลดได้” หมายถึงเปิดอ่านหน้า/API ได้ ไม่ใช่ผ่านการรับรอง Production

| โมดูล | หลักฐาน UI/API ที่ตรวจจริง | ปัญหา/งานที่เหลือ |
|---|---|---|
| 1 Dashboard | ยอดรวม 378,751, ต้นทุน 0, margin 100%; queue แสดง 0 แม้ออร์เดอร์ผลิต 1 | สูตรต้นทุน/กำไร/OEE มีค่าประมาณ; status mapping ผิด; วันที่กราฟกำหนดตายตัว |
| 2 Preflight | หน้า single/split/batch และตัวเลือกขนาด/กระดาษ/เครื่องโหลด | ตรวจ source การส่ง specs ไป quotation; ยังไม่ทดสอบ upload PDF/PSD/TIFF/ไฟล์เสีย; backend analyzer มี simulated fallback |
| 3 Quotation | wizard และขั้นสรุปต้นทุน 7 หมวดเปิดได้; API ประวัติ 0 | การ save ใน shared store ไม่รอผล API; routes ไม่มี auth; ยังไม่ยืนยัน save→reload→approve→convert |
| 4 Orders | รายการ 2 งาน, ผลิต 1; เปิดรายละเอียดและขั้น production ได้ | local success ก่อน DB, write routes ไม่มี auth, workflow/เครื่อง/ไฟล์ในรายละเอียดไม่สอดคล้อง master |
| 5 CRM | ลูกค้า 1; KPI ยอดสะสม 12.5 ล้านแต่ตารางยอดขาย 350,000 | ใช้ยอดสะสม master กับยอดคำนวณ orders คนละแบบ; กลุ่ม WEB ไม่ตรง filter; create/update ไม่ตรวจ HTTP |
| 6 Catalog | สินค้า 2, categories และ controls โหลด; API 200 | admin GET เปิด anonymous; create/edit/upload/SKU binding ยังไม่ทดสอบบันทึกครบวงจร |
| 7 Material Guide & FAQ | 24 rows ชื่อ/GSM ว่าง; ค้นหา “paper” ทำหน้าเว็บว่าง; FAQ error | contract คนละชนิดกับ inventory; FAQ/category GET404; guide mutations ไม่มี route ที่ active |
| 8 Daily Plan | แผนงาน/queue/ฟอร์มเปิดได้; พบ completed PRINTING task | ใช้ custom modal; UTC date; stage labels ไม่ครอบคลุม PRINTING; references/workflow ต้อง reconcile |
| 9 Shop Floor | tracker 2 งานและสถานะโหลด | legacy workflow กับ Daily Plan ต่างแหล่ง; ต้องทดสอบ progress→stock→earnings→ready delivery ใน DB แยก |
| 10 Equipment | เครื่อง 2, wear/cost-per-page แสดงได้ | order/assignment อ้างเครื่อง Canon/Fuji ที่ไม่อยู่ในรายการ master; maintenance/parts/downtime writes ยังไม่ยืนยัน |
| 11 Inventory & Offcuts | materials 24; inventory/inbound-history controls โหลด | shared store ใช้ inbound quantity overwrite stock; history คนละชุดกับหน้ารับสินค้า; offcut POST มี route ไร้ auth |
| 12 Inbound | API/หน้าแสดง 27 transactions | หน่วยซื้อ/ใช้บางรายการอ่านยาก; ต้องทดสอบ receive/cancel/revise/unit conversion และ master stock ด้วย DB แยก |
| 13 Suppliers & PO | suppliers 2, PO list ว่าง, low-stock draft banner | ReceiveGoods สร้าง receipt/AP แต่ไม่เพิ่ม stock/inbound; overreceipt ไม่มี guard; banner บอกสร้าง draft ทั้งที่ยังแค่ prefill |
| 14 Finance | ทุกแท็บเปิด; AR1/AP0/expense0; P&L350,000 COGS0 | Job Profitability hardcoded; slip verifier mock success; ต้อง reconcile ledger/receipts/costs และทดสอบ payment ซ้ำ |
| 15 HR / Staff | employees0; incentives2 รวม18,500; users API6 | incentives mock ค้างแม้ API0; employee/account save ไม่รอผล/route ไม่ตรง; permissions sync ต้องแก้ |
| 16 Lookups | 63 entries, categories/controls โหลด | form ใช้ Universal แล้ว; ยังไม่ยืนยัน unique/deactivate-with-references และ reload หลังบันทึก |
| 17 Settings | shop/couriers/bank/notification UI โหลด | config GET บางส่วนไร้ auth; notification save ละเลย DB errors; ไม่ทดสอบส่ง notification จริง |

## P0 — ต้องปิดก่อนนำขึ้น Production

### A01 ข้าม JWT authentication ได้

[auth/jwt.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/auth/jwt.go:285) ยอมรับ preview token และ legacy mock token โดยไม่มี environment guard แล้วให้ role admin ได้ โดยไม่ตรวจลายเซ็น JWT

**ยืนยัน runtime:** `GET /api/v1/admin/users` anonymous =401 แต่ unsigned preview token =200 และคืน 6 accounts; CRM/HR/production/finance ที่ protected ก็เข้าถึงได้เช่นกัน อ่านอย่างเดียวในการทดสอบ ไม่มีการแก้ account

Refresh path ยังมี fallback สร้าง admin preview token เมื่อ token ว่าง และ startup ยอมรันต่อแม้ secret ไม่ผ่าน validation

**แก้:** production ต้องยอมรับ signed token ที่ valid เท่านั้น; invalid/missing secret ต้อง fail startup; ลบ refresh fallback; ทดสอบ anon/expired/forged/wrong role ทุก route ไม่ใช่เฉพาะหน้า login

### A02 Orders/Quotations/Uploads มี route ที่ไม่ครอบ authentication

[main.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/main.go:190) ลงทะเบียน orders GET/POST/PUT/PATCH/DELETE และ quotation approve/reject/convert โดยไม่มี auth middleware; global middleware ไม่มี authentication

**ยืนยัน runtime:** anonymous GET orders=200 พร้อม 2 orders, quotations=200 ไม่ต้อง login ส่วน write exposure ยืนยันจาก route registration ไม่ส่ง write ไปข้อมูลจริง

Uploads กับไฟล์งาน static ถูกเปิดสาธารณะด้วย [main.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/main.go:58)

**แก้:** auth+role checks ตาม action; customer tracking ใช้ข้อมูลขั้นต่ำและ token ที่ scoped แยกจาก admin; private files ดาวน์โหลดหลังตรวจสิทธิ์

### A03 ตรวจสลิปสำเร็จแบบ mock เมื่อ provider ไม่ configured

[finance/slip_verifier.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/finance/slip_verifier.go:108) คืน Success=true และ MOCK reference เมื่อไม่มี API key/branch; downstream แทน amount0 ด้วยยอดออร์เดอร์ และมี DB-offline success fallback

**ผลกระทบ:** มีเส้นทางยอมรับการชำระโดยไม่มีการยืนยันจาก provider จริง การ checkout verify-slip บาง routes ยัง public ไม่ได้เรียก live endpoint นี้เพื่อหลีกเลี่ยงเปลี่ยนสถานะการเงิน

**แก้:** missing configuration/provider failure/DB failure ต้อง fail closed; ตรวจ receiver/amount/currency/reference uniqueness และผูกหลักฐานกับ order; mock เฉพาะ test environment แยก

## P1 — ข้อมูลธุรกิจและ flow ต้องแก้

### A04 รับ PO ไม่เพิ่ม stock แม้ตอบว่าสำเร็จ

[suppliers/po_service.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/suppliers/po_service.go:32) มี transaction/row locks และบันทึก receipt, received_qty, PO status, AP แต่ไม่มีการเพิ่ม material stock หรือ inbound movement ตลอด function และไม่พบ receipt trigger ทำงานนี้ใน migration

`currentQty` ถูกอ่านแต่ไม่ใช้จำกัดยอดรับ จึงมีทางรับเกิน ordered remaining ได้; handler nil-DB ยังจำลอง receive success

**แก้:** receipt+stock movement+cost update+AP อยู่ transaction เดียว; บังคับ positive quantity และไม่เกิน remaining ตามนโยบาย; retry ต้องไม่รับซ้ำ; DB failure rollback ทั้งหมด; success response ต้องตรงสิ่งที่เกิดจริง

### A05 Material Guide ผิด API contract และค้นหาแล้ว crash

[materialsApi.ts](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/materials/api/materialsApi.ts:15) อ่าน `/api/v1/materials` ซึ่ง active backend คืน inventory master `name/stock_qty/category`; UI กลับคาดหวัง `nameLo/nameEn/gsm/finishLo`

[MaterialManagement.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/materials/components/MaterialManagement.tsx:49) เรียก `m.nameLo.toLowerCase()` กับ undefined

**ทำซ้ำจริง:** เปิด Material Guide → พิมพ์ paper ใน search → React root ว่างทั้งหน้า → reload แล้วกู้กลับได้; FAQ แสดง backend error; GET FAQ/categories =404

**แก้:** แยก guide DTO/API จาก inventory ให้ชัด หรือเลือกใช้ inventory fields ผ่าน adapter ที่ถูกต้อง; ทำ CRUD/category/FAQ routes ให้ครบ; validate response; error boundary; reorder ด้วย stable ID หลังกรอง

### A06 ยังแสดง mock business data เป็น actual data

- [JobProfitabilityAudit.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/finance/JobProfitabilityAudit.tsx:15) ค่า default order/revenue/cost hardcoded; [FinanceDashboard.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/finance/FinanceDashboard.tsx:268) render โดยไม่มี props/API data แท็บจริงแสดงขาย14.5ล้าน/ต้นทุน8.2ล้าน ไม่ใช่สอง orders ปัจจุบัน
- [AppContext.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/store/AppContext.tsx:637) seed technician earnings12,500+6,000; sync [บรรทัด1581](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/store/AppContext.tsx:1581) รับเฉพาะ array ไม่ว่าง ทำให้ mock/cache ไม่ถูกล้างเมื่อ API ส่ง0
- [TopProductsTable.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/dashboard/components/TopProductsTable.tsx:75) สมมติต้นทุน40% ของยอดขาย จึงได้ margin60% โดยไม่ได้ใช้ actual costing

**แก้:** production เริ่ม empty, รับ empty array เป็น authoritative, แสดงไม่มีข้อมูลแทน mock; estimate ต้องติดป้ายและสูตรชัด; actual report อ่าน ledger/cost API จริง

### A07 UI บอกสำเร็จก่อนบันทึก DB สำเร็จ

[AppContext.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/store/AppContext.tsx:3690) และ addOrder/addQuotation/addCustomer/updateCustomer หลาย action เปลี่ยน local state/cache แล้ว fetch ภายหลังโดยไม่รอ/ไม่ตรวจ res.ok; updateOrderPaymentStatus เปลี่ยน local stateอย่างเดียวใน function นี้

HR save มีลักษณะเดียวกัน; account update fallback ใช้ by-username route ที่ไม่มี active backend และ HTTP4xx ไม่เข้า catch ถ้า fetch ไม่ throw

**แก้:** mutation await HTTP success+validated body ก่อน success toast; failure ต้องรักษาข้อมูลและแสดง error/retry; update UI จาก server response; ตรวจ reload/new session แล้วข้อมูลยังอยู่; account/employee ใช้ stable IDs และ transaction/compensation ตามกรณี

### A08 สต็อก master ถูกข้อมูล transaction ทับใน frontend

[AppContext.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/store/AppContext.tsx:1366) โหลด stock จาก DB แล้วสร้าง inboundMaterials ที่ใช้ receipt quantity เป็น stockQty และนำมา merge ทีหลังให้ overwrite ID เดียวกัน

API inventory กับ materials ต่างอ่านตาราง materials ไม่ใช่ข้อสรุปว่ามีฐานข้อมูลสองชุด แต่ store นำประวัติรับเข้ามาแทน stock คงเหลือ ทำให้ dashboard/cost/low-stock อาจผิดหลังมีการเบิกหรือหลาย receipts

**พบ UI:** SKU toner หน้าคลัง2000 แต่ dashboardก่อน reload1000; paper5000 เทียบ2500 รวมถึง low-stock count เปลี่ยนหลัง reload

**แก้:** stock master เป็น authoritative; receipt list เป็น movement/history; ไม่คำนวณ stock จาก receipt ล่าสุด; invalidation หลัง receive/cancel/discharge; ใช้หน่วย base เดียว

### A09 Dashboard/CRM ใช้แหล่งข้อมูลและ status ไม่สอดคล้อง

[AppContext.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/store/AppContext.tsx:3225) จับ item ID กับ inventory ID, แบ่งต้นทุน65/35 และ depreciation แบบค่าประมาณ; OEE มาจาก wear ไม่ใช่ metrics การเดินเครื่องจริง

Dashboard pipeline เทียบ Title Case กับ uppercase statuses; หน้าจริงแสดงคิวผลิต0 แต่ Orders ผลิต1 ส่วน CRM KPI ใช้ master lifetime total และ table ใช้ orders subtotal ทำให้ยอด12.5ล้านกับ350,000ต่างกันโดยไม่มีขอบเขตอธิบาย

**แก้:** นิยามยอด/ช่วงเวลา/recognition/cost source เดียว, normalize status, แยก unknown cost จาก0 และ estimate จาก actual

### A10 Upload ขาด validation และ containment

[orders/handlers.go](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/orders/handlers.go:1324) ใช้ order_no/item_id/file_type จาก request ประกอบ path ไม่ตรวจ containment; filepath.Base ป้องกันเฉพาะ filename ไม่ป้องกัน path ทุกส่วน ไม่มี magic-byte/size validation ใน handler ที่ตรวจ

**แก้:** server-generated asset path, validate ownership/IDs, จำกัด size+ชนิดจาก content, serve private contentอย่างปลอดภัย; ทดสอบ traversal/disguised file/oversize ใน temp storage เท่านั้น

## P2 — Universal Form, workflow และความชัดเจน

### A11 Daily Plan ควรใช้ Universal ที่มีอยู่แล้ว

พบ component [FormModalTemplate.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/components/common/FormModalTemplate.tsx:22) ใช้อยู่ใน Equipment, Lookups, Inventory, HR และฟอร์มอื่น มี portal, navy header, scroll body, footerActions, FormSection

แต่ [AssignTaskModal.tsx](/Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/production/components/AssignTaskModal.tsx:143) สร้าง overlay/custom headerเอง จึงไม่เหมือนกันตามที่ผู้ใช้สังเกต

**งานแก้ที่ชัดเจน:** นำ shell มาใช้ FormModalTemplate+FormSection; คง field validation/conflict/error/pending ของ Daily Plan; bind footer submit กับ form id; ปิด submit ซ้ำ; focus trap/return focus/Escape/aria-dialog เพิ่มที่ common templateครั้งเดียว เพราะ templateปัจจุบันยังไม่มีครบ ไม่ต้องเขียน Universal ตัวใหม่

### A12 วันที่และขั้นงาน

DailyPlan ใช้ UTC `toISOString().split('T')[0]` ทำให้วันก่อนหน้าในช่วงก่อน07:00 Asia/Vientiane; chart history ใช้วันที่4สิงหาคม2026และช่วงสิงหาคมกำหนดตายตัว ควรใช้ business timezone และช่วงวันที่เลือกจริง

Daily Plan label/option ไม่มี PRINTING แต่ข้อมูลเก่าแสดง PRINTING; form hardcodes book stagesแทน flow ตาม job type ควรใช้ stage definitionsชุดเดียว

Order detail แสดง workflow0/4 แต่ Daily Plan มี PRINTING completed ของ orderเดียวกัน และอ้างเครื่องที่ไม่มีใน master: ยืนยันความไม่สอดคล้องที่ UI แล้ว แต่ **ยังไม่พิสูจน์จาก write/reload ว่า completion ใหม่ทุกกรณีไม่ sync** ต้อง reconcile assignment/current_step/legacy workflowและ historical referencesด้วย DB fixture

ข้อดีที่ตรวจ source ได้: Daily Plan service ตรวจ readiness, employee active/machine existence, permission และ transaction stock deduction เมื่อเริ่มผลิต รวมถึง HTTP service ตรวจ res.ok จึงควรรักษากลไกนี้ไว้

### A13 ปุ่ม/ข้อความที่ควรปรับ

- PO low-stock banner บอก draftถูกสร้างอัตโนมัติ แต่ codeเป็นเพียง prefillและรายการ POยัง0: ใช้คำว่า “เตรียมรายการสำหรับสร้าง PO” จน saveสำเร็จ
- Read errors บางหน้าแปลงเป็น empty silently ทำให้ผู้ใช้แยก “ไม่มีข้อมูล” กับ “โหลดไม่สำเร็จ” ไม่ได้
- ปุ่ม workflow ต้องเห็นเหตุผล blockedและnext action ไม่ใช่ชี้พร้อมทั้งที่ deposit/proofยังขาด
- หน่วย inbound/paper pack/sheet/ml/bottle ต้องแสดง purchase qty, conversionและbase qtyแยกชัด โดยไม่ใช้ default500เมื่อไม่รู้
- Notification saveต้องตรวจ DB error; อย่าขึ้น successเมื่อpersistไม่สำเร็จ
- Frontend ProtectedRouteไม่ได้กำหนด allowedRolesตามmodule; ซ่อน Sidebarอย่างเดียวไม่เป็นsecurity boundary ให้เพิ่ม route gatingและตรวจ role backendทุก action
- Production startup/health ต้องแยก readiness(DB)ออกจากprocess liveness; DB disconnectedไม่ควรพร้อมรับwrite

## ลำดับงานก่อนเปิดใช้งานจริง

1. ปิด A01–A03 และ upload/access routes; ตรวจ default seeded accounts/secret/CORS deployment configuration
2. แก้ A04–A08: transaction stock, guide contract, mock removal, await persistenceและempty-response/cache
3. เชื่อม production lifecycle กับ cost/earnings/ledger แล้ว reconcile Dashboard/CRM/Finance จาก fixtureเดียว
4. Daily Planใช้ Universal, business timezone, stage definitions, loading/errorและblocked reasons
5. รัน integration/e2eใน DBชื่อแยก ไม่ใช่ somsing_dbปัจจุบัน; มี seedที่ระบุเป็นtestและnotification provider stub; reset/cleanupได้

## เกณฑ์ทดสอบเพื่อรับรองรายโมดูลรอบแก้ไข

| กลุ่ม | กรณีที่ต้องผ่าน |
|---|---|
| Auth/security | anon/forged/expired/wrong roleถูกปฏิเสธ, files scoped, productionไม่มี mock token/provider bypass |
| CRUD ทั้งระบบ | create→server response→reload→อีกsession, edit/cancel, HTTP400/401/409/500/offline, double submitไม่สร้างซ้ำ |
| Preflight/Quotation | valid/corrupt supported files, CMYK/K, page/dimension/units, sourceไฟล์ไม่หาย, price precision, save/approve/reject/convertหนึ่งครั้ง |
| Order/Production | missing deposit/proofถูกblock, startหักstockครั้งเดียว, pause/resume/completeไม่หักซ้ำ, rollbackเมื่อstockไม่พอ, daily/tracker/orderตรงกัน |
| Inventory/Inbound/PO | partial receive/full receive/overreceive/retry/cancel, stock+movement+cost+APตรงกัน, no negative stock, base-unit conversion |
| Finance/HR | actual costตรงledger, AR/AP paymentsไม่ซ้ำ, provider failureไม่Paid, earningsเกิดจากงานจริงและemptyต้อง0 |
| Lookups/Catalog/Settings | unique/referenced records, deactivate behavior, persisted upload/reference, permissions, HTTPerrorไม่success |

ยังไม่รับรอง backup/restore drill, migrationบนproduction clone, load/concurrency, deployment/rollback, monitoring/alerts หรือทุกบทบาทด้วย signed JWTจริงในรอบนี้ ต้องมีหลักฐานแยกก่อน Go-live

หลักฐานสรุป API อยู่ใน [api-probe.json](/Users/joun/Documents/ChatGPT/Som-sing-phim/reports/admin-audit-2026-10-01/api-probe.json) และ [ผล tests](/Users/joun/Documents/ChatGPT/Som-sing-phim/reports/admin-audit-2026-10-01/test-summary.json)

