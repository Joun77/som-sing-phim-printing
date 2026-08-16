import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShop } from '../context/ShopContext.tsx'
import { 
  ClockIcon, 
  PrinterIcon, 
  ShieldIcon, 
  SparkleIcon, 
  TruckIcon, 
  SearchIcon, 
  ArrowRightIcon, 
  CheckIcon,
  StarIcon
} from './icons.tsx'

export default function Hero() {
  const [trackInput, setTrackInput] = useState('')
  const navigate = useNavigate()
  const { t, language } = useShop()

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (trackInput.trim()) {
      navigate(`/track?q=${encodeURIComponent(trackInput.trim())}`)
    } else {
      navigate('/track')
    }
  }

  return (
    <section className="hero">
      {/* Dynamic Background Glows */}
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-blob hero-blob--1" />
        <div className="hero-blob hero-blob--2" />
        <div className="hero-blob hero-blob--3" />
        <div className="hero-grid" />
      </div>

      <div className="container hero-inner">
        {/* Left: Copy & Actions */}
        <div className="hero-copy">
          <div className="hero-badge-group">
            <div className="cmyk-bar" title="CMYK 4-Color Calibrated Press">
              <span className="cmyk-dot cmyk-dot--c" />
              <span className="cmyk-dot cmyk-dot--m" />
              <span className="cmyk-dot cmyk-dot--y" />
              <span className="cmyk-dot cmyk-dot--k" />
            </div>
            <span className="hero-badge">
              <SparkleIcon size={16} /> {t('heroBadge')}
            </span>
            <span className="hero-badge-pill">
              <StarIcon size={14} /> {t('heroColorQuality')}
            </span>
          </div>

          <h1 className="hero-title">
            {t('heroTitleLine1')} <br />
            <span className="hero-gold">{t('heroTitleHighlight')}</span>
          </h1>

          <p className="hero-sub">
            {t('heroSub')}
          </p>

          {/* Quick Track & Order Search Bar */}
          <form onSubmit={handleTrackSubmit} className="hero-search-box">
            <div className="hero-search-input-wrap">
              <SearchIcon size={18} />
              <input
                type="text"
                placeholder={t('heroSearchPlaceholder')}
                value={trackInput}
                onChange={(e) => setTrackInput(e.target.value)}
                aria-label="Order ID Search"
              />
            </div>
            <button type="submit" className="btn btn--gold hero-search-btn">
              <span>{t('heroSearchBtn')}</span>
              <ArrowRightIcon size={16} />
            </button>
          </form>

          {/* Action CTAs */}
          <div className="hero-cta">
            <a href="#bestsellers" className="btn btn--gold btn--lg shadow-glow">
              {t('heroOrderNowBtn')} <ArrowRightIcon size={18} />
            </a>
            <a href="#categories" className="btn btn--outline-gold btn--lg">
              {t('heroAllCategoriesBtn')}
            </a>
          </div>

          {/* Trust Value Points */}
          <ul className="hero-points">
            <li>
              <div className="point-icon"><ShieldIcon size={18} /></div>
              <span>{t('heroPoint1')}</span>
            </li>
            <li>
              <div className="point-icon"><PrinterIcon size={18} /></div>
              <span>{t('heroPoint2')}</span>
            </li>
            <li>
              <div className="point-icon"><TruckIcon size={18} /></div>
              <span>{t('heroPoint3')}</span>
            </li>
            <li>
              <div className="point-icon"><ClockIcon size={18} /></div>
              <span>{t('heroPoint4')}</span>
            </li>
          </ul>
        </div>

        {/* Right: Modern Luxury Glass Showcase Card */}
        <div className="hero-visual">
          <div className="hero-glass-card">
            {/* Top Bar */}
            <div className="hero-glass-header">
              <div className="glass-dots">
                <span className="dot dot--red" />
                <span className="dot dot--yellow" />
                <span className="dot dot--green" />
              </div>
              <div className="glass-title">SOM SING PHIM · DIGITAL & OFFSET PRESS</div>
              <span className="glass-live-pill">CMYK PROOF</span>
            </div>

            {/* Showcase Visual Content */}
            <div className="hero-glass-body">
              <div className="glass-preview-banner">
                <div className="preview-tag">NEW ARRIVAL</div>
                <h4>{language === 'en' ? 'Waterproof Glossy PP Sticker' : 'ສະຕິກເກີ PP ຂາວເງົາກັນນ້ຳ 100%'}</h4>
                <p>{language === 'en' ? 'Ultra-HD print, precision kiss-cut, easy to peel.' : 'ພິມລະອຽດສູງ ໄດຄັດຄົມຊັດ ພ້ອມລອກຕິດ'}</p>
                <div className="preview-price-tag">
                  <span>{t('startPriceLabel')}</span>
                  <strong>₭ 35,000 / Sheet</strong>
                </div>
              </div>

              {/* Dynamic Feature Badges */}
              <div className="glass-features-grid">
                <div className="feature-pill">
                  <CheckIcon size={14} /> <span>{language === 'en' ? '100% Waterproof & Freeze-proof' : 'ກັນນ້ຳ ແຊ່ຕູ້ເຢັນໄດ້'}</span>
                </div>
                <div className="feature-pill">
                  <CheckIcon size={14} /> <span>{language === 'en' ? 'Kiss-Cut & Die-Cut Single' : 'ໄດຄັດ 50% & 100%'}</span>
                </div>
                <div className="feature-pill">
                  <CheckIcon size={14} /> <span>{language === 'en' ? 'Up to 20% Volume Tier Discount' : 'ສ່ວນຫຼຸດ Tier ສູງສຸດ 20%'}</span>
                </div>
              </div>
            </div>

            {/* Floating Live Badges */}
            <div className="hero-float-card hero-float-card--1 animate-float-slow">
              <div className="float-icon-box float-icon-box--gold">
                <PrinterIcon size={20} />
              </div>
              <div>
                <strong>{language === 'en' ? 'Express 24-48h' : 'ພິມດ່ວນ 24-48 ຊມ.'}</strong>
                <small>{language === 'en' ? 'Fast professional digital print' : 'ຮອງຮັບງານດ່ວນທຸກປະເພດ'}</small>
              </div>
            </div>

            <div className="hero-float-card hero-float-card--2 animate-float-delayed">
              <div className="float-icon-box float-icon-box--green">
                <TruckIcon size={20} />
              </div>
              <div>
                <strong>{language === 'en' ? 'Nationwide Delivery' : 'ຈັດສົ່ງທົ່ວປະເທດລາວ'}</strong>
                <small>Anousith & HAL Express</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
