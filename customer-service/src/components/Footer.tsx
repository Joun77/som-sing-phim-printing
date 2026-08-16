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
} from './icons.tsx'

export default function Footer() {
  const { t, language } = useShop()

  return (
    <footer className="footer" id="contact">
      <div className="container footer-grid">
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
            {language === 'en'
              ? 'Professional fast digital printing services in Laos. Catalogs, books, stickers, acrylic frames, and customized corporate packaging. Easy online ordering without registration.'
              : 'ບໍລິການງານພິມດ່ວນຄຸນນະພາບສູງ ຄົບວົງຈອນ ທັງສະຕິກເກີ, ປ້າຍ, ປຶ້ມ, ນາມບັດ, ກ່ອງບັນຈຸພັນ ສັ່ງງ່າຍ ຈັດສົ່ງໄວທົ່ວປະເທດລາວ ບໍ່ຕ້ອງສະໝັກສະມາຊິກ.'}
          </p>
          <div className="footer-socials">
            {[
              { label: 'Facebook', href: 'https://www.facebook.com/', Icon: FacebookIcon },
              { label: 'Instagram', href: 'https://www.instagram.com/', Icon: InstagramIcon },
              { label: 'TikTok', href: 'https://www.tiktok.com/', Icon: TikTokIcon },
              { label: 'WhatsApp', href: 'https://wa.me/8562088888888', Icon: WhatsAppIcon },
              { label: 'Email', href: 'mailto:som.sing.phim@gmail.com', Icon: EmailIcon },
            ].map(({ label, href, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        <div className="footer-col">
          <h4>{t('navCategories')}</h4>
          <ul>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link to={`/category/${c.slug}`}>{language === 'en' ? c.nameEn : c.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h4>{language === 'en' ? 'Quick Links' : 'ຂໍ້ມູນເພີ່ມເຕີມ'}</h4>
          <ul>
            <li>
              <Link to="/track">{t('navTrack')}</Link>
            </li>
            <li>
              <a href="#how-it-works">{t('navHowItWorks')}</a>
            </li>
            <li>
              <a href="#contact">{t('navContact')}</a>
            </li>
          </ul>
        </div>

        <div className="footer-col footer-contact">
          <h4>{t('navContact')}</h4>
          <ul className="contact-list">
            <li>
              <PhoneIcon size={18} /> +856 20 8888 8888
            </li>
            <li>
              <EmailIcon size={18} /> som.sing.phim@gmail.com
            </li>
            <li>
              <WhatsAppIcon size={18} /> {language === 'en' ? '24/7 WhatsApp Support' : 'ຕິດຕໍ່ແອດມິນໄດ້ຕະຫຼອດ 24 ຊມ.'}
            </li>
          </ul>
          <Link to="/track" className="btn btn--outline-gold btn--sm">
            {t('trackTitle')}
          </Link>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <span>© {new Date().getFullYear()} {t('appName')} {t('appSub')} — All Rights Reserved</span>
          <span className="footer-payment">
            {language === 'en'
              ? 'Accepts BCEL OnePay QR, Bank Transfer & COD Logistics'
              : 'ຮັບຊຳລະຜ່ານ BCEL OnePay QR, ໂອນເງິນຜ່ານທະນາຄານ, ແລະ ຊຳລະປາຍທາງ'}
          </span>
        </div>
      </div>
    </footer>
  )
}
