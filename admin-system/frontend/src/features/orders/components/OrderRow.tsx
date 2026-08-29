import React from 'react';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  PackageCheck,
  Edit3,
  Trash2
} from 'lucide-react';

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
  onPrintShippingLabel?: (ord: any) => void;
  onEditOrder?: (ord: any) => void;
  onDeleteOrder?: (ord: any) => void;
  isSelected: boolean;
  isRowChecked?: boolean;
  onToggleCheck?: (id: string, e: React.MouseEvent | React.ChangeEvent) => void;
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
  onPrintShippingLabel,
  onEditOrder,
  onDeleteOrder,
  isSelected,
  isRowChecked = false,
  onToggleCheck,
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
      ref={focusRef}
      className={`hover:bg-slate-50/50 transition ${
        isOverdue ? 'bg-red-50/10' : ''
      } ${isSelected ? 'bg-sky-50/30 ring-1 ring-sky-200' : ''} ${isRowChecked ? 'bg-sky-50/40' : ''}`}
    >
      {/* Checkbox Multi-Select */}
      <td className="pl-6 pr-2 py-4 whitespace-nowrap text-center w-10">
        <input
          type="checkbox"
          checked={isRowChecked}
          onChange={(e) => {
            if (onToggleCheck) onToggleCheck(ord.id, e);
          }}
          className="w-4 h-4 rounded-lg text-accent-sky border-slate-300 focus:ring-accent-sky/30 cursor-pointer transition"
        />
      </td>

      {/* 1. Order ID & Date */}
      <td className="px-5 py-4 whitespace-nowrap">
        <span className="font-mono font-black text-slate-900 block text-sm lg:text-base">#{orderIdentifier}</span>
        <span className="text-xs text-slate-400 block font-sans mt-1">Due: {ord.promisedDeliveryDate || ord.delivery_date || '24-48h'}</span>
        {renderSLATimer()}
      </td>

      {/* 2. Customer Info */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-bold text-slate-900 block">{customerName}</span>
        <span className="text-xs text-slate-400 block font-sans mt-0.5">{customerPhone || '-'}</span>
      </td>

      {/* 3. Print Items Summary */}
      <td className="px-6 py-4 min-w-[200px]">
        <span className="font-semibold text-slate-800 line-clamp-1">{itemsSummary()}</span>
      </td>

      {/* 4. Payment Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2.5 py-1 rounded-[8px] text-[10px] sm:text-xs font-extrabold uppercase border ${getPaymentStatusBadge(paymentStatus)}`}>
          {getPaymentStatusIcon(paymentStatus)}
          <span className="ml-1">{paymentStatus === 'Paid' ? (currentLang === 'lo' ? 'ຊຳລະແລ້ວ' : 'Paid') : paymentStatus === 'Deposit' ? (currentLang === 'lo' ? 'ມັດຈຳແລ້ວ' : 'Deposit') : (currentLang === 'lo' ? 'ຍັງບໍ່ຊຳລະ' : 'Unpaid')}</span>
        </span>
      </td>

      {/* 5. Production Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2.5 py-1 rounded-[8px] text-[10px] sm:text-xs font-extrabold uppercase border ${getStatusBadgeClass(statusRaw)}`}>
          {getStatusIcon(statusRaw)}
          <span className="ml-1">{statusDisplay}</span>
        </span>
        {ord.stockDeducted && (
          <span className="block text-[10px] font-black text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 mt-1">
            ຕັດສະຕັອກແລ້ວ
          </span>
        )}
      </td>

      {/* 6. Total Amount */}
      <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-black text-slate-900 text-sm">
        {formatLAK(totalAmountLAK)}
      </td>

      {/* 7. Quick Actions: ໃບປະໜ້າ, ເບິ່ງລາຍລະອຽດ, ແກ້ໄຂ, ລົບ */}
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
          {/* 1. Print Shipping Label */}
          {onPrintShippingLabel && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPrintShippingLabel(ord);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition border border-slate-200 active:scale-95 cursor-pointer shadow-2xs"
              title={currentLang === 'lo' ? 'ພິມໃບປະໜ້າພັດສະດຸ' : 'Print Shipping Label'}
            >
              <PackageCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>{currentLang === 'lo' ? 'ໃບປະໜ້າ' : 'Label'}</span>
            </button>
          )}

          {/* 2. View Details */}
          <button
            type="button"
            onClick={() => onViewDetails(ord)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-950 rounded-xl text-xs font-bold transition shadow-xs border border-slate-200 active:scale-95 cursor-pointer"
            title={currentLang === 'lo' ? 'ເບິ່ງລາຍລະອຽດ' : 'View Details'}
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span>{currentLang === 'lo' ? 'ເບິ່ງລາຍລະອຽດ' : 'Details'}</span>
          </button>

          {/* 3. Edit Order */}
          {onEditOrder && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditOrder(ord);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 hover:text-amber-950 rounded-xl text-xs font-bold transition border border-amber-200 active:scale-95 cursor-pointer shadow-2xs"
              title={currentLang === 'lo' ? 'ແກ້ໄຂອໍເດີ' : 'Edit Order'}
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              <span>{currentLang === 'lo' ? 'ແກ້ໄຂ' : 'Edit'}</span>
            </button>
          )}

          {/* 4. Delete Order */}
          {onDeleteOrder && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteOrder(ord);
              }}
              className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs transition border border-transparent hover:border-red-200 active:scale-95 cursor-pointer"
              title={currentLang === 'lo' ? 'ລົບອໍເດີ' : 'Delete Order'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

export default OrderRow;
