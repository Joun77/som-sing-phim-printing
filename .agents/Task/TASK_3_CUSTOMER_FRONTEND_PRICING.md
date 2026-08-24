# Phase 3 - Task 3: Customer Service Frontend Dynamic Pricing UI

## Objective
Develop the customer-facing ordering and file-submission interface in `som-sing-phim-frontend` using React and TypeScript. Provide dynamic option selection, Google Drive link ingestion, and asynchronous price calculation polling while displaying only aggregate price per page and total costs.

## Target Files
- `src/types/pricing.ts` (Create)
- `src/hooks/useDynamicPriceCalculator.ts` (Create)
- `src/components/customer/PrintOrderForm.tsx` (Create)
- `src/components/customer/DriveLinkInput.tsx` (Create)
- `src/components/customer/PriceSummaryCard.tsx` (Create)

## Technical Requirements

### 1. Types & State Contracts (`src/types/pricing.ts`)
- TypeScript interfaces for `ProductOption`, `PricingQuoteResponse`, `FileScanStatus`:
  - `CustomerPriceQuote`: `unitPricePerPage`, `totalUnitPrice`, `quantity`, `subtotal`, `badge` (`'AUTO_VERIFIED'` | `'PENDING_VERIFICATION'`).
  - Strict absence of raw CMYK/TAC percentages in user-facing components.

### 2. Pricing & Job Polling Hook (`src/hooks/useDynamicPriceCalculator.ts`)
- Custom React hook managing option selection, debounce (300ms) for input changes, and polling `file_scan_jobs` status.
- Once scan job status changes to `AUTO_VERIFIED` or `PENDING_MANUAL_VERIFICATION`, automatically fetch updated price quote.

### 3. UI Components (`src/components/customer/`)
- `PrintOrderForm.tsx`: Dynamic form rendering paper options (e.g., Woodfree 80gsm, Green Read 75gsm) and binding options with dependency validation.
- `DriveLinkInput.tsx`: URL input with instant Google Drive link validation and real-time scanning progress indicator.
- `PriceSummaryCard.tsx`: Displays aggregated price per A4 page, setup cost, and total summary without exposing individual ink percentages.

## Constraints & Output Rules
- Strict TypeScript (no `any`).
- Responsive layout using Tailwind CSS and accessible interactive states.

---

### 🚀 IDE Execution Prompt (Copy & Paste to IDE Assistant)
> "Act as a senior frontend engineer. Implement Phase 3 Task 3 based on the specification above. Create `src/types/pricing.ts`, `src/hooks/useDynamicPriceCalculator.ts`, and customer-facing components under `src/components/customer/` in `som-sing-phim-frontend`. Implement reactive option selection and async Drive scan job status polling. Ensure the customer view only displays aggregated page rate and total price without raw CMYK channels."
