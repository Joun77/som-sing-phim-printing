import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function GenericSpecForm({ formData, onChange }: { formData: any; onChange: (updated: any) => void }) {
  const { i18n } = useTranslation();
  const isLao = i18n.language === 'lo';

  const specs = formData.specs || {};
  const [modelRef, setModelRef] = useState(formData.modelRef || specs.modelRef || '');
  const [partYield, setPartYield] = useState(formData.partYield || specs.partYield || '');
  const [driveSystem, setDriveSystem] = useState(formData.driveSystem || specs.driveSystem || '');

  const updateParent = (fields: any) => {
    onChange({
      specs: {
        ...specs,
        modelRef,
        partYield,
        driveSystem,
        ...fields
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-700">
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Model Ref / Reference</label>
        <input 
          type="text" 
          value={modelRef} 
          onChange={(e) => {
            setModelRef(e.target.value);
            updateParent({ modelRef: e.target.value });
          }} 
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
        />
      </div>
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Part Yield / Lifespan</label>
        <input 
          type="text" 
          value={partYield} 
          onChange={(e) => {
            setPartYield(e.target.value);
            updateParent({ partYield: e.target.value });
          }} 
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
        />
      </div>
      <div className="col-span-1 md:col-span-2">
        <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Drive System / Note</label>
        <input 
          type="text" 
          value={driveSystem} 
          onChange={(e) => {
            setDriveSystem(e.target.value);
            updateParent({ driveSystem: e.target.value });
          }} 
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
        />
      </div>
    </div>
  );
}
