import React from 'react';
import { useTranslation } from 'react-i18next';

export default function GenericSpecDetail({ item }: { item: any }) {
  const { i18n } = useTranslation();
  const isLao = i18n.language === 'lo';

  const specs = {
    ...(item.technical_specs || {}),
    ...(item.specs || {}),
    ...(item.inkCode ? { inkCode: item.inkCode } : {}),
    ...(item.colorName ? { colorName: item.colorName } : {}),
    ...(item.consumptionUnit ? { consumptionUnit: item.consumptionUnit } : {}),
    ...(item.purchaseUnit ? { purchaseUnit: item.purchaseUnit } : {}),
    ...(item.reorderThreshold ? { reorderThreshold: item.reorderThreshold } : {})
  };
  const entries = Object.entries(specs);

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
    paperSurface: isLao ? 'ຜິວສຳຜັດ' : 'Surface Finish',
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
        if (val === null || val === undefined || val === '') return null;
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
