# 📋 Task Plan: แก้ไขปัญหา UI ซ้อนทับบน Mobile (Customer Service), ปรับความ Responsive ของ Admin Dashboard และตรวจสอบความปลอดภัยของ API

- **รหัสงาน:** `TASK-2026-09-RESPONSIVE-OVERLAP-AND-SECURITY`
- **ผู้ประสานงาน (Coordinator):** `somsing-coordinator`
- **วันที่จัดทำ:** 2026-09-05
- **สถานะ:** `READY_FOR_EXECUTION`

---

## 📌 สรุปโจทย์และปัญหาที่ต้องแก้ไข (Problem Statement)

1. **ความปลอดภัยของ API (API Visibility & Security Concern):**
   - ผู้ใช้มีความกังวลเกี่ยวกับการที่เบราว์เซอร์แสดง Network Request ไปยัง `som-sing-phim-printing.onrender.com/api/...` ใน DevTools ว่าจะทำให้แฮกเกอร์โจมตี หรือมองเห็นฐานข้อมูลหรือไม่
   - ต้องตรวจสอบและยืนยันกลไกป้องกัน (RBAC, JWT, Rate Limiting, CORS, Environment Isolation) และให้คำแนะนำด้าน Security
2. **Customer Service Mobile UI Overlap (ปุ่มและข้อความด้านล่างทับซ้อนกัน):**
   - แถบ `InstallPromptBanner.tsx` (PWA Install Prompt) บนจอมือถือ วางอยู่ที่ `bottom: 24px` ชนและทับซ้อนกับแถบนำทาง `BottomNavigation.tsx` (`height: 64px, bottom: 0`) อย่างชัดเจน ทำให้ข้อความ "ກົດປຸ່ມ Share..." ซ้อนทับกับไอคอนเมนูด้านล่าง
   - แถบ `luxury-concierge-dock` และ `CartDrawer.tsx` มี Stacking Context / Z-Index ที่ต้องจัดระเบียบใหม่ไม่ให้ทับซ้อนกับปุ่มสั่งซื้อ
3. **Admin Dashboard Non-responsive Metrics & Prices (การ์ดและราคาไม่ Responsive):**
   - ตัวเลขเงินกีบ (LAK) ใน `DashboardOverview.tsx` (ยอดเงินสด, ลูกหนี้คงค้าง, กำไรสุทธิ, ต้นทุนกระดาษ/หมึก) มีจำนวนหลักที่ยาวมาก และถูกฟอร์แมตมีทศนิยม `.00` ทำให้ตัวเลขล้นขอบการ์ดหรือขึ้นบรรทัดใหม่แบบผิดรูปในจอมือถือและแท็บเล็ต
   - แถบสถานะคิวผลิต 4 ขั้นตอน (`Live Production Pipeline`) มีการบีบอัดข้อความในหน้าจอมือถือขนาดเล็ก (< 400px)
   - ขาด `truncate`, `min-w-0` และ Responsive Text Sizes ในการ์ดสถิติสำคัญ

---

## 👥 แผนผังทีมงานและผู้รับผิดชอบ (Team Roster & Skill Matrix)

| ฝ่าย / บทบาท | สกิลที่รับผิดชอบ | ขอบเขตงานที่ได้รับมอบหมาย |
| :--- | :--- | :--- |
| 🔒 **Security Specialist** | `somsing-security-specialist` | วิเคราะห์ความปลอดภัยของ API Endpoint, ตรวจสอบ JWT RBAC, CORS Whitelisting, ตรวจสอบว่าไม่มี Secret รั่วไหลใน Frontend bundle |
| 🎨 **UX / UI Designer** | `somsing-ui-ux-designer` | ออกแบบลำดับชั้น Z-Index (Z-Stack Hierarchy), ออกแบบระยะเว้นขอบล่าง (Bottom Safe Spacing) และจัด Typography ของตัวเลขการเงิน |
| 💻 **Frontend Developer** | `somsing-frontend-developer` | 1. แก้ไข CSS/Layout ของ `InstallPromptBanner.tsx`, `BottomNavigation.tsx`, `CartDrawer.tsx`<br>2. ปรับปรุง `DashboardOverview.tsx` ให้ตัวเลขและ Metric Cards ยืดหยุ่น Responsive ทุกหน้าจอ |
| 🔍 **QA Verification** | `somsing-qa-orchestrator` | ทดสอบบนความละเอียดจอจริง (iPhone 16 Pro Max 440x956, iPhone SE 375px, iPad 768px/1024px, Desktop 1440px) และรัน Build Verification |

---

## 📅 แผนการดำเนินงานเป็นขั้นตอน (Execution Phases)

### Phase 1: การตรวจสอบและยืนยันความปลอดภัยของ API (Security Specialist)
- [ ] **1.1 ตรวจสอบความปลอดภัยของ Endpoints (API Exposure Audit):**
  - ตรวจสอบว่า Public Endpoints (`/api/v1/public/...`) ส่งเฉพาะข้อมูลที่จำเป็น (แค็ตตาล็อกสินค้า, หมวดหมู่, อัตราแลกเปลี่ยน) โดยไม่มีข้อมูลลูกค้าคนอื่น หรือข้อมูลการเงินภายในหลุดออกมา
  - ตรวจสอบว่า Private Endpoints (`/api/v1/admin/...`, `/api/orders`, `/api/inventory`, `/api/finance`, `/api/hr`) ต้องติด `auth.RequireRoles(...)` หรือ `auth.JWTAuthMiddleware` อย่างเข้มงวด 100%
