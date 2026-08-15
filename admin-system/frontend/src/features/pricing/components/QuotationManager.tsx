import React, { useState, useEffect } from 'react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';
import CustomerCombobox from '@components/common/CustomerCombobox';
import ItemSpecConfigurator from '@features/orders/components/ItemSpecConfigurator';
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
  X
} from 'lucide-react';

export default function QuotationManager({ onConvertToOrder, onBack }) {
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

  // Filter lists
  const papers = inventory.filter(item => item.category === 'Paper');
  const printers = equipment.filter(eq => eq.category === 'Printer');

  // Input states
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.name || '');
  const [customerPhone, setCustomerPhone] = useState(customers[0]?.phone || '');
  const [customerAddress, setCustomerAddress] = useState(customers[0]?.address || '');
  const [selectedPaperId, setSelectedPaperId] = useState(papers[0]?.id || '');
  const [selectedPrinterId, setSelectedPrinterId] = useState(printers[0]?.id || '');

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

  // Auto-fill from CRM redirection
  useEffect(() => {
    if (preselectedCustomerName) {
      setSelectedCustomerId(preselectedCustomerName);
      setPreselectedCustomerName('');
    }
  }, [preselectedCustomerName, setPreselectedCustomerName]);
  
  // Ink sets filtering
  const selectedPrinterObj = equipment.find(e => e.id === selectedPrinterId);
  const supportedInkSets = selectedPrinterObj?.supportedInkSets || ['Konica C6085 OEM Set'];
  const [selectedInkSet, setSelectedInkSet] = useState(supportedInkSets[0] || '');

  // Auto update selected ink set when printer changes
  useEffect(() => {
    if (supportedInkSets && supportedInkSets.length > 0) {
      setSelectedInkSet(supportedInkSets[0]);
    }
  }, [selectedPrinterId]);

  // Ink coverage mode: 'default' (average) vs 'advanced' (cmyk breakdown)
  const [coverageMode, setCoverageMode] = useState('default'); // 'default' or 'advanced'
  const [avgCoverage, setAvgCoverage] = useState(15); // overall percentage (e.g. 15%)
  
  // CMYK Breakdown states
  const [cCoverage, setCCoverage] = useState(10);
  const [mCoverage, setMCoverage] = useState(10);
  const [yCoverage, setYCoverage] = useState(10);
  const [kCoverage, setKCoverage] = useState(10);

  // Printing Sizing & Sidedness
  const [jobSizePreset, setJobSizePreset] = useState('A4'); // A3, A4, A5, A6, Custom
  const [jobWidth, setJobWidth] = useState(210); // in mm
  const [jobHeight, setJobHeight] = useState(297); // in mm
  const [isDoubleSided, setIsDoubleSided] = useState(false);
  const [printVolume, setPrintVolume] = useState(100);

  // Quick settings overrides (Stored locally, pre-populated with high-fidelity defaults)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('paper'); // paper, ink, equipment, finishing

  // 1. Spoilage & Layout Defaults
  const [spoilageTiers, setSpoilageTiers] = useState([
    { min: 0, max: 100, rate: 10 },
    { min: 101, max: 500, rate: 5 },
    { min: 501, max: 999999, rate: 2 }
  ]);
  const [bleedMargin, setBleedMargin] = useState(3); // bleed margin in mm

  // 2. Ink yields default
  const [inkYieldPerMl, setInkYieldPerMl] = useState(50); // pages/ml at 100% coverage

  // 3. Printer & Electricity default overrides
  const [electricityCostPerSheet, setElectricityCostPerSheet] = useState(40); // LAK/sheet
  const [maintenanceCostPerSheet, setMaintenanceCostPerSheet] = useState(60); // LAK/sheet

  // 4. Finishing prices & Operator setups
  const [laminationRatePerSqm, setLaminationRatePerSqm] = useState(12000); // LAK per sqm
  const [setupCostMode, setSetupCostMode] = useState<'fixed' | 'percent'>('fixed');
  const [setupCostFixed, setSetupCostFixed] = useState<number>(50000); // base setup cost (flat LAK, 0 for reprint)
  const [setupCostPercent, setSetupCostPercent] = useState<number>(2); // setup % of order value
  
  const [laborMode, setLaborMode] = useState<'manual' | 'percent' | 'tiered'>('manual');
  const [laborCostManual, setLaborCostManual] = useState<number>(30000); // manual fixed labor fee
  const [laborPercent, setLaborPercent] = useState<number>(10); // flat % labor fee

  // Other Finishing States
  const [hasLamination, setHasLamination] = useState(false);
  const [hasDieCut, setHasDieCut] = useState(false);
  const [bindingType, setBindingType] = useState('none');

  // Paper Format: sheet vs roll
  const [paperFormat, setPaperFormat] = useState<'sheet' | 'roll'>('sheet');
  const [rollPricePerM2, setRollPricePerM2] = useState(2000); // LAK per m² for roll paper

  // Quotation States
  const [profitMargin, setProfitMargin] = useState(40); // Profit Margin in % (Interactive slider)
  const [discountPercent, setDiscountPercent] = useState(0);
  // Flexible Tax Management: optional toggle, custom % rate, or manual override/clear
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxRate, setTaxRate] = useState(7); // custom tax percentage (0/5/7/10...)
  const [taxMode, setTaxMode] = useState('percent'); // 'percent' | 'override'
  const [taxOverrideAmount, setTaxOverrideAmount] = useState(0); // manual fixed tax amount
  const [paymentTerms, setPaymentTerms] = useState('Immediate / Cash');
  // Quotation versioning & expiry
  const [quotationExpiry, setQuotationExpiry] = useState('2026-08-31');
  const [quotationNote, setQuotationNote] = useState('');
  const [isQuotationListOpen, setIsQuotationListOpen] = useState(false);

  // Backend API result state (null = using local fallback)
  const [backendResult, setBackendResult] = useState<Record<string, number> | null>(null);
  const [isBackendCalc, setIsBackendCalc] = useState(false);

  // Helpers

  // Dimensions Map
  const getPresetDimensions = (preset) => {
    switch (preset) {
      case 'A3': return { w: 297, h: 420 };
      case 'A4': return { w: 210, h: 297 };
      case 'A5': return { w: 148, h: 210 };
      case 'A6': return { w: 105, h: 148 };
      default: return { w: jobWidth, h: jobHeight };
    }
  };

  // Update sizes when preset changes
  useEffect(() => {
    if (jobSizePreset !== 'Custom') {
      const { w, h } = getPresetDimensions(jobSizePreset);
      setJobWidth(w);
      setJobHeight(h);
    }
  }, [jobSizePreset]);

  // Dynamic layout calculator: parent sheet size vs job size (portrait/landscape optimization)
  const calculateCutsPerSheet = () => {
    const paperItem = inventory.find(p => p.id === selectedPaperId);
    if (!paperItem) return 1;

    // Estimate parent size based on name/id or default to A3 size
    let parentW = 297;
    let parentH = 420;
    if (paperItem.name.includes('A4')) {
      parentW = 210;
      parentH = 297;
    } else if (paperItem.name.includes('A3')) {
      parentW = 297;
      parentH = 420;
    }

    const currentJobW = Number(jobWidth) + (Number(bleedMargin) * 2);
    const currentJobH = Number(jobHeight) + (Number(bleedMargin) * 2);

    // Portrait Arrangement
    const portraitCuts = Math.floor(parentW / currentJobW) * Math.floor(parentH / currentJobH);
    // Landscape/Rotated Arrangement
    const landscapeCuts = Math.floor(parentW / currentJobH) * Math.floor(parentH / currentJobW);

    const cuts = Math.max(portraitCuts, landscapeCuts);
    return cuts > 0 ? cuts : 1;
  };

  const cutsPerParentSheet = calculateCutsPerSheet();
  const parentSheetsNeeded = Math.ceil(printVolume / cutsPerParentSheet);

  // Spoilage calculation based on volume tiers
  const getActiveSpoilageRate = () => {
    const tier = spoilageTiers.find(t => printVolume >= t.min && printVolume <= t.max);
    return tier ? tier.rate : 5;
  };
  const activeSpoilageRate = getActiveSpoilageRate();
  const wastedSheets = Math.ceil(parentSheetsNeeded * (activeSpoilageRate / 100));
  const totalParentSheetsToUse = parentSheetsNeeded + wastedSheets;

  // ── Paper Area Factor S (same formula as backend: S = W×H / (210×297)) ───────
  const A4_BASELINE_AREA = 210 * 297;
  const areaFactor = (Number(jobWidth) * Number(jobHeight)) / A4_BASELINE_AREA;

  // Base FIFO paper cost from context (for sheet format)
  const paperUnitCost = getFIFOCostPerSheet(selectedPaperId, totalParentSheetsToUse);
  const totalPaperCost = paperFormat === 'roll'
    ? rollPricePerM2 * (Number(jobWidth) / 1000) * (Number(jobHeight) / 1000) * printVolume
    : paperUnitCost * totalParentSheetsToUse;

  // Ink calculation based on selected Ink Set SKU prices
  const activePrinter = equipment.find(e => e.id === selectedPrinterId);

  const getInkSKUsOfSet = (set) => {
    // Prioritize printer's linked material SKU if it represents an ink set or color channel
    const linkedMaterialId = activePrinter?.linkedMaterialSku;
    const linkedItem = inventory.find(i => i.id === linkedMaterialId);

    let setInks = inventory.filter(item => 
      item.category === 'Ink' && 
      (item.inkSet === linkedMaterialId || (linkedItem && item.inkSet === linkedItem.inkSet) || item.inkSet === set)
    );

    // Fallback if none found
    if (setInks.length === 0) {
      setInks = inventory.filter(item => item.category === 'Ink');
    }

    const cyan = setInks.find(i => i.id.toLowerCase().includes('cyan')) || setInks[0];
    const magenta = setInks.find(i => i.id.toLowerCase().includes('magenta')) || setInks[1];
    const yellow = setInks.find(i => i.id.toLowerCase().includes('yellow')) || setInks[2];
    const black = setInks.find(i => i.id.toLowerCase().includes('black')) || setInks[3];
    return { cyan, magenta, yellow, black };
  };

  const inkSKUs = getInkSKUsOfSet(selectedInkSet);

  // Get active pricing (Cost per ml) for each ink item
  const getCostPerMl = (inkItem: any) => {
    if (!inkItem) return 250; // Fallback LAK/ml
    if (inkItem.costPerMl && inkItem.costPerMl > 0) return inkItem.costPerMl;
    const vol = Number(inkItem.volume) || 100;
    const price = Number(inkItem.costPerPurchaseUnit) || Number(inkItem.costPerConsumptionUnit) || 25000;
    return price / (vol || 1);
  };

  const cyanPrice = inkSKUs.cyan ? (inkSKUs.cyan.costPerPurchaseUnit || inkSKUs.cyan.costPerConsumptionUnit || 25000) : 25000;
  const magentaPrice = inkSKUs.magenta ? (inkSKUs.magenta.costPerPurchaseUnit || inkSKUs.magenta.costPerConsumptionUnit || 25000) : 25000;
  const yellowPrice = inkSKUs.yellow ? (inkSKUs.yellow.costPerPurchaseUnit || inkSKUs.yellow.costPerConsumptionUnit || 25000) : 25000;
  const blackPrice = inkSKUs.black ? (inkSKUs.black.costPerPurchaseUnit || inkSKUs.black.costPerConsumptionUnit || 25000) : 25000;

  const cyanCostPerMl = getCostPerMl(inkSKUs.cyan);
  const magentaCostPerMl = getCostPerMl(inkSKUs.magenta);
  const yellowCostPerMl = getCostPerMl(inkSKUs.yellow);
  const blackCostPerMl = getCostPerMl(inkSKUs.black);

  const factor = isDoubleSided ? 2 : 1;
  const cCov = (coverageMode === 'advanced' ? cCoverage : avgCoverage);
  const mCov = (coverageMode === 'advanced' ? mCoverage : avgCoverage);
  const yCov = (coverageMode === 'advanced' ? yCoverage : avgCoverage);
  const kCov = (coverageMode === 'advanced' ? kCoverage : avgCoverage);

  // OEM Baseline Standard Rates (ml/page at 5% A4 coverage)
  // Base Rate = OEM Standard Volume (ml) / OEM Standard ISO Yield (Pages)
  const blackBaseRateMl = (127 / 7500); // Default 0.01693 ml/page
  const colorBaseRateMl = (70 / 6000);  // Default 0.01167 ml/page

  // Total Volume consumed (ml) = BaseRate * (%Cov / 5%) * Factor S * printVolume * factor(double-sided)
  const cyanMl    = colorBaseRateMl * (cCov / 5) * areaFactor * printVolume * factor;
  const magentaMl = colorBaseRateMl * (mCov / 5) * areaFactor * printVolume * factor;
  const yellowMl  = colorBaseRateMl * (yCov / 5) * areaFactor * printVolume * factor;
  const blackMl   = blackBaseRateMl * (kCov / 5) * areaFactor * printVolume * factor;

  // Total Ink Cost = Volume ml * Cost per ml
  const cyanCost    = cyanMl   * cyanCostPerMl;
  const magentaCost = magentaMl * magentaCostPerMl;
  const yellowCost  = yellowMl  * yellowCostPerMl;
  const blackCost   = blackMl   * blackCostPerMl;
  const totalInkCost = cyanCost + magentaCost + yellowCost + blackCost;

  // Step 3: Machine Depreciation Cost (Section 4 formula)
  // (Price Cost * (1 + Maintenance Rate % / 100) / Expected Life A4 Pages) * Factor S
  const machinePriceLak = activePrinter?.price || activePrinter?.purchasePrice || 50000000;
  const maintRate = activePrinter?.maintenanceRatePercent || 20;
  const lifePages = activePrinter?.expectedLifeA4Pages || activePrinter?.lifetimePagesA4 || 500000;
  const deprCost = (machinePriceLak * (1 + maintRate / 100) / lifePages) * areaFactor * printVolume;
  const electricityCost = printVolume * Number(electricityCostPerSheet);
  const maintenanceCost = printVolume * Number(maintenanceCostPerSheet) * areaFactor;
  const totalMachineOverhead = deprCost + electricityCost + maintenanceCost;

  // Finishing Costs
  const sqmPerPage = (jobWidth / 1000) * (jobHeight / 1000);
  const laminationCost = hasLamination 
    ? sqmPerPage * laminationRatePerSqm * printVolume * (isDoubleSided ? 1.5 : 1)
    : 0;

  const flatBindingCost = bindingType === 'staple' ? 2000 
    : bindingType === 'spiral' ? 10000 
    : bindingType === 'glue' ? 15000 
    : 0;

  const dieCutCost = hasDieCut ? printVolume * 300 : 0;
  const totalFinishingCost = laminationCost + flatBindingCost + dieCutCost;

  // Labor & Setup Costs (Unified 3-Mode Labor & Setup Options)
  const directMatMachineCost = totalPaperCost + totalInkCost + totalMachineOverhead + totalFinishingCost;

  let calculatedSetupCost = Number(setupCostFixed || 0);
  if (setupCostMode === 'percent') {
    const pct = Number(setupCostPercent || 2);
    calculatedSetupCost = directMatMachineCost * (pct / 100);
  }

  let calculatedLaborCost = 0;
  if (laborMode === 'manual') {
    calculatedLaborCost = Number(laborCostManual || 0);
  } else if (laborMode === 'percent') {
    const pct = Number(laborPercent || 10);
    calculatedLaborCost = directMatMachineCost * (pct / 100);
  } else {
    // Tiered % based on order value
    let pct = 15;
    if (directMatMachineCost >= 5000000) pct = 7;
    else if (directMatMachineCost >= 1000000) pct = 10;
    calculatedLaborCost = directMatMachineCost * (pct / 100);
  }

  const setupLaborCost = calculatedSetupCost + calculatedLaborCost;

  // ── Local Fallback Calculation (matches backend formula) ─────────────────────
  // Subtotal = all direct costs (no spoilage yet)
  const localSubtotal = totalPaperCost + totalInkCost + totalMachineOverhead + totalFinishingCost + setupLaborCost;
  // Net Internal Cost = Subtotal × (1 + Spoilage%)
  const localSpoilageCost = localSubtotal * (activeSpoilageRate / 100);
  const netInternalCost = localSubtotal + localSpoilageCost;

  // If backend result available, use it; otherwise use local values
  const displayNetCost     = backendResult?.net_internal_cost    ?? netInternalCost;
  const displayPaperCost   = backendResult?.paper_cost           ?? totalPaperCost;
  const displayInkCost     = backendResult?.ink_cost             ?? totalInkCost;
  const displayMachCost    = backendResult?.depreciation_cost    ?? totalMachineOverhead;
  const displayFinCost     = backendResult?.custom_finishing_cost ?? totalFinishingCost;
  const displayLaborCost   = backendResult?.labor_cost           ?? setupLaborCost;
  const displaySpoilage    = backendResult?.spoilage_cost        ?? localSpoilageCost;
  const displayAreaFactor  = backendResult?.area_factor          ?? areaFactor;

  // ── Selling Price: SP = NetCost / (1 − Margin%) ───────────────────────────
  const marginDecimal = Math.min(0.99, Math.max(0, Number(profitMargin) / 100));
  const rawSellingPrice = displayNetCost / (1.0 - marginDecimal);
  const unitSellingPrice = Math.round(rawSellingPrice / printVolume);

  // ── Grand Total Pipeline: Discount → Tax ──────────────────────────────────
  const baseSubtotal = unitSellingPrice * printVolume;
  const discountAmount = baseSubtotal * (Number(discountPercent) / 100);
  const discountedSubtotal = baseSubtotal - discountAmount;

  // Flexible Tax: OFF → Grand Total = Subtotal. ON → % rate OR manual override amount.
  const taxAmount = taxEnabled
    ? (taxMode === 'override'
        ? (Number(taxOverrideAmount) || 0)
        : discountedSubtotal * (Number(taxRate) / 100))
    : 0;
  const finalGrandTotal = discountedSubtotal + taxAmount;

  const netJobProfit = finalGrandTotal - displayNetCost;
  const actualProfitMarginPercent = finalGrandTotal > 0 ? (netJobProfit / finalGrandTotal) * 100 : 0;

  // ── Backend API Call (debounced 350ms) ────────────────────────────────────
  useEffect(() => {
    const avgCovPercent = (cCov + mCov + yCov + kCov) / 4;
    const timer = setTimeout(async () => {
      setIsBackendCalc(true);
      try {
        const payload = {
          job_name: 'Quotation Desk Preview',
          quantity: printVolume || 1,
          paper_sku: selectedPaperId || 'paper-unknown',
          paper_format: paperFormat,
          paper_cost_per_unit: paperUnitCost || 0,
          paper_roll_price_per_m2: paperFormat === 'roll' ? rollPricePerM2 : 0,
          job_width: Number(jobWidth),
          job_height: Number(jobHeight),
          ink_coverage_k_percent: kCov,
          ink_coverage_cmy_percent: avgCovPercent,
          ink_cost_k_per_ml: blackPrice,
          ink_cost_cmy_per_ml: (cyanPrice + magentaPrice + yellowPrice) / 3,
          machine_price: activePrinter?.purchasePrice || 0,
          target_total_pages: activePrinter?.lifetimePagesA4 || 1000000,
          maintenance_cost_per_page: Number(maintenanceCostPerSheet),
          spoilage_percent: activeSpoilageRate / 100,
          overhead_percent: 0.15,
          setup_cost: calculatedSetupCost,
          setup_cost_mode: setupCostMode,
          setup_cost_percent: setupCostPercent,
          labor_mode: laborMode,
          labor_percent: laborPercent,
          labor_cost_manual: laborCostManual,
          target_margin_percent: marginDecimal,
          discount_percent: Number(discountPercent) / 100,
          tax_percent: taxEnabled && taxMode === 'percent' ? Number(taxRate) / 100 : 0,
          target_currency: currency,
        };
        const res = await fetch('/api/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setBackendResult(data);
        } else {
          setBackendResult(null);
        }
      } catch {
        setBackendResult(null); // Fallback to local calculation
      } finally {
        setIsBackendCalc(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [
    printVolume, selectedPaperId, paperFormat, paperUnitCost, rollPricePerM2,
    jobWidth, jobHeight, kCov, cCov, mCov, yCov,
    blackPrice, cyanPrice, magentaPrice, yellowPrice,
    activePrinter, maintenanceCostPerSheet, activeSpoilageRate,
    marginDecimal, discountPercent, taxRate, taxEnabled, taxMode, currency
  ]);

  // Credit check warnings
  const creditStatus = checkCreditLimit(selectedCustomerId, finalGrandTotal);

  // Export PDF template triggers standard window print
  const handleExportPDF = () => {
    window.print();
  };

  // Confirm order and deduct FIFO stock
  const handleConfirmOrder = () => {
    const msg = currentLang === 'lo'
      ? `ຢືນຢັນການບັນທຶກອໍເດີ ແລະ ຕັດສະຕ໋ອກສິນຄ້າ FIFO? ຍອດລວມ: ${formatCurrency(finalGrandTotal)}`
      : `Confirm order creation and auto-deduct FIFO stock? Total: ${formatCurrency(finalGrandTotal)}`;

    askConfirmation(msg, () => {
      // Build order item breakdown
      const orderItems = [
        { id: selectedPaperId, name: `${inventory.find(p => p.id === selectedPaperId)?.name} (Parent Sheets)`, quantity: totalParentSheetsToUse, unitCost: paperUnitCost },
      ];

      // Add ml ink items to order to deduct stock
      if (inkSKUs.cyan && cyanMl > 0) orderItems.push({ id: inkSKUs.cyan.id, name: inkSKUs.cyan.name, quantity: Math.ceil(cyanMl), unitCost: cyanPrice });
      if (inkSKUs.magenta && magentaMl > 0) orderItems.push({ id: inkSKUs.magenta.id, name: inkSKUs.magenta.name, quantity: Math.ceil(magentaMl), unitCost: magentaPrice });
      if (inkSKUs.yellow && yellowMl > 0) orderItems.push({ id: inkSKUs.yellow.id, name: inkSKUs.yellow.name, quantity: Math.ceil(yellowMl), unitCost: yellowPrice });
      if (inkSKUs.black && blackMl > 0) orderItems.push({ id: inkSKUs.black.id, name: inkSKUs.black.name, quantity: Math.ceil(blackMl), unitCost: blackPrice });

      // Add binding item if selected
      if (bindingType !== 'none') {
        const spiralItem = inventory.find(i => i.id.startsWith('spiral'));
        if (spiralItem) {
          orderItems.push({ id: spiralItem.id, name: spiralItem.name, quantity: 1, unitCost: flatBindingCost });
        }
      }

      addOrder({
        customerName: selectedCustomerId,
        phone: customers.find(c => c.name === selectedCustomerId)?.phone || '020 55889900',
        items: orderItems,
        totalPriceCharged: finalGrandTotal,
        depositAmountPaid: finalGrandTotal * 0.5, // 50% deposit
        remainingUnpaidBalance: finalGrandTotal * 0.5,
        paymentMethod: 'BCEL One',
        paymentStatus: 'Deposit Paid',
        status: 'Received',
        notes: `Order created via Cost Calculator. Specifications: Size ${jobSizePreset} (${jobWidth}x${jobHeight}mm), Sidedness: ${isDoubleSided ? 'Double' : 'Single'}-sided, Coverage: ${coverageMode === 'default' ? avgCoverage + '%' : 'CMYK breakdown'}, Printer: ${selectedPrinterObj?.name}. Lamination: ${hasLamination ? 'Yes' : 'No'}, DieCut: ${hasDieCut ? 'Yes' : 'No'}, Binding: ${bindingType}. Payment terms: ${paymentTerms}.`,
      }, true);

      showToast(
        currentLang === 'lo' ? 'ບັນທຶກອໍເດີ ແລະ ຕັດສະຕ໋ອກສິນຄ້າສຳເລັດ!' : 'Order confirmed and inventory deducted!',
        'success'
      );
    });
  };

  // Save current quotation to history with versioning
  const handleSaveQuotation = () => {
    const items = [
      { name: `${inventory.find(p => p.id === selectedPaperId)?.name || 'Paper'} (${parentSheetsNeeded} parent sheets)`, quantity: printVolume, unitPrice: unitSellingPrice },
    ];
    const quoteData = {
      customerName: selectedCustomerId,
      phone: customers.find(c => c.name === selectedCustomerId)?.phone || '',
      items,
      subtotal: baseSubtotal,
      discountPercent: Number(discountPercent),
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
  const handleReviseQuotation = (quotationId) => {
    reviseQuotation(quotationId, finalGrandTotal, `Revision applied: ${currency} ${formatCurrency(finalGrandTotal)}`);
    showToast(
      currentLang === 'lo' ? 'ສ້າງເວີຊັນໃໝ່ສຳເລັດ!' : 'New quotation version created!',
      'success'
    );
  };

  // 1-Click Convert accepted quotation to production order + job ticket
  const handleConvertToOrder = (quotation) => {
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
  const handleLoadQuotation = (quotation) => {
    setSelectedCustomerId(quotation.customerName);
    setDiscountPercent(Number(quotation.discountPercent) || 0);
    setTaxEnabled(Boolean(quotation.taxEnabled));
    setTaxRate(Number(quotation.taxRate) || 0);
    setTaxMode(quotation.taxMode || 'percent');
    setTaxOverrideAmount(Number(quotation.taxOverrideAmount) || 0);
    setQuotationExpiry(quotation.expiresAt || '2026-08-31');
    setPaymentTerms(quotation.paymentTerms || 'Immediate / Cash');
    setQuotationNote(quotation.notes || '');
    setIsQuotationListOpen(false);
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
              {currentLang === 'lo' ? 'ຄຳນວນລະອຽດ, ປັບປ່ຽນອັດຕາກຳໄລ, ອອກໃບສະເໜີ ແລະ ຕັດສະຕ໋ອກ FIFO ໃນຄລິກດຽວ' : 'Estimate print specs, fine-tune profit margins, print quotations, and deduct FIFO stock.'}
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

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-slate-800 text-white rounded-2xl text-base font-extrabold shadow-md hover:bg-slate-900 transition min-h-[48px]"
          >
            <Settings className="w-5 h-5 shrink-0 animate-spin-slow" />
            <span>{currentLang === 'lo' ? 'ຕັ້ງຄ່າສູດຄຳນວນ' : 'Quick Settings'}</span>
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
                ? `ລູກຄ້າ ${selectedCustomerId} ມິດຈຳກັດສິນເຊື່ອ ${formatCurrency(creditStatus.limit)}. ຍອດຄ້າງຊຳຣະປັດຈຸບັນ ${formatCurrency(creditStatus.currentUnpaid)} ລວມກັບໃບບິນນີ້ຈະເປັນ ${formatCurrency(creditStatus.totalPotential)}.`
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
          <h3 className="font-extrabold text-lg text-slate-900 border-b pb-4 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-accent-sky" />
            <span>{currentLang === 'lo' ? 'ກຳນົດລາຍລະອຽດງານພິມ' : 'Job Specifications'}</span>
          </h3>

          <div className="space-y-6">
            
            {/* Section 1: Material & Sizing */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h4 className="text-sm font-extrabold text-primary-navy flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-accent-sky flex items-center justify-center font-sans text-xs">1</span>
                  <span>{t('estimator.sec_material')}</span>
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

              {/* Paper Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('estimator.paper_select')}</label>
                <select
                  value={selectedPaperId}
                  onChange={(e) => setSelectedPaperId(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-2 border-2 rounded-xl focus:outline-none text-sm bg-white font-semibold font-sans"
                >
                  {papers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Paper Format Toggle: Sheet / Roll */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {currentLang === 'lo' ? 'ຮູບແບບກະດາດ (Paper Format)' : 'Paper Format'}
                </label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                  {(['sheet', 'roll'] as const).map(fmt => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setPaperFormat(fmt)}
                      className={`flex-1 py-2.5 text-xs font-black rounded-lg transition ${
                        paperFormat === fmt
                          ? 'bg-white text-accent-sky shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {fmt === 'sheet'
                        ? (currentLang === 'lo' ? '📄 ເຈ້ຍແຜ່ນ (Sheet)' : '📄 Sheet Fed')
                        : (currentLang === 'lo' ? '🗞️ ເຈ້ຍມ້ວນ (Roll)' : '🗞️ Roll Fed')}
                    </button>
                  ))}
                </div>

                {/* Roll-specific price input */}
                {paperFormat === 'roll' && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 animate-fade-in">
                    <span className="text-xs font-bold text-amber-800 block">
                      {currentLang === 'lo' ? 'ລາຄາເຈ້ຍມ້ວນ (LAK / m²)' : 'Roll Paper Price (LAK / m²)'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={rollPricePerM2}
                      onChange={(e) => setRollPricePerM2(Number(e.target.value))}
                      className="w-full min-h-[40px] px-3 border-2 border-amber-300 rounded-xl text-sm font-black font-sans focus:outline-none bg-white"
                    />
                    <p className="text-[10px] text-amber-700 font-semibold font-sans">
                      {currentLang === 'lo'
                        ? `ພື້ນທີ່ (S = ${(areaFactor).toFixed(3)} A4) × ≈ ${formatCurrency(Math.round(rollPricePerM2 * (Number(jobWidth)/1000) * (Number(jobHeight)/1000)))}/ໜ້າ`
                        : `Area Factor S=${(areaFactor).toFixed(3)} → ≈${formatCurrency(Math.round(rollPricePerM2 * (Number(jobWidth)/1000) * (Number(jobHeight)/1000)))}/page`}
                    </p>
                  </div>
                )}

                {/* Area Factor Badge (always visible) */}
                <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <span className="text-xs font-bold text-indigo-700">
                    {currentLang === 'lo' ? 'ຕົວຄູນພື້ນທີ່ເຈ້ຍ (S):' : 'Paper Area Factor (S):'}
                  </span>
                  <span className={`font-black font-sans text-sm px-2 py-0.5 rounded-lg ${
                    isBackendCalc ? 'animate-pulse text-indigo-400 bg-indigo-100' : 'text-indigo-700 bg-indigo-100'
                  }`}>
                    {displayAreaFactor.toFixed(4)}
                    {backendResult ? ' ✓' : ' ~'}
                  </span>
                </div>
              </div>

              {/* Job Sizing Preset */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('estimator.finished_size')}</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {['A3', 'A4', 'A5', 'A6', 'Custom'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setJobSizePreset(preset)}
                      className={`py-2 text-xs font-black rounded-lg border text-center transition ${
                        jobSizePreset === preset 
                          ? 'bg-accent-sky border-accent-sky text-white shadow-sm' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Custom Sizing dimensions input */}
                {jobSizePreset === 'Custom' && (
                  <div className="grid grid-cols-2 gap-4 mt-2 animate-fade-in">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{currentLang === 'lo' ? 'ຄວາມກວ້າງ (mm)' : 'Width (mm)'}</span>
                      <input 
                        type="number"
                        value={jobWidth}
                        onChange={(e) => setJobWidth(Number(e.target.value))}
                        className="w-full min-h-[40px] px-3 border-2 rounded-xl text-xs font-semibold focus:outline-none bg-white font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{currentLang === 'lo' ? 'ຄວາມສູງ (mm)' : 'Height (mm)'}</span>
                      <input 
                        type="number"
                        value={jobHeight}
                        onChange={(e) => setJobHeight(Number(e.target.value))}
                        className="w-full min-h-[40px] px-3 border-2 rounded-xl text-xs font-semibold focus:outline-none bg-white font-sans"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Paper Cut Layout Details Box */}
              <div className="p-4 bg-blue-50/80 border border-blue-100 rounded-2xl text-xs space-y-2.5 mt-3">
                <div className="flex justify-between items-center text-blue-900 font-extrabold">
                  <span className="flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-accent-sky" />
                    <span>{currentLang === 'lo' ? 'ຄິດໄລ່ເລຍ໌ຕັດເຈ້ຍ' : 'Paper Cut Layout'}</span>
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-black font-sans">{cutsPerParentSheet} cuts/sheet</span>
                </div>
                
                <div className="text-blue-800 space-y-1.5 font-semibold leading-relaxed">
                  <div className="flex justify-between">
                    <span>{currentLang === 'lo' ? 'ດຶງເຈ້ຍແຜ່ນໃຫຍ່ຈາກຄັງ:' : 'Parent sheets required:'}</span>
                    <span className="font-sans font-black">{parentSheetsNeeded} {currentLang === 'lo' ? 'ແຜ່ນ' : 'sheets'}</span>
                  </div>
                  <div className="flex justify-between text-blue-700 font-medium">
                    <span>{currentLang === 'lo' ? 'ເຜື່ອເສຍຫາຍຕາມ Tier ປະລິມານພິມ:' : 'Spoilage allowance:'}</span>
                    <span className="font-sans font-extrabold">+{wastedSheets} {currentLang === 'lo' ? 'ແຜ່ນ' : 'sheets'} ({activeSpoilageRate}%)</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200/50 pt-2 font-black text-blue-900">
                    <span>{currentLang === 'lo' ? 'ຍອດຕັດສະຕ໋ອກລວມ (FIFO):' : 'Total Stock draw (FIFO):'}</span>
                    <span className="font-sans text-sm">{totalParentSheetsToUse} {currentLang === 'lo' ? 'ແຜ່ນ' : 'sheets'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Section 2: Printing & Ink Calibration */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="pb-2">
                <h4 className="text-sm font-extrabold text-primary-navy flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-sans text-xs">2</span>
                  <span>{t('estimator.sec_printing')}</span>
                </h4>
              </div>

              {/* Printer Assets Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('estimator.printer')}</label>
                <select
                  value={selectedPrinterId}
                  onChange={(e) => setSelectedPrinterId(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-2 border-2 rounded-xl focus:outline-none text-sm bg-white font-semibold font-sans"
                >
                  {printers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {activePrinter?.linkedMaterialSku && (
                  <p className="text-[10px] text-indigo-500 font-bold mt-1 font-sans">
                    🔗 Linked Ink SKU/Set: {activePrinter.linkedMaterialSku}
                  </p>
                )}
              </div>

              {/* Ink Set Selection - Dynamic Filtered */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('estimator.ink_set')}</label>
                <select
                  value={selectedInkSet}
                  onChange={(e) => setSelectedInkSet(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-2 border-2 rounded-xl focus:outline-none text-sm bg-white font-semibold font-sans"
                >
                  {supportedInkSets.map(set => (
                    <option key={set} value={set}>{set}</option>
                  ))}
                </select>
              </div>

              {/* Sidedness */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('estimator.print_sides')}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDoubleSided(false)}
                    className={`px-3 py-1.5 text-xs font-extrabold rounded-lg border transition ${
                      !isDoubleSided 
                        ? 'bg-accent-sky border-accent-sky text-white' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {t('estimator.single_sided')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDoubleSided(true)}
                    className={`px-3 py-1.5 text-xs font-extrabold rounded-lg border transition ${
                      isDoubleSided 
                        ? 'bg-accent-sky border-accent-sky text-white' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {t('estimator.double_sided')}
                  </button>
                </div>
              </div>

              {/* Coverage Mode Toggle */}
              <div className="space-y-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('estimator.coverage_mode')}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-black uppercase ${coverageMode === 'default' ? 'text-accent-sky' : 'text-slate-400'}`}>Avg</span>
                    <button
                      type="button"
                      onClick={() => setCoverageMode(prev => prev === 'default' ? 'advanced' : 'default')}
                      className={`w-9 h-5 rounded-full p-0.5 transition ${coverageMode === 'advanced' ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition shadow-sm ${coverageMode === 'advanced' ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-[10px] font-black uppercase ${coverageMode === 'advanced' ? 'text-indigo-600' : 'text-slate-400'}`}>CMYK</span>
                  </div>
                </div>

                {/* Default average coverage slider */}
                {coverageMode === 'default' ? (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex justify-between text-xs font-extrabold text-slate-600">
                      <span>{t('estimator.avg_coverage')}</span>
                      <span className="font-sans font-black text-accent-sky text-sm">{avgCoverage}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={avgCoverage}
                      onChange={(e) => setAvgCoverage(Number(e.target.value))}
                      className="w-full accent-accent-sky cursor-pointer"
                    />
                    <div className="grid grid-cols-4 gap-1">
                      {[5, 15, 40, 80].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAvgCoverage(val)}
                          className="py-1 text-[10px] font-bold rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                        >
                          {val}% {val <= 5 ? 'Text' : val <= 15 ? 'Graphic' : val <= 40 ? 'Heavy' : 'Solid'}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5 animate-fade-in text-xs font-bold text-slate-600">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-cyan-700">C (Cyan)</span>
                          <span className="font-sans font-black text-cyan-600">{cCoverage}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={cCoverage} 
                          onChange={(e) => setCCoverage(Number(e.target.value))}
                          className="w-full accent-cyan-600 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-pink-700">M (Magenta)</span>
                          <span className="font-sans font-black text-pink-600">{mCoverage}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={mCoverage} 
                          onChange={(e) => setMCoverage(Number(e.target.value))}
                          className="w-full accent-pink-600 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-amber-700">Y (Yellow)</span>
                          <span className="font-sans font-black text-amber-600">{yCoverage}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={yCoverage} 
                          onChange={(e) => setYCoverage(Number(e.target.value))}
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-800">K (Black)</span>
                          <span className="font-sans font-black text-slate-800">{kCoverage}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={kCoverage} 
                          onChange={(e) => setKCoverage(Number(e.target.value))}
                          className="w-full accent-slate-800 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Section 3: Volume & Finishing Addons */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="pb-2">
                <h4 className="text-sm font-extrabold text-primary-navy flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-sans text-xs">3</span>
                  <span>{t('estimator.sec_volume')}</span>
                </h4>
              </div>

              {/* Print Volume */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('estimator.volume')}</label>
                <input
                  type="number"
                  min="1"
                  value={printVolume}
                  onChange={(e) => setPrintVolume(Number(e.target.value))}
                  className="w-full min-h-[48px] px-3.5 py-2 border-2 rounded-xl focus:outline-none text-sm font-black font-sans"
                />
              </div>

              {/* Finishing checklist */}
              <div className="space-y-3.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('estimator.finishing_title')}</span>
                
                {/* Lamination Checkbox */}
                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 select-none">
                  <input
                    type="checkbox"
                    checked={hasLamination}
                    onChange={(e) => setHasLamination(e.target.checked)}
                    className="w-5 h-5 text-accent-sky rounded border-slate-300 focus:ring-accent-sky cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-extrabold block leading-none">{t('estimator.finishing_lam')}</span>
                    <span className="block text-[10px] text-slate-400 font-bold mt-1 font-sans">
                      +{formatCurrency(laminationRatePerSqm)} / sqm ({formatCurrency(Math.round(sqmPerPage * laminationRatePerSqm))} per page)
                    </span>
                  </div>
                </label>

                {/* Die-Cut Checkbox */}
                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 select-none">
                  <input
                    type="checkbox"
                    checked={hasDieCut}
                    onChange={(e) => setHasDieCut(e.target.checked)}
                    className="w-5 h-5 text-accent-sky rounded border-slate-300 focus:ring-accent-sky cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-extrabold block leading-none">{t('estimator.finishing_cut')}</span>
                    <span className="block text-[10px] text-slate-400 font-bold mt-1 font-sans">+300 ₭ / unit</span>
                  </div>
                </label>

                {/* Binding type select */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('estimator.finishing_binding')}</span>
                  <select
                    value={bindingType}
                    onChange={(e) => setBindingType(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 border-2 rounded-xl focus:outline-none text-xs bg-white font-bold"
                  >
                    <option value="none">No Binding</option>
                    <option value="staple">Staple Binding [+2,000₭]</option>
                    <option value="spiral">Spiral Binding [+10,000₭]</option>
                    <option value="glue">Hot Glue Binding [+15,000₭]</option>
                  </select>
                </div>
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
                  <h3 className="font-extrabold text-sm text-white/50 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span>🔒 INTERNAL COST & YIELDS</span>
                  </h3>
                  <span className="text-[10px] font-black text-red-400 bg-red-950/50 border border-red-900/50 px-2 py-0.5 rounded uppercase tracking-wider">Internal Use Only</span>
                </div>

                {/* Subcosts Breakdown List */}
                <div className="space-y-3.5 text-sm font-semibold">

                  {/* Area Factor S indicator */}
                  <div className="flex justify-between items-center px-3 py-1.5 bg-indigo-950/40 border border-indigo-800/30 rounded-xl text-xs">
                    <span className="text-indigo-300 font-bold">
                      Area Factor S = {displayAreaFactor.toFixed(4)}
                      {isBackendCalc && <span className="ml-1 text-indigo-400 animate-pulse">…</span>}
                      {backendResult && <span className="ml-1 text-emerald-400">⚡ Backend</span>}
                      {!backendResult && !isBackendCalc && <span className="ml-1 text-white/30">~ local</span>}
                    </span>
                    <span className="text-indigo-400 font-sans font-black">
                      {jobSizePreset !== 'Custom' ? jobSizePreset : `${jobWidth}×${jobHeight}mm`}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/60">1. Paper Cost ({paperFormat === 'roll' ? 'Roll/m²' : `${activeSpoilageRate}% Spoilage`}):</span>
                    <div className="text-right">
                      <span className="text-white font-sans font-black block">{formatCurrency(Math.round(displayPaperCost))}</span>
                      {paperFormat === 'sheet'
                        ? <span className="text-[10px] text-white/40 block font-sans">{totalParentSheetsToUse} sheets ({wastedSheets} waste)</span>
                        : <span className="text-[10px] text-amber-400 block font-sans">{formatCurrency(rollPricePerM2)}/m² × {(areaFactor * printVolume * 0.01).toFixed(4)}m²</span>
                      }
                    </div>
                  </div>

                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/60">2. Ink set cost ({coverageMode === 'default' ? 'Average' : 'CMYK'}) ×S:</span>
                    <div className="text-right">
                      <span className="text-white font-sans font-black block">{formatCurrency(Math.round(displayInkCost))}</span>
                      <span className="text-[10px] text-white/40 block font-sans">
                        C:{cyanMl.toFixed(1)}ml M:{magentaMl.toFixed(1)}ml Y:{yellowMl.toFixed(1)}ml K:{blackMl.toFixed(1)}ml
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/60">3. Machine depr. & utility ×S:</span>
                    <div className="text-right">
                      <span className="text-white font-sans font-black block">{formatCurrency(Math.round(displayMachCost))}</span>
                      <span className="text-[10px] text-white/40 block font-sans">
                        S={displayAreaFactor.toFixed(3)} applied to depr + maint
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/60">4. Finishing addons:</span>
                    <div className="text-right">
                      <span className="text-white font-sans font-black block">{formatCurrency(Math.round(displayFinCost))}</span>
                      {hasLamination && <span className="text-[10px] text-emerald-400 block font-sans">Lamination active</span>}
                    </div>
                  </div>

                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/60">5. Operator setups & labor:</span>
                    <div className="text-right">
                      <span className="text-white font-sans font-black block">{formatCurrency(Math.round(displayLaborCost))}</span>
                      <span className="text-[10px] text-white/40 block font-sans">
                        Setup: {formatCurrency(Math.round(calculatedSetupCost))} ({setupCostMode === 'fixed' ? (setupCostFixed === 0 ? '0 LAK Reprint' : 'Fixed') : `${setupCostPercent}%`}) + Labor: {formatCurrency(Math.round(calculatedLaborCost))} ({laborMode === 'manual' ? 'Manual' : laborMode === 'percent' ? `${laborPercent}%` : 'Tiered %'})
                      </span>
                    </div>
                  </div>

                  {/* Spoilage Row */}
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/60">6. Waste / Spoilage ({activeSpoilageRate}%):</span>
                    <span className="text-orange-400 font-sans font-black">+{formatCurrency(Math.round(displaySpoilage))}</span>
                  </div>

                  <div className="flex justify-between text-base pt-2 text-accent-sky border-t border-white/10 font-black">
                    <span>Net Internal Cost (Net Cost):</span>
                    <span className="font-sans">{formatCurrency(Math.round(displayNetCost))}</span>
                  </div>
                </div>

                {/* Profit Margin slider and safety checks */}
                <div className="space-y-3 bg-black/25 p-4 rounded-2xl border border-white/5 mt-4">
                  <div className="flex justify-between text-xs font-bold text-white/70">
                    <span className="flex items-center gap-1">
                      <Sliders className="w-4 h-4 text-accent-sky" />
                      <span>Markup Profit Margin:</span>
                    </span>
                    <span className="font-sans font-black text-sm text-accent-sky">{profitMargin}%</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={profitMargin}
                    onChange={(e) => setProfitMargin(Number(e.target.value))}
                    className="w-full accent-accent-sky cursor-pointer"
                  />

                  <div className="flex justify-between items-center text-xs font-bold pt-1.5 border-t border-white/5">
                    <span className="text-white/60">Est. Profit Yield:</span>
                    <span className="font-sans text-emerald-400 text-base font-black">{formatCurrency(Math.round(netJobProfit))}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-white/60">Margin Status:</span>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${
                      actualProfitMarginPercent >= 30 
                        ? 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50' 
                        : 'text-red-400 bg-red-950/30 border-red-900/50 animate-pulse'
                    }`}>
                      {actualProfitMarginPercent >= 30 ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>HEALTHY PROJECTIONS</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0 animate-bounce" />
                          <span>RISKY LOW MARGIN</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-white/30 italic font-semibold leading-relaxed border-t border-white/10 pt-4">
                * Real-time calculation using FIFO Batch costs per sheet. The prices are dynamically sourced from incoming inventory lots.
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

                {/* Itemized spec table */}
                <div className="space-y-3">
                  <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">{currentLang === 'lo' ? 'ລາຍລະອຽດງານ' : 'Job Specifications'}</span>
                  
                  <div className="text-xs space-y-2 border-b pb-3 text-slate-600 font-semibold font-sans">
                    <div className="flex justify-between text-slate-800 font-black">
                      <span>1. Custom Print Job Specification</span>
                      <span>{printVolume.toLocaleString()} units</span>
                    </div>
                    <div className="pl-3.5 space-y-1 text-slate-500 font-medium">
                      <p>• Size: {jobSizePreset} Preset ({jobWidth}x{jobHeight}mm)</p>
                      <p>• Material: {inventory.find(p => p.id === selectedPaperId)?.name}</p>
                      <p>• Printing: {isDoubleSided ? 'Double-Sided' : 'Single-Sided'} ({coverageMode === 'default' ? 'Average' : 'CMYK'} coverage)</p>
                      {(hasLamination || hasDieCut || bindingType !== 'none') && (
                        <p>• Finishing: {[
                          hasLamination ? 'Lamination' : '',
                          hasDieCut ? 'Die-Cut' : '',
                          bindingType !== 'none' ? `Binding (${bindingType})` : ''
                        ].filter(Boolean).join(', ')}</p>
                      )}
                    </div>
                  </div>

                  {/* Financial calculation display */}
                  <div className="space-y-2 text-xs font-semibold text-slate-600 pt-1.5 font-sans">
                    <div className="flex justify-between">
                      <span>Base Selling Price:</span>
                      <span className="font-sans font-extrabold text-slate-800">{formatCurrency(baseSubtotal)}</span>
                    </div>

                    {/* Interactive Discount Field (Hide on print if 0) */}
                    <div className="flex justify-between items-center gap-4 print:hidden">
                      <span className="text-slate-500">Apply Discount (%):</span>
                      <input
                        type="number"
                        min="0"
                        max="95"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(Math.min(95, Math.max(0, Number(e.target.value))))}
                        className="w-16 min-h-[30px] px-2 text-right border-2 rounded-lg text-xs font-black"
                      />
                    </div>
                    {discountPercent > 0 && (
                      <div className="flex justify-between text-emerald-600 font-extrabold">
                        <span>Discount ({discountPercent}%):</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}

                    {/* Flexible Tax Management (Toggle ON/OFF, custom %, manual override) */}
                    <div className="rounded-2xl border-2 border-slate-200 p-3.5 space-y-3 print:hidden">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <PercentSquare className="w-4 h-4 text-accent-sky" />
                          <span className="text-slate-700 font-extrabold">{currentLang === 'lo' ? 'ພາສີ (Tax)' : 'Tax'}</span>
                        </div>
                        {/* Tax Toggle ON/OFF */}
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
                          {/* Mode: Percentage OR Manual Override Amount */}
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
                            <div className="space-y-2">
                              <div className="flex gap-1.5">
                                {[0, 5, 7, 10].map(rate => (
                                  <button
                                    key={rate}
                                    type="button"
                                    onClick={() => setTaxRate(rate)}
                                    className={`px-3 py-1.5 text-[10px] font-black rounded-lg border transition ${
                                      Number(taxRate) === rate
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                  >
                                    {rate}%
                                  </button>
                                ))}
                              </div>
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
                              <button
                                type="button"
                                onClick={() => setTaxOverrideAmount(0)}
                                className="text-[10px] font-black text-red-500 hover:underline"
                              >
                                {currentLang === 'lo' ? 'ລ້າງ' : 'Clear'}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-600 font-extrabold">
                          {currentLang === 'lo' ? '✓ ປິດພາສີ - ຍອດລວມ = ມູນຄ່າສຸດທິ (Grand Total = Subtotal)' : '✓ Tax OFF — Grand Total = Subtotal (no tax added)'}
                        </p>
                      )}
                    </div>

                    {(taxEnabled && taxAmount > 0) && (
                      <div className="flex justify-between">
                        <span>
                          {taxMode === 'override'
                            ? (currentLang === 'lo' ? `Tax (Fixed):` : `Tax (Fixed):`)
                            : `Tax (${taxRate}%):`}
                        </span>
                        <span className="font-sans font-extrabold">{formatCurrency(taxAmount)}</span>
                      </div>
                    )}

                    {/* Final Grand Total */}
                    <div className="flex justify-between items-center border-t-2 border-slate-900 pt-3 text-slate-900 font-black text-sm">
                      <span>Total Grand Total:</span>
                      <span className="text-xl font-black text-primary-navy font-sans">{formatCurrency(finalGrandTotal)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                      <span>Unit Price (Charged / Piece):</span>
                      <span className="font-sans">{formatCurrency(Math.round(finalGrandTotal / printVolume))}</span>
                    </div>

                    {/* Quotation Expiry Date + Payment Terms */}
                    <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-2 print:hidden">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">{currentLang === 'lo' ? 'ໝົດອາຍຸໃບສະເໜີ' : 'Valid Until (Expiry)'}</span>
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
                  className="flex-1 flex items-center justify-center gap-2 min-h-[48px] border-2 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-2xl text-sm font-extrabold transition active:scale-95"
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>{currentLang === 'lo' ? 'ບັນທຶກໃບສະເໜີ' : 'Save Quotation'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="flex-1 flex items-center justify-center gap-2 min-h-[48px] border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-sm font-extrabold transition active:scale-95"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>{currentLang === 'lo' ? 'ພິມ PDF ໃບສະເໜີ' : 'Export PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-red-600/20 transition active:scale-95"
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
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
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

                  {/* Version history rows */}
                  <div className="space-y-1">
                    {(quote.versions || []).map(v => (
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
                      className="px-3 py-1.5 text-[11px] font-black bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition"
                    >
                      {currentLang === 'lo' ? 'ໂຫຼດໃສ່ເຄື່ອງຄິດເລກ' : 'Load into Calculator'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReviseQuotation(quote.id)}
                      className="px-3 py-1.5 text-[11px] font-black bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-100 transition"
                    >
                      {currentLang === 'lo' ? `ສ້າງເວີຊັນ v${(quote.version || 0) + 1}` : `Revise → v${(quote.version || 0) + 1}`}
                    </button>
                    {quote.status === 'Pending' && (
                      <button
                        type="button"
                        onClick={() => handleConvertToOrder(quote)}
                        className="px-3 py-1.5 text-[11px] font-black bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
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
                className="px-6 py-2.5 bg-accent-sky text-white rounded-xl text-xs font-black shadow-md hover:bg-accent-sky/95 transition"
              >
                {currentLang === 'lo' ? 'ປິດ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK CONFIGURATION ACCESS MODAL DIALOG */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/50 backdrop-blur-md animate-fade-in print:hidden">
          <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl p-6 border border-slate-100 flex flex-col justify-between min-h-[500px]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-2.5">
                <Settings className="w-6 h-6 text-accent-sky animate-spin-slow" />
                <h3 className="text-xl font-black text-slate-900 tracking-wide">
                  {currentLang === 'lo' ? 'ຕັ້ງຄ່າສູດຄຳນວນລະອຽດ' : 'Calculator Calibration'}
                </h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
              >
                <span className="text-xs font-black uppercase">Close</span>
              </button>
            </div>

            {/* Modal Tabs Select */}
            <div className="flex border-b text-xs font-black">
              {[
                { id: 'paper', label: 'Paper & Spoilage' },
                { id: 'ink', label: 'Ink Yields' },
                { id: 'equipment', label: 'Printer & Depreciation' },
                { id: 'finishing', label: 'Finishing & Setup' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSettingsTab(tab.id)}
                  className={`flex-1 py-3 text-center border-b-2 transition ${
                    activeSettingsTab === tab.id 
                      ? 'border-accent-sky text-accent-sky' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Tab Contents */}
            <div className="flex-1 py-5 overflow-y-auto max-h-[350px]">
              
              {/* Tab 1: Paper & Spoilage settings */}
              {activeSettingsTab === 'paper' && (
                <div className="space-y-4 animate-fade-in text-xs font-bold text-slate-600">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-900 font-semibold leading-relaxed">
                      Configure paper cut layouts bleed margins and spoilage volume allowance tiers. Higher volumes typically run lower spoilage percentages.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span>Cut Bleed Margin (mm):</span>
                      <input
                        type="number"
                        value={bleedMargin}
                        onChange={(e) => setBleedMargin(Number(e.target.value))}
                        className="w-full min-h-[38px] px-3 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="block border-b pb-1 font-extrabold text-slate-800">Volume Spoilage Allowance Tiers (%):</span>
                    {spoilageTiers.map((tier, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-14">Tier {idx + 1}:</span>
                        <input
                          type="number"
                          value={tier.min}
                          onChange={(e) => {
                            const updated = [...spoilageTiers];
                            updated[idx].min = Number(e.target.value);
                            setSpoilageTiers(updated);
                          }}
                          className="w-20 min-h-[34px] px-2 border rounded-lg text-center"
                          placeholder="Min Vol"
                        />
                        <span>to</span>
                        <input
                          type="number"
                          value={tier.max}
                          onChange={(e) => {
                            const updated = [...spoilageTiers];
                            updated[idx].max = Number(e.target.value);
                            setSpoilageTiers(updated);
                          }}
                          className="w-24 min-h-[34px] px-2 border rounded-lg text-center"
                          placeholder="Max Vol"
                        />
                        <span>Allow:</span>
                        <input
                          type="number"
                          value={tier.rate}
                          onChange={(e) => {
                            const updated = [...spoilageTiers];
                            updated[idx].rate = Number(e.target.value);
                            setSpoilageTiers(updated);
                          }}
                          className="w-16 min-h-[34px] px-2 border rounded-lg text-center font-black"
                          placeholder="%"
                        />
                        <span>% waste</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Ink yields settings */}
              {activeSettingsTab === 'ink' && (
                <div className="space-y-4 animate-fade-in text-xs font-bold text-slate-600">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-900 font-semibold leading-relaxed">
                      Calibration of page yields per ml at 100% coverage. E.g., if set to 50 pages/ml, a page with 10% coverage consumes 0.002ml.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span>Ink Yield (Printed Pages / ml at 100%):</span>
                      <input
                        type="number"
                        value={inkYieldPerMl}
                        onChange={(e) => setInkYieldPerMl(Number(e.target.value))}
                        className="w-full min-h-[38px] px-3 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Printer depreciation overrides */}
              {activeSettingsTab === 'equipment' && (
                <div className="space-y-4 animate-fade-in text-xs font-bold text-slate-600">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-900 font-semibold leading-relaxed">
                      Printer specs adjustments: configure the flat power/water consumption and maintenance overhead per sheet printed.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span>Electricity overhead per sheet (LAK base):</span>
                      <input
                        type="number"
                        value={electricityCostPerSheet}
                        onChange={(e) => setElectricityCostPerSheet(Number(e.target.value))}
                        className="w-full min-h-[38px] px-3 border border-slate-200 rounded-xl font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <span>Maintenance overhead per sheet (LAK base):</span>
                      <input
                        type="number"
                        value={maintenanceCostPerSheet}
                        onChange={(e) => setMaintenanceCostPerSheet(Number(e.target.value))}
                        className="w-full min-h-[38px] px-3 border border-slate-200 rounded-xl font-sans"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Finishing prices & Setup operator cost settings */}
              {activeSettingsTab === 'finishing' && (
                <div className="space-y-4 animate-fade-in text-xs font-bold text-slate-600">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-900 font-semibold leading-relaxed">
                      Calibrate base setups, operators labor cost, lamination square-meters rates and dynamic finishing variables.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span>Lamination rate per sqm (LAK base):</span>
                      <input
                        type="number"
                        value={laminationRatePerSqm}
                        onChange={(e) => setLaminationRatePerSqm(Number(e.target.value))}
                        className="w-full min-h-[38px] px-3 border border-slate-200 rounded-xl font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <span>Setup Cost Mode & Value:</span>
                      <div className="flex gap-2">
                        <select
                          value={setupCostMode}
                          onChange={(e) => setSetupCostMode(e.target.value as any)}
                          className="px-2 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                        >
                          <option value="fixed">Fixed LAK</option>
                          <option value="percent">Percent %</option>
                        </select>
                        <input
                          type="number"
                          value={setupCostMode === 'fixed' ? setupCostFixed : setupCostPercent}
                          onChange={(e) => setupCostMode === 'fixed' ? setSetupCostFixed(Number(e.target.value)) : setSetupCostPercent(Number(e.target.value))}
                          className="w-full min-h-[38px] px-3 border border-slate-200 rounded-xl font-sans"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span>Labor Cost Mode & Value:</span>
                      <div className="flex gap-2">
                        <select
                          value={laborMode}
                          onChange={(e) => setLaborMode(e.target.value as any)}
                          className="px-2 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                        >
                          <option value="manual">Manual LAK</option>
                          <option value="percent">Flat %</option>
                          <option value="tiered">Tiered %</option>
                        </select>
                        {laborMode !== 'tiered' && (
                          <input
                            type="number"
                            value={laborMode === 'manual' ? laborCostManual : laborPercent}
                            onChange={(e) => laborMode === 'manual' ? setLaborCostManual(Number(e.target.value)) : setLaborPercent(Number(e.target.value))}
                            className="w-full min-h-[38px] px-3 border border-slate-200 rounded-xl font-sans"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions */}
            <div className="border-t pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2.5 bg-accent-sky text-white rounded-xl text-xs font-black shadow-md hover:bg-accent-sky/95 transition"
              >
                Save & Apply Settings
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
