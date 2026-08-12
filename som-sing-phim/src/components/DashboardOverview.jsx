import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  Plus, 
  User, 
  Phone,
  Activity,
  AlertCircle,
  Sparkles,
  Cpu,
  Layers,
  CheckCircle2,
  Calendar,
  X,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  FileQuestion,
  HelpCircle
} from 'lucide-react';
import HistoryAnalytics from './HistoryAnalytics';

export default function DashboardOverview() {
  const { 
    inventory, 
    orders, 
    spoilageLogs, 
    getDashboardStats, 
    addOrder, 
    addSpoilageLog,
    customers,
    showToast,
    askConfirmation,
    formatCurrency
  } = useApp();

  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const stats = getDashboardStats();

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSpoilageModalOpen, setIsSpoilageModalOpen] = useState(false);

  // Wizards Step States
  const [orderStep, setOrderStep] = useState(1); // 1 to 4
  const [spoilageStep, setSpoilageStep] = useState(1); // 1 to 2

  // Order form state
  const [orderCustomer, setOrderCustomer] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderItems, setOrderItems] = useState([{ id: '', quantity: 100, unitCost: 0 }]);
  const [orderDeposit, setOrderDeposit] = useState(0);
  const [orderPaymentMethod, setOrderPaymentMethod] = useState('BCEL One');
  const [orderArtwork, setOrderArtwork] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  
  // Default promised date = tomorrow
  const getTomorrowStr = () => {
    const d = new Date('2026-08-04T09:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };
  const [orderPromisedDate, setOrderPromisedDate] = useState(getTomorrowStr());
  const [orderInstallSchedule, setOrderInstallSchedule] = useState('');
  const [autoDeductStock, setAutoDeductStock] = useState(true);

  // Spoilage form state
  const [spoilageItem, setSpoilageItem] = useState('');
  const [spoilageQty, setSpoilageQty] = useState(10);
  const [spoilageCause, setSpoilageCause] = useState('');

  const orderTotal = orderItems.reduce((sum, item) => {
    return sum + (Number(item.quantity) * Number(item.unitCost));
  }, 0);

  const formatLAK = formatCurrency;

  const lowStockItems = inventory.filter(item => item.stockQty <= item.reorderThreshold);

  // Find urgent deadlines
  const tomorrowStr = getTomorrowStr();
  const urgentOrders = orders.filter(ord => 
    ord.status !== 'Delivered' && 
    (ord.promisedDeliveryDate <= tomorrowStr || ord.paymentStatus === 'Overdue')
  );

  // Credit limit checkers
  const targetCustProfile = customers.find(c => c.name === orderCustomer);
  const targetCustLimit = targetCustProfile ? targetCustProfile.creditLimit : 1000000;
  const targetCustUnpaid = orders
    .filter(o => o.customerName === orderCustomer && o.status !== 'Delivered')
    .reduce((sum, o) => sum + o.remainingUnpaidBalance, 0);
  
  const isCreditExceeded = (targetCustUnpaid + (orderTotal - orderDeposit)) > targetCustLimit;

  const handleAddOrderItem = () => {
    setOrderItems([...orderItems, { id: '', quantity: 100, unitCost: 0 }]);
  };

  const handleRemoveOrderItem = (index) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;

    if (field === 'id') {
      const invItem = inventory.find(i => i.id === value);
      if (invItem) {
        let defaultCharge = invItem.costPerConsumptionUnit * 5;
        if (invItem.category === 'Ink') defaultCharge = invItem.costPerConsumptionUnit * 10;
        newItems[index].unitCost = Math.round(defaultCharge);
      }
    }
    setOrderItems(newItems);
  };

  // Quick preset chips for Deposit
  const applyDepositPreset = (pct) => {
    if (pct === 100) setOrderDeposit(orderTotal);
    else if (pct === 50) setOrderDeposit(Math.round(orderTotal / 2));
    else setOrderDeposit(0);
  };

  const triggerOrderSubmit = () => {
    const filteredItems = orderItems.filter(item => item.id !== '');
    
    const orderData = {
      customerName: orderCustomer,
      phone: orderPhone,
      items: filteredItems.map(item => {
        const invItem = inventory.find(i => i.id === item.id);
        return {
          id: item.id,
          name: invItem ? invItem.name : '',
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost)
        };
      }),
      totalPriceCharged: orderTotal,
      depositAmountPaid: Number(orderDeposit),
      remainingUnpaidBalance: Math.max(0, orderTotal - Number(orderDeposit)),
      paymentMethod: orderPaymentMethod,
      paymentStatus: Number(orderDeposit) >= orderTotal 
        ? 'Fully Paid' 
        : Number(orderDeposit) > 0 
        ? 'Deposit Paid' 
        : 'Pending',
      paidDateTime: Number(orderDeposit) > 0 ? '2026-08-04 09:30' : null,
      artworkLink: orderArtwork,
      notes: orderNotes,
      promisedDeliveryDate: orderPromisedDate,
      installationSchedule: orderInstallSchedule || null
    };

    addOrder(orderData, autoDeductStock);
    setIsOrderModalOpen(false);
    showToast(currentLang === 'lo' ? 'ເພີ່ມອໍເດີໃໝ່ສຳເລັດ!' : 'Order created successfully!', 'success');

    // Reset Form
    setOrderCustomer('');
    setOrderPhone('');
    setOrderItems([{ id: '', quantity: 100, unitCost: 0 }]);
    setOrderDeposit(0);
    setOrderArtwork('');
    setOrderNotes('');
    setOrderInstallSchedule('');
    setOrderStep(1);
  };

  const handleOrderSubmit = (e) => {
    e.preventDefault();
    if (!orderCustomer || !orderPhone) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກລູກຄ້າ ແລະ ໃສ່ເບີໂທ!' : 'Select customer & phone!', 'warning');
      return;
    }
    const filteredItems = orderItems.filter(item => item.id !== '');
    if (filteredItems.length === 0) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກວັດສະດຸພິມຢ່າງໜ້ອຍ 1 ລາຍການ!' : 'Select at least 1 item!', 'warning');
      return;
    }

    if (isCreditExceeded) {
      const msg = currentLang === 'lo'
        ? `ວົງເງິນສິນເຊື່ອຂອງລູກຄ້າກາຍກຳນົດແລ້ວ! (ຍອດຄ້າງທັງໝົດ: ${formatLAK(targetCustUnpaid + (orderTotal - orderDeposit))}, ວົງເງິນ: ${formatLAK(targetCustLimit)}). ທ່ານຕ້ອງການດຳເນີນການຕໍ່ ຫຼື ບໍ່?`
        : `Credit limit exceeded! (Total: ${formatLAK(targetCustUnpaid + (orderTotal - orderDeposit))}, Limit: ${formatLAK(targetCustLimit)}). Do you want to proceed?`;
      
      askConfirmation(msg, triggerOrderSubmit);
    } else {
      triggerOrderSubmit();
    }
  };

  const handleSpoilageSubmit = (e) => {
    e.preventDefault();
    if (!spoilageItem || spoilageQty <= 0) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກວັດສະດຸ ແລະ ປ້ອນຈຳນວນເສຍ!' : 'Select material and enter quantity!', 'warning');
      return;
    }

    addSpoilageLog({
      materialId: spoilageItem,
      quantity: Number(spoilageQty),
      cause: spoilageCause || 'Not specified'
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
    <div className="space-y-8 animate-fade-in text-slate-800">
      
      {/* Welcome & Quick actions header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-primary-navy tracking-tight">
            {t('dashboard.title')}
          </h2>
          <p className="text-base text-slate-500 font-semibold leading-relaxed">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => {
              setOrderStep(1);
              setIsOrderModalOpen(true);
            }}
            className="flex items-center justify-center gap-2.5 px-6 py-4 bg-accent-sky text-white rounded-2xl text-lg font-extrabold shadow-lg shadow-accent-sky/25 hover:bg-accent-sky/95 transition active:scale-95 min-h-[52px]"
          >
            <Plus className="w-6 h-6 shrink-0" />
            <span>{t('dashboard.btn_new_order')}</span>
          </button>
          <button 
            onClick={() => {
              setSpoilageStep(1);
              setIsSpoilageModalOpen(true);
            }}
            className="flex items-center justify-center gap-2.5 px-6 py-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl text-lg font-extrabold hover:bg-red-100/55 transition active:scale-95 min-h-[52px]"
          >
            <AlertTriangle className="w-6 h-6 shrink-0 text-red-600" />
            <span>{t('dashboard.btn_spoilage')}</span>
          </button>
        </div>
      </div>

      {/* Urgent alerts box (No emojis) */}
      {urgentOrders.length > 0 && (
        <div className="bg-red-50/50 border-2 border-red-200 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-red-800 font-extrabold text-lg">
            <AlertCircle className="w-6 h-6 shrink-0 text-red-600 animate-pulse" />
            <span>{t('dashboard.alert_urgent')} ({urgentOrders.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {urgentOrders.map(ord => (
              <div key={ord.id} className="bg-white p-4 rounded-2xl border border-red-100 flex justify-between items-center text-sm shadow-sm">
                <div className="space-y-1">
                  <span className="font-extrabold text-slate-800 block truncate max-w-[150px]">{ord.customerName}</span>
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {t('dashboard.due_date')}: {ord.promisedDeliveryDate}
                  </span>
                </div>
                <span className="text-xs bg-red-100 text-red-800 font-black px-3 py-1 rounded-lg border border-red-200 uppercase">
                  {t(`payment.${ord.paymentStatus}`) || ord.paymentStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BI KPI Cards with accessible sizes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Realized Cashflow (Healthy Status) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <span className="text-base text-slate-500 font-bold">{t('dashboard.kpi_cashflow')}</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-3xl font-black text-slate-900 tracking-wide font-sans">
              {formatLAK(stats.totalRevenue)}
            </h3>
            <p className="text-sm text-slate-400 font-bold">
              {t('dashboard.kpi_cashflow_sub')}
            </p>
          </div>
        </div>

        {/* Pending Receivables (Warning/Clock status) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <span className="text-base text-slate-500 font-bold">{t('dashboard.kpi_receivables')}</span>
            <div className="p-2.5 bg-red-50 text-red-600 rounded-2xl border border-red-100">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-3xl font-black text-red-600 tracking-wide font-sans">
              {formatLAK(stats.outstandingPayments)}
            </h3>
            <p className="text-sm text-red-500/80 font-bold">
              {t('dashboard.kpi_receivables_sub')}
            </p>
          </div>
        </div>

        {/* nominal Profit */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <span className="text-base text-slate-500 font-bold">{t('dashboard.kpi_profit')}</span>
            <div className="p-2.5 bg-accent-sky/10 text-accent-sky rounded-2xl border border-accent-sky/20">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-3xl font-black text-accent-sky tracking-wide font-sans">
              {formatLAK(stats.netProfit)}
            </h3>
            <p className="text-sm text-slate-400 font-bold">
              {t('dashboard.kpi_profit_sub')}
            </p>
          </div>
        </div>

        {/* Active Jobs (Activity layout) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <span className="text-base text-slate-500 font-bold">{t('dashboard.kpi_active_orders')}</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-3xl font-black text-slate-900 tracking-wide">
              {stats.activeOrdersCount} {currentLang === 'lo' ? 'ງານ' : 'Jobs'}
            </h3>
            <p className="text-sm text-blue-600 font-bold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block animate-ping"></span>
              {t('dashboard.kpi_active_orders_sub')}
            </p>
          </div>
        </div>
      </div>

      {/* Realized Cashflow bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
          <Activity className="w-6 h-6 text-accent-sky" />
          <span>{t('dashboard.realized_cashflow')}</span>
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm font-extrabold text-slate-600">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {t('dashboard.cash_collected')} ({realizedPercent}%)
            </span>
            <span className="flex items-center gap-1.5 text-red-600">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              {t('dashboard.cash_unpaid')} ({100 - realizedPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-6 rounded-full overflow-hidden flex border p-0.5">
            <div className="bg-emerald-500 h-full rounded-l-full transition-all duration-500" style={{ width: `${realizedPercent}%` }} />
            <div className="bg-red-500 h-full rounded-r-full transition-all duration-500" style={{ width: `${100 - realizedPercent}%` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-400 font-extrabold font-sans pt-1">
            <span>Collected: {formatLAK(stats.totalRevenue)}</span>
            <span>Outstanding: {formatLAK(stats.outstandingPayments)}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Machine efficiency & warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Machine Efficiencies */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
          <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-600" />
            <span>{t('dashboard.efficiency')}</span>
          </h3>

          <div className="space-y-4">
            {stats.machineEfficiencies.map(eq => (
              <div key={eq.id} className="space-y-2 text-sm font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-700 font-extrabold truncate max-w-[180px]">{eq.name}</span>
                  <span className="font-black text-slate-900 font-sans">{eq.efficiency}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${eq.efficiency > 85 ? 'bg-emerald-500' : eq.efficiency > 60 ? 'bg-amber-500' : 'bg-red-500'}`} 
                    style={{ width: `${eq.efficiency}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deadstock Warnings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
          <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-amber-500" />
            <span>{t('dashboard.deadstock')}</span>
          </h3>

          {stats.deadstockItems.length === 0 ? (
            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 text-sm text-emerald-800 font-semibold flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{t('dashboard.deadstock_ok')}</span>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-extrabold block mb-1">{t('dashboard.deadstock_subtitle')}</span>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {stats.deadstockItems.map(item => (
                  <div key={item.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between text-sm font-semibold text-slate-700">
                    <span className="truncate max-w-[150px]">{item.name}</span>
                    <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-lg font-black font-sans uppercase">
                      {item.stockQty} {item.consumptionUnit}s
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
          <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <span>{t('dashboard.low_stock')}</span>
          </h3>

          {lowStockItems.length === 0 ? (
            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 text-sm text-emerald-800 font-semibold flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{t('dashboard.low_stock_ok')}</span>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {lowStockItems.map(item => (
                <div key={item.id} className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between text-sm font-semibold">
                  <span className="text-slate-800 font-extrabold truncate max-w-[150px]">{item.name}</span>
                  <span className="font-black text-red-600 font-sans">{item.stockQty} {item.consumptionUnit}s</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reports & BI Analytics integrated at the bottom of Dashboard */}
      <HistoryAnalytics hideHeader={true} />

      {/* ACCESSIBLE STEP-BY-STEP ORDER WIZARD MODAL */}
      {isOrderModalOpen && (
        <dialog 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent outline-none border-none w-full h-full"
          open
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsOrderModalOpen(false)} />
          
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 overflow-y-auto max-h-[90vh] z-10 border border-slate-100 animate-fade-in flex flex-col justify-between">
            <div>
              {/* Header with Wizard indicators */}
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <div>
                  <span className="text-xs uppercase font-extrabold text-accent-sky tracking-wider font-sans">
                    {t('orders.step')} {orderStep} {t('orders.of')} 4
                  </span>
                  <h3 className="text-2xl font-black text-primary-navy mt-1">
                    {t('dashboard.btn_new_order')}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsOrderModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Step indicator bar */}
              <div className="flex gap-2 mb-6">
                {[1, 2, 3, 4].map(st => (
                  <div 
                    key={st} 
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${st <= orderStep ? 'bg-accent-sky' : 'bg-slate-100'}`}
                  />
                ))}
              </div>

              {/* Form contents based on Step */}
              <form onSubmit={handleOrderSubmit} className="space-y-6">
                
                {/* STEP 1: CUSTOMER SELECTION */}
                {orderStep === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <label className="text-lg font-extrabold text-slate-900 block">
                      {t('orders.step_title_1')}
                    </label>

                    {/* Customer Selection Visual Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {customers.map((c, idx) => {
                        const selected = orderCustomer === c.name;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setOrderCustomer(c.name);
                              if (c.name === 'ສົມພອນ ສີວິໄລ') setOrderPhone('020 55667788');
                              else if (c.name === 'ນາງ ແສງດາວ') setOrderPhone('020 22334455');
                              else if (c.name === 'ຮ້ານອາຫານ ທ່າທາງ') setOrderPhone('020 99887766');
                              else if (c.name === 'ໂຮງແຮມ ລ້ານຊ້າງ') setOrderPhone('020 77889900');
                            }}
                            className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between min-h-[100px] ${
                              selected 
                                ? 'border-accent-sky bg-blue-50/50 text-primary-navy shadow-sm' 
                                : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                            }`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="font-extrabold text-base">{c.name}</span>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selected ? 'bg-accent-sky border-accent-sky' : 'border-slate-300'}`}>
                                {selected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                              </div>
                            </div>
                            <span className="text-xs text-slate-400 font-bold mt-2">
                              {t('common.limit')}: {formatLAK(c.creditLimit)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {orderCustomer && (
                      <div className="space-y-2 pt-4 animate-fade-in">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                          {t('orders.verify_phone')}
                        </label>
                        <input 
                          type="text" 
                          required
                          value={orderPhone}
                          onChange={(e) => setOrderPhone(e.target.value)}
                          className="w-full min-h-[50px] px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-sky text-base font-bold font-sans"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: CONFIGURE PRINT MATERIALS */}
                {orderStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <label className="text-lg font-extrabold text-slate-900">
                        {t('orders.step_title_2')}
                      </label>
                      <button 
                        type="button"
                        onClick={handleAddOrderItem}
                        className="text-sm text-accent-sky font-extrabold hover:underline flex items-center gap-1.5"
                      >
                        <Plus className="w-5 h-5" /> {t('orders.add_item')}
                      </button>
                    </div>

                    <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                      {orderItems.map((item, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative group">
                          {/* Selection dropdown */}
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 block uppercase">{t('inventory.material_name')} *</label>
                            <select
                              required
                              value={item.id}
                              onChange={(e) => handleItemChange(idx, 'id', e.target.value)}
                              className="w-full min-h-[48px] p-3 bg-white border-2 rounded-xl focus:outline-none text-sm font-semibold"
                            >
                              <option value="">{t('orders.choose_material')}</option>
                              {inventory.map(inv => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.name} ({inv.stockQty} {t('common.left')})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Qty and price details */}
                          <div className="w-full sm:w-28 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 block uppercase">{t('orders.qty_title')} *</label>
                            <input 
                              type="number" 
                              min="1" 
                              required
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                              className="w-full min-h-[48px] p-3 bg-white border-2 rounded-xl text-center text-sm font-extrabold font-sans"
                            />
                          </div>

                          <div className="w-full sm:w-36 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 block uppercase">{t('orders.price_unit_title')} *</label>
                            <input 
                              type="number" 
                              required
                              value={item.unitCost}
                              onChange={(e) => handleItemChange(idx, 'unitCost', Number(e.target.value))}
                              className="w-full min-h-[48px] p-3 bg-white border-2 rounded-xl text-right text-sm font-extrabold font-sans text-slate-900"
                            />
                          </div>

                          {/* Delete Item Button */}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveOrderItem(idx)}
                            disabled={orderItems.length === 1}
                            className="absolute -top-2.5 -right-2.5 sm:static sm:mt-6 p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl disabled:opacity-30 border"
                            title={t('orders.remove_item')}
                          >
                            <X className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-900 p-5 rounded-2xl flex justify-between items-center text-base font-extrabold text-white mt-4">
                      <span className="text-white/60">{t('orders.estimated_total')}:</span>
                      <span className="text-xl text-accent-sky font-sans font-black">{formatLAK(orderTotal)}</span>
                    </div>
                  </div>
                )}

                {/* STEP 3: PAYMENT & FINANCIALS */}
                {orderStep === 3 && (
                  <div className="space-y-5 animate-fade-in">
                    <label className="text-lg font-extrabold text-slate-900 block">
                      {t('orders.step_title_3')}
                    </label>

                    {/* Show Total */}
                    <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border">
                      <span className="text-slate-500 font-bold">{t('orders.total_price_charged')}:</span>
                      <span className="text-lg font-black font-sans text-slate-950">{formatLAK(orderTotal)}</span>
                    </div>

                    {/* Deposit form field with quick chips */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        {t('orders.deposit')}
                      </label>
                      <input 
                        type="number" 
                        value={orderDeposit}
                        onChange={(e) => setOrderDeposit(Number(e.target.value))}
                        className="w-full min-h-[50px] px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-sky text-base font-bold font-sans text-slate-950"
                      />

                      {/* Deposit quick action chips */}
                      <div className="flex gap-2 pt-1.5">
                        <button
                          type="button"
                          onClick={() => applyDepositPreset(0)}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border rounded-xl text-xs font-black transition active:scale-95"
                        >
                          {t('orders.unpaid_0')}
                        </button>
                        <button
                          type="button"
                          onClick={() => applyDepositPreset(50)}
                          className="px-4 py-2.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black transition active:scale-95"
                        >
                          {t('orders.pay_50')}
                        </button>
                        <button
                          type="button"
                          onClick={() => applyDepositPreset(100)}
                          className="px-4 py-2.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black transition active:scale-95"
                        >
                          {t('orders.pay_100')}
                        </button>
                      </div>
                    </div>

                    {/* Payment methods choices (visual cards) */}
                    <div className="space-y-2.5 pt-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        {t('orders.payment_method')}
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {['BCEL One', 'Cash', 'Transfer'].map(method => {
                          const active = orderPaymentMethod === method;
                          return (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setOrderPaymentMethod(method)}
                              className={`p-4 border-2 rounded-2xl font-extrabold text-sm transition flex flex-col items-center justify-center gap-2 ${
                                active 
                                  ? 'border-accent-sky bg-blue-50/50 text-primary-navy shadow-sm' 
                                  : 'border-slate-200 hover:border-slate-300 text-slate-500 bg-white'
                              }`}
                            >
                              <CreditCard className={`w-5 h-5 ${active ? 'text-accent-sky' : 'text-slate-400'}`} />
                              <span>{method}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: DETAILS, SCHEDULE & ARTWORKS */}
                {orderStep === 4 && (
                  <div className="space-y-4 animate-fade-in">
                    <label className="text-lg font-extrabold text-slate-900 block">
                      {t('orders.step_title_4')}
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Promised Delivery Date */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                          {t('orders.promised_due_date')} *
                        </label>
                        <input 
                          type="date" 
                          required
                          value={orderPromisedDate}
                          onChange={(e) => setOrderPromisedDate(e.target.value)}
                          className="w-full min-h-[48px] px-4 py-2 border-2 rounded-xl focus:outline-none text-sm bg-white font-sans font-bold"
                        />
                      </div>

                      {/* On-site installation schedule */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                          {t('orders.installation_schedule')}
                        </label>
                        <input 
                          type="datetime-local" 
                          value={orderInstallSchedule}
                          onChange={(e) => setOrderInstallSchedule(e.target.value)}
                          className="w-full min-h-[48px] px-4 py-2 border-2 rounded-xl focus:outline-none text-sm bg-white font-sans"
                        />
                      </div>
                    </div>

                    {/* Link artwork */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        {t('orders.artwork_file_link')}
                      </label>
                      <input 
                        type="text" 
                        placeholder={t('orders.artwork_placeholder')}
                        value={orderArtwork}
                        onChange={(e) => setOrderArtwork(e.target.value)}
                        className="w-full min-h-[48px] px-4 py-2 border-2 rounded-xl focus:outline-none text-sm font-semibold"
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        {t('orders.internal_notes')}
                      </label>
                      <textarea 
                        placeholder={t('orders.notes_placeholder')}
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        rows="2"
                        className="w-full p-3 border-2 rounded-xl focus:outline-none text-sm font-semibold"
                      />
                    </div>

                    {/* Auto deduction checkbox */}
                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border-2 cursor-pointer hover:bg-slate-100 select-none">
                      <input 
                        type="checkbox" 
                        checked={autoDeductStock}
                        onChange={(e) => setAutoDeductStock(e.target.checked)}
                        className="w-5 h-5 text-accent-sky focus:ring-accent-sky border-slate-300 rounded cursor-pointer"
                      />
                      <span className="text-xs font-extrabold text-slate-700">
                        {t('orders.auto_deduct')}
                      </span>
                    </label>
                  </div>
                )}
              </form>
            </div>

            {/* Wizard Navigation Footer */}
            <div className="flex justify-between items-center border-t pt-5 mt-6 gap-3">
              <div>
                {orderStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setOrderStep(orderStep - 1)}
                    className="flex items-center gap-1.5 px-5 py-3 border-2 hover:bg-slate-50 text-slate-700 rounded-2xl text-sm font-extrabold transition min-h-[48px]"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span>{t('common.back')}</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-5 py-3 border hover:bg-slate-50 text-slate-500 rounded-2xl text-sm font-bold transition min-h-[48px]"
                >
                  {t('common.cancel')}
                </button>
                
                {orderStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (orderStep === 1 && !orderCustomer) {
                        showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກລູກຄ້າກ່ອນ!' : 'Please select a customer first!', 'warning');
                        return;
                      }
                      if (orderStep === 2) {
                        const hasItems = orderItems.some(i => i.id !== '');
                        if (!hasItems) {
                          showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກວັດສະດຸພິມກ່ອນ!' : 'Please select a material first!', 'warning');
                          return;
                        }
                      }
                      setOrderStep(orderStep + 1);
                    }}
                    className="flex items-center gap-1 px-6 py-3 bg-accent-sky text-white rounded-2xl text-sm font-extrabold shadow-md shadow-accent-sky/15 hover:bg-accent-sky/95 transition min-h-[48px]"
                  >
                    <span>{t('common.next')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOrderSubmit}
                    className="px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-emerald-500/20 transition min-h-[48px] animate-pulse"
                  >
                    {t('common.confirm')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </dialog>
      )}

      {/* ACCESSIBLE STEP-BY-STEP SPOILAGE WIZARD MODAL */}
      {isSpoilageModalOpen && (
        <dialog 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent outline-none border-none w-full h-full"
          open
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSpoilageModalOpen(false)} />

          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 z-10 border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b pb-4 mb-5">
                <div>
                  <span className="text-xs uppercase font-extrabold text-red-500 tracking-wider font-sans">
                    {t('orders.step')} {spoilageStep} {t('orders.of')} 2
                  </span>
                  <h3 className="text-xl font-black text-red-600 mt-1">
                    {t('inventory.modal_spoilage_title')}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsSpoilageModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Wizard Steps indicator */}
              <div className="flex gap-2 mb-5">
                {[1, 2].map(st => (
                  <div 
                    key={st} 
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${st <= spoilageStep ? 'bg-red-500' : 'bg-slate-100'}`}
                  />
                ))}
              </div>

              <form onSubmit={handleSpoilageSubmit} className="space-y-5">
                {/* STEP 1: CHOOSE MATERIAL (Visual cards) */}
                {spoilageStep === 1 && (
                  <div className="space-y-3.5 animate-fade-in">
                    <label className="text-sm font-extrabold text-slate-800 block">
                      {t('orders.choose_wasted_material')}:
                    </label>
                    <div className="grid grid-cols-1 gap-2.5 max-h-[250px] overflow-y-auto pr-1">
                      {inventory.map(item => {
                        const selected = spoilageItem === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSpoilageItem(item.id)}
                            className={`p-3.5 border-2 rounded-2xl text-left transition flex items-center justify-between ${
                              selected 
                                ? 'border-red-500 bg-red-50/30 text-red-950 font-bold shadow-sm' 
                                : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                            }`}
                          >
                            <div>
                              <span className="text-sm font-bold block">{item.name}</span>
                              <span className="text-[10px] text-slate-400 font-sans mt-0.5">{item.stockQty} {t('common.left')}</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selected ? 'bg-red-500 border-red-500' : 'border-slate-300'}`}>
                              {selected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 2: QUANTITY & REASON */}
                {spoilageStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">{t('orders.qty_wasted')} *</label>
                      <input 
                        type="number" 
                        min="1" 
                        required
                        value={spoilageQty}
                        onChange={(e) => setSpoilageQty(Number(e.target.value))}
                        className="w-full min-h-[48px] px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 text-base font-extrabold font-sans text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">{t('orders.reason_cause')}</label>
                      <textarea 
                        placeholder={t('orders.reason_placeholder')}
                        value={spoilageCause}
                        onChange={(e) => setSpoilageCause(e.target.value)}
                        rows="3"
                        className="w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 text-sm font-semibold"
                      />
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Spoilage Navigation Footer */}
            <div className="flex justify-between items-center border-t pt-4 mt-5 gap-3">
              <div>
                {spoilageStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setSpoilageStep(spoilageStep - 1)}
                    className="flex items-center gap-1 px-4 py-2 border-2 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition min-h-[40px]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{t('common.back')}</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsSpoilageModalOpen(false)}
                  className="px-4 py-2 border hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold transition"
                >
                  {t('common.cancel')}
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
                    className="flex items-center gap-1 px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition min-h-[40px]"
                  >
                    <span>{t('common.next')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSpoilageSubmit}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition min-h-[40px]"
                  >
                    {t('common.confirm')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
