import React, { useState } from 'react';
import { 
  Sliders, 
  Copy, 
  Package, 
  Printer, 
  Scissors, 
  CheckCircle2, 
  ArrowLeft,
  Check,
  AlertCircle,
  Layers,
  BookOpen,
  Sparkles,
  Info,
  Maximize2,
  Zap
} from 'lucide-react';

export function calculateItemCosting(item, inventory, equipment) {
  if (!item) return { 
    netCost: 0, finalPrice: 0, unitPrice: 0, cuts: 1, 
    totalParentSheets: 0, paperUnitCost: 0, inkUnitCost: 0, isMonochrome: false,
    combinedPaperInkRate: 0, totalPaperCost: 0, totalInkCost: 0, totalPaperInkCost: 0, 
    cuttingCost: 0, laminationCost: 0, bindingCost: 0,
    mediaType: 'Sheet-fed', totalSqMeters: 0, printerStdMl: 0.05, inkCostPerMl: 500
  };

  const mediaType = item.mediaType || 'Sheet-fed';
  const isRollFed = mediaType === 'Roll-fed';
  const qty = Number(item.quantity || 1);
  const isMonochrome = item.colorMode === 'Monochrome' || item.printColorMode === 'Monochrome';
  const sidesMultiplier = item.isDoubleSided ? 2 : 1;

  // Step 2: Printer Machine Specs Integration
  const printerItem = equipment ? equipment.find(e => e.id === item.printerId) : null;
  const printerStdMl = printerItem?.inkConsumptionStandard || 0.05; // ml per A4 sheet @ 5% coverage
  const inkCostPerMl = printerItem?.inkUnitCostMl || 500; // LAK per ml
  const coverageRatio = (Number(item.avgCoverage || 15) / 5);

  let totalPaperCost = 0;
  let totalInkCost = 0;
  let totalPaperInkCost = 0;
  let combinedPaperInkRate = 0;
  let paperUnitCost = 0;
  let inkUnitCost = 0;
  let cuts = 1;
  let totalParentSheets = 1;
  let totalSqMeters = 0;

  if (isRollFed) {
    // Roll-fed / Wide Format Surface Area Calculation
    const jobW_m = Number(item.jobWidth || 1000) / 1000;
    const jobH_m = Number(item.jobHeight || 2000) / 1000;
    const sqMetersPerUnit = jobW_m * jobH_m;
    totalSqMeters = Math.round(sqMetersPerUnit * qty * 100) / 100;

    const rollItem = inventory ? inventory.find(p => p.id === item.paperId) : null;
    const rollMaterialCostPerM2 = rollItem ? (rollItem.costPerM2 || rollItem.costPerSheet || 15000) : Number(item.rollMaterialCostPerM2 || 15000);
    const inkVolumePerM2 = Number(item.inkVolumePerM2 || 10);

    totalPaperCost = Math.round(totalSqMeters * rollMaterialCostPerM2);
    totalInkCost = Math.round(totalSqMeters * (inkVolumePerM2 * inkCostPerMl));
    totalPaperInkCost = totalPaperCost + totalInkCost;

    paperUnitCost = rollMaterialCostPerM2;
    inkUnitCost = Math.round(inkVolumePerM2 * inkCostPerMl);
    combinedPaperInkRate = paperUnitCost + inkUnitCost; // Cost per m2
  } else {
    // Sheet-fed Commercial Printing Calculation
    const paperItem = inventory ? inventory.find(p => p.id === item.paperId) : null;
    let parentW = 297, parentH = 420;
    if (paperItem && paperItem.name.includes('A4')) { parentW = 210; parentH = 297; }

    const currentJobW = Number(item.jobWidth || 210) + (Number(item.bleedMargin || 0) * 2);
    const currentJobH = Number(item.jobHeight || 297) + (Number(item.bleedMargin || 0) * 2);
    const portraitCuts = Math.floor(parentW / currentJobW) * Math.floor(parentH / currentJobH);
    const landscapeCuts = Math.floor(parentW / currentJobH) * Math.floor(parentH / currentJobW);
    const autoCuts = Math.max(1, Math.max(portraitCuts, landscapeCuts));

    cuts = item.itemsPerSheet !== undefined && item.itemsPerSheet !== null && Number(item.itemsPerSheet) > 0
      ? Number(item.itemsPerSheet)
      : autoCuts;

    const parentSheetsNeeded = Math.ceil(qty / cuts);
    const spoilageRate = Number(item.spoilageRate || 5);
    const spoilageSheets = Math.ceil(parentSheetsNeeded * (spoilageRate / 100));
    const autoTotalSheets = parentSheetsNeeded + spoilageSheets;

    totalParentSheets = item.manualTotalSheets !== undefined && item.manualTotalSheets !== null && Number(item.manualTotalSheets) > 0
      ? Number(item.manualTotalSheets)
      : autoTotalSheets;

    // STEP 1: Paper Cost
    paperUnitCost = paperItem 
      ? (paperItem.costPerSheet || paperItem.costPerConsumptionUnit || paperItem.unitCost || 1200) 
      : Number(item.customPaperCost || 1200);

    totalPaperCost = totalParentSheets * paperUnitCost;

    // STEP 2: Dynamic Printing Ink Cost from Machine Master Specs
    if (isMonochrome) {
      const bwClick = printerItem?.clickRateBW || 150;
      inkUnitCost = Math.round(coverageRatio * printerStdMl * (inkCostPerMl * 0.4) * sidesMultiplier) || (bwClick * sidesMultiplier);
    } else {
      const colorClick = printerItem?.clickRateColor || 500;
      inkUnitCost = Math.round(coverageRatio * printerStdMl * inkCostPerMl * sidesMultiplier) || (colorClick * sidesMultiplier);
    }

    totalInkCost = totalParentSheets * inkUnitCost;
    combinedPaperInkRate = paperUnitCost + inkUnitCost;
    totalPaperInkCost = totalPaperCost + totalInkCost;
  }

  // 4. Cutting Cost
  const cuttingCost = item.skipCutting ? 0 : Number(item.cuttingFee || 5000);

  // 5. Coating / Lamination Cost
  let laminationCost = 0;
  if (!item.noCoating && (item.useLamination || item.laminationType)) {
    const targetSheets = isRollFed ? totalSqMeters : Number(item.coatingSheets || totalParentSheets);
    const sqMeters = isRollFed ? totalSqMeters : ((((item.jobWidth || 210) / 1000) * ((item.jobHeight || 297) / 1000)) * targetSheets);
    const laminationRate = item.laminationType === 'SoftTouch' ? 6000 : item.laminationType === 'Matte' ? 4500 : 4000;
    laminationCost = Math.round(sqMeters * laminationRate);
  }

  // 6. Binding Cost
  let bindingCost = 0;
  if (!item.noBinding && (item.useBinding || item.bindingType)) {
    if (item.bindingType === 'Staple') bindingCost = qty * 200;
    else if (item.bindingType === 'Spiral') bindingCost = qty * 3000;
    else if (item.bindingType === 'Perfect') bindingCost = qty * 1500;
    else if (item.bindingType === 'Calendar') bindingCost = qty * 4500;
    else bindingCost = qty * 1000;
  }

  // Direct Material & Finishing Net Cost (Steps 1 to 5)
  const netCost = totalPaperInkCost + cuttingCost + laminationCost + bindingCost;
  const targetMargin = Number(item.targetMarginPercent || 35);
  const suggestedPrice = netCost / (1 - (targetMargin / 100));
  const finalPrice = item.manualUnitPrice !== null && item.manualUnitPrice !== undefined 
    ? (Number(item.manualUnitPrice) * qty) 
    : suggestedPrice;
  const unitPrice = qty > 0 ? finalPrice / qty : 0;

  return {
    mediaType,
    cuts,
    totalParentSheets,
    totalSqMeters,
    paperUnitCost,
    inkUnitCost,
    isMonochrome,
    combinedPaperInkRate,
    totalPaperCost,
    totalInkCost,
    totalPaperInkCost,
    cuttingCost,
    laminationCost,
    bindingCost,
    netCost,
    finalPrice,
    unitPrice,
    printerStdMl,
    inkCostPerMl
  };
}

