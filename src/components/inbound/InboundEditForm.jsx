import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Save, Upload, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { resolveBilingualLabel, formatValue } from './details/UniversalFieldRenderer';

export default function InboundEditForm({ initialData, onSave, onCancel }) {
  const { i18n } = useTranslation();
  const currentLang = i18n?.language || 'lo';

  // Base Top-Level State
  const [formData, setFormData] = useState({
    itemName: initialData?.itemName || initialData?.name || initialData?.machineName || '',
    category: initialData?.category || initialData?.materialType || initialData?.itemType || initialData?.machineCategory || '',
    unitPrice: initialData?.unitPrice || initialData?.costPerUnit || initialData?.purchaseCost || 0,
    qty: initialData?.qty || initialData?.quantity || 1,
    supplierName: initialData?.supplierName || '',
    supplierContact: initialData?.supplierContact || initialData?.note || ''
  });

  // Photo & Slip State
  const [itemPhoto, setItemPhoto] = useState(initialData?.itemPhoto || initialData?.imageUrl || null);

  // Dynamic customSpecs state map
  const [customSpecsState, setCustomSpecsState] = useState(() => {
    const specs = initialData?.customSpecs || {};
    const result = {};
    Object.entries(specs).forEach(([k, v]) => {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        result[k] = { label: v.label, value: v.value };
      } else {
        result[k] = { label: { lo: k, en: k }, value: v };
      }
    });
    return result;
  });

  const handleFileUpload = (e, setter) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCustomSpecChange = (key, val) => {
    setCustomSpecsState(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value: val
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const updatedUnitPrice = Number(formData.unitPrice);
    const updatedQty = Number(formData.qty);
    const updatedTotalCost = updatedUnitPrice * updatedQty;

    onSave({
      ...initialData,
      itemName: formData.itemName,
      name: formData.itemName,
      machineName: formData.itemName,
      category: formData.category,
      materialType: formData.category,
      itemType: formData.category,
      machineCategory: formData.category,
      unitPrice: updatedUnitPrice,
      costPerUnit: updatedUnitPrice,
      purchaseCost: updatedUnitPrice,
      qty: updatedQty,
      quantity: updatedQty,
      totalCost: updatedTotalCost,
      totalPrice: updatedTotalCost,
      supplierName: formData.supplierName,
      supplierContact: formData.supplierContact,
      itemPhoto,
      customSpecs: customSpecsState
    });
  };

  const modalContent = (
    <div 
      onClick={onCancel}
      className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-black text-slate-900">
              {currentLang === 'en' ? 'Form-Driven Inbound Editor' : 'ແກ້ໄຂຂໍ້ມູນການນຳເຂົ້າ'}
            </h2>
            <p className="text-[11px] text-slate-400 font-bold">
              PO #{initialData?.poId || initialData?.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Universal N-Loop Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs font-bold overflow-y-auto">
          {/* Read-Only Locked Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>PO ID (Locked)</span>
              </span>
              <p className="font-mono font-black text-slate-800 text-xs">
                {initialData?.poId || initialData?.id}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Payment Slip Status (Locked)</span>
              </span>
              <p className="font-mono font-black text-emerald-700 text-xs">
                {initialData?.paymentSlip ? 'Uploaded & Locked' : 'No Slip Attached'}
              </p>
            </div>
          </div>

          {/* Core Editable Form Fields */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {currentLang === 'en' ? 'Core Inbound Parameters' : 'ຂໍ້ມູນຫຼັກການນຳເຂົ້າ'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-700 block">
                  {currentLang === 'en' ? 'Item / Machine Name *' : 'ຊື່ລາຍການ / ອຸປະກອນ *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemName}
                  onChange={(e) => setFormData(prev => ({ ...prev, itemName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 block">
                  {currentLang === 'en' ? 'Category / Type' : 'ໝວດ / ປະເພດ'}
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-700 block">
                  {currentLang === 'en' ? 'Unit Price (LAK)' : 'ລາຄາຕໍ່ໜ່ວຍ'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white font-mono text-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 block">
                  {currentLang === 'en' ? 'Quantity *' : 'ຈຳນວນນຳເຂົ້າ *'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.qty}
                  onChange={(e) => setFormData(prev => ({ ...prev, qty: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white font-mono text-slate-900 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-700 block">
                  {currentLang === 'en' ? 'Supplier Name' : 'ຊື່ຜູ້ສະໜອງ'}
                </label>
                <input
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 block">
                  {currentLang === 'en' ? 'Supplier Contact / Note' : 'ຊ່ອງທາງຕິດຕໍ່ / ໝາຍເຫດ'}
                </label>
                <input
                  type="text"
                  value={formData.supplierContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierContact: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Dynamic N-Loop Custom Specs Form Fields */}
          {Object.keys(customSpecsState).length > 0 && (
            <div className="space-y-3 bg-purple-50/60 border border-purple-200 p-4 rounded-2xl">
              <h3 className="text-xs font-black text-purple-950 uppercase tracking-wider">
                {currentLang === 'en' ? 'Dynamic Custom Specifications' : 'ຄຸນລັກສະນະ Custom ທີບັນທຶກ'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(customSpecsState).map(([specKey, specObj]) => {
                  const labelObj = specObj?.label;
                  const labelText = typeof labelObj === 'object' && labelObj !== null
                    ? (currentLang === 'en' ? (labelObj.en || labelObj.lo) : (labelObj.lo || labelObj.en))
                    : resolveBilingualLabel(specKey, currentLang);

                  return (
                    <div key={specKey} className="space-y-1">
                      <label className="text-purple-900 block">{labelText}</label>
                      <input
                        type="text"
                        value={specObj?.value || ''}
                        onChange={(e) => handleCustomSpecChange(specKey, e.target.value)}
                        className="w-full px-3.5 py-2 border border-purple-200 rounded-xl bg-white text-slate-900 font-bold text-xs"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Item Photo Re-uploader */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <label className="text-slate-700 block">
              {currentLang === 'en' ? 'Item Photo (Editable)' : 'ຮູບພາບສິນຄ້າ / ເຄື່ອງຈັກ'}
            </label>
            {itemPhoto ? (
              <div className="relative h-28 border rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center">
                <img src={itemPhoto} alt="Item" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => setItemPhoto(null)}
                  className="absolute top-1.5 right-1.5 bg-red-600 text-white p-1 rounded-full text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="cursor-pointer border-2 border-dashed rounded-xl h-24 flex flex-col items-center justify-center text-slate-400 hover:border-sky-500 hover:bg-sky-50/50 transition">
                <Upload className="w-4 h-4" />
                <span className="text-[10px] font-bold mt-1">
                  {currentLang === 'en' ? 'Upload New Photo' : 'ອັບໂຫຼດຮູບພາບໃໝ່'}
                </span>
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setItemPhoto)} className="hidden" />
              </label>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border border-slate-200 rounded-2xl text-slate-700 hover:bg-slate-100 font-black text-xs transition"
            >
              {currentLang === 'en' ? 'Cancel' : 'ຍົກເລີກ'}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-xs shadow-sm transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{currentLang === 'en' ? 'Save Changes' : 'ບັນທຶກການແກ້ໄຂ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
