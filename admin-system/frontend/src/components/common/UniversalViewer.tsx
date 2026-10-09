import ArtworkThumbnail from './ArtworkThumbnail';
import { useTranslation } from 'react-i18next';
import { formatMediaSize, getMediaViewerCopy } from './mediaViewerCopy';
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
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import PdfCanvasPreview, { type PdfFit } from './PdfCanvasPreview';
import { UniversalModalShell } from './UniversalExportPreviewModal';
import { downloadAuthenticatedFile } from '../../api/client';
import { 
  useLightboxAssetController,
  clampPdfPage,
  computeNextPdfPage,
  computePrevPdfPage
} from '../../features/orders/utils/lightboxAssetController';

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
  embedded?: boolean;
  language?: string;
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
  onDownloadOriginal,
  embedded = false,
  language: requestedLanguage
}: LightboxProps) {
  const { i18n } = useTranslation();
  const language = requestedLanguage || i18n.resolvedLanguage || i18n.language || 'lo';
  const copy = getMediaViewerCopy(language);
  // 1. Stabilize normalized photo list identity to prevent rerender loops
  const photoList = useMemo<LightboxPhoto[]>(() => {
    if (photos && photos.length > 0) {
      return photos;
    }
    if (src) {
      return [{
        name: fileName || title || copy.preview,
        url: src,
        originalUrl: src,
        contentType: contentType,
        size: fileSize
      }];
    }
    return [];
  }, [photos, src, fileName, title, contentType, fileSize, copy.preview]);

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
  const activeKey = activeItem ? `${activeItem.originalUrl || activeItem.url}::${activeItem.url}::${activeItem.name}` : '';

  // Visual controls
  const [zoomScale, setZoomScale] = useState<number>(0.9);
  const [pdfFit, setPdfFit] = useState<PdfFit>('page');
  const [imageError, setImageError] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
  const [pdfPage, setPdfPage] = useState<number>(1);

  const downloadGeneration = useRef(0);
  const [downloadError, setDownloadError] = useState('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Reset zoom, rotation & page when switching items
  useEffect(() => {
    downloadGeneration.current++; setIsDownloading(false); setDownloadError('');
    setZoomScale(0.9);
    setRotation(0);
    setPdfPageCount(null); setPdfPage(1); setImageError(false); setPdfFit('page'); setPan({ x: 0, y: 0 });
  }, [activeKey]);

  // Production hook managing lifecycle, request generation, React StrictMode, and memory cleanup
  const {
    loadingStatus,
    errorMessage,
    errorKind,
    resolvedBlobUrl,
    resolvedBlob, resolvedPdfRange,
    resolvedType,
    resolvedSize,
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

      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photoList.length, onClose, embedded]);

  const handleDownload = async () => {
    if (!activeItem) return;
    const active = downloadGeneration.current; setDownloadError(''); setIsDownloading(true);
    try {
      if (onDownloadOriginal) await onDownloadOriginal(activeItem);
      else {
        const target = activeItem.originalUrl || activeItem.url;
        const fallbackName = activeItem.name || fileName || (resolvedType.includes('pdf') ? 'artwork.pdf' : 'artwork.jpg');
        await downloadAuthenticatedFile(target, fallbackName);
      }
    } catch { if (active === downloadGeneration.current) setDownloadError(copy.downloadError); }
    finally { if (active === downloadGeneration.current) setIsDownloading(false); }
  };

  const isPdf = resolvedType.includes('pdf') || Boolean(activeItem?.name?.toLowerCase().endsWith('.pdf') || activeItem?.url?.toLowerCase().includes('.pdf') || fileName?.toLowerCase().endsWith('.pdf'));
  const isImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'].includes(resolvedType) ||
    (!isPdf && Boolean(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'].some(ext => (activeItem?.name || activeItem?.url || fileName || '').toLowerCase().includes(ext))));

  const displayTitle = activeItem?.name || fileName || title || copy.preview;
  const formattedSize = formatMediaSize(resolvedSize, language);

  // Left action group: Zoom & Rotate & PDF Page Navigation
  const toolbarLeft = (
    <div className="flex items-center flex-wrap gap-2">
      {/* Zoom Controls */}
      {(isPdf || isImage) && <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
        <button
          onClick={() => { setPdfFit('zoom'); setZoomScale(prev => Math.max(0.1, Number((prev - 0.1).toFixed(1)))); }}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title={copy.zoomOut} aria-label={copy.zoomOut}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono font-bold text-slate-700 px-2 min-w-[50px] text-center">
          {isPdf && pdfFit !== 'zoom' ? (pdfFit === 'page' ? copy.fitPage : copy.fitWidth) : `${Math.round(zoomScale * 100)}%`}
        </span>
        <button
          onClick={() => { setPdfFit('zoom'); setZoomScale(prev => Math.min(4, Number((prev + 0.1).toFixed(1)))); }}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title={copy.zoomIn} aria-label={copy.zoomIn}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoomScale(0.9);
            setRotation(0); setPdfFit('page'); setPan({ x: 0, y: 0 });
          }}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors ml-1 cursor-pointer"
          title={copy.reset} aria-label={copy.reset}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>}

      {/* Image Rotate 90° */}
      {isImage && (
        <button
          onClick={() => setRotation((prev) => (prev + 90) % 360)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          title={copy.rotate} aria-label={copy.rotate}
        >
          <RotateCw className="w-3.5 h-3.5 text-slate-600" />
          <span>{copy.rotate}</span>
        </button>
      )}

      {isPdf && <><button type="button" title={copy.fitPageTitle} aria-label={copy.fitPageTitle} onClick={() => setPdfFit('page')} aria-pressed={pdfFit === 'page'}>{copy.fitPage}</button><button type="button" title={copy.fitWidthTitle} aria-label={copy.fitWidthTitle} onClick={() => setPdfFit('width')} aria-pressed={pdfFit === 'width'}>{copy.fitWidth}</button><label className="text-slate-700 text-xs">{copy.page} <input aria-label={copy.pageNumber} type="number" min={1} max={pdfPageCount || undefined} value={pdfPage} onChange={e => setPdfPage(clampPdfPage(Number(e.target.value) || 1, pdfPageCount))} className="w-16 border rounded px-2 py-1" /></label></>}
      {/* PDF Page Navigation */}
      {isPdf && (
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setPdfPage((p) => computePrevPdfPage(p))}
            disabled={pdfPage <= 1}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
            title={copy.previousPage} aria-label={copy.previousPage}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-700 px-2 min-w-[75px] text-center">
            {pdfPageCount ? `${copy.page} ${clampPdfPage(pdfPage, pdfPageCount)} / ${pdfPageCount}` : `${copy.page} ${clampPdfPage(pdfPage, null)}`}
          </span>
          <button
            onClick={() => setPdfPage((p) => computeNextPdfPage(p, pdfPageCount))}
            disabled={pdfPageCount !== null && pdfPage >= pdfPageCount}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
            title={copy.nextPage} aria-label={copy.nextPage}
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
            title={copy.previousItem} aria-label={copy.previousItem}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-700 px-2 min-w-[70px] text-center">
            {currentIndex + 1} / {photoList.length}
          </span>
          <button
            onClick={() => setCurrentIndex((prev) => (prev < photoList.length - 1 ? prev + 1 : 0))}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            title={copy.nextItem} aria-label={copy.nextItem}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Format & Size Badge */}
      <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-xl bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
        {loadingStatus === 'loading' || loadingStatus === 'idle' ? copy.loading : loadingStatus === 'error' ? copy.unavailable : isPdf ? copy.pdf : isImage ? copy.image : copy.binary} {formattedSize && `• ${formattedSize}`}
      </span>

      {/* Download Original File Button */}
      <button
        onClick={handleDownload}
        disabled={isDownloading || loadingStatus !== 'success'}
        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
        title={copy.downloadTitle} aria-label={copy.downloadTitle}
      >
        {isDownloading ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          <Download className="w-4 h-4 text-white" />
        )}
        <span>{copy.download}</span>
      </button>
    </div>
  );

  const content = (<>
      {downloadError && <p role="alert" className="text-rose-300">{downloadError}</p>}
      {loadingStatus === 'loading' && (
        <div className="flex flex-col items-center justify-center space-y-3 p-8 bg-slate-800/80 rounded-2xl border border-slate-700 shadow-xl">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
          <span className="text-xs font-mono font-medium text-slate-300">
            {copy.loading}
          </span>
        </div>
      )}

      {loadingStatus === 'error' && (
        <div role="alert" className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-rose-500/30 rounded-3xl max-w-lg w-full text-center space-y-4 shadow-2xl animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white tracking-wide">
              {copy.unavailable}
            </h4>
            <p className="text-xs text-rose-300 font-mono break-all leading-relaxed px-2">
              {errorKind === 'temporary-unavailable' ? copy.temporaryError : errorKind === 'missing' ? copy.missingError : language.startsWith('lo') ? copy.loadError : errorMessage || copy.loadError}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => reload()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{copy.retry}</span>
            </button>
          </div>
        </div>
      )}

      {loadingStatus === 'success' && resolvedBlobUrl && (
        <div className="w-full h-full min-h-0 flex flex-col items-center overflow-hidden">
          {isPdf ? (
            resolvedBlob ? <PdfCanvasPreview key={resolvedBlobUrl} blob={resolvedBlob} pdfRange={resolvedPdfRange} language={language} page={clampPdfPage(pdfPage, pdfPageCount)} scale={zoomScale} fit={pdfFit} onPageChange={setPdfPage} onPageCount={setPdfPageCount} sourceUrl={resolvedBlobUrl} onRetry={reload} /> : <p role="alert">{copy.pdfError}</p>
          ) : isImage ? imageError ? <div role="alert" className="text-white">{copy.imageError}<button type="button" onClick={() => { setImageError(false); reload(); }}>{copy.retry}</button></div> : (
            <div className="flex items-center justify-center min-h-[300px] w-full h-full overflow-hidden cursor-grab touch-none" onPointerDown={e => { drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }; e.currentTarget.setPointerCapture?.(e.pointerId); }} onPointerMove={e => { if (drag.current) setPan({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
              <img
                src={resolvedBlobUrl}
                onError={() => setImageError(true)}
                draggable={false}
                alt={displayTitle}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomScale}) rotate(${rotation}deg)`,
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
                <p className="text-xs text-slate-400 mt-1">{copy.unsupported}</p><p className="text-xs text-slate-400">{resolvedType} • {formattedSize}</p>
              </div>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{copy.download}</span>
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
                    <ArtworkThumbnail url={item.url} name={item.name} language={language} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
  </>);
  if (embedded) return <section data-testid="universal-viewer-embedded" aria-label={copy.preview} className="w-full h-full min-h-0 flex flex-col overflow-hidden bg-slate-900 rounded-xl">
    <div className="shrink-0 p-2 bg-slate-50 border-b flex flex-wrap justify-between gap-2">{toolbarLeft}{toolbarRight}</div>
    <div className="flex-1 min-h-0 overflow-hidden p-2 flex flex-col items-center relative">{content}</div>
  </section>;
  return (
    <UniversalModalShell
      isOpen={true}
      zIndex="z-[999999]"
      onClose={onClose}
      title={displayTitle}
      documentNumber={documentNumber || (isPdf ? 'PDF-MASTER' : 'ASSET')}
      subtitle={copy.subtitle} closeLabel={copy.close} showFooter={false}
      toolbarLeft={toolbarLeft}
      toolbarRight={toolbarRight}
      contentContainerClassName="flex-1 overflow-hidden bg-slate-900/90 p-2 flex flex-col items-center custom-scrollbar relative"
    >
      {content}
    </UniversalModalShell>
  );
}
