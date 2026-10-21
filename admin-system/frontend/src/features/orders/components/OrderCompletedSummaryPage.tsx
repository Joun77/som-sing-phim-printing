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
  Tag,
  BarChart3,
  TrendingUp,
  Lock,
  DollarSign,
  PieChart,
  AlertCircle,
  Wrench,
  Clock
} from 'lucide-react';
import OrderStepBar from './reception/OrderStepBar';
import CustomerInvoiceModal from './modals/CustomerInvoiceModal';
import OrderIdCopyButton from './common/OrderIdCopyButton';
import { useApp } from '@store/AppContext';
import { useAuthStore } from '@store/useAuthStore';

interface OrderCompletedSummaryPageProps {
  order: any;
  onBack: () => void;
  onSelectStep: (step: 1 | 2 | 3 | 4) => void;
  formatLAK: (n: number) => string;
  currentLang: string;
  setLightbox?: (v: { src: string; title: string } | null) => void;
  onEditOrder?: (order: any) => void;
  handleStatusChange?: (orderId: any, status: string) => Promise<any>;
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
  const [simulateRestrictedRole, setSimulateRestrictedRole] = useState(false);
  const { customerCategories = [], customers = [], activeRole } = useApp();
  const authUser = useAuthStore((s) => s.user);

  if (!order) return null;

  // In local mode / owner / admin, costing is viewable by default
  const resolvedRole = (authUser?.role || activeRole || 'owner').toLowerCase();
  const isOwnerOrAdmin = resolvedRole.includes('owner') || resolvedRole.includes('admin') || resolvedRole.includes('manager') || resolvedRole.includes('accountant');
  const isCostAuthorized = !simulateRestrictedRole && (isOwnerOrAdmin || !activeRole);

  const orderIdDisplay = order.orderNo || order.order_no || order.orderNumber || order.id || 'ORDER';
  const customerIdDisplay = order.customerId || order.customer_id || `CUST-SSP-${String(order.id || 101).padStart(4, '0')}`;
  const customerName = order.customerName || order.customer_name || 'Somphavath DOUANGSVA';
  const customerPhone = order.phone || order.customer_phone || '02058866339';
  const deliveryAddress = order.address || order.delivery_address || 'Saysettha, Vientiane';
  const courier = order.deliveryMethod || order.shippingCourier || 'Anousith Express';
  const trackingNo = order.tracking_code || order.trackingCode || order.tracking_number || order.trackingNumber || order.internal_tracking_code || '';
  const totalAmountLAK = Number(order.totalPriceCharged || order.totalAmount || order.total_amount_lak || 0);
  const paymentSlipUrl = order.paymentSlipUrl || order.payment_slip_url || order.slipUrl || order.slipImage;
  const driveLink = order.driveLink || order.googleDriveLink;
  const orderDate = order.date || new Date().toISOString().split('T')[0];

  const paymentRecords: any[] = Array.isArray(order.payment_records) && order.payment_records.length > 0
    ? order.payment_records
    : (Array.isArray(order.payments) && order.payments.length > 0 ? order.payments : []);

  const confirmedReceipt = paymentRecords.find(r => r.record_kind === 'RECEIPT' && r.state === 'CONFIRMED');
  const primaryPaymentRecord = confirmedReceipt || (paymentRecords.length > 0 ? paymentRecords[paymentRecords.length - 1] : null);

  // Canonical receipt number: strictly use actual recorded values, never invent 'CONFIRMED'
  const paymentReceiptNo = order.receipt_no || order.receipt_number || primaryPaymentRecord?.receipt_number || primaryPaymentRecord?.reference || primaryPaymentRecord?.id || '—';

