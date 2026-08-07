import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  User, 
  Printer, 
  ChevronRight, 
  Plus, 
  Trash2,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export default function CreateOrderPage({
  onBack,
  inventory,
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

  // STEP 2: Print Specifications & Dynamic Cost Engine State
  const [items, setItems] = useState([
    { id: '', name: '', quantity: 500, unitCost: 0, specs: 'A4 Standard', isManualPrice: false }
  ]);

  // Pre-fill specs if passed from QuotationManager
  useEffect(() => {
    if (prefilledSpecs && prefilledSpecs.paperId) {
      setItems([{
        id: prefilledSpecs.paperId,
        name: prefilledSpecs.paperName || 'Custom Print Job',
        quantity: prefilledSpecs.quantity || 500,
        unitCost: prefilledSpecs.unitCost || 2000,
        specs: prefilledSpecs.specs || 'A4 Print Job',
        isManualPrice: true
      }]);
    }
  }, [prefilledSpecs]);

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

  // Dynamic Pricing Engine
  const calculateEstimatedUnitPrice = (skuId, qty) => {
    const paper = inventory.find(p => p.id === skuId);
    if (!paper) return 2000;
    const baseCost = paper.costPerSheet || paper.costPerConsumptionUnit || 1500;
    let markup = 1.8;
    if (qty >= 1000) markup = 1.25;
    else if (qty >= 500) markup = 1.35;
    else if (qty >= 100) markup = 1.5;
    return Math.round(baseCost * markup);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    if (field === 'id') {
      const selectedInv = inventory.find(p => p.id === value);
      updated[index].id = value;
      updated[index].name = selectedInv ? selectedInv.name : '';
      
      const fetchedPrice = selectedInv 
        ? (selectedInv.costPerSheet || selectedInv.costPerConsumptionUnit || calculateEstimatedUnitPrice(value, updated[index].quantity))
        : 0;

      updated[index].unitCost = fetchedPrice;
      updated[index].isManualPrice = false;
    } else if (field === 'quantity') {
      const qty = Math.max(1, Number(value));
      updated[index].quantity = qty;
      if (updated[index].id && !updated[index].isManualPrice) {
        updated[index].unitCost = calculateEstimatedUnitPrice(updated[index].id, qty);
      }
    } else if (field === 'unitCost') {
      updated[index].unitCost = Math.max(0, Number(value));
      updated[index].isManualPrice = true;
    } else if (field === 'specs') {
      updated[index].specs = value;
    }
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { id: '', name: '', quantity: 500, unitCost: 0, specs: 'A4 Standard', isManualPrice: false }]);
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
    const validItems = items.filter(item => item.id);
    if (validItems.length === 0) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກລາຍການພິມຢ່າງໜ້ອຍ 1 รายการ' : 'Please add at least one print item', 'warning');
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

    const validItems = items.filter(item => item.id);

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

  const paperStocks = inventory.filter(i => i.id.startsWith('LOT-') || i.id.startsWith('sku-') || i.name);

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
            Step {currentStep} of 3
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
          { step: 2, label: currentLang === 'lo' ? '2. สเปกงานพิมพ์ & ราคา' : '2. Print Specs & Pricing' },
          { step: 3, label: currentLang === 'lo' ? '3. สรุปยอด & ตัดสต็อก' : '3. Summary & Deduction' }
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
              <span>Next: Print Specs Engine</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PRINT SPECS & DYNAMIC COST ENGINE */}
      {currentStep === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Printer className="w-6 h-6 text-indigo-600" />
              <h4 className="font-black text-slate-800 text-base">
                Step 2: {currentLang === 'lo' ? 'กำหนดสเปกและคำนวณราคา' : 'Print Specifications & Cost Engine'}
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

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="bg-slate-50/60 p-5 rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                <div className="sm:col-span-5 space-y-1">
                  <label className="block text-xs font-black text-slate-500">Paper SKU Stock *</label>
                  <select
                    required
                    value={item.id}
                    onChange={(e) => handleItemChange(idx, 'id', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky focus:border-transparent font-bold text-xs transition"
                  >
                    <option value="">-- Select Paper Stock --</option>
                    {paperStocks.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({formatLAK(p.costPerSheet || 1000)}/sheet)</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-black text-slate-500">Qty (Copies) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-sky focus:border-transparent font-bold text-xs font-sans transition"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-black text-slate-500">Unit Price (₭) *</label>
                    {item.isManualPrice && (
                      <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 px-1 rounded">Manual</span>
                    )}
                  </div>
                  <input
                    type="number"
                    required
                    min="0"
                    value={item.unitCost}
                    onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-sky focus:border-transparent font-bold text-xs font-sans transition"
                  />
                </div>

                <div className="sm:col-span-2 text-right py-1 whitespace-nowrap text-sm font-black text-slate-900">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Subtotal</span>
                  {formatLAK(item.quantity * item.unitCost)}
                </div>

                <div className="sm:col-span-1 text-center">
                  <button
                    type="button"
                    disabled={items.length <= 1}
                    onClick={() => removeItemRow(idx)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl font-black text-xs disabled:opacity-30 transition"
                  >
                    ✕
                  </button>
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
