import React, { useState, useMemo } from 'react';
import { 
  Eye, 
  Smartphone, 
  Monitor, 
  Sparkles, 
  Check, 
  AlertCircle, 
  UploadCloud, 
  FileText, 
  ShieldCheck, 
  Percent, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Layers, 
  Truck, 
  RotateCcw,
  CheckCircle2,
  Tag,
  FileSpreadsheet,
  Coins,
  Scissors,
  Printer,
  Palette,
  Settings,
  Wrench,
  BookOpen
} from 'lucide-react';
import { 
  SpecGroup, 
  ProductDiscountTier, 
  ProductInfoTab, 
  FeaturesConfig, 
  PricingModel 
} from '../../types';

export interface Step6CustomerPreviewProps {
  nameLo: string;
  nameEn: string;
  category: string;
  descriptionLo: string;
  descriptionEn: string;
  basePrice: number;
  pricingModel: PricingModel;
  thumbnailUrl: string;
  galleryUrls: string[];
  bestseller: boolean;
  featuresList: string[];
  featuresConfig: FeaturesConfig;
  specGroups: SpecGroup[];
  discountTiers: ProductDiscountTier[];
  infoTabs: ProductInfoTab[];
  targetMarginPercent: number;
  defaultMachineName: string;
  minQuantity?: number;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Step6CustomerPreview: React.FC<Step6CustomerPreviewProps> = ({
  nameLo,
  nameEn,
  category,
  descriptionLo,
  descriptionEn,
  basePrice,
  pricingModel,
  thumbnailUrl,
  galleryUrls,
  bestseller,
  featuresList,
  featuresConfig,
  specGroups,
  discountTiers,
  infoTabs,
  targetMarginPercent,
  defaultMachineName,
  minQuantity = 1,
  showToast,
}) => {
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTabId, setActiveTabId] = useState<string>(infoTabs.length > 0 ? (infoTabs[0].id || 'tab_0') : 'specs');
  const [selectedImage, setSelectedImage] = useState<string>(thumbnailUrl || (galleryUrls.length > 0 ? galleryUrls[0] : ''));
  const [simulatedFile, setSimulatedFile] = useState<string | null>(null);
  const [isDuplex, setIsDuplex] = useState<boolean>(false);

