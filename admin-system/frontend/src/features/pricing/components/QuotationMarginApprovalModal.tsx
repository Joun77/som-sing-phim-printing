import React from 'react';
import { ShieldAlert, Check, X } from 'lucide-react';
import { FormModalTemplate } from '@components/common/FormModalTemplate';

export interface QuotationMarginApprovalModalProps {
  quote: any;
  isOpen: boolean;
  isProcessing: boolean;
  approvalReason: string;
  currentLang: string;
  formatCurrency: (val: number) => string;
  onReasonChange: (reason: string) => void;
  onApprove: (quote: any) => void;
  onReject: (quote: any) => void;
  onClose: () => void;
}

export const QuotationMarginApprovalModal: React.FC<QuotationMarginApprovalModalProps> = ({
  quote,
  isOpen,
  isProcessing,
  approvalReason,
  currentLang,
  formatCurrency,
  onReasonChange,
  onApprove,
  onReject,
  onClose
}) => {
  if (!quote) return null;

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<ShieldAlert className="w-6 h-6 text-white" />}
      title={currentLang === 'lo' ? 'ການອະນຸມັດສ່ວນຫຼຸດ (Sales Manager)' : 'Quotation Discount Approval'}
      subtitle={currentLang === 'lo' ? 'ກວດສອບອັດຕາກຳໄລ ແລະ ອະນຸມັດສ່ວນຫຼຸດພິເສດ' : 'Review profit margin and approve special discount.'}
      maxWidthClass="max-w-2xl"
      footerActions={
        <div className="flex justify-end gap-3 w-full">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onReject(quote)}
            className="px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-black transition cursor-pointer"
          >
            {currentLang === 'lo' ? 'ປະຕິເສດສ່ວນຫຼຸດ (Reject)' : 'Reject Discount'}
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onApprove(quote)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{currentLang === 'lo' ? 'ອະນຸມັດສ່ວນຫຼຸດ (Approve)' : 'Approve Discount'}</span>
          </button>
        </div>
      }
    >
      <div className="p-6 space-y-4 text-xs font-semibold text-slate-700">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-bold">ໃບສະເໜີລາຄາ {quote.quotationNumber || quote.id}</p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              ລູກຄ້າ: {quote.customerName || 'N/A'} • ຍອດລວມ: {formatCurrency(quote.finalGrandTotal || 0)}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-slate-600 font-bold">ເຫດຜົນການອະນຸມັດ / ໝາຍເຫດ (Approval Note):</label>
          <textarea
            rows={3}
            value={approvalReason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="ໃສ່ເຫດຜົນການອະນຸມັດ ເຊັ່ນ: ລູກຄ້າປະຈຳ, ງານຈຳນວນຫຼາຍ..."
            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs font-medium focus:outline-none focus:border-accent-sky"
          />
        </div>
      </div>
    </FormModalTemplate>
  );
};
