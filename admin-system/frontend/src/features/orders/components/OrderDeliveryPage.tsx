import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Truck, 
  DollarSign, 
  User, 
  Phone, 
  MapPin, 
  PackageCheck, 
  Printer,
  Sparkles,
  AlertTriangle,
  CreditCard,
  Box,
  Send,
  Lock,
  Clock,
  ArrowRight,
  Camera,
  Image as ImageIcon,
  Settings,
  Plus,
  Edit3
} from 'lucide-react';
import { useApp } from '@store/AppContext';
import { CourierManagementModal } from './CourierManagementModal';
import CustomerInvoiceModal from './modals/CustomerInvoiceModal';
import OrderStepBar from './reception/OrderStepBar';

interface OrderDeliveryPageProps {
  order: any;
  onBack: () => void;
  onSelectStep: (step: 1 | 2 | 3 | 4) => void;
  formatLAK: (n: number) => string;
  currentLang: string;
  handleStatusChange: (orderId: any, status: string) => void;
  onUpdatePayment?: (orderId: any, paymentStatus: string, depositAmount?: number, remainingBalance?: number) => void;
  showToast: (msg: string, type?: string) => void;
  setLightbox?: (v: { src: string; title: string } | null) => void;
  onEditOrder?: (order: any) => void;
}