  // Selected Option state per Spec Group: Map<groupId, optionValue>
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    specGroups.forEach(g => {
      const defaultOpt = g.options.find(o => o.isDefault) || g.options[0];
      if (defaultOpt) {
        initial[g.id] = defaultOpt.value;
      }
    });
    return initial;
  });

  // Keep selectedOptions in sync when specGroups updates
  React.useEffect(() => {
    setSelectedOptions(prev => {
      const next = { ...prev };
      let changed = false;
      specGroups.forEach(g => {
        if (!next[g.id] && g.options.length > 0) {
          const defaultOpt = g.options.find(o => o.isDefault) || g.options[0];
          if (defaultOpt) {
            next[g.id] = defaultOpt.value;
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
  }, [specGroups]);

  const [quantity, setQuantity] = useState<number>(Math.max(minQuantity, 100));

  // Handle option select
  const handleSelectOption = (groupId: string, optVal: string) => {
    setSelectedOptions(prev => ({ ...prev, [groupId]: optVal }));
  };

  // Live Quotation Breakdown Rows (Supports N Material Groups & N Finishing Groups)
  const breakdownRows = useMemo(() => {
    // Factor for profit margin
    const marginFactor = Math.max(0.05, 1 - (targetMarginPercent || 35) / 100);
    
    // Find active selected options
    const printGroup = specGroups.find(g => g.id === 'group_print_mode' || (g as any).groupType === 'printing_mode');
    const printOptVal = printGroup ? selectedOptions[printGroup.id] : null;
    const printOpt = printGroup?.options.find(o => o.value === printOptVal) || printGroup?.options[0];
    const printCostPerSide = Number((printOpt as any)?.costPerUnit || printOpt?.extraCostRate || 0);
    const printCost = (featuresConfig?.hasDuplexPrinting && isDuplex) ? printCostPerSide * 2 : printCostPerSide;
    const printRate = printCost > 0 ? Math.round(printCost / marginFactor) : (basePrice > 0 ? (featuresConfig?.hasDuplexPrinting && isDuplex ? basePrice * 2 : basePrice) : 500);

    const materialGroups = specGroups.filter(g => 
      g.groupType === 'material' || 
      g.id.includes('material') || 
      g.id.includes('paper') || 
      g.id.includes('mat_') || 
      g.titleLo?.includes('ເຈ້ຍ') || 
      g.titleLo?.includes('ວັດສະດຸ')
    );

    const totalMaterialRate = materialGroups.reduce((sum, g) => {
      const optVal = selectedOptions[g.id];
      const opt = g.options.find(o => o.value === optVal) || g.options[0];
      const cost = Number((opt as any)?.costPerUnit || opt?.extraCostRate || 0);
      const rate = cost > 0 ? Math.round(cost / marginFactor) : Number(opt?.addPrice || 0);
      return sum + rate;
    }, 0);

    const finishingGroups = specGroups.filter(g => 
      g !== printGroup && 
      g.groupType !== 'printing_mode' && 
      !materialGroups.some(mg => mg.id === g.id)
    );

    const totalFinishingRate = finishingGroups.reduce((sum, g) => {
      const optVal = selectedOptions[g.id];
      const opt = g.options.find(o => o.value === optVal) || g.options[0];
      const cost = Number((opt as any)?.costPerUnit || opt?.extraCostRate || 0);
      const rate = cost > 0 ? Math.round(cost / marginFactor) : Number(opt?.addPrice || 0);
      return sum + rate;
    }, 0);

    const isCustom = featuresConfig?.breakdownMode === 'custom';
    const customRows = (featuresConfig?.customBreakdownRows && featuresConfig.customBreakdownRows.length > 0)
      ? featuresConfig.customBreakdownRows
      : [
          {
            id: 'row_print_paper',
            titleLo: 'ຄ່າພິມ + ເນື້ອເຈ້ຍ (Print & Paper Rate)',
            titleEn: 'Print & Paper Rate',
            includePrintCost: true,
            includeMaterialCost: true,
            includeFinishingCost: false,
            extraFixedCost: 0,
          },
          ...(totalFinishingRate > 0 ? [{
            id: 'row_finishing',
            titleLo: 'ຄ່າງານຫຼັງພິມ & ຕັດແຕ່ງ (Finishing & Cutting)',
            titleEn: 'Finishing & Cutting',
            includePrintCost: false,
            includeMaterialCost: false,
            includeFinishingCost: true,
            extraFixedCost: 0,
          }] : [])
        ];

    if (isCustom) {
      return customRows.map(r => {
        let rowRate = 0;
        const comps: string[] = [];
        if (r.includePrintCost) {
          rowRate += printRate;
          if (printOpt) comps.push(printOpt.labelLo || printOpt.label);
        }
        if (r.includeMaterialCost) {
          rowRate += totalMaterialRate;
          materialGroups.forEach(mg => {
            const val = selectedOptions[mg.id];
            const opt = mg.options.find(o => o.value === val) || mg.options[0];
            if (opt) comps.push(opt.labelLo || opt.label);
          });
        }
        if (r.includeFinishingCost) {
          rowRate += totalFinishingRate;
          finishingGroups.forEach(fg => {
            const val = selectedOptions[fg.id];
            const opt = fg.options.find(o => o.value === val) || fg.options[0];
            if (opt) comps.push(opt.labelLo || opt.label);
          });
        }
        if (r.extraFixedCost) {
          rowRate += Number(r.extraFixedCost);
        }

        return {
          id: r.id,
          title: r.titleLo,
          spec: comps.length > 0 ? comps.join(' · ') : 'ສເປັກມາດຕະຖານ',
          unitRate: rowRate,
          qty: quantity,
          subtotal: rowRate * quantity,
        };
      });
    }

    // Auto Mode:
    const rows = [];
    rows.push({
      id: 'print_rate',
      title: printOpt?.labelLo?.includes('ຂາວດຳ') ? 'ລະບົບພິມຂາວດຳ (Mono Print)' : 'ລະບົບພິມ 4 ສີ (Color Print)',
      spec: printOpt?.labelLo || printOpt?.label || 'CMYK Full Color',
      unitRate: printRate,
      qty: quantity,
      subtotal: printRate * quantity,
    });

    // Map each material group dynamically with its calculated selling rate!
    materialGroups.forEach(mg => {
      const optVal = selectedOptions[mg.id];
      const opt = mg.options.find(o => o.value === optVal) || mg.options[0];
      const cost = Number((opt as any)?.costPerUnit || opt?.extraCostRate || 0);
      const rate = cost > 0 ? Math.round(cost / marginFactor) : Number(opt?.addPrice || 0);

      rows.push({
        id: mg.id,
        title: `${mg.titleLo || mg.titleEn || 'ວັດສະດຸ'}`,
        spec: opt?.labelLo || opt?.label || 'Standard Material',
        unitRate: rate,
        qty: quantity,
        subtotal: rate * quantity,
      });
    });

    // Map each finishing group dynamically with its calculated selling rate!
    finishingGroups.forEach(fg => {
      const optVal = selectedOptions[fg.id];
      const opt = fg.options.find(o => o.value === optVal) || fg.options[0];
      const cost = Number((opt as any)?.costPerUnit || opt?.extraCostRate || 0);
      const rate = cost > 0 ? Math.round(cost / marginFactor) : Number(opt?.addPrice || 0);

      rows.push({
        id: fg.id,
        title: `${fg.titleLo || fg.titleEn || 'ງານຫຼັງພິມ'}`,
        spec: opt?.labelLo || opt?.label || 'Standard Finishing',
        unitRate: rate,
        qty: quantity,
        subtotal: rate * quantity,
      });
    });

    return rows;
  }, [featuresConfig, specGroups, selectedOptions, basePrice, quantity, targetMarginPercent]);

  // Calculate live pricing & costs synchronized with breakdownRows
  const { unitPrice, totalPrice, totalCost, netProfit, marginPercent, activeDiscount } = useMemo(() => {
    let trueCostSum = 0;

    specGroups.forEach(g => {
      const selectedVal = selectedOptions[g.id];
      const opt = g.options.find(o => o.value === selectedVal) || g.options.find(o => o.isDefault) || g.options[0];
      if (opt) {
        trueCostSum += Number((opt as any).costPerUnit) || Number(opt.extraCostRate) || 0;
      }
    });

    const rawUnitPrice = breakdownRows.reduce((sum, r) => sum + (r.unitRate || 0), 0);

    // Check Volume Discount Tier
    const sortedTiers = [...discountTiers].sort((a, b) => b.minQuantity - a.minQuantity);
    const matchedTier = sortedTiers.find(t => quantity >= t.minQuantity);
    const discountPct = matchedTier ? matchedTier.discountPercentage : 0;

    const finalUnitPrice = Math.round(rawUnitPrice * (1 - discountPct / 100));
    const finalTotalPrice = finalUnitPrice * quantity;
    const finalTotalCost = trueCostSum * quantity;
    const profit = finalTotalPrice - finalTotalCost;
    const profitMargin = finalTotalPrice > 0 ? Math.round((profit / finalTotalPrice) * 100) : targetMarginPercent;

    return {
      unitPrice: finalUnitPrice,
      totalPrice: finalTotalPrice,
      totalCost: finalTotalCost,
      netProfit: profit,
      marginPercent: profitMargin,
      activeDiscount: matchedTier,
    };
  }, [specGroups, selectedOptions, quantity, discountTiers, targetMarginPercent, breakdownRows]);

  const allImages = useMemo(() => {
    const list: string[] = [];
    if (thumbnailUrl) list.push(thumbnailUrl);
    galleryUrls.forEach(u => {
      if (u && !list.includes(u)) list.push(u);
    });
    return list;
  }, [thumbnailUrl, galleryUrls]);

  return (
    <div className="space-y-6">
      
      {/* Simulation Control & Device Switcher Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white text-slate-800 rounded-3xl shadow-xs border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>LIVE 1:1 CUSTOMER PREVIEW</span>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            ທົດລອງເລືອກສະເປັກ, ປ່ຽນຈຳນວນ ແລະ ເບິ່ງການຄິດໄລ່ລາຄາສົດ
          </span>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setDeviceView('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              deviceView === 'desktop'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceView('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              deviceView === 'mobile'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      {/* Admin Real-Time Cost & Profit Breakdown Analytics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-white border border-slate-200 rounded-3xl shadow-xs text-slate-800">
        <div className="space-y-1">
          <span className="text-[11px] text-slate-500 font-bold block flex items-center gap-1">
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>ຕົ້ນທຶນຜະລິດຈິງ (True Cost):</span>
          </span>
          <span className="text-lg font-mono font-black text-amber-600">
            {totalCost.toLocaleString()} ₭
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">
            ({(totalCost / quantity).toFixed(1)} ₭/ຊິ້ນ)
          </span>
        </div>

        <div className="space-y-1 border-l border-slate-100 pl-4">
          <span className="text-[11px] text-slate-500 font-bold block flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-emerald-600" />
            <span>ລາຄາຂາຍລວມ (Storefront Total):</span>
          </span>
          <span className="text-lg font-mono font-black text-emerald-600">
            {totalPrice.toLocaleString()} ₭
          </span>
          <span className="text-[10px] text-emerald-700 block font-mono">
            ({unitPrice.toLocaleString()} ₭/ຊິ້ນ)
          </span>
        </div>

        <div className="space-y-1 border-l border-slate-100 pl-4">
          <span className="text-[11px] text-slate-500 font-bold block flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
            <span>ກຳໄລສຸດທິ (Net Profit):</span>
          </span>
          <span className="text-lg font-mono font-black text-sky-700">
            +{netProfit.toLocaleString()} ₭
          </span>
          <span className="text-[10px] text-sky-600 block font-mono">
            (Margin ~{marginPercent}%)
          </span>
        </div>

        <div className="space-y-1 border-l border-slate-100 pl-4">
          <span className="text-[11px] text-slate-500 font-bold block flex items-center gap-1">
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>ເຄື່ອງພິມຫຼັກ:</span>
          </span>
          <span className="text-xs font-bold text-slate-900 block truncate" title={defaultMachineName}>
            {defaultMachineName}
          </span>
          <span className="text-[10px] text-slate-400 block">
            {activeDiscount ? `ຫຼຸດ ${activeDiscount.discountPercentage}% (Tier Qty ${activeDiscount.minQuantity}+)` : 'ລາຄາມາດຕະຖານ'}
          </span>
        </div>
      </div>

      {/* Main Interactive Storefront Screen Simulation */}
      <div className={`mx-auto transition-all ${deviceView === 'mobile' ? 'max-w-md' : 'w-full'}`}>
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 space-y-8">
          
          {/* Top 2-Column Storefront Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Left Column: Media Gallery & Preflight File Simulator */}
            <div className="md:col-span-5 space-y-5">
              {/* Main Image Frame */}
              <div className="aspect-square rounded-3xl bg-slate-50 border border-slate-200 overflow-hidden relative group flex items-center justify-center">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={nameLo || 'Product'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2 text-slate-400">
                    <Eye className="w-12 h-12 mx-auto text-slate-300" />
                    <span className="text-xs font-bold block">ບໍ່ມີຮູບພາບ</span>
                  </div>
                )}

                {bestseller && (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-amber-500 text-white text-xs font-black shadow-lg uppercase tracking-wider flex items-center gap-1">
                    Bestseller
                  </div>
                )}
              </div>

              {/* Thumbnails list */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((imgUrl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedImage(imgUrl)}
                      className={`w-16 h-16 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition cursor-pointer ${
                        selectedImage === imgUrl ? 'border-sky-600 scale-105 shadow-md' : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Simulated Customer File Upload Box */}
              {featuresConfig.hasPreflightCheck && (
                <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-sky-600" />
                      <span>ອັບໂຫຼດໄຟລ໌ພິມ (Customer Upload):</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Auto Preflight
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setSimulatedFile(simulatedFile ? null : 'Artwork_Final_PrintReady_300dpi.pdf');
                      showToast(simulatedFile ? 'ຍົກເລີກໄຟລ໌ຕົວຢ່າງ' : 'ຈຳລອງການອັບໂຫຼດ & ກວດ Preflight ຜ່ານ 100%', 'success');
                    }}
                    className={`p-4 rounded-xl border-2 border-dashed cursor-pointer text-center transition ${
                      simulatedFile 
                        ? 'border-emerald-500 bg-emerald-50/60' 
                        : 'border-slate-300 hover:border-sky-500 bg-white'
                    }`}
                  >
                    {simulatedFile ? (
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{simulatedFile}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">
                          300 DPI • Bleed 2mm • CMYK Color Profile • Print Ready
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700">
                          ຄລິກເພື່ອທົດລອງອັບໂຫຼດໄຟລ໌ (PDF, AI, PNG)
                        </p>
                        <p className="text-[10px] text-slate-400">
                          ລະບົບກວດສອບ DPI, Bleed ແລະ ໂໝດສີອັດຕະໂນມັດ
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Feature Tags List */}
              {featuresList.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {featuresList.map((f, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium border border-slate-200"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Interactive Product Specs Configuration */}
            <div className="md:col-span-7 space-y-6">
              {/* Product Title & Category */}
              <div className="space-y-1 border-b border-slate-100 pb-4">
                <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-700 text-xs font-mono font-bold uppercase border border-sky-100">
                  {category}
                </span>
                <h1 className="text-2xl font-black text-slate-900 pt-1">
                  {nameLo || 'ຊື່ສິນຄ້າ (ພາສາລາວ)'}
                </h1>
                {nameEn && (
                  <p className="text-sm font-medium text-slate-400">
                    {nameEn}
                  </p>
                )}
                {descriptionLo && (
                  <p className="text-xs text-slate-600 pt-2 leading-relaxed">
                    {descriptionLo}
                  </p>
                )}
              </div>

              {/* Dynamic Spec Groups Options (Cards / Dropdown) */}
              <div className="space-y-5">
                {specGroups.map((group) => {
                  const currentVal = selectedOptions[group.id];

                  return (
                    <div key={group.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{group.titleLo || group.titleEn}</span>
                        </label>
                      </div>

                      {group.displayType === 'dropdown' ? (
                        <select
                          value={currentVal}
                          onChange={(e) => handleSelectOption(group.id, e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                        >
                          {group.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.labelLo || opt.label} {opt.addPrice > 0 ? `(+${opt.addPrice.toLocaleString()} ₭)` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {group.options.map((opt) => {
                            const isOptSelected = currentVal === opt.value;
                            const isColorMode = opt.value === 'cmyk_4c' || opt.labelLo?.includes('ສີ') || opt.label?.toLowerCase().includes('color');
                            const isMonoMode = opt.value === 'mono_k' || opt.labelLo?.includes('ຂາວດຳ') || opt.label?.toLowerCase().includes('mono');

                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleSelectOption(group.id, opt.value)}
                                className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-1.5 cursor-pointer ${
                                  isOptSelected
                                    ? isColorMode 
                                      ? 'border-sky-600 bg-sky-50 text-slate-900 shadow-sm scale-[1.02]'
                                      : 'border-slate-800 bg-slate-100 text-slate-900 shadow-sm scale-[1.02]'
                                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <span className="text-xs font-bold block leading-tight flex items-center gap-1.5">
                                    {isColorMode && <Palette className="w-3.5 h-3.5 text-sky-600" />}
                                    {isMonoMode && <FileText className="w-3.5 h-3.5 text-slate-500" />}
                                    <span>{opt.labelLo || opt.label}</span>
                                  </span>
                                  {opt.machineName && (
                                    <span className="text-[10px] text-slate-400 block font-mono truncate">
                                      {opt.machineName}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                                  <span className="text-[10px] font-mono font-bold text-sky-700">
                                    {opt.addPrice > 0 ? `+${opt.addPrice.toLocaleString()} ₭` : 'ລວມໃນ Base'}
                                  </span>
                                  {isOptSelected && (
                                    <Check className="w-3.5 h-3.5 text-sky-600" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* DUPLEX SELECTION TOGGLE IF ENABLED */}
                {featuresConfig?.hasDuplexPrinting && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-sky-600" />
                      <span>ຮູບແບບໜ້າພິມ (Printing Sides):</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsDuplex(false)}
                        className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                          !isDuplex
                            ? 'border-sky-600 bg-sky-50 text-slate-900 shadow-sm'
                            : 'border-slate-200 text-slate-700 bg-white'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold block flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-sky-600" />
                            <span>ພິມ 1 ດ້ານ (Single-sided)</span>
                          </span>
                          <span className="text-[10px] text-slate-400">ມາດຕະຖານ</span>
                        </div>
                        {!isDuplex && <Check className="w-4 h-4 text-sky-600" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsDuplex(true)}
                        className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                          isDuplex
                            ? 'border-sky-600 bg-sky-50 text-slate-900 shadow-sm'
                            : 'border-slate-200 text-slate-700 bg-white'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold block flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-sky-600" />
                            <span>ພິມ 2 ດ້ານ (Double-sided)</span>
                          </span>
                          <span className="text-[10px] text-sky-700 font-bold font-mono">2x Print Rate</span>
                        </div>
                        {isDuplex && <Check className="w-4 h-4 text-sky-600" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity Stepper & Tier Discounts Selector */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span>ຈຳນວນສັ່ງພິມ (Quantity):</span>
                    {minQuantity > 1 && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 text-[10px] font-mono font-bold">
                        ຂັ້ນຕ່ຳ {minQuantity.toLocaleString()} ຊິ້ນ
                      </span>
                    )}
                  </label>
                  {activeDiscount && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>ໄດ້ຮັບສ່ວນຫຼຸດ {activeDiscount.discountPercentage}%</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {[50, 100, 300, 500, 1000, 2000, 5000].map((q) => {
                    const isQtySelected = quantity === q;

                    return (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuantity(q)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                          isQtySelected
                            ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 scale-105'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {q.toLocaleString()}
                      </button>
                    );
                  })}
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-24 px-2.5 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-xl text-center text-slate-800 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                  />
                </div>
              </div>

              {/* Quotation Breakdown Table (1:1 Preview) */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
                    <span>ຕາຕະລາງສະຫຼຸບຄ່າບໍລິການ (Quotation Breakdown):</span>
                  </span>
                  <span className="text-[10.5px] font-mono text-slate-500">
                    {featuresConfig?.breakdownMode === 'custom' ? 'Custom Formula' : 'Standard'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 text-[10px] text-slate-400 uppercase border-b border-slate-200">
                        <th className="py-2 px-3">ລາຍການ (Item)</th>
                        <th className="py-2 px-3 text-center">ສເປັກ (Spec)</th>
                        <th className="py-2 px-3 text-right">ລາຄາ/ໜ່ວຍ</th>
                        <th className="py-2 px-3 text-right">ລວມ ({quantity})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {breakdownRows.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-sans font-bold text-slate-800">
                            {r.title}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-500 font-sans text-[10.5px]">
                            {r.spec}
                          </td>
                          <td className="py-2 px-3 text-right text-sky-700 font-bold">
                            {r.unitRate > 0 ? `${r.unitRate.toLocaleString()} ₭` : 'ລວມໃນຊຸດ'}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {r.unitRate > 0 ? `${r.subtotal.toLocaleString()} ₭` : 'ຟຣີ'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Price Card & Simulated Add to Cart Action */}
              <div className="p-5 bg-gradient-to-r from-sky-900 via-slate-900 to-sky-950 border border-sky-500/30 rounded-3xl text-white space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-300 block">ລາຄາລວມທັງໝົດ (Total Price):</span>
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      {totalPrice.toLocaleString()} ₭
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-mono">ລາຄາສະເລ່ຍ:</span>
                    <span className="text-xs font-bold text-white font-mono">
                      {unitPrice.toLocaleString()} ₭ / ຊິ້ນ
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => showToast('ທົດລອງສັ່ງຊື້ສຳເລັດ (1:1 Storefront Preview Mode)', 'success')}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>ສັ່ງພິມເລີຍ (Order Now) • {totalPrice.toLocaleString()} ₭</span>
                </button>
              </div>

            </div>
          </div>

          {/* Bottom Tabs Section (Material Guide, Bleed Specs, Delivery, FAQ) */}
          {infoTabs.length > 0 && (
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-2">
                {infoTabs.map((tab, idx) => {
                  const isTabActive = activeTabId === (tab.id || `tab_${idx}`);

                  return (
                    <button
                      key={tab.id || idx}
                      type="button"
                      onClick={() => setActiveTabId(tab.id || `tab_${idx}`)}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                        isTabActive
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{tab.titleLo || tab.titleEn}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Display */}
              {infoTabs.map((tab, idx) => {
                if (activeTabId !== (tab.id || `tab_${idx}`)) return null;

                return (
                  <div key={tab.id || idx} className="p-5 bg-slate-50 rounded-2xl space-y-2 text-xs leading-relaxed text-slate-700">
                    <p className="whitespace-pre-line">{tab.contentLo}</p>
                    {tab.contentEn && (
                      <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-200 whitespace-pre-line">
                        {tab.contentEn}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
