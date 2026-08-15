import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppConfigStore } from '@store/useAppConfigStore';

export interface DynamicSpecFormProps {
  categoryType: string;
  formData: any;
  onChange: (updatedData: any) => void;
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

/**
 * Self-contained Unified Dynamic Form Component for Material & Asset Specifications
 * Renders Paper, Ink, Printer/Machine, InkSet, Finishing & Generic forms.
 */
export default function DynamicSpecForm({
  categoryType,
  formData,
  onChange,
  onSubmit,
  onCancel = () => {},
}: DynamicSpecFormProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const isLao = currentLang === 'lo';
  const cat = (categoryType || '').toLowerCase();

  const specs = formData?.specs || formData?.technical_specs || formData || {};

  // 1. PAPER SPEC FORM
  if (cat.includes('paper') || cat.includes('ເຈ້ຍ')) {
    const [paperFormat, setPaperFormat] = useState(formData.paper_format || formData.paperFormat || specs.paperFormat || 'Sheet');
    const [paperSize, setPaperSize] = useState(formData.standardSize || specs.standardSize || 'A4');
    const [sheetsPerReam, setSheetsPerReam] = useState(formData.sheets_per_ream || formData.sheets_per_pack || formData.sheetsPerPack || specs.sheets_per_ream || specs.sheets_per_pack || specs.sheetsPerPack || 500);
    const [rollWidthM, setRollWidthM] = useState(formData.rollWidthM || specs.rollWidthM || 1.07);
    const [rollLengthM, setRollLengthM] = useState(formData.rollLengthM || specs.rollLengthM || 50);
    const [grammageGsm, setGrammageGsm] = useState(formData.grammageGsm || specs.grammageGsm || 80);
    const [paperSurface, setPaperSurface] = useState(formData.paperSurface || specs.paperSurface || 'Glossy');

    const isSheet = paperFormat.toLowerCase() === 'sheet';

    const updatePaperParent = (fields: any = {}) => {
      const currentFormat = fields.paperFormat || paperFormat;
      const currentIsSheet = currentFormat.toLowerCase() === 'sheet';
      const currentSheetsPerReam = fields.sheets_per_ream !== undefined ? fields.sheets_per_ream : sheetsPerReam;
      const currentRollWidth = fields.rollWidthM !== undefined ? fields.rollWidthM : rollWidthM;
      const currentRollLength = fields.rollLengthM !== undefined ? fields.rollLengthM : rollLengthM;

      onChange({
        paperFormat: currentFormat,
        paper_format: currentFormat.toLowerCase(),
        standardSize: currentIsSheet ? paperSize : undefined,
        sheets_per_ream: currentIsSheet ? Number(currentSheetsPerReam) : undefined,
        sheets_per_pack: currentIsSheet ? Number(currentSheetsPerReam) : undefined,
        sheetsPerPack: currentIsSheet ? Number(currentSheetsPerReam) : undefined,
        rollWidthM: !currentIsSheet ? Number(currentRollWidth) : undefined,
        rollLengthM: !currentIsSheet ? Number(currentRollLength) : undefined,
        grammageGsm: Number(grammageGsm),
        paperSurface,
        specs: {
          ...specs,
          paperFormat: currentFormat,
          paper_format: currentFormat.toLowerCase(),
          standardSize: currentIsSheet ? paperSize : undefined,
          sheets_per_ream: currentIsSheet ? Number(currentSheetsPerReam) : undefined,
          sheets_per_pack: currentIsSheet ? Number(currentSheetsPerReam) : undefined,
          sheetsPerPack: currentIsSheet ? Number(currentSheetsPerReam) : undefined,
          rollWidthM: !currentIsSheet ? Number(currentRollWidth) : undefined,
          rollLengthM: !currentIsSheet ? Number(currentRollLength) : undefined,
          grammageGsm: Number(grammageGsm),
          paperSurface,
        },
        ...fields
      });
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-700">
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Format</label>
          <select 
            value={paperFormat} 
            onChange={(e) => {
              const val = e.target.value;
              setPaperFormat(val);
              updatePaperParent({ paperFormat: val, paper_format: val.toLowerCase() });
            }} 
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          >
            <option value="Sheet">Sheet</option>
            <option value="Roll">Roll</option>
          </select>
        </div>

        {isSheet ? (
          <>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Standard Size</label>
              <select 
                value={paperSize} 
                onChange={(e) => {
                  const val = e.target.value;
                  setPaperSize(val);
                  updatePaperParent({ standardSize: val });
                }} 
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
              >
                {['A4', 'A3', 'A3+', 'A5', 'B5', 'SRA3', 'Custom Sheet'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                {t('inbound.paper.sheets_per_pack')} *
              </label>
              <input 
                type="number" 
                min="1"
                placeholder={t('inbound.paper.sheets_per_ream_placeholder')}
                value={sheetsPerReam} 
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                  setSheetsPerReam(val);
                  updatePaperParent({ sheets_per_ream: val, sheets_per_pack: val, sheetsPerPack: val });
                }} 
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-sky-500"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                {t('inbound.paper.roll_width')} (m) *
              </label>
              <input 
                type="number" 
                step="0.001" 
                value={rollWidthM} 
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setRollWidthM(val);
                  updatePaperParent({ rollWidthM: val });
                }} 
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                {t('inbound.paper.roll_length')} (m) *
              </label>
              <input 
                type="number" 
                step="0.1" 
                value={rollLengthM} 
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setRollLengthM(val);
                  updatePaperParent({ rollLengthM: val });
                }} 
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-sky-500"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">Grammage (GSM)</label>
          <input 
            type="number" 
            value={grammageGsm || ''} 
            onChange={(e) => {
              const val = e.target.value === '' ? '' : Number(e.target.value);
              setGrammageGsm(val);
              updatePaperParent({ grammageGsm: val });
            }} 
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Surface Finish</label>
          <select 
            value={paperSurface} 
            onChange={(e) => {
              const val = e.target.value;
              setPaperSurface(val);
              updatePaperParent({ paperSurface: val });
            }} 
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          >
            {['Glossy', 'Matte', 'Satin/Luster', 'Plain Paper', 'Canvas', 'Sticker/Vinyl'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
    );
  }

  // 2. INK SPEC FORM
  if (cat.includes('ink') || cat.includes('ໝຶກ')) {
    const [inkCode, setInkCode] = useState(specs.inkCode || formData?.inkCode || formData?.id || '');
    const [colorName, setColorName] = useState(specs.colorName || formData?.colorName || formData?.name || '');
    const [colorGroup, setColorGroup] = useState(specs.colorGroup || formData?.colorGroup || 'Cyan');
    const [volume, setVolume] = useState(specs.volume || formData?.volume || 100);
    const [inkBaseType, setInkBaseType] = useState(specs.inkBaseType || formData?.inkBaseType || 'Dye');
    const [isCompatible, setIsCompatible] = useState(specs.isCompatible ?? formData?.isCompatible ?? false);

    const updateInkParent = (fields: any) => {
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

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-700">
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Ink Code / SKU</label>
          <input 
            type="text" 
            value={inkCode} 
            onChange={(e) => { setInkCode(e.target.value); updateInkParent({ inkCode: e.target.value }); }} 
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Color Name</label>
          <input 
            type="text" 
            value={colorName} 
            onChange={(e) => { setColorName(e.target.value); updateInkParent({ colorName: e.target.value }); }} 
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Color Group</label>
          <select 
            value={colorGroup} 
            onChange={(e) => { setColorGroup(e.target.value); updateInkParent({ colorGroup: e.target.value }); }} 
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          >
            {['Cyan', 'Magenta', 'Yellow', 'Black', 'Light Cyan', 'Light Magenta', 'White', 'Varnish', 'Other'].map(grp => <option key={grp} value={grp}>{grp}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Volume per Bottle (ml)</label>
          <input 
            type="number" 
            value={volume} 
            onChange={(e) => { setVolume(Number(e.target.value)); updateInkParent({ volume: Number(e.target.value) }); }} 
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Ink Base Type</label>
          <select 
            value={inkBaseType} 
            onChange={(e) => { setInkBaseType(e.target.value); updateInkParent({ inkBaseType: e.target.value }); }} 
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          >
            {['Dye', 'Pigment', 'Toner', 'UV Curable', 'Eco-Solvent'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3 pt-6">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
            <input 
              type="checkbox" 
              checked={isCompatible} 
              onChange={(e) => { setIsCompatible(e.target.checked); updateInkParent({ isCompatible: e.target.checked }); }} 
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500" 
            />
            <span>{isLao ? 'ໝຶກທຽບເທົ່າ (Compatible Ink)' : 'Compatible Ink (OEM Alternative)'}</span>
          </label>
        </div>
      </div>
    );
  }

  // 3. GENERIC SPEC FORM (Default Fallback)
  const [tariffRate, setTariffRate] = useState(formData?.tariffRate || specs.tariffRate || 0);
  const [origin, setOrigin] = useState(formData?.origin || specs.origin || '');
  const [freightCharge, setFreightCharge] = useState(formData?.freightCharge || specs.freightCharge || 0);

  const updateGenericParent = (fields: any) => {
    onChange({
      tariffRate: Number(tariffRate),
      origin,
      freightCharge: Number(freightCharge),
      specs: {
        ...specs,
        tariffRate: Number(tariffRate),
        origin,
        freightCharge: Number(freightCharge),
      },
      ...fields
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-700">
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Origin Country</label>
        <input 
          type="text" 
          placeholder="e.g. China, Thailand, Japan"
          value={origin} 
          onChange={(e) => { setOrigin(e.target.value); updateGenericParent({ origin: e.target.value }); }} 
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
        />
      </div>
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Tariff Duty Rate (%)</label>
        <input 
          type="number" 
          value={tariffRate} 
          onChange={(e) => { setTariffRate(Number(e.target.value)); updateGenericParent({ tariffRate: Number(e.target.value) }); }} 
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
        />
      </div>
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Freight Charge (LAK)</label>
        <input 
          type="number" 
          value={freightCharge} 
          onChange={(e) => { setFreightCharge(Number(e.target.value)); updateGenericParent({ freightCharge: Number(e.target.value) }); }} 
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
        />
      </div>
    </div>
  );
}
