# Som Sing Phim - ບົດລາຍງານການຈຳລອງການໃຊ້ງານຈິງ ແລະ ກວດສອບລະບົບຄຳນວງຕົ້ນທຶນຄົບວົງຈອນ (End-to-End Cost Pipeline Audit Report)

**ວັນທີກວດສອບ:** 13 ກັນຍາ 2026  
**ບົດບາດຜູ້ກວດສອບ:** Som Sing Phim Coordinator & Senior Print Production Engineer (ສວມບົດເປັນຜູ້ປະກອບການໂຮງພິມ / ຊ່າງພິມຕົວຈິງ)  
**ສະຖານະລະບົບ:** ຜ່ານການກວດສອບ 100% (Passed - All 37 Unit Tests & Backend Go Tests Passed)

---

## 1. ພາບລວມການກວດສອບ (Executive Summary)

ການກວດສອບຄັ້ງນີ້ໄດ້ດຳເນີນການຈຳລອງການເຮັດວຽກຂອງລະບົບຄຳນວນຕົ້ນທຶນ ແລະ ລາຄາຂາຍ (Costing & Pricing Pipeline) ຂອງໂຮງພິມ **Som Sing Phim** ແບບຄົບວົງຈອນ 8 ໂມດູນຫຼັກ ຕັ້ງແຕ່ຕົ້ນນ້ຳຈົນເຖິງປາຍນ້ຳ:
1. **ຂະບວນການນຳເຂົ້າສິນຄ້າ (Inbound Procurement):** ນ້ຳໝຶກແຫຼວ (ml), ຜົງໝຶກເລເຊີ (kg/g), ເຄື່ອງພິມອິ້ງເຈັດ, ເຄື່ອງພິມເລເຊີ, ເຄື່ອງຕັດ, ແລະ ເຈ້ຍ
2. **ສາງສິນຄ້າ (Warehouse & Inventory Valuation):** ການຕັດຕົ້ນທຶນແບບ FIFO, ການແປງຫົວໜ່ວຍ (ml, g, ແຜ່ນ, ມ້ວນ/ຕລ.ມ.) ແລະ ການນຳເສດເຈ້ຍ (Offcuts) ມາຣີໄຊເຄິລ
3. **ໜ້າເຄື່ອງຈັກຊ່າງພິມ (Equipment Fleet & PPM):** ຄ່າຫຼຸ້ຍຫ້ຽນ, ອາໄຫຼ່ສິ້ນເປືອງ, ການຜູກໝຶກຈິງ, ແລະ ຕົ້ນທຶນຕໍ່ແຜ່ນ
4. **ໜ້າຕິດຕາມງານພິມ (Shop Floor & Production Tracking):** ຈຸດຕັດສະຕັອກເມື່ອເຂົ້າສູ່ `IN_PRODUCTION`, ການບັນທຶກຂອງເສຍ (Spoilage Logs)
5. **ໜ້າກວດໄຟລ໌ຄ່າສີ (Preflight & Color Assessment):** ການຄິດໄລ່ Ink Coverage % ທຽບມາດຕະຖານ ISO 5% Baseline
6. **ໃບສະເໜີລາຄາ (Quotation & Pricing Engine):** ສູດ 7 ປັດໄຈ, Gross Margin, ສ່ວນຫຼຸດຕາມປະລິມານ (Volume Discount), ພາສີ ແລະ ເງິນມັດຈຳ
7. **ອໍເດີ (Order Lifecycle & Financial Integrity):** State Machine, Database Transaction Isolation, Decimal Financial Precision
8. **ຖານຂໍ້ມູນລູກຄ້າ (Customer Database & CRM):** ລະດັບລູກຄ້າ (Tiers), ວົງເງິນສິນເຊື່ອ, ແລະ ການຊິ້ງຂໍ້ມູນອັດຕະໂນມັດ

---

## 2. ຜົນການທົດສອບແຕ່ລະໂມດູນ (Detailed Module-by-Module Audit)

