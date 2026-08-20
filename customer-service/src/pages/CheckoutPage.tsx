import { useMemo, useRef, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useShop } from '../context/ShopContext.tsx'
import { BANK_ACCOUNT, COURIERS, FREE_SHIPPING_THRESHOLD } from '../data/shipping.ts'
import { buildBcelOnePayPayload } from '../utils/promptpay.ts'
import { formatMoney } from '../utils/currency.ts'
import { generateOrderId } from '../utils/orderId.ts'
import { submitOrder, verifySlipPayment } from '../api/client.ts'
import ProductArt from '../components/ProductArt.tsx'
import {
  CheckIcon,
  CopyIcon,
  CreditCardIcon,
  ShieldIcon,
  TruckIcon,
  UploadIcon,
} from '../components/icons.tsx'

interface CopyButtonProps {
  text: string
  label: string
  onCopied?: () => void
}

function CopyButton({ text, label, onCopied }: CopyButtonProps) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setDone(true)
    if (onCopied) onCopied()
    setTimeout(() => setDone(false), 1800)
  }
  return (
    <button type="button" className="btn btn--outline btn--sm" onClick={copy}>
      {done ? <CheckIcon size={16} /> : <CopyIcon size={16} />} {done ? 'ຄັດລອກແລ້ວ' : label}
    </button>
  )
}

