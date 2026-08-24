import React, { useState } from 'react';
import { OrderDetailVerification, OverridePricingPayload } from '../../types/adminVerification';

interface ManualOverrideModalProps {
  isOpen: boolean;
  order: OrderDetailVerification;
  onClose: () => void;
  onSubmitOverride: (payload: OverridePricingPayload) => Promise<void>;
  onRequestDrivePermission: () => void;
}

export const ManualOverrideModal: React.FC<ManualOverrideModalProps> = ({
  isOpen,
  order,
  onClose,
  onSubmitOverride,
  onRequestDrivePermission,
}) => {
  const [pageCount, setPageCount] = useState<number>(order.pageCount);
  const [overrideTAC, setOverrideTAC] = useState<number>(order.coverage.tac);
  const [overrideUnitPrice, setOverrideUnitPrice] = useState<number>(order.costAudit.unitPrice);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [previewPrice, setPreviewPrice] = useState<{ unitPrice: number; totalPrice: number }>({
    unitPrice: order.costAudit.unitPrice,
    totalPrice: order.costAudit.totalPrice,
  });

  if (!isOpen) return null;

  const handleRecalculatePreview = () => {
    // Recalculate based on input values
    const sheetsPerUnit = order.isDoubleSided ? Math.ceil(pageCount / 2) : pageCount;
    const paperCost = 150 * sheetsPerUnit;
    const inkCost = (overrideTAC * 2) * pageCount;
    const bindingCost = order.costAudit.bindingCost / order.quantity || 1000;
    const unitPrice = paperCost + inkCost + bindingCost;
    const totalPrice = unitPrice * order.quantity + order.costAudit.setupCost;

    setPreviewPrice({
      unitPrice: Math.round(unitPrice),
      totalPrice: Math.round(totalPrice),
    });
    setOverrideUnitPrice(Math.round(unitPrice));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('โปรดระบุเหตุผลในการปรับปรุงราคาเพื่อการตรวจสอบย้อนหลัง');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitOverride({
        pageCount,
        overrideTAC,
        overrideUnitPrice,
        reason,
        approvedBy: 'Admin / Production Manager',
      });
      onClose();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              ปรับปรุงราคาและสเปก (Manual Override)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ออเดอร์ #{order.orderNumber} — {order.customerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-all"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Editable Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                จำนวนหน้าที่แท้จริง (Actual Pages)
              </label>
              <input
                type="number"
                min={1}
                value={pageCount}
                onChange={(e) => setPageCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">เดิม: {order.pageCount} หน้า</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                ความหนาแน่นหมึก TAC % (Actual TAC)
              </label>
              <input
                type="number"
                min={0}
                max={400}
                step={0.1}
                value={overrideTAC}
                onChange={(e) => setOverrideTAC(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">เดิม: {order.coverage.tac.toFixed(2)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                กำหนดราคาต่อเล่มโดยตรง (₭ / เล่ม)
              </label>
              <input
                type="number"
                min={0}
                value={overrideUnitPrice}
                onChange={(e) => setOverrideUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-indigo-700"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleRecalculatePreview}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 transition-all active:scale-98"
              >
                🔄 คำนวณราคาจำลองใหม่ (Preview)
              </button>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              เหตุผลในการปรับปรุงราคา (Audit Reason) <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ระบุเหตุผล เช่น ลูกค้าส่งไฟล์ใหม่จำนวนหน้าลดลง, ปรับลดสัดส่วนหมึกตามจริง..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Comparison Diff Preview */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
              เปรียบเทียบผลลัพธ์ (Before vs After)
            </span>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">ก่อนปรับ:</span>
                <span className="font-semibold text-slate-700">
                  ₭{order.costAudit.unitPrice.toLocaleString()} / เล่ม (รวม ₭{order.costAudit.totalPrice.toLocaleString()})
                </span>
              </div>
              <div>
                <span className="text-indigo-600 block font-bold">หลังปรับ:</span>
                <span className="font-bold text-indigo-800 text-sm">
                  ₭{previewPrice.unitPrice.toLocaleString()} / เล่ม (รวม ₭{previewPrice.totalPrice.toLocaleString()})
                </span>
              </div>
            </div>
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onRequestDrivePermission}
              className="w-full sm:w-auto px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all"
            >
              📥 คัดลอกข้อความขอสิทธิ์ Drive
            </button>

            <div className="flex space-x-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันและอนุมัติสั่งผลิต'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
