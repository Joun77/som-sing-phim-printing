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
  Palette,
  X
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

  const papers = inventory.filter(item => item.category === 'Paper');
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
    setItems(prev => prev.map((it, idx) => idx === activeItemIndex ? { ...it, ...patch } : it));
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
  const [isQuotationListOpen, setIsQuotationListOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    
    const paperItem = inventory.find(p => p.id === item.paperId);
    let parentW = 297;
    let parentH = 420;
    if (paperItem?.name.includes('A4')) { parentW = 210; parentH = 297; }
    else if (paperItem?.name.includes('A3')) { parentW = 297; parentH = 420; }
    
    const curW = Number(jobW) + (Number(bleedMargin) * 2);
    const curH = Number(jobH) + (Number(bleedMargin) * 2);
    const portraitCuts = Math.floor(parentW / curW) * Math.floor(parentH / curH);
    const landscapeCuts = Math.floor(parentW / curH) * Math.floor(parentH / curW);
    const cutsPerSheet = Math.max(1, portraitCuts, landscapeCuts);
    const parentSheetsNeeded = Math.ceil(item.printVolume / cutsPerSheet);

    const tier = spoilageTiers.find(t => item.printVolume >= t.min && item.printVolume <= t.max);
    const itemSpoilageRate = tier ? tier.rate : 5;
    const wastedSheets = Math.ceil(parentSheetsNeeded * (itemSpoilageRate / 100));
    const totalParentSheets = parentSheetsNeeded + wastedSheets;

    const paperUnitCost = paperItem
      ? (Number(paperItem.costPerSheet) || Number(paperItem.costPerConsumptionUnit) || Number(paperItem.unitCost) || 190)
      : (getFIFOCostPerSheet(item.paperId, totalParentSheets) || 190);
    const paperCost = Math.round(paperUnitCost * totalParentSheets);

    const isMono = item.colorPrintMode === 'MONO_K';
    const cCov = isMono ? 0 : (item.coverageMode === 'advanced' ? item.cCoverage : item.avgCoverage);
    const mCov = isMono ? 0 : (item.coverageMode === 'advanced' ? item.mCoverage : item.avgCoverage);
    const yCov = isMono ? 0 : (item.coverageMode === 'advanced' ? item.yCoverage : item.avgCoverage);
    const kCov = item.coverageMode === 'advanced' ? item.kCoverage : item.avgCoverage;

    const A4_AREA = 210 * 297;
    const areaFactor = (Number(jobW) * Number(jobH)) / A4_AREA;
    const sideFactor = item.isDoubleSided ? 2 : 1;

    const cyanMl = (0.05 * (cCov / 5) * areaFactor * item.printVolume * sideFactor);
    const magentaMl = (0.05 * (mCov / 5) * areaFactor * item.printVolume * sideFactor);
    const yellowMl = (0.05 * (yCov / 5) * areaFactor * item.printVolume * sideFactor);
    const blackMl = (0.06 * (kCov / 5) * areaFactor * item.printVolume * sideFactor);
    const inkCost = Math.round((cyanMl * 250) + (magentaMl * 250) + (yellowMl * 250) + (blackMl * 250));

    const activePrn = equipment.find(e => e.id === item.selectedPrinterId);
    const machPrice = Number(activePrn?.price || activePrn?.purchasePrice || 0);
    const maintRate = Number((activePrn as any)?.maintenanceRatePercent || 20);
    const lifePages = Number((activePrn as any)?.expectedLifeA4Pages || 500000);
    const machDepr = lifePages > 0 ? Math.round(((machPrice * (1 + maintRate / 100)) / lifePages) * areaFactor * item.printVolume) : 0;
    const electricityCost = Math.round(item.printVolume * 40);
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
  const finalGrandTotal = grandSubtotal + taxAmount;
  const grandNetProfit = finalGrandTotal - grandNetCost;
  const grandProfitMargin = finalGrandTotal > 0 ? (grandNetProfit / finalGrandTotal) * 100 : 0;

  // Credit check warnings
  const creditStatus = checkCreditLimit(selectedCustomerId, finalGrandTotal);

  // Export PDF template triggers standard window print
  const handleExportPDF = () => {
    window.print();
  };

  // Confirm order and deduct FIFO stock for ALL items
  const handleConfirmOrder = () => {
    const msg = currentLang === 'lo'
      ? `ຢືນຢັນການບັນທຶກອໍເດີ (${items.length} ລາຍການ) ແລະ ຕັດສະຕ໋ອກສິນຄ້າ FIFO? ຍອດລວມ: ${formatCurrency(finalGrandTotal)}`
      : `Confirm order creation (${items.length} items) and auto-deduct FIFO stock? Total: ${formatCurrency(finalGrandTotal)}`;

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
        notes: `Multi-Item Quotation Order (${items.length} items): ${items.map(i => `${i.name} (${i.printVolume} units)`).join(', ')}. Payment terms: ${paymentTerms}. ${quotationNote ? `Note: ${quotationNote}` : ''}`,
      }, true);

      showToast(
        currentLang === 'lo' ? `ບັນທຶກອໍເດີ (${items.length} ລາຍການ) ແລະ ຕັດສະຕ໋ອກສິນຄ້າສຳເລັດ!` : `Order with ${items.length} items confirmed and inventory deducted!`,
        'success'
      );
    });
  };

  // Save current quotation to history with versioning
  const handleSaveQuotation = () => {
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
      customerName: selectedCustomerId,
      phone: customerPhone || customers.find(c => c.name === selectedCustomerId)?.phone || '',
      items: quoteItems,
      subtotal: grandSubtotal,
      discountPercent: Number(activeItem.discountPercent || 0),
      taxEnabled,
      taxRate: Number(taxRate),
      taxMode,
      taxOverrideAmount: Number(taxOverrideAmount),
      taxAmount,
      grandTotal: finalGrandTotal,
      expiresAt: quotationExpiry,
      paymentTerms,
      notes: quotationNote,
      status: 'Pending',
      version: 1
    };
    addQuotation(quoteData);
    showToast(
      currentLang === 'lo' ? 'ບັນທຶກໃບສະເໜີລາຄາສຳເລັດ!' : 'Quotation saved successfully!',
      'success'
    );
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
    setSelectedCustomerId(quotation.customerName);
    setTaxEnabled(Boolean(quotation.taxEnabled));
    setTaxRate(Number(quotation.taxRate) || 0);
    setTaxMode(quotation.taxMode || 'percent');
    setTaxOverrideAmount(Number(quotation.taxOverrideAmount) || 0);
    setQuotationExpiry(quotation.expiresAt || '2026-08-31');
    setPaymentTerms(quotation.paymentTerms || 'Immediate / Cash');
    setQuotationNote(quotation.notes || '');
    setIsQuotationListOpen(false);
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

      {/* Main Layout grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Side: Inputs Panel (Hide on print) */}
        <div className="xl:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 print:hidden">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-accent-sky" />
              <span>{currentLang === 'lo' ? 'ກຳນົດລາຍລະອຽດງານພິມ' : 'Job Specifications'}</span>
            </h3>
            <span className="text-xs font-black px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
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
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold shrink-0 border border-slate-700 transition"
                  title="Duplicate this item"
                >
                  ສຳເນົາ
                </button>
              </div>
            </div>
            
            {/* PHASE 1: Customer Information (ຂໍ້ມູນລູກຄ້າ) */}
            <div className="space-y-3">
              <div className="border-b pb-2 flex items-center justify-between">
                <h4 className="text-xs font-black text-primary-navy uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-sans text-xs">1</span>
                  <span>PHASE 1: {t('estimator.sec_customer', 'Customer Information')}</span>
                </h4>
              </div>

              {/* Customer Select / Combobox */}
              <CustomerCombobox
                customers={customers}
                valueName={selectedCustomerId}
                valuePhone={customerPhone}
                valueAddress={customerAddress}
                onChange={handleCustomerComboboxChange}
                currentLang={currentLang}
              />
            </div>

            {/* PHASE 2: Job Overview & Production Quantity (ສະຫຼຸບງານ & ຈຳນວນຜະລິດ) */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className="border-b pb-2">
                <h4 className="text-xs font-black text-primary-navy uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-sans text-xs">2</span>
                  <span>PHASE 2: {currentLang === 'lo' ? 'ຈຳນວນທີ່ຕ້ອງການຜະລິດ (Quantity Required)' : 'Quantity Required'}</span>
                </h4>
              </div>

              {/* Print Volume / Quantity Required */}
              <div className="space-y-1.5 p-4 bg-indigo-50/60 border-2 border-indigo-200 rounded-2xl shadow-xs">
                <label className="text-xs font-black text-indigo-950 uppercase tracking-wider block">
                  {currentLang === 'lo' ? `ຈຳນວນທີ່ຕ້ອງການຜະລິດສຳລັບ "${activeItem.name}" *` : `Quantity Required for "${activeItem.name}" *`}
                </label>
                <input
                  type="number"
                  min="1"
                  value={activeItem.printVolume}
                  onChange={(e) => updateActiveItem({ printVolume: Math.max(1, Number(e.target.value)) })}
                  className="w-full min-h-[48px] px-4 py-2 border-2 border-indigo-400 rounded-xl focus:outline-none text-lg font-black font-sans bg-white text-indigo-950 text-center shadow-xs"
                />
              </div>
            </div>

            {/* PHASE 3: Inventory Paper Selection (ການເລືອກເຈ້ຍຈາກຄັງ) */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className="border-b pb-2">
                <h4 className="text-xs font-black text-primary-navy uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-sans text-xs">3</span>
                  <span>PHASE 3: {currentLang === 'lo' ? 'ເລືອກເຈ້ຍຈາກຄັງ (Inventory Paper)' : 'Inventory Paper Selection'}</span>
                </h4>
              </div>

              {/* Paper Selection Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('estimator.paper_select')}</label>
                <select
                  value={activeItem.paperId}
                  onChange={(e) => updateActiveItem({ paperId: e.target.value })}
                  className="w-full min-h-[48px] px-3.5 py-2 border-2 rounded-xl focus:outline-none text-xs bg-white font-semibold font-sans"
                >
                  {papers.map(p => {
                    const price = p.costPerSheet || p.costPerConsumptionUnit || p.unitCost || 1200;
                    const stock = p.stockQty !== undefined ? p.stockQty : (p.stock_qty || 0);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.gsm ? `(${p.gsm} gsm)` : ''} — ຕົ້ນທຶນ: {formatCurrency(price)}/ແຜ່ນ [{stock} in stock]
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Paper Summary Box */}
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
                  <div className="flex justify-between text-amber-800 font-semibold">
                    <span>ເຜື່ອເສຍຫາຍ (Spoilage Tier):</span>
                    <span className="font-sans font-bold">+{activeCalc.wastedSheets.toLocaleString()} ແຜ່ນ</span>
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

            {/* PHASE 4: Printing Process & Ink Setup (ເຄື່ອງພິມ & ລະບົບສີ) */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className="border-b pb-2">
                <h4 className="text-xs font-black text-primary-navy uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-sans text-xs">4</span>
                  <span>PHASE 4: {currentLang === 'lo' ? 'ເຄື່ອງພິມ & ລະບົບສີ (Multi-Printer Setup)' : 'Printing Process & Ink'}</span>
                </h4>
              </div>

              {/* Multi-Printer Manual Allocation */}
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

              {/* Instant Printing & Ink Summary Box */}
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

            {/* PHASE 5: Post-Press Machinery & Asset Linking (ວຽກຫຼັງການພິມ & ເຄື່ອງຈັກໃນຖານຂໍ້ມູນ) */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className="border-b pb-2 flex items-center justify-between">
                <h4 className="text-xs font-black text-primary-navy uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-sans text-xs">5</span>
                  <span>PHASE 5: {currentLang === 'lo' ? 'ວຽກຫຼັງພິມ & ເຄື່ອງຈັກ (Post-Press Machinery)' : 'Post-Press Machinery'}</span>
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                  {postPressEquipment.length} ເຄື່ອງຈັກໃນຖານຂໍ້ມູນ
                </span>
              </div>

              {/* Genuine Post-Press Machines */}
              <div className="space-y-2.5">
                {postPressEquipment.length > 0 ? (
                  postPressEquipment.map((mach) => {
                    const isSelected = (activeItem.selectedPostPressIds || []).includes(mach.id);
                    const rate = Number((mach as any).costPerPage) || Number((mach as any).calculatedCostPerPage) || 300;
                    const subCost = Math.round(rate * Math.max(1, activeItem.printVolume));

                    return (
                      <div 
                        key={mach.id}
                        onClick={() => handleToggleActivePostPress(mach.id)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none flex items-center justify-between ${
                          isSelected 
                            ? 'bg-amber-50/80 border-amber-400 shadow-sm' 
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-5 h-5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                ⚙️ <span className="font-mono text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded text-[11px]">[{mach.id}]</span> {mach.name}
                              </span>
                              {mach.model && (
                                <span className="text-[10px] text-slate-500 font-bold">({mach.model})</span>
                              )}
                            </div>
                            <span className="block text-[10px] text-slate-500 font-bold mt-0.5 font-sans">
                              ຄ່າເສື່ອມ/ຕົ້ນທຶນດຳເນີນງານ: {formatCurrency(rate)} / ຫົວ
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-xs font-black font-sans block ${isSelected ? 'text-amber-950' : 'text-slate-400'}`}>
                            {isSelected ? `+${formatCurrency(subCost)}` : `${formatCurrency(0)}`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium font-sans">
                            ({activeItem.printVolume.toLocaleString()} ຫົວ)
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center text-xs text-slate-500 font-medium">
                    -- ບໍ່ມີເຄື່ອງຈັກຫຼັງການພິມໃນຖານຂໍ້ມູນ --
                  </div>
                )}
              </div>
            </div>

            {/* PHASE 6: Dynamic Labor, Setup & Overhead (ຄ່າແຮງງານ & ຕັ້ງເຄື່ອງແບບໄດນາມິກ) */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className="border-b pb-2 flex items-center justify-between">
                <h4 className="text-xs font-black text-primary-navy uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-sans text-xs">6</span>
                  <span>PHASE 6: ຄ່າແຮງງານ & ຕັ້ງເຄື່ອງ (Labor & Overhead Cost)</span>
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                  {formatCurrency(activeCalc.laborCost)}
                </span>
              </div>

              {/* Mode Selection Tabs */}
              <div className="space-y-3">
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => updateActiveItem({ laborMode: 'percent' })}
                    className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                      activeItem.laborMode === 'percent'
                        ? 'bg-white text-primary-navy shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    📊 ຄິດໄລ່ເປັນເປີເຊັນ (% ຈາກຕົ້ນທຶນ)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateActiveItem({ laborMode: 'manual' })}
                    className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                      activeItem.laborMode === 'manual'
                        ? 'bg-white text-primary-navy shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    💵 ກຳນົດລາຄາເງິນສົດ (Fixed Cash LAK)
                  </button>
                </div>

                {/* Mode 1: Dynamic Percentage Mode */}
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

                    {/* Quick Recommended Preset Chips */}
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
                                ? 'bg-blue-600 text-white shadow-sm'
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
                  /* Mode 2: Fixed Cash LAK Mode */
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

                    {/* Quick Cash Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {[10000, 25000, 50000, 100000, 200000].map((cash) => (
                        <button
                          key={cash}
                          type="button"
                          onClick={() => updateActiveItem({ laborCostManual: cash })}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            activeItem.laborCostManual === cash
                              ? 'bg-slate-800 text-white shadow-sm'
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
            </div>

          </div>
        </div>

        {/* Right Side: Dual-View Summary Dashboard */}
        <div className="xl:col-span-2 space-y-8 print:col-span-3">
          
          {/* Dashboard Dual Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-1">
            
            {/* 🔒 PANEL 1: Internal Cost & Profit Analysis */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6 flex flex-col justify-between print:hidden">
              <div className="space-y-5">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <h3 className="font-black text-sm text-white/70 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span>🔒 ຕົ້ນທຶນພາຍໃນ & ອັດຕາກຳໄລ ({items.length} ລາຍການ)</span>
                  </h3>
                  <span className="text-[10px] font-black text-red-400 bg-red-950/50 border border-red-900/50 px-2 py-0.5 rounded uppercase tracking-wider">
                    ສະເພາະພາຍໃນ
                  </span>
                </div>

                {/* All Items Cost Summary Table */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    ຕາຕະລາງຕົ້ນທຶນທຸກລາຍການສິນຄ້າ:
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
                        <tr>
                          <th className="p-2">ລາຍການ</th>
                          <th className="p-2 text-right">ຈຳນວນ</th>
                          <th className="p-2 text-right">ຕົ້ນທຶນ/ຫົວ</th>
                          <th className="p-2 text-right">ຕົ້ນທຶນລວມ</th>
                          <th className="p-2 text-right">ລາຄາຂາຍລວມ</th>
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
                              className={`cursor-pointer transition ${isAct ? 'bg-indigo-950/60 font-black text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}
                            >
                              <td className="p-2 truncate max-w-[120px]">
                                {idx + 1}. {item.name}
                              </td>
                              <td className="p-2 text-right">{item.printVolume}</td>
                              <td className="p-2 text-right">{formatCurrency(calc.unitCost)}</td>
                              <td className="p-2 text-right text-orange-400 font-bold">{formatCurrency(calc.netCost)}</td>
                              <td className="p-2 text-right text-emerald-400 font-bold">{formatCurrency(calc.sellingPrice)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Subcosts Breakdown of ALL items */}
                <div className="space-y-2.5 text-xs font-semibold pt-2 border-t border-white/10">
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-white/60">1. ລວມຕົ້ນທຶນເຈ້ຍທັງໝົດ:</span>
                    <span className="text-white font-sans font-black">{formatCurrency(grandPaperCost)}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-white/60">2. ລວມຕົ້ນທຶນໝຶກພິມທັງໝົດ:</span>
                    <span className="text-white font-sans font-black">{formatCurrency(grandInkCost)}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-white/60">3. ລວມຄ່າເສື່ອມເຄື່ອງ & ໄຟຟ້າ:</span>
                    <span className="text-white font-sans font-black">{formatCurrency(grandMachCost)}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-white/60">4. ລວມຄ່າເຄື່ອງຈັກຫຼັງພິມ:</span>
                    <span className="text-white font-sans font-black">{formatCurrency(grandPostPressCost)}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-white/60">5. ລວມຄ່າແຮງງານ & ຕັ້ງເຄື່ອງ:</span>
                    <span className="text-white font-sans font-black">{formatCurrency(grandLaborCost)}</span>
                  </div>

                  {/* Net Internal Cost for Grand Total */}
                  <div className="flex justify-between text-sm pt-2 text-sky-400 border-t border-white/10 font-black">
                    <span>ລວມຕົ້ນທຶນພາຍໃນສຸດທິທັງໝົດ (Grand Net Cost):</span>
                    <span className="font-sans text-base text-sky-300">{formatCurrency(grandNetCost)}</span>
                  </div>
                </div>

                {/* Profit Margin slider for active item */}
                <div className="space-y-3 bg-black/30 p-4 rounded-2xl border border-white/10 mt-3">
                  <div className="flex justify-between text-xs font-bold text-white/80">
                    <span className="flex items-center gap-1">
                      <Sliders className="w-4 h-4 text-sky-400" />
                      <span>ອັດຕາກຳໄລສຳລັບ "{activeItem.name}":</span>
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

                  <div className="flex justify-between items-center text-xs font-bold pt-1.5 border-t border-white/5">
                    <span className="text-white/70">ກຳໄລລວມທັງໝົດທຸກລາຍການ:</span>
                    <span className="font-sans text-emerald-400 text-base font-black">+{formatCurrency(grandNetProfit)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-white/60">ອັດຕາກຳໄລສະເລ່ຍລວມ:</span>
                    <span className="font-sans text-emerald-400 font-extrabold">{grandProfitMargin.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-white/30 italic font-semibold leading-relaxed border-t border-white/10 pt-3">
                * ຄຳນວນຕົ້ນທຶນແຍກແຕ່ລະລາຍການຕາມຫຼັກ FIFO ແລະ ສັງເຄາະຜົນກຳໄລລວມ Real-time.
              </div>
            </div>

            {/* PANEL 2: Customer Quotation Preview */}
            <div className="bg-white text-slate-800 p-6 rounded-3xl border border-slate-200 shadow-xl space-y-6 flex flex-col justify-between print:border-none print:shadow-none print:p-0">
              
              {/* Quotation Sheet Container */}
              <div className="space-y-5">
                {/* Invoice Letterhead */}
                <div className="flex justify-between items-start border-b-2 border-slate-100 pb-4 print:pb-6">
                  <div>
                    <h4 className="text-2xl font-black text-primary-navy tracking-tight">{t('common.app_name')}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Printing & Packaging Solutions</p>
                    <p className="text-[9px] text-slate-400 font-semibold font-sans mt-1">Tel: +856 20 5566 7788 | Vientiane, Lao PDR</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-slate-100 text-slate-700 font-black px-2.5 py-1 rounded border uppercase tracking-wider print:hidden">Client Quote</span>
                    <p className="text-[10px] font-sans font-bold text-slate-400 mt-2">REF: {Math.floor(Date.now()/1000).toString().slice(-6)}</p>
                    <p className="text-[9px] text-slate-400 font-sans font-bold">{new Date().toISOString().split('T')[0]}</p>
                  </div>
                </div>

                {/* Bill To */}
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 bg-slate-50 p-3.5 rounded-2xl print:bg-white print:border print:p-4">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">{currentLang === 'lo' ? 'ສະເໜີເຖິງ' : 'Quotation To'}</span>
                    <p className="text-slate-800 font-extrabold text-sm">{selectedCustomerId || (currentLang === 'lo' ? 'ລູກຄ້າທົ່ວໄປ' : 'General Customer')}</p>
                    <p className="font-sans mt-0.5">Mobile: {customerPhone || customers.find(c => c.name === selectedCustomerId)?.phone || '020 55889900'}</p>
                  </div>
                  <div className="text-right border-l pl-4">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">{currentLang === 'lo' ? 'ເງື່ອນໄຂການຊຳຣະ' : 'Payment Terms'}</span>
                    <p className="text-slate-800 font-extrabold text-xs">{paymentTerms}</p>
                    <p className="mt-0.5">{currentLang === 'lo' ? 'ມັດຈຳ 50% ເມື່ອສັ່ງງານ' : '50% Deposit / 50% Settlement'}</p>
                  </div>
                </div>

                {/* Itemized spec table for ALL Items in Quotation */}
                <div className="space-y-3">
                  <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">
                    {currentLang === 'lo' ? `ລາຍການສິນຄ້າທີ່ສະເໜີລາຄາ (${items.length} ລາຍການ)` : `Quotation Items (${items.length})`}
                  </span>
                  
                  <div className="space-y-3">
                    {items.map((item, idx) => {
                      const calc = calculatedItems[idx];
                      const paper = inventory.find(p => p.id === item.paperId);
                      return (
                        <div key={item.id} className="text-xs space-y-1.5 border-b pb-3 text-slate-600 font-semibold font-sans">
                          <div className="flex justify-between text-slate-900 font-black">
                            <span>{idx + 1}. {item.name}</span>
                            <span className="text-primary-navy">{formatCurrency(calc.sellingPrice)}</span>
                          </div>
                          <div className="pl-3 space-y-0.5 text-slate-500 font-medium text-[11px]">
                            <p>• Size: {item.jobSizePreset} ({item.jobWidth}x{item.jobHeight}mm) | {paper?.name || 'Standard Paper'}</p>
                            <p>• Printing: {item.colorPrintMode === 'MONO_K' ? 'Black & White (Mono K)' : 'Full Color (CMYK)'} | {item.printVolume} units @ {formatCurrency(calc.unitPrice)}/unit</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Financial calculation display */}
                  <div className="space-y-2 text-xs font-semibold text-slate-600 pt-1.5 font-sans">
                    <div className="flex justify-between">
                      <span>Total Selling Subtotal:</span>
                      <span className="font-sans font-extrabold text-slate-800">{formatCurrency(grandSubtotal)}</span>
                    </div>

                    {/* Flexible Tax Management */}
                    <div className="rounded-2xl border-2 border-slate-200 p-3.5 space-y-3 print:hidden">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <PercentSquare className="w-4 h-4 text-accent-sky" />
                          <span className="text-slate-700 font-extrabold">{currentLang === 'lo' ? 'ພາສີ (Tax)' : 'Tax'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTaxEnabled(!taxEnabled)}
                          className={`w-11 h-6 rounded-full p-0.5 transition ${taxEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          aria-label="Toggle tax"
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow transition ${taxEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {taxEnabled ? (
                        <div className="space-y-3 animate-fade-in">
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setTaxMode('percent')}
                              className={`flex-1 py-2 text-xs font-black rounded-xl border transition ${
                                taxMode === 'percent'
                                  ? 'bg-accent-sky border-accent-sky text-white'
                                  : 'bg-slate-50 border-slate-200 text-slate-500'
                              }`}
                            >
                              {currentLang === 'lo' ? 'ເປີເຊັນ (%)' : 'Percentage (%)'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setTaxMode('override')}
                              className={`flex-1 py-2 text-xs font-black rounded-xl border transition ${
                                taxMode === 'override'
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'bg-slate-50 border-slate-200 text-slate-500'
                              }`}
                            >
                              {currentLang === 'lo' ? 'ຈຳນວນຄົງທີ່' : 'Fixed Amount'}
                            </button>
                          </div>

                          {taxMode === 'percent' ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-500">{currentLang === 'lo' ? 'ອັດຕາພາສີ:' : 'Custom rate:'}</span>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={taxRate}
                                onChange={(e) => setTaxRate(Number(e.target.value))}
                                className="w-24 min-h-[34px] px-2 text-right border-2 rounded-lg text-xs font-black font-sans"
                              />
                              <span className="text-xs font-bold text-slate-500">%</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-500">{currentLang === 'lo' ? 'ຈຳນວນພາສີ:' : 'Fixed tax amount:'}</span>
                              <input
                                type="number"
                                min="0"
                                value={taxOverrideAmount}
                                onChange={(e) => setTaxOverrideAmount(Number(e.target.value))}
                                className="w-32 min-h-[34px] px-2 text-right border-2 rounded-lg text-xs font-black font-sans"
                                placeholder="0"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-600 font-extrabold">
                          {currentLang === 'lo' ? '✓ ປິດພາສີ - ຍອດລວມ = ມູນຄ່າສຸດທິ' : '✓ Tax OFF — Grand Total = Subtotal'}
                        </p>
                      )}
                    </div>

                    {(taxEnabled && taxAmount > 0) && (
                      <div className="flex justify-between">
                        <span>Tax ({taxMode === 'override' ? 'Fixed' : `${taxRate}%`}):</span>
                        <span className="font-sans font-extrabold">{formatCurrency(taxAmount)}</span>
                      </div>
                    )}

                    {/* Final Grand Total */}
                    <div className="flex justify-between items-center border-t-2 border-slate-900 pt-3 text-slate-900 font-black text-sm">
                      <span>Total Grand Total:</span>
                      <span className="text-xl font-black text-primary-navy font-sans">{formatCurrency(finalGrandTotal)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                      <span>Total Units:</span>
                      <span className="font-sans">{grandTotalUnits.toLocaleString()} units</span>
                    </div>

                    {/* Quotation Expiry Date + Payment Terms */}
                    <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-2 print:hidden">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">{currentLang === 'lo' ? 'ໝົດອາຍຸໃບສະເໜີ' : 'Valid Until'}</span>
                        <input
                          type="date"
                          value={quotationExpiry}
                          onChange={(e) => setQuotationExpiry(e.target.value)}
                          className="w-full min-h-[36px] px-2 border-2 rounded-lg text-xs font-bold font-sans"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">{currentLang === 'lo' ? 'ເງື່ອນໄຂຊຳຣະ' : 'Payment Terms'}</span>
                        <select
                          value={paymentTerms}
                          onChange={(e) => setPaymentTerms(e.target.value)}
                          className="w-full min-h-[36px] px-2 border-2 rounded-lg text-xs font-bold bg-white"
                        >
                          <option>Immediate / Cash</option>
                          <option>50% Deposit / 50% on Delivery</option>
                          <option>Net 7 Days</option>
                          <option>Net 30 Days</option>
                        </select>
                      </div>
                    </div>

                    {/* Quotation Notes */}
                    <div className="space-y-1 print:hidden">
                      <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">{currentLang === 'lo' ? 'ໝາຍເຫດ' : 'Quotation Notes'}</span>
                      <input
                        type="text"
                        value={quotationNote}
                        onChange={(e) => setQuotationNote(e.target.value)}
                        placeholder={currentLang === 'lo' ? 'ໝາຍເຫດເພີ່ມເຕີມ...' : 'Additional notes...'}
                        className="w-full min-h-[36px] px-3 border-2 rounded-lg text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quotation action triggers */}
              <div className="flex gap-3 pt-6 border-t border-slate-100 print:hidden">
                <button
                  type="button"
                  onClick={handleSaveQuotation}
                  className="flex-1 flex items-center justify-center gap-2 min-h-[48px] border-2 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-2xl text-sm font-extrabold transition active:scale-95 cursor-pointer"
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>{currentLang === 'lo' ? 'ບັນທຶກໃບສະເໜີ' : 'Save Quotation'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="flex-1 flex items-center justify-center gap-2 min-h-[48px] border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-sm font-extrabold transition active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>{currentLang === 'lo' ? 'ພິມ PDF ໃບສະເໜີ' : 'Export PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-red-600/20 transition active:scale-95 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4 shrink-0" />
                  <span>{currentLang === 'lo' ? 'ຢືນຢັນ & ຕັດສະຕ໋ອກ' : 'Confirm & Deduct'}</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

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
                        quote.status === 'Accepted'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : quote.status === 'Expired'
                          ? 'bg-slate-100 text-slate-500 border-slate-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {quote.status}
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

                  <div className="flex flex-wrap gap-2 pt-1">
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
                    {quote.status === 'Pending' && (
                      <button
                        type="button"
                        onClick={() => handleConvertToOrder(quote)}
                        className="px-3 py-1.5 text-[11px] font-black bg-emerald-600 text-white rounded-xl hover:emerald-700 transition cursor-pointer"
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
