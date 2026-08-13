import React from 'react';
import { Layers, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PrinterSpecDetail({ item, colorLinks = [] }: { item: any; colorLinks?: any[] }) {
  const { i18n } = useTranslation();
  const isLao = i18n.language === 'lo';

  const specs = item.specs || {};
  const brand = item.brand || specs.brand || '-';
  const model = item.model || specs.model || '-';
  const colorScheme = item.colorSchemeType || specs.colorSchemeType || 'CMYK';
  const totalSlots = item.totalColorSlots || specs.totalColorSlots || 4;
  const expectedLife = item.expectedLifeA4Pages || item.printedPagesCapacity || item.TargetTotalPages || 500000;
  const maintenanceRate = item.maintenanceRatePercent || 20;
  const location = item.location || specs.location || 'Main Dept';

  // Filter color links matching this printer asset ID
  const printerLinks = colorLinks.filter(l => l.assetId === item.id);
  const slotsData = item.oemBaselineSpecs?.slots || printerLinks;

  const components = item.components || [
    { name: 'Drum Unit (ຊຸດດຣຳ)', usage: 15, threshold: 90 },
    { name: 'Fuser Kit (ຊຸດຄວາມຮ້ອນ)', usage: 10, threshold: 90 },
    { name: 'Waste Toner (ກ່ອງໝຶກເສຍ)', usage: 20, threshold: 95 }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Core Specs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">{isLao ? 'ແບຣນ (Brand)' : 'Brand'}</span>
          <span className="text-slate-900 font-extrabold text-xs mt-0.5 block">{brand}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">{isLao ? 'รุ่น (Model)' : 'Model'}</span>
          <span className="text-slate-900 font-extrabold text-xs mt-0.5 block">{model}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">{isLao ? 'ระบบสี (Color Scheme)' : 'Color Scheme'}</span>
          <span className="text-sky-700 font-extrabold text-xs mt-0.5 block">{colorScheme} ({totalSlots} Slots)</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">{isLao ? 'สถานที่ (Location)' : 'Location'}</span>
          <span className="text-slate-900 font-extrabold text-xs mt-0.5 block">{location}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">{isLao ? 'อายุใช้งาน (Expected Life)' : 'Expected Life'}</span>
          <span className="text-slate-900 font-mono font-bold text-xs mt-0.5 block">{Number(expectedLife).toLocaleString()} A4 Pages</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">{isLao ? 'อัตราซ่อมบำรุง (Maint. Rate)' : 'Maintenance Rate'}</span>
          <span className="text-indigo-600 font-mono font-bold text-xs mt-0.5 block">{maintenanceRate}%</span>
        </div>
      </div>

      {/* 2. OEM Baseline Standard Ink Slots */}
      <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-600" />
            <span>{isLao ? 'สเปคหมึกแท้มาตรฐานประจำรุ่น (OEM Baseline Ink Specs)' : 'OEM Baseline Ink Specs'}</span>
          </h4>
          <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full">
            {slotsData.length} Configured Slots
          </span>
        </div>

        {slotsData.length > 0 ? (
          <div className="space-y-2">
            {slotsData.map((slot: any, idx: number) => {
              const oemCode = slot.oemInkCode || slot.inkCode || 'OEM-INK';
              const vol = slot.oemStandardVolumeMl || 100;
              const yieldPages = slot.oemStandardIsoYieldA4 || slot.isoPageYieldA4 || 5000;
              const baseRate = slot.baseConsumptionRateMlPerPage || (vol / (yieldPages || 1));

              return (
                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    <span className="font-bold text-slate-800">{slot.slotPosition || `Slot ${idx + 1}`}</span>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold">{oemCode}</span>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Volume / ISO Yield</span>
                      <span className="font-mono text-slate-700 font-bold">{vol} ml / {Number(yieldPages).toLocaleString()} Pages</span>
                    </div>
                    <div className="bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                      <span className="text-[9px] text-sky-500 block font-bold">Base Rate</span>
                      <span className="font-mono text-sky-700 font-black">{Number(baseRate).toFixed(5)} ml/p</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 bg-white rounded-xl border border-slate-200 text-slate-400 text-xs font-semibold">
            {isLao ? 'ยังไม่มีข้อมูลสเปคหมึกแท้ OEM สำหรับเครื่องพิมพ์นี้' : 'No OEM ink baseline configured for this printer.'}
          </div>
        )}
      </div>

      {/* 3. Wear Components Lifecycle */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Wrench className="w-4 h-4 text-amber-600" />
          <span>{isLao ? 'สถานะอะไหล่สิ้นเปลือง (Wear Components Lifecycle)' : 'Wear Components Lifecycle'}</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {components.map((comp: any, idx: number) => (
            <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">{comp.name}</span>
                <span className="font-mono text-xs font-black text-slate-900">{comp.usage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    comp.usage >= comp.threshold ? 'bg-rose-500' : comp.usage >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(comp.usage, 100)}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-400 block text-right font-semibold">
                Threshold: {comp.threshold}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
