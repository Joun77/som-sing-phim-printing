import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { InboundItemFormData } from './types';
import { useLookups } from '@features/master-data';
import { Layers, Maximize2 } from 'lucide-react';

interface PaperSpecsFormProps {
  item: InboundItemFormData;
  updateField: (field: keyof InboundItemFormData, value: any) => void;
}

export const PaperSpecsForm: React.FC<PaperSpecsFormProps> = ({
  item,
  updateField
}) => {
  const { t, i18n } = useTranslation();
  const isLao = (i18n.language || 'lo') === 'lo';

  // Lookups from Master Data
  const { data: paperTypeLookups = [] } = useLookups('paper_type', true);
  const { data: dimensionLookups = [] } = useLookups('standard_dimension', true);
  const { data: surfaceLookups = [] } = useLookups('surface_finish', true);
  const { data: grammageLookups = [] } = useLookups('paper_grammage_gsm', true);
  const { data: boardThicknessLookups = [] } = useLookups('board_thickness_mm', true);

  const paperTypeOptions = useMemo(() => {
    if (paperTypeLookups && paperTypeLookups.length > 0) {
      return paperTypeLookups.map(p => ({
        code: p.code,
        value: p.name_en || p.code,
        label: isLao ? p.name_lo : p.name_en,
        nameEn: p.name_en,
        nameLo: p.name_lo,
        attributes: p.attributes || {}
      }));
    }
    return [
      { code: 'PLAIN', value: 'Plain Paper', label: 'Plain Paper (ເຈ້ຍປອນ / ຖ່າຍເອກະສານຂາວ - 500 ແຜ່ນ)', nameEn: 'Plain Paper', attributes: { default_gsm: [70, 80, 100, 120] } },
      { code: 'GREEN_READ', value: 'Green Read', label: 'Green Read (ເຈ້ຍຖະໜອມສາຍຕາສີຄຣີມ - 500 ແຜ່ນ)', nameEn: 'Green Read', attributes: { default_gsm: [65, 75, 80] } },
      { code: 'KRAFT', value: 'Kraft Paper', label: 'Kraft Paper (ເຈ້ຍຄຣາຟສີນ້ຳຕານ)', nameEn: 'Kraft Paper', attributes: { default_gsm: [125, 175, 250, 300] } },
      { code: 'GREYBOARD', value: 'Greyboard', label: 'Greyboard (ກະດາດຈົ່ວປັງແກນປົກແຂງ)', nameEn: 'Greyboard', attributes: {} },
      { code: 'PHOTO', value: 'Photo Paper', label: 'Photo Paper (ໂຟໂຕ້ Glossy/Matte - 20/50/100 ແຜ່ນ)', nameEn: 'Photo Paper', attributes: { default_gsm: [180, 210, 230, 260] } },
      { code: 'SUBLIMATION', value: 'Sublimation Paper', label: 'Sublimation Paper (ເຈ້ຍຊັບລິເມຊັນ)', nameEn: 'Sublimation Paper', attributes: {} },
      { code: 'STICKER_PAPER', value: 'Sticker Paper', label: 'Sticker / Label Paper (ສະຕິກເກີ - 50/100 ແຜ່ນ)', nameEn: 'Sticker Paper', attributes: {} },
      { code: 'ART_PAPER', value: 'Art Paper', label: 'Art Paper / Art Card (ອາດມັນ/ດ້ານ - 100/250 ແຜ່ນ)', nameEn: 'Art Paper', attributes: { default_gsm: [105, 130, 160] } },
      { code: 'CANVAS', value: 'Canvas', label: 'Canvas / Fabric (ຜ້າໃບແຄນວາດ)', nameEn: 'Canvas', attributes: {} },
    ];
  }, [paperTypeLookups, isLao]);

  const dimensionOptions = useMemo(() => {
    if (dimensionLookups && dimensionLookups.length > 0) {
      return dimensionLookups.map(d => ({ value: d.code, label: isLao ? d.name_lo : d.name_en }));
    }
    return ['A4', 'A3', 'A3+', 'A5', 'B5', 'SRA3', 'Custom Sheet'].map(s => ({ value: s, label: s }));
  }, [dimensionLookups, isLao]);

  const surfaceOptions = useMemo(() => {
    if (surfaceLookups && surfaceLookups.length > 0) {
      return surfaceLookups.map(s => ({ value: s.name_en || s.code, code: s.code, label: isLao ? s.name_lo : s.name_en }));
    }
    return ['Glossy', 'Matte', 'Soft-Touch Velvet', 'Plain Paper', 'Canvas', 'Sticker/Vinyl'].map(s => ({ value: s, code: s, label: s }));
  }, [surfaceLookups, isLao]);

  const mediaForm = item.paperFormat || 'cut_sheet';
  const thicknessMetric = item.thicknessMetric || 'gsm';

  return (
    <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
            {isLao ? 'ສະເປັກເນື້ອເຈ້ຍ ແລະ ຮູບແບບມີເດຍ (Paper Specifications)' : 'Paper & Sheet Media Specifications'}
          </h4>
        </div>
        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100">
          Master Data Integrated
        </span>
      </div>

      {/* Basic Identifiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {t('inbound.paper.code')} (SKU)
          </label>
          <div className="relative">
            <input 
              type="text" 
              value={item.paperCode || `PAP-${item.paperSize || 'A4'}-${item.grammage || '80'}-${Date.now().toString().slice(-4)}`} 
              onChange={(e) => updateField('paperCode', e.target.value)} 
              placeholder="Auto SKU: PAP-..."
              className="w-full pl-3.5 pr-16 h-[42px] rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-xs text-sky-950 focus:bg-white focus:ring-2 focus:ring-indigo-500/20" 
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 pointer-events-none">
              Auto
            </span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {t('inbound.paper.name')} *
          </label>
          <input 
            type="text" 
            value={item.paperName} 
            onChange={(e) => updateField('paperName', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white font-semibold text-xs focus:ring-2 focus:ring-indigo-500/20" 
            placeholder="e.g. ເຈ້ຍອາດກາດ 260g (A3+)"
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {isLao ? 'ປະເພດເນື້ອເຈ້ຍ (Paper Type) *' : 'Paper Type *'}
          </label>
          <select
            value={item.paperType || 'Plain Paper'}
            onChange={(e) => {
              const newType = e.target.value;
              updateField('paperType', newType);
              const lower = newType.toLowerCase();
              if (lower.includes('photo')) {
                if (!item.sheetsPerPack || item.sheetsPerPack === 500) {
                  updateField('sheetsPerPack', 50);
                }
                if (!item.packagingType || item.packagingType === 'Ream') {
                  updateField('packagingType', 'Pack');
                }
                updateField('paperSurface', 'Glossy');
                updateField('surfaceFinish', 'Glossy');
              } else if (lower.includes('sticker')) {
                if (!item.sheetsPerPack || item.sheetsPerPack === 500) {
                  updateField('sheetsPerPack', 100);
                }
                if (!item.packagingType || item.packagingType === 'Ream') {
                  updateField('packagingType', 'Pack');
                }
                updateField('paperSurface', 'Sticker/Vinyl');
                updateField('surfaceFinish', 'Matte');
              } else if (lower.includes('art')) {
                if (!item.sheetsPerPack || item.sheetsPerPack === 500) {
                  updateField('sheetsPerPack', 100);
                }
                updateField('paperSurface', 'Glossy');
                updateField('surfaceFinish', 'Glossy');
              } else if (lower.includes('plain') || lower.includes('green') || lower.includes('kraft')) {
                if (!item.sheetsPerPack || item.sheetsPerPack === 50 || item.sheetsPerPack === 100) {
                  updateField('sheetsPerPack', 500);
                }
                updateField('packagingType', 'Ream');
                updateField('paperSurface', 'Plain Paper');
                updateField('surfaceFinish', 'Uncoated');
              }
            }}
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white font-semibold text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
          >
            {paperTypeOptions.map((opt) => (
              <option key={opt.code || opt.value} value={opt.value}>
                {opt.label || opt.nameLo || opt.nameEn || opt.value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            ແບຣນ / ຍີ່ຫໍ້
          </label>
          <input 
            type="text" 
            value={item.paperBrand} 
            onChange={(e) => updateField('paperBrand', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white font-semibold text-xs focus:ring-2 focus:ring-indigo-500/20" 
            placeholder="e.g. Double A, SCG, Thai Paper"
          />
        </div>
      </div>

      {/* Media Form Selection, Thickness & Dimensions (4-Column Aligned Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 pt-2 border-t border-slate-100">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {isLao ? 'ຮູບແບບຮູບຊົງເຈ້ຍ (Media Form)' : 'Media Form'} *
          </label>
          <select 
            value={mediaForm} 
            onChange={(e) => updateField('paperFormat', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="cut_sheet">ແຜ່ນຕັດສຳເລັດ (Cut-sheet A4, A3, SRA3)</option>
            <option value="parent_sheet">ແຜ່ນໃຫຍ່ໂຮງງານ (Parent Sheet 31x43", 24x35")</option>
            <option value="roll">ແບບມ້ວນ (Roll Media)</option>
          </select>
        </div>

        {/* Thickness Input with Integrated Metric Toggle */}
        <div>
          <div className="flex items-center justify-between gap-1 mb-1.5 h-5">
            <label className="block text-xs font-bold uppercase text-slate-500 truncate">
              {thicknessMetric === 'gsm' 
                ? (isLao ? 'ຄວາມໜາ (GSM) *' : 'Grammage (GSM) *') 
                : (isLao ? 'ຄວາມໜາ (mm) *' : 'Board Caliper (mm) *')}
            </label>
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0 text-[10px]">
              <button
                type="button"
                onClick={() => updateField('thicknessMetric', 'gsm')}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer font-bold ${
                  thicknessMetric === 'gsm' ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                GSM
              </button>
              <button
                type="button"
                onClick={() => updateField('thicknessMetric', 'mm')}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer font-bold ${
                  thicknessMetric === 'mm' ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                mm
              </button>
            </div>
          </div>
          {thicknessMetric === 'gsm' ? (
            <input 
              type="text" 
              value={item.grammage} 
              onChange={(e) => updateField('grammage', e.target.value)} 
              placeholder="e.g. 70, 80, 130, 260, 300, 350"
              className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white font-semibold text-xs focus:ring-2 focus:ring-indigo-500/20" 
            />
          ) : (
            <select
              value={item.boardThicknessMm || 2.0}
              onChange={(e) => updateField('boardThicknessMm', Number(e.target.value))}
              className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white font-semibold text-xs focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value={1.2}>ເບີ 16 (1.2 mm - ປະຕິທິນ)</option>
              <option value={1.6}>ເບີ 20 (1.6 mm - ປຶ້ມໂນ້ດ)</option>
              <option value={2.0}>ເບີ 24 (2.0 mm - ມາດຕະຖານປົກແຂງ)</option>
              <option value={2.5}>ເບີ 28 (2.5 mm - ແຟ້ມໜາ)</option>
              <option value={3.0}>ເບີ 32 (3.0 mm - ກ່ອງພຣີມ້ຽມ)</option>
            </select>
          )}
        </div>

        {/* Dynamic Dimensions & Quantities based on Media Form */}
        {mediaForm === 'cut_sheet' && (
          <>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                {isLao ? 'ຂະໜາດມາດຕະຖານ (Standard Size)' : 'Standard Sheet Size'} *
              </label>
              <select 
                value={item.paperSize} 
                onChange={(e) => updateField('paperSize', e.target.value)} 
                className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white font-semibold text-xs focus:ring-2 focus:ring-indigo-500/20"
              >
                {dimensionOptions.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5 h-5">
                <label className="block text-xs font-bold uppercase text-slate-500 truncate">
                  {isLao ? 'ຈຳນວນແຜ່ນຕໍ່ແພັກ/ຣີມ' : 'Sheets per Pack / Ream'} *
                </label>
                <span className="text-[10px] text-indigo-600 font-bold font-sans">
                  {item.paperType === 'Photo Paper' ? '(ໂຟໂຕ້: 20-100)' : item.paperType === 'Sticker Paper' ? '(ສະຕິກເກີ: 50-100)' : ''}
                </span>
              </div>
              <input 
                type="number" 
                min="1"
                value={item.sheetsPerPack || 500} 
                onChange={(e) => updateField('sheetsPerPack', Math.max(1, Number(e.target.value)))} 
                className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs text-indigo-950 focus:ring-2 focus:ring-indigo-500/20" 
              />
              {/* Quick Preset Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] font-bold text-slate-400 mr-0.5">ປຸ່ມລັດ:</span>
                {[20, 50, 100, 250, 500].map(sQty => (
                  <button
                    key={sQty}
                    type="button"
                    onClick={() => updateField('sheetsPerPack', sQty)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                      item.sheetsPerPack === sQty
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                    }`}
                  >
                    {sQty}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {mediaForm === 'parent_sheet' && (
          <>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                {isLao ? 'ຂະໜາດແຜ່ນໃຫຍ່ (W x H mm)' : 'Parent Size (mm)'} *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="number" 
                  value={item.parentSheetWidthMm || 787} 
                  onChange={(e) => updateField('parentSheetWidthMm', Number(e.target.value))} 
                  placeholder="787"
                  className="w-full px-2.5 h-[42px] rounded-xl border border-slate-200 bg-white font-semibold text-xs" 
                  title="Width mm"
                />
                <input 
                  type="number" 
                  value={item.parentSheetHeightMm || 1092} 
                  onChange={(e) => updateField('parentSheetHeightMm', Number(e.target.value))} 
                  placeholder="1092"
                  className="w-full px-2.5 h-[42px] rounded-xl border border-slate-200 bg-white font-semibold text-xs" 
                  title="Height mm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                {isLao ? 'ອັດຕາເສດຂອບຕັດ (% Cut Waste)' : 'Cut Waste %'}
              </label>
              <input 
                type="number" 
                value={item.cutWastePct || 5} 
                onChange={(e) => updateField('cutWastePct', Number(e.target.value))} 
                className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white font-semibold text-xs focus:ring-2 focus:ring-indigo-500/20" 
              />
            </div>
          </>
        )}

        {mediaForm === 'roll' && (
          <>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                {isLao ? 'ໜ້າກວ້າງມ້ວນ (m)' : 'Roll Width (m)'} *
              </label>
              <input 
                type="number" 
                step="0.001"
                value={item.rollWidthM} 
                onChange={(e) => updateField('rollWidthM', Number(e.target.value))} 
                className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white font-semibold text-xs focus:ring-2 focus:ring-indigo-500/20" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                {isLao ? 'ຄວາມຍາວຕໍ່ມ້ວນ (m)' : 'Roll Length (m)'} *
              </label>
              <input 
                type="number" 
                step="0.1"
                value={item.rollLengthM} 
                onChange={(e) => updateField('rollLengthM', Number(e.target.value))} 
                className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white font-semibold text-xs focus:ring-2 focus:ring-indigo-500/20" 
              />
            </div>
          </>
        )}
      </div>

      {/* Finishing, Grain Direction & Print Sides (4-Column Aligned Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 pt-2 border-t border-slate-100">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {isLao ? 'ຜິວສຳຜັດ (Surface Finish)' : 'Surface Finish'}
          </label>
          <select 
            value={item.paperSurface} 
            onChange={(e) => updateField('paperSurface', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white font-semibold text-xs focus:ring-2 focus:ring-indigo-500/20"
          >
            {surfaceOptions.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {isLao ? 'ທິດທາງລາຍເຈ້ຍ (Grain Direction)' : 'Grain Direction'}
          </label>
          <select 
            value={item.grainDirection || 'LG'} 
            onChange={(e) => updateField('grainDirection', e.target.value as 'LG' | 'SG')} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white font-semibold text-xs focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="LG">Long Grain (LG - ລາຍຍາວ)</option>
            <option value="SG">Short Grain (SG - ລາຍຂວາງ)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {isLao ? 'ການພິມໜ້າ-ຫຼັງ (Print Sides)' : 'Print Sides'}
          </label>
          <select 
            value={item.printableSides || 'double'} 
            onChange={(e) => updateField('printableSides', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white font-semibold text-xs focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="double">{isLao ? 'ພິມໄດ້ 2 ໜ້າ (Double-sided)' : 'Double-sided'}</option>
            <option value="single">{isLao ? 'ພິມໜ້າດຽວ (Single-sided)' : 'Single-sided'}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {isLao ? 'ຮູບແບບສື່ (Media Format)' : 'Media Format'}
          </label>
          <div className="px-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 text-[11px] text-slate-500 flex items-center justify-between h-[42px]">
            <span className="font-bold">{isLao ? 'ຮູບແບບແຜ່ນ:' : 'Format Type:'}</span>
            <span className="font-mono font-black text-indigo-700 uppercase">
              {mediaForm === 'cut_sheet' ? 'Cut Sheet' : mediaForm === 'parent_sheet' ? 'Parent Sheet' : 'Roll Media'}
            </span>
          </div>
        </div>
      </div>

      {/* Ink Compatibility (ຄວາມເຂົ້າກັນໄດ້ກັບນ້ຳໝຶກ) */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <label className="block text-xs font-bold uppercase text-slate-500">
          {isLao ? 'ຄວາມເຂົ້າກັນໄດ້ກັບນ້ຳໝຶກ (Ink Compatibility)' : 'Ink Compatibility'}
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'Dye', label: 'Dye Ink' },
            { id: 'Pigment', label: 'Pigment Ink' },
            { id: 'Sublimation', label: 'Sublimation' },
            { id: 'Laser', label: 'Laser Toner' },
            { id: 'Non-printable', label: 'ບໍ່ເໝາະສຳລັບພິມ (ແກນປົກແຂງ/ຈົ່ວປັງ)' }
          ].map((ink) => {
            const currentCompat = item.compatibilities || ['Dye', 'Pigment', 'Laser'];
            const isSelected = currentCompat.includes(ink.id);
            return (
              <button
                key={ink.id}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    updateField('compatibilities', currentCompat.filter(c => c !== ink.id));
                  } else {
                    updateField('compatibilities', [...currentCompat, ink.id]);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {ink.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
