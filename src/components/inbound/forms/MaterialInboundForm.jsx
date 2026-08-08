import React from 'react';
import { Package, Upload, X } from 'lucide-react';

export default function MaterialInboundForm({
  materialType,
  setMaterialType,
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
  handleFileUpload
}) {
  return (
    <div className="space-y-4 animate-fade-in text-xs font-bold">
      <div className="flex items-center gap-2 border-b pb-3">
        <Package className="w-5 h-5 text-sky-600" />
        <h4 className="font-black text-sm text-slate-900">ລາຍລະອຽດວັດສະດຸ (Materials & Consumables Entry)</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Material Category */}
        <div className="space-y-1">
          <label className="block text-slate-600">1. ໝວດວັດສະດຸ (Material Category)</label>
          <select
            value={materialType}
            onChange={(e) => setMaterialType(e.target.value)}
            className="w-full px-3.5 py-2.5 border rounded-xl bg-white font-bold text-xs focus:outline-none"
          >
            <option value="Paper">ເຈ້ຍ (Paper Stock)</option>
            <option value="Ink">ໝຶກພິມ (Ink Bottles/Cartridges)</option>
            <option value="Film">ຟິມເຄືອບ (Lamination Film)</option>
            <option value="Chemical">ເຄມີພັນ (Chemicals & Consumables)</option>
          </select>
        </div>

        {/* 2. Item Name */}
        <div className={`space-y-1 ${materialType === 'Paper' ? '' : 'sm:col-span-2'}`}>
          <label className="block text-slate-600">2. ຊື່ລາຍການວັດສະດຸ (Material Item Name) *</label>
          <input
            type="text"
            required
            value={materialName}
            onChange={(e) => setMaterialName(e.target.value)}
            placeholder="ເຊັ່ນ: ເຈ້ຍ A4 Double A 80gsm, ໝຶກສີດຳ Konica C6085..."
            className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
          />
        </div>

        {/* 3. Paper Type Spec (For Paper Only) */}
        {materialType === 'Paper' && (
          <div className="space-y-1">
            <label className="block text-slate-600">3. ປະເພດເຈ້ຍ (Paper Type Spec)</label>
            <select
              value={paperSpec}
              onChange={(e) => setPaperSpec(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl bg-white font-bold text-xs focus:outline-none"
            >
              <option value="Inkjet Paper">ເຈ້ຍອິງເຈັດ (Inkjet Paper)</option>
              <option value="Laser Paper">ເຈ້ຍເລເຊີ (Laser Paper)</option>
              <option value="Sticker Paper">ເຈ້ຍສະຕິກເກີ (Sticker Paper)</option>
              <option value="Art Card Paper">ເຈ້ຍອາດກາດ / Art Card</option>
              <option value="Bond Paper">ເຈ້ຍປອນ / Bond Paper</option>
            </select>
          </div>
        )}
      </div>

      {/* Row 2: Financials & Supplier Details */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="block text-slate-600">4. ລາຄາຊື້ຕໍ່ໜ່ວຍ (Unit Price LAK) *</label>
          <input
            type="number"
            required
            value={materialUnitCost}
            onChange={(e) => setMaterialUnitCost(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 border rounded-xl font-mono text-center font-bold bg-white text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-slate-600">5. ຈຳນວນນຳເຂົ້າ (Inbound Qty) *</label>
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
          <label className="block text-slate-600">6. ຊື່ຜູ້ສະໜອງ (Supplier Name)</label>
          <input
            type="text"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="ເຊັ່ນ: Vientiane Supply Co."
            className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-slate-600">7. ຊ່ອງທາງຕິດຕໍ່ / ເບີໂທ / ລີ້ງ (Optional)</label>
          <input
            type="text"
            value={supplierContact}
            onChange={(e) => setSupplierContact(e.target.value)}
            placeholder="ເບີໂທ, WhatsApp ຫຼື Link..."
            className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
          />
        </div>
      </div>

      {/* Attachments Upload Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
        <div className="space-y-1">
          <label className="block text-slate-600">ຮູບພາບສິນຄ້າ (Item Photo Attachment)</label>
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
              <span className="text-xs text-slate-500 font-bold">ອັບໂຫຼດຮູບສິນຄ້າ</span>
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
          <label className="block text-slate-600">ຫຼັກຖານການຈ່າຍເງິນ (Payment Slip Attachment)</label>
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
              <span className="text-xs text-slate-500 font-bold">ອັບໂຫຼດສະລິບການຈ່າຍເງິນ</span>
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
