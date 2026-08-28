import React, { useState } from 'react';
import { X, Layers, Wrench, Check, AlertTriangle, Droplet, PackageCheck } from 'lucide-react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';

interface QuickSwapConsumableModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'ink' | 'component';
  equipmentItem: any;
  slotPosition?: string;
  inkSku?: string;
  inkName?: string;
  componentName?: string;
  currentUsage?: number;
}

export const QuickSwapConsumableModal: React.FC<QuickSwapConsumableModalProps> = ({
  isOpen,
  onClose,
  mode,
  equipmentItem,
  slotPosition = '',
  inkSku = '',
  inkName = '',
  componentName = '',
  currentUsage = 0,
}) => {
  const { inventory, swapEquipmentInk, replaceEquipmentComponent, showToast, formatCurrency } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const formatLAK = formatCurrency;

  const [quantity, setQuantity] = useState(1);
  const [remarks, setRemarks] = useState('');
  const [shouldDeductPart, setShouldDeductPart] = useState(true);
  const [selectedPartSku, setSelectedPartSku] = useState('');

  if (!isOpen || !equipmentItem) return null;

  // In ink mode: find the ink item in inventory
  const linkedInkItem = mode === 'ink'
    ? inventory.find(i => i.id === inkSku || i.skuCode === inkSku || i.sku === inkSku)
    : null;
  const currentInkStock = linkedInkItem ? Number(linkedInkItem.stockQty || 0) : 0;
  const isInkOutOfStock = mode === 'ink' && currentInkStock <= 0;

  // In component mode: candidate spare parts from inventory
  const sparePartsList = inventory.filter(i => 
    i.category?.toLowerCase().includes('spare') ||
    i.category?.toLowerCase().includes('part') ||
    i.category?.toLowerCase().includes('consumable') ||
    i.name?.toLowerCase().includes(componentName.toLowerCase())
  );

  const activeSelectedPart = selectedPartSku 
    ? inventory.find(i => i.id === selectedPartSku || i.skuCode === selectedPartSku)
    : sparePartsList[0] || inventory[0];
  const currentPartStock = activeSelectedPart ? Number(activeSelectedPart.stockQty || 0) : 0;
  const isPartOutOfStock = mode === 'component' && shouldDeductPart && activeSelectedPart && currentPartStock <= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'ink') {
      if (isInkOutOfStock) {
        showToast(
          currentLang === 'lo' 
            ? 'ໝຶກໃນສາງໝົດແລ້ວ! ກະລຸນານຳເຂົ້າໝຶກກ່ອນປ່ຽນ' 
            : 'Ink is out of stock in inventory! Please inbound first.', 
          'warning'
        );
        return;
      }
      const success = swapEquipmentInk(equipmentItem.id, slotPosition, inkSku, quantity, remarks);
      if (success) onClose();
    } else {
      if (shouldDeductPart && isPartOutOfStock) {
        showToast(
          currentLang === 'lo' 
            ? 'ອະໄຫຼ່ໃນສາງໝົດແລ້ວ! ກະລຸນານຳເຂົ້າອະໄຫຼ່ກ່ອນ' 
            : 'Spare part is out of stock! Please inbound first.', 
          'warning'
        );
        return;
      }
      const partSkuToDeduct = shouldDeductPart ? (activeSelectedPart?.id || activeSelectedPart?.skuCode) : undefined;
      const success = replaceEquipmentComponent(equipmentItem.id, componentName, partSkuToDeduct, quantity, remarks);
      if (success) onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-scale-up text-slate-800">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              {mode === 'ink' ? (
                <Droplet className="w-5 h-5 text-purple-400" />
              ) : (
                <Wrench className="w-5 h-5 text-indigo-400" />
              )}
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                {mode === 'ink' ? 'ປ່ຽນໝຶກຕຸກໃໝ່ (Replace Ink)' : `ປ່ຽນອະໄຫຼ່ ${componentName}`}
              </h3>
              <p className="text-xs text-slate-300 font-mono">
                {equipmentItem.name} ({equipmentItem.id})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'ink' ? (
            /* Ink Details Card */
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500 uppercase">ຕຳແໜ່ງ Slot ສີ:</span>
                <span className="text-xs font-black text-purple-700 bg-purple-100/70 px-2.5 py-1 rounded-xl">
                  {slotPosition}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500 uppercase">ລະຫັດ / ຊື່ໝຶກ:</span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {inkName || inkSku} ({inkSku})
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <span className="text-xs font-black text-slate-700 uppercase">ສະຕັອກຄົງເຫຼືອໃນສາງ:</span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg font-mono ${
                  currentInkStock > 0 
                    ? 'text-emerald-700 bg-emerald-100' 
                    : 'text-red-700 bg-red-100 animate-pulse'
                }`}>
                  {currentInkStock > 0 ? `${currentInkStock} ຕຸກ (In Stock)` : '0 ຕຸກ (ໝົດສາງ)'}
                </span>
              </div>

              {isInkOutOfStock && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-bold text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>ໝຶກໃນສາງໝົດແລ້ວ! ບໍ່ສາມາດຕັດສະຕັອກໄດ້ ກະລຸນານຳເຂົ້າສິນຄ້າກ່ອນ</span>
                </div>
              )}
            </div>
          ) : (
            /* Component Wear Card */
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500 uppercase">ຊື່ຊິ້ນສ່ວນ:</span>
                <span className="text-xs font-black text-slate-900">{componentName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500 uppercase">ອາຍຸການໃຊ້ງານປັດຈຸບັນ:</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                  currentUsage >= 90 ? 'text-red-700 bg-red-100' : 'text-slate-700 bg-slate-200'
                }`}>
                  {currentUsage}% (ຈະຣີເຊັດເປັນ 0%)
                </span>
              </div>

              {/* Checkbox: Deduct Spare Part */}
              <div className="pt-2 border-t border-slate-200/60 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={shouldDeductPart}
                    onChange={(e) => setShouldDeductPart(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-xs font-black text-slate-800">ຕັດສະຕັອກອະໄຫຼ່ສຳຮອງໃນສາງ</span>
                </label>

                {shouldDeductPart && (
                  <div className="space-y-2 pt-1">
                    <select
                      value={selectedPartSku || activeSelectedPart?.id || ''}
                      onChange={(e) => setSelectedPartSku(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-500 focus:outline-none"
                    >
                      {(sparePartsList.length > 0 ? sparePartsList : inventory).map((it: any) => (
                        <option key={it.id} value={it.id}>
                          {it.name} ({it.skuCode || it.sku || it.id}) - ເຫຼືອ: {it.stockQty || 0}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold">ສະຕັອກອະໄຫຼ່ທີ່ເລືອກ:</span>
                      <span className={`font-black font-mono px-2 py-0.5 rounded ${
                        currentPartStock > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                      }`}>
                        {currentPartStock > 0 ? `${currentPartStock} ອັນ` : '0 ອັນ (ໝົດສາງ)'}
                      </span>
                    </div>

                    {isPartOutOfStock && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-bold text-red-700">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>ອະໄຫຼ່ທີ່ເລືອກໝົດສາງ! ກະລຸນານຳເຂົ້າສິນຄ້າກ່ອນ</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-1">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              ຈຳນວນທີ່ປ່ຽນ (Quantity) *
            </label>
            <input
              type="number"
              min="1"
              max={mode === 'ink' ? Math.max(1, currentInkStock) : 99}
              required
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-black text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              ໝາຍເຫດການບຳລຸງຮັກສາ (Notes / Remarks)
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. ປ່ຽນໝຶກຕາມຮອບການຜະລິດ ຫຼື ປ່ຽນລູກຢາງດຶງເຈ້ຍ"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={mode === 'ink' ? isInkOutOfStock : (shouldDeductPart && isPartOutOfStock)}
              className={`px-6 py-2.5 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer ${
                (mode === 'ink' ? isInkOutOfStock : (shouldDeductPart && isPartOutOfStock))
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : mode === 'ink'
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20 active:scale-95'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 active:scale-95'
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span>
                {mode === 'ink' ? 'ຢືນຢັນປ່ຽນໝຶກ & ຕັດສະຕັອກ' : 'ຢືນຢັນປ່ຽນອະໄຫຼ່ & ຣີເຊັດ'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickSwapConsumableModal;
