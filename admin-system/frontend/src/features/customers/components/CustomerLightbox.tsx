import React, { useEffect } from 'react';
import { Download, X, ExternalLink } from 'lucide-react';

interface CustomerLightboxProps {
  src: string;
  title: string;
  onClose: () => void;
}

export function CustomerLightbox({ src, title, onClose }: CustomerLightboxProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const isImage = src && /\.(jpg|jpeg|png|gif|webp|svg)/i.test(src);

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b bg-slate-50">
          <span className="text-sm font-black text-slate-700 truncate">{title}</span>
          <div className="flex items-center gap-2">
            {src && (
              <a
                href={src}
                download
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-sky text-white rounded-xl text-xs font-black hover:bg-sky-600 transition animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex items-center justify-center bg-slate-900 min-h-[300px] max-h-[70vh]">
          {isImage ? (
            <img
              src={src}
              alt={title}
              className="max-h-[70vh] max-w-full object-contain p-2"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center px-8">
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                <ExternalLink className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-300 text-sm font-semibold leading-relaxed">
                ໄຟລ໌ນີ້ບໍ່ສາມາດສະແດງໃນ Preview ໄດ້<br />
                <span className="text-slate-400 text-xs">(ເຊັ່ນ: Google Drive, PDF)</span>
              </p>
              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-xl font-black text-sm hover:bg-slate-100 transition shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                ເປີດໃນ Browser ໃໝ່
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
