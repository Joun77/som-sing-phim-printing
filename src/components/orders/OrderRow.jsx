import React from 'react';
import { Eye } from 'lucide-react';

const OrderRow = React.memo(({
  ord,
  currentLang,
  formatLAK,
  t,
  getStatusBadgeClass,
  getStatusIcon,
  getPaymentStatusBadge,
  getPaymentStatusIcon,
  onViewDetails,
  isSelected
}) => {
  const isOverdue = ord.paymentStatus === 'Overdue';
  const itemsSummary = () => {
    if (!ord.items || ord.items.length === 0) return '-';
    const firstItem = ord.items[0];
    const summary = `${firstItem.name} (x${firstItem.quantity})`;
    if (ord.items.length > 1) {
      return `${summary} (+${ord.items.length - 1} ${currentLang === 'lo' ? 'ລາຍການ' : 'items'})`;
    }
    return summary;
  };

  return (
    <tr 
      className={`hover:bg-slate-50/30 transition ${
        isOverdue ? 'bg-red-50/10' : ''
      } ${isSelected ? 'bg-sky-50/20' : ''}`}
    >
      {/* Order ID & Date */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-mono font-black text-slate-900 block text-sm lg:text-base">#{ord.id}</span>
        <span className="text-xs text-slate-400 block font-sans mt-1">Due: {ord.promisedDeliveryDate}</span>
      </td>
      {/* Customer Info */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-bold text-slate-900 block">{ord.customerName}</span>
        <span className="text-xs text-slate-400 block font-sans mt-0.5">{ord.phone}</span>
      </td>
      {/* Print Items Summary */}
      <td className="px-6 py-4 min-w-[200px]">
        <span className="font-semibold text-slate-800 line-clamp-1">{itemsSummary()}</span>
      </td>
      {/* Payment Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 rounded-[8px] text-[10px] sm:text-xs font-extrabold uppercase border ${getPaymentStatusBadge(ord.paymentStatus)}`}>
          {getPaymentStatusIcon(ord.paymentStatus)}
          <span className="ml-1">{t(`payment.${ord.paymentStatus}`)}</span>
        </span>
      </td>
      {/* Production Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2.5 py-1 rounded-[8px] text-[10px] sm:text-xs font-extrabold uppercase border ${getStatusBadgeClass(ord.status)}`}>
          {getStatusIcon(ord.status)}
          <span className="ml-1">{t(`status.${ord.status}`)}</span>
        </span>
      </td>
      {/* Total Price */}
      <td className="px-6 py-4 text-right font-sans font-black text-slate-900 whitespace-nowrap">
        <span className="block text-sm lg:text-base">{formatLAK(ord.totalPriceCharged)}</span>
        {ord.remainingUnpaidBalance > 0 && (
          <span className="text-xs font-sans font-bold text-red-500 block mt-1">
            {currentLang === 'lo' ? 'ຄ້າງ:' : 'Unpaid:'} {formatLAK(ord.remainingUnpaidBalance)}
          </span>
        )}
      </td>
      {/* View Details Action */}
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <button
          onClick={() => onViewDetails(ord)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-accent-sky hover:text-white rounded-xl text-xs font-black text-slate-600 transition shadow-sm border border-slate-100"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{currentLang === 'lo' ? 'ເບິ່ງລາຍລະອຽດ' : 'View Details'}</span>
        </button>
      </td>
    </tr>
  );
});

export default OrderRow;
