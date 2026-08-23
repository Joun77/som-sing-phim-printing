import { useState, useEffect, type FormEvent } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { trackOrder, approveDigitalProof, rejectDigitalProof, type Order } from '../api/client.ts'
import { formatMoney } from '../utils/currency.ts'
import { useShop } from '../context/ShopContext.tsx'
import { computePrice, type PriceBreakdown } from '../utils/pricing.ts'
import {
  SearchIcon,
  TruckIcon,
  WhatsAppIcon,
  CheckIcon,
  PrinterIcon,
  FileCheckIcon,
  PackageIcon,
  RefreshIcon,
  AlertCircleIcon,
  FileTextIcon,
  SparkleIcon,
  EyeIcon,
} from '../components/icons.tsx'

interface Step {
  key: string
  title: string
  desc: string
  icon: 'receive' | 'prepress' | 'proof' | 'print' | 'finishing' | 'ship' | 'deliver'
}

const STEPS_LO: Step[] = [
  { key: 'PENDING_PAYMENT', title: '1. ຮັບອໍເດີ & ລໍຖ້າກວດສອບສະລິບ', desc: 'ລະບົບໄດ້ຮັບລາຍການສັ່ງຊື້ແລ້ວ ກຳລັງກວດສອບຍອດໂອນ BCEL OnePay', icon: 'receive' },
  { key: 'ORDER_CREATED', title: '2. ກວດສອບໄຟລ໌ & ສີ CMYK (Preflight)', desc: 'ທີມງານກຣາຟິກກວດສອບຂະໜາດ, ຄວາມລະອຽດພາບ ແລະ Color Profile', icon: 'prepress' },
  { key: 'FILE_CONFIRMED', title: '3. ຢືນຢັນແບບພິມ (Proof Approved)', desc: 'ລູກຄ້າ ແລະ ຊ່າງພິມກວດສອບຢືນຢັນໄຟລ໌ຕົວຢ່າງຮຽບຮ້ອຍ', icon: 'proof' },
  { key: 'IN_PRODUCTION', title: '4. ກຳລັງດຳເນີນການພິມ (Printing)', desc: 'ຕັດສະຕັອກວັດສະດຸ ແລະ ສົ່ງຄິວພິມລົງເຄື່ອງພິມດິຈິຕອນມາດຕະຖານສູງ', icon: 'print' },
  { key: 'POST_PRESS', title: '5. ຕັດ, ພັບ, ເຄືອບ & QC (Finishing)', desc: 'ຂັ້ນຕອນຫຼັງການພິມ ໄດຄັດຕາມແບບ ແລະ ກວດສອບຄຸນນະພາບ', icon: 'finishing' },
  { key: 'SHIPPED', title: '6. ສົ່ງມອບບໍລິສັດຂົນສົ່ງ (In Transit)', desc: 'ຈັດສົ່ງຜ່ານ Anousith Express / HAL Logistics ພ້ອມເລກ Tracking', icon: 'ship' },
]

const STEPS_EN: Step[] = [
  { key: 'PENDING_PAYMENT', title: '1. Payment Verification', desc: 'Order received. Verifying BCEL OnePay payment confirmation.', icon: 'receive' },
  { key: 'ORDER_CREATED', title: '2. Preflight & CMYK Check', desc: 'Graphic team is verifying resolution, bleed, and color profiles.', icon: 'prepress' },
  { key: 'FILE_CONFIRMED', title: '3. Proof Approved', desc: 'Print-ready artwork proof is verified and signed off.', icon: 'proof' },
  { key: 'IN_PRODUCTION', title: '4. In Production (Printing)', desc: 'Materials allocated from stock and running on high-precision digital presses.', icon: 'print' },
  { key: 'POST_PRESS', title: '5. Finishing & QC', desc: 'Lamination, die-cutting, binding, and quality assurance.', icon: 'finishing' },
  { key: 'SHIPPED', title: '6. Shipped & Delivered', desc: 'Dispatched via Anousith Express / HAL Logistics with tracking code.', icon: 'ship' },
]

function stepIndex(status: string) {
  const map: Record<string, number> = {
    PENDING_PAYMENT: 0,
    PENDING_SLIP_CHECK: 0,
    WAITING_DEPOSIT: 0,
    DRAFT: 0,
    ORDER_CREATED: 1,
    PAYMENT_APPROVED: 1,
    PREPRESS_CHECK: 1,
    WAITING_APPROVAL: 1,
    FILE_CONFIRMED: 2,
    READY_TO_PRINT: 2,
    IN_PRODUCTION: 3,
    POST_PRESS: 4,
    FINISHING: 4,
    SHIPPED: 5,
    READY_FOR_DELIVERY: 5,
    DELIVERED: 5,
    COMPLETED: 5,
  }
  return map[status] ?? 0
}

