---
name: somsing-system-analyzer
description: Analyze, audit, and diagnose the Somsin Printing (Som Sing Phim) Admin ERP, Customer Service storefront, and Go backend systems. Use when reviewing codebase architecture, validating pricing engine formulas, diagnosing order lifecycle and proof review flows, auditing inventory and machine cost calculations, or recommending system improvements for Somsin Printing.
---

# Somsin System Analyzer & Architecture Guard

A specialized skill for auditing, diagnosing, and enhancing the Somsin Printing (Som Sing Phim) print ERP ecosystem, spanning the Admin ERP, Customer Service storefront, and Go backend.

## 1. When to Use
- Reviewing or auditing the Somsin Printing codebase architecture.
- Checking for discrepancies in pricing, paper unit costs, machine depreciation, or ink coverage calculations.
- Diagnosing the order lifecycle, state machine transitions, digital proof review, or payment slip verification.
- Auditing inventory inbound, moving average cost formulas, lots FIFO, or zero-stock retention.
- Recommending refactoring, UI/UX enhancements, or performance optimizations for Admin and Customer Service.

## 2. Core Analysis & Verification Steps

### Step 1: Architecture & Component Mapping
- Identify the affected layer:
  - Admin ERP: `admin-system/frontend/src/` (React 19 + TanStack Query + Zustand)
  - Customer Service: `customer-service/src/` (React 18 + PWA + Three.js)
  - Backend Services: `backend/internal/service/` (Go Fiber / Net-HTTP)
- Check data contracts and TypeScript interface parity with Go domain models (`types/order.ts`, `types/pricing.ts`, `types/inventory.ts`).

### Step 2: Pricing & Cost Engine Audit
- **Paper Unit Cost:**
  $$	ext{Unit Cost (LAK/Sheet)} = \frac{	ext{Total Import Cost}}{	ext{Pack Count} 	imes 	ext{Sheets Per Pack}}$$
- **Ink Cost Formula:**
  $$	ext{Ink Cost} = 	ext{Coverage \%} 	imes 0.007 	imes 	ext{Ink Cost per ml} 	imes 	ext{Total Sheets}$$
- **Machine Overhead (Depreciation + Maintenance):**
  $$	ext{Depreciation per Sheet} = \frac{	ext{Purchase Price}}{	ext{Expected Lifetime Pages}}$$
  $$	ext{Maintenance per Sheet} = 	ext{Depreciation} 	imes \left(\frac{	ext{Maintenance Rate \%}}{100}\right)$$
  $$	ext{Total Base Cost} = 	ext{Paper} + 	ext{Ink} + (	ext{Machine Cost per Sheet} 	imes 	ext{Total Sheets}) + 	ext{Finishing/Labor}$$

### Step 3: Order Lifecycle & Proof Verification Workflow
- Order State Machine:
  `PENDING_SLIP_CHECK` ➔ `PAID_PREPRESS` ➔ `PREPRESS_CHECK` ➔ `WAITING_APPROVAL` ➔ `PROOF_REJECTED` ➔ `FILE_CONFIRMED` ➔ `READY_TO_PRINT` ➔ `IN_PRODUCTION` ➔ `POST_PRESS` ➔ `SHIPPED` ➔ `DELIVERED`
- Digital Proof Approval / Rejection sync: Customer `TrackingPage` ↔ Admin `ArtworkPrepressCard`.
- Verify carrier tracking codes (Anousith Express, HAL Logistics) and delivery receipts.

### Step 4: Inventory & Inbound Lifecycle
- Single-Record Master Integrity (1 row per SKU in `materials`).
- Dynamic Moving Average Cost calculation on stock inbound.
- Inbound Reversal logic (stock subtraction, status set to `OUT_OF_STOCK` on zero quantity without deleting record).

### Step 5: Multi-Currency & Bilingual Localization
- Exchange rate caching (LAK, THB, USD) and currency formatting.
- Lao (`lo`), Thai (`th`), and English (`en`) translation keys and font rendering (`Noto Sans Lao`).

## 3. Universal Guardrails
1. **NO EMOJIS:** Use Lucide icons (`lucide-react`) exclusively.
2. **LAO PRIMARY UI:** All client-facing text in the Admin system and Customer Service must default to proper Lao terminology.
3. **DECIMAL SAFETY:** Round LAK to integer (0 decimals) and THB to 2 decimal places.
