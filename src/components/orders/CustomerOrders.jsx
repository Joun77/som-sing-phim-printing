import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus,
  Activity,
  Layers
} from 'lucide-react';
import OrdersTable from './OrdersTable';
import CreateOrderPage from './CreateOrderPage';
import OrderDetailsPage from './OrderDetailsPage';
import Lightbox from './Lightbox';

export default function CustomerOrders({ initialSubTab = 'orders' }) {
  const { 
    orders, 
    updateOrderStatus, 
    settleOrderBalance, 
    deleteOrder, 
    updatePreflightCheck,
    inventory,
    equipment,
    showToast,
    askConfirmation,
    focusOrderId,
    setFocusOrderId,
    addOrder,
    customers,
    addCustomer,
    prefilledOrderSpecs,
    setPrefilledOrderSpecs
  } = useApp();

  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const [filterStatus, setFilterStatus] = useState(
    initialSubTab === 'production' ? 'Printing' : initialSubTab === 'deliveries' ? 'Ready' : 'All'
  );
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(initialSubTab === 'create_order');
  const [lightbox, setLightbox] = useState(null);
  const focusRef = useRef(null);

  useEffect(() => {
    if (initialSubTab === 'create_order') {
      setIsAddOrderOpen(true);
    } else if (initialSubTab === 'production') {
      setFilterStatus('Printing');
      setIsAddOrderOpen(false);
    } else if (initialSubTab === 'deliveries') {
      setFilterStatus('Ready');
      setIsAddOrderOpen(false);
    } else if (initialSubTab === 'orders') {
      setIsAddOrderOpen(false);
    }
  }, [initialSubTab]);

  // Settle Balance Wizard states
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [settleStep, setSettleStep] = useState(1);
  const [settleAmount, setSettleAmount] = useState(0);
  const [settleMethod, setSettleMethod] = useState('BCEL One');
  const [settleSlip, setSettleSlip] = useState('');

  // Auto-open modal when quote converted to order
  useEffect(() => {
    if (prefilledOrderSpecs) {
      setIsAddOrderOpen(true);
    }
  }, [prefilledOrderSpecs]);

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
  }, [focusOrderId, orders, setFocusOrderId]);

  const formatLAK = useCallback((num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num).replace('LAK', '₭');
  }, []);

  const statuses = ['All', 'Received', 'Printing', 'Cutting', 'Ready', 'Delivered'];

  const handleStatusChange = useCallback((orderId, currentStatus) => {
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
  }, [orders, selectedOrder, updateOrderStatus, showToast, currentLang]);

  const handlePreflightToggle = useCallback((field, value) => {
    if (!selectedOrder) return;
    updatePreflightCheck(selectedOrder.id, field, value);
    showToast(currentLang === 'lo' ? 'ອັບເດດສະຖານະປຼູຟສຳເລັດ!' : 'Pre-flight updated!', 'success');
    
    const updated = orders.find(o => o.id === selectedOrder.id);
    if (updated) setSelectedOrder(updated);
  }, [selectedOrder, updatePreflightCheck, showToast, currentLang, orders]);

  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'Received': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'Printing': return <Activity className="w-4 h-4 text-purple-600 animate-pulse" />;
      case 'Cutting': return <Layers className="w-4 h-4 text-amber-600" />;
      case 'Ready': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'Delivered': return <CheckCircle2 className="w-4 h-4 text-slate-500" />;
      default: return <Clock className="w-4 h-4 text-slate-500" />;
    }
  }, []);

  const getStatusBadgeClass = useCallback((status) => {
    switch (status) {
      case 'Received': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Printing': return 'bg-purple-50 text-purple-700 border-purple-100 animate-pulse';
      case 'Cutting': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Ready': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Delivered': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-50 text-slate-700';
    }
  }, []);

  const getPaymentStatusIcon = useCallback((status) => {
    switch (status) {
      case 'Pending': return <Clock className="w-3.5 h-3.5 text-red-500" />;
      case 'Deposit Paid': return <Clock className="w-3.5 h-3.5 text-indigo-500" />;
      case 'Fully Paid': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Overdue': return <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-bounce" />;
      default: return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  }, []);

  const getPaymentStatusBadge = useCallback((status) => {
    switch (status) {
      case 'Pending': return 'bg-red-50 text-red-700 border-red-100';
      case 'Deposit Paid': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Fully Paid': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Overdue': return 'bg-red-100 text-red-800 border-red-200 font-extrabold animate-bounce';
      default: return 'bg-slate-50 text-slate-700';
    }
  }, []);

  const handleSettleSubmit = (e) => {
    e.preventDefault();
    if (!selectedOrder || settleAmount <= 0) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາປ້ອນຈຳນວນເງິນຊຳຣະ!' : 'Enter settlement amount!', 'warning');
      return;
    }

    settleOrderBalance(selectedOrder.id, Number(settleAmount), settleMethod, settleSlip);
    showToast(currentLang === 'lo' ? 'ຊຳຣະລ້ຽງໜີ້ສຳເລັດ!' : 'Balance settled successfully!', 'success');
    
    const updated = orders.find(o => o.id === selectedOrder.id);
    if (updated) setSelectedOrder(updated);

    setIsSettleOpen(false);
    setSettleAmount(0);
    setSettleSlip('');
    setSettleStep(1);
  };

  const applySettlePreset = (pct) => {
    if (selectedOrder) {
      if (pct === 100) setSettleAmount(selectedOrder.remainingUnpaidBalance);
      else if (pct === 50) setSettleAmount(Math.round(selectedOrder.remainingUnpaidBalance / 2));
    }
  };

  const filteredOrders = useMemo(() => {
    if (initialSubTab === 'completed') {
      return orders.filter(o => o.status === 'Delivered' && o.paymentStatus === 'Fully Paid');
    }
    if (initialSubTab === 'cancelled') {
      return orders.filter(o => o.status === 'Cancelled');
    }
    if (initialSubTab === 'production') {
      return orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
    }
    if (initialSubTab === 'deliveries') {
      return orders.filter(o => o.status !== 'Cancelled');
    }
    if (filterStatus === 'All') {
      return orders.filter(o => o.status !== 'Cancelled');
    }
    return orders.filter(ord => ord.status === filterStatus);
  }, [orders, initialSubTab, filterStatus]);

  const handleToggleDeliveryStatus = (orderId, currentStatus) => {
    const nextStatus = currentStatus === 'Delivered' ? 'Ready' : 'Delivered';
    updateOrderStatus(orderId, nextStatus);
    showToast(`ອັບເດດສະຖານະການຈັດສົ່ງເປັນ: ${nextStatus === 'Delivered' ? 'ສົ່ງມອບແລ້ວ (Delivered)' : 'ກຳລັງຂົນສົ່ງ (In Transit)'}`, 'success');
  };

  if (isAddOrderOpen) {
    return (
      <CreateOrderPage
        onBack={() => { setIsAddOrderOpen(false); setPrefilledOrderSpecs(null); }}
        inventory={inventory}
        equipment={equipment}
        customers={customers}
        addCustomer={addCustomer}
        addOrder={addOrder}
        showToast={showToast}
        formatLAK={formatLAK}
        currentLang={currentLang}
        t={t}
        prefilledSpecs={prefilledOrderSpecs}
      />
    );
  }

  if (selectedOrder) {
    return (
      <>
        {lightbox && (
          <Lightbox
            src={lightbox.src}
            title={lightbox.title}
            onClose={() => setLightbox(null)}
          />
        )}
        <OrderDetailsPage 
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

        {/* STEP-BY-STEP BALANCE SETTLEMENT DIALOG */}
        {isSettleOpen && (
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
                    ✕
                  </button>
                </div>

                <div className="flex gap-2 mb-6">
                  {[1, 2].map(st => (
                    <div 
                      key={st} 
                      className={`h-2 flex-1 rounded-full transition-all duration-300 ${st <= settleStep ? 'bg-emerald-500' : 'bg-slate-100'}`}
                    />
                  ))}
                </div>

                <form onSubmit={handleSettleSubmit} className="space-y-4 text-xs sm:text-sm">
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

                  {settleStep === 2 && (
                    <div className="space-y-4 animate-fade-in">
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
                                <span>{method}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Slip Reference Note</label>
                        <input
                          type="text"
                          value={settleSlip}
                          onChange={(e) => setSettleSlip(e.target.value)}
                          placeholder="Note or reference..."
                          className="w-full px-3 py-2 border-2 rounded-xl focus:outline-none text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    {settleStep === 2 && (
                      <button
                        type="button"
                        onClick={() => setSettleStep(1)}
                        className="px-4 py-2 border rounded-xl text-slate-500 hover:bg-slate-50 text-xs font-bold transition"
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsSettleOpen(false)}
                      className="px-4 py-2 border rounded-xl text-slate-400 hover:bg-slate-50 text-xs font-bold transition"
                    >
                      Cancel
                    </button>
                    {settleStep === 1 ? (
                      <button
                        type="button"
                        onClick={() => setSettleStep(2)}
                        className="px-5 py-2 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition shadow-md"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                      >
                        Settle Balance
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </dialog>
        )}
      </>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in print:hidden text-slate-800 w-full">
      {/* Dynamic Header Card based on subTab */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-primary-navy tracking-tight font-sans">
            {initialSubTab === 'production' && '🏭 ຕິດຕາມການຜະລິດ (Production Tracker)'}
            {initialSubTab === 'deliveries' && '🚚 ຕິດຕາມການຈັດສົ່ງ & ຊຳຣະເງິນ (Deliveries & Payment)'}
            {initialSubTab === 'completed' && '✅ ລາຍການຈັດສົ່ງສໍາເລັດ (Completed Orders)'}
            {initialSubTab === 'cancelled' && '❌ ລາຍການຍົກເລີກ (Cancelled Orders)'}
            {initialSubTab === 'orders' && t('orders.title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
            {initialSubTab === 'production' && 'ກວດສອບຈຳນວນຜະລິດ, ຄວາມຄືບໜ້າແຕ່ລະຂັ້ນຕອນ ແລະ ອັບເດດສະຖານະແທ່ນພິມ'}
            {initialSubTab === 'deliveries' && 'ຕິດຕາມການສົ່ງມອບສິນຄ້າ, ຊຳຣະຍອດຄ້າງ ແລະ ແຈ້ງອັບເດດສະຖານະການຂົນສົ່ງ'}
            {initialSubTab === 'completed' && 'ປະຫວັດອໍເດີທີ່ສົ່ງມອບສິນຄ້າ ແລະ ຊຳຣະເງິນຄົບ 100% เรียบร้อยแล้ว'}
            {initialSubTab === 'cancelled' && 'ລາຍການອໍເດີທີ່ຖືກຍົກເລີກ ພ້ອມໝາຍເຫດເຫດຜົນ'}
            {initialSubTab === 'orders' && t('orders.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setIsAddOrderOpen(true)}
          className="flex items-center gap-2.5 px-6 py-3.5 bg-accent-sky hover:bg-sky-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-sky-600/10 transition active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>{currentLang === 'lo' ? 'ເພີ່ມອໍເດີໃໝ່' : 'Add New Order'}</span>
        </button>
      </div>

      {/* Filter tab bar only on 'orders' tab */}
      {initialSubTab === 'orders' && (
        <div className="flex flex-wrap gap-1.5 p-1 bg-white rounded-2xl border max-w-3xl">
          {statuses.map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`
                px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all min-h-[46px]
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
      )}

      {/* Delivery Custom Actions Table when in 'deliveries' tab */}
      {initialSubTab === 'deliveries' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
            ລາຍການຕິດຕາມການຈັດສົ່ງ & ຮັບເງິນມັດຈຳ (Delivery & Payment Tracker)
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-black uppercase border-b">
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">ລູກຄ້າ</th>
                  <th className="px-4 py-3 text-center">ສະຖານະຈັດສົ່ງ</th>
                  <th className="px-4 py-3 text-right">ຍອດຄ້າງຊຳຣະ</th>
                  <th className="px-4 py-3 text-center">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                {filteredOrders.map(ord => (
                  <tr key={ord.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3.5 font-mono font-black text-slate-900">#{ord.id}</td>
                    <td className="px-4 py-3.5">
                      <span className="block font-bold text-slate-900">{ord.customerName}</span>
                      <span className="block text-[10px] text-slate-400 font-sans">{ord.phone}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleDeliveryStatus(ord.id, ord.status)}
                        className={`px-3 py-1.5 rounded-xl font-black text-[11px] transition shadow-sm border ${
                          ord.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        {ord.status === 'Delivered' ? '✓ ສົ່ງມອບແລ້ວ (Delivered)' : '🚚 ກຳລັງຂົນສົ່ງ (In Transit)'}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right font-sans">
                      {ord.remainingUnpaidBalance > 0 ? (
                        <span className="text-red-600 font-black">{formatLAK(ord.remainingUnpaidBalance)}</span>
                      ) : (
                        <span className="text-emerald-600 font-black">✓ ชำระครบแล้ว</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center flex items-center justify-center gap-2">
                      {ord.remainingUnpaidBalance > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(ord);
                            setSettleAmount(ord.remainingUnpaidBalance);
                            setSettleStep(1);
                            setIsSettleOpen(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[11px] transition shadow-sm"
                        >
                          ຊຳຣະຍອດຄ້າງ
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(ord)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-[11px] transition"
                      >
                        ເບິ່ງລາຍລະອຽດ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Table Component */}
      {initialSubTab !== 'deliveries' && (
        <OrdersTable
          filteredOrders={filteredOrders}
          selectedOrder={selectedOrder}
          focusRef={focusRef}
          currentLang={currentLang}
          formatLAK={formatLAK}
          t={t}
          getStatusBadgeClass={getStatusBadgeClass}
          getStatusIcon={getStatusIcon}
          getPaymentStatusBadge={getPaymentStatusBadge}
          getPaymentStatusIcon={getPaymentStatusIcon}
          onViewDetails={setSelectedOrder}
        />
      )}

      {/* Lightbox Modal */}
      {lightbox && (
        <Lightbox
          src={lightbox.src}
          title={lightbox.title}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Order Details Interactive Modal Overlay */}
      {selectedOrder && (
        <OrderDetailsModal 
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
          isProductionView={initialSubTab === 'production'}
        />
      )}

      {/* STEP-BY-STEP BALANCE SETTLEMENT DIALOG */}
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
                  ✕
                </button>
              </div>

              <div className="flex gap-2 mb-6">
                {[1, 2].map(st => (
                  <div 
                    key={st} 
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${st <= settleStep ? 'bg-emerald-500' : 'bg-slate-100'}`}
                  />
                ))}
              </div>

              <form onSubmit={handleSettleSubmit} className="space-y-4 text-xs sm:text-sm">
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

                {settleStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
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
                              <span>{method}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Slip Reference Note</label>
                      <input
                        type="text"
                        value={settleSlip}
                        onChange={(e) => setSettleSlip(e.target.value)}
                        placeholder="Note or reference..."
                        className="w-full px-3 py-2 border-2 rounded-xl focus:outline-none text-xs font-bold"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  {settleStep === 2 && (
                    <button
                      type="button"
                      onClick={() => setSettleStep(1)}
                      className="px-4 py-2 border rounded-xl text-slate-500 hover:bg-slate-50 text-xs font-bold transition"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsSettleOpen(false)}
                    className="px-4 py-2 border rounded-xl text-slate-400 hover:bg-slate-50 text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  {settleStep === 1 ? (
                    <button
                      type="button"
                      onClick={() => setSettleStep(2)}
                      className="px-5 py-2 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition shadow-md"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                    >
                      Settle Balance
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
