import React, { useState } from 'react';
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
    askConfirmation
  } = useApp();

  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
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

  return (
    <div className="space-y-8 animate-fade-in print:hidden text-slate-800">
      
      {/* Header card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-1">
        <h2 className="text-3xl font-black text-primary-navy tracking-tight">
          {t('orders.title')}
        </h2>
        <p className="text-base text-slate-500 font-semibold leading-relaxed">
          {t('orders.subtitle')}
        </p>
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

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map(ord => {
          const isOverdue = ord.paymentStatus === 'Overdue';
          const preflightComplete = ord.preflight?.cmyk === 'Pass' && ord.preflight?.bleed === 'Pass' && ord.preflight?.resolution === 'Pass';
          
          return (
            <div 
              key={ord.id} 
              className={`
                bg-white p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between hover:shadow-md shadow-sm
                ${isOverdue ? 'border-red-300 bg-red-50/10' : 'border-slate-100'}
              `}
            >
              <div className="space-y-5">
                <div className="flex justify-between items-center gap-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 ${getStatusBadgeClass(ord.status)}`}>
                    {getStatusIcon(ord.status)}
                    <span>{t(`status.${ord.status}`)}</span>
                  </span>
                  <span className={`px-3 py-1 rounded-xl text-[10px] font-black border flex items-center gap-1 ${getPaymentStatusBadge(ord.paymentStatus)}`}>
                    {getPaymentStatusIcon(ord.paymentStatus)}
                    <span>{t(`payment.${ord.paymentStatus}`)}</span>
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-slate-400 shrink-0" />
                    <span>{ord.customerName}</span>
                  </h4>
                  <p className="text-sm text-slate-400 font-sans font-semibold leading-none">{ord.phone}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border space-y-2">
                  {ord.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm font-semibold text-slate-600">
                      <span className="truncate max-w-[150px]">{item.name}</span>
                      <span className="font-black text-slate-900 font-sans">x{item.quantity}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 mt-3 pt-2 flex justify-between text-sm font-black text-slate-950">
                    <span>{t('orders.total_price')}:</span>
                    <span className="font-sans text-accent-sky text-base">{formatLAK(ord.totalPriceCharged)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs p-3 bg-slate-100 rounded-2xl font-bold">
                  <span className="text-slate-500 uppercase tracking-wider">{t('orders.preflight')}:</span>
                  <span className={`font-black flex items-center gap-1 ${preflightComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {preflightComplete ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    {preflightComplete ? t('orders.preflight_complete') : t('orders.preflight_pending')}
                  </span>
                </div>

                <div className="flex flex-col gap-1 text-xs text-slate-400 font-bold font-sans">
                  <span>Due Date: {ord.promisedDeliveryDate}</span>
                  {ord.installationSchedule && (
                    <span className="text-indigo-600 flex items-center gap-1">
                      🛠️ Installation: {ord.installationSchedule.replace('T', ' ')}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => setSelectedOrder(ord)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-extrabold transition min-h-[44px] active:scale-95"
                >
                  <Eye className="w-5 h-5 shrink-0 text-slate-500" />
                  <span>{t('orders.btn_details')}</span>
                </button>
                
                {ord.status !== 'Delivered' && (
                  <button
                    onClick={() => handleStatusChange(ord.id, ord.status)}
                    className="px-4 py-3 bg-accent-sky text-white rounded-2xl text-sm font-extrabold hover:bg-accent-sky/95 transition flex items-center gap-1.5 min-h-[44px] active:scale-95"
                  >
                    <span>{t('orders.btn_next_step')}</span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* LIFE-CYCLE DETAIL MODAL */}
      {selectedOrder && (
        <dialog 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent outline-none border-none w-full h-full"
          open
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 overflow-y-auto max-h-[90vh] z-10 border border-slate-100 animate-fade-in space-y-6">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <span className="text-xs text-slate-400 font-mono font-bold uppercase">Order Tracker ID: {selectedOrder.id}</span>
                <h3 className="text-2xl font-black text-primary-navy mt-1">
                  {t('orders.modal_title')}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Customer card */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client Info</h4>
                  <div className="text-sm space-y-1.5 font-bold">
                    <p className="text-slate-900 text-base">{selectedOrder.customerName}</p>
                    <p className="text-slate-500 font-sans text-xs">{selectedOrder.phone}</p>
                    <p className="text-slate-400 font-sans text-xs">Created: {selectedOrder.date} {selectedOrder.createdTime}</p>
                  </div>
                </div>

                {/* Items card */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prints list</h4>
                  <div className="space-y-2 text-sm font-semibold">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between border-b pb-1 text-slate-600">
                        <span>{item.name} (x{item.quantity})</span>
                        <span className="font-black text-slate-950 font-sans">{formatLAK(item.quantity * item.unitCost)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t">
                      <span>Total Charged:</span>
                      <span className="font-sans text-accent-sky text-lg">{formatLAK(selectedOrder.totalPriceCharged)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment card */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('orders.payment_status')}</h4>
                    <span className={`px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 ${getPaymentStatusBadge(selectedOrder.paymentStatus)}`}>
                      {getPaymentStatusIcon(selectedOrder.paymentStatus)}
                      <span>{t(`payment.${selectedOrder.paymentStatus}`)}</span>
                    </span>
                  </div>

                  <div className="text-sm font-bold space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Amount Paid:</span>
                      <span className="font-sans text-slate-900 font-black">{formatLAK(selectedOrder.depositAmountPaid)}</span>
                    </div>
                    <div className="flex justify-between text-red-600 font-black">
                      <span>{t('orders.unpaid_balance')}:</span>
                      <span className="font-sans text-base">{formatLAK(selectedOrder.remainingUnpaidBalance)}</span>
                    </div>
                  </div>

                  {selectedOrder.remainingUnpaidBalance > 0 && (
                    <button
                      onClick={() => {
                        setSettleAmount(selectedOrder.remainingUnpaidBalance);
                        setSettleStep(1);
                        setIsSettleOpen(true);
                      }}
                      className="w-full mt-3 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-emerald-500/15 transition active:scale-95 min-h-[48px]"
                    >
                      {t('orders.btn_settle')}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* Pre-flight checklist card (No Emojis) */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList className="w-5 h-5 text-accent-sky" />
                    <span>{t('orders.preflight_checklist')}</span>
                  </h4>

                  <div className="space-y-3.5 text-sm font-bold text-slate-700">
                    {/* CMYK Check */}
                    <div className="flex items-center justify-between">
                      <span>{t('orders.cmyk_mode')}</span>
                      <div className="flex gap-1.5">
                        {['Pass', 'Fail', 'Not Checked'].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handlePreflightToggle('cmyk', val)}
                            className={`px-3 py-1 rounded-xl text-xs font-black border transition min-h-[36px] ${
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

                    {/* Bleed check */}
                    <div className="flex items-center justify-between">
                      <span>{t('orders.bleed_status')}</span>
                      <div className="flex gap-1.5">
                        {['Pass', 'Fail', 'Not Checked'].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handlePreflightToggle('bleed', val)}
                            className={`px-3 py-1 rounded-xl text-xs font-black border transition min-h-[36px] ${
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

                    {/* Resolution check */}
                    <div className="flex items-center justify-between">
                      <span>{t('orders.resolution_check')}</span>
                      <div className="flex gap-1.5">
                        {['Pass', 'Fail', 'Not Checked'].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handlePreflightToggle('resolution', val)}
                            className={`px-3 py-1 rounded-xl text-xs font-black border transition min-h-[36px] ${
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

                    {/* Approved Proof */}
                    <div className="flex flex-col gap-2 pt-3 border-t text-xs text-slate-400 font-bold">
                      <div className="flex justify-between items-center">
                        <span>{t('orders.approved_timestamp')}</span>
                        <span className="font-black text-slate-700 font-sans">
                          {selectedOrder.preflight?.approvedTimestamp || 'Awaiting customer proof...'}
                        </span>
                      </div>
                      {!selectedOrder.preflight?.approvedTimestamp && (
                        <button
                          type="button"
                          onClick={() => handlePreflightToggle('approvedTimestamp', new Date().toISOString().replace('T', ' ').slice(0, 16))}
                          className="w-full py-2.5 bg-accent-sky hover:bg-accent-sky/90 text-white rounded-xl text-xs font-extrabold transition min-h-[40px] shadow-md shadow-accent-sky/15"
                        >
                          {t('orders.btn_approve_proof')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Versions list */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Link className="w-5 h-5 text-emerald-600" />
                    <span>{t('orders.version_control')}</span>
                  </h4>

                  <form onSubmit={handleAddVersion} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Artwork link URL..."
                      value={newVersionUrl}
                      onChange={(e) => setNewVersionUrl(e.target.value)}
                      className="flex-1 px-3 py-2 border-2 rounded-xl text-xs bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-accent-sky"
                    />
                    <button
                      type="submit"
                      className="px-4 bg-accent-sky hover:bg-accent-sky/95 text-white text-xs font-extrabold rounded-xl transition"
                    >
                      {t('orders.btn_add_version')}
                    </button>
                  </form>

                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {selectedOrder.preflight?.versions?.map((ver, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border flex items-center justify-between text-xs font-semibold">
                        <span className="font-black text-slate-900 font-mono">v{ver.version}</span>
                        <a 
                          href={ver.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-accent-sky hover:underline truncate max-w-[125px] ml-2"
                        >
                          {ver.url}
                        </a>
                        <span className="text-slate-400 font-sans">{ver.uploadedAt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt & Delivery actions */}
            <div className="flex flex-wrap justify-between items-center gap-4 pt-4 border-t">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPrintType('receipt');
                    setTimeout(() => window.print(), 100);
                  }}
                  className="flex items-center gap-2 px-5 py-3 border-2 border-slate-200 rounded-2xl text-slate-700 hover:bg-slate-50 text-xs font-extrabold transition active:scale-95 min-h-[44px]"
                >
                  <Printer className="w-5 h-5 text-indigo-500" />
                  <span>{t('orders.btn_print_receipt')}</span>
                </button>
                <button
                  onClick={() => {
                    setPrintType('delivery');
                    setTimeout(() => window.print(), 100);
                  }}
                  className="flex items-center gap-2 px-5 py-3 border-2 border-slate-200 rounded-2xl text-slate-700 hover:bg-slate-50 text-xs font-extrabold transition active:scale-95 min-h-[44px]"
                >
                  <Printer className="w-5 h-5 text-emerald-500" />
                  <span>{t('orders.btn_print_delivery')}</span>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const msg = currentLang === 'lo' ? 'ທ່ານຕ້ອງການລຶບອໍເດີນີ້ແທ້ ຫຼື ບໍ່?' : 'Delete this order permanently?';
                    askConfirmation(msg, () => {
                      deleteOrder(selectedOrder.id);
                      setSelectedOrder(null);
                      showToast(currentLang === 'lo' ? 'ລຶບອໍເດີສຳເລັດ!' : 'Order deleted successfully!', 'success');
                    });
                  }}
                  className="p-3 text-red-500 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 rounded-2xl transition"
                  title="Delete Order"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-3 border rounded-2xl text-slate-500 hover:bg-slate-50 text-xs font-bold min-h-[44px]"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </dialog>
      )}

      {/* ACCESSIBLE STEP-BY-STEP BALANCE SETTLEMENT DIALOG */}
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

// INLINE PRINT LAYOUT (No emojis)
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
