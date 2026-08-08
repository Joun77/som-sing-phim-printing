import React, { useState } from 'react';
import { Plus, Trash2, Layers, Boxes, Printer } from 'lucide-react';

export const INITIAL_STANDARD_SPECS = [
  { id: 'gsm', nameLo: 'ນ້ຳໜັກເຈ້ຍ (GSM)', nameEn: 'Paper Weight (GSM)', category: 'Materials', isCustom: false },
  { id: 'inkVolumeMl', nameLo: 'ຄວາມຈຸໝຶກ (Bottle Volume ML)', nameEn: 'Ink Bottle Volume (ML)', category: 'Materials', isCustom: false },
  { id: 'rollWidthMm', nameLo: 'ໜ້າກວ້າງມ້ວນ (Roll Width mm)', nameEn: 'Roll Width (mm)', category: 'Materials', isCustom: false },
  { id: 'yieldPages', nameLo: 'ຈຳນວນແຜ່ນທີ່ພິມໄດ້ (Yield Pages)', nameEn: 'Estimated Yield (Pages)', category: 'Materials', isCustom: false },
  { id: 'powerRatingKw', nameLo: 'ກຳລັງໄຟຟ້າ (Power Rating kW)', nameEn: 'Power Rating (kW)', category: 'Machinery', isCustom: false },
  { id: 'maxSpeedPph', nameLo: 'ຄວາມໄວສູງສຸດ (Max Speed PPH)', nameEn: 'Max Speed (PPH)', category: 'Machinery', isCustom: false },
  { id: 'cutCapacity', nameLo: 'ຄວາມຈຸຕັດ (Cut Capacity)', nameEn: 'Cut Capacity (Sheets)', category: 'Machinery', isCustom: false },
  { id: 'linkedInkSku', nameLo: 'ລະຫັດໝຶກໃນຄັງ (Linked Ink SKU)', nameEn: 'Linked Ink SKU', category: 'Machinery', isCustom: false },
];

export const INITIAL_PRESET_CATEGORIES = [
  {
    id: 'cat-paper',
    nameLo: 'ເຈ້ຍ (Paper Stock)',
    nameEn: 'Paper Stock',
    targetSection: 'Materials',
    selectedSpecs: ['gsm'],
    customFields: []
  },
  {
    id: 'cat-ink',
    nameLo: 'ໝຶກພິມ (Ink / Toner)',
    nameEn: 'Ink & Toner',
    targetSection: 'Materials',
    selectedSpecs: ['inkVolumeMl', 'yieldPages'],
    customFields: []
  },
  {
    id: 'cat-film',
    nameLo: 'ຟິມເຄືອບ / ມ້ວນ (Film & Roll)',
    nameEn: 'Film & Roll Stock',
    targetSection: 'Materials',
    selectedSpecs: ['rollWidthMm'],
    customFields: []
  },
  {
    id: 'cat-printer',
    nameLo: 'ເຄື່ອງພິມ (Printing Machine)',
    nameEn: 'Printer Equipment',
    targetSection: 'Machinery',
    selectedSpecs: ['powerRatingKw', 'maxSpeedPph', 'linkedInkSku'],
    customFields: []
  },
  {
    id: 'cat-cutter',
    nameLo: 'ເຄື່ອງຕັດ (Cutting Machine)',
    nameEn: 'Cutter Equipment',
    targetSection: 'Machinery',
    selectedSpecs: ['cutCapacity', 'powerRatingKw'],
    customFields: []
  }
];

