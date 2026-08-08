import React from 'react';
import { Printer, Zap, Upload, X } from 'lucide-react';
import { PREDEFINED_STANDARD_SPECS } from './BilingualFormBuilder';

export default function EquipmentInboundForm({
  machineCategory,
  handleMachineCategoryChange,
  machineName,
  setMachineName,
  purchaseCost,
  setPurchaseCost,
  lifespanYears,
  setLifespanYears,
  lifetimeCapacity,
  setLifetimeCapacity,
  supplierName,
  setSupplierName,
  supplierContact,
  setSupplierContact,
  // Printer Tech Spec States
  inkType,
  setInkType,
  printTech,
  setPrintTech,
  maxWidth,
  setMaxWidth,
  blackYieldPages,
  setBlackYieldPages,
  blackCapacityMl,
  setBlackCapacityMl,
  colorYieldPages,
  setColorYieldPages,
  colorCapacityMl,
  setColorCapacityMl,
  clickRateBW,
  setClickRateBW,
  clickRateColor,
  setClickRateColor,
  linkedInkSku,
  setLinkedInkSku,
  blackMlPerSheet,
  colorMlPerSheet,
  // Cutter / Laminator / Binder States
  cutCapacity,
  setCutCapacity,
  bladeDepreciationPerCut,
  setBladeDepreciationPerCut,
  laminationWidth,
  setLaminationWidth,
  bindingMethod,
  setBindingMethod,
  // Media Attachments
  itemPhoto,
  setItemPhoto,
  paymentSlip,
  setPaymentSlip,
  handleFileUpload,
  // Template & Custom Specs State
  activeTemplate,
  customSpecsValues,
  setCustomSpecsValues,
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

  return (
    <div className="space-y-6 animate-fade-in text-xs font-bold">
      <div className="flex items-center gap-2 border-b pb-3">
        <Printer className="w-5 h-5 text-purple-600" />
        <h4 className="font-black text-sm text-slate-900">
          {activeTemplate
            ? (lang === 'en' ? activeTemplate.nameEn : activeTemplate.nameLo)
            : 'ລາຍລະອຽດເຄື່ອງຈັກ & ອຸປະກອນ (Machinery Asset Entry)'}
        </h4>
      </div>

      {/* Row 1: Category & Name */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="block text-slate-600">ໝວດເຄື່ອງຈັກ (Equipment Category)</label>
          <select
            value={machineCategory}
            onChange={(e) => handleMachineCategoryChange(e.target.value)}
            className="w-full px-3.5 py-2.5 border rounded-xl bg-white font-bold text-xs focus:outline-none"
          >
            <option value="Printer">ເຄື່ອງພິມ (Printing Machine)</option>
            <option value="Cutter">ເຄື່ອງຕັດ (Cutting Machine)</option>
            <option value="Laminator">ເຄື່ອງເຄືອບ (Laminating Machine)</option>
            <option value="Binder">ເຄື່ອງເຂົ້າເລົ່ມ (Binding Machine)</option>
          </select>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="block text-slate-600">ຊື່ເຄື່ອງພິມ / ອຸປະກອນ (Machine Name) *</label>
          <input
            type="text"
            required
            value={machineName}
            onChange={(e) => setMachineName(e.target.value)}
            placeholder="ເຊັ່ນ: Epson EcoTank L15150, EBA 5560 Cutter..."
            className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
          />
        </div>
      </div>

      {/* Row 2: Financials & Asset Lifespan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="block text-slate-600">ລາຄາຊື້ເຄື່ອງຈັກ (Purchase Cost LAK) *</label>
          <input
            type="number"
            required
            value={purchaseCost}
            onChange={(e) => setPurchaseCost(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 border rounded-xl font-mono text-center font-bold bg-white text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-slate-600">ອາຍຸການໃຊ້ງານ (Lifespan Years) *</label>
          <input
            type="number"
            required
            min="1"
            value={lifespanYears}
            onChange={(e) => setLifespanYears(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 border rounded-xl font-mono text-center font-bold bg-white text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-slate-600">ຄວາມຈຸການພິມລວມ (Lifetime Capacity Pages) *</label>
          <input
            type="number"
            required
            value={lifetimeCapacity}
            onChange={(e) => setLifetimeCapacity(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 border rounded-xl font-mono text-center font-bold bg-white text-xs"
          />
        </div>
      </div>

      {/* Row 3: Supplier Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-slate-600">ຊື່ຜູ້ສະໜອງເຄື່ອງຈັກ (Supplier Name)</label>
          <input
            type="text"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="ເຊັ່ນ: Lao Tech Machinery Co."
            className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-slate-600">ຊ່ອງທາງຕິດຕໍ່ / ເບີໂທ (Supplier Contact)</label>
          <input
            type="text"
            value={supplierContact}
            onChange={(e) => setSupplierContact(e.target.value)}
            placeholder="ເບີໂທ ຫຼື Link ຕິດຕໍ່..."
            className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
          />
        </div>
      </div>

      {/* PRINTER TECHNICAL SPECS & INK YIELD PARAMETERS */}
      {machineCategory === 'Printer' && (
        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-purple-900 border-b border-purple-200 pb-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <h5 className="font-black text-xs uppercase tracking-wider">
              PRINTER TECHNICAL SPECS & INK YIELD PARAMETERS (ISO 5% COVERAGE)
            </h5>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-purple-800 text-[11px]">ປະເພດໝຶກ (Ink Type)</label>
              <select
                value={inkType}
                onChange={(e) => setInkType(e.target.value)}
                className="w-full px-3 py-2 border border-purple-200 rounded-xl bg-white text-xs font-bold"
              >
                <option value="Pigment">Pigment Ink</option>
                <option value="Dye">Dye Ink</option>
                <option value="Sublimation">Sublimation Ink</option>
                <option value="Eco-Solvent">Eco-Solvent Ink</option>
                <option value="UV">UV Ink</option>
                <option value="Toner">Laser Toner</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-purple-800 text-[11px]">ລະບົບພິມ (Print Tech)</label>
              <select
                value={printTech}
                onChange={(e) => setPrintTech(e.target.value)}
                className="w-full px-3 py-2 border border-purple-200 rounded-xl bg-white text-xs font-bold"
              >
                <option value="Color">Color (ສີ)</option>
                <option value="Monochrome">Monochrome (ຂາວດຳ)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-purple-800 text-[11px]">ໜ້າກວ້າງສູງສຸດ (Max Width)</label>
              <input
                type="text"
                value={maxWidth}
                onChange={(e) => setMaxWidth(e.target.value)}
                placeholder="A3+, 60cm, 1.6m..."
                className="w-full px-3 py-2 border border-purple-200 rounded-xl bg-white text-xs font-bold"
              />
            </div>
          </div>

          {/* Black & Color Ink Yield Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-white p-3 rounded-xl border border-purple-200 space-y-2">
              <span className="text-[11px] font-black text-slate-800 block border-b pb-1">
                ໝຶກດຳ (Black Ink Bottle / Cartridge Spec)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500">Yield (Pages ISO 5%)</label>
                  <input
                    type="number"
                    value={blackYieldPages}
                    onChange={(e) => setBlackYieldPages(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border rounded-lg font-mono text-center text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Volume (ml)</label>
                  <input
                    type="number"
                    value={blackCapacityMl}
                    onChange={(e) => setBlackCapacityMl(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border rounded-lg font-mono text-center text-xs font-bold"
                  />
                </div>
              </div>
              <div className="text-[10px] font-mono text-purple-700 font-bold bg-purple-50 p-1.5 rounded-lg text-center">
                Autocalc Consumption: {blackMlPerSheet.toFixed(4)} ml / sheet
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-purple-200 space-y-2">
              <span className="text-[11px] font-black text-purple-900 block border-b pb-1">
                ຊຸດໝຶກສີ (Color Ink Set Spec - CMY)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500">Yield (Pages ISO 5%)</label>
                  <input
                    type="number"
                    value={colorYieldPages}
                    onChange={(e) => setColorYieldPages(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border rounded-lg font-mono text-center text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Total Set Volume (ml)</label>
                  <input
                    type="number"
                    value={colorCapacityMl}
                    onChange={(e) => setColorCapacityMl(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border rounded-lg font-mono text-center text-xs font-bold"
                  />
                </div>
              </div>
              <div className="text-[10px] font-mono text-purple-700 font-bold bg-purple-50 p-1.5 rounded-lg text-center">
                Autocalc Consumption: {colorMlPerSheet.toFixed(4)} ml / sheet
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Predefined Standard Attributes from Active Template */}
      {selectedSpecs.length > 0 && (
        <div className="bg-purple-50/60 border border-purple-200 p-4 rounded-2xl space-y-3">
          <span className="text-[11px] font-black text-purple-900 uppercase block">
            {lang === 'en' ? 'Template Standard Attributes' : 'ຄຸນລັກສະນະມາດຕະຖານຕາມເທັມເພຼັດ'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {selectedSpecs.map(specId => {
              const specMeta = PREDEFINED_STANDARD_SPECS.find(s => s.id === specId);
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

      {/* Custom Field Rows from Active Template */}
      {customFields.length > 0 && (
        <div className="bg-purple-50/60 border border-purple-200 p-4 rounded-2xl space-y-3">
          <span className="text-[11px] font-black text-purple-900 uppercase block">
            {lang === 'en' ? 'Template Custom Fields' : 'ຟິວ custom ຕາມເທັມເພຼັດ'}
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

      {/* Media Attachments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
        <div className="space-y-1">
          <label className="block text-slate-600">ຮູບພາບເຄື່ອງຈັກ (Machine Photo Attachment)</label>
          {itemPhoto ? (
            <div className="relative w-full h-36 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
              <img src={itemPhoto} alt="Machine" className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={() => setItemPhoto(null)}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="w-full h-36 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition">
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="text-xs text-slate-500 font-bold">ອັບໂຫຼດຮູບເຄື່ອງຈັກ</span>
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
