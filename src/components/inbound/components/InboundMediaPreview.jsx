import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Image as ImageIcon, Receipt, X, ZoomIn } from 'lucide-react';

export default function InboundMediaPreview({ itemPhoto, paymentSlip, lang = 'lo' }) {
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);
  const [activeLightboxTitle, setActiveLightboxTitle] = useState('');

  const openLightbox = (imgSrc, title) => {
    setActiveLightboxImage(imgSrc);
    setActiveLightboxTitle(title);
  };

  const closeLightbox = () => {
    setActiveLightboxImage(null);
    setActiveLightboxTitle('');
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Item Photo */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <ImageIcon className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-black tracking-wider">
              {lang === 'en' ? 'Item / Machine Photo' : 'ຮູບພາບສິນຄ້າ / ເຄື່ອງຈັກ'}
            </span>
          </div>
          {itemPhoto ? (
            <div
              onClick={() => openLightbox(itemPhoto, lang === 'en' ? 'Item / Machine Photo' : 'ຮູບພາບສິນຄ້າ / ເຄື່ອງຈັກ')}
              className="group relative h-52 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center overflow-hidden cursor-pointer hover:border-sky-400 transition"
            >
              <img src={itemPhoto} alt="Item Photo" className="w-full h-full object-contain rounded-lg" />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white font-black text-xs">
                <ZoomIn className="w-5 h-5" />
                <span>{lang === 'en' ? 'Click to Enlarge' : 'ກົດເພື່ອຂະຫຍາຍ'}</span>
              </div>
            </div>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400 space-y-1">
              <ImageIcon className="w-8 h-8 text-slate-300" />
              <span className="italic font-normal">
                {lang === 'en' ? 'No Data' : 'ບໍ່ມີຂໍ້ມູນ'}
              </span>
            </div>
          )}
        </div>

        {/* Payment Slip */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black tracking-wider">
              {lang === 'en' ? 'Payment Slip Attachment' : 'ຫຼັກຖານການຈ່າຍເງິນ / ສະລິບ'}
            </span>
          </div>
          {paymentSlip ? (
            <div
              onClick={() => openLightbox(paymentSlip, lang === 'en' ? 'Payment Slip Attachment' : 'ຫຼັກຖານການຈ່າຍເງິນ / ສະລິບ')}
              className="group relative h-52 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center overflow-hidden cursor-pointer hover:border-emerald-400 transition"
            >
              <img src={paymentSlip} alt="Payment Slip" className="w-full h-full object-contain rounded-lg" />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white font-black text-xs">
                <ZoomIn className="w-5 h-5" />
                <span>{lang === 'en' ? 'Click to Enlarge' : 'ກົດເພື່ອຂະຫຍາຍ'}</span>
              </div>
            </div>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400 space-y-1">
              <Receipt className="w-8 h-8 text-slate-300" />
              <span className="italic font-normal">
                {lang === 'en' ? 'No Data' : 'ບໍ່ມີຂໍ້ມູນ'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal Portal */}
      {activeLightboxImage &&
        ReactDOM.createPortal(
          <div
            onClick={closeLightbox}
            className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in"
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
              <div className="w-full flex items-center justify-between px-4 py-2 text-white border-b border-white/10 mb-3">
                <span className="text-sm font-black">{activeLightboxTitle}</span>
                <button
                  onClick={closeLightbox}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <img
                src={activeLightboxImage}
                alt="Full Preview"
                className="max-h-[80vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