export const OrderDeliveryPage: React.FC<OrderDeliveryPageProps> = ({
  order,
  onBack,
  onSelectStep,
  formatLAK,
  currentLang,
  handleStatusChange,
  onUpdatePayment,
  showToast,
  setLightbox,
  onEditOrder,
}) => {
  if (!order) return null;

  const orderIdDisplay = order.orderNo || order.order_no || order.orderNumber || order.id || 'ORDER';
  const customerName = order.customerName || order.customer_name || 'Somphavath DOUANGSVA';
  const customerPhone = order.phone || order.customer_phone || '02058866339';
  const deliveryAddress = order.address || order.delivery_address || 'Saysettha, Vientiane';
  const totalAmountLAK = Number(order.totalPriceCharged || order.totalAmount || order.total_amount_lak || 86250);

  const { couriers, updateOrderTracking, addDelivery } = useApp();
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const [courier, setCourier] = useState(order.deliveryMethod || 'Anousith Express');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [shippingFee, setShippingFee] = useState<number>(order.shippingFee || 15000);
  const [courierProofImage, setCourierProofImage] = useState<string | null>(
    order.courierProofUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600'
  );

  // Strict Sequential Delivery Lifecycle States (Default to NOT completed unless explicitly done)
  const [isPacked, setIsPacked] = useState<boolean>(
    Boolean(order.isPacked === true || order.packing_status === 'PACKED')
  );
  const [isDispatched, setIsDispatched] = useState<boolean>(
    Boolean(order.isDispatched === true || order.dispatch_status === 'DISPATCHED')
  );
  const [isDelivered, setIsDelivered] = useState<boolean>(
    Boolean(order.isCustomerReceived === true)
  );

  // Payment Settlement State
  const initialRemaining = order.remainingUnpaidBalance !== undefined 
    ? order.remainingUnpaidBalance 
    : (order.paymentStatus === 'Deposit' ? Math.round(totalAmountLAK / 2) : 0);
  
  const [remainingBalance, setRemainingBalance] = useState(initialRemaining);
  const [finalSettled, setFinalSettled] = useState(
    order.paymentStatus === 'Paid' || order.paymentStatus === 'PAID' || initialRemaining === 0
  );
  const [settleMethod, setSettleMethod] = useState('BCEL One');

  const isPaymentConfirmed = true;
  const isArtworkApproved = true;
  const isProductionFinished = true;

  // 1. Action: Confirm Packaging
  const handleTogglePack = () => {
    const next = !isPacked;
    setIsPacked(next);
    if (!next) {
      setIsDispatched(false);
      setIsDelivered(false);
    }
    if (order) order.isPacked = next;
    showToast(next ? 'ແພັກກິ້ງສິນຄ້າຮຽບຮ້ອຍແລ້ວ! ປົດລັອກຂັ້ນຕອນມອບໃຫ້ຂົນສົ່ງ' : 'Reverted packaging status', 'info');
  };

  // 2. Action: Handed to Courier & Save Proof
  const handleConfirmDispatched = () => {
    if (!isPacked) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາກວດສອບແລະຢືນຢັນການແພັກສິນຄ້າກ່ອນ' : 'Please complete packaging first', 'warning');
      return;
    }
    if (!trackingNumber && courier !== 'ຮັບເອງທີ່ຮ້ານ') {
      showToast(currentLang === 'lo' ? 'ກະລຸນາໃສ່ເລກຕິດຕາມພັດສະດຸ (Tracking No.)' : 'Please enter tracking number', 'warning');
      return;
    }
    setIsDispatched(true);
    handleStatusChange(order.id, 'Dispatched');

    if (updateOrderTracking) {
      updateOrderTracking(order.id, courier, trackingNumber, shippingFee);
    }
    if (addDelivery) {
      addDelivery({
        orderId: order.id,
        orderNumber: orderIdDisplay,
        customerName: customerName,
        courierId: courier,
        courierName: courier,
        trackingCode: trackingNumber,
        shippingFeeLAK: shippingFee,
        status: 'IN_TRANSIT',
        dispatchedAt: new Date().toISOString(),
        podImageUrl: courierProofImage || ''
      });
    }

    if (order) {
      order.status = 'Dispatched';
      order.isDispatched = true;
      order.isPacked = true;
      order.deliveryMethod = courier;
      order.trackingNumber = trackingNumber;
      order.shippingFee = shippingFee;
      order.courierProofUrl = courierProofImage;
    }
    showToast(
      currentLang === 'lo' 
        ? 'ບັນທຶກຫຼັກຖານ & ມອບໃຫ້ຂົນສົ່ງແລ້ວ! (ສະຖານະ: ກຳລັງຈັດສົ່ງ)' 
        : 'Dispatched to courier with proof recorded!', 
      'success'
    );
  };

  const handleSettleRemaining = () => {
    setFinalSettled(true);
    setRemainingBalance(0);
    if (onUpdatePayment) {
      onUpdatePayment(order.id, 'Paid', totalAmountLAK, 0);
    }
    if (order) {
      order.paymentStatus = 'Paid';
      order.remainingUnpaidBalance = 0;
    }
    showToast(
      currentLang === 'lo' 
        ? 'ຢືນຢັນຮັບຊຳລະຍອດທີ່ເຫຼືອຄົບ 100% ແລ້ວ!' 
        : 'Final balance settled successfully!', 
      'success'
    );
  };

  // 3. Action: Customer Received -> Step 4
  const handleConfirmCustomerReceived = () => {
    if (!isDispatched) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາກົດມອບໃຫ້ຂົນສົ່ງກ່ອນ' : 'Order must be dispatched first', 'warning');
      return;
    }
    if (!finalSettled && remainingBalance > 0) {
      showToast(
        currentLang === 'lo' 
          ? 'ກະລຸນາປິດຍອດເງິນທີ່ຄ້າງຊຳລະກ່ອນຢືນຢັນສຳເລັດ' 
          : 'Please settle remaining balance before completing', 
        'warning'
      );
      return;
    }

    setIsDelivered(true);
    handleStatusChange(order.id, 'Delivered');
    if (order) {
      order.status = 'Delivered';
      order.deliveryMethod = courier;
      order.trackingNumber = trackingNumber;
    }
    showToast(
      currentLang === 'lo' 
        ? 'ລູກຄ້າໄດ້ຮັບສິນຄ້າແລ້ວ! ນຳທາງສູ່ໜ້າສະຫຼຸບອໍເດີ (Step 4)' 
        : 'Customer received confirmed! Advancing to Step 4 Summary', 
      'success'
    );
    setTimeout(() => {
      onSelectStep(4);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in font-sans">
      
      {/* 1. Header Navigation */}
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
              <span className="text-sky-700 font-bold">Step 3: Fulfillment & Logistics</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
              {currentLang === 'lo' ? 'ຂັ້ນຕອນການແພັກກິ້ງ, ຈັດສົ່ງ & ມອບຮັບສິນຄ້າ' : 'Step 3: Packaging, Dispatch & Handover'}
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
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-2xl text-xs font-black transition active:scale-95 cursor-pointer shadow-2xs"
            title="Customer Payment Invoice / Receipt"
          >
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            <span>{currentLang === 'lo' ? 'ໃບບິນລູກຄ້າ' : 'Invoice'}</span>
          </button>

          <span className={`px-3.5 py-1.5 rounded-2xl text-xs font-black border uppercase flex items-center gap-1.5 shadow-xs ${
            isDelivered 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : isDispatched
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : isPacked
              ? 'bg-sky-50 text-sky-700 border-sky-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            <Truck className="w-4 h-4" />
            <span>
              {isDelivered 
                ? (currentLang === 'lo' ? 'ລູກຄ້າໄດ້ຮັບແລ້ວ (Delivered)' : 'Delivered') 
                : isDispatched 
                ? (currentLang === 'lo' ? 'ກຳລັງຈັດສົ່ງ (In Transit)' : 'In Transit')
                : isPacked
                ? (currentLang === 'lo' ? 'ແພັກແລ້ວ (ລໍຖ້າສົ່ງ)' : 'Packed / Ready')
                : (currentLang === 'lo' ? 'ລໍຖ້າແພັກກິ້ງ (Pending)' : 'Pending Packaging')}
            </span>
          </span>
        </div>
      </div>

      {/* 2. Interactive StepBar */}
      <OrderStepBar
        currentStep={3}
        onSelectStep={onSelectStep}
        isPaymentConfirmed={isPaymentConfirmed}
        isArtworkApproved={isArtworkApproved}
        isProductionFinished={isProductionFinished}
        isDelivered={isDelivered}
        currentLang={currentLang}
      />

      {/* 3. Main 2-Column Packaging, Courier Handover & Settlement Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Stage 1 Packaging + Stage 2 Courier Handover & Proof (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {currentLang === 'lo' ? '1. ແພັກກິ້ງ & ຫຼັກຖານມອບໃຫ້ຂົນສົ່ງ' : '1. Packaging & Dispatch Proof'}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-[10.5px] font-black uppercase bg-sky-50 text-sky-700 border border-sky-200">
                Logistics
              </span>
            </div>

            {/* Customer Delivery Details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-sm">{customerName}</span>
                <span className="text-slate-400">•</span>
                <a href={`tel:${customerPhone}`} className="text-blue-600 font-mono hover:underline">
                  {customerPhone}
                </a>
              </div>
              <div className="flex items-start gap-2 text-slate-600 pt-1">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{deliveryAddress}</span>
              </div>
            </div>

            {/* Stage 3.1: Packaging Checkbox */}
            <div className={`p-4 rounded-2xl border transition ${
              isPacked ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
            } flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${
                  isPacked ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
                }`}>
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-xs text-slate-900">3.1 ກວດສອບການແພັກສິນຄ້າ (Packaging)</strong>
                  <span className="text-[11px] text-slate-500 font-medium">ຫຸ້ມຫໍ່ກ່ອງພັດສະດຸ, ຕິດສະຕິກເກີລະວັງແຕກ & ໃບປິວ</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTogglePack}
                className={`px-4 py-2 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer ${
                  isPacked 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm shadow-amber-500/20'
                }`}
              >
                {isPacked ? 'ແພັກສຳເລັດແລ້ວ' : 'ກົດຢືນຢັນແພັກ'}
              </button>
            </div>

            {/* Stage 3.2: Courier Details & Handover Proof (Active after Packed) */}
            <div className={`space-y-3.5 transition ${isPacked ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-black text-slate-700 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <span>ເລືອກບໍລິສັດຂົນສົ່ງ:</span>
                    {!isPacked && <span className="text-red-500 text-[10px] lowercase">(ລໍຖ້າແພັກກ່ອນ)</span>}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCourierModalOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-black text-sky-600 hover:text-sky-800 hover:bg-sky-50 px-2.5 py-1 rounded-xl transition border border-sky-200 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{currentLang === 'lo' ? '+ ເພີ່ມ / ຈັດການຂົນສົ່ງ' : '+ Manage Couriers'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(couriers && couriers.length > 0 ? couriers : [
                    { id: 'anousith', name: 'Anousith Express', shortName: 'Anousith', fee: 15000 },
                    { id: 'hal', name: 'HAL Logistics', shortName: 'HAL', fee: 20000 },
                    { id: 'mixay', name: 'Mixay Express', shortName: 'Mixay', fee: 15000 },
                    { id: 'self', name: 'ຮັບເອງທີ່ຮ້ານ', shortName: 'Self Pickup', fee: 0 },
                  ]).map((c: any) => {
                    const cName = c.shortName || c.name;
                    const isSelected = courier === c.name || courier === cName || courier === c.id;
                    return (
                      <button
                        key={c.id || cName}
                        type="button"
                        onClick={() => {
                          setCourier(c.name || cName);
                          if (c.fee !== undefined && !shippingFee) {
                            setShippingFee(c.fee);
                          }
                        }}
                        className={`p-2 rounded-2xl border font-bold text-xs transition active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1.5 text-center relative overflow-hidden ${
                          isSelected
                            ? 'bg-sky-500 text-white border-sky-500 shadow-sm font-black'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {c.logoUrl ? (
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center p-0.5 overflow-hidden ${isSelected ? 'bg-white/20' : 'bg-white border border-slate-200'}`}>
                            <img src={c.logoUrl} alt={cName} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-slate-200'}`}>
                            <Truck className="w-4 h-4" />
                          </div>
                        )}
                        <span className="truncate max-w-full text-[11px] leading-tight">{cName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 mb-1 uppercase text-[10.5px]">
                    {currentLang === 'lo' ? 'ເລກຕິດຕາມພັດສະດຸ (Tracking No.):' : 'Tracking Number:'}
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Ex: ANO-8899201948LA"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:border-sky-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 mb-1 uppercase text-[10.5px]">
                    {currentLang === 'lo' ? 'ຄ່າຈັດສົ່ງ (Shipping Fee):' : 'Shipping Fee (LAK):'}
                  </label>
                  <input
                    type="number"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:border-sky-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Courier Handover Proof Photo Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-sky-600" />
                    <span>ຫຼັກຖານການມອບໃຫ້ຂົນສົ່ງ (Courier Slip / Photo)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">JPG, PNG</span>
                </div>

                <div 
                  onClick={() => {
                    if (courierProofImage && setLightbox) {
                      setLightbox({ src: courierProofImage, title: `Courier Proof - #${orderIdDisplay}` });
                    }
                  }}
                  className="w-full h-24 rounded-xl bg-white border border-dashed border-slate-300 hover:border-sky-400 transition flex items-center justify-center cursor-pointer relative group overflow-hidden"
                >
                  {courierProofImage ? (
                    <>
                      <img src={courierProofImage} alt="Courier Proof" className="max-h-20 max-w-full object-contain rounded-lg shadow-xs" />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold text-white gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                        <span>ຄລິກເພື່ອເບິ່ງຮູບເຕັມ</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                      <span>ອັບໂຫຼດຮູບຖ່າຍຕອນມອບໃຫ້ຂົນສົ່ງ</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action: Dispatch Confirmation Button */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={() => {
                showToast(currentLang === 'lo' ? 'ພິມໃບສົ່ງເຄື່ອງສຳເລັດ!' : 'Printed delivery note', 'info');
                window.print();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>{currentLang === 'lo' ? 'ພິມໃບນຳສົ່ງສິນຄ້າ (Delivery Note)' : 'Print Delivery Note'}</span>
            </button>

            {isDispatched ? (
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-black flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>{currentLang === 'lo' ? 'ມອບໃຫ້ຂົນສົ່ງຮຽບຮ້ອຍແລ້ວ (ກຳລັງນຳສົ່ງຮອດລູກຄ້າ)' : 'Dispatched / In Transit'}</span>
              </div>
            ) : (
              <button
                type="button"
                disabled={!isPacked}
                onClick={handleConfirmDispatched}
                className={`w-full py-3.5 px-4 rounded-2xl text-xs font-black transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-none ${
                  isPacked 
                    ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{currentLang === 'lo' ? '3.2 ຢືນຢັນມອບໃຫ້ຂົນສົ່ງແລ້ວ (Mark Dispatched)' : 'Confirm Handed to Courier'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Financial Clearance & Final Handover (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {currentLang === 'lo' ? '2. ປິດຍອດເງິນ & ມອບຮັບສິນຄ້າ' : '2. Financial Clearance & Handover'}
                </h3>
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-[10.5px] font-black uppercase border ${
                finalSettled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
              }`}>
                {finalSettled ? '100% Paid' : 'Pending Settlement'}
              </span>
            </div>

            {/* Financial Ledger Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs mb-4">
              <div className="flex justify-between text-slate-500 font-semibold">
                <span>{currentLang === 'lo' ? 'ມູນຄ່າສັ່ງຜະລິດທັງໝົດ:' : 'Total Order Value:'}</span>
                <span className="font-mono font-bold text-slate-800">{formatLAK(totalAmountLAK)}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-semibold">
                <span>{currentLang === 'lo' ? 'ຍອດຊຳລະແລ້ວ (ມັດຈຳ/ເຕັມ):' : 'Amount Received:'}</span>
                <span className="font-mono font-bold text-emerald-600">
                  {formatLAK(finalSettled ? totalAmountLAK : totalAmountLAK - remainingBalance)}
                </span>
              </div>
              <div className="flex justify-between text-slate-900 font-black border-t border-slate-200 pt-2 text-sm">
                <span>{currentLang === 'lo' ? 'ຍອດຄ້າງຊຳລະປັດຈຸບັນ:' : 'Remaining Balance:'}</span>
                <span className={`font-mono ${remainingBalance > 0 ? 'text-red-600 font-black' : 'text-emerald-600 font-bold'}`}>
                  {formatLAK(remainingBalance)}
                </span>
              </div>
            </div>

            {/* If NOT fully settled: Show Settlement Input Box */}
            {!finalSettled && remainingBalance > 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-black">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>ອໍເດີນີ້ຕິດຍອດມັດຈຳ (ຕ້ອງປິດຍອດກ່ອນສົ່ງມອບ)</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {['BCEL One QR', 'ເງິນສົດ (Cash)'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSettleMethod(m)}
                      className={`p-2 rounded-xl border text-xs font-bold transition ${
                        settleMethod === m ? 'bg-amber-500 text-slate-950 border-amber-500 font-black' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSettleRemaining}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-none"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{currentLang === 'lo' ? `ຢືນຢັນຮັບຊຳລະຍອດທີ່ເຫຼືອ (${formatLAK(remainingBalance)})` : 'Settle Full Balance'}</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <span className="font-black flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{currentLang === 'lo' ? 'ການເງິນຄົບ 100% ແລ້ວ' : 'Financial Settlement Cleared'}</span>
                </span>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  {currentLang === 'lo' 
                    ? 'ຍອດເງິນຊຳລະຄົບ 100% ຮຽບຮ້ອຍແລ້ວ. ເມື່ອຂົນສົ່ງສົ່ງຮອດມືລູກຄ້າ ໃຫ້ກົດຢືນຢັນເພື່ອປິດອໍເດີ.' 
                    : 'Payment 100% cleared. Once customer receives the items, click confirm to advance.'}
                </p>
              </div>
            )}
          </div>

          {/* Action 3: Customer Received Confirmation (Gateway to Step 4) */}
          <div className="pt-3 border-t border-slate-100">
            {isDelivered ? (
              <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black flex items-center justify-center gap-2 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span>{currentLang === 'lo' ? 'ລູກຄ້າໄດ້ຮັບສິນຄ້າແລ້ວ (ອໍເດີສຳເລັດ)' : 'Delivered & Completed'}</span>
              </div>
            ) : !isDispatched ? (
              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold text-center flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{currentLang === 'lo' ? 'ລໍຖ້າແພັກ & ມອບໃຫ້ຂົນສົ່ງ (3.2) ກ່ອນຢືນຢັນລູກຄ້າໄດ້ຮັບ' : 'Pending packaging & dispatch'}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConfirmCustomerReceived}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-black shadow-lg shadow-emerald-600/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2.5 border-none animate-pulse"
              >
                <PackageCheck className="w-5 h-5" />
                <span>{currentLang === 'lo' ? '3.3 ຢືນຢັນລູກຄ້າໄດ້ຮັບສິນຄ້າແລ້ວ (Step 4)' : 'Confirm Customer Received (Step 4)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Courier Management Modal */}
      <CourierManagementModal
        isOpen={isCourierModalOpen}
        onClose={() => setIsCourierModalOpen(false)}
        onSelectCourier={(cName) => setCourier(cName)}
        currentLang={currentLang}
      />

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

export default OrderDeliveryPage;
