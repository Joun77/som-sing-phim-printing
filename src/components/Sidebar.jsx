import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Boxes, 
  Cpu, 
  ShoppingCart, 
  Calculator, 
  RotateCcw,
  Menu,
  X,
  Printer,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Truck,
  User,
  Users
} from 'lucide-react';


export default function Sidebar() {
  const { activeTab, setActiveTab, resetToDefaultData } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(
    localStorage.getItem('somsing_sidebar_collapsed') === 'true'
  );
  
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'lo' ? 'en' : 'lo';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('somsing_lang', nextLang);
  };

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem('somsing_sidebar_collapsed', String(nextVal));
  };

  const handleOpenOrderSystem = (item) => {
    if (item.isExternal) {
      window.open(item.externalUrl || '/orders.html', '_blank');
      return;
    }
    setActiveTab(item.id);
    setIsOpen(false);
  };

  const menuItems = [
    {
      id: 'dashboard',
      labelKey: 'sidebar.dashboard',
      subText: 'Dashboard Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'orders',
      labelKey: 'sidebar.orders',
      subText: 'Launch Order Management Web App',
      icon: ShoppingCart,
      isExternal: true,
      externalUrl: '/orders.html',
    },
    {
      id: 'inbound',
      labelKey: 'sidebar.inbound',
      subText: 'Inbound Procurement',
      icon: Truck,
    },
    {
      id: 'inventory',
      labelKey: 'sidebar.inventory',
      subText: 'Inventory & Supplies',
      icon: Boxes,
    },
    {
      id: 'equipment',
      labelKey: 'sidebar.equipment',
      subText: 'Equipment & Overhead',
      icon: Cpu,
    },
    {
      id: 'crm',
      labelKey: 'sidebar.crm',
      subText: 'Client Directory (CRM)',
      icon: User,
    },
    {
      id: 'hr',
      labelKey: 'sidebar.hr',
      subText: 'HR & Staff Management',
      icon: Users,
    },
  ];

  const handleReset = () => {
    const msg = currentLang === 'lo' 
      ? 'ທ່ານຕ້ອງການຣີເຊັດຂໍ້ມູນທັງໝົດເປັນຄ່າເລີ່ມຕົ້ນ ຫຼື ບໍ່?'
      : 'Do you want to reset all data to default?';
      
    askConfirmation(msg, () => {
      resetToDefaultData();
      showToast(
        currentLang === 'lo' ? 'ຣີເຊັດຂໍ້ມູນສຳເລັດ!' : 'Reset successful!',
        'success'
      );
    });
  };

  return (
    <>
      {/* Mobile Header Nav */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-primary-navy text-white shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent-sky rounded-lg flex items-center justify-center shrink-0"><Printer className="w-5 h-5 text-white" /></div>
          <span className="font-bold text-lg tracking-wider">{t('common.app_name')}</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleLanguage}
            className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-bold transition flex items-center gap-1 select-none"
          >
            <span className={currentLang === 'lo' ? 'text-accent-sky' : 'text-white/60'}>LA</span>
            <span className="text-white/25">|</span>
            <span className={currentLang === 'en' ? 'text-accent-sky' : 'text-white/60'}>EN</span>
          </button>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Core Component */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col bg-primary-navy text-white shadow-2xl transition-all duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:h-screen lg:z-30 w-72
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
      `}>
        {/* Brand Header */}
        <div className={`flex ${isCollapsed ? 'flex-col items-center gap-4 py-6' : 'items-center justify-between px-6 py-8'} border-b border-white/10`}>
          {isCollapsed ? (
            <>
              <div 
                className="cursor-pointer hover:opacity-80 transition"
                onClick={toggleCollapse}
                title="Expand Sidebar"
              >
                <div className="w-10 h-10 bg-accent-sky rounded-xl flex items-center justify-center shrink-0"><Printer className="w-6 h-6 text-white" /></div>
              </div>
              <button 
                onClick={toggleLanguage}
                className="px-1.5 py-1 text-[10px] bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-bold transition flex flex-col items-center gap-0.5 select-none"
              >
                <span className={currentLang === 'lo' ? 'text-accent-sky' : 'text-white/60'}>LA</span>
                <span className={currentLang === 'en' ? 'text-accent-sky' : 'text-white/60'}>EN</span>
              </button>
              <button 
                onClick={toggleCollapse}
                className="p-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition"
                title="Expand Sidebar"
              >
                <ChevronRight className="w-4 h-4 text-white/70" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent-sky rounded-xl flex items-center justify-center shrink-0"><Printer className="w-7 h-7 text-white" /></div>
                <div>
                  <h1 className="font-bold text-lg tracking-wide font-sans">{t('common.app_name')}</h1>
                  <p className="text-[10px] text-white/50 font-medium">Som Sing Printing</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleLanguage}
                  className="px-2 py-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold transition flex items-center gap-1 select-none"
                >
                  <span className={currentLang === 'lo' ? 'text-accent-sky' : 'text-white/60'}>LA</span>
                  <span className="text-white/20">|</span>
                  <span className={currentLang === 'en' ? 'text-accent-sky' : 'text-white/60'}>EN</span>
                </button>
                <button 
                  onClick={toggleCollapse}
                  className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition hidden lg:block"
                  title="Collapse Sidebar"
                >
                  <ChevronLeft className="w-4 h-4 text-white/70" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleOpenOrderSystem(item)}
                title={isCollapsed ? t(item.labelKey) : undefined}
                className={`
                  w-full flex items-center rounded-xl transition-all duration-200 group
                  ${isCollapsed ? 'justify-center p-3.5' : 'gap-4 px-4 py-3.5 text-left'}
                  ${isActive 
                    ? 'bg-accent-sky text-white shadow-lg shadow-accent-sky/25 font-semibold' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white'}`} />
                {!isCollapsed && (
                  <div className="animate-fade-in">
                    <div className="text-sm font-semibold">{t(item.labelKey)}</div>
                    <div className="text-[10px] opacity-60 font-sans tracking-wide mt-0.5">{item.subText}</div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className={`p-4 border-t border-white/10 bg-black/10 flex flex-col ${isCollapsed ? 'items-center gap-3' : 'space-y-3'}`}>
          <button
            onClick={handleReset}
            title={isCollapsed ? (currentLang === 'lo' ? 'ຣີເຊັດຂໍ້ມູນສາທິດ' : 'Reset Demo Data') : undefined}
            className={`
              flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl hover:bg-red-500/20 transition-all font-medium
              ${isCollapsed ? 'p-3.5 w-11 h-11' : 'w-full gap-2.5 px-4 py-3 text-xs'}
            `}
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>{currentLang === 'lo' ? 'ຣີເຊັດຂໍ້ມູນສາທິດ' : 'Reset Demo Data'}</span>}
          </button>
          
          {!isCollapsed ? (
            <div className="text-[10px] text-white/40 text-center font-sans animate-fade-in">
              Som Sing Printing Admin v1.0.0
            </div>
          ) : (
            <span className="text-[9px] text-white/30 font-sans">v1.0</span>
          )}
        </div>
      </aside>
    </>
  );
}
