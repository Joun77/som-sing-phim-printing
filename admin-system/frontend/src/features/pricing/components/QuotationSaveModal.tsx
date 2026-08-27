import React from 'react';
import { Layers, Save } from 'lucide-react';
import { FormModalTemplate, FormSection } from '@components/common/FormModalTemplate';

export interface QuotationSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  quotationTitle: string;
  onTitleChange: (title: string) => void;
  selectedCustomerId: string;
  itemsCount: number;
  finalGrandTotal: number;
  isTemplateOption: boolean;
  onTemplateOptionChange: (isTemplate: boolean) => void;
  templateCategory: string;
  onCategoryChange: (cat: string) => void;
  currentLang: string;
  formatCurrency: (val: number) => string;
}

export const QuotationSaveModal: React.FC<QuotationSaveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  quotationTitle,
  onTitleChange,
  selectedCustomerId,
  itemsCount,
  finalGrandTotal,
  isTemplateOption,
  onTemplateOptionChange,
  templateCategory,
  onCategoryChange,
  currentLang,
  formatCurrency
}) => {
  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<Layers className="w-6 h-6 text-white" />}
      title={currentLang === 'lo' ? 'ບັນທຶກໃບສະເໜີລາຄາ / ເທມເພລດ' : 'Save Quotation & Scheme'}
      subtitle={currentLang === 'lo' ? 'ກຳນົດຊື່ໃບສະເໜີລາຄາ ຫຼື ບັນທຶກເປັນເທມເພລດສຳລັບຈັດສູດລາຄາສິນຄ້າ' : 'Name this quotation or save as a reusable pricing formula template.'}
      maxWidthClass="max-w-3xl"
      footerActions={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            {currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-6 py-2.5 bg-accent-sky hover:bg-sky-600 text-white rounded-2xl text-xs font-black transition cursor-pointer shadow-md shadow-sky-500/20 active:scale-95 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ຢືນຢັນການບັນທຶກ' : 'Confirm Save'}</span>
          </button>
        </div>
      }
    >
      <div className="p-6 sm:p-8 space-y-6">
        {/* Field 1: Quotation / Scheme Title */}
        <FormSection title={currentLang === 'lo' ? 'ຂໍ້ມູນຊື່ໃບສະເໜີລາຄາ' : 'Quotation Identification'}>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 block">
              {currentLang === 'lo' ? 'ຊື່ໃບສະເໜີລາຄາ / ເທມເພລດສູດລາຄາ *' : 'Quotation / Scheme Title *'}
            </label>
            <input
              type="text"
              value={quotationTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={currentLang === 'lo' ? 'ເຊັ່ນ: ໃບສະເໜີລາຄາປຶ້ມ A4 ບໍລິສັດ ABC, ສູດລາຄາສະຕິກເກີ PP...' : 'e.g., PP Sticker A3+ Scheme, A4 Book Quote...'}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky shadow-xs"
              autoFocus
            />
          </div>
        </FormSection>

        {/* Field 2: Target Customer Summary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs space-y-2.5 shadow-xs">
          <div className="flex justify-between items-center text-slate-600">
            <span>{currentLang === 'lo' ? 'ລູກຄ້າ:' : 'Customer:'}</span>
            <span className="font-black text-slate-900">{selectedCustomerId || '-'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>{currentLang === 'lo' ? 'ຈຳນວນລາຍການ:' : 'Items Count:'}</span>
            <span className="font-black text-slate-900">{itemsCount} {currentLang === 'lo' ? 'ລາຍການ' : 'Items'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 border-t border-slate-100 pt-2">
            <span className="font-bold">{currentLang === 'lo' ? 'ຍອດລວມທັງໝົດ:' : 'Grand Total:'}</span>
            <span className="font-black text-emerald-700 font-mono text-base">
              {formatCurrency(finalGrandTotal)}
            </span>
          </div>
        </div>

        {/* Checkbox: Save as Pricing Scheme Template for Web Catalog */}
        <div className="p-5 bg-sky-50/60 border border-sky-200 rounded-2xl space-y-3.5 shadow-xs">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isTemplateOption}
              onChange={(e) => onTemplateOptionChange(e.target.checked)}
              className="w-4 h-4 rounded text-accent-sky focus:ring-accent-sky cursor-pointer"
            />
            <span className="text-xs font-black text-slate-900">
              {currentLang === 'lo' 
                ? 'ບັນທຶກເປັນເທມເພລດສູດລາຄາສຳລັບສິນຄ້າໜ້າເວັບ (Web Catalog)' 
                : 'Save as Web Catalog Pricing Template'}
            </span>
          </label>

          {isTemplateOption && (
            <div className="pl-7 space-y-2 animate-fade-in">
              <label className="text-[11px] font-bold text-slate-700 block">
                {currentLang === 'lo' ? 'ໝວດໝູ່ສິນຄ້າທີ່ຈະນຳສູດນີ້ໄປໃຊ້:' : 'Assign to Product Category:'}
              </label>
              <select
                value={templateCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-sky/30 shadow-xs"
              >
                <option value="sticker">ສະຕິກເກີ / Sticker & Label</option>
                <option value="book">ປຶ້ມ & ວາລະສານ / Book & Magazine</option>
                <option value="marketing">ໃບປິວ & ໂປສເຕີ / Flyer & Poster</option>
                <option value="stationery">ນາມບັດ & ເອກະສານ / Card & Stationery</option>
                <option value="package">ກ່ອງ & ບັນຈຸພັນ / Packaging</option>
                <option value="large-format">ປ້າຍໂຄສະນາ / Vinyl & Signage</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </FormModalTemplate>
  );
};
