import React, { useState, useEffect } from 'react';
import { 
  Droplet, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  X, 
  Layers, 
  Palette, 
  Check, 
  Trash2, 
  SlidersHorizontal,
  Box,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useApp } from '@store/AppContext';
import { FormModalTemplate } from '@components/common/FormModalTemplate';

interface PrinterInkComparisonCardProps {
  printerItem: any;
  currentLang?: string;
}

export default function PrinterInkComparisonCard({ printerItem, currentLang = 'lo' }: PrinterInkComparisonCardProps) {
  const { inventory, printerColorLinks, addPrinterColorLink, deletePrinterColorLink, updateEquipment, showToast, formatCurrency, refreshData } = useApp();
  const formatLAK = formatCurrency;

  // Selected Ink Coverage preset: 5 (ISO standard), 15 (Text + Logo), 30 (Graphics), 50 (Full Bleed Photo)
  const [coveragePercent, setCoveragePercent] = useState<number>(5);

  // Search Modal State
  const [searchModalSlot, setSearchModalSlot] = useState<{
    slotPos: string;
    colorGroup: string;
    oemInkCode: string;
    oemVol: number;
    oemYield: number;
    oemPrice: number;
    currentLinkedId?: string;
  } | null>(null);

  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [colorFilter, setColorFilter] = useState<string>('ALL');

  const formatUnitLAK = (val: number) => {
    if (!val || isNaN(val)) return 'LAK 0';
    if (Math.abs(val) < 100) return `LAK ${val.toFixed(2)}`;
    return formatLAK(Math.round(val * 100) / 100);
  };

  // Comprehensive Live Inks from PostgreSQL Database
  const [dbInks, setDbInks] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch Inbound Transactions from PostgreSQL
    const p1 = fetch('/api/inbound')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const items = Array.isArray(data) ? data : (data?.data || []);
        return items.filter((i: any) => {
          const c = (i.category || '').toUpperCase();
          const sku = (i.skuCode || i.id || '').toUpperCase();
          const name = (i.itemName || i.name || '').toUpperCase();
          return c.includes('INK') || name.includes('INK') || name.includes('TONER') || name.includes('ໝຶກ') || sku.startsWith('INK');
        }).map((m: any) => {
          const resolvedColor = m.specs?.colorGroup || m.specs?.colorName || m.colorGroup || (
            (m.itemName || '').toLowerCase().includes('cyan') || (m.itemName || '').toLowerCase().includes('-c') ? 'Cyan' :
            (m.itemName || '').toLowerCase().includes('magenta') || (m.itemName || '').toLowerCase().includes('-m') ? 'Magenta' :
            (m.itemName || '').toLowerCase().includes('yellow') || (m.itemName || '').toLowerCase().includes('-y') ? 'Yellow' :
            (m.itemName || '').toLowerCase().includes('black') || (m.itemName || '').toLowerCase().includes('-bk') ? 'Black' : 'Custom'
          );

          return {
            id: m.skuCode || m.id,
            sku: m.skuCode || m.id,
            skuCode: m.skuCode || m.id,
            name: m.itemName || m.name || m.skuCode || m.id,
            category: m.category || 'Ink',
            colorGroup: resolvedColor,
            supplier: m.supplierName || m.supplier || 'Supplier',
            supplierName: m.supplierName || m.supplier || 'Supplier',
            stockQty: Number(m.quantity || m.importQty || 0),
            unitPrice: m.totalPrice && m.quantity ? Math.round(Number(m.totalPrice) / Number(m.quantity)) : Number(m.unitPrice || m.totalPrice || 0),
            costPerPurchaseUnit: m.totalPrice && m.quantity ? Math.round(Number(m.totalPrice) / Number(m.quantity)) : Number(m.unitPrice || m.totalPrice || 0),
            costPerConsumptionUnit: m.totalPrice && m.quantity ? Math.round(Number(m.totalPrice) / Number(m.quantity)) : Number(m.unitPrice || m.totalPrice || 0),
            consumptionUnit: m.unit || 'ຕຸກ',
            purchaseUnit: m.unit || 'ຕຸກ',
            imageUrl: m.specs?.productImage || m.imageUrl || m.productImage || (m.actual_images && m.actual_images[0]) || null,
            productImage: m.specs?.productImage || m.imageUrl || m.productImage || (m.actual_images && m.actual_images[0]) || null,
            brand: m.specs?.brand || m.brand || '',
            volume: Number(m.specs?.volume || m.specs?.volume_ml || 140),
            specs: { ...(m.specs || {}), colorGroup: resolvedColor }
          };
        });
      })
      .catch(() => []);

    // 2. Fetch Materials Items from PostgreSQL
    const p2 = fetch('/api/inventory/items')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const items = Array.isArray(data) ? data : (data?.data || []);
        return items.filter((i: any) => {
          const c = (i.category || '').toUpperCase();
          const sku = (i.skuCode || i.sku || i.id || '').toUpperCase();
          const name = (i.name || '').toUpperCase();
          return c.includes('INK') || name.includes('INK') || name.includes('TONER') || name.includes('ໝຶກ') || sku.startsWith('INK');
        }).map((m: any) => ({
          id: m.id || m.sku || m.inkCode,
          sku: m.sku || m.inkCode || m.id,
          skuCode: m.sku || m.inkCode || m.id,
          name: m.name || m.id,
          category: m.category || 'Ink',
          colorGroup: m.specs?.colorGroup || m.colorGroup || 'Black',
          supplier: m.supplier || 'Inventory',
          stockQty: Number(m.stockQty || 0),
          unitPrice: Number(m.unitPrice || m.costPerPurchaseUnit || 0),
          costPerPurchaseUnit: Number(m.costPerPurchaseUnit || m.unitPrice || 0),
          costPerConsumptionUnit: Number(m.costPerConsumptionUnit || m.unitPrice || 0),
          consumptionUnit: m.consumptionUnit || 'ຕຸກ',
          purchaseUnit: m.purchaseUnit || 'ຕຸກ',
          imageUrl: m.imageUrl || m.productImage || m.specs?.productImage || null,
          productImage: m.imageUrl || m.productImage || m.specs?.productImage || null,
          brand: m.specs?.brand || m.brand || '',
          volume: Number(m.specs?.volume || m.specs?.volume_ml || 140),
          specs: m.specs || {}
        }));
      })
      .catch(() => []);

    Promise.all([p1, p2]).then(([inbInks, matInks]) => {
      const combined = [...(inbInks || []), ...(matInks || [])];
      setDbInks(combined);
    });
  }, []);

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

  // Filter and merge all inventory items and PostgreSQL inbound ink entries
  const allInkItems = [...inventory, ...dbInks];
  const inkMap = new Map();
  allInkItems.forEach(item => {
    const cat = (item.category || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    const sku = (item.skuCode || item.sku || item.id || '').toLowerCase();
    const isInk = cat.includes('ink') || cat.includes('ໝຶກ') || cat.includes('toner') || 
                  name.includes('ink') || name.includes('ໝຶກ') || name.includes('epson') || name.includes('brother') || name.includes('canon') ||
                  sku.startsWith('ink') || sku.startsWith('ton') || item.category === 'Consumable' || item.category === 'Raw Material';
    if (isInk && item.id && !inkMap.has(item.id)) {
      inkMap.set(item.id, item);
    }
  });
  const inkInventory = Array.from(inkMap.values());

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
    const linkedInkItem = activeLink ? inkInventory.find(inv => inv.id === activeLink.inkCode || inv.skuCode === activeLink.inkCode || inv.sku === activeLink.inkCode) : null;

    let actualCostPerPage = oemCostPerPage; // Fallback to OEM cost if not linked
    let actualInkPrice = oemPrice;
    let actualVol = oemVol;

    if (linkedInkItem) {
      totalLinkedSlots += 1;
      actualInkPrice = Number(linkedInkItem.unitPrice || linkedInkItem.costPerPurchaseUnit || 0);
      
      const resolvedVol = Number(
        linkedInkItem.volume || 
        linkedInkItem.specs?.volume || 
        linkedInkItem.specs?.volume_ml || 
        linkedInkItem.specs?.oemStandardVolumeMl || 
        linkedInkItem.specs?.oemVolumeMl || 
        linkedInkItem.oemStandardVolumeMl || 
        (linkedInkItem.purchaseMultiplier > 1 ? linkedInkItem.purchaseMultiplier : null)
      );

      actualVol = resolvedVol && resolvedVol > 1 ? resolvedVol : 140;
      const actualCostPerMl = actualVol > 0 ? (actualInkPrice / actualVol) : 0;

      const linkedYield = Number(
        linkedInkItem.yield ||
        linkedInkItem.standard_page_yield ||
        linkedInkItem.standardPageYield ||
        linkedInkItem.specs?.yield ||
        linkedInkItem.specs?.expectedYield ||
        linkedInkItem.specs?.standard_page_yield ||
        linkedInkItem.specs?.isoYield ||
        0
      );

      const actualRateMlPerSheet = linkedYield > 0 ? (actualVol / linkedYield) : isoRateMlPerSheet;
      const actualScaledRateMl = actualRateMlPerSheet * coverageMultiplier;
      actualCostPerPage = actualCostPerMl * actualScaledRateMl;
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

  // Link Ink Handler
  const handleLinkInk = (slotPos: string, inkSkuId: string) => {
    if (!inkSkuId) return;

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
        ? `ຜູກໝຶກພິມເຂົ້າກັບ "${slotPos}" ສຳເລັດ!` 
        : `Linked Ink SKU to "${slotPos}" successfully!`, 
      'success'
    );
    setSearchModalSlot(null);
  };

  // Unlink Ink Handler
  const handleUnlinkInk = (slotPos: string) => {
    const existing = activeLinks.find(lnk => lnk.slotPosition === slotPos);
    if (existing) {
      deletePrinterColorLink(existing.id);
      showToast(
        currentLang === 'lo' ? `ຍົກເລີກການຜູກໝຶກໃນ "${slotPos}" ສຳເລັດ` : `Unlinked ink from "${slotPos}"`,
        'info'
      );
    }
    setSearchModalSlot(null);
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

  // Open Search Modal with auto-selected color filter matching target slot
  const openSearchModalForSlot = (slotItem: any) => {
    setColorFilter('ALL'); // Default to All so user immediately sees all available warehouse inks
    setSearchKeyword('');
    setSearchModalSlot({
      slotPos: slotItem.slotPos,
      colorGroup: slotItem.colorGroup,
      oemInkCode: slotItem.oemSlot.oemInkCode || 'OEM Standard',
      oemVol: slotItem.oemVol,
      oemYield: slotItem.oemYield,
      oemPrice: slotItem.oemPrice,
      currentLinkedId: slotItem.linkedInkItem?.id
    });
  };

  // Filtered inks for Search Modal with robust color classification
  const filteredModalInks = inkInventory.filter(item => {
    const name = (item.name || '').toLowerCase();
    const sku = (item.skuCode || item.sku || item.id || '').toLowerCase();
    const brand = (item.brand || item.specs?.brand || '').toLowerCase();
    const query = searchKeyword.toLowerCase().trim();

    const matchesSearch = !query || name.includes(query) || sku.includes(query) || brand.includes(query);

    let matchesColor = true;
    if (colorFilter !== 'ALL') {
      const c = colorFilter.toLowerCase();
      const explicitColor = (item.specs?.colorGroup || item.specs?.colorName || item.colorGroup || '').toLowerCase();

      if (explicitColor) {
        matchesColor = explicitColor.includes(c);
      } else {
        if (c === 'black') {
          matchesColor = name.includes('black') || name.includes('ດຳ') || sku.endsWith('-bk') || sku.endsWith('-k') || name.includes(' bk');
        } else if (c === 'cyan') {
          matchesColor = name.includes('cyan') || name.includes('ຟ້າ') || sku.endsWith('-c') || name.includes(' - c') || name.includes(' c');
        } else if (c === 'magenta') {
          matchesColor = name.includes('magenta') || name.includes('ບົວ') || name.includes('ແດງ') || sku.endsWith('-m') || name.includes(' - m') || name.includes(' m');
        } else if (c === 'yellow') {
          matchesColor = name.includes('yellow') || name.includes('ເຫຼືອງ') || sku.endsWith('-y') || name.includes(' - y') || name.includes(' y');
        }
      }
    }

    return matchesSearch && matchesColor;
  });

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
            <div className="p-1.5 bg-slate-800 rounded-lg text-sky-400 font-bold text-sm">
              <SlidersHorizontal className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">
                {currentLang === 'lo' 
                  ? 'ຂໍ້ມູນສະເປັກມາດຕະຖານອັດຕາສິ້ນເປືອງໝຶກໂຮງງານ OEM (Factory Baseline Specs)' 
                  : 'OEM Factory Baseline Specs'}
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold">
                {currentLang === 'lo'
                  ? 'ນຳໃຊ້ອັດຕາສິ້ນເປືອງ ml/ແຜ່ນ ຈາກສະເປັກໂຮງງານ ຄູນກັບລາຄາໝຶກທີ່ຊື້ຈິງໃນສາງ'
                  : 'Multiply factory baseline ml/page rates by real inventory purchase prices'}
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
                  <span className="text-sky-400 font-extrabold">{slot.colorGroup || ''}</span>
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
            <span className="text-xl font-black font-mono text-sky-800">{formatUnitLAK(totalActualCostPerPage)} / {currentLang === 'lo' ? 'ແຜ່ນ' : 'page'}</span>
            <span className="text-xs font-bold text-sky-600">
              {totalLinkedSlots} of {slotComparisons.length} {currentLang === 'lo' ? 'ຊ່ອງສີຜູກແລ້ວ' : 'slots linked to Inventory'}
            </span>
          </div>
          <span className="text-[10px] text-sky-600 block font-semibold">
            {currentLang === 'lo' ? 'ຕົ້ນທຶນນີ້ຈະຖືກໃຊ້ໃນລະບົບໃບສະເໜີລາຄາ (Synced with Quotation Engine)' : 'Calculated dynamically using real inventory purchase prices & bottle sizes'}
          </span>
        </div>
      </div>

      {/* Per-Slot Comparison Table & Search Linker */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-black text-xs leading-relaxed">
              <th className="py-3.5 px-4">{currentLang === 'lo' ? 'ຊ່ອງສີ (Slot)' : 'Color Slot'}</th>
              <th className="py-3.5 px-4">{currentLang === 'lo' ? 'ສະເປັກອັດຕາສິ້ນເປືອງໂຮງງານ' : 'Factory ISO Rate Baseline'}</th>
              <th className="py-3.5 px-4">{currentLang === 'lo' ? 'ໝຶກທີ່ຜູກໃນສາງ (Inventory Ink)' : 'Actual Linked Ink SKU in Inventory'}</th>
              <th className="py-3.5 px-4 text-right">{currentLang === 'lo' ? 'ຕົ້ນທຶນຈິງ / ແຜ່ນ' : 'Actual Cost / Page'}</th>
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

                {/* Linked Ink SKU Card & Search Launcher */}
                <td className="py-3 px-4 min-w-[280px]">
                  {item.linkedInkItem ? (
                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-extrabold text-slate-900 text-xs truncate max-w-[150px]">{item.linkedInkItem.name}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[9px] font-black uppercase">
                          {item.linkedInkItem.skuCode || item.linkedInkItem.id}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200/60 pt-1">
                        <span>{item.actualVol} ml • {formatLAK(item.actualInkPrice)}</span>
                        <span className="font-mono font-bold text-sky-700">
                          {currentLang === 'lo' ? 'ຜົນຜະລິດ: ' : 'Yield: '}{item.scaledRateMl > 0 ? Math.round(item.actualVol / item.scaledRateMl).toLocaleString() : 0} {currentLang === 'lo' ? 'ແຜ່ນ' : 'pgs'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                        <button
                          onClick={() => openSearchModalForSlot(item)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-[10px] rounded-xl border border-sky-200 transition cursor-pointer"
                        >
                          <Search className="w-3 h-3" />
                          <span>{currentLang === 'lo' ? 'ຄົ້ນຫາ / ປ່ຽນໝຶກ' : 'Search / Change'}</span>
                        </button>
                        <button
                          onClick={() => handleUnlinkInk(item.slotPos)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title={currentLang === 'lo' ? 'ຍົກເລີກການຜູກ' : 'Unlink'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => openSearchModalForSlot(item)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-sky-50 text-sky-700 hover:text-sky-800 font-bold text-xs rounded-2xl border-2 border-dashed border-sky-300 hover:border-sky-500 transition cursor-pointer shadow-2xs group"
                    >
                      <Search className="w-4 h-4 text-sky-500 group-hover:scale-110 transition" />
                      <span>{currentLang === 'lo' ? 'ກົດເພື່ອຄົ້ນຫາໝຶກໃນສາງ...' : 'Search & Link Inventory Ink...'}</span>
                    </button>
                  )}
                </td>

                {/* Actual Cost per page */}
                <td className="py-3 px-4 text-right font-mono font-black text-sky-700 text-base">
                  {formatUnitLAK(item.actualCostPerPage)}
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
          <span>{currentLang === 'lo' ? 'ອັບເດດຕົ້ນທຶນໝຶກເຂົ້າ Quotation Engine' : 'Sync Actual Cost to Quotation Engine'}</span>
        </button>
      </div>

      {/* SEARCH & SELECT INVENTORY INK MODAL - UNIFIED FORM MODAL TEMPLATE */}
      {searchModalSlot && (
        <FormModalTemplate
          isOpen={!!searchModalSlot}
          onClose={() => setSearchModalSlot(null)}
          icon={<Palette className="w-5.5 h-5.5 text-white" />}
          title={currentLang === 'lo' ? 'ຄົ້ນຫາ ແລະ ເລືອກໝຶກພິມໃນສາງ' : 'Search & Select Warehouse Ink'}
          subtitle={
            currentLang === 'lo'
              ? `ກຳລັງເລືອກໃສ່: ${searchModalSlot.slotPos} • OEM Baseline: ${searchModalSlot.oemInkCode} (${searchModalSlot.oemVol}ml)`
              : `Targeting Slot: ${searchModalSlot.slotPos} • OEM Baseline: ${searchModalSlot.oemInkCode} (${searchModalSlot.oemVol}ml)`
          }
          badgeText={searchModalSlot.colorGroup}
          maxWidthClass="max-w-6xl w-full"
          footerActions={
            <div className="w-full flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                {currentLang === 'lo' 
                  ? `ພົບທັງໝົດ ${filteredModalInks.length} ລາຍການໝຶກພິມໃນສາງ` 
                  : `Found ${filteredModalInks.length} inventory inks`}
              </span>
              <button
                type="button"
                onClick={() => setSearchModalSlot(null)}
                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-2xl transition cursor-pointer"
              >
                {currentLang === 'lo' ? 'ປິດໜ້າຕ່າງ' : 'Close'}
              </button>
            </div>
          }
        >
          {/* Search Input, Filters & Stock Summary Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search Box */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={currentLang === 'lo' ? 'ຄົ້ນຫາຕາມຊື່ໝຶກ, SKU, ລະຫັດສີ, ຫຼື ຍີ່ຫໍ້...' : 'Search by Ink name, SKU code, color, brand...'}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50/60 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white shadow-2xs placeholder:text-slate-400 text-slate-800 transition"
                  autoFocus
                />
                {searchKeyword && (
                  <button
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Target Slot OEM Hint Pill */}
              <div className="shrink-0 hidden sm:flex items-center gap-2 px-3.5 py-2 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono text-slate-600 shadow-2xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
                <span>Coverage: <b className="text-slate-900">@{coveragePercent}%</b></span>
              </div>
            </div>

            {/* Color Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
              {[
                { id: 'ALL', label: currentLang === 'lo' ? 'ທັງໝົດ' : 'All', colorDot: 'bg-slate-400' },
                { id: 'Black', label: currentLang === 'lo' ? 'ສີດຳ (Black)' : 'Black', colorDot: 'bg-slate-900' },
                { id: 'Cyan', label: currentLang === 'lo' ? 'ສີຟ້າ (Cyan)' : 'Cyan', colorDot: 'bg-cyan-500' },
                { id: 'Magenta', label: currentLang === 'lo' ? 'ສີບົວ (Magenta)' : 'Magenta', colorDot: 'bg-pink-500' },
                { id: 'Yellow', label: currentLang === 'lo' ? 'ສີເຫຼືອງ (Yellow)' : 'Yellow', colorDot: 'bg-amber-400' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setColorFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap border ${
                    colorFilter === tab.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${tab.colorDot}`} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Inks Cards Grid (Styled matching Inbound & Inventory Cards) */}
          <div className="pt-2">
            {filteredModalInks.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2 bg-white rounded-2xl border border-slate-200/80">
                <Box className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-extrabold text-slate-700">{currentLang === 'lo' ? 'ບໍ່ພົບລາຍການໝຶກພິມທີ່ກົງກັບເງື່ອນໄຂ' : 'No matching ink found in warehouse'}</p>
                <p className="text-xs text-slate-400">{currentLang === 'lo' ? 'ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ເລືອກແທັບ "ທັງໝົດ"' : 'Try changing search keyword or filter tab'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
                {filteredModalInks.map((ink: any) => {
                  const isCurrent = searchModalSlot.currentLinkedId === ink.id;
                  const price = Number(ink.unitPrice || ink.costPerPurchaseUnit || 0);
                  const vol = Number(ink.volume || ink.specs?.volume || ink.specs?.volume_ml || 140);
                  const costPerMl = vol > 0 ? price / vol : 0;
                  const stock = Number(ink.stockQty || 0);

                  // Preview estimated cost per page for target slot
                  const isoRate = searchModalSlot.oemYield > 0 ? (searchModalSlot.oemVol / searchModalSlot.oemYield) : 0.0169;
                  const estCostPerPage = costPerMl * (isoRate * coverageMultiplier);

                  // Resolved photo url from item
                  const photoUrl = ink.imageUrl || ink.productImage || ink.docs?.productPhoto || ink.specs?.productImageUrl || ink.specs?.productImage;

                  // Color theme
                  const nameLower = (ink.name || '').toLowerCase();
                  const isBlack = nameLower.includes('black') || nameLower.includes('bk') || nameLower.includes('ດຳ');
                  const isCyan = nameLower.includes('cyan') || nameLower.includes('ຟ້າ');
                  const isMagenta = nameLower.includes('magenta') || nameLower.includes('ບົວ') || nameLower.includes('ແດງ');
                  const isYellow = nameLower.includes('yellow') || nameLower.includes('ເຫຼືອງ');

                  const colorAccentClass = isBlack ? 'border-t-slate-900' : isCyan ? 'border-t-cyan-500' : isMagenta ? 'border-t-pink-500' : isYellow ? 'border-t-amber-400' : 'border-t-sky-500';

                  return (
                    <div 
                      key={ink.id}
                      className={`bg-white rounded-2xl border-2 border-t-4 ${colorAccentClass} p-4 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 ${
                        isCurrent 
                          ? 'border-emerald-500 ring-2 ring-emerald-200 shadow-md bg-emerald-50/20' 
                          : 'border-slate-200/80 hover:border-sky-400'
                      }`}
                    >
                      {/* Top: Photo & SKU Details */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          {/* Product Photo / Thumbnail */}
                          <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                            {photoUrl && !photoUrl.includes('data:image/svg') ? (
                              <img src={photoUrl} alt={ink.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full flex flex-col items-center justify-center text-[10px] font-black uppercase text-white ${
                                isBlack ? 'bg-slate-900' : isCyan ? 'bg-cyan-500' : isMagenta ? 'bg-pink-500' : isYellow ? 'bg-amber-400 text-slate-900' : 'bg-sky-500'
                              }`}>
                                <Droplet className="w-6 h-6 mb-0.5" />
                                <span>{isBlack ? 'K' : isCyan ? 'C' : isMagenta ? 'M' : isYellow ? 'Y' : 'INK'}</span>
                              </div>
                            )}
                          </div>

                          {/* Item Meta */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono text-[10px] font-extrabold uppercase truncate">
                                {ink.skuCode || ink.sku || ink.id}
                              </span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[9px] font-black uppercase flex items-center gap-1 shrink-0">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{currentLang === 'lo' ? 'ຜູກແລ້ວ' : 'Linked'}</span>
                                </span>
                              )}
                            </div>
                            <h4 className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-2" title={ink.name}>
                              {ink.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-semibold truncate">
                              {ink.brand || ink.specs?.brand || 'Standard Brand'} • {ink.supplier || ink.supplierName || 'Inventory'}
                            </p>
                          </div>
                        </div>

                        {/* Pricing & Volume Strip */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-xs font-semibold">
                          <div className="flex justify-between items-center text-slate-700">
                            <span className="text-slate-400 text-[11px]">{currentLang === 'lo' ? 'ລາຄາຊື້ / ຕຸກ:' : 'Purchase Price:'}</span>
                            <span className="font-mono font-black text-slate-900 text-sm">{formatLAK(price)}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600 text-[11px] pt-1 border-t border-slate-200/60">
                            <span>{currentLang === 'lo' ? 'ບໍລິມາດ:' : 'Volume:'} <b className="font-mono text-slate-800">{vol} ml</b></span>
                            <span>{currentLang === 'lo' ? 'ຕົ້ນທຶນ:' : 'Rate:'} <b className="font-mono text-sky-700">{formatLAK(costPerMl)}/ml</b></span>
                          </div>
                        </div>

                        {/* Live Estimated Cost per Page Highlight */}
                        <div className="p-2.5 bg-sky-50/80 rounded-xl border border-sky-200/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-sky-800 font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span className="text-[11px]">{currentLang === 'lo' ? 'ຕົ້ນທຶນຕໍ່ແຜ່ນ:' : 'Cost / Page:'}</span>
                          </div>
                          <span className="font-mono font-black text-sky-900 text-sm">
                            {formatLAK(estCostPerPage)} / {currentLang === 'lo' ? 'ແຜ່ນ' : 'pg'}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${
                          stock > 0 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {stock > 0 
                            ? `${currentLang === 'lo' ? 'ມີໃນສາງ: ' : 'Stock: '} ${stock} ${ink.consumptionUnit || 'ຕຸກ'}`
                            : (currentLang === 'lo' ? 'ໝົດສາງ (0 ຕຸກ)' : 'Out of Stock')}
                        </span>

                        {isCurrent ? (
                          <button
                            onClick={() => handleUnlinkInk(searchModalSlot.slotPos)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{currentLang === 'lo' ? 'ຍົກເລີກ' : 'Unlink'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLinkInk(searchModalSlot.slotPos, ink.id)}
                            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{currentLang === 'lo' ? 'ເລືອກຜູກ' : 'Select'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </FormModalTemplate>
      )}
    </div>
  );
}


