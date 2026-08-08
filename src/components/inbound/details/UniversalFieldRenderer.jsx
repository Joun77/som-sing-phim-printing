import React from 'react';

// Exclude base top-level IDs, section types already present in header badge, dates, and attachment URLs
const EXCLUDED_KEYS = new Set([
  'id', 'poId', 'type', 'inboundType', 'typeId', 'itemPhoto', 'itemPhotoUrl', 'imageUrl', 
  'paymentSlip', 'paymentSlipUrl', 'slipUrl', 'batches', 'date', 'purchaseDate'
]);

// Map alias keys to a single canonical field identifier
const ALIAS_MAP = {
  name: 'itemName',
  machineName: 'itemName',
  materialName: 'itemName',
  costPerUnit: 'unitPrice',
  purchasePrice: 'unitPrice',
  totalPrice: 'totalCost',
  purchaseCost: 'totalCost',
  quantity: 'qty',
  initialQty: 'qty',
  category: 'materialType',
  categoryType: 'materialType',
  itemType: 'materialType',
  machineCategory: 'equipmentCategory'
};

// Bilingual label translation map for standard base properties
const BASE_LABEL_MAP = {
  materialType: { lo: 'ໝວດ / ປະເພດວັດສະດຸ', en: 'Material Category / Sub-type' },
  equipmentCategory: { lo: 'ໝວດເຄື່ອງຈັກ', en: 'Equipment Category' },
  itemName: { lo: 'ຊື່ລາຍການ / ອຸປະກອນ', en: 'Item / Machine Name' },
  paperSpec: { lo: 'ປະເພດເຈ້ຍ', en: 'Paper Spec' },
  unitPrice: { lo: 'ລາຄາຕໍ່ໜ່ວຍ', en: 'Unit Price' },
  qty: { lo: 'ຈຳນວນນຳເຂົ້າ', en: 'Inbound Qty' },
  unitName: { lo: 'ໜ່ວຍນັບ', en: 'Unit Name' },
  purchaseUnit: { lo: 'ໜ່ວຍນັບ', en: 'Purchase Unit' },
  totalCost: { lo: 'ມູນຄ່າລວມ', en: 'Total Amount' },
  supplierName: { lo: 'ຊື່ຜູ້ສະໜອງ', en: 'Supplier Name' },
  supplierContact: { lo: 'ຊ່ອງທາງຕິດຕໍ່ / ໝາຍເຫດ', en: 'Supplier Contact / Note' },
  lifespanYears: { lo: 'ອາຍຸໃຊ້ງານ (ປີ)', en: 'Lifespan (Years)' },
  printedPagesCapacity: { lo: 'ຄວາມຈຸລວມ (ແຜ່ນ)', en: 'Lifetime Capacity (Pages)' },
  lifetimeCapacity: { lo: 'ຄວາມຈຸລວມ (ແຜ່ນ)', en: 'Lifetime Capacity (Pages)' },
  inkType: { lo: 'ປະເພດໝຶກ', en: 'Ink Type' },
  printTech: { lo: 'ລະບົບພິມ', en: 'Print Technology' },
  maxWidth: { lo: 'ໜ້າກວ້າງສູງສຸດ', en: 'Max Width' },
  blackYieldPages: { lo: 'Yield ໝຶກດຳ (ແຜ່ນ ISO 5%)', en: 'Black Yield Pages (ISO 5%)' },
  blackCapacityMl: { lo: 'ຄວາມຈຸໝຶກດຳ (ml)', en: 'Black Capacity (ml)' },
  colorYieldPages: { lo: 'Yield ໝຶກສີ (ແຜ່ນ ISO 5%)', en: 'Color Yield Pages (ISO 5%)' },
  colorCapacityMl: { lo: 'ຄວາມຈຸໝຶກສີ (ml)', en: 'Color Capacity (ml)' },
  clickRateBW: { lo: 'Rate/BW (₭/ແຜ່ນ)', en: 'Click Rate/BW (₭/sheet)' },
  clickRateColor: { lo: 'Rate/Color (₭/ແຜ່ນ)', en: 'Click Rate/Color (₭/sheet)' },
  linkedInkSku: { lo: 'ລະຫັດໝຶກໃນຄັງ (Linked SKU)', en: 'Linked Ink SKU' },
  cutCapacity: { lo: 'ຄວາມຈຸຕັດ (ແຜ່ນ)', en: 'Cut Capacity (Sheets)' },
  bladeDepreciationPerCut: { lo: 'ຄ່າເສື່ອມ/ຕັດ (LAK)', en: 'Blade Dep. Per Cut' },
  laminationWidth: { lo: 'ໜ້າກວ້າງເຄື່ອງເຄືອບ', en: 'Lamination Width' },
  bindingMethod: { lo: 'ວິທີເຂົ້າເລົ່ມ', en: 'Binding Method' },
  gsm: { lo: 'ນ້ຳໜັກເຈ້ຍ (GSM)', en: 'Paper Weight (GSM)' },
  inkVolumeMl: { lo: 'ຄວາມຈຸໝຶກ (ml)', en: 'Ink Volume (ml)' },
  rollWidthMm: { lo: 'ໜ້າກວ້າງມ້ວນ (mm)', en: 'Roll Width (mm)' },
  yieldPages: { lo: 'Yield ແຜ່ນພິມ', en: 'Yield Pages' },
  powerRatingKw: { lo: 'ກຳລັງໄຟຟ້າ (kW)', en: 'Power Rating (kW)' },
  maxSpeedPph: { lo: 'ຄວາມໄວສູງສຸດ (PPH)', en: 'Max Speed (PPH)' }
};

