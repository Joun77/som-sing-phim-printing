import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCategory, getProduct, type SpecOption } from '../data/catalog.ts'
import { useShop } from '../context/ShopContext.tsx'
import { computePrice, getQuantityTier } from '../utils/pricing.ts'
import { formatMoney } from '../utils/currency.ts'
import ProductArt from '../components/ProductArt.tsx'
import {
  ArrowRightIcon,
  CheckIcon,
  LinkIcon,
  MinusIcon,
  PlusIcon,
} from '../components/icons.tsx'

interface OptionButtonProps {
  option: SpecOption
  selected: boolean
  onSelect: (id: string) => void
}

function OptionButton({ option, selected, onSelect }: OptionButtonProps) {
  return (
    <button
      type="button"
      className={`option-card ${selected ? 'is-selected' : ''}`}
      onClick={() => onSelect(option.id)}
      aria-pressed={selected}
    >
      <span className="option-card-radio" aria-hidden="true">
        {selected && <CheckIcon size={14} />}
      </span>
      <span className="option-card-main">
        <strong>{option.label}</strong>
        {option.hint && <small>{option.hint}</small>}
      </span>
      {typeof option.add === 'number' && option.add !== 0 && (
        <span className="option-card-price">{option.add > 0 ? `+${option.add}` : option.add}</span>
      )}
    </button>
  )
}

interface SpecGroupProps {
  title: string
  hint?: string
  options: SpecOption[]
  value: string
  onChange: (id: string) => void
}

function SpecGroup({ title, hint, options, value, onChange }: SpecGroupProps) {
  return (
    <div className="spec-group">
      <div className="spec-group-head">
        <h3>{title}</h3>
        {hint && <span className="spec-group-hint">{hint}</span>}
      </div>
      <div className="spec-options">
        {options.map((o) => (
          <OptionButton key={o.id} option={o} selected={value === o.id} onSelect={onChange} />
        ))}
      </div>
    </div>
  )
}

interface QuantityStepperProps {
  value: number
  onChange: (n: number) => void
}

