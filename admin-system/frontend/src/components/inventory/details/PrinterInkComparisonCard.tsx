import React, { useState } from 'react';
import { Layers, Droplet, TrendingDown, RefreshCw, CheckCircle2, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../../context/AppContext';

interface PrinterInkComparisonCardProps {
  printerItem: any;
  currentLang?: string;
}

export default function PrinterInkComparisonCard({ printerItem, currentLang = 'lo' }: PrinterInkComparisonCardProps) {
  const { inventory, printerColorLinks, addPrinterColorLink, deletePrinterColorLink, updateEquipment, showToast, formatCurrency } = useApp();
  const formatLAK = formatCurrency;

  // Selected Ink Coverage preset: 5 (ISO standard), 15 (Text + Logo), 30 (Graphics), 50 (Full Bleed Photo)
  const [coveragePercent, setCoveragePercent] = useState<number>(5);

  // Extract OEM Baseline Slots (from inbound or specs)
  const oemBaselineSlots = 
    printerItem?.oem_baseline_specs?.slots || 
    printerItem?.specs?.oem_baseline_specs?.slots || 
    printerItem?.oemBaselineInks || 
    printerItem?.printerColorLinks || 
    [
      { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'EPSON-008-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 7500, oemPrice: 450000 },
      { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemInkCode: 'EPSON-008-C', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
      { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemInkCode: 'EPSON-008-M', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
      { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemInkCode: 'EPSON-008-Y', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 }
    ];

  // Filter inventory items to ink SKUs
  const inkInventory = inventory.filter(item => 
    item.category?.toLowerCase().includes('ink') || 
    item.name?.toLowerCase().includes('ink') ||
    item.skuCode?.toLowerCase().includes('ink') ||
    item.category === 'Consumable' ||
    item.category === 'Raw Material'
  );

  // Get currently active printer color links
  const activeLinks = printerColorLinks.filter(lnk => lnk.assetId === printerItem.id);

  // Coverage multiplier factor (scaled against 5% ISO baseline)
  const coverageMultiplier = coveragePercent / 5;

  // Calculate OEM & Actual Total Ink Costs per Page
  let totalOemCostPerPage = 0;
  let totalActualCostPerPage = 0;
  let totalLinkedSlots = 0;

  const slotComparisons = oemBaselineSlots.map((oemSlot: any, idx: number) => {
    const slotPos = oemSlot.slotPosition || `Slot ${idx + 1}`;
    
    // OEM calculations
    const oemVol = Number(oemSlot.oemStandardVolumeMl || oemSlot.volume || 100);
    const oemYield = Number(oemSlot.oemStandardIsoYieldA4 || oemSlot.isoYield || 5000);
    const oemPrice = Number(oemSlot.oemPrice || 350000);

    const isoRateMlPerSheet = oemYield > 0 ? (oemVol / oemYield) : 0.0169;
    const scaledRateMl = isoRateMlPerSheet * coverageMultiplier;

    const oemCostPerMl = oemVol > 0 ? (oemPrice / oemVol) : 0;
    const oemCostPerPage = oemCostPerMl * scaledRateMl;

    totalOemCostPerPage += oemCostPerPage;

    // Actual Linked Inventory Ink
    const activeLink = activeLinks.find(lnk => lnk.slotPosition === slotPos || lnk.colorGroup === oemSlot.colorGroup);
    const linkedInkItem = activeLink ? inventory.find(inv => inv.id === activeLink.inkCode || inv.skuCode === activeLink.inkCode) : null;

    let actualCostPerPage = oemCostPerPage; // Fallback to OEM cost if not linked
    let actualInkPrice = oemPrice;
    let actualVol = oemVol;

    if (linkedInkItem) {
      totalLinkedSlots += 1;
      actualInkPrice = Number(linkedInkItem.unitPrice || linkedInkItem.costPerPurchaseUnit || 0);
      
      // Robust volume resolution from specs or item properties
      const resolvedVol = Number(
        linkedInkItem.volume || 
        linkedInkItem.specs?.volume || 
        linkedInkItem.specs?.volume_ml || 
        linkedInkItem.specs?.oemStandardVolumeMl || 
        linkedInkItem.specs?.oemVolumeMl || 
        linkedInkItem.oemStandardVolumeMl || 
        (linkedInkItem.purchaseMultiplier > 1 ? linkedInkItem.purchaseMultiplier : null)
      );

      actualVol = resolvedVol && resolvedVol > 1 ? resolvedVol : 140; // Default to 140ml standard bottle if unassigned
      const actualCostPerMl = actualVol > 0 ? (actualInkPrice / actualVol) : 0;
      actualCostPerPage = actualCostPerMl * scaledRateMl;
    }

    totalActualCostPerPage += actualCostPerPage;

    const slotSavingsPerPage = oemCostPerPage - actualCostPerPage;
    const slotSavingsPercent = oemCostPerPage > 0 ? (slotSavingsPerPage / oemCostPerPage) * 100 : 0;

    return {
      slotPos,
      colorGroup: oemSlot.colorGroup || `Color ${idx + 1}`,
      oemSlot,
      oemCostPerPage,
      oemPrice,
      oemVol,
      oemYield,
      scaledRateMl,
      linkedInkItem,
      activeLink,
      actualCostPerPage,
      actualInkPrice,
      actualVol,
      slotSavingsPerPage,
      slotSavingsPercent
    };
  });

  const totalSavingsPerPage = totalOemCostPerPage - totalActualCostPerPage;
  const overallSavingsPercent = totalOemCostPerPage > 0 ? (totalSavingsPerPage / totalOemCostPerPage) * 100 : 0;

  // Link Ink Handler
  const handleLinkInk = (slotPos: string, inkSkuId: string) => {
    if (!inkSkuId) return;

    // Delete existing link for this slot position if any
    const existing = activeLinks.find(lnk => lnk.slotPosition === slotPos);
    if (existing) {
      deletePrinterColorLink(existing.id);
    }

    addPrinterColorLink({
      assetId: printerItem.id,
      inkCode: inkSkuId,
      slotPosition: slotPos
    });

    showToast(
      currentLang === 'lo' 
        ? `ຜູກໝຶກພິມເຂົ້າກັບ Slot "${slotPos}" ສຳເລັດ!` 
        : `Linked Ink SKU to Slot "${slotPos}" successfully!`, 
      'success'
    );
  };

  // Sync calculated actual cost to printer equipment state
  const handleSyncToEngine = () => {
    updateEquipment(printerItem.id, {
      inkCostPerPage: totalActualCostPerPage,
      inkConsumptionStandard: totalActualCostPerPage
    });

    showToast(
      currentLang === 'lo'
        ? `ອັບເດດຕົ້ນທຶນໝຶກພິມຈິງ (${formatLAK(totalActualCostPerPage)}/ແຜ່ນ) ເຂົ້າສູ່ Quotation Engine ສຳເລັດ!`
        : `Synced actual ink cost (${formatLAK(totalActualCostPerPage)}/page) to Quotation Engine!`,
      'success'
    );
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
      {/* Top Header & Coverage Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Droplet className="w-5 h-5 text-sky-600" />
            <span>
              {currentLang === 'lo' 
                ? 'ຕາຕະລາງຕົ້ນທຶນໝຶກພິມຈິງ & ຜູກສີກັບສາງ (Ink Cost Benchmark & Linker)' 
                : 'Ink Cost Benchmark & Linker'}
            </span>
          </h3>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            {currentLang === 'lo'
              ? 'ປຽບທຽບສະເປັກມາດຕະຖານໂຮງງານ OEM ກັບໝຶກທີ່ໃຊ້ຈິງໃນສາງ'
              : 'Compare manufacturer OEM baseline costs against real inventory ink SKUs'}
          </p>
        </div>

        {/* Coverage Selector Pills */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0">
          <span className="text-[10px] font-black uppercase text-slate-500 px-2">Ink Coverage:</span>
          {[
            { label: '5% (ISO)', val: 5 },
            { label: '15% (Text+Logo)', val: 15 },
            { label: '30% (Graphics)', val: 30 },
            { label: '50% (Full Photo)', val: 50 }
          ].map(preset => (
            <button
              key={preset.val}
              onClick={() => setCoveragePercent(preset.val)}
              className={`px-3 py-1 text-xs font-black rounded-xl transition cursor-pointer ${
                coveragePercent === preset.val 
                  ? 'bg-sky-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: OEM Factory Baseline Reference Specs Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-slate-800 rounded-lg text-sky-400 font-bold text-sm">🏭</span>
            <div>
              <h4 className="text-sm font-extrabold text-white">
                {currentLang === 'lo' 
                  ? 'ຂໍ້ມູນສະເປັກມາດຕະຖານອັດຕາສິ້ນເປືອງໝຶກໂຮງງານ OEM (Factory Baseline Specs)' 
                  : 'ข้อมูลสเปคมาตรฐานอัตราสิ้นเปลืองหมึกโรงงาน OEM (Factory Baseline Specs)'}
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold">
                {currentLang === 'lo'
                  ? 'ນຳໃຊ້ອັດຕາສິ້ນເປືອງ ml/ແຜ່ນ ຈາກສະເປັກໂຮງງານ ຄູນກັບລາຄາໝຶກທີ່ຊື້ຈິງໃນສາງ'
                  : 'ใช้อัตราการสิ้นเปลือง ml/แผ่น จากสเปคโรงงาน เพื่อนำไปคูณกับราคาหมึกที่สั่งซื้อจริงในคลัง'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider">
            {currentLang === 'lo' ? 'ສະເປັກອັດຕາສິ້ນເປືອງໂຮງງານ' : 'Factory ISO Rate Baseline'}
          </span>
        </div>

        {/* OEM Baseline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {oemBaselineSlots.map((slot: any, i: number) => {
            const vol = Number(slot.oemStandardVolumeMl || slot.volume || 100);
            const yld = Number(slot.oemStandardIsoYieldA4 || slot.isoYield || 5000);
            const isoRate = yld > 0 ? (vol / yld) : 0.0169;

            return (
              <div key={i} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-300 font-bold text-[11px]">
                  <span>{slot.slotPosition || `Slot ${i + 1}`}</span>
                  <span className="text-sky-400">{slot.colorGroup || ''}</span>
                </div>
                <span className="text-white font-extrabold text-xs block truncate">{slot.oemInkCode || 'OEM Standard'}</span>
                <div className="text-[10px] text-slate-400 space-y-0.5 font-sans pt-1 border-t border-slate-700/60">
                  <div className="flex justify-between">
                    <span>{currentLang === 'lo' ? 'ບໍລິມາດ:' : 'Volume:'}</span>
                    <span className="font-mono font-bold text-slate-200">{vol} ml</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{currentLang === 'lo' ? 'ຄາດວ່າພິມໄດ້:' : 'Factory Yield:'}</span>
                    <span className="font-mono font-bold text-slate-200">{yld.toLocaleString()} {currentLang === 'lo' ? 'ແຜ່ນ' : 'pages'}</span>
                  </div>
                  <div className="flex justify-between text-sky-300 font-bold pt-1 border-t border-slate-700/40">
                    <span>{currentLang === 'lo' ? 'ອັດຕາສິ້ນເປືອງ:' : 'Standard Rate:'}</span>
                    <span className="font-mono text-sky-400 font-extrabold">{isoRate.toFixed(4)} ml/{currentLang === 'lo' ? 'ແຜ່ນ' : 'sheet'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Selected Ink Coverage</span>
          <span className="text-base font-black font-mono text-slate-900">@{coveragePercent}% Coverage</span>
          <span className="text-[10px] text-slate-400 block font-semibold">
            {(coveragePercent / 5).toFixed(1)}x ISO Standard Multiplier
          </span>
        </div>

        <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200 space-y-1 col-span-2">
          <span className="text-[10px] font-bold text-sky-700 uppercase block">
            {currentLang === 'lo' ? 'ຕົ້ນທຶນໝຶກຈິງຕໍ່ແຜ່ນ (Actual Linked Ink Cost / Page)' : 'Actual Linked Ink Cost / Page'}
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-sky-800">{formatLAK(totalActualCostPerPage)} / {currentLang === 'lo' ? 'ແຜ່ນ' : 'page'}</span>
            <span className="text-xs font-bold text-sky-600">
              {totalLinkedSlots} of {slotComparisons.length} {currentLang === 'lo' ? 'ຊ່ອງສີຜູກແລ້ວ' : 'slots linked to Inventory'}
            </span>
          </div>
          <span className="text-[10px] text-sky-600 block font-semibold">
            {currentLang === 'lo' ? 'ຕົ້ນທຶນນີ້ຈະຖືກໃຊ້ໃນລະບົບໃບສະເໜີລາຄາ (Synced with Quotation Engine)' : 'Calculated dynamically using real inventory purchase prices & bottle sizes'}
          </span>
        </div>
      </div>

      {/* Per-Slot Comparison Table & Linker Dropdowns */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-black">
              <th className="py-3 px-4">{currentLang === 'lo' ? 'ຊ່ອງສີ (Slot)' : 'Color Slot'}</th>
              <th className="py-3 px-4">{currentLang === 'lo' ? 'ສະເປັກອັດຕາສິ້ນເປືອງໂຮງງານ' : 'Factory ISO Rate Baseline'}</th>
              <th className="py-3 px-4">{currentLang === 'lo' ? 'ໝຶກທີ່ຜູກໃນສາງ (Inventory Ink)' : 'Actual Linked Ink SKU in Inventory'}</th>
              <th className="py-3 px-4 text-right">{currentLang === 'lo' ? 'ຕົ້ນທຶນຈິງ / ແຜ່ນ' : 'Actual Cost / Page'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {slotComparisons.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                {/* Slot Name */}
                <td className="py-3 px-4">
                  <span className="font-bold text-slate-900 block">{item.slotPos}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">{item.colorGroup}</span>
                </td>

                {/* OEM Spec */}
                <td className="py-3 px-4">
                  <span className="font-mono text-slate-800 block font-bold">{item.oemSlot.oemInkCode || 'OEM Standard'}</span>
                  <span className="text-[10px] text-slate-400 block font-normal">
                    Vol: {item.oemVol}ml | Yield: {item.oemYield.toLocaleString()} {currentLang === 'lo' ? 'ແຜ່ນ' : 'pages'} | Rate: {(item.oemVol / item.oemYield).toFixed(4)} ml/{currentLang === 'lo' ? 'ແຜ່ນ' : 'sheet'}
                  </span>
                </td>

                {/* Linked Ink SKU Dropdown */}
                <td className="py-3 px-4 min-w-[240px]">
                  <select
                    value={item.linkedInkItem?.id || ''}
                    onChange={(e) => handleLinkInk(item.slotPos, e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 text-xs focus:outline-none focus:border-sky-500 shadow-2xs"
                  >
                    <option value="">-- {currentLang === 'lo' ? 'ກົດເລືອກໝຶກໃນສາງ' : 'Click to Link Inventory Ink'} --</option>
                    {inkInventory.map((inkSku: any) => (
                      <option key={inkSku.id} value={inkSku.id}>
                        {inkSku.name} ({inkSku.skuCode || inkSku.id}) - {formatLAK(inkSku.unitPrice || inkSku.costPerPurchaseUnit || 0)}
                      </option>
                    ))}
                  </select>

                  {item.linkedInkItem ? (
                    <div className="mt-1 space-y-0.5">
                      <span className="text-[10px] text-emerald-700 font-bold block flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{currentLang === 'lo' ? 'ຜູກແລ້ວ:' : 'Linked:'} {item.linkedInkItem.name}</span>
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono block">
                        Vol: {item.actualVol} ml | Price: {formatLAK(item.actualInkPrice)}
                      </span>
                      <span className="text-[10px] font-black text-sky-700 block">
                        ⚡ {currentLang === 'lo' ? 'ຄາດວ່າພິມໄດ້:' : 'Est. Yield:'} {item.scaledRateMl > 0 ? Math.round(item.actualVol / item.scaledRateMl).toLocaleString() : 0} {currentLang === 'lo' ? 'ແຜ່ນ' : 'pages'} (@{coveragePercent}%)
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-amber-600 block mt-1">
                      {currentLang === 'lo' ? 'ຍັງບໍ່ທັນໄດ້ຜູກໝຶກໃນສາງ' : 'No inventory ink linked yet'}
                    </span>
                  )}
                </td>

                {/* Actual Cost per page */}
                <td className="py-3 px-4 text-right font-mono font-black text-sky-700 text-base">
                  {formatLAK(item.actualCostPerPage)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sync Action Footer */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <AlertCircle className="w-4 h-4 text-sky-600 shrink-0" />
          <span>{currentLang === 'lo' ? 'ຕົ້ນທຶນໝຶກຈິງຈະຖືກນຳໄປໃຊ້ຄຳນວນໃນໃບສະເໜີລາຄາອັດໂນມັດ' : 'Synced actual ink costs feed directly into Quotation Engine unit rates'}</span>
        </div>

        <button
          onClick={handleSyncToEngine}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-sky-600/20 transition active:scale-95 cursor-pointer shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{currentLang === 'lo' ? 'ອັບເດັດຕົ້ນທຶນหมึกเข้า Quotation Engine' : 'Sync Actual Cost to Quotation Engine'}</span>
        </button>
      </div>
    </div>
  );
}