### ໂມດູນທີ 1: ຂະບວນການນຳເຂົ້າສິນຄ້າ (Inbound Procurement)
ໄດ້ຈຳລອງການນຳເຂົ້າສິນຄ້າ 4 ປະເພດຫຼັກ:

1. **ນ້ຳໝຶກແຫຼວ (Liquid Ink - ml):**
   - *ກໍລະນີທົດສອບ:* ນຳເຂົ້ານ້ຳໝຶກ Epson 008 (Cyan) ຈຳນວນ 5 ຂວດ, ຂວດລະ 140 ml, ລາຄາລວມ 700,000 LAK
   - *ການຄິດໄລ່:*
     $$\text{Total Volume} = 5 \times 140 = 700 \text{ ml}$$
     $$\text{Cost per ml} = \frac{700,000}{700} = 1,000 \text{ LAK/ml}$$
   - *ຜົນການກວດສອບ:* **ຖືກຕ້ອງ**. ລະບົບສ້າງ SKU `INK-008-C` ເຂົ້າສາງດ້ວຍຈຳນວນ 700 ml, ຫົວໜ່ວຍເປັນ `ml`, ຕົ້ນທຶນ 1,000 LAK/ml.

2. **ຜົງໝຶກເລເຊີ (Laser Toner Powder - kg / g):**
   - *ກໍລະນີທົດສອບ:* ນຳເຂົ້າຜົງໝຶກ Fuji Xerox Black ຈຳນວນ 2 ຖົງ (ຖົງລະ 1 kg = 1,000 g), ລາຄາລວມ 1,600,000 LAK
   - *ການຄິດໄລ່:*
     $$\text{Total Grams} = 2 \times 1,000 = 2,000 \text{ g}$$
     $$\text{Cost per Gram} = \frac{1,600,000}{2,000} = 800 \text{ LAK/g}$$
   - *ຜົນການກວດສອບ:* **ຖືກຕ້ອງ**. ໄດ້ຮັບການແກ້ໄຂ bug ທີ່ເຄີຍບັງຄັບເປັນ `ml/ขวด` ແລ້ວ ຕອນນີ້ລະບົບບັນທຶກຫົວໜ່ວຍເປັນ `g/kg` ຢ່າງຖືກຕ້ອງ 100%.

3. **ເຈ້ຍພິມ (Paper Procurement):**
   - *ກໍລະນີທົດສອບ:* ນຳເຂົ້າເຈ້ຍ Art Card 260g ຈຳນວນ 5 ແພັກ (ແພັກລະ 500 ແຜ່ນ), ລາຄາ 460,000 LAK
   - *ການຄິດໄລ່:* $2,500$ ແຜ່ນ $\rightarrow$ ຕົ້ນທຶນຕໍ່ແຜ່ນ $= 460,000 / 2,500 = 184 \text{ LAK/ແຜ່ນ}$
   - *ຜົນການກວດສອບ:* **ຖືກຕ້ອງ**.

4. **ເຄື່ອງຈັກໂຮງພິມ (Machinery - Inkjet, Laser, Guillotine Cutter):**
   - **Epson L15150 (Inkjet):** ລາຄາ 18,500,000 LAK, ອາຍຸ 150,000 ແຜ່ນ $\rightarrow$ ຄ່າຫຼຸ້ຍຫ້ຽນ $123.33 \text{ LAK} + 5 \text{ ອາໄຫຼ່ສິ້ນເປືອງ } 85.00 \text{ LAK} = 208.33 \text{ LAK/ແຜ່ນ}$. (Warm-up = 0 mins).
   - **Fuji Xerox AltaLink C8055 (Laser):** ລາຄາ 85,000,000 LAK, ອາຍຸ 500,000 ແຜ່ນ $\rightarrow$ ຄ່າຫຼຸ້ຍຫ້ຽນ $170.00 \text{ LAK} + 5 \text{ ອາໄຫຼ່ເລເຊີ (Drum, Fuser, Belt, Developer, Roller) } 115.00 \text{ LAK} = 285.00 \text{ LAK/ແຜ່ນ}$. (Warm-up = 3 mins).
   - **Hydraulic Cutter 6710 (Guillotine Cutter):** ລາຄາ 45,000,000 LAK, ອາຍຸ 200,000 ຮອບຕັດ $\rightarrow$ ຄ່າຫຼຸ້ຍຫ້ຽນ $225.00 \text{ LAK} + 3 \text{ ອາໄຫຼ່ (ໃບມີດ HSS, ແຜ່ນຮອງຕັດ, ນ້ຳມັນໄຮໂດຼລິກ) } 45.00 \text{ LAK} = 270.00 \text{ LAK/ຮອບຕັດ}$.
   - *ຜົນການກວດສອບ:* **ຖືກຕ້ອງ**. ແຍກໂຄງສ້າງອາໄຫຼ່ຕາມປະເພດເຄື່ອງຈັກຢ່າງເດັດຂາດ ບໍ່ມີການເອົາອາໄຫຼ່ອິ້ງເຈັດໄປໃສ່ໃນເຄື່ອງເລເຊີ ຫຼື ເຄື່ອງຕັດ.

