# Task 23: State Management Architecture Refactoring & React Query Migration

## 1. AI Role & Mission
* **Role:** Principal Frontend Performance Architect & React State Specialist
* **Mission:** Refactor the Admin ERP state management architecture from a monolithic `AppContext.tsx` (~160KB) into a clean separation of **Server State (TanStack React Query)** and **Client UI State (Zustand)**, eliminating full-page re-renders, fixing stale cache issues, and accelerating data grid rendering.

> **CRITICAL LOCALIZATION REQUIREMENT:** All user-facing toasts, confirmation modals, error alerts, and table cells MUST strictly render in official **Lao language** (`lo` / ພາສາລາວ).

---

## 2. Phase-by-Phase Implementation Plan

### Phase A — Server State Extraction to React Query Custom Hooks
* **Workflow:**
  1. Create modular custom hooks for server state management with automatic background caching and refetching:
     - `useOrdersQuery()` / `useOrderMutations()`: Manage order directory & item specs (Query Key: `['orders']`)
     - `useInventoryQuery()` / `useInventoryMutations()`: Manage materials, FIFO batches, and offcuts (Query Key: `['inventory']`, `['materials']`)
     - `useEquipmentQuery()` / `useEquipmentMutations()`: Manage machinery, meters, and maintenance tickets (Query Key: `['equipment']`)
     - `useSuppliersQuery()` / `usePOMutations()`: Manage supplier price comparisons & purchase orders (Query Key: `['suppliers']`, `['purchase-orders']`)
     - `useExchangeRatesQuery()`: Manage multi-currency exchange rates (Query Key: `['rates']`)
  2. Ensure every mutation (Create / Update / Delete) calls `queryClient.invalidateQueries` to trigger instant UI table updates.

---

### Phase B — Lightweight Zustand Stores for Client UI State
* **Workflow:**
  1. Separate client-only interactive state into dedicated Zustand stores:
     - `useUIStore`: `sidebarOpen`, `collapsed`, `activeTab`, `toast`, `confirmDialog`, `lightbox`
     - `useFilterStore`: `searchKeyword`, `dateRangeFilter`, `paymentStatusFilter`, `logisticsFilter`
     - `useAuthStore`: `token`, `currentUser`, `isAuthenticated`, `rememberMe`
  2. Reduce `AppContext.tsx` complexity and phase out unnecessary global state bloat.

---

### Phase C — Performance Benchmarking & Render Optimization
* **Workflow:**
  1. Wrap heavy data grid components (`OrdersTable`, `StockTable`, `POListPage`) with `React.memo` and optimize column accessor callbacks.
  2. Verify that live searching (Search input) operates at 60fps with zero input lag.

---

## 3. Target Files

* [NEW] `admin-system/frontend/src/hooks/queries/useOrdersQuery.ts`
* [NEW] `admin-system/frontend/src/hooks/queries/useInventoryQuery.ts`
* [NEW] `admin-system/frontend/src/hooks/queries/useEquipmentQuery.ts`
* [NEW] `admin-system/frontend/src/hooks/queries/useSuppliersQuery.ts`
* [NEW] `admin-system/frontend/src/store/useUIStore.ts`
* [NEW] `admin-system/frontend/src/store/useFilterStore.ts`
* [MODIFY] `admin-system/frontend/src/store/AppContext.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/CustomerOrders.tsx`
* [MODIFY] `admin-system/frontend/src/features/inventory/components/InventoryManagement.tsx`

---

## 4. Acceptance Criteria
- [x] All server state is managed through TanStack React Query custom hooks.
- [x] Mutating data immediately refreshes tables without full-page reloads.
- [x] `AppContext.tsx` size and complexity is reduced significantly.
- [x] Table search filtering and tab switching runs smoothly at 60fps.
- [x] `npm run build` passes with 100% success and zero TypeScript errors.
