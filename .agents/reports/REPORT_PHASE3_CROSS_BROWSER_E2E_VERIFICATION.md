# Phase 3: Cross-Browser Data Sync & Live Verification (No Playwright)

> **STATUS: COMPLETED & VERIFIED (เสร็จสมบูรณ์ 100%)**
> - **วันที่ส่งมอบ:** 2026-09-05
> - **ผู้รับผิดชอบ:** `somsing-delivery-lead` & `somsing-qa-orchestrator`
> - **สถานะ:** ตัด Playwright สำเร็จ 100%, รัน Unit Tests (Vitest + Go test) ผ่าน 100%, ตรวจสอบ API Precedence ผ่านเรียบร้อย

## 1. Role & Identity
- **Role:** Lead System Integrator & QA Orchestrator (`somsing-delivery-lead` & `somsing-qa-orchestrator`)
- **Stack:** Go Test, Vitest, API Integration, Browser Testing (Manual / DevTools)
- **Context:** Som Sing Phim Printing System — Multi-Browser Data Precedence Verification

## 2. Objective
ตรวจสอบและพิสูจน์ความถูกต้องของการซิงค์ข้อมูลคำสั่งซื้อข้ามเบราว์เซอร์ผ่านระบบ API, PostgreSQL Database, และ Unit Tests โดยไม่ต้องใช้ Playwright เพื่อให้มั่นใจว่าข้อมูลเชื่อมโยงหากันผ่าน Single Source of Truth จริง และไม่ติดกับดัก Mockup ใน Browser Cache อีกต่อไป

---

## 3. Target Files to Verify
- `admin-system/frontend/src/store/AppContext.tsx`
- `customer-service/src/api/client.ts`
- `admin-system/backend/orders/handlers.go`

---

## 4. STRICT CONSTRAINTS (DO NOT TOUCH)
- **ห้ามติดตั้งหรือรัน Playwright** ในโปรเจกต์นี้
- ห้ามเขียนเทสที่พึ่งพา Token แบบ Hardcode ใน `localStorage`
- การตรวจสอบความถูกต้องให้ใช้ Unit Tests และ API Verification เป็นหลัก

---

## 5. Detailed Verification Instructions

### Step 5.1: ตรวจสอบความถูกต้องของ Logic ภายใน (Unit Tests)
- ตรวจสอบฟังก์ชันการคำนวณราคาและแปลงสกุลเงินด้วย Vitest:
  ```bash
  npm run test:unit:frontend
  ```
- ตรวจสอบ Logic ฝั่ง Backend Go ด้วย `go test`:
  ```bash
  npm run test:unit:backend
  ```

### Step 5.2: ตรวจสอบการรับส่งข้อมูลผ่าน API (Live Data Precedence)
- ตรวจสอบ Health Endpoint:
  ```bash
  curl -s http://localhost:8080/health
  ```
- ตรวจสอบอัตราแลกเปลี่ยนสดจากฐานข้อมูล:
  ```bash
  curl -s http://localhost:8080/api/rates
  ```
- ตรวจสอบรายการออเดอร์สดจากฐานข้อมูล PostgreSQL:
  ```bash
  curl -s http://localhost:8080/api/v1/orders
  ```

---

## 6. Verification & Acceptance Criteria
1. รันคำสั่ง `npm test` ผ่าน 100% โดยไม่มีข้อผิดพลาด
2. เมื่อเปิดหน้าเว็บจริงในเบราว์เซอร์ต่างกัน (เช่น Chrome ปกติ และ Incognito / Safari) ข้อมูลออเดอร์และอัตราแลกเปลี่ยนมาจาก PostgreSQL DB ชุดเดียวกัน
3. โปรเจกต์ไม่มีการเรียกใช้หรือพึ่งพา Playwright ใด ๆ อีกต่อไป
