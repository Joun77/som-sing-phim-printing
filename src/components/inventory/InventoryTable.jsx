import React, { useState } from 'react';
import { Eye, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import InventoryDetailsModal from './InventoryDetailsModal';
import EditMaterialModal from './EditMaterialModal';

export default function InventoryTable({ items, onRestockItem, onViewDetails }) {
  const { t } = useTranslation();
  const { editInventoryBatch, editInventorySku, showToast } = useApp();
  
  // Selected lot states for modal popups
  const [selectedLotModal, setSelectedLotModal] = useState(null);
  const [editingLotModal, setEditingLotModal] = useState(null);

  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num || 0).replace('LAK', '₭');
  };

  // Flatten all lots from all filtered items
  const flatLots = [];
  items.forEach(item => {
    if (item.batches && item.batches.length > 0) {
      item.batches.forEach(batch => {
        flatLots.push({
          parentItem: item,
          ...batch
        });
      });
    } else {
      // Fallback placeholder row if SKU has no lots logged
      flatLots.push({
        parentItem: item,
        id: `LOT-${item.id.slice(-3).toUpperCase()}-EMPTY`,
        purchaseDate: '-',
        supplierName: '-',
        purchasePricePerReam: item.costPerPurchaseUnit || 0,
        costPerSheet: item.costPerConsumptionUnit || 0,
        initialQty: 0,
        currentQty: 0
      });
    }
  });

  // Calculate stock status with quantity & thresholds
  const getStockStatusDetails = (parentItem, lotId, currentQty) => {
    const reorderThreshold = parentItem.reorderThreshold || 50;

    if (currentQty <= 0) {
      return {
        label: t('stock_status.out_of_stock'),
        className: 'bg-rose-50 text-rose-700 border-rose-200'
      };
    }

    if (currentQty < reorderThreshold) {
      return {
        label: t('stock_status.low_stock'),
        className: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }

    return {
      label: t('stock_status.ready'),
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  };

  const renderDualUnitQuantity = (currentQty, parentItem) => {
    const category = parentItem.category;
    const purchaseUnit = parentItem.purchaseUnit;
    const consumptionUnit = parentItem.consumptionUnit || 'Units';
    const itemsPerPurchaseUnit = parentItem.itemsPerPurchaseUnit || 500;

    if (category === 'Paper') {
      const reams = Math.floor(currentQty / itemsPerPurchaseUnit);
      return (
        <div>
          <span className="font-mono font-black text-slate-800 block">
            {reams > 0 ? `${reams} ${purchaseUnit || 'Ream'}` : `${currentQty} ${consumptionUnit}`}
          </span>
          <span className="text-[10px] text-slate-400 block font-bold">
            ({currentQty} {consumptionUnit})
          </span>
        </div>
      );
    }

    if (category === 'Ink') {
      const bottles = currentQty > 0 ? Math.ceil(currentQty / (parentItem.purchaseMultiplier || 1000)) : 0;
      return (
        <div>
          <span className="font-mono font-black text-slate-800 block">
            {bottles} {purchaseUnit || 'Bottle'}
          </span>
          <span className="text-[10px] text-slate-400 block font-bold">
            ({currentQty} {consumptionUnit || 'ml'})
          </span>
        </div>
      );
    }

    return (
      <span className="font-mono font-black text-slate-800">
        {currentQty} {consumptionUnit}
      </span>
    );
  };

  const handleSaveEditModal = (updatedLotData) => {
    const parentId = updatedLotData.parentItem?.id;
    const lotId = updatedLotData.id;

    if (parentId && lotId) {
      editInventoryBatch(parentId, lotId, {
        currentQty: updatedLotData.currentQty,
        costPerSheet: updatedLotData.costPerSheet,
        purchasePricePerReam: updatedLotData.purchasePricePerReam,
        supplierName: updatedLotData.supplierName
      });

      // Update SKU details (name, reorderThreshold, linkedMachineIds, colorModel)
      editInventorySku(parentId, {
        name: updatedLotData.parentItem.name,
        reorderThreshold: updatedLotData.parentItem.reorderThreshold,
        linkedMachineIds: updatedLotData.parentItem.linkedMachineIds,
        colorModel: updatedLotData.parentItem.colorModel
      });

      showToast(t('common.save') + ' ' + t('common.details'), 'success');
      setEditingLotModal(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-slate-800">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-500 tracking-wider">
              <th className="py-4 px-6">{t('inventory_status.lot_id')}</th>
              <th className="py-4 px-6">{t('inventory_status.item_sku')}</th>
              <th className="py-4 px-6">{t('inventory.material_cat')}</th>
              <th className="py-4 px-6">{t('inventory_status.received_initial')}</th>
              <th className="py-4 px-6">{t('inventory_status.remaining_qty')}</th>
              <th className="py-4 px-6">{t('inventory.material_status')}</th>
              <th className="py-4 px-6 text-right">{t('inventory_status.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
            {flatLots.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-400 font-bold">
                  No inventory batches logged.
                </td>
              </tr>
            ) : (
              flatLots.map((lot, idx) => {
                const parent = lot.parentItem;
                const statusDetails = getStockStatusDetails(parent, lot.id, lot.currentQty);

                return (
                  <tr key={`${lot.id}-${idx}`} className="hover:bg-slate-50/50 transition">
                    
                    {/* Batch ID */}
                    <td className="py-4.5 px-6 font-mono text-xs uppercase tracking-wider text-slate-500">
                      #{lot.id}
                    </td>
                    
                    {/* Item Name & SKU */}
                    <td className="py-4.5 px-6">
                      <div>
                        <span className="font-extrabold text-slate-800 block leading-tight">{parent.name}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 block mt-1 uppercase">{parent.id}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4.5 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        parent.category === 'Paper' 
                          ? 'bg-blue-50 text-blue-700 border-blue-100'
                          : parent.category === 'Ink'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : parent.category === 'Film'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          : 'bg-purple-50 text-purple-700 border-purple-100'
                      }`}>
                        {parent.category}
                      </span>
                    </td>

                    {/* Received Date & Initial Qty */}
                    <td className="py-4.5 px-6">
                      <div>
                        <span className="font-bold text-slate-700 block font-mono text-xs">{lot.purchaseDate}</span>
                        <span className="text-[10px] text-slate-400 block font-sans">Init: {lot.initialQty} {parent.consumptionUnit}</span>
                      </div>
                    </td>

                    {/* Remaining Qty */}
                    <td className="py-4.5 px-6">
                      {renderDualUnitQuantity(lot.currentQty, parent)}
                    </td>

                    {/* Stock Status Column */}
                    <td className="py-4.5 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${statusDetails.className}`}>
                        <span>{statusDetails.label}</span>
                      </span>
                    </td>

                    {/* Action Column: Clean Details Button */}
                    <td className="py-4.5 px-6 text-right">
                      <button
                        onClick={() => {
                          if (onViewDetails) {
                            onViewDetails(lot);
                          } else {
                            setSelectedLotModal(lot);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition active:scale-95 border border-slate-200"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                        <span>{t('common.details')}</span>
                      </button>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Fallback Modal Details if onViewDetails not provided */}
      {selectedLotModal && (
        <InventoryDetailsModal
          lot={selectedLotModal}
          onClose={() => setSelectedLotModal(null)}
          onEdit={(lotToEdit) => {
            setSelectedLotModal(null);
            setEditingLotModal(lotToEdit);
          }}
        />
      )}

      {/* Dedicated Edit Modal */}
      {editingLotModal && (
        <EditMaterialModal
          isOpen={Boolean(editingLotModal)}
          materialData={editingLotModal}
          onSave={handleSaveEditModal}
          onClose={() => setEditingLotModal(null)}
        />
      )}
    </div>
  );
}


