---
trigger: manual
---

Master Development Prompt for Gemini CLI

Project: Som-Sing Phim Printing System (ระบบส้มสิงห์การพิมพ์)

Instructions for Gemini CLI:
You are acting as a Senior Full-Stack React & Print-Industry Software Engineer. Your task is to implement and expand the features of the Som-Sing Phim Printing application based on the detailed module-by-module specification below. Follow clean code practices, preserve existing design tokens (Tailwind CSS), keep multi-language support (i18n TH/LO), and handle data states gracefully in React Context (src/context/AppContext.jsx) and local component states.

System Architecture & Key Rules

Flexible Tax Management System (Mandatory Rule):

Tax calculation MUST be optional (Toggle Switch: ON/OFF).

Allow custom tax percentage input (e.g. 0%, 5%, 7%, 10%).

Allow manual override / clear tax option (user can clear or manually type fixed tax amount).

When tax is OFF or cleared to 0, Grand Total = Subtotal without adding tax.

Multi-Currency Support:

Support dynamic currency selection and formatting (THB - ฿, LAK - ₭, USD - $).

Data State & Reactivity:

Update src/context/AppContext.jsx to store persistent states across modules (Orders, Quotations, Materials, Equipment, Employees, Customers, Inbound Records).

Detailed Module Implementation Instructions

1. Dashboard Overview (src/components/DashboardOverview.jsx)

Real-time Production Monitor: Add machine status widget showing Running, Setup, Downtime, and Maintenance counters.

Urgent & Bottleneck Alerts: Display critical SLA orders approaching delivery dates and low-stock material warnings (Reorder Point alerts).

OEE & Wastage Indicators: Add visual cards for Overall Equipment Effectiveness (%) and Waste Percentage calculation.

2. Order Management System (src/components/orders/*)

Files involved: CreateOrderPage.jsx, CustomerOrders.jsx, ItemSpecConfigurator.jsx, OrderDetailsPage.jsx, OrdersTable.jsx, OrderRow.jsx, Lightbox.jsx.

Artwork & Digital Proofing: Add digital proof versioning UI (v1, v2) with customer approval status (Pending, Approved, Revision Requested) and comment pins.

Job Ticket Generator: Add a printable Job Ticket modal/PDF view containing print specs, paper type, GSM, color process (CMYK/Pantone), finishing steps, and a generated QR/Barcode for machine operator scanning.

Auto Stock Reservation: When an order status updates to "In Production", reserve matching paper and ink quantities from InventoryManagement.

Imposition / Layout Preview Helper: Implement an imposition calculator showing sheet utilization and yield count per full sheet ($A4/A5$ layouts on $25 \times 36$ inches paper).

3. Quotation Manager (src/components/QuotationManager.jsx)

Dynamic Pricing Engine: Implement automated print estimation formula:


$$\text{Total Price} = \text{Paper Cost} + \text{Ink/Plate Cost} + \text{Impression Cost} + \text{Finishing Cost} + \text{Margin}$$

Optional Tax Calculation: Implement the flexible Tax Toggle (ON/OFF), custom % tax rate input, manual override/clear tax amount field.

Quotation Versioning & Expiry: Add revision history tracking and quotation expiry date picker.

1-Click Conversion to Order: Add "Convert to Order" button on accepted quotations that populates order data and generates a Production Job Ticket.

4. Inventory & Offcut Management (src/components/inventory/*)

Files involved: InventoryManagement.jsx, InventoryTable.jsx, MaterialDetailsPage.jsx, OffcutModal.jsx, AddMaterialModal.jsx, EditMaterialModal.jsx, forms/*.

Offcut Matching Engine: When configuring small dimension orders in ItemSpecConfigurator, scan and suggest matching available offcuts (OffcutModal) to minimize full sheet usage.

Batch & Color Lot Tracking: Add Lot/Batch number attributes to paper and ink stocks to track color batch consistency.

Automated Stock Deduction: Deduct physical stock upon job completion scan.

Reorder Point (ROP) Prompt: Highlight items below threshold with a button to auto-generate Purchase Requisitions (PR).

5. Equipment Management (src/components/equipment/*)

Files involved: EquipmentManagement.jsx, EquipmentDetailsPage.jsx, EquipmentTable.jsx, AddEquipmentModal.jsx.

Production Gantt Chart: Implement a visual job scheduling timeline widget showing queue load per machine.

Preventive Maintenance (PM): Track impression counters and alert when maintenance is due for rollers, blades, or heads.

Downtime Log: Add downtime recording form (Reason: Maintenance, No Material, Setup Time, Breakdown).

6. Customer Management (src/components/customers/*)

Credit Limit & Terms: Add credit limit enforcement that flags orders if customer balance exceeds credit limit.

Customer Tier Pricing: Support VIP, Regular, and Walk-in price tiers.

Artwork Archive: Add a per-customer historical artwork repository for easy re-ordering.

7. Inbound Management (src/components/inbound/*)

Files involved: InboundManagement.jsx, sampleInboundData.js.

PO vs GRN Matching: Add comparison interface between Purchase Orders (PO) and Goods Receipt Notes (GRN).

Barcode / QR Scanner UI: Add camera/input scanner simulation for receiving paper pallets and supplies.

8. Employee / HR Management (src/components/hr/*)

Shift & Machine Assignment: Add UI for assigning operators to specific machinery and shifts.

Production Incentive Tracker: Calculate commission for sales and piece-rate production bonuses for print operators based on output impressions.

9. History & Analytics (src/components/HistoryAnalytics.jsx)

Job Profitability Analysis: Compare Estimated Cost vs. Actual Production Cost per completed order to report net margin.

Defect & Waste Report: Render defect breakdown charts grouped by department and machine.

10. System Infrastructure & Logistics

Role-Based Access Control (RBAC): Add role selector simulation (Admin, Sales, Press Operator, Inventory Manager, Accountant) to conditionally render action buttons.

Logistics & Delivery: Add delivery dispatcher modal with tracking numbers, courier options, and Proof of Delivery (POD) photo/signature upload interface.

Execution Task

Review the source code files in src/, apply the required state management changes in AppContext.jsx, and systematically implement or upgrade the UI components listed above. Ensure all React hooks, prop-types, and Tailwind styles render correctly without syntax errors or broken imports.