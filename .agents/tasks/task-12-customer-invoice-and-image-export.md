# Task 12: Customer Payment Invoice / Receipt with Multi-Format Export (PDF / PNG / JPG)

## 1. AI Role & Mission
* **Role:** Senior Full-Stack Engineer & Document Generator Architect
* **Mission:** ພັດທະນາລະບົບອອກໃບບິນຊຳລະເງິນສຳລັບລູກຄ້າ (Customer-Facing Invoice / Official Receipt) ທີ່ສວຍງາມ, ສະອາດ, ເປັນທາງການ, ເຊື່ອງຕົ້ນທຶນວັດຖຸດິບພາຍໃນໂຮງພິມ, ພ້ອມລະບົບ Export ເປັນ **PDF**, **PNG**, **JPG** (ສຳລັບສົ່ງຜ່ານ WhatsApp) ແລະ ພິມເຈ້ຍ A4.

---

## 2. ຂອບເຂດງານໂດຍລະອຽດ (Detailed Scope of Work)

### 1. ໃບບິນຊຳລະເງິນສຳລັບລູກຄ້າ (Customer Invoice Design):
* **Header & Shop Identity:**
  * ໂລໂກ້ ສົມສິງ ພິມ (Som Sing Printing)
  * ເບີໂທ, ທີ່ຢູ່, QR Code ຊຳລະເງິນ BCEL One / ທະນາຄານ
* **Customer & Order Details:**
  * ເລກທີໃບບິນ / Invoice No. (ເຊັ່ນ: `INV-2026-001`)
  * ວັນທີອອກໃບບິນ, ຊື່ລູກຄ້າ/ບໍລິສັດ, ເບີໂທ, ສະຖານທີ່ຈັດສົ່ງ
* **Itemized Products Table (ເຊື່ອງຕົ້ນທຶນພາຍໃນ):**
  * ບໍ່ສະແດງຕົ້ນທຶນເຈ້ຍ/ໝຶກພາຍໃນ
  * ສະແດງສະເພາະ: ລຳດັບ, ຊື່ລາຍການສິນຄ້າ, ລາຍລະອຽດສະເປກ (ຂະໜາດ, ເຈ້ຍ, ວິທີເຂົ້າເລ່ມ), ຈຳນວນ (Qty), ລາຄາຕໍ່ໜ່ວຍ (Unit Price), ລາຄາລວມ (Total)
* **Financial Ledger Summary:**
  * ມູນຄ່າລວມ (Subtotal)
  * ສ່ວນຫຼຸດພິເສດ (Discount)
  * ຄ່າຈັດສົ່ງ (Shipping Fee)
  * ມູນຄ່າສຸດທິ (Grand Total)
  * ຍອດຊຳລະແລ້ວ / ມັດຈຳ (Deposit / Paid Amount)
  * ຍອດຄ້າງຊຳລະ (Remaining Balance LAK)
* **Signature & Official Stamp:**
  * ຊ່ອງລາຍເຊັນຜູ້ຮັບເງິນ / ກາປະທັບຮ້ານ

### 2. Multi-Format Export Options:
* **Export PDF:** ບັນທຶກເປັນໄຟລ໌ PDF ຄົມຊັດສຳລັບພິມ ຫຼື ສົ່ງທາງ Email
* **Export PNG / JPG (WhatsApp Ready):** ໃຊ້ `html2canvas` render ອອກມາເປັນຮູບພາບຄົມຊັດສຳລັບແຊຣ໌ສົ່ງໃຫ້ລູກຄ້າຜ່ານ WhatsApp / Telegram ທັນທີ
* **Print Invoice:** ຮອງຮັບການພິມອອກເຈ້ຍ A4 ຜ່ານ `@media print`

---

## 3. ໄຟລ໌ເປົ້າໝາຍ (Target Files)
* [NEW] `admin-system/frontend/src/features/orders/components/modals/CustomerInvoiceModal.tsx`
* [NEW] `admin-system/frontend/src/features/orders/components/documents/CustomerInvoiceTemplate.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/OrderDetailsPage.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/OrderCompletedSummaryPage.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/OrderDeliveryPage.tsx`

---

## 4. ເກນການກວດຮັບງານ (Acceptance Criteria)
- [x] ມີປຸ່ມ `[ໃບບິນລູກຄ້າ (Invoice / Receipt)]` ໃນໜ້າ Step 3 (Delivery), Step 4 (Completed) ແລະ Header
- [x] ໃບບິນສະແດງສະເພາະລາຄາຂາຍ ແລະ ສະເປກລູກຄ້າ (ບໍ່ສະແດງຕົ້ນທຶນພາຍໃນ)
- [x] ສາມາດ Export ເປັນ PDF, PNG, JPG ແລະ Print ໄດ້ 100%
- [x] `npm run build` ຜ່ານ 100%
