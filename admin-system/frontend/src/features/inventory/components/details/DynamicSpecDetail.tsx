import React from 'react';
import PrinterInkComparisonCard from './PrinterInkComparisonCard';

export interface DynamicSpecDetailProps {
  item: any;
  currentLang?: string;
  categoryType?: string;
}

/**
 * Consolidated Dynamic Component for Rendering Inventory Technical Specifications
 * Self-contained logic for Paper, Ink, Printer/Machine, and Generic Spec rendering.
 */
export default function DynamicSpecDetail({
  item,
  currentLang = 'lo',
  categoryType,
}: DynamicSpecDetailProps) {
  if (!item) return null;

  const resolvedCategory = (
    categoryType ||
    item.category ||
    item.categoryType ||
    ''
  ).toLowerCase();

  const specs = item.specs || item.technical_specs || item || {};

  // 1. PAPER SPEC DETAIL
  if (resolvedCategory.includes('paper') || resolvedCategory.includes('ເຈ້ຍ')) {
    const isSheet = (specs.paperFormat || specs.paper_format || 'sheet').toLowerCase() === 'sheet';

    return (
      <div className="grid grid-cols-2 gap-4 text-xs font-medium">
        <div>
          <span className="text-slate-400 block text-[11px] font-semibold">
            {currentLang === 'lo' ? 'ຮູບແບບ (Paper Format):' : 'Paper Format:'}
          </span>
          <span className="text-slate-800 font-bold">
            {isSheet ? (currentLang === 'lo' ? 'Sheet (ແຜ່ນ)' : 'Sheet') : (currentLang === 'lo' ? 'Roll (ມ້ວນ)' : 'Roll')}
          </span>
        </div>

        {isSheet ? (
          <>
            {specs.standardSize && (
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">
                  {currentLang === 'lo' ? 'ຂະໜາດມາດຕະຖານ (Standard Size):' : 'Standard Size:'}
                </span>
                <span className="text-slate-800 font-bold">{specs.standardSize}</span>
              </div>
            )}
            {(specs.sheets_per_pack || specs.sheets_per_ream || specs.sheetsPerPack) && (
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">
                  {currentLang === 'lo' ? 'ຈຳນວນແຜ່ນຕໍ່ 1 ແພັກ (Sheets/Pack):' : 'Sheets per Pack:'}
                </span>
                <span className="text-sky-700 font-black">
                  {specs.sheets_per_pack || specs.sheets_per_ream || specs.sheetsPerPack} {currentLang === 'lo' ? 'ແຜ່ນ' : 'sheets'}
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            {specs.rollWidthM && (
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">
                  {currentLang === 'lo' ? 'ຄວາມກວ້າງໜ້າເຈ້ຍມ້ວນ (Roll Width):' : 'Roll Width:'}
                </span>
                <span className="text-slate-800 font-bold">{specs.rollWidthM} m</span>
              </div>
            )}
            {specs.rollLengthM && (
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">
                  {currentLang === 'lo' ? 'ຄວາມຍາວມ້ວນ (Roll Length):' : 'Roll Length:'}
                </span>
                <span className="text-slate-800 font-bold">{specs.rollLengthM} m</span>
              </div>
            )}
          </>
        )}

        {(specs.grammageGsm || specs.grammage) && (
          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">
              {currentLang === 'lo' ? 'ຄວາມໜາ/ນ້ຳໜັກ (Grammage GSM):' : 'Grammage (GSM):'}
            </span>
            <span className="text-slate-800 font-bold">{specs.grammageGsm || specs.grammage} gsm</span>
          </div>
        )}

        {(specs.paperSurface || specs.surfaceFinish) && (
          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">
              {currentLang === 'lo' ? 'ຜິວສຳພັດ (Surface Finish):' : 'Surface Finish:'}
            </span>
            <span className="text-slate-800 font-bold">{specs.paperSurface || specs.surfaceFinish}</span>
          </div>
        )}
      </div>
    );
  }

  // 2. INK SPEC DETAIL
  if (resolvedCategory.includes('ink') || resolvedCategory.includes('ໝຶກ')) {
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

  // 3. PRINTER / MACHINE SPEC DETAIL
  if (
    resolvedCategory.includes('printer') ||
    resolvedCategory.includes('equipment') ||
    resolvedCategory.includes('เครื่อง') ||
    resolvedCategory.includes('เครื่องพิมพ์')
  ) {
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
    const expectedLife = specs.expectedLifeA4Pages !== undefined ? specs.expectedLifeA4Pages : (specs.expected_life_a4 !== undefined ? specs.expected_life_a4 : (item.expectedLifeA4Pages ?? 200000));
    const oemBaselineInks = specs.oemBaselineInks || specs.printerColorLinks || item.oemBaselineInks || item.printerColorLinks;

    const serialNumber = item.serialNumber || specs.serialNumber || item.sn;
    const assetId = item.id || specs.id;
    const price = item.price || item.purchaseCost || specs.price;
    const components = item.components || specs.components || [];

    return (
      <div className="grid grid-cols-2 gap-4 text-xs font-medium">
        {assetId && (
          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">Asset ID:</span>
            <span className="text-slate-900 font-mono font-bold">{assetId}</span>
          </div>
        )}
        {serialNumber && (
          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">Serial Number (S/N):</span>
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
              {currentLang === 'lo' ? 'ມູນຄ່າເຄື່ອງ (Asset Value):' : 'Asset Price:'}
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
              {currentLang === 'lo' ? 'SLA Component Health Wear (ສຸຂະພາບຊິ້ນສ່ວນອະໄຫຼ່):' : 'SLA Component Health Wear:'}
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

        <div className="col-span-2 pt-2">
          <PrinterInkComparisonCard printerItem={item} currentLang={currentLang} />
        </div>
      </div>
    );
  }

  // 4. GENERIC SPEC DETAIL (Fallback)
  const isLao = currentLang === 'lo';
  const genericSpecs = {
    ...(item.technical_specs || {}),
    ...(item.specs || {}),
    ...(item.inkCode ? { inkCode: item.inkCode } : {}),
    ...(item.colorName ? { colorName: item.colorName } : {}),
    ...(item.consumptionUnit ? { consumptionUnit: item.consumptionUnit } : {}),
    ...(item.purchaseUnit ? { purchaseUnit: item.purchaseUnit } : {}),
    ...(item.reorderThreshold ? { reorderThreshold: item.reorderThreshold } : {})
  };
  const entries = Object.entries(genericSpecs);

  if (entries.length === 0) {
    return (
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs font-semibold">
        {isLao ? 'ບໍ່ມີຂໍ້ມູນສະເປັກທາງເຕັກນິກເພີ່ມເຕີມ' : 'No additional technical specs recorded.'}
      </div>
    );
  }

  const labelMap: Record<string, string> = {
    paperFormat: isLao ? 'ຮູບແບບເຈ້ຍ' : 'Paper Format',
    standardSize: isLao ? 'ຂະໜາດມາດຕະຖານ' : 'Standard Size',
    grammageGsm: isLao ? 'ຄວາມໜາ (GSM)' : 'Grammage (GSM)',
    sheetsPerPack: isLao ? 'ຈຳນວນແຜ່ນ/ແພັກ' : 'Sheets/Pack',
    rollWidthM: isLao ? 'ໜ້າກວ້າງມ້ວນ (m)' : 'Roll Width (m)',
    rollLengthM: isLao ? 'ຄວາມຍາວມ້ວນ (m)' : 'Roll Length (m)',
    paperSurface: isLao ? 'ຜິວສຳພັດ' : 'Surface Finish',
    brand: isLao ? 'ແບຣນ' : 'Brand',
    machineryDrive: isLao ? 'ລະບົບຂັບເຄື່ອນ' : 'Drive System',
    partYield: isLao ? 'ອາຍຸການໃຊ້ງານອາໄຫຼ່' : 'Part Yield',
    inkCode: isLao ? 'ລະຫັດໝຶກ' : 'Ink Code',
    colorName: isLao ? 'ຊື່ສີ' : 'Color Name',
    consumptionUnit: isLao ? 'ໜ່ວຍເບີກ' : 'Consumption Unit',
    purchaseUnit: isLao ? 'ໜ່ວຍຊື້' : 'Purchase Unit',
    reorderThreshold: isLao ? 'ຈຸດເຕືອນສັ່ງຊື້' : 'Reorder Threshold'
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs">
      {entries.map(([key, val]) => {
        if (val === null || val === undefined || val === '' || key === 'tariffRate' || key === 'origin' || key === 'freightCharge') return null;
        const displayVal = Array.isArray(val) ? val.join(', ') : String(val);
        return (
          <div key={key}>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">
              {labelMap[key] || key.replace(/([A-Z])/g, ' $1')}
            </span>
            <span className="text-slate-900 font-bold mt-0.5 block">{displayVal}</span>
          </div>
        );
      })}
    </div>
  );
}
