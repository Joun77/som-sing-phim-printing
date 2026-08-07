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
  FileText
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
  const [customerType, setCustomerType] = useState('existing'); // existing | new
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustCredit, setNewCustCredit] = useState(1000000);

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // STEP 2: Categorized Print Specifications & Costing Engine State
  const [items, setItems] = useState([
    {
      id: '',
      name: '',
      quantity: 500,
      paperId: '',
      printerId: '',
      colorMode: 'CMYK', // CMYK | Mono
      printSides: 'Duplex', // Simplex | Duplex
      lamination: 'None', // None | Glossy | Matte
      folding: 'None', // None | Half | TriFold
      binding: 'None', // None | Staple | Spiral | Perfect
      jobWidth: 210,
      jobHeight: 297,
      unitCost: 0,
      isManualPrice: false
    }
  ]);

  // Pre-fill specs if passed from QuotationManager
  useEffect(() => {
    if (prefilledSpecs && prefilledSpecs.paperId) {
      setItems([{
        id: prefilledSpecs.paperId,
        paperId: prefilledSpecs.paperId,
        printerId: equipment && equipment.length > 0 ? equipment[0].id : '',
        name: prefilledSpecs.paperName || 'Custom Print Job',
        quantity: prefilledSpecs.quantity || 500,
        colorMode: 'CMYK',
        printSides: 'Duplex',
        lamination: 'None',
        folding: 'None',
        binding: 'None',
        jobWidth: 210,
        jobHeight: 297,
        unitCost: prefilledSpecs.unitCost || 2000,
        isManualPrice: true
      }]);
    }
  }, [prefilledSpecs, equipment]);

  // Auto-fill existing customer fields
  useEffect(() => {
    if (customerType === 'existing' && selectedCustomerId) {
      const cust = customers.find(c => c.id === selectedCustomerId);
      if (cust) {
        setPhone(cust.phone || '');
        setAddress(cust.address || '');
      }
    } else {
      setPhone('');
      setAddress('');
    }
  }, [selectedCustomerId, customerType, customers]);

  // Filter Categorized Stock & Equipment
  const paperStocks = inventory ? inventory.filter(i => i.category === 'Paper' || i.name.includes('A4') || i.name.includes('A3') || i.id.startsWith('LOT-')) : [];
  const printerEquipment = equipment ? equipment.filter(e => e.category === 'Printer' || e.printerType || e.name.includes('C6085') || e.name.includes('Printer')) : [];

  // Dynamic Comprehensive Pricing Calculator
  const calculateDetailedItemUnitPrice = (item) => {
    const paper = inventory ? inventory.find(p => p.id === item.paperId) : null;
    const paperBaseCost = paper ? (paper.costPerSheet || paper.costPerConsumptionUnit || 1500) : 1200;

    const printer = equipment ? equipment.find(e => e.id === item.printerId) : null;
    const printerDepreciation = printer ? (printer.calculatedCostPerPage || 90) : 80;

    const sidesMult = item.printSides === 'Duplex' ? 2 : 1;
    const inkCost = item.colorMode === 'CMYK' ? 250 : 80;

    let finishingAddon = 0;
    if (item.lamination === 'Glossy') finishingAddon += 300;
    if (item.lamination === 'Matte') finishingAddon += 450;
    if (item.folding !== 'None') finishingAddon += 100;
    if (item.binding === 'Staple') finishingAddon += 200;
    if (item.binding === 'Spiral') finishingAddon += 2500;
    if (item.binding === 'Perfect') finishingAddon += 1500;

    const netUnitCost = paperBaseCost + (printerDepreciation * sidesMult) + (inkCost * sidesMult) + finishingAddon;
    
    let markup = 1.6;
    if (item.quantity >= 1000) markup = 1.25;
    else if (item.quantity >= 500) markup = 1.35;
    else if (item.quantity >= 100) markup = 1.45;

    return Math.round(netUnitCost * markup);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === 'paperId') {
      const selectedPaper = inventory.find(p => p.id === value);
      updated[index].id = value;
      updated[index].name = selectedPaper ? selectedPaper.name : 'Print Job';
      if (!updated[index].isManualPrice) {
        updated[index].unitCost = calculateDetailedItemUnitPrice(updated[index]);
      }
    } else if (field === 'quantity' || field === 'printerId' || field === 'colorMode' || field === 'printSides' || field === 'lamination' || field === 'binding') {
      if (!updated[index].isManualPrice) {
        updated[index].unitCost = calculateDetailedItemUnitPrice(updated[index]);
      }
    } else if (field === 'unitCost') {
      updated[index].unitCost = Math.max(0, Number(value));
      updated[index].isManualPrice = true;
    }

    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, {
      id: '',
      name: '',
      quantity: 500,
      paperId: '',
      printerId: printerEquipment.length > 0 ? printerEquipment[0].id : '',
      colorMode: 'CMYK',
      printSides: 'Duplex',
      lamination: 'None',
      folding: 'None',
      binding: 'None',
      jobWidth: 210,
      jobHeight: 297,
      unitCost: 0,
      isManualPrice: false
    }]);
  };

  const removeItemRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // STEP 3: Order Details & Payment
  const [promisedDeliveryDate, setPromisedDeliveryDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [deliveryMethod, setDeliveryMethod] = useState('Pickup');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [depositAmountPaid, setDepositAmountPaid] = useState(0);
  const [artworkLink, setArtworkLink] = useState('');

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  const remainingBalance = Math.max(0, totalAmount - Number(depositAmountPaid));

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
    const validItems = items.filter(item => item.paperId || item.id);
    if (validItems.length === 0) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກລາຍການພິມຢ່າງໜ້ອຍ 1 รายการ' : 'Please select paper stock for print items', 'warning');
      return;
    }
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
      const cust = customers.find(c => c.id === selectedCustomerId);
      if (cust) {
        finalCustomerName = cust.name;
        finalPhone = cust.phone;
        finalAddress = cust.address;
      }
    }

    const validItems = items.map(item => ({
      id: item.paperId || item.id,
      name: item.name || 'Custom Print Job',
      quantity: item.quantity,
      unitCost: item.unitCost,
      specs: `${item.colorMode}, ${item.printSides}, ${item.lamination !== 'None' ? item.lamination + ' Lam' : 'No Lam'}, ${item.binding !== 'None' ? item.binding + ' Binding' : 'No Binding'}`
    }));

    const orderData = {
      customerName: finalCustomerName,
      phone: finalPhone,
      address: finalAddress,
      items: validItems,
      totalPriceCharged: totalAmount,
      depositAmountPaid: Number(depositAmountPaid),
      remainingUnpaidBalance: remainingBalance,
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
          { step: 2, label: currentLang === 'lo' ? '2. สเปกงานพิมพ์ & ราคา' : '2. Categorized Print Specs' },
          { step: 3, label: currentLang === 'lo' ? '3. สรุปยอด & ตัดสต็อก' : '3. Summary & Stock Trigger' }
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
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
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
              <span>Next: Categorized Specs Engine</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CATEGORIZED SPECS & DYNAMIC COST ENGINE */}
      {currentStep === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Printer className="w-6 h-6 text-indigo-600" />
              <h4 className="font-black text-slate-800 text-base">
                Step 2: {currentLang === 'lo' ? 'กำหนดสเปกแยกตามประเภทและคำนวณราคา' : 'Categorized Print Specs & Pricing'}
              </h4>
            </div>
            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-accent-sky border border-slate-100 rounded-xl text-xs font-black transition"
            >
              + Add Item Row
            </button>
          </div>

          <div className="space-y-6">
            {items.map((item, idx) => (
              <div key={idx} className="bg-slate-50/60 p-6 rounded-2xl border border-slate-200/80 space-y-5">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-xs font-black text-indigo-900 uppercase tracking-wider">
                    Item #{idx + 1} Specification Breakdown
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="text-red-500 hover:text-red-700 font-bold text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Item</span>
                    </button>
                  )}
                </div>

                {/* Sub-grid 4 Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold text-slate-700">
                  
                  {/* 1. Paper Specs (Filtered by Category Paper) */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center gap-1.5 text-accent-sky border-b pb-2">
                      <Package className="w-4 h-4" />
                      <span className="font-black">1. Paper Stock (คลังสินค้า - กระดาษ)</span>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] text-slate-500 font-black">Select Paper SKU *</label>
                      <select
                        required
                        value={item.paperId}
                        onChange={(e) => handleItemChange(idx, 'paperId', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky font-bold text-xs transition"
                      >
                        <option value="">-- Choose Paper Stock --</option>
                        {paperStocks.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({formatLAK(p.costPerSheet || 1000)}/sheet)</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[11px] text-slate-500 font-black">Print Qty (Copies) *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-sky font-bold text-xs font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Printer & Ink Specs (Filtered by Equipment Printer) */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center gap-1.5 text-purple-600 border-b pb-2">
                      <Printer className="w-4 h-4" />
                      <span className="font-black">2. Printer & Ink (เครื่องจักร - เครื่องพิมพ์)</span>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] text-slate-500 font-black">Printer Equipment *</label>
                      <select
                        value={item.printerId}
                        onChange={(e) => handleItemChange(idx, 'printerId', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky font-bold text-xs transition"
                      >
                        {printerEquipment.map(e => (
                          <option key={e.id} value={e.id}>{e.name} ({formatLAK(e.calculatedCostPerPage || 90)}/page cost)</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[11px] text-slate-500 font-black">Color Mode</label>
                        <select
                          value={item.colorMode}
                          onChange={(e) => handleItemChange(idx, 'colorMode', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none font-bold text-xs"
                        >
                          <option value="CMYK">Full Color CMYK</option>
                          <option value="Mono">Monochrome (ขาวดำ)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] text-slate-500 font-black">Sides</label>
                        <select
                          value={item.printSides}
                          onChange={(e) => handleItemChange(idx, 'printSides', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none font-bold text-xs"
                        >
                          <option value="Simplex">1 หน้า (Simplex)</option>
                          <option value="Duplex">2 หน้า (Duplex)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 3. Post-Press Finishing */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center gap-1.5 text-emerald-600 border-b pb-2">
                      <Scissors className="w-4 h-4" />
                      <span className="font-black">3. Finishing (บริการเคลือบ / พับ)</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[11px] text-slate-500 font-black">Lamination (เคลือบ)</label>
                        <select
                          value={item.lamination}
                          onChange={(e) => handleItemChange(idx, 'lamination', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none font-bold text-xs"
                        >
                          <option value="None">ไม่เคลือบ (None)</option>
                          <option value="Glossy">เคลือบเงา (Glossy)</option>
                          <option value="Matte">เคลือบด้าน (Matte)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] text-slate-500 font-black">Folding (การพับ)</label>
                        <select
                          value={item.folding}
                          onChange={(e) => handleItemChange(idx, 'folding', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none font-bold text-xs"
                        >
                          <option value="None">ไม่พับ (Flat)</option>
                          <option value="Half">พับครึ่ง (Half-fold)</option>
                          <option value="TriFold">พับ 3 ตอน (Tri-fold)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 4. Binding Services */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center gap-1.5 text-amber-600 border-b pb-2">
                      <Layers className="w-4 h-4" />
                      <span className="font-black">4. Binding Services (การเข้าเล่ม)</span>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] text-slate-500 font-black">Binding Type</label>
                      <select
                        value={item.binding}
                        onChange={(e) => handleItemChange(idx, 'binding', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none font-bold text-xs"
                      >
                        <option value="None">ไม่เข้าเล่ม (No Binding)</option>
                        <option value="Staple">เย็บแม็กกลาง / สัน (Staple)</option>
                        <option value="Spiral">เข้าเล่มกระดูกงู (Spiral Wire-O)</option>
                        <option value="Perfect">เข้าเล่มไสสลักกาว (Perfect Binding)</option>
                      </select>
                    </div>
                  </div>

                </div>

                {/* Real-time Item Pricing Output */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-500">Unit Selling Price (₭):</span>
                      {item.isManualPrice && (
                        <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Manual Override
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      required
                      min="0"
                      value={item.unitCost}
                      onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                      className="w-48 px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-sky font-bold text-sm font-sans"
                    />
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Item Subtotal</span>
                    <span className="text-lg font-black text-slate-900 font-sans">{formatLAK(item.quantity * item.unitCost)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-100 flex justify-between items-center text-sm font-black text-emerald-900">
            <span>Calculated Order Bill Total:</span>
            <span className="text-xl font-sans font-black text-emerald-700">{formatLAK(totalAmount)}</span>
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
            <button
              type="button"
              onClick={handleNextToStep3}
              className="flex items-center gap-2 px-6 py-3 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95"
            >
              <span>Next: Order Summary & Stock Deduction</span>
              <ChevronRight className="w-4 h-4" />
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
                  <span className="font-sans font-black text-slate-900 text-base">{formatLAK(totalAmount)}</span>
                </div>
                <div className="space-y-1 pt-2 border-t border-slate-200">
                  <label className="block text-[10px] font-black text-slate-400 uppercase">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => {
                      setPaymentStatus(e.target.value);
                      if (e.target.value === 'Fully Paid') setDepositAmountPaid(totalAmount);
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
                      max={totalAmount}
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
