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

  // 3. PRINTER SPEC FORM
  if (cat.includes('printer') || cat.includes('ພິມ')) {
    const rawName = formData.name || formData.itemName || '';
    const nameParts = rawName.trim().split(' ');
    const fallbackBrand = nameParts[0] || 'Brother';
    const fallbackModel = nameParts.slice(1).join(' ') || rawName || 'MFC-J2740DW';

    const [brand, setBrand] = useState(specs.brand || formData.brand || fallbackBrand);
    const [model, setModel] = useState(specs.model || formData.model || fallbackModel);
    const [serialNumber, setSerialNumber] = useState(formData.serialNumber || specs.serialNumber || formData.sn || '');
    const [printerCategory, setPrinterCategory] = useState(specs.printerCategory || specs.printer_category || formData.printerCategory || 'Inkjet');
    const [colorSchemeType, setColorSchemeType] = useState(specs.colorSchemeType || specs.color_config?.colorScheme || formData.colorSchemeType || 'CMYK');
    const [totalColorSlots, setTotalColorSlots] = useState(specs.totalColorSlots || specs.color_config?.slots?.length || formData.totalColorSlots || 4);
    const [expectedLifeA4, setExpectedLifeA4] = useState(specs.expectedLifeA4Pages || specs.expected_life_a4 || formData.expectedLifeA4Pages || 50000);
    const [maintenanceRatePct, setMaintenanceRatePct] = useState(specs.maintenanceRatePercent || formData.maintenanceRatePercent || 5);
    const [location, setLocation] = useState(specs.location || formData.location || 'Printing Room A');
    const [warrantyYear, setWarrantyYear] = useState(specs.warrantyExpirationYear || formData.warrantyExpirationYear || '2028');

    const defaultSlotsByScheme: Record<string, any[]> = {
      'K (Monochrome)': [
        { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'EPSON-008-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 7500 }
      ],
      'CMYK': [
        { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'EPSON-008-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 7500 },
        { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemInkCode: 'EPSON-008-C', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
        { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemInkCode: 'EPSON-008-M', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
        { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemInkCode: 'EPSON-008-Y', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 }
      ],
      'CMYK+W (White)': [
        { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'EPSON-008-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 7500 },
        { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemInkCode: 'EPSON-008-C', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
        { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemInkCode: 'EPSON-008-M', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
        { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemInkCode: 'EPSON-008-Y', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
        { slotPosition: 'Slot 5 (W - White)', colorGroup: 'White', oemInkCode: 'EPSON-008-W', oemStandardVolumeMl: 100, oemStandardIsoYieldA4: 4000 }
      ],
      '6-Color Photo': [
        { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'EPSON-008-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 7500 },
        { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemInkCode: 'EPSON-008-C', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
        { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemInkCode: 'EPSON-008-M', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
        { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemInkCode: 'EPSON-008-Y', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
        { slotPosition: 'Slot 5 (LC - Light Cyan)', colorGroup: 'Light Cyan', oemInkCode: 'EPSON-008-LC', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
        { slotPosition: 'Slot 6 (LM - Light Magenta)', colorGroup: 'Light Magenta', oemInkCode: 'EPSON-008-LM', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 }
      ]
    };

    const initialInkSlots = (specs.printerColorLinks && specs.printerColorLinks.length > 0)
      ? specs.printerColorLinks
      : (specs.oemBaselineInks && specs.oemBaselineInks.length > 0)
        ? specs.oemBaselineInks
        : (formData.printerColorLinks && formData.printerColorLinks.length > 0)
          ? formData.printerColorLinks
          : (formData.oemBaselineInks && formData.oemBaselineInks.length > 0)
            ? formData.oemBaselineInks
            : (defaultSlotsByScheme[colorSchemeType] || defaultSlotsByScheme['CMYK']);

    const [printerInkSlots, setPrinterInkSlots] = useState<any[]>(initialInkSlots);

    const updatePrinterParent = (fields: any = {}) => {
      const currentBrand = fields.brand !== undefined ? fields.brand : brand;
      const currentModel = fields.model !== undefined ? fields.model : model;
      const currentCategory = fields.printerCategory !== undefined ? fields.printerCategory : printerCategory;
      const currentColor = fields.colorSchemeType !== undefined ? fields.colorSchemeType : colorSchemeType;
      const currentSlots = fields.totalColorSlots !== undefined ? fields.totalColorSlots : totalColorSlots;
      const currentLife = fields.expectedLifeA4Pages !== undefined ? fields.expectedLifeA4Pages : expectedLifeA4;
      const currentMaint = fields.maintenanceRatePercent !== undefined ? fields.maintenanceRatePercent : maintenanceRatePct;
      const currentLoc = fields.location !== undefined ? fields.location : location;
      const currentWarranty = fields.warrantyExpirationYear !== undefined ? fields.warrantyExpirationYear : warrantyYear;
      const currentSn = fields.serialNumber !== undefined ? fields.serialNumber : serialNumber;
      const currentInkSlots = fields.printerColorLinks !== undefined ? fields.printerColorLinks : printerInkSlots;

      onChange({
        brand: currentBrand,
        model: currentModel,
        serialNumber: currentSn,
        printerCategory: currentCategory,
        colorSchemeType: currentColor,
        totalColorSlots: Number(currentSlots),
        expectedLifeA4Pages: Number(currentLife),
        maintenanceRatePercent: Number(currentMaint),
        location: currentLoc,
        warrantyExpirationYear: currentWarranty,
        printerColorLinks: currentInkSlots,
        oemBaselineInks: currentInkSlots,
        specs: {
          ...specs,
          brand: currentBrand,
          model: currentModel,
          serialNumber: currentSn,
          printerCategory: currentCategory,
          colorSchemeType: currentColor,
          totalColorSlots: Number(currentSlots),
          expectedLifeA4Pages: Number(currentLife),
          maintenanceRatePercent: Number(currentMaint),
          location: currentLoc,
          warrantyExpirationYear: currentWarranty,
          printerColorLinks: currentInkSlots,
          oemBaselineInks: currentInkSlots,
          color_config: {
            colorScheme: currentColor,
            slots: currentInkSlots
          }
        },
        ...fields
      });
    };

    const handleSlotChange = (index: number, field: string, value: any) => {
      const updated = [...printerInkSlots];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      setPrinterInkSlots(updated);
      updatePrinterParent({ printerColorLinks: updated, oemBaselineInks: updated });
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-700">
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
              {isLao ? 'ແບຣນ (Brand)' : 'Brand'}
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => {
                const val = e.target.value;
                setBrand(val);
                updatePrinterParent({ brand: val });
              }}
              placeholder="e.g. Brother, Epson, Canon, Fuji Xerox"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
              {isLao ? 'ຮຸ່ນ (Model)' : 'Model'}
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => {
                const val = e.target.value;
                setModel(val);
                updatePrinterParent({ model: val });
              }}
              placeholder="e.g. MFC-J2740DW, L15150"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
              {isLao ? 'ເລກຊີຣຽล (Serial Number / S/N)' : 'Serial Number (S/N)'}
            </label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => {
                const val = e.target.value;
                setSerialNumber(val);
                updatePrinterParent({ serialNumber: val });
              }}
              placeholder="e.g. SN-98765432"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
              {isLao ? 'ໝວດເຄື່ອງພິມ (Printer Category)' : 'Printer Category'}
            </label>
            <select
              value={printerCategory}
              onChange={(e) => {
                const val = e.target.value;
                setPrinterCategory(val);
                updatePrinterParent({ printerCategory: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
            >
              {['Inkjet', 'Laser / LED', 'Digital Press', 'Wide Format (Inkjet Roll)', 'UV Flatbed', 'Eco-Solvent'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
              {isLao ? 'ລະບົບສີ (Color Scheme)' : 'Color Scheme'}
            </label>
            <select
              value={colorSchemeType}
              onChange={(e) => {
                const val = e.target.value;
                setColorSchemeType(val);
                const slots = defaultSlotsByScheme[val] || defaultSlotsByScheme['CMYK'];
                setTotalColorSlots(slots.length);
                setPrinterInkSlots(slots);
                updatePrinterParent({ colorSchemeType: val, totalColorSlots: slots.length, printerColorLinks: slots, oemBaselineInks: slots });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
            >
              {['CMYK', 'K (Monochrome)', 'CMYK+W (White)', '6-Color Photo', '8-Color FineArt'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
              {isLao ? 'ຈຳນວນຊ່ອງໝຶກ (Total Slots)' : 'Total Ink Slots'}
            </label>
            <input
              type="number"
              value={totalColorSlots}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTotalColorSlots(val);
                updatePrinterParent({ totalColorSlots: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
              {isLao ? 'ອາຍຸການໃຊ້ງານປະเมิน (Lifespan Pages)' : 'Expected Life (A4 Pages)'}
            </label>
            <input
              type="number"
              value={expectedLifeA4}
              onChange={(e) => {
                const val = Number(e.target.value);
                setExpectedLifeA4(val);
                updatePrinterParent({ expectedLifeA4Pages: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
              {isLao ? 'ບ່ອນຕັ້ງ / ຫ້ອງພິມ (Location)' : 'Location in Shop'}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => {
                const val = e.target.value;
                setLocation(val);
                updatePrinterParent({ location: val });
              }}
              placeholder="e.g. Printing Room A"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
              {isLao ? 'ປີໝົດປະກັນ (Warranty Exp. Year)' : 'Warranty Expiration (Year)'}
            </label>
            <input
              type="text"
              value={warrantyYear}
              onChange={(e) => {
                const val = e.target.value;
                setWarrantyYear(val);
                updatePrinterParent({ warrantyExpirationYear: val });
              }}
              placeholder="e.g. 2028"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
            />
          </div>
        </div>

        {/* OEM BASELINE STANDARD INK SLOTS EDITOR */}
        <div className="bg-sky-50/40 p-4 rounded-2xl border border-sky-100/80 space-y-3">
          <div className="flex items-center justify-between border-b border-sky-100/60 pb-2">
            <div>
              <h5 className="text-xs font-black uppercase tracking-wider text-sky-900">
                {isLao ? 'ສະເປັກໝຶກແທ້ໂຮງງານ (OEM Baseline Standard Specs)' : 'OEM Baseline Standard Specs'}
              </h5>
              <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                {isLao ? 'ລະບຸສະເປັກໝຶກແທ້ໂຮງງານປະຈຳຮຸ່ນ ເພື່ອຄຳນວນອັດຕາກິນໝຶກມາດຕະຖານຕໍ່ແຜ່ນ' : 'Specify OEM standard cartridge specs for per-page baseline consumption rates'}
              </p>
            </div>
            <span className="text-[11px] font-bold text-sky-700 bg-white px-2.5 py-1 rounded-xl border border-sky-200 shadow-2xs">
              {printerInkSlots.length} Slots
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {printerInkSlots.map((slot: any, idx: number) => {
              const vol = Number(slot.oemStandardVolumeMl) || 100;
              const yieldPages = Number(slot.oemStandardIsoYieldA4) || 6000;
              const baseRate = yieldPages > 0 ? (vol / yieldPages).toFixed(5) : '0.00000';

              return (
                <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                      <span>{slot.slotPosition || `Slot ${idx + 1}`}</span>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                      {isLao ? 'ອັດຕາກິນໝຶກ' : 'Base Rate'}: {baseRate} ml/p
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase">
                        1) OEM INK SKU / MODEL
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. EPSON-008-BK"
                        value={slot.oemInkCode || ''}
                        onChange={(e) => handleSlotChange(idx, 'oemInkCode', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:bg-white focus:border-sky-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase">
                        2) OEM STD VOL. (ML)
                      </label>
                      <input
                        type="number"
                        placeholder="127"
                        value={slot.oemStandardVolumeMl ?? ''}
                        onChange={(e) => handleSlotChange(idx, 'oemStandardVolumeMl', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:bg-white focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase">
                        3) OEM ISO YIELD (PAGES)
                      </label>
                      <input
                        type="number"
                        placeholder="7500"
                        value={slot.oemStandardIsoYieldA4 ?? ''}
                        onChange={(e) => handleSlotChange(idx, 'oemStandardIsoYieldA4', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:bg-white focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 4. MACHINERY / CUTTER / EQUIPMENT SPEC FORM
  if (cat.includes('machinery') || cat.includes('cutter') || cat.includes('laminat') || cat.includes('binder') || cat.includes('machine') || cat.includes('equipment') || cat.includes('ຕັດ')) {
    const rawName = formData.name || formData.itemName || '';
    const nameParts = rawName.trim().split(' ');
    const fallbackBrand = nameParts[0] || 'Generic';
    const fallbackModel = nameParts.slice(1).join(' ') || rawName || 'Processing Machine';

    const [brand, setBrand] = useState(specs.brand || formData.brand || fallbackBrand);
    const [model, setModel] = useState(specs.model || formData.model || fallbackModel);
    const [serialNumber, setSerialNumber] = useState(formData.serialNumber || specs.serialNumber || formData.sn || '');
    const [machineType, setMachineType] = useState(specs.machineType || specs.machine_type || formData.machineType || 'Cutter');
    const [maxCuttingWidthMm, setMaxCuttingWidthMm] = useState(specs.maxCuttingWidthMm || formData.maxCuttingWidthMm || 920);
    const [powerSupply, setPowerSupply] = useState(specs.powerSupply || formData.powerSupply || '220V');
    const [location, setLocation] = useState(specs.location || formData.location || 'Finishing Dept');
    const [warrantyYear, setWarrantyYear] = useState(specs.warrantyExpirationYear || formData.warrantyExpirationYear || '2028');

    const updateMachineryParent = (fields: any = {}) => {
      const currentBrand = fields.brand !== undefined ? fields.brand : brand;
      const currentModel = fields.model !== undefined ? fields.model : model;
      const currentType = fields.machineType !== undefined ? fields.machineType : machineType;
      const currentWidth = fields.maxCuttingWidthMm !== undefined ? fields.maxCuttingWidthMm : maxCuttingWidthMm;
      const currentPower = fields.powerSupply !== undefined ? fields.powerSupply : powerSupply;
      const currentLoc = fields.location !== undefined ? fields.location : location;
      const currentWarranty = fields.warrantyExpirationYear !== undefined ? fields.warrantyExpirationYear : warrantyYear;
      const currentSn = fields.serialNumber !== undefined ? fields.serialNumber : serialNumber;

      onChange({
        brand: currentBrand,
        model: currentModel,
        serialNumber: currentSn,
        machineType: currentType,
        maxCuttingWidthMm: Number(currentWidth),
        powerSupply: currentPower,
        location: currentLoc,
        warrantyExpirationYear: currentWarranty,
        specs: {
          ...specs,
          brand: currentBrand,
          model: currentModel,
          serialNumber: currentSn,
          machineType: currentType,
          maxCuttingWidthMm: Number(currentWidth),
          powerSupply: currentPower,
          location: currentLoc,
          warrantyExpirationYear: currentWarranty
        },
        ...fields
      });
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-700">
        <div>
          <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
            {isLao ? 'ແບຣນ (Brand)' : 'Brand'}
          </label>
          <input
            type="text"
            value={brand}
            onChange={(e) => {
              const val = e.target.value;
              setBrand(val);
              updateMachineryParent({ brand: val });
            }}
            placeholder="e.g. QZYK, Boway, Uchida"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
            {isLao ? 'ຮຸ່ນ (Model)' : 'Model'}
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => {
              const val = e.target.value;
              setModel(val);
              updateMachineryParent({ model: val });
            }}
            placeholder="e.g. 920 Hydraulic Guillotine"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
            {isLao ? 'ເລກຊີຣຽล (Serial Number / S/N)' : 'Serial Number (S/N)'}
          </label>
          <input
            type="text"
            value={serialNumber}
            onChange={(e) => {
              const val = e.target.value;
              setSerialNumber(val);
              updateMachineryParent({ serialNumber: val });
            }}
            placeholder="e.g. SN-MAC-987654"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
            {isLao ? 'ປະເພດເຄື່ອງจักร (Machine Type)' : 'Machine Type'}
          </label>
          <select
            value={machineType}
            onChange={(e) => {
              const val = e.target.value;
              setMachineType(val);
              updateMachineryParent({ machineType: val });
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          >
            {['Cutter / Guillotine', 'Laminator (Thermal/Roll)', 'Perfect Binder', 'Creasing & Perforating', 'Die-Cutter', 'Stitching / Stapler'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
            {isLao ? 'ຂະໜາດໜ້າຕັດ/ງານສູງສຸດ (Max Width mm)' : 'Max Width (mm)'}
          </label>
          <input
            type="number"
            value={maxCuttingWidthMm}
            onChange={(e) => {
              const val = Number(e.target.value);
              setMaxCuttingWidthMm(val);
              updateMachineryParent({ maxCuttingWidthMm: val });
            }}
            placeholder="920"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
            {isLao ? 'ລະບົບໄຟຟ້າ (Power Supply)' : 'Power Supply'}
          </label>
          <select
            value={powerSupply}
            onChange={(e) => {
              const val = e.target.value;
              setPowerSupply(val);
              updateMachineryParent({ powerSupply: val });
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          >
            {['220V Single Phase', '380V 3-Phase', '110V'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
            {isLao ? 'ບ່ອນຕັ້ງ (Location)' : 'Location'}
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => {
              const val = e.target.value;
              setLocation(val);
              updateMachineryParent({ location: val });
            }}
            placeholder="e.g. Post-Press Finishing Room"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
            {isLao ? 'ປີໝົດປະກັນ (Warranty Exp. Year)' : 'Warranty Expiration (Year)'}
          </label>
          <input
            type="text"
            value={warrantyYear}
            onChange={(e) => {
              const val = e.target.value;
              setWarrantyYear(val);
              updateMachineryParent({ warrantyExpirationYear: val });
            }}
            placeholder="e.g. 2028"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
          />
        </div>
      </div>
    );
  }

  // 5. GENERIC SPEC FORM (Default Fallback)
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
