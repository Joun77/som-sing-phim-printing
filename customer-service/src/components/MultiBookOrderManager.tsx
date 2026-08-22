import React, { useState } from 'react'
import type { BookOrderItem } from '../types/order.ts'
import type { Product, SpecOption } from '../data/catalog.ts'
import { calculateSpineThickness } from '../utils/spineCalculator.ts'
import { analyzeArtworkPreflight } from '../lib/preflightAnalyzer.ts'
import { uploadArtworkFile } from '../api/client.ts'
import { formatMoney } from '../utils/currency.ts'
import {
  UploadCloud,
  FileCheck,
  FileText,
  Plus,
  Minus,
  X,
  Check,
  Eye,
  BookOpen,
  Ruler,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'

export interface MultiBookOrderManagerProps {
  product: Product
  masterSizeId: string
  masterMaterialId: string
  masterFinishingId: string
  bookItems: BookOrderItem[]
  onChange: (items: BookOrderItem[]) => void
  currency: any
  convertTo: (thb: number) => number
  language: string
}

// 1. Cover Paper Options
const COVER_PAPER_OPTIONS: SpecOption[] = [
  { id: 'artcard-260', label: 'ອາດກາດ 260g (ມາດຕະຖານ)', labelEn: '260gsm Art Card (Standard)', hint: 'ໜາກຳລັງດີ ເຂົ້າເລັ້ມງາມ', add: 0 },
  { id: 'artcard-300', label: 'ອາດກາດ 300g (ໜາພິເສດ)', labelEn: '300gsm Art Card (Thick)', hint: 'ໜາແໜ້ນ ເປັນຊົງສວຍງາມ', add: 5 },
  { id: 'artcard-350', label: 'ອາດກາດ 350g (ໜາທີ່ສຸດ)', labelEn: '350gsm Art Card (Heavy)', hint: 'ແຂງແຮງ ທົນທານສູງ', add: 10 },
]

// 2. Cover Lamination Options
const COVER_LAMINATION_OPTIONS: SpecOption[] = [
  { id: 'gloss-lam', label: 'ເຄືອບເງົາ (Glossy)', labelEn: 'Glossy Lamination', hint: 'ສີສັນສົດໃສ ເງົາງາມ', add: 10 },
  { id: 'matte-lam', label: 'ເຄືອບດ້ານ (Matte)', labelEn: 'Matte Lamination', hint: 'ພຣີມ່ຽມ ບໍ່ສະທ້ອນແສງ', add: 15 },
  { id: 'spot-uv', label: 'ເຄືອບດ້ານ + Spot UV', labelEn: 'Matte + Spot UV', hint: 'ເນັ້ນລວດລາຍປົກພິເສດ', add: 30 },
  { id: 'no-lam', label: 'ບໍ່ເຄືອບ (No Coating)', labelEn: 'No Lamination', hint: 'ຜິວທຳມະຊາດ', add: 0 },
]

// 3. Book Size Options
const BOOK_SIZE_OPTIONS: SpecOption[] = [
  { id: 'a4', label: 'A4 (210×297 mm)', labelEn: 'A4 (210×297 mm)', hint: 'ຂະໜາດມາດຕະຖານ', add: 0 },
  { id: 'a5', label: 'A5 (148×210 mm)', labelEn: 'A5 (148×210 mm)', hint: 'ຂະໜາດກະທັດຮັດ', add: -5 },
  { id: 'b5', label: 'B5 (176×250 mm)', labelEn: 'B5 (176×250 mm)', hint: 'ຂະໜາດພິເສດ', add: 0 },
]

// 4. Inner Paper Options
const INNER_PAPER_OPTIONS: SpecOption[] = [
  { id: 'bond-80', label: 'ເຈ້ຍປອນ 80g (Woodfree)', labelEn: '80gsm Woodfree Bond', hint: 'ຂາວສະອາດ ຂຽນງ່າຍ', add: 0 },
  { id: 'greenread-75', label: 'ເຈ້ຍຖະໜອມສາຍຕາ 75g (Green Read)', labelEn: '75gsm Green Read Cream', hint: 'ອ່ານສະບາຍຕາ ນ້ຳໜັກເບົາ', add: 8 },
  { id: 'art-105', label: 'ເຈ້ຍອາດດ້ານ 105g (Art Matte)', labelEn: '105gsm Art Matte', hint: 'ສຳລັບຮູບພາບສີສັນ', add: 15 },
  { id: 'art-128', label: 'ເຈ້ຍອາດເງົາ 128g (Art Gloss)', labelEn: '128gsm Art Gloss', hint: 'ຮູບພາບຄົມຊັດສູງ', add: 20 },
]

export default function MultiBookOrderManager({
  product,
  masterSizeId,
  masterMaterialId,
  masterFinishingId,
  bookItems,
  onChange,
  currency,
  convertTo,
  language,
}: MultiBookOrderManagerProps) {
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0)
  const [uploadingSlots, setUploadingSlots] = useState<Record<string, boolean>>({})
  const [previewModal, setPreviewModal] = useState<{
    open: boolean
    title: string
    fileUrl: string
    fileType: 'image' | 'pdf'
  } | null>(null)

  // Helper to compute unit price breakdown for a book item
  const calculateBookPriceDetails = (item: BookOrderItem) => {
    const effectiveMat = item.materialId || masterMaterialId || 'bond-80'
    const effectiveSize = item.sizeId || masterSizeId || 'a4'
    const effectiveFin = item.finishingId || masterFinishingId || 'gloss-lam'
    const effectiveCoverPaper = item.coverPaperId || 'artcard-260'

    const coverPaperOpt = COVER_PAPER_OPTIONS.find((c) => c.id === effectiveCoverPaper)
    const coverFinOpt = COVER_LAMINATION_OPTIONS.find((f) => f.id === effectiveFin)
    const innerPaperOpt = INNER_PAPER_OPTIONS.find((p) => p.id === effectiveMat)

    const baseCoverPrice = 25 // Base cover print + glue binding
    const coverPaperAdd = coverPaperOpt ? coverPaperOpt.add : 0
    const coverFinAdd = coverFinOpt ? coverFinOpt.add : 10
    const totalCoverCost = baseCoverPrice + coverPaperAdd + coverFinAdd

    const isColor = item.colorMode === 'cmyk'
    const pageRate = isColor ? 1.5 : 0.45 // THB per page
    const sizeMultiplier = effectiveSize === 'a5' ? 0.65 : effectiveSize === 'b5' ? 0.85 : 1.0
    const paperAdd = innerPaperOpt ? innerPaperOpt.add : 0

    const innerCost = Math.round(item.innerPageCount * pageRate * sizeMultiplier + paperAdd)
    const totalUnitThb = Math.max(25, totalCoverCost + innerCost)
    const totalBookThb = totalUnitThb * item.quantity

    return {
      coverCostThb: totalCoverCost,
      innerCostThb: innerCost,
      pageRate,
      unitPriceThb: totalUnitThb,
      totalPriceThb: totalBookThb,
    }
  }

  const handleUpdateItem = (index: number, updates: Partial<BookOrderItem>) => {
    const updatedList = bookItems.map((item, i) => {
      if (i !== index) return item
      const merged = { ...item, ...updates }
      
      const effectiveMat = merged.materialId || masterMaterialId || 'bond-80'
      const effectiveCoverPaper = merged.coverPaperId || 'artcard-260'
      
      // Recalculate spine
      const spine = calculateSpineThickness(merged.innerPageCount, effectiveMat, effectiveCoverPaper)
      merged.spineThicknessMm = spine.spineThicknessMm
      
      // Recalculate prices
      const priceDetails = calculateBookPriceDetails(merged)
      merged.unitPriceThb = priceDetails.unitPriceThb
      merged.totalPriceThb = priceDetails.totalPriceThb
      return merged
    })
    onChange(updatedList)
  }

  const handleAddBook = () => {
    const nextNum = bookItems.length + 1
    const defaultPages = 60
    const effectiveMat = masterMaterialId || 'bond-80'
    const effectiveSize = masterSizeId || 'a4'
    const effectiveFin = masterFinishingId || 'gloss-lam'
    const effectiveCoverPaper = 'artcard-260'
    const spine = calculateSpineThickness(defaultPages, effectiveMat, effectiveCoverPaper)

    const newItem: BookOrderItem = {
      id: `book-${Date.now()}-${nextNum}`,
      title: language === 'en' ? `Book Title #${nextNum}` : `ລາຍການປຶ້ມທີ ${nextNum}`,
      coverPaperId: effectiveCoverPaper,
      coverPageCount: 1,
      innerPageCount: defaultPages,
      spineThicknessMm: spine.spineThicknessMm,
      quantity: 1,
      sizeId: effectiveSize,
      materialId: effectiveMat,
      finishingId: effectiveFin,
      colorMode: 'cmyk',
      unitPriceThb: 50,
      totalPriceThb: 50,
    }
    const priceDetails = calculateBookPriceDetails(newItem)
    newItem.unitPriceThb = priceDetails.unitPriceThb
    newItem.totalPriceThb = priceDetails.totalPriceThb

    const nextList = [...bookItems, newItem]
    onChange(nextList)
    setActiveItemIndex(nextList.length - 1)
  }

  const handleRemoveBook = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (bookItems.length <= 1) return
    const nextList = bookItems.filter((_, i) => i !== index)
    onChange(nextList)
    if (activeItemIndex >= nextList.length) {
      setActiveItemIndex(nextList.length - 1)
    }
  }

  const handleCoverUpload = async (index: number, file: File) => {
    if (!file) return
    const key = `cover-${index}`
    setUploadingSlots((prev) => ({ ...prev, [key]: true }))
    try {
      let detectedPages = 1
      try {
        const report = await analyzeArtworkPreflight(file)
        if (report.pageCount && report.pageCount > 0) {
          detectedPages = report.pageCount
        }
      } catch {
        detectedPages = 1
      }

      let fileUrl = ''
      try {
        fileUrl = await uploadArtworkFile(file)
      } catch {
        fileUrl = URL.createObjectURL(file)
      }
      handleUpdateItem(index, {
        coverFileName: file.name,
        coverFileUrl: fileUrl,
        coverPageCount: detectedPages,
      })
    } finally {
      setUploadingSlots((prev) => ({ ...prev, [key]: false }))
    }
  }

  const handleInnerUpload = async (index: number, file: File) => {
    if (!file) return
    const key = `inner-${index}`
    setUploadingSlots((prev) => ({ ...prev, [key]: true }))
    try {
      const report = await analyzeArtworkPreflight(file)
      const detectedPages = report.pageCount && report.pageCount > 0 ? report.pageCount : 60
      const detectedColor = report.colorSpace === 'Grayscale' ? 'grayscale' : 'cmyk'

      let fileUrl = ''
      try {
        fileUrl = await uploadArtworkFile(file)
      } catch {
        fileUrl = URL.createObjectURL(file)
      }

      handleUpdateItem(index, {
        innerFileName: file.name,
        innerFileUrl: fileUrl,
        innerPageCount: detectedPages,
        colorMode: detectedColor,
      })
    } finally {
      setUploadingSlots((prev) => ({ ...prev, [key]: false }))
    }
  }

  const openPreview = (title: string, fileUrl?: string, fileName?: string) => {
    if (!fileUrl) return
    const lower = (fileName || fileUrl).toLowerCase()
    const isPdf = lower.endsWith('.pdf') || lower.endsWith('.ai')
    setPreviewModal({
      open: true,
      title,
      fileUrl,
      fileType: isPdf ? 'pdf' : 'image',
    })
  }

  const isSingleMode = bookItems.length <= 1
  const currentItem = bookItems[activeItemIndex] || bookItems[0]
  const currentPriceDetails = currentItem ? calculateBookPriceDetails(currentItem) : null
  const spineInfo = currentItem
    ? calculateSpineThickness(
        currentItem.innerPageCount,
        currentItem.materialId || masterMaterialId,
        currentItem.coverPaperId || 'artcard-260'
      )
    : null

  return (
    <div className="multi-book-manager" style={{ marginTop: '1.5rem' }}>
      {/* 1. Header Area (Single-Book Clean Header vs Multi-Book Tabs) */}
      {!isSingleMode ? (
        <>
          {/* Multi-book Batch Top Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '1rem',
              padding: '1rem 1.25rem',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(20, 30, 55, 0.04) 0%, rgba(20, 30, 55, 0.08) 100%)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>{language === 'en' ? 'Multi-Book Batch Manager' : 'ລາຍການປຶ້ມຫຼາຍຫົວ (Multi-Book POD)'}</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    background: '#f59e0b',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                >
                  {bookItems.length} {language === 'en' ? 'Titles' : 'ເລື່ອງ'}
                </span>
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                {language === 'en'
                  ? 'Click each book title below to configure cover & inner specs.'
                  : 'ຄລິກເລືອກປຶ້ມແຕ່ລະຫົວດ້ານລຸ່ມ ເພື່ອຕັ້ງຄ່າສເປັກປົກ ແລະ ເນື້ອໃນແຍກກັນ'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddBook}
              className="btn btn--primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                borderRadius: '8px',
              }}
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'en' ? 'Add Another Book' : 'ເພີ່ມປຶ້ມອີກຫົວ'}</span>
            </button>
          </div>

          {/* Book Tabs List */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            {bookItems.map((item, idx) => {
              const isActive = idx === activeItemIndex
              const isComplete = item.coverFileName && item.innerFileName
              const sizeLabel = (item.sizeId || masterSizeId || 'a4').toUpperCase()
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveItemIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1rem',
                    borderRadius: '10px',
                    border: isActive ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    background: isActive ? '#eff6ff' : '#ffffff',
                    color: isActive ? '#1e40af' : '#475569',
                    cursor: 'pointer',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{item.title || `ເລື່ອງທີ ${idx + 1}`}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7' }}>({sizeLabel})</span>
                  {isComplete && <Check className="w-4 h-4 text-emerald-600" />}
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '1px 6px',
                      borderRadius: '12px',
                      background: isActive ? '#dbeafe' : '#f1f5f9',
                      color: isActive ? '#1e40af' : '#64748b',
                    }}
                  >
                    {item.quantity} {language === 'en' ? 'cps' : 'ຫົວ'}
                  </span>

                  {bookItems.length > 1 && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleRemoveBook(idx, e)}
                      title="Remove book"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        marginLeft: '4px',
                      }}
                    >
                      <X className="w-3 h-3" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      ) : (
        /* Clean Single-Book Header */
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(245, 158, 11, 0.12) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
            <BookOpen className="w-5 h-5 text-amber-700" />
            <span>{language === 'en' ? 'Upload Artwork & Choose Specs for Book' : 'ອັບໂຫຼດຟາຍ & ເລືອກສເປັກສຳລັບປຶ້ມ (ແຍກປົກ + ເນື້ອໃນ)'}</span>
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#78350f' }}>
            {language === 'en'
              ? 'Configure Cover and Inner Content separately with dedicated paper, lamination, and automated page preflight.'
              : 'ເລືອກສເປັກເຈ້ຍປົກ ແລະ ເຈ້ຍເນື້ອໃນແຍກກັນໄດ້ອິດສະຫຼະ ພ້ອມລະບົບກວດນັບໜ້າ ແລະ ຄຳນວਣສັນກາວອັດຕະໂນມັດ'}
          </p>
        </div>
      )}

      {/* 2. ACTIVE BOOK: SPLIT INTO TWO COLUMNS (MAIN ZONE 8 cols vs LIVE SIDEBAR 4 cols) */}
      {currentItem && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.25rem',
            alignItems: 'start',
          }}
        >
          {/* LEFT MAIN AREA: Zone 1 (Cover) & Zone 2 (Inner Content) */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.25rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* Title & Quantity Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '0.35rem',
                  }}
                >
                  {language === 'en' ? 'Book Title / Identifier' : 'ຊື່ປຶ້ມ / ຊື່ເລື່ອງ (Book Title)'}
                </label>
                <input
                  type="text"
                  value={currentItem.title}
                  onChange={(e) => handleUpdateItem(activeItemIndex, { title: e.target.value })}
                  placeholder="e.g. ປຶ້ມພາສາລາວ ຊັ້ນ ມ.1"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '0.35rem',
                  }}
                >
                  {language === 'en' ? 'Quantity (Copies)' : 'ຈຳນວນພິມ (ຫົວ)'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateItem(activeItemIndex, {
                        quantity: Math.max(1, currentItem.quantity - 1),
                      })
                    }
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Minus className="w-4 h-4 text-slate-700" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) =>
                      handleUpdateItem(activeItemIndex, {
                        quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                      })
                    }
                    style={{
                      width: '70px',
                      textAlign: 'center',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateItem(activeItemIndex, {
                        quantity: currentItem.quantity + 1,
                      })
                    }
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Plus className="w-4 h-4 text-slate-700" />
                  </button>
                </div>
              </div>
            </div>

            {/* TWO DEDICATED SPEC & ARTWORK ZONES: (Zone 1: Cover | Zone 2: Inner Content) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {/* ZONE 1: COVER ARTWORK & SPECS */}
              <div
                style={{
                  border: '1.5px solid #bfdbfe',
                  borderRadius: '14px',
                  padding: '1.15rem',
                  background: '#f8faff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem',
                }}
              >
                {/* Cover Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #e0f2fe', paddingBottom: '0.5rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#3b82f6',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileCheck className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: '#1e3a8a', display: 'block' }}>
                      {language === 'en' ? 'Zone 1: Cover Artwork & Specs' : 'ສ່ວນທີ 1: ຟາຍປົກ & ສເປັກປົກ'}
                    </strong>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      PDF, AI, PSD, PNG, JPG (ກາງໜ້າ-ຫຼັງ + ສັນ)
                    </span>
                  </div>
                </div>

                {/* Cover Upload Dropzone */}
                <div
                  style={{
                    border: '2px dashed #93c5fd',
                    borderRadius: '10px',
                    padding: '0.9rem',
                    background: '#ffffff',
                    textAlign: 'center',
                  }}
                >
                  {currentItem.coverFileName ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div
                        style={{
                          background: '#f0f9ff',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid #bae6fd',
                          fontSize: '0.82rem',
                          color: '#0369a1',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate">{currentItem.coverFileName}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: '#e0f2fe',
                            color: '#0369a1',
                          }}
                        >
                          {currentItem.coverPageCount || 1} {language === 'en' ? 'Spread Page' : 'ແຜ່ນກາງປົກ (Spread)'}
                        </span>

                        <button
                          type="button"
                          onClick={() => openPreview(`${currentItem.title} - Cover Artwork`, currentItem.coverFileUrl, currentItem.coverFileName)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <Eye className="w-3 h-3" />
                          <span>{language === 'en' ? 'Preview' : 'ເບິ່ງຕົວຢ່າງ'}</span>
                        </button>

                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <span>{language === 'en' ? 'Change' : 'ປ່ຽນຟາຍ'}</span>
                          <input
                            type="file"
                            accept=".pdf,.ai,.psd,.png,.jpg,.jpeg,.tiff"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleCoverUpload(activeItemIndex, e.target.files[0])
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: '#0284c7',
                        color: '#ffffff',
                        padding: '0.5rem 0.9rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <UploadCloud className="w-4 h-4" />
                      {uploadingSlots[`cover-${activeItemIndex}`]
                        ? (language === 'en' ? 'Uploading...' : 'ກຳລັງອັບໂຫຼດ...')
                        : (language === 'en' ? 'Upload Cover File' : 'ເລືອກຟາຍປົກ (Cover)')}
                      <input
                        type="file"
                        accept=".pdf,.ai,.psd,.png,.jpg,.jpeg,.tiff"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleCoverUpload(activeItemIndex, e.target.files[0])
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Cover Spec Options: Paper & Lamination */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '3px' }}>
                      {language === 'en' ? 'Cover Paper (Card)' : 'ເຈ້ຍປົກ (Cover Card)'}
                    </label>
                    <select
                      value={currentItem.coverPaperId || 'artcard-260'}
                      onChange={(e) => handleUpdateItem(activeItemIndex, { coverPaperId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.6rem',
                        borderRadius: '6px',
                        border: '1px solid #93c5fd',
                        background: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      {COVER_PAPER_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '3px' }}>
                      {language === 'en' ? 'Cover Lamination' : 'ການເຄືອບປົກ (Coating)'}
                    </label>
                    <select
                      value={currentItem.finishingId || masterFinishingId || 'gloss-lam'}
                      onChange={(e) => handleUpdateItem(activeItemIndex, { finishingId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.6rem',
                        borderRadius: '6px',
                        border: '1px solid #93c5fd',
                        background: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      {COVER_LAMINATION_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ZONE 2: INNER CONTENT ARTWORK & SPECS */}
              <div
                style={{
                  border: '1.5px solid #bbf7d0',
                  borderRadius: '14px',
                  padding: '1.15rem',
                  background: '#f8fef9',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem',
                }}
              >
                {/* Inner Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #dcfce7', paddingBottom: '0.5rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#22c55e',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: '#14532d', display: 'block' }}>
                      {language === 'en' ? 'Zone 2: Inner Content & Specs' : 'ສ່ວນທີ 2: ຟາຍເນື້ອໃນ & ສເປັກເນື້ອໃນ'}
                    </strong>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      PDF ເທົ່ານັ້ນ (ລະບົບກວດນັບໜ້າອັດຕະໂນມັດ)
                    </span>
                  </div>
                </div>

                {/* Inner Upload Dropzone */}
                <div
                  style={{
                    border: '2px dashed #86efac',
                    borderRadius: '10px',
                    padding: '0.9rem',
                    background: '#ffffff',
                    textAlign: 'center',
                  }}
                >
                  {currentItem.innerFileName ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div
                        style={{
                          background: '#f0fdf4',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid #bbf7d0',
                          fontSize: '0.82rem',
                          color: '#15803d',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{currentItem.innerFileName}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: '#dcfce7',
                            color: '#166534',
                          }}
                        >
                          {currentItem.innerPageCount} {language === 'en' ? 'Pages' : 'ໜ້າ'} ({Math.ceil(currentItem.innerPageCount / 2)} ແຜ່ນ)
                        </span>

                        <button
                          type="button"
                          onClick={() => openPreview(`${currentItem.title} - Inner Content PDF`, currentItem.innerFileUrl, currentItem.innerFileName)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <Eye className="w-3 h-3" />
                          <span>{language === 'en' ? 'Preview' : 'ເບິ່ງຕົວຢ່າງ'}</span>
                        </button>

                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <span>{language === 'en' ? 'Change' : 'ປ່ຽນຟາຍ'}</span>
                          <input
                            type="file"
                            accept=".pdf"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleInnerUpload(activeItemIndex, e.target.files[0])
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: '#16a34a',
                        color: '#ffffff',
                        padding: '0.5rem 0.9rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <UploadCloud className="w-4 h-4" />
                      {uploadingSlots[`inner-${activeItemIndex}`]
                        ? (language === 'en' ? 'Counting pages...' : 'ກຳລັງກວດນັບໜ້າ...')
                        : (language === 'en' ? 'Upload Inner PDF' : 'ເລືອກຟາຍເນື້ອໃນ (Inner PDF)')}
                      <input
                        type="file"
                        accept=".pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleInnerUpload(activeItemIndex, e.target.files[0])
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Inner Spec Options: Size, Paper & Color Mode */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#14532d', marginBottom: '3px' }}>
                        {language === 'en' ? 'Book Size' : 'ຂະໜາດຮູບເລັ້ມ (Size)'}
                      </label>
                      <select
                        value={currentItem.sizeId || masterSizeId || 'a4'}
                        onChange={(e) => handleUpdateItem(activeItemIndex, { sizeId: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.6rem',
                          borderRadius: '6px',
                          border: '1px solid #86efac',
                          background: '#ffffff',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        {BOOK_SIZE_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#14532d', marginBottom: '3px' }}>
                        {language === 'en' ? 'Color Mode' : 'ລະບົບສີ (Color)'}
                      </label>
                      <select
                        value={currentItem.colorMode || 'cmyk'}
                        onChange={(e) => handleUpdateItem(activeItemIndex, { colorMode: e.target.value as any })}
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.6rem',
                          borderRadius: '6px',
                          border: '1px solid #86efac',
                          background: '#ffffff',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        <option value="cmyk">4 ສີ (CMYK Full Color)</option>
                        <option value="grayscale">ຂາວດຳ (Grayscale)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#14532d', marginBottom: '3px' }}>
                      {language === 'en' ? 'Inner Paper' : 'ເຈ້ຍເນື້ອໃນ (Inner Paper)'}
                    </label>
                    <select
                      value={currentItem.materialId || masterMaterialId || 'bond-80'}
                      onChange={(e) => handleUpdateItem(activeItemIndex, { materialId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.6rem',
                        borderRadius: '6px',
                        border: '1px solid #86efac',
                        background: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      {INNER_PAPER_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: DETAILED SPEC SUMMARY & TRANSPARENT COST BREAKDOWN */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.25rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.1rem',
              position: 'sticky',
              top: '1rem',
            }}
          >
            {/* Sidebar Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Ruler className="w-5 h-5 text-indigo-600" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
                  {language === 'en' ? 'Live Spec & Price Sidebar' : 'ສະຫຼຸບສເປັກ & ແຈກແຈງລາຄາ'}
                </h4>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: '#e0e7ff', color: '#3730a3' }}>
                {currentItem.title || `ເລື່ອງທີ ${activeItemIndex + 1}`}
              </span>
            </div>

            {/* Calculated Spine Thickness Card */}
            <div
              style={{
                padding: '0.9rem 1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                border: '1px solid #c7d2fe',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3730a3' }}>
                  {language === 'en' ? 'Spine Thickness' : 'ຄວາມໜາສັນກາວ:'}
                </span>
                <span
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 900,
                    color: '#1e1b4b',
                    background: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  {currentItem.spineThicknessMm} mm
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#4338ca', marginTop: '4px' }}>
                {spineInfo?.spineStatusText}
              </div>
            </div>

            {/* Live Spec Overview List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: '#334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>{language === 'en' ? 'Book Size:' : 'ຂະໜາດຮູບເລັ້ມ:'}</span>
                <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{(currentItem.sizeId || masterSizeId || 'a4')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>{language === 'en' ? 'Cover Card:' : 'ເຈ້ຍປົກ:'}</span>
                <span style={{ fontWeight: 700 }}>
                  {COVER_PAPER_OPTIONS.find((c) => c.id === currentItem.coverPaperId)?.label?.split(' ')[0] || 'ອາດກາດ 260g'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>{language === 'en' ? 'Cover Coating:' : 'ການເຄືອບປົກ:'}</span>
                <span style={{ fontWeight: 700 }}>
                  {COVER_LAMINATION_OPTIONS.find((f) => f.id === currentItem.finishingId)?.label?.split(' ')[0] || 'ເຄືອບເງົາ'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>{language === 'en' ? 'Inner Content:' : 'ເນື້ອໃນ:'}</span>
                <span style={{ fontWeight: 700 }}>
                  {currentItem.innerPageCount} ໜ້າ ({currentItem.colorMode === 'grayscale' ? 'ຂາວດຳ' : '4 ສີ'})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>{language === 'en' ? 'Inner Paper:' : 'ເຈ້ຍເນື້ອໃນ:'}</span>
                <span style={{ fontWeight: 700 }}>
                  {INNER_PAPER_OPTIONS.find((p) => p.id === currentItem.materialId)?.label?.split(' ')[1] || 'ປອນ 80g'}
                </span>
              </div>
            </div>

            {/* Transparent Cost Breakdown */}
            <div
              style={{
                padding: '0.85rem',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '0.78rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              <span style={{ fontWeight: 800, color: '#475569', marginBottom: '2px', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                {language === 'en' ? 'Cost Formula Breakdown' : 'ໂຄງສ້າງລາຄາຕໍ່ຫົວ'}
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>• ພິມປົກ + ເຄືອບ + ເຂົ້າເລັ້ມ:</span>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{currentPriceDetails?.coverCostThb} ฿</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>• ພິມເນື້ອໃນ ({currentItem.innerPageCount} ໜ້າ):</span>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{currentPriceDetails?.innerCostThb} ฿</span>
              </div>
            </div>

            {/* Price Preview for this title */}
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block' }}>
                  {language === 'en' ? 'Price for this Title:' : 'ລາຄາສະເພາະຫົວນີ້:'}
                </span>
                <span style={{ fontSize: '0.76rem', color: '#38bdf8', fontWeight: 600 }}>
                  ({currentItem.quantity} ຫົວ × {formatMoney(convertTo(currentItem.unitPriceThb), currency)})
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8' }}>
                  {formatMoney(convertTo(currentItem.totalPriceThb), currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Progressive Disclosure Add-on Callout (When in Single-Book Mode) */}
      {isSingleMode && (
        <div
          style={{
            marginTop: '1.25rem',
            padding: '1.1rem 1.25rem',
            borderRadius: '14px',
            border: '1.5px dashed #38bdf8',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.04) 0%, rgba(56, 189, 248, 0.1) 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BookOpen className="w-6 h-6 text-sky-600" />
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0369a1' }}>
                {language === 'en'
                  ? 'Have multiple books to print together? (Batch POD)'
                  : 'ມີປຶ້ມຫຼາຍຫົວທີ່ຕ້ອງການສັ່ງພິມພ້ອມກັນບໍ່? (Option เสริม: สั่งพิมพ์พร้อมกันหลายเล่ม)'}
              </strong>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                {language === 'en'
                  ? 'Add more book titles (e.g. Lao book, English book) to customize cover/inner specs and print them in one order.'
                  : 'ເພີ່ມລາຍການປຶ້ມຫົວອື່ນໆ ເພື່ອແຍກສເປັກປົກ/ເນື້ອໃນ ແລະ ສັ່ງພິມເຂົ້າເລັ້ມພ້ອມກັນໃນອໍເດີ້ດຽວ'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddBook}
            className="btn btn--primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.2rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              borderRadius: '8px',
            }}
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'en' ? 'Add Another Book' : 'ເພີ່ມປຶ້ມອີກຫົວ'}</span>
          </button>
        </div>
      )}

      {/* 4. Batch Grand Total Bar (When in Multi-Book Mode) */}
      {!isSingleMode && (
        <div
          style={{
            marginTop: '1.25rem',
            padding: '1rem 1.25rem',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              {language === 'en' ? 'Batch Order Summary:' : 'ສະຫຼຸບຍອດລວມທຸກຫົວ (Batch POD):'}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>
              {bookItems.length} {language === 'en' ? 'Titles' : 'ເລື່ອງ'} ·{' '}
              {bookItems.reduce((sum, b) => sum + b.quantity, 0)} {language === 'en' ? 'Copies Total' : 'ຫົວລວມ'} ·{' '}
              {bookItems.reduce((sum, b) => sum + b.innerPageCount * b.quantity, 0)}{' '}
              {language === 'en' ? 'Printed Pages' : 'ໜ້າພິມທັງໝົດ'}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {language === 'en' ? 'Grand Total (All Books)' : 'ລາຄາລວມທຸກຫົວ'}
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#38bdf8' }}>
              {formatMoney(
                convertTo(bookItems.reduce((sum, b) => sum + b.totalPriceThb, 0)),
                currency
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Document & Artwork Proof Preview Modal */}
      {previewModal?.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setPreviewModal(null)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '900px',
              height: '80vh',
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye className="w-5 h-5 text-blue-600" />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                  {previewModal.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                }}
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ flex: 1, overflow: 'hidden', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {previewModal.fileType === 'pdf' ? (
                <iframe
                  src={previewModal.fileUrl}
                  title="PDF Preview"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <img
                  src={previewModal.fileUrl}
                  alt="Cover Preview"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
