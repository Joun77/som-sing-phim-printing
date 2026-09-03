# **TASK PROMPT: PHASE 1 \- Artwork File Persistence & Quotation-to-Order Handoff**

## **1\. Role & Persona**

You are a Senior Full-Stack Engineer specializing in React (TypeScript) and Go (Golang) microservices and APIs for printing and ERP manufacturing systems. You write modular, clean, and robust production-grade code.

## **2\. Context & Problem Statement**

In Som Sing Phim's web-based print management system, users can upload artwork files (PDF, AI, PNG, etc.) in the Quotation / Price Check stage.  
However, when the user clicks "สร้างออเดอร์จากใบเสนอราคา" (Create Order from Quotation), the uploaded artwork file is dropped or lost during state transition or API creation. Consequently, when viewing the newly created order in the Order Details view, no artwork file is displayed.  
Because this file contains the customer's actual print-ready artwork, it is vital to business operations that the file reference and metadata persist seamlessly into the created order.

## **3\. Scope of Work (Tasks to Complete)**

1. Quotation State Handoff:  
   1. Verify where the uploaded artwork file/URL is stored in the Quotation page.  
   2. When converting a Quotation into an Order, ensure that the file payload (including artwork\_url, artwork\_file\_name, artwork\_file\_size, mime\_type, and any preflight check results) is bundled into the Order creation data structure.  
   3. If using React Router navigate(), ensure serializable URLs/paths are passed (not raw in-memory File objects which get stripped by history serialization).  
2. Order API & Backend Persistence (Go):  
   1. In admin-system/backend/orders/handlers.go and models.go, ensure the CreateOrder request struct and SQL/ORM insert logic correctly accept and save artwork\_url, artwork\_file\_name, and file metadata to the orders or order\_items table.  
3. Order Details Rendering:  
   1. In admin-system/frontend/src/features/orders/components/OrderDetailsPage.tsx and ArtworkPrepressCard.tsx, ensure the component checks for the attached artwork file and renders:  
      1. The original file name and formatted file size.  
      2. A download button / link to open the file.  
      3. A preview thumbnail or link for the prepress operator.

## **4\. STRICT CONSTRAINTS (สิ่งที่ห้ามทำเด็ดขาด)**

* DO NOT MODIFY ANY PRICING OR CALCULATION LOGIC: The formulas for paper cost, ink cost, print pass costs, duplex / 2-sided sheet counts, imposition layout, machine speeds, finishing costs, and markup percentages are already verified and correct. DO NOT alter, refactor, or touch these calculation formulas.  
* DO NOT BREAK OTHER ORDER FLOWS: Manual order creation (without a quotation) must still work normally without requiring an artwork file.  
* SCOPE BOUNDARY: Focus strictly on the persistence and rendering of artwork files between Quotation and Order.

## **5\. Specific Target Files to Inspect & Modify**

* admin-system/frontend/src/features/pricing/components/QuotationManager.tsx  
* admin-system/frontend/src/features/orders/components/CreateOrderPage.tsx  
* admin-system/frontend/src/features/orders/components/OrderDetailsPage.tsx  
* admin-system/frontend/src/features/orders/components/reception/ArtworkPrepressCard.tsx  
* admin-system/frontend/src/features/orders/api/orderApi.ts  
* admin-system/backend/orders/handlers.go  
* admin-system/backend/orders/models.go

## **6\. Definition of Done (DoD)**

* Uploading a file in Quotation \-\> Clicking "สร้างออเดอร์จากใบเสนอราคา" \-\> Opening the Order Details page shows the uploaded file clearly with working view/download functionality.