import React, { useEffect } from 'react';
import { FileText, Image as ImageIcon, LoaderCircle } from 'lucide-react';
import { useLightboxAssetController } from '../../features/orders/utils/lightboxAssetController';
import { getMediaViewerCopy } from './mediaViewerCopy';

interface Props { fit?: "cover" | "contain"; url: string; name: string; alt?: string; language?: string; onUnavailable?: (url: string) => void; }
function ImageThumbnail({ url, name, alt, language = 'lo', fit = 'cover', onUnavailable }: Props) {
  const copy = getMediaViewerCopy(language);
  const state = useLightboxAssetController({ activeItem: { url, name } });
  useEffect(() => { if (state.loadingStatus === 'error') onUnavailable?.(url); }, [state.loadingStatus, url, onUnavailable]);
  if (state.loadingStatus === 'success') return <img src={state.resolvedBlobUrl} alt={alt || name} className={fit === 'contain' ? 'w-full h-full object-contain' : 'w-full h-full object-cover'} onError={() => onUnavailable?.(url)} />;
  return <span className="w-full h-full flex items-center justify-center" aria-label={state.loadingStatus === 'error' ? copy.unavailable : copy.loading}>{state.loadingStatus === 'error' ? <ImageIcon aria-hidden="true" className="w-5 h-5 text-slate-400" /> : <LoaderCircle aria-hidden="true" className="w-4 h-4 animate-spin" />}</span>;
}
/** PDFs use metadata only; images use the same authenticated/stale-safe controller as preview. */
export default function ArtworkThumbnail(props: Props) {
  if (/\.pdf$/i.test(props.name)) return <FileText aria-hidden="true" className="w-5 h-5 text-sky-500" />;
  return <ImageThumbnail {...props} />;
}