function QuantityStepper({ value, onChange }: QuantityStepperProps) {
  const tier = getQuantityTier(value)
  return (
    <div className="spec-group">
      <div className="spec-group-head">
        <h3>จำนวนชิ้น</h3>
        <span className="spec-group-hint">ยิ่งสั่งเยอะ ยิ่งได้ส่วนลด</span>
      </div>
      <div className="qty-row">
        <div className="qty-stepper">
          <button type="button" onClick={() => onChange(Math.max(1, value - 1))} aria-label="ลดจำนวน">
            <MinusIcon />
          </button>
          <input
            type="number"
            min="1"
            value={value}
            onChange={(e) => onChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
            aria-label="จำนวนชิ้น"
          />
          <button type="button" onClick={() => onChange(value + 1)} aria-label="เพิ่มจำนวน">
            <PlusIcon />
          </button>
        </div>
        <span className="qty-discount-badge">
          ส่วนลดปัจจุบัน: {tier.discount * 100}%{tier.max !== Infinity ? ` (จนถึง ${tier.max} ชิ้น)` : ''}
        </span>
      </div>
    </div>
  )
}

export default function ProductPage() {
  const { slug } = useParams()
  const product = getProduct(slug)
  const category = product ? getCategory(product.category) : null

  const [sizeId, setSizeId] = useState(product ? product.sizes[0].id : '')
  const [materialId, setMaterialId] = useState(product ? product.materials[0].id : '')
  const [finishingId, setFinishingId] = useState(product ? product.finishings[0].id : '')
  const [quantity, setQuantity] = useState(1)
  const [driveLink, setDriveLink] = useState('')
  const [permissionConfirmed, setPermissionConfirmed] = useState(false)
  const [specialNotes, setSpecialNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { currency, convertTo, setOrderDraft } = useShop()

  const price = useMemo(() => {
    if (!product) return null
    return computePrice(product, { sizeId, materialId, finishingId, quantity })
  }, [product, sizeId, materialId, finishingId, quantity])

  if (!product) {
    return (
      <section className="section text-center container">
        <h2>ไม่พบสินค้านี้</h2>
        <Link to="/" className="btn btn--navy mt-2">
          กลับหน้าแรก
        </Link>
      </section>
    )
  }

  const selectedSize = product.sizes.find((s) => s.id === sizeId)
  const selectedMaterial = product.materials.find((m) => m.id === materialId)
  const selectedFinishing = product.finishings.find((f) => f.id === finishingId)

  const specLabels = {
    size: selectedSize?.label || '',
    paper: selectedMaterial?.label || '',
    finishing: selectedFinishing?.label || '',
  }

  const goToCheckout = () => {
    const nextErrors: Record<string, string> = {}
    if (!driveLink.trim()) {
      nextErrors.driveLink = 'กรุณาแนบลิงก์ Google Drive ของไฟล์งาน'
    } else if (!/^https?:\/\/drive\.google\.com\//.test(driveLink.trim())) {
      nextErrors.driveLink = 'ลิงก์ต้องเป็น Google Drive (https://drive.google.com/...)'
    }
    if (!permissionConfirmed) {
      nextErrors.permission = 'กรุณายืนยันว่าได้เปิดสิทธิ์การเข้าถึงลิงก์แล้ว'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      document.querySelector('.configurator')?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    setOrderDraft({
      product,
      config: {
        sizeId,
        materialId,
        finishingId,
        quantity,
        specLabels,
      },
      driveLink: driveLink.trim(),
      permissionConfirmed,
      specialNotes,
      price,
    })
  }

  const totalDisplay = convertTo(price.total)
  const unitDisplay = convertTo(price.unitPrice)

  return (
    <>
      <section className="section section--alt product-page">
        <div className="container">
          <nav className="breadcrumb" aria-label="breadcrumb">
            <Link to="/">หน้าแรก</Link>
            <span>/</span>
            <Link to={`/category/${category?.slug}`}>{category?.name}</Link>
            <span>/</span>
            <span className="current">{product.name}</span>
          </nav>

          <div className="product-layout">
            <div className="product-gallery">
              <div className="product-gallery-main">
                <ProductArt art={product.image} />
              </div>
              <div className="product-meta-card">
                <h3>สินค้านี้มาพร้อม</h3>
                <ul>
                  <li>
                    <CheckIcon size={16} /> พิมพ์สีคุณภาพสูง กันน้ำได้ (ขึ้นอยู่กับวัสดุ)
                  </li>
                  <li>
                    <CheckIcon size={16} /> ตรวจทานไฟล์และให้คำแนะนำก่อนพิมพ์
                  </li>
                  <li>
                    <CheckIcon size={16} /> จัดส่งทั่วประเทศ ติดตามสถานะได้
                  </li>
                </ul>
              </div>
            </div>

            <div className="product-info">
              <span className="product-card-cat">{category?.name}</span>
              <h1>{product.name}</h1>
              <p className="product-info-desc">{product.description}</p>

              <div className="product-price-line">
                <span className="product-price-line-label">ราคาเริ่มต้น</span>
                <span className="product-price-line-now">{formatMoney(convertTo(product.basePrice), currency)}</span>
                <span className="product-price-line-unit">/ ชิ้น</span>
              </div>

              <form
                className="configurator"
                onSubmit={(e) => {
                  e.preventDefault()
                  goToCheckout()
                }}
              >
                <SpecGroup title="เลือกขนาด" options={product.sizes} value={sizeId} onChange={setSizeId} />
                <SpecGroup title="เลือกวัสดุ / กระดาษ" options={product.materials} value={materialId} onChange={setMaterialId} />
                <SpecGroup title="เคลือบ / เทคนิคพิเศษ" options={product.finishings} value={finishingId} onChange={setFinishingId} />
                <QuantityStepper value={quantity} onChange={setQuantity} />

                <div className="spec-group">
                  <div className="spec-group-head">
                    <h3>ลิงก์ไฟล์งาน (Google Drive)</h3>
                    <span className="spec-group-hint">วาง URL ที่แชร์ไฟล์ของคุณ</span>
                  </div>
                  <div className={`drive-link-field ${errors.driveLink ? 'has-error' : ''}`}>
                    <LinkIcon size={20} />
                    <input
                      type="url"
                      placeholder="https://drive.google.com/drive/folders/…"
                      value={driveLink}
                      onChange={(e) => setDriveLink(e.target.value)}
                    />
                  </div>
                  {errors.driveLink && <p className="field-error">{errors.driveLink}</p>}
                  <p className="field-hint">
                    วิธีแชร์: คลิกขวาที่ไฟล์/โฟลเดอร์ → แชร์ → ทั่วไป → ทุกคนที่มีลิงก์ → คัดลอกลิงก์
                  </p>
                </div>

                <label className={`permission-checkbox ${errors.permission ? 'has-error' : ''}`}>
                  <input
                    type="checkbox"
                    checked={permissionConfirmed}
                    onChange={(e) => setPermissionConfirmed(e.target.checked)}
                  />
                  <span className="checkbox-box" aria-hidden="true">
                    <CheckIcon size={14} />
                  </span>
                  <span>
                    ข้าพเจ้ายืนยันว่าได้เปิดสิทธิ์การเข้าถึงลิงก์ Google Drive เป็นสาธารณะแล้ว{' '}
                    <em>(Anyone with the link can view)</em>
                  </span>
                </label>
                {errors.permission && <p className="field-error">{errors.permission}</p>}

                <div className="spec-group">
                  <div className="spec-group-head">
                    <h3>หมายเหตุถึงช่างพิมพ์ (ไม่บังคับ)</h3>
                  </div>
                  <textarea
                    rows={3}
                    placeholder='เช่น "เว้นขอบขาว 1 ซม.", "เน้นสีโทนอุ่น", "ตัดแยกเป็นแผ่น"'
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                  />
                </div>

                <div className="configurator-summary">
                  <div className="configurator-summary-row">
                    <span>ประมาณการสเปก</span>
                    <strong>{quantity} ชิ้น</strong>
                  </div>
                  <div className="configurator-summary-total">
                    <span>รูปแบบราคา</span>
                    <strong style={{ color: '#d97706' }}>ส่งคำขอประเมินราคาโดยแอดมิน (RFQ Flow)</strong>
                  </div>
                </div>

                <button type="submit" className="btn btn--gold btn--lg btn--block">
                  ส่งออเดอร์เพื่อขอใบเสนอราคา (Submit RFQ) <ArrowRightIcon size={20} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile sticky summary bar */}
      <div className="mobile-sticky-bar">
        <div className="mobile-sticky-price">
          <span>ยอดรวม</span>
          <strong>{formatMoney(totalDisplay, currency)}</strong>
        </div>
        <button type="button" className="btn btn--gold" onClick={goToCheckout}>
          ดำเนินการสั่งชำระเงิน
        </button>
      </div>
    </>
  )
}
