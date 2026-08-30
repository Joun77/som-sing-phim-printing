# Task 29: Customer Service Member Portal & Saved Address Book (Phase 3)

## 1. Execution Directives & AI Configuration
* **AI Role:** Full-Stack Customer Experience Engineer
* **Anti-Gravity Model Tier:** `gemini-3.5`
* **Thinking Budget / Effort Level:** `Medium` *(Customer profile state management, address book UI, and order history retrieval by phone)*
* **Token Optimization Strategy:** Keep customer auth lightweight (phone lookup / OTP simulation / local session token); focus on checkout UX acceleration.

> **CRITICAL LOCALIZATION REQUIREMENT:** All user-facing profile fields, saved address cards, and order history badges MUST strictly render in official **Lao language** (`lo` / ພາສາລາວ).

---

## 2. Objective & Detailed Scope
Enhance the customer experience on the storefront (`customer-service`) by introducing a lightweight Customer Session / Member Portal. Allow customers to save their preferred Lao shipping addresses and quickly view all past print orders by phone number, eliminating repetitive data entry during checkout.

---

## 3. Phase-by-Phase Implementation Plan

### Phase A — Customer Phone Lookup & Session Auth (`/api/v1/public/customer/auth`)
* **Workflow:**
  1. Customer enters Lao phone number (e.g. `020 55123456`) in Header or Checkout.
  2. Backend looks up or registers customer in PostgreSQL `customers` table.
  3. Issues a lightweight customer session token stored in `localStorage ('ssp_customer_session')`.

---

### Phase B — Saved Shipping Address Book
* **Workflow:**
  1. When placing an order in `CheckoutPage.tsx`:
     - Provide a checkbox: `[✓] ບັນທຶກທີ່ຢູ່ນີ້ສຳລັບການສັ່ງຊື້ຄັ້ງຕໍ່ໄປ (Save address for future orders)`.
  2. For returning customers:
     - Automatically pre-fill Name, Phone, Province, District, Village, and Preferred Courier Branch.
     - Allow 1-click address switching.

---

### Phase C — Customer Personal Order History View
* **Workflow:**
  1. Add a dedicated **My Orders (ປະຫວັດການສັ່ງຊື້)** modal / drawer in `customer-service`:
     - Displays all active and completed orders for the logged-in phone number.
     - Shows current status badges (`ກຳລັງພິມ`, `ຈັດສົ່ງແລ້ວ`), delivery tracking buttons, and 1-click `[ສັ່ງພິມຊ້ຳ (Re-order)]`.

---

## 4. Target Files by Layer

### Layer 1: Customer Service Components & Pages
* **[NEW]** `customer-service/src/components/customer/CustomerProfileModal.tsx` — Address book & profile management
* **[NEW]** `customer-service/src/components/customer/CustomerOrderHistoryDrawer.tsx` — Order history list & re-order action
* **[MODIFY]** `customer-service/src/pages/CheckoutPage.tsx` — Pre-fill saved address and provide save-address toggle
* **[MODIFY]** `customer-service/src/components/Header.tsx` — Add Customer Profile & My Orders trigger buttons

### Layer 2: Go Backend Public Handlers
* **[MODIFY]** `admin-system/backend/customers/customers.go` — Add public customer profile and orders by phone endpoint
* **[MODIFY]** `admin-system/backend/main.go` — Mount `/api/v1/public/customer/profile` and `/api/v1/public/customer/orders`

---

## 5. Universal Guardrails
1. **NO TEXT EMOJIS:** Use Lucide icons exclusively.
2. **LAO PRIMARY UI:** All labels (`ທີ່ຢູ່ທີ່ບັນທຶກໄວ້`, `ປະຫວັດການສັ່ງຊື້`, `ສັ່ງພິມຊ້ຳ`) must be standard Lao.
3. **PRIVACY GUARD:** Public phone order lookups must only return masked information without exposing financial backend margins.

---

## 6. Acceptance Criteria
- [ ] Returning customers have their shipping address and contact details auto-populated in Checkout.
- [ ] Customers can view all their past orders under their phone number in the My Orders drawer.
- [ ] Clicking Re-order on past items loads the exact same specifications into the Cart Drawer.
- [ ] `tsc --noEmit` and `npm run build` pass with 0 errors.
