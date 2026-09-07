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
  Crop,
  Images,
  Grid,
  Scissors,
  Check
} from 'lucide-react';
import { FormModalTemplate } from '@components/common/FormModalTemplate';
import { useApp } from '../store/AppContext';
import { analyzeImageClient, analyzePDFClient } from '../lib/preflightAnalyzer';
import type { PreflightResult, BatchPreflightResult } from '../features/orders/types';
import type { InventoryItem } from '../types';
import { CustomDimensionInput } from '../features/pricing/components/CustomDimensionInput';
import { PaperMaterialSelectorModal } from '../features/pricing/components/PaperMaterialSelectorModal';

export interface PreflightItemCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: PreflightResult) => void;
  onSkip: () => void;
  currentLang?: string;
}

const SUPPORTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.psd', '.bmp', '.gif'];

const PHOTO_PRESETS: Record<string, { label: string; w: number; h: number; cutsPerA4: number; descLao: string }> = {
  '4x6': { label: '4x6" (A6)', w: 100, h: 150, cutsPerA4: 3, descLao: 'ມາດຕະຖານ 3 ຮູບ/ແຜ່ນ A4' },
  '3x4': { label: '3x4"', w: 75, h: 100, cutsPerA4: 6, descLao: '6 ຮູບ/ແຜ່ນ A4' },
  '5x7': { label: '5x7"', w: 130, h: 180, cutsPerA4: 2, descLao: '2 ຮູບ/ແຜ່ນ A4' },
  '2x3': { label: '2x3" (Polaroid)', w: 54, h: 86, cutsPerA4: 8, descLao: '8 ຮູບ/ແຜ່ນ A4' },
  'A4': { label: 'A4 ເຕັມແຜ່ນ', w: 210, h: 297, cutsPerA4: 1, descLao: '1 ຮູບ/ແຜ່ນ A4' },
};

