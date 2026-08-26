import React from 'react'
import { CheckIcon } from '../icons.tsx'

interface AddedToCartModalProps {
  isOpen: boolean
  productName: string
  addedBatchCount: number
  onContinueShopping: () => void
  onGoToCheckout: () => void
  language?: string
}

export function AddedToCartModal({
  isOpen,
  productName,
  addedBatchCount,
  onContinueShopping,
  onGoToCheckout,
  language = 'lo',
}: AddedToCartModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-amber-500/40 bg-slate-900 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500 text-emerald-400 flex items-center justify-center shadow-lg">
          <CheckIcon size={32} />
        </div>

        <div>
          <h3 className="font-black text-xl text-white m-0">
            {language === 'en' ? '🎉 Added to Cart Successfully!' : '🎉 ເພີ່ມເຂົ້າກະຕ່າສຳເລັດແລ້ວ!'}
          </h3>
          <p className="text-xs font-medium text-slate-300 mt-1">
            {language === 'en'
              ? `Saved ${addedBatchCount} item(s) of ${productName} to your cart.`
              : `ບັນທຶກ ${addedBatchCount} ລາຍການສິນຄ້າ ${productName} ເຂົ້າສູ່ກະຕ່າຮຽບຮ້ອຍແລ້ວ`}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 text-left space-y-1">
          <div className="flex justify-between font-bold text-slate-200">
            <span>{language === 'en' ? 'Product:' : 'ສິນຄ້າ:'}</span>
            <span className="text-amber-400">{productName}</span>
          </div>
          <div className="flex justify-between">
            <span>{language === 'en' ? 'Batch Quantity:' : 'ຈຳນວນລາຍການ:'}</span>
            <span>{addedBatchCount} {language === 'en' ? 'file(s)' : 'ຟາຍ/ລາຍການ'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onContinueShopping}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer shadow"
          >
            <span>{language === 'en' ? '➕ Order Another Item' : '➕ ສັ່ງພິມລາຍການໃໝ່'}</span>
          </button>

          <button
            type="button"
            onClick={onGoToCheckout}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{language === 'en' ? '⚡ Checkout Now' : '⚡ ໄປທີ່ກະຕ່າ / ຊຳລະເງິນ'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
