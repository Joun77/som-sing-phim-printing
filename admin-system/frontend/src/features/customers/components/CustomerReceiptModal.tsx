import React from 'react';
import { X } from 'lucide-react';

interface ReceiptModalProps {
  order: any;
  onClose: () => void;
  formatLAK: (amount: number) => string;
  currentLang: string;
  t: (key: string) => string;
}

export function CustomerReceiptModal({ order, onClose, formatLAK, currentLang, t }: ReceiptModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 relative border border-slate-100 print:p-0 print:border-none print:shadow-none animate-scale-up">
        {/* Actions - Hidden on print */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 print:hidden">
          <h3 className="font-extrabold text-slate-900 text-base">
            {currentLang === 'lo' ? 'ໃບບິນຮັບເງິນ' : 'Receipt / Invoice'}
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition shadow-sm"
            >
              {currentLang === 'lo' ? 'ພິມໃບບິນ' : 'Print Receipt'}
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Container for Print */}
        <div className="space-y-6 text-xs text-slate-700">
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">{t('common.app_name')}</h1>
              <p className="text-[10px] text-slate-400 mt-1">Phone Savan village, Sisattanak district, Vientiane</p>
              <p className="text-[10px] text-slate-400">Tel: 020 5566-7788 | Email: somsingphim@gmail.com</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-black text-slate-800">
                {currentLang === 'lo' ? 'ໃບບິນຮັບເງິນ' : 'RECEIPT'}
              </h2>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">ORDER ID: {order.id}</p>
              <p className="text-[10px] text-slate-400 font-sans">Date: {order.date}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
            <div>
              <p className="font-black text-slate-400 uppercase tracking-wider text-[9px]">Customer profile:</p>
              <p className="font-extrabold text-slate-800 mt-1 text-xs">{order.customerName}</p>
              <p className="text-slate-500 font-sans mt-0.5">{order.phone}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-slate-400 uppercase tracking-wider text-[9px]">Payment info:</p>
              <p className="font-black text-indigo-600 mt-1 text-xs">{t(`payment.${order.paymentStatus}`)}</p>
              <p className="text-slate-500 font-mono mt-0.5 text-[10px]">
                {order.paymentMethod} {order.bankName ? `(${order.bankName})` : ''}
              </p>
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-slate-100 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3">Item Description</th>
                <th className="p-3 text-center">Quantity</th>
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(order.items || []).map((item: any, idx: number) => (
                <tr key={idx} className="text-slate-600">
                  <td className="p-3 font-semibold">{item.name}</td>
                  <td className="p-3 text-center font-sans font-bold">{item.quantity}</td>
                  <td className="p-3 text-right font-sans">{formatLAK(item.unitCost)}</td>
                  <td className="p-3 text-right font-sans font-black text-slate-900">{formatLAK(item.quantity * item.unitCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-2 text-xs font-semibold text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-sans text-slate-900 font-bold">{formatLAK(order.totalPriceCharged)}</span>
              </div>
              <div className="flex justify-between text-indigo-600 font-bold">
                <span>Deposit Paid:</span>
                <span className="font-sans">{formatLAK(order.depositAmountPaid)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-red-600 text-sm font-black">
                <span>Remaining Balance:</span>
                <span className="font-sans text-base">{formatLAK(order.remainingUnpaidBalance)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-12 text-center text-[10px]">
            <div>
              <div className="w-36 border-b mx-auto h-8" />
              <p className="mt-2 font-black text-slate-400 uppercase tracking-wide">Customer Signature</p>
            </div>
            <div>
              <div className="w-36 border-b mx-auto h-8" />
              <p className="mt-2 font-black text-slate-400 uppercase tracking-wide">Authorized Representative</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
