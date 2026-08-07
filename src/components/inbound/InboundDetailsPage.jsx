import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Edit3, 
  ShieldAlert,
  Tag,
  Package,
  Layers,
  DollarSign,
  Boxes,
  Truck,
  PhoneCall,
  Image as ImageIcon,
  Receipt
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
    showToast('ອັບເດດຂໍ້ມູນການນຳເຂົ້າສຳເລັດ! (Updated successfully)', 'success');
  };

  const handleDeleteRecord = () => {
    if (!setPurchaseOrders) return;

    setPurchaseOrders(prev => prev.filter(p => (p.poId || p.id) !== poId));
    showToast(`ລຶບລາຍການ PO #${poId} ສຳເລັດແລ້ວ! (Deleted PO #${poId} successfully)`, 'info');
    setIsDeleteModalOpen(false);
    onBack();
  };

  const isMachinery = po.categoryType === 'Machinery' || po.type === 'Equipment' || po.itemType === 'Printer' || po.itemType === 'Cutter' || po.itemType === 'Laminator' || po.itemType === 'Binder';
  const categoryLabel = isMachinery ? `ໝວດ B: ເຄື່ອງຈັກ & ອຸປະກອນ (${po.itemType || po.category || 'Machinery'})` : `ໝວດ A: ວັດສະດຸ (${po.materialType || 'Materials'})`;

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

        <div className="text-right font-mono">
          <span className="text-[10px] text-slate-400 font-black block uppercase">PO ID</span>
          <span className="text-sm font-black text-slate-800">{po.poId || po.id}</span>
        </div>
      </div>

      {/* Main Details Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className={`inline-flex items-center px-3 py-1 font-mono font-black text-xs rounded-full border uppercase ${
              isMachinery ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-sky-50 text-sky-700 border-sky-200'
            }`}>
              {categoryLabel}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {po.itemName || po.name || '-'}
            </h2>
          </div>
        </div>

        {/* Dynamic Display Fields Matching InboundEntryPage exact forms */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-sky-600" />
            <span>ລາຍລະອຽດຂໍ້ມູນຕາມຟອມນຳເຂົ້າ (Inbound Entry Details)</span>
          </h3>

          {!isMachinery ? (
            /* CATEGORY A: MATERIALS & SUPPLIES ENTRY FIELDS */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <Tag className="w-4 h-4 text-sky-600" />
                  <span className="text-[10px] font-black uppercase tracking-wider">1. ໝວດວັດສະດຸ (Category)</span>
                </div>
                <p className="text-sm font-black text-slate-900">{po.materialType || po.category || 'Paper'}</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <Package className="w-4 h-4 text-sky-600" />
                  <span className="text-[10px] font-black uppercase tracking-wider">2. ຊື່ລາຍການວັດສະດຸ (Item Name)</span>
                </div>
                <p className="text-sm font-black text-slate-900 truncate">{po.itemName || po.name || '-'}</p>
              </div>

              {po.paperSpec && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span className="text-[10px] font-black uppercase tracking-wider">3. ປະເພດເຈ້ຍ (Paper Spec)</span>
                  </div>
                  <p className="text-sm font-black text-slate-900">{po.paperSpec}</p>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] font-black uppercase tracking-wider">4. ລາຄາຊື້ຕໍ່ໜ່ວຍ (Unit Price)</span>
                </div>
                <p className="text-sm font-black font-mono text-emerald-700">
                  {formatLAK(po.unitPrice || po.costPerUnit || (po.qty ? (po.totalCost || po.totalPrice) / po.qty : 0))}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <Boxes className="w-4 h-4 text-amber-600" />
                  <span className="text-[10px] font-black uppercase tracking-wider">5. ຈຳນວນນຳເຂົ້າ (Quantity)</span>
                </div>
                <p className="text-sm font-black font-mono text-slate-900">
                  {po.qty || 1} {po.unitName || 'Units'}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span className="text-[10px] font-black uppercase tracking-wider">6. ຊື່ຜູ້ສະໜອງ (Supplier)</span>
                </div>
                <p className="text-sm font-black text-slate-900 truncate">{po.supplierName || 'Vientiane Supply Co.'}</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-sm sm:col-span-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <PhoneCall className="w-4 h-4 text-indigo-600" />
                  <span className="text-[10px] font-black uppercase tracking-wider">7. ຊ່ອງທາງຕິດຕໍ່ / ເບີໂທ</span>
                </div>
                <p className="text-sm font-black text-slate-800 truncate">{po.supplierContact || '-'}</p>
              </div>
            </div>
          ) : (
            /* CATEGORY B: MACHINERY ASSET ENTRY FIELDS */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
                  <span className="text-[10px] text-slate-500 font-black uppercase block">1. ໝວດເຄື່ອງຈັກ (Category)</span>
                  <p className="text-sm font-black text-slate-900">{po.itemType || po.machineCategory || 'Printer'}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
                  <span className="text-[10px] text-slate-500 font-black uppercase block">2. ຊື່ເຄື່ອງຈັກ (Machine Name)</span>
                  <p className="text-sm font-black text-slate-900 truncate">{po.itemName || po.name || '-'}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
                  <span className="text-[10px] text-emerald-700 font-black uppercase block">3. ລາຄາຈັດຊື້ (Purchase Cost)</span>
                  <p className="text-sm font-black font-mono text-emerald-800">{formatLAK(po.totalCost || po.unitPrice || 0)}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
                  <span className="text-[10px] text-blue-700 font-black uppercase block">4. ຊື່ຜູ້ສະໜອງ (Supplier)</span>
                  <p className="text-sm font-black text-slate-900 truncate">{po.supplierName || 'Vientiane Supply'}</p>
                </div>

                {po.lifespanYears && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
                    <span className="text-[10px] text-slate-500 font-black uppercase block">5. ອາຍຸການໃຊ້ງານ (Lifespan)</span>
                    <p className="text-sm font-black font-mono text-slate-900">{po.lifespanYears} ປີ (Years)</p>
                  </div>
                )}

                {po.printedPagesCapacity && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
                    <span className="text-[10px] text-slate-500 font-black uppercase block">6. ຄວາມຈຸແຜ່ນພິມລວມ (Lifetime Capacity)</span>
                    <p className="text-sm font-black font-mono text-slate-900">{Number(po.printedPagesCapacity).toLocaleString()} ແຜ່ນ</p>
                  </div>
                )}

                {po.supplierContact && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-sm sm:col-span-2">
                    <span className="text-[10px] text-slate-500 font-black uppercase block">7. ຊ່ອງທາງຕິດຕໍ່ / ເບີໂທ (Contact)</span>
                    <p className="text-sm font-black text-slate-800 truncate">{po.supplierContact}</p>
                  </div>
                )}
              </div>

              {/* Printer Technical Specs & Ink Yield Rates Box */}
              {(po.inkType || po.blackYieldPages || po.colorYieldPages) && (
                <div className="bg-purple-50/70 p-5 rounded-3xl border border-purple-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                    <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                      ⚡ Technical Specs & Ink Yield Parameters (ISO 5% Standard)
                    </span>
                    {po.inkType && (
                      <span className="px-3 py-0.5 bg-purple-200/60 text-purple-900 font-black text-[10px] rounded-full">
                        {po.inkType} Ink
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-bold">
                    <div className="bg-white p-3 rounded-2xl border border-purple-200">
                      <span className="text-[10px] text-slate-500 block uppercase">Black Yield & Bottle</span>
                      <span className="text-slate-900 font-mono font-black">
                        {po.blackYieldPages || 0} pgs / {po.blackCapacityMl || 0} ml
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-purple-200">
                      <span className="text-[10px] text-purple-700 block uppercase">Color Yield & Total</span>
                      <span className="text-purple-900 font-mono font-black">
                        {po.colorYieldPages || 0} pgs / {po.colorCapacityMl || 0} ml
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-purple-200">
                      <span className="text-[10px] text-slate-500 block uppercase">Black Rate @5% ISO</span>
                      <span className="text-slate-900 font-mono font-black">
                        {po.blackMlPerSheet ? po.blackMlPerSheet.toFixed(4) : ((po.blackCapacityMl || 0) / (po.blackYieldPages || 1)).toFixed(4)} ml/sheet
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-purple-200">
                      <span className="text-[10px] text-purple-700 block uppercase">Color Rate @5% ISO</span>
                      <span className="text-purple-900 font-mono font-black">
                        {po.colorMlPerSheet ? po.colorMlPerSheet.toFixed(4) : ((po.colorCapacityMl || 0) / (po.colorYieldPages || 1)).toFixed(4)} ml/sheet
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stored Attachments (Item Photo & Payment Slip) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <ImageIcon className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-black uppercase tracking-wider">ຮູບພາບສິນຄ້າ / ເຄື່ອງຈັກ (Item Photo)</span>
              </div>
              {po.itemPhoto ? (
                <div className="h-52 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center">
                  <img src={po.itemPhoto} alt="Item Photo" className="w-full h-full object-contain rounded-lg" />
                </div>
              ) : (
                <div className="h-52 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">
                  <ImageIcon className="w-8 h-8 mb-1 text-slate-300" />
                  <span>ບໍ່ມີຮູບພາບສິນຄ້າ (No Item Photo)</span>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black uppercase tracking-wider">ຫຼັກຖານການຈ່າຍເງິນ / ສະລິບ (Payment Slip)</span>
              </div>
              {po.paymentSlip ? (
                <div className="h-52 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center">
                  <img src={po.paymentSlip} alt="Payment Slip" className="w-full h-full object-contain rounded-lg" />
                </div>
              ) : (
                <div className="h-52 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">
                  <Receipt className="w-8 h-8 mb-1 text-slate-300" />
                  <span>ບໍ່ມີສະລິບການຈ່າຍເງິນ (No Payment Slip)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions Footer (Delete & Edit buttons) */}
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
          <span>ແກ້ໄຂຂໍ້ມູນ (Edit Info)</span>
        </button>
      </div>

      {/* Edit Inbound Modal */}
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



