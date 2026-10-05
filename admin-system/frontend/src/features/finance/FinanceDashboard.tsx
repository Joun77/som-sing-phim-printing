import { apiFetch } from '../../api/client';
import { getPaymentConfiguration, setPaymentConfiguration } from '../../api/paymentReview';
import { useApp } from '../../store/AppContext';
import { useAuthStore } from '../../store/useAuthStore';
import React, { useState, useEffect, useRef } from 'react';
import { PaymentVerificationTable } from './PaymentVerificationTable';
import { InvoiceTaxDocumentModal } from './InvoiceTaxDocumentModal';
import { JobProfitabilityAudit } from './JobProfitabilityAudit';
import { BankManagementModal } from './components/BankManagementModal';
import { PLReportPage } from './PLReportPage';
import { ExpenseEntryForm } from './ExpenseEntryForm';
import { ARManagementPage } from './ARManagementPage';
import { APManagementPage } from './APManagementPage';
import { 
  Coins, 
  TrendingUp, 
  Clock, 
  FileCheck, 
  FileText, 
  RefreshCw,
  Wallet,
  CheckCircle2,
  Building2,
  Receipt,
  Truck,
  Layers,
  LayoutDashboard
} from 'lucide-react';

interface FinanceSummary {
  total_sales_lak: number;
  total_sales_thb: number;
  total_sales_usd: number;
  total_ar_unpaid_lak: number;
  total_ar_unpaid_thb: number;
  total_ar_unpaid_usd: number;
  total_ap_unpaid_lak: number;
  pending_slips_count: number;
  gross_profit_margin_percent: number;
  exchange_rate_thb: number;
  exchange_rate_usd: number;
}

