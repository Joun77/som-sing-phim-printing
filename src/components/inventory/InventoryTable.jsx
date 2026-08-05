import React, { useState } from 'react';
import { Calendar, Trash2, Edit3, Save, X, Link as LinkIcon, CheckCircle2, Play, CircleAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function InventoryTable({ items, onRestockItem }) {
  const { equipment, deleteInventoryBatch, editInventoryBatch } = useApp();
  
  // Edit mode states
  const [editingLotId, setEditingLotId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editQty, setEditQty] = useState('');

  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num).replace('LAK', '₭');
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

  // Sort flat lots: Active first (In Use, Unopened) then Depleted, then by purchase date
  const getLotStatus = (parentItem, lotId, currentQty, purchaseDate) => {
    if (currentQty <= 0) return 'Depleted';
    
    // Oldest active lot (where currentQty > 0) for this parent SKU is "In Use"
    const activeLots = (parentItem.batches || [])
      .filter(b => b.currentQty > 0)
      .sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate));

    if (activeLots.length > 0 && activeLots[0].id === lotId) {
      return 'In Use';
    }
    return 'Unopened';
  };

  const handleStartEdit = (lot) => {
    setEditingLotId(lot.id);
    setEditPrice(lot.purchasePricePerReam);
    setEditQty(lot.currentQty);
  };

  const handleSaveEdit = (parentItemId, lotId) => {
    editInventoryBatch(parentItemId, lotId, {
      purchasePricePerReam: Number(editPrice),
      currentQty: Number(editQty)
    });
    setEditingLotId(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-slate-800">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-500 tracking-wider">
              <th className="py-4 px-6">Lot / Batch ID</th>
              <th className="py-4 px-6">Item Name & SKU</th>
              <th className="py-4 px-6">Category</th>
              <th className="py-4 px-6">Received / Initial</th>
              <th className="py-4 px-6">Remaining Qty</th>
              <th className="py-4 px-6">Unit Cost</th>
              <th className="py-4 px-6">Linked Machine</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
            {flatLots.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-12 text-center text-slate-400 font-bold">
                  No inventory batches logged.
                </td>
              </tr>
            ) : (
              flatLots.map((lot, idx) => {
                const parent = lot.parentItem;
                const status = getLotStatus(parent, lot.id, lot.currentQty, lot.purchaseDate);
                const isEditing = editingLotId === lot.id;
                
                // Find linked machine
                const linkedMachine = equipment.find(eq => eq.linkedMaterialSku === parent.id);

                return (
                  <tr key={`${lot.id}-${idx}`} className="hover:bg-slate-50/50 transition">
                    
                    {/* Batch ID */}
                    <td className="py-4.5 px-6 font-mono text-xs uppercase tracking-wider text-slate-500">
                      #{lot.id}
                    </td>
                    
                    {/* Item Name */}
                    <td className="py-4.5 px-6">
                      <div>
                        <span className="font-extrabold text-slate-800 block leading-tight">{parent.name}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 block mt-1 uppercase">{parent.id}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4.5 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
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

                    {/* Received Date & Initial */}
                    <td className="py-4.5 px-6">
                      <div>
                        <span className="font-bold text-slate-700 block">{lot.purchaseDate}</span>
                        <span className="text-[10px] text-slate-400 block font-sans">Init: {lot.initialQty} {parent.consumptionUnit}</span>
                      </div>
                    </td>

                    {/* Remaining Qty */}
                    <td className="py-4.5 px-6">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          className="w-20 px-2 py-1 border rounded font-sans text-xs font-bold focus:outline-none"
                        />
                      ) : (
                        <span className="font-sans font-black text-slate-800">
                          {lot.currentQty} {parent.consumptionUnit}
                        </span>
                      )}
                    </td>

                    {/* Unit Cost */}
                    <td className="py-4.5 px-6 font-sans font-black text-slate-800">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-24 px-2 py-1 border rounded font-sans text-xs font-bold focus:outline-none"
                        />
                      ) : (
                        <span>{formatLAK(lot.costPerSheet)}</span>
                      )}
                      <span className="text-[10px] text-slate-400 font-bold block">/{parent.consumptionUnit}</span>
                    </td>

                    {/* Linked Machine */}
                    <td className="py-4.5 px-6">
                      {linkedMachine ? (
                        <div className="flex items-center gap-1 text-xs text-indigo-600 font-bold">
                          <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[120px]">{linkedMachine.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Unlinked</span>
                      )}
                    </td>

                    {/* Status Tag */}
                    <td className="py-4.5 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        status === 'In Use'
                          ? 'text-green-700 bg-green-50 border-green-200'
                          : status === 'Unopened'
                          ? 'text-slate-600 bg-slate-100 border-slate-200'
                          : 'text-red-700 bg-red-50 border-red-200'
                      }`}>
                        {status === 'In Use' ? (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>In Use</span>
                          </>
                        ) : status === 'Unopened' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Unopened</span>
                          </>
                        ) : (
                          <>
                            <CircleAlert className="w-3 h-3" />
                            <span>Depleted</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4.5 px-6 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleSaveEdit(parent.id, lot.id)}
                            className="p-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100"
                            title="Save"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingLotId(null)}
                            className="p-1.5 bg-slate-50 border rounded-lg hover:bg-slate-100"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1.5">
                          {status === 'Unopened' && (
                            <>
                              <button
                                onClick={() => handleStartEdit(lot)}
                                className="p-1.5 hover:bg-slate-100 border rounded-lg transition"
                                title="Edit Lot Details"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                              </button>
                              <button
                                onClick={() => deleteInventoryBatch(parent.id, lot.id)}
                                className="p-1.5 hover:bg-red-50 border border-transparent hover:border-red-200 text-red-500 rounded-lg transition"
                                title="Delete Reserve Lot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
