# ລາຍງານການແກ້ໄຂ & ຢືນຢັນລະບົບ: ການຮອງຮັບໝຶກຜົງໂທນເນີ (Laser Toner - kg/g) ແລະ ນ້ຳໝຶກ (Liquid Ink - ml/L)

**ວັນທີ:** 13 ກັນຍາ 2026  
**ສະຖານະ:** ສໍາເລັດສົມບູນ (Passed Verification 100%)  
**ຜູ້ປະສານງານ & ຜູ້ກວດສອບ:** Som Sing Phim Coordinator & QA Orchestrator

---

## 1. ຕອບຄຳຖາມຫຼັກຂອງຜູ້ໃຊ້ (Core Inquiry Answer)

> **ຄຳຖາມ:** ລະບົບຂອງພວກເຮົາຮອງຮັບທັງສອງແບບເລີຍຫຼືບໍ່ ສຳລັບການນຳເຂົ້າໝຶກ ແລະ ຄຳນວນອອກມາ (ໝຶກຜົງໂທນເນີທີ່ເປັນກິໂລກຣາມ vs ນ້ຳໝຶກທີ່ເປັນ ml)?

### ຄຳຕອບ:
**ລະບົບຮອງຮັບທັງສອງແບບ 100% ຢ່າງສົມບູນ:**
1. **ສຳລັບນ້ຳໝຶກ (Liquid Ink - Inkjet / Plotter / Eco-Solvent):**
   - **ຫົວໜ່ວຍນຳເຂົ້າ:** ຂວດ (Bottle), ລິດ (Litre), ຊຸດ (Set)
   - **ຫົວໜ່ວຍສະຕ໋ອກຕັດໃຊ້ງານ:** ມິລລິລິດ (`ml`)
   - **ສູດຄຳນວນຕົ້ນທຶນ:** ຄິດໄລ່ຈາກຕົ້ນທຶນຕໍ່ ml (`LAK / ml`) ຫຼື ອັດຕາ Yield ມາດຕະຖານ ISO (5% Coverage ເທິງ A4).
2. **ສຳລັບໝຶກຜົງໂທນເນີ (Laser Toner Powder - Digital Press / Copier):**
   - **ຫົວໜ່ວຍນຳເຂົ້າ:** ກິໂລກຣາມ (`kg`), ກຣາມ (`g`), ຕລັບ (`Cartridge`), ຕຸກ/ຂວດ (`Bottle`), ຖົງ (`Bag`)
   - **ຫົວໜ່ວຍສະຕ໋ອກຕັດໃຊ້ງານ:** ກຣາມ (`g`) ໂດຍລະບົບແປງ Multiplier ອັດຕະໂນມັດ: $1\text{ kg} = 1,000\text{ g}$
   - **ສູດຄຳນວນຕົ້ນທຶນ:** ຄິດໄລ່ຕົ້ນທຶນຕໍ່ກຣາມ (`LAK / g`) ແລະ ປ່ຽນເປັນຕົ້ນທຶນຕໍ່ໜ້າພິມຕາມອັດຕາກິນໝຶກຜົງຕົວຈິງຕໍ່ແຜ່ນ (g/ແຜ່ນ) ຫຼື OEM Baseline Yield (ເຊັ່ນ 100g / 26,000 ແຜ່ນ = 0.00385 g/ແຜ່ນ).

---

## 2. ບັນຫາທີ່ພົບ ແລະ ການປັບປຸງແກ້ໄຂ (Root Cause & Fixes)

### 2.1 ແກ້ໄຂບັນຫາປຸ່ມ ແລະ ຂໍ້ຄວາມສະແດງລະຫັດດິບ (Missing Translations in UI)
- **ສາເຫດ:** ໃນໄຟລ໌ພາສາ [lo.json](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/locales/lo.json) ແລະ [en.json](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/locales/en.json) ຍັງບໍ່ທັນມີຄີ `inbound.ink.*` ເຮັດໃຫ້ໜ້າຈໍສະແດງຜົນເປັນ `INBOUND.INK.TITLE`, `INBOUND.INK.CODE (SKU)`, `INBOUND.INK.VOLUME (ML)`, `INBOUND.INK.BASE_TYPE`, `INBOUND.INK.TARGET_PRINTER`.
- **ການແກ້ໄຂ:** ເພີ່ມຊຸດຄີແປພາສາຄົບທັງພາສາລາວ ແລະ ອັງກິດ ພ້ອມຂໍ້ຄວາມຊ່ວຍແນະນຳການຕັດສະຕ໋ອກຢ່າງຖືກຕ້ອງ.

### 2.2 ເພີ່ມຕົວເລືອກປະເພດໝຶກ (Dual Consumable Selector) ໃນ [InkSpecsForm.tsx](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/inbound/components/forms/InkSpecsForm.tsx)
- ເພີ່ມປຸ່ມເລືອກຊັດເຈນດ້ານເທິງຟອມ:
  - **"ນ້ຳໝຶກ (Liquid Ink - ml / L)"** -> ປັບຫົວໜ່ວຍເປັນຂວດ/ລິດ, ຄວາມຈຸເປັນ `ml`, SKU ຂຶ້ນຕົ້ນດ້ວຍ `INK-`.
  - **"ຜົງໝຶກໂທນເນີ (Laser Toner - g / kg)"** -> ປັບຫົວໜ່ວຍເປັນ `ກິໂລກຣາມ (kg)`, ຄວາມຈຸເປັນ `g (1000g)`, SKU ຂຶ້ນຕົ້ນດ້ວຍ `TNR-`.
