import React from 'react';

const EXCLUDED_KEYS = new Set([
  'id', 'poId', 'type', 'categoryType', 'inboundType', 'itemType', 
  'materialType', 'paperSpec', 'category', 'subCategory', 'machineCategory', 
  'equipmentCategory', 'itemName', 'name', 'machineName', 'supplierName', 
  'supplierContact', 'itemPhoto', 'itemPhotoUrl', 'imageUrl', 'paymentSlip', 
  'paymentSlipUrl', 'slipUrl', 'date', 'purchaseDate', 'unitPrice', 'costPerUnit', 
  'purchasePrice', 'totalCost', 'totalPrice', 'purchaseCost', 'qty', 'quantity', 
  'initialQty', 'unitName', 'purchaseUnit', 'batches', 'customSpecs'
]);

export function formatKeyLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

export function formatValue(value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function DynamicKeyValueGrid({ item, customExclusions = [], lang = 'lo' }) {
  if (!item || typeof item !== 'object') return null;

  const excluded = new Set([...EXCLUDED_KEYS, ...customExclusions]);
  const entries = Object.entries(item).filter(([k, v]) => {
    return !excluded.has(k) && v !== null && v !== undefined && v !== '';
  });

  const customSpecs = item?.customSpecs || {};
  const customEntries = Object.entries(customSpecs);

  if (entries.length === 0 && customEntries.length === 0) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
        {lang === 'lo' ? 'ຄຸນລັກສະນະເພີ່ມເຕີມ / Custom Specifications' : 'Custom Specifications & Attributes'}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Render standard key-value entries */}
        {entries.map(([key, val]) => (
          <div key={key} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              {formatKeyLabel(key)}
            </span>
            <span className="text-xs font-bold text-slate-800 break-words block">
              {formatValue(val)}
            </span>
          </div>
        ))}

        {/* Render bilingual customSpecs entries */}
        {customEntries.map(([key, specObj]) => {
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

          return (
            <div key={key} className="bg-white p-3 rounded-xl border border-purple-200 space-y-1">
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider block">
                {labelText}
              </span>
              <span className="text-xs font-bold text-slate-900 break-words block">
                {formatValue(valText)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
