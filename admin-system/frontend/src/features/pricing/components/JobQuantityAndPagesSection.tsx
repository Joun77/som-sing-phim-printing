import React from 'react';
import { Layers3, ChevronUp, ChevronDown, Maximize2 } from 'lucide-react';
import type { QuotationItem } from './QuotationManager';
import { getPresetDimensions } from './QuotationManager';
import { CustomDimensionInput } from './CustomDimensionInput';

interface JobQuantityAndPagesSectionProps {
  activeItem: QuotationItem;
  updateActiveItem: (patch: Partial<QuotationItem>) => void;
  activeCalc: any;
  isOpen: boolean;
  onToggle: () => void;
  currentLang: string;
}

const PRESET_SIZES: Record<string, { w: number; h: number }> = {
  'A3': { w: 297, h: 420 },
  'A4': { w: 210, h: 297 },
  'A5': { w: 148, h: 210 },
  'A6': { w: 105, h: 148 },
};

export const JobQuantityAndPagesSection: React.FC<JobQuantityAndPagesSectionProps> = ({
  activeItem,
  updateActiveItem,
  activeCalc,
  isOpen,
  onToggle,
  currentLang,
}) => {
  const currentW = activeItem.jobWidth || 210;
  const currentH = activeItem.jobHeight || 297;
  const areaRatio = ((currentW * currentH) / (210 * 297));

  return (
    <div id="sec-phase2" className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs transition">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between transition cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-sans font-black text-xs shadow-xs">2</span>
          <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
            {currentLang === 'lo' ? 'ຈຳນວນຜະລິດ, ໜ້າ & ຂະໜາດງານ (Quantity, Pages & Size)' : 'Quantity, Pages & Size'}
          </span>
          <span className="text-[11px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-sans flex items-center gap-1">
            <Layers3 className="w-3 h-3" />
            {activeItem.printVolume.toLocaleString()} {activeItem.unitName || 'ຊຸດ'}
            {` • ${activeItem.jobSizePreset || 'A4'} (${currentW}×${currentH}mm)`}
            {activeItem.pagesPerBook ? ` • ${activeItem.pagesPerBook} ໜ້າ` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[11px] font-medium hidden sm:inline">{isOpen ? 'ພັບເກັບ' : 'ເປີດເບິ່ງ'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-slate-100 space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Box 1: Order Quantity (ຈຳນວນທີ່ສັ່ງຜະລິດ) */}
            <div className="space-y-2.5 p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl shadow-xs">
              <div className="flex justify-between items-center gap-2">
                <label className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                  <span>{currentLang === 'lo' ? '1. ຈຳນວນຜະລິດ (QTY)' : 'ORDER QUANTITY'}</span>
                  <span className="text-emerald-700 font-black">*</span>
                </label>
                <div className="flex gap-1 shrink-0">
                  {['ຊຸດ', 'ຫົວ'].map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => updateActiveItem({ unitName: u })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                        (activeItem.unitName === u || (!activeItem.unitName && u === 'ຊຸດ') || (activeItem.unitName === 'ແຜ່ນ' && u === 'ຊຸດ'))
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={activeItem.printVolume}
                  onChange={(e) => updateActiveItem({ printVolume: Math.max(1, Number(e.target.value)) })}
                  className="w-full min-h-[46px] pl-4 pr-16 py-2 border-2 border-emerald-400 rounded-xl focus:outline-none text-xl font-black font-sans bg-white text-emerald-950 text-center shadow-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-lg text-xs font-black shadow-2xs font-sans">
                  {activeItem.unitName === 'ແຜ່ນ' ? 'ຊຸດ' : (activeItem.unitName || 'ຊຸດ')}
                </div>
              </div>

              {/* Quick Quantity Preset Chips */}
              <div className="pt-1 flex flex-wrap gap-1.5 justify-center">
                {[50, 100, 200, 300, 500, 1000, 2000].map(qty => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => updateActiveItem({ printVolume: qty })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black font-sans transition cursor-pointer ${
                      activeItem.printVolume === qty
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {qty.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Box 2: Pages per Book / Unit OR Photos per Set */}
            {(() => {
              const isBatchPhoto = Boolean(
                activeItem.isBatchPhoto || 
                activeCalc.isBatchPhoto || 
                activeItem.name?.includes('Photo Prints') || 
                (activeItem.batchFiles && activeItem.batchFiles.length > 0)
              );
              const countVal = activeCalc.photoCountPerSet || activeItem.pagesPerBook || 1;
              return (
                <div className="space-y-2.5 p-4 bg-sky-50/60 border border-sky-200 rounded-2xl shadow-xs">
                  <div className="flex justify-between items-center gap-1.5 flex-wrap sm:flex-nowrap">
                    <label className="text-xs font-black text-sky-950 uppercase tracking-wider flex items-center gap-1">
                      <span>
                        {isBatchPhoto 
                          ? (currentLang === 'lo' ? '2. ຈຳນວນຮູບຕໍ່ຊຸດ (PHOTOS)' : 'PHOTOS PER SET')
                          : (currentLang === 'lo' ? '2. ຈຳນວນໜ້າ (PAGES)' : 'PAGES PER BOOK')}
                      </span>
                      <span className="text-sky-700 font-black">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-sky-800 bg-sky-100/90 border border-sky-200/80 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1 font-sans shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                      <span>{currentLang === 'lo' ? 'Preflight ອັດຕະໂນມັດ' : 'Auto Preflight'}</span>
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={activeItem.pagesPerBook || 1}
                      onChange={(e) => updateActiveItem({ 
                        pagesPerBook: Math.max(1, Number(e.target.value)),
                        photoCount: isBatchPhoto ? Math.max(1, Number(e.target.value)) : undefined
                      })}
                      className="w-full min-h-[46px] pl-4 pr-16 py-2 border-2 border-sky-400 rounded-xl focus:outline-none text-xl font-black font-sans bg-white text-sky-950 text-center shadow-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none px-2.5 py-0.5 bg-sky-100 text-sky-900 rounded-lg text-xs font-black shadow-2xs font-sans">
                      {isBatchPhoto ? 'ຮູບ' : 'ໜ້າ'}
                    </div>
                  </div>

                  {/* Page / Photo & Layout Summary */}
                  <div className="p-2.5 bg-sky-100/70 border border-sky-200/80 rounded-xl text-[11px] text-sky-900 font-medium space-y-1">
                    <div className="flex justify-between">
                      <span>{isBatchPhoto ? 'ຮູບແບບ:' : 'ການພິມ:'}</span>
                      <span className="font-bold">
                        {isBatchPhoto 
                          ? `ວາງພິມ ${activeCalc.cutsPerSheet || 1} ຮູບ/ແຜ່ນແມ່`
                          : (activeItem.isDoubleSided ? 'ພິມ 2 ໜ້າ (Duplex)' : 'ພິມໜ້າດຽວ (Simplex)')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{isBatchPhoto ? 'ຈຳນວນແຜ່ນແມ່ຕໍ່ 1 ຊຸດ:' : 'ແຜ່ນເນື້ອໃນຕໍ່ 1 ເລັ້ມ:'}</span>
                      <span className="font-bold font-sans text-sky-950">
                        {isBatchPhoto 
                          ? `${Math.ceil(countVal / Math.max(1, activeCalc.cutsPerSheet || 1))} ແຜ່ນແມ່ / ຊຸດ`
                          : `${activeCalc.innerSheetsPerBook || Math.ceil((activeItem.pagesPerBook || 1) / (activeItem.isDoubleSided ? 2 : 1))} ແຜ່ນ / ${activeItem.unitName || 'ຊຸດ'}`}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-sky-200/60 pt-1 text-sky-950 font-bold">
                      <span>{isBatchPhoto ? 'ລວມຮູບພາບທັງໝົດ:' : 'ລວມແຜ່ນເນື້ອໃນທັງໝົດ:'}</span>
                      <span className="font-sans font-black text-emerald-800">
                        {isBatchPhoto
                          ? `${((activeItem.printVolume || 1) * countVal).toLocaleString()} ຮູບ`
                          : `${(activeCalc.totalInnerSheets || (activeItem.printVolume * Math.ceil((activeItem.pagesPerBook || 1) / (activeItem.isDoubleSided ? 2 : 1)))).toLocaleString()} ແຜ່ນ`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Box 3: Job Size & Dimensions (ຂະໜາດຊິ້ນງານ / ຂະໜາດເຈ້ຍ) */}
            <div className="space-y-2.5 p-4 bg-amber-50/60 border border-amber-200 rounded-2xl shadow-xs">
              <div className="flex justify-between items-center gap-1.5">
                <label className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>{currentLang === 'lo' ? '3. ຂະໜາດງານ (SIZE & PRESET)' : 'JOB SIZE & PRESET'}</span>
                  <span className="text-amber-700 font-black">*</span>
                </label>
                <span className="text-[10px] font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md font-sans">
                  {activeItem.jobSizePreset || 'A4'}
                </span>
              </div>

              {/* Multi-unit & DB Preset Component */}
              <CustomDimensionInput
                widthMM={currentW}
                heightMM={currentH}
                currentLang={currentLang}
                onChangeMM={(wMM, hMM, presetName) => {
                  updateActiveItem({
                    jobWidth: wMM,
                    jobHeight: hMM,
                    jobSizePreset: presetName || 'Custom',
                  });
                }}
              />

              {/* Area Factor & Ratio Summary */}
              <div className="p-2 bg-amber-100/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-950 font-medium space-y-0.5">
                <div className="flex justify-between">
                  <span>ຂະໜາດງານ (ມມ):</span>
                  <span className="font-bold font-sans">{Math.round(currentW)} × {Math.round(currentH)} mm</span>
                </div>
                <div className="flex justify-between border-t border-amber-200/60 pt-0.5">
                  <span>ອັດຕาส່ວນທຽບ A4:</span>
                  <span className="font-bold font-sans text-amber-900">
                    {(areaRatio * 100).toFixed(0)}% ({areaRatio.toFixed(2)}x)
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
