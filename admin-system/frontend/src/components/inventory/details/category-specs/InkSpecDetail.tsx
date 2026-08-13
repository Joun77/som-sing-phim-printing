import React from 'react';
import { useTranslation } from 'react-i18next';

export default function InkSpecDetail({ item }: { item: any }) {
  const { i18n } = useTranslation();
  const isLao = i18n.language === 'lo';

  const specs = {
    ...(item.technical_specs || {}),
    ...(item.specs || {})
  };

  const inkCode = item.inkCode || item.sku || item.id || '-';
  const colorName = item.colorName || item.name || '-';
  const colorGroup = item.colorGroup || specs.colorGroup || 'General';
  const volume = item.volume || specs.volumePerBottle || item.purchaseMultiplier || 100;
  const inkBaseType = item.inkBaseType || specs.inkType || 'Dye';
  const isCompatible = item.isCompatible ?? (specs.isCompatible || false);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">{isLao ? 'ລະຫັດໝຶກ (Ink SKU)' : 'Ink SKU'}</span>
          <span className="font-mono text-slate-900 font-extrabold mt-0.5 block">{inkCode}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">{isLao ? 'ກຸ່ມສີ (Color Group)' : 'Color Group'}</span>
          <span className="text-slate-900 font-bold mt-0.5 block">{colorName} ({colorGroup})</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">{isLao ? 'ບໍລິມາດບັນຈຸ (Volume)' : 'Volume'}</span>
          <span className="font-mono text-sky-700 font-extrabold mt-0.5 block">{volume}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">{isLao ? 'ປະເພດໝຶກ (Ink Type)' : 'Ink Type'}</span>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="font-bold text-slate-800">{inkBaseType}</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
              isCompatible ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {isCompatible ? (isLao ? 'ໝຶກທຽບ' : 'Compatible') : (isLao ? 'ໝຶກແທ້ OEM' : 'OEM Ink')}
            </span>
          </div>
        </div>
      </div>

      {Object.keys(specs).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs font-medium">
          {Object.entries(specs).map(([k, v]) => {
            if (!v) return null;
            return (
              <div key={k}>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">{k.replace(/([A-Z])/g, ' $1')}</span>
                <span className="text-slate-800 font-bold block mt-0.5">{Array.isArray(v) ? v.join(', ') : String(v)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
