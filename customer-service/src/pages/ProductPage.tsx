import { useEffect, useMemo, useState, useRef } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
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
import QuantityStepper from '../components/QuantityStepper.tsx'
import { analyzeArtworkPreflight, type PreflightReport } from '../lib/preflightAnalyzer.ts'
import PreflightChecklistModal from '../components/PreflightChecklistModal.tsx'
import UploadProgressModal from '../components/UploadProgressModal.tsx'
import SpotlightCard from '../components/reactbits/SpotlightCard.tsx'
import ShinyText from '../components/reactbits/ShinyText.tsx'
import BorderBeam from '../components/reactbits/BorderBeam.tsx'
import ArtworkDocumentViewer from '../components/ArtworkDocumentViewer.tsx'
import PriceBreakdownTable from '../components/PriceBreakdownTable.tsx'

interface OptionButtonProps {
  option: SpecOption
  selected: boolean
  onSelect: (id: string) => void
  language: string
  currency: any
  convertTo: (thb: number) => number
}

function OptionButton({ option, selected, onSelect, language, currency, convertTo }: OptionButtonProps) {
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
        <span className="option-card-price">
          +{formatMoney(convertTo(option.add), currency)}
        </span>
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
  currency: any
  convertTo: (thb: number) => number
}

function SpecGroup({ title, hint, options, value, onChange, language, currency, convertTo }: SpecGroupProps) {
  return (
    <div className="spec-group">
      <div className="spec-group-head">
        <h3>{title}</h3>
        {hint && <span className="spec-group-hint">{hint}</span>}
      </div>
      <div className="spec-options">
        {options.map((o) => (
          <OptionButton
            key={o.id}
            option={o}
            selected={value === o.id}
            onSelect={onChange}
            language={language}
            currency={currency}
            convertTo={convertTo}
          />
        ))}
      </div>
    </div>
  )
}

