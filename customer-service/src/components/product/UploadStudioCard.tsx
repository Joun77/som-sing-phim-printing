import React from 'react'
import { UploadCloudIcon } from '../icons.tsx'

interface UploadStudioCardProps {
  uploadMode: 'upload' | 'drive'
  setUploadMode: (mode: 'upload' | 'drive') => void
  isDragOver: boolean
  setIsDragOver: (drag: boolean) => void
  isGeneralDocWorkflow: boolean
  language: string
  allowedTypesDisplay: string
  fileInputRef: React.RefObject<HTMLInputElement>
  handleMultipleFilesUpload: (files: FileList | File[]) => void
  driveLink: string
  setDriveLink: (link: string) => void
  permissionConfirmed: boolean
  setPermissionConfirmed: (confirmed: boolean) => void
  onConfirmDriveBatch: () => void
}

export function UploadStudioCard({
  uploadMode,
  setUploadMode,
  isDragOver,
  setIsDragOver,
  isGeneralDocWorkflow,
  language,
  allowedTypesDisplay,
  fileInputRef,
  handleMultipleFilesUpload,
  driveLink,
  setDriveLink,
  permissionConfirmed,
  setPermissionConfirmed,
  onConfirmDriveBatch,
}: UploadStudioCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UploadCloudIcon size={20} color="#C5A059" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            {isGeneralDocWorkflow
              ? (language === 'en' ? 'Step 1: Upload Your Documents' : 'ຂັ້ນຕອນທີ 1: ອັບໂຫຼດເອກະສານຂອງທ່ານ (ເລືອກໄດ້ຫຼາຍຟາຍ)')
              : (language === 'en' ? 'Step 1: Upload Artwork(s) or Image(s)' : 'ຂັ້ນຕອນທີ 1: ອັບໂຫຼດຟາຍອາດເວິກ / ຮູບພາບ (ເລືອກໄດ້ຫຼາຍຟາຍ)')}
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setUploadMode('upload')}
            className={`px-3 py-1.5 rounded-lg transition ${uploadMode === 'upload' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
          >
            ອັບໂຫຼດຟາຍ
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('drive')}
            className={`px-3 py-1.5 rounded-lg transition ${uploadMode === 'drive' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
          >
            Google Drive
          </button>
        </div>
      </div>

      {uploadMode === 'upload' ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragOver(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragOver(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragOver(false)
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleMultipleFilesUpload(e.dataTransfer.files)
            }
          }}
          className={`p-10 sm:p-14 rounded-3xl border-2 border-dashed transition transform cursor-pointer shadow-md flex flex-col items-center justify-center text-center gap-4 group ${
            isDragOver
              ? 'border-amber-500 bg-amber-500/20 scale-[1.02] shadow-2xl shadow-amber-500/30 ring-4 ring-amber-500/20'
              : 'border-amber-500/40 hover:border-amber-500 bg-amber-50/20 dark:bg-slate-950/60 hover:-translate-y-1'
          }`}
        >
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-950 to-blue-950 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-xl transition-transform ${isDragOver ? 'scale-125 rotate-6' : 'group-hover:scale-110'}`}>
            <UploadCloudIcon size={32} />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-black bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 shadow-xl shadow-amber-500/25">
              <span>
                {isDragOver
                  ? 'ປ່ອຍຟາຍລົງບ່ອນນີ້ເລີຍ (Drop Files Here) 🚀'
                  : isGeneralDocWorkflow
                  ? 'ເລືອກຟາຍເອກະສານ ຫຼື ລາກມາວາງ (Upload Documents)'
                  : 'ເລືອກຟາຍອາດເວິກ ຫຼື ລາກມາວາງ (Upload Artworks)'}
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block pt-2">
              {language === 'en' ? 'Supported formats: ' : 'ຮອງຮັບຟາຍ: '}{allowedTypesDisplay} · {language === 'en' ? 'Auto Preflight Check' : 'ກວດສອບມາດຕະຖານອັດຕະໂນມັດ'}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              ລິ້ງໂຟນເດີ ຫຼື ຟາຍ Google Drive (Anyone with link can view):
            </label>
            <input
              type="url"
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full px-4 py-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={permissionConfirmed}
              onChange={(e) => setPermissionConfirmed(e.target.checked)}
              className="w-4 h-4 text-amber-500 rounded"
            />
            <span>ຢືນຢັນວ່າໄດ້ເປີດສິດ "Anyone with link can view" ແລ້ວ</span>
          </label>

          <button
            type="button"
            onClick={onConfirmDriveBatch}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md"
          >
            ຕໍ່ໄປ: ກຳນົດສເປັກສິນຄ້າ (Next: Set Specs) →
          </button>
        </div>
      )}
    </div>
  )
}