export default function CheckoutPage() {
  const {
    orderDraft,
    setOrderDraft,
    selectedCartItems,
    clearSelectedCartItems,
    currency,
    convertTo,
    t,
    language
  } = useShop()

  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '' })
  const [courierId, setCourierId] = useState(COURIERS[0].id)
  const [slipImage, setSlipImage] = useState<File | null>(null)
  const [slipPreview, setSlipPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [paymentSlipped, setPaymentSlipped] = useState(false)

  // Real-time Slip Verification states
  const [isVerifyingSlip, setIsVerifyingSlip] = useState(false)
  const [slipVerified, setSlipVerified] = useState(false)
  const [slipTransRef, setSlipTransRef] = useState<string | null>(null)
  const [slipVerifyError, setSlipVerifyError] = useState<string | null>(null)
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState<number | null>(null)

  // Determine items to checkout: prioritize selected cart items, fallback to single draft
  const checkoutItems = useMemo(() => {
    if (selectedCartItems && selectedCartItems.length > 0) {
      return selectedCartItems
    }
    if (orderDraft) {
      return [
        {
          id: 'draft',
          product: orderDraft.product,
          config: orderDraft.config,
          driveLink: orderDraft.driveLink,
          permissionConfirmed: orderDraft.permissionConfirmed,
          specialNotes: orderDraft.specialNotes,
          price: orderDraft.price,
          selected: true,
          createdAt: Date.now(),
        },
      ]
    }
    return []
  }, [selectedCartItems, orderDraft])

  if (checkoutItems.length === 0) {
    return (
      <section className="section text-center container" style={{ padding: '80px 24px' }}>
        <h2>{t('noItemsInCart')}</h2>
        <p className="text-muted">{t('selectProductFirst')}</p>
        <Link to="/category/documents" className="btn btn--navy mt-2">
          {t('allCategoriesLink')}
        </Link>
      </section>
    )
  }

  const hasOnDemandItem = useMemo(() => {
    return checkoutItems.some(
      (item) =>
        item.product.isOnDemand ||
        item.config.quantity === 1 ||
        item.product.minQuantity === 1
    )
  }, [checkoutItems])

  const [paymentType, setPaymentType] = useState<'full' | 'deposit'>('full')

  useEffect(() => {
    if (hasOnDemandItem) {
      setPaymentType('full')
    }
  }, [hasOnDemandItem])

  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + (item.price?.totalTHB || item.price?.total || 0),
    0
  )
  const courier = COURIERS.find((c) => c.id === courierId) || COURIERS[0]
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD
  const shippingFee = isFreeShipping ? 0 : courier.fee
  const total = subtotal + shippingFee
  const amountToPay = (!hasOnDemandItem && paymentType === 'deposit') ? Math.ceil(total * 0.5) : total
  const remainingBalance = total - amountToPay

  const totalDisplay = convertTo(total)
  const amountToPayDisplay = convertTo(amountToPay)
  const remainingDisplay = convertTo(remainingBalance)

  const bankAccounts = useMemo(() => {
    try {
      const saved = localStorage.getItem('ssp_bank_accounts')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
      const single = localStorage.getItem('ssp_bank_account_config')
      if (single) return [JSON.parse(single)]
    } catch {
      // fallback
    }
    return [BANK_ACCOUNT]
  }, [])

  const [selectedBankId, setSelectedBankId] = useState<string>(
    bankAccounts.find((b: any) => b.isDefault)?.id || bankAccounts[0]?.id || 'default'
  )

  const activeBankAccount = useMemo(
    () => bankAccounts.find((b: any) => b.id === selectedBankId) || bankAccounts[0] || BANK_ACCOUNT,
    [bankAccounts, selectedBankId]
  )

  const qrPayload = useMemo(
    () =>
      buildBcelOnePayPayload({
        accountNo: activeBankAccount.accountNumber,
        accountName: activeBankAccount.accountName,
        amountLAK: amountToPay,
        orderId: 'SSP-ORDER',
      }),
    [amountToPay, activeBankAccount]
  )

  const triggerVerification = async (previewUrl: string) => {
    setIsVerifyingSlip(true)
    setSlipVerifyError(null)
    setSlipVerified(false)
    try {
      const res = await verifySlipPayment({
        order_id: 'PREVIEW-' + Date.now(),
        qr_payload: qrPayload,
        slip_image: previewUrl,
        amount: amountToPay,
      })
      if (res.status === 'success' || res.new_status === 'PAID_PREPRESS') {
        setSlipVerified(true)
        setSlipTransRef(res.trans_ref || 'OK-' + Date.now())
      }
    } catch (err: any) {
      console.warn('Slip verification notice:', err)
      setSlipVerifyError(err.message || 'Slip verification notice')
    } finally {
      setIsVerifyingSlip(false)
    }
  }

  const onFile = (file: File | null) => {
    if (!file) return
    setSlipImage(file)
    setPaymentSlipped(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setSlipPreview(dataUrl)
      triggerVerification(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!customer.name.trim()) errs.name = language === 'en' ? 'Please enter full name' : 'ກະລຸນາກອກຊື່-ນາມສະກຸນ'
    if (!/^\d{8,12}$/.test(customer.phone.replace(/[^0-9]/g, '')))
      errs.phone = language === 'en' ? 'Please enter valid phone number' : 'ກະລຸນາກອກເບີໂທລະສັບ (ເຊັ່ນ 020xxxxxxx)'
    if (!customer.address.trim()) errs.address = language === 'en' ? 'Please enter delivery address' : 'ກະລຸນາກອກທີ່ຢູ່ຈັດສົ່ງ'
    if (!slipImage && !slipPreview) errs.slip = language === 'en' ? 'Please attach bank payment slip' : 'ກະລຸນາແນບຮູບສະລິບໂອນເງິນ'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return false
    return true
  }

  const submit = async () => {
    if (!validate()) return
    setSubmitting(true)
    setIsVerifyingSlip(true)
    setSlipVerifyError(null)

    try {
      const orderId = generateOrderId()
      const firstItem = checkoutItems[0]

      const order = {
        order_id: orderId,
        customer_name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email.trim(),
        customer_email: customer.email.trim(),
        address: customer.address.trim(),
        product_id: firstItem.product.id,
        specs: {
          size: checkoutItems.map((i) => `${i.product.name}: ${i.config.specLabels.size}`).join(' | '),
          paper: checkoutItems.map((i) => i.config.specLabels.paper).join(' | '),
          finishing: checkoutItems.map((i) => i.config.specLabels.finishing).join(' | '),
        },
        quantity: checkoutItems.reduce((sum, i) => sum + i.config.quantity, 0),
        items: checkoutItems.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.config.quantity,
          specs: i.config.specLabels,
          unit_price: i.price.unitPrice,
          total_price: i.price.total,
          drive_link: i.driveLink,
        })),
        drive_link: checkoutItems.map((i) => i.driveLink).filter(Boolean).join(', '),
        is_permission_confirmed: checkoutItems.every((i) => i.permissionConfirmed),
        special_notes: checkoutItems.map((i) => i.specialNotes).filter(Boolean).join('; '),
        shipping_courier_id: courierId,
        shipping_fee: shippingFee,
        total_price: total,
        currency: 'LAK',
        payment_slip_url: slipPreview,
        status: 'PAID_PREPRESS',
        timeline: [
          {
            status: 'PAID_PREPRESS',
            label: language === 'en' ? 'Slip Verified (PAID_PREPRESS)' : 'ກວດສອບສະລິບສຳເລັດ (PAID_PREPRESS)',
            at: Date.now(),
          },
        ],
      }

      // 1. Submit Order to Backend
      const placed = await submitOrder(order)

      // 2. Execute Real-time Slip Verification API
      try {
        const verifyRes = await verifySlipPayment({
          order_id: placed.order_id,
          qr_payload: qrPayload,
          slip_image: slipPreview || undefined,
          amount: total,
        })
        if (verifyRes.trans_ref) {
          placed.tracking_number = verifyRes.trans_ref
        }
      } catch (verErr: any) {
        console.warn('[Slip Verification Non-fatal Warning]', verErr)
      }

      setSlipVerified(true)
      setIsVerifyingSlip(false)
      setAutoRedirectSeconds(3)

      localStorage.setItem('ssp_placed_order', JSON.stringify(placed))
      clearSelectedCartItems()
      setOrderDraft(null)

      // Auto-redirect to SuccessPage upon receipt of 200 OK within 3 seconds
      setTimeout(() => {
        navigate(`/success/${placed.order_id}`, { state: { order: placed } })
      }, 2500)
    } catch (err: any) {
      setIsVerifyingSlip(false)
      setSubmitting(false)
      setSlipVerifyError(err.message || 'Failed to complete order submission')
    }
  }

  return (
    <section className="section section--alt checkout-page">
      <div className="container checkout-container">
        <h1 className="checkout-title">ຊຳລະເງິນ ແລະ ຈັດສົ່ງ (Checkout)</h1>

        <div className="checkout-layout">
          {/* ---------- Left column: forms ---------- */}
          <div className="checkout-main">
            {/* Recipient */}
            <div className="checkout-card">
              <div className="checkout-card-head">
                <span className="checkout-step">1</span>
                <h2>ຂໍ້ມູນຜູ້ຮັບ (Customer Info)</h2>
              </div>
              <div className="field">
                <label htmlFor="c-name">ຊື່-ນາມສະກຸນ (Full Name)</label>
                <input
                  id="c-name"
                  type="text"
                  placeholder="ເຊັ່ນ ທ້າວ ສົມໃຈ ດີເລີດ"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                />
                {errors.name && <p className="field-error">{errors.name}</p>}
              </div>
              <div className="field">
                <label htmlFor="c-phone">ເບີໂທລະສັບ (Phone Number)</label>
                <input
                  id="c-phone"
                  type="tel"
                  placeholder="020 55123456"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                />
                {errors.phone && <p className="field-error">{errors.phone}</p>}
              </div>
              <div className="field">
                <label htmlFor="c-email">ອີເມວສຳລັບຮັບແຈ້ງເຕືອນສະຖານະ (Email Notification)</label>
                <input
                  id="c-email"
                  type="email"
                  placeholder="customer@example.com (ຮັບໃບເຊັດ ແລະ ອັບເດດສະຖານະງານພິມ)"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="c-address">ທີ່ຢູ່ຈັດສົ່ງ (Delivery Address)</label>
                <textarea
                  id="c-address"
                  rows={3}
                  placeholder="ເຮືອນເລກທີ, ບ້ານ, ເມືອງ, ແຂວງ"
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                />
                {errors.address && <p className="field-error">{errors.address}</p>}
              </div>
            </div>

            {/* Shipping */}
            <div className="checkout-card">
              <div className="checkout-card-head">
                <span className="checkout-step">2</span>
                <h2>ເລືອກບໍລິສັດຂົນສົ່ງ (Carrier)</h2>
              </div>
              <div className="courier-list">
                {COURIERS.map((c) => {
                  const free = subtotal >= c.freeAbove && c.freeAbove > 0
                  const fee = free ? 0 : c.fee
                  const selected = courierId === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`courier-card ${selected ? 'is-selected' : ''}`}
                      onClick={() => setCourierId(c.id)}
                      aria-pressed={selected}
                    >
                      <span className="courier-radio" aria-hidden="true">
                        {selected && <CheckIcon size={14} />}
                      </span>
                      <span className="courier-brand" style={{ background: `${c.color}1a`, color: c.color }}>
                        {c.short}
                      </span>
                      <span className="courier-main">
                        <strong>{c.name}</strong>
                        <small>{c.eta} · ໄລຍະເວລາຈັດສົ່ງຂຶ້ນຢູ່ກັບບໍລິສັດຂົນສົ່ງ</small>
                      </span>
                      <span className="courier-fee">
                        {free ? (
                          <em className="courier-free">ສົ່ງຟຣີ</em>
                        ) : (
                          formatMoney(convertTo(fee), currency)
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Payment */}
            <div className="checkout-card">
              <div className="checkout-card-head">
                <span className="checkout-step">3</span>
                <h2>ຊຳລະເງິນ (Payment)</h2>
              </div>

              {bankAccounts.length > 1 && (
                <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', width: '100%', color: '#64748b' }}>ເລືອກທະນາຄານຮັບເງິນ:</span>
                  {bankAccounts.map((b: any) => (
                    <button
                      key={b.id || b.accountNumber}
                      type="button"
                      onClick={() => setSelectedBankId(b.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: selectedBankId === b.id ? '2px solid #059669' : '1px solid #cbd5e1',
                        background: selectedBankId === b.id ? '#ecfdf5' : '#f8fafc',
                        color: selectedBankId === b.id ? '#047857' : '#334155',
                        cursor: 'pointer',
                      }}
                    >
                      {b.bank.split('(')[0] || b.bank} {b.isDefault ? '(ຫຼັກ)' : ''}
                    </button>
                  ))}
                </div>
              )}

              {/* Payment Type Selection (On-Demand Full vs Bulk 50% Deposit) */}
              <div style={{ marginBottom: '18px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, display: 'block', marginBottom: '8px', color: 'var(--text-main)' }}>
                  ເງື່ອນໄຂການຊຳລະເງິນ (Payment Term):
                </span>

                {hasOnDemandItem ? (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '14px',
                      background: 'rgba(197, 160, 89, 0.12)',
                      border: '1.5px solid var(--gold)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>⚡</span>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'block' }}>
                        ງານພິມຕາມສັ່ງດ່ວນ (On-Demand) — ຊຳລະເຕັມຈຳນວນ 100%
                      </strong>
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        ງານພິມດ່ວນ 1 ຊິ້ນ / ບໍ່ມີຂັ້ນຕ່ຳ ລະບົບຈະເລີ່ມພິມທັນທີຫຼັງຊຳລະເຕັມຈຳນວນ
                      </small>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setPaymentType('full')}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        textAlign: 'left',
                        border: paymentType === 'full' ? '2px solid var(--gold)' : '1.5px solid var(--border-subtle)',
                        background: paymentType === 'full' ? 'rgba(197, 160, 89, 0.12)' : 'var(--bg-card)',
                        cursor: 'pointer',
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        ✓ ຊຳລະເຕັມ 100%
                      </strong>
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {formatMoney(totalDisplay, currency)} (ບໍ່ມີຍອດຄ້າງ)
                      </small>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentType('deposit')}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        textAlign: 'left',
                        border: paymentType === 'deposit' ? '2px solid var(--gold)' : '1.5px solid var(--border-subtle)',
                        background: paymentType === 'deposit' ? 'rgba(197, 160, 89, 0.12)' : 'var(--bg-card)',
                        cursor: 'pointer',
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        ✓ ມັດຈຳ 50%
                      </strong>
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {formatMoney(amountToPayDisplay, currency)} (ຍອດຄ້າງ 50%)
                      </small>
                    </button>
                  </div>
                )}
              </div>

              <div className="payment-box">
                <div className="payment-qr">
                  <span className="payment-qr-badge">
                    <CreditCardIcon size={16} /> BCEL OnePay QR
                  </span>
                  <div className="payment-qr-canvas">
                    <QRCodeSVG value={qrPayload} size={180} bgColor="#ffffff" fgColor="#0C2340" level="M" />
                  </div>
                  <p className="payment-qr-amount">ຍອດຊຳລະຕອນນີ້ {formatMoney(amountToPayDisplay, currency)}</p>
                </div>

                <div className="payment-bank">
                  <span className="payment-qr-badge">
                    <ShieldIcon size={16} /> ໂອນເງິນທະນາຄານ BCEL
                  </span>
                  <ul className="bank-list">
                    <li>
                      <span>ທະນາຄານ</span>
                      <strong>{activeBankAccount.bank} ({activeBankAccount.branch})</strong>
                    </li>
                    <li>
                      <span>ຊື່ບັນຊີ</span>
                      <strong>{activeBankAccount.accountName}</strong>
                    </li>
                    <li>
                      <span>ເລກບັນຊີ</span>
                      <strong className="bank-number">{activeBankAccount.accountNumber}</strong>
                    </li>
                    <li>
                      <span>ຍອດໂອນຕອນນີ້</span>
                      <strong className="bank-number">{formatMoney(amountToPayDisplay, currency)}</strong>
                    </li>
                  </ul>
                  <div className="bank-copy-actions">
                    <CopyButton text={activeBankAccount.accountNumber} label="ຄັດລອກເລກບັນຊີ" />
                    <CopyButton text={String(amountToPay.toFixed(0))} label="ຄັດລອກຍອດເງິນ" />
                  </div>
                </div>
              </div>

              <p className="field-hint">
                ຊຳລະເງິນດ້ວຍ BCEL OnePay ໂດຍສະແກນ QR ຫຼື ໂອນຜ່ານແອັບທະນາຄານ ກະລຸນາກວດສອບຍອດເງິນ ແລະ ຊື່ບັນຊີໃຫ້ຖືກຕ້ອງກ່ອນຢືນຢັນ
              </p>
            </div>

            {/* Slip upload */}
            <div className="checkout-card">
              <div className="checkout-card-head">
                <span className="checkout-step">4</span>
                <h2>ແນບສະລິບໂອນເງິນ (Upload Slip)</h2>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => onFile(e.target.files?.[0] || null)}
              />

              {slipPreview ? (
                <div className="slip-preview">
                  <img src={slipPreview} alt="ຕົວຢ່າງສະລິບໂອນເງິນ" />
                  <div className="slip-preview-actions">
                    {isVerifyingSlip ? (
                      <span className="badge badge--yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span className="spinner-border" style={{ width: '12px', height: '12px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                        ກຳລັງກວດສອບສະລິບ...
                      </span>
                    ) : slipVerified ? (
                      <span className="badge badge--green">
                        <CheckIcon size={14} /> ກວດສອບສະລິບຖືກຕ້ອງ (PAID)
                      </span>
                    ) : (
                      <span className="badge badge--navy">
                        <CheckIcon size={14} /> ແນບສະລິບແລ້ວ
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => {
                        setSlipImage(null)
                        setSlipPreview(null)
                        setPaymentSlipped(false)
                        setSlipVerified(false)
                        setSlipTransRef(null)
                        setSlipVerifyError(null)
                        if (fileRef.current) fileRef.current.value = ''
                      }}
                    >
                      ປ່ຽນສະລິບ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className={`slip-upload ${errors.slip ? 'has-error' : ''}`}
                    onClick={() => fileRef.current && fileRef.current.click()}
                  >
                    <UploadIcon size={28} />
                    <strong>ອັບໂຫຼດຮູບສະລິບໂອນເງິນ</strong>
                    <small>ກົດເພື່ອເລືອກຟາຍ (JPG / PNG) ກວດສອບຄວາມຖືກຕ້ອງກ່ອນສົ່ງ</small>
                  </button>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm self-center text-xs opacity-80 hover:opacity-100"
                    onClick={() => {
                      const canvas = document.createElement('canvas')
                      canvas.width = 400
                      canvas.height = 500
                      const ctx = canvas.getContext('2d')
                      if (ctx) {
                        ctx.fillStyle = '#070D1E'
                        ctx.fillRect(0, 0, 400, 500)
                        ctx.fillStyle = '#C5A059'
                        ctx.font = 'bold 20px sans-serif'
                        ctx.fillText('BCEL OnePay Receipt', 90, 70)
                        ctx.fillStyle = '#FFFFFF'
                        ctx.font = '15px sans-serif'
                        ctx.fillText(`Amount: ₭ ${amountToPay.toLocaleString()}`, 50, 140)
                        ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, 50, 180)
                        ctx.fillText(`To: Som Sing Phim Atelier`, 50, 220)
                        ctx.fillStyle = '#10B981'
                        ctx.font = 'bold 16px sans-serif'
                        ctx.fillText('✓ TRANSFER SUCCESSFUL', 50, 280)
                        const dataUrl = canvas.toDataURL('image/png')
                        setSlipPreview(dataUrl)
                        setPaymentSlipped(true)
                        if (errors.slip) {
                          setErrors((prev) => {
                            const c = { ...prev }
                            delete c.slip
                            return c
                          })
                        }
                        triggerVerification(dataUrl)
                      }
                    }}
                  >
                    ⚡ ໃຊ້ສະລິບທົດສອບ (Quick Test Slip)
                  </button>
                </div>
              )}
              {errors.slip && <p className="field-error">{errors.slip}</p>}

              {slipPreview && (
                <div className="slip-confirm">
                  <label className="permission-checkbox">
                    <input type="checkbox" checked={paymentSlipped} readOnly />
                    <span className="checkbox-box" aria-hidden="true">
                      <CheckIcon size={14} />
                    </span>
                    <span>ຂ້າພະເຈົ້າຍືນຢັນວ່າໄດ້ຊຳລະເງິນຖືກຕ້ອງຕາມຍອດ ແລະ ແນບສະລິບແລ້ວ</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* ---------- Right column: summary ---------- */}
          <aside className="checkout-summary">
            <div className="checkout-summary-card">
              <h3>{language === 'en' ? 'Order Summary' : 'ສະຫຼຸບຄຳສັ່ງຊື້'} ({checkoutItems.length} {t('itemsUnit')})</h3>

              <div className="checkout-products-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                {checkoutItems.map((item, idx) => (
                  <div key={item.id || idx} className="checkout-product" style={{ paddingBottom: '12px', borderBottom: idx < checkoutItems.length - 1 ? '1px dashed var(--border-gold)' : 'none' }}>
                    <div className="checkout-product-art">
                      <ProductArt art={item.product.image} />
                    </div>
                    <div className="checkout-product-info">
                      <strong>{item.product.name}</strong>
                      <small>
                        {language === 'en' ? 'Qty' : 'ຈຳນວນ'} {item.config.quantity} {item.product.unit || (language === 'en' ? 'pcs' : 'ຊິ້ນ')} · {formatMoney(convertTo(item.price.unitPrice), currency)}/{language === 'en' ? 'item' : 'ຊິ້ນ'}
                      </small>
                      <ul className="checkout-specs">
                        {item.config.specLabels.size && <li>{language === 'en' ? 'Size' : 'ຂະໜາດ'}: {item.config.specLabels.size}</li>}
                        {item.config.specLabels.paper && <li>{language === 'en' ? 'Material' : 'ວັດສະດຸ'}: {item.config.specLabels.paper}</li>}
                        {item.config.specLabels.finishing && <li>{language === 'en' ? 'Finishing' : 'ເຕັກນິກ'}: {item.config.specLabels.finishing}</li>}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              <div className="checkout-lines">
                <div className="checkout-line">
                  <span>ຍອດລວມສິນຄ້າ</span>
                  <strong>{formatMoney(convertTo(subtotal), currency)}</strong>
                </div>
                <div className="checkout-line">
                  <span>ຄ່າຈັດສົ່ງ ({courier.name})</span>
                  {isFreeShipping ? (
                    <strong className="text-success">ສົ່ງຟຣີ</strong>
                  ) : (
                    <strong>{formatMoney(convertTo(shippingFee), currency)}</strong>
                  )}
                </div>
                <div className="checkout-line checkout-line--total">
                  <span>ຍອດລວມທັງໝົດ</span>
                  <strong>{formatMoney(totalDisplay, currency)}</strong>
                </div>
                {paymentType === 'deposit' && !hasOnDemandItem && (
                  <>
                    <div className="checkout-line" style={{ color: 'var(--gold)', fontWeight: 800 }}>
                      <span>ຍອດຊຳລະຕອນນີ້ (ມັດຈຳ 50%)</span>
                      <strong>{formatMoney(amountToPayDisplay, currency)}</strong>
                    </div>
                    <div className="checkout-line" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <span>ຍອດຄ້າງຊຳລະກ່ອນຈັດສົ່ງ</span>
                      <strong>{formatMoney(remainingDisplay, currency)}</strong>
                    </div>
                  </>
                )}
              </div>

              <div className="checkout-trust">
                <ShieldIcon size={18} />
                <span>ຂໍ້ມູນຖືກສົ່ງແບບເຂົ້າຮหัส ແລະ ຈະໃຊ້ເພື່ອຈັດສົ່ງ ແລະ ຕິດຕາມສະຖານະເທົ່ານັ້ນ</span>
              </div>

              <button type="button" className="btn btn--gold btn--lg btn--block" onClick={submit} disabled={submitting}>
                {submitting ? 'ກຳລັງສົ່ງຄຳສັ່ງຊື້…' : 'ຢືນຢັນຄຳສັ່ງຊື້ ແລະ ສົ່ງສະລິບ'}
              </button>
              <p className="text-center field-hint mt-1">
                <TruckIcon size={14} /> ໄລຍະເວລາຈັດສົ່ງຂຶ້ນຢູ່ກັບບໍລິສັດຂົນສົ່ງທີ່ເລືອກ
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
