import React, { useState } from 'react';
import { X, Layers, Droplet, Hammer } from 'lucide-react';
import DynamicSpecForm from '../forms/DynamicSpecForm';
import { useApp } from '@store/AppContext';

export default function AddMaterialModal({ isOpen, onClose }) {
  const { addInventorySku, saveInventoryToBackend, showToast } = useApp();
  const [activeForm, setActiveForm] = useState('paper'); // paper, ink, finishing

  if (!isOpen) return null;

  const handlePaperSubmit = (sku) => {
    addInventorySku(sku);
    saveInventoryToBackend(sku);
    showToast('Paper SKU added to inventory ledger!', 'success');
    onClose();
  };

  const handleInkSubmit = (skus) => {
    skus.forEach(sku => {
      addInventorySku(sku);
      saveInventoryToBackend(sku);
    });
    showToast('Ink Set CMYK channels registered successfully!', 'success');
    onClose();
  };

  const handleFinishingSubmit = (sku) => {
    addInventorySku(sku);
    saveInventoryToBackend(sku);
    showToast('Finishing/Film material added!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-extrabold text-base text-slate-800">Add New Raw Material SKU</h3>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Register new physical warehouse stock</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-3 border-b text-center font-bold text-xs text-slate-600 bg-slate-50/30">
          <button
            onClick={() => setActiveForm('paper')}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeForm === 'paper' ? 'border-accent-sky text-accent-sky bg-white' : 'border-transparent hover:bg-slate-50/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Paper SKU</span>
          </button>
          <button
            onClick={() => setActiveForm('ink')}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeForm === 'ink' ? 'border-accent-sky text-accent-sky bg-white' : 'border-transparent hover:bg-slate-50/50'
            }`}
          >
            <Droplet className="w-4 h-4" />
            <span>Ink Set bundle</span>
          </button>
          <button
            onClick={() => setActiveForm('finishing')}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeForm === 'finishing' ? 'border-accent-sky text-accent-sky bg-white' : 'border-transparent hover:bg-slate-50/50'
            }`}
          >
            <Hammer className="w-4 h-4" />
            <span>Finishing & Films</span>
          </button>
        </div>

        {/* Form area */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeForm === 'paper' && (
            <DynamicSpecForm categoryType="paper" formData={{}} onChange={handlePaperSubmit} onSubmit={handlePaperSubmit} onCancel={onClose} />
          )}
          {activeForm === 'ink' && (
            <DynamicSpecForm categoryType="inkset" formData={{}} onChange={handleInkSubmit} onSubmit={handleInkSubmit} onCancel={onClose} />
          )}
          {activeForm === 'finishing' && (
            <DynamicSpecForm categoryType="finishing" formData={{}} onChange={handleFinishingSubmit} onSubmit={handleFinishingSubmit} onCancel={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
