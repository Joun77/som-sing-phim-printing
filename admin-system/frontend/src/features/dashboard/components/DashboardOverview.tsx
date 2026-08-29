import React, { useState } from 'react';
import { useApp } from '@store/AppContext';
import { useAuthStore } from '@store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  Plus, 
  Activity, 
  AlertCircle, 
  Sparkles, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  Printer, 
  PackageCheck, 
  Calculator, 
  Truck, 
  Clock, 
  Boxes, 
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Percent,
  Droplets,
  FileCheck
} from 'lucide-react';
import { HistoryAnalytics } from '@features/analytics';
import { FormModalTemplate, FormSection } from '@components/common/FormModalTemplate';
import ProfitChart from './ProfitChart';
import SpoilageTimelineChart from './SpoilageTimelineChart';
import TopProductsTable from './TopProductsTable';

export default function DashboardOverview() {
  const { 
    inventory, 
    orders, 
    spoilageLogs, 
    getDashboardStats, 
    addSpoilageLog, 
    showToast, 
    formatCurrency, 
    setActiveTab 
  } = useApp();

  const user = useAuthStore((state) => state.user);
  const userRole = (user?.role || 'owner').toLowerCase();
  const isExecutive = userRole === 'owner' || userRole === 'super_admin' || userRole === 'admin' || userRole === 'manager';

  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const stats = getDashboardStats();

  // Spoilage Modal state
  const [isSpoilageModalOpen, setIsSpoilageModalOpen] = useState(false);
  const [spoilageStep, setSpoilageStep] = useState(1);
  const [spoilageItem, setSpoilageItem] = useState('');
  const [spoilageQty, setSpoilageQty] = useState(10);
  const [spoilageCause, setSpoilageCause] = useState('');

  const formatLAK = formatCurrency;

  const lowStockItems = inventory.filter(item => item.stockQty <= (item.minStockThreshold || item.reorderThreshold || 500));

  // Find urgent deadlines
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };
  const tomorrowStr = getTomorrowStr();
  const urgentOrders = orders.filter(ord => 
    ord.status !== 'Delivered' && ord.status !== 'Completed' &&
    ((ord.promisedDeliveryDate && ord.promisedDeliveryDate <= tomorrowStr) || ord.paymentStatus === 'Overdue')
  );

  // Production Pipeline Queue Counts
  const pipelineCounts = {
    prepress: orders.filter(o => 
      o.status === 'Prepress Check' || 
      o.overall_status === 'Prepress Check' || 
      o.status === 'File Confirmed' || 
      o.status === 'Ready To Print' ||
      o.status === 'Waiting Deposit'
    ).length,
    printing: orders.filter(o => 
      o.status === 'In Production' || 
      o.overall_status === 'In Production' || 
      o.status === 'Printing'
    ).length,
    finishing: orders.filter(o => 
      o.status === 'Finishing' || 
      o.overall_status === 'Finishing' || 
      o.status === 'Binding' || 
      o.status === 'Cutting'
    ).length,
    ready: orders.filter(o => 
      o.status === 'Ready For Pickup' || 
      o.overall_status === 'Ready For Pickup' || 
      o.status === 'Out For Delivery' || 
      o.status === 'Pending Delivery'
    ).length,
  };

  const handleSpoilageSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!spoilageItem || spoilageQty <= 0) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກວັດສະດຸ ແລະ ປ້ອນຈຳນວນເສຍ!' : 'Select material and enter quantity!', 'warning');
      return;
    }

    addSpoilageLog({
      materialId: spoilageItem,
      quantity: Number(spoilageQty),
      cause: spoilageCause || (currentLang === 'lo' ? 'ບໍ່ລະບຸສາເຫດ' : 'Not specified')
    });

    setIsSpoilageModalOpen(false);
    showToast(currentLang === 'lo' ? 'ບັນທຶກວັດສະດຸເສຍຫາຍສຳເລັດ!' : 'Material spoilage logged successfully!', 'success');
    
    // Reset Form
    setSpoilageItem('');
    setSpoilageQty(10);
    setSpoilageCause('');
    setSpoilageStep(1);
  };

  const realizedPercent = Math.round((stats.totalRevenue / (stats.totalRevenue + stats.outstandingPayments || 1)) * 100);

  return (
    <div className="space-y-8 animate-fade-in text-slate-800 pb-12 font-sans">
      
      {/* 1. HERO HEADER & QUICK ACTION SHORTCUTS */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {currentLang === 'lo' ? 'ແຜງຄວບຄຸມໂຮງພິມ' : 'Printing Management Dashboard'}
            </h1>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live ERP
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-500 font-semibold leading-relaxed">
            {currentLang === 'lo' 
              ? 'ຕິດຕາມຍອດຂາຍ, ສະຖານະການຜະລິດ, ຕົ້ນທຶນ ແລະ ຄັງວັດສະດຸແບບ Real-time' 
              : 'Real-time overview of revenue, production queues, job tickets and material inventory.'
            }
          </p>
        </div>

        {/* Quick Action Navigation Buttons (Single Icons, Clean Text) */}
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => setActiveTab('preflight')}
            className="flex items-center gap-2 px-4 py-3 bg-sky-50 text-sky-700 hover:bg-sky-100/80 border border-sky-200 rounded-2xl text-xs sm:text-sm font-black transition active:scale-95 cursor-pointer shadow-xs"
          >
            <Cpu className="w-4 h-4 text-sky-600" />
            <span>{currentLang === 'lo' ? 'ກວດໄຟລ໌ CMYK' : 'Preflight PDF'}</span>
          </button>

          <button 
            onClick={() => setActiveTab('quotation')}
            className="flex items-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80 border border-indigo-200 rounded-2xl text-xs sm:text-sm font-black transition active:scale-95 cursor-pointer shadow-xs"
          >
            <Calculator className="w-4 h-4 text-indigo-600" />
            <span>{currentLang === 'lo' ? 'ໃບສະເໜີລາຄາ' : 'Quotations'}</span>
          </button>

          <button 
            onClick={() => setActiveTab('create_order')}
            className="flex items-center gap-2 px-5 py-3 bg-accent-sky text-white hover:bg-sky-600 rounded-2xl text-xs sm:text-sm font-black shadow-md shadow-sky-500/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ສ້າງອໍເດີໃໝ່' : 'Create Order'}</span>
          </button>

          <button 
            onClick={() => {
              setSpoilageStep(1);
              setIsSpoilageModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100/60 rounded-2xl text-xs sm:text-sm font-black transition active:scale-95 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{currentLang === 'lo' ? 'ບັນທຶກຂອງເສຍ' : 'Log Spoilage'}</span>
          </button>
        </div>
      </div>

      {/* 2. LIVE PRODUCTION PIPELINE MINI-BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-navy to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Printer className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-200">
              {currentLang === 'lo' ? 'ຄິວງານຜະລິດປັດຈຸບັນ (Live Production Queue)' : 'Live Shop Floor Production Pipeline'}
            </h2>
          </div>
          <button 
            onClick={() => setActiveTab('orders')}
            className="text-xs sm:text-sm font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition cursor-pointer"
          >
            <span>{currentLang === 'lo' ? 'ເບິ່ງລາຍການທັງໝົດ' : 'View All Orders'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Step 1: Prepress */}
          <div 
            onClick={() => setActiveTab('orders')}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer flex flex-col justify-between space-y-2 group"
          >
            <div className="flex items-center justify-between text-xs sm:text-sm text-sky-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-sky-400" />
                {currentLang === 'lo' ? '1. ກວດໄຟລ໌ & ແບບ' : '1. Prepress'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-mono font-bold text-xs">
                {pipelineCounts.prepress}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-sans">{pipelineCounts.prepress} {currentLang === 'lo' ? 'ງານ' : 'Jobs'}</div>
          </div>

          {/* Step 2: In Production */}
          <div 
            onClick={() => setActiveTab('orders')}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer flex flex-col justify-between space-y-2 group"
          >
            <div className="flex items-center justify-between text-xs sm:text-sm text-amber-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-amber-400" />
                {currentLang === 'lo' ? '2. ກຳລັງພິມ' : '2. Printing'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold text-xs">
                {pipelineCounts.printing}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-sans">{pipelineCounts.printing} {currentLang === 'lo' ? 'ງານ' : 'Jobs'}</div>
          </div>

          {/* Step 3: Finishing */}
          <div 
            onClick={() => setActiveTab('orders')}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer flex flex-col justify-between space-y-2 group"
          >
            <div className="flex items-center justify-between text-xs sm:text-sm text-indigo-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                {currentLang === 'lo' ? '3. ເຂົ້າເລັ້ມ / ຕັດ' : '3. Finishing'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs">
                {pipelineCounts.finishing}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-sans">{pipelineCounts.finishing} {currentLang === 'lo' ? 'ງານ' : 'Jobs'}</div>
          </div>

          {/* Step 4: Ready For Pickup */}
          <div 
            onClick={() => setActiveTab('orders')}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer flex flex-col justify-between space-y-2 group"
          >
            <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-300 font-bold">
              <span className="flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-emerald-400" />
                {currentLang === 'lo' ? '4. ພ້ອມສົ່ງ / ຮັບ' : '4. Ready'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs">
                {pipelineCounts.ready}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-sans">{pipelineCounts.ready} {currentLang === 'lo' ? 'ງານ' : 'Jobs'}</div>
          </div>
        </div>
      </div>

      {/* 3. URGENT DEADLINES & OVERDUE PAYMENTS */}
      {urgentOrders.length > 0 && (
        <div className="bg-rose-50/70 border-2 border-rose-200/80 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between text-rose-900 font-extrabold text-sm sm:text-base">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 animate-pulse" />
              <span>{currentLang === 'lo' ? 'ອໍເດີດ່ວນທີ່ຕ້ອງສົ່ງ ຫຼື ຄ້າງຊຳຣະ' : 'Urgent Deadlines & Overdue Orders'} ({urgentOrders.length})</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {urgentOrders.map(ord => (
              <div 
                key={ord.id} 
                onClick={() => setActiveTab('orders')}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200/80 flex justify-between items-center shadow-xs cursor-pointer hover:border-rose-300 transition"
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <span className="font-black text-slate-900 text-sm sm:text-base block truncate">{ord.customerName}</span>
                  <span className="text-xs sm:text-sm text-slate-500 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {currentLang === 'lo' ? 'ກຳນົດສົ່ງ:' : 'Due:'} {ord.promisedDeliveryDate || 'Tomorrow'}
                  </span>
                </div>
                <span className="text-xs bg-rose-100 text-rose-800 font-black px-3 py-1.5 rounded-xl border border-rose-200 uppercase shrink-0">
                  {ord.paymentStatus || ord.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. FINANCIAL & OPERATIONAL KPI STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Realized Revenue */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
              {currentLang === 'lo' ? 'ຍອດເງິນຮັບແລ້ວ (Cashflow)' : 'Realized Revenue'}
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-sans">
              {formatLAK(stats.totalRevenue)}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              {currentLang === 'lo' ? 'ເງິນສົດ & ໂອນຜ່ານ BCEL' : 'Realized cash & bank transfers'}
            </p>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
              {currentLang === 'lo' ? 'ລູກໜີ້ຄົງຄ້າງ (AR)' : 'Outstanding Receivables'}
            </span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight font-sans">
              {formatLAK(stats.outstandingPayments)}
            </h3>
            <p className="text-xs sm:text-sm text-rose-500 font-bold flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {currentLang === 'lo' ? 'ລໍຖ້າຊຳຣະສ່ວນທີ່ເຫຼືອ' : 'Pending balance settlements'}
            </p>
          </div>
        </div>

        {/* Nominal Net Profit */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
              {currentLang === 'lo' ? 'ກຳໄລສຸດທິ (Net Profit)' : 'Net Profit Margin'}
            </span>
            <div className="p-2.5 bg-sky-50 text-accent-sky rounded-2xl border border-sky-100">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-accent-sky tracking-tight font-sans">
              {formatLAK(stats.netProfit)}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 font-bold">
              {currentLang === 'lo' ? 'ຫຼັງຫັກຕົ້ນທຶນເຈ້ຍ, ໝຶກ & ແຮງງານ' : 'After paper, ink & machine cost'}
            </p>
          </div>
        </div>

        {/* Active Orders Count */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
              {currentLang === 'lo' ? 'ອໍເດີກຳລັງດຳເນີນງານ' : 'Active Orders'}
            </span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
              {stats.activeOrdersCount} <span className="text-sm font-bold text-slate-400">{currentLang === 'lo' ? 'ລາຍການ' : 'Active Jobs'}</span>
            </h3>
            <p className="text-xs sm:text-sm text-indigo-600 font-bold">
              {currentLang === 'lo' ? 'ຢູ່ໃນສາຍການຜະລິດ' : 'In production pipeline'}
            </p>
          </div>
        </div>
      </div>

      {/* 4.1 EXECUTIVE FINANCIAL & SPOILAGE DRILLDOWN CARDS (OWNER / SUPER_ADMIN) */}
      {isExecutive && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-indigo-500 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>{currentLang === 'lo' ? 'ແຜງວິເຄາະຕົ້ນທຶນ & ກຳໄລຂັ້ນຕົ້ນ (Executive Cost & Margin Audit)' : 'Executive Cost & Gross Margin Audit'}</span>
            </span>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full border border-indigo-200">
              Role: {userRole.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Total Paper Cost */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between min-h-[150px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  {currentLang === 'lo' ? 'ຕົ້ນທຶນເຈ້ຍລວມ (Paper Cost)' : 'Total Paper Cost'}
                </span>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                  <FileCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
                  {formatLAK(stats.paperCostTotal || 0)}
                </h3>
                <p className="text-xs sm:text-sm text-amber-600 font-bold">
                  {currentLang === 'lo' ? 'ຄິດໄລ່ຈາກ Stock Deduction' : 'Deducted from paper stock'}
                </p>
              </div>
            </div>

            {/* Total Ink Cost */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between min-h-[150px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  {currentLang === 'lo' ? 'ຕົ້ນທຶນໝຶກລວມ (Ink Cost)' : 'Total Ink Cost'}
                </span>
                <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-2xl border border-cyan-100">
                  <Droplets className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
                  {formatLAK(stats.inkCostTotal || 0)}
                </h3>
                <p className="text-xs sm:text-sm text-cyan-600 font-bold">
                  {currentLang === 'lo' ? 'ຕາມອັດຕາ Coverage %' : 'Coverage % and impressions'}
                </p>
              </div>
            </div>

            {/* Gross Profit Margin % */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between min-h-[150px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  {currentLang === 'lo' ? 'ອັດຕາກຳໄລຂັ້ນຕົ້ນ (Gross Margin)' : 'Gross Profit Margin'}
                </span>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight font-sans">
                  {stats.grossProfitMargin || 58}%
                </h3>
                <p className="text-xs sm:text-sm text-emerald-600 font-bold">
                  {currentLang === 'lo' ? '(Revenue - Paper - Ink) / Revenue' : 'High profitability index'}
                </p>
              </div>
            </div>

            {/* Spoilage Financial Cost Impact */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between min-h-[150px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  {currentLang === 'lo' ? 'ຕົ້ນທຶນຂອງເສຍ (Spoilage Loss)' : 'Spoilage Cost Impact'}
                </span>
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <h3 className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight font-sans">
                  {formatLAK(stats.spoilageCostImpact || 0)}
                </h3>
                <p className="text-xs sm:text-sm text-rose-500 font-bold">
                  {spoilageLogs.length} {currentLang === 'lo' ? 'ລາຍການເສຍຫາຍ' : 'logged scrap entries'}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 5. REDESIGNED HIGH-END CRITICAL LOW STOCK WIDGET */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {currentLang === 'lo' ? 'ແຈ້ງເຕືອນວັດສະດຸໃກ້ໝົດສາງ (Low Stock Reorder Alerts)' : 'Critical Inventory Reorder Alerts'}
                </h2>
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-black rounded-full">
                  {lowStockItems.length}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-semibold mt-0.5">
                {currentLang === 'lo' ? 'ລາຍການວັດສະດຸທີ່ມີຈຳນວນຕ່ຳກວ່າເກນເຕືອນໄພ ຄວນສັ່ງຊື້ເພີ່ມ' : 'Materials below safe reorder thresholds requiring procurement.'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setActiveTab('suppliers')}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition self-start sm:self-auto cursor-pointer shadow-xs active:scale-95"
          >
            <Truck className="w-4 h-4 text-amber-400" />
            <span>{currentLang === 'lo' ? 'ອອກໃບສັ່ງຊື້ (Create PO)' : 'Create Purchase Order'}</span>
          </button>
        </div>

        {lowStockItems.length === 0 ? (
          <div className="p-8 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center text-sm font-bold text-emerald-800 flex flex-col items-center justify-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            <span className="text-base">{currentLang === 'lo' ? 'ວັດສະດຸ ແລະ ໝຶກທຸກຢ່າງໃນສາງຍັງຄົງພໍພຽງ' : 'All materials and inks are safely stocked.'}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {lowStockItems.slice(0, 4).map(item => {
              const isOut = item.stockQty === 0;

              return (
                <div 
                  key={item.id} 
                  className={`p-5 rounded-2xl border-2 flex flex-col justify-between space-y-4 transition ${
                    isOut 
                      ? 'bg-rose-50/40 border-rose-200' 
                      : 'bg-amber-50/30 border-amber-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        {item.category}
                      </span>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                        isOut ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {isOut ? (currentLang === 'lo' ? 'ໝົດສາງ' : 'Out of Stock') : (currentLang === 'lo' ? 'ໃກ້ໝົດ' : 'Low Stock')}
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm sm:text-base line-clamp-2 leading-snug">
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">SKU: {item.sku || item.id}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {currentLang === 'lo' ? 'ຈຳນວນຄົງເຫຼືອ' : 'Remaining Qty'}
                      </div>
                      <div className={`text-xl sm:text-2xl font-black font-sans ${isOut ? 'text-rose-600' : 'text-amber-600'}`}>
                        {item.stockQty.toLocaleString()} <span className="text-xs font-bold text-slate-500">{item.consumptionUnit || 'units'}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setActiveTab('suppliers')}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                      title={currentLang === 'lo' ? 'ສັ່ງຊື້ເພີ່ມ' : 'Reorder'}
                    >
                      <span>{currentLang === 'lo' ? 'ສັ່ງຊື້' : 'Reorder'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. REALIZED CASHFLOW PROGRESS BAR */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-accent-sky" />
          <span>{currentLang === 'lo' ? 'ສັດສ່ວນການຮັບເງິນຕົວຈິງ (Cash Realization Ratio)' : 'Cashflow Realization Ratio'}</span>
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between text-xs sm:text-sm font-extrabold text-slate-600">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {currentLang === 'lo' ? 'ຮັບເງິນແລ້ວ' : 'Collected'}: {realizedPercent}%
            </span>
            <span className="flex items-center gap-1.5 text-rose-600">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              {currentLang === 'lo' ? 'ຍອດຄ້າງຊຳຣະ' : 'Pending'}: {100 - realizedPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-5 rounded-full overflow-hidden flex border p-0.5">
            <div className="bg-emerald-500 h-full rounded-l-full transition-all duration-500" style={{ width: `${realizedPercent}%` }} />
            <div className="bg-rose-500 h-full rounded-r-full transition-all duration-500" style={{ width: `${100 - realizedPercent}%` }} />
          </div>
          <div className="flex justify-between text-xs sm:text-sm text-slate-400 font-bold font-sans pt-1">
            <span>Collected: {formatLAK(stats.totalRevenue)}</span>
            <span>Outstanding: {formatLAK(stats.outstandingPayments)}</span>
          </div>
        </div>
      </div>

      {/* 7. MACHINE EFFICIENCY & ADVANCED ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Machine Efficiencies */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <span>{currentLang === 'lo' ? 'ປະສິດທິພາບເຄື່ອງຈັກ (Machine OEE)' : 'Machine Efficiency'}</span>
          </h3>

          <div className="space-y-4">
            {(stats.machineEfficiencies || []).map((eq: any) => (
              <div key={eq.id} className="space-y-2 text-xs sm:text-sm font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-700 font-extrabold truncate max-w-[180px]">{eq.name}</span>
                  <span className="font-black text-slate-900 font-sans">{eq.efficiency}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${eq.efficiency > 85 ? 'bg-emerald-500' : eq.efficiency > 60 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                    style={{ width: `${eq.efficiency}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deadstock Warnings */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-500" />
            <span>{currentLang === 'lo' ? 'ວັດສະດຸຄົງສາງດົນ (Deadstock)' : 'Deadstock Inventory'}</span>
          </h3>

          {(stats.deadstockItems || []).length === 0 ? (
            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 text-xs sm:text-sm text-emerald-800 font-semibold flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{currentLang === 'lo' ? 'ບໍ່ມີວັດສະດຸຕົກຄ້າງເກີນ 60 ວັນ' : 'No deadstock items found.'}</span>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {(stats.deadstockItems || []).map((item: any) => (
                <div key={item.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700">
                  <span className="truncate max-w-[150px]">{item.name}</span>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg font-black font-sans">
                    {item.stockQty} {item.consumptionUnit}s
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spoilage Loss Overview */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <span>{currentLang === 'lo' ? 'ອັດຕາຂອງເສຍ (Spoilage Rate)' : 'Spoilage & Waste'}</span>
          </h3>

          <div className="space-y-3">
            <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-1">
              <div className="text-xs text-rose-700 font-bold uppercase tracking-wider">
                {currentLang === 'lo' ? 'ລວມຂອງເສຍທັງໝົດ' : 'Total Logged Spoilage'}
              </div>
              <div className="text-2xl font-black text-rose-600 font-sans">
                {spoilageLogs.length} <span className="text-xs text-slate-500 font-medium">{currentLang === 'lo' ? 'ລາຍການ' : 'Logs'}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSpoilageStep(1);
                setIsSpoilageModalOpen(true);
              }}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{currentLang === 'lo' ? 'ບັນທຶກຂອງເສຍ' : 'Log Spoilage'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8. EXECUTIVE VISUALIZATIONS & DRILL-DOWN ANALYTICS */}
      {isExecutive ? (
        <div className="space-y-8 animate-fade-in">
          {/* Top Products & Revenue Breakdown Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProfitChart />
            <TopProductsTable />
          </div>

          {/* 30-Day Spoilage Timeline with Drilldown */}
          <SpoilageTimelineChart />

          {/* Historical Cashflow & Revenue Trend */}
          <HistoryAnalytics hideHeader={true} />
        </div>
      ) : (
        <HistoryAnalytics hideHeader={true} />
      )}

      {/* UNIFIED DESIGN SYSTEM: SPOILAGE FORM MODAL (ENLARGED & HIGH READABILITY) */}
      <FormModalTemplate
        isOpen={isSpoilageModalOpen}
        onClose={() => setIsSpoilageModalOpen(false)}
        icon={<AlertTriangle className="w-6 h-6 text-white" />}
        title={currentLang === 'lo' ? 'ບັນທຶກວັດສະດຸເສຍຫາຍ (Spoilage Log)' : 'Log Material Spoilage'}
        subtitle={currentLang === 'lo' ? 'ບັນທຶກຈຳນວນເຈ້ຍ, ໝຶກ ຫຼື ວັດສະດຸທີ່ເສຍຫາຍໃນການຜະລິດ' : 'Record scrap paper, wasted ink, or damaged print jobs for audit.'}
        badgeText={currentLang === 'lo' ? `ຂັ້ນຕອນ ${spoilageStep}/2` : `Step ${spoilageStep}/2`}
        maxWidthClass="max-w-3xl"
        footerActions={
          <div className="flex items-center justify-between w-full">
            <div>
              {spoilageStep > 1 && (
                <button
                  type="button"
                  onClick={() => setSpoilageStep(spoilageStep - 1)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{currentLang === 'lo' ? 'ຍ້ອນກັບ' : 'Back'}</span>
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsSpoilageModalOpen(false)}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-bold transition cursor-pointer"
              >
                {currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
              </button>

              {spoilageStep < 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!spoilageItem) {
                      showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກວັດສະດຸກ່ອນ!' : 'Please select a material first!', 'warning');
                      return;
                    }
                    setSpoilageStep(2);
                  }}
                  className="px-6 py-2.5 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-sm font-black shadow-md shadow-sky-500/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{currentLang === 'lo' ? 'ຕໍ່ໄປ' : 'Next'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSpoilageSubmit()}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-black shadow-md shadow-rose-500/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{currentLang === 'lo' ? 'ຢືນຢັນບັນທຶກ' : 'Confirm & Save'}</span>
                </button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* STEP 1: MATERIAL SELECTION (2-COLUMN GRID) */}
          {spoilageStep === 1 && (
            <FormSection
              icon={<Boxes className="w-4 h-4 text-rose-500" />}
              title={currentLang === 'lo' ? '1. ເລືອກວັດສະດຸທີ່ເສຍຫາຍ' : '1. Select Damaged Material'}
              subtitle={currentLang === 'lo' ? 'ເລືອກລາຍການກະດາດ ຫຼື ໝຶກພິມຈາກຄັງສິນຄ້າ' : 'Choose warehouse paper stock or ink item.'}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {inventory.map((item) => {
                  const selected = spoilageItem === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSpoilageItem(item.id)}
                      className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                        selected
                          ? 'border-rose-500 bg-rose-50/60 text-rose-950 shadow-xs'
                          : 'border-slate-200/80 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-black text-slate-400 uppercase tracking-wider">{item.category}</div>
                        <span className="text-sm font-black block text-slate-900 truncate mt-0.5">{item.name}</span>
                        <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                          {item.stockQty} {currentLang === 'lo' ? 'ຍັງເຫຼືອ' : 'in stock'} · SKU: {item.sku || item.id}
                        </span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selected ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300'}`}>
                        {selected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </FormSection>
          )}

          {/* STEP 2: QUANTITY & ROOT CAUSE */}
          {spoilageStep === 2 && (
            <FormSection
              icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
              title={currentLang === 'lo' ? '2. ລະບຸຈຳນວນ ແລະ ສາເຫດ' : '2. Wasted Quantity & Reason'}
              subtitle={currentLang === 'lo' ? 'ກະລຸນາໃສ່ຈຳນວນທີ່ເສຍຫາຍຕົວຈິງ ແລະ ບັນທຶກສາເຫດ' : 'Specify exact scrapped units and failure cause.'}
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-black uppercase text-slate-700 tracking-wider">
                    {currentLang === 'lo' ? 'ຈຳນວນທີ່ເສຍຫາຍ (Units) *' : 'Scrapped Quantity (Units) *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={spoilageQty}
                    onChange={(e) => setSpoilageQty(Number(e.target.value))}
                    className="w-full px-4 py-3.5 bg-white border-2 border-slate-200/80 rounded-xl text-base font-black font-sans text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-black uppercase text-slate-700 tracking-wider">
                    {currentLang === 'lo' ? 'ສາເຫດຂອງເສຍ / ໝາຍເຫດ (Root Cause)' : 'Root Cause & Notes'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={currentLang === 'lo' ? 'ລະບຸສາເຫດ ເຊັ່ນ: ສີເພ້ຽນ, ໃບມີດຕັດກິນຂອບ, ເຈ້ຍຕິດ...' : 'e.g. Color alignment error, blade miscut, paper jam...'}
                    value={spoilageCause}
                    onChange={(e) => setSpoilageCause(e.target.value)}
                    className="w-full p-3.5 bg-white border-2 border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </FormSection>
          )}
        </div>
      </FormModalTemplate>
    </div>
  );
}
