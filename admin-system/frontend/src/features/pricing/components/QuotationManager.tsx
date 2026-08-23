import React, { useState, useEffect } from 'react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';
import CustomerCombobox from '@components/common/CustomerCombobox';
import ItemSpecConfigurator from '@features/orders/components/ItemSpecConfigurator';
import ManualPrinterAllocator from '@features/orders/components/ManualPrinterAllocator';
import { PrinterAllocation } from '@features/orders/types';
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
  Printer
} from 'lucide-react';

const DEFAULT_CMYK_CHANNELS = [
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
  colorPrintMode: 'CMYK' | 'MONO_K';
  coverageMode: 'default' | 'advanced';
  avgCoverage: number;
  cCoverage: number;
  mCoverage: number;
  yCoverage: number;
  kCoverage: number;
  selectedPrinterId: string;
  selectedInkSet: string;
  printerAllocations: PrinterAllocation[];
  selectedPostPressIds: string[];
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
    convertQuotationToOrder,
    currency,
    setCurrency,
    formatCurrency
  } = useApp();
  
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

  const createNewItem = (name = 'ລາຍການສິນຄ້າ 1', specs?: any): QuotationItem => {
    const isMono = specs?.colorMode === 'MONO_K';
    const pages = Number(specs?.pageCount) || 100;
    const covC = specs ? (isMono ? 0 : Number(specs.avgCovC) || 0) : 10;
    const covM = specs ? (isMono ? 0 : Number(specs.avgCovM) || 0) : 10;
    const covY = specs ? (isMono ? 0 : Number(specs.avgCovY) || 0) : 10;
    const covK = specs ? Number(specs.avgCovK) || 0 : 10;
    const defaultPrinter = printers[0] || { id: 'PRN-DEFAULT', name: 'Default Printer' };
    const defaultPaper = papers[0]?.id || '';
    const defaultPostPress = postPressEquipment.length > 0 ? [postPressEquipment[0].id] : [];
    const rate = (defaultPrinter as any).cost_per_page || (defaultPrinter as any).costPerPage || 50;

    const channels = isMono ? [
      { channel_name: 'K', density_pct: covK, is_spot_color: false }
    ] : [
      { channel_name: 'C', density_pct: covC, is_spot_color: false },
      { channel_name: 'M', density_pct: covM, is_spot_color: false },
      { channel_name: 'Y', density_pct: covY, is_spot_color: false },
      { channel_name: 'K', density_pct: covK, is_spot_color: false },
    ];

    return {
      id: `item-${Date.now()}-${Math.random().toString().slice(-4)}`,
      name: specs?.jobName || name,
      paperId: defaultPaper,
      jobSizePreset: specs?.suggestedPaper || 'A4',
      jobWidth: 210,
      jobHeight: 297,
      isDoubleSided: false,
      printVolume: pages,
      colorPrintMode: isMono ? 'MONO_K' : 'CMYK',
      coverageMode: specs ? 'advanced' : 'default',
      avgCoverage: 15,
      cCoverage: covC,
      mCoverage: covM,
      yCoverage: covY,
      kCoverage: covK,
      selectedPrinterId: defaultPrinter.id,
      selectedInkSet: 'Konica C6085 OEM Set',
      printerAllocations: [{
        printer_id: defaultPrinter.id,
        printer_name: defaultPrinter.name || defaultPrinter.id,
        allocated_pages: pages,
        cost_per_page: rate,
        subtotal_cost: pages * rate,
        color_mode: isMono ? 'MONO_K' : 'CMYK',
        average_density_pct: Math.round((covC + covM + covY + covK) / (isMono ? 1 : 4)),
        color_channels: channels,
      }],
      selectedPostPressIds: defaultPostPress,
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
    if (paperItem?.name.includes('A4') || paperItem?.specs?.standardSize === 'A4') { parentW = 210; parentH = 297; }
    else if (paperItem?.name.includes('A3') || paperItem?.specs?.standardSize === 'A3') { parentW = 297; parentH = 420; }
    
    const curW = Number(jobW) + (Number(bleedMargin) * 2);
    const curH = Number(jobH) + (Number(bleedMargin) * 2);
    const portraitCuts = Math.floor(parentW / curW) * Math.floor(parentH / curH);
    const landscapeCuts = Math.floor(parentW / curH) * Math.floor(parentH / curW);
    const cutsPerSheet = Math.max(1, portraitCuts, landscapeCuts);
    const parentSheetsNeeded = Math.ceil(item.printVolume / cutsPerSheet);

    const tier = spoilageTiers.find(t => item.printVolume >= t.min && item.printVolume <= t.max);
    const itemSpoilageRate = (item.spoilagePercent !== undefined && item.spoilagePercent !== null)
      ? Number(item.spoilagePercent)
      : (tier ? tier.rate : 5);
    const wastedSheets = Math.ceil(parentSheetsNeeded * (itemSpoilageRate / 100));
    const totalParentSheets = parentSheetsNeeded + wastedSheets;

    const fifoUnitCost = paperItem ? getFIFOCostPerSheet(paperItem.id, totalParentSheets) : getFIFOCostPerSheet(item.paperId, totalParentSheets);
    const paperUnitCost = fifoUnitCost > 0 
      ? fifoUnitCost 
      : (paperItem 
          ? (Number(paperItem.costPerConsumptionUnit) || Number(paperItem.costPerSheet) || (Number(paperItem.costPerPurchaseUnit) && Number(paperItem.purchaseMultiplier) ? Number(paperItem.costPerPurchaseUnit) / Number(paperItem.purchaseMultiplier) : 0) || Number(paperItem.unitCost) || 184)
          : 184);
    const paperCost = Math.round(paperUnitCost * totalParentSheets);

    const A4_AREA = 210 * 297;
    const areaFactor = (Number(jobW) * Number(jobH)) / A4_AREA;

    let cyanMl = 0;
    let magentaMl = 0;
    let yellowMl = 0;
    let blackMl = 0;
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

      // Ink calculation per allocation (ISO 5% base coverage standard)
      const cAllocMl = 0.05 * (cCov / 5) * areaFactor * allocPages * sideFactor;
      const mAllocMl = 0.05 * (mCov / 5) * areaFactor * allocPages * sideFactor;
      const yAllocMl = 0.05 * (yCov / 5) * areaFactor * allocPages * sideFactor;
      const kAllocMl = 0.06 * (kCov / 5) * areaFactor * allocPages * sideFactor;

      cyanMl += cAllocMl;
      magentaMl += mAllocMl;
      yellowMl += yAllocMl;
      blackMl += kAllocMl;

      // Machine depreciation and electricity calculation per allocation
      const rawPrnId = (alloc.printer_id || '').split('__')[0];
      const prn = equipment.find(e => e.id === rawPrnId || e.id === alloc.printer_id || e.name === alloc.printer_name);
      const prnPrice = Number(prn?.price || prn?.purchasePrice || prn?.purchaseCost || 0);
      const maintRate = Number((prn as any)?.maintenanceRatePercent || 20);
      const lifePages = Number((prn as any)?.expectedLifeA4Pages || (prn as any)?.printedPagesCapacity || 500000);
      const costPerPage = Number(alloc.cost_per_page || (prn as any)?.costPerPage || (prn as any)?.calculatedCostPerPage || 50);

      const deprPerSheet = lifePages > 0 && prnPrice > 0
        ? ((prnPrice * (1 + maintRate / 100)) / lifePages) * areaFactor
        : costPerPage;

      machDepr += Math.round(deprPerSheet * allocPages * sideFactor);
      electricityCost += Math.round(allocPages * sideFactor * 40);
    });

    const inkCost = Math.round((cyanMl * 250) + (magentaMl * 250) + (yellowMl * 250) + (blackMl * 250));
    const machineOverhead = machDepr + electricityCost;

    const postPressCost = (item.selectedPostPressIds || []).reduce((sum, machId) => {
      const mach = equipment.find(e => e.id === machId);
      if (!mach) return sum;
      const rate = Number((mach as any).costPerPage) || Number((mach as any).calculatedCostPerPage) || 300;
      return sum + Math.round(rate * item.printVolume);
    }, 0);

    const directMatMach = paperCost + inkCost + machineOverhead + postPressCost;
    let laborCost = 0;
    if (item.laborMode === 'manual') {
      laborCost = Number(item.laborCostManual || 0);
    } else {
      const pct = Number(item.laborPercent || 15);
      laborCost = Math.round(directMatMach * (pct / 100));
    }

    const netCost = paperCost + inkCost + machineOverhead + postPressCost + laborCost;
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
      cyanMl,
      magentaMl,
      yellowMl,
      blackMl,
      inkCost,
      machineOverhead,
      machDepr,
      electricityCost,
      postPressCost,
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
  const grandLaborCost = calculatedItems.reduce((sum, c) => sum + c.laborCost, 0);
  const grandNetCost = calculatedItems.reduce((sum, c) => sum + c.netCost, 0);
  const grandSubtotal = calculatedItems.reduce((sum, c) => sum + c.sellingPrice, 0);
  const grandTotalUnits = items.reduce((sum, it) => sum + Number(it.printVolume || 0), 0);
  const taxAmount = taxEnabled
    ? (taxMode === 'override' ? Number(taxOverrideAmount || 0) : Math.round(grandSubtotal * (Number(taxRate || 0) / 100)))
    : 0;
  const finalGrandTotal = grandSubtotal + taxAmount + Number(shippingFee || 0);
  const grandNetProfit = (grandSubtotal + taxAmount + Number(shippingFee || 0)) - grandNetCost;
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
              name: `[${item.name}] ⚙️ ${mach.name}`,
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

    const quoteData = {
      title: quotationTitle.trim() || 'ໃບສະເໜີລາຄາງານພິມ',
      isPricingTemplate: isTemplateOption,
      templateCategory: isTemplateOption ? templateCategory : undefined,
      customerName: selectedCustomerId,
      phone: customerPhone || customers.find(c => c.name === selectedCustomerId)?.phone || '',
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

  // Load a saved quotation's financial settings back into the calculator
  const handleLoadQuotation = (quotation: any) => {
    if (quotation.title) setQuotationTitle(quotation.title);
    if (quotation.customerName) setSelectedCustomerId(quotation.customerName);
    setTaxEnabled(Boolean(quotation.taxEnabled));
    setTaxRate(Number(quotation.taxRate) || 0);
    setTaxMode(quotation.taxMode || 'percent');
    setTaxOverrideAmount(Number(quotation.taxOverrideAmount) || 0);
    setQuotationExpiry(quotation.expiresAt || '2026-08-31');
    setPaymentTerms(quotation.paymentTerms || 'Immediate / Cash');
    setQuotationNote(quotation.notes || '');
    if (Array.isArray(quotation.items) && quotation.items.length > 0) {
      setItems(quotation.items);
      setActiveItemIndex(0);
    }
    setIsQuotationListOpen(false);
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
    <div className="space-y-8 animate-fade-in text-slate-800 print:bg-white print:p-0 print:text-black">
      
      {/* Header Card (Hide on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition shrink-0 active:scale-95 cursor-pointer flex items-center justify-center"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-primary-navy tracking-tight">
              {currentLang === 'lo' ? 'ອອກໃບສະເໜີລາຄາ (Quotation Desk)' : 'Quotation Desk'}
            </h2>
            <p className="text-base text-slate-500 font-semibold leading-relaxed">
              {currentLang === 'lo' ? `ຮອງຮັບຫຼາຍລາຍການສິນຄ້າ (${items.length} ລາຍການ), ຕັ້ງສະເປກແຕ່ລະລາຍການອິດສະຫຼະ, ຄຳນວນຕົ້ນທຶນ ແລະ ກຳໄລລວມ` : `Multi-item quotation desk (${items.length} items) with independent specs and unified profit analysis.`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {/* Multi-Currency Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-2xl">
            <Coins className="w-4 h-4 text-slate-400 ml-2" />
            {['LAK', 'THB', 'USD'].map(code => (
              <button
                key={code}
                type="button"
                onClick={() => setCurrency(code)}
                className={`px-3 py-2 rounded-xl text-xs font-black transition ${
                  currency === code
                    ? 'bg-white text-primary-navy shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {code === 'LAK' ? '₭ LAK' : code === 'THB' ? '฿ THB' : '$ USD'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsQuotationListOpen(true)}
            className="flex items-center gap-2 px-4 py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl text-xs font-extrabold hover:bg-slate-50 transition min-h-[48px]"
          >
            <Layers3 className="w-5 h-5 shrink-0 text-accent-sky" />
            <span>{currentLang === 'lo' ? `ໃບສະເໜີ (${quotations.length})` : `Quotations (${quotations.length})`}</span>
          </button>
        </div>
      </div>

      {/* Step Navigation Wizard Bar (Hide on print) */}
      <div className="flex items-center justify-between bg-white p-2.5 rounded-3xl border border-slate-100 shadow-sm print:hidden">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setCurrentStep('calc')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              currentStep === 'calc'
                ? 'bg-primary-navy text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>1. {currentLang === 'lo' ? 'ກຳນົດສະເປກ & ຄຳນວນຕົ້ນທຶນ' : 'Specs & Cost Calculation'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep('quote')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              currentStep === 'quote'
                ? 'bg-primary-navy text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. {currentLang === 'lo' ? 'ໃບສະເໜີລາຄາລູກຄ້າ (Quotation)' : 'Client Quotation Sheet'}</span>
            <span className="px-2 py-0.5 rounded-lg text-[10px] bg-emerald-500/20 text-emerald-600 font-sans">
              {formatCurrency(finalGrandTotal)}
            </span>
          </button>
        </div>

        {currentStep === 'calc' ? (
          <button
            type="button"
            onClick={() => {
              setCurrentStep('quote');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hidden sm:flex items-center gap-2 px-5 py-3 bg-accent-sky hover:bg-sky-500 text-white rounded-2xl text-xs font-black transition cursor-pointer shadow-md shadow-accent-sky/20 active:scale-95"
          >
            <span>{currentLang === 'lo' ? 'ອອກໃບສະເໜີລາຄາ →' : 'Generate Quote →'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentStep('calc')}
            className="hidden sm:flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ແກ້ໄຂສະເປກ/ຕົ້ນທຶນ' : 'Edit Specs & Cost'}</span>
          </button>
        )}
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
          
          {/* Left Column: Job Specifications Panel (Fluid Scrollable Content) */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-7 lg:p-6 xl:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 min-w-0">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-accent-sky" />
                  <span>{currentLang === 'lo' ? 'ກຳນົດລາຍລະອຽດງານພິມ (Specs)' : 'Job Specifications'}</span>
                </h3>
                <p className="text-[11px] font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                  <span className="text-slate-600 font-semibold">🔖 {quotationTitle || (currentLang === 'lo' ? 'ໃບສະເໜີລາຄາງານພິມ' : 'Quotation')}</span>
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

              {/* 🌟 ITEM TABS & MULTI-ITEM MANAGER (ແຖບລາຍການສິນຄ້າໃນໃບສະເໜີ) */}
              <div className="p-4 bg-slate-900 text-white rounded-3xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>ລາຍການສິນຄ້າ ({items.length} ລາຍການ)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
                  >
                    <span>+ ເພີ່ມລາຍການໃໝ່</span>
                  </button>
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
                            ? 'bg-white text-slate-900 border-white shadow-md'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <span>📄 {idx + 1}. {item.name || `ລາຍການ ${idx + 1}`}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans font-bold ${isActive ? 'bg-indigo-100 text-indigo-900' : 'bg-slate-900 text-slate-400'}`}>
                          {item.printVolume} ຫົວ
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveItem(idx);
                            }}
                            className="hover:text-red-500 transition p-0.5"
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
                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 shrink-0">ຊື່ສິນຄ້ານີ້:</span>
                  <input
                    type="text"
                    value={activeItem.name}
                    onChange={(e) => updateActiveItem({ name: e.target.value })}
                    placeholder="ລະບຸຊື່ສິນຄ້າ ເຊັ່ນ: ປຶ້ມພາສາລາວ A4..."
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
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

              {/* Quick Phase Jump Navigation & Expand/Collapse All */}
              <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                  {[
                    { key: 'phase1', label: '1. ລູກຄ້າ', icon: User },
                    { key: 'phase2', label: '2. ຈຳນວນ', icon: Hash },
                    { key: 'phase3', label: '3. ເຈ້ຍ FIFO', icon: FileText },
                    { key: 'phase4', label: '4. ເຄື່ອງພິມ', icon: Printer },
                    { key: 'phase5', label: '5. ຫຼັງພິມ', icon: Wrench },
                    { key: 'phase6', label: '6. ຄ່າແຮງ', icon: Zap },
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
              <div id="sec-phase2" className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition">
                <button
                  type="button"
                  onClick={() => togglePhase('phase2')}
                  className="w-full p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-sans font-black text-xs shadow-xs">2</span>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      {currentLang === 'lo' ? 'ຈຳນວນທີ່ຕ້ອງການຜະລິດ (Quantity)' : 'Quantity Required'}
                    </span>
                    <span className="text-[11px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-sans">
                      📦 {activeItem.printVolume.toLocaleString()} ຫົວ
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
                          {currentLang === 'lo' ? `ຈຳນວນທີ່ຕ້ອງການຜະລິດສຳລັບ "${activeItem.name}" *` : `Quantity Required for "${activeItem.name}" *`}
                        </label>
                        <span className="text-[11px] font-bold text-emerald-700">ກົດເລືອກຈຳນວນດ່ວນດ້ານລຸ່ມໄດ້</span>
                      </div>

                      <input
                        type="number"
                        min="1"
                        value={activeItem.printVolume}
                        onChange={(e) => updateActiveItem({ printVolume: Math.max(1, Number(e.target.value)) })}
                        className="w-full min-h-[48px] px-4 py-2 border-2 border-emerald-400 rounded-xl focus:outline-none text-xl font-black font-sans bg-white text-emerald-950 text-center shadow-xs"
                      />

                      {/* Quick Quantity Preset Chips */}
                      <div className="pt-2 flex flex-wrap gap-1.5 justify-center">
                        {[50, 100, 200, 300, 500, 1000, 2000, 5000].map(qty => (
                          <button
                            key={qty}
                            type="button"
                            onClick={() => updateActiveItem({ printVolume: qty })}
                            className={`px-3 py-1 rounded-xl text-xs font-black font-sans transition cursor-pointer ${
                              activeItem.printVolume === qty
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

              {/* PHASE 3: Inventory Paper Selection (ການເລືອກເຈ້ຍຈາກຄັງ) */}
              <div id="sec-phase3" className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition">
                <button
                  type="button"
                  onClick={() => togglePhase('phase3')}
                  className="w-full p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center font-sans font-black text-xs shadow-xs">3</span>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      {currentLang === 'lo' ? 'ເລືອກເຈ້ຍ & ຂະໜາດຕັດ (Paper & Cut)' : 'Paper & Cut Specs'}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-sky-50 text-sky-700 rounded-lg border border-sky-200 font-sans">
                      📄 {activeCalc.cutsPerSheet} ຕັດ • {formatCurrency(activeCalc.paperCost)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-[11px] font-medium hidden sm:inline">{openPhases.phase3 ? 'ພັບເກັບ' : 'ເປີດເບິ່ງ'}</span>
                    {openPhases.phase3 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {openPhases.phase3 && (
                  <div className="p-4 sm:p-5 border-t border-slate-100 space-y-4 animate-fade-in">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">{t('estimator.paper_select')}</label>
                      <select
                        value={activeItem.paperId}
                        onChange={(e) => updateActiveItem({ paperId: e.target.value })}
                        className="w-full min-h-[48px] px-3.5 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 text-xs bg-white font-semibold font-sans"
                      >
                        {papers.map(p => {
                          const fifoCost = getFIFOCostPerSheet(p.id, 1);
                          const price = fifoCost > 0 
                            ? fifoCost 
                            : (Number(p.costPerConsumptionUnit) || Number(p.costPerSheet) || (Number(p.costPerPurchaseUnit) && Number(p.purchaseMultiplier) ? Number(p.costPerPurchaseUnit) / Number(p.purchaseMultiplier) : 0) || Number(p.unitCost) || 184);
                          const stock = p.stockQty !== undefined ? p.stockQty : (p.stock_qty || 0);
                          const gsm = p.gsm || p.specs?.grammageGsm || p.specs?.grammage;
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} {gsm ? `(${gsm} gsm)` : ''} — ຕົ້ນທຶນ: {formatCurrency(price)}/ແຜ່ນ [{Number(stock).toLocaleString()} in stock]
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="p-4 bg-sky-50/90 border border-sky-200 rounded-2xl text-xs space-y-2.5">
                      <div className="flex justify-between items-center text-sky-950 font-black">
                        <span className="flex items-center gap-1.5">
                          <Scissors className="w-4 h-4 text-sky-600" />
                          <span>ສະຫຼຸບການໃຊ້ເຈ້ຍ ({activeItem.name})</span>
                        </span>
                        <span className="px-2.5 py-0.5 bg-sky-100 text-sky-900 rounded-md font-bold font-sans">
                          {activeCalc.cutsPerSheet} ຊິ້ນ/ແຜ່ນ
                        </span>
                      </div>
                      
                      <div className="text-slate-700 space-y-1.5 font-medium">
                        <div className="flex justify-between">
                          <span>ຕົ້ນທຶນເຈ້ຍຕໍ່ແຜ່ນ (Unit Cost):</span>
                          <span className="font-sans font-bold text-slate-900">{formatCurrency(activeCalc.paperUnitCost)} / ແຜ່ນ</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ຈຳນວນແຜ່ນທີ່ຕ້ອງໃຊ້ (Base Sheets):</span>
                          <span className="font-sans font-bold text-slate-900">{activeCalc.parentSheetsNeeded.toLocaleString()} ແຜ່ນ</span>
                        </div>
                        <div className="space-y-1.5 pt-0.5 border-t border-sky-200/50">
                          <div className="flex justify-between items-center text-amber-800 font-semibold">
                            <span className="flex items-center gap-1.5">
                              <span>ເຜື່ອເສຍຫາຍ (Spoilage Tier):</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-sans">
                                {activeCalc.itemSpoilageRate}% ({activeItem.spoilagePercent !== undefined ? 'Custom' : 'Auto Tier'})
                              </span>
                            </span>
                            <span className="font-sans font-bold text-amber-900">+{activeCalc.wastedSheets.toLocaleString()} ແຜ່ນ</span>
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
                                ? activeItem.spoilagePercent === undefined 
                                : activeItem.spoilagePercent === chip.val;
                              return (
                                <button
                                  key={chip.label}
                                  type="button"
                                  onClick={() => updateActiveItem({ spoilagePercent: chip.val })}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                    isSelected
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : 'bg-white text-slate-600 hover:bg-amber-50 border border-slate-200'
                                  }`}
                                >
                                  {chip.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex justify-between text-slate-900 font-bold border-t border-sky-200/70 pt-1.5">
                          <span>ຈຳນວນແຜ່ນລວມທີ່ຕ້ອງຕັດ (FIFO Draw):</span>
                          <span className="font-sans font-black text-slate-950 text-sm">{activeCalc.totalParentSheets.toLocaleString()} ແຜ່ນ</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-sky-100/80 p-2.5 rounded-xl text-sky-950 font-black border border-sky-200">
                        <span className="text-xs">ມູນຄ່າຕົ້ນທຶນເຈ້ຍລວມ:</span>
                        <span className="text-base font-sans text-sky-950 font-black">{formatCurrency(activeCalc.paperCost)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

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
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 font-sans">
                      🖨️ {activeItem.printerAllocations.length || 1} ເຄື່ອງ • {activeItem.colorPrintMode === 'MONO_K' ? 'Mono K' : 'CMYK'} • {activeItem.isDoubleSided ? '2 ໜ້າ (Duplex)' : '1 ໜ້າ'}
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
                        cost_per_page: (p as any).costPerPage || 50,
                        printerCategory: p.category,
                        colorSchemeType: 'CMYK'
                      }))}
                      onAllocationsChange={(newAllocations) => updateActiveItem({ printerAllocations: newAllocations })}
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
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 font-sans">
                      ⚙️ {activeItem.selectedPostPressIds?.length || 0} ວຽກ • {formatCurrency(activeCalc.postPressCost)}
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
                      <span className="font-bold text-amber-700">{postPressEquipment.length} ເຄື່ອງຈັກພ້ອມໃຊ້</span>
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

              {/* PHASE 6: Dynamic Labor (ຄ່າແຮງງານ & ຕັ້ງເຄື່ອງ) */}
              <div id="sec-phase6" className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition">
                <button
                  type="button"
                  onClick={() => togglePhase('phase6')}
                  className="w-full p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-sans font-black text-xs shadow-xs">6</span>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      {currentLang === 'lo' ? 'ຄ່າແຮງງານ & ຕັ້ງເຄື່ອງ (Labor)' : 'Labor & Overhead'}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 font-sans">
                      ⚡ {activeItem.laborMode === 'percent' ? `${activeItem.laborPercent}%` : formatCurrency(activeItem.laborCostManual)} • {formatCurrency(activeCalc.laborCost)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-[11px] font-medium hidden sm:inline">{openPhases.phase6 ? 'ພັບເກັບ' : 'ເປີດເບິ່ງ'}</span>
                    {openPhases.phase6 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {openPhases.phase6 && (
                  <div className="p-4 sm:p-5 border-t border-slate-100 space-y-3 animate-fade-in">
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                      <button
                        type="button"
                        onClick={() => updateActiveItem({ laborMode: 'percent' })}
                        className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                          activeItem.laborMode === 'percent'
                            ? 'bg-white text-primary-navy shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        📊 ຄິດໄລ່ເປັນເປີເຊັນ (% ຈາກຕົ້ນທຶນ)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateActiveItem({ laborMode: 'manual' })}
                        className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                          activeItem.laborMode === 'manual'
                            ? 'bg-white text-primary-navy shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        💵 ກຳນົດລາຄາເງິນສົດ (Fixed Cash LAK)
                      </button>
                    </div>

                    {activeItem.laborMode === 'percent' ? (
                      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-blue-950">
                            ອັດຕາຄ່າແຮງງານ & ຕັ້ງເຄື່ອງ (%):
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={activeItem.laborPercent}
                              onChange={(e) => updateActiveItem({ laborPercent: Math.max(0, Number(e.target.value)) })}
                              className="w-20 min-h-[38px] px-3 border-2 border-blue-300 rounded-xl text-right font-sans font-black text-blue-950 bg-white text-sm focus:outline-none focus:border-blue-500"
                            />
                            <span className="font-bold text-blue-900 text-xs">%</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-blue-800 block">
                            ຄ່າເປີເຊັນແນະນຳ (Recommended Presets):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: '5% (ເບົາໆ)', val: 5 },
                              { label: '10% (ມາດຕະຖານ)', val: 10 },
                              { label: '⭐ 15% (ແນະນຳ)', val: 15 },
                              { label: '20% (ງານລະອຽດ)', val: 20 },
                              { label: '25% (ພຣີມຽມ)', val: 25 },
                            ].map((preset) => (
                              <button
                                key={preset.val}
                                type="button"
                                onClick={() => updateActiveItem({ laborPercent: preset.val })}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  activeItem.laborPercent === preset.val
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-white text-blue-900 border border-blue-200 hover:bg-blue-100'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="text-[11px] text-blue-900/90 font-medium pt-1 border-t border-blue-200/60 flex justify-between">
                          <span>ຄິດໄລ່ຈາກຕົ້ນທຶນວັດສະດຸ & ເຄື່ອງຈັກ ({formatCurrency(activeCalc.directMatMach)}):</span>
                          <span className="font-sans font-black text-blue-950">+{formatCurrency(activeCalc.laborCost)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-900">
                            ລະບຸຄ່າແຮງງານ & ຕັ້ງເຄື່ອງ (LAK):
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="1000"
                              min="0"
                              value={activeItem.laborCostManual}
                              onChange={(e) => updateActiveItem({ laborCostManual: Math.max(0, Number(e.target.value)) })}
                              className="w-36 min-h-[38px] px-3 border-2 border-slate-300 rounded-xl text-right font-sans font-black text-slate-900 bg-white text-sm focus:outline-none focus:border-indigo-500"
                            />
                            <span className="font-bold text-slate-700 text-xs">₭</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {[10000, 25000, 50000, 100000, 200000].map((cash) => (
                            <button
                              key={cash}
                              type="button"
                              onClick={() => updateActiveItem({ laborCostManual: cash })}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                activeItem.laborCostManual === cash
                                  ? 'bg-slate-800 text-white shadow-xs'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {cash.toLocaleString()} ₭
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Right Column: Sticky Internal Cost Studio, Profit Margin & Pricing Dashboard */}
          <div className="lg:col-span-5 lg:sticky lg:top-4 xl:top-6 space-y-5 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto scrollbar-thin min-w-0 pr-0.5">
            
            {/* 🔒 Executive Cost & Profit Studio */}
            <div className="bg-slate-900 text-white p-5 sm:p-7 rounded-3xl border border-slate-800 shadow-2xl space-y-5">
              
              {/* Studio Header */}
              <div className="flex justify-between items-center border-b border-white/10 pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="font-black text-sm text-white uppercase tracking-wider">
                    🔒 สรุปราคา & ກຳໄລ ({items.length} ລາຍການ)
                  </h3>
                </div>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  Live Financials
                </span>
              </div>

              {/* 🌟 Big Price Hero Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-800/40 to-slate-900 border border-white/10 shadow-inner space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                      ລາຄາສະເໜີຂາຍລວມສຸດທິ (Grand Total):
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-white font-sans tracking-tight mt-0.5">
                      {formatCurrency(finalGrandTotal)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      ລາຄາສະເລ່ຍ/ຫົວ:
                    </span>
                    <span className="text-sm sm:text-base font-black text-emerald-400 font-sans">
                      {formatCurrency(calculatedItems[activeItemIndex]?.unitPrice || 0)}
                    </span>
                  </div>
                </div>

                {/* Net Profit Badge */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/80">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ກຳໄລສຸດທິ (Net Profit):</span>
                  </span>
                  <span className="text-sm font-black text-emerald-300 font-sans">
                    +{formatCurrency(grandNetProfit)} ({grandProfitMargin.toFixed(1)}%)
                  </span>
                </div>

                {/* Visual Segmented Cost Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>ຕົ້ນທຶນ ({((grandNetCost / Math.max(1, finalGrandTotal)) * 100).toFixed(0)}%)</span>
                    <span>ກຳໄລ ({grandProfitMargin.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-700 overflow-hidden flex shadow-inner">
                    <div 
                      style={{ width: `${Math.min(100, (grandPaperCost / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                      className="bg-sky-500 h-full" 
                      title={`Paper: ${formatCurrency(grandPaperCost)}`} 
                    />
                    <div 
                      style={{ width: `${Math.min(100, (grandInkCost / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                      className="bg-purple-500 h-full" 
                      title={`Ink: ${formatCurrency(grandInkCost)}`} 
                    />
                    <div 
                      style={{ width: `${Math.min(100, (grandMachCost / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                      className="bg-amber-500 h-full" 
                      title={`Machine: ${formatCurrency(grandMachCost)}`} 
                    />
                    <div 
                      style={{ width: `${Math.min(100, (grandPostPressCost / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                      className="bg-orange-500 h-full" 
                      title={`Post-Press: ${formatCurrency(grandPostPressCost)}`} 
                    />
                    <div 
                      style={{ width: `${Math.min(100, (grandLaborCost / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                      className="bg-blue-500 h-full" 
                      title={`Labor: ${formatCurrency(grandLaborCost)}`} 
                    />
                    <div 
                      style={{ width: `${Math.min(100, (grandNetProfit / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                      className="bg-emerald-500 h-full" 
                      title={`Profit: ${formatCurrency(grandNetProfit)}`} 
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 text-[9px] text-slate-400 font-bold justify-between pt-0.5">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>ເຈ້ຍ</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>ໝຶກ</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>ເຄື່ອງ</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>ຫຼັງພິມ</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>ຄ່າແຮງ</span>
                    <span className="flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>ກຳໄລ</span>
                  </div>
                </div>
              </div>

              {/* All Items Cost Summary Table */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  ຕາຕະລາງຕົ້ນທຶນທຸກລາຍການສິນຄ້າ:
                </span>
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
                      <tr>
                        <th className="p-2.5 sm:p-3">ລາຍການ</th>
                        <th className="p-2.5 sm:p-3 text-right">ຈຳນວນ</th>
                        <th className="p-2.5 sm:p-3 text-right">ຕົ້ນທຶນ/ຫົວ</th>
                        <th className="p-2.5 sm:p-3 text-right">ຕົ້ນທຶນລວມ</th>
                        <th className="p-2.5 sm:p-3 text-right">ລາຄາຂາຍລວມ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-sans">
                      {items.map((item, idx) => {
                        const calc = calculatedItems[idx];
                        const isAct = idx === activeItemIndex;
                        return (
                          <tr 
                            key={item.id} 
                            onClick={() => setActiveItemIndex(idx)}
                            className={`cursor-pointer transition ${isAct ? 'bg-indigo-950/70 font-black text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}
                          >
                            <td className="p-2.5 sm:p-3 truncate max-w-[85px] sm:max-w-[120px] lg:max-w-[100px] xl:max-w-[130px] 2xl:max-w-[180px]">
                              {idx + 1}. {item.name}
                            </td>
                            <td className="p-2.5 sm:p-3 text-right">{item.printVolume}</td>
                            <td className="p-2.5 sm:p-3 text-right">{formatCurrency(calc.unitCost)}</td>
                            <td className="p-2.5 sm:p-3 text-right text-orange-400 font-bold">{formatCurrency(calc.netCost)}</td>
                            <td className="p-2.5 sm:p-3 text-right text-emerald-400 font-bold">{formatCurrency(calc.sellingPrice)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 🔍 Detailed Cost Inspector (ລາຍລະອຽດຕົ້ນທຶນແຍກໝວດແບບລະອຽດ) */}
              <div className="bg-slate-800/60 rounded-2xl border border-slate-700/80 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => setIsCostDetailsOpen(!isCostDetailsOpen)}
                  className="w-full p-3 flex items-center justify-between hover:bg-slate-800 transition cursor-pointer text-left select-none"
                >
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-black text-white">
                      🔍 ລາຍລະອຽດຕົ້ນທຶນແຍກໝວດ (Cost Breakdown)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-black text-sky-300">
                      {formatCurrency(grandNetCost)}
                    </span>
                    {isCostDetailsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {isCostDetailsOpen && (
                  <div className="p-3.5 pt-1 space-y-2 text-xs border-t border-slate-700/50 animate-fade-in font-medium">
                    <div className="flex justify-between items-center py-1 border-b border-slate-700/40">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                        <span>1. ຕົ້ນທຶນເຈ້ຍ (Paper FIFO):</span>
                      </span>
                      <span className="font-sans font-bold text-white">{formatCurrency(grandPaperCost)}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-700/40">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                        <span>2. ຕົ້ນທຶນໝຶກພິມ (Ink Consumed):</span>
                      </span>
                      <span className="font-sans font-bold text-white">{formatCurrency(grandInkCost)}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-700/40">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span>3. ຄ່າເສື່ອມເຄື່ອງ & ໄຟຟ້າ (Machine & Utility):</span>
                      </span>
                      <span className="font-sans font-bold text-white">{formatCurrency(grandMachCost)}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-700/40">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                        <span>4. ຄ່າເຄື່ອງຈັກຫຼັງພິມ (Post-Press Machinery):</span>
                      </span>
                      <span className="font-sans font-bold text-white">{formatCurrency(grandPostPressCost)}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-700/40">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        <span>5. ຄ່າແຮງງານ & ຕັ້ງເຄື່ອງ (Labor & Setup):</span>
                      </span>
                      <span className="font-sans font-bold text-white">{formatCurrency(grandLaborCost)}</span>
                    </div>

                    <div className="flex justify-between items-center pt-1 text-sky-400 font-black text-xs">
                      <span>ລວມຕົ້ນທຶນພາຍໃນສຸດທິ (Grand Net Cost):</span>
                      <span className="font-sans text-sm text-sky-300">{formatCurrency(grandNetCost)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Profit Margin slider with Quick Chips */}
              <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/10">
                <div className="flex justify-between text-xs font-bold text-white/80">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-sky-400" />
                    <span>ອັດຕາກຳໄລ "{activeItem.name}":</span>
                  </span>
                  <span className="font-sans font-black text-sm text-sky-400">{activeItem.profitMargin || 40}%</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="200"
                  step="5"
                  value={activeItem.profitMargin || 40}
                  onChange={(e) => updateActiveItem({ profitMargin: Number(e.target.value) })}
                  className="w-full accent-sky-500 cursor-pointer"
                />

                {/* Quick Margin Chips */}
                <div className="flex flex-wrap gap-1.5 justify-between pt-1">
                  {[
                    { label: '25% (Min)', val: 25 },
                    { label: '35% (Std)', val: 35 },
                    { label: '⭐ 45%', val: 45 },
                    { label: '55% (High)', val: 55 },
                    { label: '65% (Prem)', val: 65 },
                  ].map(chip => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => updateActiveItem({ profitMargin: chip.val })}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                        activeItem.profitMargin === chip.val
                          ? 'bg-sky-500 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {grandProfitMargin < 25.0 && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[11px] font-bold flex items-start gap-2 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-black text-amber-300">⚠️ Margin Guard Alert (&lt; 25%)</div>
                      <div className="text-[10px] text-amber-200/80 font-normal">
                        {currentLang === 'lo' 
                          ? 'ກຳໄລຕ່ຳກວ່າ 25% ລະບົບຈະກຳນົດສະຖານະເປັນ REQUIRES_MANAGER_APPROVAL'
                          : 'Margin is under 25%. Requires Manager Approval before order confirmation.'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tax & Logistics Settings */}
              <div className="space-y-3 pt-2 border-t border-white/10 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <PercentSquare className="w-4 h-4 text-sky-400" />
                    <span>ພາສີ (Tax / VAT):</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={taxMode}
                      onChange={(e) => setTaxMode(e.target.value as any)}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white font-bold"
                    >
                      <option value="none">ບໍ່ມີພາສີ (0%)</option>
                      <option value="percent">ເປີເຊັນ (%)</option>
                    </select>
                    {taxMode === 'percent' && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={taxRate}
                          onChange={(e) => setTaxRate(Number(e.target.value))}
                          className="w-14 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 text-right text-xs font-bold text-white font-sans"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Configuration */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-amber-400" />
                    <span>ຄ່າຂົນສົ່ງ (Shipping):</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={shippingMethod}
                      onChange={(e) => setShippingMethod(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-[11px] text-white font-bold max-w-[130px]"
                    >
                      <option value="In-Store Pickup">🏪 ຮັບເອງທີ່ຮ້ານ</option>
                      <option value="Anousith Express">🚚 Anousith</option>
                      <option value="HAL Logistics">🚛 HAL</option>
                      <option value="Mixay Express">📦 Mixay</option>
                      <option value="Direct Delivery">🛵 ສົ່ງຕົງ</option>
                      <option value="Custom">✨ ອື່ນໆ</option>
                    </select>
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      value={shippingFee}
                      onChange={(e) => setShippingFee(Math.max(0, Number(e.target.value)))}
                      placeholder="0 ₭"
                      className="w-20 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 text-right text-xs font-bold text-white font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Big High-Impact Call to Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep('quote');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white rounded-2xl font-black text-sm sm:text-base shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 transition-all transform active:scale-98 cursor-pointer"
                >
                  <span>{currentLang === 'lo' ? 'ກວດສອບ & ອອກໃບສະເໜີລາຄາ' : 'Review & Generate Quotation'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 STEP 2: OFFICIAL CUSTOMER QUOTATION DOCUMENT & ACTIONS                 */}
      {/* ========================================================================= */}
      {currentStep === 'quote' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Actions Floating Bar (Hide on print) */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm print:hidden">
            <button
              type="button"
              onClick={() => setCurrentStep('calc')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{currentLang === 'lo' ? '← ແກ້ໄຂຕົ້ນທຶນ & ສະເປກ' : '← Back to Edit Specs'}</span>
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleSaveQuotation}
                className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-2xl text-xs font-extrabold transition active:scale-95 cursor-pointer"
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>{currentLang === 'lo' ? 'ບັນທຶກ' : 'Save'}</span>
              </button>
              
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-2xl text-xs font-extrabold transition active:scale-95 cursor-pointer"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <span>{currentLang === 'lo' ? 'ລິ້ງອອນລາຍ' : 'Share Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-xs font-extrabold transition active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>{currentLang === 'lo' ? 'ພິມ PDF' : 'Export PDF'}</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmOrder}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-primary-navy hover:bg-slate-900 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-primary-navy/20 transition active:scale-95 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4 shrink-0" />
                <span>{currentLang === 'lo' ? 'ສ້າງອໍເດີ' : 'Create Order'}</span>
              </button>
            </div>
          </div>

          {/* Centered High-Resolution Official Quotation Document */}
          <div className="max-w-4xl mx-auto bg-white text-slate-800 p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xl space-y-8 print:border-none print:shadow-none print:p-0 print:m-0">
            
            {/* Invoice Letterhead */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
              <div>
                <h4 className="text-3xl font-black text-primary-navy tracking-tight">{t('common.app_name')}</h4>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Printing & Packaging Solutions</p>
                <p className="text-xs text-slate-400 font-medium font-sans mt-1">Tel: +856 20 5566 7788 | Vientiane Capital, Lao PDR</p>
              </div>
              <div className="text-right space-y-1">
                <span className="inline-block text-xs bg-slate-900 text-white font-black px-3 py-1 rounded-lg uppercase tracking-wider">
                  QUOTATION
                </span>
                <p className="text-xs font-sans font-bold text-slate-600 mt-2">REF: QT-{Math.floor(Date.now()/1000).toString().slice(-6)}</p>
                <p className="text-xs text-slate-400 font-sans font-semibold">Date: {new Date().toISOString().split('T')[0]}</p>
                <p className="text-xs text-amber-700 font-sans font-bold">Valid Until: {quotationExpiry}</p>
              </div>
            </div>

            {/* Bill To & Terms Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-semibold text-slate-600 bg-slate-50 p-5 rounded-2xl border border-slate-100 print:bg-white print:border-slate-300">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">{currentLang === 'lo' ? 'ສະເໜີເຖິງ (Customer):' : 'Quotation To:'}</span>
                <p className="text-slate-900 font-black text-base">{selectedCustomerId || (currentLang === 'lo' ? 'ລູກຄ້າທົ່ວໄປ' : 'General Customer')}</p>
                <p className="font-sans text-slate-600">Mobile: {customerPhone || customers.find(c => c.name === selectedCustomerId)?.phone || '-'}</p>
                <p className="text-slate-500">{customerAddress || 'Vientiane, Laos'}</p>
              </div>
              <div className="space-y-1 sm:border-l sm:pl-6 border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">{currentLang === 'lo' ? 'ເງື່ອນໄຂການຊຳຣະ (Payment Terms):' : 'Payment Terms:'}</span>
                <p className="text-slate-900 font-black text-sm">{paymentTerms}</p>
                <p className="text-slate-500">{currentLang === 'lo' ? 'ມັດຈຳ 50% ເມື່ອຢືນຢັນສັ່ງຜະລິດ' : '50% Deposit / 50% on Delivery'}</p>
                <p className="text-slate-500 font-sans">Shipping: {shippingMethod} {shippingFee > 0 ? `(${formatCurrency(shippingFee)})` : '(Free/Pickup)'}</p>
              </div>
            </div>

            {/* Itemized Quotation Table */}
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5 w-12 text-center">#</th>
                      <th className="p-3.5">ລາຍລະອຽດສິນຄ້າ (Item Description)</th>
                      <th className="p-3.5 text-center">ຂະໜາດ / ວັດສະດຸ</th>
                      <th className="p-3.5 text-right">ຈຳນວນ</th>
                      <th className="p-3.5 text-right">ລາຄາ/ຫົວ</th>
                      <th className="p-3.5 text-right">ລວມເງິນ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {items.map((item, idx) => {
                      const calc = calculatedItems[idx];
                      const paper = inventory.find(p => p.id === item.paperId);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3.5">
                            <div className="font-black text-slate-900 text-sm">{item.name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {item.colorPrintMode === 'MONO_K' ? 'Black & White (Mono K)' : 'Full Color (CMYK)'}
                              {item.selectedPostPressIds && item.selectedPostPressIds.length > 0 && ` • ${item.selectedPostPressIds.length} finishing processes`}
                            </div>
                          </td>
                          <td className="p-3.5 text-center text-slate-600 font-medium">
                            <div>{item.jobSizePreset} ({item.jobWidth}x{item.jobHeight}mm)</div>
                            <div className="text-[10px] text-slate-400">{paper?.name || 'Standard Paper'}</div>
                          </td>
                          <td className="p-3.5 text-right font-bold text-slate-900">{item.printVolume.toLocaleString()}</td>
                          <td className="p-3.5 text-right font-semibold text-slate-700">{formatCurrency(calc.unitPrice)}</td>
                          <td className="p-3.5 text-right font-black text-slate-950 text-sm">{formatCurrency(calc.sellingPrice)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary & Total */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t-2 border-slate-100 pt-6">
              <div className="w-full sm:w-1/2 space-y-3">
                {quotationNote && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-700 block">ໝາຍເຫດ (Notes):</span>
                    <p className="text-slate-600 font-medium">{quotationNote}</p>
                  </div>
                )}
                <div className="text-[11px] text-slate-400 space-y-0.5 font-sans">
                  <p>• ໃບສະເໜີລາຄານີ້ມີຜົນບັງຄັບໃຊ້ຮອດວັນທີ: {quotationExpiry}</p>
                  <p>• ລາຄານີ້ລວມການກວດສອບຟາຍພິມ Preflight ແລະ ປັບແຕ່ງສີມາດຕະຖານ</p>
                </div>
              </div>

              <div className="w-full sm:w-1/2 space-y-2 text-xs font-semibold text-slate-600 font-sans">
                <div className="flex justify-between border-b pb-1.5">
                  <span>Subtotal ({items.length} items):</span>
                  <span className="font-bold text-slate-900">{formatCurrency(grandSubtotal)}</span>
                </div>
                
                {taxEnabled && (
                  <div className="flex justify-between border-b pb-1.5">
                    <span>Tax / VAT ({taxMode === 'override' ? 'Fixed' : `${taxRate}%`}):</span>
                    <span className="font-bold text-slate-900">{formatCurrency(taxAmount)}</span>
                  </div>
                )}

                {shippingFee > 0 && (
                  <div className="flex justify-between border-b pb-1.5">
                    <span>Shipping ({shippingMethod}):</span>
                    <span className="font-bold text-slate-900">{formatCurrency(shippingFee)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 text-base font-black text-slate-900 border-t-2 border-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-2xl font-black text-primary-navy">{formatCurrency(finalGrandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Official Signatures Blocks */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-10 border-t border-slate-200 text-center text-xs">
              <div className="space-y-8">
                <div className="border-b border-slate-300 pb-1 text-slate-400">................................................</div>
                <p className="font-bold text-slate-700">ຜູ້ຈັດທຳ (Prepared by)</p>
              </div>
              <div className="space-y-8">
                <div className="border-b border-slate-300 pb-1 text-slate-400">................................................</div>
                <p className="font-bold text-slate-700">ຜູ້ອະນຸມັດ (Authorized by)</p>
              </div>
              <div className="space-y-8 col-span-2 sm:col-span-1">
                <div className="border-b border-slate-300 pb-1 text-slate-400">................................................</div>
                <p className="font-bold text-slate-700">ລູກຄ້າຍອມຮັບ (Client Accepted)</p>
              </div>
            </div>

          </div>

          {/* Bottom Floating Action bar for Step 2 */}
          <div className="max-w-4xl mx-auto flex justify-between items-center pt-4 print:hidden">
            <button
              type="button"
              onClick={() => {
                setCurrentStep('calc');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{currentLang === 'lo' ? 'ຍ້ອນກັບໄປແກ້ໄຂ' : 'Back to Edit'}</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmOrder}
              className="px-8 py-3.5 bg-primary-navy hover:bg-slate-900 text-white rounded-2xl text-sm font-black shadow-xl shadow-primary-navy/20 transition active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>{currentLang === 'lo' ? 'ສ້າງອໍເດີຈາກໃບສະເໜີນີ້' : 'Create Order from Quote'}</span>
            </button>
          </div>

        </div>
      )}

      {/* QUOTATION HISTORY / VERSIONING DIALOG */}
      {isQuotationListOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/50 backdrop-blur-md animate-fade-in print:hidden">
          <div className="bg-white max-w-3xl w-full rounded-3xl shadow-2xl p-6 border border-slate-100 flex flex-col justify-between min-h-[400px] max-h-[80vh]">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-2.5">
                <Layers3 className="w-6 h-6 text-accent-sky" />
                <h3 className="text-xl font-black text-slate-900 tracking-wide">
                  {currentLang === 'lo' ? 'ປະຫວັດໃບສະເໜີລາຄາ & ເວີຊັນ' : 'Quotation History & Versions'}
                </h3>
              </div>
              <button
                onClick={() => setIsQuotationListOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {quotations.length === 0 ? (
                <p className="text-center text-slate-400 font-bold py-10">{currentLang === 'lo' ? 'ຍັງບໍ່ມີໃບສະເໜີ' : 'No quotations saved yet'}</p>
              ) : quotations.map(quote => (
                <div key={quote.id} className="p-4 rounded-2xl border border-slate-200 hover:border-accent-sky/40 transition space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900">{quote.quotationNumber}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${
                        quote.status === 'Accepted' || quote.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : quote.status === 'REQUIRES_MANAGER_APPROVAL'
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 animate-pulse'
                          : quote.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : quote.status === 'Expired'
                          ? 'bg-slate-100 text-slate-500 border-slate-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {quote.status === 'REQUIRES_MANAGER_APPROVAL' ? '⚠️ Margin < 25% (Needs Approval)' : quote.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{quote.customerName}</span>
                    </div>
                    <span className="text-sm font-black text-primary-navy font-sans">{formatCurrency(quote.grandTotal)}</span>
                  </div>

                  <div className="space-y-1">
                    {(quote.versions || []).map((v: any) => (
                      <div key={v.version} className="flex justify-between items-center text-[11px] bg-slate-50 rounded-lg px-3 py-1.5">
                        <span className="font-bold text-slate-600">
                          v{v.version} · {v.date} — {v.note}
                        </span>
                        <span className="font-black text-slate-800 font-sans">{formatCurrency(v.total)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleLoadQuotation(quote)}
                      className="px-3 py-1.5 text-[11px] font-black bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition cursor-pointer"
                    >
                      {currentLang === 'lo' ? 'ໂຫຼດໃສ່ເຄື່ອງຄິດເລກ' : 'Load into Calculator'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReviseQuotation(quote.id)}
                      className="px-3 py-1.5 text-[11px] font-black bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-100 transition cursor-pointer"
                    >
                      {currentLang === 'lo' ? `ສ້າງເວີຊັນ v${(quote.version || 0) + 1}` : `Revise → v${(quote.version || 0) + 1}`}
                    </button>
                    {quote.status === 'REQUIRES_MANAGER_APPROVAL' && (
                      <button
                        type="button"
                        onClick={() => setApprovalModalQuote(quote)}
                        className="px-3 py-1.5 text-[11px] font-black bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {currentLang === 'lo' ? 'ອະນຸມັດສ່ວນຫຼຸດ' : 'Review Approval'}
                      </button>
                    )}
                    {(quote.status === 'Pending' || quote.status === 'Approved') && (
                      <button
                        type="button"
                        onClick={() => handleConvertToOrder(quote)}
                        className="px-3 py-1.5 text-[11px] font-black bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition cursor-pointer"
                      >
                        {currentLang === 'lo' ? 'ປ່ຽນເປັນອໍເດີ →' : 'Convert to Order →'}
                      </button>
                    )}
                    {quote.convertedOrderId && (
                      <span className="px-2 py-1.5 text-[10px] font-black text-emerald-600">
                        ✓ {currentLang === 'lo' ? 'ປ່ຽນເປັນອໍເດີແລ້ວ' : 'Converted'} ({quote.convertedOrderId})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsQuotationListOpen(false)}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                {currentLang === 'lo' ? 'ປິດ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGER APPROVAL MODAL */}
      {approvalModalQuote && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-fade-in print:hidden">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl p-6 border border-slate-100 space-y-5">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-6 h-6 text-amber-500" />
                <h3 className="text-xl font-black text-slate-900 tracking-wide">
                  {currentLang === 'lo' ? 'ການອະນຸມັດສ່ວນຫຼຸດ (Sales Manager)' : 'Quotation Discount Approval'}
                </h3>
              </div>
              <button
                onClick={() => { setApprovalModalQuote(null); setApprovalReason(''); }}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500">ເລກທີໃບສະເໜີ (Quote No):</span>
                <span className="font-mono font-black text-slate-900">{approvalModalQuote.quotationNumber}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500">ລູກຄ້າ (Customer):</span>
                <span className="text-slate-800">{approvalModalQuote.customerName}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500">ຍອດລວມຂາຍ (Grand Total):</span>
                <span className="font-mono text-primary-navy font-black">{formatCurrency(approvalModalQuote.grandTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold border-t border-slate-200 pt-2">
                <span className="text-amber-700 font-black">⚠️ ອັດຕາກຳໄລ (Gross Margin):</span>
                <span className="font-mono font-black text-amber-600 px-2 py-0.5 bg-amber-100 rounded-md">
                  {approvalModalQuote.grossProfitMargin !== undefined ? `${Number(approvalModalQuote.grossProfitMargin).toFixed(1)}%` : '< 25.0%'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                {currentLang === 'lo' ? 'ເຫດຜົນ / ໝາຍເຫດການອະນຸມັດ (Reason / Approval Note):' : 'Reason / Note:'}
              </label>
              <textarea
                rows={3}
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                placeholder={currentLang === 'lo' ? 'ເຊັ່ນ: ລູກຄ້າ VIP ໂຄງການໃຫຍ່, ອະນຸມັດສ່ວນຫຼຸດພິເສດ...' : 'e.g., VIP wholesale customer, special project discount...'}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 bg-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t">
              <button
                type="button"
                disabled={isProcessingApproval}
                onClick={() => handleRejectDiscount(approvalModalQuote)}
                className="px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-black transition cursor-pointer"
              >
                {currentLang === 'lo' ? '❌ ປະຕິເສດສ່ວນຫຼຸດ (Reject)' : '❌ Reject Discount'}
              </button>
              <button
                type="button"
                disabled={isProcessingApproval}
                onClick={() => handleApproveDiscount(approvalModalQuote)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md"
              >
                {currentLang === 'lo' ? '✓ ອະນຸມັດສ່ວນຫຼຸດ (Approve Discount)' : '✓ Approve Discount'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 SAVE QUOTATION & PRICING SCHEME POPUP MODAL */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-accent-sky" />
                  <span>{currentLang === 'lo' ? 'ບັນທຶກໃບສະເໜີລາຄາ / ເທມເພລດ' : 'Save Quotation & Scheme'}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {currentLang === 'lo' 
                    ? 'ກຳນົດຊື່ໃບສະເໜີລາຄາ ຫຼື ບັນທຶກເປັນເທມເພລດສຳລັບຈັດສູດລາຄາສິນຄ້າ' 
                    : 'Name this quotation or save as a reusable pricing formula template.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="space-y-4">
              
              {/* Field 1: Quotation / Scheme Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                  {currentLang === 'lo' ? 'ຊື່ໃບສະເໜີລາຄາ / ເທມເພລດສູດລາຄາ *' : 'Quotation / Scheme Title *'}
                </label>
                <input
                  type="text"
                  value={quotationTitle}
                  onChange={(e) => setQuotationTitle(e.target.value)}
                  placeholder={currentLang === 'lo' ? 'ເຊັ່ນ: ໃບສະເໜີລາຄາປຶ້ມ A4 ບໍລິສັດ ABC, ສູດລາຄາສະຕິກເກີ PP...' : 'e.g., PP Sticker A3+ Scheme, A4 Book Quote...'}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                  autoFocus
                />
              </div>

              {/* Field 2: Target Customer Summary */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>{currentLang === 'lo' ? 'ລູກຄ້າ:' : 'Customer:'}</span>
                  <span className="font-black text-slate-900 dark:text-white">{selectedCustomerId || '-'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>{currentLang === 'lo' ? 'ຈຳນວນລາຍການ:' : 'Items Count:'}</span>
                  <span className="font-black text-slate-900 dark:text-white">{items.length} ລາຍການ</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-1.5">
                  <span>{currentLang === 'lo' ? 'ຍອດລວມທັງໝົດ:' : 'Grand Total:'}</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                    {formatCurrency(finalGrandTotal)}
                  </span>
                </div>
              </div>

              {/* Checkbox: Save as Pricing Scheme Template for Web Catalog */}
              <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTemplateOption}
                    onChange={(e) => setIsTemplateOption(e.target.checked)}
                    className="w-4 h-4 rounded text-accent-sky focus:ring-accent-sky cursor-pointer"
                  />
                  <span className="text-xs font-black text-indigo-950 dark:text-indigo-200">
                    {currentLang === 'lo' 
                      ? 'ບັນທຶກເປັນເທມເພລດສູດລາຄາສຳລັບສິນຄ້າໜ້າເວັບ (Web Catalog)' 
                      : 'Save as Web Catalog Pricing Template'}
                  </span>
                </label>

                {isTemplateOption && (
                  <div className="pl-6 space-y-1.5 animate-fade-in">
                    <label className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 block">
                      {currentLang === 'lo' ? 'ໝວດໝູ່ສິນຄ້າທີ່ຈະນຳສູດນີ້ໄປໃຊ້:' : 'Assign to Product Category:'}
                    </label>
                    <select
                      value={templateCategory}
                      onChange={(e) => setTemplateCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="sticker">ສະຕິກເກີ / Sticker & Label</option>
                      <option value="book">ປຶ້ມ & ວາລະສານ / Book & Magazine</option>
                      <option value="marketing">ໃບປິວ & ໂປສເຕີ / Flyer & Poster</option>
                      <option value="stationery">ນາມບັດ & ເອກະສານ / Card & Stationery</option>
                      <option value="package">ກ່ອງ & ບັນຈຸພັນ / Packaging</option>
                      <option value="large-format">ປ້າຍໂຄສະນາ / Vinyl & Signage</option>
                    </select>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveQuotation}
                className="px-6 py-2.5 bg-accent-sky hover:bg-sky-500 text-white rounded-2xl text-xs font-black transition cursor-pointer shadow-lg shadow-accent-sky/30 active:scale-95 flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>{currentLang === 'lo' ? '💾 ຢືນຢັນການບັນທຶກ' : '💾 Confirm Save'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🌟 DIGITAL CUSTOMER SHAREABLE QUOTATION MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-accent-sky" />
                  <span>{currentLang === 'lo' ? 'ແບ່ງປັນໃບສະເໜີລາຄາອອນລາຍ' : 'Share Online Quotation'}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {currentLang === 'lo'
                    ? 'ລູກຄ້າສາມາດເປີດກວດສອບສະເປກ, ຍອດລວມ ແລະ ກົດຢືນຢັນສັ່ງງານຜ່ານມືຖືໄດ້ທັນທີ'
                    : 'Customer can inspect specs, pricing, and confirm orders directly on their mobile device.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setIsShareModalOpen(false); setIsCopiedLink(false); }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content: QR Preview & Link */}
            <div className="space-y-5">
              
              {/* Quotation Brief */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span className="font-bold">{currentLang === 'lo' ? 'ຊື່ໃບສະເໜີ:' : 'Quotation:'}</span>
                  <span className="font-black text-slate-900 dark:text-white">{quotationTitle}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span className="font-bold">{currentLang === 'lo' ? 'ລູກຄ້າ:' : 'Customer:'}</span>
                  <span className="font-black text-slate-900 dark:text-white">{selectedCustomerId || 'Customer'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span className="font-bold">{currentLang === 'lo' ? 'ຈຳນວນລາຍການ:' : 'Total Items:'}</span>
                  <span className="font-sans font-bold text-slate-900 dark:text-white">{items.length} รายการ ({grandTotalUnits.toLocaleString()} units)</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span className="font-black text-slate-900 dark:text-white">{currentLang === 'lo' ? 'ຍອດລວມສຸດທິ:' : 'Grand Total:'}</span>
                  <span className="font-black text-primary-navy dark:text-sky-400 font-mono text-base">
                    {formatCurrency(finalGrandTotal)}
                  </span>
                </div>
              </div>

              {/* QR Code Graphic Mockup */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-3xl space-y-3 shadow-inner">
                <div className="p-3 bg-white rounded-2xl shadow-lg">
                  <QrCode className="w-28 h-28 text-slate-900" />
                </div>
                <p className="text-[11px] font-bold text-slate-300 tracking-wide text-center">
                  📱 {currentLang === 'lo' ? 'ສະແກນ QR Code ເພື່ອເປີດໃບສະເໜີໃນໂທລະສັບ' : 'Scan QR Code to open quotation on mobile'}
                </p>
              </div>

              {/* Shareable Link Input & Copy */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                  {currentLang === 'lo' ? 'ລິ້ງໃບສະເໜີລາຄາ (Customer Web Link)' : 'Customer Web Link'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/quote/view?ref=${encodeURIComponent(selectedCustomerId || 'customer')}&total=${finalGrandTotal}`}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/quote/view?ref=${encodeURIComponent(selectedCustomerId || 'customer')}&total=${finalGrandTotal}`;
                      navigator.clipboard.writeText(link);
                      setIsCopiedLink(true);
                      if (showToast) showToast('ຄັດລອກລິ້ງໃບສະເໜີລາຄາຮຽບຮ້ອຍ!', 'success');
                      setTimeout(() => setIsCopiedLink(false), 3000);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95 ${
                      isCopiedLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-accent-sky hover:bg-sky-500 text-white'
                    }`}
                  >
                    {isCopiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopiedLink ? (currentLang === 'lo' ? 'ຄັດລອກແລ້ວ' : 'Copied') : (currentLang === 'lo' ? 'ຄັດລອກ' : 'Copy')}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  window.open(`/quote/view?ref=${encodeURIComponent(selectedCustomerId || 'customer')}&total=${finalGrandTotal}`, '_blank');
                }}
                className="text-xs font-bold text-accent-sky hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{currentLang === 'lo' ? 'ທົດລອງເປີດມຸມມອງລູກຄ້າ' : 'Open Client View'}</span>
              </button>
              <button
                type="button"
                onClick={() => { setIsShareModalOpen(false); setIsCopiedLink(false); }}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {currentLang === 'lo' ? 'ປິດ' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

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
