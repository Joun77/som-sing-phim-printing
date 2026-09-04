import React, { useState } from 'react';
import { Eye, Edit3, Plus, Minus, ExternalLink, Image as ImageIcon, Trash2, Scissors } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@store/AppContext';
import InventoryDetailsModal from './modals/InventoryDetailsModal';
import AssetEditModal from './modals/AssetEditModal';

const normalizeLaoUnit = (unit?: string, fallback = 'ແຜ່ນ') => {
  if (!unit) return fallback;
  const u = unit.trim().toLowerCase();
  if (u === 'แผ่น' || u === 'sheet' || u === 'sheets' || u === 'ແຜ່ນ') return 'ແຜ່ນ';
  if (u === 'แพ็ก' || u === 'pack' || u === 'packs' || u === 'ແພັກ') return 'ແພັກ';
  if (u === 'รีม' || u === 'ream' || u === 'reams' || u === 'ຣີມ') return 'ຣີມ';
  if (u === 'ขวด' || u === 'bottle' || u === 'bottles' || u === 'ຂວດ') return 'ຂວດ';
  if (u === 'ม้วน' || u === 'roll' || u === 'rolls' || u === 'ມ້ວນ') return 'ມ້ວນ';
  if (u === 'เครื่อง' || u === 'machine' || u === 'unit' || u === 'units' || u === 'ເຄື່ອງ') return 'ເຄື່ອງ';
  if (u === 'กล่อง' || u === 'box' || u === 'boxes' || u === 'ກ່ອງ') return 'ກ່ອງ';
  if (u === 'ชุด' || u === 'set' || u === 'sets' || u === 'ຊຸດ') return 'ຊຸດ';
  if (u === 'ชิ้น' || u === 'piece' || u === 'pieces' || u === 'ຊິ້ນ') return 'ຊິ້ນ';
  if (u === 'มล' || u === 'ml' || u === 'มิลลิลิตร' || u === 'ມລ') return 'ml';
  if (u === 'เมตร' || u === 'm' || u === 'meter' || u === 'meters' || u === 'ແມັດ') return 'ແມັດ';
  return unit;
};

const formatLaoCategory = (cat?: string) => {
  if (!cat) return 'ທົ່ວໄປ';
  const c = cat.trim().toLowerCase();
  if (c === 'paper' || c === 'material') return 'ເຈ້ຍ & ວັດສະດຸ';
  if (c === 'offcut') return 'ເສດເຈ້ຍ';
  if (c === 'ink' || c === 'toner') return 'ນ້ຳໝຶກ';
  if (c === 'hardware' || c === 'spare_parts') return 'ອຸປະກອນ & ອາໄຫຼ່';
  if (c === 'finishing' || c === 'lamination' || c === 'binding' || c === 'film' || c === 'glue') return 'ງານຫຼັງພິມ';
  if (c === 'packaging' || c.startsWith('pkg')) return 'ກ່ອງ & ບັນຈຸພັນ';
  return cat.toUpperCase();
};

