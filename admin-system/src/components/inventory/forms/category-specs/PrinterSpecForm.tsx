import React, { useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PrinterSpecForm({ formData, onChange }: { formData: any; onChange: (updated: any) => void }) {
  const { i18n } = useTranslation();
  const isLao = i18n.language === 'lo';

  const [brand, setBrand] = useState(formData.brand || '');
  const [model, setModel] = useState(formData.model || '');
  const [printerCategory, setPrinterCategory] = useState(formData.printerCategory || 'Laser');
  const [colorSchemeType, setColorSchemeType] = useState(formData.colorSchemeType || 'CMYK');
  const [totalColorSlots, setTotalColorSlots] = useState(formData.totalColorSlots || 4);
  const [expectedLifeA4Pages, setExpectedLifeA4Pages] = useState(formData.expectedLifeA4Pages || 500000);
  const [maintenanceRatePercent, setMaintenanceRatePercent] = useState(formData.maintenanceRatePercent || 20);
  const [location, setLocation] = useState(formData.location || 'Main Dept');

  const [printerInkSlots, setPrinterInkSlots] = useState(formData.printerColorLinks || [
    { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'EPSON-008-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 7500 },
    { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemInkCode: 'EPSON-008-C', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
    { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemInkCode: 'EPSON-008-M', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
    { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemInkCode: 'EPSON-008-Y', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
  ]);

  const updateParent = (fields: any) => {
    onChange({
      brand,
      model,
      printerCategory,
      colorSchemeType,
      totalColorSlots: Number(totalColorSlots),
      expectedLifeA4Pages: Number(expectedLifeA4Pages),
      maintenanceRatePercent: Number(maintenanceRatePercent),
      location,
      printerColorLinks: printerInkSlots,
      ...fields
    });
  };

  const handleFieldChange = (setter: any, key: string, value: any) => {
    setter(value);
    updateParent({ [key]: value });
  };

  return (
    <div className="space-y-4 text-xs font-semibold text-slate-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Brand</label>
          <input 
            type="text" 
            value={brand} 
            onChange={(e) => handleFieldChange(setBrand, 'brand', e.target.value)} 
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Model</label>
          <input 
            type="text" 
            value={model} 
            onChange={(e) => handleFieldChange(setModel, 'model', e.target.value)} 
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Printer Category</label>
          <select 
            value={printerCategory} 
            onChange={(e) => handleFieldChange(setPrinterCategory, 'printerCategory', e.target.value)} 
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          >
            {['Laser', 'Inkjet', 'MFP', 'Plotter', 'UV Flatbed', 'Sublimation'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Color Scheme</label>
          <select 
            value={colorSchemeType} 
            onChange={(e) => handleFieldChange(setColorSchemeType, 'colorSchemeType', e.target.value)} 
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          >
            {['CMYK', 'Photo (6 Colors)', 'Plotter (10-12 Colors)', 'Monochrome'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Expected Life A4 Pages</label>
          <input 
            type="number" 
            value={expectedLifeA4Pages} 
            onChange={(e) => handleFieldChange(setExpectedLifeA4Pages, 'expectedLifeA4Pages', Number(e.target.value))} 
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Maintenance Rate %</label>
          <input 
            type="number" 
            value={maintenanceRatePercent} 
            onChange={(e) => handleFieldChange(setMaintenanceRatePercent, 'maintenanceRatePercent', Number(e.target.value))} 
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Location / Dept</label>
          <input 
            type="text" 
            value={location} 
            onChange={(e) => handleFieldChange(setLocation, 'location', e.target.value)} 
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          />
        </div>
      </div>

      {/* OEM Baseline Standard Specs Matrix */}
      <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-600" />
            <span>💧 สเปคหมึกแท้มาตรฐานประจำรุ่น (OEM Baseline Specs)</span>
          </h4>
          <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
            {printerInkSlots.length} Slots
          </span>
        </div>
        <div className="space-y-2.5">
          {printerInkSlots.map((slot: any, index: number) => {
            const baseRate = slot.oemStandardIsoYieldA4 > 0 
              ? (slot.oemStandardVolumeMl / slot.oemStandardIsoYieldA4).toFixed(5) 
              : '0.00000';
            return (
              <div key={index} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 font-bold">
                  <span>{slot.slotPosition} ({slot.colorGroup})</span>
                  <span className="text-[10px] font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded">Base: {baseRate} ml/p</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="OEM Ink SKU"
                    value={slot.oemInkCode}
                    onChange={(e) => {
                      const newSlots = [...printerInkSlots];
                      newSlots[index].oemInkCode = e.target.value;
                      setPrinterInkSlots(newSlots);
                      updateParent({ printerColorLinks: newSlots });
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                  />
                  <input
                    type="number"
                    placeholder="OEM Vol (ml)"
                    value={slot.oemStandardVolumeMl}
                    onChange={(e) => {
                      const newSlots = [...printerInkSlots];
                      newSlots[index].oemStandardVolumeMl = Number(e.target.value);
                      setPrinterInkSlots(newSlots);
                      updateParent({ printerColorLinks: newSlots });
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                  />
                  <input
                    type="number"
                    placeholder="OEM ISO Yield (Pages)"
                    value={slot.oemStandardIsoYieldA4}
                    onChange={(e) => {
                      const newSlots = [...printerInkSlots];
                      newSlots[index].oemStandardIsoYieldA4 = Number(e.target.value);
                      setPrinterInkSlots(newSlots);
                      updateParent({ printerColorLinks: newSlots });
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
