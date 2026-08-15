import React, { useState } from 'react';
import { X, Wrench, Save } from 'lucide-react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';

interface LogDowntimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentItem: any;
}

export default function LogDowntimeModal({ isOpen, onClose, equipmentItem }: LogDowntimeModalProps) {
  const { addDowntimeLog, showToast } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const nowIso = new Date().toISOString().slice(0, 16);

  const [startTime, setStartTime] = useState(nowIso);
  const [endTime, setEndTime] = useState('');
  const [downtimeMinutes, setDowntimeMinutes] = useState<number | ''>(60);
  const [reason, setReason] = useState('Paper Jam / Roller Replacement');
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [technician, setTechnician] = useState('');
  const [cost, setCost] = useState<number | ''>(0);
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('In Progress');

  if (!isOpen || !equipmentItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      showToast('Please specify a downtime reason', 'error');
      return;
    }

    addDowntimeLog({
      equipmentId: equipmentItem.id,
      equipmentName: equipmentItem.name,
      startTime: new Date(startTime).toISOString(),
      endTime: endTime ? new Date(endTime).toISOString() : null,
      downtimeMinutes: Number(downtimeMinutes) || 0,
      reason,
      description,
      actionTaken,
      technician,
      cost: Number(cost) || 0,
      status
    });

    showToast(
      currentLang === 'lo'
        ? `ບັນທຶກປະວັດການສົ່ງຊ້ອມ / Downtime สำเร็จ!`
        : `Logged downtime maintenance record successfully!`,
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-extrabold text-base text-slate-800">
                {currentLang === 'lo' ? 'บันทึกประวัติการส่งซ่อม & Downtime' : 'Log Maintenance / Downtime'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400">{equipmentItem.name} ({equipmentItem.id})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs font-semibold text-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Start Time *</label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="In Progress">In Progress (กำลังดำเนินการซ่อม)</option>
                <option value="Pending">Pending (รออะไหล่/ช่าง)</option>
                <option value="Completed">Completed (ซ่อมเสร็จแล้ว)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Est. Downtime (Minutes)</label>
              <input
                type="number"
                value={downtimeMinutes}
                onChange={(e) => setDowntimeMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="60"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Repair Cost (LAK)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Reason / Category *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              <option value="Paper Jam / Roller Replacement">Paper Jam / Roller Replacement (เปลี่ยนลูกยาง/ซับกระดาษ)</option>
              <option value="Printhead Cleaning / Calibration">Printhead Cleaning / Calibration (ล้างหัวพิมพ์/ตั้งศูนย์)</option>
              <option value="Fuser / Drum Replacement">Fuser / Drum Replacement (เปลี่ยนดรัม/ชุดความร้อน)</option>
              <option value="Electrical / Motor Error">Electrical / Motor Error (ระบบไฟฟ้า/มอเตอร์ขัดข้อง)</option>
              <option value="Scheduled SLA Maintenance">Scheduled SLA Maintenance (บำรุงรักษาตามรอบ)</option>
              <option value="Other">Other (อื่นๆ)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Detailed Issue Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe symptoms, error codes, or broken components..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Technician / Supplier</label>
              <input
                type="text"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                placeholder="e.g. Somchai Service"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Action Taken / Solution</label>
              <input
                type="text"
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="e.g. Replaced roller kit"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Log Maintenance</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
