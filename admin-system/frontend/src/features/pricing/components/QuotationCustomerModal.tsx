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

  const toolbarExtras = (
    <>
      {/* Language Switcher */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={() => setLang('lo')}
          className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
            lang === 'lo' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          ພາສາລາວ (LO)
        </button>
        <button
          type="button"
          onClick={() => setLang('en')}
          className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
            lang === 'en' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          English (EN)
        </button>
      </div>

      {/* QR Option Segmented Buttons (ปุ่มแยก มี QR / ບໍ່ມີ QR) */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={() => setShowQR(true)}
          className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
            showQR ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>{lang === 'lo' ? 'ມີ QR' : 'With QR'}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowQR(false)}
          className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
            !showQR ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span>{lang === 'lo' ? 'ບໍ່ມີ QR' : 'No QR'}</span>
        </button>
      </div>

      {/* Confirm Order Button */}
      {onConfirmOrder && (
        <button
          type="button"
          onClick={() => {
            onClose();
            onConfirmOrder();
          }}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
        >
          <ShoppingCart className="w-3.5 h-3.5 text-white" />
          <span>{lang === 'lo' ? 'ຢືນຢັນສັ່ງຜະລິດ' : 'Confirm Order'}</span>
        </button>
      )}
    </>
  );

  return (
    <UniversalExportPreviewModal
      isOpen={isOpen}
      onClose={onClose}
      title={lang === 'lo' ? 'ໃບສະເໜີລາຄາທາງການ (Official Quotation)' : 'Official Quotation Preview'}
      documentNumber={quotationRefId}
      defaultFileName={`Quotation_${selectedCustomerId || 'Customer'}`}
      paperOrientation="portrait"
      toolbarExtras={toolbarExtras}
    >
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
    </UniversalExportPreviewModal>
  );
};

export default QuotationCustomerModal;
