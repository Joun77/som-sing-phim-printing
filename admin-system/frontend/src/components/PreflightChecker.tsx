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
} from 'lucide-react';
import type { PreflightResult } from '../features/orders/types';
import { analyzeImageClient, analyzePDFClient } from '../lib/preflightAnalyzer';

interface PreflightCheckerProps {
  onSendToQuotation?: (result: PreflightResult) => void;
  onSkipToManual?: () => void;
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
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PreflightResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

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
        // 1. Run Real In-Browser Pixel Analysis for Images
        analysisResult = await analyzeImageClient(selectedFile);
      } else {
        // 2. Try Backend Ghostscript First for PDFs
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          const response = await fetch('/api/v1/orders/preflight', {
            method: 'POST',
            body: formData,
          });
          if (response.ok) {
            analysisResult = await response.json();
          } else {
            analysisResult = await analyzePDFClient(selectedFile);
          }
        } catch {
          analysisResult = await analyzePDFClient(selectedFile);
        }
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
        // Server offline, uses local objectUrl
      }

      setResult(analysisResult);
    } catch (err: any) {
      console.error('Preflight analysis error:', err);
      setErrorMessage(`ການກວດສອບໄຟລ໌ຜິດພາດ: ${err.message || 'ບໍ່ສາມາດອ່ານຄ່າສີໄດ້'}`);
    } finally {
      setIsAnalyzing(false);
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
    setResult(null);
    setErrorMessage(null);
    setZoomLevel(1);
  };

  // Calculate Total Ink Coverage (TIC / TAC)
  const totalInkCoverage = result
    ? Math.round((result.avg_cov_c + result.avg_cov_m + result.avg_cov_y + result.avg_cov_k) * 100) / 100
    : 0;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-sky-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">
              <span>ລະບົບກວດສອບໄຟລ໌ພິມ & ສະກັດຄ່າສີ CMYK (Preflight Studio)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Realtime Pixel Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ສະແດງຕົວຢ່າງໄຟລ໌ (Preview) ພ້ອມສະຫຼຸບຄ່າສີສະເລ່ຍ CMYK, ຂະໜາດພິກເຊວ, ແລະ ປະເມີນ DPI ດ້ານຂ້າງ
            </p>
          </div>
        </div>

        {result && (
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> ອັບໂຫຼດໄຟລ໌ໃໝ່
          </button>
        )}
      </div>

      {/* Main Drag & Drop Zone if no result */}
      {!result && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-16 text-center transition-all cursor-pointer bg-slate-900/60 shadow-2xl ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
              : 'border-slate-800 hover:border-slate-600 hover:bg-slate-900/80'
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

          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-3 p-5 bg-slate-800/80 rounded-2xl text-indigo-400 border border-slate-700 shadow-inner">
              <Upload className="w-8 h-8 text-indigo-400 animate-bounce" />
              <ImageIcon className="w-8 h-8 text-pink-400" />
              <FileText className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                ລາກໄຟລ໌ PDF ຫຼື ຮູບພາບ (JPG / PNG / WebP / TIFF) ມາຖິ້ມໃສ່ບ່ອນນີ້
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ລະບົບຈະກວດສອບເມັດສີ CMYK ຕົວຈິງ, ຈຳນວນໜ້າ, ຄວາມຄົມຊັດ DPI ແລະ ສະແດງຕົວຢ່າງ Preview ທັນທີ
              </p>
            </div>

            {isAnalyzing && (
              <div className="flex items-center gap-2.5 mt-4 px-5 py-2.5 bg-indigo-500/15 border border-indigo-500/30 rounded-xl text-indigo-300 animate-pulse text-sm font-semibold">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>ກຳລັງອ່ານເມັດສີ ແລະ ປະມວນຜົນພິກເຊວຕົວຈິງ...</span>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 mt-4 px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2-Column Split Preflight Studio: Left (Preview) + Right (Color & Specs Sidebar) */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Large Interactive Preview Canvas (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-200">ຕົວຢ່າງໄຟລ໌ພິມ (Live Artwork Preview)</h3>
              </div>

              {/* Zoom Controls if Image */}
              {isImageFile(result.file_name) && (
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1.5 font-mono text-[11px] text-slate-300">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="px-1.5 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                  >
                    Fit
                  </button>
                </div>
              )}
            </div>

            {/* Preview Viewport */}
            <div className="relative w-full h-[480px] bg-slate-950/90 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center checkerboard-pattern group">
              {previewUrl && isImageFile(result.file_name) ? (
                <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
                  <img
                    src={previewUrl}
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
                <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/75 backdrop-blur-md rounded-lg text-xs font-mono border border-slate-700/80 text-slate-200 shadow-lg flex items-center gap-2">
                  <Maximize2 className="w-3 h-3 text-indigo-400" />
                  <span>
                    {result.image_width} × {result.image_height} px
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-emerald-400 font-bold">~{result.dpi_estimate || 300} DPI</span>
                </div>
              )}
            </div>

            {/* File Notice Footer */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="truncate max-w-[320px] font-medium text-slate-300">
                📄 {result.file_name}
              </span>
              <span className="font-mono text-slate-500">
                {result.execution_notice || 'Realtime Analysis'}
              </span>
            </div>
          </div>

          {/* RIGHT: Sidebar Color Analytics & Specs (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Status & Readiness Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  ຜົນກວດສອບມາດຕະຖານພິມ
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
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

              {result.warning_message_lao && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2 leading-relaxed">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{result.warning_message_lao}</span>
                </div>
              )}

              {/* CMYK Progress Bars */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>📊 ຄ່າສີສະເລ່ຍ CMYK (%)</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Total Ink: <strong className="text-indigo-300">{totalInkCoverage}%</strong>
                  </span>
                </div>

                {/* Cyan */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-cyan-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50"></span>
                      Cyan (C)
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">{result.avg_cov_c.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-cyan-400 h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(result.avg_cov_c * 2.5, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Magenta */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-pink-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-pink-400 inline-block shadow-sm shadow-pink-400/50"></span>
                      Magenta (M)
                    </span>
                    <span className="font-mono text-pink-300 font-bold">{result.avg_cov_m.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-pink-500 h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(result.avg_cov_m * 2.5, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Yellow */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-yellow-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block shadow-sm shadow-yellow-400/50"></span>
                      Yellow (Y)
                    </span>
                    <span className="font-mono text-yellow-300 font-bold">{result.avg_cov_y.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-yellow-400 h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(result.avg_cov_y * 2.5, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Black / Key */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block shadow-sm shadow-slate-300/50"></span>
                      Black / Key (K)
                    </span>
                    <span className="font-mono text-slate-100 font-bold">{result.avg_cov_k.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-slate-300 h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(result.avg_cov_k * 2.5, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Specifications Summary Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                ລາຍລະອຽດສະເປກ (Specifications)
              </h4>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">ປະເພດໄຟລ໌</div>
                  <div className="font-bold text-indigo-300 mt-0.5">
                    {result.file_type || (isImageFile(result.file_name) ? 'IMAGE' : 'PDF')}
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">
                    {result.image_width ? 'ຂະໜາດພິກເຊວ' : 'ຈຳນວນໜ້າ'}
                  </div>
                  <div className="font-bold text-slate-200 mt-0.5">
                    {result.image_width ? `${result.image_width}x${result.image_height}` : `${result.total_pages} ໜ້າ`}
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">ຂະໜາດພິມແນະນຳ</div>
                  <div className="font-bold text-emerald-400 mt-0.5">
                    {result.suggested_paper || 'A4'}
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">ໂໝດສີ (Color Mode)</div>
                  <div className="font-bold text-slate-200 mt-0.5 truncate">
                    {result.color_space || 'CMYK'}
                  </div>
                </div>
              </div>
            </div>

            {/* 2-Button Action Flow */}
            <div className="space-y-2.5 pt-1">
              {/* Button 1: Send to Quotation */}
              <button
                onClick={() => onSendToQuotation && onSendToQuotation(result)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-bold rounded-2xl shadow-xl shadow-emerald-950/40 transition cursor-pointer"
              >
                <span>🟢 ສົ່ງຄ່ານຳໃຊ້ສ້າງໃບສະເໜີລາຄາ</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Button 2: Skip / Manual */}
              <button
                onClick={() => onSkipToManual && onSkipToManual()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 active:scale-[0.99] text-slate-300 hover:text-white font-semibold rounded-2xl border border-slate-700 transition cursor-pointer text-xs"
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
