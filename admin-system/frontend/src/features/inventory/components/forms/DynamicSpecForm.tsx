import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppConfigStore } from '@store/useAppConfigStore';
import { useLookups } from '@features/master-data';
import { Layers, Sparkles, Scale, Maximize2, Package, Scissors, Printer, ShieldCheck } from 'lucide-react';

export interface DynamicSpecFormProps {
  categoryType: string;
  formData: any;
  onChange: (updatedData: any) => void;
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

/**
 * Enhanced Unified Dynamic Spec Form for Som Sing Phim ERP
 * Covers all 8 material & machine catalogs:
 * 1. Paper & Sheet Media (Cut-sheet, Parent Sheet, Roll, GSM vs mm)
 * 2. Ink & Toner (Inkjet ml, Laser g, Color Presets)
 * 3. Lamination Film (Thermal, Cold, Pouch, UV, Microns)
 * 4. Binding & Finishing (Wire-O, Hot Melt Glue, Spine Tape, Staples)
 * 5. Rigid Substrates (Foam board, PP board, Plastwood, Acrylic, 1220x2440mm)
 * 6. Cutting & Application (Transfer tape, Cutting mat)
 * 7. Packaging Consumables (Boxes, Bags, Bubble wrap, Tapes)
 * 8. Machinery Assets & Wear Parts (Printers, Cutters, Laminators, Binders)
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

  // Master Data Lookups hooks
  const { data: dimensionLookups = [] } = useLookups('standard_dimension', true);
  const { data: surfaceLookups = [] } = useLookups('surface_finish', true);
  const { data: paperTypeLookups = [] } = useLookups('paper_type', true);
  const { data: grammageLookups = [] } = useLookups('paper_grammage_gsm', true);
  const { data: boardThicknessLookups = [] } = useLookups('board_thickness_mm', true);
  const { data: bindingTypeLookups = [] } = useLookups('binding_type', true);
  const { data: uomLookups = [] } = useLookups('unit_of_measure', true);

  // Dynamic Options with safe fallbacks
  const dimensionOptions = useMemo(() => {
    if (dimensionLookups && dimensionLookups.length > 0) {
      return dimensionLookups.map((d) => ({
        value: d.code,
        label: isLao ? d.name_lo : d.name_en,
      }));
    }
    return ['A4', 'A3', 'A3+', 'A5', 'B5', 'SRA3', 'Custom Sheet'].map((s) => ({ value: s, label: s }));
  }, [dimensionLookups, isLao]);

  const surfaceOptions = useMemo(() => {
    if (surfaceLookups && surfaceLookups.length > 0) {
      return surfaceLookups.map((s) => ({
        value: s.code,
        label: isLao ? s.name_lo : s.name_en,
      }));
    }
    return ['Glossy', 'Matte', 'Soft-Touch Velvet', 'Plain Paper', 'Canvas', 'Sticker/Vinyl'].map((s) => ({
      value: s,
      label: s,
    }));
  }, [surfaceLookups, isLao]);

  const paperTypeOptions = useMemo(() => {
    if (paperTypeLookups && paperTypeLookups.length > 0) {
      return paperTypeLookups.map((p) => ({
        value: p.code,
        label: isLao ? p.name_lo : p.name_en,
      }));
    }
    return [
      { value: 'PLAIN', label: 'ເຈ້ຍປອນ / ເຈ້ຍຖ່າຍເອກະສານ' },
      { value: 'ART_CARD', label: 'ເຈ້ຍອາດກາດ 2 ໜ້າ' },
      { value: 'ART_PAPER', label: 'ເຈ້ຍອາດເງົາ/ດ້ານ' },
      { value: 'KRAFT', label: 'ເຈ້ຍຄຣາຟສີນ້ຳຕານ' },
      { value: 'GREYBOARD', label: 'ກະດາດຈົ່ວປັງ' },
      { value: 'STICKER_PP', label: 'ສະຕິກເກີ PP Vinyl' },
    ];
  }, [paperTypeLookups, isLao]);

  // =========================================================================
  // 1. PAPER & MEDIA SPEC FORM
  // =========================================================================
  if (cat.includes('paper') || cat.includes('ເຈ້ຍ') || cat === 'sheet') {
    const [mediaForm, setMediaForm] = useState(specs.mediaForm || specs.paper_format || formData.paper_format || 'cut_sheet');
    const [selectedPaperType, setSelectedPaperType] = useState(specs.paperType || 'ART_CARD');
    const [thicknessUnit, setThicknessUnit] = useState<'gsm' | 'mm'>(specs.thicknessUnit || (selectedPaperType === 'GREYBOARD' ? 'mm' : 'gsm'));
    const [grammageGsm, setGrammageGsm] = useState(specs.grammageGsm || specs.gsm || 260);
    const [boardThicknessMm, setBoardThicknessMm] = useState(specs.boardThicknessMm || 2.0);
    const [standardSize, setStandardSize] = useState(specs.standardSize || 'A3_PLUS');
    const [parentSheetWidth, setParentSheetWidth] = useState(specs.parentSheetWidth || 787); // 31" in mm
    const [parentSheetHeight, setParentSheetHeight] = useState(specs.parentSheetHeight || 1092); // 43" in mm
    const [cutWastePercent, setCutWastePercent] = useState(specs.cutWastePercent || 5);
    const [rollWidthM, setRollWidthM] = useState(specs.rollWidthM || 1.07);
    const [rollLengthM, setRollLengthM] = useState(specs.rollLengthM || 50);
    const [sheetsPerPack, setSheetsPerPack] = useState(specs.sheetsPerPack || specs.sheets_per_ream || 500);
    const [surfaceFinish, setSurfaceFinish] = useState(specs.paperSurface || specs.surfaceFinish || 'MATTE_PVC');
    const [grainDirection, setGrainDirection] = useState(specs.grainDirection || 'LG');
    const [printSide, setPrintSide] = useState(specs.printSide || 'double');

    const updatePaperParent = (fields: any = {}) => {
      const merged = {
        mediaForm,
        paperType: selectedPaperType,
        thicknessUnit,
        grammageGsm: thicknessUnit === 'gsm' ? Number(grammageGsm) : undefined,
        boardThicknessMm: thicknessUnit === 'mm' ? Number(boardThicknessMm) : undefined,
        standardSize: mediaForm === 'cut_sheet' ? standardSize : undefined,
        parentSheetWidth: mediaForm === 'parent_sheet' ? Number(parentSheetWidth) : undefined,
        parentSheetHeight: mediaForm === 'parent_sheet' ? Number(parentSheetHeight) : undefined,
        cutWastePercent: mediaForm === 'parent_sheet' ? Number(cutWastePercent) : undefined,
        rollWidthM: mediaForm === 'roll' ? Number(rollWidthM) : undefined,
        rollLengthM: mediaForm === 'roll' ? Number(rollLengthM) : undefined,
        sheetsPerPack: mediaForm !== 'roll' ? Number(sheetsPerPack) : undefined,
        surfaceFinish,
        grainDirection,
        printSide,
        ...fields,
      };

      onChange({
        ...merged,
        paper_format: mediaForm,
        paperSurface: surfaceFinish,
        sheets_per_ream: sheetsPerPack,
        specs: {
          ...specs,
          ...merged,
        },
      });
    };

    return (
      <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
          <Layers className="w-4 h-4 text-sky-600" />
          <span className="text-xs font-black uppercase text-slate-800">
            {isLao ? 'ສະເປັກເນື້ອເຈ້ຍ ແລະ ຮູບແບບມີເດຍ (Paper Specifications)' : 'Paper & Media Specifications'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Paper Type */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ປະເພດເນື້ອເຈ້ຍ (Paper Type)' : 'Paper Type'} *
            </label>
            <select
              value={selectedPaperType}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedPaperType(val);
                const nextThickUnit = val === 'GREYBOARD' ? 'mm' : 'gsm';
                setThicknessUnit(nextThickUnit);
                updatePaperParent({ paperType: val, thicknessUnit: nextThickUnit });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            >
              {paperTypeOptions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Media Form */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ຮູບແບບຮູບຊົງ (Media Form)' : 'Media Form'} *
            </label>
            <select
              value={mediaForm}
              onChange={(e) => {
                const val = e.target.value;
                setMediaForm(val);
                updatePaperParent({ mediaForm: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="cut_sheet">{isLao ? 'ແຜ່ນຕັດສຳເລັດ (Cut-sheet A4, A3, SRA3)' : 'Cut-sheet'}</option>
              <option value="parent_sheet">{isLao ? 'ແຜ່ນໃຫຍ່ໂຮງງານ (Parent Sheet 31x43", 24x35")' : 'Parent Sheet'}</option>
              <option value="roll">{isLao ? 'ແບບມ້ວນ (Roll Media)' : 'Roll'}</option>
            </select>
          </div>

          {/* Thickness Unit Selection: GSM vs MM */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ຫົວໜ່ວຍຄວາມໜາ (Thickness Metric)' : 'Thickness Metric'}
            </label>
            <div className="grid grid-cols-2 gap-1 bg-slate-200/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setThicknessUnit('gsm');
                  updatePaperParent({ thicknessUnit: 'gsm' });
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                  thicknessUnit === 'gsm' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ແກຣມ (GSM)
              </button>
              <button
                type="button"
                onClick={() => {
                  setThicknessUnit('mm');
                  updatePaperParent({ thicknessUnit: 'mm' });
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                  thicknessUnit === 'mm' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ມິນລິແມັດ (mm)
              </button>
            </div>
          </div>
        </div>

        {/* Thickness Input row based on selected metric */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {thicknessUnit === 'gsm' ? (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                {isLao ? 'ຄວາມໜາແກຣມ (Grammage GSM)' : 'Grammage (GSM)'} *
              </label>
              <input
                type="number"
                value={grammageGsm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setGrammageGsm(val);
                  updatePaperParent({ grammageGsm: val });
                }}
                placeholder="e.g. 80, 130, 260, 300"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                {isLao ? 'ຄວາມໜາຈົ່ວປັງ / ແຜ່ນ (Thickness mm)' : 'Board Thickness (mm)'} *
              </label>
              <select
                value={boardThicknessMm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBoardThicknessMm(val);
                  updatePaperParent({ boardThicknessMm: val });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
              >
                <option value={1.2}>ເບີ 16 (1.2 mm - ປະຕິທິນຕັ້ງໂຕະ)</option>
                <option value={1.6}>ເບີ 20 (1.6 mm - ປຶ້ມໂນ້ດ A5)</option>
                <option value={2.0}>ເບີ 24 (2.0 mm - ມາດຕະຖານປົກແຂງ)</option>
                <option value={2.5}>ເບີ 28 (2.5 mm - ແຟ້ມໜາພິເສດ)</option>
                <option value={3.0}>ເບີ 32 (3.0 mm - ກ່ອງຈົ່ວປັງພຣີມ້ຽມ)</option>
              </select>
            </div>
          )}

          {/* Form Dimensions Handling */}
          {mediaForm === 'cut_sheet' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  {isLao ? 'ຂະໜາດແຜ່ນ (Standard Size)' : 'Sheet Size'} *
                </label>
                <select
                  value={standardSize}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStandardSize(val);
                    updatePaperParent({ standardSize: val });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
                >
                  {dimensionOptions.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  {isLao ? 'ຈຳນວນແຜ່ນຕໍ່ຣີມ/ແພັກ' : 'Sheets per Pack / Ream'}
                </label>
                <input
                  type="number"
                  value={sheetsPerPack}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSheetsPerPack(val);
                    updatePaperParent({ sheetsPerPack: val });
                  }}
                  placeholder="500"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </>
          )}

          {mediaForm === 'parent_sheet' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  {isLao ? 'ຂະໜາດແຜ່ນໃຫຍ່ (W x H mm)' : 'Parent Size (mm)'} *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={parentSheetWidth}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setParentSheetWidth(val);
                      updatePaperParent({ parentSheetWidth: val });
                    }}
                    placeholder="787"
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-xs"
                    title="Width in mm"
                  />
                  <input
                    type="number"
                    value={parentSheetHeight}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setParentSheetHeight(val);
                      updatePaperParent({ parentSheetHeight: val });
                    }}
                    placeholder="1092"
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-xs"
                    title="Height in mm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  {isLao ? 'ອັດຕາເສດຂອບຕັດ (% Cut Waste)' : 'Cut Waste %'}
                </label>
                <input
                  type="number"
                  value={cutWastePercent}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCutWastePercent(val);
                    updatePaperParent({ cutWastePercent: val });
                  }}
                  placeholder="5"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </>
          )}

