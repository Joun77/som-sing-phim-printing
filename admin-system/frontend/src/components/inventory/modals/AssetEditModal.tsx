import React, { useState } from 'react';
import { X, Edit3, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PrinterSpecForm from '../forms/category-specs/PrinterSpecForm';
import InkSpecForm from '../forms/category-specs/InkSpecForm';
import PaperSpecForm from '../forms/category-specs/PaperSpecForm';
import GenericSpecForm from '../forms/category-specs/GenericSpecForm';

export default function AssetEditModal({ item, onSave, onClose }: { item: any; onSave: (updated: any) => void; onClose: () => void }) {
  const { i18n, t } = useTranslation();
  const isLao = i18n.language === 'lo';

  const [name, setName] = useState(item.name || '');
  const [category, setCategory] = useState(item.category || 'Paper');
  const [reorderThreshold, setReorderThreshold] = useState(item.reorderThreshold || 10);
  const [costPerUnit, setCostPerUnit] = useState(item.costPerPurchaseUnit || item.costPerConsumptionUnit || item.price || 0);

  const [categorySpecs, setCategorySpecs] = useState(item);

  const handleSpecChange = (updatedSpecs: any) => {
    setCategorySpecs((prev: any) => ({
      ...prev,
      ...updatedSpecs
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      ...item,
      ...categorySpecs,
      name,
      category,
      reorderThreshold: Number(reorderThreshold),
      costPerPurchaseUnit: Number(costPerUnit),
      costPerConsumptionUnit: Number(costPerUnit),
      price: Number(costPerUnit)
    };
    onSave(finalData);
  };

  const renderCategorySpecForm = () => {
    const cat = (category || item.category || '').toLowerCase();
    if (cat.includes('printer')) {
      return <PrinterSpecForm formData={categorySpecs} onChange={handleSpecChange} />;
    } else if (cat.includes('ink')) {
      return <InkSpecForm formData={categorySpecs} onChange={handleSpecChange} />;
    } else if (cat.includes('paper')) {
      return <PaperSpecForm formData={categorySpecs} onChange={handleSpecChange} />;
    }
    return <GenericSpecForm formData={categorySpecs} onChange={handleSpecChange} />;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 shadow-2xl animate-fade-in space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-600">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                {isLao ? 'แก้ไขข้อมูล Master & Technical Specs' : 'Edit Asset Master Data & Specs'}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">{item.id}</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs font-semibold text-slate-700">
          
          {/* 1. General Master Information */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              {isLao ? 'ข้อมูลทั่วไป (General Info)' : 'General Information'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Asset Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                >
                  <option value="Printer">Printer (เครื่องพิมพ์)</option>
                  <option value="Ink">Ink (หมึกพิมพ์)</option>
                  <option value="Paper">Paper (กระดาษ)</option>
                  <option value="Lamination">Lamination (ฟิล์มเคลือบ)</option>
                  <option value="Machinery">Machinery (เครื่องจักร)</option>
                  <option value="SpareParts">SpareParts (อะไหล่)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Reorder Threshold</label>
                <input 
                  type="number" 
                  value={reorderThreshold} 
                  onChange={(e) => setReorderThreshold(Number(e.target.value))} 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                />
              </div>
            </div>
          </div>

          {/* 2. Category-Specific Specs Form */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              {isLao ? 'สเปคเฉพาะหมวดหมู่ (Category Technical Specs)' : 'Category Technical Specs'}
            </h4>
            {renderCategorySpecForm()}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{t('common.save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
