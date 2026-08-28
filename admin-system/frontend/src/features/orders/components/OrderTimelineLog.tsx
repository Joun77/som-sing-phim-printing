import React from 'react';
import { CheckCircle, Clock, Truck, Printer, FileCheck, DollarSign, User, ShieldCheck } from 'lucide-react';
import { OrderStatus7Step, WORKFLOW_7_STEPS } from '../types';

export interface TimelineLogEntry {
  id: string;
  status: OrderStatus7Step | string;
  title: string;
  detail?: string;
  updatedBy: string;
  role?: string;
  timestamp: string;
  printerName?: string;
  carrierName?: string;
  trackingNumber?: string;
  proofVersion?: string;
  amountLAK?: number;
}

interface OrderTimelineLogProps {
  logs: TimelineLogEntry[];
  currentStatus?: string;
}

export const OrderTimelineLog: React.FC<OrderTimelineLogProps> = ({ logs, currentStatus }) => {
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <DollarSign className="w-4 h-4 text-amber-500" />;
      case 'Pre-Press':
        return <FileCheck className="w-4 h-4 text-cyan-500" />;
      case 'Queued':
      case 'Printing':
        return <Printer className="w-4 h-4 text-indigo-500" />;
      case 'Post-Press':
      case 'Ready for Delivery':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'Delivered':
        return <Truck className="w-4 h-4 text-emerald-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          ປະຫວັດການອັບເດດ ແລະ ຕິດຕາມງານ (Timeline Audit Log)
        </h3>
        {currentStatus && (
          <span className="px-3.5 py-1 bg-emerald-50 text-emerald-700 font-extrabold text-xs rounded-full border border-emerald-200">
            ສະຖານະປະຈຸບັນ: {currentStatus}
          </span>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs font-bold">
          ບໍ່ມີປະຫວັດການອັບເດດສະຖານະ
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {logs.map((log, index) => (
            <div key={log.id || index} className="relative flex items-start gap-4 group">
              {/* Dot Icon */}
              <div className="absolute -left-6 top-0.5 w-6 h-6 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center shadow-sm z-10">
                {getStepIcon(log.status)}
              </div>

              {/* Log Card */}
              <div className="flex-1 bg-slate-50 hover:bg-slate-100/80 p-4 rounded-2xl border border-slate-200/80 transition space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                    {log.title || log.status}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {log.timestamp}
                  </span>
                </div>

                {log.detail && (
                  <p className="text-xs font-bold text-slate-700 mt-1">
                    {log.detail}
                  </p>
                )}

                {/* Additional rich context badges */}
                <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-extrabold">
                  {log.printerName && (
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 flex items-center gap-1">
                      <Printer className="w-3 h-3" /> ເຄື່ອງພິມ: {log.printerName}
                    </span>
                  )}
                  {log.carrierName && (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-100 flex items-center gap-1">
                      <Truck className="w-3 h-3" /> ຂົນສົ່ງ: {log.carrierName} {log.trackingNumber ? `(${log.trackingNumber})` : ''}
                    </span>
                  )}
                  {log.proofVersion && (
                    <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-md border border-cyan-100 flex items-center gap-1">
                      <FileCheck className="w-3 h-3" /> {log.proofVersion}
                    </span>
                  )}
                  {log.updatedBy && (
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md flex items-center gap-1">
                      <User className="w-3 h-3" /> ໂດຍ: {log.updatedBy} {log.role ? `(${log.role})` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
