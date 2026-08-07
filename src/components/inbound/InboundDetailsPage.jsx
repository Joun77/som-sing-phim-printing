import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Edit3, 
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import InboundEditForm from './InboundEditForm';

export default function InboundDetailsPage({ poId, onBack }) {
  const { purchaseOrders, setPurchaseOrders, showToast } = useApp();

  const po = purchaseOrders ? purchaseOrders.find(p => (p.poId || p.id) === poId) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (!po) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-md w-full">
          <p className="text-slate-600 font-bold text-sm">ບໍ່ພົບຂໍ້ມູນການນຳເຂົ້າ (Inbound Record Not Found)</p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-black shadow-sm transition active:scale-95"
          >
            ກັບຄືນ (Back)
          </button>
        </div>
      </div>
    );
  }

  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num || 0).replace('LAK', '₭');
  };

  const handleSave = (updatedData) => {
    if (!setPurchaseOrders) return;

    setPurchaseOrders(prev => prev.map(p => {
      if ((p.poId || p.id) === poId) {
        return {
          ...p,
          ...updatedData
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
    showToast(`ລຶບລາຍການ PO #${poId} ສຳເລັດແລ້ວ! (Deleted PO #${poId} successfully)`, 'info');
    setIsDeleteModalOpen(false);
    onBack();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 space-y-6 animate-fade-in text-slate-800 font-sans pb-12">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-200 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-100 rounded-2xl border border-slate-200 active:scale-95 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ກັບໜ້າການນຳເຂົ້າ (Back to Inbound Procurement)</span>
        </button>
      </div>

      {/* Main Metadata Overview Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="inline-flex items-center px-3 py-1 bg-sky-50 text-sky-700 font-mono font-black text-xs rounded-full border border-sky-200 uppercase">
                {po.materialType || po.itemType || po.categoryType || po.type || 'Material'}
              </span>
              {po.paperSpec && (
                <span className="inline-flex items-center px-3 py-1 bg-purple-50 text-purple-700 font-bold text-xs rounded-full border border-purple-200">
                  📄 {po.paperSpec}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {po.itemName || po.name}
            </h2>
          </div>

          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-400 font-black block uppercase">PO ID</span>
            <span className="text-sm font-black text-slate-800">{po.poId || po.id}</span>
          </div>
        </div>

        {/* Complete Inbound Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-black uppercase block">ຊື່ຜູ້ສະໜອງ / ຮ້ານຄ້າ (Supplier)</span>
            <span className="text-sm font-black text-slate-900 block mt-0.5">{po.supplierName || 'Vientiane Supply'}</span>
            {po.supplierContact && (
              <span className="text-[10px] font-mono text-sky-600 font-bold block mt-0.5 truncate">
                📞 {po.supplierContact}
              </span>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-black uppercase block">ວັນທີນຳເຂົ້າ (Date)</span>
            <span className="text-sm font-black text-slate-900 block mt-0.5 font-mono">{po.date || po.purchaseDate || '-'}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-black uppercase block">ລາຄາຊື້ຕໍ່ໜ່ວຍ (Unit Price)</span>
            <span className="text-sm font-black text-slate-900 block mt-0.5 font-mono">
              {formatLAK(po.unitPrice || po.costPerUnit || (po.totalCost / (po.qty || 1)))}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-black uppercase block">ຈຳນວນນຳເຂົ້າ (Quantity)</span>
            <span className="text-sm font-black text-slate-900 block mt-0.5 font-mono">
              {po.qty || 1} {po.unitName || 'Units'}
            </span>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
            <span className="text-[10px] text-emerald-700 font-black uppercase block">ຍອດມູນຄ່ານຳເຂົ້າລວມ (Total Cost)</span>
            <span className="text-base font-black text-emerald-800 block mt-0.5 font-mono">
              {formatLAK(po.totalCost || po.totalPrice)}
            </span>
          </div>
        </div>

        {/* Conditional Machinery Specs Section (When Category is Machinery / Equipment) */}
        {(po.categoryType === 'Machinery' || po.type === 'Equipment') && (
          <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100 space-y-3">
            <span className="text-xs text-purple-700 font-black uppercase tracking-wider block">
              ⚙️ ລາຍລະອຽດເຕັກນິກເຄື່ອງຈັກ (Machinery Technical Specifications)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
              <div className="bg-white p-3 rounded-xl border border-purple-200">
                <span className="text-[10px] text-slate-500 block uppercase">ໝວດເຄື່ອງຈັກ</span>
                <span className="text-slate-900 font-black">{po.itemType || po.machineCategory || 'Printer'}</span>
              </div>

              {po.lifespanYears && (
                <div className="bg-white p-3 rounded-xl border border-purple-200">
                  <span className="text-[10px] text-slate-500 block uppercase">ອາຍຸການໃຊ້ງານ</span>
                  <span className="text-slate-900 font-black font-mono">{po.lifespanYears} ປີ (Years)</span>
                </div>
              )}

              {po.printedPagesCapacity && (
                <div className="bg-white p-3 rounded-xl border border-purple-200">
                  <span className="text-[10px] text-slate-500 block uppercase">ຄວາມຈຸແຜ່ນພິມລວມ</span>
                  <span className="text-slate-900 font-black font-mono">{po.printedPagesCapacity.toLocaleString()} ແຜ່ນ</span>
                </div>
              )}

              {po.inkType && (
                <div className="bg-white p-3 rounded-xl border border-purple-200">
                  <span className="text-[10px] text-slate-500 block uppercase">ຊະນິດໝຶກພິມ</span>
                  <span className="text-purple-900 font-black">{po.inkType}</span>
                </div>
              )}

              {po.blackMlPerSheet > 0 && (
                <div className="bg-white p-3 rounded-xl border border-purple-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Black Rate @5%</span>
                  <span className="text-slate-900 font-mono font-black">{po.blackMlPerSheet.toFixed(4)} ml/sheet</span>
                </div>
              )}

              {po.colorMlPerSheet > 0 && (
                <div className="bg-white p-3 rounded-xl border border-purple-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Color Rate @5%</span>
                  <span className="text-slate-900 font-mono font-black">{po.colorMlPerSheet.toFixed(4)} ml/sheet</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dual Attachments View (Item Photo & Payment Slip) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[10px] text-slate-500 font-black uppercase block">ຮູບພາບສິນຄ້າ (Item Photo)</span>
            {po.itemPhoto ? (
              <img src={po.itemPhoto} alt="Item Photo" className="w-full h-44 object-contain rounded-xl bg-white p-2 border border-slate-200" />
            ) : (
              <div className="h-44 flex items-center justify-center bg-white rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">
                ບໍ່ມີຮູບພາບສິນຄ້າ (No Item Photo)
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[10px] text-slate-500 font-black uppercase block">ຫຼັກຖານການຈ່າຍເງິນ / ສະລິບ (Payment Slip)</span>
            {po.paymentSlip ? (
              <img src={po.paymentSlip} alt="Payment Slip" className="w-full h-44 object-contain rounded-xl bg-white p-2 border border-slate-200" />
            ) : (
              <div className="h-44 flex items-center justify-center bg-white rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">
                ບໍ່ມີສະລິບການຈ່າຍເງິນ (No Payment Slip)
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Footer (Edit & Delete Buttons moved here) */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl font-black text-xs transition active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>ລຶບລາຍການ (Delete Record)</span>
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-xs shadow-sm transition active:scale-95"
          >
            <Edit3 className="w-4 h-4" />
            <span>ແກ້ໄຂຂໍ້ມູນ (Edit Info)</span>
          </button>
        </div>
      </div>

      {/* Edit Inbound Modal Portal Overlay */}
      {isEditing && (
        <InboundEditForm
          initialData={po}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {/* Delete Confirmation Modal (Light Theme Compliant) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert className="w-7 h-7" />
              <div>
                <h3 className="font-black text-base text-slate-900">ຢືນຢັນການລຶບລາຍການ (Confirm Delete)</h3>
                <p className="text-xs text-slate-500 font-semibold">ທ່ານແນ່ໃຈຫຼືບໍ່ວ່າຕ້ອງການລຶບລາຍການນີ້? (Are you sure you want to delete this record?)</p>
              </div>
            </div>

            <div className="p-3 bg-red-50 rounded-2xl border border-red-100 text-xs font-bold text-red-900">
              PO #{po.poId || po.id} - {po.itemName || po.name} ({formatLAK(po.totalCost || po.totalPrice)})
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-50"
              >
                ຍົກເລີກ (Cancel)
              </button>
              <button
                type="button"
                onClick={handleDeleteRecord}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs shadow-sm"
              >
                ລຶບລາຍການ (Delete)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


