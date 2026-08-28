import React from 'react';
import { useTranslation } from 'react-i18next';
import { InboundItemFormData } from './types';

interface PaperSpecsFormProps {
  item: InboundItemFormData;
  updateField: (field: keyof InboundItemFormData, value: any) => void;
}

export const PaperSpecsForm: React.FC<PaperSpecsFormProps> = ({
  item,
  updateField
}) => {
  const { t } = useTranslation();
  const paperSurfaces = ['Glossy', 'Matte', 'Satin/Luster', 'Plain Paper', 'Canvas', 'Sticker/Vinyl'];
  const paperSizes = ['A4', 'A3', 'A3+', 'A5', 'B5', 'SRA3', 'Custom Sheet'];
  const rollWidthPresets = [
    { label: '12" (0.305m)', value: 0.305 },
    { label: '24" (0.610m)', value: 0.610 },
    { label: '36" (0.914m)', value: 0.914 },
    { label: '44" (1.118m)', value: 1.118 },
    { label: '60" (1.524m)', value: 1.524 }
  ];
  const grammageOptions = ['70', '80', '100', '130', '160', '180', '210', '230', '260', '300'];

  return (
    <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
        {t('inbound.paper.title')}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('inbound.paper.code')} *</label>
          <input 
            type="text" 
            value={item.paperCode} 
            onChange={(e) => updateField('paperCode', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('inbound.paper.name')} *</label>
          <input 
            type="text" 
            value={item.paperName} 
            onChange={(e) => updateField('paperName', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            placeholder="e.g. Glossy Photo Paper" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('inbound.paper.brand')} *</label>
          <input 
            type="text" 
            value={item.paperBrand} 
            onChange={(e) => updateField('paperBrand', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            placeholder="e.g. Fujifilm" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('inbound.paper.format')}</label>
          <div className="flex gap-4 pt-2">
            {['Sheet', 'Roll'].map(fmt => (
              <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name={`format-${item.id}`} 
                  value={fmt} 
                  checked={item.paperFormat === fmt} 
                  onChange={(e) => updateField('paperFormat', e.target.value)} 
                  className="text-indigo-600" 
                />
                <span>{fmt}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {item.paperFormat === 'Sheet' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('inbound.paper.standard_size')}</label>
            <select 
              value={item.paperSize} 
              onChange={(e) => updateField('paperSize', e.target.value)} 
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
            >
              {paperSizes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('inbound.paper.sheets_per_pack')}</label>
            <input 
              type="number" 
              value={item.sheetsPerPack} 
              onChange={(e) => updateField('sheetsPerPack', Number(e.target.value))} 
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('inbound.paper.roll_width_preset')}</label>
            <select 
              value={item.rollWidthPreset} 
              onChange={(e) => {
                const opt = rollWidthPresets.find(r => r.label.startsWith(e.target.value));
                updateField('rollWidthPreset', e.target.value);
                if (opt) updateField('rollWidthM', opt.value);
              }} 
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
            >
              {rollWidthPresets.map(r => <option key={r.label} value={r.label.split(' ')[0]}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('inbound.paper.roll_length_m')}</label>
            <input 
              type="number" 
              value={item.rollLengthM} 
              onChange={(e) => updateField('rollLengthM', Number(e.target.value))} 
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('inbound.paper.paper_core')}</label>
            <select 
              value={item.paperCore} 
              onChange={(e) => updateField('paperCore', e.target.value)} 
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
            >
              <option value='2"'>2 ນິ້ວ (2")</option>
              <option value='3"'>3 ນິ້ວ (3")</option>
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('inbound.paper.grammage')}</label>
          <select 
            value={item.grammage} 
            onChange={(e) => updateField('grammage', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
          >
            {grammageOptions.map(g => <option key={g} value={g}>{g} gsm</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('inbound.paper.surface_finish')}</label>
          <select 
            value={item.paperSurface} 
            onChange={(e) => updateField('paperSurface', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
          >
            {paperSurfaces.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};
