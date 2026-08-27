import React, { useState } from 'react';
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
  PackageCheck,
  Store,
  Settings,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface NavSubItem {
  id: string;
  labelLao: string;
  labelEn: string;
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

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, collapsed, setCollapsed }: SidebarProps) {
  const { activeTab, setActiveTab } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const user = useAuthStore((state) => state.user);
  const userRole = (user?.role || 'admin').toLowerCase();

  // Collapsible state for accordion groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    sales_group: true,
    production_group: true,
    supply_chain_group: true,
    finance_admin_group: true,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

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
          icon: Cpu,
          roles: ['admin', 'owner', 'super_admin', 'sales', 'production'],
        },
        {
          id: 'quotation',
          labelLao: '2. ໃບສະເໜີລາຄາ',
          labelEn: '2. Quotations & Pricing',
          icon: Calculator,
          roles: ['admin', 'owner', 'super_admin', 'sales'],
        },
        {
          id: 'orders',
          labelLao: '3. ອໍເດີ & ລາຍການສັ່ງພິມ',
          labelEn: '3. Customer Orders',
          icon: ShoppingCart,
          roles: ['admin', 'owner', 'super_admin', 'sales', 'production'],
        },
        {
          id: 'crm',
          labelLao: '4. ຖານຂໍ້ມູນລູກຄ້າ',
          labelEn: '4. Customer CRM',
          icon: User,
          roles: ['admin', 'owner', 'super_admin', 'sales'],
        },
        {
          id: 'catalog',
          labelLao: '5. ສິນຄ້າໜ້າເວັບ',
          labelEn: '5. Web Catalog',
          icon: Globe,
          roles: ['admin', 'owner', 'super_admin', 'sales'],
        },
      ],
    },
    {
      id: 'production_group',
      labelLao: 'ການຜະລິດ',
      labelEn: 'Production Floor',
      icon: Printer,
      roles: ['admin', 'owner', 'super_admin', 'production'],
      items: [
        {
          id: 'tracker',
          labelLao: 'ຕິດຕາມງານພິມ (Shop Floor)',
          labelEn: 'Shop Floor Tracker',
          icon: Activity,
          roles: ['admin', 'owner', 'super_admin', 'production'],
        },
        {
          id: 'equipment',
          labelLao: 'ເຄື່ອງຈັກ & ຊ່າງພິມ',
          labelEn: 'Printers & Equipment',
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
          icon: Boxes,
          roles: ['admin', 'owner', 'super_admin', 'sales', 'production'],
        },
        {
          id: 'inbound',
          labelLao: 'ນຳເຂົ້າສິນຄ້າ',
          labelEn: 'Inbound Procurement',
          icon: PackageCheck,
          roles: ['admin', 'owner', 'super_admin', 'production'],
        },
        {
          id: 'suppliers',
          labelLao: 'ຜູ້ສະໜອງ & ໃບສັ່ງຊື້ (PO)',
          labelEn: 'Suppliers & Purchase Orders',
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
          icon: Coins,
          roles: ['admin', 'owner', 'super_admin'],
        },
        {
          id: 'hr',
          labelLao: 'ພະນັກງານ (HR / Staff)',
          labelEn: 'Employee & HR',
          icon: Users,
          roles: ['admin', 'owner', 'super_admin'],
        },
        {
          id: 'settings',
          labelLao: 'ຕັ້ງຄ່າລະບົບ & ຮ້ານ',
          labelEn: 'Settings & Profile',
          icon: Settings,
          roles: ['admin', 'owner', 'super_admin'],
        },
      ],
    },
  ];

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

  const sidebarContent = (
    <aside className="h-full flex flex-col justify-between bg-gradient-to-b from-slate-950 via-primary-navy to-slate-950 text-white border-r border-slate-800/80 select-none shadow-2xl">
      {/* Brand Header */}
      <div>
        <div className="h-20 px-5 flex items-center justify-between border-b border-white/10">
          <div 
            className="flex items-center gap-3 cursor-pointer overflow-hidden" 
            onClick={() => {
              setActiveTab('dashboard');
              setSidebarOpen(false);
            }}
          >
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1 shadow-lg shadow-amber-500/20 border-2 border-[#D4AF37] shrink-0 overflow-hidden">
              <img src="/logo.png" alt="Som Sing Phim Logo" className="w-full h-full object-contain" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="font-black text-base tracking-tight text-white leading-tight font-sans truncate">
                  ສົມສິ່ງພິມ
                </h1>
                <p className="text-[10px] font-bold text-amber-400 truncate">SOM SING PHIM · ERP</p>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Item Groups */}
        <nav className="p-3.5 space-y-3 overflow-y-auto max-h-[calc(100vh-160px)]">
          {filteredNavGroups.map((group) => {
            const GroupIcon = group.icon;
            const active = isGroupActive(group);
            const isOpen = openGroups[group.id] !== false;

            if (group.isDirectLink) {
              const isDirectActive = activeTab === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => {
                    setActiveTab(group.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full px-3.5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-3 cursor-pointer
                    ${isDirectActive 
                      ? 'bg-accent-sky text-white shadow-lg shadow-accent-sky/30' 
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <GroupIcon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{currentLang === 'en' ? group.labelEn : group.labelLao}</span>}
                </button>
              );
            }

            return (
              <div key={group.id} className="space-y-1">
                {/* Group Accordion Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`
                    w-full px-3 py-2 rounded-xl text-left transition flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider
                    ${active ? 'text-sky-300' : 'text-slate-400 hover:text-slate-200'}
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <GroupIcon className={`w-3.5 h-3.5 ${active ? 'text-sky-400' : 'text-slate-400'}`} />
                    {!collapsed && <span>{currentLang === 'en' ? group.labelEn : group.labelLao}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                  )}
                </button>

                {/* Sub-items */}
                {isOpen && (
                  <div className="space-y-1 pl-2">
                    {group.items?.map((item) => {
                      const ItemIcon = item.icon;
                      const isSubActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setSidebarOpen(false);
                          }}
                          className={`
                            w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 text-left cursor-pointer
                            ${isSubActive 
                              ? 'bg-accent-sky text-white font-black shadow-md shadow-accent-sky/25' 
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                            }
                          `}
                        >
                          <ItemIcon className={`w-4 h-4 shrink-0 ${isSubActive ? 'text-white' : 'text-sky-400'}`} />
                          {!collapsed && (
                            <span className="truncate">{currentLang === 'en' ? item.labelEn : item.labelLao}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer User Profile Card */}
      <div className="p-3.5 border-t border-white/10 bg-black/20">
        <div className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
              {user?.username ? user.username.substring(0, 2).toUpperCase() : 'SP'}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-xs font-black text-white truncate">{user?.fullName || 'ສົມສິ່ງພິມ (Owner)'}</div>
                <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {user?.role ? user.role.toUpperCase() : 'SUPER ADMIN'}
                </div>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={() => useAuthStore.getState().logout()}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
              title={currentLang === 'en' ? 'Log Out' : 'ອອກຈາກລະບົບ'}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className={`hidden lg:block shrink-0 transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'}`}>
        <div className={`fixed top-0 left-0 h-screen z-40 transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'}`}>
          {sidebarContent}
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Slide-in Drawer */}
      <div className={`lg:hidden fixed top-0 left-0 h-screen w-72 z-50 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </div>
    </>
  );
}
