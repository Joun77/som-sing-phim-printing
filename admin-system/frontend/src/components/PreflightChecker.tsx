import React, { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
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
  Sparkles,
  Info,
  Sliders,
  Printer,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Save,
  Palette,
} from 'lucide-react';
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
      setErrorMessage('ຮອງຮັບສະເພາະໄຟລ໌ PDF ແລະ ໄຟລ໌ຮູບພາບ (.pdf, .jpg, .png, .webp, .tiff, .psd)');
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
        // 1. Run Real In-Browser Pixel Analysis for Images (GCR Tk=0.25)
        analysisResult = await analyzeImageClient(selectedFile);
      } else {
        // 2. Run PDF.js Real Canvas Page Extraction (Extracts EXACT page count & GCR CMYK)
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
      // Auto-save preflight report to backend
      handleSavePreflightReport(analysisResult);
    } catch (err: any) {
      console.error('Preflight analysis error:', err);
      setErrorMessage(`ການກວດສອບໄຟລ໌ຜິດພາດ: ${err.message || 'ບໍ່ສາມາດອ່ານຄ່າສີໄດ້'}`);
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
          status_badge_lao: '✅ ແປງເປັນ CMYK Gamut ຮຽບຮ້ອຍ',
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
    <div className="w-full space-y-6 text-slate-100">
      {/* Top Banner Header (Full Width) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-indigo-500/20 via-sky-500/20 to-teal-500/20 border border-indigo-500/30 rounded-2xl text-indigo-400 shadow-lg shadow-indigo-950/40">
            <Cpu className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                ລະບົບກວດສອບໄຟລ໌ພິມ & ສະກັດຄ່າສີ CMYK (Preflight Studio)
              </h2>
              <span className="hidden sm:inline-flex text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Live Pixel Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              ສະແດງຕົວຢ່າງໄຟລ໌ (Live Artwork Preview) ພ້ອມສະຫຼຸບຄ່າສີສະເລ່ຍ CMYK, ຂະໜາດພິກເຊວ, ແລະ ປະເມີນ DPI ດ້ານຂ້າງ
            </p>
          </div>
        </div>

        {result && (
          <button
            onClick={resetAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 shadow-md transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-indigo-400" /> ອັບໂຫຼດໄຟລ໌ໃໝ່
          </button>
        )}
      </div>

      {/* INITIAL FULL-WIDTH DROP ZONE & SPEC MATRIX (Fills Screen Beautifully) */}
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
            className={`border-2 border-dashed rounded-3xl p-12 sm:p-20 text-center transition-all cursor-pointer bg-slate-900/80 shadow-2xl ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-500/10 scale-[1.005]'
                : 'border-slate-800 hover:border-slate-600 hover:bg-slate-900'
            }`}
            onClick={() => document.getElementById('preflight-file-input')?.click()}
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
              <div className="flex items-center gap-4 p-5 bg-slate-800/90 rounded-2xl text-indigo-400 border border-slate-700/80 shadow-inner">
                <Upload className="w-9 h-9 text-indigo-400 animate-bounce" />
                <ImageIcon className="w-9 h-9 text-pink-400" />
                <FileText className="w-9 h-9 text-cyan-400" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-100 tracking-tight">
                  ລາກໄຟລ໌ PDF ຫຼື ຮູບພາບ (JPG / PNG / WebP / TIFF) ມາຖິ້ມໃສ່ບ່ອນນີ້
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                  ລະບົບຈະກວດສອບເມັດສີ CMYK ຕົວຈິງ, ຈຳນວນໜ້າ, ຄວາມຄົມຊັດ DPI ແລະ ສະແດງຕົວຢ່າງ Preview ທັນທີ
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-700">PDF ຫຼາຍໜ້າ</span>
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-700">JPEG / JPG</span>
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-700">PNG Transparent</span>
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-700">WebP / TIFF</span>
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-700">PSD</span>
              </div>

              {isAnalyzing && (
                <div className="flex items-center gap-2.5 mt-4 px-6 py-3 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-300 animate-pulse text-sm font-bold shadow-lg">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>ກຳລັງອ່ານເມັດສີ ແລະ ປະມວນຜົນພິກເຊວຕົວຈິງ...</span>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-center gap-2.5 mt-4 px-5 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm font-semibold">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3 Information Pillars (Utilizes Wide Screen) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>100% Real Pixel Sampling</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                ຖອດລະຫັດເມັດສີ $R, G, B$ ຕົວຈິງຈາກທຸກພິກເຊວ ແລ້ວແປງເປັນ $C, M, Y, K\%$ ທີ່ຖືກຕ້ອງຕາມມາດຕະຖານໂຮງພິມ
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center gap-2.5 text-sky-400 font-bold text-sm">
                <Printer className="w-5 h-5" />
                <span>DPI & Print Resolution</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                ກວດສອບຂະໜາດພິກເຊວ ($W \times H$) ເພື່ອແນະນຳຂະໜາດພິມທີ່ເໝາະສົມ (A3, A4, A5, ສະຕິກເກີ) ປ້ອງກັນພາບແຕກ
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                <Zap className="w-5 h-5" />
                <span>1-Click Quotation Sync</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                ສົ່ງຄ່າ % ສີ ແລະ ຈຳນວນໜ້າເຂົ້າຟອມໃບສະເໜີລາຄາອັດຕະໂນມັດ ໂດຍບໍ່ຕ້ອງປ້ອນຂໍ້ມູນເອງ
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2-COLUMN SPLIT STUDIO (FULL-WIDTH 100% UTILIZATION) */}
      {result && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT: Large Interactive Preview Canvas (8 Cols on XL) */}
          <div className="xl:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-200">ຕົວຢ່າງໄຟລ໌ພິມ (Live Artwork Preview)</h3>
              </div>

              {/* Zoom & Auto-Convert Controls */}
              <div className="flex items-center gap-2">
                {isImageFile(result.file_name) && (
                  <button
                    type="button"
                    onClick={handleAutoConvertRGBToCMYK}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                      isCmykSimulated
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/40'
                    }`}
                    title="Auto-convert RGB pixels to CMYK gamut simulation"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>{isCmykSimulated ? '✓ CMYK Soft Proofing' : 'Auto-Convert RGB to CMYK Preview'}</span>
                  </button>
                )}

                {isImageFile(result.file_name) && (
                  <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="px-2 font-mono text-xs font-bold text-slate-300">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(1)}
                      className="px-2 py-0.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition"
                    >
                      Fit
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Viewport (560px Height for Immersive Look) */}
            <div className="relative w-full h-[560px] bg-slate-950/95 rounded-2xl overflow-hidden border border-slate-800/90 flex items-center justify-center checkerboard-pattern group">
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
                    className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
              ) : previewUrl && !isImageFile(result.file_name) ? (
                <iframe
                  src={previewUrl}
                  title="PDF Preview"
                  className="w-full h-full border-0 rounded-2xl bg-white"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <FileText className="w-16 h-16 text-slate-700" />
                  <p className="text-xs">ບໍ່ມີຕົວຢ່າງສະແດງຜົນ</p>
                </div>
              )}

              {/* Overlaid Dimension Tag */}
              {result.image_width && result.image_height && (
                <div className="absolute bottom-4 left-4 px-3.5 py-2 bg-black/85 backdrop-blur-md rounded-xl text-xs font-mono border border-slate-700 text-slate-200 shadow-2xl flex items-center gap-2.5">
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {result.image_width} × {result.image_height} px
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-emerald-400 font-black">~{result.dpi_estimate || 300} DPI</span>
                </div>
              )}
            </div>

            {/* File Notice Footer */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="truncate max-w-md font-semibold text-slate-300">
                📄 {result.file_name}
              </span>
              <span className="font-mono text-slate-500 text-[11px]">
                {result.execution_notice || 'Realtime Pixel Analysis'}
              </span>
            </div>
          </div>

          {/* RIGHT: Sidebar Color Analytics & Specs (4 Cols on XL) */}
          <div className="xl:col-span-4 space-y-5">
            {/* Status & Readiness Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  ຜົນກວດສອບມາດຕະຖານພິມ
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                    result.has_rgb && !result.is_standard_cmyk
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {result.has_rgb && !result.is_standard_cmyk ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  {result.status_badge_lao}
                </span>
              </div>

              {/* 4 Interactive Diagnostic Badges */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* 1. Color Space */}
                <div className={`p-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-between ${
                  result.has_rgb
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                }`}>
                  <span>🎨 Color Space</span>
                  <span className="font-mono text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-black/40">
                    {result.has_rgb ? '🔴 RGB Error' : '🟢 CMYK Pass'}
                  </span>
                </div>

                {/* 2. Bleed Area */}
                <div className={`p-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-between ${
                  (result.bleed_mm || 0) >= 3.0
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : (result.bleed_mm || 0) > 0
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}>
                  <span>📐 Bleed ({result.bleed_mm || 0}mm)</span>
                  <span className="font-mono text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-black/40">
                    {(result.bleed_mm || 0) >= 3.0 ? '🟢 Pass' : (result.bleed_mm || 0) > 0 ? '🟡 < 3mm' : '🔴 0mm Err'}
                  </span>
                </div>

                {/* 3. TAC (Total Area Coverage) */}
                <div className={`p-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-between ${
                  (result.tac_max_percent || 0) > 300
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                }`}>
                  <span>💧 TAC (Max {result.tac_max_percent || 0}%)</span>
                  <span className="font-mono text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-black/40">
                    {(result.tac_max_percent || 0) > 300 ? '🟡 >300% Warn' : '🟢 <=300%'}
                  </span>
                </div>

                {/* 4. Image Resolution */}
                <div className={`p-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-between ${
                  (result.dpi_estimate || 300) < 300
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                }`}>
                  <span>🔍 Resolution</span>
                  <span className="font-mono text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-black/40">
                    {(result.dpi_estimate || 300) < 300 ? `🔴 ${result.dpi_estimate}DPI` : `🟢 ${result.dpi_estimate || 300}DPI`}
                  </span>
                </div>
              </div>

              {result.warning_message_lao && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2.5 leading-relaxed">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{result.warning_message_lao}</span>
                </div>
              )}

              {/* Print Color Mode Switcher (Full CMYK vs Mono K) */}
              <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPrintColorMode('CMYK')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    printColorMode === 'CMYK'
                      ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-950/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span>🌈 ພິມ 4 ສີ (Full CMYK)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintColorMode('MONO_K')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    printColorMode === 'MONO_K'
                      ? 'bg-slate-800 text-white border border-slate-600 shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span>⚫ ພິມ 1 ສີ ຂາວດຳ (Mono K)</span>
                </button>
              </div>

              {/* CMYK Progress Bars */}
              <div className="space-y-3.5 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>
                    {printColorMode === 'MONO_K'
                      ? '📊 ຄ່າສີສະເລ່ຍພິມຂາວດຳ (Monochrome K %)'
                      : '📊 ຄ່າສີສະເລ່ຍ CMYK (%)'}
                  </span>
                  <span className="text-slate-400 font-mono text-xs">
                    Total Ink:{' '}
                    <strong className="text-indigo-300 font-bold">
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
                        <span className="text-cyan-400 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50"></span>
                          Cyan (C)
                        </span>
                        <span className="font-mono text-cyan-300 font-black">{result.avg_cov_c.toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                        <div
                          className="bg-cyan-400 h-3 rounded-full transition-all duration-700 shadow-sm"
                          style={{ width: `${Math.min(result.avg_cov_c * 2.5, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Magenta */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-pink-400 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-pink-400 inline-block shadow-sm shadow-pink-400/50"></span>
                          Magenta (M)
                        </span>
                        <span className="font-mono text-pink-300 font-black">{result.avg_cov_m.toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                        <div
                          className="bg-pink-500 h-3 rounded-full transition-all duration-700 shadow-sm"
                          style={{ width: `${Math.min(result.avg_cov_m * 2.5, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Yellow */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-yellow-400 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block shadow-sm shadow-yellow-400/50"></span>
                          Yellow (Y)
                        </span>
                        <span className="font-mono text-yellow-300 font-black">{result.avg_cov_y.toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                        <div
                          className="bg-yellow-400 h-3 rounded-full transition-all duration-700 shadow-sm"
                          style={{ width: `${Math.min(result.avg_cov_y * 2.5, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Black / Key */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-200 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block shadow-sm shadow-slate-300/50"></span>
                          Black / Key (K)
                        </span>
                        <span className="font-mono text-slate-100 font-black">{result.avg_cov_k.toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                        <div
                          className="bg-slate-300 h-3 rounded-full transition-all duration-700 shadow-sm"
                          style={{ width: `${Math.min(result.avg_cov_k * 2.5, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* MONO K DISPLAY */
                  <div className="space-y-2 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <div className="flex justify-between text-sm font-black">
                      <span className="text-slate-200 flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-slate-300 inline-block shadow-md"></span>
                        Black / Key (K Only)
                      </span>
                      <span className="font-mono text-emerald-400 text-base font-black">
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
                    <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden border border-slate-700">
                      <div
                        className="bg-slate-200 h-4 rounded-full transition-all duration-700 shadow-sm"
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
                    <p className="text-[11px] text-slate-400 pt-1">
                      💡 ໂໝດພິມຂາວດຳຈະບໍ່ຄິດໄລ່ຕົ້ນທຶນນ້ຳມຶກ Cyan, Magenta, Yellow (C=0%, M=0%, Y=0%)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Specifications Summary Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-3.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                ລາຍລະອຽດສະເປກ (Specifications)
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-medium">ປະເພດໄຟລ໌</div>
                  <div className="font-black text-indigo-300 text-sm mt-0.5">
                    {result.file_type || (isImageFile(result.file_name) ? 'IMAGE' : 'PDF')}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-medium">
                    {result.image_width ? 'ຂະໜາດພິກເຊວ' : 'ຈຳນວນໜ້າ'}
                  </div>
                  <div className="font-black text-slate-100 text-sm mt-0.5">
                    {result.image_width ? `${result.image_width} × ${result.image_height}` : `${result.total_pages} ໜ້າ`}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-medium">ຂະໜາດພິມແນະນຳ</div>
                  <div className="font-black text-emerald-400 text-sm mt-0.5">
                    {result.suggested_paper || 'A4'}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-medium">ໂໝດສີ (Color Mode)</div>
                  <div className="font-black text-slate-200 text-sm mt-0.5 truncate">
                    {result.color_space || 'CMYK'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Flow */}
            <div className="space-y-3 pt-1">
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
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-950/50 transition cursor-pointer"
              >
                <span>🟢 ສົ່ງຄ່ານຳໃຊ້ສ້າງໃບສະເໜີລາຄາ {printColorMode === 'MONO_K' ? '(ໂໝດຂາວດຳ)' : '(ໂໝດ 4 ສີ)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Button 2: Save Preflight Report to Backend DB */}
              <button
                onClick={() => handleSavePreflightReport()}
                disabled={isSavingReport}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 hover:text-white font-bold rounded-2xl border border-indigo-500/40 transition cursor-pointer text-xs"
              >
                <Save className="w-4 h-4" />
                <span>{reportSavedStatus ? `✓ ${reportSavedStatus}` : isSavingReport ? 'Saving...' : '💾 ບັນທຶກ Preflight Report (Backend)'}</span>
              </button>

              {/* Button 3: Skip / Manual */}
              <button
                onClick={() => onSkipToManual && onSkipToManual()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 active:scale-[0.99] text-slate-300 hover:text-white font-bold rounded-2xl border border-slate-700 transition cursor-pointer text-xs"
              >
                <span>⚪ ຂ້າມ / ໄປປ້ອນຄ່າສີເອງ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
