import React, { useMemo } from 'react';
import { 
  Printer, 
  Sparkles, 
  Droplets, 
  Cpu, 
  Zap, 
  Check, 
  Percent, 
  Layers, 
  HelpCircle, 
  Settings2,
  DollarSign,
  Info,
  ShieldCheck,
  AlertCircle,
  Plus,
  Trash2,
  X,
  Radio,
  FileCheck,
  CheckCircle2,
  Palette,
  FileText,
  RefreshCw,
  Search
} from 'lucide-react';
import { useApp } from '@store/AppContext';
import { SpecGroup, PublicProductOption, FeaturesConfig } from '../../types';
import { calculateMachineFullCost, CalculatedMachineCost } from '@utils/machineCostCalculator';
import { PrinterSelectorModal } from '../../../pricing/components/PrinterSelectorModal';

export interface Step2PrintEngineProps {
  defaultMachineId: string;
  setDefaultMachineId: (id: string) => void;
  defaultMachineName: string;
  setDefaultMachineName: (name: string) => void;
  baselineCoveragePercent: number;
  setBaselineCoveragePercent: (coverage: number) => void;
  targetMarginPercent: number;
  setTargetMarginPercent: (margin: number) => void;
  specGroups: SpecGroup[];
  setSpecGroups: React.Dispatch<React.SetStateAction<SpecGroup[]>>;
  featuresConfig?: FeaturesConfig;
  setFeaturesConfig?: React.Dispatch<React.SetStateAction<FeaturesConfig>>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Step2PrintEngine: React.FC<Step2PrintEngineProps> = ({
  defaultMachineId,
  setDefaultMachineId,
  defaultMachineName,
  setDefaultMachineName,
  baselineCoveragePercent,
  setBaselineCoveragePercent,
  targetMarginPercent,
  setTargetMarginPercent,
  specGroups,
  setSpecGroups,
  featuresConfig,
  setFeaturesConfig,
  showToast,
}) => {
  const { equipment, printerColorLinks, inventory, formatCurrency } = useApp();
  const formatLAK = formatCurrency;
  const [searchingRowIdx, setSearchingRowIdx] = React.useState<number | null>(null);

  // Dynamically calculate and format all registered printers from real Equipment system with active Baseline Coverage %
  const dynamicPrinters: CalculatedMachineCost[] = useMemo(() => {
    const printerList = (equipment || []).filter(
      eq => eq.category === 'Printer' || eq.category === 'PRINTER'
    );

    return printerList.map(eq => {
      return calculateMachineFullCost({
        equipment: eq,
        printerColorLinks,
        inventory,
        coveragePercent: baselineCoveragePercent || 15,
      });
    });
  }, [equipment, printerColorLinks, inventory, baselineCoveragePercent]);

  // Current Print Mode Spec Group from state
  const printModeGroup = useMemo(() => {
    return specGroups.find(
      g => g.id === 'group_print_mode' || 
           g.groupType === 'printing_mode' || 
           g.titleLo?.includes('ສີການພິມ') ||
           g.titleEn?.toLowerCase().includes('color mode')
    );
  }, [specGroups]);

  // Determine current capability mode: 'dual_mode' | 'color_only' | 'mono_only'
  const colorCapabilityMode: 'dual_mode' | 'color_only' | 'mono_only' = useMemo(() => {
    if (!printModeGroup || printModeGroup.options.length === 0) return 'dual_mode';
    if (printModeGroup.options.length === 1) {
      return printModeGroup.options[0].value === 'mono_k' ? 'mono_only' : 'color_only';
    }
    return 'dual_mode';
  }, [printModeGroup]);

  // Helper to ensure printModeGroup exists
  const ensurePrintModeGroup = (initialOptions?: PublicProductOption[]) => {
    setSpecGroups(prev => {
      const idx = prev.findIndex(g => g.id === 'group_print_mode' || g.groupType === 'printing_mode');
      const existingGroup = idx >= 0 ? prev[idx] : undefined;

      const defaultPrinter = dynamicPrinters[0] || {
        id: 'PRN-FUJI-V180',
        name: 'Fuji Xerox Versant 180 Press',
        totalColorCost: 1250,
        totalBwCost: 280,
      };

      // If existing options exist, preserve them rather than overwriting with hardcoded defaults
      let options: PublicProductOption[];
      if (initialOptions) {
        options = initialOptions;
      } else if (existingGroup && existingGroup.options && existingGroup.options.length > 0) {
        options = existingGroup.options.map(opt => {
          // If option has a bound machine or extraCostRate already set, keep them
          if (opt.extraCostRate !== undefined && opt.extraCostRate > 0) {
            return opt;
          }
          const isColorMode = opt.value === 'cmyk_4c' || opt.labelLo?.includes('ສີ') || opt.label?.toLowerCase().includes('color');
          const matchedPrinter = dynamicPrinters.find(p => p.id === opt.machineId) || defaultPrinter;
          return {
            ...opt,
            machineId: opt.machineId || matchedPrinter.id,
            machineName: opt.machineName || matchedPrinter.name,
            extraCostRate: opt.extraCostRate ?? (isColorMode ? matchedPrinter.totalColorCost : matchedPrinter.totalBwCost),
          };
        });
      } else {
        options = [
          {
            optionType: 'printing_mode',
            machineId: defaultPrinter.id,
            machineName: defaultPrinter.name,
            label: 'ພິມ 4 ສີ (Full Color CMYK)',
            labelLo: 'ພິມ 4 ສີ (Full Color CMYK)',
            labelEn: 'Full Color CMYK',
            value: 'cmyk_4c',
            isDefault: true,
            extraCostRate: defaultPrinter.totalColorCost,
            addPrice: 0,
          },
          {
            optionType: 'printing_mode',
            machineId: defaultPrinter.id,
            machineName: defaultPrinter.name,
            label: 'ພິມຂາວດຳ (Monochrome K)',
            labelLo: 'ພິມຂາວດຳ (Monochrome K)',
            labelEn: 'Monochrome Black & White',
            value: 'mono_k',
            isDefault: false,
            extraCostRate: defaultPrinter.totalBwCost,
            addPrice: 0,
          }
        ];
      }

      const newGroup: SpecGroup = {
        id: 'group_print_mode',
        titleLo: existingGroup?.titleLo || 'ໂໝດສີການພິມ (Print Color Mode)',
        titleEn: existingGroup?.titleEn || 'Print Color Mode',
        displayType: existingGroup?.displayType || 'cards',
        groupType: 'printing_mode',
        options,
      };

      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newGroup;
        return next;
      } else {
        return [newGroup, ...prev];
      }
    });
  };

