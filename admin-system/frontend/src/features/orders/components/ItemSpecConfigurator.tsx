import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateBackendPricing, PricingCalculationResult } from '@features/pricing';
import { calculateMachineUnitCost } from '@utils/machineCostCalculator';
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
  Layers3,
  BookOpen, 
  Sparkles, 
  Info, 
  Maximize2, 
  Zap, 
  RefreshCw, 
  Settings, 
  Download, 
  Palette, 
  Cpu,
  Bookmark,
  Calendar,
  FileText,
  Wrench,
  Truck,
  Plus,
  Trash2,
  Tag,
  Boxes,
  HelpCircle,
  TrendingUp,
  Percent,
  Coins,
  DollarSign,
  User,
  Hash,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ManualPrinterAllocator from './ManualPrinterAllocator';
import { PrinterAllocation, ColorChannel } from '../types';
import { 
  FinishingMaterialItem, 
  PricingTemplatePreset, 
  DEFAULT_PRICING_TEMPLATES 
} from '@features/pricing/data/defaultTemplates';
import { PricingTemplatesModal } from '@features/pricing/components/PricingTemplatesModal';
import { QuotationSaveTemplateModal } from '@features/pricing/components/QuotationSaveTemplateModal';

export interface ItemModuleToggles {
  paper: boolean;
  printEngine: boolean;
  postPressMachinery: boolean;
  finishingMaterials: boolean;
}

