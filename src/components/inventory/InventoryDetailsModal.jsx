import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Trash2, Edit3, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';

export default function InventoryDetailsModal({ lot, onClose, onEdit }) {
  const { t } = useTranslation();
  const { deleteInventoryBatch, editInventoryBatch, equipment, showToast } = useApp();

  const [isEditingInline, setIsEditingInline] = useState(false);

  // Inline edit state variables
  const [editQty, setEditQty] = useState(lot?.currentQty || 0);
  const [editCost, setEditCost] = useState(lot?.costPerSheet || lot?.purchasePricePerReam || 0);
  const [editSupplier, setEditSupplier] = useState(lot?.supplierName || '');
  const [editThreshold, setEditThreshold] = useState(lot?.parentItem?.reorderThreshold || 50);

  if (!lot) return null;

  const parent = lot.parentItem || {};
  const isInkCategory = parent.category === 'Ink';
  const linkedMachine = equipment?.find(eq => eq.linkedMaterialSku === parent.id);

  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num || 0).replace('LAK', '₭');
  };

  const renderDualUnitQuantity = (currentQty, category, purchaseUnit, consumptionUnit, itemsPerPurchaseUnit = 500) => {
    if (category === 'Paper') {
      const reams = Math.floor(currentQty / itemsPerPurchaseUnit);
      const remainingSheets = currentQty % itemsPerPurchaseUnit;
      return (
        <div>
          <span className="text-sm font-black text-slate-900 font-mono block">
            {reams > 0 ? `${reams} ${purchaseUnit || 'Ream'}` : `${currentQty} ${consumptionUnit || 'Sheets'}`}
          </span>
          <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">
            ({currentQty} {consumptionUnit || 'Sheets'})
          </span>
        </div>
      );
    }

    if (category === 'Ink') {
      const bottles = Math.floor(currentQty / 1000) || 1;
      return (
        <div>
          <span className="text-sm font-black text-slate-900 font-mono block">
            {bottles} {purchaseUnit || 'Bottle'}
          </span>
          <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">
            ({currentQty} {consumptionUnit || 'ml'})
          </span>
        </div>
      );
    }

    return (
      <div>
        <span className="text-sm font-black text-slate-900 font-mono block">
          {currentQty} {consumptionUnit || 'Units'}
        </span>
      </div>
    );
  };

  const handleSaveInline = (e) => {
    e.preventDefault();
    if (parent.id && lot.id) {
      editInventoryBatch(parent.id, lot.id, {
        currentQty: Number(editQty),
        purchasePricePerReam: Number(editCost),
        supplierName: editSupplier
      });
      showToast(t('common.save') + ' ' + t('common.details'), 'success');
      setIsEditingInline(false);
    }
  };

  const handleDelete = () => {
    if (parent.id && lot.id) {
      deleteInventoryBatch(parent.id, lot.id);
      showToast(t('common.delete') + ' #' + lot.id, 'info');
      onClose();
    }
  };

  const modalContent = (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-100 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <span className="text-[10px] font-mono font-black text-sky-600 uppercase block tracking-wider">
              #{lot.id}
            </span>
            <h2 className="text-base font-black text-slate-900 mt-0.5">
              {isEditingInline ? `${t('common.edit')} ${parent.name}` : t('common.details')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isEditingInline ? (
          <form onSubmit={handleSaveInline} className="p-6 space-y-4 text-xs font-bold text-slate-800">
            <div className="space-y-1.5">
              <label className="text-slate-700 block">{t('inventory_status.remaining_qty')}</label>
              <input
                type="number"
                required
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 block">{t('inventory_status.unit_cost')} (LAK)</label>
              <input
                type="number"
                required
                value={editCost}
                onChange={(e) => setEditCost(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 block">{t('inventory.supplier_name')}</label>
              <input
                type="text"
                value={editSupplier}
                onChange={(e) => setEditSupplier(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditingInline(false)}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-xl text-xs shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{t('common.save')}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-5 text-xs font-bold text-slate-800">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold">SKU ID: {parent.id || '-'}</span>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">{parent.name || 'Material'}</h3>
                  {parent.paperSpec && (
                    <span className="text-[11px] text-sky-700 font-bold block mt-1">{parent.paperSpec}</span>
                  )}
                </div>
                <span className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full font-black text-[10px] uppercase">
                  {parent.category || 'General'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">{t('inventory_status.remaining_qty')}</span>
                {renderDualUnitQuantity(
                  lot.currentQty || 0,
                  parent.category,
                  parent.purchaseUnit,
                  parent.consumptionUnit,
                  parent.itemsPerPurchaseUnit
                )}
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">{t('inventory_status.unit_cost')}</span>
                <span className="text-sm font-black text-slate-900 font-mono block">
                  {formatLAK(lot.costPerSheet || parent.costPerConsumptionUnit)}
                </span>
                <span className="text-[10px] text-slate-400 block font-normal">/{parent.consumptionUnit || 'Unit'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">{t('inventory_status.received_initial')}</span>
                <span className="text-xs font-black text-slate-800 font-mono block">
                  {lot.purchaseDate || '-'}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">{t('inventory.supplier_name')}</span>
                <span className="text-xs font-black text-slate-800 block truncate">
                  {lot.supplierName || parent.supplierName || 'Supplier'}
                </span>
              </div>
            </div>

            {/* Sub-type specific spec block */}
            {parent.category === 'Paper' && (parent.paperSpec || parent.purchaseUnit || parent.purchaseMultiplier) && (
              <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100 space-y-2">
                <span className="text-[10px] text-sky-700 font-black uppercase block">ສະເປັກກະດາດ (Paper Spec)</span>
                <div className="grid grid-cols-2 gap-2">
                  {parent.paperSpec && (
                    <div>
                      <span className="text-[10px] text-slate-500 block">ປະເພດ</span>
                      <span className="font-black text-slate-900">{parent.paperSpec}</span>
                    </div>
                  )}
                  {parent.purchaseUnit && (
                    <div>
                      <span className="text-[10px] text-slate-500 block">ໜ່ວຍຊື້</span>
                      <span className="font-black text-slate-900">{parent.purchaseUnit}</span>
                    </div>
                  )}
                  {parent.purchaseMultiplier && (
                    <div>
                      <span className="text-[10px] text-slate-500 block">ຈຳນວນ/ຊຸດ</span>
                      <span className="font-black text-slate-900">{parent.purchaseMultiplier} ແຜ່ນ</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {parent.category === 'Ink' && (
              <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-2">
                <span className="text-[10px] text-indigo-700 font-black uppercase block">ຂໍ້ມູນໝຶກພິມ (Ink Info)</span>
                <div className="grid grid-cols-2 gap-2">
                  {parent.inkSet && (
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-500 block">ຊຸດໝຶກ (Ink Set)</span>
                      <span className="font-black text-slate-900">{parent.inkSet}</span>
                    </div>
                  )}
                  {parent.consumptionUnit && (
                    <div>
                      <span className="text-[10px] text-slate-500 block">ໜ່ວຍ</span>
                      <span className="font-black text-slate-900">{parent.consumptionUnit}</span>
                    </div>
                  )}
                  {parent.purchaseUnit && (
                    <div>
                      <span className="text-[10px] text-slate-500 block">ໜ່ວຍຊື້</span>
                      <span className="font-black text-slate-900">{parent.purchaseUnit}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Compatible Machinery Info - Render ONLY for Ink Category */}
            {isInkCategory && (
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-1">
                <span className="text-[10px] text-indigo-700 font-black uppercase block">{t('equipment_mapping.linked_material')}</span>
                <p className="text-xs font-bold text-indigo-950">
                  {linkedMachine ? `${linkedMachine.name} (${linkedMachine.id})` : t('equipment_mapping.no_linked_material')}
                </p>
              </div>
            )}

            {/* Item Photo from parent SKU */}
            {parent.itemPhoto && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 font-black uppercase block">ຮູບພາບສິນຄ້າ (Item Photo)</span>
                <div className="h-44 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center">
                  <img src={parent.itemPhoto} alt="Item" className="w-full h-full object-contain rounded-lg" />
                </div>
              </div>
            )}

            {/* Supplier contact */}
            {parent.supplierContact && (
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">ຊ່ອງທາງຕິດຕໍ່ (Supplier Contact)</span>
                <span className="text-xs font-bold text-sky-700 block">{parent.supplierContact}</span>
              </div>
            )}

            {/* Modal Footer / Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-xs transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('common.delete')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onEdit) {
                    onEdit(lot);
                  } else {
                    setIsEditingInline(true);
                  }
                }}
                className="flex items-center gap-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-xl text-xs shadow-sm transition active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{t('common.edit')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