export default function CategoryBuilder({
  initialTargetSection = 'Materials',
  masterSpecsPool,
  onDeleteSpecFromPool,
  onSaveCategory,
  onCancel,
  lang = 'lo'
}) {
  const [targetSection, setTargetSection] = useState(initialTargetSection);
  const [nameLo, setNameLo] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState([]);
  const [customFields, setCustomFields] = useState([]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nameLo.trim() && !nameEn.trim()) return;

    const newCat = {
      id: `cat-custom-${Date.now()}`,
      nameLo: nameLo || nameEn,
      nameEn: nameEn || nameLo,
      targetSection,
      selectedSpecs,
      customFields
    };

    onSaveCategory(newCat);
  };

  return (
    <div className="bg-purple-50/70 border border-purple-200 rounded-3xl p-6 space-y-6 animate-fade-in text-xs font-bold shadow-sm">
      <div className="flex items-center justify-between border-b border-purple-200 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-600" />
          <h4 className="font-black text-sm text-purple-950">
            {lang === 'en' ? 'Create New Category / Machine Type' : 'ເພີ່ມໝວດ / ປະເພດເຄື່ອງຈັກໃໝ່ (Category Builder)'}
          </h4>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 2.1: Target Section Filter Selector */}
        <div className="space-y-2 bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
          <span className="text-[11px] font-black text-purple-900 uppercase block">
            Step 2.1: ເລືອກໝວດຫຼັກ (Target Section Assignment) *
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTargetSection('Materials')}
              className={`p-4 rounded-xl border text-left flex items-center gap-3 transition ${
                targetSection === 'Materials'
                  ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-500/20 text-sky-950 font-black'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="p-2 bg-sky-500 text-white rounded-lg">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-black">🟢 Category A: ວັດສະດຸ (Materials & Supplies)</span>
                <span className="text-[10px] text-slate-500 font-semibold">Inventory stock items, paper, ink, film</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTargetSection('Machinery')}
              className={`p-4 rounded-xl border text-left flex items-center gap-3 transition ${
                targetSection === 'Machinery'
                  ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 text-purple-950 font-black'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="p-2 bg-purple-600 text-white rounded-lg">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-black">🟣 Category B: ເຄື່ອງຈັກ (Machinery & Assets)</span>
                <span className="text-[10px] text-slate-500 font-semibold">Equipment directory assets, printers, cutters</span>
              </div>
            </button>
          </div>
        </div>

        {/* Step 2.2: Bilingual Category Naming */}
        <div className="space-y-2 bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
          <span className="text-[11px] font-black text-purple-900 uppercase block">
            Step 2.2: ຕັ້ງຊື່ໝວດ / ປະເພດໃໝ່ (Bilingual Category Name) *
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-slate-600">ຊື່ໝວດ (ພາສາລາວ / Lao)</label>
              <input
                type="text"
                required
                value={nameLo}
                onChange={(e) => setNameLo(e.target.value)}
                placeholder="ເຊັ່ນ: ນ້ຳຢາ UV ເຄືອບເງົາ"
                className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-600">Category Name (English)</label>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g., UV Coating Fluid"
                className="w-full px-3.5 py-2.5 border rounded-xl font-bold bg-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Step 2.3: Select Standard Attribute & Custom Recycled Checkboxes with Delete Option */}
        <div className="space-y-2 bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
          <span className="text-[11px] font-black text-purple-900 uppercase block">
            Step 2.3: ເລືອກຄຸນລັກສະນະມາດຕະຖານ & Recycled Custom Fields (Attribute Pool)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {masterSpecsPool.map(spec => (
              <div
                key={spec.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition ${
                  selectedSpecs.includes(spec.id)
                    ? 'bg-purple-50 border-purple-500 text-purple-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedSpecs.includes(spec.id)}
                    onChange={() => toggleSpec(spec.id)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <div className="truncate">
                    <p className="font-black text-xs truncate">{lang === 'en' ? spec.nameEn : spec.nameLo}</p>
                    <p className="text-[10px] text-slate-400 font-semibold truncate">{lang === 'en' ? spec.nameLo : spec.nameEn}</p>
                  </div>
                </label>

                {/* Delete button for custom-added fields in master pool */}
                {spec.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSpecFromPool(spec.id);
                      setSelectedSpecs(prev => prev.filter(id => id !== spec.id));
                    }}
                    title="Delete custom field from pool"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 2.4: Custom Field Builder */}
        <div className="space-y-3 bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-purple-900 uppercase block">
              Step 2.4: ເພີ່ມຟິວ custom ໃໝ່ (Custom Field Builder)
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
                    <option value="Link">Link (URL)</option>
                    <option value="Image">Image (URL)</option>
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

        {/* Category Builder Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
          >
            {lang === 'en' ? 'Cancel' : 'ຍົກເລີກ'}
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-xs shadow-md transition active:scale-95"
          >
            {lang === 'en' ? 'Save Category & Continue' : 'ບັນທຶກໝວດໃໝ່ & ປ້ອນຂໍ້ມູນ'}
          </button>
        </div>
      </form>
    </div>
  );
}
