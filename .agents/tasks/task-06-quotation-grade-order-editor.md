# Task 06: Quotation-Grade Order Editing & Deep Pricing Specs Integration

## 1. AI Role & Mission
* **Role:** Senior Full-Stack Printing Engineer & Pricing Architect
* **Mission:** ຍົກລະດັບ Modal ການແກ້ໄຂອໍເດີ (`EditOrderModal.tsx`) ໃຫ້ມີຄວາມສາມາດ, UI, ແລະ Pricing Engine ຄົບຖ້ວນທຽບເທົ່າກັບໜ້າໃບສະເໜີລາຄາ (`Quotation / Pricing Estimator`) 100% ໂດຍດຶງ `ItemSpecConfigurator` ມາໃຊ້ງານ ພ້ອມແຖບ Live Cost Summary Bar ແລະ ໂມເດວປັບຄ່າແຮງຊ່າງ (Labor) & ກຳໄລ (Profit Margin %).

---

## 2. ຂອບເຂດງານໂດຍລະອຽດ (Detailed Scope of Work)

### 1. ຕິດຕັ້ງ `ItemSpecConfigurator` ເຂົ້າສູ່ `EditOrderModal.tsx`:
* ໃນ **Step 2 (ລາຍການສິນຄ້າ & ສະເປກ):** 
  * ສະແດງລາຍການ Job ທັງໝົດໃນອໍເດີ ພ້ອມປຸ່ມເພີ່ມ Job ໃໝ່ ແລະ ສະຫຼັບ Job ທີ່ກຳລັງແກ້ໄຂ
  * ດຶງ Component `ItemSpecConfigurator` ມາຄວບຄຸມສະເປກລະອຽດຂອງ Job ນັ້ນໆ:
    1. **Paper / Substrate & Cut:** ເລືອກເຈ້ຍ, ຂະໜາດຕັດ (Cuts/Sheet), Spoilage %, ຈຳນວນແຜ່ນໃຫຍ່
    2. **Print Engine & Ink:** ເລືອກແທ່ນພິມ, CMYK vs Mono, Coverage %, ຄ່າເສື່ອມຈັກ
    3. **Post-Press Machinery:** ຕັດເຈຽນ, ພັບ, ປ້ຳເສັ້ນ, ເຄືອບ (Lamination), ເຂົ້າເລ່ມ (Wire-O, Saddle Stitch, Perfect Glue)
    4. **Finishing Materials:** ວັດສະດຸປະກອບເພີ່ມເຕີມ (ຂົດລວດ, ກາວຮ້ອນ, ຟອຍ, ຕາໄກ່, ຂາຕັ້ງປະຕິທິນ)

### 2. ແຖບ Live Cost & Profit Margin Bar (ແຖບສະຫຼຸບລາຄາ & ຕົ້ນທຶນ):
* ສະແດງແຖບສະຫຼຸບຕົ້ນທຶນແບບເວລາຈິງ (Real-time Cost Summary):
  * ຕົ້ນທຶນເຈ້ຍ (Paper Cost)
  * ຕົ້ນທຶນໝຶກ (Ink Cost)
  * ຄ່າເສື່ອມຈັກ & Overhead (Machine Depreciation & Electricity)
  * ຄ່າແປຮູບ & ວັດສະດຸປະກອບ (Finishing Cost)
  * ອັດຕາກຳໄລຂັ້ນຕົ້ນ (Profit Margin %) & ຄ່າແຮງຊ່າງ (Labor)
  * ລາຄາຂາຍຕໍ່ໜ່ວຍ (Unit Price) & ຍອດລວມ (LAK)

### 3. Preset Pricing Templates & Quick Specs:
* ຮອງຮັບການເລືອກ Preset Template ສຳເລັດຮູບ (ເຊັ່ນ ໂບຣຊົວ A4, ນາມບັດ, ສະຕິກເກີ, ປຶ້ມສັນຫ່ວງ, ປະຕິທິນ)
* ຊ່ວຍໃຫ້ແອດມິນປ່ຽນສະເປກໄດ້ຢ່າງວ່ອງໄວ ແລະ ຖືກຕ້ອງຕາມມາດຕະຖານໂຮງພິມ

### 4. ລະບົບປ້ອງກັນສະຕັອກ (In-Production Stock Guard):
* ຫາກອໍເດີຢູ່ໃນສະຖານະ `IN_PRODUCTION`, `COMPLETED` ຫຼື ຕັດສະຕັອກແລ້ວ (`stockDeducted === true`):
  * ລະບົບຈະ Lock ການປ່ຽນແປງສະເປກວັດຖຸດິບ (Disabled fields)
  * ສະແດງປ້າຍເຕືອນສີມ່ວງແຈ້ງເຕືອນແອດມິນຢ່າງຊັດເຈນ ເພື່ອປ້ອງກັນສະຕັອກຜິດພາດຕາມກົດ `admin-architecture-guard.md`

---

## 3. ໄຟລ໌ເປົ້າໝາຍທີ່ອະນຸຍາດໃຫ້ແກ້ໄຂ (Permitted Files)
* [MODIFY] `admin-system/frontend/src/features/orders/components/modals/EditOrderModal.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/ItemSpecConfigurator.tsx` (ຖ້າຕ້ອງການປັບ props/callbacks)
* [MODIFY] `admin-system/frontend/src/features/orders/components/CustomerOrders.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/OrderDetailsPage.tsx`

---

## 4. ເກນການກວດຮັບງານ (Acceptance Criteria & QA)
- [ ] ໂມດໍແກ້ໄຂອໍເດີ (`EditOrderModal`) ສາມາດເລືອກສະເປກ, ຕັດເຈ້ຍ, ເລືອກຈັກພິມ, ເຂົ້າເລ່ມ, ແລະ ເຄືອບຜິວ ໄດ້ຄືກັບໜ້າໃບສະເໜີລາຄາ
- [ ] ມີແຖບ Live Cost Summary Bar ສະແດງຕົ້ນທຶນແຕ່ລະສ່ວນ ແລະ ກຳໄລຢ່າງຖືກຕ້ອງ
- [ ] ສາມາດກຳນົດຄ່າຊ່າງ (Labor), Margin %, ສ່ວນຫຼຸດ (Discount) ໄດ້
- [ ] ສາມາດບັນທຶກອໍເດີ ແລະ ອັບເດດຍອດເງິນໃໝ່ໄດ້ຢ່າງຖືກຕ້ອງ
- [ ] `npm run build` ຜ່ານ 100% ໂດຍບໍ່ມີ Error
