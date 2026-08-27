import React, { useState } from 'react';
import { X, Building2, Save, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export interface SupplierData {
  id?: string;
  code: string;
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  tax_id: string;
  payment_terms_days: number;
  currency: string;
  notes: string;
}

interface Props {
  supplier?: SupplierData | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SupplierFormModal: React.FC<Props> = ({ supplier, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const isEditing = !!supplier?.id;

  const [code, setCode] = useState(supplier?.code || '');
  const [name, setName] = useState(supplier?.name || '');
  const [contactName, setContactName] = useState(supplier?.contact_name || '');
  const [phone, setPhone] = useState(supplier?.phone || '');
  const [email, setEmail] = useState(supplier?.email || '');
  const [address, setAddress] = useState(supplier?.address || '');
  const [taxId, setTaxId] = useState(supplier?.tax_id || '');
  const [terms, setTerms] = useState(supplier?.payment_terms_days || 30);
  const [currency, setCurrency] = useState(supplier?.currency || 'LAK');
  const [notes, setNotes] = useState(supplier?.notes || '');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      code: code.trim(),
      name: name.trim(),
      contact_name: contactName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      tax_id: taxId.trim(),
      payment_terms_days: Number(terms) || 30,
      currency,
      notes: notes.trim(),
    };

    try {
      const url = isEditing ? `/api/v1/suppliers/${supplier.id}` : '/api/v1/suppliers';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to save supplier');
      }

      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error saving supplier');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>{isEditing ? 'ແກ້ໄຂຂໍ້ມູນຜູ້ສະໜອງ (Edit Supplier)' : 'ເພີ່ມຜູ້ສະໜອງໃໝ່ (Add Supplier)'}</span>
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

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-bold">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-500 uppercase">ລະຫັດຜູ້ສະໜອງ (Code) *</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="SUP-001"
                className="w-full px-3.5 py-2 border rounded-xl font-mono uppercase"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 uppercase">ຊື່ບໍລິສັດ / ຮ້ານ (Supplier Name) *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Lao Paper Trading"
                className="w-full px-3.5 py-2 border rounded-xl"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-500 uppercase">ຊື່ຜູ້ຕິດຕໍ່ (Contact Person)</label>
              <input
                type="text"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                className="w-full px-3.5 py-2 border rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 uppercase">ເບີໂທລະສັບ (Phone)</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+856 20 5555 8888"
                className="w-full px-3.5 py-2 border rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-slate-500 uppercase">ເຄຣດິດ (Credit Days)</label>
              <input
                type="number"
                value={terms}
                onChange={e => setTerms(Number(e.target.value))}
                placeholder="30"
                className="w-full px-3.5 py-2 border rounded-xl font-sans"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 uppercase">ສະກຸນເງິນ (Currency)</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2 border rounded-xl bg-white"
              >
                <option value="LAK">LAK (₭)</option>
                <option value="THB">THB (฿)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 uppercase">Tax ID / ເລກເສຍພາສີ</label>
              <input
                type="text"
                value={taxId}
                onChange={e => setTaxId(e.target.value)}
                className="w-full px-3.5 py-2 border rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 uppercase">ທີ່ຢູ່ (Address)</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Vientiane, Lao PDR"
              className="w-full px-3.5 py-2 border rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 uppercase">ໝາຍເຫດ (Notes)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-3 border rounded-xl font-medium"
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
              {submitting ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ (Save)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
