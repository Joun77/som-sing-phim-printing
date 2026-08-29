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
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-2xl text-xs sm:text-sm font-black transition active:scale-95 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentLang === 'lo' ? '← ກັບຄືນຕາຕະລາງ' : '← Back to Orders'}</span>
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase">
            <span className="text-amber-600 font-black">#{orderIdDisplay}</span>
            <span>•</span>
            <span>{orderDate}</span>
            <span>•</span>
            <span className="text-slate-600">{deliveryMethod || 'Anousith Express'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight font-sans">
            {currentLang === 'lo' ? 'ໜ້າກວດສອບ & ຮັບອໍເດີ (Order Reception Desk)' : 'Order Reception & Pre-Press Desk'}
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {renderSLABadge()}
        
        <span className={`px-3.5 py-1.5 rounded-2xl text-xs font-black border uppercase flex items-center gap-1.5 shadow-xs ${
          isPaymentConfirmed 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          <CreditCard className="w-4 h-4" />
          <span>{isPaymentConfirmed ? (currentLang === 'lo' ? 'ຊຳລະແລ້ວ' : 'Paid') : (currentLang === 'lo' ? 'ລໍຖ້າກວດສະລິບ' : 'Pending Slip')}</span>
        </span>

        <span className={`px-3.5 py-1.5 rounded-2xl text-xs font-black border uppercase flex items-center gap-1.5 shadow-xs ${
          isArtworkApproved
            ? 'bg-purple-50 text-purple-700 border-purple-200'
            : 'bg-sky-50 text-sky-700 border-sky-200'
        }`}>
          <Printer className="w-4 h-4" />
          <span>{isArtworkApproved ? (currentLang === 'lo' ? 'ກຳລັງຜະລິດ' : 'In Production') : (currentLang === 'lo' ? 'ລໍຖ້າກວດໄຟລ໌' : 'Pre-Press Check')}</span>
        </span>

        {onEditOrder && (
          <button
            type="button"
            onClick={onEditOrder}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-2xl text-xs font-black transition active:scale-95 cursor-pointer shadow-xs"
            title={currentLang === 'lo' ? 'ແກ້ໄຂອໍເດີ & ສະເປກ' : 'Edit Order Specs & Details'}
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
            <span>{currentLang === 'lo' ? 'ແກ້ໄຂອໍເດີ' : 'Edit Order'}</span>
          </button>
        )}

        {onViewInvoice && (
          <button
            type="button"
            onClick={onViewInvoice}
            className="px-3.5 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-black flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
            title="Customer Payment Invoice / Receipt"
          >
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            <span>{currentLang === 'lo' ? 'ໃບບິນລູກຄ້າ' : 'Invoice / Receipt'}</span>
          </button>
        )}

        {onPrintJobTicket && (
          <button
            type="button"
            onClick={onPrintJobTicket}
            className="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentLang === 'lo' ? 'ພິມໃບສັ່ງຜະລິດ' : 'Job Ticket'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderReceptionHeader;
