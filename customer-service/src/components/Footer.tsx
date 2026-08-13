import { Link } from 'react-router-dom'
import { CATEGORIES } from '../data/catalog.ts'
import {
  EmailIcon,
  FacebookIcon,
  InstagramIcon,
  PhoneIcon,
  TikTokIcon,
  WhatsAppIcon,
} from './icons.tsx'

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="header-logo-mark" aria-hidden="true">
              <svg viewBox="0 0 40 40" width="40" height="40">
                <rect width="40" height="40" rx="10" fill="#E2BD56" />
                <path d="M20 6 24 16 34 20 24 24 20 34 16 24 6 20 16 16 Z" fill="#0C2340" />
              </svg>
            </span>
            <div>
              <strong>ส้มสิ่งพิมพ์</strong>
              <em>SOM SING PHIM</em>
            </div>
          </div>
          <p>
            บริการงานพิมพ์ด่วนคุณภาพสูง ครบวงจร ทั้งอัลบั้มรูป กรอบรูปอะคริลิก
            สติ๊กเกอร์ไดคัท การ์ดเชิญ และงานพิมพ์เอกสาร สั่งง่ายผ่าน Google Drive
            ไม่ต้องสมัครสมาชิก
          </p>
          <div className="footer-socials">
            {[
              { label: 'Facebook', href: 'https://www.facebook.com/', Icon: FacebookIcon },
              { label: 'Instagram', href: 'https://www.instagram.com/', Icon: InstagramIcon },
              { label: 'TikTok', href: 'https://www.tiktok.com/', Icon: TikTokIcon },
              { label: 'WhatsApp', href: 'https://wa.me/66812345678', Icon: WhatsAppIcon },
              { label: 'Email', href: 'mailto:som.sing.phim@gmail.com', Icon: EmailIcon },
            ].map(({ label, href, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        <div className="footer-col">
          <h4>หมวดหมู่สินค้า</h4>
          <ul>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link to={`/category/${c.slug}`}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h4>ข้อมูลเพิ่มเติม</h4>
          <ul>
            <li>
              <Link to="/track">ติดตามสถานะงานพิมพ์</Link>
            </li>
            <li>
              <a href="#how-it-works">วิธีการสั่งซื้อ</a>
            </li>
            <li>
              <a href="#contact">ติดต่อเรา</a>
            </li>
            <li>
              <a href="#shipping">เงื่อนไขการจัดส่ง</a>
            </li>
          </ul>
        </div>

        <div className="footer-col footer-contact">
          <h4>ติดต่อเรา</h4>
          <ul className="contact-list">
            <li>
              <PhoneIcon size={18} /> 081-234-5678
            </li>
            <li>
              <EmailIcon size={18} /> som.sing.phim@gmail.com
            </li>
            <li>
              <WhatsAppIcon size={18} /> แชตแอดมินได้ตลอด 24 ชม.
            </li>
          </ul>
          <Link to="/track" className="btn btn--outline-gold btn--sm">
            สอบถามเคสด่วน
          </Link>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <span>© {new Date().getFullYear()} ส้มสิ่งพิมพ์ SOM SING PHIM — สงวนลิขสิทธิ์</span>
          <span className="footer-payment">รับชำระผ่าน PromptPay, โอนเงินธนาคาร, ชำระปลายทาง</span>
        </div>
      </div>
    </footer>
  )
}
