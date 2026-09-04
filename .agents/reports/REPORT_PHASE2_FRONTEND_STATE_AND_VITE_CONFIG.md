# Phase 2: Frontend State Management & API Resilience (Vite, Client & AppContext)

> **STATUS: COMPLETED & VERIFIED (เสร็จสมบูรณ์ 100%)**
> - **วันที่ส่งมอบ:** 2026-09-05
> - **ผู้รับผิดชอบ:** `somsing-frontend-developer`
> - **สถานะ:** แก้ไข DB-first Precedence ใน AppContext.tsx, ขจัด Duplicate Orders ใน client.ts, ปรับ Vite Proxy เชื่อม :8080 สำเร็จ, Production Build ผ่านทั้ง 2 โครงการ

## 1. Role & Identity
- **Role:** Senior Frontend Architect (`somsing-frontend-developer`)
- **Stack:** React 19, TypeScript, Vite, TanStack Query, Axios/Fetch API
- **Context:** Som Sing Phim Printing — Admin ERP & Customer Storefront

## 2. Objective
ปรับปรุงสถาปัตยกรรม State Management ใน [AppContext.tsx](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/store/AppContext.tsx) (Admin) และ [ShopContext.tsx](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/customer-service/src/context/ShopContext.tsx) / [client.ts](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/customer-service/src/api/client.ts) (Customer Service) และตั้งค่า Vite Proxy / Environment ให้เชื่อมต่อ API กลางอย่างถูกต้อง ขจัดปัญหาข้อมูลค้างใน LocalStorage เมื่อเปิดใช้งานข้ามเบราว์เซอร์

---

## 3. Target Files to Modify
- `customer-service/src/api/client.ts`
- `customer-service/src/context/ShopContext.tsx`
- `customer-service/vite.config.ts`
- `admin-system/frontend/src/store/AppContext.tsx`
- `admin-system/frontend/vite.config.ts`

---

## 4. STRICT CONSTRAINTS (DO NOT TOUCH)
- **DO NOT TOUCH** ส่วนการจัดสไตล์ CSS / Tailwind Classes ที่เกี่ยวกับ Look & Feel ของหน้าร้านและ ERP
- **ห้ามลบ Fallback กลไกทั้งหมด**: ระบบยังต้องเปิดดูหน้าเว็บได้แม้ในยาม Network หลุดชั่วขณะ แต่ต้องให้ **Live API Data เป็น Primary Source เสมอ** (ไม่ใช่ LocalStorage ชนะข้อมูลจาก Server)
- **DO NOT TOUCH** อัลกอริทึมการแปลงสกุลเงิน (Currency formatting utilities) ใน `utils/currency.ts`

---

## 5. Detailed Tasks & Implementation Instructions

### Task 2.1: ปรับแต่งการตั้งค่า Vite Proxy และ Base URL ให้สม่ำเสมอ
- **ปัญหา:** ทั้งสองโปรเจกต์รันบนพอร์ตต่างกัน (Admin: 5174/5173, Customer: 5173/3000) หากไม่มีการเซ็ต Proxy หรือเซ็ต URL ชี้ไปคนละพอร์ต คำขอจะล้มเหลวและหลุดเข้าโหมด Mockup LocalStorage
- **การดำเนินการ:**
  1. ตรวจสอบ `customer-service/vite.config.ts` และ `admin-system/frontend/vite.config.ts`
  2. กำหนด Proxy `/api` ให้ชี้ไปยัง Backend เซิร์ฟเวอร์หลัก (`http://localhost:8080`) อย่างแม่นยำ
  3. ตั้งค่า Header `Connection: keep-alive` และ `changeOrigin: true` เพื่อไม่ให้เกิดปัญหาสายหลุดระหว่างสตรีมมิ่ง

### Task 2.2: ปรับปรุงลำดับความสำคัญ (Data Precedence) ใน AppContext และ ShopContext
- **ปัญหา:** ใน [AppContext.tsx:1152-1156](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/store/AppContext.tsx#L1152-L1156) มีโค้ดเขียนว่า `// 2. Put local orders (local state takes precedence...)` ทำให้ข้อมูลเก่าใน LocalStorage ทับข้อมูลใหม่จาก Backend DB
- **การดำเนินการ:**
  1. ปรับเปลี่ยนกลยุทธ์การผสานข้อมูล (Merge Strategy): ข้อมูลสดจากเซิร์ฟเวอร์ (Remote DB) ต้องมีสถานะเป็น **ความจริงชุดหลัก (Single Source of Truth)**
  2. หากพบว่า LocalStorage มีข้อมูลที่ไม่มีใน DB ให้ส่งคำขอ Sync ขึ้น Server หรือกำหนดสถานะให้ชัดเจน
  3. เพิ่มตัวบอกสถานะการเชื่อมต่อ (Live Indicator / Sync Indicator) ให้ผู้ใช้งานทราบทันทีว่ากำลังดึงข้อมูลสดจาก Server หรือใช้งานออฟไลน์

---

## 6. Verification & Acceptance Criteria
1. รัน Vitest Unit Test ฝั่ง Frontend ผ่านเรียบร้อย:
   ```bash
   npm run test:unit:frontend
   ```
2. เมื่อเปิดระบบในเบราว์เซอร์หนึ่ง (เช่น Chrome) แล้วสร้างออเดอร์ ข้อมูลจะถูกส่งขึ้น Backend และเมื่อเปิดอีกเบราว์เซอร์หนึ่ง (เช่น Safari/Incognito) ข้อมูลออเดอร์เดียวกันจะต้องปรากฏขึ้นมาแสดงผลโดยไม่ต้องพึ่งพา LocalStorage เดิม
