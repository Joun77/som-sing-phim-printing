import React, { useState } from 'react';
import { Layers, Plus, ChevronDown, Trash2 } from 'lucide-react';
import { InboundItemFormData, CATEGORY_MENU_OPTIONS } from './types';

interface BatchSidebarProps {
  items: InboundItemFormData[];
  activeIdx: number;
  currentLang: string;
  exchangeRates: Record<string, number>;
  grandTotalAllItemsLAK: number;
  formatCurrency: (val: number) => string;
  onSelectTab: (idx: number) => void;
  onAddNewItemTab: (type: string) => void;
  onRemoveItemTab: (idx: number) => void;
}

export const BatchSidebar: React.FC<BatchSidebarProps> = ({
  items,
  activeIdx,
  currentLang,
  exchangeRates,
  grandTotalAllItemsLAK,
  formatCurrency,
  onSelectTab,
  onAddNewItemTab,
  onRemoveItemTab
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  return (
    <div className="w-full lg:w-80 h-full bg-slate-100/70 p-4 rounded-3xl border border-slate-200/90 flex flex-col justify-between shrink-0 overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
              {currentLang === 'lo' ? 'ລາຍການໃນຊຸດ' : 'Batch Items'}
            </h4>
          </div>
          <span className="text-[11px] font-black bg-indigo-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
            {items.length} {currentLang === 'lo' ? 'ລາຍການ' : 'items'}
          </span>
        </div>

        {/* Dropdown Add Button (No duplicate plus symbol) */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-2xl text-xs font-black flex items-center justify-between transition shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>{currentLang === 'lo' ? 'ເພີ່ມສິນຄ້າໃນຊຸດ' : 'Add Item to Batch'}</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isAddMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Floating Dropdown Menu with Lucide Icons (No emojis) */}
          {isAddMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xl space-y-1 animate-fade-in max-h-80 overflow-y-auto">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2.5 py-1 block">
                {currentLang === 'lo' ? 'ເລືອກປະເພດສິນຄ້າທີ່ຕ້ອງການເພີ່ມ:' : 'Select Category to Add:'}
              </span>
              {CATEGORY_MENU_OPTIONS.map(cat => {
                const IconComp = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onAddNewItemTab(cat.id);
                      setIsAddMenuOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-indigo-950 transition flex items-center gap-3 cursor-pointer group"
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-extrabold text-xs text-slate-800 group-hover:text-indigo-700">{cat.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal truncate">{cat.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Item Tab Cards - Independent Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 min-h-0 pt-1">
          {items.map((item, idx) => {
            const isSelected = idx === activeIdx;
            const itemRate = exchangeRates[item.importCurrency] || 1;
            const rowSubtotal = (Number(item.importCost) || 0) * (Number(item.importQty) || 1) * itemRate;
            
            let label = item.paperName || item.inkColorName || item.printerModel || item.machineryName || item.bindingName || item.laminationName || item.sparePartName || item.offcutName;
            if (!label) label = `${item.importType} Item #${idx + 1}`;

            return (
              <div
                key={item.id || idx}
                onClick={() => onSelectTab(idx)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-white/70 hover:bg-white border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {item.importType}
                    </span>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItemTab(idx);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete Tab"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="truncate font-extrabold text-xs text-slate-800">
                  {label}
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1.5 border-t border-slate-100">
                  <span>{item.importQty} {item.importUnit}</span>
                  <span className="text-slate-900 font-extrabold">{formatCurrency(rowSubtotal)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Batch Grand Summary */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-1 shrink-0 mt-3 shadow-md">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
          {currentLang === 'lo' ? 'ຍອດລວມທັງໝົດໃນຊຸດ' : 'Batch Grand Total'}
        </span>
        <div className="text-base font-black text-emerald-400">
          {formatCurrency(grandTotalAllItemsLAK)}
        </div>
      </div>
    </div>
  );
};
