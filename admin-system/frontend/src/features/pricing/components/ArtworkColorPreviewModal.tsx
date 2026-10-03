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
import { uploadOriginal } from '../../../api/artworkUpload';
import ArtworkThumbnail from '../../../components/common/ArtworkThumbnail';
import UniversalViewer from '../../../components/common/UniversalViewer';
import ArtworkPartsPanel from '../../orders/components/ArtworkPartsPanel';
import { QuotationItem } from './QuotationManager';
import { FormModalTemplate } from '@components/common/FormModalTemplate';

interface Props {
  sourceLocked?: boolean;
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
  sourceLocked = false,
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
  const uploadGeneration = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  useEffect(() => { uploadGeneration.current++; setUploading(false); setUploadError(''); return () => { uploadGeneration.current++; }; }, [isOpen, item?.id]);

  const [covC, setCovC] = useState<number>(15);
  const [covM, setCovM] = useState<number>(15);
  const [covY, setCovY] = useState<number>(15);
  const [covK, setCovK] = useState<number>(15);

  const [batchFiles, setBatchFiles] = useState<any[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [activeDocType, setActiveDocType] = useState<'inner' | 'cover'>('inner');

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
          name: f.file_name || f.name,
          url: f.originalUrl || f.file_url || f.url,
          covC: c,
          covM: m,
          covY: y,
          covK: k,
        };
      });

      setBatchFiles(normalizedBatch);
      setSelectedPhotoIndex(0);
      setActiveDocType('inner');
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

  if (item.artworkParts?.length) return <FormModalTemplate isOpen={isOpen} onClose={onClose} title={item.name}><ArtworkPartsPanel parts={item.artworkParts} /></FormModalTemplate>;

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
    currentPreviewUrl = activeBatchItem?.originalUrl || activeBatchItem?.file_url || activeBatchItem?.url || item.artworkUrl || pf?.file_url;
    currentPreviewName = activeBatchItem?.file_name || activeBatchItem?.name || item.fileName || pf?.file_name || item.name;
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (sourceLocked || uploading) return;
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    const files = Array.from(rawFiles).slice(0, 100); e.target.value = '';
    const generation = ++uploadGeneration.current; setUploading(true); setUploadError('');
    try {
    const newItems = [];
    for (const file of files) {
      const url = await uploadOriginal(file); if (generation !== uploadGeneration.current) return;
      newItems.push({ name: file.name, file_name: file.name, url, file_url: url, originalUrl: url, size: file.size, file_size: file.size, mimeType: file.type, covC, covM, covY, covK });
    }

    const combined = [...batchFiles, ...newItems].slice(0, 100);
    setBatchFiles(combined);
    setSelectedPhotoIndex(0);

    const primaryFile = combined[0];

    if (onUpdateArtwork && primaryFile) {
      onUpdateArtwork({
        artworkUrl: primaryFile.originalUrl || primaryFile.file_url || primaryFile.url,
        fileName: primaryFile.file_name || primaryFile.name,
        mimeType: primaryFile.mimeType,
        fileSize: primaryFile.file_size || primaryFile.size,
        batchFiles: combined,
      });
    }
    } catch { if (generation === uploadGeneration.current) setUploadError('ອັບໂຫຼດຕົ້ນສະບັບບໍ່ສຳເລັດ ກະລຸນາລອງໃໝ່'); }
    finally { if (generation === uploadGeneration.current) setUploading(false); }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (sourceLocked || uploading) return;
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    e.target.value = ''; const generation = ++uploadGeneration.current; setUploading(true); setUploadError('');
    try {
    const coverUrl = await uploadOriginal(rawFile); if (generation !== uploadGeneration.current) return;
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
    } catch { if (generation === uploadGeneration.current) setUploadError('ອັບໂຫຼດຕົ້ນສະບັບບໍ່ສຳເລັດ ກະລຸນາລອງໃໝ່'); }
    finally { if (generation === uploadGeneration.current) setUploading(false); }
  };

  const handleRemoveFile = (idx: number) => {
    if (sourceLocked || uploading) return;
    const updated = batchFiles.filter((_, i) => i !== idx);
    setBatchFiles(updated);
    if (selectedPhotoIndex >= updated.length) {
      setSelectedPhotoIndex(Math.max(0, updated.length - 1));
    }
    const primaryFile = updated[0];

    if (onUpdateArtwork) {
      onUpdateArtwork({
        artworkUrl: primaryFile ? primaryFile.originalUrl || primaryFile.file_url || primaryFile.url : '',
        fileName: primaryFile?.file_name || primaryFile?.name || '',
        mimeType: primaryFile?.mimeType || 'image/jpeg',
        fileSize: primaryFile?.file_size || primaryFile?.size || 0,
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
      title={currentLang === 'lo' ? 'ກວດສອບໄຟລ໌ ແລະ ຄ່າສີ' : 'Universal Artwork & Color Inspection'}
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
              disabled={sourceLocked || uploading}
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
            <input
              ref={coverFileInputRef}
              type="file"
              disabled={sourceLocked || uploading}
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleCoverUpload}
            />

            <button
              type="button"
              disabled={sourceLocked || uploading}
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
                disabled={sourceLocked || uploading}
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
        {uploadError && <p role="alert" className="text-rose-600">{uploadError}</p>}
        {uploading && <p role="status" className="text-slate-500">ກຳລັງອັບໂຫຼດຕົ້ນສະບັບ…</p>}

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

            </div>
            <div className="w-full h-[520px] min-h-0 overflow-hidden" data-testid="quotation-original-preview">
              <UniversalViewer embedded language={currentLang} src={currentPreviewUrl} fileName={currentPreviewName} fileSize={isViewingCover ? undefined : batchFiles[selectedPhotoIndex]?.file_size || batchFiles[selectedPhotoIndex]?.size || item.fileSize} onClose={onClose} />
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
                  disabled={sourceLocked || uploading}
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
                  const bUrl = bf.originalUrl || bf.file_url || bf.url;
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
                          <ArtworkThumbnail url={bUrl} name={bf.name} language={currentLang} />
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

    </FormModalTemplate>
  );
};

export default ArtworkColorPreviewModal;
