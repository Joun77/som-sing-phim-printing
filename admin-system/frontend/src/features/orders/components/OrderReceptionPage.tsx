import { apiFetch } from '../../../api/client';
import { getArtworkParts } from '../utils/artworkParts';
import { useAuthStore } from '../../../store/useAuthStore';
import { paymentDecimal } from '../../../api/paymentReview';
import React, { useState, useEffect, useRef } from 'react';
import { usePaymentSlipReview } from '../../../hooks/usePaymentSlipReview';
import { useApp } from '../../../store/AppContext';
import OrderReceptionHeader from './reception/OrderReceptionHeader';
import PaymentSlipCard from './reception/PaymentSlipCard';
import ArtworkPrepressCard from './reception/ArtworkPrepressCard';
import OrderStepBar from './reception/OrderStepBar';
import ConfigureWorkflowModal from './modals/ConfigureWorkflowModal';
import CustomerInvoiceModal from './modals/CustomerInvoiceModal';
import { ArrowRight, Sparkles, CheckCircle2, Receipt, RotateCcw, Check, X, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { IndustrialJobTicket } from './production/PaperCuttingTicketCard';
import { ProductionWorkflow } from '../types';

interface OrderReceptionPageProps {
  order: any;
  onBack: () => void;
  onSelectStep: (step: 1 | 2 | 3 | 4) => void;
  formatLAK: (n: number) => string;
  currentLang: string;
  handleStatusChange: (orderId: any, status: string) => Promise<any>;
  onUpdatePayment?: (orderId: any, paymentStatus: string, depositAmount?: number, remainingBalance?: number) => void;
  onUpdateOrder?: (order: any) => Promise<any>;
  showToast: (msg: string, type?: string) => void;
  setLightbox?: (v: { src: string; title: string } | null) => void;
  onEditOrder?: (order: any) => void;
}

export const OrderReceptionPage: React.FC<OrderReceptionPageProps> = ({
  order,
  onBack,
  onSelectStep,
  formatLAK,
  currentLang,
  handleStatusChange,
  onUpdatePayment,
  onUpdateOrder,
  showToast,
  setLightbox,
  onEditOrder,
}) => {
  const proofUploadGeneration = useRef(0);
  const proofDraft = useRef<{ file: File; orderId: string; url: string } | null>(null);
  const [unsavedSlip, setUnsavedSlip] = useState(false);
  const [savedSlipUrl, setSavedSlipUrl] = useState<string | null>(null);
  useEffect(() => { proofUploadGeneration.current++; proofDraft.current = null; setUnsavedSlip(false); setSavedSlipUrl(null); return () => { proofUploadGeneration.current++; }; }, [order?.id]);
  const [receiptDraft, setReceiptDraft] = useState<{ record: any; amount: string } | null>(null);
  const [receiptError, setReceiptError] = useState('');
  const receiptSaving = useRef(false);
  useEffect(() => { setReceiptDraft(null); setReceiptError(''); }, [order?.id]);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const { refreshData, customers, bankAccounts } = useApp();
  const role = useAuthStore(state => state.user?.role);
  const paymentReview = usePaymentSlipReview(String(order?.id || ''));

  if (!order) return null;

  const handleConfirmWorkflow = async (workflow: ProductionWorkflow) => {
    if (!onUpdateOrder) throw new Error('ບໍ່ມີຊ່ອງທາງບັນທຶກ');
    await onUpdateOrder({ id: order.id, expected_updated_at: order.updated_at, productionWorkflow: workflow });
    showToast('ບັນທຶກສາຍງານແລ້ວ', 'success');
  };

  const customerName = order.customerName || order.customer_name || order.customer || '—';
  const customerPhone = order.phone || order.customer_phone || '—';
  const deliveryAddress = order.address || order.delivery_address || '—';
  const totalAmountLAK = Number(paymentReview.summary?.total_lak ?? order.totalPriceCharged ?? order.totalAmount ?? order.total_amount_lak ?? order.total_price ?? 0);
  const orderIdDisplay = order.orderNo || order.order_no || order.orderNumber || order.id || 'ORDER';
  const orderDate = order.date || new Date().toISOString().split('T')[0];
  const promisedDate = order.promisedDeliveryDate || order.delivery_date;
  const deliveryMethod = order.deliveryMethod || order.shippingCourier || 'Anousith Express';
  const paymentSlipUrl = savedSlipUrl !== null ? savedSlipUrl : (order.paymentSlipUrl || order.payment_slip_url || order.slipUrl || order.slipImage);
  const driveLink = order.artworkUrl || order.artwork_url || order.driveLink || order.googleDriveLink || order.artworkLink || (order.items && order.items[0]?.artworkUrl) || (order.items && order.items[0]?.inner_file_url) || (order.items && order.items[0]?.cover_file_url) || '';
  const artworkFileName = order.artworkFileName || order.artwork_file_name || (order.items && order.items[0]?.artworkFileName) || (driveLink ? driveLink.split('/').pop()?.split('?')[0] : '');
  const artworkFileSize = order.artworkFileSize || order.artwork_file_size || (order.items && order.items[0]?.artworkFileSize) || 0;

  const customer = (customers || []).find(c => c.id === (order.customer_id || order.customerId));
  const canSelectDeposit = !role || ['admin','manager','sales','finance','accountant','owner','super_admin'].includes(role?.toLowerCase() || '');
  const canOverrideDeposit = !role || ['admin', 'manager', 'owner', 'super_admin'].includes(role?.toLowerCase() || '');
  const canReviewReceipt = !role || ['admin', 'manager', 'finance', 'accountant', 'owner', 'super_admin'].includes(role?.toLowerCase() || '');
  const canonical = paymentReview.summary;
  const depositMode = canonical ? canonical.deposit_mode : order.deposit_mode ?? null;
  const receiptRequest = async (amount: number, purpose: 'FULL' | 'DEPOSIT' | 'REMAINING', methodId?: string) => {
    if (unsavedSlip && methodId !== 'cash') { showToast('ສະລິບທີ່ເລືອກຍັງບໍ່ໄດ້ບັນທຶກໃນອໍເດີ. ບໍ່ສາມາດສ້າງຄຳຂໍຊຳລະໄດ້', 'warning'); return; }
    const evidence = methodId === 'cash' ? 'cash' : (paymentSlipUrl || 'cash');
    const result = await paymentReview.requestReceipt(String(amount), purpose, evidence, order.transRef || order.trans_ref || undefined, methodId);
    if (result) { void refreshData(); showToast('ບັນທຶກຄຳຂໍຊຳລະແລ້ວ; ລໍຖ້າກວດສອບ', 'success'); }
  };
  const isPaymentConfirmed = canonical ? canonical.payment_status === 'PAID' :
    order.paymentStatus === 'Paid' ||
    order.paymentStatus === 'PAID' ||
    order.paymentStatus === 'Deposit' ||
    order.paymentStatus === 'Fully Paid';

  const isArtworkApproved = order.proof_status === 'APPROVED' &&
    Boolean(order.proof_url || order.digital_proof_url) &&
    Boolean(order.proof_approved_at);

  const isProductionFinished = ['Ready', 'Delivered', 'COMPLETED'].includes(order.status);
  const isDelivered = ['Delivered', 'COMPLETED'].includes(order.status);
  const isReadyToAdvance = isPaymentConfirmed && isArtworkApproved && !order.stock_deducted_at &&
    ['FILE_CONFIRMED', 'READY_TO_PRINT'].includes(order.overall_status || order.status);

  return (
    <>
      <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in font-sans print:hidden">

      {/* 1. Header Sub-Component */}
      <OrderReceptionHeader
        orderIdDisplay={orderIdDisplay}
        orderDate={orderDate}
        promisedDate={promisedDate}
        deliveryMethod={deliveryMethod}
        isPaymentConfirmed={isPaymentConfirmed}
        isArtworkApproved={isArtworkApproved}
        currentLang={currentLang}
        onBack={onBack}
        onViewInvoice={() => setIsInvoiceModalOpen(true)}
        onPrintJobTicket={() => {
          showToast(currentLang === 'lo' ? 'ກຳລັງພິມໃບສັ່ງຜະລິດ...' : 'Printing Job Ticket...', 'info');
          window.print();
        }}
        onEditOrder={onEditOrder ? () => onEditOrder(order) : undefined}
      />

      {/* 2. Interactive StepBar */}
      <OrderStepBar
        currentStep={1}
        onSelectStep={onSelectStep}
        isPaymentConfirmed={isPaymentConfirmed}
        isArtworkApproved={isArtworkApproved}
        isProductionFinished={isProductionFinished}
        isDelivered={isDelivered}
        currentLang={currentLang}
      />

      {/* 3. Main 2-Column Grid of Reception Components */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Sub-Component: Step 1 Payment Slip Card (5 cols) */}
        <div className="lg:col-span-5">
          <PaymentSlipCard
            bankAccounts={bankAccounts}
            depositMode={depositMode}
            depositTargetPercent={canonical?.deposit_target_percent}
            depositTargetAmount={canonical?.deposit_target_amount_lak}
            receiptRequestMode={!!canonical}
            depositModePending={paymentReview.pending}
            depositModeDisabledReason={!canSelectDeposit ? 'ບໍ່ມີສິດປ່ຽນໂໝດມັດຈຳ' : ''}
            onDepositModeChange={async mode => { const saved = await paymentReview.changePolicy(mode); if (saved) void refreshData(); }}
            orderIdDisplay={orderIdDisplay}
            paymentSlipUrl={paymentSlipUrl}
            totalAmountLAK={totalAmountLAK}
            paymentStatus={canonical?.payment_status ?? order.paymentStatus}
            depositAmountPaid={canonical ? Number(canonical.received_net_lak) : order.depositAmountPaid ?? order.deposit_amount}
            remainingUnpaidBalance={canonical ? Number(canonical.remaining_lak) : order.remainingUnpaidBalance}
            transRef={order.transRef || order.trans_ref || order.transactionRef}
            verifiedAt={order.verifiedAt || order.verified_at}
            isPaymentConfirmed={isPaymentConfirmed}
            currentLang={currentLang}
            formatLAK={formatLAK}
            reviewPending={paymentReview.pending}
            reviewError={paymentReview.error}
            onConfirmFullPayment={async (methodId) => {
              if (canonical) { await receiptRequest(Number(canonical.remaining_lak), Number(canonical.received_net_lak) > 0 ? 'REMAINING' : 'FULL', methodId); return; }
              const result = await paymentReview.review('APPROVED');
              if (!result) return;
              onUpdatePayment?.(order.id, 'Paid', totalAmountLAK, 0);
              void refreshData();
              showToast(currentLang === 'lo' ? 'ບັນທຶກຜົນກວດສອບການຊຳລະແລ້ວ' : 'Payment review saved; ready for Pre-Press', 'success');
            }}
            onConfirmDepositPayment={async (amount, methodId) => {
              if (canonical) { await receiptRequest(amount, 'DEPOSIT', methodId); return; }
              showToast(currentLang === 'lo' ? 'ຍັງບໍ່ຮອງຮັບການຢືນຢັນມັດຈຳຜ່ານການກວດສະລິບ' : 'Partial deposit review is unavailable; use the finance workflow', 'warning');
            }}
            onRevertPayment={() => {
              showToast(currentLang === 'lo' ? 'ຕ້ອງດຳເນີນການຍ້ອນການຊຳລະຜ່ານຝ່າຍການເງິນ' : 'Payment reversal requires the finance workflow', 'warning');
            }}
            onRejectSlip={async () => {
              const reason = prompt(currentLang === 'lo' ? 'ລະບຸເຫດຜົນທີ່ສະລິບບໍ່ຖືກຕ້ອງ:' : 'Reason for slip rejection:');
              if (!reason) return;
              const result = await paymentReview.review('REJECTED', reason);
              if (!result) return;
              void refreshData();
              showToast(currentLang === 'lo' ? 'ບັນທຶກຜົນປະຕິເສດສະລິບແລ້ວ' : 'Slip rejection saved', 'warning');
            }}
            onDiscardSlipDraft={() => setUnsavedSlip(false)}
            onRemoveSlip={async () => {
              setSavedSlipUrl('');
              setUnsavedSlip(false);
              try {
                if (onUpdateOrder) {
                  await onUpdateOrder({ id: order.id, expected_updated_at: order.updated_at, payment_slip_url: '', paymentSlipUrl: '' });
                } else {
                  await apiFetch(`/api/v1/orders/${order.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ payment_slip_url: '' }),
                  });
                }
                void refreshData();
                showToast(currentLang === 'lo' ? 'ລຶບສະລິບໂອນເງິນສຳເລັດແລ້ວ' : 'Payment slip removed', 'info');
              } catch (err) {
                showToast(currentLang === 'lo' ? 'ບໍ່ສາມາດລຶບສະລິບໄດ້' : 'Failed to remove slip', 'error');
              }
            }}
            onUploadSlip={async (file) => {
              setUnsavedSlip(true);
              const result = await paymentReview.uploadSlip(file);
              if (!result) throw new Error('ບໍ່ສາມາດບັນທຶກສະລິບໄດ້; ກະລຸນາລອງໃໝ່');
              setSavedSlipUrl(result.file_url); setUnsavedSlip(false);
              void refreshData();
              showToast('ບັນທຶກສະລິບໃນອໍເດີແລ້ວ', 'success');
              return result.file_url;
            }}
            setLightbox={setLightbox}
          />
          <section className="mt-5 p-5 sm:p-6 bg-white border border-slate-200/80 rounded-3xl shadow-xs space-y-4" aria-label="ປະຫວັດການຊຳລະ">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-100/80 text-sky-600 flex items-center justify-center shadow-xs">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-800 text-sm">{currentLang === 'lo' ? 'ປະຫວັດການຊຳລະເງິນ' : 'Payment History'}</h3>
                    {canonical && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600">
                        {paymentReview.records.length} {currentLang === 'lo' ? 'ລາຍການ' : 'records'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">{currentLang === 'lo' ? 'ບັນທຶກທຸລະກຳ ແລະ ການກວດສອບຍອດຊຳລະ' : 'Transaction audit logs and status'}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={paymentReview.pending}
                onClick={() => paymentReview.loadHistory()}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 text-xs font-bold disabled:opacity-50 cursor-pointer shadow-xs active:scale-95"
                title={currentLang === 'lo' ? 'ໂຫຼດປະຫວັດໃໝ່' : 'Reload history'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${paymentReview.pending ? 'animate-spin text-sky-600' : ''}`} />
                <span className="text-[11px]">{currentLang === 'lo' ? 'ໂຫຼດໃໝ່' : 'Refresh'}</span>
              </button>
            </div>

            {paymentReview.historyError && (
              <div role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{paymentReview.historyError}</span>
              </div>
            )}

            {canonical && (
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/40 border border-emerald-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">{currentLang === 'lo' ? 'ຍອດຮັບຕົວຈິງ' : 'Net Received'}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="font-mono font-black text-base text-emerald-700 block">{formatLAK(Number(canonical.received_net_lak))}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/40 border border-amber-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">{currentLang === 'lo' ? 'ຍອດຄ້າງຊຳລະ' : 'Remaining'}</span>
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <span className="font-mono font-black text-base text-amber-700 block">{formatLAK(Number(canonical.remaining_lak))}</span>
                </div>
              </div>
            )}

            {paymentReview.legacyOpening && Number(paymentReview.legacyOpening.received_lak) > 0 && (
              <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/90 p-3.5 text-xs text-amber-900 space-y-1 shadow-xs">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{currentLang === 'lo' ? 'ຍອດຊຳລະເດີມໃນລະບົບ' : 'Legacy Opening Balance'}: <span className="font-mono font-black">{formatLAK(Number(paymentReview.legacyOpening.received_lak))}</span></span>
                </div>
                <p className="text-[11px] text-amber-700/90 leading-relaxed font-medium">
                  {currentLang === 'lo' ? 'ບໍ່ມີຫຼັກຖານທຸລະກຳລະອຽດ ບໍ່ສາມາດດຳເນີນການຍ້ອນລາຍການນີ້ໄດ້' : 'Legacy transaction without origin logs cannot be reversed.'}
                </p>
              </div>
            )}

            {canonical && paymentReview.records.length === 0 && (
              <div className="py-8 text-center rounded-2xl bg-slate-50/50 border border-dashed border-slate-200 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                  <Receipt className="w-5 h-5 text-slate-400" />
                </div>
                <span className="text-xs text-slate-500 font-bold">
                  {currentLang === 'lo' ? 'ຍັງບໍ່ທັນມີລາຍການຊຳລະເງິນ' : 'No payment records yet'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  {currentLang === 'lo' ? 'ລາຍການຊຳລະທີ່ບັນທຶກຈະສະແດງຢູ່ນີ້' : 'Recorded transactions will appear here'}
                </span>
              </div>
            )}

            {paymentReview.records.length > 0 && (
              <div className="space-y-3">
                {paymentReview.records.map(record => (
                  <div key={record.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 transition hover:border-sky-300 hover:shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[10.5px] font-black border ${
                          record.record_kind === 'REVERSAL'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}>
                          {record.record_kind === 'REVERSAL' ? (
                            <>
                              <RotateCcw className="w-3 h-3" />
                              <span>{currentLang === 'lo' ? 'ລາຍການຍ້ອນ' : 'Reversal'}</span>
                            </>
                          ) : (
                            <>
                              <Receipt className="w-3 h-3" />
                              <span>{currentLang === 'lo' ? 'ລາຍການຮັບເງິນ' : 'Receipt'}</span>
                            </>
                          )}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[10.5px] font-bold border ${
                          record.state === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : record.state === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {record.state === 'CONFIRMED' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>{currentLang === 'lo' ? 'ຢືນຢັນແລ້ວ' : 'Confirmed'}</span>
                            </>
                          ) : record.state === 'REJECTED' ? (
                            <>
                              <X className="w-3 h-3" />
                              <span>{currentLang === 'lo' ? 'ປະຕິເສດ' : 'Rejected'}</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>{currentLang === 'lo' ? 'ລໍຖ້າກວດ' : 'Pending'}</span>
                            </>
                          )}
                        </span>
                        {record.payment_method_id === 'cash' && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {currentLang === 'lo' ? 'ເງິນສົດ' : 'Cash'}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-black text-sm text-slate-800">
                        {formatLAK(Number(record.actual_received_amount_lak ?? record.requested_amount_lak))}
                      </span>
                    </div>

                    {record.created_at && (
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>{new Date(record.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        {record.reference && <span className="font-mono text-slate-600 font-bold">Ref: {record.reference}</span>}
                      </div>
                    )}

                    {record.state === 'PENDING' && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        {receiptDraft?.record.id === record.id ? (
                          <form aria-label="ຢືນຢັນຮັບເງິນ" className="p-3.5 bg-sky-50/50 border border-sky-200 rounded-2xl space-y-3 shadow-xs" onSubmit={async event => {
                            event.preventDefault(); if (receiptSaving.current) return;
                            let amount: string; try { amount = paymentDecimal(receiptDraft.amount); if (BigInt(amount.replace('.', '')) <= 0n) throw new Error('ຈຳນວນເງິນຕ້ອງຫຼາຍກວ່າ 0'); } catch (error) { setReceiptError(error instanceof Error ? error.message : 'ຈຳນວນເງິນບໍ່ຖືກຕ້ອງ'); return; }
                            receiptSaving.current = true; setReceiptError('');
                            try { const saved = await paymentReview.decideReceipt(record, 'APPROVED', amount); if (saved) { setReceiptDraft(null); void refreshData(); } }
                            finally { receiptSaving.current = false; }
                          }}>
                            <label className="block text-xs font-bold text-slate-700">
                              <span>{currentLang === 'lo' ? 'ຈຳນວນເງິນທີ່ຮັບຈິງ (LAK)' : 'Actual Received Amount (LAK)'}</span>
                              <input autoFocus aria-label="ຈຳນວນເງິນທີ່ຮັບຈິງ (LAK)" inputMode="decimal" value={receiptDraft.amount} disabled={paymentReview.pending} onChange={event => setReceiptDraft({ record, amount: event.target.value })} className="mt-1 w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 bg-white outline-hidden" />
                            </label>
                            {(receiptError || paymentReview.error) && <p role="alert" className="text-xs text-rose-600 font-semibold">{receiptError || paymentReview.error}</p>}
                            <div className="flex gap-2">
                              <button type="submit" disabled={paymentReview.pending} className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 disabled:opacity-50">
                                {currentLang === 'lo' ? 'ບັນທຶກຍອດຮັບຈິງ' : 'Confirm Amount'}
                              </button>
                              <button type="button" disabled={paymentReview.pending} onClick={() => { setReceiptDraft(null); setReceiptError(''); }} className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95">
                                {currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={!canReviewReceipt || paymentReview.pending}
                              onClick={() => { setReceiptError(''); setReceiptDraft({ record, amount: record.requested_amount_lak }); }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{currentLang === 'lo' ? 'ຢືນຢັນຍອດຮັບຈິງ' : 'Confirm Receipt'}</span>
                            </button>
                            <button
                              type="button"
                              disabled={!canReviewReceipt || paymentReview.pending}
                              onClick={async () => {
                                const reason = prompt(currentLang === 'lo' ? 'ເຫດຜົນປະຕິເສດ:' : 'Rejection Reason:'); if (!reason) return;
                                const saved = await paymentReview.decideReceipt(record, 'REJECTED', '0.00', reason); if (saved) void refreshData();
                              }}
                              className="px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{currentLang === 'lo' ? 'ປະຕິເສດຄຳຂໍ' : 'Reject'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {record.state === 'CONFIRMED' && record.record_kind === 'RECEIPT' && (
                      <div className="pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          disabled={!canReviewReceipt || paymentReview.pending}
                          onClick={async () => {
                            const amount = prompt(currentLang === 'lo' ? 'ຈຳນວນເງິນທີ່ຈະຍ້ອນ (LAK):' : 'Reversal amount (LAK):'); if (!amount) return;
                            const reason = prompt(currentLang === 'lo' ? 'ເຫດຜົນຍ້ອນການຊຳລະ:' : 'Reversal reason:'); if (!reason) return;
                            const saved = await paymentReview.reverseReceipt(record, amount, reason); if (saved) void refreshData();
                          }}
                          className="px-3 py-1.5 bg-white border border-amber-200 hover:bg-amber-50 text-amber-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{currentLang === 'lo' ? 'ຍ້ອນການຊຳລະ' : 'Reverse Payment'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Sub-Component: Step 2 Artwork & Customer Card (7 cols) */}
        <div className="lg:col-span-7">
          <ArtworkPrepressCard
            orderIdDisplay={orderIdDisplay}
            customerName={customerName}
            customerPhone={customerPhone}
            deliveryAddress={deliveryAddress}
            customerTier={order.customerTier || order.customer_tier || order.tier}
            village={order.village}
            district={order.district}
            province={order.province}
            driveLink={driveLink}
            artworkFileName={artworkFileName}
            artworkFileSize={artworkFileSize}
            proofUrl={order.proofUrl || order.proof_url || order.digital_proof_url}
            proofStatus={order.proof_status}
            proofVersion={order.proof_version}
            proofApprovedAt={order.proofApprovedAt || order.proof_approved_at}
            proofRejectedAt={order.proofRejectedAt || order.proof_rejected_at}
            proofRejectionReason={order.proofRejectionReason || order.proof_rejection_reason}
            orderStatus={order.status || order.overall_status}
            items={order.items}
            isArtworkApproved={isArtworkApproved}
            currentLang={currentLang}
            setLightbox={setLightbox}
            onConfigureWorkflow={() => setIsWorkflowModalOpen(true)}
            onDecideProof={['admin','manager','sales','prepress','owner'].includes(role || '') &&
              order.status === 'WAITING_APPROVAL' && order.proof_status === 'PENDING_CUSTOMER' &&
              !order.stock_deducted_at && order.updated_at && Number.isInteger(order.proof_version) && order.proof_version > 0 ? async (action, feedback) => {
                const generation = proofUploadGeneration.current;
                const proofUrl = order.proof_url || order.digital_proof_url;
                if (!proofUrl) throw new Error('ກະລຸນາໂຫຼດ Proof ກ່ອນ');
                const response = await apiFetch(`/api/v1/orders/${encodeURIComponent(order.id)}/proof-action`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action, expected_updated_at: order.updated_at, proof_url: proofUrl, proof_version: order.proof_version, feedback }),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || result.error || 'ບໍ່ສາມາດບັນທຶກຜົນ Proof ໄດ້');
                const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
                const nextStatus = action === 'APPROVE' ? 'FILE_CONFIRMED' : 'PREPRESS_CHECK';
                if (result.committed !== true || result.updated_id !== order.id || result.order_id !== order.id || result.action !== action ||
                  result.proof_status !== status || result.new_status !== nextStatus || result.proof_url !== proofUrl ||
                  result.proof_version !== order.proof_version || !result.updated_at || result.updated_at === order.updated_at)
                  throw new Error('ຜົນບັນທຶກ Proof ບໍ່ກົງກັບອໍເດີ');
                const readback = await apiFetch(`/api/v1/orders/${encodeURIComponent(order.id)}`);
                const saved = await readback.json(); const canonical = saved.data || saved;
                if (!readback.ok || canonical.id !== order.id || canonical.updated_at !== result.updated_at ||
                  canonical.proof_status !== status || (canonical.proof_url || canonical.digital_proof_url) !== proofUrl ||
                  canonical.proof_version !== order.proof_version || (canonical.overall_status || canonical.status) !== nextStatus ||
                  !Array.isArray(canonical.items) || !(action === 'APPROVE' ? canonical.proof_approved_at : canonical.proof_rejected_at))
                  throw new Error('ກະລຸນາໂຫຼດອໍເດີໃໝ່ເພື່ອກວດຜົນ Proof');
                if (generation !== proofUploadGeneration.current) throw new DOMException('Order changed', 'AbortError');
                await refreshData();
                if (generation === proofUploadGeneration.current) showToast('ບັນທຶກຜົນ Proof ແລ້ວ', 'success');
              } : undefined}
            productionWorkflow={order.productionWorkflow}
            onUploadProofFile={['admin','manager','sales','prepress','owner'].includes(role || '') ? async file => {
              const generation = proofUploadGeneration.current;
              if (!onUpdateOrder || !order.updated_at || !order.items?.[0]?.id) throw new Error('ກະລຸນາໂຫຼດອໍເດີກ່ອນ');
              if (proofDraft.current?.file !== file || proofDraft.current?.orderId !== order.id) {
                const item = order.items[0]; const role = getArtworkParts(item)[0]?.role || 'single';
                const form = new FormData(); form.set('file', file); form.set('order_no', order.id); form.set('item_id', item.id); form.set('file_type', role); form.set('artwork_role', role);
                const response = await apiFetch('/api/v1/orders/upload', { method: 'POST', body: form }); const asset = await response.json();
                if (!response.ok || asset.order_no !== order.id || asset.item_id !== item.id || typeof asset.file_url !== 'string' || !asset.file_url.startsWith('/api/v1/orders/files/')) throw new Error(asset.message || asset.error || 'ບໍ່ສາມາດອັບໂຫຼດ Proof ໄດ້');
                if (generation !== proofUploadGeneration.current) throw new DOMException('Order changed', 'AbortError');
                proofDraft.current = { file, orderId: order.id, url: asset.file_url };
              }
              if (generation !== proofUploadGeneration.current || !proofDraft.current) throw new DOMException('Order changed', 'AbortError');
              try {
                await onUpdateOrder({ id: order.id, expected_updated_at: order.updated_at, proofUrl: proofDraft.current.url });
              } catch (err: any) {
                try {
                  const res = await apiFetch(`/api/v1/orders/${order.id}`);
                  if (res.ok) {
                    const fresh = await res.json();
                    if (fresh?.updated_at && fresh.updated_at !== order.updated_at) {
                      await onUpdateOrder({ id: order.id, expected_updated_at: fresh.updated_at, proofUrl: proofDraft.current.url });
                      proofDraft.current = null;
                      showToast('ບັນທຶກ Digital Proof ແລ້ວ', 'success');
                      await refreshData();
                      return;
                    }
                  }
                } catch {
                  // Ignore secondary failure
                }
                await refreshData();
                throw err;
              }
              proofDraft.current = null; showToast('ບັນທຶກ Digital Proof ແລ້ວ', 'success');
              await refreshData();
            } : undefined}
            onUploadProof={async (proofUrl) => {
              if (!onUpdateOrder) throw new Error('ບໍ່ມີຊ່ອງທາງບັນທຶກ');
              await onUpdateOrder({ id: order.id, expected_updated_at: order.updated_at, proofUrl });
              showToast('ບັນທຶກ Digital Proof ແລ້ວ', 'success');
            }}
            onApproveArtwork={() => {
              setIsWorkflowModalOpen(true);
            }}
            onRevertArtwork={() => {
              handleStatusChange(order.id, 'PREPRESS_CHECK');
              showToast(currentLang === 'lo' ? 'ຍົກເລີກການອະນຸມັດໄຟລ໌ (ກັບສູ່ຂັ້ນຕອນກວດໄຟລ໌)' : 'Reverted artwork approval', 'info');
            }}
            onOpenDriveLink={() => {
              if (driveLink) {
                window.open(driveLink, '_blank');
              } else {
                showToast(currentLang === 'lo' ? 'ເປີດໄຟລ໌ຕົວຢ່າງ Artwork ສຳເລັດ' : 'Opened artwork file', 'info');
              }
            }}
          />
        </div>

      </div>

      {/* Workflow Configuration Modal */}
      {isWorkflowModalOpen && (
        <ConfigureWorkflowModal
          isOpen={isWorkflowModalOpen}
          onClose={() => setIsWorkflowModalOpen(false)}
          order={order}
          currentLang={currentLang}
          onConfirmWorkflow={handleConfirmWorkflow}
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

      {/* 4. Bottom Action Banner: Unlock Send to Production button when Step 1 is ready */}
      {isReadyToAdvance && (
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-sky-500/30 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3 text-left">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-100 flex items-center gap-2">
                <span>{currentLang === 'lo' ? 'ກວດສອບສະລິບ & ໄຟລ໌ພິມຮຽບຮ້ອຍແລ້ວ' : 'Order Slip & Artwork Verified'}</span>
                <Sparkles className="w-4 h-4 text-sky-400" />
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentLang === 'lo'
                  ? 'ພ້ອມສົ່ງຕໍ່ເຂົ້າຂະບວນການຜະລິດ (Step 2: Production Process)'
                  : 'Ready to advance to production process and finishings'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => { const saved = await handleStatusChange(order.id, 'IN_PRODUCTION'); if (saved) onSelectStep(2); }}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-black shadow-lg shadow-sky-500/30 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2.5 border-none"
          >
            <span>{currentLang === 'lo' ? 'ສົ່ງເຂົ້າຂະບວນການຜະລິດ (Step 2)' : 'Advance to Production Process'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      </div>

      {/* 5. Industrial Factory Job Ticket (Hidden on screen, Active on Print) */}
      <div className="hidden print:block">
        <IndustrialJobTicket order={order} currentLang={currentLang} />
      </div>
    </>
  );
};

export default OrderReceptionPage;
