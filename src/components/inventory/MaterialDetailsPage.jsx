import React, { useState } from 'react';
import { ArrowLeft, Trash2, Edit3, ShieldAlert, Package, Calendar, Truck, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import EditMaterialModal from './EditMaterialModal';
import ConfirmDeleteModal, { DeleteActionButton } from '../common/ConfirmDeleteModal';

export default function MaterialDetailsPage({ lotId, parentSkuId, onBack }) {
  const { t, i18n } = useTranslation();
  const { inventory, deleteInventoryBatch, editInventoryBatch, equipment, showToast } = useApp();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Find target material item and batch lot
  let targetItem = null;
  let targetLot = null;

  if (parentSkuId) {
    targetItem = inventory.find(i => i.id === parentSkuId);
    if (targetItem && targetItem.batches) {
      targetLot = targetItem.batches.find(b => b.id === lotId) || targetItem.batches[0];
    }
  }

  if (!targetItem && lotId) {
    for (const item of inventory) {
      if (item.batches) {
        const found = item.batches.find(b => b.id === lotId);
        if (found) {
          targetItem = item;
          targetLot = found;
          break;
        }
      }
    }
  }

  // Construct combined lot object if lot isn't found directly
  const lotData = targetLot ? { parentItem: targetItem, ...targetLot } : {
    parentItem: targetItem,
    id: lotId || `LOT-${targetItem?.id?.slice(-3) || '001'}`,
    purchaseDate: '-',
    supplierName: '-',
    costPerSheet: targetItem?.costPerConsumptionUnit || 0,
    currentQty: targetItem?.currentStock || 0,
    initialQty: targetItem?.currentStock || 0
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

  const isInkCategory = targetItem.category === 'Ink';
  const linkedMachine = equipment?.find(eq => eq.linkedMaterialSku === targetItem.id);

  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num || 0).replace('LAK', '₭');
  };

  const renderDualUnitQuantity = (currentQty, category, purchaseUnit, consumptionUnit, itemsPerPurchaseUnit = 500) => {
    if (category === 'Paper') {
      const reams = Math.floor(currentQty / itemsPerPurchaseUnit);
      return (
        <div>
          <span className="text-xl font-black text-slate-900 font-mono block">
            {reams > 0 ? `${reams} ${purchaseUnit || 'Ream'}` : `${currentQty} ${consumptionUnit || 'Sheets'}`}
          </span>
          <span className="text-xs text-slate-500 block font-semibold mt-0.5">
            ({currentQty} {consumptionUnit || 'Sheets'})
          </span>
        </div>
      );
    }

    if (category === 'Ink') {
      const bottles = Math.floor(currentQty / 1000) || 1;
      return (
        <div>
          <span className="text-xl font-black text-slate-900 font-mono block">
            {bottles} {purchaseUnit || 'Bottle'}
          </span>
          <span className="text-xs text-slate-500 block font-semibold mt-0.5">
            ({currentQty} {consumptionUnit || 'ml'})
          </span>
        </div>
      );
    }

    return (
      <span className="text-xl font-black text-slate-900 font-mono block">
        {currentQty} {consumptionUnit || 'Units'}
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

  const handleSaveEditModal = (updatedLotData) => {
    if (targetItem.id && lotData.id) {
      editInventoryBatch(targetItem.id, lotData.id, {
        currentQty: updatedLotData.currentQty,
        costPerSheet: updatedLotData.costPerSheet,
        purchasePricePerReam: updatedLotData.purchasePricePerReam,
        supplierName: updatedLotData.supplierName
      });
      showToast(`${t('common.save')} ${t('common.details')}`, 'success');
      setIsEditModalOpen(false);
    }
  };

  const currentLang = i18n.language || 'lo';

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 space-y-6 animate-fade-in text-slate-800 font-sans pb-12">
      {/* Header & Back Navigation */}
      <div className="flex items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-200 shadow-sm">
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
                lotData.currentQty || targetItem.currentStock || 0,
                targetItem.category,
                targetItem.purchaseUnit,
                targetItem.consumptionUnit,
                targetItem.itemsPerPurchaseUnit
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
              <span className="text-xs text-slate-400 font-bold ml-1">/{targetItem.consumptionUnit || 'แผ่น'}</span>
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
                const qty = lotData.currentQty || targetItem.currentStock || 0;
                if (qty <= 0) {
                  return (
                    <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-black">
                      🔴 {currentLang === 'lo' ? 'ໝົດສະຕ໋ອກ (Out of Stock)' : 'Out of Stock'}
                    </span>
                  );
                }
                if (qty < 100) {
                  return (
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-black">
                      ⚠️ {currentLang === 'lo' ? 'ໃກ້ໝົດສະຕ໋ອກ (Low Stock Warning)' : 'Low Stock Warning'}
                    </span>
                  );
                }
                return (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black">
                    🟢 {currentLang === 'lo' ? 'ພ້ອມໃຊ້ງານ (In Stock)' : 'In Stock'}
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

      {/* Main Details Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        {/* Main Details Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Procurement & Master Info */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-sky-600" />
              <span>{currentLang === 'lo' ? 'ລາຍລະອຽດການສັ່ງຊື້ & ຜູ້ສະໜອງ' : 'Procurement & Supplier Info'}</span>
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs font-medium">
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">{currentLang === 'lo' ? 'ລະຫັດ PO / Ref ID:' : 'PO / Ref ID:'}</span>
                <span className="font-mono text-slate-900 font-bold">{lotData.poNumber || lotData.id || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">{currentLang === 'lo' ? 'ວັນທີຮັບ/ຕິດຕັ້ງ:' : 'Receipt Date:'}</span>
                <span className="text-slate-900 font-bold">{lotData.purchaseDate || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">{currentLang === 'lo' ? 'ຜູ້ສະໜອງ/ຮ້ານຄ້າ:' : 'Supplier Name:'}</span>
                <span className="text-slate-900 font-bold">{lotData.supplierName || targetItem.supplierName || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">{currentLang === 'lo' ? 'ຊ່ອງທາງການຊຳລະເງິນ:' : 'Payment Method:'}</span>
                <span className="font-bold text-slate-900">
                  {lotData.paymentMethod === 'CASH' ? (currentLang === 'lo' ? 'ເງິນສົດ (Cash)' : 'Cash') : (currentLang === 'lo' ? 'ໂອນເງິນ (Bank Transfer)' : 'Bank Transfer')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">{currentLang === 'lo' ? 'ຈຳນວນນຳເຂົ້າເລີ່ມຕົ້ນ:' : 'Initial Received Qty:'}</span>
                <span className="font-mono text-slate-900 font-bold">{lotData.initialQty || lotData.currentQty || 1} {targetItem.unit || targetItem.purchaseUnit || 'Units'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">{currentLang === 'lo' ? 'ມູນຄ່ານຳເຂົ້າລວມ:' : 'Total Purchase Value:'}</span>
                <span className="font-mono text-emerald-600 font-black text-sm block">
                  {formatLAK(lotData.purchasePrice || lotData.costPerSheet || targetItem.costPerConsumptionUnit)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: ERP Technical Specs */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>{currentLang === 'lo' ? 'ສະເປັກທາງເຕັກນິກ (ERP Technical Specs)' : 'ERP Technical Specs'}</span>
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs font-medium">
              {Object.entries(targetItem.specs || lotData.specs || {}).map(([key, val]) => {
                if (!val || key === 'tariffRate' || key === 'clickRate') return null;
                
                const labelMap = {
                  formFactor: currentLang === 'lo' ? 'ຮູບແບບບັນຈຸພັນ' : 'Form Factor',
                  grammage: currentLang === 'lo' ? 'ຄວາມໜາ/ນ້ຳໜັກ (GSM)' : 'Grammage (GSM)',
                  standardSize: currentLang === 'lo' ? 'ຂະໜາດມາດຕະຖານ' : 'Standard Size',
                  widthMm: currentLang === 'lo' ? 'ໜ້າກວ້າງ (mm)' : 'Width (mm)',
                  length: currentLang === 'lo' ? 'ຄວາມຍາວລວມ (m)' : 'Length (m)',
                  packQty: currentLang === 'lo' ? 'ຈຳນວນແຜ່ນຕໍ່ຣີມ' : 'Pack Qty',
                  inkType: currentLang === 'lo' ? 'ປະເພດໝຶກພິມ' : 'Ink Type',
                  colorModel: currentLang === 'lo' ? 'เฉดสี / ຕະລັບສີ' : 'Color Option',
                  volumePerBottle: currentLang === 'lo' ? 'ບໍລິມາດບັນຈຸ' : 'Volume/Bottle',
                  compatiblePrinter: currentLang === 'lo' ? 'ເຄື່ອງພິມທີ່ເຊື່ອມໂຍງ' : 'Linked Printer',
                  hwType: currentLang === 'lo' ? 'ໝວດໝູ່ອຸປະກອນ' : 'Hardware Type',
                  hwSpec: currentLang === 'lo' ? 'ເບີ/ສະເປັກສະເພາະ' : 'Hardware Spec',
                  packCount: currentLang === 'lo' ? 'ຈຳນວນບັນຈຸຕໍ່ກ່ອງ' : 'Pack Count',
                  containerWeight: currentLang === 'lo' ? 'ນ້ຳໜັກບັນຈຸ' : 'Container Weight'
                };

                return (
                  <div key={key} className="bg-white p-3 rounded-2xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-semibold">
                      {labelMap[key] || key.replace(/([A-Z])/g, ' $1')}:
                    </span>
                    <span className="text-slate-900 font-bold block mt-0.5">
                      {Array.isArray(val) ? val.join(', ') : val}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: FIFO Job Order Usage Ledger Table */}
          <div className="lg:col-span-2 bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-3 flex items-center justify-between">
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
                    <th className="py-3 px-4 text-right">ຕົ້ນທຶນรวม (LAK ₭)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {lotData.usageHistory && lotData.usageHistory.length > 0 ? (
                    lotData.usageHistory.map((u, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-600">{u.date}</td>
                        <td className="py-3 px-4 font-mono font-bold text-sky-600">{u.jobId}</td>
                        <td className="py-3 px-4 text-slate-800">{u.description || 'Production Printing Job'}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{u.qty} {targetItem.consumptionUnit || 'Units'}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">{formatLAK(u.cost)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400 font-semibold">
                        {currentLang === 'lo' ? 'ຍັງບໍ່ມີປະວັດການເບີກໃຊ້ງານສິນຄ້ານີ້' : 'No consumption history recorded yet'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <DeleteActionButton onClick={() => setIsDeleteModalOpen(true)} />
          
          {isInkCategory ? (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-xs shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>{t('common.edit')} (Link Printers)</span>
            </button>
          ) : (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
              🔒 Read-Only Stock Record
            </span>
          )}
        </div>
      </div>

      {/* Edit Material Modal */}
      {isEditModalOpen && (
        <EditMaterialModal
          isOpen={isEditModalOpen}
          materialData={lotData}
          onSave={handleSaveEditModal}
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
