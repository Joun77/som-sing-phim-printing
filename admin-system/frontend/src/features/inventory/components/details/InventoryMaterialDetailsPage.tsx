import React, { useState } from 'react';
import { ArrowLeft, Trash2, Edit3, ShieldAlert, Package, Calendar, Truck, Layers, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@store/AppContext';
import { calculatePaperUnitCost } from '@utils/costCalculator';
import EditMaterialModal from '../modals/EditMaterialModal';
import AssetEditModal from '../modals/AssetEditModal';
import DynamicSpecDetail from './DynamicSpecDetail';
import ConfirmDeleteModal, { DeleteActionButton } from '@components/common/ConfirmDeleteModal';

export default function InventoryMaterialDetailsPage({ 
  lotId, 
  parentSkuId, 
  initialItem,
  onBack 
}: { 
  lotId?: string; 
  parentSkuId?: string; 
  initialItem?: any;
  onBack: () => void;
}) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const { inventory, linkedInboundEntries, deleteInventoryBatch, editInventoryBatch, addInventorySku, equipment, printerColorLinks, showToast, formatCurrency } = useApp();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Find target material item and batch lot
  let targetItem: any = null;
  let targetLot: any = null;

  const searchKey = (parentSkuId || lotId || initialItem?.id || initialItem?.sku || '').toLowerCase();

  if (searchKey) {
    targetItem = inventory.find(i => 
      (i.id && i.id.toLowerCase() === searchKey) || 
      (i.sku && i.sku.toLowerCase() === searchKey) ||
      (i.name && i.name.toLowerCase() === searchKey)
    );
  }

  if (!targetItem && lotId) {
    for (const item of inventory) {
      if (item.batches) {
        const found = item.batches.find((b: any) => b.id === lotId || b.id?.toLowerCase() === lotId.toLowerCase());
        if (found) {
          targetItem = item;
          targetLot = found;
          break;
        }
      }
    }
  }

  if (!targetItem && initialItem) {
    targetItem = {
      ...initialItem,
      id: initialItem.id || initialItem.sku || 'MAT-ITEM',
      name: initialItem.name || initialItem.itemName || initialItem.sku || 'Item',
      category: initialItem.category || 'Paper',
      stockQty: initialItem.stock_qty ?? initialItem.stockQty ?? initialItem.currentStock ?? 0,
      consumptionUnit: initialItem.consumption_unit || initialItem.consumptionUnit || 'ແຜ່ນ',
      purchaseUnit: initialItem.purchase_unit || initialItem.purchaseUnit || 'ແພັກ',
      purchaseMultiplier: Number(initialItem.purchase_multiplier || initialItem.purchaseMultiplier || 500),
      costPerPurchaseUnit: Number(initialItem.cost_per_purchase_unit || initialItem.costPerPurchaseUnit || 0),
      costPerConsumptionUnit: Number(initialItem.cost_per_consumption_unit || initialItem.costPerConsumptionUnit || 0),
      reorderThreshold: Number(initialItem.min_stock_alert || initialItem.reorderThreshold || 10),
      specs: initialItem.specs || initialItem.technical_specs || { ...initialItem }
    };
  }

  const isSheetPaper = (targetItem?.category || '').toLowerCase() === 'paper' || (targetItem?.category || '').toLowerCase() === 'material';
  const isInk = (targetItem?.category || '').toLowerCase() === 'ink' || (targetItem?.category || '').toLowerCase() === 'toner';
  const inkVolume = Number(targetItem?.specs?.volume || targetItem?.specs?.volumePerBottle || targetItem?.volume || 70);
  const multiplier = isSheetPaper 
    ? Number(targetItem?.purchaseMultiplier || targetItem?.specs?.sheetsPerPack || 500)
    : (isInk ? (Number(targetItem?.purchaseMultiplier) && Number(targetItem?.purchaseMultiplier) <= 200 ? Number(targetItem?.purchaseMultiplier) : inkVolume) : (Number(targetItem?.purchaseMultiplier) || 1));

  let allInboundRecords = [...(linkedInboundEntries || [])];
  try {
    const raw = localStorage.getItem('som_sing_inbound_list');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(p => {
          if (!allInboundRecords.some(r => r.id === p.id)) {
            allInboundRecords.push(p);
          }
        });
      }
    }
  } catch (err) {}

  const targetId = (targetItem?.id || '').toLowerCase();
  const targetSku = (targetItem?.sku || '').toLowerCase();
  const targetName = (targetItem?.name || '').toLowerCase().trim();

  const matchedInboundEntries = allInboundRecords.filter((e: any) => {
    if (!e) return false;
    const eId = (e.id || '').toLowerCase();
    const eSku = (e.sku || '').toLowerCase();
    const eSkuCode = (e.skuCode || '').toLowerCase();
    const eName = (e.name || e.itemName || '').toLowerCase().trim();
    const eMatId = (e.specs?.materialId || '').toLowerCase();

    return (
      (targetId && (eId === targetId || eSku === targetId || eSkuCode === targetId || eMatId === targetId)) ||
      (targetSku && (eSku === targetSku || eSkuCode === targetSku || eId === targetSku || eMatId === targetSku)) ||
      (targetName && (eName === targetName || eName.includes(targetName) || targetName.includes(eName)))
    );
  });

  const rawBatches = (targetItem?.batches || []).filter((b: any) => b.id && !b.id.includes('-EMPTY'));

  const uniqueRawBatches: any[] = [];
  const seenBatchKeys = new Set();
  for (const b of rawBatches) {
    const key = b.id || b.poNumber || b.batchId;
    if (key && !seenBatchKeys.has(key)) {
      seenBatchKeys.add(key);
      uniqueRawBatches.push(b);
    }
  }

  const realBatches = uniqueRawBatches.map((b: any) => {
    let iQty = Number(b.initialQty || 0);
    let cQty = Number(b.currentQty || 0);
    if (isSheetPaper && iQty > 0 && iQty <= 10) {
      iQty = iQty * multiplier;
    }
    if (isSheetPaper && cQty > 0 && cQty <= 10) {
      cQty = cQty * multiplier;
    }
    if (isInk && (iQty === 500 || b.id?.includes('INB-5937')) && multiplier < 500) {
      iQty = multiplier;
      cQty = multiplier;
    }
    return {
      ...b,
      initialQty: iQty,
      currentQty: cQty
    };
  });

  // Convert matched inbound logs to batch items
  const inboundAsBatches = matchedInboundEntries.map((e: any) => {
    const packQty = Number(e.quantity || e.importQty || e.currentQty || e.initialQty || 1);
    const totalUnits = (isSheetPaper || isInk) ? packQty * multiplier : packQty;
    const totalCost = Number(e.totalPrice || (e.unitPrice ? e.unitPrice * packQty : targetItem?.costPerPurchaseUnit || 0));
    const reamCost = packQty > 0 ? Math.round(totalCost / packQty) : totalCost;
    const calculatedPerSheet = isSheetPaper
      ? calculatePaperUnitCost({ totalCost, packCount: packQty, sheetsPerPack: multiplier, totalSheets: totalUnits })
      : (multiplier > 0 ? Math.round(totalCost / totalUnits) : reamCost);

    return {
      id: e.poNumber || e.id || `LOT-${targetItem?.id}`,
      purchaseDate: e.inboundDate || e.receiptDate || e.importDate || '-',
      supplierName: e.supplierName || e.supplier || e.vendor || 'Restock Supplier',
      purchasePricePerReam: reamCost,
      costPerSheet: calculatedPerSheet,
      initialQty: totalUnits,
      currentQty: totalUnits
    };
  });

  // Combine and deduplicate batches by batch ID/PO Number
  const combinedBatches: any[] = [...realBatches];
  inboundAsBatches.forEach(ib => {
    const exists = combinedBatches.some(b => b.id === ib.id || (b.purchaseDate === ib.purchaseDate && b.initialQty === ib.initialQty));
    if (!exists) {
      combinedBatches.push(ib);
    }
  });

  let effectiveStock = combinedBatches.reduce((sum: number, b: any) => sum + (Number(b.currentQty) || 0), 0);
  if (effectiveStock === 0) {
    let rawStock = Number(targetItem?.stockQty) || Number(targetItem?.currentStock) || 0;
    if (isSheetPaper && rawStock > 0 && rawStock <= 10) {
      rawStock = rawStock * multiplier;
    } else if (isSheetPaper && rawStock === 0) {
      rawStock = multiplier;
    }
    effectiveStock = rawStock;
  }

  const activeLot = targetLot || (combinedBatches.length > 0 ? combinedBatches[0] : null);

  let activeInitialQty = Number(activeLot?.initialQty || effectiveStock);
  if (isSheetPaper && activeInitialQty > 0 && activeInitialQty <= 10) {
    activeInitialQty = activeInitialQty * multiplier;
  }

  let activeCurrentQty = Number(activeLot?.currentQty || effectiveStock);
  if (isSheetPaper && activeCurrentQty > 0 && activeCurrentQty <= 10) {
    activeCurrentQty = activeCurrentQty * multiplier;
  }

  const lotPurchaseReamPrice = Number(activeLot?.purchasePricePerReam || activeLot?.purchasePrice || targetItem?.costPerPurchaseUnit || 95000);
  const perSheetCost = isSheetPaper
    ? (activeLot?.costPerSheet && activeLot.costPerSheet < lotPurchaseReamPrice
        ? activeLot.costPerSheet
        : (targetItem?.costPerConsumptionUnit && targetItem.costPerConsumptionUnit < lotPurchaseReamPrice
            ? targetItem.costPerConsumptionUnit
            : calculatePaperUnitCost({ totalCost: lotPurchaseReamPrice, packCount: 1, sheetsPerPack: multiplier })))
    : Number(activeLot?.costPerSheet || targetItem?.costPerConsumptionUnit || 0);

  const lotData = {
    parentItem: targetItem,
    id: activeLot?.id || lotId || `LOT-${targetItem?.id?.replace('PAP-', '') || '001'}`,
    poNumber: activeLot?.poNumber || targetItem?.poNumber || targetItem?.id,
    purchaseDate: activeLot?.purchaseDate || targetItem?.receiptDate || targetItem?.importDate || '-',
    supplierName: activeLot?.supplierName || targetItem?.supplierName || targetItem?.supplier || targetItem?.vendor || '-',
    paymentMethod: activeLot?.paymentMethod || targetItem?.paymentMethod || 'TRANSFER',
    costPerSheet: perSheetCost,
    purchasePrice: lotPurchaseReamPrice,
    currentQty: activeCurrentQty,
    initialQty: activeInitialQty,
    usageHistory: targetItem?.usageHistory || targetItem?.dischargeLogs || []
  };

  if (!targetItem) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-md w-full">
          <p className="text-slate-600 font-bold text-sm">{t('common.none')}</p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-black shadow-sm transition active:scale-95"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  const formatLAK = formatCurrency;

  const normalizeLaoUnit = (unit?: string, fallback = 'ແຜ່ນ') => {
    if (!unit) return fallback;
    const u = unit.trim().toLowerCase();
    if (u === 'แผ่น' || u === 'sheet' || u === 'sheets' || u === 'แผ่น (sheet)' || u === 'ແຜ່ນ') return 'ແຜ່ນ';
    if (u === 'แพ็ก' || u === 'pack' || u === 'packs' || u === 'แพ็ค' || u === 'ແພ໊ກ' || u === 'ແພັກ') return 'ແພັກ';
    if (u === 'รีม' || u === 'ream' || u === 'reams' || u === 'ຣີມ') return 'ຣີມ';
    if (u === 'ขวด' || u === 'bottle' || u === 'bottles' || u === 'ຂວດ') return 'ຂວດ';
    if (u === 'ม้วน' || u === 'roll' || u === 'rolls' || u === 'ມ້ວນ') return 'ມ້ວນ';
    if (u === 'เครื่อง' || u === 'machine' || u === 'unit' || u === 'units' || u === 'ເຄື່ອງ') return 'ເຄື່ອງ';
    if (u === 'กล่อง' || u === 'box' || u === 'boxes' || u === 'ກ່ອງ') return 'ກ່ອງ';
    if (u === 'ชุด' || u === 'set' || u === 'sets' || u === 'ຊຸດ') return 'ຊຸດ';
    return unit;
  };

  const renderDualUnitQuantity = (currentQty: number, category?: string, purchaseUnit?: string, consumptionUnit?: string, itemsPerPurchaseUnit = 500) => {
    const isPaperCategory = (category || '').toLowerCase() === 'paper' || (category || '').toLowerCase() === 'material';
    const normConsumption = normalizeLaoUnit(consumptionUnit, 'ແຜ່ນ');
    const normPurchase = normalizeLaoUnit(purchaseUnit, 'ແພັກ');

    if (isPaperCategory) {
      const mult = itemsPerPurchaseUnit || 500;
      const reams = Math.floor(currentQty / mult);
      const remainder = currentQty % mult;
      return (
        <div>
          <span className="text-2xl font-black text-slate-900 font-mono">
            {currentQty.toLocaleString()} <span className="text-sm font-bold text-slate-600">ແຜ່ນ</span>
          </span>
          <span className="text-xs font-bold text-slate-500 block font-sans mt-0.5">
            ({reams > 0 ? `${reams} ${normPurchase}` : ''}{remainder > 0 ? `${reams > 0 ? ' + ' : ''}${remainder} ແຜ່ນ` : (reams === 0 ? `0 ${normPurchase}` : '')})
          </span>
        </div>
      );
    }
    return (
      <span className="text-2xl font-black text-slate-900 font-mono">
        {currentQty.toLocaleString()} <span className="text-sm font-bold text-slate-600">{normConsumption}</span>
      </span>
    );
  };

  const handleDeleteRecord = () => {
    if (targetItem.id && lotData.id) {
      deleteInventoryBatch(targetItem.id, lotData.id);
      showToast(`${t('common.delete')} #${lotData.id}`, 'info');
      setIsDeleteModalOpen(false);
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 p-4 md:p-8 space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-100 rounded-2xl border border-slate-200 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('common.back')}</span>
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900">{targetItem.name}</h2>
            <span className="text-xs font-mono text-slate-400 font-bold">SKU: {targetItem.id || lotData.id}</span>
          </div>
        </div>

        <span className="px-3 py-1 bg-sky-50 text-sky-700 font-mono font-black text-xs rounded-full border border-sky-200 uppercase">
          {targetItem.category || 'General'}
        </span>
      </div>

      {/* Top Warehouse KPI Metrics: On-Hand Stock (Dual-Unit), Unit Cost, Stock Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Dual Unit Current Stock */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              {currentLang === 'lo' ? 'ຈຳນວນສະຕ໋ອກຄົງເຫຼືອ (On-Hand Stock)' : 'On-Hand Stock'}
            </span>
            <div className="mt-1">
              {renderDualUnitQuantity(
                effectiveStock,
                targetItem.category,
                targetItem.purchaseUnit,
                targetItem.consumptionUnit,
                multiplier
              )}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-900 shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Unit Cost LAK */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              {currentLang === 'lo' ? 'ຕົ້ນທຶນຕໍ່ໜ່ວຍເບີກ (Unit Cost)' : 'Consumption Unit Cost'}
            </span>
            <span className="text-xl font-black text-emerald-600 font-mono block mt-1">
              {formatLAK(lotData.costPerSheet || targetItem.costPerConsumptionUnit)}
              <span className="text-xs text-slate-400 font-bold ml-1">/{normalizeLaoUnit(targetItem.consumptionUnit, 'ແຜ່ນ')}</span>
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Stock Level Status */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              {currentLang === 'lo' ? 'ສະຖານະສະຕ໋ອກ (Stock Level)' : 'Stock Level Status'}
            </span>
            <div className="mt-1.5">
              {(() => {
                if (effectiveStock <= 0) {
                  return (
                    <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-black inline-flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      {currentLang === 'lo' ? 'ໝົດສະຕ໋ອກ (Out of Stock)' : 'Out of Stock'}
                    </span>
                  );
                }
                if (effectiveStock < 100) {
                  return (
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-black inline-flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      {currentLang === 'lo' ? 'ໃກ້ໝົດສະຕ໋ອກ (Low Stock Warning)' : 'Low Stock Warning'}
                    </span>
                  );
                }
                return (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black inline-flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    {currentLang === 'lo' ? 'ສະຕ໋ອກພ້ອມໃຊ້ງານ (Stock Ready)' : 'Stock Ready'}
                  </span>
                );
              })()}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Details cards & Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Procurement & Supplier Info */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-sky-600" />
            <span>{currentLang === 'lo' ? 'ລາຍລະອຽດການສັ່ງຊື້ (Procurement Details)' : 'Procurement Details'}</span>
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs font-medium">
            {lotData.poNumber && !lotData.poNumber.includes('-EMPTY') && (
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">{currentLang === 'lo' ? 'ລະຫັດ PO / Ref ID:' : 'PO / Ref ID:'}</span>
                <span className="font-mono text-slate-900 font-bold">{lotData.poNumber}</span>
              </div>
            )}
            {lotData.purchaseDate && lotData.purchaseDate !== '-' && (
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">{currentLang === 'lo' ? 'ວັນທີນຳເຂົ້າ:' : 'Import Date:'}</span>
                <span className="text-slate-900 font-bold">{lotData.purchaseDate}</span>
              </div>
            )}
            {lotData.supplierName && lotData.supplierName !== '-' && lotData.supplierName !== 'Unknown Vendor' && (
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">{currentLang === 'lo' ? 'ຜູ້ສະໜອງ/ຮ້ານຄ້າ:' : 'Supplier Name:'}</span>
                <span className="text-slate-900 font-bold">{lotData.supplierName}</span>
              </div>
            )}
            {lotData.paymentMethod && (
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">{currentLang === 'lo' ? 'ຊ່ອງທາງການຊຳລະເງິນ:' : 'Payment Method:'}</span>
                <span className="font-bold text-slate-900">
                  {lotData.paymentMethod === 'CASH' ? (currentLang === 'lo' ? 'ເງິນສົດ (Cash)' : 'Cash') : (currentLang === 'lo' ? 'ໂອນເງິນ (Bank Transfer)' : 'Bank Transfer')}
                </span>
              </div>
            )}
            {lotData.initialQty > 0 && (
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">{currentLang === 'lo' ? 'ຈຳນວນນຳເຂົ້າເລີ່ມຕົ້ນ:' : 'Initial Received Qty:'}</span>
                <span className="font-mono text-slate-900 font-bold">{lotData.initialQty} {targetItem.consumptionUnit || 'ແຜ່ນ'}</span>
              </div>
            )}
            {(lotData.purchasePrice || lotData.costPerSheet || targetItem.costPerConsumptionUnit) > 0 && (
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">{currentLang === 'lo' ? 'ມູນຄ່ານຳເຂົ້າລວມ:' : 'Total Purchase Value:'}</span>
                <span className="font-mono text-emerald-600 font-black text-sm block">
                  {formatLAK(lotData.purchasePrice || lotData.costPerSheet || targetItem.costPerConsumptionUnit)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: ERP Technical Specs */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>{currentLang === 'lo' ? 'ສະເປັກທາງເຕັກນິກ (ERP Technical Specs)' : 'ERP Technical Specs'}</span>
          </h3>
          <DynamicSpecDetail item={targetItem} currentLang={currentLang} />
        </div>
      </div>

      {/* Inbound Batches Procurement History Ledger */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-5 space-y-3">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex justify-between items-center">
          <span className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>{currentLang === 'lo' ? 'ປະວັດການນຳເຂົ້າສິນຄ້າ (Inbound Procurement History)' : 'Inbound Procurement History Logs'}</span>
          </span>
          <span className="text-[10px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
            {combinedBatches.length} Batches
          </span>
        </h3>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">{currentLang === 'lo' ? 'ວັນທີ & ເວລານຳເຂົ້າ (Date & Time)' : 'Date & Time'}</th>
                <th className="py-3 px-4">ລະຫັດລ໋ອດ / ໃບສັ່ງ (Lot ID)</th>
                <th className="py-3 px-4">ຜູ້ຈັດຈຳໜ່າຍ (Supplier)</th>
                <th className="py-3 px-4 text-right">ຈຳນວນນຳເຂົ້າ</th>
                <th className="py-3 px-4 text-right">ລາຄານຳເຂົ້າ (LAK ₭)</th>
                <th className="py-3 px-4 text-right">ຄົງເຫຼືອລ໋ອດນີ້</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {combinedBatches.length > 0 ? (
                combinedBatches.map((batch: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">{batch.purchaseDate && batch.purchaseDate !== '-' ? batch.purchaseDate : '-'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-600">{batch.id}</td>
                    <td className="py-3 px-4 text-slate-800">{batch.supplierName && batch.supplierName !== 'Unknown Vendor' && batch.supplierName !== '-' ? batch.supplierName : '-'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {batch.initialQty} {targetItem.consumptionUnit === 'ml' ? 'ml' : normalizeLaoUnit(targetItem.consumptionUnit, 'ແຜ່ນ')}
                      {isInk && multiplier > 1 && (
                        <span className="text-[10px] text-slate-400 font-normal block">
                          (~{Math.round((batch.initialQty / multiplier) * 10) / 10} {targetItem.purchaseUnit || 'ຂວດ'})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">{formatLAK(batch.purchasePricePerReam || batch.costPerSheet)}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-800">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-xl text-slate-700 font-mono">
                        {batch.currentQty} {targetItem.consumptionUnit === 'ml' ? 'ml' : normalizeLaoUnit(targetItem.consumptionUnit, 'ແຜ່ນ')}
                      </span>
                      {isInk && multiplier > 1 && (
                        <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                          (~{Math.round((batch.currentQty / multiplier) * 10) / 10} {targetItem.purchaseUnit || 'ຂວດ'})
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">
                    {currentLang === 'lo' ? 'ຍັງບໍ່ມີປະວັດການນຳເຂົ້າ' : 'No inbound batches recorded yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage / Consumption Logs Section */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-5 space-y-3">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex justify-between items-center">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>{currentLang === 'lo' ? 'ປະວັດການເບີກໃຊ້ງານຜະລິດ (FIFO Consumption Ledger)' : 'FIFO Job Order Consumption Ledger'}</span>
          </span>
          <span className="text-[10px] font-bold text-slate-400 bg-white px-2.5 py-1 rounded-full border border-slate-200">
            Real-time Stock Deductions
          </span>
        </h3>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">ວັນທີເບີກ</th>
                <th className="py-3 px-4">ລະຫັດໃບສັ່ງພິມ (Job Order Ref)</th>
                <th className="py-3 px-4">ລາຍລະອຽດການຜະລິດ</th>
                <th className="py-3 px-4 text-right">ຈຳນວນເບີກ</th>
                <th className="py-3 px-4 text-right">ຕົ້ນທຶນລວມ (LAK ₭)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {lotData.usageHistory && lotData.usageHistory.length > 0 ? (
                lotData.usageHistory.map((u: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">{u.date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-600">{u.jobId}</td>
                    <td className="py-3 px-4 text-slate-800">{u.description || 'Production Printing Job'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{u.qty} {targetItem.consumptionUnit || 'ແຜ່ນ'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">{formatLAK(u.cost)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                    {currentLang === 'lo' ? 'ຍັງບໍ່ມີປະວັດການເບີກໃຊ້ງານສິນຄ້ານີ້' : 'No consumption history recorded yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <DeleteActionButton onClick={() => setIsDeleteModalOpen(true)} />
        
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-xs shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Edit3 className="w-4 h-4" />
          <span>{t('common.edit')} (Edit Master Specs)</span>
        </button>
      </div>

      {/* Asset Master Edit Modal */}
      {isEditModalOpen && (
        <AssetEditModal
          item={targetItem}
          onSave={(updatedData) => {
            addInventorySku(updatedData);
            showToast('Asset master data updated successfully!', 'success');
            setIsEditModalOpen(false);
          }}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {/* Reusable Confirm Delete Modal Component */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteRecord}
        itemName={`${targetItem.name} (${lotData.id})`}
      />
    </div>
  );
}
