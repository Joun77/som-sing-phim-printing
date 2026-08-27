import React from 'react';
import { Share2, ExternalLink, QrCode, Copy, Check } from 'lucide-react';
import { FormModalTemplate } from '@components/common/FormModalTemplate';

export interface QuotationShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationTitle: string;
  selectedCustomerId: string;
  itemsLength: number;
  grandTotalUnits: number;
  finalGrandTotal: number;
  isCopiedLink: boolean;
  onCopyLink: () => void;
  currentLang: string;
  formatCurrency: (val: number) => string;
}

export const QuotationShareModal: React.FC<QuotationShareModalProps> = ({
  isOpen,
  onClose,
  quotationTitle,
  selectedCustomerId,
  itemsLength,
  grandTotalUnits,
  finalGrandTotal,
  isCopiedLink,
  onCopyLink,
  currentLang,
  formatCurrency
}) => {
  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<Share2 className="w-6 h-6 text-white" />}
      title={currentLang === 'lo' ? 'ແບ່ງປັນໃບສະເໜີລາຄາອອນລາຍ' : 'Share Online Quotation'}
      subtitle={currentLang === 'lo' ? 'ລູກຄ້າສາມາດເປີດກວດສອບສະເປກ, ຍອດລວມ ແລະ ກົດຢືນຢັນສັ່ງງານຜ່ານມືຖືໄດ້ທັນທີ' : 'Customer can inspect specs, pricing, and confirm orders directly on their mobile device.'}
      maxWidthClass="max-w-2xl"
      footerActions={
        <div className="flex justify-between items-center w-full">
          <button
            type="button"
            onClick={() => {
              window.open(`/quote/view?ref=${encodeURIComponent(selectedCustomerId || 'customer')}&total=${finalGrandTotal}`, '_blank');
            }}
            className="text-xs font-bold text-accent-sky hover:underline flex items-center gap-1 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{currentLang === 'lo' ? 'ທົດລອງເປີດມຸມມອງລູກຄ້າ' : 'Open Client View'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
          >
            {currentLang === 'lo' ? 'ປິດ' : 'Close'}
          </button>
        </div>
      }
    >
      <div className="p-6 space-y-5">
        {/* Quotation Brief */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 text-xs space-y-2.5 shadow-xs">
          <div className="flex justify-between items-center text-slate-600">
            <span className="font-bold">{currentLang === 'lo' ? 'ຊື່ໃບສະເໜີ:' : 'Quotation:'}</span>
            <span className="font-black text-slate-900">{quotationTitle}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span className="font-bold">{currentLang === 'lo' ? 'ລູກຄ້າ:' : 'Customer:'}</span>
            <span className="font-black text-slate-900">{selectedCustomerId || 'Customer'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span className="font-bold">{currentLang === 'lo' ? 'ຈຳນວນລາຍການ:' : 'Total Items:'}</span>
            <span className="font-sans font-bold text-slate-900">{itemsLength} รายการ ({grandTotalUnits.toLocaleString()} units)</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 border-t border-slate-100 pt-2.5">
            <span className="font-black text-slate-900">{currentLang === 'lo' ? 'ຍອດລວມສຸດທິ:' : 'Grand Total:'}</span>
            <span className="font-black text-primary-navy font-mono text-base">
              {formatCurrency(finalGrandTotal)}
            </span>
          </div>
        </div>

        {/* QR Code Graphic Mockup */}
        <div className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner">
            <QrCode className="w-28 h-28 text-slate-900" />
          </div>
          <p className="text-xs font-bold text-slate-600 tracking-wide text-center">
            {currentLang === 'lo' ? 'ສະແກນ QR Code ເພື່ອເປີດໃບສະເໜີໃນໂທລະສັບ' : 'Scan QR Code to open quotation on mobile'}
          </p>
        </div>

        {/* Shareable Link Input & Copy */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-700 block">
            {currentLang === 'lo' ? 'ລິ້ງໃບສະເໜີລາຄາ (Customer Web Link)' : 'Customer Web Link'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/quote/view?ref=${encodeURIComponent(selectedCustomerId || 'customer')}&total=${finalGrandTotal}`}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all shadow-xs"
            />
            <button
              type="button"
              onClick={onCopyLink}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95 ${
                isCopiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-accent-sky hover:bg-sky-600 text-white'
              }`}
            >
              {isCopiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{isCopiedLink ? (currentLang === 'lo' ? 'ຄັດລອກແລ້ວ' : 'Copied') : (currentLang === 'lo' ? 'ຄັດລອກ' : 'Copy')}</span>
            </button>
          </div>
        </div>
      </div>
    </FormModalTemplate>
  );
};
