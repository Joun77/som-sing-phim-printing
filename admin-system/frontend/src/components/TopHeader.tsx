import React, { useState } from 'react';
import { useApp } from '@store/AppContext';
import { useAuthStore } from '@store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { 
  Menu, 
  Coins, 
  ExternalLink, 
  Globe, 
  User, 
  LogOut,
  ChevronRight,
  LayoutDashboard,
  Cpu,
  Calculator,
  ShoppingCart,
  Boxes,
  Printer,
  Truck,
  Settings,
  AlertTriangle,
  PackagePlus,
  ChevronDown,
  ChevronUp,
  X,
  ArrowRight
} from 'lucide-react';

interface TopHeaderProps {
  onToggleMobileSidebar: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function TopHeader({ onToggleMobileSidebar, collapsed, onToggleCollapse }: TopHeaderProps) {
  const { 
    activeTab, 
    setActiveTab, 
    setIsRatesOpen, 
    currency, 
    exchangeRates, 
    rateMode,
    lowStockAlerts = []
  } = useApp();

  const [profileOpen, setProfileOpen] = useState(false);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const [isAlertExpanded, setIsAlertExpanded] = useState(false);
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const user = useAuthStore((state) => state.user);

  const currentRate = currency === 'LAK' ? 1 : ((exchangeRates[currency] && exchangeRates[currency][rateMode]) || 0);

  const toggleLanguage = () => {
    const nextLang = currentLang === 'lo' ? 'en' : 'lo';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('somsing_lang', nextLang);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return { lo: 'ແຜງຄວບຄຸມລວມ (Overview)', en: 'Dashboard Overview', icon: LayoutDashboard };
      case 'preflight': return { lo: '1. ກວດໄຟລ໌ & ປະເມີນຄ່າສີ CMYK', en: '1. PDF Preflight & Color Cost', icon: Cpu };
      case 'quotation': return { lo: '2. ໃບສະເໜີລາຄາ (Quotations & Pricing)', en: '2. Quotations & Cost Engine', icon: Calculator };
      case 'orders': return { lo: '3. ອໍເດີ & ຕິດຕາມສະຖານະ (Orders)', en: '3. Customer Orders & Production', icon: ShoppingCart };
      case 'crm': return { lo: '4. ຖານຂໍ້ມູນລູກຄ້າ (Customer CRM)', en: '4. Customer Directory & Credit', icon: User };
      case 'catalog': return { lo: '5. ສິນຄ້າໜ້າເວັບ (Web Catalog)', en: '5. Public Web Catalog', icon: Globe };
      case 'tracker': return { lo: 'ຕິດຕາມງານພິມ (Shop Floor Tracker)', en: 'Shop Floor Job Tracker', icon: Printer };
      case 'equipment': return { lo: 'ເຄື່ອງຈັກ & ຊ່າງພິມ (Equipment & PPM)', en: 'Printers & Equipment Maintenance', icon: Printer };
      case 'inventory': return { lo: 'ຄັງສິນຄ້າ & ເສດເຈ້ຍ (Inventory & Offcuts)', en: 'Warehouse Stock & FIFO Batches', icon: Boxes };
      case 'inbound': return { lo: 'ນຳເຂົ້າສິນຄ້າ (Inbound Procurement)', en: 'Material Inbound Procurement', icon: Boxes };
      case 'suppliers': return { lo: 'ຜູ້ສະໜອງ & ໃບສັ່ງຊື້ (Suppliers & PO)', en: 'Vendor Management & Purchase Orders', icon: Truck };
      case 'finance': return { lo: 'ການເງິນ, ບັນຊີ & P/L (Finance Dashboard)', en: 'Finance, Ledger & P/L Reports', icon: Coins };
      case 'hr': return { lo: 'ພະນັກງານ (HR & Employee Management)', en: 'Staff & Payroll Management', icon: User };
      case 'settings':
      case 'profile': return { lo: 'ຕັ້ງຄ່າລະບົບ & ໂປຣໄຟລ໌ (Settings & Profile)', en: 'System Settings & Profile', icon: Settings };
      default: return { lo: 'ສົມສິ່ງພິມ ERP', en: 'Som Sing Phim ERP', icon: LayoutDashboard };
    }
  };

  const hasLowStock = lowStockAlerts.length > 0 && !isAlertDismissed;
  const primaryLowItem = lowStockAlerts[0];
  const pageInfo = getPageTitle();
  const PageIcon = pageInfo.icon;
  const isDarkNav = false;

