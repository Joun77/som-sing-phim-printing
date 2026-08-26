import React from 'react'
import { PlusIcon, FileTextIcon } from '../icons.tsx'
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
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-bold">
          {language === 'en' ? 'Uploaded Artworks' : 'ລາຍການຟາຍທັງໝົດ'} ({uploadedArtworks.length} {language === 'en' ? 'files' : 'ຟາຍ'}):
        </span>
        <span className="text-[11px] text-slate-400">
          {language === 'en' ? '(Click image to customize specs)' : '(ເລືອກຮູບເພື່ອສະຫຼັບການຕັ້ງຄ່າ)'}
        </span>
      </div>

      <div
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
        className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin"
      >
        {uploadedArtworks.map((art, idx) => {
          const isActive = activeArtworkIndex === idx
          return (
            <div
              key={art.id || idx}
              onClick={() => onSelectIndex(idx)}
              className={`relative group flex-shrink-0 w-24 sm:w-28 rounded-2xl border-2 p-1.5 transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/20 scale-105 ring-2 ring-amber-500/30'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-amber-400/60 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {/* Top Tag: File Number Badge */}
              <div className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded-md bg-slate-950/80 text-amber-400 text-[9px] font-black backdrop-blur-sm">
                #{idx + 1}
              </div>

              {/* Quick Delete '✕' Button on Top-Right */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveIndex(idx)
                }}
                className="absolute -top-1.5 -right-1.5 z-20 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black shadow-md opacity-80 group-hover:opacity-100 hover:scale-110 transition cursor-pointer"
                title="ລຶບຟາຍນີ້"
              >
                ✕
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
