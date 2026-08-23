import { useEffect, useMemo, useState, useRef } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { type Product, type SpecOption } from '../data/catalog.ts'
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
import MultiBookOrderManager from '../components/MultiBookOrderManager.tsx'
import type { BookOrderItem } from '../types/order.ts'
import { calculateSpineThickness } from '../utils/spineCalculator.ts'
import { BookOpen, Ruler, Layers, Settings2, FileCheck, CheckCircle2 } from 'lucide-react'

interface OptionButtonProps {
  option: SpecOption
  selected: boolean
  onSelect: (id: string) => void
  language: string
  currency: any
  convertTo: (thb: number) => number
  badge?: string
}

function OptionButton({ option, selected, onSelect, language, currency, convertTo, badge }: OptionButtonProps) {
  const label = language === 'en' && option.labelEn ? option.labelEn : option.label
  const hint = language === 'en' && option.hintEn ? option.hintEn : option.hint
  const priceDelta = typeof option.add === 'number' ? option.add : 0

  return (
    <button
      type="button"
      onClick={() => onSelect(option.id)}
      aria-pressed={selected}
      className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer overflow-hidden ${
        selected
          ? 'bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border-amber-500 shadow-md ring-2 ring-amber-500/30'
          : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-amber-400/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
    >
      {/* Top Header with Label + Radio State */}
      <div className="flex items-start justify-between gap-2 w-full">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xs sm:text-sm font-black tracking-tight ${selected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
              {label}
            </span>
            {badge && (
              <span className="px-1.5 py-0.2 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                {badge}
              </span>
            )}
          </div>
          {hint && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 mt-0.5">
              {hint}
            </p>
          )}
        </div>

        {/* Radio Pill with Check */}
        <div
          className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
            selected
              ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-sm'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-transparent group-hover:border-amber-400'
          }`}
        >
          <CheckIcon size={12} />
        </div>
      </div>

      {/* Bottom Price Delta Badge */}
      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between w-full text-[11px]">
        <span className="text-slate-400 text-[10px]">
          {priceDelta > 0 ? 'ລາຄາເພີ່ມ:' : 'ມາດຕະຖານ:'}
        </span>
        {priceDelta > 0 ? (
          <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
            +{formatMoney(convertTo(priceDelta), currency)}
          </span>
        ) : (
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {language === 'en' ? 'Included' : '✓ ຟຣີ'}
          </span>
        )}
      </div>
    </button>
  )
}

interface SpecGroupProps {
  icon?: string
  title: string
  hint?: string
  options: SpecOption[]
  value: string
  onChange: (id: string) => void
  language: string
  currency: any
  convertTo: (thb: number) => number
  displayType?: 'cards' | 'dropdown' | string
}

function SpecGroup({ icon, title, hint, options, value, onChange, language, currency, convertTo, displayType = 'cards' }: SpecGroupProps) {
  const selectedOption = options.find((o) => o.id === value)
  const selectedLabel = selectedOption
    ? (language === 'en' && selectedOption.labelEn ? selectedOption.labelEn : selectedOption.label)
    : ''

  if (displayType === 'dropdown') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {icon || '⚙️'} {title}
            </span>
            {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
          </div>
          {selectedLabel && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {selectedLabel}
            </span>
          )}
        </div>
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer"
          >
            {options.map((o) => {
              const label = language === 'en' && o.labelEn ? o.labelEn : o.label
              const addText = typeof o.add === 'number' && o.add !== 0 
                ? ` (+${formatMoney(convertTo(o.add), currency)})` 
                : ''
              return (
                <option key={o.id} value={o.id}>
                  {label} {addText}
                </option>
              )
            })}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
            ▼
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            {icon || '✨'} {title}
          </span>
          {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
        </div>
        {selectedLabel && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {selectedLabel}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
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

// Multi-Artwork Batch Item definition
export interface ArtworkBatchItem {
  id: string
  fileName: string
  file?: File
  previewUrl: string
  fileType: string
  fileSizeMB: string
  report?: PreflightReport | null
  colorMode: 'cmyk' | 'grayscale'
  sizeId: string
  materialId: string
  finishingId: string
  selectedGroupOptions: Record<string, string>
  quantity: number
  specialNotes: string
}

export default function ProductPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { currency, convertTo, setOrderDraft, addToCart, t, language, getProduct, getCategory } = useShop()
  const [remoteProduct, setRemoteProduct] = useState<RemoteProduct | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (slug) {
      setIsLoading(true)
      fetchPublicProductBySlug(slug)
        .then((res) => {
          if (res) {
            setRemoteProduct(res)
          } else {
            setRemoteProduct(null)
          }
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [slug])

  const product: Product | null = useMemo(() => {
    if (remoteProduct) {
      const mats: SpecOption[] = (remoteProduct.options || [])
        .filter(o => o.optionType === 'paper' || o.optionType === 'material')
        .map(o => ({
          id: o.value,
          label: o.labelLo || o.label,
          labelEn: o.labelEn || o.label,
          hint: o.hintLo || '',
          hintEn: o.hintEn || '',
          add: o.addPrice || (o.extraCostRate ? Math.round((remoteProduct.basePrice || 50) * o.extraCostRate) : 0),
          materialSku: o.materialSku,
          paperCode: o.paperCode,
        }))

      const sizes: SpecOption[] = (remoteProduct.options || [])
        .filter(o => o.optionType === 'size')
        .map(o => ({
          id: o.value,
          label: o.labelLo || o.label,
          labelEn: o.labelEn || o.label,
          hint: o.hintLo || '',
          hintEn: o.hintEn || '',
          add: o.addPrice || 0,
        }))

      const finishings: SpecOption[] = (remoteProduct.options || [])
        .filter(o => o.optionType === 'finishing' || o.optionType === 'cutting' || o.optionType === 'binding')
        .map(o => ({
          id: o.value,
          label: o.labelLo || o.label,
          labelEn: o.labelEn || o.label,
          hint: o.hintLo || '',
          hintEn: o.hintEn || '',
          add: o.addPrice || (o.extraCostRate ? Math.round((remoteProduct.basePrice || 50) * o.extraCostRate) : 0),
        }))

      return {
        id: String(remoteProduct.id),
        slug: remoteProduct.slug,
        name: remoteProduct.nameLo || remoteProduct.name,
        nameEn: remoteProduct.nameEn || '',
        category: remoteProduct.categorySlug || remoteProduct.category,
        bestseller: remoteProduct.bestseller || false,
        basePrice: remoteProduct.basePrice || 0,
        unit: remoteProduct.unit || 'ຊິ້ນ',
        pricingModel: remoteProduct.pricingModel || 'STANDARD_FLAT',
        image: remoteProduct.thumbnailUrl || 'album',
        short: remoteProduct.descriptionLo || remoteProduct.description || '',
        shortEn: remoteProduct.descriptionEn || '',
        description: remoteProduct.descriptionLo || remoteProduct.description || '',
        descriptionEn: remoteProduct.descriptionEn || '',
        specGroups: (remoteProduct.specGroups || []).map(g => ({
          id: g.id,
          titleLo: g.titleLo,
          titleEn: g.titleEn,
          displayType: g.displayType || 'cards',
          groupType: g.groupType,
          options: (g.options || []).map(o => ({
            id: o.value,
            label: o.labelLo || o.label,
            labelEn: o.labelEn || o.label,
            hint: o.hintLo || '',
            hintEn: o.hintEn || '',
            add: o.addPrice || 0,
            materialSku: o.materialSku,
            paperCode: o.paperCode,
          }))
        })),
        featuresConfig: remoteProduct.featuresConfig,
        sizes: sizes.length > 0 ? sizes : [{ id: 'standard', label: language === 'en' ? 'Standard Size' : 'ຂະໜາດມາດຕະຖານ', hint: '', add: 0 }],
        materials: mats.length > 0 ? mats : [{ id: 'standard_mat', label: language === 'en' ? 'Standard Material' : 'ວັດສະດຸມາດຕະຖານ', hint: '', add: 0 }],
        finishings: finishings.length > 0 ? finishings : [{ id: 'standard_cut', label: language === 'en' ? 'Straight Cut' : 'ຕັດກົງມາດຕະຖານ', hint: '', add: 0 }],
        options: remoteProduct.options,
        discountTiers: remoteProduct.discountTiers,
      }
    }
    const contextProduct = getProduct(slug)
    return contextProduct || null
  }, [remoteProduct, slug, getProduct, language])

  const category = product ? getCategory(product.category) : null

  // Multi-artwork batch state
  const [uploadedArtworks, setUploadedArtworks] = useState<ArtworkBatchItem[]>([])
  const [activeArtworkIndex, setActiveArtworkIndex] = useState(0)

  const [selectedGroupOptions, setSelectedGroupOptions] = useState<Record<string, string>>({})
  const [sizeId, setSizeId] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [finishingId, setFinishingId] = useState('')
  const [quantity, setQuantity] = useState(1)
  
  const [uploadMode, setUploadMode] = useState<'upload' | 'drive'>('upload')
  const [tempFile, setTempFile] = useState<File | null>(null)
  const [tempPreviewUrl, setTempPreviewUrl] = useState<string | null>(null)
  const [uploadPercent, setUploadPercent] = useState<number>(0)
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
  const [showAddedToCartModal, setShowAddedToCartModal] = useState(false)
  const [addedBatchCount, setAddedBatchCount] = useState(1)

  // Sync active artwork specs with form state
  const activeArtwork: ArtworkBatchItem | null = useMemo(() => {
    if (uploadedArtworks.length > 0) {
      return uploadedArtworks[activeArtworkIndex] || uploadedArtworks[0] || null
    }
    if (uploadedFileName || uploadedFileUrl || tempPreviewUrl || driveLink) {
      return {
        id: 'art-fallback-1',
        fileName: uploadedFileName || tempFile?.name || (driveLink ? 'Google Drive Asset' : 'artwork.pdf'),
        file: tempFile || undefined,
        previewUrl: tempPreviewUrl || uploadedFileUrl || driveLink || '',
        fileType: tempFile?.type || (driveLink ? 'drive-link' : 'application/pdf'),
        fileSizeMB: tempFile ? (tempFile.size / (1024 * 1024)).toFixed(2) : '1.2',
        report: preflightReport,
        colorMode: colorPrintMode,
        sizeId: sizeId || product?.sizes[0]?.id || 'standard',
        materialId: materialId || product?.materials[0]?.id || 'standard_mat',
        finishingId: finishingId || product?.finishings[0]?.id || 'standard_cut',
        selectedGroupOptions: { ...selectedGroupOptions },
        quantity: quantity || 1,
        specialNotes: specialNotes,
      }
    }
    return null
  }, [
    uploadedArtworks,
    activeArtworkIndex,
    uploadedFileName,
    uploadedFileUrl,
    tempPreviewUrl,
    tempFile,
    driveLink,
    preflightReport,
    colorPrintMode,
    sizeId,
    materialId,
    finishingId,
    product,
    selectedGroupOptions,
    quantity,
    specialNotes,
  ])

  const updateActiveArtworkSpecs = (patch: Partial<ArtworkBatchItem>) => {
    setUploadedArtworks((prev) => {
      if (prev.length === 0 && activeArtwork) {
        return [{ ...activeArtwork, ...patch }]
      }
      const next = [...prev]
      if (next[activeArtworkIndex]) {
        next[activeArtworkIndex] = { ...next[activeArtworkIndex], ...patch }
      }
      return next
    })
  }

  const applySpecsToAllArtworks = () => {
    if (!activeArtwork) return
    setUploadedArtworks((prev) =>
      prev.map((art) => ({
        ...art,
        sizeId: activeArtwork.sizeId,
        materialId: activeArtwork.materialId,
        finishingId: activeArtwork.finishingId,
        colorMode: activeArtwork.colorMode,
        quantity: activeArtwork.quantity,
        selectedGroupOptions: { ...activeArtwork.selectedGroupOptions },
      }))
    )
  }

  const removeArtwork = (index: number) => {
    setUploadedArtworks((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length === 0) {
        setUploadedFileName(null)
        setUploadedFileUrl(null)
        setTempPreviewUrl(null)
      }
      if (activeArtworkIndex >= next.length) {
        setActiveArtworkIndex(Math.max(0, next.length - 1))
      }
      return next
    })
  }

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

      if (product.specGroups && product.specGroups.length > 0) {
        setSelectedGroupOptions((prev) => {
          const updated = { ...prev }
          product.specGroups?.forEach((g) => {
            if (!updated[g.id] && g.options.length > 0) {
              const def = g.options.find((o) => (o as any).isDefault) || g.options[0]
              updated[g.id] = def.id
            }
          })
          return updated
        })
      }
    }
  }, [product, minQty, searchParams])

  const isBookProduct = useMemo(() => {
    if (!product) return false
    return (
      product.pricingModel === 'BOOK_MULTIPART' ||
      product.slug === 'doc-copy-binding' ||
      product.category === 'book' ||
      product.category === 'documents' ||
      product.slug.includes('binding') ||
      product.slug.includes('book')
    )
  }, [product])

  const [bookItems, setBookItems] = useState<BookOrderItem[]>([
    {
      id: 'book-init-1',
      title: 'ປຶ້ມພາສາລາວ (Book 1)',
      innerPageCount: 60,
      spineThicknessMm: 3.8,
      quantity: 1,
      sizeId: 'a4',
      materialId: 'bond-80',
      colorMode: 'cmyk',
      unitPriceThb: 50,
      totalPriceThb: 50,
    },
  ])

  // Multi-file uploader
  const handleMultipleFilesUpload = async (files: FileList | File[]) => {
    if (!files) return
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    setTempFile(fileArray[0])
    setShowUploadProgress(true)

    const newArtworks: ArtworkBatchItem[] = []

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      let viewBlob: Blob = file
      const lowerName = file.name.toLowerCase()
      if (lowerName.endsWith('.pdf') || lowerName.endsWith('.ai')) {
        viewBlob = new Blob([file], { type: 'application/pdf' })
      }
      const localUrl = URL.createObjectURL(viewBlob)

      let rep: PreflightReport | null = null
      try {
        rep = await analyzeArtworkPreflight(file)
      } catch {
        rep = null
      }

      newArtworks.push({
        id: `art-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 7)}`,
        fileName: file.name,
        file,
        previewUrl: localUrl,
        fileType: file.type || 'application/pdf',
        fileSizeMB: (file.size / (1024 * 1024)).toFixed(2),
        report: rep,
        colorMode: rep?.colorSpace === 'Grayscale' ? 'grayscale' : 'cmyk',
        sizeId: sizeId || product?.sizes[0]?.id || 'standard',
        materialId: materialId || product?.materials[0]?.id || 'standard_mat',
        finishingId: finishingId || product?.finishings[0]?.id || 'standard_cut',
        selectedGroupOptions: { ...selectedGroupOptions },
        quantity: quantity || 1,
        specialNotes: '',
      })
    }

    setUploadedArtworks((prev) => [...prev, ...newArtworks])
    setActiveArtworkIndex(0)
    setUploadedFileName(newArtworks[0]?.fileName || '')
    setUploadedFileUrl(newArtworks[0]?.previewUrl || '')
    setTempPreviewUrl(newArtworks[0]?.previewUrl || '')
    setPreflightReport(newArtworks[0]?.report || null)
    setShowUploadProgress(false)
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return
    setTempFile(file)
    await handleMultipleFilesUpload([file])
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

  const basePrice = useMemo(() => {
    if (!product) return null
    if (product.specGroups && product.specGroups.length > 0) {
      let unitAdd = 0
      product.specGroups.forEach((g) => {
        const selectedId = selectedGroupOptions[g.id] || g.options[0]?.id
        const opt = g.options.find((o) => o.id === selectedId)
        if (opt && typeof opt.add === 'number') {
          unitAdd += opt.add
        }
      })
      const unitTotal = (product.basePrice || 0) + unitAdd
      const subtotal = unitTotal * quantity

      let discountPct = 0
      if (product.discountTiers && product.discountTiers.length > 0) {
        for (const tier of product.discountTiers) {
          if (quantity >= tier.minQuantity && tier.discountPercentage > discountPct) {
            discountPct = tier.discountPercentage
          }
        }
      }
      const discountAmount = Math.round(subtotal * (discountPct / 100))
      const finalTotal = subtotal - discountAmount

      return {
        unitPrice: unitTotal,
        total: finalTotal,
        totalTHB: finalTotal,
        qty: quantity,
        discount: discountPct,
      }
    }
    return computePrice(product, { sizeId, materialId, finishingId, quantity })
  }, [product, sizeId, materialId, finishingId, quantity, selectedGroupOptions])

  const price = useMemo(() => {
    if (isBookProduct) {
      const totalThb = bookItems.reduce((sum, b) => sum + (b.totalPriceThb || 0), 0)
      const totalQty = bookItems.reduce((sum, b) => sum + (b.quantity || 1), 0)
      return {
        unitPrice: Math.round(totalThb / Math.max(1, totalQty)),
        total: totalThb,
        totalTHB: totalThb,
        qty: totalQty,
        discount: 0,
      }
    }
    return basePrice
  }, [isBookProduct, bookItems, basePrice])

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

  const productImages = useMemo(() => {
    const list: string[] = []
    if (product?.image && product.image !== 'doc' && product.image !== 'sticker' && product.image !== 'card' && product.image !== 'photos') {
      list.push(product.image)
    } else if (product?.thumbnailUrl) {
      list.push(product.thumbnailUrl)
    }
    if (product?.galleryUrls && Array.isArray(product.galleryUrls)) {
      product.galleryUrls.forEach((u) => {
        if (u && !list.includes(u)) list.push(u)
      })
    }
    return list
  }, [product])

  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [infoTab, setInfoTab] = useState<'description' | 'materials' | 'bleed' | 'shipping'>('description')

  const validateInputs = () => {
    const nextErrors: Record<string, string> = {}
    
    if (isBookProduct) {
      if (!bookItems || bookItems.length === 0) {
        nextErrors.file = language === 'en' ? 'Please add at least 1 book' : 'ກະລຸນາເພີ່ມລາຍການປຶ້ມຢ່າງໜ້ອຍ 1 ຫົວ'
      }
    } else if (uploadMode === 'drive') {
      if (!driveLink.trim()) {
        nextErrors.driveLink = language === 'en' ? 'Please provide a Google Drive link' : 'ກະລຸນາແນບລິ້ງ Google Drive ຂອງຟາຍງານ'
      } else if (!/^https?:\/\/drive\.google\.com\//.test(driveLink.trim())) {
        nextErrors.driveLink = language === 'en' ? 'Link must start with https://drive.google.com/...' : 'ລິ້ງຕ້ອງເປັນ Google Drive (https://drive.google.com/...)'
      }
      if (!permissionConfirmed) {
        nextErrors.permission = language === 'en' ? 'Please confirm view permissions are enabled' : 'ກະລຸນາຍືນຍັນວ່າໄດ້ເປີດສິດການເຂົ້າເຖິງລິ້ງແລ້ວ'
      }
    } else {
      if (!uploadedFileName && uploadedArtworks.length === 0) {
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

    if (!isBookProduct && uploadMode === 'upload' && preflightReport && !preflightConfirmed) {
      setPendingAction('cart')
      setShowPreflightModal(true)
      return
    }

    const effectiveQty = isBookProduct
      ? bookItems.reduce((sum, b) => sum + b.quantity, 0)
      : quantity

    addToCart({
      product,
      config: {
        sizeId,
        materialId,
        finishingId,
        quantity: effectiveQty,
        specLabels,
      },
      driveLink: isBookProduct
        ? bookItems[0]?.coverFileName || bookItems[0]?.innerFileName || 'multi-book-batch'
        : uploadMode === 'drive'
        ? driveLink.trim()
        : uploadedFileUrl || uploadedFileName || '',
      permissionConfirmed: uploadMode === 'drive' ? permissionConfirmed : true,
      specialNotes,
      price: price!,
      bookItems: isBookProduct ? bookItems : undefined,
    })
  }

  const handleBuyNow = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!product || !price) return
    if (!validateInputs()) return

    if (!isBookProduct && uploadMode === 'upload' && preflightReport && !preflightConfirmed) {
      setPendingAction('buy')
      setShowPreflightModal(true)
      return
    }

    const effectiveQty = isBookProduct
      ? bookItems.reduce((sum, b) => sum + b.quantity, 0)
      : quantity

    const item = {
      product,
      config: {
        sizeId,
        materialId,
        finishingId,
        quantity: effectiveQty,
        specLabels,
      },
      driveLink: isBookProduct
        ? bookItems[0]?.coverFileName || bookItems[0]?.innerFileName || 'multi-book-batch'
        : uploadMode === 'drive'
        ? driveLink.trim()
        : uploadedFileUrl || uploadedFileName || '',
      permissionConfirmed: uploadMode === 'drive' ? permissionConfirmed : true,
      specialNotes,
      price: price!,
      bookItems: isBookProduct ? bookItems : undefined,
    }

    addToCart(item)
    setOrderDraft(item)
    navigate('/checkout')
  }

  const totalDisplay = convertTo(price?.total || 0)
  const productName = language === 'en' && product?.nameEn ? product.nameEn : (product?.name || '')
  const productDesc = language === 'en' && product?.descriptionEn ? product.descriptionEn : (product?.description || '')
  const categoryName = language === 'en' && category?.nameEn ? category.nameEn : (category?.name || '')

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

          {/* SCREEN 1: SHOWCASE GALLERY + DIRECT UPLOAD DROPZONE (When no files uploaded yet) */}
          {uploadedArtworks.length === 0 && !tempPreviewUrl && (!driveLink || uploadMode !== 'drive') ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-6">
              {/* LEFT COLUMN: Dynamic Multi-Image Gallery Showcase & Trust Badges (5 cols) */}
              <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
                <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                  {/* Main Featured Photo Box */}
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-inner group">
                    {productImages.length > 0 ? (
                      <img
                        src={productImages[activePhotoIndex] || productImages[0]}
                        alt={`${productName} view ${activePhotoIndex + 1}`}
                        className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <ProductArt art={product.image} className="w-full h-full" />
                      </div>
                    )}

                    {/* Overlaid Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                      {product.bestseller && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md">
                          ★ {language === 'en' ? 'Bestseller' : 'ສິນຄ້າຍອດນິຍົມ'}
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-900/80 text-amber-300 border border-amber-500/30 backdrop-blur-sm">
                        ✨ ດິຈິຕອນ 2400 DPI
                      </span>
                    </div>

                    {productImages.length > 1 && (
                      <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-sm shadow">
                        {activePhotoIndex + 1} / {productImages.length}
                      </span>
                    )}
                  </div>

                  {/* Gallery Thumbnails Slider Strip */}
                  {productImages.length > 1 && (
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                      {productImages.map((imgUrl, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setActivePhotoIndex(pIdx)}
                          className={`relative flex-shrink-0 w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                            activePhotoIndex === pIdx
                              ? 'border-amber-500 scale-105 shadow-md shadow-amber-500/20'
                              : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Thumb ${pIdx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Key Highlights Pill Tags */}
                  {product.features && product.features.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                        {language === 'en' ? 'Key Highlights' : 'ຈຸດເດັ່ນຂອງສິນຄ້າ'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {product.features.map((f, fIdx) => (
                          <span
                            key={fIdx}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trust & Guarantee Badges */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                      <span className="block text-base mb-0.5">🚀</span>
                      <span>{language === 'en' ? '1-2 Days' : 'ຜະລິດໄວ 1-2 ວັນ'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                      <span className="block text-base mb-0.5">💎</span>
                      <span>{language === 'en' ? '100% CMYK' : 'ສີຄົມຊັດ 100%'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                      <span className="block text-base mb-0.5">📦</span>
                      <span>{language === 'en' ? 'Nationwide' : 'ຈັດສົ່ງທົ່ວປະເທດ'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Product Details & Large Multi-Artwork Upload Card (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-amber-500 block">
                        {categoryName}
                      </span>
                      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 m-0">
                        {productName}
                      </h1>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 font-semibold block">
                        {language === 'en' ? 'Base Price Starts' : 'ລາຄາເລີ່ມຕົ້ນ'}
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                        {formatMoney(convertTo(product.basePrice), currency)}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">/ {product.unit || 'ຊິ້ນ'}</span>
                    </div>
                  </div>

                  {/* 📤 UPLOAD STUDIO CARD (Allows 1 or Multiple Files) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UploadCloudIcon size={20} color="#C5A059" />
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          {language === 'en' ? 'Step 1: Upload Artwork(s) or Image(s)' : 'ຂັ້ນຕອນທີ 1: ອັບໂຫຼດຟາຍອາດເວິກ / ຮູບພາບ (ເລືອກໄດ້ຫຼາຍຟາຍ)'}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setUploadMode('upload')}
                          className={`px-3 py-1.5 rounded-lg transition ${uploadMode === 'upload' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                          ອັບໂຫຼດຟາຍ
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadMode('drive')}
                          className={`px-3 py-1.5 rounded-lg transition ${uploadMode === 'drive' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                          Google Drive
                        </button>
                      </div>
                    </div>

                    {uploadMode === 'upload' ? (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setIsDragOver(true)
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setIsDragOver(false)
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setIsDragOver(false)
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            handleMultipleFilesUpload(e.dataTransfer.files)
                          }
                        }}
                        className={`p-10 sm:p-14 rounded-3xl border-2 border-dashed transition transform cursor-pointer shadow-md flex flex-col items-center justify-center text-center gap-4 group ${
                          isDragOver
                            ? 'border-amber-500 bg-amber-500/20 scale-[1.02] shadow-2xl shadow-amber-500/30 ring-4 ring-amber-500/20'
                            : 'border-amber-500/40 hover:border-amber-500 bg-amber-50/20 dark:bg-slate-950/60 hover:-translate-y-1'
                        }`}
                      >
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-950 to-blue-950 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-xl transition-transform ${isDragOver ? 'scale-125 rotate-6' : 'group-hover:scale-110'}`}>
                          <UploadCloudIcon size={32} />
                        </div>
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-black bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 shadow-xl shadow-amber-500/25">
                            <span>{isDragOver ? 'ປ່ອຍຟາຍລົງບ່ອນນີ້ເລີຍ (Drop Files Here) 🚀' : 'ເລືອກຟາຍ ຫຼື ລາກມາວາງບ່ອນນີ້ (Choose or Drag & Drop Files)'}</span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block pt-2">
                            ລາກມາວາງໄດ້ຫຼາຍຟາຍພ້ອມກັນ (PDF, AI, PSD, PNG, JPG, TIFF) · ລະບົບກວດ 300 DPI & CMYK ອັດຕະໂນມັດ
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                            ລິ້ງໂຟນເດີ ຫຼື ຟາຍ Google Drive (Anyone with link can view):
                          </label>
                          <input
                            type="url"
                            value={driveLink}
                            onChange={(e) => setDriveLink(e.target.value)}
                            placeholder="https://drive.google.com/drive/folders/..."
                            className="w-full px-4 py-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white font-mono"
                          />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                          <input
                            type="checkbox"
                            checked={permissionConfirmed}
                            onChange={(e) => setPermissionConfirmed(e.target.checked)}
                            className="w-4 h-4 text-amber-500 rounded"
                          />
                          <span>ຢືນຢັນວ່າໄດ້ເປີດສິດ "Anyone with link can view" ແລ້ວ</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            if (driveLink.trim()) {
                              setUploadedArtworks([
                                {
                                  id: `drive-${Date.now()}`,
                                  fileName: 'Google Drive Asset Batch',
                                  previewUrl: driveLink.trim(),
                                  fileType: 'drive-folder',
                                  fileSizeMB: 'Cloud',
                                  colorMode: 'cmyk',
                                  sizeId: sizeId || 'standard',
                                  materialId: materialId || 'standard_mat',
                                  finishingId: finishingId || 'standard_cut',
                                  selectedGroupOptions: { ...selectedGroupOptions },
                                  quantity: quantity || 1,
                                  specialNotes: '',
                                }
                              ])
                            }
                          }}
                          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md"
                        >
                          ຕໍ່ໄປ: ກຳນົດສເປັກສິນຄ້າ (Next: Set Specs) →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* SCREEN 2: DEDICATED FILE-BY-FILE PROOFING & SPEC CUSTOMIZATION STUDIO */
            <div className="space-y-6 my-6">
              {/* Studio Header + Integrated Visual Multi-File Filmstrip */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedArtworks([])
                        setUploadedFileName(null)
                        setUploadedFileUrl(null)
                        setTempPreviewUrl(null)
                        setDriveLink('')
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>← ກັບຄືນໜ້າສິນຄ້າ (Back)</span>
                    </button>

                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white m-0">
                        🎨 {productName} — ປັບແຕ່ງສເປັກ ({uploadedArtworks.length} ຟາຍ)
                      </h2>
                      <span className="text-xs text-slate-500 font-medium">
                        ຄລິກເລືອກຮູບເພື່ອປັບແຕ່ງສະເປັກ ຫຼື ເພີ່ມ/ລຶບຟາຍໄດ້ສະດວກ
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn--gold flex items-center gap-1.5 text-xs font-black px-4 py-2.5 shadow-md"
                    >
                      <UploadCloudIcon size={16} />
                      <span>➕ ເພີ່ມຟາຍໃໝ່ (Add More Files)</span>
                    </button>
                  </div>
                </div>

                {/* 🎞️ Visual Multi-File Filmstrip / Thumbnail Tray */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold">
                      ລາຍການຟາຍທັງໝົດ ({uploadedArtworks.length} ຟາຍ):
                    </span>
                    <span className="text-[11px] text-slate-400">
                      (ເລືອກຮູບເພື່ອສະຫຼັບການຕັ້ງຄ່າ)
                    </span>
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleMultipleFilesUpload(e.dataTransfer.files)
                      }
                    }}
                    className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin"
                  >
                    {uploadedArtworks.map((art, idx) => {
                      const isActive = activeArtworkIndex === idx
                      return (
                        <div
                          key={art.id || idx}
                          onClick={() => setActiveArtworkIndex(idx)}
                          className={`relative group flex-shrink-0 w-24 sm:w-28 rounded-2xl border-2 p-1.5 transition-all duration-200 cursor-pointer ${
                            isActive
                              ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/20 scale-105 ring-2 ring-amber-500/30'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-amber-400/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {/* Top Tag: File Number Badge */}
                          <div className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded-md bg-slate-950/80 text-amber-400 text-[9px] font-black backdrop-blur-sm">
                            #{idx + 1}
                          </div>

                          {/* Quick Delete '✕' Button on Top-Right */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeArtwork(idx)
                            }}
                            className="absolute -top-1.5 -right-1.5 z-20 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black shadow-md opacity-80 group-hover:opacity-100 hover:scale-110 transition cursor-pointer"
                            title="ລຶບຟາຍນີ້"
                          >
                            ✕
                          </button>

                          {/* Miniature Preview Image / Box */}
                          <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-700/50 shadow-inner">
                            {art.previewUrl ? (
                              art.fileType.includes('pdf') ? (
                                <div className="flex flex-col items-center justify-center text-amber-400 text-[10px] font-bold">
                                  <FileTextIcon size={20} />
                                  <span className="text-[8px] uppercase">PDF</span>
                                </div>
                              ) : (
                                <img
                                  src={art.previewUrl}
                                  alt={art.fileName}
                                  className="w-full h-full object-cover"
                                />
                              )
                            ) : (
                              <FileTextIcon size={20} />
                            )}
                          </div>

                          {/* Truncated File Label + Qty */}
                          <div className="mt-1.5 text-center">
                            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate block max-w-full">
                              {art.fileName}
                            </span>
                            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-mono font-bold block">
                              {art.quantity} ຊິ້ນ
                            </span>
                          </div>
                        </div>
                      )
                    })}

                    {/* Add More File Quick Card */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          handleMultipleFilesUpload(e.dataTransfer.files)
                        }
                      }}
                      className="flex-shrink-0 w-24 sm:w-28 aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-amber-50/30 dark:hover:bg-amber-500/10 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-amber-500 transition cursor-pointer"
                    >
                      <PlusIcon size={18} />
                      <span className="text-[10px] font-bold">ເພີ່ມ / ລາກວາງ</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2-Column Split: Left Preview & File Switcher | Right Per-File Configurator */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN: Active Artwork Document Proof Viewer (6 cols) */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Active Artwork Document Viewer */}
                  {activeArtwork ? (
                    <ArtworkDocumentViewer
                      fileUrl={activeArtwork.previewUrl}
                      fileName={activeArtwork.fileName}
                      fileType={activeArtwork.fileType}
                      report={activeArtwork.report || null}
                      onReupload={() => fileInputRef.current?.click()}
                      onDelete={() => removeArtwork(activeArtworkIndex)}
                    />
                  ) : null}
                </div>

                {/* RIGHT COLUMN: Specific Configurator & Pricing for Active File (6 cols) */}
                <div className="lg:col-span-6 space-y-5">
                  {activeArtwork && (
                    <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
                      {/* Active File Header & Batch Apply Helper */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 block">
                            ຟາຍທີ {activeArtworkIndex + 1} / {uploadedArtworks.length}
                          </span>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white m-0 truncate max-w-[280px]">
                            {activeArtwork.fileName}
                          </h3>
                        </div>

                        {uploadedArtworks.length > 1 && (
                          <button
                            type="button"
                            onClick={applySpecsToAllArtworks}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1"
                          >
                            <span>📋 ນຳໃຊ້ສເປັກນີ້ກັບທຸກຟາຍ</span>
                          </button>
                        )}
                      </div>

                      {/* Configurator Form for Active Artwork */}
                      <form className="configurator space-y-4" onSubmit={handleBuyNow}>
                        {/* Color Print Mode */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                🎨 {language === 'en' ? 'Color Print Mode' : 'ລະບົບສີງານພິມ (Color Mode)'}
                              </span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              {activeArtwork.colorMode === 'cmyk' ? 'ພິມ 4 ສີ (CMYK)' : 'ພິມຂາວ-ດຳ'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                            <button
                              type="button"
                              onClick={() => updateActiveArtworkSpecs({ colorMode: 'cmyk' })}
                              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between cursor-pointer ${
                                activeArtwork.colorMode === 'cmyk'
                                  ? 'bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border-amber-500 shadow-md ring-2 ring-amber-500/30 text-slate-900 dark:text-white'
                                  : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="font-black text-xs sm:text-sm">ພິມ 4 ສີ (CMYK Full Color)</span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">ສີສັນສົດໃສ ຄົມຊັດ 100% ມາດຕະຖານ</span>
                              </div>
                              <div
                                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                                  activeArtwork.colorMode === 'cmyk'
                                    ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-sm'
                                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-transparent'
                                }`}
                              >
                                <CheckIcon size={12} />
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => updateActiveArtworkSpecs({ colorMode: 'grayscale' })}
                              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between cursor-pointer ${
                                activeArtwork.colorMode === 'grayscale'
                                  ? 'bg-gradient-to-br from-slate-500/15 via-slate-500/5 to-transparent border-slate-500 shadow-md ring-2 ring-slate-500/30 text-slate-900 dark:text-white'
                                  : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="font-black text-xs sm:text-sm">ພິມຂາວ-ດຳ (Grayscale)</span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">ປະຢັດຕົ້ນທຶນ ເໝາະສຳລັບເອກະສານ</span>
                              </div>
                              <div
                                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                                  activeArtwork.colorMode === 'grayscale'
                                    ? 'bg-slate-600 border-slate-600 text-white shadow-sm'
                                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-transparent'
                                }`}
                              >
                                <CheckIcon size={12} />
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Specs Options */}
                        <SpecGroup
                          icon="📐"
                          title={t('sizeSelect')}
                          options={product.sizes}
                          value={activeArtwork.sizeId}
                          onChange={(val) => updateActiveArtworkSpecs({ sizeId: val })}
                          language={language}
                          currency={currency}
                          convertTo={convertTo}
                        />
                        <SpecGroup
                          icon="📜"
                          title={t('materialSelect')}
                          options={product.materials}
                          value={activeArtwork.materialId}
                          onChange={(val) => updateActiveArtworkSpecs({ materialId: val })}
                          language={language}
                          currency={currency}
                          convertTo={convertTo}
                        />
                        <SpecGroup
                          icon="✨"
                          title={t('finishingSelect')}
                          options={product.finishings}
                          value={activeArtwork.finishingId}
                          onChange={(val) => updateActiveArtworkSpecs({ finishingId: val })}
                          language={language}
                          currency={currency}
                          convertTo={convertTo}
                        />

                        {/* Custom Dynamic Spec Groups (e.g. Spine, Lamination Type) */}
                        {product.specGroups && product.specGroups.length > 0 && product.specGroups.map((g) => (
                          <SpecGroup
                            key={g.id}
                            icon="⚙️"
                            title={language === 'en' && g.titleEn ? g.titleEn : (g.titleLo || (g as any).title || '')}
                            options={g.options}
                            value={activeArtwork.selectedGroupOptions?.[g.id] || g.options[0]?.id || ''}
                            onChange={(val) => {
                              updateActiveArtworkSpecs({
                                selectedGroupOptions: {
                                  ...(activeArtwork.selectedGroupOptions || {}),
                                  [g.id]: val,
                                },
                              })
                            }}
                            language={language}
                            currency={currency}
                            convertTo={convertTo}
                          />
                        ))}

                        <QuantityStepper
                          value={activeArtwork.quantity}
                          minQty={1}
                          onChange={(val) => updateActiveArtworkSpecs({ quantity: val })}
                          t={t}
                          isOnDemand={isOnDemand}
                          discountTiers={remoteProduct?.discountTiers}
                        />
                      </form>

                      {/* Active File Price Table */}
                      <PriceBreakdownTable
                        quantity={activeArtwork.quantity}
                        pageCount={activeArtwork.report?.pageCount || 1}
                        isColor={activeArtwork.colorMode === 'cmyk'}
                        coveragePercent={activeArtwork.report?.colorCoveragePercent?.total || (activeArtwork.colorMode === 'cmyk' ? 20 : 5)}
                        baseUnit={product.basePrice}
                        sizeLabel={product.sizes.find((x) => x.id === activeArtwork.sizeId)?.label || 'Standard'}
                        sizeAdd={product.sizes.find((x) => x.id === activeArtwork.sizeId)?.add || 0}
                        materialLabel={product.materials.find((x) => x.id === activeArtwork.materialId)?.label || 'Standard'}
                        materialAdd={product.materials.find((x) => x.id === activeArtwork.materialId)?.add || 0}
                        finishingLabel={product.finishings.find((x) => x.id === activeArtwork.finishingId)?.label || 'Standard'}
                        finishingAdd={product.finishings.find((x) => x.id === activeArtwork.finishingId)?.add || 0}
                        discountPercent={0}
                        totalAmountTHB={
                          (computePrice(product, {
                            sizeId: activeArtwork.sizeId,
                            materialId: activeArtwork.materialId,
                            finishingId: activeArtwork.finishingId,
                            quantity: activeArtwork.quantity,
                          })?.total || 0)
                        }
                        currency={currency}
                        convertTo={convertTo}
                        language={language}
                      />

                      {/* Grand Total Bar & Action Buttons */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs text-slate-500 font-bold block">
                              ຍອດລວມທັງໝົດ ({uploadedArtworks.reduce((s, a) => s + a.quantity, 0)} ຊິ້ນ / {uploadedArtworks.length} ຟາຍ):
                            </span>
                            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                              {formatMoney(
                                convertTo(
                                  uploadedArtworks.reduce((sum, art) => {
                                    const p = computePrice(product, {
                                      sizeId: art.sizeId,
                                      materialId: art.materialId,
                                      finishingId: art.finishingId,
                                      quantity: art.quantity,
                                    })
                                    return sum + (p?.total || 0)
                                  }, 0)
                                ),
                                currency
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const count = uploadedArtworks.length || 1
                                setAddedBatchCount(count)
                                uploadedArtworks.forEach((art) => {
                                  const artPrice = computePrice(product, {
                                    sizeId: art.sizeId,
                                    materialId: art.materialId,
                                    finishingId: art.finishingId,
                                    quantity: art.quantity,
                                  })
                                  addToCart({
                                    product,
                                    config: {
                                      sizeId: art.sizeId,
                                      materialId: art.materialId,
                                      finishingId: art.finishingId,
                                      quantity: art.quantity,
                                      specLabels: {
                                        size: product.sizes.find((x) => x.id === art.sizeId)?.label || '',
                                        paper: product.materials.find((x) => x.id === art.materialId)?.label || '',
                                        finishing: product.finishings.find((x) => x.id === art.finishingId)?.label || '',
                                      },
                                    },
                                    driveLink: art.previewUrl || art.fileName,
                                    permissionConfirmed: true,
                                    specialNotes: art.specialNotes,
                                    price: artPrice || price!,
                                  })
                                })
                                setShowAddedToCartModal(true)
                              }}
                              className="btn btn--secondary flex items-center gap-2 px-4 py-3 text-xs font-bold"
                              style={{ border: '1px solid var(--border-gold)' }}
                            >
                              <CartIcon size={18} />
                              <span>{t('addToCartBtn')}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                uploadedArtworks.forEach((art) => {
                                  const artPrice = computePrice(product, {
                                    sizeId: art.sizeId,
                                    materialId: art.materialId,
                                    finishingId: art.finishingId,
                                    quantity: art.quantity,
                                  })
                                  addToCart({
                                    product,
                                    config: {
                                      sizeId: art.sizeId,
                                      materialId: art.materialId,
                                      finishingId: art.finishingId,
                                      quantity: art.quantity,
                                      specLabels: {
                                        size: product.sizes.find((x) => x.id === art.sizeId)?.label || '',
                                        paper: product.materials.find((x) => x.id === art.materialId)?.label || '',
                                        finishing: product.finishings.find((x) => x.id === art.finishingId)?.label || '',
                                      },
                                    },
                                    driveLink: art.previewUrl || art.fileName,
                                    permissionConfirmed: true,
                                    specialNotes: art.specialNotes,
                                    price: artPrice || price!,
                                  })
                                })
                                navigate('/checkout')
                              }}
                              className="btn btn--gold btn--lg shadow-glow flex items-center gap-2 px-6 py-3 font-black text-xs"
                            >
                              <span>{t('buyNowBtn')}</span>
                              <ArrowRightIcon size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 📑 BOTTOM SECTION: Comprehensive Product Knowledge, Materials & Bleed Margin Guides */}
          <div className="my-12 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setInfoTab('description')}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
                  infoTab === 'description'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>📝 {language === 'en' ? 'Description & Details' : 'ລາຍລະອຽດສິນຄ້າ'}</span>
              </button>

              <button
                type="button"
                onClick={() => setInfoTab('materials')}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
                  infoTab === 'materials'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>📜 {language === 'en' ? 'Paper & Material Guide' : 'ຄູ່ມືວັດສະດຸ & ປະເພດເຈ້ຍ'}</span>
              </button>

              <button
                type="button"
                onClick={() => setInfoTab('bleed')}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
                  infoTab === 'bleed'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>📐 {language === 'en' ? 'Bleed & File Specs' : 'ໄລຍະຕັດຕົກ & ມາດຕະຖານຟາຍ'}</span>
              </button>

              <button
                type="button"
                onClick={() => setInfoTab('shipping')}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
                  infoTab === 'shipping'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>🚚 {language === 'en' ? 'Turnaround & Shipping' : 'ໄລຍະເວລາຜະລິດ & ການຈັດສົ່ງ'}</span>
              </button>
            </div>

            {/* Tab Contents */}
            {infoTab === 'description' && (
              <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {productName} — {productDesc || 'ສິນຄ້າພິມຄຸນນະພາບສູງ ມາດຕະຖານໂຮງພິມ ສົມສິ່ງພິມ'}
                </h3>
                <p className="whitespace-pre-line text-slate-600 dark:text-slate-400">
                  {productDesc || 'ຜະລິດດ້ວຍລະບົບດິຈິຕອນອັອບເຊັດທີ່ທັນສະໄໝ ໃຫ້ຄວາມຄົມຊັດລະດັບສູງສຸດ ສີສັນສົດໃສ ກັນນ້ຳ ແລະ ມີອາຍຸການໃຊ້ງານຍາວນານ ເໝາະສຳລັບທຸລະກິດ, ອົງກອນ ແລະ ບຸກຄົນທົ່ວໄປ.'}
                </p>
                {product.features && product.features.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="font-bold text-slate-900 dark:text-white block">ຄຸນສົມບັດເດັ່ນ:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                      {product.features.map((feat, fIdx) => (
                        <li key={fIdx}>{feat}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {infoTab === 'materials' && (
              <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  ຄູ່ມືການເລືອກເຈ້ຍ ແລະ ວັດສະດຸພິມ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="font-black text-amber-600 dark:text-amber-400 block text-sm">Art Card (ອາດກາດ 260g - 350g)</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      ເຈ້ຍເນື້ອແໜ້ນ ຜິວລຽບ ເໝາະສຳລັບໂປສກາດ, ນາມບັດ, ປົກປຶ້ມ ແລະ ກາດແຕ່ງດອງ ຮັບຮອງການເຄືອບດ້ານ/ເງົາ ແລະ Spot UV ໄດ້ດີເລີດ.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="font-black text-blue-600 dark:text-blue-400 block text-sm">Greenread (ຖະໜອມສາຍຕາ 75g)</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      ເຈ້ຍສີຄຣີມນວນຕາ ສະທ້ອນແສງໜ້ອຍ ນ້ຳໜັກເບົາ ເໝາະສຳລັບເນື້ອໃນປຶ້ມນິຍາຍ, ວາລະສານ ແລະ ປຶ້ມອ່ານທົ່ວໄປ.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 block text-sm">Sticker PP / PVC Synthetic</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      ສະຕິກເກີພາດສະຕິກກັນນ້ຳ 100% ຈີກບໍ່ຂາດ ທົນຄວາມເຢັນແລະຄວາມຮ້ອນ ເໝາະສຳລັບສະຫຼາກສິນຄ້າ ແລະ ແກ້ວເຄື່ອງດື່ມ.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {infoTab === 'bleed' && (
              <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  ມາດຕະຖານການກຽມຟາຍພິມ (Artwork & Bleed Margin Guidelines)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="font-bold text-slate-900 dark:text-white block">📐 ໄລຍະຕັດຕົກ (Bleed) & ເສັ້ນປອດໄພ (Safe Zone):</span>
                    <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 text-xs">
                      <li>• <strong>Bleed:</strong> ຕ້ອງເຜື່ອໄລຍະພື້ນຫຼັງອອກມາ <strong>+2 mm</strong> ທຸກດ້ານເພື່ອບໍ່ໃຫ້ເຫັນຂອບຂາວເວລາຕັດ</li>
                      <li>• <strong>Safe Margin:</strong> ຂໍ້ຄວາມແລະໂລໂກ້ສຳຄັນຄວນຢູ່ຫ່າງຈາກຂອບຕັດຢ່າງໜ້ອຍ <strong>3 mm</strong></li>
                      <li>• <strong>Color Mode:</strong> ແນະນຳຕັ້ງຄ່າສີເປັນ <strong>CMYK 100%</strong></li>
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="font-bold text-slate-900 dark:text-white block">🔍 ຄວາມລະອຽດ & ຮູບແບບຟາຍ:</span>
                    <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 text-xs">
                      <li>• <strong>Resolution:</strong> 300 DPI ຂຶ້ນໄປເພື່ອຄວາມຄົມຊັດສູງສຸດ</li>
                      <li>• <strong>Font:</strong> ກະລຸນາ Create Outlines / Convert to Curves ທຸກຕົວໜັງສື</li>
                      <li>• <strong>Format:</strong> PDF (Print Ready), AI, PSD, TIFF, PNG/JPG ຄວາມລະອຽດສູງ</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {infoTab === 'shipping' && (
              <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  ໄລຍະເວລາການຜະລິດ ແລະ ບໍລິການຈັດສົ່ງ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="font-bold text-slate-900 dark:text-white block">⏱️ ໄລຍະເວລາຜະລິດ (Production Turnaround):</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      • ງານພິມດິຈິຕອນທົ່ວໄປ (Print on Demand): 1 - 2 ວັນທຳການ<br />
                      • ງານປຶ້ມ / ເຂົ້າເລັ້ມສັນກາວ / ສະຕິກເກີダイカット: 2 - 4 ວັນທຳການ<br />
                      • ງານດ່ວນ: ສາມາດຕິດຕໍ່ແຈ້ງແອັດມິນເພື່ອຈັດຄິວດ່ວນພິເສດໄດ້
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="font-bold text-slate-900 dark:text-white block">🚚 ບໍລິສັດຂົນສົ່ງທີ່ຮອງຮັບ:</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      ຈັດສົ່ງທົ່ວປະເທດລາວຜ່ານ Anousith Express, HAL Logistics, Mixay Express, Flash Express ພ້ອມເລກ Tracking ຕິດຕາມພັດສະດຸຕະຫຼອດ 24 ຊົ່ວໂມງ.
                    </p>
                  </div>
                </div>
              </div>
            )}
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

      {/* Global Hidden File Input (Always mounted) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,.pdf,.ai,.psd,.png,.jpg,.jpeg,.tiff"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const chosen = Array.from(e.target.files)
            handleMultipleFilesUpload(chosen)
          }
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

      {/* Post Add-to-Cart Modal: Order Another Item vs Go to Cart */}
      {showAddedToCartModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-amber-500/40 bg-slate-900 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500 text-emerald-400 flex items-center justify-center shadow-lg">
              <CheckIcon size={32} />
            </div>

            <div>
              <h3 className="font-black text-xl text-white m-0">
                🎉 ເພີ່ມເຂົ້າກະຕ່າສຳເລັດແລ້ວ!
              </h3>
              <p className="text-xs font-medium text-slate-300 mt-1">
                ບັນທຶກ {addedBatchCount} ລາຍການສິນຄ້າ {productName} ເຂົ້າສູ່ກະຕ່າຮຽບຮ້ອຍແລ້ວ
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 text-left space-y-1">
              <div className="flex justify-between font-bold text-slate-200">
                <span>ສິນຄ້າ:</span>
                <span className="text-amber-400">{productName}</span>
              </div>
              <div className="flex justify-between">
                <span>ຈຳນວນລາຍການ:</span>
                <span>{addedBatchCount} ຟາຍ/ລາຍການ</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddedToCartModal(false)
                  setUploadedArtworks([])
                  setUploadedFileName(null)
                  setUploadedFileUrl(null)
                  setTempPreviewUrl(null)
                  setTempFile(null)
                  setDriveLink('')
                }}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <span>➕ ສັ່ງພິມລາຍການໃໝ່</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddedToCartModal(false)
                  navigate('/checkout')
                }}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>⚡ ໄປທີ່ກະຕ່າ / ຊຳລະເງິນ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
