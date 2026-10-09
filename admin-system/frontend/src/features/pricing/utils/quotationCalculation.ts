import type { PrinterAllocation, ArtworkPart, PreflightResult, StockDimensionSnapshot } from '@features/orders/types';
import type { FinishingMaterialItem } from '../data/defaultTemplates';
import { getEquipmentAccurateCost, calculateEquipmentPrintCost } from '@utils/machineCostCalculator';
import { parentSheetDimensions, preCutStockDimensions } from '@utils/impositionLayout';
import { itemForArtworkPart, commercialTotals } from './artworkPartPricing';

export interface ItemModuleToggles {
  paper: boolean;               // 1. Paper / Substrate & Cut
  printEngine: boolean;         // 2. Printing Process & Ink
  postPressMachinery: boolean;  // 3. Post-Press Machinery
  finishingMaterials: boolean;  // 4. Finishing Materials & Consumables
  laborAndSetup: boolean;       // 5. Labor & Setup
  packagingDelivery: boolean;   // 6. Packaging & Delivery
}

export const DEFAULT_MODULE_TOGGLES: ItemModuleToggles = {
  paper: true,
  printEngine: true,
  postPressMachinery: false,
  finishingMaterials: false,
  laborAndSetup: true,
  packagingDelivery: false
};

export interface QuotationItem {
  imposition_mode?: 'OFF' | 'ON';
  stock_dimension_snapshot?: StockDimensionSnapshot;
  id: string;
  name: string;
  paperId: string;
  jobSizePreset: string;
  jobWidth: number;
  jobHeight: number;
  isDoubleSided: boolean;
  printVolume: number;
  pagesPerBook?: number;
  unitName?: string;
  includeCover?: boolean;
  coverPaperId?: string;
  coverPrintMode?: 'CMYK_1_SIDE' | 'CMYK_2_SIDES' | 'MONO_K';
  coverPagesCount?: number;
  colorPrintMode: 'CMYK' | 'MONO_K';
  coverageMode: 'default' | 'advanced';
  avgCoverage: number;
  cCoverage: number;
  mCoverage: number;
  yCoverage: number;
  kCoverage: number;
  selectedPrinterId: string;
  selectedInkSet: string;
  finishingCutOption?: string;
  bindingOption?: string;
  printerAllocations: PrinterAllocation[];
  selectedPostPressIds: string[];
  finishingMaterials: FinishingMaterialItem[];
  activeModules: ItemModuleToggles;
  packagingCost: number;
  deliveryCost: number;
  selectedTemplateId?: string;
  laborMode: 'manual' | 'percent';
  laborPercent: number;
  laborCostManual: number;
  profitMargin: number;
  discountPercent: number;
  useSpoilage?: boolean;
  spoilagePercent?: number;
  cutsPerSheetOverride?: number;
  coverCutsPerSheetOverride?: number;
  impositionSummary?: string;
  fileName?: string;
  artworkUrl?: string;
  fileSize?: number;
  mimeType?: string;
  previewThumbnailUrl?: string;
  coverFileName?: string;
  coverArtworkUrl?: string;
  coverFileSize?: number;
  artworkParts?: ArtworkPart[];
  preflightData?: PreflightResult;
  batchFiles?: any[];
  multipleImagesPerSheet?: boolean;
  imagesPerSheet?: number;
  isBatchPhoto?: boolean;
  photoCount?: number;
  suggestedPaper?: string;
  selectedPaperName?: string;
  cutPerSheet?: number;
  totalLargeSheets?: number;
  parentSheetSize?: 'standard' | '31x43' | 'custom';
  useOffcutRebate?: boolean;
  selectedOffcutId?: string;
  offcutRebateAmount?: number;
  packagingType?: string;
  requiresGuillotineCut?: boolean;
  manualSheetCount?: number;
  manual_sheet_count?: number;
  colorPages?: number;
  monoPages?: number;
  monoPagesAvgK?: number;
}

export const getPresetDimensions = (preset: string, currentW: number = 210, currentH: number = 297) => {
  const p = (preset || '').trim().toLowerCase();
  if (p === 'a3') return { w: 297, h: 420 };
  if (p === 'a4') return { w: 210, h: 297 };
  if (p === 'a5') return { w: 148, h: 210 };
  if (p === 'a6') return { w: 105, h: 148 };
  if (p.includes('5x7 cm') || p.includes('5x7cm') || p === '5x7 (cm)') return { w: 50, h: 70 };
  if (p.includes('4x6') || p.includes('4*6') || p.includes('4"x6"') || p.includes('4"×6"')) return { w: 100, h: 150 };
  if (p.includes('5x7"') || p.includes('5*7') || p.includes('5"x7"') || p.includes('5"×7"') || p === '5x7') return { w: 127, h: 178 };
  if (p.includes('3x4') || p.includes('3*4') || p.includes('3"x4"')) return { w: 75, h: 100 };
  if (p.includes('2x3') || p.includes('2*3') || p.includes('2"x3"') || p.includes('polaroid')) return { w: 54, h: 86 };
  return { w: currentW || 210, h: currentH || 297 };
};

export const resolveCoverageValue = (val: any, fallback: number = 15): number => {
  if (val !== undefined && val !== null && val !== '') {
    const num = Number(val);
    if (!isNaN(num) && num >= 0) return num;
  }
  return fallback;
};

export const DEFAULT_SPOILAGE_TIERS = [
  { min: 1, max: 100, rate: 10 },
  { min: 101, max: 500, rate: 7 },
  { min: 501, max: 2000, rate: 5 },
  { min: 2001, max: 1000000, rate: 3 },
];

