import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Save, Upload } from 'lucide-react';

export default function InboundEditForm({ initialData, onSave, onCancel }) {
  const [materialType, setMaterialType] = useState(initialData?.materialType || initialData?.categoryType || 'Paper');
  const [itemName, setItemName] = useState(initialData?.itemName || initialData?.name || '');
  const [paperSpec, setPaperSpec] = useState(initialData?.paperSpec || 'Inkjet Paper');
  const [supplierName, setSupplierName] = useState(initialData?.supplierName || '');
  const [supplierContact, setSupplierContact] = useState(initialData?.supplierContact || '');
  const [qty, setQty] = useState(initialData?.qty || 1);
  const [unitPrice, setUnitPrice] = useState(
    initialData?.unitPrice || (initialData?.qty ? (initialData?.totalCost || initialData?.totalPrice || 0) / initialData.qty : 0)
  );
  const [totalCost, setTotalCost] = useState(initialData?.totalCost || initialData?.totalPrice || 0);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);

  // Dual Image states
  const [itemPhoto, setItemPhoto] = useState(initialData?.itemPhoto || null);
  const [paymentSlip, setPaymentSlip] = useState(initialData?.paymentSlip || null);

  const handleFileUpload = (e, setter) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleQtyChange = (val) => {
    const q = Number(val);
    setQty(q);
    setTotalCost(q * unitPrice);
  };

  const handleUnitPriceChange = (val) => {
    const p = Number(val);
    setUnitPrice(p);
    setTotalCost(qty * p);
  };

  const handleTotalCostChange = (val) => {
    const t = Number(val);
    setTotalCost(t);
    if (qty > 0) setUnitPrice(t / qty);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...initialData,
      materialType,
      itemName,
      name: itemName,
      paperSpec: materialType === 'Paper' ? paperSpec : undefined,
      supplierName,
      supplierContact,
      qty: Number(qty),
      unitPrice: Number(unitPrice),
      totalCost: Number(totalCost),
      totalPrice: Number(totalCost),
      date,
      itemPhoto,
      paymentSlip
    });
  };

  const modalContent = (
    <div 
      onClick={onCancel}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-base font-black text-slate-900">
            ແກ້ໄຂຂໍ້ມູນ PO #{initialData?.poId || initialData?.id}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold overflow-y-auto">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-700 block">1. ໝວດວັດສະດຸ (Category)</label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 font-bold"
              >
                <option value="Paper">ເຈ້ຍ (Paper Stock)</option>
                <option value="Ink">ໝຶກພິມ (Ink Stock)</option>
                <option value="Film">ຟິມເຄືອບ (Lamination Film)</option>
                <option value="Chemical">ເຄມີພັນ (Chemicals)</option>
              </select>
            </div>

            {materialType === 'Paper' && (
              <div className="space-y-1.5">
                <label className="text-slate-700 block">3. ປະເພດເຈ້ຍ (Paper Spec)</label>
                <select
                  value={paperSpec}
                  onChange={(e) => setPaperSpec(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 font-bold"
                >
                  <option value="Inkjet Paper">ເຈ້ຍອິງເຈັດ (Inkjet Paper)</option>
                  <option value="Laser Paper">ເຈ້ຍເລເຊີ (Laser Paper)</option>
                  <option value="Sticker Paper">ເຈ້ຍສະຕິກເກີ (Sticker Paper)</option>
                  <option value="Art Card Paper">ເຈ້ຍອາດກາດ (Art Card)</option>
                  <option value="Bond Paper">ເຈ້ຍປອນ (Bond Paper)</option>
                </select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 block">
              2. ຊື່ລາຍການ (Item Name) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-700 block">4. ລາຄາຕໍ່ໜ່ວຍ (Unit Price)</label>
              <input
                type="number"
                min="0"
                value={unitPrice}
                onChange={(e) => handleUnitPriceChange(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white font-mono text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 block">5. ຈຳນວນ (Qty) *</label>
              <input
                type="number"
                min="1"
                required
                value={qty}
                onChange={(e) => handleQtyChange(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white font-mono text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-700 block">6. ຊື່ຜູ້ສະໜອງ (Supplier)</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 block">7. ເບີໂທ / ລີ້ງ (Optional Contact)</label>
              <input
                type="text"
                value={supplierContact}
                onChange={(e) => setSupplierContact(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Dual Image Uploaders */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-slate-700 block">ຮູບພາບສິນຄ້າ (Item Photo)</label>
              {itemPhoto ? (
                <div className="relative h-24 border rounded-xl overflow-hidden bg-slate-50">
                  <img src={itemPhoto} alt="Item" className="w-full h-full object-contain" />
                  <button type="button" onClick={() => setItemPhoto(null)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-[10px]">✕</button>
                </div>
              ) : (
                <label className="cursor-pointer border-2 border-dashed rounded-xl h-24 flex flex-col items-center justify-center text-slate-400 hover:border-sky-500">
                  <Upload className="w-4 h-4" />
                  <span className="text-[10px] mt-1">Upload Photo</span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setItemPhoto)} className="hidden" />
                </label>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 block">ສະລິບ (Payment Slip)</label>
              {paymentSlip ? (
                <div className="relative h-24 border rounded-xl overflow-hidden bg-slate-50">
                  <img src={paymentSlip} alt="Slip" className="w-full h-full object-contain" />
                  <button type="button" onClick={() => setPaymentSlip(null)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-[10px]">✕</button>
                </div>
              ) : (
                <label className="cursor-pointer border-2 border-dashed rounded-xl h-24 flex flex-col items-center justify-center text-slate-400 hover:border-sky-500">
                  <Upload className="w-4 h-4" />
                  <span className="text-[10px] mt-1">Upload Slip</span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setPaymentSlip)} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border border-slate-200 rounded-2xl text-slate-700 hover:bg-slate-100 font-black text-xs transition"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-xs shadow-sm transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>ບັນທຶກ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}


