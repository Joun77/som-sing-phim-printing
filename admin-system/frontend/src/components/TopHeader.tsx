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
  Settings
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
    rateMode 
  } = useApp();

  const [profileOpen, setProfileOpen] = useState(false);
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

  const pageInfo = getPageTitle();
  const PageIcon = pageInfo.icon;

  return (
    <header className="h-20 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Toggle / Page Title Breadcrumb */}
      <div className="flex items-center gap-3.5">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Title with Icon */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-accent-sky flex items-center justify-center border border-sky-100 shrink-0">
            <PageIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
              {currentLang === 'en' ? pageInfo.en : pageInfo.lo}
            </h2>
            <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
              <span>Som Sing Phim</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-sky-600 font-bold">{currentLang === 'en' ? pageInfo.en.split('(')[0] : pageInfo.lo.split('(')[0]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Quick Tools & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Exchange Rate Badge */}
        <button
          onClick={() => setIsRatesOpen(true)}
          className="hidden sm:flex px-3 py-2 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-700 rounded-xl text-xs font-black transition items-center gap-1.5 cursor-pointer select-none"
          title="ຕັ້ງຄ່າອັດຕາແລກປ່ຽນ"
        >
          <Coins className="w-3.5 h-3.5 text-emerald-600" />
          <span>{currency} 1={currentRate ? `${currentRate.toLocaleString()}₭` : '1₭'}</span>
        </button>

        {/* Storefront External Link */}
        <a
          href="https://som-sing-phim-service.web.app"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-black transition items-center gap-1.5 cursor-pointer select-none"
          title={currentLang === 'en' ? 'Open Customer Storefront' : 'ເປີດໜ້າຮ້ານລູກຄ້າ'}
        >
          <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
          <span>{currentLang === 'en' ? 'Storefront' : 'ໜ້າຮ້ານ'}</span>
        </a>

        {/* Language Switcher */}
        <button 
          onClick={toggleLanguage}
          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer select-none text-slate-700"
        >
          <span className={currentLang === 'lo' ? 'text-accent-sky font-black' : 'text-slate-400'}>LA</span>
          <span className="text-slate-300">|</span>
          <span className={currentLang === 'en' ? 'text-accent-sky font-black' : 'text-slate-400'}>EN</span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 pr-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl transition cursor-pointer border border-slate-200/80"
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-xs flex items-center justify-center shadow-xs">
              {user?.username ? user.username.substring(0, 2).toUpperCase() : 'SP'}
            </div>
            <div className="text-left hidden xl:block">
              <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">{user?.fullName || 'Owner'}</div>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 space-y-3 z-[100] animate-fade-in text-white">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-xs flex items-center justify-center shadow-md">
                  {user?.username ? user.username.substring(0, 2).toUpperCase() : 'SP'}
                </div>
                <div>
                  <div className="text-xs font-black text-white">{user?.fullName || 'ຮ້ານ ສົມສິ່ງພິມ'}</div>
                  <span className="inline-block mt-0.5 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-md border border-emerald-500/30">
                    {user?.role ? user.role.toUpperCase() : 'SUPER ADMIN'}
                  </span>
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
                  setProfileOpen(false);
                  useAuthStore.getState().logout();
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
  );
}
