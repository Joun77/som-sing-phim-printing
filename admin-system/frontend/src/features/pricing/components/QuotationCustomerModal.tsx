import React, { useState, useMemo } from 'react';
import { UniversalExportPreviewModal } from '../../../components/common/UniversalExportPreviewModal';
import { CustomerQuotationTemplate } from './CustomerQuotationTemplate';
import { QrCode, FileText, ShoppingCart } from 'lucide-react';

export interface QuotationCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  calculatedItems: any[];
  inventory: any[];
  equipment: any[];
  selectedCustomerId: string;
  customerPhone: string;
  customerAddress: string;
  customers: any[];
  quotationExpiry: string;
  paymentTerms: string;
  shippingMethod: string;
  shippingFee: number;
  quotationNote: string;
  grandBaseSellingPrice?: number;
  grandDiscountAmount?: number;
  quotationDiscountPercent?: number;
  grandSubtotal: number;
  taxEnabled: boolean;
  taxMode: string;
  taxRate: number;
  taxAmount: number;
  finalGrandTotal: number;
  currentLang?: string;
  formatCurrency: (val: number) => string;
  onConfirmOrder?: () => void;
}

export const QuotationCustomerModal: React.FC<QuotationCustomerModalProps> = ({
  isOpen,
  onClose,
  items,
  calculatedItems,
  inventory,
  equipment,
  selectedCustomerId,
  customerPhone,
  customerAddress,
  customers,
  quotationExpiry,
  paymentTerms,
  shippingMethod,
  shippingFee,
  quotationNote,
  grandBaseSellingPrice,
  grandDiscountAmount,
  quotationDiscountPercent,
  grandSubtotal,
  taxEnabled,
  taxMode,
  taxRate,
  taxAmount,
  finalGrandTotal,
  currentLang = 'lo',
  formatCurrency,
  onConfirmOrder,
}) => {
  const [showQR, setShowQR] = useState(true);
  const [lang, setLang] = useState<'lo' | 'en'>(currentLang === 'en' ? 'en' : 'lo');

  const quotationRefId = useMemo(() => `QT-${Math.floor(Date.now() / 1000).toString().slice(-6)}`, []);

  if (!isOpen) return null;

  return (
    <UniversalExportPreviewModal
      isOpen={isOpen}
      onClose={onClose}
      title={lang === 'lo' ? 'ໃບສະເໜີລາຄາທາງການ (Official Quotation)' : 'Official Quotation Preview'}
      documentNumber={quotationRefId}
      defaultFileName={`Quotation_${selectedCustomerId || 'Customer'}`}
      paperOrientation="portrait"
    >
      <div className="space-y-4">
        {/* Top Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100 rounded-2xl text-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>{lang === 'lo' ? 'ຕົວເລືອກໃບສະເໜີ:' : 'Options:'}</span>
            </span>
            <label className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showQR}
                onChange={(e) => setShowQR(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <QrCode className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium text-slate-700">{lang === 'lo' ? 'ສະແດງ QR BCEL One' : 'Show Bank QR'}</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setLang('lo')}
                className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  lang === 'lo' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ພາສາລາວ (LO)
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  lang === 'en' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English (EN)
              </button>
            </div>

            {onConfirmOrder && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onConfirmOrder();
                }}
                className="px-3.5 py-1.5 bg-primary-navy hover:bg-slate-900 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'lo' ? 'ຢືນຢັນສັ່ງຜະລິດ' : 'Confirm Order'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quotation Document Body */}
        <CustomerQuotationTemplate
          quotationRefId={quotationRefId}
          customerName={selectedCustomerId}
          customerPhone={customerPhone}
          customerAddress={customerAddress}
          quotationExpiry={quotationExpiry}
          paymentTerms={paymentTerms}
          shippingMethod={shippingMethod}
          shippingFee={shippingFee}
          quotationNote={quotationNote}
          items={items}
          calculatedItems={calculatedItems}
          inventory={inventory}
          equipment={equipment}
          grandBaseSellingPrice={grandBaseSellingPrice}
          grandDiscountAmount={grandDiscountAmount}
          quotationDiscountPercent={quotationDiscountPercent}
          grandSubtotal={grandSubtotal}
          taxEnabled={taxEnabled}
          taxMode={taxMode}
          taxRate={taxRate}
          taxAmount={taxAmount}
          finalGrandTotal={finalGrandTotal}
          currentLang={lang}
          formatCurrency={formatCurrency}
          showBankQR={showQR}
        />
      </div>
    </UniversalExportPreviewModal>
  );
};

export default QuotationCustomerModal;
