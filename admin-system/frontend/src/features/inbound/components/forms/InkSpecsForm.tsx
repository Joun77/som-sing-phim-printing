import React from 'react';
import { useTranslation } from 'react-i18next';
import { InboundItemFormData } from './types';

interface InkSpecsFormProps {
  item: InboundItemFormData;
  equipment: any[];
  updateField: (field: keyof InboundItemFormData, value: any) => void;
}

export const InkSpecsForm: React.FC<InkSpecsFormProps> = ({
  item,
  equipment,
  updateField
}) => {
  const { t } = useTranslation();
  const colorGroups = ['Cyan', 'Magenta', 'Yellow', 'Black', 'Light Cyan', 'Light Magenta', 'White', 'Varnish', 'Other'];
  const inkBaseTypes = ['Dye', 'Pigment', 'Toner', 'UV Curable', 'Eco-Solvent'];

  return (
    <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
        {t('inbound.ink.title')}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('inbound.ink.code')} *</label>
          <input 
            type="text" 
            value={item.inkCode} 
            onChange={(e) => updateField('inkCode', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('inbound.ink.name')} *</label>
          <input 
            type="text" 
            value={item.inkColorName} 
            onChange={(e) => updateField('inkColorName', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            placeholder="e.g. Cyan Ultra" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('inbound.ink.group')}</label>
          <select 
            value={item.inkColorGroup} 
            onChange={(e) => updateField('inkColorGroup', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
          >
            {colorGroups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('inbound.ink.volume')}</label>
          <input 
            type="number" 
            value={item.inkVolume} 
            onChange={(e) => updateField('inkVolume', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('inbound.ink.base_type')}</label>
          <select 
            value={item.inkBaseType} 
            onChange={(e) => updateField('inkBaseType', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
          >
            {inkBaseTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('inbound.ink.target_printer')}</label>
          <select 
            value={item.inkTargetPrinter} 
            onChange={(e) => updateField('inkTargetPrinter', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
          >
            <option value="">{t('inbound.ink.select_printer')}</option>
            {equipment.filter(e => e.category === 'Printer').map(p => (
              <option key={p.id} value={p.id}>{p.name || p.id}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
