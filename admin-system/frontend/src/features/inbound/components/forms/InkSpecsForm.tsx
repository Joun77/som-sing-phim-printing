import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, Droplet, Sparkles, Scale, Info } from 'lucide-react';
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
  const liquidBaseTypes = ['Dye', 'Pigment', 'UV Curable', 'Eco-Solvent', 'Sublimation'];
  const tonerBaseTypes = ['Toner', 'Chemical Toner', 'Polymerized Toner'];

  const isToner = item.inkBaseType === 'Toner' || 
    tonerBaseTypes.includes(item.inkBaseType) ||
    (item.importUnit || '').toLowerCase().includes('kg') || 
    (item.importUnit || '').toLowerCase().includes('ກິໂລ') || 
    (item.importUnit || '').toLowerCase().includes('ກຣາມ') ||
    (item.importUnit || '').toLowerCase().includes('ຕລັບ') ||
    (item.importUnit || '').toLowerCase().includes('cartridge');

  const handleSelectType = (type: 'LIQUID' | 'TONER') => {
    if (type === 'TONER') {
      updateField('inkBaseType', 'Toner');
      updateField('importUnit', 'ກິໂລກຣາມ (Kilogram / kg)');
      updateField('isCompatible', true);
      updateField('inkGrade', 'compatible');
      const currentVol = Number(item.inkVolume);
      if (!currentVol || currentVol < 200) {
        updateField('inkVolume', 1000);
      }
      if (!item.inkCode || item.inkCode.startsWith('INK-')) {
        const clr = (item.inkColorGroup || 'CLR').toUpperCase().slice(0, 3);
        updateField('inkCode', `TNR-${clr}-${Date.now().toString().slice(-4)}`);
      }
    } else {
      updateField('inkBaseType', 'Dye');
      updateField('importUnit', 'ຂວດ (Bottle)');
      updateField('isCompatible', true);
      updateField('inkGrade', 'compatible');
      const currentVol = Number(item.inkVolume);
      if (!currentVol || currentVol > 500) {
        updateField('inkVolume', 100);
      }
      if (!item.inkCode || item.inkCode.startsWith('TNR-')) {
        const clr = (item.inkColorGroup || 'CLR').toUpperCase().slice(0, 3);
        updateField('inkCode', `INK-${clr}-${Date.now().toString().slice(-4)}`);
      }
    }
  };

  const autoDefaultSku = `${isToner ? 'TNR' : 'INK'}-${(item.inkColorGroup || 'CLR').toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`;

  return (
    <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-sky-600" />
          <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
            {t('inbound.ink.title', 'ຂໍ້ມູນສະເພາະໝຶກພິມ & ຜົງໝຶກ (Ink & Toner Specifications)')}
          </h4>
        </div>

        {/* Consumable Sub-Category Badges */}
        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => handleSelectType('LIQUID')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              !isToner 
                ? 'bg-white text-sky-700 shadow-xs border border-sky-100' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Droplet className="w-3.5 h-3.5 text-sky-500" />
            <span>{t('inbound.ink.type_liquid', 'ນ້ຳໝຶກ (Liquid Ink - ml / L)')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectType('TONER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              isToner 
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>{t('inbound.ink.type_toner', 'ຜົງໝຶກໂທນເນີ (Laser Toner - g / kg)')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {t('inbound.ink.code', 'ລະຫັດໝຶກ / SKU')} (SKU)
          </label>
          <div className="relative">
            <input 
              type="text" 
              value={item.inkCode || autoDefaultSku} 
              onChange={(e) => updateField('inkCode', e.target.value)} 
              placeholder={isToner ? 'Auto SKU: TNR-...' : 'Auto SKU: INK-...'}
              className="w-full pl-3.5 pr-16 h-[42px] rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-xs text-sky-950 focus:bg-white focus:ring-2 focus:ring-sky-500/20" 
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 pointer-events-none">
              Auto
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {t('inbound.ink.name', 'ຊື່ໝຶກ / ສີ')} *
          </label>
          <input 
            type="text" 
            value={item.inkColorName} 
            onChange={(e) => updateField('inkColorName', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-sky-500/20" 
            placeholder={isToner ? 'e.g. Fuji Xerox C5005 Cyan Toner' : 'e.g. Epson 003 Cyan Ultra'} 
            required 
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {t('inbound.ink.group', 'ກຸ່ມສີ')}
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
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center justify-between truncate">
            <span>
              {isToner 
                ? t('inbound.ink.weight_g', 'ນ້ຳໜັກສຸທິ / ຄວາມຈຸ (Net Weight) (g)')
                : t('inbound.ink.volume_ml', 'ຄວາມຈຸນ້ຳໝຶກ (Liquid Volume) (ml)')}
            </span>
            <span className="text-[10px] text-slate-400 lowercase font-normal flex items-center gap-0.5">
              <Scale className="w-3 h-3" />
              {isToner ? 'ກຣາມ (g)' : 'ມິລລິລິດ (ml)'}
            </span>
          </label>
          <input 
            type="number" 
            value={item.inkVolume} 
            onChange={(e) => updateField('inkVolume', e.target.value)} 
            placeholder={isToner ? 'e.g. 500 or 1000 (1 kg)' : 'e.g. 70, 100 or 1000 (1 L)'}
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-sky-500/20" 
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {t('inbound.ink.base_type', 'ເນື້ອໝຶກ (Base Type)')}
          </label>
          <select 
            value={item.inkBaseType} 
            onChange={(e) => {
              const newType = e.target.value;
              updateField('inkBaseType', newType);
              if (newType === 'Toner' && (!item.importUnit || item.importUnit === 'ຂວດ')) {
                updateField('importUnit', 'ກິໂລກຣາມ (Kilogram / kg)');
                if (!item.inkVolume) updateField('inkVolume', 1000);
              }
            }} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-sky-500/20"
          >
            {isToner ? (
              tonerBaseTypes.map(type => <option key={type} value={type}>{type}</option>)
            ) : (
              liquidBaseTypes.map(type => <option key={type} value={type}>{type}</option>)
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {t('inbound.ink.target_printer', 'ເຄື່ອງພິມເປົ້າໝາຍ (Target Printer)')}
          </label>
          <select 
            value={item.inkTargetPrinter} 
            onChange={(e) => updateField('inkTargetPrinter', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="">{t('inbound.ink.select_printer', '-- ເລືອກເຄື່ອງພິມ --')}</option>
            {equipment
              .filter(e => {
                if (e.category !== 'Printer' && e.category !== 'MACHINERY') return false;
                return true;
              })
              .map(p => (
                <option key={p.id} value={p.id}>{p.name || p.id}</option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {t('inbound.ink.grade', 'ເກຣດໝຶກ (Ink Grade / Compatibility)')}
          </label>
          <div className="flex items-center gap-1.5 h-[42px] bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                updateField('isCompatible', true);
                updateField('inkGrade', 'compatible');
              }}
              className={`flex-1 h-full rounded-lg text-xs font-bold transition cursor-pointer ${
                item.isCompatible !== false && item.inkGrade !== 'genuine'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isToner 
                ? t('inbound.ink.compatible_toner', 'ຜົງເຕີມ / ໝຶກທຽບ (Compatible)') 
                : t('inbound.ink.compatible', 'ໝຶກທຽບ (Compatible)')}
            </button>
            <button
              type="button"
              onClick={() => {
                updateField('isCompatible', false);
                updateField('inkGrade', 'genuine');
              }}
              className={`flex-1 h-full rounded-lg text-xs font-bold transition cursor-pointer ${
                item.isCompatible === false || item.inkGrade === 'genuine'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('inbound.ink.genuine', 'ໝຶກແທ້ (OEM Genuine)')}
            </button>
          </div>
        </div>
      </div>

      {/* Consumption & Stock conversion hint banner */}
      <div className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-medium ${
        isToner 
          ? 'bg-indigo-50/80 border border-indigo-100 text-indigo-900' 
          : 'bg-sky-50/80 border border-sky-100 text-sky-900'
      }`}>
        <Info className="w-4 h-4 shrink-0 text-current opacity-75" />
        <span>
          {isToner 
            ? t('inbound.ink.toner_kg_hint', 'ສຳລັບຜົງໝຶກ Toner: 1 kg = 1,000 g ລະບົບຈະຄຳນວນສະຕ໋ອກຕັດໃຊ້ງານເປັນກຣາມ (g) ແລະ ຄິດໄລ່ຕົ້ນທຶນຕໍ່ໜ້າພິມຕາມມາດຕະຖານ ISO')
            : t('inbound.ink.liquid_ml_hint', 'ສຳລັບນ້ຳໝຶກ Liquid: ລະບົບຈະຄຳນວນສະຕ໋ອກຕັດໃຊ້ງານເປັນມິລລິລິດ (ml) ຕາມຂະໜາດຂວດ / ລິດທີ່ນຳເຂົ້າ')}
        </span>
      </div>
    </div>
  );
};
