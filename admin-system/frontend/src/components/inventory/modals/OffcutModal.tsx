import React, { useState } from 'react';
import { X, Scissors } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function OffcutModal({ isOpen, onClose }) {
  const { inventory, addOffcut, showToast } = useApp();
  const [name, setName] = useState('');
  const [qty, setQty] = useState(10);
  const [paperId, setPaperId] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const papersOnly = inventory.filter(i => i.category === 'Paper');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !paperId || qty <= 0) {
      showToast('Please fill out all required fields!', 'warning');
      return;
    }
    addOffcut({
      name,
      qty: Number(qty),
      paperId,
      notes
    });
    showToast('Remnant/Offcut logged successfully!', 'success');
    onClose();
    setName('');
    setQty(10);
    setNotes('');
    setPaperId('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        <div className="p-5 border-b flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-extrabold text-base text-slate-800">Add Offcut Remnant</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Catalog paper leftovers for reuse</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase block">Offcut Description</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. A3 Matte remnants 120gsm (half cut)"
              className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase block">Origin Paper Stock</label>
            <select
              required
              value={paperId}
              onChange={(e) => setPaperId(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold text-sm bg-white"
            >
              <option value="">-- Choose Origin Paper --</option>
              {papersOnly.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase block">Quantity (Sheets)</label>
              <input
                type="number"
                required
                min="1"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold font-sans text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase block">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Storage location, etc."
                className="w-full px-3 py-2 border rounded-xl focus:outline-none font-semibold text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
            >
              Add Remnant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
