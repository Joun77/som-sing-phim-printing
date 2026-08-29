# Task 13: Low-Stock Alert Banner & Offcuts Inventory Management UI

## 1. AI Role & Mission
* **Role:** Senior Frontend Engineer & Inventory UX Specialist
* **Mission:** ພັດທະນາລະບົບແຈ້ງເຕືອນສະຕັອກຂັ້ນຕ່ຳ (Low-Stock Alert Banner) ທີ່ trigger ອັດຕະໂນມັດ ແລະ ໜ້າຈັດການ Offcut (ເສດເຈ້ຍ/ວັດຖຸດິບທີ່ເຫຼືອຈາກການຕັດ) ເພື່ອຫຼຸດຕົ້ນທຶນໂຮງພິມ.

> **ໝາຍເຫດ:** Backend API ສຳລັບ Offcuts (`GET/POST /offcuts`) ແລະ Stock Deduction (`deduction.go`) **ມີຄົບ 100% ແລ້ວ** — ນີ້ແມ່ນ Frontend-only Task.

---

## 2. ຂອບເຂດງານໂດຍລະອຽດ (Detailed Scope)

### Phase A — Global Low-Stock Alert Banner (ໃນ AppContext & Header)
* **Logic:** ຫຼັງຈາກ Inbound ຫຼື Stock Deduction ທຸກຄັ້ງ, ຄຳນວນ `currentQty` ຂອງທຸກ Material ໃນ `inventoryItems`
* **Threshold:** ຖ້າ `currentQty <= reorderPoint` ➔ ສ້າງ Alert (default: 100 ແຜ່ນ / ຕລບ.)
* **Banner UI:** Alert Strip ສີ Amber ຢູ່ `Header` (Sticky Top) — "`⚠ Art Card 250g ເຫຼືອ 80 ແຜ່ນ — ໃກ້ໝົດ`"
* **ປຸ່ມ Quick Link:** `[ສັ່ງຊື້ເພີ່ມ →]` ນຳທາງໄປ Inbound Form

### Phase B — Offcuts Inventory UI Tab (ໃນ InventoryManagement.tsx)
* **ເພີ່ມ Tab ໃໝ່:** `[ຄັງເສດເຈ້ຍ (Offcuts)]` ໃນ Inventory page
* **Offcuts Table:** ດຶງຈາກ `GET /offcuts` — ຊື່ Material, SKU, W×H mm, ຈຳນວນ, ສະຖານທີ່, Badge ສະຖານະ
* **ປຸ່ມ `[ລົງທະບຽນເສດເຈ້ຍໃໝ່]`:** Modal → `POST /offcuts`
* **Smart Suggestion:** ໃນ EditOrderModal ເມື່ອ Paper SKU match Offcut size → tooltip "`ມີເສດ Art Card 130g A5 — 200 ແຜ່ນ`"

### Phase C — ReorderPoint Settings Panel
* Owner ກຳນົດ `reorderPoint` ຕໍ່ Material ໄດ້ໃນໜ້າ Inventory Settings

---

## 3. ໄຟລ໌ເປົ້າໝາຍ (Target Files)

### Phase A
* [MODIFY] `admin-system/frontend/src/context/AppContext.tsx`
* [MODIFY] `admin-system/frontend/src/components/layout/Header.tsx`

### Phase B
* [MODIFY] `admin-system/frontend/src/features/inventory/components/InventoryManagement.tsx`
* [NEW] `admin-system/frontend/src/features/inventory/components/OffcutsTab.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/modals/EditOrderModal.tsx`

### Phase C
* [MODIFY] `admin-system/frontend/src/features/inventory/components/InventoryManagement.tsx`

---

## 4. ເກນການກວດຮັບງານ (Acceptance Criteria)
- [x] Alert Banner ສີ Amber ສະແດງຢູ່ Header ເມື່ອ Material ຫຼຸດ Threshold
- [x] Tab `[ຄັງເສດເຈ້ຍ]` ສະແດງ Offcuts Table ດຶງຈາກ `GET /offcuts`
- [x] ສາມາດ `[ລົງທະບຽນເສດເຈ້ຍໃໝ່]` ຜ່ານ Modal ໄດ້
- [x] Smart Offcut Suggestion ປະກົດຂຶ້ນໃນ EditOrderModal ເມື່ອ match size
- [x] Owner ຕັ້ງຄ່າ `reorderPoint` ຕໍ່ Material ໄດ້
- [x] `npm run build` ຜ່ານ 100%
