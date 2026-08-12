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

  const renderSLATimer = () => {
    if (!ord.promisedDeliveryDate) return null;
    const promised = new Date(ord.promisedDeliveryDate + 'T23:59:59');
    const now = new Date();
    
    if (ord.status === 'Delivered') {
      return (
        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-black mt-1 inline-block">
          ✓ ສົ່ງມອບແລ້ວ
        </span>
      );
    }
    if (ord.status === 'Cancelled') {
      return (
        <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-black mt-1 inline-block">
          ✗ ຍົກເລີກແລ້ວ
        </span>
      );
    }

    const diffMs = promised.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMs < 0) {
      const daysOverdue = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      return (
        <span className="text-[10px] text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded font-black mt-1 inline-block animate-pulse">
          ⚠ ກາຍກຳນົດ {daysOverdue} ວັນ
        </span>
      );
    } else if (diffDays <= 1) {
      return (
        <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded font-black mt-1 inline-block">
          ⏳ ສົ່ງມື້ນີ້ (ດ່ວນ)
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
        <span className="font-mono font-black text-slate-900 block text-sm lg:text-base">#{ord.id}</span>
        <span className="text-xs text-slate-400 block font-sans mt-1">Due: {ord.promisedDeliveryDate}</span>
        {renderSLATimer()}
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
      {/* Single View Details Action */}
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <button
          type="button"
          onClick={() => onViewDetails(ord)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition shadow-sm border border-slate-200/80 active:scale-95"
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
