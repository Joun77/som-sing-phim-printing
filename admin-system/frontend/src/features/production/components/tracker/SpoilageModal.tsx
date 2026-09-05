import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  FileText,
  Palette,
  Layers,
  Droplet,
  Scissors
} from 'lucide-react';
import { RCA_CAUSES } from './types';

interface SpoilageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (count: number, rca: string, notes: string) => void;
  updating?: boolean;
  jobName: string;
  currentStep: string;
}

export const SpoilageModal: React.FC<SpoilageModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  updating = false,
  jobName,
  currentStep,
}) => {
  const [spoilageCount, setSpoilageCount] = useState<number>(0);
  const [selectedRCA, setSelectedRCA] = useState<string>('PAPER_JAM');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleNumpadInput = (val: string) => {
    if (val === 'CLEAR') {
      setSpoilageCount(0);
      return;
    }
    if (val === 'BACKSPACE') {
      const s = String(spoilageCount);
      if (s.length <= 1) setSpoilageCount(0);
      else setSpoilageCount(parseInt(s.slice(0, -1), 10));
      return;
    }
    const currentStr = spoilageCount === 0 ? '' : String(spoilageCount);
    const nextVal = parseInt(currentStr + val, 10);
    if (!isNaN(nextVal) && nextVal < 100000) {
      setSpoilageCount(nextVal);
    }
  };

  const handleAddQuick = (amount: number) => {
    setSpoilageCount((prev) => prev + amount);
  };

  const getRCAIcon = (id: string) => {
    switch (id) {
      case 'PAPER_JAM': return <FileText className="w-4 h-4 text-amber-500" />;
      case 'COLOR_MISMATCH': return <Palette className="w-4 h-4 text-purple-500" />;
      case 'PLATE_DAMAGED': return <Layers className="w-4 h-4 text-blue-500" />;
      case 'INK_SMUDGE': return <Droplet className="w-4 h-4 text-sky-500" />;
      case 'DIECUT_MISALIGNED': return <Scissors className="w-4 h-4 text-rose-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white border border-sky-100 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>ບັນທຶກເຈ້ຍເສຍ & ສາເຫດ (Spoilage & RCA)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Job: {jobName} • ຂັ້ນຕອນ: {currentStep}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Counter Display */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 text-center">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
            ຈຳນວນເຈ້ຍເສຍທັງໝົດ
          </span>
          <div className="text-4xl font-black text-amber-700 font-mono mt-1">
            {spoilageCount.toLocaleString()} <span className="text-sm font-bold text-slate-600">ແຜ່ນ</span>
          </div>
        </div>

        {/* Quick Increment Chips */}
        <div className="flex items-center justify-center gap-2">
          {[1, 5, 10, 25, 50].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleAddQuick(num)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-amber-100 border border-slate-200 hover:border-amber-300 rounded-xl text-xs font-black text-slate-700 transition active:scale-95 cursor-pointer"
            >
              +{num}
            </button>
          ))}
        </div>

        {/* Touchscreen Virtual Numpad */}
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'BACKSPACE'].map((btn) => (
            <button
              key={btn}
              type="button"
              onClick={() => handleNumpadInput(btn)}
              className={`py-3 rounded-xl text-base font-black transition active:scale-95 cursor-pointer flex items-center justify-center border ${
                btn === 'CLEAR'
                  ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 text-xs'
                  : btn === 'BACKSPACE'
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              {btn === 'CLEAR' ? 'ລຶບທັງໝົດ' : btn === 'BACKSPACE' ? '⌫' : btn}
            </button>
          ))}
        </div>

        {/* RCA Cause Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            ສາເຫດຄວາມຜິດພາດ (Root Cause Analysis - RCA):
          </label>
          <div className="grid grid-cols-2 gap-2">
            {RCA_CAUSES.map((rca) => (
              <button
                key={rca.id}
                type="button"
                onClick={() => setSelectedRCA(rca.id)}
                className={`p-2.5 rounded-xl text-xs font-bold text-left transition flex items-center gap-2 border cursor-pointer ${
                  selectedRCA === rca.id
                    ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {getRCAIcon(rca.id)}
                <span className="truncate">{rca.labelLao}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            ໝາຍເຫດຊ່າງພິມ (Operator Notes):
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ເຊັ່ນ: ເຈ້ຍຕິດຫົວເຄື່ອງ, ສີມົວ..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-amber-400 focus:bg-white"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            onClick={() => onConfirm(spoilageCount, selectedRCA, notes)}
            disabled={updating}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-md shadow-amber-500/25 transition active:scale-95 cursor-pointer border-none"
          >
            {updating ? 'ກຳລັງບັນທຶກ...' : 'ຢືນຢັນບັນທຶກ'}
          </button>
        </div>
      </div>
    </div>
  );
};
