import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Eye,
  EyeOff,
  Coins,
  Sparkles,
  LayoutDashboard,
  ShoppingCart,
  Cpu,
  Calculator,
  User,
  Globe,
  BookOpen,
  Printer,
  Activity,
  Boxes,
  PackageCheck,
  Truck,
  Key,
  Check,
  Sliders
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FormModalTemplate } from '../../../components/common/FormModalTemplate';

export interface EmployeeRoleConfig {
  id: string;
  labelLo: string;
  labelEn: string;
  color: string;
}

export interface EmployeeShiftConfig {
  id: string;
  labelLo: string;
  labelEn: string;
}

export interface EmployeeModalProps {
  isEditing: boolean;
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  onSave: () => void;
  onClose: () => void;
  T: (lo: string, en: string) => string;
  roles: EmployeeRoleConfig[];
  shifts: EmployeeShiftConfig[];
}

// Complete system pages matching Sidebar.tsx
export interface SystemPageDef {
  id: string;
  labelLo: string;
  labelEn: string;
  icon: any;
  descLo: string;
}

export interface SystemPageGroupDef {
  groupId: string;
  groupLabelLo: string;
  groupLabelEn: string;
  colorBadge: string;
  pages: SystemPageDef[];
}

export const ALL_SYSTEM_PAGE_GROUPS: SystemPageGroupDef[] = [
  {
    groupId: 'dashboard',
    groupLabelLo: 'ແຜງຄວບຄຸມຫຼັກ',
    groupLabelEn: 'Dashboard Overview',
    colorBadge: 'bg-blue-50 text-blue-700 border-blue-200',
    pages: [
      {
        id: 'dashboard',
        labelLo: 'ແຜງຄວບຄຸມ (Dashboard)',
        labelEn: 'Dashboard & Metrics',
        icon: LayoutDashboard,
        descLo: 'ສະຫຼຸບຍອດຂາຍ, ສະຖານະງານພິມ ແລະ ພາບລວມທຸລະກິດ',
      },
    ],
  },
  {
    groupId: 'sales_group',
    groupLabelLo: 'ງານຂາຍ & ລູກຄ້າ (Sales & CRM)',
    groupLabelEn: 'Sales & Customer Relations',
    colorBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pages: [
      {
        id: 'preflight',
        labelLo: '1. ກວດໄຟລ໌ & ປະເມີນຄ່າສີ',
        labelEn: '1. Preflight & Color Cost',
        icon: Cpu,
        descLo: 'ວິເຄາະ CMYK Coverage % ແລະຄຳນວນຕົ້ນທຶນນ້ຳມຶກ',
      },
      {
        id: 'quotation',
        labelLo: '2. ໃບສະເໜີລາຄາ',
        labelEn: '2. Quotations & Pricing',
        icon: Calculator,
        descLo: 'ສ້າງໃບສະເໜີລາຄາ, ປະເມີນລາຄາພິມດ່ວນ',
      },
      {
        id: 'orders',
        labelLo: '3. ອໍເດີ & ລາຍການສັ່ງພິມ',
        labelEn: '3. Customer Orders',
        icon: ShoppingCart,
        descLo: 'ຮັບອໍເດີ, ຢືນຢັນໄຟລ໌ ແລະເປີດສັ່ງຜະລິດ',
      },
      {
        id: 'crm',
        labelLo: '4. ຖານຂໍ້ມູນລູກຄ້າ',
        labelEn: '4. Customer CRM',
        icon: User,
        descLo: 'ປະຫວັດລູກຄ້າ, ຍອດສັ່ງຊື້ ແລະຂໍ້ມູນຕິດຕໍ່',
      },
      {
        id: 'catalog',
        labelLo: '5. ສິນຄ້າໜ້າເວັບ',
        labelEn: '5. Web Catalog',
        icon: Globe,
        descLo: 'ຈັດການສິນຄ້າ ແລະລາຄາຂາຍໜ້າເວັບ',
      },
      {
        id: 'materials',
        labelLo: '6. ຂໍ້ມູນວັດສະດຸ & FAQ',
        labelEn: '6. Materials & Guide',
        icon: BookOpen,
        descLo: 'ຂໍ້ມູນແນະນຳວັດສະດຸ ແລະຄຳຖາມທີ່ພົບບ່ອຍ',
      },
    ],
  },
  {
    groupId: 'production_group',
    groupLabelLo: 'ການຜະລິດ (Production Floor)',
    groupLabelEn: 'Production & Shop Floor',
    colorBadge: 'bg-purple-50 text-purple-700 border-purple-200',
    pages: [
      {
        id: 'tracker',
        labelLo: 'ຕິດຕາມງານພິມ (Shop Floor)',
        labelEn: 'Shop Floor Tracker',
        icon: Activity,
        descLo: 'ຄວບຄຸມສະຖານະງານພິມຈິງ, QC, ແລະຕັດແບ່ງ',
      },
      {
        id: 'equipment',
        labelLo: 'ເຄື່ອງຈັກ & ຊ່າງພິມ',
        labelEn: 'Printers & Equipment',
        icon: Printer,
        descLo: 'ບັນທຶກສະເປກເຄື່ອງພິມ, ຕົ້ນທຶນຕໍ່ແຜ່ນ ແລະຄ່າເສື່ອມ',
      },
    ],
  },
  {
    groupId: 'supply_chain_group',
    groupLabelLo: 'ຄັງສິນຄ້າ & ຈັດຊື້ (Stock & Supply)',
    groupLabelEn: 'Warehouse & Inventory',
    colorBadge: 'bg-amber-50 text-amber-800 border-amber-200',
    pages: [
      {
        id: 'inventory',
        labelLo: 'ຄັງສິນຄ້າ & ເສດເຈ້ຍ',
        labelEn: 'Warehouse Inventory',
        icon: Boxes,
        descLo: 'ສະຕັອກເຈ້ຍ, ມຶກ, ເສດເຈ້ຍ ແລະຕັດສະຕັອກ',
      },
      {
        id: 'inbound',
        labelLo: 'ນຳເຂົ້າສິນຄ້າ',
        labelEn: 'Inbound Procurement',
        icon: PackageCheck,
        descLo: 'ບັນທຶກຮັບສິນຄ້າ ແລະວັດສະດຸເຂົ້າສາງ',
      },
      {
        id: 'suppliers',
        labelLo: 'ຜູ້ສະໜອງ & ໃບສັ່ງຊື້ (PO)',
        labelEn: 'Suppliers & Purchase Orders',
        icon: Truck,
        descLo: 'ຈັດການຮ້ານຄ້າຄູ່ຄ້າ ແລະໃບສັ່ງຊື້ວັດສະດຸ',
      },
    ],
  },
  {
    groupId: 'finance_admin_group',
    groupLabelLo: 'ການເງິນ & ບໍລິຫານ (Finance & Admin)',
    groupLabelEn: 'Finance & Administration',
    colorBadge: 'bg-rose-50 text-rose-700 border-rose-200',
    pages: [
      {
        id: 'finance',
        labelLo: 'ການເງິນ, ບັນຊີ & P/L',
        labelEn: 'Finance & Ledger',
        icon: Coins,
        descLo: 'ລາຍຮັບ-ລາຍຈ່າຍ, ກຳໄລຂັ້ນຕົ້ນ ແລະໃບແຈ້ງໜີ້',
      },
      {
        id: 'hr',
        labelLo: 'ພະນັກງານ (HR / Staff)',
        labelEn: 'Employee & HR',
        icon: Users,
        descLo: 'ຈັດການຂໍ້ມູນພະນັກງານ, ຄ່າແຮງງານ ແລະສິດຜູ້ໃຊ້',
      },
      {
        id: 'settings',
        labelLo: 'ຕັ້ງຄ່າລະບົບ & ຮ້ານ',
        labelEn: 'Settings & Profile',
        icon: Sliders,
        descLo: 'ໂປຣໄຟລ໌ຮ້ານ, ຂໍ້ມູນການຕິດຕໍ່ ແລະລະບົບ',
      },
    ],
  },
];

