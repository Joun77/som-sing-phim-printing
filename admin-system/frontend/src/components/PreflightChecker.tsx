import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Send,
  Droplet,
  Palette,
  Info,
  Check,
  ChevronRight,
  Printer,
  Sparkles,
  Layers,
  FileCode,
  FileSpreadsheet,
  Layers3,
  Loader2,
  CheckSquare,
  Images,
  Scissors,
  Grid,
  FileImage,
  Sliders,
  X,
  Eye,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PreflightResult, BatchPreflightResult } from '../features/orders/types';
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
  const [progress, setProgress] = useState<{ current: number; total: number; pct: number }>({ current: 0, total: 0, pct: 0 });
  const [result, setResult] = useState<PreflightResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  
  // 1. Paper Size Selector States
  const [targetPaperSize, setTargetPaperSize] = useState<string>('A4');
  const [customWidthMM, setCustomWidthMM] = useState<number>(210);
  const [customHeightMM, setCustomHeightMM] = useState<number>(297);

  // 2. Customer Requested Print Mode
  const [customerPrintMode, setCustomerPrintMode] = useState<'COLOR' | 'MONO_ALL'>('COLOR');
  const [colorChannelOption, setColorChannelOption] = useState<'4_COLOR' | '6_COLOR' | '12_COLOR'>('4_COLOR');

  // 3. Tabs for Coverage Inspection: 'color_pages' | 'mono_pages' | 'all_pages'
  const [activeCoverageTab, setActiveCoverageTab] = useState<'color_pages' | 'mono_pages' | 'all_pages'>('color_pages');
  
  // Auto-convert CMYK Simulation & Backend Log States
  const [isCmykSimulated, setIsCmykSimulated] = useState(false);
  const [cmykSimulatedUrl, setCmykSimulatedUrl] = useState<string | null>(null);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [reportSavedStatus, setReportSavedStatus] = useState<string | null>(null);

  // 4. Batch Photo Preflight States (1-100 Photos per item)
  const [preflightMode, setPreflightMode] = useState<'single' | 'batch'>('single');
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchPreviews, setBatchPreviews] = useState<{ name: string; url: string; size: number }[]>([]);
  const [batchPhotoSize, setBatchPhotoSize] = useState<'4x6' | '3x4' | '5x7' | '2x3' | 'A4'>('4x6');
  const [borderMode, setBorderMode] = useState<'BORDERED' | 'BORDERLESS'>('BORDERED');
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; pct: number }>({ current: 0, total: 0, pct: 0 });
  const [batchResult, setBatchResult] = useState<BatchPreflightResult | null>(null);
  const [batchErrorMessage, setBatchErrorMessage] = useState<string | null>(null);
  const [selectedPreviewPhoto, setSelectedPreviewPhoto] = useState<string | null>(null);

  const PHOTO_PRESETS: Record<string, { label: string; w: number; h: number; cutsPerA4: number; descLao: string }> = {
    '4x6': { label: '4x6" (A6)', w: 100, h: 150, cutsPerA4: 3, descLao: 'ມາດຕະຖານ 3 ຮູບ/ແຜ່ນ A4' },
    '3x4': { label: '3x4"', w: 75, h: 100, cutsPerA4: 6, descLao: '6 ຮູບ/ແຜ່ນ A4' },
    '5x7': { label: '5x7"', w: 130, h: 180, cutsPerA4: 2, descLao: '2 ຮູບ/ແຜ່ນ A4' },
    '2x3': { label: '2x3" (Polaroid)', w: 54, h: 86, cutsPerA4: 8, descLao: '8 ຮູບ/ແຜ່ນ A4' },
    'A4': { label: 'A4 ເຕັມແຜ່ນ', w: 210, h: 297, cutsPerA4: 1, descLao: '1 ຮູບ/ແຜ່ນ A4' },
  };

  const resetBatch = () => {
    setBatchFiles([]);
    setBatchPreviews([]);
    setBatchResult(null);
    setBatchErrorMessage(null);
    setSelectedPreviewPhoto(null);
  };

  const handleBatchFilesSelected = (filesList: FileList | File[]) => {
    const incoming = Array.from(filesList);
    if (incoming.length === 0) return;

    if (incoming.length > 100) {
      setBatchErrorMessage(
        currentLang === 'lo'
          ? `ຈຳກັດສູງສຸດບໍ່ເກີນ 100 ຮູບຕໍ່ 1 ລາຍການ (ທ່ານເລືອກມາ ${incoming.length} ຮູບ - ລະບົບເລືອກສະເພາະ 100 ຮູບທຳອິດ)`
          : `Limit is 100 photos per item (You selected ${incoming.length} photos - only first 100 will be analyzed)`
      );
    }

    const selected = incoming.slice(0, 100);
    setBatchFiles(selected);
    setBatchErrorMessage(null);

    const previews = selected.map(f => ({
      name: f.name,
      url: URL.createObjectURL(f),
      size: f.size,
    }));
    setBatchPreviews(previews);

    runBatchPreflightAnalysis(selected, batchPhotoSize, borderMode);
  };

  const runBatchPreflightAnalysis = async (
    filesToAnalyze: File[],
    photoSize: string,
    border: 'BORDERED' | 'BORDERLESS'
  ) => {
    setIsBatchAnalyzing(true);
    setBatchErrorMessage(null);
    setBatchProgress({ current: 0, total: filesToAnalyze.length, pct: 0 });

    try {
      const formData = new FormData();
      filesToAnalyze.forEach(file => {
        formData.append('files', file);
      });
      formData.append('photo_size', photoSize);
      formData.append('border_mode', border);

      const res = await fetch('/api/v1/preflight/batch-analyze', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned status ${res.status}`);
      }

      const data: BatchPreflightResult = await res.json();
      setBatchResult(data);
    } catch (err: any) {
      console.warn('Batch endpoint fallback to client-side analyzer:', err);
      try {
        const preset = PHOTO_PRESETS[photoSize] || PHOTO_PRESETS['4x6'];
        const clientResults: PreflightResult[] = [];
        let sumC = 0, sumM = 0, sumY = 0, sumK = 0, lowDpi = 0;

        for (let i = 0; i < filesToAnalyze.length; i++) {
          setBatchProgress({
            current: i + 1,
            total: filesToAnalyze.length,
            pct: Math.round(((i + 1) / filesToAnalyze.length) * 100),
          });
          const f = filesToAnalyze[i];
          const clientRes = await analyzeImageClient(f, {
            targetPaperSize: preset.label,
            targetWidthMM: preset.w,
            targetHeightMM: preset.h,
          });
          if ((clientRes.dpi_estimate || 0) < 150) {
            lowDpi++;
          }
          sumC += clientRes.avg_cov_c || 0;
          sumM += clientRes.avg_cov_m || 0;
          sumY += clientRes.avg_cov_y || 0;
          sumK += clientRes.avg_cov_k || 0;
          clientResults.push(clientRes);
        }

        const total = filesToAnalyze.length;
        const cutsPerSheet = preset.cutsPerA4;
        const reqSheets = Math.ceil(total / cutsPerSheet);
        const spoilSheets = Math.max(1, Math.ceil(reqSheets * 0.05));
        const totalSheets = reqSheets + spoilSheets;

        const borderNote = border === 'BORDERLESS' ? 'ບໍ່ມີຂອບ (Bleed 2mm)' : 'ມີຂອບຂາວ';
        const summaryLao = `ຮູບ ${total} ໃບ (${preset.label}, ${borderNote}) ຈັດວາງ ${cutsPerSheet} ຮູບ/ແຜ່ນ A4 ➜ ໃຊ້ເຈ້ຍ A4 ທັງໝົດ ${reqSheets} ແຜ່ນ (ເຜື່ອເສຍ ${spoilSheets} = ລວມ ${totalSheets} ແຜ່ນ)`;

        const fallbackResult: BatchPreflightResult = {
          total_files: total,
          avg_cov_c: Math.round((sumC / total) * 100) / 100,
          avg_cov_m: Math.round((sumM / total) * 100) / 100,
          avg_cov_y: Math.round((sumY / total) * 100) / 100,
          avg_cov_k: Math.round((sumK / total) * 100) / 100,
          low_dpi_count: lowDpi,
          suggested_imposition: {
            parent_sheet: 'A4',
            cuts_per_sheet: cutsPerSheet,
            required_sheets: reqSheets,
            spoilage_sheets: spoilSheets,
            total_sheets: totalSheets,
            summary_lao: summaryLao,
          },
          files: clientResults,
        };

        setBatchResult(fallbackResult);
      } catch (fallbackErr: any) {
        setBatchErrorMessage(fallbackErr.message || 'Error analyzing batch photos');
      }
    } finally {
      setIsBatchAnalyzing(false);
    }
  };

  const handleSendBatchToQuotationAction = () => {
    if (!batchResult) return;
    const preset = PHOTO_PRESETS[batchPhotoSize] || PHOTO_PRESETS['4x6'];

    const exportPayload: PreflightResult = {
      file_name: `ພິມຮູບພາບ Photo Prints (ຊຸດ ${batchResult.total_files} ໃບ)`,
      total_pages: batchResult.total_files,
      color_pages_count: batchResult.total_files,
      mono_pages_count: 0,
      avg_cov_c: batchResult.avg_cov_c,
      avg_cov_m: batchResult.avg_cov_m,
      avg_cov_y: batchResult.avg_cov_y,
      avg_cov_k: batchResult.avg_cov_k,
      color_pages_avg_c: batchResult.avg_cov_c,
      color_pages_avg_m: batchResult.avg_cov_m,
      color_pages_avg_y: batchResult.avg_cov_y,
      color_pages_avg_k: batchResult.avg_cov_k,
      color_space: 'CMYK',
      color_mode: 'CMYK',
      has_rgb: false,
      is_standard_cmyk: true,
      status_badge_lao: `ຊຸດພິມຮູບພາບ ${batchResult.total_files} ໃບ (${borderMode === 'BORDERED' ? 'ມີຂອບ' : 'ບໍ່ມີຂອບ'})`,
      target_paper_size: preset.label,
      target_width_mm: preset.w,
      target_height_mm: preset.h,
      suggested_paper: 'Photo Glossy 230gsm',
      dpi_estimate: 300,
      bleed_mm: borderMode === 'BORDERLESS' ? 2 : 0,
      has_sufficient_bleed: true,
      execution_notice: batchResult.suggested_imposition.summary_lao,
      ...({
        is_batch_photo: true,
        border_mode: borderMode,
        batch_imposition: batchResult.suggested_imposition,
        batch_files: batchResult.files,
      } as any),
    };

    if (onSendToQuotation) {
      onSendToQuotation(exportPayload);
    }
  };

  const isImageFile = (fileName: string) => {
    const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    return ext !== '.pdf';
  };

  const handlePaperSizeSelect = (size: string) => {
    setTargetPaperSize(size);
    let w = 210;
    let h = 297;
    if (size === 'A5') { w = 148; h = 210; }
    else if (size === 'A3') { w = 297; h = 420; }
    setCustomWidthMM(w);
    setCustomHeightMM(h);

    if (result) {
      setResult({
        ...result,
        target_paper_size: size,
        target_width_mm: w,
        target_height_mm: h,
      });
    }
  };

  const handleCustomDimensionChange = (w: number, h: number) => {
    setCustomWidthMM(w);
    setCustomHeightMM(h);
    if (result) {
      setResult({
        ...result,
        target_paper_size: 'CUSTOM',
        target_width_mm: w,
        target_height_mm: h,
      });
    }
  };

  const handleFileUpload = async (
    selectedFile: File,
    overrideSize?: string,
    overrideW?: number,
    overrideH?: number
  ) => {
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
    setProgress({ current: 0, total: 1, pct: 0 });

    const isImg = isImageFile(selectedFile.name);

    if (!previewUrl || selectedFile !== file) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
    }

    const currentSize = overrideSize || targetPaperSize;
    const currentW = overrideW || customWidthMM;
    const currentH = overrideH || customHeightMM;

    try {
      let analysisResult: PreflightResult;

      const options = {
        targetPaperSize: currentSize,
        targetWidthMM: currentW,
        targetHeightMM: currentH,
        onProgress: (current: number, total: number, pct: number) => {
          setProgress({ current, total, pct });
        }
      };

      if (isImg) {
        analysisResult = await analyzeImageClient(selectedFile, options);
      } else {
        analysisResult = await analyzePDFClient(selectedFile, options);
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

  // Calculate paper area in sq meters for accurate ink volume ml
  const paperWidthMM = result?.target_width_mm || customWidthMM;
  const paperHeightMM = result?.target_height_mm || customHeightMM;
  const paperAreaM2 = (paperWidthMM * paperHeightMM) / 1000000;

  const totalPages = result?.total_pages || 1;
  const colorPages = customerPrintMode === 'MONO_ALL' ? 0 : (result?.color_pages_count || 0);
  const monoPages = customerPrintMode === 'MONO_ALL' ? totalPages : (result?.mono_pages_count || 0);

  const rawColorC = result?.color_pages_avg_c || result?.avg_cov_c || 0;
  const rawColorM = result?.color_pages_avg_m || result?.avg_cov_m || 0;
  const rawColorY = result?.color_pages_avg_y || result?.avg_cov_y || 0;
  const rawColorK = result?.color_pages_avg_k || result?.avg_cov_k || 0;
  const totalColorInkCoverage = Math.round((rawColorC + rawColorM + rawColorY + rawColorK) * 100) / 100;

  const rawMonoK = result?.mono_pages_avg_k || result?.avg_cov_k || 0;
  const convertedMonoAllK = Math.round((rawColorK + 0.299 * rawColorC + 0.587 * rawColorM + 0.114 * rawColorY) * 100) / 100;
  const effectiveMonoK = customerPrintMode === 'MONO_ALL' ? Math.max(convertedMonoAllK, rawMonoK) : rawMonoK;

  //  Mathematical Model for ALL PAGES COMBINED Tab (Weighted Average):
  const combinedC = customerPrintMode === 'MONO_ALL' ? 0 : Math.round(((rawColorC * colorPages) / totalPages) * 100) / 100;
  const combinedM = customerPrintMode === 'MONO_ALL' ? 0 : Math.round(((rawColorM * colorPages) / totalPages) * 100) / 100;
  const combinedY = customerPrintMode === 'MONO_ALL' ? 0 : Math.round(((rawColorY * colorPages) / totalPages) * 100) / 100;
  const combinedK = customerPrintMode === 'MONO_ALL' 
    ? effectiveMonoK 
    : Math.round((((rawColorK * colorPages) + (rawMonoK * monoPages)) / totalPages) * 100) / 100;

  const grandTotalAverageInk = Math.round((combinedC + combinedM + combinedY + combinedK) * 100) / 100;

  // Estimated Ink Volume in mL (~ 1.5 ml per m2 at 100% solid)
  const estimatedColorInkML = colorPages > 0 
    ? Math.round(colorPages * paperAreaM2 * (totalColorInkCoverage / 100) * 1.5 * 10) / 10 
    : 0;

  const estimatedMonoInkML = monoPages > 0 
    ? Math.round(monoPages * paperAreaM2 * (effectiveMonoK / 100) * 1.2 * 10) / 10 
    : 0;

  const estimatedGrandTotalInkML = Math.round((estimatedColorInkML + estimatedMonoInkML) * 10) / 10;

  // Multi-Color Channel Generator for 4, 6, and 12 Inks
  const getDynamicChannels = (c: number, m: number, y: number, k: number, option: '4_COLOR' | '6_COLOR' | '12_COLOR') => {
    if (option === '4_COLOR') {
      return [
        { name: 'Cyan (C)', val: c, color: 'bg-cyan-500', text: 'text-cyan-700' },
        { name: 'Magenta (M)', val: m, color: 'bg-pink-500', text: 'text-pink-700' },
        { name: 'Yellow (Y)', val: y, color: 'bg-amber-400', text: 'text-amber-700' },
        { name: 'Black (K)', val: k, color: 'bg-slate-700', text: 'text-slate-800' },
      ];
    }
    if (option === '6_COLOR') {
      const lc = Math.round(c * 0.55 * 100) / 100;
      const lm = Math.round(m * 0.55 * 100) / 100;
      const primaryC = Math.round(c * 0.45 * 100) / 100;
      const primaryM = Math.round(m * 0.45 * 100) / 100;
      return [
        { name: 'Cyan (C)', val: primaryC, color: 'bg-cyan-600', text: 'text-cyan-800' },
        { name: 'Magenta (M)', val: primaryM, color: 'bg-pink-600', text: 'text-pink-800' },
        { name: 'Yellow (Y)', val: y, color: 'bg-amber-400', text: 'text-amber-700' },
        { name: 'Black (K)', val: k, color: 'bg-slate-800', text: 'text-slate-900' },
        { name: 'Light Cyan (Lc)', val: lc, color: 'bg-sky-300', text: 'text-sky-600' },
        { name: 'Light Magenta (Lm)', val: lm, color: 'bg-rose-300', text: 'text-rose-600' },
      ];
    }
    // 12 Colors (Fine Art / Giclée)
    const lc = Math.round(c * 0.4 * 100) / 100;
    const lm = Math.round(m * 0.4 * 100) / 100;
    const gy = Math.round(k * 0.35 * 100) / 100;
    const lgy = Math.round(k * 0.2 * 100) / 100;
    const red = Math.round(((m + y) * 0.15) * 100) / 100;
    const green = Math.round(((c + y) * 0.15) * 100) / 100;
    const blue = Math.round(((c + m) * 0.12) * 100) / 100;
    const co = Math.round(((c + m + y + k) * 0.08) * 100) / 100;

    return [
      { name: 'Photo Cyan (PC)', val: Math.round(c * 0.6 * 100) / 100, color: 'bg-cyan-500', text: 'text-cyan-700' },
      { name: 'Photo Magenta (PM)', val: Math.round(m * 0.6 * 100) / 100, color: 'bg-pink-500', text: 'text-pink-700' },
      { name: 'Yellow (Y)', val: y, color: 'bg-amber-400', text: 'text-amber-700' },
      { name: 'Photo Black (PBk)', val: Math.round(k * 0.45 * 100) / 100, color: 'bg-slate-900', text: 'text-slate-900' },
      { name: 'Matte Black (MBk)', val: Math.round(k * 0.3 * 100) / 100, color: 'bg-stone-800', text: 'text-stone-800' },
      { name: 'Light Cyan (Lc)', val: lc, color: 'bg-sky-300', text: 'text-sky-600' },
      { name: 'Light Magenta (Lm)', val: lm, color: 'bg-rose-300', text: 'text-rose-600' },
      { name: 'Gray (Gy)', val: gy, color: 'bg-slate-400', text: 'text-slate-600' },
      { name: 'Photo Gray (PGy)', val: lgy, color: 'bg-slate-300', text: 'text-slate-500' },
      { name: 'Red (R)', val: red, color: 'bg-red-500', text: 'text-red-700' },
      { name: 'Green (G)', val: green, color: 'bg-emerald-500', text: 'text-emerald-700' },
      { name: 'Chroma Optimizer (CO)', val: co, color: 'bg-indigo-300', text: 'text-indigo-600' },
    ];
  };

  const handleSendToQuotationAction = () => {
    if (!result) return;

    const exportPayload: PreflightResult = {
      ...result,
      color_mode: customerPrintMode === 'MONO_ALL' ? 'MONO_K' : 'CMYK',
      color_pages_count: colorPages,
      mono_pages_count: monoPages,
      color_pages_avg_c: combinedC,
      color_pages_avg_m: combinedM,
      color_pages_avg_y: combinedY,
      color_pages_avg_k: combinedK,
      mono_pages_avg_k: effectiveMonoK,
      target_paper_size: targetPaperSize,
      target_width_mm: customWidthMM,
      target_height_mm: customHeightMM,
    };

    if (onSendToQuotation) {
      onSendToQuotation(exportPayload);
    }
  };

  return (
    <div className="w-full space-y-6 text-slate-800 font-sans">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-primary-navy to-slate-900 text-white rounded-2xl shadow-md">
            <Sparkles className="w-6 h-6 text-accent-sky" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-accent-sky/10 text-accent-sky rounded-md font-sans">
                Engine 2.0 • Full-Scan Split
              </span>
              <span className="text-xs font-bold text-slate-400 font-sans">
                GCR & TAC Color Extraction
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {currentLang === 'lo' ? 'ກວດສອບໄຟລ໌ພິມ & ຄ່າສີ CMYK' : 'Preflight & Color Cost Engine'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setPreflightMode('single')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                preflightMode === 'single'
                  ? 'bg-primary-navy text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{currentLang === 'lo' ? 'ໄຟລ໌ດ່ຽວ / ປຶ້ມ' : 'Single Doc'}</span>
            </button>
            <button
              type="button"
              onClick={() => setPreflightMode('batch')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                preflightMode === 'batch'
                  ? 'bg-primary-navy text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Images className="w-3.5 h-3.5" />
              <span>{currentLang === 'lo' ? 'ຊຸດພິມຮູບພາບ (1-100 ຮູບ)' : 'Batch Photos'}</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-accent-sky/20 text-accent-sky rounded font-mono font-bold">{batchFiles.length} ລາຍການ</span>
            </button>
          </div>

          {preflightMode === 'single' && file && (
            <button
              onClick={resetAll}
              className="px-4 py-2 text-xs font-black text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200"
            >
              {currentLang === 'lo' ? 'ເລີ່ມໃໝ່ (New File)' : 'Reset / New File'}
            </button>
          )}

          {preflightMode === 'batch' && batchFiles.length > 0 && (
            <button
              onClick={resetBatch}
              className="px-4 py-2 text-xs font-black text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200"
            >
              {currentLang === 'lo' ? 'ເລີ່ມໃໝ່ (Reset Photos)' : 'Reset Photos'}
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN LAYOUT SWITCH: BATCH PHOTOS VS SINGLE DOC */}
      {preflightMode === 'batch' ? (
        <div className="space-y-6 animate-fade-in">
          {/* Batch Controls Toolbar */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                  1. ເລືອກຂະໜາດຮູບພາບ (Photo Size Preset)
                </span>
                <span className="text-sm font-black text-slate-900 mt-0.5 block">
                  ຂະໜາດທີ່ຕ້ອງການພິມ & ເລເອົາ Imposition
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(PHOTO_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setBatchPhotoSize(key as any);
                      if (batchFiles.length > 0) {
                        runBatchPreflightAnalysis(batchFiles, key, borderMode);
                      }
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex flex-col items-center ${
                      batchPhotoSize === key
                        ? 'bg-primary-navy text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span className="text-[10px] opacity-75 font-sans">{preset.cutsPerA4} ຮູບ/A4</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Border Mode Toggle & Item Limit Badge */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-500">
                  2. ຮູບແບບຂອບຮູບ (Border Style):
                </span>
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setBorderMode('BORDERED');
                      if (batchFiles.length > 0) {
                        runBatchPreflightAnalysis(batchFiles, batchPhotoSize, 'BORDERED');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                      borderMode === 'BORDERED'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ມີຂອບຂາວ (Bordered)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBorderMode('BORDERLESS');
                      if (batchFiles.length > 0) {
                        runBatchPreflightAnalysis(batchFiles, batchPhotoSize, 'BORDERLESS');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                      borderMode === 'BORDERLESS'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ບໍ່ມີຂອບ (Borderless Bleed 2mm)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-xs font-bold rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                  ຂີດຈຳກັດ: ສູງສຸດ 100 ຮູບຕໍ່ 1 ລາຍການ
                </span>
                {batchFiles.length > 0 && (
                  <span className="px-3 py-1 text-xs font-black rounded-xl bg-sky-50 text-sky-800 border border-sky-200 font-mono">
                    ເລືອກແລ້ວ {batchFiles.length} / 100 ຮູບ
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* If no files uploaded yet: Drag & Drop Dropzone */}
          {batchFiles.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 shadow-sm">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files) {
                    handleBatchFilesSelected(e.dataTransfer.files);
                  }
                }}
                onClick={() => document.getElementById('preflight-batch-input')?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center transition-all cursor-pointer ${
                  isDragOver
                    ? 'border-accent-sky bg-accent-sky/5 scale-[1.01]'
                    : 'border-slate-300 hover:border-accent-sky/70 hover:bg-slate-50'
                }`}
              >
                <input
                  id="preflight-batch-input"
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.webp,.tiff,.tif,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleBatchFilesSelected(e.target.files);
                    }
                  }}
                />

                <div className="flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto">
                  <div className="w-16 h-16 rounded-3xl bg-primary-navy/10 text-primary-navy flex items-center justify-center shadow-xs">
                    <Images className="w-8 h-8 text-accent-sky" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {currentLang === 'lo'
                        ? 'ລາກຮູບພາບຫຼາຍໄຟລ໌ມາວາງທີ່ນີ້ ຫຼື ຄລິກເພື່ອເລືອກ (ສູງສຸດ 100 ຮູບ)'
                        : 'Drag & Drop Multiple Photos or Click to Browse (Max 100 photos)'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {currentLang === 'lo'
                        ? 'ຮອງຮັບ JPG, PNG, WebP (ຕົວຢ່າງ 40 ຮູບລວມເປັນ 1 ລາຍການ) ລະບົບຈະຄິດໄລ່ຄ່າສີສະເລ່ຍ CMYK, ການວາງເລເອົາ A4, ແລະ ການຕັດ Polar Guillotine'
                        : 'Supports multiple JPG, PNG, WebP. Consolidates into 1 single Order Item with average CMYK coverage and imposition cutting plan.'}
                    </p>
                  </div>
                </div>
              </div>

              {batchErrorMessage && (
                <div className="mt-4 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{batchErrorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            /* Batch Results View */
            <div className="space-y-6">
              {/* Loading overlay if analyzing */}
              {isBatchAnalyzing && (
                <div className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col items-center justify-center space-y-3 shadow-lg text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-accent-sky" />
                  <div className="text-sm font-black">
                    ກຳລັງວິເຄາະຮູບພາບ {batchProgress.current} / {batchProgress.total} ({batchProgress.pct}%)...
                  </div>
                  <div className="w-64 bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-accent-sky h-full transition-all duration-150" style={{ width: `${batchProgress.pct}%` }} />
                  </div>
                </div>
              )}

              {batchResult && (
                <div className="space-y-6">
                  {/* Top Consolidated Hero Card */}
                  <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                            1 ລາຍການສັ່ງພິມຫຼັກ (Single Consolidated Item)
                          </span>
                          <span className="text-xs font-bold text-slate-400 font-mono">
                            {PHOTO_PRESETS[batchPhotoSize]?.label || '4x6"'} • {borderMode === 'BORDERED' ? 'ມີຂອບຂາວ' : 'ບໍ່ມີຂອບ (Bleed 2mm)'}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                          ຊຸດພິມຮູບພາບ Photo Prints ({batchResult.total_files} ໃບ)
                        </h3>
                      </div>

                      <div className="flex items-center gap-3">
                        {onSendToQuotation && (
                          <button
                            type="button"
                            onClick={handleSendBatchToQuotationAction}
                            className="px-6 py-3.5 bg-accent-sky hover:bg-sky-600 text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-accent-sky/20 transition active:scale-95 cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                            <span>ສົ່ງໄປຍັງໃບສະເໜີລາຄາ (1 ລາຍການ / {batchResult.total_files} ຮູບ)</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 4 CMYK Average Coverage Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 bg-cyan-50/70 border border-cyan-200/80 rounded-2xl space-y-1">
                        <div className="text-[11px] font-bold text-cyan-800 flex items-center justify-between">
                          <span>Cyan (C) ສະເລ່ຍ:</span>
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
                        </div>
                        <div className="text-2xl font-black text-cyan-900 font-mono">
                          {batchResult.avg_cov_c}%
                        </div>
                        <div className="w-full bg-cyan-100 rounded-full h-1.5 overflow-hidden mt-2">
                          <div className="bg-cyan-500 h-full" style={{ width: `${Math.min(batchResult.avg_cov_c * 3, 100)}%` }} />
                        </div>
                      </div>

                      <div className="p-4 bg-pink-50/70 border border-pink-200/80 rounded-2xl space-y-1">
                        <div className="text-[11px] font-bold text-pink-800 flex items-center justify-between">
                          <span>Magenta (M) ສະເລ່ຍ:</span>
                          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" />
                        </div>
                        <div className="text-2xl font-black text-pink-900 font-mono">
                          {batchResult.avg_cov_m}%
                        </div>
                        <div className="w-full bg-pink-100 rounded-full h-1.5 overflow-hidden mt-2">
                          <div className="bg-pink-500 h-full" style={{ width: `${Math.min(batchResult.avg_cov_m * 3, 100)}%` }} />
                        </div>
                      </div>

                      <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-1">
                        <div className="text-[11px] font-bold text-amber-800 flex items-center justify-between">
                          <span>Yellow (Y) ສະເລ່ຍ:</span>
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                        </div>
                        <div className="text-2xl font-black text-amber-900 font-mono">
                          {batchResult.avg_cov_y}%
                        </div>
                        <div className="w-full bg-amber-100 rounded-full h-1.5 overflow-hidden mt-2">
                          <div className="bg-amber-400 h-full" style={{ width: `${Math.min(batchResult.avg_cov_y * 3, 100)}%` }} />
                        </div>
                      </div>

                      <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl space-y-1">
                        <div className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                          <span>Key Black (K) ສະເລ່ຍ:</span>
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block" />
                        </div>
                        <div className="text-2xl font-black text-slate-900 font-mono">
                          {batchResult.avg_cov_k}%
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mt-2">
                          <div className="bg-slate-800 h-full" style={{ width: `${Math.min(batchResult.avg_cov_k * 3, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Imposition & Production Guillotine Cutting Strategy */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                        <Grid className="w-4 h-4 text-primary-navy" />
                        <span>ແຜນຈັດວາງເຈ້ຍ A4 (Imposition Layout)</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                          <div className="flex justify-between font-bold text-slate-700">
                            <span>ຂະໜາດເຈ້ຍແມ່ພິມ:</span>
                            <span className="font-mono font-black text-slate-900">A4 (210 × 297 mm)</span>
                          </div>
                          <div className="flex justify-between font-bold text-slate-700">
                            <span>ຈຳນວນຮູບຕໍ່ແຜ່ນ A4:</span>
                            <span className="font-mono font-black text-slate-900">
                              {batchResult.suggested_imposition.cuts_per_sheet} ຮູບ/ແຜ່ນ
                            </span>
                          </div>
                          <div className="flex justify-between font-bold text-slate-700 border-t border-slate-200 pt-1.5">
                            <span>ຈຳນວນເຈ້ຍ A4 ຕົວຈິງ:</span>
                            <span className="font-mono font-black text-emerald-700">
                              {batchResult.suggested_imposition.required_sheets} ແຜ່ນ
                            </span>
                          </div>
                          <div className="flex justify-between font-bold text-slate-500 text-[11px]">
                            <span>ເຜື່ອເສຍ (Spoilage 5%):</span>
                            <span className="font-mono font-bold">
                              +{batchResult.suggested_imposition.spoilage_sheets} ແຜ່ນ (ລວມ {batchResult.suggested_imposition.total_sheets} ແຜ່ນ)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                        <Scissors className="w-4 h-4 text-accent-sky" />
                        <span>ຂັ້ນຕອນການຕັດ (Guillotine Cutting Plan)</span>
                      </div>
                      <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-2xl space-y-2 text-xs text-sky-900 font-medium">
                        <div className="font-black text-sky-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-sky-600" />
                          <span>Polar 78 ECO Guillotine (ຕັດປຶກດຽວ)</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-sky-800">
                          {batchResult.suggested_imposition.summary_lao}
                        </p>
                        <div className="text-[10px] text-sky-700 font-bold bg-white/70 p-2 rounded-xl border border-sky-100">
                          {borderMode === 'BORDERED'
                            ? '• ມີຂອບຂາວ 3-5mm: ຕັດຕາມເສັ້ນ Margin ແຍກແຕ່ລະຮູບ ບໍ່ເສຍເນື້ອຮູບ'
                            : '• ບໍ່ມີຂອບ (Borderless): ຕັດຕົກ Bleed 2mm ປາດຂອບ 4 ດ້ານ ໄດ້ຮູບເຕັມໃບງົດງາມ'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DPI Quality Check Banner */}
                  {batchResult.low_dpi_count > 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-black text-amber-950 block">
                          ພົບ {batchResult.low_dpi_count} ຮູບ ທີ່ມີຄວາມລະອຽດຕ່ຳກວ່າ 150 DPI
                        </span>
                        <span className="text-[11px] text-amber-800 leading-relaxed block">
                          ບາງຮູບອາດຈະມົວຫຼືແຕກເມື່ອພິມຂະໜາດໃຫຍ່ (ແນະນຳໃຫ້ແຈ້ງລູກຄ້າສົ່ງໄຟລ໌ຕົ້ນສະບັບ ຫຼື ຢືນຢັນກ່ອນພິມ)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-900">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span className="font-bold">
                        ທຸກຮູບພາບ ({batchResult.total_files} ໃບ) ຜ່ານມາດຕະຖານຄວາມລະອຽດການພິມ (DPI ພຽງພໍຕໍ່ການພິມຄົມຊັດ)
                      </span>
                    </div>
                  )}

                  {/* Contact Sheet Photo Gallery */}
                  <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Images className="w-5 h-5 text-accent-sky" />
                        <span className="text-xs font-black text-slate-800">
                          Contact Sheet Gallery ({batchResult.total_files} ຮູບພາບ)
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-bold">
                        ຄລິກທີ່ຮູບເພື່ອເບິ່ງຂະໜາດໃຫຍ່
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                      {batchPreviews.map((preview, idx) => {
                        const itemRes = batchResult.files[idx];
                        const isLowDpi = itemRes && (itemRes.dpi_estimate || 0) < 150;
                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedPreviewPhoto(preview.url)}
                            className="group relative bg-slate-50 border border-slate-200 hover:border-accent-sky rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col"
                          >
                            <div className="aspect-square w-full bg-slate-900/5 flex items-center justify-center overflow-hidden relative">
                              <img
                                src={preview.url}
                                alt={preview.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                              />
                              <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                <Eye className="w-5 h-5" />
                              </div>
                            </div>
                            <div className="p-2 space-y-1 text-[10px]">
                              <div className="font-bold text-slate-800 truncate" title={preview.name}>
                                {idx + 1}. {preview.name}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] ${
                                  isLowDpi ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {itemRes?.dpi_estimate ? `${itemRes.dpi_estimate} DPI` : '300 DPI'}
                                </span>
                                {itemRes && (
                                  <span className="font-mono text-slate-500 text-[9px]">
                                    {Math.round((itemRes.avg_cov_c + itemRes.avg_cov_m + itemRes.avg_cov_y + itemRes.avg_cov_k))}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Final Quotation Action */}
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={resetBatch}
                      className="px-5 py-3 text-xs font-black text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition cursor-pointer border border-slate-200"
                    >
                      ເລືອກຮູບໃໝ່ / ລຶບທັງໝົດ
                    </button>
                    {onSendToQuotation && (
                      <button
                        type="button"
                        onClick={handleSendBatchToQuotationAction}
                        className="px-8 py-3.5 bg-accent-sky hover:bg-sky-600 text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-accent-sky/20 transition active:scale-95 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>ສົ່ງໄປຍັງໃບສະເໜີລາຄາ (1 ລາຍການ / {batchResult.total_files} ຮູບ)</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* SINGLE DOC / BOOK PREFLIGHT LAYOUT */
        !file ? (
        /* Empty Upload State */
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 shadow-sm">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('preflight-file-input')?.click()}
            className={`border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center transition-all cursor-pointer ${
              isDragOver
                ? 'border-accent-sky bg-accent-sky/5 scale-[1.01]'
                : 'border-slate-300 hover:border-accent-sky/70 hover:bg-slate-50'
            }`}
          >
            <input
              id="preflight-file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.tiff,.tif,.psd"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-primary-navy/10 text-primary-navy flex items-center justify-center shadow-xs">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-slate-900">
                  {currentLang === 'lo' ? 'ລາກໄຟລ໌ມາວາງທີ່ນີ້ ຫຼື ຄລິກເພື່ອເລືອກໄຟລ໌' : 'Drag & Drop Artwork or Click to Browse'}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {currentLang === 'lo'
                    ? 'ຮອງຮັບ PDF (ສະແກນທຸກໜ້າ 1-500+ ໜ້າ, ແຍກໜ້າສີ/ຂາວດຳ), PNG, JPG, WebP, TIFF, PSD'
                    : 'Supports multi-page PDF (Full-Scan all pages with Color/Mono Split), PNG, JPG, WebP, TIFF'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* File Uploaded & Analysis View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (8 cols): PDF / Artwork Viewer */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              
              {/* Viewer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent-sky" />
                  <span className="text-xs font-black text-slate-800 truncate max-w-[300px]">
                    {file.name}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.15))}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition cursor-pointer"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono font-bold text-slate-600 w-10 text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.15))}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Viewer Frame */}
              <div className="w-full bg-slate-900/90 rounded-2xl overflow-hidden min-h-[500px] flex items-center justify-center p-4 relative">
                {isAnalyzing && (
                  <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3 p-6 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-accent-sky" />
                    <div className="space-y-1">
                      <div className="text-sm font-black">
                        ກຳລັງສະແກນໜ້າທີ {progress.current} / {progress.total} ({progress.pct}%)...
                      </div>
                      <div className="text-xs text-slate-400 font-sans">
                        Full-Scan Pixel-by-Pixel & ແຍກໜ້າສີ / ຂາວດຳ
                      </div>
                    </div>
                    <div className="w-64 bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-accent-sky h-full transition-all duration-150" style={{ width: `${progress.pct}%` }} />
                    </div>
                  </div>
                )}

                {previewUrl && (
                  isImageFile(file.name) ? (
                    <img
                      src={cmykSimulatedUrl || previewUrl}
                      alt="Artwork Preview"
                      style={{ transform: `scale(${zoomLevel})` }}
                      className="max-h-[600px] object-contain rounded-lg shadow-2xl transition-transform"
                    />
                  ) : (
                    <iframe
                      src={previewUrl}
                      title="PDF Preview"
                      className="w-full h-[600px] rounded-lg border-0 bg-white shadow-2xl"
                    />
                  )
                )}
              </div>

              {/* Execution Notice */}
              {result && (
                <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between px-1">
                  <span>{result.execution_notice}</span>
                  {reportSavedStatus && <span className="text-emerald-600 font-bold">{reportSavedStatus}</span>}
                </div>
              )}

            </div>
          </div>

          {/* Right Column (5 cols): Diagnostics & Color Coverage */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            {result ? (
              <div className="space-y-4">
                
                {/* 1. Target Paper Size Selection Banner */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-primary-navy" />
                      <span>1. ຂະໜາດເຈ້ຍທີ່ຈະພິມ (Target Paper):</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold font-sans">
                      {paperWidthMM} × {paperHeightMM} mm
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {['A4', 'A5', 'A3', 'CUSTOM'].map(sz => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handlePaperSizeSelect(sz)}
                        className={`py-2 rounded-xl text-xs font-black transition cursor-pointer text-center ${
                          targetPaperSize === sz
                            ? 'bg-primary-navy text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>

                  {targetPaperSize === 'CUSTOM' && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1 flex-1">
                        <span className="text-[10px] font-bold text-slate-500">W:</span>
                        <input
                          type="number"
                          value={customWidthMM}
                          onChange={(e) => handleCustomDimensionChange(Number(e.target.value), customHeightMM)}
                          className="w-full px-2 py-1 text-xs border rounded-lg font-mono font-bold"
                        />
                      </div>
                      <div className="flex items-center gap-1 flex-1">
                        <span className="text-[10px] font-bold text-slate-500">H:</span>
                        <input
                          type="number"
                          value={customHeightMM}
                          onChange={(e) => handleCustomDimensionChange(customWidthMM, Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs border rounded-lg font-mono font-bold"
                        />
                      </div>
                    </div>
                  )}

                  <div className="p-2.5 bg-sky-50/70 border border-sky-200/60 rounded-xl flex items-center justify-between text-[11px]">
                    <span className="text-sky-950 font-bold">ເນື້ອທີ່ເຈ້ຍ: {paperAreaM2.toFixed(4)} $m^2$</span>
                    <span className="text-sky-700 font-mono font-bold">~{estimatedGrandTotalInkML} mL Ink</span>
                  </div>
                </div>

                {/* 2. Customer Requested Print Mode (Color vs Mono All) */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Printer className="w-3.5 h-3.5 text-emerald-600" />
                      <span>2. ໂໝດການພິມທີ່ລູກຄ້າເລືອກ (Print Mode):</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomerPrintMode('COLOR')}
                      className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                        customerPrintMode === 'COLOR'
                          ? 'bg-pink-50/80 border-pink-300 text-pink-950 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-xs">
                        <Palette className="w-3.5 h-3.5 text-pink-500" />
                        <span>ພິມສີ (Color Print)</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        ແຍກໜ້າສີ & ຂາວດຳອັດຕະໂນມັດ
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustomerPrintMode('MONO_ALL')}
                      className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                        customerPrintMode === 'MONO_ALL'
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-xs">
                        <FileCode className="w-3.5 h-3.5 text-slate-400" />
                        <span>ພິມຂາວດຳລ້ວນ (All B&W)</span>
                      </div>
                      <div className={`text-[10px] mt-0.5 ${customerPrintMode === 'MONO_ALL' ? 'text-slate-300' : 'text-slate-400'}`}>
                        ຄິດຄ່າໝຶກດຳ {totalPages} ໜ້າລ້ວນ
                      </div>
                    </button>
                  </div>

                  {/* If Color Mode is Active -> Channel Options (4 Color, 6 Color, 12 Color) */}
                  {customerPrintMode === 'COLOR' && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                        <span>ຈຳນວນສີ (Color Channels):</span>
                        <div className="flex gap-1">
                          {[
                            { id: '4_COLOR', label: '4 ສີ (CMYK)' },
                            { id: '6_COLOR', label: '6 ສີ (Photo)' },
                            { id: '12_COLOR', label: '12 ສີ (Fine Art)' }
                          ].map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setColorChannelOption(c.id as any)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                colorChannelOption === c.id
                                  ? 'bg-pink-600 text-white shadow-xs font-black'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Color vs Mono Pages Split Tabs & Grand Total Summary */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>3. ລາຍລະອຽດໜ້າ & ຄ່າສີ ({totalPages} ໜ້າ)</span>
                    </span>
                  </div>

                  {/* 3 Tabs: Color Pages vs Mono Pages vs All Pages Combined */}
                  <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 text-xs font-black">
                    <button
                      type="button"
                      onClick={() => setActiveCoverageTab('color_pages')}
                      className={`flex-1 py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 text-center ${
                        activeCoverageTab === 'color_pages'
                          ? 'bg-white text-pink-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span>ໜ້າສີ ({colorPages})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveCoverageTab('mono_pages')}
                      className={`flex-1 py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 text-center ${
                        activeCoverageTab === 'mono_pages'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>ຂາວດຳ ({monoPages})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveCoverageTab('all_pages')}
                      className={`flex-1 py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 text-center ${
                        activeCoverageTab === 'all_pages'
                          ? 'bg-white text-primary-navy shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>ລວມທັງໝົດ</span>
                    </button>
                  </div>

                  {/* TAB 1: COLOR PAGES DETAILS (Supports 4, 6, 12 colors) */}
                  {activeCoverageTab === 'color_pages' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex justify-between items-center bg-pink-50/70 p-3 rounded-2xl border border-pink-200/60">
                        <div>
                          <div className="text-xs font-black text-pink-950">
                            ຈຳນວນໜ້າສີ: {colorPages} ໜ້າ
                          </div>
                          <div className="text-[10px] text-pink-700">
                            ຄິດເປັນ {totalPages > 0 ? Math.round((colorPages / totalPages) * 100) : 0}% ຂອງປຶ້ມ
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-xs font-black text-pink-900">{totalColorInkCoverage}% CMYK</div>
                          <div className="text-[10px] text-pink-600 font-bold">~{estimatedColorInkML} mL Ink</div>
                        </div>
                      </div>

                      {/* Dynamic Color Channels Renderer */}
                      <div className="space-y-2 pt-1">
                        <div className="text-[11px] font-bold text-slate-500 flex justify-between">
                          <span>ຊ່ອງສີ ({colorChannelOption.replace('_', ' ')}):</span>
                          <span>Coverage %</span>
                        </div>
                        <div className={`grid gap-2 ${colorChannelOption === '12_COLOR' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {getDynamicChannels(rawColorC, rawColorM, rawColorY, rawColorK, colorChannelOption).map((ch, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs font-bold">
                                <span className={`${ch.text} flex items-center gap-1.5`}>
                                  <span className={`w-2 h-2 rounded-full ${ch.color} inline-block`} />
                                  <span className="truncate">{ch.name}</span>
                                </span>
                                <span className="font-mono text-slate-800 font-black">{ch.val}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className={`${ch.color} h-full`} style={{ width: `${Math.min(ch.val * 3, 100)}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: MONO B&W PAGES DETAILS */}
                  {activeCoverageTab === 'mono_pages' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex justify-between items-center bg-slate-100 p-3 rounded-2xl border border-slate-200">
                        <div>
                          <div className="text-xs font-black text-slate-900">
                            ຈຳນວນໜ້າຂາວດຳ: {monoPages} ໜ້າ
                          </div>
                          <div className="text-[10px] text-slate-500">
                            ຄິດເປັນ {totalPages > 0 ? Math.round((monoPages / totalPages) * 100) : 0}% ຂອງປຶ້ມ
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-xs font-black text-slate-900">{effectiveMonoK}% K</div>
                          <div className="text-[10px] text-slate-500 font-bold">~{estimatedMonoInkML} mL Ink</div>
                        </div>
                      </div>

                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-xs font-bold text-slate-800">
                          <span>Black Ink (K ລ້ວນ)</span>
                          <span className="font-mono">{effectiveMonoK}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-slate-800 h-full" style={{ width: `${Math.min(effectiveMonoK * 2.5, 100)}%` }} />
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-bold">
                        ໜ້າຂາວດຳ {monoPages} ໜ້າ ຈະຖືກຄິດສະເພາະຕົ້ນທຶນຕະລັບໝຶກດຳ (Mono K) ບໍ່ຄິດຄ່າສີ C, M, Y
                      </div>
                    </div>
                  )}

                  {/* TAB 3:  ALL PAGES COMBINED */}
                  {activeCoverageTab === 'all_pages' && (
                    <div className="space-y-3 animate-fade-in">
                      
                      {/* Hero Combined Stats */}
                      <div className="p-4 bg-gradient-to-br from-slate-900 via-primary-navy to-slate-900 text-white rounded-2xl space-y-2.5 shadow-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs text-slate-300 font-bold block">
                              ຄ່າສີສະເລ່ຍຕໍ່ໜ້າ (Avg per Page):
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans">
                              (ຖົວສະເລ່ຍທັງໝົດ {totalPages} ໜ້າ: ສີ {colorPages} + ຂາວດຳ {monoPages})
                            </span>
                          </div>
                          <span className="text-lg font-black text-emerald-400 font-mono">
                            {grandTotalAverageInk}%
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs border-t border-white/10 pt-2 font-mono">
                          <span className="text-slate-300 font-bold">
                            ປະລິມານນ້ຳໝຶກລວມຕົວຈິງ:
                          </span>
                          <span className="text-emerald-300 font-black text-sm">
                            ~{estimatedGrandTotalInkML} mL
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 border-t border-white/5 pt-1.5 flex justify-between">
                          <span>• ໝຶກສີ ({colorPages} ໜ້າ): ~{estimatedColorInkML} mL</span>
                          <span>• ໝຶກດຳ ({monoPages} ໜ້າ): ~{estimatedMonoInkML} mL</span>
                        </div>
                      </div>

                      {/* Dynamic Combined Channels Renderer */}
                      <div className="space-y-2 pt-1">
                        <div className="text-[11px] font-bold text-slate-500 flex justify-between">
                          <span>ຊ່ອງສີສະເລ່ຍລວມ ({colorChannelOption.replace('_', ' ')}):</span>
                          <span>Coverage %</span>
                        </div>
                        <div className={`grid gap-2 ${colorChannelOption === '12_COLOR' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {getDynamicChannels(combinedC, combinedM, combinedY, combinedK, colorChannelOption).map((ch, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs font-bold">
                                <span className={`${ch.text} flex items-center gap-1.5`}>
                                  <span className={`w-2 h-2 rounded-full ${ch.color} inline-block`} />
                                  <span className="truncate">{ch.name}</span>
                                </span>
                                <span className="font-mono text-slate-800 font-black">{ch.val}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className={`${ch.color} h-full`} style={{ width: `${Math.min(ch.val * 3, 100)}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                </div>

                {/* 4. Preflight Diagnostics Badges */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      ມາດຕະຖານໄຟລ໌ພິມ (Preflight Quality)
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                      {result.status_badge_lao}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex justify-between">
                      <span className="text-slate-500">Color Space:</span>
                      <span className="font-mono text-slate-800">{result.has_rgb ? 'RGB' : 'CMYK'}</span>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex justify-between">
                      <span className="text-slate-500">Bleed:</span>
                      <span className="font-mono text-slate-800">{result.bleed_mm} mm</span>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex justify-between">
                      <span className="text-slate-500">TAC:</span>
                      <span className="font-mono text-slate-800">{result.tac_max_percent}%</span>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex justify-between">
                      <span className="text-slate-500">Resolution:</span>
                      <span className="font-mono text-slate-800">{result.dpi_estimate} DPI</span>
                    </div>
                  </div>
                </div>

                {/* 5. Proceed to Quotation Button */}
                <div className="space-y-2 pt-1">
                  {onSendToQuotation && (
                    <button
                      type="button"
                      onClick={handleSendToQuotationAction}
                      className="w-full py-3.5 bg-accent-sky hover:bg-sky-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-accent-sky/20 transition active:scale-95 cursor-pointer"
                    >
                      <span>ສົ່ງຄ່າໄປໃຊ້ໃນໃບສະເໜີລາຄາ (Send to Quotation)</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  {onSkipToManual && (
                    <button
                      type="button"
                      onClick={onSkipToManual}
                      className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer text-center"
                    >
                      ຂ້າມ / ໄປປ້ອນຄ່າເອງ (Manual)
                    </button>
                  )}
                </div>

              </div>
            ) : (
              <div className="p-6 bg-white border border-slate-200/90 rounded-3xl text-center text-slate-400 text-xs">
                ກະລຸນາເລືອກໄຟລ໌ເພື່ອວິເຄາະ
              </div>
            )}
          </div>

        </div>
      )
    )}

      {/* Lightbox Modal for Full View of Selected Photo */}
      {selectedPreviewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8"
          onClick={() => setSelectedPreviewPhoto(null)}
        >
          <div
            className="relative bg-white rounded-3xl overflow-hidden max-w-4xl max-h-[90vh] shadow-2xl p-4 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPreviewPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPreviewPhoto}
              alt="Enlarged preview"
              className="max-h-[80vh] w-auto object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
