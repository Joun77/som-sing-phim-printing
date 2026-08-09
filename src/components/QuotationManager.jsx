import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { 
  Calculator, 
  HelpCircle, 
  Percent, 
  ShieldAlert, 
  ShieldCheck,
  Coins,
  AlertTriangle,
  Info,
  Sliders,
  Scissors,
  Check,
  DollarSign,
  Settings,
  Download,
  ShoppingCart,
  Layers,
  Sparkles,
  User,
  Activity,
  Layers3,
  PercentSquare,
  ArrowLeft
} from 'lucide-react';

export default function QuotationManager({ onConvertToOrder, onBack }) {
  const { 
    inventory, 
    equipment, 
    getFIFOCostPerSheet, 
    checkCreditLimit, 
    customers, 
    addOrder,
    showToast,
    askConfirmation,
    preselectedCustomerName,
    setPreselectedCustomerName
  } = useApp();
  
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  // Filter lists
  const papers = inventory.filter(item => item.category === 'Paper');
  const printers = equipment.filter(eq => eq.category === 'Printer');

  // Input states
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.name || '');
  const [selectedPaperId, setSelectedPaperId] = useState(papers[0]?.id || '');
  const [selectedPrinterId, setSelectedPrinterId] = useState(printers[0]?.id || '');

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
  const [setupFeeLabor, setSetupFeeLabor] = useState(50000); // base operator setup cost (flat LAK)
  const [laborCostPerSheet, setLaborCostPerSheet] = useState(100); // operator fee per sheet printed

  // Other Finishing States
  const [hasLamination, setHasLamination] = useState(false);
  const [hasDieCut, setHasDieCut] = useState(false);
  const [bindingType, setBindingType] = useState('none');

  // Quotation States
  const [profitMargin, setProfitMargin] = useState(40); // Profit Margin in % (Interactive slider)
  const [discountPercent, setDiscountPercent] = useState(0);
  const [applyVat, setApplyVat] = useState(true);
  const [paymentTerms, setPaymentTerms] = useState('Immediate / Cash');

  // Helpers
  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num).replace('LAK', '₭');
  };

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

  // Base FIFO paper cost from context
  const paperUnitCost = getFIFOCostPerSheet(selectedPaperId, totalParentSheetsToUse);
  const totalPaperCost = paperUnitCost * totalParentSheetsToUse;

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

  // Get active pricing (ml cost) for each ink color
  const cyanPrice = inkSKUs.cyan ? inkSKUs.cyan.costPerConsumptionUnit : 1500;
  const magentaPrice = inkSKUs.magenta ? inkSKUs.magenta.costPerConsumptionUnit : 1500;
  const yellowPrice = inkSKUs.yellow ? inkSKUs.yellow.costPerConsumptionUnit : 1500;
  const blackPrice = inkSKUs.black ? inkSKUs.black.costPerConsumptionUnit : 1500;

  // Calculate ML consumed per color
  const factor = isDoubleSided ? 2 : 1;
  
  // Coverages (as ratio, e.g. 0.15 for 15%)
  const cRate = (coverageMode === 'advanced' ? cCoverage : avgCoverage) / 100;
  const mRate = (coverageMode === 'advanced' ? mCoverage : avgCoverage) / 100;
  const yRate = (coverageMode === 'advanced' ? yCoverage : avgCoverage) / 100;
  const kRate = (coverageMode === 'advanced' ? kCoverage : avgCoverage) / 100;

  const cyanMl = (printVolume * factor * cRate) / inkYieldPerMl;
  const magentaMl = (printVolume * factor * mRate) / inkYieldPerMl;
  const yellowMl = (printVolume * factor * yRate) / inkYieldPerMl;
  const blackMl = (printVolume * factor * kRate) / inkYieldPerMl;

  const cyanCost = cyanMl * cyanPrice;
  const magentaCost = magentaMl * magentaPrice;
  const yellowCost = yellowMl * yellowPrice;
  const blackCost = blackMl * blackPrice;
  const totalInkCost = cyanCost + magentaCost + yellowCost + blackCost;
  const depreciationRate = activePrinter ? activePrinter.calculatedCostPerPage : 90;
  const deprCost = printVolume * depreciationRate;
  const electricityCost = printVolume * Number(electricityCostPerSheet);
  const maintenanceCost = printVolume * Number(maintenanceCostPerSheet);
  const totalMachineOverhead = deprCost + electricityCost + maintenanceCost;

  // Finishing Costs
  // Lamination per sqm -> square meters: width * height * volume * factor
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

  // Labor & Setup Costs
  const setupLaborCost = Number(setupFeeLabor) + (Number(laborCostPerSheet) * printVolume);

  // Summaries
  const netInternalCost = totalPaperCost + totalInkCost + totalMachineOverhead + totalFinishingCost + setupLaborCost;
  
  // Interactive Profit Margin markup
  // Selling Price = Cost + (Cost * Margin%)
  const rawSellingPrice = netInternalCost * (1 + Number(profitMargin) / 100);
  const unitSellingPrice = Math.round(rawSellingPrice / printVolume);
  
  // Subtotal and Customer quotation financials
  const baseSubtotal = unitSellingPrice * printVolume;
  const discountAmount = baseSubtotal * (Number(discountPercent) / 100);
  const discountedSubtotal = baseSubtotal - discountAmount;
  const vatAmount = applyVat ? discountedSubtotal * 0.07 : 0;
  const finalGrandTotal = discountedSubtotal + vatAmount;

  const netJobProfit = finalGrandTotal - netInternalCost;
  const actualProfitMarginPercent = finalGrandTotal > 0 ? (netJobProfit / finalGrandTotal) * 100 : 0;

  // Credit check warnings
  const creditStatus = checkCreditLimit(selectedCustomerId, finalGrandTotal);

  // Export PDF template triggers standard window print
  const handleExportPDF = () => {
    window.print();
  };

  // Confirm order and deduct FIFO stock
  const handleConfirmOrder = () => {
    const msg = currentLang === 'lo'
      ? `ຢືນຢັນການບັນທຶກອໍເດີ ແລະ ຕັດສະຕ໋ອກສິນຄ້າ FIFO? ຍອດລວມ: ${formatLAK(finalGrandTotal)}`
      : `Confirm order creation and auto-deduct FIFO stock? Total: ${formatLAK(finalGrandTotal)}`;

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
        <div>
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
                ? `ລູກຄ້າ ${selectedCustomerId} ມິດຈຳກັດສິນເຊື່ອ ${formatLAK(creditStatus.limit)}. ຍອດຄ້າງຊຳຣະປັດຈຸບັນ ${formatLAK(creditStatus.currentUnpaid)} ລວມກັບໃບບິນນີ້ຈະເປັນ ${formatLAK(creditStatus.totalPotential)}.`
                : `Customer ${selectedCustomerId} has a credit limit of ${formatLAK(creditStatus.limit)}. Outstanding balance is ${formatLAK(creditStatus.currentUnpaid)}. Total exposure would reach ${formatLAK(creditStatus.totalPotential)}.`
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

              {/* Customer Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('orders.select_customer')}</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-2 border-2 rounded-xl focus:outline-none text-sm bg-white font-semibold font-sans"
                >
                  {customers.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

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
                      +{(laminationRatePerSqm).toLocaleString()}₭ / sqm ({formatLAK(Math.round(sqmPerPage * laminationRatePerSqm))} per page)
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
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/60">1. Paper Cost (with {activeSpoilageRate}% Spoilage):</span>
                    <div className="text-right">
                      <span className="text-white font-sans font-black block">{formatLAK(Math.round(totalPaperCost))}</span>
                      <span className="text-[10px] text-white/40 block font-sans">{totalParentSheetsToUse} sheets ({wastedSheets} waste)</span>
                    </div>
                  </div>

                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/60">2. Ink set cost ({coverageMode === 'default' ? 'Average' : 'CMYK'}):</span>
                    <div className="text-right">
                      <span className="text-white font-sans font-black block">{formatLAK(Math.round(totalInkCost))}</span>
                      <span className="text-[10px] text-white/40 block font-sans">
                        C:{cyanMl.toFixed(1)}ml M:{magentaMl.toFixed(1)}ml Y:{yellowMl.toFixed(1)}ml K:{blackMl.toFixed(1)}ml
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/60">3. Machine depr. & utility:</span>
                    <div className="text-right">
                      <span className="text-white font-sans font-black block">{formatLAK(Math.round(totalMachineOverhead))}</span>
                      <span className="text-[10px] text-white/40 block font-sans">
                        Depr: {formatLAK(deprCost)} + Pwr/Maint: {formatLAK(electricityCost+maintenanceCost)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/60">4. Finishing addons:</span>
                    <div className="text-right">
                      <span className="text-white font-sans font-black block">{formatLAK(Math.round(totalFinishingCost))}</span>
                      {hasLamination && <span className="text-[10px] text-emerald-400 block font-sans">Lamination active</span>}
                    </div>
                  </div>

                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/60">5. Operator setups & labor:</span>
                    <div className="text-right">
                      <span className="text-white font-sans font-black block">{formatLAK(Math.round(setupLaborCost))}</span>
                      <span className="text-[10px] text-white/40 block font-sans">Flat fee: {formatLAK(setupFeeLabor)} + Labor: {formatLAK(laborCostPerSheet*printVolume)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-base pt-2 text-accent-sky border-t border-white/10 font-black">
                    <span>Net Internal Cost (Net Cost):</span>
                    <span className="font-sans">{formatLAK(Math.round(netInternalCost))}</span>
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
                    <span className="font-sans text-emerald-400 text-base font-black">{formatLAK(Math.round(netJobProfit))}</span>
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
                    <p className="text-slate-800 font-extrabold text-sm">{selectedCustomerId}</p>
                    <p className="font-sans mt-0.5">Mobile: {customers.find(c => c.name === selectedCustomerId)?.phone || '020 55889900'}</p>
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
                      <span className="font-sans font-extrabold text-slate-800">{formatLAK(baseSubtotal)}</span>
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
                        <span>-{formatLAK(discountAmount)}</span>
                      </div>
                    )}

                    {/* Interactive VAT Field (Hide on print) */}
                    <div className="flex justify-between items-center gap-4 print:hidden">
                      <span className="text-slate-500">Include VAT (7%):</span>
                      <input
                        type="checkbox"
                        checked={applyVat}
                        onChange={(e) => setApplyVat(e.target.checked)}
                        className="w-5 h-5 cursor-pointer accent-accent-sky"
                      />
                    </div>
                    {applyVat && (
                      <div className="flex justify-between">
                        <span>VAT (7%):</span>
                        <span className="font-sans font-extrabold">{formatLAK(vatAmount)}</span>
                      </div>
                    )}

                    {/* Final Grand Total */}
                    <div className="flex justify-between items-center border-t-2 border-slate-900 pt-3 text-slate-900 font-black text-sm">
                      <span>Total Grand Total:</span>
                      <span className="text-xl font-black text-primary-navy font-sans">{formatLAK(finalGrandTotal)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                      <span>Unit Price (Charged / Piece):</span>
                      <span className="font-sans">{formatLAK(Math.round(finalGrandTotal / printVolume))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quotation action triggers */}
              <div className="flex gap-3 pt-6 border-t border-slate-100 print:hidden">
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
                      <span>Electricity overhead per sheet (LAK):</span>
                      <input
                        type="number"
                        value={electricityCostPerSheet}
                        onChange={(e) => setElectricityCostPerSheet(Number(e.target.value))}
                        className="w-full min-h-[38px] px-3 border border-slate-200 rounded-xl font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <span>Maintenance overhead per sheet (LAK):</span>
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
                      <span>Lamination rate per sqm (LAK):</span>
                      <input
                        type="number"
                        value={laminationRatePerSqm}
                        onChange={(e) => setLaminationRatePerSqm(Number(e.target.value))}
                        className="w-full min-h-[38px] px-3 border border-slate-200 rounded-xl font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <span>Flat Operator Setup Fee (LAK):</span>
                      <input
                        type="number"
                        value={setupFeeLabor}
                        onChange={(e) => setSetupFeeLabor(Number(e.target.value))}
                        className="w-full min-h-[38px] px-3 border border-slate-200 rounded-xl font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <span>Operator Labor fee per page (LAK):</span>
                      <input
                        type="number"
                        value={laborCostPerSheet}
                        onChange={(e) => setLaborCostPerSheet(Number(e.target.value))}
                        className="w-full min-h-[38px] px-3 border border-slate-200 rounded-xl font-sans"
                      />
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
