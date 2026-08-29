# Task 20: Authentication, Silent Token Refresh & Backend RBAC Enforcement

## 1. AI Role & Mission
* **Role:** Senior Security Engineer & Full-Stack Auth Architect
* **Mission:** Upgrade authentication and access control (RBAC) to enterprise production standards: implement Silent Token Refresh (preventing session expiration while configuring orders), enforce route protection and role verification in Go Backend (`SUPER_ADMIN`, `OWNER`, `SALES`, `OPERATOR`, `ACCOUNTANT`), and refine the Login UI.

> **CRITICAL LOCALIZATION REQUIREMENT:** All user-facing labels, error messages, role badges, and form inputs rendered in the UI MUST strictly remain in official **Lao language** (`lo` / ພາສາລາວ).

---

## 2. Phase-by-Phase Implementation Plan

### Phase A — Silent Token Refresh & Interceptor (Frontend)
* **Workflow:**
  1. Upon successful login ➔ Backend issues `accessToken` (15-30 min lifetime) and `refreshToken` (7-30 days lifetime).
  2. In `useAuthStore.ts` and fetch/API wrappers:
     - Implement request interceptor: Check token expiry before sending API calls.
     - When access token is near expiry or receives `401 Unauthorized` ➔ Silently call `/api/v1/auth/refresh` to obtain a fresh access token without interrupting the active user form.
     - Only redirect to Login if the refresh token is genuinely invalid or revoked.

---

### Phase B — Backend Route Protection & Granular RBAC (Go Backend)
* **Workflow:**
  1. In `admin-system/backend/middleware/auth.go` and `backend/`:
     - Enforce `JWTAuthMiddleware(roles...)` across protected routes:
       * **Financials & Deep Margins (`/api/v1/finance`, `/api/v1/reports`):** `SUPER_ADMIN`, `OWNER`, `ACCOUNTANT`.
       * **HR & Payroll (`/api/v1/hr`, `/api/v1/employees`):** `SUPER_ADMIN`, `OWNER`.
       * **Procurement & Stock (`/api/v1/inventory`, `/api/v1/suppliers`):** `SUPER_ADMIN`, `OWNER`, `INVENTORY_MANAGER`.
       * **Orders & Production (`/api/v1/orders`, `/api/v1/production`):** `SUPER_ADMIN`, `OWNER`, `SALES`, `OPERATOR`.
  2. Attach audit log records with `user_id` on all critical mutations (deleting orders, adjusting stock counts).

---

### Phase C — UI Feedback & Role Switcher for Verification
* **Workflow:**
  1. In `LoginPage.tsx`:
     - Add Show/Hide Password toggle.
     - Add smooth loading state and clear Lao error messages (`ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ`).
  2. In TopHeader:
     - Display active role badge in Lao (e.g. `ເຈົ້າຂອງຮ້ານ (Owner)`, `ຊ່າງພິມ (Operator)`).
     - Provide a clean Logout button with confirmation modal.

---

## 3. Target Files by Layer

### Level 1: Frontend Admin ERP (`admin-system/frontend/`)
* **[MODIFY]** `src/store/useAuthStore.ts` — Add token refresh state and methods
* **[MODIFY]** `src/features/auth/LoginPage.tsx` — Show/Hide password toggle & UI polish
* **[MODIFY]** `src/components/ProtectedRoute.tsx` — Role-based route guarding
* **[MODIFY]** `src/components/TopHeader.tsx` — User profile badge & logout confirmation

### Level 2: Go Backend Layer (`admin-system/backend/` & `backend/`)
* **[MODIFY]** `admin-system/backend/middleware/auth.go` — Claims validation & role check enforcement
* **[MODIFY]** `admin-system/backend/auth/` — Refresh token handler & revocation list
* **[VERIFY]** `admin-system/backend/middleware/middleware_test.go` — Test unauthorized requests & role restrictions

---

## 4. Universal Guardrails
1. **NO SESSION DROP DURING EDITING:** Never force a logout while a staff member is actively editing an order or quote (Silent refresh must succeed).
2. **SECURE PERSISTENCE:** Store refresh tokens securely.
3. **PUBLIC TRACKING ACCESS:** The `/track` route on both customer and admin must remain accessible without authentication.

---

## 5. Acceptance Criteria
- [ ] Login succeeds ➔ Stores JWT token and renders role-appropriate UI in Lao.
- [ ] Access token expiration triggers automatic silent renewal without page reload.
- [ ] Unauthorized roles (e.g. Operator) cannot view Finance dashboards or delete orders.
- [ ] `npm run build` and `go test ./...` pass with 100% success.