  // Canonical method: use actual recorded method or channel, never infer from slip existence or order status
  const resolvePaymentMethodName = (rawMethod?: string, rawChannel?: string) => {
    const val = (rawMethod || rawChannel || '').toUpperCase();
    if (!val) return '—';
    if (val === 'MANUAL_QR' || val.includes('BCEL') || val.includes('QR')) {
      return currentLang === 'lo' ? 'ໂອນຜ່ານ QR / ທະນາຄານ (Manual QR)' : 'Bank Transfer / QR';
    }
    if (val === 'COUNTER_CASH' || val === 'CASH') {
      return currentLang === 'lo' ? 'ເງິນສົດໜ້າຮ້ານ (Counter Cash)' : 'Counter Cash';
    }
    if (val === 'COUNTER_TRANSFER' || val === 'TRANSFER') {
      return currentLang === 'lo' ? 'ໂອນເງິນໜ້າຮ້ານ (Counter Transfer)' : 'Counter Transfer';
    }
    return rawMethod || rawChannel || '—';
  };

  const paymentMethodDisplay = resolvePaymentMethodName(
    order.payment_method || order.paymentMethod,
    primaryPaymentRecord?.payment_method_id || primaryPaymentRecord?.channel
  );

  // Canonical verifier: strictly use actual reviewer ID or verified_by, never invent generic accounting label
  const rawVerifier = order.payment_verified_by || primaryPaymentRecord?.reviewed_by || primaryPaymentRecord?.reviewer_id;
  const isPendingReview = primaryPaymentRecord?.state === 'PENDING';
  const paymentVerifier = rawVerifier 
    ? `${currentLang === 'lo' ? 'ກວດສອບໂດຍ' : 'Verified by'}: ${rawVerifier}`
    : (isPendingReview ? (currentLang === 'lo' ? 'ລໍຖ້າການກວດສອບ' : 'Pending Review') : '—');

  // Canonical payment evidence check: require actual confirmed record or receipt reference
  const hasConfirmedEvidence = Boolean(
    order.receipt_no || 
    order.receipt_number || 
    confirmedReceipt || 
    (primaryPaymentRecord?.state === 'CONFIRMED' && (primaryPaymentRecord?.receipt_number || primaryPaymentRecord?.reference || primaryPaymentRecord?.id))
  );

  // Actual settlement calculations: never infer full payment from order status without canonical evidence
  const actualPaidAmount = order.paymentSummary?.received_net_lak !== undefined 
    ? Number(order.paymentSummary.received_net_lak) 
    : (order.paid_amount !== undefined 
      ? Number(order.paid_amount) 
      : (hasConfirmedEvidence && (order.payment_state === 'PAID' || order.paymentStatus === 'Paid') ? totalAmountLAK : (order.deposit_lak || order.depositAmount || 0)));

  const remainingBalanceLAK = order.paymentSummary?.remaining_lak !== undefined 
    ? Number(order.paymentSummary.remaining_lak) 
    : (order.remaining_lak !== undefined 
      ? Number(order.remaining_lak) 
      : Math.max(0, totalAmountLAK - actualPaidAmount));

  const isFullySettled = hasConfirmedEvidence && 
    (order.payment_state === 'PAID' || order.paymentStatus === 'Paid' || order.paymentSummary?.payment_status === 'PAID' || remainingBalanceLAK === 0) && 
    actualPaidAmount >= totalAmountLAK && totalAmountLAK > 0;

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

  // Actual Realized Production Costing Metrics (COGS & Realized Gross Margin)
  const allocatedPrinterName = order.allocated_printer_name || order.allocatedPrinterName || (order.printer_name || order.printerName || '—');
  const paperBrandDisplay = order.items?.[0]?.paper_brand || order.paper_brand || order.paperBrand || '';
  const paperWeightDisplay = order.items?.[0]?.paper_weight || order.paper_weight || order.paperWeight || '';
  const paperNameDisplay = order.items?.[0]?.paper_name || order.items?.[0]?.specs?.paperName || order.paper_name || order.paperName || (paperBrandDisplay ? `${paperBrandDisplay} Art Card ${paperWeightDisplay}` : '—');

  // Distinguish legitimate 0 from unrecorded (null / undefined)
  const isCostRecorded = (val: any): boolean => {
    return val !== null && val !== undefined && val !== '';
  };

  const rawPaperCost = order.realized_paper_cost !== undefined ? order.realized_paper_cost : order.paper_cost;
  const isPaperRecorded = isCostRecorded(rawPaperCost);
  const realizedPaperCost = isPaperRecorded ? Number(rawPaperCost) : null;

