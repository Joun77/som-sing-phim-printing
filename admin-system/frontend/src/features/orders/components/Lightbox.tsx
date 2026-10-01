import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  RotateCw, 
  Download, 
  Loader2, 
  AlertTriangle, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Image as ImageIcon,
  ShieldCheck,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { UniversalModalShell } from '../../../components/common/UniversalExportPreviewModal';
import { downloadAuthenticatedFile } from '../../../api/client';
import { 
  useLightboxAssetController,
  clampPdfPage,
  computeNextPdfPage,
  computePrevPdfPage
} from '../utils/lightboxAssetController';

export interface LightboxPhoto {
  name: string;
  url: string;
  originalUrl?: string;
  contentType?: string;
  size?: number;
}

export interface LightboxProps {
  src?: string | null;
  title?: string;
  documentNumber?: string;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
  onClose: () => void;
  photos?: LightboxPhoto[];
  initialPhotoIndex?: number;
  onDownloadOriginal?: (item?: LightboxPhoto) => void | Promise<void>;
}

export default function Lightbox({
  src,
  title,
  documentNumber,
  fileName,
  fileSize,
  contentType,
  onClose,
  photos,
  initialPhotoIndex = 0,
  onDownloadOriginal
}: LightboxProps) {
  // 1. Stabilize normalized photo list identity to prevent rerender loops
  const photoList = useMemo<LightboxPhoto[]>(() => {
    if (photos && photos.length > 0) {
      return photos;
    }
    if (src) {
      return [{
        name: fileName || title || 'Artwork',
        url: src,
        originalUrl: src,
        contentType: contentType,
        size: fileSize
      }];
    }
    return [];
  }, [photos, src, fileName, title, contentType, fileSize]);

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (initialPhotoIndex >= 0 && initialPhotoIndex < photoList.length) {
      return initialPhotoIndex;
    }
    return 0;
  });

  // Clamp currentIndex if photoList length changes
  useEffect(() => {
    setCurrentIndex((prev) => {
      if (photoList.length === 0) return 0;
      if (prev >= photoList.length) return photoList.length - 1;
      if (prev < 0) return 0;
      return prev;
    });
  }, [photoList.length]);

  const activeItem: LightboxPhoto | undefined = photoList[currentIndex];
  // Stable identity key for current asset
  const activeKey = activeItem ? `${activeItem.url}::${activeItem.name}` : '';

  // Visual controls
  const [zoomScale, setZoomScale] = useState<number>(0.9);
  const [rotation, setRotation] = useState<number>(0);
  const [pdfPage, setPdfPage] = useState<number>(1);

  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Reset zoom, rotation & page when switching items
  useEffect(() => {
    setZoomScale(0.9);
    setRotation(0);
    setPdfPage(1);
  }, [activeKey]);

  // Production hook managing lifecycle, request generation, React StrictMode, and memory cleanup
  const {
    loadingStatus,
    errorMessage,
    resolvedBlobUrl,
    resolvedType,
    resolvedSize,
    pdfPageCount,
    reload,
  } = useLightboxAssetController({
    activeItem,
    fileSize,
  });

  // Keyboard navigation for gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && photoList.length > 1) {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photoList.length - 1));
      } else if (e.key === 'ArrowRight' && photoList.length > 1) {
        setCurrentIndex((prev) => (prev < photoList.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photoList.length, onClose]);

  const handleDownload = async () => {
    if (!activeItem) return;
    if (onDownloadOriginal) {
      try {
        setIsDownloading(true);
        await onDownloadOriginal(activeItem);
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    try {
      setIsDownloading(true);
      const target = activeItem.originalUrl || activeItem.url;
      const fallbackName = activeItem.name || fileName || (resolvedType.includes('pdf') ? 'artwork.pdf' : 'artwork.jpg');
      await downloadAuthenticatedFile(target, fallbackName);
    } catch (err: any) {
      console.error('[Lightbox] Download failed:', err);
      alert(`ດາວໂຫຼດບໍ່ສຳເລັດ: ${err.message || 'Download error'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const isPdf = resolvedType.includes('pdf') || (activeItem?.name || '').toLowerCase().endsWith('.pdf');
  const isImage = resolvedType.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg)$/i.test(activeItem?.name || '');

  const displayTitle = activeItem?.name || fileName || title || 'Artwork Preview';
  const formattedSize = resolvedSize > 0 ? `${(resolvedSize / (1024 * 1024)).toFixed(2)} MB` : '';

  // Left action group: Zoom & Rotate & PDF Page Navigation
  const toolbarLeft = (
    <div className="flex items-center flex-wrap gap-2">
      {/* Zoom Controls */}
      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setZoomScale((prev) => Math.max(0.4, Number((prev - 0.1).toFixed(1))))}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono font-bold text-slate-700 px-2 min-w-[50px] text-center">
          {Math.round(zoomScale * 100)}%
        </span>
        <button
          onClick={() => setZoomScale((prev) => Math.min(2.5, Number((prev + 0.1).toFixed(1))))}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoomScale(0.9);
            setRotation(0);
          }}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors ml-1 cursor-pointer"
          title="Reset Zoom & Rotation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Image Rotate 90° */}
      {isImage && (
        <button
          onClick={() => setRotation((prev) => (prev + 90) % 360)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          title="Rotate Image 90° Clockwise"
        >
          <RotateCw className="w-3.5 h-3.5 text-slate-600" />
          <span>ໝຸນ 90°</span>
        </button>
      )}

      {/* PDF Page Navigation */}
      {isPdf && (
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setPdfPage((p) => computePrevPdfPage(p))}
            disabled={pdfPage <= 1}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
            title="Previous Page"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-700 px-2 min-w-[75px] text-center">
            {pdfPageCount ? `Page ${clampPdfPage(pdfPage, pdfPageCount)} / ${pdfPageCount}` : `Page ${clampPdfPage(pdfPage, null)}`}
          </span>
          <button
            onClick={() => setPdfPage((p) => computeNextPdfPage(p, pdfPageCount))}
            disabled={pdfPageCount !== null && pdfPage >= pdfPageCount}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
            title="Next Page"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  // Right action group: Gallery Navigation + Download Original
  const toolbarRight = (
    <div className="flex items-center flex-wrap gap-2">
      {photoList.length > 1 && (
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs mr-2">
          <button
            onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photoList.length - 1))}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            title="Previous Item (Arrow Left)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-700 px-2 min-w-[70px] text-center">
            {currentIndex + 1} / {photoList.length}
          </span>
          <button
            onClick={() => setCurrentIndex((prev) => (prev < photoList.length - 1 ? prev + 1 : 0))}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            title="Next Item (Arrow Right)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Format & Size Badge */}
      <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-xl bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
        {isPdf ? 'PDF Vector' : isImage ? 'Image Asset' : 'Binary File'} {formattedSize && `• ${formattedSize}`}
      </span>

      {/* Download Original File Button */}
      <button
        onClick={handleDownload}
        disabled={isDownloading || loadingStatus !== 'success'}
        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
        title="Download exact original binary file"
      >
        {isDownloading ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          <Download className="w-4 h-4 text-white" />
        )}
        <span>ດາວໂຫຼດຕົ້ນສະບັບ</span>
      </button>
    </div>
  );

  const footerLeft = (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <ShieldCheck className="w-4 h-4 text-emerald-600" />
      <span>ຢືນຢັນສິດການເຂົ້າເຖິງໄຟລ໌ສ່ວນຕົວ (Authenticated Artwork Binary) • ບໍ່ມີການແປງຄຸນນະພາບ</span>
    </div>
  );

  const footerRight = (
    <div className="text-xs text-slate-500 font-mono">
      {isPdf ? 'Render Mode: Native High-Fidelity PDF Engine' : 'Render Mode: Original Resolution'}
    </div>
  );

  return (
    <UniversalModalShell
      isOpen={true}
      onClose={onClose}
      title={displayTitle}
      documentNumber={documentNumber || (isPdf ? 'PDF-MASTER' : 'ASSET')}
      subtitle="ສະແດງຕົວຢ່າງ ແລະ ດາວໂຫຼດໄຟລ໌ຕົ້ນສະບັບ (Universal Media Viewer)"
      toolbarLeft={toolbarLeft}
      toolbarRight={toolbarRight}
      footerLeft={footerLeft}
      footerRight={footerRight}
      contentContainerClassName="flex-1 overflow-auto bg-slate-900/90 p-4 sm:p-8 flex flex-col justify-center items-center custom-scrollbar relative"
    >
      {loadingStatus === 'loading' && (
        <div className="flex flex-col items-center justify-center space-y-3 p-8 bg-slate-800/80 rounded-2xl border border-slate-700 shadow-xl">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
          <span className="text-xs font-mono font-medium text-slate-300">
            ກຳລັງດຶງຂໍ້ມູນໄຟລ໌ຕົ້ນສະບັບ (Fetching authenticated media)...
          </span>
        </div>
      )}

      {loadingStatus === 'error' && (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-rose-500/30 rounded-3xl max-w-lg w-full text-center space-y-4 shadow-2xl animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white tracking-wide">
              ບໍ່ສາມາດໂຫຼດໄຟລ໌ຕົ້ນສະບັບໄດ້ (Failed to load artwork)
            </h4>
            <p className="text-xs text-rose-300 font-mono break-all leading-relaxed px-2">
              {errorMessage}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => reload()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>ລອງໃໝ່ອີກຄັ້ງ (Retry)</span>
            </button>
          </div>
        </div>
      )}

      {loadingStatus === 'success' && resolvedBlobUrl && (
        <div className="w-full h-full flex flex-col items-center justify-center overflow-auto">
          {isPdf ? (
            <div 
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out'
              }}
              className="w-full max-w-5xl h-[78vh] flex items-center justify-center"
            >
              <object
                data={`${resolvedBlobUrl}#page=${clampPdfPage(pdfPage, pdfPageCount)}&zoom=${Math.round(zoomScale * 100)}`}
                type="application/pdf"
                className="w-full h-full rounded-2xl bg-white shadow-2xl border border-slate-700"
              >
                <embed
                  src={`${resolvedBlobUrl}#page=${clampPdfPage(pdfPage, pdfPageCount)}`}
                  type="application/pdf"
                  className="w-full h-full rounded-2xl"
                />
                <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-3 bg-white text-slate-800 rounded-2xl">
                  <FileText className="w-12 h-12 text-slate-400" />
                  <p className="text-sm font-bold">Browser does not support direct PDF object rendering</p>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold"
                  >
                    Download Original PDF
                  </button>
                </div>
              </object>
            </div>
          ) : isImage ? (
            <div className="flex items-center justify-center min-h-[300px] max-h-[80vh] overflow-hidden">
              <img
                src={resolvedBlobUrl}
                alt={displayTitle}
                style={{
                  transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out'
                }}
                className="max-h-[76vh] max-w-full object-contain rounded-xl shadow-2xl select-none"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-800 border border-slate-700 rounded-3xl max-w-md w-full text-center space-y-4 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-slate-700 text-slate-300 flex items-center justify-center">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-mono truncate">{displayTitle}</h4>
                <p className="text-xs text-slate-400 mt-1 font-mono">{resolvedType} • {formattedSize}</p>
              </div>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ດາວໂຫຼດໄຟລ໌ຕົ້ນສະບັບ</span>
              </button>
            </div>
          )}

          {/* Bottom Thumbnails Strip for Multi-item Galleries (e.g. 16 images or split items) */}
          {photoList.length > 1 && (
            <div className="mt-4 flex items-center gap-2 overflow-x-auto max-w-4xl p-2 bg-slate-800/80 rounded-2xl border border-slate-700/80 custom-scrollbar shrink-0">
              {photoList.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    idx === currentIndex
                      ? 'border-sky-400 scale-105 shadow-md shadow-sky-500/20'
                      : 'border-slate-600 opacity-60 hover:opacity-100 hover:border-slate-400'
                  }`}
                  title={item.name}
                >
                  {item.contentType?.includes('pdf') || item.name.toLowerCase().endsWith('.pdf') ? (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center text-rose-400">
                      <FileText className="w-5 h-5" />
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </UniversalModalShell>
  );
}
