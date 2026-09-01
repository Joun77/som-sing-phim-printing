# Task 32: Customer Service to Go Backend End-to-End API Integration

## Mission & Context

Bridge the Customer Service storefront (`customer-service`) with the Go backend API (`admin-system/backend`). Eliminate reliance on static catalog mock data and client-side `localStorage` persistence, enabling real-time product synchronization, backend pricing calculation, centralized order creation, and cross-device order tracking.

---

## Target Layer & Affected Files

- **Customer Service Storefront**:  
  - `customer-service/src/api/client.ts`  
  - `customer-service/src/pages/CategoryPage.tsx`, `ProductPage.tsx`, `CheckoutPage.tsx`, `TrackingPage.tsx`  
  - `customer-service/src/hooks/useDynamicPriceCalculator.ts`  
  - `customer-service/src/data/catalog.ts` (refactor to fallback)  
- **Go Backend**:  
  - `admin-system/backend/orders/handlers.go`, `orders/models.go`  
  - `admin-system/backend/catalog/` or `admin-system/backend/pricing/handlers.go`  
  - `admin-system/backend/main.go`

---

## Technical Specifications & Requirements

### 1\. Dynamic Catalog API Integration

- Backend:  
  - Implement `GET /api/catalog/products` to return active products configured in Admin Product Studio with pricing parameters, paper grades, grammages, and finishing options.  
- Frontend:  
  - In `customer-service/src/api/client.ts`, add `fetchCatalogProducts()`.  
  - In `CategoryPage.tsx` and `ProductPage.tsx`, query products from backend using React Query, falling back to `catalog.ts` only if network fails.

### 2\. Real-Time Pricing Verification Endpoint

- Connect `useDynamicPriceCalculator.ts` to `POST /api/pricing/calculate`.  
- Payload: `{ productId, quantity, paperType, grammage, finishingOptions, bindingType, cmykCoverage }`.  
- Ensure fallback calculation exists on client if backend is temporarily unreachable, but flag order as `PENDING_PRICE_CONFIRMATION` if calculated offline.

### 3\. Centralized Order Submission (PostgreSQL Persistence)

- In `CheckoutPage.tsx`:  
  - Replace `localStorage.setItem('orders', ...)` with API call `POST /api/orders`.  
  - Payload must include:  
    - Customer Info (Name, Phone, WhatsApp, Delivery Address, Province, District)  
    - Order Items (Product ID, Spec, Pages, Quantity, Unit Price, Total Price)  
    - Payment & Delivery (Payment Method, Slip Image URL/Base64, Carrier: Anousith / HAL, Shipping Fee)  
    - Artwork (Google Drive link or uploaded file URL)  
  - Receive response: `{ orderId: string, trackingCode: string, status: "PENDING_SLIP_CHECK" }`.

### 4\. Cross-Device Order Tracking

- Backend:  
  - Implement `GET /api/orders/track?q=:query` where `query` can be either `order_id` (e.g. `SSP-2026-XXXX`) or customer `phone_number`.  
  - Return order details, current stage in state machine, delivery carrier info, and digital proof status.  
- Frontend:  
  - In `TrackingPage.tsx`, fetch real order status from the API.

---

## Verification & Acceptance Criteria

- [ ] Changes made to product options in Admin Product Studio immediately reflect on Customer Service product pages.  
- [ ] Submitting an order on Customer Service creates a new row in PostgreSQL `orders` table and shows up on Admin Order Reception page in real-time.  
- [ ] Searching for an order using telephone number on a different browser/device successfully retrieves order status and history.

