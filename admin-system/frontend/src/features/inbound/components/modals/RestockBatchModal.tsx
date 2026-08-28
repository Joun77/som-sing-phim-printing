import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@store/AppContext';
import { FormModalTemplate } from '@components/common';
import { 
  RefreshCw, 
  Search, 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  Layers, 
  DollarSign, 
  PackageCheck,
  AlertCircle
} from 'lucide-react';

interface RestockBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (items: any[]) => void;
}

export default function RestockBatchModal({ isOpen, onClose, onSuccess }: RestockBatchModalProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const { inventory, addInventoryBatch, formatCurrency, showToast, saveInventoryToBackend } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  // Selected items map: { [id: string]: { qty: number; unitPrice: number; supplier: string; date: string } }
  const [selectedMap, setSelectedMap] = useState<Record<string, { qty: number; unitPrice: number; supplier: string; date: string }>>({});

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || (item.category || '').toUpperCase() === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [inventory, searchQuery, categoryFilter]);

  const toggleSelect = (id: string, defaultPrice: number = 0) => {
    setSelectedMap(prev => {
      const copy = { ...prev };
      if (copy[id]) {
        delete copy[id];
      } else {
        copy[id] = {
          qty: 1,
          unitPrice: defaultPrice || 0,
          supplier: '',
          date: new Date().toISOString().split('T')[0]
        };
      }
      return copy;
    });
  };

  const updateItemField = (id: string, field: 'qty' | 'unitPrice' | 'supplier' | 'date', value: any) => {
    setSelectedMap(prev => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: {
          ...prev[id],
          [field]: value
        }
      };
    });
  };

  const selectedCount = Object.keys(selectedMap).length;
  const grandTotalLAK = Object.entries(selectedMap).reduce((sum, [id, data]) => {
    return sum + ((Number(data.qty) || 0) * (Number(data.unitPrice) || 0));
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCount === 0) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກສິນຄ້າຢ່າງໜ້ອຍ 1 ລາຍການ' : 'Please select at least 1 item to restock', 'warning');
      return;
    }

    const restockEntries: any[] = [];

    Object.entries(selectedMap).forEach(([id, data]) => {
      const originalItem = inventory.find(i => i.id === id);
      if (!originalItem) return;

      const packQty = Number(data.qty) || 1;
      const multiplier = Number(originalItem.purchaseMultiplier) || 1;
      const totalUnitsAdded = packQty * multiplier;
      const unitPrice = Number(data.unitPrice) || 0;
      const perUnitCost = multiplier > 0 ? unitPrice / multiplier : unitPrice;

      const logId = `INB-RESTOCK-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const inputDate = data.date || now.toISOString().split('T')[0];
      const fullDateTime = inputDate.includes(':') ? inputDate : `${inputDate} ${timeStr}`;

      addInventoryBatch(id, {
        batchId: `LOT-${logId}`,
        purchaseDate: fullDateTime,
        supplierName: data.supplier || 'Restock Vendor',
        purchasePrice: unitPrice,
        purchaseQty: packQty,
        sheetsToAdd: totalUnitsAdded
      });

      const originalSku = originalItem.sku || originalItem.id;
      const inboundLog = {
        id: logId,
        poNumber: logId,
        inboundDate: fullDateTime,
        receiptDate: fullDateTime,
        category: originalItem.category?.toUpperCase() || 'MATERIAL',
        categoryPill: 'RESTOCK',
        name: originalItem.name,
        itemName: originalItem.name,
        sku: originalSku,
        skuCode: originalSku,
        currentQty: packQty,
        initialQty: packQty,
        quantity: packQty,
        unit: originalItem.purchaseUnit || originalItem.consumptionUnit || 'Unit',
        subUnit: `(${packQty} ${originalItem.purchaseUnit || 'Unit'})`,
        supplier: data.supplier || 'Restock Supplier',
        supplierName: data.supplier || 'Restock Supplier',
        totalPrice: unitPrice * packQty,
        paymentMethod: 'TRANSFER',
        specs: {
          isRestock: true,
          materialId: id,
          sku: originalSku,
          skuCode: originalSku,
          restockQty: packQty,
          unitPrice: unitPrice,
          sheets_per_pack: multiplier,
          sheets_per_ream: multiplier
        }
      };

      // Sync restock record to backend API
      saveInventoryToBackend({
        ...originalItem,
        stockQty: (Number(originalItem.stockQty) || 0) + totalUnitsAdded,
        costPerPurchaseUnit: unitPrice,
        costPerConsumptionUnit: perUnitCost
      });

      fetch('http://localhost:8080/api/inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inboundLog)
      }).catch(err => console.log('Restock inbound API sync error:', err));

      restockEntries.push(inboundLog);
    });

    if (onSuccess) {
      onSuccess(restockEntries);
    }

    showToast(
      currentLang === 'lo' 
        ? `ເຕີມສະຕັອກສຳເລັດ ${selectedCount} ລາຍການ!` 
        : `Successfully restocked ${selectedCount} items!`, 
      'success'
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<RefreshCw className="w-5 h-5 text-emerald-600" />}
      title={currentLang === 'lo' ? 'ເຕີມສະຕັອກສິນຄ້າເດີມ (Restock Inventory)' : 'Restock Existing Inventory'}
      subtitle={currentLang === 'lo' ? 'ເລືອກສິນຄ້າໃນຄັງເພື່ອເພີ່ມຈຳນວນສະຕັອກ ແລະ ບັນທຶກປະຫວັດ' : 'Multi-select catalog items to replenish stock and update moving cost'}
      badgeText="RESTOCK BATCH"
      maxWidthClass="max-w-[96vw] w-[96vw] max-h-[94vh]"
    >
      <form onSubmit={handleSubmit} className="space-y-6 font-sans">
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-100/80 p-3.5 rounded-2xl">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={currentLang === 'lo' ? 'ຄົ້ນຫາຊື່ສິນຄ້າ, SKU, ລະຫັດ...' : 'Search items by name, SKU, code...'}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['ALL', 'PAPER', 'INK', 'FINISHING', 'LAMINATION'].map(cat => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-2 rounded-xl text-[11px] font-black transition cursor-pointer shrink-0 ${
                  categoryFilter === cat ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? (currentLang === 'lo' ? 'ທັງໝົດ' : 'ALL') : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Item Selection Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-[11px] font-black text-slate-600 uppercase border-b border-slate-200 z-10">
                <tr>
                  <th className="p-3.5 w-12 text-center">{currentLang === 'lo' ? 'ເລືອກ' : 'Select'}</th>
                  <th className="p-3.5">{currentLang === 'lo' ? 'ລາຍການສິນຄ້າ / SKU' : 'Item / SKU'}</th>
                  <th className="p-3.5">{currentLang === 'lo' ? 'ສະຕັອກປັດຈຸບັນ' : 'Current Stock'}</th>
                  <th className="p-3.5 w-36">{currentLang === 'lo' ? 'ຈຳນວນເຕີມ (Qty)' : 'Restock Qty'}</th>
                  <th className="p-3.5 w-44">{currentLang === 'lo' ? 'ລາຄາຊື້ / ຫົວໜ່ວຍ (LAK)' : 'Unit Cost (LAK)'}</th>
                  <th className="p-3.5 w-48">{currentLang === 'lo' ? 'ຜູ້ສະໜອງ (Supplier)' : 'Supplier'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      {currentLang === 'lo' ? 'ບໍ່ພົບສິນຄ້າທີ່ກົງກັບເງື່ອນໄຂ' : 'No items match your criteria'}
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map(item => {
                    const isSelected = !!selectedMap[item.id];
                    const selectedData = selectedMap[item.id];

                    return (
                      <tr 
                        key={item.id}
                        className={`transition hover:bg-slate-50/80 ${isSelected ? 'bg-emerald-50/40' : ''}`}
                      >
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelect(item.id, item.costPerPurchaseUnit || item.costPerConsumptionUnit || 0)}
                            className="cursor-pointer text-emerald-600 hover:text-emerald-700 transition"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 fill-emerald-100" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-300" />
                            )}
                          </button>
                        </td>

                        <td className="p-3.5">
                          <div className="font-extrabold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            [{item.category}] SKU: {item.sku || item.id}
                          </div>
                        </td>

                        <td className="p-3.5 font-bold">
                          <span className={`px-2 py-1 rounded-lg text-xs ${
                            (item.stockQty || 0) <= 50 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.stockQty || 0} {item.consumptionUnit || item.purchaseUnit || 'Unit'}
                          </span>
                        </td>

                        <td className="p-3.5">
                          {isSelected ? (
                            <input
                              type="number"
                              min="1"
                              value={selectedData?.qty || 1}
                              onChange={(e) => updateItemField(item.id, 'qty', Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-white font-bold text-xs focus:outline-none"
                            />
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        <td className="p-3.5">
                          {isSelected ? (
                            <input
                              type="number"
                              value={selectedData?.unitPrice || ''}
                              onChange={(e) => updateItemField(item.id, 'unitPrice', Number(e.target.value))}
                              placeholder="0"
                              className="w-full px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-white font-bold text-xs focus:outline-none"
                            />
                          ) : (
                            <span className="text-slate-400">{formatCurrency(item.costPerPurchaseUnit || 0)}</span>
                          )}
                        </td>

                        <td className="p-3.5">
                          {isSelected ? (
                            <input
                              type="text"
                              value={selectedData?.supplier || ''}
                              onChange={(e) => updateItemField(item.id, 'supplier', e.target.value)}
                              placeholder="Supplier Name"
                              className="w-full px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-white font-bold text-xs focus:outline-none"
                            />
                          ) : (
                            <span className="text-slate-300">-</span>
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

        {/* Footer Summary & Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
            <span>
              {currentLang === 'lo' ? 'ເລືອກແລ້ວ:' : 'Selected:'} <strong className="text-emerald-700 text-sm">{selectedCount}</strong> {currentLang === 'lo' ? 'ລາຍການ' : 'items'}
            </span>
            <span className="text-slate-300">|</span>
            <span>
              {currentLang === 'lo' ? 'ຍອດລວມທັງໝົດ:' : 'Grand Total:'} <strong className="text-slate-900 text-sm font-black">{formatCurrency(grandTotalLAK)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              {t('common.cancel')}
            </button>

            <button
              type="submit"
              disabled={selectedCount === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{currentLang === 'lo' ? `ຢືນຢັນເຕີມສະຕັອກ (${selectedCount} ລາຍການ)` : `Confirm Restock (${selectedCount} Items)`}</span>
            </button>
          </div>
        </div>
      </form>
    </FormModalTemplate>
  );
}
