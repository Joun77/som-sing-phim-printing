---
trigger: manual
---

📋 Task Spec: Refactor Custom Color Configurator, Add Purchasing Proof Fields & Full Dual-Language Support (Lao/English)🎯 ObjectiveComponent Extraction: Separate the "Custom Color Addition & Slot Configuration" logic into a reusable React component (ColorSlotConfigurator.tsx) to improve code modularity, state isolation, and maintainability.Field Additions: Add 4 new purchasing & proof fields to the Printer Inbound Form:Actual Product Images / รูปภาพสินค้าตัวจริง / ຮູບພາບສິນຄ້າຕົວຈິງ (actual_images)Payment Slip / Proof of Payment / ຫຼັກຖານການຈ່າຍເງິນ (payment_slip)Supplier Phone Number / เบอร์โทรติดต่อผู้ขาย / ເບີໂທຕິດຕໍ່ຜູ້ຂາຍ (supplier_phone)Purchase Link / URL / ลิงก์ช่องทางการซื้อ / ລິ້ງຊ່ອງທາງການຊື້ (purchase_link)Language & i18n Consistency (Lao & English): Ensure 100% strict dual-language support (lo and en). If the UI language is Lao, all labels, placeholders, tooltips, buttons, and helper texts MUST be in Lao. If set to English, all elements MUST be in English.🏗️ Architecture & Component Design1. New Component: ColorSlotConfigurator.tsxFile Location: frontend/src/components/inventory/forms/common/ColorSlotConfigurator.tsxProps Interfaceexport interface ColorSlot {
  id: string;
  code: string;       // e.g., "K", "C", "M", "Y", "W", "V", "LC", "LM"
  name: string;       // e.g., "Black", "Cyan", "White", "Varnish"
  hexColor?: string;  // e.g., "#000000", "#00FFFF", "#FFFFFF"
}

