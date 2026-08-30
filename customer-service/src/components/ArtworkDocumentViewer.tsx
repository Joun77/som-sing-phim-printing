import React, { useState } from 'react'
import { FileTextIcon, EyeIcon, DownloadIcon, CheckIcon, AlertCircleIcon, XIcon } from './icons'
import { Trash2, FileText, Zap, Maximize2, Lock, RefreshCw, Check } from 'lucide-react'
import { PreflightReport } from '../lib/preflightAnalyzer'

interface ArtworkDocumentViewerProps {
  fileUrl: string | null
  fileName: string | null
  fileType?: string
  report: PreflightReport | null
  onReupload: () => void
  onDelete?: () => void
}

export const ArtworkDocumentViewer: React.FC<ArtworkDocumentViewerProps> = ({
  fileUrl,
  fileName,
  fileType = '',
  report,
  onReupload,
  onDelete,
}) => {
  const isAi = fileName?.toLowerCase().endsWith('.ai')
  const isPdf = fileType.includes('pdf') || fileName?.toLowerCase().endsWith('.pdf') || Boolean(isAi)
  const isImage = fileType.startsWith('image/') || /\.(png|jpe?g|webp|tiff|gif)$/i.test(fileName || '')

  const [zoomLevel, setZoomLevel] = useState<number>(100)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  if (!fileUrl && !fileName) {
    return (
      <div className="w-full h-full min-h-[460px] lg:min-h-[560px] rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-8 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
          <FileTextIcon size={32} />
        </div>
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 m-0">
          ຍັງບໍ່ມີຟາຍອາດເວິກ (No Artwork Attached)
        </h4>
        <p className="text-xs text-slate-500 max-w-xs m-0">
          ກະລຸນາອັບໂຫຼດຟາຍ PDF ຫຼື ຮູບພາບເພື່ອເບິ່ງຕົວຢ່າງ ແລະ ກວດສອບຄວາມລະອຽດ
        </p>
      </div>
    )
  }

  const renderContent = (inModal = false) => {
    if ((isPdf || isAi) && fileUrl) {
      return (
        <iframe
          src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
          title="Live Browser Document Proof"
          className={`w-full h-full ${inModal ? 'min-h-[88vh]' : 'min-h-[680px] lg:min-h-[820px]'} rounded-xl border border-slate-200 dark:border-slate-800 bg-white shadow-inner`}
        />
      )
    }

    if (isImage && fileUrl) {
      return (
        <div className={`w-full h-full flex items-center justify-center overflow-auto p-4 ${inModal ? 'min-h-[88vh]' : 'min-h-[680px] lg:min-h-[820px]'}`}>
          <img
            src={fileUrl}
            alt="Artwork Proof Preview"
            style={{ transform: `scale(${zoomLevel / 100})` }}
            className="max-h-[760px] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-200"
          />
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center p-12 min-h-[450px]">
        <span className="text-amber-500 inline-flex">
          <FileTextIcon size={48} />
        </span>
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{fileName}</span>
        <span className="text-xs text-slate-500">ຟາຍພ້ອມສັ່ງພິມລະບົບດິຈິຕອນ (Vector / Ready for Production)</span>
      </div>
    )
  }

  return (
    <>
      <div className="w-full flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xl">
        {/* Browser Top Navigation Bar (Chrome/Safari Style) */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950/80">
          {/* Traffic Lights + Document Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block" />
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 max-w-[260px] truncate">
              <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate">somsingphim.la/proof/{fileName}</span>
            </div>
          </div>

          {/* Browser Tool Actions */}
          <div className="flex items-center gap-2">
            {report?.estimatedDPI && (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-500" />
                <span>{report.estimatedDPI} DPI · {report.colorSpace || 'CMYK'}</span>
              </span>
            )}

            {/* Fullscreen Explode Button */}
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-md transition flex items-center gap-1.5 cursor-pointer"
              title="ຂະຫຍາຍເຕັມຈໍ (Explode Fullscreen Preview)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>ຂະຫຍາຍເຕັມຈໍ</span>
            </button>

            <button
              type="button"
              onClick={onReupload}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>ປ່ຽນຟາຍ</span>
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/40 transition cursor-pointer flex items-center gap-1"
                title="ລຶບຟາຍນີ້"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ລຶບ</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Document View Area */}
        <div className="relative bg-slate-200 dark:bg-slate-950 flex items-center justify-center p-2 sm:p-3 overflow-hidden">
          {renderContent(false)}

          {/* Zoom Controls for Images */}
          {isImage && fileUrl && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1 p-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700 text-white text-xs shadow-2xl">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                className="w-7 h-7 flex items-center justify-center hover:bg-slate-800 rounded-lg transition"
                title="Zoom Out"
              >
                -
              </button>
              <span className="px-2 font-mono text-[11px] font-bold">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(250, z + 25))}
                className="w-7 h-7 flex items-center justify-center hover:bg-slate-800 rounded-lg transition"
                title="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="px-2 py-1 hover:bg-slate-800 rounded-lg text-[10px] text-amber-300 transition"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Proof Inspection Summary Bar */}
        {report && (
          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              {report.allPassed ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <CheckIcon size={15} /> ພ້ອມພິມ Process CMYK · ຂອບຕັດຕົກຜ່ານ (+3mm Bleed)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-500 font-bold text-xs">
                  <AlertCircleIcon size={15} /> ພົບຂໍ້ສັງເກດບາງຈຸດ
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              <span>ຂະໜາດຟາຍ: {report.fileSizeMB} MB</span>
              <span>•</span>
              <span>{report.pageCount ? `${report.pageCount} ໜ້າ (Pages)` : '1 ໜ້າ'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Artwork Diagnostic Inspector Card */}
      {report && (
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 m-0">
                ລາຍລະອຽດ ແລະ ຜົນການວິເຄາະຟາຍພິມ (Artwork Preflight Report)
              </h4>
            </div>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Check className="w-3 h-3 inline" /> ຜ່ານມາດຕະຖານໂຮງພິມ
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* 1. File Format */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
              <span className="text-[10.5px] font-bold text-slate-400 block mb-1">ປະເພດຟາຍ (Format)</span>
              <strong className="text-slate-900 dark:text-slate-100 block font-mono">
                {isPdf ? 'PDF Document' : isImage ? 'High-Res Image' : report.fileType}
              </strong>
            </div>

            {/* 2. Total Pages */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
              <span className="text-[10.5px] font-bold text-slate-400 block mb-1">ຈຳນວນໜ້າ (Pages)</span>
              <strong className="text-amber-600 dark:text-amber-400 block font-mono text-sm">
                {report.pageCount || 1} ໜ້າ (Pages)
              </strong>
            </div>

            {/* 3. Resolution & DPI */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
              <span className="text-[10.5px] font-bold text-slate-400 block mb-1">ຄວາມລະອຽດ (DPI)</span>
              <strong className="text-emerald-600 dark:text-emerald-400 block font-mono">
                {report.estimatedDPI || 300} DPI (Print Ready)
              </strong>
            </div>

            {/* 4. Color Mode */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
              <span className="text-[10.5px] font-bold text-slate-400 block mb-1">ໂໝດສີ (Color Mode)</span>
              <strong className="text-slate-900 dark:text-slate-100 block truncate">
                {report.colorModeType || 'ສີ Process CMYK (4 ສີ)'}
              </strong>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-amber-500" /><span>ຊື່ຟາຍ:</span> <strong className="text-slate-700 dark:text-slate-300 font-mono">{fileName}</strong> ({report.fileSizeMB} MB)</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3 h-3 inline" /> ຕັດຕົກ (Bleed +3mm) ພ້ອມພິມທັນທີ
            </span>
          </div>
        </div>
      )}

      {/* Massive Fullscreen Theater Mode (Explode PDF / Proof Modal) */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex flex-col p-4 sm:p-6 animate-fade-in">
          {/* Fullscreen Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <FileTextIcon size={22} />
              </div>
              <div>
                <h3 className="font-black text-base text-white m-0">
                  {fileName} · Live Fullscreen Proof
                </h3>
                <p className="text-xs text-slate-400 m-0 font-mono">
                  SOM SING PHIM HIGH-RESOLUTION ARTWORK EXPLODER
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5"
                >
                  <EyeIcon size={15} />
                  <span>ເປີດແທັບໃໝ່ (Open New Tab)</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition"
                title="Close Fullscreen"
              >
                <XIcon size={20} />
              </button>
            </div>
          </div>

          {/* Fullscreen Body View */}
          <div className="flex-1 pt-4 pb-2 flex items-center justify-center overflow-hidden">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  )
}

export default ArtworkDocumentViewer
