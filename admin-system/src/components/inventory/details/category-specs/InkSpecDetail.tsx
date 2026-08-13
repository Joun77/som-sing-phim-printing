import React from 'react';
import { Droplet, Tag, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function InkSpecDetail({ item }: { item: any }) {
  const { i18n } = useTranslation();
  const isLao = i18n.language === 'lo';

  const inkCode = item.inkCode || item.id || '-';
  const colorName = item.colorName || item.name || '-';
  const colorGroup = item.colorGroup || 'General';
  const volume = item.volume || 100;
  const inkBaseType = item.inkBaseType || 'Dye';
  const isCompatible = item.isCompatible ?? false;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-xs">
      <div>
        <span className="text-slate-400 block text-[10px] font-bold uppercase">{isLao ? 'รหัสหมึก (Ink SKU)' : 'Ink SKU'}</span>
        <span className="font-mono text-slate-900 font-extrabold mt-0.5 block">{inkCode}</span>
      </div>
      <div>
        <span className="text-slate-400 block text-[10px] font-bold uppercase">{isLao ? 'กลุ่มสี (Color Group)' : 'Color Group'}</span>
        <span className="text-slate-900 font-bold mt-0.5 block">{colorName} ({colorGroup})</span>
      </div>
      <div>
        <span className="text-slate-400 block text-[10px] font-bold uppercase">{isLao ? 'ปริมาณบรรจุ (Volume)' : 'Volume'}</span>
        <span className="font-mono text-sky-700 font-extrabold mt-0.5 block">{volume} ml</span>
      </div>
      <div>
        <span className="text-slate-400 block text-[10px] font-bold uppercase">{isLao ? 'ประเภทหมึก (Ink Type)' : 'Ink Type'}</span>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="font-bold text-slate-800">{inkBaseType}</span>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
            isCompatible ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {isCompatible ? (isLao ? 'หมึกเทียบ' : 'Compatible') : (isLao ? 'หมึกแท้ OEM' : 'OEM Ink')}
          </span>
        </div>
      </div>
    </div>
  );
}
