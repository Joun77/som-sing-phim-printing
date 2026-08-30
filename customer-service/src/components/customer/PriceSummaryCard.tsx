import React from 'react';
import { Check, Clock } from 'lucide-react';
import { CustomerPriceQuote } from '../../types/pricing';

interface PriceSummaryCardProps {
  quote: CustomerPriceQuote | null;
  isLoading: boolean;
  isScanning: boolean;
}

export const PriceSummaryCard: React.FC<PriceSummaryCardProps> = ({
  quote,
  isLoading,
  isScanning,
}) => {
  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '₭0';
    return `₭${Math.round(val).toLocaleString('th-TH')}`;
  };

  const isAutoVerified = quote?.badge === 'AUTO_VERIFIED';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-100">สรุปราคาประเมิน</h3>
          <p className="text-xs text-slate-400">คำนวณราคาอัตโนมัติ Real-time</p>
        </div>
        {quote && (
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
              isAutoVerified
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {isAutoVerified ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" /> ตรวจไฟล์อัตโนมัติ
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 text-amber-400" /> อัตราประเมินมาตรฐาน
              </>
            )}
          </span>
        )}
      </div>

      {isLoading || isScanning ? (
        <div className="py-8 space-y-3 animate-pulse">
          <div className="h-4 bg-slate-800 rounded w-1/2"></div>
          <div className="h-8 bg-slate-800 rounded w-3/4"></div>
          <div className="h-4 bg-slate-800 rounded w-1/3"></div>
        </div>
      ) : quote ? (
        <div className="space-y-4">
          {/* Rate Per Page & Unit Breakdown */}
          <div className="grid grid-cols-2 gap-4 bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50">
            <div>
              <span className="text-xs text-slate-400 block">ราคาเฉลี่ยต่อหน้า</span>
              <span className="text-base font-semibold text-slate-100">
                {formatCurrency(quote.unitPricePerPage)}
                <span className="text-xs font-normal text-slate-400"> / หน้า</span>
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">ราคาต่อเล่ม / ชิ้น</span>
              <span className="text-base font-semibold text-indigo-300">
                {formatCurrency(quote.totalUnitPrice)}
                <span className="text-xs font-normal text-slate-400"> / เล่ม</span>
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">จำนวนพิมพ์</span>
              <span className="font-medium text-slate-200">{quote.quantity.toLocaleString()} เล่ม</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">จำนวนหน้าต่อเล่ม</span>
              <span className="font-medium text-slate-200">{quote.pageCount} หน้า</span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="border-t border-slate-800 pt-4 flex items-baseline justify-between">
            <span className="text-sm font-medium text-slate-300">ยอดรวมทั้งสิ้น (Subtotal)</span>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                {formatCurrency(quote.subtotal)}
              </span>
              <span className="block text-[11px] text-slate-400">รวมค่าพิมพ์ กระดาษ และเข้าเล่ม</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-slate-400 text-sm">
          กรอกข้อมูลเพื่อคำนวณราคาประเมิน
        </div>
      )}
    </div>
  );
};
