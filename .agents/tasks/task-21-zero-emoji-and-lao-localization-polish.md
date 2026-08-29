# Task 21: Enterprise Zero-Emoji Refactor & Complete Lao Localization Polish

## 1. AI Role & Mission
* **Role:** Senior Design System Specialist & Lao Typography/i18n Lead
* **Mission:** Perform a comprehensive, codebase-wide purge of all text emojis across all modules (Catalog, Inventory, Equipment, Dashboard, HR, Finance), replacing them with standard Lucide React icons, and verify full Lao language localization compliance and `Noto Sans Lao` font rendering across the UI.

> **CRITICAL LOCALIZATION REQUIREMENT:** All user-facing text, placeholders, tooltips, and badges MUST strictly remain in official **Lao language** (`lo` / ພາສາລາວ) with zero English/Thai leakage.

---

## 2. Phase-by-Phase Implementation Plan

### Phase A — Global Text Emoji Sweep & Lucide Icon Replacement
* **Objective:** Scan with regex and replace all text emojis to achieve exactly 0 remaining instances.
* **Target Areas & Replacements:**
  1. **Catalog Module:**
     - `WebCatalogPage.tsx`: Replace `✨` with `<Sparkles className="w-4 h-4 text-amber-500" />`.
     - `Step1GeneralInfo.tsx`: Replace `🚀` with `<Rocket className="w-4 h-4 text-blue-500" />` or `<Zap />`.
     - `Step4PostPressFinishing.tsx`: Replace `📦` with `<Package className="w-4 h-4" />` and `✨` with `<Sparkles />`.
     - `Step6CustomerPreview.tsx`: Replace `🎉` with `<Award className="w-4 h-4 text-emerald-600" />` or `<PartyPopper />`.
  2. **Dashboard & Orders:**
     - `SpoilageTimelineChart.tsx`: Replace `💡` with `<Lightbulb className="w-4 h-4 text-amber-500" />`.
     - `ItemSpecConfigurator.tsx`: Replace `💡` with `<Lightbulb />`.
     - `ProductionProcessFlowCard.tsx`: Replace `🎉` in toast notifications with Lucide icons.
  3. **Customer Service Storefront:**
     - Sweep `customer-service/src/` components (Catalog, ProductPage, CartDrawer, TrackingPage).

---

### Phase B — Lao Language Standardization & Printing Terminology
* **Execution Steps:**
  1. Standardize all technical printing terms in Lao:
     - ຕັດເຈ້ຍ / ຕັດເຈຽນ (Paper Cutting / Trimming)
     - ເຂົ້າເລ່ມໄສກາວຮ້ອນ (Perfect Glue Binding)
     - ສັນຫ່ວງຂົດລວດ (Wire-O Binding)
     - ຫຍິບມຸງກົກ (Saddle Stitch)
     - ປ້ຳຟອຍຄຳ / ຟອຍເງິນ (Hot Foil Stamping)
     - ປ້ຳນູນ / ປ້ຳຈົມ (Embossing / Debossing)
     - ຄ່າຫຼຸ້ຍຫ້ຽນເຄື່ອງຈັກ (Machine Depreciation)
     - ວັດສະດຸເຜື່ອເສຍ / ງານເສຍ (Spoilage / Scrap)
  2. Clean up residual Thai/English text in placeholders, tooltips, and dropdown options in:
     - `Step2PrintEngine.tsx`, `Step3MaterialInventory.tsx`, `SupplierPriceCompare.tsx`

---

### Phase C — Typography & Lao Vowel Rendering Audit
* **Execution Steps:**
  1. Audit `tailwind.config.js` and `index.html` in both `admin-system` and `customer-service`:
     - Set primary `font-sans`: `['Noto Sans Lao', 'Inter', 'sans-serif']`.
     - Ensure sufficient `line-height` and `padding` so upper vowels/tones (ິ, ີ, ຶ, ື, ໍ່, ໍ້) and lower vowels (ຸ, ູ) do not clip or overlap.

---

## 3. Target Files

* [MODIFY] `admin-system/frontend/src/features/catalog/WebCatalogPage.tsx`
* [MODIFY] `admin-system/frontend/src/features/catalog/components/steps/Step1GeneralInfo.tsx`
* [MODIFY] `admin-system/frontend/src/features/catalog/components/steps/Step4PostPressFinishing.tsx`
* [MODIFY] `admin-system/frontend/src/features/catalog/components/steps/Step6CustomerPreview.tsx`
* [MODIFY] `admin-system/frontend/src/features/dashboard/components/SpoilageTimelineChart.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/ItemSpecConfigurator.tsx`
* [MODIFY] `admin-system/frontend/src/features/orders/components/production/ProductionProcessFlowCard.tsx`
* [MODIFY] `admin-system/frontend/src/locales/lo.json`
* [MODIFY] `customer-service/src/utils/i18n.ts`

---

## 4. Acceptance Criteria
- [ ] Global search for emojis yields exactly 0 results across both projects (Zero Text Emojis).
- [ ] All buttons, badges, alerts, and cards utilize clean Lucide React icons.
- [ ] All UI strings in Lao mode comply with printing industry vocabulary.
- [ ] Noto Sans Lao renders cleanly without clipped or overlapping vowels and tone marks.
- [ ] `npm run build` passes with 100% success in both projects.
