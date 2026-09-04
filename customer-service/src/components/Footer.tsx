import React from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES } from '../data/catalog.ts'
import { useShop } from '../context/ShopContext.tsx'
import {
  EmailIcon,
  FacebookIcon,
  InstagramIcon,
  PhoneIcon,
  TikTokIcon,
  WhatsAppIcon,
  SparkleIcon,
  ShieldIcon,
  PrinterIcon
} from './icons.tsx'
import { Lock, Check } from 'lucide-react'

export default function Footer() {
  const { t, language, categories } = useShop()
  const isLao = language === 'lo'

  const SOCIAL_LINKS = [
    { label: 'Facebook Page', href: 'https://www.facebook.com/', Icon: FacebookIcon, color: '#1877F2' },
    { label: 'Instagram', href: 'https://www.instagram.com/', Icon: InstagramIcon, color: '#E4405F' },
    { label: 'TikTok', href: 'https://www.tiktok.com/', Icon: TikTokIcon, color: '#000000' },
    { label: 'WhatsApp Concierge', href: 'https://wa.me/8562088888888', Icon: WhatsAppIcon, color: '#25D366' },
    { label: 'Email Atelier', href: 'mailto:som.sing.phim@gmail.com', Icon: EmailIcon, color: 'var(--gold)' },
  ]

  return (
    <footer className="footer" id="contact">
      <div className="container footer-grid">
        {/* Brand & Printing Press Credibility */}
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="header-logo-circle" aria-hidden="true">
              <img src="/logo.png" alt="Som Sing Phim Logo" className="header-logo-img" />
            </span>
            <div>
              <strong>{t('appName')}</strong>
              <em>{t('appSub')}</em>
            </div>
          </div>
          <p>
            {isLao
              ? 'ໂຮງພິມມາດຕະຖານສູງ ລະບົບພິມ Digital & Offset Press ຄຸນນະພາບສູງ ຄົບວົງຈອນ ທັງສະຕິກເກີ, ປຶ້ມ, ນາມບັດ, ກ່ອງບັນຈຸພັນ, ປ້າຍ ແລະ ງານພິມພິເສດ ຈັດສົ່ງໄວທົ່ວປະເທດລາວ.'
              : 'Professional Digital & Offset Print Atelier in Laos. Precision catalogs, publications, stickers, acrylics, and bespoke corporate packaging. Fast nationwide delivery.'}
          </p>

          <div className="flex items-center gap-3 mt-4 mb-2">
            <div className="cmyk-bar" title="CMYK Certified Press">
              <span className="cmyk-dot cmyk-dot--c" />
              <span className="cmyk-dot cmyk-dot--m" />
              <span className="cmyk-dot cmyk-dot--y" />
              <span className="cmyk-dot cmyk-dot--k" />
            </div>
            <span className="print-registration-mark">⊕ ISO 12647 COLOR CALIBRATED</span>
          </div>

          <div className="footer-socials mt-3">
            {SOCIAL_LINKS.map(({ label, href, Icon, color }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="footer-social-btn"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="footer-col">
          <h4>{t('navCategories')}</h4>
          <ul>
            {(categories || []).map((c) => (
              <li key={c.slug}>
                <Link to={`/category/${c.slug}`}>{isLao ? c.name : c.nameEn}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Links & Policies */}
        <div className="footer-col">
          <h4>{isLao ? 'ລິ້ງດ່ວນ & ບໍລິການ' : 'Quick Links & Services'}</h4>
          <ul>
            <li>
              <Link to="/guide">{isLao ? 'ຂໍ້ມູນຜະລິດຕະພັນ & ວັດສະດຸ' : 'Product Info & Materials'}</Link>
            </li>
            <li>
              <Link to="/track">{t('navTrack')}</Link>
            </li>
            <li>
              <a href="#how-it-works">{t('navHowItWorks')}</a>
            </li>
            <li>
              <span className="text-muted text-xs flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 inline" /> {isLao ? 'ຮັບໄຟລ໌ຜ່ານ Google Drive & PDF' : 'Accepts Google Drive & Print-Ready PDF'}
              </span>
            </li>
          </ul>
        </div>

        {/* Direct Contact & Hours */}
        <div className="footer-col footer-contact">
          <h4>{t('navContact')}</h4>
          <ul className="contact-list">
            <li>
              <PhoneIcon size={18} /> <span>+856 20 8888 8888</span>
            </li>
            <li>
              <EmailIcon size={18} /> <span>som.sing.phim@gmail.com</span>
            </li>
            <li>
              <WhatsAppIcon size={18} /> <span>{isLao ? 'WhatsApp: +856 20 8888 8888' : 'WhatsApp Concierge 24/7'}</span>
            </li>
            <li>
              <PrinterIcon size={18} /> <span>{isLao ? 'ຈັນ - ເສົາ: 08:00 - 18:00' : 'Mon - Sat: 08:00 - 18:00'}</span>
            </li>
          </ul>
          <Link to="/track" className="btn btn--gold btn--sm mt-2 shadow-glow">
            {t('trackTitle')}
          </Link>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <span>© {new Date().getFullYear()} {t('appName')} {t('appSub')} — High-Precision Print Atelier</span>
          <span className="footer-payment flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-500 inline shrink-0" />
            <span>
              {isLao
                ? 'ຮັບຊຳລະຜ່ານ BCEL OnePay QR, ໂອນເງິນຜ່ານທະນາຄານ ແລະ ຈັດສົ່ງຜ່ານ Anousith & HAL'
                : 'Supports BCEL OnePay QR, Bank Transfer & Expedited Nationwide Logistics'}
            </span>
          </span>
        </div>
      </div>
    </footer>
  )
}
