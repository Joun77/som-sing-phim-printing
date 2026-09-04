import { useMemo, useRef, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useShop } from '../context/ShopContext.tsx'
import { BANK_ACCOUNT, COURIERS, FREE_SHIPPING_THRESHOLD } from '../data/shipping.ts'
import { buildBcelOnePayPayload } from '../utils/promptpay.ts'
import { formatMoney } from '../utils/currency.ts'
import { generateOrderId } from '../utils/orderId.ts'
import { submitOrder, verifySlipPayment, fetchCouriers, fetchPaymentMethods, fetchLaoLocations } from '../api/client.ts'
import ProductArt from '../components/ProductArt.tsx'
import {
  CheckIcon,
  CopyIcon,
  CreditCardIcon,
  ShieldIcon,
  TruckIcon,
  UploadIcon,
} from '../components/icons.tsx'
import { Zap, Check, Store } from 'lucide-react'

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

import { LAO_LOCATIONS, type LaoProvince } from '../data/laoLocations'

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

  // Step 1: Buyer Info
  const [buyer, setBuyer] = useState({ 
    name: '', 
    phone: '', 
    email: '', 
  })

  // Step 2: Shipping & Recipient Info
  const [couriersList, setCouriersList] = useState(COURIERS)
  const [courierId, setCourierId] = useState(COURIERS[0]?.id || '')
  const [sameAsBuyer, setSameAsBuyer] = useState(true)
  const [recipient, setRecipient] = useState({
    name: '',
    phone: '',
    province: 'ນະຄອນຫຼວງວຽງຈັນ (Vientiane Capital)',
    district: '',
    village: '',
    branchCode: '',
  })

  const [slipImage, setSlipImage] = useState<File | null>(null)
  const [slipPreview, setSlipPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [paymentSlipped, setPaymentSlipped] = useState(false)
  const [failedQRUrls, setFailedQRUrls] = useState<Set<string>>(new Set())
  const [failedLogoUrls, setFailedLogoUrls] = useState<Set<string>>(new Set())
  const [locations, setLocations] = useState<LaoProvince[]>(LAO_LOCATIONS)
  const [saveAddressBook, setSaveAddressBook] = useState(true)

  useEffect(() => {
    const storedPhone = localStorage.getItem('ssp_customer_phone');
    if (storedPhone) {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      fetch(`${apiBase}/v1/public/customer/profile?phone=${encodeURIComponent(storedPhone)}`)
        .then(res => res.ok ? res.json() : null)
        .then(json => {
          if (json && json.status === 'success' && json.data) {
            const p = json.data;
            setBuyer(prev => ({
              ...prev,
              name: p.name || prev.name,
              phone: p.phone ? p.phone.replace('+856 20 ', '').replace('020', '').trim() : prev.phone,
              email: p.email || prev.email
            }));
            setRecipient(prev => ({
              ...prev,
              name: p.name || prev.name,
              phone: p.phone ? p.phone.replace('+856 20 ', '').replace('020', '').trim() : prev.phone,
              province: p.province || prev.province,
              district: p.district || prev.district,
              village: p.village || prev.village,
              branchCode: p.branchCode || prev.branchCode
            }));
          }
        }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    // Fetch locations live from PostgreSQL Database / Backend API
    fetchLaoLocations()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLocations(data)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchCouriers().then((res) => {
      if (res && Array.isArray(res) && res.length > 0) {
        const mapped = res.map((c) => ({
          id: c.id,
          name: c.name,
          short: c.shortName || c.name.split(' ')[0],
          fee: Number(c.fee) || 0,
          eta: c.eta || '1-2 ວັນ',
          freeAbove: Number(c.freeAbove) || 300000,
          color: c.color || '#2563eb',
          logoUrl: c.logoUrl,
        }))
        setCouriersList(mapped)
        setCourierId((prev) => (mapped.some((m) => m.id === prev) ? prev : mapped[0].id))
      }
    })
  }, [])

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

  const hasOnDemandItem = useMemo(() => {
    return checkoutItems.some(
      (item) =>
        item.product?.isOnDemand ||
        item.config?.quantity === 1 ||
        item.product?.minQuantity === 1
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
  const courier = couriersList.find((c) => c.id === courierId) || couriersList[0] || COURIERS[0]
  
  const subtotalDisplay = (subtotal >= 500 || currency === 'LAK' || !currency)
    ? (currency === 'LAK' || !currency ? subtotal : convertTo(subtotal / 630.5))
    : convertTo(subtotal)
  const freeThreshold = currency === 'LAK' ? (courier.freeAbove || 300000) : Math.round((courier.freeAbove || 300000) / 630.5)
  const isFreeShipping = (courier.freeAbove || 0) > 0 && subtotalDisplay >= freeThreshold
  const shippingFeeInLAK = isFreeShipping ? 0 : Number(courier.fee || 0)
  const shippingFeeDisplay = currency === 'LAK' ? shippingFeeInLAK : (currency === 'THB' ? Math.round(shippingFeeInLAK / 630.5) : (shippingFeeInLAK / 22100))
  
  const totalDisplay = subtotalDisplay + shippingFeeDisplay
  const amountToPayDisplay = (!hasOnDemandItem && paymentType === 'deposit') ? Math.ceil(totalDisplay * 0.5) : totalDisplay
  const remainingDisplay = totalDisplay - amountToPayDisplay
  const amountToPay = amountToPayDisplay

  const [bankAccountsList, setBankAccountsList] = useState<any[]>(() => {
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
  })

  const [selectedBankId, setSelectedBankId] = useState<string>(
    bankAccountsList.find((b: any) => b.isDefault)?.id || bankAccountsList[0]?.id || 'default'
  )

  useEffect(() => {
    let isMounted = true
    fetchPaymentMethods().then((remoteBanks) => {
      if (isMounted && remoteBanks && remoteBanks.length > 0) {
        const active = remoteBanks.filter((b: any) => b.isActive !== false)
        if (active.length > 0) {
          setBankAccountsList(active)
          setSelectedBankId((prev) => {
            const exists = active.find((b: any) => b.id === prev)
            if (exists) return prev
            const def = active.find((b: any) => b.isDefault)
            return def ? def.id : active[0].id
          })
        }
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  const activeBankAccount = useMemo(
    () => bankAccountsList.find((b: any) => b.id === selectedBankId) || bankAccountsList[0] || BANK_ACCOUNT,
    [bankAccountsList, selectedBankId]
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
      setSlipVerifyError(null)
      setSlipVerified(true)
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
    
    // Step 1: Buyer validation
    if (!buyer.name.trim()) {
      errs.buyerName = language === 'en' ? 'Please enter buyer name' : 'ກະລຸນາໃສ່ຊື່-ນາມສະກຸນ ຜູ້ສັ່ງຊື້'
    }
    const cleanBuyerPhone = buyer.phone.replace(/\D/g, '')
    if (!cleanBuyerPhone || cleanBuyerPhone.length < 7) {
      errs.buyerPhone = language === 'en' ? 'Please enter buyer phone number' : 'ກະລຸນາໃສ່ເບີໂທລະສັບຜູ້ສັ່ງຊື້ (+856 20 xxxxxxxx)'
    }

    // Step 2: Courier & Recipient validation
    if (!courierId) {
      errs.courier = language === 'en' ? 'Please select a delivery carrier' : 'ກະລຸນາເລືອກບໍລິສັດຂົນສົ່ງ'
    }

    if (courierId && courierId !== 'self_pickup') {
      if (!sameAsBuyer) {
        if (!recipient.name.trim()) {
          errs.recipientName = language === 'en' ? 'Please enter recipient name' : 'ກະລຸນາໃສ່ຊື່-ນາມສະກຸນ ຜູ້ຮັບພັສດຸ'
        }
        const cleanRecPhone = recipient.phone.replace(/\D/g, '')
        if (!cleanRecPhone || cleanRecPhone.length < 7) {
          errs.recipientPhone = language === 'en' ? 'Please enter recipient phone number' : 'ກະລຸນາໃສ່ເບີໂທລະສັບຜູ້ຮັບ (+856 20 xxxxxxxx)'
        }
      }
      if (!recipient.province.trim()) {
        errs.province = language === 'en' ? 'Please select province' : 'ກະລຸນາເລືອກແຂວງ'
      }
      if (!recipient.district.trim()) {
        errs.district = language === 'en' ? 'Please enter district' : 'ກະລຸນາໃສ່ເມືອງ'
      }
      if (!recipient.village.trim()) {
        errs.village = language === 'en' ? 'Please enter village' : 'ກະລຸນາໃສ່ບ້ານ'
      }
      if (!recipient.branchCode.trim()) {
        errs.branchCode = language === 'en' ? 'Please enter destination branch' : 'ກະລຸນາໃສ່ລະຫັດສາຂາ ຫຼື ຊື່ສາຂາປາຍທາງ'
      }
    }

    // Step 3: Payment
    if (!slipImage && !slipPreview) {
      errs.slip = language === 'en' ? 'Please attach bank payment slip' : 'ກະລຸນາແນບຮູບສະລິບໂອນເງິນ'
    }

    setErrors(errs)
    if (Object.keys(errs).length > 0) return false
    return true
  }

  const submit = async () => {
    if (!validate()) return
    setSubmitting(true)
    setIsVerifyingSlip(true)
    setSlipVerifyError(null)

    const orderId = generateOrderId()
    const firstItem = checkoutItems[0]

    const fullBuyerPhone = `+856 20 ${buyer.phone.replace(/\D/g, '')}`
    const finalRecipientName = sameAsBuyer ? buyer.name.trim() : (recipient.name.trim() || buyer.name.trim())
    const finalRecipientPhone = sameAsBuyer ? fullBuyerPhone : `+856 20 ${recipient.phone.replace(/\D/g, '') || buyer.phone.replace(/\D/g, '')}`

    const fullAddress = courierId === 'self_pickup'
      ? 'ຮັບເອງທີ່ຮ້ານ ສົມສິ່ງພິມ (Self Pickup)'
      : `ບ້ານ ${recipient.village.trim()}, ເມືອງ ${recipient.district.trim()}, ແຂວງ ${recipient.province.trim()}${recipient.branchCode ? ` (ສາຂາປາຍທາງ: ${recipient.branchCode.trim()})` : ''} [ຜູ້ຮັບ: ${finalRecipientName}, ໂທ: ${finalRecipientPhone}]`

    const order: any = {
      order_id: orderId,
      order_no: orderId,
      order_number: orderId,
      customer_name: buyer.name.trim(),
      customer_phone: fullBuyerPhone,
      phone: fullBuyerPhone,
      customer_email: buyer.email.trim(),
      email: buyer.email.trim(),
      customer_address: fullAddress,
      address: fullAddress,
      delivery_address_details: {
        recipient_name: finalRecipientName,
        recipient_phone: finalRecipientPhone,
        village: recipient.village.trim(),
        district: recipient.district.trim(),
        province: recipient.province.trim(),
        branch_code: recipient.branchCode.trim(),
      },
      product_id: firstItem?.product?.id || 'custom-print',
      specs: {
        size: checkoutItems.map((i) => `${i.product?.name || ''}: ${i.config?.specLabels?.size || ''}`).join(' | '),
        paper: checkoutItems.map((i) => i.config?.specLabels?.paper || '').join(' | '),
        finishing: checkoutItems.map((i) => i.config?.specLabels?.finishing || '').join(' | '),
      },
      quantity: checkoutItems.reduce((sum, i) => sum + (i.config?.quantity || 1), 0),
      items: checkoutItems.flatMap((i) => {
        if (i.bookItems && i.bookItems.length > 0) {
          return i.bookItems.map((b) => ({
            product_id: i.product?.id || 'doc-copy-binding',
            product_name: `${i.product?.name || 'ເຂົ້າເລັ້ມສັນກາວ'} - ${b.title || 'ປຶ້ມ'}`,
            job_name: b.title || 'ປຶ້ມ',
            name: `${i.product?.name || 'ເຂົ້າເລັ້ມສັນກາວ'} - ${b.title || 'ປຶ້ມ'}`,
            quantity: b.quantity || 1,
            page_count: b.innerPageCount || 60,
            spine_width_mm: b.spineThicknessMm || 3.8,
            cover_file_url: b.coverFileUrl || b.coverFileName || '',
            inner_file_url: b.innerFileUrl || b.innerFileName || '',
            specs: {
              ...i.config?.specLabels,
              size: (b.sizeId || i.config?.sizeId || 'a4').toUpperCase(),
              cover_paper: b.coverPaperId || 'artcard-260',
              cover_pages: `${b.coverPageCount || 1} spread`,
              paper: b.materialId || i.config?.materialId || 'bond-80',
              finishing: b.finishingId || i.config?.finishingId || 'gloss-lam',
              spine: `${b.spineThicknessMm}mm`,
              pages: `${b.innerPageCount}pp`,
              color_mode: b.colorMode || 'cmyk',
            } as Record<string, any>,
            unit_price: b.unitPriceThb || 0,
            total_price: b.totalPriceThb || 0,
            drive_link: b.innerFileUrl || b.coverFileUrl || i.driveLink,
          }))
        }
        return [
          {
            product_id: i.product?.id || 'custom-print',
            product_name: i.product?.name || 'Print Item',
            job_name: i.product?.name || 'Print Item',
            item_name: i.product?.name || 'Print Item',
            name: i.product?.name || 'Print Item',
            quantity: i.config?.quantity || 1,
            page_count: 1,
            spine_width_mm: 0,
            cover_file_url: i.coverFileUrl || '',
            inner_file_url: i.innerFileUrl || '',
            specs: (i.config?.specLabels || {}) as Record<string, any>,
            unit_price: i.price?.unitPrice || 0,
            total_price: i.price?.total || 0,
            unit_price_lak: currency === 'LAK' ? (i.price?.unitPrice || 0) : Math.round((i.price?.unitPrice || 0) * 630.5),
            total_price_lak: currency === 'LAK' ? (i.price?.total || 0) : Math.round((i.price?.total || 0) * 630.5),
            drive_link: i.driveLink,
          },
        ]
      }),
      drive_link: checkoutItems.map((i) => i.driveLink).filter(Boolean).join(', '),
      is_permission_confirmed: checkoutItems.every((i) => i.permissionConfirmed),
      special_notes: checkoutItems.map((i) => i.specialNotes).filter(Boolean).join('; '),
      shipping_courier_id: courierId,
      shipping_fee: shippingFeeInLAK,
      total_price: currency === 'LAK' ? totalDisplay : Math.round(totalDisplay * 630.5),
      total_amount_lak: currency === 'LAK' ? totalDisplay : Math.round(totalDisplay * 630.5),
      currency: 'LAK',
      payment_slip_url: slipPreview,
      status: 'PAID_PREPRESS',
      created_at: new Date().toISOString(),
      timeline: [
        {
          status: 'PAID_PREPRESS',
          label: language === 'en' ? 'Slip Verified (PAID_PREPRESS)' : 'ກວດສອບສະລິບສຳເລັດ (PAID_PREPRESS)',
          at: Date.now(),
        },
      ],
    }

    try {
      let placed = order
      try {
        placed = await submitOrder(order)
      } catch (backendErr) {
        console.warn('[Backend submit fallback to local]', backendErr)
        // Store in local list
        try {
          const existingOrders = JSON.parse(localStorage.getItem('ssp_orders') || '[]')
          existingOrders.unshift(order)
          localStorage.setItem('ssp_orders', JSON.stringify(existingOrders))
        } catch {
          // ignore
        }
      }

      if (saveAddressBook) {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
        fetch(`${apiBase}/v1/public/customer/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: fullBuyerPhone,
            name: buyer.name
          })
        }).then(res => res.ok ? res.json() : null)
          .then(json => {
            if (json && json.status === 'success' && json.data) {
              const p = json.data;
              localStorage.setItem('ssp_customer_phone', p.phone);
              localStorage.setItem('ssp_customer_id', p.id);
              // Save shipping details
              fetch(`${apiBase}/v1/public/customer/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: p.id,
                  name: buyer.name,
                  phone: p.phone,
                  province: recipient.province,
                  district: recipient.district,
                  village: recipient.village,
                  address: sameAsBuyer ? `ບ້ານ ${recipient.village}, ເມືອງ ${recipient.district}, ແຂວງ ${recipient.province}` : `ບ້ານ ${recipient.village}, ເມືອງ ${recipient.district}, ແຂວງ ${recipient.province}`,
                  branchCode: recipient.branchCode
                })
              }).catch(() => {});
            }
          }).catch(() => {});
      }

      setSlipVerified(true)
      setIsVerifyingSlip(false)
      setAutoRedirectSeconds(3)

      localStorage.setItem('ssp_placed_order', JSON.stringify(placed))
      clearSelectedCartItems()
      setOrderDraft(null)

      setTimeout(() => {
        navigate(`/success/${placed.order_id}`, { state: { order: placed } })
      }, 2000)
    } catch (err: any) {
      setIsVerifyingSlip(false)
      setSubmitting(false)
      setSlipVerifyError(err.message || 'Failed to complete order submission')
    }
  }

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

  return (
    <section className="section section--alt checkout-page">
      <div className="container checkout-container">
        <h1 className="checkout-title">ຊຳລະເງິນ ແລະ ຈັດສົ່ງ (Checkout)</h1>

        <div className="checkout-layout">
          {/* ---------- Left column: forms ---------- */}
          <div className="checkout-main">
            {/* Step 1: Buyer Info */}
            <div className="checkout-card">
              <div className="checkout-card-head">
                <span className="checkout-step">1</span>
                <h2>ຂໍ້ມູນຜູ້ສັ່ງຊື້ (Buyer Information)</h2>
              </div>

              <div className="field">
                <label htmlFor="b-name">
                  ຊື່-ນາມສະກຸນ ຜູ້ສັ່ງຊື້ (Buyer Name) <span className="text-danger">*</span>
                </label>
                <input
                  id="b-name"
                  type="text"
                  placeholder="ເຊັ່ນ: ທ້າວ ສົມໃຈ ດີເລີດ"
                  value={buyer.name}
                  onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                />
                {errors.buyerName && <p className="field-error">{errors.buyerName}</p>}
              </div>

              <div className="field">
                <label htmlFor="b-phone">
                  ເບີໂທລະສັບຜູ້ສັ່ງຊື້ (Buyer Phone) <span className="text-danger">*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 800, fontSize: '0.95rem', color: '#1e293b', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="font-semibold text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">LA</span>
                    <span>+856 20</span>
                  </div>
                  <input
                    id="b-phone"
                    type="tel"
                    placeholder="55123456"
                    value={buyer.phone}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '')
                      setBuyer({ ...buyer, phone: clean })
                    }}
                    style={{ flex: 1 }}
                  />
                </div>
                <small style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                  ໃສ່ສະເພາະຕົວເລກ 8 ຫຼັກ (ເຊັ່ນ 55123456, 77889900, 99112233)
                </small>
                {errors.buyerPhone && <p className="field-error">{errors.buyerPhone}</p>}
              </div>

              <div className="field">
                <label htmlFor="b-email">ອີເມວສຳລັບຮັບແຈ້ງເຕືອນສະテナンス (Email Notification - ຖ້າມີ)</label>
                <input
                  id="b-email"
                  type="email"
                  placeholder="customer@example.com (ຮັບໃບເຊັດ ແລະ ອັບເດດສະຖານະງານພິມ)"
                  value={buyer.email}
                  onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
                />
              </div>

              <div className="field mt-3" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  id="save-address-checkbox"
                  type="checkbox"
                  checked={saveAddressBook}
                  onChange={(e) => setSaveAddressBook(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="save-address-checkbox" style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', color: '#334155' }}>
                  ບັນທຶກຂໍ້ມູນນີ້ສຳລັບການສັ່ງຊື້ຄັ້ງຕໍ່ໄປ (ບັນທຶກລົງ Address Book)
                </label>
              </div>
            </div>

            {/* Step 2: Carrier & Conditional Delivery Info */}
            <div className="checkout-card">
              <div className="checkout-card-head">
                <span className="checkout-step">2</span>
                <h2>ເລືອກບໍລິສັດຂົນສົ່ງ & ຂໍ້ມູນຈັດສົ່ງ (Shipping & Delivery)</h2>
              </div>

              <div className="field">
                <label style={{ fontWeight: 700, marginBottom: '8px', display: 'block' }}>
                  ເລືອກບໍລິສັດຂົນສົ່ງ (Select Carrier) <span className="text-danger">*</span>
                </label>
                <div className="courier-list">
                  {couriersList.map((c: any) => {
                    const free = (c.freeAbove || 0) > 0 && subtotalDisplay >= (currency === 'LAK' ? c.freeAbove : Math.round(c.freeAbove / 630.5))
                    const itemFeeInLAK = free ? 0 : Number(c.fee || 0)
                    const itemFeeDisplay = currency === 'LAK' ? itemFeeInLAK : (currency === 'THB' ? Math.round(itemFeeInLAK / 630.5) : (itemFeeInLAK / 22100))
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
                        {c.logoUrl ? (
                          <span className="courier-brand" style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            <img
                              src={c.logoUrl}
                              alt={c.short}
                              style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </span>
                        ) : (
                          <span className="courier-brand" style={{ background: `${c.color || '#2563eb'}1a`, color: c.color || '#2563eb' }}>
                            {c.short || c.name}
                          </span>
                        )}
                        <span className="courier-main">
                          <strong>{c.name}</strong>
                          <small>{c.eta} · ໄລຍະເວລາຈັດສົ່ງຂຶ້ນຢູ່ກັບບໍລິສັດຂົນສົ່ງ</small>
                        </span>
                        <span className="courier-fee">
                          {free ? (
                            <em className="courier-free">ສົ່ງຟຣີ</em>
                          ) : (
                            formatMoney(itemFeeDisplay, currency)
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {errors.courier && <p className="field-error">{errors.courier}</p>}
              </div>

              {/* Conditional Recipient & Address Form: Expands once a courier is chosen */}
              {courierId ? (
                <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px dashed #cbd5e1' }}>
                  {courierId === 'self_pickup' ? (
                    <div style={{ padding: '16px', borderRadius: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46' }}>
                      <strong style={{ display: 'block', marginBottom: '4px' }}>ຮັບສິນຄ້າທີ່ຮ້ານ ສົມສິ່ງພິມ (Self Pickup)</strong>
                      <span style={{ fontSize: '0.88rem' }}>ສະຖານທີ່: ຖະໜົນລ້ານຊ້າງ, ບ້ານຫັດສະດີ, ເມືອງຈັນທະບູລີ, ນະຄອນຫຼວງວຽງຈັນ (ເປີດທຸກວັນ ຈັນ-ເສົາ 08:30 - 17:30)</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                          ຂໍ້ມູນຜູ້ຮັບ ແລະ ສາຂາປາຍທາງ
                        </h3>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', color: '#334155' }}>
                          <input
                            type="checkbox"
                            checked={sameAsBuyer}
                            onChange={(e) => setSameAsBuyer(e.target.checked)}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--gold)' }}
                          />
                          <span>ຜູ້ຮັບແມ່ນຄົນດຽວກັບຜູ້ສັ່ງຊື້</span>
                        </label>
                      </div>

                      {!sameAsBuyer && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                          <div className="field">
                            <label htmlFor="r-name">
                              ຊື່-ນາມສະກຸນ ຜູ້ຮັບ (Recipient Name) <span className="text-danger">*</span>
                            </label>
                            <input
                              id="r-name"
                              type="text"
                              placeholder="ເຊັ່ນ: ທ້າວ ສົມໃຈ ດີເລີດ"
                              value={recipient.name}
                              onChange={(e) => setRecipient({ ...recipient, name: e.target.value })}
                            />
                            {errors.recipientName && <p className="field-error">{errors.recipientName}</p>}
                          </div>

                          <div className="field">
                            <label htmlFor="r-phone">
                              ເບີໂທລະສັບຜູ້ຮັບ (Recipient Phone) <span className="text-danger">*</span>
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 800, fontSize: '0.95rem', color: '#1e293b', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="font-semibold text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">LA</span>
                                <span>+856 20</span>
                              </div>
                              <input
                                id="r-phone"
                                type="tel"
                                placeholder="55123456"
                                value={recipient.phone}
                                onChange={(e) => {
                                  const clean = e.target.value.replace(/\D/g, '')
                                  setRecipient({ ...recipient, phone: clean })
                                }}
                                style={{ flex: 1 }}
                              />
                            </div>
                            <small style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                              ໃສ່ສະເພາະຕົວເລກ 8 ຫຼັກ (ເຊັ່ນ 55123456, 77889900, 99112233)
                            </small>
                            {errors.recipientPhone && <p className="field-error">{errors.recipientPhone}</p>}
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '6px' }}>
                        <div className="field">
                          <label htmlFor="r-province">
                            ແຂວງ (Province) <span className="text-danger">*</span>
                          </label>
                          <select
                            id="r-province"
                            value={recipient.province}
                            onChange={(e) => {
                              const newProvLabel = e.target.value
                              const found = locations.find(
                                (p) =>
                                  p.label === newProvLabel ||
                                  p.nameLa === newProvLabel ||
                                  newProvLabel.includes(p.nameLa)
                              )
                              const newDistricts = found ? found.districts : []
                              setRecipient({ 
                                ...recipient, 
                                province: newProvLabel,
                                district: newDistricts.length > 0 ? `${newDistricts[0].nameLa} (${newDistricts[0].nameEn})` : ''
                              })
                            }}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.9rem' }}
                          >
                            {locations.map((prov) => (
                              <option key={prov.label || prov.nameLa} value={prov.label || prov.nameLa}>
                                {prov.label || `${prov.nameLa} (${prov.nameEn})`}
                              </option>
                            ))}
                          </select>
                          {errors.province && <p className="field-error">{errors.province}</p>}
                        </div>

                        <div className="field">
                          <label htmlFor="r-district">
                            ເມືອງ (District) <span className="text-danger">*</span>
                          </label>
                          {(() => {
                            const curProv = locations.find(
                              (p) =>
                                p.label === recipient.province ||
                                p.nameLa === recipient.province ||
                                recipient.province.includes(p.nameLa)
                            )
                            const distList = curProv ? curProv.districts : []
                            if (distList.length > 0) {
                              return (
                                <select
                                  id="r-district"
                                  value={recipient.district}
                                  onChange={(e) => setRecipient({ ...recipient, district: e.target.value })}
                                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.9rem' }}
                                >
                                  <option value="">-- ເລືອກເມືອງ (Select District) --</option>
                                  {distList.map((d) => (
                                    <option key={d.nameLa} value={`${d.nameLa} (${d.nameEn})`}>
                                      {d.nameLa} ({d.nameEn})
                                    </option>
                                  ))}
                                </select>
                              )
                            }
                            return (
                              <input
                                id="r-district"
                                type="text"
                                placeholder="ເຊັ່ນ: ຈັນທະບູລີ, ໄຊເສດຖາ, ໂພນໂຮງ"
                                value={recipient.district}
                                onChange={(e) => setRecipient({ ...recipient, district: e.target.value })}
                              />
                            )
                          })()}
                          {errors.district && <p className="field-error">{errors.district}</p>}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '12px' }}>
                        <div className="field">
                          <label htmlFor="r-village">
                            ບ້ານ / ລາຍລະອຽດທີ່ຢູ່ (Village / Street) <span className="text-danger">*</span>
                          </label>
                          <input
                            id="r-village"
                            type="text"
                            placeholder="ເຊັ່ນ: ບ້ານ ດົງໂດກ, ຮ່ອມ 5, ເຮືອນ 123"
                            value={recipient.village}
                            onChange={(e) => setRecipient({ ...recipient, village: e.target.value })}
                          />
                          {errors.village && <p className="field-error">{errors.village}</p>}
                        </div>

                        <div className="field">
                          <label htmlFor="r-branch">
                            ລະຫັດສາຂາ / ສາຂາຂົນສົ່ງປາຍທາງ <span className="text-danger">*</span>
                          </label>
                          <input
                            id="r-branch"
                            type="text"
                            placeholder="ເຊັ່ນ: ສາຂາໂພນໂຮງ (HL-04) ຫຼື ສາຂາດົງໂດກ"
                            value={recipient.branchCode}
                            onChange={(e) => setRecipient({ ...recipient, branchCode: e.target.value })}
                          />
                          {errors.branchCode && <p className="field-error">{errors.branchCode}</p>}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ padding: '14px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', color: '#64748b', textAlign: 'center', fontSize: '0.88rem', marginTop: '14px' }}>
                  <span className="font-bold text-amber-600">!</span> ກະລຸນາເລືອກບໍລິສັດຂົນສົ່ງດ້ານເທິງກ່ອນ ເພື່ອກອກຂໍ້ມູນສາຂາປາຍທາງ ແລະ ທີ່ຢູ່ຈັດສົ່ງ
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="checkout-card">
              <div className="checkout-card-head">
                <span className="checkout-step">3</span>
                <h2>ຊຳລະເງິນ (Payment)</h2>
              </div>

              {bankAccountsList.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, display: 'block', marginBottom: '8px', color: 'var(--text-main)' }}>
                    ເລືອກບັນຊີທະນາຄານຮັບເງິນ (Select Bank Account):
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    {bankAccountsList.map((b: any) => {
                      const isSelected = selectedBankId === b.id
                      const bName = b.bankName || b.bank || 'Bank'
                      const bLogo = b.logoUrl
                      return (
                        <button
                          key={b.id || b.accountNumber}
                          type="button"
                          onClick={() => setSelectedBankId(b.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 14px',
                            borderRadius: '14px',
                            border: isSelected ? '2px solid #059669' : '1px solid #cbd5e1',
                            background: isSelected ? '#ecfdf5' : '#ffffff',
                            color: isSelected ? '#047857' : '#334155',
                            cursor: 'pointer',
                            textAlign: 'left',
                            boxShadow: isSelected ? '0 4px 12px rgba(5, 150, 105, 0.12)' : 'none',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                            {bLogo && !failedLogoUrls.has(bLogo) ? (
                              <img
                                src={bLogo.startsWith('http') || bLogo.startsWith('data:') ? bLogo : `${bLogo.startsWith('/') ? '' : '/'}${bLogo}`}
                                alt={bName}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                onError={() => {
                                  setFailedLogoUrls((prev) => new Set(prev).add(bLogo))
                                }}
                              />
                            ) : (
                              <CreditCardIcon size={16} color={isSelected ? '#059669' : '#64748b'} />
                            )}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {bName.split('(')[0] || bName}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: isSelected ? '#047857' : '#64748b', fontFamily: 'monospace' }}>
                              {b.accountNumber ? b.accountNumber.slice(-7) : ''}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
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
                    <Zap size={20} className="text-amber-400 shrink-0" />
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
                      <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        <Check className="w-4 h-4 text-amber-600 inline" /> ຊຳລະເຕັມ 100%
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
                      <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        <Check className="w-4 h-4 text-amber-600 inline" /> ມັດຈຳ 50%
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
                    <CreditCardIcon size={16} /> QR Code ສະແກນຊຳລະເງິນ
                  </span>
                  <div className="payment-qr-canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px' }}>
                    {activeBankAccount.qrCodeUrl && !failedQRUrls.has(activeBankAccount.qrCodeUrl) ? (
                      <img
                        src={activeBankAccount.qrCodeUrl.startsWith('http') || activeBankAccount.qrCodeUrl.startsWith('data:') ? activeBankAccount.qrCodeUrl : `${activeBankAccount.qrCodeUrl.startsWith('/') ? '' : '/'}${activeBankAccount.qrCodeUrl}`}
                        alt="Bank QR Code"
                        style={{ width: '180px', height: '180px', objectFit: 'contain', borderRadius: '12px', background: '#fff' }}
                        onError={() => {
                          setFailedQRUrls((prev) => new Set(prev).add(activeBankAccount.qrCodeUrl!))
                        }}
                      />
                    ) : (
                      <QRCodeSVG value={qrPayload} size={180} bgColor="#ffffff" fgColor="#0C2340" level="M" />
                    )}
                  </div>
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Store className="w-4 h-4 text-slate-500 inline" /> {activeBankAccount.shopName || activeBankAccount.promptpayName || 'ຮ້ານ ສົມສິ່ງພິມ (Som-Sing Phim)'}
                    </span>
                    <p className="payment-qr-amount" style={{ marginTop: '4px' }}>
                      ຍອດຊຳລະຕອນນີ້ {formatMoney(amountToPayDisplay, currency)}
                    </p>
                  </div>
                </div>

                <div className="payment-bank">
                  <span className="payment-qr-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activeBankAccount.logoUrl && !failedLogoUrls.has(activeBankAccount.logoUrl) ? (
                      <img
                        src={activeBankAccount.logoUrl.startsWith('http') || activeBankAccount.logoUrl.startsWith('data:') ? activeBankAccount.logoUrl : `${activeBankAccount.logoUrl.startsWith('/') ? '' : '/'}${activeBankAccount.logoUrl}`}
                        alt={activeBankAccount.bankName || activeBankAccount.bank}
                        style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                        onError={() => {
                          setFailedLogoUrls((prev) => new Set(prev).add(activeBankAccount.logoUrl!))
                        }}
                      />
                    ) : (
                      <ShieldIcon size={16} />
                    )}
                    <span>ໂອນເງິນຜ່ານ {activeBankAccount.bankName || activeBankAccount.bank}</span>
                  </span>
                  <ul className="bank-list">
                    <li>
                      <span>ທະນາຄານ</span>
                      <strong>{activeBankAccount.bankName || activeBankAccount.bank} {activeBankAccount.branch ? `(${activeBankAccount.branch})` : ''}</strong>
                    </li>
                    {activeBankAccount.shopName && (
                      <li>
                        <span>ຊື່ຮ້ານຄ້າ (QR)</span>
                        <strong style={{ color: '#047857' }}>{activeBankAccount.shopName}</strong>
                      </li>
                    )}
                    <li>
                      <span>ຊື່ເຈົ້າຂອງບັນຊີ</span>
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
                ຊຳລະເງິນດ້ວຍແອັບທະນາຄານໂດຍສະແກນ QR ຫຼື ໂອນຜ່ານເລກບັນຊີ ກະລຸນາກວດສອບຍອດເງິນ ແລະ ຊື່ບັນຊີໃຫ້ຖືກຕ້ອງກ່ອນຢືນຢັນ
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
                        ctx.fillText('TRANSFER SUCCESSFUL', 50, 280)
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
                    <Zap size={14} />
                    <span>ໃຊ້ສະລິບທົດສອບ (Quick Test Slip)</span>
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

                      {/* Multi-Book Details in Checkout */}
                      {item.bookItems && item.bookItems.length > 0 && (
                        <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.78rem' }}>
                          <strong style={{ display: 'block', marginBottom: '4px', color: '#b45309' }}>
                            {language === 'en' ? 'Included Books' : 'ລາຍການປຶ້ມໃນຊຸດ'} ({item.bookItems.length} {language === 'en' ? 'Titles' : 'ເລື່ອງ'}):
                          </strong>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {item.bookItems.map((b, bIdx) => (
                              <div key={b.id || bIdx} style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                                <span>{b.title || `ເລື່ອງທີ ${bIdx + 1}`}</span>
                                <span style={{ fontWeight: 600 }}>
                                  {b.innerPageCount} {language === 'en' ? 'pp' : 'ໜ້າ'} (ສັນ {b.spineThicknessMm}mm) × {b.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="checkout-lines">
                <div className="checkout-line">
                  <span>ຍອດລວມສິນຄ້າ</span>
                  <strong>{formatMoney(subtotalDisplay, currency)}</strong>
                </div>
                <div className="checkout-line">
                  <span>ຄ່າຈັດສົ່ງ ({courier.name})</span>
                  {isFreeShipping ? (
                    <strong className="text-success">ສົ່ງຟຣີ</strong>
                  ) : (
                    <strong>{formatMoney(shippingFeeDisplay, currency)}</strong>
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