export function calculateItemCosting(item: any, inventory: any[] = [], equipment: any[] = []) {
  if (!item) return { 
    netCost: 0, finalPrice: 0, unitPrice: 0, cuts: 1, 
    totalParentSheets: 0, paperUnitCost: 0, inkUnitCost: 0, isMonochrome: false,
    combinedPaperInkRate: 0, totalPaperCost: 0, totalInkCost: 0, totalPaperInkCost: 0, 
    cuttingCost: 0, laminationCost: 0, bindingCost: 0,
    mediaType: 'Sheet-fed', totalSqMeters: 0, printerStdMl: 0.05, inkCostPerMl: 500,
    inkCostK: 0, inkCostCMY: 0, depreciationCost: 0, maintenanceCost: 0,
    customFinishingCost: 0, overheadCost: 0, totalCost: 0, directCost: 0,
    totalFinishingCost: 0, setupCost: 0, postPressCost: 0, finishingMaterialsCost: 0,
    itemSpoilageRate: 5, wastedSheets: 0, parentSheetsNeeded: 0
  };

  const mediaType = item.mediaType || 'Sheet-fed';
  const isRollFed = mediaType === 'Roll-fed';
  const qty = Math.max(1, Number(item.quantity || item.printVolume || 1));
  const isMonochrome = item.colorMode === 'Monochrome' || item.colorPrintMode === 'MONO_K' || item.printColorMode === 'Monochrome';

  // Paper & Substrate Calculation
  const jobW = Number(item.jobWidth || 210);
  const jobH = Number(item.jobHeight || 297);
  const totalSqMetersForJob = (jobW / 1000.0) * (jobH / 1000.0) * qty;

  let totalPaperCost = 0;
  let paperUnitCost = 0;
  let cuts = 1;
  let parentSheetsNeeded = 1;
  let totalParentSheets = 1;
  let wastedSheets = 0;
  let totalSqMeters = 0;

  // Auto Spoilage Tier
  const itemSpoilageRate = item.spoilagePercent !== undefined 
    ? Number(item.spoilagePercent) 
    : (qty <= 100 ? 10 : qty <= 500 ? 7 : qty <= 2000 ? 5 : 3);

  const hasPaperModule = item.activeModules ? item.activeModules.paper : true;

  if (hasPaperModule) {
    if (isRollFed) {
      totalSqMeters = Math.round(totalSqMetersForJob * 100) / 100;
      const rollItem = inventory ? inventory.find(p => p.id === item.paperId) : null;
      const rollMaterialCostPerM2 = rollItem ? (rollItem.costPerM2 || rollItem.costPerSheet || 15000) : Number(item.rollMaterialCostPerM2 || 15000);
      totalPaperCost = Math.round(totalSqMeters * rollMaterialCostPerM2);
      paperUnitCost = rollMaterialCostPerM2;
    } else {
      const paperItem = inventory ? inventory.find(p => p.id === item.paperId) : null;
      let parentW = 330, parentH = 480;
      if (paperItem?.technical_specs?.parent_width_mm) {
        parentW = Number(paperItem.technical_specs.parent_width_mm);
        parentH = Number(paperItem.technical_specs.parent_height_mm || 480);
      } else if (paperItem && paperItem.name?.includes('A4')) { 
        parentW = 210; parentH = 297; 
      } else if (paperItem && paperItem.name?.includes('A3')) { 
        parentW = 330; parentH = 480; 
      }

      const bleed = item.bleedMargin !== undefined ? item.bleedMargin : 2;
      const cutOption1 = Math.floor(parentW / (jobW + bleed)) * Math.floor(parentH / (jobH + bleed));
      const cutOption2 = Math.floor(parentW / (jobH + bleed)) * Math.floor(parentH / (jobW + bleed));
      cuts = Math.max(1, cutOption1, cutOption2);
      
      parentSheetsNeeded = Math.ceil(qty / cuts);
      wastedSheets = Math.ceil(parentSheetsNeeded * (itemSpoilageRate / 100));
      totalParentSheets = parentSheetsNeeded + wastedSheets;

      paperUnitCost = paperItem ? (paperItem.costPerConsumptionUnit || paperItem.costPerSheet || 1860) : 1860;
      totalPaperCost = Math.round(totalParentSheets * paperUnitCost);
    }
  }

  // Printing Process & Ink & Machine Overhead Calculation
  let totalInkCost = 0;
  let totalInkCostK = 0;
  let totalInkCostCMY = 0;
  let depreciationCost = 0;
  let electricityCost = 0;
  let maintenanceCost = 0;
  let printerStdMl = 0.05;
  let inkCostPerMl = 500;

  const hasPrintEngineModule = item.activeModules ? item.activeModules.printEngine : true;

  if (hasPrintEngineModule) {
    const allocations: PrinterAllocation[] = (item.printerAllocations && item.printerAllocations.length > 0)
      ? item.printerAllocations
      : [{
          printer_id: item.printerId || 'default-printer',
          printer_name: 'Primary Printer',
          allocated_pages: qty,
          cost_per_page: 50,
          ink_cost_per_page: 100,
          subtotal_cost: qty * 150,
          color_mode: isMonochrome ? 'MONO_K' : 'CMYK',
          average_density_pct: 15,
          color_channels: [
            { channel_name: 'C', density_pct: Number(item.cCoverage || item.avgCoverageCMY || 15), is_spot_color: false },
            { channel_name: 'M', density_pct: Number(item.mCoverage || item.avgCoverageCMY || 15), is_spot_color: false },
            { channel_name: 'Y', density_pct: Number(item.yCoverage || item.avgCoverageCMY || 15), is_spot_color: false },
            { channel_name: 'K', density_pct: Number(item.kCoverage || item.avgCoverageK || 15), is_spot_color: false }
          ]
        }];

    allocations.forEach((alloc) => {
      const prn = equipment ? equipment.find(e => e.id === alloc.printer_id) : null;
      const allocPages = Number(alloc.allocated_pages || 0);
      const sideFactor = item.isDoubleSided ? 2 : 1;
      const areaFactor = Math.max(0.5, (jobW * jobH) / (210 * 297));

      let cCov = 0, mCov = 0, yCov = 0, kCov = 0;
      if (alloc.color_mode === 'MONO_K') {
        const kChan = alloc.color_channels?.find(c => c.channel_name === 'K');
        kCov = kChan ? kChan.density_pct : (alloc.average_density_pct || 15);
      } else {
        cCov = alloc.color_channels?.find(c => c.channel_name === 'C')?.density_pct ?? 15;
        mCov = alloc.color_channels?.find(c => c.channel_name === 'M')?.density_pct ?? 15;
        yCov = alloc.color_channels?.find(c => c.channel_name === 'Y')?.density_pct ?? 15;
        kCov = alloc.color_channels?.find(c => c.channel_name === 'K')?.density_pct ?? 15;
      }

      const computeChannel = (channelName: string, covPct: number) => {
        if (covPct <= 0) return { ml: 0, cost: 0 };
        let rateMlPerSheet = Number(prn?.inkConsumptionStandard || 0.05);
        let costPerMl = Number(prn?.inkUnitCostMl || 500);

        const ml = rateMlPerSheet * (covPct / 5) * areaFactor * allocPages * sideFactor;
        const cost = ml * costPerMl;
        return { ml, cost };
      };

      const cRes = computeChannel('C', cCov);
      const mRes = computeChannel('M', mCov);
      const yRes = computeChannel('Y', yCov);
      const kRes = computeChannel('K', kCov);

      totalInkCostK += kRes.cost;
      totalInkCostCMY += (cRes.cost + mRes.cost + yRes.cost);
      totalInkCost += (cRes.cost + mRes.cost + yRes.cost + kRes.cost);

      const prnPrice = Number(prn?.purchasePrice || prn?.purchaseCost || prn?.price || 0);
      const maintRate = Number((prn as any)?.maintenanceRatePercent || 20);
      const lifePages = Number((prn as any)?.expectedLifeA4Pages || 500000);
      const costPerPageFallback = Number(alloc.cost_per_page || 50);

      const machineCalc = calculateMachineUnitCost({
        purchase_price_lak: prnPrice,
        expected_life_pages: lifePages,
        maintenance_rate_percent: maintRate
      });

      const deprPerSheet = machineCalc.totalMachineCost > 0
        ? machineCalc.totalMachineCost * areaFactor
        : costPerPageFallback;

      depreciationCost += Math.round(deprPerSheet * allocPages * sideFactor);
      electricityCost += Math.round(allocPages * sideFactor * 40);
    });
  }

  const machineOverhead = depreciationCost + electricityCost;

  // Post-Press Machinery Cost
  const hasPostPressModule = item.activeModules ? item.activeModules.postPressMachinery : true;
  let postPressCost = 0;
  if (hasPostPressModule) {
    postPressCost = (item.selectedPostPressIds || []).reduce((sum: number, machId: string) => {
      const mach = equipment.find(e => e.id === machId);
      if (!mach) return sum;
      const rate = Number((mach as any).costPerPage) || Number((mach as any).calculatedCostPerPage) || 300;
      return sum + Math.round(rate * qty);
    }, 0);
  }

  // Finishing Materials & Consumables Cost
  const hasFinishingMaterialsModule = item.activeModules ? item.activeModules.finishingMaterials : true;
  let finishingMaterialsCost = 0;
  if (hasFinishingMaterialsModule) {
    finishingMaterialsCost = (item.finishingMaterials || []).reduce((sum: number, mat: FinishingMaterialItem) => {
      const uCost = Number(mat.unitCost) || 0;
      const q = Number(mat.qtyPerItem) || 1;
      return sum + Math.round(uCost * q * qty);
    }, 0);
  }

  // Direct Cost
  const directCost = totalPaperCost + totalInkCost + machineOverhead + postPressCost + finishingMaterialsCost;
  const netCost = directCost;

  // Margin Pricing
  const targetMargin = Number(item.profitMargin !== undefined ? item.profitMargin : (item.targetMarginPercent || 35)) / 100;
  const clampedMargin = Math.min(0.99, Math.max(0, targetMargin));
  const baseSellingPrice = Math.round(netCost / (1.0 - clampedMargin));
  const discountAmt = Math.round(baseSellingPrice * (Number(item.discountPercent || 0) / 100));
  const finalSellingPrice = item.manualUnitPrice !== null && item.manualUnitPrice !== undefined 
    ? Math.round(Number(item.manualUnitPrice) * qty)
    : (baseSellingPrice - discountAmt);

  const unitPrice = qty > 0 ? Math.round(finalSellingPrice / qty) : 0;
  const unitCost = qty > 0 ? Math.round(netCost / qty) : 0;

  return {
    mediaType,
    cuts,
    parentSheetsNeeded,
    totalParentSheets,
    wastedSheets,
    itemSpoilageRate,
    totalSqMeters,
    paperUnitCost,
    inkUnitCost: Math.round(totalInkCost / qty),
    isMonochrome,
    combinedPaperInkRate: Math.round((totalPaperCost + totalInkCost) / qty),
    setupCost: 0,
    totalPaperCost,
    totalInkCost,
    totalInkCostK: Math.round(totalInkCostK),
    totalInkCostCMY: Math.round(totalInkCostCMY),
    totalPaperInkCost: totalPaperCost + totalInkCost,
    depreciationCost,
    maintenanceCost,
    customFinishingCost: 0,
    postPressCost,
    finishingMaterialsCost,
    totalFinishingCost: postPressCost + finishingMaterialsCost,
    overheadCost: machineOverhead,
    directCost,
    totalCost: netCost,
    netCost,
    finalPrice: finalSellingPrice,
    unitPrice,
    unitCost,
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
  customerData
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
}) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  // Extract Available Papers
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

  const postPressEquipment = useMemo(() => {
    return equipment ? equipment.filter(eq => 
      eq.category !== 'Printer' && 
      (eq.status === 'ACTIVE' || eq.status === 'In Use' || eq.status === 'Ready' || !eq.status)
    ) : [];
  }, [equipment]);

  const defaultPaperId = papers.length > 0 ? papers[0].id : '';
  const defaultPrinterId = printers.length > 0 ? printers[0].id : '';

  // Initialize Custom Templates from localStorage to sync with QuotationManager
  const [customTemplates, setCustomTemplates] = useState<PricingTemplatePreset[]>(() => {
    try {
      const saved = localStorage.getItem('som_sing_custom_pricing_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedPresetIds, setDeletedPresetIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('som_sing_deleted_preset_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allAvailableTemplates = [
    ...DEFAULT_PRICING_TEMPLATES.filter(t => !deletedPresetIds.includes(t.id)),
    ...customTemplates,
  ];

  // Accordion Open/Collapse Phases State (Phases 1 to 6)
  const [openPhases, setOpenPhases] = useState<Record<string, boolean>>({
    phase1: true,
    phase2: true,
    phase3: true,
    phase4: true,
    phase5: true,
    phase6: true,
  });

  const togglePhase = (phaseKey: string) => {
    setOpenPhases(prev => ({ ...prev, [phaseKey]: !prev[phaseKey] }));
  };

  const toggleAllPhases = (expand: boolean) => {
    setOpenPhases({
      phase1: expand,
      phase2: expand,
      phase3: expand,
      phase4: expand,
      phase5: expand,
      phase6: expand,
    });
  };

  // Initialize State
  const [tempItem, setTempItem] = useState(() => {
    const base = {
      mediaType: 'Sheet-fed',
      paperId: item?.paperId || defaultPaperId,
      printerId: item?.printerId || defaultPrinterId,
      jobSizePreset: item?.jobSizePreset || 'A4',
      jobWidth: item?.jobWidth || 210,
      jobHeight: item?.jobHeight || 297,
      bleedMargin: item?.bleedMargin !== undefined ? item.bleedMargin : 2,
      isDoubleSided: Boolean(item?.isDoubleSided),
      colorPrintMode: item?.colorPrintMode || item?.colorMode || 'CMYK',
      cCoverage: item?.cCoverage !== undefined ? item.cCoverage : (item?.avgCoverageCMY || 15),
      mCoverage: item?.mCoverage !== undefined ? item.mCoverage : (item?.avgCoverageCMY || 15),
      yCoverage: item?.yCoverage !== undefined ? item.yCoverage : (item?.avgCoverageCMY || 15),
      kCoverage: item?.kCoverage !== undefined ? item.kCoverage : (item?.avgCoverageK || 15),
      selectedPostPressIds: item?.selectedPostPressIds || [],
      finishingMaterials: item?.finishingMaterials || [
        { 
          id: `mat-staple-${Date.now()}`, 
          name: 'ລວດເຢັບແມັກມຸງຫຼັງຄາ (Staple Wire)', 
          calcMode: 'box',
          packagePrice: 50000,
          unitsPerPackage: 1000,
          unitCost: 50, 
          qtyPerItem: 2, 
          unitName: 'ໂຕ',
          category: 'staple' 
        }
      ],
      activeModules: item?.activeModules || {
        paper: true,
        printEngine: true,
        postPressMachinery: true,
        finishingMaterials: true
      },
      selectedTemplateId: item?.selectedTemplateId || 'TPL_BOOKLET_STAPLE',
      profitMargin: item?.profitMargin !== undefined ? item.profitMargin : (item?.targetMarginPercent || 35),
      discountPercent: item?.discountPercent || 0,
      spoilagePercent: item?.spoilagePercent,
      printerAllocations: item?.printerAllocations || (defaultPrinterId ? [{
        printer_id: defaultPrinterId,
        printer_name: printers[0]?.name || 'Primary Printer',
        allocated_pages: item?.quantity || 500,
        cost_per_page: printers[0]?.price ? (printers[0].price / 1000000) : 50,
        subtotal_cost: (item?.quantity || 500) * 50,
        color_mode: (item?.colorPrintMode || item?.colorMode || 'CMYK') === 'MONO_K' ? 'MONO_K' : 'CMYK',
        average_density_pct: 15,
        color_channels: [
          { channel_name: 'C', density_pct: 15, is_spot_color: false },
          { channel_name: 'M', density_pct: 15, is_spot_color: false },
          { channel_name: 'Y', density_pct: 15, is_spot_color: false },
          { channel_name: 'K', density_pct: 15, is_spot_color: false },
        ]
      }] : []),
      ...item
    };
    return base;
  });

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({
    nameLao: '',
    nameEn: '',
    category: 'book',
    description: '',
  });

  const [newMaterialForm, setNewMaterialForm] = useState({
    name: '',
    unitCost: 100,
    qtyPerItem: 1,
    unitName: 'ອັນ'
  });
  const [showAddMaterial, setShowAddMaterial] = useState(false);

  const costing = useMemo(() => {
    return calculateItemCosting(tempItem, inventory, equipment);
  }, [tempItem, inventory, equipment]);

  // Smart Offcut Suggestion Logic
  const matchingOffcut = useMemo(() => {
    if (!inventory || !Array.isArray(inventory)) return null;
    const jobW = Number(tempItem.jobWidth || 210);
    const jobH = Number(tempItem.jobHeight || 297);
    const requiredSheets = Math.max(1, Number(costing.parentSheetsNeeded || 1));
    const selectedPaper = inventory.find(p => p.id === tempItem.paperId);

    // Look through offcuts in inventory
    const offcutItems = inventory.filter(i => 
      i.category?.toLowerCase() === 'offcut' || i.isOffcut === true || i.id?.startsWith('OFF-')
    );

    for (const off of offcutItems) {
      const offW = Number(off.specs?.widthMm || off.widthMm || 0);
      const offH = Number(off.specs?.heightMm || off.heightMm || 0);
      const offQty = Number(off.stockQty || off.qty || 0);

      // Check if quantity is available
      if (offQty < Math.min(10, requiredSheets)) continue;

      // Check dimensions with normal or rotated orientation
      const fitsNormal = offW >= jobW && offH >= jobH;
      const fitsRotated = offW >= jobH && offH >= jobW;

      if (fitsNormal || fitsRotated) {
        const parentSku = off.paperId || off.specs?.parentMaterialId;
        const paperType = (off.specs?.paperType || '').toLowerCase();
        const selectedPaperName = (selectedPaper?.name || '').toLowerCase();

        const isSkuMatch = parentSku && selectedPaper && (parentSku === selectedPaper.id || parentSku === selectedPaper.sku);
        const isTypeMatch = paperType && selectedPaperName.includes(paperType);

        if (isSkuMatch || isTypeMatch || !parentSku || offcutItems.length <= 5) {
          return off;
        }
      }
    }
    return null;
  }, [inventory, tempItem.jobWidth, tempItem.jobHeight, tempItem.paperId, costing.parentSheetsNeeded]);

  const updateField = (field: string, value: any) => {
    setTempItem(prev => {
      const updated = { ...prev, [field]: value };
      if (onChange) onChange(updated);
      return updated;
    });
  };

  const handleApplyTemplate = (template: PricingTemplatePreset) => {
    setTempItem(prev => ({
      ...prev,
      selectedTemplateId: template.id,
      activeModules: {
        paper: template.activeModules.paper,
        printEngine: template.activeModules.printEngine,
        postPressMachinery: template.activeModules.postPressMachinery,
        finishingMaterials: template.activeModules.finishingMaterials
      },
      finishingMaterials: template.defaultMaterials ? [...template.defaultMaterials] : prev.finishingMaterials
    }));
    setIsTemplateModalOpen(false);
    if (showToast) showToast(`ນຳໃຊ້ແມ່ແບບ "${template.nameLao}" ສຳເລັດ!`, 'success');
  };

  const handleSaveCustomTemplate = () => {
    if (!newTemplateForm.nameLao.trim()) {
      if (showToast) showToast('ກະລຸນາລະບຸຊື່ແມ່ແບບ!', 'warning');
      return;
    }

    const newTpl: PricingTemplatePreset = {
      id: `CUST_TPL_${Date.now()}`,
      nameLao: newTemplateForm.nameLao.trim(),
      nameEn: newTemplateForm.nameEn.trim() || newTemplateForm.nameLao.trim(),
      category: newTemplateForm.category,
      description: newTemplateForm.description || 'Custom Saved Template',
      iconName: 'Bookmark',
      activeModules: {
        paper: tempItem.activeModules?.paper !== false,
        printEngine: tempItem.activeModules?.printEngine !== false,
        postPressMachinery: Boolean(tempItem.activeModules?.postPressMachinery),
        finishingMaterials: Boolean(tempItem.activeModules?.finishingMaterials),
        laborAndSetup: true,
        packagingDelivery: false,
      },
      defaultMaterials: tempItem.finishingMaterials ? [...tempItem.finishingMaterials] : [],
      defaultLaborPercent: 15,
    };

    const updated = [...customTemplates, newTpl];
    setCustomTemplates(updated);
    try {
      localStorage.setItem('som_sing_custom_pricing_templates', JSON.stringify(updated));
    } catch {}

    setTempItem(prev => ({ ...prev, selectedTemplateId: newTpl.id }));
    setIsNewTemplateModalOpen(false);
    setNewTemplateForm({ nameLao: '', nameEn: '', category: 'book', description: '' });

    if (showToast) {
      showToast(
        currentLang === 'lo' 
          ? `ບັນທຶກແມ່ແບບ "${newTpl.nameLao}" ສຳເລັດ!` 
          : `Saved template "${newTpl.nameEn}" successfully!`,
        'success'
      );
    }
  };

  const handleDeleteCustomTemplate = (templateId: string, templateName: string) => {
    const updatedCustom = customTemplates.filter(t => t.id !== templateId);
    setCustomTemplates(updatedCustom);
    try {
      localStorage.setItem('som_sing_custom_pricing_templates', JSON.stringify(updatedCustom));
    } catch {}

    if (DEFAULT_PRICING_TEMPLATES.some(t => t.id === templateId)) {
      const updatedDeleted = [...deletedPresetIds, templateId];
      setDeletedPresetIds(updatedDeleted);
      try {
        localStorage.setItem('som_sing_deleted_preset_templates', JSON.stringify(updatedDeleted));
      } catch {}
    }

    if (tempItem.selectedTemplateId === templateId) {
      setTempItem(prev => ({ ...prev, selectedTemplateId: 'TPL_CUSTOM' }));
    }
    if (showToast) {
      showToast(
        currentLang === 'lo' ? 'ລົບແມ່ແບບຮຽບຮ້ອຍແລ້ວ' : 'Template deleted successfully',
        'success'
      );
    }
  };

  const handleToggleModule = (moduleKey: keyof ItemModuleToggles) => {
    setTempItem(prev => ({
      ...prev,
      activeModules: {
        ...prev.activeModules,
        [moduleKey]: !prev.activeModules?.[moduleKey]
      }
    }));
  };

  const handleAddCustomMaterial = () => {
    if (!newMaterialForm.name.trim()) return;
    const newMat: FinishingMaterialItem = {
      id: `mat-${Date.now()}`,
      name: newMaterialForm.name.trim(),
      unitCost: Number(newMaterialForm.unitCost) || 0,
      qtyPerItem: Number(newMaterialForm.qtyPerItem) || 1,
      unitName: newMaterialForm.unitName || 'ອັນ',
      calcMode: 'unit'
    };
    setTempItem(prev => ({
      ...prev,
      finishingMaterials: [...(prev.finishingMaterials || []), newMat]
    }));
    setNewMaterialForm({ name: '', unitCost: 100, qtyPerItem: 1, unitName: 'ອັນ' });
    setShowAddMaterial(false);
    if (showToast) showToast('ເພີ່ມວັດຖຸດິບຫຼັງພິມສຳເລັດ!', 'success');
  };

  const handleRemoveMaterial = (matId: string) => {
    setTempItem(prev => ({
      ...prev,
      finishingMaterials: (prev.finishingMaterials || []).filter(m => m.id !== matId)
    }));
  };

  const handlePresetSizeChange = (preset: string) => {
    let w = 210, h = 297;
    if (preset === 'A4') { w = 210; h = 297; }
    else if (preset === 'A5') { w = 148; h = 210; }
    else if (preset === 'A3') { w = 297; h = 420; }
    else if (preset === 'A6') { w = 105; h = 148; }
    else if (preset === 'B5') { w = 176; h = 250; }
    else if (preset === 'Custom') { w = tempItem.jobWidth || 210; h = tempItem.jobHeight || 297; }

    setTempItem(prev => ({
      ...prev,
      jobSizePreset: preset,
      jobWidth: w,
      jobHeight: h
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...tempItem,
        isConfigured: true,
        costingSummary: costing
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header bar with clean Single Arrow Save Button */}
      {!embeddedMode && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ບັນທຶກ & ກັບໄປຮາຍການ (Save & Return)</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 transition px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 cursor-pointer"
            >
              ຍົກເລີກ
            </button>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-[11px] uppercase font-black text-accent-sky tracking-wider font-sans">
              Item Spec Configurator #{itemIndex + 1}
            </span>
            <span className="text-sm font-black text-primary-navy truncate max-w-[280px]">
              {tempItem.name || 'Custom Print Item'}
            </span>
          </div>
        </div>
      )}

      {/* Main Grid: Left Modules Form (8 cols) + Right Breakdown Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Phases 1 to 6 Modular Sections */}
        <div className="lg:col-span-8 space-y-4">

          {/* Top Templates & Modules Bar (Exact Copy of QuotationManager) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-black text-sm text-slate-800 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-accent-sky" />
                  <span>ແມ່ແບບສິນຄ້າ & ໂມດູນຄຳນວນ (Product Templates & Modules)</span>
                </h4>
                <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                  ເລືອກແມ່ແບບສຳເລັດຮູບ, ບັນທຶກແມ່ແບບໃໝ່ ຫຼື ເປີດ/ປິດ ໂມດູນຕົ້ນທຶນ
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="px-3.5 py-2 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>ເລືອກ & ຈັດການແມ່ແບບ ({allAvailableTemplates.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsNewTemplateModalOpen(true)}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ບັນທຶກເປັນແມ່ແບບໃໝ່</span>
                </button>
              </div>
            </div>

            {/* Active Selected Template Badge Bar */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-xs">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-accent-sky shrink-0" />
                <span className="text-slate-500 font-bold">ແມ່ແບບທີ່ໃຊ້:</span>
                <span className="font-black text-primary-navy">
                  {allAvailableTemplates.find(t => t.id === tempItem.selectedTemplateId)?.nameLao || 
                   allAvailableTemplates.find(t => t.id === tempItem.selectedTemplateId)?.nameEn || 
                   'ກຳນົດເອງ (Custom Spec)'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(true)}
                className="text-xs font-black text-accent-sky hover:text-sky-700 transition cursor-pointer flex items-center gap-1"
              >
                <span>ປ່ຽນແມ່ແບບ →</span>
              </button>
            </div>

            {/* 6 Modular Cost Module Buttons */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                <span>ໂມດູນຕົ້ນທຶນ 1-6 (Active Cost Modules):</span>
                <span className="text-[10px] text-slate-400">1-2 ບັງຄັບໃຊ້ (Fixed), 3-6 ເປີດ/ປິດ ຕາມຕ້ອງການ</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* Fixed Module 1: Customer Info */}
                <div className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 text-slate-900 flex items-center justify-between text-xs font-bold shadow-2xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate text-[11px] font-black">1. ຂໍ້ມູນສິນຄ້າ & ລູກຄ້າ</span>
                  </div>
                  <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[9px] font-black shrink-0">FIXED</span>
                </div>

                {/* Fixed Module 2: Production Quantity */}
                <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 text-slate-900 flex items-center justify-between text-xs font-bold shadow-2xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <Hash className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate text-[11px] font-black">2. ຈຳນວນຜະລິດ</span>
                  </div>
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-black shrink-0">FIXED</span>
                </div>

                {/* Dynamic Modules 3 to 6 */}
                {[
                  { key: 'paper' as const, label: '3. ເຈ້ຍ (Paper)', icon: FileText },
                  { key: 'printEngine' as const, label: '4. ເຄື່ອງພິມ & ໝຶກ', icon: Printer },
                  { key: 'postPressMachinery' as const, label: '5. ເຄື່ອງຈັກຫຼັງພິມ', icon: Wrench },
                  { key: 'finishingMaterials' as const, label: '6. ວັດຖຸດິບຫຼັງພິມ', icon: Package },
                ].map((mod) => {
                  const isActive = tempItem.activeModules ? tempItem.activeModules[mod.key] : true;
                  return (
                    <button
                      key={mod.key}
                      type="button"
                      onClick={() => handleToggleModule(mod.key)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <mod.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate text-[11px] font-black">{mod.label}</span>
                      </div>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-emerald-500 shadow-xs' : 'bg-slate-300'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Phase Jump Navigation & Expand/Collapse All */}
          <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              {[
                { key: 'phase1', label: '1. ຊື່ & ລູກຄ້າ', icon: User },
                { key: 'phase2', label: '2. ຈຳນວນ', icon: Hash },
                { key: 'phase3', label: '3. ເຈ້ຍ', icon: FileText },
                { key: 'phase4', label: '4. ພິມ & ໝຶກ', icon: Printer },
                { key: 'phase5', label: '5. ເຄື່ອງຈັກ', icon: Wrench },
                { key: 'phase6', label: '6. ວັດຖຸດິບຫຼັງພິມ', icon: Package },
              ].map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    setOpenPhases(prev => ({ ...prev, [p.key]: true }));
                    document.getElementById(`sec-${p.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition flex items-center gap-1 cursor-pointer shrink-0 ${
                    openPhases[p.key]
                      ? 'bg-primary-navy text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <p.icon className="w-3 h-3" />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-slate-200">
              <button
                type="button"
                onClick={() => toggleAllPhases(true)}
                className="text-[10px] font-bold text-slate-600 hover:text-slate-900 px-2 py-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
              >
                ເປີດໝົດ
              </button>
              <button
                type="button"
                onClick={() => toggleAllPhases(false)}
                className="text-[10px] font-bold text-slate-600 hover:text-slate-900 px-2 py-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
              >
                ພັບໝົດ
              </button>
            </div>
          </div>

          {/* PHASE 1: Item & Customer Info */}
          <div id="sec-phase1" className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition">
            <button
              type="button"
              onClick={() => togglePhase('phase1')}
              className="w-full p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-sans font-black text-xs shadow-xs">1</span>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  ຂໍ້ມູນລາຍການສິນຄ້າ (Item Information)
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 font-sans">
                  {tempItem.name || 'Custom Print Job'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-[11px] font-medium hidden sm:inline">{openPhases.phase1 ? 'ພັບເກັບ' : 'ເປີດເບິ່ງ'}</span>
                {openPhases.phase1 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {openPhases.phase1 && (
              <div className="p-4 sm:p-5 border-t border-slate-100 space-y-3.5 animate-fade-in">
                {/* Step 1 Customer Link Badge */}
                {customerData?.name && (
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <span className="text-slate-500 text-[10px] block">ຂໍ້ມູນລູກຄ້າຈາກຂັ້ນຕອນທີ 1 (Customer from Step 1):</span>
                        <span className="font-black text-indigo-950 text-xs">
                          {customerData.name} {customerData.phone ? `(${customerData.phone})` : ''}
                        </span>
                      </div>
                    </div>
                    {customerData.deliveryMethod && (
                      <span className="px-2.5 py-1 bg-white text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-black">
                        {customerData.deliveryMethod}
                      </span>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 uppercase block">
                    ຊື່ລາຍການສິນຄ້າ (Item Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={tempItem.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="ເຊັ່ນ: ປຶ້ມພາສາລາວ, ປຶ້ມພາສາອັງກິດ, ແຜ່ນພັບ..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky"
                  />
                </div>
              </div>
            )}
          </div>

          {/* PHASE 2: Production Quantity Required */}
          <div id="sec-phase2" className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition">
            <button
              type="button"
              onClick={() => togglePhase('phase2')}
              className="w-full p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-sans font-black text-xs shadow-xs">2</span>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  ຈຳນວນທີ່ຕ້ອງການຜະລິດ (Quantity)
                </span>
                <span className="text-[11px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-sans flex items-center gap-1">
                  <Layers3 className="w-3 h-3" />
                  {(tempItem.quantity || 500).toLocaleString()} ຫົວ
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-[11px] font-medium hidden sm:inline">{openPhases.phase2 ? 'ພັບເກັບ' : 'ເປີດເບິ່ງ'}</span>
                {openPhases.phase2 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {openPhases.phase2 && (
              <div className="p-4 sm:p-5 border-t border-slate-100 space-y-3.5 animate-fade-in">
                <div className="space-y-1.5 p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl shadow-xs">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-emerald-950 uppercase tracking-wider block">
                      ຈຳນວນທີ່ຕ້ອງການຜະລິດສຳລັບ "{tempItem.name || 'Item'}" *
                    </label>
                    <span className="text-[11px] font-bold text-emerald-700">ກົດເລືອກຈຳນວນດ່ວນດ້ານລຸ່ມໄດ້</span>
                  </div>

                  <input
                    type="number"
                    min="1"
                    value={tempItem.quantity || 500}
                    onChange={(e) => updateField('quantity', Math.max(1, Number(e.target.value) || 1))}
                    className="w-full min-h-[48px] px-4 py-2 border-2 border-emerald-400 rounded-xl focus:outline-none text-xl font-black font-sans bg-white text-emerald-950 text-center shadow-xs"
                  />

                  {/* Quick Quantity Preset Chips */}
                  <div className="pt-2 flex flex-wrap gap-1.5 justify-center">
                    {[50, 100, 200, 300, 500, 1000, 2000, 5000].map(qty => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => updateField('quantity', qty)}
                        className={`px-3 py-1 rounded-xl text-xs font-black font-sans transition cursor-pointer ${
                          (tempItem.quantity || 500) === qty
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {qty.toLocaleString()} ຫົວ
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PHASE 3: Paper & Substrate Selection (Exact Layout from QuotationManager) */}
          <div id="sec-phase3" className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition">
            <button
              type="button"
              onClick={() => togglePhase('phase3')}
              className="w-full p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center font-sans font-black text-xs shadow-xs">3</span>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  ເລືອກເຈ້ຍ & ຂະໜາດຕັດ (Paper & Cut Specs)
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-sky-50 text-sky-700 rounded-lg border border-sky-200 font-sans flex items-center gap-1">
                  <Scissors className="w-3 h-3" />
                  {costing.cuts} ຕັດ • {formatLAK(costing.totalPaperCost)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-[11px] font-medium hidden sm:inline">{openPhases.phase3 ? 'ພັບເກັບ' : 'ເປີດເບິ່ງ'}</span>
                {openPhases.phase3 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {openPhases.phase3 && (
              <div className="p-4 sm:p-5 border-t border-slate-100 space-y-4 animate-fade-in">
                {/* Size Presets & Custom Dimensions */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    ຂະໜາດສຳເລັດ (Finished Job Size Preset):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['A4', 'A5', 'A3', 'A6', 'B5', 'Custom'].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePresetSizeChange(preset)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                          tempItem.jobSizePreset === preset
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">ກວ້າງ Width (mm)</span>
                      <input
                        type="number"
                        value={tempItem.jobWidth || 210}
                        onChange={(e) => updateField('jobWidth', Number(e.target.value) || 210)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">ສູງ Height (mm)</span>
                      <input
                        type="number"
                        value={tempItem.jobHeight || 297}
                        onChange={(e) => updateField('jobHeight', Number(e.target.value) || 297)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">ຕັດເຜື່ອຂອບ Bleed (mm)</span>
                      <input
                        type="number"
                        value={tempItem.bleedMargin !== undefined ? tempItem.bleedMargin : 2}
                        onChange={(e) => updateField('bleedMargin', Number(e.target.value) || 2)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Paper Selection from Inventory */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    ເລືອກເຈ້ຍຈາກສາງ (Select Paper From Inventory):
                  </label>
                  <select
                    value={tempItem.paperId}
                    onChange={(e) => updateField('paperId', e.target.value)}
                    className="w-full min-h-[48px] px-3.5 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 text-xs bg-white font-semibold font-sans"
                  >
                    {papers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.gsm ? `(${p.gsm} gsm)` : ''} — ຕົ້ນທຶນ: {formatLAK(p.costPerConsumptionUnit || p.costPerSheet || 1860)}/ແຜ່ນ
                      </option>
                    ))}
                  </select>
                </div>

                {/* Smart Offcut Suggestion Callout Banner */}
                {matchingOffcut && matchingOffcut.id !== tempItem.paperId && (
                  <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-2xl text-xs space-y-2.5 animate-fade-in shadow-xs">
                    <div className="flex items-center justify-between text-emerald-950 font-black">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600 animate-bounce" />
                        <span>💡 ມີເສດເຈ້ຍພ້ອມໃຊ້ (Smart Offcut Available)</span>
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded font-bold font-mono text-[10px]">
                        {matchingOffcut.specs?.dimensionFormatted || `${matchingOffcut.specs?.widthMm || 148} × ${matchingOffcut.specs?.heightMm || 210} mm`}
                      </span>
                    </div>

                    <div className="text-slate-600 leading-snug text-[11px]">
                      ພົບເສດ <span className="font-black text-slate-900">{matchingOffcut.name}</span> ຈຳນວນ{' '}
                      <span className="font-black text-emerald-700 font-sans">
                        {Number(matchingOffcut.stockQty || matchingOffcut.qty || 0).toLocaleString()} ແຜ່ນ
                      </span>{' '}
                      ຢູ່ <span className="font-bold text-slate-700">{matchingOffcut.location || matchingOffcut.specs?.location || 'Shelf A'}</span>{' '}
                      (ຂະໜາດພໍດີກັບງານ {tempItem.jobWidth || 210}×{tempItem.jobHeight || 297}mm — ຊ່ວຍປະຢັດຕົ້ນທຶນ!)
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-bold text-emerald-800">
                        ຕົ້ນທຶນເສດ: {formatLAK(matchingOffcut.costPerConsumptionUnit || matchingOffcut.costPerSheet || 400)}/ແຜ່ນ
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          updateField('paperId', matchingOffcut.id);
                          if (showToast) {
                            showToast(`ເລືອກໃຊ້ເສດເຈ້ຍ "${matchingOffcut.name}" ສຳເລັດ!`, 'success');
                          }
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs border-none"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{currentLang === 'lo' ? 'ນຳໃຊ້ເສດເຈ້ຍນີ້ (Use Offcut)' : 'Use This Offcut'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Paper Calculation Summary Box */}
                <div className="p-4 bg-sky-50/90 border border-sky-200 rounded-2xl text-xs space-y-2.5">
                  <div className="flex justify-between items-center text-sky-950 font-black">
                    <span className="flex items-center gap-1.5">
                      <Scissors className="w-4 h-4 text-sky-600" />
                      <span>ສະຫຼຸບການໃຊ້ເຈ້ຍ ({tempItem.name || 'Item'})</span>
                    </span>
                    <span className="px-2.5 py-0.5 bg-sky-100 text-sky-900 rounded-md font-bold font-sans">
                      {costing.cuts} ຊິ້ນ/ແຜ່ນ
                    </span>
                  </div>
                  
                  <div className="text-slate-700 space-y-1.5 font-medium">
                    <div className="flex justify-between">
                      <span>ຕົ້ນທຶນເຈ້ຍຕໍ່ແຜ່ນ (Unit Cost):</span>
                      <span className="font-sans font-bold text-slate-900">{formatLAK(costing.paperUnitCost)} / ແຜ່ນ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ຈຳນວນແຜ່ນທີ່ຕ້ອງໃຊ້ (Base Sheets):</span>
                      <span className="font-sans font-bold text-slate-900">{costing.parentSheetsNeeded.toLocaleString()} ແຜ່ນ</span>
                    </div>
                    <div className="space-y-1.5 pt-0.5 border-t border-sky-200/50">
                      <div className="flex justify-between items-center text-amber-800 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <span>ເຜື່ອເສຍຫາຍ (Spoilage Tier):</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-sans">
                            {costing.itemSpoilageRate}% ({tempItem.spoilagePercent !== undefined ? 'Custom' : 'Auto Tier'})
                          </span>
                        </span>
                        <span className="font-sans font-bold text-amber-900">+{costing.wastedSheets.toLocaleString()} ແຜ່ນ</span>
                      </div>

                      {/* Quick Spoilage % Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-slate-400 font-bold">ປັບ % ເຜື່ອເສຍ:</span>
                        {[
                          { label: 'Auto Tier', val: undefined },
                          { label: '3%', val: 3 },
                          { label: '5%', val: 5 },
                          { label: '7%', val: 7 },
                          { label: '10%', val: 10 },
                          { label: '15%', val: 15 },
                        ].map(chip => {
                          const isSelected = chip.val === undefined 
                            ? tempItem.spoilagePercent === undefined 
                            : tempItem.spoilagePercent === chip.val;
                          return (
                            <button
                              key={chip.label}
                              type="button"
                              onClick={() => updateField('spoilagePercent', chip.val)}
                              className={`px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50'
                              }`}
                            >
                              {chip.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PHASE 4: Printing Process & Multi-Printer Allocation (ManualPrinterAllocator) */}
          <div id="sec-phase4" className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition">
            <button
              type="button"
              onClick={() => togglePhase('phase4')}
              className="w-full p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-sans font-black text-xs shadow-xs">4</span>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  ລະບົບພິມ & ເຄື່ອງພິມ (Printing Process & Ink)
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 font-sans flex items-center gap-1">
                  <Printer className="w-3 h-3" />
                  {formatLAK(costing.totalInkCost + costing.overheadCost)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-[11px] font-medium hidden sm:inline">{openPhases.phase4 ? 'ຫຍໍ້ເກັບ' : 'ເປີດເບິ່ງ'}</span>
                {openPhases.phase4 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {openPhases.phase4 && (
              <div className="p-4 sm:p-5 border-t border-slate-100 space-y-4 animate-fade-in">
                <ManualPrinterAllocator
                  targetQuantity={tempItem.quantity || 500}
                  allocations={tempItem.printerAllocations || []}
                  availablePrinters={printers.map(p => ({
                    id: p.id,
                    name: p.name || p.id,
                    cost_per_page: Number((p as any).costPerPage || 50),
                    ink_cost_per_page: Number((p as any).inkUnitCostMl || 100),
                    printerCategory: p.category || 'Printer',
                    colorSchemeType: 'CMYK'
                  }))}
                  onAllocationsChange={(allocs) => updateField('printerAllocations', allocs)}
                />

                {/* Ink & Machine Cost Summary Box */}
                <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                  <div>
                    <span className="text-purple-600 block text-[10px]">ຕົ້ນທຶນໝຶກ & ຜົງສີລວມ:</span>
                    <span className="font-black text-purple-900">{formatLAK(costing.totalInkCost)}</span>
                  </div>
                  <div>
                    <span className="text-purple-600 block text-[10px]">ຄ່າເສື່ອມເຄື່ອງພິມ & ໄຟຟ້າ:</span>
                    <span className="font-black text-purple-900">{formatLAK(costing.overheadCost)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PHASE 5: Post-Press Machinery Selection */}
          <div id="sec-phase5" className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition">
            <button
              type="button"
              onClick={() => togglePhase('phase5')}
              className="w-full p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center font-sans font-black text-xs shadow-xs">5</span>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  ເຄື່ອງຈັກຫຼັງພິມ (Post-Press Machinery)
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 font-sans flex items-center gap-1">
                  <Wrench className="w-3 h-3" />
                  {formatLAK(costing.postPressCost)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-[11px] font-medium hidden sm:inline">{openPhases.phase5 ? 'ພັບເກັບ' : 'ເປີດເບິ່ງ'}</span>
                {openPhases.phase5 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {openPhases.phase5 && (
              <div className="p-4 sm:p-5 border-t border-slate-100 space-y-3 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {postPressEquipment.map(mach => {
                    const isSelected = (tempItem.selectedPostPressIds || []).includes(mach.id);
                    const rate = Number((mach as any).costPerPage) || Number((mach as any).calculatedCostPerPage) || 300;
                    
                    return (
                      <button
                        key={mach.id}
                        type="button"
                        onClick={() => {
                          const cur = tempItem.selectedPostPressIds || [];
                          const updated = isSelected ? cur.filter(id => id !== mach.id) : [...cur, mach.id];
                          updateField('selectedPostPressIds', updated);
                        }}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                          isSelected 
                            ? 'bg-amber-50/70 border-amber-300 text-slate-900 shadow-2xs' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-black block">{mach.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {mach.category || 'Finishing'} • {formatLAK(rate)} / ຊິ້ນ
                          </span>
                        </div>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* PHASE 6: Finishing Materials & Consumables */}
          <div id="sec-phase6" className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition">
            <button
              type="button"
              onClick={() => togglePhase('phase6')}
              className="w-full p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-sans font-black text-xs shadow-xs">6</span>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  ວັດຖຸດິບຫຼັງພິມ & ອຸປະກອນປະກອບ (Finishing Materials)
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-sans flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {formatLAK(costing.finishingMaterialsCost)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-[11px] font-medium hidden sm:inline">{openPhases.phase6 ? 'ພັບເກັບ' : 'ເປີດເບິ່ງ'}</span>
                {openPhases.phase6 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {openPhases.phase6 && (
              <div className="p-4 sm:p-5 border-t border-slate-100 space-y-3 animate-fade-in">
                <div className="flex justify-between items-center">
                  <p className="text-[11px] font-bold text-slate-400">
                    ລວດເຢັບແມັກ, ຫ່ວງກະດູກງູ, ກາວຮ້ອນ, ຟີມເຄືອບ, ກ່ອງບັນຈຸ
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddMaterial(prev => !prev)}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ເພີ່ມວັດຖຸດິບ</span>
                  </button>
                </div>

                {/* Custom Material Input Drawer */}
                {showAddMaterial && (
                  <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-black text-emerald-800 uppercase mb-1">ຊື່ອຸປະກອນ</label>
                        <input
                          type="text"
                          placeholder="ເຊັ່ນ: ລວດເຢັບ, ຫ່ວງ Wire-O..."
                          value={newMaterialForm.name}
                          onChange={(e) => setNewMaterialForm(p => ({ ...p, name: e.target.value }))}
                          className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-emerald-800 uppercase mb-1">ຕົ້ນທຶນ/ໜ່ວຍ (LAK)</label>
                        <input
                          type="number"
                          value={newMaterialForm.unitCost}
                          onChange={(e) => setNewMaterialForm(p => ({ ...p, unitCost: Number(e.target.value) || 0 }))}
                          className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-emerald-800 uppercase mb-1">ຈຳນວນຕໍ່ 1 ຊິ້ນງານ</label>
                        <input
                          type="number"
                          value={newMaterialForm.qtyPerItem}
                          onChange={(e) => setNewMaterialForm(p => ({ ...p, qtyPerItem: Number(e.target.value) || 1 }))}
                          className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddMaterial(false)}
                        className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        ຍົກເລີກ
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomMaterial}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-black cursor-pointer"
                      >
                        ເພີ່ມເຂົ້າລາຍການ
                      </button>
                    </div>
                  </div>
                )}

                {/* List of Applied Materials */}
                <div className="space-y-2">
                  {(tempItem.finishingMaterials || []).map((mat: FinishingMaterialItem) => (
                    <div 
                      key={mat.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-bold"
                    >
                      <div>
                        <span className="text-slate-800 font-black block">{mat.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {formatLAK(mat.unitCost)}/{mat.unitName || 'ອັນ'} × {mat.qtyPerItem} {mat.unitName || 'ອັນ'}/ຊິ້ນ = {formatLAK(mat.unitCost * mat.qtyPerItem * (tempItem.quantity || 500))}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(mat.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Live Cost Breakdown & Pricing Sidebar */}
        <div className="lg:col-span-4 space-y-4 sticky top-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">
                    ສະຫຼຸບຕົ້ນທຶນ & ລາຄາຂາຍ
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                    {(tempItem.quantity || 500).toLocaleString()} Units
                  </p>
                </div>
              </div>
            </div>

            {/* Cost Breakdown Rows */}
            <div className="space-y-2 text-xs font-bold text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">1. ຕົ້ນທຶນເຈ້ຍ (Paper):</span>
                <span className="font-black text-slate-800">{formatLAK(costing.totalPaperCost)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">2. ຕົ້ນທຶນໝຶກ & ຜົງສີ (Ink):</span>
                <span className="font-black text-slate-800">{formatLAK(costing.totalInkCost)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">3. ຄ່າເສື່ອມ & ໄຟຟ້າ (Machine Overhead):</span>
                <span className="font-black text-slate-800">{formatLAK(costing.overheadCost)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">4. ເຄື່ອງຈັກຫຼັງພິມ (Post-Press):</span>
                <span className="font-black text-slate-800">{formatLAK(costing.postPressCost)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">5. ວັດຖຸດິບຫຼັງພິມ (Consumables):</span>
                <span className="font-black text-slate-800">{formatLAK(costing.finishingMaterialsCost)}</span>
              </div>

              <div className="flex justify-between py-2 border-t border-slate-200 text-slate-900">
                <span className="font-black">ຕົ້ນທຶນຜະລິດລວມ (Total Cost):</span>
                <span className="font-black text-sm text-slate-900">{formatLAK(costing.totalCost)}</span>
              </div>
            </div>

            {/* Margin Slider */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700">Base Profit Margin:</span>
                <span className="font-black text-emerald-700 font-sans">{tempItem.profitMargin || 35}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={tempItem.profitMargin || 35}
                onChange={(e) => updateField('profitMargin', parseInt(e.target.value) || 0)}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Selling Price Display */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1 text-center">
              <span className="text-[11px] font-black text-emerald-800 uppercase block">
                ລາຄາຂາຍລວມ (Sale Price)
              </span>
              <span className="text-2xl font-black text-emerald-700 block font-sans">
                {formatLAK(costing.finalPrice)}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 block">
                ລາຄາຕໍ່ໜ່ວຍ: {formatLAK(costing.unitPrice)} / ຊິ້ນ
              </span>
            </div>

            {/* Big Action Buttons with Single Arrow */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleSave}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ບັນທຶກ & ກັບໄປຮາຍການ (Save & Return)</span>
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                ຍົກເລີກ
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Pricing Templates Selection & Management Modal (Directly shared with QuotationManager) */}
      <PricingTemplatesModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        allTemplates={allAvailableTemplates}
        customTemplates={customTemplates}
        selectedTemplateId={tempItem.selectedTemplateId}
        onApplyTemplate={handleApplyTemplate}
        onDeleteCustomTemplate={handleDeleteCustomTemplate}
        onOpenSaveNewModal={() => {
          setIsTemplateModalOpen(false);
          setIsNewTemplateModalOpen(true);
        }}
        currentLang={currentLang}
      />

      {/* Save as New Custom Template Modal (Directly shared with QuotationManager) */}
      <QuotationSaveTemplateModal
        isOpen={isNewTemplateModalOpen}
        onClose={() => setIsNewTemplateModalOpen(false)}
        onSave={handleSaveCustomTemplate}
        templateForm={newTemplateForm}
        onFormChange={setNewTemplateForm}
        activeItem={tempItem}
        currentLang={currentLang}
      />
    </div>
  );
}
