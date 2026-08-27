import React, { useState } from 'react';
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  Check, 
  Layers, 
  Package, 
  Percent, 
  Search,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { FormModalTemplate } from '@components/common/FormModalTemplate';
import { PricingTemplatePreset } from '@features/pricing/components/QuotationManager';

interface PricingTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTemplates: PricingTemplatePreset[];
  customTemplates: PricingTemplatePreset[];
  selectedTemplateId?: string;
  onApplyTemplate: (tpl: PricingTemplatePreset) => void;
  onDeleteCustomTemplate: (templateId: string, templateName: string) => void;
  onOpenSaveNewModal: () => void;
  currentLang: string;
}

export const PricingTemplatesModal: React.FC<PricingTemplatesModalProps> = ({
  isOpen,
  onClose,
  allTemplates,
  customTemplates,
  selectedTemplateId,
  onApplyTemplate,
  onDeleteCustomTemplate,
  onOpenSaveNewModal,
  currentLang,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: currentLang === 'lo' ? 'ທັງໝົດ' : 'All' },
    { id: 'book', label: currentLang === 'lo' ? 'ປຶ້ມ / ວາລະສານ' : 'Books' },
    { id: 'marketing', label: currentLang === 'lo' ? 'ແຜ່ນພັບ / ໂປສເຕີ' : 'Marketing' },
    { id: 'box', label: currentLang === 'lo' ? 'ກ່ອງ / ບັນຈຸພັນ' : 'Packaging' },
    { id: 'stationery', label: currentLang === 'lo' ? 'ນາມບັດ / ເອກະສານ' : 'Stationery' },
    { id: 'custom', label: currentLang === 'lo' ? 'ແມ່ແບບຂອງຂ້ອຍ (Custom)' : 'My Templates' },
  ];

  const filteredTemplates = allTemplates.filter((tpl) => {
    const isCustom = tpl.id.startsWith('CUST_TPL_') || customTemplates.some((ct) => ct.id === tpl.id);
    if (selectedCategory === 'custom' && !isCustom) return false;
    if (selectedCategory !== 'all' && selectedCategory !== 'custom' && tpl.category !== selectedCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameL = (tpl.nameLao || '').toLowerCase();
    const nameE = (tpl.nameEn || '').toLowerCase();
    const desc = (tpl.description || '').toLowerCase();
    return nameL.includes(q) || nameE.includes(q) || desc.includes(q);
  });

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<Bookmark className="w-6 h-6 text-white" />}
      title={
        currentLang === 'lo'
          ? 'ແມ່ແບບສູດຄຳນວນຕົ້ນທຶນ (Pricing Templates)'
          : 'Pricing Preset Templates'
      }
      subtitle={
        currentLang === 'lo'
          ? 'ເລືອກນຳໃຊ້ແມ່ແບບສຳເລັດຮູບ, ຈັດການ ແລະ ລົບແມ່ແບບທີ່ບັນທຶກເອງ'
          : 'Choose standard presets, manage, and delete custom saved pricing templates.'
      }
      maxWidthClass="max-w-6xl"
      badgeText={`${allTemplates.length} ແມ່ແບບ`}
      footerActions={
        <div className="flex justify-between items-center w-full">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSaveNewModal();
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>{currentLang === 'lo' ? 'ບັນທຶກສະເປັກປັດຈຸບັນເປັນແມ່ແບບໃໝ່' : 'Save Current Spec as New Template'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {currentLang === 'lo' ? 'ປິດ' : 'Close'}
          </button>
        </div>
      }
    >
      <div className="p-5 sm:p-7 space-y-5">
        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ຄົ້ນຫາຊື່ແມ່ແບບ, ລາຍລະອຽດ..."
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-accent-sky focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-primary-navy text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
          {filteredTemplates.map((tpl) => {
            const isSelected = selectedTemplateId === tpl.id;
            const isCustom = tpl.id.startsWith('CUST_TPL_') || customTemplates.some((ct) => ct.id === tpl.id);
            const activeCount = Object.values(tpl.activeModules || {}).filter(Boolean).length;

            return (
              <div
                key={tpl.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 shadow-2xs ${
                  isSelected
                    ? 'bg-sky-50/60 border-accent-sky shadow-md ring-1 ring-accent-sky/30'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header: Title, Category & Custom Badge */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Bookmark className={`w-4 h-4 shrink-0 ${isSelected ? 'text-accent-sky' : 'text-slate-500'}`} />
                        <h4 className="font-black text-sm text-slate-900">
                          {currentLang === 'lo' ? tpl.nameLao : tpl.nameEn}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-2">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {isCustom ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Custom
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200">
                          Preset
                        </span>
                      )}

                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Modules & Specs Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 flex items-center gap-1">
                      <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                      <span>{activeCount}/6 ໂມດູນຕົ້ນທຶນ</span>
                    </span>

                    {tpl.defaultLaborPercent !== undefined && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center gap-1">
                        <Percent className="w-3 h-3 text-amber-600" />
                        <span>ຄ່າແຮງ {tpl.defaultLaborPercent}%</span>
                      </span>
                    )}

                    {(tpl.defaultMaterials || []).length > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center gap-1">
                        <Package className="w-3 h-3 text-emerald-600" />
                        <span>{tpl.defaultMaterials?.length} ວັດຖຸດິບຫຼັງພິມ</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions: Apply & Delete */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      onApplyTemplate(tpl);
                      onClose();
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-primary-navy hover:bg-slate-800 text-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSelected ? (currentLang === 'lo' ? 'ກຳລັງນຳໃຊ້' : 'Selected') : (currentLang === 'lo' ? 'ນຳໃຊ້ແມ່ແບບນີ້' : 'Apply Template')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteCustomTemplate(tpl.id, currentLang === 'lo' ? tpl.nameLao : tpl.nameEn)}
                    className="px-3 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
                    title="ລົບແມ່ແບບນີ້"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{currentLang === 'lo' ? 'ລົບ' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </FormModalTemplate>
  );
};
