import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Scissors, AlertCircle, CheckCircle, Package } from 'lucide-react';
import { useApp } from '@store/AppContext';

interface StockDischargeModalProps {
  item?: any;
  isOpen: boolean;
  onClose: () => void;
  onDischarged?: () => void;
}

export default function StockDischargeModal({ item, isOpen, onClose, onDischarged }: StockDischargeModalProps) {
  const { inventory, dischargeInventoryStock, showToast } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const [selectedSkuId, setSelectedSkuId] = useState(item?.id || (inventory[0]?.id || ''));
  const [dischargeQty, setDischargeQty] = useState<number>(1);
  const [reason, setReason] = useState('PRINT_PRODUCTION');
  const [remarks, setRemarks] = useState('');

  if (!isOpen) return null;

  const targetItem = inventory.find(i => i.id === selectedSkuId) || item || inventory[0];
  const maxStock = targetItem ? (targetItem.stockQty || 0) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetItem) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກວັດຖຸດິບ' : 'Please select a material SKU', 'error');
      return;
    }

    if (dischargeQty <= 0) {
      showToast(currentLang === 'lo' ? 'ຈຳນວນຕ້ອງຫຼາຍກວ່າ 0' : 'Discharge quantity must be greater than 0', 'error');
      return;
    }

    if (dischargeQty > maxStock) {
      showToast(currentLang === 'lo' ? 'ຈຳນວນເບີກເກີນสต໋ອກທີ່ມີอยู่' : 'Discharge quantity exceeds current stock level', 'error');
      return;
    }

    dischargeInventoryStock(targetItem.id, dischargeQty, reason, remarks);
    showToast(currentLang === 'lo' ? 'ບັນທຶກການເບີກตัดສະຕ໋ອກຮຽບຮ້ອຍແລ້ວ!' : 'Stock discharged successfully!', 'success');

    if (onDischarged) onDischarged();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-rose-600" />
            <span>{currentLang === 'lo' ? 'ເບີກใช้งาน / ຕັດສະຕ໋ອກວັດຖຸດິບ (Stock Discharge)' : 'Stock Discharge Form'}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Material SKU Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {currentLang === 'lo' ? 'ເລືອກວັດຖຸດິບ (Select Material SKU)' : 'Select Material SKU'}
            </label>
            {item ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">{item.name}</span>
                  <span className="font-mono text-xs text-slate-500">SKU: {item.id}</span>
                </div>
                <span className="px-2.5 py-1 bg-sky-100 text-sky-800 text-xs font-black rounded-xl">
                  {currentLang === 'lo' ? `คงเหลือ ${item.stockQty} ${item.consumptionUnit || 'Units'}` : `Stock: ${item.stockQty}`}
                </span>
              </div>
            ) : (
              <select
                value={selectedSkuId}
                onChange={(e) => setSelectedSkuId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl font-bold text-xs text-slate-800 focus:outline-none focus:border-rose-500"
              >
                {inventory.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name} ({inv.id}) - คงเหลือ: {inv.stockQty} {inv.consumptionUnit || ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Current Stock Availability Info */}
          {targetItem && (
            <div className="bg-rose-50/70 border border-rose-100 p-3.5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold text-rose-950">
                  {currentLang === 'lo' ? 'ສະຕ໋ອກທີ່ມີຢູ່ໃນຄັງ (Available Stock):' : 'Available Stock:'}
                </span>
              </div>
              <span className="font-mono font-black text-rose-700 text-sm">
                {maxStock.toLocaleString()} {targetItem.consumptionUnit || 'Units'}
              </span>
            </div>
          )}

          {/* Discharge Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {currentLang === 'lo' ? 'ຈຳນວນທີ່ຕ້ອງການເບີກ (Discharge Quantity)' : 'Discharge Quantity'}
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max={maxStock}
                value={dischargeQty}
                onChange={(e) => setDischargeQty(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl font-mono font-black text-slate-900 text-sm focus:outline-none focus:border-rose-500"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                {targetItem?.consumptionUnit || 'Units'}
              </span>
            </div>
          </div>

          {/* Reason Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {currentLang === 'lo' ? 'ສາເຫດ / ວັດຖຸປະສົງ (Reason / Purpose)' : 'Reason / Purpose'}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl font-bold text-xs text-slate-800 focus:outline-none focus:border-rose-500"
            >
              <option value="PRINT_PRODUCTION">{currentLang === 'lo' ? 'เบิกไปพิมพ์งานลูกค้า (Print Production Job)' : 'Print Production Job'}</option>
              <option value="INTERNAL_USE">{currentLang === 'lo' ? 'เบิกใช้งานภายในองค์กร (Internal Usage)' : 'Internal Usage'}</option>
              <option value="TESTING_SAMPLE">{currentLang === 'lo' ? 'เบิกทดสอบเครื่อง / ตัวอย่าง (Testing / Sample)' : 'Testing / Sample'}</option>
              <option value="DAMAGED_WASTAGE">{currentLang === 'lo' ? 'กระดาษเสีย / ชำรุด (Damaged / Wastage)' : 'Damaged / Wastage'}</option>
              <option value="OTHER">{currentLang === 'lo' ? 'อื่นๆ (Other)' : 'Other'}</option>
            </select>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {currentLang === 'lo' ? 'หมายเหตุ (Remarks / Order Ref)' : 'Remarks / Order Ref'}
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={currentLang === 'lo' ? 'ระบุเลขที่ออเดอร์ หรือ หมายเหตุเพิ่มเติม...' : 'Order ID or additional notes...'}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl font-semibold text-xs text-slate-800 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition cursor-pointer"
            >
              {currentLang === 'lo' ? 'ยกเลิก' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Scissors className="w-4 h-4" />
              <span>{currentLang === 'lo' ? 'ยืนยันตัดสต็อก' : 'Confirm Discharge'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
