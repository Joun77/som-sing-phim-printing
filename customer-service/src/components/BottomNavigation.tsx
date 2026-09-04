import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useShop } from '../context/ShopContext.tsx'
import { Home, Package, ShoppingBag, User } from 'lucide-react'
import { CartIcon } from './icons.tsx'

export default function BottomNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { cartCount, openCart, language, isLoggedIn, setIsProfileModalOpen } = useShop()
  const isLao = language === 'lo'

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' && !location.hash
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="mobile-app-bottom-nav" aria-label="Mobile Navigation Bar">
      
      {/* 1. Home Tab */}
      <button
        type="button"
        className={`app-nav-item ${isActive('/') ? 'is-active' : ''}`}
        onClick={() => {
          navigate('/')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      >
        <div className="nav-icon-wrapper">
          <Home className="w-5 h-5" />
        </div>
        <span>{isLao ? 'ໜ້າຫຼັກ' : 'Home'}</span>
      </button>

      {/* 2. Catalog / Products Tab */}
      <button
        type="button"
        className={`app-nav-item ${location.hash === '#categories' || location.pathname.startsWith('/category') ? 'is-active' : ''}`}
        onClick={() => {
          if (location.pathname !== '/') {
            navigate('/category/documents')
          } else {
            const el = document.getElementById('categories')
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' })
            } else {
              navigate('/category/documents')
            }
          }
        }}
      >
        <div className="nav-icon-wrapper">
          <Package className="w-5 h-5" />
        </div>
        <span>{isLao ? 'ສິນຄ້າ' : 'Catalog'}</span>
      </button>

      {/* 3. Center Highlight: Cart Tab (Floating Gold Badge) */}
      <button
        type="button"
        className="app-nav-item app-nav-item--primary"
        onClick={openCart}
        aria-label="Shopping Cart"
      >
        <div className="nav-primary-badge relative">
          <CartIcon size={20} />
          {cartCount > 0 && (
            <span className="mobile-cart-bubble">{cartCount}</span>
          )}
        </div>
        <span>{isLao ? 'ກະຕ່າ' : 'Cart'}</span>
      </button>

      {/* 4. Orders History Tab */}
      <button
        type="button"
        className={`app-nav-item ${isActive('/orders') ? 'is-active' : ''}`}
        onClick={() => {
          navigate('/orders')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        aria-label="Order History"
      >
        <div className="nav-icon-wrapper">
          <ShoppingBag className="w-5 h-5" />
        </div>
        <span>{isLao ? 'ປະຫວັດ' : 'Orders'}</span>
      </button>

      {/* 5. Profile Tab (Replaces Consult/Help) */}
      <button
        type="button"
        className={`app-nav-item ${isActive('/profile') ? 'is-active' : ''}`}
        onClick={() => {
          if (isLoggedIn) {
            navigate('/profile')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          } else {
            setIsProfileModalOpen(true)
          }
        }}
        aria-label="Customer Profile"
      >
        <div className="nav-icon-wrapper">
          <User className="w-5 h-5" />
        </div>
        <span>{isLao ? 'ໂປຣໄຟລ໌' : 'Profile'}</span>
      </button>

    </nav>
  )
}
