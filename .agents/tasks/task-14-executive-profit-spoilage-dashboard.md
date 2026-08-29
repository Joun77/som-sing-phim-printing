# Task 14: Executive Profit & Spoilage Dashboard (ແດຊບອດກຳໄລ-ຕົ້ນທຶນ-ຂອງເສຍ ສຳລັບເຈົ້າຂອງຮ້ານ)

## 1. AI Role & Mission
* **Role:** Senior Data Visualization Engineer & Print ERP Financial Analyst
* **Mission:** ພັດທະນາໜ້າ Dashboard ລາຍລະອຽດສູງ ສຳລັບ OWNER/SUPER_ADMIN ເທົ່ານັ້ນ ທີ່ສະແດງ: ກຳໄລສຸດທິ ທຽບຕົ້ນທຶນວັດຖຸດິບ, ການແຈກແຈງລາຍໄດ້ຕາມສິນຄ້າ, ແລະ ການວິເຄາະຂອງເສຍ (Spoilage Rate %) — ທຸກ Section Drill-Down ໄດ້.

---

## 2. ຂອບເຂດງານໂດຍລະອຽດ (Detailed Scope)

### Phase A — Profit vs Cost KPI Cards (ຂະຫຍາຍຈາກ DashboardOverview.tsx)
* **ເພີ່ມ 4 KPI Cards ໃໝ່** ລຸ່ມ Cards ປະຈຸບັນ:
  * `ຕົ້ນທຶນເຈ້ຍລວມ (Total Paper Cost LAK)` — ດຶງຈາກ Stock Deduction Logs
  * `ຕົ້ນທຶນໝຶກລວມ (Total Ink Cost LAK)` — ດຶງຈາກ Ink Deduction Logs
  * `Gross Profit Margin %` — `((Revenue - PaperCost - InkCost) / Revenue) × 100`
  * `Spoilage Cost Impact LAK` — Sum `costImpact` ຈາກ `spoilageLogs`

### Phase B — Revenue by Product Category Chart
* **Bar/Donut Chart:** ສະແດງ Revenue ແຍກຕາມປະເພດສິນຄ້າ (ປຶ້ມ, ສະຕິກເກີ, ໂປສເຕີ, ນາມບັດ, ປະຕິທິນ)
* **Filter:** `[ມື້ນີ້]` / `[ອາທິດນີ້]` / `[ເດືອນນີ້]` / `[ເລືອກໄລຍະ]`
* **Library:** ໃຊ້ `recharts` (ມີໃນ project ແລ້ວ ຫຼື install)

### Phase C — Spoilage Rate Timeline
* **Line Chart:** Spoilage Qty (ແຜ່ນ) ແລະ `costImpact (LAK)` ຕາມ 30 ວັນ ຫຼ້າສຸດ
* **Grouped by Reason:** ສ້ອຍ, ຕົ້ນ/ທ້າຍ Job, ຕັດຜິດ, ພິມຜິດ
* **Table Drill-down:** ກົດ Bar ໃດໜຶ່ງ → Modal ສະແດງ Spoilage Logs ວັນນັ້ນ

### Phase D — "ຮ້ານຄ້າສິນຄ້າຂາຍດີ" Top Products Table
* ຕາຕະລາງ Top 5 ສິນຄ້າ ທີ່ສ້າງ Revenue ສູງທີ່ສຸດ ປະຈຳເດືອນ

---

## 3. ໄຟລ໌ເປົ້າໝາຍ (Target Files)

### Phase A
* [MODIFY] `admin-system/frontend/src/features/dashboard/components/DashboardOverview.tsx`
* [MODIFY] `admin-system/frontend/src/context/AppContext.tsx` — expose `paperCostTotal`, `inkCostTotal` ເຂົ້າ `getDashboardStats()`

### Phase B & C
* [NEW] `admin-system/frontend/src/features/dashboard/components/ProfitChart.tsx`
* [NEW] `admin-system/frontend/src/features/dashboard/components/SpoilageTimelineChart.tsx`
* [MODIFY] `admin-system/frontend/src/features/dashboard/components/DashboardOverview.tsx`

### Phase D
* [NEW] `admin-system/frontend/src/features/dashboard/components/TopProductsTable.tsx`

---

## 4. ເງື່ອນໄຂ Access Control
* **ເຫັນ Dashboard ນີ້ໄດ້ສະເພາະ:** Role = `OWNER` ຫຼື `SUPER_ADMIN` (ໃຊ້ `AppContext.currentUser.role`)
* ຖ້າ Role ອື່ນ → redirect ຫຼື ສະແດງ placeholder "`ບໍ່ມີສິດເຂົ້າເຖິງ`"

---

## 5. ເກນການກວດຮັບງານ (Acceptance Criteria)
- [x] KPI Cards ສະແດງ `paperCost`, `inkCost`, `Gross Margin %`, `Spoilage Cost`
- [x] Revenue by Product Chart ສະແດງ ແລະ Filter ຕາມໄລຍະໄດ້
- [x] Spoilage Timeline Chart ສະແດງ 30 ວັນ ຫຼ້າສຸດ
- [x] Drill-down Modal ຈາກ Spoilage Chart ເຮັດວຽກ
- [x] Top Products Table ສະແດງ Top 5 ສິນຄ້າ
- [x] Access Control ສຳລັບ OWNER/SUPER_ADMIN ເທົ່ານັ້ນ
- [x] `npm run build` ຜ່ານ 100%
