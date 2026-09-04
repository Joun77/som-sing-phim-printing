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
import { BookOpen, Ruler, Layers, Settings2, FileCheck, CheckCircle2, Tag, Image, Palette, Scissors, Sparkles, Rocket, Package, Award, Sparkle } from 'lucide-react'
import {
  type ArtworkBatchItem,
  OptionButton,
  SpecGroup,
  ArtworkFilmstrip,
  ProductInfoTabsSection,
  AddedToCartModal,
  UploadStudioCard,
  QuotationModal,
} from '../components/product/index.ts'

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
          add: o.addPrice || 0,
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
          add: o.addPrice || 0,
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
        thumbnailUrl: remoteProduct.thumbnailUrl || '',
        galleryUrls: remoteProduct.galleryUrls || [],
        infoTabs: remoteProduct.infoTabs,
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
      const current = uploadedArtworks[activeArtworkIndex] || uploadedArtworks[0]
      return {
        ...current,
        selectedGroupOptions: {
          ...selectedGroupOptions,
          ...(current.selectedGroupOptions || {}),
        },
      }
    }
    return {
      id: 'art-default-active',
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
    if (patch.selectedGroupOptions) {
      setSelectedGroupOptions(patch.selectedGroupOptions)
    }
    if (patch.colorMode) {
      setColorPrintMode(patch.colorMode)
    }
    if (patch.sizeId) {
      setSizeId(patch.sizeId)
    }
    if (patch.materialId) {
      setMaterialId(patch.materialId)
    }
    if (patch.finishingId) {
      setFinishingId(patch.finishingId)
    }
    if (patch.quantity !== undefined) {
      setQuantity(patch.quantity)
    }
    if (patch.specialNotes !== undefined) {
      setSpecialNotes(patch.specialNotes)
    }

    setUploadedArtworks((prev) => {
      if (prev.length === 0) {
        return prev
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

  // Dynamic Upload Workflow & Allowed Extensions based on Product Features Config
  const isGeneralDocWorkflow = useMemo(() => {
    return (
      product?.featuresConfig?.uploadWorkflow === 'general_document' ||
      product?.category === 'documents' ||
      product?.featuresConfig?.hasPreflightCheck === false
    )
  }, [product])

  const allowedExtensions = useMemo(() => {
    const configured = product?.featuresConfig?.allowedFileTypes
    if (configured && configured.length > 0) {
      const extMap: Record<string, string> = {
        pdf: '.pdf,application/pdf',
        ai: '.ai,.eps,application/postscript',
        psd: '.psd,image/vnd.adobe.photoshop',
        png: '.png,image/png',
        jpg: '.jpg,.jpeg,image/jpeg',
        docx: '.docx,.doc,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xlsx: '.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pptx: '.pptx,.ppt,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation',
        zip: '.zip,.rar,application/zip,application/x-rar-compressed',
      }
      return configured.map((k) => extMap[k] || `.${k}`).join(',')
    }
    return isGeneralDocWorkflow
      ? '.pdf,application/pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,.jpg,.jpeg,.png,image/*'
      : 'image/*,application/pdf,.pdf,.ai,.psd,.png,.jpg,.jpeg,.tiff,.zip'
  }, [product?.featuresConfig?.allowedFileTypes, isGeneralDocWorkflow])

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

    // Smooth auto-scroll to configurator / artwork studio
    setTimeout(() => {
      const el = document.querySelector('.configurator') || document.querySelector('#artwork-studio') || document.querySelector('form')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 150)
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
    const resolveImg = (url?: string) => {
      if (!url || typeof url !== 'string') return null
      const trimmed = url.trim()
      if (!trimmed || ['doc', 'sticker', 'card', 'photos', 'album'].includes(trimmed.toLowerCase())) return null
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) return trimmed
      if (trimmed.startsWith('/uploads') || trimmed.startsWith('uploads/')) {
        const base = import.meta.env.VITE_API_URL || ''
        return `${base.replace(/\/+$/, '')}/${trimmed.replace(/^\/+/, '')}`
      }
      return trimmed
    }

    const cover = resolveImg(product?.thumbnailUrl) || resolveImg(remoteProduct?.thumbnailUrl) || resolveImg(product?.image)
    if (cover) list.push(cover)

    const galleries = product?.galleryUrls || remoteProduct?.galleryUrls || []
    if (Array.isArray(galleries)) {
      galleries.forEach((u) => {
        const resolved = resolveImg(u)
        if (resolved && !list.includes(resolved)) list.push(resolved)
      })
    }
    return list
  }, [product, remoteProduct])

  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [selectedCustomTab, setSelectedCustomTab] = useState<string>('description')
  const [imageLoadError, setImageLoadError] = useState(false)

  const allowedTypesDisplay = useMemo(() => {
    const types = product?.featuresConfig?.allowedFileTypes
    if (types && types.length > 0) {
      const nameMap: Record<string, string> = {
        pdf: 'PDF (.pdf)',
        ai: 'Illustrator (.ai)',
        psd: 'Photoshop (.psd)',
        png: 'PNG (.png)',
        jpg: 'JPG / JPEG (.jpg)',
        docx: 'Word (.docx)',
        xlsx: 'Excel (.xlsx)',
        pptx: 'PowerPoint (.pptx)',
        zip: 'ZIP / RAR (.zip)',
      }
      return types.map((t) => nameMap[t] || t.toUpperCase()).join(', ')
    }
    return isGeneralDocWorkflow
      ? 'Word (.docx), Excel (.xlsx), PowerPoint (.pptx), PDF, ຮູບພາບ (.jpg, .png)'
      : 'PDF, Photoshop, Illustrator, PNG, JPG'
  }, [product?.featuresConfig?.allowedFileTypes, isGeneralDocWorkflow])

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

  const computeSingleArtworkFinancials = (art: ArtworkBatchItem) => {
    if (!product) return { unitPrice: 0, total: 0, discountPct: 0 };

    if (product.specGroups && product.specGroups.length > 0) {
      let unitAdd = 0;
      const isCustomBreakdown = product.featuresConfig?.breakdownMode === 'custom';
      if (isCustomBreakdown && product.featuresConfig?.customBreakdownRows && product.featuresConfig.customBreakdownRows.length > 0) {
        const printGroup = product.specGroups.find(g => g.id === 'group_print_mode' || (g as any).groupType === 'printing_mode');
        const printOptId = printGroup ? (art.selectedGroupOptions?.[printGroup.id] || printGroup.options[0]?.id) : null;
        const printOpt = printGroup?.options.find(o => o.id === printOptId) || printGroup?.options[0];
        const printRate = (product.basePrice || 0) + Number(printOpt?.add || 0);

        const materialGroups = product.specGroups.filter(g => g.id.includes('material') || g.id.includes('paper') || (g as any).groupType === 'material' || g.titleLo?.includes('ເຈ້ຍ') || g.titleLo?.includes('ວັດສະດຸ'));
        const materialRate = materialGroups.reduce((s, mg) => {
          const optId = art.selectedGroupOptions?.[mg.id] || mg.options[0]?.id;
          const opt = mg.options.find(o => o.id === optId) || mg.options[0];
          return s + Number(opt?.add || 0);
        }, 0);

        const finishingGroups = product.specGroups.filter(g => g !== printGroup && !materialGroups.some(mg => mg.id === g.id));
        const finishingRate = finishingGroups.reduce((s, fg) => {
          const optId = art.selectedGroupOptions?.[fg.id] || fg.options[0]?.id;
          const opt = fg.options.find(o => o.id === optId) || fg.options[0];
          return s + Number(opt?.add || 0);
        }, 0);

        product.featuresConfig.customBreakdownRows.forEach((r: any) => {
          let rowRate = 0;
          if (r.includePrintCost) rowRate += printRate;
          if (r.includeMaterialCost) rowRate += materialRate;
          if (r.includeFinishingCost) rowRate += finishingRate;
          if (r.extraFixedCost) rowRate += Number(r.extraFixedCost);
          unitAdd += rowRate;
        });
      } else {
        product.specGroups.forEach((g) => {
          const selectedId = art.selectedGroupOptions?.[g.id] || g.options[0]?.id;
          const opt = g.options.find((o) => o.id === selectedId);
          if (opt && typeof opt.add === 'number') {
            unitAdd += opt.add;
          }
        });
      }

      const baseFloor = product.basePrice || 0;
      const rawUnitWithAddons = baseFloor + unitAdd;
      const effectiveUnit = Math.max(rawUnitWithAddons, baseFloor);
      const subtotal = effectiveUnit * art.quantity;
      let discountPct = 0;
      const tiers = product.discountTiers || remoteProduct?.discountTiers || [];
      if (tiers && tiers.length > 0) {
        for (const tier of tiers) {
          if (art.quantity >= tier.minQuantity && tier.discountPercentage > discountPct) {
            discountPct = tier.discountPercentage;
          }
        }
      }
      const discountAmount = Math.round(subtotal * (discountPct / 100));
      return {
        unitPrice: effectiveUnit,
        total: subtotal - discountAmount,
        discountPct,
      };
    }

    const p = computePrice(product, {
      sizeId: art.sizeId,
      materialId: art.materialId,
      finishingId: art.finishingId,
      quantity: art.quantity,
    });
    return {
      unitPrice: p?.unitPrice || 0,
      total: p?.total || 0,
      discountPct: p?.discount || 0,
    };
  };

  const totalDisplay = currency === 'LAK' || !currency ? (price?.total || 0) : convertTo((price?.total || 0) / 630.5)
  const productName = language === 'en' && product?.nameEn ? product.nameEn : (product?.name || '')
  const productDesc = language === 'en' && product?.descriptionEn ? product.descriptionEn : (product?.description || '')
  const categoryName = language === 'en' && category?.nameEn ? category.nameEn : (category?.name || '')

  if (isLoading && !product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-500 animate-pulse">
          {language === 'en' ? 'Loading product details...' : 'ກຳລັງໂຫຼດຂໍ້ມູນສິນຄ້າ...'}
        </p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <p className="text-sm font-bold text-slate-500">
          {language === 'en' ? 'Product not found' : 'ບໍ່ພົບຂໍ້ມູນສິນຄ້ານີ້'}
        </p>
        <Link to="/" className="btn btn--gold">
          {language === 'en' ? 'Back to Home' : 'ກັບຄືນໜ້າຫຼັກ'}
        </Link>
      </div>
    )
  }

  return (
    <>
      <section className="section section--alt product-page min-h-[90vh]">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
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
                  {productImages.length > 0 && !imageLoadError ? (
                    <img
                      src={productImages[activePhotoIndex] || productImages[0]}
                      alt={`${productName} view ${activePhotoIndex + 1}`}
                      onError={() => setImageLoadError(true)}
                      className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 text-amber-400 p-6 text-center space-y-2">
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-lg">
                        {product?.category === 'stickers' ? (
                          <Tag className="w-8 h-8 text-amber-400" />
                        ) : product?.category === 'photos' ? (
                          <Image className="w-8 h-8 text-amber-400" />
                        ) : (
                          <BookOpen className="w-8 h-8 text-amber-400" />
                        )}
                      </div>
                      <span className="text-sm font-black text-slate-200">{productName}</span>
                      <span className="text-xs text-slate-400 font-mono">
                        {product?.unit ? `ລາຄາເລີ່ມຕົ້ນ / ${product.unit}` : 'Som Sing Phim Quality'}
                      </span>
                    </div>
                  )}

                  {/* Overlaid Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                    {product?.bestseller && (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md">
                        {language === 'en' ? 'Bestseller' : 'ສິນຄ້າຍອດນິຍົມ'}
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-900/80 text-amber-300 border border-amber-500/30 backdrop-blur-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>ດິຈິຕອນ 2400 DPI</span>
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
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trust & Guarantee Badges */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                    <Rocket className="w-4 h-4 text-amber-500 mb-1" />
                    <span>{language === 'en' ? '1-2 Days' : 'ຜະລິດໄວ 1-2 ວັນ'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                    <Sparkles className="w-4 h-4 text-amber-500 mb-1" />
                    <span>{language === 'en' ? '100% CMYK' : 'ສີຄົມຊັດ 100%'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                    <Package className="w-4 h-4 text-amber-500 mb-1" />
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
                      {currency === 'LAK' || !currency ? formatMoney(product.basePrice, 'LAK') : formatMoney(convertTo(product.basePrice / 630.5), currency)}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">/ {product.unit || 'ຊິ້ນ'}</span>
                  </div>
                </div>

                {/* UPLOAD STUDIO CARD (Allows 1 or Multiple Files) */}
                <UploadStudioCard
                  uploadMode={uploadMode}
                  setUploadMode={setUploadMode}
                  isDragOver={isDragOver}
                  setIsDragOver={setIsDragOver}
                  isGeneralDocWorkflow={isGeneralDocWorkflow}
                  language={language}
                  allowedTypesDisplay={allowedTypesDisplay}
                  fileInputRef={fileInputRef}
                  handleMultipleFilesUpload={handleMultipleFilesUpload}
                  driveLink={driveLink}
                  setDriveLink={setDriveLink}
                  permissionConfirmed={permissionConfirmed}
                  setPermissionConfirmed={setPermissionConfirmed}
                  onConfirmDriveBatch={() => {
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
                        },
                      ])
                    }
                  }}
                />
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
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white m-0 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-amber-500" />
                        <span>{productName} — ປັບແຕ່ງສເປັກ ({uploadedArtworks.length} ຟາຍ)</span>
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
                      <span>ເພີ່ມຟາຍໃໝ່ (Add More Files)</span>
                    </button>
                  </div>
                </div>

                {/* Visual Multi-File Filmstrip / Thumbnail Tray */}
                <ArtworkFilmstrip
                  uploadedArtworks={uploadedArtworks}
                  activeArtworkIndex={activeArtworkIndex}
                  onSelectIndex={(idx) => setActiveArtworkIndex(idx)}
                  onRemoveIndex={(idx) => removeArtwork(idx)}
                  onAddMoreFiles={() => fileInputRef.current?.click()}
                  onDropFiles={(files) => handleMultipleFilesUpload(files)}
                  language={language}
                />
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
                            <span>ນຳໃຊ້ສເປັກນີ້ກັບທຸກຟາຍ</span>
                          </button>
                        )}
                      </div>

                      {/* Configurator Form for Active Artwork */}
                      <form className="configurator space-y-4" onSubmit={handleBuyNow}>
                        {/* Dynamic Spec Groups from Admin System Database */}
                        {product.specGroups && product.specGroups.length > 0 ? (
                          product.specGroups.map((g) => {
                            const groupTitle = language === 'en' && g.titleEn ? g.titleEn : (g.titleLo || (g as any).title || '');
                            const activeVal = selectedGroupOptions[g.id] || activeArtwork?.selectedGroupOptions?.[g.id] || g.options[0]?.id || '';

                            return (
                              <SpecGroup
                                key={g.id}
                                title={groupTitle}
                                displayType={(g as any).displayType || 'cards'}
                                options={g.options}
                                value={activeVal}
                                onChange={(val) => {
                                  const nextOptions = {
                                    ...selectedGroupOptions,
                                    ...(activeArtwork?.selectedGroupOptions || {}),
                                    [g.id]: val,
                                  };
                                  setSelectedGroupOptions(nextOptions);
                                  updateActiveArtworkSpecs({
                                    selectedGroupOptions: nextOptions,
                                  });
                                }}
                                language={language}
                                currency={currency}
                                convertTo={convertTo}
                              />
                            );
                          })
                        ) : (
                          <>
                            {/* Fallback for legacy products without specGroups */}
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                    <Palette className="w-3.5 h-3.5 text-amber-500" />
                                    <span>{language === 'en' ? 'Color Print Mode' : 'ລະບົບສີງານພິມ (Color Mode)'}</span>
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
                              title={t('sizeSelect')}
                              options={product.sizes}
                              value={activeArtwork.sizeId}
                              onChange={(val) => updateActiveArtworkSpecs({ sizeId: val })}
                              language={language}
                              currency={currency}
                              convertTo={convertTo}
                            />
                            <SpecGroup
                              title={t('materialSelect')}
                              options={product.materials}
                              value={activeArtwork.materialId}
                              onChange={(val) => updateActiveArtworkSpecs({ materialId: val })}
                              language={language}
                              currency={currency}
                              convertTo={convertTo}
                            />
                            <SpecGroup
                              title={t('finishingSelect')}
                              options={product.finishings}
                              value={activeArtwork.finishingId}
                              onChange={(val) => updateActiveArtworkSpecs({ finishingId: val })}
                              language={language}
                              currency={currency}
                              convertTo={convertTo}
                            />
                          </>
                        )}

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
                      {(() => {
                        let activePriceTotal = 0;
                        let activeDiscountPct = 0;
                        let optionsAddPerUnit = 0;
                        const selectedOptionLabels: string[] = [];

                        const specItems: Array<{ id: string; title: string; label: string; ratePerUnit: number; hint?: string }> = [];
                        if (product.specGroups && product.specGroups.length > 0) {
                          const isCustomBreakdown = product.featuresConfig?.breakdownMode === 'custom';
                          const customRowsList = (product.featuresConfig?.customBreakdownRows && product.featuresConfig.customBreakdownRows.length > 0)
                            ? product.featuresConfig.customBreakdownRows
                            : [
                                {
                                  id: 'row_print_paper',
                                  titleLo: 'ຄ່າພິມ + ເນື້ອເຈ້ຍ (Print & Paper Rate)',
                                  titleEn: 'Print & Paper Rate',
                                  includePrintCost: true,
                                  includeMaterialCost: true,
                                  includeFinishingCost: false,
                                  extraFixedCost: 0,
                                }
                              ];

                          const currentOptions: Record<string, string> = {
                            ...selectedGroupOptions,
                            ...(activeArtwork?.selectedGroupOptions || {}),
                          };

                          if (isCustomBreakdown) {
                            // Find current selected print mode option, material option, finishing options
                            const printGroup = product.specGroups.find(g => g.id === 'group_print_mode' || (g as any).groupType === 'printing_mode');
                            const printOptId = printGroup ? (currentOptions[printGroup.id] || printGroup.options[0]?.id) : null;
                            const printOpt = printGroup?.options.find(o => o.id === printOptId) || printGroup?.options[0];
                            const printSellingRate = (product.basePrice || 0) + Number(printOpt?.add || 0);

                            const materialGroups = product.specGroups.filter(g => 
                              g.id.includes('material') || 
                              g.id.includes('paper') || 
                              g.id.includes('mat_') || 
                              (g as any).groupType === 'material' ||
                              g.titleLo?.includes('ເຈ້ຍ') ||
                              g.titleLo?.includes('ວັດສະດຸ')
                            );

                            const materialSellingRate = materialGroups.reduce((sum, g) => {
                              const optId = currentOptions[g.id] || g.options[0]?.id;
                              const opt = g.options.find(o => o.id === optId) || g.options[0];
                              return sum + Number(opt?.add || 0);
                            }, 0);

                            const finishingSellingRate = product.specGroups
                              .filter(g => g !== printGroup && !materialGroups.some(mg => mg.id === g.id))
                              .reduce((sum, g) => {
                                const optId = currentOptions[g.id] || g.options[0]?.id;
                                const opt = g.options.find(o => o.id === optId) || g.options[0];
                                return sum + Number(opt?.add || 0);
                              }, 0);

                            // Build custom rows
                            customRowsList.forEach((r: any) => {
                              let rowSellingRate = 0;
                              const componentsUsed: string[] = [];
                              if (r.includePrintCost) {
                                rowSellingRate += printSellingRate;
                                if (printOpt) componentsUsed.push(language === 'en' && printOpt.labelEn ? printOpt.labelEn : printOpt.label);
                              }
                              if (r.includeMaterialCost) {
                                rowSellingRate += materialSellingRate;
                                materialGroups.forEach(mg => {
                                  const optId = currentOptions[mg.id] || mg.options[0]?.id;
                                  const opt = mg.options.find(o => o.id === optId) || mg.options[0];
                                  if (opt) componentsUsed.push(language === 'en' && opt.labelEn ? opt.labelEn : opt.label);
                                });
                              }
                              if (r.includeFinishingCost) {
                                rowSellingRate += finishingSellingRate;
                                product.specGroups
                                  .filter(g => g !== printGroup && !materialGroups.some(mg => mg.id === g.id))
                                  .forEach(fg => {
                                    const optId = currentOptions[fg.id] || fg.options[0]?.id;
                                    const opt = fg.options.find(o => o.id === optId) || fg.options[0];
                                    if (opt && opt.add > 0) componentsUsed.push(language === 'en' && opt.labelEn ? opt.labelEn : opt.label);
                                  });
                              }
                              if (r.extraFixedCost) {
                                rowSellingRate += Number(r.extraFixedCost);
                              }

                              const rowTitle = language === 'en' && r.titleEn ? r.titleEn : r.titleLo;
                              const rowLabel = componentsUsed.length > 0 ? componentsUsed.join(' · ') : (language === 'en' ? 'Standard Option' : 'ສເປັກມາດຕະຖານ');

                              specItems.push({
                                id: r.id,
                                title: rowTitle,
                                label: rowLabel,
                                ratePerUnit: rowSellingRate,
                              });
                            });

                            // Options additions for total
                            product.specGroups.forEach((g) => {
                              const selectedId = currentOptions[g.id] || g.options[0]?.id;
                              const opt = g.options.find((o) => o.id === selectedId) || g.options[0];
                              if (opt && typeof opt.add === 'number' && opt.add > 0) {
                                optionsAddPerUnit += opt.add;
                              }
                            });
                          } else {
                            // Standard Auto Breakdown
                            product.specGroups.forEach((g) => {
                              const selectedId = currentOptions[g.id] || g.options[0]?.id;
                              const opt = g.options.find((o) => o.id === selectedId) || g.options[0];
                              if (opt) {
                                const groupTitle = language === 'en' && g.titleEn ? g.titleEn : (g.titleLo || g.id);
                                const optLabel = language === 'en' && opt.labelEn ? opt.labelEn : opt.label;
                                const isPrintMode = g.id === 'group_print_mode' || (g as any).groupType === 'printing_mode';
                                const isFinishing = g.id.includes('finish') || g.id.includes('cut') || (g as any).groupType === 'finishing' || (g as any).groupType === 'cutting';

                                // Hide finishing row if not configured
                                if (isFinishing && (!opt.add || opt.add === 0) && (!opt.extraCostRate || opt.extraCostRate === 0)) {
                                  return;
                                }

                                const optRate = isPrintMode
                                  ? (product.basePrice || 0) + Number(opt.add || 0)
                                  : Number(opt.add || 0);

                                if (typeof opt.add === 'number' && opt.add > 0) {
                                  optionsAddPerUnit += opt.add;
                                }
                                selectedOptionLabels.push(optLabel);
                                specItems.push({
                                  id: g.id,
                                  title: groupTitle,
                                  label: optLabel,
                                  ratePerUnit: optRate,
                                  hint: language === 'en' && opt.hintEn ? opt.hintEn : opt.hint,
                                });
                              }
                            });
                          }

                          // Floor Price Calculation: effective unit price = max(calculatedComponentsRate, baseFloorPrice)
                          const rawCalculatedUnitPrice = specItems.length > 0
                            ? specItems.reduce((sum, it) => sum + (it.ratePerUnit || 0), 0)
                            : (product.basePrice || 0) + optionsAddPerUnit;

                          const baseFloorPrice = product.basePrice || 0;
                          const effectiveUnitPrice = Math.max(rawCalculatedUnitPrice, baseFloorPrice);

                          // If calculated rate is below floor price, add a clear floor adjustment line item so table sum matches effectiveUnitPrice 100%
                          if (rawCalculatedUnitPrice < baseFloorPrice && baseFloorPrice > 0) {
                            const floorDelta = baseFloorPrice - rawCalculatedUnitPrice;
                            specItems.push({
                              id: 'floor_price_adjustment',
                              title: language === 'en' ? 'Minimum Base Price Floor Adjustment' : 'ປັບເຂົ້າເກນລາຄາເລີ່ມຕົ້ນຂັ້ນຕ່ຳ (Base Floor Price)',
                              label: language === 'en' ? 'Base Floor Applied' : 'ມາດຕະຖານຂັ້ນຕ່ຳ',
                              ratePerUnit: floorDelta,
                              hint: language === 'en' ? 'Product base starting price applied' : 'ຄິດໄລ່ຕາມເກນລາຄາເລີ່ມຕົ້ນຂັ້ນຕ່ຳຂອງສິນຄ້າ',
                            });
                          }

                          const unitTotal = effectiveUnitPrice;
                          const subtotal = unitTotal * activeArtwork.quantity;
                          const tiers = product.discountTiers || remoteProduct?.discountTiers || [];
                          if (tiers && tiers.length > 0) {
                            for (const tier of tiers) {
                              if (activeArtwork.quantity >= tier.minQuantity && tier.discountPercentage > activeDiscountPct) {
                                activeDiscountPct = tier.discountPercentage;
                              }
                            }
                          }
                          const discountAmount = Math.round(subtotal * (activeDiscountPct / 100));
                          activePriceTotal = subtotal - discountAmount;
                        } else {
                          const p = computePrice(product, {
                            sizeId: activeArtwork.sizeId,
                            materialId: activeArtwork.materialId,
                            finishingId: activeArtwork.finishingId,
                            quantity: activeArtwork.quantity,
                          });
                          activePriceTotal = p?.total || 0;
                          activeDiscountPct = p?.discount || 0;
                        }

                        return (
                          <PriceBreakdownTable
                            quantity={activeArtwork.quantity}
                            pageCount={activeArtwork.report?.pageCount || 1}
                            isColor={activeArtwork.colorMode === 'cmyk'}
                            coveragePercent={activeArtwork.report?.colorCoveragePercent?.total || (activeArtwork.colorMode === 'cmyk' ? 20 : 5)}
                            specItems={specItems.length > 0 ? specItems : undefined}
                            baseUnit={product.basePrice}
                            sizeLabel=""
                            sizeAdd={0}
                            materialLabel={selectedOptionLabels.length > 0 ? selectedOptionLabels.join(' · ') : (product.materials.find((x) => x.id === activeArtwork.materialId)?.label || 'Standard')}
                            materialAdd={optionsAddPerUnit}
                            finishingLabel=""
                            finishingAdd={0}
                            discountPercent={activeDiscountPct}
                            totalAmountTHB={activePriceTotal}
                            currency={currency}
                            convertTo={convertTo}
                            language={language}
                          />
                        );
                      })()}

                      {/* Grand Total Bar & Action Buttons */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs text-slate-500 font-bold block">
                              ຍອດລວມທັງໝົດ ({uploadedArtworks.reduce((s, a) => s + a.quantity, 0)} ຊິ້ນ / {uploadedArtworks.length} ຟາຍ):
                            </span>
                            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                              {(() => {
                                const grandTotalLAK = uploadedArtworks.reduce((sum, art) => {
                                  if (product.specGroups && product.specGroups.length > 0) {
                                    let unitAdd = 0;
                                    const isCustomBreakdown = product.featuresConfig?.breakdownMode === 'custom';
                                    if (isCustomBreakdown && product.featuresConfig?.customBreakdownRows && product.featuresConfig.customBreakdownRows.length > 0) {
                                      const printGroup = product.specGroups.find(g => g.id === 'group_print_mode' || (g as any).groupType === 'printing_mode');
                                      const printOptId = printGroup ? (art.selectedGroupOptions?.[printGroup.id] || printGroup.options[0]?.id) : null;
                                      const printOpt = printGroup?.options.find(o => o.id === printOptId) || printGroup?.options[0];
                                      const printRate = (product.basePrice || 0) + Number(printOpt?.add || 0);

                                      const materialGroups = product.specGroups.filter(g => g.id.includes('material') || g.id.includes('paper') || (g as any).groupType === 'material' || g.titleLo?.includes('ເຈ້ຍ') || g.titleLo?.includes('ວັດສະດຸ'));
                                      const materialRate = materialGroups.reduce((s, mg) => {
                                        const optId = art.selectedGroupOptions?.[mg.id] || mg.options[0]?.id;
                                        const opt = mg.options.find(o => o.id === optId) || mg.options[0];
                                        return s + Number(opt?.add || 0);
                                      }, 0);

                                      const finishingGroups = product.specGroups.filter(g => g !== printGroup && !materialGroups.some(mg => mg.id === g.id));
                                      const finishingRate = finishingGroups.reduce((s, fg) => {
                                        const optId = art.selectedGroupOptions?.[fg.id] || fg.options[0]?.id;
                                        const opt = fg.options.find(o => o.id === optId) || fg.options[0];
                                        return s + Number(opt?.add || 0);
                                      }, 0);

                                      product.featuresConfig.customBreakdownRows.forEach((r: any) => {
                                        let rowRate = 0;
                                        if (r.includePrintCost) rowRate += printRate;
                                        if (r.includeMaterialCost) rowRate += materialRate;
                                        if (r.includeFinishingCost) rowRate += finishingRate;
                                        if (r.extraFixedCost) rowRate += Number(r.extraFixedCost);
                                        unitAdd += rowRate;
                                      });
                                    } else {
                                      product.specGroups.forEach((g) => {
                                        const selectedId = art.selectedGroupOptions?.[g.id] || g.options[0]?.id;
                                        const opt = g.options.find((o) => o.id === selectedId);
                                        if (opt && typeof opt.add === 'number') {
                                          unitAdd += opt.add;
                                        }
                                      });
                                    }
                                    const baseFloor = product.basePrice || 0;
                                    const effectiveUnit = Math.max(baseFloor + unitAdd, baseFloor);
                                    const subtotal = effectiveUnit * art.quantity;
                                    let discountPct = 0;
                                    const tiers = product.discountTiers || remoteProduct?.discountTiers || [];
                                    if (tiers && tiers.length > 0) {
                                      for (const tier of tiers) {
                                        if (art.quantity >= tier.minQuantity && tier.discountPercentage > discountPct) {
                                          discountPct = tier.discountPercentage;
                                        }
                                      }
                                    }
                                    const discountAmount = Math.round(subtotal * (discountPct / 100));
                                    return sum + (subtotal - discountAmount);
                                  }
                                  const p = computePrice(product, {
                                    sizeId: art.sizeId,
                                    materialId: art.materialId,
                                    finishingId: art.finishingId,
                                    quantity: art.quantity,
                                  });
                                  return sum + (p?.total || 0);
                                }, 0);

                                if (currency === 'LAK' || !currency) {
                                  return formatMoney(grandTotalLAK, 'LAK');
                                }
                                return formatMoney(convertTo(grandTotalLAK / 630.5), currency);
                              })()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const count = uploadedArtworks.length || 1
                                setAddedBatchCount(count)
                                uploadedArtworks.forEach((art) => {
                                  const fin = computeSingleArtworkFinancials(art);
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
                                    price: {
                                      unitPrice: fin.unitPrice,
                                      total: fin.total,
                                      totalTHB: fin.total,
                                      qty: art.quantity,
                                      discount: fin.discountPct,
                                    },
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
                                  const fin = computeSingleArtworkFinancials(art);
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
                                    price: {
                                      unitPrice: fin.unitPrice,
                                      total: fin.total,
                                      totalTHB: fin.total,
                                      qty: art.quantity,
                                      discount: fin.discountPct,
                                    },
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

          {/* BOTTOM SECTION: Comprehensive Product Knowledge & Dynamic Info Tabs Studio */}
          <ProductInfoTabsSection
            product={product}
            productName={productName}
            productDesc={productDesc}
            selectedCustomTab={selectedCustomTab}
            setSelectedCustomTab={setSelectedCustomTab}
            language={language}
          />
        </div>
      </section>

      {/* Instant Quotation Spec Sheet Modal */}
      <QuotationModal
        isOpen={showQuotationModal}
        onClose={() => setShowQuotationModal(false)}
        productName={productName}
        specLabels={specLabels}
        quantity={quantity}
        totalDisplay={totalDisplay}
        currency={currency}
        language={language}
        t={t}
      />

      {/* Global Hidden File Input (Always mounted) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedExtensions}
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
      <AddedToCartModal
        isOpen={showAddedToCartModal}
        productName={productName}
        addedBatchCount={addedBatchCount}
        onContinueShopping={() => {
          setShowAddedToCartModal(false)
          setUploadedArtworks([])
          setUploadedFileName(null)
          setUploadedFileUrl(null)
          setTempPreviewUrl(null)
          setTempFile(null)
          setDriveLink('')
        }}
        onGoToCheckout={() => {
          setShowAddedToCartModal(false)
          navigate('/checkout')
        }}
        language={language}
      />
    </>
  )
}
