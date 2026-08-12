import React from 'react';
import OrderRow from './OrderRow';

export default function OrdersTable({
  filteredOrders,
  selectedOrder,
  focusRef,
  currentLang,
  formatLAK,
  t,
  getStatusBadgeClass,
  getStatusIcon,
  getPaymentStatusBadge,
  getPaymentStatusIcon,
  onViewDetails
}) {
  return (
    <div className="w-full overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50/70 text-xs lg:text-sm font-black uppercase text-slate-500 tracking-wider border-b border-slate-100">
            <th className="px-6 py-4">Order ID / Date</th>
            <th className="px-6 py-4">ຊື່ລູກຄ້າ / ເບີໂທ</th>
            <th className="px-6 py-4">ລາຍການສັ່ງພິມ</th>
            <th className="px-6 py-4">ສະຖານະການຊຳຣະ</th>
            <th className="px-6 py-4">ສະຖານະການຜະລິດ</th>
            <th className="px-6 py-4 text-right">ຍອດລວມ (LAK)</th>
            <th className="px-6 py-4 text-center">ຈັດການ</th>
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
              isSelected={selectedOrder?.id === ord.id}
              focusRef={selectedOrder?.id === ord.id ? focusRef : null}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
