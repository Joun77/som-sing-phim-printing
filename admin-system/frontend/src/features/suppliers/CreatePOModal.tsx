import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { SupplierData } from './SupplierFormModal';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

interface LineInput {
  material_id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

export const CreatePOModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [currency, setCurrency] = useState('LAK');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineInput[]>([
    { description: 'Art Paper 260gsm (500 sheets/pack)', quantity: 10, unit: 'pack', unit_price: 450000 }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/suppliers')
      .then(r => r.json())
      .then(json => {
        const list = json.data || [];
        setSuppliers(list);
        if (list.length > 0) {
          setSelectedSupplierId(list[0].id || list[0].code);
          setCurrency(list[0].currency || 'LAK');
        }
      })
      .catch(console.error);
  }, []);

  const handleAddLine = () => {
    setLines(prev => [...prev, { description: '', quantity: 1, unit: 'pack', unit_price: 0 }]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: keyof LineInput, value: any) => {
    setLines(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const totalPOAmount = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedSupplierId) {
      setError('ກະລຸນາເລືອກຜູ້ສະໜອງ');
      return;
    }
    if (lines.length === 0 || lines.some(l => !l.description.trim() || l.quantity <= 0)) {
      setError('ກະລຸນາຕື່ມຂໍ້ມູນລາຍການສັ່ງຊື້ໃຫ້ຄົບຖ້ວນ');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        supplier_id: selectedSupplierId,
        expected_delivery: expectedDelivery,
        currency,
        notes,
        created_by: 'ADMIN',
        lines: lines.map(l => ({
          description: l.description.trim(),
          quantity: Number(l.quantity),
          unit: l.unit.trim() || 'unit',
          unit_price: Number(l.unit_price)
        }))
      };

      const res = await fetch('/api/v1/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to create PO');
      }

      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error creating PO');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
            <span>ສ້າງໃບສັ່ງຊື້ໃໝ່ (Create Purchase Order)</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-500 uppercase">ເລືອກຜູ້ສະໜອງ (Supplier) *</label>
              <select
                value={selectedSupplierId}
                onChange={e => {
                  setSelectedSupplierId(e.target.value);
                  const found = suppliers.find(s => s.id === e.target.value || s.code === e.target.value);
                  if (found) setCurrency(found.currency || 'LAK');
                }}
                className="w-full px-3.5 py-2 border rounded-xl bg-white"
                required
              >
                {suppliers.map(s => (
                  <option key={s.id || s.code} value={s.id || s.code}>
                    {s.name} ({s.code}) - {s.currency}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 uppercase">ວັນທີຄາດວ່າຈະຮັບຂອງ (Expected Delivery)</label>
              <input
                type="date"
                value={expectedDelivery}
                onChange={e => setExpectedDelivery(e.target.value)}
                className="w-full px-3.5 py-2 border rounded-xl"
              />
            </div>
          </div>

          {/* Lines Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-700 uppercase tracking-wider text-[11px] font-extrabold">
                ລາຍການວັດຖຸດິບທີ່ສັ່ງຊື້ (PO Line Items)
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> ເພີ່ມແຖວ
              </button>
            </div>

            <div className="space-y-2 border border-slate-100 rounded-2xl p-3 bg-slate-50/50">
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="ລາຍລະອຽດວັດຖຸດິບ..."
                      value={line.description}
                      onChange={e => handleLineChange(idx, 'description', e.target.value)}
                      className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={e => handleLineChange(idx, 'quantity', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-sans"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Unit"
                      value={line.unit}
                      onChange={e => handleLineChange(idx, 'unit', e.target.value)}
                      className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Price"
                      value={line.unit_price}
                      onChange={e => handleLineChange(idx, 'unit_price', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-sans"
                      required
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 text-sm font-black text-slate-900">
              <span>ມູນຄ່າລວມ: <span className="text-indigo-600 font-sans">{currency} {totalPOAmount.toLocaleString()}</span></span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 uppercase">ໝາຍເຫດ (Notes)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="ເຊັ່ນ: ຂໍຈັດສົ່ງກ່ອນເວລາ 16:00..."
              className="w-full px-3.5 py-2 border rounded-xl"
            />
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
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'ກຳລັງສ້າງ...' : 'ສ້າງໃບສັ່ງຊື້ (Create PO Draft)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
