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
  Loader2,
  BookOpen,
  Layers,
  ZoomIn
} from 'lucide-react';
import type { MasterOrderItem } from '../../../orders/types';
import { generateAndDownloadImposedPdf } from '../../../../utils/impositionPdfGenerator';

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

  // Determine if this item is a batch photo or marketing print item
  const isPhotoBatch = 
    item.job_name?.toLowerCase().includes('photo') ||
    item.job_name?.toLowerCase().includes('ຮູບ') ||
    item.specs?.template_id === 'TPL_PHOTO_PRINT' ||
    Array.isArray(item.specs?.batch_files) ||
    Array.isArray(item.specs?.gallery_urls);

  // Initialize or mock batch photo list for photo jobs
  const initialPhotos: PhotoItem[] = (() => {
    if (Array.isArray(item.specs?.batch_files) && item.specs.batch_files.length > 0) {
      return item.specs.batch_files.map((f: any, idx: number) => ({
        id: f.asset_id || `photo-${idx + 1}`,
        name: f.file_name || `Photo_${String(idx + 1).padStart(2, '0')}.jpg`,
        url: f.file_url || f.url,
        size: f.file_size,
      }));
    }
    if (Array.isArray(item.specs?.gallery_urls) && item.specs.gallery_urls.length > 0) {
      return item.specs.gallery_urls.map((url: string, idx: number) => ({
        id: `photo-${idx + 1}`,
        name: `Photo_${String(idx + 1).padStart(2, '0')}.jpg`,
        url,
      }));
    }
    if (isPhotoBatch) {
      // Provide standard 40 items preview if it's a 40-photo print job
      const count = Math.min(item.quantity || 40, 40);
      return Array.from({ length: count }).map((_, i) => ({
        id: `photo-${i + 1}`,
        name: `Photo_${String(i + 1).padStart(2, '0')}.jpg`,
        url: `/uploads/artworks/photo_${String(i + 1).padStart(2, '0')}.jpg`,
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
  const totalPhotos = photos.length || item.quantity || 40;
  const reqParentSheets = Math.ceil(totalPhotos / cutsPerSheet);
  const spoilSheets = Math.ceil(reqParentSheets * 0.05);
  const totalParentSheets = reqParentSheets + spoilSheets;

  // Handle batch ZIP download via backend streaming
  const handleDownloadAllZip = () => {
    const fileUrls = photos.map(p => p.url);
    const zipName = `${item.order_id || 'ORDER'}_${item.job_name || 'PHOTOS'}_AllFiles.zip`;
    const downloadUrl = `/api/v1/orders/batch-zip?zip_name=${encodeURIComponent(zipName)}&urls=${encodeURIComponent(fileUrls.join(','))}`;
    window.open(downloadUrl, '_blank');
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
  const isBook = Boolean(item.binding_type && item.binding_type !== 'NONE');
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
              {isHardcover ? 'ປົກແຂງຈົ່ວປັງ' : 'ສັນກາວຮ້ອນ'} Dual-Spec
            </span>
          )}
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
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

              {/* Contact Sheet Mini-Grid (Up to 16 visible thumbnails with zoom preview) */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 bg-white/70 rounded-xl border border-sky-100">
                {photos.slice(0, 24).map((p, idx) => (
                  <div
                    key={p.id || idx}
                    onClick={() => onPreviewArtwork(p.name, p.url)}
                    className="group relative aspect-square rounded-lg bg-slate-100 border border-slate-200 overflow-hidden cursor-pointer hover:border-sky-400 hover:shadow-xs transition"
                    title={p.name}
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center">
                      <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-sky-600 mb-0.5" />
                      <span className="text-[9px] font-mono text-slate-600 truncate w-full">
                        {p.name.replace(/\.[^/.]+$/, '')}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-sky-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <ZoomIn className="w-4 h-4" />
                    </div>
                  </div>
                ))}
                {photos.length > 24 && (
                  <div className="aspect-square rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 font-bold text-xs">
                    +{photos.length - 24}
                  </div>
                )}
              </div>

              {/* Action Buttons: Download ZIP & Imposed PDF */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  className="px-3 py-2 bg-white hover:bg-sky-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  title="ດາວໂຫຼດຮູບທັງໝົດເປັນ ZIP"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-600" />
                  <span>ໂຫຼດທັງໝົດ (ZIP)</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateImposedPdf}
                  disabled={isGeneratingPdf}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  title="ສ້າງ PDF ຈັດວາງ 3-Up ພ້ອມມາກຕັດ"
                >
                  {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                  <span>{isGeneratingPdf ? 'ກຳລັງສ້າງ...' : 'PDF ພ້ອມພິມ (Imposed)'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Section 2: Book Cover & Inner Split Dual Control Box */
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isBook ? 'ລະບົບແຍກໄຟລ໌ປົກ & ເນື້ອໃນ (Dual Component)' : 'ໄຟລ໌ອັດຕະໂນມັດພ້ອມພິມ (Artwork Assets)'}
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
              {isBook && (
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Auto-Split Cover:</strong> ຕັດ 4 ໜ້າປົກອອກຈາກເຈ້ຍເນື້ອໃນອັດຕະໂນມັດ ບໍ່ຄິດໄລ່ຕົ້ນທຶນເຈ້ຍຊ້ຳຊ້ອນ
                  </span>
                </div>
              )}
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
    </div>
  );
};