export default function ItemSpecConfigurator({
  item,
  itemIndex,
  allItems = [],
  inventory = [],
  equipment = [],
  formatLAK,
  onSave,
  onCancel,
  showToast
}) {
  const papers = inventory ? inventory.filter(p => p.category === 'Paper' || p.name.includes('A4') || p.name.includes('A3') || p.id.startsWith('LOT-')) : [];
  const rolls = inventory ? inventory.filter(p => p.category === 'Roll' || p.category === 'Vinyl' || p.category === 'Flex' || p.name.includes('ม้วน') || p.name.includes('Vinyl')) : papers;
  const printers = equipment ? equipment.filter(eq => eq.category === 'Printer' || eq.printerType || eq.name.includes('C6085') || eq.name.toLowerCase().includes('print')) : [];
  const cutters = equipment ? equipment.filter(eq => eq.category === 'Cutter' || eq.name.includes('ตัด') || eq.name.toLowerCase().includes('cut')) : [];

  const defaultPaperId = papers.length > 0 ? papers[0].id : '';
  const defaultPrinterId = printers.length > 0 ? printers[0].id : '';

  const [tempItem, setTempItem] = useState({
    mediaType: 'Sheet-fed',
    paperId: defaultPaperId,
    printerId: defaultPrinterId,
    colorMode: 'Color',
    printColorMode: 'Color',
    jobWidth: 210,
    jobHeight: 297,
    bleedMargin: 2,
    itemsPerSheet: item?.itemsPerSheet || null,
    manualTotalSheets: item?.manualTotalSheets || null,
    inkCostPerSheet: 500,
    rollMaterialCostPerM2: 15000,
    inkVolumePerM2: 10,
    inkPricePerMl: 500,
    isDoubleSided: false,
    avgCoverage: 15,
    skipCutting: false,
    cuttingEquipmentId: '',
    cuttingFee: 5000,
    noCoating: false,
    useLamination: false,
    laminationType: 'Glossy',
    coatingSheets: 0,
    noBinding: false,
    useBinding: false,
    bindingType: 'Staple',
    spoilageRate: 5,
    targetMarginPercent: 35,
    manualUnitPrice: null,
    ...item
  });

  const handleDuplicateSpecsFrom = (sourceIndexStr) => {
    if (sourceIndexStr === '' || sourceIndexStr === null) return;
    const sourceItem = allItems[Number(sourceIndexStr)];
    if (!sourceItem) return;

    setTempItem(prev => ({
      ...prev,
      mediaType: sourceItem.mediaType || 'Sheet-fed',
      paperId: sourceItem.paperId,
      printerId: sourceItem.printerId,
      colorMode: sourceItem.colorMode || 'Color',
      printColorMode: sourceItem.printColorMode || 'Color',
      jobWidth: sourceItem.jobWidth,
      jobHeight: sourceItem.jobHeight,
      bleedMargin: sourceItem.bleedMargin,
      itemsPerSheet: sourceItem.itemsPerSheet,
      manualTotalSheets: sourceItem.manualTotalSheets,
      inkCostPerSheet: sourceItem.inkCostPerSheet,
      rollMaterialCostPerM2: sourceItem.rollMaterialCostPerM2,
      inkVolumePerM2: sourceItem.inkVolumePerM2,
      inkPricePerMl: sourceItem.inkPricePerMl,
      isDoubleSided: sourceItem.isDoubleSided,
      avgCoverage: sourceItem.avgCoverage,
      skipCutting: sourceItem.skipCutting,
      cuttingEquipmentId: sourceItem.cuttingEquipmentId,
      cuttingFee: sourceItem.cuttingFee,
      noCoating: sourceItem.noCoating,
      useLamination: sourceItem.useLamination,
      laminationType: sourceItem.laminationType,
      coatingSheets: sourceItem.coatingSheets,
      noBinding: sourceItem.noBinding,
      useBinding: sourceItem.useBinding,
      bindingType: sourceItem.bindingType,
      spoilageRate: sourceItem.spoilageRate,
      targetMarginPercent: sourceItem.targetMarginPercent,
      manualUnitPrice: sourceItem.manualUnitPrice
    }));

    if (showToast) showToast(`คัดลอกสเปกจาก "${sourceItem.name}" สำเร็จ!`, 'info');
  };

  const handleSave = () => {
    const updated = {
      ...tempItem,
      isConfigured: true
    };
    onSave(updated);
  };

  const costing = calculateItemCosting(tempItem, inventory, equipment);
  const activeStockList = tempItem.mediaType === 'Roll-fed' ? (rolls.length > 0 ? rolls : papers) : papers;
  const selectedPaper = activeStockList.find(p => p.id === tempItem.paperId);
  const selectedPrinterObj = printers.find(pr => pr.id === tempItem.printerId);

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12 text-slate-800 font-sans">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 text-xs sm:text-sm font-black text-white hover:bg-emerald-600 transition py-2.5 px-5 bg-emerald-500 rounded-2xl shadow-md active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← บันทึก & กลับไปรายการสินค้า (Save & Return)</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition px-4 py-2.5 bg-slate-100 rounded-2xl border border-slate-200"
          >
            ยกเลิก
          </button>
        </div>

        <div className="flex flex-col sm:items-end">
          <span className="text-xs uppercase font-extrabold text-sky-600 tracking-wider font-sans block">
            Item Spec Configurator #{itemIndex + 1}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-purple-600" />
            <span>ตั้งค่าสเปกการพิมพ์: <strong className="text-sky-600">"{tempItem.name}"</strong></span>
          </h3>
        </div>
      </div>

      {/* Toolbar Bar: Duplicate Specs & Status Badge */}
      <div className="bg-white p-4 sm:px-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 w-full sm:w-auto">
          <Copy className="w-4 h-4 text-purple-600 shrink-0" />
          <span>Duplicate Specs From...:</span>
          <select
            onChange={(e) => handleDuplicateSpecsFrom(e.target.value)}
            defaultValue=""
            className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 max-w-xs"
          >
            <option value="" disabled>-- เลือกรายการที่ต้องการคัดลอกสเปก --</option>
            {allItems.map((it, idx) => {
              if (idx === itemIndex) return null;
              return (
                <option key={it.id || idx} value={idx}>
                  Item #{idx + 1}: {it.name} ({it.isConfigured ? '✓ Configured' : 'Pending'})
                </option>
              );
            })}
          </select>
        </div>

        <div className="text-xs font-black">
          {tempItem.isConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              <span>Specs Configured</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Pending Specs</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Column 1: Steps 1 to 5 Workflow Forms */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: Paper Stock & Quantity (ต้นทุนกระดาษ) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-sky-600 uppercase block">Step 1</span>
                  <h4 className="font-black text-sm text-slate-900">กระดาษ & จำนวนแผ่นที่ใช้ (Paper Stock & Quantity)</h4>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-700">
              {/* Media Type Selector Toggle */}
              <div className="space-y-1">
                <label className="block text-slate-600 font-black">ประเภทมีเดีย / ชนิดกระดาษ (Media Type) *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTempItem({ ...tempItem, mediaType: 'Sheet-fed' })}
                    className={`p-3.5 rounded-2xl border text-xs font-black transition flex items-center justify-center gap-2 ${
                      tempItem.mediaType !== 'Roll-fed'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>📄 กระดาษแผ่น (Sheet-fed)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTempItem({ ...tempItem, mediaType: 'Roll-fed' })}
                    className={`p-3.5 rounded-2xl border text-xs font-black transition flex items-center justify-center gap-2 ${
                      tempItem.mediaType === 'Roll-fed'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>🌀 กระดาษม้วน / ป้าย (Roll-fed)</span>
                  </button>
                </div>
              </div>

              {/* Conditional Inputs based on Media Type */}
              {tempItem.mediaType === 'Roll-fed' ? (
                /* ROLL-FED / WIDE FORMAT CALCULATION INPUTS */
                <div className="space-y-4 animate-fade-in bg-purple-50/40 p-4 rounded-2xl border border-purple-100">
                  <div className="space-y-1">
                    <label className="block text-slate-600">ม้วนมีเดีย / ไวนิล (Roll Stock from Inventory) *</label>
                    <select
                      value={tempItem.paperId}
                      onChange={(e) => setTempItem({ ...tempItem, paperId: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white font-bold text-xs focus:outline-none"
                    >
                      <option value="">-- เลือกมีเดียม้วนจาก Master Inventory --</option>
                      {activeStockList.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (ต้นทุน: {formatLAK(p.costPerM2 || p.costPerSheet || 15000)}/m²)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-black">Width (mm):</label>
                      <input
                        type="number"
                        value={tempItem.jobWidth}
                        onChange={(e) => setTempItem({ ...tempItem, jobWidth: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-black">Height (mm):</label>
                      <input
                        type="number"
                        value={tempItem.jobHeight}
                        onChange={(e) => setTempItem({ ...tempItem, jobHeight: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs text-center"
                      />
                    </div>
                  </div>

                  <div className="bg-purple-100/60 p-3.5 rounded-xl border border-purple-200 flex justify-between items-center text-purple-900 font-bold">
                    <span>พื้นที่รวม (Total Surface Area):</span>
                    <span className="font-sans font-black text-sm text-purple-800">{costing.totalSqMeters} m²</span>
                  </div>
                </div>
              ) : (
                /* SHEET-FED CALCULATION INPUTS */
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="block text-slate-600">กระดาษที่ใช้พิมพ์ (Paper Stock from Inventory) *</label>
                    <select
                      value={tempItem.paperId}
                      onChange={(e) => setTempItem({ ...tempItem, paperId: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">-- เลือกชนิดกระดาษจาก Master Inventory --</option>
                      {papers.map(p => {
                        const unitPrice = p.costPerSheet || p.costPerConsumptionUnit || p.unitCost || 1200;
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name} — ต้นทุน: {formatLAK(unitPrice)}/แผ่น
                          </option>
                        );
                      })}
                    </select>
                    {selectedPaper && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>ดึงต้นทุนกระดาษจาก Inventory: <strong>{formatLAK(costing.paperUnitCost)}</strong> / แผ่น</span>
                      </p>
                    )}
                  </div>

                  {/* Sheet Dimensions */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-black">Width (mm):</label>
                      <input
                        type="number"
                        value={tempItem.jobWidth}
                        onChange={(e) => setTempItem({ ...tempItem, jobWidth: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs text-center focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-black">Height (mm):</label>
                      <input
                        type="number"
                        value={tempItem.jobHeight}
                        onChange={(e) => setTempItem({ ...tempItem, jobHeight: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs text-center focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-black">Bleed (mm):</label>
                      <input
                        type="number"
                        value={tempItem.bleedMargin}
                        onChange={(e) => setTempItem({ ...tempItem, bleedMargin: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs text-center focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Paper Sheet Quantity & Layout Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div className="space-y-1">
                      <label className="block text-slate-700 font-black">
                        จำนวนชิ้นต่อแผ่น (Items per Sheet / Up Count) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tempItem.itemsPerSheet !== undefined && tempItem.itemsPerSheet !== null ? tempItem.itemsPerSheet : costing.cuts}
                        onChange={(e) => {
                          const upCount = Math.max(1, Number(e.target.value));
                          const targetQty = Number(tempItem.quantity || 1);
                          const autoSheets = Math.ceil(targetQty / upCount);
                          setTempItem({
                            ...tempItem,
                            itemsPerSheet: upCount,
                            manualTotalSheets: autoSheets
                          });
                        }}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs text-center focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-700 font-black">
                        จำนวนกระดาษที่ใช้พิมพ์รวม (Total Paper Sheets) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={costing.totalParentSheets}
                        onChange={(e) => {
                          setTempItem({
                            ...tempItem,
                            manualTotalSheets: Math.max(1, Number(e.target.value))
                          });
                        }}
                        className="w-full px-3.5 py-2.5 border border-sky-300 rounded-xl font-sans font-black bg-sky-50/50 text-xs text-center text-sky-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1 Paper Cost Summary Banner */}
              <div className="bg-sky-50/80 p-4 rounded-2xl border border-sky-100 flex justify-between items-center text-xs font-black">
                <span className="text-sky-800">ต้นทุนกระดาษรวม (Step 1 Paper Cost):</span>
                <span className="text-base font-sans text-sky-900">{formatLAK(costing.totalPaperCost)}</span>
              </div>
            </div>
          </div>

          {/* STEP 2: Printing Equipment & Dynamic Ink Calculation (เครื่องพิมพ์ & ต้นทุนหมึกพิมพ์) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-purple-600 uppercase block">Step 2</span>
                <h4 className="font-black text-sm text-slate-900">เครื่องพิมพ์ & คำนวณหมึกพิมพ์ (Printer Equipment & Ink Calculation)</h4>
              </div>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-700">
              {/* Printer Selection */}
              <div className="space-y-1">
                <label className="block text-slate-600">เครื่องพิมพ์ (Printing Machine Profile) *</label>
                <select
                  value={tempItem.printerId}
                  onChange={(e) => setTempItem({ ...tempItem, printerId: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- เลือกเครื่องพิมพ์จาก Master Equipment --</option>
                  {printers.map(pr => (
                    <option key={pr.id} value={pr.id}>
                      {pr.name} (Std Ink: {pr.inkConsumptionStandard || 0.05} ml @ 5% | ₭{pr.inkUnitCostMl || 500}/ml)
                    </option>
                  ))}
                </select>

                {/* Printer Master Spec Badge */}
                {selectedPrinterObj && (
                  <div className="bg-purple-50/80 p-3 rounded-2xl border border-purple-100 flex items-center justify-between text-[11px] text-purple-900 font-bold mt-1">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-600" />
                      <span>Printer Specs: Standard <strong>{selectedPrinterObj.inkConsumptionStandard || 0.05} ml/sheet</strong> @ 5% ISO</span>
                    </span>
                    <span className="font-mono text-purple-700">₭{selectedPrinterObj.inkUnitCostMl || 500} / ml</span>
                  </div>
                )}
              </div>

              {/* Print Mode & Coverage Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-600">โหมดสีพิมพ์ (Color Mode)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTempItem({ ...tempItem, colorMode: 'Color', printColorMode: 'Color' })}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-black transition flex items-center justify-center gap-1 ${
                        tempItem.colorMode !== 'Monochrome' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>พิมพ์สี (Color)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempItem({ ...tempItem, colorMode: 'Monochrome', printColorMode: 'Monochrome' })}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-black transition flex items-center justify-center gap-1 ${
                        tempItem.colorMode === 'Monochrome' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>ขาว-ดำ (B&W)</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-600">หน้าพิมพ์ (Sides) & การครอบคลุม %</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTempItem({ ...tempItem, isDoubleSided: !tempItem.isDoubleSided })}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-black transition ${
                        tempItem.isDoubleSided ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {tempItem.isDoubleSided ? '2 หน้า' : '1 หน้า'}
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={tempItem.avgCoverage}
                      onChange={(e) => setTempItem({ ...tempItem, avgCoverage: Number(e.target.value) })}
                      placeholder="Coverage %"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs text-center focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2 Dynamic Ink Cost Result Banner */}
              <div className="bg-purple-50/80 p-4 rounded-2xl border border-purple-100 flex justify-between items-center text-xs font-black">
                <div>
                  <span className="text-purple-900 block">ต้นทุนหมึกพิมพ์รวม (Step 2 Ink Cost):</span>
                  <span className="text-[10px] text-purple-700 font-mono font-normal">
                    (Formula: {tempItem.avgCoverage}% / 5% × {costing.printerStdMl}ml × ₭{costing.inkCostPerMl} × {tempItem.isDoubleSided ? '2' : '1'}) = {formatLAK(costing.inkUnitCost)}/แผ่น
                  </span>
                </div>
                <span className="text-base font-sans text-purple-900">{formatLAK(costing.totalInkCost)}</span>
              </div>
            </div>
          </div>

          {/* STEP 3: Cutting Process (กระบวนการตัด) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase block">Step 3</span>
                  <h4 className="font-black text-sm text-slate-900">กระบวนการตัด (Cutting Process)</h4>
                </div>
              </div>

              {/* Toggle Skip Cutting */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={tempItem.skipCutting}
                  onChange={(e) => setTempItem({ ...tempItem, skipCutting: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span>ไม่ใช้เครื่องตัด (Skip Cutting)</span>
              </label>
            </div>

            {!tempItem.skipCutting && (
              <div className="space-y-3 text-xs font-bold text-slate-700 animate-fade-in">
                <div className="space-y-1">
                  <label className="block text-slate-600">เครื่องตัดที่ใช้ (Cutting Equipment)</label>
                  <select
                    value={tempItem.cuttingEquipmentId}
                    onChange={(e) => setTempItem({ ...tempItem, cuttingEquipmentId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">-- เลือกเครื่องตัดจาก Master Equipment --</option>
                    {cutters.map(ct => (
                      <option key={ct.id} value={ct.id}>{ct.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500">ค่าบริการตัดชิ้นงาน (Flat Cutting Fee):</span>
                  <span className="font-mono font-black text-emerald-700">{formatLAK(tempItem.cuttingFee || 5000)}</span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 4: Lamination / Coating (การเคลือบผิว) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-600 uppercase block">Step 4</span>
                  <h4 className="font-black text-sm text-slate-900">การเคลือบผิว (Lamination & Coating)</h4>
                </div>
              </div>

              {/* Toggle No Coating */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={tempItem.noCoating}
                  onChange={(e) => setTempItem({ ...tempItem, noCoating: e.target.checked, useLamination: !e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <span>ไม่มีการเคลือบ (No Coating)</span>
              </label>
            </div>

            {!tempItem.noCoating && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700 animate-fade-in">
                <div className="space-y-1">
                  <label className="block text-slate-600">ประเภทการเคลือบ (Coating Type)</label>
                  <select
                    value={tempItem.laminationType || 'Glossy'}
                    onChange={(e) => setTempItem({ ...tempItem, laminationType: e.target.value, useLamination: true })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white font-bold text-xs focus:outline-none"
                  >
                    <option value="Glossy">เคลือบเงา (Glossy Lamination)</option>
                    <option value="Matte">เคลือบด้าน (Matte Lamination)</option>
                    <option value="SoftTouch">Soft Touch Velvet</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-600">จำนวนแผ่นเป้าหมาย (Coating Sheets)</label>
                  <input
                    type="number"
                    value={tempItem.coatingSheets || costing.totalParentSheets}
                    onChange={(e) => setTempItem({ ...tempItem, coatingSheets: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* STEP 5: Binding Process (การเข้าเล่ม) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase block">Step 5</span>
                  <h4 className="font-black text-sm text-slate-900">กระบวนการเข้าเล่ม (Binding Process)</h4>
                </div>
              </div>

              {/* Toggle No Binding */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={tempItem.noBinding}
                  onChange={(e) => setTempItem({ ...tempItem, noBinding: e.target.checked, useBinding: !e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span>ไม่มีการเข้าเล่ม (No Binding)</span>
              </label>
            </div>

            {!tempItem.noBinding && (
              <div className="space-y-3 text-xs font-bold text-slate-700 animate-fade-in">
                <label className="block text-slate-600">รูปแบบการเข้าเล่ม (Binding Style)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Staple', name: 'มุงหลังคา' },
                    { id: 'Perfect', name: 'ไส้กาวร้อน' },
                    { id: 'Spiral', name: 'ไส้ห่วง' },
                    { id: 'Calendar', name: 'เข้าเล่มปฏิทิน' }
                  ].map(style => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setTempItem({ ...tempItem, bindingType: style.id, useBinding: true })}
                      className={`p-3 rounded-xl border text-xs font-black transition text-center ${
                        tempItem.bindingType === style.id && !tempItem.noBinding
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Sticky Live Internal Cost Breakdown Sidebar (Right Panel - LIGHT THEME) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          <div className="bg-white border border-slate-200 p-6 sm:p-7 rounded-3xl shadow-sm space-y-6">
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="font-black text-xs uppercase tracking-wider text-sky-600 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-500" />
                  <span>Direct Item Cost Breakdown</span>
                </span>
                <span className="text-[10px] bg-sky-50 text-sky-700 font-sans px-2.5 py-1 rounded-full border border-sky-200 font-bold">
                  {costing.mediaType === 'Roll-fed' ? `${costing.totalSqMeters} m²` : `${costing.cuts} Up / ${costing.totalParentSheets} Sheets`}
                </span>
              </div>

              {/* 4 Direct Material & Finishing Cost Items */}
              <div className="space-y-3 text-xs font-semibold text-slate-700">
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-800 font-bold">1. ต้นทุนกระดาษ & หมึกพิมพ์รวม:</span>
                    <span className="font-sans font-black text-slate-900 text-sm">{formatLAK(costing.totalPaperInkCost)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono font-normal flex items-center gap-1">
                    <Info className="w-3 h-3 text-sky-600 shrink-0" />
                    <span>
                      Paper: {formatLAK(costing.totalPaperCost)} + Ink: {formatLAK(costing.totalInkCost)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-600">2. ค่าบริการตัด (Cutting Cost):</span>
                  <span className="font-sans font-black text-slate-900 text-sm">{formatLAK(costing.cuttingCost)}</span>
                </div>

                <div className="flex justify-between items-center bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-600">3. ค่าเคลือบผิว (Coating Cost):</span>
                  <span className="font-sans font-black text-slate-900 text-sm">{formatLAK(costing.laminationCost)}</span>
                </div>

                <div className="flex justify-between items-center bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-600">4. ค่าเข้าเล่ม (Binding Cost):</span>
                  <span className="font-sans font-black text-slate-900 text-sm">{formatLAK(costing.bindingCost)}</span>
                </div>
              </div>

              {/* Direct Material & Finishing Net Cost Banner */}
              <div className="bg-slate-100/80 p-4 rounded-2xl border border-slate-200 flex justify-between items-center text-slate-900 font-black text-xs">
                <span>Direct Material & Finishing Net Cost:</span>
                <span className="text-xl font-sans font-black text-sky-700">{formatLAK(costing.netCost)}</span>
              </div>

              {/* Profit Margin Slider & Pricing */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-600">Profit Margin (%):</span>
                  <span className="text-emerald-600 font-black font-sans text-base">{tempItem.targetMarginPercent}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={tempItem.targetMarginPercent}
                  onChange={(e) => setTempItem({ ...tempItem, targetMarginPercent: Number(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />

                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-800">ราคาสินค้ารวม (Item Subtotal):</span>
                    <span className="text-2xl font-black text-emerald-700 font-sans">{formatLAK(costing.finalPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-emerald-800/80 font-bold border-t border-emerald-200/60 pt-2 mt-1">
                    <span>ราคาเฉลี่ยต่อหน่วย (Unit Price):</span>
                    <span className="font-sans font-black text-emerald-900">{formatLAK(costing.unitPrice)} / ชิ้น</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons in Sidebar */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs transition active:scale-95 flex items-center justify-center gap-2 border border-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ยกเลิก / กลับคืน</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>บันทึกสเปก (Save Specs)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
