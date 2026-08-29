# Task 07 (Phase 1): Direct Order Edit from OrderDetailsPage (Step 1-4 View)

## 1. AI Role & Mission
* **Role:** Senior Full-Stack Engineer & UX Architect
* **Mission:** ເຊື່ອມຕໍ່ປຸ່ມ `[ແກ້ໄຂອໍເດີ & ສະເປກ]` ໃຫ້ສາມາດເປີດ `EditOrderModal` ໄດ້ໂດຍກົງຈາກທຸກມຸມມອງຂອງ `OrderDetailsPage.tsx` (Step 1 Reception, Step 2 Production, Step 3 Delivery, Step 4 Summary) ແລະ ອັບເດດ State ທັນທີໂດຍບໍ່ຕ້ອງ Refresh ໜ້າຈໍ.

---

## 2. ຂອບເຂດງານໂດຍລະອຽດ (Detailed Scope of Work)

### 1. Header Integration ໃນ `OrderDetailsPage.tsx`:
* ເພີ່ມປຸ່ມ `[ແກ້ໄຂອໍເດີ (Edit Order)]` ໃນແຖບ Header ເທິງສຸດຂອງ `OrderDetailsPage` ໃຫ້ເດັ່ນຊັດ
* ເມື່ອກົດປຸ່ມ: ເປີດ `EditOrderModal` ພ້ອມສົ່ງຂໍ້ມູນອໍເດີປັດຈຸບັນ, `inventory`, ແລະ `equipment` ເຂົ້າໄປຢ່າງຄົບຖ້ວນ

### 2. Live State Synchronization:
* ເມື່ອແອດມິນບັນທຶກການແກ້ໄຂຈາກ `EditOrderModal`:
  * ອັບເດດຂໍ້ມູນ `selectedOrder` ໃນ `CustomerOrders.tsx` ແລະ `OrderDetailsPage.tsx` ທັນທີ
  * ຄິດໄລ່ຍອດເງິນ, ລາຍການ Job, ແລະ ສະຖານະໃໝ່ແບບ Real-time

### 3. Step 1-4 Sub-Pages Sync:
* ຮັບປະກັນວ່າການແກ້ໄຂສະເປກ ຫຼື ຂໍ້ມູນຈັດສົ່ງ ຈະສະທ້ອນທັນທີໃນ:
  * Step 1: `OrderReceptionPage` (ສະລິບ, ລິ້ງໄຟລ໌, ຂໍ້ມູນຈັດສົ່ງ)
  * Step 2: `ProductionTrackingPage` / `OrderProductionPage` (ລາຍການ Job, ເຈ້ຍ, ໝຶກ, ຂະໜາດຕັດ)
  * Step 3: `OrderDeliveryPage` (ຍອດເງິນທີ່ຕ້ອງຊຳລະ, ວິທີຈັດສົ່ງ, ເລກ Tracking)
  * Step 4: `OrderCompletedSummaryPage` (ຍອດລວມໃບບິນ ແລະ ລາຍການສັ່ງພິມ)

---

## 3. ໄຟລ໌ເປົ້າໝາຍ (Target Files)
* [MODIFY] `admin-system/frontend/src/features/orders/components/OrderDetailsPage.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/CustomerOrders.tsx`

---

## 4. ເກນການກວດຮັບງານ (Acceptance Criteria)
- [x] ສາມາດກົດປຸ່ມ `[ແກ້ໄຂອໍເດີ]` ຈາກໜ້າ `OrderDetailsPage` ໃນທຸກຂັ້ນຕອນ (Step 1-4)
- [x] ໂມດໍ `EditOrderModal` ເປີດຂຶ້ນມາພ້ອມຂໍ້ມູນສະເປກຄົບຖ້ວນ
- [x] ເມື່ອບັນທຶກແລ້ວ ໜ້າຈໍສະແດງຜົນປ່ຽນແປງທັນທີໂດຍບໍ່ຕ້ອງ Refresh
- [x] `npm run build` ຜ່ານ 100% ໂດຍບໍ່ມີ Error
