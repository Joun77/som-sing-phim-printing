import React from 'react';
import { InboundItemFormData } from './types';
import { Printer, Film, BookOpen, Scissors, Maximize2, Package, Wrench, Zap, Layers } from 'lucide-react';
import { useApp } from '@store/AppContext';
import ColorSlotConfigurator, { ColorSlot, STANDARD_PRESETS } from '@features/inventory/components/forms/common/ColorSlotConfigurator';

interface SpecsProps {
  item: InboundItemFormData;
  updateField: (field: keyof InboundItemFormData, value: any) => void;
  inventory?: any[];
}

// Reusable Bento Component for Color Slots & OEM Baseline Inks Configuration
const ColorConfigBentoSection: React.FC<{
  item: InboundItemFormData;
  updateField: (field: keyof InboundItemFormData, value: any) => void;
  isLaser: boolean;
}> = ({ item, updateField, isLaser }) => {
  const currentSlots = item.colorSlots && item.colorSlots.length > 0 
    ? item.colorSlots 
    : STANDARD_PRESETS[item.colorSchemeType || 'CMYK'] || STANDARD_PRESETS['CMYK'];

  const handleSchemeChange = (schemeId: string) => {
    const newSlots = STANDARD_PRESETS[schemeId] || STANDARD_PRESETS['CMYK'];
    updateField('colorSchemeType', schemeId);
    updateField('colorSlots', newSlots);
    updateField('totalColorSlots', newSlots.length);
    const updatedInks = newSlots.map((s, idx) => {
      const existing = (item.printerInkSlots || [])[idx];
      return existing ? { ...existing, slotPosition: `Slot ${idx + 1} (${s.code} - ${s.name})` } : {
        slotPosition: `Slot ${idx + 1} (${s.code} - ${s.name})`,
        colorGroup: s.name,
        oemInkCode: `${item.machineBrand ? item.machineBrand.toUpperCase() : 'OEM'}-${s.code}`,
        oemStandardVolumeMl: isLaser ? 100 : 70,
        oemStandardIsoYieldA4: isLaser ? 15000 : 6000
      };
    });
    updateField('printerInkSlots', updatedInks);
  };

  const handleSlotsChange = (newSlots: ColorSlot[]) => {
    updateField('colorSlots', newSlots);
    updateField('totalColorSlots', newSlots.length);
    const updatedInks = newSlots.map((s, idx) => {
      const existing = (item.printerInkSlots || [])[idx];
      return existing ? { ...existing, slotPosition: `Slot ${idx + 1} (${s.code} - ${s.name})` } : {
        slotPosition: `Slot ${idx + 1} (${s.code} - ${s.name})`,
        colorGroup: s.name,
        oemInkCode: `${item.machineBrand ? item.machineBrand.toUpperCase() : 'OEM'}-${s.code}`,
        oemStandardVolumeMl: isLaser ? 100 : 70,
        oemStandardIsoYieldA4: isLaser ? 15000 : 6000
      };
    });
    updateField('printerInkSlots', updatedInks);
  };

  const themeColor = isLaser ? 'indigo' : 'sky';

  return (
    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-4">
      <div className="space-y-1 border-b border-slate-200/60 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className={`w-4 h-4 ${isLaser ? 'text-indigo-600' : 'text-sky-600'}`} />
            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">
              {isLaser
                ? 'ຊ່ອງສີ ແລະ ໝຶກຜົງມາດຕະຖານ OEM Baseline (Laser Toner Slots)'
                : 'ຊ່ອງສີ ແລະ ນ້ຳໝຶກມາດຕະຖານ OEM Baseline (Inkjet Ink Slots)'}
            </h5>
          </div>
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${
              isLaser
                ? 'text-indigo-700 bg-white border-indigo-200'
                : 'text-sky-700 bg-white border-sky-200'
            }`}
          >
            {currentSlots.length} Slots ({item.colorSchemeType || 'CMYK'})
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          {isLaser
            ? 'ກຳນົດລະບົບຊ່ອງສີ ແລະ ສະເປັກໝຶກຜົງແທ້ OEM (Laser Toner) ເພື່ອໃຊ້ເປັນຄ່າ Baseline ມາດຕະຖານໃນການຄຳນວນຕົ້ນທຶນຕໍ່ໜ້າພິມ'
            : 'ກຳນົດລະບົບຊ່ອງສີ ແລະ ສະເປັກນ້ຳໝຶກແທ້ OEM (Liquid Ink) ເພື່ອໃຊ້ເປັນຄ່າ Baseline ມາດຕະຖານໃນການຄຳນວນຕົ້ນທຶນຕໍ່ໜ້າພິມ'}
        </p>
      </div>

      <ColorSlotConfigurator
        colorScheme={item.colorSchemeType || 'CMYK'}
        slots={currentSlots}
        onSchemeChange={handleSchemeChange}
        onSlotsChange={handleSlotsChange}
      />

      {/* Bento Slot Cards for OEM Ink Specs */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
            {isLaser
              ? 'ລາຍລະອຽດໝຶກຜົງແທ້ OEM ປະຈຳ Slot (Laser Toner Baseline):'
              : 'ລາຍລະອຽດນ້ຳໝຶກແທ້ OEM ປະຈຳ Slot (Inkjet Ink Baseline):'}
          </span>
          <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
            {isLaser ? 'Baseline: g/p' : 'Baseline: ml/p'}
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          {isLaser
            ? 'ກຳນົດນ້ຳໜັກຕລັບ (g) ແລະ ຄ່າ ISO Yield (A4) ຂອງໝຶກຜົງແທ້ OEM ແຕ່ລະສີ ເພື່ອຄຳນວນອັດຕາການສິ້ນເປືອງຕໍ່ແຜ່ນຕົວຈິງ (Rate: g/p)'
            : 'ກຳນົດຄວາມຈຸ (ml) ແລະ ຄ່າ ISO Yield (A4) ຂອງນ້ຳໝຶກແທ້ OEM ແຕ່ລະສີ ເພື່ອຄຳນວນອັດຕາການສິ້ນເປືອງຕໍ່ແຜ່ນຕົວຈິງ (Rate: ml/p)'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentSlots.map((slot, index) => {
            const inkSlot = (item.printerInkSlots || [])[index] || {
              slotPosition: `Slot ${index + 1} (${slot.code} - ${slot.name})`,
              oemInkCode: `${item.machineBrand ? item.machineBrand.toUpperCase() : 'OEM'}-${slot.code}`,
              oemStandardVolumeMl: isLaser ? 100 : 70,
              oemStandardIsoYieldA4: isLaser ? 15000 : 6000,
            };
            const vol = Number(inkSlot.oemStandardVolumeMl) || (isLaser ? 100 : 70);
            const yld = Number(inkSlot.oemStandardIsoYieldA4) || (isLaser ? 15000 : 6000);
            const rate = yld > 0 ? (vol / yld).toFixed(5) : '0.00000';

            return (
              <div
                key={slot.id || index}
                className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                      style={{ backgroundColor: slot.hexColor || '#000000' }}
                    />
                    <span className="text-xs font-black text-slate-800 tracking-tight">
                      {slot.code} - {slot.name}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                      isLaser
                        ? 'text-indigo-700 bg-indigo-50 border-indigo-100'
                        : 'text-sky-700 bg-sky-50 border-sky-100'
                    }`}
                  >
                    Rate: {rate} {isLaser ? 'g/p' : 'ml/p'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5 text-[11px]">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      OEM SKU
                    </label>
                    <input
                      type="text"
                      placeholder={isLaser ? 'DOCU-C5005-K' : 'EPSON-003-BK'}
                      value={inkSlot.oemInkCode || ''}
                      onChange={(e) => {
                        const newSlots = [...(item.printerInkSlots || [])];
                        newSlots[index] = { ...inkSlot, oemInkCode: e.target.value };
                        updateField('printerInkSlots', newSlots);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 transition ${
                        isLaser
                          ? 'focus:border-indigo-500 focus:ring-indigo-500/10'
                          : 'focus:border-sky-500 focus:ring-sky-500/10'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {isLaser ? 'ນ້ຳໜັກ (g)' : 'ຄວາມຈຸ (ml)'}
                    </label>
                    <input
                      type="number"
                      value={inkSlot.oemStandardVolumeMl || (isLaser ? 100 : 70)}
                      onChange={(e) => {
                        const newSlots = [...(item.printerInkSlots || [])];
                        newSlots[index] = { ...inkSlot, oemStandardVolumeMl: Number(e.target.value) };
                        updateField('printerInkSlots', newSlots);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 transition ${
                        isLaser
                          ? 'focus:border-indigo-500 focus:ring-indigo-500/10'
                          : 'focus:border-sky-500 focus:ring-sky-500/10'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      ISO Yield (A4)
                    </label>
                    <input
                      type="number"
                      value={inkSlot.oemStandardIsoYieldA4 || (isLaser ? 15000 : 6000)}
                      onChange={(e) => {
                        const newSlots = [...(item.printerInkSlots || [])];
                        newSlots[index] = { ...inkSlot, oemStandardIsoYieldA4: Number(e.target.value) };
                        updateField('printerInkSlots', newSlots);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 transition ${
                        isLaser
                          ? 'focus:border-indigo-500 focus:ring-indigo-500/10'
                          : 'focus:border-sky-500 focus:ring-sky-500/10'
                      }`}
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
};

// Reusable Bento Component for Machine Wear Parts & Lifespan Configuration
interface WearPartBentoCardProps {
  title: string;
  cost: number;
  life: number;
  onCostChange: (val: number) => void;
  onLifeChange: (val: number) => void;
  costLabel?: string;
  lifeLabel?: string;
  unitLabel?: string;
  badgeColor?: 'indigo' | 'sky' | 'amber' | 'purple' | 'rose';
}

const WearPartBentoCard: React.FC<WearPartBentoCardProps> = ({
  title,
  cost,
  life,
  onCostChange,
  onLifeChange,
  costLabel = 'ລາຄາຊື້ປ່ຽນ (LAK)',
  lifeLabel = 'ໄລຍະແຜ່ນ (Pages)',
  unitLabel = 'LAK/p',
  badgeColor = 'indigo',
}) => {
  const rate = life > 0 ? cost / life : 0;
  const formattedRate = rate > 0 && rate < 1 ? rate.toFixed(2) : Math.round(rate).toLocaleString();

  const colorStyles: Record<string, string> = {
    indigo: 'text-indigo-700 bg-indigo-50 border-indigo-100',
    sky: 'text-sky-700 bg-sky-50 border-sky-100',
    amber: 'text-amber-700 bg-amber-50 border-amber-100',
    purple: 'text-purple-700 bg-purple-50 border-purple-100',
    rose: 'text-rose-700 bg-rose-50 border-rose-100',
  };

  return (
    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5 hover:border-slate-300 transition">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-xs font-black text-slate-800 tracking-tight">
          {title}
        </span>
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${colorStyles[badgeColor] || colorStyles.indigo}`}>
          Rate: {formattedRate} {unitLabel}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            {costLabel}
          </label>
          <input
            type="number"
            value={cost === 0 ? '' : cost}
            onChange={(e) => onCostChange(Number(e.target.value))}
            placeholder="0"
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            {lifeLabel}
          </label>
          <input
            type="number"
            value={life === 0 ? '' : life}
            onChange={(e) => onLifeChange(Number(e.target.value))}
            placeholder="0"
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition"
          />
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 1. UNIFIED MACHINERY & PRINTERS SPECS FORM (WITH BUILT-IN WEAR PARTS)
// =========================================================================
export const MachinerySpecsForm: React.FC<SpecsProps> = ({ item, updateField }) => {
  const machineType = item.machineryTypeCategory || 'laser';

  return (
    <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Printer className="w-5 h-5 text-indigo-600" />
          <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
            ເຄື່ອງຈັກ ແລະ ເຄື່ອງພິມ (Machines & Equipment Assets)
          </h4>
        </div>
        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100">
          Built-in Wear Parts & Overhead
        </span>
      </div>

      {/* Machine Type Selector Tab */}
      <div>
        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
          ເລືອກປະເພດເຄື່ອງຈັກ (Machine Category) *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-100 p-1.5 rounded-2xl">
          {[
            { id: 'laser', label: 'Laser Printer (ເລເຊີ)' },
            { id: 'inkjet', label: 'Inkjet Printer (ອິ້ງເຈັດ)' },
            { id: 'guillotine', label: 'ເຄື່ອງຕັດ (Cutter)' },
            { id: 'laminator', label: 'ເຄື່ອງເຄືອບ (Laminator)' },
            { id: 'binder', label: 'ເຄື່ອງເຂົ້າເຫຼັ້ມ (Binder)' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => updateField('machineryTypeCategory', m.id)}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
                machineType === m.id
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Basic Machine Identifiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            ແບຣນ (Brand) *
          </label>
          <input
            type="text"
            value={item.machineBrand}
            onChange={(e) => updateField('machineBrand', e.target.value)}
            placeholder="e.g. Fuji Xerox, Canon, Epson, Boway"
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            ຮຸ່ນ (Series / Model) *
          </label>
          <input
            type="text"
            value={item.machineModel}
            onChange={(e) => updateField('machineModel', e.target.value)}
            placeholder="e.g. DocuPrint C5005d, L15150, 920 Guillotine"
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            ລະຫັດເຄື່ອງ / SKU (Asset Code)
          </label>
          <div className="relative">
            <input
              type="text"
              value={item.machineSn || `EQ-${machineType.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`}
              onChange={(e) => updateField('machineSn', e.target.value)}
              placeholder="Auto SKU: EQ-..."
              className="w-full pl-3.5 pr-16 h-[42px] rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-xs text-indigo-950 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 pointer-events-none">
              Auto
            </span>
          </div>
        </div>
      </div>
      {/* ========================================================= */}
      {/* 1.1 SPECIFIC SECTION: LASER PRINTER                       */}
      {/* ========================================================= */}
      {machineType === 'laser' && (
        <div className="space-y-4 pt-2 border-t border-slate-100">
          {/* BENTO: LASER PRINTER GENERAL SPECS */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <div className="text-xs font-black uppercase text-indigo-950 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span>ສະເປັກເຄື່ອງພິມເລເຊີ (Laser Printer Specs)</span>
              </div>
              <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                Media & Speed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                  ຂະໜາດເຈ້ຍສູງສຸດ (Max Paper Size)
                </label>
                <select
                  value={item.printerMaxPaperSize || 'SRA3'}
                  onChange={(e) => updateField('printerMaxPaperSize', e.target.value)}
                  className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="SRA3">SRA3 (320 x 450 mm)</option>
                  <option value="A3">A3 (297 x 420 mm)</option>
                  <option value="A4">A4 (210 x 297 mm)</option>
                  <option value="Legal">Legal (216 x 356 mm)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                  ຊ່ວງແກຣມທີ່ຮອງຮັບ (Min - Max GSM)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      value={item.printerSupportedGsmMin || 60}
                      onChange={(e) => updateField('printerSupportedGsmMin', Number(e.target.value))}
                      placeholder="Min 60"
                      className="w-full pl-3 pr-9 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 uppercase pointer-events-none">
                      Min
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={item.printerSupportedGsmMax || 300}
                      onChange={(e) => updateField('printerSupportedGsmMax', Number(e.target.value))}
                      placeholder="Max 300"
                      className="w-full pl-3 pr-9 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 uppercase pointer-events-none">
                      Max
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                  ລະບົບພິມສອງໜ້າ (Duplex)
                </label>
                <select
                  value={item.printerDuplexMode || 'auto'}
                  onChange={(e) => updateField('printerDuplexMode', e.target.value as 'auto' | 'manual')}
                  className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="auto">Auto-Duplex (ພິມສອງໜ້າອັດຕະໂນມັດ)</option>
                  <option value="manual">Manual (ກັບໜ້າເອງ)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                  ຄວາມໄວພິມຂາວດຳ (Black PPM)
                </label>
                <input
                  type="number"
                  value={item.printerSpeedMonoPpm || 35}
                  onChange={(e) => updateField('printerSpeedMonoPpm', Number(e.target.value))}
                  className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                  ຄວາມໄວພິມສີ (Color PPM)
                </label>
                <input
                  type="number"
                  value={item.printerSpeedColorPpm || 30}
                  onChange={(e) => updateField('printerSpeedColorPpm', Number(e.target.value))}
                  className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                  ປະເພດສີທີ່ຮອງຮັບ
                </label>
                <select
                  value={item.printerColorCapability || 'color'}
                  onChange={(e) => updateField('printerColorCapability', e.target.value as 'monochrome' | 'color')}
                  className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="color">Color (4 ສີ CMYK)</option>
                  <option value="monochrome">Monochrome (1 ສີ ຂາວດຳ)</option>
                </select>
              </div>
            </div>
          </div>

          {/* BENTO 2: OEM COLOR SLOTS & BASELINE INK CONFIGURATOR */}
          <ColorConfigBentoSection item={item} updateField={updateField} isLaser={true} />

          {/* BUILT-IN WEAR PARTS FOR LASER PRINTER */}
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-900 font-black text-xs uppercase tracking-wider">
                <Wrench className="w-4 h-4 text-indigo-600" />
                <span>ຄ່າ Maintenance & ອະໄຫຼ່ສິ້ນເປືອງປະຈຳເຄື່ອງ (Laser Wear Parts)</span>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200">
                5 Wear Parts
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              ກຳນົດລາຄາຊື້ໃໝ່ ແລະ ອາຍຸການໃຊ້ງານ (ໄລຍະແຜ່ນ) ຂອງແຕ່ລະອະໄຫຼ່ ເພື່ອໃຫ້ລະບົບຄຳນວນຕົ້ນທຶນສຶກຫຼໍຕໍ່ແຜ່ນຕົວຈິງ (LAK/Page)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <WearPartBentoCard
                title="1. ຊຸດດຣຳ (Drum Unit)"
                cost={item.wearDrumUnitCost || 1500000}
                life={item.wearDrumUnitLife || 50000}
                onCostChange={(val) => updateField('wearDrumUnitCost', val)}
                onLifeChange={(val) => updateField('wearDrumUnitLife', val)}
                costLabel="ລາຄາຊື້ປ່ຽນ (LAK)"
                lifeLabel="ໄລຍະແຜ່ນ (Pages)"
                unitLabel="LAK/p"
                badgeColor="indigo"
              />
              <WearPartBentoCard
                title="2. ຊຸດຄວາມຮ້ອນ (Fuser Unit)"
                cost={item.wearFuserUnitCost || 2000000}
                life={item.wearFuserUnitLife || 100000}
                onCostChange={(val) => updateField('wearFuserUnitCost', val)}
                onLifeChange={(val) => updateField('wearFuserUnitLife', val)}
                costLabel="ລາຄາຊື້ປ່ຽນ (LAK)"
                lifeLabel="ໄລຍະແຜ່ນ (Pages)"
                unitLabel="LAK/p"
                badgeColor="indigo"
              />
              <WearPartBentoCard
                title="3. ສາຍພານລຳລຽງພາບ (Transfer Belt)"
                cost={item.wearTransferBeltCost || 1800000}
                life={item.wearTransferBeltLife || 100000}
                onCostChange={(val) => updateField('wearTransferBeltCost', val)}
                onLifeChange={(val) => updateField('wearTransferBeltLife', val)}
                costLabel="ລາຄາຊື້ປ່ຽນ (LAK)"
                lifeLabel="ໄລຍະແຜ່ນ (Pages)"
                unitLabel="LAK/p"
                badgeColor="indigo"
              />
              <WearPartBentoCard
                title="4. ຊຸດລູກກິ້ງດຶງເຈ້ຍ (Pickup Roller)"
                cost={item.wearPickupRollerCost || 150000}
                life={item.wearPickupRollerLife || 30000}
                onCostChange={(val) => updateField('wearPickupRollerCost', val)}
                onLifeChange={(val) => updateField('wearPickupRollerLife', val)}
                costLabel="ລາຄາຊື້ປ່ຽນ (LAK)"
                lifeLabel="ໄລຍະແຜ່ນ (Pages)"
                unitLabel="LAK/p"
                badgeColor="indigo"
              />
              <WearPartBentoCard
                title="5. ກ່ອງໝຶກເສຍ (Waste Toner Box)"
                cost={item.wearWasteTonerBoxCost || 350000}
                life={item.wearWasteTonerBoxLife || 30000}
                onCostChange={(val) => updateField('wearWasteTonerBoxCost', val)}
                onLifeChange={(val) => updateField('wearWasteTonerBoxLife', val)}
                costLabel="ລາຄາຊື້ປ່ຽນ (LAK)"
                lifeLabel="ໄລຍະແຜ່ນ (Pages)"
                unitLabel="LAK/p"
                badgeColor="indigo"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1.2 SPECIFIC SECTION: INKJET PRINTER                      */}
      {/* ========================================================= */}
      {machineType === 'inkjet' && (
        <div className="space-y-4 pt-2 border-t border-slate-100">
          {/* BENTO: INKJET PRINTER GENERAL SPECS */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <div className="text-xs font-black uppercase text-sky-950 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-sky-600" />
                <span>ສະເປັກເຄື່ອງພິມອິ້ງເຈັດ (Inkjet Printer Specs)</span>
              </div>
              <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                Media & Ink Feed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                  ຮູບແບບການປ້ອນ (Feed Type)
                </label>
                <select
                  value={item.printerFeedType || 'cut_sheet'}
                  onChange={(e) => updateField('printerFeedType', e.target.value as 'cut_sheet' | 'roll' | 'both')}
                  className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="cut_sheet">ແບບແຜ່ນ (Cut-sheet A4, A3, A3+)</option>
                  <option value="roll">ແບບມ້ວນ (Roll Media 24", 36", 44")</option>
                  <option value="both">ຮອງຮັບທັງສອງແບບ (Both)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                  ຊ່ວງແກຣມທີ່ຮອງຮັບ (Min - Max GSM)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      value={item.printerSupportedGsmMin || 64}
                      onChange={(e) => updateField('printerSupportedGsmMin', Number(e.target.value))}
                      placeholder="Min 64"
                      className="w-full pl-3 pr-9 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-sky-500/20"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 uppercase pointer-events-none">
                      Min
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={item.printerSupportedGsmMax || 300}
                      onChange={(e) => updateField('printerSupportedGsmMax', Number(e.target.value))}
                      placeholder="Max 300"
                      className="w-full pl-3 pr-9 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-sky-500/20"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 uppercase pointer-events-none">
                      Max
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                  ປະເພດນ້ຳໝຶກ
                </label>
                <select
                  value={item.printerInkType || 'Pigment'}
                  onChange={(e) => updateField('printerInkType', e.target.value)}
                  className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="Dye">Dye Ink</option>
                  <option value="Pigment">Pigment Ink</option>
                  <option value="Sublimation">Sublimation</option>
                  <option value="Eco-Solvent">Eco-Solvent</option>
                </select>
              </div>
            </div>
          </div>

          {/* BENTO 2: OEM COLOR SLOTS & BASELINE INK CONFIGURATOR */}
          <ColorConfigBentoSection item={item} updateField={updateField} isLaser={false} />

          {/* BUILT-IN WEAR PARTS FOR INKJET */}
          <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-900 font-black text-xs uppercase tracking-wider">
                <Wrench className="w-4 h-4 text-sky-600" />
                <span>ຄ່າ Maintenance & ອະໄຫຼ່ສິ້ນເປືອງ (Inkjet Wear Parts)</span>
              </div>
              <span className="text-[10px] font-bold text-sky-700 bg-white px-2.5 py-0.5 rounded-lg border border-sky-200">
                Parts & Maintenance
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              ກຳນົດລາຄາຊື້ໃໝ່ ແລະ ໄລຍະແຜ່ນຂອງແຕ່ລະອະໄຫຼ່ ເພື່ອຄຳນວນຕົ້ນທຶນສຶກຫຼໍຕໍ່ແຜ່ນ (LAK/Page)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <WearPartBentoCard
                title="1. ຊຸດຊັບໝຶກ (Maint. Box)"
                cost={item.wearMaintBoxCost || 450000}
                life={item.wearMaintBoxLife || 25000}
                onCostChange={(val) => updateField('wearMaintBoxCost', val)}
                onLifeChange={(val) => updateField('wearMaintBoxLife', val)}
                costLabel="ລາຄາຊື້ປ່ຽນ (LAK)"
                lifeLabel="ໄລຍະແຜ່ນ (Pages)"
                unitLabel="LAK/p"
                badgeColor="sky"
              />
              <WearPartBentoCard
                title="2. ຫົວພິມ (Printhead)"
                cost={item.wearPrintheadCost || 4500000}
                life={item.wearPrintheadLife || 100000}
                onCostChange={(val) => updateField('wearPrintheadCost', val)}
                onLifeChange={(val) => updateField('wearPrintheadLife', val)}
                costLabel="ລາຄາຊື້ປ່ຽນ (LAK)"
                lifeLabel="ໄລຍະແຜ່ນ (Pages)"
                unitLabel="LAK/p"
                badgeColor="sky"
              />
              <WearPartBentoCard
                title="3. ສາຍພານຫົວພິມ (Carriage Belt)"
                cost={item.wearCarriageBeltCost || 500000}
                life={item.wearCarriageBeltLife || 50000}
                onCostChange={(val) => updateField('wearCarriageBeltCost', val)}
                onLifeChange={(val) => updateField('wearCarriageBeltLife', val)}
                costLabel="ລາຄາຊື້ປ່ຽນ (LAK)"
                lifeLabel="ໄລຍະແຜ່ນ (Pages)"
                unitLabel="LAK/p"
                badgeColor="sky"
              />
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5 hover:border-slate-300 transition">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-slate-800 tracking-tight">
                    4. ລ້າງຫົວພິມ (% Waste)
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border text-sky-700 bg-sky-50 border-sky-100">
                    Loss Rate
                  </span>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    ອັດຕາສູນເສຍລ້າງຫົວພິມ (% Ink Loss)
                  </label>
                  <input
                    type="number"
                    value={item.wasteLossCleaningPct || 5}
                    onChange={(e) => updateField('wasteLossCleaningPct', Number(e.target.value))}
                    placeholder="5"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1.3 SPECIFIC SECTION: CUTTING EQUIPMENT                   */}
      {/* ========================================================= */}
      {machineType === 'guillotine' && (
        <div className="space-y-4 pt-2 border-t border-slate-100">
          {/* BENTO: CUTTER GENERAL SPECS */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <div className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-amber-600" />
                <span>ສະເປັກເຄື່ອງຕັດ (Cutting Machine Specs)</span>
              </div>
              <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                Width & Speed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                  ປະເພດເຄື່ອງຕັດ
                </label>
                <select
                  value={item.postPressSubtype || 'guillotine'}
                  onChange={(e) => updateField('postPressSubtype', e.target.value)}
                  className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="guillotine">Guillotine Cutter (ຕັດເຈ້ຍເປັນຕັ້ງ)</option>
                  <option value="sticker_plotter">Roll Plotter (ພລັອດເຕີສະຕິກເກີມ້ວນ)</option>
                  <option value="flatbed_cutter">Flatbed Cutter (ໂຕະຮາບຕັດກ່ອງ/ໂຟມ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                  ໜ້າກວ້າງຮອງຮັບສູງສຸດ (mm)
                </label>
                <input
                  type="number"
                  value={item.cutterMaxWidthMm || 920}
                  onChange={(e) => updateField('cutterMaxWidthMm', Number(e.target.value))}
                  placeholder="920, 1300"
                  className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                  ຄວາມໄວສູງສຸດ (mm/s)
                </label>
                <input
                  type="number"
                  value={item.cutterMaxSpeedMms || 500}
                  onChange={(e) => updateField('cutterMaxSpeedMms', Number(e.target.value))}
                  className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>

          {/* BUILT-IN WEAR PARTS FOR CUTTER */}
          <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>ຄ່າສຶກຫຼໍອະໄຫຼ່ໃບມີດ ແລະ ໄມ້ຮອງຕັດ (Cutter Wear Parts)</span>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-white px-2.5 py-0.5 rounded-lg border border-amber-200">
                Blades & Sticks
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              ກຳນົດຄ່າຈ້າງລັບຄົມ/ປ່ຽນໃບມີດ ແລະ ຮອບຕັດເພື່ອຄຳນວນຕົ້ນທຶນຕໍ່ຮອບຕັດ (LAK/Cut) ຫຼື ແມັດຕັດ (LAK/m)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <WearPartBentoCard
                title="1. ຄ່າຈ້າງລັບຄົມໃບມີດ (Sharpening)"
                cost={item.wearSharpeningCost || 150000}
                life={item.wearSharpeningIntervalCuts || 10000}
                onCostChange={(val) => updateField('wearSharpeningCost', val)}
                onLifeChange={(val) => updateField('wearSharpeningIntervalCuts', val)}
                costLabel="ຄ່າຈ້າງລັບ/ຮອບ (LAK)"
                lifeLabel="ຮອບຕັດ (Cuts)"
                unitLabel="LAK/cut"
                badgeColor="amber"
              />
              <WearPartBentoCard
                title="2. ໄມ້ຮອງໃບມີດຕັດ (Cutting Stick)"
                cost={item.wearCuttingStickCost || 100000}
                life={item.wearCuttingStickLifeCuts || 20000}
                onCostChange={(val) => updateField('wearCuttingStickCost', val)}
                onLifeChange={(val) => updateField('wearCuttingStickLifeCuts', val)}
                costLabel="ລາຄາຊື້ປ່ຽນ (LAK)"
                lifeLabel="ຮອບຕັດ (Cuts)"
                unitLabel="LAK/cut"
                badgeColor="amber"
              />
              <WearPartBentoCard
                title="3. ໃບມີດພລັອດເຕີ (Plotter Blade)"
                cost={item.wearBladeCost || 250000}
                life={item.wearBladeLifeMeters || 5000}
                onCostChange={(val) => updateField('wearBladeCost', val)}
                onLifeChange={(val) => updateField('wearBladeLifeMeters', val)}
                costLabel="ລາຄາຊື້ໃໝ່ (LAK)"
                lifeLabel="ໄລຍະຕັດ (ແມັດ)"
                unitLabel="LAK/m"
                badgeColor="amber"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1.4 SPECIFIC SECTION: LAMINATION MACHINE                  */}
      {/* ========================================================= */}
      {machineType === 'laminator' && (
        <div className="space-y-4 pt-2 border-t border-slate-100">
          {/* BENTO: LAMINATOR GENERAL SPECS */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <div className="text-xs font-black uppercase text-purple-950 flex items-center gap-1.5">
                <Film className="w-4 h-4 text-purple-600" />
                <span>ສະເປັກເຄື່ອງເຄືອບ (Lamination Machine Specs)</span>
              </div>
              <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                Width & Heat
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                  ໜ້າກວ້າງຮອງຮັບ (mm)
                </label>
                <input
                  type="number"
                  value={item.laminatorMaxWidthMm || 650}
                  onChange={(e) => updateField('laminatorMaxWidthMm', Number(e.target.value))}
                  placeholder="350, 650, 1600"
                  className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                  ຄວາມໄວເຄືອບສູງສຸດ (m/min)
                </label>
                <input
                  type="number"
                  value={item.laminatorMaxSpeedMmin || 5}
                  onChange={(e) => updateField('laminatorMaxSpeedMmin', Number(e.target.value))}
                  className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                  ອຸນຫະພູມສູງສຸດ (°C)
                </label>
                <input
                  type="number"
                  value={item.laminatorMaxTempC || 140}
                  onChange={(e) => updateField('laminatorMaxTempC', Number(e.target.value))}
                  className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>
          </div>

          {/* BUILT-IN WEAR PARTS FOR LAMINATOR */}
          <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-900 font-black text-xs uppercase tracking-wider">
                <Wrench className="w-4 h-4 text-purple-600" />
                <span>ອະໄຫຼ່ສິ້ນເປືອງລູກກິ້ງ ແລະ ແທ່ງຄວາມຮ້ອນ (Laminator Wear Parts)</span>
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-white px-2.5 py-0.5 rounded-lg border border-purple-200">
                Rollers & Heating
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              ກຳນົດລາຄາປ່ຽນ ແລະ ໄລຍະໃຊ້ງານເພື່ອຄຳນວນຕົ້ນທຶນຕໍ່ແມັດ (LAK/m) ຫຼື ຊົ່ວໂມງ (LAK/hr)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <WearPartBentoCard
                title="1. ລູກກິ້ງຢາງຄວາມຮ້ອນ (Silicone Rollers)"
                cost={item.wearSiliconeRollerCost || 1200000}
                life={item.wearSiliconeRollerLifeMeters || 20000}
                onCostChange={(val) => updateField('wearSiliconeRollerCost', val)}
                onLifeChange={(val) => updateField('wearSiliconeRollerLifeMeters', val)}
                costLabel="ລາຄາຊື້ປ່ຽນ (LAK)"
                lifeLabel="ໄລຍະແມັດຍາວ (Meters)"
                unitLabel="LAK/m"
                badgeColor="purple"
              />
              <WearPartBentoCard
                title="2. ແທ່ງຄວາມຮ້ອນ (Heating Element)"
                cost={item.wearHeatingElementCost || 800000}
                life={item.wearHeatingElementHours || 5000}
                onCostChange={(val) => updateField('wearHeatingElementCost', val)}
                onLifeChange={(val) => updateField('wearHeatingElementHours', val)}
                costLabel="ລາຄາຊື້ປ່ຽນ (LAK)"
                lifeLabel="ອາຍຸຊົ່ວໂມງໃຊ້ງານ (Hours)"
                unitLabel="LAK/hr"
                badgeColor="purple"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1.5 SPECIFIC SECTION: BINDING MACHINE                     */}
      {/* ========================================================= */}
      {machineType === 'binder' && (
        <div className="space-y-4 pt-2 border-t border-slate-100">
          {/* BENTO: BINDER GENERAL SPECS */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <div className="text-xs font-black uppercase text-rose-950 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-rose-600" />
                <span>ສະເປັກເຄື່ອງເຂົ້າເຫຼັ້ມ (Binding Machine Specs)</span>
              </div>
              <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                Spine & Capacity
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                  ຄວາມໜາສູງສຸດ (mm)
                </label>
                <input
                  type="number"
                  value={item.binderMaxThicknessMm || 40}
                  onChange={(e) => updateField('binderMaxThicknessMm', Number(e.target.value))}
                  placeholder="40 mm (400 ແຜ່ນ)"
                  className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                  ຄວາມຍາວສັນປຶ້ມສູງສຸດ (mm)
                </label>
                <input
                  type="number"
                  value={item.binderMaxSpineLengthMm || 320}
                  onChange={(e) => updateField('binderMaxSpineLengthMm', Number(e.target.value))}
                  placeholder="320 mm"
                  className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
                  ຄວາມໄວ (ເຫຼັ້ມ/ຊົ່ວໂມງ)
                </label>
                <input
                  type="number"
                  value={item.binderSpeedBooksHr || 200}
                  onChange={(e) => updateField('binderSpeedBooksHr', Number(e.target.value))}
                  className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>
          </div>

          {/* BUILT-IN WEAR PARTS FOR BINDER */}
          <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-900 font-black text-xs uppercase tracking-wider">
                <Wrench className="w-4 h-4 text-rose-600" />
                <span>ອະໄຫຼ່ສິ້ນເປືອງໃບມີດປາດສັນ ແລະ ເຂັມເຈາະ (Binder Wear Parts)</span>
              </div>
              <span className="text-[10px] font-bold text-rose-700 bg-white px-2.5 py-0.5 rounded-lg border border-rose-200">
                Cutters & Pins
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              ກຳນົດລາຄາປ່ຽນ ແລະ ຈຳນວນເຫຼັ້ມ/ຮອບເຈາະ ເພື່ອຄຳນວນຕົ້ນທຶນຕໍ່ເຫຼັ້ມ (LAK/Book) ຫຼື ຮອບເຈາະ (LAK/Punch)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <WearPartBentoCard
                title="1. ໃບມີດປາດສັນປຶ້ມ (Milling Cutter)"
                cost={item.wearMillingCutterCost || 800000}
                life={item.wearMillingCutterLifeBooks || 10000}
                onCostChange={(val) => updateField('wearMillingCutterCost', val)}
                onLifeChange={(val) => updateField('wearMillingCutterLifeBooks', val)}
                costLabel="ລາຄາຊື້ປ່ຽນ (LAK)"
                lifeLabel="ຈຳນວນເຫຼັ້ມ (Books)"
                unitLabel="LAK/book"
                badgeColor="rose"
              />
              <WearPartBentoCard
                title="2. ຊຸດເຂັມເຈາະຮູສັນລວດ (Punching Pins)"
                cost={item.wearPunchingPinsCost || 600000}
                life={item.wearPunchingPinsLifePunches || 20000}
                onCostChange={(val) => updateField('wearPunchingPinsCost', val)}
                onLifeChange={(val) => updateField('wearPunchingPinsLifePunches', val)}
                costLabel="ລາຄາຊື້ປ່ຽນ (LAK)"
                lifeLabel="ຮອບເຈາະ (Punches)"
                unitLabel="LAK/punch"
                badgeColor="rose"
              />
            </div>
          </div>
        </div>
      )}

      {/* OVERHEAD ELECTRICITY & WARMUP (Common for all machines) */}
      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
          <div className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>ຕົ້ນທຶນພະລັງງານ ແລະ ການອຸ່ນເຄື່ອງ (Operating Overhead)</span>
          </div>
          <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
            Watts & Warmup
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
              ກຳລັງໄຟຟ້າຂະນະເຮັດວຽກ (Operating Power Watts) *
            </label>
            <input
              type="number"
              value={item.machineOperatingWatts || 1200}
              onChange={(e) => updateField('machineOperatingWatts', Number(e.target.value))}
              placeholder="1200"
              className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
              ໄລຍະເວລາອຸ່ນເຄື່ອງກ່ອນເລີ່ມພິມ (Warm-up / Pre-heat Mins)
            </label>
            <input
              type="number"
              value={item.warmUpTimeMins || 2}
              onChange={(e) => updateField('warmUpTimeMins', Number(e.target.value))}
              placeholder="2"
              className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. LAMINATION FILMS SPECS FORM (FORM 4 IN GOOGLE DOC)
// =========================================================================
export const LaminationSpecsForm: React.FC<SpecsProps> = ({ item, updateField }) => {
  return (
    <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Film className="w-5 h-5 text-purple-600" />
        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
          ຟີມເຄືອບ ແລະ ນ້ຳຢາ (Lamination Materials Specs)
        </h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ຊື່ຟີມເຄືອບ *</label>
          <input 
            type="text" 
            value={item.laminationName} 
            onChange={(e) => updateField('laminationName', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-purple-500/20" 
            placeholder="e.g. ຟີມເຄືອບຮ້ອນ PVC ດ້ານ 25μm" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ວິທີການເຄືອບ (Method)</label>
          <select 
            value={item.laminationMethod} 
            onChange={(e) => updateField('laminationMethod', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="Thermal (Heat)">ເຄືອບຮ້ອນ (Thermal Hot Melt)</option>
            <option value="Cold (Pressure)">ເຄືອບເຢັນ (Cold Pressure Sensitive)</option>
            <option value="Pouch">ຊອງແຂງ (Rigid Pouch Film)</option>
            <option value="UV Varnish">ນ້ຳຢາເຄືອບ UV Varnish</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ຜິວສຳຜັດ (Surface Finish)</label>
          <select 
            value={item.laminationFinish} 
            onChange={(e) => updateField('laminationFinish', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="GLOSS_PVC">ເງົາ (Glossy)</option>
            <option value="MATTE_PVC">ດ້ານ (Matte)</option>
            <option value="SOFT_TOUCH">ກຳມະຫຍີ່ Soft-Touch (Velvet)</option>
            <option value="SAND_TEXTURE">ລາຍເມັດຊາຍ (Sand Grain)</option>
            <option value="HOLOGRAM">ໂຮໂລແກຣມ (Hologram)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2 border-t border-slate-100">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ຄວາມໜາໄມຄຣອນ (Microns / μm)</label>
          <input 
            type="text" 
            value={item.laminationThickness} 
            onChange={(e) => updateField('laminationThickness', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-purple-500/20" 
            placeholder="e.g. 25μm, 32μm, 125μm" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ໜ້າກວ້າງມ້ວນ (mm)</label>
          <input 
            type="number" 
            value={item.laminationWidthMm || 330} 
            onChange={(e) => updateField('laminationWidthMm', Number(e.target.value))} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-purple-500/20" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ຄວາມຍາວຕໍ່ມ້ວນ (m)</label>
          <input 
            type="number" 
            value={item.laminationLengthM || 100} 
            onChange={(e) => updateField('laminationLengthM', Number(e.target.value))} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-purple-500/20" 
          />
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 5. BINDING & FINISHING MATERIALS (FORM 5 IN GOOGLE DOC)
// =========================================================================
export const BindingSpecsForm: React.FC<SpecsProps> = ({ item, updateField }) => {
  return (
    <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <BookOpen className="w-5 h-5 text-rose-600" />
        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
          ອຸປະກອນເຂົ້າເຫຼັ້ມ ແລະ ງານແປຮູບ (Binding Materials Specs)
        </h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ຊື່ອຸປະກອນ *</label>
          <input 
            type="text" 
            value={item.bindingName} 
            onChange={(e) => updateField('bindingName', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-rose-500/20" 
            placeholder="e.g. ສັນຂົດລວດຄູ່ 10mm ສີດຳ" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ປະເພດການເຂົ້າເຫຼັ້ມ</label>
          <select 
            value={item.bindingType} 
            onChange={(e) => updateField('bindingType', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="WIRE_O">ສັນຂົດລວດຄູ່ (Wire-O Double Loop)</option>
            <option value="PLASTIC_COMB">ສັນກະດູກງູ (Plastic Comb)</option>
            <option value="HOT_MELT_GLUE">ເມັດກາວຮ້ອນ (EVA / PUR Glue)</option>
            <option value="SPINE_TAPE">ສັນຜ້າເທບກາວ (Spine Cloth Tape)</option>
            <option value="STAPLES">ລວດຫຍິບເຫຼັ້ມ (Stitching Wire)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ຂະໜາດເສັ້ນຜ່າສູນກາງ (mm)</label>
          <input 
            type="text" 
            value={item.bindingDiameter} 
            onChange={(e) => updateField('bindingDiameter', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-rose-500/20" 
            placeholder="e.g. 6mm, 8mm, 10mm... 32mm" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2 border-t border-slate-100">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ອັດຕາສ່ວນຮູ (Pitch)</label>
          <select 
            value={item.bindingPitch} 
            onChange={(e) => updateField('bindingPitch', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="3:1">3:1 (3 ຮູ/ນິ້ວ ສຳລັບເຫຼັ້ມບາງ-ກາງ)</option>
            <option value="2:1">2:1 (2 ຮູ/ນິ້ວ ສຳລັບເຫຼັ້ມໜາ)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ສີ (Color)</label>
          <input 
            type="text" 
            value={item.bindingSpineColor || 'Black'} 
            onChange={(e) => updateField('bindingSpineColor', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-rose-500/20" 
            placeholder="e.g. ສີດຳ, ສີຂາວ, ສີເງິນ, ສີທອງ" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ຈຳນວນແຜ່ນທີ່ຮອງຮັບ (Capacity)</label>
          <input 
            type="text" 
            value={item.bindingPageCapacity} 
            onChange={(e) => updateField('bindingPageCapacity', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-rose-500/20" 
            placeholder="e.g. 50-80 แผ่น" 
          />
        </div>
      </div>
    </div>
  );
};

// 6. CUTTING SUPPLIES SPECS FORM
// =========================================================================
export const CuttingSuppliesSpecsForm: React.FC<SpecsProps> = ({ item, updateField }) => {
  return (
    <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Scissors className="w-5 h-5 text-emerald-600" />
        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
          ວັດສະດຸຕັດ ແລະ ສາຍຕິດ (Cutting & Plotter Supplies Specs)
        </h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ປະເພດວັດສະດຸ *</label>
          <select 
            value={item.cuttingSupplyType || 'transfer_tape'} 
            onChange={(e) => updateField('cuttingSupplyType', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="transfer_tape">ເທບຍົກລາຍສະຕິກເກີ (Application Tape)</option>
            <option value="cutting_mat">ແຜ່ນຮອງຕັດກາວ (Cutting Mat)</option>
            <option value="weeding_tools">ອຸປະກອນດຶງລອກ (Weeding Supplies)</option>
          </select>
        </div>

        {item.cuttingSupplyType === 'cutting_mat' ? (
          <>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ລະດັບກາວ (Grip Level)</label>
              <select 
                value={item.cuttingMatGrip || 'standard'} 
                onChange={(e) => updateField('cuttingMatGrip', e.target.value)} 
                className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold"
              >
                <option value="light">Light Grip (ເຈ້ຍບາງ)</option>
                <option value="standard">Standard Grip (ທົ່ວໄປ)</option>
                <option value="strong">Strong Grip (ກາດໜາ/ໜັງ)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ອາຍຸຮອບຕັດ (Cycles)</label>
              <input 
                type="number" 
                value={item.cuttingMatCycles || 100} 
                onChange={(e) => updateField('cuttingMatCycles', Number(e.target.value))} 
                className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold" 
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ໜ້າກວ້າງເທບ (mm)</label>
              <input 
                type="number" 
                value={item.transferTapeWidthMm || 600} 
                onChange={(e) => updateField('transferTapeWidthMm', Number(e.target.value))} 
                className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ຄວາມຍາວຕໍ່ມ້ວນ (m)</label>
              <input 
                type="number" 
                value={item.transferTapeLengthM || 50} 
                onChange={(e) => updateField('transferTapeLengthM', Number(e.target.value))} 
                className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold" 
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// 7. RIGID SUBSTRATES & MOUNTING (FORM 7 IN GOOGLE DOC)
// =========================================================================
export const RigidSubstratesSpecsForm: React.FC<SpecsProps> = ({ item, updateField }) => {
  return (
    <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Maximize2 className="w-5 h-5 text-emerald-600" />
        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
          ແຜ່ນບອດ ແລະ ວັດສະດຸແຂງ (Rigid Substrates & Mounting)
        </h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ປະເພດແຜ່ນບອດ *</label>
          <select 
            value={item.rigidSubstrateType || 'foam_board'} 
            onChange={(e) => updateField('rigidSubstrateType', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="foam_board">ໂຟມບອດ (Foam Board - Standee)</option>
            <option value="future_board">ຟິວເຈີບອດ (Corrugated PP Board)</option>
            <option value="plastwood">ພາດສະວູດ PVC (Plastwood)</option>
            <option value="acrylic">ແຜ່ນອາຄຣີລິກ (Acrylic Sheet)</option>
            <option value="composite">ອາລູມີນຽມຄອມໂພສິດ (Aluminium Composite)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ຄວາມໜາ (Thickness mm) *</label>
          <input 
            type="number" 
            step="0.5"
            value={item.rigidBoardThicknessMm || 5} 
            onChange={(e) => updateField('rigidBoardThicknessMm', Number(e.target.value))} 
            placeholder="2, 3, 5, 8, 10, 15"
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20" 
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ອັດຕາເສດຂອບຕັດ (% Waste Factor)</label>
          <input 
            type="number" 
            value={item.rigidWasteFactorPct || 15} 
            onChange={(e) => updateField('rigidWasteFactorPct', Number(e.target.value))} 
            placeholder="15"
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2 border-t border-slate-100">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ລວງກວ້າງແຜ່ນ (Width mm)</label>
          <input 
            type="number" 
            value={item.rigidSheetWidthMm || 1220} 
            onChange={(e) => updateField('rigidSheetWidthMm', Number(e.target.value))} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ລວງຍາວແຜ່ນ (Length mm)</label>
          <input 
            type="number" 
            value={item.rigidSheetHeightMm || 2440} 
            onChange={(e) => updateField('rigidSheetHeightMm', Number(e.target.value))} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ສີ ແລະ ຜິວ (Color & Surface)</label>
          <select
            value={item.rigidColorSurface || 'White'}
            onChange={(e) => updateField('rigidColorSurface', e.target.value)}
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="White">ສີຂາວ (White)</option>
            <option value="Black">ສີດຳ (Black)</option>
            <option value="Clear">ໃສ (Clear - Acrylic)</option>
            <option value="Opal">ຂາວຂຸ່ນ (Opal / Milky)</option>
            <option value="Color">ສີອື່ນໆ (Other Colors)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 8. PACKAGING CONSUMABLES (FORM 8 IN GOOGLE DOC)
// =========================================================================
export const PackagingSpecsForm: React.FC<SpecsProps> = ({ item, updateField }) => {
  return (
    <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Package className="w-5 h-5 text-teal-600" />
        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
          ບັນຈຸພັນ ແລະ ອຸປະກອນຫຸ້ມຫໍ່ (Packaging Consumables)
        </h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ປະເພດບັນຈຸພັນ *</label>
          <select 
            value={item.packagingCategory || 'box_card'} 
            onChange={(e) => updateField('packagingCategory', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="box_card">ກ່ອງໃສ່ນາມບັດ 100 ໃບ (Card Box)</option>
            <option value="box_a4">ກ່ອງໃສ່ປຶ້ມ/ເອກະສານ A4 (500 ແຜ່ນ)</option>
            <option value="box_postal">ກ່ອງລູກຟູກໄປສະນີ (Postal Box 00-C)</option>
            <option value="bag_opp">ຖົງ OPP ແກ້ວໃສພ້ອມແຖບກາວ</option>
            <option value="bubble">ບັບເບິ້ນກັນກະແທກ (Air Bubble Roll)</option>
            <option value="tape_opp">ເທບກາວ OPP 2 ນິ້ວ (Adhesive Tape)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">ຂະໜາດ / ລາຍລະອຽດບັນຈຸພັນ</label>
          <input 
            type="text" 
            value={item.packagingDimensions || ''} 
            onChange={(e) => updateField('packagingDimensions', e.target.value)} 
            placeholder="e.g. ກ່ອງນາມບັດພາດສະຕິກໃສ 100 ໃບ, ບັບເບິ້ນ 65cm x 100m"
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-teal-500/20" 
          />
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 9. SPARE PARTS & CONSUMABLE REPLACEMENT RESTOCK
// =========================================================================
export const SparePartsSpecsForm: React.FC<SpecsProps> = ({ item, updateField }) => {
  const { equipment } = useApp();

  return (
    <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <div className="space-y-1 border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-violet-600" />
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
              ອະໄຫຼ່ ແລະ ຊິ້ນສ່ວນຊ້ອມບຳລຸງ (Machinery Wear & Spare Parts)
            </h4>
          </div>
          <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-xl border border-violet-100">
            Category 9: Spare Parts
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          ກຳນົດລາຍລະອຽດຊື່, ໝວດໝູ່, ອາຍຸການໃຊ້ງານ ແລະ ເຄື່ອງຈັກທີ່ຜູກມັດ ເພື່ອຄຳນວນຕົ້ນທຶນສຶກຫຼໍ ແລະ ຕັດສະຕັອກອັດຕະໂນມັດ
        </p>
      </div>

      {/* Bento Grid Form */}
      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Spare Part Name */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
              ຊື່ອະໄຫຼ່ / ລາຍການຊິ້ນສ່ວນ *
            </label>
            <input
              type="text"
              value={item.sparePartName || ''}
              onChange={(e) => updateField('sparePartName', e.target.value)}
              placeholder="e.g. Fuji Xerox DocuCentre C5005 Drum Unit, Polar 115 Blade"
              className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-violet-500/20"
              required
            />
          </div>

          {/* Part Category */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
              ໝວດໝູ່ຊິ້ນສ່ວນ *
            </label>
            <select
              value={item.sparePartCategory || 'drum'}
              onChange={(e) => updateField('sparePartCategory', e.target.value)}
              className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="drum">ຊຸດດຣຳ (Drum Unit)</option>
              <option value="fuser">ຊຸດຄວາມຮ້ອນ (Fuser Kit)</option>
              <option value="transfer_belt">ສາຍພານໂອນພາບ (Transfer Belt)</option>
              <option value="printhead">ຫົວພິມ (Printhead)</option>
              <option value="pickup_roller">ລູກຢາງດຶງເຈ້ຍ (Pickup Roller)</option>
              <option value="waste_box">ກ່ອງໝຶກເສຍ (Waste Ink/Toner Box)</option>
              <option value="blade">ໃບມີດຕັດ (Cutter Blade)</option>
              <option value="cutting_stick">ແທ່ງຮອງຕັດ (Cutting Stick)</option>
              <option value="silicone_roller">ລູກກິ້ງຊິລິໂຄນ (Silicone Roller)</option>
              <option value="milling_cutter">ໃບມີດປາດສັນ (Milling Cutter)</option>
              <option value="punching_pin">ເຂັມເຈາະຮູ (Punching Pins)</option>
              <option value="general">ອະໄຫຼ່ທົ່ວໄປ (General Wear Part)</option>
            </select>
          </div>

          {/* Assigned Machine / Equipment */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
              ຜູກກັບເຄື່ອງຈັກປະຈຳ (Assigned Machine)
            </label>
            <select
              value={item.assignedPrinterId || ''}
              onChange={(e) => updateField('assignedPrinterId', e.target.value)}
              className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="">-- ສາງກາງ (General / Any Machine) --</option>
              {equipment && equipment.map((eq: any) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} ({eq.id})
                </option>
              ))}
            </select>
          </div>

          {/* Expected Lifespan Units */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
              ອາຍຸການໃຊ້ງານ (Expected Lifespan)
            </label>
            <input
              type="number"
              value={item.sparePartExpectedLife || 50000}
              onChange={(e) => updateField('sparePartExpectedLife', Number(e.target.value))}
              className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          {/* Unit Type */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
              ຫົວໜ່ວຍວັດແທກອາຍຸ (Unit Type)
            </label>
            <select
              value={item.sparePartUnitType || 'pages'}
              onChange={(e) => updateField('sparePartUnitType', e.target.value)}
              className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="pages">ໜ້າ (Pages - Laser/Inkjet)</option>
              <option value="cuts">ຄັ້ງຕັດ (Cuts - Guillotine)</option>
              <option value="meters">ແມັດ (Meters - Plotter/Laminator)</option>
              <option value="books">ເຫຼັ້ມ (Books - Binder)</option>
            </select>
          </div>

          {/* OEM Part Number Ref */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
              ລະຫັດໂມເດວ / Part Number (OEM Reference)
            </label>
            <input
              type="text"
              value={item.sparePartModelRef || ''}
              onChange={(e) => updateField('sparePartModelRef', e.target.value)}
              placeholder="e.g. CT350922, T671100, POLAR-115-HSS"
              className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
