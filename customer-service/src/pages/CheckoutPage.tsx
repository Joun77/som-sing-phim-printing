import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useShop } from '../context/ShopContext.tsx'
import { BANK_ACCOUNT, COURIERS, FREE_SHIPPING_THRESHOLD } from '../data/shipping.ts'
import { buildBcelOnePayPayload } from '../utils/promptpay.ts'
import { formatMoney } from '../utils/currency.ts'
import { generateOrderId } from '../utils/orderId.ts'
import { submitOrder } from '../api/client.ts'
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
  const { orderDraft, setOrderDraft, currency, convertTo } = useShop()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' })
  const [courierId, setCourierId] = useState(COURIERS[0].id)
  const [slipImage, setSlipImage] = useState<File | null>(null)
  const [slipPreview, setSlipPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [paymentSlipped, setPaymentSlipped] = useState(false)

  if (!orderDraft) {
    return (
      <section className="section text-center container">
        <h2>ຍັງບໍ່ມີສິນຄ້າໃນຄຳສັ່ງຊື້ (No items in cart)</h2>
        <p className="text-muted">ກະລຸນາເລືອກສິນຄ້າ ແລະ ສະເປັກກ່ອນດຳເນີນການຊຳລະເງິນ</p>
        <Link to="/category/albums" className="btn btn--navy mt-2">
          ໄປເລືອກສິນຄ້າ
        </Link>
      </section>
    )
  }

  const { product, config, driveLink, permissionConfirmed, specialNotes, price } = orderDraft
  const subtotal = price.total
  const courier = COURIERS.find((c) => c.id === courierId) || COURIERS[0]
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD
  const shippingFee = isFreeShipping ? 0 : courier.fee
  const total = subtotal + shippingFee
  const totalDisplay = convertTo(total)

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
        amountLAK: total,
        orderId: 'SSP-ORDER',
      }),
    [total, activeBankAccount]
  )

  const onFile = (file: File | null) => {
    if (!file) return
    setSlipImage(file)
    setPaymentSlipped(true)
    const reader = new FileReader()
    reader.onload = (e) => setSlipPreview(e.target.result as string)
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!customer.name.trim()) errs.name = 'ກະລຸນາກອກຊື່-ນາມສະກຸນ'
    if (!/^\d{8,12}$/.test(customer.phone.replace(/[^0-9]/g, '')))
      errs.phone = 'ກະລຸນາກອກເບີໂທລະສັບ (ເຊັ່ນ 020xxxxxxx)'
    if (!customer.address.trim()) errs.address = 'ກະລຸນາກອກທີ່ຢູ່ຈັດສົ່ງ'
    if (!slipImage) errs.slip = 'ກະລຸນາແນບຮູບສະລິບໂອນເງິນ'
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
        total_price: total,
        currency: 'LAK',
        payment_slip_url: slipPreview,
        status: 'PENDING_SLIP_CHECK',
        timeline: [{ status: 'PENDING_SLIP_CHECK', label: 'ກຳລັງກວດສອບການຊຳລະເງິນ', at: Date.now() }],
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

              <div className="payment-box">
                <div className="payment-qr">
                  <span className="payment-qr-badge">
                    <CreditCardIcon size={16} /> BCEL OnePay QR
                  </span>
                  <div className="payment-qr-canvas">
                    <QRCodeSVG value={qrPayload} size={180} bgColor="#ffffff" fgColor="#0C2340" level="M" />
                  </div>
                  <p className="payment-qr-amount">ຍອດຊຳລະ {formatMoney(totalDisplay, currency)}</p>
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
                      <span>ຍອດໂອນ</span>
                      <strong className="bank-number">{formatMoney(totalDisplay, currency)}</strong>
                    </li>
                  </ul>
                  <div className="bank-copy-actions">
                    <CopyButton text={activeBankAccount.accountNumber} label="ຄັດລອກເລກບັນຊີ" />
                    <CopyButton text={String(total.toFixed(0))} label="ຄັດລອກຍອດເງິນ" />
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
                    <span className="badge badge--green">
                      <CheckIcon size={14} /> ກວດສອບສະລິບຮຽບຮ້ອຍ
                    </span>
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => {
                        setSlipImage(null)
                        setSlipPreview(null)
                        setPaymentSlipped(false)
                        if (fileRef.current) fileRef.current.value = ''
                      }}
                    >
                      ປ່ຽນສະລິບ
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
                  <strong>ອັບໂຫຼດຮູບສະລິບໂອນເງິນ</strong>
                  <small>ກົດເພື່ອເລືອກຟາຍ (JPG / PNG) ກວດສອບຄວາມຖືກຕ້ອງກ່ອນສົ່ງ</small>
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
                    <span>ຂ້າພະເຈົ້າຍືນຢັນວ່າໄດ້ຊຳລະເງິນຖືກຕ້ອງຕາມຍອດ ແລະ ແນບສະລິບແລ້ວ</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* ---------- Right column: summary ---------- */}
          <aside className="checkout-summary">
            <div className="checkout-summary-card">
              <h3>ສະຫຼຸບຄຳສັ່ງຊື້ (Order Summary)</h3>

              <div className="checkout-product">
                <div className="checkout-product-art">
                  <ProductArt art={product.image} />
                </div>
                <div className="checkout-product-info">
                  <strong>{product.name}</strong>
                  <small>
                    ຈຳນວນ {config.quantity} ຊິ້ນ · {formatMoney(convertTo(price.unitPrice), currency)}/ຊິ້ນ
                  </small>
                  <ul className="checkout-specs">
                    <li>ຂະໜາດ: {config.specLabels.size}</li>
                    <li>ວັດສະດຸ: {config.specLabels.paper}</li>
                    <li>ເຕັກນິກ: {config.specLabels.finishing}</li>
                  </ul>
                </div>
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
