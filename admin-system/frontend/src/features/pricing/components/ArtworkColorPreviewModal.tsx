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
} from 'lucide-react';
import { QuotationItem } from './QuotationManager';
import { FormModalTemplate } from '@components/common/FormModalTemplate';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: QuotationItem | null;
  onSyncColorsToPrinter?: (colors: { c: number; m: number; y: number; k: number }) => void;
  onUpdateArtwork?: (data: { artworkUrl: string; fileName: string; mimeType: string; fileSize: number; batchFiles?: any[] }) => void;
  currentLang?: string;
}

export const ArtworkColorPreviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  item,
  onSyncColorsToPrinter,
  onUpdateArtwork,
  currentLang = 'lo',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [covC, setCovC] = useState<number>(15);
  const [covM, setCovM] = useState<number>(15);
  const [covY, setCovY] = useState<number>(15);
  const [covK, setCovK] = useState<number>(15);

  const [batchFiles, setBatchFiles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'preview' | 'gallery'>('preview');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      const pf = item.preflightData;
      setCovC(Number(item.cCoverage ?? pf?.color_pages_avg_c ?? pf?.avg_cov_c ?? 15));
      setCovM(Number(item.mCoverage ?? pf?.color_pages_avg_m ?? pf?.avg_cov_m ?? 15));
      setCovY(Number(item.yCoverage ?? pf?.color_pages_avg_y ?? pf?.avg_cov_y ?? 15));
      setCovK(Number(item.kCoverage ?? pf?.color_pages_avg_k ?? pf?.avg_cov_k ?? 15));

      const existingBatch = item.batchFiles || (pf as any)?.batch_files || [];
      setBatchFiles(existingBatch);
      if (existingBatch.length > 1) {
        setActiveTab('gallery');
      } else {
        setActiveTab('preview');
      }
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const pf = item.preflightData;
  const tac = pf?.tac_max_percent ?? (covC + covM + covY + covK);
  const currentPreviewUrl = selectedPhotoUrl || item.artworkUrl || pf?.file_url || (batchFiles[0]?.url);
  const fileName = item.fileName || pf?.file_name || item.name;
  const isImage = item.mimeType?.startsWith('image/') || fileName.match(/\.(png|jpe?g|webp|gif|svg)$/i) || currentPreviewUrl?.startsWith('blob:');
  const isPdf = item.mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    const files = Array.from(rawFiles).slice(0, 100);
    const newItems = files.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
    }));

    const combined = [...batchFiles, ...newItems].slice(0, 100);
    setBatchFiles(combined);

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

    if (combined.length > 1) {
      setActiveTab('gallery');
    }
  };

  const handleRemoveFile = (idx: number) => {
    const updated = batchFiles.filter((_, i) => i !== idx);
    setBatchFiles(updated);
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

    if (updated.length <= 1) {
      setActiveTab('preview');
    }
  };

  const handleSync = () => {
    if (onSyncColorsToPrinter) {
      onSyncColorsToPrinter({ c: covC, m: covM, y: covY, k: covK });
    }
  };

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<Palette className="w-5 h-5" />}
      title={currentLang === 'lo' ? 'ກວດສອບຄ່າສີ & ໄຟລ໌ອາດເວິກ' : 'Artwork & Color Inspection'}
      subtitle={fileName}
      badgeText={batchFiles.length > 1 ? `Batch (${batchFiles.length} ໄຟລ໌)` : 'Preflight'}
      maxWidthClass="max-w-4xl"
      footerActions={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {currentLang === 'lo' ? 'ປິດໜ້າຕ່າງ' : 'Close'}
          </button>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {batchFiles.length > 0
                  ? (currentLang === 'lo' ? '+ ເພີ່ມໄຟລ໌ / ອັບໂຫຼດຫຼາຍໄຟລ໌' : '+ Add / Upload Files')
                  : (currentLang === 'lo' ? 'ອັບໂຫຼດໄຟລ໌ (1-100 ໄຟລ໌)' : 'Upload File(s)')}
              </span>
            </button>

            {onSyncColorsToPrinter && (
              <button
                type="button"
                onClick={() => { handleSync(); onClose(); }}
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-xl text-xs font-black shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{currentLang === 'lo' ? 'ຊິງຄ໌ຄ່າສີເຂົ້າເຄື່ອງພິມ' : 'Sync Colors to Printer'}</span>
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left: Artwork File Visual Preview / Batch Gallery */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>{currentLang === 'lo' ? 'ໄຟລ໌ອາດເວິກ (Artwork Files)' : 'Artwork Files'}</span>
              </span>
              {batchFiles.length > 1 && (
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-black border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      activeTab === 'preview' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    ຕົວຢ່າງ
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('gallery')}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      activeTab === 'gallery' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    ແກເລີຣີ ({batchFiles.length})
                  </button>
                </div>
              )}
            </div>

            {currentPreviewUrl && (
              <a
                href={currentPreviewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>{currentLang === 'lo' ? 'ເປີດເຕັມຈໍ' : 'Fullscreen'}</span>
              </a>
            )}
          </div>

          {/* Visual Container: Single Preview or Gallery */}
          {activeTab === 'gallery' && batchFiles.length > 0 ? (
            <div className="w-full h-80 rounded-xl overflow-y-auto p-3 bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                <span>ລາຍການໄຟລ໌ທັງໝົດໃນລາຍການນີ້ ({batchFiles.length} ໄຟລ໌)</span>
                <span className="text-[10px] text-slate-400">ຄລິກເພື່ອເບິ່ງ • ກົດ X ເພື່ອລຶບ</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {batchFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="group relative bg-white border border-slate-200 hover:border-indigo-400 rounded-xl overflow-hidden shadow-2xs p-1.5 flex flex-col space-y-1 transition"
                  >
                    <div
                      onClick={() => {
                        setSelectedPhotoUrl(file.url);
                        setActiveTab('preview');
                      }}
                      className="aspect-square w-full rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden cursor-pointer relative"
                    >
                      {file.mimeType?.startsWith('image/') || file.name.match(/\.(png|jpe?g|webp|gif)$/i) || file.url?.startsWith('blob:') ? (
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      ) : (
                        <FileText className="w-8 h-8 text-indigo-500" />
                      )}
                    </div>
                    <div className="text-[9px] font-bold text-slate-700 truncate" title={file.name}>
                      {idx + 1}. {file.name}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(idx);
                      }}
                      className="absolute top-1 right-1 p-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                      title="ລຶບໄຟລ໌ນີ້"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Add More Card in Grid */}
                {batchFiles.length < 100 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 flex flex-col items-center justify-center text-indigo-600 text-[10px] font-bold gap-1 transition cursor-pointer p-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>+ ເພີ່ມໄຟລ໌</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="relative w-full h-80 rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200 flex items-center justify-center">
              {currentPreviewUrl ? (
                isImage ? (
                  <img
                    src={currentPreviewUrl}
                    alt={fileName}
                    className="w-full h-full object-contain p-2"
                  />
                ) : isPdf ? (
                  <iframe
                    src={`${currentPreviewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                    title={fileName}
                    className="w-full h-full border-0 rounded-xl bg-white"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-600 gap-2 p-6">
                    <FileText className="w-16 h-16 text-indigo-500" />
                    <span className="text-xs font-bold truncate max-w-[240px]">{fileName}</span>
                    <a
                      href={currentPreviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                    >
                      {currentLang === 'lo' ? 'ເປີດໄຟລ໌ໃນແຖບໃໝ່' : 'Open in New Tab'}
                    </a>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 p-8 space-y-3">
                  <ImageIcon className="w-14 h-14 stroke-[1.5] text-slate-300" />
                  <p className="text-xs font-semibold text-center">
                    {currentLang === 'lo' ? 'ຍັງບໍ່ມີໄຟລ໌ອາດເວິກແນບມາ' : 'No artwork attached yet'}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition cursor-pointer"
                  >
                    {currentLang === 'lo' ? 'ອັບໂຫຼດໄຟລ໌ PDF / ຮູບພາບ (1-100 ໄຟລ໌)' : 'Upload PDF or Image(s)'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* File Specs Badges */}
          <div className="w-full flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700">
              {item.jobSizePreset || 'A4'} ({item.jobWidth || 210}×{item.jobHeight || 297} mm)
            </span>
            <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700">
              {item.pagesPerBook || 1} ໜ້າ
            </span>
            {pf?.dpi_estimate && (
              <span className={`px-2 py-1 rounded-lg font-bold ${
                pf.dpi_estimate >= 300
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {pf.dpi_estimate} DPI
              </span>
            )}
            {pf?.color_space && (
              <span className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-bold">
                {pf.color_space}
              </span>
            )}
            {item.fileSize && (
              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-medium">
                {(item.fileSize / (1024 * 1024)).toFixed(2)} MB
              </span>
            )}
          </div>
        </div>

        {/* Right: CMYK Sliders */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>{currentLang === 'lo' ? 'ການຄວບຄຸມປະລິມານສີ' : 'Color Coverage Control'}</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono border border-slate-200">
                {item.colorPrintMode === 'MONO_K' ? 'Mono Black' : 'CMYK Process'}
              </span>
            </div>

            {/* Cyan */}
            <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  <span>Cyan (C)</span>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number" min="0" max="100" value={covC}
                    onChange={(e) => setCovC(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-12 px-1 py-0.5 text-right font-mono font-bold text-xs border border-slate-200 rounded-md bg-white"
                  />
                  <span className="text-slate-400 text-xs">%</span>
                </div>
              </div>
              <input type="range" min="0" max="100" value={covC}
                onChange={(e) => setCovC(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Magenta */}
            <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                  <span>Magenta (M)</span>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number" min="0" max="100" value={covM}
                    onChange={(e) => setCovM(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-12 px-1 py-0.5 text-right font-mono font-bold text-xs border border-slate-200 rounded-md bg-white"
                  />
                  <span className="text-slate-400 text-xs">%</span>
                </div>
              </div>
              <input type="range" min="0" max="100" value={covM}
                onChange={(e) => setCovM(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>

            {/* Yellow */}
            <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Yellow (Y)</span>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number" min="0" max="100" value={covY}
                    onChange={(e) => setCovY(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-12 px-1 py-0.5 text-right font-mono font-bold text-xs border border-slate-200 rounded-md bg-white"
                  />
                  <span className="text-slate-400 text-xs">%</span>
                </div>
              </div>
              <input type="range" min="0" max="100" value={covY}
                onChange={(e) => setCovY(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Key Black */}
            <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                  <span>Key Black (K)</span>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number" min="0" max="100" value={covK}
                    onChange={(e) => setCovK(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-12 px-1 py-0.5 text-right font-mono font-bold text-xs border border-slate-200 rounded-md bg-white"
                  />
                  <span className="text-slate-400 text-xs">%</span>
                </div>
              </div>
              <input type="range" min="0" max="100" value={covK}
                onChange={(e) => setCovK(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>
          </div>

          {/* Total TAC Indicator */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              {currentLang === 'lo' ? 'ຄວາມໜາແໜ້ນສີລວມ (TAC):' : 'Total Ink TAC:'}
            </span>
            <span className={`font-mono font-black ${tac > 320 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {tac.toFixed(1)}% {tac > 320 && '(ເກີນ 320%)'}
            </span>
          </div>
        </div>
      </div>

      {/* Preflight Diagnostics Summary Strip */}
      {pf && (
        <div className="p-3.5 bg-indigo-50/80 border border-indigo-100 rounded-2xl space-y-2 text-xs">
          <div className="font-bold text-indigo-950 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{currentLang === 'lo' ? 'ບົດສະຫຼຸບການກວດສອບໄຟລ໌ພິມ (Preflight Diagnostics):' : 'Preflight Diagnostics Summary:'}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="bg-white p-2 rounded-xl border border-indigo-100">
              <span className="text-slate-400 block text-[10px]">ໜ້າສີ (Color):</span>
              <span className="font-bold text-slate-800">{pf.color_pages_count ?? 0} ໜ້າ</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-indigo-100">
              <span className="text-slate-400 block text-[10px]">ໜ້າຂາວດຳ (Mono):</span>
              <span className="font-bold text-slate-800">{pf.mono_pages_count ?? 0} ໜ້າ</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-indigo-100">
              <span className="text-slate-400 block text-[10px]">ຕັດຕົກ (Bleed):</span>
              <span className={`font-bold ${pf.has_sufficient_bleed !== false ? 'text-emerald-700' : 'text-amber-700'}`}>
                {pf.bleed_mm ? `${pf.bleed_mm} mm` : 'ມາດຕະຖານ 3mm'}
              </span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-indigo-100">
              <span className="text-slate-400 block text-[10px]">ສະຖານະສີ:</span>
              <span className="font-bold text-slate-800">{pf.is_standard_cmyk ? 'CMYK ຖືກຕ້ອງ' : 'ກວດພົບ RGB'}</span>
            </div>
          </div>
        </div>
      )}
    </FormModalTemplate>
  );
};

export default ArtworkColorPreviewModal;
