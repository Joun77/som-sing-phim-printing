import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Save, Upload, Zap, Printer, Package } from 'lucide-react';

export default function InboundEditForm({ initialData, onSave, onCancel }) {
  const isMachineryRecord = initialData?.categoryType === 'Machinery' || initialData?.type === 'Equipment' || initialData?.itemType === 'Printer' || initialData?.itemType === 'Cutter' || initialData?.itemType === 'Laminator' || initialData?.itemType === 'Binder';

  // Category A fields
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

  // Category B Machinery & Printer fields
  const [machineCategory, setMachineCategory] = useState(initialData?.itemType || initialData?.machineCategory || 'Printer');
  const [purchaseCost, setPurchaseCost] = useState(initialData?.totalCost || initialData?.unitPrice || 0);
  const [lifespanYears, setLifespanYears] = useState(initialData?.lifespanYears || 5);
  const [printedPagesCapacity, setPrintedPagesCapacity] = useState(initialData?.printedPagesCapacity || 500000);
  
  // Printer Tech Specs
  const [inkType, setInkType] = useState(initialData?.inkType || 'Pigment');
  const [linkedInkSku, setLinkedInkSku] = useState(initialData?.linkedInkSku || '');
  const [blackYieldPages, setBlackYieldPages] = useState(initialData?.blackYieldPages || 6000);
  const [blackCapacityMl, setBlackCapacityMl] = useState(initialData?.blackCapacityMl || 127);
  const [colorYieldPages, setColorYieldPages] = useState(initialData?.colorYieldPages || 6000);
  const [colorCapacityMl, setColorCapacityMl] = useState(initialData?.colorCapacityMl || 210);

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isMachineryRecord) {
      const blackMlPerSheet = blackYieldPages > 0 ? Number(blackCapacityMl) / Number(blackYieldPages) : 0.0169;
      const colorMlPerSheet = colorYieldPages > 0 ? Number(colorCapacityMl) / Number(colorYieldPages) : 0.035;

      onSave({
        ...initialData,
        itemName,
        name: itemName,
        itemType: machineCategory,
        machineCategory,
        supplierName,
        supplierContact,
        unitPrice: Number(purchaseCost),
        totalCost: Number(purchaseCost),
        totalPrice: Number(purchaseCost),
        lifespanYears: Number(lifespanYears),
        printedPagesCapacity: Number(printedPagesCapacity),
        inkType,
        linkedInkSku,
        blackYieldPages: Number(blackYieldPages),
        blackCapacityMl: Number(blackCapacityMl),
        colorYieldPages: Number(colorYieldPages),
        colorCapacityMl: Number(colorCapacityMl),
        blackMlPerSheet,
        colorMlPerSheet,
        itemPhoto,
        paymentSlip
      });
    } else {
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
        itemPhoto,
        paymentSlip
      });
    }
  };

  const modalContent = (
    <div 
      onClick={onCancel}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in font-sans"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col"
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
          {!isMachineryRecord ? (
            /* CATEGORY A EDIT FIELDS */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-700 block">1. ໝວດວັດສະດຸ</label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 font-bold"
                  >
                    <option value="Paper">ເຈ້ຍ</option>
                    <option value="Ink">ໝຶກພິມ</option>
                    <option value="Film">ຟິມເຄືອບ</option>
                    <option value="Chemical">ເຄມີພັນ</option>
                  </select>
                </div>

                {materialType === 'Paper' && (
                  <div className="space-y-1.5">
                    <label className="text-slate-700 block">3. ປະເພດເຈ້ຍ (Paper Spec)</label>
                    <input
                      type="text"
                      value={paperSpec}
                      onChange={(e) => setPaperSpec(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 block">2. ຊື່ລາຍການ *</label>
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
                  <label className="text-slate-700 block">4. ລາຄາຕໍ່ໜ່ວຍ</label>
                  <input
                    type="number"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => handleUnitPriceChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white font-mono text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 block">5. ຈຳນວນ *</label>
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
                  <label className="text-slate-700 block">6. ຊື່ຜູ້ສະໜອງ</label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 block">7. ເບີໂທ / ລີ້ງ (Optional)</label>
                  <input
                    type="text"
                    value={supplierContact}
                    onChange={(e) => setSupplierContact(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* CATEGORY B MACHINERY & PRINTER SPECS EDIT FIELDS */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-700 block">1. ໝວດເຄື່ອງຈັກ</label>
                  <select
                    value={machineCategory}
                    onChange={(e) => setMachineCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 font-bold"
                  >
                    <option value="Printer">ເຄື່ອງພິມ</option>
                    <option value="Cutter">ເຄື່ອງຕັດ</option>
                    <option value="Laminator">ເຄື່ອງເຄືອບ</option>
                    <option value="Binder">ເຄື່ອງເຂົ້າເລົ່ມ</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 block">2. ຊື່ເຄື່ອງຈັກ *</label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-700 block">3. ລາຄາຈັດຊື້ (LAK)</label>
                  <input
                    type="number"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 block">4. ອາຍຸໃຊ້ງານ (ປີ)</label>
                  <input
                    type="number"
                    value={lifespanYears}
                    onChange={(e) => setLifespanYears(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 block">5. ຄວາມຈຸແຜ່ນພິມ</label>
                  <input
                    type="number"
                    value={printedPagesCapacity}
                    onChange={(e) => setPrintedPagesCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-700 block">6. ຊື່ຜູ້ສະໜອງ</label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 block">7. ເບີໂທ / ຊ່ອງທາງຕິດຕໍ່</label>
                  <input
                    type="text"
                    value={supplierContact}
                    onChange={(e) => setSupplierContact(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900"
                  />
                </div>
              </div>

              {/* Printer Special Technical Yield Parameters */}
              {machineCategory === 'Printer' && (
                <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-2xl space-y-3">
                  <span className="text-[11px] font-black text-purple-900 uppercase tracking-wider block flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span>Printer Technical Specs & Ink Yield Rates</span>
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-600 block">ຊະນິດໝຶກ</label>
                      <select
                        value={inkType}
                        onChange={(e) => setInkType(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white font-bold text-xs"
                      >
                        <option value="Pigment">Pigment Ink</option>
                        <option value="Dye">Dye Ink</option>
                        <option value="Laser">Laser Toner</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-600 block">Linked Ink SKU</label>
                      <input
                        type="text"
                        value={linkedInkSku}
                        onChange={(e) => setLinkedInkSku(e.target.value)}
                        placeholder="e.g. INK-EP-001"
                        className="w-full px-3 py-2 border rounded-xl bg-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-purple-200/60">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-700 block">Black Ink (Yield / ml):</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="number"
                          value={blackYieldPages}
                          onChange={(e) => setBlackYieldPages(Number(e.target.value))}
                          placeholder="Pages"
                          className="px-2 py-1.5 border rounded-lg font-mono text-center"
                        />
                        <input
                          type="number"
                          value={blackCapacityMl}
                          onChange={(e) => setBlackCapacityMl(Number(e.target.value))}
                          placeholder="ml"
                          className="px-2 py-1.5 border rounded-lg font-mono text-center"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-purple-800 block">Color Ink (Yield / ml):</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="number"
                          value={colorYieldPages}
                          onChange={(e) => setColorYieldPages(Number(e.target.value))}
                          placeholder="Pages"
                          className="px-2 py-1.5 border rounded-lg font-mono text-center"
                        />
                        <input
                          type="number"
                          value={colorCapacityMl}
                          onChange={(e) => setColorCapacityMl(Number(e.target.value))}
                          placeholder="ml"
                          className="px-2 py-1.5 border rounded-lg font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dual Image Uploaders */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-slate-700 block">ຮູບພາບສິນຄ້າ / ເຄື່ອງຈັກ</label>
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
              <label className="text-slate-700 block">ສະລິບການຈ່າຍເງິນ</label>
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