export const getPrinterMachineRate = (p: any): number => {
  if (!p) return 1.20;
  const accurate = getEquipmentAccurateCost(p);
  if (accurate && accurate.totalMachineCost > 0) {
    return accurate.totalMachineCost;
  }
  const assetValue = Number(
    p.MachinePrice ?? 
    p.price ?? 
    p.unitPrice ?? 
    p.purchaseCost ?? 
    p.purchasePrice ?? 
    p.unitCost ?? 
    0
  );
  const lifespanYears = Number(p.lifespanYears || p.specs?.lifespanYears || 5);
  const estMonthlyVolume = Number(p.estMonthlyVolume || p.specs?.estMonthlyVolume || 50000);
  const maintenanceRatePct = Number(p.maintenanceRatePercent || p.maintenance_rate_percent || p.specs?.maintenanceRatePercent || 15);
  const maintCostPerPage = Number(p.specs?.fixedMaintenanceCostPerPage || 0);

  const totalMonths = lifespanYears * 12;
  const targetPages = Number(
    p.TargetTotalPages ?? 
    p.printedPagesCapacity ?? 
    p.expectedLifeA4Pages ?? 
    p.lifetimePagesA4 ?? 
    ((estMonthlyVolume * totalMonths) > 0 ? (estMonthlyVolume * totalMonths) : 3000000)
  );
  const monthlyDepr = totalMonths > 0 ? (assetValue / totalMonths) : 0;
  const baseCostPerUnit = (estMonthlyVolume > 0 && monthlyDepr > 0)
    ? (monthlyDepr / estMonthlyVolume)
    : (targetPages > 0 ? (assetValue / targetPages) : 0);

  const wearAllowancePerUnit = Math.round(baseCostPerUnit * (maintenanceRatePct / 100) * 1000) / 1000 + maintCostPerPage;
  const netCostPerUnit = Math.round((baseCostPerUnit + wearAllowancePerUnit) * 1000) / 1000;

  return netCostPerUnit > 0 ? netCostPerUnit : Number(p.calculatedCostPerPage || p.costPerPage || 1.20);
};

export interface CalculationContext {
  inventory?: any[];
  equipment?: any[];
  printerColorLinks?: any[];
  getFIFOCostPerSheet?: (paperId: string, sheetCount: number) => number;
  spoilageTiers?: Array<{ min: number; max: number; rate: number }>;
  bleedMargin?: number;
  quotationProfitMargin?: number;
  quotationDiscountPercent?: number;
}

export interface ItemFinancialResult {
  cutsPerSheet: number;
  parentSheetsNeeded: number;
  totalParentSheets: number;
  wastedSheets: number;
  itemSpoilageRate: number;
  isSpoilageActive: boolean;
  paperUnitCost: number;
  paperCost: number;
  innerPaperCost: number;
  coverPaperCost: number;
  coverPaperUnitCost: number;
  totalInnerSheets: number;
  totalInnerParentSheets: number;
  totalCoverParentSheets: number;
  innerPagesPerBook: number;
  innerSheetsPerBook: number;
  hasCover: boolean;
  isBatchPhoto: boolean;
  photoCountPerSet: number;
  totalPhotos: number;
  totalJobProductionSheets: number;
  totalProductionSheets: number;
  cyanMl: number;
  magentaMl: number;
  yellowMl: number;
  blackMl: number;
  inkCost: number;
  coverInkCost: number;
  machineOverhead: number;
  machDepr: number;
  machMaint: number;
  electricityCost: number;
  postPressCost: number;
  finishingMaterialsCost: number;
  packagingDeliveryCost: number;
  packagingCost: number;
  offcutRebate: number;
  guillotineFee: number;
  laborCost: number;
  directMatMach: number;
  netCost: number;
  baseSellingPrice: number;
  discountAmt: number;
  sellingPrice: number;
  unitPrice: number;
  unitCost: number;
  profit: number;
  marginPercent: number;
  partCosts?: any[];
  sharedCosts?: any;
}

