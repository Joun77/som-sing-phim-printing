import React from 'react';
import {
  ArrowLeft,
  Calendar,
  Phone,
  QrCode,
  CheckCircle2,
  Clock,
  Printer
} from 'lucide-react';
import type { MasterOrder } from '../../../orders/types';

interface TrackerHeaderProps {
  order: MasterOrder;
  onBack: () => void;
  formatCurrency: (n: number) => string;
}

export const TrackerHeader: React.FC<TrackerHeaderProps> = ({
  order,
  onBack,
  formatCurrency,
}) => {
  const orderNo = order.order_no || order.order_number || order.id;
  const status = order.overall_status || order.status || 'IN_PRODUCTION';
  const total = order.total_amount_lak || 0;
  const deposit = order.deposit_lak || 0;
  const remaining = order.remaining_lak || 0;

  return (
    <header className="bg-white border border-sky-100 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5 animate-fade-in font-sans">
      {/* Top Nav Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sky-100/80 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 hover:text-sky-900 border border-sky-200/80 rounded-2xl text-xs font-black transition active:scale-95 cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ກັບໄປລາຍການອໍເດີ (Back to Orders)</span>
        </button>

        <div className="flex items-center gap-2.5">
          <a
            href={`/api/v1/orders/${orderNo}/job-ticket`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl text-xs font-black shadow-md shadow-sky-500/20 transition active:scale-95 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>ພິມ Job Ticket (PDF A4)</span>
          </a>
        </div>
      </div>

      {/* Main Order Identity & Financials */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-mono font-black px-3 py-1 bg-sky-100 text-sky-800 border border-sky-200 rounded-xl">
              #{orderNo}
            </span>
            <span className="text-xs font-black px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <span>{status}</span>
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-xl flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>ກຳນົດສົ່ງ: {order.delivery_date || '2026-09-10'}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {order.customer_name}
          </h1>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <a
              href={`tel:${order.customer_phone}`}
              className="flex items-center gap-1.5 text-sky-600 hover:text-sky-800 transition font-bold"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{order.customer_phone || '020-5555-5555'}</span>
            </a>
            <span>•</span>
            <span className="text-slate-600 font-semibold">
              {order.items?.length || 1} ລາຍການສັ່ງຜະລິດ
            </span>
          </div>
        </div>

        {/* Right Financial Snapshot */}
        <div className="text-left lg:text-right p-4 bg-sky-50/60 border border-sky-100 rounded-2xl space-y-1 min-w-[240px]">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            ຍອດລວມອໍເດີ (GRAND TOTAL)
          </span>
          <div className="text-2xl sm:text-3xl font-black text-sky-700 font-mono tracking-tight">
            {formatCurrency(total)}
          </div>
          <div className="text-xs text-slate-600 font-bold flex items-center justify-start lg:justify-end gap-2">
            <span>ມັດຈຳ: <strong className="text-slate-800">{formatCurrency(deposit)}</strong></span>
            <span>|</span>
            <span>ຄ້າງ: <strong className="text-amber-600">{formatCurrency(remaining)}</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
};
