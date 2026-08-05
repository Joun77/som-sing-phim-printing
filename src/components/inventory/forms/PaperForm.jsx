import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function PaperForm({ onSubmit, onCancel }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [gsm, setGsm] = useState(80);
  const [width, setWidth] = useState(210);
  const [height, setHeight] = useState(297);
  const [purchasePrice, setPurchasePrice] = useState(45000);
  const [purchaseQty, setPurchaseQty] = useState(2);
  const [reorderThreshold, setReorderThreshold] = useState(1000);
  const [supplierName, setSupplierName] = useState('Lao Paper Supplier');

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = `paper-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${gsm}`;
    
    // Create new SKU payload
    onSubmit({
      id,
      name: `${name} ${gsm}gsm (${width}x${height}mm)`,
      category: 'Paper',
      consumptionUnit: 'Sheet',
      purchaseUnit: 'Ream (500 sheets)',
      purchaseMultiplier: 500,
      costPerPurchaseUnit: Number(purchasePrice),
      costPerConsumptionUnit: Math.round(Number(purchasePrice) / 500),
      reorderThreshold: Number(reorderThreshold),
      gsm: Number(gsm),
      width: Number(width),
      height: Number(height),
      // First batch
      batches: [
        {
          id: `LOT-PAP-${Date.now().toString().slice(-4)}`,
          purchaseDate: new Date().toISOString().split('T')[0],
          supplierName,
          purchasePricePerReam: Number(purchasePrice),
          costPerSheet: Math.round(Number(purchasePrice) / 500),
          initialQty: Number(purchaseQty) * 500,
          currentQty: Number(purchaseQty) * 500,
        }
      ]
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 col-span-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Paper Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Double A A4"
            className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">GSM (Weight)</label>
          <input
            type="number"
            required
            value={gsm}
            onChange={(e) => setGsm(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold font-sans text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Reorder Threshold</label>
          <input
            type="number"
            required
            value={reorderThreshold}
            onChange={(e) => setReorderThreshold(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold font-sans text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Width (mm)</label>
          <input
            type="number"
            required
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold font-sans text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Height (mm)</label>
          <input
            type="number"
            required
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold font-sans text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Ream Price (LAK)</label>
          <input
            type="number"
            required
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold font-sans text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Inbound Qty (Reams)</label>
          <input
            type="number"
            required
            value={purchaseQty}
            onChange={(e) => setPurchaseQty(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold font-sans text-sm"
          />
        </div>
        <div className="space-y-1 col-span-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Supplier Name</label>
          <input
            type="text"
            required
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-accent-sky text-white rounded-xl text-xs font-bold hover:bg-sky-600"
        >
          Add Paper SKU
        </button>
      </div>
    </form>
  );
}
