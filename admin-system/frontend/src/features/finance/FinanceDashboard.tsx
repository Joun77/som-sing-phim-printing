import React, { useState, useEffect } from 'react';
import { PaymentVerificationTable } from './PaymentVerificationTable';
import { InvoiceTaxDocumentModal } from './InvoiceTaxDocumentModal';
import { JobProfitabilityAudit } from './JobProfitabilityAudit';
import { BankAccountConfigModal } from './components/BankAccountConfigModal';
import { 
  Coins, 
  TrendingUp, 
  Clock, 
  FileCheck, 
  FileText, 
  RefreshCw,
  Wallet,
  CheckCircle2,
  Building2
} from 'lucide-react';

interface FinanceSummary {
  total_sales_lak: number;
  total_sales_thb: number;
  total_sales_usd: number;
  total_ar_unpaid_lak: number;
  total_ar_unpaid_thb: number;
  total_ar_unpaid_usd: number;
  pending_slips_count: number;
  gross_profit_margin_percent: number;
  exchange_rate_thb: number;
  exchange_rate_usd: number;
}

export const FinanceDashboard: React.FC = () => {
  const [currency, setCurrency] = useState<'LAK' | 'THB' | 'USD'>('LAK');
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  const fetchFinanceSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/finance/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch finance summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceSummary();
  }, []);

  const getFormattedAmount = (lak: number, thb: number, usd: number) => {
    switch (currency) {
      case 'THB':
        return `฿${(thb || lak / 800).toLocaleString('th-TH', { maximumFractionDigits: 2 })}`;
      case 'USD':
        return `$${(usd || lak / 27000).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
      case 'LAK':
      default:
        return `₭${lak.toLocaleString()}`;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Banner & Currency Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-navy to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/30">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                ສູນການເງິນ ແລະ ບັນຊີຜູ້ບໍລິຫານ (Owner Finance & Accounting)
              </h2>
              <p className="text-sm font-medium text-slate-400 mt-0.5">
                ໂຮງພິມ ສົມສິ່ງພິມ ERP • ບໍລິຫານຍອດຂາຍ, ກວດສລິບໂອນ ແລະ ອອກເອກະສານພາສີຄົບວົງຈອນ
              </p>
            </div>
          </div>
        </div>

        {/* Currency Switcher Controls */}
        <div className="flex items-center gap-3 bg-white/10 p-2 rounded-2xl border border-white/10 shrink-0">
          <span className="text-xs font-bold text-slate-300 pl-2">ສະກຸນເງິນ:</span>
          {(['LAK', 'THB', 'USD'] as const).map((curr) => (
            <button
              key={curr}
              onClick={() => setCurrency(curr)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                currency === curr
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {curr}
            </button>
          ))}
          <button
            onClick={fetchFinanceSummary}
            title="ຣີເຟຣຊຂໍ້ມູນ"
            className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Sales */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-2 relative overflow-hidden group hover:shadow-2xl transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-extrabold text-slate-400 tracking-wider uppercase">
              ຍອດຂາຍລວມສະສົມ (Total Sales)
            </span>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {summary ? getFormattedAmount(summary.total_sales_lak, summary.total_sales_thb, summary.total_sales_usd) : '—'}
          </div>
          <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> ອັບເດດຈາກອໍເດີຕົວຈິງໃນລະບົບ
          </p>
        </div>

        {/* Card 2: Accounts Receivable Unpaid */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-2 relative overflow-hidden group hover:shadow-2xl transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-extrabold text-slate-400 tracking-wider uppercase">
              ຍອດໜີ້ຄ້າງຊຳຣະ (Unpaid AR)
            </span>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 tracking-tight">
            {summary ? getFormattedAmount(summary.total_ar_unpaid_lak, summary.total_ar_unpaid_thb, summary.total_ar_unpaid_usd) : '—'}
          </div>
          <p className="text-xs font-semibold text-slate-500">
            ຍອດເງິນທີ່ລໍຖ້າເກັບຈາກລູກຄ້າ
          </p>
        </div>

        {/* Card 3: Pending Slips */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-2 relative overflow-hidden group hover:shadow-2xl transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-extrabold text-slate-400 tracking-wider uppercase">
              ສລິບລໍຖ້າກວດສອບ (Pending Slips)
            </span>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {summary ? summary.pending_slips_count : 0} <span className="text-base font-bold text-slate-400">ລາຍການ</span>
          </div>
          <p className="text-xs font-semibold text-emerald-600">
            ລໍຖ້າອະນຸມັດປົດລັອກເຂົ້າสู่ Production
          </p>
        </div>

        {/* Card 4: Gross Profit Margin */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-2 relative overflow-hidden group hover:shadow-2xl transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-extrabold text-slate-400 tracking-wider uppercase">
              ອັດຕາກຳໄລຂັ້ນຕົ້ນ (Gross Margin)
            </span>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-indigo-600 tracking-tight">
            {summary ? `${summary.gross_profit_margin_percent}%` : '38.5%'}
          </div>
          <p className="text-xs font-semibold text-slate-500">
            ຄິດໄລ່ຫັກຕົ້ນທຶນເຈ້ຍ, ໝຶກ, ຄ່າແຮງງານ ແລະ ຄ່າເສື່ອມ
          </p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap justify-end gap-3">
        <button
          onClick={() => setShowBankModal(true)}
          className="py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-xl shadow-slate-900/20 active:scale-95 transition flex items-center gap-2 cursor-pointer text-sm"
        >
          <Building2 className="w-5 h-5 text-emerald-400" />
          ຕັ້ງຄ່າຂໍ້ມູນບັນຊີທະນາຄານຮັບເງິນ (Bank Setup)
        </button>
        <button
          onClick={() => setShowDocModal(true)}
          className="py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition flex items-center gap-2 cursor-pointer text-sm"
        >
          <FileText className="w-5 h-5" />
          ອອກໃບບິນ / ໃບແຈ້ງໜີ້ / ໃບກຳກັບພາສີ (Tax Document Generator)
        </button>
      </div>

      {/* Slip Verification Table Section */}
      <PaymentVerificationTable />

      {/* Job Profitability Audit Section */}
      <JobProfitabilityAudit />

      {/* Tax Document Modal */}
      {showDocModal && (
        <InvoiceTaxDocumentModal onClose={() => setShowDocModal(false)} />
      )}

      {/* Bank Account Setup Modal */}
      {showBankModal && (
        <BankAccountConfigModal onClose={() => setShowBankModal(false)} />
      )}
    </div>
  );
};
