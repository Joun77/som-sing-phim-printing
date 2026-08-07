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

  // STEP 2: MULTI-ITEM ORDER LIST & SPECS ENGINE
  const papers = inventory ? inventory.filter(item => item.category === 'Paper' || item.name.includes('A4') || item.name.includes('A3') || item.id.startsWith('LOT-')) : [];
  const printers = equipment ? equipment.filter(eq => eq.category === 'Printer' || eq.printerType || eq.name.includes('C6085')) : [];

  const defaultPaperId = papers[0]?.id || '';
  const defaultPrinterId = printers[0]?.id || '';

  const createDefaultItem = (name = 'ປຶ້ມ / ສຕິກເກີ ໃໝ່') => ({
    id: `item-${Date.now()}-${Math.random().toString().slice(-4)}`,
    name: name,
    quantity: 500,
    paperId: defaultPaperId,
    printerId: defaultPrinterId,
    jobWidth: 210,
    jobHeight: 297,
    bleedMargin: 2,
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
    manualUnitPrice: null
  });

  const [items, setItems] = useState([
    createDefaultItem('ປຶ້ມ A4 Double A')
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

  const handleAddItemRow = () => {
    const newItem = createDefaultItem(`ລາຍການທີ ${items.length + 1}`);
    setItems(prev => [...prev, newItem]);
    setActiveItemIndex(items.length);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length > 1) {
      const updated = items.filter((_, i) => i !== index);
      setItems(updated);
      setActiveItemIndex(Math.max(0, index - 1));
    }
  };

  const updateItemField = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Calculation logic for each item
  const calculateItemCosting = (item) => {
    if (!item) return { netCost: 0, finalPrice: 0, unitPrice: 0, cuts: 1, totalParentSheets: 0 };

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

    const netCost = totalPaperCost + totalInkCost + totalDepreciationCost + totalPowerMaint + finishingCost + 15000;
    const suggestedPrice = netCost / (1 - (Number(item.targetMarginPercent) / 100));
    const finalPrice = item.manualUnitPrice !== null ? (Number(item.manualUnitPrice) * item.quantity) : suggestedPrice;
    const unitPrice = item.quantity > 0 ? finalPrice / item.quantity : 0;

    return {
      cuts,
      totalParentSheets,
      totalPaperCost,
      totalInkCost,
      totalDepreciationCost,
      totalPowerMaint,
      finishingCost,
      netCost,
      finalPrice,
      unitPrice
    };
  };

  const activeItem = items[activeItemIndex] || items[0];
  const activeCosting = calculateItemCosting(activeItem);

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
        creditLimit: 1000000
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
        specs: `${it.jobWidth}x${it.jobHeight}mm, ${it.isDoubleSided ? '2 หน้า' : '1 หน้า'}, ${it.useLamination ? it.laminationType + ' เคลือบ' : 'ไม่เคลือบ'}`
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
          <span>ກັບຄືນ (Back to Orders)</span>
        </button>
        <div>
          <span className="text-xs uppercase font-extrabold text-accent-sky tracking-wider font-sans block text-right">
            ຂັ້ນຕອນ {currentStep} ຈາກ 3
          </span>
          <h3 className="text-2xl font-black text-primary-navy mt-0.5">
            ຟອມສ້າງອໍເດີໃໝ່ (Create Order Wizard)
          </h3>
        </div>
      </div>

      {/* Stepper Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-3">
        {[
          { step: 1, label: '1. ເລືອກລູກຄ້າ (Customer Info)' },
          { step: 2, label: '2. ລາຍການສິນຄ້າ & ສເປກ (Items & Specs)' },
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
              <span>ຕໍ່ໄປ: ເພີ່ມລາຍການສິນຄ້າ (Next: Customer Items)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CUSTOMER ORDERED ITEMS TABLE & SPECS DRAWER */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Card: Item Entry Table / Block */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <Package className="w-6 h-6 text-accent-sky" />
                  <span>ລາຍການສິນຄ້າທີ່ລູກຄ້າສັ່ງ (Customer Order Item Block List)</span>
                </h4>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  ເພີ່ມຊື່ລາຍການສິນຄ້າ, ຈຳນວນອັນ, ແລະ ກົດປຸ່ມ "ກຳນົດສເປກ" ເພື່ອຄິດໄລ່ຕົ້ນທຶນແຕ່ລະລາຍການ
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95 w-fit"
              >
                <Plus className="w-4 h-4" />
                <span>+ ເພີ່ມລາຍການສິນຄ້າ (Add Item)</span>
              </button>
            </div>

            {/* Item Rows Table */}
            <div className="space-y-3">
              {items.map((it, idx) => {
                const costing = calculateItemCosting(it);
                const isActive = activeItemIndex === idx;

                return (
                  <div 
                    key={it.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isActive 
                        ? 'bg-sky-50/40 border-accent-sky shadow-sm' 
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      {/* Column 1: Item Name / Description input */}
                      <div className="sm:col-span-5 space-y-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase">
                          {idx + 1}. ຊື່ລາຍການສິນຄ້າ (Item Name / Description) *
                        </label>
                        <input
                          type="text"
                          required
                          value={it.name}
                          onChange={(e) => updateItemField(idx, 'name', e.target.value)}
                          placeholder="ເຊັ່ນ: ປຶ້ມ A4 100 ໜ້າ, ສຕິກເກີ 5x5cm..."
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-bold text-xs bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky"
                        />
                      </div>

                      {/* Column 2: Quantity Input */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase">
                          ຈຳນວນ (QTY/ອັນ) *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={it.quantity}
                          onChange={(e) => updateItemField(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-black text-xs font-sans bg-white text-center focus:outline-none focus:ring-2 focus:ring-accent-sky"
                        />
                      </div>

                      {/* Column 3: Calculated Unit Price & Subtotal */}
                      <div className="sm:col-span-3 text-right space-y-0.5">
                        <span className="block text-[10px] font-black text-slate-400 uppercase">
                          ລາຄາລວມ (Subtotal)
                        </span>
                        <span className="text-base font-black text-slate-900 font-sans block">
                          {formatLAK(costing.finalPrice)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold block">
                          (~ {formatLAK(costing.unitPrice)} / ຊຸດ)
                        </span>
                      </div>

                      {/* Column 4: Configure Specs & Delete Actions */}
                      <div className="sm:col-span-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveItemIndex(idx)}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1 ${
                            isActive 
                              ? 'bg-primary-navy text-white shadow-md' 
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>{isActive ? 'ກຳລັງຕັ້ງສເປກ' : 'ຕັ້ງສເປກ'}</span>
                        </button>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Item Specs Engine (3-Column Detailed Calculator) */}
          <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                <span>ຕັ້ງຄ່າສເປກ & ຕົ້ນທຶນສຳລັບ: <strong className="text-accent-sky font-black">"{activeItem?.name}"</strong></span>
              </h4>
              <span className="text-xs font-bold text-slate-400 font-sans">
                Item #{activeItemIndex + 1} of {items.length}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Column 1: Print Job Specs */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Package className="w-4 h-4 text-accent-sky" />
                    <span className="font-black text-xs text-slate-700">1. ເລືອກເຈ້ຍ (Paper Stock)</span>
                  </div>

                  <div className="space-y-3 text-xs font-bold text-slate-600">
                    <div className="space-y-1">
                      <label className="block text-slate-500">ເຈ້ຍທີ່ໃຊ້ພິມ *</label>
                      <select
                        value={activeItem?.paperId}
                        onChange={(e) => updateItemField(activeItemIndex, 'paperId', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                      >
                        {papers.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-500">Width (mm):</label>
                        <input
                          type="number"
                          value={activeItem?.jobWidth}
                          onChange={(e) => updateItemField(activeItemIndex, 'jobWidth', Number(e.target.value))}
                          className="w-full px-3 py-1.5 border rounded-lg font-sans font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-500">Height (mm):</label>
                        <input
                          type="number"
                          value={activeItem?.jobHeight}
                          onChange={(e) => updateItemField(activeItemIndex, 'jobHeight', Number(e.target.value))}
                          className="w-full px-3 py-1.5 border rounded-lg font-sans font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Printer className="w-4 h-4 text-purple-600" />
                    <span className="font-black text-xs text-slate-700">2. ເຄື່ອງພິມ & ໂໝດສີ</span>
                  </div>

                  <div className="space-y-3 text-xs font-bold text-slate-600">
                    <select
                      value={activeItem?.printerId}
                      onChange={(e) => updateItemField(activeItemIndex, 'printerId', e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-white font-bold"
                    >
                      {printers.map(pr => (
                        <option key={pr.id} value={pr.id}>{pr.name}</option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateItemField(activeItemIndex, 'isDoubleSided', false)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-black ${!activeItem?.isDoubleSided ? 'bg-purple-600 text-white' : 'bg-slate-50'}`}
                      >
                        1 ໜ້າ
                      </button>
                      <button
                        type="button"
                        onClick={() => updateItemField(activeItemIndex, 'isDoubleSided', true)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-black ${activeItem?.isDoubleSided ? 'bg-purple-600 text-white' : 'bg-slate-50'}`}
                      >
                        2 ໜ້າ
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Internal Cost Breakdown */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4 border border-slate-800">
                  <span className="font-black text-xs uppercase tracking-wider text-slate-300 block border-b border-slate-800 pb-2">
                    Internal Cost Breakdown
                  </span>
                  <div className="space-y-2 text-xs font-semibold text-slate-300">
                    <div className="flex justify-between">
                      <span>ຕົ້ນທຶນເຈ້ຍ:</span>
                      <span className="font-sans font-black">{formatLAK(activeCosting.totalPaperCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ຕົ້ນທຶນໝຶກ:</span>
                      <span className="font-sans font-black">{formatLAK(activeCosting.totalInkCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ຄ່າເສື່ອມ & ໄຟຟ້າ:</span>
                      <span className="font-sans font-black">{formatLAK(activeCosting.totalDepreciationCost + activeCosting.totalPowerMaint)}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-sky-400 font-black text-xs">
                    <span>Net Internal Cost:</span>
                    <span className="text-base font-sans font-black">{formatLAK(activeCosting.netCost)}</span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Margin (%):</span>
                      <span className="text-emerald-400 font-black">{activeItem?.targetMarginPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="80"
                      value={activeItem?.targetMarginPercent}
                      onChange={(e) => updateItemField(activeItemIndex, 'targetMarginPercent', Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Column 3: Overall Order Summary & Next Button */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-4">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block border-b pb-2">
                    Grand Total Bill ({items.length} items)
                  </span>

                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 space-y-1">
                    <span className="text-[10px] font-black text-emerald-800 uppercase block">ຍອດລວມທັງໝົດ</span>
                    <span className="text-2xl font-black text-emerald-600 font-sans block">{formatLAK(grandTotalBill)}</span>
                  </div>

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
