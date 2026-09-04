import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useShop } from '../context/ShopContext.tsx'
import {
  ChevronDownIcon,
  EmailIcon,
  FacebookIcon,
  InstagramIcon,
  SearchIcon,
  TikTokIcon,
  WhatsAppIcon,
  CheckIcon,
  SparkleIcon,
  CartIcon,
} from './icons.tsx'
import { CURRENCIES } from '../utils/currency.ts'
import { User, ShoppingBag } from 'lucide-react'
import { CustomerProfileModal } from './customer/CustomerProfileModal.tsx'
import { CustomerOrderHistoryDrawer } from './customer/CustomerOrderHistoryDrawer.tsx'

const SOCIALS = [
  { label: 'Facebook', href: 'https://www.facebook.com/', Icon: FacebookIcon },
  { label: 'Instagram', href: 'https://www.instagram.com/', Icon: InstagramIcon },
  { label: 'TikTok', href: 'https://www.tiktok.com/', Icon: TikTokIcon },
  { label: 'WhatsApp', href: 'https://wa.me/8562088888888', Icon: WhatsAppIcon },
  { label: 'Email', href: 'mailto:som.sing.phim@gmail.com', Icon: EmailIcon },
]

function Logo() {
  const { t } = useShop()
  return (
    <Link to="/" className="header-logo group" aria-label="Som Sing Phim Home">
      <span className="header-logo-circle" aria-hidden="true">
        <img src="/logo.png" alt="Som Sing Phim Logo" className="header-logo-img" />
      </span>
      <span className="header-logo-text">
        <strong>
          {t('appName')} <em>{t('appSub')}</em>
        </strong>
        <small>{t('appTagline')}</small>
      </span>
    </Link>
  )
}

function LanguageSwitcher() {
  const { language, setLanguage } = useShop()
  const next = language === 'lo' ? 'en' : 'lo'
  const label = language === 'lo' ? 'ລາວ' : 'EN'
  const badge = language === 'lo' ? 'LA' : 'EN'

  return (
    <button
      type="button"
      className="lang-toggle-btn"
      onClick={() => setLanguage(next)}
      aria-label={`Switch to ${next === 'lo' ? 'ພາສາລາວ' : 'English'}`}
      title={next === 'lo' ? 'ສ່ຽງໄປ ພາສາລາວ' : 'Switch to English'}
    >
      <span className="lang-toggle-flag text-[10px] font-black px-1 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400" aria-hidden="true">{badge}</span>
      <span className="lang-toggle-label">{label}</span>
    </button>
  )
}

