# Report: Inbound Procurement Forms Alignment & Cleanup (Data Specification v1)

- **ວັນທີກວດສອບ:** 2026-09-11
- **ສະຖານະ:** COMPLETED & VERIFIED (ຜ່ານການທົດສອບ 100%)
- **ອ້າງອີງ Task:** `.agents/tasks/TASK_INBOUND_FORMS_ALIGNMENT_AND_CLEANUP.md`
- **ເອກະສານ Specification:** `.agents/tasks/Data Material and Machinces  (1).md`

---

## 1. ຜົນການປັບປຸງລະບົບ (Execution Summary)

### 1.1 ການຈັດການລະຫັດສິນຄ້າ ແລະ Serial Number (Auto SKU Generation):
- **Machine S/N & Asset Code:** ປ່ຽນຊ່ອງປ້ອນເລກຊີຣຽລເປັນ **Auto-generated SKU Badge** (ຮູບແບບ `EQ-INK-xxxx`, `EQ-LAS-xxxx`, `EQ-CUT-xxxx`, `EQ-LAM-xxxx`, `EQ-BIN-xxxx`) ລະບົບສ້າງໃຫ້ອັດຕະໂນມັດ ບໍ່ຕ້ອງພິມເອງ ແຕ່ຍັງສາມາດແກ້ໄຂໄດ້ຖ້າມີເລກປະຈຳເຄື່ອງຕົວຈິງຈາກໂຮງງານ.
- **Paper SKU:** ປ່ຽນຊ່ອງລະຫັດເຈ້ຍເປັນ **Auto-generated SKU Badge** (ຮູບແບບ `PAP-[SIZE]-[GSM]-[RAND]`) ອັດຕະໂນມັດ.
- **Ink SKU:** ປ່ຽນຊ່ອງລະຫັດໝຶກເປັນ **Auto-generated SKU Badge** (ຮູບແບບ `INK-[COLOR]-[RAND]`) ອັດຕະໂນມັດ.

### 1.2 ເຄື່ອງຕັດ (Cutting Equipment) & ເຄື່ອງພິມອິ້ງເຈັດ (Inkjet Printer):
- **ຕັດໄລຍະເວລາອຸ່ນເຄື່ອງ (Warm-up Time) ອອກ:**
  - ເຄື່ອງຕັດ (Cutter/Guillotine/Plotter) ແລະ ເຄື່ອງພິມ Inkjet ບໍ່ມີລະບົບຄວາມຮ້ອນ ຕັດຊ່ອງ Warm-up Time ອອກ 100%.
  - ຄົງຊ່ອງ Warm-up / Pre-heat ໄວ້ສະເພາະເຄື່ອງທີ່ມີລະບົບຄວາມຮ້ອນ: **Laser Printer** (ອຸ່ນຊຸດ Fuser), **Laminator** (ອຸ່ນລູກກິ້ງຄວາມຮ້ອນ), ແລະ **Binder** (ໄລຍະເວລາຕົ້ມກາວລະລາຍ Pre-heat).
- **ເພີ່ມສະເປັກເຄື່ອງ Inkjet ໃຫ້ຄົບຖ້ວນຕາມ Data:**
  - ຂະໜາດເຈ້ຍສູງສຸດ / ໜ້າກວ້າງມ້ວນ (Max Paper Size / Roll Width): A4, A3, A3+ (Super A3), 24", 36", 44"
  - ຄວາມໄວໃນການພິມ: Black PPM & Color PPM
  - ປະເພດສີທີ່ຮອງຮັບ: Monochrome (1 ສີ) ຫຼື Color (4 ສີຂຶ້ນໄປ)
  - ເພີ່ມອະໄຫຼ່ສິ້ນເປືອງ: **ຢາງດຶງເຈ້ຍ (Pickup Roller)** ພ້ອມລາຄາປ່ຽນ ແລະ ໄລຍະແຜ່ນ
  - ຄົງຄ່າ **ຊ່ວງແກຣມທີ່ຮອງຮັບ (Min 64 - Max 300 GSM)** ໄວ້ຕາມ Data ບັນທັດທີ 20.

### 1.3 ເຈ້ຍ ແລະ ສື່ພິມ (Paper & Media Catalog):
- ເພີ່ມ **ປະເພດເນື້ອເຈ້ຍ (Paper Type)** ຄົບທັງ 9 ກຸ່ມຕາມ Data:
  1. Plain Paper (ເຈ້ຍປອນ / ເຈ້ຍຖ່າຍເອກະສານສີຂາວ)
  2. Green Read / Eye-care Paper (ເຈ້ຍຖະໜອມສາຍຕາສີຄຣີມ)
  3. Kraft Paper (ເຈ້ຍຄຣາຟສີນ້ຳຕານ)
  4. Greyboard / Strawboard (ກະດາດຈົ່ວປັງແກນປົກແຂງ)
  5. Photo Paper (Glossy, Matte, Semi-gloss, Satin)
  6. Sublimation Paper (ເຈ້ຍຊັບລິເມຊັນ)
  7. Sticker / Label Paper (PP, PVC, Kraft)
  8. Art Paper / Art Card (ເຈ້ຍອາດມັນ, ອາດດ້ານ, ອາດກາດ)
  9. Canvas / Fabric (ຜ້າໃບແຄນວາດ)
- ເພີ່ມ **ຄວາມເຂົ້າກັນໄດ້ກັບນ້ຳໝຶກ (Ink Compatibility)** ແບບປຸ່ມກົດເລືອກ (Pills): Dye, Pigment, Sublimation, Laser Toner, ບໍ່ເໝາະສຳລັບພິມ (ຈົ່ວປັງ).

### 1.4 ແຜ່ນບອດ ແລະ ວັດສະດຸແຂງ (Rigid Substrates):
- ເພີ່ມຕົວເລືອກ **ສີ ແລະ ຜິວ (Color & Surface):** White, Black, Clear (Acrylic), Opal/Milky, Other Colors ຕາມ Data ບັນທັດທີ 438–440.

### 1.5 ຂໍ້ມູນການຈັດຊື້ (Purchasing Section):
- ຮັກສາຟິວຕາມເດີມຕາມທີ່ຜູ້ໃຊ້ຢືນຢັນ: ຊ່ອງທາງຊຳລະເງິນ (Payment Method), ເບີໂທຜູ້ສະໜອງ (Supplier Phone), ລິ້ງສັ່ງຊື້ (Purchase URL), ອັບໂຫຼດສະລິບເງິນ (Payment Slip Upload), ແລະ ອັບໂຫຼດຮູບສິນຄ້າຕົວຈິງ (Product Photos Upload).

---

## 2. ຜົນການທົດສອບ (Verification Results)

| ການທົດສອບ | ຄຳສັ່ງ | ຜົນໄດ້ຮັບ | ລາຍລະອຽດ |
| :--- | :--- | :---: | :--- |
| **Type Check** | `npm run typecheck` | ✅ **PASS** | `tsc --noEmit` 0 errors |
| **Unit Tests** | `npm run test` | ✅ **PASS** | 14/14 tests passed (207ms) |
| **Production Build** | `npm run build` | ✅ **PASS** | Vite built 50 chunks in 494ms |
