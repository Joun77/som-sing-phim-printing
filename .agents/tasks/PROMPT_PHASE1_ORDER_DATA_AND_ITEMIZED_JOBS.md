# Phase 1: Order Data Structure, Itemized Dynamic Jobs & Mapping Fix

## 1\. Role & Identity

You are an expert Senior Full-Stack Engineer specializing in React (TypeScript) and Go (PostgreSQL) for the Som Sing Phim Printing ERP system.

## 2\. Objective

Fix the critical data synchronization and multi-item mapping issue where:

1. Quotations with multiple print items get incorrectly flattened or bloated into ghost jobs (e.g., Parent Sheets / paper cutting tickets being treated as separate top-level jobs).  
2. The Order Total mismatch between the Order List (`LAK 72,484.00`) and the Edit Modal (`LAK 67,742.00`).  
3. Customer artwork files are not bound 1:1 with each individual print item.

---

## 3\. Target Files to Modify

- `admin-system/backend/orders/models.go` (and corresponding handler files)  
- `admin-system/frontend/src/features/orders/types.ts`  
- `admin-system/frontend/src/utils/orderDataMapper.ts` (or quotation-to-order converter service)  
- `admin-system/frontend/src/features/orders/components/reception/PaymentSlipCard.tsx`

---

## 4\. STRICT CONSTRAINTS (DO NOT TOUCH)

- **DO NOT TOUCH** core database authentication, user roles, or session management.  
- **DO NOT TOUCH** quotation cost engine algorithms (formulas calculating per-unit ink/paper in `features/pricing`).  
- **DO NOT TOUCH** inventory stock deduction logic in the warehouse module.  
- Any changes must be backwards-compatible with existing single-item orders.

---

## 5\. Detailed Tasks & Implementation Instructions

### Task 1.1: Prevent Parent Sheets from Becoming Standalone Jobs

- **Problem:** When an order is generated or mapped from a quotation, raw material cutting specifications (e.g. `[เอกสาร...] Green Read Paper (Parent Sheets)`) are being appended as standalone `Job #2` and `Job #4`.  
- **Action:**  
  - In `orderDataMapper.ts` and Go backend order creation: Parent sheets and cutting tickets must remain nested under `item.specifications.paper_cutting_ticket` or `item.specifications.materials`.  
  - Filter out any ghost items. 1 quotation item \= 1 order job item.  
  - If a customer orders 1 booklet, the order must strictly contain **1 Job**, containing both cover and inner paper specs within its material configuration.

### Task 1.2: Reconcile Order Grand Total Calculation

- **Problem:** Order list displays `72,484 LAK`, but Edit Modal calculates `67,742 LAK`.  
- **Action:**  
  - Standardize the single source of truth formula: $$\\text{Grand Total} \= \\sum(\\text{Job Items}) \- \\text{Discount} \+ \\text{Shipping}$$  
  - Ensure shipping fees (e.g. HAL Logistics) and discounts are consistently added/subtracted across the Order List table, Edit Modal, and Database `orders.total_amount` column.

### Task 1.3: Dynamic Multi-Artwork Binding (1 File per 1 Job Item)

- **Problem:** Artwork files currently live in a flat array or top-level order field, showing only 1 file even when 4 jobs exist.  
- **Action:**  
  - In `types.ts`, update `OrderPrintItem` to include:  
      
    export interface OrderPrintItem {  
      
      id: string;  
      
      item\_index: number;  
      
      job\_name: string; // e.g., "งานพิมพ์เอกสาร ภาษาไทย"  
      
      artwork: {  
      
        file\_url: string;  
      
        file\_name: string;  
      
        file\_size\_bytes?: number;  
      
        preview\_thumbnail\_url?: string;  
      
        page\_count?: number;  
      
      };  
      
      specifications: {  
      
        printer\_id: string;  
      
        printer\_name: string;  
      
        paper\_id: string;  
      
        paper\_name: string;  
      
        paper\_weight\_gsm: number;  
      
        paper\_size: string;  
      
        print\_color\_mode: string;  
      
        print\_sides: 'single' | 'double';  
      
        coating?: string;  
      
        binding?: string;  
      
        finishing\_options?: string\[\];  
      
      };  
      
      quantity: number;  
      
      unit\_price: number;  
      
      total\_price: number;  
      
    }

### Task 1.4: Payment Slip & Deposit Button Update

- In `PaymentSlipCard.tsx`:  
  - Remove all currency symbols from the action button. Label it strictly as: `"ຢືນຢັນການມັດຈຳ"` (ยืนยันการมัดจำ / Confirm Deposit).

---

## 6\. Verification & Acceptance Criteria

1. Creating or viewing an order with 2 quotation items renders exactly 2 jobs (no parent sheet duplicates).  
2. Each job displays its own distinct artwork filename and download link.  
3. The Grand Total on the Order List table matches the total inside the Edit Modal to the exact Kip.

