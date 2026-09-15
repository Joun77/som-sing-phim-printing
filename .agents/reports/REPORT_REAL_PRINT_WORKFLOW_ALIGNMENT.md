# Som Sing Phim - ບົດລາຍງານການປັບແຕ່ງລະບົບຕາມຂະບວນການຜະລິດຈິງ (Real Print Workflow Alignment Report)

**ວັນທີດຳເນີນການ:** 13 ກັນຍາ 2026  
**ຜູ້ປະສານງານ ແລະ ວິສະວະກອນ:** Som Sing Phim Coordinator & Senior Print Production Engineer  
**ສະຖານະ:** ສຳເລັດຮຽບຮ້ອຍ 100% (Passed - All 37 Unit Tests, TypeScript, & Backend Go Tests Passed)

---

## 1. ພາບລວມການດຳເນີນການ (Summary of Completed Implementations)

ຕາມທີ່ໄດ້ຕົກລົງ ແລະ ປຶກສາກັບຜູ້ປະກອບການໂຮງພິມ ໄດ້ມີການປັບແຕ່ງ 5 ຈຸດສຳຄັນໃຫ້ກົງກັບໜ້າວຽກຕົວຈິງ:

### 1.1 ຕັ້ງຄ່າເລີ່ມຕົ້ນໝຶກເລເຊີເປັນ "ຜົງໝຶກເຕີມ / ໝຶກທຽບ" (Compatible Toner Powder Refill)
- ໃນ `InkSpecsForm.tsx` ແລະ `types.ts`:
  - ເມື່ອກົດເລືອກປະເພດ `TONER`: ລະບົບຈະຕັ້ງຄ່າເລີ່ມຕົ້ນເປັນ **ໝຶກທຽບ / ຜົງເຕີມ (Compatible)** (`isCompatible: true`, `inkGrade: 'compatible'`) ຫົວໜ່ວຍ `kg` (1,000 g) ແລະ `g` ອັດຕະໂນມັດ.
  - ເພີ່ມ UI **Ink Grade Selector** ຊັດເຈນ ໃຫ້ເລືອກລະຫວ່າງ `ໝຶກທຽບ / ຜົງເຕີມ (Compatible)` ແລະ `ໝຶກແທ້ (OEM Genuine)` ໂດຍຕັ້ງຄ່າເລີ່ມຕົ້ນເປັນໝຶກທຽບ.
  - ຊ່ວຍໃຫ້ຊ່າງພິມບໍ່ຕ້ອງມາປັບປ່ຽນເອງທຸກຄັ້ງທີ່ນຳເຂົ້າຜົງໝຶກເລເຊີ.

### 1.2 ຕັດຄ່າຕັ້ງເຄື່ອງຕັດອັດຕະໂນມັດ 10,000 LAK ອອກ (Remove Flat Cutting Fee)
- ໃນ `QuotationManager.tsx`:
  - ຕັ້ງ `guillotineFee = 0 LAK` ຍົກເລີກການບວກຄ່າຕັດຄົງທີ່ 10,000 LAK ທີ່ເຄີຍບວກອັດຕະໂນມັດ.
  - ງານຕັດຈະຖືກຄິດໄລ່ເມື່ອຊ່າງ **ເລືອກເຄື່ອງຕັດໄຮໂດຼລິກເຂົ້າມາໃນລາຍການເຄື່ອງຈັກຫຼັງພິມ (Post-press Machinery)** ຕາມຄວາມເປັນຈິງ (ຄິດແບບເໝົາຕໍ່ຮອບ).

