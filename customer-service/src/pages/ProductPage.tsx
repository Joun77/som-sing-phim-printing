import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getCategory, getProduct, type Product, type SpecOption } from '../data/catalog.ts'
import { useShop } from '../context/ShopContext.tsx'
import { computePrice, getQuantityTier } from '../utils/pricing.ts'
import { formatMoney, formatMultiCurrency, fetchLiveExchangeRates } from '../utils/currency.ts'
import ProductArt from '../components/ProductArt.tsx'
import { fetchPublicProductBySlug, RemoteProduct, uploadArtworkFile } from '../api/client.ts'
import {
  ArrowRightIcon,
  CheckIcon,
  LinkIcon,
  MinusIcon,
  PlusIcon,
  UploadCloudIcon,
  FileCheckIcon,
  FileTextIcon,
  AlertCircleIcon,
  DownloadIcon,
  ZapIcon,
  XIcon,
  SparkleIcon,
  PrinterIcon,
  CartIcon,
} from '../components/icons.tsx'
import BoxModelViewer from '../components/3D/BoxModelViewer.tsx'
import QuantityStepper from '../components/QuantityStepper.tsx'
import { analyzeArtworkPreflight, type PreflightReport } from '../lib/preflightAnalyzer.ts'
import PreflightChecklistModal from '../components/PreflightChecklistModal.tsx'

interface OptionButtonProps {
  option: SpecOption
  selected: boolean
  onSelect: (id: string) => void
  language: string
}

function OptionButton({ option, selected, onSelect, language }: OptionButtonProps) {
  const label = language === 'en' && option.labelEn ? option.labelEn : option.label
  const hint = language === 'en' && option.hintEn ? option.hintEn : option.hint

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
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
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
  language: string
}

function SpecGroup({ title, hint, options, value, onChange, language }: SpecGroupProps) {
  return (
    <div className="spec-group">
      <div className="spec-group-head">
        <h3>{title}</h3>
        {hint && <span className="spec-group-hint">{hint}</span>}
      </div>
      <div className="spec-options">
        {options.map((o) => (
          <OptionButton key={o.id} option={o} selected={value === o.id} onSelect={onChange} language={language} />
        ))}
      </div>
    </div>
  )
}