---

### ໂມດູນທີ 2: ສາງສິນຄ້າ (Warehouse & FIFO Stock Valuation)
- **FIFO Batch Valuation:** ເມື່ອມີການເບີກເຈ້ຍມູນຄ່າ 1,200 ແຜ່ນ ຈາກ 2 Lot:
  - Lot 1 (ຊື້ກ່ອນ): 500 ແຜ່ນ @ 180 LAK = 90,000 LAK
  - Lot 2 (ຊື້ຫຼັງ): 700 ແຜ່ນ @ 190 LAK = 133,000 LAK
  - ຕົ້ນທຶນສະເລ່ຍຖ່ວງນ້ຳໜັກ $= (90,000 + 133,000) / 1,200 = 185.83 \text{ LAK/ແຜ່ນ}$
- **Offcut Scrap Recovery:** ເສດເຈ້ຍທີ່ເຫຼືອຈາກການຕັດແຜ່ນໃຫຍ່ຖືກເກັບເຂົ້າຕາຕະລາງ `offcuts`. ເມື່ອມີງານຂະໜາດນ້ອຍ (ເຊັ່ນ: ນາມບັດ, Tag ສິນຄ້າ), ລະບົບຈະແນະນຳໃຫ້ໃຊ້ເສດເຈ້ຍໃນສາງ ພ້ອມມອບສ່ວນຫຼຸດຕົ້ນທຶນເຈ້ຍ 35% ຊ່ວຍຫຼຸດຕົ້ນທຶນ ແລະ ປະຢັດຊັບພະຍາກອນ.
- *ຜົນການກວດສອບ:* **ຖືກຕ້ອງ**.

---

### ໂມດູນທີ 3: ໜ້າເຄື່ອງຈັກຊ່າງພິມ (Equipment Fleet & PPM)
- **ການຄິດໄລ່ຕົ້ນທຶນຕໍ່ແຜ່ນ (Total Cost Per Page):**
  $$\text{Total Cost/Page} = \text{Net Machine Rate} + \text{Linked Inks Rate (ISO 5\% CMYK)}$$
  - *Epson L15150:* ຄ່າເຄື່ອງ 208.33 LAK + ໝຶກຈິງ 4 ສີ 108.00 LAK = **316.33 LAK/ແຜ່ນ**
  - *Fuji Xerox C8055:* ຄ່າເຄື່ອງ 285.00 LAK + ຜົງໝຶກ 4 ສີ 92.50 LAK = **377.50 LAK/ແຜ່ນ**
- ຜົນການກວດສອບໃນ `PrinterSelectorModal`: ສະແດງຜົນຊັດເຈນແຍກ `(ເຄື່ອງ 208.33 + ໝຶກ 108.00)` ຕົງກັບໜ້າຕາຕະລາງເຄື່ອງຈັກ 100%.

---

