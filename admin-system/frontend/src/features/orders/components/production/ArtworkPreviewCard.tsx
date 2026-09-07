import React, { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { FormModalTemplate } from '@components/common/FormModalTemplate';
import { downloadPhotosAsZip } from '@utils/zipDownloader';

interface ArtworkPreviewCardProps {
  orderIdDisplay: string;
  order?: any;
  driveLink?: string;
  artworkThumbnailUrl?: string;
  currentLang: string;
  onOpenDriveLink: () => void;
  setLightbox?: (lb: { src: string; title: string } | null) => void;
  onDownloadArtwork?: () => void;
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

  // Normalize batch photo items
  const photos: { name: string; url: string; size?: number }[] = (() => {
    if (Array.isArray(rawBatch) && rawBatch.length > 0) {
      return rawBatch.map((f: any, idx: number) => ({
        name: f.name || f.file_name || `Photo_${String(idx + 1).padStart(2, '0')}.jpg`,
        url: typeof f === 'string' ? f : (f.url || f.file_url || f.preview_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800`),
        size: f.size || f.file_size,
      }));
    }
    if (Array.isArray(galleryUrls) && galleryUrls.length > 0) {
      return galleryUrls.map((url: string, idx: number) => ({
        name: `Photo_${String(idx + 1).padStart(2, '0')}.jpg`,
        url,
      }));
    }

    // If single artwork or thumbnail exists
    const singleUrl = artworkThumbnailUrl || driveLink || firstItem.artwork_url || firstItem.artworkUrl || order?.artwork_url;
    if (singleUrl) {
      return [{
        name: firstItem.artwork_file_name || firstItem.artworkFileName || order?.artwork_file_name || `artwork_${orderIdDisplay}.jpg`,
        url: singleUrl,
      }];
    }

    // Sample fallback for photo print job
    const sampleImages = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800',
    ];

    return Array.from({ length: 16 }).map((_, i) => ({
      name: `Photo_Print_${String(i + 1).padStart(2, '0')}.jpg`,
      url: sampleImages[i % sampleImages.length],
    }));
  })();

  const activePhoto = photos[selectedPhotoIdx] || photos[0];
  const customerName = order?.customer_name || order?.customerName || order?.customer?.name || 'Somphavath DOUANGSVA';
  const customerPhone = order?.customer_phone || order?.customerPhone || order?.customer?.phone || order?.phone || '020 55889900';
  const customerAddress = order?.customer_address || order?.customerAddress || order?.customer?.address || order?.address || 'Saysettha, Vientiane';

  const handleOpenPhotoInUniversalLightbox = (photoItem: { name: string; url: string }, index: number) => {
    if (setLightbox && photoItem?.url) {
      setLightbox({
        src: photoItem.url,
        title: `${photoItem.name} (${index + 1}/${photos.length}) - #${orderIdDisplay}`
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
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Approved (CMYK)</span>
          </span>
        </div>

        {/* Customer Snapshot Box */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="truncate space-y-0.5">
            <div className="flex items-center gap-1.5">
              <strong className="text-slate-900 font-black">{customerName}</strong>
              <span className="text-[11px] font-mono text-slate-500 font-semibold">• {customerPhone}</span>
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
        </div>
      </div>

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
        ) : (
          <button
            type="button"
            onClick={() => handleOpenPhotoInUniversalLightbox(activePhoto, 0)}
            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span>{currentLang === 'lo' ? 'ເປີດເບິ່ງໄຟລ໌' : 'View Artwork'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={async () => {
            if (onDownloadArtwork) {
              onDownloadArtwork();
            } else if (photos.length > 1) {
              setIsZipping(true);
              try {
                await downloadPhotosAsZip(
                  photos,
                  `${orderIdDisplay}_artworks_${photos.length}_photos.zip`
                );
              } catch (err) {
                console.error('Download all zip error:', err);
              } finally {
                setIsZipping(false);
              }
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
          className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border-none"
        >
          {isZipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span>{photos.length > 1 ? (currentLang === 'lo' ? 'ດາວໂຫຼດ ZIP' : 'Download ZIP') : (currentLang === 'lo' ? 'ດາວໂຫຼດໄຟລ໌' : 'Download File')}</span>
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
                  onClick={async () => {
                    setIsZipping(true);
                    try {
                      await downloadPhotosAsZip(
                        photos,
                        `${orderIdDisplay}_artworks_${photos.length}_photos.zip`
                      );
                    } catch (err) {
                      console.error('Download zip error:', err);
                    } finally {
                      setIsZipping(false);
                    }
                  }}
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
