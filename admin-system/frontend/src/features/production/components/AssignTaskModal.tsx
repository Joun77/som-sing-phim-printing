import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Printer,
  Layers,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import type {
  ReadyQueueItem,
  AssignableStaff,
  CreateAssignmentPayload,
  ConflictInfo,
} from '../../../types/production';
import { createAssignment } from '../services/dailyPlanApi';

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  readyQueue: ReadyQueueItem[];
  staffList: AssignableStaff[];
  machines: any[];
  defaultDate?: string;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

const STAGES = [
  { id: 'INNER_PRINTED', labelLo: 'ພິມເນື້ອໃນ (Inner Print)', labelEn: 'Inner Printing' },
  { id: 'COVER_PRINTED', labelLo: 'ພິມປົກ (Cover Print)', labelEn: 'Cover Printing' },
  { id: 'COVER_LAMINATED', labelLo: 'ເຄືອບປົກ (Lamination)', labelEn: 'Lamination' },
  { id: 'PAPER_TRIMMED', labelLo: 'ຕັດເຈ້ຍ & ຮອຍພັບ (Trimming & Creasing)', labelEn: 'Trimming' },
  { id: 'BOUND', labelLo: 'ເຂົ້າຮູບ / ເຂົ້າເລ່ມ (Binding)', labelEn: 'Binding' },
  { id: 'READY_FOR_PICKUP', labelLo: 'ກວດສອບ QC & ພ້ອມສົ່ງມອບ (QC Ready)', labelEn: 'QC & Dispatch' },
  { id: 'COMPLETED', labelLo: 'ສຳເລັດຮູບ (Completed)', labelEn: 'Completed' },
];

