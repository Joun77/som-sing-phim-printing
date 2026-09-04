import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Trash2, Palette, Split, Droplets, Plus, Search } from 'lucide-react';
import { PrinterAllocation, ColorChannel } from '../types';

interface AvailablePrinter {
  id: string;
  name: string;
  cost_per_page?: number;
  ink_cost_per_page?: number;
  printerCategory?: string;
  colorSchemeType?: string;
}

interface Props {
  targetQuantity: number;
  allocations: PrinterAllocation[];
  availablePrinters: AvailablePrinter[];
  onAllocationsChange: (newAllocations: PrinterAllocation[]) => void;
  onOpenPrinterModal?: () => void;
  activeCalc?: any;
  jobSizePreset?: string;
}

const DEFAULT_CMYK_CHANNELS: ColorChannel[] = [
  { channel_name: 'C', density_pct: 15, is_spot_color: false },
  { channel_name: 'M', density_pct: 15, is_spot_color: false },
  { channel_name: 'Y', density_pct: 15, is_spot_color: false },
  { channel_name: 'K', density_pct: 15, is_spot_color: false },
];

const DEFAULT_MONO_CHANNELS: ColorChannel[] = [
  { channel_name: 'K', density_pct: 15, is_spot_color: false },
];

const ISO_COVERAGE_PRESETS = [
  { label: '5% (ISO Text)', value: 5 },
  { label: '15% (Standard)', value: 15 },
  { label: '30% (Graphic)', value: 30 },
  { label: '50% (Photo)', value: 50 },
  { label: '100% (Solid)', value: 100 },
];

