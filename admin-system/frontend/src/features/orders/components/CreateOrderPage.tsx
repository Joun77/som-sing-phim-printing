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
import CustomerCombobox from '@components/common/CustomerCombobox';

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
    avgCoverageK: 15,
    avgCoverageCMY: 10,
    mediaType: 'Sheet-fed',
    customFinishingOptions: [] as string[],
    overheadPercent: 15,
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

  // Order-Level Operating Costs & Overhead State (Step 2)
  const [orderOverheadMode, setOrderOverheadMode] = useState('Standard');
  const [customSetupFee, setCustomSetupFee] = useState(10000);
  const [customLaborFee, setCustomLaborFee] = useState(25000);
  const [customDeprPowerFee, setCustomDeprPowerFee] = useState(15000);
  const [customSpoilageFee, setCustomSpoilageFee] = useState(10000);

  const isCustomOverhead = orderOverheadMode === 'Custom';
  const setupFee = isCustomOverhead ? Number(customSetupFee) : 10000;
  const laborFee = isCustomOverhead ? Number(customLaborFee) : (20000 + (items.length * 5000));
  const deprPowerFee = isCustomOverhead ? Number(customDeprPowerFee) : (15000 + (items.reduce((acc, it) => acc + Number(it.quantity || 0), 0) * 5));
  const spoilageFee = isCustomOverhead ? Number(customSpoilageFee) : 10000;

  const orderOperatingOverhead = setupFee + laborFee + deprPowerFee + spoilageFee;

  const getItemCosting = (item) => calculateItemCosting(item, inventory, equipment);

  const sumItemSubtotals = items.reduce((sum, it) => sum + getItemCosting(it).finalPrice, 0);
  const grandTotalBill = sumItemSubtotals + orderOperatingOverhead;
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

  const [isCalculating, setIsCalculating] = useState(false);
  const [backendCalculationBreakdown, setBackendCalculationBreakdown] = useState([]);

  const handleNextToStep3 = async () => {
    const unconfiguredItem = items.find(it => !it.isConfigured);
    if (unconfiguredItem) {
      showToast(`ກະລຸນາກຳນົດສເປກສິນຄ້າ "${unconfiguredItem.name}" ໃຫ້ຄົບກ່ອນດຳເນີນການຕໍ່`, 'warning');
      return;
    }

    setIsCalculating(true);
    try {
      const breakdowns = [];
      for (const it of items) {
        const paperItem = inventory ? inventory.find(p => p.id === it.paperId) : null;
        const paperCost = paperItem ? (paperItem.costPerConsumptionUnit || 90) : 100;
        const printerItem = equipment ? equipment.find(e => e.id === it.printerId) : null;
        const inkCostPerMl = printerItem ? (printerItem.inkUnitCostMl || 500) : 500;

        const payload = {
          job_name: it.name,
          quantity: Number(it.quantity || 1),
          paper_sku: it.paperId || 'default-paper',
          paper_cost_per_unit: paperCost,
          paper_format: it.mediaType === 'Roll-fed' ? 'roll' : 'sheet',
          ink_coverage_k_percent: Number(it.avgCoverageK !== undefined ? it.avgCoverageK : (it.avgCoverage || 5)),
          ink_coverage_cmy_percent: it.colorMode === 'Monochrome' ? 0.0 : Number(it.avgCoverageCMY !== undefined ? it.avgCoverageCMY : 10),
          ink_cost_k_per_ml: Number(printerItem?.inkUnitCostMl || inkCostPerMl),
          ink_cost_cmy_per_ml: Number(printerItem?.inkUnitCostCMY || printerItem?.inkUnitCostMl || 600),
          machine_price: Number(printerItem?.price || printerItem?.machinePrice || 0),
          target_total_pages: Number(printerItem?.targetTotalPages || printerItem?.targetPages || 1000000),
          maintenance_cost_per_page: Number(printerItem?.maintenanceCostPerPage || printerItem?.maintenanceCost || 0),
          job_width: Number(it.jobWidth || 210),
          job_height: Number(it.jobHeight || 297),
          custom_finishing_options: it.customFinishingOptions || [],
          lamination_type: it.useLamination ? (it.laminationType || 'Glossy') : 'none',
          lamination_cost: it.useLamination ? 150.0 : 0.0,
          binding_type: it.useBinding ? (it.bindingType || 'Staple') : 'none',
          binding_cost: it.useBinding ? 200.0 : 0.0,
          labor_cost_per_hour: 25000.0,
          estimated_hours: 0.5,
          overhead_percent: Number(it.overheadPercent !== undefined ? it.overheadPercent : 15) / 100.0,
          target_margin_percent: (Number(it.targetMarginPercent) || 35) / 100.0
        };

        const response = await fetch('http://localhost:8080/api/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Backend pricing failure');
        const data = await response.json();
        breakdowns.push(data);
      }

      setBackendCalculationBreakdown(breakdowns);
      setCurrentStep(3);
      showToast('Calculated prices from backend pricing engine!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Using local pricing fallback due to offline server.', 'warning');
      setCurrentStep(3);
    } finally {
      setIsCalculating(false);
    }
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

    const payload = {
      customer_name: finalCustomerName,
      customer_phone: finalPhone,
      google_drive_link: artworkLink,
      items: items.map(it => {
        const paperItem = inventory ? inventory.find(p => p.id === it.paperId) : null;
        const paperCost = paperItem ? (paperItem.costPerConsumptionUnit || 90) : 100;
        const printerItem = equipment ? equipment.find(e => e.id === it.printerId) : null;
        const inkCostPerMl = printerItem ? (printerItem.inkUnitCostMl || 500) : 500;

        return {
          job_name: it.name,
          quantity: Number(it.quantity || 1),
          paper_sku: it.paperId || 'default-paper',
          paper_cost_per_unit: paperCost,
          paper_format: it.mediaType === 'Roll-fed' ? 'roll' : 'sheet',
          ink_coverage_k_percent: Number(it.avgCoverageK !== undefined ? it.avgCoverageK : (it.avgCoverage || 5)),
          ink_coverage_cmy_percent: it.colorMode === 'Monochrome' ? 0.0 : Number(it.avgCoverageCMY !== undefined ? it.avgCoverageCMY : 10),
          ink_cost_k_per_ml: Number(printerItem?.inkUnitCostMl || inkCostPerMl),
          ink_cost_cmy_per_ml: Number(printerItem?.inkUnitCostCMY || printerItem?.inkUnitCostMl || 600),
          machine_price: Number(printerItem?.price || printerItem?.machinePrice || 0),
          target_total_pages: Number(printerItem?.targetTotalPages || printerItem?.targetPages || 1000000),
          maintenance_cost_per_page: Number(printerItem?.maintenanceCostPerPage || printerItem?.maintenanceCost || 0),
          job_width: Number(it.jobWidth || 210),
          job_height: Number(it.jobHeight || 297),
          custom_finishing_options: it.customFinishingOptions || [],
          lamination_type: it.useLamination ? (it.laminationType || 'Glossy') : 'none',
          lamination_cost: it.useLamination ? 150.0 : 0.0,
          binding_type: it.useBinding ? (it.bindingType || 'Staple') : 'none',
          binding_cost: it.useBinding ? 200.0 : 0.0,
          labor_cost_per_hour: 25000.0,
          estimated_hours: 0.5,
          overhead_percent: Number(it.overheadPercent !== undefined ? it.overheadPercent : 15) / 100.0,
          target_margin_percent: (Number(it.targetMarginPercent) || 35) / 100.0,
          specs: {
            dimensions: `${it.jobWidth}x${it.jobHeight}mm`,
            double_sided: it.isDoubleSided
          }
        };
      })
    };

    fetch('http://localhost:8080/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) throw new Error('Order creation failed');
      return res.json();
    })
    .then(orderData => {
      if (paymentStatus === 'Deposit Paid' && depositAmountPaid > 0) {
        return fetch(`http://localhost:8080/api/orders/${orderData.id}/deposit`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deposit_amount: Number(depositAmountPaid) })
        })
        .then(res => res.json())
        .then(updatedOrder => {
          addOrder({
            id: updatedOrder.id,
            orderNumber: updatedOrder.order_number,
            customerName: updatedOrder.customer_name,
            phone: updatedOrder.customer_phone,
            items: updatedOrder.items.map(it => ({
              id: it.id,
              name: it.job_name,
              quantity: it.quantity,
              unitCost: it.unit_price_snapshot,
              specs: 'Synced'
            })),
            totalPriceCharged: updatedOrder.total_price,
            depositAmountPaid: updatedOrder.deposit_amount,
            remainingUnpaidBalance: Math.max(0, updatedOrder.total_price - updatedOrder.deposit_amount),
            paymentStatus: 'Deposit Paid',
            status: 'Received',
            promisedDeliveryDate: promisedDeliveryDate,
            deliveryMethod: deliveryMethod,
            artworkLink: updatedOrder.google_drive_link
          });
        });
      } else {
        addOrder({
          id: orderData.id,
          orderNumber: orderData.order_number,
          customerName: orderData.customer_name,
          phone: orderData.customer_phone,
          items: orderData.items.map(it => ({
            id: it.id,
            name: it.job_name,
            quantity: it.quantity,
            unitCost: it.unit_price_snapshot,
            specs: 'Synced'
          })),
          totalPriceCharged: orderData.total_price,
          depositAmountPaid: orderData.deposit_amount,
          remainingUnpaidBalance: orderData.total_price,
          paymentStatus: paymentStatus === 'Fully Paid' ? 'Fully Paid' : 'Pending',
          status: 'Received',
          promisedDeliveryDate: promisedDeliveryDate,
          deliveryMethod: deliveryMethod,
          artworkLink: orderData.google_drive_link
        });
      }
    })
    .then(() => {
      showToast('ເພີ່ມອໍເດີໃໝ່ ແລະ ຕັດສະຕ໋ອກ FIFO ສຳເລັດ!', 'success');
      onBack();
    })
    .catch(err => {
      console.error(err);
      showToast('Sync failure. Defaulting order creation to local state storage.', 'warning');
      const fallbackItems = items.map(it => ({
        id: it.paperId || 'paper-a4-80',
        name: it.name,
        quantity: it.quantity,
        unitCost: 15000,
        specs: `${it.jobWidth}x${it.jobHeight}mm`
      }));
      addOrder({
        customerName: finalCustomerName,
        phone: finalPhone,
        address: finalAddress,
        items: fallbackItems,
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
      });
      onBack();
    });
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

          <div className="max-w-2xl">
            <CustomerCombobox
              customers={customers}
              valueName={customerType === 'existing' ? selectedCustomerId : newCustName}
              valuePhone={customerType === 'existing' ? phone : newCustPhone}
              valueAddress={customerType === 'existing' ? address : newCustAddress}
              onChange={(data) => {
                if (data.isNew) {
                  setCustomerType('new');
                  setNewCustName(data.name);
                  setNewCustPhone(data.phone);
                  setNewCustAddress(data.address);
                  setSelectedCustomerId('');
                } else {
                  setCustomerType('existing');
                  setSelectedCustomerId(data.customerId || data.name);
                  setPhone(data.phone);
                  setAddress(data.address);
                }
              }}
              currentLang={currentLang}
            />
          </div>

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
                  <span>ຮາຍການສິນຄ້າທີ່ລູກຄ້າສັ່ງ (Master Order Item List)</span>
                </h4>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  ເພີ່ມຮາຍການສິນຄ້າ, ກຳນົດຈຳນວນ ແລະ ກົດປຸ່ມ "[ກຳນົດສະເປັກ]" ເພື່ອຕັ້ງຄ່າສະເປັກການພິມ ແລະ ຄຳນວນຕົ້ນທຶນ
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black shadow-md shadow-accent-sky/20 transition active:scale-95 w-fit"
              >
                <Plus className="w-4 h-4" />
                <span>+ ເພີ່ມຮາຍການສິນຄ້າ (Add New Item)</span>
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
                          Item #{idx + 1}: ຊື່ຮາຍການສິນຄ້າ (Item Name) *
                        </label>
                        <input
                          type="text"
                          required
                          value={it.name}
                          onChange={(e) => updateItemField(idx, 'name', e.target.value)}
                          placeholder="ເຊັ່ນ: ປຶ້ມພາສາລາວ, ປຶ້ມພາສາອັງກິດ..."
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-bold text-xs bg-white focus:outline-none focus:ring-2 focus:ring-accent-sky"
                        />
                      </div>

                      {/* Quantity Input */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase">
                          ຈຳນວນ (Quantity) *
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
                          ລາຄາລວມ (Subtotal)
                        </span>
                        <span className="text-base font-black text-slate-900 font-sans block">
                          {formatLAK(costing.finalPrice)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold block">
                          (~ {formatLAK(costing.unitPrice)} / ຊິ້ນ)
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
                          <span>[ກຳນົດສະເປັກ]</span>
                        </button>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                            title="ລຶບຮາຍການນີ້"
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

            {/* Order Operating Costs & Overhead Section */}
            <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-200/80 pb-3">
                <div>
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Settings className="w-5 h-5 text-rose-600" />
                    <span>ຄ່າດຳເນີນງານລວມອໍເດີ (Order Operating Costs & Overhead)</span>
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    ຄຳນວນຄ່າແຮງ, ຄ່າຕັ້ງເຄື່ອງ, ຄ່າເສື່ອມ ແລະ ຄ່າເຜື່ອເສຍ ລວມລະດັບອໍເດີ (ບໍ່ຕ້ອງຄິດຊ້ຳໃນແຕ່ລະສິນຄ້າ)
                  </p>
                </div>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setOrderOverheadMode('Standard')}
                    className={`px-3 py-1.5 rounded-lg transition ${!isCustomOverhead ? 'bg-primary-navy text-white font-black' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    ສະເປັກມາດຕະຖານ (Standard Preset)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderOverheadMode('Custom')}
                    className={`px-3 py-1.5 rounded-lg transition ${isCustomOverhead ? 'bg-primary-navy text-white font-black' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    ກຳນົດເອງ (Custom Spec)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold text-slate-700">
                {/* 1. Setup Fee */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-black block">1. ຄ່າຕັ້ງເຄື່ອງ & ກຽມງານ</span>
                  {isCustomOverhead ? (
                    <input
                      type="number"
                      value={customSetupFee}
                      onChange={(e) => setCustomSetupFee(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs font-black focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm font-black text-slate-900 font-sans block">{formatLAK(setupFee)}</span>
                  )}
                </div>

                {/* 2. Labor Fee */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-black block">2. ຄ່າແຮງງານຊ່າງລວມ</span>
                  {isCustomOverhead ? (
                    <input
                      type="number"
                      value={customLaborFee}
                      onChange={(e) => setCustomLaborFee(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs font-black focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm font-black text-slate-900 font-sans block">{formatLAK(laborFee)}</span>
                  )}
                </div>

                {/* 3. Depreciation & Power Fee */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-black block">3. ຄ່າເສື່ອມເຄື່ອງ & ໄຟຟ້າລວມ</span>
                  {isCustomOverhead ? (
                    <input
                      type="number"
                      value={customDeprPowerFee}
                      onChange={(e) => setCustomDeprPowerFee(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs font-black focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm font-black text-slate-900 font-sans block">{formatLAK(deprPowerFee)}</span>
                  )}
                </div>

                {/* 4. Spoilage Fee */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-black block">4. ຄ່າເຜື່ອເສຍລວມ</span>
                  {isCustomOverhead ? (
                    <input
                      type="number"
                      value={customSpoilageFee}
                      onChange={(e) => setCustomSpoilageFee(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs font-black focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm font-black text-slate-900 font-sans block">{formatLAK(spoilageFee)}</span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 text-xs font-black">
                <span className="text-slate-600">ລວມຄ່າດຳເນີນງານລະດັບອໍເດີ (Order Overhead Sum):</span>
                <span className="text-base font-sans text-rose-600 font-black">{formatLAK(orderOperatingOverhead)}</span>
              </div>
            </div>

            {/* Dynamic Grand Total Bill Card */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Grand Total Bill ({items.length} items)
                </span>
                <span className="text-2xl sm:text-3xl font-black font-sans text-emerald-400 mt-1 block">
                  {formatLAK(grandTotalBill)}
                </span>
                <span className="text-[11px] text-slate-400 font-mono block">
                  (Items Subtotal: {formatLAK(sumItemSubtotals)} + Order Overhead: {formatLAK(orderOperatingOverhead)})
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
                  <span>ຖັດໄປ: ສະຫຼຸບຍອດ & ຕັດສະຕ໋ອກ (Step 3)</span>
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
              <span>ຍ້ອນກັບ (Back)</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ORDER SUMMARY & STOCK DEDUCTION */}
      {currentStep === 3 && (
        <form onSubmit={handleSubmitFinal} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-fade-in text-sm">
          {backendCalculationBreakdown.length > 0 && (
            <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200/80">
              <h5 className="font-black text-xs text-sky-950 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                <Calculator className="w-4 h-4 text-sky-600" />
                <span>ສະຫຼຸບການຄຳນວນລາຄາຈາກລະບົບຫຼັງບ້ານ (Backend Pricing Breakdown)</span>
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-semibold text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase">
                      <th className="py-2 text-left">ລາຍການ (Job)</th>
                      <th className="py-2 text-right">ເຈ້ย (Paper)</th>
                      <th className="py-2 text-right">ໝຶກ (Ink)</th>
                      <th className="py-2 text-right">ເຄືອບ (Lam)</th>
                      <th className="py-2 text-right">ເຂົ້າເລັ້ມ (Bind)</th>
                      <th className="py-2 text-right">ຄ່າແຮງ (Labor)</th>
                      <th className="py-2 text-right">ຕົ້ນທຶນລວມ (Total Cost)</th>
                      <th className="py-2 text-right">ລາຄາຂາຍ (Sale Price)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {backendCalculationBreakdown.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 font-bold text-slate-900">{item.job_name} ({item.quantity} units)</td>
                        <td className="py-2.5 text-right font-mono">{formatLAK(item.paper_cost)}</td>
                        <td className="py-2.5 text-right font-mono">{formatLAK(item.ink_cost)}</td>
                        <td className="py-2.5 text-right font-mono">{formatLAK(item.lamination_cost)}</td>
                        <td className="py-2.5 text-right font-mono">{formatLAK(item.binding_cost)}</td>
                        <td className="py-2.5 text-right font-mono">{formatLAK(item.labor_cost)}</td>
                        <td className="py-2.5 text-right font-mono text-rose-600 font-bold">{formatLAK(item.total_cost)}</td>
                        <td className="py-2.5 text-right font-mono text-emerald-600 font-bold">{formatLAK(item.sale_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                  <option value="Pickup">ມາຮັບທີ່ຮ້ານ (Pickup at Shop)</option>
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

