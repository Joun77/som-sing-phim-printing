import React, { useState } from 'react';
import {
  Search,
  Filter,
  Layers,
  Clock,
  Printer,
  Calendar,
  Phone,
  ChevronRight,
  PackageCheck,
  Activity,
  AlertCircle,
  FileText
} from 'lucide-react';

interface ProductionOrderListProps {
  orders: any[];
  onSelectOrder: (order: any) => void;
  formatCurrency: (n: number) => string;
}

export const ProductionOrderList: React.FC<ProductionOrderListProps> = ({
  orders,
  onSelectOrder,
  formatCurrency,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'IN_PRODUCTION' | 'PREPRESS' | 'READY' | 'COMPLETED'>('ALL');

  // Filter orders
  const filtered = orders.filter((o: any) => {
    const st = String(o.status || o.overall_status || '').toUpperCase();
    if (st === 'CANCELLED') return false;

    if (filterTab === 'IN_PRODUCTION' && !['PRINTING', 'CUTTING', 'IN_PRODUCTION'].includes(st)) return false;
    if (filterTab === 'PREPRESS' && !['PREPRESS_CHECK', 'RECEIVED', 'PENDING', 'PAID_PREPRESS', 'QUOTATION'].includes(st)) return false;
    if (filterTab === 'READY' && !['READY', 'READY_FOR_PICKUP'].includes(st)) return false;
    if (filterTab === 'COMPLETED' && !['COMPLETED', 'DELIVERED'].includes(st)) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const id = String(o.orderNumber || o.order_number || o.orderNo || o.id || '').toLowerCase();
    const cust = String(o.customerName || o.customer_name || '').toLowerCase();
    const phone = String(o.customerPhone || o.phone || '').toLowerCase();
    return id.includes(q) || cust.includes(q) || phone.includes(q);
  });

  // Summary Metrics
  const totalActive = orders.filter((o: any) => String(o.status || '').toUpperCase() !== 'CANCELLED').length;
  const inProdCount = orders.filter((o: any) => ['PRINTING', 'CUTTING', 'IN_PRODUCTION'].includes(String(o.status || '').toUpperCase())).length;
  const readyCount = orders.filter((o: any) => ['READY', 'READY_FOR_PICKUP'].includes(String(o.status || '').toUpperCase())).length;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* 1. Metric Banners (Sky-Blue theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-sky-100 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ຄິວງານທັງໝົດໃນລະບົບ</span>
            <div className="text-3xl font-black text-sky-950 font-mono">{totalActive}</div>
            <span className="text-[11px] text-sky-600 font-semibold">ອໍເດີພ້ອມດຳເນີນການ</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-sky-100 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ກຳລັງຜະລິດ / ພິມຈິງ</span>
            <div className="text-3xl font-black text-sky-600 font-mono">{inProdCount}</div>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ແທ່ນພິມກຳລັງແລ່ນງານ
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600">
            <Printer className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-sky-100 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">QC ແລ້ວ / ພ້ອມມອບ</span>
            <div className="text-3xl font-black text-emerald-600 font-mono">{readyCount}</div>
            <span className="text-[11px] text-slate-500 font-semibold">ພ້ອມຈັດສົ່ງໃຫ້ລູກຄ້າ</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Search & Status Filter Bar */}
      <div className="bg-white border border-sky-100 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ຄົ້ນຫາເລກອໍເດີ, ຊື່ລູກຄ້າ, ຫຼື ເບີໂທລະສັບ..."
              className="w-full pl-10 pr-4 py-2.5 bg-sky-50/40 border border-sky-200/80 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-sky-500 focus:bg-white transition"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'ທັງໝົດ' },
              { id: 'IN_PRODUCTION', label: 'ກຳລັງພິມ (In Production)' },
              { id: 'PREPRESS', label: 'ກວດໄຟລ໌ (Pre-press)' },
              { id: 'READY', label: 'ພ້ອມມອບ (Ready)' },
              { id: 'COMPLETED', label: 'ສຳເລັດ (Done)' },
            ].map((tab) => {
              const isActive = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition cursor-pointer ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                      : 'bg-sky-50/60 hover:bg-sky-100/70 text-slate-600 hover:text-slate-900 border border-sky-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Orders Grid Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-sky-100 rounded-3xl p-12 text-center shadow-xs space-y-3">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-black text-slate-700">ບໍ່ພົບລາຍການອໍເດີທີ່ຄົ້ນຫາ</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            ກະລຸນາກວດສອບຄຳຄົ້ນຫາ ຫຼື ປ່ຽນແທັບຕົວກັ່ນຕອງສະຖານະການຜະລິດ
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((ord: any) => {
            const ordNo = ord.orderNumber || ord.order_number || ord.orderNo || ord.id;
            const custName = ord.customerName || ord.customer_name || 'ລູກຄ້າທົ່ວໄປ';
            const phone = ord.customerPhone || ord.phone || '020-5555-5555';
            const dueDate = ord.deliveryDate || ord.dueDate || ord.delivery_date || '2026-09-10';
            const total = ord.totalPriceCharged || ord.totalAmount || ord.total_amount_lak || 0;
            const status = String(ord.status || ord.overall_status || 'IN_PRODUCTION').toUpperCase();
            const items = ord.items || [];
            const itemCount = items.length || 1;

            const isPrinting = ['PRINTING', 'CUTTING', 'IN_PRODUCTION'].includes(status);
            const isReady = ['READY', 'READY_FOR_PICKUP'].includes(status);
            const isDone = ['COMPLETED', 'DELIVERED'].includes(status);

            return (
              <div
                key={ord.id}
                onClick={() => onSelectOrder(ord)}
                className="group bg-white hover:bg-sky-50/30 border border-sky-100 hover:border-sky-300 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
              >
                {/* Header: Order ID & Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-black px-2.5 py-1 bg-sky-100/70 text-sky-800 border border-sky-200/70 rounded-xl">
                      #{ordNo}
                    </span>

                    <span
                      className={`text-[11px] font-black px-2.5 py-0.5 rounded-xl border flex items-center gap-1.5 ${
                        isPrinting
                          ? 'bg-sky-50 text-sky-700 border-sky-200 animate-pulse'
                          : isReady
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isDone
                          ? 'bg-slate-100 text-slate-600 border-slate-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isPrinting ? 'bg-sky-500' : isReady ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span>{status}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-sky-700 transition line-clamp-1">
                      {custName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-medium">
                      <Phone className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span>{phone}</span>
                    </div>
                  </div>
                </div>

                {/* Body: Spec Snapshot */}
                <div className="p-3 bg-sky-50/50 rounded-2xl border border-sky-100/80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span className="text-slate-500">ລາຍການສັ່ງພິມ:</span>
                    <strong className="text-slate-800 font-bold">{itemCount} ລາຍການ</strong>
                  </div>
                  {items.length > 1 && (
                    <div className="flex flex-wrap gap-1 py-1">
                      {items.slice(0, 2).map((it: any, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-lg bg-white border border-sky-200/80 text-[10px] font-semibold text-slate-700 truncate max-w-[130px]">
                          #{i + 1} {it.item_name || it.name || it.description}
                        </span>
                      ))}
                      {items.length > 2 && (
                        <span className="px-1.5 py-0.5 rounded-lg bg-sky-100 text-[10px] font-bold text-sky-800">
                          +{items.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span className="text-slate-500">ກຳນົດສົ່ງ:</span>
                    <span className="text-slate-700 font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-sky-500" />
                      {dueDate}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-medium pt-1 border-t border-sky-200/50">
                    <span className="text-slate-500">ຍອດລວມ:</span>
                    <span className="font-mono font-black text-sky-700">{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Footer: 1-Tap Action Button */}
                <button
                  type="button"
                  className="w-full py-2.5 px-4 bg-white group-hover:bg-sky-500 text-sky-700 group-hover:text-white border border-sky-200 group-hover:border-sky-500 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Activity className="w-4 h-4" />
                  <span>ເບິ່ງລາຍລະອຽດການຜະລິດ (View Specs)</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
