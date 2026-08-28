import React, { useState, useEffect } from 'react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';
import CustomerCombobox from '@components/common/CustomerCombobox';
import ItemSpecConfigurator from '@features/orders/components/ItemSpecConfigurator';
import ManualPrinterAllocator from '@features/orders/components/ManualPrinterAllocator';
import { PrinterAllocation } from '@features/orders/types';
import { calculateMachineUnitCost } from '@utils/machineCostCalculator';
import { QuotationCustomerView } from './QuotationCustomerView';
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
import { 
  FinishingMaterialItem, 
  PricingTemplatePreset, 
  DEFAULT_PRICING_TEMPLATES 
} from '../data/defaultTemplates';

export type { FinishingMaterialItem, PricingTemplatePreset };
export { DEFAULT_PRICING_TEMPLATES };
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
  Edit3
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
  spoilagePercent?: number;
  fileName?: string;
}

export default function QuotationManager({ onConvertToOrder, onBack, prefilledSpecs }: any) {
  const { 
    inventory, 
    equipment, 
    getFIFOCostPerSheet, 
    checkCreditLimit, 
    customers, 
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
    printerColorLinks
  } = useApp();
  
  const [quotationSearchQuery, setQuotationSearchQuery] = useState('');
  
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const papers = inventory.filter(item => {
    const cat = (item.category || '').toLowerCase();
    return cat === 'paper' || cat === 'material' || (item.specs?.paperFormat || item.paperFormat);
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
    if (!p) return 43;
    const prnPrice = Number(p.purchasePrice || p.purchaseCost || p.price || p.MachinePrice || 0);
    const maintRate = Number(p.maintenanceRatePercent || p.maintenance_rate_percent || 20);
    const lifePages = Number(p.expectedLifeA4Pages || p.printedPagesCapacity || p.TargetTotalPages || 3000000);
    const machineCalc = calculateMachineUnitCost({
      purchase_price_lak: prnPrice,
      expected_life_pages: lifePages,
      maintenance_rate_percent: maintRate
    });
    const deprRate = machineCalc.totalMachineCost > 0 ? Math.round(machineCalc.totalMachineCost) : Number(p.calculatedCostPerPage || p.costPerPage || 3);
    return deprRate + 40; // Depr + 40 LAK Electricity per page
  };

  const getPrinterActualInkCostPerPage = (p: any) => {
    if (!p) return 0;
    const activePrnLinks = printerColorLinks.filter((l: any) => l.assetId === p.id);
    const oemSlots = (p.printerColorLinks && p.printerColorLinks.length > 0)
      ? p.printerColorLinks
      : (p.oemBaselineInks && p.oemBaselineInks.length > 0)
        ? p.oemBaselineInks
        : (p.specs?.printerColorLinks && p.specs?.printerColorLinks.length > 0)
          ? p.specs.printerColorLinks
          : (p.specs?.oemBaselineInks && p.specs?.oemBaselineInks.length > 0)
            ? p.specs.oemBaselineInks
            : [];

    if (oemSlots.length === 0) {
      return Number(p.inkCostPerPage || p.calculatedCostPerPage || 0);
    }

    let totalInkCost = 0;
    oemSlots.forEach((slot: any) => {
      const oemVol = Number(slot.oemStandardVolumeMl || 70);
      const oemYield = Number(slot.oemStandardIsoYieldA4 || 6000);
      const isoRate = oemYield > 0 ? (oemVol / oemYield) : 0.012;

      const activeLink = activePrnLinks.find((l: any) => 
        l.slotPosition === slot.slotPosition || 
        l.colorGroup === slot.colorGroup || 
        (slot.colorGroup && l.colorGroup && l.colorGroup.toLowerCase() === slot.colorGroup.toLowerCase())
      );
      const linkedInkItem = activeLink ? inventory.find(i => i.id === activeLink.inkCode || i.skuCode === activeLink.inkCode || i.sku === activeLink.inkCode) : null;

      let actualCostPerPage = 0;
      if (linkedInkItem) {
        const actualPrice = Number(linkedInkItem.unitPrice || linkedInkItem.costPerPurchaseUnit || 0);
        const resolvedVol = Number(
          linkedInkItem.volume || 
          linkedInkItem.specs?.volume || 
          linkedInkItem.specs?.volume_ml || 
          linkedInkItem.specs?.oemStandardVolumeMl || 
          linkedInkItem.specs?.oemVolumeMl || 
          (linkedInkItem.purchaseMultiplier > 1 ? linkedInkItem.purchaseMultiplier : null) ||
          140
        );
        const costPerMl = resolvedVol > 0 ? (actualPrice / resolvedVol) : 0;
        const linkedYield = Number(
          linkedInkItem.yield ||
          linkedInkItem.standard_page_yield ||
          linkedInkItem.standardPageYield ||
          linkedInkItem.specs?.yield ||
          linkedInkItem.specs?.isoYield ||
          0
        );
        const actualRate = linkedYield > 0 ? (resolvedVol / linkedYield) : isoRate;
        actualCostPerPage = costPerMl * actualRate;
      } else {
        actualCostPerPage = p.inkCostPerPage ? (Number(p.inkCostPerPage) / oemSlots.length) : 0;
      }
      totalInkCost += actualCostPerPage;
    });

    return Math.round(totalInkCost);
  };

  const createNewItem = (name = 'ລາຍການສິນຄ້າ 1', specs?: any): QuotationItem => {
    const isMono = specs?.colorMode === 'MONO_K';
    const pageCount = Number(specs?.pageCount) || (specs ? 150 : 1);
    const orderQty = Number(specs?.orderQuantity) || 100;
    const isBook = pageCount >= 4;

    const covC = specs ? (isMono ? 0 : Number(specs.avgCovC) || 0) : 10;
    const covM = specs ? (isMono ? 0 : Number(specs.avgCovM) || 0) : 10;
    const covY = specs ? (isMono ? 0 : Number(specs.avgCovY) || 0) : 10;
    const covK = specs ? Number(specs.avgCovK) || 0 : 10;
    const defaultPrinter = printers[0] || { id: 'PRN-DEFAULT', name: 'Default Printer' };
    const defaultPaper = papers[0]?.id || '';
    const defaultPostPress = postPressEquipment.length > 0 ? [postPressEquipment[0].id] : [];
    const rate = getPrinterMachineRate(defaultPrinter);
    const inkBaseRate = getPrinterActualInkCostPerPage(defaultPrinter);

    const channels = isMono ? [
      { channel_name: 'K', density_pct: covK, is_spot_color: false }
    ] : [
      { channel_name: 'C', density_pct: covC, is_spot_color: false },
      { channel_name: 'M', density_pct: covM, is_spot_color: false },
      { channel_name: 'Y', density_pct: covY, is_spot_color: false },
      { channel_name: 'K', density_pct: covK, is_spot_color: false },
    ];

    let initialAllocations: any[] = [];
    const colorPages = Number(specs?.colorPages || 0);
    const monoPages = Number(specs?.monoPages || 0);

    if (colorPages > 0 && monoPages > 0) {
      initialAllocations = [
        {
          printer_id: defaultPrinter.id,
          printer_name: `${defaultPrinter.name || defaultPrinter.id} (ໜ້າສີ ${colorPages} ໜ້າ)`,
          allocated_pages: colorPages,
          cost_per_page: rate,
          ink_cost_per_page: inkBaseRate,
          subtotal_cost: colorPages * rate,
          color_mode: 'CMYK',
          average_density_pct: Math.round((covC + covM + covY + covK) / 4),
          color_channels: [
            { channel_name: 'C', density_pct: covC, is_spot_color: false },
            { channel_name: 'M', density_pct: covM, is_spot_color: false },
            { channel_name: 'Y', density_pct: covY, is_spot_color: false },
            { channel_name: 'K', density_pct: covK, is_spot_color: false },
          ],
        },
        {
          printer_id: defaultPrinter.id,
          printer_name: `${defaultPrinter.name || defaultPrinter.id} (ໜ້າຂາວດຳ ${monoPages} ໜ້າ)`,
          allocated_pages: monoPages,
          cost_per_page: Math.round(rate * 0.5),
          ink_cost_per_page: Math.round(inkBaseRate * 0.35),
          subtotal_cost: monoPages * Math.round(rate * 0.5),
          color_mode: 'MONO_K',
          average_density_pct: Number(specs?.monoPagesAvgK) || 6.5,
          color_channels: [
            { channel_name: 'C', density_pct: 0, is_spot_color: false },
            { channel_name: 'M', density_pct: 0, is_spot_color: false },
            { channel_name: 'Y', density_pct: 0, is_spot_color: false },
            { channel_name: 'K', density_pct: Number(specs?.monoPagesAvgK) || 6.5, is_spot_color: false },
          ],
        }
      ];
    } else {
      initialAllocations = [{
        printer_id: defaultPrinter.id,
        printer_name: defaultPrinter.name || defaultPrinter.id,
        allocated_pages: pageCount,
        cost_per_page: rate,
        ink_cost_per_page: inkBaseRate,
        subtotal_cost: pageCount * rate,
        color_mode: isMono ? 'MONO_K' : 'CMYK',
        average_density_pct: Math.round((covC + covM + covY + covK) / (isMono ? 1 : 4)),
        color_channels: channels,
      }];
    }

    const defaultCoverPaper = papers.find(p => p.name?.includes('260') || p.name?.includes('300') || p.name?.includes('Art'))?.id || defaultPaper;

    return {
      id: `item-${Date.now()}-${Math.random().toString().slice(-4)}`,
      name: specs?.jobName || name,
      paperId: defaultPaper,
      jobSizePreset: specs?.suggestedPaper || 'A4',
      jobWidth: Number(specs?.jobWidth) || 210,
      jobHeight: Number(specs?.jobHeight) || 297,
      isDoubleSided: isBook ? true : false,
      printVolume: orderQty,
      pagesPerBook: pageCount,
      unitName: isBook ? 'ຊຸດ' : 'ແຜ່ນ',
      includeCover: isBook,
      coverPaperId: defaultCoverPaper,
      coverPrintMode: 'CMYK_1_SIDE',
      coverPagesCount: 4,
      colorPrintMode: isMono ? 'MONO_K' : 'CMYK',
      coverageMode: specs ? 'advanced' : 'default',
      avgCoverage: 15,
      cCoverage: covC,
      mCoverage: covM,
      yCoverage: covY,
      kCoverage: covK,
      selectedPrinterId: defaultPrinter.id,
      selectedInkSet: 'Konica C6085 OEM Set',
      printerAllocations: initialAllocations,
      selectedPostPressIds: defaultPostPress,
      finishingMaterials: [
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
      ],
      activeModules: {
        paper: true,
        printEngine: true,
        postPressMachinery: true,
        finishingMaterials: true,
        laborAndSetup: true,
        packagingDelivery: false,
      },
      packagingCost: 0,
      deliveryCost: 0,
      selectedTemplateId: 'TPL_BOOKLET_STAPLE',
      laborMode: 'percent',
      laborPercent: 15,
      laborCostManual: 50000,
      profitMargin: 40,
      discountPercent: 0,
      fileName: specs?.fileName,
    };
  };

  const incomingSpecs = prefilledSpecs || prefilledOrderSpecs;

  const [items, setItems] = useState<QuotationItem[]>(() => [
    createNewItem(incomingSpecs?.jobName || 'ລາຍການທີ 1', incomingSpecs)
  ]);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const activeItem = items[activeItemIndex] || items[0];

  const [isPreflightModalOpen, setIsPreflightModalOpen] = useState(false);

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
    const rate = getPrinterMachineRate(printer);
    const inkBaseRate = getPrinterActualInkCostPerPage(printer);

    // Preserve exact existing channels, density, and duplex from active allocation or item
    const firstAlloc = activeItem.printerAllocations?.[0];
    const isMono = firstAlloc ? firstAlloc.color_mode === 'MONO_K' : activeItem.colorPrintMode === 'MONO_K';
    const isDuplex = firstAlloc ? firstAlloc.is_double_sided : activeItem.isDoubleSided;

    const existingChannels = firstAlloc?.color_channels;
    const channels = existingChannels && existingChannels.length > 0
      ? existingChannels.map(c => ({ ...c }))
      : (isMono ? [
          { channel_name: 'K', density_pct: activeItem.kCoverage || 15, is_spot_color: false }
        ] : [
          { channel_name: 'C', density_pct: activeItem.cCoverage || 15, is_spot_color: false },
          { channel_name: 'M', density_pct: activeItem.mCoverage || 15, is_spot_color: false },
          { channel_name: 'Y', density_pct: activeItem.yCoverage || 15, is_spot_color: false },
          { channel_name: 'K', density_pct: activeItem.kCoverage || 15, is_spot_color: false },
        ]);

    const avgDensity = firstAlloc?.average_density_pct || activeItem.avgCoverage || 15;

    if (mode === 'add' && (activeItem.printerAllocations || []).length > 0) {
      // Split load mode: Add new printer and distribute pages
      const totalPages = activeItem.printVolume;
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
        allocated_pages: activeItem.printVolume,
        cost_per_page: rate,
        ink_cost_per_page: inkBaseRate,
        subtotal_cost: activeItem.printVolume * rate,
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

      // If print volume changed and there is 1 allocation, sync its allocated_pages
      if (patch.printVolume !== undefined && updated.printerAllocations && updated.printerAllocations.length === 1) {
        updated.printerAllocations = [{
          ...updated.printerAllocations[0],
          allocated_pages: patch.printVolume,
          subtotal_cost: patch.printVolume * (updated.printerAllocations[0].cost_per_page || 50)
        }];
      }

      // If printer allocations changed, sync top-level double-sided and color mode flags
      if (patch.printerAllocations) {
        const isAnyDuplex = patch.printerAllocations.some(a => a.is_double_sided);
        const isAllMono = patch.printerAllocations.length > 0 && patch.printerAllocations.every(a => a.color_mode === 'MONO_K');
        updated.isDoubleSided = isAnyDuplex;
        updated.colorPrintMode = isAllMono ? 'MONO_K' : 'CMYK';
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

    const newItem = createNewItem(cleanName, {
      jobName: cleanName,
      fileName: pfResult.file_name,
      pageCount: pfResult.total_pages || 1,
      orderQuantity: 100,
      colorPages: pfResult.color_pages_count || 0,
      monoPages: pfResult.mono_pages_count || 0,
      monoPagesAvgK: pfResult.mono_pages_avg_k || 6.5,
      jobWidth: pfResult.target_width_mm || 210,
      jobHeight: pfResult.target_height_mm || 297,
      suggestedPaper: pfResult.target_paper_size || 'A4',
      colorPrintMode: detectedColorMode,
      cCoverage: pfResult.color_pages_avg_c || pfResult.avg_cov_c || 5,
      mCoverage: pfResult.color_pages_avg_m || pfResult.avg_cov_m || 5,
      yCoverage: pfResult.color_pages_avg_y || pfResult.avg_cov_y || 5,
      kCoverage: (pfResult.color_pages_count || 0) > 0 ? (pfResult.color_pages_avg_k || 15) : (pfResult.mono_pages_avg_k || pfResult.avg_cov_k || 10),
    });

    setItems(prev => [...prev, newItem]);
    setActiveItemIndex(items.length);
    setIsPreflightModalOpen(false);
    if (showToast) showToast(`ເພີ່ມລາຍການ "${cleanName}" (${pfResult.total_pages} ໜ້າ) ສຳເລັດ!`, 'success');
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
    updateActiveItem({
      selectedTemplateId: tpl.id,
      activeModules: { ...tpl.activeModules },
      finishingMaterials: tpl.defaultMaterials ? [...tpl.defaultMaterials] : [],
      laborPercent: tpl.defaultLaborPercent !== undefined ? tpl.defaultLaborPercent : activeItem.laborPercent,
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
      defaultLaborPercent: activeItem.laborPercent || 15,
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

  useEffect(() => {
    if (incomingSpecs) {
      const isMono = incomingSpecs.colorMode === 'MONO_K';
      const pages = Number(incomingSpecs.pageCount) || 100;
      const covC = isMono ? 0 : Number(incomingSpecs.avgCovC) || 0;
      const covM = isMono ? 0 : Number(incomingSpecs.avgCovM) || 0;
      const covY = isMono ? 0 : Number(incomingSpecs.avgCovY) || 0;
      const covK = Number(incomingSpecs.avgCovK) || 0;

      updateActiveItem({
        name: incomingSpecs.jobName || activeItem.name,
        printVolume: pages,
        colorPrintMode: isMono ? 'MONO_K' : 'CMYK',
        coverageMode: 'advanced',
        cCoverage: covC,
        mCoverage: covM,
        yCoverage: covY,
        kCoverage: covK,
        jobSizePreset: incomingSpecs.suggestedPaper || activeItem.jobSizePreset,
        fileName: incomingSpecs.fileName,
        printerAllocations: [{
          printer_id: activeItem.selectedPrinterId || printers[0]?.id || 'PRN-DEFAULT',
          printer_name: printers.find(p => p.id === activeItem.selectedPrinterId)?.name || 'Default Printer',
          allocated_pages: pages,
          cost_per_page: 50,
          subtotal_cost: pages * 50,
          color_mode: isMono ? 'MONO_K' : 'CMYK',
          average_density_pct: Math.round((covC + covM + covY + covK) / (isMono ? 1 : 4)),
          color_channels: isMono ? [
            { channel_name: 'K', density_pct: covK, is_spot_color: false }
          ] : [
            { channel_name: 'C', density_pct: covC, is_spot_color: false },
            { channel_name: 'M', density_pct: covM, is_spot_color: false },
            { channel_name: 'Y', density_pct: covY, is_spot_color: false },
            { channel_name: 'K', density_pct: covK, is_spot_color: false },
          ]
        }]
      });

      if (showToast) {
        showToast(`ດຶງຂໍ້ມູນສີ (${isMono ? `K:${covK}%` : `C:${covC}% M:${covM}% Y:${covY}% K:${covK}%`}) ແລະ ຈຳນວນໜ້າ (${pages} ໜ້າ) ເຂົ້າ "${activeItem.name}" ຮຽບຮ້ອຍ!`, 'success');
      }
      if (setPrefilledOrderSpecs) {
        setPrefilledOrderSpecs(null);
      }
    }
  }, [incomingSpecs]);

  const [currentStep, setCurrentStep] = useState<'calc' | 'quote'>('calc');
  const [quotationTitle, setQuotationTitle] = useState('ໃບສະເໜີລາຄາງານພິມ');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isTemplateOption, setIsTemplateOption] = useState(false);
  const [templateCategory, setTemplateCategory] = useState('sticker');
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.name || '');
  const [customerPhone, setCustomerPhone] = useState(customers[0]?.phone || '');
  const [customerAddress, setCustomerAddress] = useState(customers[0]?.address || '');
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

    if (data.isNew && data.saveToCrm && data.name.trim() && addCustomer) {
      addCustomer({
        id: `cust-${Date.now()}`,
        name: data.name.trim(),
        phone: data.phone || '020 55889900',
        address: data.address || 'Vientiane',
        creditLimit: 5000000,
        unpaidBalance: 0
      });
    }
  };

  const getPresetDimensions = (preset: string, currentW: number, currentH: number) => {
    switch (preset) {
      case 'A3': return { w: 297, h: 420 };
      case 'A4': return { w: 210, h: 297 };
      case 'A5': return { w: 148, h: 210 };
      case 'A6': return { w: 105, h: 148 };
      default: return { w: currentW, h: currentH };
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
    let parentW = 297;
    let parentH = 420;
    if (paperItem?.name?.includes('A4') || paperItem?.specs?.standardSize === 'A4') { parentW = 210; parentH = 297; }
    else if (paperItem?.name?.includes('A3') || paperItem?.specs?.standardSize === 'A3') { parentW = 297; parentH = 420; }
    
    const curW = Number(jobW) + (Number(bleedMargin) * 2);
    const curH = Number(jobH) + (Number(bleedMargin) * 2);
    const portraitCuts = Math.floor(parentW / curW) * Math.floor(parentH / curH);
    const landscapeCuts = Math.floor(parentW / curH) * Math.floor(parentH / curW);
    const cutsPerSheet = Math.max(1, portraitCuts, landscapeCuts);

    // 1. Pages & Sheets Breakdown:
    const pagesPerBook = Number(item.pagesPerBook || 1);
    const orderQty = Number(item.printVolume || 1);
    const hasCover = Boolean(item.includeCover && pagesPerBook >= 4);
    const coverPagesCount = hasCover ? (Number(item.coverPagesCount) || 4) : 0;
    const innerPagesPerBook = Math.max(1, pagesPerBook - coverPagesCount);
    const innerSheetsPerBook = item.isDoubleSided ? Math.ceil(innerPagesPerBook / 2) : innerPagesPerBook;

    // 2. Inner Paper Sheets Calculation:
    const totalInnerSheets = innerSheetsPerBook * orderQty;
    const innerParentSheetsNeeded = Math.ceil(totalInnerSheets / cutsPerSheet);

    const tier = spoilageTiers.find(t => totalInnerSheets >= t.min && totalInnerSheets <= t.max);
    const itemSpoilageRate = (item.spoilagePercent !== undefined && item.spoilagePercent !== null)
      ? Number(item.spoilagePercent)
      : (tier ? tier.rate : 5);
    const innerWastedSheets = Math.ceil(innerParentSheetsNeeded * (itemSpoilageRate / 100));
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
      coverParentSheetsNeeded = Math.ceil(totalCoverSheets / 1);
      coverWastedSheets = Math.ceil(coverParentSheetsNeeded * (itemSpoilageRate / 100));
      totalCoverParentSheets = coverParentSheetsNeeded + coverWastedSheets;
      
      const coverFifo = coverPaperItem ? getFIFOCostPerSheet(coverPaperItem.id, totalCoverParentSheets) : 0;
      coverPaperUnitCost = coverFifo > 0 ? coverFifo : (coverPaperItem ? (Number(coverPaperItem.unitCost) || Number(coverPaperItem.costPerSheet) || 850) : 850);
      coverPaperCost = totalCoverParentSheets * coverPaperUnitCost;
    }

    const parentSheetsNeeded = innerParentSheetsNeeded + coverParentSheetsNeeded;
    const wastedSheets = innerWastedSheets + coverWastedSheets;
    const totalParentSheets = totalInnerParentSheets + totalCoverParentSheets;

    const A4_AREA = 210 * 297;
    const areaFactor = (Number(jobW) * Number(jobH)) / A4_AREA;

    let cyanMl = 0;
    let magentaMl = 0;
    let yellowMl = 0;
    let blackMl = 0;
    let totalInkCostAccum = 0;
    let machDepr = 0;
    let electricityCost = 0;

    const allocations = (item.printerAllocations && item.printerAllocations.length > 0)
      ? item.printerAllocations
      : [
          {
            printer_id: item.selectedPrinterId || 'default',
            printer_name: 'Default Printer',
            allocated_pages: item.printVolume,
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
      const allocPages = Number(alloc.allocated_pages ?? item.printVolume ?? 0);
      const isDuplex = alloc.is_double_sided !== undefined ? alloc.is_double_sided : (item.isDoubleSided || false);
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
      const oemSlots = (prn?.printerColorLinks && prn?.printerColorLinks.length > 0)
        ? prn.printerColorLinks
        : (prn?.oemBaselineInks && prn?.oemBaselineInks.length > 0)
          ? prn.oemBaselineInks
          : (prn?.specs?.printerColorLinks && prn?.specs?.printerColorLinks.length > 0)
            ? prn.specs.printerColorLinks
            : (prn?.specs?.oemBaselineInks && prn?.specs?.oemBaselineInks.length > 0)
              ? prn.specs.oemBaselineInks
              : [];

      const computeChannel = (channelCode: 'C' | 'M' | 'Y' | 'K', covPct: number) => {
        if (covPct <= 0) return { ml: 0, cost: 0 };

        const oemSlot = oemSlots.find((s: any) => {
          const pos = (s.slotPosition || '').toUpperCase();
          const grp = (s.colorGroup || '').toUpperCase();
          const sku = (s.oemInkCode || '').toUpperCase();
          if (channelCode === 'K') return pos.includes('BLACK') || pos.includes('(K') || pos.includes(' 1') || grp.includes('BLACK') || sku.endsWith('-BK') || sku.endsWith('-K');
          if (channelCode === 'C') return pos.includes('CYAN') || pos.includes('(C') || pos.includes(' 2') || grp.includes('CYAN') || sku.endsWith('-C');
          if (channelCode === 'M') return pos.includes('MAGENTA') || pos.includes('(M') || pos.includes(' 3') || grp.includes('MAGENTA') || sku.endsWith('-M');
          if (channelCode === 'Y') return pos.includes('YELLOW') || pos.includes('(Y') || pos.includes(' 4') || grp.includes('YELLOW') || sku.endsWith('-Y');
          return false;
        });

        const oemVol = Number(oemSlot?.oemStandardVolumeMl || (channelCode === 'K' ? 65 : 19));
        const oemYield = Number(oemSlot?.oemStandardIsoYieldA4 || 1500);
        const isoRateMlPerSheet = oemYield > 0 ? (oemVol / oemYield) : (channelCode === 'K' ? 0.04333 : 0.01267);

        const link = activePrnLinks.find((l: any) => {
          const pos = (l.slotPosition || '').toUpperCase();
          const grp = (l.colorGroup || '').toUpperCase();
          if (channelCode === 'K') return pos.includes('BLACK') || pos.includes('(K') || pos.includes(' 1') || grp.includes('BLACK');
          if (channelCode === 'C') return pos.includes('CYAN') || pos.includes('(C') || pos.includes(' 2') || grp.includes('CYAN');
          if (channelCode === 'M') return pos.includes('MAGENTA') || pos.includes('(M') || pos.includes(' 3') || grp.includes('MAGENTA');
          if (channelCode === 'Y') return pos.includes('YELLOW') || pos.includes('(Y') || pos.includes(' 4') || grp.includes('YELLOW');
          return false;
        });

        const linkedItem = link ? inventory.find(inv => inv.id === link.inkCode || inv.skuCode === link.inkCode || inv.sku === link.inkCode) : null;

        let costPerMl = 2500;
        let rateMlPerSheet = isoRateMlPerSheet;

        if (linkedItem) {
          const itemPrice = Number(linkedItem.unitPrice || linkedItem.costPerPurchaseUnit || 0);
          const itemVol = Number(
            linkedItem.volume || 
            linkedItem.specs?.volume || 
            linkedItem.specs?.volume_ml || 
            linkedItem.specs?.oemStandardVolumeMl || 
            linkedItem.specs?.oemVolumeMl || 
            (linkedItem.purchaseMultiplier > 1 ? linkedItem.purchaseMultiplier : null) ||
            100
          );
          if (itemPrice > 0 && itemVol > 0) {
            costPerMl = itemPrice / itemVol;
          }

          const linkedYield = Number(
            linkedItem.yield ||
            linkedItem.standard_page_yield ||
            linkedItem.standardPageYield ||
            linkedItem.specs?.yield ||
            linkedItem.specs?.isoYield ||
            0
          );
          if (linkedYield > 0 && itemVol > 0) {
            rateMlPerSheet = itemVol / linkedYield;
          }
        }

        const ml = rateMlPerSheet * (covPct / 5) * areaFactor * allocPages * sideFactor;
        const cost = ml * costPerMl;
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

      // Machine depreciation and maintenance reserve calculation per allocation
      const prnPrice = Number(prn?.purchasePrice || prn?.purchaseCost || prn?.price || prn?.MachinePrice || 0);
      const maintRate = Number((prn as any)?.maintenanceRatePercent || (prn as any)?.maintenance_rate_percent || 20);
      const lifePages = Number((prn as any)?.expectedLifeA4Pages || (prn as any)?.printedPagesCapacity || (prn as any)?.TargetTotalPages || 500000);
      const costPerPageFallback = Number(alloc.cost_per_page || (prn as any)?.costPerPage || (prn as any)?.calculatedCostPerPage || 50);

      const machineCalc = calculateMachineUnitCost({
        purchase_price_lak: prnPrice,
        expected_life_pages: lifePages,
        maintenance_rate_percent: maintRate
      });

      const deprPerSheet = machineCalc.totalMachineCost > 0
        ? machineCalc.totalMachineCost * areaFactor
        : costPerPageFallback;

      machDepr += Math.round(deprPerSheet * allocPages * sideFactor);
      electricityCost += Math.round(allocPages * sideFactor * 40);
    });

    const hasPaperModule = item.activeModules ? item.activeModules.paper : true;
    const hasPrintEngineModule = item.activeModules ? item.activeModules.printEngine : true;
    const hasPostPressModule = item.activeModules ? item.activeModules.postPressMachinery : true;
    const hasFinishingMaterialsModule = item.activeModules ? item.activeModules.finishingMaterials : true;
    const hasLaborModule = item.activeModules ? item.activeModules.laborAndSetup : true;
    const hasPackagingModule = item.activeModules ? item.activeModules.packagingDelivery : true;

    const rawPaperCost = Math.round(innerPaperCost + coverPaperCost);
    const rawInkCost = Math.round(totalInkCostAccum);
    const rawMachineOverhead = machDepr + electricityCost;

    const rawPostPressCost = (item.selectedPostPressIds || []).reduce((sum, machId) => {
      const mach = equipment.find(e => e.id === machId);
      if (!mach) return sum;
      const rate = Number((mach as any).costPerPage) || Number((mach as any).calculatedCostPerPage) || 300;
      return sum + Math.round(rate * item.printVolume);
    }, 0);

    const rawFinishingMaterialsCost = (item.finishingMaterials || []).reduce((sum, mat) => {
      const uCost = Number(mat.unitCost) || 0;
      const q = Number(mat.qtyPerItem) || 1;
      return sum + Math.round(uCost * q * item.printVolume);
    }, 0);

    const paperCost = hasPaperModule ? rawPaperCost : 0;
    const inkCost = hasPrintEngineModule ? rawInkCost : 0;
    const machineOverhead = hasPrintEngineModule ? rawMachineOverhead : 0;
    const postPressCost = hasPostPressModule ? rawPostPressCost : 0;
    const finishingMaterialsCost = hasFinishingMaterialsModule ? rawFinishingMaterialsCost : 0;

    const directMatMach = paperCost + inkCost + machineOverhead + postPressCost + finishingMaterialsCost;
    
    let laborCost = 0;
    if (hasLaborModule) {
      if (item.laborMode === 'manual') {
        laborCost = Number(item.laborCostManual || 0);
      } else {
        const pct = Number(item.laborPercent || 15);
        laborCost = Math.round(directMatMach * (pct / 100));
      }
    }

    const packagingDeliveryCost = hasPackagingModule ? (Number(item.packagingCost || 0) + Number(item.deliveryCost || 0)) : 0;

    const netCost = paperCost + inkCost + machineOverhead + postPressCost + finishingMaterialsCost + laborCost + packagingDeliveryCost;
    const marginDec = Math.min(0.99, Math.max(0, Number(item.profitMargin || 40) / 100));
    const baseSellingPrice = Math.round(netCost / (1.0 - marginDec));
    const discountAmt = Math.round(baseSellingPrice * (Number(item.discountPercent || 0) / 100));
    const finalSellingPrice = baseSellingPrice - discountAmt;
    const unitPrice = Math.round(finalSellingPrice / Math.max(1, item.printVolume));
    const unitCost = Math.round(netCost / Math.max(1, item.printVolume));
    const profit = finalSellingPrice - netCost;

    return {
      cutsPerSheet,
      parentSheetsNeeded,
      totalParentSheets,
      wastedSheets,
      itemSpoilageRate,
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
      cyanMl,
      magentaMl,
      yellowMl,
      blackMl,
      inkCost,
      machineOverhead,
      machDepr,
      electricityCost,
      postPressCost,
      finishingMaterialsCost,
      packagingDeliveryCost,
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
  const grandLaborCost = calculatedItems.reduce((sum, c) => sum + c.laborCost, 0) + quotationSetupFee;
  const grandPackagingCost = calculatedItems.reduce((sum, c) => sum + c.packagingDeliveryCost, 0) + quotationPackagingCost;
  const grandNetCost = calculatedItems.reduce((sum, c) => sum + c.netCost, 0) + quotationSetupFee + quotationPackagingCost;
  const grandSubtotal = calculatedItems.reduce((sum, c) => sum + c.sellingPrice, 0) + quotationSetupFee + quotationPackagingCost;
  const grandTotalUnits = items.reduce((sum, it) => sum + Number(it.printVolume || 0), 0);
  const taxAmount = taxEnabled
    ? (taxMode === 'override' ? Number(taxOverrideAmount || 0) : Math.round(grandSubtotal * (Number(taxRate || 0) / 100)))
    : 0;
  const finalGrandTotal = grandSubtotal + taxAmount + Number(shippingFee || 0);
  const grandNetProfit = finalGrandTotal - grandNetCost;
  const grandProfitMargin = finalGrandTotal > 0 ? (grandNetProfit / finalGrandTotal) * 100 : 0;

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
        if (paperItem) {
          orderItems.push({
            id: item.paperId,
            name: `[${item.name}] ${paperItem.name} (Parent Sheets)`,
            quantity: calc.totalParentSheets,
            unitCost: calc.paperUnitCost
          });
        }

        // Add machinery items
        (item.selectedPostPressIds || []).forEach(machId => {
          const mach = equipment.find(e => e.id === machId);
          if (mach) {
            const rate = Number((mach as any).costPerPage) || Number((mach as any).calculatedCostPerPage) || 300;
            orderItems.push({
              id: mach.id,
              name: `[${item.name}] ${mach.name}`,
              quantity: item.printVolume,
              unitCost: rate
            });
          }
        });
      });

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
        notes: `Multi-Item Quotation Order (${items.length} items): ${items.map(i => `${i.name} (${i.printVolume} units)`).join(', ')}. Shipping: ${shippingMethod} (${formatCurrency(shippingFee)}). Payment terms: ${paymentTerms}. ${quotationNote ? `Note: ${quotationNote}` : ''}`,
      }, false);

      showToast(
        currentLang === 'lo' 
          ? `ເປີດອໍເດີ (${items.length} ລາຍການ) ສຳເລັດ! (ສະຕ໋ອກຈະຖືກຕັດເມື່ອເຂົ້າສູ່ຂັ້ນຕອນພິມ IN_PRODUCTION)` 
          : `Order with ${items.length} items created successfully! (Inventory will be deducted at IN_PRODUCTION stage)`,
        'success'
      );
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
      discountPercent: Number(activeItem.discountPercent || 0),
      grossProfitMargin: grandProfitMargin,
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
      ? `ປ່ຽນໃບສະເໜີ ${quotation.quotationNumber} ເປັນອໍເດີ ແລະ ສ້າງ Job Ticket ບໍ?`
      : `Convert quotation ${quotation.quotationNumber} to a production order with Job Ticket?`;

    askConfirmation(msg, () => {
      const orderId = convertQuotationToOrder(quotation.id);
      if (orderId && onConvertToOrder) {
        onConvertToOrder({ orderId, sourceQuotationId: quotation.id });
      }
      showToast(
        currentLang === 'lo' ? 'ປ່ຽນເປັນອໍເດີສຳເລັດ! ສ້າງ Job Ticket ແລ້ວ.' : 'Converted to order! Job Ticket generated.',
        'success'
      );
    });
  };

  // 🌟 Quick Save as Draft with Customer & Specs Snapshot
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
      discountPercent: Number(activeItem.discountPercent || 0),
      grossProfitMargin: grandProfitMargin,
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
      version: 1
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
      laborPercent: Number(raw?.laborPercent) || 15,
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
      
      {/* Unified Top Bar: Large Step Tabs + Currency + Saved Quotations */}
      <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5 rounded-2xl border border-slate-200/90 shadow-xs print:hidden flex-wrap">
        {/* Back button (if available) */}
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition shrink-0 active:scale-95 cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        {/* Large Easy-to-Read Step Tabs */}
        <div className="flex items-center gap-2 flex-1 min-w-[320px]">
          <button
            type="button"
            onClick={() => setCurrentStep('calc')}
            className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm sm:text-base font-black transition-all cursor-pointer shadow-xs ${
              currentStep === 'calc'
                ? 'bg-primary-navy text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <Calculator className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>1. {currentLang === 'lo' ? 'ກຳນົດສະເປກ & ຄຳນວນ' : 'Specs & Cost'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep('quote')}
            className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm sm:text-base font-black transition-all cursor-pointer shadow-xs ${
              currentStep === 'quote'
                ? 'bg-primary-navy text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <Layers className="w-5 h-5 shrink-0 text-accent-sky" />
            <span>2. {currentLang === 'lo' ? 'ໃບສະເໜີລູກຄ້າ' : 'Client Quotation'}</span>
            <span className="px-2.5 py-0.5 rounded-lg text-xs bg-emerald-500/20 text-emerald-700 font-sans font-black">
              {formatCurrency(finalGrandTotal)}
            </span>
          </button>
        </div>

        {/* Right Section: Currency Selector + History Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Currency Selector */}
          <div className="flex items-center gap-0.5 p-1 bg-slate-100 border border-slate-200 rounded-xl">
            {['LAK', 'THB', 'USD'].map(code => (
              <button
                key={code}
                type="button"
                onClick={() => setCurrency(code)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition ${
                  currency === code
                    ? 'bg-white text-primary-navy shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {code === 'LAK' ? '₭' : code === 'THB' ? '฿' : '$'} {code}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsQuotationListOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-extrabold transition cursor-pointer shadow-2xs active:scale-95"
            title="ປະຫວັດໃບສະເໜີ"
          >
            <Layers3 className="w-4 h-4 shrink-0 text-accent-sky" />
            <span className="hidden sm:inline">{currentLang === 'lo' ? 'ປະຫວັດໃບສະເໜີ' : 'History'}</span>
            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold">
              {quotations.length}
            </span>
          </button>

          {currentStep === 'calc' ? (
            <button
              type="button"
              onClick={() => {
                setCurrentStep('quote');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-sm active:scale-95"
            >
              <span>{currentLang === 'lo' ? 'ອອກໃບສະເໜີ' : 'Generate'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep('calc')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{currentLang === 'lo' ? 'ແກ້ໄຂ' : 'Edit'}</span>
            </button>
          )}
        </div>
      </div>


      {/* Credit warning banner (Hide on print) */}
      {creditStatus.exceeded && (
        <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-3xl shadow-sm flex items-start gap-4 animate-pulse print:hidden">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 font-semibold space-y-1">
            <p className="font-extrabold text-base">{currentLang === 'lo' ? 'ວົງເງິນສິນເຊື່ອເກີນກຳນົດ!' : 'Credit Limit Exceeded Alert'}</p>
            <p className="leading-relaxed">
              {currentLang === 'lo'
                ? `ລູກຄ້າ ${selectedCustomerId} ມີຈຳກັດສິນເຊື່ອ ${formatCurrency(creditStatus.limit)}. ຍອດຄ້າງຊຳຣະປັດຈຸບັນ ${formatCurrency(creditStatus.currentUnpaid)} ລວມກັບໃບບິນນີ້ຈະເປັນ ${formatCurrency(creditStatus.totalPotential)}.`
                : `Customer ${selectedCustomerId} has a credit limit of ${formatCurrency(creditStatus.limit)}. Outstanding balance is ${formatCurrency(creditStatus.currentUnpaid)}. Total exposure would reach ${formatCurrency(creditStatus.totalPotential)}.`
              }
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 STEP 1: JOB SPECIFICATIONS & INTERNAL PRICING STUDIO                   */}
      {/* ========================================================================= */}
      {currentStep === 'calc' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start print:hidden animate-fade-in">
          
          {/* Left Column: Job Specifications Panel - Independent Scroll */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-7 lg:p-6 xl:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 min-w-0 lg:sticky lg:top-[5.5rem] lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-accent-sky" />
                  <span>{currentLang === 'lo' ? 'ກຳນົດລາຍລະອຽດງານພິມ (Specs)' : 'Job Specifications'}</span>
                </h3>
                <p className="text-[11px] font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-600 font-semibold">{quotationTitle || (currentLang === 'lo' ? 'ໃບສະເໜີລາຄາງານພິມ' : 'Quotation')}</span>
                  <button 
                    type="button" 
                    onClick={() => setIsSaveModalOpen(true)}
                    className="text-accent-sky hover:underline text-[10px] font-bold cursor-pointer"
                  >
                    ({currentLang === 'lo' ? 'ປ່ຽນຊື່' : 'Edit'})
                  </button>
                </p>
              </div>
              <span className="text-xs font-black px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
                ລາຍການທີ {activeItemIndex + 1} / {items.length}
              </span>
            </div>

            <div className="space-y-6">

              {/* ITEM TABS & MULTI-ITEM MANAGER (ແຖບລາຍການສິນຄ້າໃນໃບສະເໜີ) */}
              <div className="p-4 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>ລາຍການສິນຄ້າ ({items.length} ລາຍການ)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPreflightModalOpen(true)}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>+ ເພີ່ມຈາກ Preflight</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
                    >
                      <span>+ ລາຍການໃໝ່</span>
                    </button>
                  </div>
                </div>

                {/* Item Tabs Pill List */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {items.map((item, idx) => {
                    const isActive = idx === activeItemIndex;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setActiveItemIndex(idx)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-2xl cursor-pointer transition border text-xs font-bold shrink-0 select-none ${
                          isActive
                            ? 'bg-primary-navy text-white border-primary-navy shadow-md'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>{idx + 1}. {item.name || `ລາຍການ ${idx + 1}`}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {item.printVolume} {item.unitName || 'ຊຸດ'}{item.pagesPerBook ? ` (${item.pagesPerBook} ໜ້າ)` : ''}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveItem(idx);
                            }}
                            className={`hover:text-red-500 transition p-0.5 ${isActive ? 'text-white/70' : 'text-slate-400'}`}
                            title="Remove item"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Active Item Name Field */}
                <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">ຊື່ສິນຄ້ານີ້:</span>
                  <input
                    type="text"
                    value={activeItem.name}
                    onChange={(e) => updateActiveItem({ name: e.target.value })}
                    placeholder="ລະບຸຊື່ສິນຄ້າ ເຊັ່ນ: ປຶ້ມພາສາລາວ A4..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleDuplicateItem(activeItemIndex)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold shrink-0 border border-slate-700 transition cursor-pointer"
                    title="Duplicate this item"
                  >
                    ສຳເນົາ
                  </button>
                </div>
              </div>

              {/* ========================================================= */}
              {/* 🌟 DYNAMIC PRICING TEMPLATES & MODULAR CONTROL STUDIO     */}
              {/* ========================================================= */}
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xs">
                
                {/* Top Row: Template Presets Selector + Open Full Modal & Save as Template */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-accent-sky/10 text-accent-sky flex items-center justify-center font-bold">
                      <Bookmark className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        {currentLang === 'lo' ? 'ແມ່ແບບສູດຄຳນວນ (Pricing Templates)' : 'Pricing Preset Templates'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {currentLang === 'lo' ? 'ເລືອກແມ່ແບບສຳເລັດຮູບ ຫຼື ປັບແຕ່ງໂມດູນເອງ' : 'Select quick presets or customize dynamic modules.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsTemplateModalOpen(true)}
                      className="px-3.5 py-2 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{currentLang === 'lo' ? `ເລືອກ & ຈັດການແມ່ແບບ (${allAvailableTemplates.length})` : `Manage Templates (${allAvailableTemplates.length})`}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsNewTemplateModalOpen(true)}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{currentLang === 'lo' ? 'ບັນທຶກເປັນແມ່ແບບໃໝ່' : 'Save As Template'}</span>
                    </button>
                  </div>
                </div>

                {/* Active Selected Template Badge Bar */}
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-xs">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-accent-sky shrink-0" />
                    <span className="text-slate-500 font-bold">{currentLang === 'lo' ? 'ແມ່ແບບທີ່ກຳລັງໃຊ້:' : 'Active Template:'}</span>
                    <span className="font-black text-primary-navy">
                      {allAvailableTemplates.find(t => t.id === activeItem.selectedTemplateId)?.nameLao || 
                       allAvailableTemplates.find(t => t.id === activeItem.selectedTemplateId)?.nameEn || 
                       (currentLang === 'lo' ? 'ກຳນົດເອງ (Custom Spec)' : 'Custom Spec')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="text-xs font-black text-accent-sky hover:text-sky-700 transition cursor-pointer flex items-center gap-1"
                  >
                    <span>{currentLang === 'lo' ? 'ປ່ຽນແມ່ແບບ →' : 'Change Template →'}</span>
                  </button>
                </div>

                {/* 8 Full Dynamic & Fixed Cost Modules Grid */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                    <span>{currentLang === 'lo' ? 'ໂມດູນຕົ້ນທຶນທັງໝົດ 1-8 (Active Cost Modules):' : 'All 8 Cost & Spec Modules:'}</span>
                    <span className="text-[10px] text-slate-400">1-2 ບັງຄັບໃຊ້ (Fixed), 3-8 ເປີດ/ປິດ ຕາມຕ້ອງການ</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Fixed Module 1: Customer */}
                    <div className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 text-slate-900 flex items-center justify-between text-xs font-bold shadow-2xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate text-[11px] font-black text-slate-900">
                          {currentLang === 'lo' ? '1. ຂໍ້ມູນລູກຄ້າ' : '1. Customer'}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[9px] font-black shrink-0">FIXED</span>
                    </div>

                    {/* Fixed Module 2: Production Quantity */}
                    <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 text-slate-900 flex items-center justify-between text-xs font-bold shadow-2xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <Hash className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate text-[11px] font-black text-slate-900">
                          {currentLang === 'lo' ? '2. ຈຳນວນຜະລິດ' : '2. Quantity'}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-black shrink-0">FIXED</span>
                    </div>

                    {/* Dynamic Modules 3 to 8 */}
                    {[
                      { key: 'paper' as const, label: currentLang === 'lo' ? '3. ເຈ້ຍ (Paper)' : '3. Paper', icon: FileText, color: 'sky' },
                      { key: 'printEngine' as const, label: currentLang === 'lo' ? '4. ເຄື່ອງພິມ & ໝຶກ' : '4. Print & Ink', icon: Printer, color: 'purple' },
                      { key: 'postPressMachinery' as const, label: currentLang === 'lo' ? '5. ເຄື່ອງຈັກຫຼັງພິມ' : '5. Post-Press Mach.', icon: Wrench, color: 'amber' },
                      { key: 'finishingMaterials' as const, label: currentLang === 'lo' ? '6. ວັດຖຸດິບຫຼັງພິມ' : '6. Consumables', icon: Package, color: 'emerald' },
                      { key: 'laborAndSetup' as const, label: currentLang === 'lo' ? '7. ຄ່າແຮງ & ຕັ້ງເຄື່ອງ' : '7. Labor & Setup', icon: Zap, color: 'blue' },
                      { key: 'packagingDelivery' as const, label: currentLang === 'lo' ? '8. ບັນຈຸພັນ & ຂົນສົ່ງ' : '8. Packaging & Delivery', icon: Truck, color: 'slate' },
                    ].map((mod) => {
                      const isActive = activeItem.activeModules ? activeItem.activeModules[mod.key] : true;
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
                    { key: 'phase1', label: '1. ລູກຄ້າ', icon: User },
                    { key: 'phase2', label: '2. ຈຳນວນ', icon: Hash },
                    { key: 'phase3', label: '3. ເຈ້ຍ', icon: FileText },
                    { key: 'phase4', label: '4. ພິມ', icon: Printer },
                    { key: 'phase5', label: '5. ເຄື່ອງຈັກ', icon: Wrench },
                    { key: 'phase6', label: '6. ວັດຖຸດິບຫຼັງພິມ', icon: Package },
                    { key: 'phase7', label: '7. ຄ່າແຮງ', icon: Zap },
                    { key: 'phase8', label: '8. ຂົນສົ່ງ', icon: Truck },
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
                    {currentLang === 'lo' ? 'ເປີດໝົດ' : 'Expand'}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAllPhases(false)}
                    className="text-[10px] font-bold text-slate-600 hover:text-slate-900 px-2 py-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
                  >
                    {currentLang === 'lo' ? 'ພັບໝົດ' : 'Collapse'}
                  </button>
                </div>
              </div>
              
              {/* PHASE 1: Customer Information (ຂໍ້ມູນລູກຄ້າ) */}
              <div id="sec-phase1" className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition">
                <button
                  type="button"
                  onClick={() => togglePhase('phase1')}
                  className="w-full p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-sans font-black text-xs shadow-xs">1</span>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      {t('estimator.sec_customer', 'Customer Information')}
                    </span>
                    {selectedCustomerId && (
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 font-sans">
                        👤 {selectedCustomerId}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-[11px] font-medium hidden sm:inline">{openPhases.phase1 ? 'ພັບເກັບ' : 'ເປີດເບິ່ງ'}</span>
                    {openPhases.phase1 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {openPhases.phase1 && (
                  <div className="p-4 sm:p-5 border-t border-slate-100 space-y-3 animate-fade-in">
                    <CustomerCombobox
                      customers={customers}
                      valueName={selectedCustomerId}
                      valuePhone={customerPhone}
                      valueAddress={customerAddress}
                      onChange={handleCustomerComboboxChange}
                      currentLang={currentLang}
                    />
                  </div>
                )}
              </div>

              {/* PHASE 2: Job Overview & Production Quantity (ສະຫຼຸບງານ & ຈຳນວນຜະລິດ) */}
              <JobQuantityAndPagesSection
                activeItem={activeItem}
                updateActiveItem={updateActiveItem}
                activeCalc={activeCalc}
                isOpen={openPhases.phase2}
                onToggle={() => togglePhase('phase2')}
                currentLang={currentLang}
              />

              {/* PHASE 3: Inventory Paper Selection (ການເລືອກເຈ້强ຈາກຄັງ & ໜ້າປົກ) */}
              <PaperAndCoverSection
                activeItem={activeItem}
                updateActiveItem={updateActiveItem}
                activeCalc={activeCalc}
                papers={papers}
                isOpen={openPhases.phase3}
                onToggle={() => togglePhase('phase3')}
                onOpenPaperSearch={(target) => {
                  setPaperModalTarget(target);
                  setIsPaperModalOpen(true);
                }}
                formatCurrency={formatCurrency}
                getFIFOCostPerSheet={getFIFOCostPerSheet}
                currentLang={currentLang}
                t={t}
              />

              {/* PHASE 4: Printing Process & Ink Setup (ເຄື່ອງພິມ & ລະບົບສີ) */}
              <div id="sec-phase4" className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition">
                <button
                  type="button"
                  onClick={() => togglePhase('phase4')}
                  className="w-full p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-sans font-black text-xs shadow-xs">4</span>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      {currentLang === 'lo' ? 'ເຄື່ອງພິມ & ລະບົບສີ (Printers & Ink)' : 'Printing Process & Ink'}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 font-sans flex items-center gap-1">
                      <Printer className="w-3 h-3" />
                      {activeItem.printerAllocations.length || 1} ເຄື່ອງ • {activeItem.colorPrintMode === 'MONO_K' ? 'Mono K' : 'CMYK'} • {activeItem.isDoubleSided ? '2 ໜ້າ' : '1 ໜ້າ'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-[11px] font-medium hidden sm:inline">{openPhases.phase4 ? 'ພັບເກັບ' : 'ເປີດເບິ່ງ'}</span>
                    {openPhases.phase4 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {openPhases.phase4 && (
                  <div className="p-4 sm:p-5 border-t border-slate-100 space-y-4 animate-fade-in">
                    <ManualPrinterAllocator
                      targetQuantity={activeItem.printVolume}
                      allocations={activeItem.printerAllocations}
                      availablePrinters={printers.map(p => ({
                        id: p.id,
                        name: p.name || p.id,
                        cost_per_page: getPrinterMachineRate(p),
                        ink_cost_per_page: getPrinterActualInkCostPerPage(p),
                        printerCategory: p.category,
                        colorSchemeType: 'CMYK'
                      }))}
                      onAllocationsChange={(newAllocations) => updateActiveItem({ printerAllocations: newAllocations })}
                      onOpenPrinterModal={() => setIsPrinterModalOpen(true)}
                    />

                    <div className="p-4 bg-purple-50/90 border border-purple-200 rounded-2xl text-xs space-y-2.5">
                      <div className="flex justify-between items-center text-purple-950 font-black">
                        <span className="flex items-center gap-1.5">
                          <Palette className="w-4 h-4 text-purple-600" />
                          <span>ສະຫຼຸບຕົ້ນທຶນການພິມ & ໝຶກ ({activeItem.name})</span>
                        </span>
                        <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 rounded-md font-bold font-sans">
                          {activeItem.printerAllocations.length || 1} ເຄື່ອງພິມ
                        </span>
                      </div>
                      
                      <div className="text-slate-700 space-y-1.5 font-medium">
                        <div className="flex justify-between items-center">
                          <span>1. ຕົ້ນທຶນໝຶກພິມ (Ink Consumed):</span>
                          <div className="text-right">
                            <span className="font-sans font-bold text-slate-900">{formatCurrency(activeCalc.inkCost)}</span>
                            <span className="text-[10px] text-slate-400 block font-sans">
                              (C:{activeCalc.cyanMl.toFixed(1)}ml M:{activeCalc.magentaMl.toFixed(1)}ml Y:{activeCalc.yellowMl.toFixed(1)}ml K:{activeCalc.blackMl.toFixed(1)}ml)
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>2. ຄ່າເສື່ອມລາຄາເຄື່ອງພິມ:</span>
                          <span className="font-sans font-bold text-slate-900">{formatCurrency(activeCalc.machDepr)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>3. ຄ່າໄຟຟ້າ & ສາທາລະນູປະໂພກ:</span>
                          <span className="font-sans font-bold text-slate-900">{formatCurrency(activeCalc.electricityCost)}</span>
                        </div>
                        <div className="flex justify-between text-purple-950 font-bold border-t border-purple-200/70 pt-1.5">
                          <span>ລວມຕົ້ນທຶນພາກການພິມທັງໝົດ:</span>
                          <span className="font-sans font-black text-purple-950 text-sm">
                            {formatCurrency(activeCalc.inkCost + activeCalc.machineOverhead)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PHASE 5: Post-Press Machinery (ວຽກຫຼັງການພິມ) */}
              <div id="sec-phase5" className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition">
                <button
                  type="button"
                  onClick={() => togglePhase('phase5')}
                  className="w-full p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center font-sans font-black text-xs shadow-xs">5</span>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      {currentLang === 'lo' ? 'ວຽກຫຼັງພິມ & ເຄື່ອງຈັກ (Post-Press)' : 'Post-Press Machinery'}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 font-sans flex items-center gap-1">
                      <Wrench className="w-3 h-3" />
                      {activeItem.selectedPostPressIds?.length || 0} ວຽກ • {formatCurrency(activeCalc.postPressCost)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-[11px] font-medium hidden sm:inline">{openPhases.phase5 ? 'ພັບເກັບ' : 'ເປີດເບິ່ງ'}</span>
                    {openPhases.phase5 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {openPhases.phase5 && (
                  <div className="p-4 sm:p-5 border-t border-slate-100 space-y-3 animate-fade-in">
                    <div className="flex justify-between items-center text-xs text-slate-500 font-medium pb-1">
                      <span>ກົດເລືອກເຄື່ອງຈັກທີ່ຕ້ອງໃຊ້ສຳລັບງານນີ້:</span>
                      <button
                        type="button"
                        onClick={() => setIsPostPressModalOpen(true)}
                        className="text-[10px] font-black text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Search className="w-3 h-3" />
                        <span>ຄົ້ນຫາເຄື່ອງຈັກ ({postPressEquipment.length})</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {postPressEquipment.length > 0 ? (
                        postPressEquipment.map((mach) => {
                          const isSelected = (activeItem.selectedPostPressIds || []).includes(mach.id);
                          const rate = Number((mach as any).costPerPage) || Number((mach as any).calculatedCostPerPage) || 300;
                          const subCost = Math.round(rate * Math.max(1, activeItem.printVolume));

                          return (
                            <div 
                              key={mach.id}
                              onClick={() => handleToggleActivePostPress(mach.id)}
                              className={`p-3 rounded-2xl border-2 transition-all cursor-pointer select-none flex items-center justify-between ${
                                isSelected 
                                  ? 'bg-amber-50/80 border-amber-400 shadow-xs' 
                                  : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                                <div className="truncate">
                                  <span className="text-xs font-black text-slate-900 block truncate">
                                    {mach.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-bold block font-sans">
                                    {formatCurrency(rate)} / ຫົວ
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0 pl-2">
                                <span className={`text-xs font-black font-sans block ${isSelected ? 'text-amber-950' : 'text-slate-400'}`}>
                                  {isSelected ? `+${formatCurrency(subCost)}` : `${formatCurrency(0)}`}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-2 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center text-xs text-slate-500 font-medium">
                          -- ບໍ່ມີເຄື່ອງຈັກຫຼັງການພິມໃນຖານຂໍ້ມູນ --
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* PHASE 6: Finishing Materials & Consumables (ວັດຖຸດິບຫຼັງການພິມ: ລວດເຢັບ/ກາວ/ຟິມ/ຫ່ວງ) */}
              <div id="sec-phase6" className={`border rounded-2xl overflow-hidden bg-white shadow-xs transition ${
                activeItem.activeModules?.finishingMaterials ? 'border-emerald-200/80' : 'border-slate-200 opacity-60'
              }`}>
                <button
                  type="button"
                  onClick={() => togglePhase('phase6')}
                  className="w-full p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-sans font-black text-xs shadow-xs">6</span>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      {currentLang === 'lo' ? 'ວັດຖຸດິບຫຼັງພິມ & ອຸປະກອນສິ້ນເປືອງ (Consumables)' : 'Finishing Materials & Consumables'}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-sans flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {(activeItem.finishingMaterials || []).length} ລາຍການ • {formatCurrency(activeCalc.finishingMaterialsCost)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-[11px] font-medium hidden sm:inline">{openPhases.phase6 ? 'ພັບເກັບ' : 'ເປີດເບິ່ງ'}</span>
                    {openPhases.phase6 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {openPhases.phase6 && (
                  <div className="p-4 sm:p-5 border-t border-slate-100 space-y-4 animate-fade-in">
                    
                    {/* Quick Preset Materials Pills + Search in Inventory Button */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-[11px] font-bold text-slate-500 block">
                          {currentLang === 'lo' ? 'ກົດເພີ່ມວັດຖຸດິບສຳເລັດຮູບດ່ວນ (ມີສູດຄິດໄລ່ຍົກກ່ອງ):' : 'Quick Add Consumables:'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsMaterialModalOpen(true)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>ຄົ້ນຫາວັດຖຸດິບໃນຄັງ (Inventory Search)</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: 'ລວດເຢັບແມັກ (#10)', calcMode: 'box' as const, packagePrice: 50000, unitsPerPackage: 1000, unitCost: 50, qtyPerItem: 2, unitName: 'ໂຕ', category: 'staple' },
                          { name: 'ຫ່ວງກະດູກງູ Wire-O', calcMode: 'box' as const, packagePrice: 180000, unitsPerPackage: 100, unitCost: 1800, qtyPerItem: 1, unitName: 'ຂໍ້', category: 'wire' },
                          { name: 'ກາວຮ້ອນສັນປຶ້ມ (Hot Melt)', calcMode: 'box' as const, packagePrice: 125000, unitsPerPackage: 250, unitCost: 500, qtyPerItem: 1, unitName: 'ກຣາມ', category: 'glue' },
                          { name: 'ຟິມເຄືອບ BOPP Thermal', calcMode: 'box' as const, packagePrice: 400000, unitsPerPackage: 500, unitCost: 800, qtyPerItem: 1, unitName: 'ແຜ່ນ', category: 'film' },
                          { name: 'ກ່ອງໃສ່ນາມບັດອະຄຣິລິກໃສ', calcMode: 'box' as const, packagePrice: 350000, unitsPerPackage: 100, unitCost: 3500, qtyPerItem: 1, unitName: 'ກ່ອງ', category: 'box' },
                          { name: 'ຂາຕັ້ງປະຕິທິນແຂງ', calcMode: 'unit' as const, unitCost: 4500, qtyPerItem: 1, unitName: 'ອັນ', category: 'other' },
                        ].map((matPreset) => (
                          <button
                            key={matPreset.name}
                            type="button"
                            onClick={() => handleAddFinishingMaterial(matPreset)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
                          >
                            <Plus className="w-3 h-3 text-emerald-600" />
                            <span>{matPreset.name} {matPreset.calcMode === 'box' ? `(${formatCurrency(matPreset.packagePrice)}/ກ່ອງ)` : `(${formatCurrency(matPreset.unitCost)})`}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Material Items Table / List with Box Breakdown Calculator */}
                    <div className="space-y-3">
                      {(activeItem.finishingMaterials || []).length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-medium">
                          -- ບໍ່ມີວັດຖຸດິບຫຼັງການພິມສຳລັບລາຍການນີ້ --
                        </div>
                      ) : (
                        (activeItem.finishingMaterials || []).map((mat, mIdx) => {
                          const isBoxMode = mat.calcMode === 'box';
                          const unitPrice = isBoxMode && (mat.unitsPerPackage || 0) > 0
                            ? Math.round(Number(mat.packagePrice || 0) / Number(mat.unitsPerPackage || 1))
                            : Number(mat.unitCost || 0);
                          const costPerFinishedJob = Math.round(unitPrice * Number(mat.qtyPerItem || 1));
                          const totalMatCost = Math.round(costPerFinishedJob * activeItem.printVolume);

                          return (
                            <div key={mat.id || mIdx} className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-xs">
                              
                              {/* Row Header: Name & Calculation Mode Switch */}
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <div className="flex-1 min-w-[200px] flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center shrink-0">
                                    {mIdx + 1}
                                  </span>
                                  <input
                                    type="text"
                                    value={mat.name}
                                    onChange={(e) => {
                                      const updated = [...(activeItem.finishingMaterials || [])];
                                      updated[mIdx] = { ...updated[mIdx], name: e.target.value };
                                      updateActiveItem({ finishingMaterials: updated });
                                    }}
                                    placeholder="ຊື່ວັດຖຸດິບ ເຊັ່ນ: ລວດເຢັບແມັກ..."
                                    className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                                  />
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...(activeItem.finishingMaterials || [])];
                                        updated[mIdx] = { ...updated[mIdx], calcMode: 'box' };
                                        updateActiveItem({ finishingMaterials: updated });
                                      }}
                                      className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                                        isBoxMode ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                    >
                                      ຄິດໄລ່ຍົກກ່ອງ (Box/Pack)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...(activeItem.finishingMaterials || [])];
                                        updated[mIdx] = { ...updated[mIdx], calcMode: 'unit' };
                                        updateActiveItem({ finishingMaterials: updated });
                                      }}
                                      className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                                        !isBoxMode ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                    >
                                      ລາຄາຕໍ່ໜ່ວຍ (Per Unit)
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFinishingMaterial(mat.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                    title="Remove material"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Calculation Fields Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                                
                                {isBoxMode ? (
                                  <>
                                    <div className="space-y-0.5">
                                      <label className="text-[10px] font-bold text-slate-500 block">ລາຄາຕໍ່ກ່ອງ/ແພັກ (LAK):</label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={mat.packagePrice || 50000}
                                        onChange={(e) => {
                                          const pPrice = Math.max(0, Number(e.target.value));
                                          const uPkg = Number(mat.unitsPerPackage || 1000);
                                          const calculatedUnitCost = uPkg > 0 ? Math.round(pPrice / uPkg) : 0;
                                          const updated = [...(activeItem.finishingMaterials || [])];
                                          updated[mIdx] = { 
                                            ...updated[mIdx], 
                                            packagePrice: pPrice,
                                            unitCost: calculatedUnitCost
                                          };
                                          updateActiveItem({ finishingMaterials: updated });
                                        }}
                                        className="w-full px-2 py-1 border border-slate-200 rounded-lg text-right font-mono font-bold text-xs bg-slate-50"
                                      />
                                    </div>

                                    <div className="space-y-0.5">
                                      <label className="text-[10px] font-bold text-slate-500 block">ຈຳນວນໃນ 1 ກ່ອງ:</label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={mat.unitsPerPackage || 1000}
                                        onChange={(e) => {
                                          const uPkg = Math.max(1, Number(e.target.value));
                                          const pPrice = Number(mat.packagePrice || 50000);
                                          const calculatedUnitCost = Math.round(pPrice / uPkg);
                                          const updated = [...(activeItem.finishingMaterials || [])];
                                          updated[mIdx] = { 
                                            ...updated[mIdx], 
                                            unitsPerPackage: uPkg,
                                            unitCost: calculatedUnitCost
                                          };
                                          updateActiveItem({ finishingMaterials: updated });
                                        }}
                                        className="w-full px-2 py-1 border border-slate-200 rounded-lg text-center font-mono font-bold text-xs bg-slate-50"
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <div className="col-span-2 space-y-0.5">
                                    <label className="text-[10px] font-bold text-slate-500 block">ຕົ້ນທຶນຕໍ່ໜ່ວຍ (LAK/Unit):</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={mat.unitCost}
                                      onChange={(e) => {
                                        const updated = [...(activeItem.finishingMaterials || [])];
                                        updated[mIdx] = { ...updated[mIdx], unitCost: Math.max(0, Number(e.target.value)) };
                                        updateActiveItem({ finishingMaterials: updated });
                                      }}
                                      className="w-full px-2 py-1 border border-slate-200 rounded-lg text-right font-mono font-bold text-xs bg-slate-50"
                                    />
                                  </div>
                                )}

                                <div className="space-y-0.5">
                                  <label className="text-[10px] font-bold text-slate-500 block">ໃຊ້ຕໍ່ 1 ຫົວ/ຊິ້ນ:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={mat.qtyPerItem}
                                    onChange={(e) => {
                                      const updated = [...(activeItem.finishingMaterials || [])];
                                      updated[mIdx] = { ...updated[mIdx], qtyPerItem: Math.max(1, Number(e.target.value)) };
                                      updateActiveItem({ finishingMaterials: updated });
                                    }}
                                    className="w-full px-2 py-1 border border-emerald-300 bg-emerald-50/50 rounded-lg text-center font-mono font-black text-xs text-emerald-950"
                                  />
                                </div>

                                <div className="space-y-0.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex flex-col justify-center text-right">
                                  <span className="text-[9px] text-slate-400 block">
                                    {isBoxMode ? `(${formatCurrency(unitPrice)}/ອັນ × ${mat.qtyPerItem})` : 'ຕົ້ນທຶນລວມ:'}
                                  </span>
                                  <span className="text-xs font-black text-emerald-700 font-mono">
                                    {formatCurrency(totalMatCost)}
                                  </span>
                                </div>

                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddFinishingMaterial()}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{currentLang === 'lo' ? '+ ເພີ່ມວັດຖຸດິບໃໝ່' : '+ Add Custom Material'}</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Right Column: Sticky Internal Cost Studio, Profit Margin & Pricing Dashboard */}
          <div className="lg:col-span-5 lg:sticky lg:top-[5.5rem] space-y-5 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto scrollbar-thin min-w-0 pr-0.5">
            <QuotationCostSummarySidebar
              items={items}
              calculatedItems={calculatedItems}
              activeItemIndex={activeItemIndex}
              setActiveItemIndex={setActiveItemIndex}
              activeItem={activeItem}
              updateActiveItem={updateActiveItem}
              selectedCustomerId={selectedCustomerId}
              grandTotalUnits={grandTotalUnits}
              grandNetCost={grandNetCost}
              grandNetProfit={grandNetProfit}
              grandProfitMargin={grandProfitMargin}
              grandPaperCost={grandPaperCost}
              grandInkCost={grandInkCost}
              grandMachCost={grandMachCost}
              grandPostPressCost={grandPostPressCost}
              grandFinishingCost={grandFinishingCost}
              grandLaborCost={grandLaborCost}
              grandPackagingCost={grandPackagingCost}
              finalGrandTotal={finalGrandTotal}
              quotationLaborMode={activeItem.laborMode || 'percent'}
              setQuotationLaborMode={(mode) => updateActiveItem({ laborMode: mode })}
              quotationLaborPercent={activeItem.laborPercent !== undefined ? activeItem.laborPercent : 15}
              setQuotationLaborPercent={(pct) => updateActiveItem({ laborPercent: pct })}
              quotationLaborCostManual={activeItem.laborCostManual || 50000}
              setQuotationLaborCostManual={(cash) => updateActiveItem({ laborCostManual: cash })}
              quotationSetupFee={quotationSetupFee}
              setQuotationSetupFee={setQuotationSetupFee}
              quotationPackagingCost={quotationPackagingCost}
              setQuotationPackagingCost={setQuotationPackagingCost}
              taxMode={taxMode}
              setTaxMode={setTaxMode}
              taxRate={taxRate}
              setTaxRate={setTaxRate}
              shippingMethod={shippingMethod}
              setShippingMethod={setShippingMethod}
              shippingFee={shippingFee}
              setShippingFee={setShippingFee}
              currentLang={currentLang}
              formatCurrency={formatCurrency}
              onSaveDraft={handleSaveDraft}
              onProceedToQuote={() => {
                setCurrentStep('quote');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 STEP 2: OFFICIAL CUSTOMER QUOTATION DOCUMENT & ACTIONS                 */}
      {/* ========================================================================= */}
      {currentStep === 'quote' && (
        <QuotationCustomerView
          items={items}
          calculatedItems={calculatedItems}
          selectedCustomerId={selectedCustomerId}
          customerPhone={customerPhone}
          customerAddress={customerAddress}
          customers={customers}
          quotationExpiry={quotationExpiry}
          paymentTerms={paymentTerms}
          shippingMethod={shippingMethod}
          shippingFee={shippingFee}
          quotationNote={quotationNote}
          grandSubtotal={grandSubtotal}
          taxEnabled={taxEnabled}
          taxMode={taxMode}
          taxRate={taxRate}
          taxAmount={taxAmount}
          finalGrandTotal={finalGrandTotal}
          currentLang={currentLang}
          formatCurrency={formatCurrency}
          onBackToCalc={() => setCurrentStep('calc')}
          onSaveQuotation={handleSaveQuotation}
          onShareQuotation={() => setIsShareModalOpen(true)}
          onExportPDF={handleExportPDF}
          onConfirmOrder={handleConfirmOrder}
        />
      )}

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

      {/* 🌟 SAVE QUOTATION & PRICING SCHEME POPUP MODAL */}
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

      {/* 🌟 DIGITAL CUSTOMER SHAREABLE QUOTATION MODAL */}
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

      {/* 🌟 SAVE AS NEW PRICING TEMPLATE MODAL */}
      <QuotationSaveTemplateModal
        isOpen={isNewTemplateModalOpen}
        onClose={() => setIsNewTemplateModalOpen(false)}
        onSave={handleSaveCustomTemplate}
        templateForm={newTemplateForm}
        onFormChange={setNewTemplateForm}
        activeItem={activeItem}
        currentLang={currentLang}
      />

      {/* 🌟 PREFLIGHT ITEM CREATION MODAL */}
      <PreflightItemCreationModal
        isOpen={isPreflightModalOpen}
        onClose={() => setIsPreflightModalOpen(false)}
        onConfirm={handleConfirmPreflightItem}
        onSkip={handleSkipPreflightItem}
        currentLang={currentLang}
      />

      {/* 🌟 PAPER SUBSTRATE INVENTORY SEARCH MODAL */}
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

      {/* 🌟 PRINTER FLEET SEARCH MODAL */}
      <PrinterSelectorModal
        isOpen={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
        onSelect={handleSelectPrinterFromModal}
        selectedPrinterId={activeItem.selectedPrinterId}
        printers={printers}
        formatCurrency={formatCurrency}
        getPrinterMachineRate={getPrinterMachineRate}
      />

      {/* 🌟 POST-PRESS MACHINERY SEARCH MODAL */}
      <PostPressSelectorModal
        isOpen={isPostPressModalOpen}
        onClose={() => setIsPostPressModalOpen(false)}
        onSelect={handleTogglePostPressFromModal}
        selectedEquipmentIds={activeItem.selectedPostPressIds || []}
        equipmentList={postPressEquipment}
        formatCurrency={formatCurrency}
      />

      {/* 🌟 FINISHING MATERIALS & CONSUMABLES INVENTORY SEARCH MODAL */}
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
