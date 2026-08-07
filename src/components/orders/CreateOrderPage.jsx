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
  Edit3,
  Copy,
  X,
  AlertCircle,
  Check
} from 'lucide-react';

import ItemSpecConfigurator, { calculateItemCosting } from './ItemSpecConfigurator';

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

  const createDefaultItem = (name = 'ປຶ້ມ / ສຕິກເກີ ໃໝ່', isConfigured = false) => ({
    id: `item-${Date.now()}-${Math.random().toString().slice(-4)}`,
    name: name,
    quantity: 500,
    isConfigured: isConfigured,
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
    createDefaultItem('ປຶ້ມ A4 Double A', false)
  ]);

  // Modal / Sub-view state for single item spec configurator
  const [editingItemIndex, setEditingItemIndex] = useState(null);

  // Pre-fill specs if passed from QuotationManager
  useEffect(() => {
    if (prefilledSpecs && prefilledSpecs.paperId) {
      const newItem = createDefaultItem(prefilledSpecs.paperName || 'ໃບສະເໜີລາຄາ (Quotation Job)', true);
      newItem.paperId = prefilledSpecs.paperId;
      if (prefilledSpecs.quantity) newItem.quantity = prefilledSpecs.quantity;
      if (prefilledSpecs.unitCost) newItem.manualUnitPrice = prefilledSpecs.unitCost;
      setItems([newItem]);
    }
  }, [prefilledSpecs]);

  const handleAddItemRow = () => {
    const newItem = createDefaultItem(`ລາຍການທີ ${items.length + 1}`, false);
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length > 1) {
      const updated = items.filter((_, i) => i !== index);
      setItems(updated);
    }
  };

  const updateItemField = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const getItemCosting = (item) => calculateItemCosting(item, inventory, equipment);

  const grandTotalBill = items.reduce((sum, it) => sum + getItemCosting(it).finalPrice, 0);
  const allItemsConfigured = items.every(it => it.isConfigured);

  // Modal spec handlers
  const handleOpenSpecModal = (index) => {
    setEditingItemIndex(index);
  };

  const handleSaveSpecModal = (updatedItem) => {
    if (editingItemIndex !== null) {
      setItems(prev => {
        const copy = [...prev];
        copy[editingItemIndex] = updatedItem;
        return copy;
      });
      setEditingItemIndex(null);
      if (showToast) showToast(`ບັນທຶກສເປກ "${updatedItem.name}" ສຳເລັດ!`, 'success');
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
    const unconfiguredItem = items.find(it => !it.isConfigured);
    if (unconfiguredItem) {
      showToast(`ກະລຸນາກຳນົດສເປກສິນຄ້າ "${unconfiguredItem.name}" ໃຫ້ครบก่อนดำเนินการต่อ`, 'warning');
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

  if (editingItemIndex !== null && items[editingItemIndex]) {
    return (
      <ItemSpecConfigurator
        item={items[editingItemIndex]}
        itemIndex={editingItemIndex}
        allItems={items}
        inventory={inventory}
        equipment={equipment}
        formatLAK={formatLAK}
        onSave={handleSaveSpecModal}
        onCancel={() => setEditingItemIndex(null)}
        showToast={showToast}
      />
    );
  }

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

      {/* STEP 2: MASTER ITEM LIST VIEW */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fade-in">
          {/* Master Item List View */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <Package className="w-6 h-6 text-accent-sky" />
                  <span>รายการสินค้าที่ลูกค้าสั่ง (Master Order Item List)</span>
                </h4>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  เพิ่มรายการสินค้า กำหนดจำนวน และกดปุ่ม "[⚙️ กำหนดสเปก]" เพื่อตั้งค่าสเปกการพิมพ์และคำนวณต้นทุน
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black shadow-md shadow-accent-sky/20 transition active:scale-95 w-fit"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มรายการสินค้า (Add New Item)</span>
              </button>
            </div>

            {/* Item Rows Table */}
            <div className="space-y-3">
              {items.map((it, idx) => {
                const costing = calculateItemCosting(it, inventory, equipment);

                return (
                  <div 
                    key={it.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      it.isConfigured 
                        ? 'bg-emerald-50/30 border-emerald-200/80 shadow-sm' 
                        : 'bg-amber-50/30 border-amber-200/80 shadow-sm'
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      {/* Item Name / Title */}
                      <div className="sm:col-span-4 space-y-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase">
                          Item #{idx + 1}: ชื่อรายการสินค้า (Item Name) *
                        </label>
                        <input
                          type="text"
                          required
                          value={it.name}
                          onChange={(e) => updateItemField(idx, 'name', e.target.value)}
                          placeholder="เช่น: หนังสือภาษาลาว, หนังสือภาษาไทย..."
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-bold text-xs bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky"
                        />
                      </div>

                      {/* Quantity Input */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase">
                          จำนวน (Quantity) *
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

                      {/* Calculated Subtotal */}
                      <div className="sm:col-span-2 text-right space-y-0.5">
                        <span className="block text-[10px] font-black text-slate-400 uppercase">
                          ราคารวม (Subtotal)
                        </span>
                        <span className="text-base font-black text-slate-900 font-sans block">
                          {formatLAK(costing.finalPrice)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold block">
                          (~ {formatLAK(costing.unitPrice)} / ชิ้น)
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className="sm:col-span-2 flex items-center justify-center">
                        {it.isConfigured ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <Check className="w-3.5 h-3.5" />
                            <span>Configured - {formatLAK(costing.finalPrice)}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Pending Specs</span>
                          </span>
                        )}
                      </div>

                      {/* Config & Delete Actions */}
                      <div className="sm:col-span-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenSpecModal(idx)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm ${
                            it.isConfigured
                              ? 'bg-primary-navy hover:bg-slate-800 text-white'
                              : 'bg-accent-sky hover:bg-sky-600 text-white'
                          }`}
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>[⚙️ กำหนดสเปก]</span>
                        </button>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                            title="ลบรายการนี้"
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

            {/* Dynamic Grand Total Bill Card */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Grand Total Bill ({items.length} items)
                </span>
                <span className="text-2xl sm:text-3xl font-black font-sans text-emerald-400 mt-1 block">
                  {formatLAK(grandTotalBill)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleNextToStep3}
                  className={`px-6 py-3.5 rounded-2xl font-black text-xs shadow-lg transition active:scale-95 flex items-center gap-2 ${
                    allItemsConfigured
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  }`}
                >
                  <span>ต่อไป: สรุปยอด & ตัดสต็อก (Step 3)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ย้อนกลับ (Back)</span>
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

