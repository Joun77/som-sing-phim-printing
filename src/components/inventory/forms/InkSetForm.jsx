import React, { useState } from 'react';

export default function InkSetForm({ onSubmit, onCancel }) {
  const [setName, setSetName] = useState('');
  const [totalPrice, setTotalPrice] = useState(720000);
  const [bottleVolumeMl, setBottleVolumeMl] = useState(100);
  const [reorderThreshold, setReorderThreshold] = useState(50);
  const [supplierName, setSupplierName] = useState('Konica Lao');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // We will generate 4 individual color SKUs
    const colors = ['Cyan', 'Magenta', 'Yellow', 'Black'];
    const pricePerColor = Math.round(Number(totalPrice) / colors.length);
    const costPerMl = Math.round(pricePerColor / Number(bottleVolumeMl));

    const generatedSkus = colors.map(color => {
      const idStr = `${setName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${color.toLowerCase()}`;
      return {
        id: `ink-${idStr}`,
        name: `ນ້ຳໝຶກ ${setName} ${color}`,
        category: 'Ink',
        inkSet: setName,
        stockQty: Number(bottleVolumeMl),
        consumptionUnit: 'ml',
        purchaseUnit: `Bottle (${bottleVolumeMl}ml)`,
        purchaseMultiplier: Number(bottleVolumeMl),
        costPerPurchaseUnit: pricePerColor,
        costPerConsumptionUnit: costPerMl,
        reorderThreshold: Number(reorderThreshold),
        batches: [
          {
            id: `LOT-${color.substring(0,3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
            purchaseDate: new Date().toISOString().split('T')[0],
            supplierName,
            purchasePricePerReam: pricePerColor,
            costPerSheet: costPerMl,
            initialQty: Number(bottleVolumeMl),
            currentQty: Number(bottleVolumeMl)
          }
        ]
      };
    });

    onSubmit(generatedSkus); // Emits array of 4 SKUs to parent
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 col-span-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Ink Set Name (e.g. Printer Brand/Model Set)</label>
          <input
            type="text"
            required
            value={setName}
            onChange={(e) => setSetName(e.target.value)}
            placeholder="e.g. Konica C6085 OEM Set"
            className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Set Price (LAK)</label>
          <input
            type="number"
            required
            value={totalPrice}
            onChange={(e) => setTotalPrice(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold font-sans text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Volume per Bottle (ml)</label>
          <input
            type="number"
            required
            value={bottleVolumeMl}
            onChange={(e) => setBottleVolumeMl(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold font-sans text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Reorder Threshold (ml)</label>
          <input
            type="number"
            required
            value={reorderThreshold}
            onChange={(e) => setReorderThreshold(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold font-sans text-sm"
          />
        </div>
        <div className="space-y-1">
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
          Generate Ink Set Channels
        </button>
      </div>
    </form>
  );
}
