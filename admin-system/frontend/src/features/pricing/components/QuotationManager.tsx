import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';
import CustomerCombobox from '@components/common/CustomerCombobox';
import ManualPrinterAllocator from '@features/orders/components/ManualPrinterAllocator';
import { PrinterAllocation } from '@features/orders/types';
import type { Equipment } from '@features/equipment/types';
import { calculateMachineUnitCost, getEquipmentAccurateCost, calculateEquipmentPrintCost } from '@utils/machineCostCalculator';
import { ArtworkColorPreviewModal } from './ArtworkColorPreviewModal';
import { CustomerCategoryModal } from '@features/customers/components/CustomerCategoryModal';
import { QuotationMarginApprovalModal } from './QuotationMarginApprovalModal';
import { QuotationSaveTemplateModal } from './QuotationSaveTemplateModal';
import { QuotationCostSummarySidebar } from './QuotationCostSummarySidebar';
import { QuotationSaveModal } from './QuotationSaveModal';
import { QuotationShareModal } from './QuotationShareModal';
import { PricingTemplatesModal } from './PricingTemplatesModal';
import { QuotationHistoryModal } from './QuotationHistoryModal';
import { PreflightItemCreationModal } from '../../../components/PreflightItemCreationModal';
import type { PreflightResult } from '@features/orders/types';
import { PaperMaterialSelectorModal } from './PaperMaterialSelectorModal';
import { PrinterSelectorModal } from './PrinterSelectorModal';
import { PostPressSelectorModal } from './PostPressSelectorModal';
import { MaterialInventorySearchModal } from './MaterialInventorySearchModal';
import { JobQuantityAndPagesSection } from './JobQuantityAndPagesSection';
import { PaperAndCoverSection } from './PaperAndCoverSection';
import { QuotationPrintEngineTab } from './tabs/QuotationPrintEngineTab';
import { QuotationPostPressTab } from './tabs/QuotationPostPressTab';
import { 
  FinishingMaterialItem, 
  PricingTemplatePreset, 
  DEFAULT_PRICING_TEMPLATES 
} from '../data/defaultTemplates';

export type { FinishingMaterialItem, PricingTemplatePreset };
export { DEFAULT_PRICING_TEMPLATES };
import { getAuthHeaders } from '@utils/authHeaders';
import { 
  Calculator, 
  ShieldAlert, 
  ShieldCheck,
  Coins,
  AlertTriangle,
  Info,
  Sliders,
  Scissors,
  Settings,
  Download,
  ShoppingCart,
  Layers,
  Layers3,
  PercentSquare,
  ArrowLeft,
  ArrowRight,
  Palette,
  X,
  Truck,
  Share2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  User,
  Hash,
  Wrench,
  Zap,
  CheckSquare,
  Square,
  FileText,
  Printer,
  Save,
  BookOpen,
  Calendar,
  CreditCard,
  Plus,
  Trash2,
  Box,
  PackageCheck,
  Bookmark,
  Package,
  Tag,
  ToggleLeft,
  ToggleRight,
  Search,
  Phone,
  Edit3,
  Eye,
  FolderPlus,
  UserPlus,
  UserCheck,
  Upload,
  Image as ImageIcon,
  Images,
} from 'lucide-react';
import { FormModalTemplate, FormSection } from '@components/common/FormModalTemplate';

export interface ItemModuleToggles {
  paper: boolean;               // 1. Paper / Substrate & Cut
  printEngine: boolean;         // 2. Printing Process & Ink
  postPressMachinery: boolean;  // 3. Post-Press Machinery
  finishingMaterials: boolean;  // 4. Finishing Materials & Consumables (NEW)
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

const DEFAULT_CHANNELS = [
  { channel_name: 'C', density_pct: 15, is_spot_color: false },
  { channel_name: 'M', density_pct: 15, is_spot_color: false },
  { channel_name: 'Y', density_pct: 15, is_spot_color: false },
  { channel_name: 'K', density_pct: 15, is_spot_color: false },
];

const DEFAULT_MONO_CHANNELS = [
  { channel_name: 'K', density_pct: 15, is_spot_color: false },
];

export interface QuotationItem {
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
  coverFileName?: string;
  coverArtworkUrl?: string;
  coverFileSize?: number;
  preflightData?: PreflightResult;
  batchFiles?: any[];
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

export default function QuotationManager({ onConvertToOrder, onBack, prefilledSpecs }: any) {
  const { 
    inventory, 
    equipment, 
    getFIFOCostPerSheet, 
    checkCreditLimit, 
    customers, 
    customerCategories = [],
    addCustomer,
    addOrder,
    showToast,
    askConfirmation,
    preselectedCustomerName,
    setPreselectedCustomerName,
    prefilledOrderSpecs,
    setPrefilledOrderSpecs,
    quotations,
    addQuotation,
    reviseQuotation,
    deleteQuotation,
    convertQuotationToOrder,
    currency,
    setCurrency,
    formatCurrency,
    printerColorLinks,
    setActiveTab,
  } = useApp();
  
  const [quotationSearchQuery, setQuotationSearchQuery] = useState('');
  const itemFileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic 1-Click Fast Presets (PostgreSQL DB + LocalStorage fallback)
  const [customFastPresets, setCustomFastPresets] = useState<PricingTemplatePreset[]>(() => {
    try {
      const saved = localStorage.getItem('somsing_custom_fast_presets');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PRICING_TEMPLATES.slice(0, 5);
  });

  useEffect(() => {
    fetch('/api/v1/quotations/templates', { headers: getAuthHeaders() })
      .then(res => res.ok ? res.json() : null)
      .then(resData => {
        const list = Array.isArray(resData) ? resData : (resData?.data || []);
        if (list && list.length > 0) {
          const mapped: PricingTemplatePreset[] = list.map((item: any) => {
            const spec = item.spec || {};
            return {
              id: item.id,
              name: item.name || item.nameEn || item.nameLao,
              nameLao: item.nameLao || item.name,
              nameEn: item.nameEn || item.name,
              category: item.category || 'General',
              iconName: item.iconName || 'Sparkles',
              description: item.description || '',
              ...spec
            };
          });
          setCustomFastPresets(mapped);
          try {
            localStorage.setItem('somsing_custom_fast_presets', JSON.stringify(mapped));
          } catch (e) {
            console.error(e);
          }
        }
      })
      .catch(console.error);
  }, []);

  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetIcon, setNewPresetIcon] = useState('Sparkles');
  
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const formatInkMl = (ml?: number) => {
    if (!ml || ml <= 0) return '0.00';
    if (ml < 0.01) return ml.toFixed(3);
    if (ml < 1) return ml.toFixed(3);
    return ml.toFixed(1);
  };

  const papers = inventory.filter(item => {
    const cat = (item.category || '').toLowerCase();
    return cat === 'paper' || cat === 'material' || cat === 'parent_sheet' || cat === 'offcut' || (item.specs?.paperFormat || item.paperFormat);
  });
  const offcuts = inventory.filter(item => {
    const cat = (item.category || '').toLowerCase();
    return cat === 'offcut' || cat === 'scrap';
  });
  const printers = equipment.filter(eq => {
    const cat = (eq.category || '').toLowerCase();
    const type = (eq.printerType || (eq as any).printerCategory || '').toLowerCase();
    const isPrintCat = cat.includes('printer') || cat.includes('press') || type.includes('digital') || type.includes('offset') || type.includes('inkjet');
    const isExplicitNonPrinter = cat.includes('cut') || cat.includes('trim') || cat.includes('post') || cat.includes('finish') || cat.includes('bind') || cat.includes('laminat');
    return (isPrintCat || eq.id?.startsWith('PRN-')) && !isExplicitNonPrinter;
  });

  const postPressEquipment = equipment.filter(eq => {
    const cat = (eq.category || '').toLowerCase();
    const type = (eq.printerType || (eq as any).printerCategory || '').toLowerCase();
    const isPrinter = cat.includes('printer') || cat.includes('press') || type.includes('digital') || type.includes('offset') || type.includes('inkjet') || eq.id?.startsWith('PRN-');
    return !isPrinter;
  });

  const spoilageTiers = [
    { min: 1, max: 100, rate: 10 },
    { min: 101, max: 500, rate: 7 },
    { min: 501, max: 2000, rate: 5 },
    { min: 2001, max: 1000000, rate: 3 },
  ];

  const getPrinterMachineRate = (p: any) => {
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
      p.TargetTotalPages || 
      p.printedPagesCapacity || 
      p.expectedLifeA4Pages || 
      p.lifetimePagesA4 || 
      (estMonthlyVolume * totalMonths) || 
      3000000
    );
    const monthlyDepr = totalMonths > 0 ? (assetValue / totalMonths) : 0;
    const baseCostPerUnit = (estMonthlyVolume > 0 && monthlyDepr > 0)
      ? (monthlyDepr / estMonthlyVolume)
      : (targetPages > 0 ? (assetValue / targetPages) : 0);

    const wearAllowancePerUnit = Math.round(baseCostPerUnit * (maintenanceRatePct / 100) * 1000) / 1000 + maintCostPerPage;
    const netCostPerUnit = Math.round((baseCostPerUnit + wearAllowancePerUnit) * 1000) / 1000;

    return netCostPerUnit > 0 ? netCostPerUnit : Number(p.calculatedCostPerPage || p.costPerPage || 1.20);
  };

