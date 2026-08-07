import React, { useState } from 'react';
import { 
  Sliders, 
  X, 
  Copy, 
  Package, 
  Printer, 
  Scissors, 
  CheckCircle2, 
  ArrowLeft,
  Check,
  AlertCircle
} from 'lucide-react';

export function calculateItemCosting(item, inventory, equipment) {
  if (!item) return { netCost: 0, finalPrice: 0, unitPrice: 0, cuts: 1, totalParentSheets: 0, totalPaperCost: 0, totalInkCost: 0, totalDepreciationCost: 0, totalPowerMaint: 0, finishingCost: 0 };

  const paperItem = inventory ? inventory.find(p => p.id === item.paperId) : null;
  let parentW = 297, parentH = 420;
  if (paperItem && paperItem.name.includes('A4')) { parentW = 210; parentH = 297; }

  const currentJobW = Number(item.jobWidth || 210) + (Number(item.bleedMargin || 0) * 2);
  const currentJobH = Number(item.jobHeight || 297) + (Number(item.bleedMargin || 0) * 2);
  const portraitCuts = Math.floor(parentW / currentJobW) * Math.floor(parentH / currentJobH);
  const landscapeCuts = Math.floor(parentW / currentJobH) * Math.floor(parentH / currentJobW);
  const cuts = Math.max(1, Math.max(portraitCuts, landscapeCuts));

  const qty = Number(item.quantity || 1);
  const parentSheetsNeeded = Math.ceil(qty / cuts);
  const spoilageSheets = Math.ceil(parentSheetsNeeded * (Number(item.spoilageRate || 5) / 100));
  const totalParentSheets = parentSheetsNeeded + spoilageSheets;

  const paperUnitCost = paperItem ? (paperItem.costPerSheet || 1200) : 1200;
  const totalPaperCost = totalParentSheets * paperUnitCost;

  const sidesMultiplier = item.isDoubleSided ? 2 : 1;
  const totalImpressions = qty * sidesMultiplier;
  const totalInkCost = totalImpressions * (((item.avgCoverage || 15) / 100) / 50) * 500;

  const printerItem = equipment ? equipment.find(e => e.id === item.printerId) : null;
  const printerDepr = printerItem ? (printerItem.calculatedCostPerPage || 20) : 15;
  const totalDepreciationCost = totalImpressions * printerDepr;
  const totalPowerMaint = totalImpressions * 40;

  let finishingCost = 0;
  if (item.useLamination) finishingCost += (((item.jobWidth || 210) / 1000) * ((item.jobHeight || 297) / 1000) * qty) * 4000;
  if (item.useFolding) finishingCost += qty * 25;
  if (item.useBinding) {
    if (item.bindingType === 'Staple') finishingCost += qty * 150;
    else if (item.bindingType === 'Spiral') finishingCost += qty * 2500;
    else if (item.bindingType === 'Perfect') finishingCost += qty * 1200;
  }

  const netCost = totalPaperCost + totalInkCost + totalDepreciationCost + totalPowerMaint + finishingCost + 15000;
  const targetMargin = Number(item.targetMarginPercent || 35);
  const suggestedPrice = netCost / (1 - (targetMargin / 100));
  const finalPrice = item.manualUnitPrice !== null && item.manualUnitPrice !== undefined 
    ? (Number(item.manualUnitPrice) * qty) 
    : suggestedPrice;
  const unitPrice = qty > 0 ? finalPrice / qty : 0;

  return {
    cuts,
    totalParentSheets,
    totalPaperCost,
    totalInkCost,
    totalDepreciationCost,
    totalPowerMaint,
    finishingCost,
    netCost,
    finalPrice,
    unitPrice
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
  const [tempItem, setTempItem] = useState({ ...item });

  const papers = inventory ? inventory.filter(p => p.category === 'Paper' || p.name.includes('A4') || p.name.includes('A3') || p.id.startsWith('LOT-')) : [];
  const printers = equipment ? equipment.filter(eq => eq.category === 'Printer' || eq.printerType || eq.name.includes('C6085')) : [];

  const handleDuplicateSpecsFrom = (sourceIndexStr) => {
    if (sourceIndexStr === '' || sourceIndexStr === null) return;
    const sourceItem = allItems[Number(sourceIndexStr)];
    if (!sourceItem) return;

    setTempItem(prev => ({
      ...prev,
      paperId: sourceItem.paperId,
      printerId: sourceItem.printerId,
      jobWidth: sourceItem.jobWidth,
      jobHeight: sourceItem.jobHeight,
      bleedMargin: sourceItem.bleedMargin,
      isDoubleSided: sourceItem.isDoubleSided,
      colorMode: sourceItem.colorMode,
      avgCoverage: sourceItem.avgCoverage,
      useLamination: sourceItem.useLamination,
      laminationType: sourceItem.laminationType,
      useFolding: sourceItem.useFolding,
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

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12 text-slate-800">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 text-sm font-black text-white hover:bg-emerald-600 transition py-2.5 px-5 bg-emerald-500 rounded-xl shadow-md active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← บันทึก & กลับไปรายการสินค้า (Save & Return)</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
          >
            ยกเลิก
          </button>
        </div>

        <div className="flex flex-col sm:items-end">
          <span className="text-xs uppercase font-extrabold text-accent-sky tracking-wider font-sans block">
            Item Spec Configurator #{itemIndex + 1}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-primary-navy mt-0.5 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-purple-600" />
            <span>ตั้งค่าสเปกการพิมพ์: <strong className="text-sky-600">"{tempItem.name}"</strong></span>
          </h3>
        </div>
      </div>

      {/* Toolbar Bar: Duplicate Specs & Status Badge */}
      <div className="bg-white p-4 sm:px-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 w-full sm:w-auto">
          <Copy className="w-4 h-4 text-purple-600 shrink-0" />
          <span>Duplicate Specs From...:</span>
          <select
            onChange={(e) => handleDuplicateSpecsFrom(e.target.value)}
            defaultValue=""
            className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent-sky max-w-xs"
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
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              <span>Specs Configured</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Pending Specs</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Column 1: Print Job Specs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Paper Stock & Dimensions */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Package className="w-5 h-5 text-accent-sky" />
              <span className="font-black text-sm text-slate-800">1. กระดาษ & ขนาดชิ้นงาน (Paper Stock & Sheet Dimensions)</span>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-700">
              <div className="space-y-1">
                <label className="block text-slate-500">กระดาษที่ใช้พิมพ์ (Paper Stock) *</label>
                <select
                  value={tempItem.paperId}
                  onChange={(e) => setTempItem({ ...tempItem, paperId: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-accent-sky"
                >
                  {papers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (ต้นทุน: {formatLAK(p.costPerSheet || 1200)}/แผ่น)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-500 uppercase font-black">Width (mm):</label>
                  <input
                    type="number"
                    value={tempItem.jobWidth}
                    onChange={(e) => setTempItem({ ...tempItem, jobWidth: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs text-center focus:ring-2 focus:ring-accent-sky focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-500 uppercase font-black">Height (mm):</label>
                  <input
                    type="number"
                    value={tempItem.jobHeight}
                    onChange={(e) => setTempItem({ ...tempItem, jobHeight: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs text-center focus:ring-2 focus:ring-accent-sky focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-500 uppercase font-black">Bleed (mm):</label>
                  <input
                    type="number"
                    value={tempItem.bleedMargin}
                    onChange={(e) => setTempItem({ ...tempItem, bleedMargin: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs text-center focus:ring-2 focus:ring-accent-sky focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Machine & Color Specs */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Printer className="w-5 h-5 text-purple-600" />
              <span className="font-black text-sm text-slate-800">2. เครื่องพิมพ์ & การพิมพ์ (Equipment & Ink Settings)</span>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-700">
              <div className="space-y-1">
                <label className="block text-slate-500">เครื่องพิมพ์ (Printing Equipment) *</label>
                <select
                  value={tempItem.printerId}
                  onChange={(e) => setTempItem({ ...tempItem, printerId: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-accent-sky"
                >
                  {printers.map(pr => (
                    <option key={pr.id} value={pr.id}>{pr.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-500 uppercase font-black">หน้าพิมพ์:</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTempItem({ ...tempItem, isDoubleSided: false })}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-black transition ${!tempItem.isDoubleSided ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                    >
                      1 หน้า (Single)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempItem({ ...tempItem, isDoubleSided: true })}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-black transition ${tempItem.isDoubleSided ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                    >
                      2 หน้า (Double)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-500 uppercase font-black">การครอบคลุมหมึก (Avg Coverage %):</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={tempItem.avgCoverage}
                    onChange={(e) => setTempItem({ ...tempItem, avgCoverage: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs text-center focus:ring-2 focus:ring-accent-sky focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Finishing Choices & Spoilage */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Scissors className="w-5 h-5 text-emerald-600" />
              <span className="font-black text-sm text-slate-800">3. งานหลังพิมพ์ & เผื่อเสีย (Finishing & Spoilage)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
              {/* Lamination */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempItem.useLamination}
                    onChange={(e) => setTempItem({ ...tempItem, useLamination: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="font-black">เคลือบผิว (Lamination)</span>
                </label>
                {tempItem.useLamination && (
                  <select
                    value={tempItem.laminationType}
                    onChange={(e) => setTempItem({ ...tempItem, laminationType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:outline-none"
                  >
                    <option value="Glossy">เคลือบเงา (Glossy)</option>
                    <option value="Matte">เคลือบด้าน (Matte)</option>
                    <option value="SoftTouch">Soft Touch</option>
                  </select>
                )}
              </div>

              {/* Binding */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempItem.useBinding}
                    onChange={(e) => setTempItem({ ...tempItem, useBinding: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="font-black">เข้าเล่ม (Binding)</span>
                </label>
                {tempItem.useBinding && (
                  <select
                    value={tempItem.bindingType}
                    onChange={(e) => setTempItem({ ...tempItem, bindingType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:outline-none"
                  >
                    <option value="Staple">มุงหลังคา (Staple)</option>
                    <option value="Spiral">ไส้ห่วง (Spiral)</option>
                    <option value="Perfect">ไส้กาวร้อน (Perfect Glue)</option>
                  </select>
                )}
              </div>

              {/* Spoilage Rate */}
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-[10px] text-slate-500 uppercase font-black">เผื่อเสียการพิมพ์ (Spoilage Rate %):</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={tempItem.spoilageRate}
                  onChange={(e) => setTempItem({ ...tempItem, spoilageRate: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-sans font-bold bg-white text-xs focus:ring-2 focus:ring-accent-sky focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Sticky Live Internal Cost Breakdown & Action Buttons */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          <div className="bg-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl space-y-6 border border-slate-800">
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="font-black text-xs uppercase tracking-wider text-sky-400">
                  Live Internal Cost Breakdown
                </span>
                <span className="text-[10px] bg-sky-950 text-sky-300 font-sans px-2.5 py-1 rounded-full border border-sky-800 font-bold">
                  {costing.cuts} cuts / parent sheet
                </span>
              </div>

              <div className="space-y-3 text-xs font-semibold text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">ต้นทุนกระดาษ (Paper Cost):</span>
                  <span className="font-sans font-black text-white text-sm">{formatLAK(costing.totalPaperCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">ต้นทุนหมึกพิมพ์ (Ink Cost):</span>
                  <span className="font-sans font-black text-white text-sm">{formatLAK(costing.totalInkCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">ค่าเสื่อมเครื่อง & ไฟฟ้า:</span>
                  <span className="font-sans font-black text-white text-sm">{formatLAK(costing.totalDepreciationCost + costing.totalPowerMaint)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">งานหลังพิมพ์ (Finishing):</span>
                  <span className="font-sans font-black text-white text-sm">{formatLAK(costing.finishingCost)}</span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-sky-400 font-black text-xs">
                <span>Net Internal Cost (ต้นทุนสุทธิ):</span>
                <span className="text-xl font-sans font-black">{formatLAK(costing.netCost)}</span>
              </div>

              {/* Profit Margin Slider & Pricing */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-400">Profit Margin (%):</span>
                  <span className="text-emerald-400 font-black font-sans text-base">{tempItem.targetMarginPercent}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={tempItem.targetMarginPercent}
                  onChange={(e) => setTempItem({ ...tempItem, targetMarginPercent: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />

                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">ราคาสินค้ารวม (Subtotal):</span>
                    <span className="text-2xl font-black text-emerald-400 font-sans">{formatLAK(costing.finalPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
                    <span>ราคาต่อชิ้น (Unit Price):</span>
                    <span className="font-sans font-black text-slate-200">{formatLAK(costing.unitPrice)} / ชิ้น</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar inside Sidebar */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-xs transition active:scale-95 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ยกเลิก / กลับคืน</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95 flex items-center justify-center gap-2"
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
