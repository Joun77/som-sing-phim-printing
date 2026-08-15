import React, { useState } from 'react';
import { X, Layers, Link as LinkIcon } from 'lucide-react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';

interface QuickLinkInkModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentItem: any;
}

export default function QuickLinkInkModal({ isOpen, onClose, equipmentItem }: QuickLinkInkModalProps) {
  const { inventory, addPrinterColorLink, printerColorLinks, showToast } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  // Filter inventory items to Ink category or Ink items
  const inkInventory = inventory.filter(item => 
    item.category?.toLowerCase().includes('ink') || 
    item.name?.toLowerCase().includes('ink') ||
    item.skuCode?.toLowerCase().includes('ink') ||
    item.category === 'Consumable' ||
    item.category === 'Raw Material'
  );

  const [selectedInkId, setSelectedInkId] = useState(inkInventory[0]?.id || '');
  const [slotPosition, setSlotPosition] = useState('Cyan (C)');
  const [notes, setNotes] = useState('');
  const [oemVolumeMl, setOemVolumeMl] = useState(140);
  const [isoYieldA4, setIsoYieldA4] = useState(6000);

  if (!isOpen || !equipmentItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInkId) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກໝຶກພິມ' : 'Please select an ink SKU from inventory', 'error');
      return;
    }

    // Check if slot position already exists
    const existing = printerColorLinks.find(
      lnk => lnk.assetId === equipmentItem.id && lnk.slotPosition === slotPosition
    );

    if (existing) {
      showToast(
        currentLang === 'lo'
          ? `ຕຳແໜ່ງ Slot ${slotPosition} ໄດ້ຖືກຜູກໝຶກໄວ້ແລ້ວ`
          : `Slot position ${slotPosition} is already linked. Overwriting configuration.`,
        'info'
      );
    }

    const selectedInkObj = inkInventory.find(item => item.id === selectedInkId);
    const autoVol = Number(selectedInkObj?.volume || selectedInkObj?.purchaseMultiplier || 100);
    const autoYield = Math.round(autoVol / 0.01667);

    addPrinterColorLink({
      assetId: equipmentItem.id,
      inkCode: selectedInkId,
      slotPosition,
      notes,
      oemStandardVolumeMl: autoVol,
      oemStandardIsoYieldA4: autoYield
    });

    showToast(
      currentLang === 'lo'
        ? `ຜູກໝຶກພິມເຂົ້າກັບ Slot ${slotPosition} ສຳເລັດ!`
        : `Linked Ink SKU to Slot ${slotPosition} successfully!`,
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="font-extrabold text-base text-slate-800">
                {currentLang === 'lo' ? 'ຜູກໝຶກພິມເຂົ້າ Slot ສີ (Quick Link Ink SKU)' : 'Quick Link Ink SKU'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400">{equipmentItem.name} ({equipmentItem.id})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Color Slot Position *</label>
            <select
              value={slotPosition}
              onChange={(e) => setSlotPosition(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-purple-500"
            >
              <option value="Cyan (C)">Cyan (C)</option>
              <option value="Magenta (M)">Magenta (M)</option>
              <option value="Yellow (Y)">Yellow (Y)</option>
              <option value="Black (K)">Black (K)</option>
              <option value="Light Cyan (LC)">Light Cyan (LC)</option>
              <option value="Light Magenta (LM)">Light Magenta (LM)</option>
              <option value="White (W)">White (W)</option>
              <option value="Varnish / Gloss (V)">Varnish / Gloss (V)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Select Ink SKU from Inventory *</label>
            <select
              value={selectedInkId}
              onChange={(e) => setSelectedInkId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-purple-500"
            >
              {inkInventory.length === 0 ? (
                <option value="">No Inks found in Inventory</option>
              ) : (
                inkInventory.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.skuCode || item.id}) - Cost: {(item.unitPrice || item.costPerPurchaseUnit || 0).toLocaleString()} LAK
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Selected Ink Auto Summary Preview Card */}
          {(() => {
            const selectedInk = inkInventory.find(item => item.id === selectedInkId);
            if (!selectedInk) return null;
            
            const resolvedVol = Number(
              selectedInk.volume || 
              selectedInk.specs?.volume || 
              selectedInk.specs?.volume_ml || 
              selectedInk.specs?.oemStandardVolumeMl || 
              selectedInk.specs?.oemVolumeMl || 
              selectedInk.oemStandardVolumeMl || 
              (selectedInk.purchaseMultiplier > 1 ? selectedInk.purchaseMultiplier : null)
            );
            const inkVol = resolvedVol && resolvedVol > 1 ? resolvedVol : 140; // Default to 140ml standard bottle if unassigned
            const inkPrice = Number(selectedInk.unitPrice || selectedInk.costPerPurchaseUnit || 0);

            // Compute estimated yield using default ISO rate (0.01667 ml/sheet @ 5%)
            const estYieldPages = Math.round(inkVol / 0.01667);

            return (
              <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-3.5 space-y-1.5 text-purple-950">
                <span className="text-[10px] font-black uppercase text-purple-700 block tracking-wider">
                  ⚡ {currentLang === 'lo' ? 'ຂໍ້ມູນໝຶກທີ່ຄຳນວນຈາກສາງ (Calculated Specs)' : 'Auto-Calculated Ink Specs from Inventory'}
                </span>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  <div>
                    <span className="text-[9px] text-purple-600 block font-bold uppercase">
                      {currentLang === 'lo' ? 'ບໍລິມາດ (Volume)' : 'Volume'}
                    </span>
                    <span className="font-extrabold">{inkVol} ml</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-purple-600 block font-bold uppercase">
                      {currentLang === 'lo' ? 'ລາຄາຕໍ່ຂວດ (Price)' : 'Unit Price'}
                    </span>
                    <span className="font-extrabold text-emerald-700">{(inkPrice).toLocaleString()} LAK</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-purple-600 block font-bold uppercase">
                      {currentLang === 'lo' ? 'ຄາດວ່າພິມໄດ້ (Yield)' : 'Est. Yield (5%)'}
                    </span>
                    <span className="font-extrabold text-sky-700">{estYieldPages.toLocaleString()} {currentLang === 'lo' ? 'ແຜ່ນ' : 'pages'}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Notes / Slot Configuration</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Original OEM Pigment Ink"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-purple-600/20 active:scale-95 cursor-pointer"
            >
              <LinkIcon className="w-4 h-4" />
              <span>Link Ink SKU</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
