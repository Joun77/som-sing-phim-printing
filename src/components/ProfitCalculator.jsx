import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { 
  Calculator, 
  HelpCircle, 
  Percent, 
  ShieldAlert, 
  ShieldCheck,
  Coins,
  AlertTriangle,
  Info,
  Sliders,
  Scissors,
  Check,
  DollarSign
} from 'lucide-react';

export default function ProfitCalculator() {
  const { inventory, equipment, getFIFOCostPerSheet } = useApp();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const papers = inventory.filter(item => item.category === 'Paper');
  const inks = inventory.filter(item => item.category === 'Ink');

  // Input states
  const [selectedPaperId, setSelectedPaperId] = useState(papers[0]?.id || '');
  const [inkCoverage, setInkCoverage] = useState('0.3');
  const [inkPriceId, setInkPriceId] = useState(inks[0]?.id || '');
  const [spoilageRate, setSpoilageRate] = useState(5);
  const [printVolume, setPrintVolume] = useState(100);
  const [selectedMachineIds, setSelectedMachineIds] = useState(['eq-konica']);
  const [sellingPrice, setSellingPrice] = useState(3000);

  // Cost overrides & safeguards
  const [isOverrideEnabled, setIsOverrideEnabled] = useState(false);
  const [overridePaperCost, setOverridePaperCost] = useState(150);
  const [marginThreshold, setMarginThreshold] = useState(30);

  // Finishing Options
  const [hasLamination, setHasLamination] = useState(false);
  const [hasDieCut, setHasDieCut] = useState(false);
  const [hasFolding, setHasFolding] = useState(false);
  const [bindingType, setBindingType] = useState('none');

  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num).replace('LAK', '₭');
  };

  let volumeDiscountPercent = 0;
  if (printVolume >= 500) {
    volumeDiscountPercent = 15;
  } else if (printVolume >= 100) {
    volumeDiscountPercent = 5;
  }

  // Base Paper Cost calculation (using FIFO or override)
  const selectedPaper = inventory.find(i => i.id === selectedPaperId);
  const baseFifoPaperCost = selectedPaper 
    ? getFIFOCostPerSheet(selectedPaper.id, printVolume) 
    : 0;

  // Apply volume discount to paper cost
  const fifoPaperCost = baseFifoPaperCost * (1 - volumeDiscountPercent / 100);

  const paperUnitCost = isOverrideEnabled 
    ? Number(overridePaperCost) 
    : fifoPaperCost;

  // Ink calculations
  const selectedInkItem = inventory.find(i => i.id === inkPriceId);
  const inkUnitCost = selectedInkItem ? selectedInkItem.costPerConsumptionUnit : 1200;
  const inkCostPerPage = Number(inkCoverage) * inkUnitCost;

  // Finishing cost additions
  let finishingCostPerPage = 0;
  if (hasLamination) finishingCostPerPage += 500;
  if (hasDieCut) finishingCostPerPage += 300;
  if (hasFolding) finishingCostPerPage += 100;

  let flatBindingCost = 0;
  if (bindingType === 'staple') flatBindingCost = 2000;
  else if (bindingType === 'spiral') flatBindingCost = 10000;
  else if (bindingType === 'glue') flatBindingCost = 15000;

  // Spoilage calculation
  const materialUnitCost = paperUnitCost + inkCostPerPage + finishingCostPerPage;
  const spoilageUnitCost = materialUnitCost * (Number(spoilageRate) / 100);

  // Depreciation
  const depreciationPerPage = selectedMachineIds.reduce((sum, id) => {
    const eq = equipment.find(e => e.id === id);
    return sum + (eq ? eq.calculatedCostPerPage : 0);
  }, 0);

  // Totals
  const totalUnitCost = materialUnitCost + spoilageUnitCost + depreciationPerPage;
  const totalJobCost = (totalUnitCost * printVolume) + flatBindingCost;
  const totalJobRevenue = sellingPrice * printVolume;
  const totalJobProfit = totalJobRevenue - totalJobCost;
  const profitMarginPercent = totalJobRevenue > 0 ? (totalJobProfit / totalJobRevenue) * 100 : 0;

  // Breakdown costs
  const paperTotalCost = paperUnitCost * printVolume;
  const inkTotalCost = inkCostPerPage * printVolume;
  const finishingTotalCost = (finishingCostPerPage * printVolume) + flatBindingCost;
  const spoilageTotalCost = spoilageUnitCost * printVolume;
  const depreciationTotalCost = depreciationPerPage * printVolume;

  const isMarginViolated = profitMarginPercent < Number(marginThreshold);

  const handleMachineToggle = (id) => {
    if (selectedMachineIds.includes(id)) {
      setSelectedMachineIds(selectedMachineIds.filter(mid => mid !== id));
    } else {
      setSelectedMachineIds([...selectedMachineIds, id]);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      
      {/* Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-1">
        <h2 className="text-3xl font-black text-primary-navy tracking-tight">
          {t('estimator.title')}
        </h2>
        <p className="text-base text-slate-500 font-semibold leading-relaxed">
          {t('estimator.subtitle')}
        </p>
      </div>

      {/* Margin Violation Alert Banner (No Emojis) */}
      {isMarginViolated && (
        <div className="bg-red-50 border-2 border-red-200 p-6 rounded-3xl shadow-sm flex items-start gap-4 animate-pulse">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-900 font-semibold space-y-1">
            <p className="font-extrabold text-base">{t('estimator.alert_violation')} ({marginThreshold}%)</p>
            <p className="leading-relaxed">
              {currentLang === 'lo'
                ? `ຍ້ອນຕົ້ນທຶນເຈ້ຍ/ວັດສະດຸ ຫຼື ຄ່າເຂົ້າເຫຼັ້ມເພີ່ມຂຶ້ນ, ເຮັດໃຫ້ກຳໄລສຸດທິຂອງທ່ານເຫຼືອພຽງ ${Math.round(profitMarginPercent)}%.`
                : `Higher paper or binding overheads have compressed net yields to ${Math.round(profitMarginPercent)}%.`
              }
            </p>
          </div>
        </div>
      )}

      {/* Volume Tiering Info (No Emojis) */}
      {volumeDiscountPercent > 0 && (
        <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-sm text-emerald-800 font-black">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            {t('estimator.discount_badge')}
            <span className="text-emerald-600 font-black font-sans ml-1">-{volumeDiscountPercent}%</span> 
            {currentLang === 'lo' ? ' ຕໍ່ຕົ້ນທຶນເຈ້ຍ!' : ' on base paper cost!'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-extrabold text-lg text-slate-900 border-b pb-4 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-accent-sky" />
            <span>{t('estimator.form_title')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Paper Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('estimator.paper_select')}</label>
              <select
                value={selectedPaperId}
                disabled={isOverrideEnabled}
                onChange={(e) => setSelectedPaperId(e.target.value)}
                className="w-full min-h-[48px] px-3 py-2 border-2 rounded-xl focus:outline-none text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400 font-semibold font-sans"
              >
                {papers.map(p => {
                  const basePrice = getFIFOCostPerSheet(p.id, printVolume);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatLAK(basePrice)}/sheet)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Price Override Checkbox */}
            <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border">
              <label className="flex items-center gap-3 cursor-pointer select-none font-bold text-sm text-slate-700">
                <input 
                  type="checkbox" 
                  checked={isOverrideEnabled}
                  onChange={(e) => setIsOverrideEnabled(e.target.checked)}
                  className="w-5 h-5 text-accent-sky focus:ring-accent-sky border-slate-300 rounded cursor-pointer"
                />
                <span>{t('estimator.override_cost')}</span>
              </label>
              
              {isOverrideEnabled && (
                <div className="mt-3 space-y-1 animate-fade-in">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('estimator.override_label')}</label>
                  <input 
                    type="number"
                    value={overridePaperCost}
                    onChange={(e) => setOverridePaperCost(Number(e.target.value))}
                    className="w-full min-h-[40px] px-3 border-2 rounded-xl text-xs font-sans text-slate-900 font-black focus:outline-none bg-white"
                  />
                </div>
              )}
            </div>

            {/* Ink Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('estimator.ink_select')}</label>
              <select
                value={inkPriceId}
                onChange={(e) => setInkPriceId(e.target.value)}
                className="w-full min-h-[48px] px-3 py-2 border-2 rounded-xl focus:outline-none text-sm bg-white font-semibold font-sans"
              >
                {inks.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({formatLAK(i.costPerConsumptionUnit)}/ml)
                  </option>
                ))}
              </select>
            </div>

            {/* Ink Coverage Level */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('estimator.ink_coverage')}</label>
              <select
                value={inkCoverage}
                onChange={(e) => setInkCoverage(e.target.value)}
                className="w-full min-h-[48px] px-3 py-2 border-2 rounded-xl focus:outline-none text-sm bg-white font-semibold"
              >
                <option value="0.1">Low Coverage ~ 0.1ml</option>
                <option value="0.3">Medium Coverage ~ 0.3ml</option>
                <option value="0.6">High Coverage ~ 0.6ml</option>
              </select>
            </div>

            {/* Spoilage Margin Rate */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('estimator.spoilage_rate')}</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={spoilageRate}
                  onChange={(e) => setSpoilageRate(Number(e.target.value))}
                  className="w-full min-h-[48px] px-3 py-2 border-2 rounded-xl focus:outline-none text-sm font-black font-sans"
                />
                <div className="absolute right-4 top-3 text-sm text-slate-400 font-bold">%</div>
              </div>
            </div>

            {/* Print Volume */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('estimator.volume')}</label>
              <input
                type="number"
                min="1"
                value={printVolume}
                onChange={(e) => setPrintVolume(Number(e.target.value))}
                className="w-full min-h-[48px] px-3 py-2 border-2 rounded-xl focus:outline-none text-sm font-black font-sans"
              />
            </div>

            {/* Selling Price */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('estimator.selling_price')}</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full min-h-[48px] px-3 py-2 border-2 rounded-xl focus:outline-none text-base font-black text-slate-900 font-sans"
                />
                <div className="absolute right-4 top-3 text-sm text-slate-400 font-bold">LAK</div>
              </div>
            </div>

            {/* Safety Margin Threshold */}
            <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border">
              <label className="text-xs font-bold text-slate-700 block flex items-center gap-2">
                <Sliders className="w-4 h-4 text-accent-sky" />
                <span className="uppercase tracking-wider">{t('estimator.threshold_label')}</span>
              </label>
              <div className="relative mt-2">
                <input 
                  type="number"
                  min="1"
                  max="90"
                  value={marginThreshold}
                  onChange={(e) => setMarginThreshold(Number(e.target.value))}
                  className="w-full min-h-[40px] px-3 border-2 rounded-xl text-xs font-black font-sans text-slate-900 focus:outline-none bg-white"
                />
                <div className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">%</div>
              </div>
            </div>
          </div>

          {/* Post-Print Finishing */}
          <div className="space-y-4 pt-5 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('estimator.finishing_title')}</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex items-center gap-3 p-4 bg-slate-50 border-2 rounded-2xl cursor-pointer hover:bg-slate-100 select-none">
                <input
                  type="checkbox"
                  checked={hasLamination}
                  onChange={(e) => setHasLamination(e.target.checked)}
                  className="w-5 h-5 text-accent-sky rounded border-slate-300 focus:ring-accent-sky cursor-pointer"
                />
                <div>
                  <span className="text-sm font-extrabold block leading-none">{t('estimator.finishing_lam')}</span>
                  <span className="block text-[10px] text-slate-400 font-bold mt-1 font-sans">+500 LAK / sheet</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-slate-50 border-2 rounded-2xl cursor-pointer hover:bg-slate-100 select-none">
                <input
                  type="checkbox"
                  checked={hasDieCut}
                  onChange={(e) => setHasDieCut(e.target.checked)}
                  className="w-5 h-5 text-accent-sky rounded border-slate-300 focus:ring-accent-sky cursor-pointer"
                />
                <div>
                  <span className="text-sm font-extrabold block leading-none">{t('estimator.finishing_cut')}</span>
                  <span className="block text-[10px] text-slate-400 font-bold mt-1 font-sans">+300 LAK / sheet</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-slate-50 border-2 rounded-2xl cursor-pointer hover:bg-slate-100 select-none">
                <input
                  type="checkbox"
                  checked={hasFolding}
                  onChange={(e) => setHasFolding(e.target.checked)}
                  className="w-5 h-5 text-accent-sky rounded border-slate-300 focus:ring-accent-sky cursor-pointer"
                />
                <div>
                  <span className="text-sm font-extrabold block leading-none">{t('estimator.finishing_fold')}</span>
                  <span className="block text-[10px] text-slate-400 font-bold mt-1 font-sans">+100 LAK / sheet</span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('estimator.finishing_binding')}</label>
                <select
                  value={bindingType}
                  onChange={(e) => setBindingType(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-2 border-2 rounded-xl focus:outline-none text-xs bg-white font-bold"
                >
                  <option value="none">No Binding</option>
                  <option value="staple">Staple Binding [+2,000₭]</option>
                  <option value="spiral">Spiral Binding [+10,000₭]</option>
                  <option value="glue">Hot Glue Binding [+15,000₭]</option>
                </select>
              </div>
            </div>
          </div>

          {/* Machine overhead depreciation */}
          <div className="space-y-4 pt-5 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('estimator.depreciation_title')}</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {equipment.map(eq => {
                const checked = selectedMachineIds.includes(eq.id);
                return (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => handleMachineToggle(eq.id)}
                    className={`
                      p-4 rounded-2xl border-2 text-left transition flex items-center justify-between min-h-[64px]
                      ${checked 
                        ? 'border-accent-sky bg-blue-50/50 text-primary-navy shadow-sm' 
                        : 'border-slate-200 hover:border-slate-300 text-slate-500 bg-white'
                      }
                    `}
                  >
                    <div>
                      <p className="text-sm font-extrabold line-clamp-1">{eq.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold font-sans mt-0.5">+{formatLAK(Math.round(eq.calculatedCostPerPage))}/sheet</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${checked ? 'bg-accent-sky border-accent-sky' : 'border-slate-300'}`}>
                      {checked && <span className="w-2 h-2 rounded-full bg-white"></span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right calculations card */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-3xl border shadow-sm text-white flex flex-col justify-between min-h-[420px]">
            <div className="space-y-5">
              <h3 className="font-extrabold text-sm text-white/50 uppercase tracking-widest">
                {t('estimator.analysis_title')}
              </h3>

              <div className="text-center py-6 border-b border-white/10">
                <span className="text-xs uppercase font-extrabold text-white/40 tracking-widest">{t('estimator.analysis_margin')}</span>
                <div className={`text-5xl font-black tracking-wide mt-2.5 font-sans ${profitMarginPercent >= Number(marginThreshold) ? 'text-accent-sky' : 'text-red-400'}`}>
                  {Math.round(profitMarginPercent)}%
                </div>
                <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black border mt-4 ${
                  profitMarginPercent >= Number(marginThreshold) 
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-100' 
                    : 'text-red-600 bg-red-50 border-red-200 animate-pulse'
                }`}>
                  {profitMarginPercent >= Number(marginThreshold) ? (
                    <>
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      {t('estimator.margin_safe')}
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
                      {t('estimator.margin_risk')}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3.5 text-sm font-bold pt-2">
                <div className="flex justify-between">
                  <span className="text-white/60">{t('estimator.paper_cost')}</span>
                  <span className="text-white font-sans font-black">{formatLAK(Math.round(paperUnitCost))}</span>
                </div>
                <div className="flex justify-between font-sans">
                  <span className="text-white/60">{t('estimator.finishing_cost')}</span>
                  <span className="text-white font-black">{formatLAK(Math.round(finishingTotalCost / printVolume))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 font-sans">{t('estimator.total_unit_cost')}</span>
                  <span className="text-white font-sans font-black">{formatLAK(Math.round(totalUnitCost))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Selling Price:</span>
                  <span className="text-white font-sans font-black">{formatLAK(sellingPrice)}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-3 text-emerald-400 text-base font-black">
                  <span>{t('estimator.profit_total')}</span>
                  <span className="font-sans text-lg">{formatLAK(Math.round(totalJobProfit))}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-white/40 leading-relaxed bg-black/20 p-4 rounded-2xl font-semibold mt-4">
              <strong>{t('estimator.suggestion')} {marginThreshold}%</strong>
            </div>
          </div>

          {/* total subcosts breakdown bars */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
            <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
              {t('estimator.breakdown_title')}
            </h4>

            <div className="space-y-4 text-xs font-bold text-slate-600">
              <div>
                <div className="flex justify-between mb-1.5">
                  <span>Paper Cost</span>
                  <span className="font-sans font-black">{formatLAK(paperTotalCost)} ({totalJobCost > 0 ? Math.round((paperTotalCost / totalJobCost) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${totalJobCost > 0 ? (paperTotalCost / totalJobCost) * 100 : 0}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <span>Ink Cost</span>
                  <span className="font-sans font-black">{formatLAK(inkTotalCost)} ({totalJobCost > 0 ? Math.round((inkTotalCost / totalJobCost) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${totalJobCost > 0 ? (inkTotalCost / totalJobCost) * 100 : 0}%` }} />
                </div>
              </div>

              {finishingTotalCost > 0 && (
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span>Finishing Cost</span>
                    <span className="font-sans font-black">{formatLAK(finishingTotalCost)} ({totalJobCost > 0 ? Math.round((finishingTotalCost / totalJobCost) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalJobCost > 0 ? (finishingTotalCost / totalJobCost) * 100 : 0}%` }} />
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between mb-1.5">
                  <span>Spoilage Cost</span>
                  <span className="font-sans font-black">{formatLAK(spoilageTotalCost)} ({totalJobCost > 0 ? Math.round((spoilageTotalCost / totalJobCost) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: `${totalJobCost > 0 ? (spoilageTotalCost / totalJobCost) * 100 : 0}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <span>Machinery Depreciation</span>
                  <span className="font-sans font-black">{formatLAK(depreciationTotalCost)} ({totalJobCost > 0 ? Math.round((depreciationTotalCost / totalJobCost) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalJobCost > 0 ? (depreciationTotalCost / totalJobCost) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
