import React from 'react';
import { InboundItemFormData } from './types';

interface SpecsProps {
  item: InboundItemFormData;
  updateField: (field: keyof InboundItemFormData, value: any) => void;
}

export const MachinerySpecsForm: React.FC<SpecsProps> = ({ item, updateField }) => {
  return (
    <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
        ເຄື່ອງຈັກຫຼັງການພິມ (Post-Press Machinery Specs)
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">ຊື່ເຄື່ອງຈັກ (Machine Name) *</label>
          <input 
            type="text" 
            value={item.machineryName} 
            onChange={(e) => updateField('machineryName', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            placeholder="e.g. Guillotine Cutter 480" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">ລຸ້ນ / Model</label>
          <input 
            type="text" 
            value={item.machineryModel} 
            onChange={(e) => updateField('machineryModel', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            placeholder="e.g. Model X-500" 
          />
        </div>
      </div>
    </div>
  );
};

export const BindingSpecsForm: React.FC<SpecsProps> = ({ item, updateField }) => {
  return (
    <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
        ອຸປະກອນເຂົ້າເລົ່ມ (Binding Materials Specs)
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">ຊື່ອຸປະກອນ (Binding Name) *</label>
          <input 
            type="text" 
            value={item.bindingName} 
            onChange={(e) => updateField('bindingName', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            placeholder="e.g. ສັນກະດູກງູ Wire-O 1/2 ນິ້ວ" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">ປະເພດ (Binding Type)</label>
          <select 
            value={item.bindingType} 
            onChange={(e) => updateField('bindingType', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
          >
            <option value="Wire-O">Wire-O (ສັນຫ່ວງຄູ່)</option>
            <option value="Plastic Comb">Plastic Comb (ສັນກະດູກງູພລາສຕິກ)</option>
            <option value="Spiral">Spiral (ສັນກຽວ)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export const LaminationSpecsForm: React.FC<SpecsProps> = ({ item, updateField }) => {
  return (
    <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
        ຟີມເຄືອບ (Lamination Film Specs)
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">ຊື່ຟີມ (Film Name) *</label>
          <input 
            type="text" 
            value={item.laminationName} 
            onChange={(e) => updateField('laminationName', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            placeholder="e.g. ຟີມເຄືອບເງົາ 125 Micron" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">ຄວາມໜາ (Thickness)</label>
          <input 
            type="text" 
            value={item.laminationThickness} 
            onChange={(e) => updateField('laminationThickness', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            placeholder="e.g. 125 Micron" 
          />
        </div>
      </div>
    </div>
  );
};

export const SparePartsSpecsForm: React.FC<SpecsProps> = ({ item, updateField }) => {
  return (
    <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
        ອະໄຫຼ່ & ອຸປະກອນສ້ອມແປງ (Spare Parts Specs)
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">ຊື່ອະໄຫຼ່ (Part Name) *</label>
          <input 
            type="text" 
            value={item.sparePartName} 
            onChange={(e) => updateField('sparePartName', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            placeholder="e.g. ໃບມີດເຄື່ອງຕັດ 480" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">ໝວດໝູ່ຍ່ອຍ (Sub-category)</label>
          <input 
            type="text" 
            value={item.partSubCategory} 
            onChange={(e) => updateField('partSubCategory', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
          />
        </div>
      </div>
    </div>
  );
};

interface OffcutSpecsProps extends SpecsProps {
  inventory: any[];
}

export const OffcutSpecsForm: React.FC<OffcutSpecsProps> = ({ item, inventory, updateField }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-3xl border border-slate-100">
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-2">ຊື່ລາຍການເຈ້ຍເສດ (Offcut Item Name) *</label>
        <input 
          type="text" 
          value={item.offcutName} 
          onChange={(e) => updateField('offcutName', e.target.value)} 
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
          placeholder="e.g. ເຈ້ຍເສດ Art Card 300gsm" 
          required 
        />
      </div>
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-2">ເຈ້ຍຕົ້ນທາງ (Parent Paper SKU)</label>
        <select 
          value={item.offcutParentSku} 
          onChange={(e) => updateField('offcutParentSku', e.target.value)} 
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
        >
          <option value="">-- ບໍ່ລະບຸເຈ້ຍຕົ້ນທາງ --</option>
          {inventory.filter(i => i.category === 'Paper' || i.category === 'MATERIAL').map(pap => (
            <option key={pap.id} value={pap.id}>[{pap.id}] {pap.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-2">ໜ້າກວ້າງ (Width mm) *</label>
        <input 
          type="number" 
          value={item.offcutWidthMm} 
          onChange={(e) => updateField('offcutWidthMm', Number(e.target.value))} 
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
          required 
        />
      </div>
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-2">ຄວາມຍາວ (Length mm) *</label>
        <input 
          type="number" 
          value={item.offcutLengthMm} 
          onChange={(e) => updateField('offcutLengthMm', Number(e.target.value))} 
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
          required 
        />
      </div>
    </div>
  );
};
