import React, { useState } from 'react';
import { ArrowLeft, Trash2, Edit3, ShieldAlert, Package, Calendar, Truck, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import EditMaterialModal from './EditMaterialModal';

export default function MaterialDetailsPage({ lotId, parentSkuId, onBack }) {
  const { t } = useTranslation();
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 space-y-6 animate-fade-in text-slate-800 font-sans pb-12">
      {/* Header & Back Navigation */}
      <div className="flex items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-200 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-100 rounded-2xl border border-slate-200 active:scale-95 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>
      </div>

      {/* Main Material Overview Layout: 2-Column Grid */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Product Image Card */}
          <div className="space-y-3">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              ຮູບພາບສິນຄ້າ (Product Image)
            </span>
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 flex items-center justify-center min-h-[260px] relative overflow-hidden">
              {(targetItem.itemPhoto || lotData.itemPhoto) ? (
                <img 
                  src={targetItem.itemPhoto || lotData.itemPhoto} 
                  alt={targetItem.name}
                  className="w-full h-64 object-contain rounded-2xl" 
                />
              ) : (
                <div className="text-center space-y-2 p-6">
                  <Package className="w-12 h-12 text-slate-300 mx-auto" />
                  <span className="text-xs font-bold text-slate-400 block">
                    ບໍ່ມີຮູບພາບສິນຄ້າ (No Product Image)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Material Parameters & Specifications */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="inline-flex items-center px-3 py-1 bg-sky-50 text-sky-700 font-mono font-black text-xs rounded-full border border-sky-200 uppercase">
                  {targetItem.category || 'General'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  {targetItem.name}
                </h2>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 font-black block uppercase">SKU / LOT</span>
                <span className="text-sm font-black text-slate-800">{lotData.id}</span>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">{t('inventory_status.remaining_qty')}</span>
                <div className="mt-1">
                  {renderDualUnitQuantity(
                    lotData.currentQty,
                    targetItem.category,
                    targetItem.purchaseUnit,
                    targetItem.consumptionUnit,
                    targetItem.itemsPerPurchaseUnit
                  )}
                </div>
              </div>

              <div className="bg-emerald-50/70 p-4.5 rounded-2xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-black uppercase block">{t('inventory_status.unit_cost')}</span>
                <span className="text-xl font-black text-emerald-800 block mt-1 font-mono">
                  {formatLAK(lotData.costPerSheet || targetItem.costPerConsumptionUnit)}
                </span>
                <span className="text-[10px] text-emerald-600 block font-semibold">/{targetItem.consumptionUnit || 'Unit'}</span>
              </div>

              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">{t('inventory_status.received_initial')}</span>
                <span className="text-sm font-black text-slate-900 block mt-1 font-mono">{lotData.purchaseDate || '-'}</span>
              </div>

              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">{t('inventory.supplier_name')}</span>
                <span className="text-sm font-black text-slate-900 block mt-1 truncate">{lotData.supplierName || 'Vientiane Supply'}</span>
                {(lotData.supplierContact || targetItem.supplierContact) && (
                  <span className="text-[10px] font-mono text-sky-600 font-bold block mt-0.5 truncate">
                    📞 {lotData.supplierContact || targetItem.supplierContact}
                  </span>
                )}
              </div>
            </div>

            {/* Conditional Multi-Select Machinery Link Section - Ink Category Only */}
            {isInkCategory && (
              <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 space-y-2">
                <span className="text-xs text-indigo-700 font-black uppercase block">{t('equipment_mapping.linked_material')}</span>
                {(() => {
                  const machineIds = targetItem.linkedMachineIds || (targetItem.linkedMachineId ? [targetItem.linkedMachineId] : []);
                  const machines = equipment?.filter(eq => machineIds.includes(eq.id) || eq.linkedMaterialSku === targetItem.id);

                  if (machines && machines.length > 0) {
                    return (
                      <div className="flex flex-wrap gap-2">
                        {machines.map(m => (
                          <span key={m.id} className="px-3 py-1 bg-white border border-indigo-200 text-indigo-900 rounded-xl text-xs font-black shadow-sm">
                            🖨️ {m.name} ({m.id})
                          </span>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <p className="text-xs font-bold text-slate-400">
                      {t('equipment_mapping.no_linked_material')}
                    </p>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl font-black text-xs transition active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('common.delete')}</span>
          </button>
          
          {/* Edit button allowed only for Ink category to update Multi-Select Printer Links */}
          {isInkCategory ? (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-xs shadow-sm transition active:scale-95"
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert className="w-7 h-7" />
              <div>
                <h3 className="font-black text-base text-slate-900">{t('common.confirm')} {t('common.delete')}</h3>
                <p className="text-xs text-slate-500 font-semibold">{targetItem.name} (#{lotData.id})</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteRecord}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs shadow-sm"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
