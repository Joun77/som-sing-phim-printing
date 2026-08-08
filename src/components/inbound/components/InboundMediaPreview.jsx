import React from 'react';
import { Image as ImageIcon, Receipt } from 'lucide-react';

export default function InboundMediaPreview({ itemPhoto, paymentSlip }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Item Photo */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
        <div className="flex items-center gap-2 text-slate-700">
          <ImageIcon className="w-4 h-4 text-sky-600" />
          <span className="text-xs font-black uppercase tracking-wider">ຮູບພາບສິນຄ້າ / ເຄື່ອງຈັກ (Item Photo)</span>
        </div>
        {itemPhoto ? (
          <div className="h-52 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center overflow-hidden">
            <img src={itemPhoto} alt="Item Photo" className="w-full h-full object-contain rounded-lg" />
          </div>
        ) : (
          <div className="h-52 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400 space-y-1">
            <ImageIcon className="w-8 h-8 text-slate-300" />
            <span>ບໍ່ມີຮູບພາບສິນຄ້າ (No Item Photo)</span>
          </div>
        )}
      </div>

      {/* Payment Slip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
        <div className="flex items-center gap-2 text-slate-700">
          <Receipt className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-black uppercase tracking-wider">ຫຼັກຖານການຈ່າຍເງິນ / ສະລິບ (Payment Slip)</span>
        </div>
        {paymentSlip ? (
          <div className="h-52 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center overflow-hidden">
            <img src={paymentSlip} alt="Payment Slip" className="w-full h-full object-contain rounded-lg" />
          </div>
        ) : (
          <div className="h-52 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400 space-y-1">
            <Receipt className="w-8 h-8 text-slate-300" />
            <span>ບໍ່ມີສະລິບການຈ່າຍເງິນ (No Payment Slip)</span>
          </div>
        )}
      </div>
    </div>
  );
}
