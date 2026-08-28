import React, { useState } from 'react';
import { FileText, Download, CheckCircle, Send, X, ExternalLink, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SubmitQuotationModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onSubmitQuotation: (orderId: string, quotationAmount: number, notes: string) => void;
  formatCurrency: (amount: number) => string;
}

export default function SubmitQuotationModal({
  order,
  isOpen,
  onClose,
  onSubmitQuotation,
  formatCurrency
}: SubmitQuotationModalProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  if (!isOpen || !order) return null;

  const [quotePrice, setQuotePrice] = useState(order.totalPriceCharged || 150000);
  const [quoteNotes, setQuoteNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitQuotation(order.id, Number(quotePrice), quoteNotes);
    onClose();
  };

  const fileUrl = order.artworkUrl || order.driveLink || order.fileUrl;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 space-y-6 text-slate-800">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full uppercase">
                {currentLang === 'lo' ? 'ແຈ້ງລາຄາປະເມີນ (Submit Quotation)' : 'Submit Price Quotation'}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              Order #{order.id} - {order.customerName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Artwork / Customer File Inspection */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-600">
              {currentLang === 'lo' ? 'ຟາຍງານພິມຈາກລູກຄ້າ:' : 'Customer Artwork File:'}
            </span>
            {fileUrl ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{currentLang === 'lo' ? 'ດາວໂຫຼດ / ເປີດຟາຍ' : 'Download / View Artwork'}</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            ) : (
              <span className="text-xs text-slate-400 italic">No file attached</span>
            )}
          </div>
          {order.notes && (
            <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-100">
              "{order.notes}"
            </p>
          )}
        </div>

        {/* Form Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              {currentLang === 'lo' ? 'ລາຄາປະເມີນລວມ (Estimated Quotation Total)' : 'Estimated Price Quote Total'}
            </label>
            <div className="relative">
              <input
                type="number"
                required
                value={quotePrice}
                onChange={(e) => setQuotePrice(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 focus:border-sky-500 rounded-2xl font-mono text-xl font-black text-slate-900 focus:outline-none"
              />
              <DollarSign className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
            </div>
            <p className="text-xs text-sky-700 font-bold">
              Formatted: {formatCurrency(Number(quotePrice))}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              {currentLang === 'lo' ? 'ໝາຍເຫດໃບສະເໜີລາຄາ (Quotation Notes / Terms)' : 'Quotation Terms & Notes'}
            </label>
            <textarea
              rows={3}
              placeholder="e.g. ລາຄາລວມຄ່າຈັດສົ່ງຮຽບຮ້ອຍແລ້ວ ຫຼື ຢືນຢັນສະເປັກເຈ້ຍ 130 ແກຣມ"
              value={quoteNotes}
              onChange={(e) => setQuoteNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-2xl font-semibold text-xs text-slate-800 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-sm font-extrabold transition cursor-pointer"
            >
              {currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{currentLang === 'lo' ? 'ຢືນຢັນແຈ້ງລາຄາ' : 'Submit Price Quote'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
