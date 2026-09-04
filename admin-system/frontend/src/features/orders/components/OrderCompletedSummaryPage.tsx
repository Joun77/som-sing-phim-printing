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
  Edit3,
  RotateCcw,
  Tag
} from 'lucide-react';
import OrderStepBar from './reception/OrderStepBar';
import CustomerInvoiceModal from './modals/CustomerInvoiceModal';
import OrderIdCopyButton from './common/OrderIdCopyButton';
import { useApp } from '@store/AppContext';

interface OrderCompletedSummaryPageProps {
  order: any;
  onBack: () => void;
  onSelectStep: (step: 1 | 2 | 3 | 4) => void;
  formatLAK: (n: number) => string;
  currentLang: string;
  setLightbox?: (v: { src: string; title: string } | null) => void;
  onEditOrder?: (order: any) => void;
  handleStatusChange?: (orderId: any, status: string) => void;
  askConfirmation?: (msg: string, onConfirm: () => void) => void;
  onUpdateOrder?: (order: any) => void;
  showToast?: (msg: string, type?: string) => void;
}

export const OrderCompletedSummaryPage: React.FC<OrderCompletedSummaryPageProps> = ({
  order,
  onBack,
  onSelectStep,
  formatLAK,
  currentLang,
  setLightbox,
  onEditOrder,
  handleStatusChange,
  askConfirmation,
  onUpdateOrder,
  showToast,
}) => {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const { customerCategories = [], customers = [] } = useApp();

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

  const village = order.village || '';
  const district = order.district || '';
  const province = order.province || '';

  const customerTier = order.customerTier || order.customer_tier || order.tier || 
    customers.find(c => (order.customerId && c.id === order.customerId) || c.name === customerName)?.tier || 'RETAIL';
  const categoryObj = customerCategories.find((c: any) => c.id === customerTier);
  const categoryLabel = categoryObj ? categoryObj.name : customerTier;

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
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl text-xs sm:text-sm font-black transition active:scale-95 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>{currentLang === 'lo' ? 'ກັບຄືນ' : 'Back'}</span>
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase">
              <OrderIdCopyButton orderId={orderIdDisplay} showHash={true} />
              <span>•</span>
              <span className="text-emerald-700 font-bold">Step 4: Full Order Summary</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
              {currentLang === 'lo' ? 'ສະຫຼຸບຂໍ້ມູນອໍເດີສຳເລັດສົມບູນ (Order Completion Summary)' : 'Order Completion & Archive Summary'}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badge (Pill with soft border) */}
          <div className="px-3 py-1 rounded-full text-[11px] font-bold border uppercase bg-emerald-50/90 text-emerald-800 border-emerald-300/80 flex items-center gap-1.5 select-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{currentLang === 'lo' ? 'ສຳເລັດສົມບູນ' : 'Completed'}</span>
          </div>

          {/* Vertical Divider */}
          <div className="hidden sm:block w-px h-6 bg-slate-200" />

          {/* Action Buttons (Elevated Clickable) */}
          <div className="flex items-center gap-2">
            {handleStatusChange && (
              <button
                type="button"
                onClick={() => {
                  const doRevert = () => {
                    handleStatusChange(order.id, 'Dispatched');
                    if (order) {
                      order.status = 'Dispatched';
                      order.isCustomerReceived = false;
                    }
                    if (onUpdateOrder) {
                      onUpdateOrder({ ...order, status: 'Dispatched', isCustomerReceived: false });
                    }
                    if (showToast) {
                      showToast(currentLang === 'lo' ? 'ຍ້ອນສະຖານະກັບມາຂັ້ນຕອນການຈັດສົ່ງ (In-Transit) ແລ້ວ' : 'Reverted to In-Transit delivery', 'info');
                    }
                    onSelectStep(3);
                  };

                  if (askConfirmation) {
                    askConfirmation(
                      currentLang === 'lo'
                        ? 'ທ່ານຕ້ອງການຍ້ອນສະຖານະອໍເດີນີ້ກັບໄປຂັ້ນຕອນການຈັດສົ່ງ (Step 3) ແທ້ ຫຼື ບໍ່?'
                        : 'Revert this order back to delivery handover stage (Step 3)?',
                      doRevert
                    );
                  } else {
                    doRevert();
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-black rounded-xl text-xs transition border border-amber-300 active:scale-95 cursor-pointer shadow-xs"
                title={currentLang === 'lo' ? 'ຍ້ອນສະຖານະກັບສູ່ຂັ້ນຕອນການຈັດສົ່ງ' : 'Revert to Delivery'}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>{currentLang === 'lo' ? 'ຍ້ອນສະຖານະ (Step 3)' : 'Revert to Step 3'}</span>
              </button>
            )}

            {onEditOrder && (
              <button
                type="button"
                onClick={() => onEditOrder(order)}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-xl text-xs transition-all duration-150 shadow-sm shadow-sky-500/25 active:scale-95 cursor-pointer border-none"
                title={currentLang === 'lo' ? 'ແກ້ໄຂອໍເດີ & ສະເປກ' : 'Edit Order Specs & Details'}
              >
                <Edit3 className="w-3.5 h-3.5 text-white" />
                <span>{currentLang === 'lo' ? 'ແກ້ໄຂອໍເດີ' : 'Edit Order'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsInvoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs transition-all duration-150 shadow-sm shadow-blue-600/25 active:scale-95 cursor-pointer border-none"
              title={currentLang === 'lo' ? 'ໃບບິນລູກຄ້າ (Invoice / Receipt)' : 'Customer Invoice / Receipt'}
            >
              <CreditCard className="w-3.5 h-3.5 text-white" />
              <span>{currentLang === 'lo' ? 'ໃບບິນລູກຄ້າ' : 'Customer Invoice'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                window.print();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-xl text-xs transition-all duration-150 border border-sky-200 active:scale-95 cursor-pointer shadow-xs"
              title={currentLang === 'lo' ? 'ພິມໃບສະຫຼຸບອໍເດີ' : 'Print Completion Summary'}
            >
              <Printer className="w-3.5 h-3.5 text-sky-600" />
              <span>{currentLang === 'lo' ? 'ພິມໜ້າສະຫຼຸບ' : 'Print Summary'}</span>
            </button>
          </div>
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
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <strong className="text-slate-900 text-sm">{customerName}</strong>
                    {categoryLabel && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
                        {categoryLabel}
                      </span>
                    )}
                  </div>
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
                  <div className="space-y-1 w-full">
                    <span className="text-slate-400 block text-[10.5px] font-bold">{currentLang === 'lo' ? 'ສະຖານທີ່ຈັດສົ່ງ:' : 'Delivery Address:'}</span>
                    {(village || district || province) ? (
                      <div className="flex flex-wrap gap-1.5 text-[11px] font-bold text-slate-700">
                        {village && <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">ບ້ານ: {village}</span>}
                        {district && <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">ເມືອງ: {district}</span>}
                        {province && <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">ແຂວງ: {province.replace('ແຂວງ', '').replace('ນະຄອນຫຼວງ', '').trim()}</span>}
                      </div>
                    ) : null}
                    {deliveryAddress && (
                      <span className="text-slate-700 font-medium block pt-0.5 leading-relaxed">{deliveryAddress}</span>
                    )}
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

        {/* CARD 2: Redesigned Verified Payment Card (Task 4.3) (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {currentLang === 'lo' ? '2. ຫຼັກຖານການຊຳລະເງິນ & ປິດຍອດ (Payment Proof)' : '2. Verified Payment Settlement'}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-xl text-xs font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span>ຊຳລະຄົບຖ້ວນ 100% (100% PAID)</span>
              </span>
            </div>

            {/* Unified Verified Payment Container */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* Left Section: Method, Slip Thumbnail & Cashier Verification */}
              <div className="sm:col-span-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {currentLang === 'lo' ? 'ຊ່ອງທາງຊຳລະເງິນ' : 'Payment Method'}
                  </span>
                  <div className="flex items-center gap-1.5 font-black text-slate-800 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>BCEL OnePay (QR Code)</span>
                  </div>
                </div>

                {/* Slip Preview */}
                <div 
                  onClick={() => {
                    if (paymentSlipUrl && setLightbox) {
                      setLightbox({ src: paymentSlipUrl, title: `Verified Payment Slip - #${orderIdDisplay}` });
                    }
                  }}
                  className="h-28 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center p-2 cursor-pointer hover:border-emerald-500 transition relative group overflow-hidden shadow-2xs"
                >
                  {paymentSlipUrl ? (
                    <>
                      <img src={paymentSlipUrl} alt="Slip" className="max-h-24 max-w-full object-contain rounded-lg" />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10.5px] font-black text-white gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>ກົດເພື່ອຂະຫຍາຍສະລິບ</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-2">
                      <CreditCard className="w-8 h-8 text-emerald-600 mx-auto opacity-80" />
                      <span className="text-[10.5px] font-bold text-slate-700 block mt-1">OnePay Slip Verified</span>
                    </div>
                  )}
                </div>

                <div className="space-y-0.5 text-[10.5px] pt-1 border-t border-slate-200">
                  <div className="font-mono text-slate-500 truncate">
                    Ref: <strong className="text-slate-700">SSP-PAY-{orderIdDisplay}</strong>
                  </div>
                  <div className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Verified by Cashier (Som-Sing Printing)</span>
                  </div>
                </div>
              </div>

              {/* Right Section: Financial Settlement Figures */}
              <div className="sm:col-span-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {currentLang === 'lo' ? 'ສະຖານະບັນຊີ & ຍອດເງິນ' : 'Settlement Details'}
                </span>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">ຍອດສັ່ງຜະລິດ:</span>
                    <strong className="text-slate-800 font-mono">{formatLAK(totalAmountLAK)}</strong>
                  </div>

                  {order.depositAmountPaid && order.depositAmountPaid < totalAmountLAK && (
                    <div className="flex justify-between items-center text-xs text-amber-700 font-semibold">
                      <span>- ຍອດມັດຈຳ (Deposit):</span>
                      <span className="font-mono">{formatLAK(order.depositAmountPaid)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-emerald-800 font-black border-t border-slate-200 pt-2">
                    <span>ຍອດຊຳລະແລ້ວ:</span>
                    <span className="font-mono text-sm">{formatLAK(totalAmountLAK)}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-200 text-center">
                    <span className="text-[10.5px] text-emerald-800 font-bold block">ຍອດຄ້າງຊຳລະ (Remaining)</span>
                    <span className="font-mono text-sm font-black text-emerald-950 block">LAK 0.00 (ປິດອໍເດີແລ້ວ)</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-center font-mono">
                  Settled on {orderDate}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex justify-between items-center font-mono">
            <span>Ref: SSP-PAY-{orderIdDisplay}</span>
            <span className="text-emerald-700 font-black">ບັນຊີປິດຍອດສົມບູນ</span>
          </div>
        </div>

        {/* CARD 3: Commercial Summary Table for Produced Items (Task 4.4) (12 cols) */}
        <div className="lg:col-span-12 bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">
                {currentLang === 'lo' ? '3. ລາຍລະອຽດສິນຄ້າທີ່ຜະລິດ & ຜ່ານ QC (Commercial Summary)' : '3. Commercial Billing & QC Summary'}
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

          {/* Clean Commercial Billing Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-black border-b border-slate-200">
                  <th className="p-3.5 pl-4 w-12 text-center">ລຳດັບ</th>
                  <th className="p-3.5">ລາຍການສິນຄ້າ / ຊ້ອງານພິມ (Item Description)</th>
                  <th className="p-3.5 text-center">ຈຳນວນສັ່ງພິມ (Quantity)</th>
                  <th className="p-3.5 text-right">ລາຄາຕໍ່ໜ່ວຍ (Unit Price)</th>
                  <th className="p-3.5 text-right pr-4">ມູນຄ່າລວມ (Total Price LAK)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it: any, idx: number) => {
                  const qty = it.quantity || it.qty || 1;
                  const itemTotal = Number(it.subtotal || it.total || it.item_total || (totalAmountLAK / (items.length || 1)));
                  const unitPrice = qty > 0 ? Math.round(itemTotal / qty) : itemTotal;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/60 text-slate-800 transition">
                      <td className="p-3.5 pl-4 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-slate-900">
                        <span>{it.name || it.item_name || `ລາຍການສັ່ງພິມ #${idx + 1}`}</span>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                        {qty.toLocaleString()} {currentLang === 'lo' ? 'ຊຸດ/ຫົວ' : 'pcs'}
                      </td>
                      <td className="p-3.5 text-right font-mono font-semibold text-slate-600">
                        {formatLAK(unitPrice)}
                      </td>
                      <td className="p-3.5 pr-4 text-right font-mono font-black text-slate-900 text-sm">
                        {formatLAK(itemTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50/70 font-semibold text-xs text-slate-700">
                <tr>
                  <td colSpan={4} className="p-3 pl-4 text-right text-slate-500">
                    ຄ່າພິມລວມ (Subtotal):
                  </td>
                  <td className="p-3 pr-4 text-right font-mono font-bold text-slate-800">
                    {formatLAK(totalAmountLAK)}
                  </td>
                </tr>
                {order.shippingCost && Number(order.shippingCost) > 0 && (
                  <tr>
                    <td colSpan={4} className="p-2 pl-4 text-right text-slate-500">
                      ຄ່າຈັດສົ່ງ (Shipping Fee):
                    </td>
                    <td className="p-2 pr-4 text-right font-mono font-bold text-slate-800">
                      {formatLAK(Number(order.shippingCost))}
                    </td>
                  </tr>
                )}
                {order.discount && Number(order.discount) > 0 && (
                  <tr>
                    <td colSpan={4} className="p-2 pl-4 text-right text-red-500">
                      ສ່ວນຫຼຸດ (Discount):
                    </td>
                    <td className="p-2 pr-4 text-right font-mono font-bold text-red-600">
                      -{formatLAK(Number(order.discount))}
                    </td>
                  </tr>
                )}
                <tr className="bg-emerald-50/60 border-t border-emerald-200 text-emerald-950 font-black">
                  <td colSpan={4} className="p-3.5 pl-4 text-right text-sm">
                    ຍອດລວມສຸດທິທັງໝົດ (GRAND TOTAL):
                  </td>
                  <td className="p-3.5 pr-4 text-right font-mono text-base text-emerald-700 font-black">
                    {formatLAK(totalAmountLAK)}
                  </td>
                </tr>
              </tfoot>
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