export default function ProductPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { currency, convertTo, setOrderDraft, addToCart, t, language } = useShop()
  const localProduct = getProduct(slug)
  const [remoteProduct, setRemoteProduct] = useState<RemoteProduct | null>(null)

  useEffect(() => {
    if (slug) {
      fetchPublicProductBySlug(slug).then((res) => {
        if (res) {
          setRemoteProduct(res)
        }
      })
    }
  }, [slug])

  const product: Product | null = useMemo(() => {
    if (remoteProduct) {
      const mats: SpecOption[] = (remoteProduct.options || [])
        .filter(o => o.optionType === 'paper' || o.optionType === 'material')
        .map(o => ({
          id: o.value,
          label: o.label,
          hint: '',
          add: 0,
        }))

      const sizes: SpecOption[] = (remoteProduct.options || [])
        .filter(o => o.optionType === 'size')
        .map(o => ({
          id: o.value,
          label: o.label,
          hint: '',
          add: 0,
        }))

      const finishings: SpecOption[] = (remoteProduct.options || [])
        .filter(o => o.optionType === 'finishing' || o.optionType === 'cutting' || o.optionType === 'binding')
        .map(o => ({
          id: o.value,
          label: o.label,
          hint: '',
          add: o.extraCostRate ? Math.round(50 * o.extraCostRate) : 0,
        }))

      return {
        id: String(remoteProduct.id),
        slug: remoteProduct.slug,
        name: remoteProduct.name,
        nameEn: remoteProduct.name,
        category: remoteProduct.category,
        bestseller: false,
        basePrice: 50,
        image: remoteProduct.thumbnailUrl || 'album',
        short: remoteProduct.description || '',
        shortEn: remoteProduct.description || '',
        description: remoteProduct.description || '',
        descriptionEn: remoteProduct.description || '',
        sizes: sizes.length > 0 ? sizes : [{ id: 'standard', label: language === 'en' ? 'Standard Size' : 'ຂະໜາດມາດຕະຖານ', hint: '', add: 0 }],
        materials: mats.length > 0 ? mats : [{ id: 'standard_mat', label: language === 'en' ? 'Standard Material' : 'ວັດສະດຸມາດຕະຖານ', hint: '', add: 0 }],
        finishings: finishings.length > 0 ? finishings : [{ id: 'standard_cut', label: language === 'en' ? 'Straight Cut' : 'ຕັດກົງມາດຕະຖານ', hint: '', add: 0 }],
      }
    }
    return localProduct || null
  }, [remoteProduct, localProduct, language])

  const category = product ? getCategory(product.category) : null

  const [sizeId, setSizeId] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [finishingId, setFinishingId] = useState('')
  const [quantity, setQuantity] = useState(1)
  
  const [uploadMode, setUploadMode] = useState<'upload' | 'drive'>('upload')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [uploadedFileUrl, setUploadedFileUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [fileQualityNotice, setFileQualityNotice] = useState<string | null>(null)
  const [preflightReport, setPreflightReport] = useState<PreflightReport | null>(null)
  const [showPreflightModal, setShowPreflightModal] = useState(false)
  const [preflightConfirmed, setPreflightConfirmed] = useState(false)
  const [pendingAction, setPendingAction] = useState<'cart' | 'buy' | null>(null)
  
  const [driveLink, setDriveLink] = useState('')
  const [permissionConfirmed, setPermissionConfirmed] = useState(false)
  const [specialNotes, setSpecialNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showQuotationModal, setShowQuotationModal] = useState(false)

  // 3D Packaging Box Model Studio State
  const isPackagingProduct = Boolean(
    product?.category === 'packaging' ||
    product?.slug?.includes('box') ||
    product?.slug?.includes('pack') ||
    product?.image === 'box' ||
    category?.slug?.includes('box') ||
    category?.slug?.includes('pack')
  )

  const [is3DView, setIs3DView] = useState<boolean>(false)

  useEffect(() => {
    if (isPackagingProduct) {
      setIs3DView(true)
    }
  }, [isPackagingProduct])

  const boxDimensions = useMemo(() => {
    const s = sizeId.toLowerCase()
    if (s.includes('large') || s.includes('l') || s.includes('240')) return { l: 240, w: 160, h: 90 }
    if (s.includes('small') || s.includes('s') || s.includes('120')) return { l: 120, w: 85, h: 45 }
    return { l: 180, w: 120, h: 65 } // Default luxury box
  }, [sizeId])

  const finishingEffect = useMemo<'none' | 'gold_foil' | 'silver_foil' | 'spot_uv' | 'matte'>(() => {
    const f = finishingId.toLowerCase()
    if (f.includes('gold') || f.includes('foil')) return 'gold_foil'
    if (f.includes('silver')) return 'silver_foil'
    if (f.includes('uv') || f.includes('spot') || f.includes('gloss')) return 'spot_uv'
    return 'none'
  }, [finishingId])

  const isOnDemand = Boolean(
    remoteProduct?.isOnDemand ||
    (remoteProduct?.minQuantity === 1) ||
    product?.isOnDemand ||
    (product?.minQuantity === 1)
  )
  const minQty = isOnDemand ? 1 : (remoteProduct?.minQuantity || product?.minQuantity || 1)

  useEffect(() => {
    if (product) {
      if (!sizeId && product.sizes.length > 0) setSizeId(product.sizes[0].id)
      if (!materialId && product.materials.length > 0) setMaterialId(product.materials[0].id)
      if (!finishingId && product.finishings.length > 0) setFinishingId(product.finishings[0].id)
      if (quantity < minQty) {
        setQuantity(minQty)
      }
    }
  }, [product, minQty])

  const price = useMemo(() => {
    if (!product) return null
    return computePrice(product, { sizeId, materialId, finishingId, quantity })
  }, [product, sizeId, materialId, finishingId, quantity])

  const specLabels = useMemo(() => {
    if (!product) return { size: '', paper: '', finishing: '' }
    const s = product.sizes.find((x) => x.id === sizeId)
    const m = product.materials.find((x) => x.id === materialId)
    const f = product.finishings.find((x) => x.id === finishingId)
    return {
      size: s ? (language === 'en' && s.labelEn ? s.labelEn : s.label) : '',
      paper: m ? (language === 'en' && m.labelEn ? m.labelEn : m.label) : '',
      finishing: f ? (language === 'en' && f.labelEn ? f.labelEn : f.label) : '',
    }
  }, [product, sizeId, materialId, finishingId, language])

  if (!product) {
    return (
      <section className="section text-center container min-h-60 flex flex-col items-center justify-center">
        <h2>{t('productNotFound')}</h2>
        <Link to="/" className="btn btn--navy mt-2">
          {t('backToHome')}
        </Link>
      </section>
    )
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    setUploadedFileName(file.name)
    setIsUploading(true)
    setFileQualityNotice(null)
    setPreflightConfirmed(false)

    try {
      const report = await analyzeArtworkPreflight(file, {
        widthMM: boxDimensions.l,
        heightMM: boxDimensions.h,
      })
      setPreflightReport(report)
      setShowPreflightModal(true)

      const url = await uploadArtworkFile(file)
      setUploadedFileUrl(url)
    } catch {
      setUploadedFileUrl(`local://${file.name}`)
    } finally {
      setIsUploading(false)
    }
  }

  const validateInputs = () => {
    const nextErrors: Record<string, string> = {}
    
    if (uploadMode === 'drive') {
      if (!driveLink.trim()) {
        nextErrors.driveLink = language === 'en' ? 'Please provide a Google Drive link' : 'ກະລຸນາແນບລິ້ງ Google Drive ຂອງຟາຍງານ'
      } else if (!/^https?:\/\/drive\.google\.com\//.test(driveLink.trim())) {
        nextErrors.driveLink = language === 'en' ? 'Link must start with https://drive.google.com/...' : 'ລິ້ງຕ້ອງເປັນ Google Drive (https://drive.google.com/...)'
      }
      if (!permissionConfirmed) {
        nextErrors.permission = language === 'en' ? 'Please confirm view permissions are enabled' : 'ກະລຸນາຍືນຍັນວ່າໄດ້ເປີດສິດການເຂົ້າເຖິງລິ້ງແລ້ວ'
      }
    } else {
      if (!uploadedFileName) {
        nextErrors.file = language === 'en' ? 'Please upload an artwork file or switch to Google Drive link' : 'ກະລຸນາເລືອກອັບໂຫຼດຟາຍງານ ຫຼື ສະຫຼັບໄປແນບລິ້ງ Google Drive'
      }
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      document.querySelector('.configurator')?.scrollIntoView({ behavior: 'smooth' })
      return false
    }
    return true
  }

  const handleAddToCart = () => {
    if (!product || !price) return
    if (!validateInputs()) return

    if (uploadMode === 'upload' && preflightReport && !preflightConfirmed) {
      setPendingAction('cart')
      setShowPreflightModal(true)
      return
    }

    addToCart({
      product,
      config: {
        sizeId,
        materialId,
        finishingId,
        quantity,
        specLabels,
      },
      driveLink: uploadMode === 'drive' ? driveLink.trim() : uploadedFileUrl || uploadedFileName,
      permissionConfirmed: uploadMode === 'drive' ? permissionConfirmed : true,
      specialNotes,
      price: price!,
    })
  }

  const handleBuyNow = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!product || !price) return
    if (!validateInputs()) return

    if (uploadMode === 'upload' && preflightReport && !preflightConfirmed) {
      setPendingAction('buy')
      setShowPreflightModal(true)
      return
    }

    const item = {
      product,
      config: {
        sizeId,
        materialId,
        finishingId,
        quantity,
        specLabels,
      },
      driveLink: uploadMode === 'drive' ? driveLink.trim() : uploadedFileUrl || uploadedFileName,
      permissionConfirmed: uploadMode === 'drive' ? permissionConfirmed : true,
      specialNotes,
      price: price!,
    }

    addToCart(item)
    setOrderDraft(item)
    navigate('/checkout')
  }

  const handleConfirmPreflight = () => {
    setPreflightConfirmed(true)
    setShowPreflightModal(false)

    if (pendingAction === 'cart') {
      setPendingAction(null)
      addToCart({
        product: product!,
        config: {
          sizeId,
          materialId,
          finishingId,
          quantity,
          specLabels,
        },
        driveLink: uploadMode === 'drive' ? driveLink.trim() : uploadedFileUrl || uploadedFileName,
        permissionConfirmed: uploadMode === 'drive' ? permissionConfirmed : true,
        specialNotes,
        price: price!,
      })
    } else if (pendingAction === 'buy') {
      setPendingAction(null)
      const item = {
        product: product!,
        config: {
          sizeId,
          materialId,
          finishingId,
          quantity,
          specLabels,
        },
        driveLink: uploadMode === 'drive' ? driveLink.trim() : uploadedFileUrl || uploadedFileName,
        permissionConfirmed: uploadMode === 'drive' ? permissionConfirmed : true,
        specialNotes,
        price: price!,
      }
      addToCart(item)
      setOrderDraft(item)
      navigate('/checkout')
    }
  }

  const totalDisplay = convertTo(price?.total || 0)
  const productName = language === 'en' && product.nameEn ? product.nameEn : product.name
  const productDesc = language === 'en' && product.descriptionEn ? product.descriptionEn : product.description
  const categoryName = language === 'en' && category?.nameEn ? category.nameEn : category?.name

  return (
    <>
      <section className="section section--alt product-page">
        <div className="container">
          <nav className="breadcrumb" aria-label="breadcrumb">
            <Link to="/">{t('navHome')}</Link>
            <span>/</span>
            <Link to={`/category/${category?.slug}`}>{categoryName}</Link>
            <span>/</span>
            <span className="current">{productName}</span>
          </nav>

          <div className="product-layout">
            <div className="product-gallery">
              {/* 2D vs 3D Model Studio View Switcher */}
              <div
                className="flex items-center justify-between mb-3 p-1.5 rounded-2xl border shadow-xs"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <button
                  type="button"
                  onClick={() => setIs3DView(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer"
                  style={{
                    background: !is3DView ? 'var(--navy)' : 'transparent',
                    color: !is3DView ? '#FFFFFF' : 'var(--text-muted)',
                  }}
                >
                  🖼️ 2D Artwork
                </button>
                <button
                  type="button"
                  onClick={() => setIs3DView(true)}
                  className="flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5"
                  style={{
                    background: is3DView ? 'var(--gold)' : 'transparent',
                    color: is3DView ? '#0B1938' : 'var(--text-muted)',
                  }}
                >
                  <span>📦 3D Box Studio</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </button>
              </div>

              <div className="product-gallery-main">
                {is3DView ? (
                  <BoxModelViewer
                    lengthMM={boxDimensions.l}
                    widthMM={boxDimensions.w}
                    heightMM={boxDimensions.h}
                    artworkUrl={uploadedFileUrl && (uploadedFileUrl.startsWith('http') || uploadedFileUrl.startsWith('data:') || uploadedFileUrl.startsWith('blob:')) ? uploadedFileUrl : null}
                    finishingEffect={finishingEffect}
                  />
                ) : (
                  <ProductArt art={product.image} />
                )}
              </div>
              <div className="product-meta-card">
                <h3>{t('serviceStandards')}</h3>
                <ul>
                  <li>
                    <CheckIcon size={16} /> {t('serviceStd1')}
                  </li>
                  <li>
                    <CheckIcon size={16} /> {t('serviceStd2')}
                  </li>
                  <li>
                    <CheckIcon size={16} /> {t('serviceStd3')}
                  </li>
                </ul>

                {/* Instant Quotation Action */}
                <div className="pt-3 border-t border-slate-200 mt-3">
                  <button
                    type="button"
                    onClick={() => setShowQuotationModal(true)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-slate-900 to-primary-navy hover:from-primary-navy hover:to-slate-900 text-amber-300 hover:text-amber-200 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md border border-amber-500/30"
                  >
                    <DownloadIcon size={16} />
                    <span>{t('viewQuotationBtn')}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="product-info">
              <div className="flex items-center gap-2 mb-1">
                <span className="product-card-cat">{categoryName}</span>
                {isOnDemand ? (
                  <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300 text-[11px] font-black px-3 py-1 rounded-full inline-flex items-center gap-1.5 border border-amber-300 dark:border-amber-500/40">
                    <SparkleIcon size={12} />
                    <span>⚡ On-Demand: 1 ชิ้นก็พิมพ์ได้ (No Minimum Order)</span>
                  </span>
                ) : (
                  <span className="bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-200 text-[11px] font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                    <span>📦 สั่งผลิตจำนวนมาก (ขั้นต่ำ {minQty} ชิ้น)</span>
                  </span>
                )}
              </div>
              <h1>{productName}</h1>
              <p className="product-info-desc">{productDesc}</p>

              <div className="product-price-line">
                <span className="product-price-line-label">{t('startPriceLabel')}</span>
                <span className="product-price-line-now">{formatMoney(convertTo(product.basePrice), currency)}</span>
                <span className="product-price-line-unit">/ {language === 'en' ? 'Item' : 'ຊິ້ນ'}</span>
              </div>
              <div className="text-[11px] font-bold text-slate-500 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-200 inline-block mb-3">
                {formatMultiCurrency(product.basePrice)}
              </div>

              <form
                className="configurator"
                onSubmit={handleBuyNow}
              >
                <SpecGroup title={t('sizeSelect')} options={product.sizes} value={sizeId} onChange={setSizeId} language={language} />
                <SpecGroup title={t('materialSelect')} options={product.materials} value={materialId} onChange={setMaterialId} language={language} />
                <SpecGroup title={t('finishingSelect')} options={product.finishings} value={finishingId} onChange={setFinishingId} language={language} />
                <QuantityStepper
                  value={quantity}
                  minQty={minQty}
                  onChange={setQuantity}
                  t={t}
                  isOnDemand={isOnDemand}
                  discountTiers={remoteProduct?.discountTiers}
                />

                {/* Direct Upload vs Drive Toggle */}
                <div className="spec-group">
                  <div className="spec-group-head">
                    <h3>{t('fileSendTitle')}</h3>
                    <div className="luxury-upload-tabs">
                      <button
                        type="button"
                        onClick={() => setUploadMode('upload')}
                        className={`luxury-tab-btn ${uploadMode === 'upload' ? 'is-active' : ''}`}
                      >
                        {t('uploadDirect')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode('drive')}
                        className={`luxury-tab-btn ${uploadMode === 'drive' ? 'is-active' : ''}`}
                      >
                        {t('uploadDrive')}
                      </button>
                    </div>
                  </div>

                  {uploadMode === 'upload' ? (
                    <div className="space-y-2">
                      <label
                        className={`luxury-dropzone cursor-pointer transition-all ${
                          isDragOver ? 'border-amber-400 bg-amber-50/10 scale-[1.01]' : ''
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault()
                          setIsDragOver(true)
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault()
                          setIsDragOver(false)
                          const file = e.dataTransfer.files?.[0]
                          if (file) handleFileUpload(file)
                        }}
                      >
                        <div className="dropzone-icon-box">
                          <UploadCloudIcon size={32} />
                        </div>
                        <span className="text-sm font-bold text-center" style={{ color: 'var(--text-main)' }}>
                          {uploadedFileName ? `📄 ${uploadedFileName}` : t('dropzoneText')}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                          {t('dropzoneHint')}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.ai,.psd,.png,.jpg,.jpeg,.tiff"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(file)
                          }}
                          className="hidden"
                        />
                      </label>
                      {isUploading && <p className="text-xs text-blue-500 font-bold">{t('uploadingFile')}</p>}

                      {preflightReport && (
                        <div
                          className="p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs"
                          style={{
                            background: preflightReport.allPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            borderColor: preflightReport.allPassed ? '#10B981' : '#F59E0B',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <FileCheckIcon size={18} style={{ color: preflightReport.allPassed ? '#10B981' : '#F59E0B' }} />
                            <span className="font-bold" style={{ color: 'var(--text-main)' }}>
                              {preflightReport.allPassed
                                ? '✓ ไฟล์พร้อมพิมพ์ (300 DPI · CMYK · Bleed OK)'
                                : '⚠️ ตรวจพบข้อสังเกตบางจุด (Preflight Notice)'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPreflightModal(true)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-black border underline cursor-pointer"
                            style={{
                              background: 'var(--bg-card)',
                              borderColor: 'var(--border-subtle)',
                              color: 'var(--text-main)',
                            }}
                          >
                            ดูรายงาน Checklist
                          </button>
                        </div>
                      )}

                      {errors.file && <p className="field-error">{errors.file}</p>}
                    </div>
                  ) : (
                    <div>
                      <div className={`drive-link-field ${errors.driveLink ? 'has-error' : ''}`}>
                        <LinkIcon size={20} />
                        <input
                          type="url"
                          placeholder={t('driveLinkPlaceholder')}
                          value={driveLink}
                          onChange={(e) => setDriveLink(e.target.value)}
                        />
                      </div>
                      {errors.driveLink && <p className="field-error">{errors.driveLink}</p>}
                      <p className="field-hint">{t('driveLinkHint')}</p>
                      <label className={`permission-checkbox ${errors.permission ? 'has-error' : ''} mt-3`}>
                        <input
                          type="checkbox"
                          checked={permissionConfirmed}
                          onChange={(e) => setPermissionConfirmed(e.target.checked)}
                        />
                        <span className="checkbox-box" aria-hidden="true">
                          <CheckIcon size={14} />
                        </span>
                        <span>{t('drivePermissionLabel')}</span>
                      </label>
                      {errors.permission && <p className="field-error">{errors.permission}</p>}
                    </div>
                  )}
                </div>

                {/* Luxury Notes Textarea */}
                <div className="spec-group">
                  <div className="spec-group-head">
                    <h3>{t('notesTitle')}</h3>
                  </div>
                  <div className="luxury-textarea-wrap">
                    <textarea
                      rows={3}
                      className="luxury-textarea"
                      placeholder={t('notesPlaceholder')}
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="configurator-summary">
                  <div className="configurator-summary-row">
                    <span>{t('selectedSpecSummary')}</span>
                    <strong>{specLabels.paper} · {specLabels.size} · {quantity} {language === 'en' ? 'pcs' : 'ຊິ້ນ'}</strong>
                  </div>
                  <div className="configurator-summary-total">
                    <span>{t('estimatedTotal')}</span>
                    <div className="text-right">
                      <strong style={{ color: 'var(--gold)', fontSize: '1.45rem', display: 'block' }}>
                        {formatMoney(totalDisplay, currency)}
                      </strong>
                      {price && (
                        <span className="text-[10px] font-bold text-slate-500 block">
                          {formatMultiCurrency(price.total)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="product-cta-group" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="btn btn--secondary btn--lg flex-1"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '160px', border: '1px solid var(--border-gold)' }}
                  >
                    <CartIcon size={20} />
                    <span>{t('addToCartBtn')}</span>
                  </button>
                  <button
                    type="submit"
                    className="btn btn--gold btn--lg flex-1 shadow-glow"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '180px' }}
                  >
                    <span>{t('buyNowBtn')}</span>
                    <ArrowRightIcon size={20} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Instant Quotation Spec Sheet Modal */}
      {showQuotationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-amber-500/30 animate-fade-in space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <FileTextIcon size={22} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">{t('quotationModalTitle')}</h3>
                  <p className="text-xs text-slate-500 font-bold">SOM SING PHIM · PREVIEW</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuotationModal(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">{language === 'en' ? 'Product:' : 'ລາຍການ:'}</span>
                <span className="font-bold text-slate-900">{productName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">{language === 'en' ? 'Size Spec:' : 'ຂະໜາດ:'}</span>
                <span className="font-bold text-slate-900">{specLabels.size}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">{language === 'en' ? 'Material / Paper:' : 'ວັດສະດຸ:'}</span>
                <span className="font-bold text-slate-900">{specLabels.paper}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">{language === 'en' ? 'Finishing / Cut:' : 'ການຕັດແຕ່ງ:'}</span>
                <span className="font-bold text-slate-900">{specLabels.finishing}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">{language === 'en' ? 'Quantity:' : 'ຈຳນວນ:'}</span>
                <span className="font-bold text-slate-900">{quantity} {language === 'en' ? 'Units' : 'ຊິ້ນ'}</span>
              </div>
              <div className="flex justify-between py-3 bg-gradient-to-r from-amber-50 to-sky-50 px-4 rounded-2xl border border-amber-200/60">
                <span className="font-bold text-slate-800">{language === 'en' ? 'Estimated Total:' : 'ຍອດລວມສຸທິ:'}</span>
                <span className="font-black text-primary-navy text-lg">{formatMoney(totalDisplay, currency)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3.5 bg-gradient-to-r from-slate-900 to-primary-navy hover:from-primary-navy hover:to-slate-900 text-amber-300 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <DownloadIcon size={16} />
                <span>{t('printSavePdf')}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowQuotationModal(false)}
                className="py-3.5 px-6 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-2xl text-xs font-bold transition-all"
              >
                {t('closeBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preflight Inspection Checklist Modal */}
      {showPreflightModal && preflightReport && (
        <PreflightChecklistModal
          report={preflightReport}
          onConfirm={handleConfirmPreflight}
          onCancel={() => {
            setShowPreflightModal(false)
            setPendingAction(null)
          }}
        />
      )}
    </>
  )
}
