import React from 'react';
import { TrendingUp, Award } from 'lucide-react';

interface JobProfitabilityAuditProps {
  orderNumber?: string;
  estimatedPrice?: number;
  actualPaperCost?: number;
  actualInkCost?: number;
  actualLaborCost?: number;
  actualDeprecCost?: number;
  currency?: string;
}

export const JobProfitabilityAudit: React.FC<JobProfitabilityAuditProps> = ({
  orderNumber = 'ORD-2026-0815',
  estimatedPrice = 14500000,
  actualPaperCost = 4200000,
  actualInkCost = 1850000,
  actualLaborCost = 1500000,
  actualDeprecCost = 650000,
  currency = 'LAK',
}) => {
  const totalActualCost = actualPaperCost + actualInkCost + actualLaborCost + actualDeprecCost;
  const netProfit = estimatedPrice - totalActualCost;
  const profitMarginPercent = (netProfit / estimatedPrice) * 100;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            ການກວດສອບກຳໄລ ແລະ ຕົ້ນທຶນຜະລິດຕົວຈິງ (Job Profitability Audit)
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            ປຽບທຽບລາຄາສະເໜີຂາຍ vs ຕົ້ນທຶນເບີກຈ່າຍຕົວຈິງໃນໂຮງພິມ ({orderNumber})
          </p>
        </div>
        <div className={`px-4 py-2 rounded-2xl font-black text-sm border flex items-center gap-1.5 ${
          profitMarginPercent >= 30 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          <Award className="w-5 h-5" />
          ກຳໄລສຸດທິ: {profitMarginPercent.toFixed(1)}%
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50/60 border border-blue-100 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-extrabold text-blue-600 block">ລາຄາຂາຍຕາມໃບສະເໜີລາຄາ</span>
          <span className="text-2xl font-black text-slate-900">
            {estimatedPrice.toLocaleString()} {currency}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-extrabold text-slate-500 block">ຕົ້ນທຶນການຜະລິດຕົວຈິງລວມ</span>
          <span className="text-2xl font-black text-slate-800">
            {totalActualCost.toLocaleString()} {currency}
          </span>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-100 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-extrabold text-emerald-600 block">ກຳໄລຂັ້ນຕົ້ນຄົງເຫຼືອຕົວຈິງ</span>
          <span className="text-2xl font-black text-emerald-700">
            +{netProfit.toLocaleString()} {currency}
          </span>
        </div>
      </div>

      {/* Cost Breakdown Progress Bars */}
      <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
        <h4 className="text-sm font-extrabold text-slate-800">ແຈກແຈງຕົ້ນທຶນເບີກຈ່າຍຕົວຈິງ (Actual Cost Allocation)</h4>

        <div className="space-y-3 text-xs font-bold text-slate-700">
          <div>
            <div className="flex justify-between mb-1">
              <span>ເຈ້ຍ FIFO (Paper Cost):</span>
              <span>{actualPaperCost.toLocaleString()} {currency} ({(actualPaperCost / totalActualCost * 100).toFixed(1)}%)</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: `${(actualPaperCost / totalActualCost * 100)}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>ນ້ຳໝຶກພິມ CMY+K (Ink Consumption):</span>
              <span>{actualInkCost.toLocaleString()} {currency} ({(actualInkCost / totalActualCost * 100).toFixed(1)}%)</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600" style={{ width: `${(actualInkCost / totalActualCost * 100)}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>ຄ່າແຮງງານ ແລະ ເຂົ້າເລົ່ມ (Labor & Finishing):</span>
              <span>{actualLaborCost.toLocaleString()} {currency} ({(actualLaborCost / totalActualCost * 100).toFixed(1)}%)</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600" style={{ width: `${(actualLaborCost / totalActualCost * 100)}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>ຄ່າເສື່ອມເຄື່ອງພິມ & ບຳລຸງຮັກສາ (Machine Depreciation):</span>
              <span>{actualDeprecCost.toLocaleString()} {currency} ({(actualDeprecCost / totalActualCost * 100).toFixed(1)}%)</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: `${(actualDeprecCost / totalActualCost * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
