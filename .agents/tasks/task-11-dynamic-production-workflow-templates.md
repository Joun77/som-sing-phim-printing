# Task 11: Dynamic Production Workflow & Template Engine with Technician Role Assignment

## 1. AI Role & Mission
* **Role:** Senior Full-Stack Print ERP Architect & Pre-Press Specialist
* **Mission:** ພັດທະນາລະບົບກຳນົດຂະບວນການຜະລິດແບບໄດນາມິກ (Dynamic Workflow Engine) ພ້ອມຫ້ອງສະໝຸດ Template ມາດຕະຖານໂຮງພິມ, ລະບົບປັບແຕ່ງ/ເພີ່ມຂັ້ນຕອນສະເພາະງານ, ການມອບໝາຍຊ່າງຕາມສາຍງານ (Technician Search & Role Assignment ດຶງຈາກ HR), ແລະ ການ Sync ສະຖານະການຜະລິດແບບ Real-time.

---

## 2. ຂອບເຂດງານໂດຍລະອຽດ (Detailed Scope of Work)

### 1. ໂມດໍກຳນົດຂະບວນການຜະລິດ (`ConfigureWorkflowModal.tsx`):
* **Trigger:** ເມື່ອກວດສະລິບ ແລະ ຢືນຢັນໄຟລ໌ຜ່ານ ➔ ກົດປຸ່ມ `[ເລີ່ມຕົ້ນການຜະລິດ & ກຳນົດສາຍງານ]` ໃນ Step 1 (Reception)
* **Built-in Templates Library:**
  1. *ປຶ້ມເຂົ້າເລ່ມໄສກາວ / ສັນຫ່ວງ (Booklet & Catalog)*: ຕັດເຈ້ຍແຜ່ນໃຫຍ່ ➔ ພິມເນື້ອໃນ ➔ ພິມປົກ ➔ ເຄືອບປົກ ➔ ພັບຍົກ & ຮຽງໜ້າ ➔ ໄສກາວຮ້ອນ ➔ ຕັດ 3 ດ້ານ ➔ QC & ແພັກ
  2. *ສະຕິກເກີ / ສະຫຼາກສິນຄ້າໄດຄັດ (Stickers & Labels)*: ພິມສະຕິກເກີ ➔ ເຄືອບກັນນ້ຳ ➔ ຕັດໄດຄັດ Kiss-Cut ➔ ລອກເສດຂອບ ➔ QC & ແພັກ
  3. *ຮູບພາບ / ໂປສເຕີ / ໃບປິວ (Photo, Poster & Leaflet)*: ຕັດເຈ້ຍ ➔ ພິມລະອຽດສູງ ➔ ເຄືອບຟີມ ➔ ຕັດເຈຽນ ➔ QC
  4. *ປະຕິທິນຕັ້ງໂຕະ (Desk Calendar)*: ພິມໃບເດືອນ ➔ ຂຶ້ນໂຄງຈົ່ວ ➔ ເຈາະຮູ ➔ ໃສ່ສັນ Wire-O ➔ QC
  5. *ນາມບັດ / ກ່ອງບັນຈຸພັນ (Name Card & Packaging)*: ພິມ Art Card ➔ ເຄືອບ ➔ ປ້ຳໄດຄັດ & ເສັ້ນພັບ ➔ ຕິດກາວ ➔ QC
* **Customization & Persistence:**
  * ເພີ່ມຂັ້ນຕອນພິເສດ (Foil, Emboss, Spot UV, ແມັກມຸມ), ລຶບ, ຫຼື ຍ້າຍລຳດັບຂຶ້ນ-ລົງ (Reorder)
  * ປຸ່ມ `[ບັນທຶກເປັນ Template ໃໝ່]` ບັນທຶກໄວ້ດຶງໃຊ້ຊ້ຳໃນອໍເດີຕໍ່ໆໄປ

### 2. Searchable Technician & Staff Role Assignment (ດຶງຈາກແທັບ HR):
* ໃນແຕ່ລະຂັ້ນຕອນ ມີຊ່ອງຄົ້ນຫາ & ເລືອກຊ່າງຜູ້ຮັບຜິດຊອບ (Assigned Staff / Operator)
* ດຶງລາຍຊື່ຈາກ `employees` ໃນ `AppContext` ພ້ອມກັ່ນຕອງຕາມ Role / ທັກສະ
* ຮອງຮັບການພິມຊື່ຊ່າງໄວ ຫຼື ໃຊ້ Default Role ຖ້າ HR ຍັງບໍ່ທັນມີຂໍ້ມູນ

### 3. Production Execution & Stock Deduction:
* ເມື່ອກົດ `[ຢືນຢັນເລີ່ມຜະລິດ]`:
  * ບັນທຶກ `productionWorkflow = { templateName, steps: [{ id, name, category, assignedTo, status, completedAt }] }`
  * ຕັດສະຕັອກເຈ້ຍ-ໝຶກ (Stock Deduction Trigger) ➔ ສະຖານະປ່ຽນເປັນ `IN_PRODUCTION`

### 4. Interactive Step-by-Step Production Tracker (`ProductionProcessFlowCard.tsx`):
* ສະແດງ Checklist ຕາມຂັ້ນຕອນທີ່ກຳນົດໄວ້ຈິງ
* ຊ່າງກົດ `[✓ ສຳເລັດ]` ແຕ່ລະຂັ້ນຕອນ ພ້ອມບັນທຶກເວລາ ແລະ ຊື່ຊ່າງ
* ເມື່ອຄົບທຸກຂັ້ນຕອນ ➔ ສະຖານະປ່ຽນເປັນ `READY_FOR_PICKUP` (ພ້ອມຈັດສົ່ງ)

---

## 3. ໄຟລ໌ເປົ້າໝາຍ (Target Files)
* [NEW] `admin-system/frontend/src/features/orders/components/modals/ConfigureWorkflowModal.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/OrderReceptionPage.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/reception/ArtworkPrepressCard.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/production/ProductionProcessFlowCard.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/OrderDetailsPage.tsx`

---

## 4. ເກນການກວດຮັບງານ (Acceptance Criteria)
- [x] ໂມດໍ `ConfigureWorkflowModal` ເປີດຂຶ້ນມາເມື່ອກົດເລີ່ມຜະລິດ
- [x] ສາມາດເລືອກ Template ສຳເລັດຮູບ ແລະ ປັບແຕ່ງ/ເພີ່ມຂັ້ນຕອນໄດ້
- [x] ສາມາດຄົ້ນຫາ ແລະ ມອບໝາຍຊ່າງຈາກລາຍຊື່ `employees` ໄດ້
- [x] ສາມາດບັນທຶກ Custom Template ໄວ້ໃຊ້ໃນອະນາຄົດໄດ້
- [x] ໜ້າ Step 2 (`ProductionProcessFlowCard`) ສະແດງ Checklist ຕາມ Template ທີ່ເລືອກ
- [x] `npm run build` ຜ່ານ 100% ໂດຍບໍ່ມີ Error
