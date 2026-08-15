import React, { useState } from 'react';
import { X, Gauge, Save } from 'lucide-react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';

interface RecordMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentItem: any;
}

export default function RecordMeterModal({ isOpen, onClose, equipmentItem }: RecordMeterModalProps) {
  const { addMeterReading, showToast } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const todayStr = new Date().toISOString().split('T')[0];
  const timeNowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(timeNowStr);
  const [meterCount, setMeterCount] = useState<number | ''>(
    equipmentItem ? (equipmentItem.currentMeterCount || equipmentItem.printedCount || 0) : ''
  );
  const [recordedBy, setRecordedBy] = useState('Operator');
  const [notes, setNotes] = useState('');

  if (!isOpen || !equipmentItem) return null;

  const currentMeter = equipmentItem.currentMeterCount || equipmentItem.printedCount || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (meterCount === '' || Number(meterCount) < 0) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາປ້ອນตัวเลขมิเตอร์ให้ถูกต้อง' : 'Please enter a valid meter count', 'error');
      return;
    }

    addMeterReading({
      equipmentId: equipmentItem.id,
      meterCount: Number(meterCount),
      date,
      time,
      recordedBy,
      notes
    });

    showToast(
      currentLang === 'lo'
        ? `ບັນທຶກมิเตอร์เครื่องจักร "${equipmentItem.name}" ສຳເລັດ!`
        : `Logged meter reading for "${equipmentItem.name}" successfully!`,
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-extrabold text-base text-slate-800">
                {currentLang === 'lo' ? 'บันทึกมิเตอร์นับจำนวนแผ่น (Record Meter Reading)' : 'Record Meter Reading'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex justify-between items-center text-emerald-900">
            <span className="text-[10px] font-black uppercase text-emerald-700">Current Saved Meter</span>
            <span className="font-mono font-black text-sm">{currentMeter.toLocaleString()} pages</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Reading Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Reading Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="14:30"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-700 uppercase block mb-1">New Total Meter Count (Click Counter) *</label>
            <input
              type="number"
              required
              min={currentMeter}
              value={meterCount}
              onChange={(e) => setMeterCount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={`Min ${currentMeter}`}
              className="w-full px-3 py-2.5 border-2 border-emerald-500 rounded-xl font-mono text-base font-black bg-white text-slate-950 focus:outline-none shadow-xs"
            />
            {typeof meterCount === 'number' && meterCount >= currentMeter && (
              <span className="text-[10px] font-extrabold text-emerald-600 mt-1 block">
                +{(meterCount - currentMeter).toLocaleString()} new pages printed since last record
              </span>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Recorded By / Operator</label>
            <input
              type="text"
              value={recordedBy}
              onChange={(e) => setRecordedBy(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Notes / Shift Details</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. End of morning shift meter count"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-emerald-500 resize-none"
            />
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
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Record Reading</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
