import React, { useState } from 'react';
import { Eye, Edit3, Plus, Minus, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import InventoryDetailsModal from './InventoryDetailsModal';
import EditMaterialModal from './EditMaterialModal';

export default function InventoryTable({ items, activeTab, onRestockItem, onViewDetails }) {
  const { t } = useTranslation();
  const { editInventoryBatch, editInventorySku, showToast, formatCurrency, quickAdjustStock } = useApp();
  
  const [selectedLotModal, setSelectedLotModal] = useState(null);
  const [editingLotModal, setEditingLotModal] = useState(null);
  const [hoverImage, setHoverImage] = useState(null);

  const formatLAK = formatCurrency;
  const isInkView = activeTab === 'Ink';

  // Flatten lots
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
        className: 'bg-amber-50 text-amber-700 border-amber-200 font-bold animate-pulse'
      };
    }
    return {
      label: t('stock_status.ready'),
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  };

  const handleQuickAdjust = (itemId, amount) => {
    quickAdjustStock(itemId, amount);
    showToast('Stock adjusted successfully!', 'success');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm relative">
      
      {/* Floating Image Preview Hover */}
      {hoverImage && (
        <div className="absolute z-[60] bg-white border border-slate-200 rounded-2xl p-2 shadow-2xl pointer-events-none top-10 left-10 w-40 h-40">
          <img src={hoverImage} alt="Preview" className="w-full h-full object-cover rounded-xl" />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-slate-800">
          <thead>
            {isInkView ? (
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-4 px-4">Ink Code</th>
                <th className="py-4 px-4">Preview</th>
                <th className="py-4 px-4">Color Name</th>
                <th className="py-4 px-4">Group</th>
                <th className="py-4 px-4">Volume</th>
                <th className="py-4 px-4 text-right">Remaining Qty</th>
                <th className="py-4 px-4 text-right">Unit Price</th>
                <th className="py-4 px-4 text-right">Total Asset</th>
                <th className="py-4 px-4">Base Type</th>
                <th className="py-4 px-4">OEM/Comp</th>
                <th className="py-4 px-4">Supplier</th>
                <th className="py-4 px-4 text-center">Receipt</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            ) : (
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-500 tracking-wider">
                <th className="py-4 px-6">{t('inventory_status.lot_id')}</th>
                <th className="py-4 px-6">{t('inventory_status.item_sku')}</th>
                <th className="py-4 px-6">{t('inventory.material_cat')}</th>
                <th className="py-4 px-6">{t('inventory_status.received_initial')}</th>
                <th className="py-4 px-6">{t('inventory_status.remaining_qty')}</th>
                <th className="py-4 px-6">{t('inventory.material_status')}</th>
                <th className="py-4 px-6 text-right">{t('inventory_status.actions')}</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {flatLots.length === 0 ? (
              <tr>
                <td colSpan={isInkView ? 13 : 7} className="py-12 text-center text-slate-400 font-bold">
                  No inventory logged.
                </td>
              </tr>
            ) : (
              flatLots.map((lot, idx) => {
                const parent = lot.parentItem;
                const statusDetails = getStockStatusDetails(parent, lot.id, lot.currentQty);
                const isLowStock = lot.currentQty < (parent.reorderThreshold || 50);

                if (isInkView) {
                  const totalAssetValue = lot.currentQty * (parent.unitPrice || parent.costPerPurchaseUnit || 0);
                  return (
                    <tr 
                      key={`${lot.id}-${idx}`} 
                      className={`hover:bg-slate-50/50 transition ${
                        isLowStock ? 'bg-red-50/30 border-l-4 border-l-red-500' : ''
                      }`}
                    >
                      {/* Ink Code */}
                      <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">{parent.inkCode || parent.id}</td>
                      
                      {/* Preview */}
                      <td className="py-3.5 px-4">
                        {parent.imageUrl ? (
                          <div 
                            className="relative cursor-pointer"
                            onMouseEnter={() => setHoverImage(parent.imageUrl)}
                            onMouseLeave={() => setHoverImage(null)}
                          >
                            <img src={parent.imageUrl} alt="Ink" className="w-8 h-8 object-cover rounded-lg border border-slate-200" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </td>

                      {/* Color Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">{parent.colorName || parent.name}</td>
                      
                      {/* Group */}
                      <td className="py-3.5 px-4">{parent.colorGroup || '-'}</td>
                      
                      {/* Volume */}
                      <td className="py-3.5 px-4 font-mono">{parent.volume || parent.purchaseMultiplier || '-'} ml</td>
                      
                      {/* Remaining Qty */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-black text-slate-800">{lot.currentQty.toLocaleString()} ml</div>
                        <div className="flex gap-1 justify-end mt-1">
                          <button
                            onClick={() => handleQuickAdjust(parent.id, -50)}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[9px] font-extrabold flex items-center gap-0.5"
                            title="Deduct 50ml"
                          >
                            <Minus className="w-2 h-2" /> 50
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(parent.id, 50)}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[9px] font-extrabold flex items-center gap-0.5"
                            title="Add 50ml"
                          >
                            <Plus className="w-2 h-2" /> 50
                          </button>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-4 text-right font-mono">{formatLAK(parent.unitPrice || parent.costPerPurchaseUnit || 0)}</td>
                      
                      {/* Total Asset */}
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-extrabold">{formatLAK(totalAssetValue)}</td>
                      
                      {/* Base Type */}
                      <td className="py-3.5 px-4">{parent.inkBaseType || '-'}</td>
                      
                      {/* OEM/Compatible */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          parent.isCompatible ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-green-50 text-green-700 border border-green-100'
                        }`}>
                          {parent.isCompatible ? 'Compatible' : 'OEM'}
                        </span>
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-4 text-slate-500 font-medium max-w-[120px] truncate" title={parent.supplier}>{parent.supplier || '-'}</td>

                      {/* Receipt */}
                      <td className="py-3.5 px-4 text-center">
                        {parent.receiptUrl || lot.receiptUrl ? (
                          <a href={parent.receiptUrl || lot.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline inline-flex items-center gap-0.5">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onViewDetails ? onViewDetails(lot) : setSelectedLotModal(lot)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border rounded-lg text-[10px] font-black transition cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                }

                // General View (Paper, Hardware, etc.)
                return (
                  <tr key={`${lot.id}-${idx}`} className="hover:bg-slate-50/50 transition">
                    <td className="py-4.5 px-6 font-mono text-xs uppercase tracking-wider text-slate-500">#{lot.id}</td>
                    <td className="py-4.5 px-6">
                      <div>
                        <span className="font-extrabold text-slate-800 block leading-tight">{parent.name}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 block mt-1 uppercase">{parent.id}</span>
                      </div>
                    </td>
                    <td className="py-4.5 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border bg-slate-100 text-slate-700`}>
                        {parent.category}
                      </span>
                    </td>
                    <td className="py-4.5 px-6">
                      <div>
                        <span className="font-bold text-slate-700 block font-mono text-xs">{lot.purchaseDate}</span>
                        <span className="text-[10px] text-slate-400 block font-sans">Init: {lot.initialQty} {parent.consumptionUnit}</span>
                      </div>
                    </td>
                    <td className="py-4.5 px-6 font-mono text-slate-800">{lot.currentQty} {parent.consumptionUnit}</td>
                    <td className="py-4.5 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${statusDetails.className}`}>
                        <span>{statusDetails.label}</span>
                      </span>
                    </td>
                    <td className="py-4.5 px-6 text-right">
                      <button
                        onClick={() => onViewDetails ? onViewDetails(lot) : setSelectedLotModal(lot)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition active:scale-95 border border-slate-200 cursor-pointer"
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



