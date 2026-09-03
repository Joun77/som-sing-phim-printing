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
  Edit3,
  RotateCcw,
  Save,
  Tag
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
  askConfirmation?: (msg: string, onConfirm: () => void) => void;
  onUpdateOrder?: (order: any) => void;
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
  askConfirmation,
  onUpdateOrder,
}) => {
  if (!order) return null;

  const orderIdDisplay = order.orderNo || order.order_no || order.orderNumber || order.id || 'ORDER';
  const customerName = order.customerName || order.customer_name || 'Somphavath DOUANGSVA';
  const customerPhone = order.phone || order.customer_phone || '02058866339';
  const deliveryAddress = order.address || order.delivery_address || 'Saysettha, Vientiane';
  const totalAmountLAK = Number(order.totalPriceCharged || order.totalAmount || order.total_amount_lak || 86250);

  const village = order.village || '';
  const district = order.district || '';
  const province = order.province || '';

  const { couriers = [], customerCategories = [], customers = [], updateOrderTracking, addDelivery } = useApp();

  const customerTier = order.customerTier || order.customer_tier || order.tier || 
    customers.find(c => (order.customerId && c.id === order.customerId) || c.name === customerName)?.tier || 'RETAIL';
  const categoryObj = customerCategories.find((c: any) => c.id === customerTier);
  const categoryLabel = categoryObj ? categoryObj.name : customerTier;

  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);

  const [courier, setCourier] = useState(order.deliveryMethod || 'Anousith Express');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [shippingFee, setShippingFee] = useState<number>(order.shippingFee || 15000);
  const [enableProofImage, setEnableProofImage] = useState<boolean>(Boolean(order.courierProofUrl));
  const [courierProofImage, setCourierProofImage] = useState<string | null>(
    order.courierProofUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600'
  );

  // Strict Sequential Delivery Lifecycle States
  const [isPacked, setIsPacked] = useState<boolean>(
    Boolean(order.isPacked === true || order.packing_status === 'PACKED')
  );
  const [isDispatched, setIsDispatched] = useState<boolean>(
    Boolean(order.isDispatched === true || order.dispatch_status === 'DISPATCHED')
  );
  const [isDelivered, setIsDelivered] = useState<boolean>(
    Boolean(order.isCustomerReceived === true || order.status === 'Delivered' || order.status === 'COMPLETED')
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
      order.isCustomerReceived = true;
      order.deliveryMethod = courier;
      order.trackingNumber = trackingNumber;
    }
    if (onUpdateOrder) {
      onUpdateOrder({ ...order, status: 'Delivered', isCustomerReceived: true, deliveryMethod: courier, trackingNumber });
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

  // 4. Action: Save Delivery Updates (In-Place Edit)
  const handleSaveDeliveryUpdates = () => {
    if (updateOrderTracking) {
      updateOrderTracking(order.id, courier, trackingNumber, shippingFee);
    }
    if (order) {
      order.deliveryMethod = courier;
      order.trackingNumber = trackingNumber;
      order.shippingFee = shippingFee;
      if (enableProofImage) {
        order.courierProofUrl = courierProofImage;
      }
    }
    if (onUpdateOrder) {
      onUpdateOrder({ 
        ...order, 
        deliveryMethod: courier, 
        trackingNumber, 
        shippingFee, 
        courierProofUrl: enableProofImage ? courierProofImage : null 
      });
    }
    setIsEditingDelivery(false);
    showToast(currentLang === 'lo' ? 'ບັນທຶກການແກ້ໄຂຂໍ້ມູນຈັດສົ່ງສຳເລັດ!' : 'Delivery info updated!', 'success');
  };

  // 5. Action: Revert to Dispatched / In-Transit Status
  const handleRevertToDispatched = () => {
    const doRevert = () => {
      setIsDelivered(false);
      handleStatusChange(order.id, 'Dispatched');
      if (order) {
        order.status = 'Dispatched';
        order.isCustomerReceived = false;
      }
      if (onUpdateOrder) {
        onUpdateOrder({ ...order, status: 'Dispatched', isCustomerReceived: false });
      }
      showToast(
        currentLang === 'lo' 
          ? 'ຍ້ອນສະຖານະກັບມາຂັ້ນຕອນການຈັດສົ່ງ (In-Transit) ສຳເລັດ!' 
          : 'Reverted status to In-Transit delivery!', 
        'info'
      );
    };

    if (askConfirmation) {
      askConfirmation(
        currentLang === 'lo'
          ? 'ທ່ານຕ້ອງການຍ້ອນສະຖານະອໍເດີນີ້ກັບໄປຂັ້ນຕອນການຈັດສົ່ງແທ້ ຫຼື ບໍ່? (ລະບົບຈະປົດລັອກໃຫ້ແກ້ໄຂການຈັດສົ່ງໄດ້)'
          : 'Revert this order back to In-Transit delivery stage?',
        doRevert
      );
    } else {
      doRevert();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in font-sans">
      
      {/* 1. Header Navigation */}
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
              <span className="text-sky-600 font-black">#{orderIdDisplay}</span>
              <span>•</span>
              <span className="text-sky-800 font-bold">Step 3: Fulfillment & Logistics</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
              {currentLang === 'lo' ? 'ການຈັດສົ່ງ & ມອບຮັບ (Step 3: Delivery)' : 'Step 3: Delivery & Handover'}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badge (Pill with soft border) */}
          <div className={`px-3 py-1 rounded-full text-[11px] font-bold border uppercase flex items-center gap-1.5 select-none ${
            isDelivered 
              ? 'bg-emerald-50/90 text-emerald-800 border-emerald-300/80' 
              : isDispatched
              ? 'bg-sky-50/90 text-sky-800 border-sky-300/80'
              : isPacked
              ? 'bg-sky-50/90 text-sky-800 border-sky-300/80'
              : 'bg-slate-100 text-slate-700 border-slate-300/80'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isDelivered ? 'bg-emerald-500' : isDispatched ? 'bg-sky-500' : isPacked ? 'bg-sky-500' : 'bg-slate-400'
            }`} />
            <span>
              {isDelivered 
                ? (currentLang === 'lo' ? 'ລູກຄ້າໄດ້ຮັບແລ້ວ (Delivered)' : 'Delivered') 
                : isDispatched 
                ? (currentLang === 'lo' ? 'ກຳລັງຈັດສົ່ງ (In Transit)' : 'In Transit')
                : isPacked
                ? (currentLang === 'lo' ? 'ແພັກແລ້ວ (ລໍຖ້າສົ່ງ)' : 'Packed / Ready')
                : (currentLang === 'lo' ? 'ລໍຖ້າແພັກກິ້ງ (Pending)' : 'Pending Packaging')}
            </span>
          </div>

          {/* Vertical Divider */}
          <div className="hidden sm:block w-px h-6 bg-slate-200" />

          {/* Action Buttons (Elevated Clickable) */}
          <div className="flex items-center gap-2">
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
          </div>
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

            {/* Customer Delivery Details & Category */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-black">{customerName}</span>
                  <span className="text-slate-400">•</span>
                  <a href={`tel:${customerPhone}`} className="text-blue-600 font-mono hover:underline">
                    {customerPhone}
                  </a>
                </div>
                {categoryLabel && (
                  <span className="px-2.5 py-1 rounded-xl text-[10.5px] font-black uppercase bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-sky-500" />
                    <span>{categoryLabel}</span>
                  </span>
                )}
              </div>

              {/* Structured Address: ບ້ານ / ເມືອງ / ແຂວງ */}
              <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                <div className="flex items-start gap-1.5 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 w-full">
                    {(village || district || province) ? (
                      <div className="flex flex-wrap gap-1.5 text-[11px] font-bold text-slate-700">
                        {village && <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">ບ້ານ: {village}</span>}
                        {district && <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">ເມືອງ: {district}</span>}
                        {province && <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">ແຂວງ: {province.replace('ແຂວງ', '').replace('ນະຄອນຫຼວງ', '').trim()}</span>}
                      </div>
                    ) : null}
                    {deliveryAddress && (
                      <span className="text-[11px] text-slate-500 block leading-relaxed">{deliveryAddress}</span>
                    )}
                  </div>
                </div>
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

              {/* Courier Handover Proof Photo Box with Toggle Switch (ດັອກກີ້) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <div className="space-y-0.5">
                    <span className="flex items-center gap-1.5 font-black text-slate-800">
                      <Camera className="w-4 h-4 text-sky-600" />
                      <span>ແນບຮູບຫຼັກຖານການມອບໃຫ້ຂົນສົ່ງ (Handover Photo)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      {enableProofImage ? 'ເປີດໃຊ້ງານ (ແນບຮູບໃບສົ່ງ / ພັດສະດຸ)' : 'ປິດໃຊ້ງານ (ບໍ່ຈຳເປັນຕ້ອງແນບຮູບ - Optional)'}
                    </span>
                  </div>

                  {/* Toggle Switch (ດັອກກີ້) */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enableProofImage}
                    onClick={() => setEnableProofImage(!enableProofImage)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      enableProofImage ? 'bg-sky-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        enableProofImage ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {enableProofImage ? (
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
                ) : (
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center text-slate-400 text-[11px] font-semibold">
                    <span>ບໍ່ມີຮູບຫຼັກຖານ (Optional - ຂ້າມຂັ້ນຕອນນີ້ໄດ້)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action: Dispatch Confirmation Button & In-Place Editing */}
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
              <div className="space-y-2">
                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-black flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    <span>{currentLang === 'lo' ? 'ມອບໃຫ້ຂົນສົ່ງຮຽບຮ້ອຍແລ້ວ (ກຳລັງນຳສົ່ງຮອດລູກຄ້າ)' : 'Dispatched / In Transit'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingDelivery(!isEditingDelivery)}
                    className="px-3 py-1 rounded-xl bg-white hover:bg-purple-100 text-purple-800 text-[11px] font-black border border-purple-300 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 text-purple-600" />
                    <span>{isEditingDelivery ? 'ປິດແກ້ໄຂ' : 'ແກ້ໄຂຂໍ້ມູນຈັດສົ່ງ'}</span>
                  </button>
                </div>

                {isEditingDelivery && (
                  <button
                    type="button"
                    onClick={handleSaveDeliveryUpdates}
                    className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer border-none"
                  >
                    <Save className="w-4 h-4 text-white" />
                    <span>{currentLang === 'lo' ? 'ບັນທຶກການແກ້ໄຂຂໍ້ມູນຈັດສົ່ງ' : 'Save Delivery Updates'}</span>
                  </button>
                )}
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

          {/* Action 3: Customer Received Confirmation (Gateway to Step 4) & Revert Action */}
          <div className="pt-3 border-t border-slate-100">
            {isDelivered ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <span>{currentLang === 'lo' ? 'ລູກຄ້າໄດ້ຮັບສິນຄ້າແລ້ວ (ອໍເດີສຳເລັດ)' : 'Delivered & Completed'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRevertToDispatched}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-black transition border border-amber-300 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="ຍ້ອນສະຖານະກັບສູ່ຂັ້ນຕອນການຈັດສົ່ງ"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>{currentLang === 'lo' ? 'ຍ້ອນສະຖານະ (Revert)' : 'Revert'}</span>
                  </button>
                </div>
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