  // Initialize if empty
  React.useEffect(() => {
    if (!printModeGroup && dynamicPrinters.length > 0) {
      ensurePrintModeGroup();
    }
  }, [printModeGroup, dynamicPrinters]);

  // Update Baseline Coverage % and live-sync options extraCostRate
  const handleUpdateBaselineCoverage = (newCoverage: number) => {
    setBaselineCoveragePercent(newCoverage);

    // Synchronize print mode options cost rates based on the new coverage
    setSpecGroups(prev => {
      const gIdx = prev.findIndex(g => g.id === 'group_print_mode' || g.groupType === 'printing_mode');
      if (gIdx < 0) return prev;

      const next = [...prev];
      next[gIdx].options = next[gIdx].options.map(opt => {
        const isColorMode = opt.value === 'cmyk_4c' || opt.labelLo?.includes('ສີ') || opt.label?.toLowerCase().includes('color');
        const printer = dynamicPrinters.find(p => p.id === opt.machineId) || dynamicPrinters[0];
        
        if (printer) {
          return {
            ...opt,
            extraCostRate: isColorMode ? printer.totalColorCost : printer.totalBwCost,
          };
        }
        return opt;
      });

      return next;
    });

    showToast(`ຕັ້ງຄ່າ Baseline Coverage ເປັນ ${newCoverage}% ແລະ ຄິດໄລ່ຕົ້ນທຶນໃໝ່ສຳເລັດ`, 'info');
  };

