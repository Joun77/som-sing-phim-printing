# Task 10 (Phase 4): Batch Order Actions & Report Export

## 1. AI Role & Mission
* **Role:** Senior Full-Stack Engineer & Automation Architect
* **Mission:** ພັດທະນາລະບົບຈັດການອໍເດີພ້ອມກັນຫຼາຍລາຍການ (Batch / Bulk Actions) ສຳລັບແອດມິນ ເຊັ່ນ ການພິມໃບປະໜ້າພັດສະດຸພ້ອມກັນຫຼາຍອໍເດີ (Bulk Print Shipping Labels), ການປ່ຽນສະຖານະພ້ອມກັນ, ແລະ ການສົ່ງອອກລາຍງານຍອດຂາຍເປັນ Excel / CSV.

---

## 2. ขอบเขตงานโดยละเอียด (Detailed Scope of Work)

### 1. ລະບົບ Multi-Select Checkboxes ໃນຕາຕະລາງ:
* ເພີ່ມ Checkbox ເລືອກທຸກລາຍການ (Select All) ຫຼື ເລືອກສະເພາະອໍເດີທີ່ຕ້ອງການໃນ `OrdersTable`
* ສະແດງແຖບ Floating Bulk Action Bar ເມື່ອມີການເລືອກອໍເດີ 1 ລາຍການຂຶ້ນໄປ

### 2. Batch Operations (ການດຳເນີນການແບບກຸ່ມ):
* **ພິມໃບປະໜ້າພັດສະດຸພ້ອມກັນ (Bulk Print Shipping Labels):**
  * ລວມໃບປະໜ້າຂອງທຸກອໍເດີທີ່ເລືອກເຂົ້າສູ່ໜ້າພິມ A4 / Sticker Label ຊຸດດຽວ
* **ປ່ຽນສະຖານະພ້ອມກັນ (Batch Status Update):**
  * ປ່ຽນເປັນ `Dispatched` (ມອບໃຫ້ຂົນສົ່ງແລ້ວ) ຫຼື `Completed` (ສຳເລັດ) ພ້ອມກັນຫຼາຍອໍເດີ
* **Export to Excel / CSV:**
  * ສົ່ງອອກລາຍການອໍເດີທີ່ເລືອກ ພ້ອມລາຍລະອຽດຍອດເງິນ, ລາຍການສິນຄ້າ, ຊື່ລູກຄ້າ, ແລະ ເບີໂທ

---

## 3. ໄຟລ໌ເປົ້າໝາຍ (Target Files)
* [MODIFY] `admin-system/frontend/src/features/orders/components/OrdersTable.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/CustomerOrders.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/modals/ShippingLabelModal.tsx`

---

## 4. ເກນການກວດຮັບງານ (Acceptance Criteria)
- [x] ສາມາດ Checkbox ເລືອກຫຼາຍອໍເດີພ້ອມກັນໄດ້
- [x] ສາມາດພິມໃບປະໜ້າພັດສະດຸຫຼາຍອໍເດີພ້ອມກັນໄດ້ຢ່າງຖືກຕ້ອງ
- [x] ສາມາດ Export ຂໍ້ມູນເປັນ Excel/CSV ໄດ້
- [x] `npm run build` ຜ່ານ 100%
