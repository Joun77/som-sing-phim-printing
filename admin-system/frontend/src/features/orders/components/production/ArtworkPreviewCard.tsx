import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Sparkles,
  Images,
  CheckCircle2,
  ZoomIn,
  Layers,
  User,
  Phone,
  MapPin,
  Loader2,
  FileQuestion,
  AlertTriangle
} from 'lucide-react';
import { FormModalTemplate } from '@components/common/FormModalTemplate';
import { downloadPhotosAsZip } from '@utils/zipDownloader';
import { fetchAuthenticatedBlobUrl, downloadAuthenticatedFile } from '@/api/client';

interface ArtworkPreviewCardProps {
  orderIdDisplay: string;
  order?: any;
  driveLink?: string;
  artworkThumbnailUrl?: string;
  currentLang: string;
  onOpenDriveLink: () => void;
  setLightbox?: (lb: any) => void;
  onDownloadArtwork?: () => void;
}

export interface ArtworkZipDownloadState {
  rawPhotos: { name: string; canonicalUrl: string; size?: number }[];
  blobMap: Record<string, string>;
  photos: { name: string; url: string; size?: number }[];
  orderIdDisplay: string;
  currentLang: string;
}

export interface ArtworkDownloadFeedback {
  type: 'error' | 'warning';
  title: string;
  message: string;
  failedCount: number;
  failedFiles: string[];
}

export async function executeArtworkZipDownload(
  state: ArtworkZipDownloadState,
  callbacks: {
    setIsZipping: (zipping: boolean) => void;
    setDownloadFeedback: (feedback: ArtworkDownloadFeedback | null) => void;
    downloadZipFn?: typeof downloadPhotosAsZip;
  }
) {
  callbacks.setIsZipping(true);
  callbacks.setDownloadFeedback(null);
  const downloadFn = callbacks.downloadZipFn || downloadPhotosAsZip;
  try {
    const initialFailedAssets = state.rawPhotos.filter((p) => state.blobMap[p.canonicalUrl] === '');
    const initialFailedNames = initialFailedAssets.map((p) => p.name);

    if (state.photos.length === 0) {
      const allFailedNames = initialFailedNames.length > 0 ? initialFailedNames : state.rawPhotos.map((p) => p.name);
      callbacks.setDownloadFeedback({
        type: 'error',
        title: state.currentLang === 'lo' ? 'ດາວໂຫຼດບໍ່ສຳເລັດ' : 'Download Failed',
        message: state.currentLang === 'lo'
          ? `ບໍ່ມີໄຟລ໌ທີ່ສາມາດດາວໂຫຼດໄດ້ (${allFailedNames.length} ໄຟລ໌ໂຫຼດບໍ່ສຳເລັດ)`
          : `No downloadable artwork files available (${allFailedNames.length} file${allFailedNames.length === 1 ? '' : 's'} failed to load).`,
        failedCount: allFailedNames.length,
        failedFiles: allFailedNames,
      });
      return;
    }

    const result = await downloadFn(
      state.photos,
      `${state.orderIdDisplay}_artworks_${state.photos.length}_photos.zip`
    );

    // Preserve initial load failures when only loaded photos are passed to the ZIP packaging
    const totalFailedNames = [...initialFailedNames, ...(result?.failedFiles || [])];
    const totalFailedCount = initialFailedNames.length + (result?.failedCount || 0);

    if (totalFailedCount > 0) {
      callbacks.setDownloadFeedback({
        type: 'warning',
        title: state.currentLang === 'lo' ? 'ດາວໂຫຼດສຳເລັດບາງສ່ວນ' : 'Partial Download Completed',
        message: state.currentLang === 'lo'
          ? `ດາວໂຫຼດສຳເລັດ ${result?.successCount || 0} ໄຟລ໌, ແຕ່ພົບຂໍ້ຜິດພາດ ${totalFailedCount} ໄຟລ໌:`
          : `Downloaded ${result?.successCount || 0} file${result?.successCount === 1 ? '' : 's'}, but ${totalFailedCount} file${totalFailedCount === 1 ? '' : 's'} failed:`,
        failedCount: totalFailedCount,
        failedFiles: totalFailedNames,
      });
    } else {
      callbacks.setDownloadFeedback(null);
    }
  } catch (err: any) {
    const errorMsg = err?.message || (state.currentLang === 'lo' ? 'ເກີດຂໍ້ຜິດພາດໃນການສ້າງໄຟລ໌ ZIP' : 'Failed to generate ZIP file');
    const initialFailedAssets = state.rawPhotos.filter((p) => state.blobMap[p.canonicalUrl] === '');
    const initialFailedNames = initialFailedAssets.map((p) => p.name);
    const allFailedNames = initialFailedNames.length > 0 ? initialFailedNames : state.rawPhotos.map((p) => p.name);
    callbacks.setDownloadFeedback({
      type: 'error',
      title: state.currentLang === 'lo' ? 'ດາວໂຫຼດ ZIP ບໍ່ສຳເລັດ' : 'ZIP Download Failed',
      message: errorMsg,
      failedCount: allFailedNames.length > 0 ? allFailedNames.length : 1,
      failedFiles: allFailedNames,
    });
  } finally {
    callbacks.setIsZipping(false);
  }
}

