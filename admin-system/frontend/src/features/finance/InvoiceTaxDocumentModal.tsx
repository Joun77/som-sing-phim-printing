import React, { useState } from 'react';
import { FileText, Printer, Download, Building2 } from 'lucide-react';
import { FormModalTemplate, FormSection } from '@components/common/FormModalTemplate';

interface InvoiceTaxDocumentModalProps {
  orderNumber?: string;
  customerName?: string;
  subtotalAmount?: number;
  currency?: string;
  onClose: () => void;
}

export const InvoiceTaxDocumentModal: React.FC<InvoiceTaxDocumentModalProps> = ({
  orderNumber = 'ORD-2026-0815',
  customerName = 'Vientiane Publishing House',
  subtotalAmount = 14500000,
  currency = 'LAK',
  onClose,
}) => {
  const [docType, setDocType] = useState<'INVOICE' | 'DEPOSIT_RECEIPT' | 'RECEIPT' | 'TAX_INVOICE'>('TAX_INVOICE');
  const [taxMode, setTaxMode] = useState<'NONE' | 'EXCLUDED' | 'INCLUDED'>('EXCLUDED');
  const [taxRate] = useState(7); // 7% VAT
  const [depositPercent, setDepositPercent] = useState(30); // 30% deposit

  // Math computations
  let taxAmount = 0;
  let grandTotal = subtotalAmount;

  if (taxMode === 'EXCLUDED') {
    taxAmount = subtotalAmount * (taxRate / 100);
    grandTotal = subtotalAmount + taxAmount;
  } else if (taxMode === 'INCLUDED') {
    const baseWithoutTax = subtotalAmount / (1 + taxRate / 100);
    taxAmount = subtotalAmount - baseWithoutTax;
    grandTotal = subtotalAmount;
  } else {
    taxAmount = 0;
    grandTotal = subtotalAmount;
  }

  const depositAmount = grandTotal * (depositPercent / 100);
  const balanceDue = grandTotal - depositAmount;

  return (
    <FormModalTemplate
      onClose={onClose}
      icon={<FileText className="w-5.5 h-5.5 text-white" />}
      title="ອອກເອກະສານທາງການເງິນ (Financial & Tax Documents)"
      subtitle="ເພີ່ມ, ພິມ ແລະ ດາວໂຫຼດ ໃບແຈ້ງໜີ້, ໃບເສັດມັດຈຳ, ໃບເສັດຮັບເງິນ ແລະ ໃບກຳກັບພາສີ"
      badgeText="FINANCIAL DOCS"
      maxWidthClass="max-w-6xl"
      footerActions={
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-initial px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
          >
            <Printer className="w-4 h-4" />
            ພິມເອກະສານ (Print)
          </button>
          <button
            onClick={onClose}
            className="flex-1 sm:flex-initial px-6 py-3 bg-accent-sky hover:bg-sky-600 text-white rounded-xl font-extrabold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            ດາວໂຫຼດ PDF ໃບເສັດ/ໃບກຳກັບພາສີ
          </button>
        </div>
      }
    >
      {/* Document Type Selector Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-1">
        {[
          { id: 'INVOICE', label: 'ໃບແຈ້ງໜີ້ (Invoice)' },
          { id: 'DEPOSIT_RECEIPT', label: 'ໃບເສັດມັດຈຳ (Deposit)' },
          { id: 'RECEIPT', label: 'ໃບເສັດຮັບເງິນ (Receipt)' },
          { id: 'TAX_INVOICE', label: 'ໃບກຳກັບພາສີ (Tax Invoice)' },
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => setDocType(type.id as any)}
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer ${
              docType === type.id
                ? 'bg-accent-sky text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Form Options Section */}
      <FormSection title="ຕົວເລືອກການຕັ້ງຄ່າເອກະສານ (DOCUMENT OPTIONS)" subtitle="ກຳນົດອັດຕາພາສີມູນຄ່າເພີ່ມ ແລະ ສັດສ່ວນເງິນມັດຈຳ">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600">
              ຕົວເລືອກພາສີມູນຄ່າເພີ່ມ (TAX MODE)
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              {[
                { id: 'NONE', label: 'No Tax' },
                { id: 'EXCLUDED', label: 'VAT +7%' },
                { id: 'INCLUDED', label: 'VAT Inc.' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setTaxMode(mode.id as any)}
                  className={`py-2 px-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    taxMode === mode.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600">
              ສັດສ່ວນມັດຈຳ (DEPOSIT RATE)
            </label>
            <div className="grid grid-cols-4 gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              {[0, 30, 50, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDepositPercent(pct)}
                  className={`py-2 px-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    depositPercent === pct
                      ? 'bg-accent-sky text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </FormSection>

      {/* Authentic Document Sheet Section Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 font-sans relative overflow-hidden">
        {/* Subtle Watermark Stamp */}
        <div className="absolute bottom-8 right-12 opacity-5 pointer-events-none select-none">
          <Building2 className="w-48 h-48 text-slate-900" />
        </div>

        {/* Document Header with Circular Official Logo */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-200 pb-6 gap-6 relative z-10">
          <div className="flex items-start gap-3.5">
            <img
              src="/logo.png"
              alt="Som-Sing Phim Logo"
              className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200 shrink-0"
              onError={(e) => {
                // Fallback to text circle if logo image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <h4 className="text-2xl font-black text-slate-900 tracking-tight">ໂຮງພິມ ສົມສິ່ງພິມ</h4>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Som-Sing Phim Printing Co., Ltd. • ທ່າເດື່ອ, ນະຄອນຫຼວງວຽງຈັນ
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                ເລກປະຈຳຕົວຜູ້ເສຍພາສີ: 0105569008123 • Tel: +856 20 5555 8888
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0 space-y-1">
            <span className="inline-block px-4 py-1.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-xs">
              {docType === 'INVOICE' && 'ໃບແຈ້ງໜີ້ (INVOICE)'}
              {docType === 'DEPOSIT_RECEIPT' && 'ໃບເສັດມັດຈຳ (DEPOSIT RECEIPT)'}
              {docType === 'RECEIPT' && 'ໃບເສັດຮັບເງິນ (RECEIPT)'}
              {docType === 'TAX_INVOICE' && 'ໃບກຳກັບພາສີ (TAX INVOICE)'}
            </span>
            <p className="text-xs font-black text-slate-800 pt-1">
              ເລກທີ: <span className="text-accent-sky font-mono font-bold">DOC-{orderNumber}</span>
            </p>
            <p className="text-xs font-semibold text-slate-500">
              ວັນທີ: {new Date().toLocaleDateString('lo-LA', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Client Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs relative z-10">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">ລູກຄ້າ / ບໍລິສັດ:</span>
            <span className="text-slate-900 font-extrabold text-sm block mt-0.5">{customerName}</span>
            <span className="text-slate-500 font-medium">ນະຄອນຫຼວງວຽງຈັນ, ສປປ ລາວ</span>
          </div>
          <div className="sm:text-right">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">ອ້າງອີງອໍເດີ:</span>
            <span className="text-accent-sky font-extrabold text-sm block mt-0.5">{orderNumber}</span>
            <span className="text-emerald-600 font-bold">ສະຖານະ: ອະນຸມັດພິມແລ້ວ</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                <th className="p-3">ລຳດັບ</th>
                <th className="p-3">ລາຍການສິນຄ້າ / ບໍລິການພິມ</th>
                <th className="p-3 text-right">ຈຳນວນ</th>
                <th className="p-3 text-right">ລາຄາ/ໜ່ວຍ</th>
                <th className="p-3 text-right">ຈຳນວນເງິນ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
              <tr>
                <td className="p-3 text-slate-400 font-medium">01</td>
                <td className="p-3">
                  <div className="font-extrabold text-slate-900">ງານພິມພຣີມ່ຽມປຶ້ມຄູ່ມື ສົມສິ່ງພິມ (Custom Booklet Job)</div>
                  <div className="text-[10px] text-slate-400 font-medium">ເຈ້ຍ Art Paper 150gsm • ເຄືອບເງົາ • ເຂົ້າເລົ່ມມຸມມົດ</div>
                </td>
                <td className="p-3 text-right">1,000</td>
                <td className="p-3 text-right">{(subtotalAmount / 1000).toLocaleString()}</td>
                <td className="p-3 text-right font-extrabold">{subtotalAmount.toLocaleString()} {currency}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total Calculations Pipeline */}
        <div className="border-t-2 border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-start gap-6 text-xs relative z-10">
          <div className="space-y-2 max-w-xs">
            <span className="font-extrabold text-slate-700 block">ຂໍ້ມູນການຊຳຣະເງິນ (Payment Account):</span>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px]">
              <p className="font-extrabold text-slate-900">ທະນາຄານການຄ້າຕ່າງປະເທດລາວ (BCEL)</p>
              <p className="text-slate-600 font-medium">ເລກບັນຊີ: 160-12-00-998877-001</p>
              <p className="text-slate-500 font-medium">ຊື່ບັນຊີ: SOM-SING PRINTING CO., LTD</p>
            </div>
          </div>

          <div className="w-full sm:w-72 space-y-2 font-bold text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>ລາຄາລວມກ່ອນພາສີ (Subtotal):</span>
              <span>{subtotalAmount.toLocaleString()} {currency}</span>
            </div>

            {taxMode !== 'NONE' && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                <span>ພາສີມູນຄ່າເພີ່ມ VAT ({taxRate}%):</span>
                <span>{taxAmount.toLocaleString()} {currency}</span>
              </div>
            )}

            <div className="flex justify-between py-2 text-sm font-black text-slate-900 border-b-2 border-slate-300">
              <span>ຍອດລວມສຸດທິ (Grand Total):</span>
              <span className="text-accent-sky">{grandTotal.toLocaleString()} {currency}</span>
            </div>

            <div className="flex justify-between py-1 text-emerald-700 font-extrabold">
              <span>ຍອດມັດຈຳ ({depositPercent}%):</span>
              <span>{depositAmount.toLocaleString()} {currency}</span>
            </div>

            <div className="flex justify-between py-1 text-amber-700 font-extrabold bg-amber-50 p-2 rounded-lg">
              <span>ຍອດຄ້າງຊຳຣະ (Balance Due):</span>
              <span>{balanceDue.toLocaleString()} {currency}</span>
            </div>
          </div>
        </div>

        {/* Signatures Footer */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-xs font-bold text-slate-500 relative z-10">
          <div className="space-y-8">
            <div className="border-b border-dashed border-slate-300 w-3/4 mx-auto" />
            <p>ຜູ້ຮັບເອກະສານ / ຜູ້ຊຳຣະເງິນ (Customer Signature)</p>
          </div>
          <div className="space-y-8">
            <div className="border-b border-dashed border-slate-300 w-3/4 mx-auto" />
            <p>ຜູ້ອອກເອກະສານ / ຜູ້ບໍລິຫານ (Authorized Signature)</p>
          </div>
        </div>
      </div>
    </FormModalTemplate>
  );
};
