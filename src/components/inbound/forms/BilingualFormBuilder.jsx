import React, { useState } from 'react';
import { Plus, Trash2, CheckSquare, Layers, FileText } from 'lucide-react';

export const PREDEFINED_STANDARD_SPECS = [
  { id: 'gsm', nameLo: 'ນ້ຳໜັກເຈ້ຍ (GSM)', nameEn: 'Paper Weight (GSM)', category: 'Materials' },
  { id: 'inkVolumeMl', nameLo: 'ຄວາມຈຸໝຶກ (Bottle Volume ML)', nameEn: 'Ink Bottle Volume (ML)', category: 'Materials' },
  { id: 'rollWidthMm', nameLo: 'ໜ້າກວ້າງມ້ວນ (Roll Width mm)', nameEn: 'Roll Width (mm)', category: 'Materials' },
  { id: 'yieldPages', nameLo: 'ຈຳນວນແຜ່ນທີ່ພິມໄດ້ (Yield Pages)', nameEn: 'Estimated Yield (Pages)', category: 'Materials' },
  { id: 'powerRatingKw', nameLo: 'ກຳລັງໄຟຟ້າ (Power Rating kW)', nameEn: 'Power Rating (kW)', category: 'Machinery' },
  { id: 'maxSpeedPph', nameLo: 'ຄວາມໄວສູງສຸດ (Max Speed PPH)', nameEn: 'Max Speed (PPH)', category: 'Machinery' },
];

export const INITIAL_PRESET_TEMPLATES = [
  {
    id: 'tpl-paper-standard',
    nameLo: 'ຟອມນຳເຂົ້າເຈ້ຍມາດຕະຖານ',
    nameEn: 'Standard Paper Stock Form',
    categoryType: 'Materials',
    materialType: 'Paper',
    selectedSpecs: ['gsm'],
    customFields: []
  },
  {
    id: 'tpl-ink-standard',
    nameLo: 'ຟອມນຳເຂົ້າໝຶກພິມ',
    nameEn: 'Standard Printing Ink Form',
    categoryType: 'Materials',
    materialType: 'Ink',
    selectedSpecs: ['inkVolumeMl', 'yieldPages'],
    customFields: []
  },
  {
    id: 'tpl-printer-spec',
    nameLo: 'ຟອມນຳເຂົ້າເຄື່ອງພິມ Digital',
    nameEn: 'Digital Printer Equipment Form',
    categoryType: 'Machinery',
    machineCategory: 'Printer',
    selectedSpecs: ['powerRatingKw', 'maxSpeedPph'],
    customFields: []
  }
];