### 1.3 ຮອງຮັບງານເຄືອບຟິล์ມ 2 ຮູບແບບ (Dual-Mode Lamination: Roll m² vs Sheet Pouch)
- ໃນ `defaultTemplates.ts`, `QuotationManager.tsx`, `ItemSpecConfigurator.tsx`, ແລະ `MaterialInventorySearchModal.tsx`:
  - ອັບເດດ `FinishingMaterialItem.calcMode` ໃຫ້ຮອງຮັບ `'sqm'` ແລະ `'sheet'`.
  - **ຟິล์ມມ້ວນ (Roll Film):** ເມື່ອເລືອກວັດສະດຸເຄືອບທີ່ມີຫົວໜ່ວຍເປັນ `m²`, `ຕລ.ມ.`, ຫຼື `ມ້ວນ/Roll` ລະບົບຈະຄຳນວນຕົ້ນທຶນຕາມເນື້ອທີ່ຕາຕະລາງແມັດຕົວຈິງ:
    $$\text{Cost} = \text{Price/m}^2 \times \left(\frac{W_{\text{mm}} \times H_{\text{mm}}}{1,000,000}\right) \times \text{QtyPerItem} \times \text{Volume}$$
  - **ຟິล์ມແຜ່ນ (Sheet Pouch):** ຄິດໄລ່ຕາມຈຳນວນແຜ່ນຈິງ:
    $$\text{Cost} = \text{Price/Sheet} \times \text{QtyPerItem} \times \text{Volume}$$

### 1.4 ຂອບຕັດຕົກມາດຕະຖານ (Standard Bleed Margin)
- ຄ່າເລີ່ມຕົ້ນຂອງຂອບຕັດຕົກຖືກກຳນົດໄວ້ທີ່ **2 mm** (ເພີ່ມຂ້າງລະ 2 mm = 4 mm ສຳລັບຈັດ Imposition) ເຊິ່ງເປັນມາດຕະຖານໂຮງພິມດິຈິຕອລ.

---

## 2. ຜົນການທົດສອບຄວາມຖືກຕ້ອງ (Verification Matrix)

| ການທົດສອບ | ຄຳສັ່ງທີ່ໃຊ້ | ຜົນການທົດສອບ | ລາຍລະອຽດ |
|---|---|---|---|
| Frontend Unit Tests | `npm test -- --run` | **37 Passed (0 Failed)** | ທຸກ test suite ຜ່ານ 100% (costCalculator, DetailViews, machineCostCalculator, ຯລຯ) |
| TypeScript Check | `npx tsc --noEmit` | **0 Errors** | Type definitions ຖືກຕ້ອງສົມບູນ |
| Backend Go Tests | `go test ./...` | **All Passed** | ທຸກ package (pricing, orders, inventory, inbound, finance) ຜ່ານ 100% |

---

## 3. ໄຟລ໌ທີ່ໄດ້ຮັບການປັບແກ້ (Modified Files)
1. `admin-system/frontend/src/features/inbound/components/forms/types.ts`: ປັບ default ຂອງ INK ໃຫ້ເປັນ `isCompatible: true`, `inkGrade: 'compatible'`.
2. `admin-system/frontend/src/features/inbound/components/forms/InkSpecsForm.tsx`: ຕັ້ງຄ່າຜົງໝຶກເລເຊີເປັນ Compatible ແລະ ເພີ່ມ UI Grade Selector.
3. `admin-system/frontend/src/features/pricing/data/defaultTemplates.ts`: ຂະຫຍາຍ `FinishingMaterialItem.calcMode` ໃຫ້ຮອງຮັບ `'sqm'` ແລະ `'sheet'`.
4. `admin-system/frontend/src/features/pricing/components/QuotationManager.tsx`: ຍົກເລີກ flat guillotine fee ແລະ ເພີ່ມການຄິດໄລ່ຟິล์ມມ້ວນຕໍ່ $m^2$.
5. `admin-system/frontend/src/features/pricing/components/MaterialInventorySearchModal.tsx`: ກວດຈັບວັດສະດຸຟິล์ມມ້ວນ/ຕລ.ມ. ແລ້ວກຳນົດ `calcMode: 'sqm'` ອັດຕະໂນມັດ.
6. `admin-system/frontend/src/features/orders/components/ItemSpecConfigurator.tsx`: ເພີ່ມການຄິດໄລ່ຟິล์ມມ້ວນຕໍ່ $m^2$ ໃນໜ້າຕັ້ງຄ່າສະເປກອໍເດີ.
