import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function PaperSpecForm({ formData, onChange }: { formData: any; onChange: (updated: any) => void }) {
  const { i18n } = useTranslation();
  const isLao = i18n.language === 'lo';

  const specs = formData.specs || {};
  const [paperFormat, setPaperFormat] = useState(formData.paperFormat || specs.paperFormat || 'Sheet');
  const [paperSize, setPaperSize] = useState(formData.standardSize || specs.standardSize || 'A4');
  const [sheetsPerPack, setSheetsPerPack] = useState(formData.sheetsPerPack || specs.sheetsPerPack || 500);
  const [grammageGsm, setGrammageGsm] = useState(formData.grammageGsm || specs.grammageGsm || 80);
  const [paperSurface, setPaperSurface] = useState(formData.paperSurface || specs.paperSurface || 'Glossy');

  const updateParent = (fields: any) => {
    onChange({
      paperFormat,
      standardSize: paperSize,
      sheetsPerPack: Number(sheetsPerPack),
      grammageGsm: Number(grammageGsm),
      paperSurface,
      specs: {
        ...specs,
        paperFormat,
        standardSize: paperSize,
        sheetsPerPack: Number(sheetsPerPack),
        grammageGsm: Number(grammageGsm),
        paperSurface,
      },
      ...fields
    });
  };

  const handleFieldChange = (setter: any, key: string, value: any) => {
    setter(value);
    updateParent({ [key]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-700">
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Format</label>
        <select 
          value={paperFormat} 
          onChange={(e) => handleFieldChange(setPaperFormat, 'paperFormat', e.target.value)} 
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
        >
          <option value="Sheet">Sheet (แผ่น)</option>
          <option value="Roll">Roll (ม้วน)</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Standard Size</label>
        <select 
          value={paperSize} 
          onChange={(e) => handleFieldChange(setPaperSize, 'standardSize', e.target.value)} 
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
        >
          {['A4', 'A3', 'A3+', 'A5', 'B5', 'SRA3', 'Custom Sheet'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Sheets per Pack / Ream</label>
        <input 
          type="number" 
          value={sheetsPerPack} 
          onChange={(e) => handleFieldChange(setSheetsPerPack, 'sheetsPerPack', Number(e.target.value))} 
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
        />
      </div>
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Grammage (GSM)</label>
        <input 
          type="number" 
          value={grammageGsm} 
          onChange={(e) => handleFieldChange(setGrammageGsm, 'grammageGsm', Number(e.target.value))} 
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
        />
      </div>
      <div className="col-span-1 md:col-span-2">
        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Surface Finish</label>
        <select 
          value={paperSurface} 
          onChange={(e) => handleFieldChange(setPaperSurface, 'paperSurface', e.target.value)} 
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
        >
          {['Glossy', 'Matte', 'Satin/Luster', 'Plain Paper', 'Canvas', 'Sticker/Vinyl'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}