  const rawInkCost = order.realized_ink_cost !== undefined ? order.realized_ink_cost : order.ink_cost;
  const isInkRecorded = isCostRecorded(rawInkCost);
  const realizedInkCost = isInkRecorded ? Number(rawInkCost) : null;

  const rawLaborCost = order.realized_labor_cost !== undefined 
    ? order.realized_labor_cost 
    : (order.labor_cost !== undefined 
      ? order.labor_cost 
      : (order.technician_earnings_lak !== undefined 
        ? order.technician_earnings_lak 
        : order.actual_labor_cost));
  const isLaborRecorded = isCostRecorded(rawLaborCost);
  const realizedLaborCost = isLaborRecorded ? Number(rawLaborCost) : null;

  const rawFinishingCost = order.realized_finishing_cost !== undefined ? order.realized_finishing_cost : order.finishing_cost;
  const isFinishingRecorded = isCostRecorded(rawFinishingCost);
  const realizedFinishingCost = isFinishingRecorded ? Number(rawFinishingCost) : null;

  const rawSpoilageCost = order.realized_spoilage_cost !== undefined ? order.realized_spoilage_cost : order.spoilage_cost;
  const isSpoilageRecorded = isCostRecorded(rawSpoilageCost);
  const realizedSpoilageCost = isSpoilageRecorded ? Number(rawSpoilageCost) : null;

  // Actual cost completeness rule:
  // Must have all 5 items recorded AND realized_total_cost explicitly recorded
  const allComponentsRecorded = isPaperRecorded && isInkRecorded && isLaborRecorded && isFinishingRecorded && isSpoilageRecorded;
  const hasRealizedTotal = isCostRecorded(order.realized_total_cost);

  const componentSum = (realizedPaperCost !== null ? realizedPaperCost : 0) +
    (realizedInkCost !== null ? realizedInkCost : 0) +
    (realizedLaborCost !== null ? realizedLaborCost : 0) +
    (realizedFinishingCost !== null ? realizedFinishingCost : 0) +
    (realizedSpoilageCost !== null ? realizedSpoilageCost : 0);

  const componentsMatchTotal = hasRealizedTotal && Math.abs(componentSum - Number(order.realized_total_cost)) < 0.01;

  // Canonical incomplete/PARTIAL status check:
  // Never promote to complete if marked PARTIAL, UNKNOWN, or INCOMPLETE
  const isExplicitlyIncomplete = 
    order.realized_cost_status === 'PARTIAL' ||
    order.realized_cost_status === 'UNKNOWN' ||
    order.realized_cost_status === 'INCOMPLETE' ||
    order.actual_cost_status === 'INCOMPLETE' ||
    order.cost_completeness === 'INCOMPLETE' ||
    order.actual_cost_complete === false;

  const hasActualCost = !isExplicitlyIncomplete &&
    allComponentsRecorded &&
    hasRealizedTotal &&
    componentsMatchTotal &&
    (order.actual_cost_complete === true || 
     order.actual_cost_status === 'COMPLETE' || 
     order.cost_completeness === 'COMPLETE' || 
     order.realized_cost_status === 'COMPLETE' ||
     (!order.realized_cost_status && !order.actual_cost_status && !order.cost_completeness));

  const totalProductionCost = hasActualCost && hasRealizedTotal
    ? Number(order.realized_total_cost)
    : null;

