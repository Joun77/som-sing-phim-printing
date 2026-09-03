# **TASK PROMPT: PHASE 3 \- Cost Breakdown Multi-Colored Bar Normalization**

## **1\. Role & Persona**

You are a Senior Frontend Engineer specializing in React, TypeScript, and Data Visualization / Component Engineering. You have deep expertise in building accurate financial charts and progress bars.

## **2\. Context & Problem Statement**

In the Quotation summary sidebar and customer pricing cards of Som Sing Phim, there is a multi-colored cost breakdown bar (representing paper cost, print/ink cost, finishing cost, and profit margin in different colors, e.g., blue, amber, purple, green).  
Currently, the breakdown bar appears visually abnormal: the green segment (profit margin) does not extend to the full width of the container, leaving an awkward empty gray background gap at the right end.  
This visual defect occurs because the percentage widths of the individual segments are calculated against an inconsistent denominator (e.g. dividing by final price while omitting VAT/discounts, or mixing markup percentage with margin percentage), causing the sum of segment widths to fall short of 100%.

## **3\. Scope of Work (Tasks to Complete)**

1. Inspect the cost breakdown bar component in *QuotationCostSummarySidebar.tsx* and *PriceSummaryCard.tsx*.  
2. Normalize the visual percentage widths of the segments so their total sum always equals exactly 100%:  
   1. Calculate the total sum of all rendered segments:  
   2. *const totalSegmentsValue \= paperCost \+ printCost \+ finishingCost \+ profitAmount;*  
   3. If *totalSegmentsValue \> 0*, compute each segment width proportionally:  
   4. *const paperPercent \= (paperCost / totalSegmentsValue) \* 100;*  
   5. *const printPercent \= (printCost / totalSegmentsValue) \* 100;*  
   6. *const finishingPercent \= (finishingCost / totalSegmentsValue) \* 100;*  
   7. For the final green segment (Profit Margin), assign the remaining percentage to absorb any floating-point rounding discrepancies:  
   8. *const profitPercent \= Math.max(0, 100 \- (paperPercent \+ printPercent \+ finishingPercent));*  
3. Ensure the progress bar container has *overflow-hidden* and *flex*, with smooth transitions (*transition-all duration-300*).  
4. Keep the tooltips or legend numbers showing the exact monetary values (e.g., in LAK / THB) accurately.

## **4\. STRICT CONSTRAINTS (สิ่งที่ห้ามทำเด็ดขาด)**

* **STRICTLY DO NOT TOUCH OR ALTER ANY BUSINESS PRICING / COST FORMULAS**: The underlying calculation engine that determines paper costs, ink consumption, machine rates, waste percentages, and final prices is 100% verified and correct. **ONLY modify the visual percentage calculation for the CSS bar widths (*style={{ width: ... }}*)**.  
* DO NOT change the numeric prices displayed in the text, breakdown table, or final summary.  
* DO NOT introduce external chart libraries (e.g., Recharts, Chart.js). Keep it lightweight with native Tailwind CSS flex bars.

## **5\. Specific Target Files to Inspect & Modify**

* admin-system/frontend/src/features/pricing/components/QuotationCostSummarySidebar.tsx  
* customer-service/src/components/customer/PriceSummaryCard.tsx  
* (Optional: inspect *admin-system/frontend/src/features/pricing/components/PriceBreakdownTable.tsx* if the bar component is shared or extracted as a subcomponent)

## **6\. Definition of Done (DoD)**

* The multi-colored breakdown bar seamlessly spans 100% of the container width with no empty gray gap at the right edge.  
* The green profit segment extends cleanly to the right border.  
* Hover tooltips or labels display the correct underlying financial amounts without any distortion.