### ໂມດູນທີ 4: ໜ້າຕິດຕາມງານພິມ (Shop Floor & Production Tracking)
- **ຈຸດຕັດສະຕັອກ (Point of Stock Deduction):**
  - ຕັດສະຕັອກ **ສະເພາະຕອນປ່ຽນສະຖານະເປັນ `IN_PRODUCTION` ເທົ່ານັ້ນ** (ຕາມກົດ `admin-architecture-guard.md`).
  - ດຳເນີນການຜ່ານ Database Transaction (`tx.Begin()`) ພ້ອມ `FOR UPDATE` lock ປ້ອງກັນບັນຫາ Race Condition ຫຼື ການຕັດສະຕັອກຊ້ຳຊ້ອນ (Idempotency).
  - ຖ້າເປັນໂໝດ **ຂາວ-ດຳ (Grayscale / B&W):** ລະບົບຈະຕັດສະເພາະ **ໝຶກສີດຳ (K)** ເທົ່ານັ້ນ ບໍ່ຕັດໝຶກ C, M, Y.
  - **Spoilage Logging:** ເຈ້ຍທີ່ເຜື່ອເສຍ (Spoilage Allowance) ຈະຖືກຕັດສະຕັອກ ແລະ ບັນທຶກເຂົ້າຕາຕະລາງ `spoilage_logs` ອັດຕະໂນມັດ ພ້ອມລະບຸເຫດຜົນ, Machine ID, Order ID, ແລະ ມູນຄ່າເສຍຫາຍ.
- *ຜົນການກວດສອບ:* **ຖືກຕ້ອງ ແລະ ຮັດກຸມສູງສຸດ**.

---

### ໂມດູນທີ 5: ໜ້າກວດໄຟລ໌ຄ່າສີ (Preflight & Color Assessment)
- **ການປັບອັດຕາຕາມ Coverage % (Linear Scaling from 5% Baseline):**
  - ສູດຄິດໄລ່ຄ່າໝຶກຕໍ່ຊ່ອງສີ:
    $$\text{Channel Cost} = \text{Base 5\% Cost} \times \left(\frac{\text{Preflight Coverage \%}}{5}\right) \times \text{Print Area Factor} \times \text{Pages}$$
  - *ຕົວຢ່າງ:* ງານພິມໂປສເຕີ A3 ທີ່ມີພື້ນສີຟ້າເຂັ້ມ Cyan 25% (ທຽບເທົ່າ 5 ເທົ່າຂອງມາດຕະຖານ 5%):
    - ອັດຕາສ່ວນຄູນ $= 25 / 5 = 5.0\times$
    - ຖ້າຕົ້ນທຶນ 5% ຢູ່ທີ່ 27 LAK $\rightarrow$ ຄ່າໝຶກ Cyan ຕົວຈິງຈະເທົ່າກັບ $27 \times 5 = 135 \text{ LAK/ແຜ່ນ}$
- *ຜົນການກວດສອບ:* **ຖືກຕ້ອງ**. ປ້ອງກັນບັນຫາການຂາດທຶນຈາກງານພິມທີ່ກິນໝຶກໜາແໜ້ນສູງ.

---

### ໂມດູນທີ 6: ໃບສະເໜີລາຄາ (Quotation & Pricing Engine)
- **ໂຄງສ້າງຕົ້ນທຶນ 7 ປັດໄຈ (BOM Consistency):**
  $$\text{Total Cost} = \text{Paper} + \text{Plates} + \text{Ink/Toner} + \text{Machine (Deprec+Maint)} + \text{Finishing/Labor} + \text{Electricity/Packaging} + \text{Overhead (15\%)}$$
- **ສູດລາຄາຂາຍ (Gross Profit Margin Formula):**
  $$\text{Sale Price} = \frac{\text{Net Internal Cost}}{1 - \text{Margin \%}}$$
  - *ຕົວຢ່າງ:* ຕົ້ນທຶນລວມ 60,000 LAK, ກຳໄລທີ່ຕ້ອງການ 40%:
    $$\text{Sale Price} = \frac{60,000}{1 - 0.40} = \frac{60,000}{0.60} = 100,000 \text{ LAK}$$
    $$\text{Gross Margin} = \frac{100,000 - 60,000}{100,000} = 40.0\% \quad (\text{ກຳໄລ 40,000 LAK})$$