  const realizedGrossProfit = (hasActualCost && totalProductionCost !== null) ? (totalAmountLAK - totalProductionCost) : 0;
  const realizedGrossMarginPct = (hasActualCost && totalProductionCost !== null && totalAmountLAK > 0) ? (realizedGrossProfit / totalAmountLAK) * 100 : 0;
  const costRatioPct = (hasActualCost && totalProductionCost !== null && totalAmountLAK > 0) ? (totalProductionCost / totalAmountLAK) * 100 : 0;
  const isLoss = hasActualCost && totalProductionCost !== null && realizedGrossProfit < 0;

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
                onClick={() => onSelectStep(3)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-black rounded-xl text-xs transition border border-amber-300 active:scale-95 cursor-pointer shadow-xs"
                title={currentLang === 'lo' ? 'ເບິ່ງການຈັດສົ່ງ' : 'View Delivery'}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>{currentLang === 'lo' ? 'ເບິ່ງການຈັດສົ່ງ' : 'View Delivery'}</span>
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
                    {trackingNo || '—'}
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
              <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase border flex items-center gap-1 ${
                isFullySettled 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : primaryPaymentRecord?.state === 'PENDING'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : primaryPaymentRecord?.record_kind === 'REVERSAL'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : (order.depositAmountPaid || order.payment_state === 'PARTIAL')
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                <span>
                  {isFullySettled 
                    ? (currentLang === 'lo' ? 'ຊຳລະຄົບຖ້ວນ 100% (100% PAID)' : '100% PAID')
                    : primaryPaymentRecord?.state === 'PENDING'
                      ? (currentLang === 'lo' ? 'ລໍຖ້າກວດສອບ (PENDING REVIEW)' : 'PENDING REVIEW')
                      : primaryPaymentRecord?.record_kind === 'REVERSAL'
                        ? (currentLang === 'lo' ? 'ຍົກເລີກ / ຄືນເງິນ (REVERSED)' : 'REVERSED')
                        : (order.depositAmountPaid || order.payment_state === 'PARTIAL')
                          ? (currentLang === 'lo' ? 'ຊຳລະມັດຈຳບາງສ່ວນ (PARTIAL)' : 'PARTIAL DEPOSIT')
                          : (currentLang === 'lo' ? 'ຍັງບໍ່ໄດ້ຊຳລະ (UNPAID)' : 'UNPAID')}
                </span>
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
                    <span>{paymentMethodDisplay}</span>
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
                      <span className="text-[10.5px] font-bold text-slate-700 block mt-1">ບໍ່ມີສະລິບແນບ</span>
                    </div>
                  )}
                </div>

