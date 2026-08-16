import React, { useState, useEffect, useMemo } from 'react';
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
  RefreshCw,
  Settings,
  Download,
  Palette,
  Cpu
} from 'lucide-react';
import ManualPrinterAllocator from './ManualPrinterAllocator';
import { PrinterAllocation, ColorChannel, FinishingProcessSetup } from '../types';

export function calculateItemCosting(item: any, inventory: any[] = [], equipment: any[] = []) {
  if (!item) return { 
    netCost: 0, finalPrice: 0, unitPrice: 0, cuts: 1, 
    totalParentSheets: 0, paperUnitCost: 0, inkUnitCost: 0, isMonochrome: false,
    combinedPaperInkRate: 0, totalPaperCost: 0, totalInkCost: 0, totalPaperInkCost: 0, 
    cuttingCost: 0, laminationCost: 0, bindingCost: 0,
    mediaType: 'Sheet-fed', totalSqMeters: 0, printerStdMl: 0.05, inkCostPerMl: 500,
    inkCostK: 0, inkCostCMY: 0, depreciationCost: 0, maintenanceCost: 0,
    customFinishingCost: 0, overheadCost: 0, totalCost: 0, directCost: 0,
    totalFinishingCost: 0, setupCost: 0
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
    const baseInkCostM2 = inkVolumePerM2 * (isMonochrome ? inkCostKPerMl : inkCostCMYPerMl);
    totalInkCost = Math.round(totalSqMeters * baseInkCostM2);
    totalPaperInkCost = totalPaperCost + totalInkCost;

    paperUnitCost = rollMaterialCostPerM2;
    inkUnitCost = Math.round(inkVolumePerM2 * (isMonochrome ? inkCostKPerMl : inkCostCMYPerMl));
    combinedPaperInkRate = paperUnitCost + inkUnitCost; // Cost per m2
  } else {
    // Sheet-fed Commercial Printing Calculation
    const paperItem = inventory ? inventory.find(p => p.id === item.paperId) : null;
    let parentW = 330, parentH = 480;
    if (paperItem?.technical_specs?.parent_width_mm) {
      parentW = Number(paperItem.technical_specs.parent_width_mm);
      parentH = Number(paperItem.technical_specs.parent_height_mm || 480);
    } else if (paperItem && paperItem.name?.includes('A4')) { 
      parentW = 210; parentH = 297; 
    } else if (paperItem && paperItem.name?.includes('A3')) {
      parentW = 297; parentH = 420;
    }

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
  customFinishingOptions.forEach((opt: any) => {
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
  const cuttingCost = (item.skipCutting || (!item.cuttingEquipmentId && item.cuttingFee === undefined)) ? 0 : Number(item.cuttingFee || 0);

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
    else if (item.bindingType === 'Perfect') bindingCost = qty * 1500;
    else if (item.bindingType === 'Spiral') bindingCost = qty * 3000;
    else if (item.bindingType === 'Calendar') bindingCost = qty * 4500;
    else bindingCost = qty * 1000;
  }

  // Setup & Finishing Costs
  const setupCost = Number(item.setupCost !== undefined ? item.setupCost : 20000);
  const totalFinishingCost = cuttingCost + laminationCost + bindingCost + customFinishingCost;

  // Direct Cost sum
  const directCost = totalPaperInkCost + totalMachineCost + setupCost + totalFinishingCost;

  // Overhead Cost calculation
  const overheadPercent = Number(item.overheadPercent !== undefined ? item.overheadPercent : 15) / 100;
  const overheadCost = Math.round(directCost * overheadPercent);

  // Total cost
  const totalCost = directCost + overheadCost;

  // Margin Pricing
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
    netCost: directCost,
    finalPrice,
    unitPrice,
    printerStdMl,
    inkCostPerMl
  };
}

export default function ItemSpecConfigurator({
  item,
  itemIndex = 0,
  allItems = [],
  inventory = [],
  equipment = [],
  formatLAK = (val: number) => `₭${(val || 0).toLocaleString()}`,
  onSave,
  onChange,
  onCancel,
  showToast,
  embeddedMode = false,
  mode = 'order',
  customerData,
  onCustomerChange,
  onExportPdf
}: {
  item?: any;
  itemIndex?: number;
  allItems?: any[];
  inventory?: any[];
  equipment?: any[];
  formatLAK?: (val: number) => string;
  onSave?: (updatedItem: any) => void;
  onChange?: (item: any) => void;
  onCancel?: () => void;
  showToast?: (msg: string, type?: string) => void;
  embeddedMode?: boolean;
  mode?: 'quotation' | 'order';
  customerData?: any;
  onCustomerChange?: any;
  onExportPdf?: any;
}) {
  const isLao = true;

  // Extract Paper Materials
  const papers = useMemo(() => {
    return inventory ? inventory.filter(p => 
      p.category?.toLowerCase() === 'paper' || 
      p.name?.includes('A4') || 
      p.name?.includes('A3') || 
      p.name?.includes('ອາດ') || 
      p.name?.includes('ປອນ') || 
      p.name?.includes('ສະຕິກເກີ') || 
      p.name?.includes('ຄຣາຟ') || 
      p.name?.includes('ກ່ອງ') || 
      p.id?.startsWith('LOT-')
    ) : [];
  }, [inventory]);

  // Extract Categories dynamically
  const paperCategories = useMemo(() => {
    const cats = new Set<string>();
    papers.forEach(p => {
      if (p.category) cats.add(p.category);
      else if (p.name?.includes('ອາດມັນ') || p.name?.includes('Gloss')) cats.add('Art Glossy (ອາດມັນ)');
      else if (p.name?.includes('ອາດດ້ານ') || p.name?.includes('Matte')) cats.add('Art Matte (ອາດດ້ານ)');
      else if (p.name?.includes('ປອນ') || p.name?.includes('Bond')) cats.add('Woodfree / Bond (ປອນ)');
      else if (p.name?.includes('ສະຕິກເກີ') || p.name?.includes('Sticker')) cats.add('Sticker / Label (ສຕິກເກີ)');
      else if (p.name?.includes('ກ່ອງ') || p.name?.includes('Box')) cats.add('Boxboard / Duplex (ກ່ອງ)');
      else cats.add('Standard Paper');
    });
    return ['All Categories', ...Array.from(cats)];
  }, [papers]);

  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const filteredPapers = useMemo(() => {
    if (selectedCategory === 'All Categories') return papers;
    return papers.filter(p => {
      if (p.category === selectedCategory) return true;
      if (selectedCategory.includes('Art Glossy') && (p.name?.includes('ອາດມັນ') || p.name?.includes('Gloss'))) return true;
      if (selectedCategory.includes('Art Matte') && (p.name?.includes('ອາດດ້ານ') || p.name?.includes('Matte'))) return true;
      if (selectedCategory.includes('Woodfree') && (p.name?.includes('ປອນ') || p.name?.includes('Bond'))) return true;
      if (selectedCategory.includes('Sticker') && (p.name?.includes('ສະຕິກເກີ') || p.name?.includes('Sticker'))) return true;
      if (selectedCategory.includes('Boxboard') && (p.name?.includes('ກ່ອງ') || p.name?.includes('Box'))) return true;
      return false;
    });
  }, [papers, selectedCategory]);

  const printers = useMemo(() => {
    return equipment ? equipment.filter(eq => 
      eq.category === 'Printer' || 
      eq.printerCategory || 
      eq.printerType || 
      eq.name?.includes('C6085') || 
      eq.name?.toLowerCase().includes('print') ||
      eq.name?.toLowerCase().includes('heidelberg') ||
      eq.name?.toLowerCase().includes('konica')
    ) : [];
  }, [equipment]);

  const activeFinishingMachinery = useMemo(() => {
    return equipment ? equipment.filter(eq => 
      eq.category !== 'Printer' && 
      (eq.status === 'ACTIVE' || eq.status === 'In Use' || eq.status === 'Ready' || !eq.status)
    ) : [];
  }, [equipment]);

  const defaultPaperId = papers.length > 0 ? papers[0].id : '';
  const defaultPrinterId = printers.length > 0 ? printers[0].id : '';

  const [tempItem, setTempItem] = useState({
    mediaType: 'Sheet-fed',
    paperId: item?.paperId || defaultPaperId,
    printerId: item?.printerId || defaultPrinterId,
    colorMode: item?.colorMode || 'Color',
    jobWidth: item?.jobWidth || 210,
    jobHeight: item?.jobHeight || 297,
    bleedMargin: item?.bleedMargin !== undefined ? item.bleedMargin : 2,
    itemsPerSheet: item?.itemsPerSheet || null,
    manualTotalSheets: item?.manualTotalSheets || null,
    avgCoverageK: item?.avgCoverageK !== undefined ? item.avgCoverageK : 5,
    avgCoverageCMY: item?.avgCoverageCMY !== undefined ? item.avgCoverageCMY : 10,
    customFinishingOptions: item?.customFinishingOptions || [],
    overheadPercent: item?.overheadPercent !== undefined ? item.overheadPercent : 15,
    setupCost: item?.setupCost !== undefined ? item.setupCost : 20000,
    skipCutting: item?.skipCutting !== undefined ? item.skipCutting : true,
    cuttingEquipmentId: item?.cuttingEquipmentId || '',
    cuttingFee: item?.cuttingFee !== undefined ? item.cuttingFee : 0,
    noCoating: item?.noCoating !== undefined ? item.noCoating : true,
    useLamination: item?.useLamination || false,
    laminationType: item?.laminationType || 'Glossy',
    coatingMachineId: item?.coatingMachineId || '',
    coatingSheets: item?.coatingSheets || 0,
    noBinding: item?.noBinding !== undefined ? item.noBinding : true,
    useBinding: item?.useBinding || false,
    bindingType: item?.bindingType || 'Staple',
    bindingMachineId: item?.bindingMachineId || '',
    spoilageRate: item?.spoilageRate || 5,
    targetMarginPercent: item?.targetMarginPercent || 35,
    manualUnitPrice: item?.manualUnitPrice || null,
    printerAllocations: item?.printerAllocations || (defaultPrinterId ? [{
      printer_id: defaultPrinterId,
      printer_name: printers[0]?.name || 'Primary Printer',
      allocated_pages: item?.quantity || 500,
      cost_per_page: printers[0]?.price ? (printers[0].price / 1000000) : 100,
      subtotal_cost: (item?.quantity || 500) * 100,
      color_mode: 'AVERAGE' as const,
      average_density_pct: 100,
      color_channels: [
        { channel_name: 'C', density_pct: 100, is_spot_color: false },
        { channel_name: 'M', density_pct: 100, is_spot_color: false },
        { channel_name: 'Y', density_pct: 100, is_spot_color: false },
        { channel_name: 'K', density_pct: 100, is_spot_color: false },
      ]
    }] : []),
    ...item
  });

  // State for Backend Go Pricing Engine Integration
  const [backendPricing, setBackendPricing] = useState<PricingCalculationResult | null>(null);
  const [isCalculatingBackend, setIsCalculatingBackend] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [breakdownViewMode, setBreakdownViewMode] = useState<'total' | 'unit'>('total');

  const costing = calculateItemCosting(tempItem, inventory, equipment);

  // Debounced effect calling Go Backend Pricing Engine API (/api/pricing/calculate)
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      setIsCalculatingBackend(true);
      setBackendError(null);

      const localCosting = calculateItemCosting(tempItem, inventory, equipment);
      const setupCost = Number(tempItem.setupCost !== undefined ? tempItem.setupCost : 50000);
      const qty = Math.max(1, Number(tempItem.quantity || 1));
      const totalFinishingCost = localCosting.cuttingCost + localCosting.laminationCost + localCosting.bindingCost + localCosting.customFinishingCost;
      const finishingCostPerUnit = totalFinishingCost / qty;

      calculateBackendPricing({
        job_name: tempItem.name || 'Print Job',
        quantity: qty,
        paper_sku: tempItem.paperId || 'default-paper',
        paper_cost_per_unit: localCosting.paperUnitCost,
        paper_format: tempItem.mediaType === 'Roll-fed' ? 'roll' : 'sheet',
        setup_cost: setupCost,
        finishing_cost: finishingCostPerUnit,
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
    tempItem.printerAllocations,
    tempItem.customFinishingOptions
  ]);

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = () => {
    setValidationError(null);
    if (!tempItem.quantity || Number(tempItem.quantity) <= 0) {
      setValidationError('ກະລຸນາປ້ອນຈຳນວນຜະລິດ (Quantity) ໃຫ້ຫຼາຍກວ່າ 0');
      return;
    }
    if (!tempItem.jobWidth || Number(tempItem.jobWidth) <= 0) {
      setValidationError('ກະລຸນາປ້ອນຄວາມກວ້າງ (Width) ໃຫ້ຫຼາຍກວ່າ 0 mm');
      return;
    }
    if (!tempItem.jobHeight || Number(tempItem.jobHeight) <= 0) {
      setValidationError('ກະລຸນາປ້ອນຄວາມສູງ (Height) ໃຫ້ຫຼາຍກວ່າ 0 mm');
      return;
    }
    if (!tempItem.paperId) {
      setValidationError('ກະລຸນາເລືອກເຈ້ຍຈາກຄັງສິນຄ້າ (Select Paper Item)');
      return;
    }

    if (onSave) {
      onSave({
        ...tempItem,
        isConfigured: true,
        calculatedPrice: backendPricing ? backendPricing.sale_price : costing.finalPrice,
        unitPrice: backendPricing ? backendPricing.unit_price : costing.unitPrice,
      });
    }
  };

  const selectedPaper = inventory ? inventory.find(p => p.id === tempItem.paperId) : null;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      {!embeddedMode && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← ບັນທຶກ & ກັບໄປຮາຍການ (Save & Return)</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 transition px-3.5 py-2.5 bg-slate-100 rounded-xl border border-slate-200"
            >
              ຍົກເລີກ
            </button>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-[11px] uppercase font-bold text-indigo-600 tracking-wider">
              Item Spec Configurator #{itemIndex + 1}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>{tempItem.name || 'Print Item'}</span>
            </h3>
          </div>
        </div>
      )}

      {/* Validation Error Banner */}
      {validationError && (
        <div className="bg-rose-50 border-2 border-rose-300 p-4 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-bold shadow-xs animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Main 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1: Configurator Inputs Form (Phases 2 to 5) */}
        <div className="lg:col-span-7 space-y-6">

          {/* PHASE 2: Job Overview & Dimensions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Sliders className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">
                ຂະໜາດງານ & ຈຳນວນຜະລິດ (Dimensions & Production Quantity)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <label className="block text-slate-600">ຈຳນວນຜະລິດ (Qty) *</label>
                <input
                  type="number"
                  min="1"
                  value={tempItem.quantity || 500}
                  onChange={(e) => setTempItem({ ...tempItem, quantity: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-3 py-2 border border-indigo-300 bg-indigo-50/40 rounded-xl text-center font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600">ກວ້າງ Width (mm) *</label>
                <input
                  type="number"
                  value={tempItem.jobWidth || 210}
                  onChange={(e) => setTempItem({ ...tempItem, jobWidth: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-center font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600">ສູງ Height (mm) *</label>
                <input
                  type="number"
                  value={tempItem.jobHeight || 297}
                  onChange={(e) => setTempItem({ ...tempItem, jobHeight: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-center font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* PHASE 3: Inventory Paper Selector (Cascading Dropdown) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">
                    ເລືອກເຈ້ຍຈາກຄັງສິນຄ້າ (Inventory Paper Selector)
                  </h4>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-700">
              {/* Step 1: Category Cascading Selector */}
              <div className="space-y-1">
                <label className="block text-slate-600 font-bold">1. ໝວດໝູ່ເຈ້ຍ (Paper Category):</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50 font-bold text-xs focus:ring-2 focus:ring-sky-500"
                >
                  {paperCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Step 2: Paper Item Selector */}
              <div className="space-y-1">
                <label className="block text-slate-600 font-bold">2. ລາຍການເຈ້ຍໃນຄັງ (Select Paper Item):</label>
                <select
                  value={tempItem.paperId}
                  onChange={(e) => setTempItem({ ...tempItem, paperId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white font-bold text-xs focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">-- ເລືອກລາຍການເຈ້ຍ --</option>
                  {filteredPapers.map(p => {
                    const price = p.costPerSheet || p.costPerConsumptionUnit || p.unitCost || 1200;
                    const stock = p.stockQty !== undefined ? p.stockQty : (p.stock_qty || 0);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.gsm ? `(${p.gsm} gsm)` : ''} — ຕົ້ນທຶນ: {formatLAK(price)}/ແຜ່ນ [ສະຕ໋ອກ: {stock.toLocaleString()} ແຜ່ນ]
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Paper spec auto-calculated details */}
              <div className="bg-sky-50/70 p-3.5 rounded-xl border border-sky-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-sky-800">ຈຳນວນຕັດຕໍ່ແຜ່ນໃຫຍ່ (Cut Layout / Up Count):</span>
                  <span className="font-bold text-sky-950 font-mono text-sm">{costing.cuts} ຊິ້ນ/ແຜ່ນ</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-sky-800">ຈຳນວນແຜ່ນໃຫຍ່ທີ່ຕ້ອງໃຊ້ (+ ເຜື່ອເສຍ {tempItem.spoilageRate}%):</span>
                  <span className="font-bold text-sky-950 font-mono text-sm">{costing.totalParentSheets.toLocaleString()} ແຜ່ນ</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-sky-200/60 pt-2 font-bold">
                  <span className="text-sky-900">ຕົ້ນທຶນເຈ້ຍລວມ (Total Paper Cost):</span>
                  <span className="text-sky-900 text-sm font-sans">{formatLAK(costing.totalPaperCost)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* PHASE 4: Multi-Printer Setup & Channel Color Separation */}
          <ManualPrinterAllocator
            targetQuantity={Number(tempItem.quantity || 500)}
            allocations={tempItem.printerAllocations || []}
            availablePrinters={printers.map(p => ({
              id: p.id,
              name: p.name,
              cost_per_page: p.price ? Math.round(p.price / 1000000) : (p.cost_per_page || 100),
              printerCategory: p.printerCategory || p.category,
              colorSchemeType: p.colorSchemeType || 'CMYK'
            }))}
            onAllocationsChange={(newAllocations) => {
              setTempItem({ ...tempItem, printerAllocations: newAllocations });
            }}
          />

          {/* PHASE 5: Post-Press Finishing & Active Machine Integration */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">
                ວຽກຫຼັງການພິມ & ເຄື່ອງຈັກ (Post-Press Finishing Assets)
              </h4>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-700">
              {/* Lamination Section */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={tempItem.useLamination}
                      onChange={(e) => setTempItem({ ...tempItem, useLamination: e.target.checked, noCoating: !e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span>ການເຄືອບຜິວ (Lamination)</span>
                  </label>
                  {tempItem.useLamination && (
                    <span className="font-mono text-indigo-700 font-bold">{formatLAK(costing.laminationCost)}</span>
                  )}
                </div>

                {tempItem.useLamination && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                    <select
                      value={tempItem.laminationType || 'Glossy'}
                      onChange={(e) => setTempItem({ ...tempItem, laminationType: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
                    >
                      <option value="Glossy">ເຄືອບເງົາ (Glossy Lamination)</option>
                      <option value="Matte">ເຄືອບດ້ານ (Matte Lamination)</option>
                      <option value="SoftTouch">Soft Touch Velvet</option>
                    </select>

                    <select
                      value={tempItem.coatingMachineId || ''}
                      onChange={(e) => setTempItem({ ...tempItem, coatingMachineId: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
                    >
                      <option value="">-- ເລືອກເຄື່ອງເຄືອບ (Status: ACTIVE) --</option>
                      {activeFinishingMachinery.map(m => (
                        <option key={m.id} value={m.id}>{m.name} [{m.status || 'ACTIVE'}]</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Binding Section */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={tempItem.useBinding}
                      onChange={(e) => setTempItem({ ...tempItem, useBinding: e.target.checked, noBinding: !e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span>ການເຂົ້າເລົ່ມ (Binding)</span>
                  </label>
                  {tempItem.useBinding && (
                    <span className="font-mono text-indigo-700 font-bold">{formatLAK(costing.bindingCost)}</span>
                  )}
                </div>

                {tempItem.useBinding && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                    <select
                      value={tempItem.bindingType || 'Staple'}
                      onChange={(e) => setTempItem({ ...tempItem, bindingType: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
                    >
                      <option value="Staple">ມຸງຫຼັງຄາ (Saddle Stitch)</option>
                      <option value="Perfect">ສັນກາວຮ້ອນ (Perfect Hot Melt)</option>
                      <option value="Spiral">ສັນຫ່ວງ (Spiral Binding)</option>
                      <option value="Calendar">ເຂົ້າເລົ່ມປະຕິທິນ (Calendar)</option>
                    </select>

                    <select
                      value={tempItem.bindingMachineId || ''}
                      onChange={(e) => setTempItem({ ...tempItem, bindingMachineId: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
                    >
                      <option value="">-- ເລືອກເຄື່ອງເຂົ້າເລົ່ມ (Status: ACTIVE) --</option>
                      {activeFinishingMachinery.map(m => (
                        <option key={m.id} value={m.id}>{m.name} [{m.status || 'ACTIVE'}]</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Cost Summary Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 sticky top-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="font-bold text-xs uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Cost & Quotation Breakdown</span>
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                <button
                  type="button"
                  onClick={() => setBreakdownViewMode('total')}
                  className={`px-2.5 py-1 font-bold rounded-md transition ${
                    breakdownViewMode === 'total' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                  }`}
                >
                  ລວມ
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownViewMode('unit')}
                  className={`px-2.5 py-1 font-bold rounded-md transition ${
                    breakdownViewMode === 'unit' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                  }`}
                >
                  ຕໍ່ໜ່ວຍ
                </button>
              </div>
            </div>

            <div className="space-y-2.5 text-xs font-semibold text-slate-700">
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                <span>1. ຕົ້ນທຶນເຈ້ຍ (Paper):</span>
                <span className="font-mono font-bold text-slate-900">{formatLAK(costing.totalPaperCost)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                <span>2. ຕົ້ນທຶນໝຶກ & ເຄື່ອງພິມ (Ink & Plates):</span>
                <span className="font-mono font-bold text-slate-900">{formatLAK(costing.totalInkCost + costing.depreciationCost)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                <span>3. ວຽກຫຼັງພິມ & ເຄື່ອງຈັກ (Finishing):</span>
                <span className="font-mono font-bold text-slate-900">{formatLAK(costing.totalFinishingCost)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                <span>4. ໂສ້ຫຸ້ຍຮ້ານ (Overhead {tempItem.overheadPercent}%):</span>
                <span className="font-mono font-bold text-slate-900">{formatLAK(costing.overheadCost)}</span>
              </div>

              <div className="bg-slate-100 p-3 rounded-xl flex justify-between items-center text-xs font-bold text-slate-900">
                <span>ຕົ້ນທຶນພາຍໃນລວມ (Total Cost):</span>
                <span className="font-mono text-sm">{formatLAK(costing.totalCost)}</span>
              </div>

              {/* Profit Margin & Selling Price */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-600">Base Profit Margin:</span>
                  <span className="text-emerald-600 font-bold text-sm">{tempItem.targetMarginPercent}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={tempItem.targetMarginPercent}
                  onChange={(e) => setTempItem({ ...tempItem, targetMarginPercent: Number(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />

                <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 space-y-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-800">ລາຄາຂາຍລວມ (Sale Price):</span>
                    <span className="text-xl font-extrabold text-emerald-700 font-sans">
                      {formatLAK(backendPricing ? backendPricing.sale_price : costing.finalPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-emerald-800/80 font-semibold border-t border-emerald-200/60 pt-2">
                    <span>ລາຄາຕໍ່ໜ່ວຍ (Unit Price):</span>
                    <span className="font-bold text-emerald-950 font-mono">
                      {formatLAK(backendPricing ? backendPricing.unit_price : costing.unitPrice)} / ຊິ້ນ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ບັນທຶກສະເປັກ (Save)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
