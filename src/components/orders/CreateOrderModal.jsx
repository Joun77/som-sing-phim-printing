import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft, 
  User, 
  Printer, 
  FileText, 
  DollarSign, 
  Layers, 
  Scissors, 
  Plus, 
  Trash2 
} from 'lucide-react';

export default function CreateOrderModal({
  onClose,
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

  // Auto-filled customer contact
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // STEP 2: Print Specifications & Dynamic Cost Engine State
  const [items, setItems] = useState([
    { id: '', name: '', quantity: 500, unitCost: 0, specs: 'A4 Standard' }
  ]);

  // Pre-fill specs if passed from QuotationManager
  useEffect(() => {
    if (prefilledSpecs && prefilledSpecs.paperId) {
      setItems([{
        id: prefilledSpecs.paperId,
        name: prefilledSpecs.paperName || 'Custom Print Job',
        quantity: prefilledSpecs.quantity || 500,
        unitCost: prefilledSpecs.unitCost || 2000,
        specs: prefilledSpecs.specs || 'A4 Print Job'
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
    const baseCost = paper.costPerSheet || 1500;
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
      updated[index].unitCost = calculateEstimatedUnitPrice(value, updated[index].quantity);
    } else if (field === 'quantity') {
      const qty = Math.max(1, Number(value));
      updated[index].quantity = qty;
      if (updated[index].id) {
        updated[index].unitCost = calculateEstimatedUnitPrice(updated[index].id, qty);
      }
    } else if (field === 'unitCost') {
      updated[index].unitCost = Math.max(0, Number(value));
    } else if (field === 'specs') {
      updated[index].specs = value;
    }
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { id: '', name: '', quantity: 500, unitCost: 0, specs: 'A4 Standard' }]);
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

      // Save to CRM state
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

    // Creates Order AND triggers AppContext inventory FIFO stock deduction
    addOrder(orderData);
    showToast(
      currentLang === 'lo' ? 'ເພີ່ມອໍເດີໃໝ່ ແລະ ຕັດສະຕ໋ອກສຳເລັດ!' : 'New order created & inventory deducted!', 
      'success'
    );
    onClose();
  };

  const paperStocks = inventory.filter(i => i.id.startsWith('LOT-') || i.id.startsWith('sku-') || i.name);

  return (
    <dialog
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent outline-none border-none w-full h-full"
      open
    >
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 overflow-y-auto max-h-[95vh] z-10 border border-slate-100 animate-fade-in flex flex-col justify-between space-y-6">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <span className="text-xs uppercase font-extrabold text-accent-sky tracking-wider font-sans">
              Wizard Step {currentStep} of 3
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-primary-navy mt-0.5">
              {currentLang === 'lo' ? 'ຟອມສ້າງອໍເດີໃໝ່ (Create Order)' : 'Create New Order Wizard'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition text-2xl font-black">
            ✕
          </button>
        </div>

        {/* Wizard Progress Indicator */}
        <div className="flex gap-2">
          {[1, 2, 3].map(st => (
            <div 
              key={st}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                st <= currentStep ? 'bg-accent-sky' : 'bg-slate-100'
              }`}
            />
          ))}
        </div>

        {/* STEP 1: CUSTOMER SELECTION */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-accent-sky" />
                <h4 className="font-black text-slate-800 text-sm">
                  Step 1: {currentLang === 'lo' ? 'ເລືອກຂໍ້ມູນລູກຄ້າ' : 'Customer Selection'}
                </h4>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 font-bold cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="custType"
                    value="existing"
                    checked={customerType === 'existing'}
                    onChange={() => setCustomerType('existing')}
                    className="w-4 h-4 text-accent-sky"
                  />
                  <span>{currentLang === 'lo' ? 'ລູກຄ້າເກົ່າ (Existing Customer)' : 'Existing Customer'}</span>
                </label>
                <label className="flex items-center gap-2 font-bold cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="custType"
                    value="new"
                    checked={customerType === 'new'}
                    onChange={() => setCustomerType('new')}
                    className="w-4 h-4 text-accent-sky"
                  />
                  <span>{currentLang === 'lo' ? 'ລູກຄ້າໃໝ່ (New Customer)' : 'New Customer'}</span>
                </label>
              </div>

              {customerType === 'existing' ? (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-black text-slate-500">Select Customer from CRM *</label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-4 py-3 border-2 rounded-xl bg-white focus:outline-none focus:border-accent-sky font-bold text-sm"
                  >
                    <option value="">-- Choose Existing Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-black text-slate-500">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-accent-sky font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-black text-slate-500">Phone Number</label>
                    <input
                      type="text"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-accent-sky font-bold text-sm font-sans"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-black text-slate-500">Delivery Address</label>
                    <input
                      type="text"
                      value={newCustAddress}
                      onChange={(e) => setNewCustAddress(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-accent-sky font-bold text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="button"
                onClick={handleNextToStep2}
                className="flex items-center gap-2 px-6 py-3 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black shadow-md transition"
              >
                <span>Next: Print Specs Engine</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PRINT SPECS & DYNAMIC COST ENGINE */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-black text-slate-800 text-sm">
                    Step 2: {currentLang === 'lo' ? 'กำหนดสเปกและคำนวณราคา' : 'Print Specifications & Cost Engine'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="flex items-center gap-1 text-xs font-black text-accent-sky hover:underline"
                >
                  + Add Item Row
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-5 space-y-1">
                      <label className="block text-[10px] font-black text-slate-500">Paper SKU Stock *</label>
                      <select
                        required
                        value={item.id}
                        onChange={(e) => handleItemChange(idx, 'id', e.target.value)}
                        className="w-full px-3 py-2 border-2 rounded-lg bg-white focus:outline-none font-bold text-xs"
                      >
                        <option value="">-- Select Paper Stock --</option>
                        {paperStocks.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({formatLAK(p.costPerSheet || 1000)}/sheet)</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[10px] font-black text-slate-500">Qty (Copies) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none font-bold text-xs font-sans"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[10px] font-black text-slate-500">Unit Price (₭) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={item.unitCost}
                        onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                        className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none font-bold text-xs font-sans"
                      />
                    </div>

                    <div className="sm:col-span-2 text-right py-1 whitespace-nowrap text-xs font-black text-slate-900">
                      <span className="block text-[10px] text-slate-400 font-bold">Subtotal</span>
                      {formatLAK(item.quantity * item.unitCost)}
                    </div>

                    <div className="sm:col-span-1 text-center">
                      <button
                        type="button"
                        disabled={items.length <= 1}
                        onClick={() => removeItemRow(idx)}
                        className="text-red-500 hover:text-red-700 font-black text-xs disabled:opacity-30"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center text-xs font-black text-emerald-900">
                <span>Calculated Order Bill Total:</span>
                <span className="text-base font-sans font-black text-emerald-700">{formatLAK(totalAmount)}</span>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1 px-4 py-2.5 border rounded-xl text-slate-500 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNextToStep3}
                className="flex items-center gap-2 px-6 py-3 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black shadow-md transition"
              >
                <span>Next: Order Summary & Stock Deduction</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ORDER SUMMARY & STOCK DEDUCTION */}
        {currentStep === 3 && (
          <form onSubmit={handleSubmitFinal} className="space-y-6 animate-fade-in text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-3">
                <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs border-b pb-2">
                  Step 3: Scheduling & Details
                </h4>
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-500">Promised Delivery Date *</label>
                  <input
                    type="date"
                    required
                    value={promisedDeliveryDate}
                    onChange={(e) => setPromisedDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border-2 rounded-xl focus:outline-none font-bold font-sans text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-500">Delivery Method</label>
                  <select
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="w-full px-3 py-2 border-2 rounded-xl bg-white focus:outline-none font-bold text-xs"
                  >
                    <option value="Pickup">Pickup at Shop</option>
                    <option value="Kerry Lao">Kerry Lao</option>
                    <option value="HAL Logistics">HAL Logistics</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 border-l border-slate-200 pl-0 sm:pl-4">
                <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs border-b pb-2">
                  Order Summary & Stock Trigger
                </h4>
                <div className="space-y-2 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>Total Order Bill:</span>
                    <span className="font-sans font-black text-slate-900 text-sm">{formatLAK(totalAmount)}</span>
                  </div>
                  <div className="space-y-1 pt-1.5 border-t">
                    <label className="block text-[10px] font-black text-slate-400 uppercase">Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => {
                        setPaymentStatus(e.target.value);
                        if (e.target.value === 'Fully Paid') setDepositAmountPaid(totalAmount);
                        else if (e.target.value === 'Pending') setDepositAmountPaid(0);
                      }}
                      className="w-full px-2.5 py-1.5 border-2 rounded-lg bg-white focus:outline-none text-xs font-bold"
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
                        className="w-full px-3 py-1.5 border-2 rounded-lg focus:outline-none font-bold text-xs font-sans"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Artwork link */}
            <div className="space-y-1">
              <label className="block text-xs font-black text-slate-500">Artwork Link (Google Drive / Dropbox)</label>
              <input
                type="text"
                placeholder="https://drive.google.com/..."
                value={artworkLink}
                onChange={(e) => setArtworkLink(e.target.value)}
                className="w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-accent-sky font-bold font-sans text-xs"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-between pt-4 border-t">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1 px-4 py-2.5 border rounded-xl text-slate-500 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/15 transition active:scale-95"
              >
                {currentLang === 'lo' ? 'ຢືນຢັນສ້າງອໍເດີ (Confirm & Deduct Stock)' : 'Submit Order & Deduct Inventory Stock'}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
