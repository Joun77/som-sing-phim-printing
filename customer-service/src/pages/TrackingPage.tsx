import { useState, useEffect, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { trackOrder, type Order } from '../api/client.ts'
import { formatMoney } from '../utils/currency.ts'
import { useShop } from '../context/ShopContext.tsx'
import {
  SearchIcon,
  TruckIcon,
  WhatsAppIcon,
  CheckIcon,
  PrinterIcon,
  FileCheckIcon,
  PackageIcon,
  RefreshIcon,
  AlertCircleIcon
} from '../components/icons.tsx'

interface Step {
  key: string
  title: string
  desc: string
  icon: 'receive' | 'prepress' | 'print' | 'finishing' | 'ship' | 'deliver'
}

const STEPS: Step[] = [
  { key: 'PENDING_SLIP_CHECK', title: '1. ຮັບອໍເດີ & ລໍຖ້າກວດສອບສະລິບ', desc: 'ລະບົບໄດ້ຮັບລາຍການສັ່ງຊື້ແລ້ວ ກຳລັງກວດສອບຍອດໂອນ BCEL OnePay', icon: 'receive' },
  { key: 'PREPRESS_CHECK', title: '2. ກວດສອບໄຟລ໌ & ສີ CMYK (Preflight)', desc: 'ທີມງານກຣາຟິກກວດສອບຂະໜາດ, ຄວາມລະອຽດພາບ ແລະ Color Profile', icon: 'prepress' },
  { key: 'IN_PRODUCTION', title: '3. ກຳລັງດຳເນີນການພິມ (Printing)', desc: 'ສົ່ງຄິວພິມລົງເຄື່ອງພິມດິຈິຕອນມາດຕະຖານສູງ', icon: 'print' },
  { key: 'POST_PRESS', title: '4. ຕັດ, ພັບ, ເຄືອບ & QC (Finishing)', desc: 'ຂັ້ນຕອນຫຼັງການພິມ ໄດຄັດຕາມແບບ ແລະ ກວດສອບຄຸນນະພາບ', icon: 'finishing' },
  { key: 'SHIPPED', title: '5. ສົ່ງມອບບໍລິສັດຂົນສົ່ງ (In Transit)', desc: 'ຈັດສົ່ງຜ່ານ Anousith Express / HAL Logistics ພ້ອມເລກ Tracking', icon: 'ship' },
  { key: 'DELIVERED', title: '6. ຈັດສົ່ງສຳເລັດ (Delivered)', desc: 'ສິນຄ້າຮອດມືລູກຄ້າຮຽບຮ້ອຍ', icon: 'deliver' },
]

function stepIndex(status: string) {
  const map: Record<string, number> = {
    PENDING_SLIP_CHECK: 0,
    WAITING_DEPOSIT: 0,
    DRAFT: 0,
    PAYMENT_APPROVED: 1,
    PREPRESS_CHECK: 1,
    WAITING_APPROVAL: 1,
    READY_TO_PRINT: 2,
    IN_PRODUCTION: 2,
    POST_PRESS: 3,
    FINISHING: 3,
    SHIPPED: 4,
    READY_FOR_DELIVERY: 4,
    DELIVERED: 5,
  }
  return map[status] ?? 0
}

function StepIconRenderer({ type }: { type: Step['icon'] }) {
  switch (type) {
    case 'receive':
      return <FileCheckIcon size={20} />
    case 'prepress':
      return <FileCheckIcon size={20} />
    case 'print':
      return <PrinterIcon size={20} />
    case 'finishing':
      return <PackageIcon size={20} />
    case 'ship':
      return <TruckIcon size={20} />
    case 'deliver':
      return <CheckIcon size={20} />
  }
}

export default function TrackingPage() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || searchParams.get('order') || '')
  const [order, setOrder] = useState<Order | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const { currency, convertTo } = useShop()

  const executeSearch = async (orderId: string) => {
    const q = orderId.trim()
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

  useEffect(() => {
    const initialQ = searchParams.get('q') || searchParams.get('order')
    if (initialQ) {
      setQuery(initialQ)
      executeSearch(initialQ)
    }
  }, [searchParams])

  const search = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    executeSearch(query)
  }

  const currentIdx = order ? stepIndex(order.status) : 0

  const waMessage = order
    ? encodeURIComponent(
        `ສະບາຍດີ ຂ້ອຍຕ້ອງການສອບຖາມສະຖານະອໍເດີ ${order.order_id} ຊື່ ${order.customer_name || ''}`
      )
    : ''

  return (
    <section className="section section--alt tracking-page">
      <div className="container tracking-container">
        <div className="section-head">
          <span className="eyebrow">Order Tracking & Live Status</span>
          <h1>ຕິດຕາມສະຖານະງານພິມ</h1>
          <p>ກວດສອບສະຖານະການຜະລິດ ແລະ ເລກພັດສະດຸດ້ວຍ Order ID ໄດ້ຕະຫຼອດ 24 ຊົ່ວໂມງ</p>
        </div>

        <form className="tracking-search" onSubmit={search}>
          <div className="tracking-search-box">
            <SearchIcon size={22} />
            <input
              type="text"
              placeholder="ປ້ອນເລກ Order ID ເຊັ່ນ: SSP-88291 ຫຼື ORD-2026-001..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn--gold btn--lg shadow-glow" disabled={loading || !query.trim()}>
            {loading ? <RefreshIcon size={18} /> : <span>ກວດສອບສະຖານະ</span>}
          </button>
        </form>

        <p className="text-center field-hint">
          ຕົວຢ່າງລອງຄົ້ນຫາ: SSP-00001, SSP-00002, ORD-2026-001
        </p>

        {notFound && (
          <div className="tracking-empty">
            <div className="flex justify-center mb-2">
              <AlertCircleIcon size={32} />
            </div>
            <p>ບໍ່ພົບລາຍການສັ່ງຊື້ໝາຍເລກ "{query.trim()}"</p>
            <p className="field-hint">ກະລຸນາກວດສອບ Order ID ອີກຄັ້ງ ຫຼື ຕິດຕໍ່ແອດມິນຜ່ານ WhatsApp</p>
          </div>
        )}

        {order && (
          <div className="tracking-result animate-fade-in">
            <div className="tracking-order-head">
              <div>
                <span className="eyebrow">Order Tracking ID</span>
                <h2 className="tracking-order-id">{order.order_id}</h2>
                <p className="text-muted">
                  ລູກຄ້າ: {order.customer_name || '—'} · ວັນທີສັ່ງ:{' '}
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString('lo-LA', { dateStyle: 'medium' })
                    : '—'}
                </p>
              </div>
              <div className="tracking-order-status">
                <span className="tracking-status-label font-bold text-slate-800">
                  {STEPS[currentIdx]?.title}
                </span>
                <span className={`badge ${order.status === 'DELIVERED' ? 'badge--green' : 'badge--gold'}`}>
                  {order.status === 'DELIVERED' ? 'ຈັດສົ່ງສຳເລັດ' : 'ກຳລັງດຳເນີນການ'}
                </span>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="timeline">
              {STEPS.map((step, i) => {
                const current = i === currentIdx
                const done = i <= currentIdx
                const isLast = i === STEPS.length - 1
                return (
                  <div key={step.key} className={`timeline-step ${done ? 'is-done' : ''} ${current ? 'is-current' : ''}`}>
                    <div className="timeline-dot">
                      <StepIconRenderer type={step.icon} />
                    </div>
                    {!isLast && <div className={`timeline-line ${done ? 'is-done' : ''}`} />}
                    <div className="timeline-content">
                      <h3>{step.title}</h3>
                      <p>{step.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Shipping & Delivery Info */}
            {(order.status === 'SHIPPED' || order.status === 'DELIVERED' || order.tracking_number) && (
              <div className="tracking-shipping">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                    <TruckIcon size={24} />
                  </div>
                  <div className="flex-1">
                    <strong className="block text-slate-900">ເລກພັດສະດຸຈັດສົ່ງ (Tracking Code)</strong>
                    <p className="tracking-number font-mono text-lg text-accent-sky font-black">
                      {order.internal_tracking_code || order.tracking_number || order.tracking || 'AN-LAO-882910'}
                    </p>
                    <small className="text-slate-500">
                      ຂົນສົ່ງ: {order.courier_name || order.shipping_courier || 'Anousith Express'}
                    </small>
                  </div>
                </div>
              </div>
            )}

            {order.total_price ? (
              <div className="tracking-order-summary">
                <span>ຍອດຊຳລະທັງໝົດ</span>
                <strong className="text-xl font-black text-slate-900">
                  {formatMoney(convertTo(order.total_price), currency)}
                </strong>
                <span className="badge badge--green">ຢືນຢັນການຊຳລະເງິນແລ້ວ</span>
              </div>
            ) : null}

            <a
              href={`https://wa.me/8562088888888?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--navy btn--lg btn--block tracking-wa"
            >
              <WhatsAppIcon size={20} />
              <span>ຕິດຕໍ່ສອບຖາມແອດມິນຜ່ານ WhatsApp</span>
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
