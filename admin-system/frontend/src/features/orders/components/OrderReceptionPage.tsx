import React, { useState } from 'react';
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
  handleStatusChange: (orderId: any, status: string) => void;
  onUpdatePayment?: (orderId: any, paymentStatus: string, depositAmount?: number, remainingBalance?: number) => void;
  onUpdateOrder?: (order: any) => void;
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
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  if (!order) return null;

  const handleConfirmWorkflow = (workflow: ProductionWorkflow) => {
    order.productionWorkflow = workflow;
    order.status = 'IN_PRODUCTION';
    if (!order.stockDeducted) {
      order.stockDeducted = true;
      order.stockDeductedAt = new Date().toISOString();
    }
    if (onUpdateOrder) {
      onUpdateOrder({ ...order, productionWorkflow: workflow, status: 'IN_PRODUCTION', stockDeducted: true, stockDeductedAt: order.stockDeductedAt });
    }
    handleStatusChange(order.id, 'IN_PRODUCTION');
    showToast(
      currentLang === 'lo'
        ? `ກຳນົດສາຍງານ (${workflow.templateNameLao || workflow.templateName}) & ສັ່ງຜະລິດແລ້ວ! ຕັດສະຕັອກເຈ້ຍ-ໝຶກອັດຕະໂນມັດ`
        : `Workflow configured (${workflow.templateName}) & sent to production! Stock deducted.`,
      'success'
    );
  };

  const customerName = order.customerName || order.customer_name || order.customer || 'Somphavath DOUANGSVA';
  const customerPhone = order.phone || order.customer_phone || '02058866339';
  const deliveryAddress = order.address || order.delivery_address || 'Saysettha, Vientiane (ຮັບເອງ ຫຼື ຂົນສົ່ງ)';
  const totalAmountLAK = Number(order.totalPriceCharged || order.totalAmount || order.total_amount_lak || order.total_price || 86250);
  const orderIdDisplay = order.orderNo || order.order_no || order.orderNumber || order.id || 'ORDER';
  const orderDate = order.date || new Date().toISOString().split('T')[0];
  const promisedDate = order.promisedDeliveryDate || order.delivery_date;
  const deliveryMethod = order.deliveryMethod || order.shippingCourier || 'Anousith Express';
  const paymentSlipUrl = order.paymentSlipUrl || order.payment_slip_url || order.slipUrl || order.slipImage;
  const driveLink = order.driveLink || order.googleDriveLink;

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
            orderIdDisplay={orderIdDisplay}
            paymentSlipUrl={paymentSlipUrl}
            totalAmountLAK={totalAmountLAK}
            paymentStatus={order.paymentStatus}
            depositAmountPaid={order.depositAmountPaid || order.deposit_amount}
            remainingUnpaidBalance={order.remainingUnpaidBalance}
            transRef={order.transRef || order.trans_ref || order.transactionRef}
            verifiedAt={order.verifiedAt || order.verified_at}
            isPaymentConfirmed={isPaymentConfirmed}
            currentLang={currentLang}
            formatLAK={formatLAK}
            onConfirmFullPayment={() => {
              handleStatusChange(order.id, 'PREPRESS_CHECK');
              if (onUpdatePayment) {
                onUpdatePayment(order.id, 'Paid', totalAmountLAK, 0);
              }
              if (order) {
                order.paymentStatus = 'Paid';
                order.depositAmountPaid = totalAmountLAK;
                order.remainingUnpaidBalance = 0;
              }
              showToast(
                currentLang === 'lo' 
                  ? 'ຢືນຢັນຮັບຊຳລະເຕັມ 100% ສຳເລັດແລ້ວ! ສົ່ງຕໍ່ຝ່າຍ Pre-Press' 
                  : 'Full 100% payment verified! Handed over to Pre-Press', 
                'success'
              );
            }}
            onConfirmDepositPayment={(depositAmt) => {
              handleStatusChange(order.id, 'PREPRESS_CHECK');
              if (onUpdatePayment) {
                onUpdatePayment(order.id, 'Deposit', depositAmt, totalAmountLAK - depositAmt);
              }
              if (order) {
                order.paymentStatus = 'Deposit';
                order.depositAmountPaid = depositAmt;
                order.remainingUnpaidBalance = totalAmountLAK - depositAmt;
              }
              showToast(
                currentLang === 'lo' 
                  ? `ຢືນຢັນຮັບມັດຈຳ ${formatLAK(depositAmt)} ສຳເລັດ! ສົ່ງຕໍ່ຝ່າຍ Pre-Press` 
                  : `Deposit of ${formatLAK(depositAmt)} verified! Handed over to Pre-Press`, 
                'success'
              );
            }}
            onRevertPayment={() => {
              handleStatusChange(order.id, 'PENDING');
              if (onUpdatePayment) {
                onUpdatePayment(order.id, 'Unpaid', 0, totalAmountLAK);
              }
              if (order) {
                order.paymentStatus = 'Unpaid';
                order.depositAmountPaid = 0;
                order.remainingUnpaidBalance = totalAmountLAK;
              }
              showToast(currentLang === 'lo' ? 'ຍົກເລີກການຢືນຢັນສະລິບແລ້ວ' : 'Reverted payment confirmation', 'info');
            }}
            onRejectSlip={() => {
              const reason = prompt(currentLang === 'lo' ? 'ລະບຸເຫດຜົນທີ່ສະລິບບໍ່ຖືກຕ້ອງ:' : 'Reason for slip rejection:');
              if (reason) {
                showToast(currentLang === 'lo' ? 'ແຈ້ງເຕືອນລູກຄ້າໃຫ້ສົ່ງສະລິບໃໝ່ແລ້ວ' : 'Customer notified to re-upload slip', 'warning');
              }
            }}
            onUploadSlip={(fileUrl) => {
              if (order) {
                order.paymentSlipUrl = fileUrl;
                order.payment_slip_url = fileUrl;
                order.slipUrl = fileUrl;
              }
              showToast(
                currentLang === 'lo' 
                  ? (fileUrl ? 'ອັບໂຫລດສະລິບໂອນເງິນສຳເລັດ!' : 'ລົບຮູບສະລິບອອກແລ້ວ') 
                  : (fileUrl ? 'Slip uploaded successfully!' : 'Slip removed'), 
                'success'
              );
            }}
            setLightbox={setLightbox}
          />
        </div>

        {/* Right Sub-Component: Step 2 Artwork & Customer Card (7 cols) */}
        <div className="lg:col-span-7">
          <ArtworkPrepressCard
            orderIdDisplay={orderIdDisplay}
            customerName={customerName}
            customerPhone={customerPhone}
            deliveryAddress={deliveryAddress}
            driveLink={driveLink}
            proofUrl={order.proofUrl || order.proof_url}
            proofApprovedAt={order.proofApprovedAt || order.proof_approved_at}
            proofRejectedAt={order.proofRejectedAt || order.proof_rejected_at}
            proofRejectionReason={order.proofRejectionReason || order.proof_rejection_reason}
            orderStatus={order.status || order.overall_status}
            items={order.items}
            isArtworkApproved={isArtworkApproved}
            currentLang={currentLang}
            onConfigureWorkflow={() => setIsWorkflowModalOpen(true)}
            productionWorkflow={order.productionWorkflow}
            onUploadProof={(proofUrl) => {
              if (order) {
                order.proofUrl = proofUrl;
                order.proof_url = proofUrl;
                order.status = 'WAITING_APPROVAL';
                order.overall_status = 'WAITING_APPROVAL';
                if (onUpdateOrder) {
                  onUpdateOrder({ ...order, proofUrl, proof_url: proofUrl, status: 'WAITING_APPROVAL', overall_status: 'WAITING_APPROVAL' });
                }
                handleStatusChange(order.id, 'WAITING_APPROVAL');
                showToast(
                  currentLang === 'lo'
                    ? 'ອັບໂຫຼດ Digital Proof ແລະ ສົ່ງໃຫ້ລູກຄ້າກວດສອບແລ້ວ (WAITING_APPROVAL)'
                    : 'Digital proof uploaded and waiting customer sign-off',
                  'success'
                );
              }
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
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-500/30 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3 text-left">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-100 flex items-center gap-2">
                <span>{currentLang === 'lo' ? 'ກວດສອບສະລິບ & ໄຟລ໌ພິມຮຽບຮ້ອຍແລ້ວ' : 'Order Slip & Artwork Verified'}</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentLang === 'lo' 
                  ? 'ພ້ອມສົ່ງຕໍ່ເຂົ້າສາຍການຜະລິດແທ່ນພິມ (Step 2: Production Tracker)' 
                  : 'Ready to advance to press machine queue and finishings'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectStep(2)}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2.5 border-none"
          >
            <span>{currentLang === 'lo' ? 'ສົ່ງເຂົ້າສາຍການຜະລິດ (Advance to Step 2)' : 'Advance to Production Tracker'}</span>
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