const SHIFTS = [
  { id: 'morning', labelLo: 'ກະເຊົ້າ (08:00 - 12:00 / 17:00)', labelEn: 'Morning Shift' },
  { id: 'afternoon', labelLo: 'ກະບ່າຍ (13:00 - 21:00)', labelEn: 'Afternoon Shift' },
  { id: 'full', labelLo: 'ເຕັມວັນ (Full Day)', labelEn: 'Full Day' },
];

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  readyQueue,
  staffList,
  machines,
  defaultDate,
  showToast,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [stage, setStage] = useState<string>('INNER_PRINTED');
  const [plannedDate, setPlannedDate] = useState<string>(defaultDate || new Date().toISOString().split('T')[0]);
  const [plannedShift, setPlannedShift] = useState<string>('morning');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [machineId, setMachineId] = useState<string>('');
  const [priority, setPriority] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [force, setForce] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [conflictWarning, setConflictWarning] = useState<ConflictInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (defaultDate) {
      setPlannedDate(defaultDate);
    }
  }, [defaultDate]);

  if (!isOpen) return null;

  const selectedOrder = readyQueue.find((o) => o.order_id === selectedOrderId);
  const selectedItem = selectedOrder?.items.find((i) => i.id === selectedItemId);

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ordId = e.target.value;
    setSelectedOrderId(ordId);
    const ord = readyQueue.find((o) => o.order_id === ordId);
    if (ord && ord.items.length > 0) {
      setSelectedItemId(ord.items[0].id);
    } else {
      setSelectedItemId('');
    }
    setConflictWarning(null);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !selectedItemId) {
      setErrorMsg('ກະລຸນາເລືອກອໍເດີ ແລະ ລາຍການງານພິມ');
      return;
    }

    if (selectedOrder && !selectedOrder.is_ready_for_production) {
      setErrorMsg(`ອໍເດີນີ້ບໍ່ພ້ອມຜະລິດ: ${selectedOrder.block_reason || 'ເງື່ອນໄຂບໍ່ຄົບຖ້ວນ'}`);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const payload: CreateAssignmentPayload = {
      order_id: selectedOrderId,
      order_item_id: selectedItemId,
      stage,
      planned_date: plannedDate,
      planned_shift: plannedShift,
      assignee_id: assigneeId || undefined,
      machine_id: machineId || undefined,
      priority,
      notes: notes || undefined,
      force,
    };

    try {
      await createAssignment(payload);
      showToast('ມອບໝາຍວຽກຜະລິດສຳເລັດແລ້ວ', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.conflict && err.conflict.has_conflict) {
        setConflictWarning(err.conflict);
      } else {
        setErrorMsg(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການມອບໝາຍວຽກ');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 sm:my-8 animate-scale-up">
        {/* Navy Header matching ERP Design System */}
        <div className="bg-slate-900 text-white px-6 py-4 sm:py-5 flex items-center justify-between border-b border-slate-800 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-white/5 -translate-y-20 translate-x-16 pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                ມອບໝາຍວຽກຜະລິດປະຈຳວັນ
              </h3>
              <p className="text-xs text-white/60 font-medium">Assign Production Stage & Daily Scheduling</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer relative z-10 active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Light Slate-50 Background */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 bg-slate-50/70 max-h-[80vh] overflow-y-auto">
          {/* Conflict Warning Alert */}
          {conflictWarning && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 shadow-xs animate-fade-in">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>ພົບການມອບໝາຍຊ້ອນກັນ (Schedule Collision Detected)</span>
              </div>
              <ul className="text-xs text-amber-800 list-disc list-inside space-y-1 pl-1 font-medium">
                {conflictWarning.details.map((d, idx) => (
                  <li key={idx}>{d}</li>
                ))}
              </ul>
              <div className="pt-2 flex items-center gap-2 border-t border-amber-200/80">
                <input
                  type="checkbox"
                  id="force-override"
                  checked={force}
                  onChange={(e) => setForce(e.target.checked)}
                  className="rounded border-amber-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-white cursor-pointer"
                />
                <label htmlFor="force-override" className="text-xs font-bold text-amber-950 cursor-pointer">
                  ຢືນຢັນການມອບໝາຍຊ້ອນ (Force override conflict queue)
                </label>
              </div>
            </div>
          )}

          {/* General Error Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-xs font-bold shadow-xs animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Order & Item Selection Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>ຂໍ້ມູນອໍເດີ & ລາຍການຜະລິດ</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ເລືອກອໍເດີ (Order Selection) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedOrderId}
                  onChange={handleOrderChange}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition shadow-xs cursor-pointer"
                >
                  <option value="">-- ເລືອກອໍເດີ --</option>
                  {readyQueue.map((ord) => (
                    <option
                      key={ord.order_id}
                      value={ord.order_id}
                      disabled={!ord.is_ready_for_production}
                    >
                      #{ord.order_no} - {ord.customer_name} {!ord.is_ready_for_production ? `(ຕິດຂັດ: ${ord.block_reason})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ລາຍການງານພິມ (Print Item) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  required
                  disabled={!selectedOrderId || !selectedOrder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <option value="">-- ເລືອກລາຍການ --</option>
                  {selectedOrder?.items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.item_name} ({it.quantity.toLocaleString()} ຊຸດ, {it.paper_size})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Block Reason Warning if unready */}
            {selectedOrder && !selectedOrder.is_ready_for_production && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                <span>
                  <strong className="font-bold">ອໍເດີນີ້ຍັງບໍ່ສາມາດມອບໝາຍໄດ້:</strong> {selectedOrder.block_reason}
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Stage & Timing Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>ຂັ້ນຕອນ & ກຳນົດເວລາຕາມແຜນ</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ຂັ້ນຕອນການຜະລິດ (Stage) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition shadow-xs cursor-pointer"
                >
                  {STAGES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.labelLo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ວັນທີຕາມແຜນ (Planned Date) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={plannedDate}
                  onChange={(e) => {
                    setPlannedDate(e.target.value);
                    setConflictWarning(null);
                  }}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ກະວຽກ (Shift)
                </label>
                <select
                  value={plannedShift}
                  onChange={(e) => {
                    setPlannedShift(e.target.value);
                    setConflictWarning(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition shadow-xs cursor-pointer"
                >
                  {SHIFTS.map((sh) => (
                    <option key={sh.id} value={sh.id}>
                      {sh.labelLo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Staff & Machine Allocation Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>ການຈັດສັນຊ່າງ & ເຄື່ອງຈັກ</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ພະນັກງານຜູ້ຮັບຜິດຊອບ (Assignee)</span>
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => {
                    setAssigneeId(e.target.value);
                    setConflictWarning(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition shadow-xs cursor-pointer"
                >
                  <option value="">-- ເລືອກພະນັກງານ (ບໍ່ບັງຄັບ) --</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.nameLo} ({st.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ເຄື່ອງຈັກ (Assigned Machine)</span>
                </label>
                <select
                  value={machineId}
                  onChange={(e) => {
                    setMachineId(e.target.value);
                    setConflictWarning(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition shadow-xs cursor-pointer"
                >
                  <option value="">-- ເລືອກເຄື່ອງຈັກ (ບໍ່ບັງຄັບ) --</option>
                  {machines.map((m: any) => {
                    const mId = m.id || m.machine_id || m.asset_id;
                    const mName = m.name || m.machine_name || `${m.brand || ''} ${m.model || ''}`;
                    return (
                      <option key={mId} value={mId}>
                        {mName}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Priority & Notes Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ຄວາມຮີບດ່ວນ (Priority)
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition shadow-xs cursor-pointer"
                >
                  <option value={1}>ປົກກະຕິ (Normal)</option>
                  <option value={2}>ດ່ວນ (Urgent)</option>
                  <option value={3}>ດ່ວນທີ່ສຸດ (Rush / Critical)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ໝາຍເຫດການຜະລິດ (Production Notes)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ລາຍລະອຽດສະເພາະ, ຄຳສັ່ງພິເສດ..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-100 transition cursor-pointer shadow-xs active:scale-95"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={submitting || (selectedOrder ? !selectedOrder.is_ready_for_production : false)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-black shadow-md shadow-indigo-600/20 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>ກຳລັງບັນທຶກ...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ຢືນຢັນມອບໝາຍວຽກ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
