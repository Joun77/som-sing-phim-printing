import React from 'react'
import { PreflightReport } from '../lib/preflightAnalyzer'
import { CheckIcon, AlertCircleIcon, XIcon, ArrowRightIcon, FileTextIcon, DownloadIcon, SparkleIcon, ShieldIcon, PrinterIcon } from './icons'

export interface PreflightChecklistModalProps {
  report: PreflightReport
  previewUrl?: string | null
  productName?: string
  specLabels?: { size: string; paper: string; finishing: string }
  quantity?: number
  priceTotal?: number
  currency?: any
  formatMoney?: (amount: number, currency: any) => string
  formatMultiCurrency?: (amountTHB: number) => string
  onConfirm: () => void
  onCancel: () => void
}

export const PreflightChecklistModal: React.FC<PreflightChecklistModalProps> = ({
  report,
  previewUrl,
  productName,
  specLabels,
  quantity = 1,
  priceTotal = 0,
  currency,
  formatMoney,
  formatMultiCurrency,
  onConfirm,
  onCancel,
}) => {
  const isImage = report.fileType?.startsWith('image/') || previewUrl?.startsWith('data:image') || previewUrl?.startsWith('blob:')
  const quotationNo = `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  const currentDate = new Date().toLocaleDateString('lo-LA', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="rounded-3xl p-6 sm:p-8 max-w-5xl w-full shadow-2xl border border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 animate-fade-in space-y-6 max-h-[94vh] overflow-y-auto">
        
        {/* Header - Instant Quotation & Proof Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-amber-500/40 bg-gradient-to-br from-amber-500/20 via-slate-900 to-blue-950 text-amber-400 shadow-md">
              <FileTextIcon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-black text-lg sm:text-xl text-slate-100 m-0">
                  ໃບສະເໜີລາຄາ & ກວດສອບຟາຍພິມ (Quotation & Preflight Proof)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono">
                  {quotationNo}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 m-0 mt-0.5 flex items-center gap-2">
                <span>SOM SING PHIM (ສົມສິ່ງພິມ) · DIGITAL & OFFSET PRESS</span>
                <span>•</span>
                <span>{currentDate}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors flex items-center justify-center border border-slate-700 cursor-pointer"
            aria-label="Close"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* 2-Column Spacious Grid: Artwork Proof Left (50%) + Quotation Details Right (50%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Visual Artwork Inspection & Preflight Specs (6 of 12 cols) */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 flex flex-col justify-between shadow-inner">
            <div>
              <div className="flex items-center justify-between text-xs font-black mb-3">
                <span className="text-amber-400 flex items-center gap-1.5">
                  <SparkleIcon size={14} /> ຕົວຢ່າງຟາຍພິມຕົວຈິງ (Artwork Inspection)
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-bold">
                  {report.estimatedDPI || 300} DPI • Ultra-HD
                </span>
              </div>

              {/* Artwork Box */}
              <div className="w-full min-h-[220px] max-h-[280px] rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center p-3 overflow-hidden relative group">
                {isImage && previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Artwork Preview"
                    className="max-h-[240px] max-w-full object-contain rounded-lg shadow-lg border border-white/5"
                  />
                ) : (
                  <div className="py-8 flex flex-col items-center gap-2 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-md">
                      <FileTextIcon size={28} />
                    </div>
                    <span className="text-sm font-black text-slate-200 truncate max-w-[240px]">
                      {report.fileName || 'document.pdf'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {report.fileSizeMB} MB • PDF Print Ready
                    </span>
                  </div>
                )}

                {/* CMYK Corner Marks */}
                <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-600">⊕ REG 0.05mm</div>
                <div className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-600">CMYK 100%</div>
              </div>

              {/* File Technical Metadata */}
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-[10.5px] text-slate-400 block">ຊື່ຟາຍ (File Name):</span>
                  <strong className="text-slate-200 truncate block font-mono text-xs">{report.fileName || 'Artwork'}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-[10.5px] text-slate-400 block">ຂະໜາດ & ຄວາມລະອຽດ:</span>
                  <strong className="text-slate-200 block font-mono text-xs">
                    {report.fileSizeMB} MB {report.widthPx && report.heightPx ? `(${report.widthPx}×${report.heightPx}px)` : '• Vector CMYK'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Quality Checklist Summary Badges */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                ✓ ຜົນການກວດສອບມາດຕະຖານໂຮງພິມ (Preflight Assurance)
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {report.items.slice(0, 4).map((item) => {
                  const isPass = item.status === 'passed'
                  return (
                    <div
                      key={item.id}
                      className={`p-2 rounded-xl border flex items-center gap-2 ${
                        isPass
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                          : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-black ${
                        isPass ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                      }`}>
                        {isPass ? <CheckIcon size={9} /> : <AlertCircleIcon size={9} />}
                      </div>
                      <span className="font-bold truncate">{item.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Itemized Quotation & Specification Details (6 of 12 cols) */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 flex flex-col justify-between shadow-inner">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <PrinterIcon size={14} /> ລາຍລະອຽດສເປັກສັ່ງຜະລິດ (Print Order Specs)
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  {quantity} ຊິ້ນ / ຊຸດ (Quantity)
                </span>
              </div>

              <h4 className="text-base sm:text-lg font-black text-slate-100 m-0 mb-3">
                {productName || 'ງານສິ່ງພິມຄຸນນະພາບສູງ (Custom Print Order)'}
              </h4>

              {/* Detailed Specs Table */}
              <div className="space-y-2 text-xs bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 mb-4">
                {specLabels?.size && (
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">ຂະໜາດງານພິມ (Size):</span>
                    <span className="font-bold text-slate-200">{specLabels.size}</span>
                  </div>
                )}
                {specLabels?.paper && (
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">ຊະນິດເນື້ອເຈ້ຍ (Paper Stock):</span>
                    <span className="font-bold text-amber-400">{specLabels.paper}</span>
                  </div>
                )}
                {specLabels?.finishing && (
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">ເຕັກນິກເຂົ້າເລັ້ມ/ຕັດແຕ່ງ (Finishing):</span>
                    <span className="font-bold text-slate-200">{specLabels.finishing}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">ຈຳນວນຜະລິດ (Quantity):</span>
                  <span className="font-black text-slate-100">{quantity} ຊິ້ນ / ຊຸດ (No MOQ)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">ໄລຍະເວລາຜະລິດ (Lead Time):</span>
                  <span className="font-bold text-emerald-400">⚡ ພິມດ່ວນ 24–48 ຊົ່ວໂມງ</span>
                </div>
              </div>
            </div>

            {/* Total Price & Multi-Currency Box */}
            <div className="rounded-xl bg-gradient-to-br from-slate-900 to-amber-950/30 p-4 border border-amber-500/30 shadow-md">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">ຍອດລວມສຸດທິ (Net Total):</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                  {formatMoney ? formatMoney(priceTotal, currency) : `${priceTotal} THB`}
                </span>
              </div>
              
              {formatMultiCurrency && (
                <div className="text-xs font-bold text-right text-slate-400 border-t border-slate-800/80 pt-1.5 mt-1 font-mono">
                  {formatMultiCurrency(priceTotal)}
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 mt-2">
                <CheckIcon size={13} color="#10B981" />
                <span>ລວມຄ່າກວດຟາຍ Preflight + Color Proof ດິຈິຕອນຟຣີ</span>
              </div>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-4 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-sm font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 border-none cursor-pointer transition transform active:scale-98"
          >
            <span>ຢືນຢັນລາຍການ & ສັ່ງຜະລິດ (Confirm & Order)</span>
            <ArrowRightIcon size={18} />
          </button>
          
          <button
            type="button"
            onClick={() => window.print()}
            className="py-3.5 px-5 rounded-2xl text-xs font-bold transition-all border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer flex items-center justify-center gap-2"
            title="Download PDF Quotation"
          >
            <DownloadIcon size={16} />
            <span>ດາວໂຫລດໃບສະເໜີລາຄາ PDF</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="py-3.5 px-5 rounded-2xl text-xs font-bold transition-all border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            ແກ້ໄຂສເປັກ / ປ່ຽນຟາຍ
          </button>
        </div>
      </div>
    </div>
  )
}

export default PreflightChecklistModal
