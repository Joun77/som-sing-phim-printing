import React, { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Cpu,
  Layers,
  Image as ImageIcon,
  Maximize2,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  Printer,
  ShieldCheck,
  Zap,
  Save,
  Palette,
  Droplet
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PreflightResult } from '../features/orders/types';
import { analyzeImageClient, analyzePDFClient, convertRGBToCMYKCanvas } from '../lib/preflightAnalyzer';

interface PreflightCheckerProps {
  onSendToQuotation?: (result: PreflightResult) => void;
  onSkipToManual?: () => void;
  orderId?: string;
}

const SUPPORTED_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.tiff',
  '.tif',
  '.psd',
  '.bmp',
  '.gif',
];

export const PreflightChecker: React.FC<PreflightCheckerProps> = ({
  onSendToQuotation,
  onSkipToManual,
  orderId,
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PreflightResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [printColorMode, setPrintColorMode] = useState<'CMYK' | 'MONO_K'>('CMYK');
  
  // Auto-convert CMYK Simulation & Backend Log States
  const [isCmykSimulated, setIsCmykSimulated] = useState(false);
  const [cmykSimulatedUrl, setCmykSimulatedUrl] = useState<string | null>(null);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [reportSavedStatus, setReportSavedStatus] = useState<string | null>(null);

  const isImageFile = (fileName: string) => {
    const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    return ext !== '.pdf';
  };

  const handleFileUpload = async (selectedFile: File) => {
    const ext = selectedFile.name.slice(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setErrorMessage(
        currentLang === 'lo'
          ? 'ຮອງຮັບສະເພາະໄຟລ໌ PDF ແລະ ໄຟລ໌ຮູບພາບ (.pdf, .jpg, .png, .webp, .tiff, .psd)'
          : 'Supports PDF and Image formats (.pdf, .jpg, .png, .webp, .tiff, .psd)'
      );
      return;
    }

    setFile(selectedFile);
    setIsAnalyzing(true);
    setErrorMessage(null);
    setResult(null);
    setZoomLevel(1);

    const isImg = isImageFile(selectedFile.name);

    // Create local preview
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    try {
      let analysisResult: PreflightResult;

      if (isImg) {
        analysisResult = await analyzeImageClient(selectedFile);
      } else {
        analysisResult = await analyzePDFClient(selectedFile);
      }

      // Background upload to store file on server if online
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await fetch('/api/v1/orders/upload', {
          method: 'POST',
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.file_url) {
            analysisResult.file_url = uploadData.file_url;
          }
        }
      } catch {
        // Server offline
      }

      setResult(analysisResult);
      handleSavePreflightReport(analysisResult);
    } catch (err: any) {
      console.error('Preflight analysis error:', err);
      setErrorMessage(
        currentLang === 'lo'
          ? `ການກວດສອບໄຟລ໌ຜິດພາດ: ${err.message || 'ບໍ່ສາມາດອ່ານຄ່າສີໄດ້'}`
          : `Preflight analysis error: ${err.message || 'Unable to extract colors'}`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAutoConvertRGBToCMYK = () => {
    if (!previewUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = img.naturalWidth || img.width;
      srcCanvas.height = img.naturalHeight || img.height;
      const ctx = srcCanvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const cmykCanvas = convertRGBToCMYKCanvas(srcCanvas);
      const convertedDataUrl = cmykCanvas.toDataURL('image/jpeg', 0.92);

      setCmykSimulatedUrl(convertedDataUrl);
      setIsCmykSimulated(true);

      if (result) {
        setResult({
          ...result,
          has_rgb: false,
          is_standard_cmyk: true,
          color_space: 'CMYK Gamut Proofed (Soft Proof)',
          status_badge_lao: currentLang === 'lo' ? 'ແປງເປັນ CMYK Gamut ຮຽບຮ້ອຍ' : 'Converted to CMYK Gamut',
          diagnostics: {
            ...result.diagnostics,
            colorSpace: 'PASS',
            tac: 'PASS',
            bleed: result.diagnostics?.bleed || 'PASS',
            dpi: result.diagnostics?.dpi || 'PASS',
          },
        });
      }
    };
    img.src = previewUrl;
  };

  const handleSavePreflightReport = async (resToSave?: PreflightResult) => {
    const reportData = resToSave || result;
    if (!reportData) return;

    const targetOrderId = orderId || `ORD-TMP-${Date.now().toString().slice(-6)}`;
    setIsSavingReport(true);
    try {
      const payload = {
        order_id: targetOrderId,
        file_name: reportData.file_name,
        total_pages: reportData.total_pages,
        color_space: reportData.color_space,
        has_rgb: reportData.has_rgb,
        is_standard_cmyk: reportData.is_standard_cmyk,
        dpi_estimate: reportData.dpi_estimate || 300,
        bleed_mm: reportData.bleed_mm || 0,
        has_sufficient_bleed: reportData.has_sufficient_bleed ?? true,
        tac_max_percent: reportData.tac_max_percent || 0,
        tac_warning: reportData.tac_warning || false,
        avg_cov_c: reportData.avg_cov_c,
        avg_cov_m: reportData.avg_cov_m,
        avg_cov_y: reportData.avg_cov_y,
        avg_cov_k: reportData.avg_cov_k,
        report_json: reportData,
      };

      const res = await fetch(`/api/v1/orders/${targetOrderId}/preflight-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setReportSavedStatus(`Saved #${targetOrderId}`);
      }
    } catch {
      // ignore
    } finally {
      setIsSavingReport(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreviewUrl(null);
    setCmykSimulatedUrl(null);
    setIsCmykSimulated(false);
    setResult(null);
    setErrorMessage(null);
    setZoomLevel(1);
    setReportSavedStatus(null);
  };

  // Calculate Total Ink Coverage (TIC / TAC)
  const totalInkCoverage = result
    ? Math.round((result.avg_cov_c + result.avg_cov_m + result.avg_cov_y + result.avg_cov_k) * 100) / 100
    : 0;

  return (
    <div className="w-full space-y-6 text-slate-800 font-sans">
      
      {/* 1. TOP HEADER BANNER (CLEAN WHITE ENTERPRISE THEME) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-accent-sky border border-sky-100 flex items-center justify-center shrink-0 shadow-xs">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                {currentLang === 'lo' ? 'ກວດສອບໄຟລ໌ພິມ & ຄ່າສີ CMYK' : 'Preflight & Color Cost Engine'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black">
                Pixel Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {currentLang === 'lo' 
                ? 'ສະແດງຕົວຢ່າງໄຟລ໌ Preview, ສະກັດຄ່າສີສະເລ່ຍ CMYK, ກວດສອບ DPI ແລະ ສົ່ງເຂົ້າໃບສະເໜີລາຄາທັນທີ' 
                : 'Interactive artwork preview, pixel-accurate CMYK ink extraction, DPI check & instant quotation sync.'
              }
            </p>
          </div>
        </div>

        {result && (
          <button
            onClick={resetAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200/80 active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-slate-600" />
            <span>{currentLang === 'lo' ? 'ອັບໂຫຼດໄຟລ໌ໃໝ່' : 'Upload New File'}</span>
          </button>
        )}
      </div>

      {/* 2. INITIAL CLEAN WHITE DROP ZONE & INFO PILLARS */}
      {!result && (
        <div className="space-y-6">
          {/* Main Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('preflight-file-input')?.click()}
            className={`border-2 border-dashed rounded-3xl p-10 sm:p-16 text-center transition-all cursor-pointer bg-white shadow-xs ${
              isDragOver
                ? 'border-accent-sky bg-sky-50/40 scale-[1.005]'
                : 'border-slate-300 hover:border-accent-sky hover:bg-slate-50/60'
            }`}
          >
            <input
              id="preflight-file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.tiff,.tif,.psd,.bmp,.gif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            <div className="flex flex-col items-center justify-center gap-4 max-w-2xl mx-auto">
              <div className="flex items-center gap-3 p-4 bg-sky-50 rounded-2xl text-accent-sky border border-sky-100 shadow-xs">
                <Upload className="w-8 h-8 animate-bounce text-accent-sky" />
                <ImageIcon className="w-8 h-8 text-pink-500" />
                <FileText className="w-8 h-8 text-indigo-500" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {currentLang === 'lo' 
                    ? 'ອັບໂຫຼດໄຟລ໌' 
                    : 'Upload Artwork File'
                  }
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                  {currentLang === 'lo' 
                    ? 'ກວດສອບເມັດສີ CMYK, ຈຳນວນໜ້າ ແລະ ຄວາມຄົມຊັດ DPI ອັດຕະໂນມັດ' 
                    : 'System extracts exact CMYK coverage, page count, and resolution DPI for precise cost estimation.'
                  }
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">PDF Document</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">JPEG / JPG</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">PNG Transparent</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">WebP / TIFF</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">PSD</span>
              </div>

              {isAnalyzing && (
                <div className="flex items-center gap-2.5 mt-4 px-6 py-3.5 bg-sky-50 border border-sky-200 rounded-2xl text-sky-700 animate-pulse text-sm font-bold shadow-xs">
                  <RefreshCw className="w-5 h-5 animate-spin text-accent-sky" />
                  <span>{currentLang === 'lo' ? 'ກຳລັງອ່ານເມັດສີ ແລະ ປະມວນຜົນພິກເຊວຕົວຈິງ...' : 'Extracting pixels & computing CMYK coverage...'}</span>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-center gap-2.5 mt-4 px-5 py-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs sm:text-sm font-semibold">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3 Information Pillars (Clean White Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-sky-600 font-black text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>100% Real Pixel Sampling</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {currentLang === 'lo' 
                  ? 'ຖອດລະຫັດເມັດສີ RGB ຕົວຈິງຈາກທຸກພິກເຊວ ແລ້ວແປງເປັນ CMYK % ທີ່ຖືກຕ້ອງຕາມມາດຕະຖານໂຮງພິມ' 
                  : 'Decodes actual RGB pixels with GCR algorithm into standard CMYK printing coverage percentages.'
                }
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-sm">
                <Printer className="w-5 h-5" />
                <span>DPI & Print Resolution</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {currentLang === 'lo' 
                  ? 'ກວດສອບຂະໜາດພິກເຊວ (W × H) ເພື່ອແນະນຳຂະໜາດພິມທີ່ເໝາະສົມ (A3, A4, A5, ສະຕິກເກີ) ປ້ອງກັນພາບແຕກ' 
                  : 'Verifies pixel dimensions to recommend optimal print sizes and avoid low-resolution pixelation.'
                }
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                <Zap className="w-5 h-5" />
                <span>1-Click Quotation Sync</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {currentLang === 'lo' 
                  ? 'ສົ່ງຄ່າ % ສີ ແລະ ຈຳນວນໜ້າເຂົ້າຟອມໃບສະເໜີລາຄາອັດຕະໂນມັດ ໂດຍບໍ່ຕ້ອງປ້ອນຂໍ້ມູນເອງ' 
                  : 'Automatically forwards ink percentages and page count to the Quotation Engine without manual typing.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. 2-COLUMN SPLIT STUDIO (FULL-WIDTH 100% WHITE ENTERPRISE THEME) */}
      {result && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Interactive Preview Canvas (8 Cols on XL) */}
          <div className="xl:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-accent-sky" />
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {currentLang === 'lo' ? 'ຕົວຢ່າງໄຟລ໌ພິມ (Live Artwork Preview)' : 'Live Artwork Preview'}
                </h3>
              </div>

              {/* Zoom & Auto-Convert Controls */}
              <div className="flex items-center gap-2">
                {isImageFile(result.file_name) && (
                  <button
                    type="button"
                    onClick={handleAutoConvertRGBToCMYK}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                      isCmykSimulated
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                    }`}
                    title="Auto-convert RGB pixels to CMYK gamut simulation"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>{isCmykSimulated ? (currentLang === 'lo' ? 'ແປງ CMYK ແລ້ວ' : 'CMYK Proofed') : (currentLang === 'lo' ? 'ຈຳລອງສີ CMYK' : 'Simulate CMYK')}</span>
                  </button>
                )}

                {isImageFile(result.file_name) && (
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                      className="p-1 hover:bg-slate-200 rounded text-slate-600 transition cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-1.5 font-mono text-xs font-bold text-slate-700">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                      className="p-1 hover:bg-slate-200 rounded text-slate-600 transition cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(1)}
                      className="px-2 py-0.5 text-[11px] font-bold bg-white hover:bg-slate-200 rounded text-slate-700 transition cursor-pointer border border-slate-200 shadow-2xs"
                    >
                      Fit
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Viewport (560px Height) */}
            <div className="relative w-full h-[560px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/80 flex items-center justify-center group">
              {previewUrl && isImageFile(result.file_name) ? (
                <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
                  <img
                    src={cmykSimulatedUrl || previewUrl}
                    alt={result.file_name}
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.15s ease-out',
                    }}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-md"
                  />
                </div>
              ) : previewUrl && !isImageFile(result.file_name) ? (
                <iframe
                  src={previewUrl}
                  title="PDF Preview"
                  className="w-full h-full border-0 rounded-2xl bg-white"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <FileText className="w-16 h-16 text-slate-300" />
                  <p className="text-xs font-semibold">{currentLang === 'lo' ? 'ບໍ່ມີຕົວຢ່າງສະແດງຜົນ' : 'No preview available'}</p>
                </div>
              )}

              {/* Overlaid Dimension Tag */}
              {result.image_width && result.image_height && (
                <div className="absolute bottom-4 left-4 px-3.5 py-2 bg-white/90 backdrop-blur-md rounded-xl text-xs font-mono border border-slate-200 text-slate-800 shadow-md flex items-center gap-2.5">
                  <Maximize2 className="w-3.5 h-3.5 text-accent-sky" />
                  <span>
                    {result.image_width} × {result.image_height} px
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-emerald-700 font-black">~{result.dpi_estimate || 300} DPI</span>
                </div>
              )}
            </div>

            {/* File Notice Footer */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span className="truncate max-w-md font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                {result.file_name}
              </span>
              <span className="font-mono text-slate-400 text-[11px]">
                {result.execution_notice || 'Realtime Pixel Sampling'}
              </span>
            </div>
          </div>

          {/* RIGHT: Sidebar Color Analytics & Specifications (4 Cols on XL) */}
          <div className="xl:col-span-4 space-y-5">
            
            {/* Status & Readiness Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  {currentLang === 'lo' ? 'ຜົນກວດສອບມາດຕະຖານພິມ' : 'Preflight Standard'}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                    result.has_rgb && !result.is_standard_cmyk
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {result.has_rgb && !result.is_standard_cmyk ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  {result.status_badge_lao}
                </span>
              </div>

              {/* 4 Diagnostic Status Badges (Clean White/Slate Cards) */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {/* 1. Color Space */}
                <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                  result.has_rgb
                    ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                    : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                }`}>
                  <span className="truncate">Color Space</span>
                  <span className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                    result.has_rgb ? 'bg-rose-200/80 text-rose-900' : 'bg-emerald-200/80 text-emerald-900'
                  }`}>
                    {result.has_rgb ? 'RGB' : 'CMYK'}
                  </span>
                </div>

                {/* 2. Bleed Area */}
                <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                  (result.bleed_mm || 0) >= 3.0
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    : (result.bleed_mm || 0) > 0
                    ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                    : 'bg-rose-50/60 border-rose-200 text-rose-900'
                }`}>
                  <span className="truncate">Bleed ({result.bleed_mm || 0}mm)</span>
                  <span className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                    (result.bleed_mm || 0) >= 3.0 
                      ? 'bg-emerald-200/80 text-emerald-900' 
                      : (result.bleed_mm || 0) > 0 
                      ? 'bg-amber-200/80 text-amber-900' 
                      : 'bg-rose-200/80 text-rose-900'
                  }`}>
                    {(result.bleed_mm || 0) >= 3.0 ? 'Pass' : (result.bleed_mm || 0) > 0 ? '<3mm' : '0mm'}
                  </span>
                </div>

                {/* 3. TAC (Total Area Coverage) */}
                <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                  (result.tac_max_percent || 0) > 300
                    ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                    : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                }`}>
                  <span className="truncate">TAC ({result.tac_max_percent || 0}%)</span>
                  <span className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                    (result.tac_max_percent || 0) > 300 ? 'bg-amber-200/80 text-amber-900' : 'bg-emerald-200/80 text-emerald-900'
                  }`}>
                    {(result.tac_max_percent || 0) > 300 ? '>300%' : 'OK'}
                  </span>
                </div>

                {/* 4. Image Resolution */}
                <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                  (result.dpi_estimate || 300) < 300
                    ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                    : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                }`}>
                  <span className="truncate">Resolution</span>
                  <span className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                    (result.dpi_estimate || 300) < 300 ? 'bg-rose-200/80 text-rose-900' : 'bg-emerald-200/80 text-emerald-900'
                  }`}>
                    {result.dpi_estimate || 300} DPI
                  </span>
                </div>
              </div>

              {result.warning_message_lao && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5 leading-relaxed font-semibold">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{result.warning_message_lao}</span>
                </div>
              )}

              {/* Print Color Mode Switcher (Full CMYK vs Mono K) */}
              <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPrintColorMode('CMYK')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    printColorMode === 'CMYK'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5 text-accent-sky" />
                  <span>{currentLang === 'lo' ? 'ພິມ 4 ສີ (Full CMYK)' : 'Full 4-Color CMYK'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintColorMode('MONO_K')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    printColorMode === 'MONO_K'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Droplet className="w-3.5 h-3.5 text-slate-600" />
                  <span>{currentLang === 'lo' ? 'ພິມ 1 ສີ ຂາວດຳ (Mono K)' : 'Monochrome (K Only)'}</span>
                </button>
              </div>

              {/* CMYK Progress Bars & Values */}
              <div className="space-y-3.5 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>
                    {printColorMode === 'MONO_K'
                      ? (currentLang === 'lo' ? 'ຄ່າສີສະເລ່ຍພິມຂາວດຳ (K %)' : 'Average Mono K %')
                      : (currentLang === 'lo' ? 'ຄ່າສີສະເລ່ຍ CMYK (%)' : 'Average CMYK Coverage (%)')}
                  </span>
                  <span className="text-slate-500 font-mono text-xs">
                    Total Ink:{' '}
                    <strong className="text-slate-900 font-black">
                      {printColorMode === 'MONO_K'
                        ? `${Math.min(100, Math.round((result.avg_cov_k + 0.299 * result.avg_cov_c + 0.587 * result.avg_cov_m + 0.114 * result.avg_cov_y) * 100) / 100)}%`
                        : `${totalInkCoverage}%`}
                    </strong>
                  </span>
                </div>

                {printColorMode === 'CMYK' ? (
                  <>
                    {/* Cyan */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-cyan-700 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span>
                          Cyan (C)
                        </span>
                        <span className="font-mono text-cyan-800 font-black">{result.avg_cov_c.toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/60">
                        <div
                          className="bg-cyan-500 h-2.5 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(result.avg_cov_c * 2.5, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Magenta */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-pink-700 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block"></span>
                          Magenta (M)
                        </span>
                        <span className="font-mono text-pink-800 font-black">{result.avg_cov_m.toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/60">
                        <div
                          className="bg-pink-500 h-2.5 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(result.avg_cov_m * 2.5, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Yellow */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-amber-700 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                          Yellow (Y)
                        </span>
                        <span className="font-mono text-amber-800 font-black">{result.avg_cov_y.toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/60">
                        <div
                          className="bg-amber-400 h-2.5 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(result.avg_cov_y * 2.5, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Black / Key */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-800 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block"></span>
                          Black / Key (K)
                        </span>
                        <span className="font-mono text-slate-900 font-black">{result.avg_cov_k.toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/60">
                        <div
                          className="bg-slate-700 h-2.5 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(result.avg_cov_k * 2.5, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* MONO K DISPLAY */
                  <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <div className="flex justify-between text-sm font-black">
                      <span className="text-slate-800 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-slate-700 inline-block"></span>
                        Black / Key (K Only)
                      </span>
                      <span className="font-mono text-slate-900 text-base font-black">
                        {Math.min(
                          100,
                          Math.round(
                            (result.avg_cov_k +
                              0.299 * result.avg_cov_c +
                              0.587 * result.avg_cov_m +
                              0.114 * result.avg_cov_y) *
                              100
                          ) / 100
                        ).toFixed(2)}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-slate-700 h-3 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(
                            (result.avg_cov_k +
                              0.299 * result.avg_cov_c +
                              0.587 * result.avg_cov_m +
                              0.114 * result.avg_cov_y) *
                              2.5,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-slate-500 pt-1 font-medium">
                      {currentLang === 'lo'
                        ? 'ໂໝດພິມຂາວດຳຈະບໍ່ຄິດໄລ່ຕົ້ນທຶນນ້ຳມຶກ C, M, Y (C=0%, M=0%, Y=0%)'
                        : 'Monochrome mode only accounts for Black K toner/ink cost.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Specifications Summary Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-3.5">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent-sky" />
                <span>{currentLang === 'lo' ? 'ລາຍລະອຽດສະເປກ (Specifications)' : 'Specifications'}</span>
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">{currentLang === 'lo' ? 'ປະເພດໄຟລ໌' : 'File Type'}</div>
                  <div className="font-black text-slate-900 text-sm mt-0.5">
                    {result.file_type || (isImageFile(result.file_name) ? 'IMAGE' : 'PDF')}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">
                    {result.image_width ? (currentLang === 'lo' ? 'ຂະໜາດພິກເຊວ' : 'Dimensions') : (currentLang === 'lo' ? 'ຈຳນວນໜ້າ' : 'Pages')}
                  </div>
                  <div className="font-black text-slate-900 text-sm mt-0.5">
                    {result.image_width ? `${result.image_width} × ${result.image_height}` : `${result.total_pages} ${currentLang === 'lo' ? 'ໜ້າ' : 'Pages'}`}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">{currentLang === 'lo' ? 'ຂະໜາດພິມແນະນຳ' : 'Suggested Size'}</div>
                  <div className="font-black text-emerald-700 text-sm mt-0.5">
                    {result.suggested_paper || 'A4'}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">{currentLang === 'lo' ? 'ໂໝດສີ (Color Mode)' : 'Color Mode'}</div>
                  <div className="font-black text-slate-900 text-sm mt-0.5 truncate">
                    {result.color_space || 'CMYK'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Flow (Matching Theme Buttons) */}
            <div className="space-y-2.5 pt-1">
              {/* Button 1: Send to Quotation */}
              <button
                onClick={() => {
                  if (onSendToQuotation) {
                    const isMono = printColorMode === 'MONO_K';
                    const monoK = Math.min(
                      100,
                      Math.round(
                        (result.avg_cov_k +
                          0.299 * result.avg_cov_c +
                          0.587 * result.avg_cov_m +
                          0.114 * result.avg_cov_y) *
                          100
                      ) / 100
                    );
                    onSendToQuotation({
                      ...result,
                      color_mode: printColorMode,
                      avg_cov_c: isMono ? 0 : result.avg_cov_c,
                      avg_cov_m: isMono ? 0 : result.avg_cov_m,
                      avg_cov_y: isMono ? 0 : result.avg_cov_y,
                      avg_cov_k: isMono ? monoK : result.avg_cov_k,
                    });
                  }
                }}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-accent-sky hover:bg-sky-600 active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-lg shadow-sky-500/20 transition cursor-pointer"
              >
                <span>
                  {currentLang === 'lo' 
                    ? `ສົ່ງຄ່ານຳໃຊ້ສ້າງໃບສະເໜີລາຄາ ${printColorMode === 'MONO_K' ? '(ໂໝດຂາວດຳ)' : '(ໂໝດ 4 ສີ)'}` 
                    : `Send to Quotation Form ${printColorMode === 'MONO_K' ? '(Mono K)' : '(4-Color CMYK)'}`
                  }
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Button 2: Save Preflight Report to Backend DB */}
              <button
                onClick={() => handleSavePreflightReport()}
                disabled={isSavingReport}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl border border-slate-200/80 transition cursor-pointer text-xs"
              >
                <Save className="w-4 h-4 text-slate-600" />
                <span>
                  {reportSavedStatus 
                    ? `✓ ${reportSavedStatus}` 
                    : isSavingReport 
                    ? 'Saving...' 
                    : (currentLang === 'lo' ? 'ບັນທຶກລາຍງານ Preflight Report' : 'Save Preflight Report')
                  }
                </span>
              </button>

              {/* Button 3: Skip / Manual */}
              <button
                onClick={() => onSkipToManual && onSkipToManual()}
                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 font-bold rounded-2xl border border-slate-200 transition cursor-pointer text-xs"
              >
                <span>{currentLang === 'lo' ? 'ຂ້າມ / ໄປປ້ອນຄ່າສີເອງ' : 'Skip / Manual Pricing'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
