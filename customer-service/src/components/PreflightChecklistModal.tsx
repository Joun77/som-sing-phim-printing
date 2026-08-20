import React from 'react'
import { PreflightReport } from '../lib/preflightAnalyzer'
import { CheckIcon, AlertCircleIcon, XIcon, ArrowRightIcon, FileTextIcon, DownloadIcon } from './icons'

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
  const isImage = report.fileType.startsWith('image/') || previewUrl?.startsWith('data:image') || previewUrl?.startsWith('blob:')
  const quotationNo = `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  const currentDate = new Date().toLocaleDateString('lo-LA', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl border border-amber-500/30 bg-slate-900 text-slate-100 animate-fade-in space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header - Instant Quotation & Proof Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center border border-amber-500/40 bg-gradient-to-br from-slate-950 to-blue-950 text-amber-400">
              <FileTextIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-slate-100 m-0">
                  ໃບສະເໜີລາຄາ & ຕົວຢ່າງຟາຍ (Quotation & Proof)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {quotationNo}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 m-0">
                SOM SING PHIM (ສົມສິ່ງພິມ) · {currentDate}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors border-none bg-transparent cursor-pointer"
            aria-label="Close"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* 2-Column Overview: Artwork Preview Left + Quotation Spec Right */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Left Column: Visual Artwork Preview */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 flex flex-col items-center justify-center">
            <div className="w-full flex justify-between items-center text-[11px] font-bold mb-2">
              <span className="text-amber-400">🖼️ ຕົວຢ່າງຟາຍພິມ (Artwork Proof)</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                {report.estimatedDPI || 300} DPI
              </span>
            </div>

            {isImage && previewUrl ? (
              <div className="w-full flex flex-col items-center">
                <img
                  src={previewUrl}
                  alt="Artwork Preview"
                  className="max-h-40 max-w-full object-contain rounded-xl shadow-md border border-slate-800"
                />
                <span className="text-[10.5px] font-bold text-slate-200 mt-1.5 truncate max-w-full">
                  {report.fileName}
                </span>
                <span className="text-[10px] text-slate-400">
                  {report.fileSizeMB} MB · {report.widthPx && report.heightPx ? `${report.widthPx}×${report.heightPx} px` : 'Vector/Image'}
                </span>
              </div>
            ) : (
              <div className="py-4 flex flex-col items-center gap-1.5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <FileTextIcon size={24} />
                </div>
                <span className="text-xs font-black text-slate-200 truncate max-w-[180px]">
                  {report.fileName}
                </span>
                <span className="text-[10.5px] font-bold text-slate-400">
                  {report.fileSizeMB} MB · CMYK Print Ready
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Itemized Quotation Summary */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1.5">
                📋 ສະຫຼຸບລາຍການສັ່ງຜະລິດ (Specs)
              </div>
              <h4 className="text-sm font-black text-slate-100 m-0 mb-2">
                {productName || 'ງານສິ່ງພິມຄຸນນະພາບສູງ'}
              </h4>

              <div className="space-y-1 text-xs">
                {specLabels?.size && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">ຂະໜາດ (Size):</span>
                    <span className="font-bold text-slate-200">{specLabels.size}</span>
                  </div>
                )}
                {specLabels?.paper && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">ເນື້ອເຈ້ຍ (Paper):</span>
                    <span className="font-bold text-amber-400">{specLabels.paper}</span>
                  </div>
                )}
                {specLabels?.finishing && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">ການເຄືອບ (Finishing):</span>
                    <span className="font-bold text-slate-200">{specLabels.finishing}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">ຈຳນວນ (Quantity):</span>
                  <span className="font-black text-slate-100">{quantity} ຊິ້ນ</span>
                </div>
              </div>
            </div>

            {/* Total Price Box */}
            <div className="border-t border-slate-800 pt-2 mt-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-400">ຍອດລວມສຸດທິ:</span>
                <span className="text-lg font-black text-amber-400">
                  {formatMoney ? formatMoney(priceTotal, currency) : `${priceTotal} THB`}
                </span>
              </div>
              {formatMultiCurrency && (
                <div className="text-[10.5px] font-bold text-right text-slate-400">
                  {formatMultiCurrency(priceTotal)}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Preflight Quality Checklist */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            ✓ ຜົນການກວດສອບຄຸນນະພາບຟາຍ (Quality Checklist)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {report.items.map((item) => {
              const isPass = item.status === 'passed'
              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    isPass
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-amber-500/10 border-amber-500/30'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black ${
                      isPass ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {isPass ? <CheckIcon size={10} /> : <AlertCircleIcon size={10} />}
                  </div>
                  <div className="truncate">
                    <span className="font-bold block truncate text-slate-200">
                      {item.label}
                    </span>
                    <span className="text-[10px] block truncate text-slate-400">
                      {item.message}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 border-none cursor-pointer transition transform active:scale-98"
          >
            <span>ຢືນຢັນລາຍການ & ສັ່ງຜະລິດ (Confirm & Order)</span>
            <ArrowRightIcon size={15} />
          </button>
          
          <button
            type="button"
            onClick={() => window.print()}
            className="py-3 px-3.5 rounded-xl text-xs font-bold transition-all border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer flex items-center gap-1.5"
            title="Print Quotation"
          >
            <DownloadIcon size={15} />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="py-3 px-4 rounded-xl text-xs font-bold transition-all border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            ແກ້ໄຂ / ປ່ຽນຟາຍ
          </button>
        </div>
      </div>
    </div>
  )
}

export default PreflightChecklistModal