export function resolveBilingualLabel(canonicalKey, lang = 'lo') {
  if (BASE_LABEL_MAP[canonicalKey]) {
    return BASE_LABEL_MAP[canonicalKey][lang] || BASE_LABEL_MAP[canonicalKey].lo;
  }
  return canonicalKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

export function formatValue(value, key = '', item = {}, lang = 'lo') {
  const emptyPlaceholder = lang === 'en' ? 'No Data' : 'ບໍ່ມີຂໍ້ມູນ';
  const isEmptyValue = value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

  if (isEmptyValue) {
    return <span className="text-slate-400 italic font-normal">{emptyPlaceholder}</span>;
  }

  if (typeof value === 'boolean') return value ? 'Yes' : 'No';

  if (typeof value === 'number') {
    const k = key.toLowerCase();
    if (k.includes('cost') || k.includes('price') || k.includes('rate') || k.includes('depreciation')) {
      return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value).replace('LAK', '₭');
    }
    // Only append unitName if explicitly recorded on item
    if ((key === 'qty' || key === 'quantity') && item.unitName) {
      return `${value.toLocaleString()} ${item.unitName}`;
    }
    return value.toLocaleString();
  }

  if (typeof value === 'object' && value !== null) {
    if (value.lo || value.en) {
      return lang === 'en' ? (value.en || value.lo) : (value.lo || value.en);
    }
    return JSON.stringify(value);
  }

  return String(value);
}

export default function UniversalFieldRenderer({ item, lang = 'lo' }) {
  if (!item || typeof item !== 'object') return null;

  const seenCanonicalKeys = new Set();
  const fieldsList = [];

  // 1. Process customSpecs entries dynamically
  if (item.customSpecs && typeof item.customSpecs === 'object') {
    Object.entries(item.customSpecs).forEach(([key, specObj]) => {
      const canonicalKey = ALIAS_MAP[key] || key;
      if (seenCanonicalKeys.has(canonicalKey) || EXCLUDED_KEYS.has(canonicalKey)) return;

      let labelText = resolveBilingualLabel(canonicalKey, lang);
      let valText = specObj;

      if (specObj && typeof specObj === 'object' && !Array.isArray(specObj) && (specObj.label !== undefined || specObj.value !== undefined)) {
        const labelObj = specObj.label;
        if (labelObj && typeof labelObj === 'object') {
          labelText = lang === 'en' ? (labelObj.en || labelObj.lo) : (labelObj.lo || labelObj.en);
        } else if (labelObj) {
          labelText = String(labelObj);
        }
        valText = specObj.value;
      }

      seenCanonicalKeys.add(canonicalKey);
      fieldsList.push({
        key: canonicalKey,
        label: labelText,
        value: formatValue(valText, canonicalKey, item, lang),
        isCustom: true
      });
    });
  }

  // 2. Process top-level item properties with deduplication
  Object.entries(item).forEach(([key, val]) => {
    if (EXCLUDED_KEYS.has(key) || key === 'customSpecs') return;

    const canonicalKey = ALIAS_MAP[key] || key;
    if (seenCanonicalKeys.has(canonicalKey) || EXCLUDED_KEYS.has(canonicalKey)) return;

    seenCanonicalKeys.add(canonicalKey);
    fieldsList.push({
      key: canonicalKey,
      label: resolveBilingualLabel(canonicalKey, lang),
      value: formatValue(val, canonicalKey, item, lang),
      isCustom: false
    });
  });

  if (fieldsList.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-black text-slate-900 tracking-wider">
        {lang === 'en'
          ? `Recorded Item Attributes & Specifications (${fieldsList.length} Unique Fields)`
          : `ລາຍລະອຽດຂໍ້ມູນສະເພາະທີບັນທຶກ (${fieldsList.length} ຟິວ)`}
      </h4>

      {/* Deduplicated Universal Responsive N-Grid Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {fieldsList.map((field, idx) => (
          <div
            key={`${field.key}-${idx}`}
            className={`p-4 rounded-2xl border transition shadow-sm ${
              field.isCustom
                ? 'bg-purple-50/50 border-purple-200'
                : 'bg-white border-slate-200'
            }`}
          >
            <span className={`text-[10px] font-black tracking-wider block ${
              field.isCustom ? 'text-purple-700' : 'text-slate-400'
            }`}>
              {field.label}
            </span>
            <div className="text-sm font-black text-slate-900 mt-1 break-words">
              {field.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
