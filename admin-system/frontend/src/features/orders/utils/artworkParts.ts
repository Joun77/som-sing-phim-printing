import type { ArtworkPart, ArtworkPartCost } from '../types';

export function getArtworkParts(item: { artworkParts?: ArtworkPart[]; specs?: { artwork_parts?: ArtworkPart[] }; specifications?: { artwork_parts?: ArtworkPart[] } }): ArtworkPart[] {
  return item.artworkParts || item.specs?.artwork_parts || item.specifications?.artwork_parts || [];
}

/** Update settings for one role without changing either immutable original or the other role. */
export function updateArtworkPart(parts: ArtworkPart[], role: ArtworkPart['role'], patch: Partial<Omit<ArtworkPart, 'role' | 'source' | 'pageCount'>>): ArtworkPart[] {
  return parts.map(part => part.role === role ? { ...part, ...patch } : part);
}

export function getArtworkPartCosts(item: { specs?: { price_components?: { parts?: ArtworkPartCost[] } }; specifications?: { price_components?: { parts?: ArtworkPartCost[] } } }): ArtworkPartCost[] {
  return item.specs?.price_components?.parts || item.specifications?.price_components?.parts || [];
}

/** Missing legacy metadata must not appear as a known zero-byte original. */
export function formatArtworkSize(size?: number): string {
  if (!Number.isFinite(size) || !size || size < 0) return 'ບໍ່ຮູ້ຂະໜາດໄຟລ໌';
  return size < 10486 ? `${size.toLocaleString('lo-LA')} bytes` : `${(size / 1048576).toFixed(2)} MB`;
}

export const artworkActionClass = 'inline-flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 text-sky-700 font-semibold px-3 py-2 text-xs hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-50';

/** Preserve names and byte sizes when batch entries carry original metadata. */
export function getArtworkFiles(files: unknown[]): { name: string; url: string; size?: number }[] {
  return files.flatMap((file, index) => {
    const entry = typeof file === 'object' && file !== null ? file as Record<string, unknown> : {};
    const url = typeof file === 'string' ? file : entry.url || entry.file_url;
    if (typeof url !== 'string' || !url) return [];
    const name = entry.name || entry.file_name;
    const size = entry.size ?? entry.file_size;
    return [{ url, name: typeof name === 'string' && name ? name : `ຮູບ_${index + 1}.jpg`, size: typeof size === 'number' ? size : undefined }];
  });
}


interface ArtworkOriginalInput {
  artworkParts?: ArtworkPart[];
  specs?: { artwork_parts?: ArtworkPart[] };
  specifications?: { artwork_parts?: ArtworkPart[] };
  artworkUrl?: string; artwork_url?: string; fileUrl?: string; file_url?: string; inner_file_url?: string; artworkLink?: string;
  artwork_file_name?: string; artworkFileName?: string; fileName?: string; file_name?: string;
  artwork_file_size?: number; artworkFileSize?: number; fileSize?: number; file_size?: number;
  artwork?: { file_url?: string; file_name?: string; file_size_bytes?: number };
  batchFiles?: unknown[]; batch_files?: unknown[];
}

/** Resolve one source identity: valid role source, flat URL, nested URL, batch, fallback.
 * Nested/batch metadata may fill missing flat metadata only for the exact chosen URL.
 */
export function resolveArtworkOriginal(item: ArtworkOriginalInput, fallback = { url: '', name: '', size: 0 }): { url: string; name: string; size: number } {
  const parts = getArtworkParts(item).filter(part => !!part.source?.url);
  const part = parts.find(source => source.role === 'inner') || parts.find(source => source.role === 'cover');
  const basename = (url: string) => url.split('/').pop()?.split('?')[0] || '';
  if (part) return { url: part.source.url, name: part.source.name || basename(part.source.url), size: part.source.size || 0 };
  const flatUrl = item.artworkUrl || item.artwork_url || item.fileUrl || item.file_url || item.inner_file_url || item.artworkLink;
  const batch = getArtworkFiles(item.batchFiles || item.batch_files || []);
  const url = flatUrl || item.artwork?.file_url || batch[0]?.url;
  if (!url) return fallback;
  const nested = item.artwork?.file_url === url ? item.artwork : undefined;
  const batchOriginal = batch.find(file => file.url === url);
  const flatName = flatUrl ? item.artwork_file_name || item.artworkFileName || item.fileName || item.file_name : undefined;
  const flatSize = flatUrl ? item.artwork_file_size || item.artworkFileSize || item.fileSize || item.file_size : undefined;
  return { url, name: flatName || nested?.file_name || batchOriginal?.name || basename(url), size: flatSize || nested?.file_size_bytes || batchOriginal?.size || 0 };
}
