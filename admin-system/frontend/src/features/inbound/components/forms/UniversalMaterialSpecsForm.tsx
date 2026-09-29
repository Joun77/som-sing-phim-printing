import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { InboundItemFormData } from './types';
import { useLookups } from '@features/master-data';
import { Layers, Maximize2, Tag, ShieldCheck, Sparkles, Sliders, Box } from 'lucide-react';

export interface UniversalMaterialSpecsFormProps {
  item: InboundItemFormData;
  updateField: (field: keyof InboundItemFormData, value: any) => void;
}

export type MaterialSubcategory = 'PAPER' | 'STICKER' | 'RIGID_BOARD';

export const UniversalMaterialSpecsForm: React.FC<UniversalMaterialSpecsFormProps> = ({
  item,
  updateField
}) => {
  const { i18n } = useTranslation();
  const isLao = (i18n.language || 'lo') === 'lo';

  // Master Data Lookups
  const { data: paperTypeLookups = [] } = useLookups('paper_type', true);
  const { data: dimensionLookups = [] } = useLookups('standard_dimension', true);
  const { data: surfaceLookups = [] } = useLookups('surface_finish', true);

  // Active Subcategory derived or default
  const activeSubcategory: MaterialSubcategory = useMemo(() => {
    const pt = (item.paperType || item.paperCode || '').toUpperCase();
    if (pt.includes('STICKER') || pt.includes('STK') || pt.includes('LABEL') || item.importType === 'STICKER') {
      return 'STICKER';
    }
    if (pt.includes('BOARD') || pt.includes('GREY') || pt.includes('FOAM') || item.importType === 'RIGID_SUBSTRATES') {
      return 'RIGID_BOARD';
    }
    return 'PAPER';
  }, [item.paperType, item.paperCode, item.importType]);

  const handleSelectSubcategory = (cat: MaterialSubcategory) => {
    if (cat === 'STICKER') {
      updateField('paperType', 'Sticker Paper');
      updateField('surfaceFinish', 'Glossy');
      updateField('packagingType', 'Pack');
      updateField('sheetsPerPack', 100);
    } else if (cat === 'RIGID_BOARD') {
      updateField('paperType', 'Greyboard');
      updateField('thicknessMetric', 'mm');
      updateField('boardThicknessMm', 2.0);
      updateField('packagingType', 'Pack');
      updateField('sheetsPerPack', 20);
    } else {
      updateField('paperType', 'Plain Paper');
      updateField('thicknessMetric', 'gsm');
      updateField('grammage', '80');
      updateField('packagingType', 'Ream');
      updateField('sheetsPerPack', 500);
    }
  };

  const dimensionOptions = useMemo(() => {
    if (dimensionLookups && dimensionLookups.length > 0) {
      return dimensionLookups.map(d => ({ value: d.code, label: isLao ? d.name_lo : d.name_en }));
    }
    return ['A4', 'A3', 'A3+', 'A5', 'B5', 'SRA3', 'Custom Sheet'].map(s => ({ value: s, label: s }));
  }, [dimensionLookups, isLao]);

  return (
    <div className="space-y-6">
      {/* Category Switcher Tabs */}
      <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
        <label className="text-xs font-black text-slate-800 flex items-center gap-2">
          <Tag className="w-4 h-4 text-indigo-600" />
          <span>ປະເພດວັດສະດຸຫຼັກ (Material Category Classification):</span>
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Paper */}
          <button
            type="button"
            onClick={() => handleSelectSubcategory('PAPER')}
            className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center gap-3 cursor-pointer ${
              activeSubcategory === 'PAPER'
                ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
            }`}
          >
            <div className={`p-2 rounded-xl ${activeSubcategory === 'PAPER' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">ເຈ້ຍທົ່ວໄປ & ອາດມັນ (Paper)</span>
              <span className="text-[10px] text-slate-500">Plain, Art, Kraft, Green Read</span>
            </div>
          </button>

          {/* Sticker */}
          <button
            type="button"
            onClick={() => handleSelectSubcategory('STICKER')}
            className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center gap-3 cursor-pointer ${
              activeSubcategory === 'STICKER'
                ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
            }`}
          >
            <div className={`p-2 rounded-xl ${activeSubcategory === 'STICKER' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">ສະຕິກເກີ & ລາເບລ (Stickers)</span>
              <span className="text-[10px] text-slate-500">PP, PVC, Paper Sticker, Clear</span>
            </div>
          </button>

          {/* Rigid Board */}
          <button
            type="button"
            onClick={() => handleSelectSubcategory('RIGID_BOARD')}
            className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center gap-3 cursor-pointer ${
              activeSubcategory === 'RIGID_BOARD'
                ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
            }`}
          >
            <div className={`p-2 rounded-xl ${activeSubcategory === 'RIGID_BOARD' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              <Box className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">ຈົ່ວປັງ & ແຜ່ນແຂງ (Rigid Board)</span>
              <span className="text-[10px] text-slate-500">Greyboard, Foam Board, Acrylic</span>
            </div>
          </button>
        </div>
      </div>

      {/* Universal Identification Details */}
      <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>ຂໍ້ມູນລະບຽບການ & ຂະໜາດ (Specifications & Dimensions)</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Material Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              ຊື່ວັດສະດຸ / ລາຍການ (Material Name) *
            </label>
            <input
              type="text"
              value={item.paperName || ''}
              onChange={(e) => updateField('paperName', e.target.value)}
              placeholder="ເຊັ່ນ: PP Sticker ຂາວເງົາ, Art Card 260g, ຈົ່ວປັງ No.24"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-900"
            />
          </div>

          {/* SKU / Code */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              ລະຫັດສິນຄ້າ (SKU Code) *
            </label>
            <input
              type="text"
              value={item.paperCode || ''}
              onChange={(e) => updateField('paperCode', e.target.value)}
              placeholder="ເຊັ່ນ: STK-PP-GLOSS-A3, PAP-ART-260"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-mono font-bold text-indigo-700"
            />
          </div>

          {/* Brand */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              ຍີ່ຫໍ້ / ຜູ້ຜະລິດ (Brand)
            </label>
            <input
              type="text"
              value={item.paperBrand || ''}
              onChange={(e) => updateField('paperBrand', e.target.value)}
              placeholder="ເຊັ່ນ: Double A, SCG, Avery Dennison"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Dimensions & Formats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
          {/* Format */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              ຮູບແບບການຈ່າຍ (Feed Format)
            </label>
            <select
              value={item.paperFormat || 'cut_sheet'}
              onChange={(e) => updateField('paperFormat', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold"
            >
              <option value="cut_sheet">ແຜ່ນຕັດແລ້ວ (Cut Sheet)</option>
              <option value="parent_sheet">ແຜ່ນໃຫຍ່ເຕັມແຜ່ນ (Parent Sheet)</option>
              <option value="roll">ມ້ວນ (Roll / Continuous)</option>
            </select>
          </div>

          {/* Size Dimension */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              ຂະໜາດມາດຕະຖານ (Standard Dimension)
            </label>
            <select
              value={item.paperSize || 'A3+'}
              onChange={(e) => updateField('paperSize', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold"
            >
              {dimensionOptions.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Thickness Mode */}
          {activeSubcategory === 'RIGID_BOARD' ? (
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                ຄວາມໜາແຜ່ນແຂງ (Thickness mm)
              </label>
              <input
                type="number"
                step={0.1}
                min={0.5}
                max={50}
                value={item.boardThicknessMm || 2.0}
                onChange={(e) => updateField('boardThicknessMm', parseFloat(e.target.value) || 2.0)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-mono font-bold text-emerald-700"
              />
            </div>
          ) : (
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                ຄວາມໜາ / ແກຣມ (Grammage GSM)
              </label>
              <input
                type="text"
                value={item.grammage || '150'}
                onChange={(e) => updateField('grammage', e.target.value)}
                placeholder="ເຊັ່ນ: 80, 130, 260"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-mono font-bold text-indigo-700"
              />
            </div>
          )}

          {/* Surface Finish */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              ຜິວສຳຜັດ (Surface Finish)
            </label>
            <select
              value={item.surfaceFinish || 'Glossy'}
              onChange={(e) => updateField('surfaceFinish', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold"
            >
              <option value="Glossy">ເງົາ (Glossy)</option>
              <option value="Matte">ດ້ານ (Matte)</option>
              <option value="Satin">ເຄິ່ງເງົາເຄິ່ງດ້ານ (Satin / Semi-gloss)</option>
              <option value="Textured">ມີລວດລາຍ (Textured / Embossed)</option>
              <option value="Transparent">ໃສ (Transparent / Clear)</option>
            </select>
          </div>
        </div>

        {/* Packaging & Unit Conversion */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              ຫົວໜ່ວຍການຊື້ (Purchase Unit)
            </label>
            <input
              type="text"
              value={item.importUnit || 'ແພັກ'}
              onChange={(e) => updateField('importUnit', e.target.value)}
              placeholder="ເຊັ່ນ: ແພັກ, ຣີມ, ມ້ວນ, ກ່ອງ"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              ຈຳນວນແຜ່ນຕໍ່ຫົວໜ່ວຍຊື້ (Sheets per Pack)
            </label>
            <input
              type="number"
              min={1}
              value={item.sheetsPerPack || 100}
              onChange={(e) => updateField('sheetsPerPack', parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-mono font-bold text-indigo-700"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              ທິດທາງເກຣນເຈ້ຍ (Grain Direction)
            </label>
            <select
              value={item.grainDirection || 'LG'}
              onChange={(e) => updateField('grainDirection', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold"
            >
              <option value="LG">Long Grain (LG - ແນວຍາວ)</option>
              <option value="SG">Short Grain (SG - ແນວຂວາງ)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
