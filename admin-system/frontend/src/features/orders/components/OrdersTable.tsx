import React from 'react';
import OrderRow from './OrderRow';
import { Search, RotateCcw, PackageX } from 'lucide-react';

interface OrdersTableProps {
  filteredOrders: any[];
  selectedOrder?: any;
  selectedOrderIds?: string[];
  onToggleSelectAll?: (checked: boolean) => void;
  onToggleSelectOrder?: (orderId: string) => void;
  focusRef?: React.Ref<HTMLTableRowElement>;
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
  onResetFilters?: () => void;
}

export default function OrdersTable({
  filteredOrders,
  selectedOrder,
  selectedOrderIds = [],
  onToggleSelectAll,
  onToggleSelectOrder,
  focusRef,
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
  onResetFilters
}: OrdersTableProps) {
  const isAllSelected = filteredOrders.length > 0 && filteredOrders.every(o => selectedOrderIds.includes(o.id));
  const isSomeSelected = selectedOrderIds.length > 0 && !isAllSelected;

  if (filteredOrders.length === 0) {
    return (
      <div className="w-full bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm space-y-4 animate-fade-in">
        <div className="w-16 h-16 bg-slate-50 text-slate-400 border border-slate-200 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <PackageX className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-800">
            {currentLang === 'lo' ? 'ບໍ່ພົບລາຍການອໍເດີທີ່ກົງກັບເງື່ອນໄຂ' : 'No matching orders found'}
          </h3>
          <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto">
            {currentLang === 'lo' 
              ? 'ລອງປ່ຽນຄຳຄົ້ນຫາ, ປັບຊ່ວງວັນທີ ຫຼື ລ້າງຕົວກັ່ນຕອງເພື່ອສະແດງຜົນທັງໝົດ' 
              : 'Try changing search keywords, date range, or reset filters'}
          </p>
        </div>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{currentLang === 'lo' ? 'ລ້າງຕົວກັ່ນຕອງທັງໝົດ' : 'Reset All Filters'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50/70 text-xs lg:text-sm font-black uppercase text-slate-500 tracking-wider border-b border-slate-100">
            <th className="pl-6 pr-2 py-4 text-center w-10">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isSomeSelected;
                }}
                onChange={(e) => {
                  if (onToggleSelectAll) onToggleSelectAll(e.target.checked);
                }}
                className="w-4 h-4 rounded-lg text-accent-sky border-slate-300 focus:ring-accent-sky/30 cursor-pointer transition"
                title={currentLang === 'lo' ? 'ເລືອກທຸກລາຍການ' : 'Select All'}
              />
            </th>
            <th className="px-5 py-4">Order ID / Date</th>
            <th className="px-6 py-4">ຊື່ລູກຄ້າ / ເບີໂທ</th>
            <th className="px-6 py-4">ລາຍການສັ່ງພິມ</th>
            <th className="px-6 py-4">ສະຖານະການຊຳຣະ</th>
            <th className="px-6 py-4">ສະຖານະການຜະລິດ</th>
            <th className="px-6 py-4 text-right">ຍອດລວມ (LAK)</th>
            <th className="px-6 py-4 text-center">ຈັດການດ່ວນ (QUICK ACTIONS)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {filteredOrders.map(ord => (
            <OrderRow
              key={ord.id}
              ord={ord}
              currentLang={currentLang}
              formatLAK={formatLAK}
              t={t}
              getStatusBadgeClass={getStatusBadgeClass}
              getStatusIcon={getStatusIcon}
              getPaymentStatusBadge={getPaymentStatusBadge}
              getPaymentStatusIcon={getPaymentStatusIcon}
              onViewDetails={onViewDetails}
              onPrintShippingLabel={onPrintShippingLabel}
              onEditOrder={onEditOrder}
              onDeleteOrder={onDeleteOrder}
              isSelected={selectedOrder?.id === ord.id}
              isRowChecked={selectedOrderIds.includes(ord.id)}
              onToggleCheck={onToggleSelectOrder}
              focusRef={selectedOrder?.id === ord.id ? focusRef : null}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