export const ManualPrinterAllocator: React.FC<Props> = ({
  targetQuantity,
  allocations,
  availablePrinters,
  onAllocationsChange,
  onOpenPrinterModal,
  activeCalc,
  jobSizePreset,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const totalAllocated = allocations.reduce((sum, a) => sum + (a.allocated_pages || 0), 0);
  const remainingPages = targetQuantity - totalAllocated;
  const isComplete = remainingPages === 0 && targetQuantity > 0;

  const handleAddPrinter = (printerId: string) => {
    const printer = availablePrinters.find((p) => p.id === printerId) || availablePrinters[0];
    if (!printer) return;

    const remainingToAssign = Math.max(0, remainingPages);
    const pages = allocations.length === 0 ? targetQuantity : (remainingToAssign > 0 ? remainingToAssign : Math.floor(targetQuantity / (allocations.length + 1)));

    const isMono = printer.colorSchemeType === 'MONO' || printer.colorSchemeType === 'K' || printer.name.toLowerCase().includes('mono');
    
    // Inherit color channels, density, and duplex from existing allocation if available to preserve user/preflight values
    const existingChannels = allocations[0]?.color_channels;
    const initialChannels = existingChannels && existingChannels.length > 0
      ? existingChannels.map(c => ({ ...c }))
      : (isMono ? DEFAULT_MONO_CHANNELS.map(c => ({ ...c })) : DEFAULT_CMYK_CHANNELS.map(c => ({ ...c })));
    
    const initialMode = allocations[0]?.color_mode || (isMono ? 'MONO_K' : 'CMYK');
    const initialDensity = allocations[0]?.average_density_pct || 15;
    const initialDoubleSided = allocations[0]?.is_double_sided || false;

    onAllocationsChange([
      ...allocations,
      {
        printer_id: `${printer.id}__${Date.now()}`,
        printer_name: printer.name,
        allocated_pages: pages,
        cost_per_page: printer.cost_per_page || 0,
        ink_cost_per_page: printer.ink_cost_per_page || 0,
        subtotal_cost: pages * (printer.cost_per_page || 0),
        is_double_sided: initialDoubleSided,
        color_mode: initialMode,
        average_density_pct: initialDensity,
        color_channels: initialChannels,
      },
    ]);
  };

  const handleDistributeEvenly = () => {
    if (allocations.length === 0 || targetQuantity <= 0) return;
    const count = allocations.length;
    const baseQuota = Math.floor(targetQuantity / count);
    const remainder = targetQuantity % count;

    const updated = allocations.map((a, idx) => {
      const pages = baseQuota + (idx === 0 ? remainder : 0);
      return {
        ...a,
        allocated_pages: pages,
        subtotal_cost: pages * (a.cost_per_page || 0),
      };
    });
    onAllocationsChange(updated);
  };

  const handlePageChange = (uniquePrinterId: string, pages: number) => {
    const validPages = Math.max(0, pages || 0);
    const updated = allocations.map((a) => {
      if (a.printer_id === uniquePrinterId) {
        return {
          ...a,
          allocated_pages: validPages,
          subtotal_cost: validPages * (a.cost_per_page || 0),
        };
      }
      return a;
    });
    onAllocationsChange(updated);
  };

  const handleRemoveAllocation = (uniquePrinterId: string) => {
    const remaining = allocations.filter((a) => a.printer_id !== uniquePrinterId);
    onAllocationsChange(remaining);
  };

  const handleToggleDoubleSided = (uniquePrinterId: string) => {
    const updated = allocations.map((a) => {
      if (a.printer_id === uniquePrinterId) {
        const nextDuplex = !a.is_double_sided;
        let newPages = a.allocated_pages;
        if (allocations.length === 1) {
          newPages = nextDuplex ? Math.ceil(a.allocated_pages / 2) : a.allocated_pages * 2;
        }
        return {
          ...a,
          is_double_sided: nextDuplex,
          allocated_pages: newPages,
          subtotal_cost: newPages * (a.cost_per_page || 0)
        };
      }
      return a;
    });
    onAllocationsChange(updated);
  };

  const handleColorModeChange = (uniquePrinterId: string, mode: 'CMYK' | 'MONO_K') => {
    const updated = allocations.map((a) => {
      if (a.printer_id === uniquePrinterId) {
        const channels = mode === 'MONO_K'
          ? [{ channel_name: 'K', density_pct: a.color_channels.find(c => c.channel_name === 'K')?.density_pct || 15, is_spot_color: false }]
          : [
              { channel_name: 'C', density_pct: a.color_channels.find(c => c.channel_name === 'C')?.density_pct || 15, is_spot_color: false },
              { channel_name: 'M', density_pct: a.color_channels.find(c => c.channel_name === 'M')?.density_pct || 15, is_spot_color: false },
              { channel_name: 'Y', density_pct: a.color_channels.find(c => c.channel_name === 'Y')?.density_pct || 15, is_spot_color: false },
              { channel_name: 'K', density_pct: a.color_channels.find(c => c.channel_name === 'K')?.density_pct || 15, is_spot_color: false },
            ];

        const avg = channels.reduce((sum, c) => sum + c.density_pct, 0) / (channels.length || 1);

        return {
          ...a,
          color_mode: mode,
          color_channels: channels,
          average_density_pct: avg,
        };
      }
      return a;
    });
    onAllocationsChange(updated);
  };

  const handleChannelDensityChange = (uniquePrinterId: string, channelName: string, density: number) => {
    const validDensity = Math.min(100, Math.max(0, density || 0));
    const updated = allocations.map((a) => {
      if (a.printer_id === uniquePrinterId) {
        const channels = a.color_channels.map((c) =>
          c.channel_name === channelName ? { ...c, density_pct: validDensity } : c
        );
        const avg = channels.reduce((sum, c) => sum + c.density_pct, 0) / (channels.length || 1);
        return {
          ...a,
          color_channels: channels,
          average_density_pct: avg,
        };
      }
      return a;
    });
    onAllocationsChange(updated);
  };

  const handleApplyPreset = (uniquePrinterId: string, presetValue: number) => {
    const updated = allocations.map((a) => {
      if (a.printer_id === uniquePrinterId) {
        const channels = a.color_channels.map((c) => ({ ...c, density_pct: presetValue }));
        return {
          ...a,
          color_channels: channels,
          average_density_pct: presetValue,
        };
      }
      return a;
    });
    onAllocationsChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide">
              {currentLang === 'lo' ? 'ການຕັ້ງຄ່າເຄື່ອງພິມ & ແບ່ງການຜະລິດ (Multi-Printer Load Allocation)' : 'Multi-Printer Load Allocation'}
            </h4>
            <p className="text-[10px] text-slate-500 font-medium">
              {currentLang === 'lo' ? 'ກຳນົດຈຳນວນແຜ່ນ, ໜ້າພິມ (1 ໜ້າ/2 ໜ້າ) ແລະ ລະບົບສີ (4 ສີ CMYK / ຂາວດຳ K) ຕາມມາດຕະຖານ ISO Coverage (0–100%)' : 'Set sheet allocation, simplex/duplex, and color density per printer'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {allocations.length > 1 && (
            <button
              type="button"
              onClick={handleDistributeEvenly}
              className="px-2.5 py-1 bg-white border border-indigo-200 hover:bg-indigo-100 text-indigo-900 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Split className="w-3.5 h-3.5" />
              <span>{currentLang === 'lo' ? 'ແບ່ງເທົ່າກັນ' : 'Split Evenly'}</span>
            </button>
          )}

          <div className={`px-2.5 py-1 rounded-lg text-xs font-black font-sans ${
            isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
          }`}>
            {totalAllocated.toLocaleString()} / {targetQuantity.toLocaleString()} {currentLang === 'lo' ? 'ແຜ່ນ' : 'sheets'}
          </div>
        </div>
      </div>

      {/* Allocations List */}
      {allocations.length === 0 ? (
        <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
          <p className="text-xs font-bold text-slate-500">
            {currentLang === 'lo' ? '-- ຍັງບໍ່ມີເຄື່ອງພິມທີ່ຖືກເລືອກ --' : '-- No printer allocated --'}
          </p>
          <button
            type="button"
            onClick={onOpenPrinterModal || (() => handleAddPrinter(availablePrinters[0]?.id))}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
          >
            + {currentLang === 'lo' ? 'ເລືອກເຄື່ອງພິມຫຼັກ' : 'Select Primary Printer'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {allocations.map((item, idx) => {
            const isMono = item.color_mode === 'MONO_K';
            const allocatedPct = targetQuantity > 0 ? Math.round(((item.allocated_pages || 0) / targetQuantity) * 100) : 100;
            const inkCost = item.ink_cost_per_page || 0;
            const machCost = item.cost_per_page || 0;
            const realInkPerSheet = (activeCalc && activeCalc.inkCost !== undefined && targetQuantity > 0)
              ? Math.round(activeCalc.inkCost / targetQuantity)
              : inkCost;

            return (
              <div
                key={item.printer_id}
                className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3 hover:border-indigo-300 transition"
              >
                {/* Printer Header & Quota */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs font-sans">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 font-sans">
                          {item.printer_name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black font-sans">
                          {allocatedPct}% ຂອງງານທັງໝົດ
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-medium">
                        <span className="text-indigo-900 font-bold font-sans bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100">
                          ໝຶກຈິງ: LAK {realInkPerSheet.toLocaleString()} / ແຜ່ນ ({jobSizePreset || 'A4'})
                        </span>
                        <span>•</span>
                        <span>ຄ່າເສື່ອມ & ໄຟ: LAK {machCost.toLocaleString()} / ແຜ່ນ</span>
                        <span>•</span>
                        <span className="text-purple-700 font-black font-sans bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                          ລວມ: LAK {(realInkPerSheet + machCost).toLocaleString()} / ແຜ່ນ
                        </span>
                        {inkCost > 0 && inkCost !== realInkPerSheet && (
                          <span className="text-slate-400 text-[9px] font-sans">
                            (ມາດຕະຖານ A4 @5%: LAK {inkCost.toLocaleString()})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] font-bold text-slate-600">
                        {currentLang === 'lo' ? 'ຈຳນວນຜະລິດ:' : 'Allocated:'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={targetQuantity * 2}
                        value={item.allocated_pages ?? ''}
                        onChange={(e) => handlePageChange(item.printer_id, parseInt(e.target.value, 10))}
                        className="w-24 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-right focus:outline-none focus:border-indigo-500 font-sans"
                      />
                      <span className="text-[11px] text-slate-400 font-medium">
                        {currentLang === 'lo' ? 'ແຜ່ນ' : 'sheets'}
                      </span>
                    </div>

                    {allocations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAllocation(item.printer_id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="ລົບເຄື່ອງພິມນີ້"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Duplex / Simplex + Color Mode Toggle */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Duplex Switch */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500">ໜ້າພິມ:</span>
                    <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleToggleDoubleSided(item.printer_id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          !item.is_double_sided
                            ? 'bg-white text-indigo-900 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        ພິມ 1 ໜ້າ (Single-Sided)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleDoubleSided(item.printer_id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          item.is_double_sided
                            ? 'bg-white text-indigo-900 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        ພິມ 2 ໜ້າ (Double-Sided Duplex)
                      </button>
                    </div>
                  </div>

                  {/* Color Mode Switch */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ລະບົບສີ:</span>
                    </span>
                    <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleColorModeChange(item.printer_id, 'CMYK')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          !isMono
                            ? 'bg-white text-indigo-900 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        ພິມ 4 ສີ (Full Color CMYK)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleColorModeChange(item.printer_id, 'MONO_K')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isMono
                            ? 'bg-white text-indigo-900 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        ພິມຂາວດຳ (Monochrome Black / K)
                      </button>
                    </div>
                  </div>
                </div>

                {/* ISO Coverage Presets & Channel Sliders */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400">ມາດຕະຖານ ISO Coverage:</span>
                      <div className="flex flex-wrap gap-1">
                        {ISO_COVERAGE_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => handleApplyPreset(item.printer_id, preset.value)}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-900 text-slate-600 text-[10px] font-bold transition cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Color Channel Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                    {item.color_channels.map((ch) => {
                      const name = ch.channel_name;
                      const badgeColor =
                        name === 'C'
                          ? 'bg-cyan-500 text-white'
                          : name === 'M'
                          ? 'bg-pink-500 text-white'
                          : name === 'Y'
                          ? 'bg-amber-400 text-slate-900'
                          : 'bg-slate-900 text-white';

                      return (
                        <div
                          key={ch.channel_name}
                          className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black font-sans ${badgeColor}`}>
                                {name}
                              </span>
                              <span className="text-[11px] font-bold text-slate-700">
                                {name === 'C' ? 'Cyan (C)' : name === 'M' ? 'Magenta (M)' : name === 'Y' ? 'Yellow (Y)' : 'Black (K / BK)'}
                              </span>
                            </div>
                            <span className="text-xs font-black text-indigo-700 font-sans">
                              {ch.density_pct || 0}%
                            </span>
                          </div>

                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={ch.density_pct || 0}
                            onChange={(e) => handleChannelDensityChange(item.printer_id, ch.channel_name, parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Printer / Split Load Action Button (Clean button replacing the dropdown box) */}
      <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-purple-50/70 via-slate-50 to-purple-50/40 rounded-2xl border border-purple-200/80">
        <div>
          <span className="text-xs font-black text-purple-950 block">
            {currentLang === 'lo' ? '+ ເພີ່ມເຄື່ອງພິມເພື່ອແບ່ງໂຫຼດການຜະລິດ' : '+ Add Printer to Distribute Load'}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {currentLang === 'lo' ? 'ເລືອກເຄື່ອງພິມເພີ່ມຕື່ມເພື່ອແບ່ງໜ້າພິມ (Laser, Inkjet, Offset, 4/6/12 ສີ)' : 'Select additional printer from fleet to split pages'}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenPrinterModal || (() => handleAddPrinter(availablePrinters[0]?.id))}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{currentLang === 'lo' ? 'ຄົ້ນຫາ & ເພີ່ມເຄື່ອງພິມ' : 'Search & Add Printer'}</span>
        </button>
      </div>

      {!isComplete && targetQuantity > 0 && (
        <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
          remainingPages > 0
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {remainingPages > 0
            ? `ຍັງເຫຼືອອີກ ${remainingPages.toLocaleString()} ແຜ່ນ ທີ່ຍັງບໍ່ໄດ້ແບ່ງລົງເຄື່ອງພິມ (ກະລຸນາກຳນົດໃຫ້ຄົບ ${targetQuantity.toLocaleString()} ແຜ່ນ)`
            : `ຈຳນວນທີ່ແບ່ງເກີນເປົ້າໝາຍຢູ່ ${Math.abs(remainingPages).toLocaleString()} ແຜ່ນ`}
        </div>
      )}
    </div>
  );
};

export default ManualPrinterAllocator;