export default function InventoryTable({ items, activeTab, onRestockItem, onViewDetails, onDischargeItem }: { items: any[]; activeTab: string; onRestockItem?: (item: any) => void; onViewDetails?: (lot: any) => void; onDischargeItem?: (item: any) => void }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const { editInventoryBatch, editInventorySku, deleteInventoryBatch, deleteInventoryFromBackend, showToast, formatCurrency, quickAdjustStock } = useApp();
  
  const [selectedLotModal, setSelectedLotModal] = useState(null);
  const [editingLotModal, setEditingLotModal] = useState(null);
  const [hoverImage, setHoverImage] = useState(null);

  const formatLAK = formatCurrency;
  const isInkView = activeTab === 'Ink';

  // Flatten lots cleanly without duplicate rows
  const flatLots: any[] = [];
  const seenLotKeys = new Set();

  items.forEach(item => {
    const isPaper = (item.category || '').toLowerCase() === 'paper' || (item.category || '').toLowerCase() === 'material';
    const multiplier = Number(item.purchaseMultiplier || item.specs?.sheetsPerPack || 500);

    let stockSheets = Number(item.stockQty) || Number(item.currentStock) || 0;
    if (isPaper && stockSheets > 0 && stockSheets <= 10) {
      stockSheets = stockSheets * multiplier;
    } else if (isPaper && stockSheets === 0) {
      stockSheets = multiplier;
    }

    const batches = (item.batches && item.batches.length > 0) ? item.batches : [{
      id: `LOT-${item.id.replace('PAP-', '').slice(-4).toUpperCase()}`,
      purchaseDate: item.receiptDate || item.importDate || '-',
      supplierName: item.supplier || item.supplierName || '-',
      purchasePricePerReam: item.costPerPurchaseUnit || 0,
      costPerSheet: item.costPerConsumptionUnit || 0,
      initialQty: stockSheets,
      currentQty: stockSheets
    }];

    batches.forEach(batch => {
      const lotKey = `${item.id}-${batch.id || batch.poNumber || 'DEFAULT'}`;
      if (!seenLotKeys.has(lotKey)) {
        seenLotKeys.add(lotKey);

        let bQty = Number(batch.currentQty || batch.initialQty || 0);
        if (isPaper && bQty > 0 && bQty <= 10) {
          bQty = bQty * multiplier;
        }

        flatLots.push({
          parentItem: item,
          ...batch,
          initialQty: batch.initialQty <= 10 && isPaper ? batch.initialQty * multiplier : batch.initialQty,
          currentQty: bQty
        });
      }
    });
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
                <th className="py-4 px-4">ລະຫັດໝຶກ</th>
                <th className="py-4 px-4">ຕົວຢ່າງ</th>
                <th className="py-4 px-4">ຊື່ສີ & ລຸ້ນ</th>
                <th className="py-4 px-4">ກຸ່ມສີ</th>
                <th className="py-4 px-4">ຄວາມຈຸ/ຂວດ</th>
                <th className="py-4 px-4 text-right">ຍອດເຫຼືອ (ml / ຂວດ)</th>
                <th className="py-4 px-4 text-right">ລາຄາຕໍ່ຂວດ</th>
                <th className="py-4 px-4 text-right">ມູນຄ່າລວມ</th>
                <th className="py-4 px-4">ປະເພດໝຶກ</th>
                <th className="py-4 px-4">ແທ້/ທຽບ</th>
                <th className="py-4 px-4">ຜູ້ສະໜອງ</th>
                <th className="py-4 px-4 text-center">ບິນຮັບ</th>
                <th className="py-4 px-4 text-right">ການຈັດການ</th>
              </tr>
            ) : (
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-500 tracking-wider">
                <th className="py-4 px-6">ລະຫັດລັອດ</th>
                <th className="py-4 px-6">ຊື່ລາຍການ & SKU</th>
                <th className="py-4 px-6">ໝວດໝູ່</th>
                <th className="py-4 px-6">ວັນທີນຳເຂົ້າ</th>
                <th className="py-4 px-6">ຈຳນວນເຫຼືອ</th>
                <th className="py-4 px-6">ສະຖານະສະຕ໋ອກ</th>
                <th className="py-4 px-6 text-right">ການຈັດການ</th>
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
                  const volumePerBottle = Number(parent.volume || parent.specs?.volume || parent.specs?.volume_ml || 70);
                  const bottlePrice = Number(parent.unitPrice || parent.costPerPurchaseUnit || 0);
                  const totalAssetValue = volumePerBottle > 0 && bottlePrice > 0
                    ? Math.round((lot.currentQty / volumePerBottle) * bottlePrice)
                    : (lot.currentQty * Number(parent.costPerConsumptionUnit || parent.unitPrice || 0));
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
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{(() => {
                          const brand = parent.brand || parent.specs?.brand || '';
                          const color = parent.colorName || parent.name;
                          return brand && !color.toLowerCase().includes(brand.toLowerCase()) ? `${brand} - ${color}` : color;
                        })()}</span>
                        {parent.inkCode && parent.inkCode !== parent.id && (
                          <span className="text-[10px] text-slate-400 font-mono block">{parent.inkCode}</span>
                        )}
                      </td>
                      
                      {/* Group */}
                      <td className="py-3.5 px-4">{parent.colorGroup || '-'}</td>
                      
                      {/* Volume */}
                      <td className="py-3.5 px-4 font-mono">{parent.volume || parent.purchaseMultiplier || '-'} ml</td>
                      
                      {/* Remaining Qty */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-black text-slate-800">{lot.currentQty.toLocaleString()} ml</div>
                        {volumePerBottle > 0 && (
                          <div className="text-[10px] text-slate-400 font-sans font-medium">
                            ≈ {Math.round((lot.currentQty / volumePerBottle) * 10) / 10} {normalizeLaoUnit(parent.purchaseUnit, 'ຂວດ')}
                          </div>
                        )}
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewDetails ? onViewDetails(lot) : setSelectedLotModal(lot)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition border border-slate-200 cursor-pointer"
                            title="ລາຍລະອຽດ"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                            <span className="hidden sm:inline">ລາຍລະອຽດ</span>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(currentLang === 'lo' ? `ທ່ານຕັ້ງໃຈລຶບ #${lot.id} (${parent.name}) ບໍ?` : `Are you sure you want to delete #${lot.id} (${parent.name})?`)) {
                                deleteInventoryBatch(parent.id, lot.id);
                                showToast(currentLang === 'lo' ? `ລຶບຂໍ້ມູນ #${lot.id} ສຳເລັດ!` : `Deleted #${lot.id} successfully!`, 'info');
                              }
                            }}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg text-xs font-bold transition border border-slate-200 hover:border-rose-200 cursor-pointer"
                            title="ລຶບ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
                        <span className="font-extrabold text-slate-800 block leading-tight">{(() => {
                          const gsm = parent.specs?.grammageGsm || parent.specs?.grammage;
                          const format = parent.specs?.paperFormat || parent.specs?.standardSize;
                          if (gsm && format && !parent.name.toLowerCase().includes(`${gsm}`)) {
                            return `${parent.name} - ${gsm}gsm (${format})`;
                          }
                          return parent.name;
                        })()}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 block mt-1 uppercase">{parent.id}</span>
                      </div>
                    </td>
                    <td className="py-4.5 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        (parent.category || '').toLowerCase() === 'offcut' || parent.isOffcut
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : (parent.category || '').toLowerCase() === 'ink' || (parent.category || '').toLowerCase() === 'toner'
                          ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'
                          : (parent.category || '').toLowerCase() === 'paper' || (parent.category || '').toLowerCase() === 'material'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : (parent.category || '').toLowerCase() === 'finishing'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {((parent.category || '').toLowerCase() === 'offcut' || parent.isOffcut) && <Scissors className="w-3 h-3 text-indigo-600" />}
                        {formatLaoCategory(parent.category)}
                      </span>
                    </td>
                    <td className="py-4.5 px-6">
                      <div>
                        <span className="font-bold text-slate-700 block font-mono text-xs">{lot.purchaseDate}</span>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          Init: {Number(lot.initialQty).toLocaleString()} {normalizeLaoUnit(parent.consumptionUnit, 'ແຜ່ນ')}
                          {parent.purchaseUnit && parent.purchaseMultiplier && Number(parent.purchaseMultiplier) > 1 && (
                            <span className="text-slate-400 font-normal"> (~{Math.round(lot.initialQty / parent.purchaseMultiplier)} {normalizeLaoUnit(parent.purchaseUnit, 'ແພັກ')})</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="py-4.5 px-6">
                      <div className="font-black text-slate-900 font-mono text-sm">
                        {Number(lot.currentQty).toLocaleString()} {normalizeLaoUnit(parent.consumptionUnit, 'ແຜ່ນ')}
                      </div>
                      {parent.purchaseUnit && parent.purchaseMultiplier && Number(parent.purchaseMultiplier) > 1 && (
                        <div className="text-[10px] text-slate-400 font-sans font-medium">
                          ≈ {Math.round((lot.currentQty / parent.purchaseMultiplier) * 10) / 10} {normalizeLaoUnit(parent.purchaseUnit, 'ແພັກ')}
                        </div>
                      )}
                      {(parent.category?.toLowerCase() === 'ink' || parent.category?.toLowerCase() === 'toner') && parent.volume && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {Number(lot.currentQty) * Number(parent.volume)} ml
                        </div>
                      )}
                    </td>
                    <td className="py-4.5 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${statusDetails.className}`}>
                        <span>{statusDetails.label}</span>
                      </span>
                    </td>
                    <td className="py-4.5 px-6 text-right flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onDischargeItem ? onDischargeItem(parent) : null}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black transition border border-rose-200 cursor-pointer"
                        title="Stock Discharge"
                      >
                        <Minus className="w-3.5 h-3.5" />
                        <span>{currentLang === 'lo' ? 'ເບີກ' : 'Discharge'}</span>
                      </button>
                      <button
                        onClick={() => onViewDetails ? onViewDetails(lot) : setSelectedLotModal(lot)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition active:scale-95 border border-slate-200 cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                        <span>{t('common.details')}</span>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(currentLang === 'lo' ? `ທ່ານຕັ້ງໃຈລຶບ #${lot.id} (${parent.name}) ບໍ?` : `Are you sure you want to delete #${lot.id} (${parent.name})?`)) {
                            deleteInventoryBatch(parent.id, lot.id);
                            showToast(currentLang === 'lo' ? `ລຶບຂໍ້ມູນ #${lot.id} ສຳເລັດ!` : `Deleted #${lot.id} successfully!`, 'info');
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl text-xs font-black transition border border-slate-200 hover:border-rose-200 cursor-pointer"
                        title="Delete Item / Batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
        <AssetEditModal
          item={editingLotModal.parentItem || editingLotModal}
          onSave={(updatedData) => {
            editInventorySku(updatedData.id, updatedData);
            showToast('Asset master data updated successfully!', 'success');
            setEditingLotModal(null);
          }}
          onClose={() => setEditingLotModal(null)}
        />
      )}
    </div>
  );
}