export function calculateSingleItemFinancials(
  item: QuotationItem,
  context: CalculationContext = {},
  imposed?: { sheets: number; copies: number; capacity: number }
): ItemFinancialResult {
  const inventory = context.inventory || [];
  const equipment = context.equipment || [];
  const printerColorLinks = context.printerColorLinks || [];
  const getFIFOCostPerSheet = context.getFIFOCostPerSheet;
  const spoilageTiers = context.spoilageTiers || DEFAULT_SPOILAGE_TIERS;
  const bleedMargin = context.bleedMargin !== undefined ? context.bleedMargin : 2;
  const quotationProfitMargin = context.quotationProfitMargin;
  const quotationDiscountPercent = context.quotationDiscountPercent;

  const { w: jobW, h: jobH } = getPresetDimensions(item.jobSizePreset, item.jobWidth, item.jobHeight);
  
  const paperItem = inventory.find(p => 
    p.id === item.paperId || 
    p.sku === item.paperId || 
    p.id?.toLowerCase() === item.paperId?.toLowerCase() ||
    (p.sku && p.sku.toLowerCase() === item.paperId?.toLowerCase()) ||
    p.name === item.paperId
  );
  const preCut = item.imposition_mode === 'OFF';
  const { sheetWidth: parentW, sheetHeight: parentH } = preCut 
    ? (preCutStockDimensions(paperItem) || { sheetWidth: Number(jobW), sheetHeight: Number(jobH) }) 
    : parentSheetDimensions(paperItem, item.parentSheetSize);

  const curW = Number(jobW) + (Number(bleedMargin) * 2);
  const curH = Number(jobH) + (Number(bleedMargin) * 2);
  const portraitCuts = Math.floor(parentW / curW) * Math.floor(parentH / curH);
  const landscapeCuts = Math.floor(parentW / curH) * Math.floor(parentH / curW);
  const autoCutsPerSheet = Math.max(1, portraitCuts, landscapeCuts);
  const cutsPerSheet = imposed?.capacity ?? ((item.cutsPerSheetOverride !== undefined && item.cutsPerSheetOverride > 0)
    ? Number(item.cutsPerSheetOverride)
    : autoCutsPerSheet);

  // 1. Check if this is a Photo Print / Batch Multi-Photo item:
  const isBatchPhoto = Boolean(
    item.isBatchPhoto || 
    item.name?.includes('Photo Prints') || 
    (item.batchFiles && item.batchFiles.length > 0) ||
    (item.preflightData as any)?.is_batch_photo
  );

  // 1. Pages & Sheets Breakdown:
  const orderQty = Number(item.printVolume || 1);
  const photoCountPerSet = Number(item.photoCount) || (item.batchFiles && item.batchFiles.length > 0 ? item.batchFiles.length : Number(item.pagesPerBook || 1));
  const pagesPerBook = isBatchPhoto ? photoCountPerSet : Number(item.pagesPerBook || 1);
  const hasCover = Boolean(!isBatchPhoto && item.includeCover && pagesPerBook >= 4);
  const coverPagesCount = hasCover ? (Number(item.coverPagesCount) || 4) : 0;
  const innerPagesPerBook = isBatchPhoto ? photoCountPerSet : Math.max(1, pagesPerBook - coverPagesCount);
  
  // For photo batch prints, each set contains photoCountPerSet individual photos
  const innerSheetsPerBook = isBatchPhoto 
    ? photoCountPerSet
    : (item.isDoubleSided ? Math.ceil(innerPagesPerBook / 2) : innerPagesPerBook);

  // 2. Inner Paper Sheets Calculation:
  const totalInnerSheets = imposed?.copies ?? innerSheetsPerBook * orderQty;
  const innerParentSheetsNeeded = imposed?.sheets ?? Math.ceil(totalInnerSheets / Math.max(1, cutsPerSheet));

  const isSpoilageActive = item.useSpoilage !== false;
  const tier = spoilageTiers.find(t => totalInnerSheets >= t.min && totalInnerSheets <= t.max);
  const itemSpoilageRate = !isSpoilageActive
    ? 0
    : ((item.spoilagePercent !== undefined && item.spoilagePercent !== null)
        ? Number(item.spoilagePercent)
        : (tier ? tier.rate : 5));
  const innerWastedSheets = (isSpoilageActive && itemSpoilageRate > 0)
    ? Math.max(1, Math.ceil(innerParentSheetsNeeded * (itemSpoilageRate / 100)))
    : 0;
  const manualSheets = Number(item.manualSheetCount || (item as any).manual_sheet_count || 0);
  const totalInnerParentSheets = manualSheets > 0 ? manualSheets : (innerParentSheetsNeeded + innerWastedSheets);

  const fifoUnitCost = (getFIFOCostPerSheet && paperItem) 
    ? getFIFOCostPerSheet(paperItem.id, totalInnerParentSheets) 
    : (getFIFOCostPerSheet ? getFIFOCostPerSheet(item.paperId, totalInnerParentSheets) : 0);
  const paperUnitCost = fifoUnitCost > 0 
    ? fifoUnitCost 
    : (paperItem 
        ? (Number(paperItem.costPerConsumptionUnit) || Number(paperItem.costPerSheet) || (Number(paperItem.costPerPurchaseUnit) && Number(paperItem.purchaseMultiplier) ? Number(paperItem.costPerPurchaseUnit) / Number(paperItem.purchaseMultiplier) : 0) || Number(paperItem.unitCost) || 184)
        : 184);

  const innerPaperCost = totalInnerParentSheets * paperUnitCost;

  // 3. Cover Paper Calculation:
  let coverPaperCost = 0;
  let totalCoverParentSheets = 0;
  let coverParentSheetsNeeded = 0;
  let coverWastedSheets = 0;
  let coverPaperUnitCost = 0;

  if (hasCover) {
    const coverPaperItem = inventory.find(p => p.id === item.coverPaperId) || paperItem;
    const totalCoverSheets = 1 * orderQty; // 1 Spread sheet per book
    const coverCutsPerSheet = preCut ? 1 : (item.coverCutsPerSheetOverride !== undefined && item.coverCutsPerSheetOverride > 0)
      ? Number(item.coverCutsPerSheetOverride)
      : 1;
    coverParentSheetsNeeded = Math.ceil(totalCoverSheets / coverCutsPerSheet);
    coverWastedSheets = (isSpoilageActive && itemSpoilageRate > 0)
      ? Math.ceil(coverParentSheetsNeeded * (itemSpoilageRate / 100))
      : 0;
    totalCoverParentSheets = coverParentSheetsNeeded + coverWastedSheets;
    
    const coverFifo = (getFIFOCostPerSheet && coverPaperItem) ? getFIFOCostPerSheet(coverPaperItem.id, totalCoverParentSheets) : 0;
    coverPaperUnitCost = coverFifo > 0 ? coverFifo : (coverPaperItem ? (Number(coverPaperItem.unitCost) || Number(coverPaperItem.costPerSheet) || 850) : 850);
    coverPaperCost = totalCoverParentSheets * coverPaperUnitCost;
  }

  const parentSheetsNeeded = innerParentSheetsNeeded + coverParentSheetsNeeded;
  const wastedSheets = innerWastedSheets + coverWastedSheets;
  const totalParentSheets = totalInnerParentSheets + totalCoverParentSheets;

  const A4_AREA = 210 * 297;
  // Ink is calculated on the actual finished job piece printed area (A4 baseline factor), NOT parent sheet area
  const printAreaFactor = Math.max(0.01, (Number(jobW) * Number(jobH)) / A4_AREA);

  let cyanMl = 0;
  let magentaMl = 0;
  let yellowMl = 0;
  let blackMl = 0;
  let totalInkCostAccum = 0;
  let machDepr = 0;
  let machMaint = 0;

  // Physical printed sheets per finished copy (duplex counts 2 pages per sheet)
  const sheetsPerCopy = item.isDoubleSided
    ? Math.ceil(innerPagesPerBook / 2)
    : innerPagesPerBook;
  const totalJobProductionSheets = isBatchPhoto
    ? (photoCountPerSet * orderQty)
    : (sheetsPerCopy * orderQty);

  // Printed side impressions for ink consumption (Decoupled from physical sheets!)
  // Duplex prints innerPagesPerBook sides; blank (N+1)-th side consumes 0 ink.
  const printedSidesPerBook = isBatchPhoto ? photoCountPerSet : innerPagesPerBook;
  const totalJobPrintedImpressions = printedSidesPerBook * orderQty;

  // Channel Population Adjustment for Mixed Color/Mono (R3)
  const colorPagesCount = Number(item.colorPages ?? (item.preflightData as any)?.color_pages_count ?? 0);
  const monoPagesCount = Number(item.monoPages ?? (item.preflightData as any)?.mono_pages_count ?? 0);
  const isMixedDocument = colorPagesCount > 0 && monoPagesCount > 0 && item.colorPrintMode !== 'MONO_K';

  const rawC = item.colorPrintMode === 'MONO_K' ? 0 : resolveCoverageValue(item.cCoverage, resolveCoverageValue(item.avgCoverage, 15));
  const rawM = item.colorPrintMode === 'MONO_K' ? 0 : resolveCoverageValue(item.mCoverage, resolveCoverageValue(item.avgCoverage, 15));
  const rawY = item.colorPrintMode === 'MONO_K' ? 0 : resolveCoverageValue(item.yCoverage, resolveCoverageValue(item.avgCoverage, 15));
  const rawK = resolveCoverageValue(item.kCoverage, resolveCoverageValue(item.avgCoverage, 15));
  const monoK = resolveCoverageValue(item.monoPagesAvgK, resolveCoverageValue(item.kCoverage, 5));

  // Zero-division defensive guard
  const docWeightedC = printedSidesPerBook > 0 ? (colorPagesCount * rawC) / printedSidesPerBook : 0;
  const docWeightedM = printedSidesPerBook > 0 ? (colorPagesCount * rawM) / printedSidesPerBook : 0;
  const docWeightedY = printedSidesPerBook > 0 ? (colorPagesCount * rawY) / printedSidesPerBook : 0;
  const docWeightedK = printedSidesPerBook > 0 ? ((colorPagesCount * rawK) + (monoPagesCount * monoK)) / printedSidesPerBook : 0;

  const defaultDensityC = isMixedDocument ? docWeightedC : rawC;
  const defaultDensityM = isMixedDocument ? docWeightedM : rawM;
  const defaultDensityY = isMixedDocument ? docWeightedY : rawY;
  const defaultDensityK = isMixedDocument ? docWeightedK : rawK;

  const allocations = (item.printerAllocations && item.printerAllocations.length > 0)
    ? item.printerAllocations
    : [
        {
          printer_id: item.selectedPrinterId || 'default',
          printer_name: 'Default Printer',
          allocated_pages: totalJobPrintedImpressions,
          cost_per_page: 50,
          is_double_sided: item.isDoubleSided || false,
          color_mode: item.colorPrintMode || 'CMYK',
          average_density_pct: resolveCoverageValue(item.avgCoverage, 15),
          color_channels: [
            { channel_name: 'C', density_pct: defaultDensityC },
            { channel_name: 'M', density_pct: defaultDensityM },
            { channel_name: 'Y', density_pct: defaultDensityY },
            { channel_name: 'K', density_pct: defaultDensityK }
          ]
        }
      ];

  allocations.forEach(alloc => {
    const allocImpressions = allocations.length === 1 
      ? totalJobPrintedImpressions 
      : Number(alloc.allocated_pages ?? totalJobPrintedImpressions);

    const mode = alloc.color_mode || (item.colorPrintMode === 'MONO_K' ? 'MONO_K' : 'CMYK');
    const isMonoAlloc = mode === 'MONO_K';

    let cCov = 0;
    let mCov = 0;
    let yCov = 0;
    let kCov = 15;

    if (alloc.color_channels && alloc.color_channels.length > 0) {
      const cCh = alloc.color_channels.find(ch => ch.channel_name === 'C');
      const mCh = alloc.color_channels.find(ch => ch.channel_name === 'M');
      const yCh = alloc.color_channels.find(ch => ch.channel_name === 'Y');
      const kCh = alloc.color_channels.find(ch => ch.channel_name === 'K');
      cCov = isMonoAlloc ? 0 : (cCh ? resolveCoverageValue(cCh.density_pct, 15) : 15);
      mCov = isMonoAlloc ? 0 : (mCh ? resolveCoverageValue(mCh.density_pct, 15) : 15);
      yCov = isMonoAlloc ? 0 : (yCh ? resolveCoverageValue(yCh.density_pct, 15) : 15);
      kCov = kCh ? resolveCoverageValue(kCh.density_pct, 15) : 15;
    } else {
      const avg = resolveCoverageValue(alloc.average_density_pct ?? item.avgCoverage, 15);
      cCov = isMonoAlloc ? 0 : avg;
      mCov = isMonoAlloc ? 0 : avg;
      yCov = isMonoAlloc ? 0 : avg;
      kCov = avg;
    }

    const rawPrnId = (alloc.printer_id || '').split('__')[0];
    const prn = equipment.find(e => e.id === rawPrnId || e.id === alloc.printer_id || e.name === alloc.printer_name);

    const activePrnLinks = printerColorLinks.filter(l => l.assetId === prn?.id || l.assetId === rawPrnId);
    
    const standardCmykSlots = [
      { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'EPSON-008-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 7500, oemPrice: 450000 },
      { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemInkCode: 'EPSON-008-C', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
      { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemInkCode: 'EPSON-008-M', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
      { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemInkCode: 'EPSON-008-Y', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 }
    ];

    const rawOemSlots = (prn?.oem_baseline_specs?.slots && prn?.oem_baseline_specs.slots.length > 0)
      ? prn.oem_baseline_specs.slots
      : (prn?.specs?.oem_baseline_specs?.slots && prn?.specs.oem_baseline_specs.slots.length > 0)
        ? prn.specs.oem_baseline_specs.slots
        : (prn?.oemBaselineInks && prn?.oemBaselineInks.length > 0)
          ? prn.oemBaselineInks
          : (prn?.specs?.oemBaselineInks && prn?.specs?.oemBaselineInks.length > 0)
            ? prn.specs.oemBaselineInks
            : (prn?.printerColorLinks && prn?.printerColorLinks.length > 0)
              ? prn.printerColorLinks
              : (prn?.specs?.printerColorLinks && prn?.specs?.printerColorLinks.length > 0)
                ? prn.specs.printerColorLinks
                : standardCmykSlots;

    const prnPrintCost = prn ? calculateEquipmentPrintCost(prn, printerColorLinks, inventory, 'Printer') : null;
    const accurateMachRate = prnPrintCost ? prnPrintCost.netCostPerUnit : (prn ? getPrinterMachineRate(prn) : 0);

    const directColorInk = Number(prn?.colorInkCost || prn?.linkedInkCostPerPage || prn?.inkCostPerPage || (prnPrintCost ? prnPrintCost.linkedInkRatePerPage : 0) || 0);
    const directBwInk = Number(prn?.bwInkCost || (directColorInk > 0 ? directColorInk * 0.15 : 0) || 0);

    const computeChannel = (channelCode: 'C' | 'M' | 'Y' | 'K', covPct: number) => {
      if (covPct <= 0) return { ml: 0, cost: 0 };

      const idx = channelCode === 'K' ? 0 : channelCode === 'C' ? 1 : channelCode === 'M' ? 2 : 3;
      const colorGroupName = channelCode === 'K' ? 'Black' : channelCode === 'C' ? 'Cyan' : channelCode === 'M' ? 'Magenta' : 'Yellow';

      const oemSlot = rawOemSlots.find((s: any, sIdx: number) => {
        const pos = (s.slotPosition || '').toUpperCase();
        const grp = (s.colorGroup || '').toUpperCase();
        const sku = (s.oemInkCode || '').toUpperCase();
        if (channelCode === 'K') return pos.includes('BLACK') || pos.includes('(K') || pos.includes(' 1') || grp.includes('BLACK') || sku.endsWith('-BK') || sku.endsWith('-K') || sIdx === 0;
        if (channelCode === 'C') return pos.includes('CYAN') || pos.includes('(C') || pos.includes(' 2') || grp.includes('CYAN') || sku.endsWith('-C') || sIdx === 1;
        if (channelCode === 'M') return pos.includes('MAGENTA') || pos.includes('(M') || pos.includes(' 3') || grp.includes('MAGENTA') || sku.endsWith('-M') || sIdx === 2;
        if (channelCode === 'Y') return pos.includes('YELLOW') || pos.includes('(Y') || pos.includes(' 4') || grp.includes('YELLOW') || sku.endsWith('-Y') || sIdx === 3;
        return false;
      }) || standardCmykSlots.find((s: any) => s.colorGroup.toUpperCase().startsWith(channelCode === 'K' ? 'B' : channelCode));

      const defaultPrice = channelCode === 'K' ? 450000 : 320000;
      const defaultVol = channelCode === 'K' ? 127 : 70;
      const defaultYield = channelCode === 'K' ? 7500 : 6000;

      const oemVol = Number(oemSlot?.oemStandardVolumeMl || defaultVol);
      const rawYield = Number(oemSlot?.oemStandardIsoYieldA4 || (channelCode === 'K' ? (prn?.blackYieldPages || defaultYield) : (prn?.colorYieldPages || defaultYield)));
      const yld = rawYield > 500 ? rawYield : defaultYield;
      const isoRateMlPerSheet = yld > 0 ? (oemVol / yld) : (channelCode === 'K' ? (127 / 7500) : (70 / 6000));

      let slotBase5Pct = 0;

      if (prnPrintCost && prnPrintCost.inkSlotsBreakdown && prnPrintCost.inkSlotsBreakdown.length > 0) {
        const matchedSlot = prnPrintCost.inkSlotsBreakdown.find((s: any) => 
          (s.colorGroup && s.colorGroup.toLowerCase().includes(colorGroupName.toLowerCase())) ||
          (s.slotPosition && s.slotPosition.toLowerCase().includes(colorGroupName.toLowerCase())) ||
          (channelCode === 'K' && (s.colorGroup?.toLowerCase().includes('black') || s.slotPosition?.toLowerCase().includes('black') || s.slotPosition?.includes('Slot 1'))) ||
          (channelCode === 'C' && (s.colorGroup?.toLowerCase().includes('cyan') || s.slotPosition?.toLowerCase().includes('cyan') || s.slotPosition?.includes('Slot 2'))) ||
          (channelCode === 'M' && (s.colorGroup?.toLowerCase().includes('magenta') || s.slotPosition?.toLowerCase().includes('magenta') || s.slotPosition?.includes('Slot 3'))) ||
          (channelCode === 'Y' && (s.colorGroup?.toLowerCase().includes('yellow') || s.slotPosition?.toLowerCase().includes('yellow') || s.slotPosition?.includes('Slot 4')))
        );
        if (matchedSlot && matchedSlot.costPerPage > 0) {
          slotBase5Pct = matchedSlot.costPerPage;
        }
      }

      if (slotBase5Pct <= 0 && directColorInk > 0) {
        if (channelCode === 'K') {
          slotBase5Pct = directBwInk > 0 ? directBwInk : (directColorInk * 0.25);
        } else {
          slotBase5Pct = directBwInk > 0 ? Math.max(0, (directColorInk - directBwInk) / 3) : (directColorInk * 0.25);
        }
      }

      if (slotBase5Pct <= 0) {
        const slotPos = oemSlot?.slotPosition || `Slot ${idx + 1}`;
        const link = activePrnLinks.find((lnk: any) => 
          lnk.slotPosition === slotPos || 
          (lnk.slotPosition && slotPos && (lnk.slotPosition.includes(slotPos) || slotPos.includes(lnk.slotPosition))) ||
          (lnk.colorGroup && colorGroupName && lnk.colorGroup.toLowerCase() === colorGroupName.toLowerCase()) ||
          (idx === 0 && (lnk.slotPosition?.includes('Slot 1') || lnk.colorGroup?.toLowerCase().includes('black') || lnk.colorGroup?.toLowerCase().includes('k'))) ||
          (idx === 1 && (lnk.slotPosition?.includes('Slot 2') || lnk.colorGroup?.toLowerCase().includes('cyan') || lnk.colorGroup?.toLowerCase().includes('c'))) ||
          (idx === 2 && (lnk.slotPosition?.includes('Slot 3') || lnk.colorGroup?.toLowerCase().includes('magenta') || lnk.colorGroup?.toLowerCase().includes('m'))) ||
          (idx === 3 && (lnk.slotPosition?.includes('Slot 4') || lnk.colorGroup?.toLowerCase().includes('yellow') || lnk.colorGroup?.toLowerCase().includes('y')))
        );

        const linkedItem = link ? (inventory || []).find((inv: any) => inv.id === link.inkCode || inv.skuCode === link.inkCode || inv.sku === link.inkCode) : null;

        slotBase5Pct = yld > 0 ? (Number(oemSlot?.oemPrice || defaultPrice) / yld) : ((Number(oemSlot?.oemPrice || defaultPrice) / oemVol) * isoRateMlPerSheet);

        if (linkedItem) {
          const bPrice = Number(linkedItem.unitPrice || linkedItem.costPerPurchaseUnit || defaultPrice);
          const rawInkVol = Number(linkedItem.volume || linkedItem.specs?.volume || linkedItem.specs?.volume_ml || defaultVol);
          const actualVol = rawInkVol > 1 ? rawInkVol : defaultVol;
          const rawInkYield = Number(linkedItem.yield || linkedItem.standard_page_yield || linkedItem.specs?.yield || linkedItem.specs?.isoYield || 0);
          const inkYield = rawInkYield > 500 ? rawInkYield : yld;
          slotBase5Pct = inkYield > 0 ? (bPrice / inkYield) : ((bPrice / actualVol) * isoRateMlPerSheet);
        }
      }

      const ml = isoRateMlPerSheet * (covPct / 5) * printAreaFactor * allocImpressions;
      const cost = slotBase5Pct * (covPct / 5) * printAreaFactor * allocImpressions;
      return { ml, cost };
    };

    const cResult = computeChannel('C', cCov);
    const mResult = computeChannel('M', mCov);
    const yResult = computeChannel('Y', yCov);
    const kResult = computeChannel('K', kCov);

    cyanMl += cResult.ml;
    magentaMl += mResult.ml;
    yellowMl += yResult.ml;
    blackMl += kResult.ml;

    totalInkCostAccum += (cResult.cost + mResult.cost + yResult.cost + kResult.cost);

    const deprRate = prnPrintCost
      ? prnPrintCost.baseCostPerUnit
      : (accurateMachRate > 0 ? accurateMachRate * 0.65 : 0);

    const maintRate = prnPrintCost
      ? prnPrintCost.wearAllowancePerUnit
      : (accurateMachRate > 0 ? accurateMachRate - deprRate : 0);

    const deprPerSheet = deprRate * (printAreaFactor > 0 ? printAreaFactor : 1);
    const maintPerSheet = maintRate * (printAreaFactor > 0 ? printAreaFactor : 1);

    machDepr += Math.round(deprPerSheet * allocImpressions);
    machMaint += Math.round(maintPerSheet * allocImpressions);
  });

  // Separate Cover Print Ink & Machine Overhead Calculation
  let coverInkCost = 0;
  let coverMachDepr = 0;
  let coverMachMaint = 0;

  if (hasCover) {
    const coverPrnId = (item.selectedPrinterId || 'default').split('__')[0];
    const coverPrn = equipment.find(e => e.id === coverPrnId || e.id === item.selectedPrinterId);
    const coverSides = item.coverPrintMode === 'CMYK_2_SIDES' ? 2 : 1;
    const isCoverMono = item.coverPrintMode === 'MONO_K';
    const coverPrintSheets = orderQty;

    const coverPrnPrintCost = coverPrn ? calculateEquipmentPrintCost(coverPrn, printerColorLinks, inventory, 'Printer') : null;
    const coverInkPerPage = coverPrn ? Number(coverPrn.colorInkCost || coverPrn.linkedInkCostPerPage || (coverPrnPrintCost ? coverPrnPrintCost.linkedInkRatePerPage : 0) || 56.09) : 56.09;
    const coverInkUnitCost = isCoverMono ? (Number(coverPrn?.bwInkCost || (coverInkPerPage * 0.25) || 8.59)) : coverInkPerPage;
    const coverSpreadAreaFactor = Math.max(0.01, (Number(jobW) * 2 * Number(jobH)) / A4_AREA);
    coverInkCost = Math.round(coverPrintSheets * coverSides * coverInkUnitCost * coverSpreadAreaFactor);

    const coverMachRate = coverPrnPrintCost ? coverPrnPrintCost.netCostPerUnit : (getPrinterMachineRate(coverPrn) || 139.67);
    const coverDeprRate = coverPrnPrintCost ? coverPrnPrintCost.baseCostPerUnit : (coverMachRate * 0.65);
    const coverMaintRate = coverPrnPrintCost ? coverPrnPrintCost.wearAllowancePerUnit : (coverMachRate - coverDeprRate);

    coverMachDepr = Math.round(coverPrintSheets * coverSides * coverDeprRate * coverSpreadAreaFactor);
    coverMachMaint = Math.round(coverPrintSheets * coverSides * coverMaintRate * coverSpreadAreaFactor);

    totalInkCostAccum += coverInkCost;
    machDepr += coverMachDepr;
    machMaint += coverMachMaint;
  }

  const hasPaperModule = item.activeModules ? item.activeModules.paper : true;
  const hasPrintEngineModule = item.activeModules ? item.activeModules.printEngine : true;
  const hasPostPressModule = item.activeModules ? item.activeModules.postPressMachinery : true;
  const hasFinishingMaterialsModule = item.activeModules ? item.activeModules.finishingMaterials : true;
  const hasPackagingModule = item.activeModules ? item.activeModules.packagingDelivery : true;

  const offcutRebate = Boolean(item.useOffcutRebate) ? Math.min(Math.round(innerPaperCost + coverPaperCost), Number(item.offcutRebateAmount || 0)) : 0;
  const rawPaperCost = Math.max(0, Math.round(innerPaperCost + coverPaperCost - offcutRebate));
  const rawInkCost = Math.round(totalInkCostAccum);
  const rawMachineOverhead = machDepr + machMaint;
  const guillotineFee = 0;

  const rawPostPressCost = (item.selectedPostPressIds || []).reduce((sum, machId) => {
    const mach = equipment.find(e => e.id === machId);
    if (!mach || (preCut && String(mach.postPressSubtype || mach.specs?.postPressSubtype || '').toLowerCase() === 'guillotine')) return sum;
    const accCost = getEquipmentAccurateCost(mach);
    const rate = accCost.totalMachineCost > 0
      ? accCost.totalMachineCost
      : (Number((mach as any).costPerPage) || Number((mach as any).calculatedCostPerPage) || 0);
    return sum + Math.round(rate * item.printVolume);
  }, 0);

  const rawFinishingMaterialsCost = (item.finishingMaterials || []).reduce((sum, mat) => {
    const uCost = Number(mat.unitCost) || 0;
    const q = Number(mat.qtyPerItem) || 1;
    const isSqm = mat.calcMode === 'sqm' || 
      (mat.unitName || '').toLowerCase().includes('m²') || 
      (mat.unitName || '').toLowerCase().includes('m2') || 
      (mat.unitName || '').toLowerCase().includes('ຕລ.ມ') || 
      (mat.unitName || '').toLowerCase().includes('ຕາຕະລາງແມັດ');
    if (isSqm) {
      const itemAreaM2 = (Number(jobW || 210) * Number(jobH || 297)) / 1000000.0;
      return sum + Math.round(uCost * itemAreaM2 * q * item.printVolume);
    }
    return sum + Math.round(uCost * q * item.printVolume);
  }, 0);

  const paperCost = hasPaperModule ? rawPaperCost : 0;
  const inkCost = hasPrintEngineModule ? rawInkCost : 0;
  const machineOverhead = hasPrintEngineModule ? rawMachineOverhead : 0;
  const postPressCost = hasPostPressModule ? rawPostPressCost : 0;
  const finishingMaterialsCost = hasFinishingMaterialsModule ? rawFinishingMaterialsCost : 0;

  const directMatMach = paperCost + inkCost + machineOverhead + postPressCost + finishingMaterialsCost;
  const netCost = directMatMach;

  const hasLaborModule = item.activeModules?.laborAndSetup !== undefined
    ? Boolean(item.activeModules.laborAndSetup)
    : (item.laborPercent !== undefined ? Number(item.laborPercent) > 0 : false) || (item.laborMode === 'manual' && Number(item.laborCostManual || 0) > 0);

  let laborCost = 0;
  if (hasLaborModule) {
    if (item.laborMode === 'manual') {
      laborCost = Math.max(0, Number(item.laborCostManual || 0));
    } else {
      const pct = Math.max(0, Number(item.laborPercent ?? 0));
      if (pct > 0) {
        laborCost = Math.round(directMatMach * (pct / 100));
      }
    }
  }

  let calculatedPkgCost = Number(item.packagingCost || 0);
  if (item.packagingType && item.packagingType !== 'none' && item.packagingType !== 'custom') {
    if (item.packagingType === 'box_card') {
      calculatedPkgCost = Math.ceil(Math.max(1, item.printVolume) / 100) * 3500;
    } else if (item.packagingType === 'kraft_wrap') {
      calculatedPkgCost = Math.ceil(Math.max(1, item.printVolume) / 500) * 2000;
    } else if (item.packagingType === 'box_corrugated') {
      calculatedPkgCost = Math.ceil(Math.max(1, item.printVolume) / 1000) * 8000;
    } else if (item.packagingType === 'bubble_wrap') {
      calculatedPkgCost = 5000;
    }
  }
  const finalItemPkgCost = (item.packagingType && item.packagingType !== 'custom' && calculatedPkgCost > 0)
    ? calculatedPkgCost
    : Number(item.packagingCost || 0);

  const packagingDeliveryCost = hasPackagingModule ? (finalItemPkgCost + Number(item.deliveryCost || 0)) : 0;

  const totals = commercialTotals(netCost, laborCost, packagingDeliveryCost, item.printVolume, quotationProfitMargin ?? item.profitMargin ?? 40, quotationDiscountPercent ?? item.discountPercent ?? 0);
  const { baseSellingPrice, discountAmt, sellingPrice: finalSellingPrice, unitPrice, unitCost, profit } = totals;

  return {
    cutsPerSheet: imposed?.capacity ?? cutsPerSheet,
    parentSheetsNeeded,
    totalParentSheets,
    wastedSheets,
    itemSpoilageRate,
    isSpoilageActive,
    paperUnitCost,
    paperCost,
    innerPaperCost,
    coverPaperCost,
    coverPaperUnitCost,
    totalInnerSheets,
    totalInnerParentSheets,
    totalCoverParentSheets,
    innerPagesPerBook,
    innerSheetsPerBook,
    hasCover,
    isBatchPhoto,
    photoCountPerSet,
    totalPhotos: totalInnerSheets,
    totalJobProductionSheets,
    totalProductionSheets: totalJobProductionSheets,
    cyanMl,
    magentaMl,
    yellowMl,
    blackMl,
    inkCost,
    coverInkCost,
    machineOverhead,
    machDepr,
    machMaint,
    electricityCost: 0,
    postPressCost,
    finishingMaterialsCost,
    packagingDeliveryCost,
    packagingCost: finalItemPkgCost,
    offcutRebate,
    guillotineFee,
    laborCost,
    directMatMach,
    netCost,
    baseSellingPrice,
    discountAmt,
    sellingPrice: finalSellingPrice,
    unitPrice,
    unitCost,
    profit,
    marginPercent: finalSellingPrice > 0 ? (profit / finalSellingPrice) * 100 : 0
  };
}

export function calculateItemFinancials(item: QuotationItem, context: CalculationContext = {}): ItemFinancialResult {
  const isPhoto = Boolean(item.isBatchPhoto || item.name?.includes('Photo Prints') || item.batchFiles?.length || (item.preflightData as any)?.is_batch_photo);
  const capacity = Math.max(1, Math.floor(Number(item.imagesPerSheet) || 4));
  const copies = (Number(item.photoCount) || item.batchFiles?.length || Number(item.pagesPerBook || 1)) * Number(item.printVolume || 1);
  const imposed = item.imposition_mode !== 'OFF' && isPhoto && item.multipleImagesPerSheet && !item.artworkParts?.length 
    ? { copies, capacity, sheets: Math.ceil(copies / capacity) } 
    : undefined;
  const shared = calculateSingleItemFinancials(item, context, imposed);
  if (!item.artworkParts?.length) return { ...shared, partCosts: undefined, sharedCosts: undefined };
  const partCosts = item.artworkParts.map(part => {
    const cost = calculateSingleItemFinancials(itemForArtworkPart(item, part), context);
    return {
      role: part.role,
      sourceUrl: part.source.url,
      pages: part.pageCount,
      paperCost: cost.paperCost,
      inkCost: cost.inkCost,
      machineOverhead: cost.machineOverhead,
      parentSheets: cost.totalParentSheets,
      productionSheets: cost.totalProductionSheets,
      cutsPerSheet: cost.cutsPerSheet,
      paperUnitCost: cost.paperUnitCost,
      wastedSheets: cost.wastedSheets,
      parentSheetsNeeded: cost.parentSheetsNeeded,
      totalSheets: cost.totalInnerSheets,
      sheetsPerCopy: cost.innerSheetsPerBook,
      machDepr: cost.machDepr,
      machMaint: cost.machMaint,
      cyanMl: cost.cyanMl,
      magentaMl: cost.magentaMl,
      yellowMl: cost.yellowMl,
      blackMl: cost.blackMl
    };
  });
  return { ...shared, partCosts, sharedCosts: shared };
}
