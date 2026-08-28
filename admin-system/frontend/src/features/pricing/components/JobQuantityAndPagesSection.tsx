import React from 'react';
import { Layers3, ChevronUp, ChevronDown } from 'lucide-react';
import type { QuotationItem } from './QuotationManager';

interface JobQuantityAndPagesSectionProps {
  activeItem: QuotationItem;
  updateActiveItem: (patch: Partial<QuotationItem>) => void;
  activeCalc: any;
  isOpen: boolean;
  onToggle: () => void;
  currentLang: string;
}

export const JobQuantityAndPagesSection: React.FC<JobQuantityAndPagesSectionProps> = ({
  activeItem,
  updateActiveItem,
  activeCalc,
  isOpen,
  onToggle,
  currentLang,
}) => {
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
            {currentLang === 'lo' ? 'ຈຳນວນຜະລິດ & ຈຳນວນໜ້າ (Quantity & Pages)' : 'Quantity & Page Count'}
          </span>
          <span className="text-[11px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-sans flex items-center gap-1">
            <Layers3 className="w-3 h-3" />
            {activeItem.printVolume.toLocaleString()} {activeItem.unitName || 'ຊຸດ'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box 1: Order Quantity (ຈຳນວນທີ່ສັ່ງຜະລິດ) */}
            <div className="space-y-2.5 p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl shadow-xs">
              <div className="flex justify-between items-center gap-2">
                <label className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
                  <span>{currentLang === 'lo' ? '1. ຈຳນວນທີ່ສັ່ງຜະລິດ (ORDER QUANTITY)' : 'ORDER QUANTITY'}</span>
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

            {/* Box 2: Pages per Book / Unit (ຈຳນວນໜ້າຕໍ່ 1 ຊຸດ) */}
            <div className="space-y-2.5 p-4 bg-sky-50/60 border border-sky-200 rounded-2xl shadow-xs">
              <div className="flex justify-between items-center gap-2">
                <label className="text-xs font-black text-sky-950 uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
                  <span>{currentLang === 'lo' ? '2. ຈຳນວນໜ້າຕໍ່ 1 ຊຸດ (PAGES / BOOK)' : 'PAGES PER BOOK'}</span>
                  <span className="text-sky-700 font-black">*</span>
                </label>
                <span className="text-[10px] font-bold text-sky-700 shrink-0">ດຶງຈາກ Preflight ອັດຕະໂນມັດ</span>
              </div>


              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={activeItem.pagesPerBook || 1}
                  onChange={(e) => updateActiveItem({ pagesPerBook: Math.max(1, Number(e.target.value)) })}
                  className="w-full min-h-[46px] pl-4 pr-16 py-2 border-2 border-sky-400 rounded-xl focus:outline-none text-xl font-black font-sans bg-white text-sky-950 text-center shadow-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none px-2.5 py-0.5 bg-sky-100 text-sky-900 rounded-lg text-xs font-black shadow-2xs font-sans">
                  ໜ້າ
                </div>
              </div>

              {/* Page & Duplex Summary */}
              <div className="p-2.5 bg-sky-100/70 border border-sky-200/80 rounded-xl text-[11px] text-sky-900 font-medium space-y-1">
                <div className="flex justify-between">
                  <span>ການພິມ:</span>
                  <span className="font-bold">{activeItem.isDoubleSided ? 'ພິມ 2 ໜ້າ (Duplex)' : 'ພິມໜ້າດຽວ (Simplex)'}</span>
                </div>
                <div className="flex justify-between">
                  <span>ແຜ່ນເນື້ອໃນຕໍ່ 1 ເລັ້ມ:</span>
                  <span className="font-bold font-sans text-sky-950">
                    {activeCalc.innerSheetsPerBook || Math.ceil((activeItem.pagesPerBook || 1) / (activeItem.isDoubleSided ? 2 : 1))} ແຜ່ນ / {activeItem.unitName || 'ຊຸດ'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-sky-200/60 pt-1 text-sky-950 font-bold">
                  <span>ລວມແຜ່ນເນື້ອໃນທັງໝົດ:</span>
                  <span className="font-sans font-black text-emerald-800">
                    {(activeCalc.totalInnerSheets || (activeItem.printVolume * Math.ceil((activeItem.pagesPerBook || 1) / (activeItem.isDoubleSided ? 2 : 1)))).toLocaleString()} ແຜ່ນ
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
