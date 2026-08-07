import React, { useState, useEffect } from 'react';

export default function CreateOrderModal({
  onClose,
  inventory,
  customers,
  addCustomer,
  addOrder,
  showToast,
  formatLAK,
  currentLang,
  t
}) {
  const [customerType, setCustomerType] = useState('existing'); // existing | new
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustCredit, setNewCustCredit] = useState(1000000);

  // Auto-filled fields for existing customer
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Items in the order
  const [items, setItems] = useState([
    { id: '', name: '', quantity: 1, unitCost: 0 }
  ]);

  // General fields
  const [promisedDeliveryDate, setPromisedDeliveryDate] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('Pickup');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [depositAmountPaid, setDepositAmountPaid] = useState(0);
  const [artworkLink, setArtworkLink] = useState('');

  // Auto-fill existing customer fields on select
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

  // Pricing engine
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
    }
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { id: '', name: '', quantity: 1, unitCost: 0 }]);
  };

  const removeItemRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  const remainingBalance = Math.max(0, totalAmount - Number(depositAmountPaid));

  const handleSubmit = (e) => {
    e.preventDefault();

    let finalCustomerName = '';
    let finalPhone = '';
    let finalAddress = '';

    if (customerType === 'new') {
      if (!newCustName.trim()) {
        showToast('Please enter new customer name', 'warning');
        return;
      }
      finalCustomerName = newCustName;
      finalPhone = newCustPhone;
      finalAddress = newCustAddress;

      // Add to CRM state
      addCustomer({
        name: newCustName,
        phone: newCustPhone,
        address: newCustAddress,
        creditLimit: newCustCredit
      });
    } else {
      const cust = customers.find(c => c.id === selectedCustomerId);
      if (!cust) {
        showToast('Please select a customer', 'warning');
        return;
      }
      finalCustomerName = cust.name;
      finalPhone = cust.phone;
      finalAddress = cust.address;
    }

    // Verify item list
    const validItems = items.filter(item => item.id);
    if (validItems.length === 0) {
      showToast('Please add at least one print item', 'warning');
      return;
    }

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
    showToast(currentLang === 'lo' ? 'ເພີ່ມອໍເດີໃໝ່ສຳເລັດ!' : 'New order created successfully!', 'success');
    onClose();
  };

  // Filter paper stocks only
  const paperStocks = inventory.filter(i => i.id.startsWith('LOT-') || i.id.startsWith('sku-') || i.name);

  return (
    <dialog
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent outline-none border-none w-full h-full"
      open
    >
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 overflow-y-auto max-h-[95vh] z-10 border border-slate-100 animate-fade-in flex flex-col justify-between space-y-6">
        {/* Title */}
        <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-xl sm:text-2xl font-black text-primary-navy">
            {currentLang === 'lo' ? 'ເພີ່ມອໍເດີໃໝ່' : 'Create New Order'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition text-2xl font-black">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          {/* STEP 1: Customer Selection */}
          <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs">
              Step 1: Customer Info
            </h4>

            {/* Toggle */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="radio"
                  name="custType"
                  value="existing"
                  checked={customerType === 'existing'}
                  onChange={() => setCustomerType('existing')}
                  className="w-4 h-4 text-accent-sky"
                />
                <span>{currentLang === 'lo' ? 'ລູກຄ້າເກົ່າ' : 'Existing Customer'}</span>
              </label>
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="radio"
                  name="custType"
                  value="new"
                  checked={customerType === 'new'}
                  onChange={() => setCustomerType('new')}
                  className="w-4 h-4 text-accent-sky"
                />
                <span>{currentLang === 'lo' ? 'ລູກຄ້າໃໝ່' : 'New Customer'}</span>
              </label>
            </div>

            {customerType === 'existing' ? (
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500">Select Customer *</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-xl bg-white focus:outline-none focus:border-accent-sky font-bold"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-500">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-accent-sky font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-500">Phone Number</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-accent-sky font-bold font-sans"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-black text-slate-500">Delivery Address</label>
                  <input
                    type="text"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-accent-sky font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Items & Pricing Engine */}
          <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs">
                Step 2: Print Items & Sizing
              </h4>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1 text-xs font-black text-accent-sky hover:underline"
              >
                + Add Item Row
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end border-b pb-3 sm:border-none sm:pb-0">
                  <div className="sm:col-span-5 space-y-1">
                    <label className="block text-[10px] font-black text-slate-500">Paper SKU / Type *</label>
                    <select
                      required
                      value={item.id}
                      onChange={(e) => handleItemChange(idx, 'id', e.target.value)}
                      className="w-full px-3 py-2 border-2 rounded-lg bg-white focus:outline-none font-bold text-xs"
                    >
                      <option value="">-- Select Paper Type --</option>
                      {paperStocks.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({formatLAK(p.costPerSheet || 1000)}/sheet)</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-[10px] font-black text-slate-500">Qty *</label>
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
                  <div className="sm:col-span-2 text-right py-2 whitespace-nowrap text-xs font-black text-slate-900">
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
          </div>

          {/* STEP 3: Summary & Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
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
                Order Financial Summary
              </h4>
              <div className="space-y-2 text-xs font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Total Bill:</span>
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
                      min="1"
                      max={totalAmount}
                      value={depositAmountPaid}
                      onChange={(e) => setDepositAmountPaid(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border-2 rounded-lg focus:outline-none font-bold text-xs font-sans"
                    />
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t text-red-600 font-black">
                  <span>Remaining Unpaid:</span>
                  <span className="font-sans text-sm">{formatLAK(remainingBalance)}</span>
                </div>
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
              className="w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-accent-sky font-bold font-sans"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border rounded-xl text-slate-500 hover:bg-slate-50 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 transition"
            >
              Submit Order
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