          {mediaForm === 'roll' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  {isLao ? 'ໜ້າກວ້າງມ້ວນ (Roll Width m)' : 'Roll Width (m)'} *
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
                  placeholder="1.07"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  {isLao ? 'ຄວາມຍາວຕໍ່ມ້ວນ (Roll Length m)' : 'Roll Length (m)'} *
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
                  placeholder="50"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </>
          )}
        </div>

        {/* Surface & Printing Characteristics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200/60">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ຜິວສຳຜັດ (Surface Finish)' : 'Surface Finish'}
            </label>
            <select
              value={surfaceFinish}
              onChange={(e) => {
                const val = e.target.value;
                setSurfaceFinish(val);
                updatePaperParent({ surfaceFinish: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            >
              {surfaceOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ທິດທາງລາຍເຈ້ຍ (Grain Direction)' : 'Grain Direction'}
            </label>
            <select
              value={grainDirection}
              onChange={(e) => {
                const val = e.target.value;
                setGrainDirection(val);
                updatePaperParent({ grainDirection: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="LG">Long Grain (LG - ລາຍຍາວ ສຳລັບພັບສັນປຶ້ມບໍ່ແຕກ)</option>
              <option value="SG">Short Grain (SG - ລາຍຂວາງ)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ການພິມໜ້າ-ຫຼັງ (Print Side)' : 'Print Side'}
            </label>
            <select
              value={printSide}
              onChange={(e) => {
                const val = e.target.value;
                setPrintSide(val);
                updatePaperParent({ printSide: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="double">{isLao ? 'ພິມໄດ້ 2 ໜ້າ (Double-side)' : 'Double-sided'}</option>
              <option value="single">{isLao ? 'ພິມໜ້າດຽວ (Single-side)' : 'Single-sided'}</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. INK & TONER SPEC FORM
  // =========================================================================
  if (cat.includes('ink') || cat.includes('ໝຶກ') || cat.includes('toner')) {
    const [inkKind, setInkKind] = useState(specs.inkKind || 'inkjet');
    const [colorSchemePreset, setColorSchemePreset] = useState(specs.colorSchemePreset || 'CMYK');
    const [colorGroup, setColorGroup] = useState(specs.colorGroup || 'Black');
    const [volumeMl, setVolumeMl] = useState(specs.volume || specs.volumeMl || 100);
    const [weightGrams, setWeightGrams] = useState(specs.weightGrams || 250);
    const [inkBaseType, setInkBaseType] = useState(specs.inkBaseType || 'Dye');
    const [packageForm, setPackageForm] = useState(specs.packageForm || 'bottle');
    const [isCompatible, setIsCompatible] = useState(specs.isCompatible ?? false);

    const updateInkParent = (fields: any = {}) => {
      const merged = {
        inkKind,
        colorSchemePreset,
        colorGroup,
        volume: inkKind === 'inkjet' ? Number(volumeMl) : undefined,
        volumeMl: inkKind === 'inkjet' ? Number(volumeMl) : undefined,
        weightGrams: inkKind === 'laser' ? Number(weightGrams) : undefined,
        inkBaseType,
        packageForm,
        isCompatible,
        ...fields,
      };
      onChange({
        ...merged,
        specs: { ...specs, ...merged },
      });
    };

    return (
      <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
          <Sparkles className="w-4 h-4 text-sky-600" />
          <span className="text-xs font-black uppercase text-slate-800">
            {isLao ? 'ສະເປັກນ້ຳໝຶກ ແລະ ຜົງໝຶກ (Ink & Toner Specifications)' : 'Ink & Toner Specifications'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ປະເພດລະບົບໝຶກ' : 'Ink System Type'} *
            </label>
            <div className="grid grid-cols-2 gap-1 bg-slate-200/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setInkKind('inkjet');
                  updateInkParent({ inkKind: 'inkjet' });
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                  inkKind === 'inkjet' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Inkjet (ml)
              </button>
              <button
                type="button"
                onClick={() => {
                  setInkKind('laser');
                  updateInkParent({ inkKind: 'laser' });
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                  inkKind === 'laser' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Laser Toner (g)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ກຸ່ມແມ່ສີ (Color Group)' : 'Color Slot'} *
            </label>
            <select
              value={colorGroup}
              onChange={(e) => {
                const val = e.target.value;
                setColorGroup(val);
                updateInkParent({ colorGroup: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            >
              {['Black (K)', 'Cyan (C)', 'Magenta (M)', 'Yellow (Y)', 'Light Cyan (LC)', 'Light Magenta (LM)', 'White (W)', 'Varnish (V)'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {inkKind === 'inkjet' ? 'ປະລິມານບັນຈຸ (ml)' : 'ນ້ຳໜັກຜົງໝຶກ (g)'} *
            </label>
            <input
              type="number"
              value={inkKind === 'inkjet' ? volumeMl : weightGrams}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (inkKind === 'inkjet') {
                  setVolumeMl(val);
                  updateInkParent({ volumeMl: val, volume: val });
                } else {
                  setWeightGrams(val);
                  updateInkParent({ weightGrams: val });
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200/60">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ເນື້ອໝຶກ (Base Type)' : 'Base Chemistry'}
            </label>
            <select
              value={inkBaseType}
              onChange={(e) => {
                const val = e.target.value;
                setInkBaseType(val);
                updateInkParent({ inkBaseType: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            >
              {['Dye', 'Pigment', 'Sublimation', 'Eco-Solvent', 'UV Curable', 'Toner Powder'].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ຮູບແບບບັນຈຸ (Packaging)' : 'Packaging Form'}
            </label>
            <select
              value={packageForm}
              onChange={(e) => {
                const val = e.target.value;
                setPackageForm(val);
                updateInkParent({ packageForm: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="bottle">ແກ້ວເຕີມ (Bottle)</option>
              <option value="cartridge">ຕລັບໝຶກ (Cartridge)</option>
              <option value="pouch">ຖົງເຕີມ (Pouch / Bag)</option>
              <option value="liter_bottle">ຕຸກໃຫຍ່ (Liter)</option>
            </select>
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={isCompatible}
                onChange={(e) => {
                  setIsCompatible(e.target.checked);
                  updateInkParent({ isCompatible: e.target.checked });
                }}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
              />
              <span>{isLao ? 'ໝຶກທຽບເທົ່າ (Compatible Ink)' : 'Compatible OEM Alternative'}</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. LAMINATION FILM SPEC FORM
  // =========================================================================
  if (cat.includes('laminat') || cat.includes('ເຄືອບ') || cat.includes('film')) {
    const [lamType, setLamType] = useState(specs.lamType || 'thermal');
    const [surfaceFinish, setSurfaceFinish] = useState(specs.surfaceFinish || 'GLOSS_PVC');
    const [rollWidthMm, setRollWidthMm] = useState(specs.rollWidthMm || 330);
    const [rollLengthM, setRollLengthM] = useState(specs.rollLengthM || 100);
    const [thicknessMicron, setThicknessMicron] = useState(specs.thicknessMicron || 25);
    const [wastePercent, setWastePercent] = useState(specs.wastePercent || 5);

    const updateLamParent = (fields: any = {}) => {
      const merged = {
        lamType,
        surfaceFinish,
        rollWidthMm: Number(rollWidthMm),
        rollLengthM: Number(rollLengthM),
        thicknessMicron: Number(thicknessMicron),
        wastePercent: Number(wastePercent),
        ...fields,
      };
      onChange({
        ...merged,
        specs: { ...specs, ...merged },
      });
    };

    return (
      <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-black uppercase text-slate-800">
            {isLao ? 'ສະເປັກຟີມເຄືອບ ແລະ ນ້ຳຢາ (Lamination Specs)' : 'Lamination Film & Finish Specifications'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ປະເພດການເຄືອບ' : 'Lamination Method'} *
            </label>
            <select
              value={lamType}
              onChange={(e) => {
                const val = e.target.value;
                setLamType(val);
                updateLamParent({ lamType: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="thermal">ເຄືອບຮ້ອນ (Thermal Hot Melt)</option>
              <option value="cold">ເຄືອບເຢັນ (Cold Pressure Sensitive)</option>
              <option value="pouch">ຊອງເຄືອບແຂງ (Rigid Pouch Film)</option>
              <option value="uv_liquid">ນ້ຳຢາເຄືອບ UV (Liquid Varnish)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ຜິວສຳຜັດ (Surface Finish)' : 'Surface Sheen'} *
            </label>
            <select
              value={surfaceFinish}
              onChange={(e) => {
                const val = e.target.value;
                setSurfaceFinish(val);
                updateLamParent({ surfaceFinish: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            >
              {surfaceOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ຄວາມໜາໄມຄຣອນ (Microns μm)' : 'Thickness (Microns μm)'}
            </label>
            <input
              type="number"
              value={thicknessMicron}
              onChange={(e) => {
                const val = Number(e.target.value);
                setThicknessMicron(val);
                updateLamParent({ thicknessMicron: val });
              }}
              placeholder="25, 32, 125"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200/60">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ໜ້າກວ້າງມ້ວນ (mm)' : 'Roll Width (mm)'}
            </label>
            <input
              type="number"
              value={rollWidthMm}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRollWidthMm(val);
                updateLamParent({ rollWidthMm: val });
              }}
              placeholder="330, 635, 1270"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ຄວາມຍາວຕໍ່ມ້ວນ (m)' : 'Roll Length (m)'}
            </label>
            <input
              type="number"
              value={rollLengthM}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRollLengthM(val);
                updateLamParent({ rollLengthM: val });
              }}
              placeholder="100, 200"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ອັດຕາເສຍຫົວມ້ວນ (% Waste)' : 'Waste Allowance %'}
            </label>
            <input
              type="number"
              value={wastePercent}
              onChange={(e) => {
                const val = Number(e.target.value);
                setWastePercent(val);
                updateLamParent({ wastePercent: val });
              }}
              placeholder="5"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. BINDING & FINISHING MATERIALS SPEC FORM
  // =========================================================================
  if (cat.includes('bind') || cat.includes('ເຂົ້າເຫຼັ້ມ')) {
    const [bindingType, setBindingType] = useState(specs.bindingType || 'PERFECT_BIND');
    const [wireDiameterMm, setWireDiameterMm] = useState(specs.wireDiameterMm || 8);
    const [pitch, setPitch] = useState(specs.pitch || '3:1');
    const [spineColor, setSpineColor] = useState(specs.spineColor || 'Black');
    const [tapeWidthMm, setTapeWidthMm] = useState(specs.tapeWidthMm || 36);
    const [glueType, setGlueType] = useState(specs.glueType || 'EVA');

    const updateBindingParent = (fields: any = {}) => {
      const merged = {
        bindingType,
        wireDiameterMm: Number(wireDiameterMm),
        pitch,
        spineColor,
        tapeWidthMm: Number(tapeWidthMm),
        glueType,
        ...fields,
      };
      onChange({
        ...merged,
        specs: { ...specs, ...merged },
      });
    };

    return (
      <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
          <Layers className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-black uppercase text-slate-800">
            {isLao ? 'ສະເປັກວັດສະດຸເຂົ້າເຫຼັ້ມ (Bookbinding Supplies)' : 'Binding Consumable Specifications'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ຮູບແບບການເຂົ້າເຫຼັ້ມ' : 'Binding Category'} *
            </label>
            <select
              value={bindingType}
              onChange={(e) => {
                const val = e.target.value;
                setBindingType(val);
                updateBindingParent({ bindingType: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="PERFECT_BIND">ກາວຮ້ອນ (Hot Melt Glue)</option>
              <option value="WIRE_O">ສັນຂົດລວດຄູ່ (Wire-O Spine)</option>
              <option value="PLASTIC_COMB">ສັນກະດູກງູ (Plastic Comb)</option>
              <option value="TAPE_BIND">ສັນຜ້າເທບກາວ (Spine Cloth Tape)</option>
              <option value="SADDLE_STITCH">ລວດຫຍິບເຫຼັ້ມ (Staples / Wire)</option>
            </select>
          </div>

          {bindingType === 'WIRE_O' || bindingType === 'PLASTIC_COMB' ? (
            <>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  {isLao ? 'ຂະໜາດເສັ້ນຜ່າສູນກາງ (mm)' : 'Spine Diameter (mm)'}
                </label>
                <input
                  type="number"
                  value={wireDiameterMm}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setWireDiameterMm(val);
                    updateBindingParent({ wireDiameterMm: val });
                  }}
                  placeholder="6, 8, 10, 12, 14... 32"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  {isLao ? 'ອັດຕາສ່ວນໄລຍະຮູ (Pitch)' : 'Pitch'}
                </label>
                <select
                  value={pitch}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPitch(val);
                    updateBindingParent({ pitch: val });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="3:1">3:1 (3 ຮູຕໍ່ 1 ນິ້ວ - ເຫຼັ້ມບາງ-ກາງ)</option>
                  <option value="2:1">2:1 (2 ຮູຕໍ່ 1 ນິ້ວ - ເຫຼັ້ມໜາ)</option>
                </select>
              </div>
            </>
          ) : bindingType === 'TAPE_BIND' ? (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                {isLao ? 'ໜ້າກວ້າງເທບ (mm)' : 'Tape Width (mm)'}
              </label>
              <select
                value={tapeWidthMm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTapeWidthMm(val);
                  updateBindingParent({ tapeWidthMm: val });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
              >
                <option value={24}>24 mm (ສັນບາງ 1-5mm)</option>
                <option value={36}>36 mm (ສັນກາງ 5-15mm)</option>
                <option value={48}>48 mm (ສັນໜາ 15-30mm)</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                {isLao ? 'ປະເພດກາວ (Hot Melt Type)' : 'Adhesive Type'}
              </label>
              <select
                value={glueType}
                onChange={(e) => {
                  const val = e.target.value;
                  setGlueType(val);
                  updateBindingParent({ glueType: val });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="EVA">ເມັດກາວ EVA (ມາດຕະຖານໂຮງພິມ)</option>
                <option value="PUR">ກາວ PUR (ຍຶດເກາະສູງສຸດ ພັບກາງ 180°)</option>
                <option value="PVA">ກາວຂາວ PVA (ງານຝີມືເຂົ້າເຫຼັ້ມມື)</option>
              </select>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5. RIGID SUBSTRATES & BOARDS SPEC FORM
  // =========================================================================
  if (cat.includes('rigid') || cat.includes('ແຂງ') || cat.includes('board') || cat.includes('ບອດ')) {
    const [substrateType, setSubstrateType] = useState(specs.substrateType || 'foam_board');
    const [boardThicknessMm, setBoardThicknessMm] = useState(specs.boardThicknessMm || 5);
    const [sheetWidthMm, setSheetWidthMm] = useState(specs.sheetWidthMm || 1220);
    const [sheetHeightMm, setSheetHeightMm] = useState(specs.sheetHeightMm || 2440);
    const [wasteFactorPct, setWasteFactorPct] = useState(specs.wasteFactorPct || 15);

    const updateRigidParent = (fields: any = {}) => {
      const merged = {
        substrateType,
        boardThicknessMm: Number(boardThicknessMm),
        sheetWidthMm: Number(sheetWidthMm),
        sheetHeightMm: Number(sheetHeightMm),
        wasteFactorPct: Number(wasteFactorPct),
        ...fields,
      };
      onChange({
        ...merged,
        specs: { ...specs, ...merged },
      });
    };

    return (
      <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
          <Maximize2 className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-black uppercase text-slate-800">
            {isLao ? 'ສະເປັກແຜ່ນບອດ ແລະ ວັດສະດຸແຂງ (Rigid Substrates)' : 'Rigid Boards & Substrates'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ປະເພດວັດສະດຸແຂງ' : 'Substrate Category'} *
            </label>
            <select
              value={substrateType}
              onChange={(e) => {
                const val = e.target.value;
                setSubstrateType(val);
                updateRigidParent({ substrateType: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="foam_board">ໂຟມບອດ (Foam Board)</option>
              <option value="future_board">ຟິວເຈີບອດ (Corrugated PP Board)</option>
              <option value="plastwood">ພາດສະວູດ PVC (Plastwood)</option>
              <option value="acrylic">ແຜ່ນອາຄຣີລິກ (Acrylic Sheet)</option>
              <option value="composite">ອາລູມີນຽມຄອມໂພສິດ (Composite)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ຄວາມໜາ (Thickness mm)' : 'Thickness (mm)'} *
            </label>
            <input
              type="number"
              step="0.5"
              value={boardThicknessMm}
              onChange={(e) => {
                const val = Number(e.target.value);
                setBoardThicknessMm(val);
                updateRigidParent({ boardThicknessMm: val });
              }}
              placeholder="2, 3, 5, 8, 10"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ອັດຕາເສດຂອບຕັດ (% Waste Factor)' : 'Waste Factor %'}
            </label>
            <input
              type="number"
              value={wasteFactorPct}
              onChange={(e) => {
                const val = Number(e.target.value);
                setWasteFactorPct(val);
                updateRigidParent({ wasteFactorPct: val });
              }}
              placeholder="15"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 6. PACKAGING CONSUMABLES SPEC FORM
  // =========================================================================
  if (cat.includes('packag') || cat.includes('ບັນຈຸ') || cat.includes('box') || cat.includes('ກ່ອງ')) {
    const [packCategory, setPackCategory] = useState(specs.packCategory || 'box');
    const [boxDimensions, setBoxDimensions] = useState(specs.boxDimensions || '100 Business Cards Box');
    const [bubbleLengthM, setBubbleLengthM] = useState(specs.bubbleLengthM || 100);

    const updatePackagingParent = (fields: any = {}) => {
      const merged = {
        packCategory,
        boxDimensions,
        bubbleLengthM: Number(bubbleLengthM),
        ...fields,
      };
      onChange({
        ...merged,
        specs: { ...specs, ...merged },
      });
    };

    return (
      <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
          <Package className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-black uppercase text-slate-800">
            {isLao ? 'ສະເປັກບັນຈຸພັນ (Packaging Supplies)' : 'Packaging Consumables'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ປະເພດບັນຈຸພັນ' : 'Packaging Type'} *
            </label>
            <select
              value={packCategory}
              onChange={(e) => {
                const val = e.target.value;
                setPackCategory(val);
                updatePackagingParent({ packCategory: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="box_card">ກ່ອງໃສ່ນາມບັດ 100 ໃບ</option>
              <option value="box_a4">ກ່ອງໃສ່ປຶ້ມ/ເອກະສານ A4 (500 ແຜ່ນ)</option>
              <option value="box_postal">ກ່ອງລູກຟູກໄປສະນີ (00, 0, A, B, C)</option>
              <option value="bag_opp">ຖົງ OPP ແກ້ວໃສພ້ອມແຖບກາວ</option>
              <option value="bubble">ບັບເບິ້ນກັນກະແທກ (Air Bubble Roll)</option>
              <option value="tape_opp">ເທບກາວ OPP 2 ນິ້ວ</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ລາຍລະອຽດ / ຂະໜາດ' : 'Specification / Size'}
            </label>
            <input
              type="text"
              value={boxDimensions}
              onChange={(e) => {
                const val = e.target.value;
                setBoxDimensions(val);
                updatePackagingParent({ boxDimensions: val });
              }}
              placeholder="e.g. 100 Cards, 2-inch tape 100m"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 7. PRINTER & MACHINERY FORM (Printers, Cutters, Binders, Laminators)
  // =========================================================================
  if (cat.includes('printer') || cat.includes('machine') || cat.includes('equipment') || cat.includes('ຕັດ') || cat.includes('ພິມ')) {
    const rawName = formData.name || formData.itemName || '';
    const nameParts = rawName.trim().split(' ');
    const fallbackBrand = nameParts[0] || 'Brother';
    const fallbackModel = nameParts.slice(1).join(' ') || rawName || 'MFC-J2740DW';

    const [brand, setBrand] = useState(specs.brand || formData.brand || fallbackBrand);
    const [model, setModel] = useState(specs.model || formData.model || fallbackModel);
    const [serialNumber, setSerialNumber] = useState(formData.serialNumber || specs.serialNumber || formData.sn || '');
    const [printerCategory, setPrinterCategory] = useState(specs.printerCategory || specs.printer_category || formData.printerCategory || 'Inkjet');
    const [operatingWatts, setOperatingWatts] = useState(specs.operating_power_watts || specs.operatingWatts || 1200);
    const [warmUpTimeMins, setWarmUpTimeMins] = useState(specs.warm_up_time_mins || specs.warmUpMins || 2);
    const [expectedLifeA4, setExpectedLifeA4] = useState(specs.expectedLifeA4Pages || specs.expected_life_a4 || formData.expectedLifeA4Pages || 50000);

    const updatePrinterParent = (fields: any = {}) => {
      const merged = {
        brand,
        model,
        serialNumber,
        printerCategory,
        operating_power_watts: Number(operatingWatts),
        warm_up_time_mins: Number(warmUpTimeMins),
        expectedLifeA4Pages: Number(expectedLifeA4),
        ...fields,
      };
      onChange({
        ...merged,
        specs: { ...specs, ...merged },
      });
    };

    return (
      <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
          <Printer className="w-4 h-4 text-sky-600" />
          <span className="text-xs font-black uppercase text-slate-800">
            {isLao ? 'ສະເປັກເຄື່ອງຈັກ ແລະ ພະລັງງານໄຟຟ້າ (Machine & Energy Specs)' : 'Machinery Specifications'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
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
              placeholder="Epson, Canon, Boway"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
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
              placeholder="L15150, C5005d"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ໝວດເຄື່ອງຈັກ' : 'Category'}
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
              <option value="Inkjet">Inkjet Printer</option>
              <option value="Laser">Laser / LED Printer</option>
              <option value="Guillotine">Guillotine Cutter (ຕັດເຈ້ຍເປັນຕັ້ງ)</option>
              <option value="Plotter">Roll Plotter (ຕັດສະຕິກເກີມ້ວນ)</option>
              <option value="Laminator">Roll Laminator (ເຄື່ອງເຄືອບ)</option>
              <option value="Binder">Perfect Binder (ເຄື່ອງກາວຮ້ອນ)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200/60">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ກຳລັງໄຟຟ້າຂະນະເຮັດວຽກ (Watts)' : 'Operating Power (Watts)'}
            </label>
            <input
              type="number"
              value={operatingWatts}
              onChange={(e) => {
                const val = Number(e.target.value);
                setOperatingWatts(val);
                updatePrinterParent({ operating_power_watts: val });
              }}
              placeholder="1200"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ໄລຍະເວລາອຸ່ນເຄື່ອງ (ນາທີ)' : 'Warm-up Time (mins)'}
            </label>
            <input
              type="number"
              value={warmUpTimeMins}
              onChange={(e) => {
                const val = Number(e.target.value);
                setWarmUpTimeMins(val);
                updatePrinterParent({ warm_up_time_mins: val });
              }}
              placeholder="2"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              {isLao ? 'ອາຍຸການໃຊ້ງານປະເມີນ (Target Units)' : 'Expected Lifespan'}
            </label>
            <input
              type="number"
              value={expectedLifeA4}
              onChange={(e) => {
                const val = Number(e.target.value);
                setExpectedLifeA4(val);
                updatePrinterParent({ expectedLifeA4Pages: val });
              }}
              placeholder="50000"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
            />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 8. GENERIC FALLBACK
  // =========================================================================
  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 font-medium">
      {isLao
        ? 'ໝວດໝູ່ນີ້ໃຊ້ສະເປັກພື້ນຖານມາດຕະຖານ ບໍ່ຈຳເປັນຕ້ອງລະບຸຄຸນລັກສະນະເພີ່ມເຕີມ'
        : 'Standard consumable item specifications applied.'}
    </div>
  );
}
