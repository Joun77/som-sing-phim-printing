import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  User,
  Printer,
  FileText,
  AlertCircle,
  Database,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Activity,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useApp } from '../../store/AppContext';
import type {
  ProductionStageAssignment,
  ReadyQueueItem,
  AssignableStaff,
} from '../../types/production';
import {
  fetchDailyPlan,
  fetchReadyOrdersQueue,
  fetchAssignableStaff,
  updateAssignmentProgress,
  deleteAssignment,
  ApiError,
} from './services/dailyPlanApi';
import { AssignTaskModal } from './components/AssignTaskModal';

const STAGE_LABELS: Record<string, { lo: string; en: string; color: string }> = {
  INNER_PRINTED: { lo: 'ພິມເນື້ອໃນ', en: 'Inner Print', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  COVER_PRINTED: { lo: 'ພິມປົກ', en: 'Cover Print', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  COVER_LAMINATED: { lo: 'ເຄືອບປົກ', en: 'Lamination', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  PAPER_TRIMMED: { lo: 'ຕັດເຈ້ຍ & ພັບ', en: 'Trimming', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  BOUND: { lo: 'ເຂົ້າຮູບ/ເຂົ້າເລ່ມ', en: 'Binding', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  READY_FOR_PICKUP: { lo: 'QC ພ້ອມສົ່ງ', en: 'QC Ready', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  COMPLETED: { lo: 'ສຳເລັດຮູບ', en: 'Completed', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const PRIORITY_BADGES: Record<number, { lo: string; color: string }> = {
  1: { lo: 'ປົກກະຕິ', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  2: { lo: 'ດ່ວນ', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  3: { lo: 'ດ່ວນທີ່ສຸດ', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const DailyPlanView: React.FC = () => {
  const { user } = useAuthStore();
  const { showToast, equipment = [] } = useApp();

  const userRole = (user?.role || '').toLowerCase();
  const isManagerOrAdmin =
    userRole === 'admin' ||
    userRole === 'manager' ||
    userRole === 'owner' ||
    userRole === 'super_admin';

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [assignments, setAssignments] = useState<ProductionStageAssignment[]>([]);
  const [readyQueue, setReadyQueue] = useState<ReadyQueueItem[]>([]);
  const [staffList, setStaffList] = useState<AssignableStaff[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [dbDisconnected, setDbDisconnected] = useState<boolean>(false);
  const [dbErrorDetails, setDbErrorDetails] = useState<string>('');

  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    setDbDisconnected(false);
    setDbErrorDetails('');

    try {
      const plan = await fetchDailyPlan({
        date: selectedDate,
        shift: shiftFilter === 'all' ? undefined : shiftFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setAssignments(plan);

      if (isManagerOrAdmin) {
        const [queue, staff] = await Promise.all([
          fetchReadyOrdersQueue().catch((e) => {
            console.warn('Ready queue fetch warning:', e);
            return [];
          }),
          fetchAssignableStaff().catch((e) => {
            console.warn('Staff fetch warning:', e);
            return [];
          }),
        ]);
        setReadyQueue(queue);
        setStaffList(staff);
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.code === 'DB_DISCONNECTED') {
        setDbDisconnected(true);
        setDbErrorDetails(err.message);
      } else if (err.statusCode === 503) {
        setDbDisconnected(true);
        setDbErrorDetails(err.message || 'ຖານຂໍ້ມູນບໍ່ໄດ້ເຊື່ອມຕໍ່');
      } else {
        showToast(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນແຜນງານ', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, shiftFilter, statusFilter]);

  // Date Shift Helper
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Status Action Handler
  const handleProgressAction = async (id: string, targetStatus: 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED') => {
    setActionInProgress(id);
    try {
      await updateAssignmentProgress(id, {
        status: targetStatus,
        operator_id: user?.username || 'OP-STAFF',
      });
      showToast('ອັບເດດສະຖານະວຽກສຳເລັດແລ້ວ', 'success');
      loadData();
    } catch (err: any) {
      showToast(`ບໍ່ສາມາດອັບເດດໄດ້: ${err.message}`, 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  // Delete Assignment Handler
  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບການມອບໝາຍວຽກນີ້?')) return;
    try {
      await deleteAssignment(id);
      showToast('ລຶບການມອບໝາຍວຽກຮຽບຮ້ອຍ', 'success');
      loadData();
    } catch (err: any) {
      showToast(`ລຶບບໍ່ສຳເລັດ: ${err.message}`, 'error');
    }
  };

  const inProgressCount = assignments.filter((a) => a.status === 'IN_PROGRESS').length;
  const completedCount = assignments.filter((a) => a.status === 'COMPLETED').length;
  const pausedCount = assignments.filter((a) => a.status === 'PAUSED').length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6 font-sans animate-fade-in">
      {/* Hero Header - Corporate Navy matching EmployeeManagement */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-white/5 -translate-y-24 translate-x-20 pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <p className="text-xs font-black text-white/50 uppercase tracking-widest">
            Som Sing Printing — Production Module
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10 shrink-0">
              <Calendar className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                ແຜນງານຜະລິດປະຈຳວັນ (Daily Production Plan)
              </h1>
              <p className="text-xs text-white/60 font-medium">
                {isManagerOrAdmin
                  ? 'ຈັດຄິວ, ມອບໝາຍພະນັກງານ ແລະ ເຄື່ອງຈັກຕາມຂັ້ນຕອນການຜະລິດ'
                  : 'ລາຍການງານຜະລິດທີ່ໄດ້ຮັບມອບໝາຍສະເພາະທ່ານ'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 relative z-10">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/20 transition disabled:opacity-50 cursor-pointer text-xs font-bold shadow-xs active:scale-95"
            title="ໂຫຼດຂໍ້ມູນໃໝ່ (Refresh)"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">ຣີເຟຣຊ</span>
          </button>

          {isManagerOrAdmin && (
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white text-slate-900 rounded-2xl text-xs sm:text-sm font-black hover:bg-slate-100 transition active:scale-95 cursor-pointer shadow-md shrink-0"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>ມອບໝາຍວຽກໃໝ່</span>
            </button>
          )}
        </div>
      </div>

      {/* Disconnected DB Banner */}
      {dbDisconnected && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs animate-fade-in">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
            <Database className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="text-sm font-black text-amber-900">
              ຖານຂໍ້ມູນ PostgreSQL ບໍ່ໄດ້ເຊື່ອມຕໍ່ (Database Disconnected)
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              {dbErrorDetails ||
                'ລະບົບບໍ່ສາມາດດຶງ ຫຼື ບັນທຶກແຜນງານລົງໃນຖານຂໍ້ມູນໄດ້ ເນື່ອງຈາກການເຊື່ອມຕໍ່ PostgreSQL ຂັດຂ້ອງ. ລະບົບປະຕິເສດການບັນທຶກຊົ່ວຄາວ ເພື່ອປ້ອງກັນຂໍ້ມູນສູນຫາຍ.'}
            </p>
            <button
              type="button"
              onClick={loadData}
              className="mt-2 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer shadow-xs active:scale-95"
            >
              ລອງເຊື່ອມຕໍ່ໃໝ່ (Retry)
            </button>
          </div>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">ວຽກທັງໝົດໃນແຜນ</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{assignments.length}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">ລາຍການປະຈຳວັນ</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">ກຳລັງຜະລິດ</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{inProgressCount}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">ດຳເນີນການຢູ່ເຄື່ອງ</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
            <Pause className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">ຢຸດຊົ່ວຄາວ</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{pausedCount}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">ລໍຖ້າຕໍ່ຮອບ</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-50 text-sky-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">ສຳເລັດແລ້ວ</p>
            <p className="text-2xl font-black text-sky-600 mt-0.5">{completedCount}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">ຜ່ານຂັ້ນຕອນແລ້ວ</p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar - Clean Light Theme */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Date Selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftDate(-1)}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer active:scale-95 shadow-xs"
            title="ມື້ກ່ອນໜ້າ"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs"
          />
          <button
            type="button"
            onClick={() => shiftDate(1)}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer active:scale-95 shadow-xs"
            title="ມື້ຖັດໄປ"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer shadow-xs active:scale-95 ${
              selectedDate === todayStr
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            ມື້ນີ້
          </button>
        </div>

        {/* Center/Right: Dropdowns & Status */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Shift Filter */}
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer focus:outline-none focus:border-indigo-500 shadow-xs"
            >
              <option value="all">ທຸກກະວຽກ (All Shifts)</option>
              <option value="morning">ກະເຊົ້າ (Morning)</option>
              <option value="afternoon">ກະບ່າຍ (Afternoon)</option>
              <option value="full">ເຕັມວັນ (Full Day)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer focus:outline-none focus:border-indigo-500 shadow-xs"
            >
              <option value="all">ທຸກສະຖານະ (All Statuses)</option>
              <option value="ASSIGNED">ມອບໝາຍແລ້ວ (Assigned)</option>
              <option value="IN_PROGRESS">ກຳລັງຜະລິດ (In Progress)</option>
              <option value="PAUSED">ຢຸດຊົ່ວຄາວ (Paused)</option>
              <option value="COMPLETED">ສຳເລັດແລ້ວ (Completed)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-3xl shadow-xs">
          <div className="w-9 h-9 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">ກຳລັງໂຫຼດຂໍ້ມູນແຜນງານ...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-300">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900">ບໍ່ມີແຜນງານຜະລິດໃນວັນທີເລືອກ</h3>
          <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
            {isManagerOrAdmin
              ? 'ຍັງບໍ່ມີການມອບໝາຍງານໃນວັນທີນີ້ ກົດປຸ່ມ "ມອບໝາຍວຽກໃໝ່" ເພື່ອເລືອກອໍເດີເຂົ້າສູ່ຄິວການຜະລິດ'
              : 'ທ່ານຍັງບໍ່ມີວຽກທີ່ໄດ້ຮັບມອບໝາຍໃນວັນທີນີ້'}
          </p>
          {isManagerOrAdmin && (
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(true)}
              className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ມອບໝາຍວຽກທຳອິດ</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View - Scannable with light border & soft shadow */}
          <div className="hidden lg:block overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50/80 text-slate-500 font-black uppercase text-[11px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">ອໍເດີ & ລູກຄ້າ</th>
                  <th className="py-3.5 px-4">ລາຍການງານພິມ</th>
                  <th className="py-3.5 px-4">ຂັ້ນຕອນ</th>
                  <th className="py-3.5 px-4">ກະວຽກ</th>
                  <th className="py-3.5 px-4">ພະນັກງານ</th>
                  <th className="py-3.5 px-4">ເຄື່ອງຈັກ</th>
                  <th className="py-3.5 px-4">ຄວາມດ່ວນ</th>
                  <th className="py-3.5 px-4">ສະຖານະ</th>
                  <th className="py-3.5 px-4 text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {assignments.map((task) => {
                  const stageCfg = STAGE_LABELS[task.stage] || {
                    lo: task.stage,
                    en: task.stage,
                    color: 'bg-slate-100 text-slate-700 border-slate-200',
                  };
                  const priorityCfg = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES[1];
                  const isExecuting = actionInProgress === task.id;

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/70 transition">
                      {/* Order & Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-black text-indigo-950 text-sm">
                          #{task.order_no || task.order_id}
                        </div>
                        <div className="text-xs text-slate-600 font-semibold truncate max-w-[150px]">
                          {task.customer_name || 'ລູກຄ້າທົ່ວໄປ'}
                        </div>
                        {task.delivery_date && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ສົ່ງ: {task.delivery_date}
                          </div>
                        )}
                      </td>

                      {/* Print Item */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 truncate max-w-[180px]">
                          {task.item_name || 'ງານພິມມາດຕະຖານ'}
                        </div>
                        {task.quantity && task.quantity > 0 && (
                          <div className="text-[11px] text-indigo-600 font-bold font-mono">
                            {task.quantity.toLocaleString()} ຊຸດ
                          </div>
                        )}
                      </td>

                      {/* Stage */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-xl text-[11px] font-bold border ${stageCfg.color}`}>
                          {stageCfg.lo}
                        </span>
                      </td>

                      {/* Shift */}
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {task.planned_shift === 'morning'
                              ? 'ກະເຊົ້າ'
                              : task.planned_shift === 'afternoon'
                              ? 'ກະບ່າຍ'
                              : task.planned_shift === 'full'
                              ? 'ເຕັມວັນ'
                              : task.planned_shift}
                          </span>
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="py-3.5 px-4">
                        {task.assignee_name ? (
                          <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <span className="truncate max-w-[130px]">{task.assignee_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">ຍັງບໍ່ໄດ້ກຳນົດ</span>
                        )}
                      </td>

                      {/* Machine */}
                      <td className="py-3.5 px-4">
                        {task.machine_name ? (
                          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                            <Printer className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[130px]">{task.machine_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black border ${priorityCfg.color}`}>
                          {priorityCfg.lo}
                        </span>
                      </td>

                      {/* Status - Soft Badges */}
                      <td className="py-3.5 px-4">
                        {task.status === 'IN_PROGRESS' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            ກຳລັງຜະລິດ
                          </span>
                        ) : task.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ສຳເລັດ
                          </span>
                        ) : task.status === 'PAUSED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                            <Pause className="w-3.5 h-3.5 text-amber-600" />
                            ຢຸດຊົ່ວຄາວ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                            ລໍຖ້າເລີ່ມ
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                            <>
                              {task.status !== 'IN_PROGRESS' ? (
                                <button
                                  type="button"
                                  onClick={() => handleProgressAction(task.id, 'IN_PROGRESS')}
                                  disabled={isExecuting}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition disabled:opacity-50 cursor-pointer active:scale-95"
                                  title="ເລີ່ມຜະລິດ (Start Stage)"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>ເລີ່ມ</span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleProgressAction(task.id, 'PAUSED')}
                                    disabled={isExecuting}
                                    className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition disabled:opacity-50 cursor-pointer active:scale-95"
                                    title="ຢຸດຊົ່ວຄາວ (Pause Stage)"
                                  >
                                    <Pause className="w-3 h-3" />
                                    <span>ຢຸດ</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleProgressAction(task.id, 'COMPLETED')}
                                    disabled={isExecuting}
                                    className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition disabled:opacity-50 cursor-pointer active:scale-95"
                                    title="ສຳເລັດຂັ້ນຕອນ (Complete Stage)"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>ສຳເລັດ</span>
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          {isManagerOrAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAssignment(task.id)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="ລຶບການມອບໝາຍ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card View - Quick scannable cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {assignments.map((task) => {
              const stageCfg = STAGE_LABELS[task.stage] || {
                lo: task.stage,
                en: task.stage,
                color: 'bg-slate-100 text-slate-700 border-slate-200',
              };
              const priorityCfg = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES[1];
              const isExecuting = actionInProgress === task.id;

              return (
                <div
                  key={task.id}
                  className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 hover:border-indigo-200 transition"
                >
                  {/* Card Header: Order No, Customer, Priority & Status */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="font-mono font-black text-indigo-950 text-base">
                        #{task.order_no || task.order_id}
                      </div>
                      <div className="text-xs font-bold text-slate-700 mt-0.5">
                        {task.customer_name || 'ລູກຄ້າທົ່ວໄປ'}
                      </div>
                      {task.delivery_date && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ສົ່ງ: {task.delivery_date}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black border ${priorityCfg.color}`}>
                        {priorityCfg.lo}
                      </span>
                      {task.status === 'IN_PROGRESS' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ກຳລັງຜະລິດ
                        </span>
                      ) : task.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ສຳເລັດ
                        </span>
                      ) : task.status === 'PAUSED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          <Pause className="w-3 h-3" />
                          ຢຸດຊົ່ວຄາວ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                          ລໍຖ້າເລີ່ມ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Item & Stage */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {task.item_name || 'ງານພິມມາດຕະຖານ'}
                      </h4>
                      {task.quantity && task.quantity > 0 && (
                        <span className="text-xs font-black text-indigo-600 font-mono">
                          {task.quantity.toLocaleString()} ຊຸດ
                        </span>
                      )}
                    </div>
                    <div>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-xl text-xs font-bold border ${stageCfg.color}`}>
                        {stageCfg.lo}
                      </span>
                    </div>
                  </div>

                  {/* Assignment Details Grid: Staff, Machine, Shift */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate font-semibold">
                        {task.assignee_name || 'ຍັງບໍ່ໄດ້ກຳນົດ'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Printer className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate font-semibold">
                        {task.machine_name || '-'}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        ກະວຽກ:{' '}
                        {task.planned_shift === 'morning'
                          ? 'ກະເຊົ້າ'
                          : task.planned_shift === 'afternoon'
                          ? 'ກະບ່າຍ'
                          : task.planned_shift === 'full'
                          ? 'ເຕັມວັນ'
                          : task.planned_shift}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                        <>
                          {task.status !== 'IN_PROGRESS' ? (
                            <button
                              type="button"
                              onClick={() => handleProgressAction(task.id, 'IN_PROGRESS')}
                              disabled={isExecuting}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition disabled:opacity-50 cursor-pointer active:scale-95"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>ເລີ່ມ</span>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleProgressAction(task.id, 'PAUSED')}
                                disabled={isExecuting}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition disabled:opacity-50 cursor-pointer active:scale-95"
                              >
                                <Pause className="w-3 h-3" />
                                <span>ຢຸດ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleProgressAction(task.id, 'COMPLETED')}
                                disabled={isExecuting}
                                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition disabled:opacity-50 cursor-pointer active:scale-95"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>ສຳເລັດ</span>
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    {isManagerOrAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAssignment(task.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="ລຶບການມອບໝາຍ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {isAssignModalOpen && (
        <AssignTaskModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={loadData}
          readyQueue={readyQueue}
          staffList={staffList}
          machines={equipment}
          defaultDate={selectedDate}
          showToast={showToast}
        />
      )}
    </div>
  );
};