export default function ProductPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
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
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preflightReport, setPreflightReport] = useState<PreflightReport | null>(null)
  const [showPreflightModal, setShowPreflightModal] = useState(false)
  const [showUploadProgress, setShowUploadProgress] = useState(false)
  const [preflightConfirmed, setPreflightConfirmed] = useState(false)
  const [pendingAction, setPendingAction] = useState<'cart' | 'buy' | null>(null)
  
  const [driveLink, setDriveLink] = useState('')
  const [permissionConfirmed, setPermissionConfirmed] = useState(false)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [specialNotes, setSpecialNotes] = useState('')
  const [colorPrintMode, setColorPrintMode] = useState<'cmyk' | 'grayscale'>('cmyk')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showQuotationModal, setShowQuotationModal] = useState(false)

  useEffect(() => {
    if (preflightReport?.colorSpace === 'Grayscale') {
      setColorPrintMode('grayscale')
    } else if (preflightReport?.colorSpace === 'CMYK') {
      setColorPrintMode('cmyk')
    }
  }, [preflightReport])

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
      
      const paperParam = searchParams.get('paper') || searchParams.get('material')
      if (paperParam && product.materials.length > 0) {
        const pLower = paperParam.toLowerCase()
        const match = product.materials.find(
          (m) =>
            m.id.toLowerCase() === pLower ||
            m.id.toLowerCase().includes(pLower) ||
            pLower.includes(m.id.toLowerCase()) ||
            m.label.toLowerCase().includes(pLower)
        )
        if (match) {
          setMaterialId(match.id)
        } else if (!materialId) {
          setMaterialId(product.materials[0].id)
        }
      } else if (!materialId && product.materials.length > 0) {
        setMaterialId(product.materials[0].id)
      }

      if (!finishingId && product.finishings.length > 0) setFinishingId(product.finishings[0].id)
      if (quantity < minQty) {
        setQuantity(minQty)
      }
    }
  }, [product, minQty, searchParams])

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

  const [tempFile, setTempFile] = useState<File | null>(null)
  const [tempPreviewUrl, setTempPreviewUrl] = useState<string | null>(null)
  const [uploadPercent, setUploadPercent] = useState<number>(0)

  const handleFileUpload = async (file: File) => {
    if (!file) return

    setTempFile(file)
    setShowUploadProgress(true)

    try {
      // Instantaneous zero-copy Blob wrapper with application/pdf type so Chrome/Safari PDF engine renders it visually
      let viewBlob: Blob = file
      const lowerName = file.name.toLowerCase()
      if (lowerName.endsWith('.pdf') || lowerName.endsWith('.ai')) {
        viewBlob = new Blob([file], { type: 'application/pdf' })
      }

      const localUrl = URL.createObjectURL(viewBlob)
      setTempPreviewUrl(localUrl)

      // Fast non-blocking preflight analyzer
      const report = await analyzeArtworkPreflight(file)
      setPreflightReport(report)
      setUploadedFileName(file.name)
      setUploadedFileUrl(localUrl)
      setCurrentStep(1)
    } catch {
      const localUrl = URL.createObjectURL(file)
      setTempPreviewUrl(localUrl)
      setUploadedFileName(file.name)
      setUploadedFileUrl(localUrl)
      setCurrentStep(1)
    }
  }

  const handleConfirmUpload = async () => {
    if (tempFile) {
      setIsUploading(true)
      try {
        const url = await uploadArtworkFile(tempFile)
        setUploadedFileName(tempFile.name)
        setUploadedFileUrl(url || tempPreviewUrl)
      } catch {
        setUploadedFileName(tempFile.name)
        setUploadedFileUrl(tempPreviewUrl || `local://${tempFile.name}`)
      } finally {
        setIsUploading(false)
      }
    }
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
        driveLink: tempPreviewUrl || uploadedFileUrl || tempFile?.name || '',
        permissionConfirmed: true,
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
        driveLink: tempPreviewUrl || uploadedFileUrl || tempFile?.name || '',
        permissionConfirmed: true,
        specialNotes,
        price: price!,
      }
      addToCart(item)
      setOrderDraft(item)
      navigate('/checkout')
    }
  }

  const handleCancelUpload = () => {
    setShowPreflightModal(false)
    setPendingAction(null)
    if (!uploadedFileName) {
      setTempFile(null)
      setTempPreviewUrl(null)
      setPreflightReport(null)
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

  const totalDisplay = convertTo(price?.total || 0)
  const productName = language === 'en' && product.nameEn ? product.nameEn : product.name
  const productDesc = language === 'en' && product.descriptionEn ? product.descriptionEn : product.description
  const categoryName = language === 'en' && category?.nameEn ? category.nameEn : category?.name

  return (
    <>
      <section className="section section--alt product-page min-h-[90vh]">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="breadcrumb" aria-label="breadcrumb">
            <Link to="/">{t('navHome')}</Link>
            <span>/</span>
            <Link to={`/category/${category?.slug}`}>{categoryName}</Link>
            <span>/</span>
            <span className="current">{productName}</span>
          </nav>

          {/* 2-Step Guided Studio Wizard Navigation Stepper */}
          <div className="my-6 max-w-2xl mx-auto">
            <div className="grid grid-cols-2 gap-2 sm:gap-4 p-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              {/* Step 1 Tab */}
              <button
                type="button"
                onClick={() => {
                  if (uploadedFileName || tempPreviewUrl) setCurrentStep(1)
                }}
                className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                  currentStep === 1
                    ? 'bg-gradient-to-r from-slate-950 to-blue-950 text-amber-400 shadow-md border border-amber-500/30'
                    : uploadedFileName || tempPreviewUrl
                    ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <span className="w-6 h-6 rounded-full flex items-center justify-center bg-amber-500/20 text-amber-500 text-xs font-black">1</span>
                <span>📤 1. ອັບໂຫຼດ & ກວດຟາຍ</span>
              </button>

              {/* Step 2 Tab */}
              <button
                type="button"
                onClick={() => {
                  if (uploadedFileName || tempPreviewUrl) setCurrentStep(2)
                }}
                className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                  currentStep === 2
                    ? 'bg-gradient-to-r from-slate-950 to-blue-950 text-amber-400 shadow-md border border-amber-500/30'
                    : uploadedFileName || tempPreviewUrl
                    ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <span className="w-6 h-6 rounded-full flex items-center justify-center bg-amber-500/20 text-amber-500 text-xs font-black">2</span>
                <span>📑 2. ເລືອກສເປັກ & ສະຫຼຸບລາຄາ</span>
              </button>
            </div>
          </div>

          {/* STEP 1: Upload & Massive PDF Document Proof Preview */}
          {currentStep === 1 && (
            <div>
              {!uploadedFileName && !tempPreviewUrl ? (
                <div className="py-8 sm:py-12 max-w-3xl mx-auto">
                  <div className="p-8 sm:p-12 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-white via-slate-50 to-amber-50/20 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/40 shadow-2xl space-y-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      <UploadCloudIcon size={16} />
                      <span>ຂັ້ນຕອນທີ 1: ອັບໂຫຼດຟາຍອາດເວິກ (STEP 1: UPLOAD ARTWORK)</span>
                    </div>
                    
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 m-0">
                      ອັບໂຫຼດຟາຍ PDF ຫຼື ຮູບພາບເພື່ອເລີ່ມຕົ້ນ
                    </h1>
                    
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto m-0 leading-relaxed">
                      ລະບົບຈະວິເຄາະ Resolution (300 DPI), Process Color (CMYK) ແລະ ຈຳນວນໜ້າພິມອັດຕະໂນມັດ
                    </p>

                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      className="relative overflow-hidden p-10 sm:p-14 rounded-3xl border-2 border-dashed border-amber-500/40 hover:border-amber-500 bg-white/80 dark:bg-slate-950/80 cursor-pointer transition transform hover:-translate-y-1 shadow-lg flex flex-col items-center justify-center gap-4"
                    >
                      <BorderBeam size={200} duration={6} colorFrom="#C5A059" colorTo="#0284C7" />
                      
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-950 to-blue-950 text-amber-400 border border-amber-500/40 shadow-xl">
                        <UploadCloudIcon size={32} />
                      </div>
                      
                      <div className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-black bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 shadow-xl shadow-amber-500/25">
                        <span>ເລືອກຟາຍ PDF / ຮູບພາບ (Choose File)</span>
                      </div>
                      
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        ຫຼື ລາກວາງຟາຍລົງທີ່ນີ້ (PDF, AI, PSD, PNG, JPG, TIFF)
                      </span>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="space-y-6 w-full max-w-[1720px] mx-auto">
                  <ArtworkDocumentViewer
                    fileUrl={tempPreviewUrl || uploadedFileUrl}
                    fileName={uploadedFileName || tempFile?.name || null}
                    fileType={tempFile?.type || ''}
                    report={preflightReport}
                    onReupload={() => fileInputRef.current?.click()}
                  />

                  {/* Step 1 Action Bar */}
                  <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn--secondary flex items-center gap-2 text-xs font-bold"
                    >
                      <UploadCloudIcon size={16} />
                      <span>🔄 ປ່ຽນຟາຍອື່ນ (Change File)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="btn btn--gold btn--lg shadow-glow flex items-center gap-2 text-sm font-black px-8 py-4"
                    >
                      <span>ຕໍ່ໄປ: ເລືອກວັດສະດຸ & ສະຫຼຸບລາຄາ (Next: Choose Specs & View Price)</span>
                      <ArrowRightIcon size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Unified Interactive Spec Configurator & Live Price Comparison */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Clean Material & Paper Configurator (5 cols) */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 block">
                      {categoryName}
                    </span>
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 m-0">
                      {productName}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    🔍 ກວດຟາຍ
                  </button>
                </div>

                <form
                  className="configurator space-y-4"
                  onSubmit={handleBuyNow}
                >
                  {/* Color Print Mode Selector (CMYK vs Grayscale) */}
                  <div className="spec-group">
                    <div className="spec-group-head">
                      <h3>{language === 'en' ? 'Color Print Mode' : 'ລະບົບສີງານພິມ (Color Mode)'}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setColorPrintMode('cmyk')}
                        className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                          colorPrintMode === 'cmyk'
                            ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300 shadow-md ring-1 ring-amber-500'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-black text-xs">🌈 ພິມ 4 ສີ (CMYK)</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">ສີສັນສົດໃສ คมชัด 100%</span>
                        </div>
                        {colorPrintMode === 'cmyk' && <CheckIcon size={16} color="#C5A059" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setColorPrintMode('grayscale')}
                        className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                          colorPrintMode === 'grayscale'
                            ? 'bg-slate-500/10 border-slate-500 text-slate-900 dark:text-slate-100 shadow-md ring-1 ring-slate-500'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-black text-xs">⚫ ພິມຂາວ-ດຳ</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">ປະຢັດຕົ້ນທຶນ</span>
                        </div>
                        {colorPrintMode === 'grayscale' && <CheckIcon size={16} color="#64748B" />}
                      </button>
                    </div>
                  </div>

                  <SpecGroup
                    title={t('sizeSelect')}
                    options={product.sizes}
                    value={sizeId}
                    onChange={setSizeId}
                    language={language}
                    currency={currency}
                    convertTo={convertTo}
                  />
                  <SpecGroup
                    title={t('materialSelect')}
                    options={product.materials}
                    value={materialId}
                    onChange={setMaterialId}
                    language={language}
                    currency={currency}
                    convertTo={convertTo}
                  />
                  <SpecGroup
                    title={t('finishingSelect')}
                    options={product.finishings}
                    value={finishingId}
                    onChange={setFinishingId}
                    language={language}
                    currency={currency}
                    convertTo={convertTo}
                  />
                  <QuantityStepper
                    value={quantity}
                    minQty={minQty}
                    onChange={setQuantity}
                    t={t}
                    isOnDemand={isOnDemand}
                    discountTiers={remoteProduct?.discountTiers}
                  />

                  {/* Luxury Notes Textarea */}
                  <div className="spec-group">
                    <div className="spec-group-head">
                      <h3>{t('notesTitle')}</h3>
                    </div>
                    <div className="luxury-textarea-wrap">
                      <textarea
                        rows={2}
                        className="luxury-textarea"
                        placeholder={t('notesPlaceholder')}
                        value={specialNotes}
                        onChange={(e) => setSpecialNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Right Column: Real-time Live Price Comparison & Quotation Table (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <PriceBreakdownTable
                  quantity={quantity}
                  pageCount={preflightReport?.pageCount || 1}
                  isColor={colorPrintMode === 'cmyk'}
                  coveragePercent={preflightReport?.colorCoveragePercent?.total || (colorPrintMode === 'cmyk' ? 20 : 5)}
                  baseUnit={product.basePrice}
                  sizeLabel={specLabels.size || 'Standard'}
                  sizeAdd={product.sizes.find((x) => x.id === sizeId)?.add || 0}
                  materialLabel={specLabels.paper || 'Standard'}
                  materialAdd={product.materials.find((x) => x.id === materialId)?.add || 0}
                  finishingLabel={specLabels.finishing || 'Standard'}
                  finishingAdd={product.finishings.find((x) => x.id === finishingId)?.add || 0}
                  discountPercent={Math.round((price?.discount || 0) * 100)}
                  totalAmountTHB={price?.total || 0}
                  currency={currency}
                  convertTo={convertTo}
                  language={language}
                />

                {/* Direct Action Group */}
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="btn btn--secondary text-xs font-bold px-5 py-3.5"
                  >
                    ← ກວດສອບຟາຍ PDF
                  </button>

                  <div className="flex items-center gap-3 flex-1 justify-end flex-wrap">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="btn btn--secondary btn--lg flex items-center gap-2 px-5 py-3.5"
                      style={{ border: '1px solid var(--border-gold)' }}
                    >
                      <CartIcon size={20} />
                      <span>{t('addToCartBtn')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleBuyNow}
                      className="btn btn--gold btn--lg shadow-glow flex items-center gap-2 px-7 py-3.5 font-black"
                    >
                      <span>{t('buyNowBtn')}</span>
                      <ArrowRightIcon size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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

      {/* Global Hidden File Input (Always mounted) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.ai,.psd,.png,.jpg,.jpeg,.tiff"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileUpload(file)
          e.target.value = ''
        }}
        className="hidden"
      />

      {/* Upload Progress & Preflight Analysis Modal */}
      <UploadProgressModal
        isOpen={showUploadProgress}
        fileName={tempFile?.name || ''}
        fileSizeMB={(tempFile ? (tempFile.size / (1024 * 1024)).toFixed(2) : '0')}
        onComplete={() => {
          setShowUploadProgress(false)
        }}
        onCancel={() => {
          setShowUploadProgress(false)
          setTempFile(null)
          setTempPreviewUrl(null)
          setUploadedFileName(null)
          setUploadedFileUrl(null)
        }}
      />

      {/* Preflight Inspection Checklist & Instant Quotation Modal */}
      {showPreflightModal && preflightReport && (
        <PreflightChecklistModal
          report={preflightReport}
          previewUrl={tempPreviewUrl || uploadedFileUrl}
          productName={productName}
          specLabels={specLabels}
          quantity={quantity}
          priceTotal={price?.total || 0}
          currency={currency}
          formatMoney={formatMoney}
          formatMultiCurrency={formatMultiCurrency}
          onConfirm={handleConfirmUpload}
          onCancel={handleCancelUpload}
        />
      )}
    </>
  )
}
