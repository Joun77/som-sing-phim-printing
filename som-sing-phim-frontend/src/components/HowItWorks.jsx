import { Link } from 'react-router-dom'
import { ArrowRightIcon } from './icons.jsx'

const STEPS = [
  {
    n: 1,
    icon: 'cart',
    title: 'เลือกสินค้าและสเปก',
    desc: 'เลือกรายการงานพิมพ์ กำหนดขนาด วัสดุ และเทคนิคพิเศษ ราคาคำนวณอัตโนมัติแบบเรียลไทม์',
  },
  {
    n: 2,
    icon: 'link',
    title: 'แนบลิงก์ Google Drive',
    desc: 'อัปโหลดไฟล์งานของคุณ แล้วแนบลิงก์ (เปิดสิทธิ์ Anyone with the link) พร้อมหมายเหตุถึงช่างพิมพ์',
  },
  {
    n: 3,
    icon: 'bank',
    title: 'โอนเงินแนบสลิป',
    desc: 'สแกน PromptPay หรือโอนผ่านธนาคาร ตามยอดรวม แล้วแนบภาพสลิปเพื่อยืนยันการชำระเงิน',
  },
  {
    n: 4,
    icon: 'truck',
    title: 'ติดตามสถานะรอรับสินค้า',
    desc: 'จด Order ID แล้วติดตามสถานะงานพิมพ์แบบเรียลไทม์ พร้อมเลขพัสดุเมื่อจัดส่งเรียบร้อย',
  },
]

function StepIcon({ type }) {
  const map = {
    cart: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="17.5" cy="20" r="1.4" />
        <path d="M2.5 3.5h2.2l2.4 12.2a1.6 1.6 0 0 0 1.6 1.3h8.9a1.6 1.6 0 0 0 1.6-1.3L21.2 8H6" />
      </svg>
    ),
    link: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13.5a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
        <path d="M14 10.5a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
      </svg>
    ),
    bank: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5 12 4l9 5.5" />
        <path d="M5 10v6.5M9.5 10v6.5M14.5 10v6.5M19 10v6.5" />
        <path d="M3.5 20h17" />
      </svg>
    ),
    truck: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1.5 6.5h13v11h-13z" />
        <path d="M14.5 10h4.6l3.4 3.6v3.9h-8" />
        <circle cx="6" cy="18.5" r="1.8" />
        <circle cx="17.5" cy="18.5" r="1.8" />
      </svg>
    ),
  }
  return map[type] || map.cart
}

export default function HowItWorks() {
  return (
    <section className="section how-it-works" id="how-it-works">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">How It Works</span>
          <h2>4 ขั้นตอนสั่งซื้อง่าย ๆ</h2>
          <p>ไม่ต้องสมัครสมาชิก ไม่ต้องเข้าสู่ระบบ — เลือกและสั่งพิมพ์ได้ทันที</p>
        </div>

        <div className="steps-grid">
          {STEPS.map((s, i) => (
            <div key={s.n} className="step-card">
              <div className="step-icon">
                <StepIcon type={s.icon} />
              </div>
              <span className="step-num">
                ขั้นตอนที่ {s.n} <em>STEP 0{s.n}</em>
              </span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              {i < STEPS.length - 1 && <span className="step-arrow" aria-hidden="true" />}
            </div>
          ))}
        </div>

        <div className="how-cta">
          <Link to="/category/albums" className="btn btn--gold btn--lg">
            เริ่มสั่งพิมพ์เลย <ArrowRightIcon size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
