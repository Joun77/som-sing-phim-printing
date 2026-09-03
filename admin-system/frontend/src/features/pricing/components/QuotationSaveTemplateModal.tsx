import React from 'react';
import { Bookmark, Save, Check } from 'lucide-react';
import { FormModalTemplate, FormSection } from '@components/common/FormModalTemplate';

export interface QuotationSaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  templateForm: {
    nameLao: string;
    category: string;
    description: string;
  };
  onFormChange: (form: any) => void;
  activeItem: any;
  currentLang: string;
}

export const QuotationSaveTemplateModal: React.FC<QuotationSaveTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  templateForm,
  onFormChange,
  activeItem,
  currentLang
}) => {
  if (!activeItem) return null;

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-xl"
      icon={<Bookmark className="w-5.5 h-5.5 text-white" />}
      title={currentLang === 'lo' ? 'ບັນທຶກສະເປັກປັດຈຸບັນເປັນແມ່ແບບ (Save as Template)' : 'Save as Pricing Template'}
      subtitle={currentLang === 'lo' ? 'ບັນທຶກການຕັ້ງຄ່າໂມດູນ, ວັດຖຸດິບຫຼັງພິມ, ແລະ ຄ່າແຮງງານໄວ້ໃຊ້ຊ້ຳ' : 'Save active modules, consumables, and labor settings for future quotations.'}
      badgeText="TEMPLATE PRESET"
      footerActions={
        <div className="flex justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            {currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-5 py-2.5 bg-accent-sky hover:bg-sky-600 text-white rounded-xl text-xs font-black shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ບັນທຶກແມ່ແບບ' : 'Save Template'}</span>
          </button>
        </div>
      }
    >
      <div className="p-6 space-y-4">
        <FormSection
          title={currentLang === 'lo' ? 'ຂໍ້ມູນແມ່ແບບ (Template Info)' : 'Template Info'}
          subtitle={currentLang === 'lo' ? 'ຕັ້ງຊື່ແລະໝວດໝູ່ເພື່ອໃຫ້ຄົ້ນຫາໄດ້ງ່າຍ' : 'Name and categorize your template.'}
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-800 block">
                {currentLang === 'lo' ? 'ຊື່ແມ່ແບບພາສາລາວ (Template Name) *' : 'Template Name (Lao) *'}
              </label>
              <input
                type="text"
                value={templateForm.nameLao}
                onChange={(e) => onFormChange({ ...templateForm, nameLao: e.target.value })}
                placeholder="ເຊັ່ນ: ປຶ້ມສູດຄູນ A5 ເຢັບແມັກ 2 ຈຸດ..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-accent-sky bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">
                {currentLang === 'lo' ? 'ໝວດໝູ່ສິນຄ້າ (Category):' : 'Category:'}
              </label>
              <select
                value={templateForm.category}
                onChange={(e) => onFormChange({ ...templateForm, category: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white"
              >
                <option value="book">ປຶ້ມ / ວາລະສານ (Book & Magazine)</option>
                <option value="stationery">ເຄື່ອງຂຽນ & ປະຕິທິນ (Stationery & Calendar)</option>
                <option value="sticker">ສະຕິກເກີ & ປ້າຍ (Sticker & Label)</option>
                <option value="marketing">ສື່ໂຄສະນາ / ໃບປິວ (Marketing / Flyer)</option>
                <option value="custom">ອື່ນໆ (Custom General)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">
                {currentLang === 'lo' ? 'ຄຳອະທິບາຍ (Description):' : 'Description:'}
              </label>
              <textarea
                rows={2}
                value={templateForm.description}
                onChange={(e) => onFormChange({ ...templateForm, description: e.target.value })}
                placeholder="ລາຍລະອຽດເພີ່ມເຕີມກ່ຽວກັບສູດຄຳນວນນີ້..."
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-accent-sky bg-white"
              />
            </div>
          </div>
        </FormSection>

        {/* Active summary preview */}
        <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl text-xs space-y-1.5">
          <span className="font-bold text-sky-950 block">ໂຄງສ້າງໂມດູນທີ່ຈະຖືກບັນທຶກ:</span>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {activeItem.activeModules?.paper && <span className="inline-flex items-center px-2 py-0.5 bg-sky-100 text-sky-900 rounded font-bold text-[10px]"><Check className="w-3 h-3 mr-0.5" /> ເຈ້ຍ</span>}
            {activeItem.activeModules?.printEngine && <span className="inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-900 rounded font-bold text-[10px]"><Check className="w-3 h-3 mr-0.5" /> ເຄື່ອງພິມ</span>}
            {activeItem.activeModules?.postPressMachinery && <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[10px]"><Check className="w-3 h-3 mr-0.5" /> ເຄື່ອງຈັກຫຼັງພິມ</span>}
            {activeItem.activeModules?.finishingMaterials && <span className="inline-flex items-center px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-bold text-[10px]"><Check className="w-3 h-3 mr-0.5" /> ວັດຖຸດິບ ({(activeItem.finishingMaterials || []).length} ລາຍການ)</span>}
            {activeItem.activeModules?.laborAndSetup && <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-900 rounded font-bold text-[10px]"><Check className="w-3 h-3 mr-0.5" /> ຄ່າແຮງ {activeItem.laborPercent}%</span>}
            {activeItem.activeModules?.packagingDelivery && <span className="inline-flex items-center px-2 py-0.5 bg-slate-200 text-slate-900 rounded font-bold text-[10px]"><Check className="w-3 h-3 mr-0.5" /> ຂົນສົ່ງ</span>}
          </div>
        </div>
      </div>
    </FormModalTemplate>
  );
};
