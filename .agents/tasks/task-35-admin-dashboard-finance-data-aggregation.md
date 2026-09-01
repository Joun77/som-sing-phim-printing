# Task 35: Admin Dashboard & Finance Real-Data Aggregation

## Mission & Context

Replace all mock datasets, static calculation placeholders, and hardcoded figures in Admin ERP Dashboard and Finance pages with real-time aggregated PostgreSQL queries in Go backend.

---

## Target Layer & Affected Files

- **Backend Analytics & Finance**:  
  - `admin-system/backend/dashboard/stats.go` (new)  
  - `admin-system/backend/finance/pl.go`, `admin-system/backend/finance/invoices.go`  
  - `admin-system/backend/main.go`  
- **Frontend Dashboard & Finance**:  
  - `admin-system/frontend/src/features/dashboard/DashboardOverview.tsx`, `ProfitChart.tsx`, `SpoilageTimelineChart.tsx`  
  - `admin-system/frontend/src/features/finance/FinanceDashboard.tsx`, `PLReportPage.tsx`, `APManagementPage.tsx`, `ARManagementPage.tsx`

---

## Technical Specifications & Requirements

### 1\. Dashboard KPI Aggregation Endpoint

- Endpoint: `GET /api/dashboard/stats?period=month|quarter|year`  
- Calculations in PostgreSQL:  
  - `Total Revenue`: Sum of `total_price` of delivered/completed orders within timeframe.  
  - `Total Material Cost`: Sum of `stock_movements.quantity * stock_movements.unit_cost` for production deductions.  
  - `Total Machine & Overhead Cost`: Sum of estimated click/depreciation costs on completed orders.  
  - `Net Profit Margin %`: `((Total Revenue - Total Costs) / Total Revenue) * 100`.  
  - `Active Production Jobs`: Count of orders in `IN_PRODUCTION` or `POST_PRESS`.  
  - `Spoilage Rate %`: Total wasted paper sheets / Total imported/consumed sheets.

### 2\. Time-Series Trend Charts

- Endpoint: `GET /api/dashboard/revenue-trend?range=30d`  
  - Returns daily breakdown of Revenue vs Costs for Recharts rendering in `ProfitChart.tsx`.  
- Endpoint: `GET /api/dashboard/spoilage-trend?range=30d`  
  - Returns daily spoilage sheet counts grouped by root cause (Plate error, Operator mistake, Machine jam, Paper flaw).

### 3\. P\&L and Financial Accounting Ledger

- In `PLReportPage.tsx`:  
  - Connect to `GET /api/finance/pl-report?start_date=...&end_date=...`  
  - Group income by product category (Packaging, Books, Commercial Print, Signage).  
  - Group expenses into Cost of Goods Sold (COGS: Paper, Inks, Plates, Consumables) and Operating Expenses (OPEX: Electricity, Rent, Maintenance, Salaries).

---

## Verification & Acceptance Criteria

- [ ] Dashboard KPI cards show live calculations matching the actual database records.  
- [ ] Creating and completing a new order immediately updates Total Revenue and Gross Profit charts.  
- [ ] Logging a spoilage incident in ShopFloorTracker reflects in the Spoilage Timeline chart without data discrepancy.

