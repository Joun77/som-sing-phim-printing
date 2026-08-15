import React, { useState, useEffect } from 'react';
import { calculateBackendPricing, PricingCalculationResult } from '@features/pricing';
import { 
  Sliders, 
  Copy, 
  Package, 
  Printer, 
  Scissors, 
  CheckCircle2, 
  ArrowLeft,
  Check,
  AlertCircle,
  Layers,
  BookOpen,
  Sparkles,
  Info,
  Maximize2,
  Zap,
  RefreshCw
} from 'lucide-react';

export function calculateItemCosting(item, inventory, equipment) {
  if (!item) return { 
    netCost: 0, finalPrice: 0, unitPrice: 0, cuts: 1, 
    totalParentSheets: 0, paperUnitCost: 0, inkUnitCost: 0, isMonochrome: false,
    combinedPaperInkRate: 0, totalPaperCost: 0, totalInkCost: 0, totalPaperInkCost: 0, 
    cuttingCost: 0, laminationCost: 0, bindingCost: 0,
    mediaType: 'Sheet-fed', totalSqMeters: 0, printerStdMl: 0.05, inkCostPerMl: 500,
    inkCostK: 0, inkCostCMY: 0, depreciationCost: 0, maintenanceCost: 0,
    customFinishingCost: 0, overheadCost: 0, totalCost: 0, directCost: 0
  };

  const mediaType = item.mediaType || 'Sheet-fed';
  const isRollFed = mediaType === 'Roll-fed';
  const qty = Number(item.quantity || 1);
  const isMonochrome = item.colorMode === 'Monochrome' || item.printColorMode === 'Monochrome';
  const sidesMultiplier = item.isDoubleSided ? 2 : 1;

  // Printer Machine Specs Integration
  const printerItem = equipment ? equipment.find(e => e.id === item.printerId) : null;
  const printerStdMl = printerItem?.inkConsumptionStandard || 0.05; // ml per A4 sheet @ 5% coverage
  const inkCostPerMl = printerItem?.inkUnitCostMl || 500; // LAK per ml

  // Split K and CMY Coverages
  const avgCoverageK = Number(item.avgCoverageK !== undefined ? item.avgCoverageK : (item.avgCoverage || 5));
  const avgCoverageCMY = isMonochrome ? 0 : Number(item.avgCoverageCMY !== undefined ? item.avgCoverageCMY : 0);

  const inkCostKPerMl = Number(printerItem?.inkUnitCostMl || 500);
  const inkCostCMYPerMl = Number(printerItem?.inkUnitCostCMY || printerItem?.inkUnitCostMl || 600);

  let totalPaperCost = 0;
  let totalInkCost = 0;
  let totalInkCostK = 0;
  let totalInkCostCMY = 0;
  let totalPaperInkCost = 0;
  let combinedPaperInkRate = 0;
  let paperUnitCost = 0;
  let inkUnitCost = 0;
  let cuts = 1;
  let totalParentSheets = 1;
  let totalSqMeters = 0;

  const jobW = Number(item.jobWidth || 210);
  const jobH = Number(item.jobHeight || 297);
  const totalSqMetersForJob = (jobW / 1000.0) * (jobH / 1000.0) * qty;

  if (isRollFed) {
    // Roll-fed / Wide Format Surface Area Calculation
    totalSqMeters = Math.round(totalSqMetersForJob * 100) / 100;

    const rollItem = inventory ? inventory.find(p => p.id === item.paperId) : null;
    const rollMaterialCostPerM2 = rollItem ? (rollItem.costPerM2 || rollItem.costPerSheet || 15000) : Number(item.rollMaterialCostPerM2 || 15000);
    const inkVolumePerM2 = Number(item.inkVolumePerM2 || 10);

    totalPaperCost = Math.round(totalSqMeters * rollMaterialCostPerM2);
    // Scale roll-fed ink costs as well if monochrome vs color
    const baseInkCostM2 = inkVolumePerM2 * (isMonochrome ? inkCostKPerMl : inkCostCMYPerMl);
    totalInkCost = Math.round(totalSqMeters * baseInkCostM2);
    totalPaperInkCost = totalPaperCost + totalInkCost;

    paperUnitCost = rollMaterialCostPerM2;
    inkUnitCost = Math.round(inkVolumePerM2 * (isMonochrome ? inkCostKPerMl : inkCostCMYPerMl));
    combinedPaperInkRate = paperUnitCost + inkUnitCost; // Cost per m2
  } else {
    // Sheet-fed Commercial Printing Calculation
    const paperItem = inventory ? inventory.find(p => p.id === item.paperId) : null;
    let parentW = 297, parentH = 420;
    if (paperItem && paperItem.name.includes('A4')) { parentW = 210; parentH = 297; }

    const currentJobW = jobW + (Number(item.bleedMargin || 0) * 2);
    const currentJobH = jobH + (Number(item.bleedMargin || 0) * 2);
    const portraitCuts = Math.floor(parentW / currentJobW) * Math.floor(parentH / currentJobH);
    const landscapeCuts = Math.floor(parentW / currentJobH) * Math.floor(parentH / currentJobW);
    const autoCuts = Math.max(1, Math.max(portraitCuts, landscapeCuts));

    cuts = item.itemsPerSheet !== undefined && item.itemsPerSheet !== null && Number(item.itemsPerSheet) > 0
      ? Number(item.itemsPerSheet)
      : autoCuts;

    const parentSheetsNeeded = Math.ceil(qty / cuts);
    const spoilageRate = Number(item.spoilageRate || 5);
    const spoilageSheets = Math.ceil(parentSheetsNeeded * (spoilageRate / 100));
    const autoTotalSheets = parentSheetsNeeded + spoilageSheets;

    totalParentSheets = item.manualTotalSheets !== undefined && item.manualTotalSheets !== null && Number(item.manualTotalSheets) > 0
      ? Number(item.manualTotalSheets)
      : autoTotalSheets;

    // Paper Cost
    paperUnitCost = paperItem 
      ? (paperItem.costPerSheet || paperItem.costPerConsumptionUnit || paperItem.unitCost || 1200) 
      : Number(item.customPaperCost || 1200);

    totalPaperCost = totalParentSheets * paperUnitCost;

    // Split ink costs based on K vs CMY coverages
    const inkUnitCostK = (printerStdMl * (avgCoverageK / 5)) * inkCostKPerMl * sidesMultiplier;
    const inkUnitCostCMY = (printerStdMl * (avgCoverageCMY / 5)) * inkCostCMYPerMl * sidesMultiplier;
    inkUnitCost = Math.round(inkUnitCostK + inkUnitCostCMY);

    totalInkCostK = Math.round(totalParentSheets * inkUnitCostK);
    totalInkCostCMY = Math.round(totalParentSheets * inkUnitCostCMY);
    totalInkCost = totalInkCostK + totalInkCostCMY;
    combinedPaperInkRate = paperUnitCost + inkUnitCost;
    totalPaperInkCost = totalPaperCost + totalInkCost;
  }

  // Machine Depreciation & Maintenance
  const machinePrice = Number(printerItem?.price || printerItem?.machinePrice || 0);
  const targetTotalPages = Number(printerItem?.targetTotalPages || printerItem?.targetPages || 1000000);
  const maintenanceCostPerPage = Number(printerItem?.maintenanceCostPerPage || printerItem?.maintenanceCost || 0);

  const depreciationCostPerPage = targetTotalPages > 0 ? (machinePrice / targetTotalPages) : 0;
  const depreciationCost = Math.round(depreciationCostPerPage * qty);
  const maintenanceCost = Math.round(maintenanceCostPerPage * qty);
  const totalMachineCost = depreciationCost + maintenanceCost;

  // Custom Finishing options
  let customFinishingCost = 0;
  const customFinishingOptions = item.customFinishingOptions || [];
  customFinishingOptions.forEach(opt => {
    const price = Number(opt.price || 0);
    if (opt.chargeType === 'FIXED_JOB') {
      customFinishingCost += price;
    } else if (opt.chargeType === 'PER_UNIT') {
      customFinishingCost += price * qty;
    } else if (opt.chargeType === 'PER_SQM') {
      customFinishingCost += price * totalSqMetersForJob;
    }
  });
  customFinishingCost = Math.round(customFinishingCost);

  // Cutting Cost
  const cuttingCost = item.skipCutting ? 0 : Number(item.cuttingFee || 5000);

  // Coating / Lamination Cost
  let laminationCost = 0;
  if (!item.noCoating && (item.useLamination || item.laminationType)) {
    const targetSheets = isRollFed ? totalSqMeters : Number(item.coatingSheets || totalParentSheets);
    const sqMeters = isRollFed ? totalSqMeters : (((jobW / 1000) * (jobH / 1000)) * targetSheets);
    const laminationRate = item.laminationType === 'SoftTouch' ? 6000 : item.laminationType === 'Matte' ? 4500 : 4000;
    laminationCost = Math.round(sqMeters * laminationRate);
  }

  // Binding Cost
  let bindingCost = 0;
  if (!item.noBinding && (item.useBinding || item.bindingType)) {
    if (item.bindingType === 'Staple') bindingCost = qty * 200;
    else if (item.bindingType === 'Spiral') bindingCost = qty * 3000;
    else if (item.bindingType === 'Perfect') bindingCost = qty * 1500;
    else if (item.bindingType === 'Calendar') bindingCost = qty * 4500;
    else bindingCost = qty * 1000;
  }

  // Setup & Finishing Costs
  const setupCost = Number(item.setupCost !== undefined ? item.setupCost : 50000);
  const totalFinishingCost = cuttingCost + laminationCost + bindingCost + customFinishingCost;

  // Direct Cost sum (Paper + Ink + Machine + Setup + Finishing)
  const directCost = totalPaperInkCost + totalMachineCost + setupCost + totalFinishingCost;

  // Overhead Cost calculation (Fallback to 15% if not defined)
  const overheadPercent = Number(item.overheadPercent !== undefined ? item.overheadPercent : 15) / 100;
  const overheadCost = Math.round(directCost * overheadPercent);

  // Total cost
  const totalCost = directCost + overheadCost;

  // Margin Pricing with Volume Discounts (10% for >= 500, 20% for >= 1000)
  const targetMargin = Number(item.targetMarginPercent || 35) / 100;
  const clampedMargin = Math.min(0.99, Math.max(0, targetMargin));
  const volumeDiscountPct = qty >= 1000 ? 0.20 : qty >= 500 ? 0.10 : 0;
  const effectiveMargin = clampedMargin * (1 - volumeDiscountPct);

  const suggestedPrice = Math.round(totalCost / (1 - effectiveMargin));

  const finalPrice = item.manualUnitPrice !== null && item.manualUnitPrice !== undefined 
    ? (Number(item.manualUnitPrice) * qty) 
    : suggestedPrice;
  const unitPrice = qty > 0 ? finalPrice / qty : 0;

  return {
    mediaType,
    cuts,
    totalParentSheets,
    totalSqMeters,
    paperUnitCost,
    inkUnitCost,
    isMonochrome,
    combinedPaperInkRate,
    setupCost,
    totalPaperCost,
    totalInkCost,
    totalInkCostK,
    totalInkCostCMY,
    totalPaperInkCost,
    cuttingCost,
    laminationCost,
    bindingCost,
    depreciationCost,
    maintenanceCost,
    customFinishingCost,
    totalFinishingCost,
    overheadCost,
    directCost,
    totalCost,
    netCost: directCost, // map netCost to directCost for display compatibility
    finalPrice,
    unitPrice,
    printerStdMl,
    inkCostPerMl
  };
}

