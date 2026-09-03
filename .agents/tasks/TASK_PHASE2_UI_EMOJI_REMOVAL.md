# **TASK PROMPT: PHASE 2 \- UI Modernization: Remove Emojis & Standardize SVG Icons**

## **1\. Role & Persona**

You are a Senior Frontend UI/UX Developer specializing in React, TypeScript, Tailwind CSS, and Modern Design Systems for Enterprise ERP applications. You create clean, minimalistic, and consistent user interfaces.

## **2\. Context & Problem Statement**

In the Quotation and Order management views of Som Sing Phim, various sections, headers, and buttons contain raw emojis (such as 📄, 🖨️, 💰, 📦, ✂️, ⚠️).  
Using emojis makes the enterprise interface look informal and causes inconsistent rendering across operating systems (macOS vs. Windows vs. Linux) and irregular line heights in Lao/Thai typography.  
The objective is to completely remove raw emojis from these screens and replace them with standard, clean SVG icons (such as Lucide React or Phosphor icons already present in the codebase) to maintain a modern, professional ERP aesthetic.

## **3\. Scope of Work (Tasks to Complete)**

1. Audit and locate all occurrences of raw emojis in text labels, button labels, card headers, and badges across the Quotation and Pricing UI.  
2. Replace each emoji with the appropriate SVG icon component (e.g. Lucide-react: *FileText*, *Printer*, *Coins*, *Package*, *Scissors*, *AlertTriangle*, *CheckCircle2*):  
   1. Style them with consistent sizing (e.g., *w-4 h-4* or *w-5 h-5*) and muted/harmonious colors matching Tailwind design tokens (e.g., *text-slate-500*, *text-emerald-600*, *text-amber-500*).  
   2. Ensure proper vertical alignment with text (using *inline-flex items-center gap-1.5* or *gap-2*).  
3. Maintain clean typography and ensure no residual emojis remain in the target views.

## **4\. STRICT CONSTRAINTS (สิ่งที่ห้ามทำเด็ดขาด)**

* **DO NOT MODIFY ANY PRICING OR CALCULATION LOGIC:**  
* Under NO circumstances should any formulas, multipliers, calculations, or financial states be altered. This task is purely visual / presentation layer.  
* **DO NOT ALTER COMPONENT PROPS OR STATE HANDLERS:**  
* Do not change event handler signatures, state management hooks, or navigation logic. Only update the JSX markup where emojis are rendered.  
* **DO NOT BREAK EXISTING LAYOUTS:**  
* Ensure button widths, table padding, and responsive grid layouts remain pixel-aligned without unintended wrapping.

## **5\. Specific Target Files to Inspect & Modify**

* admin-system/frontend/src/features/pricing/components/QuotationManager.tsx  
* admin-system/frontend/src/features/pricing/components/QuotationCostSummarySidebar.tsx  
* admin-system/frontend/src/features/pricing/components/PriceBreakdownTable.tsx  
* admin-system/frontend/src/features/pricing/components/QuotationCustomerView.tsx  
* admin-system/frontend/src/features/orders/components/CreateOrderPage.tsx  
* customer-service/src/components/customer/PriceSummaryCard.tsx

## **6\. Definition of Done (DoD)**

* All raw emojis are eliminated from the specified components.  
* Standardized SVG icons are cleanly rendered in their place with proper sizing and alignment.  
* Zero functional regression in pricing calculations or user interactions.