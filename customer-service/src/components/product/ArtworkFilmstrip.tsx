import React from 'react'
import { PlusIcon, FileTextIcon } from '../icons.tsx'
import { X } from 'lucide-react'
import type { ArtworkBatchItem } from './types.ts'

interface ArtworkFilmstripProps {
  uploadedArtworks: ArtworkBatchItem[]
  activeArtworkIndex: number
  onSelectIndex: (idx: number) => void
  onRemoveIndex: (idx: number) => void
  onAddMoreFiles: () => void
  onDropFiles: (files: FileList) => void
  language?: string
}

export function ArtworkFilmstrip({
  uploadedArtworks,
  activeArtworkIndex,
  onSelectIndex,
  onRemoveIndex,
  onAddMoreFiles,
  onDropFiles,
  language = 'lo',
}: ArtworkFilmstripProps) {
  const isLao = language === 'lo'

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFiles(e.dataTransfer.files)
    }
  }

  return (
    <div className="w-full space-y-2 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          {isLao ? 'ໄຟລ໌ທັງໝົດທີ່ເລືອກ' : 'Batch Artwork Filmstrip'} ({uploadedArtworks.length})
        </span>
        <span className="text-[11px] text-slate-500">
          {isLao ? 'ກົດເລືອກເພື່ອສະແດງ / ກວດສອບ' : 'Click to inspect & preview'}
        </span>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 px-1 scrollbar-thin">
        {uploadedArtworks.map((art, idx) => {
          const isActive = idx === activeArtworkIndex
          return (
            <div
              key={idx}
              onClick={() => onSelectIndex(idx)}
              className={`relative flex-shrink-0 w-24 sm:w-28 rounded-2xl p-1.5 border-2 transition-all cursor-pointer group select-none ${
                isActive
                  ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/20 scale-[1.02]'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-75 hover:opacity-100 hover:border-slate-300'
              }`}
            >
              {/* Top Tag: File Number Badge */}
              <div className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded-md bg-slate-950/80 text-amber-400 text-[9px] font-black backdrop-blur-sm">
                #{idx + 1}
              </div>

              {/* Quick Delete 'X' Button on Top-Right */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveIndex(idx)
                }}
                className="absolute -top-1.5 -right-1.5 z-20 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black shadow-md opacity-80 group-hover:opacity-100 hover:scale-110 transition cursor-pointer"
                title="ລຶບຟາຍນີ້"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Miniature Preview Image / Box */}
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-700/50 shadow-inner">
                {art.previewUrl ? (
                  art.fileType.includes('pdf') ? (
                    <div className="flex flex-col items-center justify-center text-amber-400 text-[10px] font-bold">
                      <FileTextIcon size={20} />
                      <span className="text-[8px] uppercase">PDF</span>
                    </div>
                  ) : (
                    <img
                      src={art.previewUrl}
                      alt={art.fileName}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <FileTextIcon size={20} />
                )}
              </div>

              {/* Truncated File Label + Qty */}
              <div className="mt-1.5 text-center">
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate block max-w-full">
                  {art.fileName}
                </span>
                <span className="text-[9px] text-amber-600 dark:text-amber-400 font-mono font-bold block">
                  {art.quantity} {language === 'en' ? 'pcs' : 'ຊິ້ນ'}
                </span>
              </div>
            </div>
          )
        })}

        {/* Add More File Quick Card */}
        <button
          type="button"
          onClick={onAddMoreFiles}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              onDropFiles(e.dataTransfer.files)
            }
          }}
          className="flex-shrink-0 w-24 sm:w-28 aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-amber-50/30 dark:hover:bg-amber-500/10 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-amber-500 transition cursor-pointer"
        >
          <PlusIcon size={18} />
          <span className="text-[10px] font-bold">
            {language === 'en' ? '+ Add File' : '+ ເພີ່ມຟາຍ'}
          </span>
        </button>
      </div>
    </div>
  )
}