export const ArtworkPreviewCard: React.FC<ArtworkPreviewCardProps> = ({
  orderIdDisplay,
  order,
  driveLink,
  artworkThumbnailUrl,
  currentLang,
  onOpenDriveLink,
  setLightbox,
  onDownloadArtwork,
}) => {
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Extract batch files from order items or specs
  const firstItem = order?.items?.[0] || {};
  const rawBatch =
    firstItem.batch_files ||
    firstItem.batchFiles ||
    firstItem.specifications?.batch_files ||
    firstItem.specs?.batch_files ||
    order?.batch_files ||
    order?.specs?.batch_files ||
    [];

  const galleryUrls =
    firstItem.gallery_urls ||
    firstItem.galleryUrls ||
    firstItem.specifications?.gallery_urls ||
    order?.gallery_urls ||
    [];

  // Normalize batch photo items with raw canonical URLs
  const rawPhotos: { name: string; canonicalUrl: string; size?: number }[] = (() => {
    if (Array.isArray(rawBatch) && rawBatch.length > 0) {
      return rawBatch
        .map((f: any, idx: number) => ({
          name: f.name || f.file_name || `Photo_${String(idx + 1).padStart(2, '0')}.jpg`,
          canonicalUrl: typeof f === 'string' ? f : (f.url || f.file_url || f.preview_url || ''),
          size: f.size || f.file_size,
        }))
        .filter((item) => Boolean(item.canonicalUrl));
    }
    if (Array.isArray(galleryUrls) && galleryUrls.length > 0) {
      return galleryUrls
        .map((url: string, idx: number) => ({
          name: `Photo_${String(idx + 1).padStart(2, '0')}.jpg`,
          canonicalUrl: url,
        }))
        .filter((item) => Boolean(item.canonicalUrl));
    }

    const hasCover = firstItem.cover_file_url || firstItem.coverFileUrl;
    const hasInner = firstItem.inner_file_url || firstItem.innerFileUrl || firstItem.artwork_url || firstItem.artworkUrl;
    
    // If it's a split cover/inner book
    if (hasCover && hasInner && hasCover !== hasInner) {
      return [
        {
          name: firstItem.cover_file_name || firstItem.coverFileName || `cover_${orderIdDisplay}.pdf`,
          canonicalUrl: hasCover,
        },
        {
          name: firstItem.inner_file_name || firstItem.innerFileName || firstItem.artwork_file_name || `inner_${orderIdDisplay}.pdf`,
          canonicalUrl: hasInner,
        }
      ];
    }

    // If single artwork or thumbnail exists
    const singleUrl = artworkThumbnailUrl || driveLink || hasInner || order?.artwork_url;
    if (singleUrl) {
      return [{
        name: firstItem.artwork_file_name || firstItem.artworkFileName || order?.artwork_file_name || `artwork_${orderIdDisplay}.jpg`,
        canonicalUrl: singleUrl,
      }];
    }

    return [];
  })();

  // Cache of ephemeral authenticated Blob URLs keyed by canonical URL (prevents token leakage in DOM/history)
  const [blobMap, setBlobMap] = useState<Record<string, string>>({});
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState<{
    type: 'error' | 'warning';
    title: string;
    message: string;
    failedCount: number;
    failedFiles: string[];
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const createdBlobs: string[] = [];
    setBlobMap({});
    setIsLoadingMedia(rawPhotos.length > 0);

    async function loadAuthenticatedBlobs() {
      const nextMap: Record<string, string> = {};
      for (const item of rawPhotos) {
        if (!item.canonicalUrl) continue;
        if (item.canonicalUrl.startsWith('blob:') || item.canonicalUrl.startsWith('data:')) {
          nextMap[item.canonicalUrl] = item.canonicalUrl;
          continue;
        }
        try {
          const blobUrl = await fetchAuthenticatedBlobUrl(item.canonicalUrl);
          if (!isMounted) {
            URL.revokeObjectURL(blobUrl);
            return;
          }
          createdBlobs.push(blobUrl);
          nextMap[item.canonicalUrl] = blobUrl;
        } catch {
          // A failed private fetch must never fall back to a URL containing the session token.
          nextMap[item.canonicalUrl] = '';
        }
      }
      if (isMounted) {
        setBlobMap(nextMap);
        setIsLoadingMedia(false);
      }
    }

    if (rawPhotos.length > 0) {
      loadAuthenticatedBlobs();
    } else {
      setBlobMap({});
    }

    return () => {
      isMounted = false;
      createdBlobs.forEach((b) => {
        try {
          URL.revokeObjectURL(b);
        } catch {}
      });
    };
  }, [JSON.stringify(rawPhotos.map((p) => p.canonicalUrl))]);

  const photos: { name: string; url: string; size?: number }[] = rawPhotos.map((p) => ({
    name: p.name,
    url: blobMap[p.canonicalUrl] || '',
    size: p.size,
  })).filter((photo) => Boolean(photo.url));

  // Count media that attempted to load but failed (empty string in blobMap = load attempted & failed)
  const failedCount = Object.values(blobMap).filter((v) => v === '').length;

  const handleDownloadZip = () => executeArtworkZipDownload(
    { rawPhotos, blobMap, photos, orderIdDisplay, currentLang },
    { setIsZipping, setDownloadFeedback }
  );

  const activePhoto = photos[selectedPhotoIdx] || photos[0];
  const customerName = order?.customer_name || order?.customerName || order?.customer?.name || '-';
  const customerPhone = order?.customer_phone || order?.customerPhone || order?.customer?.phone || order?.phone || '-';
  const customerAddress = order?.customer_address || order?.customerAddress || order?.customer?.address || order?.address || '';

  const handleOpenPhotoInUniversalLightbox = (photoItem: { name: string; url: string }, index: number) => {
    if (setLightbox && photoItem?.url) {
      setLightbox({
        src: photoItem.url,
        title: `${photoItem.name} (${index + 1}/${photos.length}) - #${orderIdDisplay}`,
        documentNumber: `#${orderIdDisplay}`,
        fileName: photoItem.name,
        photos: photos.map((p, idx) => ({
          name: p.name || `Photo #${idx + 1}`,
          url: p.url,
          originalUrl: rawPhotos.find((r) => r.name === p.name)?.canonicalUrl || p.url,
          contentType: 'image/jpeg',
        })),
        initialPhotoIndex: index,
        onDownloadOriginal: async (item: any) => {
          const target = item?.originalUrl || item?.url || photoItem.url;
          const fileName = item?.name || photoItem.name || `photo_${index + 1}.jpg`;
          await downloadAuthenticatedFile(target, fileName);
        }
      });
    } else if (photoItem?.url) {
      window.open(photoItem.url, '_blank');
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider block">Artwork Asset & Client</span>
              <h3 className="text-sm font-black text-slate-900">
                {currentLang === 'lo' ? 'ໄຟລ໌ງານພິມ & ຂໍ້ມູນລູກຄ້າ' : 'Customer Artwork & Profile'}
              </h3>
            </div>
          </div>
          {photos.length > 0 && failedCount === 0 ? (
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Approved (CMYK)</span>
            </span>
          ) : photos.length > 0 && failedCount > 0 ? (
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>{failedCount} {currentLang === 'lo' ? 'ໄຟລ໌ໂຫຼດບໍ່ໄດ້' : (failedCount === 1 ? 'file failed' : 'files failed')}</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <FileQuestion className="w-3 h-3 text-amber-600" />
              <span>{currentLang === 'lo' ? 'ລໍຖ້າໄຟລ໌' : 'Pending Artwork'}</span>
            </span>
          )}
        </div>

        {/* Customer Snapshot Box */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="truncate space-y-0.5">
            <div className="flex items-center gap-1.5">
              <strong className="text-slate-900 font-black">{customerName}</strong>
              {customerPhone && customerPhone !== '-' && (
                <span className="text-[11px] font-mono text-slate-500 font-semibold">• {customerPhone}</span>
              )}
            </div>
            {customerAddress && (
              <span className="text-[10.5px] text-slate-500 block truncate">{customerAddress}</span>
            )}
          </div>
          {photos.length > 1 && (
            <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black shrink-0">
              {photos.length} ຮູບພາບ
            </span>
          )}
        </div>

        {/* Main Artwork Preview Showcase (Clean Universal Som-Sing Style) */}
        <div className="space-y-3">
          {photos.length === 0 ? (
            <div className="w-full h-48 sm:h-52 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 p-4 flex flex-col items-center justify-center text-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-2xs">
                <FileQuestion className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800">
                  {isLoadingMedia ? (currentLang === 'lo' ? 'ກຳລັງໂຫຼດໄຟລ໌' : 'Loading artwork') : rawPhotos.length > 0 ? (currentLang === 'lo' ? `ບໍ່ສາມາດໂຫຼດໄຟລ໌ໄດ້ (${failedCount} ໄຟລ໌)` : `Unable to load artwork (${failedCount} ${failedCount === 1 ? 'file' : 'files'} failed)`) : (currentLang === 'lo' ? 'ລໍຖ້າໄຟລ໌ຈາກລູກຄ້າ' : 'Pending Customer Artwork')}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium max-w-xs">
                  {currentLang === 'lo' ? 'ຍັງບໍ່ມີໄຟລ໌ງານພິມແນບໃນອໍເດີນີ້ ສາມາດເປີດລິ້ງຄ໌ Google Drive ດ້ານລຸ່ມ' : 'No artwork files uploaded yet. You can inspect external drive link if available.'}
                </p>
              </div>
              {driveLink && (
                <button
                  type="button"
                  onClick={onOpenDriveLink}
                  className="mt-1 px-3.5 py-1.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-black flex items-center gap-1.5 border border-sky-200 cursor-pointer transition shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{currentLang === 'lo' ? 'ເປີດ Google Drive' : 'Open Google Drive'}</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Featured Active Photo Card */}
              <div
                onClick={() => handleOpenPhotoInUniversalLightbox(activePhoto, selectedPhotoIdx)}
                className="group relative w-full h-48 sm:h-52 bg-slate-50 rounded-2xl border border-slate-200 p-2 flex items-center justify-center cursor-pointer hover:border-sky-400 hover:shadow-md transition-all overflow-hidden"
                title={currentLang === 'lo' ? 'ຄລິກເພື່ອເບິ່ງຮູບເຕັມຈໍ (Universal Preview)' : 'Click for Universal Fullscreen Preview'}
              >
                <img
                  src={activePhoto.url}
                  alt={activePhoto.name}
                  className="max-h-full max-w-full object-contain rounded-xl transition duration-200 group-hover:scale-[1.02]"
                />

                {/* Subtle Hover Action Overlay */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition rounded-2xl flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-[1px]">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md flex items-center gap-1.5 shadow-md">
                    <ZoomIn className="w-4 h-4 text-sky-300" />
                    <span>{currentLang === 'lo' ? 'ຄລິກເພື່ອຂະຫຍາຍເບິ່ງເຕັມຈໍ' : 'Universal Preview'}</span>
                  </div>
                </div>

                {/* Photo Index Badge */}
                {photos.length > 1 && (
                  <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-slate-900/80 text-white font-mono font-bold text-[10.5px] backdrop-blur-sm border border-white/10 shadow-xs">
                    {selectedPhotoIdx + 1} / {photos.length}
                  </div>
                )}
              </div>

              {/* Batch Thumbnail Selector Row (Up to 6 thumbnails + "+N more" badge) */}
              {photos.length > 1 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold px-0.5">
                    <span>ເລືອກຮູບທີ່ຈະກວດສອບ ({photos.length} ຮູບ):</span>
                    <button
                      type="button"
                      onClick={() => setIsGalleryModalOpen(true)}
                      className="text-sky-600 hover:text-sky-700 font-black cursor-pointer hover:underline"
                    >
                      ເບິ່ງທັງໝົດ →
                    </button>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                    {photos.slice(0, 6).map((p, idx) => {
                      const isSelected = selectedPhotoIdx === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedPhotoIdx(idx)}
                          className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                            isSelected
                              ? 'border-sky-500 ring-2 ring-sky-500/20 scale-105 shadow-xs'
                              : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300'
                          }`}
                          title={p.name}
                        >
                          <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-white text-[8px] font-mono text-center font-bold">
                            #{idx + 1}
                          </span>
                        </button>
                      );
                    })}

                    {photos.length > 6 && (
                      <button
                        type="button"
                        onClick={() => setIsGalleryModalOpen(true)}
                        className="w-12 h-12 rounded-xl border border-dashed border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-700 flex flex-col items-center justify-center font-black text-xs shrink-0 transition cursor-pointer shadow-2xs"
                        title="ເບິ່ງຄັງຮູບພາບທັງໝົດ"
                      >
                        <span>+{photos.length - 6}</span>
                        <span className="text-[8px] font-bold">ຮູບ</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Visible ZIP Download Feedback Banner (Partial or Total Failure) */}
      {downloadFeedback && (
        <div
          role="alert"
          data-testid="artwork-download-alert"
          className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
            downloadFeedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-current" />
              <span>{downloadFeedback.title}</span>
            </div>
            <button
              type="button"
              data-testid="dismiss-download-alert-btn"
              onClick={() => setDownloadFeedback(null)}
              className="text-[10px] underline font-semibold cursor-pointer opacity-75 hover:opacity-100"
            >
              {currentLang === 'lo' ? 'ປິດ' : 'Dismiss'}
            </button>
          </div>
          <p className="text-[11px] opacity-90">{downloadFeedback.message}</p>
          {downloadFeedback.failedFiles && downloadFeedback.failedFiles.length > 0 && (
            <div className="text-[10px] font-mono bg-white/70 p-2 rounded-xl border border-current/10 max-h-24 overflow-y-auto space-y-0.5">
              <div className="font-sans font-semibold text-[10px] mb-1">
                {currentLang === 'lo' ? 'ລາຍຊື່ໄຟລ໌ທີ່ບໍ່ສຳເລັດ:' : 'Failed files:'}
              </div>
              {downloadFeedback.failedFiles.map((fname, i) => (
                <div key={i} className="truncate">• {fname}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons: Clean Universal Actions */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
        {photos.length > 1 ? (
          <button
            type="button"
            onClick={() => setIsGalleryModalOpen(true)}
            className="py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-black transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border border-purple-200"
          >
            <Images className="w-3.5 h-3.5 text-purple-600" />
            <span>{currentLang === 'lo' ? `ຄັງຮູບທັງໝົດ (${photos.length})` : `All Photos (${photos.length})`}</span>
          </button>
        ) : photos.length === 1 ? (
          <button
            type="button"
            onClick={() => handleOpenPhotoInUniversalLightbox(activePhoto, 0)}
            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span>{currentLang === 'lo' ? 'ເປີດເບິ່ງໄຟລ໌' : 'View Artwork'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenDriveLink}
            disabled={!driveLink}
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 border ${
              driveLink
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 cursor-pointer active:scale-95'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{currentLang === 'lo' ? 'Google Drive' : 'Google Drive'}</span>
          </button>
        )}

        <button
          type="button"
          data-testid="artwork-download-btn"
          disabled={(photos.length === 0 && failedCount === 0) && !onDownloadArtwork}
          onClick={async () => {
            if (onDownloadArtwork) {
              onDownloadArtwork();
            } else if (photos.length > 1 || (photos.length === 1 && failedCount > 0) || (photos.length === 0 && failedCount > 0)) {
              await handleDownloadZip();
            } else if (activePhoto?.url) {
              const a = document.createElement('a');
              a.href = activePhoto.url;
              a.download = activePhoto.name;
              a.target = '_blank';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm border-none ${
            photos.length > 0 || onDownloadArtwork || failedCount > 0
              ? 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isZipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span>
            {photos.length > 1 || (photos.length === 1 && failedCount > 0) || (photos.length === 0 && failedCount > 0)
              ? (currentLang === 'lo' ? 'ດາວໂຫຼດ ZIP' : 'Download ZIP')
              : photos.length === 1
              ? (currentLang === 'lo' ? 'ດາວໂຫຼດໄຟລ໌' : 'Download File')
              : (currentLang === 'lo' ? 'ບໍ່ມີໄຟລ໌' : 'No File')}
          </span>
        </button>
      </div>

      {/* Universal Photo Batch Gallery Modal (FormModalTemplate) */}
      {isGalleryModalOpen && (
        <FormModalTemplate
          isOpen={isGalleryModalOpen}
          onClose={() => setIsGalleryModalOpen(false)}
          icon={<Images className="w-5 h-5 text-white" />}
          title={currentLang === 'lo' ? `ຄັງຮູບພາບງານພິມ (${photos.length} ຮູບ)` : `Artwork Gallery (${photos.length} Photos)`}
          subtitle={`ອໍເດີ #${orderIdDisplay} • ລູກຄ້າ: ${customerName} • ສເປກສີ CMYK`}
          maxWidthClass="max-w-4xl"
          badgeText={`${photos.length} PHOTOS`}
          footerActions={
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
              <span className="text-xs text-slate-500 font-semibold text-center sm:text-left">
                {currentLang === 'lo' ? `ລວມທັງໝົດ ${photos.length} ຮູບພາບ • ກົດທີ່ຮູບເພື່ອເບິ່ງ Preview ຄວາມລະອຽດສູງ` : `Total ${photos.length} photos ready for press`}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  data-testid="modal-download-zip-btn"
                  onClick={handleDownloadZip}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs cursor-pointer transition flex items-center gap-1.5 shadow-sm"
                >
                  {isZipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>{currentLang === 'lo' ? 'ດາວໂຫຼດຮູບທັງໝົດ (ZIP)' : 'Download All as ZIP'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsGalleryModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs cursor-pointer transition"
                >
                  {currentLang === 'lo' ? 'ປິດໜ້າຕ່າງ' : 'Close'}
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {downloadFeedback && (
              <div
                role="alert"
                data-testid="modal-artwork-download-alert"
                className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                  downloadFeedback.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-current" />
                    <span>{downloadFeedback.title}</span>
                  </div>
                  <button
                    type="button"
                    data-testid="dismiss-modal-download-alert-btn"
                    onClick={() => setDownloadFeedback(null)}
                    className="text-[10px] underline font-semibold cursor-pointer opacity-75 hover:opacity-100"
                  >
                    {currentLang === 'lo' ? 'ປິດ' : 'Dismiss'}
                  </button>
                </div>
                <p className="text-[11px] opacity-90">{downloadFeedback.message}</p>
                {downloadFeedback.failedFiles && downloadFeedback.failedFiles.length > 0 && (
                  <div className="text-[10px] font-mono bg-white/70 p-2 rounded-xl border border-current/10 max-h-24 overflow-y-auto space-y-0.5">
                    <div className="font-sans font-semibold text-[10px] mb-1">
                      {currentLang === 'lo' ? 'ລາຍຊື່ໄຟລ໌ທີ່ບໍ່ສຳເລັດ:' : 'Failed files:'}
                    </div>
                    {downloadFeedback.failedFiles.map((fname, i) => (
                      <div key={i} className="truncate">• {fname}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {photos.map((photo, pIdx) => (
                <div
                  key={pIdx}
                  onClick={() => {
                    setSelectedPhotoIdx(pIdx);
                    setIsGalleryModalOpen(false);
                    handleOpenPhotoInUniversalLightbox(photo, pIdx);
                  }}
                  className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-sky-500 cursor-pointer shadow-2xs transition hover:shadow-md"
                >
                  <div className="aspect-square w-full overflow-hidden bg-slate-100">
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                    />
                  </div>
                  <div className="p-2 bg-white">
                    <span className="text-[10.5px] font-bold text-slate-700 block truncate" title={photo.name}>
                      {pIdx + 1}. {photo.name}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                    <ZoomIn className="w-5 h-5 text-sky-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FormModalTemplate>
      )}
    </div>
  );
};

export default ArtworkPreviewCard;
