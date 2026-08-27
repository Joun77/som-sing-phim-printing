import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@store/AppContext';
import { useAuthStore } from '@store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Boxes, 
  Cpu, 
  ShoppingCart, 
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
  Calculator,
  ChevronDown,
  Activity,
  Layers,
  FileCheck,
  PackageCheck,
  FileSearch
} from 'lucide-react';

interface NavSubItem {
  id: string;
  labelLao: string;
  labelEn: string;
  descLao: string;
  descEn: string;
  icon: any;
  roles: string[];
}

interface NavGroup {
  id: string;
  labelLao: string;
  labelEn: string;
  icon: any;
  roles: string[];
  isDirectLink?: boolean;
  items?: NavSubItem[];
}

export default function Navbar() {
  const { 
    activeTab, 
    setActiveTab, 
    setIsRatesOpen, 
    currency, 
    exchangeRates, 
    rateMode 
  } = useApp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentRate = currency === 'LAK' ? 1 : ((exchangeRates[currency] && exchangeRates[currency][rateMode]) || 0);

  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const user = useAuthStore((state) => state.user);
  const userRole = (user?.role || 'admin').toLowerCase();

  const toggleLanguage = () => {
    const nextLang = currentLang === 'lo' ? 'en' : 'lo';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('somsing_lang', nextLang);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navGroups: NavGroup[] = [
    {
      id: 'dashboard',
      labelLao: 'ແຜງຄວບຄຸມ',
      labelEn: 'Dashboard',
      icon: LayoutDashboard,
      isDirectLink: true,
      roles: ['admin', 'owner', 'super_admin', 'sales', 'production'],
    },
    {
      id: 'sales_group',
      labelLao: 'ງານຂາຍ & ລູກຄ້າ',
      labelEn: 'Sales & CRM',
      icon: ShoppingCart,
      roles: ['admin', 'owner', 'super_admin', 'sales', 'production'],
      items: [
        {
          id: 'preflight',
          labelLao: '1. ກວດໄຟລ໌ & ປະເມີນຄ່າສີ',
          labelEn: '1. Preflight & Color Cost',
          descLao: 'ວິເຄາະ % ໝຶກ CMYK & ໜ້າພິມ',
          descEn: 'Scan artwork & ink coverage',
          icon: Cpu,
          roles: ['admin', 'owner', 'super_admin', 'sales', 'production'],
        },
        {
          id: 'quotation',
          labelLao: '2. ໃບສະເໜີລາຄາ',
          labelEn: '2. Quotations & Pricing',
          descLao: 'ຄຳນວນຕົ້ນທຶນ & ອອກໃບສະເໜີ',
          descEn: 'Price calculation & quote',
          icon: Calculator,
          roles: ['admin', 'owner', 'super_admin', 'sales'],
        },
        {
          id: 'orders',
          labelLao: '3. ອໍເດີ & ລາຍການສັ່ງພິມ',
          labelEn: '3. Customer Orders',
          descLao: 'ເປີດອໍເດີ & ຕິດຕາມສະຖານະ',
          descEn: 'Manage & track active orders',
          icon: ShoppingCart,
          roles: ['admin', 'owner', 'super_admin', 'sales', 'production'],
        },
        {
          id: 'crm',
          labelLao: '4. ຖານຂໍ້ມູນລູກຄ້າ',
          labelEn: '4. Customer CRM',
          descLao: 'ປະຫວັດລູກຄ້າ & ເຄຣດິດ',
          descEn: 'Client directory & records',
          icon: User,
          roles: ['admin', 'owner', 'super_admin', 'sales'],
        },
        {
          id: 'catalog',
          labelLao: '5. ສິນຄ້າໜ້າເວັບ',
          labelEn: '5. Web Catalog',
          descLao: 'ຕັ້ງຄ່າສິນຄ້າ & ໂປຣໂມຊັນ',
          descEn: 'Public storefront products',
          icon: Globe,
          roles: ['admin', 'owner', 'super_admin', 'sales'],
        },
      ],
    },
    {
      id: 'production_group',
      labelLao: 'ການຜະລິດ',
      labelEn: 'Production',
      icon: Printer,
      roles: ['admin', 'owner', 'super_admin', 'production'],
      items: [
        {
          id: 'tracker',
          labelLao: 'ຕິດຕາມງານພິມ (Shop Floor)',
          labelEn: 'Shop Floor Tracker',
          descLao: 'ສະແກນ QR & ອັບເດດຂັ້ນຕອນ',
          descEn: 'Live job ticket progress',
          icon: Activity,
          roles: ['admin', 'owner', 'super_admin', 'production'],
        },
        {
          id: 'equipment',
          labelLao: 'ເຄື່ອງຈັກ & ຊ່າງພິມ',
          labelEn: 'Printers & Equipment',
          descLao: 'ກວດສອບສະພາບ & ຊ່ອມບຳລຸງ',
          descEn: 'Machine health & PPM checks',
          icon: Printer,
          roles: ['admin', 'owner', 'super_admin', 'production'],
        },
      ],
    },
    {
      id: 'supply_chain_group',
      labelLao: 'ຄັງສິນຄ້າ & ຈັດຊື້',
      labelEn: 'Stock & Supply',
      icon: Boxes,
      roles: ['admin', 'owner', 'super_admin', 'production'],
      items: [
        {
          id: 'inventory',
          labelLao: 'ຄັງສິນຄ້າ & ເສດເຈ້ຍ',
          labelEn: 'Warehouse Inventory',
          descLao: 'ຕັດສະຕັອກ FIFO & ເສດເຈ້ຍ',
          descEn: 'Material stock & offcuts',
          icon: Boxes,
          roles: ['admin', 'owner', 'super_admin', 'sales', 'production'],
        },
        {
          id: 'inbound',
          labelLao: 'ນຳເຂົ້າສິນຄ້າ',
          labelEn: 'Inbound Procurement',
          descLao: 'ບັນທຶກການຮັບວັດສະດຸເຂົ້າ',
          descEn: 'Material inbound history',
          icon: PackageCheck,
          roles: ['admin', 'owner', 'super_admin', 'production'],
        },
        {
          id: 'suppliers',
          labelLao: 'ຜູ້ສະໜອງ & ໃບສັ່ງຊື້ (PO)',
          labelEn: 'Suppliers & Purchase Orders',
          descLao: 'ອອກໃບ PO & ປຽບທຽບລາຄາ',
          descEn: 'Vendor list & PO management',
          icon: Truck,
          roles: ['admin', 'owner', 'super_admin', 'production'],
        },
      ],
    },
    {
      id: 'finance_admin_group',
      labelLao: 'ການເງິນ & ບໍລິຫານ',
      labelEn: 'Finance & Admin',
      icon: Coins,
      roles: ['admin', 'owner', 'super_admin'],
      items: [
        {
          id: 'finance',
          labelLao: 'ການເງິນ, ບັນຊີ & P/L',
          labelEn: 'Finance & Ledger',
          descLao: 'ລາຍຮັບ-ລາຍຈ່າຍ & ໃບກຳກັບ',
          descEn: 'AP/AR, P&L, Tax invoices',
          icon: Coins,
          roles: ['admin', 'owner', 'super_admin'],
        },
        {
          id: 'hr',
          labelLao: 'ພະນັກງານ (HR / Staff)',
          labelEn: 'Employee & HR',
          descLao: 'ລາຍຊື່ພະນັກງານ & ຄ່າແຮງ',
          descEn: 'Staff management & payroll',
          icon: Users,
          roles: ['admin', 'owner', 'super_admin'],
        },
      ],
    },
  ];

  // Filter groups and subitems by user role
  const filteredNavGroups = navGroups
    .filter((group) => {
      if (userRole === 'admin' || userRole === 'owner' || userRole === 'super_admin') return true;
      return group.roles.includes(userRole);
    })
    .map((group) => {
      if (group.isDirectLink || !group.items) return group;
      const filteredItems = group.items.filter((item) => {
        if (userRole === 'admin' || userRole === 'owner' || userRole === 'super_admin') return true;
        return item.roles.includes(userRole);
      });
      return { ...group, items: filteredItems };
    })
    .filter((group) => group.isDirectLink || (group.items && group.items.length > 0));

  const isGroupActive = (group: NavGroup) => {
    if (group.isDirectLink) return activeTab === group.id;
    return group.items?.some((item) => item.id === activeTab);
  };

  return (
    <header className="bg-gradient-to-r from-slate-950 via-primary-navy to-slate-950 text-white shadow-xl sticky top-0 z-50 border-b border-slate-800/80">
      <div className="w-full px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Left: Brand Logo & Title */}
          <div 
            className="flex items-center gap-3 shrink-0 cursor-pointer select-none transition hover:opacity-95" 
            onClick={() => {
              setActiveTab('dashboard');
              setActiveDropdown(null);
            }}
          >
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

          {/* Center: Consolidated Dropdown Navigation (5 Clean Groups) */}
          <nav ref={dropdownRef} className="hidden lg:flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
            {filteredNavGroups.map((group) => {
              const Icon = group.icon;
              const active = isGroupActive(group);
              const isMenuOpen = activeDropdown === group.id;

              if (group.isDirectLink) {
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setActiveTab(group.id);
                      setActiveDropdown(null);
                    }}
                    className={`
                      px-3.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap
                      ${active 
                        ? 'bg-accent-sky text-white shadow-md shadow-accent-sky/30' 
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{currentLang === 'en' ? group.labelEn : group.labelLao}</span>
                  </button>
                );
              }

              return (
                <div key={group.id} className="relative">
                  <button
                    onClick={() => setActiveDropdown(isMenuOpen ? null : group.id)}
                    className={`
                      px-3.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap
                      ${active 
                        ? 'bg-accent-sky/30 text-sky-200 border border-sky-400/40 shadow-sm' 
                        : isMenuOpen
                          ? 'bg-white/15 text-white'
                          : 'text-slate-200 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{currentLang === 'en' ? group.labelEn : group.labelLao}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMenuOpen ? 'rotate-180 text-sky-300' : 'text-slate-400'}`} />
                  </button>

                  {/* Dropdown Menu Modal */}
                  {isMenuOpen && (
                    <div className="absolute left-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-[100] animate-fade-in space-y-1">
                      {group.items?.map((item) => {
                        const ItemIcon = item.icon;
                        const isSubActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              setActiveDropdown(null);
                            }}
                            className={`
                              w-full p-2.5 rounded-xl text-left transition-all flex items-start gap-3 cursor-pointer
                              ${isSubActive 
                                ? 'bg-accent-sky text-white shadow-md shadow-accent-sky/30' 
                                : 'hover:bg-white/10 text-slate-200 hover:text-white'
                              }
                            `}
                          >
                            <div className={`p-2 rounded-lg shrink-0 ${isSubActive ? 'bg-white/20 text-white' : 'bg-white/5 text-sky-400'}`}>
                              <ItemIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-black leading-snug truncate">
                                {currentLang === 'en' ? item.labelEn : item.labelLao}
                              </div>
                              <div className={`text-[11px] truncate ${isSubActive ? 'text-white/80 font-medium' : 'text-slate-400'}`}>
                                {currentLang === 'en' ? item.descEn : item.descLao}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
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
                  {user?.username ? user.username.substring(0, 2).toUpperCase() : 'SP'}
                </div>
                <div className="text-left hidden xl:block">
                  <div className="text-xs font-black text-white leading-tight">{user?.fullName || 'ສົມສິ່ງພິມ (Owner)'}</div>
                  <div className="text-[10px] font-semibold text-emerald-400">{user?.role ? user.role.toUpperCase() : 'SUPER ADMIN'}</div>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 space-y-3 z-[100] animate-fade-in">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-sm flex items-center justify-center shadow-md">
                      {user?.username ? user.username.substring(0, 2).toUpperCase() : 'SP'}
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">{user?.fullName || 'ຮ້ານ ສົມສິ່ງພິມ'}</div>
                      <div className="text-[11px] font-medium text-slate-400">{user?.username ? `${user.username}@somsing.la` : 'admin@somsing.la'}</div>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-md border border-emerald-500/30">
                        {user?.role ? user.role.toUpperCase() : 'SUPER ADMIN'}
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
          <div className="flex lg:hidden items-center gap-2">
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
      </div>

      {/* Mobile & Tablet Drawer Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-slate-900 border-t border-slate-800 px-4 pt-3 pb-6 space-y-4 animate-fade-in shadow-2xl max-h-[80vh] overflow-y-auto">
          {filteredNavGroups.map((group) => {
            const GroupIcon = group.icon;
            if (group.isDirectLink) {
              const isActive = activeTab === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => {
                    setActiveTab(group.id);
                    setMobileOpen(false);
                  }}
                  className={`
                    w-full p-3 rounded-xl text-xs font-black transition-all flex items-center gap-3 cursor-pointer
                    ${isActive 
                      ? 'bg-accent-sky text-white shadow-md shadow-accent-sky/30' 
                      : 'bg-white/5 text-slate-200 hover:bg-white/10'
                    }
                  `}
                >
                  <GroupIcon className="w-4 h-4 text-sky-400" />
                  <span>{currentLang === 'en' ? group.labelEn : group.labelLao}</span>
                </button>
              );
            }

            return (
              <div key={group.id} className="space-y-1.5">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1 flex items-center gap-2">
                  <GroupIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentLang === 'en' ? group.labelEn : group.labelLao}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.items?.map((item) => {
                    const SubIcon = item.icon;
                    const isSubActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileOpen(false);
                        }}
                        className={`
                          p-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 text-left cursor-pointer border
                          ${isSubActive 
                            ? 'bg-accent-sky text-white border-sky-400/40 shadow-md' 
                            : 'bg-white/5 border-white/5 text-slate-200 hover:bg-white/10'
                          }
                        `}
                      >
                        <SubIcon className={`w-4 h-4 shrink-0 ${isSubActive ? 'text-white' : 'text-sky-400'}`} />
                        <div className="flex-1 truncate">
                          <div className="text-xs font-bold leading-tight truncate">
                            {currentLang === 'en' ? item.labelEn : item.labelLao}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

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
