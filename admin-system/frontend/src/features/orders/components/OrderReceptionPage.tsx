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
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
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

  const { refreshData, customers } = useApp();
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
  const paymentSlipUrl = savedSlipUrl || order.paymentSlipUrl || order.payment_slip_url || order.slipUrl || order.slipImage;
  const driveLink = order.artworkUrl || order.artwork_url || order.driveLink || order.googleDriveLink || order.artworkLink || (order.items && order.items[0]?.artworkUrl) || (order.items && order.items[0]?.inner_file_url) || (order.items && order.items[0]?.cover_file_url) || '';
  const artworkFileName = order.artworkFileName || order.artwork_file_name || (order.items && order.items[0]?.artworkFileName) || (driveLink ? driveLink.split('/').pop()?.split('?')[0] : '');
  const artworkFileSize = order.artworkFileSize || order.artwork_file_size || (order.items && order.items[0]?.artworkFileSize) || 0;

  const customer = customers.find(c => c.id === (order.customer_id || order.customerId));
  const canSelectDeposit = ['admin','manager','sales','finance','accountant','owner'].includes(role || '');
  const canReviewReceipt = ['admin','manager','finance','accountant','owner'].includes(role || '');
  const canonical = paymentReview.summary;
  const depositMode = canonical ? canonical.deposit_mode : order.deposit_mode ?? null;
  const receiptRequest = async (amount: number, purpose: 'FULL' | 'DEPOSIT' | 'REMAINING') => {
    if (unsavedSlip) { showToast('ສະລິບທີ່ເລືອກຍັງບໍ່ໄດ້ບັນທຶກໃນອໍເດີ. ບໍ່ສາມາດສ້າງຄຳຂໍຊຳລະໄດ້', 'warning'); return; }
    const result = await paymentReview.requestReceipt(String(amount), purpose, paymentSlipUrl || '', order.transRef || order.trans_ref || undefined);
    if (result) { void refreshData(); showToast('ບັນທຶກຄຳຂໍຊຳລະແລ້ວ; ລໍຖ້າກວດສອບ', 'success'); }
  };
  const isPaymentConfirmed = canonical ? canonical.payment_status === 'PAID' :
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

  const isProductionFinished = ['Ready', 'Delivered', 'COMPLETED'].includes(order.status);
  const isDelivered = ['Delivered', 'COMPLETED'].includes(order.status);
  const isReadyToAdvance = isPaymentConfirmed && isArtworkApproved;

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
            depositMode={depositMode}
            depositTargetPercent={canonical?.deposit_target_percent}
            depositTargetAmount={canonical?.deposit_target_amount_lak}
            receiptRequestMode={!!canonical}
            depositModePending={paymentReview.pending}
            depositModeDisabledReason={!canonical ? 'ກະລຸນາໂຫຼດຂໍ້ມູນການຊຳລະກ່ອນ' : !canSelectDeposit ? 'ບໍ່ມີສິດປ່ຽນໂໝດມັດຈຳ' : depositMode !== 'ON' && !customer?.depositEligible ? 'ລູກຄ້າບໍ່ມີສິດມັດຈຳ' : ''}
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
            onConfirmFullPayment={async () => {
              if (canonical) { await receiptRequest(Number(canonical.remaining_lak), Number(canonical.received_net_lak) > 0 ? 'REMAINING' : 'FULL'); return; }
              const result = await paymentReview.review('APPROVED');
              if (!result) return;
              onUpdatePayment?.(order.id, 'Paid', totalAmountLAK, 0);
              void refreshData();
              showToast(currentLang === 'lo' ? 'ບັນທຶກຜົນກວດສອບການຊຳລະແລ້ວ' : 'Payment review saved; ready for Pre-Press', 'success');
            }}
            onConfirmDepositPayment={async amount => {
              if (canonical) { await receiptRequest(amount, 'DEPOSIT'); return; }
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
          <section className="mt-4 p-4 bg-white border rounded-2xl space-y-3" aria-label="ປະຫວັດການຊຳລະ">
            <h3 className="font-bold">ປະຫວັດການຊຳລະ</h3>
            {paymentReview.historyError && <p role="alert">{paymentReview.historyError}</p>}
            <button type="button" disabled={paymentReview.pending} onClick={() => paymentReview.loadHistory()}>ລອງໂຫຼດໃໝ່</button>
            {canonical && <p>ຮັບແລ້ວ: {formatLAK(Number(canonical.received_net_lak))} • ຄ້າງ: {formatLAK(Number(canonical.remaining_lak))}</p>}
            {paymentReview.legacyOpening && Number(paymentReview.legacyOpening.received_lak) > 0 && <p className="rounded-xl bg-amber-50 p-3">ຍອດຊຳລະເດີມ: {formatLAK(Number(paymentReview.legacyOpening.received_lak))} • ບໍ່ຮູ້ແຫຼ່ງທີ່ມາ • ບໍ່ສາມາດຍ້ອນລາຍການນີ້</p>}
            {canonical && paymentReview.records.length === 0 && <p>ຍັງບໍ່ມີລາຍການຊຳລະ</p>}
            {paymentReview.records.map(record => <div key={record.id} className="border-t pt-2 space-y-2">
              <p>{record.record_kind === 'REVERSAL' ? 'ລາຍການຍ້ອນ' : 'ລາຍການຮັບເງິນ'} • {record.state === 'CONFIRMED' ? 'ຢືນຢັນແລ້ວ' : record.state === 'REJECTED' ? 'ປະຕິເສດ' : 'ລໍຖ້າກວດ'} • {formatLAK(Number(record.actual_received_amount_lak ?? record.requested_amount_lak))}</p>
              {record.state === 'PENDING' && <>
                <button type="button" disabled={!canReviewReceipt || paymentReview.pending} onClick={() => { setReceiptError(''); setReceiptDraft({ record, amount: record.requested_amount_lak }); }}>ຢືນຢັນຍອດຮັບຈິງ</button>
                {receiptDraft?.record.id === record.id && <form aria-label="ຢືນຢັນຮັບເງິນ" className="p-3 border rounded-xl space-y-2" onSubmit={async event => {
                  event.preventDefault(); if (receiptSaving.current) return;
                  let amount: string; try { amount = paymentDecimal(receiptDraft.amount); if (BigInt(amount.replace('.', '')) <= 0n) throw new Error('ຈຳນວນເງິນຕ້ອງຫຼາຍກວ່າ 0'); } catch (error) { setReceiptError(error instanceof Error ? error.message : 'ຈຳນວນເງິນບໍ່ຖືກຕ້ອງ'); return; }
                  receiptSaving.current = true; setReceiptError('');
                  try { const saved = await paymentReview.decideReceipt(record, 'APPROVED', amount); if (saved) { setReceiptDraft(null); void refreshData(); } }
                  finally { receiptSaving.current = false; }
                }}>
                  <label>ຈຳນວນເງິນທີ່ຮັບຈິງ (LAK)<input autoFocus aria-label="ຈຳນວນເງິນທີ່ຮັບຈິງ (LAK)" inputMode="decimal" value={receiptDraft.amount} disabled={paymentReview.pending} onChange={event => setReceiptDraft({ record, amount: event.target.value })} className="border rounded p-2" /></label>
                  {(receiptError || paymentReview.error) && <p role="alert">{receiptError || paymentReview.error}</p>}
                  <button type="submit" disabled={paymentReview.pending}>ບັນທຶກຍອດຮັບຈິງ</button>
                  <button type="button" disabled={paymentReview.pending} onClick={() => { setReceiptDraft(null); setReceiptError(''); }}>ຍົກເລີກ</button>
                </form>}

                <button type="button" disabled={!canReviewReceipt || paymentReview.pending} onClick={async () => {
                  const reason = prompt('ເຫດຜົນປະຕິເສດ:'); if (!reason) return;
                  const saved = await paymentReview.decideReceipt(record, 'REJECTED', '0.00', reason); if (saved) void refreshData();
                }}>ປະຕິເສດຄຳຂໍ</button>
              </>}
              {record.state === 'CONFIRMED' && record.record_kind === 'RECEIPT' && <button type="button" disabled={!canReviewReceipt || paymentReview.pending} onClick={async () => {
                const amount = prompt('ຈຳນວນເງິນທີ່ຈະຍ້ອນ (LAK):'); if (!amount) return;
                const reason = prompt('ເຫດຜົນຍ້ອນການຊຳລະ:'); if (!reason) return;
                const saved = await paymentReview.reverseReceipt(record, amount, reason); if (saved) void refreshData();
              }}>ຍ້ອນການຊຳລະ</button>}
            </div>)}
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
              await onUpdateOrder({ id: order.id, expected_updated_at: order.updated_at, proofUrl: proofDraft.current.url });
              proofDraft.current = null; showToast('ບັນທຶກ Digital Proof ແລ້ວ', 'success');
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
