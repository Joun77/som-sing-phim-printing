import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Printer,
  Layers
} from 'lucide-react';

interface PLReportData {
  from_date: string;
  to_date: string;
  revenue: number;
  cogs: number;
  gross_profit: number;
  expenses: number;
  net_profit: number;
  margin_percent: number;
  paper_cogs: number;
  ink_cogs: number;
  spoilage_cogs: number;
}

export const PLReportPage: React.FC = () => {
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<PLReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPLReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/finance/pl-report?from=${fromDate}&to=${toDate}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch P&L report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPLReport();
  }, [fromDate, toDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">
              ລາຍງານກຳໄລ-ຂາດທຶນ (Profit & Loss Statement)
            </h3>
            <p className="text-xs font-semibold text-slate-400">
              Double-Entry General Ledger P&L Aggregation
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent focus:outline-none text-slate-700"
            />
            <span className="text-slate-400">—</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent focus:outline-none text-slate-700"
            />
          </div>

          <button
            onClick={fetchPLReport}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            ພິມ / Export PDF
          </button>
        </div>
      </div>

      {/* Summary Scoreboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <span className="text-xs font-extrabold text-slate-400 uppercase">ລາຍຮັບລວມ (Total Revenue)</span>
          <div className="text-2xl font-black text-slate-900 font-sans">
            ₭{(data?.revenue || 0).toLocaleString()}
          </div>
          <span className="text-[11px] font-semibold text-emerald-600">4100 Printing Sales</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <span className="text-xs font-extrabold text-slate-400 uppercase">ຕົ້ນທຶນຂາຍ (Total COGS)</span>
          <div className="text-2xl font-black text-rose-600 font-sans">
            ₭{(data?.cogs || 0).toLocaleString()}
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Paper, Ink, Spoilage</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <span className="text-xs font-extrabold text-slate-400 uppercase">ກຳໄລສຸດທິ (Net Profit)</span>
          <div className={`text-2xl font-black font-sans ${(data?.net_profit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ₭{(data?.net_profit || 0).toLocaleString()}
          </div>
          <span className="text-[11px] font-bold text-indigo-600 font-sans">
            Margin: {(data?.margin_percent || 0).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Statement Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <span className="font-extrabold text-sm text-slate-800">
            ງົບກຳໄລ-ຂາດທຶນ (Statement of Profit or Loss)
          </span>
          <span className="text-xs font-bold text-slate-400 font-sans">
            {fromDate} ເຖິງ {toDate}
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-sm">
          {/* Revenue */}
          <div className="p-4 flex justify-between items-center bg-emerald-50/40">
            <span className="font-black text-slate-900">1. ລາຍຮັບຈາກການຂາຍ (Operating Revenue)</span>
            <span className="font-black text-slate-900 font-sans">₭{(data?.revenue || 0).toLocaleString()}</span>
          </div>

          {/* COGS Breakdown */}
          <div className="p-4 space-y-2.5 bg-slate-50/20">
            <div className="font-bold text-slate-700 text-xs uppercase tracking-wider">
              2. ຕົ້ນທຶນການຜະລິດ (Cost of Goods Sold - COGS)
            </div>
            <div className="pl-4 space-y-2 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>• ຕົ້ນທຶນເຈ້ຍ (Paper Consumed - 5100)</span>
                <span className="font-sans font-bold">₭{(data?.paper_cogs || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>• ຕົ້ນທຶນໝຶກພິມ (Ink Consumed - 5200)</span>
                <span className="font-sans font-bold">₭{(data?.ink_cogs || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>• ຕົ້ນທຶນຂອງເສຍ (Spoilage & Scrap - 5300)</span>
                <span className="font-sans font-bold">₭{(data?.spoilage_cogs || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 font-bold text-rose-600 text-xs">
              <span>ລວມຕົ້ນທຶນຂາຍ (Total COGS)</span>
              <span className="font-sans">₭{(data?.cogs || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Gross Profit */}
          <div className="p-4 flex justify-between items-center bg-blue-50/60 font-black text-blue-950">
            <span>3. ກຳໄລຂັ້ນຕົ້ນ (Gross Profit)</span>
            <span className="font-sans text-base">₭{(data?.gross_profit || 0).toLocaleString()}</span>
          </div>

          {/* Expenses Breakdown */}
          <div className="p-4 space-y-2.5">
            <div className="font-bold text-slate-700 text-xs uppercase tracking-wider">
              4. ຄ່າໃຊ້ຈ່າຍໃນການດຳເນີນງານ (Operating Expenses)
            </div>
            <div className="pl-4 space-y-1.5 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>• ຄ່າໃຊ້ຈ່າຍບໍລິຫານ & ສາທາລະນູປະໂພກ (6100-6500)</span>
                <span className="font-sans font-bold">₭{(data?.expenses || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Net Profit */}
          <div className="p-5 flex justify-between items-center bg-slate-900 text-white font-black text-base rounded-b-3xl">
            <span>5. ກຳໄລສຸດທິ (Net Operating Profit)</span>
            <span className="font-sans text-xl text-emerald-400">₭{(data?.net_profit || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
