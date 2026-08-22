import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShop } from '../context/ShopContext.tsx'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
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

import PrinterLiveSimulator from './PrinterLiveSimulator.tsx'

export default function Hero() {
  const [trackInput, setTrackInput] = useState('')
  const navigate = useNavigate()
  const { t } = useShop()
  const heroRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.from('.hero-badge-group', { opacity: 0, y: -20, duration: 0.6 })
      .from('.hero-title', { opacity: 0, y: 30, duration: 0.8 }, '-=0.4')
      .from('.hero-sub', { opacity: 0, y: 20, duration: 0.6 }, '-=0.4')
      .from('.hero-search-box', { opacity: 0, y: 20, scale: 0.96, duration: 0.6 }, '-=0.3')
      .from('.hero-cta .btn', { opacity: 0, y: 15, stagger: 0.15, duration: 0.5 }, '-=0.3')
      .from('.hero-points li', { opacity: 0, y: 15, stagger: 0.1, duration: 0.4 }, '-=0.3')
      .from('.hero-visual', { opacity: 0, x: 40, scale: 0.95, duration: 0.9 }, '-=0.8')
  }, { scope: heroRef })

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (trackInput.trim()) {
      navigate(`/track?q=${encodeURIComponent(trackInput.trim())}`)
    } else {
      navigate('/track')
    }
  }

  return (
    <section className="hero" ref={heroRef}>
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

        {/* Right: Live Interactive Industrial Press Simulation */}
        <div className="hero-visual">
          <PrinterLiveSimulator />
        </div>
      </div>
    </section>
  )
}