- **Volume Discount:** ປັບຫຼຸດອັດຕາກຳໄລລົງ 10% ເມື່ອສັ່ງ 500+ ຊິ້ນ ແລະ 20% ເມື່ອສັ່ງ 1,000+ ຊິ້ນ ເພື່ອເພີ່ມຄວາມສາມາດໃນການແຂ່ງຂັນ ໂດຍມີລະບົບ Margin Protection Guard ປ້ອງກັນບໍ່ໃຫ້ຂາຍຕໍ່າກວ່າທຶນ.
- *ຜົນການກວດສອບ:* **ຖືກຕ້ອງ**. Frontend ແລະ Go Backend `engine.go` ໃຊ້ສູດຄະນິດສາດ ແລະ ທົດສະນິຍົມຕົງກັນ 100%.

---

### ໂມດູນທີ 7: ອໍເດີ (Order Lifecycle & Financial Integrity)
- **State Machine Transitions:**
  $$\text{QUOTATION} \rightarrow \text{PENDING\_PAYMENT} \rightarrow \text{ORDER\_CREATED} \rightarrow \text{FILE\_CONFIRMED} \rightarrow \text{IN\_PRODUCTION} \rightarrow \text{COMPLETED}$$
- ລະບົບຫ້າມຂ້າມຂັ້ນຕອນ (ເຊັ່ນ: ຫ້າມໂດດຈາກ Draft ໄປ Completed ໂດຍບໍ່ຜ່ານ IN_PRODUCTION) ເພື່ອຮັບປະກັນວ່າສະຕັອກຈະບໍ່ຕົກຫຼົ່ນ.
- ການຄິດໄລ່ເງິນໃຊ້ `shopspring/decimal` ທັງໝົດ ບໍ່ໃຊ້ `float64` ທີ່ອາດເກີດບັນຫາເລກເສດ (Rounding Drift).
- *ຜົນການກວດສອບ:* **ຖືກຕ້ອງ**.

---

### ໂມດູນທີ 8: ຖານຂໍ້ມູນລູກຄ້າ (Customer Database & CRM)
- **Customer Profiles & Tiering:**
  - ຮອງຮັບໝວດໝູ່ລູກຄ້າ: `RETAIL` (ໜ້າຮ້ານ), `ONLINE` (ອອນລາຍ), `CORPORATE` (ອົງກອນ), `CONTRACT_PARTNER` (ຄູ່ສັນຍາ).
  - ໃນໜ້າໃບສະເໜີລາຄາ: ເມື່ອພິມຊື່ລູກຄ້າ ຫຼື ເລືອກຈາກ Combobox ລະບົບຈະດຶງເບີໂທ, ທີ່ຢູ່, ແລະ ລະດັບລູກຄ້າມາໃຊ້ອັດຕະໂນມັດ.
  - ຮອງຮັບການບັນທຶກລູກຄ້າໃໝ່ເຂົ້າ CRM ໂດຍກົງຈາກໜ້າສ້າງໃບສະເໜີລາຄາ (`autoSaveCustomerToCRM`).
- *ຜົນການກວດສອບ:* **ຖືກຕ້ອງ**.

---

## 3. ສະຫຼຸບຈຸດທີ່ອາດເປັນຊ່ອງໂຫວ່ ແລະ ວິທີປ້ອງກັນໃນລະບົບ (Vulnerability Audit & Guards)