export interface ColorSlotConfiguratorProps {
  colorScheme: string; // e.g., "CMYK", "CMYK+W", "CMYK+W+V", "CUSTOM"
  slots: ColorSlot[];
  onSchemeChange: (scheme: string) => void;
  onSlotsChange: (slots: ColorSlot[]) => void;
  readOnly?: boolean;
}
Key CapabilitiesPreset Selection: Buttons / Dropdown for standard color presets (CMYK, CMYK+W, CMYK+W+V, K-Only).Custom Color Modal / Inline Form: Button + เพิ่มสีเอง / + ເພີ່ມສີເອງ / + Add Custom Color opening an in-place popover or modal to specify:Color Code/Tag (e.g., W, OR, GR, LCL)Color Display Name (e.g., Orange, Light Black, White, Varnish)Hex Color Picker / Preset SwatchesSlot Management: Reorder slots, delete slot, and auto-update TOTAL COLOR SLOTS count.Sync with OEM Ink Slots: When color slots are added or removed, automatically sync with the OEM Baseline Specs list (slots -> oemBaselineInks).📝 Complete Form Structure Specification (Printer Inbound Form)Group 1: Machine & Asset Profile (ข้อมูลเครื่องจักร / ຂໍ້ມູນເຄື່ອງຈັກ)FieldTypeOptions / PlaceholderRequiredasset_idTexte.g. PRN-2172Yesserial_numberTextUnique S/NYesbrandTexte.g. Epson, RolandYesmodelTexte.g. TrueVIS VG3Yesprinter_categoryDropdownLaser, Inkjet, UV Flatbed, SublimationNocolor_configComponentIntegrated <ColorSlotConfigurator />Yesexpected_life_a4Numbere.g. 500000 (Pages)Nomaintenance_rateNumber (%)e.g. 20 (%)Nolocation_deptTexte.g. Main Dept / ແຜນກຕົ້ນNoGroup 2: OEM Baseline Specs (สเปกหมึกแท้มาตรฐาน / ສະເປັກໝຶກແທ້standard)Dynamic list bound to color_config.slots. For each slot:Slot Label: e.g., Slot 1 (K - Black)OEM Ink SKU / Model: Text Input (e.g. EPSON-008-BK)OEM Standard Vol. (ml): Number Input (e.g. 127)OEM Standard ISO Yield (Pages): Number Input (e.g. 7500)Calculated Base Rate: Auto-calculated (Vol / Yield) ml/pageGroup 3: Purchasing, Proofs & Media (ข้อมูลจัดซื้อ หลักฐาน และรูปภาพ / ຂໍ້ມູນຈັດຊື້ ຫຼັກຖານ ແລະ ຮູບພາບ) ⭐ UpdatedField KeyComponent / TypeDescription / AcceptRequiredimport_qtyNumber InputDefault: 1Yesimport_costNumber + CurrencyValue + Currency Select (LAK, THB, USD)Yesactual_imagesFile Upload (Multi)Image dropzone with thumbnails & preview (image/*)Nopayment_slipFile Upload (Single)Upload slip/invoice (image/*, application/pdf)Nosupplier_phoneTel / Text Inpute.g. +856 20 12345678 or 02-123-4567Nopurchase_linkURL InputPurchase URL with "Open Link" buttonNo🌐 Internationalization (i18n) Translations (Lao & English)To maintain strict language consistency, update lo.json and en.json under frontend/src/locales/:Lao Translation Keys (lo.json){
  "inbound": {
    "printer": {
      "title": "ນຳເຂົ້າສິນຄ້າ / ອຸປະກອນໃໝ່ (Dynamic Inbound Form)",
      "asset_id": "ASSET ID / ລະຫັດສິນຊັບ",
      "serial_number": "SERIAL NUMBER (S/N) / ເລກຊີຣຽວ",
      "brand": "BRAND / ແບຣນ",
      "model": "MODEL / ຮຸ່ນ",
      "category": "PRINTER CATEGORY / ປະເພດເຄື່ອງພິມ",
      "color_scheme": "COLOR SCHEME / ລະບົບສີ",
      "add_custom_color": "+ ເພີ່ມສີເອງ",
      "total_color_slots": "TOTAL COLOR SLOTS / ຈຳນວນຊ່ອງສີ",
      "expected_life": "EXPECTED LIFE A4 PAGES / ອາຍຸການໃຊ້ງານ (ໜ້າ A4)",
      "maintenance_rate": "MAINTENANCE RATE % / ອັດຕາຄ່າບຳລຸງຮັກສາ %",
      "location_dept": "LOCATION / DEPT / ສະຖານທີ່ / ແຜນກ",
      "oem_specs_title": "ສະເປັກໝຶກແທ້ໂຮງງານ (OEM BASELINE STANDARD SPECS)",
      "oem_specs_subtitle": "ລະບຸສະເປັກໝຶກແທ້ໂຮງງານປະຈຳຮຸ່ນ ເພື່ອຄຳນວນອັດຕາກິນໝຶກມາດຕະຖານຕໍ່ແຜ່ນ",
      "oem_sku": "1) OEM INK SKU / MODEL",
      "oem_vol": "2) OEM STANDARD VOL. (ML)",
      "oem_yield": "3) OEM STANDARD ISO YIELD (PAGES)",
      "base_rate": "Base Rate / ອັດຕາກິນໝຶກ",
      "purchasing_section": "ຂໍ້ມູນຈັດຊື້ & ຫຼັກຖານ (PURCHASING & PROOFS)",
      "import_qty": "ຈຳນວນນຳເຂົ້າ (IMPORT QTY)",
      "import_cost": "ຕົ້ນທຶນນຳເຂົ້າ (IMPORT COST)",
      "actual_images": "ຮູບພາບສິນຄ້າຕົວຈິງ (ACTUAL PRODUCT IMAGES)",
      "payment_slip": "ຫຼັກຖານການຈ່າຍເງິນ (PAYMENT SLIP / PROOF)",
      "supplier_phone": "ເບີໂທຕິດຕໍ່ຜູ້ຂາຍ (SUPPLIER PHONE)",
      "purchase_link": "ລິ້ງ / ຊ່ອງທາງການຊື້ (PURCHASE LINK)",
      "open_link": "ເປີດລິ້ງ",
      "upload_placeholder": "ລາກແຟ້ມມາໃສ່ທີ່ນີ້ ຫຼື ກົດເພື່ອອັບໂຫຼດ",
      "add_color_modal": {
        "title": "ເພີ່ມສີກຳນົດເອງ",
        "code": "ລະຫັດສີ (Code / Tag)",
        "name": "ຊື່ສີ (Color Name)",
        "picker": "ເລືອກສີ (Hex Color)",
        "add_btn": "ເພີ່ມສີ",
        "cancel": "ຍົກເລີກ"
      }
    }
  }
}
English Translation Keys (en.json){
  "inbound": {
    "printer": {
      "title": "Dynamic Inbound Form (New Product Mode)",
      "asset_id": "ASSET ID",
      "serial_number": "SERIAL NUMBER (S/N)",
      "brand": "BRAND",
      "model": "MODEL",
      "category": "PRINTER CATEGORY",
      "color_scheme": "COLOR SCHEME",
      "add_custom_color": "+ Add Custom Color",
      "total_color_slots": "TOTAL COLOR SLOTS",
      "expected_life": "EXPECTED LIFE A4 PAGES",
      "maintenance_rate": "MAINTENANCE RATE %",
      "location_dept": "LOCATION / DEPT",
      "oem_specs_title": "OEM BASELINE STANDARD SPECS",
      "oem_specs_subtitle": "Specify OEM ink specs to calculate base consumption rate per page",
      "oem_sku": "1) OEM INK SKU / MODEL",
      "oem_vol": "2) OEM STANDARD VOL. (ML)",
      "oem_yield": "3) OEM STANDARD ISO YIELD (PAGES)",
      "base_rate": "Base Rate",
      "purchasing_section": "PURCHASING & PROOFS",
      "import_qty": "IMPORT QTY",
      "import_cost": "IMPORT COST",
      "actual_images": "ACTUAL PRODUCT IMAGES",
      "payment_slip": "PAYMENT SLIP / PROOF",
      "supplier_phone": "SUPPLIER PHONE NUMBER",
      "purchase_link": "PURCHASE LINK / URL",
      "open_link": "Open Link",
      "upload_placeholder": "Drag & drop files here or click to upload",
      "add_color_modal": {
        "title": "Add Custom Color Slot",
        "code": "Color Code / Tag",
        "name": "Color Name",
        "picker": "Hex Color",
        "add_btn": "Add Color",
        "cancel": "Cancel"
      }
    }
  }
}
🛠️ Step-by-Step Implementation InstructionsStep 1: Update TypeScript DefinitionsModify frontend/src/types/inventory.ts & frontend/src/types/inbound.ts:Add ColorSlot and ColorConfig interfaces.Add actual_images?: string[], payment_slip?: string, supplier_phone?: string, and purchase_link?: string to PrinterSpec and InboundFormData.Step 2: Create Reusable ColorSlotConfigurator.tsxCreate frontend/src/components/inventory/forms/common/ColorSlotConfigurator.tsx:Build UI for Preset Selection (CMYK, CMYK+W, CMYK+W+V, Custom).Implement "+ เิ่พิ่มสีเอง" / "+ ເພີ່ມສີເອງ" / "+ Add Custom Color" popover/modal control.Emit onSlotsChange whenever color slots are added, reordered, or deleted.Step 3: Integrate into Printer Inbound Form & Apply i18nUpdate frontend/src/components/inventory/forms/category-specs/PrinterSpecForm.tsx (or ImportForm.tsx):Replace inline color buttons with <ColorSlotConfigurator />.Add section: ข้อมูลจัดซื้อ & หลักฐาน (Purchasing & Proofs) at the bottom.Implement File Upload / Image dropzones with previews for actual_images and payment_slip.Add inputs for supplier_phone and purchase_link (with clickable "Open Link" button).Use useTranslation() from react-i18next across all UI labels to guarantee 100% language consistency.🔍 Inspector Verification Prompt & Audit ChecklistInstructions for the Auditor/Reviewer:Copy and run the following verification prompt after the code implementation is completed to verify all requirements.Auditor Prompt:Please audit the Printer Inbound Form and ColorSlotConfigurator implementation against the specification:

1. **Custom Color Component Inspection**:
   - [ ] Is `ColorSlotConfigurator.tsx` extracted into a separate, reusable component file?
   - [ ] Does selecting preset color schemes (CMYK, CMYK+W, etc.) correctly update the color slots and auto-sync with the OEM Ink Baseline cards?
   - [ ] Does clicking "+ เพิ่มสีเอง" / "+ ເພີ່ມສີເອງ" / "+ Add Custom Color" open a modal/popover to input custom color code, name, and hex color?

2. **Purchasing & Proofs Field Addition**:
   - [ ] Are all 4 new fields present under "Purchasing & Proofs" (`actual_images`, `payment_slip`, `supplier_phone`, `purchase_link`)?
   - [ ] Does uploading product images display image thumbnail previews?
   - [ ] Does uploading a payment slip show file status / preview?
   - [ ] Does entering a purchase link enable an external "Open Link" button?

3. **Language Consistency (Lao & English)**:
   - [ ] Is `useTranslation()` applied to all form labels, placeholders, titles, and buttons?
   - [ ] When switching language to Lao (`lo`), are all texts displayed strictly in Lao without untranslated Thai/English artifacts?
   - [ ] When switching language to English (`en`), are all texts displayed strictly in English?

4. **Payload & Data Flow**:
   - [ ] Does submitting the form include `color_config`, `oemBaselineInks`, `actual_images`, `payment_slip`, `supplier_phone`, and `purchase_link` in the final request payload?
