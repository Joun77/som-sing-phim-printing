import { Link } from 'react-router-dom'
import { ClockIcon, PrinterIcon, ShieldIcon, SparkleIcon, TruckIcon } from './icons.tsx'

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-blob hero-blob--1" />
        <div className="hero-blob hero-blob--2" />
        <div className="hero-grid" />
      </div>

      <div className="container hero-inner">
        <div className="hero-copy">
          <span className="hero-badge">
            <SparkleIcon size={16} /> งานพิมพ์ด่วนคุณภาพสูง — ส่งทั่วไทย
          </span>
          <h1>
            สั่งพิมพ์ง่าย ๆ ได้ใน
            <span className="hero-gold"> 3 ขั้นตอน</span>
          </h1>
          <p className="hero-sub">
            เลือกสินค้า → แนบไฟล์งานผ่าน Google Drive → โอนเงินพร้อมส่งสลิป
            เราดูแลพิมพ์และจัดส่งให้ถึงมือคุณ พร้อมติดตามสถานะแบบเรียลไทม์
          </p>
          <div className="hero-cta">
            <Link to="/category/albums" className="btn btn--gold btn--lg">
              สั่งพิมพ์เลย
            </Link>
            <Link to="/track" className="btn btn--outline-gold btn--lg">
              ติดตามสถานะงานพิมพ์
            </Link>
          </div>

          <ul className="hero-points">
            <li>
              <ShieldIcon size={20} /> ราคาคุ้มค่า โปร่งใส
            </li>
            <li>
              <PrinterIcon size={20} /> พิมพ์รวดเร็ว ภายใน 24-72 ชม.
            </li>
            <li>
              <TruckIcon size={20} /> จัดส่งทั่วประเทศ
            </li>
            <li>
              <ClockIcon size={20} /> ติดตามสถานะได้ตลอด
            </li>
          </ul>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-card hero-card--main">
            <svg viewBox="0 0 320 240">
              <defs>
                <linearGradient id="heroCardG" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#E2BD56" />
                  <stop offset="100%" stopColor="#C59B27" />
                </linearGradient>
              </defs>
              <rect width="320" height="240" rx="20" fill="url(#heroCardG)" />
              <rect x="18" y="18" width="284" height="204" rx="14" fill="#0C2340" />
              <rect x="18" y="18" width="284" height="52" rx="14" fill="#07152B" />
              <circle cx="56" cy="44" r="16" fill="#E2BD56" />
              <rect x="86" y="34" width="90" height="8" rx="4" fill="#fff" opacity="0.9" />
              <rect x="86" y="50" width="60" height="6" rx="3" fill="#fff" opacity="0.45" />
              <rect x="30" y="88" width="120" height="90" rx="8" fill="#fff" opacity="0.96" />
              <circle cx="62" cy="114" r="9" fill="#E2BD56" />
              <path d="M30 170 L92 128 L120 146 L150 118 V178 H30 Z" fill="#C59B27" opacity="0.8" />
              <rect x="170" y="88" width="120" height="90" rx="8" fill="#E2BD56" opacity="0.92" />
              <path d="M170 178 V120 L210 142 L238 122 L290 178 Z" fill="#0C2340" opacity="0.55" />
              <rect x="30" y="196" width="56" height="7" rx="3.5" fill="#fff" opacity="0.5" />
              <rect x="96" y="196" width="42" height="7" rx="3.5" fill="#fff" opacity="0.3" />
              <rect x="170" y="196" width="64" height="7" rx="3.5" fill="#fff" opacity="0.5" />
            </svg>
          </div>
          <div className="hero-card hero-card--float hero-card--1">
            <PrinterIcon size={20} />
            <div>
              <strong>พิมพ์เสร็จไว</strong>
              <small>เริ่มผลิตภายใน 24 ชม.</small>
            </div>
          </div>
          <div className="hero-card hero-card--float hero-card--2">
            <TruckIcon size={20} />
            <div>
              <strong>จัดส่งทั่วไทย</strong>
              <small>Flash / J&T / Kerry</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
