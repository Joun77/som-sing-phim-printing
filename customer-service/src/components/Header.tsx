import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useShop } from '../context/ShopContext.tsx'
import {
  ChevronDownIcon,
  SearchIcon,
  CheckIcon,
  CartIcon,
} from './icons.tsx'
import { CURRENCIES } from '../utils/currency.ts'
import { CATEGORIES } from '../data/catalog.ts'
import { User, ShoppingBag, Crown, ChevronDown, MapPin, LogOut } from 'lucide-react'
import { CustomerProfileModal } from './customer/CustomerProfileModal.tsx'
import { CustomerOrderHistoryDrawer } from './customer/CustomerOrderHistoryDrawer.tsx'

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
      <span className="lang-toggle-flag text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700" aria-hidden="true">
        {badge}
      </span>
      <span className="lang-toggle-label">{label}</span>
    </button>
  )
}

function CurrencySwitcher() {
  const { currency, setCurrency, rates, language } = useShop()
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
        <span className="currency-code font-bold whitespace-nowrap">{currency === 'LAK' ? '₭ LAK' : currency === 'THB' ? '฿ THB' : '$ USD'}</span>
        <ChevronDownIcon />
      </button>

      {open && (
        <div className="currency-menu" role="listbox">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              className={`currency-menu-item ${c.code === currency ? 'is-active' : ''}`}
              role="option"
              aria-selected={c.code === currency}
              onClick={() => {
                setCurrency(c.code)
                setOpen(false)
              }}
            >
              <span className="currency-code font-mono">{c.code}</span>
              <span className="currency-name">{c.name}</span>
              {c.code === currency && <CheckIcon />}
            </button>
          ))}
          {rates && (
            <div className="currency-menu-rate text-[10px]">
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
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const { 
    t, 
    language, 
    openCart, 
    cartCount, 
    categories = [],
    customerProfile,
    isLoggedIn,
    isProfileModalOpen,
    setIsProfileModalOpen,
    logoutCustomer
  } = useShop()
  const [isOrdersOpen, setIsOrdersOpen] = useState(false)
  const catTimeoutRef = useRef<number | null>(null)
  const catRef = useRef<HTMLDivElement>(null)

  const handleMouseEnterCat = () => {
    if (catTimeoutRef.current) {
      clearTimeout(catTimeoutRef.current)
      catTimeoutRef.current = null
    }
    setCatOpen(true)
  }

  const handleMouseLeaveCat = () => {
    catTimeoutRef.current = setTimeout(() => {
      setCatOpen(false)
    }, 200)
  }

  // Close dropdowns on route change
  useEffect(() => {
    setMenuOpen(false)
    setCatOpen(false)
    setIsProfileDropdownOpen(false)
  }, [location.pathname])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false)
      }
      if (catRef.current && !catRef.current.contains(event.target as Node)) {
        setCatOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  // Display categories with robust fallback
  const displayCategories = (categories && categories.length > 0) ? categories : CATEGORIES

  return (
    <header className="header">
      <div className="container header-inner">
        <Logo />

        <nav
          className={`header-nav ${menuOpen ? 'is-open' : ''}`}
          aria-label="Main Navigation"
        >
          {/* Main Clean Links: Home, Categories, Materials */}
          <div className="nav-links">
            <Link 
              to="/" 
              className="nav-link"
              onClick={() => {
                setMenuOpen(false)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              <span>{t('navHome')}</span>
            </Link>

            {/* Category dropdown with reliable items & stable hover */}
            <div 
              className="nav-item relative" 
              ref={catRef}
              onMouseEnter={handleMouseEnterCat}
              onMouseLeave={handleMouseLeaveCat}
            >
              <button
                type="button"
                className="nav-link nav-dropdown-trigger"
                onClick={() => setCatOpen((v) => !v)}
                aria-expanded={catOpen}
              >
                <span>{t('navCategories')}</span>
                <ChevronDownIcon size={12} />
              </button>
              {catOpen && (
                <div 
                  className="nav-dropdown" 
                  onMouseEnter={handleMouseEnterCat}
                  onMouseLeave={handleMouseLeaveCat}
                >
                  {displayCategories.map((c) => (
                    <Link
                      key={c.id || c.slug}
                      to={`/category/${c.slug}`}
                      className="nav-dropdown-item"
                      onClick={() => {
                        setCatOpen(false)
                        setMenuOpen(false)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    >
                      <strong>{language === 'en' ? (c.nameEn || c.name) : c.name}</strong>
                      <small>{language === 'en' ? (c.descriptionEn || c.shortEn || 'Explore catalog') : (c.description || c.short || 'ເບິ່ງລາຍການສິນຄ້າ')}</small>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Link to Materials & Print Guide */}
            <Link 
              to="/materials" 
              className="nav-link"
              onClick={() => {
                setMenuOpen(false)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              <span>{language === 'en' ? 'Materials & Guide' : 'ຂໍ້ມູນຜະລິດຕະພັນ'}</span>
            </Link>
          </div>

          <div className="header-actions">
            <LanguageSwitcher />
            <CurrencySwitcher />

            {/* DYNAMIC GOLDEN BUTTON: Track Order (Guest) vs Order History (Logged-in) */}
            {isLoggedIn ? (
              <button
                type="button"
                className="btn btn--gold btn--track shadow-glow flex items-center gap-1.5"
                onClick={() => navigate('/orders')}
                title="ເບິ່ງປະຫວັດການສັ່ງຊື້ທັງໝົດ"
              >
                <ShoppingBag size={18} />
                <span>{language === 'en' ? 'Order History' : 'ປະຫວັດການສັ່ງຊື້'}</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--gold btn--track shadow-glow flex items-center gap-1.5"
                onClick={() => navigate('/track')}
                title="ກວດສອບສະຖານະພັດສະດຸ"
              >
                <SearchIcon size={18} />
                <span>{t('navTrack')}</span>
              </button>
            )}

            {/* Cart Button: Exactly matches .btn--gold luxury champagne gold styling */}
            <button
              type="button"
              onClick={openCart}
              aria-label="Open Shopping Cart"
              title={t('cartTitle')}
              className="header-cart-btn btn--gold shadow-glow hidden-mobile"
            >
              <CartIcon size={20} />
              {cartCount > 0 && (
                <span className="header-cart-badge">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile Button (Logged-in vs Prominent Gold Sign-in Button) */}
            {isLoggedIn && customerProfile ? (
              <div className="relative hidden-mobile" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-400 text-slate-900 transition cursor-pointer shadow-sm group"
                  title="ໂປຣໄຟລ໌ລູກຄ້າ VIP"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 border border-amber-400 overflow-hidden flex items-center justify-center text-xs font-black text-amber-300 shadow-xs shrink-0">
                    {customerProfile.avatarUrl || customerProfile.avatar_url ? (
                      <img 
                        src={customerProfile.avatarUrl || customerProfile.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span>{(customerProfile.name || 'S').substring(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 text-xs max-w-[110px] truncate">
                        {customerProfile.name || customerProfile.phone}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-800 text-[9px] font-black shrink-0">
                        {customerProfile.tier || 'VIP'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Light Luxury Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-[100] animate-fade-in text-slate-900">
                    <div className="p-3.5 border-b border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 border border-amber-400 overflow-hidden flex items-center justify-center text-xs font-bold text-amber-300 shrink-0">
                          {customerProfile.avatarUrl || customerProfile.avatar_url ? (
                            <img 
                              src={customerProfile.avatarUrl || customerProfile.avatar_url} 
                              alt="Profile" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span>{(customerProfile.name || 'S').substring(0, 1).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-xs font-black text-slate-900 block truncate">
                            {customerProfile.name || 'ລູກຄ້າ ສົມສິ່ງພິມ VIP'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            {customerProfile.phone}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">ລະດັບສະມາຊິກ:</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 font-black text-[10px]">
                          {customerProfile.tier || 'VIP'} ({customerProfile.discountPercent || customerProfile.discount_percent || 10}% OFF)
                        </span>
                      </div>
                    </div>

                    <div className="p-1.5 space-y-0.5 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileDropdownOpen(false)
                          navigate('/profile')
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-slate-700 hover:text-blue-900 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <User className="w-4 h-4 text-blue-600" />
                        <span>ໂປຣໄຟລ໌ & ຕັ້ງຄ່າບັນຊີ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileDropdownOpen(false)
                          navigate('/orders')
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-slate-700 hover:text-amber-800 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4 text-amber-600" />
                        <span>ປະຫວັດການສັ່ງຊື້</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileDropdownOpen(false)
                          navigate('/profile#addresses')
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-slate-700 hover:text-emerald-800 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>ຈັດການທີ່ຢູ່ຈັດສົ່ງ</span>
                      </button>

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileDropdownOpen(false)
                          logoutCustomer()
                          navigate('/')
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>ອອກຈາກລະບົບ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* PROMINENT GOLD SIGN-IN BUTTON */
              <button
                type="button"
                className="btn btn--gold btn--track shadow-glow flex items-center gap-1.5 hidden-mobile"
                onClick={() => setIsProfileModalOpen(true)}
                title="ເຂົ້າສູ່ລະບົບສະມາຊິກ VIP"
              >
                <User size={18} />
                <span>{language === 'en' ? 'Sign In' : 'ເຂົ້າສູ່ລະບົບ'}</span>
              </button>
            )}
          </div>
        </nav>

        {/* Mobile Header Quick Actions: Clean Language Switcher & Menu only */}
        <div className="header-mobile-actions flex items-center gap-2">
          <LanguageSwitcher />

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
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)}
        onOpenOrders={() => {
          setIsProfileModalOpen(false)
          navigate('/orders')
        }}
      />
      <CustomerOrderHistoryDrawer 
        isOpen={isOrdersOpen} 
        onClose={() => setIsOrdersOpen(false)}
        phone={customerProfile?.phone || ''}
      />
    </header>
  )
}
