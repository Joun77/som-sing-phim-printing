import { useState, type FormEvent } from 'react'
import { trackOrder, type Order } from '../api/client.ts'
import { formatMoney } from '../utils/currency.ts'
import { useShop } from '../context/ShopContext.tsx'
import {
  SearchIcon,
  TruckIcon,
  WhatsAppIcon,
} from '../components/icons.tsx'

interface Step {
  key: string
  title: string
  desc: string
  icon: string
}

const STEPS: Step[] = [
  {
    key: 'PENDING_SLIP_CHECK',
    title: 'ได้รับออเดอร์แล้ว',
    desc: 'รอแอดมินตรวจสอบสลิป',
    icon: 'receive',
  },
  { key: 'PAYMENT_APPROVED', title: 'ยืนยันการชำระเงินแล้ว', desc: 'แอดมินอนุมัติสลิปแล้ว', icon: 'pay' },
  { key: 'IN_PRODUCTION', title: 'กำลังดำเนินการพิมพ์ / ขึ้นงาน', desc: 'งานอยู่ในระหว่างการผลิต', icon: 'print' },
  { key: 'SHIPPED', title: 'จัดส่งเรียบร้อยแล้ว', desc: 'อยู่ระหว่างการขนส่ง', icon: 'ship' },
  { key: 'DELIVERED', title: 'ถึงมือผู้รับแล้ว', desc: 'ส่งมอบสำเร็จ', icon: 'deliver' },
]

const STATUS_ORDER = STEPS.map((s) => s.key)

function stepIndex(status: string) {
  const i = STATUS_ORDER.indexOf(status)
  return i === -1 ? 0 : i
}

function TimelineIcon({ type }: { type: string }) {
  const map = {
    receive: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="m3 8 9 6 9-6" />
      </svg>
    ),
    pay: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.5 20 5.5v6.2c0 4.6-3.3 8-8 9.8-4.7-1.8-8-5.2-8-9.8V5.5z" />
        <path d="m8.5 12 2.3 2.3 4.7-4.7" />
      </svg>
    ),
    print: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9V3h12v6" />
        <rect x="4" y="9" width="16" height="9" rx="1.5" />
        <path d="M7 13h10v8H7z" />
      </svg>
    ),
    ship: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1.5 6.5h13v11h-13z" />
        <path d="M14.5 10h4.6l3.4 3.6v3.9h-8" />
        <circle cx="6" cy="18.5" r="1.8" />
        <circle cx="17.5" cy="18.5" r="1.8" />
      </svg>
    ),
    deliver: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m4.5 12.5 5 5 10-11" />
      </svg>
    ),
  }
  return map[type] || map.receive
}

export default function TrackingPage() {
  const [query, setQuery] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const { currency, convertTo } = useShop()

  const search = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setNotFound(false)
    setOrder(null)
    try {
      const res = await trackOrder(q)
      if (res) setOrder(res)
      else setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const waMessage = order
    ? encodeURIComponent(
        `สวัสดีค่ะ/ครับ ฉันต้องการสอบถามเคสด่วนของออเดอร์ ${order.order_id} ชื่อ ${order.customer_name || ''}`
      )
    : ''

  return (
    <section className="section section--alt tracking-page">
      <div className="container tracking-container">
        <div className="section-head">
          <span className="eyebrow">Order Tracking</span>
          <h1>ติดตามสถานะงานพิมพ์</h1>
          <p>ค้นหาสถานะงานพิมพ์ด้วย Order ID เพียงอย่างเดียว ไม่ต้องใช้เบอร์โทรศัพท์</p>
        </div>

        <form className="tracking-search" onSubmit={search}>
          <div className="tracking-search-box">
            <SearchIcon size={22} />
            <input
              type="text"
              placeholder="กรอก Order ID เช่น SSP-88291"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn--gold btn--lg" disabled={loading || !query.trim()}>
            {loading ? 'กำลังค้นหา…' : 'ค้นหาสถานะ'}
          </button>
        </form>
        <p className="text-center field-hint">
          ตัวอย่าง: ลองค้นหา SSP-00001, SSP-00002, SSP-00003, SSP-00004 หรือ SSP-00005
        </p>

        {notFound && (
          <div className="tracking-empty">
            <p>ไม่พบคำสั่งซื้อหมายเลข "{query.trim()}"</p>
            <p className="field-hint">กรุณาตรวจสอบ Order ID อีกครั้ง หรือติดต่อแอดมินผ่าน WhatsApp</p>
          </div>
        )}

        {order && (
          <div className="tracking-result">
            <div className="tracking-order-head">
              <div>
                <span className="eyebrow">Order ID</span>
                <h2 className="tracking-order-id">{order.order_id}</h2>
                <p className="text-muted">
                  ชื่อลูกค้า: {order.customer_name || '—'} · วันที่สั่ง:{' '}
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString('th-TH', { dateStyle: 'medium' })
                    : '—'}
                </p>
              </div>
              <div className="tracking-order-status">
                <span className="tracking-status-label">
                  {STEPS[stepIndex(order.status)]?.title}
                </span>
                <span className={`badge badge--green`}>
                  {order.status === 'DELIVERED' ? 'จัดส่งสำเร็จแล้ว' : 'กำลังดำเนินการ'}
                </span>
              </div>
            </div>

            <div className="timeline">
              {STEPS.map((step, i) => {
                const current = i === stepIndex(order.status)
                const done = i <= stepIndex(order.status)
                const isLast = i === STEPS.length - 1
                return (
                  <div key={step.key} className={`timeline-step ${done ? 'is-done' : ''} ${current ? 'is-current' : ''}`}>
                    <div className="timeline-dot">
                      <TimelineIcon type={step.icon} />
                    </div>
                    {!isLast && <div className={`timeline-line ${done ? 'is-done' : ''}`} />}
                    <div className="timeline-content">
                      <h3>{step.title}</h3>
                      <p>{step.desc}</p>
                      {current && order.timeline?.find((t) => t.status === step.key)?.at && (
                        <small>
                          อัปเดตล่าสุด:{' '}
                          {new Date(
                            order.timeline.find((t) => t.status === step.key).at
                          ).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                        </small>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {order.status === 'SHIPPED' || order.status === 'DELIVERED' ? (
              <div className="tracking-shipping">
                <TruckIcon size={20} />
                <div>
                  <strong>เลขพัสดุ (Tracking Number)</strong>
                  <p className="tracking-number">{order.tracking_number || order.tracking || '—'}</p>
                  {order.shipping_courier && <small>ขนส่ง: {order.shipping_courier}</small>}
                </div>
              </div>
            ) : null}

            {order.total_price ? (
              <div className="tracking-order-summary">
                <span>ยอดชำระ</span>
                <strong>{formatMoney(convertTo(order.total_price), currency)}</strong>
                <span className="badge badge--green">ชำระเงินแล้ว</span>
              </div>
            ) : null}

            <a
              href={`https://wa.me/66812345678?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--navy btn--lg btn--block tracking-wa"
            >
              <WhatsAppIcon size={20} /> ติดต่อแอดมินผ่าน WhatsApp (เคสด่วน)
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
