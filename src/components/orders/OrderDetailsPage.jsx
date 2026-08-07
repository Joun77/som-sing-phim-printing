import React from 'react';
import { 
  ArrowLeft,
  CheckCircle2, 
  Clock, 
  Printer, 
  Trash2,
  Truck,
  Package,
  Scissors,
  FileCheck,
  ShieldCheck,
  CreditCard,
  DollarSign,
  FileText
} from 'lucide-react';

export default function OrderDetailsPage({
  order,
  onBack,
  formatLAK,
  t,
  currentLang,
  handleStatusChange,
  deleteOrder,
  showToast,
  askConfirmation,
  setIsSettleOpen,
  setSettleAmount,
  setSettleStep,
  getStatusBadgeClass,
  getStatusIcon,
  getPaymentStatusBadge,
  getPaymentStatusIcon
}) {
  if (!order) return null;

  const preflightComplete = order.preflight?.cmyk === 'Pass' && order.preflight?.bleed === 'Pass' && order.preflight?.resolution === 'Pass';
  const totalOrderedQty = order.items ? order.items.reduce((sum, it) => sum + Number(it.quantity || 0), 0) : 0;
  
  const deliveryLogs = order.deliveryLogs || [
    {
      batchNo: 1,
      date: order.date || new Date().toLocaleDateString('th-TH'),
      quantityDelivered: totalOrderedQty,
      courierName: order.deliveryMethod || 'Kerry Lao',
      status: order.status === 'Delivered' ? 'Fully Delivered' : 'In Transit'
    }
  ];

  const totalDeliveredQty = order.status === 'Delivered' 
    ? totalOrderedQty 
    : deliveryLogs.reduce((sum, log) => sum + Number(log.quantityDelivered || 0), 0);

  const remainingUnpaid = order.remainingUnpaidBalance ?? 0;
  const paidAmount = order.totalPriceCharged ? (order.totalPriceCharged - remainingUnpaid) : 0;

  const getItemSpecs = (item) => {
    const name = (item.name || '').toLowerCase();
    let paper = 'Standard Paper';
    let size = 'A4';
    let finishing = 'Standard Cutting';
    
    if (name.includes('double a')) paper = 'Double A 80gsm';
    if (name.includes('glossy') || name.includes('ຮູບ')) paper = 'Glossy Photo 230gsm';
    if (name.includes('card') || name.includes('ນາມບັດ')) paper = 'Art Card 300gsm';
    if (name.includes('spiral') || name.includes('ເຂົ້າເລົ່ມ')) finishing = 'Spiral Binding';
    if (name.includes('ພັບ')) finishing = 'Tri-fold Finishing';
    if (name.includes('a3')) size = 'A3';
    if (name.includes('a5')) size = 'A5';
    
    return { paper, size, finishing };
  };

  // Shopee-style light status checks
  const isProdStepDone = (stepKey) => {
    if (stepKey === 'preflight') return preflightComplete;
    if (stepKey === 'printing') return ['Printing', 'Cutting', 'Ready', 'Delivered'].includes(order.status);
    if (stepKey === 'cutting') return ['Cutting', 'Ready', 'Delivered'].includes(order.status);
    if (stepKey === 'qc') return ['Ready', 'Delivered'].includes(order.status);
    return false;
  };

  const isShippingStepDone = (stepKey) => {
    if (stepKey === 'ready') return ['Ready', 'Delivered'].includes(order.status);
    if (stepKey === 'dispatched') return ['Ready', 'Delivered'].includes(order.status);
    if (stepKey === 'delivered') return order.status === 'Delivered';
    return false;
  };

  const isPaymentStepDone = (stepKey) => {
    if (stepKey === 'deposit') return ['Deposit Paid', 'Fully Paid'].includes(order.paymentStatus);
    if (stepKey === 'full_settle') return order.paymentStatus === 'Fully Paid';
    if (stepKey === 'clearance') return remainingUnpaid === 0;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in font-sans">
      {/* 1. TOP HEADER & NAVIGATION BAR (LIGHT THEME) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-2xl text-xs sm:text-sm font-black transition active:scale-95 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{currentLang === 'lo' ? '← ກັບຄືນ' : '← Back to Orders'}</span>
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase">
              <span>Order ID: #{order.id}</span>
              <span>•</span>
              <span>Date: {order.date} {order.createdTime || ''}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
              {currentLang === 'lo' ? 'ລາຍລະອຽດການສັ່ງຊື້ & ຕິດຕາມສະຖານະ' : 'Order Details & Process Tracking'}
            </h1>
          </div>
        </div>

        {/* Status Badges & Delete Button */}
        <div className="flex flex-wrap items-center gap-3">
          <span className={`px-3 py-1.5 rounded-xl text-xs font-black border uppercase flex items-center gap-1.5 ${getStatusBadgeClass(order.status)}`}>
            {getStatusIcon(order.status)}
            <span>{t(`status.${order.status}`)}</span>
          </span>
          <span className={`px-3 py-1.5 rounded-xl text-xs font-black border uppercase flex items-center gap-1.5 ${getPaymentStatusBadge(order.paymentStatus)}`}>
            {getPaymentStatusIcon(order.paymentStatus)}
            <span>{t(`payment.${order.paymentStatus}`)}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              const msg = currentLang === 'lo' ? 'ທ່ານຕ້ອງການລຶບອໍເດີນີ້ແທ້ ຫຼື ບໍ່?' : 'Delete this order permanently?';
              askConfirmation(msg, () => {
                deleteOrder(order.id);
                onBack();
                showToast(currentLang === 'lo' ? 'ລຶບອໍເດີສຳເລັດ!' : 'Order deleted successfully!', 'success');
              });
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-xs font-black transition active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ລຶບ' : 'Delete'}</span>
          </button>
        </div>
      </div>

      {/* 2. SHOPEE-STYLE 3-BLOCK TRACKING SYSTEM (LIGHT THEME) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-600" />
            <span>{currentLang === 'lo' ? 'ຕິດຕາມຂະບວນການຜະລິດ & ຈັດສົ່ງ (Shopee-Style Tracker)' : 'Order Process Tracker'}</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono font-semibold">Promised Delivery: {order.promisedDeliveryDate}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* BLOCK 1: PRODUCTION PROCESS (ຂະບວນການຜະລິດ/ພິມ) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-50 text-purple-700 rounded-2xl border border-purple-100">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider block">Block 1</span>
                    <h3 className="text-base font-black text-slate-900">{currentLang === 'lo' ? '1. ຂະບວນການຜະລິດ/ພິມ' : '1. Production Process'}</h3>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border ${
                  ['Ready', 'Delivered'].includes(order.status)
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  {order.status}
                </span>
              </div>

              {/* Sub-steps tick list */}
              <div className="space-y-3 pt-4">
                {/* Sub-step 1: Pre-flight Check */}
                <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isProdStepDone('preflight')
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                    : 'bg-slate-50 border-slate-200/80 text-slate-600'
                }`}>
                  <div className="flex items-center gap-3">
                    <FileCheck className={`w-4 h-4 ${isProdStepDone('preflight') ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold block text-slate-900">Pre-flight File Check</span>
                      <span className="text-[10px] text-slate-500 block font-mono">CMYK • Bleed • Resolution</span>
                    </div>
                  </div>
                  {isProdStepDone('preflight') ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ✓ Pass
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                      ⏳ Pending
                    </span>
                  )}
                </div>

                {/* Sub-step 2: Printing */}
                <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isProdStepDone('printing')
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                    : order.status === 'Printing'
                    ? 'bg-blue-50/60 border-blue-200 text-slate-800'
                    : 'bg-slate-50 border-slate-200/80 text-slate-600'
                }`}>
                  <div className="flex items-center gap-3">
                    <Printer className={`w-4 h-4 ${isProdStepDone('printing') ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold block text-slate-900">{currentLang === 'lo' ? 'ພິມງານ' : 'Printing Phase'}</span>
                      <span className="text-[10px] text-slate-500 block font-mono">Press Run</span>
                    </div>
                  </div>
                  {isProdStepDone('printing') ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ✓ Done
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                      Queued
                    </span>
                  )}
                </div>

                {/* Sub-step 3: Finishing & Cutting */}
                <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isProdStepDone('cutting')
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                    : 'bg-slate-50 border-slate-200/80 text-slate-600'
                }`}>
                  <div className="flex items-center gap-3">
                    <Scissors className={`w-4 h-4 ${isProdStepDone('cutting') ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold block text-slate-900">Finishing & Cutting</span>
                      <span className="text-[10px] text-slate-500 block font-mono">Cut • Laminate • Binding</span>
                    </div>
                  </div>
                  {isProdStepDone('cutting') ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ✓ Complete
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                      Pending
                    </span>
                  )}
                </div>

                {/* Sub-step 4: QC & Packaging */}
                <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isProdStepDone('qc')
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                    : 'bg-slate-50 border-slate-200/80 text-slate-600'
                }`}>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className={`w-4 h-4 ${isProdStepDone('qc') ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold block text-slate-900">QC & Packaging</span>
                      <span className="text-[10px] text-slate-500 block font-mono">Quality Check</span>
                    </div>
                  </div>
                  {isProdStepDone('qc') ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ✓ Passed QC
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick action button inside Block 1 */}
            {order.status !== 'Ready' && order.status !== 'Delivered' && (
              <button
                type="button"
                onClick={() => {
                  if (handleStatusChange) handleStatusChange(order.id, order.status);
                }}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95 mt-4"
              >
                Advance Production ({order.status})
              </button>
            )}
          </div>

          {/* BLOCK 2: SHIPPING & DELIVERY PROCESS (ຂະບວນການຈັດສົ່ງ) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-sky-50 text-sky-700 rounded-2xl border border-sky-100">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-sky-600 tracking-wider block">Block 2</span>
                    <h3 className="text-base font-black text-slate-900">{currentLang === 'lo' ? '2. ຂະບວນການຈັດສົ່ງ' : '2. Shipping & Delivery'}</h3>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border ${
                  order.status === 'Delivered'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : order.status === 'Ready'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {order.status === 'Delivered' ? 'Delivered' : order.status === 'Ready' ? 'Ready to Ship' : 'In Production'}
                </span>
              </div>

              {/* Sub-steps tick list */}
              <div className="space-y-3 pt-4">
                {/* Sub-step 1: Ready to Ship */}
                <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isShippingStepDone('ready')
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                    : 'bg-slate-50 border-slate-200/80 text-slate-600'
                }`}>
                  <div className="flex items-center gap-3">
                    <Package className={`w-4 h-4 ${isShippingStepDone('ready') ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold block text-slate-900">Production Finished</span>
                      <span className="text-[10px] text-slate-500 block font-mono">Ready for Dispatch</span>
                    </div>
                  </div>
                  {isShippingStepDone('ready') ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ✓ Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                      In Production
                    </span>
                  )}
                </div>

                {/* Sub-step 2: Courier & Dispatch */}
                <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isShippingStepDone('dispatched')
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                    : 'bg-slate-50 border-slate-200/80 text-slate-600'
                }`}>
                  <div className="flex items-center gap-3">
                    <Truck className={`w-4 h-4 ${isShippingStepDone('dispatched') ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold block text-slate-900">Courier Dispatch</span>
                      <span className="text-[10px] text-slate-500 block font-mono">{order.deliveryMethod || 'Kerry Lao'}</span>
                    </div>
                  </div>
                  {isShippingStepDone('dispatched') ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ✓ Dispatched
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                      Pending Dispatch
                    </span>
                  )}
                </div>

                {/* Sub-step 3: Final Delivery Handover */}
                <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isShippingStepDone('delivered')
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                    : 'bg-slate-50 border-slate-200/80 text-slate-600'
                }`}>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`w-4 h-4 ${isShippingStepDone('delivered') ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold block text-slate-900">Handover Completed</span>
                      <span className="text-[10px] text-slate-500 block font-mono">{totalDeliveredQty} / {totalOrderedQty} items</span>
                    </div>
                  </div>
                  {isShippingStepDone('delivered') ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ✓ Delivered
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                      Awaiting Handover
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Button inside Block 2 */}
            {order.status === 'Ready' && (
              <button
                type="button"
                onClick={() => {
                  if (handleStatusChange) handleStatusChange(order.id, 'Delivered');
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95 mt-4 flex items-center justify-center gap-2"
              >
                <Truck className="w-4 h-4" />
                <span>Mark Delivered (ສົ່ງມອບແລ້ວ)</span>
              </button>
            )}
          </div>

          {/* BLOCK 3: PAYMENT STATUS PROCESS (ຂະບວນການຊຳຣະເງິນ) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider block">Block 3</span>
                    <h3 className="text-base font-black text-slate-900">{currentLang === 'lo' ? '3. ຂະບວນການຊຳຣະເງິນ' : '3. Payment Status'}</h3>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border ${
                  order.paymentStatus === 'Fully Paid'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>

              {/* Sub-steps tick list */}
              <div className="space-y-3 pt-4">
                {/* Sub-step 1: Deposit Paid */}
                <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isPaymentStepDone('deposit')
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                    : 'bg-slate-50 border-slate-200/80 text-slate-600'
                }`}>
                  <div className="flex items-center gap-3">
                    <DollarSign className={`w-4 h-4 ${isPaymentStepDone('deposit') ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold block text-slate-900">Deposit Received</span>
                      <span className="text-[10px] text-slate-500 block font-mono">Paid: {formatLAK(paidAmount)}</span>
                    </div>
                  </div>
                  {isPaymentStepDone('deposit') ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ✓ Received
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                      Unpaid Deposit
                    </span>
                  )}
                </div>

                {/* Sub-step 2: Remaining Balance Settlement */}
                <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isPaymentStepDone('full_settle')
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                    : 'bg-slate-50 border-slate-200/80 text-slate-600'
                }`}>
                  <div className="flex items-center gap-3">
                    <CreditCard className={`w-4 h-4 ${isPaymentStepDone('full_settle') ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold block text-slate-900">Full Settlement</span>
                      <span className="text-[10px] text-slate-500 block font-mono">Remaining: {formatLAK(remainingUnpaid)}</span>
                    </div>
                  </div>
                  {isPaymentStepDone('full_settle') ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ✓ Fully Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                      Pending Balance
                    </span>
                  )}
                </div>

                {/* Sub-step 3: Financial Clearance */}
                <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isPaymentStepDone('clearance')
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                    : 'bg-slate-50 border-slate-200/80 text-slate-600'
                }`}>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className={`w-4 h-4 ${isPaymentStepDone('clearance') ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold block text-slate-900">Financial Clearance</span>
                      <span className="text-[10px] text-slate-500 block font-mono">Zero Balance Due</span>
                    </div>
                  </div>
                  {isPaymentStepDone('clearance') ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ✓ Cleared
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200">
                      Uncleared
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Settle Button inside Block 3 */}
            {remainingUnpaid > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSettleAmount(remainingUnpaid);
                  setSettleStep(1);
                  setIsSettleOpen(true);
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95 mt-4"
              >
                {t('orders.btn_settle')} ({formatLAK(remainingUnpaid)})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. SIMPLIFIED CUSTOMER ORDER SUMMARY (LIGHT THEME) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-600" />
              <span>{currentLang === 'lo' ? 'ສະຫຼຸບລາຍການສັ່ງຊື້ (Customer Order Summary)' : 'Customer Order Summary'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-semibold">
              {currentLang === 'lo' ? 'ລູກຄ້າ: ' : 'Customer: '} <strong className="text-slate-900">{order.customerName}</strong> | Tel: {order.phone}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                showToast('ກຳລັງພິມ: Detailed Spec Quote', 'info');
                window.print();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl text-xs font-black transition active:scale-95 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Spec Quote</span>
            </button>
            <button
              type="button"
              onClick={() => {
                showToast('ກຳລັງພິມ: Summary Invoice', 'info');
                window.print();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-black transition active:scale-95 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Summary Invoice</span>
            </button>
          </div>
        </div>

        {/* Lightweight Clean Summary Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-black uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="px-5 py-3.5">Item Name</th>
                <th className="px-5 py-3.5">Specifications</th>
                <th className="px-5 py-3.5 text-center">Qty</th>
                <th className="px-5 py-3.5 text-right">Unit Price</th>
                <th className="px-5 py-3.5 text-right">Total Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {order.items && order.items.map((item, idx) => {
                const specs = getItemSpecs(item);
                const itemTotal = Number(item.quantity || 0) * Number(item.unitCost || 0);
                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-bold text-slate-900 text-sm">{item.name}</td>
                    <td className="px-5 py-4 text-xs text-slate-500 font-sans">
                      <span>{specs.paper}</span> • <span>{specs.size}</span> • <span>{specs.finishing}</span>
                    </td>
                    <td className="px-5 py-4 text-center font-mono font-bold text-slate-900">x{item.quantity}</td>
                    <td className="px-5 py-4 text-right font-sans">{formatLAK(item.unitCost)}</td>
                    <td className="px-5 py-4 text-right font-sans font-black text-slate-900 text-sm">{formatLAK(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary Card Footer (Light Theme) */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1 text-xs text-slate-500 font-semibold">
            <div>Shipping Method: <strong className="text-slate-900">{order.deliveryMethod || 'Kerry Lao'}</strong></div>
            {order.address && <div>Address: <span className="text-slate-700 italic">{order.address}</span></div>}
          </div>

          <div className="flex flex-wrap gap-6 text-xs sm:text-sm font-sans">
            <div>
              <span className="text-slate-400 block text-[10px] font-black uppercase">Total Amount</span>
              <span className="text-lg font-black text-slate-900">{formatLAK(order.totalPriceCharged)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-black uppercase">Paid Amount</span>
              <span className="text-lg font-black text-emerald-600">{formatLAK(paidAmount)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-black uppercase">Pending Balance</span>
              <span className={`text-lg font-black ${remainingUnpaid > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                {formatLAK(remainingUnpaid)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
