import React, { useState } from 'react';
import { 
  Calculator, 
  Coins, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  AlertTriangle, 
  PercentSquare, 
  Truck, 
  Save, 
  ArrowRight 
} from 'lucide-react';

export interface QuotationCostSummarySidebarProps {
  items: any[];
  calculatedItems: any[];
  activeItemIndex: number;
  setActiveItemIndex: (idx: number) => void;
  activeItem: any;
  updateActiveItem: (patch: any) => void;
  selectedCustomerId: string;
  grandTotalUnits: number;
  grandNetCost: number;
  grandNetProfit: number;
  grandProfitMargin: number;
  grandPaperCost: number;
  grandInkCost: number;
  grandMachCost: number;
  grandPostPressCost: number;
  grandFinishingCost: number;
  grandLaborCost: number;
  grandPackagingCost: number;
  finalGrandTotal: number;
  taxMode: string;
  setTaxMode: (mode: any) => void;
  taxRate: number;
  setTaxRate: (rate: number) => void;
  shippingMethod: string;
  setShippingMethod: (method: string) => void;
  shippingFee: number;
  setShippingFee: (fee: number) => void;
  currentLang: string;
  formatCurrency: (val: number) => string;
  onSaveDraft: () => void;
  onProceedToQuote: () => void;
}

