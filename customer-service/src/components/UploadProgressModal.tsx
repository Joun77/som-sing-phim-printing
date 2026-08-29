import React, { useEffect, useState } from 'react'
import { UploadCloudIcon, CheckIcon, SparkleIcon, XIcon } from './icons'
import { BorderBeam } from './reactbits/BorderBeam'
import { FileText, Zap, Rocket } from 'lucide-react'

export interface UploadProgressModalProps {
  isOpen: boolean
  fileName: string
  fileSizeMB: string
  onComplete: () => void
  onCancel?: () => void
}

export const UploadProgressModal: React.FC<UploadProgressModalProps> = ({
  isOpen,
  fileName,
  fileSizeMB,
  onComplete,
  onCancel,
}) => {
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState<'uploading' | 'analyzing' | 'completed'>('uploading')

  useEffect(() => {
    if (!isOpen) {
      setProgress(0)
      setStage('uploading')
      return
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 60) {
          return prev + Math.floor(Math.random() * 12) + 6
        } else if (prev < 88) {
          setStage('analyzing')
          return prev + Math.floor(Math.random() * 5) + 3
        } else if (prev < 100) {
          return prev + 3
        } else {
          clearInterval(interval)
          setStage('completed')
          setTimeout(() => {
            onComplete()
          }, 350)
          return 100
        }
      })
    }, 60)

    return () => clearInterval(interval)
  }, [isOpen, onComplete])

  const totalMB = parseFloat(fileSizeMB) || 0
  const processedMB = ((progress / 100) * totalMB).toFixed(1)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-amber-500/40 bg-slate-900 text-center space-y-5">
        <BorderBeam size={180} duration={6} colorFrom="#C5A059" colorTo="#0284C7" />

        {/* Top-Right Cancel Icon */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition z-20 cursor-pointer"
            title="ຍົກເລີກ"
          >
            <XIcon size={18} />
          </button>
        )}

        {/* Animated Icon Box */}
        <div className="flex justify-center">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
              stage === 'completed'
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                : 'bg-gradient-to-br from-slate-950 to-blue-950 border-amber-500/40 text-amber-400 shadow-lg'
            }`}
          >
            {stage === 'completed' ? (
              <CheckIcon size={32} />
            ) : (
              <span className="animate-bounce inline-flex">
                <UploadCloudIcon size={30} />
              </span>
            )}
          </div>
        </div>

        {/* Title & File details */}
        <div>
          <h3 className="font-black text-lg sm:text-xl text-slate-100 m-0 mb-1">
            {stage === 'completed'
              ? 'ປະມວນຜົນສຳເລັດ 100%!'
              : stage === 'analyzing'
              ? 'ກຳລັງກວດສອບຄຸນນະພາບຟາຍ (Preflight)...'
              : 'ກຳລັງອ່ານ ແລະ ປະມວນຜົນຟາຍ...'}
          </h3>
          <p className="text-xs font-bold text-slate-400 truncate max-w-xs mx-auto m-0 flex items-center justify-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>{fileName}</span>
          </p>
          {totalMB > 0 && (
            <span className="inline-block mt-1 text-[11px] font-mono text-amber-400/90 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              {stage === 'completed' ? `${totalMB} MB (Completed)` : `${processedMB} MB / ${totalMB} MB`}
            </span>
          )}
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-black">
            <span className="text-amber-400 flex items-center gap-1">
              {stage === 'analyzing' ? (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>ກວດສອບ Vector, CMYK & 300 DPI (Preflight)</span>
                </>
              ) : (
                <>
                  <Rocket className="w-3.5 h-3.5" />
                  <span>ກຳລັງອັບໂຫຼດ ແລະ ປະມວນຜົນ...</span>
                </>
              )}
            </span>
            <span className="text-slate-100 font-mono text-sm">{Math.min(progress, 100)}%</span>
          </div>

          <div className="w-full h-3 rounded-full overflow-hidden p-0.5 border border-slate-700 bg-slate-950">
            <div
              className={`h-full rounded-full transition-all duration-150 ease-out ${
                stage === 'completed'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-emerald-500/40 shadow-sm'
                  : 'bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-200 shadow-amber-500/40 shadow-sm'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Status Stage Indicator */}
        <div className="p-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold border border-slate-700/60 bg-slate-950/60">
          <SparkleIcon size={14} color={stage === 'completed' ? '#10B981' : '#F59E0B'} />
          <span className="text-slate-200">
            {stage === 'completed'
              ? 'ກວດສອບຄວາມລະອຽດ & ຂອບຕັດຕົກ 100% ພ້ອມສັ່ງພິມ'
              : stage === 'analyzing'
              ? 'ກຳລັງວິເຄາະ Resolution DPI, Color Profile...'
              : `ກຳລັງອ່ານຂໍ້ມູນ ${processedMB} MB ຈາກ ${totalMB} MB...`}
          </span>
        </div>

        {/* Bottom Cancel Action Button */}
        {onCancel && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-700/80 hover:border-red-500/40 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <XIcon size={14} />
              <span>ຍົກເລີກການອັບໂຫຼດ (Cancel & Choose Another File)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UploadProgressModal
