import { fetchAuthenticatedBlobUrl } from '@/api/client';

export interface PrivateArtworkOpenerState {
  mountedRef: { current: boolean };
  orderGenerationRef: { current: number };
  openedMedia: { current: string[] };
}

/**
 * Creates an artwork opener handler bound to component mount and order-generation refs.
 * Prevents race conditions where a slow/deferred artwork fetch for Order A resolves AFTER
 * switching to Order B or unmounting, guaranteeing stale artwork blobs are immediately revoked
 * and popup windows closed rather than exposing private artwork across orders.
 */
export function createPrivateArtworkOpener(
  state: PrivateArtworkOpenerState,
  options: {
    showToast: (msg: string, type?: string) => void;
    currentLang: string;
    openWindow?: (url: string, target: string) => { opener: any; location: { replace: (url: string) => void }; close: () => void } | null;
    fetchBlob?: typeof fetchAuthenticatedBlobUrl;
  }
) {
  const fetchBlobFn = options.fetchBlob || fetchAuthenticatedBlobUrl;
  return async (event: { preventDefault: () => void }, url: string) => {
    event.preventDefault();
    const reqGen = state.orderGenerationRef.current;
    const openerFn = options.openWindow || (typeof window !== 'undefined' ? window.open.bind(window) : () => null);
    const preview = openerFn('about:blank', '_blank');
    if (!preview) {
      options.showToast(options.currentLang === 'lo' ? 'ກະລຸນາອະນຸຍາດໜ້າຕ່າງໃໝ່' : 'Please allow the preview window', 'error');
      return;
    }
    preview.opener = null;
    try {
      const blob = await fetchBlobFn(url);
      // Guard: if component unmounted or order changed (new generation) while fetching, revoke and close
      if (!state.mountedRef.current || reqGen !== state.orderGenerationRef.current) {
        try { URL.revokeObjectURL(blob); } catch {}
        try { preview.close(); } catch {}
        return;
      }
      state.openedMedia.current.push(blob);
      preview.location.replace(blob);
    } catch {
      try { preview.close(); } catch {}
      if (state.mountedRef.current && reqGen === state.orderGenerationRef.current) {
        options.showToast(options.currentLang === 'lo' ? 'ບໍ່ສາມາດໂຫຼດໄຟລ໌ໄດ້' : 'Unable to load artwork', 'error');
      }
    }
  };
}
