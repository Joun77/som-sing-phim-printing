import React from 'react';
import { 
  ArrowLeft, 
  Layers, 
  Share2, 
  Download, 
  ShoppingCart, 
  Check, 
  Printer, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  DollarSign, 
  Calendar 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface QuotationCustomerViewProps {
  items: any[];
  calculatedItems: any[];
  selectedCustomerId: string;
  customerPhone: string;
  customerAddress: string;
  customers: any[];
  quotationExpiry: string;
  paymentTerms: string;
  shippingMethod: string;
  shippingFee: number;
  quotationNote: string;
  grandSubtotal: number;
  taxEnabled: boolean;
  taxMode: string;
  taxRate: number;
  taxAmount: number;
  finalGrandTotal: number;
  currentLang: string;
  formatCurrency: (val: number) => string;
  onBackToCalc: () => void;
  onSaveQuotation: () => void;
  onShareQuotation: () => void;
  onExportPDF: () => void;
  onConfirmOrder: () => void;
}

export const QuotationCustomerView: React.FC<QuotationCustomerViewProps> = ({
  items,
  calculatedItems,
  selectedCustomerId,
  customerPhone,
  customerAddress,
  customers,
  quotationExpiry,
  paymentTerms,
  shippingMethod,
  shippingFee,
  quotationNote,
  grandSubtotal,
  taxEnabled,
  taxMode,
  taxRate,
  taxAmount,
  finalGrandTotal,
  currentLang,
  formatCurrency,
  onBackToCalc,
  onSaveQuotation,
  onShareQuotation,
  onExportPDF,
  onConfirmOrder,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Actions Floating Bar (Hide on print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm print:hidden">
        <button
          type="button"
          onClick={onBackToCalc}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentLang === 'lo' ? '← ແກ້ໄຂຕົ້ນທຶນ & ສະເປກ' : '← Back to Edit Specs'}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onSaveQuotation}
            className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-2xl text-xs font-extrabold transition active:scale-95 cursor-pointer"
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>{currentLang === 'lo' ? 'ບັນທຶກ' : 'Save'}</span>
          </button>

          <button
            type="button"
            onClick={onShareQuotation}
            className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-2xl text-xs font-extrabold transition active:scale-95 cursor-pointer"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>{currentLang === 'lo' ? 'ລິ້ງອອນລາຍ' : 'Share Link'}</span>
          </button>

          <button
            type="button"
            onClick={onExportPDF}
            className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-xs font-extrabold transition active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>{currentLang === 'lo' ? 'ພິມ PDF' : 'Export PDF'}</span>
          </button>

          <button
            type="button"
            onClick={onConfirmOrder}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary-navy hover:bg-slate-900 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-primary-navy/20 transition active:scale-95 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span>{currentLang === 'lo' ? 'ສ້າງອໍເດີ' : 'Create Order'}</span>
          </button>
        </div>
      </div>

      {/* Centered High-Resolution Official Quotation Document */}
      <div className="max-w-4xl mx-auto bg-white text-slate-800 p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xl space-y-8 print:border-none print:shadow-none print:p-0 print:m-0">
        {/* Invoice Letterhead */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
          <div>
            <h4 className="text-3xl font-black text-primary-navy tracking-tight">{t('common.app_name')}</h4>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
              Printing & Packaging Solutions
            </p>
            <p className="text-xs text-slate-400 font-medium font-sans mt-1">
              Tel: +856 20 5566 7788 | Vientiane Capital, Lao PDR
            </p>
          </div>
          <div className="text-right space-y-1">
            <span className="inline-block text-xs bg-slate-900 text-white font-black px-3 py-1 rounded-lg uppercase tracking-wider">
              QUOTATION
            </span>
            <p className="text-xs font-sans font-bold text-slate-600 mt-2">
              REF: QT-{Math.floor(Date.now() / 1000).toString().slice(-6)}
            </p>
            <p className="text-xs text-slate-400 font-sans font-semibold">
              Date: {new Date().toISOString().split('T')[0]}
            </p>
            <p className="text-xs text-amber-700 font-sans font-bold">Valid Until: {quotationExpiry}</p>
          </div>
        </div>

        {/* Bill To & Terms Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-semibold text-slate-600 bg-slate-50 p-5 rounded-2xl border border-slate-100 print:bg-white print:border-slate-300">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              {currentLang === 'lo' ? 'ສະເໜີເຖິງ (Customer):' : 'Quotation To:'}
            </span>
            <p className="text-slate-900 font-black text-base">
              {selectedCustomerId || (currentLang === 'lo' ? 'ລູກຄ້າທົ່ວໄປ' : 'General Customer')}
            </p>
            <p className="font-sans text-slate-600">
              Mobile: {customerPhone || customers.find((c) => c.name === selectedCustomerId)?.phone || '-'}
            </p>
            <p className="text-slate-500">{customerAddress || 'Vientiane, Laos'}</p>
          </div>
          <div className="space-y-1 sm:border-l sm:pl-6 border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              {currentLang === 'lo' ? 'ເງື່ອນໄຂການຊຳຣະ (Payment Terms):' : 'Payment Terms:'}
            </span>
            <p className="text-slate-900 font-black text-sm">{paymentTerms}</p>
            <p className="text-slate-500">
              {currentLang === 'lo' ? 'ມັດຈຳ 50% ເມື່ອຢືນຢັນສັ່ງຜະລິດ' : '50% Deposit / 50% on Delivery'}
            </p>
            <p className="text-slate-500 font-sans">
              Shipping: {shippingMethod} {shippingFee > 0 ? `(${formatCurrency(shippingFee)})` : '(Free/Pickup)'}
            </p>
          </div>
        </div>

        {/* Itemized Quotation Table */}
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5 w-12 text-center">#</th>
                  <th className="p-3.5">ລາຍລະອຽດສິນຄ້າ (Item Description)</th>
                  <th className="p-3.5 text-center">ຂະໜາດ / ວັດສະດຸ</th>
                  <th className="p-3.5 text-right">ຈຳນວນ</th>
                  <th className="p-3.5 text-right">ລາຄາ/ຫົວ</th>
                  <th className="p-3.5 text-right">ລວມເງິນ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {items.map((item, idx) => {
                  const calc = calculatedItems[idx] || {};
                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="p-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3.5">
                        <div className="font-black text-slate-900 text-sm">{item.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.colorPrintMode === 'MONO_K' ? 'Black & White (Mono K)' : 'Full Color (CMYK)'}
                          {item.selectedPostPressIds &&
                            item.selectedPostPressIds.length > 0 &&
                            ` • ${item.selectedPostPressIds.length} finishing processes`}
                        </div>
                      </td>
                      <td className="p-3.5 text-center text-slate-600 font-medium">
                        <div>
                          {item.jobSizePreset} ({item.jobWidth}x{item.jobHeight}mm)
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.paperItem?.name || item.paperName || 'Standard Paper'}
                        </div>
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900">
                        {item.printVolume?.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-semibold text-slate-700">
                        {formatCurrency(calc.unitPrice || 0)}
                      </td>
                      <td className="p-3.5 text-right font-black text-slate-950 text-sm">
                        {formatCurrency(calc.sellingPrice || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary & Total */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t-2 border-slate-100 pt-6">
          <div className="w-full sm:w-1/2 space-y-3">
            {quotationNote && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-700 block">ໝາຍເຫດ (Notes):</span>
                <p className="text-slate-600 font-medium">{quotationNote}</p>
              </div>
            )}
            <div className="text-[11px] text-slate-400 space-y-0.5 font-sans">
              <p>• ໃບສະເໜີລາຄານີ້ມີຜົນບັງຄັບໃຊ້ຮອດວັນທີ: {quotationExpiry}</p>
              <p>• ລາຄານີ້ລວມການກວດສອບຟາຍພິມ Preflight ແລະ ປັບແຕ່ງສີມາດຕະຖານ</p>
            </div>
          </div>

          <div className="w-full sm:w-1/2 space-y-2 text-xs font-semibold text-slate-600 font-sans">
            <div className="flex justify-between border-b pb-1.5">
              <span>Subtotal ({items.length} items):</span>
              <span className="font-bold text-slate-900">{formatCurrency(grandSubtotal)}</span>
            </div>

            {taxEnabled && (
              <div className="flex justify-between border-b pb-1.5">
                <span>Tax / VAT ({taxMode === 'override' ? 'Fixed' : `${taxRate}%`}):</span>
                <span className="font-bold text-slate-900">{formatCurrency(taxAmount)}</span>
              </div>
            )}

            {shippingFee > 0 && (
              <div className="flex justify-between border-b pb-1.5">
                <span>Shipping ({shippingMethod}):</span>
                <span className="font-bold text-slate-900">{formatCurrency(shippingFee)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 text-base font-black text-slate-900 border-t-2 border-slate-900">
              <span>Grand Total:</span>
              <span className="text-2xl font-black text-primary-navy">{formatCurrency(finalGrandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Official Signatures Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-10 border-t border-slate-200 text-center text-xs">
          <div className="space-y-8">
            <div className="border-b border-slate-300 pb-1 text-slate-400">................................................</div>
            <p className="font-bold text-slate-700">ຜູ້ຈັດທຳ (Prepared by)</p>
          </div>
          <div className="space-y-8">
            <div className="border-b border-slate-300 pb-1 text-slate-400">................................................</div>
            <p className="font-bold text-slate-700">ຜູ້ອະນຸມັດ (Authorized by)</p>
          </div>
          <div className="space-y-8 col-span-2 sm:col-span-1">
            <div className="border-b border-slate-300 pb-1 text-slate-400">................................................</div>
            <p className="font-bold text-slate-700">ລູກຄ້າຍອມຮັບ (Client Accepted)</p>
          </div>
        </div>
      </div>

      {/* Bottom Floating Action bar for Step 2 */}
      <div className="max-w-4xl mx-auto flex justify-between items-center pt-4 print:hidden">
        <button
          type="button"
          onClick={() => {
            onBackToCalc();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentLang === 'lo' ? 'ຍ້ອນກັບໄປແກ້ໄຂ' : 'Back to Edit'}</span>
        </button>

        <button
          type="button"
          onClick={onConfirmOrder}
          className="px-8 py-3.5 bg-primary-navy hover:bg-slate-900 text-white rounded-2xl text-sm font-black shadow-xl shadow-primary-navy/20 transition active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>{currentLang === 'lo' ? 'ສ້າງອໍເດີຈາກໃບສະເໜີນີ້' : 'Create Order from Quote'}</span>
        </button>
      </div>
    </div>
  );
};
