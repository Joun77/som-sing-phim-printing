import React, { useState } from 'react';

export default function FinishingForm({ onSubmit, onCancel }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Finishing'); // or 'Film'
  const [purchaseUnit, setPurchaseUnit] = useState('Pack (100 sheets)');
  const [multiplier, setMultiplier] = useState(100);
  const [purchasePrice, setPurchasePrice] = useState(80000);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [reorderThreshold, setReorderThreshold] = useState(100);
  const [supplierName, setSupplierName] = useState('Sengsavanh Stationery');

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = `fin-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const consumptionUnit = category === 'Film' ? 'sqm' : 'Piece';
    const costPerConsumption = Math.round(Number(purchasePrice) / Number(multiplier));

    onSubmit({
      id,
      name,
      category,
      consumptionUnit,
      purchaseUnit,
      purchaseMultiplier: Number(multiplier),
      costPerPurchaseUnit: Number(purchasePrice),
      costPerConsumptionUnit: costPerConsumption,
      reorderThreshold: Number(reorderThreshold),
      batches: [
        {
          id: `LOT-FIN-${Date.now().toString().slice(-4)}`,
          purchaseDate: new Date().toISOString().split('T')[0],
          supplierName,
          purchasePricePerReam: Number(purchasePrice),
          costPerSheet: costPerConsumption,
          initialQty: Number(purchaseQty) * Number(multiplier),
          currentQty: Number(purchaseQty) * Number(multiplier)
        }
      ]
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 col-span-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Material Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Spiral Binding Wires 10mm or Gloss Lamination Film"
            className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold text-sm bg-white"
          >
            <option value="Finishing">Finishing Consumable (Staples, Wires, Glue)</option>
            <option value="Film">Film (Lamination PVC Film)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Purchase Unit Name</label>
          <input
            type="text"
            required
            value={purchaseUnit}
            onChange={(e) => setPurchaseUnit(e.target.value)}
            placeholder="e.g. Pack (100 pcs) or Roll (50m)"
            className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Multiplier (Consumption units per purchase unit)</label>
          <input
            type="number"
            required
            value={multiplier}
            onChange={(e) => setMultiplier(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold font-sans text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Purchase Unit Price (LAK)</label>
          <input
            type="number"
            required
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold font-sans text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Quantity Purchased</label>
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
          Add SKU
        </button>
      </div>
    </form>
  );
}
