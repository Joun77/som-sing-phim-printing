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
  PercentSquare,
  Edit3
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

  // STEP 1: CUSTOMER SELECTION
  const [customerType, setCustomerType] = useState('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.name || '');
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustCredit, setNewCustCredit] = useState(1000000);

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

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

  // STEP 2: MULTI-ITEM PRINT LIST & INDIVIDUAL SPECS ENGINE
  const papers = inventory ? inventory.filter(item => item.category === 'Paper' || item.name.includes('A4') || item.name.includes('A3') || item.id.startsWith('LOT-')) : [];
  const printers = equipment ? equipment.filter(eq => eq.category === 'Printer' || eq.printerType || eq.name.includes('C6085')) : [];

  const defaultPaperId = papers[0]?.id || '';
  const defaultPrinterId = printers[0]?.id || '';

  const createDefaultItem = (itemName = 'ປຶ້ມ A4 (Book A4)') => ({
    id: `item-${Date.now()}-${Math.random().toString().slice(-4)}`,
    name: itemName,
    paperId: defaultPaperId,
    printerId: defaultPrinterId,
    jobWidth: 210,
    jobHeight: 297,
    bleedMargin: 2,
    quantity: 500,
    isDoubleSided: false,
    colorMode: 'CMYK',
    avgCoverage: 15,
    useLamination: false,
    laminationType: 'Glossy',
    useFolding: false,
    useBinding: false,
    bindingType: 'Staple',
    spoilageRate: 5,
    targetMarginPercent: 35,
    manualUnitPrice: null,
    manualTotalCost: null
  });

  const [items, setItems] = useState([
    createDefaultItem('ປຶ້ມ A4 Double A (Book A4)')
  ]);

  const [activeItemIndex, setActiveItemIndex] = useState(0);

  // Pre-fill specs if passed from QuotationManager
  useEffect(() => {
    if (prefilledSpecs && prefilledSpecs.paperId) {
      const newItem = createDefaultItem(prefilledSpecs.paperName || 'ໃບສະເໜີລາຄາ (Quotation Job)');
      newItem.paperId = prefilledSpecs.paperId;
      if (prefilledSpecs.quantity) newItem.quantity = prefilledSpecs.quantity;
      if (prefilledSpecs.unitCost) newItem.manualUnitPrice = prefilledSpecs.unitCost;
      setItems([newItem]);
    }
  }, [prefilledSpecs]);

  const handleAddItem = (presetName = 'ສຕິກເກີ / ໂບຣຊົວໃໝ່') => {
    const newItem = createDefaultItem(presetName);
    setItems(prev => [...prev, newItem]);
    setActiveItemIndex(items.length);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      const updated = items.filter((_, i) => i !== index);
      setItems(updated);
      setActiveItemIndex(Math.max(0, index - 1));
    }
  };

  const updateActiveItem = (field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[activeItemIndex] = {
        ...updated[activeItemIndex],
        [field]: value
      };
      return updated;
    });
  };

  // Calculation for individual item
  const calculateItemCosting = (item) => {
    if (!item) return { netCost: 0, suggestedPrice: 0, finalPrice: 0, unitPrice: 0, cuts: 1, totalParentSheets: 0 };

    const paperItem = inventory ? inventory.find(p => p.id === item.paperId) : null;
    let parentW = 297, parentH = 420;
    if (paperItem && paperItem.name.includes('A4')) { parentW = 210; parentH = 297; }

    const currentJobW = Number(item.jobWidth) + (Number(item.bleedMargin) * 2);
    const currentJobH = Number(item.jobHeight) + (Number(item.bleedMargin) * 2);
    const portraitCuts = Math.floor(parentW / currentJobW) * Math.floor(parentH / currentJobH);
    const landscapeCuts = Math.floor(parentW / currentJobH) * Math.floor(parentH / currentJobW);
    const cuts = Math.max(1, Math.max(portraitCuts, landscapeCuts));

    const parentSheetsNeeded = Math.ceil(item.quantity / cuts);
    const spoilageSheets = Math.ceil(parentSheetsNeeded * (Number(item.spoilageRate) / 100));
    const totalParentSheets = parentSheetsNeeded + spoilageSheets;

    const paperUnitCost = paperItem ? (paperItem.costPerSheet || 1200) : 1200;
    const totalPaperCost = totalParentSheets * paperUnitCost;

    const sidesMultiplier = item.isDoubleSided ? 2 : 1;
    const totalImpressions = item.quantity * sidesMultiplier;
    const totalInkCost = totalImpressions * ((item.avgCoverage / 100) / 50) * 500;

    const printerItem = equipment ? equipment.find(e => e.id === item.printerId) : null;
    const printerDepr = printerItem ? (printerItem.calculatedCostPerPage || 20) : 15;
    const totalDepreciationCost = totalImpressions * printerDepr;
    const totalPowerMaint = totalImpressions * 40;

    let finishingCost = 0;
    if (item.useLamination) finishingCost += ((item.jobWidth / 1000) * (item.jobHeight / 1000) * item.quantity) * 4000;
    if (item.useFolding) finishingCost += item.quantity * 25;
    if (item.useBinding) {
      if (item.bindingType === 'Staple') finishingCost += item.quantity * 150;
      else if (item.bindingType === 'Spiral') finishingCost += item.quantity * 2500;
      else if (item.bindingType === 'Perfect') finishingCost += item.quantity * 1200;
    }

    const netCost = item.manualTotalCost !== null ? Number(item.manualTotalCost) : (totalPaperCost + totalInkCost + totalDepreciationCost + totalPowerMaint + finishingCost + 15000);
    const suggestedPrice = netCost / (1 - (Number(item.targetMarginPercent) / 100));
    const finalPrice = item.manualUnitPrice !== null ? (Number(item.manualUnitPrice) * item.quantity) : suggestedPrice;
    const unitPrice = item.quantity > 0 ? finalPrice / item.quantity : 0;

    return {
      cuts,
      parentSheetsNeeded,
      spoilageSheets,
      totalParentSheets,
      totalPaperCost,
      totalInkCost,
      totalDepreciationCost,
      totalPowerMaint,
      finishingCost,
      netCost,
      suggestedPrice,
      finalPrice,
      unitPrice
    };
  };

  const currentItem = items[activeItemIndex] || items[0];
  const activeCosting = calculateItemCosting(currentItem);

  const grandTotalBill = items.reduce((sum, it) => sum + calculateItemCosting(it).finalPrice, 0);

  // STEP 3: Order Details & Payment
  const [promisedDeliveryDate, setPromisedDeliveryDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [deliveryMethod, setDeliveryMethod] = useState('Pickup');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [depositAmountPaid, setDepositAmountPaid] = useState(0);
  const [artworkLink, setArtworkLink] = useState('');

  const handleNextToStep2 = () => {
    if (customerType === 'new' && !newCustName.trim()) {
      showToast('ກະລຸນາປ້ອນຊື່ລູກຄ້າໃໝ່', 'warning');
      return;
    }
    if (customerType === 'existing' && !selectedCustomerId) {
      showToast('ກະລຸນາເລືອກລູກຄ້າ', 'warning');
      return;
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
      finalCustomerName = cust ? cust.name : selectedCustomerId;
      finalPhone = cust ? cust.phone : phone;
      finalAddress = cust ? cust.address : address;
    }

    const orderItems = items.map(it => {
      const costing = calculateItemCosting(it);
      return {
        id: it.paperId || 'paper-a4-80',
        name: it.name,
        quantity: it.quantity,
        unitCost: Math.round(costing.unitPrice),
        specs: `${it.jobWidth}x${it.jobHeight}mm, ${it.isDoubleSided ? '2 หน้า' : '1 หน้า'}, ${it.useLamination ? it.laminationType + ' เคลือบ' : 'ไม่เคลือบ'}, ${it.useBinding ? it.bindingType + ' เข้าเล่ม' : 'ไม่เข้าเล่ม'}`
      };
    });

    const orderData = {
      customerName: finalCustomerName,
      phone: finalPhone,
      address: finalAddress,
      items: orderItems,
      totalPriceCharged: grandTotalBill,
      depositAmountPaid: Number(depositAmountPaid),
      remainingUnpaidBalance: Math.max(0, grandTotalBill - Number(depositAmountPaid)),
      paymentMethod: 'BCEL One',
      bankName: 'BCEL',
      paymentStatus: paymentStatus,
      artworkLink: artworkLink,
      promisedDeliveryDate: promisedDeliveryDate || new Date().toISOString().split('T')[0],
      deliveryMethod: deliveryMethod,
      status: 'Received'
    };

    addOrder(orderData);
    showToast('ເພີ່ມອໍເດີໃໝ່ ແລະ ຕັດສະຕ໋ອກ FIFO ສຳເລັດ!', 'success');
    onBack();
  };

  return (
    <div className="space-y-6 animate-fade-in w-full text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-100 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ກັບຄືນໜ້າອໍເດີ (Back to Orders)</span>
        </button>
        <div>
          <span className="text-xs uppercase font-extrabold text-accent-sky tracking-wider font-sans block text-right">
            ຂັ້ນຕອນ {currentStep} ຈາກ 3
          </span>
          <h3 className="text-2xl font-black text-primary-navy mt-0.5">
            ຟອມສ້າງອໍເດີໃໝ່ ແລະ ຄິດໄລ່ສເປກ (Create Order Wizard)
          </h3>
        </div>
      </div>

      {/* Stepper Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-3">
        {[
          { step: 1, label: '1. ເລືອກຂໍ້ມູນລູກຄ້າ (Customer)' },
          { step: 2, label: '2. ລາຍການສິນຄ້າ & ສເປກງານພິມ (Print Items & Specs)' },
          { step: 3, label: '3. ສະຫຼຸບຍອດ & ຕັດສະຕ໋ອກ (Summary & Stock)' }
        ].map(s => (
          <div 
            key={s.step}
            className={`flex-1 text-center py-3 px-3 rounded-xl font-black text-xs transition-all ${
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
              ຂັ້ນຕອນ 1: ເລືອກຂໍ້ມູນລູກຄ້າ (Customer Selection)
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
              <span>ລູກຄ້າເກົ່າ (Existing Customer)</span>
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
              <span>ລູກຄ້າໃໝ່ (New Customer)</span>
            </label>
          </div>

          {customerType === 'existing' ? (
            <div className="space-y-2 max-w-xl">
              <label className="block text-xs font-black text-slate-500">ເລືອກລູກຄ້າຈາກ CRM *</label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky font-bold text-sm"
              >
                <option value="">-- ເລືອກລູກຄ້າເກົ່າ --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.name}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-500">ຊື່ ແລະ ນາມສະກຸນ *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-sky font-bold text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-500">ເບີໂທຕິດຕໍ່</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-sky font-bold text-sm font-sans"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-black text-slate-500">ທີ່ຢູ່ຈັດສົ່ງ</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-sky font-bold text-sm"
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
              <span>ຕໍ່ໄປ: ເລືອກລາຍການສິນຄ້າ & ສເປກ (Next: Items & Specs)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: MULTI-ITEM ORDER LIST & SPECS ENGINE */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Bar: List of Items (Order Items Preset Tabs) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-black text-slate-800 text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-accent-sky" />
                <span>ລາຍການສິນຄ້າທີ່ລູກຄ້າສັ່ງ (Customer Print Item List)</span>
              </h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAddItem('ປຶ້ມ A4 Double A')}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-black border border-blue-100 transition"
                >
                  + ປຶ້ມ (Book)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('ສຕິກເກີໂລໂກ້ (Sticker)')}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-black border border-purple-100 transition"
                >
                  + ສຕິກເກີ (Sticker)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('ໂບຣຊົວ A4 (Brochure)')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black border border-emerald-100 transition"
                >
                  + ໂບຣຊົວ (Brochure)
                </button>
              </div>
            </div>

            {/* Tabs for items */}
            <div className="flex flex-wrap gap-2 pt-1">
              {items.map((it, idx) => {
                const costing = calculateItemCosting(it);
                const isActive = activeItemIndex === idx;
                return (
                  <div
                    key={it.id}
                    onClick={() => setActiveItemIndex(idx)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-black cursor-pointer transition ${
                      isActive 
                        ? 'bg-primary-navy text-white border-primary-navy shadow-md' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{idx + 1}. {it.name}</span>
                    <span className="font-sans opacity-80">({formatLAK(costing.finalPrice)})</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveItem(idx); }}
                        className="ml-1 text-slate-400 hover:text-red-400 font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Item Specs Engine (3-Column Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Column 1: Item Specific Specs & Overrides */}
            <div className="lg:col-span-5 space-y-6">
              {/* Section 1: Material & Cut Layout */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-accent-sky" />
                    <h3 className="font-black text-slate-800 text-sm">1. ວັດສະດຸ ແລະ ຂະໜາດ (Material & Sizing)</h3>
                  </div>
                  <input
                    type="text"
                    value={currentItem.name}
                    onChange={(e) => updateActiveItem('name', e.target.value)}
                    className="px-2 py-1 border rounded-lg text-xs font-bold text-slate-800 text-right w-44"
                    placeholder="ຊື່ລາຍການ..."
                  />
                </div>

                <div className="space-y-3 text-xs font-bold text-slate-600">
                  <div className="space-y-1">
                    <label className="block text-slate-500">ເລືອກເຈ້ຍທີ່ໃຊ້ພິມ (Paper Stock) *</label>
                    <select
                      value={currentItem.paperId}
                      onChange={(e) => updateActiveItem('paperId', e.target.value)}
                      className="w-full min-h-[42px] px-3.5 border-2 border-slate-200 focus:border-accent-sky rounded-xl bg-white font-bold"
                    >
                      {papers.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500">Width (mm):</label>
                      <input
                        type="number"
                        value={currentItem.jobWidth}
                        onChange={(e) => updateActiveItem('jobWidth', Number(e.target.value))}
                        className="w-full px-3 py-2 border-2 rounded-lg font-sans text-xs font-black"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500">Height (mm):</label>
                      <input
                        type="number"
                        value={currentItem.jobHeight}
                        onChange={(e) => updateActiveItem('jobHeight', Number(e.target.value))}
                        className="w-full px-3 py-2 border-2 rounded-lg font-sans text-xs font-black"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500">Print Vol (ຈຳນວນ):</label>
                      <input
                        type="number"
                        value={currentItem.quantity}
                        onChange={(e) => updateActiveItem('quantity', Number(e.target.value))}
                        className="w-full px-3 py-2 border-2 rounded-lg font-sans text-xs font-black text-accent-sky"
                      />
                    </div>
                  </div>

                  {/* Cuts Layout Summary */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span>ตัดได้เลเอาต์จริง:</span>
                      <span className="font-black text-accent-sky">{activeCosting.cuts} cuts/sheet</span>
                    </div>
                    <div className="flex justify-between">
                      <span>จำนวนแผ่นเผื่อเสีย (%):</span>
                      <input
                        type="number"
                        value={currentItem.spoilageRate}
                        onChange={(e) => updateActiveItem('spoilageRate', Number(e.target.value))}
                        className="w-16 px-1.5 py-0.5 border rounded text-center font-bold text-amber-600"
                      />
                    </div>
                    <div className="flex justify-between border-t pt-1 font-black text-slate-900">
                      <span>ยอดตัดสต็อกรวม (FIFO):</span>
                      <span className="font-sans text-indigo-600">{activeCosting.totalParentSheets} ແຜ່ນ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Printer & Color */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <Printer className="w-5 h-5 text-purple-600" />
                  <h3 className="font-black text-slate-800 text-base">2. ເຄື່ອງພິມ ແລະ ໝຶກພິມ (Printer & Ink)</h3>
                </div>

                <div className="space-y-3 text-xs font-bold text-slate-600">
                  <div className="space-y-1">
                    <label className="block text-slate-500">ເລືອກເຄື່ອງພິມ *</label>
                    <select
                      value={currentItem.printerId}
                      onChange={(e) => updateActiveItem('printerId', e.target.value)}
                      className="w-full min-h-[42px] px-3.5 border-2 border-slate-200 focus:border-accent-sky rounded-xl bg-white font-bold"
                    >
                      {printers.map(pr => (
                        <option key={pr.id} value={pr.id}>{pr.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => updateActiveItem('isDoubleSided', false)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-black ${!currentItem.isDoubleSided ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-600'}`}
                    >
                      ພິມ 1 ໜ້າ (Simplex)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateActiveItem('isDoubleSided', true)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-black ${currentItem.isDoubleSided ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-600'}`}
                    >
                      ພິມ 2 ໜ້າ (Duplex)
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 3: Finishing & Binding */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <Scissors className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-black text-slate-800 text-base">3. ງານຫຼັງພິມ ແລະ ເຂົ້າເລົ່ມ (Finishing & Binding)</h3>
                </div>

                <div className="space-y-3 text-xs font-bold text-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentItem.useLamination}
                        onChange={(e) => updateActiveItem('useLamination', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600"
                      />
                      <span>ເຄືອບເງົາ / ດ້ານ (Lamination)</span>
                    </label>
                    {currentItem.useLamination && (
                      <select
                        value={currentItem.laminationType}
                        onChange={(e) => updateActiveItem('laminationType', e.target.value)}
                        className="px-2 py-1 border rounded-lg text-xs font-bold"
                      >
                        <option value="Glossy">ເຄືອບເງົາ (Glossy)</option>
                        <option value="Matte">ເຄືອບດ້ານ (Matte)</option>
                      </select>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentItem.useBinding}
                        onChange={(e) => updateActiveItem('useBinding', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600"
                      />
                      <span>ເຂົ້າເລົ່ມ (Binding)</span>
                    </label>
                    {currentItem.useBinding && (
                      <select
                        value={currentItem.bindingType}
                        onChange={(e) => updateActiveItem('bindingType', e.target.value)}
                        className="px-2 py-1 border rounded-lg text-xs font-bold"
                      >
                        <option value="Staple">ເຍັບແມັກ (Staple)</option>
                        <option value="Spiral">ເຂົ້າເລົ່ມກະດູກງູ (Spiral)</option>
                        <option value="Perfect">ເຂົ້າເລົ່ມກາວຮ້ອນ (Perfect Binding)</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Internal Cost Breakdown (Editable Dark Navy Card) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-5 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="font-black text-xs uppercase tracking-wider text-slate-300">Item #{activeItemIndex + 1} Cost Breakdown</span>
                  </div>
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-black rounded border border-red-500/30 uppercase">
                    Internal Use Only
                  </span>
                </div>

                <div className="space-y-3 text-xs font-semibold text-slate-300">
                  <div className="flex justify-between items-center">
                    <span>1. ຕົ້ນທຶນເຈ້ຍ (Paper Cost):</span>
                    <span className="font-sans font-black text-white">{formatLAK(activeCosting.totalPaperCost)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>2. ຕົ້ນທຶນໝຶກ (Ink Cost):</span>
                    <span className="font-sans font-black text-white">{formatLAK(activeCosting.totalInkCost)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>3. ຄ່າເສື່ອມເຄື່ອງ & ໄຟຟ້າ:</span>
                    <span className="font-sans font-black text-white">{formatLAK(activeCosting.totalDepreciationCost + activeCosting.totalPowerMaint)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>4. ງານຫຼັງພິມ (Finishing):</span>
                    <span className="font-sans font-black text-white">{formatLAK(activeCosting.finishingCost)}</span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
                  <span className="font-black text-sm text-sky-400">Net Internal Cost:</span>
                  <span className="text-xl font-black font-sans text-sky-400">{formatLAK(activeCosting.netCost)}</span>
                </div>

                {/* Editable Margin & Manual Override */}
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Markup Profit Margin (%):</span>
                    <span className="text-emerald-400 font-black">{currentItem.targetMarginPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={currentItem.targetMarginPercent}
                    onChange={(e) => updateActiveItem('targetMarginPercent', Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />

                  <div className="space-y-1 pt-2">
                    <label className="text-[11px] font-black text-slate-400 block">Manual Unit Price Override (₭/ຊຸດ):</label>
                    <input
                      type="number"
                      placeholder="ออโต้ตาม Margin..."
                      value={currentItem.manualUnitPrice || ''}
                      onChange={(e) => updateActiveItem('manualUnitPrice', e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-bold font-sans text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Overall Order Summary */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-5 sticky top-6">
                <div className="border-b pb-3">
                  <h3 className="font-black text-primary-navy text-lg">ສົມສິ່ງພິມ (Som Sing)</h3>
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Grand Total Bill</span>
                </div>

                <div className="space-y-3 text-xs text-slate-600 font-semibold">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px]">CUSTOMER NAME</span>
                    <span className="font-black text-slate-900 text-sm block">{selectedCustomerId}</span>
                  </div>
                  <div className="pt-2 border-t space-y-1">
                    <span className="text-slate-400 font-bold block text-[10px]">TOTAL ITEMS ({items.length})</span>
                    {items.map((it, i) => (
                      <div key={i} className="flex justify-between text-xs font-bold text-slate-800">
                        <span className="truncate max-w-[120px]">{i+1}. {it.name}</span>
                        <span className="font-sans">{formatLAK(calculateItemCosting(it).finalPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100 space-y-1">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">ยอดรวมทั้งสิ้น (Grand Total)</span>
                  <span className="text-2xl font-black text-emerald-600 font-sans block">{formatLAK(grandTotalBill)}</span>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleNextToStep3}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>ຕໍ່ໄປ: ສະຫຼຸບຍອດ & ຕັດສະຕ໋ອກ (Step 3)</span>
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
              <span>ກັບຄືນ (Back)</span>
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
                ຂັ້ນຕອນ 3: ກຳນົດສົ່ງ & ລາຍລະອຽດ (Scheduling & Details)
              </h4>
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-500">ກຳນົດສົ່ງ (Promised Delivery Date) *</label>
                <input
                  type="date"
                  required
                  value={promisedDeliveryDate}
                  onChange={(e) => setPromisedDeliveryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-sky font-bold font-sans text-xs bg-white transition"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-500">ວິທີການຈັດສົ່ງ (Delivery Method)</label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky font-bold text-xs transition"
                >
                  <option value="Pickup">มารับที่ร้าน (Pickup at Shop)</option>
                  <option value="Kerry Lao">Kerry Lao</option>
                  <option value="HAL Logistics">HAL Logistics</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 border-l border-slate-200/80 pl-0 sm:pl-6">
              <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs border-b border-slate-200 pb-2">
                ສະຫຼຸບຍອດ & ຕັດສະຕ໋ອກ (Order Summary & Trigger)
              </h4>
              <div className="space-y-3 text-xs font-semibold text-slate-600">
                <div className="flex justify-between items-center">
                  <span>ຍອດລວມທັງໝົດ (Grand Total):</span>
                  <span className="font-sans font-black text-slate-900 text-base">{formatLAK(grandTotalBill)}</span>
                </div>
                <div className="space-y-1 pt-2 border-t border-slate-200">
                  <label className="block text-[10px] font-black text-slate-400 uppercase">ສະຖານະການຊຳຣະ (Payment Status)</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => {
                      setPaymentStatus(e.target.value);
                      if (e.target.value === 'Fully Paid') setDepositAmountPaid(grandTotalBill);
                      else if (e.target.value === 'Pending') setDepositAmountPaid(0);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky text-xs font-bold transition"
                  >
                    <option value="Pending">Pending (ຍັງບໍ່ຊຳຣະ)</option>
                    <option value="Deposit Paid">Deposit Paid (ມັດຈຳ)</option>
                    <option value="Fully Paid">Fully Paid (ຊຳຣະເຕັມ)</option>
                  </select>
                </div>
                {paymentStatus === 'Deposit Paid' && (
                  <div className="space-y-1 pt-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase">ຈຳນວນເງິນມັດຈຳ (Deposit Paid)</label>
                    <input
                      type="number"
                      required
                      min="1000"
                      max={grandTotalBill}
                      value={depositAmountPaid}
                      onChange={(e) => setDepositAmountPaid(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-sky font-bold text-xs font-sans transition"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1 max-w-xl">
            <label className="block text-xs font-black text-slate-500">ລິ້ງໄຟລ໌ງານ (Google Drive / Dropbox)</label>
            <input
              type="text"
              placeholder="https://drive.google.com/..."
              value={artworkLink}
              onChange={(e) => setArtworkLink(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky font-bold font-sans text-xs transition"
            />
          </div>

          <div className="flex justify-between pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ກັບຄືນ (Back)</span>
            </button>
            <button
              type="submit"
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/15 transition active:scale-95"
            >
              ຢືນຢັນສ້າງອໍເດີ (Confirm & Deduct Stock FIFO)
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
