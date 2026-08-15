import React from 'react';
import PrinterInkComparisonCard from './PrinterInkComparisonCard';

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

  const serialNumber = item.serialNumber || specs.serialNumber || item.sn;
  const assetId = item.id || specs.id;
  const price = item.price || item.purchaseCost || specs.price;
  const components = item.components || specs.components || [];

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
      {assetId && (
        <div>
          <span className="text-slate-400 block text-[11px] font-semibold">
            Asset ID:
          </span>
          <span className="text-slate-900 font-mono font-bold">{assetId}</span>
        </div>
      )}
      {serialNumber && (
        <div>
          <span className="text-slate-400 block text-[11px] font-semibold">
            Serial Number (S/N):
          </span>
          <span className="text-slate-900 font-mono font-bold">{serialNumber}</span>
        </div>
      )}
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
          <span className="text-sky-700 font-bold">{colorConfig.colorScheme} ({colorConfig.slots?.length || 4} Slots)</span>
        </div>
      )}
      {price && (
        <div>
          <span className="text-slate-400 block text-[11px] font-semibold">
            {currentLang === 'lo' ? 'มูลค่าเครื่อง (Asset Value):' : 'Asset Price:'}
          </span>
          <span className="text-emerald-700 font-mono font-bold">{Number(price).toLocaleString()} LAK</span>
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

      {colorConfig?.slots && colorConfig.slots.length > 0 && (
        <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-slate-400 block text-[11px] font-semibold mb-1">
            {currentLang === 'lo' ? 'ຊ່ອງສີປະຈຳເຄື່ອງ (Color Slots):' : 'Color Slots Configuration:'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {colorConfig.slots.map((s: any, idx: number) => (
              <span key={s.id || s.code || idx} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-800 shadow-2xs">
                {s.slotPosition || `${s.colorGroup || s.code || 'Slot'} - ${s.oemInkCode || s.name || ''}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(oemBaselineInks) && oemBaselineInks.length > 0 && (
        <div className="col-span-2 bg-sky-50/50 p-3 rounded-xl border border-sky-100 space-y-2">
          <span className="text-sky-800 block text-[11px] font-bold uppercase tracking-wider">
            {currentLang === 'lo' ? 'ສະເປັກໝຶກແທ້ OEM (OEM Baseline Standard Inks):' : 'OEM Baseline Standard Inks Mapping:'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {oemBaselineInks.map((ink: any, i: number) => (
              <div key={i} className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-0.5 shadow-2xs">
                <span className="font-bold text-sky-700 block">{ink.slotPosition || `Slot ${i+1}`}</span>
                <span className="text-slate-900 font-mono font-bold block">SKU: {ink.oemInkCode || ink.inkCode || '-'}</span>
                <span className="text-slate-500 text-[10px] block">
                  Vol: {ink.oemStandardVolumeMl || ink.volume || 0} ml | Yield: {(ink.oemStandardIsoYieldA4 || ink.isoYield || 0).toLocaleString()} pages (A4 5%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(components) && components.length > 0 && (
        <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
          <span className="text-slate-700 block text-[11px] font-bold uppercase tracking-wider">
            SLA Component Health Wear (สุขภาพชิ้นส่วนอะไหล่):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {components.map((comp: any, idx: number) => (
              <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700">{comp.name}</span>
                  <span className={comp.usage >= (comp.threshold || 90) ? 'text-red-600 font-black' : 'text-slate-900 font-mono'}>
                    {comp.usage}% / {comp.threshold || 90}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${comp.usage >= (comp.threshold || 90) ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, comp.usage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OEM vs Actual Compatible Ink Comparison Card Component */}
      <div className="col-span-2 pt-2">
        <PrinterInkComparisonCard printerItem={item} currentLang={currentLang} />
      </div>
    </div>
  );
}
