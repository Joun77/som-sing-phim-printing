# Task 15: Technician Piece-Rate & Incentive Tracking System (ລະບົບຄ່າແຮງງານຕາມຜົນງານ)

## 1. AI Role & Mission
* **Role:** Senior HR Engineering Specialist & Payroll Automation Architect
* **Mission:** ຕໍ່ເຊື່ອມ Dynamic Workflow (Task 11) ກັບ HR Module ເພື່ອຄຳນວນ ຄ່າແຮງງານ/ຄອມມິດຊັ່ນ ຕາມຜົນງານຊ່າງ (Piece-Rate) ອັດຕະໂນມັດ ເມື່ອກົດ `[✓ ສຳເລັດ]` ແຕ່ລະຂັ້ນຕອນ, ພ້ອມ Dashboard ສະຫຼຸບຍອດເງິນພິເສດປະຈຳເດືອນ.

> **ໝາຍເຫດ:** `pieceRatePerImpression`, `impressionsProduced`, `salesCommissionRate` **ມີຢູ່ໃນ `Employee` type ແລ້ວ** — Task ນີ້ wire Logic + UI.

---

## 2. ຂອບເຂດງານໂດຍລະອຽດ (Detailed Scope)

### Phase A — Auto-Calculate Piece-Rate ເມື່ອ Workflow Step Complete
* **Trigger:** ເມື່ອຊ່າງກົດ `[✓ ສຳເລັດ]` ໃນ `ProductionProcessFlowCard.tsx`
* **Calculation:**
  ```
  earnedAmount = assignedEmployee.pieceRatePerImpression × order.totalImpressions
  ```
  * `totalImpressions = totalPages × totalCopies` (ດຶງຈາກ Order Job specs)
* **Record:** ບັນທຶກ `EarningRecord { employeeId, orderId, stepId, stepName, earnedAmount, recordedAt }` ເຂົ້າ AppContext (Persist ໃນ localStorage / future DB)

### Phase B — Technician Earnings Summary Panel (ໃນ HR Module)
* **ໃນໜ້າ HR → Employee Profile:** ເພີ່ມ Section `ຍອດລາຍຮັບພິເສດ (Piece-Rate Earnings)`
  * ຕາຕະລາງ: ວັນທີ, ອໍເດີ, ຂັ້ນຕອນ, ຈຳນວນ Impression, ຍອດເງິນ LAK
  * ສະຫຼຸບຍອດ **ປະຈຳເດືອນ** ດ້ວຍ Badge ສີຂຽວ
* **ໃນ Dashboard HR Overview:** Top Earners Leaderboard — 5 ຊ່າງທີ່ Earn ສູງສຸດເດືອນນີ້

### Phase C — Rate Configuration Panel (ໃນ Employee Edit Modal)
* ສ້ອຍ/ເພີ່ມ Field:
  * `ອັດຕາຄ່າແຮງງານຕໍ່ 1,000 Impressions (LAK)` → `pieceRatePerImpression`
  * `ອັດຕາຄອມມິດຊັ່ນຍອດຂາຍ (%)` → `salesCommissionRate`
* ມີ Preview: "`ຖ້າງານ 5,000 Impressions → ໄດ້ 25,000 LAK ພິເສດ`"

---

## 3. ໄຟລ໌ເປົ້າໝາຍ (Target Files)

### Phase A
* [MODIFY] `admin-system/frontend/src/features/orders/components/production/ProductionProcessFlowCard.tsx`
* [MODIFY] `admin-system/frontend/src/context/AppContext.tsx` — ເພີ່ມ `earningRecords[]` + `addEarningRecord()`

### Phase B
* [MODIFY] `admin-system/frontend/src/features/hr/components/` — Employee Profile + HR Overview

### Phase C
* [MODIFY] Employee Edit Modal (ໃນ HR feature)

---

## 4. ເງື່ອນໄຂທາງທຸລະກິດ (Business Rules)
* ຖ້າ Employee ບໍ່ມີ `pieceRatePerImpression` (= 0 ຫຼື undefined) → ບໍ່ຄຳນວນ ແລະ ບໍ່ record (Skip)
* Piece-Rate ຖືກ record ສຳລັບ **ຜູ້ທີ່ mark step Complete ເທົ່ານັ້ນ** (assignedStaffId)
* ຍອດ Piece-Rate ປະຈຳເດືອນ reset ທຸກວັນທີ 1 ຂອງເດືອນ

---

## 5. ເກນການກວດຮັບງານ (Acceptance Criteria)
- [x] ເມື່ອ mark step complete → `EarningRecord` ຖືກ record ອັດຕະໂນມັດ (ຖ້າ `pieceRate > 0`)
- [x] ໜ້າ Employee Profile ສະແດງ Piece-Rate Earnings ຕາຕະລາງ + ຍອດເດືອນ
- [x] Top Earners Leaderboard ສະແດງ 5 ອັນດັບ
- [x] Rate Configuration ສ້ອຍ/ແກ້ໄຂ `pieceRatePerImpression` ໃນ Employee Edit ໄດ້
- [x] Preview ການຄຳນວນ Piece-Rate ກ່ອນ Save
- [x] `npm run build` ຜ່ານ 100%
