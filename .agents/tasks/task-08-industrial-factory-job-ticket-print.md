# Task 08 (Phase 2): Industrial Factory Job Ticket Print Layout

## 1. AI Role & Mission
* **Role:** Senior Pre-Press Engineer & Print Production Specialist
* **Mission:** ຍົກລະດັບ **ໃບສັ່ງຜະລິດໜ້າງານ (Industrial Factory Job Ticket)** ໃຫ້ມີຂໍ້ມູນລະດັບໂຮງພິມມາດຕະຖານສາກົນ ສຳລັບຊ່າງພິມ, ຊ່າງຕັດເຈ້ຍ, ແລະ ຊ່າງເຂົ້າເລ່ມ ພ້ອມ Barcode/QR Code ສຳລັບກວດສອບສະຖານະ.

---

## 2. ຂອບເຂດງານໂດຍລະອຽດ (Detailed Scope of Work)

### 1. ໂຄງສ້າງໃບສັ່ງຜະລິດ (Print Job Ticket Layout):
* **Order & Customer Header:**
  * Order ID, ຊື່ລູກຄ້າ, ເບີໂທ, ວັນທີສັ່ງພິມ, ກຳນົດສົ່ງມອບ (Due Date / SLA Badge)
  * QR Code / Barcode ສະແກນເຊື່ອມຕໍ່ລະບົບ ERP/Tracking
* **Paper & Cutting Specs:**
  * ລະຫັດ Lot ເຈ້ຍ, ຊະນິດເຈ້ຍ, ແກຣມ (GSM)
  * ຂະໜາດແຜ່ນໃຫຍ່ (Parent Sheet W×H mm) vs ຂະໜາດຕັດສຳເລັດ (Cut Size W×H mm)
  * ຈຳນວນຕັດຕໍ່ແຜ່ນ (Cuts per Sheet) ແລະ ຈຳນວນແຜ່ນທີ່ຕ້ອງເບີກ + ເປີເຊັນເຜື່ອເສຍ (Spoilage %)
* **Press Run & Color Modes:**
  * ແທ່ນພິມທີ່ກຳນົດ (Assigned Digital Press / Offset Machine)
  * ໂໝດສີ: 4-Color CMYK ຫຼື 1-Color Mono K ພ້ອມຄ່າ Ink Coverage %
  * ຈຳນວນໜ້າທັງໝົດ, ຈຳນວນພິມ (Run Volume)
* **Post-Press Finishing & Binding Checklist:**
  * ລາຍການແປຮູບ: ຕັດເຈຽນ, ພັບ (Folding), ປ້ຳເສັ້ນ (Creasing), ໄດຄັດ (Die-Cut)
  * ການເຄືອບ: ເຄືອບເງົາ (Gloss), ເຄືອບດ້ານ (Matte), Spot UV
  * ວິທີເຂົ້າເລ່ມ: ສັນຫ່ວງຂົດລວດ (Wire-O), ຫຍິບມຸງກົກ (Saddle Stitch), ໄສກາວຮ້ອນ (Perfect Glue), ສັນປະຕິທິນ (Calendar)
* **Quality Assurance (QC) & Sign-Off:**
  * ຊ່ອງເຊັນຊື່ຊ່າງພິມ, ຊ່າງຕັດ, ຊ່າງເຂົ້າເລ່ມ, ແລະ ຜູ້ກວດ QC ພ້ອມວັນທີ

### 2. Print Stylesheet Optimization:
* ຮອງຮັບການພິມອອກເຈ້ຍ A4 ມາດຕະຖານຜ່ານ `@media print` ຢ່າງສວຍງາມ, ຄົມຊັດ, ບໍ່ຕັດຕົກຂອບ.

---

## 3. ໄຟລ໌ເປົ້າໝາຍ (Target Files)
* [MODIFY] `admin-system/frontend/src/features/orders/components/OrderDetailsPage.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/production/PaperCuttingTicketCard.tsx`

---

## 4. ເກນການກວດຮັບງານ (Acceptance Criteria)
- [x] ໃບສັ່ງຜະລິດ (Job Ticket) ສະແດງຂໍ້ມູນສະເປກວັດສະດຸ, ການຕັດເຈ້ຍ, ແທ່ນພິມ, ແລະ ການເຂົ້າເລ່ມຄົບຖ້ວນ
- [x] ເມື່ອກົດ `[ພິມໃບສັ່ງຜະລິດ]` ຮອງຮັບການພິມອອກເຈ້ຍ A4 ໄດ້ຢ່າງສົມບູນແບບ
- [x] `npm run build` ຜ່ານ 100%
