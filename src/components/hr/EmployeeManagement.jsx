import React, { useState, useMemo } from 'react';
import {
  Users, UserPlus, Pencil, Trash2, Phone, MapPin, Star,
  Clock, Calendar, CheckCircle2, XCircle, AlertCircle,
  Search, ChevronDown, X, Briefcase, Banknote, TrendingUp,
  Shield, Award, UserCheck, Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';

// ========== INITIAL DATA ==========
const INITIAL_EMPLOYEES = [
  {
    id: 'EMP-001',
    name: 'ສົມຈິດ ແກ້ວມະນີ',
    nameEn: 'Somchit Kaewmanee',
    role: 'press_operator',
    phone: '020-5551-0001',
    address: 'ບ້ານ ສາຍລົມ, ວຽງຈັນ',
    salary: 2500000,
    salaryType: 'monthly',
    startDate: '2024-01-15',
    status: 'active',
    attendance: { present: 22, absent: 1, late: 2 },
    skills: ['Digital Printing', 'CMYK Calibration', 'Mimaki Operation'],
    shift: 'morning',
    avatar: 'SC',
    rating: 4.8
  },
  {
    id: 'EMP-002',
    name: 'ນາງ ມາລີ ວົງສະຫວັນ',
    nameEn: 'Malee Vongsavanh',
    role: 'cutting_finishing',
    phone: '020-5551-0002',
    address: 'ບ້ານ ໂພນຕ້ອງ, ວຽງຈັນ',
    salary: 2200000,
    salaryType: 'monthly',
    startDate: '2024-03-10',
    status: 'active',
    attendance: { present: 23, absent: 0, late: 1 },
    skills: ['Guillotine Cutting', 'Lamination', 'Binding'],
    shift: 'morning',
    avatar: 'ML',
    rating: 4.9
  },
  {
    id: 'EMP-003',
    name: 'ຄຳສອນ ພົມມະວົງ',
    nameEn: 'Khamson Phommavong',
    role: 'design_prepress',
    phone: '020-5551-0003',
    address: 'ບ້ານ ດົງໂດກ, ວຽງຈັນ',
    salary: 3000000,
    salaryType: 'monthly',
    startDate: '2023-11-01',
    status: 'active',
    attendance: { present: 21, absent: 2, late: 0 },
    skills: ['Adobe Illustrator', 'Photoshop', 'Prepress QC', 'Artwork'],
    shift: 'morning',
    avatar: 'KS',
    rating: 4.7
  },
  {
    id: 'EMP-004',
    name: 'ບຸນທ່ຽນ ໄຊຍະວົງ',
    nameEn: 'Bountien Xaiyavong',
    role: 'delivery_logistics',
    phone: '020-5551-0004',
    address: 'ບ້ານ ສີວິໄລ, ວຽງຈັນ',
    salary: 2000000,
    salaryType: 'monthly',
    startDate: '2024-06-01',
    status: 'active',
    attendance: { present: 20, absent: 2, late: 3 },
    skills: ['Kerry Lao', 'BCEL Express', 'Route Planning'],
    shift: 'afternoon',
    avatar: 'BT',
    rating: 4.3
  },
  {
    id: 'EMP-005',
    name: 'ນາງ ບົວທອງ ລາດຊາວົງ',
    nameEn: 'Bouathong Ratsavong',
    role: 'customer_service',
    phone: '020-5551-0005',
    address: 'ບ້ານ ທ່ານົກ, ວຽງຈັນ',
    salary: 2300000,
    salaryType: 'monthly',
    startDate: '2024-02-20',
    status: 'active',
    attendance: { present: 24, absent: 0, late: 0 },
    skills: ['Order Intake', 'WhatsApp/LINE CRM', 'Customer Follow-up'],
    shift: 'morning',
    avatar: 'BT2',
    rating: 5.0
  },
];

const ROLES = [
  { id: 'press_operator',    labelLo: 'ຊ່າງພິມ (Press Operator)',            labelEn: 'Press Operator',        color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'cutting_finishing',  labelLo: 'ຊ່າງຕັດ & ສຳເລັດຮູບ (Cutting)',      labelEn: 'Cutting & Finishing',   color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'design_prepress',    labelLo: 'ນັກອອກແບບ / Pre-press',              labelEn: 'Designer / Pre-press',  color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'delivery_logistics', labelLo: 'ໄດເວີ / ຈັດສົ່ງ (Delivery)',          labelEn: 'Delivery / Logistics',  color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'customer_service',   labelLo: 'ພະນັກງານຕ້ອນຮັບ / CRM',              labelEn: 'Customer Service',      color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'manager',            labelLo: 'ຜູ້ຈັດການ (Manager)',                  labelEn: 'Manager',               color: 'bg-rose-100 text-rose-800 border-rose-200' },
];

const SHIFTS = [
  { id: 'morning',   labelLo: 'ກະເຊົ້າ (08:00–17:00)',  labelEn: 'Morning Shift (08:00–17:00)' },
  { id: 'afternoon', labelLo: 'ກະບ່າຍ (13:00–21:00)', labelEn: 'Afternoon Shift (13:00–21:00)' },
  { id: 'full',      labelLo: 'ເຕັມວັນ (08:00–19:00)', labelEn: 'Full Day (08:00–19:00)' },
];

const getRoleInfo = (roleId) => ROLES.find(r => r.id === roleId) || ROLES[0];
const getShiftInfo = (shiftId) => SHIFTS.find(s => s.id === shiftId) || SHIFTS[0];

const formatLAK = (n) => {
  if (!n && n !== 0) return '—';
  return new Intl.NumberFormat('lo-LA').format(n) + ' ກີບ';
};

// ========== EMPTY FORM ==========
const emptyForm = {
  name: '', nameEn: '', role: 'press_operator', phone: '', address: '',
  salary: '', salaryType: 'monthly', startDate: '', shift: 'morning',
  status: 'active', skills: '', avatar: ''
};

// ========== AVATAR ==========
function Avatar({ initials, size = 'md', colorClass }) {
  const sz = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-11 h-11 text-sm';
  const colors = [
    'bg-purple-600', 'bg-blue-600', 'bg-indigo-600', 'bg-emerald-600',
    'bg-amber-600', 'bg-rose-600', 'bg-cyan-600', 'bg-violet-600'
  ];
  const hash = initials ? initials.charCodeAt(0) % colors.length : 0;
  return (
    <div className={`${sz} ${colorClass || colors[hash]} rounded-2xl flex items-center justify-center text-white font-black shrink-0`}>
      {initials?.slice(0, 2)}
    </div>
  );
}

// ========== STAT CARD ==========
function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-bold">{label}</p>
        <p className="text-2xl font-black text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ========== MAIN COMPONENT ==========
export default function EmployeeManagement() {
  const { showToast, askConfirmation } = useApp();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'lo';

  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const T = (lo, en) => lang === 'lo' ? lo : en;

  const filtered = useMemo(() => {
    return employees.filter(e => {
      const q = search.toLowerCase();
      const matchSearch = !q || e.name.toLowerCase().includes(q) || e.nameEn.toLowerCase().includes(q) || e.phone.includes(q);
      const matchRole = filterRole === 'all' || e.role === filterRole;
      const matchStatus = filterStatus === 'all' || e.status === filterStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }, [employees, search, filterRole, filterStatus]);

  const stats = useMemo(() => {
    const active = employees.filter(e => e.status === 'active').length;
    const totalPayroll = employees.filter(e => e.status === 'active').reduce((s, e) => s + Number(e.salary || 0), 0);
    const totalPresent = employees.reduce((s, e) => s + (e.attendance?.present || 0), 0);
    const totalAbsent = employees.reduce((s, e) => s + (e.attendance?.absent || 0), 0);
    const avgRating = employees.length > 0
      ? (employees.reduce((s, e) => s + (e.rating || 0), 0) / employees.length).toFixed(1)
      : '—';
    return { active, totalPayroll, totalPresent, totalAbsent, avgRating };
  }, [employees]);

  const openAdd = () => {
    setForm({ ...emptyForm, avatar: '' });
    setIsEditing(false);
    setIsModalOpen(true);
    setSelectedEmp(null);
  };

  const openEdit = (emp) => {
    setForm({
      ...emp,
      skills: Array.isArray(emp.skills) ? emp.skills.join(', ') : emp.skills
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setForm(emptyForm); };

  const handleSave = () => {
    if (!form.name || !form.phone || !form.role) {
      showToast(T('ກະລຸນາຕື່ມຂໍ້ມູນທີ່ຈຳເປັນ!', 'Please fill in required fields!'), 'error');
      return;
    }
    const skillArr = form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const avatarInit = form.nameEn ? form.nameEn.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : form.name.slice(0, 2);

    if (isEditing) {
      setEmployees(prev => prev.map(e => e.id === form.id ? { ...form, skills: skillArr, avatar: avatarInit } : e));
      showToast(T('ອັບເດດຂໍ້ມູນພະນັກງານສຳເລັດ!', 'Employee updated successfully!'), 'success');
    } else {
      const newEmp = {
        ...form,
        id: `EMP-${String(Date.now()).slice(-3).padStart(3, '0')}`,
        skills: skillArr,
        avatar: avatarInit,
        salary: Number(form.salary) || 0,
        attendance: { present: 0, absent: 0, late: 0 },
        rating: 5.0
      };
      setEmployees(prev => [newEmp, ...prev]);
      showToast(T('ເພີ່ມພະນັກງານໃໝ່ສຳເລັດ!', 'New employee added successfully!'), 'success');
    }
    closeModal();
  };

  const handleDelete = (emp) => {
    askConfirmation(
      T(`ທ່ານຕ້ອງການລຶບພະນັກງານ "${emp.name}" ແທ້ ຫຼື ບໍ່?`, `Delete employee "${emp.nameEn}"?`),
      () => {
        setEmployees(prev => prev.filter(e => e.id !== emp.id));
        if (selectedEmp?.id === emp.id) setSelectedEmp(null);
        showToast(T('ລຶບຂໍ້ມູນພະນັກງານສຳເລັດ!', 'Employee deleted!'), 'success');
      }
    );
  };

  const toggleStatus = (emp) => {
    const next = emp.status === 'active' ? 'inactive' : 'active';
    setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, status: next } : e));
    if (selectedEmp?.id === emp.id) setSelectedEmp(prev => ({ ...prev, status: next }));
    showToast(
      next === 'active'
        ? T(`ເປີດໃຊ້ງານ ${emp.name} ແລ້ວ`, `${emp.nameEn} is now active`)
        : T(`ປິດການໃຊ້ງານ ${emp.name} ແລ້ວ`, `${emp.nameEn} is now inactive`),
      'success'
    );
  };

  if (selectedEmp) {
    const emp = employees.find(e => e.id === selectedEmp.id) || selectedEmp;
    const role = getRoleInfo(emp.role);
    const shift = getShiftInfo(emp.shift);
    const attendanceRate = emp.attendance
      ? Math.round((emp.attendance.present / Math.max(1, emp.attendance.present + emp.attendance.absent + emp.attendance.late)) * 100)
      : 0;

    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in font-sans">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSelectedEmp(null)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 cursor-pointer shadow-xs"
          >
            <ChevronDown className="w-4 h-4 rotate-90" />
            {T('ກັບຄືນ', 'Back')}
          </button>
          <div>
            <p className="text-xs text-slate-400 font-mono">{emp.id}</p>
            <h1 className="text-xl font-black text-slate-900">{T(emp.name, emp.nameEn)}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Profile Card */}
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col items-center text-center gap-3 pb-4 border-b">
                <Avatar initials={emp.avatar} size="lg" />
                <div>
                  <h2 className="font-black text-slate-900">{lang === 'lo' ? emp.name : emp.nameEn}</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{lang === 'lo' ? emp.nameEn : emp.name}</p>
                  <span className={`mt-2 inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase ${role.color}`}>
                    {lang === 'lo' ? role.labelLo : role.labelEn}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(emp.rating) ? 'fill-current' : 'text-slate-200'}`} />
                  ))}
                  <span className="text-xs font-black text-slate-700 ml-1">{emp.rating}</span>
                </div>
              </div>

              <div className="space-y-3 text-xs font-medium text-slate-700">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`tel:${emp.phone}`} className="hover:text-blue-600 hover:underline font-mono">{emp.phone}</a>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{emp.address}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{T('ເລີ່ມວັນທີ:', 'Start Date:')} <span className="font-mono font-bold">{emp.startDate}</span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{lang === 'lo' ? shift.labelLo : shift.labelEn}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Banknote className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-black text-slate-900">{formatLAK(emp.salary)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <p className="text-[10px] font-black text-slate-400 uppercase">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {(emp.skills || []).map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-slate-700">{skill}</span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => openEdit(emp)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black transition hover:bg-slate-700 active:scale-95 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" /> {T('ແກ້ໄຂ', 'Edit')}
                </button>
                <button
                  type="button"
                  onClick={() => toggleStatus(emp)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer border ${
                    emp.status === 'active'
                      ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {emp.status === 'active' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {emp.status === 'active' ? T('ປິດໃຊ້ງານ', 'Deactivate') : T('ເປີດໃຊ້ງານ', 'Activate')}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="lg:col-span-2 space-y-5">
            {/* Attendance Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b pb-3">
                <Calendar className="w-5 h-5 text-blue-500" />
                {T('ບັນທຶກການເຂົ້າວຽກ (ເດືອນນີ້)', 'Attendance Record (This Month)')}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: T('ມາວຽກ', 'Present'), value: emp.attendance?.present || 0, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                  { label: T('ຂາດວຽກ', 'Absent'), value: emp.attendance?.absent || 0, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
                  { label: T('ມາຊ້າ', 'Late'), value: emp.attendance?.late || 0, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                ].map((item, i) => (
                  <div key={i} className={`${item.bg} border rounded-2xl p-4 text-center`}>
                    <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>{T('ອັດຕາການມາວຽກ', 'Attendance Rate')}</span>
                  <span className="font-black text-slate-900">{attendanceRate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${attendanceRate >= 90 ? 'bg-emerald-500' : attendanceRate >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Payroll summary */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b pb-3">
                <Banknote className="w-5 h-5 text-emerald-500" />
                {T('ສະຫຼຸບເງິນເດືອນ', 'Payroll Summary')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {[
                  { label: T('ເງິນເດືອນພື້ນຖານ / ເດືອນ', 'Base Salary / Month'), value: formatLAK(emp.salary), highlight: true },
                  { label: T('ຄ່າລ່ວງເວລາ (ຄາດ)', 'Overtime (Estimated)'), value: formatLAK(Math.round(emp.salary * 0.1)) },
                  { label: T('ຄ່ານ້ຳ + ຄ່າໂດຍສານ', 'Allowances'), value: formatLAK(100000) },
                  { label: T('ລວມທັງໝົດ (ຄາດ)', 'Total Estimated'), value: formatLAK(emp.salary + Math.round(emp.salary * 0.1) + 100000), highlight: true },
                ].map((row, i) => (
                  <div key={i} className={`flex justify-between items-center p-3 rounded-xl border ${row.highlight ? 'bg-slate-50 border-slate-200' : 'border-transparent'}`}>
                    <span className="text-slate-500 font-medium">{row.label}</span>
                    <span className={`font-mono font-black ${row.highlight ? 'text-slate-900' : 'text-slate-700'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills & Role detail */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b pb-3">
                <Award className="w-5 h-5 text-purple-500" />
                {T('ທັກສະ & ໜ້າທີ່ຄວາມຮັບຜິດຊອບ', 'Skills & Responsibilities')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {(emp.skills || []).map((skill, i) => (
                  <span key={i} className="px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-xl text-xs font-bold text-purple-800">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {isModalOpen && (
          <EmployeeModal
            isEditing={isEditing} form={form} setForm={setForm}
            onSave={handleSave} onClose={closeModal} T={T}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
      {/* Hero Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-white/5 -translate-y-24 translate-x-20 pointer-events-none" />
        <div className="space-y-1">
          <p className="text-xs font-black text-white/50 uppercase tracking-widest">
            Som Sing Printing — HR Module
          </p>
          <h1 className="text-2xl font-black">{T('ລະບົບຈັດການພະນັກງານ', 'Employee Management System')}</h1>
          <p className="text-xs text-white/50">{T('ບັນທຶກ ແລະ ຈັດການຂໍ້ມູນພະນັກງານທັງໝົດ', 'Track staff, shifts, attendance & payroll')}</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-3 bg-white text-slate-900 rounded-2xl text-sm font-black hover:bg-slate-100 transition active:scale-95 cursor-pointer shadow-md shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          {T('ເພີ່ມພະນັກງານໃໝ່', 'Add New Employee')}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UserCheck} label={T('ພະນັກງານທີ່ໃຊ້ງານ', 'Active Staff')} value={stats.active} sub={`${employees.length} ${T('ທັງໝົດ', 'total')}`} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Banknote} label={T('ເງິນເດືອນລວມ / ເດືອນ', 'Monthly Payroll')} value={`${(stats.totalPayroll / 1000000).toFixed(1)}M`} sub="ກີບ LAK" color="bg-blue-50 text-blue-600" />
        <StatCard icon={TrendingUp} label={T('ມາວຽກໂດຍສະເລ່ຍ', 'Avg Attendance')} value={`${stats.totalPresent}`} sub={T(`ຂາດ ${stats.totalAbsent} ວັນ`, `${stats.totalAbsent} absences`)} color="bg-purple-50 text-purple-600" />
        <StatCard icon={Star} label={T('ຄະແນນສະເລ່ຍ', 'Avg Rating')} value={stats.avgRating} sub="/ 5.0" color="bg-amber-50 text-amber-600" />
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={T('ຄົ້ນຫາພະນັກງານ...', 'Search employees...')}
            className="flex-1 text-sm bg-transparent outline-none font-medium text-slate-800 placeholder:text-slate-400"
          />
          {search && <button type="button" onClick={() => setSearch('')}><X className="w-4 h-4 text-slate-400 hover:text-slate-700" /></button>}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer"
          >
            <option value="all">{T('ທຸກໜ້າທີ່', 'All Roles')}</option>
            {ROLES.map(r => <option key={r.id} value={r.id}>{lang === 'lo' ? r.labelLo : r.labelEn}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer"
          >
            <option value="all">{T('ທຸກສະຖານະ', 'All Status')}</option>
            <option value="active">{T('ໃຊ້ງານ', 'Active')}</option>
            <option value="inactive">{T('ປິດໃຊ້', 'Inactive')}</option>
          </select>
        </div>
      </div>

      {/* Employee Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-200 mx-auto" />
          <p className="font-black text-slate-400">{T('ບໍ່ພົບຂໍ້ມູນພະນັກງານ', 'No employees found')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(emp => {
            const role = getRoleInfo(emp.role);
            const shift = getShiftInfo(emp.shift);
            const rate = emp.attendance
              ? Math.round((emp.attendance.present / Math.max(1, emp.attendance.present + emp.attendance.absent)) * 100)
              : 0;

            return (
              <div
                key={emp.id}
                className={`bg-white border rounded-3xl p-5 shadow-xs space-y-4 transition hover:shadow-md hover:border-slate-300 ${emp.status === 'inactive' ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar initials={emp.avatar} />
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-900 text-sm leading-snug truncate">{lang === 'lo' ? emp.name : emp.nameEn}</h3>
                      <p className="text-[10px] text-slate-400 font-medium truncate">{lang === 'lo' ? emp.nameEn : emp.name}</p>
                      <span className={`mt-1 inline-flex px-1.5 py-0.5 rounded text-[9px] font-black border uppercase ${role.color}`}>
                        {lang === 'lo' ? role.labelLo.split(' (')[0] : role.labelEn}
                      </span>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${
                    emp.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {emp.status === 'active' ? T('ໃຊ້ງານ', 'Active') : T('ປິດ', 'Inactive')}
                  </span>
                </div>

                <div className="space-y-2 text-[11px] font-medium text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{emp.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{lang === 'lo' ? shift.labelLo : shift.labelEn}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Banknote className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-black text-slate-800">{formatLAK(emp.salary)}</span>
                  </div>
                </div>

                {/* Mini attendance bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>{T('ການເຂົ້າວຽກ', 'Attendance')}</span>
                    <span className={`${rate >= 90 ? 'text-emerald-600' : rate >= 75 ? 'text-amber-600' : 'text-red-600'} font-black`}>{rate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${rate >= 90 ? 'bg-emerald-500' : rate >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedEmp(emp)}
                    className="flex-1 py-2 text-xs font-black bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition active:scale-95 cursor-pointer"
                  >
                    {T('ເບິ່ງລາຍລະອຽດ', 'View Details')}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(emp)}
                    className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition active:scale-95 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(emp)}
                    className="px-3 py-2 text-xs font-bold bg-red-50 border border-red-100 text-red-600 rounded-xl hover:bg-red-100 transition active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <EmployeeModal
          isEditing={isEditing} form={form} setForm={setForm}
          onSave={handleSave} onClose={closeModal} T={T}
        />
      )}
    </div>
  );
}

// ========== MODAL ==========
function EmployeeModal({ isEditing, form, setForm, onSave, onClose, T }) {
  const F = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b bg-slate-900 text-white">
          <div>
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">
              {isEditing ? T('ແກ້ໄຂຂໍ້ມູນ', 'Edit Record') : T('ເພີ່ມໃໝ່', 'New Employee')}
            </p>
            <h2 className="text-lg font-black">{T('ລະບົບພະນັກງານ', 'Employee System')}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase">{T('ຊື່ ພາສາລາວ *', 'Name (Lao) *')}</label>
              <input
                value={form.name}
                onChange={e => F('name', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-slate-400 outline-none transition"
                placeholder="ສົມຈິດ ແກ້ວມະນີ"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase">{T('ຊື່ ພາສາອັງກິດ', 'Name (English)')}</label>
              <input
                value={form.nameEn}
                onChange={e => F('nameEn', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-slate-400 outline-none transition"
                placeholder="Somchit Kaewmanee"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase">{T('ໜ້າທີ່ / ຕຳແໜ່ງ *', 'Role *')}</label>
              <select value={form.role} onChange={e => F('role', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 cursor-pointer focus:bg-white outline-none">
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.labelEn}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase">{T('ກະເວລາ', 'Shift')}</label>
              <select value={form.shift} onChange={e => F('shift', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 cursor-pointer focus:bg-white outline-none">
                {SHIFTS.map(s => <option key={s.id} value={s.id}>{s.labelEn}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase">{T('ເບີໂທ *', 'Phone *')}</label>
              <input
                value={form.phone}
                onChange={e => F('phone', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-800 focus:bg-white focus:border-slate-400 outline-none transition"
                placeholder="020-XXXX-XXXX"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase">{T('ວັນທີເລີ່ມວຽກ', 'Start Date')}</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => F('startDate', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-800 focus:bg-white focus:border-slate-400 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase">{T('ທີ່ຢູ່', 'Address')}</label>
            <input
              value={form.address}
              onChange={e => F('address', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-slate-400 outline-none transition"
              placeholder="ບ້ານ ສາຍລົມ, ວຽງຈັນ"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase">{T('ເງິນເດືອນ (ກີບ)', 'Salary (LAK)')}</label>
              <input
                type="number"
                value={form.salary}
                onChange={e => F('salary', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-800 focus:bg-white focus:border-slate-400 outline-none transition"
                placeholder="2500000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase">{T('ສະຖານະ', 'Status')}</label>
              <select value={form.status} onChange={e => F('status', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 cursor-pointer focus:bg-white outline-none">
                <option value="active">{T('ໃຊ້ງານ', 'Active')}</option>
                <option value="inactive">{T('ປິດໃຊ້ງານ', 'Inactive')}</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase">{T('ທັກສະ (ຄັ່ນດ້ວຍຈຸດ)', 'Skills (comma separated)')}</label>
            <input
              value={form.skills}
              onChange={e => F('skills', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-slate-400 outline-none transition"
              placeholder="Digital Printing, CMYK, Mimaki"
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-4 border-t bg-slate-50">
          <button type="button" onClick={onClose} className="flex-1 py-3 border-2 border-slate-200 text-slate-700 rounded-2xl text-sm font-black hover:bg-slate-100 transition active:scale-95 cursor-pointer">
            {T('ຍົກເລີກ', 'Cancel')}
          </button>
          <button type="button" onClick={onSave} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-700 transition active:scale-95 cursor-pointer shadow-md">
            {isEditing ? T('ບັນທຶກການແກ້ໄຂ', 'Save Changes') : T('ເພີ່ມພະນັກງານ', 'Add Employee')}
          </button>
        </div>
      </div>
    </div>
  );
}
