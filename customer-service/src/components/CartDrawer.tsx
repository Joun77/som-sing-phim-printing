import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShop } from '../context/ShopContext.tsx'
import { formatMoney } from '../utils/currency.ts'
import { CartIcon, CloseIcon, TrashIcon, CheckIcon } from './icons.tsx'

export default function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    cart,
    removeFromCart,
    toggleCartItemSelection,
    toggleSelectAll,
    clearCart,
    selectedCartItems,
    selectedTotalTHB,
    convertTo,
    currency,
    t,
  } = useShop()

  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCartOpen, closeCart])

  if (!isCartOpen) return null

  const allSelected = cart.length > 0 && cart.every((item) => item.selected)
  const isAnySelected = selectedCartItems.length > 0

  const handleCheckout = () => {
    if (!isAnySelected) return
    closeCart()
    navigate('/checkout')
  }

  return (
    <>
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Slide-out Drawer */}
      <aside
        className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <CartIcon size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 m-0">
                {t('cartTitle')}
              </h3>
              <span className="text-xs font-bold text-slate-400">
                {cart.length} {t('itemsUnit')}
              </span>
            </div>
          </div>
          <button
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors border-none bg-transparent cursor-pointer"
            onClick={closeCart}
            aria-label="Close cart"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Content */}
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
              <CartIcon size={32} />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-200 m-0">
              {t('cartEmpty')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0 max-w-xs">
              {t('cartEmptySub')}
            </p>
          </div>
        ) : (
          <>
            {/* Selection bar */}
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                  checked={allSelected}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
                <span>{allSelected ? t('deselectAll') : t('selectAll')}</span>
              </label>
              <button
                className="text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 bg-transparent border-none cursor-pointer"
                onClick={clearCart}
              >
                {t('clearCartBtn')}
              </button>
            </div>

            {/* Item list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item) => {
                const itemTotalTHB = item.price?.totalTHB || item.price?.total || 0
                const itemTotalDisplay = convertTo(itemTotalTHB)

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
                      item.selected
                        ? 'bg-white dark:bg-slate-800/80 border-amber-500/40 shadow-sm'
                        : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                        checked={item.selected}
                        onChange={() => toggleCartItemSelection(item.id)}
                        aria-label={`Select ${item.product.name || item.product.title}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate m-0">
                          {item.product.name || item.product.title}
                        </h4>
                        <button
                          className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                          onClick={() => removeFromCart(item.id)}
                          title={t('deleteItem')}
                          aria-label={t('deleteItem')}
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {item.config.specLabels.size && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {item.config.specLabels.size}
                          </span>
                        )}
                        {item.config.specLabels.paper && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            {item.config.specLabels.paper}
                          </span>
                        )}
                        {item.config.specLabels.finishing && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {item.config.specLabels.finishing}
                          </span>
                        )}
                      </div>

                      {/* Multi-Book Batch Breakdown */}
                      {item.bookItems && item.bookItems.length > 0 && (
                        <div className="mt-2 p-2 rounded-xl bg-amber-50/50 dark:bg-slate-900/80 border border-amber-500/20 text-[11px] space-y-1">
                          <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center justify-between">
                            <span>📚 ລາຍການປຶ້ມ ({item.bookItems.length} ເລື່ອງ):</span>
                            <span>{item.bookItems.reduce((s, b) => s + b.quantity, 0)} ຫົວລວມ</span>
                          </div>
                          <div className="space-y-0.5 max-h-24 overflow-y-auto pr-1">
                            {item.bookItems.map((b, bIdx) => (
                              <div key={b.id || bIdx} className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[10px]">
                                <span className="truncate max-w-[140px]">📖 {b.title || `ເລື່ອງທີ ${bIdx + 1}`}</span>
                                <span className="text-slate-500">
                                  {b.innerPageCount} ໜ້າ ({b.spineThicknessMm}mm) × {b.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {t('quantityLabel')}: {item.config.quantity.toLocaleString()} {item.product.unit || 'pcs'}
                        </span>
                        <div className="text-right">
                          <div className="text-sm font-black text-amber-600 dark:text-amber-400">
                            {formatMoney(itemTotalDisplay, currency)}
                          </div>
                          {currency !== 'THB' && (
                            <div className="text-[10px] text-slate-400">
                              ≈ {formatMoney(itemTotalTHB, 'THB')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer Summary & Checkout */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>{t('selectedItemsCount')}:</span>
                <span className="font-black text-slate-900 dark:text-slate-100">
                  {selectedCartItems.length} / {cart.length} {t('itemsUnit')}
                </span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t('estimatedTotal')}:
                </span>
                <div className="text-right">
                  <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                    {formatMoney(convertTo(selectedTotalTHB), currency)}
                  </div>
                  {currency !== 'THB' && (
                    <div className="text-[10.5px] font-bold text-slate-400">
                      ≈ {formatMoney(selectedTotalTHB, 'THB')}
                    </div>
                  )}
                </div>
              </div>

              <button
                className={`w-full py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all border-none cursor-pointer ${
                  isAnySelected
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-200 active:scale-98'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                }`}
                disabled={!isAnySelected}
                onClick={handleCheckout}
              >
                <CheckIcon size={18} />
                <span>
                  {t('checkoutSelectedBtn')} ({selectedCartItems.length})
                </span>
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
