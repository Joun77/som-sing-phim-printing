# Task 09 (Phase 3): Advanced Order Search & Multi-Criteria Filtering

## 1. AI Role & Mission
* **Role:** Senior Frontend Engineer & UI/UX Specialist
* **Mission:** ພັດທະນາລະບົບຄົ້ນຫາ ແລະ ຕົວກັ່ນຕອງອໍເດີຂັ້ນສູງ (Advanced Multi-Criteria Filtering) ສຳລັບຕາຕະລາງອໍເດີຫຼັກ (`OrdersTable` / `CustomerOrders`) ຮອງຮັບການກັ່ນຕອງຕາມຊ່ວງວັນທີ, ສະຖານະການເງິນ, ບໍລິສັດຂົນສົ່ງ, ແລະ ຍອດເງິນ.

---

## 2. ขอบเขตงานโดยละเอียด (Detailed Scope of Work)

### 1. ລະບົບຄົ້ນຫາອັດສະລິຍະ (Smart Instant Search):
* ຄົ້ນຫາແບບ Real-time ຕາມ:
  * Order ID (ເຊັ່ນ: `SSP-2026-001`, `001`)
  * ຊື່ລູກຄ້າ ຫຼື ຊື່ບໍລິສັດ
  * ເບີໂທລະສັບ (Phone Number)
  * ເລກຕິດຕາມພັດສະດຸ (Tracking Number)
  * ຊື່ລາຍການສິນຄ້າ / Job Name

### 2. ຕົວກັ່ນຕອງຕາມຊ່ວງວັນທີ (Date Range Presets & Custom Date):
* **Presets:**
  * ມື້ນີ້ (Today)
  * ອາທິດນີ້ (This Week)
  * ເດືອນນີ້ (This Month)
  * ທັງໝົດ (All Time)
  * ກຳນົດຊ່ວງວັນທີເອງ (Custom Date Range Picker: From Date ➔ To Date)

### 3. ຕົວກັ່ນຕອງຕາມສະຖານະການເງິນ & ຂົນສົ່ງ:
* **ສະຖານະການເງິນ (Payment Filter):**
  * ທັງໝົດ (All) | ຍັງບໍ່ຈ່າຍ (Unpaid) | ມັດຈຳ (Deposit) | ຈ່າຍຄົບ 100% (Paid)
* **ວິທີການຈັດສົ່ງ (Logistics Filter):**
  * ທັງໝົດ (All) | ຮັບເອງທີ່ຮ້ານ (Pickup) | Anousith Express | HAL Logistics | Menglong

### 4. Summary Metric Cards Sync:
* ປັບປຸງຕົວເລກສະຫຼຸບຍອດເທິງຫົວຕາຕະລາງ (Pending, In Production, Ready, Completed, Total Revenue) ໃຫ້ປ່ຽນແປງຕາມຜົນການກັ່ນຕອງແບບ Real-time.

---

## 3. ໄຟລ໌ເປົ້າໝາຍ (Target Files)
* [MODIFY] `admin-system/frontend/src/features/orders/components/CustomerOrders.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/OrdersTable.tsx`

---

## 4. ເກນການກວດຮັບງານ (Acceptance Criteria)
- [x] ສາມາດຄົ້ນຫາອໍເດີຕາມ Order ID, ຊື່, ເບີໂທ, Tracking No ໄດ້ຢ່າງວ່ອງໄວ
- [x] ຕົວກັ່ນຕອງຊ່ວງວັນທີ (Today, This Week, This Month, Custom) ເຮັດວຽກໄດ້ຖືກຕ້ອງ
- [x] ຕົວກັ່ນຕອງສະຖານະການເງິນ ແລະ ຂົນສົ່ງ ສະແດງຜົນຖືກຕ້ອງ
- [x] `npm run build` ຜ່ານ 100%
