import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';

export default function EditMaterialModal({ isOpen, materialData, onSave, onClose }) {
  const { t } = useTranslation();
  const { equipment } = useApp();

  const [name, setName] = useState('');
  const [currentQty, setCurrentQty] = useState(0);
  const [unitCost, setUnitCost] = useState(0);
  const [reorderThreshold, setReorderThreshold] = useState(50);
  const [supplierName, setSupplierName] = useState('');
  const [selectedMachineIds, setSelectedMachineIds] = useState([]);

  useEffect(() => {
    if (materialData) {
      const parent = materialData.parentItem || {};
      setName(parent.name || '');
      setCurrentQty(materialData.currentQty || 0);
      setUnitCost(materialData.costPerSheet || materialData.purchasePricePerReam || parent.costPerConsumptionUnit || 0);
      setReorderThreshold(parent.reorderThreshold || 50);
      setSupplierName(materialData.supplierName || '');
      
      const initialIds = parent.linkedMachineIds || (parent.linkedMachineId ? [parent.linkedMachineId] : []);
      setSelectedMachineIds(initialIds);
    }
  }, [materialData, equipment]);

  if (!isOpen || !materialData) return null;

  const parent = materialData.parentItem || {};
  const isInkCategory = parent.category === 'Ink';

  const toggleMachineSelection = (id) => {
    setSelectedMachineIds(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...materialData,
      currentQty: Number(currentQty),
      costPerSheet: Number(unitCost),
      purchasePricePerReam: Number(unitCost),
      supplierName,
      parentItem: {
        ...parent,
        name,
        reorderThreshold: Number(reorderThreshold),
        linkedMachineIds: selectedMachineIds
      }
    });
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
          <h2 className="text-base font-black text-slate-900">
            {t('common.edit')} {parent.name || t('inventory.material_name')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold text-slate-800">
          <div className="space-y-1.5">
            <label className="text-slate-700 block">
              {t('inventory.material_name')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-700 block">
                {t('inventory_status.remaining_qty')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={currentQty}
                onChange={(e) => setCurrentQty(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white font-mono text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 block">
                {t('inventory_status.unit_cost')} (LAK) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white font-mono text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-700 block">
                {t('dashboard.low_stock')} (Threshold)
              </label>
              <input
                type="number"
                min="0"
                value={reorderThreshold}
                onChange={(e) => setReorderThreshold(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white font-mono text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 block">
                {t('inventory.supplier_name')}
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Conditional Multi-Select Machinery Selection - Ink Only */}
          {isInkCategory && (
            <div className="space-y-2">
              <label className="text-slate-700 block">
                {t('equipment_mapping.linked_material')} (Multi-Select)
              </label>
              <div className="max-h-36 overflow-y-auto space-y-1.5 p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                {equipment && equipment.length > 0 ? (
                  equipment.map(eq => (
                    <label key={eq.id} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 hover:text-sky-600">
                      <input
                        type="checkbox"
                        checked={selectedMachineIds.includes(eq.id)}
                        onChange={() => toggleMachineSelection(eq.id)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                      />
                      <span>{eq.name} <span className="font-mono text-[10px] text-slate-400">({eq.id})</span></span>
                    </label>
                  ))
                ) : (
                  <p className="text-slate-400 text-xs">{t('equipment_mapping.no_linked_material')}</p>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs transition active:scale-95"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-xl text-xs shadow-sm transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{t('common.save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
