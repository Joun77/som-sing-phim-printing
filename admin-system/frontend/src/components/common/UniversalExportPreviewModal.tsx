import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Printer, 
  Copy, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Eye, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { toPng, toJpeg, toBlob } from 'html-to-image';
import jsPDF from 'jspdf';

export interface UniversalExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  documentNumber?: string;
  defaultFileName?: string;
  children: React.ReactNode;
  paperOrientation?: 'portrait' | 'landscape';
}

export const UniversalExportPreviewModal: React.FC<UniversalExportPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  documentNumber = 'DOC-001',
  defaultFileName = 'document',
  children,
  paperOrientation = 'portrait'
}) => {
  const [zoomScale, setZoomScale] = useState<number>(0.9);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportType, setExportType] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const documentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const fileNameSanitized = `${defaultFileName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${documentNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  // 1. Export as PNG Image
  const handleExportPNG = async () => {
    if (!documentRef.current) return;
    setIsExporting(true);
    setExportType('PNG');
    try {
      const dataUrl = await toPng(documentRef.current, {
        quality: 1.0,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `${fileNameSanitized}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsExporting(false);
      setExportType('');
    }
  };

  // 2. Export as JPEG Image
  const handleExportJPEG = async () => {
    if (!documentRef.current) return;
    setIsExporting(true);
    setExportType('JPEG');
    try {
      const dataUrl = await toJpeg(documentRef.current, {
        quality: 0.95,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `${fileNameSanitized}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export JPEG:', err);
    } finally {
      setIsExporting(false);
      setExportType('');
    }
  };

  // 3. Export as PDF
  const handleExportPDF = async () => {
    if (!documentRef.current) return;
    setIsExporting(true);
    setExportType('PDF');
    try {
      const dataUrl = await toPng(documentRef.current, {
        pixelRatio: 2.5,
        backgroundColor: '#ffffff'
      });

      const isLandscape = paperOrientation === 'landscape';
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = isLandscape ? 297 : 210;
      const pageHeight = isLandscape ? 210 : 297;

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidth, Math.min(pdfHeight, pageHeight));
      pdf.save(`${fileNameSanitized}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
      setExportType('');
    }
  };

  // 4. Copy Image to Clipboard (Instant Share)
  const handleCopyToClipboard = async () => {
    if (!documentRef.current) return;
    setIsExporting(true);
    setExportType('COPY');
    try {
      const blob = await toBlob(documentRef.current, {
        pixelRatio: 2.0,
        backgroundColor: '#ffffff'
      });
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.error('Failed to copy image to clipboard:', err);
    } finally {
      setIsExporting(false);
      setExportType('');
    }
  };

  // 5. Direct Print
  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
                <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {documentNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">ສະແດງຕົວຢ່າງ ແລະ ສົ່ງອອກເອກະສານຄວາມລະອຽດສູງ (High-DPI Export)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setZoomScale(prev => Math.max(0.4, Number((prev - 0.1).toFixed(1))))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-300 px-2 min-w-[50px] text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale(prev => Math.min(1.6, Number((prev + 0.1).toFixed(1))))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomScale(0.9)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            
            {/* Copy to Clipboard */}
            <button
              onClick={handleCopyToClipboard}
              disabled={isExporting}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'ກັອບປີ້ຮູບແລ້ວ!' : 'ກັອບປີ້ຮູບ (Clipboard)'}</span>
            </button>

            {/* PNG Image Export */}
            <button
              onClick={handleExportPNG}
              disabled={isExporting}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isExporting && exportType === 'PNG' ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <ImageIcon className="w-4 h-4 text-emerald-400" />
              )}
              <span>ດາວໂຫຼດຮູບ PNG</span>
            </button>

            {/* JPEG Image Export */}
            <button
              onClick={handleExportJPEG}
              disabled={isExporting}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isExporting && exportType === 'JPEG' ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              ) : (
                <ImageIcon className="w-4 h-4 text-amber-400" />
              )}
              <span>ດາວໂຫຼດຮູບ JPEG</span>
            </button>

            {/* PDF Export */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl transition-all shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
            >
              {isExporting && exportType === 'PDF' ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <FileText className="w-4 h-4 text-white" />
              )}
              <span>ດາວໂຫຼດ PDF</span>
            </button>

            {/* Print Direct */}
            <button
              onClick={handlePrint}
              disabled={isExporting}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors active:scale-95"
              title="ສັ່ງພິມທັນທີ (Print)"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Document Preview Canvas Area */}
        <div className="flex-1 overflow-auto bg-slate-950/90 p-4 sm:p-8 flex justify-center items-start custom-scrollbar">
          <div 
            style={{ 
              transform: `scale(${zoomScale})`, 
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out'
            }}
            className="shrink-0 my-2"
          >
            {/* The Document Surface */}
            <div 
              ref={documentRef}
              className="bg-white text-slate-900 shadow-2xl rounded-sm overflow-hidden border border-slate-300"
              style={{
                width: paperOrientation === 'landscape' ? '297mm' : '210mm',
                minHeight: paperOrientation === 'landscape' ? '210mm' : '297mm',
                boxSizing: 'border-box'
              }}
            >
              {children}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ຄຸນນະພາບການ Export: 300 DPI Ultra Clear Rendering</span>
          </div>
          <div>
            <span>ຮອງຮັບການສົ່ງຕໍ່ WhatsApp / Messenger / WeChat</span>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