  return (
    <div className="sticky top-0 z-30 flex flex-col shadow-xs">
      {/* 1. Global Low-Stock Alert Banner */}
      {hasLowStock && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 text-white px-4 sm:px-6 py-2 transition-all animate-fade-in border-b border-amber-400/30">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-100 animate-bounce" />
              </div>
              <div className="text-xs font-black truncate">
                <span className="bg-white/20 px-2 py-0.5 rounded-md font-mono mr-1.5">
                  {lowStockAlerts.length} {currentLang === 'en' ? 'Items Low Stock' : 'ລາຍການໃກ້ໝົດ'}
                </span>
                <span className="text-amber-100">
                  {primaryLowItem?.name || primaryLowItem?.sku} ({Number(primaryLowItem?.stockQty || primaryLowItem?.quantity || 0).toLocaleString()} {primaryLowItem?.consumptionUnit || primaryLowItem?.unit || 'units'} ເຫຼືອ)
                </span>
                {lowStockAlerts.length > 1 && (
                  <button
                    onClick={() => setIsAlertExpanded(!isAlertExpanded)}
                    className="ml-2 underline text-[11px] hover:text-white cursor-pointer font-bold inline-flex items-center gap-0.5"
                  >
                    <span>{isAlertExpanded ? (currentLang === 'en' ? 'Hide' : 'ຫຍໍ້') : `+${lowStockAlerts.length - 1} ${currentLang === 'en' ? 'more' : 'ເພີ່ມເຕີມ'}`}</span>
                    {isAlertExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('inbound')}
                className="px-3 py-1 bg-white hover:bg-amber-50 text-amber-900 rounded-xl text-xs font-black transition active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer border-none"
              >
                <PackagePlus className="w-3.5 h-3.5 text-amber-700" />
                <span>{currentLang === 'en' ? 'Restock Inbound →' : 'ສັ່ງຊື້ເພີ່ມ (Inbound) →'}</span>
              </button>
              <button
                onClick={() => setIsAlertDismissed(true)}
                className="p-1 hover:bg-white/20 rounded-lg text-amber-100 hover:text-white transition cursor-pointer"
                title={currentLang === 'en' ? 'Dismiss Alert' : 'ປິດການແຈ້ງເຕືອນ'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Expanded Low-Stock List */}
          {isAlertExpanded && (
            <div className="mt-2 pt-2 border-t border-white/20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 animate-fade-in">
              {lowStockAlerts.map((item: any) => (
                <div key={item.id || item.sku} className="bg-black/20 backdrop-blur-xs rounded-xl p-2 text-[11px] flex justify-between items-center">
                  <div className="truncate mr-2">
                    <span className="font-bold block truncate">{item.name || item.sku}</span>
                    <span className="text-[10px] text-amber-200 font-mono">SKU: {item.sku || item.id}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-rose-500/80 text-white rounded font-mono font-bold shrink-0">
                    {Number(item.stockQty || item.quantity || 0).toLocaleString()} / {Number(item.minStockThreshold || item.reorder_threshold || 100).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Main Top Header Bar */}
      <header className={`h-20 ${isDarkNav ? 'bg-[#080b11] border-b border-slate-800/80 text-white' : 'bg-white border-b border-slate-200/80 text-slate-900'} px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors duration-200`}>
        {/* Left: Mobile Toggle / Page Title Breadcrumb */}
        <div className="flex items-center gap-3.5">
          {/* Mobile menu trigger */}
          <button
            onClick={onToggleMobileSidebar}
            className={`lg:hidden p-2 rounded-xl transition cursor-pointer ${
              isDarkNav ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className={`hidden lg:flex p-2 rounded-xl transition cursor-pointer ${
              isDarkNav ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page Title with Icon */}
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
              isDarkNav ? 'bg-indigo-950/60 text-cyan-400 border-cyan-500/30' : 'bg-sky-50 text-accent-sky border-sky-100'
            }`}>
              <PageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm sm:text-base font-black leading-tight ${isDarkNav ? 'text-white' : 'text-slate-900'}`}>
                {currentLang === 'en' ? pageInfo.en : pageInfo.lo}
              </h2>
              <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <span>Som Sing Phim</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span className={isDarkNav ? 'text-cyan-400 font-bold' : 'text-sky-600 font-bold'}>{currentLang === 'en' ? pageInfo.en.split('(')[0] : pageInfo.lo.split('(')[0]}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Tools & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Exchange Rate Badge */}
          <button
            onClick={() => setIsRatesOpen(true)}
            className={`hidden sm:flex px-3 py-2 rounded-xl text-xs font-black transition items-center gap-1.5 cursor-pointer select-none border ${
              isDarkNav
                ? 'bg-emerald-950/60 hover:bg-emerald-900/60 border-emerald-500/40 text-emerald-300'
                : 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200/80 text-emerald-700'
            }`}
            title="ຕັ້ງຄ່າອັດຕາແລກປ່ຽນ"
          >
            <Coins className={`w-3.5 h-3.5 ${isDarkNav ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span>{currency} 1={currentRate ? `${currentRate.toLocaleString()}₭` : '1₭'}</span>
          </button>

          {/* Storefront External Link */}
          <a
            href="https://som-sing-phim-service.web.app"
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden md:flex px-3 py-2 rounded-xl text-xs font-black transition items-center gap-1.5 cursor-pointer select-none border ${
              isDarkNav
                ? 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-500/30 text-amber-300'
                : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
            }`}
            title={currentLang === 'en' ? 'Open Customer Storefront' : 'ເປີດໜ້າຮ້ານລູກຄ້າ'}
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
            <span>{currentLang === 'en' ? 'Storefront' : 'ໜ້າຮ້ານ'}</span>
          </a>

          {/* Language Switcher */}
          <button 
            onClick={toggleLanguage}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer select-none border ${
              isDarkNav
                ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
          >
            <span className={currentLang === 'lo' ? (isDarkNav ? 'text-cyan-400 font-black' : 'text-accent-sky font-black') : 'text-slate-400'}>LA</span>
            <span className="text-slate-500">|</span>
            <span className={currentLang === 'en' ? (isDarkNav ? 'text-cyan-400 font-black' : 'text-accent-sky font-black') : 'text-slate-400'}>EN</span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={`flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl transition cursor-pointer border ${
                isDarkNav
                  ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200/80 text-slate-800'
              }`}
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : 'SP'}
              </div>
              <div className="text-left hidden xl:block">
                <div className={`text-xs font-bold leading-tight truncate max-w-[180px] ${isDarkNav ? 'text-slate-200' : 'text-slate-800'}`}>{user?.fullName || 'Owner'}</div>
              </div>
            </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 space-y-3 z-[100] animate-fade-in text-white">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-xs flex items-center justify-center shadow-md">
                  {user?.username ? user.username.substring(0, 2).toUpperCase() : 'SP'}
                </div>
                <div>
                  <div className="text-xs font-black text-white">{user?.fullName || 'ຮ້ານ ສົມສິ່ງພິມ'}</div>
                  <span className="inline-block mt-0.5 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-md border border-emerald-500/30">
                    {user?.role === 'owner' || user?.role === 'admin'
                      ? 'ເຈົ້າຂອງຮ້ານ (Owner)'
                      : user?.role === 'sales'
                      ? 'ພະນັກງານຂາຍ (Sales)'
                      : user?.role === 'production'
                      ? 'ຊ່າງພິມ (Operator)'
                      : user?.role === 'accountant'
                      ? 'ພະນັກງານບັນຊີ (Accountant)'
                      : user?.role?.toUpperCase() || 'SUPER ADMIN'}
                  </span>
                </div>
              </div>

              {/* Role Switcher for Verification & Simulation */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  {currentLang === 'en' ? 'Switch Role (Simulation)' : 'ສະຫຼັບບົດບາດ (Role Switcher)'}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'owner', label: 'Owner' },
                    { id: 'sales', label: 'Sales' },
                    { id: 'production', label: 'Operator' },
                    { id: 'accountant', label: 'Accountant' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        useAuthStore.getState().setUserRole(r.id);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition text-center cursor-pointer ${
                        user?.role === r.id
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-transparent'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setProfileOpen(false);
                  setActiveTab('settings');
                }}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-sky-400" />
                <span>{currentLang === 'en' ? 'Settings & Profile' : 'ຕັ້ງຄ່າລະບົບ & ໂປຣໄຟລ໌'}</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm(currentLang === 'en' ? 'Are you sure you want to sign out?' : 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການອອກຈາກລະບົບ?')) {
                    setProfileOpen(false);
                    useAuthStore.getState().logout();
                  }
                }}
                className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{currentLang === 'en' ? 'Sign Out' : 'ອອກຈາກລະບົບ'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  </div>
  );
}