  const getPrinterActualInkCostPerPage = (p: any) => {
    if (!p) return 0;
    const isPostPress = p.category && p.category !== 'Printer' && p.category !== 'PRINTER';
    if (isPostPress) return 0;

    // Prioritize direct persistent ink cost field on equipment
    const directInk = Number(p.colorInkCost || p.linkedInkCostPerPage || p.inkCostPerPage || (p.specs as any)?.colorInkCost || 0);
    if (directInk > 0) return directInk;

    const printCost = calculateEquipmentPrintCost(p, printerColorLinks, inventory, 'Printer');
    if (printCost && printCost.linkedInkRatePerPage > 0) {
      return printCost.linkedInkRatePerPage;
    }

    const activePrnLinks = printerColorLinks.filter((l: any) => l.assetId === p.id);
    const oemSlots = (p.oem_baseline_specs?.slots && p.oem_baseline_specs.slots.length > 0)
      ? p.oem_baseline_specs.slots
      : (p.specs?.oem_baseline_specs?.slots && p.specs.oem_baseline_specs.slots.length > 0)
        ? p.specs.oem_baseline_specs.slots
        : (p.printerColorLinks && p.printerColorLinks.length > 0)
          ? p.printerColorLinks
          : (p.oemBaselineInks && p.oemBaselineInks.length > 0)
            ? p.oemBaselineInks
            : (p.specs?.printerColorLinks && p.specs?.printerColorLinks.length > 0)
              ? p.specs.printerColorLinks
              : (p.specs?.oemBaselineInks && p.specs?.oemBaselineInks.length > 0)
                ? p.specs.oemBaselineInks
                : [
                    { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'EPSON-008-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 7500, oemPrice: 450000 },
                    { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemInkCode: 'EPSON-008-C', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
                    { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemInkCode: 'EPSON-008-M', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
                    { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemInkCode: 'EPSON-008-Y', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 }
                  ];

    const totalInkRate = oemSlots.reduce((sum: number, oemSlot: any, idx: number) => {
      const slotPos = oemSlot.slotPosition || `Slot ${idx + 1}`;
      const isBlack = (oemSlot.colorGroup || '').toLowerCase().includes('black') || (oemSlot.colorGroup || '').toLowerCase().includes('k') || slotPos.toLowerCase().includes('black') || slotPos.toLowerCase().includes('slot 1');
      const colorGroupName = isBlack ? 'Black' : (oemSlot.colorGroup || (idx === 1 ? 'Cyan' : idx === 2 ? 'Magenta' : idx === 3 ? 'Yellow' : `Color ${idx + 1}`));
      const defaultYield = isBlack ? 7500 : 6000;
      const defaultPrice = isBlack ? 450000 : 320000;
      const defaultVol = isBlack ? 127 : 70;

      const activeLink = activePrnLinks.find((lnk: any) => 
        lnk.slotPosition === slotPos || 
        (lnk.slotPosition && slotPos && (lnk.slotPosition.includes(slotPos) || slotPos.includes(lnk.slotPosition))) ||
        (lnk.colorGroup && colorGroupName && lnk.colorGroup.toLowerCase() === colorGroupName.toLowerCase()) ||
        (idx === 0 && (lnk.slotPosition?.includes('Slot 1') || lnk.colorGroup?.toLowerCase().includes('black') || lnk.colorGroup?.toLowerCase().includes('k'))) ||
        (idx === 1 && (lnk.slotPosition?.includes('Slot 2') || lnk.colorGroup?.toLowerCase().includes('cyan') || lnk.colorGroup?.toLowerCase().includes('c'))) ||
        (idx === 2 && (lnk.slotPosition?.includes('Slot 3') || lnk.colorGroup?.toLowerCase().includes('magenta') || lnk.colorGroup?.toLowerCase().includes('m'))) ||
        (idx === 3 && (lnk.slotPosition?.includes('Slot 4') || lnk.colorGroup?.toLowerCase().includes('yellow') || lnk.colorGroup?.toLowerCase().includes('y')))
      );
      const ink = activeLink ? inventory.find(i => i.id === activeLink.inkCode || i.skuCode === activeLink.inkCode || i.sku === activeLink.inkCode) : null;

      const oemVol = Number(oemSlot.oemStandardVolumeMl || oemSlot.volume || defaultVol);
      const rawYield = Number(oemSlot.oemStandardIsoYieldA4 || (oemSlot.colorGroup === 'Black' ? (p.blackYieldPages || defaultYield) : (p.colorYieldPages || defaultYield)));
      const yld = rawYield > 500 ? rawYield : defaultYield;
      const isoRate = yld > 0 ? (oemVol / yld) : 0.0169;
      
      let slotCost = yld > 0 ? (Number(oemSlot.oemPrice || defaultPrice) / yld) : ((Number(oemSlot.oemPrice || defaultPrice) / oemVol) * isoRate);

      if (ink) {
        const bPrice = Number(ink.unitPrice || ink.costPerPurchaseUnit || defaultPrice);
        const rawInkVol = Number(ink.volume || ink.specs?.volume || ink.specs?.volume_ml || defaultVol);
        const actualVol = rawInkVol > 1 ? rawInkVol : defaultVol;

        const rawInkYield = Number(ink.yield || ink.standard_page_yield || ink.specs?.yield || ink.specs?.isoYield || 0);
        const inkYield = rawInkYield > 500 ? rawInkYield : yld;
        slotCost = inkYield > 0 ? (bPrice / inkYield) : ((bPrice / actualVol) * isoRate);
      }
      
      return sum + slotCost;
    }, 0);

    return Math.round(totalInkRate * 1000) / 1000;
  };

  const createNewItem = (name = 'ລາຍການສິນຄ້າ 1', specs?: any): QuotationItem => {
    const isMono = (specs?.colorPrintMode || specs?.colorMode) === 'MONO_K';
    const pageCount = Number(specs?.pageCount) || (specs ? 1 : 1);
    const orderQty = Number(specs?.orderQuantity) || 1;
    const isBook = pageCount >= 4;

    const covC = specs ? (isMono ? 0 : (specs.cCoverage !== undefined ? Number(specs.cCoverage) : (specs.avgCovC !== undefined ? Number(specs.avgCovC) : 5))) : 5;
    const covM = specs ? (isMono ? 0 : (specs.mCoverage !== undefined ? Number(specs.mCoverage) : (specs.avgCovM !== undefined ? Number(specs.avgCovM) : 5))) : 5;
    const covY = specs ? (isMono ? 0 : (specs.yCoverage !== undefined ? Number(specs.yCoverage) : (specs.avgCovY !== undefined ? Number(specs.avgCovY) : 5))) : 5;
    const covK = specs ? (specs.kCoverage !== undefined ? Number(specs.kCoverage) : (specs.avgCovK !== undefined ? Number(specs.avgCovK) : 5)) : 5;
    const avgCov = Math.round((covC + covM + covY + covK) / (isMono ? 1 : 4));

    const defaultPrinter: Equipment = printers[0] || ({ id: 'PRN-DEFAULT', name: 'Default Printer' } as unknown as Equipment);
    const defaultPaper = papers[0]?.id || '';
    const defaultPostPress = (isBook && postPressEquipment.length > 0) ? [postPressEquipment[0].id] : [];
    const defPrnCost = calculateEquipmentPrintCost(defaultPrinter, printerColorLinks, inventory, 'Printer');
    const rate = defPrnCost.netCostPerUnit;
    const inkBaseRate = Number(defaultPrinter.colorInkCost || defaultPrinter.linkedInkCostPerPage || defPrnCost.linkedInkRatePerPage || 0);

    const channels = isMono ? [
      { channel_name: 'K', density_pct: covK, is_spot_color: false }
    ] : [
      { channel_name: 'C', density_pct: covC, is_spot_color: false },
      { channel_name: 'M', density_pct: covM, is_spot_color: false },
      { channel_name: 'Y', density_pct: covY, is_spot_color: false },
      { channel_name: 'K', density_pct: covK, is_spot_color: false },
    ];

    const totalJobSheets = Math.ceil(pageCount / (isBook ? 2 : 1)) * orderQty;
    const initialAllocations: PrinterAllocation[] = [{
      printer_id: defaultPrinter.id,
      printer_name: defaultPrinter.name || defaultPrinter.id,
      allocated_pages: totalJobSheets,
      cost_per_page: rate,
      ink_cost_per_page: inkBaseRate,
      subtotal_cost: totalJobSheets * rate,
      color_mode: isMono ? 'MONO_K' : 'CMYK',
      average_density_pct: avgCov,
      color_channels: channels,
      is_double_sided: isBook
    }];

    const defaultCoverPaper = papers.find(p => p.name?.includes('260') || p.name?.includes('300') || p.name?.includes('Art'))?.id || defaultPaper;

    return {
      id: `item-${Date.now()}-${Math.random().toString().slice(-4)}`,
      name: specs?.jobName || name,
      paperId: specs?.paperId || specs?.selected_paper_id || defaultPaper,
      jobSizePreset: specs?.suggestedPaper || specs?.target_paper_size || 'A4',
      jobWidth: Number(specs?.jobWidth) || 210,
      jobHeight: Number(specs?.jobHeight) || 297,
      isDoubleSided: isBook ? true : false,
      printVolume: orderQty,
      pagesPerBook: pageCount,
      unitName: isBook ? 'ຊຸດ' : 'ແຜ່ນ',
      includeCover: isBook,
      coverPaperId: specs?.coverPaperId || specs?.cover_paper_id || defaultCoverPaper,
      coverPrintMode: 'CMYK_1_SIDE',
      coverPagesCount: 4,
      colorPrintMode: isMono ? 'MONO_K' : 'CMYK',
      coverageMode: specs ? 'advanced' : 'default',
      avgCoverage: avgCov,
      cCoverage: covC,
      mCoverage: covM,
      yCoverage: covY,
      kCoverage: covK,
      cutsPerSheetOverride: specs?.cutsPerSheetOverride !== undefined ? specs?.cutsPerSheetOverride : specs?.cuts_per_sheet_override,
      coverCutsPerSheetOverride: specs?.coverCutsPerSheetOverride !== undefined ? specs?.coverCutsPerSheetOverride : specs?.cover_cuts_per_sheet_override,
      impositionSummary: specs?.impositionSummary || specs?.imposition_summary,
      fileName: specs?.fileName,
      artworkUrl: specs?.artworkUrl,
      fileSize: specs?.fileSize,
      mimeType: specs?.mimeType,
      preflightData: specs?.preflightData,
      batchFiles: specs?.batchFiles || specs?.preflightData?.batch_files || [],
      selectedPrinterId: defaultPrinter.id,
      selectedInkSet: 'Konica C6085 OEM Set',
      printerAllocations: initialAllocations,
      selectedPostPressIds: specs?.selectedPostPressIds || defaultPostPress,
      finishingMaterials: specs?.finishingMaterials || (isBook ? [
        { 
          id: `mat-${Date.now()}-1`, 
          name: 'ລວດເຢັບແມັກມຸງຫຼັງຄາ (Staple Wire)', 
          calcMode: 'box',
          packagePrice: 50000,
          unitsPerPackage: 1000,
          unitCost: 50, 
          qtyPerItem: 2, 
          unitName: 'ໂຕ',
          category: 'staple' 
        }
      ] : []),
      activeModules: specs?.activeModules || {
        paper: true,
        printEngine: true,
        postPressMachinery: isBook ? true : false,
        finishingMaterials: isBook ? true : false,
        laborAndSetup: specs?.activeModules?.laborAndSetup !== undefined ? specs.activeModules.laborAndSetup : true,
        packagingDelivery: false,
      },
      packagingCost: 0,
      deliveryCost: 0,
      selectedTemplateId: specs?.selectedTemplateId || (isBook ? 'TPL_BOOKLET_STAPLE' : 'TPL_SHEET_STD'),
      laborMode: 'percent',
      laborPercent: 0,
      laborCostManual: 50000,
      profitMargin: 40,
      discountPercent: 0,
      useSpoilage: specs?.useSpoilage !== undefined ? specs.useSpoilage : true,
    };
  };

  const incomingSpecs = prefilledSpecs || prefilledOrderSpecs;

  const [items, setItems] = useState<QuotationItem[]>(() => [
    createNewItem(incomingSpecs?.jobName || 'ລາຍການທີ 1', incomingSpecs)
  ]);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const activeItem = items[activeItemIndex] || items[0];

  // Auto-sync when prefilledOrderSpecs or prefilledSpecs arrives dynamically
  useEffect(() => {
    if (incomingSpecs && (incomingSpecs.avgCovC !== undefined || incomingSpecs.cCoverage !== undefined || incomingSpecs.jobName || incomingSpecs.pageCount || incomingSpecs.jobWidth || incomingSpecs.suggestedPaper)) {
      const isBatch = Boolean(incomingSpecs.is_batch_photo || incomingSpecs.isBatchPhoto || incomingSpecs.jobName?.includes('Photo Prints') || (incomingSpecs.batchFiles && incomingSpecs.batchFiles.length > 0) || (incomingSpecs.preflightData as any)?.is_batch_photo);
      const isMono = !isBatch && ((incomingSpecs.colorPages === 0 && (incomingSpecs.monoPages || 0) > 0) || incomingSpecs.colorMode === 'MONO_K');
      const c = Number(incomingSpecs.cCoverage !== undefined ? incomingSpecs.cCoverage : (incomingSpecs.avgCovC || 0));
      const m = Number(incomingSpecs.mCoverage !== undefined ? incomingSpecs.mCoverage : (incomingSpecs.avgCovM || 0));
      const y = Number(incomingSpecs.yCoverage !== undefined ? incomingSpecs.yCoverage : (incomingSpecs.avgCovY || 0));
      const k = Number(incomingSpecs.kCoverage !== undefined ? incomingSpecs.kCoverage : (incomingSpecs.avgCovK || 0));
      
      const photoCount = Number(incomingSpecs.photoCount) || (incomingSpecs.preflightData?.total_pages) || (incomingSpecs.batchFiles?.length) || 1;
      const pages = isBatch ? photoCount : (Number(incomingSpecs.pageCount) || activeItem.pagesPerBook || 1);
      const orderQty = Number(incomingSpecs.orderQuantity) || (isBatch ? 1 : (activeItem.printVolume || 1));
      const isBook = !isBatch && pages >= 4;

      const targetPreset = incomingSpecs.jobSizePreset || incomingSpecs.suggestedPaper || activeItem.jobSizePreset || 'A4';
      const defaultDimensions = getPresetDimensions(targetPreset, Number(incomingSpecs.jobWidth) || activeItem.jobWidth || 210, Number(incomingSpecs.jobHeight) || activeItem.jobHeight || 297);
      const targetW = Number(incomingSpecs.jobWidth) || defaultDimensions.w;
      const targetH = Number(incomingSpecs.jobHeight) || defaultDimensions.h;

      const effectiveCutsOverride = incomingSpecs.cutsPerSheetOverride !== undefined 
        ? Number(incomingSpecs.cutsPerSheetOverride) 
        : (incomingSpecs.cuts_per_sheet_override !== undefined ? Number(incomingSpecs.cuts_per_sheet_override) : activeItem.cutsPerSheetOverride);

      const isDuplex = isBook ? true : (isBatch ? false : activeItem.isDoubleSided);
      const totalJobSheets = isBatch
        ? (orderQty * Math.ceil(pages / Math.max(1, effectiveCutsOverride || 1)))
        : (orderQty * Math.ceil(pages / (isDuplex ? 2 : 1)));

      const selectedPrinter = printers.find(p => p.id === activeItem.selectedPrinterId) || printers[0] || { id: 'PRN-DEFAULT', name: 'Default Printer' };
      const rate = getPrinterMachineRate(selectedPrinter);
      const inkBaseRate = getPrinterActualInkCostPerPage(selectedPrinter);

      const channels = isMono ? [
        { channel_name: 'K', density_pct: k, is_spot_color: false }
      ] : [
        { channel_name: 'C', density_pct: c, is_spot_color: false },
        { channel_name: 'M', density_pct: m, is_spot_color: false },
        { channel_name: 'Y', density_pct: y, is_spot_color: false },
        { channel_name: 'K', density_pct: k, is_spot_color: false },
      ];
      const avgDensity = Math.round(isMono ? k : (c + m + y + k) / 4);

      updateActiveItem({
        name: incomingSpecs.jobName || activeItem.name,
        pagesPerBook: pages,
        printVolume: orderQty,
        unitName: isBatch ? 'ຊຸດ' : (isBook ? 'ຊຸດ' : 'ແຜ່ນ'),
        isDoubleSided: isDuplex,
        includeCover: isBook,
        isBatchPhoto: isBatch,
        photoCount: isBatch ? pages : undefined,
        colorPrintMode: isMono ? 'MONO_K' : 'CMYK',
        coverageMode: 'advanced',
        cCoverage: c,
        mCoverage: m,
        yCoverage: y,
        kCoverage: k,
        avgCoverage: avgDensity,
        jobSizePreset: targetPreset,
        jobWidth: targetW,
        jobHeight: targetH,
        paperId: incomingSpecs.paperId || incomingSpecs.selected_paper_id || activeItem.paperId,
        coverPaperId: incomingSpecs.coverPaperId || incomingSpecs.cover_paper_id || activeItem.coverPaperId,
        cutsPerSheetOverride: effectiveCutsOverride,
        coverCutsPerSheetOverride: incomingSpecs.coverCutsPerSheetOverride !== undefined ? incomingSpecs.coverCutsPerSheetOverride : (incomingSpecs.cover_cuts_per_sheet_override !== undefined ? incomingSpecs.cover_cuts_per_sheet_override : activeItem.coverCutsPerSheetOverride),
        impositionSummary: incomingSpecs.impositionSummary || incomingSpecs.imposition_summary || activeItem.impositionSummary,
        fileName: incomingSpecs.fileName || activeItem.fileName,
        artworkUrl: incomingSpecs.fileUrl || incomingSpecs.artworkUrl || activeItem.artworkUrl,
        preflightData: incomingSpecs.preflightData || activeItem.preflightData,
        batchFiles: incomingSpecs.batchFiles || incomingSpecs.preflightData?.batch_files || activeItem.batchFiles || [],
        printerAllocations: [{
          printer_id: selectedPrinter.id,
          printer_name: selectedPrinter.name || selectedPrinter.id,
          allocated_pages: totalJobSheets,
          cost_per_page: rate,
          ink_cost_per_page: inkBaseRate,
          subtotal_cost: totalJobSheets * rate,
          color_mode: isMono ? 'MONO_K' : 'CMYK',
          average_density_pct: avgDensity,
          color_channels: channels,
          is_double_sided: isDuplex
        }]
      });

      if (showToast) {
        showToast(
          isBatch
            ? `ດຶງຊຸດຮູບພາບ (${pages} ຮູບ), ຂະໜາດ ${targetPreset} (${targetW}×${targetH}mm) ແລະ ແຜນຕັດ (${effectiveCutsOverride || 'Auto'} ຮູບ/ແຜ່ນ) ເຂົ້າຮຽບຮ້ອຍ!`
            : `ດຶງຂໍ້ມູນສີ (${isMono ? `K:${k}%` : `C:${c}% M:${m}% Y:${y}% K:${k}%`}), ຂະໜາດ ${targetPreset} (${targetW}×${targetH}mm) ແລະ ຈຳນວນໜ້າ (${pages} ໜ້າ) ເຂົ້າຮຽບຮ້ອຍ!`,
          'success'
        );
      }
      if (setPrefilledOrderSpecs) {
        setPrefilledOrderSpecs(null);
      }
    }
  }, [incomingSpecs]);

  const [isPreflightModalOpen, setIsPreflightModalOpen] = useState(false);
  const [previewColorItem, setPreviewColorItem] = useState<QuotationItem | null>(null);
  const [activeProductionTab, setActiveProductionTab] = useState<'specs' | 'print' | 'postpress'>('specs');

  const handleSyncColorsToActivePrinter = (colors: { c: number; m: number; y: number; k: number }) => {
    const isMono = activeItem.colorPrintMode === 'MONO_K';
    const channels = isMono ? [
      { channel_name: 'K', density_pct: colors.k, is_spot_color: false }
    ] : [
      { channel_name: 'C', density_pct: colors.c, is_spot_color: false },
      { channel_name: 'M', density_pct: colors.m, is_spot_color: false },
      { channel_name: 'Y', density_pct: colors.y, is_spot_color: false },
      { channel_name: 'K', density_pct: colors.k, is_spot_color: false },
    ];
    const avg = Math.round((colors.c + colors.m + colors.y + colors.k) / (isMono ? 1 : 4));

    updateActiveItem({
      cCoverage: colors.c,
      mCoverage: colors.m,
      yCoverage: colors.y,
      kCoverage: colors.k,
      avgCoverage: avg,
      printerAllocations: (activeItem.printerAllocations || []).map(a => ({
        ...a,
        average_density_pct: avg,
        color_channels: channels,
      }))
    });
    if (showToast) showToast('ຊິງຄ໌ຄ່າສີ CMYK ເຂົ້າເຄື່ອງພິມຮຽບຮ້ອຍ!', 'success');
  };

  // Paper Substrate Inventory Search Modal State
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);
  const [paperModalTarget, setPaperModalTarget] = useState<'inner' | 'cover'>('inner');

  const handleSelectPaperFromModal = (paperId: string) => {
    if (paperModalTarget === 'cover') {
      updateActiveItem({ coverPaperId: paperId });
    } else {
      updateActiveItem({ paperId });
    }
  };

  // Printer Fleet Search Modal State
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);

  const handleSelectPrinterFromModal = (printer: any, mode: 'replace' | 'add' = 'replace') => {
    const prnCost = calculateEquipmentPrintCost(printer, printerColorLinks, inventory, 'Printer');
    const rate = prnCost.netCostPerUnit;
    const inkBaseRate = Number(printer.colorInkCost || printer.linkedInkCostPerPage || prnCost.linkedInkRatePerPage || 0);

    // Preserve exact existing channels, density, and duplex from active allocation or item
    const firstAlloc = activeItem.printerAllocations?.[0];
    const isMono = firstAlloc ? firstAlloc.color_mode === 'MONO_K' : activeItem.colorPrintMode === 'MONO_K';
    const isDuplex = firstAlloc ? firstAlloc.is_double_sided : activeItem.isDoubleSided;

    const existingChannels = firstAlloc?.color_channels;
    const channels = existingChannels && existingChannels.length > 0
      ? existingChannels.map(c => ({ ...c }))
      : (isMono ? [
          { channel_name: 'K', density_pct: activeItem.kCoverage || 5, is_spot_color: false }
        ] : [
          { channel_name: 'C', density_pct: activeItem.cCoverage || 5, is_spot_color: false },
          { channel_name: 'M', density_pct: activeItem.mCoverage || 5, is_spot_color: false },
          { channel_name: 'Y', density_pct: activeItem.yCoverage || 5, is_spot_color: false },
          { channel_name: 'K', density_pct: activeItem.kCoverage || 5, is_spot_color: false },
        ]);

    const avgDensity = firstAlloc?.average_density_pct || activeItem.avgCoverage || 5;
    const totalJobSheets = (Number(activeItem.printVolume) || 1) * Math.ceil(Math.max(1, Number(activeItem.pagesPerBook || 1)) / (isDuplex ? 2 : 1));

    if (mode === 'add' && (activeItem.printerAllocations || []).length > 0) {
      // Split load mode: Add new printer and distribute sheets
      const totalPages = totalJobSheets;
      const currentAllocations = activeItem.printerAllocations || [];
      const newCount = currentAllocations.length + 1;
      const pagesPerEngine = Math.floor(totalPages / newCount);
      const remainder = totalPages % newCount;

      const updatedExisting = currentAllocations.map((a, idx) => {
        const p = pagesPerEngine + (idx === 0 ? remainder : 0);
        return {
          ...a,
          allocated_pages: p,
          subtotal_cost: p * (a.cost_per_page || 0)
        };
      });

      const newAlloc: PrinterAllocation = {
        printer_id: `${printer.id}__${Date.now()}`,
        printer_name: printer.name || printer.id,
        allocated_pages: pagesPerEngine,
        cost_per_page: rate,
        ink_cost_per_page: inkBaseRate,
        subtotal_cost: pagesPerEngine * rate,
        color_mode: isMono ? 'MONO_K' : 'CMYK',
        average_density_pct: avgDensity,
        color_channels: channels,
        is_double_sided: isDuplex
      };

      updateActiveItem({
        printerAllocations: [...updatedExisting, newAlloc]
      });
      if (showToast) showToast(`ເພີ່ມ "${printer.name}" ເພື່ອແບ່ງການຜະລິດຮຽບຮ້ອຍ!`, 'success');
    } else {
      // Replace mode: Set as primary printer
      const newAlloc: PrinterAllocation = {
        printer_id: printer.id,
        printer_name: printer.name || printer.id,
        allocated_pages: totalJobSheets,
        cost_per_page: rate,
        ink_cost_per_page: inkBaseRate,
        subtotal_cost: totalJobSheets * rate,
        color_mode: isMono ? 'MONO_K' : 'CMYK',
        average_density_pct: avgDensity,
        color_channels: channels,
        is_double_sided: isDuplex
      };

      updateActiveItem({
        selectedPrinterId: printer.id,
        printerAllocations: [newAlloc]
      });
      if (showToast) showToast(`ເລືອກເຄື່ອງພິມ "${printer.name}" ຮຽບຮ້ອຍ (ຮັກສາຄ່າສີໄວ້ຄືເກົ່າ)!`, 'success');
    }
  };

  // Post-Press Machinery Search Modal State
  const [isPostPressModalOpen, setIsPostPressModalOpen] = useState(false);

  const handleTogglePostPressFromModal = (machId: string) => {
    const current = activeItem.selectedPostPressIds || [];
    const exists = current.includes(machId);
    const next = exists ? current.filter(id => id !== machId) : [...current, machId];
    updateActiveItem({ selectedPostPressIds: next });
  };

  // Material & Consumable Inventory Search Modal State
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

  const handleSelectMaterialFromModal = (mat: FinishingMaterialItem) => {
    const current = activeItem.finishingMaterials || [];
    updateActiveItem({ finishingMaterials: [...current, mat] });
    if (showToast) showToast(`ເພີ່ມ "${mat.name}" ເຂົ້າໃນລາຍການແລ້ວ!`, 'success');
  };

  const updateActiveItem = (patch: Partial<QuotationItem>) => {
    setItems(prev => prev.map((it, idx) => {
      if (idx !== activeItemIndex) return it;
      let updated = { ...it, ...patch };

      // If printer allocations changed, sync top-level double-sided and color mode flags
      let isAnyDuplex = updated.isDoubleSided;
      if (patch.printerAllocations) {
        isAnyDuplex = patch.printerAllocations.some(a => a.is_double_sided);
        const isAllMono = patch.printerAllocations.length > 0 && patch.printerAllocations.every(a => a.color_mode === 'MONO_K');
        updated.isDoubleSided = isAnyDuplex;
        updated.colorPrintMode = isAllMono ? 'MONO_K' : 'CMYK';
      }

      // Sync total production sheets (cut in half when double-sided)
      const totalSheets = (Number(updated.printVolume) || 1) * Math.ceil(Math.max(1, Number(updated.pagesPerBook || 1)) / (isAnyDuplex ? 2 : 1));
      if ((patch.printVolume !== undefined || patch.pagesPerBook !== undefined || patch.isDoubleSided !== undefined) && updated.printerAllocations && updated.printerAllocations.length === 1) {
        updated.printerAllocations = [{
          ...updated.printerAllocations[0],
          is_double_sided: isAnyDuplex,
          allocated_pages: totalSheets,
          subtotal_cost: totalSheets * (updated.printerAllocations[0].cost_per_page || 50)
        }];
      }

      return updated;
    }));
  };

  const handleAddItem = () => {
    const newItem = createNewItem(`ລາຍການທີ ${items.length + 1}`);
    setItems(prev => [...prev, newItem]);
    setActiveItemIndex(items.length);
    if (showToast) showToast('ເພີ່ມລາຍການສິນຄ້າໃໝ່ຮຽບຮ້ອຍ!', 'success');
  };

  const handleConfirmPreflightItem = (pfResult: PreflightResult) => {
    const rawName = pfResult.file_name ? pfResult.file_name.replace(/\.[^/.]+$/, '') : `ລາຍການທີ ${items.length + 1}`;
    const cleanName = rawName.replace(/_+/g, ' ');

    const isMonoOnly = (pfResult.color_pages_count || 0) === 0 && (pfResult.mono_pages_count || 0) > 0;
    const detectedColorMode = isMonoOnly ? 'MONO_K' : 'CMYK';

    const covC = pfResult.color_pages_avg_c !== undefined ? pfResult.color_pages_avg_c : (pfResult.avg_cov_c ?? 0);
    const covM = pfResult.color_pages_avg_m !== undefined ? pfResult.color_pages_avg_m : (pfResult.avg_cov_m ?? 0);
    const covY = pfResult.color_pages_avg_y !== undefined ? pfResult.color_pages_avg_y : (pfResult.avg_cov_y ?? 0);
    const covK = (pfResult.color_pages_count || 0) > 0
      ? (pfResult.color_pages_avg_k !== undefined ? pfResult.color_pages_avg_k : (pfResult.avg_cov_k ?? 0))
      : (pfResult.mono_pages_avg_k !== undefined ? pfResult.mono_pages_avg_k : (pfResult.avg_cov_k ?? 0));

    const isSplit = Boolean(pfResult.is_split_cover);
    const innerRes = pfResult.inner_result;
    const coverRes = pfResult.cover_result;

    const totalPages = isSplit ? ((innerRes?.total_pages || 0) + (coverRes?.total_pages || 4)) : (pfResult.total_pages || 1);

    const isBatch = Boolean((pfResult as any)?.is_batch_photo);
    const batchImp = (pfResult as any)?.batch_imposition;

    const newItem = createNewItem(cleanName, {
      jobName: cleanName,
      fileName: pfResult.file_name,
      artworkUrl: pfResult.file_url,
      coverFileName: pfResult.cover_file_name || coverRes?.file_name,
      coverArtworkUrl: pfResult.cover_file_url || coverRes?.file_url,
      includeCover: isSplit,
      coverPagesCount: coverRes?.total_pages || 4,
      coverPrintMode: coverRes?.color_mode === 'MONO_K' ? 'MONO_K' : 'CMYK_1_SIDE',
      pageCount: totalPages,
      orderQuantity: isBatch ? totalPages : 1,
      printVolume: isBatch ? totalPages : 1,
      colorPages: pfResult.color_pages_count || 0,
      monoPages: pfResult.mono_pages_count || 0,
      monoPagesAvgK: pfResult.mono_pages_avg_k || covK,
      jobWidth: pfResult.target_width_mm || 210,
      jobHeight: pfResult.target_height_mm || 297,
      suggestedPaper: pfResult.target_paper_size || 'A4',
      paperId: pfResult.selected_paper_id,
      coverPaperId: pfResult.cover_paper_id,
      cutsPerSheetOverride: pfResult.cuts_per_sheet_override !== undefined ? pfResult.cuts_per_sheet_override : (batchImp?.cuts_per_sheet ? Number(batchImp.cuts_per_sheet) : undefined),
      coverCutsPerSheetOverride: pfResult.cover_cuts_per_sheet_override,
      impositionSummary: pfResult.imposition_summary || batchImp?.summary_lao,
      colorPrintMode: detectedColorMode,
      cCoverage: covC,
      mCoverage: covM,
      yCoverage: covY,
      kCoverage: covK,
      preflightData: pfResult,
      batchFiles: (pfResult as any)?.batch_files || [],
      mimeType: isBatch ? 'image/jpeg' : (pfResult.file_name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
    });

    setItems(prev => [...prev, newItem]);
    setActiveItemIndex(items.length);
    setIsPreflightModalOpen(false);
    if (showToast) {
      showToast(
        isSplit 
          ? `ເພີ່ມລາຍການ "${cleanName}" (ແຍກປົກ ${coverRes?.total_pages || 4} ໜ້າ + ເນື້ອໃນ ${innerRes?.total_pages || totalPages} ໜ້າ) ສຳເລັດ!`
          : `ເພີ່ມລາຍການ "${cleanName}" (${pfResult.total_pages} ໜ້າ) ສຳເລັດ!`,
        'success'
      );
    }
  };

  const handleSkipPreflightItem = () => {
    handleAddItem();
    setIsPreflightModalOpen(false);
  };

  const handleDuplicateItem = (idx: number) => {
    const source = items[idx];
    const cloned: QuotationItem = {
      ...source,
      id: `item-${Date.now()}-${Math.random().toString().slice(-4)}`,
      name: `${source.name} (ສຳເນົາ)`,
    };
    setItems(prev => [...prev, cloned]);
    setActiveItemIndex(items.length);
    if (showToast) showToast('ສຳເນົາລາຍການສິນຄ້າຮຽບຮ້ອຍ!', 'success');
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
    setActiveItemIndex(Math.max(0, activeItemIndex - 1));
    if (showToast) showToast('ລຶບລາຍການສິນຄ້າແລ້ວ', 'warning');
  };

  const [openPhases, setOpenPhases] = useState<Record<string, boolean>>({
    phase1: false,
    phase2: false,
    phase3: false,
    phase4: false,
    phase5: false,
    phase6: false,
    phase7: false,
    phase8: false,
  });

  // User-created custom templates saved to LocalStorage
  const [customTemplates, setCustomTemplates] = useState<PricingTemplatePreset[]>(() => {
    try {
      const saved = localStorage.getItem('som_sing_custom_pricing_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Deleted preset template IDs saved to LocalStorage
  const [deletedPresetIds, setDeletedPresetIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('som_sing_deleted_preset_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({
    nameLao: '',
    nameEn: '',
    category: 'book',
    description: '',
  });

  const allAvailableTemplates = [
    ...DEFAULT_PRICING_TEMPLATES.filter(t => !deletedPresetIds.includes(t.id)),
    ...customTemplates,
  ];

  const handleApplyTemplate = (tpl: PricingTemplatePreset) => {
    let presetSpecificFields: Partial<QuotationItem> = {};

    if (tpl.id === 'TPL_PERFECT_BIND_BOOK') {
      presetSpecificFields = {
        name: activeItem.name && !activeItem.name.includes('ລາຍການ') ? activeItem.name : 'ປຶ້ມສັນກາວຮ້ອນ (Perfect Bind Book)',
        includeCover: true,
        coverPagesCount: 4,
        pagesPerBook: (activeItem.pagesPerBook && activeItem.pagesPerBook > 1) ? activeItem.pagesPerBook : 96,
        bindingOption: 'PERFECT_HOT_GLUE',
        unitName: 'ຫົວ',
        isDoubleSided: true,
        jobSizePreset: 'A5',
        jobWidth: 148,
        jobHeight: 210,
      };
    } else if (tpl.id === 'TPL_HARDCOVER_BOOK') {
      presetSpecificFields = {
        name: activeItem.name && !activeItem.name.includes('ລາຍການ') ? activeItem.name : 'ປຶ້ມປົກແຂງຈົ່ວປັງ (Hardcover Book)',
        includeCover: true,
        coverPagesCount: 4,
        pagesPerBook: (activeItem.pagesPerBook && activeItem.pagesPerBook > 1) ? activeItem.pagesPerBook : 120,
        bindingOption: 'HARDCOVER_CASE_BINDING',
        unitName: 'ຫົວ',
        isDoubleSided: true,
        jobSizePreset: 'A5',
        jobWidth: 148,
        jobHeight: 210,
      };
    } else if (tpl.id === 'TPL_PHOTO_PRINT') {
      presetSpecificFields = {
        name: activeItem.name && !activeItem.name.includes('ລາຍການ') ? activeItem.name : 'ພິມຮູບພາບ (Photo Prints)',
        includeCover: false,
        pagesPerBook: 1,
        bindingOption: 'NONE',
        unitName: 'ໃບ',
        isDoubleSided: false,
        jobSizePreset: 'CUSTOM',
        jobWidth: 102,
        jobHeight: 152,
        printVolume: activeItem.printVolume || 40,
      };
    }

    updateActiveItem({
      selectedTemplateId: tpl.id,
      activeModules: { ...tpl.activeModules },
      finishingMaterials: tpl.defaultMaterials ? [...tpl.defaultMaterials] : [],
      laborPercent: tpl.defaultLaborPercent !== undefined ? tpl.defaultLaborPercent : activeItem.laborPercent,
      ...presetSpecificFields,
    });

    if (showToast) {
      showToast(
        currentLang === 'lo' 
          ? `ນຳໃຊ້ແມ່ແບບ "${tpl.nameLao}" ຮຽບຮ້ອຍ!` 
          : `Applied template "${tpl.nameEn}"!`,
        'success'
      );
    }
  };

  const handleSaveCurrentAsPreset = () => {
    if (!newPresetName.trim()) {
      if (showToast) showToast('ກະລຸນາປ້ອນຊື່ແມ່ແບບ', 'warning');
      return;
    }

    const newTpl: PricingTemplatePreset = {
      id: `CUST_TPL_${Date.now()}`,
      nameLao: newPresetName.trim(),
      nameEn: newPresetName.trim(),
      category: 'custom',
      description: `${activeItem.jobSizePreset || 'Custom'} • ${activeItem.paperId || 'Paper'} • ${activeItem.printVolume || 1} units`,
      iconName: newPresetIcon || 'Sparkles',
      activeModules: activeItem.activeModules ? { ...activeItem.activeModules } : {
        paper: true,
        printEngine: true,
        postPressMachinery: true,
        finishingMaterials: true,
        laborAndSetup: true,
        packagingDelivery: true,
      },
      defaultMaterials: activeItem.finishingMaterials ? [...activeItem.finishingMaterials] : [],
      defaultLaborPercent: activeItem.laborPercent ?? 0,
    };

    const updated = [...customFastPresets, newTpl];
    setCustomFastPresets(updated);
    try {
      localStorage.setItem('somsing_custom_fast_presets', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    // Persist to PostgreSQL backend database
    fetch('/api/v1/quotations/templates', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newTpl.id,
        name: newTpl.nameEn || (newTpl as any).name || '',
        nameLao: newTpl.nameLao || (newTpl as any).name || '',
        nameEn: newTpl.nameEn || (newTpl as any).name || '',
        category: newTpl.category || 'Custom',
        iconName: newTpl.iconName || 'Sparkles',
        description: newTpl.description || '',
        spec: newTpl
      })
    }).catch(console.error);

    setIsSavePresetModalOpen(false);
    setNewPresetName('');
    if (showToast) showToast(`ບັນທຶກແມ່ແບບດ່ວນ "${newTpl.nameLao}" ສຳເລັດ!`, 'success');
  };

  const handleDeleteCustomPreset = (tplId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customFastPresets.filter(p => p.id !== tplId);
    setCustomFastPresets(updated);
    try {
      localStorage.setItem('somsing_custom_fast_presets', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    fetch(`/api/v1/quotations/templates/${tplId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).catch(console.error);
    if (showToast) showToast('ລຶບແມ່ແບບດ່ວນສຳເລັດ!', 'info');
  };

  const handleToggleModule = (key: keyof ItemModuleToggles) => {
    const current = activeItem.activeModules || {
      paper: true,
      printEngine: true,
      postPressMachinery: true,
      finishingMaterials: true,
      laborAndSetup: true,
      packagingDelivery: false,
    };
    updateActiveItem({
      activeModules: {
        ...current,
        [key]: !current[key],
      },
    });
  };

  const handleAddFinishingMaterial = (customItem?: Partial<FinishingMaterialItem>) => {
    const currentList = activeItem.finishingMaterials || [];
    const pkgPrice = customItem?.packagePrice !== undefined ? customItem.packagePrice : 50000;
    const unitsPkg = customItem?.unitsPerPackage !== undefined ? customItem.unitsPerPackage : 1000;
    const isBox = customItem?.calcMode === 'box' || (customItem?.packagePrice !== undefined && customItem?.unitsPerPackage !== undefined);
    const resolvedUnitCost = customItem?.unitCost !== undefined 
      ? customItem.unitCost 
      : (isBox && unitsPkg > 0 ? Math.round(pkgPrice / unitsPkg) : 500);

    const newMat: FinishingMaterialItem = {
      id: `mat-${Date.now()}-${Math.random().toString().slice(-3)}`,
      name: customItem?.name || 'ວັດຖຸດິບຫຼັງພິມໃໝ່',
      calcMode: isBox ? 'box' : 'unit',
      packagePrice: pkgPrice,
      unitsPerPackage: unitsPkg,
      unitCost: resolvedUnitCost,
      qtyPerItem: customItem?.qtyPerItem !== undefined ? customItem.qtyPerItem : 1,
      unitName: customItem?.unitName || 'ອັນ',
      category: customItem?.category || 'other',
      materialId: customItem?.materialId,
    };
    updateActiveItem({
      finishingMaterials: [...currentList, newMat],
    });
  };

  const handleRemoveFinishingMaterial = (matId: string) => {
    const currentList = activeItem.finishingMaterials || [];
    updateActiveItem({
      finishingMaterials: currentList.filter(m => m.id !== matId),
    });
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
      activeModules: activeItem.activeModules || {
        paper: true,
        printEngine: true,
        postPressMachinery: true,
        finishingMaterials: true,
        laborAndSetup: true,
        packagingDelivery: false,
      },
      defaultMaterials: activeItem.finishingMaterials ? [...activeItem.finishingMaterials] : [],
      defaultLaborPercent: activeItem.laborPercent ?? 0,
    };

    const updated = [...customTemplates, newTpl];
    setCustomTemplates(updated);
    try {
      localStorage.setItem('som_sing_custom_pricing_templates', JSON.stringify(updated));
    } catch {}

    updateActiveItem({ selectedTemplateId: newTpl.id });
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

  const handleDeleteCustomTemplate = (templateId: string, templateName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const msg = currentLang === 'lo'
      ? `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລົບແມ່ແບບ "${templateName}"?`
      : `Are you sure you want to delete template "${templateName}"?`;
    askConfirmation(msg, () => {
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

      if (activeItem.selectedTemplateId === templateId) {
        updateActiveItem({ selectedTemplateId: 'TPL_CUSTOM' });
      }
      if (showToast) {
        showToast(
          currentLang === 'lo' ? 'ລົບແມ່ແບບຮຽບຮ້ອຍແລ້ວ' : 'Template deleted successfully',
          'success'
        );
      }
    });
  };

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

  const [currentStep, setCurrentStep] = useState<'calc' | 'quote'>('calc');
  const [wizardStep, setWizardStep] = useState<'intake' | 'specs' | 'summary'>('intake');
  const [quotationTitle, setQuotationTitle] = useState('ໃບສະເໜີລາຄາງານພິມ');
  const [quotationProfitMargin, setQuotationProfitMargin] = useState<number>(40);
  const [quotationDiscountPercent, setQuotationDiscountPercent] = useState<number>(0);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isTemplateOption, setIsTemplateOption] = useState(false);
  const [templateCategory, setTemplateCategory] = useState('sticker');
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.name || '');
  const [customerPhone, setCustomerPhone] = useState(customers[0]?.phone || '');
  const [customerAddress, setCustomerAddress] = useState(customers[0]?.address || '');
  const [selectedCustomerCategory, setSelectedCustomerCategory] = useState<string>(() => {
    return (customers[0] as any)?.category || (customers[0] as any)?.tier || 'RETAIL';
  });
  const [isCustomerCategoryModalOpen, setIsCustomerCategoryModalOpen] = useState(false);
  const [autoSaveCustomerToCRM, setAutoSaveCustomerToCRM] = useState(true);
  const [bleedMargin, setBleedMargin] = useState(2);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxRate, setTaxRate] = useState(7);
  const [taxMode, setTaxMode] = useState<'percent' | 'override'>('percent');
  const [taxOverrideAmount, setTaxOverrideAmount] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState('Immediate / Cash');
  const [quotationExpiry, setQuotationExpiry] = useState('2026-08-31');
  const [quotationNote, setQuotationNote] = useState('');
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [shippingMethod, setShippingMethod] = useState('Anousith Express');
  const [quotationSetupFee, setQuotationSetupFee] = useState<number>(0);
  const [quotationPackagingCost, setQuotationPackagingCost] = useState<number>(0);
  const [selectedPackagingPreset, setSelectedPackagingPreset] = useState<string>('none');
  const [isPackagingEnabled, setIsPackagingEnabled] = useState<boolean>(false);
  const [isQuotationListOpen, setIsQuotationListOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCostDetailsOpen, setIsCostDetailsOpen] = useState(true);
  
  // Margin Guard Manager Approval Modal State
  const [approvalModalQuote, setApprovalModalQuote] = useState<any | null>(null);
  const [approvalReason, setApprovalReason] = useState('');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  const handleCustomerComboboxChange = (data: {
    name: string;
    phone: string;
    address: string;
    isNew: boolean;
    saveToCrm: boolean;
  }) => {
    setSelectedCustomerId(data.name);
    setCustomerPhone(data.phone);
    setCustomerAddress(data.address);

    const foundCust = customers.find(c => c.name.toLowerCase() === data.name.trim().toLowerCase()) as any;
    if (foundCust && (foundCust.category || foundCust.tier)) {
      setSelectedCustomerCategory(foundCust.category || foundCust.tier);
    }

    if (data.isNew && (data.saveToCrm || autoSaveCustomerToCRM) && data.name.trim() && addCustomer) {
      addCustomer({
        id: `cust-${Date.now()}`,
        name: data.name.trim(),
        phone: data.phone || '020 55889900',
        address: data.address || 'Vientiane',
        category: selectedCustomerCategory,
        tier: selectedCustomerCategory,
        creditLimit: 5000000,
        unpaidBalance: 0
      });
    }
  };

  const calculateItemFinancials = (item: QuotationItem) => {
    const { w: jobW, h: jobH } = getPresetDimensions(item.jobSizePreset, item.jobWidth, item.jobHeight);
    
    const paperItem = inventory.find(p => 
      p.id === item.paperId || 
      p.sku === item.paperId || 
      p.id?.toLowerCase() === item.paperId?.toLowerCase() ||
      (p.sku && p.sku.toLowerCase() === item.paperId?.toLowerCase()) ||
      p.name === item.paperId
    );
    let parentW = 210;
    let parentH = 297;
    if (item.parentSheetSize === '31x43' || paperItem?.name?.includes('31x43') || paperItem?.specs?.standardSize === '31x43' || paperItem?.category === 'parent_sheet') {
      parentW = 787;
      parentH = 1092;
    } else if (paperItem?.name?.includes('A3') || paperItem?.specs?.standardSize === 'A3') { parentW = 297; parentH = 420; }
    else if (paperItem?.name?.includes('A4') || paperItem?.specs?.standardSize === 'A4') { parentW = 210; parentH = 297; }
    else if (paperItem?.name?.includes('A5') || paperItem?.specs?.standardSize === 'A5') { parentW = 148; parentH = 210; }
    else if (paperItem?.specs?.width && paperItem?.specs?.height) {
      parentW = Number(paperItem.specs.width);
      parentH = Number(paperItem.specs.height);
    }
    
    const curW = Number(jobW) + (Number(bleedMargin) * 2);
    const curH = Number(jobH) + (Number(bleedMargin) * 2);
    const portraitCuts = Math.floor(parentW / curW) * Math.floor(parentH / curH);
    const landscapeCuts = Math.floor(parentW / curH) * Math.floor(parentH / curW);
    const autoCutsPerSheet = Math.max(1, portraitCuts, landscapeCuts);
    const cutsPerSheet = (item.cutsPerSheetOverride !== undefined && item.cutsPerSheetOverride > 0)
      ? Number(item.cutsPerSheetOverride)
      : autoCutsPerSheet;

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
    // For Batch Photo: totalPhotos = photoCountPerSet * orderQty; parent sheets = ceil(totalPhotos / cutsPerSheet)
    const totalInnerSheets = innerSheetsPerBook * orderQty;
    const innerParentSheetsNeeded = isBatchPhoto
      ? Math.ceil(totalInnerSheets / Math.max(1, cutsPerSheet))
      : Math.ceil(totalInnerSheets / Math.max(1, cutsPerSheet));

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
    const totalInnerParentSheets = innerParentSheetsNeeded + innerWastedSheets;

    const fifoUnitCost = paperItem ? getFIFOCostPerSheet(paperItem.id, totalInnerParentSheets) : getFIFOCostPerSheet(item.paperId, totalInnerParentSheets);
    const paperUnitCost = fifoUnitCost > 0 
      ? fifoUnitCost 
      : (paperItem 
          ? (Number(paperItem.costPerConsumptionUnit) || Number(paperItem.costPerSheet) || (Number(paperItem.costPerPurchaseUnit) && Number(paperItem.purchaseMultiplier) ? Number(paperItem.costPerPurchaseUnit) / Number(paperItem.purchaseMultiplier) : 0) || Number(paperItem.unitCost) || 184)
          : 184);

    const innerPaperCost = totalInnerParentSheets * paperUnitCost;

    // 3. Cover Paper Calculation (No lamination here - lamination is in post-press & consumables):
    let coverPaperCost = 0;
    let totalCoverParentSheets = 0;
    let coverParentSheetsNeeded = 0;
    let coverWastedSheets = 0;
    let coverPaperUnitCost = 0;

    if (hasCover) {
      const coverPaperItem = inventory.find(p => p.id === item.coverPaperId) || paperItem;
      const totalCoverSheets = 1 * orderQty; // 1 Spread sheet per book
      const coverCutsPerSheet = (item.coverCutsPerSheetOverride !== undefined && item.coverCutsPerSheetOverride > 0)
        ? Number(item.coverCutsPerSheetOverride)
        : 1;
      coverParentSheetsNeeded = Math.ceil(totalCoverSheets / coverCutsPerSheet);
      coverWastedSheets = (isSpoilageActive && itemSpoilageRate > 0)
        ? Math.ceil(coverParentSheetsNeeded * (itemSpoilageRate / 100))
        : 0;
      totalCoverParentSheets = coverParentSheetsNeeded + coverWastedSheets;
      
      const coverFifo = coverPaperItem ? getFIFOCostPerSheet(coverPaperItem.id, totalCoverParentSheets) : 0;
      coverPaperUnitCost = coverFifo > 0 ? coverFifo : (coverPaperItem ? (Number(coverPaperItem.unitCost) || Number(coverPaperItem.costPerSheet) || 850) : 850);
      coverPaperCost = totalCoverParentSheets * coverPaperUnitCost;
    }

    const parentSheetsNeeded = innerParentSheetsNeeded + coverParentSheetsNeeded;
    const wastedSheets = innerWastedSheets + coverWastedSheets;
    const totalParentSheets = totalInnerParentSheets + totalCoverParentSheets;

    const A4_AREA = 210 * 297;
    const parentSheetAreaFactor = Math.max(0.2, (parentW * parentH) / A4_AREA);
    // When gang-run or batch photo, multiple cuts fill the parent sheet, so ink applies to the parent sheet area
    const printAreaFactor = (isBatchPhoto || cutsPerSheet > 1)
      ? parentSheetAreaFactor
      : Math.max(0.1, Math.min(parentSheetAreaFactor, (Number(jobW) * Number(jobH)) / A4_AREA));

    let cyanMl = 0;
    let magentaMl = 0;
    let yellowMl = 0;
    let blackMl = 0;
    let totalInkCostAccum = 0;
    let machDepr = 0;
    let machMaint = 0;
    let electricityCost = 0;

    // For batch photo prints or gang-run sheets, the physical sheets fed into the printer = total parent sheets needed
    const totalJobProductionSheets = (isBatchPhoto || cutsPerSheet > 1) 
      ? innerParentSheetsNeeded 
      : ((Number(item.printVolume) || 1) * Math.ceil(Math.max(1, Number(item.pagesPerBook || 1)) / (item.isDoubleSided ? 2 : 1)));

    const allocations = (item.printerAllocations && item.printerAllocations.length > 0)
      ? item.printerAllocations
      : [
          {
            printer_id: item.selectedPrinterId || 'default',
            printer_name: 'Default Printer',
            allocated_pages: totalJobProductionSheets,
            cost_per_page: 50,
            is_double_sided: item.isDoubleSided || false,
            color_mode: item.colorPrintMode || 'CMYK',
            average_density_pct: item.avgCoverage || 15,
            color_channels: [
              { channel_name: 'C', density_pct: item.colorPrintMode === 'MONO_K' ? 0 : (item.cCoverage || item.avgCoverage || 15) },
              { channel_name: 'M', density_pct: item.colorPrintMode === 'MONO_K' ? 0 : (item.mCoverage || item.avgCoverage || 15) },
              { channel_name: 'Y', density_pct: item.colorPrintMode === 'MONO_K' ? 0 : (item.yCoverage || item.avgCoverage || 15) },
              { channel_name: 'K', density_pct: item.kCoverage || item.avgCoverage || 15 }
            ]
          }
        ];

    allocations.forEach(alloc => {
      const isDuplex = alloc.is_double_sided !== undefined ? alloc.is_double_sided : (item.isDoubleSided || false);
      const allocPages = allocations.length === 1 
        ? totalJobProductionSheets 
        : Number(alloc.allocated_pages ?? totalJobProductionSheets);

      const sideFactor = isDuplex ? 2 : 1;
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
        cCov = isMonoAlloc ? 0 : (cCh ? Number(cCh.density_pct) : 15);
        mCov = isMonoAlloc ? 0 : (mCh ? Number(mCh.density_pct) : 15);
        yCov = isMonoAlloc ? 0 : (yCh ? Number(yCh.density_pct) : 15);
        kCov = kCh ? Number(kCh.density_pct) : 15;
      } else {
        const avg = Number(alloc.average_density_pct || item.avgCoverage || 15);
        cCov = isMonoAlloc ? 0 : avg;
        mCov = isMonoAlloc ? 0 : avg;
        yCov = isMonoAlloc ? 0 : avg;
        kCov = avg;
      }

      // Find allocated printer
      const rawPrnId = (alloc.printer_id || '').split('__')[0];
      const prn = equipment.find(e => e.id === rawPrnId || e.id === alloc.printer_id || e.name === alloc.printer_name);

      // Active linked inventory inks and OEM specs for this printer
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

      // Canonical Equipment Print Cost calculation (Depreciation, Wear Parts, and Direct/Linked Ink)
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
        }) || standardCmykSlots.find(s => s.colorGroup.toUpperCase().startsWith(channelCode === 'K' ? 'B' : channelCode));

        const defaultPrice = channelCode === 'K' ? 450000 : 320000;
        const defaultVol = channelCode === 'K' ? 127 : 70;
        const defaultYield = channelCode === 'K' ? 7500 : 6000;

        const oemVol = Number(oemSlot?.oemStandardVolumeMl || defaultVol);
        const rawYield = Number(oemSlot?.oemStandardIsoYieldA4 || (channelCode === 'K' ? (prn?.blackYieldPages || defaultYield) : (prn?.colorYieldPages || defaultYield)));
        const yld = rawYield > 500 ? rawYield : defaultYield;
        const isoRateMlPerSheet = yld > 0 ? (oemVol / yld) : (channelCode === 'K' ? (127 / 7500) : (70 / 6000));

        let slotBase5Pct = 0;

        // User Direct Priority: Pull directly from the printer's verified ink cost per page
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

        const ml = isoRateMlPerSheet * (covPct / 5) * printAreaFactor * allocPages * sideFactor;
        const cost = slotBase5Pct * (covPct / 5) * printAreaFactor * allocPages * sideFactor;
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

      machDepr += Math.round(deprPerSheet * allocPages * sideFactor);
      machMaint += Math.round(maintPerSheet * allocPages * sideFactor);
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
      const coverPrintSheets = orderQty; // 1 cover spread sheet per book

      // Cover ink rate calculation
      const coverPrnPrintCost = coverPrn ? calculateEquipmentPrintCost(coverPrn, printerColorLinks, inventory, 'Printer') : null;
      const coverInkPerPage = coverPrn ? Number(coverPrn.colorInkCost || coverPrn.linkedInkCostPerPage || (coverPrnPrintCost ? coverPrnPrintCost.linkedInkRatePerPage : 0) || 56.09) : 56.09;
      const coverInkUnitCost = isCoverMono ? (Number(coverPrn?.bwInkCost || (coverInkPerPage * 0.25) || 8.59)) : coverInkPerPage;
      coverInkCost = Math.round(coverPrintSheets * coverSides * coverInkUnitCost * (parentSheetAreaFactor > 0 ? parentSheetAreaFactor : 1)); // Cover spread uses parent sheet area

      // Cover machine depreciation & maintenance
      const coverMachRate = coverPrnPrintCost ? coverPrnPrintCost.netCostPerUnit : (getPrinterMachineRate(coverPrn) || 139.67);
      const coverDeprRate = coverPrnPrintCost ? coverPrnPrintCost.baseCostPerUnit : (coverMachRate * 0.65);
      const coverMaintRate = coverPrnPrintCost ? coverPrnPrintCost.wearAllowancePerUnit : (coverMachRate - coverDeprRate);

      coverMachDepr = Math.round(coverPrintSheets * coverSides * coverDeprRate * (parentSheetAreaFactor > 0 ? parentSheetAreaFactor : 1));
      coverMachMaint = Math.round(coverPrintSheets * coverSides * coverMaintRate * (parentSheetAreaFactor > 0 ? parentSheetAreaFactor : 1));

      totalInkCostAccum += coverInkCost;
      machDepr += coverMachDepr;
      machMaint += coverMachMaint;
    }

    const hasPaperModule = item.activeModules ? item.activeModules.paper : true;
    const hasPrintEngineModule = item.activeModules ? item.activeModules.printEngine : true;
    const hasPostPressModule = item.activeModules ? item.activeModules.postPressMachinery : true;
    const hasFinishingMaterialsModule = item.activeModules ? item.activeModules.finishingMaterials : true;
    const hasPackagingModule = item.activeModules ? item.activeModules.packagingDelivery : true;

    // Offcut scrap paper rebate
    const offcutRebate = Boolean(item.useOffcutRebate) ? Math.min(Math.round(innerPaperCost + coverPaperCost), Number(item.offcutRebateAmount || 0)) : 0;
    const rawPaperCost = Math.max(0, Math.round(innerPaperCost + coverPaperCost - offcutRebate));
    const rawInkCost = Math.round(totalInkCostAccum);
    const rawMachineOverhead = machDepr + machMaint;

    // Guillotine cutting setup fee: 0 LAK (Cutting is handled 100% via post-press machinery selection)
    const guillotineFee = 0;

    const rawPostPressCost = (item.selectedPostPressIds || []).reduce((sum, machId) => {
      const mach = equipment.find(e => e.id === machId);
      if (!mach) return sum;
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
    
    // In Step 2 (Itemized Spec Studio), raw production cost is 100% direct materials & machinery
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

    // Auto packaging calculation if preset selected
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

    // Commercial cost (for Step 3 Selling Price calculation)
    const commercialBaseCost = netCost + laborCost + packagingDeliveryCost;
    const marginDec = Math.min(0.99, Math.max(0, Number(quotationProfitMargin ?? item.profitMargin ?? 40) / 100));
    const baseSellingPrice = Math.round(commercialBaseCost / (1.0 - marginDec));
    const discountAmt = Math.round(baseSellingPrice * (Number(quotationDiscountPercent ?? item.discountPercent ?? 0) / 100));
    const finalSellingPrice = baseSellingPrice - discountAmt;
    const unitPrice = Math.round(finalSellingPrice / Math.max(1, item.printVolume));
    const unitCost = Math.round(netCost / Math.max(1, item.printVolume));
    const profit = finalSellingPrice - commercialBaseCost;

    return {
      cutsPerSheet,
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
  };

  const calculatedItems = items.map(item => calculateItemFinancials(item));
  const activeCalc = calculateItemFinancials(activeItem);

  const grandPaperCost = calculatedItems.reduce((sum, c) => sum + c.paperCost, 0);
  const grandInkCost = calculatedItems.reduce((sum, c) => sum + c.inkCost, 0);
  const grandMachCost = calculatedItems.reduce((sum, c) => sum + c.machineOverhead, 0);
  const grandPostPressCost = calculatedItems.reduce((sum, c) => sum + c.postPressCost, 0);
  const grandFinishingCost = calculatedItems.reduce((sum, c) => sum + c.finishingMaterialsCost, 0);
  const grandItemLaborCost = calculatedItems.reduce((sum, c) => sum + (c.laborCost || 0), 0);
  const grandLaborCost = grandItemLaborCost;
  const grandItemPackagingCost = calculatedItems.reduce((sum, c) => sum + (c.packagingDeliveryCost || 0), 0);
  const grandPackagingCost = grandItemPackagingCost + quotationPackagingCost;
  const grandNetCost = grandPaperCost + grandInkCost + grandMachCost + grandPostPressCost + grandFinishingCost + grandLaborCost + quotationSetupFee + grandPackagingCost;

  // Quotation-Wide Combined Margin & Discount Calculation
  const grandMarginDec = Math.min(0.99, Math.max(0, Number(quotationProfitMargin || 40) / 100));
  const grandBaseSellingPrice = Math.round(grandNetCost / (1.0 - grandMarginDec));
  const grandDiscountAmount = Math.round(grandBaseSellingPrice * (Number(quotationDiscountPercent || 0) / 100));
  const grandSubtotal = grandBaseSellingPrice - grandDiscountAmount;

  const grandTotalUnits = items.reduce((sum, it) => sum + Number(it.printVolume || 0), 0);
  const taxAmount = taxEnabled
    ? (taxMode === 'override' ? Number(taxOverrideAmount || 0) : Math.round(grandSubtotal * (Number(taxRate || 0) / 100)))
    : 0;
  const finalGrandTotal = grandSubtotal + taxAmount + Number(shippingFee || 0);
  const grandNetProfit = grandSubtotal - grandNetCost;
  const grandProfitMargin = grandSubtotal > 0 ? (grandNetProfit / grandSubtotal) * 100 : 0;

  // Credit check warnings
  const creditStatus = checkCreditLimit(selectedCustomerId, finalGrandTotal);

  // Export PDF template triggers standard window print
  const handleExportPDF = () => {
    window.print();
  };

  // Convert Quotation to Order (Lifecycle: Created without immediate stock deduction - stock will be deducted at IN_PRODUCTION)
  const handleConfirmOrder = () => {
    const msg = currentLang === 'lo'
      ? `ຢືນຢັນການເປີດອໍເດີ (${items.length} ລາຍການ)? ຍອດລວມ: ${formatCurrency(finalGrandTotal)} (ສະຕ໋ອກຈະຖືກຕັດອັດຕະໂນມັດເມື່ອເລີ່ມສັ່ງພິມຈິງ IN_PRODUCTION)`
      : `Confirm order creation (${items.length} items)? Total: ${formatCurrency(finalGrandTotal)} (Stock will be auto-deducted at IN_PRODUCTION stage)`;

    askConfirmation(msg, () => {
      const orderItems: any[] = [];

      items.forEach((item, idx) => {
        const calc = calculatedItems[idx];
        const paperItem = inventory.find(p => p.id === item.paperId);
        
        // 1. Primary Finished Product Item (1 Quotation Item = 1 Order Job Item)
        // Nested specifications contain materials, paper cutting ticket, and machinery allocations
        orderItems.push({
          id: item.id || `job-item-${idx + 1}`,
          name: item.name || `Job #${idx + 1}`,
          item_name: item.name,
          quantity: item.printVolume || 1,
          unitCost: Math.round(calc?.netCost || 0),
          unit_price_lak: Math.round(calc?.unitPrice || 0),
          total_price_lak: Math.round(calc?.sellingPrice || 0),
          page_count: item.pagesPerBook || 1,
          paper_size: item.jobSizePreset || 'A4',
          cover_file_url: item.includeCover ? (item.artworkUrl || item.fileName) : undefined,
          inner_file_url: item.artworkUrl || item.fileName,
          artworkUrl: item.artworkUrl,
          artwork_url: item.artworkUrl,
          artworkFileName: item.fileName,
          artwork_file_name: item.fileName,
          artworkFileSize: item.fileSize,
          artwork_file_size: item.fileSize,
          artwork: {
            file_url: item.artworkUrl || '',
            file_name: item.fileName || (item.artworkUrl ? item.artworkUrl.split('/').pop()?.split('?')[0] : ''),
            file_size_bytes: item.fileSize || 0,
            preview_thumbnail_url: item.artworkUrl || '',
            page_count: item.pagesPerBook || 1,
            batch_files: item.batchFiles || (item.preflightData as any)?.batch_files,
            artwork_files: item.batchFiles || (item.preflightData as any)?.batch_files,
          },
          batch_files: item.batchFiles || (item.preflightData as any)?.batch_files,
          drive_link: item.artworkUrl,
          avg_cov_c: item.cCoverage || 0,
          avg_cov_m: item.mCoverage || 0,
          avg_cov_y: item.yCoverage || 0,
          avg_cov_k: item.kCoverage || 0,
          specifications: {
            pages: item.pagesPerBook || 1,
            paper_id: item.paperId,
            paper_name: paperItem?.name || 'Standard Paper',
            paper_cutting_ticket: paperItem ? {
              parent_paper_id: item.paperId,
              parent_paper_name: paperItem.name,
              total_parent_sheets: calc?.totalParentSheets || 1,
              cuts_per_parent: calc?.cutsPerSheet || 1,
              wasted_sheets: calc?.wastedSheets || 0,
              paper_unit_cost: calc?.paperUnitCost || 0
            } : null,
            materials: {
              paper: paperItem ? {
                id: item.paperId,
                name: paperItem.name,
                total_parent_sheets: calc?.totalParentSheets || 1,
                unit_cost: calc?.paperUnitCost || 0
              } : null,
              machinery: (item.selectedPostPressIds || []).map(machId => {
                const mach = equipment.find(e => e.id === machId);
                const rate = Number((mach as any)?.costPerPage) || Number((mach as any)?.calculatedCostPerPage) || 300;
                return {
                  id: machId,
                  name: mach?.name || machId,
                  quantity: item.printVolume,
                  unit_cost: rate
                };
              })
            },
            color_mode: item.colorPrintMode || 'CMYK',
            is_double_sided: item.isDoubleSided,
            printer_allocations: item.printerAllocations,
            file_name: item.fileName,
            artwork_url: item.artworkUrl,
            file_size: item.fileSize
          },
          specs: {
            pages: item.pagesPerBook || 1,
            paperName: paperItem?.name || 'Standard Paper',
            colorMode: item.colorPrintMode || 'CMYK',
            isDoubleSided: item.isDoubleSided,
            printerAllocations: item.printerAllocations,
            fileName: item.fileName,
            artworkUrl: item.artworkUrl,
            fileSize: item.fileSize,
            paper_cutting_ticket: paperItem ? {
              parent_paper_id: item.paperId,
              parent_paper_name: paperItem.name,
              total_parent_sheets: calc?.totalParentSheets || 1,
              cuts_per_parent: calc?.cutsPerSheet || 1,
              wasted_sheets: calc?.wastedSheets || 0,
              paper_unit_cost: calc?.paperUnitCost || 0
            } : null,
            materials: {
              paper: paperItem ? {
                id: item.paperId,
                name: paperItem.name,
                total_parent_sheets: calc?.totalParentSheets || 1,
                unit_cost: calc?.paperUnitCost || 0
              } : null,
              machinery: (item.selectedPostPressIds || []).map(machId => {
                const mach = equipment.find(e => e.id === machId);
                const rate = Number((mach as any)?.costPerPage) || Number((mach as any)?.calculatedCostPerPage) || 300;
                return {
                  id: machId,
                  name: mach?.name || machId,
                  quantity: item.printVolume,
                  unit_cost: rate
                };
              })
            }
          }
        });
      });

      const firstArtwork = items.find(i => i.artworkUrl)?.artworkUrl;
      const firstFileName = items.find(i => i.fileName)?.fileName;
      const firstFileSize = items.find(i => i.fileSize)?.fileSize;

      // Pass autoDeduct = false to enforce stock deduction only at IN_PRODUCTION stage
      addOrder({
        customerName: selectedCustomerId,
        phone: customerPhone || customers.find(c => c.name === selectedCustomerId)?.phone || '020 55889900',
        items: orderItems,
        totalPriceCharged: finalGrandTotal,
        depositAmountPaid: Math.round(finalGrandTotal * 0.5),
        remainingUnpaidBalance: Math.round(finalGrandTotal * 0.5),
        paymentMethod: 'BCEL One',
        paymentStatus: 'Deposit Paid',
        status: 'Received',
        shippingFee: Number(shippingFee || 0),
        shippingMethod: shippingMethod,
        artworkLink: firstArtwork || firstFileName || '',
        artworkUrl: firstArtwork || '',
        artwork_url: firstArtwork || '',
        artworkFileName: firstFileName || '',
        artwork_file_name: firstFileName || '',
        artworkFileSize: firstFileSize || 0,
        artwork_file_size: firstFileSize || 0,
        notes: `Multi-Item Quotation Order (${items.length} items): ${items.map(i => `${i.name} (${i.printVolume} units)`).join(', ')}. Shipping: ${shippingMethod} (${formatCurrency(shippingFee)}). Payment terms: ${paymentTerms}. ${quotationNote ? `Note: ${quotationNote}` : ''}`,
      }, false);

      showToast(
        currentLang === 'lo' 
          ? `ເປີດອໍເດີ (${items.length} ລາຍການ) ສຳເລັດ! (ສະຕ໋ອກຈະຖືກຕັດເມື່ອເຂົ້າສູ່ຂັ້ນຕອນພິມ IN_PRODUCTION)` 
          : `Order with ${items.length} items created successfully! (Inventory will be deducted at IN_PRODUCTION stage)`,
        'success'
      );

      if (onConvertToOrder) {
        const primaryItem = items[0];
        const primaryCalc = calculatedItems[0];
        onConvertToOrder({
          paperId: primaryItem?.paperId,
          paperName: primaryItem?.name,
          quantity: primaryItem?.printVolume,
          unitCost: primaryCalc?.unitPrice,
          artworkUrl: firstArtwork,
          artwork_url: firstArtwork,
          artworkFileName: firstFileName,
          artwork_file_name: firstFileName,
          artworkFileSize: firstFileSize,
          artwork_file_size: firstFileSize,
          artworkLink: firstArtwork,
          items: items.map((it, idx) => ({
            name: it.name,
            paperId: it.paperId,
            quantity: it.printVolume,
            unitCost: calculatedItems[idx]?.unitPrice,
            artworkUrl: it.artworkUrl,
            fileName: it.fileName,
            fileSize: it.fileSize,
            jobSizePreset: it.jobSizePreset,
            jobWidth: it.jobWidth,
            jobHeight: it.jobHeight,
            pagesPerBook: it.pagesPerBook
          }))
        });
      }
      if (setActiveTab) {
        setActiveTab('orders');
      }
    });
  };

  // Open Save Modal
  const handleSaveQuotation = () => {
    setIsSaveModalOpen(true);
  };

  // Confirm Save current quotation to history with versioning & template tag
  const handleConfirmSaveQuotation = () => {
    const quoteItems = items.map((item, idx) => {
      const calc = calculatedItems[idx];
      return {
        id: item.id,
        name: item.name,
        quantity: item.printVolume,
        unitPrice: calc.unitPrice,
        subtotal: calc.sellingPrice,
        specSummary: `${item.jobSizePreset} (${item.jobWidth}x${item.jobHeight}mm) | ${inventory.find(p => p.id === item.paperId)?.name || 'Paper'} | ${item.colorPrintMode === 'MONO_K' ? 'Mono K' : 'CMYK'}`
      };
    });

    const resolvedPhone = customerPhone || customers.find(c => c.name === selectedCustomerId)?.phone || '';

    const quoteData = {
      title: quotationTitle.trim() || 'ໃບສະເໜີລາຄາງານພິມ',
      isPricingTemplate: isTemplateOption,
      templateCategory: isTemplateOption ? templateCategory : undefined,
      customerName: selectedCustomerId || 'General Customer',
      phone: resolvedPhone,
      rawItems: JSON.parse(JSON.stringify(items)),
      items: quoteItems,
      subtotal: grandSubtotal,
      baseSellingPrice: grandBaseSellingPrice,
      discountAmount: grandDiscountAmount,
      discountPercent: Number(quotationDiscountPercent || 0),
      grossProfitMargin: grandProfitMargin,
      profitMargin: quotationProfitMargin,
      taxEnabled,
      taxRate: Number(taxRate),
      taxMode,
      taxOverrideAmount: Number(taxOverrideAmount),
      taxAmount,
      shippingFee: Number(shippingFee || 0),
      shippingMethod,
      grandTotal: finalGrandTotal,
      expiresAt: quotationExpiry,
      paymentTerms,
      notes: quotationNote,
      status: grandProfitMargin < 25.0 ? 'REQUIRES_MANAGER_APPROVAL' : 'Pending',
      version: 1
    };

    addQuotation(quoteData);
    setIsSaveModalOpen(false);

    if (isTemplateOption) {
      showToast(
        currentLang === 'lo' 
          ? `ບັນທຶກ "${quotationTitle}" ເປັນເທມເພລດສູດລາຄາຮຽບຮ້ອຍ!` 
          : `Saved "${quotationTitle}" as Pricing Template!`,
        'success'
      );
    } else if (grandProfitMargin < 25.0) {
      showToast(
        currentLang === 'lo'
          ? 'ບັນທຶກແລ້ວ! ກຳໄລ < 25% ສະຖານະ: ລໍຖ້າຜູ້ຈັດການອະນຸມັດສ່ວນຫຼຸດ'
          : 'Saved! Margin < 25% marked as REQUIRES_MANAGER_APPROVAL',
        'warning'
      );
    } else {
      showToast(
        currentLang === 'lo' ? 'ບັນທຶກໃບສະເໜີລາຄາສຳເລັດ!' : 'Quotation saved successfully!',
        'success'
      );
    }
  };

  // Manager Approval Actions
  const handleApproveDiscount = async (quote: any) => {
    setIsProcessingApproval(true);
    try {
      await fetch(`/api/v1/quotations/${quote.id || quote.quotationNumber}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Role': 'ROLE_MANAGER' },
        body: JSON.stringify({ reason: approvalReason, manager_id: 'MGR-ACTIVE' })
      }).catch(() => null);

      quote.status = 'Approved';
      quote.approvedBy = 'Sales Manager';
      quote.approvalNote = approvalReason;

      showToast(
        currentLang === 'lo' ? 'ອະນຸມັດສ່ວນຫຼຸດສຳເລັດແລ້ວ!' : 'Discount approved by Sales Manager!',
        'success'
      );
      setApprovalModalQuote(null);
      setApprovalReason('');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleRejectDiscount = async (quote: any) => {
    if (!approvalReason.trim()) {
      showToast(
        currentLang === 'lo' ? 'ກະລຸນາປ້ອນເຫດຜົນການປະຕິເສດ' : 'Please provide a rejection reason',
        'error'
      );
      return;
    }
    setIsProcessingApproval(true);
    try {
      await fetch(`/api/v1/quotations/${quote.id || quote.quotationNumber}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Role': 'ROLE_MANAGER' },
        body: JSON.stringify({ reason: approvalReason, manager_id: 'MGR-ACTIVE' })
      }).catch(() => null);

      quote.status = 'Rejected';
      quote.rejectionReason = approvalReason;

      showToast(
        currentLang === 'lo' ? 'ປະຕິເສດສ່ວນຫຼຸດແລ້ວ' : 'Discount rejected',
        'info'
      );
      setApprovalModalQuote(null);
      setApprovalReason('');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // Revise the active quotation (adds a new version row)
  const handleReviseQuotation = (quotationId: string) => {
    reviseQuotation(quotationId, finalGrandTotal, `Revision applied: ${currency} ${formatCurrency(finalGrandTotal)}`);
    showToast(
      currentLang === 'lo' ? 'ສ້າງເວີຊັນໃໝ່ສຳເລັດ!' : 'New quotation version created!',
      'success'
    );
  };

  // 1-Click Convert accepted quotation to production order + job ticket
  const handleConvertToOrder = (quotation: any) => {
    const msg = currentLang === 'lo'
      ? `ປ່ຽນໃບສະເໜີ ${quotation.quotationNumber || quotation.quotation_no || quotation.id} ເປັນອໍເດີ ແລະ ສ້າງ Job Ticket ບໍ?`
      : `Convert quotation ${quotation.quotationNumber || quotation.quotation_no || quotation.id} to a production order with Job Ticket?`;

    askConfirmation(msg, async () => {
      let createdOrderId = quotation.id;
      try {
        const res = await fetch(`/api/v1/quotations/${quotation.id || quotation.quotationNumber || quotation.quotation_no}/convert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          createdOrderId = data.orderId || data.order_id || createdOrderId;
        }
      } catch (err) {
        console.warn('Backend conversion fallback to local store:', err);
      }

      const localOrderId = convertQuotationToOrder(quotation.id);
      const finalOrderId = createdOrderId || localOrderId;

      if (finalOrderId && onConvertToOrder) {
        onConvertToOrder({ orderId: finalOrderId, sourceQuotationId: quotation.id });
      }
      showToast(
        currentLang === 'lo' ? 'ປ່ຽນເປັນອໍເດີສຳເລັດ! ສ້າງ Job Ticket ແລ້ວ.' : 'Converted to order! Job Ticket generated.',
        'success'
      );
    });
  };

  // Quick Save as Draft with Customer & Specs Snapshot
  const handleSaveDraft = () => {
    const quoteItems = items.map((item, idx) => {
      const calc = calculatedItems[idx];
      const paperObj = inventory.find(p => p.id === item.paperId);
      const postPressNames = (item.selectedPostPressIds || [])
        .map(mId => equipment.find(e => e.id === mId)?.name)
        .filter(Boolean)
        .join(', ');
      const consumablesNames = (item.finishingMaterials || [])
        .map(m => `${m.name} (${m.qtyPerItem}${m.unitName || 'ອັນ'})`)
        .join(', ');

      return {
        id: item.id,
        name: item.name,
        quantity: item.printVolume,
        unitPrice: calc.unitPrice,
        subtotal: calc.sellingPrice,
        specSummary: `${item.jobSizePreset} (${item.jobWidth}x${item.jobHeight}mm) | ${paperObj?.name || 'Paper'} | ${item.colorPrintMode === 'MONO_K' ? 'Mono K' : 'CMYK'}${postPressNames ? ` | ${postPressNames}` : ''}${consumablesNames ? ` | ${consumablesNames}` : ''}`
      };
    });

    const resolvedPhone = customerPhone || customers.find(c => c.name === selectedCustomerId)?.phone || '';

    const draftData = {
      title: quotationTitle.trim() || 'ສະບັບຮ່າງໃບສະເໜີລາຄາ',
      customerName: selectedCustomerId || 'General Customer',
      phone: resolvedPhone,
      rawItems: JSON.parse(JSON.stringify(items)),
      items: quoteItems,
      subtotal: grandSubtotal,
      baseSellingPrice: grandBaseSellingPrice,
      discountAmount: grandDiscountAmount,
      discountPercent: Number(quotationDiscountPercent || 0),
      grossProfitMargin: grandProfitMargin,
      profitMargin: quotationProfitMargin,
      taxEnabled,
      taxRate: Number(taxRate),
      taxMode,
      taxOverrideAmount: Number(taxOverrideAmount),
      taxAmount,
      shippingFee: Number(shippingFee || 0),
      shippingMethod,
      grandTotal: finalGrandTotal,
      expiresAt: quotationExpiry,
      paymentTerms,
      notes: quotationNote,
      status: 'Draft',
      version: 1,
      artworkUrl: items.find(it => it.artworkUrl)?.artworkUrl || '',
      artwork_url: items.find(it => it.artworkUrl)?.artworkUrl || '',
      fileName: items.find(it => it.fileName)?.fileName || '',
    };

    addQuotation(draftData);
    showToast(
      currentLang === 'lo'
        ? `ບັນທຶກສະບັບຮ່າງ "${draftData.title}" ສຳເລັດ! ເຂົ້າສູ່ປະຫວັດໃບສະເໜີແລ້ວ.`
        : `Draft "${draftData.title}" saved successfully!`,
      'success'
    );
  };

  // Delete a quotation with confirmation
  const handleDeleteQuotation = (quote: any) => {
    const msg = currentLang === 'lo'
      ? `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລົບໃບສະເໜີ "${quote.quotationNumber}" (${quote.customerName})?`
      : `Are you sure you want to delete quotation "${quote.quotationNumber}" (${quote.customerName})?`;

    askConfirmation(msg, () => {
      deleteQuotation(quote.id);
      showToast(
        currentLang === 'lo' ? 'ລົບໃບສະເໜີລາຄາຮຽບຮ້ອຍແລ້ວ' : 'Quotation deleted successfully',
        'success'
      );
    });
  };

  // Safe Sanitizer for Quotation Items (prevents white-screen crashes on old/partial items)
  const sanitizeQuotationItem = (raw: any, idx: number): QuotationItem => {
    const defPaper = inventory[0]?.id || '';
    const defPrn = equipment[0]?.id || '';
    return {
      id: raw?.id || `item-${Date.now()}-${idx}`,
      name: raw?.name || `ລາຍການ ${idx + 1}`,
      paperId: raw?.paperId || defPaper,
      jobSizePreset: raw?.jobSizePreset || 'A4',
      jobWidth: Number(raw?.jobWidth) || 210,
      jobHeight: Number(raw?.jobHeight) || 297,
      isDoubleSided: Boolean(raw?.isDoubleSided),
      printVolume: Math.max(1, Number(raw?.printVolume ?? raw?.quantity) || 100),
      colorPrintMode: raw?.colorPrintMode === 'MONO_K' ? 'MONO_K' : 'CMYK',
      coverageMode: raw?.coverageMode === 'advanced' ? 'advanced' : 'default',
      avgCoverage: Number(raw?.avgCoverage) || 15,
      cCoverage: Number(raw?.cCoverage) || 15,
      mCoverage: Number(raw?.mCoverage) || 15,
      yCoverage: Number(raw?.yCoverage) || 15,
      kCoverage: Number(raw?.kCoverage) || 15,
      selectedPrinterId: raw?.selectedPrinterId || raw?.machineId || defPrn,
      selectedInkSet: raw?.selectedInkSet || 'OEM',
      finishingCutOption: raw?.finishingCutOption || 'straight',
      bindingOption: raw?.bindingOption || 'none',
      selectedPostPressIds: Array.isArray(raw?.selectedPostPressIds) ? raw.selectedPostPressIds : [],
      finishingMaterials: Array.isArray(raw?.finishingMaterials) 
        ? raw.finishingMaterials.map((m: any, mI: number) => ({
            id: m.id || `mat-${Date.now()}-${mI}`,
            name: m.name || 'ວັດຖຸດິບ',
            unitCost: Number(m.unitCost) || 50,
            qtyPerItem: Number(m.qtyPerItem) || 1,
            calcMode: m.calcMode === 'box' ? 'box' : 'unit',
            packagePrice: Number(m.packagePrice) || 50000,
            unitsPerPackage: Number(m.unitsPerPackage) || 1000,
            unitName: m.unitName || 'ອັນ',
            category: m.category || 'other',
            materialId: m.materialId,
          }))
        : [],
      activeModules: {
        paper: raw?.activeModules?.paper !== false,
        printEngine: raw?.activeModules?.printEngine !== false,
        postPressMachinery: Boolean(raw?.activeModules?.postPressMachinery),
        finishingMaterials: Boolean(raw?.activeModules?.finishingMaterials),
        laborAndSetup: raw?.activeModules?.laborAndSetup !== false,
        packagingDelivery: Boolean(raw?.activeModules?.packagingDelivery),
      },
      selectedTemplateId: raw?.selectedTemplateId || 'TPL_CUSTOM',
      laborMode: raw?.laborMode === 'manual' ? 'manual' : 'percent',
      laborPercent: raw?.laborPercent !== undefined ? Number(raw.laborPercent) : 0,
      laborCostManual: Number(raw?.laborCostManual) || 0,
      packagingCost: Number(raw?.packagingCost) || 0,
      deliveryCost: Number(raw?.deliveryCost) || 0,
      profitMargin: Number(raw?.profitMargin) || 40,
      discountPercent: Number(raw?.discountPercent) || 0,
      printerAllocations: Array.isArray(raw?.printerAllocations) ? raw.printerAllocations : undefined,
    };
  };

  // Load a saved quotation's financial settings back into the calculator (Lossless & Robust)
  const handleLoadQuotation = (quotation: any) => {
    if (!quotation) return;
    if (quotation.title) setQuotationTitle(quotation.title);
    if (quotation.customerName) setSelectedCustomerId(quotation.customerName);
    if (quotation.phone) setCustomerPhone(quotation.phone);
    setTaxEnabled(Boolean(quotation.taxEnabled));
    setTaxRate(Number(quotation.taxRate) || 0);
    setTaxMode(quotation.taxMode || 'percent');
    setTaxOverrideAmount(Number(quotation.taxOverrideAmount) || 0);
    setQuotationExpiry(quotation.expiresAt || '2026-08-31');
    setPaymentTerms(quotation.paymentTerms || 'Immediate / Cash');
    setQuotationNote(quotation.notes || '');
    if (quotation.profitMargin !== undefined) setQuotationProfitMargin(Number(quotation.profitMargin));
    else if (quotation.grossProfitMargin !== undefined) setQuotationProfitMargin(Number(quotation.grossProfitMargin));
    if (quotation.discountPercent !== undefined) setQuotationDiscountPercent(Number(quotation.discountPercent));
    if (quotation.shippingFee !== undefined) setShippingFee(Number(quotation.shippingFee));
    if (quotation.shippingMethod) setShippingMethod(quotation.shippingMethod);

    const rawList = Array.isArray(quotation.rawItems) && quotation.rawItems.length > 0
      ? quotation.rawItems
      : Array.isArray(quotation.items) && quotation.items.length > 0
        ? quotation.items
        : [];

    if (rawList.length > 0) {
      const sanitized = rawList.map((it: any, i: number) => sanitizeQuotationItem(it, i));
      setItems(sanitized);
      setActiveItemIndex(0);
    }

    setIsQuotationListOpen(false);
    setCurrentStep('calc');
    showToast(
      currentLang === 'lo' 
        ? `ໂຫຼດໃບສະເໜີ "${quotation.title || quotation.quotationNumber}" ສຳເລັດ!` 
        : `Loaded quotation "${quotation.title || quotation.quotationNumber}" successfully!`, 
      'success'
    );
  };

  const handleToggleActivePostPress = (machineId: string) => {
    const currentList = activeItem.selectedPostPressIds || [];
    const updated = currentList.includes(machineId)
      ? currentList.filter(id => id !== machineId)
      : [...currentList, machineId];
    updateActiveItem({ selectedPostPressIds: updated });
  };

  return (
    <div className="space-y-3 animate-fade-in text-slate-800 print:bg-white print:p-0 print:text-black">
      
      {/* ========================================================================= */}
      {/* UNIFIED HEADER & PIPELINE STEPPER BAR                                     */}
      {/* ========================================================================= */}
      <div className="bg-white px-4 py-3 rounded-3xl border border-slate-200/90 shadow-xs mb-4 print:hidden flex flex-wrap items-center justify-between gap-4">
        {/* Left: Back button + Quotation Title + Items Badge */}
        <div className="flex items-center gap-3 min-w-[200px]">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition shrink-0 active:scale-95 cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-navy/10 text-primary-navy flex items-center justify-center font-bold shrink-0">
              <FileText className="w-5 h-5 text-primary-navy" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-slate-900 truncate max-w-[200px]">
                  {quotationTitle || (currentLang === 'lo' ? 'ໃບສະເໜີລາຄາງານພິມ' : 'Printing Quotation')}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(true)}
                  className="p-1 hover:bg-slate-100 text-accent-sky rounded-md transition cursor-pointer text-[11px] font-bold"
                  title="Rename quotation"
                >
                  ({currentLang === 'lo' ? 'ປ່ຽນຊື່' : 'Rename'})
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                {items.length} {currentLang === 'lo' ? 'ລາຍການ' : 'Items'} • {formatCurrency(finalGrandTotal)}
              </p>
            </div>
          </div>
        </div>

        {/* Center: 3-Step Pipeline Stepper */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => {
              setWizardStep('intake');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`py-1.5 px-3 rounded-xl flex items-center gap-2 text-xs font-black transition cursor-pointer ${
              wizardStep === 'intake'
                ? 'bg-primary-navy text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
              wizardStep === 'intake' ? 'bg-white text-primary-navy' : 'bg-slate-200 text-slate-700'
            }`}>
              1
            </span>
            <span className="truncate">{currentLang === 'lo' ? 'ລູກຄ້າ & ລາຍການ' : 'Customer & Items'}</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold shrink-0 ${
              wizardStep === 'intake' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {items.length}
            </span>
          </button>

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => {
              setWizardStep('specs');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`py-1.5 px-3 rounded-xl flex items-center gap-2 text-xs font-black transition cursor-pointer ${
              wizardStep === 'specs'
                ? 'bg-primary-navy text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
              wizardStep === 'specs' ? 'bg-white text-primary-navy' : 'bg-slate-200 text-slate-700'
            }`}>
              2
            </span>
            <span className="truncate">{currentLang === 'lo' ? 'ກຳນົດສະເປັກ' : 'Specs Studio'}</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold shrink-0 ${
              wizardStep === 'specs' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              #{activeItemIndex + 1}
            </span>
          </button>

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => {
              setWizardStep('summary');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`py-1.5 px-3 rounded-xl flex items-center gap-2 text-xs font-black transition cursor-pointer ${
              wizardStep === 'summary'
                ? 'bg-primary-navy text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
              wizardStep === 'summary' ? 'bg-white text-primary-navy' : 'bg-slate-200 text-slate-700'
            }`}>
              3
            </span>
            <span className="truncate">{currentLang === 'lo' ? 'ສະຫຼຸບຕົ້ນທຶນ' : 'Summary & Quote'}</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold shrink-0 ${
              wizardStep === 'summary' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-200 text-slate-600'
            }`}>
              {formatCurrency(finalGrandTotal)}
            </span>
          </button>
        </div>

        {/* Right: History + Save Draft */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsQuotationListOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95"
            title="ປະຫວັດໃບສະເໜີ"
          >
            <Layers3 className="w-4 h-4 shrink-0 text-accent-sky" />
            <span className="hidden sm:inline">{currentLang === 'lo' ? 'ປະຫວັດ' : 'History'}</span>
            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold">
              {quotations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
            title="Save draft"
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">{currentLang === 'lo' ? 'ບັນທຶກສະບັບຮ່າງ' : 'Save Draft'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: CUSTOMER (LEFT) & ITEMS TABLE (RIGHT)                             */}
      {/* ========================================================================= */}
      {wizardStep === 'intake' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start animate-fade-in print:hidden">
          
          {/* Left Column: Customer Information Card (40% width) */}
          <div className="lg:col-span-5 xl:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    {currentLang === 'lo' ? 'ຂໍ້ມູນລູກຄ້າ' : 'Customer Information'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {currentLang === 'lo' ? 'ເລືອກລູກຄ້າ ຫຼື ເພີ່ມລູກຄ້າໃໝ່' : 'Select existing customer or add new.'}
                  </p>
                </div>
              </div>
              {selectedCustomerId && (
                <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200 font-sans flex items-center gap-1.5 max-w-[140px] truncate">
                  <span className="truncate">{selectedCustomerId}</span>
                </span>
              )}
            </div>

            <CustomerCombobox
              customers={customers}
              valueName={selectedCustomerId}
              valuePhone={customerPhone}
              valueAddress={customerAddress}
              onChange={handleCustomerComboboxChange}
              hideSaveToCrmCheckbox={true}
              currentLang={currentLang}
            />

            {/* Customer Category / Tier Selector */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{currentLang === 'lo' ? 'ກຸ່ມ / ປະເພດລູກຄ້າ' : 'Customer Category / Tier'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomerCategoryModalOpen(true)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition hover:underline"
                >
                  <FolderPlus className="w-3 h-3" />
                  <span>{currentLang === 'lo' ? '+ ເພີ່ມກຸ່ມໃໝ່' : '+ New Category'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {((customerCategories && customerCategories.length > 0) ? customerCategories : [
                  { id: 'RETAIL', nameLao: 'ລູກຄ້າທົ່ວໄປ (Retail)', name: 'Retail' },
                  { id: 'CORPORATE', nameLao: 'ອົງກອນ / ບໍລິສັດ (Corporate)', name: 'Corporate' },
                  { id: 'AGENCY', nameLao: 'ຕົວແທນ / ນາຍໜ້າ (Agency)', name: 'Agency' },
                  { id: 'VIP', nameLao: 'ລູກຄ້າ VIP', name: 'VIP' },
                  { id: 'WHOLESALE', nameLao: 'ຂາຍສົ່ງ (Wholesale)', name: 'Wholesale' },
                ]).map((cat: any) => {
                  const isSelected = selectedCustomerCategory === cat.id || selectedCustomerCategory === cat.name;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCustomerCategory(cat.id)}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{cat.nameLao || cat.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-indigo-600 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Auto-save to CRM Toggle Switch (ດັອກກີ້) */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {currentLang === 'lo' ? 'ບັນທຶກເຂົ້າຖານຂໍ້ມູນ CRM ອັດຕະໂນມັດ' : 'Auto-save to CRM'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {currentLang === 'lo' ? 'ເພີ່ມຂໍ້ມູນລູກຄ້ານີ້ເຂົ້າລະບົບ CRM ທັນທີເມື່ອບັນທຶກໃບສະເໜີ' : 'Save new customer profile into CRM upon saving quotation'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoSaveCustomerToCRM(!autoSaveCustomerToCRM)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoSaveCustomerToCRM ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={autoSaveCustomerToCRM}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    autoSaveCustomerToCRM ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Credit warning banner if exceeded */}
            {creditStatus.exceeded && (
              <div className="bg-amber-50 border-2 border-amber-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">{currentLang === 'lo' ? 'ວົງເງິນສິນເຊື່ອເກີນກຳນົດ!' : 'Credit Limit Exceeded!'}</p>
                  <p className="text-[11px] leading-relaxed text-amber-800 font-normal">
                    {currentLang === 'lo'
                      ? `ລູກຄ້າ ${selectedCustomerId} ມີຈຳກັດສິນເຊື່ອ ${formatCurrency(creditStatus.limit)}. ຍອດຄ້າງ ${formatCurrency(creditStatus.currentUnpaid)}.`
                      : `Customer credit limit: ${formatCurrency(creditStatus.limit)}.`
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Items Table Card (60% width) */}
          <div className="lg:col-span-7 xl:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            
            {/* Header: Title + Preflight & New Item buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <span>{currentLang === 'lo' ? 'ລາຍການສິນຄ້າໃນໃບສະເໜີ' : 'Quotation Line Items'}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 font-sans font-black">
                      {items.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {currentLang === 'lo' ? 'ລາຍການງານພິມທັງໝົດໃນໃບສະເໜີລາຄານີ້' : 'All items in this quotation.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreflightModalOpen(true)}
                  className="px-3 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs shadow-indigo-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>{currentLang === 'lo' ? 'Preflight (ກວດຟາຍ)' : 'Preflight'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{currentLang === 'lo' ? 'ລາຍການໃໝ່' : 'New Item'}</span>
                </button>
              </div>
            </div>

            {/* Items Table View */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[150px]">{currentLang === 'lo' ? 'ຊື່ລາຍການ' : 'Item Name'}</th>
                    <th className="py-2.5 px-3">{currentLang === 'lo' ? 'ສະເປັກ' : 'Specifications'}</th>
                    <th className="py-2.5 px-3 text-right">{currentLang === 'lo' ? 'ຈຳນວນ' : 'Quantity'}</th>
                    <th className="py-2.5 px-3 text-right">{currentLang === 'lo' ? 'ລາຄາລວມ' : 'Total'}</th>
                    <th className="py-2.5 px-3 w-16 text-center">{currentLang === 'lo' ? 'ຈັດການ' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const calc: any = calculatedItems[idx] || {};
                    const unitPrice = calc.unitPrice || calc.effectiveSellingPrice || calc.sellingPrice || 0;
                    const totalLine = unitPrice * (Number(item.printVolume) || 1);
                    const paperItem = inventory.find(p => p.id === item.paperId);
                    const coverPaperItem = item.includeCover && item.coverPaperId ? inventory.find(p => p.id === item.coverPaperId) : null;
                    const printerItem = equipment.find(e => e.id === item.selectedPrinterId);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 text-center">
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] mx-auto">
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[idx] = { ...newItems[idx], name: e.target.value };
                              setItems(newItems);
                            }}
                            placeholder="ລະບຸຊື່ລາຍການ..."
                            className="font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1 py-0.5 transition w-full text-xs"
                          />
                          {item.fileName && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-sky-600 font-medium mt-0.5 truncate max-w-[180px]">
                              <FileText className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{item.fileName}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="space-y-1 text-[11px]">
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold font-sans">
                                {item.jobSizePreset || 'A4'}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium font-sans">
                                {item.pagesPerBook ? `${item.pagesPerBook} ໜ້າ` : '1 ໜ້າ'}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold">
                                {item.colorPrintMode === 'MONO_K' ? 'Mono' : 'CMYK'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setPreviewColorItem(item)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200/60 cursor-pointer transition text-[10px]"
                                title="ກວດສອບຄ່າສີ & Preview ໄຟລ໌"
                              >
                                <Palette className="w-2.5 h-2.5 text-indigo-600" />
                                <span>C{Math.round(item.cCoverage ?? 15)} M{Math.round(item.mCoverage ?? 15)} Y{Math.round(item.yCoverage ?? 15)} K{Math.round(item.kCoverage ?? 15)}</span>
                              </button>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[220px]">
                              <span>{paperItem?.name || item.paperId || 'A4 ທົ່ວໄປ'}</span>
                              {item.cutsPerSheetOverride !== undefined && item.cutsPerSheetOverride > 1 && (
                                <span className="text-sky-700 font-bold"> ({item.cutsPerSheetOverride} ຕັດ/ແຜ່ນ)</span>
                              )}
                              {item.includeCover && coverPaperItem && (
                                <span className="text-amber-700 font-semibold">
                                  {' '}• ປົກ: {coverPaperItem.name}
                                  {item.coverCutsPerSheetOverride !== undefined && item.coverCutsPerSheetOverride > 1 && (
                                    <span> ({item.coverCutsPerSheetOverride} ປົກ/ແຜ່ນ)</span>
                                  )}
                                </span>
                              )}
                              {printerItem?.name && (
                                <span> • {printerItem.name}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-700 font-sans">
                          {item.printVolume || 1} {item.unitName || 'ຊຸດ'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="font-mono font-black text-emerald-700 text-xs">
                            {formatCurrency(totalLine)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans">
                            {formatCurrency(unitPrice)}/ຊຸດ
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setPreviewColorItem(item)}
                              className="p-1 hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700 rounded-lg transition cursor-pointer"
                              title="ກວດສອບຄ່າສີ & Preview ໄຟລ໌"
                            >
                              <Palette className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateItem(idx)}
                              className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                              title="Duplicate"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                                title="Delete"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Summary Strip & Next Button */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500 font-medium flex items-center gap-3">
                <span>{currentLang === 'lo' ? 'ລວມລາຍການ:' : 'Items:'} <strong className="text-slate-800 font-black">{items.length}</strong></span>
                <span>•</span>
                <span>{currentLang === 'lo' ? 'ຈຳນວນພິມ:' : 'Qty:'} <strong className="text-slate-800 font-black">{grandTotalUnits}</strong></span>
                <span>•</span>
                <span>{currentLang === 'lo' ? 'ປະເມີນລວມ:' : 'Est. Total:'} <strong className="text-emerald-700 font-black font-mono">{formatCurrency(finalGrandTotal)}</strong></span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setWizardStep('specs');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-primary-navy to-indigo-700 hover:from-primary-navy/90 hover:to-indigo-600 text-white rounded-xl text-xs font-black flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-md shadow-indigo-600/20 ml-auto"
              >
                <span>{currentLang === 'lo' ? 'ຕໍ່ໄປ: ກຳນົດສະເປັກການພິມ' : 'Next: Configure Specs'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: ITEMIZED PRODUCTION SPEC STUDIO (ກຳນົດສະເປັກແຕ່ລະລາຍການ)           */}
      {/* ========================================================================= */}
      {wizardStep === 'specs' && (
        <div className="space-y-4 animate-fade-in print:hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Left: Items Selector Sidebar (~25-30% width) */}
            <div className="lg:col-span-4 xl:col-span-3 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-3 lg:sticky lg:top-[5.5rem] lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto scrollbar-thin">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>{currentLang === 'lo' ? 'ເລືອກລາຍການ' : 'Select Item'}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-sans font-black">
                      {items.length}
                    </span>
                  </h3>
                </div>
              </div>

              {/* Action Buttons: Preflight & New Item */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreflightModalOpen(true)}
                  className="px-2 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs shadow-indigo-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
                  <span className="truncate">Preflight</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{currentLang === 'lo' ? 'ລາຍການໃໝ່' : 'New Item'}</span>
                </button>
              </div>

              {/* Items Vertical Stack */}
              <div className="space-y-2.5 max-h-[calc(100vh-18rem)] overflow-y-auto pr-0.5 scrollbar-thin">
                {items.map((item, idx) => {
                  const isActive = idx === activeItemIndex;
                  const calc: any = calculatedItems[idx] || {};
                  const unitPrice = calc.unitPrice || calc.effectiveSellingPrice || calc.sellingPrice || 0;
                  const totalLine = unitPrice * (Number(item.printVolume) || 1);

                  // Extract specs metadata for clear row-by-row display
                  const paperItem = inventory.find(p => p.id === item.paperId);
                  const coverPaperItem = item.includeCover && item.coverPaperId ? inventory.find(p => p.id === item.coverPaperId) : null;
                  const printerItem = equipment.find(e => e.id === item.selectedPrinterId);
                  const postPressNames = (item.selectedPostPressIds || [])
                    .map(mId => equipment.find(e => e.id === mId)?.name)
                    .filter(Boolean);
                  const matNames = (item.finishingMaterials || [])
                    .map(m => m.name)
                    .filter(Boolean);

                  // Intelligent Batch Photo & Single Sheet Detection
                  const isBatchPhoto = Boolean(
                    item.batchFiles && item.batchFiles.length > 0 ||
                    (item.preflightData as any)?.is_batch_photo ||
                    (item.suggestedPaper && (item.suggestedPaper.includes('Photo') || item.suggestedPaper.includes('3x4') || item.suggestedPaper.includes('4x6') || item.suggestedPaper.includes('2x3'))) ||
                    (item.jobSizePreset && (item.jobSizePreset.includes('3x4') || item.jobSizePreset.includes('4x6') || item.jobSizePreset.includes('2x3')))
                  );
                  const batchCount = item.batchFiles?.length || (item.preflightData as any)?.total_files || (isBatchPhoto ? (item.pagesPerBook || 1) : 0);
                  const primaryArtworkUrl = item.artworkUrl || item.batchFiles?.[0]?.url || item.batchFiles?.[0]?.file_url || item.preflightData?.file_url;
                  const isSingleOrPhoto = isBatchPhoto || (!item.includeCover && (item.pagesPerBook || 1) <= 1);

                  // Per-page / Per-photo and Parent Sheet Costing breakdown
                  const totalJobPages = Math.max(1, (Number(item.pagesPerBook) || 1) * (Number(item.printVolume) || 1));
                  const costPerSingleUnit = Math.round((calc.netCost || 0) / totalJobPages);
                  const pricePerSingleUnit = Math.round(unitPrice / Math.max(1, Number(item.pagesPerBook) || 1));
                  const parentSheetCost = calc.paperUnitCost || 850;
                  const parentSheetsUsed = calc.totalParentSheets || calc.totalInnerParentSheets || Math.ceil(totalJobPages / Math.max(1, calc.cutsPerSheet || 1));

                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveItemIndex(idx)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
                        isActive
                          ? 'bg-white border-primary-navy shadow-md ring-2 ring-primary-navy/15'
                          : 'bg-slate-50/80 border-slate-200/80 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Card Header: #No + Name + Badge + Actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                            isActive ? 'bg-primary-navy text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                          }`}>
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className={`text-xs font-black truncate block ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                              {item.name || `ລາຍການ ${idx + 1}`}
                            </span>
                            {isBatchPhoto ? (
                              <span className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded mt-0.5">
                                ຊຸດຮູບພາບ ({batchCount} ຮູບ)
                              </span>
                            ) : item.includeCover ? (
                              <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded mt-0.5">
                                ປຶ້ມແຍກປົກ
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleDuplicateItem(idx)}
                            className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-md transition cursor-pointer"
                            title="Duplicate item"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                              title="Remove item"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Visual Artwork Thumbnail & Quick Preview Trigger */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewColorItem(item);
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-100/70 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-300 transition group cursor-pointer"
                      >
                        <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative">
                          {primaryArtworkUrl ? (
                            <img 
                              src={primaryArtworkUrl} 
                              alt="Artwork thumbnail" 
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                            />
                          ) : (
                            <FileText className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition" />
                          )}
                          {isBatchPhoto && batchCount > 1 && (
                            <span className="absolute bottom-0 right-0 bg-slate-900/85 text-white font-mono text-[8px] font-bold px-1 rounded-tl">
                              +{batchCount}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-800 group-hover:text-indigo-950 truncate flex items-center gap-1">
                              <Eye className="w-3 h-3 text-indigo-600" />
                              <span>{isBatchPhoto ? `ໄຟລ໌ຮູບ ${batchCount} ໃບ` : (item.fileName || 'ກົດເບິ່ງໄຟລ໌')}</span>
                            </span>
                            <span className="text-[9px] font-bold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200 shadow-2xs">
                              Preview
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-900 mt-0.5">
                            <Palette className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                            <span className="font-mono">C{Math.round(item.cCoverage ?? 15)} M{Math.round(item.mCoverage ?? 15)} Y{Math.round(item.yCoverage ?? 15)} K{Math.round(item.kCoverage ?? 15)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Structured Specifications Breakdown */}
                      <div className="space-y-1.5 text-[11px] bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/60">
                        {/* Row 1: Volume & Dimensions */}
                        <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                          <Layers className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span className="truncate">
                            {item.printVolume || 1} {isBatchPhoto ? 'ຊຸດ' : (item.unitName || 'ຊຸດ')} • {isBatchPhoto ? `${item.pagesPerBook || batchCount} ຮູບ/ຊຸດ` : `${item.pagesPerBook || 1} ໜ້າ`} • <strong className="text-slate-900">{item.jobSizePreset || '4x6"'}</strong>
                          </span>
                        </div>

                        {/* Row 2: Substrate / Parent Paper & Imposition Cuts */}
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <FileText className="w-3 h-3 text-sky-500 shrink-0" />
                          <span className="truncate">
                            ເຈ້ຍ: <strong className="text-slate-800 font-semibold">{paperItem?.name || item.paperId || 'A4'}</strong>
                            {calc.cutsPerSheet && calc.cutsPerSheet > 1 && (
                              <span className="text-sky-700 font-bold"> (ຕັດ {calc.cutsPerSheet} ຊິ້ນ/ແຜ່ນ)</span>
                            )}
                          </span>
                        </div>

                        {/* Row 3: Cover Paper (Only if cover is enabled and job is book) */}
                        {item.includeCover && !isSingleOrPhoto && (
                          <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/60">
                            <BookOpen className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate">
                              ປົກ: <strong>{coverPaperItem?.name || 'ເຈ້ຍປົກ'}</strong> ({item.coverPagesCount || 4} ໜ້າ)
                            </span>
                          </div>
                        )}

                        {/* Row 4: Printer Fleet */}
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Printer className="w-3 h-3 text-purple-500 shrink-0" />
                          <span className="truncate">
                            {printerItem?.name || 'ຈັກພິມດິຈິຕອນ'} • <span className="font-bold text-purple-700">{item.colorPrintMode === 'MONO_K' ? 'Mono K' : 'CMYK'}</span>
                          </span>
                        </div>

                        {/* Row 5: Post-Press & Finishing Materials (Only if selected and not pure photo) */}
                        {((postPressNames.length > 0) || (matNames.length > 0) || (item.bindingOption && !isSingleOrPhoto)) && (
                          <div className="flex items-start gap-1.5 text-slate-600 bg-white px-1.5 py-1 rounded border border-slate-200/60">
                            <Scissors className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                            <span className="truncate leading-tight text-[10px]">
                              {[(!isSingleOrPhoto ? item.bindingOption : null), ...postPressNames, ...matNames].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Clean Direct Raw Costing Summary Panel */}
                      <div className="bg-slate-100/80 border border-slate-200/80 rounded-xl p-2.5 text-[11px] space-y-1.5">
                        <div className="flex items-center justify-between text-slate-800 font-bold">
                          <span>ຕົ້ນທຶນວັດຖຸດິບ/{isBatchPhoto ? 'ຮູບ' : 'ໜ້າ'}:</span>
                          <span className="font-mono font-black text-indigo-700">{formatCurrency(costPerSingleUnit)}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 text-[10px] font-medium pt-1 border-t border-slate-200/60">
                          <span>ຄ່າເຈ້ຍ: {formatCurrency(calc.paperCost || 0)}</span>
                          <span>ຄ່າພິມ: {formatCurrency((calc.inkCost || 0) + (calc.machineOverhead || 0))}</span>
                        </div>
                      </div>

                      {/* Card Footer: Volume & Total Raw Production Cost */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-xs">
                        <span className="text-[10px] text-slate-500 font-sans font-medium">
                          {item.printVolume || 1} {isBatchPhoto ? 'ຊຸດ' : (item.unitName || 'ຊຸດ')}
                        </span>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-medium mr-1">ຕົ້ນທຶນລວມ:</span>
                          <span className="font-mono font-black text-slate-900 text-xs">
                            {formatCurrency(calc.netCost || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Active Item Production Spec Studio (~70-75% width) */}
            <div className="lg:col-span-8 xl:col-span-9 bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-5 min-w-0">
              
              {/* Active Item Title & Spec Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-black px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200 whitespace-nowrap shrink-0 inline-flex items-center justify-center font-mono">
                      #{activeItemIndex + 1} / {items.length}
                    </span>
                    <input
                      type="text"
                      value={activeItem.name}
                      onChange={(e) => updateActiveItem({ name: e.target.value })}
                      placeholder="ລະບຸຊື່ສິນຄ້າ..."
                      className="font-extrabold text-base sm:text-lg text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-accent-sky focus:outline-none px-1 py-0.5 transition w-full"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-2">
                    <span>{activeItem.printVolume || 1} {activeItem.unitName || 'ຊຸດ'}</span>
                    <span>•</span>
                    <span>{activeItem.jobSizePreset || 'A4'}</span>
                    <span>•</span>
                    <span>{activeItem.pagesPerBook || 1} ໜ້າ</span>
                  </p>
                </div>

                {/* Template Badge & Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewColorItem(activeItem)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="ກວດສອບຄ່າສີ & Preview ໄຟລ໌"
                  >
                    <Palette className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="truncate max-w-[140px]">
                      {activeItem.fileName ? activeItem.fileName : (currentLang === 'lo' ? 'ກວດຄ່າສີ & ໄຟລ໌' : 'Color & File')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-accent-sky" />
                    <span className="truncate max-w-[140px]">
                      {allAvailableTemplates.find(t => t.id === activeItem.selectedTemplateId)?.nameLao || 
                       allAvailableTemplates.find(t => t.id === activeItem.selectedTemplateId)?.nameEn || 
                       (currentLang === 'lo' ? 'ແມ່ແບບ' : 'Template')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicateItem(activeItemIndex)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    title="Duplicate this item"
                  >
                    {currentLang === 'lo' ? 'ສຳເນົາ' : 'Duplicate'}
                  </button>
                </div>
              </div>

              {/* 1-Click Fast Presets Pills Bar (Dynamic & User-definable) */}
              <div className="p-2.5 bg-gradient-to-r from-sky-50/80 via-indigo-50/60 to-purple-50/80 border border-sky-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                    {currentLang === 'lo' ? 'ຕັ້ງຄ່າດ່ວນ 1-Click:' : 'Fast Presets:'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                  {customFastPresets.map((tpl) => {
                    const isSelected = activeItem.selectedTemplateId === tpl.id;
                    const isCustom = tpl.id.startsWith('CUST_TPL_');
                    return (
                      <div key={tpl.id} className="relative group">
                        <button
                          type="button"
                          onClick={() => handleApplyTemplate(tpl)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                            isSelected
                              ? 'bg-sky-600 text-white shadow-xs scale-[1.02]'
                              : 'bg-white hover:bg-sky-50 text-slate-700 border border-slate-200/80 hover:border-sky-300'
                          }`}
                        >
                          {(tpl.iconName === 'Book' || tpl.id === 'TPL_PERFECT_BIND_BOOK') && <BookOpen className="w-3.5 h-3.5" />}
                          {(tpl.iconName === 'Bookmark' || tpl.id === 'TPL_HARDCOVER_BOOK') && <Bookmark className="w-3.5 h-3.5" />}
                          {(tpl.iconName === 'ImageIcon' || tpl.id === 'TPL_PHOTO_PRINT') && <ImageIcon className="w-3.5 h-3.5" />}
                          {(tpl.iconName === 'Layers' || tpl.id === 'TPL_BOOKLET_STAPLE') && <Layers className="w-3.5 h-3.5" />}
                          {(tpl.iconName === 'Calendar' || tpl.id === 'TPL_DESK_CALENDAR') && <Calendar className="w-3.5 h-3.5" />}
                          {(tpl.iconName === 'Sparkles' || (!['Book', 'Bookmark', 'ImageIcon', 'Layers', 'Calendar'].includes(tpl.iconName || ''))) && <Sparkles className="w-3.5 h-3.5" />}
                          <span className="truncate max-w-[150px]">
                            {currentLang === 'lo' ? tpl.nameLao.split('(')[0].trim() : tpl.nameEn}
                          </span>
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-white ml-0.5" />}
                        </button>

                        {/* Delete Custom Preset button on hover */}
                        {isCustom && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomPreset(tpl.id, e)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                            title="ລຶບແມ່ແບບນີ້"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Add New Custom Preset Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setNewPresetName(activeItem.name || 'ແມ່ແບບດ່ວນໃໝ່');
                      setIsSavePresetModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="ບັນທຶກສເປກປະຈຸບັນເປັນແມ່ແບບດ່ວນ"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ ບັນທຶກແມ່ແບບດ່ວນ</span>
                  </button>
                </div>
              </div>

              {/* 3-Stage Production Step Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setActiveProductionTab('specs')}
                  className={`py-2.5 px-2 sm:px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    activeProductionTab === 'specs'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sliders className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="truncate">{currentLang === 'lo' ? '1. ຂະໜາດ & ຈຳນວນ' : '1. Specs & Volume'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveProductionTab('print')}
                  className={`py-2.5 px-2 sm:px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    activeProductionTab === 'print'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                <span className="truncate">{currentLang === 'lo' ? '2. ເຈ້ຍ & ການພິມ' : '2. Paper & Print'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProductionTab('postpress')}
                className={`py-2.5 px-2 sm:px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeProductionTab === 'postpress'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">{currentLang === 'lo' ? '3. ຫຼັງພິມ & ວັດຖຸດິບ' : '3. Post-Press'}</span>
              </button>
            </div>

            {/* TAB CONTENT 1: Specs & Volume */}
            {activeProductionTab === 'specs' && (
              <div className="space-y-4 animate-fade-in">
                {/* Job Overview & Production Quantity */}
                <JobQuantityAndPagesSection
                  activeItem={activeItem}
                  updateActiveItem={updateActiveItem}
                  activeCalc={activeCalc}
                  isOpen={true}
                  onToggle={() => {}}
                  currentLang={currentLang}
                />

                {/* Pricing Templates & Dynamic Modules Studio */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-accent-sky" />
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        {currentLang === 'lo' ? 'ແມ່ແບບສູດຄຳນວນ (Pricing Templates)' : 'Pricing Preset Templates'}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsTemplateModalOpen(true)}
                        className="px-3 py-1.5 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>{currentLang === 'lo' ? `ຈັດການແມ່ແບບ (${allAvailableTemplates.length})` : `Manage (${allAvailableTemplates.length})`}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsNewTemplateModalOpen(true)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{currentLang === 'lo' ? 'ບັນທຶກແມ່ແບບ' : 'Save Preset'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Production Modules Toggles (Paper, Print, Post-Press, Consumables) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {[
                      { key: 'paper' as const, label: currentLang === 'lo' ? 'ເຈ້ຍ (Paper)' : 'Paper', icon: FileText },
                      { key: 'printEngine' as const, label: currentLang === 'lo' ? 'ເຄື່ອງພິມ & ໝຶກ' : 'Print & Ink', icon: Printer },
                      { key: 'postPressMachinery' as const, label: currentLang === 'lo' ? 'ເຄື່ອງຫຼັງພິມ' : 'Post-Press', icon: Wrench },
                      { key: 'finishingMaterials' as const, label: currentLang === 'lo' ? 'ວັດຖຸດິບຫຼັງພິມ' : 'Consumables', icon: Package },
                    ].map((mod) => {
                      const isActive = activeItem.activeModules ? activeItem.activeModules[mod.key] : true;
                      return (
                        <button
                          key={mod.key}
                          type="button"
                          onClick={() => handleToggleModule(mod.key)}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
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
            )}

            {/* TAB CONTENT 2: Paper & Print */}
            {activeProductionTab === 'print' && (
              <QuotationPrintEngineTab
                activeItem={activeItem}
                updateActiveItem={updateActiveItem}
                activeCalc={activeCalc}
                papers={papers}
                offcuts={offcuts}
                inventory={inventory}
                printers={printers}
                printerColorLinks={printerColorLinks}
                onOpenPaperModal={(target) => {
                  setPaperModalTarget(target);
                  setIsPaperModalOpen(true);
                }}
                onOpenPrinterModal={() => setIsPrinterModalOpen(true)}
                onOpenColorPreview={(item) => setPreviewColorItem(item)}
                formatCurrency={formatCurrency}
                getFIFOCostPerSheet={getFIFOCostPerSheet}
                currentLang={currentLang}
                t={t}
                showToast={showToast}
              />
            )}

            {/* TAB CONTENT 3: Post-Press & Consumables */}
            {activeProductionTab === 'postpress' && (
              <QuotationPostPressTab
                activeItem={activeItem}
                updateActiveItem={updateActiveItem}
                activeCalc={activeCalc}
                postPressEquipment={postPressEquipment}
                inventory={inventory}
                onOpenPostPressModal={() => setIsPostPressModalOpen(true)}
                onOpenMaterialModal={() => setIsMaterialModalOpen(true)}
                formatCurrency={formatCurrency}
                currentLang={currentLang}
              />
            )}

            {/* FUNCTION-BY-FUNCTION DETAILED FINANCIAL BREAKDOWN (ສະຫຼຸບຕົ້ນທຶນແຕ່ລະຟັງຊັນຍ່ອຍ) */}
            {(() => {
              const activePostPressNames = (activeItem.selectedPostPressIds || [])
                .map(id => equipment.find(e => e.id === id)?.name)
                .filter(Boolean);
              const activeMatNames = (activeItem.finishingMaterials || [])
                .map(m => m.name)
                .filter(Boolean);

              return (
                <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200/90 rounded-2xl space-y-3.5 mt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                        <Calculator className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                          {currentLang === 'lo' ? `ສະຫຼຸບຕົ້ນທຶນວັດຖຸດິບ & ການພິມ #${activeItemIndex + 1} (${activeItem.name || 'ສິນຄ້າ'})` : `Raw Material & Print Cost Breakdown #${activeItemIndex + 1}`}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium block">
                          {activeItem.printVolume || 1} {activeItem.unitName || 'ຊຸດ'} • {activeItem.pagesPerBook || 1} ໜ້າ • {activeItem.jobSizePreset || 'A4'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 font-sans">
                        ຕົ້ນທຶນວັດຖຸດິບລວມ:
                      </span>
                      <span className="font-mono font-black text-indigo-700 text-sm">
                        {formatCurrency(activeCalc.netCost || 0)}
                      </span>
                    </div>
                  </div>

                  {/* 4 Direct Raw Cost Function Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                    {/* 1. Paper Function */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1 shadow-2xs">
                      <div className="flex justify-between items-center text-slate-600 font-bold">
                        <span className="flex items-center gap-1 text-sky-700">
                          <FileText className="w-3.5 h-3.5 text-sky-500" />
                          <span>1. ຕົ້ນທຶນເຈ້ຍ (Paper)</span>
                        </span>
                        <span className="font-mono font-black text-slate-900 text-xs">
                          {formatCurrency(activeCalc.paperCost || 0)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        {activeCalc.totalInnerSheets || 0} ແຜ່ນ {activeItem.includeCover ? `(ປົກ: ${formatCurrency(activeCalc.coverPaperCost || 0)})` : ''}
                      </p>
                    </div>

                    {/* 2. Unified Print Engine Function (Ink + Machine Overhead) */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1 shadow-2xs">
                      <div className="flex justify-between items-center text-slate-600 font-bold">
                        <span className="flex items-center gap-1 text-purple-700">
                          <Printer className="w-3.5 h-3.5 text-purple-500" />
                          <span>2. ຕົ້ນທຶນການພິມເຄື່ອງຈັກ (Print Engine)</span>
                        </span>
                        <span className="font-mono font-black text-slate-900 text-xs">
                          {formatCurrency((activeCalc.inkCost || 0) + (activeCalc.machineOverhead || ((activeCalc.machDepr || 0) + (activeCalc.machMaint || 0))))}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        ໝຶກ {formatCurrency(activeCalc.inkCost || 0)} + ເຄື່ອງຈັກ {formatCurrency(activeCalc.machineOverhead || ((activeCalc.machDepr || 0) + (activeCalc.machMaint || 0)))}
                      </p>
                    </div>

                    {/* 3. Post-Press Machinery Function */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1 shadow-2xs">
                      <div className="flex justify-between items-center text-slate-600 font-bold">
                        <span className="flex items-center gap-1 text-rose-700">
                          <Scissors className="w-3.5 h-3.5 text-rose-500" />
                          <span>3. ວຽກຫຼັງພິມ (Post-Press)</span>
                        </span>
                        <span className="font-mono font-black text-slate-900 text-xs">
                          {formatCurrency(activeCalc.postPressCost || 0)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        {activePostPressNames.join(', ') || 'ບໍ່ມີເຄື່ອງຫຼັງພິມ'}
                      </p>
                    </div>

                    {/* 4. Finishing Consumables Function */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1 shadow-2xs">
                      <div className="flex justify-between items-center text-slate-600 font-bold">
                        <span className="flex items-center gap-1 text-emerald-700">
                          <Package className="w-3.5 h-3.5 text-emerald-500" />
                          <span>4. ວັດຖຸດິບເສີມ (Consumables)</span>
                        </span>
                        <span className="font-mono font-black text-slate-900 text-xs">
                          {formatCurrency(activeCalc.finishingMaterialsCost || 0)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        {activeMatNames.join(', ') || 'ບໍ່ມີວັດຖຸດິບເສີມ'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Navigation Buttons: Back to Customer, Next to Summary */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setWizardStep('intake');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{currentLang === 'lo' ? 'ຍ້ອນກັບ: ຂໍ້ມູນລູກຄ້າ' : 'Back: Customer & Items'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setWizardStep('summary');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-gradient-to-r from-primary-navy to-indigo-700 hover:from-primary-navy/90 hover:to-indigo-600 text-white rounded-2xl text-xs font-black flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <span>{currentLang === 'lo' ? 'ຕໍ່ໄປ: ສະຫຼຸບຕົ້ນທຶນ & ອອກໃບສະເໜີລາຄາ' : 'Next: Summary & Quotation'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>
    )}

      {/* ========================================================================= */}
      {/* STEP 3: FINAL COMMERCIAL SUMMARY & OFFICIAL QUOTATION                      */}
      {/* ========================================================================= */}
      {wizardStep === 'summary' && (
        <div className="space-y-6 animate-fade-in print:hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ================================================================= */}
            {/* LEFT COLUMN: COMMERCIAL COST & MARGIN INPUTS (6 Cols / 50%)       */}
            {/* ================================================================= */}
            <div className="lg:col-span-6 xl:col-span-6 space-y-4">
              
              {/* Card 1: ຄ່າແຮງງານ & ຄ່າກຽມເຄື່ອງ (Labor & Machine Setup) */}
              {(() => {
                const isLaborActive = activeItem.activeModules?.laborAndSetup !== undefined
                  ? Boolean(activeItem.activeModules.laborAndSetup)
                  : ((activeItem.laborPercent ?? 0) > 0 || (activeItem.laborMode === 'manual' && Number(activeItem.laborCostManual || 0) > 0));

                return (
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                            {currentLang === 'lo' ? 'ຄ່າແຮງງານ & ຄ່າກຽມເຄື່ອງ' : 'Labor & Machine Setup'}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {currentLang === 'lo' ? 'ກຳນົດຄ່າແຮງງານຊ່າງ ແລະ ຄ່າຕັ້ງເຄື່ອງຈັກ' : 'Configure labor rates and machine setup fees.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Toggle Switch */}
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-bold ${isLaborActive ? 'text-blue-900' : 'text-slate-400'}`}>
                            {isLaborActive ? (currentLang === 'lo' ? 'ເປີດໃຊ້' : 'ON') : (currentLang === 'lo' ? 'ປິດ' : 'OFF')}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isLaborActive}
                            onClick={() => {
                              const nextState = !isLaborActive;
                              updateActiveItem({
                                activeModules: {
                                  ...(activeItem.activeModules || DEFAULT_MODULE_TOGGLES),
                                  laborAndSetup: nextState
                                },
                                laborPercent: nextState ? (activeItem.laborPercent || 10) : 0
                              });
                            }}
                            className={`w-10 h-5.5 rounded-full transition-colors relative p-0.5 focus:outline-none cursor-pointer shadow-inner ${
                              isLaborActive ? 'bg-blue-600' : 'bg-slate-300'
                            }`}
                          >
                            <div
                              className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center ${
                                isLaborActive ? 'translate-x-4.5' : 'translate-x-0'
                              }`}
                            >
                              {isLaborActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                            </div>
                          </button>
                        </div>

                        {/* Mode switcher: % vs Manual */}
                        <div className={`flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 gap-1 text-[10px] font-bold shadow-2xs ${!isLaborActive ? 'opacity-50 pointer-events-none' : ''}`}>
                          <button
                            type="button"
                            onClick={() => updateActiveItem({ 
                              laborMode: 'percent',
                              activeModules: { ...(activeItem.activeModules || DEFAULT_MODULE_TOGGLES), laborAndSetup: true }
                            })}
                            className={`px-2 py-1 rounded-md transition cursor-pointer ${
                              (activeItem.laborMode || 'percent') === 'percent'
                                ? 'bg-blue-600 text-white shadow-xs font-black'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            % ຕົ້ນທຶນ
                          </button>
                          <button
                            type="button"
                            onClick={() => updateActiveItem({ 
                              laborMode: 'manual',
                              activeModules: { ...(activeItem.activeModules || DEFAULT_MODULE_TOGGLES), laborAndSetup: true }
                            })}
                            className={`px-2 py-1 rounded-md transition cursor-pointer ${
                              (activeItem.laborMode || 'percent') === 'manual'
                                ? 'bg-blue-600 text-white shadow-xs font-black'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            ກຳນົດ LAK
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Labor Input */}
                    {!isLaborActive ? (
                      <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                        {currentLang === 'lo' ? 'ປິດການຄິດໄລ່ຄ່າແຮງງານ (ຕົ້ນທຶນຄ່າແຮງງານ = 0 LAK)' : 'Labor cost calculation is OFF (0 LAK)'}
                      </div>
                    ) : (activeItem.laborMode || 'percent') === 'percent' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-bold">ອັດຕາຄ່າແຮງງານ (% ຂອງວັດສະດຸ/ເຄື່ອງຈັກ):</span>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-700 font-black font-mono text-[11px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              + {formatCurrency(activeCalc.laborCost || 0)}
                            </span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={activeItem.laborPercent !== undefined ? activeItem.laborPercent : 0}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value));
                                  updateActiveItem({ 
                                    laborPercent: val,
                                    activeModules: { ...(activeItem.activeModules || DEFAULT_MODULE_TOGGLES), laborAndSetup: true }
                                  });
                                }}
                                className="w-16 px-2 py-1 bg-white border border-blue-300 rounded-lg text-right font-black font-sans text-blue-950 text-xs shadow-2xs focus:outline-none focus:border-blue-500"
                              />
                              <span className="font-bold text-blue-900">%</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: '0% (ບໍ່ຄິດ)', val: 0 },
                            { label: '5% (ເບົາໆ)', val: 5 },
                            { label: '10% (ມາດຕະຖານ)', val: 10 },
                            { label: '15%', val: 15 },
                            { label: '20% (ງານລະອຽດ)', val: 20 },
                            { label: '25% (ພຣີມຽມ)', val: 25 },
                          ].map((chip) => (
                            <button
                              key={chip.val}
                              type="button"
                              onClick={() => updateActiveItem({ 
                                laborPercent: chip.val,
                                activeModules: { ...(activeItem.activeModules || DEFAULT_MODULE_TOGGLES), laborAndSetup: true }
                              })}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                (activeItem.laborPercent ?? 0) === chip.val
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-white text-blue-900 border border-blue-200 hover:bg-blue-100'
                              }`}
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-bold">ກຳນົດຄ່າແຮງງານເອງ (LAK):</span>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-700 font-black font-mono text-[11px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              + {formatCurrency(activeCalc.laborCost || 0)}
                            </span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="1000"
                                min="0"
                                value={activeItem.laborCostManual || 50000}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value));
                                  updateActiveItem({ 
                                    laborCostManual: val,
                                    activeModules: { ...(activeItem.activeModules || DEFAULT_MODULE_TOGGLES), laborAndSetup: true }
                                  });
                                }}
                                className="w-28 px-2 py-1 bg-white border border-blue-300 rounded-lg text-right font-black font-mono text-blue-950 text-xs shadow-2xs focus:outline-none focus:border-blue-500"
                              />
                              <span className="font-bold text-blue-900">₭</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[10000, 25000, 50000, 100000, 200000].map((cash) => (
                            <button
                              key={cash}
                              type="button"
                              onClick={() => updateActiveItem({ 
                                laborCostManual: cash,
                                activeModules: { ...(activeItem.activeModules || DEFAULT_MODULE_TOGGLES), laborAndSetup: true }
                              })}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                (activeItem.laborCostManual || 50000) === cash
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {cash.toLocaleString()} ₭
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                {/* Setup fee */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-bold flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ຄ່າກຽມເຄື່ອງ & ຕັ້ງງານ (Setup Fee):</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="1000"
                        min="0"
                        value={quotationSetupFee}
                        onChange={(e) => setQuotationSetupFee(Math.max(0, Number(e.target.value)))}
                        className="w-28 px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-mono font-bold text-xs"
                      />
                      <span className="font-bold text-slate-600">₭</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[0, 10000, 20000, 50000, 100000].map((fee) => (
                      <button
                        key={fee}
                        type="button"
                        onClick={() => setQuotationSetupFee(fee)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                          quotationSetupFee === fee
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {fee === 0 ? 'ບໍ່ຄິດ' : `${fee.toLocaleString()} ₭`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

              {/* Card 2: ກ່ອງບັນຈຸພັນ & ຂົນສົ່ງ (Packaging & Logistics) */}
              {(() => {
                const totalPkgShipping = (quotationPackagingCost || 0) + (Number(shippingFee) || 0);
                const isCardActive = isPackagingEnabled || totalPkgShipping > 0 || selectedPackagingPreset !== 'none';

                return (
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                            {currentLang === 'lo' ? 'ກ່ອງບັນຈຸພັນ & ຂົນສົ່ງ' : 'Packaging & Shipping'}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {currentLang === 'lo' ? 'ເລືອກຮູບແບບບັນຈຸພັນ, ຄ່າກ່ອງ ແລະ ຄ່າຈັດສົ່ງເຖິງລູກຄ້າ' : 'Select packaging presets, custom boxes and courier fee.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isCardActive && totalPkgShipping > 0 && (
                          <span className="text-[11px] font-mono font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                            + LAK {formatCurrency(totalPkgShipping)}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${isCardActive ? 'text-slate-900' : 'text-slate-400'}`}>
                            {isCardActive ? (currentLang === 'lo' ? 'ເປີດໃຊ້' : 'ON') : (currentLang === 'lo' ? 'ປິດ' : 'OFF')}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isCardActive}
                            onClick={() => {
                              if (isCardActive) {
                                setIsPackagingEnabled(false);
                                setQuotationPackagingCost(0);
                                setShippingFee(0);
                                setSelectedPackagingPreset('none');
                              } else {
                                setIsPackagingEnabled(true);
                              }
                            }}
                            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none cursor-pointer shadow-inner ${
                              isCardActive ? 'bg-amber-600' : 'bg-slate-300'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center ${
                                isCardActive ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            >
                              {isCardActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />}
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                    {!isCardActive ? (
                      <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-medium">
                        {currentLang === 'lo' ? '-- ປິດໃຊ້ງານ (ບໍ່ຄິດຄ່າບັນຈຸພັນ ແລະ ຄ່າຈັດສົ່ງ) --' : '-- Disabled (No packaging & courier fee) --'}
                      </div>
                    ) : (
                      <div className="space-y-3.5 animate-fade-in text-xs">
                        {/* Packaging Presets */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500 block">
                            {currentLang === 'lo' ? 'ເລືອກຮູບແບບບັນຈຸພັນອັດຕະໂນມັດ (Packaging Preset):' : 'Select Packaging Preset:'}
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { id: 'box_card', label: 'ກ່ອງນາມບັດອະຄຣິລິກ', desc: '3,500 LAK / 100 ໃບ', costCalc: (qty: number) => Math.ceil(Math.max(1, qty) / 100) * 3500 },
                              { id: 'kraft_wrap', label: 'ຫໍ່ເຈ້ຍຄຣາບ / ຊອງ', desc: '2,000 LAK / 500 ແຜ່ນ', costCalc: (qty: number) => Math.ceil(Math.max(1, qty) / 500) * 2000 },
                              { id: 'box_corrugated', label: 'ກ່ອງລັງລູກຟູກ', desc: '8,000 LAK / 1,000 ແຜ່ນ', costCalc: (qty: number) => Math.ceil(Math.max(1, qty) / 1000) * 8000 },
                              { id: 'bubble_wrap', label: 'ບັບເບີ້ນກັນກະແທກ', desc: '5,000 LAK / ມ້ວນ', costCalc: () => 5000 },
                            ].map(pkg => {
                              const isSelected = selectedPackagingPreset === pkg.id;
                              const totalVol = grandTotalUnits > 0 ? grandTotalUnits : Math.max(1, activeItem.printVolume);
                              const calculatedCost = pkg.costCalc(totalVol);

                              return (
                                <button
                                  key={pkg.id}
                                  type="button"
                                  onClick={() => {
                                    setIsPackagingEnabled(true);
                                    if (isSelected) {
                                      setSelectedPackagingPreset('none');
                                      setQuotationPackagingCost(0);
                                    } else {
                                      setSelectedPackagingPreset(pkg.id);
                                      setQuotationPackagingCost(calculatedCost);
                                    }
                                  }}
                                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                    isSelected 
                                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs' 
                                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
                                  }`}
                                >
                                  <div>
                                    <span className="font-bold text-[11px] block">{pkg.label}</span>
                                    <span className={`text-[9px] block mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>{pkg.desc}</span>
                                  </div>
                                  <div className="mt-1.5 pt-1 border-t border-slate-200/40 flex justify-between items-center font-mono">
                                    <span className="text-[9px]">ລວມ:</span>
                                    <span className="font-bold text-[11px]">+{formatCurrency(calculatedCost)}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Manual Cost Inputs Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                            <div className="flex justify-between items-center text-slate-700 font-bold text-xs">
                              <span>ຄ່າກ່ອງ / ວັດສະດຸຫຸ້ມຫໍ່:</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="1000"
                                  value={quotationPackagingCost}
                                  onChange={(e) => {
                                    setIsPackagingEnabled(true);
                                    setQuotationPackagingCost(Math.max(0, Number(e.target.value)));
                                  }}
                                  className="w-28 px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-mono font-bold text-xs"
                                />
                                <span className="font-bold text-slate-600">₭</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {[0, 5000, 10000, 25000, 50000].map((cost) => (
                                <button
                                  key={cost}
                                  type="button"
                                  onClick={() => {
                                    setIsPackagingEnabled(true);
                                    setQuotationPackagingCost(cost);
                                    setSelectedPackagingPreset('none');
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                    quotationPackagingCost === cost && selectedPackagingPreset === 'none'
                                      ? 'bg-amber-600 text-white shadow-2xs'
                                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {cost === 0 ? 'ບໍ່ຄິດ' : `${cost.toLocaleString()} ₭`}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                            <div className="flex justify-between items-center text-slate-700 font-bold text-xs">
                              <span className="flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 text-slate-500" />
                                <span>ຄ່າຈັດສົ່ງ (Courier Fee):</span>
                              </span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="5000"
                                  value={shippingFee}
                                  onChange={(e) => {
                                    setIsPackagingEnabled(true);
                                    setShippingFee(Math.max(0, Number(e.target.value)));
                                  }}
                                  className="w-28 px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-mono font-bold text-xs"
                                />
                                <span className="font-bold text-slate-600">₭</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {[0, 10000, 20000, 35000, 50000].map((fee) => (
                                <button
                                  key={fee}
                                  type="button"
                                  onClick={() => {
                                    setIsPackagingEnabled(true);
                                    setShippingFee(fee);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                    shippingFee === fee
                                      ? 'bg-amber-600 text-white shadow-2xs'
                                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {fee === 0 ? 'ຟຣີສົ່ງ' : `${fee.toLocaleString()} ₭`}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Card 3: ອັດຕາກຳໄລ & ສ່ວນຫຼຸດ (Profit Margin & Discount) */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        {currentLang === 'lo' ? 'ອັດຕາກຳໄລ & ສ່ວນຫຼຸດ' : 'Profit Margin & Discount'}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {currentLang === 'lo' ? 'ປັບອັດຕາກຳໄລລວມ ແລະ ສ່ວນຫຼຸດພິເສດສຳລັບລູກຄ້າ' : 'Set overall target margin and customer discount.'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-xl font-sans ${
                    quotationProfitMargin >= 35 ? 'bg-emerald-100 text-emerald-800' : quotationProfitMargin >= 25 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {quotationProfitMargin}% Margin
                  </span>
                </div>

                {/* Profit Margin slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-bold">ອັດຕາກຳໄລລວມ (Target Profit Margin):</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="90"
                        value={quotationProfitMargin}
                        onChange={(e) => setQuotationProfitMargin(Math.max(0, Math.min(95, Number(e.target.value))))}
                        className="w-16 px-2 py-1 bg-white border border-emerald-300 rounded-lg text-right font-black font-sans text-emerald-950 text-xs shadow-2xs focus:outline-none focus:border-emerald-500"
                      />
                      <span className="font-bold text-emerald-900">%</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="1"
                    value={quotationProfitMargin}
                    onChange={(e) => setQuotationProfitMargin(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />

                  <div className="flex flex-wrap gap-1.5">
                    {[20, 30, 40, 50, 60].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setQuotationProfitMargin(m)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          quotationProfitMargin === m
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-emerald-50'
                        }`}
                      >
                        {m}%
                      </button>
                    ))}
                  </div>

                  {quotationProfitMargin < 25 && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-[11px]">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>ອັດຕາກຳໄລຕ່ຳກວ່າ 25% ຕ້ອງໄດ້ຮັບການອະນຸມັດພິເສດຈາກຫົວໜ້າ</span>
                    </div>
                  )}
                </div>

                {/* Discount */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-bold flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-amber-500" />
                      <span>ສ່ວນຫຼຸດລູກຄ້າລວມ (Discount):</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={quotationDiscountPercent}
                        onChange={(e) => setQuotationDiscountPercent(Math.max(0, Math.min(50, Number(e.target.value))))}
                        className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-black font-sans text-slate-800 text-xs shadow-2xs focus:outline-none focus:border-amber-500"
                      />
                      <span className="font-bold text-slate-600">%</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[0, 5, 10, 15, 20].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setQuotationDiscountPercent(d)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          quotationDiscountPercent === d
                            ? 'bg-amber-500 text-white shadow-xs font-black'
                            : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 4: ພາສີມູນຄ່າເພີ່ມ (Tax / VAT) */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    {currentLang === 'lo' ? 'ພາສີມູນຄ່າເພີ່ມ (VAT / Tax)' : 'Value Added Tax (VAT)'}
                  </span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 gap-1 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setTaxEnabled(false)}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        !taxEnabled
                          ? 'bg-primary-navy text-white font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ບໍ່ຄິດ (0%)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTaxEnabled(true);
                        setTaxMode('percent');
                      }}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        taxEnabled && taxMode === 'percent'
                          ? 'bg-primary-navy text-white font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ຄິດ % VAT
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTaxEnabled(true);
                        setTaxMode('override');
                      }}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        taxEnabled && taxMode === 'override'
                          ? 'bg-primary-navy text-white font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ກຳນົດເອງ LAK
                    </button>
                  </div>
                </div>

                {taxEnabled && taxMode === 'percent' && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-600 font-bold">ອັດຕາພາສີ (Tax Rate %):</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value)))}
                        className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-black font-sans text-xs"
                      />
                      <span className="font-bold text-slate-600">%</span>
                    </div>
                  </div>
                )}

                {taxEnabled && taxMode === 'override' && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-600 font-bold">ຍອດພາສີກຳນົດເອງ (LAK):</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={taxOverrideAmount}
                        onChange={(e) => setTaxOverrideAmount(Math.max(0, Number(e.target.value)))}
                        className="w-28 px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-mono font-bold text-xs"
                      />
                      <span className="font-bold text-slate-600">₭</span>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* ================================================================= */}
            {/* RIGHT COLUMN: GRAND COST BREAKDOWN, CURRENCY & ACTIONS (6 Cols)   */}
            {/* ================================================================= */}
            <div className="lg:col-span-6 xl:col-span-6 space-y-4">
              
              {/* Currency Selector Bar at Top of Right Column */}
              <div className="bg-white p-3.5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>{currentLang === 'lo' ? 'ເລືອກສະກຸນເງິນໃບສະເໜີ:' : 'Quotation Currency:'}</span>
                </span>
                
                <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl">
                  {['LAK', 'THB', 'USD'].map(code => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setCurrency(code)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                        currency === code
                          ? 'bg-primary-navy text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {code === 'LAK' ? '₭' : code === 'THB' ? '฿' : '$'} {code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grand Total Hero Card */}
              <div className="bg-gradient-to-br from-primary-navy to-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-md">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-amber-400" />
                    <span>ລາຄາຂາຍລວມທັງໝົດ (Grand Total):</span>
                  </span>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                    grandProfitMargin >= 25 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/30 text-rose-300'
                  }`}>
                    + {formatCurrency(grandNetProfit)} ({grandProfitMargin.toFixed(1)}%)
                  </span>
                </div>

                <div className="text-3xl sm:text-4xl font-black font-sans text-white tracking-tight">
                  {formatCurrency(finalGrandTotal)}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs font-sans">
                  <div>
                    <span className="text-slate-400 block text-[11px]">ຕົ້ນທຶນລວມ (Net Cost):</span>
                    <span className="font-bold text-slate-100 text-sm">{formatCurrency(grandNetCost)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">ກຳໄລສຸດທິ (Net Profit):</span>
                    <span className="font-bold text-emerald-400 text-sm">{formatCurrency(grandNetProfit)}</span>
                  </div>
                </div>

                {/* Cost Composition Multi-Segment Bar */}
                {(() => {
                  const rawPaper = Math.max(0, grandPaperCost || 0);
                  const rawInk = Math.max(0, grandInkCost || 0);
                  const rawMach = Math.max(0, grandMachCost || 0);
                  const rawPostPress = Math.max(0, grandPostPressCost || 0);
                  const rawFinishing = Math.max(0, grandFinishingCost || 0);
                  const rawLabor = Math.max(0, grandLaborCost || 0);
                  const rawPkgSetup = Math.max(0, (grandPackagingCost || 0) + (quotationSetupFee || 0));
                  const rawProfit = Math.max(0, grandNetProfit || 0);

                  const totalVal = rawPaper + rawInk + rawMach + rawPostPress + rawFinishing + rawLabor + rawPkgSetup + rawProfit;
                  if (totalVal <= 0) return null;

                  return (
                    <div className="space-y-1.5 pt-1">
                      <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden flex">
                        {rawPaper > 0 && <div style={{ width: `${(rawPaper / totalVal) * 100}%` }} className="bg-sky-400 h-full" title="Paper" />}
                        {rawInk > 0 && <div style={{ width: `${(rawInk / totalVal) * 100}%` }} className="bg-purple-400 h-full" title="Ink" />}
                        {rawMach > 0 && <div style={{ width: `${(rawMach / totalVal) * 100}%` }} className="bg-amber-400 h-full" title="Machine" />}
                        {rawPostPress > 0 && <div style={{ width: `${(rawPostPress / totalVal) * 100}%` }} className="bg-rose-400 h-full" title="Post-press" />}
                        {rawFinishing > 0 && <div style={{ width: `${(rawFinishing / totalVal) * 100}%` }} className="bg-emerald-400 h-full" title="Finishing" />}
                        {rawLabor > 0 && <div style={{ width: `${(rawLabor / totalVal) * 100}%` }} className="bg-blue-400 h-full" title="Labor" />}
                        {rawProfit > 0 && <div style={{ width: `${(rawProfit / totalVal) * 100}%` }} className="bg-emerald-300 h-full" title="Profit" />}
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{items.length} ລາຍການສິນຄ້າ</span>
                        <span>{grandTotalUnits.toLocaleString()} ໜ່ວຍລວມ</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 8-Category Cost Breakdown */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-primary-navy" />
                    <span>{currentLang === 'lo' ? 'ລາຍລະອຽດຕົ້ນທຶນ 7 ໝວດ' : '7-Category Cost Breakdown'}</span>
                  </h4>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {formatCurrency(grandNetCost)}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { label: '1. ເຈ້ຍ (Paper)', val: grandPaperCost, dot: 'bg-sky-500' },
                    { label: '2. ຕົ້ນທຶນການພິມ & ໝຶກ (Print & Ink Cost)', val: grandInkCost + grandMachCost, dot: 'bg-purple-500' },
                    { label: '3. ງານຫຼັງພິມ (Post-Press Machinery)', val: grandPostPressCost, dot: 'bg-rose-500' },
                    { label: '4. ວັດຖຸດິບເສີມ (Finishing Supplies)', val: grandFinishingCost, dot: 'bg-emerald-500' },
                    { label: '5. ຄ່າແຮງງານຊ່າງ (Labor Cost)', val: grandLaborCost, dot: 'bg-blue-500' },
                    { label: '6. ຄ່າກຽມເຄື່ອງ (Machine Setup)', val: quotationSetupFee, dot: 'bg-indigo-500' },
                    { label: '7. ກ່ອງ & ຂົນສົ່ງ (Packaging & Logistics)', val: grandPackagingCost + shippingFee, dot: 'bg-slate-500' },
                  ].map((row, rIdx) => (
                    <div key={rIdx} className="flex justify-between items-center py-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${row.dot}`} />
                        <span className="text-slate-700 font-medium">{row.label}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800">{formatCurrency(row.val)}</span>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Final Summary strip */}
                <div className="pt-3 border-t border-slate-200/80 space-y-1.5 text-xs bg-slate-50/80 p-3 rounded-2xl">
                  <div className="flex justify-between text-slate-600">
                    <span>ລາຄາຂາຍກ່ອນຫຼຸດ:</span>
                    <span className="font-mono font-bold">{formatCurrency(grandBaseSellingPrice)}</span>
                  </div>
                  {grandDiscountAmount > 0 && (
                    <div className="flex justify-between text-amber-600 font-semibold">
                      <span>ສ່ວນຫຼຸດ ({quotationDiscountPercent}%):</span>
                      <span className="font-mono font-bold">- {formatCurrency(grandDiscountAmount)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>ພາສີ ({taxRate}%):</span>
                      <span className="font-mono font-bold">+ {formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-900 font-black border-t border-slate-200 pt-2 text-sm">
                    <span>ຍອດລວມສຸດທິ:</span>
                    <span className="font-mono text-emerald-700 font-black">{formatCurrency(finalGrandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Save + Confirm */}
              <div className="space-y-2.5 pt-1">
                {/* Primary Button: Confirm Order */}
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm transition shadow-md shadow-emerald-600/20 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{currentLang === 'lo' ? 'ຢືນຢັນສັ່ງຜະລິດ (Confirm Order)' : 'Confirm Order'}</span>
                </button>

                {/* Secondary Button: Save Quotation */}
                <button
                  type="button"
                  onClick={handleSaveQuotation}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 border border-slate-200"
                >
                  <Save className="w-4 h-4 text-slate-600" />
                  <span>{currentLang === 'lo' ? 'ບັນທຶກໃບສະເໜີລາຄາ (Save Quotation)' : 'Save Quotation'}</span>
                </button>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => {
                    setWizardStep('specs');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full py-2 text-slate-400 hover:text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{currentLang === 'lo' ? 'ຍ້ອນກັບ: ກຳນົດສະເປັກ' : 'Back to Specs'}</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ARTWORK PREFLIGHT & COLOR PREVIEW MODAL */}
      <ArtworkColorPreviewModal
        isOpen={!!previewColorItem}
        onClose={() => setPreviewColorItem(null)}
        item={previewColorItem}
        items={items}
        onItemSelect={(idx) => {
          setActiveItemIndex(idx);
          setPreviewColorItem(items[idx]);
        }}
        onSyncColorsToPrinter={handleSyncColorsToActivePrinter}
        onUpdateArtwork={(data) => {
          const updates: any = {
            artworkUrl: data.artworkUrl,
            fileName: data.fileName,
            mimeType: data.mimeType,
            fileSize: data.fileSize,
          };
          if (data.batchFiles) updates.batchFiles = data.batchFiles;
          if (data.coverArtworkUrl) updates.coverArtworkUrl = data.coverArtworkUrl;
          if (data.coverFileName) updates.coverFileName = data.coverFileName;

          updateActiveItem(updates);
          if (previewColorItem) {
            setPreviewColorItem({
              ...previewColorItem,
              ...updates,
            });
          }
          if (showToast) showToast('ອັບໂຫຼດໄຟລ໌ອາດເວິກສຳເລັດ!', 'success');
        }}
        currentLang={currentLang}
      />

      {/* CUSTOM FAST PRESET MODAL */}
      {isSavePresetModalOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-md space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  {currentLang === 'lo' ? 'ບັນທຶກສະເປກເປັນແມ່ແບບດ່ວນ 1-Click' : 'Save as 1-Click Fast Preset'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsSavePresetModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {currentLang === 'lo' ? 'ຊື່ແມ່ແບບດ່ວນ (Preset Name):' : 'Preset Name:'}
                </label>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="ຕົວຢ່າງ: ພິມຮູບ 4x6 A4, ປຶ້ມສັນຫ່ວງ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {currentLang === 'lo' ? 'ເລືອກໄອຄອນ (Select Icon):' : 'Select Icon:'}
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { id: 'Sparkles', icon: Sparkles },
                    { id: 'Book', icon: BookOpen },
                    { id: 'Bookmark', icon: Bookmark },
                    { id: 'ImageIcon', icon: ImageIcon },
                    { id: 'Layers', icon: Layers },
                    { id: 'Calendar', icon: Calendar },
                  ].map((ic) => {
                    const IconComp = ic.icon;
                    const isCur = newPresetIcon === ic.id;
                    return (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => setNewPresetIcon(ic.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                          isCur
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">ລາຍລະອຽດສະເປກທີ່ຈະບັນທຶກ:</span>
                <p className="truncate">• ຂະໜາດ: {activeItem.jobSizePreset || 'A4'} ({activeItem.jobWidth}×{activeItem.jobHeight} mm)</p>
                <p className="truncate">• ເຈ້ຍ: {activeItem.paperId || 'Default'}</p>
                <p className="truncate">• ໂໝດສີ: {activeItem.colorPrintMode} • ຈຳນວນ: {activeItem.printVolume} ໜ່ວຍ</p>
                <p className="text-emerald-700 font-bold">• ເປີດທຸກໂມດູນຄິດໄລ່ໄວ້ພ້ອມໃຊ້ງານ</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSavePresetModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveCurrentAsPreset}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer"
              >
                {currentLang === 'lo' ? 'ບັນທຶກແມ່ແບບ' : 'Save Preset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER CATEGORY MANAGEMENT MODAL */}
      <CustomerCategoryModal
        isOpen={isCustomerCategoryModalOpen}
        onClose={() => setIsCustomerCategoryModalOpen(false)}
      />

      {/* QUOTATION HISTORY & SAVED TEMPLATES MODAL */}
      <QuotationHistoryModal
        isOpen={isQuotationListOpen}
        onClose={() => setIsQuotationListOpen(false)}
        quotations={quotations}
        onLoad={handleLoadQuotation}
        onRevise={handleReviseQuotation}
        onDelete={handleDeleteQuotation}
        onConvertToOrder={handleConvertToOrder}
        onOpenApproval={setApprovalModalQuote}
        onSaveDraft={handleSaveDraft}
        currentLang={currentLang}
        formatCurrency={formatCurrency}
      />

      {/* FULL PRICING TEMPLATES MANAGER MODAL */}
      <PricingTemplatesModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        allTemplates={allAvailableTemplates}
        customTemplates={customTemplates}
        selectedTemplateId={activeItem.selectedTemplateId}
        onApplyTemplate={handleApplyTemplate}
        onDeleteCustomTemplate={handleDeleteCustomTemplate}
        onOpenSaveNewModal={() => setIsNewTemplateModalOpen(true)}
        currentLang={currentLang}
      />

      {/* MANAGER APPROVAL MODAL */}
      <QuotationMarginApprovalModal
        quote={approvalModalQuote}
        isOpen={!!approvalModalQuote}
        isProcessing={isProcessingApproval}
        approvalReason={approvalReason}
        currentLang={currentLang}
        formatCurrency={formatCurrency}
        onReasonChange={setApprovalReason}
        onApprove={handleApproveDiscount}
        onReject={handleRejectDiscount}
        onClose={() => { setApprovalModalQuote(null); setApprovalReason(''); }}
      />

      {/* SAVE QUOTATION & PRICING SCHEME POPUP MODAL */}
      <QuotationSaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onConfirm={handleConfirmSaveQuotation}
        quotationTitle={quotationTitle}
        onTitleChange={setQuotationTitle}
        selectedCustomerId={selectedCustomerId}
        itemsCount={items.length}
        finalGrandTotal={finalGrandTotal}
        isTemplateOption={isTemplateOption}
        onTemplateOptionChange={setIsTemplateOption}
        templateCategory={templateCategory}
        onCategoryChange={setTemplateCategory}
        currentLang={currentLang}
        formatCurrency={formatCurrency}
      />

      {/* DIGITAL CUSTOMER SHAREABLE QUOTATION MODAL */}
      <QuotationShareModal
        isOpen={isShareModalOpen}
        onClose={() => { setIsShareModalOpen(false); setIsCopiedLink(false); }}
        quotationTitle={quotationTitle}
        selectedCustomerId={selectedCustomerId}
        itemsLength={items.length}
        grandTotalUnits={grandTotalUnits}
        finalGrandTotal={finalGrandTotal}
        isCopiedLink={isCopiedLink}
        onCopyLink={() => {
          const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/quote/view?ref=${encodeURIComponent(selectedCustomerId || 'customer')}&total=${finalGrandTotal}`;
          navigator.clipboard.writeText(link);
          setIsCopiedLink(true);
          if (showToast) showToast('ຄັດລອກລິ້ງໃບສະເໜີລາຄາຮຽບຮ້ອຍ!', 'success');
          setTimeout(() => setIsCopiedLink(false), 3000);
        }}
        currentLang={currentLang}
        formatCurrency={formatCurrency}
      />

      {/* SAVE AS NEW PRICING TEMPLATE MODAL */}
      <QuotationSaveTemplateModal
        isOpen={isNewTemplateModalOpen}
        onClose={() => setIsNewTemplateModalOpen(false)}
        onSave={handleSaveCustomTemplate}
        templateForm={newTemplateForm}
        onFormChange={setNewTemplateForm}
        activeItem={activeItem}
        currentLang={currentLang}
      />

      {/* PREFLIGHT ITEM CREATION MODAL */}
      <PreflightItemCreationModal
        isOpen={isPreflightModalOpen}
        onClose={() => setIsPreflightModalOpen(false)}
        onConfirm={handleConfirmPreflightItem}
        onSkip={handleSkipPreflightItem}
        currentLang={currentLang}
      />

      {/* PAPER SUBSTRATE INVENTORY SEARCH MODAL */}
      <PaperMaterialSelectorModal
        isOpen={isPaperModalOpen}
        onClose={() => setIsPaperModalOpen(false)}
        onSelect={handleSelectPaperFromModal}
        selectedPaperId={paperModalTarget === 'cover' ? activeItem.coverPaperId : activeItem.paperId}
        papers={papers}
        title={paperModalTarget === 'cover' ? 'ເລືອກເຈ້ຍໜ້າປົກຈາກຄັງ (Select Book Cover Paper)' : 'ເລືອກເຈ້ຍເນື້ອໃນຈາກຄັງ (Select Inner Pages Paper)'}
        targetType={paperModalTarget === 'cover' ? 'cover' : 'inner'}
        formatCurrency={formatCurrency}
        getFIFOCostPerSheet={getFIFOCostPerSheet}
      />

      {/* PRINTER FLEET SEARCH MODAL */}
      <PrinterSelectorModal
        isOpen={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
        onSelect={handleSelectPrinterFromModal}
        selectedPrinterId={activeItem.selectedPrinterId}
        printers={printers}
        formatCurrency={formatCurrency}
        getPrinterMachineRate={getPrinterMachineRate}
        getPrinterActualInkCostPerPage={getPrinterActualInkCostPerPage}
      />

      {/* POST-PRESS MACHINERY SEARCH MODAL */}
      <PostPressSelectorModal
        isOpen={isPostPressModalOpen}
        onClose={() => setIsPostPressModalOpen(false)}
        onSelect={handleTogglePostPressFromModal}
        selectedEquipmentIds={activeItem.selectedPostPressIds || []}
        equipmentList={postPressEquipment}
        formatCurrency={formatCurrency}
      />

      {/* FINISHING MATERIALS & CONSUMABLES INVENTORY SEARCH MODAL */}
      <MaterialInventorySearchModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSelect={handleSelectMaterialFromModal}
        inventory={inventory}
        formatCurrency={formatCurrency}
      />

      {/* PRINT-ONLY CSS HELPER TO ISOLATE PREVIEW DOCUMENT */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:col-span-3, .print\\:col-span-3 * {
            visibility: visible;
          }
          .print\\:col-span-3 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

    </div>
  );
}
