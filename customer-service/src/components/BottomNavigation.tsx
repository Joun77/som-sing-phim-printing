import { useLocation, useNavigate } from 'react-router-dom'
import { useShop } from '../context/ShopContext.tsx'
import { 
  CartIcon, 
  SearchIcon, 
  SparkleIcon 
} from './icons.tsx'

export default function BottomNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { cartCount, openCart, language } = useShop()
  const isLao = language === 'lo'

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="mobile-app-bottom-nav" aria-label="Mobile Navigation Bar">
      <button
        type="button"
        className={`app-nav-item ${isActive('/') && !location.hash ? 'is-active' : ''}`}
        onClick={() => {
          navigate('/')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      >
        <div className="nav-icon-wrapper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <span>{isLao ? 'ໜ້າຫຼັກ' : 'Home'}</span>
      </button>

      <button
        type="button"
        className={`app-nav-item ${location.hash === '#categories' || location.pathname.startsWith('/category') ? 'is-active' : ''}`}
        onClick={() => {
          if (location.pathname !== '/') {
            navigate('/#categories')
          } else {
            const el = document.getElementById('categories')
            if (el) el.scrollIntoView({ behavior: 'smooth' })
          }
        }}
      >
        <div className="nav-icon-wrapper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        <span>{isLao ? 'ສິນຄ້າ' : 'Catalog'}</span>
      </button>

      <button
        type="button"
        className={`app-nav-item app-nav-item--primary ${isActive('/track') ? 'is-active' : ''}`}
        onClick={() => navigate('/track')}
      >
        <div className="nav-primary-badge">
          <SearchIcon size={20} />
        </div>
        <span>{isLao ? 'ຕິດຕາມ' : 'Track'}</span>
      </button>

      <button
        type="button"
        className="app-nav-item"
        onClick={openCart}
        aria-label="Shopping Cart"
      >
        <div className="nav-icon-wrapper">
          <CartIcon size={20} />
          {cartCount > 0 && (
            <span className="mobile-cart-bubble">{cartCount}</span>
          )}
        </div>
        <span>{isLao ? 'ກະຕ່າ' : 'Cart'}</span>
      </button>

      <a
        href="https://wa.me/8562088888888"
        target="_blank"
        rel="noopener noreferrer"
        className="app-nav-item"
      >
        <div className="nav-icon-wrapper">
          <SparkleIcon size={20} />
        </div>
        <span>{isLao ? 'ປຶກສາ' : 'Help'}</span>
      </a>
    </nav>
  )
}
