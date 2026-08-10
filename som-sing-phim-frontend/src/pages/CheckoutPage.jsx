import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useShop } from '../context/ShopContext.jsx'
import { BANK_ACCOUNT, COURIERS, FREE_SHIPPING_THRESHOLD } from '../data/shipping.js'
import { buildPromptPayPayload } from '../utils/promptpay.js'
import { formatMoney } from '../utils/currency.js'
import { generateOrderId } from '../utils/orderId.js'
import { submitOrder } from '../api/client.js'
import ProductArt from '../components/ProductArt.jsx'
import {
  CheckIcon,
  CopyIcon,
  CreditCardIcon,
  ShieldIcon,
  TruckIcon,
  UploadIcon,
} from '../components/icons.jsx'

function CopyButton({ text, label, onCopied }) {
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
      {done ? <CheckIcon size={16} /> : <CopyIcon size={16} />} {done ? 'คัดลอกแล้ว' : label}
    </button>
  )
}

export default function CheckoutPage() {
  const { orderDraft, setOrderDraft, currency, convertTo } = useShop()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' })
  const [courierId, setCourierId] = useState(COURIERS[0].id)
  const [slipImage, setSlipImage] = useState(null)
  const [slipPreview, setSlipPreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const paymentSlipped = useMemo(() => !!slipImage, [slipImage])

  const subtotal = orderDraft ? orderDraft.price.total : 0
  const courier = COURIERS.find((c) => c.id === courierId) || COURIERS[0]
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD
  const shippingFee = isFreeShipping ? 0 : courier.fee
  const total = subtotal + shippingFee
  const totalThb = total

  const qrPayload = useMemo(
    () =>
      buildPromptPayPayload({
        target: BANK_ACCOUNT.promptpay,
        amount: totalThb,
        billRef: 'SSP-ORDER',
      }),
    [totalThb]
  )

  if (!orderDraft) {
    return (
      <section className="section text-center container">
        <h2>ยังไม่มีสินค้าในคำสั่งซื้อ</h2>
        <p className="text-muted">กรุณาเลือกสินค้าและสเปกก่อนดำเนินการชำระเงิน</p>
        <Link to="/category/albums" className="btn btn--navy mt-2">
          ไปเลือกสินค้า
        </Link>
      </section>
    )
  }

  const { product, config, driveLink, permissionConfirmed, specialNotes, price } = orderDraft
  const totalDisplay = convertTo(total)

  const onFile = (file) => {
    if (!file) return
    setSlipImage(file)
    const reader = new FileReader()
    reader.onload = (e) => setSlipPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const errs = {}
    if (!customer.name.trim()) errs.name = 'กรุณากรอกชื่อ-นามสกุล'
    if (!/^\d{9,10}$/.test(customer.phone.replace(/[^0-9]/g, '')))
      errs.phone = 'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก (เช่น 0812345678)'
    if (!customer.address.trim()) errs.address = 'กรุณากรอกที่อยู่จัดส่ง'
    if (!slipImage) errs.slip = 'กรุณาแนบภาพสลิปโอนเงิน'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return false
    return true
  }

  const submit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const orderId = generateOrderId()
      const order = {
        order_id: orderId,
        customer_name: customer.name.trim(),
        phone: customer.phone.trim(),
        address: customer.address.trim(),
        product_id: product.id,
        specs: {
          size: config.specLabels.size,
          paper: config.specLabels.paper,
          finishing: config.specLabels.finishing,
        },
        quantity: config.quantity,
        drive_link: driveLink,
        is_permission_confirmed: permissionConfirmed,
        special_notes: specialNotes,
        shipping_courier_id: courierId,
        shipping_fee: shippingFee,
        total_price: totalThb,
        currency: 'THB',
        payment_slip_url: slipPreview,
        status: 'PENDING_SLIP_CHECK',
        timeline: [{ status: 'PENDING_SLIP_CHECK', label: 'ได้รับออเดอร์แล้ว', at: Date.now() }],
      }
      const placed = await submitOrder(order)
      localStorage.setItem('ssp_placed_order', JSON.stringify(placed))
      setOrderDraft(null)
      navigate(`/success/${placed.order_id}`, { state: { order: placed } })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section section--alt checkout-page">
      <div className="container checkout-container">
        <h1 className="checkout-title">ชำระเงินและจัดส่ง</h1>

        <div className="checkout-layout">
          {/* ---------- Left column: forms ---------- */}
          <div className="checkout-main">
            {/* Recipient */}
            <div className="checkout-card">
              <div className="checkout-card-head">
                <span className="checkout-step">1</span>
                <h2>ข้อมูลผู้รับ</h2>
              </div>
              <div className="field">
                <label htmlFor="c-name">ชื่อ-นามสกุล</label>
                <input
                  id="c-name"
                  type="text"
                  placeholder="เช่น คุณสมชาย ใจดี"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                />
                {errors.name && <p className="field-error">{errors.name}</p>}
              </div>
              <div className="field">
                <label htmlFor="c-phone">เบอร์โทรศัพท์</label>
                <input
                  id="c-phone"
                  type="tel"
                  placeholder="0812345678"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                />
                {errors.phone && <p className="field-error">{errors.phone}</p>}
              </div>
              <div className="field">
                <label htmlFor="c-address">ที่อยู่จัดส่ง</label>
                <textarea
                  id="c-address"
                  rows={3}
                  placeholder="เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
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
                <h2>เลือกบริษัทขนส่ง</h2>
              </div>
              <div className="courier-list">
                {COURIERS.map((c) => {
                  const free = subtotal >= c.freeAbove
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
                        <small>{c.eta} · ระยะเวลาจัดส่งขึ้นอยู่กับบริษัทขนส่ง</small>
                      </span>
                      <span className="courier-fee">
                        {free ? (
                          <em className="courier-free">ส่งฟรี</em>
                        ) : (
                          formatMoney(convertTo(fee), currency)
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="field-hint mt-1">
                {isFreeShipping
                  ? `คุณได้รับสิทธิ์ส่งฟรี (ยอดสั่งซื้อ ≥ ${formatMoney(convertTo(FREE_SHIPPING_THRESHOLD), currency)})`
                  : `สั่งซื้อครบ ${formatMoney(convertTo(FREE_SHIPPING_THRESHOLD), currency)} ขึ้นไป ส่งฟรี`}
              </p>
            </div>

            {/* Payment */}
            <div className="checkout-card">
              <div className="checkout-card-head">
                <span className="checkout-step">3</span>
                <h2>ชำระเงิน</h2>
              </div>

              <div className="payment-box">
                <div className="payment-qr">
                  <span className="payment-qr-badge">
                    <CreditCardIcon size={16} /> PromptPay
                  </span>
                  <div className="payment-qr-canvas">
                    <QRCodeSVG value={qrPayload} size={180} bgColor="#ffffff" fgColor="#0C2340" level="M" />
                  </div>
                  <p className="payment-qr-amount">ยอดชำระ {formatMoney(totalDisplay, currency)}</p>
                </div>

                <div className="payment-bank">
                  <span className="payment-qr-badge">
                    <ShieldIcon size={16} /> โอนเงินธนาคาร
                  </span>
                  <ul className="bank-list">
                    <li>
                      <span>ธนาคาร</span>
                      <strong>{BANK_ACCOUNT.bank} ({BANK_ACCOUNT.branch})</strong>
                    </li>
                    <li>
                      <span>ชื่อบัญชี</span>
                      <strong>{BANK_ACCOUNT.accountName}</strong>
                    </li>
                    <li>
                      <span>เลขที่บัญชี</span>
                      <strong className="bank-number">{BANK_ACCOUNT.accountNumber}</strong>
                    </li>
                    <li>
                      <span>ยอดโอน</span>
                      <strong className="bank-number">{formatMoney(totalDisplay, currency)}</strong>
                    </li>
                  </ul>
                  <div className="bank-copy-actions">
                    <CopyButton text={BANK_ACCOUNT.accountNumber} label="คัดลอกเลขบัญชี" />
                    <CopyButton text={String(totalThb.toFixed(2))} label="คัดลอกยอดเงิน" />
                  </div>
                </div>
              </div>

              <p className="field-hint">
                ชำระด้วย PromptPay โดยสแกน QR หรือโอนผ่านแอปธนาคาร อย่าลืมตรวจสอบยอดเงินและชื่อบัญชีให้ถูกต้องก่อนยืนยัน
              </p>
            </div>

            {/* Slip upload */}
            <div className="checkout-card">
              <div className="checkout-card-head">
                <span className="checkout-step">4</span>
                <h2>แนบสลิปโอนเงิน</h2>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => onFile(e.target.files[0])}
              />

              {slipPreview ? (
                <div className="slip-preview">
                  <img src={slipPreview} alt="ตัวอย่างสลิปโอนเงิน" />
                  <div className="slip-preview-actions">
                    <span className="badge badge--green">
                      <CheckIcon size={14} /> ตรวจสอบสลิปแล้ว
                    </span>
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => {
                        setSlipImage(null)
                        setSlipPreview(null)
                        if (fileRef.current) fileRef.current.value = ''
                      }}
                    >
                      เปลี่ยนสลิป
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={`slip-upload ${errors.slip ? 'has-error' : ''}`}
                  onClick={() => fileRef.current && fileRef.current.click()}
                >
                  <UploadIcon size={28} />
                  <strong>อัปโหลดภาพสลิปโอนเงิน</strong>
                  <small>คลิกเพื่อเลือกไฟล์ (JPG / PNG) ตรวจสอบความถูกต้องก่อนส่ง</small>
                </button>
              )}
              {errors.slip && <p className="field-error">{errors.slip}</p>}

              {slipPreview && (
                <div className="slip-confirm">
                  <label className="permission-checkbox">
                    <input type="checkbox" checked={paymentSlipped} readOnly />
                    <span className="checkbox-box" aria-hidden="true">
                      <CheckIcon size={14} />
                    </span>
                    <span>ข้าพเจ้ายืนยันว่าได้ชำระเงินถูกต้องตามยอดและแนบสลิปแล้ว</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* ---------- Right column: summary ---------- */}
          <aside className="checkout-summary">
            <div className="checkout-summary-card">
              <h3>สรุปคำสั่งซื้อ</h3>

              <div className="checkout-product">
                <div className="checkout-product-art">
                  <ProductArt art={product.image} />
                </div>
                <div className="checkout-product-info">
                  <strong>{product.name}</strong>
                  <small>
                    จำนวน {config.quantity} ชิ้น · {formatMoney(convertTo(price.unitPrice), currency)}/ชิ้น
                  </small>
                  <ul className="checkout-specs">
                    <li>ขนาด: {config.specLabels.size}</li>
                    <li>วัสดุ: {config.specLabels.paper}</li>
                    <li>เทคนิค: {config.specLabels.finishing}</li>
                  </ul>
                </div>
              </div>

              <div className="checkout-lines">
                <div className="checkout-line">
                  <span>ยอดรวมสินค้า</span>
                  <strong>{formatMoney(convertTo(subtotal), currency)}</strong>
                </div>
                <div className="checkout-line">
                  <span>ค่าจัดส่ง ({courier.name})</span>
                  {isFreeShipping ? (
                    <strong className="text-success">ส่งฟรี</strong>
                  ) : (
                    <strong>{formatMoney(convertTo(shippingFee), currency)}</strong>
                  )}
                </div>
                <div className="checkout-line checkout-line--total">
                  <span>ยอดรวมทั้งสิ้น</span>
                  <strong>{formatMoney(totalDisplay, currency)}</strong>
                </div>
              </div>

              <div className="checkout-trust">
                <ShieldIcon size={18} />
                <span>ข้อมูลถูกส่งแบบเข้ารหัส และจะใช้เพื่อจัดส่งและติดตามสถานะเท่านั้น</span>
              </div>

              <button type="button" className="btn btn--gold btn--lg btn--block" onClick={submit} disabled={submitting}>
                {submitting ? 'กำลังส่งคำสั่งซื้อ…' : 'ยืนยันคำสั่งซื้อและส่งสลิป'}
              </button>
              <p className="text-center field-hint mt-1">
                <TruckIcon size={14} /> ระยะเวลาจัดส่งขึ้นอยู่กับบริษัทขนส่งที่เลือก
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
