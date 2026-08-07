import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { 
  Calculator, 
  Settings, 
  Printer, 
  HelpCircle, 
  Layers, 
  Zap, 
  FileText, 
  Sliders, 
  CheckCircle2, 
  TrendingUp, 
  Info,
  DollarSign,
  Package,
  Cpu,
  Scissors,
  Share2,
  Download,
  Percent,
  PlusCircle,
  AlertCircle,
  RotateCcw,
  ArrowRight
} from 'lucide-react';

export default function QuotationManager({ onConvertToOrder }) {
  const { inventory, equipment, showToast, setActiveTab, setPrefilledOrderSpecs } = useApp();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  // State: Job Specs & Sizing
  const [jobWidth, setJobWidth] = useState(210); // A4 Width mm
  const [jobHeight, setJobHeight] = useState(297); // A4 Height mm
  const [bleedMargin, setBleedMargin] = useState(2); // 2mm bleed
  const [printVolume, setPrintVolume] = useState(500); // 500 copies
  const [isDoubleSided, setIsDoubleSided] = useState(false);

  // State: Inventory & Materials
  const [selectedPaperId, setSelectedPaperId] = useState('');
  const [selectedInkId, setSelectedInkId] = useState('');
  const [inkCoveragePercent, setInkCoveragePercent] = useState(15); // 15% coverage

  // State: Equipment & Finishing
  const [selectedPrinterId, setSelectedPrinterId] = useState('');
  const [useLamination, setUseLamination] = useState(false);
  const [laminationType, setLaminationType] = useState('Glossy'); // Glossy / Matte
  const [useFolding, setUseFolding] = useState(false);
  const [useBinding, setUseBinding] = useState(false);
  const [bindingType, setBindingType] = useState('Staple'); // Staple, Perfect, Spiral

  // State: Profit Margins & Pricing Overrides
  const [targetMarginPercent, setTargetMarginPercent] = useState(35); // 35% margin
  const [manualPriceOverride, setManualPriceOverride] = useState(null);

  // Settings Modal State & Calibrations
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('spoilage');

  // Calibration settings
  const [spoilageTiers, setSpoilageTiers] = useState([
    { min: 1, max: 100, rate: 10 },
    { min: 101, max: 500, rate: 5 },
    { min: 501, max: 2000, rate: 3 },
    { min: 2001, max: 100000, rate: 1 }
  ]);
  const [inkYieldPerMl, setInkYieldPerMl] = useState(50); // 50 pages/ml at 100% coverage
  const [electricityCostPerSheet, setElectricityCostPerSheet] = useState(25); // 25 LAK/sheet
  const [maintenanceCostPerSheet, setMaintenanceCostPerSheet] = useState(15); // 15 LAK/sheet
  const [laminationRatePerSqm, setLaminationRatePerSqm] = useState(4000); // 4000 LAK/sqm
  const [setupFeeLabor, setSetupFeeLabor] = useState(15000); // 15,000 LAK setup
  const [laborCostPerSheet, setLaborCostPerSheet] = useState(10); // 10 LAK/sheet

  // Pre-select default inventory items
  useEffect(() => {
    if (inventory && inventory.length > 0) {
      if (!selectedPaperId) {
        const paper = inventory.find(i => i.category === 'Paper' || i.name.includes('Paper') || i.name.includes('A4'));
        if (paper) setSelectedPaperId(paper.id);
        else setSelectedPaperId(inventory[0].id);
      }
      if (!selectedInkId) {
        const ink = inventory.find(i => i.category === 'Ink' || i.name.includes('Ink') || i.name.includes('Toner'));
        if (ink) setSelectedInkId(ink.id);
      }
    }
  }, [inventory, selectedPaperId, selectedInkId]);

  // Pre-select printer
  useEffect(() => {
    if (equipment && equipment.length > 0 && !selectedPrinterId) {
      setSelectedPrinterId(equipment[0].id);
    }
  }, [equipment, selectedPrinterId]);

  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num).replace('LAK', '₭');
  };

  // CALCULATION LOGIC
  const calculateCutsPerSheet = () => {
    const paperItem = inventory.find(p => p.id === selectedPaperId);
    if (!paperItem) return 1;

    let parentW = 297;
    let parentH = 420;
    if (paperItem.name.includes('A4')) {
      parentW = 210;
      parentH = 297;
    } else if (paperItem.name.includes('A3')) {
      parentW = 297;
      parentH = 420;
    }

    const currentJobW = Number(jobWidth) + (Number(bleedMargin) * 2);
    const currentJobH = Number(jobHeight) + (Number(bleedMargin) * 2);

    const portraitCuts = Math.floor(parentW / currentJobW) * Math.floor(parentH / currentJobH);
    const landscapeCuts = Math.floor(parentW / currentJobH) * Math.floor(parentH / currentJobW);

    const cuts = Math.max(portraitCuts, landscapeCuts);
    return cuts > 0 ? cuts : 1;
  };

  const cutsPerParentSheet = calculateCutsPerSheet();
  const parentSheetsNeeded = Math.ceil(printVolume / cutsPerParentSheet);

  const getActiveSpoilageRate = () => {
    const tier = spoilageTiers.find(t => printVolume >= t.min && printVolume <= t.max);
    return tier ? tier.rate : 2;
  };

  const spoilageRate = getActiveSpoilageRate();
  const spoilageSheets = Math.ceil(parentSheetsNeeded * (spoilageRate / 100));
  const totalParentSheets = parentSheetsNeeded + spoilageSheets;

  const paperItem = inventory.find(p => p.id === selectedPaperId);
  const paperUnitCost = paperItem ? (paperItem.costPerSheet || 1200) : 0;
  const totalPaperCost = totalParentSheets * paperUnitCost;

  const inkItem = inventory.find(i => i.id === selectedInkId);
  const inkCostPerMl = inkItem ? (inkItem.costPerConsumptionUnit || 500) : 500;
  const sidesMultiplier = isDoubleSided ? 2 : 1;
  const totalImpressions = printVolume * sidesMultiplier;
  const mlPerImpression = (inkCoveragePercent / 100) / inkYieldPerMl;
  const totalMlNeeded = totalImpressions * mlPerImpression;
  const totalInkCost = totalMlNeeded * inkCostPerMl;

  const printerItem = equipment.find(e => e.id === selectedPrinterId);
  const printerDepreciationPerSheet = printerItem ? 20 : 15;
  const totalDepreciationCost = totalImpressions * printerDepreciationPerSheet;
  const totalPowerMaintCost = totalImpressions * (electricityCostPerSheet + maintenanceCostPerSheet);

  let laminationTotalCost = 0;
  if (useLamination) {
    const jobSqmPerSheet = (jobWidth / 1000) * (jobHeight / 1000);
    const totalSqm = jobSqmPerSheet * printVolume * (laminationType === 'Matte' ? 1.1 : 1.0);
    laminationTotalCost = totalSqm * laminationRatePerSqm;
  }

  let foldingTotalCost = useFolding ? printVolume * 25 : 0;
  let bindingTotalCost = 0;
  if (useBinding) {
    if (bindingType === 'Staple') bindingTotalCost = printVolume * 150;
    else if (bindingType === 'Spiral') bindingTotalCost = printVolume * 2500;
    else if (bindingType === 'Perfect') bindingTotalCost = printVolume * 1200;
  }

  const totalFinishingCost = laminationTotalCost + foldingTotalCost + bindingTotalCost;
  const totalLaborCost = setupFeeLabor + (totalImpressions * laborCostPerSheet);

  const netTotalCost = totalPaperCost + totalInkCost + totalDepreciationCost + totalPowerMaintCost + totalFinishingCost + totalLaborCost;
  const unitNetCost = printVolume > 0 ? netTotalCost / printVolume : 0;

  const suggestedSellingPriceTotal = netTotalCost / (1 - (targetMarginPercent / 100));
  const suggestedUnitPrice = printVolume > 0 ? suggestedSellingPriceTotal / printVolume : 0;

  const finalQuotedTotalPrice = manualPriceOverride !== null ? Number(manualPriceOverride) : suggestedSellingPriceTotal;
  const finalQuotedUnitPrice = printVolume > 0 ? finalQuotedTotalPrice / printVolume : 0;

  const actualProfitTotal = finalQuotedTotalPrice - netTotalCost;
  const actualProfitMarginPercent = finalQuotedTotalPrice > 0 ? (actualProfitTotal / finalQuotedTotalPrice) * 100 : 0;

  const handleConvertToOrderClick = () => {
    const specData = {
      paperId: selectedPaperId,
      paperName: paperItem ? paperItem.name : 'Standard Paper',
      quantity: printVolume,
      unitCost: Math.round(finalQuotedUnitPrice),
      specs: `${jobWidth}x${jobHeight}mm, ${isDoubleSided ? 'Double-sided' : 'Single-sided'}, ${useLamination ? laminationType + ' Lamination' : 'No Lamination'}`
    };
    
    if (setPrefilledOrderSpecs) {
      setPrefilledOrderSpecs(specData);
    }
    if (onConvertToOrder) {
      onConvertToOrder(specData);
    } else {
      setActiveTab('orders');
      showToast(currentLang === 'lo' ? 'ส่งข้อมูลใบเสนอราคาเข้าสู่ฟอร์มสร้างออเดอร์แล้ว' : 'Quotation converted to Active Order draft!', 'success');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in print:p-0 text-slate-800 w-full">
      {/* Header card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calculator className="w-6 h-6" />
            </span>
            <h2 className="text-3xl font-black text-primary-navy tracking-tight">
              {currentLang === 'lo' ? 'ລະບົບໃບສະເໜີລາຄາ' : 'Quotation Manager'}
            </h2>
          </div>
          <p className="text-base text-slate-500 font-semibold leading-relaxed">
            {currentLang === 'lo' ? 'คำนวณต้นทุนการพิมพ์และออกใบเสนอราคาสิมลอง (ไม่ตัดสต็อก)' : 'Simulate costs, profit margins, and convert quotations into active orders'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition active:scale-95"
          >
            <Settings className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ตั้งค่าต้นทุน' : 'Cost Calibrations'}</span>
          </button>
        </div>
      </div>

      {/* Grid 12 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (Inputs) */}
        <div className="lg:col-span-7 space-y-6 print:hidden">
          {/* Section 1: Dimensions & Volume */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent-sky" />
                <h3 className="font-black text-slate-800 text-base">
                  1. {currentLang === 'lo' ? 'ขนาดงานพิมพ์และจำนวน' : 'Dimensions & Print Volume'}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-600">
              <div className="space-y-1">
                <label className="block text-slate-500">Width (mm):</label>
                <input
                  type="number"
                  value={jobWidth}
                  onChange={(e) => setJobWidth(Number(e.target.value))}
                  className="w-full min-h-[42px] px-3.5 border-2 border-slate-200 focus:border-accent-sky rounded-xl font-sans text-sm font-black"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">Height (mm):</label>
                <input
                  type="number"
                  value={jobHeight}
                  onChange={(e) => setJobHeight(Number(e.target.value))}
                  className="w-full min-h-[42px] px-3.5 border-2 border-slate-200 focus:border-accent-sky rounded-xl font-sans text-sm font-black"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">Print Volume (Copies):</label>
                <input
                  type="number"
                  min="1"
                  value={printVolume}
                  onChange={(e) => setPrintVolume(Number(e.target.value))}
                  className="w-full min-h-[42px] px-3.5 border-2 border-slate-200 focus:border-accent-sky rounded-xl font-sans text-sm font-black text-accent-sky"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-slate-700">
                <input
                  type="checkbox"
                  checked={isDoubleSided}
                  onChange={(e) => setIsDoubleSided(e.target.checked)}
                  className="w-4 h-4 rounded text-accent-sky focus:ring-accent-sky"
                />
                <span>{currentLang === 'lo' ? 'พิมพ์ 2 หน้า (Double-sided)' : 'Double-sided Print'}</span>
              </label>

              <span className="text-xs text-slate-400 font-bold font-mono">
                Cuts: {cutsPerParentSheet} / parent sheet
              </span>
            </div>
          </div>

          {/* Section 2: Material & Ink */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <Package className="w-5 h-5 text-indigo-500" />
              <h3 className="font-black text-slate-800 text-base">
                2. {currentLang === 'lo' ? 'กระดาษและหมึกพิมพ์' : 'Paper & Ink Inventory Specs'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-600">
              <div className="space-y-1">
                <label className="block text-slate-500">Paper SKU Stock:</label>
                <select
                  value={selectedPaperId}
                  onChange={(e) => setSelectedPaperId(e.target.value)}
                  className="w-full min-h-[42px] px-3 border-2 border-slate-200 focus:border-accent-sky rounded-xl bg-white font-bold"
                >
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({formatLAK(item.costPerSheet || 1000)}/sheet)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">Ink Density / Coverage (%):</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={inkCoveragePercent}
                  onChange={(e) => setInkCoveragePercent(Number(e.target.value))}
                  className="w-full min-h-[42px] px-3.5 border-2 border-slate-200 focus:border-accent-sky rounded-xl font-sans text-sm font-black"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Finishing & Overhead */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <Scissors className="w-5 h-5 text-emerald-500" />
              <h3 className="font-black text-slate-800 text-base">
                3. {currentLang === 'lo' ? 'การหลังพิมพ์ (Finishing Options)' : 'Finishing & Options'}
              </h3>
            </div>

            <div className="space-y-3 text-xs font-bold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLamination}
                  onChange={(e) => setUseLamination(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>เคลือบเงา / เคลือบด้าน (Lamination)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useBinding}
                  onChange={(e) => setUseBinding(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>เข้าเล่ม (Binding: Spiral/Staple)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column (Quotation Output Card & Conversion) */}
        <div className="lg:col-span-5 space-y-6 print:col-span-3">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6 sticky top-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Estimated Quote</span>
                <h3 className="text-xl font-black text-primary-navy mt-0.5">
                  {currentLang === 'lo' ? 'สรุปใบเสนอราคา' : 'Quotation Summary'}
                </h3>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-extrabold text-xs rounded-full border border-emerald-100">
                Draft Simulation
              </span>
            </div>

            {/* Price Cards */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Base Net Cost (ต้นทุนสุทธิ):</span>
                <span className="font-sans font-black text-slate-900">{formatLAK(netTotalCost)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Cost Per Unit:</span>
                <span className="font-sans font-black text-slate-900">{formatLAK(unitNetCost)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="text-sm font-black text-slate-900">Suggested Selling Price:</span>
                <span className="text-xl font-black text-accent-sky font-sans">
                  {formatLAK(finalQuotedTotalPrice)}
                </span>
              </div>
              <div className="text-right text-xs font-bold text-emerald-600 font-sans">
                ~ {formatLAK(finalQuotedUnitPrice)} / unit
              </div>
            </div>

            {/* Target Margin Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-600">Target Profit Margin (%):</span>
                <span className="text-indigo-600 font-black">{targetMarginPercent}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={targetMarginPercent}
                onChange={(e) => setTargetMarginPercent(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Convert to Active Order Button */}
            <div className="pt-4 border-t space-y-3 print:hidden">
              <button
                onClick={handleConvertToOrderClick}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-base shadow-xl shadow-emerald-600/15 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span>{currentLang === 'lo' ? 'ປ່ຽນເປັນອໍເດີ (Convert to Order)' : 'Convert to Active Order'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
