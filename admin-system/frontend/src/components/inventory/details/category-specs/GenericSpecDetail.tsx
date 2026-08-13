import React from 'react';
import { Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function GenericSpecDetail({ item }: { item: any }) {
  const { i18n } = useTranslation();
  const isLao = i18n.language === 'lo';

  const specs = item.specs || {};
  const entries = Object.entries(specs);

  if (entries.length === 0) {
    return (
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs font-semibold">
        {isLao ? 'ไม่มีข้อมูลสเปคทางเทคนิคเพิ่มเติม' : 'No additional technical specs recorded.'}
      </div>
    );
  }

  const labelMap: Record<string, string> = {
    paperFormat: isLao ? 'รูปแบบกระดาษ' : 'Paper Format',
    standardSize: isLao ? 'ขนาดมาตรฐาน' : 'Standard Size',
    grammageGsm: isLao ? 'ความหนา (GSM)' : 'Grammage (GSM)',
    sheetsPerPack: isLao ? 'จำนวนแผ่น/แพ็ค' : 'Sheets/Pack',
    rollWidthM: isLao ? 'หน้ากว้างม้วน (m)' : 'Roll Width (m)',
    rollLengthM: isLao ? 'ความยาวม้วน (m)' : 'Roll Length (m)',
    paperSurface: isLao ? 'ผิวสัมผัส' : 'Surface Finish',
    brand: isLao ? 'แบรนด์' : 'Brand',
    machineryDrive: isLao ? 'ระบบขับเคลื่อน' : 'Drive System',
    partYield: isLao ? 'อายุการใช้งานอะไหล่' : 'Part Yield'
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
