import React, { useState, useEffect } from 'react';
import { X, Wrench, CheckCircle2, AlertTriangle, Cpu, User } from 'lucide-react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';

interface IssueSparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialItem: any;
  onSuccess?: () => void;
}

export const IssueSparePartModal: React.FC<IssueSparePartModalProps> = ({
  isOpen,
  onClose,
  materialItem,
  onSuccess,
}) => {
  const { equipment, replaceEquipmentComponent, showToast } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [partName, setPartName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [technician, setTechnician] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (materialItem) {
      const assigned = materialItem.assigned_printer_id || 
                       materialItem.technical_specs?.assigned_printer_id || 
                       materialItem.assignedPrinterId || '';
      if (assigned && equipment.some(e => e.id === assigned)) {
        setSelectedEquipmentId(assigned);
      } else if (equipment.length > 0 && !selectedEquipmentId) {
        setSelectedEquipmentId(equipment[0].id);
      }
      setPartName(materialItem.name || materialItem.technical_specs?.partName || 'ຊິ້ນສ່ວນອະໄຫຼ່');
      setQuantity(1);
      setNotes('');
    }
  }, [materialItem, equipment]);

  if (!isOpen || !materialItem) return null;

  const currentStock = Number(materialItem.stock_qty ?? materialItem.stockQty ?? 0);
  const isOutOfStock = currentStock <= 0;

  const targetEquipment = equipment.find(e => e.id === selectedEquipmentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentId) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາເລືອກເຄື່ອງຈັກເປົ້າໝາຍ' : 'Please select target equipment', 'warning');
      return;
    }
    if (quantity > currentStock) {
      showToast(currentLang === 'lo' ? 'ຈຳນວນເບີກເກີນສະຕັອກຄົງເຫຼືອ!' : 'Quantity exceeds available stock!', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Call Backend API
      const res = await fetch(`/api/v1/equipment/${selectedEquipmentId}/install-part`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: materialItem.id || materialItem.sku,
          part_name: partName,
          quantity: quantity,
          replaced_by: technician || 'Admin/Technician',
          notes: notes,
        }),
      });

      // 2. Sync with Frontend AppContext store
      if (replaceEquipmentComponent) {
        replaceEquipmentComponent(
          selectedEquipmentId,
          partName,
          materialItem.id || materialItem.sku,
          quantity,
          notes
        );
      }

      showToast(
        currentLang === 'lo'
          ? `ເບີກອະໄຫຼ່ "${materialItem.name}" ໃສ່ເຄື່ອງ ${targetEquipment?.name || selectedEquipmentId} ສຳເລັດ!`
          : `Issued part "${materialItem.name}" to ${targetEquipment?.name || selectedEquipmentId} successfully!`,
        'success'
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to issue spare part:', err);
      showToast(err.message || 'Error installing spare part', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden text-slate-800 animate-scale-up">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-400/30">
              <Wrench className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                {currentLang === 'lo' ? 'ເບີກອະໄຫຼ່ໃສ່ເຄື່ອງຈັກ (Issue to Machine)' : 'Issue Spare Part to Equipment'}
              </h3>
              <p className="text-xs text-indigo-200 font-mono">
                {materialItem.sku || materialItem.id}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Item details card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">ຊື່ອະໄຫຼ່:</span>
              <span className="text-xs font-black text-slate-900">{materialItem.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">ສະຕັອກຄົງເຫຼືອ:</span>
              <span className={`text-xs font-black font-mono px-2.5 py-0.5 rounded-lg ${
                currentStock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700 animate-pulse'
              }`}>
                {currentStock} {materialItem.consumption_unit || materialItem.unit || 'ອັນ'}
              </span>
            </div>
            {isOutOfStock && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-bold text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>ອະໄຫຼ່ໝົດສາງ ບໍ່ສາມາດເບີກໄດ້!</span>
              </div>
            )}
          </div>

          {/* Target Machine Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              <span>{currentLang === 'lo' ? 'ເລືອກເຄື່ອງຈັກເປົ້າໝາຍ (Target Equipment) *' : 'Target Equipment *'}</span>
            </label>
            <select
              value={selectedEquipmentId}
              onChange={(e) => setSelectedEquipmentId(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">-- ເລືອກເຄື່ອງຈັກ --</option>
              {equipment.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} ({eq.id}) - {eq.category || 'Equipment'}
                </option>
              ))}
            </select>
          </div>

          {/* Wear Part Position / Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              {currentLang === 'lo' ? 'ຕຳແໜ່ງ / ຊື່ຊິ້ນສ່ວນທີ່ປ່ຽນ (Wear Part Name) *' : 'Wear Part Position / Name *'}
            </label>
            <input
              type="text"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              required
              placeholder="e.g. Drum Unit, Cutting Blade, Heat Roller..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Quantity and Technician */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                {currentLang === 'lo' ? 'ຈຳນວນເບີກ *' : 'Quantity *'}
              </label>
              <input
                type="number"
                min="1"
                max={Math.max(1, currentStock)}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-black focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-slate-500" />
                <span>{currentLang === 'lo' ? 'ຊ່າງ / ຜູ້ປ່ຽນ' : 'Technician'}</span>
              </label>
              <input
                type="text"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                placeholder="ຊື່ຊ່າງສ້ອມ..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              {currentLang === 'lo' ? 'ໝາຍເຫດການຕິດຕັ້ງ' : 'Installation Notes'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. ປ່ຽນຕາມຮອບບຳລຸງຮັກສາ 50,000 ແຜ່ນ"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={isOutOfStock || submitting}
              className={`px-5 py-2 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer ${
                isOutOfStock || submitting
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 active:scale-95'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'ກຳລັງບັນທຶກ...' : 'ຢືນຢັນການເບີກ & ຕິດຕັ້ງ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueSparePartModal;
