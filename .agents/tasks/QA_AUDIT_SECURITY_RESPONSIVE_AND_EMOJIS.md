# QA Audit & Fix Plan: Security Vulnerabilities, Responsive UI & Emoji Elimination

**System:** Som Sing Phim Printing  
**Roles Involved:** `system-analyst-qa`, `somsing-frontend-engineer`, `somsing-printing-simulator`  
**Date:** September 4, 2026  
**Status:** Audit Completed & Fix Verified  

---

## 1. Security Vulnerability: Admin ERP Link in Public Footer

### 1.1 Finding & Severity: CRITICAL (ACCESS LEAK)
- **Location:** `customer-service/src/components/Footer.tsx` (Lines 100–108)
- **Defect:** The public customer-facing footer contained a direct hyperlink to the Admin ERP:
  ```tsx
  <a href="https://som-sing-phim-admin.web.app" target="_blank" rel="noopener noreferrer">
    <Lock className="w-3.5 h-3.5 inline" /> ລະບົບຈັດການຫຼັງຮ້ານ (Admin ERP)
  </a>
  ```
- **Impact:** Exposed internal administrative infrastructure and employee login portal to general public customers and competitors.
- **Resolution Applied:**
  - Completely purged the Admin ERP hyperlink from `customer-service/src/components/Footer.tsx`.
  - Replaced with standard public assurance badge: `ຮັບໄຟລ໌ຜ່ານ Google Drive & PDF (Accepts Google Drive & Print-Ready PDF)`.
  - **Verification:** Verified zero references to `som-sing-phim-admin` in `customer-service/`.

---

## 2. Responsive UI & Header Image Overlap in Product Page

### 2.1 Finding & Visual Defect (Screenshot 12 Analysis)
- **Location:** `customer-service/src/pages/ProductPage.tsx`
- **Defect:**
  - On tablet and mobile viewports, the product title `Copy Document`, category breadcrumbs, upload progress tabs, and the starting price pill (`ລາຄາເລີ່ມຕົ້ນ ₭ ... / ແຜ່ນ`) were competing for horizontal flex space without proper wrapping.
  - Overlaid image badges (`ດິຈິຕອນ 2400 DPI` and `ສິນຄ້າຍອດນິຍົມ`) in the gallery photo box overlapped with category breadcrumb text on smaller screens.
- **Resolution Applied:**
  - Wrapped product title and starting price header in an adaptive flex container:
    ```tsx
    className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pb-2 border-b border-slate-100"
    ```
  - Added `flex-wrap` and responsive text sizing (`text-lg sm:text-2xl`) to prevent text clipping.
  - Ensured gallery image container maintains `relative overflow-hidden` with responsive aspect ratio (`aspect-[4/3] sm:aspect-[16/10]`) so badges remain cleanly pinned inside the photo container.

---

## 3. Strict Zero-Emoji Policy Compliance Pass

### 3.1 Audit Findings & Cleanups
Per Som Sing Phim engineering standards, all Unicode emojis must be replaced with official Lucide icons (`lucide-react`).
- **Cleaned Items:**
  1. `Step1GeneralInfo.tsx`: Removed `📁` and `✓` unicode symbols; replaced with clean typography and Lucide icons.
  2. `Step2PrintEngine.tsx`: Removed `✓` from product usage badge.
  3. `Step5DiscountsAndTabs.tsx`: Removed `✓` from "ຟຣີ / ລວມໃນຊຸດ" line items.
  4. `Step4PostPressFinishing.tsx`: Removed literal `[x]`, `[✓]`, and `[—]` text markers; replaced with `<Scissors />`, `<FileCheck />`, and styled toggle badges.
- **Scanner Result:** Zero active emoji characters remaining across JSX text in `admin-system/frontend/src` and `customer-service/src`.

---

## 4. Test Cases & Verification

| Test ID | Area | Scenario | Expected Behavior | Status |
| :--- | :--- | :--- | :--- | :---: |
| **SEC-01** | Public Footer | Inspect all links on customer storefront | Zero links to `som-sing-phim-admin.web.app` | **PASS** |
| **RESP-01** | Product Header | View `/product/copy-document` on 375px (Mobile) | Title and starting price stack cleanly with 0 horizontal overflow | **PASS** |
| **RESP-02** | Image Badges | View gallery showcase on 768px (Tablet) | `ດິຈິຕອນ 2400 DPI` badge remains inside photo frame | **PASS** |
| **EMOJI-01** | Full Frontend | Automated Unicode regex scan across `.tsx` files | Zero emojis detected | **PASS** |
