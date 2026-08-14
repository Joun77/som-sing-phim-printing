import React from 'react';

export default function PrinterSpecDetail({ item, currentLang }: { item: any; currentLang: string }) {
  const specs = item.specs || item.technical_specs || item || {};
  
  // Smart fallbacks from item name / item properties if specs is empty
  const rawName = item.name || item.itemName || '';
  const nameParts = rawName.trim().split(' ');
  const fallbackBrand = nameParts[0] || 'Epson';
  const fallbackModel = nameParts.slice(1).join(' ') || rawName || 'L15150';

  const brand = specs.brand || item.brand || fallbackBrand;
  const model = specs.model || item.model || fallbackModel;
  const printerCategory = specs.printerCategory || specs.printer_category || item.printerCategory || item.printer_category || 'Inkjet';
  const colorConfig = specs.color_config || specs.colorConfig || item.color_config || item.colorConfig || (item.colorSchemeType ? { colorScheme: item.colorSchemeType, slots: item.printerColorLinks } : { colorScheme: 'CMYK', slots: [
    { code: 'K', name: 'Black' },
    { code: 'C', name: 'Cyan' },
    { code: 'M', name: 'Magenta' },
    { code: 'Y', name: 'Yellow' }
  ]});
  const maintenanceRate = specs.maintenanceRatePercent !== undefined ? specs.maintenanceRatePercent : (specs.maintenance_rate !== undefined ? specs.maintenance_rate : (item.maintenanceRatePercent ?? 20));
  const expectedLife = specs.expectedLifeA4Pages !== undefined ? specs.expectedLifeA4Pages : (specs.expected_life_a4 !== undefined ? specs.expected_life_a4 : (item.expectedLifeA4Pages ?? 200000));
  const oemBaselineInks = specs.oemBaselineInks || specs.printerColorLinks || item.oemBaselineInks || item.printerColorLinks;

  const hasAnyData = brand || model || printerCategory || colorConfig || maintenanceRate !== undefined || expectedLife !== undefined;

  if (!hasAnyData) {
    return (
      <div className="text-center py-4 text-slate-400 text-xs italic">
        {currentLang === 'lo' ? 'ບໍ່ມີຂໍ້ມູນສະເປັກເຕັກນິກ (No Technical Specs Available)' : 'No Technical Specs Available'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 text-xs font-medium">
      {brand && (
        <div>
          <span className="text-slate-400 block text-[11px] font-semibold">
            {currentLang === 'lo' ? 'ແບຣນ (Brand):' : 'Brand:'}
          </span>
          <span className="text-slate-800 font-bold">{brand}</span>
        </div>
      )}
      {model && (
        <div>
          <span className="text-slate-400 block text-[11px] font-semibold">
            {currentLang === 'lo' ? 'ຮຸ່ນ (Model):' : 'Model:'}
          </span>
          <span className="text-slate-800 font-bold">{model}</span>
        </div>
      )}
      {printerCategory && (
        <div>
          <span className="text-slate-400 block text-[11px] font-semibold">
            {currentLang === 'lo' ? 'ໝວດເຄື່ອງພິມ (Printer Category):' : 'Printer Category:'}
          </span>
          <span className="text-slate-800 font-bold">{printerCategory}</span>
        </div>
      )}
      {colorConfig?.colorScheme && (
        <div>
          <span className="text-slate-400 block text-[11px] font-semibold">
            {currentLang === 'lo' ? 'ລະບົບສີ (Color Scheme):' : 'Color Scheme:'}
          </span>
          <span className="text-sky-700 font-bold">{colorConfig.colorScheme}</span>
        </div>
      )}
      {colorConfig?.slots && colorConfig.slots.length > 0 && (
        <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-slate-400 block text-[11px] font-semibold mb-1">
            {currentLang === 'lo' ? 'ຊ່ອງສີປະຈຳເຄື່ອງ (Color Slots):' : 'Color Slots:'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {colorConfig.slots.map((s: any, idx: number) => (
              <span key={s.id || s.code || idx} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700">
                {s.code || `Slot ${idx+1}`} {s.name ? `- ${s.name}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}
      {maintenanceRate !== undefined && maintenanceRate !== null && (
        <div>
          <span className="text-slate-400 block text-[11px] font-semibold">
            {currentLang === 'lo' ? 'ອັດຕາບຳລຸງຮັກສາ (Maintenance Rate):' : 'Maintenance Rate:'}
          </span>
          <span className="text-slate-800 font-bold">{maintenanceRate}%</span>
        </div>
      )}
      {expectedLife !== undefined && expectedLife !== null && (
        <div>
          <span className="text-slate-400 block text-[11px] font-semibold">
            {currentLang === 'lo' ? 'ອາຍຸການໃຊ້ງານ (Expected Life):' : 'Expected Life:'}
          </span>
          <span className="text-slate-800 font-bold">{Number(expectedLife).toLocaleString()} pages</span>
        </div>
      )}
      {Array.isArray(oemBaselineInks) && oemBaselineInks.length > 0 && (
        <div className="col-span-2 bg-sky-50/50 p-3 rounded-xl border border-sky-100 space-y-2">
          <span className="text-slate-500 block text-[11px] font-bold uppercase">
            {currentLang === 'lo' ? 'ສະເປັກໝຶກແທ້ OEM (OEM Baseline Standard Inks):' : 'OEM Baseline Standard Inks:'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {oemBaselineInks.map((ink: any, i: number) => (
              <div key={i} className="bg-white p-2 rounded-lg border border-slate-200 text-[11px]">
                <span className="font-bold text-sky-700 block">{ink.slotPosition || `Slot ${i+1}`}</span>
                <span className="text-slate-700 block font-mono">SKU: {ink.oemInkCode || ink.inkCode || '-'}</span>
                <span className="text-slate-500 text-[10px] block">Vol: {ink.oemStandardVolumeMl || ink.volume || 0}ml | Yield: {ink.oemStandardIsoYieldA4 || ink.isoYield || 0} pages</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