  // Preset Capability switcher
  const handleApplyCapabilityMode = (mode: 'dual_mode' | 'color_only' | 'mono_only') => {
    const defaultPrinter = dynamicPrinters.find(p => p.id === defaultMachineId) || dynamicPrinters[0] || {
      id: 'PRN-FUJI-V180',
      name: 'Fuji Xerox Versant 180 Press',
      totalColorCost: 1250,
      totalBwCost: 280,
    };

    const options: PublicProductOption[] = [];

    if (mode === 'dual_mode' || mode === 'color_only') {
      options.push({
        optionType: 'printing_mode',
        machineId: defaultPrinter.id,
        machineName: defaultPrinter.name,
        label: 'ພິມ 4 ສີ (Full Color CMYK)',
        labelLo: 'ພິມ 4 ສີ (Full Color CMYK)',
        labelEn: 'Full Color CMYK',
        value: 'cmyk_4c',
        isDefault: true,
        extraCostRate: defaultPrinter.totalColorCost,
        addPrice: 0,
      });
    }

    if (mode === 'dual_mode' || mode === 'mono_only') {
      options.push({
        optionType: 'printing_mode',
        machineId: defaultPrinter.id,
        machineName: defaultPrinter.name,
        label: 'ພິມຂາວດຳ (Monochrome K)',
        labelLo: 'ພິມຂາວດຳ (Monochrome K)',
        labelEn: 'Monochrome Black & White',
        value: 'mono_k',
        isDefault: mode === 'mono_only',
        extraCostRate: defaultPrinter.totalBwCost,
        addPrice: 0,
      });
    }

    ensurePrintModeGroup(options);
    const label = mode === 'color_only' ? 'ພິມ 4 ສີເທົ່ານັ້ນ' : (mode === 'mono_only' ? 'ພິມຂາວດຳເທົ່ານັ້ນ' : 'ຮອງຮັບທັງ ສີ & ຂາວດຳ');
    showToast(`ປ່ຽນໂໝດສິນຄ້າເປັນ: ${label}`, 'info');
  };

  // Link specific printer to a specific option row
  const handleLinkMachineToOption = (oIdx: number, machineId: string, costType: 'color' | 'mono') => {
    if (!machineId) {
      setSpecGroups(prev => {
        const gIdx = prev.findIndex(g => g.id === 'group_print_mode' || g.groupType === 'printing_mode');
        if (gIdx < 0) return prev;

        const next = [...prev];
        const opt = next[gIdx].options[oIdx];
        if (!opt) return prev;

        opt.machineId = '';
        opt.machineName = '';
        opt.extraCostRate = 0;
        return next;
      });
      showToast('ຍົກເລີກການຜູກເຄື່ອງພິມສຳເລັດ', 'info');
      return;
    }

    const mach = dynamicPrinters.find(p => p.id === machineId);
    if (!mach) return;

    setSpecGroups(prev => {
      const gIdx = prev.findIndex(g => g.id === 'group_print_mode' || g.groupType === 'printing_mode');
      if (gIdx < 0) return prev;

      const next = [...prev];
      const opt = next[gIdx].options[oIdx];
      if (!opt) return prev;

      opt.machineId = mach.id;
      opt.machineName = mach.name;
      opt.extraCostRate = costType === 'color' ? mach.totalColorCost : mach.totalBwCost;

      // If this option is default, update default machine
      if (opt.isDefault) {
        setDefaultMachineId(mach.id);
        setDefaultMachineName(mach.name);
      }

      return next;
    });

    showToast(`ຜູກ ${mach.name} (${costType === 'color' ? '4 ສີ' : 'ຂາວດຳ'}: ${(costType === 'color' ? mach.totalColorCost : mach.totalBwCost).toLocaleString()} ₭/ແຜ່ນ) ສຳເລັດ`, 'success');
  };

  // Toggle option default
  const handleSetOptionDefault = (oIdx: number) => {
    setSpecGroups(prev => {
      const gIdx = prev.findIndex(g => g.id === 'group_print_mode' || g.groupType === 'printing_mode');
      if (gIdx < 0) return prev;

      const next = [...prev];
      next[gIdx].options.forEach((opt, idx) => {
        opt.isDefault = (idx === oIdx);
        if (idx === oIdx && opt.machineId) {
          setDefaultMachineId(opt.machineId);
          setDefaultMachineName(opt.machineName || '');
        }
      });
      return next;
    });
  };

  // Update option text field
  const handleUpdateOptionField = (oIdx: number, field: string, val: any) => {
    setSpecGroups(prev => {
      const gIdx = prev.findIndex(g => g.id === 'group_print_mode' || g.groupType === 'printing_mode');
      if (gIdx < 0) return prev;

      const next = [...prev];
      (next[gIdx].options[oIdx] as any)[field] = val;
      return next;
    });
  };

