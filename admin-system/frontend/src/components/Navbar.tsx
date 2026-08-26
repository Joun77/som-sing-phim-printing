import React, { useState } from 'react';
import { useApp } from '@store/AppContext';
import { useAuthStore } from '@store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Boxes, 
  Cpu, 
  ShoppingCart, 
  RotateCcw,
  Menu,
  X,
  Printer,
  Truck,
  User,
  Users,
  Coins,
  LogOut,
  Globe,
  ExternalLink,
  Calculator
} from 'lucide-react';

export default function Navbar() {
  const { 
    activeTab, 
    setActiveTab, 
    resetToDefaultData, 
    setIsRatesOpen, 
    currency, 
    exchangeRates, 
    rateMode, 
    askConfirmation, 
    showToast 
  } = useApp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const currentRate = currency === 'LAK' ? 1 : ((exchangeRates[currency] && exchangeRates[currency][rateMode]) || 0);

  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'lo' ? 'en' : 'lo';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('somsing_lang', nextLang);
  };

  const navItems = [
    { id: 'dashboard',  labelLao: 'ແຜງຄວບຄຸມ',       labelEn: 'Dashboard',   icon: LayoutDashboard },
    { id: 'preflight',  labelLao: 'ກວດໄຟລ໌ CMYK',     labelEn: 'Preflight',   icon: Cpu },
    { id: 'quotation',  labelLao: 'ໃບສະເໜີລາຄາ',      labelEn: 'Quotations',  icon: Calculator },
    { id: 'orders',     labelLao: 'ອໍເດີ',             labelEn: 'Orders',      icon: ShoppingCart },
    { id: 'crm',        labelLao: 'ລູກຄ້າ',            labelEn: 'Customers',   icon: User },
    { id: 'inbound',    labelLao: 'ນຳເຂົ້າ',           labelEn: 'Inbound',     icon: Truck },
    { id: 'inventory',  labelLao: 'ຄັງສິນຄ້າ',        labelEn: 'Inventory',   icon: Boxes },
    { id: 'equipment',  labelLao: 'ເຄື່ອງຈັກ',         labelEn: 'Equipment',   icon: Printer },
    { id: 'finance',    labelLao: 'ການເງິນ & ບັນຊີ',  labelEn: 'Finance',     icon: Coins },
    { id: 'hr',         labelLao: 'ພະນັກງານ',          labelEn: 'HR / Staff',  icon: Users },
    { id: 'catalog',    labelLao: 'ສິນຄ້າໜ້າເວັບ',     labelEn: 'Web Catalog', icon: Globe },
  ];

  const getNavLabel = (item: typeof navItems[0]) => {
    return currentLang === 'en' ? item.labelEn : item.labelLao;
  };

  return (
    <header className="bg-gradient-to-r from-slate-950 via-primary-navy to-slate-950 text-white shadow-xl sticky top-0 z-50 border-b border-slate-800/80">
      <div className="w-full px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1 shadow-lg shadow-amber-500/20 border-2 border-[#D4AF37] overflow-hidden">
              <img src="/logo.png" alt="Som Sing Phim Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight text-white leading-tight font-sans">
                ສົມສິ່ງພິມ
              </h1>
              <p className="text-[11px] font-bold text-amber-400">SOM SING PHIM · ERP</p>
            </div>
          </div>

          {/* Center: Desktop Navigation Links (Fits in 1 row cleanly) */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap
                    ${isActive 
                      ? 'bg-accent-sky text-white shadow-md shadow-accent-sky/30' 
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{getNavLabel(item)}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Actions & User Profile */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            {/* Currency Exchange Rate Pill */}
            <button
              onClick={() => setIsRatesOpen(true)}
              className="px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer select-none shadow-sm"
              title="ຕັ້ງຄ່າອັດຕາແລກປ່ຽນ"
            >
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currency} 1={currentRate ? `${currentRate.toLocaleString()}₭` : '1₭'}</span>
            </button>

            {/* View Customer Storefront Link */}
            <a
              href="https://som-sing-phim-service.web.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer select-none shadow-sm"
              title={currentLang === 'en' ? 'Open Customer Storefront' : 'ເປີດໜ້າຮ້ານລູກຄ້າ'}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{currentLang === 'en' ? 'Storefront' : 'ໜ້າຮ້ານ'}</span>
            </a>

            {/* Language Switcher */}
            <button 
              onClick={toggleLanguage}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer select-none"
            >
              <span className={currentLang === 'lo' ? 'text-accent-sky font-black' : 'text-white/60'}>LA</span>
              <span className="text-white/30">|</span>
              <span className={currentLang === 'en' ? 'text-accent-sky font-black' : 'text-white/60'}>EN</span>
            </button>

            {/* User Profile Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-xs flex items-center justify-center shadow-md">
                  SP
                </div>
                <div className="text-left hidden xl:block">
                  <div className="text-xs font-black text-white leading-tight">ສົມສິ່ງພິມ (Owner)</div>
                  <div className="text-[10px] font-semibold text-emerald-400">Super Admin</div>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 space-y-3 z-[100] animate-fade-in">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-sm flex items-center justify-center shadow-md">
                      SP
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">ຮ້ານ ສົມສິ່ງພິມ (Owner)</div>
                      <div className="text-[11px] font-medium text-slate-400">som.sing.phim@gmail.com</div>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-md border border-emerald-500/30">
                        {currentLang === 'en' ? 'Super Admin (Owner)' : 'ເຈົ້າຂອງໂຮງພິມ (Super Admin)'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 font-semibold space-y-1">
                    <div>{currentLang === 'en' ? 'Branch:' : 'ສາຂາຫຼັກ:'} <span className="text-white font-bold">Vientiane Head Office</span></div>
                    <div>{currentLang === 'en' ? 'System Status:' : 'ສະຖານະລະບົບ:'} <span className="text-emerald-400 font-bold">Online (Active)</span></div>
                  </div>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setActiveTab('settings');
                    }}
                    className="w-full py-2.5 bg-accent-sky/20 hover:bg-accent-sky/30 text-sky-200 border border-sky-500/30 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-sky-300" />
                    <span>{currentLang === 'en' ? 'Profile & Settings' : 'ຕັ້ງຄ່າໂປຣໄຟລ໌ & ລະບົບ'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      useAuthStore.getState().logout();
                    }}
                    className="w-full py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{currentLang === 'en' ? 'Sign Out' : 'ອອກຈາກລະບົບ (Logout)'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile/Tablet Menu Button */}
          <div className="flex xl:hidden items-center gap-2">
            <button 
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 bg-white/10 border border-white/20 rounded-xl text-xs font-extrabold flex items-center gap-1"
            >
              <span className={currentLang === 'lo' ? 'text-accent-sky' : 'text-white/60'}>LA</span>
              <span className="text-white/30">|</span>
              <span className={currentLang === 'en' ? 'text-accent-sky' : 'text-white/60'}>EN</span>
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Tablet Navigation Bar (Below main header for lg resolution) */}
        <div className="hidden lg:flex xl:hidden pb-3 overflow-x-auto gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer
                  ${isActive 
                    ? 'bg-accent-sky text-white shadow-md shadow-accent-sky/30' 
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{getNavLabel(item)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile & Tablet Drawer Menu */}
      {mobileOpen && (
        <div className="xl:hidden bg-slate-900 border-t border-slate-800 px-4 pt-3 pb-6 space-y-3 animate-fade-in shadow-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileOpen(false);
                  }}
                  className={`
                    p-3.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2.5 text-left cursor-pointer border
                    ${isActive 
                      ? 'bg-accent-sky text-white border-sky-400/40 shadow-lg shadow-accent-sky/25' 
                      : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-sky-400'}`} />
                  <span className="font-extrabold text-[13px] leading-tight truncate">
                    {getNavLabel(item)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-800">
            <button
              onClick={() => {
                setIsRatesOpen(true);
                setMobileOpen(false);
              }}
              className="w-full sm:flex-1 p-3 bg-white/5 hover:bg-white/10 text-emerald-300 text-xs font-bold rounded-xl flex items-center justify-between border border-emerald-500/20"
            >
              <span className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-400" />
                {currentLang === 'en' ? `Exchange Rate (${currency})` : `ອັດຕາແລກປ່ຽນ (${currency})`}
              </span>
              <span className="font-extrabold">1 = {currentRate ? `${currentRate.toLocaleString()}₭` : '—'}</span>
            </button>

            <button
              onClick={() => {
                setMobileOpen(false);
                setActiveTab('settings');
              }}
              className="w-full sm:w-auto p-3 bg-white/5 hover:bg-white/10 text-sky-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-white/10"
            >
              <User className="w-4 h-4 text-sky-400" />
              <span>{currentLang === 'en' ? 'Settings' : 'ຕັ້ງຄ່າ'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
