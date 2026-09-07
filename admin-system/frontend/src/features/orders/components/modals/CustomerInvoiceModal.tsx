import React, { useState } from 'react';
import { UniversalExportPreviewModal } from '../../../../components/common/UniversalExportPreviewModal';
import CustomerInvoiceTemplate from '../documents/CustomerInvoiceTemplate';
import { QrCode, Globe, FileText } from 'lucide-react';

export interface CustomerInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  currentLang?: string;
  formatLAK?: (n: number) => string;
}

export const CustomerInvoiceModal: React.FC<CustomerInvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
  currentLang = 'lo',
  formatLAK,
}) => {
  const [showQR, setShowQR] = useState(true);
  const [lang, setLang] = useState<'lo' | 'en'>(currentLang === 'en' ? 'en' : 'lo');

  if (!isOpen || !order) return null;

  const orderNo = order.orderNo || order.order_no || order.orderNumber || order.id || 'ORDER';
  const docNumber = `INV-${orderNo.toString().replace(/^SSP-|^ORD-|^#/, '')}`;

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
    </>
  );

  return (
    <UniversalExportPreviewModal
      isOpen={isOpen}
      onClose={onClose}
      title={lang === 'lo' ? 'ໃບບິນຊຳລະເງິນສຳລັບລູກຄ້າ' : 'Customer Payment Invoice & Receipt'}
      documentNumber={docNumber}
      defaultFileName={`Customer_Invoice_${orderNo}`}
      paperOrientation="portrait"
      toolbarExtras={toolbarExtras}
    >
      <CustomerInvoiceTemplate
        order={order}
        currentLang={lang}
        formatLAK={formatLAK}
        showBankQR={showQR}
      />
    </UniversalExportPreviewModal>
  );
};

export default CustomerInvoiceModal;