export const FinanceDashboard: React.FC = () => {
  const { bankAccounts } = useApp();
  const role = useAuthStore(state => state.user?.role);
  const canConfigure = ['admin', 'manager', 'owner'].includes(role || '');
  const [paymentConfig, setPaymentConfig] = useState<Awaited<ReturnType<typeof getPaymentConfiguration>> | null>(null);
  const [manualDraft, setManualDraft] = useState(false);
  const [methodDraft, setMethodDraft] = useState('');
  const [configPending, setConfigPending] = useState(false);
  const [configError, setConfigError] = useState('');
  const configKeys = useRef(new Map<string, string>());
  const loadConfig = async () => {
    try { const config = await getPaymentConfiguration(); setPaymentConfig(config); setManualDraft(config.manual_qr_enabled); setMethodDraft(config.payment_method_id || ''); setConfigError(''); }
    catch (error) { setConfigError(error instanceof Error ? error.message : 'ບໍ່ສາມາດໂຫຼດການຕັ້ງຄ່າໄດ້'); }
  };
  const saveConfig = async () => {
    if (!canConfigure || !paymentConfig || configPending) return;
    const fingerprint = JSON.stringify([manualDraft, methodDraft, paymentConfig.revision]);
    if (!configKeys.current.has(fingerprint)) configKeys.current.set(fingerprint, crypto.randomUUID());
    setConfigPending(true);
    try { const config = await setPaymentConfiguration(manualDraft, methodDraft || null, paymentConfig.revision, configKeys.current.get(fingerprint)!); setPaymentConfig(config); setConfigError(''); }
    catch (error) { setConfigError(error instanceof Error ? error.message : 'ບໍ່ສາມາດບັນທຶກການຕັ້ງຄ່າໄດ້'); }
    finally { setConfigPending(false); }
  };
  useEffect(() => { void loadConfig(); }, []);
  const [activeTab, setActiveTab] = useState<'overview' | 'pl' | 'ar' | 'ap' | 'expenses' | 'profitability'>('overview');
  const [currency, setCurrency] = useState<'LAK' | 'THB' | 'USD'>('LAK');
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  const fetchFinanceSummary = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/finance/summary');
      const data = await res.json();
      if (!res.ok || data?.status !== 'success' || !data.data || !['total_sales_lak','total_sales_thb','total_sales_usd','total_ar_unpaid_lak','total_ar_unpaid_thb','total_ar_unpaid_usd','total_ap_unpaid_lak','pending_slips_count','gross_profit_margin_percent','exchange_rate_thb','exchange_rate_usd'].every(key => typeof data.data[key] === 'number' && Number.isFinite(data.data[key]))) throw new Error('ບໍ່ສາມາດໂຫຼດສະຫຼຸບການເງິນໄດ້');
      setSummary(data.data); setSummaryError(null);
    } catch (err) {
      setSummaryError('ບໍ່ສາມາດໂຫຼດສະຫຼຸບການເງິນໄດ້. ກະລຸນາລອງໃໝ່');
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
        return `฿${(thb).toLocaleString('th-TH', { maximumFractionDigits: 2 })}`;
      case 'USD':
        return `$${(usd).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
      case 'LAK':
      default:
        return `₭${lak.toLocaleString()}`;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <section className="rounded-2xl border bg-white p-4 space-y-3" aria-label="ຕັ້ງຄ່າຮັບຊຳລະ">
        <h3 className="font-bold">ຕັ້ງຄ່າຮັບຊຳລະ</h3>
        {configError && <p role="alert">{configError}</p>}
        <p>Gateway: ປິດ • ໜ້າລູກຄ້າ: ປິດ</p>
        <p>{paymentConfig ? `QR: ${paymentConfig.manual_qr_enabled ? 'ເປີດ' : 'ປິດ'}` : 'ຍັງບໍ່ມີຂໍ້ມູນການຕັ້ງຄ່າ'}</p>
        <label className="flex gap-3 items-center">ຮັບຊຳລະຜ່ານ QR
          <button type="button" role="switch" aria-label="ຮັບຊຳລະຜ່ານ QR" aria-checked={manualDraft} disabled={!canConfigure || !paymentConfig || configPending} onClick={() => setManualDraft(value => !value)} className={`rounded-full px-4 py-2 focus-visible:ring-2 disabled:opacity-50 ${manualDraft ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>{manualDraft ? 'ເປີດ' : 'ປິດ'}</button>
        </label>
        <label className="block">ບັນຊີຮັບເງິນ
          <select value={methodDraft} disabled={!canConfigure || configPending} onChange={event => setMethodDraft(event.target.value)} className="m-2 rounded-lg border p-2">
            <option value="">ກະລຸນາເລືອກບັນຊີ</option>
            {bankAccounts.filter(method => method.isActive).map(method => <option key={method.id} value={method.id}>{method.bankName} • {method.accountName}</option>)}
          </select>
        </label>
        <button onClick={saveConfig} disabled={!canConfigure || !paymentConfig || configPending} className="rounded-xl border p-2">{configPending ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກການຕັ້ງຄ່າ'}</button>
        <button onClick={loadConfig} disabled={configPending} className="ml-2 rounded-xl border p-2">ລອງໂຫຼດໃໝ່</button>
      </section>
      {summaryError && <p role="alert">{summaryError}</p>}
      {/* Top Banner & Currency Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-navy to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/30">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                ລະບົບການເງິນ ແລະ ບັນຊີ (Finance & Accounting)
              </h2>
              <p className="text-sm font-medium text-slate-400 mt-0.5">
                ໂຮງພິມ ສົມສິ່ງພິມ ERP • ງົບກຳໄລຂາດທຶນ, ລູກໜີ້/ເຈົ້າໜີ້, ລາຍຈ່າຍ ແລະ ກວດສລິບໂອນ
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

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white p-2.5 rounded-2xl border border-slate-100 shadow-xs">
        {[
          { id: 'overview', label: 'ພາບລວມ & ກວດສລິບ (Overview)', icon: LayoutDashboard },
          { id: 'pl', label: 'ງົບກຳໄລ-ຂາດທຶນ (P&L Report)', icon: FileText },
          { id: 'ar', label: 'ລູກໜີ້ການຄ້າ (AR Aging)', icon: Clock },
          { id: 'ap', label: 'ເຈົ້າໜີ້ການຄ້າ (AP Tracking)', icon: Truck },
          { id: 'expenses', label: 'ບັນທຶກລາຍຈ່າຍ (Expenses)', icon: Receipt },
          { id: 'profitability', label: 'ວິເຄາະກຳໄລຕໍ່ Job (Profitability)', icon: Coins },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                isActive 
                  ? 'bg-primary-navy text-white shadow-md shadow-primary-navy/20' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
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
                ລໍຖ້າອະນຸມັດປົດລັອກເຂົ້າສູ່ Production
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
                {summary ? `${summary.gross_profit_margin_percent.toFixed(1)}%` : '—'}
              </div>
              <p className="text-xs font-semibold text-slate-500">
                ຄິດໄລ່ຫັກຕົ້ນທຶນເຈ້ຍ, ໝຶກ ແລະ ຂອງເສຍ
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap justify-end gap-3">
            <button
              onClick={() => setShowBankModal(true)}
              className="py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-xl shadow-slate-900/20 active:scale-95 transition flex items-center gap-2 cursor-pointer text-xs"
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              ຕັ້ງຄ່າຂໍ້ມູນບັນຊີທະນາຄານຮັບເງິນ (Bank Setup)
            </button>
            <button
              onClick={() => setShowDocModal(true)}
              className="py-3 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition flex items-center gap-2 cursor-pointer text-xs"
            >
              <FileText className="w-4 h-4" />
              ອອກໃບບິນ / ໃບແຈ້ງໜີ້ / ໃບກຳກັບພາສີ (Tax Docs)
            </button>
          </div>

          {/* Slip Verification Table Section */}
          <PaymentVerificationTable />
        </div>
      )}

      {/* Tab: P&L Report */}
      {activeTab === 'pl' && <PLReportPage />}

      {/* Tab: Accounts Receivable */}
      {activeTab === 'ar' && <ARManagementPage />}

      {/* Tab: Accounts Payable */}
      {activeTab === 'ap' && <APManagementPage />}

      {/* Tab: Expenses */}
      {activeTab === 'expenses' && <ExpenseEntryForm />}

      {/* Tab: Job Profitability */}
      {activeTab === 'profitability' && <JobProfitabilityAudit />}

      {/* Tax Document Modal */}
      {showDocModal && (
        <InvoiceTaxDocumentModal onClose={() => setShowDocModal(false)} />
      )}

      {/* Bank Account Setup Modal */}
      {showBankModal && (
        <BankManagementModal isOpen onClose={() => setShowBankModal(false)} />
      )}
    </div>
  );
};
