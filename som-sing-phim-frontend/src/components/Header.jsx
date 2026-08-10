import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CATEGORIES } from '../data/catalog.js'
import { useShop } from '../context/ShopContext.jsx'
import BackendStatus from './BackendStatus.jsx'
import {
  ChevronDownIcon,
  EmailIcon,
  FacebookIcon,
  InstagramIcon,
  SearchIcon,
  TikTokIcon,
  WhatsAppIcon,
} from './icons.jsx'
import { CURRENCIES } from '../utils/currency.js'

const SOCIALS = [
  { label: 'Facebook', href: 'https://www.facebook.com/', Icon: FacebookIcon },
  { label: 'Instagram', href: 'https://www.instagram.com/', Icon: InstagramIcon },
  { label: 'TikTok', href: 'https://www.tiktok.com/', Icon: TikTokIcon },
  { label: 'WhatsApp', href: 'https://wa.me/66812345678', Icon: WhatsAppIcon },
  { label: 'Email', href: 'mailto:som.sing.phim@gmail.com', Icon: EmailIcon },
]

function Logo() {
  return (
    <Link to="/" className="header-logo" aria-label="ส้มสิ่งพิมพ์ SOM SING PHIM หน้าแรก">
      <span className="header-logo-mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" width="36" height="36">
          <rect width="40" height="40" rx="10" fill="#0C2340" />
          <path d="M20 6 24 16 34 20 24 24 20 34 16 24 6 20 16 16 Z" fill="#E2BD56" />
        </svg>
      </span>
      <span className="header-logo-text">
        <strong>
          ส้มสิ่งพิมพ์ <em>SOM SING PHIM</em>
        </strong>
        <small>บริการงานพิมพ์คุณภาพสูง</small>
      </span>
    </Link>
  )
}

function CurrencySwitcher() {
  const { currency, setCurrency, convertTo, rates, ratesLoaded } = useShop()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
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
        <span className="currency-flag">{active.code === 'THB' ? '🇹🇭' : '🇱🇦'}</span>
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
                    : 'เงินบาทไทย'}
                </small>
              </span>
              {c.code === currency && <span className="currency-check">✓</span>}
            </button>
          ))}
          {ratesLoaded && currency === 'LAK' && (
            <div className="currency-note">อัตรา: 1 THB ≈ ₭ {Math.round(convertTo(1))}</div>
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

  return (
    <header className="header">
      <div className="container header-inner">
        <Logo />

        <nav className={`header-nav ${menuOpen ? 'is-open' : ''}`} aria-label="เมนูหลัก">
          <div className="nav-links">
            <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
              หน้าแรก
            </Link>

            <div className="nav-item has-dropdown">
              <button
                type="button"
                className="nav-link nav-dropdown-btn"
                onClick={() => setCatOpen((v) => !v)}
                aria-expanded={catOpen}
              >
                หมวดหมู่สินค้า <ChevronDownIcon />
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
                      <strong>{c.name}</strong>
                      <small>{c.nameEn}</small>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <a href="#how-it-works" className="nav-link" onClick={() => setMenuOpen(false)}>
              วิธีการสั่งซื้อ
            </a>
            <a href="#contact" className="nav-link" onClick={() => setMenuOpen(false)}>
              ติดต่อเรา
            </a>
          </div>

          <div className="header-actions">
            <BackendStatus />
            <CurrencySwitcher />
            <button
              type="button"
              className="btn btn--gold btn--track"
              onClick={() => navigate('/track')}
            >
              <SearchIcon size={18} /> ติดตามสถานะงานพิมพ์
            </button>
            <div className="header-socials">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="social-btn" aria-label={label}>
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>
        </nav>

        <button
          type="button"
          className="header-burger"
          aria-label="เปิดเมนู"
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
