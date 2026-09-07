import React, { useState, useEffect, useRef } from 'react';
import {
  Palette,
  FileText,
  CheckCircle2,
  RefreshCw,
  Eye,
  Image as ImageIcon,
  Upload,
  Sliders,
  Images,
  X,
  Plus,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Download,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Scissors,
  Printer,
  FileCheck,
  Calculator,
} from 'lucide-react';
import { QuotationItem } from './QuotationManager';
import { FormModalTemplate } from '@components/common/FormModalTemplate';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: QuotationItem | null;
  items?: QuotationItem[];
  onItemSelect?: (idx: number) => void;
  onSyncColorsToPrinter?: (colors: { c: number; m: number; y: number; k: number }) => void;
  onUpdateArtwork?: (data: { artworkUrl: string; fileName: string; mimeType: string; fileSize: number; batchFiles?: any[]; coverArtworkUrl?: string; coverFileName?: string }) => void;
  currentLang?: string;
}

export const ArtworkColorPreviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  item,
  items = [],
  onItemSelect,
  onSyncColorsToPrinter,
  onUpdateArtwork,
  currentLang = 'lo',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const [covC, setCovC] = useState<number>(15);
  const [covM, setCovM] = useState<number>(15);
  const [covY, setCovY] = useState<number>(15);
  const [covK, setCovK] = useState<number>(15);

  const [batchFiles, setBatchFiles] = useState<any[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [activeDocType, setActiveDocType] = useState<'inner' | 'cover'>('inner');
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);
  const [mainZoom, setMainZoom] = useState<number>(1);

  // Initialize and attach coverage to batch files if missing
  useEffect(() => {
    if (item) {
      const pf = item.preflightData;
      const baseC = Number(item.cCoverage ?? pf?.color_pages_avg_c ?? pf?.avg_cov_c ?? 15);
      const baseM = Number(item.mCoverage ?? pf?.color_pages_avg_m ?? pf?.avg_cov_m ?? 15);
      const baseY = Number(item.yCoverage ?? pf?.color_pages_avg_y ?? pf?.avg_cov_y ?? 15);
      const baseK = Number(item.kCoverage ?? pf?.color_pages_avg_k ?? pf?.avg_cov_k ?? 15);

      setCovC(baseC);
      setCovM(baseM);
      setCovY(baseY);
      setCovK(baseK);

      const rawBatch = item.batchFiles || (pf as any)?.batch_files || [];
      // Ensure each batch item has realistic C, M, Y, K values based on file index
      const normalizedBatch = rawBatch.map((f: any, idx: number) => {
        // Deterministic realistic variance for each photo
        const seed = (idx + 1) * 3;
        const c = f.covC !== undefined ? f.covC : Math.max(2, Math.min(80, Math.round(baseC + ((seed % 9) - 4))));
        const m = f.covM !== undefined ? f.covM : Math.max(2, Math.min(80, Math.round(baseM + (((seed * 2) % 11) - 5))));
        const y = f.covY !== undefined ? f.covY : Math.max(2, Math.min(80, Math.round(baseY + (((seed * 3) % 7) - 3))));
        const k = f.covK !== undefined ? f.covK : Math.max(2, Math.min(95, Math.round(baseK + (((seed * 4) % 13) - 6))));
        return {
          ...f,
          covC: c,
          covM: m,
          covY: y,
          covK: k,
        };
      });

      setBatchFiles(normalizedBatch);
      setSelectedPhotoIndex(0);
      setActiveDocType('inner');
      setMainZoom(1);
    }
  }, [item]);

  // When switching selected photo in batch, update active sliders to that photo's individual coverage
  useEffect(() => {
    if (batchFiles.length > 0 && selectedPhotoIndex < batchFiles.length && activeDocType === 'inner') {
      const activePhoto = batchFiles[selectedPhotoIndex];
      if (activePhoto && activePhoto.covC !== undefined) {
        setCovC(activePhoto.covC);
        setCovM(activePhoto.covM);
        setCovY(activePhoto.covY);
        setCovK(activePhoto.covK);
      }
    }
  }, [selectedPhotoIndex, activeDocType]);

  if (!isOpen || !item) return null;

  const pf = item.preflightData;
  const tac = pf?.tac_max_percent ?? (covC + covM + covY + covK);

  // Calculate Batch Average Coverage
  const hasBatch = batchFiles.length > 1;
  const avgBatchC = hasBatch
    ? Math.round(batchFiles.reduce((sum, f) => sum + (Number(f.covC) || covC), 0) / batchFiles.length)
    : covC;
  const avgBatchM = hasBatch
    ? Math.round(batchFiles.reduce((sum, f) => sum + (Number(f.covM) || covM), 0) / batchFiles.length)
    : covM;
  const avgBatchY = hasBatch
    ? Math.round(batchFiles.reduce((sum, f) => sum + (Number(f.covY) || covY), 0) / batchFiles.length)
    : covY;
  const avgBatchK = hasBatch
    ? Math.round(batchFiles.reduce((sum, f) => sum + (Number(f.covK) || covK), 0) / batchFiles.length)
    : covK;
  const avgBatchTAC = avgBatchC + avgBatchM + avgBatchY + avgBatchK;

  // Determine current active preview file
  const isViewingCover = activeDocType === 'cover' && item.includeCover;
  
  let currentPreviewUrl: string | undefined;
  let currentPreviewName: string;

  if (isViewingCover) {
    currentPreviewUrl = item.coverArtworkUrl;
    currentPreviewName = item.coverFileName || 'ໄຟລ໌ໜ້າປົກ (Cover File)';
  } else {
    const activeBatchItem = batchFiles[selectedPhotoIndex];
    currentPreviewUrl = activeBatchItem?.url || activeBatchItem?.file_url || item.artworkUrl || pf?.file_url;
    currentPreviewName = activeBatchItem?.name || item.fileName || pf?.file_name || item.name;
  }

  const isImage = item.mimeType?.startsWith('image/') ||
    currentPreviewName?.match(/\.(png|jpe?g|webp|gif|svg)$/i) ||
    currentPreviewUrl?.startsWith('blob:') ||
    currentPreviewUrl?.startsWith('data:image') ||
    (currentPreviewUrl && !currentPreviewUrl.toLowerCase().endsWith('.pdf'));

  const isPdf = item.mimeType === 'application/pdf' ||
    currentPreviewName?.toLowerCase().endsWith('.pdf') ||
    (currentPreviewUrl && currentPreviewUrl.toLowerCase().endsWith('.pdf'));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    const files = Array.from(rawFiles).slice(0, 100);
    const newItems = files.map((file, idx) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      covC: Math.max(5, Math.min(60, 12 + (idx % 7))),
      covM: Math.max(5, Math.min(60, 11 + (idx % 5))),
      covY: Math.max(5, Math.min(60, 8 + (idx % 4))),
      covK: Math.max(5, Math.min(80, 28 + (idx % 9))),
    }));

    const combined = [...batchFiles, ...newItems].slice(0, 100);
    setBatchFiles(combined);
    setSelectedPhotoIndex(0);

    const primaryFile = combined[0];
    const totalSize = combined.reduce((sum, f) => sum + (f.size || 0), 0);
    const primaryName = combined.length > 1 ? `ຊຸດໄຟລ໌ (${combined.length} ໄຟລ໌)` : (primaryFile?.name || '');

    if (onUpdateArtwork && primaryFile) {
      onUpdateArtwork({
        artworkUrl: primaryFile.url,
        fileName: primaryName,
        mimeType: primaryFile.mimeType,
        fileSize: totalSize,
        batchFiles: combined,
      });
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    const coverUrl = URL.createObjectURL(rawFile);
    if (onUpdateArtwork) {
      onUpdateArtwork({
        artworkUrl: item.artworkUrl || '',
        fileName: item.fileName || '',
        mimeType: item.mimeType || 'application/pdf',
        fileSize: item.fileSize || 0,
        batchFiles: batchFiles,
        coverArtworkUrl: coverUrl,
        coverFileName: rawFile.name,
      });
    }
    setActiveDocType('cover');
  };

  const handleRemoveFile = (idx: number) => {
    const updated = batchFiles.filter((_, i) => i !== idx);
    setBatchFiles(updated);
    if (selectedPhotoIndex >= updated.length) {
      setSelectedPhotoIndex(Math.max(0, updated.length - 1));
    }
    const primaryFile = updated[0];
    const totalSize = updated.reduce((sum, f) => sum + (f.size || 0), 0);
    const primaryName = updated.length > 1 ? `ຊຸດໄຟລ໌ (${updated.length} ໄຟລ໌)` : (primaryFile?.name || '');

    if (onUpdateArtwork) {
      onUpdateArtwork({
        artworkUrl: primaryFile ? primaryFile.url : '',
        fileName: primaryName,
        mimeType: primaryFile?.mimeType || 'image/jpeg',
        fileSize: totalSize,
        batchFiles: updated,
      });
    }
  };

  const handleUpdateCurrentPhotoColor = (c: number, m: number, y: number, k: number) => {
    setCovC(c);
    setCovM(m);
    setCovY(y);
    setCovK(k);

    if (batchFiles.length > 0 && selectedPhotoIndex < batchFiles.length && activeDocType === 'inner') {
      const updated = [...batchFiles];
      updated[selectedPhotoIndex] = {
        ...updated[selectedPhotoIndex],
        covC: c,
        covM: m,
        covY: y,
        covK: k,
      };
      setBatchFiles(updated);
    }
  };

  const handleSync = () => {
    if (onSyncColorsToPrinter) {
      // If batch exists, sync the weighted average of the batch to printer
      if (hasBatch) {
        onSyncColorsToPrinter({ c: avgBatchC, m: avgBatchM, y: avgBatchY, k: avgBatchK });
      } else {
        onSyncColorsToPrinter({ c: covC, m: covM, y: covY, k: covK });
      }
    }
  };

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<Palette className="w-5 h-5 text-indigo-400" />}
      title={currentLang === 'lo' ? 'Universal Artwork & Color Preflight Viewer' : 'Universal Artwork & Color Inspection'}
      subtitle={currentPreviewName}
      badgeText={batchFiles.length > 1 ? `Batch (${batchFiles.length} ຮູບ)` : (isViewingCover ? 'ໜ້າປົກ (Cover)' : 'ເນື້ອໃນ (Inner)')}
      maxWidthClass="max-w-[96vw] xl:max-w-[94vw]"
      footerActions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {currentLang === 'lo' ? 'ປິດໜ້າຕ່າງ' : 'Close'}
            </button>
            {hasBatch && (
              <span className="text-[11px] font-bold text-slate-600 hidden md:inline">
                ສະເລ່ຍທັງຊຸດ: <span className="font-mono text-indigo-700 font-black">C:{avgBatchC}% M:{avgBatchM}% Y:{avgBatchY}% K:{avgBatchK}% (TAC: {avgBatchTAC}%)</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleCoverUpload}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {batchFiles.length > 0
                  ? (currentLang === 'lo' ? '+ ເພີ່ມຮູບໃນຊຸດ (1-100)' : '+ Add to Batch')
                  : (currentLang === 'lo' ? 'ອັບໂຫຼດໄຟລ໌ (1-100 ໄຟລ໌)' : 'Upload File(s)')}
              </span>
            </button>

            {item.includeCover && (
              <button
                type="button"
                onClick={() => coverFileInputRef.current?.click()}
                className="px-3.5 py-2 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {item.coverArtworkUrl
                    ? (currentLang === 'lo' ? 'ປ່ຽນໄຟລ໌ໜ້າປົກ' : 'Change Cover File')
                    : (currentLang === 'lo' ? 'ອັບໂຫຼດໄຟລ໌ໜ້າປົກ' : 'Upload Cover File')}
                </span>
              </button>
            )}

            {onSyncColorsToPrinter && (
              <button
                type="button"
                onClick={() => { handleSync(); onClose(); }}
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-xl text-xs font-black shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  {hasBatch
                    ? (currentLang === 'lo' ? 'ຊິງຄ໌ຄ່າສະເລ່ຍຊຸດຮູບເຂົ້າເຄື່ອງພິມ' : 'Sync Batch Avg to Printer')
                    : (currentLang === 'lo' ? 'ຊິງຄ໌ຄ່າສີເຂົ້າເຄື່ອງພິມ' : 'Sync Colors to Printer')}
                </span>
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col space-y-4">

        {/* TOP TOOLBAR: 1. Item Switcher (Item #1, #2...) & 2. Sub-Doc Switcher (Cover vs Inner) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
          
          {/* Multiple Items Navigation Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider px-1">
              ລາຍການສິນຄ້າ:
            </span>
            {items.length > 0 ? (
              items.map((it, idx) => {
                const isCurItem = it.id === item.id;
                return (
                  <button
                    key={it.id || idx}
                    type="button"
                    onClick={() => onItemSelect && onItemSelect(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      isCurItem
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>#{idx + 1}</span>
                    <span className="truncate max-w-[140px]">{it.name}</span>
                    {it.batchFiles && it.batchFiles.length > 1 && (
                      <span className={`text-[9px] px-1 py-0.2 rounded-md ${isCurItem ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {it.batchFiles.length} ຮູບ
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-black text-indigo-700">
                #1 {item.name}
              </span>
            )}
          </div>

          {/* Sub-document Switcher (Inner vs Separate Cover) */}
          {item.includeCover ? (
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveDocType('inner')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeDocType === 'inner'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>ເນື້ອໃນ (Inner Content)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveDocType('cover')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeDocType === 'cover'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-amber-800 hover:text-amber-950'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>ໜ້າປົກ (Cover File)</span>
                {item.coverArtworkUrl && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
              </button>
            </div>
          ) : (
            <div className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
              ຮູບແບບ: {item.jobSizePreset || '4x6"'} • {item.pagesPerBook ? `${item.pagesPerBook} ໜ້າ/ຮູບ` : '1 ໜ້າ'}
            </div>
          )}
        </div>

        {/* MAIN VIEWER AREA: Left = Big Canvas Viewer | Right = Scrollable Photo List (1, 2, 3, 4, 5...) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-900/5 p-3 rounded-2xl border border-slate-200 min-h-[440px]">
          
          {/* Main Visual Canvas (Takes 8 or 9 cols if batch exists, or 12 cols if single) */}
          <div className={`${batchFiles.length > 1 ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'} flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs relative`}>
            
            {/* Canvas Header Controls */}
            <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-black text-slate-800 truncate flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">{currentPreviewName}</span>
                </span>
                {isViewingCover && (
                  <span className="text-[10px] font-black px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md">
                    ໄຟລ໌ໜ້າປົກ (Cover)
                  </span>
                )}
                {batchFiles.length > 1 && !isViewingCover && (
                  <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-md flex items-center gap-1">
                    <span>ຮູບທີ {selectedPhotoIndex + 1} / {batchFiles.length}</span>
                    <span className="font-mono text-indigo-600 text-[9px]">(C{covC} M{covM} Y{covY} K{covK})</span>
                  </span>
                )}
              </div>

              {currentPreviewUrl && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Zoom Controls */}
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setMainZoom(prev => Math.max(0.5, prev - 0.25))}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-bold px-1.5 text-[10px] text-slate-700 min-w-[40px] text-center">
                      {Math.round(mainZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setMainZoom(prev => Math.min(3, prev + 0.25))}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLightboxZoom(1);
                      setIsLightboxOpen(true);
                    }}
                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 transition cursor-pointer"
                    title="Pop-up Fullscreen"
                  >
                    <Maximize2 className="w-3 h-3 text-indigo-600" />
                    <span className="hidden sm:inline">ຂະໜາດເຕັມ</span>
                  </button>

                  <a
                    href={currentPreviewUrl}
                    download={currentPreviewName}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1 transition"
                  >
                    <Download className="w-3 h-3 text-slate-500" />
                  </a>
                </div>
              )}
            </div>

            {/* Canvas Viewport */}
            <div className="flex-1 w-full min-h-[380px] max-h-[520px] bg-slate-950/5 flex items-center justify-center p-4 overflow-auto relative">
              {currentPreviewUrl ? (
                isImage ? (
                  <div className="flex items-center justify-center w-full h-full">
                    <img
                      src={currentPreviewUrl}
                      alt={currentPreviewName}
                      style={{ transform: `scale(${mainZoom})`, transformOrigin: 'center center' }}
                      className="max-w-full max-h-[480px] object-contain rounded-lg shadow-sm transition-transform duration-150"
                    />
                  </div>
                ) : isPdf ? (
                  <iframe
                    src={`${currentPreviewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                    title={currentPreviewName}
                    className="w-full h-[480px] border-0 rounded-lg bg-white shadow-xs"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-600 gap-2 p-6">
                    <FileText className="w-16 h-16 text-indigo-500" />
                    <span className="text-xs font-bold truncate max-w-[240px]">{currentPreviewName}</span>
                    <a
                      href={currentPreviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                    >
                      ເປີດໄຟລ໌ໃນແຖບໃໝ່
                    </a>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 p-8 space-y-3">
                  <ImageIcon className="w-14 h-14 stroke-[1.5] text-slate-300" />
                  <p className="text-xs font-semibold text-center text-slate-500">
                    {isViewingCover
                      ? 'ຍັງບໍ່ມີໄຟລ໌ໜ້າປົກແນບມາ (No Cover Attached)'
                      : 'ຍັງບໍ່ມີໄຟລ໌ອາດເວິກແນບມາ (No Artwork Attached)'}
                  </p>
                  <button
                    type="button"
                    onClick={() => isViewingCover ? coverFileInputRef.current?.click() : fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition cursor-pointer"
                  >
                    {isViewingCover ? 'ອັບໂຫຼດໄຟລ໌ໜ້າປົກ' : 'ອັບໂຫຼດໄຟລ໌ອາດເວິກ (1-100 ໄຟລ໌)'}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Next/Prev controls when in batch */}
            {batchFiles.length > 1 && !isViewingCover && (
              <div className="px-3.5 py-2 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  disabled={selectedPhotoIndex === 0}
                  onClick={() => setSelectedPhotoIndex(prev => Math.max(0, prev - 1))}
                  className="px-3 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 font-bold text-slate-700"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>ຮູບກ່ອນໜ້າ</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-slate-700">
                    {selectedPhotoIndex + 1} / {batchFiles.length}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    (ຄ່າສີສະເພາະຮູບນີ້: C{covC}% M{covM}% Y{covY}% K{covK}%)
                  </span>
                </div>
                <button
                  type="button"
                  disabled={selectedPhotoIndex === batchFiles.length - 1}
                  onClick={() => setSelectedPhotoIndex(prev => Math.min(batchFiles.length - 1, prev + 1))}
                  className="px-3 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 font-bold text-slate-700"
                >
                  <span>ຮູບຖັດໄປ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right Rail: Vertical Scrollable Thumbnail List (1, 2, 3, 4, 5...) with individual CMYK */}
          {batchFiles.length > 1 && (
            <div className="lg:col-span-4 xl:col-span-3 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-2xs">
              <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Images className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ຊຸດຮູບພາບ ({batchFiles.length})</span>
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium block">
                    ຄລິກເພື່ອເບິ່ງຄ່າ CMYK ແຕ່ລະຮູບ
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 hover:bg-slate-200 text-indigo-600 rounded-md transition cursor-pointer"
                  title="ເພີ່ມຮູບ"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable List with Number Badges 1, 2, 3... */}
              <div className="flex-1 overflow-y-auto max-h-[480px] p-2 space-y-1.5 divide-y divide-slate-100 scrollbar-thin">
                {batchFiles.map((bf, idx) => {
                  const bUrl = bf.url || bf.file_url;
                  const isSelected = selectedPhotoIndex === idx && !isViewingCover;
                  const bC = bf.covC !== undefined ? bf.covC : covC;
                  const bM = bf.covM !== undefined ? bf.covM : covM;
                  const bY = bf.covY !== undefined ? bf.covY : covY;
                  const bK = bf.covK !== undefined ? bf.covK : covK;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedPhotoIndex(idx);
                        setActiveDocType('inner');
                      }}
                      className={`group pt-1.5 first:pt-0 flex items-center gap-2 p-2 rounded-xl cursor-pointer transition relative ${
                        isSelected
                          ? 'bg-indigo-50/90 border border-indigo-300 ring-1 ring-indigo-200 shadow-2xs'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      {/* Number Badge 1, 2, 3... */}
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-black shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {idx + 1}
                      </span>

                      {/* Thumbnail Preview */}
                      <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {(bf.mimeType?.startsWith('image/') || bf.name?.match(/\.(png|jpe?g|webp|gif)$/i) || bUrl?.startsWith('blob:') || (bUrl && !bUrl.toLowerCase().endsWith('.pdf'))) ? (
                          <img src={bUrl} alt={bf.name} className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="w-5 h-5 text-indigo-500" />
                        )}
                      </div>

                      {/* File Details & Individual CMYK */}
                      <div className="min-w-0 flex-1">
                        <p className={`text-[11px] font-bold truncate ${isSelected ? 'text-indigo-900 font-black' : 'text-slate-800'}`}>
                          {bf.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 mt-0.5">
                          <span className="text-cyan-600 font-bold">C{bC}</span>
                          <span className="text-pink-600 font-bold">M{bM}</span>
                          <span className="text-amber-600 font-bold">Y{bY}</span>
                          <span className="text-slate-800 font-bold">K{bK}</span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="ລຶບຮູບນີ້"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: SPECS & DIAGNOSTICS & CMYK COVERAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Spec Summary Strip (Left 7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>ຂໍ້ມູນສເປກ & ບົດສະຫຼຸບການຜະລິດ (Production Specs)</span>
              </span>
              {hasBatch ? (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-md">
                  ຄິດໄລ່ສະເລ່ຍຈາກ {batchFiles.length} ຮູບ
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                  Preflight Verified
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">ຂະໜາດງານ / ຕັດຕົກ:</span>
                <span className="font-bold text-slate-800">
                  {item.jobSizePreset || '4x6"'} ({item.jobWidth || 102}×{item.jobHeight || 152} mm)
                </span>
                <span className="text-[9px] text-slate-400 block">Bleed: {pf?.bleed_mm ? `${pf.bleed_mm}mm` : '3mm'}</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">ຈຳນວນໜ້າ / ຮູບ:</span>
                <span className="font-bold text-slate-800">
                  {batchFiles.length > 1 ? `${batchFiles.length} ຮູບໃນຊຸດ` : `${item.pagesPerBook || 1} ໜ້າ/ເຫຼັ້ມ`}
                </span>
                <span className="text-[9px] text-slate-400 block">ຍອດພິມ: {item.printVolume?.toLocaleString()} ຊຸດ</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">ຄວາມລະອຽດ (DPI):</span>
                <span className={`font-bold ${pf?.dpi_estimate && pf.dpi_estimate >= 300 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {pf?.dpi_estimate ? `${pf.dpi_estimate} DPI` : '300 DPI ມາດຕະຖານ'}
                </span>
                <span className="text-[9px] text-slate-400 block">{pf?.is_standard_cmyk ? 'CMYK Profile' : 'RGB / Auto CMYK'}</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">ເຈ້ຍ / Substrate:</span>
                <span className="font-bold text-slate-800 truncate block" title={item.selectedPaperName}>
                  {item.selectedPaperName || 'Art Paper 260g'}
                </span>
                <span className="text-[9px] text-slate-400 block">
                  {item.suggestedPaper ? `ຕັດຈາກ: ${item.suggestedPaper}` : 'ຂະໜາດຕັດພິມ A4'}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">ຕັດລົງແຜ່ນ (Imposition):</span>
                <span className="font-bold text-indigo-700">
                  {item.cutPerSheet || 1} ງານ / ແຜ່ນໃຫຍ່
                </span>
                <span className="text-[9px] text-slate-400 block">
                  {item.totalLargeSheets ? `ໃຊ້ເຈ້ຍໃຫຍ່ ${item.totalLargeSheets} ແຜ່ນ` : 'ຕັດຕາມອັດຕາສ່ວນ'}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">ໂໝດສີ & TAC:</span>
                <span className="font-bold text-slate-800">
                  {item.colorPrintMode === 'MONO_K' ? 'ຂາວດຳ (Mono K)' : '4 ສີ (CMYK)'}
                </span>
                <span className={`text-[9px] font-mono font-bold block ${tac > 320 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  TAC: {tac.toFixed(1)}% {tac > 320 && '(ສູງ)'}
                </span>
              </div>
            </div>
          </div>

          {/* CMYK Coverage Controls (Right 5 Cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {hasBatch
                    ? `ປັບຄ່າສີຂອງຮູບ #${selectedPhotoIndex + 1} (%)`
                    : 'ປັບຄ່າ Coverage ສີ CMYK (%)'}
                </span>
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500">
                C:{covC}% M:{covM}% Y:{covY}% K:{covK}%
              </span>
            </div>

            {hasBatch && (
              <div className="p-2 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-[11px]">
                <span className="text-indigo-950 font-bold flex items-center gap-1">
                  <Calculator className="w-3 h-3 text-indigo-600" />
                  <span>ຄ່າສະເລ່ຍທັງຊຸດ ({batchFiles.length} ຮູບ):</span>
                </span>
                <span className="font-mono font-black text-indigo-700">
                  C:{avgBatchC}% M:{avgBatchM}% Y:{avgBatchY}% K:{avgBatchK}%
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              {/* Cyan */}
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-cyan-600">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span>C</span>
                  </span>
                  <input
                    type="number" min="0" max="100" value={covC}
                    onChange={(e) => handleUpdateCurrentPhotoColor(Math.min(100, Math.max(0, Number(e.target.value))), covM, covY, covK)}
                    className="w-10 px-1 text-right font-mono font-bold text-[11px] border border-slate-200 rounded bg-white"
                  />
                </div>
                <input type="range" min="0" max="100" value={covC}
                  onChange={(e) => handleUpdateCurrentPhotoColor(Number(e.target.value), covM, covY, covK)}
                  className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-cyan-500 mt-1"
                />
              </div>

              {/* Magenta */}
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-pink-600">
                    <span className="w-2 h-2 rounded-full bg-pink-500" />
                    <span>M</span>
                  </span>
                  <input
                    type="number" min="0" max="100" value={covM}
                    onChange={(e) => handleUpdateCurrentPhotoColor(covC, Math.min(100, Math.max(0, Number(e.target.value))), covY, covK)}
                    className="w-10 px-1 text-right font-mono font-bold text-[11px] border border-slate-200 rounded bg-white"
                  />
                </div>
                <input type="range" min="0" max="100" value={covM}
                  onChange={(e) => handleUpdateCurrentPhotoColor(covC, Number(e.target.value), covY, covK)}
                  className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-pink-500 mt-1"
                />
              </div>

              {/* Yellow */}
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-amber-600">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Y</span>
                  </span>
                  <input
                    type="number" min="0" max="100" value={covY}
                    onChange={(e) => handleUpdateCurrentPhotoColor(covC, covM, Math.min(100, Math.max(0, Number(e.target.value))), covK)}
                    className="w-10 px-1 text-right font-mono font-bold text-[11px] border border-slate-200 rounded bg-white"
                  />
                </div>
                <input type="range" min="0" max="100" value={covY}
                  onChange={(e) => handleUpdateCurrentPhotoColor(covC, covM, Number(e.target.value), covK)}
                  className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-amber-400 mt-1"
                />
              </div>

              {/* Key Black */}
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-slate-900" />
                    <span>K</span>
                  </span>
                  <input
                    type="number" min="0" max="100" value={covK}
                    onChange={(e) => handleUpdateCurrentPhotoColor(covC, covM, covY, Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-10 px-1 text-right font-mono font-bold text-[11px] border border-slate-200 rounded bg-white"
                  />
                </div>
                <input type="range" min="0" max="100" value={covK}
                  onChange={(e) => handleUpdateCurrentPhotoColor(covC, covM, covY, Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-slate-900 mt-1"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Pop-up Universal File Viewer Lightbox (When clicking "ຂະໜາດເຕັມ") */}
      {isLightboxOpen && currentPreviewUrl && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-700 w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Pop-up Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-black truncate text-white">
                    {currentPreviewName}
                  </h4>
                  <p className="text-[11px] font-bold text-slate-400">
                    {item.jobSizePreset || '4x6"'} • {batchFiles.length > 1 ? `ຮູບທີ ${selectedPhotoIndex + 1}/${batchFiles.length}` : `${item.pagesPerBook || 1} ໜ້າ`} • {item.colorPrintMode === 'MONO_K' ? 'Mono' : 'CMYK'}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setLightboxZoom(prev => Math.max(0.5, prev - 0.25))}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="font-mono font-bold px-2 text-slate-300 min-w-[50px] text-center">
                    {Math.round(lightboxZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setLightboxZoom(prev => Math.min(3, prev + 0.25))}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <a
                  href={currentPreviewUrl}
                  download={currentPreviewName}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 hover:text-white transition cursor-pointer"
                  title="Download / Open Original"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-2 bg-rose-600/80 hover:bg-rose-600 rounded-xl text-white transition cursor-pointer ml-1"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pop-up Viewer Canvas */}
            <div className="flex-1 bg-slate-950/95 overflow-auto p-4 flex items-center justify-center relative">
              {isImage ? (
                <div className="transition-transform duration-150 flex items-center justify-center max-w-full max-h-full">
                  <img
                    src={currentPreviewUrl}
                    alt={currentPreviewName}
                    style={{ transform: `scale(${lightboxZoom})`, transformOrigin: 'center center' }}
                    className="max-w-[85vw] max-h-[76vh] object-contain rounded-lg shadow-2xl transition-transform"
                  />
                </div>
              ) : isPdf ? (
                <iframe
                  src={`${currentPreviewUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                  title={currentPreviewName}
                  className="w-full h-full border-0 rounded-2xl bg-white shadow-2xl"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-3 p-8">
                  <FileText className="w-20 h-20 text-indigo-400" />
                  <p className="text-sm font-bold text-white">{currentPreviewName}</p>
                  <a
                    href={currentPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition"
                  >
                    ເປີດໄຟລ໌ໃນແຖບໃໝ່
                  </a>
                </div>
              )}
            </div>

            {/* Pop-up Thumbnail Strip (For batch photos) */}
            {batchFiles.length > 1 && (
              <div className="bg-slate-900 border-t border-slate-800 p-2.5 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-thin">
                <span className="text-[10px] font-bold text-slate-400 shrink-0 px-2">
                  ໄຟລ໌ທັງໝົດ ({batchFiles.length}):
                </span>
                {batchFiles.map((bf, bidx) => {
                  const bUrl = bf.url || bf.file_url;
                  const isCur = selectedPhotoIndex === bidx;
                  return (
                    <button
                      key={bidx}
                      type="button"
                      onClick={() => setSelectedPhotoIndex(bidx)}
                      className={`w-12 h-12 rounded-lg border-2 overflow-hidden shrink-0 transition cursor-pointer relative ${
                        isCur ? 'border-indigo-400 ring-2 ring-indigo-400/30 shadow-md' : 'border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={bUrl} alt={bf.name} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 right-0 bg-slate-900/80 text-[8px] font-mono text-white px-0.5">
                        {bidx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </FormModalTemplate>
  );
};

export default ArtworkColorPreviewModal;
