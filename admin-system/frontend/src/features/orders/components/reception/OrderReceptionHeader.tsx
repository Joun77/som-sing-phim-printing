import React from 'react';
import { ArrowLeft, Clock, CreditCard, Printer, AlertTriangle, Edit3 } from 'lucide-react';

interface OrderReceptionHeaderProps {
  orderIdDisplay: string;
  orderDate: string;
  promisedDate?: string;
  deliveryMethod?: string;
  isPaymentConfirmed: boolean;
  isArtworkApproved: boolean;
  currentLang: string;
  onBack: () => void;
  onPrintJobTicket?: () => void;
  onViewInvoice?: () => void;
  onEditOrder?: () => void;
}

export const OrderReceptionHeader: React.FC<OrderReceptionHeaderProps> = ({
  orderIdDisplay,
  orderDate,
  promisedDate,
  deliveryMethod,
  isPaymentConfirmed,
  isArtworkApproved,
  currentLang,
  onBack,
  onPrintJobTicket,
  onViewInvoice,
  onEditOrder,
}) => {
  const renderSLABadge = () => {
    if (!promisedDate) return null;
    const promised = new Date(promisedDate + 'T23:59:59');
    const now = new Date();
    const diffMs = promised.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMs < 0) {
      const daysOverdue = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      return (
        <span className="px-3 py-1.5 rounded-2xl bg-red-50 text-red-700 border border-red-200 text-xs font-black flex items-center gap-1.5 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> ກາຍກຳນົດ {daysOverdue} ວັນ
        </span>
      );
    }
    return (
      <span className="px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-700 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-amber-600" /> ກຳນົດສົ່ງ: {promisedDate}
      </span>
    );
  };

  return (
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
            <span>{orderDate}</span>
            <span>•</span>
            <span className="text-slate-600">{deliveryMethod || 'Anousith Express'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight font-sans">
            {currentLang === 'lo' ? 'ຮັບອໍເດີ (Order Reception)' : 'Order Reception Desk'}
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Read-Only Status Badges (Pills with soft borders & rounded-full) */}
        <div className="flex items-center gap-2">
          {renderSLABadge()}
          
          <div className={`px-3 py-1 rounded-full text-[11px] font-bold border uppercase flex items-center gap-1.5 select-none ${
            isPaymentConfirmed 
              ? 'bg-emerald-50/90 text-emerald-800 border-emerald-300/80' 
              : 'bg-amber-50/90 text-amber-800 border-amber-300/80'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isPaymentConfirmed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{isPaymentConfirmed ? (currentLang === 'lo' ? 'ຊຳລະແລ້ວ' : 'Paid') : (currentLang === 'lo' ? 'ລໍຖ້າກວດສະລິບ' : 'Pending Slip')}</span>
          </div>

          <div className={`px-3 py-1 rounded-full text-[11px] font-bold border uppercase flex items-center gap-1.5 select-none ${
            isArtworkApproved
              ? 'bg-purple-50/90 text-purple-800 border-purple-300/80'
              : 'bg-sky-50/90 text-sky-800 border-sky-300/80'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isArtworkApproved ? 'bg-purple-500' : 'bg-sky-500'}`} />
            <span>{isArtworkApproved ? (currentLang === 'lo' ? 'ກຳລັງຜະລິດ' : 'In Production') : (currentLang === 'lo' ? 'ລໍຖ້າກວດໄຟລ໌' : 'Pre-Press Check')}</span>
          </div>
        </div>

        {/* Vertical Divider between Status and Interactive Buttons */}
        <div className="hidden sm:block w-px h-6 bg-slate-200" />

        {/* Action Buttons (Solid, High-Contrast, Shadow, Elevated Clickable) */}
        <div className="flex items-center gap-2">
          {onEditOrder && (
            <button
              type="button"
              onClick={onEditOrder}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-xl text-xs transition-all duration-150 shadow-sm shadow-sky-500/25 active:scale-95 cursor-pointer border-none"
              title={currentLang === 'lo' ? 'ແກ້ໄຂອໍເດີ & ສະເປກ' : 'Edit Order Specs & Details'}
            >
              <Edit3 className="w-3.5 h-3.5 text-white" />
              <span>{currentLang === 'lo' ? 'ແກ້ໄຂອໍເດີ' : 'Edit Order'}</span>
            </button>
          )}

          {onViewInvoice && (
            <button
              type="button"
              onClick={onViewInvoice}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs transition-all duration-150 shadow-sm shadow-blue-600/25 active:scale-95 cursor-pointer border-none"
              title={currentLang === 'lo' ? 'ໃບບິນລູກຄ້າ (Invoice / Receipt)' : 'Customer Invoice / Receipt'}
            >
              <CreditCard className="w-3.5 h-3.5 text-white" />
              <span>{currentLang === 'lo' ? 'ໃບບິນລູກຄ້າ' : 'Customer Invoice'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderReceptionHeader;
