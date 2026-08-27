import React, { useState } from 'react';
import { 
  Layers3, 
  Search, 
  Save, 
  FileText, 
  User, 
  Phone, 
  Layers, 
  Edit3, 
  ShieldAlert, 
  CheckCircle2, 
  Trash2 
} from 'lucide-react';
import { FormModalTemplate } from '@components/common/FormModalTemplate';
import { Quotation } from '@features/pricing/types';

interface QuotationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotations: Quotation[];
  onLoad: (quote: Quotation) => void;
  onRevise: (quoteId: string) => void;
  onDelete: (quote: Quotation) => void;
  onConvertToOrder: (quote: Quotation) => void;
  onOpenApproval: (quote: Quotation) => void;
  onSaveDraft: () => void;
  currentLang: string;
  formatCurrency: (val: number) => string;
}

export const QuotationHistoryModal: React.FC<QuotationHistoryModalProps> = ({
  isOpen,
  onClose,
  quotations,
  onLoad,
  onRevise,
  onDelete,
  onConvertToOrder,
  onOpenApproval,
  onSaveDraft,
  currentLang,
  formatCurrency,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQuotes = quotations.filter((q) => {
    if (!searchQuery.trim()) return true;
    const qry = searchQuery.toLowerCase();
    const qNum = (q.quotationNumber || '').toLowerCase();
    const cName = (q.customerName || '').toLowerCase();
    const cPhone = (q.phone || '').toLowerCase();
    const qTitle = (q.title || '').toLowerCase();
    const itemNames = (q.items || [])
      .map((it: any) => (it.name || '').toLowerCase())
      .join(' ');
    return (
      qNum.includes(qry) ||
      cName.includes(qry) ||
      cPhone.includes(qry) ||
      qTitle.includes(qry) ||
      itemNames.includes(qry)
    );
  });

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<Layers3 className="w-6 h-6 text-white" />}
      title={
        currentLang === 'lo'
          ? 'ປະຫວັດໃບສະເໜີລາຄາ & ເວີຊັນ'
          : 'Quotation History & Versions'
      }
      subtitle={
        currentLang === 'lo'
          ? 'ຄົ້ນຫາ, ແກ້ໄຂ, ໂຫຼດ, ລົບ ແລະ ຕິດຕາມສະບັບຮ່າງໃບສະເໜີລາຄາທັງໝົດ'
          : 'Search, load, edit, delete, and track all quotation drafts.'
      }
      maxWidthClass="max-w-7xl"
      badgeText={`${quotations.length} ລາຍການ`}
      footerActions={
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          {currentLang === 'lo' ? 'ປິດ' : 'Close'}
        </button>
      }
    >
      <div className="p-5 sm:p-7 space-y-4">
        {/* Top Search Bar & Save Current Draft Action */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ຄົ້ນຫາເລກທີໃບສະເໜີ, ຊື່ລູກຄ້າ, ເບີໂທ, ຊື່ສິນຄ້າ..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-accent-sky focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={onSaveDraft}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>+ ບັນທຶກໜ້າປັດຈຸບັນເປັນສະບັບຮ່າງ (Draft)</span>
          </button>
        </div>

        {filteredQuotes.length === 0 ? (
          <div className="text-center py-12 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-400 text-xs font-bold">
              {currentLang === 'lo'
                ? 'ຍັງບໍ່ມີໃບສະເໜີລາຄາທີ່ບັນທຶກໄວ້'
                : 'No saved quotations found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-1 scrollbar-thin">
            {filteredQuotes.map((quote) => (
              <div
                key={quote.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-accent-sky/50 transition-all shadow-xs space-y-3.5"
              >
                {/* Header Row: Number, Status, Customer Name, Phone & Total */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-slate-900 text-sm bg-slate-100 px-2 py-0.5 rounded-lg">
                      {quote.quotationNumber}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        quote.status === 'Draft'
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : quote.status === 'Accepted' || quote.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : quote.status === 'REQUIRES_MANAGER_APPROVAL'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : quote.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : quote.status === 'Expired'
                          ? 'bg-slate-100 text-slate-500 border-slate-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {quote.status === 'Draft'
                        ? 'ສະບັບຮ່າງ (Draft)'
                        : quote.status === 'REQUIRES_MANAGER_APPROVAL'
                        ? 'ລໍຖ້າອະນຸມັດ'
                        : quote.status}
                    </span>

                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{quote.customerName || 'ລູກຄ້າທົ່ວໄປ'}</span>
                    </span>

                    {quote.phone && (
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5 text-indigo-500" />
                        <span>{quote.phone}</span>
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-sans">
                      ຍອດລວມຂາຍ
                    </span>
                    <span className="text-base font-black text-primary-navy font-sans">
                      {formatCurrency(quote.grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Job Details & Specs List */}
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        ລາຍລະອຽດງານທີ່ສັ່ງພິມ ({quote.items?.length || 0} ລາຍການ):
                      </span>
                    </span>
                    {quote.title && (
                      <span className="text-slate-600 font-semibold truncate max-w-[200px]">
                        {quote.title}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {(quote.items || []).map((qItem: any, itIdx: number) => (
                      <div
                        key={qItem.id || itIdx}
                        className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5 flex-1 min-w-[220px]">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center">
                              {itIdx + 1}
                            </span>
                            <span>{qItem.name}</span>
                            <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 text-[10px] rounded font-mono font-bold border border-emerald-200">
                              {qItem.quantity} ຫົວ
                            </span>
                          </div>
                          {qItem.specSummary && (
                            <p className="text-[10px] text-slate-500 font-medium pl-5">
                              {qItem.specSummary}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-slate-800 font-sans">
                            {formatCurrency(qItem.subtotal || qItem.totalPrice || 0)}
                          </span>
                          {qItem.unitPrice && (
                            <span className="text-[10px] text-slate-400 block font-sans">
                              (@ {formatCurrency(qItem.unitPrice)}/ຫົວ)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Versions Sub-rows */}
                {(quote.versions || []).length > 1 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      ປະຫວັດເວີຊັນ:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {quote.versions.map((v: any) => (
                        <span
                          key={v.version}
                          className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200"
                        >
                          v{v.version} ({v.date}) - {formatCurrency(v.total)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions Bar: Edit/Load, Revise, Convert to Order, Delete */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Edit / Load Button */}
                    <button
                      type="button"
                      onClick={() => onLoad(quote)}
                      className="px-3.5 py-1.5 text-xs font-black bg-primary-navy text-white rounded-xl hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                      title="ແກ້ໄຂ / ໂຫຼດໃສ່ເຄື່ອງຄິດເລກ"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {currentLang === 'lo' ? 'ແກ້ໄຂ / ໂຫຼດງານ' : 'Edit / Load'}
                      </span>
                    </button>

                    {/* Revise Button */}
                    <button
                      type="button"
                      onClick={() => onRevise(quote.id)}
                      className="px-3 py-1.5 text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-100 transition cursor-pointer"
                    >
                      {currentLang === 'lo'
                        ? `ສ້າງເວີຊັນ v${(quote.version || 1) + 1}`
                        : `Revise → v${(quote.version || 1) + 1}`}
                    </button>

                    {quote.status === 'REQUIRES_MANAGER_APPROVAL' && (
                      <button
                        type="button"
                        onClick={() => onOpenApproval(quote)}
                        className="px-3 py-1.5 text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>
                          {currentLang === 'lo'
                            ? 'ອະນຸມັດສ່ວນຫຼຸດ'
                            : 'Review Approval'}
                        </span>
                      </button>
                    )}

                    {(quote.status === 'Pending' ||
                      quote.status === 'Approved' ||
                      quote.status === 'Draft') && (
                      <button
                        type="button"
                        onClick={() => onConvertToOrder(quote)}
                        className="px-3.5 py-1.5 text-xs font-black bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition cursor-pointer shadow-2xs flex items-center gap-1"
                      >
                        <span>
                          {currentLang === 'lo'
                            ? 'ປ່ຽນເປັນອໍເດີ →'
                            : 'Convert to Order →'}
                        </span>
                      </button>
                    )}

                    {quote.convertedOrderId && (
                      <span className="px-2 py-1 text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {currentLang === 'lo' ? 'ປ່ຽນເປັນອໍເດີແລ້ວ' : 'Converted'} (
                          {quote.convertedOrderId})
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => onDelete(quote)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="Delete quotation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FormModalTemplate>
  );
};
