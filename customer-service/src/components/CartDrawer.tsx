import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShop } from '../context/ShopContext.tsx'
import { formatMoney } from '../utils/currency.ts'
import { CartIcon, CloseIcon, TrashIcon, CheckIcon } from './icons.tsx'
import '../styles/cart.css'

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
      <div className="cart-overlay" onClick={closeCart} aria-hidden="true" />
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping Cart">
        {/* Header */}
        <div className="cart-header">
          <div className="cart-header-title">
            <CartIcon size={24} />
            <span>{t('cartTitle')}</span>
            <span className="cart-badge-count">
              {cart.length} {t('itemsUnit')}
            </span>
          </div>
          <button className="cart-close-btn" onClick={closeCart} aria-label="Close cart">
            <CloseIcon size={22} />
          </button>
        </div>

        {/* Content */}
        {cart.length === 0 ? (
          <div className="cart-empty-state">
            <div className="cart-empty-icon">
              <CartIcon size={36} />
            </div>
            <h3 className="cart-empty-title">{t('cartEmpty')}</h3>
            <p className="cart-empty-sub">{t('cartEmptySub')}</p>
          </div>
        ) : (
          <>
            {/* Selection bar */}
            <div className="cart-selection-bar">
              <label className="cart-select-all-label">
                <input
                  type="checkbox"
                  className="cart-checkbox"
                  checked={allSelected}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
                <span>{allSelected ? t('deselectAll') : t('selectAll')}</span>
              </label>
              <button className="cart-clear-btn" onClick={clearCart}>
                {t('clearCartBtn')}
              </button>
            </div>

            {/* Item list */}
            <div className="cart-items-list">
              {cart.map((item) => {
                const itemTotalTHB = item.price?.totalTHB || item.price?.total || 0
                const itemTotalDisplay = convertTo(itemTotalTHB)

                return (
                  <div
                    key={item.id}
                    className={`cart-item-card ${!item.selected ? 'unselected' : ''}`}
                  >
                    <div className="cart-item-checkbox">
                      <input
                        type="checkbox"
                        className="cart-checkbox"
                        checked={item.selected}
                        onChange={() => toggleCartItemSelection(item.id)}
                        aria-label={`Select ${item.product.name || item.product.title}`}
                      />
                    </div>

                    <div className="cart-item-content">
                      <div className="cart-item-title-row">
                        <h4 className="cart-item-title">{item.product.name || item.product.title}</h4>
                        <button
                          className="cart-item-remove-btn"
                          onClick={() => removeFromCart(item.id)}
                          title={t('deleteItem')}
                          aria-label={t('deleteItem')}
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>

                      <div className="cart-item-specs">
                        {item.config.specLabels.size && (
                          <span className="cart-item-tag">{item.config.specLabels.size}</span>
                        )}
                        {item.config.specLabels.paper && (
                          <span className="cart-item-tag">{item.config.specLabels.paper}</span>
                        )}
                        {item.config.specLabels.finishing && (
                          <span className="cart-item-tag">{item.config.specLabels.finishing}</span>
                        )}
                      </div>

                      <div className="cart-item-bottom">
                        <span className="cart-item-qty">
                          {t('quantityLabel')}: {item.config.quantity.toLocaleString()} {item.product.unit || 'pcs'}
                        </span>
                        <div className="cart-item-price">
                          <div className="cart-item-price-main">
                            {formatMoney(itemTotalDisplay, currency)}
                          </div>
                          {currency !== 'THB' && (
                            <div className="cart-item-price-sub">
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
            <div className="cart-footer">
              <div className="cart-summary-row">
                <span className="cart-summary-label">{t('selectedItemsCount')}:</span>
                <span className="cart-summary-selected-count">
                  {selectedCartItems.length} / {cart.length} {t('itemsUnit')}
                </span>
              </div>

              <div className="cart-total-row">
                <span className="cart-total-label">{t('estimatedTotal')}:</span>
                <div className="cart-total-amount-group">
                  <div className="cart-total-amount">
                    {formatMoney(convertTo(selectedTotalTHB), currency)}
                  </div>
                  {currency !== 'THB' && (
                    <div className="cart-total-sub">
                      ≈ {formatMoney(selectedTotalTHB, 'THB')}
                    </div>
                  )}
                </div>
              </div>

              <button
                className="cart-checkout-btn"
                disabled={!isAnySelected}
                onClick={handleCheckout}
              >
                <CheckIcon size={20} />
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
