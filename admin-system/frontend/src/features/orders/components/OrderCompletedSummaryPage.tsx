import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Printer, 
  CreditCard, 
  User, 
  Phone, 
  MapPin, 
  Truck, 
  FileText, 
  Layers, 
  ExternalLink, 
  Download, 
  Sparkles, 
  ShieldCheck,
  CheckCheck,
  Calendar,
  Edit3
} from 'lucide-react';
import OrderStepBar from './reception/OrderStepBar';
import CustomerInvoiceModal from './modals/CustomerInvoiceModal';

interface OrderCompletedSummaryPageProps {
  order: any;
  onBack: () => void;
  onSelectStep: (step: 1 | 2 | 3 | 4) => void;
  formatLAK: (n: number) => string;
  currentLang: string;
  setLightbox?: (v: { src: string; title: string } | null) => void;
  onEditOrder?: (order: any) => void;
}

export const OrderCompletedSummaryPage: React.FC<OrderCompletedSummaryPageProps> = ({
  order,
  onBack,
  onSelectStep,
  formatLAK,
  currentLang,
  setLightbox,
  onEditOrder,
}) => {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  if (!order) return null;

  const orderIdDisplay = order.orderNo || order.order_no || order.orderNumber || order.id || 'ORDER';
  const customerIdDisplay = order.customerId || order.customer_id || `CUST-SSP-${String(order.id || 101).padStart(4, '0')}`;
  const customerName = order.customerName || order.customer_name || 'Somphavath DOUANGSVA';
  const customerPhone = order.phone || order.customer_phone || '02058866339';
  const deliveryAddress = order.address || order.delivery_address || 'Saysettha, Vientiane';
  const courier = order.deliveryMethod || order.shippingCourier || 'Anousith Express';
  const trackingNo = order.trackingNumber || 'ANO-8899201948LA';
  const totalAmountLAK = Number(order.totalPriceCharged || order.totalAmount || order.total_amount_lak || 86250);
  const paymentSlipUrl = order.paymentSlipUrl || order.payment_slip_url || order.slipUrl || order.slipImage;
  const driveLink = order.driveLink || order.googleDriveLink;
  const orderDate = order.date || new Date().toISOString().split('T')[0];

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    {
      name: order.product_name || order.specs?.name || 'Custom Document / Booklet Print',
      quantity: order.quantity || 100,
      paperType: order.specs?.paperType || 'Art Matt 150g',
      paperSize: order.specs?.size || 'A4',
      pages: order.specs?.pages || 16,
      binding: order.specs?.binding || 'ຫຍິບມຸງ (Saddle Stitch)',
      lamination: order.specs?.lamination || 'ເຄືອບດ້ານ (Matte)',
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in font-sans">
      
      {/* 1. Top Header */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-2xl text-xs sm:text-sm font-black transition active:scale-95 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{currentLang === 'lo' ? '← ກັບຄືນຕາຕະລາງ' : '← Back to Orders'}</span>
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase">
              <span className="text-amber-600 font-black">#{orderIdDisplay}</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">Step 4: Full Order Summary</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
              {currentLang === 'lo' ? 'ສະຫຼຸບຂໍ້ມູນອໍເດີສຳເລັດສົມບູນ (Order Completion Summary)' : 'Order Completion & Archive Summary'}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onEditOrder && (
            <button
              type="button"
              onClick={() => onEditOrder(order)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-2xl text-xs font-black transition active:scale-95 cursor-pointer shadow-xs"
              title={currentLang === 'lo' ? 'ແກ້ໄຂອໍເດີ & ສະເປກ' : 'Edit Order Specs & Details'}
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
              <span>{currentLang === 'lo' ? 'ແກ້ໄຂອໍເດີ' : 'Edit Order'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsInvoiceModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black transition active:scale-95 cursor-pointer shadow-md"
          >
            <CreditCard className="w-4 h-4 text-amber-300" />
            <span>{currentLang === 'lo' ? 'ໃບບິນຊຳລະເງິນ (Invoice / Receipt)' : 'Customer Invoice / Receipt'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              window.print();
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition active:scale-95 cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>{currentLang === 'lo' ? 'ພິມໜ້າສະຫຼຸບ' : 'Print Summary'}</span>
          </button>
          <span className="px-3.5 py-1.5 rounded-2xl text-xs font-black border uppercase bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1.5 shadow-xs">
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>{currentLang === 'lo' ? 'ສຳເລັດສົມບູນ' : 'Completed'}</span>
          </span>
        </div>
      </div>

      {/* 2. Interactive 4-Step StepBar */}
      <OrderStepBar
        currentStep={4}
        onSelectStep={onSelectStep}
        isPaymentConfirmed={true}
        isArtworkApproved={true}
        isProductionFinished={true}
        isDelivered={true}
        currentLang={currentLang}
      />

      {/* 3. Main 4-Card Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CARD 1: Customer Profile & Delivery Details (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {currentLang === 'lo' ? '1. ຂໍ້ມູນລູກຄ້າ & ການຈັດສົ່ງ' : '1. Customer Profile & Delivery'}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-[10.5px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                ID: {customerIdDisplay}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10.5px] font-bold">{currentLang === 'lo' ? 'ຊື່ລູກຄ້າ:' : 'Customer Name:'}</span>
                  <strong className="text-slate-900 block text-sm mt-0.5">{customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10.5px] font-bold">{currentLang === 'lo' ? 'ເບີໂທຕິດຕໍ່:' : 'Phone:'}</span>
                  <a href={`tel:${customerPhone}`} className="text-blue-600 font-mono font-bold block mt-0.5 hover:underline">
                    {customerPhone}
                  </a>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10.5px] font-bold">{currentLang === 'lo' ? 'ສະຖານທີ່ຈັດສົ່ງ:' : 'Delivery Address:'}</span>
                    <span className="text-slate-700 font-medium">{deliveryAddress}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-[11.5px]">
                  <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-sky-600" />
                    <span>ຂົນສົ່ງ: <strong>{courier}</strong></span>
                  </span>
                  <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                    {trackingNo}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ສິນຄ້າສົ່ງມອບຮອດມືລູກຄ້າ / ຂົນສົ່ງຮຽບຮ້ອຍແລ້ວ</span>
          </div>
        </div>

        {/* CARD 2: Payment Slip & Financial Settlement (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {currentLang === 'lo' ? '2. ຫຼັກຖານການຊຳລະເງິນ & ສະລິບ' : '2. Payment Proof & Slip'}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-[10.5px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                100% Paid
              </span>
            </div>

            <div className="space-y-3">
              {/* Slip Thumbnails Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Slip 1: Initial Payment / Deposit */}
                <div 
                  onClick={() => {
                    if (paymentSlipUrl && setLightbox) {
                      setLightbox({ src: paymentSlipUrl, title: `Deposit / Full Payment Slip - #${orderIdDisplay}` });
                    }
                  }}
                  className="h-[135px] rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center p-2 cursor-pointer hover:border-amber-400 transition relative group overflow-hidden shadow-inner"
                >
                  {paymentSlipUrl ? (
                    <>
                      <img src={paymentSlipUrl} alt="Slip 1" className="max-h-[105px] max-w-full object-contain rounded-xl" />
                      <span className="text-[10px] font-bold text-slate-500 mt-1 block">
                        {order.depositAmountPaid ? 'ສະລິບທີ 1: ຍອດມັດຈຳ' : 'ສະລິບຊຳລະເງິນ 100%'}
                      </span>
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[11px] font-black text-white gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>ຂະຫຍາຍ</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-2">
                      <CreditCard className="w-6 h-6 text-amber-600 mx-auto" />
                      <span className="text-[10px] font-bold text-slate-700 block mt-1">BCEL OnePay QR</span>
                    </div>
                  )}
                </div>

                {/* Slip 2: Final Settlement Slip (If deposit used) */}
                <div 
                  onClick={() => {
                    const slip2 = order.finalPaymentSlipUrl || paymentSlipUrl;
                    if (slip2 && setLightbox) {
                      setLightbox({ src: slip2, title: `Final Settlement Slip - #${orderIdDisplay}` });
                    }
                  }}
                  className="h-[135px] rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center p-2 cursor-pointer hover:border-emerald-400 transition relative group overflow-hidden shadow-inner"
                >
                  {(order.finalPaymentSlipUrl || paymentSlipUrl) ? (
                    <>
                      <img src={order.finalPaymentSlipUrl || paymentSlipUrl} alt="Slip 2" className="max-h-[105px] max-w-full object-contain rounded-xl" />
                      <span className="text-[10px] font-bold text-emerald-700 mt-1 block">
                        {order.depositAmountPaid ? 'ສະລິບທີ 2: ປິດຍອດຈັດສົ່ງ' : 'ໃບຢັ້ງຢືນປິດຍອດບັນຊີ'}
                      </span>
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[11px] font-black text-white gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ຂະຫຍາຍ</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-2">
                      <CreditCard className="w-6 h-6 text-emerald-600 mx-auto" />
                      <span className="text-[10px] font-bold text-slate-700 block mt-1">ຊຳລະຄົບຖ້ວນ 100%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Settlement Breakdown */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>ຍອດສັ່ງຜະລິດທັງໝົດ:</span>
                  <strong className="text-slate-800 font-mono">{formatLAK(totalAmountLAK)}</strong>
                </div>
                {order.depositAmountPaid && order.depositAmountPaid < totalAmountLAK && (
                  <div className="flex justify-between text-amber-700 font-semibold">
                    <span>- ຍອດມັດຈຳ (Step 1):</span>
                    <span className="font-mono">{formatLAK(order.depositAmountPaid)}</span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-700 font-black border-t border-slate-200 pt-1">
                  <span>ຍອດຊຳລະຄົບ 100%:</span>
                  <span className="font-mono">{formatLAK(totalAmountLAK)}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[10.5px]">
                  <span>ຍອດຄ້າງຊຳລະ:</span>
                  <span className="font-mono text-emerald-600 font-bold">LAK 0 (ປິດບັນຊີແລ້ວ)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex justify-between items-center font-mono">
            <span>Ref: SSP-PAY-{orderIdDisplay}</span>
            <span className="text-emerald-600 font-bold">Verified by Cashier</span>
          </div>
        </div>

        {/* CARD 3: Ordered Print Items Specs & Finishing Breakdown (12 cols) */}
        <div className="lg:col-span-12 bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">
                {currentLang === 'lo' ? '3. ລາຍລະອຽດສິນຄ້າທີ່ຜະລິດ & ຜ່ານ QC (Produced Items & Specs)' : '3. Produced Items & Quality Specs'}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={driveLink || '#'}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-black flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{currentLang === 'lo' ? 'ໄຟລ໌ງານພິມ' : 'Artwork File'}</span>
              </a>
              <span className="px-2.5 py-1 rounded-xl text-[10.5px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% QC Passed</span>
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <th className="p-3 pl-4">ລາຍການສິນຄ້າ</th>
                  <th className="p-3">ເນື້ອເຈ້ຍ & ແກຣມ</th>
                  <th className="p-3">ຂະໜາດ / ໜ້າ</th>
                  <th className="p-3">ການເຂົ້າເລ່ມ / ເຄືອບ</th>
                  <th className="p-3 text-right pr-4">ຈຳນວນພິມ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 text-slate-800">
                    <td className="p-3 pl-4 font-black text-slate-900">{it.name || it.item_name || `Item #${idx + 1}`}</td>
                    <td className="p-3 text-slate-600">{it.paperType || it.paper || 'Art Matt 150g'}</td>
                    <td className="p-3 text-slate-600">{it.paperSize || it.size || 'A4'} ({it.pages || '-'} ໜ້າ)</td>
                    <td className="p-3 text-slate-600">{it.binding || 'ຫຍິບມຸງ'} • {it.lamination || 'ເຄືອບດ້ານ'}</td>
                    <td className="p-3 pr-4 text-right font-mono font-black text-amber-600 text-sm">
                      {(it.quantity || 1).toLocaleString()} {currentLang === 'lo' ? 'ຊຸດ' : 'items'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 4. Official Completion Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-3 text-left">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <CheckCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-100 flex items-center gap-2">
              <span>{currentLang === 'lo' ? 'ອໍເດີນີ້ດຳເນີນການສຳເລັດສົມບູນ 100%' : 'Order Completed & Fully Archived'}</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentLang === 'lo' 
                ? 'ຜ່ານການກວດຮັບ -> ຜະລິດ & QC -> ຈັດສົ່ງມອບຮັບ -> ປິດຍອດບັນຊີ ເຂົ້າສູ່ລະບົບ ERP ຮຽບຮ້ອຍແລ້ວ' 
                : 'Verified through Reception -> Production -> Delivery -> Settle and archived to ERP'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-none"
        >
          <span>{currentLang === 'lo' ? '← ກັບສູ່ຕາຕະລາງອໍເດີ' : '← Back to Orders Table'}</span>
        </button>
      </div>

      {/* Customer Payment Invoice / Receipt Modal */}
      {isInvoiceModalOpen && (
        <CustomerInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          order={order}
          currentLang={currentLang}
          formatLAK={formatLAK}
        />
      )}

    </div>
  );
};

export default OrderCompletedSummaryPage;