- ສະຫຼັບ Label ອັດຕະໂນມັດລະຫວ່າງ `ຄວາມຈຸນ້ຳໝຶກ (Liquid Volume) (ml)` ແລະ `ນ້ຳໜັກສຸທິຜົງໝຶກ (Net Weight) (g)`.

### 2.3 ແກ້ໄຂ Backend Inbound Stock Ingestion ໃນ [inbound.go](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/inbound/inbound.go)
- ເດີມ `inbound.go` ຮາດໂຄ້ດ `consumptionUnit = "ml"` ສຳລັບໝຶກທຸກຊະນິດ ແລະ `getMultiplier` ບໍ່ໄດ້ອ່ານ `purchaseMultiplier` / `netWeightGrams`.
- **ການແກ້ໄຂ:** 
  - ອ່ານ `purchaseMultiplier` (1,000 ສຳລັບ 1 kg) ແລະ `netWeightGrams` ຢ່າງຖືກຕ້ອງ.
  - ກວດສອບຖ້າເປັນ `Toner` ຫຼື ຫົວໜ່ວຍຊື້ມີ `kg` / `ກິໂລ` / `gram` ຈະຕັ້ງ `consumptionUnit = "g"` ອັດຕະໂນມັດ.
  - ຮອງຮັບທັງການບັນທຶກ batch ໃໝ່, ການແກ້ໄຂ, ແລະ ການຄືນສະຕ໋ອກຢ່າງຖືກຕ້ອງ.

### 2.4 ແກ້ໄຂຊື່ສະແດງຜົນໃນແຖບຂ້າງ [BatchSidebar.tsx](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/frontend/src/features/inbound/components/forms/BatchSidebar.tsx)
- ແກ້ໄຂບໍ່ໃຫ້ລາຍການໝຶກດຶງຄ່າ Fallback ຂອງວັດສະດຸອື່ນ (ເຊັ່ນ `Rigid foam_board`) ມາສະແດງ.
- ຕອນນີ້ສະແດງຊື່ສະເພາະປະເພດຢ່າງຖືກຕ້ອງ: `ຜົງໝຶກ ...` ຫຼື `Toner Item #...` ສຳລັບໂທນເນີ ແລະ `ໝຶກ ...` ສຳລັບນ້ຳໝຶກ.

### 2.5 ແກ້ໄຂ Backend Warnings 8 ຈຸດໃນ `@[current_problems]`
- [users.go](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/auth/users.go): ເພີ່ມ `rows.Err()` check.
- [workflow_templates.go](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/orders/workflow_templates.go): ເພີ່ມ `rows.Err()` check.
- [lookups.go](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/settings/lookups.go): ເພີ່ມ `rows.Err()` check ແລະ import `log` ທັງ 2 ຈຸດ.
- [notification_settings_handler.go](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/settings/notification_settings_handler.go): ເພີ່ມ `rows.Err()` check, ປ່ຽນເປັນ tagged `switch req.Channel`, ແລະ import `log`.
- [presets.go](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/settings/presets.go): ເພີ່ມ `rows.Err()` check ແລະ import `log`.
- [wear_parts.go](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/admin-system/backend/settings/wear_parts.go): ເພີ່ມ `rows.Err()` check ແລະ import `log`.

---

## 3. ຜົນການທົດສອບ (Verification & Audit)

| ລາຍການກວດສອບ | ຄຳສັ່ງທີ່ໃຊ້ | ຜົນການທົດສອບ |
| :--- | :--- | :---: |
| **Go Vet & Linter** | `go vet ./...` (backend) | **PASS (0 Warnings / 0 Errors)** |
| **Go Backend Unit Tests** | `go test ./...` (backend) | **PASS (100% OK)** |
| **Go Binary Build** | `go build -o /dev/null main.go` | **PASS (Code 0)** |
| **Frontend TypeScript** | `npx tsc --noEmit` | **PASS (0 Type Errors)** |
| **Frontend Unit Tests** | `npm test` (37 tests across 7 suites) | **PASS (37/37 Tests Passed)** |
| **Vite Production Build** | `npm run build` | **PASS (Built successfully in 604ms)** |

---

## 4. ສະຫຼຸບຜົນ
ລະບົບຮອງຮັບການນຳເຂົ້າ ແລະ ຄຳນວນທັງ **ໝຶກຜົງເລເຊີ (Laser Toner - kg/g)** ແລະ **ນ້ຳໝຶກ (Liquid Ink - ml/L)** ໄດ້ຢ່າງຖືກຕ້ອງ, ແມ່ຍຳ, ພ້ອມ UI ທີ່ຊັດເຈນ, ແປພາສາຄົບຖ້ວນ, ແລະ ບໍ່ມີ Error ຫຼື Warning ຕົກຄ້າງໃນລະບົບ.
