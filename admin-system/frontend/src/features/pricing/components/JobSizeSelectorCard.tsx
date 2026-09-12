import React, { useState } from 'react';
import { Maximize2, Sliders } from 'lucide-react';
import { SizePresetSelectorModal } from './modals/SizePresetSelectorModal';

interface JobSizeSelectorCardProps {
  widthMM: number;
  heightMM: number;
  presetName?: string;
  onChange: (widthMM: number, heightMM: number, presetName: string) => void;
  currentLang?: string;
  title?: string;
  required?: boolean;
  className?: string;
}

export const JobSizeSelectorCard: React.FC<JobSizeSelectorCardProps> = ({
  widthMM,
  heightMM,
  presetName = 'A4',
  onChange,
  currentLang = 'lo',
  title,
  required = true,
  className = '',
}) => {
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);

  const currentW = Math.max(1, Number(widthMM) || 210);
  const currentH = Math.max(1, Number(heightMM) || 297);
  const areaRatio = (currentW * currentH) / (210 * 297);

  const cardTitle = title || (currentLang === 'lo' ? 'ຂະໜາດງານ (SIZE & PRESET)' : 'JOB SIZE & PRESET');

  return (
    <div className={`space-y-2.5 p-4 bg-amber-50/60 border border-amber-200 rounded-2xl shadow-xs flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex justify-between items-center gap-1.5 mb-2.5">
          <label className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1">
            <Maximize2 className="w-3.5 h-3.5 text-amber-700" />
            <span>{cardTitle}</span>
            {required && <span className="text-amber-700 font-black">*</span>}
          </label>
          <span className="text-[10px] font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md font-sans">
            {presetName || 'A4'}
          </span>
        </div>

        {/* Primary Trigger Button to Open Modal */}
        <button
          type="button"
          onClick={() => setIsSizeModalOpen(true)}
          className="w-full py-2.5 px-3 bg-white hover:bg-amber-100/50 text-amber-950 border-2 border-amber-300 hover:border-amber-400 rounded-xl transition cursor-pointer flex items-center justify-between group shadow-2xs"
        >
          <div className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-lg bg-amber-100 group-hover:bg-amber-200 text-amber-800 flex items-center justify-center transition shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black block text-amber-950">
                {presetName || 'Custom'} ({Math.round(currentW)} × {Math.round(currentH)} mm)
              </span>
              <span className="text-[10px] text-amber-700 font-medium block">
                {(currentW / 25.4).toFixed(1)}″ × {(currentH / 25.4).toFixed(1)}″ | {(currentW / 10).toFixed(1)} × {(currentH / 10).toFixed(1)} cm
              </span>
            </div>
          </div>
          <span className="text-[10px] font-black bg-amber-200/80 text-amber-900 px-2 py-1 rounded-lg group-hover:bg-amber-300 transition shrink-0">
            {currentLang === 'lo' ? 'ປ່ຽນຂະໜາດ' : 'Change'}
          </span>
        </button>

        {/* Quick Inline W & H Inputs (mm) */}
        <div className="grid grid-cols-2 gap-2 mt-2.5">
          <div className="relative">
            <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
              {currentLang === 'lo' ? 'ກວ້າງ (W mm)' : 'Width (mm)'}
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={Math.round(currentW)}
              onChange={(e) => {
                const val = Math.max(1, Number(e.target.value));
                onChange(val, currentH, 'Custom');
              }}
              className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-950 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div className="relative">
            <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
              {currentLang === 'lo' ? 'ສູງ (H mm)' : 'Height (mm)'}
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={Math.round(currentH)}
              onChange={(e) => {
                const val = Math.max(1, Number(e.target.value));
                onChange(currentW, val, 'Custom');
              }}
              className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-950 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Area Factor & Ratio Summary */}
      <div className="p-2 bg-amber-100/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-950 font-medium space-y-0.5 mt-2">
        <div className="flex justify-between">
          <span>{currentLang === 'lo' ? 'ຂະໜາດງານ (ມມ):' : 'Job Size (mm):'}</span>
          <span className="font-bold font-sans">{Math.round(currentW)} × {Math.round(currentH)} mm</span>
        </div>
        <div className="flex justify-between border-t border-amber-200/60 pt-0.5">
          <span>{currentLang === 'lo' ? 'ອັດຕາສ່ວນທຽບ A4:' : 'Ratio to A4:'}</span>
          <span className="font-bold font-sans text-amber-900">
            {(areaRatio * 100).toFixed(0)}% ({areaRatio.toFixed(2)}x)
          </span>
        </div>
      </div>

      {/* Size Preset Selector Modal */}
      <SizePresetSelectorModal
        isOpen={isSizeModalOpen}
        onClose={() => setIsSizeModalOpen(false)}
        currentWidthMM={currentW}
        currentHeightMM={currentH}
        currentPresetName={presetName}
        currentLang={currentLang}
        onSelectSize={(wMM, hMM, name) => {
          onChange(wMM, hMM, name);
          setIsSizeModalOpen(false);
        }}
      />
    </div>
  );
};
