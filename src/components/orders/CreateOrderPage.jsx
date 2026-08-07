import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  User, 
  Printer, 
  ChevronRight, 
  Plus, 
  Trash2,
  CheckCircle2,
  DollarSign,
  Package,
  Scissors,
  Layers,
  Settings,
  HelpCircle,
  FileText,
  Calculator,
  Info,
  Sliders,
  Sparkles,
  Download,
  ShoppingCart,
  PercentSquare
} from 'lucide-react';

export default function CreateOrderPage({
  onBack,
  inventory,
  equipment,
  customers,
  addCustomer,
  addOrder,
  showToast,
  formatLAK,
  currentLang,
  t,
  prefilledSpecs
}) {
  const [currentStep, setCurrentStep] = useState(1);

  // STEP 1: Customer State
  const [customerType, setCustomerType] = useState('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.name || '');
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustCredit, setNewCustCredit] = useState(1000000);

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Auto-fill existing customer fields
  useEffect(() => {
    if (customerType === 'existing' && selectedCustomerId) {
      const cust = customers.find(c => c.id === selectedCustomerId || c.name === selectedCustomerId);
      if (cust) {
        setPhone(cust.phone || '');
        setAddress(cust.address || '');
      }
    } else {
      setPhone('');
      setAddress('');
    }
  }, [selectedCustomerId, customerType, customers]);

  // STEP 2: Ultra-Detailed Print Specifications & Cost Engine State
  const papers = inventory ? inventory.filter(item => item.category === 'Paper' || item.name.includes('A4') || item.name.includes('A3') || item.id.startsWith('LOT-')) : [];
  const printers = equipment ? equipment.filter(eq => eq.category === 'Printer' || eq.printerType || eq.name.includes('C6085')) : [];

  const [selectedPaperId, setSelectedPaperId] = useState(papers[0]?.id || '');
  const [selectedPrinterId, setSelectedPrinterId] = useState(printers[0]?.id || '');

  const [jobWidth, setJobWidth] = useState(210);
  const [jobHeight, setJobHeight] = useState(297);
  const [bleedMargin, setBleedMargin] = useState(2);
  const [printVolume, setPrintVolume] = useState(500);
  const [isDoubleSided, setIsDoubleSided] = useState(false);

  const selectedPrinterObj = equipment ? equipment.find(e => e.id === selectedPrinterId) : null;
  const supportedInkSets = selectedPrinterObj?.supportedInkSets || ['Konica C6085 OEM Set'];
  const [selectedInkSet, setSelectedInkSet] = useState(supportedInkSets[0] || '');

  const [avgCoverage, setAvgCoverage] = useState(15);

  const [useLamination, setUseLamination] = useState(false);
  const [laminationType, setLaminationType] = useState('Glossy');
  const [useFolding, setUseFolding] = useState(false);
  const [useBinding, setUseBinding] = useState(false);
  const [bindingType, setBindingType] = useState('Staple');

  const [targetMarginPercent, setTargetMarginPercent] = useState(35);
  const [manualPriceOverride, setManualPriceOverride] = useState(null);

  // Calibrations
  const spoilageTiers = [
    { min: 1, max: 100, rate: 10 },
    { min: 101, max: 500, rate: 5 },
    { min: 501, max: 2000, rate: 3 },
    { min: 2001, max: 100000, rate: 1 }
  ];
  const inkYieldPerMl = 50;
  const electricityCostPerSheet = 25;
  const maintenanceCostPerSheet = 15;
  const laminationRatePerSqm = 4000;
  const setupFeeLabor = 15000;
  const laborCostPerSheet = 10;

  // Pre-fill specs if passed from QuotationManager
  useEffect(() => {
    if (prefilledSpecs && prefilledSpecs.paperId) {
      setSelectedPaperId(prefilledSpecs.paperId);
      if (prefilledSpecs.quantity) setPrintVolume(prefilledSpecs.quantity);
      if (prefilledSpecs.unitCost) setManualPriceOverride(prefilledSpecs.unitCost * prefilledSpecs.quantity);
    }
  }, [prefilledSpecs]);

  // Calculations
  const calculateCutsPerSheet = () => {
    const paperItem = inventory ? inventory.find(p => p.id === selectedPaperId) : null;
    if (!paperItem) return 1;

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

    const portraitCuts = Math.floor(parentW / currentJobW) * Math.floor(parentH / currentJobH);
    const landscapeCuts = Math.floor(parentW / currentJobH) * Math.floor(parentH / currentJobW);

    const cuts = Math.max(portraitCuts, landscapeCuts);
    return cuts > 0 ? cuts : 1;
  };

  const cutsPerParentSheet = calculateCutsPerSheet();
  const parentSheetsNeeded = Math.ceil(printVolume / cutsPerParentSheet);

  const getActiveSpoilageRate = () => {
    const tier = spoilageTiers.find(t => printVolume >= t.min && printVolume <= t.max);
    return tier ? tier.rate : 2;
  };

  const spoilageRate = getActiveSpoilageRate();
  const spoilageSheets = Math.ceil(parentSheetsNeeded * (spoilageRate / 100));
  const totalParentSheets = parentSheetsNeeded + spoilageSheets;

  const paperItem = inventory ? inventory.find(p => p.id === selectedPaperId) : null;
  const paperUnitCost = paperItem ? (paperItem.costPerSheet || 1200) : 1200;
  const totalPaperCost = totalParentSheets * paperUnitCost;

  const inkCostPerMl = 500;
  const sidesMultiplier = isDoubleSided ? 2 : 1;
  const totalImpressions = printVolume * sidesMultiplier;
  const mlPerImpression = (avgCoverage / 100) / inkYieldPerMl;
  const totalMlNeeded = totalImpressions * mlPerImpression;
  const totalInkCost = totalMlNeeded * inkCostPerMl;

  const printerItem = equipment ? equipment.find(e => e.id === selectedPrinterId) : null;
  const printerDepreciationPerSheet = printerItem ? (printerItem.calculatedCostPerPage || 20) : 15;
  const totalDepreciationCost = totalImpressions * printerDepreciationPerSheet;
  const totalPowerMaintCost = totalImpressions * (electricityCostPerSheet + maintenanceCostPerSheet);

  let laminationTotalCost = 0;
  if (useLamination) {
    const jobSqmPerSheet = (jobWidth / 1000) * (jobHeight / 1000);
    const totalSqm = jobSqmPerSheet * printVolume * (laminationType === 'Matte' ? 1.1 : 1.0);
    laminationTotalCost = totalSqm * laminationRatePerSqm;
  }

  let foldingTotalCost = useFolding ? printVolume * 25 : 0;
  let bindingTotalCost = 0;
  if (useBinding) {
    if (bindingType === 'Staple') bindingTotalCost = printVolume * 150;
    else if (bindingType === 'Spiral') bindingTotalCost = printVolume * 2500;
    else if (bindingType === 'Perfect') bindingTotalCost = printVolume * 1200;
  }

  const totalFinishingCost = laminationTotalCost + foldingTotalCost + bindingTotalCost;
  const totalLaborCost = setupFeeLabor + (totalImpressions * laborCostPerSheet);

  const netTotalCost = totalPaperCost + totalInkCost + totalDepreciationCost + totalPowerMaintCost + totalFinishingCost + totalLaborCost;
  const unitNetCost = printVolume > 0 ? netTotalCost / printVolume : 0;

  const suggestedSellingPriceTotal = netTotalCost / (1 - (targetMarginPercent / 100));
  const suggestedUnitPrice = printVolume > 0 ? suggestedSellingPriceTotal / printVolume : 0;

  const finalQuotedTotalPrice = manualPriceOverride !== null ? Number(manualPriceOverride) : suggestedSellingPriceTotal;
  const finalQuotedUnitPrice = printVolume > 0 ? finalQuotedTotalPrice / printVolume : 0;

  const actualProfitTotal = finalQuotedTotalPrice - netTotalCost;

  // STEP 3: Order Details & Payment
  const [promisedDeliveryDate, setPromisedDeliveryDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [deliveryMethod, setDeliveryMethod] = useState('Pickup');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [depositAmountPaid, setDepositAmountPaid] = useState(0);
  const [artworkLink, setArtworkLink] = useState('');

  const handleNextToStep2 = () => {
    if (customerType === 'new') {
      if (!newCustName.trim()) {
        showToast(currentLang === 'lo' ? 'ກະລຸນາປ້ອນຊື່ລູກຄ້າໃໝ່' : 'Please enter new customer name', 'warning');
        return;
      }
    } else {
      if (!selectedCustomerId) {
        showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກລູກຄ້າ' : 'Please select a customer', 'warning');
        return;
      }
    }
    setCurrentStep(2);
  };

  const handleNextToStep3 = () => {
    setCurrentStep(3);
  };

  const handleSubmitFinal = (e) => {
    e.preventDefault();

    let finalCustomerName = '';
    let finalPhone = '';
    let finalAddress = '';

    if (customerType === 'new') {
      finalCustomerName = newCustName;
      finalPhone = newCustPhone;
      finalAddress = newCustAddress;

      addCustomer({
        name: newCustName,
        phone: newCustPhone,
        address: newCustAddress,
        creditLimit: newCustCredit
      });
    } else {
      const cust = customers.find(c => c.id === selectedCustomerId || c.name === selectedCustomerId);
      if (cust) {
        finalCustomerName = cust.name;
        finalPhone = cust.phone;
        finalAddress = cust.address;
      } else {
        finalCustomerName = selectedCustomerId;
      }
    }

    const validItems = [{
      id: selectedPaperId || 'paper-a4-80',
      name: paperItem ? paperItem.name : 'Custom Print Job Specification',
      quantity: printVolume,
      unitCost: Math.round(finalQuotedUnitPrice),
      specs: `${jobWidth}x${jobHeight}mm, ${isDoubleSided ? 'Double-sided' : 'Single-sided'}, ${useLamination ? laminationType + ' Lamination' : 'No Lamination'}`
    }];

    const orderData = {
      customerName: finalCustomerName,
      phone: finalPhone,
      address: finalAddress,
      items: validItems,
      totalPriceCharged: finalQuotedTotalPrice,
      depositAmountPaid: Number(depositAmountPaid),
      remainingUnpaidBalance: Math.max(0, finalQuotedTotalPrice - Number(depositAmountPaid)),
      paymentMethod: 'BCEL One',
      bankName: 'BCEL',
      paymentStatus: paymentStatus,
      artworkLink: artworkLink,
      promisedDeliveryDate: promisedDeliveryDate || new Date().toISOString().split('T')[0],
      deliveryMethod: deliveryMethod,
      status: 'Received'
    };

    addOrder(orderData);
    showToast(
      currentLang === 'lo' ? 'ເພີ່ມອໍເດີໃໝ່ ແລະ ຕັດສະຕ໋ອກສຳເລັດ!' : 'New order created & inventory deducted!', 
      'success'
    );
    onBack();
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-100 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentLang === 'lo' ? 'ກັບຄືນ' : 'Back to Orders'}</span>
        </button>
        <div>
          <span className="text-xs uppercase font-extrabold text-accent-sky tracking-wider font-sans block text-right">
            Wizard Step {currentStep} of 3
          </span>
          <h3 className="text-2xl font-black text-primary-navy mt-0.5">
            {currentLang === 'lo' ? 'ຟອມສ້າງອໍເດີໃໝ່' : 'Create New Order Wizard'}
          </h3>
        </div>
      </div>

      {/* Progress Stepper Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-3">
        {[
          { step: 1, label: currentLang === 'lo' ? '1. ເລືອກລູກຄ້າ' : '1. Customer Info' },
          { step: 2, label: currentLang === 'lo' ? '2. สเปกงานพิมพ์ & คำนวณต้นทุน' : '2. Ultra-Detailed Print Specs' },
          { step: 3, label: currentLang === 'lo' ? '3. สรุปยอด & ตัดสต็อก' : '3. Summary & Stock Deduction' }
        ].map(s => (
          <div 
            key={s.step}
            className={`flex-1 text-center py-2.5 px-3 rounded-xl font-black text-xs transition-all ${
              currentStep === s.step 
                ? 'bg-accent-sky text-white shadow-md shadow-accent-sky/20' 
                : currentStep > s.step
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-slate-50 text-slate-400 border border-slate-100'
            }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* STEP 1: CUSTOMER SELECTION */}
      {currentStep === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <User className="w-6 h-6 text-accent-sky" />
            <h4 className="font-black text-slate-800 text-base">
              Step 1: {currentLang === 'lo' ? 'ເລືອກຂໍ້ມູນລູກຄ້າ' : 'Customer Selection'}
            </h4>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 font-bold cursor-pointer text-sm text-slate-700">
              <input
                type="radio"
                name="custType"
                value="existing"
                checked={customerType === 'existing'}
                onChange={() => setCustomerType('existing')}
                className="w-4 h-4 text-accent-sky focus:ring-accent-sky"
              />
              <span>{currentLang === 'lo' ? 'ລູກຄ້າເກົ່າ (Existing Customer)' : 'Existing Customer'}</span>
            </label>
            <label className="flex items-center gap-2 font-bold cursor-pointer text-sm text-slate-700">
              <input
                type="radio"
                name="custType"
                value="new"
                checked={customerType === 'new'}
                onChange={() => setCustomerType('new')}
                className="w-4 h-4 text-accent-sky focus:ring-accent-sky"
              />
              <span>{currentLang === 'lo' ? 'ລູກຄ້າໃໝ່ (New Customer)' : 'New Customer'}</span>
            </label>
          </div>

          {customerType === 'existing' ? (
            <div className="space-y-2 max-w-xl">
              <label className="block text-xs font-black text-slate-500">Select Customer from CRM *</label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky focus:border-transparent font-bold text-sm transition"
              >
                <option value="">-- Choose Existing Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.name}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-500">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky focus:border-transparent font-bold text-sm transition"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-500">Phone Number</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky focus:border-transparent font-bold text-sm font-sans transition"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-black text-slate-500">Delivery Address</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky focus:border-transparent font-bold text-sm transition"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={handleNextToStep2}
              className="flex items-center gap-2 px-6 py-3 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95"
            >
              <span>Next: Ultra-Detailed Specs Engine</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ULTRA-DETAILED 3-COLUMN SPECS & COST ENGINE */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Column 1: Print Job Specifications Inputs */}
            <div className="lg:col-span-5 space-y-6">
              {/* Section 1: Material & Sizing */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <Calculator className="w-5 h-5 text-accent-sky" />
                  <h3 className="font-black text-slate-800 text-base">1. วัสดุ และ ขนาด (Material & Sizing)</h3>
                </div>

                <div className="space-y-3 text-xs font-bold text-slate-600">
                  <div className="space-y-1">
                    <label className="block text-slate-500">เลือกเจี้ยที่ใช้พิมพ์ *</label>
                    <select
                      value={selectedPaperId}
                      onChange={(e) => setSelectedPaperId(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 border-2 border-slate-200 focus:border-accent-sky rounded-xl bg-white font-bold"
                    >
                      {papers.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-500">ขนาดหน้าตัดงาน:</label>
                    <div className="flex gap-2">
                      {['A3', 'A4', 'A5', 'A6', 'Custom'].map(sz => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            if (sz === 'A3') { setJobWidth(297); setJobHeight(420); }
                            else if (sz === 'A4') { setJobWidth(210); setJobHeight(297); }
                            else if (sz === 'A5') { setJobWidth(148); setJobHeight(210); }
                            else if (sz === 'A6') { setJobWidth(105); setJobHeight(148); }
                          }}
                          className={`px-3 py-1.5 rounded-lg border font-black text-xs ${
                            (sz === 'A4' && jobWidth === 210) || (sz === 'A3' && jobWidth === 297)
                              ? 'bg-accent-sky text-white border-accent-sky'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500">Width (mm):</label>
                      <input
                        type="number"
                        value={jobWidth}
                        onChange={(e) => setJobWidth(Number(e.target.value))}
                        className="w-full px-3 py-2 border-2 rounded-lg font-sans text-xs font-black"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500">Height (mm):</label>
                      <input
                        type="number"
                        value={jobHeight}
                        onChange={(e) => setJobHeight(Number(e.target.value))}
                        className="w-full px-3 py-2 border-2 rounded-lg font-sans text-xs font-black"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500">Print Vol:</label>
                      <input
                        type="number"
                        value={printVolume}
                        onChange={(e) => setPrintVolume(Number(e.target.value))}
                        className="w-full px-3 py-2 border-2 rounded-lg font-sans text-xs font-black text-accent-sky"
                      />
                    </div>
                  </div>

                  {/* Cuts calculator card */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span>ตัดได้เลเอาต์จริง:</span>
                      <span className="font-black text-accent-sky">{cutsPerParentSheet} cuts/sheet</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ชิ้นเริ่มต้นต่อแผ่นแม่:</span>
                      <span className="font-sans font-bold">{parentSheetsNeeded} แผ่น</span>
                    </div>
                    <div className="flex justify-between">
                      <span>เผื่อเสียตาม Tier:</span>
                      <span className="font-sans font-bold text-amber-600">+{spoilageSheets} แผ่น ({spoilageRate}%)</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-black text-slate-900">
                      <span>ยอดตัดสต็อกรวม (FIFO):</span>
                      <span className="font-sans text-indigo-600">{totalParentSheets} แผ่น</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Printing & Ink */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <Printer className="w-5 h-5 text-purple-600" />
                  <h3 className="font-black text-slate-800 text-base">2. ภาพพิมพ์ และ หมึกพิมพ์ (Printing & Ink)</h3>
                </div>

                <div className="space-y-3 text-xs font-bold text-slate-600">
                  <div className="space-y-1">
                    <label className="block text-slate-500">เลือกเครื่องพิมพ์ *</label>
                    <select
                      value={selectedPrinterId}
                      onChange={(e) => setSelectedPrinterId(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 border-2 border-slate-200 focus:border-accent-sky rounded-xl bg-white font-bold"
                    >
                      {printers.map(pr => (
                        <option key={pr.id} value={pr.id}>{pr.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-500">โหมดการพิมพ์:</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsDoubleSided(false)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-black ${!isDoubleSided ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-600'}`}
                      >
                        พิมพ์ 1 หน้า (Simplex)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDoubleSided(true)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-black ${isDoubleSided ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-600'}`}
                      >
                        พิมพ์ 2 หน้า (Duplex)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <label className="text-slate-500">Ink Density / Coverage (%):</label>
                      <span className="text-purple-600 font-black">{avgCoverage}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={avgCoverage}
                      onChange={(e) => setAvgCoverage(Number(e.target.value))}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Finishing & Assembly */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <Scissors className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-black text-slate-800 text-base">3. งานหลังพิมพ์ และ การประกอบเล่ม</h3>
                </div>

                <div className="space-y-3 text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useLamination}
                      onChange={(e) => setUseLamination(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                    <span>เคลือบเงา / ด้าน (Lamination)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useBinding}
                      onChange={(e) => setUseBinding(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                    <span>เข้าเล่ม (Binding)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Column 2: Internal Cost & Yields (Dark Navy Card) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-5 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="font-black text-xs uppercase tracking-wider text-slate-300">Internal Cost & Yields</span>
                  </div>
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-black rounded border border-red-500/30 uppercase">
                    Internal Use Only
                  </span>
                </div>

                <div className="space-y-3 text-xs font-semibold text-slate-300">
                  <div className="flex justify-between items-center">
                    <span>1. Paper Cost (with {spoilageRate}% Spoilage):</span>
                    <span className="font-sans font-black text-white">{formatLAK(totalPaperCost)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>2. Ink set cost (Average):</span>
                    <span className="font-sans font-black text-white">{formatLAK(totalInkCost)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>3. Machine depr. & utility:</span>
                    <span className="font-sans font-black text-white">{formatLAK(totalDepreciationCost + totalPowerMaintCost)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>4. Finishing addons:</span>
                    <span className="font-sans font-black text-white">{formatLAK(totalFinishingCost)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>5. Operator setups & labor:</span>
                    <span className="font-sans font-black text-white">{formatLAK(totalLaborCost)}</span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
                  <span className="font-black text-sm text-sky-400">Net Internal Cost (Net Cost):</span>
                  <span className="text-xl font-black font-sans text-sky-400">{formatLAK(netTotalCost)}</span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Markup Profit Margin:</span>
                    <span className="text-emerald-400 font-black">{targetMarginPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={targetMarginPercent}
                    onChange={(e) => setTargetMarginPercent(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-slate-400">Est. Profit Yield:</span>
                    <span className="font-sans font-black text-emerald-400 text-base">{formatLAK(actualProfitTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Quotation Summary Card */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-5 sticky top-6">
                <div className="border-b pb-3">
                  <h3 className="font-black text-primary-navy text-lg">สมสิ่งพิมพ์</h3>
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Quotation Summary</span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 font-semibold">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px]">CUSTOMER NAME</span>
                    <span className="font-black text-slate-900 text-sm block">{selectedCustomerId}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-slate-400 font-bold block text-[10px]">JOB SPECIFICATION</span>
                    <span className="font-bold text-slate-800 block mt-0.5">{paperItem ? paperItem.name : 'A4 Job'}</span>
                    <span className="text-xs text-slate-500 font-sans block">{jobWidth}x{jobHeight}mm • {printVolume} units</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Grand Total Bill</span>
                  <span className="text-2xl font-black text-emerald-600 font-sans block">{formatLAK(finalQuotedTotalPrice)}</span>
                  <span className="text-xs text-slate-500 font-bold block">~ {formatLAK(finalQuotedUnitPrice)} / unit</span>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleNextToStep3}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Step 3 (Summary & Stock)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ORDER SUMMARY & STOCK DEDUCTION */}
      {currentStep === 3 && (
        <form onSubmit={handleSubmitFinal} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-fade-in text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/60 p-6 rounded-2xl border border-slate-100">
            <div className="space-y-4">
              <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs border-b border-slate-200 pb-2">
                Step 3: Scheduling & Details
              </h4>
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-500">Promised Delivery Date *</label>
                <input
                  type="date"
                  required
                  value={promisedDeliveryDate}
                  onChange={(e) => setPromisedDeliveryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-sky focus:border-transparent font-bold font-sans text-xs bg-white transition"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-500">Delivery Method</label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky focus:border-transparent font-bold text-xs transition"
                >
                  <option value="Pickup">Pickup at Shop</option>
                  <option value="Kerry Lao">Kerry Lao</option>
                  <option value="HAL Logistics">HAL Logistics</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 border-l border-slate-200/80 pl-0 sm:pl-6">
              <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs border-b border-slate-200 pb-2">
                Order Summary & Stock Trigger
              </h4>
              <div className="space-y-3 text-xs font-semibold text-slate-600">
                <div className="flex justify-between items-center">
                  <span>Total Order Bill:</span>
                  <span className="font-sans font-black text-slate-900 text-base">{formatLAK(finalQuotedTotalPrice)}</span>
                </div>
                <div className="space-y-1 pt-2 border-t border-slate-200">
                  <label className="block text-[10px] font-black text-slate-400 uppercase">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => {
                      setPaymentStatus(e.target.value);
                      if (e.target.value === 'Fully Paid') setDepositAmountPaid(finalQuotedTotalPrice);
                      else if (e.target.value === 'Pending') setDepositAmountPaid(0);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky focus:border-transparent text-xs font-bold transition"
                  >
                    <option value="Pending">Pending (ยังไม่จ่าย)</option>
                    <option value="Deposit Paid">Deposit Paid (มัดจำ)</option>
                    <option value="Fully Paid">Fully Paid (จ่ายเต็ม)</option>
                  </select>
                </div>
                {paymentStatus === 'Deposit Paid' && (
                  <div className="space-y-1 pt-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase">Deposit Amount paid</label>
                    <input
                      type="number"
                      required
                      min="1000"
                      max={finalQuotedTotalPrice}
                      value={depositAmountPaid}
                      onChange={(e) => setDepositAmountPaid(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-sky focus:border-transparent font-bold text-xs font-sans transition"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1 max-w-xl">
            <label className="block text-xs font-black text-slate-500">Artwork Link (Google Drive / Dropbox)</label>
            <input
              type="text"
              placeholder="https://drive.google.com/..."
              value={artworkLink}
              onChange={(e) => setArtworkLink(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky focus:border-transparent font-bold font-sans text-xs transition"
            />
          </div>

          <div className="flex justify-between pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="submit"
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/15 transition active:scale-95"
            >
              {currentLang === 'lo' ? 'ຢືນຢັນສ້າງອໍເດີ (Confirm & Deduct Stock)' : 'Submit Order & Deduct Inventory Stock'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}