# Phase 4: Order Completion Summary (Step 4), Theme Colors & Order ID Copy

## 1\. Role & Identity

You are an expert Frontend UI/UX Engineer specializing in React, Tailwind CSS, and Design Systems for Som Sing Phim Printing ERP.

## 2\. Objective

1. Refactor Step 4 ("Order Completion Summary" / `ສະຫຼຸບຂໍ້ມູນອໍເດີສຳເລັດສົມບູນ`).  
2. Fix button color styling for `ໃບເກັບເງິນ (Invoice / Receipt)` to match the Som Sing Phim Sky Blue brand palette.  
3. Replace the confusing `BCEL OnePay QR` / `100% PAID` boxes with a clean Verified Payment Card.  
4. Convert the produced items table into a clean commercial billing summary (hide technical GSM/cutting/binding/coating columns, show only Name, Quantity, Unit Price, Subtotal, and Grand Total).  
5. Implement the clean Order ID Click-to-Copy component for instant customer tracking lookup.

---

## 3\. Target Files to Modify

- `admin-system/frontend/src/features/orders/components/reception/Step4OrderSummary.tsx` (or `OrderCompletionSummaryPage.tsx`)  
- `admin-system/frontend/src/features/orders/components/reception/PaymentProofCard.tsx`  
- `admin-system/frontend/src/features/orders/components/reception/ProducedItemsTable.tsx`  
- Create new component: `admin-system/frontend/src/features/orders/components/common/OrderIdCopyButton.tsx`  
- `admin-system/frontend/src/features/orders/components/OrderListPage.tsx` (to place copy buttons on rows)

---

## 4\. STRICT CONSTRAINTS (DO NOT TOUCH)

- **DO NOT MODIFY** the invoice generation logic (PDF formatting, QR code payload generation).  
- **DO NOT ALTER** the final ERP database order status mutation (keep `status = 'COMPLETED'`).  
- Preserve cashier verification timestamps and transaction reference codes (`SSP-PAY-...`).

---

## 5\. Detailed Tasks & Implementation Instructions

### Task 4.1: Order ID Click-to-Copy Button

- Create `OrderIdCopyButton.tsx`:  
  - When clicked, copy the clean string (e.g. `ord-8833`, stripped of `#`) directly to clipboard.  
  - Show a temporary 2-second visual feedback: `"✓ ຄັດລອກແລ້ວ"`.  
  - Place this component next to the order header title in Step 4 and on the Order List table row.

### Task 4.2: Brand Color Correction for Invoice Button

- In header actions of Step 4:  
  - Find the button `ໃບເກັບເງິນ (Invoice / Receipt)`.  
  - Replace the dark Royal Blue (`#1d4ed8` / `bg-blue-700`) with Som Sing Phim brand sky blue: `className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-sky-200 transition-all"`

### Task 4.3: Redesign Section 2 (Payment Proof & Settlement)

- Replace the floating empty selection boxes with a unified Verified Payment Card:  
  - **Left Section (Method & Slip):**  
    - Method: `"BCEL OnePay (QR Code)"`.  
    - Thumbnail of verified slip image (click to open modal preview).  
    - Transaction reference: `Ref: SSP-PAY-ord-8833`.  
    - Date and cashier name: `Verified by Cashier (Som-Sing Printing)`.  
  - **Right Section (Payment Status):**  
    - Distinct status badge: `[ ✓ ຊຳລະຄົບຖ້ວນ 100% (100% PAID) ]` in emerald green.  
    - Amount Paid: `LAK 72,484.00`.  
    - Remaining Balance: `LAK 0.00 (ປິດອໍເດີແລ້ວ)`.

### Task 4.4: Commercial Summary Table for Produced Items

- In Section 3 ("3. ລາຍລະອຽດສິນຄ້າທີ່ຜະລິດ & ຜ່ານ QC"):  
  - **Remove Technical Columns:** Remove `เนื้อกระดาษ & แกรม`, `ขนาด/หน้า`, `การเข้าเล่ม/เคลือบ`.  
  - **Rebuild with Commercial Columns:**  
    1. ลำดับ (No.)  
    2. รายการสินค้า / ชื่องานพิมพ์ (Item Description \- e.g. "เอกสารยืนยันการแก้ไขรูปภาพ")  
    3. จำนวนสั่งพิมพ์ (Quantity \- e.g. "1 ชุด")  
    4. ราคาต่อหน่วย (Unit Price)  
    5. มูลค่ารวม (Total Price LAK)  
  - **Table Footer Summary:**  
    - ค่าพิมพ์รวม (Subtotal)  
    - ค่าจัดส่ง (Shipping Fee)  
    - ส่วนลด (Discount)  
    - **ยอดรวมสุทธิทั้งสิ้น (GRAND TOTAL): `LAK 72,484.00`**

---

## 6\. Verification & Acceptance Criteria

2. Clicking the Order ID copy button copies `ord-8833` cleanly, ready to paste into customer tracking search.  
3. The Invoice/Receipt button matches the exact sky blue palette of the active ERP sidebar.  
4. The Payment Proof section clearly displays verified slip information and a 100% Paid status card.  
5. The item summary table shows only commercial pricing figures without technical prepress specs.

