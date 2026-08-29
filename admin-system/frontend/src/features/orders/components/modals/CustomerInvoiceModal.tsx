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

  return (
    <UniversalExportPreviewModal
      isOpen={isOpen}
      onClose={onClose}
      title={lang === 'lo' ? 'ໃບບິນຊຳລະເງິນສຳລັບລູກຄ້າ' : 'Customer Payment Invoice & Receipt'}
      documentNumber={docNumber}
      defaultFileName={`Customer_Invoice_${orderNo}`}
      paperOrientation="portrait"
    >
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100 rounded-2xl text-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>{lang === 'lo' ? 'ຕົວເລືອກໃບບິນ:' : 'Invoice Options:'}</span>
            </span>
            <label className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showQR}
                onChange={(e) => setShowQR(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <QrCode className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium text-slate-700">{lang === 'lo' ? 'ສະແດງ QR BCEL One' : 'Show Bank QR'}</span>
            </label>
          </div>

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
        </div>

        {/* Invoice Body Template */}
        <CustomerInvoiceTemplate
          order={order}
          currentLang={lang}
          formatLAK={formatLAK}
          showBankQR={showQR}
        />
      </div>
    </UniversalExportPreviewModal>
  );
};

export default CustomerInvoiceModal;
