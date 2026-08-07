import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  X, 
  Download, 
  Link, 
  Printer, 
  ChevronRight, 
  Trash2 
} from 'lucide-react';

export default function OrderDetailsModal({
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
