# Technical Specification & Test Plan: Customer Authentication & 1-Click Re-order

**System:** Som Sing Phim Printing Customer Storefront & Admin API  
**Orchestration Architecture:** Phased Skill Breakdown  
**Target Completion:** Ready for Downstream Agent Execution  
**Date:** September 4, 2026  

---

## 1. Executive Concept: Frictionless Hybrid Customer Portal
- **Philosophy:** Never force a mandatory password login on first-time buyers. Maintain 100% frictionless guest checkout while empowering returning SME customers (coffee shops, bakeries, corporate clients) with 1-Click Re-ordering and address persistence via phone authentication.

---

## 2. Skill Allocation & Responsibility Breakdown

```
                       +-----------------------------------+
                       |      somsing-qa-orchestrator      |
                       | (System Architecture & Pipeline)  |
                       +-----------------+-----------------+
                                         |
        +--------------------------------+--------------------------------+
        |                                |                                |
+-------v------------------+   +---------v----------------+   +-----------v--------------+
| somsing-backend-engineer |   | somsing-frontend-engineer|   | somsing-printing-simulator|
| (API & Security Masking) |   | (UI, Header & Drawers)   |   | (End-to-End Persona Tests) |
+--------------------------+   +--------------------------+   +--------------------------+
                                         |
                               +---------v----------------+
                               |     system-analyst-qa    |
                               | (Test Cases & Edge Cases)|
                               +--------------------------+
```

### 2.1 Role: `somsing-backend-engineer`
- **Target Files:**
  - `admin-system/backend/customers/customers.go`
  - `admin-system/backend/main.go`
- **Responsibilities:**
  1. Maintain `/api/v1/public/customer/auth`:
     - Validate Lao phone format (`020XXXXXXXX` or `XXXXXXXX` with 8 digits).
     - Idempotent upsert: if customer phone exists in PostgreSQL `customers` table, return existing record; otherwise create new `RETAIL` customer.
  2. Maintain `/api/v1/public/customer/profile`:
     - GET profile by phone.
     - PUT profile update (Province, District, Village, Address, BranchCode, WhatsApp).
  3. Maintain `/api/v1/public/customer/orders`:
     - Query customer orders by phone.
     - **Strict Security Masking:** Ensure all internal cost fields (`TotalCost`, `UnitCostLAK`, `MachineOverheadLAK`, `RemainingLAK`) are masked to 0 so customer cannot view shop profit margins.
  4. Ensure `Cache-Control: no-cache, no-store, must-revalidate` is set on all customer profile responses.

### 2.2 Role: `somsing-frontend-engineer`
- **Target Files:**
  - `customer-service/src/components/Header.tsx`
  - `customer-service/src/components/customer/CustomerProfileModal.tsx`
  - `customer-service/src/components/customer/CustomerOrderHistoryDrawer.tsx`
  - `customer-service/src/pages/CheckoutPage.tsx`
- **Responsibilities:**
  1. **Header UI Redesign (`Header.tsx`):**
     - Replace hidden gray user icon with an explicit member button:
       - **Guest State:** Display `👤 ເຂົ້າສູ່ລະບົບ (Sign In / Member)` pill button with amber accent.
       - **Logged-in State:** Display `👤 020 55...` badge with gold accent, click to open Profile & Order History.
  2. **1-Click Re-order UI (`CustomerOrderHistoryDrawer.tsx`):**
     - Display list of customer's previous orders with live status badges (`DELIVERED`, `IN_PRODUCTION`, etc.).
     - Next to each job item, render a prominent **`ສັ່ງພິມຊ້ຳ (Re-order)`** button.
     - Clicking `ສັ່ງພິມຊ້ຳ` immediately pushes the exact product, specs, approved artwork link, and special notes to cart and opens CartDrawer.
  3. **Address Book Auto-fill (`CheckoutPage.tsx`):**
     - When a logged-in user visits Checkout, automatically populate name, phone, province, district, village, and preferred delivery courier.

### 2.3 Role: `somsing-printing-simulator`
- **Simulated Persona:** Bounmy (SME Drink Brand Owner - "ຮ້ານຊານົມ ວຽງຈັນ")
- **Workflow Scenario:**
  1. Bounmy orders 50 sheets of Waterproof PP stickers for tea bottles on Week 1.
  2. Bounmy's phone `020 55223344` is stored upon BCEL One checkout.
  3. On Week 3, Bounmy returns to `https://som-sing-phim-service.web.app`.
  4. Bounmy clicks `👤 ເຂົ້າສູ່ລະບົບ`, enters `020 55223344`.
  5. Profile loads instantly; Bounmy opens `ປະຫວັດການສັ່ງຊື້`, finds the previous sticker order, and clicks `ສັ່ງພິມຊ້ຳ`.
  6. Cart drawer opens with exact specs, previous artwork PDF already linked, and current unit price.
  7. Bounmy completes re-order in under 25 seconds.

### 2.4 Role: `system-analyst-qa`
- **Verification Matrix & Test Cases:**

| Test ID | Scenario | Input | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :---: |
| **AUTH-01** | Public phone login with valid Lao number | `020 55123456` | Returns customer profile object, stores `ssp_customer_phone` | **READY** |
| **AUTH-02** | Login with invalid short phone | `1234` | Rejects with clear Lao error message (`ກະລຸນາປ້ອນເບີໂທ 8 ຫຼັກ`) | **READY** |
| **AUTH-03** | Order history security check | GET `/v1/public/customer/orders` | Customer sees order items and total paid, but `TotalCost` is strictly `0` | **READY** |
| **REORD-01**| Click `ສັ່ງພິມຊ້ຳ` on past sticker order | Completed order item | Pushes to `cart`, retains artwork drive link, recalculates current price | **READY** |
| **CHECK-01**| Auto-fill checkout form | Logged-in customer | Buyer & Recipient forms auto-fill with saved address book data | **READY** |

---

## 3. Implementation Next Steps
- Execute sequentially: `somsing-backend-engineer` verification -> `somsing-frontend-engineer` component polish -> `system-analyst-qa` test validation.
