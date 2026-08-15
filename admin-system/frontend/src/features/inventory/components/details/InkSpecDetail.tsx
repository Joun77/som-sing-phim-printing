import React from 'react';

export default function InkSpecDetail({ item, currentLang }: { item: any; currentLang: string }) {
  const specs = item.specs || item.technical_specs || item || {};
  const inkCode = specs.inkCode || item.sku || item.id;
  const colorName = specs.colorName || item.name;
  const colorGroup = specs.colorGroup || item.colorGroup;
  const volume = specs.volume || item.volume;
  const inkBaseType = specs.inkBaseType || item.inkBaseType;
  const isCompatible = specs.isCompatible !== undefined ? specs.isCompatible : item.isCompatible;

  return (
    <div className="grid grid-cols-2 gap-4 text-xs font-medium">
      {inkCode && (
        <div>
          <span className="text-slate-400 block text-[11px] font-semibold">
            {currentLang === 'lo' ? 'ລະຫັດໝຶກ (Ink Code / SKU):' : 'Ink Code:'}
          </span>
          <span className="text-slate-800 font-bold">{inkCode}</span>
        </div>
      )}
      {colorName && (
        <div>
          <span className="text-slate-400 block text-[11px] font-semibold">
            {currentLang === 'lo' ? 'ຊື່ສີ (Color Name):' : 'Color Name:'}
          </span>
          <span className="text-slate-800 font-bold">{colorName}</span>
        </div>
      )}
      {colorGroup && (
        <div>
          <span className="text-slate-400 block text-[11px] font-semibold">
            {currentLang === 'lo' ? 'ກຸ່ມສີ (Color Group):' : 'Color Group:'}
          </span>
          <span className="text-slate-800 font-bold">{colorGroup}</span>
        </div>
      )}
      {volume && (
        <div>
          <span className="text-slate-400 block text-[11px] font-semibold">
            {currentLang === 'lo' ? 'ບໍລິມາດ (Volume per Bottle):' : 'Volume per Bottle:'}
          </span>
          <span className="text-slate-800 font-bold">{volume} ml</span>
        </div>
      )}
      {inkBaseType && (
        <div>
          <span className="text-slate-400 block text-[11px] font-semibold">
            {currentLang === 'lo' ? 'ຊະນິດໝຶກ (Ink Base Type):' : 'Ink Base Type:'}
          </span>
          <span className="text-slate-800 font-bold">{inkBaseType}</span>
        </div>
      )}
      {isCompatible !== undefined && (
        <div>
          <span className="text-slate-400 block text-[11px] font-semibold">
            {currentLang === 'lo' ? 'ມາດຕະຖານໝຶກ (Ink Spec Standard):' : 'Ink Standard:'}
          </span>
          <span className="text-emerald-600 font-extrabold">
            {isCompatible ? (currentLang === 'lo' ? 'Compatible (ໝຶກທຽບ)' : 'Compatible') : (currentLang === 'lo' ? 'OEM (ໝຶກແທ້)' : 'OEM')}
          </span>
        </div>
      )}
    </div>
  );
}
