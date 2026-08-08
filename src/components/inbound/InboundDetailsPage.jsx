import React, { useState } from 'react';
import { ArrowLeft, Trash2, Edit3, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import InboundEditForm from './InboundEditForm';
import MaterialDetailsView from './details/MaterialDetailsView';
import EquipmentDetailsView from './details/EquipmentDetailsView';

export default function InboundDetailsPage({ poId, onBack }) {
  const { purchaseOrders, setPurchaseOrders, showToast } = useApp();

  const po = purchaseOrders ? purchaseOrders.find(p => (p.poId || p.id) === poId) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (!po) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center font-sans">
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
    showToast('ອັບເດດຂໍ້ມູນການນຳເຂົ້າສຳເລັດ!', 'success');
  };

  const handleDeleteRecord = () => {
    if (!setPurchaseOrders) return;

    setPurchaseOrders(prev => prev.filter(p => (p.poId || p.id) !== poId));
    showToast(`ລຶບລາຍການ PO #${poId} ສຳເລັດແລ້ວ!`, 'info');
    setIsDeleteModalOpen(false);
    onBack();
  };

  // Dynamic Category Detection Logic
  const isCategoryA =
    po.categoryType === 'Materials' ||
    po.type === 'Material' ||
    po.itemType === 'Material' ||
    (po.materialType && po.categoryType !== 'Machinery');

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 space-y-6 animate-fade-in text-slate-800 font-sans pb-12">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-200 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 bg-slate-100 rounded-2xl border border-slate-200 active:scale-95 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ກັບໜ້າການນຳເຂົ້າ (Back to Inbound List)</span>
        </button>

        <div className="text-right font-mono">
          <span className="text-[10px] text-slate-400 font-black block uppercase">PO ID</span>
          <span className="text-sm font-black text-slate-800">{po.poId || po.id}</span>
        </div>
      </div>

      {/* Dynamic View Dispatcher */}
      {isCategoryA ? (
        <MaterialDetailsView po={po} />
      ) : (
        <EquipmentDetailsView po={po} />
      )}

      {/* Action Footer */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-end gap-3">
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
          <span>ແກ້ໄຂຂໍ້ມູນ (Edit Details)</span>
        </button>
      </div>

      {/* Edit Form Modal Overlay */}
      {isEditing && (
        <InboundEditForm
          initialData={po}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert className="w-7 h-7" />
              <div>
                <h3 className="font-black text-base text-slate-900">ຢືນຢັນການລຶບລາຍການ</h3>
                <p className="text-xs text-slate-500 font-semibold">ທ່ານແນ່ໃຈຫຼືບໍ່ວ່າຕ້ອງການລຶບລາຍການນີ້?</p>
              </div>
            </div>

            <div className="p-3 bg-red-50 rounded-2xl border border-red-100 text-xs font-bold text-red-900">
              PO #{po.poId || po.id} - {po.itemName || po.machineName || po.name} ({formatLAK(po.totalCost || po.purchaseCost || po.unitPrice)})
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-50"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                onClick={handleDeleteRecord}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs shadow-sm"
              >
                ລຶບລາຍການ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
