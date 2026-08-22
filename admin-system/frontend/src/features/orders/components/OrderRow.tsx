import React from 'react';
import { Eye, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

interface OrderRowProps {
  ord: any;
  currentLang: string;
  formatLAK: (num: number) => string;
  t: (key: string) => string;
  getStatusBadgeClass: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getPaymentStatusBadge: (status: string) => string;
  getPaymentStatusIcon: (status: string) => React.ReactNode;
  onViewDetails: (ord: any) => void;
  isSelected: boolean;
  focusRef?: React.Ref<HTMLTableRowElement> | null;
}

const OrderRow = React.memo<OrderRowProps>(({
  ord,
  currentLang,
  formatLAK,
  t,
  getStatusBadgeClass,
  getStatusIcon,
  getPaymentStatusBadge,
  getPaymentStatusIcon,
  onViewDetails,
  isSelected,
  focusRef
}) => {
  const customerName = ord.customerName || ord.customer_name || ord.customer || (currentLang === 'lo' ? 'ລູກຄ້າທົ່ວໄປ' : 'Customer');
  const customerPhone = ord.phone || ord.customer_phone || ord.customerPhone || '';
  const orderIdentifier = ord.orderNo || ord.order_no || ord.orderNumber || ord.id || 'ORDER';
  
  // Total Amount calculation
  const totalAmountLAK = Number(
    ord.totalPriceCharged || ord.totalAmount || ord.total_amount_lak || ord.total_price || ord.totalPrice || 0
  );
  // Normalize Payment Status
  const paymentStatusRaw = ord.paymentStatus || ord.payment_status || (ord.status === 'PAID_PREPRESS' ? 'Paid' : 'Unpaid');
  const paymentStatus = (paymentStatusRaw === 'Paid' || paymentStatusRaw === 'PAID' || paymentStatusRaw === 'Fully Paid') 
    ? 'Paid' 
    : paymentStatusRaw === 'Deposit' 
    ? 'Deposit' 
    : 'Unpaid';

  const remainingBalance = paymentStatus === 'Paid'
    ? 0
    : Number(ord.remainingUnpaidBalance !== undefined ? ord.remainingUnpaidBalance : (paymentStatus === 'Deposit' ? Math.round(totalAmountLAK / 2) : totalAmountLAK));

  // Normalize Production Status
  const statusRaw = ord.status || ord.overall_status || ord.productionStatus || 'Pending';
  const promisedDate = ord.promisedDeliveryDate || ord.delivery_date;
  const isOverdue = promisedDate && statusRaw !== 'Delivered' && statusRaw !== 'COMPLETED'
    ? new Date(promisedDate + 'T23:59:59').getTime() - new Date().getTime() < 0
    : false;
  const statusDisplay = 
    statusRaw === 'REQUIRES_MANAGER_APPROVAL' || statusRaw === 'PREPRESS_CHECK' || statusRaw === 'PAID_PREPRESS'
      ? (currentLang === 'lo' ? 'ລໍຖ້າກວດຟາຍ' : 'Pre-Press Check')
      : statusRaw === 'IN_PRODUCTION' || statusRaw === 'Printing'
      ? (currentLang === 'lo' ? 'ກຳລັງພິມ' : 'Printing')
      : statusRaw === 'READY_FOR_PICKUP' || statusRaw === 'Ready'
      ? (currentLang === 'lo' ? 'ພ້ອມສົ່ງ' : 'Ready')
      : statusRaw === 'DELIVERED' || statusRaw === 'Delivered' || statusRaw === 'COMPLETED'
      ? (currentLang === 'lo' ? 'ສົ່ງມອບແລ້ວ' : 'Delivered')
      : (t(`status.${statusRaw}`) || statusRaw);

  const itemsSummary = () => {
    if (Array.isArray(ord.items) && ord.items.length > 0) {
      const firstItem = ord.items[0];
      const name = firstItem.name || firstItem.item_name || firstItem.job_name || firstItem.product_name || (currentLang === 'lo' ? 'ງານສິ່ງພິມ' : 'Print Job');
      const qty = firstItem.quantity || 1;
      const summary = `${name} (x${qty})`;
      if (ord.items.length > 1) {
        return `${summary} (+${ord.items.length - 1} ${currentLang === 'lo' ? 'ລາຍການ' : 'items'})`;
      }
      return summary;
    }
    if (ord.product_name || (ord.specs && ord.specs.size)) {
      return `${ord.product_name || ord.specs?.size} (x${ord.quantity || 1})`;
    }
    return currentLang === 'lo' ? 'ງານພິມດິຈິຕອນຕາມສັ່ງ' : 'Custom Print Job';
  };

  const renderSLATimer = () => {
    const promisedDate = ord.promisedDeliveryDate || ord.delivery_date;
    if (!promisedDate) return null;
    const promised = new Date(promisedDate + 'T23:59:59');
    const now = new Date();
    
    if (statusRaw === 'Delivered' || statusRaw === 'DELIVERED' || statusRaw === 'COMPLETED') {
      return (
        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-black mt-1 inline-flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-emerald-600" /> ສົ່ງມອບແລ້ວ
        </span>
      );
    }
    if (statusRaw === 'Cancelled' || statusRaw === 'CANCELLED') {
      return (
        <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-black mt-1 inline-flex items-center gap-1">
          <XCircle className="w-3 h-3 text-red-600" /> ຍົກເລີກແລ້ວ
        </span>
      );
    }

    const diffMs = promised.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMs < 0) {
      const daysOverdue = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      return (
        <span className="text-[10px] text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded font-black mt-1 inline-flex items-center gap-1 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-red-600" /> ກາຍກຳນົດ {daysOverdue} ວັນ
        </span>
      );
    } else if (diffDays <= 1) {
      return (
        <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded font-black mt-1 inline-flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-700" /> ສົ່ງມື້ນີ້ (ດ່ວນ)
        </span>
      );
    } else {
      return (
        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">
          ເຫຼືອ {diffDays} ວັນ
        </span>
      );
    }
  };

  return (
    <tr 
      className={`hover:bg-slate-50/30 transition ${
        isOverdue ? 'bg-red-50/10' : ''
      } ${isSelected ? 'bg-sky-50/20' : ''}`}
    >
      {/* Order ID & Date */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-mono font-black text-slate-900 block text-sm lg:text-base">#{orderIdentifier}</span>
        <span className="text-xs text-slate-400 block font-sans mt-1">Due: {ord.promisedDeliveryDate || ord.delivery_date || '24-48h'}</span>
        {renderSLATimer()}
      </td>
      {/* Customer Info */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-bold text-slate-900 block">{customerName}</span>
        <span className="text-xs text-slate-400 block font-sans mt-0.5">{customerPhone || '-'}</span>
      </td>
      {/* Print Items Summary */}
      <td className="px-6 py-4 min-w-[200px]">
        <span className="font-semibold text-slate-800 line-clamp-1">{itemsSummary()}</span>
      </td>
      {/* Payment Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2.5 py-1 rounded-[8px] text-[10px] sm:text-xs font-extrabold uppercase border ${getPaymentStatusBadge(paymentStatus)}`}>
          {getPaymentStatusIcon(paymentStatus)}
          <span className="ml-1">{paymentStatus === 'Paid' ? (currentLang === 'lo' ? 'ຊຳລະແລ້ວ' : 'Paid') : paymentStatus === 'Deposit' ? (currentLang === 'lo' ? 'ມັດຈຳແລ້ວ' : 'Deposit') : (currentLang === 'lo' ? 'ຍັງບໍ່ຊຳລະ' : 'Unpaid')}</span>
        </span>
      </td>
      {/* Production Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2.5 py-1 rounded-[8px] text-[10px] sm:text-xs font-extrabold uppercase border ${getStatusBadgeClass(statusRaw)}`}>
          {getStatusIcon(statusRaw)}
          <span className="ml-1">{statusDisplay}</span>
        </span>
      </td>
      {/* Total Price */}
      <td className="px-6 py-4 text-right font-sans font-black text-slate-900 whitespace-nowrap">
        <span className="block text-sm lg:text-base font-mono">{formatLAK(totalAmountLAK)}</span>
        {remainingBalance > 0 && (
          <span className="text-xs font-sans font-bold text-red-500 block mt-1 font-mono">
            {currentLang === 'lo' ? 'ຄ້າງ:' : 'Unpaid:'} {formatLAK(remainingBalance)}
          </span>
        )}
      </td>
      {/* Single View Details Action */}
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <button
          type="button"
          onClick={() => onViewDetails(ord)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-950 rounded-xl text-xs font-bold transition shadow-xs border border-slate-200 active:scale-95 cursor-pointer"
          title={currentLang === 'lo' ? 'ເບິ່ງລາຍລະອຽດ' : 'View Details'}
        >
          <Eye className="w-4 h-4 text-slate-600" />
          <span>{currentLang === 'lo' ? 'ເບິ່ງລາຍລະອຽດ' : 'View Details'}</span>
        </button>
      </td>
    </tr>
  );
});

export default OrderRow;