- [ ] **1.2 ตรวจสอบ Frontend Bundle Secret Leakage:**
  - ตรวจสอบไฟล์ `.env` และโค้ดใน `admin-system/frontend` และ `customer-service` ว่าไม่มี `DATABASE_URL`, Service Role Key หรือ JWT Secret หลุดเข้าไปใน Client Bundle (มีเฉพาะ `VITE_API_URL` ซึ่งเป็น Public Hostname เท่านั้น)
- [ ] **1.3 เสริมความแข็งแกร่ง (Hardening):**
  - ตรวจสอบ Rate Limiting (180 req/min) บน Go Backend เพื่อป้องกัน Denial of Service (DoS)

---

### Phase 2: แก้ไขปัญหา UI ซ้อนทับใน Customer Service (UX/UI & Frontend)
- [ ] **2.1 แก้ไข `InstallPromptBanner` Stacking & Bottom Clearance:**
  - ปรับตำแหน่งของ `.luxury-pwa-banner` ใน `customer-service/src/styles/global.css`:
    - บน Desktop: `bottom: 24px; left: 24px;`
    - บน Mobile (`<= 860px`): `bottom: calc(72px + env(safe-area-inset-bottom, 0px)); left: 16px; width: calc(100% - 32px);` เพื่อให้อยู่เหนือ `BottomNavigation` อย่างเป็นระเบียบ
- [ ] **2.2 จัดระเบียบ `BottomNavigation` และ `ConciergeDock`:**
  - ปรับให้ `luxury-concierge-dock` มีตำแหน่งที่สัมพันธ์กับบาร์ล่าง ไม่บังปุ่มตะกร้าหรือบับเบิ้ลแจ้งเตือน
- [ ] **2.3 แก้ไข Stacking Context ของ `CartDrawer`:**
  - เพิ่ม Z-Index ของ `CartDrawer` และ Backdrop เป็น `z-[1000]` เพื่อให้ทับแถบเมนูด้านล่างเมื่อเปิดตะกร้า ทำให้ลูกค้ากดปุ่มยืนยันคำสั่งซื้อได้สะดวก 100%
- [ ] **2.4 ปรับแต่ง `CustomerProfileModal` บนจอมือถือ:**
  - ปรับให้คอลัมน์สิทธิประโยชน์ VIP เป็นกล่องขนาดกะทัดรัด (Compact Badges) บนมือถือ เพื่อไม่ให้ดันฟอร์มกรอกเบอร์โทรและปุ่มเข้าสู่ระบบตกขอบหน้าจอ

---

### Phase 3: ปรับปรุง Admin Dashboard ให้ Responsive และจัดฟอร์แมตราคา (Frontend & UI)
- [ ] **3.1 ปรับขนาดและ Layout ของ Metric Cards ใน `DashboardOverview.tsx`:**
  - ปรับขนาดตัวเลขราคาจาก `text-2xl sm:text-3xl font-black` เป็น `text-lg sm:text-xl lg:text-2xl font-black truncate` พร้อมใส่ `title` เพื่อให้ดูค่าเต็มได้เมื่อชี้เมาส์
  - จัดการ์ดให้รองรับการแสดงผลตัวเลขสกุลเงินกีบหลักสิบล้าน/ร้อยล้าน โดยไม่ให้ข้อความตกหล่นหรือขึ้นบรรทัดใหม่แบบผิดส่วน
- [ ] **3.2 ปรับฟอร์แมตตัวเลขเงินกีบ (LAK Currency Formatting):**
  - สกุลเงินกีบ (LAK) ไม่จำเป็นต้องมีทศนิยม `.00` ให้ปรับการแสดงผลใน Dashboard ให้แสดงเป็นจำนวนเต็มหลัก เช่น `145,250,000 ₭` ช่วยประหยัดพื้นที่ตัวอักษรลง 3 ตัวอักษรต่อการ์ด
- [ ] **3.3 ปรับแต่ง Live Production Pipeline Mini-bar บนมือถือ:**
  - ปรับการ์ดทั้ง 4 ขั้นตอน (Prepress, Printing, Finishing, Ready) ให้ใช้ `flex flex-col` ขนาดกะทัดรัด ตัวหนังสือไม่เบียดกันบนหน้าจอเล็ก (< 400px)

---

### Phase 4: การทดสอบและการส่งมอบ (QA Orchestrator & Delivery Lead)
- [ ] **4.1 Responsive Viewport Verification:**
  - ตรวจสอบผ่าน Device Emulation:
    - iPhone 16 Pro Max (440 x 956 px)
    - iPhone SE (375 x 667 px)
    - iPad Air (820 x 1180 px)
    - Desktop (1440 x 900 px)
- [ ] **4.2 Build & Integration Check:**
  - รัน `npm --prefix customer-service run build` ผ่าน 100%
  - รัน `npm --prefix admin-system/frontend run build` ผ่าน 100%
- [ ] **4.3 จัดทำชุดส่งมอบและรายงานผล:**
  - สรุปผลการปรับปรุงลงในรายงานและส่งมอบให้ผู้ใช้งาน
