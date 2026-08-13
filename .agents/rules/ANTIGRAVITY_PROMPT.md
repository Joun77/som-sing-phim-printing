---
trigger: manual
---

# 🚀 PROMPT FOR ANTIGRAVITY IDE: Refactor Quotation Desk with Dynamic Print Cost Engine

## 📌 Project Context
- **Project Name:** Som Sing Printing (ERP / Order Management App)
- **Target Page/Module:** `Quotation Desk` (ໜ້າອອກໃບສະເໜີລາຄາ)
- **Objective:** ປັບປຸງ Logic ການຄຳນວນຕົ້ນທຶນການພິມ ແລະ UI ໃນໜ້າ Quotation Desk ໃຫ້ເປັນ **Dynamic Print Cost Calculation** ໂດຍອີງໃສ່ **Paper Area Factor ($S$)**, **CMYK Ink Coverage (%)**, **Machine Depreciation**, ແລະ **Paper/Material Costs** ເພື່ອໃຫ້ຜົນການຄຳນວນຖືກຕ້ອງ ແລະ ສະແດງຜົນ Real-time ເທິງ UI.

---

## 🛠️ Tasks Overview

1. **Update Pricing Calculation Engine (Backend / Frontend Utility):**
   - ນຳໃຊ້ສູດຄຳນວນ Dynamic Cost Model ທີ່ແນບມາໃນໄຟລ໌ສູດການຄຳນວນ (`som-sing-phim-dynamic-pricing`).
   - ຮອງຮັບການຄຳນວນຂະໜາດເຈ້ຍ A6, A5, A4 (Standard S=1.00), A3, A3+, Custom Sheet, ແລະ ເຈ້ຍມ້ວນ (Roll Paper).
   - ຄຳນວນຄ່າໝຶກຕາມ CMYK Coverage (%), ຄ່າຫຼຸ້ຍຫ້ຽນເຄື່ອງພິມ, ຄ່າວັດຖຸດິບ (ເຈ້ຍແຜ່ນ/ເຈ້ຍມ້ວນ), ຄ່າເສຍຫາຍ (Spoilage/Waste 5-10%), ແລະ ບວກ Margin % Profit.

2. **Refactor UI Components (`Quotation Desk`):**
   - **Column 1 (Job Specifications):**
     - ເພີ່ມ Toggle / Input ສຳລັບເລືອກປະເພດເຈ້ຍ (Sheet / Roll) ແລະ Custom Dimensions (mm).
     - ເພີ່ມ UI Input ສຳລັບ % CMYK Ink Coverage (Cyan, Magenta, Yellow, Black) ຫຼື Toggle ສະຫຼັບລະຫວ່າງ AVG vs. CMYK Precision Coverage.
     - ອັບເດດການສະແດງຜົນ Paper Cut Layout & Spoilage/Stock Draw ໃຫ້ Real-time.
   - **Column 2 (Internal Cost & Yields - Theme ສີດຳ/Dark Panel):**
     - ສະແດງຄ່າຄຳນວນຍ່ອຍແຕ່ລະແຖວໃຫ້ອັບເດດ Real-time:
       1. Paper Cost (with Spoilage)
       2. Ink Set Cost (CMYK Breakdown / Average)
       3. Machine Depreciation & Utility Cost
       4. Finishing Addons
       5. Operator Setup & Labor Cost
     - ສະແດງ **Net Internal Cost (Net Cost)** ແລະ **Markup Profit Margin Slider (%)** ເພື່ອຄຳນວນ Est. Profit Yield.
   - **Column 3 (Client Quote & Summary):**
     - ສະແດງ **Base Selling Price**, **Discount (%)**, **Tax/VAT (7%)**, ແລະ **Total Grand Total (LAK)**.
     - ສະແດງ Unit Price (Charged / Piece) ຢ່າງຈະແຈ້ງ.
     - ຮັກສາປຸ່ມ Action: `Save Quotation`, `Export PDF`, ແລະ `Confirm & Deduct (FIFO Stock)`.

---

## 🧮 Mathematical Engine & Formulas Reference

ອ້າງອີງຕາມຖານເຈ້ຍ A4 ($210 \times 297\text{ mm} = 62,370\text{ mm}^2$):

1. **Paper Area Factor ($S$):**
   $$S = \frac{\text{Width (mm)} \times \text{Length (mm)}}{210 \times 297}$$

2. **Ink Cost Formula:**
   $$\text{Ink Cost} = \left[ \left(\frac{\text{Price}_K}{\text{Yield}_K} \times \frac{\text{Cov}_K}{5\%}\right) + \sum_{c \in \{C,M,Y\}} \left(\frac{\text{Price}_{CMY}}{\text{Yield}_{CMY}} \times \frac{\text{Cov}_c}{5\%}\right) \right] \times S$$

3. **Machine Depreciation & Maintenance:**
   $$\text{Machine Cost} = \left( \frac{\text{Printer Price} \times (1 + \text{Maint}\%)}{\text{Printer Lifetime Yield (A4)}} \right) \times S$$

4. **Paper Cost Formula:**
   - **Sheet:** $\text{Paper Cost} = \frac{\text{Pack Price}}{\text{Pack Count}} \times S$
   - **Roll:** $\text{Paper Cost} = \frac{\text{Roll Price}}{\text{Roll Area (m}^2\text{)}} \times \text{Job Area (m}^2\text{)}$

5. **Net Cost & Final Selling Price:**
   $$\text{Subtotal} = \text{Ink Cost} + \text{Machine Cost} + \text{Paper Cost} + \text{Labor/Setup}$$
   $$\text{Net Internal Cost} = \text{Subtotal} \times (1 + \text{Spoilage}\%)$$
   $$\text{Selling Price} = \text{Net Internal Cost} \times \left(1 + \frac{\text{Profit Margin}\%}{100}\right) - \text{Discount}$$
   $$\text{Grand Total} = \text{Selling Price} \times (1 + \text{Tax}\%)$$

---

## 💻 Tech Stack & Requirements

- **Backend:** Go (Gin Framework) - `backend/pricing/engine.go` & `backend/pricing/handlers.go`
- **Frontend:** Vue.js / Tailwind CSS (ຫຼື Framework ທີ່ໃຊ້ໃນ Som Sing Phim)
- **State Management:** Reactive Store / State ສຳລັບ Quotation Desk ເພື່ອໃຫ້ທຸກ Input ທັງ Column 1, 2, 3 ອັບເດດຫາັນແບບ Instant Real-time.
- **Currency Support:** ຮອງຮັບ LAK, THB, USD (ຕາມ Header Toggle ເທິງ UI).

---

## 🎯 Expected Output

1. ໄຟລ໌ Logic ຄຳນວນຕົ້ນທຶນທີ່ສະອາດ, ບໍ່ມີ Bug ແລະ ມີ Unit Test.
2. UI ໜ້າ **Quotation Desk** ທີ່ສວຍງາມ, ເຮັດວຽກໄດ້ Real-time ຕາມອິນເຕີເຟດໃນຮູບ, ແລະ ຄຳນວນຕົ້ນທຶນໄດ້ແມ່ນຢຳ.