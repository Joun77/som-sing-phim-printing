import React, { useState } from 'react';
import { 
  Calculator, 
  Coins, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  PercentSquare, 
  Truck, 
  Zap, 
  Package, 
  Boxes, 
  FileSpreadsheet, 
  Wrench,
  Sliders,
  AlertTriangle,
  Tag
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
  quotationLaborMode: 'percent' | 'manual';
  setQuotationLaborMode: (mode: 'percent' | 'manual') => void;
  quotationLaborPercent: number;
  setQuotationLaborPercent: (val: number) => void;
  quotationLaborCostManual: number;
  setQuotationLaborCostManual: (val: number) => void;
  quotationSetupFee: number;
  setQuotationSetupFee: (val: number) => void;
  quotationPackagingCost: number;
  setQuotationPackagingCost: (val: number) => void;
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
  quotationLaborMode,
  setQuotationLaborMode,
  quotationLaborPercent,
  setQuotationLaborPercent,
  quotationLaborCostManual,
  setQuotationLaborCostManual,
  quotationSetupFee,
  setQuotationSetupFee,
  quotationPackagingCost,
  setQuotationPackagingCost,
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
  const [isShippingIncluded, setIsShippingIncluded] = useState(shippingFee > 0);
  const [isSetupFeeEnabled, setIsSetupFeeEnabled] = useState(quotationSetupFee > 0);

  const activeMargin = activeItem.profitMargin !== undefined ? Number(activeItem.profitMargin) : 40;
  const activeDiscount = activeItem.discountPercent !== undefined ? Number(activeItem.discountPercent) : 0;
  const isMarginLow = activeMargin < 25.0;

  const handleToggleShipping = (included: boolean) => {
    setIsShippingIncluded(included);
    if (!included) {
      setShippingFee(0);
    } else if (shippingFee === 0) {
      setShippingFee(25000);
    }
  };

  const handleToggleSetupFee = (enabled: boolean) => {
    setIsSetupFeeEnabled(enabled);
    if (!enabled) {
      setQuotationSetupFee(0);
    } else if (quotationSetupFee === 0) {
      setQuotationSetupFee(20000);
    }
  };

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
          <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg font-sans ${
            grandProfitMargin >= 30 ? 'bg-emerald-100 text-emerald-800' : grandProfitMargin >= 25 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
          }`}>
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
            <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
              grandProfitMargin >= 25 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/30 text-rose-300'
            }`}>
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

          {/* Cost & Profit Composition Multi-Segment Bar */}
          <div className="space-y-2 pt-1">
            <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden flex">
              {grandPaperCost > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (grandPaperCost / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                  className="bg-sky-400 h-full transition-all duration-300" 
                  title={`Paper Cost: ${formatCurrency(grandPaperCost)}`}
                />
              )}
              {grandInkCost > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (grandInkCost / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                  className="bg-purple-400 h-full transition-all duration-300" 
                  title={`Ink Cost: ${formatCurrency(grandInkCost)}`}
                />
              )}
              {grandMachCost > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (grandMachCost / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                  className="bg-amber-400 h-full transition-all duration-300" 
                  title={`Machine Depreciation: ${formatCurrency(grandMachCost)}`}
                />
              )}
              {grandPostPressCost > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (grandPostPressCost / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                  className="bg-rose-400 h-full transition-all duration-300" 
                  title={`Post-Press Machinery: ${formatCurrency(grandPostPressCost)}`}
                />
              )}
              {grandFinishingCost > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (grandFinishingCost / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                  className="bg-teal-400 h-full transition-all duration-300" 
                  title={`Consumables: ${formatCurrency(grandFinishingCost)}`}
                />
              )}
              {grandLaborCost > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (grandLaborCost / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                  className="bg-blue-400 h-full transition-all duration-300" 
                  title={`Labor Cost: ${formatCurrency(grandLaborCost)}`}
                />
              )}
              {(grandPackagingCost + quotationSetupFee) > 0 && (
                <div 
                  style={{ width: `${Math.min(100, ((grandPackagingCost + quotationSetupFee) / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                  className="bg-orange-400 h-full transition-all duration-300" 
                  title={`Setup & Packaging: ${formatCurrency(grandPackagingCost + quotationSetupFee)}`}
                />
              )}
              {grandNetProfit > 0 && (
                <div 
                  style={{ width: `${Math.min(100, (grandNetProfit / Math.max(1, finalGrandTotal)) * 100)}%` }} 
                  className="bg-emerald-400 h-full transition-all duration-300" 
                  title={`Net Profit Margin: ${formatCurrency(grandNetProfit)}`}
                />
              )}
            </div>

            {/* Mini Legend for Composition Tabs */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-slate-300 font-medium">
              {grandPaperCost > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span> ເຈ້ຍ ({((grandPaperCost / Math.max(1, finalGrandTotal)) * 100).toFixed(0)}%)
                </span>
              )}
              {grandInkCost > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span> ໝຶກ ({((grandInkCost / Math.max(1, finalGrandTotal)) * 100).toFixed(0)}%)
                </span>
              )}
              {grandMachCost > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> ເຄື່ອງພິມ ({((grandMachCost / Math.max(1, finalGrandTotal)) * 100).toFixed(0)}%)
                </span>
              )}
              {grandPostPressCost > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span> ຫຼັງພິມ ({((grandPostPressCost / Math.max(1, finalGrandTotal)) * 100).toFixed(0)}%)
                </span>
              )}
              {grandFinishingCost > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-400"></span> ສິ້ນເປືອງ ({((grandFinishingCost / Math.max(1, finalGrandTotal)) * 100).toFixed(0)}%)
                </span>
              )}
              {grandLaborCost > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span> ແຮງງານ ({((grandLaborCost / Math.max(1, finalGrandTotal)) * 100).toFixed(0)}%)
                </span>
              )}
              {(grandPackagingCost + quotationSetupFee) > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span> ຕັ້ງຄ່າ/ຫຸ້ມຫໍ່ ({(((grandPackagingCost + quotationSetupFee) / Math.max(1, finalGrandTotal)) * 100).toFixed(0)}%)
                </span>
              )}
              {grandNetProfit > 0 && (
                <span className="flex items-center gap-1 font-bold text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> ກຳໄລ ({((grandNetProfit / Math.max(1, finalGrandTotal)) * 100).toFixed(0)}%)
                </span>
              )}
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 🌟 1. ตารางต้นทุนและราคาขายแต่ละรายการ (Multi-Items Breakdown Table)       */}
        {/* ========================================================================= */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-accent-sky" />
              <span>1. ຕາຕະລາງຕົ້ນທຶນ & ລາຄາຂາຍແຕ່ລະລາຍການ:</span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold font-sans">
              {items.length} ລາຍການ
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5 sm:p-3">ລາຍການ</th>
                  <th className="p-2.5 sm:p-3 text-right">ຈຳນວນ</th>
                  <th className="p-2.5 sm:p-3 text-right">ຕົ້ນທຶນ/ຫົວ</th>
                  <th className="p-2.5 sm:p-3 text-right">ລາຄາຂາຍ</th>
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
                      <td className="p-2.5 sm:p-3 text-right text-emerald-600 font-bold">{formatCurrency(calc.sellingPrice || 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🌟 2. ລາຍລະອຽດຕົ້ນທຶນແຍກໝວດ (Detailed Cost Breakdown)                      */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsCostDetailsOpen(!isCostDetailsOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer text-left select-none bg-white"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">
                2. ລາຍລະອຽດຕົ້ນທຶນແຍກໝວດ (Cost Breakdown)
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
                  label: '1. ຕົ້ນທຶນເຈ້ຍ (Paper)', 
                  sublabel: 'Paper Substrate FIFO', 
                  value: grandPaperCost, 
                  color: 'bg-sky-500', 
                  active: true 
                },
                { 
                  label: '2. ຕົ້ນທຶນການພິມ & ໝຶກ (Printing & Ink)', 
                  sublabel: 'Ink Consumed + Machine Wear', 
                  value: grandInkCost + grandMachCost, 
                  color: 'bg-purple-500', 
                  active: true 
                },
                { 
                  label: '3. ເຄື່ອງຈັກຫຼັງພິມ (Post-Press)', 
                  sublabel: 'Machinery Finishing', 
                  value: grandPostPressCost, 
                  color: 'bg-amber-500', 
                  active: true 
                },
                { 
                  label: '4. ວັດຖຸດິບຫຼັງພິມ (Consumables)', 
                  sublabel: 'Staples, Wires, Materials', 
                  value: grandFinishingCost, 
                  color: 'bg-emerald-500', 
                  active: true 
                },
                { 
                  label: '5. ຄ່າແຮງງານຊ່າງ (Labor)', 
                  sublabel: 'Order-level Batch Operations', 
                  value: grandLaborCost - quotationSetupFee, 
                  color: 'bg-blue-500', 
                  active: true 
                },
                ...(quotationSetupFee > 0 ? [{ 
                  label: '6. ຄ່າຕັ້ງເຄື່ອງ & ກຽມງານ (Setup Fee)', 
                  sublabel: 'Make-Ready & Pre-run', 
                  value: quotationSetupFee, 
                  color: 'bg-indigo-500', 
                  active: true 
                }] : []),
                { 
                  label: `${quotationSetupFee > 0 ? '7' : '6'}. ບັນຈຸພັນ & ຂົນສົ່ງ (Packaging & Logistics)`, 
                  sublabel: 'Box Materials & Courier', 
                  value: grandPackagingCost, 
                  color: 'bg-slate-500', 
                  active: true 
                },
              ].map((row, idx) => (
                <div key={idx} className="flex justify-between items-center px-4 py-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${row.color}`}></span>
                    <div>
                      <div className="text-xs font-semibold text-slate-700">{row.label}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{row.sublabel}</div>
                    </div>
                  </div>
                  <span className="text-xs font-black font-sans text-slate-800">
                    {formatCurrency(row.value)}
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

        {/* ========================================================================= */}
        {/* 🌟 3. ຄ່າແຮງງານຊ່າງ (Labor Cost - Segmented % vs Custom LAK)                */}
        {/* ========================================================================= */}
        <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>3. ຄ່າແຮງງານຊ່າງ ({activeItem.name})</span>
            </span>

            {/* Segmented Mode Control: % vs Custom LAK */}
            <div className="flex bg-white p-0.5 rounded-lg border border-blue-200 gap-1 text-[10px] font-bold shadow-2xs">
              <button
                type="button"
                onClick={() => setQuotationLaborMode('percent')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  quotationLaborMode === 'percent'
                    ? 'bg-blue-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                % ຕົ້ນທຶນ
              </button>
              <button
                type="button"
                onClick={() => setQuotationLaborMode('manual')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  quotationLaborMode === 'manual'
                    ? 'bg-blue-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ກຳນົດ LAK
              </button>
            </div>
          </div>

          {quotationLaborMode === 'percent' ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-bold">ອັດຕາຄ່າແຮງງານ (% ຂອງວັດສະດຸ/ເຄື່ອງຈັກ):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={quotationLaborPercent}
                    onChange={(e) => setQuotationLaborPercent(Math.max(0, Number(e.target.value)))}
                    className="w-16 px-2 py-1 bg-white border border-blue-300 rounded-lg text-right font-black font-sans text-blue-950 text-xs shadow-2xs focus:outline-none focus:border-blue-500"
                  />
                  <span className="font-bold text-blue-900">%</span>
                </div>
              </div>

              {/* Quick % Presets */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '5% (ເບົາໆ)', val: 5 },
                  { label: '10% (ມາດຕະຖານ)', val: 10 },
                  { label: '15% (ແນະນຳ)', val: 15 },
                  { label: '20% (ງານລະອຽດ)', val: 20 },
                  { label: '25% (ພຣີມຽມ)', val: 25 },
                ].map((chip) => (
                  <button
                    key={chip.val}
                    type="button"
                    onClick={() => setQuotationLaborPercent(chip.val)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      quotationLaborPercent === chip.val
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-blue-900 border border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-bold">ກຳນົດຄ່າແຮງງານເອງ (LAK):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={quotationLaborCostManual}
                    onChange={(e) => setQuotationLaborCostManual(Math.max(0, Number(e.target.value)))}
                    className="w-28 px-2 py-1 bg-white border border-blue-300 rounded-lg text-right font-black font-mono text-blue-950 text-xs shadow-2xs focus:outline-none focus:border-blue-500"
                  />
                  <span className="font-bold text-blue-900">₭</span>
                </div>
              </div>

              {/* Quick Cash Presets */}
              <div className="flex flex-wrap gap-1.5">
                {[10000, 25000, 50000, 100000, 200000].map((cash) => (
                  <button
                    key={cash}
                    type="button"
                    onClick={() => setQuotationLaborCostManual(cash)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      quotationLaborCostManual === cash
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cash.toLocaleString()} ₭
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 🌟 3.1 ค่าตั้งเครื่องและเตรียมงานรวม (Machine Setup Fee - Toggle Switch) */}
        {/* ========================================================================= */}
        <div className="p-3.5 bg-indigo-50/50 border border-indigo-200/80 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-indigo-600" />
              <span>ຄ່າຕັ້ງເຄື່ອງ & ກຽມງານ (Setup Fee)</span>
            </span>

            {/* Modern Toggle Switch (ດັອກກີ້ສະວິດ) */}
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold select-none transition ${isSetupFeeEnabled ? 'text-indigo-900 font-black' : 'text-slate-400'}`}>
                {isSetupFeeEnabled ? 'ເປີດໃຊ້' : 'ປິດ'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isSetupFeeEnabled}
                onClick={() => handleToggleSetupFee(!isSetupFeeEnabled)}
                className={`w-10 h-5.5 rounded-full transition-colors relative p-0.5 focus:outline-none cursor-pointer shadow-inner ${
                  isSetupFeeEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                    isSetupFeeEnabled ? 'translate-x-4.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {isSetupFeeEnabled ? (
            <div className="space-y-2 pt-1 border-t border-indigo-100 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-bold">ລະບຸຄ່າຕັ້ງເຄື່ອງ (LAK):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={quotationSetupFee}
                    onChange={(e) => setQuotationSetupFee(Math.max(0, Number(e.target.value)))}
                    className="w-28 px-2.5 py-1 bg-white border border-indigo-300 rounded-lg text-right font-bold font-mono text-indigo-950 text-xs"
                  />
                  <span className="font-bold text-indigo-900">₭</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[10000, 20000, 50000, 100000].map((fee) => (
                  <button
                    key={fee}
                    type="button"
                    onClick={() => setQuotationSetupFee(fee)}
                    className={`px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer ${
                      quotationSetupFee === fee
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    {fee.toLocaleString()} ₭
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 font-medium">
              ປິດການຄິດຄ່າຕັ້ງເຄື່ອງ (ເໝາະສຳລັບງານພິມດິຈິຕອນທົ່ວໄປທີ່ບໍ່ມີການເຊັດອັບຍາກ)
            </p>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 🌟 4. กล่องบรรจุภัณฑ์ & ค่าขนส่งรวม (Packaging & Logistics)               */}
        {/* ========================================================================= */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-600" />
              <span>4. ກ່ອງບັນຈຸພັນ & ຂົນສົ່ງລວມ (Packaging & Shipping)</span>
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-bold flex items-center gap-1">
                  <Boxes className="w-3 h-3 text-slate-500" />
                  <span>ຄ່າກ່ອງ / ວັດສະດຸບັນຈຸພັນ:</span>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={quotationPackagingCost}
                    onChange={(e) => setQuotationPackagingCost(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right font-mono font-bold text-xs"
                  />
                  <span className="font-bold text-slate-600">₭</span>
                </div>
              </div>
            </div>

            {/* Shipping Toggle */}
            <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-bold flex items-center gap-1">
                  <Truck className="w-3 h-3 text-slate-500" />
                  <span>ຄ່າຈັດສົ່ງ (Courier Fee):</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold select-none transition ${isShippingIncluded ? 'text-slate-900 font-black' : 'text-slate-400'}`}>
                    {isShippingIncluded ? 'ເປີດໃຊ້' : 'ປິດ'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isShippingIncluded}
                    onClick={() => handleToggleShipping(!isShippingIncluded)}
                    className={`w-10 h-5.5 rounded-full transition-colors relative p-0.5 focus:outline-none cursor-pointer shadow-inner ${
                      isShippingIncluded ? 'bg-slate-900' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                        isShippingIncluded ? 'translate-x-4.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {isShippingIncluded && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-500 text-[11px]">ລະບຸຄ່າຈັດສົ່ງ:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      value={shippingFee}
                      onChange={(e) => setShippingFee(Math.max(0, Number(e.target.value)))}
                      className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right font-mono font-bold text-xs"
                    />
                    <span className="font-bold text-slate-600">₭</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🌟 5. ອັດຕາກຳໄລ & ສ່ວນຫຼຸດ (Target Profit Margin & Pricing Studio)        */}
        {/* ========================================================================= */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              <span>5. ອັດຕາກຳໄລ & ສ່ວນຫຼຸດ ({activeItem.name})</span>
            </span>
            <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg font-sans ${
              activeMargin >= 35 ? 'bg-emerald-600 text-white' : activeMargin >= 25 ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'
            }`}>
              {activeMargin}% Margin
            </span>
          </div>

          {/* Margin Slider & Number Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-bold">ອັດຕາກຳໄລເປົ້າໝາຍ (Target Profit Margin):</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={activeMargin}
                  onChange={(e) => updateActiveItem({ profitMargin: Math.max(0, Math.min(95, Number(e.target.value))) })}
                  className="w-16 px-2 py-1 bg-white border border-emerald-300 rounded-lg text-right font-black font-sans text-emerald-950 text-xs shadow-2xs focus:outline-none focus:border-emerald-500"
                />
                <span className="font-bold text-emerald-900">%</span>
              </div>
            </div>

            {/* Slider Track */}
            <input
              type="range"
              min="0"
              max="80"
              step="1"
              value={activeMargin}
              onChange={(e) => updateActiveItem({ profitMargin: Number(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />

            {/* Quick Margin Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: '20% (ຕ່ຳ)', val: 20 },
                { label: '30% (ມາດຕະຖານ)', val: 30 },
                { label: '40% (ແນະນຳ)', val: 40 },
                { label: '50% (ສູງ)', val: 50 },
                { label: '60% (ພຣີມຽມ)', val: 60 },
              ].map((m) => (
                <button
                  key={m.val}
                  type="button"
                  onClick={() => updateActiveItem({ profitMargin: m.val })}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    activeMargin === m.val
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Margin Guard Notice if < 25% */}
            {isMarginLow && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-[11px] animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Margin Guard Alert:</span>
                  <span>ອັດຕາກຳໄລຕ່ຳກວ່າ 25% ລະບົບຈະຮຽກຮ້ອງການອະນຸມັດພິເສດຈາກຫົວໜ້າ (Manager Approval Required)</span>
                </div>
              </div>
            )}
          </div>

          {/* Discount Field */}
          <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-bold flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span>ສ່ວນຫຼຸດລູກຄ້າ (Discount):</span>
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="50"
                value={activeDiscount}
                onChange={(e) => updateActiveItem({ discountPercent: Math.max(0, Math.min(50, Number(e.target.value))) })}
                className="w-16 px-2 py-1 bg-white border border-emerald-300 rounded-lg text-right font-black font-sans text-slate-800 text-xs shadow-2xs focus:outline-none focus:border-emerald-500"
              />
              <span className="font-bold text-slate-600">%</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onProceedToQuote}
            className="w-full py-3.5 bg-gradient-to-r from-accent-sky to-sky-600 hover:from-sky-500 hover:to-sky-700 text-white rounded-2xl font-black text-sm transition-all shadow-md shadow-sky-500/25 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>ອອກໃບສະເໜີລາຄາ (Generate Official Quote)</span>
            <span className="text-lg">→</span>
          </button>
          
          <button
            type="button"
            onClick={onSaveDraft}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            💾 ບັນທຶກສະບັບຮ່າງ (Save Draft)
          </button>
        </div>

      </div>
    </div>
  );
};