function CurrencySwitcher() {
  const { currency, setCurrency, convertTo, rates, ratesLoaded, language } = useShop()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const active = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0]

  return (
    <div className="currency-switcher" ref={ref}>
      <button
        type="button"
        className="currency-switcher-btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="currency-code">{active.label}</span>
        <ChevronDownIcon />
      </button>
      {open && (
        <div className="currency-menu" role="listbox">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              role="option"
              aria-selected={c.code === currency}
              className={c.code === currency ? 'is-active' : ''}
              onClick={() => {
                setCurrency(c.code)
                setOpen(false)
              }}
            >
              <span>
                <strong>{c.label}</strong>
                <small>
                  {c.code === 'LAK' && ratesLoaded
                    ? `1 THB = ₭ ${Math.round(rates.THB || 630.5)}`
                    : 'THB Currency'}
                </small>
              </span>
              {c.code === currency && <CheckIcon size={14} />}
            </button>
          ))}
          {ratesLoaded && (
            <div className="currency-note" style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
              {language === 'en'
                ? `Daily Rate: 1 THB ≈ ₭ ${Math.round(rates.THB || 630.5)}`
                : `ອັດຕາແລກປ່ຽນປະຈຳວັນ: 1 THB ≈ ₭ ${Math.round(rates.THB || 630.5)}`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { t, language, openCart, cartCount, categories = [] } = useShop()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isOrdersOpen, setIsOrdersOpen] = useState(false)
  const [customerPhone, setCustomerPhone] = useState(localStorage.getItem('ssp_customer_phone') || '')

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
    setCatOpen(false)
  }, [location.pathname])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const handleNavAnchor = (hash: string) => {
    setMenuOpen(false)
    if (location.pathname === '/') {
      const elem = document.querySelector(hash)
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      navigate(`/${hash}`)
    }
  }


  return (
    <header className="header">
      <div className="container header-inner">
        <Logo />

        <nav className={`header-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main Navigation">
          <div className="nav-links">
            <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
              {t('navHome')}
            </Link>

            <div className="nav-item has-dropdown">
              <button
                type="button"
                className="nav-link nav-dropdown-btn"
                onClick={() => setCatOpen((v) => !v)}
                aria-expanded={catOpen}
              >
                {t('navCategories')} <ChevronDownIcon />
              </button>
              {catOpen && (
                <div className="nav-dropdown">
                  {(categories || []).map((c) => (
                    <Link
                      key={c.slug}
                      to={`/category/${c.slug}`}
                      className="nav-dropdown-item"
                      onClick={() => {
                        setCatOpen(false)
                        setMenuOpen(false)
                      }}
                    >
                      <strong>{language === 'en' ? c.nameEn : c.name}</strong>
                      <small>{language === 'en' ? c.taglineEn : c.tagline}</small>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/guide"
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              {language === 'en' ? 'Print Guide & Materials' : 'ຄູ່ມືວັດສະດຸ & ເຈ້ຍ'}
            </Link>
            <button
              type="button"
              className="nav-link nav-link-btn"
              onClick={() => handleNavAnchor('#how-it-works')}
            >
              {t('navHowItWorks')}
            </button>
            <button
              type="button"
              className="nav-link nav-link-btn"
              onClick={() => handleNavAnchor('#contact')}
            >
              {t('navContact')}
            </button>
          </div>

          <div className="header-actions">
            <LanguageSwitcher />
            <CurrencySwitcher />
            <button
              type="button"
              className="btn btn--gold btn--track shadow-glow"
              onClick={() => navigate('/track')}
            >
              <SearchIcon size={18} />
              <span>{t('navTrack')}</span>
            </button>
            <button
              type="button"
              className="header-cart-btn hidden-mobile"
              onClick={openCart}
              aria-label="Open Shopping Cart"
              title={t('cartTitle')}
            >
              <CartIcon size={20} />
              {cartCount > 0 && (
                <span className="header-cart-badge">{cartCount}</span>
              )}
            </button>
            {customerPhone ? (
              <div className="flex items-center gap-1.5 hidden-mobile">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-500/20 transition cursor-pointer"
                  onClick={() => setIsProfileOpen(true)}
                  title="ຂໍ້ມູນສະມາຊິກ & ທີ່ຢູ່ຈັດສົ່ງ"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="font-mono text-[11px]">{customerPhone}</span>
                </button>
                <button
                  type="button"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  onClick={() => setIsOrdersOpen(true)}
                  title="ປະຫວັດການສັ່ງຊື້ (Order History)"
                >
                  <ShoppingBag className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-amber-500 hover:text-slate-950 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer hidden-mobile"
                onClick={() => setIsProfileOpen(true)}
                title="ເຂົ້າສູ່ລະບົບສະມາຊິກ"
              >
                <User className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Sign In' : 'ເຂົ້າສູ່ລະບົບ'}</span>
              </button>
            )}
          </div>
        </nav>

        {/* Mobile Header Quick Actions */}
        <div className="header-mobile-actions">
          <LanguageSwitcher />
          <button
            type="button"
            className="header-cart-btn"
            onClick={openCart}
            aria-label="Open Shopping Cart"
            title={t('cartTitle')}
          >
            <CartIcon size={20} />
            {cartCount > 0 && (
              <span className="header-cart-badge">{cartCount}</span>
            )}
          </button>
          <button
            type="button"
            className="header-cart-btn"
            onClick={() => setIsProfileOpen(true)}
            title="ເຂົ້າສູ່ລະບົບ / ທີ່ຢູ່"
            style={{ padding: '8px' }}
          >
            <User className="w-5 h-5 text-slate-700" />
          </button>
          {customerPhone && (
            <button
              type="button"
              className="header-cart-btn"
              onClick={() => setIsOrdersOpen(true)}
              title="ປະຫວັດການສັ່ງຊື້"
              style={{ padding: '8px' }}
            >
              <ShoppingBag className="w-5 h-5 text-slate-700" />
            </button>
          )}
          <button
            type="button"
            className="header-burger"
            aria-label="Toggle Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className={menuOpen ? 'is-x' : ''} />
            <span className={menuOpen ? 'is-x' : ''} />
            <span className={menuOpen ? 'is-x' : ''} />
          </button>
        </div>
      </div>

      <CustomerProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)}
        onLoginSuccess={(phone) => setCustomerPhone(phone)}
      />
      <CustomerOrderHistoryDrawer 
        isOpen={isOrdersOpen} 
        onClose={() => setIsOrdersOpen(false)}
        phone={customerPhone}
      />
    </header>
  )
}
