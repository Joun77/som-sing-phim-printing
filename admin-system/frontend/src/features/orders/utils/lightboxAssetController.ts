import { useState, useEffect, useRef } from 'react';
import { fetchAuthenticatedBlob, type AuthenticatedBlobResult } from '../../../api/client';
import { configurePdfWorker } from '../../../lib/pdfWorker';

/**
 * Manages asset loading lifecycle, request generation invalidation, and blob URL cleanup
 * for the Universal Lightbox modal.
 */

export interface LightboxAssetControllerState {
  loadingStatus: 'idle' | 'loading' | 'success' | 'error';
  errorMessage: string;
  resolvedBlobUrl: string;
  resolvedType: string;
  resolvedSize: number;
  pdfPageCount: number | null;
}

export interface LightboxAssetItem {
  url?: string;
  name?: string;
  originalUrl?: string;
  contentType?: string;
  size?: number;
}

/**
 * Robust helper to extract page count from a PDF binary using configured PDF.js parser.
 * Always destroys loading task and document.
 * Returns truthful page count or throws on corrupt/invalid input (never claims guessed 1).
 */
export async function extractPdfPageCount(data: Blob | ArrayBuffer | Uint8Array): Promise<number> {
  let buffer: ArrayBuffer;
  if (data instanceof Blob) {
    buffer = await data.arrayBuffer();
  } else if (data instanceof Uint8Array) {
    const copy = new Uint8Array(data.byteLength);
    copy.set(data);
    buffer = copy.buffer;
  } else {
    buffer = data as ArrayBuffer;
  }

  // Load configured PDF.js parser
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  configurePdfWorker(pdfjsLib);

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: true,
  });

  let pdfDoc: any = null;
  try {
    pdfDoc = await loadingTask.promise;
    if (pdfDoc && typeof pdfDoc.numPages === 'number' && pdfDoc.numPages > 0) {
      return pdfDoc.numPages;
    }
    throw new Error('Invalid PDF: document contains 0 pages');
  } finally {
    try {
      if (pdfDoc && typeof pdfDoc.destroy === 'function') {
        await pdfDoc.destroy();
      }
    } catch {}
    try {
      if (loadingTask && typeof loadingTask.destroy === 'function') {
        await loadingTask.destroy();
      }
    } catch {}
  }
}

/**
 * Bounded PDF page navigation helpers.
 */
export function clampPdfPage(page: number, maxPages: number | null): number {
  if (page < 1) return 1;
  if (maxPages !== null && page > maxPages) return maxPages;
  return page;
}

export function computeNextPdfPage(currentPage: number, maxPages: number | null): number {
  if (maxPages !== null) {
    return Math.min(maxPages, currentPage + 1);
  }
  return currentPage + 1;
}

export function computePrevPdfPage(currentPage: number): number {
  return Math.max(1, currentPage - 1);
}

/**
 * Controller core for asset loading lifecycle, request generation invalidation,
 * and memory/blob cleanup.
 */
