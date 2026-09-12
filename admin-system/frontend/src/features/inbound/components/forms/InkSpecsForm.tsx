import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layers } from 'lucide-react';
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
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Layers className="w-5 h-5 text-sky-600" />
        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
          {t('inbound.ink.title')}
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {t('inbound.ink.code')} (SKU)
          </label>
          <div className="relative">
            <input 
              type="text" 
              value={item.inkCode || `INK-${(item.inkColorGroup || 'CLR').toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`} 
              onChange={(e) => updateField('inkCode', e.target.value)} 
              placeholder="Auto SKU: INK-..."
              className="w-full pl-3.5 pr-16 h-[42px] rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-xs text-sky-950 focus:bg-white focus:ring-2 focus:ring-sky-500/20" 
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 pointer-events-none">
              Auto
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {t('inbound.ink.name')} *
          </label>
          <input 
            type="text" 
            value={item.inkColorName} 
            onChange={(e) => updateField('inkColorName', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-sky-500/20" 
            placeholder="e.g. Cyan Ultra" 
            required 
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {t('inbound.ink.group')}
          </label>
          <select 
            value={item.inkColorGroup} 
            onChange={(e) => updateField('inkColorGroup', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-sky-500/20"
          >
            {colorGroups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {t('inbound.ink.volume')} (ml)
          </label>
          <input 
            type="number" 
            value={item.inkVolume} 
            onChange={(e) => updateField('inkVolume', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-sky-500/20" 
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {t('inbound.ink.base_type')}
          </label>
          <select 
            value={item.inkBaseType} 
            onChange={(e) => updateField('inkBaseType', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-sky-500/20"
          >
            {inkBaseTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {t('inbound.ink.target_printer')}
          </label>
          <select 
            value={item.inkTargetPrinter} 
            onChange={(e) => updateField('inkTargetPrinter', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-sky-500/20"
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