const ALL_PAGE_IDS = ALL_SYSTEM_PAGE_GROUPS.flatMap(g => g.pages.map(p => p.id));

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isEditing,
  form,
  setForm,
  onSave,
  onClose,
  T,
  roles,
  shifts,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { i18n } = useTranslation();
  const lang = i18n.language || 'lo';

  const F = (field: string, val: any) => setForm((prev: any) => ({ ...prev, [field]: val }));

  // Helper to check if page is selected
  const hasPage = (pageId: string) => {
    const list = form.permissions || [];
    return list.includes('ALL') || list.includes('*') || list.includes(pageId);
  };

  // Toggle individual page
  const togglePage = (pageId: string) => {
    let current = [...(form.permissions || [])];
    if (current.includes('ALL') || current.includes('*')) {
      // Unpack 'ALL' to all pages except this one
      current = ALL_PAGE_IDS.filter(id => id !== pageId);
    } else if (current.includes(pageId)) {
      current = current.filter(id => id !== pageId);
    } else {
      current.push(pageId);
      if (ALL_PAGE_IDS.every(id => current.includes(id))) {
        current = ['ALL', ...ALL_PAGE_IDS];
      }
    }
    F('permissions', current);
  };

  // Toggle an entire group
  const toggleGroup = (groupPages: SystemPageDef[]) => {
    const groupIds = groupPages.map(p => p.id);
    const allInGroupSelected = groupIds.every(id => hasPage(id));
    let current = [...(form.permissions || [])];

    if (current.includes('ALL')) {
      current = [...ALL_PAGE_IDS];
    }

    if (allInGroupSelected) {
      current = current.filter(id => !groupIds.includes(id) && id !== 'ALL');
    } else {
      groupIds.forEach(id => {
        if (!current.includes(id)) current.push(id);
      });
      if (ALL_PAGE_IDS.every(id => current.includes(id))) {
        current = ['ALL', ...ALL_PAGE_IDS];
      }
    }
    F('permissions', current);
  };

  // Select all pages
  const selectAllPages = () => {
    F('permissions', ['ALL', ...ALL_PAGE_IDS]);
  };

  // Clear all pages
  const clearAllPages = () => {
    F('permissions', []);
  };

  // Quick Preset Role Templates
  const applyPreset = (presetName: string, roleTitle: string, pageIds: string[], sysRole: string) => {
    F('systemRole', sysRole);
    F('customRoleTitle', roleTitle);
    if (pageIds.includes('ALL')) {
      F('permissions', ['ALL', ...ALL_PAGE_IDS]);
    } else {
      F('permissions', pageIds);
    }
  };

  // Auto-link Employee Position with System Role when role changes
  const handleRoleChange = (newRole: string) => {
    F('role', newRole);
    if (newRole === 'ceo') {
      F('hasLoginAccount', true);
      F('systemRole', 'ceo');
      F('customRoleTitle', 'CEO / Owner (ປະທານເຈົ້າໜ້າທີ່ບໍລິຫານ)');
      F('permissions', ['ALL', ...ALL_PAGE_IDS]);
    } else if (newRole === 'manager') {
      F('systemRole', 'manager');
      F('customRoleTitle', 'General Manager (ຜູ້ຈັດການທົ່ວໄປ)');
      if (form.hasLoginAccount) F('permissions', ['dashboard', 'quotation', 'orders', 'crm', 'tracker', 'equipment', 'inventory', 'finance', 'hr']);
    } else if (newRole === 'design_prepress') {
      F('systemRole', 'prepress');
      F('customRoleTitle', 'Pre-press & Design (ກວດໄຟລ໌ & ອອກແບບ)');
      if (form.hasLoginAccount) F('permissions', ['dashboard', 'preflight', 'orders', 'catalog', 'materials']);
    } else if (newRole === 'customer_service') {
      F('systemRole', 'sales');
      F('customRoleTitle', 'Sales & Customer CRM (ຝ່າຍຂາຍ & ລູກຄ້າ)');
      if (form.hasLoginAccount) F('permissions', ['dashboard', 'preflight', 'quotation', 'orders', 'crm', 'catalog', 'materials']);
    } else if (newRole === 'press_operator' || newRole === 'cutting_finishing') {
      F('systemRole', 'production');
      F('customRoleTitle', 'Production Press Lead (ຊ່າງພິມ & ຜະລິດ)');
      if (form.hasLoginAccount) F('permissions', ['dashboard', 'tracker', 'equipment', 'inventory']);
    }
  };

  const currentRole = roles.find(r => r.id === form.role) || roles[0];
  const selectedPagesCount = (form.permissions || []).includes('ALL') || (form.permissions || []).includes('*')
    ? ALL_PAGE_IDS.length
    : ALL_PAGE_IDS.filter(id => (form.permissions || []).includes(id)).length;

  return (
    <FormModalTemplate
      isOpen={true}
      onClose={onClose}
      icon={<Users className="w-6 h-6 text-white" />}
      title={isEditing ? T('ແກ້ໄຂຂໍ້ມູນພະນັກງານ', 'Edit Employee Record') : T('ເພີ່ມພະນັກງານໃໝ່', 'New Employee')}
      subtitle={T('ລະບົບຄຸ້ມຄອງພະນັກງານ, ເງິນເດືອນ, Piece-Rate & ສິດທິເຂົ້າເຖິງແຕ່ລະໜ້າເວັບ', 'Staff Directory, Compensation, Piece-Rate & Granular Page RBAC')}
      badgeText={form.role === 'ceo' ? 'CEO / OWNER' : currentRole?.labelEn?.toUpperCase() || 'STAFF'}
      maxWidthClass="max-w-6xl"
      footerActions={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs">
            {form.hasLoginAccount ? (
              <span className="flex items-center gap-2 text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  ບັນຊີເຂົ້າລະບົບ: <strong className="font-mono text-emerald-950">{form.username || '—'}</strong> 
                  <span className="text-emerald-700 font-normal"> · {form.customRoleTitle || form.systemRole || 'Custom'}</span>
                  <span className="ml-1 text-[11px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-md font-mono font-black">
                    {selectedPagesCount} / {ALL_PAGE_IDS.length} ໜ້າ
                  </span>
                </span>
              </span>
            ) : (
              <span className="text-slate-400 font-medium bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                {T('ບໍ່ໄດ້ເປີດບັນຊີເຂົ້າລະບົບ (ພະນັກງານທົ່ວໄປ)', 'No login account enabled for this employee')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {T('ຍົກເລີກ', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={onSave}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
            >
              {isEditing ? T('ບັນທຶກການແກ້ໄຂ', 'Save Changes') : T('ເພີ່ມພະນັກງານ', 'Add Employee')}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 p-1">
        {/* Section 1: Basic Information & Personal Details */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                {T('1. ຂໍ້ມູນທົ່ວໄປ & ຕຳແໜ່ງ (General Information)', '1. Personal & Position Profile')}
              </h4>
            </div>
            <span className="text-[11px] font-bold text-slate-400 font-mono">STEP 1</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 uppercase">{T('ຊື່ ພາສາລາວ *', 'Name (Lao) *')}</label>
              <input
                value={form.name}
                onChange={e => F('name', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                placeholder="ສົມຈິດ ແກ້ວມະນີ"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 uppercase">{T('ຊື່ ພາສາອັງກິດ', 'Name (English)')}</label>
              <input
                value={form.nameEn}
                onChange={e => {
                  const val = e.target.value;
                  F('nameEn', val);
                  if (form.hasLoginAccount && (!form.username || form.username === 'staff.user')) {
                    const suggested = val.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
                    if (suggested) F('username', suggested);
                  }
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                placeholder="Somchit Kaewmanee"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 uppercase">{T('ໜ້າທີ່ / ຕຳແໜ່ງ *', 'Role *')}</label>
              <select
                value={form.role}
                onChange={e => handleRoleChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 cursor-pointer focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>
                    {lang === 'lo' ? r.labelLo : r.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 uppercase">{T('ກະເວລາ', 'Shift')}</label>
              <select
                value={form.shift}
                onChange={e => F('shift', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 cursor-pointer focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
              >
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>
                    {lang === 'lo' ? s.labelLo : s.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 uppercase">{T('ເບີໂທ *', 'Phone *')}</label>
              <input
                value={form.phone}
                onChange={e => F('phone', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-800 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                placeholder="020-XXXX-XXXX"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 uppercase">{T('ວັນທີເລີ່ມວຽກ', 'Start Date')}</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => F('startDate', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-800 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 uppercase">{T('ເງິນເດືອນ (ກີບ)', 'Salary (LAK)')}</label>
              <input
                type="number"
                value={form.salary}
                onChange={e => F('salary', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-800 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                placeholder="2500000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 uppercase">{T('ສະຖານະ', 'Status')}</label>
              <select
                value={form.status}
                onChange={e => F('status', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 cursor-pointer focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
              >
                <option value="active">{T('ໃຊ້ງານ (Active)', 'Active')}</option>
                <option value="inactive">{T('ປິດໃຊ້ງານ (Inactive)', 'Inactive')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 uppercase">{T('ທີ່ຢູ່', 'Address')}</label>
              <input
                value={form.address}
                onChange={e => F('address', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                placeholder="ບ້ານ ສາຍລົມ, ວຽງຈັນ"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 uppercase">{T('ທັກສະ (ຄັ່ນດ້ວຍຈຸດ)', 'Skills (comma separated)')}</label>
              <input
                value={form.skills}
                onChange={e => F('skills', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                placeholder="Digital Printing, CMYK, Mimaki, Konica"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Piece-Rate & Sales Incentive Configuration */}
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
              {T('2. ຕັ້ງຄ່າຄ່າແຮງງານຕາມຜົນງານ (Piece-Rate & Sales Commission)', '2. Performance-Based Incentive Rates')}
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1 bg-white p-3 rounded-xl border border-amber-200/80">
              <label className="text-[11px] font-bold text-slate-700 block">
                {T('ຄ່າແຮງງານຕໍ່ 1 Impression (LAK)', 'Piece-Rate / Impression (LAK)')}
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={form.pieceRatePerImpression !== undefined ? form.pieceRatePerImpression : 5}
                onChange={e => F('pieceRatePerImpression', Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-amber-300 rounded-xl text-sm font-black text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="5"
              />
              <span className="text-[10px] text-slate-500 block font-medium">
                = {(Number(form.pieceRatePerImpression || 5) * 1000).toLocaleString()} LAK / 1,000 ແຜ່ນ
              </span>
            </div>

            <div className="space-y-1 bg-white p-3 rounded-xl border border-amber-200/80">
              <label className="text-[11px] font-bold text-slate-700 block">
                {T('ຄອມມິດຊັ່ນຍອດຂາຍ (%)', 'Sales Commission (%)')}
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={form.salesCommissionRate !== undefined ? form.salesCommissionRate : 0}
                onChange={e => F('salesCommissionRate', Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-amber-300 rounded-xl text-sm font-black text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="0"
              />
              <span className="text-[10px] text-slate-500 block font-medium">
                {T('ສຳລັບພະນັກງານຂາຍ & CRM', 'For Sales & Customer Service')}
              </span>
            </div>

            {/* Live Calculation Preview Simulation */}
            <div className="bg-white p-3 rounded-xl border border-amber-200/80 flex flex-col justify-between">
              <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{T('ຕົວຢ່າງການຄຳນວນ: ງານພິມ 5,000 Impressions', 'Calculation: 5,000 Impressions Job')}</span>
              </span>
              <div className="pt-2 flex items-baseline justify-between">
                <span className="text-[11px] text-slate-400">ຄ່າແຮງງານພິເສດ:</span>
                <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
                  +{(Number(form.pieceRatePerImpression !== undefined ? form.pieceRatePerImpression : 5) * 5000).toLocaleString()} LAK
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: System Login & Granular Page Permissions (LIGHT THEME & DYNAMIC ACCESS) */}
        <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
          {/* Header with Toggle Switch (ด็อกกี้) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200 shadow-sm shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <span>{T('3. ຕັ້ງຄ່າບັນຊີເຂົ້າລະບົບ & ສິດທິເຂົ້າເຖິງແຕ່ລະໜ້າ', '3. System Login Account & Granular Page Access')}</span>
                  {form.hasLoginAccount && (
                    <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold border border-sky-200">
                      ACTIVE
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {T('ສ້າງບັນຊີເຂົ້າສູ່ລະບົບ ແລະ ກຳນົດສິດທິການເຂົ້າເຖິງແຕ່ລະໜ້າເວັບໄດ້ຕາມໃຈມັກ (Dynamic Granular Access)', 'Create login credentials and select custom accessible pages dynamically')}
                </p>
              </div>
            </div>

            {/* Toggle Switch (ด็อกกี้) */}
            <div className="flex items-center gap-3 bg-slate-50 p-2 px-3 rounded-2xl border border-slate-200 self-start sm:self-auto">
              <div className="text-right">
                <span className="text-xs font-black block text-slate-800">
                  {form.hasLoginAccount ? T('ເປີດໃຊ້ງານບັນຊີ', 'Account Enabled') : T('ປິດໃຊ້ງານ', 'Disabled')}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  {form.hasLoginAccount ? T('ສາມາດເຂົ້າສູ່ລະບົບໄດ້', 'Can sign in') : T('ບໍ່ມີສິດເຂົ້າລະບົບ', 'No login rights')}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(form.hasLoginAccount)}
                onClick={() => {
                  const nextVal = !form.hasLoginAccount;
                  F('hasLoginAccount', nextVal);
                  if (nextVal && !form.username) {
                    const raw = form.nameEn || form.name || 'user';
                    const suggested = raw.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
                    F('username', suggested || 'staff.user');
                    if (!form.password) F('password', '123456');
                    if (!form.permissions || form.permissions.length === 0) {
                      F('permissions', ['dashboard', 'orders', 'tracker']);
                    }
                  }
                }}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                  form.hasLoginAccount ? 'bg-sky-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                    form.hasLoginAccount ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Login Details & Dynamic Access when Toggle is ON */}
          {form.hasLoginAccount ? (
            <div className="space-y-5 animate-fade-in">
              {/* Account Credentials Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/90">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                    <span>{T('ຊື່ເຂົ້າສູ່ລະບົບ (Username) *', 'Username *')}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Unique Login</span>
                  </label>
                  <input
                    value={form.username || ''}
                    onChange={e => F('username', e.target.value.toLowerCase().trim())}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="somchit.k"
                    required={form.hasLoginAccount}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                    <span>{isEditing ? T('ປ່ຽນລະຫັດຜ່ານ (Password)', 'New Password') : T('ລະຫັດຜ່ານ (Password) *', 'Password *')}</span>
                    {isEditing && <span className="text-[10px] text-slate-400 font-medium">ປະວ່າງຖ້າບໍ່ປ່ຽນ</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password || ''}
                      onChange={e => F('password', e.target.value)}
                      className="w-full px-3 py-2.5 pr-10 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      placeholder={isEditing ? '•••••••• (ບໍ່ປ່ຽນແປງ)' : '123456'}
                      required={!isEditing && form.hasLoginAccount}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                    <span>{T('ຊື່ສິດທິ / ຕຳແໜ່ງໃນລະບົບ (Role Title)', 'System Role Title')}</span>
                    <span className="text-[10px] text-sky-600 font-bold">ກຳນົດເອງໄດ້ (Dynamic)</span>
                  </label>
                  <input
                    value={form.customRoleTitle || form.systemRole || ''}
                    onChange={e => {
                      F('customRoleTitle', e.target.value);
                      F('systemRole', e.target.value);
                    }}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="e.g. ຫົວໜ້າຊ່າງພິມ & ກວດສີ, Supervisor, Admin"
                  />
                </div>
              </div>

              {/* Role Preset Template Chips */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                  {T('ແມ່ແບບສິດທິສຳເລັດຮູບ (Quick Preset Role Templates):', 'Quick Preset Templates:')}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('ceo', 'CEO / Owner (ປະທານເຈົ້າໜ້າທີ່ບໍລິຫານ)', ['ALL'], 'ceo')}
                    className="px-3 py-1.5 rounded-xl border text-xs font-black bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>CEO / Owner (ທຸກໜ້າ 100%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('admin', 'Super Admin (ຜູ້ດູແລລະບົບຫຼັກ)', ['ALL'], 'admin')}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 transition active:scale-95 cursor-pointer"
                  >
                    Super Admin
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('manager', 'General Manager (ຜູ້ຈັດການທົ່ວໄປ)', ['dashboard', 'quotation', 'orders', 'crm', 'tracker', 'equipment', 'inventory', 'finance', 'hr'], 'manager')}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 transition active:scale-95 cursor-pointer"
                  >
                    Manager (ຜູ້ຈັດການ)
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('sales', 'Sales & Customer CRM (ຝ່າຍຂາຍ)', ['dashboard', 'preflight', 'quotation', 'orders', 'crm', 'catalog', 'materials'], 'sales')}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 transition active:scale-95 cursor-pointer"
                  >
                    Sales & CRM (ງານຂາຍ)
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('production', 'Production Lead (ຊ່າງພິມ & ຜະລິດ)', ['dashboard', 'tracker', 'equipment', 'inventory'], 'production')}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100 transition active:scale-95 cursor-pointer"
                  >
                    Production (ການຜະລິດ)
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('prepress', 'Pre-press Specialist (ກວດໄຟລ໌)', ['dashboard', 'preflight', 'orders', 'catalog', 'materials'], 'prepress')}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100 transition active:scale-95 cursor-pointer"
                  >
                    Pre-press (ກວດໄຟລ໌)
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('finance', 'Finance & Accountant (ບັນຊີ & ການເງິນ)', ['dashboard', 'finance', 'quotation', 'orders'], 'finance')}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 transition active:scale-95 cursor-pointer"
                  >
                    Finance (ການເງິນ)
                  </button>
                </div>
              </div>

              {/* Granular Page Selection Matrix */}
              <div className="pt-2 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100/80 p-3 px-4 rounded-xl border border-slate-200">
                  <div>
                    <h5 className="text-xs font-black uppercase text-slate-800">
                      {T('ເລືອກໜ້າເວັບທີ່ອະນຸຍາດໃຫ້ເຂົ້າເຖິງ (Select Accessible System Pages):', 'Select Accessible Pages:')}
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      {T('ຄລິກຕິກໃສ່ແຕ່ລະໜ້າ ຫຼື ເລືອກທັງໝົດໃນກຸ່ມໄດ້ຕາມຕ້ອງການ', 'Click individual pages to grant or revoke access freely')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-sky-100 text-sky-900 border border-sky-200 px-3 py-1 rounded-xl">
                      {T('ເລືອກແລ້ວ:', 'Granted:')} <strong>{selectedPagesCount}</strong> / {ALL_PAGE_IDS.length} {T('ໜ້າ', 'pages')}
                    </span>
                    <button
                      type="button"
                      onClick={selectAllPages}
                      className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition active:scale-95 cursor-pointer"
                    >
                      {T('ເລືອກທຸກໜ້າ', 'Select All')}
                    </button>
                    <button
                      type="button"
                      onClick={clearAllPages}
                      className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition active:scale-95 cursor-pointer"
                    >
                      {T('ລຶ້າງທັງໝົດ', 'Clear All')}
                    </button>
                  </div>
                </div>

                {/* Page Groups Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ALL_SYSTEM_PAGE_GROUPS.map(group => {
                    const groupSelectedCount = group.pages.filter(p => hasPage(p.id)).length;
                    const isAllGroupSelected = groupSelectedCount === group.pages.length;

                    return (
                      <div
                        key={group.groupId}
                        className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5 shadow-sm"
                      >
                        {/* Group Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${group.colorBadge}`}>
                              {lang === 'lo' ? group.groupLabelLo : group.groupLabelEn}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 font-bold">
                              ({groupSelectedCount}/{group.pages.length})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleGroup(group.pages)}
                            className="text-[11px] font-bold text-sky-600 hover:text-sky-800 transition cursor-pointer"
                          >
                            {isAllGroupSelected ? T('ຍົກເລີກກຸ່ມນີ້', 'Deselect Group') : T('ເລືອກກຸ່ມນີ້', 'Select Group')}
                          </button>
                        </div>

                        {/* Group Page Items */}
                        <div className="space-y-1.5">
                          {group.pages.map(page => {
                            const isGranted = hasPage(page.id);
                            const PageIcon = page.icon;

                            return (
                              <div
                                key={page.id}
                                onClick={() => togglePage(page.id)}
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                  isGranted
                                    ? 'bg-sky-50/90 border-sky-300 text-sky-950 shadow-xs ring-1 ring-sky-200'
                                    : 'bg-white border-slate-200/90 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                <div className="pt-0.5">
                                  {isGranted ? (
                                    <div className="w-4 h-4 rounded-md bg-sky-600 text-white flex items-center justify-center">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                  ) : (
                                    <div className="w-4 h-4 rounded-md border-2 border-slate-300 bg-white" />
                                  )}
                                </div>
                                <div className="w-5 h-5 rounded-md flex items-center justify-center text-slate-500 shrink-0 pt-0.5">
                                  <PageIcon className={`w-4 h-4 ${isGranted ? 'text-sky-600' : 'text-slate-400'}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className={`text-xs font-bold leading-tight ${isGranted ? 'text-slate-950 font-black' : 'text-slate-700'}`}>
                                      {lang === 'lo' ? page.labelLo : page.labelEn}
                                    </span>
                                    <span className="text-[9px] font-mono text-slate-400 uppercase">
                                      {page.id}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-1">
                                    {page.descLo}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl space-y-1">
              <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500">
                {T('ບັນຊີເຂົ້າສູ່ລະບົບຍັງບໍ່ໄດ້ເປີດໃຊ້ງານ', 'System login account is disabled')}
              </p>
              <p className="text-[11px] text-slate-400">
                {T('ກົດສະວິດສ໌ດັອກກີ້ (Toggle) ດ້ານເທິງຂວາເພື່ອສ້າງຊື່ຜູ້ໃຊ້ ແລະ ກຳນົດສິດທິການເຂົ້າເຖິງແຕ່ລະໜ້າ', 'Toggle the switch above to enable login credentials and configure accessible pages')}
              </p>
            </div>
          )}
        </div>
      </div>
    </FormModalTemplate>
  );
};
