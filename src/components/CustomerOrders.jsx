import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Eye, 
  X,
  Printer, 
  Layers,
  ArrowRight,
  User,
  Activity,
  Calendar,
  Wallet,
  Plus,
  Coins,
  Link,
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  CreditCard,
  Boxes
} from 'lucide-react';

export default function CustomerOrders() {
  const { 
    orders, 
    updateOrderStatus, 
    settleOrderBalance, 
    deleteOrder, 
    updatePreflightCheck,
    addOrderVersion,
    inventory,
    showToast,
    askConfirmation,
    focusOrderId,
    setFocusOrderId,
    addOrder,
    customers,
    addCustomer
  } = useApp();

  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const focusRef = useRef(null);

  // Auto-select order when navigated from CRM
  useEffect(() => {
    if (focusOrderId) {
      const target = orders.find(o => o.id === focusOrderId);
      if (target) {
        setFilterStatus('All');
        setSelectedOrder(target);
        setTimeout(() => focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
      }
      setFocusOrderId(null);
    }
  }, [focusOrderId]);

  
  // Settle Balance Wizard states
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [settleStep, setSettleStep] = useState(1); // 1 to 2
  const [settleAmount, setSettleAmount] = useState(0);
  const [settleMethod, setSettleMethod] = useState('BCEL One');
  const [settleSlip, setSettleSlip] = useState('');

  // Print view state
  const [printType, setPrintType] = useState(null);
  const [consumptionReportOrder, setConsumptionReportOrder] = useState(null);

  // Pre-flight file add state
  const [newVersionUrl, setNewVersionUrl] = useState('');

  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num).replace('LAK', '₭');
  };

  const statuses = ['All', 'Received', 'Printing', 'Cutting', 'Ready', 'Delivered'];

  const filteredOrders = filterStatus === 'All' 
    ? orders 
    : orders.filter(ord => ord.status === filterStatus);

  const handleSettleSubmit = (e) => {
    e.preventDefault();
    if (!selectedOrder || settleAmount <= 0) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາປ້ອນຈຳນວນເງິນຊຳຣະ!' : 'Enter settlement amount!', 'warning');
      return;
    }

    settleOrderBalance(selectedOrder.id, Number(settleAmount), settleMethod, settleSlip);
    showToast(currentLang === 'lo' ? 'ຊຳຣະລ້ຽງໜີ້ສຳເລັດ!' : 'Balance settled successfully!', 'success');
    
    const updated = orders.find(o => o.id === selectedOrder.id);
    setSelectedOrder(updated);

    setIsSettleOpen(false);
    setSettleAmount(0);
    setSettleSlip('');
    setSettleStep(1);
  };

  const handleStatusChange = (orderId, currentStatus) => {
    let nextStatus = 'Received';
    if (currentStatus === 'Received') nextStatus = 'Printing';
    else if (currentStatus === 'Printing') nextStatus = 'Cutting';
    else if (currentStatus === 'Cutting') nextStatus = 'Ready';
    else if (currentStatus === 'Ready') nextStatus = 'Delivered';

    updateOrderStatus(orderId, nextStatus);
    showToast(currentLang === 'lo' ? 'ອັບເດດສະຖານະການຜະລິດສຳເລັດ!' : 'Production status updated!', 'success');
    
    if (selectedOrder && selectedOrder.id === orderId) {
      const updated = orders.find(o => o.id === orderId);
      if (updated) setSelectedOrder(updated);
    }
  };

  const handleAddVersion = (e) => {
    e.preventDefault();
    if (!newVersionUrl) return;

    addOrderVersion(selectedOrder.id, newVersionUrl);
    showToast(currentLang === 'lo' ? 'ເພີ່ມເວີຊັນຟາຍໃໝ່ສຳເລັດ!' : 'New file version uploaded!', 'success');
    setNewVersionUrl('');

    const updated = orders.find(o => o.id === selectedOrder.id);
    setSelectedOrder(updated);
  };

  const handlePreflightToggle = (field, value) => {
    updatePreflightCheck(selectedOrder.id, field, value);
    showToast(currentLang === 'lo' ? 'ອັບເດດສະຖານະປຼູຟສຳເລັດ!' : 'Pre-flight updated!', 'success');
    
    const updated = orders.find(o => o.id === selectedOrder.id);
    setSelectedOrder(updated);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Received': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'Printing': return <Activity className="w-4 h-4 text-purple-600 animate-pulse" />;
      case 'Cutting': return <Layers className="w-4 h-4 text-amber-600" />;
      case 'Ready': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'Delivered': return <CheckCircle2 className="w-4 h-4 text-slate-500" />;
      default: return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Received': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Printing': return 'bg-purple-50 text-purple-700 border-purple-100 animate-pulse';
      case 'Cutting': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Ready': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Delivered': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <Clock className="w-3.5 h-3.5 text-red-500" />;
      case 'Deposit Paid': return <Clock className="w-3.5 h-3.5 text-indigo-500" />;
      case 'Fully Paid': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Overdue': return <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-bounce" />;
      default: return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return 'bg-red-50 text-red-700 border-red-100';
      case 'Deposit Paid': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Fully Paid': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Overdue': return 'bg-red-100 text-red-800 border-red-200 font-extrabold animate-bounce';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  // Quick Action Chips for settlement
  const applySettlePreset = (pct) => {
    if (selectedOrder) {
      if (pct === 100) setSettleAmount(selectedOrder.remainingUnpaidBalance);
      else if (pct === 50) setSettleAmount(Math.round(selectedOrder.remainingUnpaidBalance / 2));
    }
  };

  if (selectedOrder) {
    return (
      <OrderDetailView 
        order={selectedOrder} 
        onBack={() => setSelectedOrder(null)} 
        formatLAK={formatLAK}
        t={t}
        currentLang={currentLang}
        handleStatusChange={handleStatusChange}
        handlePreflightToggle={handlePreflightToggle}
        deleteOrder={deleteOrder}
        showToast={showToast}
        askConfirmation={askConfirmation}
        setLightbox={setLightbox}
        setIsSettleOpen={setIsSettleOpen}
        setSettleAmount={setSettleAmount}
        setSettleStep={setSettleStep}
        getStatusBadgeClass={getStatusBadgeClass}
        getStatusIcon={getStatusIcon}
        getPaymentStatusBadge={getPaymentStatusBadge}
        getPaymentStatusIcon={getPaymentStatusIcon}
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in print:hidden text-slate-800">
      
      {/* Lightbox Modal */}
      {lightbox && (
        <Lightbox
          src={lightbox.src}
          title={lightbox.title}
          onClose={() => setLightbox(null)}
        />
      )}
      
      {/* Header card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-primary-navy tracking-tight">
            {t('orders.title')}
          </h2>
          <p className="text-base text-slate-500 font-semibold leading-relaxed">
            {t('orders.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setIsAddOrderOpen(true)}
          className="flex items-center gap-2.5 px-6 py-3.5 bg-accent-sky hover:bg-sky-600 text-white rounded-2xl text-base font-black shadow-lg shadow-sky-600/10 transition active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>{currentLang === 'lo' ? 'ເພີ່ມອໍເດີໃໝ່' : 'Add New Order'}</span>
        </button>
      </div>

      {/* Filter tab bar with large buttons */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-white rounded-2xl border max-w-3xl">
        {statuses.map(st => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`
              px-5 py-3 rounded-xl text-sm font-extrabold transition-all min-h-[46px]
              ${filterStatus === st 
                ? 'bg-primary-navy text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }
            `}
          >
            {st === 'All' ? (currentLang === 'lo' ? 'ທັງໝົດ' : 'All') : t(`status.${st}`)}
          </button>
        ))}
      </div>

      {/* Orders Table View */}
      <div className="w-full overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/70 text-xs lg:text-sm font-black uppercase text-slate-500 tracking-wider border-b border-slate-100">
              <th className="px-6 py-4">Order ID / Date</th>
              <th className="px-6 py-4">ຊື່ລູກຄ້າ / ເບີໂທ</th>
              <th className="px-6 py-4">ລາຍການສັ່ງພິມ</th>
              <th className="px-6 py-4">ການຊຳລະເງິນ</th>
              <th className="px-6 py-4">ສະຖານະການຜະລິດ</th>
              <th className="px-6 py-4 text-right">ຍອດລວມ (LAK)</th>
              <th className="px-6 py-4 text-center">ຈັດການ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredOrders.map(ord => {
              const isOverdue = ord.paymentStatus === 'Overdue';
              const itemsSummary = () => {
                if (!ord.items || ord.items.length === 0) return '-';
                const firstItem = ord.items[0];
                const summary = `${firstItem.name} (x${firstItem.quantity})`;
                if (ord.items.length > 1) {
                  return `${summary} (+${ord.items.length - 1} ${currentLang === 'lo' ? 'ລາຍການ' : 'items'})`;
                }
                return summary;
              };

              return (
                <tr 
                  key={ord.id}
                  ref={selectedOrder?.id === ord.id ? focusRef : null}
                  className={`hover:bg-slate-50/30 transition ${
                    isOverdue ? 'bg-red-50/10' : ''
                  } ${selectedOrder?.id === ord.id ? 'bg-sky-50/20' : ''}`}
                >
                  {/* Order ID & Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono font-black text-slate-900 block text-sm lg:text-base">#{ord.id}</span>
                    <span className="text-xs text-slate-400 block font-sans mt-1">Due: {ord.promisedDeliveryDate}</span>
                  </td>
                  {/* Customer Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-slate-900 block">{ord.customerName}</span>
                    <span className="text-xs text-slate-400 block font-sans mt-0.5">{ord.phone}</span>
                  </td>
                  {/* Print Items Summary */}
                  <td className="px-6 py-4 min-w-[200px]">
                    <span className="font-semibold text-slate-800 line-clamp-1">{itemsSummary()}</span>
                  </td>
                  {/* Payment Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-[8px] text-[10px] sm:text-xs font-extrabold uppercase border ${getPaymentStatusBadge(ord.paymentStatus)}`}>
                      {getPaymentStatusIcon(ord.paymentStatus)}
                      <span className="ml-1">{t(`payment.${ord.paymentStatus}`)}</span>
                    </span>
                  </td>
                  {/* Production Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-1 rounded-[8px] text-[10px] sm:text-xs font-extrabold uppercase border ${getStatusBadgeClass(ord.status)}`}>
                      {getStatusIcon(ord.status)}
                      <span className="ml-1">{t(`status.${ord.status}`)}</span>
                    </span>
                  </td>
                  {/* Total Price */}
                  <td className="px-6 py-4 text-right font-sans font-black text-slate-900 whitespace-nowrap">
                    <span className="block text-sm lg:text-base">{formatLAK(ord.totalPriceCharged)}</span>
                    {ord.remainingUnpaidBalance > 0 && (
                      <span className="text-xs font-sans font-bold text-red-500 block mt-1">
                        {currentLang === 'lo' ? 'ຄ້າງ:' : 'Unpaid:'} {formatLAK(ord.remainingUnpaidBalance)}
                      </span>
                    )}
                  </td>
                  {/* View Details Action */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-accent-sky hover:text-white rounded-xl text-xs font-black text-slate-600 transition shadow-sm border border-slate-100"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{currentLang === 'lo' ? 'ເບິ່ງລາຍລະອຽດ' : 'View Details'}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      
      {/* ADD ORDER MODAL */}
      {isAddOrderOpen && (
        <AddOrderModal
          onClose={() => setIsAddOrderOpen(false)}
          inventory={inventory}
          customers={customers}
          addCustomer={addCustomer}
          addOrder={addOrder}
          showToast={showToast}
          formatLAK={formatLAK}
          currentLang={currentLang}
          t={t}
        />
      )}
</div>

      {/* COMPREHENSIVE ORDER DETAILS MODAL / DRAWER */}
      {selectedOrder && (() => {
        const preflightComplete = selectedOrder.preflight?.cmyk === 'Pass' && selectedOrder.preflight?.bleed === 'Pass' && selectedOrder.preflight?.resolution === 'Pass';
        
        const getItemSpecs = (item) => {
          const name = item.name.toLowerCase();
          let paper = 'Standard';
          let size = 'A4';
          let finishing = 'None';
          
          if (name.includes('double a')) paper = 'Double A 80gsm';
          if (name.includes('glossy')) paper = 'Glossy Photo Paper';
          if (name.includes('spiral')) finishing = 'Spiral Binding';
          if (name.includes('ພັບ')) finishing = 'Folding';
          if (name.includes('a3')) size = 'A3';
          
          return { paper, size, finishing };
        };

        return (
          <dialog 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent outline-none border-none w-full h-full"
            open
          >
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
            
            <div className="relative bg-white w-full max-w-5xl rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 overflow-y-auto max-h-[95vh] z-10 border border-slate-100 animate-fade-in flex flex-col justify-between">
              {/* Header section */}
              <div className="flex justify-between items-start border-b pb-4 mb-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono font-bold uppercase">
                    <span>Order Tracker ID: {selectedOrder.id}</span>
                    <span>•</span>
                    <span>Created: {selectedOrder.date} {selectedOrder.createdTime}</span>
                  </div>
                  <h3 className="text-2xl font-black text-primary-navy mt-1.5 flex items-center gap-3">
                    <span>{t('orders.modal_title')}</span>
                    <span className={`px-2.5 py-0.5 rounded-[8px] text-xs font-black border uppercase ${getStatusBadgeClass(selectedOrder.status)}`}>
                      {t(`status.${selectedOrder.status}`)}
                    </span>
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Part 1: Details Table & Customer Info (col-span-8) */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Customer contact card */}
                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Customer Info</span>
                      <span className="font-extrabold text-slate-900 text-base mt-1 block">{selectedOrder.customerName}</span>
                      <span className="text-sm text-slate-500 font-sans block mt-0.5">{selectedOrder.phone}</span>
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Delivery Schedule</span>
                      <span className="text-sm text-slate-700 font-bold block mt-1">Due Date: {selectedOrder.promisedDeliveryDate}</span>
                      {selectedOrder.installationSchedule && (
                        <span className="text-xs text-indigo-600 font-bold block mt-1">
                          🛠️ Installation: {selectedOrder.installationSchedule.replace('T', ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detailed Items Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-xs font-black text-slate-500 uppercase tracking-wider border-b">
                          <th className="px-4 py-3">Item Name</th>
                          <th className="px-4 py-3">Specifications</th>
                          <th className="px-4 py-3 text-center">Qty</th>
                          <th className="px-4 py-3 text-right">Unit Price</th>
                          <th className="px-4 py-3 text-right">Total Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                        {selectedOrder.items.map((item, idx) => {
                          const specs = getItemSpecs(item);
                          return (
                            <tr key={item.id || idx} className="hover:bg-slate-50/30 transition">
                              <td className="px-4 py-3.5 font-bold text-slate-900">{item.name}</td>
                              <td className="px-4 py-3.5 text-slate-500 font-sans text-xs">
                                <span>{specs.paper}</span> • <span>{specs.size}</span> • <span>{specs.finishing}</span>
                              </td>
                              <td className="px-4 py-3.5 text-center font-sans font-bold text-slate-900">x{item.quantity}</td>
                              <td className="px-4 py-3.5 text-right font-sans">{formatLAK(item.unitCost)}</td>
                              <td className="px-4 py-3.5 text-right font-sans font-black text-slate-900">{formatLAK(item.quantity * item.unitCost)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Shipping / Delivery details */}
                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Delivery & Shipping Address</span>
                    <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                      {selectedOrder.deliveryMethod === 'Pickup' ? '🏪 Pickup at Shop' : `🚚 Shipping (${selectedOrder.deliveryMethod || 'Kerry Lao'})`}
                    </p>
                    {selectedOrder.address && (
                      <p className="text-xs text-slate-500 italic mt-1 font-semibold">{selectedOrder.address}</p>
                    )}
                  </div>
                </div>

                {/* Part 2: Preflight checks, Payments & Versions (col-span-4) */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Preflight card */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Pre-flight check</h4>
                      <span className={`font-black flex items-center gap-1 text-xs ${preflightComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {preflightComplete ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        {preflightComplete ? t('orders.preflight_complete') : t('orders.preflight_pending')}
                      </span>
                    </div>

                    <div className="space-y-3 text-xs font-bold text-slate-600">
                      {/* CMYK */}
                      <div className="flex items-center justify-between">
                        <span>{t('orders.cmyk_check')}</span>
                        <div className="flex gap-1">
                          {['Pass', 'Fail', 'Not Checked'].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handlePreflightToggle('cmyk', val)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-black border transition ${
                                selectedOrder.preflight?.cmyk === val 
                                  ? val === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : val === 'Fail' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-200 text-slate-800'
                                  : 'bg-white text-slate-400 border-slate-200'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Bleed */}
                      <div className="flex items-center justify-between">
                        <span>{t('orders.bleed_check')}</span>
                        <div className="flex gap-1">
                          {['Pass', 'Fail', 'Not Checked'].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handlePreflightToggle('bleed', val)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-black border transition ${
                                selectedOrder.preflight?.bleed === val 
                                  ? val === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : val === 'Fail' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-200 text-slate-800'
                                  : 'bg-white text-slate-400 border-slate-200'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Resolution */}
                      <div className="flex items-center justify-between">
                        <span>{t('orders.resolution_check')}</span>
                        <div className="flex gap-1">
                          {['Pass', 'Fail', 'Not Checked'].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handlePreflightToggle('resolution', val)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-black border transition ${
                                selectedOrder.preflight?.resolution === val 
                                  ? val === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : val === 'Fail' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-200 text-slate-800'
                                  : 'bg-white text-slate-400 border-slate-200'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Card & Slip Preview */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">{t('orders.payment_status')}</h4>
                      <span className={`inline-flex px-2 py-0.5 rounded-[6px] text-[10px] font-black border ${getPaymentStatusBadge(selectedOrder.paymentStatus)}`}>
                        {t(`payment.${selectedOrder.paymentStatus}`)}
                      </span>
                    </div>

                    <div className="text-xs font-bold space-y-2 text-slate-600">
                      <div className="flex justify-between">
                        <span>Total Price:</span>
                        <span className="font-sans text-slate-900 font-black text-sm">{formatLAK(selectedOrder.totalPriceCharged)}</span>
                      </div>
                      <div className="flex justify-between text-red-600 font-black">
                        <span>Remaining:</span>
                        <span className="font-sans text-slate-900 text-sm">{formatLAK(selectedOrder.remainingUnpaidBalance)}</span>
                      </div>
                    </div>

                    {selectedOrder.paymentSlipUrl && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Receipt Slip</span>
                        <button
                          onClick={() => setLightbox({ src: selectedOrder.paymentSlipUrl, title: `Payment Slip: #${selectedOrder.id}` })}
                          className="w-full relative rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:opacity-90 transition group"
                        >
                          <img src={selectedOrder.paymentSlipUrl} alt="Slip" className="w-full h-24 object-cover" />
                          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition text-xs font-bold">
                            View Slip
                          </div>
                        </button>
                      </div>
                    )}

                    {selectedOrder.remainingUnpaidBalance > 0 && (
                      <button
                        onClick={() => {
                          setSettleAmount(selectedOrder.remainingUnpaidBalance);
                          setSettleStep(1);
                          setIsSettleOpen(true);
                        }}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/15 transition active:scale-95"
                      >
                        {t('orders.btn_settle')}
                      </button>
                    )}
                  </div>

                  {/* Versions history */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Link className="w-4 h-4 text-emerald-600" />
                      <span>{t('orders.version_control')}</span>
                    </h4>

                    {selectedOrder.artworkLink && (
                      <div className="pt-1">
                        <a
                          href={selectedOrder.artworkLink}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-black transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download Artwork File
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Slide-over Footer controls */}
              <div className="flex flex-wrap justify-between items-center gap-4 pt-5 mt-6 border-t">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPrintType('receipt');
                      setTimeout(() => window.print(), 100);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-black transition active:scale-95"
                  >
                    <Printer className="w-4 h-4 text-indigo-500" />
                    <span>{t('orders.btn_print_receipt')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setPrintType('delivery');
                      setTimeout(() => window.print(), 100);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-black transition active:scale-95"
                  >
                    <Printer className="w-4 h-4 text-emerald-500" />
                    <span>{t('orders.btn_print_delivery')}</span>
                  </button>
                </div>

                <div className="flex gap-2 items-center">
                  {selectedOrder.status !== 'Delivered' && (
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, selectedOrder.status)}
                      className="px-5 py-2.5 bg-accent-sky text-white rounded-xl text-xs font-black hover:bg-sky-600 transition flex items-center gap-1"
                    >
                      <span>Update Production Status</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const msg = currentLang === 'lo' ? 'ທ່ານຕ້ອງການລຶບອໍເດີນີ້ແທ້ ຫຼື ບໍ່?' : 'Delete this order permanently?';
                      askConfirmation(msg, () => {
                        deleteOrder(selectedOrder.id);
                        setSelectedOrder(null);
                        showToast(currentLang === 'lo' ? 'ລຶບອໍເດີສຳເລັດ!' : 'Order deleted successfully!', 'success');
                      });
                    }}
                    className="p-2.5 text-red-500 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 rounded-xl transition"
                    title="Delete Order"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2.5 border rounded-xl text-slate-500 hover:bg-slate-50 text-xs font-black"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </div>
            </div>
          </dialog>
        );
      })()}      {/* ACCESSIBLE STEP-BY-STEP BALANCE SETTLEMENT DIALOG */}
      {isSettleOpen && selectedOrder && (
        <dialog
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-transparent outline-none border-none w-full h-full"
          open
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSettleOpen(false)} />
          
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 z-10 border border-slate-100 animate-fade-in flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b pb-4 mb-5">
                <div>
                  <span className="text-xs uppercase font-extrabold text-emerald-600 tracking-wider font-sans">
                    {t('orders.step')} {settleStep} {t('orders.of')} 2
                  </span>
                  <h3 className="text-lg font-black text-primary-navy mt-1">
                    {t('orders.settle_title')}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsSettleOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* step bar */}
              <div className="flex gap-2 mb-6">
                {[1, 2].map(st => (
                  <div 
                    key={st} 
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${st <= settleStep ? 'bg-emerald-500' : 'bg-slate-100'}`}
                  />
                ))}
              </div>

              <form onSubmit={handleSettleSubmit} className="space-y-4">
                
                {/* STEP 1: VERIFY AMOUNT (quick presets) */}
                {settleStep === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('orders.unpaid_balance')}</label>
                      <p className="text-lg font-black text-red-600 font-sans bg-red-50/50 p-4 rounded-2xl border border-red-100">
                        {formatLAK(selectedOrder.remainingUnpaidBalance)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('orders.amount_to_pay')} *</label>
                      <input
                        type="number"
                        required
                        min="1000"
                        max={selectedOrder.remainingUnpaidBalance}
                        value={settleAmount}
                        onChange={(e) => setSettleAmount(Number(e.target.value))}
                        className="w-full min-h-[50px] px-4 py-3 border-2 rounded-2xl focus:outline-none text-base font-black font-sans text-slate-900"
                      />

                      {/* quick settlement preset chips */}
                      <div className="flex gap-2 pt-1.5">
                        <button
                          type="button"
                          onClick={() => applySettlePreset(50)}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border rounded-xl text-xs font-bold transition active:scale-95"
                        >
                          {t('orders.pay_50')}
                        </button>
                        <button
                          type="button"
                          onClick={() => applySettlePreset(100)}
                          className="px-4 py-2.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition active:scale-95"
                        >
                          {t('orders.pay_100')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: PAYMENT METHOD & NOTES */}
                {settleStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Payment methods choice (visual cards) */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('orders.payment_method')}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['BCEL One', 'Cash', 'Transfer'].map(method => {
                          const active = settleMethod === method;
                          return (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setSettleMethod(method)}
                              className={`p-3 border-2 rounded-xl font-bold text-xs transition flex flex-col items-center justify-center gap-1.5 ${
                                active 
                                  ? 'border-accent-sky bg-blue-50/50 text-primary-navy shadow-sm' 
                                  : 'border-slate-200 hover:border-slate-300 text-slate-500 bg-white'
                              }`}
                            >
                              <CreditCard className={`w-4 h-4 ${active ? 'text-accent-sky' : 'text-slate-400'}`} />
                              <span>{method}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('orders.ref_number')}</label>
                      <input
                        type="text"
                        placeholder="BCEL Transaction #..."
                        value={settleSlip}
                        onChange={(e) => setSettleSlip(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2 border-2 rounded-xl focus:outline-none text-sm font-semibold"
                      />
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Wizard Navigation Footer */}
            <div className="flex justify-between items-center border-t pt-4 mt-6 gap-3">
              <div>
                {settleStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setSettleStep(settleStep - 1)}
                    className="flex items-center gap-1 px-4 py-2 border-2 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition min-h-[40px]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{t('common.back')}</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettleOpen(false)}
                  className="px-4 py-2 border hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold transition"
                >
                  {t('common.cancel')}
                </button>
                
                {settleStep < 2 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (settleAmount <= 0) {
                        showToast(currentLang === 'lo' ? 'ກະລຸນາປ້ອນຈຳນວນເງິນຊຳຣະ!' : 'Please enter settlement amount first!', 'warning');
                        return;
                      }
                      setSettleStep(2);
                    }}
                    className="flex items-center gap-1 px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition min-h-[40px]"
                  >
                    <span>{t('common.next')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSettleSubmit}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition min-h-[40px]"
                  >
                    {t('common.confirm')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </dialog>
      )}

      {/* 📦 MATERIAL CONSUMPTION REPORT MODAL */}
      {consumptionReportOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 p-6 space-y-5 animate-scale-up relative">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-2">
                  <Boxes className="w-6 h-6 text-emerald-600 animate-bounce" />
                  <span>{currentLang === 'lo' ? 'ໃບບິນລາຍງານການຊົມໃຊ້ວັດຖຸດິບ' : 'Material Consumption Report'}</span>
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  Order #{consumptionReportOrder.id} • {consumptionReportOrder.customerName}
                </p>
              </div>
              <button
                onClick={() => setConsumptionReportOrder(null)}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 border rounded-xl transition text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                {currentLang === 'lo' 
                  ? 'ການຜະລິດສຳເລັດແລ້ວ! ລະບົບໄດ້ທຳການຫັກສະຕ໋ອກຕາມລັອດຈັດຊື້ (FIFO Lots) ດັ່ງລາຍລະອຽດຕໍ່ໄປນີ້:' 
                  : 'Production is complete! The system has deducted lot inventories under FIFO rules as follows:'}
              </p>

              <div className="space-y-3.5 divide-y divide-slate-100">
                {consumptionReportOrder.items.map((item, idx) => (
                  <div key={idx} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex justify-between text-sm font-extrabold text-slate-800">
                      <span>{item.name}</span>
                      <span className="font-sans text-slate-900">{item.quantity} {t('units') || 'Units'}</span>
                    </div>
                    <div className="pl-4 border-l-2 border-emerald-500 space-y-1">
                      {(item.lotsUsed || []).map((lot, lIdx) => (
                        <div key={lIdx} className="flex justify-between text-xs font-semibold text-slate-500">
                          <span className="font-mono">#{lot.lotId}</span>
                          <span className="font-sans text-slate-700">{lot.qty} {t('units') || 'Units'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setConsumptionReportOrder(null)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm tracking-wide transition shadow-sm"
            >
              {currentLang === 'lo' ? 'ຢືນຢັນການຕັດສະຕ໋ອກ' : 'Confirm Inventory Depletion'}
            </button>
          </div>
        </div>
      )}

      {/* PRINT VIEW PREVIEWS */}
      {printType && selectedOrder && (
        <PrintLayout 
          type={printType}
          order={selectedOrder} 
          onClose={() => setPrintType(null)} 
          formatLAK={formatLAK}
          t={t}
        />
      )}
    </div>
  );
}


// FULL-PAGE ORDER DETAILS VIEW
function OrderDetailView({ 
  order, 
  onBack, 
  formatLAK, 
  t, 
  currentLang, 
  handleStatusChange, 
  handlePreflightToggle, 
  deleteOrder, 
  showToast, 
  askConfirmation, 
  setLightbox, 
  setIsSettleOpen, 
  setSettleAmount, 
  setSettleStep,
  getStatusBadgeClass,
  getStatusIcon,
  getPaymentStatusBadge,
  getPaymentStatusIcon
}) {
  const preflightComplete = order.preflight?.cmyk === 'Pass' && order.preflight?.bleed === 'Pass' && order.preflight?.resolution === 'Pass';
  
  const getItemSpecs = (item) => {
    const name = item.name.toLowerCase();
    let paper = 'Standard';
    let size = 'A4';
    let finishing = 'None';
    
    if (name.includes('double a')) paper = 'Double A 80gsm';
    if (name.includes('glossy')) paper = 'Glossy Photo Paper';
    if (name.includes('spiral')) finishing = 'Spiral Binding';
    if (name.includes('ພັບ')) finishing = 'Folding';
    if (name.includes('a3')) size = 'A3';
    
    return { paper, size, finishing };
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-100 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2.5 text-sm sm:text-base font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl w-fit"
        >
          <span>← {currentLang === 'lo' ? 'ກັບຄືນ' : 'Back to Orders'}</span>
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              const msg = currentLang === 'lo' ? 'ທ່ານຕ້ອງການລຶບອໍເດີນີ້ແທ້ ຫຼື ບໍ່?' : 'Delete this order permanently?';
              askConfirmation(msg, () => {
                deleteOrder(order.id);
                onBack();
                showToast(currentLang === 'lo' ? 'ລຶບອໍເດີສຳເລັດ!' : 'Order deleted successfully!', 'success');
              });
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl text-sm font-black transition"
          >
            <span>{currentLang === 'lo' ? 'ລຶບອໍເດີ' : 'Delete Order'}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-8 w-full">
        {/* Header Block */}
        <div className="border-b border-slate-100 pb-6 flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono font-bold uppercase">
              <span>Order Tracker ID: #{order.id}</span>
              <span>•</span>
              <span>Created: {order.date} {order.createdTime}</span>
            </div>
            <h3 className="text-2xl font-black text-primary-navy mt-2">
              {currentLang === 'lo' ? 'ລາຍລະອຽດການສັ່ງຊື້' : 'Order Specification Sheet'}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2.5 items-center">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-black border uppercase flex items-center gap-1.5 ${getStatusBadgeClass(order.status)}`}>
              {getStatusIcon(order.status)}
              <span>{t(`status.${order.status}`)}</span>
            </span>
            <span className={`px-3 py-1.5 rounded-xl text-xs font-black border uppercase flex items-center gap-1.5 ${getPaymentStatusBadge(order.paymentStatus)}`}>
              {getPaymentStatusIcon(order.paymentStatus)}
              <span>{t(`payment.${order.paymentStatus}`)}</span>
            </span>
          </div>
        </div>

        {/* 12-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Customer Details info */}
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Customer Info</span>
                <span className="font-extrabold text-slate-900 text-base mt-1 block">{order.customerName}</span>
                <span className="text-sm text-slate-500 font-sans block mt-0.5">{order.phone}</span>
              </div>
              <div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Delivery & Schedule</span>
                <span className="text-sm text-slate-700 font-bold block mt-1">Due Date: {order.promisedDeliveryDate}</span>
                {order.installationSchedule && (
                  <span className="text-xs text-indigo-600 font-bold block mt-1">
                    🛠️ Installation: {order.installationSchedule.replace('T', ' ')}
                  </span>
                )}
              </div>
            </div>

            {/* Ordered Items Table */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {currentLang === 'lo' ? 'ລາຍການສັ່ງພິມ' : 'Ordered Print Items'}
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-black text-slate-500 uppercase tracking-wider border-b">
                      <th className="px-4 py-3">Item Name</th>
                      <th className="px-4 py-3">Specifications</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Total Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                    {order.items.map((item, idx) => {
                      const specs = getItemSpecs(item);
                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/30 transition">
                          <td className="px-4 py-3.5 font-bold text-slate-900">{item.name}</td>
                          <td className="px-4 py-3.5 text-slate-500 font-sans text-xs">
                            <span>{specs.paper}</span> • <span>{specs.size}</span> • <span>{specs.finishing}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center font-sans font-bold text-slate-900">x{item.quantity}</td>
                          <td className="px-4 py-3.5 text-right font-sans">{formatLAK(item.unitCost)}</td>
                          <td className="px-4 py-3.5 text-right font-sans font-black text-slate-900">{formatLAK(item.quantity * item.unitCost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Delivery address & method */}
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Delivery Method & Location</span>
              <p className="text-sm font-semibold text-slate-700">
                {order.deliveryMethod === 'Pickup' ? '🏪 Pickup at Shop' : `🚚 Shipping (${order.deliveryMethod || 'Kerry Lao'})`}
              </p>
              {order.address && (
                <p className="text-xs text-slate-500 italic mt-1 font-semibold">{order.address}</p>
              )}
            </div>
          </div>

          {/* Right Column (col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Preflight card */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Pre-flight check</h4>
                <span className={`font-black flex items-center gap-1 text-xs ${preflightComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {preflightComplete ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  {preflightComplete ? t('orders.preflight_complete') : t('orders.preflight_pending')}
                </span>
              </div>

              <div className="space-y-3 text-xs font-bold text-slate-600">
                <div className="flex items-center justify-between">
                  <span>CMYK Mode</span>
                  <div className="flex gap-1">
                    {['Pass', 'Fail', 'Not Checked'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handlePreflightToggle('cmyk', val)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black border transition ${
                          order.preflight?.cmyk === val 
                            ? val === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : val === 'Fail' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-200 text-slate-800'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span>Bleed check</span>
                  <div className="flex gap-1">
                    {['Pass', 'Fail', 'Not Checked'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handlePreflightToggle('bleed', val)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black border transition ${
                          order.preflight?.bleed === val 
                            ? val === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : val === 'Fail' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-200 text-slate-800'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span>Resolution</span>
                  <div className="flex gap-1">
                    {['Pass', 'Fail', 'Not Checked'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handlePreflightToggle('resolution', val)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black border transition ${
                          order.preflight?.resolution === val 
                            ? val === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : val === 'Fail' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-200 text-slate-800'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Payments card */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Payment Status</h4>
                <span className={`inline-flex px-2 py-0.5 rounded-[6px] text-[10px] font-black border ${getPaymentStatusBadge(order.paymentStatus)}`}>
                  {t(`payment.${order.paymentStatus}`)}
                </span>
              </div>

              <div className="text-xs font-bold space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-sans text-slate-900 font-black text-sm">{formatLAK(order.totalPriceCharged)}</span>
                </div>
                <div className="flex justify-between text-red-600 font-black">
                  <span>Remaining:</span>
                  <span className="font-sans text-slate-900 text-sm">{formatLAK(order.remainingUnpaidBalance)}</span>
                </div>
              </div>

              {order.paymentSlipUrl && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Receipt Slip</span>
                  <button
                    onClick={() => setLightbox({ src: order.paymentSlipUrl, title: `Payment Slip: #${order.id}` })}
                    className="w-full relative rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:opacity-90 transition group"
                  >
                    <img src={order.paymentSlipUrl} alt="Slip" className="w-full h-24 object-cover" />
                    <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition text-xs font-bold">
                      View Slip
                    </div>
                  </button>
                </div>
              )}

              {order.remainingUnpaidBalance > 0 && (
                <button
                  onClick={() => {
                    setSettleAmount(order.remainingUnpaidBalance);
                    setSettleStep(1);
                    setIsSettleOpen(true);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/15 transition active:scale-95"
                >
                  {t('orders.btn_settle')}
                </button>
              )}
            </div>

            {/* Artwork files */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Artwork Files</h4>
              {order.artworkLink ? (
                <a
                  href={order.artworkLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black transition"
                >
                  Download File
                </a>
              ) : (
                <span className="text-xs text-slate-400 italic">No artwork link</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap justify-between items-center gap-4 pt-5 mt-6 border-t">
          <div className="flex gap-2">
            <button
              onClick={() => {
                window.print();
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-black transition active:scale-95"
            >
              <span>{t('orders.btn_print_receipt')}</span>
            </button>
          </div>

          <div className="flex gap-2 items-center">
            {order.status !== 'Delivered' && (
              <button
                onClick={() => handleStatusChange(order.id, order.status)}
                className="px-5 py-2.5 bg-accent-sky text-white rounded-xl text-xs font-black hover:bg-sky-600 transition"
              >
                <span>Update Status ({order.status})</span>
              </button>
            )}
            <button
              onClick={onBack}
              className="px-4 py-2.5 border rounded-xl text-slate-500 hover:bg-slate-50 text-xs font-black"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// INLINE PRINT LAYOUT (No emojis)

// CREATE NEW ORDER MODAL COMPONENT
function AddOrderModal({
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
  React.useEffect(() => {
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
                      min="1000"
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

function PrintLayout({ type, order, onClose, formatLAK, t }) {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col p-8 select-all">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('common.app_name')}</h1>
            <p className="text-xs text-slate-500">Phone Savan village, Sisattanak district, Vientiane</p>
            <p className="text-xs text-slate-500">Tel: 020 5566-7788 | Email: somsingphim@gmail.com</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-slate-800">
              {type === 'receipt' ? t('orders.btn_print_receipt').split(' ')[0] : t('orders.btn_print_delivery').split(' ')[0]}
            </h2>
            <p className="text-xs text-slate-400 mt-1">ORDER ID: {order.id}</p>
            <p className="text-xs text-slate-400 font-sans">Date: {order.date}</p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-bold text-slate-500 uppercase">Customer:</p>
            <p className="font-semibold text-slate-800 mt-1 text-sm">{order.customerName}</p>
            <p className="text-slate-500 font-sans mt-0.5">{order.phone}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-500 uppercase">Payment Status:</p>
            <p className="font-bold text-indigo-600 mt-1 text-sm">{t(`payment.${order.paymentStatus}`)}</p>
            <p className="text-slate-400 font-mono mt-0.5">{order.paymentSlipNote || 'Payment on delivery'}</p>
          </div>
        </div>

        <table className="w-full text-xs text-left border-collapse border border-slate-200">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <th className="p-3">Item Description</th>
              <th className="p-3 text-center">Quantity</th>
              <th className="p-3 text-right">Unit Price</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item, idx) => (
              <tr key={idx} className="text-slate-700">
                <td className="p-3 font-semibold">{item.name}</td>
                <td className="p-3 text-center font-sans font-semibold">{item.quantity}</td>
                <td className="p-3 text-right font-sans">{formatLAK(item.unitCost)}</td>
                <td className="p-3 text-right font-sans font-bold">{formatLAK(item.quantity * item.unitCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end pt-4">
          <div className="w-72 space-y-2 text-xs font-semibold text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-sans text-slate-900">{formatLAK(order.totalPriceCharged)}</span>
            </div>
            <div className="flex justify-between text-indigo-600 font-bold">
              <span>Deposit Paid:</span>
              <span className="font-sans">{formatLAK(order.depositAmountPaid)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-red-600 text-sm font-extrabold">
              <span>Remaining Balance:</span>
              <span className="font-sans">{formatLAK(order.remainingUnpaidBalance)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-16 text-center text-xs">
          <div>
            <div className="w-48 border-b mx-auto h-12" />
            <p className="mt-2 font-bold text-slate-500">Customer Signature</p>
          </div>
          <div>
            <div className="w-48 border-b mx-auto h-12" />
            <p className="mt-2 font-bold text-slate-500">Som Sing Printing Authorized Representative</p>
          </div>
        </div>

        <div className="pt-8 flex justify-center print:hidden">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}


// LIGHTBOX MODAL COMPONENT
function Lightbox({ src, title, onClose }) {
  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const isImage = src && /\.(jpg|jpeg|png|gif|webp|svg)/i.test(src);

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b bg-slate-50">
          <span className="text-sm font-black text-slate-700 truncate">{title}</span>
          <div className="flex items-center gap-2">
            {src && (
              <a
                href={src}
                download
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-sky text-white rounded-xl text-xs font-black hover:bg-sky-600 transition animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                <span>Download</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
            >
              <span className="font-extrabold text-sm px-1">✕</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-slate-900/5 flex items-center justify-center min-h-[300px] max-h-[80vh] overflow-auto p-4">
          {isImage ? (
            <img
              src={src}
              alt={title || "Preview"}
              className="max-h-[70vh] max-w-full object-contain p-2"
            />
          ) : (
            <iframe
              src={src}
              title={title}
              className="w-full h-[70vh] border-none rounded-xl bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}
