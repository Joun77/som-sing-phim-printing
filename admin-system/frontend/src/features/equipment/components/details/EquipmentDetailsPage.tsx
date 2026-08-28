import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle, 
  ShieldAlert, 
  Wrench, 
  Printer, 
  Layers, 
  Clock, 
  Camera, 
  FileText,
  ExternalLink,
  Laptop,
  Gauge,
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Droplet,
  RotateCcw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@store/AppContext';
import ConfirmDeleteModal, { DeleteActionButton } from '@components/common/ConfirmDeleteModal';
import EditEquipmentModal from '../modals/EditEquipmentModal';
import RecordMeterModal from '../modals/RecordMeterModal';
import LogDowntimeModal from '../modals/LogDowntimeModal';
import QuickLinkInkModal from '../modals/QuickLinkInkModal';
import QuickSwapConsumableModal from '../modals/QuickSwapConsumableModal';
import PrinterInkComparisonCard from '@features/inventory/components/details/PrinterInkComparisonCard';

export default function EquipmentDetailsPage({ equipmentId, onBack }: { equipmentId: string; onBack: () => void }) {
  const { 
    equipment, 
    inventory, 
    printerColorLinks, 
    deletePrinterColorLink, 
    updateEquipmentMaintenance, 
    updateEquipment,
    deleteEquipment,
    meterReadings,
    downtimeLogs,
    updateDowntimeLog,
    showToast, 
    formatCurrency 
  } = useApp();

  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  
  const machine = equipment ? equipment.find(eq => eq.id === equipmentId) : null;
  const formatLAK = formatCurrency;
  const formatUnitLAK = (val: number) => {
    if (!val || isNaN(val)) return 'LAK 0';
    if (Math.abs(val) < 1) return `LAK ${val.toFixed(2)}`;
    if (Math.abs(val) < 10) return `LAK ${val.toFixed(2)}`;
    return formatCurrency(Math.round(val * 100) / 100);
  };

  // Active sub-tab state: 'specs' | 'meter' | 'maintenance' | 'inks'
  const [activeTab, setActiveTab] = useState<'specs' | 'meter' | 'maintenance' | 'inks'>('specs');

  // Meter filter state: 'daily' | 'weekly' | 'monthly'
  const [meterFilter, setMeterFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Modal open states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRecordMeterOpen, setIsRecordMeterOpen] = useState(false);
  const [isLogDowntimeOpen, setIsLogDowntimeOpen] = useState(false);
  const [isQuickLinkInkOpen, setIsQuickLinkInkOpen] = useState(false);
  const [swapModalConfig, setSwapModalConfig] = useState<{
    isOpen: boolean;
    mode: 'ink' | 'component';
    slotPosition?: string;
    inkSku?: string;
    inkName?: string;
    componentName?: string;
    currentUsage?: number;
  } | null>(null);

  if (!machine) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
        <p className="text-slate-500 font-bold">ບໍ່ພົບຂໍ້ມູນໂປຣໄຟລ໌ເຄື່ອງຈັກ (Machine Profile Not Found)</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          ກັບຄືນຮາຍການເຄື່ອງຈັກ
        </button>
      </div>
    );
  }

  const isCritical = machine.components && machine.components.some((c: any) => c.usage >= (c.threshold || 90));

  const handleDeleteEquipment = () => {
    deleteEquipment(machine.id);
    showToast(
      currentLang === 'lo'
        ? `ລຶບຂໍ້ມູນເຄື່ອງຈັກ "${machine.name}" ສຳເລັດ!`
        : `Deleted equipment "${machine.name}" successfully!`,
      'info'
    );
    onBack();
  };

  // Get printer linked inks
  const linkedLinks = printerColorLinks.filter((lnk: any) => lnk.assetId === machine.id);

  // Get meter readings for this machine
  const machineReadings = meterReadings.filter((m: any) => m.equipmentId === machine.id);

  // Filter meter readings by view (daily / weekly / monthly)
  const filteredReadings = machineReadings.filter((m: any) => {
    if (!m.date) return true;
    const readingDate = new Date(m.date);
    const now = new Date();
    if (meterFilter === 'daily') {
      const diffTime = Math.abs(now.getTime() - readingDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 14;
    } else if (meterFilter === 'weekly') {
      const diffTime = Math.abs(now.getTime() - readingDate.getTime());
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
      return diffWeeks <= 8;
    } else {
      const diffTime = Math.abs(now.getTime() - readingDate.getTime());
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
      return diffMonths <= 12;
    }
  });

  // Get downtime logs for this machine
  const machineDowntimes = downtimeLogs.filter((d: any) => d.equipmentId === machine.id);

  // Financial & Depreciation Math (Robust & Synchronized Model)
  const assetValue = Number(
    machine.MachinePrice ?? 
    machine.price ?? 
    machine.unitPrice ?? 
    machine.purchaseCost ?? 
    machine.purchasePrice ?? 
    machine.unitCost ?? 
    0
  );

  const isPostPressMachine = machine.category !== 'Printer' && machine.category !== 'PRINTER';

  const postPressSubtypeMap: Record<string, string> = {
    guillotine: 'Guillotine Cutter',
    sticker_plotter: 'Sticker Plotter',
    hole_drill: 'Paper Hole Drill',
    binder: 'Paper Binder',
    folder: 'Folder / Creaser',
    laminator: 'Laminator'
  };
  const subtypeLabel = postPressSubtypeMap[machine.postPressSubtype || machine.specs?.postPressSubtype || ''] || machine.postPressSubtype || machine.category || 'Standard';

  const lifespanYears = Number(machine.lifespanYears || machine.specs?.lifespanYears || 5);
  const estMonthlyVolume = Number(machine.estMonthlyVolume || machine.specs?.estMonthlyVolume || 50000);
  const maintenanceRatePct = Number(machine.maintenanceRatePercent || machine.specs?.maintenanceRatePercent || 15);
  const maintCostPerPage = Number(machine.specs?.fixedMaintenanceCostPerPage || 0);

  const totalMonths = lifespanYears * 12;
  const targetLifetimeCapacity = Number(
    machine.TargetTotalPages || 
    machine.printedPagesCapacity || 
    machine.expectedLifeA4Pages || 
    machine.lifetimePagesA4 || 
    (estMonthlyVolume * totalMonths) || 
    3000000
  );

  const currentMeterCount = Number(
    machine.currentMeterCount || 
    machine.current_meter || 
    machine.printedCount || 
    0
  );

  const monthlyDepr = totalMonths > 0 ? (assetValue / totalMonths) : 0;
  const baseCostPerUnit = (estMonthlyVolume > 0 && monthlyDepr > 0)
    ? (monthlyDepr / estMonthlyVolume)
    : (targetLifetimeCapacity > 0 ? (assetValue / targetLifetimeCapacity) : 0);

  const wearAllowancePerUnit = Math.round(baseCostPerUnit * (maintenanceRatePct / 100) * 1000) / 1000 + maintCostPerPage;
  const calculatedNetRate = Math.round((baseCostPerUnit + wearAllowancePerUnit) * 1000) / 1000;
  const netCostPerUnit = calculatedNetRate > 0
    ? calculatedNetRate
    : (machine.costPerConsumptionUnit || machine.calculatedCostPerPage || 0);

  // Comprehensive Live Inks from PostgreSQL Database for accurate real-time costing
  const [dbInks, setDbInks] = useState<any[]>([]);

  useEffect(() => {
    const p1 = fetch('/api/inbound')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const items = Array.isArray(data) ? data : (data?.data || []);
        return items.filter((i: any) => {
          const c = (i.category || '').toUpperCase();
          const sku = (i.skuCode || i.id || '').toUpperCase();
          const name = (i.itemName || i.name || '').toUpperCase();
          return c.includes('INK') || name.includes('INK') || name.includes('TONER') || name.includes('ໝຶກ') || sku.startsWith('INK');
        }).map((m: any) => ({
          id: m.skuCode || m.id,
          sku: m.skuCode || m.id,
          skuCode: m.skuCode || m.id,
          name: m.itemName || m.name || m.skuCode || m.id,
          category: m.category || 'Ink',
          colorGroup: m.specs?.colorGroup || m.colorGroup || 'Black',
          stockQty: Number(m.quantity || 0),
          unitPrice: Number(m.unitPrice || m.costPerPurchaseUnit || (m.totalPrice && m.quantity ? Math.round(Number(m.totalPrice) / Number(m.quantity)) : 0)),
          costPerPurchaseUnit: Number(m.costPerPurchaseUnit || m.unitPrice || 0),
          volume: Number(m.specs?.volume || m.specs?.volume_ml || 140),
          yield: Number(m.specs?.yield || m.specs?.expectedYield || m.specs?.isoYield || m.yield || 0),
          specs: m.specs || {}
        }));
      })
      .catch(() => []);

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
          unitPrice: Number(m.unitPrice || m.costPerPurchaseUnit || 0),
          costPerPurchaseUnit: Number(m.costPerPurchaseUnit || m.unitPrice || 0),
          volume: Number(m.specs?.volume || m.specs?.volume_ml || 140),
          yield: Number(m.specs?.yield || m.specs?.expectedYield || m.specs?.isoYield || m.yield || 0),
          specs: m.specs || {}
        }));
      })
      .catch(() => []);

    Promise.all([p1, p2]).then(([inbInks, matInks]) => {
      setDbInks([...(inbInks || []), ...(matInks || [])]);
    });
  }, []);

  const allAvailableInks = [...inventory, ...dbInks];

  // Extract OEM Baseline Slots (from inbound or specs)
  const oemBaselineSlots = 
    machine?.oem_baseline_specs?.slots || 
    machine?.specs?.oem_baseline_specs?.slots || 
    machine?.oemBaselineInks || 
    machine?.specs?.oemBaselineInks || 
    [
      { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'EPSON-008-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 7500, oemPrice: 450000 },
      { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemInkCode: 'EPSON-008-C', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
      { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemInkCode: 'EPSON-008-M', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
      { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemInkCode: 'EPSON-008-Y', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 }
    ];

  let totalActualCostPerPage = 0;
  const linkedInksDetails = !isPostPressMachine ? oemBaselineSlots.map((oemSlot: any, idx: number) => {
    const slotPos = oemSlot.slotPosition || `Slot ${idx + 1}`;
    const isBlack = (oemSlot.colorGroup || '').toLowerCase().includes('black') || (oemSlot.colorGroup || '').toLowerCase().includes('k') || slotPos.toLowerCase().includes('black') || slotPos.toLowerCase().includes('slot 1');
    const colorGroupName = isBlack ? 'Black' : (oemSlot.colorGroup || (idx === 1 ? 'Cyan' : idx === 2 ? 'Magenta' : idx === 3 ? 'Yellow' : `Color ${idx + 1}`));
    const defaultYield = isBlack ? 7500 : 6000;
    const defaultPrice = isBlack ? 450000 : 320000;
    const defaultVol = isBlack ? 127 : 70;

    const oemVol = Number(oemSlot.oemStandardVolumeMl || oemSlot.volume || defaultVol);
    const rawYield = Number(oemSlot.oemStandardIsoYieldA4 || oemSlot.isoYield || defaultYield);
    const oemYield = rawYield > 500 ? rawYield : defaultYield;
    const oemPrice = Number(oemSlot.oemPrice || defaultPrice);

    const isoRateMlPerSheet = oemYield > 0 ? (oemVol / oemYield) : 0.0169;
    const oemCostPerPage = oemYield > 0 ? (oemPrice / oemYield) : ((oemPrice / oemVol) * isoRateMlPerSheet);

    const activeLink = linkedLinks.find((lnk: any) => 
      lnk.slotPosition === slotPos || 
      (lnk.slotPosition && slotPos && (lnk.slotPosition.includes(slotPos) || slotPos.includes(lnk.slotPosition))) ||
      (lnk.colorGroup && colorGroupName && lnk.colorGroup.toLowerCase() === colorGroupName.toLowerCase()) ||
      (idx === 0 && (lnk.slotPosition?.includes('Slot 1') || lnk.colorGroup?.toLowerCase().includes('black') || lnk.colorGroup?.toLowerCase().includes('k'))) ||
      (idx === 1 && (lnk.slotPosition?.includes('Slot 2') || lnk.colorGroup?.toLowerCase().includes('cyan') || lnk.colorGroup?.toLowerCase().includes('c'))) ||
      (idx === 2 && (lnk.slotPosition?.includes('Slot 3') || lnk.colorGroup?.toLowerCase().includes('magenta') || lnk.colorGroup?.toLowerCase().includes('m'))) ||
      (idx === 3 && (lnk.slotPosition?.includes('Slot 4') || lnk.colorGroup?.toLowerCase().includes('yellow') || lnk.colorGroup?.toLowerCase().includes('y')))
    );

    const linkedInkItem = activeLink ? allAvailableInks.find((inv: any) => inv.id === activeLink.inkCode || inv.skuCode === activeLink.inkCode || inv.sku === activeLink.inkCode) : null;

    let actualCostPerPage = oemCostPerPage;
    let actualInkPrice = oemPrice;
    let actualVol = oemVol;

    if (linkedInkItem) {
      actualInkPrice = Number(linkedInkItem.unitPrice || linkedInkItem.costPerPurchaseUnit || defaultPrice);
      const resolvedVol = Number(
        linkedInkItem.volume || 
        linkedInkItem.specs?.volume || 
        linkedInkItem.specs?.volume_ml || 
        linkedInkItem.specs?.oemStandardVolumeMl || 
        defaultVol
      );
      actualVol = resolvedVol > 1 ? resolvedVol : defaultVol;

      const rawLinkedYield = Number(
        linkedInkItem.yield ||
        linkedInkItem.standard_page_yield ||
        linkedInkItem.standardPageYield ||
        linkedInkItem.specs?.yield ||
        linkedInkItem.specs?.expectedYield ||
        linkedInkItem.specs?.standard_page_yield ||
        linkedInkItem.specs?.isoYield ||
        0
      );
      const actualYield = rawLinkedYield > 500 ? rawLinkedYield : oemYield;
      actualCostPerPage = actualYield > 0 ? (actualInkPrice / actualYield) : ((actualInkPrice / actualVol) * isoRateMlPerSheet);
    }

    totalActualCostPerPage += actualCostPerPage;

    return {
      slot: slotPos,
      colorGroup: colorGroupName,
      sku: activeLink?.inkCode || oemSlot.oemInkCode,
      name: linkedInkItem?.name || oemSlot.oemInkCode || slotPos,
      bottlePrice: actualInkPrice,
      standardVolume: actualVol,
      isoYield: oemYield,
      costPerPage: Math.round(actualCostPerPage * 100) / 100
    };
  }) : [];

  const totalLinkedInkCostPerPage = !isPostPressMachine ? Math.round(totalActualCostPerPage * 100) / 100 : 0;
  const grandTotalCostPerPage = Math.round((netCostPerUnit + totalLinkedInkCostPerPage) * 100) / 100;



  const roiPercent = targetLifetimeCapacity > 0 ? Math.min(100, (currentMeterCount / targetLifetimeCapacity) * 100) : 0;
  const recoveredValue = currentMeterCount * baseCostPerUnit;
  const remainingValue = Math.max(0, assetValue - recoveredValue);
  const maintenanceReserveAccrued = currentMeterCount * wearAllowancePerUnit;

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 font-sans pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-100 rounded-2xl border border-slate-200 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ກັບໜ້າຈັດຮາຍການເຄື່ອງຈັກ' : 'Back to Machinery'}</span>
          </button>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>{machine.name}</span>
            </h2>
            <p className="text-xs font-semibold text-slate-400">ID: {machine.id} | S/N: {machine.serialNumber || machine.sn || '-'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
            isCritical 
              ? 'text-red-600 bg-red-50 border-red-200 animate-pulse' 
              : 'text-emerald-700 bg-emerald-50 border-emerald-200'
          }`}>
            {isCritical ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span>{isCritical ? (currentLang === 'lo' ? 'ຕ້ອງບຳລຸງຮັກສາ' : 'Service Required') : (currentLang === 'lo' ? 'ພ້ອມໃຊ້ງານ' : 'Operational')}</span>
          </span>

          <span className="px-3 py-1 bg-sky-50 text-sky-700 font-mono font-black text-xs rounded-full border border-sky-200 uppercase">
            {subtypeLabel}
          </span>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-xl border border-sky-200 transition cursor-pointer active:scale-95"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>{currentLang === 'lo' ? 'ແກ້ໄຂໂປຣໄຟລ໌' : 'Edit Profile'}</span>
          </button>

          <DeleteActionButton onClick={() => setIsDeleteModalOpen(true)} />
        </div>
      </div>

      {/* COMPREHENSIVE COST-PER-PAGE & PRODUCTION OVERHEAD ENGINE CARD */}
      <div className="bg-white p-6 rounded-3xl border border-sky-200/80 shadow-md space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 text-sky-700">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>{currentLang === 'lo' ? 'ສະຫຼຸບຕົ້ນທຶນການພິມຕໍ່ໜ້າ / ຕໍ່ແຜ່ນ ລວມຍອດ (Total Direct Print Cost Breakdown)' : 'Total Direct Print Cost Breakdown'}</span>
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {currentLang === 'lo'
                  ? 'ຄິດໄລ່ຈາກ: ຄ່າເສື່ອມເຄື່ອງຈັກ + ຄ່າບຳລຸງຮັກສາ/ສວມເສຍ + ຕົ້ນທຶນນ້ຳໝຶກ CMYK ຈາກສາງສິນຄ້າ'
                  : 'Calculated from: Machine Depreciation + Maintenance Reserve + Linked Direct Inks'}
              </p>
            </div>
          </div>

          <div className="bg-sky-50/80 px-5 py-3 rounded-2xl border border-sky-200 text-right shrink-0">
            <span className="text-[10px] uppercase font-black text-sky-800 block tracking-wider">
              {currentLang === 'lo' ? 'ຕົ້ນທຶນລວມການພິມສຸດທິ / ໜ້າ' : 'Grand Total Direct Cost / Page'}
            </span>
            <span className="text-xl font-black font-mono text-sky-700">
              {formatUnitLAK(grandTotalCostPerPage)} <span className="text-xs font-bold text-slate-500">/ {isPostPressMachine ? 'ແຜ່ນ' : 'ໜ້າ'}</span>
            </span>
          </div>
        </div>

        {/* Visual Equation Formula Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-black block">
              {currentLang === 'lo' ? '1. ຄ່າເສື່ອມເຄື່ອງຈັກ' : '1. Machine Depreciation'}
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-black font-mono text-slate-900">{formatUnitLAK(baseCostPerUnit)}</span>
              <span className="text-[10px] text-slate-400 font-bold">/ {isPostPressMachine ? 'ແຜ່ນ' : 'ໜ້າ'}</span>
            </div>
            <span className="text-[9px] text-slate-400 block truncate">
              {formatLAK(assetValue)} / {targetLifetimeCapacity.toLocaleString()}
            </span>
          </div>

          <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-1">
            <span className="text-[10px] text-indigo-700 uppercase font-black block">
              {currentLang === 'lo' ? `2. ບຳລຸງຮັກສາ (+${maintenanceRatePct}%)` : `2. Maint. (+${maintenanceRatePct}%)`}
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-black font-mono text-indigo-700">+{formatUnitLAK(wearAllowancePerUnit)}</span>
              <span className="text-[10px] text-indigo-400 font-bold">/ {isPostPressMachine ? 'ແຜ່ນ' : 'ໜ້າ'}</span>
            </div>
            <span className="text-[9px] text-indigo-500 block truncate">
              {currentLang === 'lo' ? 'ສຳຮອງຊິ້ນສ່ວນ & ຊ່າງສ້ອມ' : 'Spare parts & repair clause'}
            </span>
          </div>

          {!isPostPressMachine ? (
            <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-1">
              <span className="text-[10px] text-purple-700 uppercase font-black block">
                {currentLang === 'lo' ? `3. ຕົ້ນທຶນນ້ຳໝຶກ (${linkedInksDetails.length} ສີ)` : `3. Linked Inks Cost`}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-black font-mono text-purple-700">+{formatUnitLAK(totalLinkedInkCostPerPage)}</span>
                <span className="text-[10px] text-purple-400 font-bold">/ ໜ້າ A4</span>
              </div>
              <span className="text-[9px] text-purple-500 block truncate">
                {linkedInksDetails.length > 0 
                  ? linkedInksDetails.map(i => `${i.colorGroup || i.slot}: ${formatUnitLAK(i.costPerPage)}`).join(' | ') 
                  : (currentLang === 'lo' ? 'ຍັງບໍ່ໄດ້ຜູກໝຶກ' : 'No inks linked')}
              </span>

            </div>
          ) : (
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 space-y-1">
              <span className="text-[10px] text-amber-700 uppercase font-black block">
                {currentLang === 'lo' ? '3. ຄ່າສວມໃບມີດ/ອຸປະກອນ' : '3. Tooling Wear'}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-black font-mono text-amber-700">+0 LAK</span>
                <span className="text-[10px] text-amber-400 font-bold">/ ແຜ່ນ</span>
              </div>
              <span className="text-[9px] text-amber-500 block truncate">
                {currentLang === 'lo' ? 'ລວມໃນຄ່າບຳລຸງຮັກສາແລ້ວ' : 'Included in maint rate'}
              </span>
            </div>
          )}

          <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 space-y-1">
            <span className="text-[10px] text-emerald-800 uppercase font-black block">
              {currentLang === 'lo' ? '4. ຕົ້ນທຶນລວມສຸດທິ (Total)' : '4. Net Combined Rate'}
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-black font-mono text-emerald-700">={formatUnitLAK(grandTotalCostPerPage)}</span>
              <span className="text-[10px] text-emerald-600 font-bold">/ {isPostPressMachine ? 'ແຜ່ນ' : 'ໜ້າ'}</span>
            </div>
            <span className="text-[9px] text-emerald-600 font-bold block truncate">
              {currentLang === 'lo' ? 'ຄ່າເສື່ອມ + ບຳລຸງ + ໝຶກ' : 'Amortized + Maint + Ink'}
            </span>
          </div>
        </div>


        {/* Financial Reserve & Planning Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {currentLang === 'lo' ? 'ເປົ້າໝາຍການຜະລິດລາຍເດືອນ' : 'Monthly Target'}
            </span>
            <span className="text-xs font-mono font-black text-slate-900 mt-0.5 block">
              {estMonthlyVolume.toLocaleString()} {isPostPressMachine ? 'ແຜ່ນ' : 'ໜ້າ'}/ເດືອນ
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {currentLang === 'lo' ? 'ເປົ້າໝາຍຕະຫຼອດອາຍຸງານ' : 'Lifetime Target'}
            </span>
            <span className="text-xs font-mono font-black text-slate-900 mt-0.5 block">
              {targetLifetimeCapacity.toLocaleString()} {isPostPressMachine ? 'ແຜ່ນ' : 'ໜ້າ'} ({lifespanYears} ປີ)
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {currentLang === 'lo' ? 'ກອງທຶນສຳຮອງບຳລຸງຮັກສາສະສົມ' : 'Accrued Maint. Reserve'}
            </span>
            <span className="text-xs font-mono font-black text-indigo-700 mt-0.5 block">
              {formatLAK(maintenanceReserveAccrued)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {currentLang === 'lo' ? 'ມູນຄ່າເຄື່ອງຈັກຄົງເຫຼືອ (Book Value)' : 'Remaining Book Value'}
            </span>
            <span className="text-xs font-mono font-black text-emerald-700 mt-0.5 block">
              {formatLAK(remainingValue)}
            </span>
          </div>
        </div>
      </div>

      {/* ROI & Amortization Progress Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/20 rounded-2xl border border-sky-400/30">
              <TrendingUp className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <span>{currentLang === 'lo' ? 'ຕົວຊີ້ວັດ ROI & ຄ່າເສື່ອມລາຄາເຄື່ອງຈັກ (Asset ROI & Amortization)' : 'Asset ROI & Amortization Metrics'}</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {currentLang === 'lo' 
                  ? `ສູດຄິດໄລ່: ລາຄາຊື້ / (${lifespanYears} ປີ × 12 ເດືອນ × ${estMonthlyVolume.toLocaleString()} ໜ່ວຍ) + ອັດຕາບຳລຸງຮັກສາ ${maintenanceRatePct}%`
                  : `Calculation Model: Asset Price / (${lifespanYears} Yrs × 12 Mos × ${estMonthlyVolume.toLocaleString()} Units) + ${maintenanceRatePct}% Maint.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {currentLang === 'lo' ? 'ຕົ້ນທຶນຄ່າເສື່ອມສຸດທິ / ໜ່ວຍ' : 'Net Effective Rate / Unit'}
              </span>
              <span className="text-base font-black font-mono text-emerald-400">
                {formatUnitLAK(netCostPerUnit)} / {isPostPressMachine ? (currentLang === 'lo' ? 'ແຜ່ນ' : 'unit') : (currentLang === 'lo' ? 'ໜ້າ' : 'unit')}
              </span>
            </div>
          </div>
        </div>

        {/* ROI Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-300">
              {currentLang === 'lo' ? 'ຈຳນວນທີ່ຜະລິດແລ້ວ: ' : 'Usage Count: '}
              <strong className="font-mono text-white text-sm">{currentMeterCount.toLocaleString()}</strong> / {targetLifetimeCapacity.toLocaleString()} {currentLang === 'lo' ? 'ໜ່ວຍເປົ້າໝາຍ' : 'units target'}
            </span>
            <span className="font-mono text-sky-400 font-black text-sm">
              {roiPercent.toFixed(1)}% {currentLang === 'lo' ? 'ຄືນທຶນແລ້ວ' : 'Amortized'}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden p-0.5 border border-slate-600">
            <div 
              className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, roiPercent)}%` }}
            />
          </div>
        </div>

        {/* Financial Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {currentLang === 'lo' ? 'ມູນຄ່າເຄື່ອງຈັກ' : 'Asset Price'}
            </span>
            <span className="font-mono font-black text-slate-100">{formatLAK(assetValue)}</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {currentLang === 'lo' ? 'ຄ່າເສື່ອມພື້ນຖານ' : 'Base Depreciation'}
            </span>
            <span className="font-mono font-black text-sky-400">
              {formatUnitLAK(baseCostPerUnit)} / {isPostPressMachine ? 'ແຜ່ນ' : 'ໜ້າ'}
            </span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {currentLang === 'lo' ? `ບຳລຸງຮັກສາ (+${maintenanceRatePct}%)` : `Maint. & Wear (+${maintenanceRatePct}%)`}
            </span>
            <span className="font-mono font-black text-emerald-400">
              +{formatUnitLAK(wearAllowancePerUnit)} / {isPostPressMachine ? 'ແຜ່ນ' : 'ໜ້າ'}
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {currentLang === 'lo' ? 'ເປົ້າໝາຍຜະລິດ / ເດືອນ' : 'Target Volume / Month'}
            </span>
            <span className="font-mono font-black text-amber-400">
              {estMonthlyVolume.toLocaleString()} / {currentLang === 'lo' ? 'ເດືອນ' : 'mo'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('specs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === 'specs'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>{currentLang === 'lo' ? 'ໂປຣໄຟລ໌ & ສະເປັກເຕັກນິກ' : 'Profile & Technical Specs'}</span>
        </button>

        {!isPostPressMachine && (
          <button
            onClick={() => setActiveTab('meter')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
              activeTab === 'meter'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>{currentLang === 'lo' ? `ບັນທຶກມິເຕີ (${machineReadings.length})` : `Daily/Weekly Meter Log (${machineReadings.length})`}</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === 'maintenance'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>{currentLang === 'lo' ? `ປະຫວັດບຳລຸງຮັກສາ & ເຄື່ອງຢຸດ (${machineDowntimes.length})` : `Maintenance & Downtime (${machineDowntimes.length})`}</span>
        </button>

        {!isPostPressMachine && (
          <button
            onClick={() => setActiveTab('inks')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
              activeTab === 'inks'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{currentLang === 'lo' ? `ໝຶກພິມ & ອຸປະກອນສິ້ນເປືອງ (${linkedLinks.length})` : `Linked Inks & Consumables (${linkedLinks.length})`}</span>
          </button>
        )}
      </div>

      {/* TAB CONTENT 1: SPECS & GENERAL (Categories 1, 2, 3, 5) */}
      {activeTab === 'specs' && (
        <div className="space-y-6">
          {/* CATEGORY 1: General & Visuals */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-600" />
              <span>{currentLang === 'lo' ? 'ໝວດ 1: ຂໍ້ມູນທົ່ວໄປ & ຮູບພາບ (General & Visuals)' : 'Category 1: General & Visuals'}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-4 flex justify-center">
                {machine.imageUrl || machine.itemPhoto ? (
                  <img 
                    src={machine.imageUrl || machine.itemPhoto} 
                    alt={machine.name} 
                    className="w-full max-h-60 object-contain rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-inner"
                  />
                ) : (
                  <div className="w-full h-48 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Printer className="w-12 h-12 text-slate-300" />
                    <span className="text-xs font-bold">{currentLang === 'lo' ? 'ບໍ່ມີຮູບພາບ' : 'No Product Image'}</span>
                  </div>
                )}
              </div>
              <div className="md:col-span-8 grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ລະຫັດຊັບສິນ (Asset ID)' : 'Asset ID'}</span>
                  <span className="text-sm text-slate-900 font-mono block mt-1">{machine.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ໝາຍເລກຊີຣຽວ (S/N)' : 'Serial Number (S/N)'}</span>
                  <span className="text-sm text-slate-900 font-mono block mt-1">{machine.serialNumber || machine.sn || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ແບຣນ / ຍີ່ຫໍ້' : 'Brand / Make'}</span>
                  <span className="text-sm text-slate-900 block mt-1">{machine.brand || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ລຸ້ນໂມເດວ (Model)' : 'Model'}</span>
                  <span className="text-sm text-slate-900 block mt-1">{machine.model || machine.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">
                    {isPostPressMachine ? (currentLang === 'lo' ? 'ປະເພດເຄື່ອງຈັກຫຼັງພິມ' : 'Subtype') : (currentLang === 'lo' ? 'ໝວດໝູ່ເຄື່ອງພິມ' : 'Printer Category')}
                  </span>
                  <span className="text-sm text-sky-700 font-black block mt-1">{subtypeLabel}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ສະຖານທີ່ຕັ້ງ / ພະແນກ' : 'Location / Department'}</span>
                  <span className="text-sm text-slate-900 block mt-1">{machine.location || 'Main Dept'}</span>
                </div>
                {!isPostPressMachine && (
                  <>
                    <div>
                      <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ຮູບແບບລະບົບສີ' : 'Color Scheme Type'}</span>
                      <span className="text-sm text-slate-900 block mt-1">{machine.colorSchemeType || machine.specs?.colorSchemeType || 'CMYK'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ຈຳນວນຊ່ອງໃສ່ສີ (Slots)' : 'Total Color Slots'}</span>
                      <span className="text-sm text-slate-900 font-mono block mt-1">{machine.totalColorSlots || machine.totalSlots || 4}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* CATEGORY 2: Technical Specifications */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-purple-600" />
              <span>
                {currentLang === 'lo' 
                  ? `ໝວດ 2: ສະເປັກເຕັກນິກ (${isPostPressMachine ? 'Post-Press Machinery Specs' : 'Technical Specifications'})` 
                  : `Category 2: ${isPostPressMachine ? 'Post-Press Machinery Specs' : 'Technical Specifications'}`}
              </span>
            </h3>

            {isPostPressMachine ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-bold text-slate-600">
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ປະເພດເຄື່ອງຈັກ (Subtype)' : 'Subtype'}</span>
                    <span className="text-xs text-sky-700 font-extrabold block mt-1">{subtypeLabel}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ອາຍຸການໃຊ້ງານ (Lifespan)' : 'Lifespan'}</span>
                    <span className="text-xs text-slate-900 font-mono block mt-1">{lifespanYears} {currentLang === 'lo' ? 'ປີ' : 'Years'} ({totalMonths} {currentLang === 'lo' ? 'ເດືອນ' : 'Mos'})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ຍອດຜະລິດ/ເດືອນ (Monthly Vol)' : 'Monthly Vol'}</span>
                    <span className="text-xs text-slate-900 font-mono block mt-1">{estMonthlyVolume.toLocaleString()} {currentLang === 'lo' ? 'ແຜ່ນ/ເດືອນ' : 'sheets/mo'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ອັດຕາບຳລຸງຮັກສາ (Maint %)' : 'Maint Allowance'}</span>
                    <span className="text-xs text-emerald-600 font-mono font-black block mt-1">+{maintenanceRatePct}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ຄ່າເສື່ອມພື້ນຖານ / ແຜ່ນ' : 'Base Depr / Sheet'}</span>
                    <span className="text-xs text-slate-900 font-mono block mt-1">{formatLAK(baseCostPerUnit)} / ແຜ່ນ</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? `ຄ່າບຳລຸງຮັກສາ (+${maintenanceRatePct}%)` : `Wear & Maint (+${maintenanceRatePct}%)`}</span>
                    <span className="text-xs text-emerald-600 font-mono block mt-1">+{formatLAK(wearAllowancePerUnit)} / ແຜ່ນ</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ຕົ້ນທຶນຄ່າເສື່ອມສຸດທິ / ແຜ່ນ' : 'Net Effective Rate'}</span>
                    <span className="text-xs text-sky-700 font-mono font-black block mt-1">{formatLAK(netCostPerUnit)} / ແຜ່ນ</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ເປົ້າໝາຍຜະລິດທັງໝົດ' : 'Lifetime Target'}</span>
                    <span className="text-xs text-slate-900 font-mono block mt-1">{targetLifetimeCapacity.toLocaleString()} ແຜ່ນ</span>
                  </div>
                </div>

                {/* Render any additional dynamic specs inside machine.specs if present */}
                {machine.specs && typeof machine.specs === 'object' && (() => {
                  const validEntries = Object.entries(machine.specs).filter(([key, val]) => {
                    if (val === null || val === undefined || val === '') return false;
                    if (['postPressSubtype', 'lifespanYears', 'estMonthlyVolume', 'maintenanceRatePercent', 'netCostPerUnit'].includes(key)) return false;
                    return true;
                  });
                  if (validEntries.length === 0) return null;
                  
                  const labelMap: Record<string, string> = {
                    laminationWidth: 'ຄວາມກວ້າງການເຄືອບສູງສຸດ (Max Lamination Width)',
                    warmUpTime: 'ເວລາອຸ່ນເຄື່ອງ (Warm-Up Time Mins)',
                    speedMPerMin: 'ຄວາມໄວໃນການເຄືອບ (Speed m/min)',
                    bindingMethod: 'ຮູບແບບການເຂົ້າເລັ້ມ (Binding Method)',
                    maxBookSheets: 'ຈຳນວນແຜ່ນສູງສຸດຕໍ່ເລັ້ມ (Max Sheets/Book)',
                    avgTimePerBook: 'ເວລາສະເລ່ຍຕໍ່ເລັ້ມ (Avg Mins/Book)',
                    cutCapacity: 'ຄວາມຈຸໃນການຕັດສູງສຸດ (Max Cut Capacity)',
                    bladeDepreciationPerCut: 'ຄ່າຫຼຸ້ຍຫ້ຽນໃບມີດຕໍ່ຄັ້ງ (Blade Wear/Cut LAK)'
                  };

                  return (
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">
                        {currentLang === 'lo' ? 'ຄຸນລັກສະນະສະເພາະທາງເຕັກນິກ (Dynamic Master Specs)' : 'Dynamic Master Specs'}
                      </span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-slate-600">
                        {validEntries.map(([key, val]) => (
                          <div key={key}>
                            <span className="text-slate-400 uppercase text-[10px] block">{labelMap[key] || key}</span>
                            <span className="text-xs text-slate-900 block mt-1">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-bold text-slate-600">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ຄວາມໄວໃນການພິມ (Print Speed)' : 'Print Speed (PPM)'}</span>
                  <span className="text-xs text-slate-900 block mt-1">{machine.speedPpm || machine.printSpeedColor || machine.printSpeed || machine.specs?.speedPpm || '25 ppm (A4)'}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ຂະໜາດເຈ້ຍສູງສຸດ' : 'Max Paper Size'}</span>
                  <span className="text-xs text-slate-900 block mt-1">{machine.maxWidth || machine.paperSizes || machine.specs?.maxWidth || 'A3+ (329 x 483 mm)'}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ປະເພດໝຶກພິມ (Ink Type)' : 'Ink Type'}</span>
                  <span className="text-xs text-slate-900 block mt-1">{machine.inkType || machine.specs?.inkType || 'Pigment / Dye Ink'}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ເທັກໂນໂລຢີການພິມ' : 'Print Tech'}</span>
                  <span className="text-xs text-slate-900 block mt-1">{machine.printTech || machine.specs?.printTech || 'PrecisionCore Heat-Free'}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ປະລິມານພິມໝຶກດຳ ISO' : 'Black ISO Yield (A4 5%)'}</span>
                  <span className="text-xs text-slate-900 font-mono block mt-1">{machine.blackYieldPages ? `${Number(machine.blackYieldPages).toLocaleString()} pages` : (machine.specs?.blackYieldPages ? `${Number(machine.specs.blackYieldPages).toLocaleString()} pages` : '7,500 pages')}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ປະລິມານພິມໝຶກສີ ISO' : 'Color ISO Yield (A4 5%)'}</span>
                  <span className="text-xs text-slate-900 font-mono block mt-1">{machine.colorYieldPages ? `${Number(machine.colorYieldPages).toLocaleString()} pages` : (machine.specs?.colorYieldPages ? `${Number(machine.specs.colorYieldPages).toLocaleString()} pages` : '6,000 pages')}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ຄ່າ Click Rate ສີ' : 'Click Rate (Color)'}</span>
                  <span className="text-xs text-emerald-600 font-mono block mt-1">{machine.clickRateColor ? `${formatLAK(machine.clickRateColor)} / click` : '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ຄ່າ Click Rate ຂາວດຳ' : 'Click Rate (B/W)'}</span>
                  <span className="text-xs text-emerald-600 font-mono block mt-1">{machine.clickRateBW ? `${formatLAK(machine.clickRateBW)} / click` : '-'}</span>
                </div>
              </div>
            )}
          </div>

          {/* CATEGORY 3: Connectivity & Network */}
          {(machine.ipAddress || machine.ip || machine.macAddress || machine.mac || (machine.connectivity && machine.connectivity.length > 0)) && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-emerald-600" />
                <span>{currentLang === 'lo' ? 'ໝວດ 3: ການເຊື່ອມຕໍ່ & ລະບົບເຄືອຂ່າຍ (Connectivity & Network)' : 'Category 3: Connectivity & Network'}</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-bold text-slate-600">
                {machine.connectivity && machine.connectivity.length > 0 && (
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ພອດການເຊື່ອມຕໍ່' : 'Connectivity'}</span>
                    <span className="text-xs text-slate-900 block mt-1">{machine.connectivity.join(', ')}</span>
                  </div>
                )}
                {(machine.ipAddress || machine.ip) && (
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ໄອພີ (IP Address)' : 'IP Address'}</span>
                    <span className="text-xs text-slate-900 font-mono block mt-1">{machine.ipAddress || machine.ip}</span>
                  </div>
                )}
                {(machine.macAddress || machine.mac) && (
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ແມັກແອດເດຣສ (MAC Address)' : 'MAC Address'}</span>
                    <span className="text-xs text-slate-900 font-mono block mt-1">{machine.macAddress || machine.mac}</span>
                  </div>
                )}
                {machine.osCompatibility && machine.osCompatibility.length > 0 && (
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ລະບົບປະຕິບັດການ' : 'OS Compatibility'}</span>
                    <span className="text-xs text-slate-900 block mt-1">{machine.osCompatibility.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 5: Financial Metrics & Documents */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>{currentLang === 'lo' ? 'ໝວດ 5: ຕົ້ນທຶນ & ຄ່າເສື່ອມລາຄາ (Financial & Depreciation Metrics)' : 'Category 5: Financial & Depreciation Metrics'}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-xs font-bold text-slate-600">
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ວັນທີຊື້ / ນຳເຂົ້າ' : 'Purchase Date'}</span>
                <span className="text-xs text-slate-900 block mt-1">{machine.purchaseDate || machine.importDate || machine.createdAt?.split('T')[0] || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ຜູ້ສະໜອງ / ຕົວແທນ' : 'Vendor / Supplier'}</span>
                <span className="text-xs text-slate-900 block mt-1 truncate">{machine.vendor || machine.importVendor || machine.supplier || 'Official Distributor'}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block">{currentLang === 'lo' ? 'ໝົດອາຍຸການຮັບປະກັນ' : 'Warranty Expiry'}</span>
                <span className="text-xs text-slate-900 block mt-1">{machine.warrantyExpirationYear || machine.warrantyExpiration || '2028'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 uppercase text-[9px] font-black block">{currentLang === 'lo' ? '1. ຄ່າເສື່ອມເຄື່ອງຈັກສຸດທິ' : '1. Net Machine Depreciation'}</span>
                <span className="text-xs text-emerald-700 font-mono font-black block mt-0.5">
                  {formatUnitLAK(netCostPerUnit)} / {currentLang === 'lo' ? 'ແຜ່ນ' : 'unit'}
                </span>
              </div>
              <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-200">
                <span className="text-sky-800 uppercase text-[9px] font-black block">{currentLang === 'lo' ? '2. ຕົ້ນທຶນພິມລວມ (+ ໝຶກ)' : '2. Grand Total (+ Inks)'}</span>
                <span className="text-xs text-sky-800 font-mono font-black block mt-0.5">
                  {formatUnitLAK(grandTotalCostPerPage)} / {isPostPressMachine ? (currentLang === 'lo' ? 'ແຜ່ນ' : 'unit') : (currentLang === 'lo' ? 'ໜ້າ' : 'page')}
                </span>
              </div>

            </div>


            {/* Quick update financial fields */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <span className="text-xs font-black text-slate-800 block uppercase tracking-wider">
                {currentLang === 'lo' ? 'ປັບປຸງພາຣາມິເຕີຕົ້ນທຶນ & ຄ່າເສື່ອມລາຄາ (Inline Financial Parameters Update)' : 'Inline Financial Parameters Update'}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                    {currentLang === 'lo' ? '1. ລາຄາຊື້ເຄື່ອງຈັກ (LAK)' : '1. Purchase Price (LAK)'}
                  </label>
                  <input
                    type="number"
                    value={assetValue}
                    onChange={(e) => {
                      const newCost = Number(e.target.value);
                      const mDepr = totalMonths > 0 ? (newCost / totalMonths) : 0;
                      const bRate = estMonthlyVolume > 0 ? (mDepr / estMonthlyVolume) : 0;
                      const wearRate = Math.round(bRate * (maintenanceRatePct / 100) * 100) / 100 + maintCostPerPage;
                      const nRate = Math.round((bRate + wearRate) * 100) / 100;
                      updateEquipment(machine.id, { 
                        price: newCost,
                        unitPrice: newCost,
                        MachinePrice: newCost, 
                        purchaseCost: newCost, 
                        purchasePrice: newCost,
                        costPerConsumptionUnit: nRate,
                        calculatedCostPerPage: nRate,
                        maintenanceCostPerPage: nRate
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                    {currentLang === 'lo' ? '2. ອາຍຸການໃຊ້ງານ (ປີ)' : '2. Lifespan (Years)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={lifespanYears}
                    onChange={(e) => {
                      const newYears = Math.max(1, Number(e.target.value));
                      const newMonths = newYears * 12;
                      const mDepr = newMonths > 0 ? (assetValue / newMonths) : 0;
                      const bRate = estMonthlyVolume > 0 ? (mDepr / estMonthlyVolume) : 0;
                      const wearRate = Math.round(bRate * (maintenanceRatePct / 100) * 100) / 100 + maintCostPerPage;
                      const nRate = Math.round((bRate + wearRate) * 100) / 100;
                      updateEquipment(machine.id, { 
                        lifespanYears: newYears,
                        TargetTotalPages: estMonthlyVolume * newMonths,
                        printedPagesCapacity: estMonthlyVolume * newMonths,
                        costPerConsumptionUnit: nRate,
                        calculatedCostPerPage: nRate,
                        maintenanceCostPerPage: nRate
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                    {currentLang === 'lo' ? '3. ຍອດຜະລິດ/ເດືອນ (ແຜ່ນ ຫຼື ໜ້າ)' : '3. Monthly Vol (Units/mo)'}
                  </label>
                  <input
                    type="number"
                    min={100}
                    value={estMonthlyVolume}
                    onChange={(e) => {
                      const newVol = Math.max(1, Number(e.target.value));
                      const mDepr = totalMonths > 0 ? (assetValue / totalMonths) : 0;
                      const bRate = newVol > 0 ? (mDepr / newVol) : 0;
                      const wearRate = Math.round(bRate * (maintenanceRatePct / 100) * 100) / 100 + maintCostPerPage;
                      const nRate = Math.round((bRate + wearRate) * 100) / 100;
                      updateEquipment(machine.id, { 
                        estMonthlyVolume: newVol,
                        TargetTotalPages: newVol * totalMonths,
                        printedPagesCapacity: newVol * totalMonths,
                        costPerConsumptionUnit: nRate,
                        calculatedCostPerPage: nRate,
                        maintenanceCostPerPage: nRate
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                    {currentLang === 'lo' ? '4. ອັດຕາບຳລຸງຮັກສາ (%)' : '4. Maintenance Rate (%)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={maintenanceRatePct}
                    onChange={(e) => {
                      const newRatePct = Math.max(0, Number(e.target.value));
                      const wearRate = Math.round(baseCostPerUnit * (newRatePct / 100) * 100) / 100 + maintCostPerPage;
                      const nRate = Math.round((baseCostPerUnit + wearRate) * 100) / 100;
                      updateEquipment(machine.id, { 
                        maintenanceRatePercent: newRatePct,
                        costPerConsumptionUnit: nRate,
                        calculatedCostPerPage: nRate,
                        maintenanceCostPerPage: nRate
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all duration-200 shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: METER COUNTER HISTORY */}
      {activeTab === 'meter' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-emerald-600" />
                <span>{currentLang === 'lo' ? 'ລະບົບບັນທຶກມິເຕີພິມ (Meter Counter Logs)' : 'Meter Counter Log'}</span>
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                {currentLang === 'lo' 
                  ? 'ຕິດຕາມເລກມິເຕີພິມແຕ່ລະວັນ/ອາທິດ/ເດືອນ ແລະ ສະຖິຕິປະລິມານພິມສະສົມ' 
                  : 'Track click counter readings and volume output history'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  onClick={() => setMeterFilter('daily')}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl transition cursor-pointer ${
                    meterFilter === 'daily' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {currentLang === 'lo' ? 'ລາຍວັນ (14 ວັນ)' : 'Daily (14D)'}
                </button>
                <button
                  onClick={() => setMeterFilter('weekly')}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl transition cursor-pointer ${
                    meterFilter === 'weekly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {currentLang === 'lo' ? 'ລາຍອາທິດ (8 ອາທິດ)' : 'Weekly (8W)'}
                </button>
                <button
                  onClick={() => setMeterFilter('monthly')}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl transition cursor-pointer ${
                    meterFilter === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {currentLang === 'lo' ? 'ລາຍເດືອນ (12 ເດືອນ)' : 'Monthly (12M)'}
                </button>
              </div>

              <button
                onClick={() => setIsRecordMeterOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{currentLang === 'lo' ? '+ ບັນທຶກມິເຕີມື້ນີ້' : '+ Record Meter'}</span>
              </button>
            </div>
          </div>

          {/* Table of Meter Readings */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-black">
                  <th className="py-3 px-4">{currentLang === 'lo' ? 'ວັນທີ & ເວລາ' : 'Date & Time'}</th>
                  <th className="py-3 px-4 text-right">{currentLang === 'lo' ? 'ເລກມິເຕີສະສົມ (Counter)' : 'Total Click Counter'}</th>
                  <th className="py-3 px-4 text-right">{currentLang === 'lo' ? 'ຈຳນວນພິມເພີ່ມ (+Diff)' : 'Pages Printed (+Diff)'}</th>
                  <th className="py-3 px-4">{currentLang === 'lo' ? 'ຜູ້ບັນທຶກ' : 'Operator'}</th>
                  <th className="py-3 px-4">{currentLang === 'lo' ? 'ໝາຍເຫດ' : 'Notes'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredReadings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                      {currentLang === 'lo' 
                        ? 'ບໍ່ມີລາຍການບັນທຶກມິເຕີສຳລັບຊ່ວງເວລານີ້. ຄລິກ "+ ບັນທຶກມິເຕີມື້ນີ້" ເພື່ອເລີ່ມຕົ້ນບັນທຶກ.' 
                        : 'No meter readings recorded yet for this view filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredReadings.map((reading: any) => (
                    <tr key={reading.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{reading.date}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{reading.time || '-'}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        {(reading.meterCount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-600">
                        +{(reading.diffCount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-bold">
                        {reading.recordedBy || 'Operator'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium max-w-xs truncate">
                        {reading.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: MAINTENANCE & DOWNTIME LOG */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {/* SLA Health Wear Reset Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                {currentLang === 'lo' ? 'ອາຍຸການໃຊ້ງານຊິ້ນສ່ວນອະໄຫຼ່ & ສຸຂະພາບ SLA (Component Wear)' : 'Component Wear SLA Health'}
              </span>
              <button
                onClick={() => {
                  updateEquipmentMaintenance(machine.id);
                  showToast(currentLang === 'lo' ? `ຣີເຊັດຄ່າບຳລຸງຮັກສາເຄື່ອງ "${machine.name}" ສຳເລັດ!` : 'Maintenance SLA reset successfully!', 'success');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition cursor-pointer active:scale-95"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{currentLang === 'lo' ? 'ຣີເຊັດອະໄຫຼ່ທັງໝົດເປັນ 0%' : 'SLA Reset All (0%)'}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {machine.components && machine.components.map((comp: any, idx: number) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">{comp.name}</span>
                    <span className={comp.usage >= (comp.threshold || 90) ? 'text-red-600 font-black' : 'text-slate-700 font-mono'}>
                      {comp.usage}% / {comp.threshold || 90}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        comp.usage >= (comp.threshold || 90) ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, comp.usage)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500 font-bold">
                      {currentLang === 'lo' ? 'ເຫຼືອ: ' : 'Remaining: '}{Math.max(0, 100 - comp.usage)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setSwapModalConfig({
                        isOpen: true,
                        mode: 'component',
                        componentName: comp.name,
                        currentUsage: comp.usage
                      })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-black rounded-lg border border-indigo-200 transition cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{currentLang === 'lo' ? 'ປ່ຽນອະໄຫຼ່' : 'Swap Part'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Downtime Log Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-indigo-600" />
                  <span>{currentLang === 'lo' ? 'ປະຫວັດການສ້ອມແປງ & ເຄື່ອງຢຸດເຮັດວຽກ (Maintenance & Downtime Logs)' : 'Maintenance History & Downtime'}</span>
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  {currentLang === 'lo' 
                    ? 'ບັນທຶກປະຫວັດເຄື່ອງຂັດຂ້ອງ, ອາການເສຍ, ການປ່ຽນອະໄຫຼ່ ແລະ ຄ່າໃຊ້ຈ່າຍຊ່າງສ້ອມ' 
                    : 'Timeline of breakdown logs, repairs, parts replaced, and costs'}
                </p>
              </div>

              <button
                onClick={() => setIsLogDowntimeOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-md shadow-indigo-600/20 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{currentLang === 'lo' ? '+ ບັນທຶກການສ້ອມແປງ' : '+ Log Maintenance'}</span>
              </button>
            </div>

            {/* Downtime Timeline Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-black">
                    <th className="py-3 px-4">{currentLang === 'lo' ? 'ເວລາເລີ່ມຕົ້ນ' : 'Start Time'}</th>
                    <th className="py-3 px-4">{currentLang === 'lo' ? 'ອາການ / ສາເຫດ' : 'Reason / Issue'}</th>
                    <th className="py-3 px-4 text-right">{currentLang === 'lo' ? 'ເວລາຢຸດ (ນາທີ)' : 'Downtime (Mins)'}</th>
                    <th className="py-3 px-4">{currentLang === 'lo' ? 'ຊ່າງສ້ອມ / ວິທີແກ້' : 'Technician / Action'}</th>
                    <th className="py-3 px-4 text-right">{currentLang === 'lo' ? 'ຄ່າໃຊ້ຈ່າຍ (LAK)' : 'Cost (LAK)'}</th>
                    <th className="py-3 px-4">{currentLang === 'lo' ? 'ສະຖານະ' : 'Status'}</th>
                    <th className="py-3 px-4 text-right">{currentLang === 'lo' ? 'ຈັດການ' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {machineDowntimes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                        {currentLang === 'lo' 
                          ? 'ບໍ່ມີປະຫວັດການສ້ອມແປງສຳລັບເຄື່ອງນີ້. ຄລິກ "+ ບັນທຶກການສ້ອມແປງ" ເພື່ອເພີ່ມລາຍການ.' 
                          : 'No maintenance downtime records logged for this machine yet.'}
                      </td>
                    </tr>
                  ) : (
                    machineDowntimes.map((dt: any) => (
                      <tr key={dt.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {dt.startTime ? new Date(dt.startTime).toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{dt.reason}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">{dt.description}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600">
                          {dt.downtimeMinutes || 0} min
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800 block">{dt.technician || '-'}</span>
                          <span className="text-[10px] text-slate-500 font-normal">{dt.actionTaken || '-'}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                          {dt.cost ? formatLAK(dt.cost) : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            dt.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          }`}>
                            {dt.status === 'Completed' ? (currentLang === 'lo' ? 'ສຳເລັດ' : 'Completed') : (currentLang === 'lo' ? 'ກຳລັງສ້ອມ' : 'In Progress')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {dt.status !== 'Completed' && (
                            <button
                              onClick={() => {
                                updateDowntimeLog(dt.id, { status: 'Completed', endTime: new Date().toISOString() });
                                showToast(currentLang === 'lo' ? 'ປັບສະຖານະການສ້ອມແປງເປັນສຳເລັດ!' : 'Downtime marked as completed!', 'success');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition shadow-xs cursor-pointer"
                            >
                              {currentLang === 'lo' ? 'ປິດງານ' : 'Mark Done'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: LINKED INKS & CONSUMABLES */}
      {activeTab === 'inks' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                <span>{currentLang === 'lo' ? 'ໝຶກພິມ & ອຸປະກອນສິ້ນເປືອງທີ່ເຊື່ອມໂຍງ (Linked Inks & Consumables)' : 'Linked Colors & Consumables'}</span>
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                {currentLang === 'lo' 
                  ? 'ຈັບຄູ່ຊ່ອງສີ CMYK / White ກັບລະຫັດ SKU ໝຶກໃນສາງ ພ້ອມຕົ້ນທຶນ ແລະ ຈຳນວນຄົງເຫຼືອ Real-time' 
                  : 'Color slot mappings with real-time inventory unit prices & stock'}
              </p>
            </div>

            <button
              onClick={() => setIsQuickLinkInkOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-2xl shadow-md shadow-purple-600/20 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{currentLang === 'lo' ? '+ ຜູກໝຶກພິມເຂົ້າ Slot' : '+ Quick Link Ink SKU'}</span>
            </button>
          </div>

          {/* Table of Linked Inks */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-black">
                  <th className="py-3 px-4">{currentLang === 'lo' ? 'ຊ່ອງສີ / ຕຳແໜ່ງ Slot' : 'Slot / Color Position'}</th>
                  <th className="py-3 px-4">{currentLang === 'lo' ? 'ລະຫັດ SKU ໝຶກ' : 'Ink SKU Code'}</th>
                  <th className="py-3 px-4">{currentLang === 'lo' ? 'ຊື່ໝຶກໃນສາງສິນຄ້າ' : 'Ink Name in Inventory'}</th>
                  <th className="py-3 px-4 text-center">{currentLang === 'lo' ? 'ສະຕັອກໃນສາງ' : 'Stock Qty'}</th>
                  <th className="py-3 px-4 text-right">{currentLang === 'lo' ? 'ຄວາມຈຸ (ml)' : 'Volume (ml)'}</th>
                  <th className="py-3 px-4 text-right">{currentLang === 'lo' ? 'ລາຄາຕົ້ນທຶນ/ຕຸກ' : 'Unit Cost'}</th>
                  <th className="py-3 px-4 text-center">{currentLang === 'lo' ? 'ຈັດການ / ປ່ຽນໝຶກ' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {linkedLinks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                      {currentLang === 'lo' 
                        ? 'ຍັງບໍ່ໄດ້ຜູກໝຶກພິມສຳລັບເຄື່ອງນີ້. ຄລິກ "+ ຜູກໝຶກພິມເຂົ້າ Slot" ເພື່ອເລືອກໝຶກຈາກສາງ.' 
                        : 'No linked inks configured for this machine yet.'}
                    </td>
                  </tr>
                ) : (
                  linkedLinks.map((lnk: any) => {
                    const ink = inventory.find((i: any) => i.id === lnk.inkCode || i.skuCode === lnk.inkCode || i.sku === lnk.inkCode);
                    const stockCount = ink ? Number(ink.stockQty || 0) : 0;

                    return (
                      <tr key={lnk.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{lnk.slotPosition}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{lnk.inkCode}</td>
                        <td className="py-3 px-4 text-slate-800 font-bold">{ink ? ink.name : '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black font-mono inline-block ${
                            stockCount > 0 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                          }`}>
                            {stockCount > 0 ? `${stockCount} ຕຸກ` : (currentLang === 'lo' ? '0 ຕຸກ (ໝົດສາງ)' : '0 (Out of stock)')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-right">{lnk.oemStandardVolumeMl || ink?.volume || 100} ml</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 text-right">
                          {ink ? formatLAK(ink.unitPrice || ink.costPerPurchaseUnit || 0) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Quick Ink Swap Button */}
                            <button
                              type="button"
                              onClick={() => setSwapModalConfig({
                                isOpen: true,
                                mode: 'ink',
                                slotPosition: lnk.slotPosition,
                                inkSku: lnk.inkCode,
                                inkName: ink?.name || lnk.inkCode
                              })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-black text-xs rounded-xl border border-purple-200 transition cursor-pointer active:scale-95"
                              title={currentLang === 'lo' ? 'ປ່ຽນໝຶກຕຸກໃໝ່' : 'Swap Ink'}
                            >
                              <Droplet className="w-3.5 h-3.5" />
                              <span>{currentLang === 'lo' ? 'ປ່ຽນໝຶກຕຸກໃໝ່' : 'Swap Ink'}</span>
                            </button>

                            {/* Unlink button */}
                            <button
                              type="button"
                              onClick={() => {
                                deletePrinterColorLink(lnk.id);
                                showToast(currentLang === 'lo' ? 'ຍົກເລີກການຜູກໝຶກສຳເລັດ!' : 'Unlinked ink slot successfully!', 'info');
                              }}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title={currentLang === 'lo' ? 'ຍົກເລີກການຜູກ' : 'Unlink'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* OEM vs Actual Compatible Ink Comparison Card Component */}
          <PrinterInkComparisonCard printerItem={machine} currentLang={currentLang} />
        </div>
      )}

      {/* Modals */}
      <EditEquipmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        equipmentItem={machine}
      />

      <RecordMeterModal
        isOpen={isRecordMeterOpen}
        onClose={() => setIsRecordMeterOpen(false)}
        equipmentItem={machine}
      />

      <LogDowntimeModal
        isOpen={isLogDowntimeOpen}
        onClose={() => setIsLogDowntimeOpen(false)}
        equipmentItem={machine}
      />

      <QuickLinkInkModal
        isOpen={isQuickLinkInkOpen}
        onClose={() => setIsQuickLinkInkOpen(false)}
        equipmentItem={machine}
      />

      {/* Quick Swap Ink & Consumable Modal */}
      {swapModalConfig && (
        <QuickSwapConsumableModal
          isOpen={swapModalConfig.isOpen}
          onClose={() => setSwapModalConfig(null)}
          mode={swapModalConfig.mode}
          equipmentItem={machine}
          slotPosition={swapModalConfig.slotPosition}
          inkSku={swapModalConfig.inkSku}
          inkName={swapModalConfig.inkName}
          componentName={swapModalConfig.componentName}
          currentUsage={swapModalConfig.currentUsage}
        />
      )}

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteEquipment}
        itemName={`${machine.name} (${machine.id})`}
      />
    </div>
  );
}