function StepIconRenderer({ type }: { type: Step['icon'] }) {
  switch (type) {
    case 'receive':
      return <FileCheckIcon size={20} />
    case 'prepress':
      return <FileTextIcon size={20} />
    case 'proof':
      return <CheckIcon size={20} />
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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || searchParams.get('order') || '')
  const [order, setOrder] = useState<Order | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const [proofApproved, setProofApproved] = useState(false)
  const [revisionRequested, setRevisionRequested] = useState(false)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [showRevisionBox, setShowRevisionBox] = useState(false)
  const [isSubmittingProof, setIsSubmittingProof] = useState(false)
  const [zoomProof, setZoomProof] = useState(false)
  const [reorderSuccess, setReorderSuccess] = useState(false)

  const { currency, convertTo, t, language, addToCart, openCart, getProduct } = useShop()
  const steps = language === 'en' ? STEPS_EN : STEPS_LO

  const executeSearch = async (orderId: string) => {
    const q = orderId.trim()
    if (!q) return
    setLoading(true)
    setNotFound(false)
    setReorderSuccess(false)
    try {
      const res = await trackOrder(q)
      if (res) {
        setOrder(res)
        if (res.status === 'FILE_CONFIRMED' || stepIndex(res.status) >= 2 || res.proof_approved_at) {
          setProofApproved(true)
        } else {
          setProofApproved(false)
        }
        if (res.status === 'PROOF_REJECTED' || res.proof_rejected_at) {
          setRevisionRequested(true)
        } else {
          setRevisionRequested(false)
        }
      } else {
        setOrder(null)
        setNotFound(true)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('order') || searchParams.get('orderId')
    if (q) {
      setQuery(q)
      executeSearch(q)
    }
  }, [searchParams])

  useEffect(() => {
    if (!order) return
    const interval = setInterval(() => {
      const id = order.order_id || order.id
      if (id) {
        trackOrder(id).then((res) => {
          if (res && res.status !== order.status) {
            setOrder(res)
          }
        }).catch(() => {})
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [order])

  const handleApproveProof = async () => {
    if (!order) return
    setIsSubmittingProof(true)
    try {
      await approveDigitalProof(order.order_id || order.id || '', order.customer_name || 'Customer')
      setProofApproved(true)
      setOrder((prev) => (prev ? { ...prev, status: 'FILE_CONFIRMED', proof_approved_at: new Date().toISOString() } : null))
    } catch (err) {
      console.error('Failed to approve proof:', err)
    } finally {
      setIsSubmittingProof(false)
    }
  }

  const handleSendRevision = async () => {
    if (!revisionNotes.trim() || !order) return
    setIsSubmittingProof(true)
    try {
      await rejectDigitalProof(order.order_id || order.id || '', revisionNotes.trim())
      setRevisionRequested(true)
      setShowRevisionBox(false)
      setOrder((prev) => (prev ? { ...prev, status: 'PREPRESS_CHECK', proof_rejection_reason: revisionNotes.trim() } : null))
    } catch (err) {
      console.error('Failed to submit revision:', err)
    } finally {
      setIsSubmittingProof(false)
    }
  }

  const handleReorder = () => {
    if (!order) return
    const targetSlug = order.product_id || 'brochures'
    const product = getProduct(targetSlug) || getProduct('brochures') || {
      id: targetSlug,
      slug: targetSlug,
      name: order.product_id || 'Custom Print Order',
      nameEn: order.product_id || 'Custom Print Order',
      category: 'general',
      bestseller: false,
      basePrice: order.total_price && order.quantity ? Math.round(order.total_price / order.quantity) : 50,
      image: 'album',
      short: '',
      shortEn: '',
      description: '',
      descriptionEn: '',
      sizes: [{ id: order.specs?.size || 'standard', label: order.specs?.size || 'Standard', hint: '', add: 0 }],
      materials: [{ id: order.specs?.paper || 'standard', label: order.specs?.paper || 'Standard', hint: '', add: 0 }],
      finishings: [{ id: order.specs?.finishing || 'standard', label: order.specs?.finishing || 'Standard', hint: '', add: 0 }],
    }

    const sizeId = product.sizes.find(s => s.label === order.specs?.size || s.id === order.specs?.size)?.id || product.sizes[0]?.id || 'standard'
    const materialId = product.materials.find(m => m.label === order.specs?.paper || m.id === order.specs?.paper)?.id || product.materials[0]?.id || 'standard'
    const finishingId = product.finishings.find(f => f.label === order.specs?.finishing || f.id === order.specs?.finishing)?.id || product.finishings[0]?.id || 'standard'
    const qty = order.quantity || 1

    const computed = computePrice(product, { sizeId, materialId, finishingId, quantity: qty })
    const priceBreakdown: PriceBreakdown = computed || {
      unitPrice: order.total_price && qty ? Math.round((order.total_price / qty) * 100) / 100 : 50,
      total: order.total_price || 50,
      totalTHB: order.total_price || 50,
      qty,
      discount: 0,
    }

    addToCart({
      product,
      config: {
        sizeId,
        materialId,
        finishingId,
        quantity: qty,
        specLabels: {
          size: order.specs?.size || product.sizes[0]?.label || 'Standard',
          paper: order.specs?.paper || product.materials[0]?.label || 'Standard',
          finishing: order.specs?.finishing || product.finishings[0]?.label || 'Standard',
        },
      },
      driveLink: order.drive_link || order.proof_url || '',
      permissionConfirmed: order.is_permission_confirmed ?? true,
      specialNotes: order.special_notes ? `[Re-order from ${order.order_id}] ${order.special_notes}` : `[Re-order from ${order.order_id}]`,
      price: priceBreakdown,
    })

    setReorderSuccess(true)
    openCart()
  }

  useEffect(() => {
    const initialQ = searchParams.get('q') || searchParams.get('order')
    if (initialQ) {
      setQuery(initialQ)
      executeSearch(initialQ)
    }
  }, [searchParams])

  useEffect(() => {
    if (!order?.order_id) return
    const interval = setInterval(() => {
      trackOrder(order.order_id).then((updated) => {
        if (updated) setOrder(updated)
      })
    }, 20000)
    return () => clearInterval(interval)
  }, [order?.order_id])

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
          <h1>{t('trackTitle')}</h1>
          <p>{t('trackSub')}</p>
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
            {loading ? <RefreshIcon size={18} /> : <span>{t('trackSearchBtn')}</span>}
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
            <p>{t('trackNotFound')} "{query.trim()}"</p>
            <p className="field-hint">ກະລຸນາກວດສອບ Order ID ອີກຄັ້ງ ຫຼື ຕິດຕໍ່ແອດມິນຜ່ານ WhatsApp</p>
          </div>
        )}

        {order && (
          <div className="tracking-result animate-fade-in">
            <div className="tracking-order-head">
              <div>
                <span className="eyebrow">{t('trackFoundOrder')}</span>
                <h2 className="tracking-order-id">{order.order_id}</h2>
                <p className="text-muted">
                  {language === 'en' ? 'Customer' : 'ລູກຄ້າ'}: {order.customer_name || '—'} ·{' '}
                  {language === 'en' ? 'Date' : 'ວັນທີສັ່ງ'}:{' '}
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'lo-LA', { dateStyle: 'medium' })
                    : '—'}
                </p>
              </div>
              <div className="tracking-order-status">
                <span className="tracking-status-label font-bold text-slate-800">
                  {steps[currentIdx]?.title}
                </span>
                <span className={`badge ${order.status === 'DELIVERED' || order.status === 'COMPLETED' ? 'badge--green' : 'badge--gold'}`}>
                  {order.status === 'DELIVERED' || order.status === 'COMPLETED' ? (language === 'en' ? 'Completed' : 'ຈັດສົ່ງສຳເລັດ') : (language === 'en' ? 'In Progress' : 'ກຳລັງດຳເນີນການ')}
                </span>
              </div>
            </div>

            {/* Action Required Alert for Proof Approval */}
            {order.status === 'WAITING_APPROVAL' && !proofApproved && (
              <div
                className="p-4 rounded-2xl border mb-6 flex items-center justify-between gap-4 animate-pulse"
                style={{
                  background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(212, 175, 55, 0.25) 100%)',
                  borderColor: 'var(--gold)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500">
                    <SparkleIcon size={24} />
                  </div>
                  <div>
                    <h4 className="text-base font-black m-0" style={{ color: 'var(--text-main)' }}>
                      {language === 'en' ? 'Action Required: Digital Proof Ready' : '🔔 ຕ້ອງກວດສອບ: ໄຟລ໌ Proof ພ້ອມໃຫ້ກວດແລ້ວ'}
                    </h4>
                    <p className="text-xs sm:text-sm m-0" style={{ color: 'var(--text-muted)' }}>
                      {language === 'en'
                        ? 'Please inspect the digital proof below and click "Approve Proof" to begin printing.'
                        : 'ກະລຸນາກວດສອບໄຟລ໌ຕົວຢ່າງ Proof ດ້ານລຸ່ມ ແລະ ກົດ "ຢືນຢັນແບບພິມ (Approve)" ເພື່ອເລີ່ມຕົ້ນພິມຈິງ'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setZoomProof(true)}
                  className="btn btn--gold btn--sm shrink-0"
                >
                  <EyeIcon size={16} />
                  <span>{language === 'en' ? 'Review Now' : 'ກວດສອບດຽວນີ້'}</span>
                </button>
              </div>
            )}

            {order.status === 'PROOF_REJECTED' && (
              <div
                className="p-4 rounded-2xl border mb-6 flex items-center gap-3"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                }}
              >
                <div className="p-2 rounded-lg bg-red-500/20 text-red-500">
                  <AlertCircleIcon size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black m-0 text-red-400">
                    {language === 'en' ? 'Revision in Progress' : 'ກຳລັງດຳເນີນການແກ້ໄຂແບບຕາມຄຳຮ້ອງຂໍ'}
                  </h4>
                  <p className="text-xs m-0 text-slate-400">
                    {order.proof_rejection_reason
                      ? `${language === 'en' ? 'Note' : 'ລາຍລະອຽດ'}: "${order.proof_rejection_reason}"`
                      : (language === 'en' ? 'Graphic team is updating the artwork.' : 'ທີມງານກຣາຟິກກຳລັງປັບແກ້ໄຟລ໌ຕາມທີ່ທ່ານແຈ້ງ')}
                  </p>
                </div>
              </div>
            )}

            <div className="timeline">
              {steps.map((step, i) => {
                const current = i === currentIdx
                const done = i <= currentIdx
                const isLast = i === steps.length - 1
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

            <div className="tracking-proof-box" style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-gold)',
              borderRadius: '16px',
              padding: '20px',
              margin: '24px 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '8px', background: 'var(--gold-soft)', borderRadius: '10px', color: 'var(--gold)' }}>
                    <SparkleIcon size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text)' }}>{t('proofTitle')}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-dim)' }}>{t('proofSub')}</p>
                  </div>
                </div>

                {(order.proof_url || order.drive_link) && (
                  <button
                    type="button"
                    onClick={() => setZoomProof(true)}
                    className="btn btn--outline btn--sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <EyeIcon size={16} />
                    <span>{language === 'en' ? 'Interactive Proof Viewer' : 'ເບິ່ງຕົວຢ່າງ Proof ແບບລະອຽດ'}</span>
                  </button>
                )}
              </div>

              {order.proof_url && (
                <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(212,175,55,0.3)', maxHeight: '240px', display: 'flex', justifyContent: 'center', background: '#1e293b' }}>
                  <img
                    src={order.proof_url}
                    alt="Digital Proof Preview"
                    style={{ maxHeight: '240px', objectFit: 'contain', cursor: 'zoom-in' }}
                    onClick={() => setZoomProof(true)}
                  />
                </div>
              )}

              {order.drive_link && (
                <div style={{ padding: '10px 14px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.2)', marginBottom: '16px', wordBreak: 'break-all', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Google Drive / Artwork: </span>
                  <a href={order.drive_link} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
                    {order.drive_link}
                  </a>
                </div>
              )}

              {proofApproved ? (
                <div className="badge badge--green" style={{ display: 'inline-flex', padding: '8px 16px', fontSize: '0.9rem', gap: '8px' }}>
                  <CheckIcon size={18} />
                  <span>{t('proofApprovedBadge')}</span>
                </div>
              ) : revisionRequested ? (
                <div className="badge badge--gold" style={{ display: 'inline-flex', padding: '8px 16px', fontSize: '0.9rem', gap: '8px' }}>
                  <AlertCircleIcon size={18} />
                  <span>{t('revisionSubmittedBadge')}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleApproveProof}
                    className="btn btn--gold"
                    disabled={isSubmittingProof}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <CheckIcon size={18} />
                    <span>{isSubmittingProof ? 'Processing...' : t('approveProofBtn')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRevisionBox(!showRevisionBox)}
                    className="btn btn--outline"
                    disabled={isSubmittingProof}
                  >
                    <span>{t('requestRevisionBtn')}</span>
                  </button>
                </div>
              )}

              {showRevisionBox && !proofApproved && !revisionRequested && (
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(212,175,55,0.15)' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text)' }}>
                    {language === 'en' ? 'Detail what needs revision:' : 'ລະບຸລາຍລະອຽດທີ່ຕ້ອງການໃຫ້ແກ້ໄຂ:'}
                  </label>
                  <textarea
                    rows={3}
                    className="luxury-textarea"
                    placeholder={language === 'en' ? 'e.g. Please adjust background tone to match pantone...' : 'ເຊັ່ນ ຂໍປັບສີພື້ນຫຼັງໃຫ້ຕົງກັບ Pantone...'}
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                  />
                  <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleSendRevision}
                      className="btn btn--gold btn--sm"
                      disabled={!revisionNotes.trim() || isSubmittingProof}
                    >
                      {language === 'en' ? 'Send Request' : 'ສົ່ງຄຳຮ້ອງຂໍແກ້ໄຂ'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRevisionBox(false)}
                      className="btn btn--outline btn--sm"
                    >
                      {t('closeBtn')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {zoomProof && (
              <div 
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 9999,
                  background: 'rgba(0,0,0,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px'
                }}
                onClick={() => setZoomProof(false)}
              >
                <div 
                  style={{
                    background: '#0f172a',
                    borderRadius: '16px',
                    padding: '24px',
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    border: '1px solid var(--border-gold)',
                    position: 'relative'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, color: 'var(--gold)' }}>Digital Proof Zoom Review</h3>
                    <button 
                      type="button" 
                      onClick={() => setZoomProof(false)}
                      className="btn btn--outline btn--sm"
                    >
                      ✕ Close
                    </button>
                  </div>
                  <img
                    src={order.proof_url || order.drive_link || ''}
                    alt="Full Proof Preview"
                    style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }}
                  />
                </div>
              </div>
            )}

            {(order.status === 'SHIPPED' || order.status === 'DELIVERED' || order.tracking_number) && (
              <div className="tracking-shipping">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                    <TruckIcon size={24} />
                  </div>
                  <div className="flex-1">
                    <strong className="block text-slate-900">{t('trackCourierTitle')}</strong>
                    <p className="tracking-number font-mono text-lg text-accent-sky font-black">
                      {order.internal_tracking_code || order.tracking_number || order.tracking || 'AN-LAO-882910'}
                    </p>
                    <small className="text-slate-500">
                      {language === 'en' ? 'Carrier' : 'ຂົນສົ່ງ'}: {order.courier_name || order.shipping_courier || 'Anousith Express'}
                    </small>
                  </div>
                </div>
              </div>
            )}

            {/* Total Paid & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {order.total_price ? (
                <div className="tracking-order-summary">
                  <span>{t('trackTotalPaid')}</span>
                  <strong className="text-xl font-black text-slate-900">
                    {formatMoney(convertTo(order.total_price), currency)}
                  </strong>
                  <span className="badge badge--green">{t('trackPaidBadge')}</span>
                </div>
              ) : null}

              {/* One-Click Re-Order Hub Button on Completed/Delivered Orders */}
              {(order.status === 'COMPLETED' || order.status === 'DELIVERED' || stepIndex(order.status) >= 4) && (
                <div
                  className="p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.15) 0%, rgba(2, 132, 199, 0.1) 100%)',
                    borderColor: 'var(--border-gold)',
                  }}
                >
                  <div>
                    <h4 className="text-sm font-black m-0" style={{ color: 'var(--text-main)' }}>
                      🔁 สั่งพิมพ์ซ้ำ (Re-order)
                    </h4>
                    <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>
                      คัดลอกสเปกงานเดิม ({order.specs?.paper || ''} {order.specs?.size || ''}) และไฟล์อาร์ตเวิร์กลงตะกร้าทันที
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleReorder}
                    className="btn btn--gold btn--md shadow-glow w-full sm:w-auto cursor-pointer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <RefreshIcon size={18} />
                    <span>{reorderSuccess ? '✓ เพิ่มลงตะกร้าแล้ว (Added)' : '🔁 สั่งพิมพ์ซ้ำ (Re-order)'}</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleReorder}
                className="btn btn--gold btn--lg btn--block cursor-pointer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                <RefreshIcon size={20} />
                <span>{reorderSuccess ? '✓ เพิ่มลงตะกร้าสินค้าแล้ว' : '🔁 สั่งพิมพ์ซ้ำ (Re-order)'}</span>
              </button>

              <a
                href={`https://wa.me/8562088888888?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--navy btn--lg btn--block tracking-wa"
              >
                <WhatsAppIcon size={20} />
                <span>{t('trackWaBtn')}</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

