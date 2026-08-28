import React, { useState } from 'react';
import { X, PackageCheck, Save, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface POLine {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  received_qty: number;
}

interface POData {
  id: string;
  po_number: string;
  supplier_name: string;
  lines?: POLine[];
}

interface Props {
  po: POData;
  onClose: () => void;
  onSuccess: () => void;
}

export const GoodsReceiptModal: React.FC<Props> = ({ po, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [receivedBy, setReceivedBy] = useState('ADMIN');
  const [notes, setNotes] = useState('');
  const [receiveAmounts, setReceiveAmounts] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    (po.lines || []).forEach(l => {
      const remaining = Math.max(0, l.quantity - l.received_qty);
      init[l.id] = remaining;
    });
    return init;
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQtyChange = (lineId: string, val: number) => {
    setReceiveAmounts(prev => ({ ...prev, [lineId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const linesToReceive = Object.entries(receiveAmounts)
      .filter(([_, qty]) => qty > 0)
      .map(([lineId, qty]) => ({
        po_line_id: lineId,
        received_qty: Number(qty)
      }));

    if (linesToReceive.length === 0) {
      setError('ກະລຸນາລະບຸຈຳນວນທີ່ຮັບຢ່າງໜ້ອຍ 1 ລາຍການ');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/purchase-orders/${po.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          received_by: receivedBy,
          notes: notes.trim(),
          lines: linesToReceive
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to record receipt');
      }

      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inbound'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error recording goods receipt');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <PackageCheck className="w-5 h-5 text-emerald-600" />
            <span>ບັນທຶກຮັບສິນຄ້າເຂົ້າສາງ (Goods Receipt against PO)</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl text-xs space-y-1">
          <div className="font-bold text-slate-900">
            ໃບສັ່ງຊື້ເລກທີ: <span className="font-mono text-indigo-600 font-black">{po.po_number}</span>
          </div>
          <div className="text-slate-500 font-medium">ຜູ້ສະໜອງ: {po.supplier_name}</div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
          <div className="space-y-2">
            <label className="text-slate-500 uppercase tracking-wider text-[11px]">
              ກວດສອບ ແລະ ລະບຸຈຳນວນທີ່ຮັບຈິງ (Received Qty)
            </label>
            <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100 overflow-hidden">
              {(po.lines || []).map(line => {
                const remaining = Math.max(0, line.quantity - line.received_qty);
                return (
                  <div key={line.id} className="p-3 bg-white flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{line.description}</div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        ສັ່ງ: {line.quantity} {line.unit} • ຮັບແລ້ວ: {line.received_qty} • ຄ້າງຮັບ: {remaining}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max={remaining}
                        step="any"
                        value={receiveAmounts[line.id] ?? remaining}
                        onChange={e => handleQtyChange(line.id, Number(e.target.value))}
                        className="w-24 px-2.5 py-1.5 border rounded-xl text-right font-black font-sans text-emerald-700"
                      />
                      <span className="text-slate-500 text-xs font-semibold">{line.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 uppercase">ໝາຍເຫດການຮັບເຄື່ອງ (Notes)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="ເຊັ່ນ: ກວດສອບສະພາບສິນຄ້າສົມບູນ, ເກັບເຂົ້າຊັ້ນ A1"
              className="w-full px-3.5 py-2 border rounded-xl"
            />
          </div>

          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>ລະບົບຈະເຮັດການຕັດບັນທຶກ Inbound Stock ແລະ ສ້າງຍອດໜີ້ Accounts Payable (AP) ໃຫ້ອັດຕະໂນມັດ</span>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'ກຳລັງບັນທຶກ...' : 'ຢືນຢັນຮັບສິນຄ້າ (Confirm Receipt)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