  // Add custom print mode option
  const handleAddCustomPrintMode = () => {
    const defaultPrinter = dynamicPrinters[0] || {
      id: 'PRN-FUJI-V180',
      name: 'Fuji Xerox Versant 180 Press',
      totalColorCost: 1250,
      totalBwCost: 280,
    };

    setSpecGroups(prev => {
      const gIdx = prev.findIndex(g => g.id === 'group_print_mode' || g.groupType === 'printing_mode');
      if (gIdx < 0) return prev;

      const next = [...prev];
      next[gIdx].options.push({
        optionType: 'printing_mode',
        machineId: defaultPrinter.id,
        machineName: defaultPrinter.name,
        label: 'ໂໝດພິມໃໝ່',
        labelLo: 'ໂໝດພິມໃໝ່',
        labelEn: 'Custom Print Mode',
        value: `mode_${Date.now() % 10000}`,
        isDefault: false,
        extraCostRate: defaultPrinter.totalColorCost,
        addPrice: 0,
      });
      return next;
    });

    showToast('ເພີ່ມໂໝດການພິມໃໝ່ຮຽບຮ້ອຍ', 'success');
  };

  // Remove option
  const handleRemoveOption = (oIdx: number) => {
    setSpecGroups(prev => {
      const gIdx = prev.findIndex(g => g.id === 'group_print_mode' || g.groupType === 'printing_mode');
      if (gIdx < 0) return prev;

      const next = [...prev];
      if (next[gIdx].options.length <= 1) {
        showToast('ຕ້ອງມີຢ່າງໜ້ອຍ 1 ໂໝດການພິມ', 'error');
        return prev;
      }

      next[gIdx].options = next[gIdx].options.filter((_, idx) => idx !== oIdx);
      // Ensure at least one default
      if (!next[gIdx].options.some(o => o.isDefault)) {
        next[gIdx].options[0].isDefault = true;
        if (next[gIdx].options[0].machineId) {
          setDefaultMachineId(next[gIdx].options[0].machineId);
          setDefaultMachineName(next[gIdx].options[0].machineName || '');
        }
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs text-slate-900">
        <div className="space-y-1">
          <h2 className="text-base font-black flex items-center gap-2 text-slate-900">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <span>ຂັ້ນຕອນທີ 2: ຈັດການໂໝດການພິມ & ຜູກເຄື່ອງພິມຈິງ (Print Modes & Machine Binding)</span>
          </h2>
          <p className="text-xs text-slate-500">
            ກຳນົດຕົວເລືອກໂໝດການພິມສຳລັບລູກຄ້າ (ສີ / ຂາວດຳ), <strong>ຕັ້ງຄ່າ Baseline Coverage</strong> ແລະ <strong>ເລືອກຜູກເຄື່ອງພິມແທ້ຈິງ</strong> ເພື່ອຄິດໄລ່ຕົ້ນທຶນ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-mono font-bold">
            {dynamicPrinters.length} Registered Printers
          </span>
        </div>
      </div>

      {/* SECTION: BASELINE INK COVERAGE % SELECTOR & PREFLIGHT STANDARD */}
      <div className="p-6 bg-white border border-indigo-200/90 rounded-3xl space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-700">
                <Droplets className="w-4 h-4 text-cyan-600" />
              </span>
              <h3 className="text-sm font-black text-slate-900">
                ກຳນົດຄ່າ Coverage ພື້ນຖານຂອງສິນຄ້າ (Baseline Ink Coverage %):
              </h3>
              <span className="px-2.5 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-300 rounded-lg text-xs font-mono font-black">
                {baselineCoveragePercent}% Coverage
              </span>
            </div>
            <p className="text-xs text-slate-500">
              ໃຊ້ເປັນເກณฑ์ຄິດໄລ່ຕົ້ນທຶນນ້ຳໝຶກເລີ່ມຕົ້ນ ແລະ ເຊື່ອມຕໍ່ກັບລະບົບ <strong>Preflight CMYK Analyzer</strong> ເພື່ອຄິດໄລ່ສ່ວນຕ່າງເມື່ອລູກຄ້າອັບຟາຍສີເຂັ້ມ
            </p>
          </div>
        </div>

        {/* Coverage Presets Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {[
            { pct: 5, label: '5% ເອກະສານ', desc: 'ປຶ້ມ / ເອກະສານທົ່ວໄປ' },
            { pct: 15, label: '15% ມາດຕະຖານ', desc: 'ແຜ່ນພັບ / ໂປຣຊົວ / ນາມບັດ' },
            { pct: 25, label: '25% ສີປານກາງ', desc: 'ສະຕິກເກີ / ຮູບພາບສີ' },
            { pct: 50, label: '50% ສີທຶບ', desc: 'ໂປສເຕີ / ກຣາບຟິກໜັກ' },
            { pct: 100, label: '100% Solid Fill', desc: 'ພື້ນສີຖົມທຶບເຕັມແຜ່ນ' },
          ].map((item) => (
            <button
              key={item.pct}
              type="button"
              onClick={() => handleUpdateBaselineCoverage(item.pct)}
              className={`p-3 rounded-2xl border text-left transition space-y-1 cursor-pointer ${
                baselineCoveragePercent === item.pct
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black">{item.label}</span>
                {baselineCoveragePercent === item.pct && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <p className={`text-[10px] font-mono truncate ${baselineCoveragePercent === item.pct ? 'text-indigo-100' : 'text-slate-400'}`}>{item.desc}</p>
            </button>
          ))}

          {/* Custom Input */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500">ກຳນົດເອງ (Custom %):</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={400}
                value={baselineCoveragePercent}
                onChange={(e) => handleUpdateBaselineCoverage(Math.max(1, Math.min(400, parseInt(e.target.value, 10) || 15)))}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-indigo-700 text-center focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="text-xs font-mono text-slate-500">%</span>
            </div>
          </div>
        </div>

        {/* Preflight Analyzer Integration Info Banner */}
        <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>
              <strong>Preflight CMYK Surcharge Formula:</strong> ຖ້າໄຟລ໌ລູກຄ້າມີ Coverage ເກີນ <strong>{baselineCoveragePercent}%</strong>, ລະບົບຈະຄິດໄລ່ຄ່າໝຶກສ່ວນເກີນອັດຕະໂນມັດ
            </span>
          </div>
          <span className="font-mono text-indigo-700 font-bold whitespace-nowrap bg-white px-2.5 py-1 rounded-xl border border-indigo-200">
            ΔCoverage × Ink Cost
          </span>
        </div>
      </div>

      {/* Preset Capability Mode Switcher */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-3xl space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>ຮູບແບບໂໝດສີຂອງສິນຄ້າ (Product Capability Preset):</span>
          </span>
          <span className="text-[11px] text-slate-400">
            ເລືອກເພື່ອສ້າງຕາຕະລາງໂໝດພິມອັດຕະໂນມັດ
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Dual Mode */}
          <button
            type="button"
            onClick={() => handleApplyCapabilityMode('dual_mode')}
            className={`p-4 rounded-2xl border-2 transition text-left space-y-1 cursor-pointer ${
              colorCapabilityMode === 'dual_mode'
                ? 'bg-sky-50/80 border-sky-600 shadow-xs'
                : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                <span>ຮອງຮັບທັງ ສີ & ຂາວດຳ (Dual-Mode)</span>
              </span>
              {colorCapabilityMode === 'dual_mode' && <Check className="w-3.5 h-3.5 text-sky-600" />}
            </div>
            <p className="text-[10px] text-slate-500">
              ລູກຄ້າເລືອກສະຫຼັບໄດ້ໃນໜ້າເວັບ (ພິມສີ 4C ຫຼື ຂາວດຳ K)
            </p>
          </button>

          {/* Color Only */}
          <button
            type="button"
            onClick={() => handleApplyCapabilityMode('color_only')}
            className={`p-4 rounded-2xl border-2 transition text-left space-y-1 cursor-pointer ${
              colorCapabilityMode === 'color_only'
                ? 'bg-sky-50/80 border-sky-600 shadow-xs'
                : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-sky-600" />
                <span>ພິມ 4 ສີເທົ່ານັ້ນ (Color Only)</span>
              </span>
              {colorCapabilityMode === 'color_only' && <Check className="w-3.5 h-3.5 text-sky-600" />}
            </div>
            <p className="text-[10px] text-slate-500">
              ສຳລັບສະຕິກເກີ, ໂປສເຕີ, ງານສີລ້ວນ
            </p>
          </button>

          {/* Mono Only */}
          <button
            type="button"
            onClick={() => handleApplyCapabilityMode('mono_only')}
            className={`p-4 rounded-2xl border-2 transition text-left space-y-1 cursor-pointer ${
              colorCapabilityMode === 'mono_only'
                ? 'bg-sky-50/80 border-sky-600 shadow-xs'
                : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>ພິມຂາວດຳເທົ່ານັ້ນ (Mono Only)</span>
              </span>
              {colorCapabilityMode === 'mono_only' && <Check className="w-3.5 h-3.5 text-sky-600" />}
            </div>
            <p className="text-[10px] text-slate-500">
              ສຳລັບໃບຮັບເງິນ, ເອກະສານ, ປຶ້ມຂາວດຳ
            </p>
          </button>
        </div>
      </div>

      {/* CORE MATRIX: PER-MODE MACHINE BINDING TABLE */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-3xl space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-sky-600" />
              <span>ຕາຕະລາງຜູກເຄື່ອງພິມເຂົ້າກັບໂໝດ (Per-Mode Machine Binding Matrix)</span>
            </h3>
            <p className="text-xs text-slate-500">
              ເລືອກເຄື່ອງພິມຕົວຈິງທີ່ໃຊ້ຜະລິດສຳລັບແຕ່ລະໂໝດ (ເຊັ່ນ: ໂໝດສີຜູກເຄື່ອງ Xerox, ໂໝດຂາວດຳຜູກເຄື່ອງ Ricoh Mono)
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddCustomPrintMode}
            className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ເພີ່ມໂໝດການພິມໃໝ່</span>
          </button>
        </div>

        {/* Options Binding Rows */}
        <div className="space-y-3">
          {printModeGroup?.options.map((opt, oIdx) => {
            const isColorMode = opt.value === 'cmyk_4c' || opt.labelLo?.includes('ສີ') || opt.label?.toLowerCase().includes('color');

            return (
              <div
                key={opt.value || oIdx}
                className={`p-4 rounded-2xl border transition grid grid-cols-1 lg:grid-cols-12 gap-3 items-center ${
                  opt.isDefault
                    ? 'bg-sky-50/50 border-sky-300 shadow-2xs'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                {/* 1. Radio Default & Option Name */}
                <div className="lg:col-span-4 flex items-center gap-3">
                  <input
                    type="radio"
                    name="default_print_mode"
                    checked={Boolean(opt.isDefault)}
                    onChange={() => handleSetOptionDefault(oIdx)}
                    className="w-4 h-4 text-sky-600 cursor-pointer shrink-0 focus:ring-accent-sky"
                    title="ຕັ້ງເປັນໂໝດເລີ່ມຕົ້ນ"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{isColorMode ? <Palette className="w-4 h-4 text-sky-600" /> : <FileText className="w-4 h-4 text-slate-500" />}</span>
                      <input
                        type="text"
                        value={opt.labelLo || opt.label}
                        onChange={(e) => {
                          handleUpdateOptionField(oIdx, 'labelLo', e.target.value);
                          handleUpdateOptionField(oIdx, 'label', e.target.value);
                        }}
                        placeholder="ຊື່ໂໝດ (ລາວ) ເຊັ່ນ: ພິມ 4 ສີ"
                        className="w-full px-2.5 py-1 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                      />
                    </div>
                    <input
                      type="text"
                      value={opt.labelEn || ''}
                      onChange={(e) => handleUpdateOptionField(oIdx, 'labelEn', e.target.value)}
                      placeholder="Mode (EN) e.g. Full Color CMYK"
                      className="w-full px-2.5 py-0.5 text-[11px] bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                    />
                  </div>
                </div>

                {/* 2. Machine Linker Dropdown & Search Button */}
                <div className="lg:col-span-5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                      <Printer className="w-3 h-3 text-slate-400" />
                      <span>ເຄື່ອງພິມທີ່ຜູກກັບໂໝດນີ້:</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-sky-700">
                      {isColorMode ? 'ສູດຄິດໄລ່: 4-Color (CMYK)' : 'ສູດຄິດໄລ່: Mono (K)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={opt.machineId || ''}
                      onChange={(e) => handleLinkMachineToOption(oIdx, e.target.value, isColorMode ? 'color' : 'mono')}
                      className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-800 truncate cursor-pointer shadow-2xs focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                    >
                      <option value="">-- ເລືອກເຄື່ອງພິມຕົວຈິງໃນຮ້ານ --</option>
                      {dynamicPrinters.map((printer) => {
                        const costForMode = isColorMode ? printer.totalColorCost : printer.totalBwCost;
                        return (
                          <option key={printer.id} value={printer.id}>
                            {printer.name} [{printer.brand || 'Printer'}] - ຕົ້ນທຶນ {costForMode.toLocaleString()} ₭/ແຜ່ນ
                          </option>
                        );
                      })}
                    </select>
                    <button
                      type="button"
                      onClick={() => setSearchingRowIdx(oIdx)}
                      className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                      title="ຄົ້ນຫາ & ເລືອກເຄື່ອງພິມ (Live Fleet Search)"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">ຄົ້ນຫາ</span>
                    </button>
                  </div>
                </div>

                {/* 3. Cost Preview Pill */}
                <div className="lg:col-span-2">
                  <div className={`p-2.5 rounded-xl text-right border ${
                    opt.machineId ? 'bg-sky-50 border-sky-200' : 'bg-slate-50 border-dashed border-slate-200'
                  }`}>
                    <span className="text-[9px] text-slate-500 block">ຕົ້ນທຶນແທ້ຈິງ ({baselineCoveragePercent}%):</span>
                    <span className={`text-xs font-mono font-black ${
                      opt.machineId ? 'text-sky-700' : 'text-slate-400'
                    }`}>
                      {opt.machineId ? `${(opt.extraCostRate || 0).toLocaleString()} ₭` : 'ຍັງບໍ່ໄດ້ເລືອກ'}
                    </span>
                    <span className="text-[9px] text-slate-400 block">
                      {opt.machineId ? '/ແຜ່ນ' : 'ກະລຸນາເລືອກເຄື່ອງ'}
                    </span>
                  </div>
                </div>

                {/* 4. Remove Option */}
                <div className="lg:col-span-1 flex justify-end">
                  {printModeGroup.options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(oIdx)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                      title="ລຶບໂໝດນີ້"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SHOP PRINTER CARDS: FULL BREAKDOWN BENCHMARK */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-600" />
            <span>ລາຍລະອຽດເຄື່ອງພິມຕົວຈິງໃນຮ້ານ (Shop Printer Inventory & Specs Reference)</span>
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">
            ຄິດໄລ່ນ້ຳໝຶກທີ່ Coverage {baselineCoveragePercent}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dynamicPrinters.map((printer) => {
            const isUsedInProduct = printModeGroup?.options.some(o => o.machineId === printer.id);

            return (
              <div
                key={printer.id}
                className={`p-5 bg-white border rounded-3xl space-y-3 shadow-xs transition ${
                  isUsedInProduct
                    ? 'border-sky-500 ring-2 ring-sky-500/20'
                    : 'border-slate-200/90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {printer.name}
                      </span>
                      {isUsedInProduct && (
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[9px] font-bold rounded-full">
                          ຖືກໃຊ້ໃນສິນຄ້ານີ້
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {printer.brand} • {printer.model} ({printer.type})
                    </span>
                  </div>

                  <Printer className="w-5 h-5 text-slate-400" />
                </div>

                {/* 2-Pillar Cost Matrix for this printer */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200">
                    <span className="text-[10px] font-bold text-sky-900 block flex items-center gap-1">
                      <Palette className="w-3 h-3 text-sky-600" />
                      <span>ຕົ້ນທຶນ 4 ສີ (Full CMYK):</span>
                    </span>
                    <strong className="text-sm font-mono font-black text-sky-700">
                      {printer.totalColorCost.toLocaleString()} ₭
                    </strong>
                    <span className="text-[9px] text-slate-400 block">/ແຜ່ນ ({baselineCoveragePercent}%)</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-700 block flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-500" />
                      <span>ຕົ້ນທຶນຂາວດຳ (Mono K):</span>
                    </span>
                    <strong className="text-sm font-mono font-black text-slate-800">
                      {printer.totalBwCost.toLocaleString()} ₭
                    </strong>
                    <span className="text-[9px] text-slate-400 block">/ແຜ່ນ ({baselineCoveragePercent}%)</span>
                  </div>
                </div>

                {/* Sub-breakdown: Depreciation + Maint + Inks */}
                <div className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-500 pt-1">
                  <div className="truncate">
                    <span>ຄ່າເສື່ອມ: </span>
                    <strong className="font-mono text-slate-800">{printer.deprPerPage}₭</strong>
                  </div>
                  <div className="truncate">
                    <span>ຄ່າໄຟ+ບຳລຸງ: </span>
                    <strong className="font-mono text-slate-800">{(printer.maintenancePerPage + printer.electricityPerPage).toFixed(1)}₭</strong>
                  </div>
                  <div className="truncate text-right">
                    <span>ຄ່າໝຶກ 4C: </span>
                    <strong className="font-mono text-slate-800">{printer.colorInkCost.toLocaleString()}₭</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION: DUPLEX PRINTING (1-SIDE VS 2-SIDES TOGGLE) */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-3xl space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>ຕົວເລືອກພິມ 1 ດ້ານ ຫຼື 2 ດ້ານ (Single-sided vs Double-sided / Duplex)</span>
            </h3>
            <p className="text-xs text-slate-500">
              ກຳນົດວ່າສິນຄ້ານີ້ຈະເປີດໃຫ້ລູກຄ້າເລືອກພິມ 2 ດ້ານໄດ້ຫຼືບໍ່ (ເຊັ່ນ: ນາມບັດ, ໂບຣຊົວ, ເອກະສານ ຮອງຮັບ 2 ດ້ານ; ແຕ່ຮູບພາບ, ສະຕິກເກີ ພິມດ້ານດຽວ)
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => {
                if (setFeaturesConfig) {
                  setFeaturesConfig(prev => ({ ...prev, hasDuplexPrinting: true }));
                  showToast('ເປີດຕົວເລືອກພິມ 2 ດ້ານ (Duplex) ສຳເລັດ', 'success');
                }
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                featuresConfig?.hasDuplexPrinting
                  ? 'bg-accent-sky text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>ຮອງຮັບ 2 ດ້ານ (Duplex)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (setFeaturesConfig) {
                  setFeaturesConfig(prev => ({ ...prev, hasDuplexPrinting: false }));
                  showToast('ລັອກເປັນພິມ 1 ດ້ານເທົ່ານັ້ນ (Single-sided)', 'info');
                }
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                !featuresConfig?.hasDuplexPrinting
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ພິມ 1 ດ້ານເທົ່ານັ້ນ</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={`p-4 rounded-2xl border transition ${
            !featuresConfig?.hasDuplexPrinting
              ? 'bg-sky-50/50 border-sky-300 text-slate-900'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <div className="flex items-center gap-2 font-bold text-xs mb-1">
              <FileText className="w-3.5 h-3.5 text-sky-600" />
              <span>ພິມ 1 ດ້ານ (Single-sided):</span>
            </div>
            <p className="text-[11px] text-slate-500">
              ຄິດໄລ່ຕົ້ນທຶນການພິມ 1 ເທົ່າ (1x Click + Ink Rate). ເໝາະສຳລັບ: ສະຕິກເກີ, ໂປສເຕີ, ຮູບພາບຕັ້ງໂຕະ.
            </p>
          </div>

          <div className={`p-4 rounded-2xl border transition ${
            featuresConfig?.hasDuplexPrinting
              ? 'bg-sky-50/50 border-sky-300 text-slate-900'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <div className="flex items-center gap-2 font-bold text-xs mb-1">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>ພິມ 2 ດ້ານ (Double-sided / Duplex):</span>
            </div>
            <p className="text-[11px] text-slate-500">
              ຄິດໄລ່ຕົ້ນທຶນການພິມ 2 ເທົ່າ (2x Click + Ink Rate) ອັດຕະໂນມັດເມື່ອລູກຄ້າເລືອກ. ເໝາະສຳລັບ: ນາມບັດ 2 ດ້ານ, ແຜ່ນພັບ, ປຶ້ມ.
            </p>
          </div>
        </div>
      </div>

      {/* PRINTER SELECTOR MODAL */}
      {searchingRowIdx !== null && (
        <PrinterSelectorModal
          isOpen={true}
          onClose={() => setSearchingRowIdx(null)}
          onSelect={(printer) => {
            const opt = printModeGroup?.options[searchingRowIdx];
            const isColorMode = opt?.value === 'cmyk_4c' || opt?.labelLo?.includes('ສີ') || opt?.label?.toLowerCase().includes('color');
            handleLinkMachineToOption(searchingRowIdx, printer.id, isColorMode ? 'color' : 'mono');
            setSearchingRowIdx(null);
          }}
          selectedPrinterId={printModeGroup?.options[searchingRowIdx]?.machineId}
          printers={equipment || []}
          formatCurrency={formatLAK}
          getPrinterMachineRate={(printer) => {
            const p = dynamicPrinters.find(dp => dp.id === printer.id);
            return p ? p.deprPerPage + p.maintenancePerPage : 50;
          }}
          getPrinterActualInkCostPerPage={(printer) => {
            const opt = printModeGroup?.options[searchingRowIdx];
            const isColorMode = opt?.value === 'cmyk_4c' || opt?.labelLo?.includes('ສີ') || opt?.label?.toLowerCase().includes('color');
            const p = dynamicPrinters.find(dp => dp.id === printer.id);
            return p ? (isColorMode ? p.colorInkCost : p.bwInkCost) : 100;
          }}
        />
      )}

    </div>
  );
};
