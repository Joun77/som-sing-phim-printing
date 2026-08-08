import React from 'react';

const EXCLUDED_KEYS = new Set([
  'id', 'poId', 'itemPhoto', 'itemPhotoUrl', 'imageUrl', 'paymentSlip', 
  'paymentSlipUrl', 'slipUrl', 'batches'
]);

export function formatKeyLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

export function formatValue(value, key = '') {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    if (key.toLowerCase().includes('cost') || key.toLowerCase().includes('price') || key.toLowerCase().includes('rate')) {
      return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(value).replace('LAK', '₭');
    }
    return value.toLocaleString();
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function UniversalFieldRenderer({ item, lang = 'lo' }) {
  if (!item || typeof item !== 'object') return null;

  const fieldsList = [];

  // 1. Process customSpecs entries first (bilingual dynamic field objects)
  if (item.customSpecs && typeof item.customSpecs === 'object') {
    Object.entries(item.customSpecs).forEach(([key, specObj]) => {
      let labelText = key;
      let valText = specObj;

      if (specObj && typeof specObj === 'object' && !Array.isArray(specObj)) {
        const labelObj = specObj.label;
        if (labelObj && typeof labelObj === 'object') {
          labelText = lang === 'en' ? (labelObj.en || labelObj.lo) : (labelObj.lo || labelObj.en);
        } else if (labelObj) {
          labelText = String(labelObj);
        }
        valText = specObj.value;
      }

      if (valText !== undefined && valText !== null && valText !== '') {
        fieldsList.push({
          key,
          label: labelText,
          value: formatValue(valText, key),
          isCustom: true
        });
      }
    });
  }

  // 2. Process all remaining top-level primitive keys
  Object.entries(item).forEach(([key, val]) => {
    if (EXCLUDED_KEYS.has(key) || key === 'customSpecs') return;
    if (val === undefined || val === null || val === '') return;

    // Check if this key was already rendered in customSpecs
    const existsInCustom = fieldsList.some(f => f.key === key);
    if (!existsInCustom) {
      fieldsList.push({
        key,
        label: formatKeyLabel(key),
        value: formatValue(val, key),
        isCustom: false
      });
    }
  });

  if (fieldsList.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
        {lang === 'en'
          ? `Recorded Attributes & Specs (${fieldsList.length} Fields)`
          : `ລາຍລະອຽດຂໍ້ມູນທີບັນທຶກທັງໝົດ (${fieldsList.length} ຟິວ)`}
      </h4>

      {/* Universal Responsive N-Grid Container */}
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
            <span className={`text-[10px] font-black uppercase tracking-wider block ${
              field.isCustom ? 'text-purple-700' : 'text-slate-400'
            }`}>
              {field.label}
            </span>
            <p className="text-sm font-black text-slate-900 mt-1 break-words">
              {field.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