export default function BilingualFormBuilder({
  activeCategory,
  onSaveTemplate,
  onCancel
}) {
  const [templateNameLo, setTemplateNameLo] = useState('');
  const [templateNameEn, setTemplateNameEn] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState(['gsm']);
  const [customFields, setCustomFields] = useState([
    { id: `cf-${Date.now()}`, labelLo: 'ຄວາມໜຽວ/ຄວາມໜືດ', labelEn: 'Viscosity (cPs)', type: 'Text', required: false }
  ]);

  const toggleSpec = (specId) => {
    setSelectedSpecs(prev =>
      prev.includes(specId) ? prev.filter(id => id !== specId) : [...prev, specId]
    );
  };

  const addCustomFieldRow = () => {
    setCustomFields(prev => [
      ...prev,
      { id: `cf-${Date.now()}`, labelLo: '', labelEn: '', type: 'Text', required: false }
    ]);
  };

  const updateCustomField = (id, key, value) => {
    setCustomFields(prev =>
      prev.map(f => (f.id === id ? { ...f, [key]: value } : f))
    );
  };

  const removeCustomField = (id) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
  };

  const handleCreateTemplate = (e) => {
    e.preventDefault();
    if (!templateNameLo.trim() && !templateNameEn.trim()) return;

    const newTemplate = {
      id: `tpl-custom-${Date.now()}`,
      nameLo: templateNameLo || templateNameEn,
      nameEn: templateNameEn || templateNameLo,
      categoryType: activeCategory,
      selectedSpecs,
      customFields
    };

    onSaveTemplate(newTemplate);
  };

  return (
    <div className="bg-purple-50/60 border border-purple-200 rounded-3xl p-6 space-y-6 animate-fade-in text-xs font-bold">
      <div className="flex items-center justify-between border-b border-purple-200 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-600" />
          <h4 className="font-black text-sm text-purple-950">
            ສ້າງເທັມເພຼັດຟອມນຳເຂົ້າໃໝ່ (Create New Bilingual Form Template)
          </h4>
        </div>
      </div>

      <form onSubmit={handleCreateTemplate} className="space-y-6">
        {/* Step 2.1: Template Naming (Bilingual) */}
        <div className="space-y-2 bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
          <span className="text-[11px] font-black text-purple-900 uppercase block">
            Step 2.1: ຕັ້ງຊື່ເທັມເພຼັດຟອມ (Bilingual Template Name) *
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-slate-600">ຊື່ເທັມເພຼັດ (ພາສາລາວ / Lao)</label>
              <input
                type="text"
                required
                value={templateNameLo}
                onChange={(e) => setTemplateNameLo(e.target.value)}
                placeholder="ເຊັ່ນ: ຟອມນຳເຂົ້ານ້ຳຢາ UV"
                className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-600">Template Name (English)</label>
              <input
                type="text"
                required
                value={templateNameEn}
                onChange={(e) => setTemplateNameEn(e.target.value)}
                placeholder="e.g., UV Coating Fluid Form"
                className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Step 2.2: Standard Attribute Checkboxes */}
        <div className="space-y-2 bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
          <span className="text-[11px] font-black text-purple-900 uppercase block">
            Step 2.2: ເລືອກຄຸນລັກສະນະມາດຕະຖານ (Standard Attribute Checkboxes)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {PREDEFINED_STANDARD_SPECS.map(spec => (
              <label
                key={spec.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  selectedSpecs.includes(spec.id)
                    ? 'bg-purple-50 border-purple-500 text-purple-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSpecs.includes(spec.id)}
                  onChange={() => toggleSpec(spec.id)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <p className="font-black text-xs">{spec.nameLo}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{spec.nameEn}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Step 2.3: Custom Field Builder (Bilingual Support) */}
        <div className="space-y-3 bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-purple-900 uppercase block">
              Step 2.3: ເພີ່ມຟິວຂໍ້ມູນ custom (Custom Field Builder)
            </span>
            <button
              type="button"
              onClick={addCustomFieldRow}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>[ ➕ Add Custom Field ]</span>
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {customFields.map((field) => (
              <div key={field.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={field.labelLo}
                    onChange={(e) => updateCustomField(field.id, 'labelLo', e.target.value)}
                    placeholder="Lao Label (ເຊັ່ນ: ຄວາມໜຽວ)"
                    className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-bold"
                  />
                  <input
                    type="text"
                    required
                    value={field.labelEn}
                    onChange={(e) => updateCustomField(field.id, 'labelEn', e.target.value)}
                    placeholder="English Label (e.g. Viscosity)"
                    className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-bold"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={field.type}
                    onChange={(e) => updateCustomField(field.id, 'type', e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-white text-xs font-bold"
                  >
                    <option value="Text">Text</option>
                    <option value="Number">Number</option>
                    <option value="Date">Date</option>
                    <option value="Select">Select</option>
                  </select>

                  <label className="flex items-center gap-1.5 text-xs text-slate-600 font-bold px-2">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateCustomField(field.id, 'required', e.target.checked)}
                      className="rounded text-purple-600"
                    />
                    Required
                  </label>

                  <button
                    type="button"
                    onClick={() => removeCustomField(field.id)}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Template Creator Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
          >
            ຍົກເລີກ (Cancel)
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-xs shadow-md transition active:scale-95"
          >
            ບັນທຶກເທັມເພຼັດໃໝ່ (Save Custom Template)
          </button>
        </div>
      </form>
    </div>
  );
}
