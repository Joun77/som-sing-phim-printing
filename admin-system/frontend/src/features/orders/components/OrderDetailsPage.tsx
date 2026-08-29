import React, { useState, useEffect } from 'react';
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
  FileText,
  Phone,
  MapPin,
  User,
  Calendar,
  AlertTriangle,
  Check,
  Activity,
  Sparkles,
  Layers,
  X,
  BookOpen,
  Ruler,
  ExternalLink,
  Edit3,
  Save,
  Copy,
  PackageCheck
} from 'lucide-react';
import ShippingLabelModal from './modals/ShippingLabelModal';
import CustomerInvoiceModal from './modals/CustomerInvoiceModal';
import { EditOrderModal } from './modals/EditOrderModal';
import { IndustrialJobTicket } from './production/PaperCuttingTicketCard';
import { useApp } from '@store/AppContext';

export default function OrderDetailsPage({
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
  getPaymentStatusIcon,
  viewMode = 'orders',
  updateProductionStep,
  addSpoilageLog,
  inventory,
  equipment,
  onEditOrder
}: {
  order: any;
  onBack: () => void;
  formatLAK: (n: number) => string;
  t: (key: string) => string;
  currentLang: string;
  handleStatusChange: (orderId: any, currentStatus: any) => void;
  handlePreflightToggle?: (orderId: any, versionId?: any) => void;
  deleteOrder: (orderId: any) => void;
  showToast: (msg: string, type?: string) => void;
  askConfirmation: (msg: string, onConfirm: () => void) => void;
  setLightbox?: (v: { src: string; title: string } | null) => void;
  setIsSettleOpen?: (v: boolean) => void;
  setSettleAmount?: (v: any) => void;
  setSettleStep?: (v: any) => void;
  getStatusBadgeClass: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getPaymentStatusBadge: (status: string) => string;
  getPaymentStatusIcon: (status: string) => React.ReactNode;
  viewMode?: string;
  updateProductionStep?: (orderId: any, step: string, done: boolean) => void;
  addSpoilageLog?: (log: any) => void;
  inventory?: any[];
  equipment?: any[];
  onEditOrder?: (order: any) => void;
}) {
  if (!order) return null;

  const { 
    couriers = [], 
    updateOrderTracking: contextUpdateOrderTracking, 
    updateOrderDetails: contextUpdateOrderDetails,
    inventory: contextInventory = [],
    equipment: contextEquipment = []
  } = useApp();

  const [isShippingLabelOpen, setIsShippingLabelOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Delivery & Tracking inputs state
  const [courierName, setCourierName] = useState<string>(order.courier || order.deliveryMethod || 'Anousith Express');
  const [trackingNo, setTrackingNo] = useState<string>(order.trackingNumber || order.trackingNo || '');
  const [shippingFeeVal, setShippingFeeVal] = useState<number>(order.shippingFee || 15000);
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  useEffect(() => {
    if (order) {
      setCourierName(order.courier || order.deliveryMethod || 'Anousith Express');
      setTrackingNo(order.trackingNumber || order.trackingNo || '');
      setShippingFeeVal(order.shippingFee || 15000);
    }
  }, [order?.id, order?.trackingNumber, order?.trackingNo, order?.courier, order?.deliveryMethod, order?.shippingFee]);

  const handleSaveTracking = () => {
    setIsSavingTracking(true);
    try {
      if (contextUpdateOrderTracking) {
        contextUpdateOrderTracking(order.id, courierName, trackingNo, shippingFeeVal);
      }
      showToast(
        currentLang === 'lo' 
          ? `ບັນທຶກຂໍ້ມູນການຈັດສົ່ງສຳເລັດ (${courierName}: ${trackingNo || 'ບໍ່ມີເລກພັດສະດຸ'})` 
          : `Tracking info saved (${courierName}: ${trackingNo || 'No tracking #'})`,
        'success'
      );
    } catch (err) {
      showToast(currentLang === 'lo' ? 'ບັນທຶກບໍ່ສຳເລັດ' : 'Failed to save tracking', 'error');
    } finally {
      setIsSavingTracking(false);
    }
  };

  const handleCopyTracking = () => {
    if (!trackingNo) return;
    navigator.clipboard.writeText(trackingNo);
    setCopiedTracking(true);
    showToast(currentLang === 'lo' ? 'ຄັດລອກເລກພັດສະດຸແລ້ວ' : 'Tracking number copied!', 'info');
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const getSpecDetails = (itemName: string) => {
    const name = (itemName || '').toLowerCase();
    return {
      paper: name.includes('a4') ? 'A4 80gsm' : name.includes('a3') ? 'A3 80gsm' : 'Standard',
      size: name.includes('a4') ? '210×297mm' : name.includes('a3') ? '297×420mm' : 'Custom',
      finishing: name.includes('lamin') ? 'Lamination' : name.includes('fold') ? 'Folding' : 'None',
    };
  };

  const renderSLAHeroBadge = () => {
    if (!order.promisedDeliveryDate) return null;
    const promised = new Date(order.promisedDeliveryDate + 'T23:59:59');
    const now = new Date();
    const diffMs = promised.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMs < 0) {
      const daysOverdue = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      return (
        <span className="px-3 py-1.5 rounded-xl bg-red-600 text-white border border-red-500 text-xs font-black animate-pulse flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-white" /> ກາຍກຳນົດ {daysOverdue} ວັນ (Overdue)
        </span>
      );
    } else if (diffDays <= 1) {
      return (
        <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-900 text-xs font-black flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-900" /> ສົ່ງມື້ນີ້ (Due Today)
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1.5 rounded-xl bg-purple-800 border border-purple-700 text-purple-200 text-xs font-bold font-mono">
          ເຫຼືອເວລາ: {diffDays} ວັນ
        </span>
      );
    }
  };

  const renderActivityTimeline = () => {
    const logs = order.activityLog || [];
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
        <h3 className="text-sm font-black text-slate-900 border-b pb-3 flex items-center gap-2 font-sans">
          <Activity className="w-5 h-5 text-slate-600" />
          <span>{currentLang === 'lo' ? 'ປະຫວັດການດຳເນີນງານ & ກິດຈະກຳ' : 'Order Activity Audit Trail'}</span>
        </h3>
        
        {logs.length === 0 ? (
          <p className="text-xs text-slate-400 font-bold text-center py-4">
            {currentLang === 'lo' ? 'ບໍ່ມີປະຫວັດກິດຈະກຳເທື່ອ' : 'No activity logged yet'}
          </p>
        ) : (
          <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 font-sans text-xs">
            {logs.map((log, idx) => (
              <div key={idx} className="relative text-left">
                <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white ring-4 ring-slate-50" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-bold text-slate-800 leading-snug">{log.description}</span>
                  <span className="text-[10px] text-slate-400 font-mono font-bold shrink-0">{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderJobTicket = () => {
    return (
      <div className="hidden print:block">
        <IndustrialJobTicket order={order} currentLang={currentLang} />
      </div>
    );
  };

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

  const isProdStepDone = (stepKey) => {
    const custom = order.productionStepsCompleted || {};
    if (stepKey === 'preflight') return preflightComplete;
    if (stepKey in custom) return Boolean(custom[stepKey]);
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

  // COMMON HEADER
  const renderHeader = (titleText) => (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-2xl text-xs sm:text-sm font-black transition active:scale-95 shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentLang === 'lo' ? '← ກັບຄືນ' : '← Back'}</span>
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase">
            <span>ID: #{order.id}</span>
            <span>•</span>
            <span>{order.date} {order.createdTime || ''}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
            {titleText}
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className={`px-3 py-1.5 rounded-xl text-xs font-black border uppercase flex items-center gap-1.5 ${getStatusBadgeClass(order.status)}`}>
          {getStatusIcon(order.status)}
          <span>{t(`status.${order.status}`)}</span>
        </span>
        <span className={`px-3 py-1.5 rounded-xl text-xs font-black border uppercase flex items-center gap-1.5 ${getPaymentStatusBadge(order.paymentStatus)}`}>
          {getPaymentStatusIcon(order.paymentStatus)}
          <span>{t(`payment.${order.paymentStatus}`)}</span>
        </span>
        {viewMode === 'production' && (
          <button
            type="button"
            onClick={() => { showToast(currentLang === 'lo' ? 'ກຳລັງພິມໃບສັ່ງຜະລິດ...' : 'Printing Job Ticket...', 'info'); window.print(); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ພິມໃບສັ່ງຜະລິດ' : 'Print Job Ticket'}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsInvoiceModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer shadow-2xs"
          title="Customer Payment Invoice / Receipt"
        >
          <CreditCard className="w-4 h-4 text-blue-600" />
          <span>{currentLang === 'lo' ? 'ໃບບິນລູກຄ້າ' : 'Invoice'}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (onEditOrder) {
              onEditOrder(order);
            } else {
              setIsEditModalOpen(true);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer"
          title={currentLang === 'lo' ? 'ແກ້ໄຂລາຍລະອຽດອໍເດີ' : 'Edit Order'}
        >
          <Edit3 className="w-4 h-4 text-amber-700" />
          <span>{currentLang === 'lo' ? 'ແກ້ໄຂ' : 'Edit'}</span>
        </button>
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
          className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>{currentLang === 'lo' ? 'ລຶບ' : 'Delete'}</span>
        </button>
      </div>
    </div>
  );

  // VIEW 1: PRODUCTION VIEW (viewMode === 'production')
  if (viewMode === 'production') {
    return (
      <>
        <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in font-sans print:hidden">
          {renderHeader(currentLang === 'lo' ? 'ຕິດຕາມ & ຈັດການຂະບວນການຜະລິດ' : 'Production Tracking Desk')}

          {/* Production Hero Banner */}
          <div className="bg-purple-900 text-white rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-48 h-48 rounded-full bg-purple-800 opacity-20 pointer-events-none" />
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black tracking-wider text-purple-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Stage 1: Manufacturing run
              </span>
              <h2 className="text-xl font-black">{currentLang === 'lo' ? 'ກຳລັງດຳເນີນການຜະລິດໃນໂຮງງານ' : 'Order is Currently in Manufacturing Run'}</h2>
              <p className="text-xs text-purple-200">Machine priority: Standard Digital Press • Promised Delivery: {order.promisedDeliveryDate}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {renderSLAHeroBadge()}
              <div className="px-4 py-2 bg-purple-800 border border-purple-700 rounded-2xl text-xs font-bold text-purple-200 font-mono">
                QC Code: QC-MIMAKI-{order.id}
              </div>
            </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Artwork Spec & Pre-flight Checklist */}
          <div className="lg:col-span-2 space-y-6">
            {/* Artwork File Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <h3 className="text-sm font-black text-slate-900 border-b pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  {currentLang === 'lo' ? 'ໄຟລ໌ອອກແບບ & ສື່ສິ່ງພິມ' : 'Artwork File & Print Media'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-black border border-purple-200 uppercase">Art Safe</span>
              </h3>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 text-purple-800 border border-purple-200 rounded-2xl flex items-center justify-center font-black text-xs uppercase font-mono shadow-inner">
                    PDF
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 leading-snug font-mono">artwork_order_{order.id}_cmyk.pdf</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">High-Resolution Vector Format • 300 DPI • Embedded Profile</p>
                  </div>
                </div>
                <button
                  onClick={() => showToast(currentLang === 'lo' ? 'ດາວໂຫຼດໄຟລ໌ສຳເລັດ!' : 'Artwork file downloaded!', 'success')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition active:scale-95 cursor-pointer shadow-sm shadow-purple-600/10 shrink-0"
                >
                  {currentLang === 'lo' ? 'ດາວໂຫຼດໄຟລ໌' : 'Download File'}
                </button>
              </div>

              {/* Pre-flight Interactive Control Panel */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">{currentLang === 'lo' ? 'ກວດສອບມາດຕະຖານໄຟລ໌ (Pre-flight Toggles)' : 'Interactive Pre-flight Toggles'}</span>
                  <span className="text-[10px] text-slate-400 font-bold">Click button to switch check status</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* 1. CMYK Color mode */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 text-xs">
                    <div>
                      <span className="font-extrabold text-slate-800 block">CMYK Color Mode</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Color check</span>
                    </div>
                    <div className="flex gap-1.5">
                      {['Pass', 'Fail', 'Pending'].map((val) => {
                        const isSelected = order.preflight?.cmyk === val;
                        return (
                          <button
                            key={val}
                            onClick={() => handlePreflightToggle('cmyk', val)}
                            className={`flex-1 py-1 rounded-lg font-black transition text-[10px] cursor-pointer ${
                              isSelected
                                ? val === 'Pass' ? 'bg-emerald-600 text-white' : val === 'Fail' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Bleed margins check */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 text-xs">
                    <div>
                      <span className="font-extrabold text-slate-800 block">Bleed & Safe Zones</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Safety Margins</span>
                    </div>
                    <div className="flex gap-1.5">
                      {['Pass', 'Fail', 'Pending'].map((val) => {
                        const isSelected = order.preflight?.bleed === val;
                        return (
                          <button
                            key={val}
                            onClick={() => handlePreflightToggle('bleed', val)}
                            className={`flex-1 py-1 rounded-lg font-black transition text-[10px] cursor-pointer ${
                              isSelected
                                ? val === 'Pass' ? 'bg-emerald-600 text-white' : val === 'Fail' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Resolution Check */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 text-xs">
                    <div>
                      <span className="font-extrabold text-slate-800 block">Image Resolution</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Minimum 300 DPI</span>
                    </div>
                    <div className="flex gap-1.5">
                      {['Pass', 'Fail', 'Pending'].map((val) => {
                        const isSelected = order.preflight?.resolution === val;
                        return (
                          <button
                            key={val}
                            onClick={() => handlePreflightToggle('resolution', val)}
                            className={`flex-1 py-1 rounded-lg font-black transition text-[10px] cursor-pointer ${
                              isSelected
                                ? val === 'Pass' ? 'bg-emerald-600 text-white' : val === 'Fail' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Spec & Item Breakdown */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 border-b pb-3 flex items-center gap-2">
                <Printer className="w-5 h-5 text-purple-600" />
                <span>{currentLang === 'lo' ? 'ລາຍການສິ່ງພິມທີ່ຈະຜະລິດ' : 'Printed Items to Manufacture'}</span>
              </h3>
              <div className="divide-y divide-slate-100">
                {order.items && order.items.map((item, idx) => {
                  const specs = getItemSpecs(item);
                  return (
                    <div key={item.id || idx} className="py-4 flex justify-between items-start text-xs">
                      <div className="space-y-1.5">
                        <h4 className="font-black text-sm text-slate-900">{item.name || item.item_name || item.job_name}</h4>
                        <div className="flex flex-wrap gap-1.5 text-slate-500 font-bold">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px]">Paper: {specs.paper}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px]">Size: {specs.size}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px]">Cut: {specs.finishing}</span>
                          {(item.page_count || item.specs?.pages) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black">
                              <FileText className="w-3 h-3 text-emerald-600" />
                              <span>{item.page_count || item.specs?.pages} Pages</span>
                            </span>
                          )}
                          {(item.spine_width_mm || item.specs?.spine) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-black">
                              <Ruler className="w-3 h-3 text-purple-600" />
                              <span>Spine {item.spine_width_mm || item.specs?.spine}</span>
                            </span>
                          )}
                        </div>

                        {/* File Action Links for Factory Floor */}
                        {(item.cover_file_url || item.inner_file_url || item.drive_link) && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {item.cover_file_url && (
                              <a
                                href={item.cover_file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold hover:bg-blue-100 transition"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                                <span>{currentLang === 'lo' ? 'ໄຟລ໌ປົກ (Cover)' : 'Cover File'}</span>
                                <ExternalLink className="w-3 h-3 text-blue-400" />
                              </a>
                            )}
                            {item.inner_file_url && (
                              <a
                                href={item.inner_file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 transition"
                              >
                                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{currentLang === 'lo' ? 'ໄຟລ໌ເນື້ອໃນ (Inner PDF)' : 'Inner PDF File'}</span>
                                <ExternalLink className="w-3 h-3 text-emerald-400" />
                              </a>
                            )}
                            {!item.cover_file_url && !item.inner_file_url && item.drive_link && (
                              <a
                                href={item.drive_link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold hover:bg-amber-100 transition"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                                <span>Drive Link</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <span className="text-slate-400 block font-bold text-[10px]">Ordered Volume</span>
                        <span className="text-sm font-black text-slate-900 font-mono">x{item.quantity} units</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Timeline Tracker */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[300px]">
              <div className="space-y-5">
                <h3 className="text-sm font-black text-slate-900 border-b pb-3 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600 animate-pulse" />
                  <span>{currentLang === 'lo' ? 'ຕິດຕາມຂັ້ນຕອນການຜະລິດ' : 'Production Progress'}</span>
                </h3>

                <div className="space-y-3.5">
                  {order.productionWorkflow?.steps && order.productionWorkflow.steps.length > 0 ? (
                    order.productionWorkflow.steps.map((wfStep: any, sIdx: number) => {
                      const isDone = wfStep.status === 'COMPLETED';
                      return (
                        <div
                          key={wfStep.id || sIdx}
                          className={`w-full p-3 rounded-2xl border transition-all text-left flex items-center justify-between ${
                            isDone 
                              ? 'bg-emerald-50/70 border-emerald-200 text-slate-800' 
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] ${
                              isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {isDone ? <Check className="w-3.5 h-3.5" /> : sIdx + 1}
                            </div>
                            <div>
                              <span className="text-xs font-bold block text-slate-900">{wfStep.nameLao || wfStep.name}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-400 font-mono">{wfStep.category}</span>
                                {wfStep.assignedStaffName && (
                                  <span className="text-[10px] text-blue-600 font-bold">
                                    • {wfStep.assignedStaffName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {isDone ? (
                            <span className="p-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0 bg-slate-100" />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    [
                      { id: 'preflight', title: currentLang === 'lo' ? 'ກວດສອບໄຟລ໌' : 'File Validation', sub: 'CMYK Color & Resolution Pass', done: isProdStepDone('preflight'), icon: FileCheck, clickable: true },
                      { id: 'printing', title: currentLang === 'lo' ? 'ພິມຜ່ານເຄື່ອງ' : 'Press Printing', sub: 'Active Industrial Digital Printer', done: isProdStepDone('printing'), icon: Printer },
                      { id: 'cutting', title: currentLang === 'lo' ? 'ຕັດ & ເຄືອບ' : 'Cutting & Binding', sub: 'Laminating & Guillotine Cutting', done: isProdStepDone('cutting'), icon: Scissors },
                      { id: 'qc', title: currentLang === 'lo' ? 'ກວດ QC ສຸດທ້າຍ' : 'Final QC Inspection', sub: 'Color Alignment & Count Validation', done: isProdStepDone('qc'), icon: ShieldCheck },
                    ].map((step, sIdx) => {
                      const StepIcon = step.icon;
                      const isClickable = step.id !== 'preflight' && updateProductionStep;
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          disabled={!isClickable}
                          title={isClickable ? (step.done ? (currentLang === 'lo' ? 'ກົດເພື່ອຍົກເລີກ' : 'Click to unmark') : (currentLang === 'lo' ? 'ກົດເພື່ອໝາຍວ່າສຳເລັດ' : 'Click to mark complete')) : (currentLang === 'lo' ? 'ໃຊ້ toggle ຂ້າງເທິງ' : 'Toggle via preflight checks above')}
                          onClick={() => {
                            if (isClickable) {
                              updateProductionStep(order.id, step.id, !step.done);
                              showToast(
                                !step.done
                                  ? (currentLang === 'lo' ? `${step.title}: ສຳເລັດ!` : `${step.title}: Marked complete!`)
                                  : (currentLang === 'lo' ? `${step.title}: ຍົກເລີກ` : `${step.title}: Unmarked`),
                                !step.done ? 'success' : 'info'
                              );
                            }
                          }}
                          className={`w-full p-3 rounded-2xl border transition-all text-left flex items-center justify-between ${
                            step.done 
                              ? 'bg-emerald-50/70 border-emerald-200 text-slate-800' 
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          } ${isClickable ? 'hover:border-purple-300 hover:shadow-sm cursor-pointer active:scale-[0.99]' : 'cursor-default'}`}
                        >
                          <div className="flex items-center gap-3">
                            <StepIcon className={`w-4 h-4 shrink-0 ${step.done ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <div>
                              <span className="text-xs font-bold block text-slate-900">{step.title}</span>
                              <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{step.sub}</span>
                            </div>
                          </div>
                          {step.done ? (
                            <span className="p-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isClickable ? 'border-slate-300 hover:border-purple-400' : 'bg-slate-200 border-transparent'}`} />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {order.status !== 'Ready' && order.status !== 'Delivered' && (
                <button
                  type="button"
                  onClick={() => {
                    if (handleStatusChange) handleStatusChange(order.id, order.status);
                  }}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95 mt-6 cursor-pointer"
                >
                  {currentLang === 'lo' ? `ອັບເດດສະຖານະການຜະລິດ (${order.status})` : `Advance Production Status (${order.status})`}
                </button>
              )}
            </div>

            {/* Quick customer detail block */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xs space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Client Contact</span>
              <div className="space-y-3 font-semibold text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{order.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`tel:${order.phone}`} className="hover:underline">{order.phone}</a>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{order.deliveryMethod || 'Kerry Lao'}</span>
                </div>
              </div>
            </div>

            {/* Spoilage defect reporter form */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 border-b pb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>{currentLang === 'lo' ? 'ແຈ້ງເສຍຫາຍ / ລາຍງານງານເສຍ' : 'Report Production Spoilage'}</span>
              </h3>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target;
                  const materialId = form.materialId.value;
                  const quantity = Number(form.quantity.value);
                  const cause = form.cause.value;
                  
                  if (!materialId || quantity <= 0) {
                    showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກວັດສະດຸ ແລະ ປ້ອນຈຳນວນ!' : 'Please select material and enter quantity!', 'error');
                    return;
                  }
                  
                  if (addSpoilageLog) {
                    addSpoilageLog({
                      materialId,
                      quantity,
                      cause,
                      orderId: order.id
                    });
                    showToast(currentLang === 'lo' ? 'ບັນທຶກງານເສຍສຳເລັດ!' : 'Spoilage logged successfully!', 'success');
                    form.reset();
                  }
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block font-bold text-slate-500 mb-1">{currentLang === 'lo' ? 'ເລືອກວັດສະດຸທີ່ເສຍ' : 'Select Spoilage Material'}</label>
                  <select 
                    name="materialId"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white transition"
                    required
                  >
                    <option value="">-- {currentLang === 'lo' ? 'ເລືອກວັດສະດຸ' : 'Select Material'} --</option>
                    {inventory && inventory.map(item => (
                      <option key={item.id} value={item.id}>{item.name} ({item.currentQty} {item.consumptionUnit})</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">{currentLang === 'lo' ? 'ຈຳນວນເສຍຫາຍ' : 'Quantity'}</label>
                    <input 
                      type="number"
                      name="quantity"
                      min="1"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">{currentLang === 'lo' ? 'ສາເຫດ / ໝາຍເຫດ' : 'Reason'}</label>
                    <input 
                      type="text"
                      name="cause"
                      placeholder="e.g. ເຈ້ຍຕິດ, ຕັດຜິດ"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black transition active:scale-95 cursor-pointer shadow-sm shadow-amber-600/10 text-center"
                >
                  {currentLang === 'lo' ? 'ບັນທຶກລາຍງານງານເສຍ' : 'Submit Spoilage Log'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Full-width Activity Log Timeline */}
        {renderActivityTimeline()}
      </div>
      {renderJobTicket()}
    </>
    );
  }

  // VIEW 2: DELIVERY VIEW (viewMode === 'deliveries')
  if (viewMode === 'deliveries') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in font-sans">
        {renderHeader(currentLang === 'lo' ? 'ຕິດຕາມການຈັດສົ່ງ & ຊຳຣະຍອດຄ້າງ' : 'Dispatch & Settlement Desk')}

        {/* Deliveries alert card showing remaining unpaid balance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex items-center justify-between col-span-2">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black tracking-wider text-red-500 block">{currentLang === 'lo' ? 'ຍອດເງິນຄ້າງຊຳລະທັງໝົດ' : 'Outstanding Remaining Balance'}</span>
              <span className="text-3xl font-black text-red-600 font-sans block">
                {formatLAK(remainingUnpaid)}
              </span>
              <p className="text-xs text-slate-400 font-bold">{currentLang === 'lo' ? 'ຕ້ອງເກັບກ່ອນ ຫຼື ຂະນະທີ່ສົ່ງມອບສິນຄ້າ' : 'Must be collected before or during delivery handover'}</p>
            </div>
            {remainingUnpaid > 0 ? (
              <button
                onClick={() => {
                  setSettleAmount(remainingUnpaid);
                  setSettleStep(1);
                  setIsSettleOpen(true);
                }}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95 cursor-pointer shrink-0"
              >
                {t('orders.btn_settle')}
              </button>
            ) : (
              <span className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Fully Paid
              </span>
            )}
          </div>

          <div className="bg-sky-950 text-white rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-sky-400 block">Shipping Method</span>
              <span className="text-lg font-black block">{order.deliveryMethod || 'Kerry Lao'}</span>
            </div>
            <span className="text-[11px] font-bold text-sky-300 font-mono mt-2">Target Date: {order.promisedDeliveryDate}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Customer details, Address, Ledger details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address details */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <h3 className="text-sm font-black text-slate-900 border-b pb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-sky-600" />
                <span>{currentLang === 'lo' ? 'ທີ່ຢູ່ຈັດສົ່ງ ແລະ ຂໍ້ມູນລູກຄ້າ' : 'Delivery Address & Client Details'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-black text-slate-400 block">{currentLang === 'lo' ? 'ຊື່ຜູ້ຮັບສິນຄ້າ' : 'Recipient Name'}</span>
                    <span className="font-extrabold text-slate-800">{order.customerName}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-black text-slate-400 block">{currentLang === 'lo' ? 'ເບີໂທລະສັບ' : 'Phone'}</span>
                    <a href={`tel:${order.phone}`} className="font-black text-sky-600 text-sm hover:underline">{order.phone}</a>
                  </div>
                </div>
                <div className="space-y-1 bg-slate-50 p-4 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] uppercase font-black text-slate-400 block">{currentLang === 'lo' ? 'ທີ່ຢູ່ສົ່ງເຄື່ອງຢ່າງລະອຽດ' : 'Full Delivery Address'}</span>
                  <p className="font-semibold text-slate-700 mt-1.5 italic leading-relaxed">
                    {order.address || (currentLang === 'lo' ? 'ບໍ່ມີຂໍ້ມູນທີ່ຢູ່ (ຮັບເອງທີ່ຮ້ານ)' : 'No address provided (Self-pickup)')}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Ledger & Invoice breakdowns */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 border-b pb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-sky-600" />
                <span>{currentLang === 'lo' ? 'ລາຍການສິນຄ້າ ແລະ ໃບບິນ' : 'Invoice & Itemized Ledger'}</span>
              </h3>
              
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-3">Item</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {order.items && order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-800">{item.name}</td>
                        <td className="p-3 text-center font-mono">x{item.quantity}</td>
                        <td className="p-3 text-right">{formatLAK(item.unitCost)}</td>
                        <td className="p-3 text-right font-black text-slate-900">{formatLAK(Number(item.quantity || 0) * Number(item.unitCost || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold">
                <span className="text-slate-500">{currentLang === 'lo' ? 'ລາຄາລວມທັງໝົດ' : 'Total Charges'}</span>
                <span className="text-lg font-black text-slate-900">{formatLAK(order.totalPriceCharged)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dispatch progress tracking & Tracking Number Management */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[300px] space-y-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-sky-600" />
                    <span>{currentLang === 'lo' ? 'ສະຖານະການຈັດສົ່ງ' : 'Shipping Status'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsShippingLabelOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-bold transition border border-sky-200"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>{currentLang === 'lo' ? 'ໃບປະໜ້າ' : 'Label'}</span>
                  </button>
                </div>

                {/* Tracking & Courier Input Form */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                    {currentLang === 'lo' ? 'ຂໍ້ມູນຂົນສົ່ງ & ເລກພັດສະດຸ (Tracking)' : 'Courier & Tracking Details'}
                  </span>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      {currentLang === 'lo' ? 'ບໍລິສັດຂົນສົ່ງ (Courier)' : 'Courier Company'}
                    </label>
                    <select
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Anousith Express">Anousith Express (ອານຸສິດ)</option>
                      <option value="HAL Logistics">HAL Logistics (ຮຸ່ງອາລຸນ)</option>
                      <option value="Mixay Express">Mixay Express (ມີໄຊ)</option>
                      <option value="Kerry Lao">Kerry Lao (ເຄີຣີ)</option>
                      <option value="J&T Express">J&T Express</option>
                      <option value="Flash Express">Flash Express</option>
                      <option value="Pick-up at Shop">ຮັບເອງທີ່ຮ້ານ (Pick-up)</option>
                      {couriers.map((c: any) => (
                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      {currentLang === 'lo' ? 'ເລກພັດສະດຸ (Tracking Number)' : 'Tracking Number'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={trackingNo}
                        onChange={(e) => setTrackingNo(e.target.value)}
                        placeholder={currentLang === 'lo' ? 'ປ້ອນເລກພັດສະດຸ...' : 'Enter tracking number...'}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                      {trackingNo && (
                        <button
                          type="button"
                          onClick={handleCopyTracking}
                          className="p-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs transition cursor-pointer"
                          title="Copy tracking number"
                        >
                          {copiedTracking ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      {currentLang === 'lo' ? 'ຄ່າຈັດສົ່ງ (Shipping Fee LAK)' : 'Shipping Fee (LAK)'}
                    </label>
                    <input
                      type="number"
                      value={shippingFeeVal}
                      onChange={(e) => setShippingFeeVal(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveTracking}
                    disabled={isSavingTracking}
                    className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingTracking ? (currentLang === 'lo' ? 'ກຳລັງບັນທຶກ...' : 'Saving...') : (currentLang === 'lo' ? 'ບັນທຶກເລກພັດສະດຸ' : 'Save Tracking')}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    { id: 'ready', title: 'Package Ready', sub: 'Packaged & Checked by QC', done: isShippingStepDone('ready'), icon: Package },
                    { id: 'dispatched', title: 'In Transit / Courier', sub: `${courierName} ${trackingNo ? `(#${trackingNo})` : ''}`, done: isShippingStepDone('dispatched'), icon: Truck },
                    { id: 'delivered', title: 'Handed Over Successfully', sub: 'Completed and signed by client', done: isShippingStepDone('delivered'), icon: CheckCircle2 },
                  ].map((step, sIdx) => {
                    const StepIcon = step.icon;
                    return (
                      <div key={sIdx} className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                        step.done 
                          ? 'bg-emerald-50/70 border-emerald-200 text-slate-800' 
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}>
                        <div className="flex items-center gap-3">
                          <StepIcon className={`w-4 h-4 shrink-0 ${step.done ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <div>
                            <span className="text-xs font-bold block text-slate-900">{step.title}</span>
                            <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{step.sub}</span>
                          </div>
                        </div>
                        {step.done ? (
                          <span className="p-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="w-3 h-3 rounded-full bg-slate-200 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {order.status === 'Ready' && (
                <button
                  type="button"
                  onClick={() => {
                    if (handleStatusChange) handleStatusChange(order.id, 'Delivered');
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95 mt-6 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  <span>{currentLang === 'lo' ? 'ສົ່ງມອບສິນຄ້າສຳເລັດ (Mark Delivered)' : 'Mark Delivered'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VIEW 3: COMPLETED VIEW (viewMode === 'completed')
  if (viewMode === 'completed') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in font-sans">
        {renderHeader(currentLang === 'lo' ? 'ລາຍການຈັດສົ່ງສຳເລັດສົມບູນ' : 'Completed Order Archive')}

        {/* Success Banner */}
        <div className="bg-emerald-600 text-white rounded-3xl p-8 text-center space-y-3 shadow-md border border-emerald-500 relative overflow-hidden">
          <div className="w-16 h-16 bg-white/20 text-white rounded-full flex items-center justify-center mx-auto border-2 border-white/30 shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black">{currentLang === 'lo' ? 'ອໍເດີນີ້ສຳເລັດສົມບູນແລ້ວ 100%' : 'Order Completed & Settled Successfully'}</h2>
            <p className="text-xs text-emerald-100">Zero outstanding balance • All shipment batches handed over successfully</p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => showToast('Summary Invoice Printed!', 'success')}
              className="px-4 py-2 bg-white text-emerald-800 rounded-xl text-xs font-black hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{currentLang === 'lo' ? 'ພິມໃບບິນ' : 'Print Invoice'}</span>
            </button>
          </div>
        </div>

        {/* Closed Read-Only Ledger Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 border-b pb-3 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <span>{currentLang === 'lo' ? 'ສະຫຼຸບຍອດບິນທີ່ຊຳລະແລ້ວ' : 'Settled Ledger Summary'}</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-black">Total Charges</span>
                  <span className="text-base font-black text-slate-900">{formatLAK(order.totalPriceCharged)}</span>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                  <span className="text-emerald-800 block text-[10px] uppercase font-black">Paid Amount</span>
                  <span className="text-base font-black text-emerald-600">{formatLAK(paidAmount)}</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-black">Outstanding balance</span>
                  <span className="text-base font-black text-slate-400">₭ 0</span>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100 mt-4">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-3">Item Name</th>
                      <th className="p-3 text-center">Volume</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {order.items && order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold text-slate-800">{item.name}</td>
                        <td className="p-3 text-center font-mono">x{item.quantity}</td>
                        <td className="p-3 text-right font-black text-slate-950">{formatLAK(Number(item.quantity || 0) * Number(item.unitCost || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Read-Only Info */}
          <div className="space-y-6 text-xs sm:text-sm font-semibold">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 border-b pb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <span>{currentLang === 'lo' ? 'ຂໍ້ມູນການຈັດສົ່ງ' : 'Delivery Log'}</span>
              </h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Recipient Client</span>
                  <span className="text-slate-800 font-bold block">{order.customerName}</span>
                  <span className="text-slate-500 font-mono block mt-0.5">{order.phone}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Delivery Address</span>
                  <p className="text-slate-700 italic block">{order.address || 'Self-pickup'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VIEW 4: CANCELLED VIEW (viewMode === 'cancelled')
  if (viewMode === 'cancelled') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in font-sans">
        {renderHeader(currentLang === 'lo' ? 'ລາຍການຍົກເລີກ' : 'Cancelled Order Archive')}

        {/* Cancellation Alert Banner */}
        <div className="bg-red-50 border-2 border-red-200 text-red-900 rounded-3xl p-6 sm:p-8 flex items-start gap-4 shadow-xs">
          <div className="p-3 bg-red-100 text-red-700 border border-red-200 rounded-2xl shrink-0">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h2 className="text-lg font-black">{currentLang === 'lo' ? 'ອໍເດີນີ້ຖືກຍົກເລີກແລ້ວ' : 'This Order Has Been Cancelled'}</h2>
            <p className="text-xs text-red-700 font-bold">
              {currentLang === 'lo' ? 'ເຫດຜົນການຍົກເລີກ: ' : 'Cancellation Reason: '} 
              <span className="underline italic">{order.cancelReason || 'Customer Request / Defective Layout file'}</span>
            </p>
            <span className="text-[10px] text-slate-400 block font-mono">Cancelled on: {order.cancelDate || order.date}</span>
          </div>
        </div>

        {/* Read-Only items lists */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 border-b pb-3">
            {currentLang === 'lo' ? 'ລາຍລະອຽດອໍເດີທີ່ຍົກເລີກ' : 'Cancelled Order Summary'}
          </h3>
          <div className="divide-y divide-slate-100 text-xs sm:text-sm font-semibold">
            {order.items && order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex justify-between items-center">
                <div>
                  <h4 className="font-black text-slate-800">{item.name}</h4>
                  <span className="text-[11px] text-slate-400 block font-mono">Quantity: x{item.quantity}</span>
                </div>
                <span className="font-black text-slate-900">{formatLAK(Number(item.quantity || 0) * Number(item.unitCost || 0))}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-200 rounded-2xl text-xs sm:text-sm font-black mt-4">
            <span className="text-slate-500">Original Total Charged</span>
            <span className="text-slate-900 text-base">{formatLAK(order.totalPriceCharged)}</span>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT VIEW (viewMode === 'orders' or fallback)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in font-sans">
      {/* 1. TOP HEADER & NAVIGATION BAR (LIGHT THEME) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-2xl text-xs sm:text-sm font-black transition active:scale-95 shadow-sm cursor-pointer"
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
          <a
            href={`http://localhost:8080/api/orders/${order.id}/pdf/quotation`}
            download
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ໃບສະເໜີລາຄາ (PDF)' : 'Quotation (PDF)'}</span>
          </a>
          <a
            href={`http://localhost:8080/api/orders/${order.id}/pdf/delivery`}
            download
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ໃບສົ່ງເຄື່ອງ (PDF)' : 'Delivery Note (PDF)'}</span>
          </a>
          <button
            type="button"
            onClick={() => setIsShippingLabelOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ພິມໃບປະໜ້າພັດສະດຸ' : 'Shipping Label'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (onEditOrder) {
                onEditOrder(order);
              } else {
                setIsEditModalOpen(true);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer shadow-xs"
            title={currentLang === 'lo' ? 'ແກ້ໄຂລາຍລະອຽດອໍເດີ & ສະເປກ' : 'Edit Order Specs & Details'}
          >
            <Edit3 className="w-4 h-4 text-amber-700" />
            <span>{currentLang === 'lo' ? 'ແກ້ໄຂອໍເດີ' : 'Edit Order'}</span>
          </button>
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
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ລຶບ' : 'Delete'}</span>
          </button>
        </div>
      </div>

      {/* 2. ORDER RECEPTION & SLIP VERIFICATION HERO PANEL (STEP 1) */}
      {(() => {
        const customerName = order.customerName || order.customer_name || order.customer || 'Somphavath DOUANGSVA';
        const customerPhone = order.phone || order.customer_phone || '02058866339';
        const deliveryAddress = order.address || order.delivery_address || 'Saysettha, Vientiane (ຮັບເອງ ຫຼື ຂົນສົ່ງ)';
        const totalAmountLAK = Number(order.totalPriceCharged || order.totalAmount || order.total_amount_lak || order.total_price || 86250);
        const orderIdDisplay = order.orderNo || order.order_no || order.orderNumber || order.id || 'ORDER';

        const isPaymentConfirmed = 
          order.paymentStatus === 'Paid' || 
          order.paymentStatus === 'PAID' || 
          order.paymentStatus === 'Deposit' || 
          order.paymentStatus === 'Fully Paid';

        const isArtworkApproved = 
          order.status === 'IN_PRODUCTION' || 
          order.status === 'Printing' || 
          order.status === 'Cutting' || 
          order.status === 'Ready' || 
          order.status === 'Delivered';

        return (
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                    {currentLang === 'lo' ? 'ຂັ້ນຕອນທີ 1: ຮັບອໍເດີ & ກວດສະລິບ' : 'Step 1: Order Reception & Slip Check'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">#{orderIdDisplay}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight mt-1">
                  {currentLang === 'lo' ? 'ກວດສອບສະລິບໂອນເງິນ & ຢືນຢັນຮັບອໍເດີ' : 'Verify Payment Slip & Accept Order'}
                </h2>
                <p className="text-xs text-slate-400">
                  {currentLang === 'lo' 
                    ? 'ກວດສອບຍອດເງິນໂອນຜ່ານທະນາຄານ ກ່ອນກົດຢືນຢັນຮັບອໍເດີ ເພື່ອສົ່ງຕໍ່ໃຫ້ຝ່າຍ Pre-Press ກວດໄຟລ໌' 
                    : 'Inspect bank transfer payment slip before accepting the order and passing artwork to Pre-Press'}
                </p>
              </div>

              {/* SLA and Status Badges */}
              <div className="flex flex-wrap items-center gap-3">
                {renderSLAHeroBadge()}
                <div className="px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs font-mono font-bold text-slate-300">
                  {order.deliveryMethod || order.shippingCourier || 'Anousith Express'}
                </div>
              </div>
            </div>

            {/* 2-Column Grid: Slip & Bank Transfer (Left) + Customer & Artwork Link (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left: Slip Viewer Card (5 of 12 cols) */}
              <div className="lg:col-span-5 rounded-2xl bg-slate-950/80 border border-slate-800 p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-black mb-3">
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      {currentLang === 'lo' ? 'ສະລິບໂອນເງິນຜ່ານທະນາຄານ' : 'Bank Transfer Slip'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                      isPaymentConfirmed
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {isPaymentConfirmed ? (currentLang === 'lo' ? 'ຊຳລະແລ້ວ' : 'Paid') : (currentLang === 'lo' ? 'ລໍຖ້າກວດສອບ' : 'Pending Verification')}
                    </span>
                  </div>

                  {/* Slip Box Preview */}
                  <div 
                    onClick={() => {
                      const slipImg = order.paymentSlipUrl || order.payment_slip_url || order.slipUrl || order.slipImage;
                      if (slipImg && setLightbox) {
                        setLightbox({ src: slipImg, title: `Payment Slip - Order #${orderIdDisplay}` });
                      }
                    }}
                    className="w-full min-h-[220px] max-h-[260px] rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-3 overflow-hidden cursor-pointer hover:border-amber-500/50 transition relative group"
                    title={currentLang === 'lo' ? 'ຄລິກເພື່ອເບິ່ງຮູບສະລິບເຕັມຈໍ' : 'Click to view full slip image'}
                  >
                    {order.paymentSlipUrl || order.payment_slip_url || order.slipUrl || order.slipImage ? (
                      <>
                        <img 
                          src={order.paymentSlipUrl || order.payment_slip_url || order.slipUrl || order.slipImage} 
                          alt="Payment Slip" 
                          className="max-h-[220px] max-w-full object-contain rounded-lg shadow-md"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-xs font-black text-amber-400">
                          <Sparkles className="w-4 h-4" />
                          <span>{currentLang === 'lo' ? 'ຄລິກເພື່ອຂະຫຍາຍຮູບ' : 'Click to zoom'}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4 space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-300">
                          {currentLang === 'lo' ? 'ໂອນເງິນຜ່ານທະນາຄານ (Bank Transfer)' : 'Bank Transfer'}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400">
                          Ref: SSP-TXN-{Math.floor(100000 + Math.random() * 900000)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Amount Breakdown */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{currentLang === 'lo' ? 'ຍອດລວມຄ່າສິນຄ້າ:' : 'Subtotal:'}</span>
                      <span className="font-bold text-slate-200 font-mono">{formatLAK(totalAmountLAK)}</span>
                    </div>
                    <div className="flex justify-between text-amber-400 font-bold border-t border-slate-800/80 pt-1">
                      <span>{currentLang === 'lo' ? 'ຍອດທີ່ຕ້ອງຊຳລະ (LAK):' : 'Total Amount (LAK):'}</span>
                      <span className="font-black text-sm font-mono">{formatLAK(totalAmountLAK)}</span>
                    </div>
                  </div>
                </div>

                {/* Accept / Revert Buttons for Step 1 Payment */}
                <div className="pt-2">
                  {isPaymentConfirmed ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 py-3 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-black flex items-center justify-center gap-2 shadow-inner">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{currentLang === 'lo' ? 'ຢືນຢັນການຊຳຣະເງິນແລ້ວ' : 'Payment Verified'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (handleStatusChange) handleStatusChange(order.id, 'PENDING');
                          showToast(currentLang === 'lo' ? 'ຍົກເລີກການຢືນຢັນສະລິບແລ້ວ' : 'Reverted payment confirmation', 'info');
                        }}
                        className="py-3 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
                        title="Revert / Cancel payment status"
                      >
                        <span>ຍົກເລີກ</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (handleStatusChange) handleStatusChange(order.id, 'PREPRESS_CHECK');
                          showToast(
                            currentLang === 'lo' 
                              ? 'ຢືນຢັນຮັບອໍເດີ & ຊຳຣະເງິນຖືກຕ້ອງແລ້ວ! ສົ່ງຕໍ່ຝ່າຍ Pre-Press' 
                              : 'Order accepted & payment verified! Handed over to Pre-Press', 
                            'success'
                          );
                        }}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-none"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{currentLang === 'lo' ? 'ຢືນຢັນຮັບອໍເດີ & ສະລິບຖືກຕ້ອງ' : 'Confirm & Accept Order'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const reason = prompt(currentLang === 'lo' ? 'ລະບຸເຫດຜົນທີ່ສະລິບບໍ່ຖືກຕ້ອງ:' : 'Reason for slip rejection:');
                          if (reason) {
                            showToast(currentLang === 'lo' ? 'ແຈ້ງເຕືອນລູກຄ້າໃຫ້ສົ່ງສະລິບໃໝ່ແລ້ວ' : 'Customer notified to re-upload slip', 'warning');
                          }
                        }}
                        className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-800 text-xs font-bold transition active:scale-95 cursor-pointer"
                        title="Reject Slip"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Customer Profile & Attached Artwork File Links (7 of 12 cols) */}
              <div className="lg:col-span-7 rounded-2xl bg-slate-950/80 border border-slate-800 p-5 flex flex-col justify-between space-y-4">
                <div>
                  {/* Customer Contact Card */}
                  <div className="flex items-center justify-between text-xs font-black mb-3 border-b border-slate-800 pb-2">
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      {currentLang === 'lo' ? 'ຂໍ້ມູນຜູ້ສັ່ງຊື້ & ຈັດສົ່ງ' : 'Customer Contact'}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {customerPhone}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 mb-4">
                    <div>
                      <span className="text-slate-400 block text-[10.5px]">{currentLang === 'lo' ? 'ຊື່ລູກຄ້າ:' : 'Customer Name:'}</span>
                      <strong className="text-slate-100 block text-sm">{customerName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10.5px]">{currentLang === 'lo' ? 'ເບີໂທຕິດຕໍ່:' : 'Phone:'}</span>
                      <a href={`tel:${customerPhone}`} className="text-amber-400 font-mono font-bold block hover:underline">
                        {customerPhone}
                      </a>
                    </div>
                    <div className="sm:col-span-2 border-t border-slate-800/80 pt-2 mt-1">
                      <span className="text-slate-400 block text-[10.5px]">{currentLang === 'lo' ? 'ສະຖານທີ່ຈັດສົ່ງ:' : 'Delivery Address:'}</span>
                      <span className="text-slate-200 block font-medium">{deliveryAddress}</span>
                    </div>
                  </div>

                  {/* Attached Customer Artwork File (Google Drive / Canva / Cloud File) */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-slate-900 border border-blue-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-300 flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        {currentLang === 'lo' ? 'ໄຟລ໌ງານພິມທີ່ລູກຄ້າແນບມາ (Customer Artwork File)' : 'Customer Artwork File'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold">
                        Cloud Ready
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-200 block truncate font-mono">
                          {order.driveLink || order.googleDriveLink || `artwork_SSP_${orderIdDisplay}_master.pdf`}
                        </span>
                        <span className="text-[10.5px] text-slate-400 block mt-0.5">
                          Google Drive / Canva Print Ready Vector • CMYK Profile
                        </span>
                      </div>

                      <a
                        href={order.driveLink || order.googleDriveLink || '#'}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          if (!order.driveLink && !order.googleDriveLink) {
                            e.preventDefault();
                            showToast(currentLang === 'lo' ? 'ເປີດໄຟລ໌ຕົວຢ່າງ Artwork ສຳເລັດ' : 'Opened artwork file', 'info');
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md border-none"
                      >
                        <span>{currentLang === 'lo' ? 'ເປີດໄຟລ໌ງານ' : 'Open Artwork'}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Pre-Press Approval Action Button (Step 2) */}
                <div className="pt-2">
                  {isArtworkApproved ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 py-3 px-4 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-black flex items-center justify-center gap-2 shadow-inner">
                        <Printer className="w-4 h-4" />
                        <span>{currentLang === 'lo' ? 'ໄຟລ໌ພ້ອມພິມ & ກຳລັງດຳເນີນການຜະລິດ' : 'In Production Queue'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (handleStatusChange) handleStatusChange(order.id, 'PREPRESS_CHECK');
                          showToast(currentLang === 'lo' ? 'ຍົກເລີກການອະນຸມັດໄຟລ໌ (ກັບສູ່ຂັ້ນຕອນກວດໄຟລ໌)' : 'Reverted artwork approval', 'info');
                        }}
                        className="py-3 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
                        title="Revert / Edit artwork"
                      >
                        <span>ແກ້ໄຂ</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (handleStatusChange) {
                          handleStatusChange(order.id, 'IN_PRODUCTION');
                        }
                        showToast(
                          currentLang === 'lo' 
                            ? 'ຢືນຢັນໄຟລ໌ພິມ & ສັ່ງຜະລິດແລ້ວ! (ຕັດສະຕັອກເຈ້ຍ & ໝຶກອັດຕະໂນມັດ)' 
                            : 'Artwork approved & sent to press! Stock deducted automatically', 
                          'success'
                        );
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-none"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{currentLang === 'lo' ? 'ຢືນຢັນໄຟລ໌ & ສັ່ງຜະລິດ (Send to Press Queue)' : 'Approve Artwork & Release to Press'}</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 3. SHOPEE-STYLE 3-BLOCK TRACKING SYSTEM (LIGHT THEME) */}
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
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Pass
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending
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
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Done
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
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Complete
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
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Passed QC
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
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95 mt-4 cursor-pointer"
              >
                Advance Production ({order.status})
              </button>
            )}
          </div>

          {/* BLOCK 2: SHIPPING & DELIVERY PROCESS (ຂະບວນການຈັດສົ່ງ) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsShippingLabelOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition"
                    title="ພິມໃບປະໜ້າ"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>{currentLang === 'lo' ? 'ໃບປະໜ້າ' : 'Label'}</span>
                  </button>
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
              </div>

              {/* Courier & Tracking Input Panel */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  {currentLang === 'lo' ? 'ຈັດການຂໍ້ມູນຂົນສົ່ງ & ເລກພັດສະດຸ' : 'Courier & Tracking Management'}
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      {currentLang === 'lo' ? 'ບໍລິສັດຂົນສົ່ງ' : 'Courier'}
                    </label>
                    <select
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Anousith Express">Anousith Express (ອານຸສິດ)</option>
                      <option value="HAL Logistics">HAL Logistics (ຮຸ່ງອາລຸນ)</option>
                      <option value="Mixay Express">Mixay Express (ມີໄຊ)</option>
                      <option value="Kerry Lao">Kerry Lao (ເຄີຣີ)</option>
                      <option value="J&T Express">J&T Express</option>
                      <option value="Flash Express">Flash Express</option>
                      <option value="Pick-up at Shop">ຮັບເອງທີ່ຮ້ານ (Pick-up)</option>
                      {couriers.map((c: any) => (
                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      {currentLang === 'lo' ? 'ຄ່າຈັດສົ່ງ (LAK)' : 'Shipping Fee (LAK)'}
                    </label>
                    <input
                      type="number"
                      value={shippingFeeVal}
                      onChange={(e) => setShippingFeeVal(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 block">
                    {currentLang === 'lo' ? 'ເລກພັດສະດຸ (Tracking Number)' : 'Tracking Number'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={trackingNo}
                      onChange={(e) => setTrackingNo(e.target.value)}
                      placeholder={currentLang === 'lo' ? 'ປ້ອນເລກພັດສະດຸ...' : 'Enter tracking number...'}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    {trackingNo && (
                      <button
                        type="button"
                        onClick={handleCopyTracking}
                        className="p-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs transition cursor-pointer"
                        title="Copy tracking"
                      >
                        {copiedTracking ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveTracking}
                      disabled={isSavingTracking}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingTracking ? (currentLang === 'lo' ? '...' : '...') : (currentLang === 'lo' ? 'ບັນທຶກ' : 'Save')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-steps tick list */}
              <div className="space-y-3 pt-2">
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
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ready
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
                      <span className="text-[10px] text-slate-500 block font-mono">{courierName} {trackingNo ? `(#${trackingNo})` : ''}</span>
                    </div>
                  </div>
                  {isShippingStepDone('dispatched') ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Dispatched
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
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Delivered
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
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95 mt-4 flex items-center justify-center gap-2 cursor-pointer"
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
                    <DollarSign className={`w-3.5 h-3.5 ${isPaymentStepDone('deposit') ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold block text-slate-900">Deposit Received</span>
                      <span className="text-[10px] text-slate-500 block font-mono">Paid: {formatLAK(paidAmount)}</span>
                    </div>
                  </div>
                  {isPaymentStepDone('deposit') ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Received
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
                    <CreditCard className={`w-3.5 h-3.5 ${isPaymentStepDone('full_settle') ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold block text-slate-900">Full Settlement</span>
                      <span className="text-[10px] text-slate-500 block font-mono">Remaining: {formatLAK(remainingUnpaid)}</span>
                    </div>
                  </div>
                  {isPaymentStepDone('full_settle') ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Fully Paid
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
                    <ShieldCheck className={`w-3.5 h-3.5 ${isPaymentStepDone('clearance') ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold block text-slate-950">Financial Clearance</span>
                      <span className="text-[10px] text-slate-500 block font-mono">Zero Balance Due</span>
                    </div>
                  </div>
                  {isPaymentStepDone('clearance') ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Cleared
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
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95 mt-4 cursor-pointer"
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
              className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl text-xs font-black transition active:scale-95 shadow-sm cursor-pointer"
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
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-black transition active:scale-95 shadow-sm cursor-pointer"
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

      {/* Shipping Label Modal */}
      {isShippingLabelOpen && (
        <ShippingLabelModal
          isOpen={isShippingLabelOpen}
          onClose={() => setIsShippingLabelOpen(false)}
          order={order}
        />
      )}

      {/* Edit Order Specs & Info Modal */}
      {isEditModalOpen && (
        <EditOrderModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          order={order}
          inventory={inventory || contextInventory}
          equipment={equipment || contextEquipment}
          formatCurrency={formatLAK}
          onSave={(updated) => {
            if (contextUpdateOrderDetails) {
              contextUpdateOrderDetails(updated.id, updated);
            }
            setIsEditModalOpen(false);
            showToast(
              currentLang === 'lo' ? 'ອັບເດດລາຍລະອຽດອໍເດີສຳເລັດ!' : 'Order details updated successfully!',
              'success'
            );
          }}
        />
      )}

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
}
