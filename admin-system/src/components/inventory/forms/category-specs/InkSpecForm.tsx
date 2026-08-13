import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function InkSpecForm({ formData, onChange }: { formData: any; onChange: (updated: any) => void }) {
  const { i18n } = useTranslation();
  const isLao = i18n.language === 'lo';

  const [inkCode, setInkCode] = useState(formData.inkCode || formData.id || '');
  const [colorName, setColorName] = useState(formData.colorName || formData.name || '');
  const [colorGroup, setColorGroup] = useState(formData.colorGroup || 'Cyan');
  const [volume, setVolume] = useState(formData.volume || 100);
  const [inkBaseType, setInkBaseType] = useState(formData.inkBaseType || 'Dye');
  const [isCompatible, setIsCompatible] = useState(formData.isCompatible ?? false);

  const updateParent = (fields: any) => {
    onChange({
      inkCode,
      colorName,
      colorGroup,
      volume: Number(volume),
      inkBaseType,
      isCompatible,
      ...fields
    });
  };

  const handleFieldChange = (setter: any, key: string, value: any) => {
    setter(value);
    updateParent({ [key]: value });
  };

  const colorGroups = ['Cyan', 'Magenta', 'Yellow', 'Black', 'Light Cyan', 'Light Magenta', 'White', 'Varnish', 'Other'];
  const inkBaseTypes = ['Dye', 'Pigment', 'Toner', 'UV Curable', 'Eco-Solvent'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-700">
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Ink Code / SKU</label>
        <input 
          type="text" 
          value={inkCode} 
          onChange={(e) => handleFieldChange(setInkCode, 'inkCode', e.target.value)} 
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
        />
      </div>
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Color Name</label>
        <input 
          type="text" 
          value={colorName} 
          onChange={(e) => handleFieldChange(setColorName, 'colorName', e.target.value)} 
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
        />
      </div>
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Color Group</label>
        <select 
          value={colorGroup} 
          onChange={(e) => handleFieldChange(setColorGroup, 'colorGroup', e.target.value)} 
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
        >
          {colorGroups.map(grp => <option key={grp} value={grp}>{grp}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Volume per Bottle (ml)</label>
        <input 
          type="number" 
          value={volume} 
          onChange={(e) => handleFieldChange(setVolume, 'volume', Number(e.target.value))} 
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
        />
      </div>
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Ink Base Type</label>
        <select 
          value={inkBaseType} 
          onChange={(e) => handleFieldChange(setInkBaseType, 'inkBaseType', e.target.value)} 
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
        >
          {inkBaseTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-3 pt-6">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
          <input 
            type="checkbox" 
            checked={isCompatible} 
            onChange={(e) => handleFieldChange(setIsCompatible, 'isCompatible', e.target.checked)} 
            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500" 
          />
          <span>{isLao ? 'ໝຶກທຽບເທົ່າ (Compatible Ink) / OEM หมึกแท้' : 'Compatible Ink (หมึกเทียบ)'}</span>
        </label>
      </div>
    </div>
  );
}