export default function ItemSpecConfigurator({
  item,
  itemIndex,
  allItems = [],
  inventory = [],
  equipment = [],
  formatLAK,
  onSave,
  onChange,
  onCancel,
  showToast,
  embeddedMode = false
}: {
  item?: any;
  itemIndex?: number;
  allItems?: any[];
  inventory?: any[];
  equipment?: any[];
  formatLAK?: any;
  onSave?: any;
  onChange?: any;
  onCancel?: any;
  showToast?: any;
  embeddedMode?: boolean;
}) {
  const isLao = true;
  const papers = inventory ? inventory.filter(p => p.category === 'Paper' || p.name.includes('A4') || p.name.includes('A3') || p.id.startsWith('LOT-')) : [];
  const rolls = inventory ? inventory.filter(p => p.category === 'Roll' || p.category === 'Vinyl' || p.category === 'Flex' || p.name.includes('ມ້ວນ') || p.name.includes('Vinyl')) : papers;
  const printers = equipment ? equipment.filter(eq => eq.category === 'Printer' || eq.printerType || eq.name.includes('C6085') || eq.name.toLowerCase().includes('print')) : [];
  const cutters = equipment ? equipment.filter(eq => eq.category === 'Cutter' || eq.name.includes('ຕັດ') || eq.name.toLowerCase().includes('cut')) : [];

  const defaultPaperId = papers.length > 0 ? papers[0].id : '';
  const defaultPrinterId = printers.length > 0 ? printers[0].id : '';

  const [tempItem, setTempItem] = useState({
    mediaType: 'Sheet-fed',
    paperId: defaultPaperId,
    printerId: defaultPrinterId,
    colorMode: 'Color',
    printColorMode: 'Color',
    jobWidth: 210,
    jobHeight: 297,
    bleedMargin: 2,
    itemsPerSheet: item?.itemsPerSheet || null,
    manualTotalSheets: item?.manualTotalSheets || null,
    inkCostPerSheet: 500,
    rollMaterialCostPerM2: 15000,
    inkVolumePerM2: 10,
    inkPricePerMl: 500,
    isDoubleSided: false,
    avgCoverage: 15,
    avgCoverageK: item?.avgCoverageK !== undefined ? item.avgCoverageK : 5,
    avgCoverageCMY: item?.avgCoverageCMY !== undefined ? item.avgCoverageCMY : 10,
    customFinishingOptions: item?.customFinishingOptions || [],
    overheadPercent: item?.overheadPercent !== undefined ? item.overheadPercent : 15,
    skipCutting: false,
    cuttingEquipmentId: '',
    cuttingFee: 5000,
    noCoating: false,
    useLamination: false,
    laminationType: 'Glossy',
    coatingSheets: 0,
    noBinding: false,
    useBinding: false,
    bindingType: 'Staple',
    spoilageRate: 5,
    targetMarginPercent: 35,
    manualUnitPrice: null,
    ...item
  });

  // State for Backend Go Pricing Engine Integration
  const [backendPricing, setBackendPricing] = useState<PricingCalculationResult | null>(null);
  const [isCalculatingBackend, setIsCalculatingBackend] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [breakdownViewMode, setBreakdownViewMode] = useState<'total' | 'unit'>('total');

  // Debounced effect calling Go Backend Pricing Engine API (/api/pricing/calculate)
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      setIsCalculatingBackend(true);
      setBackendError(null);

      const localCosting = calculateItemCosting(tempItem, inventory, equipment);
      const setupCost = Number(tempItem.setupCost !== undefined ? tempItem.setupCost : 50000);
      const finishingCost = localCosting.cuttingCost + localCosting.laminationCost + localCosting.bindingCost + localCosting.customFinishingCost;

      calculateBackendPricing({
        job_name: tempItem.name || 'Print Job',
        quantity: Number(tempItem.quantity || 1),
        paper_sku: tempItem.paperId || 'default-paper',
        paper_cost_per_unit: localCosting.paperUnitCost,
        paper_format: tempItem.mediaType === 'Roll-fed' ? 'roll' : 'sheet',
        setup_cost: setupCost,
        finishing_cost: finishingCost,
        base_profit_pct: Number(tempItem.targetMarginPercent || 30),
        ink_coverage_k_percent: Number(tempItem.avgCoverageK !== undefined ? tempItem.avgCoverageK : 5),
        ink_coverage_cmy_percent: Number(tempItem.avgCoverageCMY !== undefined ? tempItem.avgCoverageCMY : 10),
        ink_cost_k_per_ml: localCosting.inkCostPerMl,
        ink_cost_cmy_per_ml: localCosting.inkCostPerMl,
        job_width: Number(tempItem.jobWidth || 210),
        job_height: Number(tempItem.jobHeight || 297),
        overhead_percent: Number(tempItem.overheadPercent || 15) / 100,
        spoilage_percent: Number(tempItem.spoilageRate || 5) / 100,
        target_margin_percent: Number(tempItem.targetMarginPercent || 30) / 100,
        target_currency: 'LAK'
      })
        .then(result => {
          if (isMounted) {
            setBackendPricing(result);
            setIsCalculatingBackend(false);
          }
        })
        .catch(err => {
          if (isMounted) {
            setBackendError(err.message || 'Go Pricing Engine Offline');
            setIsCalculatingBackend(false);
          }
        });

      if (onChange) {
        onChange(tempItem);
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    tempItem.quantity,
    tempItem.mediaType,
    tempItem.paperId,
    tempItem.printerId,
    tempItem.jobWidth,
    tempItem.jobHeight,
    tempItem.setupCost,
    tempItem.avgCoverageK,
    tempItem.avgCoverageCMY,
    tempItem.targetMarginPercent,
    tempItem.overheadPercent,
    tempItem.spoilageRate,
    tempItem.laminationType,
    tempItem.bindingType,
    tempItem.customFinishingOptions
  ]);

  // State for Custom Finishing options form
  const [customName, setCustomName] = useState('');
  const [customChargeType, setCustomChargeType] = useState('FIXED_JOB');
  const [customPrice, setCustomPrice] = useState(0);

  const addCustomFinishing = () => {
    if (!customName.trim()) return;
    const newOption = {
      name: customName,
      chargeType: customChargeType,
      price: Number(customPrice || 0)
    };
    setTempItem(prev => ({
      ...prev,
      customFinishingOptions: [...(prev.customFinishingOptions || []), newOption]
    }));
    setCustomName('');
    setCustomPrice(0);
  };

  const removeCustomFinishing = (idx) => {
    setTempItem(prev => ({
      ...prev,
      customFinishingOptions: (prev.customFinishingOptions || []).filter((_, i) => i !== idx)
    }));
  };

  const handleDuplicateSpecsFrom = (sourceIndexStr) => {
    if (sourceIndexStr === '' || sourceIndexStr === null) return;
    const sourceItem = allItems[Number(sourceIndexStr)];
    if (!sourceItem) return;

    setTempItem(prev => ({
      ...prev,
      mediaType: sourceItem.mediaType || 'Sheet-fed',
      paperId: sourceItem.paperId,
      printerId: sourceItem.printerId,
      colorMode: sourceItem.colorMode || 'Color',
      printColorMode: sourceItem.printColorMode || 'Color',
      jobWidth: sourceItem.jobWidth,
      jobHeight: sourceItem.jobHeight,
      bleedMargin: sourceItem.bleedMargin,
      itemsPerSheet: sourceItem.itemsPerSheet,
      manualTotalSheets: sourceItem.manualTotalSheets,
      inkCostPerSheet: sourceItem.inkCostPerSheet,
      rollMaterialCostPerM2: sourceItem.rollMaterialCostPerM2,
      inkVolumePerM2: sourceItem.inkVolumePerM2,
      inkPricePerMl: sourceItem.inkPricePerMl,
      isDoubleSided: sourceItem.isDoubleSided,
      avgCoverage: sourceItem.avgCoverage,
      avgCoverageK: sourceItem.avgCoverageK !== undefined ? sourceItem.avgCoverageK : 5,
      avgCoverageCMY: sourceItem.avgCoverageCMY !== undefined ? sourceItem.avgCoverageCMY : 10,
      customFinishingOptions: sourceItem.customFinishingOptions || [],
      overheadPercent: sourceItem.overheadPercent !== undefined ? sourceItem.overheadPercent : 15,
      skipCutting: sourceItem.skipCutting,
      cuttingEquipmentId: sourceItem.cuttingEquipmentId,
      cuttingFee: sourceItem.cuttingFee,
      noCoating: sourceItem.noCoating,
      useLamination: sourceItem.useLamination,
      laminationType: sourceItem.laminationType,
      coatingSheets: sourceItem.coatingSheets,
      noBinding: sourceItem.noBinding,
      useBinding: sourceItem.useBinding,
      bindingType: sourceItem.bindingType,
      spoilageRate: sourceItem.spoilageRate,
      targetMarginPercent: sourceItem.targetMarginPercent,
      manualUnitPrice: sourceItem.manualUnitPrice
    }));

    if (showToast) showToast(`ຄັດລອກສະເປັກຈາກ "${sourceItem.name}" ສຳເລັດ!`, 'info');
  };

  const handleSave = () => {
    const localCost = calculateItemCosting(tempItem, inventory, equipment);
    const updated = {
      ...tempItem,
      setupCost: tempItem.setupCost !== undefined ? tempItem.setupCost : 50000,
      finishingCost: localCost.totalFinishingCost,
      totalCost: backendPricing ? backendPricing.total_cost : localCost.totalCost,
      directCost: backendPricing ? backendPricing.direct_cost : localCost.directCost,
      finalPrice: backendPricing ? backendPricing.sale_price : localCost.finalPrice,
      unitPrice: backendPricing ? backendPricing.unit_price : localCost.unitPrice,
      manualUnitPrice: backendPricing ? backendPricing.unit_price : localCost.unitPrice,
      isConfigured: true
    };
    onSave(updated);
  };

  const costing = calculateItemCosting(tempItem, inventory, equipment);
  const activeStockList = tempItem.mediaType === 'Roll-fed' ? (rolls.length > 0 ? rolls : papers) : papers;
  const selectedPaper = activeStockList.find(p => p.id === tempItem.paperId);
  const selectedPrinterObj = printers.find(pr => pr.id === tempItem.printerId);

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12 text-slate-800 font-sans">
      {/* Top Header Card */}
      {!embeddedMode && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 text-xs sm:text-sm font-black text-white hover:bg-emerald-600 transition py-2.5 px-5 bg-emerald-500 rounded-2xl shadow-md active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← ບັນທຶກ & ກັບໄປຮາຍການສິນຄ້າ (Save & Return)</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 transition px-4 py-2.5 bg-slate-100 rounded-2xl border border-slate-200"
            >
              ຍົກເລີກ
            </button>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-xs uppercase font-extrabold text-sky-600 tracking-wider font-sans block">
              Item Spec Configurator #{itemIndex + 1}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-600" />
              <span>ຕັ້ງຄ່າສະເປັກການພິມ: <strong className="text-sky-600">"{tempItem.name}"</strong></span>
            </h3>
          </div>
        </div>
      )}

      {/* Duplicate Specs Toolbar */}
      {allItems && allItems.length > 1 && (
        <div className="bg-sky-50/70 border border-sky-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-bold text-sky-900 shadow-sm">
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4 text-sky-600" />
            <span>ຄັດລອກສະເປັກຈາກຮາຍການອື່ນ (Duplicate Specs from Another Item):</span>
          </div>
          <select
            onChange={(e) => handleDuplicateSpecsFrom(e.target.value)}
            defaultValue=""
            className="w-full sm:w-auto px-3.5 py-2 border border-sky-300 rounded-xl bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <option value="" disabled>-- ເລືອກຮາຍການທີ່ຕ້ອງການຄັດລອກສະເປັກ --</option>
            {allItems.map((it, idx) => {
              if (idx === itemIndex) return null;
              return (
                <option key={it.id || idx} value={idx}>
                  Item #{idx + 1}: {it.name} ({it.isConfigured ? 'Configured' : 'Pending'})
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Main 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1: Configurator Inputs Form (Steps 1 to 5) */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: Paper Stock & Quantity (ຕົ້ນທຶນເຈ້ຍ) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-sky-600 uppercase block">Step 1</span>
                  <h4 className="font-black text-sm text-slate-900">ເຈ້ຍ & ຈຳນວນແຜ່ນທີ່ໃຊ້ (Paper Stock & Quantity)</h4>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-700">
              {/* Media Type Selector Toggle */}
              <div className="space-y-1">
                <label className="block text-slate-600 font-black">ປະເພດມີເດຍ / ຊະນິດເຈ້ຍ (Media Type) *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTempItem({ ...tempItem, mediaType: 'Sheet-fed' })}
                    className={`p-3.5 rounded-2xl border text-xs font-black transition flex items-center justify-center gap-2 ${
                      tempItem.mediaType !== 'Roll-fed'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>ເຈ້ຍແຜ່ນ (Sheet-fed)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTempItem({ ...tempItem, mediaType: 'Roll-fed' })}
                    className={`p-3.5 rounded-2xl border text-xs font-black transition flex items-center justify-center gap-2 ${
                      tempItem.mediaType === 'Roll-fed'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>ເຈ້ຍມ້ວນ / ປ້າຍ (Roll-fed)</span>
                  </button>
                </div>
              </div>

              {/* Conditional Inputs based on Media Type */}
              {tempItem.mediaType === 'Roll-fed' ? (
                /* ROLL-FED / WIDE FORMAT CALCULATION INPUTS */
                <div className="space-y-4 animate-fade-in bg-purple-50/40 p-4 rounded-2xl border border-purple-100">
                  <div className="space-y-1">
                    <label className="block text-slate-600">ມ້ວນມີເດຍ / ໄວນິລ (Roll Stock from Inventory) *</label>
                    <select
                      value={tempItem.paperId}
                      onChange={(e) => setTempItem({ ...tempItem, paperId: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white font-bold text-xs focus:outline-none"
                    >
                      <option value="">-- ເລືອກມີເດຍມ້ວນຈາກ Master Inventory --</option>
                      {activeStockList.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (ຕົ້ນທຶນ: {formatLAK(p.costPerM2 || p.costPerSheet || 15000)}/m²)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-black">Width (mm):</label>
                      <input
                        type="number"
                        value={tempItem.jobWidth}
                        onChange={(e) => setTempItem({ ...tempItem, jobWidth: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-black">Height (mm):</label>
                      <input
                        type="number"
                        value={tempItem.jobHeight}
                        onChange={(e) => setTempItem({ ...tempItem, jobHeight: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs text-center"
                      />
                    </div>
                  </div>

                  <div className="bg-purple-100/60 p-3.5 rounded-xl border border-purple-200 flex justify-between items-center text-purple-900 font-bold">
                    <span>ເນື້ອທີ່ລວມ (Total Surface Area):</span>
                    <span className="font-sans font-black text-sm text-purple-800">{costing.totalSqMeters} m²</span>
                  </div>
                </div>
              ) : (
                /* SHEET-FED CALCULATION INPUTS */
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="block text-slate-600">ເຈ້ຍທີ່ໃຊ້ພິມ (Paper Stock from Inventory) *</label>
                    <select
                      value={tempItem.paperId}
                      onChange={(e) => setTempItem({ ...tempItem, paperId: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">-- ເລືອກຊະນິດເຈ້ຍຈາກ Master Inventory --</option>
                      {papers.map(p => {
                        const unitPrice = p.costPerSheet || p.costPerConsumptionUnit || p.unitCost || 1200;
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name} — ຕົ້ນທຶນ: {formatLAK(unitPrice)}/ແຜ່ນ
                          </option>
                        );
                      })}
                    </select>
                    {selectedPaper && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>ດຶງຕົ້ນທຶນເຈ້ຍຈາກ Inventory: <strong>{formatLAK(costing.paperUnitCost)}</strong> / ແຜ່ນ</span>
                      </p>
                    )}
                  </div>

                  {/* Sheet Dimensions */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-black">Width (mm):</label>
                      <input
                        type="number"
                        value={tempItem.jobWidth}
                        onChange={(e) => setTempItem({ ...tempItem, jobWidth: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs text-center focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-black">Height (mm):</label>
                      <input
                        type="number"
                        value={tempItem.jobHeight}
                        onChange={(e) => setTempItem({ ...tempItem, jobHeight: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs text-center focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-black">Bleed (mm):</label>
                      <input
                        type="number"
                        value={tempItem.bleedMargin}
                        onChange={(e) => setTempItem({ ...tempItem, bleedMargin: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs text-center focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Paper Sheet Quantity & Layout Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div className="space-y-1">
                      <label className="block text-slate-700 font-black">
                        ຈຳນວນຊິ້ນຕໍ່ແຜ່ນ (Items per Sheet / Up Count) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tempItem.itemsPerSheet !== undefined && tempItem.itemsPerSheet !== null ? tempItem.itemsPerSheet : costing.cuts}
                        onChange={(e) => {
                          const upCount = Math.max(1, Number(e.target.value));
                          const targetQty = Number(tempItem.quantity || 1);
                          const autoSheets = Math.ceil(targetQty / upCount);
                          setTempItem({
                            ...tempItem,
                            itemsPerSheet: upCount,
                            manualTotalSheets: autoSheets
                          });
                        }}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs text-center focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-700 font-black">
                        ຈຳນວນເຈ້ຍທີ່ໃຊ້ພິມລວມ (Total Paper Sheets) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={costing.totalParentSheets}
                        onChange={(e) => {
                          setTempItem({
                            ...tempItem,
                            manualTotalSheets: Math.max(1, Number(e.target.value))
                          });
                        }}
                        className="w-full px-3.5 py-2.5 border border-sky-300 rounded-xl font-sans font-black bg-sky-50/50 text-xs text-center text-sky-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1 Paper Cost Summary Banner */}
              <div className="bg-sky-50/80 p-4 rounded-2xl border border-sky-100 flex justify-between items-center text-xs font-black">
                <span className="text-sky-800">ຕົ້ນທຶນເຈ້ຍລວມ (Step 1 Paper Cost):</span>
                <span className="text-base font-sans text-sky-900">{formatLAK(costing.totalPaperCost)}</span>
              </div>
            </div>
          </div>

          {/* STEP 2: Printing Equipment & Dynamic Ink Calculation (ເຄື່ອງພິມ & ຕົ້ນທຶນໝຶກພິມ) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-purple-600 uppercase block">Step 2</span>
                <h4 className="font-black text-sm text-slate-900">ເຄື່ອງພິມ & ຄຳນວນໝຶກພິມ (Printer Equipment & Ink Calculation)</h4>
              </div>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-700">
              {/* Printer Selection */}
              <div className="space-y-1">
                <label className="block text-slate-600">ເຄື່ອງພິມ (Printing Machine Profile) *</label>
                <select
                  value={tempItem.printerId}
                  onChange={(e) => setTempItem({ ...tempItem, printerId: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- ເລືອກເຄື່ອງພິມຈາກ Master Equipment --</option>
                  {printers.map(pr => (
                    <option key={pr.id} value={pr.id}>
                      {pr.name} (Std Ink: {pr.inkConsumptionStandard || 0.05} ml @ 5% | ₭{pr.inkUnitCostMl || 500}/ml)
                    </option>
                  ))}
                </select>

                {/* Printer Master Spec Badge */}
                {selectedPrinterObj && (
                  <div className="bg-purple-50/80 p-3 rounded-2xl border border-purple-100 flex items-center justify-between text-[11px] text-purple-900 font-bold mt-1">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-600" />
                      <span>Printer Specs: Standard <strong>{selectedPrinterObj.inkConsumptionStandard || 0.05} ml/sheet</strong> @ 5% ISO</span>
                    </span>
                    <span className="font-mono text-purple-700">₭{selectedPrinterObj.inkUnitCostMl || 500} / ml</span>
                  </div>
                )}
              </div>

              {/* Print Mode & Coverage Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-600">ໂໝດສີພິມ (Color Mode)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTempItem({ ...tempItem, colorMode: 'Color', printColorMode: 'Color' })}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-black transition flex items-center justify-center gap-1 ${
                        tempItem.colorMode !== 'Monochrome' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>ພິມສີ (Color)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempItem({ ...tempItem, colorMode: 'Monochrome', printColorMode: 'Monochrome' })}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-black transition flex items-center justify-center gap-1 ${
                        tempItem.colorMode === 'Monochrome' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>ຂາວ-ດຳ (B&W)</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-600">ໜ້າພິມ (Sides)</label>
                  <button
                    type="button"
                    onClick={() => setTempItem({ ...tempItem, isDoubleSided: !tempItem.isDoubleSided })}
                    className={`w-full py-2.5 rounded-xl border text-xs font-black transition ${
                      tempItem.isDoubleSided ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {tempItem.isDoubleSided ? 'ພິມ 2 ໜ้า (Double-Sided)' : 'ພິມ 1 ໜ້າ (Single-Sided)'}
                  </button>
                </div>
              </div>

              {/* Ink Coverage Presets */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-slate-600">Preset ການຄອບຄຸມ % Coverage</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { name: 'ISO Standard (5% / 5%)', k: 5, cmy: 5 },
                    { name: 'Text Heavy (10% / 0%)', k: 10, cmy: 0 },
                    { name: 'Image/Poster (20% / 40%)', k: 20, cmy: 40 },
                    { name: 'Photo (30% / 60%)', k: 30, cmy: 60 }
                  ].map(preset => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setTempItem({ ...tempItem, avgCoverageK: preset.k, avgCoverageCMY: preset.cmy })}
                      className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-[10px] font-black text-slate-700"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders for K and CMY Coverage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Black Coverage (K):</span>
                    <span className="font-sans font-black text-purple-700">{tempItem.avgCoverageK}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tempItem.avgCoverageK}
                    onChange={(e) => setTempItem({ ...tempItem, avgCoverageK: Number(e.target.value) })}
                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Color Coverage (CMY):</span>
                    <span className="font-sans font-black text-purple-700">{tempItem.colorMode === 'Monochrome' ? '0% (Monochrome)' : `${tempItem.avgCoverageCMY}%`}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    disabled={tempItem.colorMode === 'Monochrome'}
                    value={tempItem.colorMode === 'Monochrome' ? 0 : tempItem.avgCoverageCMY}
                    onChange={(e) => setTempItem({ ...tempItem, avgCoverageCMY: Number(e.target.value) })}
                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Step 2 Dynamic Ink Cost Result Banner */}
              <div className="bg-purple-50/80 p-4 rounded-2xl border border-purple-100 flex flex-col gap-2 text-xs font-black">
                <div className="flex justify-between items-center">
                  <span className="text-purple-900">ຕົ້ນທຶນໝຶກພິມລວມ (Step 2 Ink Cost):</span>
                  <span className="text-base font-sans text-purple-900">{formatLAK(costing.totalInkCost)}</span>
                </div>
                <div className="text-[10px] text-purple-700 font-mono font-normal space-y-1">
                  <div>
                    Black (K): {tempItem.avgCoverageK}% Coverage = {formatLAK(costing.totalInkCostK)}
                  </div>
                  {tempItem.colorMode !== 'Monochrome' && (
                    <div>
                      Color (CMY): {tempItem.avgCoverageCMY}% Coverage = {formatLAK(costing.totalInkCostCMY)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: Cutting Process (ກະບວນການຕັດ) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase block">Step 3</span>
                  <h4 className="font-black text-sm text-slate-900">ກະບວນການຕັດ (Cutting Process)</h4>
                </div>
              </div>

              {/* Toggle Skip Cutting */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={tempItem.skipCutting}
                  onChange={(e) => setTempItem({ ...tempItem, skipCutting: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span>ບໍ່ໃຊ້ເຄື່ອງຕັດ (Skip Cutting)</span>
              </label>
            </div>

            {!tempItem.skipCutting && (
              <div className="space-y-3 text-xs font-bold text-slate-700 animate-fade-in">
                <div className="space-y-1">
                  <label className="block text-slate-600">ເຄື່ອງຕັດທີ່ໃຊ້ (Cutting Equipment)</label>
                  <select
                    value={tempItem.cuttingEquipmentId}
                    onChange={(e) => setTempItem({ ...tempItem, cuttingEquipmentId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">-- ເລືອກເຄື່ອງຕັດຈາກ Master Equipment --</option>
                    {cutters.map(ct => (
                      <option key={ct.id} value={ct.id}>{ct.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500">ຄ່າບໍລິການຕັດຊິ້ນງານ (Flat Cutting Fee):</span>
                  <span className="font-mono font-black text-emerald-700">{formatLAK(tempItem.cuttingFee || 5000)}</span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 4: Lamination / Coating (ການເຄືອບຜິວ) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-600 uppercase block">Step 4</span>
                  <h4 className="font-black text-sm text-slate-900">ການເຄືອບຜິວ (Lamination & Coating)</h4>
                </div>
              </div>

              {/* Toggle No Coating */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={tempItem.noCoating}
                  onChange={(e) => setTempItem({ ...tempItem, noCoating: e.target.checked, useLamination: !e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <span>ບໍ່ມີການເຄືອບ (No Coating)</span>
              </label>
            </div>

            {!tempItem.noCoating && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700 animate-fade-in">
                <div className="space-y-1">
                  <label className="block text-slate-600">ປະເພດການເຄືອບ (Coating Type)</label>
                  <select
                    value={tempItem.laminationType || 'Glossy'}
                    onChange={(e) => setTempItem({ ...tempItem, laminationType: e.target.value, useLamination: true })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white font-bold text-xs focus:outline-none"
                  >
                    <option value="Glossy">ເຄືອບເງົາ (Glossy Lamination)</option>
                    <option value="Matte">ເຄືອບດ້ານ (Matte Lamination)</option>
                    <option value="SoftTouch">Soft Touch Velvet</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-600">ຈຳນວນແຜ່ນເປົ້າໝາຍ (Coating Sheets)</label>
                  <input
                    type="number"
                    value={tempItem.coatingSheets || costing.totalParentSheets}
                    onChange={(e) => setTempItem({ ...tempItem, coatingSheets: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* STEP 5: Binding Process (ການເຂົ້າເລົ່ມ) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase block">Step 5</span>
                  <h4 className="font-black text-sm text-slate-900">ກະບວນການເຂົ້າເລົ່ມ (Binding Process)</h4>
                </div>
              </div>

              {/* Toggle No Binding */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={tempItem.noBinding}
                  onChange={(e) => setTempItem({ ...tempItem, noBinding: e.target.checked, useBinding: !e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span>ບໍ່ມີການເຂົ້າເລົ່ມ (No Binding)</span>
              </label>
            </div>

            {!tempItem.noBinding && (
              <div className="space-y-3 text-xs font-bold text-slate-700 animate-fade-in">
                <label className="block text-slate-600">ຮູບແບບການເຂົ້າເລົ່ມ (Binding Style)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Staple', name: 'ມຸງຫຼັງຄາ' },
                    { id: 'Perfect', name: 'ສັ້ນກາວຮ້ອນ' },
                    { id: 'Spiral', name: 'ສັ້ນຫ່ວງ' },
                    { id: 'Calendar', name: 'ເຂົ້າເລົ່ມປະຕິທິນ' }
                  ].map(style => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setTempItem({ ...tempItem, bindingType: style.id, useBinding: true })}
                      className={`p-3 rounded-xl border text-xs font-black transition text-center ${
                        tempItem.bindingType === style.id && !tempItem.noBinding
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* STEP 6: Custom Finishing Options (ບໍລິການເສີມ Custom) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-pink-50 text-pink-600 rounded-xl border border-pink-100">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black text-pink-600 uppercase block">Step 6</span>
                <h4 className="font-black text-sm text-slate-900">ບໍລິການເສີມ Custom (Custom Finishing)</h4>
              </div>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-700">
              {/* List added custom options */}
              {tempItem.customFinishingOptions && tempItem.customFinishingOptions.length > 0 && (
                <div className="space-y-2">
                  {tempItem.customFinishingOptions.map((opt, index) => (
                    <div key={index} className="flex justify-between items-center bg-pink-50/50 border border-pink-100 p-2.5 rounded-xl text-pink-900">
                      <div>
                        <span className="block font-black">{opt.name}</span>
                        <span className="text-[10px] text-pink-700">({opt.chargeType === 'FIXED_JOB' ? 'ຄົງທີ່' : opt.chargeType === 'PER_UNIT' ? 'ຕໍ່ຊິ້ນ' : 'ຕໍ່ ຕຣ.ມ.'})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-pink-800">{formatLAK(opt.price)}</span>
                        <button
                          type="button"
                          onClick={() => removeCustomFinishing(index)}
                          className="text-red-500 hover:text-red-700 font-bold px-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add form */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="space-y-1">
                  <label className="block text-slate-600">ຊື່ບໍລິການເສີມ (Service Name)</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="เช่น ปั๊มทอง, เคลือบ Spot UV"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-slate-600">วิธีคิดเงิน (Charge Type)</label>
                    <select
                      value={customChargeType}
                      onChange={(e) => setCustomChargeType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-xs"
                    >
                      <option value="FIXED_JOB">เหมาจ่าย (Fixed Job)</option>
                      <option value="PER_UNIT">ต่อชิ้น (Per Unit)</option>
                      <option value="PER_SQM">ต่อ ตร.ม. (Per Sqm)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-600">ราคา (LAK Price)</label>
                    <input
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-xs text-center"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addCustomFinishing}
                  className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white font-black text-xs rounded-xl shadow transition"
                >
                  + เพิ่มบริการเสริม Custom
                </button>
              </div>
            </div>
          </div>

          {/* STEP 7: Overhead Settings (ຕັ້ງຄ່າຄ່າໂສ້ຫຸ້ຍ) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-slate-50 text-slate-600 rounded-xl border border-slate-200">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase block">Step 7</span>
                <h4 className="font-black text-sm text-slate-900">ຄ່າໂສ້ຫຸ້ຍຮ້ານ (Overhead Cost Settings)</h4>
              </div>
            </div>
            <div className="space-y-3 text-xs font-bold text-slate-700">
              <div className="flex justify-between items-center">
                <span>Overhead Rate (%):</span>
                <span className="font-mono text-slate-800 text-sm">{tempItem.overheadPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={tempItem.overheadPercent}
                onChange={(e) => setTempItem({ ...tempItem, overheadPercent: Number(e.target.value) })}
                className="w-full accent-slate-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Column 2: Sticky Live Internal Cost Breakdown Sidebar (Right Panel - LIGHT THEME) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          <div className="bg-white border border-slate-200 p-6 sm:p-7 rounded-3xl shadow-sm space-y-6">
            {/* Go Backend Pricing Engine Status Banner */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-bold transition ${
              isCalculatingBackend 
                ? 'bg-sky-50 text-sky-800 border-sky-200' 
                : backendPricing 
                ? 'bg-emerald-50/80 text-emerald-900 border-emerald-200' 
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}>
              <div className="flex items-center gap-2">
                {isCalculatingBackend ? (
                  <RefreshCw className="w-4 h-4 text-sky-600 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 text-emerald-600" />
                )}
                <span>
                  {isCalculatingBackend
                    ? 'กำลังคำนวณผ่าน Go Pricing Engine...'
                    : backendPricing
                    ? 'Go Pricing Engine: Connected ✅'
                    : `Engine Status: ${backendError || 'Offline'}`}
                </span>
              </div>
              {backendPricing && backendPricing.volume_discount_percent > 0 && (
                <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-2xs">
                  ⚡ Discount -{backendPricing.volume_discount_percent}% (Margin)
                </span>
              )}
            </div>

            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="font-black text-xs uppercase tracking-wider text-sky-600 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-500" />
                  <span>Direct Item Cost Breakdown</span>
                </span>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setBreakdownViewMode('total')}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition ${
                      breakdownViewMode === 'total' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isLao ? 'ລວມທັງໝົດ' : 'Total Batch'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBreakdownViewMode('unit')}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition ${
                      breakdownViewMode === 'unit' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isLao ? 'ຕໍ່ 1 ແຜ່ນ' : 'Per Unit'}
                  </button>
                </div>
              </div>

              {/* Direct Material, Ink, Depreciation, Finishing & Overhead Cost Items */}
              {(() => {
                const qtyScale = breakdownViewMode === 'unit' ? Math.max(1, tempItem.quantity || 1) : 1;
                return (
                  <div className="space-y-3 text-xs font-semibold text-slate-700">
                    {/* 1. Paper Cost */}
                    <div className="flex justify-between items-center bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                      <span className="text-slate-600 font-bold">1. ຕົ້ນທຶນເຈ້ຍ (Paper Cost):</span>
                      <span className="font-sans font-black text-slate-900 text-sm">
                        {formatLAK(Math.round((backendPricing ? backendPricing.paper_cost : costing.totalPaperCost) / qtyScale))}
                      </span>
                    </div>

                    {/* 2. Black Ink Cost */}
                    <div className="flex justify-between items-center bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                      <span className="text-slate-600 font-bold">2. ຕົ້ນທຶນໝຶກດຳ (Black Ink K):</span>
                      <span className="font-sans font-black text-slate-900 text-sm">
                        {formatLAK(Math.round((backendPricing ? backendPricing.ink_cost_k : costing.totalInkCostK) / qtyScale))}
                      </span>
                    </div>

                    {/* 3. Color Ink Cost */}
                    {!costing.isMonochrome && (
                      <div className="flex justify-between items-center bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                        <span className="text-slate-600 font-bold">3. ຕົ້ນທຶນໝຶກສີ (Color Ink CMY):</span>
                        <span className="font-sans font-black text-slate-900 text-sm">
                          {formatLAK(Math.round((backendPricing ? backendPricing.ink_cost_cmy : costing.totalInkCostCMY) / qtyScale))}
                        </span>
                      </div>
                    )}

                    {/* 4. Machine Depreciation & Maintenance */}
                    <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-bold">4. ຄ່າເສື່ອມ & ບຳລຸງຮັກສາເຄື່ອງພິມ:</span>
                        <span className="font-sans font-black text-slate-900 text-sm">
                          {formatLAK(Math.round((backendPricing ? (backendPricing.depreciation_cost + backendPricing.maintenance_cost) : (costing.depreciationCost + costing.maintenanceCost)) / qtyScale))}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono font-normal">
                        Depreciation: {formatLAK(Math.round((backendPricing ? backendPricing.depreciation_cost : costing.depreciationCost) / qtyScale))} | Maint: {formatLAK(Math.round((backendPricing ? backendPricing.maintenance_cost : costing.maintenanceCost) / qtyScale))}
                      </div>
                    </div>

                    {/* 5. Finishing & Custom Post-Print Process */}
                    <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-bold">5. ວຽກຫຼັງພິມ & ບໍລິການເສີມ (Setup + Finishing):</span>
                        <span className="font-sans font-black text-slate-900 text-sm">
                          {formatLAK(Math.round((backendPricing ? (backendPricing.setup_cost + backendPricing.finishing_cost) : (costing.cuttingCost + costing.laminationCost + costing.bindingCost + costing.customFinishingCost + costing.setupCost)) / qtyScale))}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono font-normal">
                        SetupCost: {formatLAK(Math.round((backendPricing ? backendPricing.setup_cost : 50000) / qtyScale))} | Finishing: {formatLAK(Math.round((backendPricing ? backendPricing.finishing_cost : (costing.cuttingCost + costing.laminationCost + costing.bindingCost + costing.customFinishingCost)) / qtyScale))}
                      </div>
                    </div>

                    {/* Direct Material & Machine Cost Banner */}
                    <div className="bg-slate-100/80 p-3.5 rounded-2xl border border-slate-200 flex justify-between items-center text-slate-900 font-black text-xs">
                      <span>Direct Cost Subtotal {breakdownViewMode === 'unit' ? '(Per Sheet)' : ''}:</span>
                      <span className="font-sans text-sky-700">
                        {formatLAK(Math.round((backendPricing ? backendPricing.direct_cost : costing.directCost) / qtyScale))}
                      </span>
                    </div>

                    {/* 6. Overhead Cost */}
                    <div className="flex justify-between items-center bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                      <span className="text-slate-600 font-bold">6. ໂສ້ຫຸ້ຍຮ້ານ (Overhead Cost {tempItem.overheadPercent}%):</span>
                      <span className="font-sans font-black text-slate-900 text-sm">
                        {formatLAK(Math.round((backendPricing ? backendPricing.overhead_cost : costing.overheadCost) / qtyScale))}
                      </span>
                    </div>

                    {/* Total Cost (Direct + Overhead) */}
                    <div className="bg-slate-200/80 p-4 rounded-2xl border border-slate-300 flex justify-between items-center text-slate-900 font-black text-xs">
                      <span>ຕົ້ນທຶນລວມ (Total Internal Cost):</span>
                      <span className="text-lg font-sans text-slate-900">
                        {formatLAK(Math.round((backendPricing ? backendPricing.total_cost : costing.totalCost) / qtyScale))}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Profit Margin Slider & Pricing */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-600">Base Profit Margin (%):</span>
                  <span className="text-emerald-600 font-black font-sans text-base">
                    {tempItem.targetMarginPercent}%
                    {backendPricing && backendPricing.volume_discount_percent > 0 && (
                      <span className="text-xs text-emerald-800 font-semibold block text-right">
                        (Effective Margin: {(tempItem.targetMarginPercent * (1 - backendPricing.volume_discount_percent / 100)).toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={tempItem.targetMarginPercent}
                  onChange={(e) => setTempItem({ ...tempItem, targetMarginPercent: Number(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />

                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-800">ລາຄາສິນຄ້າລວມ (Item Sale Price):</span>
                    <span className="text-2xl font-black text-emerald-700 font-sans">
                      {formatLAK(backendPricing ? backendPricing.sale_price : costing.finalPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-emerald-800/80 font-bold border-t border-emerald-200/60 pt-2 mt-1">
                    <span>ລາຄາສະເລ່ຍຕໍ່ໜ່ວຍ (Unit Price):</span>
                    <span className="font-sans font-black text-emerald-900">
                      {formatLAK(backendPricing ? backendPricing.unit_price : costing.unitPrice)} / ຊິ້ນ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons in Sidebar */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs transition active:scale-95 flex items-center justify-center gap-2 border border-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ຍົກເລີກ / ກັບຄືນ</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ບັນທຶກສະເປັກ (Save Specs)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
