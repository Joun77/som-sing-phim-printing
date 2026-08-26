import React, { useMemo, useState } from 'react';
import { 
  Tag, 
  BookOpen, 
  Plus, 
  Trash2, 
  Percent, 
  TrendingDown, 
  Sparkles, 
  FileText, 
  Truck, 
  HelpCircle, 
  Info,
  Check,
  X,
  Printer,
  Package,
  Scissors,
  Calculator,
  Coins,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Layers,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Sliders,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { ProductDiscountTier, ProductInfoTab, SpecGroup, FeaturesConfig, CustomBreakdownRow } from '../../types';
import { useApp } from '@store/AppContext';
import { calculateMachineFullCost, CalculatedMachineCost } from '@utils/machineCostCalculator';

export interface Step5DiscountsAndTabsProps {
  basePrice: number;
  setBasePrice: (price: number) => void;
  targetMarginPercent: number;
  setTargetMarginPercent: (margin: number) => void;
  defaultMachineId: string;
  defaultMachineName: string;
  baselineCoveragePercent?: number;
  specGroups: SpecGroup[];
  setSpecGroups: React.Dispatch<React.SetStateAction<SpecGroup[]>>;
  discountTiers: ProductDiscountTier[];
  setDiscountTiers: React.Dispatch<React.SetStateAction<ProductDiscountTier[]>>;
  infoTabs: ProductInfoTab[];
  setInfoTabs: React.Dispatch<React.SetStateAction<ProductInfoTab[]>>;
  featuresConfig?: FeaturesConfig;
  setFeaturesConfig?: React.Dispatch<React.SetStateAction<FeaturesConfig>>;
  minQuantity?: number;
  setMinQuantity?: (n: number) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const DEFAULT_PRESET_TABS: ProductInfoTab[] = [
  {
    id: 'specs',
    titleLo: '📜 ຄູ່ມືວັດສະດຸ & ສະເປັກ (Specs & Material Guide)',
    titleEn: 'Material & Spec Guide',
    icon: '📜',
    contentLo: '• ເຈ້ຍອາດກາດພຣີມ້ຽມ 260g - 350g ເນື້ອແໜ້ນ ຜິວລຽບລະອຽດສູງ\n• ສະຕິກເກີ PP / PVC ກັນນ້ຳ 100% ຕິດແໜ້ນ ທົນແດດ ທົນນ້ຳ\n• ພິມດ້ວຍລະບົບດິຈິຕອນ 4 ສີ Ultra HD ລະອຽດ 2400 DPI',
    contentEn: 'Premium grade paper and synthetic materials with 2400 DPI Ultra HD printing.',
  },
  {
    id: 'bleed',
    titleLo: '📐 ໄລຍະຕັດຕົກ & ມາດຕະຖານຟາຍ (Bleed & File Specs)',
    titleEn: 'Bleed & Artwork Setup',
    icon: '📐',
    contentLo: '• ຂະໜາດຕັດຕົກ (Bleed): ເຜື່ອຂອບອອກ 2 mm ທຸກດ້ານ\n• ໄລຍະປອດໄພ (Safe Zone): ວາງຂໍ້ຄວາມຫ່າງຈາກຂອບຕັດຢ່າງໜ້ອຍ 3 mm\n• ໂໝດສີ: CMYK Color Profile (ຄວາມລະອຽດແນະນຳ 300 DPI ຂຶ້ນໄປ)',
    contentEn: 'Include 2mm bleed on all sides and maintain 3mm safe margin. Format: PDF/AI 300 DPI.',
  },
  {
    id: 'delivery',
    titleLo: '🚚 ຮອບຜະລິດ & ການຈັດສົ່ງ (Production & Delivery)',
    titleEn: 'Production & Shipping',
    icon: '🚚',
    contentLo: '• ງານດ່ວນພິເສດ (Rush 24h): ຜະລິດພາຍໃນ 24 ຊົ່ວໂມງ\n• ງານມາດຕະຖານ: 1-2 ວັນລັດຖະການ\n• ຈັດສົ່ງທົ່ວນະຄອນຫຼວງວຽງຈັນ ແລະ ຕ່າງແຂວງຜ່ານຂົນສົ່ງເອກະຊົນ',
    contentEn: 'Standard turnaround 1-2 business days. 24h expedited rush available.',
  },
  {
    id: 'faq',
    titleLo: '❓ ຄຳຖາມທີ່ພົບເລື້ອຍ (FAQ)',
    titleEn: 'Frequently Asked Questions',
    icon: '❓',
    contentLo: 'Q: ສັ່ງຂັ້ນຕ່ຳເທົ່າໃດ?\nA: ເລີ່ມຕົ້ນພຽງ 1 ແຜ່ນ / 100 ຊິ້ນ ຂຶ້ນໄປ\nQ: ຖ້າບໍ່ມີຟາຍ ມີບໍລິການອອກແບບບໍ່?\nA: ຮ້ານມີ Template ຟຣີ ແລະ ບໍລິການຈັດອາດເວິກ',
    contentEn: 'Q: Minimum order quantity? A: Starts from 1 sheet. Free templates provided.',
  },
];

export const Step5DiscountsAndTabs: React.FC<Step5DiscountsAndTabsProps> = ({
  basePrice,
  setBasePrice,
  targetMarginPercent,
  setTargetMarginPercent,
  defaultMachineId,
  defaultMachineName,
  baselineCoveragePercent = 15,
  specGroups,
  setSpecGroups,
  discountTiers,
  setDiscountTiers,
  infoTabs,
  setInfoTabs,
  featuresConfig,
  setFeaturesConfig,
  minQuantity = 1,
  setMinQuantity,
  showToast,
}) => {
  const { equipment, printerColorLinks, inventory, formatCurrency } = useApp();
  const formatLAK = formatCurrency;

  // 1. Resolve Default Equipment & Calculation Fallback
  const defaultPrinterObj = useMemo(() => {
    return (equipment || []).find(eq => eq.id === defaultMachineId) ||
           (equipment || []).find(eq => eq.category === 'Printer' || eq.category === 'PRINTER') ||
           null;
  }, [equipment, defaultMachineId]);

  const defaultCalculatedPrinterCost = useMemo<CalculatedMachineCost | null>(() => {
    if (!defaultPrinterObj) return null;
    return calculateMachineFullCost({
      equipment: defaultPrinterObj,
      printerColorLinks,
      inventory,
      coveragePercent: baselineCoveragePercent,
    });
  }, [defaultPrinterObj, printerColorLinks, inventory, baselineCoveragePercent]);

  // 2. Extract Print Modes Group from Step 2
  const printModeGroup = useMemo(() => {
    return specGroups.find(
      g => g.id === 'group_print_mode' || 
           g.groupType === 'printing_mode' || 
           g.id.toLowerCase().includes('print') ||
           g.titleLo?.includes('ສີ') ||
           g.titleLo?.includes('ພິມ') ||
           g.titleEn?.toLowerCase().includes('color') ||
           g.titleEn?.toLowerCase().includes('print')
    );
  }, [specGroups]);

  // Extract Color Option (with robust fallbacks)
  const colorOption = useMemo(() => {
    if (!printModeGroup || !printModeGroup.options.length) return null;
    return printModeGroup.options.find(
      o => o.value === 'cmyk_4c' || 
           o.value.includes('color') ||
           o.labelLo?.includes('ສີ') || 
           o.label?.toLowerCase().includes('color')
    ) || (printModeGroup.options[0].value !== 'mono_k' ? printModeGroup.options[0] : null);
  }, [printModeGroup]);

  // Extract Mono Option (with robust fallbacks)
  const monoOption = useMemo(() => {
    if (!printModeGroup || !printModeGroup.options.length) return null;
    return printModeGroup.options.find(
      o => o.value === 'mono_k' || 
           o.value.includes('mono') ||
           o.value.includes('bw') ||
           o.labelLo?.includes('ຂາວດຳ') || 
           o.label?.toLowerCase().includes('mono') ||
           o.label?.toLowerCase().includes('black')
    ) || (printModeGroup.options.length > 1 ? printModeGroup.options[1] : null);
  }, [printModeGroup]);

  // Color Printer Cost Calculation
  const colorPrinterCost = useMemo<CalculatedMachineCost | null>(() => {
    const targetEq = (equipment || []).find(eq => eq.id === (colorOption?.machineId || defaultMachineId)) || defaultPrinterObj;
    if (!targetEq) return defaultCalculatedPrinterCost;
    return calculateMachineFullCost({
      equipment: targetEq,
      printerColorLinks,
      inventory,
      coveragePercent: baselineCoveragePercent,
    });
  }, [equipment, printerColorLinks, inventory, colorOption, defaultMachineId, defaultPrinterObj, defaultCalculatedPrinterCost, baselineCoveragePercent]);

  // Mono Printer Cost Calculation
  const monoPrinterCost = useMemo<CalculatedMachineCost | null>(() => {
    const targetEq = (equipment || []).find(eq => eq.id === (monoOption?.machineId || defaultMachineId)) || defaultPrinterObj;
    if (!targetEq) return defaultCalculatedPrinterCost;
    return calculateMachineFullCost({
      equipment: targetEq,
      printerColorLinks,
      inventory,
      coveragePercent: baselineCoveragePercent,
    });
  }, [equipment, printerColorLinks, inventory, monoOption, defaultMachineId, defaultPrinterObj, defaultCalculatedPrinterCost, baselineCoveragePercent]);

  // Guaranteed unit costs for Color and Monochrome printing
  const colorPrintUnitCost = colorOption?.extraCostRate || colorPrinterCost?.totalColorCost || defaultCalculatedPrinterCost?.totalColorCost || 141;
  const monoPrintUnitCost = monoOption?.extraCostRate || monoPrinterCost?.totalBwCost || defaultCalculatedPrinterCost?.totalBwCost || 90;
  
  const hasDualModes = true; // Always display dual-case for transparency and comparison
  const defaultOptionIsColor = colorOption ? Boolean(colorOption.isDefault) : true;

  // 3. Calculate Default Material Cost from Step 3 (Supports N material groups: Paper, Sticker, Cover, Inner, Photo, etc.)
  const materialGroups = useMemo(() => {
    return specGroups.filter(g => 
      g.groupType === 'material' || 
      g.id.includes('material') || 
      g.id.includes('paper') ||
      g.id.includes('mat_') ||
      g.titleLo?.includes('ເຈ້ຍ') || 
      g.titleLo?.includes('ວັດສະດຸ')
    );
  }, [specGroups]);

  const defaultMaterialItems = useMemo(() => {
    return materialGroups.map(g => {
      const defOpt = g.options.find(o => o.isDefault) || g.options[0];
      return {
        groupId: g.id,
        groupTitle: g.titleLo || g.titleEn || 'ວັດສະດຸ',
        optionLabel: defOpt?.labelLo || defOpt?.label || 'Standard Paper',
        cost: Number(defOpt?.extraCostRate || 0),
      };
    });
  }, [materialGroups]);

  const materialUnitCost = useMemo(() => {
    return defaultMaterialItems.reduce((sum, item) => sum + item.cost, 0);
  }, [defaultMaterialItems]);

  // 4. Calculate Default Finishing / Post-Press Costs from Step 4
  const finishingGroups = useMemo(() => {
    return specGroups.filter(g => 
      g.id !== 'group_print_mode' && 
      g.groupType !== 'printing_mode' && 
      !materialGroups.some(mg => mg.id === g.id)
    );
  }, [specGroups, materialGroups]);

  const finishingItems = useMemo(() => {
    const list: Array<{ groupId: string; groupTitle: string; optionLabel: string; cost: number }> = [];
    finishingGroups.forEach(g => {
      const defOpt = g.options.find(o => o.isDefault) || g.options[0];
      if (defOpt) {
        list.push({
          groupId: g.id,
          groupTitle: g.titleLo || g.titleEn,
          optionLabel: defOpt.labelLo || defOpt.label,
          cost: Number(defOpt.extraCostRate || 0),
        });
      }
    });
    return list;
  }, [finishingGroups]);

  const finishingUnitCost = useMemo(() => {
    return finishingItems.reduce((sum, item) => sum + item.cost, 0);
  }, [finishingItems]);

  // 5. Dual Master Production Costs (Color vs Mono)
  const totalColorBaseCost = colorPrintUnitCost + materialUnitCost + finishingUnitCost;
  const totalMonoBaseCost = monoPrintUnitCost + materialUnitCost + finishingUnitCost;
  
  // Primary default total base cost for base price
  const primaryTotalBaseCost = defaultOptionIsColor ? totalColorBaseCost : totalMonoBaseCost;

  // 6. Dual Margin & Selling Prices
  const marginFactor = Math.max(0.05, 1 - targetMarginPercent / 100);
  const suggestedColorSellingPrice = Math.round(totalColorBaseCost / marginFactor);
  const suggestedMonoSellingPrice = Math.round(totalMonoBaseCost / marginFactor);
  const suggestedPrimarySellingPrice = defaultOptionIsColor ? suggestedColorSellingPrice : suggestedMonoSellingPrice;

  const colorUnitProfit = Math.max(0, suggestedColorSellingPrice - totalColorBaseCost);
  const monoUnitProfit = Math.max(0, suggestedMonoSellingPrice - totalMonoBaseCost);

  // Handler: Apply Global Margin to Base Price and Auto-calculate option delta addPrices
  const handleApplyGlobalMargin = (margin: number) => {
    setTargetMarginPercent(margin);
    const factor = Math.max(0.05, 1 - margin / 100);
    const newBase = Math.round(primaryTotalBaseCost / factor);
    setBasePrice(newBase);

    // Synchronize addPrice deltas across all spec groups
    setSpecGroups(prev => {
      return prev.map(group => {
        const isPrintGroup = group.id === 'group_print_mode' || group.groupType === 'printing_mode';
        const defaultOpt = group.options.find(o => o.isDefault) || group.options[0];
        const defaultCost = Number(defaultOpt?.extraCostRate || (isPrintGroup ? (defaultOptionIsColor ? colorPrintUnitCost : monoPrintUnitCost) : 0));

        const updatedOptions = group.options.map(opt => {
          const isColor = opt.value === 'cmyk_4c' || opt.labelLo?.includes('ສີ') || opt.label?.toLowerCase().includes('color');
          const isMono = opt.value === 'mono_k' || opt.labelLo?.includes('ຂາວດຳ') || opt.label?.toLowerCase().includes('mono');
          
          let optCost = Number(opt.extraCostRate || 0);
          if (isPrintGroup && !optCost) {
            optCost = isColor ? colorPrintUnitCost : (isMono ? monoPrintUnitCost : colorPrintUnitCost);
          }

          const costDelta = optCost - defaultCost;
          const sellingDelta = Math.round(costDelta / factor);

          return {
            ...opt,
            extraCostRate: optCost,
            addPrice: sellingDelta,
          };
        });

        return {
          ...group,
          options: updatedOptions,
        };
      });
    });

    showToast(`ປັບອັດຕາກຳໄລເປັນ ${margin}% ແລະ ຄິດໄລ່ລາຄາຂາຍ (ສີ: ${suggestedColorSellingPrice.toLocaleString()} ₭ | ຂາວດຳ: ${suggestedMonoSellingPrice.toLocaleString()} ₭) ສຳເລັດ`, 'success');
  };

  // Auto sync base price if uninitialized (0)
  React.useEffect(() => {
    if (basePrice === 0 && suggestedPrimarySellingPrice > 0) {
      setBasePrice(suggestedPrimarySellingPrice);
    }
  }, [basePrice, suggestedPrimarySellingPrice, setBasePrice]);

  const [previewColorMode, setPreviewColorMode] = useState<'color' | 'mono'>(defaultOptionIsColor ? 'color' : 'mono');
  const [previewQuantity, setPreviewQuantity] = useState<number>(1);

  // Breakdown Mode & Custom Formula State
  const defaultCustomRows: CustomBreakdownRow[] = [
    {
      id: 'row_print_paper',
      titleLo: 'ຄ່າພິມ + ເນື້ອເຈ້ຍ (Print & Paper Rate)',
      titleEn: 'Print & Paper Rate',
      includePrintCost: true,
      includeMaterialCost: true,
      includeFinishingCost: false,
      extraFixedCost: 0,
    },
    ...(finishingUnitCost > 0 ? [{
      id: 'row_finishing',
      titleLo: 'ຄ່າງານຫຼັງພິມ & ຕັດແຕ່ງ (Finishing & Cutting)',
      titleEn: 'Finishing & Cutting',
      includePrintCost: false,
      includeMaterialCost: false,
      includeFinishingCost: true,
      extraFixedCost: 0,
    }] : [])
  ];

  const breakdownMode = featuresConfig?.breakdownMode || 'auto';
  const setBreakdownMode = (mode: 'auto' | 'custom') => {
    if (setFeaturesConfig) {
      setFeaturesConfig(prev => {
        const rows = (prev.customBreakdownRows && prev.customBreakdownRows.length > 0)
          ? prev.customBreakdownRows
          : defaultCustomRows;
        return {
          ...prev,
          breakdownMode: mode,
          customBreakdownRows: rows,
        };
      });
    }
  };

  const customBreakdownRows: CustomBreakdownRow[] = featuresConfig?.customBreakdownRows && featuresConfig.customBreakdownRows.length > 0
    ? featuresConfig.customBreakdownRows
    : defaultCustomRows;

  const handleUpdateCustomRow = (idx: number, updates: Partial<CustomBreakdownRow>) => {
    if (setFeaturesConfig) {
      setFeaturesConfig(prev => {
        const rows = [...(prev.customBreakdownRows && prev.customBreakdownRows.length > 0 ? prev.customBreakdownRows : defaultCustomRows)];
        rows[idx] = { ...rows[idx], ...updates };
        return {
          ...prev,
          customBreakdownRows: rows,
        };
      });
    }
  };

  const handleAddCustomRow = () => {
    if (setFeaturesConfig) {
      setFeaturesConfig(prev => {
        const rows = [...(prev.customBreakdownRows && prev.customBreakdownRows.length > 0 ? prev.customBreakdownRows : defaultCustomRows)];
        rows.push({
          id: `custom_row_${Date.now() % 10000}`,
          titleLo: 'ລາຍການບໍລິການໃໝ່ (Custom Service)',
          titleEn: 'Custom Service',
          includePrintCost: false,
          includeMaterialCost: false,
          includeFinishingCost: false,
          extraFixedCost: 0,
        });
        return {
          ...prev,
          breakdownMode: 'custom',
          customBreakdownRows: rows,
        };
      });
      showToast('ເພີ່ມລາຍການບໍລິການແບບກຳນົດເອງຮຽບຮ້ອຍ', 'success');
    }
  };

  const handleRemoveCustomRow = (idx: number) => {
    if (setFeaturesConfig) {
      setFeaturesConfig(prev => {
        const rows = [...(prev.customBreakdownRows && prev.customBreakdownRows.length > 0 ? prev.customBreakdownRows : defaultCustomRows)].filter((_, i) => i !== idx);
        return {
          ...prev,
          customBreakdownRows: rows,
        };
      });
    }
  };

  const loadCombinedPreset = () => {
    if (setFeaturesConfig) {
      setFeaturesConfig(prev => ({
        ...prev,
        breakdownMode: 'custom',
        customBreakdownRows: [
          {
            id: 'row_print_paper',
            titleLo: 'ຄ່າພິມ + ເນື້ອເຈ້ຍຕໍ່ໜ້າ (Print & Paper Rate)',
            titleEn: 'Print & Paper Rate',
            includePrintCost: true,
            includeMaterialCost: true,
            includeFinishingCost: false,
            extraFixedCost: 0,
          },
          ...(finishingUnitCost > 0 ? [{
            id: 'row_finishing',
            titleLo: 'ຄ່າງານຫຼັງພິມ & ຕັດແຕ່ງ (Finishing & Cutting)',
            titleEn: 'Finishing & Cutting',
            includePrintCost: false,
            includeMaterialCost: false,
            includeFinishingCost: true,
            extraFixedCost: 0,
          }] : [])
        ],
      }));
      showToast('ໂຫຼດສູດ: ລວມຄ່າພິມ + ເນື້ອເຈ້ຍສຳເລັດ', 'info');
    }
  };

  // Dynamic Toggles State
  const [enableDiscounts, setEnableDiscounts] = useState<boolean>(discountTiers.length > 0);
  const [enableInfoTabs, setEnableInfoTabs] = useState<boolean>(infoTabs.length > 0);

  // Toggle Volume Tier Discounts
  const handleToggleDiscounts = (enabled: boolean) => {
    setEnableDiscounts(enabled);
    if (!enabled) {
      setDiscountTiers([]);
      showToast('ປິດການໃຊ້ງານສ່ວນຫຼຸດຕາມຈຳນວນ (ຂາຍລາຄາດຽວ)', 'info');
    } else {
      loadWholesalePreset();
    }
  };

  // Toggle Product Information Tabs
  const handleToggleInfoTabs = (enabled: boolean) => {
    setEnableInfoTabs(enabled);
    if (!enabled) {
      setInfoTabs([]);
      showToast('ປິດການສະແດງແທັບຂໍ້ມູນເພີ່ມເຕີມ', 'info');
    } else {
      loadPresetTabs();
    }
  };

  // Add Discount Tier
  const handleAddTier = () => {
    if (!enableDiscounts) setEnableDiscounts(true);
    const lastQty = discountTiers.length > 0 ? discountTiers[discountTiers.length - 1].minQuantity : 100;
    const lastDisc = discountTiers.length > 0 ? discountTiers[discountTiers.length - 1].discountPercentage : 5;
    
    setDiscountTiers(prev => [
      ...prev,
      { minQuantity: lastQty * 2, discountPercentage: Math.min(60, lastDisc + 5) }
    ]);
    showToast('ເພີ່ມຂັ້ນສ່ວນຫຼຸດຮຽບຮ້ອຍ', 'success');
  };

  // Remove Discount Tier
  const handleRemoveTier = (idx: number) => {
    setDiscountTiers(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length === 0) setEnableDiscounts(false);
      return next;
    });
  };

  // Update Tier Field
  const handleUpdateTier = (idx: number, field: keyof ProductDiscountTier, val: number) => {
    setDiscountTiers(prev => {
      const next = [...prev];
      let clampedVal = val;
      if (field === 'minQuantity') {
        clampedVal = Math.max(1, Math.round(val || 1));
      } else if (field === 'discountPercentage') {
        clampedVal = Math.max(0, Math.min(100, val || 0));
      }
      next[idx] = { ...next[idx], [field]: clampedVal };
      return next;
    });
  };

  // Load Wholesale Preset Tiers
  const loadWholesalePreset = () => {
    setEnableDiscounts(true);
    setDiscountTiers([
      { minQuantity: 100, discountPercentage: 5 },
      { minQuantity: 300, discountPercentage: 10 },
      { minQuantity: 500, discountPercentage: 15 },
      { minQuantity: 1000, discountPercentage: 20 },
      { minQuantity: 5000, discountPercentage: 30 },
    ]);
    showToast('ໂຫຼດຂັ້ນສ່ວນຫຼຸດຂາຍສົ່ງສຳເລັດ', 'info');
  };

  // Add Custom Info Tab
  const handleAddInfoTab = () => {
    if (!enableInfoTabs) setEnableInfoTabs(true);
    const newTab: ProductInfoTab = {
      id: `tab_${Date.now() % 10000}`,
      titleLo: 'ແທັບຂໍ້ມູນໃໝ່ (Custom Tab)',
      titleEn: 'Custom Info Tab',
      icon: '📌',
      contentLo: 'ເນື້ອໃນລາຍລະອຽດຂໍ້ມູນສິນຄ້າ (ພາສາລາວ)...',
      contentEn: 'Detailed product information (English)...',
    };
    setInfoTabs(prev => [...prev, newTab]);
    showToast('ເພີ່ມແທັບຂໍ້ມູນສຳເລັດ', 'success');
  };

  // Remove Info Tab
  const handleRemoveInfoTab = (idx: number) => {
    setInfoTabs(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length === 0) setEnableInfoTabs(false);
      return next;
    });
  };

  // Update Info Tab Field
  const handleUpdateInfoTab = (idx: number, field: keyof ProductInfoTab, val: string) => {
    setInfoTabs(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  // Load Preset Default Tabs
  const loadPresetTabs = () => {
    setEnableInfoTabs(true);
    setInfoTabs(DEFAULT_PRESET_TABS);
    showToast('ໂຫຼດ 4 ແທັບຂໍ້ມູນມາດຕະຖານສຳເລັດ', 'info');
  };

  return (
    <div className="space-y-8">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 bg-white border border-slate-100 rounded-3xl shadow-sm text-slate-800">
        <div className="space-y-1">
          <h2 className="text-base font-black flex items-center gap-2 text-slate-900">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
            <span>ຂັ້ນຕອນທີ 5: ສັງລວມຕົ້ນທຶນການຜະລິດ, ກຳນົດກຳໄລ & ສ່ວນຫຼຸດ (Pricing & Cost Hub)</span>
          </h2>
          <p className="text-xs text-slate-500">
            ສັງລວມຕົ້ນທຶນຕົວຈິງແຍກ <strong>2 ກໍລະນີ: ພິມສີ vs ພິມຂາວດຳ</strong> ພ້ອມຄິດໄລ່ລາຄາຂາຍ Margin {targetMarginPercent}% (Coverage {baselineCoveragePercent}%)
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-mono font-bold">
            🎨 ສີ: {formatLAK(totalColorBaseCost)} | 📄 ຂາວດຳ: {formatLAK(totalMonoBaseCost)}
          </span>
        </div>
      </div>

      {/* SECTION 1: MASTER PRODUCTION COST BREAKDOWN */}
      <div className="p-6 sm:p-8 bg-white border border-slate-100 rounded-3xl space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>1. ຕາຕະລາງສັງລວມຕົ້ນທຶນການຜະລິດພື້ນຖານ (Master Production Cost Breakdown)</span>
            </h3>
            <p className="text-xs text-slate-500">
              ສັງລວມຕົ້ນທຶນພື້ນຖານຕໍ່ແຜ່ນ/ຊິ້ນ ແຍກຕາມເຄື່ອງພິມສີ vs ຂາວດຳ, ເຈ້ຍຕັ້ງຕົ້ນ ແລະ ງານຫຼັງພິມ
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleApplyGlobalMargin(targetMarginPercent)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black transition shadow-md shadow-accent-sky/20 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ຄິດໄລ່ລາຄາຂາຍ & ຕົວເລືອກໃໝ່ (Recalculate)</span>
          </button>
        </div>

        {/* 3-Pillar Cost Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Pillar 1: Print Engine Cost (Guaranteed Dual Color & Mono Display) */}
          <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-black text-sky-700">
                <Printer className="w-4 h-4" />
                <span>ຄ່າພິມ (Print Engines)</span>
              </span>
              <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-[10px] font-mono font-bold rounded-md">
                Step 2 ({baselineCoveragePercent}% Cov)
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-800 block truncate">{defaultMachineName}</span>
              <span className="text-[11px] text-slate-400 font-mono block">ID: {defaultMachineId}</span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/80">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 flex items-center gap-1">
                  <span>🎨</span>
                  <span>ພິມ 4 ສີ:</span>
                </span>
                <span className="font-mono font-bold text-sky-700">
                  {colorPrintUnitCost.toLocaleString()} ₭
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 flex items-center gap-1">
                  <span>📄</span>
                  <span>ພິມຂາວດຳ:</span>
                </span>
                <span className="font-mono font-bold text-slate-600">
                  {monoPrintUnitCost.toLocaleString()} ₭
                </span>
              </div>
            </div>
          </div>

          {/* Pillar 2: Material Cost */}
          <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-black text-emerald-700">
                <Package className="w-4 h-4" />
                <span>ຄ່າວັດສະດຸ/ເຈ້ຍ (Material)</span>
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-mono font-bold rounded-md">
                Step 3
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-800 block truncate">
                {defaultMaterialItems.length > 0
                  ? defaultMaterialItems.map(m => m.optionLabel).join(' + ')
                  : 'ເຈ້ຍມາດຕະຖານ'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono block">
                {defaultMaterialItems.length > 0
                  ? `${defaultMaterialItems.length} ກຸ່ມວັດສະດຸ (${defaultMaterialItems.map(m => m.groupTitle).join(', ')})`
                  : 'Default Paper Stock'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
              <span className="text-xs text-slate-600 font-bold">ຕົ້ນທຶນເຈ້ຍ/ແຜ່ນ:</span>
              <span className="text-sm font-mono font-black text-emerald-700">
                {materialUnitCost.toLocaleString()} ₭
              </span>
            </div>
          </div>

          {/* Pillar 3: Finishing Cost */}
          <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-black text-purple-700">
                <Scissors className="w-4 h-4" />
                <span>ຄ່າງານຕັດ/ຫຼັງພິມ (Finishing)</span>
              </span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-mono font-bold rounded-md">
                Step 4
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-800 block truncate">
                {finishingItems.length > 0 ? finishingItems.map(i => i.optionLabel).join(', ') : 'ບໍ່ມີງານຫຼັງພິມ'}
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                {finishingItems.length > 0 ? `${finishingItems.length} ຂະບວນການຫຼັງພິມ` : 'Direct Output / Standard'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
              <span className="text-xs text-slate-600 font-bold">ຕົ້ນທຶນຫຼັງພິມ/ແຜ່ນ:</span>
              <span className="text-sm font-mono font-black text-purple-700">
                {finishingUnitCost.toLocaleString()} ₭
              </span>
            </div>
          </div>

        </div>

        {/* Total Production Cost Summary Bar (Split Color vs Mono) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Color Total Cost */}
          <div className="p-5 bg-sky-50/80 text-slate-900 rounded-2xl border border-sky-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎨</span>
              <div>
                <span className="text-xs font-black text-sky-900 uppercase tracking-wider block">
                  ຕົ້ນທຶນການຜະລິດລວມ (ກໍລະນີພິມ 4 ສີ):
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  (ພິມ {colorPrintUnitCost.toLocaleString()} + ເຈ້ຍ {materialUnitCost.toLocaleString()} + ຫຼັງພິມ {finishingUnitCost.toLocaleString()} ₭)
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-black font-mono text-sky-700">
                {totalColorBaseCost.toLocaleString()} ₭
              </span>
              <span className="text-[10px] text-slate-400 block">/ແຜ່ນ</span>
            </div>
          </div>

          {/* Mono Total Cost */}
          <div className="p-5 bg-slate-50 text-slate-900 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📄</span>
              <div>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                  ຕົ້ນທຶນການຜະລິດລວມ (ກໍລະນີພິມຂາວດຳ):
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  (ພິມ {monoPrintUnitCost.toLocaleString()} + ເຈ້ຍ {materialUnitCost.toLocaleString()} + ຫຼັງພິມ {finishingUnitCost.toLocaleString()} ₭)
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-black font-mono text-slate-700">
                {totalMonoBaseCost.toLocaleString()} ₭
              </span>
              <span className="text-[10px] text-slate-400 block">/ແຜ່ນ</span>
            </div>
          </div>
        </div>

        {/* Global Profit Margin Simulator Card (Dual Color & Mono Result) */}
        <div className="p-6 bg-emerald-50/40 border-2 border-emerald-500/30 rounded-3xl space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-600" />
                <span>ກຳນົດອັດຕາກຳໄລເປົ້າໝາຍສິນຄ້າ (Target Profit Margin %):</span>
                <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded-lg text-xs font-mono font-bold">
                  {targetMarginPercent}%
                </span>
              </h4>
              <p className="text-xs text-slate-600">
                ສູດຄິດໄລ່ລາຄາຂາຍ: <code className="text-emerald-700 font-mono font-bold">ລາຄາຂາຍ = ຕົ້ນທຶນລວມ ÷ (1 - {targetMarginPercent}%)</code>
              </p>
            </div>

            {/* Margin Preset Pills */}
            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
              {[20, 25, 30, 35, 40, 50].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleApplyGlobalMargin(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                    targetMarginPercent === m
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {m}%
                </button>
              ))}
              <div className="flex items-center pl-1 pr-1">
                <input
                  type="number"
                  min={5}
                  max={90}
                  value={targetMarginPercent}
                  onChange={(e) => handleApplyGlobalMargin(Math.max(5, Math.min(90, parseInt(e.target.value, 10) || 35)))}
                  className="w-12 px-1.5 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-center text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Dual Pricing Result Cards (Color vs Mono) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            
            {/* Color Selling Price Card */}
            <div className="p-4 bg-sky-600 text-white rounded-2xl space-y-2 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-100 flex items-center gap-1.5">
                  <span>🎨</span>
                  <span>1. ລາຄາຂາຍພິມ 4 ສີ (Color Selling Price)</span>
                </span>
                <span className="px-2 py-0.5 bg-white/20 rounded-md text-[10px] font-mono font-bold">
                  Margin {targetMarginPercent}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-mono font-black tracking-tight">
                  {suggestedColorSellingPrice.toLocaleString()} ₭
                </span>
                <span className="text-xs font-mono text-emerald-200 font-bold">
                  (ກຳໄລ +{colorUnitProfit.toLocaleString()} ₭)
                </span>
              </div>
              <div className="text-[10px] text-sky-100 font-mono pt-1 border-t border-white/15 flex justify-between">
                <span>ຕົ້ນທຶນ: {totalColorBaseCost.toLocaleString()} ₭</span>
                <span>{defaultOptionIsColor ? '✓ ເປັນລາຄາເລີ່ມຕົ້ນ (Base)' : `ສ່ວນຕ່າງ +${Math.max(0, suggestedColorSellingPrice - suggestedMonoSellingPrice).toLocaleString()} ₭`}</span>
              </div>
            </div>

            {/* Mono Selling Price Card */}
            <div className="p-4 bg-slate-800 text-white rounded-2xl space-y-2 shadow-md border border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <span>📄</span>
                  <span>2. ລາຄາຂາຍພິມຂາວດຳ (Mono Selling Price)</span>
                </span>
                <span className="px-2 py-0.5 bg-white/10 rounded-md text-[10px] font-mono font-bold">
                  Margin {targetMarginPercent}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-mono font-black tracking-tight text-white">
                  {suggestedMonoSellingPrice.toLocaleString()} ₭
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  (ກຳໄລ +{monoUnitProfit.toLocaleString()} ₭)
                </span>
              </div>
              <div className="text-[10px] text-slate-300 font-mono pt-1 border-t border-slate-700 flex justify-between">
                <span>ຕົ້ນທຶນ: {totalMonoBaseCost.toLocaleString()} ₭</span>
                <span>{!defaultOptionIsColor ? '✓ ເປັນລາຄາເລີ່ມຕົ້ນ (Base)' : `ສ່ວນຕ່າງ -${Math.max(0, suggestedColorSellingPrice - suggestedMonoSellingPrice).toLocaleString()} ₭`}</span>
              </div>
            </div>

          </div>

          {/* Sync Status Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ລາຄາຂາຍນີ້ຈະຖືກນຳໄປໃຊ້ເປັນລາຄາເລີ່ມຕົ້ນ (Base Price: {suggestedPrimarySellingPrice.toLocaleString()} ₭) ແລະ ຄິດໄລ່ສ່ວນຕ່າງຕົວເລືອກໃຫ້ອັດຕະໂນມັດ</span>
            </div>

            <button
              type="button"
              onClick={() => handleApplyGlobalMargin(targetMarginPercent)}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>ບັນທຶກລາຄານີ້ ({suggestedPrimarySellingPrice.toLocaleString()} ₭)</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: LIVE CUSTOMER QUOTATION BREAKDOWN TABLE & SELLING RATES */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-3xl space-y-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-500" />
              <span>2. ຕາຕະລາງສະຫຼຸບລາຄາຄ່າບໍລິການໃຫ້ກັບລູກຄ້າ (Customer Quotation Breakdown & Selling Rates)</span>
            </h3>
            <p className="text-xs text-slate-500">
              ເລືອກຮູບແບບການສະແດງລາຍການບໍລິການໃນໜ້າເວັບລູກຄ້າ (ແຍກອັດຕະໂນມັດ ຫຼື ກຳນົດສູດ & ຊື່ເອງ)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Mode Switcher: Auto vs Custom */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setBreakdownMode('auto')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  breakdownMode === 'auto'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🟢 ມາດຕະຖານ (Auto)</span>
              </button>
              <button
                type="button"
                onClick={() => setBreakdownMode('custom')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  breakdownMode === 'custom'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🟣 ກຳນົດສູດເອງ (Custom)</span>
              </button>
            </div>

            {/* Color Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setPreviewColorMode('color')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  previewColorMode === 'color'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🎨 ສີ 4C</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewColorMode('mono')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  previewColorMode === 'mono'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📄 ຂາວດຳ K</span>
              </button>
            </div>

            {/* Quantity Picker */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500">ຈຳນວນ:</span>
              <select
                value={previewQuantity}
                onChange={(e) => setPreviewQuantity(parseInt(e.target.value, 10) || 1)}
                className="bg-transparent text-xs font-mono font-bold text-slate-800 outline-none cursor-pointer"
              >
                {[1, 10, 50, 100, 300, 500, 1000].map((q) => (
                  <option key={q} value={q} className="bg-white">
                    {q} ຊິ້ນ
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* CUSTOM MODE TOOLBAR & PRESETS */}
        {breakdownMode === 'custom' && (
          <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                <span>⚙️</span>
                <span>ໂໝດກຳນົດສູດ & ຕັ້ງຊື່ລາຍການເອງ (Custom Breakdown Engine)</span>
              </span>
              <p className="text-[11px] text-slate-600">
                ທ່ານສາມາດຕັ້ງຊື່ລາຍການ ແລະ ຕິກເລືອກຕົ້ນທຶນ (ພິມ + ເຈ້ຍ + ງານຕັດ) ທີ່ຈະນຳມາບວກລວມກັນໃນແຕ່ລະແຖວໄດ້ຢ່າງອິດສະຫຼະ
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadCombinedPreset}
                className="px-3 py-1.5 bg-white border border-sky-200 text-sky-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer hover:bg-sky-50"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>ສູດລວມ: ພິມ+ເຈ້ຍ</span>
              </button>

              <button
                type="button"
                onClick={handleAddCustomRow}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ເພີ່ມລາຍການໃໝ່</span>
              </button>
            </div>
          </div>
        )}

        {/* BREAKDOWN TABLE: AUTO MODE */}
        {breakdownMode === 'auto' ? (
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10.5px]">
                    <th className="py-3 px-4 font-bold">ລາຍການບໍລິການ (Service Item)</th>
                    <th className="py-3 px-4 font-bold text-center">ສເປັກທີ່ເລືອກ (Specification)</th>
                    <th className="py-3 px-4 font-bold text-right">ຕົ້ນທຶນຕົວຈິງ (Cost)</th>
                    <th className="py-3 px-4 font-bold text-right">ລາຄາຂາຍ/ໜ່ວຍ (Selling Rate)</th>
                    <th className="py-3 px-4 font-bold text-right">ຈຳນວນ (Qty)</th>
                    <th className="py-3 px-4 font-bold text-right">ລວມມູນຄ່າ (Subtotal)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Row 1: Print Engine Service Rate */}
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex flex-col">
                        <span className="text-xs font-black">
                          {previewColorMode === 'color' ? '🎨 ຄ່າພິມ 4 ສີ (Color Print Service)' : '📄 ຄ່າພິມຂາວດຳ (Mono Print Service)'}
                        </span>
                        <span className="text-[10.5px] text-slate-500">
                          (Coverage {baselineCoveragePercent}% · {previewColorMode === 'color' ? 'CMYK Full Color' : 'Monochrome Grayscale'})
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full font-mono text-[11px] font-bold ${
                        previewColorMode === 'color'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {previewColorMode === 'color' ? '🌈 ພິມ 4 ສີ (CMYK)' : '⚫ ພິມຂາວ-ດຳ (Mono K)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      {(previewColorMode === 'color' ? colorPrintUnitCost : monoPrintUnitCost).toLocaleString()} ₭
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sky-700">
                      {Math.round((previewColorMode === 'color' ? colorPrintUnitCost : monoPrintUnitCost) / marginFactor).toLocaleString()} ₭
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {previewQuantity} ຊິ້ນ
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold font-mono text-slate-900">
                      {(Math.round((previewColorMode === 'color' ? colorPrintUnitCost : monoPrintUnitCost) / marginFactor) * previewQuantity).toLocaleString()} ₭
                    </td>
                  </tr>

                  {/* Material / Paper Groups Rates (Dynamic N Groups) */}
                  {defaultMaterialItems.map((mat, idx) => (
                    <tr key={mat.groupId || idx}>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex flex-col">
                          <span className="text-xs font-black">📄 {mat.groupTitle}</span>
                          <span className="text-[10.5px] text-slate-500">
                            ({mat.optionLabel})
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-full font-mono text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {mat.optionLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {mat.cost.toLocaleString()} ₭
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {Math.round(mat.cost / marginFactor).toLocaleString()} ₭
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {previewQuantity} ຊິ້ນ
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold font-mono text-slate-900">
                        {(Math.round(mat.cost / marginFactor) * previewQuantity).toLocaleString()} ₭
                      </td>
                    </tr>
                  ))}

                  {/* Finishing / Post-press Rates (Dynamic N Groups) */}
                  {finishingItems.map((fin, idx) => (
                    <tr key={fin.groupId || idx}>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex flex-col">
                          <span className="text-xs font-black">✂️ {fin.groupTitle}</span>
                          <span className="text-[10.5px] text-slate-500">
                            ({fin.optionLabel})
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-full font-mono text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {fin.optionLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {fin.cost > 0 ? `${fin.cost.toLocaleString()} ₭` : '0 ₭'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-purple-700">
                        {fin.cost > 0 ? `${Math.round(fin.cost / marginFactor).toLocaleString()} ₭` : <span className="text-emerald-600 font-sans font-bold">✓ ຟຣີ / ລວມໃນຊຸດ</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {previewQuantity} ຊິ້ນ
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold font-mono text-slate-900">
                        {fin.cost > 0 ? `${(Math.round(fin.cost / marginFactor) * previewQuantity).toLocaleString()} ₭` : <span className="text-emerald-600 font-sans font-bold">✓ ຟຣີ</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quotation Preview Footer Banner */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ລາຄາຂາຍສະເລ່ຍຕໍ່ໜ່ວຍ (Unit Selling Rate):</span>
                  <strong className="font-mono text-emerald-700">
                    {(previewColorMode === 'color' ? suggestedColorSellingPrice : suggestedMonoSellingPrice).toLocaleString()} ₭ / ແຜ່ນ
                  </strong>
                </span>
                <p className="text-[11px] text-slate-500 m-0">
                  (ຕົ້ນທຶນຕົວຈິງ: {(previewColorMode === 'color' ? totalColorBaseCost : totalMonoBaseCost).toLocaleString()} ₭ + ກຳໄລ {targetMarginPercent}%: +{(previewColorMode === 'color' ? colorUnitProfit : monoUnitProfit).toLocaleString()} ₭)
                </p>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ຍອດລວມສະຫຼຸບ ({previewQuantity} ຊິ້ນ):
                </span>
                <span className="text-2xl font-black text-amber-600 font-mono">
                  {((previewColorMode === 'color' ? suggestedColorSellingPrice : suggestedMonoSellingPrice) * previewQuantity).toLocaleString()} ₭
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* BREAKDOWN TABLE: CUSTOM FORMULA MODE */
          <div className="border border-slate-200 rounded-2xl overflow-hidden space-y-4 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10.5px]">
                    <th className="py-3 px-4 font-bold">ຊື່ລາຍການບໍລິການ (Custom Title)</th>
                    <th className="py-3 px-4 font-bold text-center">ສູດຕົ້ນທຶນທີ່ນຳມາບວກລວມ (Cost Components)</th>
                    <th className="py-3 px-4 font-bold text-right">ຕົ້ນທຶນຈິງ (Cost)</th>
                    <th className="py-3 px-4 font-bold text-right">ລາຄາຂາຍ/ໜ່ວຍ (+Margin {targetMarginPercent}%)</th>
                    <th className="py-3 px-4 font-bold text-right">ລວມ ({previewQuantity} pcs)</th>
                    <th className="py-3 px-4 font-bold text-center">ຈັດການ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customBreakdownRows.map((row, idx) => {
                    const printCost = previewColorMode === 'color' ? colorPrintUnitCost : monoPrintUnitCost;
                    const rowCost = 
                      (row.includePrintCost ? printCost : 0) +
                      (row.includeMaterialCost ? materialUnitCost : 0) +
                      (row.includeFinishingCost ? finishingUnitCost : 0) +
                      Number(row.extraFixedCost || 0);
                    
                    const rowSellingPrice = Math.round(rowCost / marginFactor);

                    return (
                      <tr key={row.id || idx} className="hover:bg-slate-50/50 transition">
                        {/* Title Input */}
                        <td className="py-3.5 px-4 font-bold min-w-[220px]">
                          <input
                            type="text"
                            value={row.titleLo}
                            onChange={(e) => handleUpdateCustomRow(idx, { titleLo: e.target.value })}
                            placeholder="ຊື່ລາຍການ (ພາສາລາວ)..."
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                          />
                          <input
                            type="text"
                            value={row.titleEn || ''}
                            onChange={(e) => handleUpdateCustomRow(idx, { titleEn: e.target.value })}
                            placeholder="English Title (optional)..."
                            className="w-full px-2.5 py-1 mt-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                          />
                        </td>

                        {/* Components Checkboxes */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <label className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                              row.includePrintCost 
                                ? 'bg-sky-50 text-sky-800 border border-sky-300' 
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              <input
                                type="checkbox"
                                checked={row.includePrintCost}
                                onChange={(e) => handleUpdateCustomRow(idx, { includePrintCost: e.target.checked })}
                                className="rounded text-sky-600 focus:ring-0"
                              />
                              <span>🎨 ຄ່າພິມ ({printCost.toLocaleString()}₭)</span>
                            </label>

                            <label className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                              row.includeMaterialCost 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              <input
                                type="checkbox"
                                checked={row.includeMaterialCost}
                                onChange={(e) => handleUpdateCustomRow(idx, { includeMaterialCost: e.target.checked })}
                                className="rounded text-emerald-600 focus:ring-0"
                              />
                              <span>📄 ຄ່າເຈ້ຍ ({materialUnitCost.toLocaleString()}₭)</span>
                            </label>

                            <label className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                              row.includeFinishingCost 
                                ? 'bg-purple-50 text-purple-800 border border-purple-300' 
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              <input
                                type="checkbox"
                                checked={row.includeFinishingCost}
                                onChange={(e) => handleUpdateCustomRow(idx, { includeFinishingCost: e.target.checked })}
                                className="rounded text-purple-600 focus:ring-0"
                              />
                              <span>✂️ ຄ່າງານຕັດ ({finishingUnitCost.toLocaleString()}₭)</span>
                            </label>
                          </div>
                        </td>

                        {/* Real Cost */}
                        <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                          {rowCost.toLocaleString()} ₭
                        </td>

                        {/* Unit Selling Price */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-sky-700">
                          {rowSellingPrice.toLocaleString()} ₭
                        </td>

                        {/* Subtotal */}
                        <td className="py-3.5 px-4 text-right font-bold font-mono text-slate-900">
                          {(rowSellingPrice * previewQuantity).toLocaleString()} ₭
                        </td>

                        {/* Action Delete */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomRow(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="ລຶບລາຍການນີ້"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Custom Mode Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                <span>ລວມທັງໝົດ <strong>{customBreakdownRows.length}</strong> ລາຍການບໍລິການທີ່ກຳນົດເອງ</span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ລາຄາຂາຍລວມຕໍ່ແຜ່ນ:
                </span>
                <span className="text-2xl font-black text-sky-700 font-mono">
                  {customBreakdownRows.reduce((sum, r) => {
                    const printCost = previewColorMode === 'color' ? colorPrintUnitCost : monoPrintUnitCost;
                    const rCost = (r.includePrintCost ? printCost : 0) + (r.includeMaterialCost ? materialUnitCost : 0) + (r.includeFinishingCost ? finishingUnitCost : 0) + Number(r.extraFixedCost || 0);
                    return sum + Math.round(rCost / marginFactor);
                  }, 0).toLocaleString()} ₭
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2.5: MINIMUM ORDER QUANTITY (MOQ) */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-3xl space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>ຈຳນວນສັ່ງຂັ້ນຕ່ຳ (Minimum Order Quantity - MOQ)</span>
            </h3>
            <p className="text-xs text-slate-500">
              ກຳນົດວ່າສິນຄ້ານີ້ມີຈຳນວນຂັ້ນຕ່ຳໃນການສັ່ງຊື້ຫຼືບໍ່ (ເຊັ່ນ: ນາມບັດຂັ້ນຕ່ຳ 100 ໃບ, ສະຕິກເກີ 50 ດວງ; ຫຼື ບໍ່ມີຂັ້ນຕ່ຳເລີ່ມ 1 ຊິ້ນ)
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => {
                if (setMinQuantity) setMinQuantity(1);
                showToast('ຕັ້ງເປັນບໍ່ມີຂັ້ນຕ່ຳ (ເລີ່ມ 1 ຊິ້ນ)', 'info');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                minQuantity <= 1
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>ບໍ່ມີຂັ້ນຕ່ຳ (ເລີ່ມ 1 ຊິ້ນ)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (setMinQuantity) setMinQuantity(minQuantity > 1 ? minQuantity : 50);
                showToast('ເປີດກຳນົດຈຳນວນຂັ້ນຕ່ຳ (MOQ)', 'success');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                minQuantity > 1
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>ກຳນົດຂັ້ນຕ່ຳ (MOQ)</span>
            </button>
          </div>
        </div>

        {minQuantity > 1 && (
          <div className="flex items-center gap-3 p-4 bg-sky-50/50 border border-sky-200 rounded-2xl">
            <span className="text-xs font-bold text-slate-700">
              ລະບຸຈຳນວນຂັ້ນຕ່ຳຕໍ່ 1 ອໍເດີ:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={minQuantity}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  if (setMinQuantity) setMinQuantity(val);
                }}
                className="w-28 px-3 py-1.5 text-sm font-mono font-bold bg-white border border-sky-300 rounded-xl text-sky-700 text-center focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
              />
              <span className="text-xs font-bold text-slate-500">ຊິ້ນ / ແຜ່ນ</span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: VOLUME TIER DISCOUNTS */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-3xl space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-sky-600" />
              <span>3. ສ່ວນຫຼຸດຕາມຈຳນວນສັ່ງພິມ (Volume Tier Discounts)</span>
            </h3>
            <p className="text-xs text-slate-500">
              {enableDiscounts 
                ? `ລະບົບຈະຄິດໄລ່ຫຼຸດລາຄາອັດຕະໂນມັດເມື່ອລູກຄ້າສັ່ງຮອດຈຳນວນທີ່ກຳນົດ ໂດຍຄິດໄລ່ຈາກລາຄາຂາຍ ${basePrice.toLocaleString()} ₭`
                : 'ສິນຄ້ານີ້ກຳນົດຂາຍລາຄາດຽວ ບໍ່ມີສ່ວນຫຼຸດຕາມຈຳນວນ'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Dynamic Enable / Disable Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => handleToggleDiscounts(true)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  enableDiscounts
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>ມີສ່ວນຫຼຸດ</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleDiscounts(false)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  !enableDiscounts
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>ບໍ່ມີສ່ວນຫຼຸດ</span>
              </button>
            </div>

            {enableDiscounts && (
              <>
                <button
                  type="button"
                  onClick={loadWholesalePreset}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>ໂຫຼດຂັ້ນມາດຕະຖານ</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddTier}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ເພີ່ມຂັ້ນສ່ວນຫຼຸດ</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tier Discount Cards / Table */}
        {!enableDiscounts || discountTiers.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
            <span className="text-2xl block">🏷️</span>
            <span className="text-xs font-bold text-slate-700 block">
              ສິນຄ້ານີ້ບໍ່ມີສ່ວນຫຼຸດຕາມຈຳນວນ (Flat Standard Pricing)
            </span>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              ລາຄາຂາຍຈະຄົງທີ່ {basePrice.toLocaleString()} ₭/ແຜ່ນ ທຸກຈຳນວນສັ່ງພິມ. ຖ້າຕ້ອງການຕັ້ງສ່ວນຫຼຸດຂາຍສົ່ງ ກົດປຸ່ມ <strong>"ມີສ່ວນຫຼຸດ"</strong> ດ້ານເທິງ.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {discountTiers.map((tier, idx) => {
              const discountedPrice = Math.round(basePrice * (1 - tier.discountPercentage / 100));
              const totalOrderAmount = discountedPrice * tier.minQuantity;
              const retainedProfit = Math.max(0, (discountedPrice - primaryTotalBaseCost) * tier.minQuantity);

              return (
                <div
                  key={idx}
                  className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10px] font-mono font-bold border border-sky-200">
                      Tier {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="ລຶບຂັ້ນນີ້"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">ສັ່ງຂັ້ນຕ່ຳ (Qty):</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          value={tier.minQuantity}
                          onChange={(e) => handleUpdateTier(idx, 'minQuantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-full px-2.5 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">ຫຼຸດ (%) :</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          max={90}
                          value={tier.discountPercentage}
                          onChange={(e) => handleUpdateTier(idx, 'discountPercentage', Math.max(0, Math.min(90, parseInt(e.target.value, 10) || 0)))}
                          className="w-full px-2.5 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-xl text-sky-700 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-[11px] font-mono space-y-1">
                    <div className="flex justify-between text-slate-700">
                      <span>ລາຄາຫຼັງຫຼຸດ:</span>
                      <strong className="text-emerald-700">{discountedPrice.toLocaleString()} ₭</strong>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[10px]">
                      <span>ຍອດລວມ ({tier.minQuantity} pcs):</span>
                      <span>{totalOrderAmount.toLocaleString()} ₭</span>
                    </div>
                    <div className="flex justify-between text-sky-700 text-[10px] font-bold">
                      <span>ກຳໄລລວມຄາດຄະເນ:</span>
                      <span>+{retainedProfit.toLocaleString()} ₭</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 4: PRODUCT INFORMATION TABS */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-3xl space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>4. ແທັບຂໍ້ມູນ & ລາຍລະອຽດສິນຄ້າ (Product Information Tabs)</span>
            </h3>
            <p className="text-xs text-slate-500">
              {enableInfoTabs
                ? 'ແທັບສະແດງຂໍ້ມູນເພີ່ມເຕີມໃນໜ້າເວັບ (ຄູ່ມືວັດສະດຸ, ໄລຍະຕັດຕົກ Bleed, ຮອບຈັດສົ່ງ, FAQ)'
                : 'ບໍ່ມີແທັບຂໍ້ມູນເພີ່ມເຕີມ ສະແດງສະເພາະຕົວເລືອກສິນຄ້າພື້ນຖານ'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Dynamic Enable / Disable Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => handleToggleInfoTabs(true)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  enableInfoTabs
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>ມີຂໍ້ມູນແທັບ</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleInfoTabs(false)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  !enableInfoTabs
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>ບໍ່ມີແທັບ</span>
              </button>
            </div>

            {enableInfoTabs && (
              <>
                <button
                  type="button"
                  onClick={loadPresetTabs}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>ໂຫຼດ 4 ແທັບມາດຕະຖານ</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddInfoTab}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ເພີ່ມແທັບໃໝ່</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs Editor */}
        {!enableInfoTabs || infoTabs.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
            <span className="text-2xl block">📄</span>
            <span className="text-xs font-bold text-slate-700 block">
              ບໍ່ມີແທັບຂໍ້ມູນເພີ່ມເຕີມສຳລັບສິນຄ້ານີ້
            </span>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              ໜ້າເວັບຈະບໍ່ສະແດງແທັບ Accordion/Tabs ດ້ານລຸ່ມ. ຖ້າຕ້ອງການເພີ່ມຄູ່ມືວັດສະດຸ ຫຼື FAQ ກົດປຸ່ມ <strong>"ມີຂໍ້ມູນແທັບ"</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {infoTabs.map((tab, tIdx) => (
              <div
                key={tab.id || tIdx}
                className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                    <input
                      type="text"
                      value={tab.titleLo}
                      onChange={(e) => handleUpdateInfoTab(tIdx, 'titleLo', e.target.value)}
                      placeholder="ຫົວຂໍ້ແທັບ (ລາວ) ເຊັ່ນ: 📜 ຄູ່ມືວັດສະດຸ"
                      className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                    />
                    <input
                      type="text"
                      value={tab.titleEn}
                      onChange={(e) => handleUpdateInfoTab(tIdx, 'titleEn', e.target.value)}
                      placeholder="Tab Title (EN) e.g. Specs Guide"
                      className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveInfoTab(tIdx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl transition self-end sm:self-auto cursor-pointer"
                    title="ລຶບແທັບນີ້"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <textarea
                    rows={3}
                    value={tab.contentLo}
                    onChange={(e) => handleUpdateInfoTab(tIdx, 'contentLo', e.target.value)}
                    placeholder="ເນື້ອໃນລາຍລະອຽດ (ພາສາລາວ)..."
                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 font-sans focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                  />
                  <textarea
                    rows={3}
                    value={tab.contentEn}
                    onChange={(e) => handleUpdateInfoTab(tIdx, 'contentEn', e.target.value)}
                    placeholder="Content details in English..."
                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 font-sans focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

