import React from 'react';
import { Package, Upload, X } from 'lucide-react';
import { INITIAL_STANDARD_SPECS } from './CategoryBuilder';

export default function MaterialInboundForm({
  materialName,
  setMaterialName,
  paperSpec,
  setPaperSpec,
  materialUnitCost,
  setMaterialUnitCost,
  quantity,
  setQuantity,
  supplierName,
  setSupplierName,
  supplierContact,
  setSupplierContact,
  itemPhoto,
  setItemPhoto,
  paymentSlip,
  setPaymentSlip,
  handleFileUpload,
  // Template & Custom Specs State
  activeTemplate,
  customSpecsValues,
  setCustomSpecsValues,
  masterSpecsPool = INITIAL_STANDARD_SPECS,
  lang = 'lo'
}) {
  const updateCustomSpecValue = (fieldKey, value, labelObj) => {
    setCustomSpecsValues(prev => ({
      ...prev,
      [fieldKey]: {
        label: labelObj,
        value
      }
    }));
  };

  const selectedSpecs = activeTemplate?.selectedSpecs || [];
  const customFields = activeTemplate?.customFields || [];
  const isPaperCategory = (activeTemplate?.nameEn || activeTemplate?.nameLo || '').toLowerCase().includes('paper');

  return (
    <div className="space-y-4 animate-fade-in text-xs font-bold">
      <div className="flex items-center gap-2 border-b pb-3">
        <Package className="w-5 h-5 text-sky-600" />
        <h4 className="font-black text-sm text-slate-900">
          {activeTemplate
            ? (lang === 'en' ? activeTemplate.nameEn : activeTemplate.nameLo)
            : (lang === 'en' ? 'Material Details Entry' : 'ລາຍລະອຽດວັດສະດຸ')}
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Item Name */}
        <div className={`space-y-1 ${isPaperCategory ? 'sm:col-span-2' : 'sm:col-span-3'}`}>
          <label className="block text-slate-600">
            {lang === 'en' ? '1. Material Item Name *' : '1. ຊື່ລາຍການວັດສະດຸ *'}
          </label>
          <input
            type="text"
            required
            value={materialName}
            onChange={(e) => setMaterialName(e.target.value)}
            placeholder={lang === 'en' ? 'e.g. A4 Paper 80gsm, Black Ink Konica...' : 'ເຊັ່ນ: ເຈ້ຍ A4 Double A 80gsm, ໝຶກສີດຳ...'}
            className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
          />
        </div>

        {/* Paper Type Spec (Rendered ONLY if Paper Category) */}
        {isPaperCategory && (
          <div className="space-y-1">
            <label className="block text-slate-600">
              {lang === 'en' ? '2. Paper Spec' : '2. ປະເພດເຈ້ຍ'}
            </label>
            <select
              value={paperSpec}
              onChange={(e) => setPaperSpec(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl bg-white font-bold text-xs focus:outline-none"
            >
              <option value="Inkjet Paper">Inkjet Paper</option>
              <option value="Laser Paper">Laser Paper</option>
              <option value="Sticker Paper">Sticker Paper</option>
              <option value="Art Card Paper">Art Card Paper</option>
              <option value="Bond Paper">Bond Paper</option>
            </select>
          </div>
        )}
      </div>

      {/* Financials & Supplier Details */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="block text-slate-600">
            {lang === 'en' ? 'Unit Price (LAK) *' : 'ລາຄາຊື້ຕໍ່ໜ່ວຍ (LAK) *'}
          </label>
          <input
            type="number"
            required
            value={materialUnitCost}
            onChange={(e) => setMaterialUnitCost(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 border rounded-xl font-mono text-center font-bold bg-white text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-slate-600">
            {lang === 'en' ? 'Inbound Qty *' : 'ຈຳນວນນຳເຂົ້າ *'}
          </label>
          <input
            type="number"
            required
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 border rounded-xl font-mono text-center font-bold bg-white text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-slate-600">
            {lang === 'en' ? 'Supplier Name' : 'ຊື່ຜູ້ສະໜອງ'}
          </label>
          <input
            type="text"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="e.g. Vientiane Supply Co."
            className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-slate-600">
            {lang === 'en' ? 'Supplier Contact (Optional)' : 'ຊ່ອງທາງຕິດຕໍ່ / ເບີໂທ'}
          </label>
          <input
            type="text"
            value={supplierContact}
            onChange={(e) => setSupplierContact(e.target.value)}
            placeholder="WhatsApp, Phone..."
            className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
          />
        </div>
      </div>

      {/* Dynamic Render: Selected Pool Attributes for Category */}
      {selectedSpecs.length > 0 && (
        <div className="bg-sky-50/60 border border-sky-200 p-4 rounded-2xl space-y-3">
          <span className="text-[11px] font-black text-sky-900 uppercase block">
            {lang === 'en' ? 'Category Selected Attributes' : 'ຄຸນລັກສະນະມາດຕະຖານຕາມໝວດ'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {selectedSpecs.map(specId => {
              const specMeta = masterSpecsPool.find(s => s.id === specId);
              if (!specMeta) return null;
              const labelText = lang === 'en' ? specMeta.nameEn : specMeta.nameLo;

              return (
                <div key={specId} className="space-y-1">
                  <label className="block text-slate-600">{labelText}</label>
                  <input
                    type="text"
                    value={customSpecsValues?.[specId]?.value || ''}
                    onChange={(e) => updateCustomSpecValue(specId, e.target.value, { lo: specMeta.nameLo, en: specMeta.nameEn })}
                    placeholder={`Enter ${labelText}...`}
                    className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-bold"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic Render: Custom Field Rows for Category */}
      {customFields.length > 0 && (
        <div className="bg-purple-50/60 border border-purple-200 p-4 rounded-2xl space-y-3">
          <span className="text-[11px] font-black text-purple-900 uppercase block">
            {lang === 'en' ? 'Category Custom Fields' : 'ຟິວ custom ຕາມໝວດ'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {customFields.map(field => {
              const labelText = lang === 'en' ? (field.labelEn || field.labelLo) : (field.labelLo || field.labelEn);
              const fieldVal = customSpecsValues?.[field.id]?.value || '';

              return (
                <div key={field.id} className="space-y-1">
                  <label className="block text-slate-700">
                    {labelText} {field.required ? '*' : ''}
                  </label>
                  <input
                    type={field.type === 'Number' ? 'number' : field.type === 'Date' ? 'date' : 'text'}
                    required={field.required}
                    value={fieldVal}
                    onChange={(e) => updateCustomSpecValue(field.id, e.target.value, { lo: field.labelLo, en: field.labelEn })}
                    placeholder={`Enter ${labelText}...`}
                    className="w-full px-3.5 py-2 border rounded-xl bg-white text-xs font-bold"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attachments Upload Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
        <div className="space-y-1">
          <label className="block text-slate-600">
            {lang === 'en' ? 'Item Photo Attachment' : 'ຮູບພາບສິນຄ້າ'}
          </label>
          {itemPhoto ? (
            <div className="relative w-full h-36 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
              <img src={itemPhoto} alt="Item" className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={() => setItemPhoto(null)}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="w-full h-36 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-sky-400 hover:bg-sky-50/50 transition">
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="text-xs text-slate-500 font-bold">{lang === 'en' ? 'Upload Item Photo' : 'ອັບໂຫຼດຮູບສິນຄ້າ'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setItemPhoto)}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-slate-600">
            {lang === 'en' ? 'Payment Slip Attachment' : 'ຫຼັກຖານການຈ່າຍເງິນ'}
          </label>
          {paymentSlip ? (
            <div className="relative w-full h-36 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
              <img src={paymentSlip} alt="Payment Slip" className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={() => setPaymentSlip(null)}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="w-full h-36 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition">
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="text-xs text-slate-500 font-bold">{lang === 'en' ? 'Upload Payment Slip' : 'ອັບໂຫຼດສະລິບການຈ່າຍເງິນ'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setPaymentSlip)}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