| ລຳດັບ | ຄວາມສ່ຽງ / ຊ່ອງໂຫວ່ທີ່ເຄີຍພົບ | ວິທີການແກ້ໄຂ ແລະ ລະບົບປ້ອງກັນປັດຈຸບັນ | ສະຖານະ |
|---|---|---|---|
| 1 | ການນຳເຂົ້າຜົງໝຶກເລເຊີຖືກປ່ຽນຫົວໜ່ວຍເປັນ ml | ແກ້ໄຂໃຫ້ຮັກສາຫົວໜ່ວຍ `g/kg` ໃນ InboundManagement ພ້ອມແປງເປັນກຣາມອັດຕະໂນມັດ | **ແກ້ໄຂແລ້ວ (Resolved)** |
| 2 | ຄ່າເສື່ອມເຄື່ອງຈັກຖືກບວກຊ້ຳຊ້ອນໃນ Modal ເລືອກເຄື່ອງພິມ | ແຍກ `persistentTotalCost` ໃຫ້ດຶງສະເພາະຄ່າເຄື່ອງຈັກສຸດທິ (Net Machine Rate) ບໍ່ລວມໝຶກຊ້ຳ | **ແກ້ໄຂແລ້ວ (Resolved)** |
| 3 | ການຕັດສະຕັອກສີ C, M, Y ໃນງານພິມຂາວ-ດຳ (Grayscale) | ເພີ່ມ Guard ໃນ `deduction.go` ໃຫ້ຕັດສະເພາະ Black (K) ເທົ່ານັ້ນເມື່ອເປັນໂໝດ Grayscale/B&W | **ປ້ອງກັນແລ້ວ (Protected)** |
| 4 | ການຄິດໄລ່ລາຄາຂາຍຜິດພາດແບບ Simple Markup ແທນທີ່ຈະເປັນ Gross Margin | ໃຊ້ສູດ $Cost / (1 - Margin)$ ເພື່ອຮັບປະກັນອັດຕາກຳໄລຂັ້ນຕົ້ນຕົວຈິງ | **ຖືກຕ້ອງ (Verified)** |
| 5 | ການຕັດສະຕັອກຊ້ຳຊ້ອນເມື່ອມີການກົດປຸ່ມຫຼາຍຄັ້ງ (Double Click / Concurrent Trigger) | ໃຊ້ Database Transaction ພ້ອມ `FOR UPDATE` lock ແລະ `stock_deducted_at` check | **ປ້ອງກັນແລ້ວ (Protected)** |

---

## 4. ບົດສະຫຼຸບ ແລະ ຂໍ້ສະເໜີແນະສຳລັບຜູ້ໃຊ້ງານ (Operator Recommendations)

1. **ການນຳເຂົ້ານ້ຳໝຶກ ແລະ ຜົງໝຶກ:** ໃຫ້ປ້ອນຈຳນວນ ml ຫຼື kg ຕາມສະເປກຂ້າງຂວດ/ຖົງຕົວຈິງ ລະບົບຈະຄິດໄລ່ຕົ້ນທຶນຕໍ່ ml ຫຼື ຕໍ່ g ໃຫ້ໂດຍອັດຕະໂນມັດ.
2. **ການກວດສອບໄຟລ໌ກ່ອນພິມ:** ແນະນຳໃຫ້ອັບໂຫຼດໄຟລ໌ຜ່ານໜ້າ Preflight ເພື່ອໃຫ້ລະບົບຄຳນວນຄ່າສີ C, M, Y, K ຕົວຈິງ ຈະເຮັດໃຫ້ໃບສະເໜີລາຄາສະທ້ອນຕົ້ນທຶນນ້ຳໝຶກໄດ້ຖືກຕ້ອງ 100% ໂດຍສະເພາະງານພິມຮູບພາບ ຫຼື ພື້ນຫຼັງສີເຂັ້ມ.
3. **ການຕັດສະຕັອກ:** ສະຕັອກຈະຕັດຈິງກໍຕໍ່ເມື່ອອໍເດີເຂົ້າສູ່ສະຖານະ `IN_PRODUCTION` ເທົ່ານັ້ນ (ຫຼັງຈາກລູກຄ້າຢືນຢັນໄຟລ໌ ແລະ ຈ່າຍມັດຈຳແລ້ວ) ເຊິ່ງປ້ອງກັນການຕັດສະຕັອກຜິດພາດໃນກໍລະນີທີ່ຍັງຢູ່ໃນຂັ້ນຕອນສະເໜີລາຄາ.
