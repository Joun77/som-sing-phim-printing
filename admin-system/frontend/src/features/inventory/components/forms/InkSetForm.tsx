import React, { useState } from 'react';
import { useApp } from '@store/AppContext';

export default function InkSetForm({ onSubmit, onCancel }) {
  const { equipment } = useApp();
  
  const [setName, setSetName] = useState('');
  const [totalPrice, setTotalPrice] = useState(720000);
  const [bottleVolumeMl, setBottleVolumeMl] = useState(100);
  const [reorderThreshold, setReorderThreshold] = useState(50);
  const [supplierName, setSupplierName] = useState('Konica Lao');
  
  // New fields
  const [inkBaseType, setInkBaseType] = useState('Dye');
  const [isCompatible, setIsCompatible] = useState(false);
  const [targetPrinterId, setTargetPrinterId] = useState('');

  const printersList = equipment.filter(eq => eq.category === 'Printer');
  const inkBaseTypes = ['Dye', 'Pigment', 'Toner', 'UV Curable', 'Eco-Solvent'];

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
        inkBaseType,
        isCompatible,
        targetPrinterId,
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
        
        {/* Ink Base Type selection */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Ink Base Type</label>
          <select
            value={inkBaseType}
            onChange={(e) => setInkBaseType(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold text-sm bg-white"
          >
            {inkBaseTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Target Printer Link selection */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Target Printer Link</label>
          <select
            value={targetPrinterId}
            onChange={(e) => setTargetPrinterId(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold text-sm bg-white"
          >
            <option value="">-- None --</option>
            {printersList.map(eq => (
              <option key={eq.id} value={eq.id}>{eq.name} ({eq.id})</option>
            ))}
          </select>
        </div>

        {/* OEM/Compatible check box */}
        <div className="space-y-1 flex items-center pt-5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isCompatible}
              onChange={(e) => setIsCompatible(e.target.checked)}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="text-xs font-bold text-slate-600">Is Compatible Ink (Non-OEM)</span>
          </label>
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
          className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition cursor-pointer"
        >
          Generate Ink Set Channels
        </button>
      </div>
    </form>
  );
}

