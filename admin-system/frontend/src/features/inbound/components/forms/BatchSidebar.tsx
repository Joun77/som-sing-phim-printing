import React, { useState } from 'react';
import { Layers, Plus, Trash2, X } from 'lucide-react';
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
  onRemoveItemTab,
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  return (
    <div className="w-full lg:w-64 xl:w-72 2xl:w-80 h-full bg-slate-100/70 p-3 sm:p-4 rounded-3xl border border-slate-200/90 flex flex-col justify-between shrink-0 min-h-0">
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

        {/* Add Item Button -> Opens Category Selection Modal */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => setIsAddMenuOpen(true)}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-2xl text-xs font-black flex items-center justify-between transition shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>{currentLang === 'lo' ? 'ເພີ່ມສິນຄ້າໃນຊຸດ (11 ໝວດ)' : 'Add Item to Batch'}</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-extrabold">
              11 ໝວດ
            </span>
          </button>

          {/* Clean Category Picker Modal displaying ALL 11 categories in 2 columns */}
          {isAddMenuOpen && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
              <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-scale-up">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800">
                        {currentLang === 'lo' ? 'ເລືອກປະເພດສິນຄ້າທີ່ຕ້ອງການນຳເຂົ້າ (11 ໝວດ)' : 'Select Category to Add to Inbound (11 Categories)'}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {currentLang === 'lo' ? 'ກົດເລືອກປະເພດວັດສະດຸ ຫຼື ເຄື່ອງຈັກ ເພື່ອກຳນົດສະເປັກ' : 'Click category to add item specifications'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddMenuOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 11 Categories in 2-Column Responsive Grid */}
                <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CATEGORY_MENU_OPTIONS.map((cat) => {
                    const IconComp = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          onAddNewItemTab(cat.id);
                          setIsAddMenuOpen(false);
                        }}
                        className="text-left p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition flex items-start gap-3 cursor-pointer group shadow-2xs hover:shadow-xs"
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${cat.color} group-hover:scale-105 transition-transform`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-black text-xs text-slate-800 group-hover:text-indigo-700">
                            {cat.label}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium line-clamp-2 mt-0.5">
                            {cat.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Item Tab Cards - Independent Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 min-h-0 pt-1">
          {items.map((item, idx) => {
            const isSelected = idx === activeIdx;
            const itemRate = exchangeRates[item.importCurrency] || 1;
            const qty = Number(item.importQty) || 1;
            const rawTotal =
              item.costInputMode === 'TOTAL' && Number(item.totalLotCost) > 0
                ? Number(item.totalLotCost)
                : (Number(item.importCost) || 0) * qty;
            const rowSubtotal = rawTotal * itemRate;

            let label =
              item.paperName ||
              item.inkColorName ||
              item.machineModel ||
              item.machineBrand ||
              item.bindingName ||
              item.laminationName ||
              item.sparePartName ||
              (item.rigidSubstrateType ? `Rigid ${item.rigidSubstrateType}` : null) ||
              (item.packagingCategory ? `Packaging ${item.packagingCategory}` : null) ||
              (item.cuttingSupplyType ? `Cutting ${item.cuttingSupplyType}` : null);

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
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
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
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                      title={currentLang === 'lo' ? 'ລຶບລາຍການນີ້' : 'Delete item'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="font-extrabold text-xs text-slate-800 truncate" title={label}>
                  {label}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] font-semibold text-slate-500">
                  <span>
                    {qty} {item.importUnit}
                  </span>
                  <span className="font-mono font-bold text-indigo-600">
                    {formatCurrency(rowSubtotal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Subtotal */}
      <div className="pt-3 border-t border-slate-200/80 shrink-0 space-y-1">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>{currentLang === 'lo' ? 'ຍອດລວມທັງໝົດໃນຊຸດ' : 'Grand Total'}</span>
        </div>
        <div className="text-base font-black text-indigo-600 font-mono">
          {formatCurrency(grandTotalAllItemsLAK)}
        </div>
      </div>
    </div>
  );
};
