import React, { useState } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Truck, 
  DollarSign, 
  Package, 
  Trash2, 
  Edit3, 
  ShieldAlert, 
  X, 
  CheckCircle2 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function InboundDetailsPage({ poId, onBack }) {
  const { purchaseOrders, setPurchaseOrders, showToast } = useApp();

  const po = purchaseOrders ? purchaseOrders.find(p => (p.poId || p.id) === poId) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Edit form states
  const [editItemName, setEditItemName] = useState(po?.itemName || po?.name || '');
  const [editSupplier, setEditSupplier] = useState(po?.supplierName || '');
  const [editQty, setEditQty] = useState(po?.qty || 1);
  const [editTotalCost, setEditTotalCost] = useState(po?.totalCost || po?.totalPrice || 0);
  const [editDate, setEditDate] = useState(po?.date || new Date().toISOString().split('T')[0]);

  if (!po) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
        <p className="text-slate-500 font-bold">ບໍ່ພົບຂໍ້ມູນການນຳເຂົ້າ (Inbound Record Not Found)</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold"
        >
          ກັບຄືນ (Back)
        </button>
      </div>
    );
  }

  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num || 0).replace('LAK', '₭');
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    if (!setPurchaseOrders) return;

    setPurchaseOrders(prev => prev.map(p => {
      if ((p.poId || p.id) === poId) {
        return {
          ...p,
          itemName: editItemName,
          name: editItemName,
          supplierName: editSupplier,
          qty: Number(editQty),
          totalCost: Number(editTotalCost),
          totalPrice: Number(editTotalCost),
          date: editDate
        };
      }
      return p;
    }));

    setIsEditing(false);
    showToast('ອັບເດດຂໍ້ມູນການນຳເຂົ້າສຳເລັດ! (Updated successfully)', 'success');
  };

  const handleDeleteRecord = () => {
    if (!setPurchaseOrders) return;

    setPurchaseOrders(prev => prev.filter(p => (p.poId || p.id) !== poId));
    showToast(`ລຶບລາຍການ PO #${poId} ສຳເລັດແລ້ວ!`, 'info');
    setIsDeleteModalOpen(false);
    onBack();
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 font-sans pb-12">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-100 rounded-2xl border border-slate-200 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← ກັບໜ້າການນຳເຂົ້າ (Back to Inbound Procurement)</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs shadow-md transition active:scale-95"
          >
            <Edit3 className="w-4 h-4" />
            <span>ແກ້ໄຂຂໍ້ມູນ (Edit Info)</span>
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl font-black text-xs transition active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>ລົບລາຍການ (Delete Record)</span>
          </button>
        </div>
      </div>

      {/* Main Metadata Overview Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="inline-flex items-center px-3 py-1 bg-sky-50 text-sky-700 font-mono font-black text-xs rounded-full border border-sky-200 uppercase">
              {po.itemType || po.type || 'Material'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {po.itemName || po.name}
            </h2>
          </div>

          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-400 font-black block uppercase">PO ID</span>
            <span className="text-sm font-black text-slate-800">{po.poId || po.id}</span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-black uppercase block">ຊື່ຜູ້ສະໜອງ / ຮ້ານຄ້າ</span>
            <span className="text-sm font-black text-slate-900 block mt-0.5">{po.supplierName || 'Vientiane Supply'}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-black uppercase block">ວັນທີນຳເຂົ້າ</span>
            <span className="text-sm font-black text-slate-900 block mt-0.5 font-mono">{po.date || '-'}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-black uppercase block">ຈຳນວນນຳເຂົ້າ</span>
            <span className="text-sm font-black text-slate-900 block mt-0.5 font-mono">
              {po.qty || 1} {po.unitName || 'Units'}
            </span>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
            <span className="text-[10px] text-emerald-700 font-black uppercase block">ຍອດມູນຄ່ານຳເຂົ້າລວມ</span>
            <span className="text-base font-black text-emerald-800 block mt-0.5 font-mono">
              {formatLAK(po.totalCost || po.totalPrice)}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-base text-slate-900">ແກ້ໄຂຂໍ້ມູນ PO #{po.poId || po.id}</h3>
              <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveChanges} className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-slate-600 block">ຊື່ລາຍການ (Item Name)</label>
                <input
                  type="text"
                  required
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 block">ຊື່ຜູ້ສະໜອງ / ຮ້ານຄ້າ (Supplier Name)</label>
                <input
                  type="text"
                  required
                  value={editSupplier}
                  onChange={(e) => setEditSupplier(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 block">ຈຳນວນ (Qty)</label>
                  <input
                    type="number"
                    required
                    value={editQty}
                    onChange={(e) => setEditQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-mono text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 block">ຍອດມູນຄ່າລວມ (LAK)</label>
                  <input
                    type="number"
                    required
                    value={editTotalCost}
                    onChange={(e) => setEditTotalCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-mono text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 block">ວັນທີ (Date)</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3.5 py-2 border rounded-xl font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-black shadow-md"
                >
                  ບັນທຶກ (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert className="w-7 h-7" />
              <div>
                <h3 className="font-black text-base text-slate-900">ຢືນຢັນການລຶບລາຍການ (Confirm Delete)</h3>
                <p className="text-xs text-slate-500 font-semibold">ท่านแน่ใจหรือไม่ว่าต้องการลบรายการนี้?</p>
              </div>
            </div>

            <div className="p-3 bg-red-50 rounded-2xl border border-red-100 text-xs font-bold text-red-900">
              PO #{po.poId || po.id} - {po.itemName || po.name} ({formatLAK(po.totalCost || po.totalPrice)})
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border rounded-xl font-bold text-xs"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                onClick={handleDeleteRecord}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs shadow-md"
              >
                ລົບລາຍການ (Delete)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
