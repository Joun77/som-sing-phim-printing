import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import type { AuthenticatedPdfRange } from '../../api/client';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { getMediaViewerCopy } from './mediaViewerCopy';
import { configurePdfWorker } from '../../lib/pdfWorker';

export type PdfFit = 'page' | 'width' | 'zoom';

function PageCanvas({ document, page, scale, sourceUrl, fit = 'zoom', thumbnail = false, onRetry, onPaint, language = 'lo' }: { language?: string; document: PDFDocumentProxy; page: number; scale: number; sourceUrl?: string; fit?: PdfFit; thumbnail?: boolean; onRetry?: () => void; onPaint?: (ready: boolean) => void }) {
  const copy = getMediaViewerCopy(language);
  const canvas = useRef<HTMLCanvasElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [painting, setPainting] = useState(true);
  const [hasPaint, setHasPaint] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const target = host.current;
    if (!target || thumbnail || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setSize(previous => { const width = Math.floor(entry.contentRect.width); const height = Math.floor(entry.contentRect.height); return previous.width === width && previous.height === height ? previous : { width, height }; }));
    observer.observe(target); return () => observer.disconnect();
  }, [thumbnail]);
  useEffect(() => {
    let active = true;
    let render: ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']> | undefined;
    let pdfPage: Awaited<ReturnType<PDFDocumentProxy['getPage']>> | undefined;
    setError(''); setPainting(true);
    void (async () => {
      try {
        pdfPage = await document.getPage(Math.max(1, Math.min(page, document.numPages)));
        if (!active || !canvas.current) return;
        const original = pdfPage.getViewport({ scale: 1 });
        const fitted = thumbnail ? Math.min(96 / original.width, 112 / original.height) : fit !== 'zoom' && size.width > 0
          ? Math.min((size.width - 32) / original.width, fit === 'page' && size.height > 0 ? (size.height - 32) / original.height : Infinity) : scale;
        const displayScale = Math.max(0.05, fitted);
        const ratio = thumbnail ? 1 : Math.min(window.devicePixelRatio || 1, 3);
        const viewport = pdfPage.getViewport({ scale: displayScale * ratio });
        // Paint off-screen: keep the last completed page and viewport visible during zoom.
        const target = window.document.createElement('canvas');
        target.width = Math.ceil(viewport.width); target.height = Math.ceil(viewport.height);
        target.style.width = `${original.width * displayScale}px`; target.style.height = `${original.height * displayScale}px`;
        target.dataset.widthPoints = String(original.width); target.dataset.heightPoints = String(original.height);
        const context = target.getContext('2d');
        if (!context) throw new Error('PDF preview requires a 2D canvas context');
        render = pdfPage.render({ canvasContext: context, viewport });
        await render.promise;
        if (active && canvas.current) {
          const visible = canvas.current;
          visible.width = target.width; visible.height = target.height;
          visible.style.width = target.style.width; visible.style.height = target.style.height;
          visible.dataset.widthPoints = target.dataset.widthPoints; visible.dataset.heightPoints = target.dataset.heightPoints;
          visible.dataset.paintedPage = String(page); visible.dataset.paintedScale = String(scale);
          const visibleContext = visible.getContext('2d');
          if (!visibleContext) throw new Error('PDF preview requires a 2D canvas context');
          visibleContext.drawImage(target, 0, 0);
          setHasPaint(true); setPainting(false); onPaint?.(true);
        }
      } catch (e) { if (active) { setError(copy.pdfError); setPainting(false); } }
      // Document destruction owns cleanup; main and thumbnail can share the same PDF page.
    })();
    return () => { active = false; render?.cancel(); /* document destroy owns page cleanup: main and thumbnail can share a page */ };
  }, [document, page, scale, fit, fit === 'zoom' ? 0 : size.width, fit === 'zoom' ? 0 : size.height, thumbnail, onPaint, copy.pdfError]);
  return <div ref={host} className={thumbnail ? 'flex justify-center h-28 overflow-hidden' : 'flex-1 min-w-0 min-h-0 h-full overflow-hidden relative'} data-testid={thumbnail ? 'pdf-thumbnail' : 'pdf-canvas-preview'}>
    {painting && !error && <span role="status" className="absolute top-1 right-2 z-10 text-xs text-slate-300">{thumbnail ? '…' : copy.rendering}</span>}
    {error && <div><p role="alert" className="text-rose-600">{error}</p>{onRetry && <button type="button" onClick={onRetry}>{copy.retry}</button>}</div>}
    <div className={thumbnail ? "w-full h-full overflow-hidden flex items-center justify-center p-0" : "w-full h-full overflow-auto flex flex-col items-center p-4"}><canvas ref={canvas} aria-label={thumbnail ? `${copy.thumbnail} ${page}` : `${copy.pdfPage} ${page}`} data-source={sourceUrl} data-page={page} data-scale={scale} hidden={!hasPaint || !!error} className="bg-white shadow-xl shrink-0" /></div>
  </div>;
}

