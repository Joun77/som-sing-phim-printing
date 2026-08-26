import React from 'react'
import { FileTextIcon, XIcon, DownloadIcon } from '../icons.tsx'
import { formatMoney } from '../../utils/currency.ts'

interface QuotationModalProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  specLabels: {
    size: string
    paper: string
    finishing: string
  }
  quantity: number
  totalDisplay: number
  currency: any
  language: string
  t: (key: any) => string
}

export function QuotationModal({
  isOpen,
  onClose,
  productName,
  specLabels,
  quantity,
  totalDisplay,
  currency,
  language,
  t,
}: QuotationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-amber-500/30 animate-fade-in space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <FileTextIcon size={22} />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">{t('quotationModalTitle')}</h3>
              <p className="text-xs text-slate-500 font-bold">SOM SING PHIM · PREVIEW</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500 font-semibold">{language === 'en' ? 'Product:' : 'ລາຍການ:'}</span>
            <span className="font-bold text-slate-900">{productName}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500 font-semibold">{language === 'en' ? 'Size Spec:' : 'ຂະໜາດ:'}</span>
            <span className="font-bold text-slate-900">{specLabels.size}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500 font-semibold">{language === 'en' ? 'Material / Paper:' : 'ວັດສະດຸ:'}</span>
            <span className="font-bold text-slate-900">{specLabels.paper}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500 font-semibold">{language === 'en' ? 'Finishing / Cut:' : 'ການຕັດແຕ່ງ:'}</span>
            <span className="font-bold text-slate-900">{specLabels.finishing}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500 font-semibold">{language === 'en' ? 'Quantity:' : 'ຈຳນວນ:'}</span>
            <span className="font-bold text-slate-900">{quantity} {language === 'en' ? 'Units' : 'ຊິ້ນ'}</span>
          </div>
          <div className="flex justify-between py-3 bg-gradient-to-r from-amber-50 to-sky-50 px-4 rounded-2xl border border-amber-200/60">
            <span className="font-bold text-slate-800">{language === 'en' ? 'Estimated Total:' : 'ຍອດລວມສຸທິ:'}</span>
            <span className="font-black text-primary-navy text-lg">{formatMoney(totalDisplay, currency)}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 py-3.5 bg-gradient-to-r from-slate-900 to-primary-navy hover:from-primary-navy hover:to-slate-900 text-amber-300 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <DownloadIcon size={16} />
            <span>{t('printSavePdf')}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3.5 px-6 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-2xl text-xs font-bold transition-all cursor-pointer"
          >
            {t('closeBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