export const QuotationCostSummarySidebar: React.FC<QuotationCostSummarySidebarProps> = ({
  items,
  calculatedItems,
  activeItemIndex,
  setActiveItemIndex,
  activeItem,
  updateActiveItem,
  selectedCustomerId,
  grandTotalUnits,
  grandNetCost,
  grandNetProfit,
  grandProfitMargin,
  grandPaperCost,
  grandInkCost,
  grandMachCost,
  grandPostPressCost,
  grandFinishingCost,
  grandLaborCost,
  grandPackagingCost,
  finalGrandTotal,
  taxMode,
  setTaxMode,
  taxRate,
  setTaxRate,
  shippingMethod,
  setShippingMethod,
  shippingFee,
  setShippingFee,
  currentLang,
  formatCurrency,
  onSaveDraft,
  onProceedToQuote,
}) => {
  const [isCostDetailsOpen, setIsCostDetailsOpen] = useState(false);

  return (
    <div className="space-y-4 sticky top-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        
        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800">
                ສະຫຼຸບຕົ້ນທຶນ & ລາຄາຂາຍລວມ
              </h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                {items.length} Items • {grandTotalUnits.toLocaleString()} Total Units
              </p>
            </div>
          </div>
          <span className="text-[11px] font-black px-2.5 py-1 bg-primary-navy/10 text-primary-navy rounded-lg font-sans">
            Margin {grandProfitMargin.toFixed(1)}%
          </span>
        </div>

        {/* Grand Total Hero Display */}
        <div className="bg-gradient-to-br from-primary-navy to-slate-900 text-white p-5 rounded-2xl space-y-3 shadow-md">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              ລາຄາຂາຍລວມທັງໝົດ:
            </span>
            <span className="text-[11px] text-emerald-400 font-black px-2 py-0.5 bg-emerald-500/20 rounded-md">
              + {formatCurrency(grandNetProfit)} ({grandProfitMargin.toFixed(1)}%)
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-black font-sans text-white tracking-tight">
            {formatCurrency(finalGrandTotal)}
          </div>

          <div className="text-xs text-slate-300 flex justify-between pt-2 border-t border-white/10 font-sans">
            <span>ຕົ້ນທຶນລວມ (Total Cost):</span>
            <span className="font-bold text-slate-100">{formatCurrency(grandNetCost)}</span>
          </div>

          {/* Cost Composition Mini Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden flex">
              {grandPaperCost > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (grandPaperCost / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                  className="bg-sky-500 h-full" 
                  title={`Paper: ${formatCurrency(grandPaperCost)}`} 
                />
              )}
              {grandInkCost > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (grandInkCost / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                  className="bg-purple-500 h-full" 
                  title={`Ink: ${formatCurrency(grandInkCost)}`} 
                />
              )}
              {grandMachCost > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (grandMachCost / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                  className="bg-amber-500 h-full" 
                  title={`Machine: ${formatCurrency(grandMachCost)}`} 
                />
              )}
              {grandPostPressCost > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (grandPostPressCost / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                  className="bg-orange-500 h-full" 
                  title={`Post-Press: ${formatCurrency(grandPostPressCost)}`} 
                />
              )}
              {grandFinishingCost > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (grandFinishingCost / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                  className="bg-emerald-500 h-full" 
                  title={`Finishing Consumables: ${formatCurrency(grandFinishingCost)}`} 
                />
              )}
              {grandLaborCost > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (grandLaborCost / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                  className="bg-blue-500 h-full" 
                  title={`Labor: ${formatCurrency(grandLaborCost)}`} 
                />
              )}
              {grandPackagingCost > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (grandPackagingCost / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                  className="bg-slate-400 h-full" 
                  title={`Packaging: ${formatCurrency(grandPackagingCost)}`} 
                />
              )}
              {grandNetProfit > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (grandNetProfit / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                  className="bg-teal-400 h-full" 
                  title={`Profit: ${formatCurrency(grandNetProfit)}`} 
                />
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-[9px] text-slate-400 font-bold justify-between pt-0.5">
              {grandPaperCost > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>ເຈ້ຍ</span>}
              {grandInkCost > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>ໝຶກ</span>}
              {grandMachCost > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>ເຄື່ອງພິມ</span>}
              {grandPostPressCost > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>ຫຼັງພິມ</span>}
              {grandFinishingCost > 0 && <span className="flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>ວັດຖຸດິບຫຼັງພິມ</span>}
              {grandLaborCost > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>ຄ່າແຮງ</span>}
              {grandPackagingCost > 0 && <span className="flex items-center gap-1 text-slate-300"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>ຂົນສົ່ງ</span>}
              <span className="flex items-center gap-1 text-teal-300"><span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>ກຳໄລ</span>
            </div>
          </div>
        </div>

        {/* All Items Cost Summary Table */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            ຕາຕະລາງຕົ້ນທຶນທຸກລາຍການສິນຄ້າ:
          </span>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5 sm:p-3">ລາຍການ</th>
                  <th className="p-2.5 sm:p-3 text-right">ຈຳນວນ</th>
                  <th className="p-2.5 sm:p-3 text-right">ຕົ້ນທຶນ/ຫົວ</th>
                  <th className="p-2.5 sm:p-3 text-right">ຕົ້ນທຶນລວມ</th>
                  <th className="p-2.5 sm:p-3 text-right">ລາຄາຂາຍລວມ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {items.map((item, idx) => {
                  const calc = calculatedItems[idx] || {};
                  const isAct = idx === activeItemIndex;
                  return (
                    <tr 
                      key={item.id || idx} 
                      onClick={() => setActiveItemIndex(idx)}
                      className={`cursor-pointer transition ${isAct ? 'bg-primary-navy/8 font-black text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <td className="p-2.5 sm:p-3 truncate max-w-[85px] sm:max-w-[120px] lg:max-w-[100px] xl:max-w-[130px] 2xl:max-w-[180px]">
                        {idx + 1}. {item.name}
                      </td>
                      <td className="p-2.5 sm:p-3 text-right">{item.printVolume}</td>
                      <td className="p-2.5 sm:p-3 text-right">{formatCurrency(calc.unitCost || 0)}</td>
                      <td className="p-2.5 sm:p-3 text-right text-orange-600 font-bold">{formatCurrency(calc.netCost || 0)}</td>
                      <td className="p-2.5 sm:p-3 text-right text-emerald-600 font-bold">{formatCurrency(calc.sellingPrice || 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Cost Inspector */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsCostDetailsOpen(!isCostDetailsOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer text-left select-none bg-white"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">
                ລາຍລະອຽດຕົ້ນທຶນແຍກໝວດ
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800 font-sans">
                {formatCurrency(grandNetCost)}
              </span>
              {isCostDetailsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </button>

          {isCostDetailsOpen && (
            <div className="bg-slate-50 border-t border-slate-200 divide-y divide-slate-100 animate-fade-in">
              {[
                { 
                  label: '1. ຂໍ້ມູນລູກຄ້າ (Customer)', 
                  sublabel: selectedCustomerId || 'General Customer', 
                  value: 0, 
                  isFree: true,
                  freeText: 'ບໍ່ມີຄ່າບໍລິການ',
                  color: 'bg-indigo-500', 
                  active: true 
                },
                { 
                  label: '2. ຈຳນວນຜະລິດ (Quantity)', 
                  sublabel: `${(activeItem.printVolume || 0).toLocaleString()} ຫົວ (${items.length} ລາຍການ)`, 
                  value: 0, 
                  isFree: true,
                  freeText: 'ຂໍ້ມູນພື້ນຖານ',
                  color: 'bg-emerald-500', 
                  active: true 
                },
                { 
                  label: '3. ຕົ້ນທຶນເຈ້ຍ (Paper)', 
                  sublabel: 'Paper Substrate FIFO', 
                  value: grandPaperCost, 
                  color: 'bg-sky-500', 
                  active: activeItem.activeModules?.paper !== false 
                },
                { 
                  label: '4. ຕົ້ນທຶນການພິມ & ໝຶກ (Printing & Ink)', 
                  sublabel: 'Ink Consumed + Machine Wear', 
                  value: grandInkCost + grandMachCost, 
                  color: 'bg-purple-500', 
                  active: activeItem.activeModules?.printEngine !== false 
                },
                { 
                  label: '5. ຄ່າເຄື່ອງຈັກຫຼັງພິມ (Post-Press)', 
                  sublabel: 'Post-Press Machinery Asset', 
                  value: grandPostPressCost, 
                  color: 'bg-amber-500', 
                  active: activeItem.activeModules?.postPressMachinery !== false 
                },
                { 
                  label: '6. ວັດຖຸດິບຫຼັງພິມ (Consumables)', 
                  sublabel: 'Staples / Glue / Film / Wire-O', 
                  value: grandFinishingCost, 
                  color: 'bg-emerald-500', 
                  active: activeItem.activeModules?.finishingMaterials !== false 
                },
                { 
                  label: '7. ຄ່າແຮງງານ & ຕັ້ງເຄື່ອງ (Labor & Setup)', 
                  sublabel: 'Labor / Machine Setup', 
                  value: grandLaborCost, 
                  color: 'bg-blue-500', 
                  active: activeItem.activeModules?.laborAndSetup !== false 
                },
                { 
                  label: '8. ບັນຈຸພັນ & ຂົນສົ່ງ (Packaging & Delivery)', 
                  sublabel: 'Boxes, Wrapping & Logistics', 
                  value: grandPackagingCost, 
                  color: 'bg-slate-500', 
                  active: activeItem.activeModules?.packagingDelivery !== false 
                },
              ].filter(row => row.active || row.value > 0).map((row) => (
                <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${row.color}`}></span>
                    <div>
                      <div className="text-xs font-semibold text-slate-700">{row.label}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{row.sublabel}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-black font-sans ${row.isFree ? 'text-slate-400 font-normal italic text-[11px]' : 'text-slate-800'}`}>
                    {row.isFree ? row.freeText : formatCurrency(row.value)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center px-4 py-3 bg-slate-100">
                <span className="text-xs font-black text-slate-800">ລວມຕົ້ນທຶນສຸດທິ</span>
                <span className="text-sm font-black text-primary-navy font-sans">{formatCurrency(grandNetCost)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Profit Margin Slider */}
        <div className="space-y-3 bg-white border border-slate-200 p-4 rounded-2xl">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              ອັດຕາກຳໄລ
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-primary-navy font-sans leading-none">{activeItem.profitMargin || 40}%</span>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="200"
            step="5"
            value={activeItem.profitMargin || 40}
            onChange={(e) => updateActiveItem({ profitMargin: Number(e.target.value) })}
            className="w-full accent-primary-navy cursor-pointer h-1.5"
          />

          <div className="flex flex-wrap gap-1.5">
            {[
              { label: '25%', sub: 'Min', val: 25 },
              { label: '35%', sub: 'Std', val: 35 },
              { label: '45%', sub: 'Rec', val: 45, recommended: true },
              { label: '55%', sub: 'High', val: 55 },
              { label: '65%', sub: 'Prem', val: 65 },
            ].map(chip => (
              <button
                key={chip.val}
                type="button"
                onClick={() => updateActiveItem({ profitMargin: chip.val })}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer text-center ${
                  activeItem.profitMargin === chip.val
                    ? 'bg-primary-navy text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <div>{chip.label}</div>
                <div className={`text-[9px] font-bold ${activeItem.profitMargin === chip.val ? 'text-white/70' : 'text-slate-400'}`}>{chip.sub}</div>
              </button>
            ))}
          </div>

          {grandProfitMargin < 25.0 && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-black">Margin Guard Alert (&lt; 25%)</div>
                <div className="text-[10px] text-amber-700 font-normal mt-0.5">
                  {currentLang === 'lo' 
                    ? 'ກຳໄລຕ່ຳກວ່າ 25% ລະບົບຈະກຳນົດສະຖານະ REQUIRES_MANAGER_APPROVAL'
                    : 'Margin under 25% — requires Manager Approval.'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tax & Logistics Settings */}
        <div className="space-y-2.5 pt-2 border-t border-slate-200 text-xs">
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-600 font-bold flex items-center gap-1.5">
              <PercentSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>ພາສີ (Tax / VAT)</span>
            </span>
            <div className="flex items-center gap-2">
              <select
                value={taxMode}
                onChange={(e) => setTaxMode(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none"
              >
                <option value="none">ບໍ່ມີພາສີ (0%)</option>
                <option value="percent">ເປີເຊັນ (%)</option>
              </select>
              {taxMode === 'percent' && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-14 bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-right text-xs font-bold text-slate-800 font-sans focus:outline-none"
                  />
                  <span className="text-slate-500">%</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-600 font-bold flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-slate-500" />
              <span>ຄ່າຂົນສົ່ງ (Shipping)</span>
            </span>
            <div className="flex items-center gap-2">
              <select
                value={shippingMethod}
                onChange={(e) => setShippingMethod(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-800 font-bold max-w-[140px] focus:outline-none"
              >
                <option value="In-Store Pickup">ຮັບເອງທີ່ຮ້ານ</option>
                <option value="Anousith Express">Anousith Express</option>
                <option value="HAL Logistics">HAL Logistics</option>
                <option value="Mixay Express">Mixay Express</option>
                <option value="Direct Delivery">ສົ່ງຕົງ</option>
                <option value="Custom">ອື່ນໆ (Custom)</option>
              </select>
              <input
                type="number"
                step="1000"
                min="0"
                value={shippingFee}
                onChange={(e) => setShippingFee(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-20 bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-right text-xs font-bold text-slate-800 font-sans focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons: Save Draft & Generate Quotation */}
        <div className="pt-2 space-y-2.5">
          <button
            type="button"
            onClick={onSaveDraft}
            className="w-full py-3.5 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2.5 transition-all transform active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>{currentLang === 'lo' ? 'ບັນທຶກສະບັບຮ່າງ (Save Draft)' : 'Save as Draft'}</span>
          </button>

          <button
            type="button"
            onClick={onProceedToQuote}
            className="w-full py-3 px-5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
          >
            <span>{currentLang === 'lo' ? 'ກວດສອບ & ອອກໃບສະເໜີລາຄາ →' : 'Review & Generate Quote →'}</span>
            <ArrowRight className="w-4 h-4 text-emerald-600" />
          </button>
        </div>

      </div>
    </div>
  );
};
