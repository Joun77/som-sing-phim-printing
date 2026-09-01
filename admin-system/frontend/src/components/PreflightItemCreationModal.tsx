import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Palette, 
  Sparkles, 
  Loader2, 
  FileCode, 
  ArrowRight, 
  Maximize2, 
  Printer, 
  FileCheck2, 
  Cpu, 
  Layers, 
  Eye, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  X, 
  ShieldCheck, 
  Crop 
} from 'lucide-react';
import { FormModalTemplate } from '@components/common/FormModalTemplate';
import { analyzeImageClient, analyzePDFClient } from '../lib/preflightAnalyzer';
import type { PreflightResult } from '../features/orders/types';

export interface PreflightItemCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: PreflightResult) => void;
  onSkip: () => void;
  currentLang?: string;
}

const SUPPORTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.psd'];

export const PreflightItemCreationModal: React.FC<PreflightItemCreationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onSkip,
  currentLang = 'lo',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetPaperSize, setTargetPaperSize] = useState<string>('A4');
  const [customWidth, setCustomWidth] = useState<number>(210);
  const [customHeight, setCustomHeight] = useState<number>(297);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number; pct: number }>({ current: 0, total: 0, pct: 0 });
  const [result, setResult] = useState<PreflightResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Inspector / Lightbox Modal State
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showBleedGuides, setShowBleedGuides] = useState<boolean>(true);

  // Print Mode
  const [customerPrintMode, setCustomerPrintMode] = useState<'COLOR' | 'MONO_ALL'>('COLOR');
  const [activeCoverageTab, setActiveCoverageTab] = useState<'color_pages' | 'mono_pages' | 'all_pages'>('color_pages');

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const handlePaperSizeChange = (size: string) => {
    setTargetPaperSize(size);
    let w = 210;
    let h = 297;
    if (size === 'A5') { w = 148; h = 210; }
    else if (size === 'A3') { w = 297; h = 420; }
    setCustomWidth(w);
    setCustomHeight(h);

    if (selectedFile) {
      handleFileProcess(selectedFile, size, w, h);
    }
  };

  const handleFileProcess = async (
    file: File,
    overrideSize?: string,
    overrideW?: number,
    overrideH?: number
  ) => {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setErrorMessage(
        currentLang === 'lo' 
          ? 'ຮອງຮັບສະເພາະໄຟລ໌ PDF ແລະ ໄຟລ໌ຮູບພາບ (.pdf, .jpg, .png, .webp, .tiff, .psd)'
          : 'Supports PDF and image formats (.pdf, .jpg, .png, .webp, .tiff, .psd)'
      );
      return;
    }

    setSelectedFile(file);
    setIsScanning(true);
    setErrorMessage(null);
    setProgress({ current: 0, total: 1, pct: 0 });

    // Generate thumbnail preview for images immediately
    if (ext !== '.pdf') {
      try {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } catch (e) {}
    } else {
      setPreviewUrl(null);
    }

    const currentSize = overrideSize || targetPaperSize;
    const currentW = overrideW || customWidth;
    const currentH = overrideH || customHeight;

    try {
      let analysisResult: PreflightResult;
      const isImg = ext !== '.pdf';

      const options = {
        targetPaperSize: currentSize,
        targetWidthMM: currentW,
        targetHeightMM: currentH,
        onProgress: (current: number, total: number, pct: number) => {
          setProgress({ current, total, pct });
        }
      };

      if (isImg) {
        analysisResult = await analyzeImageClient(file, options);
      } else {
        analysisResult = await analyzePDFClient(file, options);
      }

      // Background Upload Artwork File to server
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'artwork');
        fetch('/api/upload/artwork', {
          method: 'POST',
          body: formData,
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && (data.fileUrl || data.url)) {
              const uploadedUrl = data.fileUrl || data.url;
              analysisResult.file_url = uploadedUrl;
              setResult(prev => prev ? { ...prev, file_url: uploadedUrl } : prev);
            }
          })
          .catch(e => console.warn('Background artwork upload warn:', e));
      } catch (err) {
        console.warn('Background upload trigger failed:', err);
      }

      if (analysisResult.file_url) {
        setPreviewUrl(analysisResult.file_url);
      }

      setResult(analysisResult);
    } catch (err: any) {
      console.error('Preflight error:', err);
      setErrorMessage(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການວິເຄາະໄຟລ໌');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const totalPages = result?.total_pages || 1;
  const colorPages = customerPrintMode === 'MONO_ALL' ? 0 : (result?.color_pages_count || 0);
  const monoPages = customerPrintMode === 'MONO_ALL' ? totalPages : (result?.mono_pages_count || 0);

  const rawColorC = result?.color_pages_avg_c || result?.avg_cov_c || 0;
  const rawColorM = result?.color_pages_avg_m || result?.avg_cov_m || 0;
  const rawColorY = result?.color_pages_avg_y || result?.avg_cov_y || 0;
  const rawColorK = result?.color_pages_avg_k || result?.avg_cov_k || 0;

  const rawMonoK = result?.mono_pages_avg_k || result?.avg_cov_k || 0;
  const convertedMonoAllK = Math.round((rawColorK + 0.299 * rawColorC + 0.587 * rawColorM + 0.114 * rawColorY) * 100) / 100;
  const effectiveMonoK = customerPrintMode === 'MONO_ALL' ? Math.max(convertedMonoAllK, rawMonoK) : rawMonoK;

  // Combined Channels & Grand Total Average Ink %
  const combinedC = customerPrintMode === 'MONO_ALL' ? 0 : Math.round(((rawColorC * colorPages) / totalPages) * 100) / 100;
  const combinedM = customerPrintMode === 'MONO_ALL' ? 0 : Math.round(((rawColorM * colorPages) / totalPages) * 100) / 100;
  const combinedY = customerPrintMode === 'MONO_ALL' ? 0 : Math.round(((rawColorY * colorPages) / totalPages) * 100) / 100;
  const combinedK = customerPrintMode === 'MONO_ALL' 
    ? effectiveMonoK 
    : Math.round((((rawColorK * colorPages) + (rawMonoK * monoPages)) / totalPages) * 100) / 100;

  const grandTotalAverageInk = Math.round((combinedC + combinedM + combinedY + combinedK) * 100) / 100;

  const handleConfirm = () => {
    if (result) {
      // Determine which coverage set to pass based on user selection or active tab
      const isColorTabActive = activeCoverageTab === 'color_pages' || customerPrintMode === 'COLOR';
      
      const passedC = customerPrintMode === 'MONO_ALL' ? 0 : (isColorTabActive ? rawColorC : combinedC);
      const passedM = customerPrintMode === 'MONO_ALL' ? 0 : (isColorTabActive ? rawColorM : combinedM);
      const passedY = customerPrintMode === 'MONO_ALL' ? 0 : (isColorTabActive ? rawColorY : combinedY);
      const passedK = customerPrintMode === 'MONO_ALL' 
        ? effectiveMonoK 
        : (isColorTabActive ? rawColorK : combinedK);

      onConfirm({
        ...result,
        file_url: previewUrl || result.file_url,
        color_mode: customerPrintMode === 'MONO_ALL' ? 'MONO_K' : 'CMYK',
        color_pages_count: colorPages,
        mono_pages_count: monoPages,
        color_pages_avg_c: rawColorC,
        color_pages_avg_m: rawColorM,
        color_pages_avg_y: rawColorY,
        color_pages_avg_k: rawColorK,
        mono_pages_avg_k: effectiveMonoK,
        avg_cov_c: passedC,
        avg_cov_m: passedM,
        avg_cov_y: passedY,
        avg_cov_k: passedK,
        target_paper_size: targetPaperSize,
        target_width_mm: customWidth,
        target_height_mm: customHeight,
      });
    }
  };

  return (
    <>
      <FormModalTemplate
        isOpen={isOpen}
        onClose={onClose}
        icon={<Sparkles className="w-5 h-5 text-accent-sky" />}
        title="ກວດສອບໄຟລ໌ & ປະເມີນຄ່າສີ (Preflight Analyzer)"
        subtitle="ອັບໂຫລດໄຟລ໌ເພື່ອດຶງຈຳນວນໜ້າ, ແຍກໜ້າສີ/ຂາວດຳ, ຄິດໄລ່ຄ່າສີ ແລະ ເບິ່ງຕົວຢ່າງໄຟລ໌ອັດຕະໂນມັດ"
        maxWidthClass="max-w-6xl"
        badgeText={result ? `${totalPages} ໜ້າ (${result.color_space || 'CMYK'})` : 'AI Preflight'}
        footerActions={
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <button
              type="button"
              onClick={onSkip}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              {currentLang === 'lo' ? 'ຂ້າມ / ສ້າງລາຍການເປົ່າ (Manual)' : 'Skip / Create Blank Item'}
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                {currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={!result || isScanning}
                onClick={handleConfirm}
                className={`w-full sm:w-auto px-6 py-2.5 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
                  result && !isScanning
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>{currentLang === 'lo' ? 'ຕົກລົງ / ນຳໃຊ້ຂໍ້ມູນສ້າງລາຍການ' : 'Apply & Create Item'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          
          {/* Main 2-Column Responsive Layout (Spacious & Clean) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[520px]">
            
            {/* Left Column: File Input, Size & Controls (5 Cols) */}
            <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
              
              <div className="space-y-4">
                {/* Step 1: Target Paper Size */}
                <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-primary-navy" />
                      <span>1. ຂະໜາດເຈ້ຍທີ່ຈະພິມ (Target Size):</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-bold font-mono">
                      {customWidth} × {customHeight} mm
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'A4', label: 'A4', desc: '210×297' },
                      { id: 'A5', label: 'A5', desc: '148×210' },
                      { id: 'A3', label: 'A3', desc: '297×420' },
                      { id: 'CUSTOM', label: 'Custom', desc: 'ກຳນົດເອງ' },
                    ].map((sz) => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => handlePaperSizeChange(sz.id)}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          targetPaperSize === sz.id
                            ? 'bg-primary-navy text-white border-primary-navy shadow-xs font-black'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-bold'
                        }`}
                      >
                        <div className="text-xs">{sz.label}</div>
                        <div className={`text-[9px] ${targetPaperSize === sz.id ? 'text-slate-300' : 'text-slate-400'}`}>
                          {sz.desc}
                        </div>
                      </button>
                    ))}
                  </div>

                  {targetPaperSize === 'CUSTOM' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1 flex-1">
                        <span className="text-[11px] font-bold text-slate-500">W:</span>
                        <input
                          type="number"
                          value={customWidth}
                          onChange={(e) => setCustomWidth(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                        />
                      </div>
                      <div className="flex items-center gap-1 flex-1">
                        <span className="text-[11px] font-bold text-slate-500">H:</span>
                        <input
                          type="number"
                          value={customHeight}
                          onChange={(e) => setCustomHeight(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2: Upload / Drop Zone with Quick Re-upload */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition cursor-pointer relative ${
                    isDragOver 
                      ? 'border-primary-navy bg-primary-navy/5 scale-[1.01]' 
                      : 'border-slate-300 bg-white hover:border-primary-navy/60 hover:bg-slate-50'
                  }`}
                  onClick={() => document.getElementById('preflight-modal-file-input')?.click()}
                >
                  <input
                    id="preflight-modal-file-input"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.tiff,.tif,.psd"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileProcess(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="flex flex-col items-center justify-center space-y-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-primary-navy/10 text-primary-navy flex items-center justify-center shadow-xs">
                      {isScanning ? (
                        <Loader2 className="w-6 h-6 animate-spin text-primary-navy" />
                      ) : (
                        <UploadCloud className="w-6 h-6" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-800 truncate max-w-[280px]">
                        {selectedFile ? selectedFile.name : (currentLang === 'lo' ? 'ຄລິກເພື່ອເລືອກໄຟລ໌ ຫຼື ລາກມາວາງ' : 'Click to browse or drop artwork')}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                        PDF, PNG, JPG, WebP, TIFF, PSD
                      </p>
                    </div>

                    {selectedFile && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition">
                        <RefreshCw className="w-3 h-3 text-accent-sky" /> ປ່ຽນໄຟລ໌ໃໝ່
                      </span>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Scanning Progress */}
                {isScanning && (
                  <div className="p-3.5 bg-primary-navy/5 border border-primary-navy/20 rounded-2xl space-y-2">
                    <div className="flex justify-between text-xs font-bold text-primary-navy">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>ກຳລັງກວດສອບໜ້າ {progress.current} / {progress.total}...</span>
                      </span>
                      <span>{progress.pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary-navy h-full transition-all duration-150"
                        style={{ width: `${progress.pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Customer Print Mode Selector (Pinned to bottom of Left Col) */}
              {result && !isScanning && (
                <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-2.5">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-emerald-600" />
                    <span>2. ໂໝດການພິມ (Print Mode):</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomerPrintMode('COLOR')}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        customerPrintMode === 'COLOR'
                          ? 'bg-pink-50 border-pink-300 text-pink-950 font-black shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-xs">
                        <Palette className="w-3 h-3 text-pink-500" />
                        <span>ພິມສີ (Color)</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                        ສີ {result.color_pages_count} • ຂາວດຳ {result.mono_pages_count}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustomerPrintMode('MONO_ALL')}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        customerPrintMode === 'MONO_ALL'
                          ? 'bg-slate-900 border-slate-900 text-white font-black shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-xs">
                        <FileCode className="w-3 h-3 text-slate-400" />
                        <span>ຂາວດຳລ້ວນ (B&W)</span>
                      </div>
                      <div className={`text-[10px] font-normal mt-0.5 ${customerPrintMode === 'MONO_ALL' ? 'text-slate-300' : 'text-slate-400'}`}>
                        ໝຶກດຳ {totalPages} ໜ້າ
                      </div>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Interactive Artwork Preview & Diagnostic Studio (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {!result && !isScanning ? (
                <div className="h-full min-h-[440px] p-6 bg-slate-50 border border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-3.5 bg-white text-slate-400 rounded-2xl shadow-xs border border-slate-200">
                    <FileCheck2 className="w-9 h-9 text-accent-sky" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">
                      ລໍຖ້າການອັບໂຫລດໄຟລ໌ເພື່ອວິເຄາະ
                    </h4>
                    <p className="text-xs text-slate-500 font-sans max-w-sm mt-1">
                      ລະບົບຈະສະແດງຕົວຢ່າງໄຟລ໌ (Preview), ຄິດໄລ່ຈຳນວນໜ້າ, ແຍກໜ້າສີ vs ຂາວດຳ, ວັດແທກ CMYK Coverage %, ແລະ ກວດສອບ Bleed / DPI ໃຫ້ອັດຕະໂນມັດ
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[11px] font-bold text-slate-600 w-full max-w-md">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Visual Preview</span>
                    </div>
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-accent-sky" />
                      <span>Auto CMYK %</span>
                    </div>
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-1.5 col-span-2 sm:col-span-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>DPI & Bleed</span>
                    </div>
                  </div>
                </div>
              ) : result && !isScanning ? (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* 🌟 1. Interactive Artwork Thumbnail Preview Card */}
                  <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex items-center gap-4">
                    {/* Thumbnail Container with Click to Enlarge / Inspect */}
                    <div 
                      onClick={() => previewUrl && setIsInspectorOpen(true)}
                      className={`w-20 h-24 sm:w-24 sm:h-28 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 relative group shadow-2xs ${
                        previewUrl ? 'cursor-pointer hover:ring-2 hover:ring-accent-sky/50' : ''
                      }`}
                      title="ກົດເພື່ອເບິ່ງຮູບຂະໜາດເຕັມ (Click to Inspect Full View)"
                    >
                      {previewUrl ? (
                        <>
                          <img 
                            src={previewUrl} 
                            alt="Artwork Preview" 
                            className="w-full h-full object-contain p-1 transition duration-200 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-5 h-5 drop-shadow" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                          <FileText className="w-8 h-8 text-primary-navy/40" />
                          <span className="text-[9px] font-bold mt-1 text-slate-500 font-mono">PDF Doc</span>
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-slate-900/80 text-white rounded text-[8px] font-mono font-bold">
                        {totalPages} P
                      </span>
                    </div>

                    {/* Thumbnail Info Details & Inspect Action */}
                    <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 truncate max-w-[240px] sm:max-w-[320px]">
                            {result.file_name}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-sans">
                            {result.file_type || (selectedFile?.name.endsWith('.pdf') ? 'PDF Document' : 'Raster Image')}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black shrink-0">
                          {result.color_space || 'CMYK'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-bold text-slate-500">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                          ຂະໜາດ: {customWidth} × {customHeight} mm
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                          DPI: {result.dpi_estimate || 300}
                        </span>
                        {result.bleed_mm !== undefined && (
                          <span className={`px-2 py-0.5 rounded-md ${result.has_sufficient_bleed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            Bleed: {result.bleed_mm} mm
                          </span>
                        )}
                        {previewUrl && (
                          <button
                            type="button"
                            onClick={() => setIsInspectorOpen(true)}
                            className="px-2 py-0.5 bg-sky-50 hover:bg-sky-100 text-accent-sky rounded-md font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" /> ເບິ່ງຮູບເຕັມ
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 🌟 2. Preflight Color & Ink Studio (Dark Elevation Panel) */}
                  <div className="p-5 bg-gradient-to-br from-primary-navy to-slate-900 text-white rounded-3xl space-y-4 shadow-md">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold">
                          ການແຍກໜ້າ & ຄວາມເຂັ້ມຂຸ້ນສີ (Coverage Diagnostics)
                        </span>
                      </div>
                      <span className="text-[11px] font-black px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg font-sans">
                        {totalPages} ໜ້າທັງໝົດ
                      </span>
                    </div>

                    {/* Sub Tab Switcher */}
                    <div className="bg-white/10 p-1 rounded-xl flex gap-1 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setActiveCoverageTab('color_pages')}
                        className={`flex-1 py-2 rounded-lg transition cursor-pointer text-center ${
                          activeCoverageTab === 'color_pages'
                            ? 'bg-pink-600 text-white shadow-xs font-black'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        ໜ້າສີ ({colorPages})
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveCoverageTab('mono_pages')}
                        className={`flex-1 py-2 rounded-lg transition cursor-pointer text-center ${
                          activeCoverageTab === 'mono_pages'
                            ? 'bg-slate-700 text-white shadow-xs font-black'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        ໜ້າຂາວດຳ ({monoPages})
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveCoverageTab('all_pages')}
                        className={`flex-1 py-2 rounded-lg transition cursor-pointer text-center ${
                          activeCoverageTab === 'all_pages'
                            ? 'bg-emerald-600 text-white shadow-xs font-black'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        ລວມທັງໝົດ
                      </button>
                    </div>

                    {/* Tab 1: Color Pages */}
                    {activeCoverageTab === 'color_pages' && (
                      <div className="p-3.5 bg-white/5 rounded-2xl space-y-2.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300">ຈຳນວນໜ້າສີ: <strong className="text-pink-300">{colorPages} ໜ້າ</strong></span>
                          <span className="font-mono text-pink-300 font-bold">{Math.round((rawColorC + rawColorM + rawColorY + rawColorK) * 100) / 100}% Total CMYK</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center font-mono font-bold text-xs">
                          <div className="bg-sky-500/20 border border-sky-500/30 text-sky-300 py-2 rounded-xl">C: {rawColorC}%</div>
                          <div className="bg-pink-500/20 border border-pink-500/30 text-pink-300 py-2 rounded-xl">M: {rawColorM}%</div>
                          <div className="bg-amber-500/20 border border-amber-500/30 text-amber-300 py-2 rounded-xl">Y: {rawColorY}%</div>
                          <div className="bg-slate-700/60 border border-slate-600 text-slate-200 py-2 rounded-xl">K: {rawColorK}%</div>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Mono Pages */}
                    {activeCoverageTab === 'mono_pages' && (
                      <div className="p-3.5 bg-white/5 rounded-2xl space-y-2.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300">ຈຳນວນໜ້າຂາວດຳ: <strong className="text-slate-100">{monoPages} ໜ້າ</strong></span>
                          <span className="font-mono text-slate-100 font-bold">{effectiveMonoK}% K Ink</span>
                        </div>
                        <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-mono text-center text-slate-200 font-bold">
                          Black / Key (K): {effectiveMonoK}% (ບໍ່ຄິດຄ່າສີ C, M, Y)
                        </div>
                      </div>
                    )}

                    {/* Tab 3: All Pages Combined */}
                    {activeCoverageTab === 'all_pages' && (
                      <div className="p-3.5 bg-white/5 rounded-2xl space-y-3">
                        <div className="bg-white/10 p-3 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-start text-xs">
                            <div>
                              <span className="text-slate-200 font-bold block">ຄ່າສີສະເລ່ຍຕໍ່ໜ້າ (Avg per Page):</span>
                              <span className="text-[10px] text-slate-400 font-sans">(ຖົວສະເລ່ຍ {totalPages} ໜ້າ: ສີ {colorPages} + ຂາວດຳ {monoPages})</span>
                            </div>
                            <span className="font-mono font-black text-emerald-400 text-base">{grandTotalAverageInk}%</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-center font-mono font-bold text-xs">
                          <div className="bg-sky-500/20 border border-sky-500/30 text-sky-300 py-2 rounded-xl">C: {combinedC}%</div>
                          <div className="bg-pink-500/20 border border-pink-500/30 text-pink-300 py-2 rounded-xl">M: {combinedM}%</div>
                          <div className="bg-amber-500/20 border border-amber-500/30 text-amber-300 py-2 rounded-xl">Y: {combinedY}%</div>
                          <div className="bg-slate-700/60 border border-slate-600 text-slate-200 py-2 rounded-xl">K: {combinedK}%</div>
                        </div>
                      </div>
                    )}

                    {/* Preflight Quality Specs Badges */}
                    <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-bold text-slate-300 border-t border-white/10">
                      <span className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${result.has_sufficient_bleed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Bleed: {result.bleed_mm} mm
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-200">
                        DPI: {result.dpi_estimate}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-200">
                        ຂະໜາດເຈ້ຍ: {targetPaperSize} ({customWidth}×{customHeight} mm)
                      </span>
                    </div>

                  </div>
                </div>
              ) : null}
            </div>

          </div>

        </div>
      </FormModalTemplate>

      {/* 🌟 3. Lightbox / Fullscreen Artwork Inspector Modal */}
      {isInspectorOpen && previewUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Inspector Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Eye className="w-4 h-4 text-accent-sky" />
                </div>
                <div>
                  <h4 className="text-xs font-black truncate max-w-[320px] sm:max-w-[450px]">
                    {result?.file_name || selectedFile?.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-sans">
                    {customWidth} × {customHeight} mm • DPI: {result?.dpi_estimate || 300} • {totalPages} Pages
                  </p>
                </div>
              </div>

              {/* Inspector Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBleedGuides(!showBleedGuides)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    showBleedGuides ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                  title="ສະແດງເສັ້ນຕັດຕົກ Bleed 3mm"
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Bleed Guides</span>
                </button>

                <div className="flex items-center bg-white/10 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
                    className="p-1 text-slate-300 hover:text-white transition cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono font-bold px-2 text-white">
                    {zoomLevel}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.min(250, prev + 25))}
                    className="p-1 text-slate-300 hover:text-white transition cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    className="p-1 text-slate-300 hover:text-white transition cursor-pointer"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsInspectorOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Inspector Canvas Container */}
            <div className="flex-1 bg-slate-900/95 overflow-auto p-6 flex items-center justify-center relative min-h-[400px]">
              <div 
                className="relative bg-white shadow-2xl transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'center center',
                }}
              >
                <img 
                  src={previewUrl} 
                  alt="Full Artwork" 
                  className="max-h-[60vh] object-contain block select-none pointer-events-none"
                />

                {/* Bleed & Safe Guides Overlay */}
                {showBleedGuides && (
                  <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-rose-500/80 m-2">
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-rose-600 text-white rounded text-[8px] font-mono font-bold">
                      Bleed 3mm (Cut Line)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Inspector Footer Note */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>ກວດສອບຄວາມຖືກຕ້ອງຂອງອັດຕາສ່ວນ ແລະ ເສັ້ນຕັດຕົກກ່ອນນຳໄປສັ່ງຜະລິດ</span>
              </div>
              <button
                type="button"
                onClick={() => setIsInspectorOpen(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold transition hover:bg-slate-800 cursor-pointer"
              >
                ປິດໜ້າຕ່າງ
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
