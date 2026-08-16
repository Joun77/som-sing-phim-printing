import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { CATEGORIES } from '../data/catalog.ts'
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
import ThemeToggle from './ThemeToggle.tsx'

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

  return (
    <div className="luxury-lang-switcher" role="group" aria-label="Language Switcher">
      <button
        type="button"
        onClick={() => setLanguage('lo')}
        className={`luxury-lang-btn ${language === 'lo' ? 'is-active' : ''}`}
        aria-pressed={language === 'lo'}
      >
        <span>ລາວ (LAO)</span>
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`luxury-lang-btn ${language === 'en' ? 'is-active' : ''}`}
        aria-pressed={language === 'en'}
      >
        <span>EN (ENG)</span>
      </button>
    </div>
  )
}

function CurrencySwitcher() {
  const { currency, setCurrency, convertTo, rates, ratesLoaded } = useShop()
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
          {ratesLoaded && currency === 'LAK' && (
            <div className="currency-note">ອັດຕາ: 1 THB ≈ ₭ {Math.round(convertTo(1))}</div>
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
  const { t, language, openCart, cartCount } = useShop()

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
                  {CATEGORIES.map((c) => (
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
            <ThemeToggle />
            <LanguageSwitcher />
            <CurrencySwitcher />
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
              className="btn btn--gold btn--track shadow-glow"
              onClick={() => navigate('/track')}
            >
              <SearchIcon size={18} />
              <span>{t('navTrack')}</span>
            </button>
          </div>
        </nav>

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
    </header>
  )
}