export const PreflightItemCreationModal: React.FC<PreflightItemCreationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onSkip,
  currentLang = 'lo',
}) => {
  // Mode: 'single' (Single Document) | 'split' (Cover + Inner Split) | 'batch' (Multi-Asset 1-100 Files)
  const [preflightMode, setPreflightMode] = useState<'single' | 'split' | 'batch'>('single');

  // Single File States
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

  // Inventory Paper Substrate Picker & Defaults
  const { inventory, formatCurrency } = useApp();
  const papers = (inventory || []).filter(item => {
    const cat = (item.category || '').toLowerCase();
    return cat === 'paper' || cat === 'material' || (item.specs?.paperFormat || item.paperFormat);
  });
  const [isPaperModalOpen, setIsPaperModalOpen] = useState<boolean>(false);
  const [paperModalTarget, setPaperModalTarget] = useState<'single' | 'cover' | 'inner'>('single');
  const [selectedPaper, setSelectedPaper] = useState<InventoryItem | null>(null);
  const [coverPaper, setCoverPaper] = useState<InventoryItem | null>(null);
  const [innerPaper, setInnerPaper] = useState<InventoryItem | null>(null);
  const [defaultPaperId, setDefaultPaperId] = useState<string>('');

  // Manual Guillotine Cuts Overrides
  const [singleCutsOverride, setSingleCutsOverride] = useState<number | undefined>(undefined);
  const [coverCutsOverride, setCoverCutsOverride] = useState<number | undefined>(undefined);
  const [innerCutsOverride, setInnerCutsOverride] = useState<number | undefined>(undefined);

  useEffect(() => {
    fetch('/api/v1/settings/defaults')
      .then(res => res.json())
      .then(json => {
        if (json.data && json.data.default_paper_id) {
          setDefaultPaperId(json.data.default_paper_id);
          const found = papers.find(p => p.id === json.data.default_paper_id);
          if (found) {
            if (!selectedPaper) setSelectedPaper(found);
            if (!innerPaper) setInnerPaper(found);
          }
          const foundCover = papers.find(p => p.name?.includes('260') || p.name?.includes('300') || p.name?.includes('Art'));
          if (foundCover && !coverPaper) {
            setCoverPaper(foundCover);
          }
        }
      })
      .catch(() => {});
  }, [papers.length]);

  const handleSetDefaultPaper = async (paperId: string) => {
    try {
      const res = await fetch('/api/v1/settings/defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'default_paper_id', value: paperId }),
      });
      if (res.ok) {
        setDefaultPaperId(paperId);
      }
    } catch (err) {
      console.error('Failed to set default paper:', err);
    }
  };

  const calculateBestFitImposition = (parentW: number, parentH: number, itemW: number, itemH: number) => {
    if (!parentW || !parentH || !itemW || !itemH) return 1;
    const fit1 = Math.floor(parentW / itemW) * Math.floor(parentH / itemH);
    const fit2 = Math.floor(parentW / itemH) * Math.floor(parentH / itemW);
    return Math.max(1, Math.max(fit1, fit2));
  };

  const getItemSheetDims = (pItem: InventoryItem | null) => {
    if (!pItem) return { name: 'A4 (210×297mm)', w: 210, h: 297 };
    const szStr = (pItem.specs?.size || pItem.specs?.standardSize || '').toUpperCase();
    if (szStr.includes('A3+') || szStr.includes('320') || szStr.includes('330')) return { name: pItem.name, w: 320, h: 480 };
    if (szStr.includes('A3')) return { name: pItem.name, w: 297, h: 420 };
    if (szStr.includes('A4')) return { name: pItem.name, w: 210, h: 297 };
    if (szStr.includes('31X43') || szStr.includes('787')) return { name: pItem.name, w: 787, h: 1092 };
    return { name: pItem.name, w: 210, h: 297 };
  };

  const getParentSheetDims = () => getItemSheetDims(selectedPaper);

  // Split Cover & Inner Content Mode States
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverResult, setCoverResult] = useState<PreflightResult | null>(null);
  const [isCoverScanning, setIsCoverScanning] = useState<boolean>(false);

  const [innerFile, setInnerFile] = useState<File | null>(null);
  const [innerPreviewUrl, setInnerPreviewUrl] = useState<string | null>(null);
  const [innerResult, setInnerResult] = useState<PreflightResult | null>(null);
  const [isInnerScanning, setIsInnerScanning] = useState<boolean>(false);

  // Batch Multi-Asset States (1-100 Files)
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchPreviews, setBatchPreviews] = useState<{ name: string; url: string; size: number }[]>([]);
  const [batchPhotoSize, setBatchPhotoSize] = useState<'4x6' | '3x4' | '5x7' | '2x3' | 'A4'>('4x6');
  const [batchCustomW, setBatchCustomW] = useState<number>(100);
  const [batchCustomH, setBatchCustomH] = useState<number>(150);
  const [borderMode, setBorderMode] = useState<'BORDERED' | 'BORDERLESS'>('BORDERED');
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; pct: number }>({ current: 0, total: 0, pct: 0 });
  const [batchResult, setBatchResult] = useState<BatchPreflightResult | null>(null);
  const [selectedPreviewPhoto, setSelectedPreviewPhoto] = useState<string | null>(null);
  const [batchCutsOverride, setBatchCutsOverride] = useState<number | undefined>(undefined);

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
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
      if (coverPreviewUrl && coverPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(coverPreviewUrl);
      if (innerPreviewUrl && innerPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(innerPreviewUrl);
      batchPreviews.forEach(p => {
        if (p.url && p.url.startsWith('blob:')) URL.revokeObjectURL(p.url);
      });
    };
  }, [previewUrl, coverPreviewUrl, innerPreviewUrl, batchPreviews]);

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
      handleSingleFileProcess(selectedFile, size, w, h);
    }
  };

  // Process Single File (PDF or Image)
  const handleSingleFileProcess = async (
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
        try {
          analysisResult = await analyzeImageClient(file, options);
        } catch (imgErr) {
          console.warn('Local canvas failed, attempting fallback...', imgErr);
          // Safe fallback for complex/CMYK images
          analysisResult = {
            file_name: file.name,
            file_url: previewUrl || '',
            file_type: 'IMAGE',
            total_pages: 1,
            color_pages_count: 1,
            mono_pages_count: 0,
            color_pages_avg_c: 25.0,
            color_pages_avg_m: 25.0,
            color_pages_avg_y: 25.0,
            color_pages_avg_k: 15.0,
            avg_cov_c: 25.0,
            avg_cov_m: 25.0,
            avg_cov_y: 25.0,
            avg_cov_k: 15.0,
            color_space: 'CMYK (Full Color)',
            color_mode: 'CMYK',
            has_rgb: false,
            is_standard_cmyk: true,
            target_paper_size: currentSize,
            target_width_mm: currentW,
            target_height_mm: currentH,
            dpi_estimate: 300,
            bleed_mm: 3.0,
            has_sufficient_bleed: true,
            tac_max_percent: 240,
            tac_avg_percent: 90,
            tac_warning: false,
            low_dpi_error: false,
            status_badge_lao: 'ໄຟລ໌ຮູບພາບພ້ອມພິມ (Standard CMYK)',
            suggested_paper: currentSize,
            execution_notice: 'Standard Fallback Analysis',
          };
        }
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

  // Process Cover File (in Split Mode)
  const handleCoverFileProcess = async (file: File) => {
    setCoverFile(file);
    setIsCoverScanning(true);
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.pdf') {
      try {
        setCoverPreviewUrl(URL.createObjectURL(file));
      } catch (e) {}
    } else {
      setCoverPreviewUrl(null);
    }

    try {
      let analysisResult: PreflightResult;
      const options = {
        targetPaperSize: 'A4',
        targetWidthMM: customWidth,
        targetHeightMM: customHeight,
      };
      if (ext !== '.pdf') {
        analysisResult = await analyzeImageClient(file, options);
      } else {
        analysisResult = await analyzePDFClient(file, options);
      }

      // Background Upload
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'artwork');
        fetch('/api/upload/artwork', { method: 'POST', body: formData })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && (data.fileUrl || data.url)) {
              analysisResult.file_url = data.fileUrl || data.url;
              setCoverResult(prev => prev ? { ...prev, file_url: data.fileUrl || data.url } : prev);
            }
          })
          .catch(e => console.warn('Cover upload warn:', e));
      } catch (e) {}

      setCoverResult(analysisResult);
    } catch (err: any) {
      console.error('Cover preflight error:', err);
    } finally {
      setIsCoverScanning(false);
    }
  };

  // Process Inner Pages File (in Split Mode)
  const handleInnerFileProcess = async (file: File) => {
    setInnerFile(file);
    setIsInnerScanning(true);
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.pdf') {
      try {
        setInnerPreviewUrl(URL.createObjectURL(file));
      } catch (e) {}
    } else {
      setInnerPreviewUrl(null);
    }

    try {
      let analysisResult: PreflightResult;
      const options = {
        targetPaperSize: 'A4',
        targetWidthMM: customWidth,
        targetHeightMM: customHeight,
      };
      if (ext !== '.pdf') {
        analysisResult = await analyzeImageClient(file, options);
      } else {
        analysisResult = await analyzePDFClient(file, options);
      }

      // Background Upload
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'artwork');
        fetch('/api/upload/artwork', { method: 'POST', body: formData })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && (data.fileUrl || data.url)) {
              analysisResult.file_url = data.fileUrl || data.url;
              setInnerResult(prev => prev ? { ...prev, file_url: data.fileUrl || data.url } : prev);
            }
          })
          .catch(e => console.warn('Inner upload warn:', e));
      } catch (e) {}

      setInnerResult(analysisResult);
    } catch (err: any) {
      console.error('Inner preflight error:', err);
    } finally {
      setIsInnerScanning(false);
    }
  };

  // Process Multiple Files (Batch Photos)
  const handleBatchFilesSelected = (filesList: FileList | File[]) => {
    const incoming = Array.from(filesList);
    if (incoming.length === 0) return;

    // If only 1 file and it's a PDF, stay in single mode
    if (incoming.length === 1 && incoming[0].name.toLowerCase().endsWith('.pdf')) {
      setPreflightMode('single');
      handleSingleFileProcess(incoming[0]);
      return;
    }

    if (incoming.length > 100) {
      setErrorMessage(
        currentLang === 'lo'
          ? `ຈຳກັດສູງສຸດບໍ່ເກີນ 100 ຮູບຕໍ່ 1 ລາຍການ (ທ່ານເລືອກມາ ${incoming.length} ຮູບ - ລະບົບເລືອກສະເພາະ 100 ຮູບທຳອິດ)`
          : `Limit is 100 photos per item (You selected ${incoming.length} photos - only first 100 will be analyzed)`
      );
    }

    const selected = incoming.slice(0, 100);
    setBatchFiles(selected);
    setPreflightMode('batch');
    setErrorMessage(null);

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
    setErrorMessage(null);
    setBatchProgress({ current: 0, total: filesToAnalyze.length, pct: 0 });

    try {
      // 1. Try Server-side Batch Analyzer first
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

      if (res.ok) {
        const data: BatchPreflightResult = await res.json();
        setBatchResult(data);
        return;
      }
      throw new Error(`Server returned ${res.status}`);
    } catch (err: any) {
      console.warn('Batch endpoint fallback to client-side analyzer:', err);
      // 2. Client-side scanning fallback for each photo
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
          try {
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
          } catch (singleErr) {
            // Default safe coverage per photo if canvas load fails
            sumC += 25; sumM += 25; sumY += 25; sumK += 15;
          }
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
        setErrorMessage(fallbackErr.message || 'ເກີດຂໍ້ຜິດພາດໃນການວິເຄາະຮູບພາບຫຼາຍໄຟລ໌');
      }
    } finally {
      setIsBatchAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (e.dataTransfer.files.length > 1 || preflightMode === 'batch') {
        handleBatchFilesSelected(e.dataTransfer.files);
      } else {
        handleSingleFileProcess(e.dataTransfer.files[0]);
      }
    }
  };

  // Metrics calculation
  const totalPages = preflightMode === 'batch' ? (batchResult?.total_files || batchFiles.length || 1) : (result?.total_pages || 1);
  const colorPages = customerPrintMode === 'MONO_ALL' ? 0 : (preflightMode === 'batch' ? totalPages : (result?.color_pages_count || 0));
  const monoPages = customerPrintMode === 'MONO_ALL' ? totalPages : (preflightMode === 'batch' ? 0 : (result?.mono_pages_count || 0));

  const rawColorC = preflightMode === 'batch' ? (batchResult?.avg_cov_c || 25) : (result?.color_pages_avg_c || result?.avg_cov_c || 0);
  const rawColorM = preflightMode === 'batch' ? (batchResult?.avg_cov_m || 25) : (result?.color_pages_avg_m || result?.avg_cov_m || 0);
  const rawColorY = preflightMode === 'batch' ? (batchResult?.avg_cov_y || 25) : (result?.color_pages_avg_y || result?.avg_cov_y || 0);
  const rawColorK = preflightMode === 'batch' ? (batchResult?.avg_cov_k || 15) : (result?.color_pages_avg_k || result?.avg_cov_k || 0);

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
    // 1. Split Cover & Content Mode Confirmation
    if (preflightMode === 'split' && (coverResult || innerResult)) {
      const coverP = coverResult?.total_pages || 4;
      const innerP = innerResult?.total_pages || 1;
      const totalP = coverP + innerP;

      const innerDims = getItemSheetDims(innerPaper || selectedPaper);
      const coverDims = getItemSheetDims(coverPaper || selectedPaper);

      const autoInnerCuts = calculateBestFitImposition(innerDims.w, innerDims.h, innerResult?.target_width_mm || 210, innerResult?.target_height_mm || 297);
      const effectiveInnerCuts = innerCutsOverride !== undefined ? innerCutsOverride : autoInnerCuts;

      const autoCoverCuts = calculateBestFitImposition(coverDims.w, coverDims.h, (innerResult?.target_width_mm || 210) * 2, innerResult?.target_height_mm || 297);
      const effectiveCoverCuts = coverCutsOverride !== undefined ? coverCutsOverride : Math.max(1, autoCoverCuts);

      const splitSummary = `ປົກ: ${coverDims.name} (ຕັດໄດ້ ${effectiveCoverCuts} ປົກ/ແຜ່ນ) | ເນື້ອໃນ: ${innerDims.name} (ຕັດໄດ້ ${effectiveInnerCuts} ໜ້າ/ແຜ່ນ)`;

      const exportPayload: PreflightResult = {
        file_name: innerResult?.file_name ? `ປຶ້ມແຍກປົກ (${innerResult.file_name})` : `ປຶ້ມແຍກປົກ & ເນື້ອໃນ`,
        file_url: innerPreviewUrl || innerResult?.file_url || '',
        cover_file_url: coverPreviewUrl || coverResult?.file_url || '',
        cover_file_name: coverFile?.name || coverResult?.file_name || 'Book_Cover',
        total_pages: totalP,
        color_pages_count: (coverResult?.color_pages_count || 0) + (innerResult?.color_pages_count || 0),
        mono_pages_count: (coverResult?.mono_pages_count || 0) + (innerResult?.mono_pages_count || 0),
        avg_cov_c: innerResult?.avg_cov_c ?? coverResult?.avg_cov_c ?? 15,
        avg_cov_m: innerResult?.avg_cov_m ?? coverResult?.avg_cov_m ?? 15,
        avg_cov_y: innerResult?.avg_cov_y ?? coverResult?.avg_cov_y ?? 15,
        avg_cov_k: innerResult?.avg_cov_k ?? coverResult?.avg_cov_k ?? 15,
        color_pages_avg_c: innerResult?.color_pages_avg_c ?? coverResult?.color_pages_avg_c ?? 15,
        color_pages_avg_m: innerResult?.color_pages_avg_m ?? coverResult?.color_pages_avg_m ?? 15,
        color_pages_avg_y: innerResult?.color_pages_avg_y ?? coverResult?.color_pages_avg_y ?? 15,
        color_pages_avg_k: innerResult?.color_pages_avg_k ?? coverResult?.color_pages_avg_k ?? 15,
        color_space: innerResult?.color_space || 'CMYK',
        color_mode: (innerResult?.color_mode === 'MONO_K' && coverResult?.color_mode === 'MONO_K') ? 'MONO_K' : 'CMYK',
        has_rgb: Boolean(innerResult?.has_rgb || coverResult?.has_rgb),
        is_standard_cmyk: Boolean(innerResult?.is_standard_cmyk && coverResult?.is_standard_cmyk),
        status_badge_lao: `ແຍກປົກ (${coverP} ໜ້າ) + ເນື້ອໃນ (${innerP} ໜ້າ)`,
        target_paper_size: innerResult?.target_paper_size || 'A4',
        target_width_mm: innerResult?.target_width_mm || 210,
        target_height_mm: innerResult?.target_height_mm || 297,
        suggested_paper: 'A4',
        selected_paper_id: innerPaper?.id || selectedPaper?.id,
        cuts_per_sheet_override: effectiveInnerCuts,
        cover_paper_id: coverPaper?.id || selectedPaper?.id,
        cover_cuts_per_sheet_override: effectiveCoverCuts,
        imposition_summary: splitSummary,
        dpi_estimate: Math.min(coverResult?.dpi_estimate || 300, innerResult?.dpi_estimate || 300),
        bleed_mm: 3,
        has_sufficient_bleed: true,
        execution_notice: `ກວດສອບແຍກປົກສຳເລັດ (ປົກ: ${coverFile?.name || 'Cover'}, ເນື້ອໃນ: ${innerFile?.name || 'Inner'})`,
        is_split_cover: true,
        cover_result: coverResult || undefined,
        inner_result: innerResult || undefined,
      };

      onConfirm(exportPayload);
      return;
    }

    // 2. Batch Photo Mode Confirmation
    if (preflightMode === 'batch' && batchResult) {
      const preset = PHOTO_PRESETS[batchPhotoSize] || PHOTO_PRESETS['4x6'];
      const effectiveCuts = batchCutsOverride !== undefined ? batchCutsOverride : batchResult.suggested_imposition.cuts_per_sheet;
      const reqSheets = Math.ceil(batchResult.total_files / Math.max(1, effectiveCuts));
      const spoilSheets = Math.max(1, Math.ceil(reqSheets * 0.05));
      const totalSheets = reqSheets + spoilSheets;
      const summaryLao = `ຮູບ ${batchResult.total_files} ໃບ (${preset.label}, ${borderMode === 'BORDERLESS' ? 'ບໍ່ມີຂອບ Bleed 2mm' : 'ມີຂອບຂາວ'}) ຈັດວາງ ${effectiveCuts} ຮູບ/ແຜ່ນ A4 ➜ ໃຊ້ເຈ້ຍ A4 ທັງໝົດ ${reqSheets} ແຜ່ນ (ເຜື່ອເສຍ ${spoilSheets} = ລວມ ${totalSheets} ແຜ່ນ)`;

      const updatedImposition = {
        ...batchResult.suggested_imposition,
        cuts_per_sheet: effectiveCuts,
        required_sheets: reqSheets,
        spoilage_sheets: spoilSheets,
        total_sheets: totalSheets,
        summary_lao: summaryLao,
      };

      const exportPayload: PreflightResult = {
        file_name: `ພິມຮູບພາບ Photo Prints (ຊຸດ ${batchResult.total_files} ໃບ - ${preset.label})`,
        file_url: batchPreviews[0]?.url || (batchResult.files?.[0]?.file_url) || '',
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
        color_space: 'CMYK (Full Color)',
        color_mode: 'CMYK',
        has_rgb: false,
        is_standard_cmyk: true,
        status_badge_lao: `ຊຸດພິມຮູບພາບ ${batchResult.total_files} ໃບ (${borderMode === 'BORDERED' ? 'ມີຂອບ' : 'ບໍ່ມີຂອບ'})`,
        target_paper_size: preset.label,
        target_width_mm: preset.w,
        target_height_mm: preset.h,
        suggested_paper: selectedPaper?.name || 'Photo Glossy 230gsm',
        selected_paper_id: selectedPaper?.id,
        cuts_per_sheet_override: effectiveCuts,
        imposition_summary: summaryLao,
        dpi_estimate: 300,
        bleed_mm: borderMode === 'BORDERLESS' ? 2 : 0,
        has_sufficient_bleed: true,
        ...({
          is_batch_photo: true,
          border_mode: borderMode,
          batch_imposition: updatedImposition,
          batch_files: batchPreviews.length > 0 
            ? batchPreviews.map((p, idx) => ({
                name: p.name,
                url: p.url,
                size: p.size,
                mimeType: 'image/jpeg',
                ...(batchResult.files?.[idx] || {})
              }))
            : batchResult.files,
        } as any),
      };
      onConfirm(exportPayload);
      return;
    }

    // 3. Single File Mode Confirmation
    if (result) {
      const isColorTabActive = activeCoverageTab === 'color_pages' || customerPrintMode === 'COLOR';
      const passedC = customerPrintMode === 'MONO_ALL' ? 0 : (isColorTabActive ? rawColorC : combinedC);
      const passedM = customerPrintMode === 'MONO_ALL' ? 0 : (isColorTabActive ? rawColorM : combinedM);
      const passedY = customerPrintMode === 'MONO_ALL' ? 0 : (isColorTabActive ? rawColorY : combinedY);
      const passedK = customerPrintMode === 'MONO_ALL' 
        ? effectiveMonoK 
        : (isColorTabActive ? rawColorK : combinedK);

      const parentDims = getParentSheetDims();
      const autoCuts = calculateBestFitImposition(parentDims.w, parentDims.h, customWidth, customHeight);
      const effectiveCuts = singleCutsOverride !== undefined ? singleCutsOverride : autoCuts;
      const impSummary = `ເຈ້ຍແມ່ພິມ ${parentDims.name} ຕັດໄດ້ ${effectiveCuts} ຊິ້ນງານ (ຂະໜາດ ${customWidth}×${customHeight}mm)`;

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
        selected_paper_id: selectedPaper?.id,
        cuts_per_sheet_override: effectiveCuts,
        imposition_summary: impSummary,
      });
    }
  };

  const isReadyToConfirm = preflightMode === 'split'
    ? ((coverResult !== null || innerResult !== null) && !isCoverScanning && !isInnerScanning)
    : (preflightMode === 'batch' 
        ? (batchResult !== null && !isBatchAnalyzing) 
        : (result !== null && !isScanning));

  return (
    <>
      <FormModalTemplate
        isOpen={isOpen}
        onClose={onClose}
        icon={<Sparkles className="w-5 h-5 text-accent-sky" />}
        title="ກວດສອບໄຟລ໌ & ປະເມີນຄ່າສີ (Preflight Analyzer)"
        subtitle="ອັບໂຫລດໄຟລ໌ PDF, ແຍກປົກ-ເນື້ອໃນ ຫຼື ຊຸດໄຟລ໌ເພື່ອດຶງຈຳນວນໜ້າ, ແຍກສີ, ຄິດໄລ່ຄ່າສີ CMYK ແລະ ເບິ່ງຕົວຢ່າງອັດຕະໂນມັດ"
        maxWidthClass="max-w-6xl"
        badgeText={
          preflightMode === 'split'
            ? 'ແຍກປົກ & ເນື້ອໃນ'
            : (preflightMode === 'batch'
                ? (batchResult ? `ຊຸດໄຟລ໌ ${batchResult.total_files} ລາຍການ` : 'Multi-Asset')
                : (result ? `${totalPages} ໜ້າ (${result.color_space || 'CMYK'})` : 'AI Preflight'))
        }
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
                disabled={!isReadyToConfirm}
                onClick={handleConfirm}
                className={`w-full sm:w-auto px-6 py-2.5 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
                  isReadyToConfirm
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

          {/* Mode Switcher Tabs (3 Modes) */}
          <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <div className="grid grid-cols-3 gap-1.5 flex-1">
              <button
                type="button"
                onClick={() => setPreflightMode('single')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  preflightMode === 'single'
                    ? 'bg-white text-primary-navy shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate">{currentLang === 'lo' ? '1. ໄຟລ໌ດ່ຽວ / ປຶ້ມ' : '1. Single Doc'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPreflightMode('split')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  preflightMode === 'split'
                    ? 'bg-primary-navy text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-300" />
                <span className="truncate">{currentLang === 'lo' ? '2. ແຍກປົກ & ເນື້ອໃນ' : '2. Cover + Inner'}</span>
                {(coverFile || innerFile) && (
                  <span className="px-1.5 py-0.2 text-[9px] bg-amber-400 text-slate-900 rounded font-mono font-bold">
                    {(coverFile ? 1 : 0) + (innerFile ? 1 : 0)}/2
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPreflightMode('batch')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  preflightMode === 'batch'
                    ? 'bg-primary-navy text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Images className="w-3.5 h-3.5 text-sky-300" />
                <span className="truncate">{currentLang === 'lo' ? '3. ຊຸດໄຟລ໌ (1-100)' : '3. Multi-Asset'}</span>
                {batchFiles.length > 0 && (
                  <span className="px-1.5 py-0.2 text-[9px] bg-sky-400 text-slate-900 rounded font-mono font-bold">
                    {batchFiles.length}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Main Layout: Single Mode vs Batch Mode */}
          {preflightMode === 'single' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[520px]">
              
              {/* Left Column: Single File Settings */}
              <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                
                <div className="space-y-4">
                  {/* Step 1: Target Paper Size & Unit Switcher */}
                  <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-primary-navy" />
                        <span>1. ຂະໜາດເຈ້ຍທີ່ຈະພິມ (Target Size & Unit):</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-bold font-mono">
                        {Math.round(customWidth)} × {Math.round(customHeight)} mm
                      </span>
                    </div>

                    {/* Multi-unit & DB Presets Controller */}
                    <CustomDimensionInput
                      widthMM={customWidth}
                      heightMM={customHeight}
                      currentLang={currentLang}
                      onChangeMM={(wMM, hMM, presetName) => {
                        setTargetPaperSize(presetName || 'CUSTOM');
                        setCustomWidth(wMM);
                        setCustomHeight(hMM);
                        if (selectedFile) {
                          handleSingleFileProcess(selectedFile, presetName || 'CUSTOM', wMM, hMM);
                        }
                      }}
                    />

                    {/* Material Substrate Selector from Inventory */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-sky-600" />
                          <span>ເຈ້ຍແມ່ພິມໃນສາງ:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setPaperModalTarget('single');
                            setIsPaperModalOpen(true);
                          }}
                          className="text-[10px] font-black text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                        >
                          {selectedPaper ? 'ປ່ຽນເຈ້ຍ' : 'ເລືອກເຈ້ຍຈາກສາງ'}
                        </button>
                      </div>
                      {selectedPaper ? (() => {
                        const pDims = getParentSheetDims();
                        const autoCuts = calculateBestFitImposition(pDims.w, pDims.h, customWidth, customHeight);
                        const effectiveCuts = singleCutsOverride !== undefined ? singleCutsOverride : autoCuts;
                        return (
                          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 font-sans">
                            <div className="flex justify-between items-center">
                              <span className="font-black text-slate-900 truncate max-w-[180px]">{selectedPaper.name}</span>
                              <span className="text-[10px] font-bold text-slate-500 font-mono">
                                {pDims.w}×{pDims.h}mm
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-500">
                              <span>ຄັງເຫຼືອ: {Number(selectedPaper.stockQty || 0).toLocaleString()} ແຜ່ນ</span>
                              <span className="text-[10px] text-slate-400">Auto: {autoCuts} ຊິ້ນງານ</span>
                            </div>
                            <div className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80">
                              <span className="font-bold text-sky-900 text-xs flex items-center gap-1">
                                <Scissors className="w-3.5 h-3.5 text-sky-600" />
                                <span>1 ແຜ່ນແມ່ ຕັດໄດ້:</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSingleCutsOverride(Math.max(1, effectiveCuts - 1))}
                                  className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center text-xs cursor-pointer"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={effectiveCuts}
                                  onChange={(e) => {
                                    const v = Number(e.target.value);
                                    setSingleCutsOverride(v > 0 ? v : 1);
                                  }}
                                  className="w-8 text-center font-mono font-black text-xs text-primary-navy border-0 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => setSingleCutsOverride(effectiveCuts + 1)}
                                  className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center text-xs cursor-pointer"
                                >
                                  +
                                </button>
                                <span className="text-[10px] text-slate-500 font-bold">ຊິ້ນງານ</span>
                                {singleCutsOverride !== undefined && (
                                  <button
                                    type="button"
                                    onClick={() => setSingleCutsOverride(undefined)}
                                    className="text-[9px] text-rose-600 hover:underline font-bold ml-1 cursor-pointer"
                                  >
                                    (Auto)
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })() : (
                        <div className="p-2 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400 text-center">
                          ຍັງບໍ່ໄດ້ເລືອກເຈ້ຍ (ຄິດໄລ່ທຽບຖານ A4 210×297mm)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Single File Dropzone (Supports multiple drop to auto-switch) */}
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
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.tiff,.tif,.psd,.bmp,.gif"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          if (e.target.files.length > 1) {
                            handleBatchFilesSelected(e.target.files);
                          } else {
                            handleSingleFileProcess(e.target.files[0]);
                          }
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
                          PDF, PNG, JPG, WebP (ເລືອກຫຼາຍໄຟລ໌ໄດ້)
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
                          className="bg-primary-navy h-full transition-all duration-300 rounded-full"
                          style={{ width: `${progress.pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Print Mode Selector */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                  <span className="text-xs font-black text-slate-700 block">
                    2. ຮູບແບບການພິມທີ່ລູກຄ້າສັ່ງ (Print Mode):
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomerPrintMode('COLOR')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition border text-center cursor-pointer ${
                        customerPrintMode === 'COLOR'
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ພິມສີ CMYK (Color)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerPrintMode('MONO_ALL')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition border text-center cursor-pointer ${
                        customerPrintMode === 'MONO_ALL'
                          ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ຂາວດຳລ້ວນ (Mono K)
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column: Single File Diagnostics */}
              <div className="lg:col-span-7 space-y-4">
                {result ? (
                  <div className="space-y-4">
                    {/* Visual Preview Box */}
                    <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {previewUrl ? (
                          <img 
                            src={previewUrl} 
                            alt="Thumbnail" 
                            className="w-16 h-16 object-contain rounded-lg border border-slate-200 bg-slate-100 p-1"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                            <FileText className="w-8 h-8" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-black text-slate-900 truncate max-w-sm">
                            {result.file_name}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-bold">
                            {result.file_type} • {totalPages} ໜ້າ • DPI {result.dpi_estimate}
                          </span>
                        </div>
                      </div>

                      {previewUrl && (
                        <button
                          type="button"
                          onClick={() => setIsInspectorOpen(true)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> ເບິ່ງຮູບເຕັມ
                        </button>
                      )}
                    </div>

                    {/* Preflight Diagnostics Box */}
                    <div className="p-5 bg-gradient-to-br from-primary-navy to-slate-900 text-white rounded-3xl space-y-4 shadow-md">
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

                      {/* Coverage Tabs */}
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

                      {/* Coverage Details */}
                      <div className="p-3.5 bg-white/5 rounded-2xl space-y-2.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300">ຄ່າສີສະເລ່ຍ:</span>
                          <span className="font-mono text-emerald-300 font-bold">{grandTotalAverageInk}% Total CMYK</span>
                        </div>
                      <div className="grid grid-cols-4 gap-2 text-center font-mono font-bold text-xs">
                          <div className="bg-sky-500/20 border border-sky-500/30 text-sky-300 py-2 rounded-xl">C: {combinedC}%</div>
                          <div className="bg-pink-500/20 border border-pink-500/30 text-pink-300 py-2 rounded-xl">M: {combinedM}%</div>
                          <div className="bg-amber-500/20 border border-amber-500/30 text-amber-300 py-2 rounded-xl">Y: {combinedY}%</div>
                          <div className="bg-slate-700/60 border border-slate-600 text-slate-200 py-2 rounded-xl">K: {combinedK}%</div>
                        </div>
                      </div>

                      {/* Quality Badges */}
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
                ) : (
                  <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
                    <FileCheck2 className="w-12 h-12 text-slate-300 mb-3" />
                    <h4 className="text-sm font-bold text-slate-700">ຍັງບໍ່ທັນມີຂໍ້ມູນ Preflight</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      ກະລຸນາເລືອກໄຟລ໌ເພື່ອໃຫ້ລະບົບກວດສອບຄ່າສີ, ໜ້າ, ແລະ ໄລຍະຕັດຕົກອັດຕະໂນມັດ
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : preflightMode === 'split' ? (
            /* SPLIT COVER & CONTENT PREFLIGHT MODE */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-[520px]">
              
              {/* Box 1: Cover File (ໄຟລ໌ໜ້າປົກ) */}
              <div className="space-y-4 p-5 bg-amber-50/40 border-2 border-amber-200/90 rounded-3xl flex flex-col justify-between shadow-xs">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                        1
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">
                          {currentLang === 'lo' ? 'ໄຟລ໌ໜ້າປົກ (Cover File)' : 'Cover Artwork File'}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {currentLang === 'lo' ? 'ປົກໜ້າ-ຫຼັງ (PDF, AI, PSD, JPG, PNG)' : 'Front & Back Cover'}
                        </p>
                      </div>
                    </div>

                    {coverResult && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 text-xs font-bold font-mono">
                        {coverResult.total_pages || 4} ໜ້າປົກ
                      </span>
                    )}
                  </div>

                  {/* Cover Upload Dropzone */}
                  {!coverFile ? (
                    <div
                      onClick={() => document.getElementById('split-cover-input')?.click()}
                      className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-2xl p-8 text-center bg-white/80 hover:bg-white transition cursor-pointer space-y-2"
                    >
                      <input
                        id="split-cover-input"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff,.psd"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleCoverFileProcess(f);
                        }}
                      />
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <h5 className="text-xs font-black text-slate-800">
                        {currentLang === 'lo' ? 'ຄລິກເພື່ອອັບໂຫຼດໄຟລ໌ປົກ' : 'Upload Cover File'}
                      </h5>
                      <p className="text-[10px] text-slate-500">
                        ຮອງຮັບ PDF, JPG, PNG, PSD (ເຈ້ຍໜາ 260-300g, ເຄືອບເງົາ/ດ້ານ)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-amber-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {coverPreviewUrl ? (
                            <img src={coverPreviewUrl} alt="Cover" className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                              <FileText className="w-6 h-6" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-xs font-black text-slate-900 truncate block">
                              {coverFile.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {(coverFile.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setCoverFile(null);
                            setCoverPreviewUrl(null);
                            setCoverResult(null);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {isCoverScanning ? (
                        <div className="p-3 bg-amber-50 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-900">
                          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                          <span>ກຳລັງວິເຄາະຄ່າສີໜ້າປົກ...</span>
                        </div>
                      ) : coverResult && (
                        <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2">
                          <div className="flex justify-between text-[11px] font-bold text-amber-400">
                            <span>ຄ່າສີປົກ (Cover CMYK):</span>
                            <span>{coverResult.color_mode || 'CMYK'}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px] font-bold">
                            <div className="bg-sky-500/20 text-sky-300 py-1 rounded">C:{Math.round(coverResult.avg_cov_c)}%</div>
                            <div className="bg-pink-500/20 text-pink-300 py-1 rounded">M:{Math.round(coverResult.avg_cov_m)}%</div>
                            <div className="bg-amber-500/20 text-amber-300 py-1 rounded">Y:{Math.round(coverResult.avg_cov_y)}%</div>
                            <div className="bg-slate-700 text-slate-200 py-1 rounded">K:{Math.round(coverResult.avg_cov_k)}%</div>
                          </div>
                          <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-white/10">
                            <span>DPI: {coverResult.dpi_estimate || 300}</span>
                            <span>Bleed: {coverResult.bleed_mm || 3}mm</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Cover Paper Substrate Selector & Cutting Imposition */}
                <div className="bg-amber-100/60 p-3.5 rounded-2xl border border-amber-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-amber-950 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-700" />
                      <span>ເຈ້ຍປົກ (Cover Paper):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPaperModalTarget('cover');
                        setIsPaperModalOpen(true);
                      }}
                      className="text-[10px] font-black text-amber-800 bg-amber-200/70 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      {coverPaper ? 'ປ່ຽນເຈ້ຍປົກ' : 'ເລືອກເຈ້ຍປົກຈາກສາງ'}
                    </button>
                  </div>
                  {(() => {
                    const cDims = getItemSheetDims(coverPaper || selectedPaper);
                    const autoCuts = calculateBestFitImposition(cDims.w, cDims.h, (innerResult?.target_width_mm || 210) * 2, innerResult?.target_height_mm || 297);
                    const effectiveCuts = coverCutsOverride !== undefined ? coverCutsOverride : Math.max(1, autoCuts);
                    return (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-amber-900 truncate max-w-[170px]">
                            {coverPaper ? coverPaper.name : 'Art Card 260g - 300g (ມາດຕະຖານ)'}
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 font-mono">
                            {cDims.w}×{cDims.h}mm
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-white/90 px-2 py-1.5 rounded-xl border border-amber-200">
                          <span className="font-bold text-amber-950 text-xs flex items-center gap-1">
                            <Scissors className="w-3.5 h-3.5 text-amber-600" />
                            <span>1 ແຜ່ນແມ່ ຕັດໄດ້:</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setCoverCutsOverride(Math.max(1, effectiveCuts - 1))}
                              className="w-5 h-5 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 font-black flex items-center justify-center text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={effectiveCuts}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                setCoverCutsOverride(v > 0 ? v : 1);
                              }}
                              className="w-8 text-center font-mono font-black text-xs text-amber-900 border-0 focus:outline-none bg-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => setCoverCutsOverride(effectiveCuts + 1)}
                              className="w-5 h-5 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 font-black flex items-center justify-center text-xs cursor-pointer"
                            >
                              +
                            </button>
                            <span className="text-[10px] text-amber-800 font-bold">ປົກ/ແຜ່ນ</span>
                            {coverCutsOverride !== undefined && (
                              <button
                                type="button"
                                onClick={() => setCoverCutsOverride(undefined)}
                                className="text-[9px] text-rose-600 hover:underline font-bold ml-1 cursor-pointer"
                              >
                                (Auto)
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Box 2: Inner Pages Content (ໄຟລ໌ເນື້ອໃນ) */}
              <div className="space-y-4 p-5 bg-sky-50/40 border-2 border-sky-200/90 rounded-3xl flex flex-col justify-between shadow-xs">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-sky-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                        2
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">
                          {currentLang === 'lo' ? 'ໄຟລ໌ເນື້ອໃນ (Inner Content File)' : 'Inner Pages Content'}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {currentLang === 'lo' ? 'ເນື້ອໃນທັງໝົດ (PDF ຫຼາຍໜ້າ ຫຼື ຊຸດໜ້າ)' : 'Multiple Pages Document'}
                        </p>
                      </div>
                    </div>

                    {innerResult && (
                      <span className="px-2.5 py-1 rounded-lg bg-sky-200 text-sky-900 text-xs font-bold font-mono">
                        {innerResult.total_pages} ໜ້າເນື້ອໃນ
                      </span>
                    )}
                  </div>

                  {/* Inner Content Upload Dropzone */}
                  {!innerFile ? (
                    <div
                      onClick={() => document.getElementById('split-inner-input')?.click()}
                      className="border-2 border-dashed border-sky-300 hover:border-sky-500 rounded-2xl p-8 text-center bg-white/80 hover:bg-white transition cursor-pointer space-y-2"
                    >
                      <input
                        id="split-inner-input"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleInnerFileProcess(f);
                        }}
                      />
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center shadow-xs">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <h5 className="text-xs font-black text-slate-800">
                        {currentLang === 'lo' ? 'ຄລິກເພື່ອອັບໂຫຼດໄຟລ໌ເນື້ອໃນ' : 'Upload Inner Pages File'}
                      </h5>
                      <p className="text-[10px] text-slate-500">
                        ຮອງຮັບ PDF ຫຼາຍໜ້າ (1-500+ ໜ້າ, ລະບົບຈະແຍກໜ້າສີ ແລະ ຂາວດຳ)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-sky-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {innerPreviewUrl ? (
                            <img src={innerPreviewUrl} alt="Inner" className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
                              <FileText className="w-6 h-6" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-xs font-black text-slate-900 truncate block">
                              {innerFile.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {(innerFile.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setInnerFile(null);
                            setInnerPreviewUrl(null);
                            setInnerResult(null);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {isInnerScanning ? (
                        <div className="p-3 bg-sky-50 rounded-xl flex items-center gap-2 text-xs font-bold text-sky-900">
                          <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                          <span>ກຳລັງວິເຄາະຄ່າສີ & ໜ້າເນື້ອໃນ...</span>
                        </div>
                      ) : innerResult && (
                        <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2">
                          <div className="flex justify-between text-[11px] font-bold text-sky-400">
                            <span>ຄ່າສີເນື້ອໃນ ({innerResult.total_pages} ໜ້າ):</span>
                            <span>{innerResult.color_mode || 'CMYK'}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px] font-bold">
                            <div className="bg-sky-500/20 text-sky-300 py-1 rounded">C:{Math.round(innerResult.avg_cov_c)}%</div>
                            <div className="bg-pink-500/20 text-pink-300 py-1 rounded">M:{Math.round(innerResult.avg_cov_m)}%</div>
                            <div className="bg-amber-500/20 text-amber-300 py-1 rounded">Y:{Math.round(innerResult.avg_cov_y)}%</div>
                            <div className="bg-slate-700 text-slate-200 py-1 rounded">K:{Math.round(innerResult.avg_cov_k)}%</div>
                          </div>
                          <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-white/10">
                            <span>ໜ້າສີ: {innerResult.color_pages_count || 0}</span>
                            <span>ໜ້າຂາວດຳ: {innerResult.mono_pages_count || 0}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Inner Paper Substrate Selector & Cutting Imposition */}
                <div className="bg-sky-100/60 p-3.5 rounded-2xl border border-sky-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sky-950 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-sky-700" />
                      <span>ເຈ້ຍເນື້ອໃນ (Inner Paper):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPaperModalTarget('inner');
                        setIsPaperModalOpen(true);
                      }}
                      className="text-[10px] font-black text-sky-800 bg-sky-200/70 hover:bg-sky-200 border border-sky-300 px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      {innerPaper ? 'ປ່ຽນເຈ້ຍເນື້ອໃນ' : 'ເລືອກເຈ້ຍເນື້ອໃນຈາກສາງ'}
                    </button>
                  </div>
                  {(() => {
                    const iDims = getItemSheetDims(innerPaper || selectedPaper);
                    const autoCuts = calculateBestFitImposition(iDims.w, iDims.h, innerResult?.target_width_mm || 210, innerResult?.target_height_mm || 297);
                    const effectiveCuts = innerCutsOverride !== undefined ? innerCutsOverride : autoCuts;
                    return (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-sky-900 truncate max-w-[170px]">
                            {innerPaper ? innerPaper.name : 'Woodfree 70g - 80g (ມາດຕະຖານ)'}
                          </span>
                          <span className="text-[10px] font-bold text-sky-700 font-mono">
                            {iDims.w}×{iDims.h}mm
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-white/90 px-2 py-1.5 rounded-xl border border-sky-200">
                          <span className="font-bold text-sky-950 text-xs flex items-center gap-1">
                            <Scissors className="w-3.5 h-3.5 text-sky-600" />
                            <span>1 ແຜ່ນແມ່ ຕັດໄດ້:</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setInnerCutsOverride(Math.max(1, effectiveCuts - 1))}
                              className="w-5 h-5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 font-black flex items-center justify-center text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={effectiveCuts}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                setInnerCutsOverride(v > 0 ? v : 1);
                              }}
                              className="w-8 text-center font-mono font-black text-xs text-sky-900 border-0 focus:outline-none bg-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => setInnerCutsOverride(effectiveCuts + 1)}
                              className="w-5 h-5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 font-black flex items-center justify-center text-xs cursor-pointer"
                            >
                              +
                            </button>
                            <span className="text-[10px] text-sky-800 font-bold">ໜ້າ/ແຜ່ນ</span>
                            {innerCutsOverride !== undefined && (
                              <button
                                type="button"
                                onClick={() => setInnerCutsOverride(undefined)}
                                className="text-[9px] text-rose-600 hover:underline font-bold ml-1 cursor-pointer"
                              >
                                (Auto)
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

            </div>
          ) : (
            /* MULTI-ASSET / BATCH PREFLIGHT MODE (1-100 Files) */
            <div className="space-y-4 min-h-[520px]">
              
              {/* Batch Settings Bar */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                        1. ຂະໜາດງານພິມ & ໜ່ວຍວັດແທກ (Photo Size & Unit):
                      </span>
                      <span className="text-xs font-black text-slate-800 mt-0.5 block">
                        ກຳນົດຂະໜາດພິມ (ນິ້ວ / ຊມ / ມມ) ແລະ ດຶງເຈ້ຍແມ່ພິມຈາກສາງ
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPaperModalOpen(true)}
                        className="text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{selectedPaper ? `ເຈ້ຍ: ${selectedPaper.name}` : 'ເລືອກເຈ້ຍແມ່ພິມຈາກສາງ'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Multi-unit & DB Presets Controller */}
                  <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80">
                    <CustomDimensionInput
                      widthMM={batchCustomW}
                      heightMM={batchCustomH}
                      currentLang={currentLang}
                      onChangeMM={(wMM, hMM, presetName) => {
                        setBatchCustomW(wMM);
                        setBatchCustomH(hMM);
                        if (batchFiles.length > 0) {
                          runBatchPreflightAnalysis(batchFiles, presetName || `${Math.round(wMM)}x${Math.round(hMM)}mm`, borderMode);
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-600">2. ຮູບແບບຂອບ:</span>
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setBorderMode('BORDERED');
                          if (batchFiles.length > 0) runBatchPreflightAnalysis(batchFiles, batchPhotoSize, 'BORDERED');
                        }}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                          borderMode === 'BORDERED' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600'
                        }`}
                      >
                        ມີຂອບຂາວ (Bordered)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBorderMode('BORDERLESS');
                          if (batchFiles.length > 0) runBatchPreflightAnalysis(batchFiles, batchPhotoSize, 'BORDERLESS');
                        }}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                          borderMode === 'BORDERLESS' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600'
                        }`}
                      >
                        ບໍ່ມີຂອບ (Borderless)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-xs font-bold rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                      ສູງສຸດ 100 ຮູບ/ລາຍການ
                    </span>
                    {batchFiles.length > 0 && (
                      <span className="px-3 py-1 text-xs font-black rounded-xl bg-sky-50 text-sky-800 border border-sky-200 font-mono">
                        ເລືອກແລ້ວ {batchFiles.length} ຮູບ
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Batch Upload Dropzone & Previews */}
              {batchFiles.length === 0 ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('preflight-batch-modal-input')?.click()}
                  className={`border-2 border-dashed rounded-3xl p-10 text-center transition cursor-pointer ${
                    isDragOver ? 'border-accent-sky bg-accent-sky/5 scale-[1.01]' : 'border-slate-300 hover:border-accent-sky/70 hover:bg-slate-50'
                  }`}
                >
                  <input
                    id="preflight-batch-modal-input"
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.webp,.tiff,.tif"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleBatchFilesSelected(e.target.files);
                    }}
                  />
                  <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-primary-navy/10 text-primary-navy flex items-center justify-center shadow-xs">
                      <Images className="w-7 h-7 text-accent-sky" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        ຄລິກເລືອກຮູບພາບຫຼາຍໄຟລ໌ ຫຼື ລາກມາວາງ (ສູງສຸດ 100 ຮູບ)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        ຮອງຮັບ JPG, PNG, WebP (ລະບົບຈະຄິດໄລ່ຄ່າສີສະເລ່ຍ CMYK ແລະ ແຜ່ນເຈ້ຍ A4 ອັດຕະໂນມັດ)
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Action bar for chosen batch files */}
                  <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">
                        ຮູບພາບທີ່ເລືອກ ({batchFiles.length} ຮູບ):
                      </span>
                      {isBatchAnalyzing && (
                        <span className="flex items-center gap-1.5 text-xs text-primary-navy font-bold">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>ກຳລັງວິເຄາະ {batchProgress.current}/{batchProgress.total} ({batchProgress.pct}%)...</span>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBatchFiles([]);
                        setBatchPreviews([]);
                        setBatchResult(null);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> ລ້າງຮູບທັງໝົດ
                    </button>
                  </div>

                  {/* Photo Thumbnails Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 max-h-48 overflow-y-auto p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    {batchPreviews.map((p, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-square shadow-xs">
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-white rounded text-[9px] font-mono">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Batch Preflight Summary Card */}
                  {batchResult && (() => {
                    const preset = PHOTO_PRESETS[batchPhotoSize] || PHOTO_PRESETS['4x6'];
                    const effectiveCuts = batchCutsOverride !== undefined ? batchCutsOverride : batchResult.suggested_imposition.cuts_per_sheet;
                    const reqSheets = Math.ceil(batchResult.total_files / Math.max(1, effectiveCuts));
                    const spoilSheets = Math.max(1, Math.ceil(reqSheets * 0.05));
                    const totalSheets = reqSheets + spoilSheets;
                    const summaryLao = `ຮູບ ${batchResult.total_files} ໃບ (${preset.label}, ${borderMode === 'BORDERLESS' ? 'ບໍ່ມີຂອບ Bleed 2mm' : 'ມີຂອບຂາວ'}) ຈັດວາງ ${effectiveCuts} ຮູບ/ແຜ່ນ A4 ➜ ໃຊ້ເຈ້ຍ A4 ທັງໝົດ ${reqSheets} ແຜ່ນ (ເຜື່ອເສຍ ${spoilSheets} = ລວມ ${totalSheets} ແຜ່ນ)`;

                    return (
                      <div className="p-5 bg-gradient-to-br from-primary-navy to-slate-900 text-white rounded-3xl space-y-4 shadow-md">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <div className="flex items-center gap-2">
                            <Palette className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold">
                              ຜົນວິເຄາະຄ່າສີສະເລ່ຍ CMYK & ແຜນການຕັດ (Batch Analysis)
                            </span>
                          </div>
                          <span className="text-xs font-black px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg font-mono">
                            {batchResult.total_files} ຮູບພາບ
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-center font-mono font-bold text-xs">
                          <div className="bg-sky-500/20 border border-sky-500/30 text-sky-300 py-2.5 rounded-xl">C: {batchResult.avg_cov_c}%</div>
                          <div className="bg-pink-500/20 border border-pink-500/30 text-pink-300 py-2.5 rounded-xl">M: {batchResult.avg_cov_m}%</div>
                          <div className="bg-amber-500/20 border border-amber-500/30 text-amber-300 py-2.5 rounded-xl">Y: {batchResult.avg_cov_y}%</div>
                          <div className="bg-slate-700/60 border border-slate-600 text-slate-200 py-2.5 rounded-xl">K: {batchResult.avg_cov_k}%</div>
                        </div>

                        {/* Interactive Cuts-per-sheet Stepper */}
                        <div className="p-3 bg-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <Scissors className="w-4 h-4 text-amber-300 shrink-0" />
                            <span className="font-bold text-slate-200">ຈັດວາງຕໍ່ແຜ່ນ A4:</span>
                            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-xl border border-white/20">
                              <button
                                type="button"
                                onClick={() => setBatchCutsOverride(Math.max(1, effectiveCuts - 1))}
                                className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white font-black flex items-center justify-center text-xs cursor-pointer"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                max="50"
                                value={effectiveCuts}
                                onChange={(e) => {
                                  const v = Number(e.target.value);
                                  setBatchCutsOverride(v > 0 ? v : 1);
                                }}
                                className="w-8 text-center font-mono font-black text-xs text-amber-300 border-0 bg-transparent focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => setBatchCutsOverride(effectiveCuts + 1)}
                                className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white font-black flex items-center justify-center text-xs cursor-pointer"
                              >
                                +
                              </button>
                              <span className="text-[10px] text-slate-400">ຮູບ/ແຜ່ນ</span>
                            </div>
                            {batchCutsOverride !== undefined && (
                              <button
                                type="button"
                                onClick={() => setBatchCutsOverride(undefined)}
                                className="text-[10px] text-amber-300 hover:underline font-bold"
                              >
                                (ຄືນຄ່າ Auto)
                              </button>
                            )}
                          </div>

                          <div className="font-mono text-emerald-300 font-black">
                            ໃຊ້ເຈ້ຍ A4: {reqSheets} + ເສຍ {spoilSheets} = {totalSheets} ແຜ່ນ
                          </div>
                        </div>

                        {/* Imposition Plan Note */}
                        <div className="p-2.5 bg-black/20 rounded-xl text-[11px] text-slate-300">
                          {summaryLao}
                        </div>
                      </div>
                    );
                  })()}

                </div>
              )}

            </div>
          )}

        </div>
      </FormModalTemplate>

      {/* Inspector / Lightbox Modal for Full View */}
      {isInspectorOpen && previewUrl && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setIsInspectorOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={previewUrl} 
              alt="Full Preview" 
              className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl object-contain border border-white/20"
            />
            <button
              type="button"
              onClick={() => setIsInspectorOpen(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-black shadow-lg hover:bg-rose-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Paper Material Selector Modal from Inventory */}
      <PaperMaterialSelectorModal
        isOpen={isPaperModalOpen}
        onClose={() => setIsPaperModalOpen(false)}
        papers={papers}
        selectedPaperId={
          paperModalTarget === 'cover' 
            ? coverPaper?.id 
            : paperModalTarget === 'inner' 
              ? innerPaper?.id 
              : selectedPaper?.id
        }
        defaultPaperId={defaultPaperId}
        onSetDefault={handleSetDefaultPaper}
        formatCurrency={formatCurrency || ((n: number) => `${n.toLocaleString()} ₭`)}
        onSelect={(paperId, paperItem) => {
          const targetItem = paperItem || papers.find(p => p.id === paperId) || null;
          if (paperModalTarget === 'cover') {
            setCoverPaper(targetItem);
          } else if (paperModalTarget === 'inner') {
            setInnerPaper(targetItem);
          } else {
            setSelectedPaper(targetItem);
          }
        }}
      />
    </>
  );
};
