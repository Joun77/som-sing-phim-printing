import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, UserPlus, Key, Trash2, Edit, CheckCircle2, 
  XCircle, Clock, User, Phone, Mail, RefreshCw, Eye, EyeOff 
} from 'lucide-react';
import { useApp } from '@store/AppContext';
import { apiFetch } from '../../../api/client';

export interface AdminUserItem {
  id: string;
  employeeId?: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'manager' | 'sales' | 'production' | 'finance' | 'prepress' | string;
  permissions?: string[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

const ROLE_CONFIGS: Record<string, { labelLo: string; labelEn: string; color: string; descLo: string }> = {
  admin: {
    labelLo: 'ເຈົ້າຂອງຮ້ານ (Super Admin)',
    labelEn: 'Super Admin',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    descLo: 'ສິດຄວບຄຸມລະບົບທັງໝົດ, ການເງິນ, ລາຍງານ, ແລະຈັດການຜູ້ໃຊ້'
  },
  manager: {
    labelLo: 'ຜູ້ຈັດການ (Manager)',
    labelEn: 'General Manager',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    descLo: 'ຈັດການອໍເດີ, ສາງສິນຄ້າ, ພະນັກງານ, ແລະອະນຸມັດສ່ວນຫຼຸດ'
  },
  sales: {
    labelLo: 'ຝ່າຍຂາຍ (Sales)',
    labelEn: 'Sales Representative',
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    descLo: 'ເປີດໃບສະເໜີລາຄາ, ຮັບລູກຄ້າ, ເປີດອໍເດີ, ແລະຕິດຕາມການຈັດສົ່ງ'
  },
  production: {
    labelLo: 'ຊ່າງພິມ (Production)',
    labelEn: 'Production Lead',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    descLo: 'ດູແລຄິວພິມ Shop Floor, ບັນທຶກສະຖານະຈັກ, ແລະຕັດສະຕັອກ'
  },
  finance: {
    labelLo: 'ບັນຊີ & ການເງິນ (Finance)',
    labelEn: 'Finance & Accountant',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    descLo: 'ກວດສອບສະລິບ, ບັນທຶກລາຍຮັບ-ລາຍຈ່າຍ, ແລະລາຍງານກຳໄລ'
  },
  prepress: {
    labelLo: 'ກວດໄຟລ໌ (Pre-press)',
    labelEn: 'Pre-press Specialist',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    descLo: 'ກວດສອບໄຟລ໌ PDF/AI, ວິເຄາະ CMYK, ແລະອະນຸມັດ Proof'
  }
};

export const StaffUserManagementTab: React.FC = () => {
  const { showToast, askConfirmation, employees = [] } = useApp();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('sales');
  const [employeeId, setEmployeeId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/api/v1/admin/users');
      if (res && res.data) {
        setUsers(res.data);
      }
    } catch (err: any) {
      console.warn('Failed to fetch admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setFullName('');
    setEmail('');
    setPhone('');
    setRole('sales');
    setEmployeeId('');
    setIsActive(true);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (u: AdminUserItem) => {
    setEditingUser(u);
    setUsername(u.username);
    setPassword(''); // leave blank unless resetting
    setFullName(u.fullName);
    setEmail(u.email || '');
    setPhone(u.phone || '');
    setRole(u.role);
    setEmployeeId(u.employeeId || '');
    setIsActive(u.isActive);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleEmployeeSelect = (empId: string) => {
    setEmployeeId(empId);
    const selected = employees.find((e: any) => e.id === empId);
    if (selected) {
      if (!fullName) setFullName(selected.name || selected.nameLo || '');
      if (!phone) setPhone(selected.phone || '');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      showToast('ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້ (Username is required)', 'warning');
      return;
    }
    if (!editingUser && !password) {
      showToast('ກະລຸນາປ້ອນລະຫັດຜ່ານ (Password is required)', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        username: username.trim(),
        fullName: fullName.trim() || username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        employeeId: employeeId || undefined,
        isActive
      };
      if (password) {
        payload.password = password;
      }

      if (editingUser) {
        await apiFetch(`/api/v1/admin/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        showToast('ອັບເດດບັນຊີຜູ້ໃຊ້ສຳເລັດ!', 'success');
      } else {
        await apiFetch('/api/v1/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        showToast('ສ້າງບັນຊີຜູ້ໃຊ້ພະນັກງານສຳເລັດ!', 'success');
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'ບັນທຶກບໍ່ສຳເລັດ', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (u: AdminUserItem) => {
    if (u.username === 'admin') {
      showToast('ບໍ່ສາມາດລຶບບັນຊີ Super Admin ຫຼັກໄດ້', 'warning');
      return;
    }

    askConfirmation({
      title: 'ຢືນຢັນການລຶບບັນຊີຜູ້ໃຊ້',
      message: `ທ່ານຕ້ອງການລຶບບັນຊີ "${u.username}" (${u.fullName}) ແທ້ບໍ່? ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກໄດ້`,
      confirmLabel: 'ລຶບບັນຊີ',
      cancelLabel: 'ຍົກເລີກ',
      isDanger: true,
      onConfirm: async () => {
        try {
          await apiFetch(`/api/v1/admin/users/${u.id}`, { method: 'DELETE' });
          showToast('ລຶບບັນຊີສຳເລັດ', 'success');
          fetchUsers();
        } catch (err: any) {
          showToast(err.message || 'ລຶບບໍ່ສຳເລັດ', 'error');
        }
      }
    });
  };

  const handleToggleActive = async (u: AdminUserItem) => {
    if (u.username === 'admin') return;
    try {
      await apiFetch(`/api/v1/admin/users/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...u, isActive: !u.isActive })
      });
      showToast(!u.isActive ? 'ເປີດການໃຊ້ງານສຳເລັດ' : 'ປິດການໃຊ້ງານສຳເລັດ', 'info');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'ອັບເດດບໍ່ສຳເລັດ', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              ຈັດການບັນຊີຜູ້ໃຊ້ & ສิทธิ์ເຂົ້າລະບົບ (Staff Accounts & RBAC)
            </h2>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              ສ້າງບັນຊີປະຈຳຕົວພະນັກງານ, ກຳນົດບົດບາດ (Role), ລະຫັດຜ່ານ, ແລະຈັດການສິດທິການເຂົ້າເຖິງລະບົບ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition cursor-pointer"
            title="ໂຫຼດຂໍ້ມູນໃໝ່"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ ສ້າງບັນຊີຜູ້ໃຊ້ພະນັກງານ</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">ຜູ້ໃຊ້ງານ (User & Name)</th>
                <th className="py-4 px-6">ບົດບາດ & ສິດ (Role / RBAC)</th>
                <th className="py-4 px-6">ພະນັກງານທີ່ເຊື່ອມໂຍງ</th>
                <th className="py-4 px-6">ສະຖານະ</th>
                <th className="py-4 px-6">ເຂົ້າສູ່ລະບົບຫຼ້າສຸດ</th>
                <th className="py-4 px-6 text-center">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                    {loading ? 'ກຳລັງໂຫຼດຂໍ້ມູນ...' : 'ຍັງບໍ່ມີບັນຊີຜູ້ໃຊ້ໃນລະບົບ'}
                  </td>
                </tr>
              ) : (
                users.map(u => {
                  const roleConfig = ROLE_CONFIGS[u.role] || {
                    labelLo: u.role,
                    labelEn: u.role,
                    color: 'bg-slate-100 text-slate-700 border-slate-200',
                    descLo: ''
                  };
                  const linkedEmp = employees.find((e: any) => e.id === u.employeeId);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      {/* User details */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {u.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{u.fullName}</span>
                              {u.username === 'admin' && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 text-[9px] font-black border border-rose-200">
                                  MASTER
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 font-bold">
                              @{u.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role badge */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black border ${roleConfig.color}`}>
                          {roleConfig.labelLo}
                        </span>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1 max-w-[200px] truncate">
                          {roleConfig.descLo}
                        </p>
                      </td>

                      {/* Linked employee */}
                      <td className="py-4 px-6">
                        {linkedEmp ? (
                          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{linkedEmp.name || linkedEmp.nameLo}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic font-medium">— ບໍ່ໄດ້ເຊື່ອມ —</span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={u.username === 'admin'}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>ເປີດໃຊ້ງານ</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>ປິດໃຊ້ງານ</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Last Login */}
                      <td className="py-4 px-6 text-slate-500 font-medium">
                        {u.lastLoginAt ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(u.lastLoginAt).toLocaleString('lo-LA', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">— ຍັງບໍ່ເຄີຍເຂົ້າ —</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition cursor-pointer"
                            title="ແກ້ໄຂ / ປ່ຽນລະຫັດ"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {u.username !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-2 hover:bg-rose-50 text-rose-600 rounded-xl transition cursor-pointer"
                              title="ລຶບຜູ້ໃຊ້"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5 my-auto animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  {editingUser ? <Edit className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingUser ? 'ແກ້ໄຂບັນຊີຜູ້ໃຊ້ (Edit Staff User)' : 'ສ້າງບັນຊີຜູ້ໃຊ້ໃໝ່ (New Staff User)'}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    ກຳນົດສິດເຂົ້າລະບົບ ແລະ ລະຫັດຜ່ານປະຈຳຕົວພະນັກງານ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              {/* Linked Employee Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  ເຊື່ອມໂຍງກັບພະນັກງານ (Link to Employee)
                </label>
                <select
                  value={employeeId}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-600"
                >
                  <option value="">-- ເລືອກພະນັກງານ (ທາງເລືອກ) --</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name || emp.nameLo} ({emp.role}) - {emp.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    ຊື່ຜູ້ໃຊ້ງານ (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingUser?.username === 'admin'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                    placeholder="e.g. somchai_sales"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-600 disabled:opacity-60"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    ບົດບາດ & ສິດ (Role) *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={editingUser?.username === 'admin'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-600 disabled:opacity-60"
                  >
                    {Object.entries(ROLE_CONFIGS).map(([k, v]) => (
                      <option key={k} value={k}>{v.labelLo}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  {editingUser ? 'ປ່ຽນລະຫັດຜ່ານໃໝ່ (Leave blank to keep current)' : 'ລະຫັດຜ່ານ (Password) *'}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingUser}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUser ? '•••••••• (ປະຫວ່າງໄວ້ຫາກບໍ່ຕ້ອງການປ່ຽນ)' : 'ປ້ອນລະຫັດຜ່ານ...'}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  ຊື່ເຕັມ / ຕຳແໜ່ງ (Full Name) *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. ສົມໄຊ ວົງສາ (ຫົວໜ້າຝ່າຍຂາຍ)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    ອີເມວ (Email)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@somsingphim.la"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    ເບີໂທ (Phone)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="020 55XXXXXX"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="user-active-toggle"
                  checked={isActive}
                  disabled={editingUser?.username === 'admin'}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <label htmlFor="user-active-toggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                  ເປີດໃຊ້ງານບັນຊີນີ້ (Account is active)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'ກຳລັງບັນທຶກ...' : (editingUser ? 'ບັນທຶກການແກ້ໄຂ' : 'ສ້າງບັນຊີຜູ້ໃຊ້')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
