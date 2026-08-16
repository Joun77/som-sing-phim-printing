import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Trash2, Palette, Split, Droplets } from 'lucide-react';
import { PrinterAllocation, ColorChannel } from '../types';

interface AvailablePrinter {
  id: string;
  name: string;
  cost_per_page?: number;
  printerCategory?: string;
  colorSchemeType?: string;
}

interface Props {
  targetQuantity: number;
  allocations: PrinterAllocation[];
  availablePrinters: AvailablePrinter[];
  onAllocationsChange: (newAllocations: PrinterAllocation[]) => void;
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
}) => {
  const { t } = useTranslation();

  const totalAllocated = allocations.reduce((sum, a) => sum + (a.allocated_pages || 0), 0);
  const remainingPages = targetQuantity - totalAllocated;
  const isComplete = remainingPages === 0 && targetQuantity > 0;

  const handleAddPrinter = (printerId: string) => {
    const printer = availablePrinters.find((p) => p.id === printerId);
    if (!printer) return;

    const remainingToAssign = Math.max(0, remainingPages);
    const pages = allocations.length === 0 ? targetQuantity : (remainingToAssign > 0 ? remainingToAssign : Math.floor(targetQuantity / (allocations.length + 1)));

    const isMono = printer.colorSchemeType === 'MONO' || printer.colorSchemeType === 'K' || printer.name.toLowerCase().includes('mono');
    const initialMode = isMono ? 'MONO_K' : 'CMYK';
    const initialChannels = isMono ? DEFAULT_MONO_CHANNELS.map(c => ({ ...c })) : DEFAULT_CMYK_CHANNELS.map(c => ({ ...c }));

    onAllocationsChange([
      ...allocations,
      {
        printer_id: `${printer.id}__${Date.now()}`,
        printer_name: printer.name,
        allocated_pages: pages,
        cost_per_page: printer.cost_per_page || 0,
        subtotal_cost: pages * (printer.cost_per_page || 0),
        is_double_sided: false,
        color_mode: initialMode,
        average_density_pct: 15,
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

  const handleColorModeChange = (uniquePrinterId: string, mode: 'CMYK' | 'MONO_K') => {
    const updated = allocations.map((a) => {
      if (a.printer_id === uniquePrinterId) {
        const channels = mode === 'CMYK'
          ? DEFAULT_CMYK_CHANNELS.map(c => ({ ...c }))
          : DEFAULT_MONO_CHANNELS.map(c => ({ ...c }));
        return {
          ...a,
          color_mode: mode,
          color_channels: channels,
        };
      }
      return a;
    });
    onAllocationsChange(updated);
  };

  const handleChannelDensityChange = (uniquePrinterId: string, channelName: string, density: number) => {
    const validDensity = Math.max(0, Math.min(100, density || 0)); // Strictly 0 - 100% ISO Range
    const updated = allocations.map((a) => {
      if (a.printer_id === uniquePrinterId) {
        const channels = (a.color_channels || DEFAULT_CMYK_CHANNELS).map((ch) => {
          if (ch.channel_name === channelName) {
            return { ...ch, density_pct: validDensity };
          }
          return ch;
        });
        return { ...a, color_channels: channels };
      }
      return a;
    });
    onAllocationsChange(updated);
  };

  const handleSetAllChannelsDensity = (uniquePrinterId: string, density: number) => {
    const validDensity = Math.max(0, Math.min(100, density || 0));
    const updated = allocations.map((a) => {
      if (a.printer_id === uniquePrinterId) {
        const channels = (a.color_channels || DEFAULT_CMYK_CHANNELS).map((ch) => ({
          ...ch,
          density_pct: validDensity,
        }));
        return { ...a, average_density_pct: validDensity, color_channels: channels };
      }
      return a;
    });
    onAllocationsChange(updated);
  };

  const handleRemovePrinter = (uniquePrinterId: string) => {
    onAllocationsChange(allocations.filter((a) => a.printer_id !== uniquePrinterId));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-slate-100">
        <div>
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-600" />
            <span>ການຕັ້ງຄ່າເຄື່ອງພິມ & ແບ່ງການຜະລິດ (Multi-Printer Load Allocation)</span>
          </h4>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            ກຳນົດຈຳນວນແຜ່ນ, ໜ້າພິມ (1 ໜ້າ/2 ໜ້າ) ແລະ ລະບົບສີ (4 ສີ CMYK / ຂາວດຳ K) ຕາມມາດຕະຖານ ISO Coverage (0-100%)
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {allocations.length > 1 && (
            <button
              type="button"
              onClick={handleDistributeEvenly}
              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-indigo-200"
              title="ແບ່ງຈຳນວນແຜ່ນພິມເທົ່າໆກັນທຸກເຄື່ອງ"
            >
              <Split className="w-3.5 h-3.5" />
              <span>ແບ່ງເທົ່າກັນ (Split Evenly)</span>
            </button>
          )}

          <div className="text-right shrink-0">
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                isComplete
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : remainingPages < 0
                  ? 'text-rose-700 bg-rose-50 border-rose-200'
                  : 'text-amber-700 bg-amber-50 border-amber-200'
              }`}
            >
              {totalAllocated.toLocaleString()} / {targetQuantity.toLocaleString()} ແຜ່ນ
            </span>
          </div>
        </div>
      </div>

      {allocations.length === 0 ? (
        <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Palette className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">
            ຍັງບໍ່ໄດ້ເລືອກເຄື່ອງພິມ — ກະລຸນາກົດປຸ່ມເພີ່ມເຄື່ອງພິມດ້ານລຸ່ມເພື່ອແບ່ງການຜະລິດ
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {allocations.map((item, pIdx) => {
            const colorMode = item.color_mode === 'MONO_K' ? 'MONO_K' : 'CMYK';
            const channels = item.color_channels && item.color_channels.length > 0
              ? item.color_channels
              : (colorMode === 'MONO_K' ? DEFAULT_MONO_CHANNELS : DEFAULT_CMYK_CHANNELS);
            const pctShare = targetQuantity > 0 ? Math.round(((item.allocated_pages || 0) / targetQuantity) * 100) : 0;

            return (
              <div
                key={item.printer_id}
                className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-3 transition-all hover:border-slate-300"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {pIdx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{item.printer_name}</span>
                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {pctShare}% ຂອງງານທັງໝົດ
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {item.cost_per_page ? `${item.cost_per_page.toLocaleString()} LAK / page (Depr + Electricity)` : 'Master Equipment Asset'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-600 font-bold">ຈຳນວນຜະລິດ:</span>
                      <input
                        type="number"
                        min="0"
                        value={item.allocated_pages ?? ''}
                        onChange={(e) =>
                          handlePageChange(item.printer_id, parseInt(e.target.value, 10))
                        }
                        className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-right font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        placeholder="0"
                      />
                      <span className="text-xs text-slate-400 font-semibold">ແຜ່ນ</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePrinter(item.printer_id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="ລຶບເຄື່ອງພິມນີ້"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sidedness & Color Mode Selection */}
                <div className="pt-2.5 border-t border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Sidedness Control per Printer */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">ໜ້າພິມ:</span>
                      <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = allocations.map(a => a.printer_id === item.printer_id ? { ...a, is_double_sided: false } : a);
                            onAllocationsChange(updated);
                          }}
                          className={`px-3 py-1 rounded-md transition ${
                            !item.is_double_sided
                              ? 'bg-white text-indigo-700 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          ພິມ 1 ໜ້າ (Single-Sided)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = allocations.map(a => a.printer_id === item.printer_id ? { ...a, is_double_sided: true } : a);
                            onAllocationsChange(updated);
                          }}
                          className={`px-3 py-1 rounded-md transition ${
                            item.is_double_sided
                              ? 'bg-white text-indigo-700 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          ພິມ 2 ໜ້າ (Double-Sided Duplex)
                        </button>
                      </div>
                    </div>

                    {/* Color Mode Selection (CMYK vs MONO Black only) */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-slate-500" />
                        ລະບົບສີ:
                      </span>
                      <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => handleColorModeChange(item.printer_id, 'CMYK')}
                          className={`px-3.5 py-1 rounded-md transition ${
                            colorMode === 'CMYK'
                              ? 'bg-white text-indigo-700 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          ພິມ 4 ສີ (Full Color CMYK)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleColorModeChange(item.printer_id, 'MONO_K')}
                          className={`px-3.5 py-1 rounded-md transition ${
                            colorMode === 'MONO_K'
                              ? 'bg-white text-indigo-700 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          ພິມຂາວດຳ (Monochrome Black / K)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ISO Standard Presets Quick Toolbar */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 mr-1">ມາດຕະຖານ ISO Coverage:</span>
                    {ISO_COVERAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => handleSetAllChannelsDensity(item.printer_id, preset.value)}
                        className="px-2 py-0.5 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded text-[10px] font-bold transition shadow-2xs cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Channels & Density Sliders (Strictly 0% - 100%) */}
                  <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {channels.map((ch) => {
                        const name = ch.channel_name;
                        let badgeBg = 'bg-slate-100 text-slate-800';
                        if (name === 'C' || name === 'Cyan') badgeBg = 'bg-cyan-500 text-white';
                        else if (name === 'M' || name === 'Magenta') badgeBg = 'bg-pink-500 text-white';
                        else if (name === 'Y' || name === 'Yellow') badgeBg = 'bg-amber-400 text-slate-900';
                        else if (name === 'K' || name === 'Black') badgeBg = 'bg-slate-900 text-white';

                        return (
                          <div
                            key={name}
                            className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80"
                          >
                            <span className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ${badgeBg}`}>
                              {name}
                            </span>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-700 truncate block">
                                  {name === 'C' ? 'Cyan (C)' : name === 'M' ? 'Magenta (M)' : name === 'Y' ? 'Yellow (Y)' : 'Black (K / BK)'}
                                </span>
                                <span className="text-xs font-black text-indigo-700 font-sans">
                                  {ch.density_pct || 0}%
                                </span>
                              </div>

                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="1"
                                  value={ch.density_pct || 0}
                                  onChange={(e) => handleChannelDensityChange(item.printer_id, ch.channel_name, parseFloat(e.target.value))}
                                  className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Printer Action (Always Available) */}
      <div className="p-3 bg-indigo-50/50 rounded-2xl border border-dashed border-indigo-200 space-y-2">
        <label className="text-xs font-bold text-indigo-950 block">
          + ເພີ່ມເຄື່ອງພິມເພື່ອແບ່ງການຜະລິດ (Add Printer to Distribute Load):
        </label>
        <select
          onChange={(e) => {
            if (e.target.value) handleAddPrinter(e.target.value);
            e.target.value = '';
          }}
          className="w-full text-xs font-bold py-2.5 px-3.5 border border-indigo-300 rounded-xl text-indigo-900 bg-white hover:border-indigo-400 cursor-pointer transition shadow-2xs"
          defaultValue=""
        >
          <option value="" disabled>
            -- ເລືອກເຄື່ອງພິມຈາກ Master Equipment List ເພື່ອເພີ່ມເຂົ້າໃນງານ --
          </option>
          {availablePrinters.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.printerCategory ? `[${p.printerCategory}]` : ''} ({p.cost_per_page ? `${p.cost_per_page.toLocaleString()} LAK/page` : 'Ready'})
            </option>
          ))}
        </select>
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
