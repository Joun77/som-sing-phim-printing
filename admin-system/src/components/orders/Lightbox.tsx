import React from 'react';

export default function Lightbox({ src, title, onClose }) {
  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
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
                <span>Download</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
            >
              <span className="font-extrabold text-sm px-1">✕</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-slate-900/5 flex items-center justify-center min-h-[300px] max-h-[80vh] overflow-auto p-4">
          {isImage ? (
            <img
              src={src}
              alt={title || "Preview"}
              className="max-h-[70vh] max-w-full object-contain p-2"
            />
          ) : (
            <iframe
              src={src}
              title={title}
              className="w-full h-[70vh] border-none rounded-xl bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}
