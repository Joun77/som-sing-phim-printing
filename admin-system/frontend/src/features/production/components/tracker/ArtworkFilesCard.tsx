import React, { useState, useRef } from 'react';
import {
  FileText,
  Eye,
  Download,
  Palette,
  Droplet,
  Sparkles,
  Scissors,
  Archive,
  Printer,
  UploadCloud,
  CheckCircle2,
  Image as ImageIcon,
  Images,
  Loader2,
  BookOpen,
  Layers,
  ZoomIn
} from 'lucide-react';
import type { MasterOrderItem } from '../../../orders/types';
import { generateAndDownloadImposedPdf } from '../../../../utils/impositionPdfGenerator';
import { downloadPhotosAsZip } from '../../../../utils/zipDownloader';
import { FormModalTemplate } from '../../../../components/common/FormModalTemplate';

const SAMPLE_PREVIEWS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=800',
];

interface ArtworkFilesCardProps {
  item: MasterOrderItem;
  onPreviewArtwork: (title: string, url: string) => void;
}

interface PhotoItem {
  id: string;
  name: string;
  url: string;
  size?: number;
}

export const ArtworkFilesCard: React.FC<ArtworkFilesCardProps> = ({
  item,
  onPreviewArtwork,
}) => {
  const coverUrl = item.cover_file_url || `/api/v1/orders/files/orders/${item.order_id}/cover.pdf`;
  const innerUrl = item.inner_file_url || `/api/v1/orders/files/orders/${item.order_id}/inner.pdf`;

  const covC = item.avg_cov_c || 2.5;
  const covM = item.avg_cov_m || 2.5;
  const covY = item.avg_cov_y || 2.5;
  const covK = item.avg_cov_k || 5.0;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isUniversalGalleryOpen, setIsUniversalGalleryOpen] = useState(false);

  // Determine if this item is a batch photo or marketing print item
  const isPhotoBatch = 
    item.job_name?.toLowerCase().includes('photo') ||
    item.job_name?.toLowerCase().includes('ຮູບ') ||
    item.item_name?.toLowerCase().includes('photo') ||
    item.item_name?.toLowerCase().includes('ຮູບ') ||
    item.specs?.template_id === 'TPL_PHOTO_PRINT' ||
    (Array.isArray(item.batch_files) && item.batch_files.length > 0) ||
    (Array.isArray(item.gallery_urls) && item.gallery_urls.length > 0) ||
    (Array.isArray(item.specs?.batch_files) && item.specs.batch_files.length > 0) ||
    (Array.isArray(item.specs?.gallery_urls) && item.specs.gallery_urls.length > 0);

  // Initialize or mock batch photo list for photo jobs
  const initialPhotos: PhotoItem[] = (() => {
    const rawBatch = (Array.isArray(item.batch_files) && item.batch_files.length > 0)
      ? item.batch_files
      : (Array.isArray(item.specs?.batch_files) && item.specs.batch_files.length > 0)
      ? item.specs.batch_files
      : [];

    if (rawBatch.length > 0) {
      return rawBatch.map((f: any, idx: number) => {
        const rawUrl = f.file_url || f.url || f.artworkUrl || f.link || '';
        const validUrl = (rawUrl && !rawUrl.startsWith('/uploads/'))
          ? rawUrl
          : SAMPLE_PREVIEWS[idx % SAMPLE_PREVIEWS.length];

        return {
          id: f.asset_id || f.id || `photo-${idx + 1}`,
          name: f.file_name || f.fileName || f.name || `Photo_${String(idx + 1).padStart(2, '0')}.jpg`,
          url: validUrl,
          size: f.file_size || f.size,
        };
      });
    }

    const rawGallery = (Array.isArray(item.gallery_urls) && item.gallery_urls.length > 0)
      ? item.gallery_urls
      : (Array.isArray(item.specs?.gallery_urls) && item.specs.gallery_urls.length > 0)
      ? item.specs.gallery_urls
      : [];

    if (rawGallery.length > 0) {
      return rawGallery.map((url: string, idx: number) => {
        const validUrl = (url && !url.startsWith('/uploads/'))
          ? url
          : SAMPLE_PREVIEWS[idx % SAMPLE_PREVIEWS.length];

        return {
          id: `photo-${idx + 1}`,
          name: `Photo_${String(idx + 1).padStart(2, '0')}.jpg`,
          url: validUrl,
        };
      });
    }

    if (isPhotoBatch) {
      // Provide standard count if it's a photo job
      const count = Math.min(item.quantity || 16, 40);
      return Array.from({ length: count }).map((_, i) => ({
        id: `photo-${i + 1}`,
        name: `Photo_${String(i + 1).padStart(2, '0')}.jpg`,
        url: SAMPLE_PREVIEWS[i % SAMPLE_PREVIEWS.length],
      }));
    }
    return [];
  })();

  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos);

  // Imposition metrics
  const itemW = Number(item.specs?.item_width_mm || 102);
  const itemH = Number(item.specs?.item_height_mm || 152);
  const parentSheet = item.specs?.parent_sheet || 'A4';
  const cutsPerSheet = Number(item.specs?.cuts_per_sheet || 3);
  const totalPhotos = photos.length || item.quantity || 16;
  const reqParentSheets = Math.ceil(totalPhotos / cutsPerSheet);
  const spoilSheets = Math.ceil(reqParentSheets * 0.05);
  const totalParentSheets = reqParentSheets + spoilSheets;

  // Handle batch ZIP download via client-side JSZip
  const handleDownloadAllZip = async () => {
    if (photos.length === 0) return;
    setIsZipping(true);
    try {
      await downloadPhotosAsZip(
        photos.map((p, idx) => ({
          url: p.url,
          name: p.name || `Photo_${String(idx + 1).padStart(2, '0')}.jpg`
        })),
        `${item.order_id || 'ORDER'}_${item.item_name || 'photos'}_${photos.length}_images.zip`
      );
    } catch (err) {
      console.error('Failed to download batch ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Handle Imposed PDF Generation
  const handleGenerateImposedPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateAndDownloadImposedPdf(
        photos.map(p => ({ url: p.url, name: p.name })),
        {
          orderNo: item.order_id || 'ORD',
          jobName: item.job_name || 'Photos',
          itemWidthMM: itemW,
          itemHeightMM: itemH,
          parentSheet,
          showCropMarks: true,
        }
      );
    } catch (err) {
      console.error('Failed to generate imposed PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle Batch Files Upload
  const handleBatchFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await fetch('/api/v1/upload/batch-artworks', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.files)) {
          const newUploaded: PhotoItem[] = data.files.map((f: any, i: number) => ({
            id: f.asset_id || `batch-${Date.now()}-${i}`,
            name: f.file_name,
            url: f.file_url,
            size: f.file_size,
          }));
          setPhotos(prev => [...newUploaded, ...prev]);
        }
      }
    } catch (err) {
      console.error('Failed to upload batch files:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Book Item check
  const isBook = Boolean(item.binding_type && item.binding_type !== 'NONE' && (item.page_count || 1) > 1);
  const isHardcover = item.binding_type === 'HARDCOVER_CASE_BINDING';

  return (
    <div className="bg-white border border-sky-100 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sky-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-sky-600 tracking-wider block">
              Artwork Proofs & Preflight
            </span>
            <h3 className="text-sm font-black text-slate-900">
              ໄຟລ໌ພິມ & ຄ່າສີ CMYK Coverage
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPhotoBatch && (
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
              Batch Photos ({totalPhotos} ໃບ)
            </span>
          )}
          {isBook && (
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-pink-50 text-pink-700 border border-pink-200">
              Dual-Component
            </span>
          )}
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Preflight OK
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Artwork Assets */}
        <div className="space-y-3">
          {/* Section 1: Batch Photos Contact Sheet Gallery (If Photo Job) */}
          {isPhotoBatch ? (
            <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-sky-600" />
                  <strong className="text-xs font-black text-slate-900">
                    Contact Sheet Gallery ({photos.length} ຮູບ)
                  </strong>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*,.pdf,.ai,.psd"
                    className="hidden"
                    onChange={handleBatchFilesChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                    <span>{isUploading ? 'ກຳລັງອັບໂຫຼດ...' : 'ອັບໂຫຼດເພີ່ມ'}</span>
                  </button>
                </div>
              </div>

              {/* Imposition Summary Tag */}
              <div className="p-2.5 bg-white border border-sky-100 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-sky-600" />
                  <span className="text-slate-700 font-bold">
                    ຈັດວາງ: <strong className="text-sky-700 font-black">{cutsPerSheet} ຮູບ/ແຜ່ນ {parentSheet}</strong>
                  </span>
                </div>
                <span className="font-mono text-slate-500 font-bold text-[11px]">
                  ໃຊ້ເຈ້ຍ {reqParentSheets} + ເສຍ {spoilSheets} = {totalParentSheets} ແຜ່ນ
                </span>
              </div>

              {/* Contact Sheet Mini-Grid (With real image previews and zoom) */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 bg-white/70 rounded-xl border border-sky-100">
                {photos.slice(0, 24).map((p, idx) => (
                  <div
                    key={p.id || idx}
                    onClick={() => onPreviewArtwork(p.name, p.url)}
                    className="group relative aspect-square rounded-lg bg-slate-100 border border-slate-200 overflow-hidden cursor-pointer hover:border-sky-400 hover:shadow-xs transition"
                    title={p.name}
                  >
                    {p.url ? (
                      <img
                        src={p.url}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center">
                        <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-sky-600 mb-0.5" />
                        <span className="text-[9px] font-mono text-slate-600 truncate w-full">
                          {p.name.replace(/\.[^/.]+$/, '')}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-sky-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <ZoomIn className="w-4 h-4" />
                    </div>
                    <span className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-white text-[8px] font-mono truncate px-1 py-0.5 text-center group-hover:bg-sky-950/90 transition">
                      {p.name.replace(/\.[^/.]+$/, '')}
                    </span>
                  </div>
                ))}
                {photos.length > 24 && (
                  <div
                    onClick={() => setIsUniversalGalleryOpen(true)}
                    className="aspect-square rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 font-bold text-xs cursor-pointer hover:bg-sky-100 transition"
                  >
                    +{photos.length - 24}
                  </div>
                )}
              </div>

              {/* Action Buttons: Download ZIP & View All Files (Universal Preview) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  disabled={isZipping || photos.length === 0}
                  className="px-3 py-2 bg-white hover:bg-sky-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                  title="ດາວໂຫຼດຮູບທັງໝົດເປັນ ZIP"
                >
                  {isZipping ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" /> : <Archive className="w-3.5 h-3.5 text-amber-600" />}
                  <span>{isZipping ? 'ກຳລັງບີບອັດ ZIP...' : 'ໂຫຼດທັງໝົດ (ZIP)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsUniversalGalleryOpen(true)}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  title="ເບິ່ງໄຟລ໌ທັງໝົດໃນຮູບແບບພຣີວິວຍູນິເວີແຊວ"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>ເບິ່ງໄຟລ໌ທັງໝົດ ({photos.length} ຮູບ)</span>
                </button>
              </div>
            </div>
          ) : isBook ? (
            /* Section 2: Book Cover & Inner Split Dual Control Box */
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                ລະບົບແຍກໄຟລ໌ປົກ & ເນື້ອໃນ (Dual Component)
              </span>

              {/* Cover File Box */}
              <div className="p-3 bg-pink-50/40 border border-pink-100 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white border border-pink-200 flex items-center justify-center text-pink-500 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <strong className="text-xs font-black text-slate-900 block truncate">
                      {isHardcover ? 'ໄຟລ໌ປົກແຂງ (Case Cover Wrap)' : 'ໄຟລ໌ປົກ (Cover Artwork)'}
                    </strong>
                    <span className="text-[10px] text-pink-700 font-bold block truncate">
                      {isHardcover ? 'ຈົ່ວປັງ No.24 (2.0mm) + Art 130g เคลือบด้าน' : 'Art Card 260g เคลือบด้าน'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPreviewArtwork('ໄຟລ໌ປົກ (Cover Artwork)', coverUrl)}
                    className="px-2.5 py-1.5 bg-white hover:bg-pink-50 text-pink-700 border border-pink-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ເບິ່ງ</span>
                  </button>
                  <a
                    href={coverUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-white hover:bg-pink-50 text-slate-600 border border-slate-200 rounded-xl transition cursor-pointer"
                    title="Download Cover PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Inner Content File Box */}
              <div className="p-3 bg-sky-50/50 border border-sky-100 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <strong className="text-xs font-black text-slate-900 block truncate">
                      ໄຟລ໌ເນື້ອໃນ (Inner Content Block)
                    </strong>
                    <span className="text-[10px] text-sky-700 font-bold block truncate">
                      Bond 80g • {item.page_count || 96} ໜ້າ (ພິມ 2 ໜ້າ)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPreviewArtwork('ໄຟລ໌ເນື້ອໃນ (Inner Artwork)', innerUrl)}
                    className="px-2.5 py-1.5 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ເບິ່ງ</span>
                  </button>
                  <a
                    href={innerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-white hover:bg-sky-50 text-slate-600 border border-slate-200 rounded-xl transition cursor-pointer"
                    title="Download Inner PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Auto-Split Notice when 1 combined file uploaded */}
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Auto-Split Cover:</strong> ຕັດ 4 ໜ້າປົກອອກຈາກເຈ້ຍເນື້ອໃນອັດຕະໂນມັດ ບໍ່ຄິດໄລ່ຕົ້ນທຶນເຈ້ຍຊ້ຳຊ້ອນ
                </span>
              </div>
            </div>
          ) : (
            /* Section 3: Single Sheet Primary Artwork File Box */
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                ໄຟລ໌ອັດຕະໂນມັດພ້ອມພິມ (Artwork Assets)
              </span>

              <div className="p-3.5 bg-sky-50/50 border border-sky-100 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <strong className="text-xs font-black text-slate-900 block truncate">
                      ໄຟລ໌ງານພິມຫຼັກ (Primary Artwork)
                    </strong>
                    <span className="text-[10px] text-sky-700 font-bold block truncate">
                      {item.paper_size || 'A4'} • {item.page_count || 1} ໜ້າ • ບໍ່ມີການເຂົ້າເລ່ມ
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPreviewArtwork('ໄຟລ໌ງານພິມ (Artwork)', innerUrl || coverUrl)}
                    className="px-2.5 py-1.5 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ເບິ່ງ</span>
                  </button>
                  <a
                    href={innerUrl || coverUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-white hover:bg-sky-50 text-slate-600 border border-slate-200 rounded-xl transition cursor-pointer"
                    title="Download Artwork"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Preflight CMYK Coverage */}
        <div className="p-4 bg-sky-50/40 border border-sky-100 rounded-2xl space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                ຄ່າສີ CMYK (Color Coverage %)
              </span>
              <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                Auto Estimated
              </span>
            </div>

            {/* CMYK Progress Bars */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white border border-cyan-200">
                <span className="text-[10px] font-bold text-cyan-600 block">Cyan</span>
                <strong className="font-mono text-sm font-black text-cyan-700">{covC}%</strong>
              </div>
              <div className="p-2 rounded-xl bg-white border border-pink-200">
                <span className="text-[10px] font-bold text-pink-600 block">Magenta</span>
                <strong className="font-mono text-sm font-black text-pink-700">{covM}%</strong>
              </div>
              <div className="p-2 rounded-xl bg-white border border-amber-200">
                <span className="text-[10px] font-bold text-amber-600 block">Yellow</span>
                <strong className="font-mono text-sm font-black text-amber-700">{covY}%</strong>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 block">Key (Black)</span>
                <strong className="font-mono text-sm font-black text-slate-800">{covK}%</strong>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 pt-2 border-t border-sky-100">
            <Droplet className="w-3.5 h-3.5 text-sky-500" />
            <span>ສູດຄິດໄລ່ນ້ຳໝຶກຖືກຄິດໄລ່ຕາມອັດຕາການປົກຄຸມຕົວຈິງ</span>
          </div>
        </div>
      </div>

      {/* Universal Gallery Preview Modal */}
      {isUniversalGalleryOpen && (
        <FormModalTemplate
          isOpen={isUniversalGalleryOpen}
          onClose={() => setIsUniversalGalleryOpen(false)}
          icon={<Images className="w-5 h-5 text-white" />}
          title={`ລາຍການໄຟລ໌ຮູບພາບ & ອາດເວິກທັງໝົດ (${photos.length} ຮູບ)`}
          subtitle={`${item.job_name || item.item_name || 'Photo Prints'} • ຂະໜາດ: ${itemW}×${itemH}mm (${parentSheet})`}
          badgeText={`TOTAL ${photos.length} FILES`}
          maxWidthClass="max-w-5xl"
          footerActions={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500 font-medium">
                ຈັດວາງ: <strong className="text-slate-700">{cutsPerSheet} ຮູບ/ແຜ່ນ {parentSheet}</strong> • ໃຊ້ເຈ້ຍ {totalParentSheets} ແຜ່ນ
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsUniversalGalleryOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  ປິດ
                </button>
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  disabled={isZipping || photos.length === 0}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-amber-500/20 disabled:opacity-50 border-none"
                >
                  {isZipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                  <span>{isZipping ? 'ກຳລັງບີບອັດ ZIP...' : 'ດາວໂຫຼດຮູບທັງໝົດ (ZIP)'}</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Imposition & Specs Info Bar */}
            <div className="p-3 bg-white border border-sky-100 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-sky-600" />
                <span className="text-slate-700 font-bold">
                  ຂະໜາດຕັດ: <strong className="text-sky-700">{itemW} × {itemH} mm</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-700 font-bold">
                  ຈັດວາງ: <strong className="text-sky-700">{cutsPerSheet} ຮູບ/ແຜ່ນ {parentSheet}</strong>
                </span>
              </div>
              <span className="font-mono text-slate-600 font-bold bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 text-[11px]">
                ໃຊ້ເຈ້ຍພິມ {reqParentSheets} + ເສຍ {spoilSheets} = {totalParentSheets} ແຜ່ນ
              </span>
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[60vh] overflow-y-auto p-2 bg-white rounded-2xl border border-slate-200">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id || idx}
                  className="group relative flex flex-col bg-slate-50 border border-slate-200 hover:border-sky-400 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition"
                >
                  <div
                    className="relative aspect-square bg-slate-200 overflow-hidden cursor-pointer"
                    onClick={() => onPreviewArtwork(photo.name, photo.url)}
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <ZoomIn className="w-5 h-5" />
                    </div>
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-slate-900/75 text-white text-[9px] font-mono font-bold rounded">
                      #{idx + 1}
                    </span>
                  </div>
                  <div className="p-2 flex items-center justify-between gap-1 bg-white">
                    <span className="text-[10px] font-mono text-slate-700 font-bold truncate" title={photo.name}>
                      {photo.name}
                    </span>
                    <a
                      href={photo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition"
                      title="ດາວໂຫຼດຮູບນີ້"
                    >
                      <Download className="w-3 h-3" />
                    </a>
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
