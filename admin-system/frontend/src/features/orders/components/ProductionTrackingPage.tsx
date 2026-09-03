import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Sparkles,
  Edit3,
  CreditCard
} from 'lucide-react';
import OrderStepBar from './reception/OrderStepBar';
import ArtworkPreviewCard from './production/ArtworkPreviewCard';
import PrintJobItemsCard from './production/PrintJobItemsCard';
import ProductionProcessFlowCard from './production/ProductionProcessFlowCard';
import CustomerInvoiceModal from './modals/CustomerInvoiceModal';
import { IndustrialJobTicket } from './production/PaperCuttingTicketCard';

interface ProductionTrackingPageProps {
  order: any;
  onBack: () => void;
  onSelectStep: (step: 1 | 2 | 3 | 4) => void;
  formatLAK: (n: number) => string;
  t: (key: string) => string;
  currentLang: string;
  handleStatusChange: (orderId: any, currentStatus: any) => void;
  deleteOrder: (orderId: any) => void;
  showToast: (msg: string, type?: string) => void;
  askConfirmation: (msg: string, onConfirm: () => void) => void;
  getStatusBadgeClass: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getPaymentStatusBadge: (status: string) => string;
  getPaymentStatusIcon: (status: string) => React.ReactNode;
  setLightbox?: (v: { src: string; title: string } | null) => void;
  onEditOrder?: (order: any) => void;
  onUpdateOrder?: (order: any) => void;
}

export const ProductionTrackingPage: React.FC<ProductionTrackingPageProps> = ({
  order,
  onBack,
  onSelectStep,
  formatLAK,
  t,
  currentLang,
  handleStatusChange,
  deleteOrder,
  showToast,
  askConfirmation,
  getStatusBadgeClass,
  getStatusIcon,
  getPaymentStatusBadge,
  getPaymentStatusIcon,
  setLightbox,
  onEditOrder,
  onUpdateOrder,
}) => {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  if (!order) return null;

  const orderIdDisplay = order.orderNo || order.order_no || order.orderNumber || order.id || 'ORDER';
  const driveLink = order.driveLink || order.googleDriveLink;
  const artworkThumbnailUrl = order.artworkThumbnailUrl || order.thumbnailUrl || order.artwork_preview_url;

  const isPaymentConfirmed = order.paymentStatus === 'Paid' || order.paymentStatus === 'PAID';
  const isArtworkApproved = true;
  const isProductionFinished = ['Ready', 'Delivered', 'COMPLETED'].includes(order.status);
  const isDelivered = ['Delivered', 'COMPLETED'].includes(order.status);

  return (
    <>
      <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in font-sans print:hidden">
        
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
                <span className="text-sky-600 font-black">#{orderIdDisplay}</span>
                <span>•</span>
                <span className="text-sky-800 font-bold">Step 2: Press & Finishing Tracking</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
                {currentLang === 'lo' ? 'ຂະບວນການຜະລິດ (Step 2: Production)' : 'Step 2: Production Process'}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Badge (Pill with soft border) */}
            <div className={`px-3 py-1 rounded-full text-[11px] font-bold border uppercase flex items-center gap-1.5 select-none ${getStatusBadgeClass(order.status)}`}>
              {getStatusIcon(order.status)}
              <span>{order.status}</span>
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
          currentStep={2}
          onSelectStep={onSelectStep}
          isPaymentConfirmed={isPaymentConfirmed}
          isArtworkApproved={isArtworkApproved}
          isProductionFinished={isProductionFinished}
          isDelivered={isDelivered}
          currentLang={currentLang}
        />

        {/* 3. Top Section: Artwork Preview & Print Items Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Artwork Asset & Preview Box (5 cols) */}
          <div className="lg:col-span-5">
            <ArtworkPreviewCard
              orderIdDisplay={orderIdDisplay}
              order={order}
              driveLink={driveLink}
              artworkThumbnailUrl={artworkThumbnailUrl}
              currentLang={currentLang}
              onOpenDriveLink={() => {
                if (driveLink) {
                  window.open(driveLink, '_blank');
                } else {
                  showToast(currentLang === 'lo' ? 'ເປີດໄຟລ໌ Preview ສຳເລັດ' : 'Opened artwork file', 'info');
                }
              }}
              setLightbox={setLightbox}
            />
          </div>

          {/* Right Column: Print Job Itemized Specifications (7 cols) */}
          <div className="lg:col-span-7">
            <PrintJobItemsCard
              items={order.items}
              orderSpecs={order.specs || order}
              currentLang={currentLang}
            />
          </div>

        </div>

        {/* 4. Bottom Section: Dynamic Post-Press Finishing & QC Flow */}
        <div>
          <ProductionProcessFlowCard
            orderId={order.id}
            orderStatus={order.status}
            orderSpecs={order.specs || order}
            currentLang={currentLang}
            productionWorkflow={order.productionWorkflow}
            order={order}
            onAdvanceToStep3={() => onSelectStep(3)}
            onUpdateStatus={handleStatusChange}
            onUpdateWorkflow={(wf) => {
              order.productionWorkflow = wf;
              if (onUpdateOrder) {
                onUpdateOrder({ ...order, productionWorkflow: wf });
              }
            }}
            showToast={showToast}
          />
        </div>

      </div>

      {/* Customer Invoice / Receipt Modal */}
      {isInvoiceModalOpen && (
        <CustomerInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          order={order}
          currentLang={currentLang}
          formatLAK={formatLAK}
        />
      )}

      {/* 5. Industrial Factory Job Ticket (Hidden on screen, Active on Print) */}
      <div className="hidden print:block">
        <IndustrialJobTicket order={order} currentLang={currentLang} />
      </div>
    </>
  );
};

export default ProductionTrackingPage;