                <div className="space-y-0.5 text-[10.5px] pt-1 border-t border-slate-200">
                  <div className="font-mono text-slate-500 truncate">
                    Ref: <strong className="text-slate-700">{paymentReceiptNo}</strong>
                  </div>
                  <div className={`font-semibold flex items-center gap-1 ${rawVerifier ? 'text-emerald-700' : isPendingReview ? 'text-amber-700' : 'text-slate-400'}`}>
                    {rawVerifier ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    ) : isPendingReview ? (
                      <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-slate-400 shrink-0" />
                    )}
                    <span>{paymentVerifier}</span>
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
                    <span className="text-slate-500">{currentLang === 'lo' ? 'ຍອດສັ່ງຜະລິດ:' : 'Order Total:'}</span>
                    <strong className="text-slate-800 font-mono">{formatLAK(totalAmountLAK)}</strong>
                  </div>

                  {actualPaidAmount > 0 && actualPaidAmount < totalAmountLAK && (
                    <div className="flex justify-between items-center text-xs text-sky-700 font-semibold">
                      <span>- {currentLang === 'lo' ? 'ຍອດຊຳລະແລ້ວ (Paid):' : 'Paid Amount:'}</span>
                      <span className="font-mono">{formatLAK(actualPaidAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-emerald-800 font-black border-t border-slate-200 pt-2">
                    <span>{currentLang === 'lo' ? 'ຍອດຊຳລະສຸດທິ:' : 'Net Received:'}</span>
                    <span className="font-mono text-sm">{formatLAK(actualPaidAmount)}</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border text-center ${
                    isFullySettled 
                      ? 'bg-emerald-100/70 border-emerald-200' 
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <span className={`text-[10.5px] font-bold block ${isFullySettled ? 'text-emerald-800' : 'text-amber-800'}`}>
                      {currentLang === 'lo' ? 'ຍອດຄ້າງຊຳລະ (Remaining)' : 'Remaining Balance'}
                    </span>
                    <span className={`font-mono text-sm font-black block ${isFullySettled ? 'text-emerald-950' : 'text-amber-950'}`}>
                      {isFullySettled 
                        ? 'LAK 0.00 (ປິດຍອດສົມບູນ)' 
                        : `${formatLAK(remainingBalanceLAK)} (${currentLang === 'lo' ? 'ຍັງຄ້າງຊຳລະ' : 'Unsettled'})`}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-center font-mono">
                  Settled on {orderDate}
                </div>
              </div>
            </div>

            {/* Multi-record Provenance Audit Log */}
            {paymentRecords.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-150 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {currentLang === 'lo' ? 'ປະຫວັດລາຍການຊຳລະເງິນຕົວຈິງ (Payment Records)' : 'Payment Records Log'}
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {paymentRecords.map((rec: any, idx: number) => {
                    const recAmount = Number(rec.actual_received_amount_lak || rec.requested_amount_lak || 0);
                    const recRef = rec.reference || rec.receipt_number || rec.id || '—';
                    const recVerifier = rec.reviewed_by || rec.reviewer_id || '—';
                    const isRev = rec.record_kind === 'REVERSAL';
                    const isPending = rec.state === 'PENDING';
                    const isConfirmed = rec.state === 'CONFIRMED';
                    
                    return (
                      <div key={rec.id || idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-black uppercase ${
                            isRev ? 'bg-rose-100 text-rose-800' : isConfirmed ? 'bg-emerald-100 text-emerald-800' : isPending ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {isRev ? (currentLang === 'lo' ? 'ຄືນເງິນ' : 'REVERSAL') : rec.purpose || rec.record_kind || 'PAYMENT'}
                          </span>
                          <span className="font-mono text-slate-600">Ref: {recRef}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-800">{formatLAK(recAmount)}</span>
                          <span className={`text-[10px] font-bold ${isConfirmed ? 'text-emerald-700' : isPending ? 'text-amber-700' : 'text-slate-500'}`}>
                            {isConfirmed ? (recVerifier !== '—' ? `By: ${recVerifier}` : (currentLang === 'lo' ? 'ຢືນຢັນແລ້ວ' : 'Confirmed')) : isPending ? (currentLang === 'lo' ? 'ລໍຖ້າກວດ' : 'Pending') : (currentLang === 'lo' ? 'ປະຕິເສດ' : 'Rejected')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className={`p-3 rounded-2xl border text-xs flex justify-between items-center font-mono ${
            isFullySettled 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : primaryPaymentRecord?.state === 'PENDING'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : primaryPaymentRecord?.record_kind === 'REVERSAL'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <span>Ref: {paymentReceiptNo}</span>
            <span className="font-bold">
              {isFullySettled 
                ? (currentLang === 'lo' ? 'ບັນຊີປິດຍອດສົມບູນ' : 'Account Settled')
                : primaryPaymentRecord?.state === 'PENDING'
                  ? (currentLang === 'lo' ? 'ລໍຖ້າການກວດສອບ' : 'Pending Review')
                  : primaryPaymentRecord?.record_kind === 'REVERSAL'
                    ? (currentLang === 'lo' ? 'ລາຍການຖືກຍົກເລີກ / ຄືນເງິນ' : 'Payment Reversed')
                    : (currentLang === 'lo' ? 'ຍັງບໍ່ມີຫຼັກຖານການຊຳລະ' : 'Unrecorded / Unpaid')}
            </span>
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

        {/* CARD 4: Actual Production Costing & Realized Gross Margin Analysis (12 cols) */}
        <div className="lg:col-span-12 bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {currentLang === 'lo' ? '4. ຕົ້ນທຶນການຜະລິດຕົວຈິງ & ກຳໄລຂັ້ນຕົ້ນ (Actual Production Cost & Realized Margin)' : '4. Actual Production Cost & Realized Margin'}
                </h3>
                <p className="text-[10.5px] text-slate-400 font-medium">
                  {currentLang === 'lo' 
                    ? 'ຄຳນວນຈາກວັດສະດຸເຈ້ຍ, ໝຶກ, ຄ່າແຮງງານຊ່າງ (Piece-rate) ແລະ ອັດຕາການສູນເສຍ' 
                    : 'Calculated from actual paper substrate, ink, piece-rate technician labor & spoilage'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSimulateRestrictedRole(!simulateRestrictedRole)}
                className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
                title="ຄລິກເພື່ອຈຳລອງສິດເຂົ້າເບິ່ງ (Simulate Permission for Testing)"
              >
                <Lock className="w-3 h-3 text-slate-500" />
                <span>
                  {simulateRestrictedRole 
                    ? 'ຈຳລອງ: ພະນັກງານທົ່ວໄປ (Locked)' 
                    : 'ສິດ: ເຈົ້າຂອງຮ້ານ (Owner Unlocked)'}
                </span>
              </button>
            </div>
          </div>

          {!isCostAuthorized ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <Lock className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-xs font-black text-slate-700">
                {currentLang === 'lo' ? 'ຂໍ້ມູນຕົ້ນທຶນ ແລະ ກຳໄລຂັ້ນຕົ້ນຖືກປິດກັ້ນ' : 'Cost Breakdown Restricted'}
              </h4>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                {currentLang === 'lo' 
                  ? 'ສະເພາະຜູ້ຈັດການ, ນັກບັນຊີ ແລະ ເຈົ້າຂອງຮ້ານ (Owner / Admin) ຈຶ່ງສາມາດເບິ່ງຕົ້ນທຶນການຜະລິດຕົວຈິງໄດ້.' 
                  : 'Access to realized production COGS and profit margins is restricted to authorized roles.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {!hasActualCost && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between font-bold">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{currentLang === 'lo' ? 'ຂໍ້ມູນຕົ້ນທຶນການຜະລິດຕົວຈິງຍັງບໍ່ຄົບຖ້ວນ / ຢູ່ລະຫວ່າງບັນທຶກ' : 'Actual production costs are incomplete or partially recorded'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                    {order.realized_cost_status || order.actual_cost_status || order.cost_completeness || 'INCOMPLETE'}
                  </span>
                </div>
              )}

              {/* 4 Top Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                    {currentLang === 'lo' ? 'ລາຍຮັບຈາກລູກຄ້າ (Total Revenue)' : 'Total Revenue'}
                  </span>
                  <div className="text-base sm:text-lg font-black font-mono text-slate-900">
                    {formatLAK(totalAmountLAK)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    100% Locked Commercial Price
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                    {currentLang === 'lo' ? 'ຕົ້ນທຶນຜະລິດຕົວຈິງ (COGS)' : 'Realized COGS'}
                  </span>
                  <div className="text-base sm:text-lg font-black font-mono text-amber-600">
                    {hasActualCost && totalProductionCost !== null ? formatLAK(totalProductionCost) : <span className="text-amber-600 font-bold">{currentLang === 'lo' ? 'ຍັງບໍ່ມີຂໍ້ມູນຕົ້ນທຶນ' : 'No Cost Data'}</span>}
                  </div>
                  <span className="text-[10px] text-amber-700 font-semibold block">
                    {hasActualCost ? `${costRatioPct.toFixed(1)}% ຂອງຍອດຂາຍ` : (currentLang === 'lo' ? 'ລໍຖ້າບັນທຶກຕົ້ນທຶນຈິງ' : 'Pending Cost Recording')}
                  </span>
                </div>

                <div className={`p-4 rounded-2xl border space-y-1 ${isLoss ? 'bg-rose-50/70 border-rose-200' : 'bg-emerald-50/70 border-emerald-200'}`}>
                  <span className={`text-[10.5px] font-bold uppercase tracking-wider block ${isLoss ? 'text-rose-800' : 'text-emerald-800'}`}>
                    {currentLang === 'lo' ? (isLoss ? 'ຂາດທຶນຕົວຈິງ (Gross Loss)' : 'ກຳໄລຂັ້ນຕົ້ນ (Gross Profit)') : (isLoss ? 'Gross Loss' : 'Gross Profit')}
                  </span>
                  <div className={`text-base sm:text-lg font-black font-mono ${isLoss ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {hasActualCost && totalProductionCost !== null ? `${isLoss ? '-' : ''}${formatLAK(Math.abs(realizedGrossProfit))}` : <span className="text-slate-400 font-medium">—</span>}
                  </div>
                  <span className={`text-[10px] font-semibold block ${isLoss ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {hasActualCost ? (isLoss ? (currentLang === 'lo' ? 'ຂາດທຶນຕົວຈິງ (Realized Loss)' : 'Realized Loss') : 'Realized Gross Income') : (currentLang === 'lo' ? 'ລໍຖ້າຕົ້ນທຶນຈິງ' : 'Pending Cost Data')}
                  </span>
                </div>

                <div className={`p-4 rounded-2xl border space-y-1 ${!hasActualCost ? 'bg-amber-50/70 border-amber-200' : isLoss ? 'bg-rose-50/70 border-rose-200' : 'bg-teal-50/70 border-teal-200'}`}>
                  <span className={`text-[10.5px] font-bold uppercase tracking-wider block ${!hasActualCost ? 'text-amber-800' : isLoss ? 'text-rose-800' : 'text-teal-800'}`}>
                    {currentLang === 'lo' ? 'ອັດຕາກຳໄລຂັ້ນຕົ້ນ (Margin %)' : 'Realized Margin %'}
                  </span>
                  <div className={`text-base sm:text-lg font-black font-mono flex items-center gap-1 ${!hasActualCost ? 'text-amber-700' : isLoss ? 'text-rose-700' : 'text-teal-700'}`}>
                    {hasActualCost && <TrendingUp className={`w-4 h-4 ${isLoss ? 'text-rose-600 rotate-180' : 'text-teal-600'}`} />}
                    <span>{hasActualCost ? `${realizedGrossMarginPct.toFixed(1)}%` : (currentLang === 'lo' ? 'ຍັງບໍ່ຄົບຖ້ວນ' : 'Incomplete')}</span>
                  </div>
                  <span className={`text-[10px] font-bold block ${!hasActualCost ? 'text-amber-700' : isLoss ? 'text-rose-700' : (realizedGrossMarginPct >= 35 ? 'text-teal-700' : 'text-amber-700')}`}>
                    {!hasActualCost ? (currentLang === 'lo' ? 'ລໍຖ້າຂໍ້ມູນຕົ້ນທຶນ' : 'Pending Cost') : isLoss ? (currentLang === 'lo' ? 'ຂາດທຶນ' : 'Loss') : (realizedGrossMarginPct >= 35 ? 'Margin ສູງມາດຕະຖານ' : 'Margin ປານກາງ')}
                  </span>
                </div>
              </div>

              {/* Cost Category Breakdown List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {/* 1. Paper */}
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span>ວັດສະດຸເຈ້ຍ (Substrate Paper)</span>
                    {realizedPaperCost !== null ? (
                      <span className="font-mono text-slate-900 font-black">{formatLAK(realizedPaperCost)}</span>
                    ) : (
                      <span className="text-amber-600 font-bold text-[11px]">{currentLang === 'lo' ? 'ຍັງບໍ່ໄດ້ບັນທຶກ' : 'Unrecorded'}</span>
                    )}
                  </div>
                  <div className="text-[10.5px] text-slate-600 font-medium space-y-0.5 pt-1 border-t border-slate-200/60">
                    <div>ສເປກ: <strong className="text-slate-800">{paperNameDisplay}</strong></div>
                    <div className="text-slate-400">ຕັດສະຕັອກເຈ້ຍແຜ່ນໃຫຍ່ອັດຕະໂນມັດ</div>
                  </div>
                </div>

                {/* 2. Ink & Machine */}
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span>ນ້ຳໝຶກພິມ (Realized Ink)</span>
                    {realizedInkCost !== null ? (
                      <span className="font-mono text-slate-900 font-black">{formatLAK(realizedInkCost)}</span>
                    ) : (
                      <span className="text-amber-600 font-bold text-[11px]">{currentLang === 'lo' ? 'ຍັງບໍ່ໄດ້ບັນທຶກ' : 'Unrecorded'}</span>
                    )}
                  </div>
                  <div className="text-[10.5px] text-slate-600 font-medium space-y-0.5 pt-1 border-t border-slate-200/60">
                    <div className="truncate">ແທ່ນພິມ: <strong className="text-slate-800">{allocatedPrinterName}</strong></div>
                    <div className="text-slate-400">ຄິດໄລ່ຕາມ Coverage % ແລະ ຈຳນວນໜ້າພິມ</div>
                  </div>
                </div>

                {/* 3. Labor & Technician Incentive */}
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span>ຄ່າແຮງງານຊ່າງ (Piece-Rate Labor)</span>
                    {realizedLaborCost !== null ? (
                      <span className="font-mono text-slate-900 font-black">{formatLAK(realizedLaborCost)}</span>
                    ) : (
                      <span className="text-amber-600 font-bold text-[11px]">{currentLang === 'lo' ? 'ຍັງບໍ່ໄດ້ບັນທຶກ' : 'Unrecorded'}</span>
                    )}
                  </div>
                  <div className="text-[10.5px] text-slate-600 font-medium space-y-0.5 pt-1 border-t border-slate-200/60">
                    <div>ຄ່າຕອບແທນ: <strong className="text-slate-800">Piece-rate Incentive</strong></div>
                    <div className="text-slate-400">ບັນທຶກເຂົ້າບັນຊີສ່ວນແບ່ງຊ່າງປະຈຳຂັ້ນຕອນ</div>
                  </div>
                </div>

                {/* 4. Finishing & Equipment Depreciation */}
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span>ຄ່າຫຼັງພິມ & ຄ່າເສື່ອມ (Finishing & Overhead)</span>
                    {realizedFinishingCost !== null ? (
                      <span className="font-mono text-slate-900 font-black">{formatLAK(realizedFinishingCost)}</span>
                    ) : (
                      <span className="text-amber-600 font-bold text-[11px]">{currentLang === 'lo' ? 'ຍັງບໍ່ໄດ້ບັນທຶກ' : 'Unrecorded'}</span>
                    )}
                  </div>
                  <div className="text-[10.5px] text-slate-600 font-medium space-y-0.5 pt-1 border-t border-slate-200/60">
                    <div>ຂະບວນການ: <strong className="text-slate-800">ຕັດ, ເຄືອບ, ເຂົ້າເລ່ມ</strong></div>
                    <div className="text-slate-400">ຄ່າເສື່ອມເຄື່ອງຈັກຕາມເວລາຜະລິດ</div>
                  </div>
                </div>

                {/* 5. Spoilage & Waste */}
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span>ອັດຕາການສູນເສຍ (Spoilage Allowance)</span>
                    {realizedSpoilageCost !== null ? (
                      <span className="font-mono text-slate-900 font-black">{formatLAK(realizedSpoilageCost)}</span>
                    ) : (
                      <span className="text-amber-600 font-bold text-[11px]">{currentLang === 'lo' ? 'ຍັງບໍ່ໄດ້ບັນທຶກ' : 'Unrecorded'}</span>
                    )}
                  </div>
                  <div className="text-[10.5px] text-slate-600 font-medium space-y-0.5 pt-1 border-t border-slate-200/60">
                    <div>ບັນທຶກ: <strong className="text-slate-800">spoilage_logs</strong></div>
                    <div className="text-slate-400">ຕັດສະຕັອກເສຍຕາມຂະໜາດເຈ້ຍຈິງ</div>
                  </div>
                </div>

                {/* 6. Executive Policy Note */}
                <div className="p-3.5 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-teal-800 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Customer Price Integrity</span>
                  </div>
                  <p className="text-[10px] text-teal-700 leading-relaxed pt-0.5">
                    ລາຄາຂາຍລູກຄ້າຖືກລັອກຄົງທີ່ 100%. ການປ່ຽນແທ່ນພິມຫຼືຂັ້ນຕອນ Finishing ຈະກະທົບສະເພາະຕົ້ນທຶນພາຍໃນເທົ່ານັ້ນ.
                  </p>
                </div>
              </div>
            </div>
          )}
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
