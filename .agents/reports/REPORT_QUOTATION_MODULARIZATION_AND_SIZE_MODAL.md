# ບົດລາຍງານການປັບປຸງລະບົບໃບສະເໜີລາຄາ ແລະ ການແຍກໂມດູນ (Quotation Modularization & Size Modal Report)

## 1. ຈຸດປະສົງ ແລະ ບັນຫາເດີມ (Objectives & Background)
1. **ໄຟລ໌ QuotationManager.tsx ໃຫຍ່ເກີນໄປ (ຫຼາຍກວ່າ 5,000 ແຖວ):** ອ່ານ ແລະ ບຳລຸງຮັກສາຍາກ.
2. **ສະຫຼຸບຕົ້ນທຶນການພິມ ແລະ ນ້ຳໝຶກສັບສົນ:** ເດີມມີການແຍກ 3 ແຖວຍ່ອຍ (1. ໝຶກ ml, 2. ຄ່າເສື່ອມເຄື່ອງ, 3. ຄ່າອາໄຫຼ່) ເຮັດໃຫ້ຜູ້ໃຊ້ສັບສົນ ທັງໆ ທີ່ຄຳນວນມາຈາກໜ້າເຄື່ອງແລ້ວ.
3. **ຂະໜາດຊິ້ນງານ (Box 3) ໃນໜ້າໃບສະເໜີລາຄາໃຊ້ງານຍາກ:** 24 preset ຢືດຍາວລົງມາຕາມລວງຕັ້ງ ເຮັດໃຫ້ຄວາມສູງຂອງ Box 3 ບໍ່ສົມດຸນກັບ Box 1 ແລະ Box 2.
4. **Task & Component ທີ່ບໍ່ໄດ້ໃຊ້ງານ:** ມີ Task ທີ່ເຮັດແລ້ວຕົກຄ້າງໃນ `.agents/tasks/` ແລະ ມີ Component ທີ່ບໍ່ໄດ້ໃຊ້ເຊັ່ນ `CustomerQuotationTemplate.tsx`, `QuotationCustomerModal.tsx`, `QuotationCustomerView.tsx`.

---

## 2. ສິ່ງທີ່ໄດ້ດຳເນີນການແກ້ໄຂ (Completed Actions)

### 2.1 ແຍກໂຄງສ້າງ Modular Components (QuotationManager Refactor)
- ສ້າງ [QuotationPrintEngineTab.tsx](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/pricing/components/tabs/QuotationPrintEngineTab.tsx):
  - ບັນຈຸສ່ວນເລືອກເຈ້ຍ (`PaperAndCoverSection`), ອັບໂຫຼດໄຟລ໌/ກວດສອບສີ (Preflight strip), ເຄື່ອງພິມ (`ManualPrinterAllocator`).
  - ປັບປຸງກາດສະຫຼຸບຕົ້ນທຶນພິມໃຫ້ເປັນແບບ **ລວມຍອດດຽວ (Unified Print & Ink Cost)**:
    - ສະແດງຍອດລວມ (Total Print Cost) ແລະ ອັດຕາຕໍ່ແຜ່ນ (`LAK xxx /ແຜ່ນ`) ຢ່າງກະທັດຮັດ ໂດຍບໍ່ມີແຖວຍ່ອຍ 1, 2, 3 ທີ່ລາຍຕາ.
- ສ້າງ [QuotationPostPressTab.tsx](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/pricing/components/tabs/QuotationPostPressTab.tsx):
  - ບັນຈຸວຽກຫຼັງການພິມ (Post-Press Machinery), ວັດຖຸດິບສິ້ນເປືອງ (Finishing Consumables Box Calculator), ແລະ ການຫຸ້ມຫໍ່/ຂົນສົ່ງ (Packaging & Logistics).
- ຕັດໂຄ້ດໃນ [QuotationManager.tsx](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/pricing/components/QuotationManager.tsx) ອອກຫຼາຍກວ່າ 700 ແຖວ ເຮັດໃຫ້ໄຟລ໌ສະອາດ, ເບິ່ງງ່າຍ, ແລະ ແບ່ງໜ້າທີ່ຮັບຜິດຊອບ (Separation of Concerns) ຢ່າງຊັດເຈນ.

### 2.2 ອອກແບບໃໝ່: Pop-up Modal ເລືອກຂະໜາດງານ (SizePresetSelectorModal)
- ສ້າງ [SizePresetSelectorModal.tsx](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/pricing/components/modals/SizePresetSelectorModal.tsx):
  - ຮອງຮັບການຄົ້ນຫາ (Live Search).
  - ແຍກແທັບໝວດໝູ່: ທັງໝົດ, ເອກະສານ (A-Series), ຮູບພາບ (Photos), ນາມບັດ/ກາດ (Cards), ສະຕິກເກີ (Stickers).
  - ຮອງຮັບປ່ຽນຫົວໜ່ວຍ: ນິ້ວ (INCH), ຊັງຕີແມັດ (CM), ມິນລີແມັດ (MM).
  - ມີກ່ອງປ້ອນຂະໜາດ Custom ພ້ອມປຸ່ມບັນທຶກ Preset ໃໝ່.
- ປັບປຸງ Box 3 ໃນ [JobQuantityAndPagesSection.tsx](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/pricing/components/JobQuantityAndPagesSection.tsx):
  - ສະແດງຂະໜາດປັດຈຸບັນ ແລະ ຫົວໜ່ວຍທຽບ (mm, inch, cm).
  - ປຸ່ມກົດເປີດ Modal `[ ປ່ຽນຂະໜາດ (Browse Presets) ]` ທີ່ສວຍງາມ ແລະ ສະດວກ.
  - ຊ່ອງປ້ອນ W & H ດ່ວນ (Quick inputs) ຫາກຕ້ອງການພິມຂະໜາດເອງໂດຍບໍ່ຕ້ອງເປີດ Modal.
  - ຄວາມສູງຂອງ Box 1, Box 2, ແລະ Box 3 ກັບມາມີຄວາມສົມດຸນ (Balanced Grid).

### 2.3 ທຳຄວາມສະອາດ Task ແລະ Dead Components (Cleanup)
- **ລົບໄຟລ໌ Task ທີ່ເຮັດສຳເລັດແລ້ວ** ອອກຈາກ `.agents/tasks/` ເພື່ອບໍ່ໃຫ້ຮົກ.
- **ລົບ Dead Components:**
  - `CustomerQuotationTemplate.tsx` (ບໍ່ມີການ Import ຫຼື ໃຊ້ງານໃນໂປຣເຈັກ).
  - `QuotationCustomerModal.tsx` ແລະ `QuotationCustomerView.tsx`.
- **ປັບປຸງ `PrinterSelectorModal.tsx`:** ຕັດແຖວຄຳນວນລະອຽດທີ່ສັບສົນອອກ ໃຫ້ສະແດງສະເພາະ `ຕົ້ນທຶນພິມລວມ: LAK xxx / ໜ້າ`.

---

## 3. ຜົນການທົດສອບ (Verification Results)
- **TypeScript Compilation (`npx tsc --noEmit`):** ຜ່ານ 100% ບໍ່ມີ Error.
- **Frontend Unit Tests (`npm test`):** ຜ່ານທັງໝົດ 27/27 Tests.
- **Backend Go Tests (`go test ./...`):** ຜ່ານທັງໝົດ (All package tests passed).
- **Frontend Production Build (`npm run build`):** ສຳເລັດສົມບູນພາຍໃນ 411ms.