/** One original document, one main canvas and a bounded window of thumbnail canvases. */
export default function PdfCanvasPreview({ blob, pdfRange, page, scale, sourceUrl, onRetry, onPageChange, onPageCount, fit = 'zoom', language = 'lo' }: { language?: string; blob: Blob; pdfRange?: AuthenticatedPdfRange; page: number; scale: number; sourceUrl?: string; onRetry?: () => void; onPageChange?: (page: number) => void; onPageCount?: (pages: number) => void; fit?: PdfFit }) {
  const copy = getMediaViewerCopy(language);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState('');
  const [thumbnailsReady, setThumbnailsReady] = useState(false);
  const [first, setFirst] = useState(1);
  const sidebar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    let task: ReturnType<typeof import('pdfjs-dist')['getDocument']> | undefined;
    setDocument(null); setError(''); setFirst(1); setThumbnailsReady(false);
    void (async () => {
      try {
        const lib = await import('pdfjs-dist/legacy/build/pdf.mjs'); configurePdfWorker(lib);
        if (!active) return;
        let pdfDoc: PDFDocumentProxy | null = null;
        if (pdfRange && (!blob || blob.size < pdfRange.length)) {
          try {
            const range = new lib.PDFDataRangeTransport(pdfRange.length, pdfRange.initialData, true);
            range.requestDataRange = (begin: number, end: number) => {
              void pdfRange.read(begin, end).then(bytes => { if (active) range.onDataRange(begin, bytes); }).catch(() => { if (active) setError(copy.pdfError); pdfRange.abort(); void task?.destroy(); });
            };
            range.abort = () => pdfRange.abort();
            task = lib.getDocument({ range, length: pdfRange.length, disableStream: true, disableAutoFetch: true, rangeChunkSize: 65536, isEvalSupported: false, useSystemFonts: true, disableFontFace: false });
            pdfDoc = await task.promise;
          } catch (rangeErr) {
            console.warn('[PdfCanvasPreview] Range transport failed, falling back to full binary:', rangeErr);
          }
        }
        if (!pdfDoc && blob) {
          const bytes = await blob.arrayBuffer(); if (!active) return;
          task = lib.getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, useSystemFonts: true, disableFontFace: false });
          pdfDoc = await task.promise;
        }
        if (active && pdfDoc) { setDocument(pdfDoc); onPageCount?.(pdfDoc.numPages); }
      } catch (e) {
        if (active) {
          console.error('[PdfCanvasPreview] Document loading error:', e);
          setError(copy.pdfError);
        }
      }
    })();
    const generation = useAuthStore.getState().sessionGeneration;
    const unsubscribe = useAuthStore.subscribe(state => { if (state.sessionGeneration !== generation) { active = false; pdfRange?.abort(); void task?.destroy(); setDocument(null); setError(copy.pdfError); } });
    return () => { active = false; unsubscribe(); pdfRange?.abort(); void task?.destroy(); };
  }, [blob, pdfRange, onPageCount]);
  useEffect(() => {
    if (!sidebar.current) return;
    const top = (page - 1) * 150;
    if (top < sidebar.current.scrollTop || top + 150 > sidebar.current.scrollTop + sidebar.current.clientHeight) {
      sidebar.current.scrollTop = top;
      setFirst(Math.max(1, page - 2));
    }
  }, [page, document, thumbnailsReady]);
  if (error) return <div><p role="alert" className="text-rose-600">{error}</p>{onRetry && <button type="button" onClick={onRetry}>{copy.retry}</button>}</div>;
  if (!document) return <span role="status">{copy.loadingPdf}</span>;
  return <div className="flex w-full h-full min-h-0 overflow-hidden" data-testid="pdf-viewer">
    {onPageChange && thumbnailsReady && <div ref={sidebar} aria-label={copy.thumbnails} className="w-32 shrink-0 overflow-y-auto border-r border-slate-600 bg-slate-800" onScroll={e => setFirst(Math.max(1, Math.floor(e.currentTarget.scrollTop / 150) - 1))}>
      <div style={{ height: document.numPages * 150, position: 'relative' }}>
        {Array.from({ length: Math.min(8, document.numPages - first + 1) }, (_, offset) => first + offset).map(number => <button type="button" key={number} aria-label={`${copy.goToPage} ${number}`} aria-current={page === number ? 'page' : undefined} onClick={() => onPageChange(number)} className={`absolute left-1 right-1 rounded p-2 text-white border-2 ${page === number ? 'border-sky-400 bg-sky-950' : 'border-transparent'}`} style={{ top: (number - 1) * 150, height: 146 }}>
          <PageCanvas document={document} language={language} page={number} scale={1} thumbnail />
          <span>{number}</span>
        </button>)}
      </div>
    </div>}
    <PageCanvas document={document} language={language} page={page} scale={scale} sourceUrl={sourceUrl} fit={fit} onRetry={onRetry} onPaint={setThumbnailsReady} />
  </div>;
}