export function createLightboxAssetController(callbacks: {
  onStateChange: (state: Partial<LightboxAssetControllerState>) => void;
  revokeUrl: (url: string) => void;
  fetchBlob: (url: string) => Promise<{ blobUrl: string; contentType: string; size: number; blob?: Blob }>;
}) {
  let requestGen = 0;
  let isMounted = true;
  let currentBlobUrl: string | null = null;
  const createdBlobs = new Set<string>();
  let fetchCount = 0;

  return {
    mount: () => {
      isMounted = true;
    },
    unmount: () => {
      isMounted = false;
      requestGen++;
      createdBlobs.forEach((url) => {
        try {
          callbacks.revokeUrl(url);
        } catch {}
      });
      createdBlobs.clear();
      currentBlobUrl = null;
    },
    invalidatePending: () => {
      requestGen++;
    },
    loadAsset: async (item: LightboxAssetItem | undefined) => {
      // Increment generation immediately so any pending request is superseded
      const reqGen = ++requestGen;

      if (!item || !item.url) {
        if (currentBlobUrl && currentBlobUrl !== item?.url) {
          try {
            callbacks.revokeUrl(currentBlobUrl);
          } catch {}
          createdBlobs.delete(currentBlobUrl);
          currentBlobUrl = null;
        }
        callbacks.onStateChange({
          loadingStatus: 'error',
          errorMessage: 'ບໍ່ພົບ URL ຂອງໄຟລ໌ (No media URL provided)',
          resolvedBlobUrl: '',
          pdfPageCount: null,
        });
        return;
      }

      callbacks.onStateChange({ loadingStatus: 'loading', errorMessage: '', resolvedBlobUrl: '', pdfPageCount: null });

      // Revoke previous blob if created by us and different from item.url
      if (currentBlobUrl && currentBlobUrl !== item.url) {
        try {
          callbacks.revokeUrl(currentBlobUrl);
        } catch {}
        createdBlobs.delete(currentBlobUrl);
        currentBlobUrl = null;
      }

      fetchCount++;

      try {
        const result = await callbacks.fetchBlob(item.url);

        // Stale or unmounted guard
        if (!isMounted || reqGen !== requestGen) {
          if (result.blobUrl && result.blobUrl !== item.url) {
            try {
              callbacks.revokeUrl(result.blobUrl);
            } catch {}
          }
          return;
        }

        let pageCount: number | null = null;
        // Validated response bytes take precedence over stale caller MIME hints.
        const detectedType = result.contentType || item.contentType || '';
        if (detectedType === 'application/pdf' && result.blob) {
          try {
            pageCount = await extractPdfPageCount(result.blob);
          } catch {
            // Truthful unknown/error when parsing fails; never guess 1
            pageCount = null;
          }
        }

        if (!isMounted || reqGen !== requestGen) {
          if (result.blobUrl && result.blobUrl !== item.url) {
            try {
              callbacks.revokeUrl(result.blobUrl);
            } catch {}
          }
          return;
        }

        if (result.blobUrl && result.blobUrl !== item.url) {
          currentBlobUrl = result.blobUrl;
          createdBlobs.add(result.blobUrl);
        }

        callbacks.onStateChange({
          loadingStatus: 'success',
          resolvedBlobUrl: result.blobUrl,
          resolvedType: detectedType,
          resolvedSize: result.size || item.size || 0,
          pdfPageCount: pageCount,
        });
      } catch (err: any) {
        if (!isMounted || reqGen !== requestGen) return;
        callbacks.onStateChange({
          loadingStatus: 'error',
          errorMessage: err.message || 'Failed to load artwork binary',
          resolvedBlobUrl: '',
          pdfPageCount: null,
        });
      }
    },
    getCreatedBlobs: () => Array.from(createdBlobs),
    getCurrentBlobUrl: () => currentBlobUrl,
    getRequestGen: () => requestGen,
    getFetchCount: () => fetchCount,
    isMounted: () => isMounted,
  };
}

/**
 * Production React hook for Lightbox component lifecycle.
 * Delegates 100% of state transitions, request generation invalidation, and blob cleanup
 * to createLightboxAssetController.
 */
export function useLightboxAssetController({
  activeItem,
  fileSize = 0,
  fetchBlobFn = fetchAuthenticatedBlob,
  revokeUrlFn = (url: string) => {
    try {
      URL.revokeObjectURL(url);
    } catch {}
  },
}: {
  activeItem?: LightboxAssetItem;
  fileSize?: number;
  fetchBlobFn?: (url: string) => Promise<AuthenticatedBlobResult>;
  revokeUrlFn?: (url: string) => void;
}) {
  const [state, setState] = useState<LightboxAssetControllerState>({
    loadingStatus: 'idle',
    errorMessage: '',
    resolvedBlobUrl: '',
    resolvedType: activeItem?.contentType || '',
    resolvedSize: activeItem?.size || fileSize || 0,
    pdfPageCount: null,
  });
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // Single controller instance retained in ref across renders
  const controllerRef = useRef<ReturnType<typeof createLightboxAssetController> | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = createLightboxAssetController({
      onStateChange: (patch) => {
        setState((prev) => ({ ...prev, ...patch }));
      },
      revokeUrl: revokeUrlFn,
      fetchBlob: fetchBlobFn,
    });
  }

  const controller = controllerRef.current;
  const activeKey = activeItem?.url ? `${activeItem.url}::${activeItem.name || ''}` : '';

  // Lifecycle: mount / unmount (handles React StrictMode mount -> unmount -> remount)
  useEffect(() => {
    controller.mount();
    return () => {
      controller.unmount();
    };
  }, [controller]);

  // Asset loading effect: delegates directly to controller
  useEffect(() => {
    controller.loadAsset(activeItem);
    return () => {
      controller.invalidatePending();
    };
  }, [activeKey, reloadTrigger, controller]);

  return {
    ...state,
    reload: () => setReloadTrigger((v) => v + 1),
    fetchCount: controller.getFetchCount(),
    requestGen: controller.getRequestGen(),
    createdBlobUrls: controller.getCreatedBlobs(),
    controller,
  };
}
