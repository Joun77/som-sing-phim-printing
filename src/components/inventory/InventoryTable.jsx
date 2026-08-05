import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Calendar, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';

export default function InventoryTable({ items, onRestockItem }) {
  const { currentLang } = useTranslation();
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (itemId) => {
    setExpandedRows(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num).replace('LAK', '₭');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-500 tracking-wider">
              <th className="py-4 px-6 w-10"></th>
              <th className="py-4 px-6">Item details</th>
              <th className="py-4 px-6">Category</th>
              <th className="py-4 px-6">Available Stock</th>
              <th className="py-4 px-6">FIFO Inbound Cost</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
            {items.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400 font-bold">
                  No inventory items match the current filters.
                </td>
              </tr>
            ) : (
              items.map(item => {
                const isExpanded = !!expandedRows[item.id];
                const activeLotsCount = item.batches ? item.batches.filter(b => b.currentQty > 0).length : 0;
                
                // Low stock check
                const isLowStock = item.stockQty <= (item.reorderThreshold || 10);

                // Ink dual unit string
                let stockStr = `${item.stockQty} ${item.consumptionUnit}`;
                if (item.category === 'Ink') {
                  const bottles = item.stockQty / (item.purchaseMultiplier || 100);
                  stockStr = `${item.stockQty} ml (${bottles.toFixed(1)} bottles)`;
                }

                // Get first active FIFO lot cost or fall back to default cost
                const activeInboundLot = item.batches ? item.batches.find(b => b.currentQty > 0) : null;
                const inboundPrice = activeInboundLot 
                  ? formatLAK(activeInboundLot.costPerSheet)
                  : formatLAK(item.costPerConsumptionUnit);

                return (
                  <React.Fragment key={item.id}>
                    <tr className={`hover:bg-slate-50/50 transition ${isExpanded ? 'bg-slate-50/20' : ''}`}>
                      <td className="py-4.5 px-6">
                        {item.batches && item.batches.length > 0 && (
                          <button onClick={() => toggleRow(item.id)} className="p-1 hover:bg-slate-200 rounded transition text-slate-400">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                      <td className="py-4.5 px-6">
                        <div>
                          <span className="font-extrabold text-slate-800 block leading-tight">{item.name}</span>
                          <span className="text-[10px] font-mono font-bold text-slate-400 block mt-1 uppercase">{item.id}</span>
                        </div>
                      </td>
                      <td className="py-4.5 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${
                          item.category === 'Paper' 
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : item.category === 'Ink'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : item.category === 'Film'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                            : 'bg-purple-50 text-purple-700 border-purple-100'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 font-sans">
                        <div className="flex items-center gap-2">
                          <span className={`font-black ${isLowStock ? 'text-red-600' : 'text-slate-800'}`}>{stockStr}</span>
                          {isLowStock && (
                            <span className="inline-flex text-red-500 animate-pulse" title="Low Stock Warning">
                              <ShieldAlert className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4.5 px-6 font-sans font-black text-slate-800">
                        {inboundPrice} <span className="text-[10px] text-slate-400 font-bold">/{item.consumptionUnit}</span>
                      </td>
                      <td className="py-4.5 px-6 text-right">
                        <button
                          onClick={() => onRestockItem(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition text-xs font-bold text-slate-700 rounded-xl"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Restock Lot</span>
                        </button>
                      </td>
                    </tr>

                    {/* Expandable FIFO Lots Accordion Row */}
                    {isExpanded && item.batches && item.batches.length > 0 && (
                      <tr className="bg-slate-50/30">
                        <td colSpan="6" className="py-4 px-8 border-l-4 border-accent-sky">
                          <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-accent-sky" />
                              <span>Active FIFO Lots Ledger ({activeLotsCount} active lots)</span>
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                              {item.batches.map((batch, index) => {
                                const isExhausted = batch.currentQty <= 0;
                                let batchStockStr = `${batch.currentQty} / ${batch.initialQty} ${item.consumptionUnit}`;
                                if (item.category === 'Ink') {
                                  batchStockStr = `${batch.currentQty}ml / ${batch.initialQty}ml (${(batch.currentQty/(item.purchaseMultiplier || 100)).toFixed(1)} btl)`;
                                }

                                return (
                                  <div 
                                    key={batch.id || index}
                                    className={`p-3 rounded-2xl border transition text-xs font-bold ${
                                      isExhausted 
                                        ? 'bg-slate-100/50 border-slate-200 text-slate-400 opacity-60' 
                                        : 'bg-white border-slate-200/80 text-slate-700 shadow-sm'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">{batch.id}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                        isExhausted ? 'bg-slate-200 text-slate-500' : 'bg-green-50 text-green-700 border border-green-200/50'
                                      }`}>
                                        {isExhausted ? 'Exhausted' : 'Active'}
                                      </span>
                                    </div>
                                    <div className="space-y-1 mt-1.5">
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Date:</span>
                                        <span>{batch.purchaseDate}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Vendor:</span>
                                        <span className="truncate max-w-[120px]">{batch.supplierName}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Qty remaining:</span>
                                        <span className="font-sans font-black">{batchStockStr}</span>
                                      </div>
                                      <div className="flex justify-between text-slate-800 border-t border-slate-100 pt-1 mt-1 font-extrabold">
                                        <span>Cost:</span>
                                        <span className="font-sans text-accent-sky">{formatLAK(batch.costPerSheet)}/{item.consumptionUnit}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
