import React from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  Zap,
  Check
} from 'lucide-react';

interface TactileActionButtonsProps {
  onStart: () => void;
  onPause: () => void;
  onComplete: () => void;
  disabled?: boolean;
  isCompleted?: boolean;
}

export const TactileActionButtons: React.FC<TactileActionButtonsProps> = ({
  onStart,
  onPause,
  onComplete,
  disabled = false,
  isCompleted = false,
}) => {
  return (
    <div className="bg-white border border-sky-100 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3 font-sans">
      <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
        <Zap className="w-4 h-4 text-amber-500" />
        <span>ປຸ່ມສັ່ງການສຳຜັດດ່ວນ (Operator Touch Action Buttons):</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* 1. Start Step Button */}
        <button
          type="button"
          onClick={onStart}
          disabled={disabled || isCompleted}
          className="min-h-[64px] px-6 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] disabled:opacity-40 text-white font-black text-sm sm:text-base rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-3 transition cursor-pointer border-none"
        >
          <Play className="w-5 h-5 fill-white text-white shrink-0" />
          <div className="text-left">
            <div className="leading-tight font-black">ເລີ່ມດຳເນີນງານ (Start)</div>
            <div className="text-[11px] font-bold text-emerald-100">ກົດເມື່ອເລີ່ມເຄື່ອງພິມ/ຂັ້ນຕອນ</div>
          </div>
        </button>

        {/* 2. Spoilage & Pause Button */}
        <button
          type="button"
          onClick={onPause}
          disabled={disabled || isCompleted}
          className="min-h-[64px] px-6 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-[0.98] disabled:opacity-40 text-white font-black text-sm sm:text-base rounded-2xl shadow-md shadow-amber-600/20 flex items-center justify-center gap-3 transition cursor-pointer border-none"
        >
          <Pause className="w-5 h-5 fill-white text-white shrink-0" />
          <div className="text-left">
            <div className="leading-tight font-black">ເຈ້ຍເສຍ / ພັກເຄື່ອງ (Pause)</div>
            <div className="text-[11px] font-bold text-amber-100">ບັນທຶກເສດເຈ້ຍ & ສາເຫດ RCA</div>
          </div>
        </button>

        {/* 3. Complete Step Button */}
        <button
          type="button"
          onClick={onComplete}
          disabled={disabled || isCompleted}
          className={`min-h-[64px] px-6 bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-40 text-white font-black text-sm sm:text-base rounded-2xl shadow-md shadow-sky-600/20 flex items-center justify-center gap-3 transition cursor-pointer border-none ${
            isCompleted ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <div className="text-left">
            <div className="leading-tight font-black">
              {isCompleted ? 'ສຳເລັດຮຽບຮ້ອຍ' : 'ສຳເລັດຂັ້ນຕອນ (Complete)'}
            </div>
            <div className="text-[11px] font-bold text-sky-100">
              {isCompleted ? 'ພ້ອມມອບໃຫ້ລູກຄ້າ' : 'QC & ປັບຂັ້ນຕອນຖັດໄປ'}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
